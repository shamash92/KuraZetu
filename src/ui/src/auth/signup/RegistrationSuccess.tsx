import "../../landing-pages/landing.css";
import "./auth.css";
import "../../landing-pages/perk-mesh";

import {ArrowRight, Check} from "lucide-react";
import {useEffect} from "react";

declare global {
    interface Window {
        initPerkMesh?: (patches: unknown[], layerId?: string) => void;
    }
}

const MESH_LAYER_ID = "kzDoneMesh";

// Pattern A from claude-design/patterns.html, as four corner patches rather
// than one centred one. A patch is densest at its anchor and fades outward,
// so anchoring one per corner leaves the middle of the page empty for the
// copy — the reverse of what a single centred patch does.
//
// The design set draws this at s: 88 as fine texture. These cells are ~3.5x
// that: a few large hexes reading as scenery, not a weave.
// A patch's visible reach is roughly `size/2 - overhang + 0.55 * size`, since
// its radial fade dies out around 55%. At 1100 that reached far enough for the
// top and bottom patches to meet in the middle, which is the overlap. 640 keeps
// each one in its own corner.
const PATCH_SIZE = 640;

/** How far a patch is pulled off-screen, so its dense centre lands on the corner. */
const OVERHANG = PATCH_SIZE * 0.2;

// ~2.3x the design set's s: 88. Large enough to read as a few hexes, small
// enough that a corner-sized patch still shows three across.
const CELL = 200;

function cornerPatch(x: number, y: number) {
    return {
        x,
        y,
        w: PATCH_SIZE,
        h: PATCH_SIZE,
        s: CELL,
        jitter: 48,
        alpha: 0.18,
        fade: "radial",
        anchor: [0.5, 0.5],
        delay: 0,
        dur: 0,
        animate: "load",
    };
}

/**
 * A full-bleed patch under the copy, so the middle of the page is not bare.
 *
 * `perk-mesh.js` derives patch opacity as `alpha / 0.16`, so anything at or
 * above 0.16 paints at full strength. 0.06 lands around 38%: faint lines that
 * read as texture, which the blur over the centre then softens further.
 */
function centrePatch(w: number, h: number) {
    return {
        x: 0,
        y: 0,
        w,
        h,
        s: CELL,
        jitter: 48,
        alpha: 0.06,
        fade: "radial",
        anchor: [0.5, 0.5],
        delay: 0,
        dur: 0,
        animate: "load",
    };
}

export default function RegistrationSuccessPage() {
    useEffect(() => {
        const layer = document.getElementById(MESH_LAYER_ID);
        if (!layer || !window.initPerkMesh) return;

        // Patches are placed in pixels, so the two right-hand corners need the
        // layer's real width. Measured once on mount; a resize leaves the mesh
        // where it was, which is scenery, not layout.
        const {width, height} = layer.getBoundingClientRect();
        const far = PATCH_SIZE - OVERHANG;

        window.initPerkMesh(
            [
                centrePatch(width, height),
                cornerPatch(-OVERHANG, -OVERHANG),
                cornerPatch(width - far, -OVERHANG),
                cornerPatch(-OVERHANG, height - far),
                cornerPatch(width - far, height - far),
            ],
            MESH_LAYER_ID,
        );
    }, []);

    return (
        <div className="kz-auth">
            <div className="done-screen">
                <div className="mesh-layer" id={MESH_LAYER_ID} aria-hidden="true" />

                <div className="done-pop">
                    <Check strokeWidth={3} />
                </div>

                <h2>You&rsquo;re in.</h2>

                <p className="sub">
                    Your account is ready. You can now follow results from your
                    polling centre and help verify them.
                </p>

                <a className="next" href="/">
                    Get started
                    <ArrowRight />
                </a>
            </div>
        </div>
    );
}
