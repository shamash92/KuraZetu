import {useEffect, useId, useState} from "react";
import {useQuery} from "@tanstack/react-query";

import {accessApi, accessRequest, type Kind, type Option} from "./api";

export function SearchRecord({
    kind,
    selected,
    onSelect,
}: {
    kind: Kind;
    selected: Option | null;
    onSelect: (option: Option | null) => void;
}) {
    const id = useId();
    const label =
        kind === "aspirant"
            ? "Aspirant"
            : kind === "party"
              ? "Political party"
              : "Media house";
    const [text, setText] = useState(selected?.label ?? "");
    const [term, setTerm] = useState("");
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    useEffect(() => {
        const timer = window.setTimeout(() => setTerm(text.trim()), 250);
        return () => window.clearTimeout(timer);
    }, [text]);
    const choices = useQuery({
        queryKey: ["dashboard-record-options", kind, term],
        queryFn: ({signal}) =>
            accessRequest<{options: Array<Option>; has_more: boolean}>(
                `${accessApi}options/?${new URLSearchParams({kind, q: term})}`,
                {signal},
            ),
        enabled: open && !selected && term.length >= 2,
        staleTime: 60_000,
        retry: false,
    });
    const options = choices.data?.options ?? [];
    function choose(option: Option) {
        onSelect(option);
        setText(option.label);
        setOpen(false);
        setActive(-1);
    }
    return (
        <div className="da-search">
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                role="combobox"
                aria-expanded={open && !selected && term.length >= 2}
                aria-controls={`${id}-options`}
                aria-autocomplete="list"
                aria-activedescendant={
                    active >= 0 && options[active]
                        ? `${id}-option-${active}`
                        : undefined
                }
                placeholder={`${label} name`}
                autoComplete="off"
                value={text}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onChange={(event) => {
                    setText(event.target.value);
                    onSelect(null);
                    setOpen(true);
                    setActive(-1);
                }}
                onKeyDown={(event) => {
                    if (event.key === "Escape") {
                        setOpen(false);
                        setActive(-1);
                    }
                    if (event.key === "ArrowDown" && options.length) {
                        event.preventDefault();
                        setOpen(true);
                        setActive((current) => (current + 1) % options.length);
                    }
                    if (event.key === "ArrowUp" && options.length) {
                        event.preventDefault();
                        setOpen(true);
                        setActive((current) =>
                            current <= 0 ? options.length - 1 : current - 1,
                        );
                    }
                    if (
                        event.key === "Enter" &&
                        open &&
                        active >= 0 &&
                        options[active]
                    ) {
                        event.preventDefault();
                        choose(options[active]);
                    }
                }}
            />
            {open && !selected && text.trim().length >= 2 && (
                <div className="da-options-panel">
                    {text.trim() !== term || choices.isFetching ? (
                        <p role="status">Searching…</p>
                    ) : choices.isError ? (
                        <p role="alert">
                            {choices.error.message}{" "}
                            <button
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => choices.refetch()}
                            >
                                Retry search
                            </button>
                        </p>
                    ) : (
                        <>
                            <ul
                                role="listbox"
                                id={`${id}-options`}
                                aria-label={
                                    kind === "aspirant"
                                        ? "Matching aspirants"
                                        : "Matching parties"
                                }
                            >
                                {options.map((option, index) => (
                                    <li
                                        key={option.id}
                                        id={`${id}-option-${index}`}
                                        role="option"
                                        aria-selected={active === index}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => choose(option)}
                                    >
                                        {option.label}
                                    </li>
                                ))}
                            </ul>
                            {!options.length && <p>No matches found.</p>}
                            {choices.data?.has_more && (
                                <p>
                                    Showing 25 matches. Refine your search to find the
                                    right record.
                                </p>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
