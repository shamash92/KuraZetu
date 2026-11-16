import type {NavbarItem} from "@/src/@/components/ui/navbar";

export type NavSection = "pinverify" | "specs" | "brand";

export function siteNavigationItems(current?: NavSection): ReadonlyArray<NavbarItem> {
    return [
        {label: "pinVerify254", href: "/ui/game/", current: current === "pinverify"},
        {label: "Docs", href: "https://kurazetu.readthedocs.io/", external: true},
        {label: "Blog", href: "/blog/"},
        {label: "Brand", href: "/ui/brand/", current: current === "brand"},
        {label: "Developers", current: current === "specs", items: [
            {label: "Specs", href: "/ui/specs/", current: current === "specs"},
            {label: "API", href: "/api/schema/rapidoc/"},
            {label: "Contribute", href: "https://github.com/shamash92/KuraZetu.git", external: true},
        ]},
    ];
}
