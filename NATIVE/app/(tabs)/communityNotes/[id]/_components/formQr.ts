/**
 * Reading the QR code printed on a captured Form 34A.
 *
 * The code is read from the photo itself, not the live preview, so the QR and
 * the tally always come from the same frame.
 *
 * ML Kit shrinks every image it scans to its own working size, so on a whole
 * page the QR ends up too small to read however large the photo is. The QR is
 * looked for where the form's layout puts it first, and only then by a
 * sliding window over the whole photo.
 */

import {Images, type Image} from "react-native-nitro-image";
import type {BarcodeScanner} from "react-native-vision-camera-barcode-scanner";

import {detectDocument} from "./documentDetection";
import type {LumaThumbnail} from "./frameQuality";

/**
 * Long side of the copy the QR is read from, whatever resolution the camera
 * delivered. The QR is ~9.5% of page width, so once the framing gate has the
 * page filling a third of the frame, this still gives it about 100 px. Smaller
 * photos are used as they are, never enlarged. The photo is decoded in full
 * once on load; the copy keeps every crop and scan after that small.
 */
const SCAN_LONG_SIDE = 2400;

/** Width of the copy the page is found in; the live preview uses the same. */
const PAGE_DETECTION_WIDTH = 240;

/** Below this share of the photo, a detected outline is not trusted as the page. */
const MIN_PAGE_AREA = 0.2;

/**
 * Short side over long side an outline must have to be trusted as one A4
 * page, in either orientation. A4 is 0.71; framed photos of printed forms
 * measured 0.72–0.76, perspective widening the box a little. Squares and
 * strips — a binder, a notice board, a page merged with its surroundings —
 * fall back to the sliding window instead of steering the crop.
 */
const A4_SHAPE = {min: 0.55, max: 0.9};

/**
 * Where the QR sits on an upright Form 34A, as shares of page width and height:
 * the right-hand end of the grey header band. The margins absorb an outline
 * that is a little loose or tight, and some page curl.
 */
const QR_ON_PAGE = {left: 0.55, top: -0.05, right: 1.05, bottom: 0.2};

/** Crops smaller than this cannot hold a readable QR. */
const MIN_CROP_SIDE = 32;

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Point {
    x: number;
    y: number;
}

/**
 * The page's corners in stored pixels, in stored-image terms: top-left,
 * top-right, bottom-right, bottom-left. Following the real corners rather
 * than a straight box keeps the QR in the crop when the form is rotated or
 * photographed at an angle, which is the usual case on walls, tables and
 * in binders.
 */
type Quad = [Point, Point, Point, Point];

/**
 * How the stored pixels must be turned to stand the page upright.
 *
 * Cameras store the sensor's layout plus an orientation flag. iPhones store a
 * portrait photo as `clockwise`; Android varies by device.
 */
type PageTurn = "upright" | "upsideDown" | "clockwise" | "anticlockwise";

export interface FormQrReading {
    value: string | null;
    /** Which search found it, for debugging: a page turn or a window. */
    source: string;
}

/**
 * Order four unordered corners as top-left, top-right, bottom-right,
 * bottom-left: top-left has the smallest x + y and bottom-right the largest;
 * top-right has the smallest y − x and bottom-left the largest. Holds for
 * pages rotated up to 45°.
 */
function orderCorners(points: Point[]): Quad {
    const bySum = [...points].sort((a, b) => a.x + a.y - (b.x + b.y));
    const byDifference = [...points].sort((a, b) => a.y - a.x - (b.y - b.x));
    return [bySum[0], byDifference[0], bySum[3], byDifference[3]];
}

function distance(a: Point, b: Point) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Mean width and height of the page along its own edges, in stored terms. */
function pageSize([topLeft, topRight, bottomRight, bottomLeft]: Quad) {
    return {
        width:
            (distance(topLeft, topRight) + distance(bottomLeft, bottomRight)) / 2,
        height:
            (distance(topLeft, bottomLeft) + distance(topRight, bottomRight)) / 2,
    };
}

/**
 * A point given as shares of the stored page's width and height, placed in
 * stored pixels by blending the four corners.
 */
function onPage(
    [topLeft, topRight, bottomRight, bottomLeft]: Quad,
    u: number,
    v: number,
): Point {
    const blend = (a: number, b: number, c: number, d: number) =>
        (1 - u) * (1 - v) * a + u * (1 - v) * b + u * v * c + (1 - u) * v * d;
    return {
        x: blend(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x),
        y: blend(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y),
    };
}

/**
 * An upright-page position, re-expressed in the stored page's own axes.
 * `clockwise` storage, for example, puts the upright top-right corner at the
 * stored top-left.
 */
function toStoredPage(turn: PageTurn, u: number, v: number): [number, number] {
    switch (turn) {
        case "upright":
            return [u, v];
        case "upsideDown":
            return [1 - u, 1 - v];
        case "clockwise":
            return [v, 1 - u];
        case "anticlockwise":
            return [1 - v, u];
    }
}

/**
 * The box around the QR's region in stored pixels, for a page stored at the
 * given turn.
 */
