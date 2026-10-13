import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    Check,
    ChevronDown,
    CircleDollarSign,
    Eye,
    EyeOff,
    Landmark,
    Mail,
    MessageSquare,
    RefreshCcw,
    Save,
    ShieldCheck,
    Ship,
    Smartphone,
    Webhook,
    type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/components/router-link";
import { AppShell, StatusBadge } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type Environment = "sandbox" | "production";
type FieldKind = "text" | "password" | "email" | "url" | "number";

type IntegrationField = {
    key: string;
    label: string;
    placeholder: string;
    kind: FieldKind;
    required?: boolean;
    secret?: boolean;
    configured?: boolean;
    value?: string;
};

type Integration = {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: LucideIcon;
    enabled: boolean;
    environment: Environment;
    fields: IntegrationField[];
};

type IntegrationConfig = {
    integrations: Integration[];
    credentials: Record<string, string>;
};

const iconRegistry: Record<string, LucideIcon> = {
    ShieldCheck,
    Ship,
    CircleDollarSign,
    Landmark,
    Mail,
    Smartphone,
    MessageSquare,
    Webhook,
};

const emptyConfig: IntegrationConfig = {
    integrations: [],
    credentials: {},
};

const normaliseField = (raw: any): IntegrationField => ({
    key: raw?.key ?? "",
    label: raw?.label ?? raw?.name ?? "",
    placeholder: raw?.placeholder ?? "",
    kind: (raw?.kind ?? "text") as FieldKind,
    required: Boolean(raw?.required ?? false),
    secret: Boolean(raw?.secret ?? raw?.kind === "password"),
    configured: Boolean(raw?.configured ?? false),
    value: String(raw?.value ?? ""),
});

const normaliseIntegration = (raw: any): Integration => ({
    id: String(raw?.id ?? raw?.key ?? crypto.randomUUID()),
    name: raw?.name ?? "",
    description: raw?.description ?? raw?.desc ?? "",
    category: raw?.category ?? "",
    icon: iconRegistry[raw?.icon ?? raw?.icon_name ?? "Webhook"] ?? Webhook,
    enabled: Boolean(raw?.enabled ?? false),
    environment: (raw?.environment ?? "sandbox") as Environment,
    fields: Array.isArray(raw?.fields)
        ? raw.fields.map(normaliseField)
        : [],
});

function Toggle({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
                checked ? "bg-orange" : "bg-sand-2"
            )}
        >
            <span
                className={cn(
                    "size-5 rounded-full bg-white shadow-sm transition-transform",
                    checked ? "translate-x-5" : "translate-x-0.5"
                )}
            />
        </button>
    );
}

