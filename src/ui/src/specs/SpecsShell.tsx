import type {ReactNode} from "react";
import {Link} from "react-router-dom";

import "../landing-pages/landing.css";
import "./specs.css";

export function SpecsShell({children}: {children: ReactNode}) {
    return (
        <div className="kz-specs">
            <header className="bar">
                <a className="brand" href="/">
                    Kura Zetu
                </a>
                <Link to="/ui/specs/">Specifications</Link>
            </header>
            <main>{children}</main>
        </div>
    );
}

export const RESTRICTED_NOTICE =
    "Restricted. This specification is available only to named accounts.";
