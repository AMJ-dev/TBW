import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    Check,
    ChevronDown,
    CircleDollarSign,
    Plus,
    Trash2,
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
    fields: IntegrationField[];
};

type IntegrationConfig = {
    integrations: Integration[];
    credentials: Record<string, string>;
};

type BankAccountCountry = "NG" | "US";

type BankAccount = {
    id: string;
    country: BankAccountCountry;
    bank_name: string;
    account_name: string;
    account_number: string;
    currency: "NGN" | "USD";
    bank_code: string;
    routing_number: string;
    swift_code: string;
    branch_name: string;
    branch_address: string;
    bank_address: string;
    account_type: string;
    intermediary_bank: string;
    intermediary_swift_code: string;
    intermediary_bank_address: string;
};

const iconRegistry: Record<string, LucideIcon> = {
    ShieldCheck,
    Ship,
    CircleDollarSign,
    Plus,
    Trash2,
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
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
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
            setBankAccounts(
                Array.isArray(payload.bank_accounts)
                    ? payload.bank_accounts.map((account: any) => ({
                          id: String(account.id ?? crypto.randomUUID()),
                          country: account.country === "US" ? "US" : "NG",
                          bank_name: String(account.bank_name ?? account.bankName ?? ""),
                          account_name: String(account.account_name ?? account.accountName ?? ""),
                          account_number: String(account.account_number ?? account.accountNumber ?? ""),
                          currency: account.currency === "USD" ? "USD" : "NGN",
                          bank_code: String(account.bank_code ?? account.bankCode ?? ""),
                          routing_number: String(account.routing_number ?? account.routingNumber ?? ""),
                          swift_code: String(account.swift_code ?? account.swiftCode ?? ""),
                          branch_name: String(account.branch_name ?? account.branchName ?? ""),
                          branch_address: String(account.branch_address ?? account.branchAddress ?? ""),
                          bank_address: String(account.bank_address ?? account.bankAddress ?? ""),
                          account_type: String(account.account_type ?? account.accountType ?? ""),
                          intermediary_bank: String(account.intermediary_bank ?? account.intermediaryBank ?? account.intermediaryBankName ?? ""),
                          intermediary_swift_code: String(account.intermediary_swift_code ?? account.intermediarySwiftCode ?? ""),
                          intermediary_bank_address: String(account.intermediary_bank_address ?? account.intermediaryBankAddress ?? ""),
                      }))
                    : []
            );
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

    const addBankAccount = (country: BankAccountCountry) => {
        setBankAccounts((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                country,
                bank_name: "",
                account_name: "",
                account_number: "",
                currency: country === "NG" ? "NGN" : "USD",
                bank_code: "",
                routing_number: "",
                swift_code: "",
                branch_name: "",
                branch_address: "",
                bank_address: "",
                account_type: country === "US" ? "checking" : "",
                intermediary_bank: "",
                intermediary_swift_code: "",
                intermediary_bank_address: "",
            },
        ]);
        markDirty();
    };

    const updateBankAccount = (id: string, patch: Partial<BankAccount>) => {
        setBankAccounts((current) =>
            current.map((account) =>
                account.id === id ? { ...account, ...patch } : account
            )
        );
        markDirty();
    };

    const removeBankAccount = (id: string) => {
        setBankAccounts((current) => current.filter((account) => account.id !== id));
        markDirty();
    };

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

    const validate = () => {
        for (const [index, account] of bankAccounts.entries()) {
            const requiredFields = account.country === "NG"
                ? [
                    ["Bank name", account.bank_name],
                    ["Account name", account.account_name],
                    ["Account number", account.account_number],
                    ["Bank code", account.bank_code],
                    ["SWIFT / BIC code", account.swift_code],
                ]
                : [
                    ["Bank name", account.bank_name],
                    ["Account holder name", account.account_name],
                    ["Account number", account.account_number],
                    ["ABA routing number", account.routing_number],
                    ["SWIFT / BIC code", account.swift_code],
                    ["Bank address", account.bank_address],
                ];

            const missing = requiredFields.find(([, value]) => !String(value).trim());

            if (missing) {
                toast.error(`Bank account ${index + 1}: ${missing[0]} is required.`);
                return false;
            }
        }

        return true;
    };

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
                    }))
                )
            );

            formData.set("credentials", JSON.stringify(config.credentials));
            formData.set("bank_accounts", JSON.stringify(bankAccounts));

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
                                Expand an adapter to configure its connection credentials.
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
                            const isBankReconciliation =
                                integration.name.toLowerCase().includes("bank reconciliation") ||
                                integration.category.toLowerCase().includes("bank reconciliation");

                            const connectionFields: IntegrationField[] =
                                isBankReconciliation
                                    ? []
                                    : isEmailIntegration
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
                                              key: "email_user",
                                              label: "Email username",
                                              placeholder: "username",
                                              kind: "text",
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
                                                {integration.category}
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

                                            {isBankReconciliation && (
                                                <div className="space-y-4 border-t border-line pt-5">
                                                    <div className="flex flex-wrap items-end justify-between gap-3">
                                                        <div>
                                                            <h4 className="font-display text-base font-bold text-ink">Settlement bank accounts</h4>
                                                            <p className="mt-1 max-w-2xl text-xs leading-5 text-ink-soft">
                                                                Add Nigerian and United States accounts used for bank reconciliation and settlement matching.
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button type="button" onClick={() => addBankAccount("NG")} className="bg-orange text-white hover:bg-orange-deep">
                                                                <Plus className="mr-2 size-4" /> Add Nigeria account
                                                            </Button>
                                                            <Button type="button" onClick={() => addBankAccount("US")} variant="outline" className="border-line text-ink">
                                                                <Plus className="mr-2 size-4" /> Add US account
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    {bankAccounts.length === 0 ? (
                                                        <div className="rounded-2xl border border-dashed border-line bg-paper p-8 text-center">
                                                            <Landmark className="mx-auto size-8 text-ink-soft" />
                                                            <p className="mt-3 text-sm font-semibold text-ink">No bank accounts added</p>
                                                            <p className="mt-1 text-xs text-ink-soft">Add accounts to store the local and international settlement details used during reconciliation.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {bankAccounts.map((account, index) => {
                                                                const fields = account.country === "NG"
                                                                    ? [
                                                                        { key: "bank_name", label: "Bank name", placeholder: "e.g. Access Bank" },
                                                                        { key: "account_name", label: "Account name", placeholder: "Name registered with the bank" },
                                                                        { key: "account_number", label: "Account number", placeholder: "10-digit NUBAN" },
                                                                        { key: "bank_code", label: "Bank code", placeholder: "CBN/NIP bank code" },
                                                                        { key: "swift_code", label: "SWIFT / BIC code", placeholder: "Bank SWIFT code" },
                                                                        { key: "branch_name", label: "Branch name", placeholder: "Branch name" },
                                                                        { key: "branch_address", label: "Branch address", placeholder: "Branch address" },
                                                                    ]
                                                                    : [
                                                                        { key: "bank_name", label: "Bank name", placeholder: "e.g. JPMorgan Chase Bank" },
                                                                        { key: "account_name", label: "Account holder name", placeholder: "Name registered with the bank" },
                                                                        { key: "account_number", label: "Account number", placeholder: "Bank account number" },
                                                                        { key: "routing_number", label: "ABA routing number", placeholder: "9-digit routing number" },
                                                                        { key: "swift_code", label: "SWIFT / BIC code", placeholder: "SWIFT / BIC code" },
                                                                        { key: "bank_address", label: "Bank address", placeholder: "Bank street, city, state, ZIP" },
                                                                        { key: "intermediary_bank", label: "Intermediary bank (optional)", placeholder: "Intermediary bank name" },
                                                                        { key: "intermediary_swift_code", label: "Intermediary SWIFT code (optional)", placeholder: "Intermediary bank BIC" },
                                                                    ];
                                                                return (
                                                                    <article key={account.id} className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line">
                                                                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="grid size-10 place-items-center rounded-xl bg-orange/10 text-orange-deep"><Landmark className="size-5" /></div>
                                                                                <div>
                                                                                    <p className="text-sm font-semibold text-ink">{account.country === "NG" ? "Nigeria bank account" : "United States bank account"} {index + 1}</p>
                                                                                    <p className="mt-0.5 text-xs text-ink-soft">{account.bank_name || "Bank name not provided"} · {account.currency}</p>
                                                                                </div>
                                                                            </div>
                                                                            <Button type="button" variant="outline" onClick={() => removeBankAccount(account.id)} className="border-line text-ink-soft hover:text-coral"><Trash2 className="mr-2 size-4" /> Remove</Button>
                                                                        </div>
                                                                        <div className="grid gap-4 p-4 sm:grid-cols-2">
                                                                            {fields.map((field) => (
                                                                                <label key={field.key} className="block">
                                                                                    <span className="text-xs font-medium text-ink">{field.label}</span>
                                                                                    <Input value={account[field.key as keyof BankAccount] as string} onChange={(event) => updateBankAccount(account.id, { [field.key]: event.target.value })} placeholder={field.placeholder} autoComplete="off" className="mt-1.5 h-10 border-line bg-paper text-sm text-ink" />
                                                                                </label>
                                                                            ))}
                                                                            <label className="block">
                                                                                <span className="text-xs font-medium text-ink">Currency</span>
                                                                                <select value={account.currency} onChange={(event) => updateBankAccount(account.id, { currency: event.target.value as "NGN" | "USD" })} className="mt-1.5 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange">
                                                                                    <option value="NGN">NGN - Nigerian Naira</option>
                                                                                    <option value="USD">USD - US Dollar</option>
                                                                                </select>
                                                                            </label>
                                                                            {account.country === "US" && (
                                                                                <label className="block">
                                                                                    <span className="text-xs font-medium text-ink">Account type</span>
                                                                                    <select value={account.account_type} onChange={(event) => updateBankAccount(account.id, { account_type: event.target.value })} className="mt-1.5 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange">
                                                                                        <option value="checking">Checking</option>
                                                                                        <option value="savings">Savings</option>
                                                                                    </select>
                                                                                </label>
                                                                            )}
                                                                        </div>
                                                                    </article>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
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