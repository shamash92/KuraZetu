/**
 * Camera time after which a reading that has not come back is abandoned.
 *
 * Only one reading runs at a time. The camera worklet marks it in flight and
 * the React Native side clears the mark when it finishes; the two run on
 * different threads, and a missed clear used to stop measuring for good.
 * A reading takes 1 to 2 ms on an iPhone 12. Two seconds leaves a slow phone
 * room to finish; a late result is still applied, so a slow phone updates
 * less often but never stops.
 */
const READING_TIMEOUT_SECONDS = 2;

/** Whether the reading in flight since `startedSeconds` should be given up. */
export function isReadingOverdue(startedSeconds: number, nowSeconds: number) {
    "worklet";
    return (
        nowSeconds < startedSeconds ||
        nowSeconds - startedSeconds >= READING_TIMEOUT_SECONDS
    );
}
