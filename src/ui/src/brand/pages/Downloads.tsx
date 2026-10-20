import React from "react";

import {Download} from "lucide-react";
import {BrandPage} from "../BrandPage";

const DOWNLOADS = [
    {label: "Mark", file: "mark.svg"},
    {label: "Mark, inverse", file: "mark-inverse.svg"},
    {label: "Mark, compact", file: "mark-compact.svg"},
    {label: "Lockup", file: "lockup.svg"},
    {label: "Lockup, inverse", file: "lockup-inverse.svg"},
    {label: "App icon", file: "icon.png"},
    {label: "Favicon", file: "favicon.ico"},
] as const;

export default function DownloadsPage() {
    return (
        <BrandPage title="Downloads">
            <div className="kz-brand-downloads">
                {DOWNLOADS.map(({label, file}) => (
                    <a
                        key={file}
                        className="kz-brand-download"
                        href={`/static/images/logo/${file}`}
                        download
                    >
                        {label}
                        <Download size={18} aria-hidden="true" />
                    </a>
                ))}
            </div>
        </BrandPage>
    );
}
