/**
 * On-device capture-quality metrics for the Form 34A camera.
 *
 * These run inside a VisionCamera frame-processor worklet on the camera
 * thread, so they must stay cheap: the whole function is a single strided
 * pass over the luma plane, never a full-resolution scan.
 */

export interface FrameQuality {
    /** Mean luma, 0-255. Low means the form will be too dark to read. */
    brightness: number;
    /** Variance of the Laplacian. Low means out of focus / motion blurred. */
    sharpness: number;
    /** Fraction of blown-out pixels, 0-1. High means glare over the paper. */
    glare: number;
}

/** Sample every Nth pixel and row; also the Laplacian neighbour distance. */
const STEP = 4;

/** Luma at or above this counts as blown out. */
const BLOWN_OUT = 245;

/**
 * Fraction of the frame trimmed from each edge before measuring.
 *
 * The citizen frames the form inside the on-screen bracket, so the outer band
 * is desk, hands and floor. Judging the whole frame would let a dark room fail
 * a well-lit form, or a bright desk mask a dark one.
 */
const EDGE_INSET = 0.2;

/** A small, tightly-packed grayscale copy of a frame. */
export interface LumaThumbnail {
    data: Uint8Array;
    width: number;
    height: number;
    /**
     * Whether the buffer is rotated 90° from what the citizen sees.
     *
     * Frames stream in the camera hardware's native orientation, so a portrait
     * page held in a portrait phone arrives with its width and height swapped.
     * Anything reasoning about shape has to undo that or it measures a
     * portrait form as landscape.
     */
    rotated: boolean;
}

/**
 * Copy the luma plane into a small, stride-free buffer.
 *
 * Three things make this necessary rather than passing the plane along:
 * the frame's memory is freed the moment it is disposed, the plane is padded
 * to a hardware stride that OpenCV would misread as image content, and the
 * full-size buffer is far larger than edge detection needs.
 */
export function extractLumaThumbnail(
    bytes: Uint8Array,
    width: number,
    height: number,
    bytesPerRow: number,
    targetWidth: number,
    rotated: boolean,
): LumaThumbnail {
    "worklet";

    // Ceil, not floor: flooring 480/300 gives 1, i.e. no downsampling at all,
    // and the full-size buffer then has to be copied and serialised across the
    // worklet boundary every reading — enough to stall the camera pipeline.
    const step = Math.max(1, Math.ceil(width / targetWidth));
    const outWidth = Math.floor(width / step);
    const outHeight = Math.floor(height / step);
    const out = new Uint8Array(outWidth * outHeight);

    for (let y = 0; y < outHeight; y++) {
        const sourceRow = y * step * bytesPerRow;
        const targetRow = y * outWidth;
        for (let x = 0; x < outWidth; x++) {
            out[targetRow + x] = bytes[sourceRow + x * step];
        }
    }

    return {data: out, width: outWidth, height: outHeight, rotated};
}

/**
 * Weight given to the newest reading when smoothing.
 *
 * Raw per-frame readings jitter constantly, because the camera is always
 * re-metering and re-focusing. Feeding that straight to the UI makes the
 * banner flip between states several times a second, and makes auto-capture
 * trip on noise rather than on a genuinely settled frame.
 */
const SMOOTHING = 0.3;

/** Blend a new reading into the running average. */
export function smoothQuality(
    previous: FrameQuality | null,
    next: FrameQuality,
): FrameQuality {
    if (!previous) return next;
    const blend = (before: number, after: number) =>
        before * (1 - SMOOTHING) + after * SMOOTHING;
    return {
        brightness: blend(previous.brightness, next.brightness),
        sharpness: blend(previous.sharpness, next.sharpness),
        glare: blend(previous.glare, next.glare),
    };
}

/** How good one measurement is, for colouring the framing bracket. */
export type Grade = "bad" | "fair" | "good";

export interface QualityAssessment {
    brightness: Grade;
    sharpness: Grade;
    glare: Grade;
    /** Plain-language state of the worst metric, e.g. "Too dark". */
    label: string;
    /** One thing the citizen should do, or null when the frame is usable. */
    hint: string | null;
    /** True when every metric is at least `fair`. */
    ok: boolean;
}

/**
 * Cutoffs for grading a measurement.
 *
 * PROVISIONAL. These were read off a Form 34A displayed on a laptop screen,
 * which is emissive, perfectly flat, and carries screen texture that inflates
 * `sharpness`. They must be re-measured against a printed form under ordinary
 * indoor light before this gate is trusted in the field.
 */
const THRESHOLDS = {
    /** Below `dark` the page is unreadable; above `blown` it is washed out. */
    brightnessDark: 60,
    brightnessDim: 90,
    brightnessBright: 205,
    brightnessBlown: 240,
    /** Laplacian variance. Strided, so not comparable to OpenCV's ~100. */
    sharpnessBad: 500,
    sharpnessFair: 1500,
    /** Fraction of blown-out pixels. */
    glareFair: 0.02,
    glareBad: 0.05,
};

