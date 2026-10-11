import { useEffect, useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import {
    AlertTriangle,
    ArrowLeft,
    Check,
    ChevronDown,
    FileText,
    Hash,
    LockKeyhole,
    Plus,
    Save,
    Search,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type DocumentType = {
    id: string;
    key: string;
    label: string;
};

type UploadLocation = {
    id: string;
    key: string;
    label: string;
    description: string;
    documentTypeKeys: string[];
    allowMultiple: boolean;
};

type DocumentConfig = {
    id?: string;
    numberingPrefix: string;
    numberingFormat: string;
    retentionMonths: number;
    documentTypes: DocumentType[];
    uploadLocations: UploadLocation[];
};

const locationDefinitions = [
    {
        key: "quote_request",
        label: "Quote Request",
        description:
            "Configure the documents customers can attach when requesting a shipping quotation. These documents help the team understand the cargo, estimate shipping costs, and determine handling requirements. Examples: commercial invoice, packing list, cargo photographs, product specifications, and shipping instructions.",
    },
    {
        key: "organisation_kyc",
        label: "Organisation KYC / Onboarding",
        description:
            "Configure the documents an organisation can submit during registration and verification. These help verify the company's legal identity, registration status, address, tax details, and authorised representatives. Examples: CAC certificate, company registration documents, TIN certificate, proof of business address, and letter of authorisation.",
    },
    {
        key: "shipment_documents",
        label: "Shipment / Consignment",
        description:
            "Configure the documents users can attach to a specific shipment. These support cargo identification, customs processing, transportation, and shipment clearance. Examples: commercial invoice, packing list, bill of lading, waybill, customs declaration, certificate of origin, and applicable permits.",
    },
    {
        key: "document_centre",
        label: "Document Centre",
        description:
            "Configure additional documents users may submit when operations, compliance, customs, or another authorised team requests further information. Examples: corrected invoices, supplementary permits, compliance certificates, supporting letters, and missing shipment records.",
    },
    {
        key: "proof_of_payment",
        label: "Proof of Payment",
        description:
            "Configure the documents customers can submit as evidence of payment for invoices, shipping fees, or other charges. Finance staff can review these documents when reconciling payments. Examples: bank transfer receipts, transaction confirmations, payment slips, and remittance advice. Uploaded evidence does not automatically confirm that payment was received.",
    },
    {
        key: "receiving_tally",
        label: "Receiving / Tally",
        description:
            "Configure the documents staff can attach when cargo arrives and its quantity and condition are recorded. These documents support package counting, seal verification, and the reporting of shortages or discrepancies. Examples: signed tally sheets, goods-received notes, delivery notes, seal records, and cargo photographs.",
    },
    {
        key: "examination",
        label: "Examination / Inspection",
        description:
            "Configure the documents staff can attach during cargo inspection, examination, or compliance checks. These records help document the inspection results, cargo condition, and any findings requiring action. Examples: inspection reports, examination records, surveyor reports, cargo photographs, and applicable clearance documents.",
    },
    {
        key: "loading_collection",
        label: "Loading / Collection",
        description:
            "Configure the documents required to record cargo loading, release, collection, or handover to an authorised recipient. These documents help confirm what was released, its condition, and who received it. Examples: signed delivery notes, collection authorisations, loading checklists, handover forms, and proof-of-collection records.",
    },
    {
        key: "damage_claim",
        label: "Discrepancy / Damage Claim",
        description:
            "Configure the documents users or staff can submit when cargo is damaged, missing, short-delivered, or involved in a dispute. These documents support investigations and claims assessment. Examples: damage photographs, discrepancy reports, surveyor assessments, incident reports, delivery notes showing exceptions, and supporting correspondence.",
    },
    {
        key: "gate_vehicle_driver",
        label: "Gate / Vehicle and Driver",
        description:
            "Configure the documents applicable when a vehicle and driver enter the terminal, collect cargo, or participate in a controlled gate movement. These help verify driver identity, driving authorisation, vehicle identity, and applicable vehicle compliance. Examples: driver's licence, vehicle registration, valid insurance, roadworthiness certificate, gate pass, and collection authorisation.",
    },
];

function createDefaultLocations(): UploadLocation[] {
    return locationDefinitions.map((item) => ({
        id: item.key,
        key: item.key,
        label: item.label,
        description: item.description,
        documentTypeKeys: [],
        allowMultiple: true,
    }));
}

function createEmptyConfig(): DocumentConfig {
    return {
        numberingPrefix: "TRN",
        numberingFormat: "TRN-{TYPE}-{YYYY}-{SEQ:6}",
        retentionMonths: 84,
        documentTypes: [],
        uploadLocations: createDefaultLocations(),
    };
}

function createDocumentKey(value: string): string {
    const key = value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .replace(/_+/g, "_");

    return /^[a-z]/.test(key) ? key : key ? `document_${key}` : "";
}

function createUniqueDocumentKey(
    label: string,
    documentTypes: DocumentType[],
    currentId?: string
): string {
    const baseKey = createDocumentKey(label);

    if (!baseKey) return "";

    const existingKeys = new Set(
        documentTypes
            .filter((item) => item.id !== currentId)
            .map((item) => item.key.trim().toLowerCase())
    );

    if (!existingKeys.has(baseKey)) return baseKey;

    let suffix = 2;
    let candidate = `${baseKey}_${suffix}`;

    while (existingKeys.has(candidate)) {
        candidate = `${baseKey}_${++suffix}`;
    }

    return candidate;
}

function normaliseDocumentType(item: any): DocumentType {
    return {
        id: String(item?.id ?? crypto.randomUUID()),
        key: String(item?.key ?? ""),
        label: String(item?.label ?? item?.name ?? ""),
    };
}

export default function AdminDocumentsConfigurationPage() {
    const [config, setConfig] = useState<DocumentConfig>(createEmptyConfig);
    const [savedConfig, setSavedConfig] =
        useState<DocumentConfig>(createEmptyConfig);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [error, setError] = useState("");
    const [openLocationId, setOpenLocationId] = useState<string | null>(null);
    const [searchByLocation, setSearchByLocation] = useState<
        Record<string, string>
    >({});

    async function loadConfig() {
        setLoading(true);
        setError("");

        try {
            const response = await http.get("/admin/config/documents/");
            const result: Resp = response.data;

            if (result.error) {
                setError(
                    typeof result.data === "string"
                        ? result.data
                        : "Could not load document configuration."
                );
                return;
            }

            const data: any = result.code ?? {};
            const defaults = createEmptyConfig();

            const types = Array.isArray(data.document_types)
                ? data.document_types
                : Array.isArray(data.documentTypes)
                    ? data.documentTypes
                    : [];

            const serverLocations = Array.isArray(data.upload_locations)
                ? data.upload_locations
                : Array.isArray(data.uploadLocations)
                    ? data.uploadLocations
                    : [];

            const locationsByKey = new Map<string, any>(
                serverLocations.map((item: any) => [
                    String(item?.key ?? ""),
                    item,
                ])
            );

            const loaded: DocumentConfig = {
                ...(data.id ? { id: String(data.id) } : {}),
                numberingPrefix:
                    data.numbering_prefix ?? data.numberingPrefix ?? "TRN",
                numberingFormat:
                    data.numbering_format ??
                    data.numberingFormat ??
                    "TRN-{TYPE}-{YYYY}-{SEQ:6}",
                retentionMonths: Number(
                    data.retention_months ?? data.retentionMonths ?? 84
                ),
                documentTypes: types.map(normaliseDocumentType),
                uploadLocations: defaults.uploadLocations.map((location) => {
                    const serverLocation = locationsByKey.get(location.key);

                    if (!serverLocation) return location;

                    return {
                        ...location,
                        id: String(serverLocation.id ?? location.id),
                        documentTypeKeys: Array.isArray(
                            serverLocation.document_type_keys
                        )
                            ? serverLocation.document_type_keys.map(String)
                            : Array.isArray(serverLocation.documentTypeKeys)
                                ? serverLocation.documentTypeKeys.map(String)
                                : [],
                        required: Boolean(serverLocation.required),
                        allowMultiple: Boolean(
                            serverLocation.allow_multiple ??
                            serverLocation.allowMultiple ??
                            true
                        ),
                    };
                }),
            };

            setConfig(loaded);
            setSavedConfig(structuredClone(loaded));
            setDirty(false);
            setOpenLocationId(null);
            setSearchByLocation({});
        } catch (err: any) {
            setError(
                err?.response?.data?.data ||
                err?.response?.data?.message ||
                "Could not load document configuration."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadConfig();
    }, []);

    function updateConfig<K extends keyof DocumentConfig>(
        key: K,
        value: DocumentConfig[K]
    ) {
        setConfig((current) => ({ ...current, [key]: value }));
        setDirty(true);
    }

    function addDocumentType() {
        setConfig((current) => ({
            ...current,
            documentTypes: [
                ...current.documentTypes,
                {
                    id: crypto.randomUUID(),
                    key: "",
                    label: "",
                },
            ],
        }));

        setDirty(true);
    }

    function updateDocumentType(
        id: string,
        changes: Partial<DocumentType>
    ) {
        setConfig((current) => {
            const previous = current.documentTypes.find(
                (item) => item.id === id
            );

            const documentTypes = current.documentTypes.map((item) => {
                if (item.id !== id) return item;

                const nextLabel = changes.label ?? item.label;
                const nextKey = Object.prototype.hasOwnProperty.call(
                    changes,
                    "label"
                )
                    ? createUniqueDocumentKey(
                        nextLabel,
                        current.documentTypes,
                        id
                    )
                    : item.key;

                return {
                    ...item,
                    label: nextLabel,
                    key: nextKey,
                };
            });

            const updated = documentTypes.find((item) => item.id === id);

            const uploadLocations =
                previous && updated && previous.key !== updated.key
                    ? current.uploadLocations.map((location) => ({
                        ...location,
                        documentTypeKeys: location.documentTypeKeys
                            .map((key) =>
                                key === previous.key ? updated.key : key
                            )
                            .filter(Boolean),
                    }))
                    : current.uploadLocations;

            return {
                ...current,
                documentTypes,
                uploadLocations,
            };
        });

        setDirty(true);
    }

    function removeDocumentType(id: string) {
        setConfig((current) => {
            const removed = current.documentTypes.find(
                (item) => item.id === id
            );

            return {
                ...current,
                documentTypes: current.documentTypes.filter(
                    (item) => item.id !== id
                ),
                uploadLocations: current.uploadLocations.map((location) => ({
                    ...location,
                    documentTypeKeys: location.documentTypeKeys.filter(
                        (key) => key !== removed?.key
                    ),
                })),
            };
        });

        setDirty(true);
    }
        function updateUploadLocation(
        id: string,
        changes: Partial<
            Pick<UploadLocation, "documentTypeKeys" | "allowMultiple">
        >
    ) {
        setConfig((current) => ({
            ...current,
            uploadLocations: current.uploadLocations.map((item) =>
                item.id === id ? { ...item, ...changes } : item
            ),
        }));

        setDirty(true);
    }

    function toggleDocumentType(
        location: UploadLocation,
        documentKey: string
    ) {
        const selected = location.documentTypeKeys.includes(documentKey);

        updateUploadLocation(location.id, {
            documentTypeKeys: selected
                ? location.documentTypeKeys.filter(
                    (key) => key !== documentKey
                )
                : [...location.documentTypeKeys, documentKey],
        });
    }

    function selectAllFilteredTypes(
        location: UploadLocation,
        filteredTypes: DocumentType[]
    ) {
        const filteredKeys = filteredTypes
            .map((item) => item.key)
            .filter(Boolean);

        const existing = new Set(location.documentTypeKeys);
        filteredKeys.forEach((key) => existing.add(key));

        updateUploadLocation(location.id, {
            documentTypeKeys: Array.from(existing),
        });
    }

    function clearFilteredTypes(
        location: UploadLocation,
        filteredTypes: DocumentType[]
    ) {
        const filteredKeys = new Set(
            filteredTypes.map((item) => item.key)
        );

        updateUploadLocation(location.id, {
            documentTypeKeys: location.documentTypeKeys.filter(
                (key) => !filteredKeys.has(key)
            ),
        });
    }

    const documentPreview = useMemo(() => {
        const firstType = config.documentTypes.find((item) =>
            item.key.trim()
        );

        return config.numberingFormat
            .replaceAll(
                "{TYPE}",
                (firstType?.key || "DOCUMENT").toUpperCase()
            )
            .replaceAll("{YYYY}", String(new Date().getFullYear()))
            .replace(/\{SEQ:(\d+)\}/g, (_match, width: string) =>
                "1".padStart(Number(width), "0")
            );
    }, [config.numberingFormat, config.documentTypes]);

    function validateConfig() {
        if (!config.numberingPrefix.trim()) {
            toast.error("Enter a numbering prefix.");
            return false;
        }

        if (!/^[A-Za-z0-9_-]{1,20}$/.test(config.numberingPrefix.trim())) {
            toast.error("The numbering prefix contains invalid characters.");
            return false;
        }

        if (
            !config.numberingFormat.includes("{TYPE}") ||
            !config.numberingFormat.includes("{YYYY}") ||
            !/\{SEQ:\d+\}/.test(config.numberingFormat)
        ) {
            toast.error(
                "The format must contain {TYPE}, {YYYY} and a token such as {SEQ:6}."
            );
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

        if (config.documentTypes.length === 0) {
            toast.error("Add at least one document type.");
            return false;
        }

        if (
            config.documentTypes.some(
                (item) => !item.key.trim() || !item.label.trim()
            )
        ) {
            toast.error("Enter a name for every document type.");
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
                "Document keys must start with a lowercase letter and contain only lowercase letters, numbers and underscores."
            );
            return false;
        }

        const validKeys = new Set(
            config.documentTypes.map((item) => item.key.trim())
        );

        if (
            config.uploadLocations.some((location) =>
                location.documentTypeKeys.some((key) => !validKeys.has(key))
            )
        ) {
            toast.error(
                "An upload location references a document type that no longer exists."
            );
            return false;
        }

        return true;
    }

    async function saveConfig() {
        if (saving || !dirty) return;
        if (!validateConfig()) return;

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
                    }))
                )
            );

            formData.append(
                "upload_locations",
                JSON.stringify(
                    config.uploadLocations.map((item) => ({
                        id: item.id,
                        key: item.key,
                        label: item.label,
                        description: item.description,
                        document_type_keys: item.documentTypeKeys,
                        required: false,
                        allow_multiple: item.allowMultiple,
                        is_active: true,
                    }))
                )
            );

            const response = await http.post(
                "/admin/config/documents/update/",
                formData
            );

            const result: Resp = response.data;

            if (result.error) {
                toast.error(
                    typeof result.data === "string"
                        ? result.data
                        : "Could not save document configuration."
                );
                return;
            }

            toast.success("Document configuration saved successfully.");
            await loadConfig();
        } catch (err: any) {
            toast.error(
                err?.response?.data?.data ||
                err?.response?.data?.message ||
                "Could not save document configuration."
            );
        } finally {
            setSaving(false);
        }
    }

    function discardChanges() {
        setConfig(structuredClone(savedConfig));
        setDirty(false);
        setOpenLocationId(null);
        setSearchByLocation({});
        toast.message("Changes discarded.");
    }

    if (loading) {
        return (
            <AppShell
                title="Documents"
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
                title="Documents"
                eyebrow="Administration · Configuration"
            >
                <div className="rounded-2xl bg-paper p-6 ring-1 ring-line">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="size-5 text-carmine" />
                        <div>
                            <h3 className="font-semibold text-ink">
                                Could not load document configuration
                            </h3>
                            <p className="mt-1 text-sm text-ink-soft">
                                {error}
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => void loadConfig()}
                        className="mt-5 bg-orange text-white"
                    >
                        Try again
                    </Button>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell
            title="Documents"
            eyebrow="Administration · Configuration"
        >
            <div className="space-y-6 pb-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <Link
                            to="/admin/configuration"
                            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-orange"
                        >
                            <ArrowLeft className="size-3.5" />
                            Back to configuration
                        </Link>

                        <h2 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">
                            Documents
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
                            Manage document names and the places where users upload them.
                        </p>
                    </div>
                </div>

                <section className="rounded-2xl border border-line bg-paper">
                    <SectionHeading
                        title="Document numbering"
                        description="Set the reference format for issued documents."
                        icon={Hash}
                    />

                    <div className="grid gap-4 p-5 sm:grid-cols-2">
                        <Field
                            label="Numbering prefix"
                            value={config.numberingPrefix}
                            onChange={(value) =>
                                updateConfig("numberingPrefix", value)
                            }
                            placeholder="TRN"
                        />

                        <Field
                            label="Numbering format"
                            value={config.numberingFormat}
                            onChange={(value) =>
                                updateConfig("numberingFormat", value)
                            }
                            placeholder="TRN-{TYPE}-{YYYY}-{SEQ:6}"
                        />

                        <Field
                            label="Document retention (months)"
                            value={String(config.retentionMonths)}
                            onChange={(value) =>
                                updateConfig(
                                    "retentionMonths",
                                    value === "" ? 0 : Number(value)
                                )
                            }
                            placeholder="84"
                        />

                        <div className="rounded-xl border border-line bg-sand/60 p-3">
                            <p className="text-xs font-medium text-ink">
                                Example document reference
                            </p>
                            <p className="mt-2 break-all font-mono text-sm font-semibold text-orange-deep">
                                {documentPreview}
                            </p>
                        </div>
                    </div>
                </section>
                                <section className="rounded-2xl border border-line bg-paper">
                    <SectionHeading
                        title="Document types"
                        description="Add the document names accepted by the terminal. Keys are generated automatically."
                        icon={FileText}
                    />

                    <div className="flex justify-end border-b border-line px-5 py-3">
                        <Button
                            type="button"
                            onClick={addDocumentType}
                            className="bg-orange text-white hover:bg-orange-deep"
                        >
                            <Plus className="mr-2 size-4" />
                            Add document
                        </Button>
                    </div>

                    {config.documentTypes.length === 0 ? (
                        <div className="p-8 text-center">
                            <FileText className="mx-auto size-8 text-ink-soft" />
                            <p className="mt-3 text-sm font-medium text-ink">
                                No document types added
                            </p>
                            <p className="mt-1 text-xs text-ink-soft">
                                Add a document name to get started.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[360px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-line bg-sand/40 text-xs text-ink-soft">
                                        <th className="px-5 py-3 font-medium">
                                            Document name
                                        </th>
                                        <th className="w-20 px-5 py-3 text-right font-medium">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-line">
                                    {config.documentTypes.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-5 py-3">
                                                <Input
                                                    value={item.label}
                                                    onChange={(event) =>
                                                        updateDocumentType(
                                                            item.id,
                                                            {
                                                                label: event.target.value,
                                                            }
                                                        )
                                                    }
                                                    placeholder="e.g. Delivery Order"
                                                    className="h-10 border-line bg-paper text-ink"
                                                />
                                            </td>

                                            <td className="px-5 py-3 text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        removeDocumentType(item.id)
                                                    }
                                                    aria-label={`Remove ${item.label || "document type"}`}
                                                    className="text-carmine hover:bg-carmine/10"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-line bg-paper">
                    <SectionHeading
                        title="Accepted documents by upload location"
                        description="Choose which document types users can submit at each stage."
                        icon={Upload}
                    />

                    <div className="divide-y divide-line">
                        {config.uploadLocations.map((location) => {
                            const isOpen = openLocationId === location.id;
                            const selectedTypes = config.documentTypes.filter(
                                (type) =>
                                    location.documentTypeKeys.includes(type.key)
                            );
                            const searchTerm = searchByLocation[location.id] ?? "";
                            const filteredTypes = config.documentTypes.filter(
                                (type) =>
                                    type.label
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase())
                            );

                            return (
                                <div key={location.id} className="p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold text-ink">
                                                {location.label}
                                            </h3>
                                            <p className="mt-1 text-xs leading-5 text-ink-soft">
                                                {location.description}
                                            </p>
                                        </div>

                                        <span className="rounded-full bg-sand px-2.5 py-1 text-xs text-ink-soft">
                                            {selectedTypes.length} selected
                                        </span>
                                    </div>

                                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                        <div className="relative min-w-0">
                                            <label className="text-xs font-medium text-ink">
                                                Accepted document types
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpenLocationId(
                                                        isOpen ? null : location.id
                                                    )
                                                }
                                                aria-expanded={isOpen}
                                                className={cn(
                                                    "mt-1.5 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border bg-sand px-3 py-2 text-left text-sm transition",
                                                    isOpen
                                                        ? "border-orange ring-2 ring-orange/10"
                                                        : "border-line hover:border-orange/50"
                                                )}
                                            >
                                                <span className="min-w-0">
                                                    {selectedTypes.length === 0 ? (
                                                        <span className="text-ink-soft">
                                                            Select document types
                                                        </span>
                                                    ) : (
                                                        <span className="flex flex-wrap items-center gap-1.5">
                                                            <span className="font-medium text-ink">
                                                                {selectedTypes.length} selected
                                                            </span>

                                                            {selectedTypes
                                                                .slice(0, 2)
                                                                .map((type) => (
                                                                    <span
                                                                        key={type.id}
                                                                        className="max-w-36 truncate rounded-md bg-paper px-1.5 py-0.5 text-xs text-ink-soft ring-1 ring-line"
                                                                    >
                                                                        {type.label}
                                                                    </span>
                                                                ))}

                                                            {selectedTypes.length > 2 && (
                                                                <span className="text-xs text-ink-soft">
                                                                    +{selectedTypes.length - 2} more
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                </span>

                                                <ChevronDown
                                                    className={cn(
                                                        "size-4 shrink-0 text-ink-soft transition-transform",
                                                        isOpen && "rotate-180"
                                                    )}
                                                />
                                            </button>

                                            {isOpen && (
                                                <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-line bg-paper shadow-xl">
                                                    <div className="border-b border-line p-3">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />

                                                            <Input
                                                                autoFocus
                                                                value={searchTerm}
                                                                onChange={(event) =>
                                                                    setSearchByLocation(
                                                                        (current) => ({
                                                                            ...current,
                                                                            [location.id]:
                                                                                event.target.value,
                                                                        })
                                                                    )
                                                                }
                                                                placeholder="Search document names..."
                                                                className="h-10 border-line bg-sand pl-9 pr-9 text-sm text-ink"
                                                            />

                                                            {searchTerm && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setSearchByLocation(
                                                                            (current) => ({
                                                                                ...current,
                                                                                [location.id]: "",
                                                                            })
                                                                        )
                                                                    }
                                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                                                                    aria-label="Clear search"
                                                                >
                                                                    <X className="size-4" />
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="mt-3 flex items-center justify-between gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    selectAllFilteredTypes(
                                                                        location,
                                                                        filteredTypes
                                                                    )
                                                                }
                                                                disabled={
                                                                    filteredTypes.length === 0
                                                                }
                                                                className="text-xs font-semibold text-orange-deep hover:underline disabled:opacity-40"
                                                            >
                                                                Select all
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    clearFilteredTypes(
                                                                        location,
                                                                        filteredTypes
                                                                    )
                                                                }
                                                                disabled={
                                                                    !filteredTypes.some(
                                                                        (type) =>
                                                                            location.documentTypeKeys.includes(
                                                                                type.key
                                                                            )
                                                                    )
                                                                }
                                                                className="text-xs font-medium text-ink-soft hover:text-ink disabled:opacity-40"
                                                            >
                                                                Clear selected
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="max-h-64 overflow-y-auto p-2">
                                                        {filteredTypes.length === 0 ? (
                                                            <p className="p-4 text-center text-xs text-ink-soft">
                                                                No matching document names.
                                                            </p>
                                                        ) : (
                                                            filteredTypes.map((type) => {
                                                                const checked =
                                                                    location.documentTypeKeys.includes(
                                                                        type.key
                                                                    );

                                                                return (
                                                                    <button
                                                                        key={type.id}
                                                                        type="button"
                                                                        onClick={() =>
                                                                            toggleDocumentType(
                                                                                location,
                                                                                type.key
                                                                            )
                                                                        }
                                                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-sand"
                                                                    >
                                                                        <span
                                                                            className={cn(
                                                                                "grid size-4 shrink-0 place-items-center rounded border",
                                                                                checked
                                                                                    ? "border-orange bg-orange text-white"
                                                                                    : "border-line bg-paper"
                                                                            )}
                                                                        >
                                                                            {checked && (
                                                                                <Check className="size-3" />
                                                                            )}
                                                                        </span>

                                                                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                                                                            {type.label || "Unnamed document"}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between border-t border-line bg-sand/50 px-3 py-2.5">
                                                        <span className="text-xs text-ink-soft">
                                                            {location.documentTypeKeys.length} selected
                                                        </span>

                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() =>
                                                                setOpenLocationId(null)
                                                            }
                                                            className="h-8 bg-orange text-white hover:bg-orange-deep"
                                                        >
                                                            Done
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            <p className="mt-1.5 text-xs text-ink-soft">
                                                Search and select the document types accepted here.
                                            </p>
                                        </div>

                                        <div className="space-y-3 rounded-lg bg-sand/50 p-3">

                                            <label className="flex items-center gap-2 text-sm text-ink">
                                                <input
                                                    type="checkbox"
                                                    checked={location.allowMultiple}
                                                    onChange={(event) =>
                                                        updateUploadLocation(
                                                            location.id,
                                                            {
                                                                allowMultiple: event.target.checked,
                                                            }
                                                        )
                                                    }
                                                    className="size-4 accent-orange"
                                                />
                                                Allow multiple files
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
                                {dirty ? "Unsaved changes" : "All changes saved"}
                            </p>

                            <p className="mt-1 text-xs text-sand/75">
                                {dirty
                                    ? "Save your changes to update the configuration."
                                    : "No pending changes."}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={discardChanges}
                                disabled={!dirty || saving}
                                className="border-sand/25 bg-transparent text-sand hover:bg-sand/10"
                            >
                                Discard
                            </Button>

                            <Button
                                type="button"
                                onClick={saveConfig}
                                disabled={!dirty || saving}
                                className="bg-orange text-white hover:bg-orange-deep"
                            >
                                <Save className="mr-2 size-4" />
                                {saving ? "Saving..." : "Save changes"}
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
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    return (
        <label className="block min-w-0">
            <span className="text-xs font-medium text-ink">{label}</span>

            <Input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="mt-1.5 h-10 border-line bg-sand text-ink"
            />
        </label>
    );
}