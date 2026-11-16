import cookie from "react-cookies";

export type Kind = "aspirant" | "party" | "media";
export type Option = {id: number; label: string};
export type DashboardSummary = {id: number; name: string; kind: Kind; active: boolean};
export type DashboardDetail = DashboardSummary & {
    can_edit: boolean;
    owner_phone: string | null;
    target: Option | null;
    members: Array<{id: number; phone: string; owner: boolean; status: string}>;
};
export type Settings = {kind: Kind; aspirant?: number; party?: number; media_house?: number; owner_phone: string; active: boolean};
export const accessApi = "/api/results/dashboard-access/";

function errorMessage(data: unknown): string {
    if (typeof data === "object" && data !== null) {
        const messages = Object.entries(data).flatMap(([field, value]) => {
            const text = Array.isArray(value) ? value.join(" ") : String(value);
            return field === "detail" || field === "__all__" ? text : `${field.replaceAll("_", " ")}: ${text}`;
        });
        if (messages.length) return messages.join(" ");
    }
    return "The request could not be completed. Try again.";
}

export async function accessRequest<T>(url: string, {signal, method = "GET", body}: {signal?: AbortSignal; method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown} = {}): Promise<T> {
    const response = await fetch(url, {
        method, signal, credentials: "same-origin", cache: "no-store",
        headers: {Accept: "application/json", ...(body ? {"Content-Type": "application/json"} : {}), ...(method !== "GET" ? {"X-CSRFToken": cookie.load("csrftoken") ?? ""} : {})},
        ...(body ? {body: JSON.stringify(body)} : {}),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(errorMessage(data));
    return data;
}
