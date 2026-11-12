
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
    ArrowLeft,
    Check,
    Eye,
    FileText,
    Loader2,
    ShieldCheck,
    X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";
import { resolveSrc } from "@/lib/functions";

type DocumentStatus =
    | "VERIFIED"
    | "PENDING_REVIEW"
    | "CHANGES_REQUESTED"
    | "REJECTED"
    | "MISSING";

type ReviewStatus = "VERIFIED" | "CHANGES_REQUESTED" | "REJECTED";

type Shipment = {
    id: string;
    shipment_reference: string;
    bill_of_lading?: string | null;
    consignee?: string | null;
    cargo_description?: string | null;
    status?: string;
    document_status?: DocumentStatus;
    organisation_name?: string | null;
    container_count?: number;
};

type ShipmentDocument = {
    id: string;
    shipment_id: string;
    reference_code?: string | null;
    document_type: string;
    original_name: string;
    stored_name?: string;
    file_path: string;
    mime_type?: string;
    file_size?: number;
    status: DocumentStatus;
    uploaded_at?: string;
};

type ExpectedDocument = {
    document_key?: string;
    document_type?: string;
    document_name?: string;
    label?: string;
    name?: string;
    description?: string;
    required?: boolean | number;
    is_required?: boolean | number;
    allow_multiple?: boolean | number;
    sort_order?: number;
};

type DocumentDetails = {
    shipment: Shipment;
    documents: ShipmentDocument[];
    types: ExpectedDocument[];
};

type ReviewEntry = {
    status: ReviewStatus;
    reason: string;
};

const labelClass =
    "block text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-soft";

const statusLabel: Record<DocumentStatus, string> = {
    VERIFIED: "Verified",
    PENDING_REVIEW: "Pending Review",
    CHANGES_REQUESTED: "Changes Requested",
    REJECTED: "Rejected",
    MISSING: "Missing",
};

const formatStatus = (status?: string) => {
    if (!status) return "Unknown";

    return status
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

const formatDate = (value?: string) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

const formatFileSize = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
    return (
        <StatusBadge
            label={statusLabel[status] || formatStatus(status)}
            tone={statusTone(status)}
        />
    );
}

