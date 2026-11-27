import * as React from "react";
import {Slot} from "@radix-ui/react-slot";
import {cva, type VariantProps} from "class-variance-authority";

import {cn} from "../lib/utils";

const badgeVariants = cva(
    "inline-flex items-center justify-center rounded-full border border-[var(--rule-16)] px-3 py-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive transition-[color,background-color] overflow-clip",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-[var(--paper-deep)] [a&]:active:bg-[var(--paper-deep)]",
                secondary:
                    "border-transparent bg-card text-secondary-foreground [a&]:hover:bg-secondary [a&]:active:bg-secondary",
                destructive:
                    "border-transparent bg-[var(--coral)] text-[var(--coral-ink)]",
                outline:
                    "text-foreground [a&]:hover:bg-accent [a&]:active:bg-accent",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

function Badge({
    className,
    variant,
    asChild = false,
    ...props
}: React.ComponentProps<"span"> &
    VariantProps<typeof badgeVariants> & {asChild?: boolean}) {
    const Comp = asChild ? Slot : "span";

    return (
        <Comp
            data-slot="badge"
            className={cn(badgeVariants({variant}), className)}
            {...props}
        />
    );
}

export {Badge, badgeVariants};
