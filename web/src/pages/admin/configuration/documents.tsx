
import { useEffect, useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import {
    AlertTriangle,
    ArrowLeft,
    FileBadge,
    FileCheck2,
    FileCog,
    FileText,
    Hash,
    History,
    LockKeyhole,
    Plus,
    Save,
    ShieldCheck,
    Trash2,
    Upload,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type DocumentType = {
    id: string;
    key: string;
    label: string;
    required: boolean;
    hasExpiry: boolean;
    verificationRequired: boolean;
};

type DocumentConfig = {
    id?: string;
    numberingPrefix: string;
    numberingFormat: string;
    retentionMonths: number;
    documentTypes: DocumentType[];
};

const emptyConfig: DocumentConfig = {
    numberingPrefix: "TRN",
    numberingFormat: "TRN-{TYPE}-{YYYY}-{SEQ:6}",
    retentionMonths: 84,
    documentTypes: [],
};

const mandatoryControls = [
    {
        title: "QR and short-code verification",
        description: "Every issued document includes a QR code and a short verification code.",
        icon: FileBadge,
    },
    {
        title: "Digital integrity protection",
        description: "Issued documents are protected by signature or integrity controls; altered documents must fail verification.",
        icon: ShieldCheck,
    },
    {
        title: "Immediate revocation enforcement",
        description: "Revoked documents fail public verification and gate checks immediately.",
        icon: XCircle,
    },
    {
        title: "Upload validation and malware quarantine",
        description: "Uploaded files are validated and suspicious files are quarantined before repository access.",
        icon: Upload,
    },
    {
        title: "Versioned document templates",
        description: "Template changes are versioned so previously issued documents retain their original template version.",
        icon: History,
    },
    {
        title: "Document event audit",
        description: "Document access, verification, generation and download events are recorded in the audit trail.",
        icon: FileCheck2,
    },
    {
        title: "Bulk generation and download",
        description: "Authorised users can generate and download documents in bulk, subject to access controls.",
        icon: FileCog,
    },
    {
        title: "Legal-hold protection",
        description: "Documents under legal hold are protected from routine retention-based deletion.",
        icon: LockKeyhole,
    },
];

const normaliseType = (raw: any): DocumentType => ({
    id: String(raw?.id ?? crypto.randomUUID()),
    key: String(raw?.key ?? ""),
    label: String(raw?.label ?? raw?.name ?? ""),
    required: Boolean(raw?.required ?? false),
    hasExpiry: Boolean(raw?.has_expiry ?? raw?.hasExpiry ?? false),
    verificationRequired: Boolean(
        raw?.verification_required ?? raw?.verificationRequired ?? true
    ),
});

export default function AdminDocumentsConfigurationPage() {
    const [config, setConfig] = useState<DocumentConfig>(emptyConfig);
    const [savedConfig, setSavedConfig] = useState<DocumentConfig>(emptyConfig);
    const [dirty, setDirty] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const fetchAll = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await http.get("/admin/config/documents/");
            const resp: Resp = res.data;

            if (resp.error) {
                setError(
                    typeof resp.data === "string"
                        ? resp.data
                        : "Could not load documents configuration."
                );
                return;
            }

            const payload: any = resp.code ?? {};
            const rawTypes: any[] = Array.isArray(payload.document_types)
                ? payload.document_types
                : Array.isArray(payload.documentTypes)
                    ? payload.documentTypes
                    : [];

			const loaded: DocumentConfig = {
				...(payload.id ? { id: String(payload.id) } : {}),
				numberingPrefix:
					payload.numbering_prefix ?? payload.numberingPrefix ?? "TRN",
				numberingFormat:
					payload.numbering_format ??
					payload.numberingFormat ??
					"TRN-{TYPE}-{YYYY}-{SEQ:6}",
				retentionMonths: Number(
					payload.retention_months ?? payload.retentionMonths ?? 84
				),
				documentTypes: rawTypes.map(normaliseType),
			};

            setConfig(loaded);
            setSavedConfig(loaded);
            setDirty(false);
        } catch (err: any) {
            setError(
                err?.response?.data?.data ||
                err?.response?.data?.message ||
                "Could not load documents configuration."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchAll();
    }, []);

    const update = <K extends keyof DocumentConfig>(
        key: K,
        value: DocumentConfig[K]
    ) => {
        setConfig((current) => ({ ...current, [key]: value }));
        setDirty(true);
    };

    const updateType = (id: string, patch: Partial<DocumentType>) => {
        setConfig((current) => ({
            ...current,
            documentTypes: current.documentTypes.map((item) =>
                item.id === id ? { ...item, ...patch } : item
            ),
        }));
        setDirty(true);
    };

    const addType = () => {
        setConfig((current) => ({
            ...current,
            documentTypes: [
                ...current.documentTypes,
                {
                    id: crypto.randomUUID(),
                    key: "",
                    label: "",
                    required: false,
                    hasExpiry: false,
                    verificationRequired: true,
                },
            ],
        }));
        setDirty(true);
    };

    const removeType = (id: string) => {
        setConfig((current) => ({
            ...current,
            documentTypes: current.documentTypes.filter(
                (item) => item.id !== id
            ),
        }));
        setDirty(true);
    };

    const preview = useMemo(() => {
        const type = config.documentTypes.find((item) => item.key.trim());

        return config.numberingFormat
            .replaceAll("{TYPE}", (type?.key || "DOCUMENT").toUpperCase())
            .replaceAll("{YYYY}", String(new Date().getFullYear()))
            .replace(/\{SEQ:(\d+)\}/g, (_match, width: string) =>
                "1".padStart(Number(width), "0")
            );
    }, [config.documentTypes, config.numberingFormat]);

    const validate = () => {
        if (!config.numberingPrefix.trim()) {
            toast.error("Numbering prefix is required.");
            return false;
        }

        if (!config.numberingFormat.trim()) {
            toast.error("Numbering format is required.");
            return false;
        }

        if (
            !Number.isInteger(config.retentionMonths) ||
            config.retentionMonths < 1 ||
            config.retentionMonths > 1200
        ) {
            toast.error("Retention must be between 1 and 1,200 months.");
            return false;
        }

        if (!config.documentTypes.length) {
            toast.error("At least one document type is required.");
            return false;
        }

        if (
            config.documentTypes.some(
                (item) => !item.key.trim() || !item.label.trim()
            )
        ) {
            toast.error("Every document type needs a key and label.");
            return false;
        }

        const typeKeys = config.documentTypes.map((item) =>
            item.key.trim().toLowerCase()
        );

        if (new Set(typeKeys).size !== typeKeys.length) {
            toast.error("Document type keys must be unique.");
            return false;
        }

        if (
            config.documentTypes.some(
                (item) => !/^[a-z][a-z0-9_]*$/.test(item.key.trim())
            )
        ) {
            toast.error(
                "Document type keys must start with a lowercase letter and contain only letters, numbers and underscores."
            );
            return false;
        }

        if (!/^[A-Za-z0-9_-]{1,20}$/.test(config.numberingPrefix.trim())) {
            toast.error(
                "The numbering prefix may contain letters, numbers, underscores and hyphens only."
            );
            return false;
        }

        if (
            !config.numberingFormat.includes("{TYPE}") ||
            !config.numberingFormat.includes("{YYYY}") ||
            !/\{SEQ:\d+\}/.test(config.numberingFormat)
        ) {
            toast.error(
                "The format must include {TYPE}, {YYYY} and a sequence token such as {SEQ:6}."
            );
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!dirty || saving) return;
        if (!validate()) return;

        setSaving(true);

        try {
            const formData = new FormData();

            if (config.id) {
                formData.append("id", config.id);
            }

            formData.append(
                "numbering_prefix",
                config.numberingPrefix.trim()
            );
            formData.append(
                "numbering_format",
                config.numberingFormat.trim()
            );
            formData.append(
                "retention_months",
                String(config.retentionMonths)
            );
            formData.append(
                "document_types",
                JSON.stringify(
                    config.documentTypes.map((item) => ({
                        id: item.id,
                        key: item.key.trim(),
                        label: item.label.trim(),
                        required: item.required,
                        has_expiry: item.hasExpiry,
                        verification_required: item.verificationRequired,
                    }))
                )
            );

            const res = await http.post(
                "/admin/config/documents/update/",
                formData
            );

            const resp: Resp = res.data;

            if (resp.error) {
                toast.error(
                    typeof resp.data === "string"
                        ? resp.data
                        : "Could not save the documents configuration."
                );
                return;
            }

            toast.success(
                config.id
                    ? "Documents configuration updated successfully."
                    : "New documents configuration created successfully."
            );

            await fetchAll();
        } catch (err: any) {
            toast.error(
                err?.response?.data?.data ||
                err?.response?.data?.message ||
                "Could not save the documents configuration."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = async () => {
        setConfig(savedConfig);
        setDirty(false);
        toast.message("Changes discarded.");
    };

    if (loading) {
        return (
            <AppShell title="Documents" eyebrow="Administration · Configuration">
                <div className="flex items-center justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
                    <span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
                </div>
            </AppShell>
        );
    }

    if (error) {
        return (
            <AppShell title="Documents" eyebrow="Administration · Configuration">
                <div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
                    <div className="flex items-start gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
                            <AlertTriangle className="size-5" />
                        </div>
                        <div>
                            <p className="font-display text-base font-bold text-ink">
                                Could not load documents configuration
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
        <AppShell title="Documents" eyebrow="Administration · Configuration">
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
                        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                            Documents
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
                            Configure document numbering, accepted document types and
                            retention. Issuance, verification, revocation and audit
                            enforcement remain controlled by the platform.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {dirty && (
                            <StatusBadge label="Unsaved changes" tone="warning" />
                        )}
                    </div>
                </div>

                <section className="rounded-2xl border border-line bg-paper p-5">
                    <div className="flex items-start gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
                            <ShieldCheck className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-ink">
                                Mandatory document safeguards
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-ink-soft">
                                These controls are required by the platform specification
                                and cannot be disabled from this configuration page.
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {mandatoryControls.map(({ title, description, icon: Icon }) => (
                            <div
                                key={title}
                                className="flex gap-3 rounded-xl border border-line p-4"
                            >
                                <Icon className="mt-0.5 size-4 shrink-0 text-orange-deep" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-ink">{title}</p>
                                    <p className="mt-1 text-xs leading-5 text-ink-soft">
                                        {description}
                                    </p>
                                </div>
                                <StatusBadge label="Required" tone="success" />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border border-line bg-paper">
                    <SectionHeading
                        title="Document numbering"
                        description="Define the reference format. The backend must allocate sequence values atomically and never reuse issued references."
                        icon={Hash}
                    />
                    <div className="grid gap-4 p-5 sm:grid-cols-2">
                        <Field
                            label="Numbering prefix"
                            value={config.numberingPrefix}
                            onChange={(value) => update("numberingPrefix", value)}
                            placeholder="TRN"
                            mono
                        />
                        <Field
                            label="Format template"
                            value={config.numberingFormat}
                            onChange={(value) => update("numberingFormat", value)}
                            placeholder="TRN-{TYPE}-{YYYY}-{SEQ:6}"
                            mono
                        />
                        <div className="rounded-xl bg-sand/60 p-4 sm:col-span-2">
                            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                                Example preview
                            </p>
                            <p className="mt-2 break-all font-mono text-sm font-semibold text-ink">
                                {preview.replace(
                                    /^.*?-/,
                                    `${config.numberingPrefix.trim() || "TRN"}-`
                                )}
                            </p>
                            <p className="mt-1 text-xs text-ink-soft">
                                Tokens supported: <code>{"{TYPE}"}</code>,{" "}
                                <code>{"{YYYY}"}</code> and <code>{"{SEQ:6}"}</code>.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-line bg-paper">
                    <SectionHeading
                        title="Retention and legal holds"
                        description="Documents under a legal hold must be protected from routine deletion regardless of the configured retention period."
                        icon={LockKeyhole}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                        <div className="max-w-xl">
                            <p className="text-sm font-semibold text-ink">
                                Document retention period
                            </p>
                            <p className="mt-1 text-xs leading-5 text-ink-soft">
                                Confirm the applicable retention period with the terminal's
                                compliance and legal owners.
                            </p>
                        </div>
                        <label className="flex items-center gap-2">
                            <Input
                                type="number"
                                min={1}
                                max={1200}
                                value={String(config.retentionMonths)}
                                onChange={(event) =>
                                    update(
                                        "retentionMonths",
                                        Number(event.target.value) || 0
                                    )
                                }
                                className="h-10 w-28 border-line bg-sand font-mono text-sm text-ink"
                            />
                            <span className="font-mono text-xs text-ink-soft">
                                months
                            </span>
                        </label>
                    </div>
                    <div className="border-t border-line p-5">
                        <div className="flex items-start gap-3">
                            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-orange-deep" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-ink">
                                    Legal-hold enforcement
                                </p>
                                <p className="mt-1 text-xs leading-5 text-ink-soft">
                                    Legal-hold creation, release, actor, reason, timestamps
                                    and retention-deletion blocking must be enforced by
                                    backend workflows.
                                </p>
                            </div>
                            <StatusBadge label="Always on" tone="success" />
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-line bg-paper">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
                        <SectionHeading
                            title="Document types"
                            description="Configure document types accepted or issued by the terminal. Required-document and expiry checks must be enforced by operational workflows."
                            icon={FileText}
                            noBorder
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addType}
                            className="border-line bg-paper text-ink hover:bg-sand"
                        >
                            <Plus className="mr-1.5 size-3.5" />
                            Add type
                        </Button>
                    </div>

                    {config.documentTypes.length === 0 ? (
                        <div className="p-8 text-center text-sm text-ink-soft">
                            No document types configured.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                                        <th className="px-4 py-3 font-medium">Key</th>
                                        <th className="px-4 py-3 font-medium">Label</th>
                                        <th className="px-4 py-3 text-center font-medium">
                                            Required
                                        </th>
                                        <th className="px-4 py-3 text-center font-medium">
                                            Has expiry
                                        </th>
                                        <th className="px-4 py-3 text-center font-medium">
                                            Verification
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {config.documentTypes.map((item) => (
                                        <tr key={item.id} className="hover:bg-sand/30">
                                            <td className="px-4 py-3">
                                                <Input
                                                    value={item.key}
                                                    onChange={(event) =>
                                                        updateType(item.id, {
                                                            key: event.target.value,
                                                        })
                                                    }
                                                    className="h-9 border-line bg-paper font-mono text-xs text-ink"
                                                    placeholder="delivery_order"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Input
                                                    value={item.label}
                                                    onChange={(event) =>
                                                        updateType(item.id, {
                                                            label: event.target.value,
                                                        })
                                                    }
                                                    className="h-9 border-line bg-paper text-xs text-ink"
                                                    placeholder="Delivery Order"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={item.required}
                                                    onChange={(event) =>
                                                        updateType(item.id, {
                                                            required: event.target.checked,
                                                        })
                                                    }
                                                    aria-label={`Required: ${item.label || item.key}`}
                                                    className="size-4 accent-orange"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={item.hasExpiry}
                                                    onChange={(event) =>
                                                        updateType(item.id, {
                                                            hasExpiry: event.target.checked,
                                                        })
                                                    }
                                                    aria-label={`Has expiry: ${item.label || item.key}`}
                                                    className="size-4 accent-orange"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={item.verificationRequired}
                                                    onChange={(event) =>
                                                        updateType(item.id, {
                                                            verificationRequired: event.target.checked,
                                                        })
                                                    }
                                                    aria-label={`Verification required: ${item.label || item.key}`}
                                                    className="size-4 accent-orange"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeType(item.id)}
                                                    aria-label={`Remove ${item.label || item.key}`}
                                                    className="text-carmine hover:bg-carmine/10"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="border-t border-line p-4 text-xs leading-5 text-ink-soft">
                        Confirm the final list of document types with terminal operations
                        and compliance teams.
                    </div>
                </section>

                <div className="rounded-xl border border-orange/20 bg-orange/5 p-5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
                        <div>
                            <p className="text-sm font-semibold text-ink">
                                Implementation boundary
                            </p>
                            <p className="mt-1 text-xs leading-5 text-ink-soft">
                                This page configures document rules only. The backend must
                                enforce safe public verification, prevent reference reuse,
                                block deletion during legal holds, quarantine unsafe uploads,
                                and record access, verification and download events.
                            </p>
                        </div>
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
                                    ? "Save to apply numbering, retention, and document type changes."
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

function SectionHeading({
    title,
    description,
    icon: Icon,
    noBorder = false,
}: {
    title: string;
    description: string;
    icon: typeof FileText;
    noBorder?: boolean;
}) {
    return (
        <div
            className={cn(
                "flex items-start gap-3",
                !noBorder && "border-b border-line p-5"
            )}
        >
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
                <Icon className="size-4" />
            </div>
            <div className="min-w-0">
                <h3 className="text-sm font-bold text-ink">{title}</h3>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-ink-soft">
                    {description}
                </p>
            </div>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    placeholder,
    mono = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    mono?: boolean;
}) {
    return (
        <label className="block min-w-0">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                {label}
            </span>
            <Input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className={cn(
                    "mt-1.5 h-11 border-line bg-sand text-ink",
                    mono && "font-mono"
                )}
            />
        </label>
    );
}
