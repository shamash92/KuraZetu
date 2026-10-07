import {ArrowLeft} from "lucide-react";
import type {ReactNode} from "react";
import {Link, useLocation} from "react-router-dom";

import {LandingNav} from "../../landing-pages";
import "../../landing-pages/landing.css";

import "./specs.css";
import {useAuthor} from "./useAuthor";

/** The author's way in: shown only to an account that can write. */
export function AuthorLinks({editSlug}: {editSlug?: string}) {
    const {isAuthor} = useAuthor();

    // The page for writing a new one does not need a button that leads to it.
    const isWriting = useLocation().pathname === "/ui/specs/author/";

    if (!isAuthor) return null;

    return (
        <span className="author-links">
            {editSlug && (
                <Link className="kz-button" to={`/ui/specs/author/${editSlug}/`}>
                    Edit this specification
                </Link>
            )}
            {!isWriting && (
                <Link className="kz-button kz-button-ink" to="/ui/specs/author/">
                    Write
                </Link>
            )}
        </span>
    );
}

export function SpecsShell({
    children,
    wide = false,
    editSlug,
}: {
    children: ReactNode;
    /** The editor needs room for source and preview side by side. */
    wide?: boolean;
    /** The specification on screen, which an author can go and edit. */
    editSlug?: string;
}) {
    // The library puts the author's links beside its own heading.
    const isLibrary = useLocation().pathname === "/ui/specs/";

    return (
        <>
            <LandingNav current="specs" />
            <div className="kz-specs">
                <main className={wide ? "wide" : undefined}>
                    {!isLibrary && (
                        <div className="crumbs">
                            <Link className="kz-button" to="/ui/specs/">
                                <ArrowLeft size={14} aria-hidden="true" />
                                Back to specs
                            </Link>
                            <AuthorLinks editSlug={editSlug} />
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </>
    );
}

export function NotFound() {
    return (
        <div className="empty">
            <p className="eyebrow">404</p>
            <h1>This page doesn’t exist.</h1>
            <p>Check the address, or browse the library.</p>
            <Link className="kz-button" to="/ui/specs/">
                All specifications
            </Link>
        </div>
    );
}
