import {File} from "expo-file-system";
import {ImageManipulator, SaveFormat} from "expo-image-manipulator";

/** The largest photo the server accepts. */
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

// Lower JPEG quality step by step; the pixel count never changes.
const QUALITIES = [0.9, 0.8, 0.7, 0.6];

/**
 * A photo that fits the server's limit: the same file when it already fits,
 * otherwise a re-saved copy. Returns the last copy if none fits, and the
 * server then refuses it with a reason.
 */
export async function fitPhoto(uri: string): Promise<string> {
    if (sizeOf(uri) <= MAX_PHOTO_BYTES) return uri;

    const image = await ImageManipulator.manipulate(uri).renderAsync();
    let fitted = uri;
    for (const compress of QUALITIES) {
        const saved = await image.saveAsync({compress, format: SaveFormat.JPEG});
        if (fitted !== uri) new File(fitted).delete();
        fitted = saved.uri;
        if (sizeOf(fitted) <= MAX_PHOTO_BYTES) break;
    }
    return fitted;
}

function sizeOf(uri: string): number {
    return new File(uri).size ?? 0;
}
