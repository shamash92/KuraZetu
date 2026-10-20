import React from "react";

/** One guidelines page: its headline, then its content. */
export function BrandPage({title, children}: {title: string; children: React.ReactNode}) {
    return (
        <section className="kz-brand-section" aria-labelledby="kz-brand-page-title">
            <h1 id="kz-brand-page-title">{title}</h1>
            {children}
        </section>
    );
}

/** One part of a longer page: its heading, then its content. */
export function BrandSubsection({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="kz-brand-section" aria-labelledby={id}>
            <h2 id={id}>{title}</h2>
            {children}
        </section>
    );
}