function qrRegion(page: Quad, turn: PageTurn): Rect {
    const {left, top, right, bottom} = QR_ON_PAGE;
    const corners = [
        [left, top],
        [right, top],
        [right, bottom],
        [left, bottom],
    ].map(([u, v]) => onPage(page, ...toStoredPage(turn, u, v)));
    const xs = corners.map((corner) => corner.x);
    const ys = corners.map((corner) => corner.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return {x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y};
}

/**
 * Turns to try, most likely first. A portrait A4 page stored sideways
 * looks landscape, which narrows it to the two quarter turns.
 */
function likelyTurns(page: Quad): PageTurn[] {
    const {width, height} = pageSize(page);
    return width <= height
        ? ["upright", "upsideDown"]
        : ["clockwise", "anticlockwise"];
}

/**
 * Half-size windows stepped a quarter of the photo at a time. Neighbours
 * overlap by half, so a QR that straddles one window's edge lies wholly
 * inside the next.
 */
function slidingWindows(width: number, height: number): Rect[] {
    const windowWidth = width / 2;
    const windowHeight = height / 2;
    const windows: Rect[] = [];
    for (const row of [0, 1, 2]) {
        for (const column of [2, 1, 0]) {
            windows.push({
                x: (column * width) / 4,
                y: (row * height) / 4,
                width: windowWidth,
                height: windowHeight,
            });
        }
    }
    return windows;
}

/** Load the photo as a bounded copy whose size and crop coordinates agree. */
async function loadScanCopy(filePath: string): Promise<Image> {
    const photo = await Images.loadFromFileAsync(filePath);
    try {
        // Redrawing applies the orientation flag on iOS, where nitro-image
        // otherwise reports the upright size but crops the stored pixels.
        const scale = Math.min(
            1,
            SCAN_LONG_SIDE / Math.max(photo.width, photo.height),
        );
        return await photo.resizeAsync(
            Math.round(photo.width * scale),
            Math.round(photo.height * scale),
        );
    } finally {
        photo.dispose();
    }
}

type RawPixels = Awaited<ReturnType<Image["toRawPixelDataAsync"]>>;

/** Grey copy of raw pixels, averaging the colour channels in any byte order. */
function toLuma({buffer, width, height, pixelFormat}: RawPixels): LumaThumbnail {
    const bytes = new Uint8Array(buffer);
    const channels = pixelFormat === "RGB" || pixelFormat === "BGR" ? 3 : 4;
    // Alpha or padding leads in ARGB-style formats and trails in RGBA-style ones.
    const firstColour =
        pixelFormat.startsWith("A") || pixelFormat.startsWith("X") ? 1 : 0;
    const rowStride = bytes.length / height;
    const data = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * rowStride + x * channels + firstColour;
            data[y * width + x] =
                (bytes[index] + bytes[index + 1] + bytes[index + 2]) / 3;
        }
    }

    return {data, width, height, rotated: false};
}

/** The page's outline in the copy's pixels, or null when it cannot be trusted. */
async function findPage(image: Image): Promise<Quad | null> {
    const small = await image.resizeAsync(
        PAGE_DETECTION_WIDTH,
        Math.round((image.height * PAGE_DETECTION_WIDTH) / image.width),
    );
    try {
        const document = detectDocument(
            toLuma(await small.toRawPixelDataAsync()),
            {withCorners: true},
        );
        if (!document?.bounds || document.areaFraction < MIN_PAGE_AREA) {
            return null;
        }

        // Without four clean corners (a curled or occluded page), the
        // straight box is the best outline there is.
        const {x, y, width, height} = document.bounds;
        const corners = document.corners ?? [
            {x, y},
            {x: x + width, y},
            {x: x + width, y: y + height},
            {x, y: y + height},
        ];
        const page = orderCorners(
            corners.map((corner) => ({
                x: corner.x * image.width,
                y: corner.y * image.height,
            })),
        );

        // Measured along the page's own edges, so rotation does not skew it.
        const size = pageSize(page);
        const shape =
            Math.min(size.width, size.height) / Math.max(size.width, size.height);
        return shape >= A4_SHAPE.min && shape <= A4_SHAPE.max ? page : null;
    } finally {
        small.dispose();
    }
}

async function scanRegion(
    scanner: BarcodeScanner,
    image: Image,
    region: Rect,
): Promise<string | null> {
    const startX = Math.max(0, Math.floor(region.x));
    const startY = Math.max(0, Math.floor(region.y));
    const endX = Math.min(image.width, Math.ceil(region.x + region.width));
    const endY = Math.min(image.height, Math.ceil(region.y + region.height));
    if (endX - startX < MIN_CROP_SIDE || endY - startY < MIN_CROP_SIDE) {
        return null;
    }

    const crop = await image.cropAsync(startX, startY, endX, endY);
    try {
        const codes = await scanner.scanCodesInImageAsync(crop);
        return codes.find((code) => code.rawValue)?.rawValue ?? null;
    } finally {
        crop.dispose();
    }
}

/**
 * Read the Form 34A QR from a captured photo: first at the page's top-right
 * for each likely orientation, then by sliding window.
 */
export async function readFormQr(
    scanner: BarcodeScanner,
    filePath: string,
): Promise<FormQrReading> {
    const image = await loadScanCopy(filePath);
    try {
        const page = await findPage(image);
        const searches: [string, Rect][] = page
            ? likelyTurns(page).map((turn) => [`page ${turn}`, qrRegion(page, turn)])
            : [];
        slidingWindows(image.width, image.height).forEach((window, index) =>
            searches.push([`window ${index + 1}/9`, window]),
        );

        for (const [source, region] of searches) {
            const value = await scanRegion(scanner, image, region);
            if (value) return {value, source};
        }
        return {value: null, source: page ? "page and windows" : "windows only"};
    } finally {
        image.dispose();
    }
}
