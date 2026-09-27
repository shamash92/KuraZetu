/**
 * Document edge detection for the Form 34A camera, via OpenCV.
 *
 * This answers a question the luma metrics cannot: is the *whole* form in
 * frame? Brightness, sharpness and glare all describe how legible the image
 * is, so a crisp close-up of one corner scores perfectly while being useless.
 *
 * Runs on the JS thread rather than in the frame-processor worklet, because
 * react-native-fast-opencv installs its JSI bindings into the main runtime
 * only — they are not reachable from a worklet runtime. The caller therefore
 * hands over a small grayscale copy (see `extractLumaThumbnail`) at the same
 * throttled rate the quality metrics use.
 */

import {
    ContourApproximationModes,
    MorphShapes,
    MorphTypes,
    Mat,
    OpenCV,
    PointVector,
    PointVectorOfVectors,
    RetrievalModes,
    Size,
} from "react-native-fast-opencv";

import {LumaThumbnail} from "./frameQuality";

export interface DetectedDocument {
    /** How much of the frame the largest qualifying shape covers, 0..1. */
    areaFraction: number;
    /**
     * Width divided by height of the shape's bounding box, in pixels.
     *
     * The discriminator between a form and the other rectangles in a room.
     * A Form 34A is A4 portrait (~0.71); laptop screens, monitors and desks
     * are landscape (>1.2), and without this the detector happily counts a
     * screen as a document.
     */
    aspectRatio: number;
    /**
     * Bounding box of that shape as shares of the thumbnail's width and
     * height, in the buffer's own orientation (`rotated` is not undone), or
     * null when nothing large enough was found.
     */
    bounds: {x: number; y: number; width: number; height: number} | null;
    /**
     * The shape's four corners, in the same units and orientation as
     * `bounds`, when asked for with `withCorners`; otherwise null. Unordered.
     */
    corners: {x: number; y: number}[] | null;
    /** Largest contour found at all, ignoring the minimum-area threshold. */
    largestAreaFraction: number;
    /** Diagnostics: total contours, and the corner count of the largest. */
    contourCount: number;
    bestPointCount: number;
}

/** Ignore contours smaller than this share of the frame — noise, not paper. */
const MIN_AREA_FRACTION = 0.05;

/**
 * How aggressively a contour is simplified, as a share of its perimeter.
 *
 * Keep this small. For a rectangle of side `s` the perimeter is `4s`, so 0.1
 * would permit corners to move by `0.4s` — nearly half a side — which
 * flattens the shape well past four corners. 0.02 is the usual value for
 * document detection.
 */
const APPROX_EPSILON_RATIO = 0.02;

/** Copy a point vector out to JavaScript, releasing each native point. */
function readPoints(vector: PointVector) {
    const points: {x: number; y: number}[] = [];
    for (let index = 0; index < vector.length; index++) {
        const point = vector.get(index);
        try {
            points.push({x: point.x, y: point.y});
        } finally {
            point.release();
        }
    }
    return points;
}

/**
 * The four corners of a page outline, as shares of the frame.
 *
 * A clean outline simplifies to exactly four points. A ragged one — pages
 * underneath in a binder, a curled corner, a hand over an edge — does not, so
 * the corners are taken as the outline's extremes instead: top-left has the
 * smallest x + y, bottom-right the largest, top-right the smallest y − x and
 * bottom-left the largest. That holds for pages rotated up to 45°.
 */
function findCorners(contour: PointVector, width: number, height: number) {
    const simplified = PointVector.create();
    try {
        OpenCV.approxPolyDP(
            contour,
            simplified,
            APPROX_EPSILON_RATIO * OpenCV.arcLength(contour, true).value,
            true,
        );
        let corners = readPoints(simplified);
        if (corners.length !== 4) {
            const points = readPoints(contour);
            const extreme = (score: (point: {x: number; y: number}) => number) => {
                let best = points[0];
                for (const point of points) {
                    if (score(point) < score(best)) best = point;
                }
                return best;
            };
            corners = [
                extreme((point) => point.x + point.y),
                extreme((point) => point.y - point.x),
                extreme((point) => -(point.x + point.y)),
                extreme((point) => -(point.y - point.x)),
            ];
        }
        return corners.map((point) => ({x: point.x / width, y: point.y / height}));
    } finally {
        simplified.release();
    }
}

/**
 * Find the largest document-like shape in a grayscale frame.
 *
 * Returns a result with `areaFraction: 0` when nothing large enough is found,
 * and null only when the pipeline itself failed — the caller needs to be able
 * to tell "no form in view" apart from "detection is broken".
 */
