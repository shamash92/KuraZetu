import React from "react";

import AgentsPage from "./pages/Agents";
import CapsPage from "./pages/Caps";
import ColourPage from "./pages/Colour";
import DownloadsPage from "./pages/Downloads";
import LogoPage from "./pages/Logo";
import PatternsPage from "./pages/Patterns";
import PostsPage from "./pages/Posts";
import SchemesPage from "./pages/Schemes";
import ScreensPage from "./pages/Screens";
import SlidesPage from "./pages/Slides";
import TypePage from "./pages/Type";
import VolunteersPage from "./pages/Volunteers";

export type BrandPageEntry = {
    slug: string;
    label: string;
    Component: () => React.ReactElement;
};

/** The side menu, in groups; each entry is served at `/ui/brand/<slug>/`. */
export const PAGE_GROUPS: ReadonlyArray<ReadonlyArray<BrandPageEntry>> = [
    [{slug: "logo", label: "Logo", Component: LogoPage}],
    [
        {slug: "colour", label: "Colour", Component: ColourPage},
        {slug: "schemes", label: "Schemes", Component: SchemesPage},
        {slug: "type", label: "Type", Component: TypePage},
        {slug: "patterns", label: "Patterns", Component: PatternsPage},
    ],
    [
        {slug: "screens", label: "Screens", Component: ScreensPage},
        {slug: "posts", label: "Posts", Component: PostsPage},
        {slug: "slides", label: "Slides", Component: SlidesPage},
    ],
    [
        {slug: "volunteers", label: "Volunteers", Component: VolunteersPage},
        {slug: "agents", label: "Agents", Component: AgentsPage},
        {slug: "caps", label: "Caps", Component: CapsPage},
    ],
    [{slug: "downloads", label: "Downloads", Component: DownloadsPage}],
];

export const PAGES: ReadonlyArray<BrandPageEntry> = PAGE_GROUPS.flat();
