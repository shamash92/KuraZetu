import {useMutation} from "@tanstack/react-query";
import {useState} from "react";
import {useNavigate} from "react-router-dom";

import {createSpecification} from "../shared/authorApi";
import {NotFound, SpecsShell} from "../shared/SpecsShell";
import {useAuthor} from "../shared/useAuthor";

export function NewSpecification() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");

    const author = useAuthor();
    const create = useMutation({
        mutationFn: () => createSpecification(title),
        onSuccess: (created) => navigate(`/ui/specs/author/${created.slug}/`),
    });

    // Nothing is offered until the account is known to be an author.
    if (!author.isKnown) return <SpecsShell>{null}</SpecsShell>;
    if (!author.isAuthor) {
        return (
            <SpecsShell>
                <NotFound />
            </SpecsShell>
        );
    }

    return (
        <SpecsShell>
            {/* A blank sheet from the library: the title is written straight
                onto it. */}
            <form
                className="blank"
                onSubmit={(event) => {
                    event.preventDefault();
                    create.mutate();
                }}
            >
                <div className="sheet-top">
                    <h1>New specification</h1>
                    <span>Draft</span>
                </div>
                <label htmlFor="new-title">Title</label>
                <textarea
                    id="new-title"
                    rows={2}
                    autoFocus
                    required
                    maxLength={200}
                    placeholder="What is it called?"
                    value={title}
                    // A title is one line, however it wraps on the sheet.
                    onChange={(event) =>
                        setTitle(event.target.value.replace(/\s*\n\s*/g, " "))
                    }
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            event.currentTarget.form?.requestSubmit();
                        }
                    }}
                />
                {create.isError && <p role="alert">{create.error.message}</p>}
                <div className="blank-foot">
                    <p>
                        Starts concealed. Only authors can see it until you change
                        its access.
                    </p>
                    <button
                        className="primary"
                        type="submit"
                        disabled={create.isPending}
                    >
                        Create draft
                    </button>
                </div>
            </form>
        </SpecsShell>
    );
}
