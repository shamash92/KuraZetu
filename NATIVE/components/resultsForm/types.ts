import type {AgreementCheck, Reading} from "./reading/prefill";
import type {DeviceFix} from "./upload/deviceFix";
import type {LocationCheckData} from "./upload/locationCheck";

export interface ResultsFormCandidate {
    key: string;
    name: string;
    party?: string | null;
}

export interface ResultsFormSubmission {
    image: string;
    /** False when the photograph was taken with Capture anyway. */
    qualityChecked: boolean;
    votes: Record<string, number>;
    rejectedVotes: number;
    disputedVotes: number;
    total: number;
    /** The most accurate fix seen while the screen was open, if any. */
    fix: DeviceFix | null;
    /** When the photo was taken, by the device clock. */
    capturedAt: string | null;
    /** The photo's reading on the server; the upload uses its photo. */
    checkId: string | null;
}

/** An agreement, once the server found the photo matches. */
export interface ResultsFormAgreement {
    image: string;
    qualityChecked: boolean;
    fix: DeviceFix | null;
    capturedAt: string | null;
    checkId: string;
}

/** The station's centre and ward, for checking where the phone is. */
export interface ResultsFormPlace {
    check: LocationCheckData;
    centreName: string;
    wardName: string | null;
}

/** Where the photo's reading is, when the photo is read before entry. */
export type ReadingStep =
    /** checkId is null while the photo is being sent. */
    | {
          kind: "reading";
          checkId: string | null;
          /** The checks as the server first answered, before polling. */
          checks: AgreementCheck[] | null;
      }
    | {kind: "retake"; message: string}
    | {
          kind: "read";
          checkId: string | null;
          instruction: string | null;
          /** The boxes hold the reading's figures. */
          prefilled: boolean;
          unread: string[];
          /** The earlier upload whose results the photo shows, if any. */
          sameAs: string | null;
          /**
           * The photo shows an earlier upload's sheet with figures that look
           * written over since, until the person continues. `markedPhoto`
           * has an arrow at each.
           */
          formChanged: {markedPhoto: string | null} | null;
      }
    /** Made to agree with an earlier upload. */
    | {
          kind: "agreement";
          checkId: string | null;
          agrees: boolean;
          message: string;
          /** The full reading, for the boxes if the person disagrees. */
          reading: Reading | null;
          checks: AgreementCheck[] | null;
          /** The photo with an arrow at each difference, when there are any. */
          markedPhoto: string | null;
      };