export default function AdminIntegrationsConfigurationPage() {
    const [config, setConfig] = useState<IntegrationConfig>(emptyConfig);
    const [dirty, setDirty] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState<string[]>([]);
    const [revealed, setRevealed] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    const fetchAll = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await http.get("/admin/config/integrations/");
            const resp: Resp = res.data;

            if (resp.error) {
                setError(
                    resp.data || "Could not load integrations configuration."
                );
                return;
            }

            const payload: any = resp.code ?? {};
            const rawIntegrations: any[] = Array.isArray(payload.integrations)
                ? payload.integrations
                : [];

            const integrations = rawIntegrations.map(normaliseIntegration);

            const credentials: Record<string, string> = {};

            integrations.forEach((integration) => {
                integration.fields.forEach((field) => {
                    credentials[`${integration.id}.${field.key}`] = field.value ?? "";
                });
            });

            const loaded: IntegrationConfig = {
                integrations,
                credentials,
            };

            setConfig(loaded);
            setDirty(false);
            setRevealed(new Set());
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    "Could not load integrations configuration."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchAll();
    }, []);

    const markDirty = () => setDirty(true);

    const updateIntegration = (id: string, patch: Partial<Integration>) => {
        setConfig((current) => ({
            ...current,
            integrations: current.integrations.map((integration) =>
                integration.id === id
                    ? { ...integration, ...patch }
                    : integration
            ),
        }));

        markDirty();
    };

    const updateCredential = (key: string, value: string) => {
        setConfig((current) => ({
            ...current,
            credentials: { ...current.credentials, [key]: value },
        }));

        markDirty();
    };

    const toggleExpanded = (id: string) => {
        setExpanded((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        );
    };

    const toggleReveal = (key: string) => {
        setRevealed((current) => {
            const next = new Set(current);

            if (next.has(key)) next.delete(key);
            else next.add(key);

            return next;
        });
    };

    const validate = () => true;

    const handleSave = async () => {
        if (!dirty || saving) return;
        if (!validate()) return;

        setSaving(true);

        try {
            const formData = new URLSearchParams();

            formData.set(
                "integrations",
                JSON.stringify(
                    config.integrations.map((integration) => ({
                        id: integration.id,
                        enabled: integration.enabled,
                        environment: integration.environment,
                    }))
                )
            );

            formData.set("credentials", JSON.stringify(config.credentials));

            const res = await http.post(
                "/admin/config/integrations/update/",
                formData,
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );

            const resp: Resp = res.data;

            if (resp.error) {
                toast.error(
                    resp.data || "Could not save the integrations configuration."
                );
                return;
            }

            toast.success("Integrations configuration saved. Change logged.");
            await fetchAll();
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message ||
                    "Could not save the integrations configuration."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = async () => {
        setRevealed(new Set());
        await fetchAll();
        toast.message("Changes discarded.");
    };

    const categories = useMemo(
        () => [
            "All",
            ...Array.from(
                new Set(config.integrations.map((item) => item.category))
            ),
        ],
        [config.integrations]
    );

    const filteredIntegrations = useMemo(() => {
        const query = search.trim().toLowerCase();

        return config.integrations.filter((integration) => {
            const matchesCategory =
                category === "All" || integration.category === category;

            const matchesSearch =
                !query ||
                integration.name.toLowerCase().includes(query) ||
                integration.description.toLowerCase().includes(query) ||
                integration.category.toLowerCase().includes(query);

            return matchesCategory && matchesSearch;
        });
    }, [config.integrations, category, search]);

    const enabledCount = config.integrations.filter(
        (integration) => integration.enabled
    ).length;

    if (loading) {
        return (
            <AppShell
                title="Integrations"
                eyebrow="Administration · Configuration"
            >
                <div className="flex items-center justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
                    <span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
                </div>
            </AppShell>
        );
    }

    if (error) {
        return (
            <AppShell
                title="Integrations"
                eyebrow="Administration · Configuration"
            >
                <div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
                    <div className="flex items-start gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
                            <AlertTriangle className="size-5" />
                        </div>

                        <div>
                            <p className="font-display text-base font-bold text-ink">
                                Could not load integrations configuration
                            </p>

                            <p className="mt-1 text-sm leading-6 text-ink-soft">
                                {error}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5">
                        <Button
                            onClick={() => void fetchAll()}
                            className="bg-orange text-white hover:bg-orange-deep"
                        >
                            Try again
                        </Button>
                    </div>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell
            title="Integrations"
            eyebrow="Administration · Configuration"
        >
            <div className="space-y-6 pb-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        <Link
                            to="/admin/configuration"
                            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-orange"
                        >
                            <ArrowLeft className="size-3.5" />
                            Back to configuration
                        </Link>

                        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                            Integration settings
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
                            Configure external services, connection options,
                            credentials and failure-handling rules for the
                            terminal platform. Every change is logged.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {dirty && (
                            <StatusBadge
                                label="Unsaved changes"
                                tone="warning"
                            />
                        )}
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl bg-paper p-4 ring-1 ring-line">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-ink-soft">
                                Configured adapters
                            </p>
                            <Activity className="size-4 text-ink-soft" />
                        </div>

                        <p className="mt-3 font-display text-2xl font-bold text-ink">
                            {config.integrations.length}
                        </p>

                        <p className="mt-1 text-xs text-ink-soft">
                            Available integration definitions
                        </p>
                    </div>

                    <div className="rounded-xl bg-paper p-4 ring-1 ring-line">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-ink-soft">
                                Enabled adapters
                            </p>
                            <Check className="size-4 text-ink-soft" />
                        </div>

                        <p className="mt-3 font-display text-2xl font-bold text-ink">
                            {enabledCount}
                        </p>

                        <p className="mt-1 text-xs text-ink-soft">
                            Currently active
                        </p>
                    </div>

                    <div className="rounded-xl bg-paper p-4 ring-1 ring-line">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-ink-soft">
                                Integration health
                            </p>
                            <RefreshCcw className="size-4 text-ink-soft" />
                        </div>

                        <p className="mt-3 text-sm font-semibold text-ink">
                            {enabledCount > 0 ? "Monitored" : "Idle"}
                        </p>

                        <p className="mt-1 text-xs text-ink-soft">
                            Health dashboard on the integrations overview
                        </p>
                    </div>
                </div>

                <section className="space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h3 className="font-display text-lg font-bold text-ink">
                                Integration adapters
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-ink-soft">
                                Expand an adapter to configure its environment
                                and connection credentials.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search integrations..."
                                className="h-10 w-full border-line bg-paper text-sm text-ink sm:w-56"
                            />

                            <div className="relative">
                                <select
                                    value={category}
                                    onChange={(event) =>
                                        setCategory(event.target.value)
                                    }
                                    className="h-10 appearance-none rounded-md border border-line bg-paper py-2 pl-3 pr-9 text-sm text-ink outline-none focus:ring-2 focus:ring-orange"
                                    aria-label="Filter integrations by category"
                                >
                                    {categories.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>

                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredIntegrations.map((integration) => {
                            const Icon = integration.icon;
                            const isExpanded = expanded.includes(integration.id);

                            const emailIntegrationId = config.integrations.find(
                                (item) =>
                                    item.name.toLowerCase().includes("email") ||
                                    item.category.toLowerCase().includes("email")
                            )?.id;

                            const isEmailIntegration =
                                integration.id === emailIntegrationId;

                            const connectionFields: IntegrationField[] =
                                isEmailIntegration
                                    ? [
                                          {
                                              key: "email_host",
                                              label: "Email host",
                                              placeholder: "smtp.example.com",
                                              kind: "text",
                                              required: true,
                                          },
                                          {
                                              key: "email_port",
                                              label: "Port",
                                              placeholder: "587",
                                              kind: "number",
                                              required: true,
                                          },
                                          {
                                              key: "email_password",
                                              label: "Password",
                                              placeholder: "SMTP password",
                                              kind: "password",
                                              required: true,
                                              secret: true,
                                          },
                                          {
                                              key: "sender_email",
                                              label: "Sender email",
                                              placeholder: "no-reply@example.com",
                                              kind: "email",
                                              required: true,
                                          },
                                      ]
                                    : integration.fields.filter((field) => {
                                          const key = field.key
                                              .toLowerCase()
                                              .replace(/[^a-z0-9]/g, "");
                                          const label = field.label.toLowerCase();

                                          return (
                                              !key.includes("apikey") &&
                                              !key.includes("apisecret") &&
                                              !key.includes("secretkey") &&
                                              !key.includes("maxretries") &&
                                              !key.includes("retrycount") &&
                                              !key.includes("timeout") &&
                                              !label.includes("api key") &&
                                              !label.includes("maximum retries") &&
                                              !label.includes("timeout")
                                          );
                                      });

                            return (
                                <article
                                    key={integration.id}
                                    className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line"
                                >
                                    <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
                                        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep">
                                            <Icon className="size-5" />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleExpanded(integration.id)
                                            }
                                            aria-expanded={isExpanded}
                                            className="min-w-0 flex-1 text-left"
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold text-ink">
                                                    {integration.name}
                                                </span>

                                                <StatusBadge
                                                    label={
                                                        integration.enabled
                                                            ? "Enabled"
                                                            : "Disabled"
                                                    }
                                                    tone={
                                                        integration.enabled
                                                            ? "success"
                                                            : "neutral"
                                                    }
                                                />
                                            </div>

                                            <p className="mt-1 text-xs leading-5 text-ink-soft">
                                                {integration.description}
                                            </p>

                                            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                                                {integration.category} ·{" "}
                                                {integration.environment}
                                            </p>
                                        </button>

                                        <div className="flex items-center gap-3">
                                            <Toggle
                                                checked={integration.enabled}
                                                onChange={(value) =>
                                                    updateIntegration(
                                                        integration.id,
                                                        { enabled: value }
                                                    )
                                                }
                                                label={`Enable ${integration.name}`}
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleExpanded(integration.id)
                                                }
                                                aria-label={`${
                                                    isExpanded
                                                        ? "Collapse"
                                                        : "Expand"
                                                } ${integration.name}`}
                                                className="grid size-9 place-items-center rounded-lg text-ink-soft hover:bg-sand hover:text-ink"
                                            >
                                                <ChevronDown
                                                    className={cn(
                                                        "size-4 transition-transform",
                                                        isExpanded && "rotate-180"
                                                    )}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="space-y-5 border-t border-line bg-sand/40 p-4 sm:p-5">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <label className="block">
                                                    <span className="text-xs font-medium text-ink">
                                                        Environment
                                                    </span>

                                                    <select
                                                        value={integration.environment}
                                                        onChange={(event) =>
                                                            updateIntegration(
                                                                integration.id,
                                                                {
                                                                    environment:
                                                                        event.target
                                                                            .value as Environment,
                                                                }
                                                            )
                                                        }
                                                        className="mt-1.5 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange"
                                                    >
                                                        <option value="sandbox">
                                                            Sandbox / testing
                                                        </option>
                                                        <option value="production">
                                                            Production
                                                        </option>
                                                    </select>
                                                </label>
                                            </div>

                                            {connectionFields.length > 0 && (
                                                <div>
                                                    <div className="mb-3 flex items-center gap-2">
                                                        <ShieldCheck className="size-4 text-ink-soft" />
                                                        <h4 className="text-xs font-semibold text-ink">
                                                            Connection settings
                                                        </h4>
                                                    </div>

                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        {connectionFields.map(
                                                            (field) => {
                                                                const fieldKey = `${integration.id}.${field.key}`;
                                                                const isRevealed =
                                                                    revealed.has(
                                                                        fieldKey
                                                                    );
                                                                const isSecret =
                                                                    Boolean(
                                                                        field.secret
                                                                    );
                                                                const value =
                                                                    config.credentials[
                                                                        fieldKey
                                                                    ] ?? "";

                                                                return (
                                                                    <label
                                                                        key={
                                                                            field.key
                                                                        }
                                                                        className="block"
                                                                    >
                                                                        <span className="flex items-center gap-1 text-xs font-medium text-ink">
                                                                            {
                                                                                field.label
                                                                            }

                                                                            {field.required && (
                                                                                <span className="text-coral">
                                                                                    *
                                                                                </span>
                                                                            )}
                                                                        </span>

                                                                        <div className="mt-1.5 flex gap-2">
                                                                            <Input
                                                                                type={
                                                                                    isSecret &&
                                                                                    !isRevealed
                                                                                        ? "password"
                                                                                        : field.kind ===
                                                                                            "number"
                                                                                          ? "number"
                                                                                          : field.kind ===
                                                                                              "email"
                                                                                            ? "email"
                                                                                            : field.kind ===
                                                                                                "url"
                                                                                              ? "url"
                                                                                              : "text"
                                                                                }
                                                                                inputMode={
                                                                                    field.kind ===
                                                                                    "number"
                                                                                        ? "numeric"
                                                                                        : undefined
                                                                                }
                                                                                value={value}
                                                                                onChange={(
                                                                                    event
                                                                                ) =>
                                                                                    updateCredential(
                                                                                        fieldKey,
                                                                                        event
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                placeholder={
                                                                                    field.placeholder
                                                                                }
                                                                                autoComplete="off"
                                                                                className="h-10 min-w-0 flex-1 border-line bg-paper text-sm text-ink"
                                                                            />

                                                                            {isSecret && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        toggleReveal(
                                                                                            fieldKey
                                                                                        )
                                                                                    }
                                                                                    aria-label={
                                                                                        isRevealed
                                                                                            ? `Hide ${field.label}`
                                                                                            : `Show ${field.label}`
                                                                                    }
                                                                                    className="grid size-10 shrink-0 place-items-center rounded-md border border-line bg-paper text-ink-soft hover:bg-sand"
                                                                                >
                                                                                    {isRevealed ? (
                                                                                        <EyeOff className="size-4" />
                                                                                    ) : (
                                                                                        <Eye className="size-4" />
                                                                                    )}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </label>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </article>
                            );
                        })}

                        {filteredIntegrations.length === 0 && (
                            <div className="rounded-xl border border-dashed border-line bg-paper p-10 text-center">
                                <Webhook className="mx-auto size-8 text-ink-soft" />

                                <p className="mt-3 text-sm font-semibold text-ink">
                                    No integrations found
                                </p>

                                <p className="mt-1 text-xs text-ink-soft">
                                    Try another search term or category.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <div className="flex items-start gap-3 rounded-xl bg-paper p-4 ring-1 ring-line">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-orange" />

                    <div>
                        <p className="text-sm font-semibold text-ink">
                            Production safety
                        </p>

                        <p className="mt-1 text-xs leading-5 text-ink-soft">
                            Before enabling production integrations, server-side
                            credential encryption, strict webhook signature
                            verification, request timeouts, idempotency, access
                            controls and audit logging must be in place. Frontend
                            switches are not security controls, and no external
                            integration may independently authorise customs release.
                        </p>
                    </div>
                </div>

                <div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
                                {dirty ? "Unsaved changes" : "All changes saved"}
                            </p>

                            <p className="mt-0.5 text-[12px] leading-5 text-sand/75">
                                {dirty
                                    ? "Save to apply adapter and credential changes."
                                    : "No pending changes."}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDiscard}
                                disabled={!dirty || saving}
                                className="border-sand/25 bg-transparent text-sand hover:bg-sand/10 disabled:opacity-40"
                            >
                                Discard
                            </Button>

                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={!dirty || saving}
                                className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
                            >
                                <Save className="mr-2 size-4" />
                                {saving ? "Saving…" : "Save changes"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}