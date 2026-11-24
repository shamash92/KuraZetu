import * as React from "react";

import {cn} from "../lib/utils";

/** Multi-line counterpart of Input, with the same border, fill, and focus ring. */
function Textarea({className, ...props}: React.ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                "placeholder:text-[var(--mute-2)] selection:bg-primary selection:text-primary-foreground border-input flex min-h-28 w-full min-w-0 resize-y rounded-[14px] border-[1.5px] bg-card px-3.5 py-3.5 text-base font-medium leading-relaxed transition-colors focus-visible:outline-[3px] focus-visible:outline-offset-[-1.5px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
                className,
            )}
            {...props}
        />
    );
}

export {Textarea};
