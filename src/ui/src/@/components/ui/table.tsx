import React from "react";
import {cn} from "@/src/@/components/lib/utils";
import "./table.css";
export function Table({className, containerClassName, ...props}: React.ComponentProps<"table"> & {containerClassName?: string}) {return <div role="region" aria-label={props["aria-label"] ?? "Data table"} tabIndex={0} className={cn("kz-table-scroll", containerClassName)}><table className={cn("kz-table", className)} {...props} /></div>;}
export function TableHeader(props: React.ComponentProps<"thead">) {return <thead {...props} />;}
export function TableBody(props: React.ComponentProps<"tbody">) {return <tbody {...props} />;}
export function TableFooter(props: React.ComponentProps<"tfoot">) {return <tfoot {...props} />;}
export function TableRow({selected, className, ...props}: React.ComponentProps<"tr"> & {selected?: boolean}) {return <tr aria-selected={selected} data-selected={selected || undefined} className={cn("kz-table-row", className)} {...props} />;}
export function TableHead(props: React.ComponentProps<"th">) {return <th scope="col" {...props} />;}
export function TableCell(props: React.ComponentProps<"td">) {return <td {...props} />;}
export function TableCaption(props: React.ComponentProps<"caption">) {return <caption {...props} />;}