export default function OperationDocumentDetailsPage() {
    const navigate = useNavigate();
    const { id: routeId } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const id = routeId || searchParams.get("id") || "";

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [documents, setDocuments] = useState<ShipmentDocument[]>([]);
    const [types, setTypes] = useState<ExpectedDocument[]>([]);

    const [reviewOpen, setReviewOpen] = useState(false);
    const [reviewEntries, setReviewEntries] = useState<
        Record<string, ReviewEntry>
    >({});
    const [requestedMissing, setRequestedMissing] = useState<
        Record<string, boolean>
    >({});
    const [missingReasons, setMissingReasons] = useState<
        Record<string, string>
    >({});
    const [submittingReview, setSubmittingReview] = useState(false);
    const [showMissingTypes, setShowMissingTypes] = useState(false);

    const loadDetails = useCallback(
        async (showLoader = true) => {
            if (!id) {
                setLoading(false);
                toast.error("Shipment ID is missing.");
                return;
            }

            if (showLoader) setLoading(true);
            else setRefreshing(true);

            try {
                const res = await http.get(`/operations/documents/${id}/`);
                const resp: Resp = res.data;

                if (resp.error) {
                    toast.error(
                        typeof resp.data === "string"
                            ? resp.data
                            : "Could not load shipment documents."
                    );
                    return;
                }

                const result = resp.code as DocumentDetails;

                setShipment(result?.shipment || null);
                setDocuments(
                    Array.isArray(result?.documents)
                        ? result.documents
                        : []
                );
                setTypes(
                    Array.isArray(result?.types) ? result.types : []
                );
            } catch {
                toast.error("Could not load shipment documents.");
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [id]
    );

    useEffect(() => {
        loadDetails();
    }, [loadDetails]);

    const counts = useMemo(
        () => ({
            total: documents.length,
            verified: documents.filter(
                (document) => document.status === "VERIFIED"
            ).length,
            pending: documents.filter(
                (document) => document.status === "PENDING_REVIEW"
            ).length,
            missing: documents.filter(
                (document) => document.status === "MISSING"
            ).length,
            rejected: documents.filter(
                (document) => document.status === "REJECTED"
            ).length,
            changes: documents.filter(
                (document) => document.status === "CHANGES_REQUESTED"
            ).length,
        }),
        [documents]
    );

    const verificationProgress = counts.total > 0
        ? Math.min(100, Math.round((counts.verified / counts.total) * 100))
        : 0;

    const openDocument = (document: ShipmentDocument) => {
        if (!document.file_path) {
            toast.error("Document file is unavailable.");
            return;
        }

        window.open(
            resolveSrc(document.file_path),
            "_blank",
            "noopener,noreferrer"
        );
    };

    const openReview = () => {
        const entries: Record<string, ReviewEntry> = {};

        documents.forEach((document) => {
            entries[document.id] = {
                status:
                    document.status === "VERIFIED" ||
                    document.status === "CHANGES_REQUESTED" ||
                    document.status === "REJECTED"
                        ? document.status
                        : "VERIFIED",
                reason: "",
            };
        });

        setReviewEntries(entries);
        setRequestedMissing({});
        setMissingReasons({});
        setReviewOpen(true);
    };

    const updateReviewEntry = (
        documentId: string,
        field: keyof ReviewEntry,
        value: string
    ) => {
        setReviewEntries((previous) => {
            const current = previous[documentId] ?? {
                status: "VERIFIED",
                reason: "",
            };

            const entry: ReviewEntry =
                field === "status"
                    ? { status: value as ReviewStatus, reason: current.reason }
                    : { status: current.status, reason: value };

            return {
                ...previous,
                [documentId]: entry,
            };
        });
    };

    const submitReview = async () => {
        const selectedDocuments = documents.filter(
            (document) => reviewEntries[document.id]
        );

        for (const document of selectedDocuments) {
            const entry = reviewEntries[document.id]!;

            if (
                (entry.status === "CHANGES_REQUESTED" ||
                    entry.status === "REJECTED") &&
                !entry.reason.trim()
            ) {
                toast.error(
                    `Enter a reason for ${document.document_type}.`
                );
                return;
            }
        }

        const selectedMissing = types.filter(
            (item) => requestedMissing[item.document_key || ""]
        );

        setSubmittingReview(true);

        try {
            const res = await http.post(
                "/operations/documents/status-change/",
                {
                    action: "BULK_UPDATE",
                    shipment_id: id,
                    status_changes: selectedDocuments.map((document) => {
                        const entry = reviewEntries[document.id]!;

                        return {
                            id: document.id,
                            status: entry.status,
                            reason: entry.reason.trim(),
                        };
                    }),
                    missing_documents: selectedMissing.map((item) => {
                        const key = item.document_key || "";

                        return {
                            document_key: key,
                            document_type: item.label || key || "Document",
                            reason: missingReasons[key]?.trim() || "",
                        };
                    }),
                }
            );

            const resp: Resp = res.data;

            if (resp.error) {
                toast.error(
                    typeof resp.data === "string"
                        ? resp.data
                        : "Could not submit document review."
                );
                return;
            }

            toast.success("Document review submitted successfully.");
            setReviewOpen(false);
            await loadDetails(false);
        } catch {
            toast.error("Could not submit document review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <AppShell
                title="Shipment Documents"
                eyebrow="Operations · Document Control"
            >
                <div className="rounded-xl border border-line bg-paper p-6">
                    <div className="flex items-center gap-3 text-sm text-ink-soft">
                        <Loader2 className="size-5 animate-spin text-orange" />
                        Loading shipment documents...
                    </div>
                </div>
            </AppShell>
        );
    }

    if (!shipment) {
        return (
            <AppShell
                title="Shipment Documents"
                eyebrow="Operations · Document Control"
            >
                <div className="space-y-5 pb-8">
                    <Button
                        variant="outline"
                        className="border-line"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="mr-2 size-4" />
                        Back
                    </Button>

                    <section className="rounded-xl border border-line bg-paper px-5 py-14 text-center">
                        <FileText className="mx-auto size-9 text-ink-soft/60" />
                        <h2 className="mt-3 text-base font-semibold text-ink">
                            Shipment not found
                        </h2>
                        <p className="mt-1 text-sm text-ink-soft">
                            No shipment matches the ID in this route.
                        </p>
                    </section>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell
            title="Shipment Documents"
            eyebrow="Operations · Document Control"
        >
            <div className="space-y-5 pb-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button
                        variant="outline"
                        className="border-line"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="mr-2 size-4" />
                        Back to documents
                    </Button>

                    <StatusBadge
                        label={formatStatus(shipment.status)}
                        tone={statusTone(shipment.status || "")}
                    />
                </div>

                <section className="rounded-xl border border-line bg-paper p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <p className={labelClass}>
                                Shipment documentation file
                            </p>
                            <h2 className="mt-1 break-all font-display text-xl font-bold text-ink sm:text-2xl">
                                {shipment.shipment_reference}
                            </h2>
                            <p className="mt-2 text-xs text-ink-soft">
                                Bill of Lading: {shipment.bill_of_lading || "—"}
                            </p>
                        </div>

                        <div className="w-full lg:max-w-xs">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-ink">
                                    Document verification
                                </span>
                                <span className="font-mono font-bold text-orange-deep">
                                    {verificationProgress}%
                                </span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
                                <div
                                    className="h-full rounded-full bg-orange transition-all"
                                    style={{
                                        width: `${verificationProgress}%`,
                                    }}
                                />
                            </div>
                            <p className="mt-1.5 text-[11px] text-ink-soft">
                                {counts.verified} of {counts.total} expected
                                documents verified
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                            <p className={labelClass}>Organisation</p>
                            <p className="mt-1 text-sm font-semibold text-ink">
                                {shipment.organisation_name || "—"}
                            </p>
                        </div>
                        <div>
                            <p className={labelClass}>Consignee</p>
                            <p className="mt-1 text-sm font-semibold text-ink">
                                {shipment.consignee || "—"}
                            </p>
                        </div>
                        <div>
                            <p className={labelClass}>Cargo description</p>
                            <p className="mt-1 text-sm font-semibold text-ink">
                                {shipment.cargo_description || "—"}
                            </p>
                        </div>
                        <div>
                            <p className={labelClass}>Containers</p>
                            <p className="mt-1 text-sm font-semibold text-ink">
                                {shipment.container_count ?? 0}
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
                    {[
                        ["Expected", counts.total, "text-ink"],
                        ["Verified", counts.verified, "text-orange"],
                        ["Pending", counts.pending, "text-orange-deep"],
                        ["Missing", counts.missing, "text-ink-soft"],
                        [
                            "Rejected / Changes",
                            counts.rejected + counts.changes,
                            "text-rose-700",
                        ],
                    ].map(([label, value, color]) => (
                        <div
                            key={label}
                            className="rounded-xl border border-line bg-paper p-4"
                        >
                            <p className={labelClass}>{label}</p>
                            <p
                                className={cn(
                                    "mt-2 font-display text-2xl font-bold",
                                    color
                                )}
                            >
                                {value}
                            </p>
                        </div>
                    ))}
                </div>

                <section className="overflow-hidden rounded-xl border border-line bg-paper shadow-sm">
                    <div className="border-b border-line p-4">
                        <h3 className="font-display text-lg font-bold text-ink">
                            Uploaded documents
                        </h3>
                        <p className="mt-1 text-xs text-ink-soft">
                            View uploaded files and use the review button below
                            to manage their statuses.
                        </p>
                    </div>

                    {documents.length === 0 ? (
                        <div className="p-10 text-center">
                            <FileText className="mx-auto size-9 text-ink-soft/60" />
                            <p className="mt-3 text-sm font-semibold text-ink">
                                No documents uploaded
                            </p>
                            <p className="mt-1 text-xs text-ink-soft">
                                Outstanding requirements are shown below.
                            </p>
                        </div>
                    ) : (
                        documents.map((document) => (
                            <div
                                key={document.id}
                                className="flex flex-col gap-3 border-b border-line p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="flex min-w-0 items-start gap-3">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sand text-ink-soft">
                                        <FileText className="size-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-ink">
                                            {document.document_type}
                                        </p>
                                        <p className="mt-1 truncate text-xs text-ink-soft">
                                            {document.original_name}
                                        </p>
                                        <p className="mt-1 text-[11px] text-ink-soft">
                                            {formatDate(document.uploaded_at)}
                                            {" · "}
                                            {formatFileSize(document.file_size)}
                                            {document.reference_code
                                                ? ` · Ref: ${document.reference_code}`
                                                : ""}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <DocumentStatusBadge
                                        status={document.status}
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 border-line"
                                        onClick={() => openDocument(document)}
                                    >
                                        <Eye className="mr-1.5 size-3.5" />
                                        View
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}

                    {shipment.document_status === "PENDING_REVIEW" && (
                        <div className="border-t border-line bg-sand/20 p-4">
                            <Button
                                className="h-11 w-full bg-orange text-white hover:bg-orange-deep sm:w-auto"
                                onClick={openReview}
                            >
                                <ShieldCheck className="mr-2 size-4" />
                                Review Documents
                                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                                    {documents.length}
                                </span>
                            </Button>
                        </div>
                    )}
                </section>
            </div>

            {reviewOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-3 backdrop-blur-sm sm:p-5">
                    <section className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-line p-5">
                            <div>
                                <h3 className="font-display text-xl font-bold text-ink">
                                    Review Shipment Documents
                                </h3>
                                <p className="mt-1 text-xs text-ink-soft">
                                    Set the status of each uploaded document and
                                    request any missing documents.
                                </p>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setReviewOpen(false)}
                                disabled={submittingReview}
                            >
                                <X className="size-5" />
                            </Button>
                        </div>

                        <div className="flex-1 space-y-6 overflow-y-auto p-5">
                            <div>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-bold text-ink">
                                            Uploaded documents
                                        </h4>
                                        <p className="mt-1 text-xs text-ink-soft">
                                            Select a review status for each
                                            document.
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-ink">
                                        {documents.length} files
                                    </span>
                                </div>

                                {documents.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-ink-soft">
                                        No uploaded documents to review.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {documents.map((document) => {
                                            const entry =
                                                reviewEntries[document.id];

                                            return (
                                                <div
                                                    key={document.id}
                                                    className="rounded-xl border border-line p-4"
                                                >
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sand text-ink-soft">
                                                                <FileText className="size-4" />
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-ink">
                                                                    {document.document_type}
                                                                </p>
                                                                <p className="mt-1 truncate text-xs text-ink-soft">
                                                                    {document.original_name}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 border-line"
                                                            onClick={() =>
                                                                openDocument(
                                                                    document
                                                                )
                                                            }
                                                        >
                                                            <Eye className="mr-1.5 size-3.5" />
                                                            View file
                                                        </Button>
                                                    </div>

                                                    <div className="mt-4">
                                                        <label
                                                            className={labelClass}
                                                        >
                                                            Document status
                                                        </label>
                                                        <select
                                                            value={
                                                                entry?.status ||
                                                                "VERIFIED"
                                                            }
                                                            onChange={(event) =>
                                                                updateReviewEntry(
                                                                    document.id,
                                                                    "status",
                                                                    event.target
                                                                        .value
                                                                )
                                                            }
                                                            className="mt-2 h-10 w-full rounded-lg border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-orange focus:ring-2 focus:ring-orange/15"
                                                        >
                                                            <option value="VERIFIED">
                                                                Verified
                                                            </option>
                                                            <option value="CHANGES_REQUESTED">
                                                                Changes Requested
                                                            </option>
                                                            <option value="REJECTED">
                                                                Rejected
                                                            </option>
                                                        </select>

                                                        {(entry?.status ===
                                                            "CHANGES_REQUESTED" ||
                                                            entry?.status ===
                                                                "REJECTED") && (
                                                            <div className="mt-3">
                                                                <label className="block text-xs font-semibold text-ink">
                                                                    {entry.status ===
                                                                    "REJECTED"
                                                                        ? "Reason for rejection *"
                                                                        : "Required changes *"}
                                                                </label>
                                                                <textarea
                                                                    rows={3}
                                                                    maxLength={
                                                                        1000
                                                                    }
                                                                    value={
                                                                        entry.reason
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        updateReviewEntry(
                                                                            document.id,
                                                                            "reason",
                                                                            event
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    placeholder={
                                                                        entry.status ===
                                                                        "REJECTED"
                                                                            ? "Explain why this document is rejected..."
                                                                            : "Explain what needs to be corrected..."
                                                                    }
                                                                    className="mt-2 w-full resize-y rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-orange focus:ring-2 focus:ring-orange/15"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-line pt-5">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-bold text-ink">
                                            Missing Documents
                                        </h4>
                                        <p className="mt-1 text-xs text-ink-soft">
                                            Add one or more document types for the organisation to submit.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="border-line"
                                        onClick={() => setShowMissingTypes((previous) => !previous)}
                                    >
                                        {showMissingTypes ? (
                                            <X className="mr-1.5 size-4" />
                                        ) : (
                                            <FileText className="mr-1.5 size-4" />
                                        )}
                                        {showMissingTypes ? "Close" : "Add Missing Document"}
                                    </Button>
                                </div>

                                {showMissingTypes && (
                                    <div className="mb-4 rounded-xl border border-line bg-sand/30 p-3">
                                        <p className="mb-3 text-xs font-semibold text-ink">
                                            Select document types
                                        </p>
                                        <div className="max-h-64 space-y-2 overflow-y-auto">
                                            {types.map((type) => {
                                                const key = type.document_key || "";
                                                const label = type.label || key;
                                                const checked = !!requestedMissing[key];
                                                const required = type.is_required === true || type.is_required === 1 || type.required === true || type.required === 1;
                                                const multiple = type.allow_multiple === true || type.allow_multiple === 1;

                                                return (
                                                    <label
                                                        key={key}
                                                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-paper p-3 hover:border-orange/50"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={(event) => {
                                                                setRequestedMissing((previous) => ({
                                                                    ...previous,
                                                                    [key]: event.target.checked,
                                                                }));
                                                                if (!event.target.checked) {
                                                                    setMissingReasons((previous) => {
                                                                        const updated = { ...previous };
                                                                        delete updated[key];
                                                                        return updated;
                                                                    });
                                                                }
                                                            }}
                                                            className="size-4 rounded border-line accent-orange"
                                                        />
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block text-sm font-semibold text-ink">
                                                                {label}
                                                            </span>
                                                            <span className="mt-1 block text-[11px] text-ink-soft">
                                                                {required ? "Required" : "Optional"}
                                                                {" · "}
                                                                {multiple ? "Multiple files allowed" : "Single file"}
                                                            </span>
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                            {types.length === 0 && (
                                                <p className="py-5 text-center text-sm text-ink-soft">
                                                    No document types are configured.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {types
                                        .filter((type) => requestedMissing[type.document_key || ""])
                                        .map((type) => {
                                            const key = type.document_key || "";
                                            const label = type.label || key;

                                            return (
                                                <div
                                                    key={key}
                                                    className="rounded-xl border border-orange/30 bg-orange/5 p-4"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="text-sm font-semibold text-ink">
                                                            {label}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setRequestedMissing((previous) => ({
                                                                    ...previous,
                                                                    [key]: false,
                                                                }));
                                                                setMissingReasons((previous) => {
                                                                    const updated = { ...previous };
                                                                    delete updated[key];
                                                                    return updated;
                                                                });
                                                            }}
                                                            className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                    <label className="mt-3 block text-xs font-semibold text-ink">
                                                        Request reason (optional)
                                                    </label>
                                                    <textarea
                                                        rows={3}
                                                        maxLength={1000}
                                                        value={missingReasons[key] || ""}
                                                        onChange={(event) =>
                                                            setMissingReasons((previous) => ({
                                                                ...previous,
                                                                [key]: event.target.value,
                                                            }))
                                                        }
                                                        placeholder={`Add a reason for requesting ${label} (optional)...`}
                                                        className="mt-2 w-full resize-y rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-orange focus:ring-2 focus:ring-orange/15"
                                                    />
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-line bg-sand/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <Button
                                variant="outline"
                                className="border-line"
                                onClick={() => setReviewOpen(false)}
                                disabled={submittingReview}
                            >
                                Cancel
                            </Button>

                            <Button
                                className="bg-orange text-white hover:bg-orange-deep"
                                onClick={submitReview}
                                disabled={submittingReview}
                            >
                                {submittingReview ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 size-4" />
                                )}
                                Submit Document Review
                            </Button>
                        </div>
                    </section>
                </div>
            )}
        </AppShell>
    );
}
