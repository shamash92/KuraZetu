// ============================================================
// Perk design tokens — shared visual language for the app.
// Mirrors claude-design/src/perk.css (:root custom properties). Keep in sync.
// ============================================================

// Accent palette
export const LIME = "#c4ff5e";
export const LIME_DEEP = "#a8e63a";
export const LIME_INK = "#0a0a0a";

export const GREEN = "#16a35a";
export const GREEN_DEEP = "#0f7a40";
export const MINT = "#d8f5dc";
export const MINT_2 = "#b9eac1";

export const CORAL = "#ffd0c0";
export const CORAL_DEEP = "#a8442a";
export const RED = "#c44539";

export const PERIWINKLE = "#c8d4ff";
export const PERIWINKLE_DEEP = "#2532a8";

export const COPPER = "#c97b3e";
export const COPPER_DEEP = "#8a4a25";
export const COPPER_SOFT = "#e9d4b8";

// Surfaces
export const PAPER = "#f7f6f3";
export const PAPER_DEEP = "#efeeea";
export const PAPER_VIVID = "#e9e8e2";
export const CARD = "#ffffff";
export const SURFACE = "#f1f0eb";

// Ink / text
export const INK = "#0d0d0d";
export const INK_SOFT = "#1a1a1a";
export const MUTE = "#6b6d72";
export const MUTE_2 = "#9a9da3";

// Rules / hairlines
export const RULE_08 = "rgba(13,13,13,0.07)";
export const RULE_16 = "rgba(13,13,13,0.14)";
export const GLASS = "rgba(255,255,255,0.88)";

// Grouped object for ergonomic access: perk.lime, perk.ink, etc.
export const perk = {
    // accents
    lime: LIME,
    limeDeep: LIME_DEEP,
    limeInk: LIME_INK,
    green: GREEN,
    greenDeep: GREEN_DEEP,
    mint: MINT,
    mint2: MINT_2,
    coral: CORAL,
    coralDeep: CORAL_DEEP,
    red: RED,
    periwinkle: PERIWINKLE,
    periwinkleDeep: PERIWINKLE_DEEP,
    copper: COPPER,
    copperDeep: COPPER_DEEP,
    copperSoft: COPPER_SOFT,
    // surfaces
    paper: PAPER,
    paperDeep: PAPER_DEEP,
    paperVivid: PAPER_VIVID,
    card: CARD,
    surface: SURFACE,
    // ink
    ink: INK,
    inkSoft: INK_SOFT,
    mute: MUTE,
    mute2: MUTE_2,
    // rules
    rule08: RULE_08,
    rule16: RULE_16,
    glass: GLASS,
} as const;

export default function PerkColorsRoute() {
    return null;
}