export function detectDocument(
    thumbnail: LumaThumbnail,
    {withCorners = false}: {withCorners?: boolean} = {},
): DetectedDocument | null {
    const {data, width, height, rotated} = thumbnail;

    // OpenCV objects hold native memory and are not garbage collected, so
    // everything created here is tracked and released before returning.
    const disposables: {release(): void}[] = [];
    const track = <T extends {release(): void}>(object: T): T => {
        disposables.push(object);
        return object;
    };

    try {
        // Version 1 of react-native-fast-opencv copies the JavaScript buffer
        // into an owned Mat, so the processing pipeline can safely run in
        // place without allocating a second full-size working Mat.
        const source = track(Mat.createFromBuffer("uint8", height, width, 1, data));

        // Light blur only. Heavier smoothing (or morphology before Canny)
        // erases the paper boundary at this resolution, which is what left the
        // edge fragmented into dozens of near-zero-area pieces.
        OpenCV.GaussianBlur(source, source, track(Size.create(5, 5)), 0);
        OpenCV.Canny(source, source, 50, 150);

        // Canny leaves the boundary as a broken line, and `contourArea` of a
        // broken line is ~0 because it encloses nothing. Dilating welds the
        // fragments into one closed loop that does enclose the page.
        const kernel = track(
            OpenCV.getStructuringElement(
                MorphShapes.MORPH_RECT,
                track(Size.create(3, 3)),
            ),
        );
        // morphologyEx rather than dilate(): this binding's dilate() requires
        // all seven OpenCV arguments, and MORPH_DILATE is the same operation.
        OpenCV.morphologyEx(source, source, MorphTypes.MORPH_DILATE, kernel);
        OpenCV.morphologyEx(source, source, MorphTypes.MORPH_CLOSE, kernel);

        const contours = track(PointVectorOfVectors.create());
        // RETR_EXTERNAL keeps only outermost contours — a page is by
        // definition the outer boundary, and this drops every line of printed
        // text inside it.
        OpenCV.findContours(
            source,
            contours,
            RetrievalModes.RETR_EXTERNAL,
            ContourApproximationModes.CHAIN_APPROX_SIMPLE,
        );

        const frameArea = width * height;
        const minArea = frameArea * MIN_AREA_FRACTION;

        let bestArea = 0;
        let bestPointCount = 0;
        let bestAspectRatio = 0;
        let bestBounds: DetectedDocument["bounds"] = null;
        let bestIndex = -1;
        let largestArea = 0;

        for (let index = 0; index < contours.length; index++) {
            // `get()` copies this contour into its own native PointVector. It
            // is not owned by the parent vector, so release it deterministically
            // instead of retaining one native copy per contour until JS GC.
            const contour = contours.get(index);
            try {
                const area = OpenCV.contourArea(contour, false).value;

                // Tracked separately from `bestArea` so a contour that just missed
                // the threshold is visible in the logs, rather than looking
                // identical to finding nothing at all.
                if (area > largestArea) largestArea = area;

                if (area < minArea || area <= bestArea) continue;

                const perimeter = OpenCV.arcLength(contour, true).value;
                const approximated = PointVector.create();
                try {
                    OpenCV.approxPolyDP(
                        contour,
                        approximated,
                        APPROX_EPSILON_RATIO * perimeter,
                        true,
                    );

                    // OpenCV already exposes the bounding-box operation. Using
                    // it avoids allocating one native Point wrapper per corner
                    // merely to find the min/max coordinates in JavaScript.
                    const bounds = OpenCV.boundingRect(approximated);
                    try {
                        bestArea = area;
                        bestIndex = index;
                        bestPointCount = approximated.length;
                        const bufferRatio =
                            bounds.height > 0 ? bounds.width / bounds.height : 0;
                        bestAspectRatio =
                            rotated && bufferRatio > 0
                                ? 1 / bufferRatio
                                : bufferRatio;
                        bestBounds = {
                            x: bounds.x / width,
                            y: bounds.y / height,
                            width: bounds.width / width,
                            height: bounds.height / height,
                        };
                    } finally {
                        bounds.release();
                    }
                } finally {
                    approximated.release();
                }
            } finally {
                contour.release();
            }
        }

        // Off by default: the live preview only needs the box, and reading
        // points out allocates a native Point for each one.
        let corners: DetectedDocument["corners"] = null;
        if (withCorners && bestIndex >= 0) {
            const contour = contours.get(bestIndex);
            try {
                corners = findCorners(contour, width, height);
            } finally {
                contour.release();
            }
        }

        return {
            areaFraction: bestArea / frameArea,
            aspectRatio: bestAspectRatio,
            bounds: bestBounds,
            corners,
            largestAreaFraction: largestArea / frameArea,
            contourCount: contours.length,
            bestPointCount,
        };
    } catch (error) {
        // A detection failure must never take the camera down with it, but it
        // must not look like "no document" either — that reads as a tuning
        // problem when it is actually a broken pipeline.
        console.warn("[form34a] detection failed", error);
        return null;
    } finally {
        // Reverse order: objects are created parent-first, and releasing a
        // parent before the things derived from it invites a use-after-free.
        for (let index = disposables.length - 1; index >= 0; index--) {
            try {
                disposables[index].release();
            } catch {
                // Already released, or never allocated.
            }
        }
    }
}
