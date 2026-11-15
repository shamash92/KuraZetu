import {useState, type FormEvent, type ReactNode} from "react";
import {Link, useNavigate, useParams, useSearchParams} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {ChevronLeft} from "lucide-react";

import {
    accessApi,
    accessRequest,
    type DashboardDetail,
    type Kind,
    type Option,
    type Settings,
} from "./api";
import {SearchRecord} from "./SearchRecord";
import {PhoneInput, nationalDigits} from "./PhoneInput";
import "./access.css";

const LABELS: Record<Kind, string> = {
    aspirant: "Aspirant",
    party: "Political party",
    media: "Media",
};

function AccessShell({children}: {children: ReactNode}) {
    return (
        <div className="rd da-access">
            <div className="rd-disclaimer">Citizen tally · Not an IEBC system</div>
            <nav className="rd-nav" aria-label="Main">
                <a href="/">
                    Kura Zetu<span>.</span>
                </a>
                <Link className="da-results-button" to="/ui/dashboards/user/">
                    Results dashboard
                </Link>
            </nav>
            <main className="rd-main">{children}</main>
        </div>
    );
}

function spacedPhone(phone: string | null) {
    const digits = nationalDigits(phone ?? "");
    return digits
        ? `+254 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
        : "Not set";
}

function SettingsForm({
    kind,
    dashboard,
    onSaved,
    onCancel,
}: {
    kind: Kind;
    dashboard?: DashboardDetail;
    onSaved: (id: number) => void;
    onCancel?: () => void;
}) {
    const [target, setTarget] = useState<Option | null>(dashboard?.target ?? null);
    const [phone, setPhone] = useState(nationalDigits(dashboard?.owner_phone ?? ""));
    const [active, setActive] = useState(dashboard?.active ?? false);
    const mutation = useMutation({
        mutationFn: (body: Settings) =>
            accessRequest<{id: number}>(
                dashboard ? `${accessApi}${dashboard.id}/` : accessApi,
                {method: dashboard ? "PATCH" : "POST", body},
            ),
        onSuccess: (data) => onSaved(data.id),
    });
    function submit(event: FormEvent) {
        event.preventDefault();
        if (!target) return;
        mutation.mutate({
            kind,
            owner_phone: `+254${phone}`,
            active,
            ...(target ? {[kind === "media" ? "media_house" : kind]: target.id} : {}),
        });
    }
    return (
        <form onSubmit={submit} className="da-form">
            <SearchRecord kind={kind} selected={target} onSelect={setTarget} />
            <PhoneInput label="Owner phone number" value={phone} onChange={setPhone} />
            <label className="da-checkbox">
                <input
                    type="checkbox"
                    checked={active}
                    onChange={(event) => setActive(event.target.checked)}
                />
                Dashboard access active
            </label>
            {mutation.isError && <p role="alert">{mutation.error.message}</p>}
            <div className="da-actions">
                <button type="submit" disabled={mutation.isPending || !target}>
                    {mutation.isPending
                        ? "Saving…"
                        : dashboard
                          ? "Save settings"
                          : "Create dashboard"}
                </button>
                {onCancel && (
                    <button type="button" className="rd-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}

export function DashboardOnboarding() {
    const [params] = useSearchParams();
    const kind = params.get("kind");
    const selectedKind =
        kind === "aspirant" || kind === "party" || kind === "media" ? kind : null;
    const navigate = useNavigate();
    const access = useQuery({
        queryKey: ["dashboard-onboarding-access"],
        queryFn: ({signal}) =>
            accessRequest<{allowed: boolean}>(`${accessApi}permission/`, {signal}),
        retry: false,
        staleTime: 0,
        gcTime: 0,
    });
    return (
        <AccessShell>
            <h1>Set up dashboard access</h1>
            {access.isPending ? (
                <p role="status">Loading dashboard access…</p>
            ) : access.isError ? (
                <p role="alert">
                    {access.error.message}{" "}
                    <a href="/accounts/login/?next=/ui/dashboards/onboarding/">
                        Sign in
                    </a>{" "}
                    <button type="button" onClick={() => access.refetch()}>
                        Try again
                    </button>
                </p>
            ) : (
                <>
                    <div className="rd-choices">
                        {Object.entries(LABELS).map(([value, label]) => (
                            <Link
                                className={`rd-choice${kind === value ? " da-selected" : ""}`}
                                aria-current={kind === value ? "page" : undefined}
                                key={value}
                                to={`?kind=${value}`}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                    {selectedKind && (
                        <section className="da-card da-narrow">
                            <h2>{LABELS[selectedKind]} dashboard details</h2>
                            <SettingsForm
                                key={selectedKind}
                                kind={selectedKind}
                                onSaved={(id) =>
                                    navigate(`/ui/dashboards/${id}/access/`)
                                }
                            />
                        </section>
                    )}
                </>
            )}
        </AccessShell>
    );
}

export function DashboardAccess() {
    const {id} = useParams();
    const client = useQueryClient();
    const [phone, setPhone] = useState("");
    const [notice, setNotice] = useState("");
    const [editing, setEditing] = useState(false);
    const dashboard = useQuery({
        queryKey: ["dashboard-access-detail", id],
        queryFn: ({signal}) =>
            accessRequest<DashboardDetail>(`${accessApi}${id}/`, {signal}),
        retry: false,
        staleTime: 0,
        gcTime: 0,
    });
    const memberMutation = useMutation({
        mutationFn: ({remove, phoneNumber}: {remove?: number; phoneNumber?: string}) =>
            accessRequest<DashboardDetail>(
                `${accessApi}${id}/members/${remove ? `${remove}/` : ""}`,
                {
                    method: remove ? "DELETE" : "POST",
                    ...(remove ? {} : {body: {phone_number: `+254${phoneNumber}`}}),
                },
            ),
        onSuccess: (data, variables) => {
            client.setQueryData(["dashboard-access-detail", id], data);
            setPhone("");
            setNotice(variables.remove ? "Viewer removed." : "Viewer added.");
        },
    });
    return (
        <AccessShell>
            {dashboard.isPending ? (
                <p role="status">Loading dashboard access…</p>
            ) : dashboard.isError ? (
                <p role="alert">
                    {dashboard.error.message}{" "}
                    <button onClick={() => dashboard.refetch()}>Try again</button>
                </p>
            ) : (
                <>
                    {dashboard.data.can_edit && (
                        <Link className="da-back" to="/ui/dashboards/onboarding/">
                            <ChevronLeft aria-hidden="true" size={18} />
                            <span>Back to onboarding</span>
                        </Link>
                    )}
                    <h1>{dashboard.data.name}</h1>
                    <p className="da-meta">
                        <span
                            className={`da-status${dashboard.data.active ? " is-active" : ""}`}
                        >
                            {dashboard.data.active ? "Active" : "Inactive"}
                        </span>
                        {LABELS[dashboard.data.kind]}
                    </p>
                    {memberMutation.isError && (
                        <p role="alert">{memberMutation.error.message}</p>
                    )}
                    {notice && <p role="status">{notice}</p>}
                    <div
                        className={`da-layout${dashboard.data.can_edit ? " has-settings" : ""}`}
                    >
                        <section className="da-card">
                            <h2>People with access</h2>
                            <form
                                className="da-add"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    setNotice("");
                                    memberMutation.mutate({phoneNumber: phone});
                                }}
                            >
                                <PhoneInput
                                    label="Add a viewer"
                                    value={phone}
                                    onChange={setPhone}
                                />
                                <button
                                    type="submit"
                                    disabled={memberMutation.isPending}
                                >
                                    {memberMutation.isPending ? "Adding…" : "Add"}
                                </button>
                            </form>
                            <p className="da-help">
                                A number can belong to one dashboard only. It gets
                                access once that person verifies it.
                            </p>
                            <ul className="da-people">
                                {dashboard.data.members.map((member) => (
                                    <li key={member.id}>
                                        <span className="da-phone">{member.phone}</span>
                                        <span>{member.owner ? "Owner" : "Viewer"}</span>
                                        <span className="da-muted">
                                            {member.status}
                                        </span>
                                        {member.owner ? (
                                            <span />
                                        ) : (
                                            <button
                                                className="rd-secondary"
                                                disabled={memberMutation.isPending}
                                                onClick={() => {
                                                    setNotice("");
                                                    memberMutation.mutate({
                                                        remove: member.id,
                                                    });
                                                }}
                                            >
                                                Remove
                                                <span className="da-sr-only">
                                                    {" "}
                                                    {member.phone}
                                                </span>
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                        {dashboard.data.can_edit && (
                            <section className="da-card">
                                <h2>Dashboard settings</h2>
                                {editing ? (
                                    <SettingsForm
                                        dashboard={dashboard.data}
                                        kind={dashboard.data.kind}
                                        onCancel={() => setEditing(false)}
                                        onSaved={() => {
                                            setEditing(false);
                                            setNotice("Dashboard settings saved.");
                                            dashboard.refetch();
                                        }}
                                    />
                                ) : (
                                    <>
                                        <dl className="da-summary">
                                            <div>
                                                <dt>{LABELS[dashboard.data.kind]}</dt>
                                                <dd>{dashboard.data.target?.label}</dd>
                                            </div>
                                            <div>
                                                <dt>Owner</dt>
                                                <dd className="da-phone">
                                                    {spacedPhone(
                                                        dashboard.data.owner_phone,
                                                    )}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt>Access</dt>
                                                <dd>
                                                    {dashboard.data.active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </dd>
                                            </div>
                                        </dl>
                                        <button
                                            type="button"
                                            className="rd-secondary"
                                            onClick={() => {
                                                setNotice("");
                                                setEditing(true);
                                            }}
                                        >
                                            Edit settings
                                        </button>
                                    </>
                                )}
                            </section>
                        )}
                    </div>
                </>
            )}
        </AccessShell>
    );
}
