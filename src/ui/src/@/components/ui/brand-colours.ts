export type BrandColour = {
    name: string;
    meaning: string;
    hex: string;
    rgb: string;
    cmyk: string;
    pantone: string;
    bordered?: boolean;
};

export const BRAND_COLOURS: ReadonlyArray<BrandColour> = [
    {
        name: "Ink",
        meaning: "Text, figures and the bars of the mark.",
        hex: "0D0D0D",
        rgb: "13 / 13 / 13",
        cmyk: "60 / 40 / 40 / 100",
        pantone: "Black 6 C",
    },
    {
        name: "Paper",
        meaning: "Backgrounds. Use this off-white, not pure white.",
        hex: "F7F6F3",
        rgb: "247 / 246 / 243",
        cmyk: "0 / 0 / 2 / 3",
        pantone: "≈ 11-0602 TCX",
        bordered: true,
    },
    {
        name: "Lime",
        meaning: "The strike in the mark, and the main button on a screen.",
        hex: "C4FF5E",
        rgb: "196 / 255 / 94",
        cmyk: "23 / 0 / 63 / 0",
        pantone: "≈ 374 C",
    },
    {
        name: "Red",
        meaning: "The full stop in the wordmark only.",
        hex: "C44539",
        rgb: "196 / 69 / 57",
        cmyk: "0 / 65 / 71 / 23",
        pantone: "≈ 7626 C",
    },
];