/**
 * Turn raw metrics into grades plus a single instruction.
 *
 * Only one hint is surfaced at a time, worst first: someone holding a phone
 * over a form can act on "Move to better light", not on three simultaneous
 * complaints. Lighting is reported before focus because a dark or glared frame
 * cannot be rescued by holding steadier.
 */
export function assessQuality(quality: FrameQuality): QualityAssessment {
    const {brightness, sharpness, glare} = quality;

    let brightnessGrade: Grade = "good";
    let brightnessLabel = "Well lit";
    let brightnessHint: string | null = null;
    if (brightness < THRESHOLDS.brightnessDark) {
        brightnessGrade = "bad";
        brightnessLabel = "Too dark";
        brightnessHint = "Move to better light";
    } else if (brightness < THRESHOLDS.brightnessDim) {
        brightnessGrade = "fair";
        brightnessLabel = "Dim";
        brightnessHint = "A little more light would help";
    } else if (brightness > THRESHOLDS.brightnessBlown) {
        brightnessGrade = "bad";
        brightnessLabel = "Washed out";
        brightnessHint = "Too bright — move out of direct light";
    } else if (brightness > THRESHOLDS.brightnessBright) {
        brightnessGrade = "fair";
        brightnessLabel = "Bright";
        brightnessHint = null;
    }

    let glareGrade: Grade = "good";
    let glareLabel = "No glare";
    let glareHint: string | null = null;
    if (glare > THRESHOLDS.glareBad) {
        glareGrade = "bad";
        glareLabel = "Heavy glare";
        glareHint = "Tilt the form away from the light";
    } else if (glare > THRESHOLDS.glareFair) {
        glareGrade = "fair";
        glareLabel = "Some glare";
        glareHint = "Slight glare — try tilting the form";
    }

    let sharpnessGrade: Grade = "good";
    let sharpnessLabel = "Sharp";
    let sharpnessHint: string | null = null;
    if (sharpness < THRESHOLDS.sharpnessBad) {
        sharpnessGrade = "bad";
        sharpnessLabel = "Blurry";
        sharpnessHint = "Hold steady and let it focus";
    } else if (sharpness < THRESHOLDS.sharpnessFair) {
        sharpnessGrade = "fair";
        sharpnessLabel = "Soft";
        sharpnessHint = "Hold steady";
    }

    // Worst-first, and lighting before focus.
    const ranked = [
        {grade: brightnessGrade, label: brightnessLabel, hint: brightnessHint},
        {grade: glareGrade, label: glareLabel, hint: glareHint},
        {grade: sharpnessGrade, label: sharpnessLabel, hint: sharpnessHint},
    ];
    const worst =
        ranked.find((entry) => entry.grade === "bad") ??
        ranked.find((entry) => entry.grade === "fair");

    return {
        brightness: brightnessGrade,
        sharpness: sharpnessGrade,
        glare: glareGrade,
        label: worst ? worst.label : "Looks good",
        hint: worst ? worst.hint : null,
        ok: !ranked.some((entry) => entry.grade === "bad"),
    };
}

/**
 * Compute quality metrics from a YUV frame's luma (Y) plane.
 *
 * Indexing uses `bytesPerRow` rather than `width` because the plane is
 * commonly padded to a hardware-friendly stride.
 */
export function analyseLumaPlane(
    bytes: Uint8Array,
    width: number,
    height: number,
    bytesPerRow: number,
): FrameQuality {
    "worklet";

    let lumaSum = 0;
    let blownCount = 0;
    let sampleCount = 0;
    let lapSum = 0;
    let lapSquareSum = 0;

    // Measure only the middle of the frame, but never sample outside the
    // buffer: the Laplacian reads one STEP beyond the pixel in every direction.
    const insetX = Math.max(STEP, Math.floor(width * EDGE_INSET));
    const insetY = Math.max(STEP, Math.floor(height * EDGE_INSET));

    for (let y = insetY; y < height - insetY; y += STEP) {
        const row = y * bytesPerRow;
        for (let x = insetX; x < width - insetX; x += STEP) {
            const centre = bytes[row + x];

            lumaSum += centre;
            if (centre >= BLOWN_OUT) blownCount++;

            // Discrete Laplacian over the strided neighbourhood.
            const laplacian =
                4 * centre -
                bytes[row + x - STEP] -
                bytes[row + x + STEP] -
                bytes[row - STEP * bytesPerRow + x] -
                bytes[row + STEP * bytesPerRow + x];
            lapSum += laplacian;
            lapSquareSum += laplacian * laplacian;

            sampleCount++;
        }
    }

    if (sampleCount === 0) {
        return {brightness: 0, sharpness: 0, glare: 0};
    }

    const lapMean = lapSum / sampleCount;
    return {
        brightness: lumaSum / sampleCount,
        sharpness: lapSquareSum / sampleCount - lapMean * lapMean,
        glare: blownCount / sampleCount,
    };
}
