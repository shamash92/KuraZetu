import "../landing-pages/landing.css";
import "./brand.css";

import React, {useEffect} from "react";
import {Link, Navigate, NavLink, Outlet, useLocation, useParams} from "react-router-dom";

import {LandingFooter, LandingNav} from "../landing-pages";
import {PAGE_GROUPS, PAGES} from "./registry";

const BASE = "/ui/brand";

/** Renders the guidelines page named in the URL. */
export function BrandSection() {
    const {section} = useParams();
    const page = PAGES.find(({slug}) => slug === section);

    if (!page) return <Navigate to={`${BASE}/${PAGES[0].slug}/`} replace />;

    return <page.Component />;
}

export function BrandIndex() {
    return <Navigate to={`${BASE}/${PAGES[0].slug}/`} replace />;
}

function Pager({current}: {current: number}) {
    const previous = PAGES[current - 1];
    const next = PAGES[current + 1];

    return (
        <nav className="kz-brand-pager" aria-label="Previous and next page">
            {previous ? (
                <Link to={`${BASE}/${previous.slug}/`}>← {previous.label}</Link>
            ) : (
                <span />
            )}
            {next && <Link to={`${BASE}/${next.slug}/`}>{next.label} →</Link>}
        </nav>
    );
}

/** Site nav, the guidelines menu, the current page and links to its neighbours. */
export default function BrandLayout() {
    const {pathname} = useLocation();
    const current = PAGES.findIndex(({slug}) => pathname.startsWith(`${BASE}/${slug}/`));

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <main className="kz-landing kz-brand">
            <div className="kz-paper-bg" aria-hidden="true" />
            <LandingNav current="brand" />

            <div className="kz-brand-layout">
                <nav className="kz-brand-toc" aria-label="Brand guidelines">
                    {PAGE_GROUPS.map((group) => (
                        <div key={group[0].slug} className="kz-brand-toc-group">
                            {group.map(({slug, label}) => (
                                <NavLink key={slug} to={`${BASE}/${slug}/`}>
                                    {label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="kz-brand-sections">
                    <Outlet />
                    {current >= 0 && <Pager current={current} />}
                </div>
            </div>

            <LandingFooter />
        </main>
    );
}
