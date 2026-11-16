import React from "react";
import {cn} from "@/src/@/components/lib/utils";
import {Heading, Text} from "./typography";
import "./hero.css";
export function Hero({title, description, actions, media, align = "left", className, ...props}: Omit<React.ComponentProps<"section">, "title"> & {title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; media?: React.ReactNode; align?: "left" | "center"}) {
    return <section className={cn("kz-ui-hero", media && "kz-ui-hero-split", align === "center" && "kz-ui-hero-center", className)} {...props}><div className="kz-ui-hero-copy"><Heading as="h1" size="display">{title}</Heading>{description && <Text size="lede" className="kz-ui-hero-description">{description}</Text>}{actions && <div className="kz-ui-hero-actions">{actions}</div>}</div>{media && <div className="kz-ui-hero-media">{media}</div>}</section>;
}
