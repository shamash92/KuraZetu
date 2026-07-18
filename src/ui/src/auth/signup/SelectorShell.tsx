import {ArrowLeft, ArrowRight} from "lucide-react";

import React from "react";

export type SelectorVariant = "county" | "constituency" | "ward" | "polling";

export interface SelectorItem {
    id: string | number;
    label: string;
}

interface SelectorShellProps {
    /** Accent word in the heading, e.g. "County", "Polling Center". */
    accentWord: string;
    variant: SelectorVariant;
    /** 1-based position in the 4-step geo ladder, for the progress bar. */
    step: 1 | 2 | 3 | 4;
    items: SelectorItem[];
    activeId: string | number | null;
    /** First click on a row — highlights it (and pans the map). */
    onPick: (id: string | number) => void;
    /** Confirm the highlighted row via the Select pill. */
    onSelect: (id: string | number) => void;
    /** Back to the previous step. Omit to hide the button. */
    onBack?: () => void;
    /** Map column — a <BoundaryMap> with this step's layers. */
    map: React.ReactNode;
}

export default function SelectorShell({
    accentWord,
    variant,
    step,
    items,
    activeId,
    onPick,
    onSelect,
    onBack,
    map,
}: SelectorShellProps) {
    const isPoll = variant === "polling";

    return (
        <div className="geo">
            <div className="geo-list">
                <div className="geo-head">
                    <h2>
                        Select your home <span className="what">{accentWord}</span>
                    </h2>
                    {onBack && (
                        <button type="button" className="geo-back" onClick={onBack}>
                            <ArrowLeft />
                            Back
                        </button>
                    )}
                </div>

                <div className="geo-progress">
                    {[1, 2, 3, 4].map((segment) => (
                        <span
                            key={segment}
                            className={
                                segment < step
                                    ? "done"
                                    : segment === step
                                      ? "now"
                                      : undefined
                            }
                        />
                    ))}
                </div>

                <div className="geo-scroll">
                    {items.map((item) => {
                        const isActive = activeId === item.id;
                        return (
                            <div
                                key={item.id}
                                role="button"
                                tabIndex={0}
                                className={`geo-item${isPoll ? " is-poll" : ""}${
                                    isActive ? " selected" : ""
                                }`}
                                onClick={() => onPick(item.id)}
                            >
                                <span className="name">{item.label}</span>
                                <button
                                    type="button"
                                    className="geo-select"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onSelect(item.id);
                                    }}
                                >
                                    Select <ArrowRight />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {map}
        </div>
    );
}
