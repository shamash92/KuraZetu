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
    DataTypes,
    MorphShapes,
    MorphTypes,
    OpenCV,
    PointVector,
    PointVectorOfVectors,
    RetrievalModes,
    Size,
    Mat,
} from "react-native-fast-opencv";

import {LumaThumbnail} from "./frameQuality";

export interface DetectedDocument {
    /**
     * Four corners in 0..1 frame coordinates, or null when the largest shape
     * did not simplify to a quadrilateral.
     *
     * Coverage does not depend on this. Answering "is the whole form in view"
     * only needs the size of the largest shape, whereas corners are needed for
     * deskew — so requiring four of them here would reject usable frames for
     * the benefit of a feature that does not exist yet.
     */
    corners: {x: number; y: number}[] | null;
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

/**
 * Find the largest document-like shape in a grayscale frame.
 *
 * Returns a result with `areaFraction: 0` when nothing large enough is found,
 * and null only when the pipeline itself failed — the caller needs to be able
 * to tell "no form in view" apart from "detection is broken".
 */
export function detectDocument(thumbnail: LumaThumbnail): DetectedDocument | null {
    const {data, width, height, rotated} = thumbnail;

    // OpenCV objects hold native memory and are not garbage collected, so
    // everything created here is tracked and released before returning.
    const disposables: {release(): void}[] = [];
    const track = <T extends {release(): void}>(object: T): T => {
        disposables.push(object);
        return object;
    };

    try {
        // `createFromBuffer` wraps the JavaScript buffer rather than copying
        // it, so the Mat points at memory OpenCV does not own. Filtering in
        // place through that wrapper writes back into it and lets OpenCV
        // reallocate underneath us. Everything after the first operation
        // therefore runs in `work`, which OpenCV owns outright.
        const source = track(Mat.createFromBuffer("uint8", height, width, 1, data));
        const work = track(Mat.create(height, width, DataTypes.CV_8U));

        // Light blur only. Heavier smoothing (or morphology before Canny)
        // erases the paper boundary at this resolution, which is what left the
        // edge fragmented into dozens of near-zero-area pieces.
        OpenCV.GaussianBlur(source, work, track(Size.create(5, 5)), 0);
        OpenCV.Canny(work, work, 50, 150);

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
        OpenCV.morphologyEx(work, work, MorphTypes.MORPH_DILATE, kernel);
        OpenCV.morphologyEx(work, work, MorphTypes.MORPH_CLOSE, kernel);

        const contours = track(PointVectorOfVectors.create());
        // RETR_EXTERNAL keeps only outermost contours — a page is by
        // definition the outer boundary, and this drops every line of printed
        // text inside it.
        OpenCV.findContours(
            work,
            contours,
            RetrievalModes.RETR_EXTERNAL,
            ContourApproximationModes.CHAIN_APPROX_SIMPLE,
        );

        const frameArea = width * height;
        const minArea = frameArea * MIN_AREA_FRACTION;

        let bestCorners: {x: number; y: number}[] | null = null;
        let bestArea = 0;
        let bestPointCount = 0;
        let bestAspectRatio = 0;
        let largestArea = 0;

        for (let index = 0; index < contours.length; index++) {
            // Deliberately not tracked for release. `get()` hands back a child
            // owned by `contours`, so releasing it here and again when the
            // parent is released is a double free — a native crash, and one
            // that only shows up after the camera has been running a while.
            const contour = contours.get(index);
            const area = OpenCV.contourArea(contour, false).value;

            // Tracked separately from `bestArea` so a contour that just missed
            // the threshold is visible in the logs, rather than looking
            // identical to finding nothing at all.
            if (area > largestArea) largestArea = area;

            if (area < minArea || area <= bestArea) continue;

            const perimeter = OpenCV.arcLength(contour, true).value;
            const approximated = track(PointVector.create());
            OpenCV.approxPolyDP(
                contour,
                approximated,
                APPROX_EPSILON_RATIO * perimeter,
                true,
            );

            // The largest shape wins regardless of its corner count; four
            // corners only upgrades it to something deskew could use.
            // getAll() hands back native Point objects. Read them into plain
            // numbers straight away and release them: a handful leaked per
            // frame, six times a second, is what eventually exhausts memory.
            const nativePoints = approximated.getAll();
            const points = nativePoints.map((point) => ({
                x: point.x,
                y: point.y,
            }));
            for (const point of nativePoints) {
                try {
                    point.release();
                } catch {
                    // Owned elsewhere, or already gone.
                }
            }

            const xs = points.map((point) => point.x);
            const ys = points.map((point) => point.y);
            const boxWidth = Math.max(...xs) - Math.min(...xs);
            const boxHeight = Math.max(...ys) - Math.min(...ys);

            bestArea = area;
            bestPointCount = approximated.length;
            // Reported in display space, not buffer space. A portrait page in
            // a portrait phone arrives rotated 90°, so measuring the buffer
            // directly makes an A4 form look landscape and fails the shape
            // check that is meant to reject landscape things.
            const bufferRatio = boxHeight > 0 ? boxWidth / boxHeight : 0;
            bestAspectRatio =
                rotated && bufferRatio > 0 ? 1 / bufferRatio : bufferRatio;
            bestCorners =
                points.length === 4
                    ? points.map((point) => ({
                          x: point.x / width,
                          y: point.y / height,
                      }))
                    : null;
        }

        return {
            corners: bestCorners,
            areaFraction: bestArea / frameArea,
            aspectRatio: bestAspectRatio,
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
        for (const object of disposables) {
            try {
                object.release();
            } catch {
                // Already released, or never allocated.
            }
        }
    }
}
