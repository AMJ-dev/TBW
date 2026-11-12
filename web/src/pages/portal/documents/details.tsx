
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Eye,
  FileCheck,
  FileText,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {useNavigate} from "react-router-dom"
import { AppShell, StatusBadge, Metric } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { resolveSrc } from "@/lib/functions";

type DocumentStatus =
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "CHANGES_REQUESTED"
  | "REJECTED"
  | "MISSING";

interface DocumentType {
  document_key: string;
  label: string;
  sort_order: number;
  is_required: boolean;
  allow_multiple: boolean;
}

interface DocumentItem {
  id: string;
  document_type: string;
  reference_code: string | null;
  original_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  status: DocumentStatus;
  review_reason?: string | null;
}

interface DocumentDetailsResponse {
  types: DocumentType[];
  documents: DocumentItem[];
}

type PageView = "LIST" | "UPLOAD" | "DELETE";

const formatFileSize = (bytes: number) => {
  if (!bytes) return "Unknown size";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
 
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDate = (value: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusLabel = (status: DocumentStatus) => {
  const labels: Record<DocumentStatus, string> = {
    PENDING_REVIEW: "Pending Review",
    VERIFIED: "Verified",
    CHANGES_REQUESTED: "Changes Requested",
    REJECTED: "Rejected",
    MISSING: "Missing",
  };

  return labels[status] ?? status;
};

const getStatusTone = (
  status: DocumentStatus
): "success" | "warning" | "critical" => {
  if (status === "VERIFIED") return "success";
  if (status === "REJECTED") return "critical";
  return "warning";
};

const canManageDocument = (status: DocumentStatus) => status !== "VERIFIED";

export default function PortalDocumentDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

const [pageView, setPageView] = useState<PageView>("LIST");
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replacingDocument, setReplacingDocument] = useState<DocumentItem | null>(null);
  const [deleteDocument, setDeleteDocument] = useState<DocumentItem | null>(null);

  const [docType, setDocType] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!id) {
      setError("Shipment ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await http.get(`/portal/documents/${id}/`);
      const resp: Resp = response.data;

      if (resp.error) {
        const message =
          typeof resp.data === "string"
            ? resp.data
            : "Could not load shipment documents.";

        setError(message);
        return;
      }

      const result = resp.code as DocumentDetailsResponse;

      const sortedTypes = [...result.types].sort((a, b) => a.sort_order - b.sort_order);
      setDocs(result.documents);
      setDocumentTypes(sortedTypes);

      setDocType((current) => {
        if (current && result.types.some((type) => type.document_key === current)) return current;
        return result.types[0]?.document_key ?? "";
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.data ||
        err?.response?.data?.message ||
        "Could not load shipment documents. Please try again.";

      setError(
        typeof message === "string"
          ? message
          : "Could not load shipment documents. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        doc.original_name.toLowerCase().includes(query) ||
        doc.document_type.toLowerCase().includes(query) ||
        (doc.reference_code ?? "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" || doc.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [docs, searchQuery, statusFilter]);

  const selectedDocumentType = documentTypes.find(type => type.document_key === docType);

  const verifiedCount = docs.filter(doc => doc.status === "VERIFIED").length;

  const pendingCount = docs.filter(doc => doc.status === "PENDING_REVIEW").length;

  const attentionCount = docs.filter(doc => doc.status === "MISSING" || doc.status === "CHANGES_REQUESTED" || doc.status === "REJECTED").length;

  const openDocument = (doc: DocumentItem) => {
    if (!doc.file_path) {
      toast.error("Document file is unavailable.");
      return;
    }

    window.open(
      resolveSrc(doc.file_path),
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openNewUpload = () => {
    setReplacingDocument(null);
    setUploadFile(null);
    setDocType(documentTypes[0]?.document_key ?? "");
    setIsModalOpen(true);
  };

  const openReplacement = (doc: DocumentItem) => {
    if (!canManageDocument(doc.status)) {
      toast.error("Verified documents cannot be replaced.");
      return;
    }

    setReplacingDocument(doc);
    setDocType("");
    setUploadFile(null);
    setIsModalOpen(true);
  };

  const closeUploadModal = () => {
    if (uploading) return;

    setIsModalOpen(false);
    setReplacingDocument(null);
    setUploadFile(null);
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id) {
      toast.error("Shipment ID is missing.");
      return;
    }

    if (!replacingDocument && !docType) {
      toast.error("Please select a document category.");
      return;
    }

    if (!uploadFile) {
      toast.error("Please select a document to upload.");
      return;
    }

    if (uploadFile.size > 10 * 1024 * 1024) {
      toast.error("File size must not exceed 10 MB.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(uploadFile.type)) {
      toast.error("Only PDF, JPG, PNG and WEBP files are allowed.");
      return;
    }

    if (replacingDocument && !canManageDocument(replacingDocument.status)) {
      toast.error("Verified documents cannot be replaced.");
      return;
    }

    const formData = new FormData();

    formData.append("id", id);
    if (!replacingDocument) formData.append("document_type", docType);
    formData.append("file", uploadFile);

    if (replacingDocument) formData.append("document_id", replacingDocument.id);

    setUploading(true);

    try {
      const response = await http.post("/portal/documents/uploads/", formData);

      const resp: Resp = response.data;

      if (resp.error) {
        toast.error(typeof resp.data === "string" ? resp.data : "Could not upload document.");
        return;
      }

      toast.success(
        replacingDocument
          ? "Document replaced successfully and submitted for review."
          : "Document uploaded successfully and submitted for review."
      );

      setIsModalOpen(false);
      setReplacingDocument(null);
        setUploadFile(null);

      await loadDocuments();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.data ||
          err?.response?.data?.message ||
          "Could not upload document. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDocument) return;

    if (!canManageDocument(deleteDocument.status)) {
      toast.error("Verified documents cannot be deleted.");
      setDeleteDocument(null);
      return;
    }

    setDeleting(true);

    try {
      const response = await http.post("/portal/documents/remove/",  {id: deleteDocument.id});

      const resp: Resp = response.data;

      if (resp.error) {
        toast.error(
          typeof resp.data === "string"
            ? resp.data
            : "Could not delete document."
        );
        return;
      }

      toast.success(
        typeof resp.data === "string"
          ? resp.data
          : "Document deleted successfully."
      );

      setDeleteDocument(null);
      await loadDocuments();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.data ||
          err?.response?.data?.message ||
          "Could not delete document. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell
      title="Shipment Documents"
      eyebrow="Portal · Document Management"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => navigate("/portal")}
            className="text-ink-soft transition-colors hover:text-orange"
          >
            Portal
          </button>

          <ChevronRight className="size-3.5 text-ink-soft" />

          <button
            type="button"
            onClick={() => navigate("/portal/documents")}
            className="text-ink-soft transition-colors hover:text-orange"
          >
            Documents
          </button>

          <ChevronRight className="size-3.5 text-ink-soft" />

          <span className="font-semibold text-ink">
            {pageView === "UPLOAD"
              ? replacingDocument
                ? "Replace Document"
                : "Upload Document"
              : pageView === "DELETE"
                ? "Delete Document"
                : "Shipment Details"}
          </span>
        </nav>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/portal/documents")}
          className="border-line bg-paper"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Documents
        </Button>
      </div>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Secure Shipment Records
            </p>

            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Document Center
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
              View, upload and manage documents submitted for this shipment.
              Verified documents are protected from modification.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-line bg-paper"
              onClick={() => void loadDocuments()}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            <Button
              className="bg-orange text-white hover:bg-orange-deep"
              onClick={openNewUpload}
              disabled={loading || documentTypes.length === 0}
            >
              <Upload className="mr-2 size-4" />
              Upload Document
            </Button>
          </div>
        </div>

        {loading && docs.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-paper py-16">
            <RefreshCw className="size-8 animate-spin text-orange" />
            <p className="mt-3 text-sm font-medium text-ink">
              Loading shipment documents...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-paper px-5 py-12 text-center">
            <AlertCircle className="mb-3 size-10 text-rose-500" />

            <h3 className="text-sm font-semibold text-ink">
              Could not load shipment documents
            </h3>

            <p className="mt-1 max-w-md text-xs leading-5 text-ink-soft">
              {error}
            </p>

            <Button
              onClick={() => void loadDocuments()}
              disabled={loading}
              className="mt-4 bg-orange text-white hover:bg-orange-deep"
            >
              <RefreshCw
                className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Retrying..." : "Retry"}
            </Button>
          </div>
        )}

        {(!loading || docs.length > 0) && !error && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Total Documents"
                value={String(docs.length)}
                detail="Documents submitted"
                tone="info"
                icon={FileText}
              />

              <Metric
                label="Verified"
                value={String(verifiedCount)}
                detail="Approved documents"
                tone="success"
                icon={FileCheck}
              />

              <Metric
                label="Pending Review"
                value={String(pendingCount)}
                detail="Awaiting operations review"
                tone="warning"
                icon={ShieldCheck}
              />

              <Metric
                label="Requires Attention"
                value={String(attentionCount)}
                detail="Changes requested or rejected"
                tone={attentionCount > 0 ? "warning" : "success"}
                icon={AlertCircle}
              />
            </div>

            <section className="overflow-hidden rounded-xl bg-paper ring-1 ring-line">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />

                  <Input
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(event.target.value)
                    }
                    placeholder="Search documents, reference or type..."
                    className="h-10 border-line bg-sand pl-9 text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-ink-soft">
                    <Filter className="size-3.5" />
                    Status:
                  </span>

                  {[
                    { label: "All", value: "ALL"},
                    { label: "Pending", value: "PENDING_REVIEW"},
                    { label: "Verified", value: "VERIFIED"},
                    { label: "Changes Requested", value: "CHANGES_REQUESTED"},
                    { label: "Rejected", value: "REJECTED"},
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setStatusFilter(item.value)}
                      className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        statusFilter === item.value
                          ? "bg-ink text-sand"
                          : "bg-sand text-ink-soft hover:bg-sand/70 hover:text-ink"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                      <th className="px-4 py-3 font-medium">Document</th>
                      <th className="px-4 py-3 font-medium">Reference</th>
                      <th className="px-4 py-3 font-medium">Uploaded</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-line">
                    {filteredDocs.map((doc) => {
                      const manageable = canManageDocument(doc.status);

                      return (
                        <tr
                          key={doc.id}
                          className="transition-colors hover:bg-sand/40"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sand text-orange-deep">
                                <FileText className="size-4" />
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[300px] truncate font-semibold text-ink">
                                  {doc.document_type}
                                </p>
                                <p className="text-[10px] text-ink-soft">
                                  {formatFileSize(doc.file_size)} 
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-teal-deep">
                            {doc.reference_code || "—"}
                          </td>

                          <td className="px-4 py-3.5 text-xs text-ink-soft">
                            {formatDate(doc.uploaded_at)}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="space-y-1.5">
                              <StatusBadge
                                label={statusLabel(doc.status)}
                                tone={getStatusTone(doc.status)}
                              />
                              {(doc.status === "MISSING" ||
                                doc.status === "REJECTED" ||
                                doc.status === "CHANGES_REQUESTED") && (
                                <p className="max-w-[280px] whitespace-normal text-[11px] leading-5 text-rose-700">
                                  <span className="font-semibold">
                                    {doc.status === "MISSING"
                                      ? "Missing document reason:"
                                      : doc.status === "REJECTED"
                                        ? "Rejection reason:"
                                        : "Required changes:"}
                                  </span>{" "}
                                  {doc.review_reason?.trim() || "No reason provided."}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDocument(doc)}
                                className="text-xs font-semibold text-ink hover:bg-sand"
                              >
                                <Eye className="mr-1 size-3.5" />
                                View
                              </Button>

                              {manageable ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openReplacement(doc)}
                                    className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
                                  >
                                    <Upload className="mr-1 size-3.5" />
                                    Replace
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteDocument(doc)}
                                    className="text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                  >
                                    <Trash2 className="mr-1 size-3.5" />
                                    Delete
                                  </Button>
                                </>
                              ) : (
                                <span className="flex items-center gap-1 px-2 text-[10px] font-medium text-orange">
                                  <ShieldCheck className="size-3.5" />
                                  "Locked"
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredDocs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center">
                          <FileText className="mx-auto size-8 text-ink-soft/50" />

                          <p className="mt-3 text-sm font-semibold text-ink">
                            No documents found
                          </p>

                          <p className="mt-1 text-xs text-ink-soft">
                            {docs.length === 0
                              ? "No documents have been uploaded for this shipment."
                              : "Try changing your search or status filter."}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-ink-soft">
                <span>
                  Showing {filteredDocs.length} of {docs.length} documents
                </span>

                <span>Shipment document register</span>
              </div>
            </section>
          </>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeUploadModal();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-paper p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-teal-deep">
                  Shipment Document Intake
                </p>

                <h3 className="mt-1 font-display text-xl font-bold text-ink">
                  {replacingDocument
                    ? "Replace Document"
                    : "Upload Document"}
                </h3>

                <p className="mt-1 text-xs text-ink-soft">
                  {replacingDocument
                    ? "Select the replacement file. Its existing document category will remain unchanged."
                    : "Select the document category and attach the correct file."}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={closeUploadModal}
                disabled={uploading}
              >
                <X className="size-4" />
              </Button>
            </div>

            {replacingDocument && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-900">
                  Replacing: {replacingDocument.original_name}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-amber-800">
                  Only the file will be replaced. The existing document category will remain unchanged, and the new file will be submitted for review.
                </p>
              </div>
            )}

            <form onSubmit={handleUpload} className="mt-5 space-y-4">
              {!replacingDocument && (
                <div>
                  <label className="block text-xs font-semibold text-ink">
                    Document Category
                  </label>

                  <select
                    required
                    value={docType}
                    onChange={(event) => setDocType(event.target.value)}
                    disabled={uploading}
                    className="mt-1.5 h-11 w-full rounded-lg border border-line bg-sand px-3 text-sm outline-none focus:border-orange disabled:opacity-70"
                  >
                    <option value="" disabled>
                      Select document category
                    </option>

                    {documentTypes.map((type) => (
                      <option
                        key={type.document_key}
                        value={type.document_key}
                      >
                        {type.label}
                      </option>
                    ))}
                  </select>

                  {selectedDocumentType && (
                    <p className="mt-2 text-[11px] leading-5 text-ink-soft">
                      {selectedDocumentType.allow_multiple
                        ? "Multiple files are allowed."
                        : "Only one file is allowed for this category."}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink">
                  Upload Destination
                </label>

                <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-line bg-sand/60 p-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-paper text-orange-deep">
                    <FileCheck className="size-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Shipment Documents
                    </p>
                    <p className="text-[11px] text-ink-soft">
                      This file belongs to the selected shipment.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">
                  Document File
                </label>

                <label className="mt-1.5 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-line bg-sand/40 px-4 py-7 text-center transition hover:border-orange hover:bg-orange/5">
                  <Upload className="size-8 text-orange" />

                  <span className="mt-2 max-w-full truncate text-sm font-semibold text-ink">
                    {uploadFile
                      ? uploadFile.name
                      : "Choose a document to upload"}
                  </span>

                  <span className="mt-1 text-[11px] text-ink-soft">
                    PDF, JPG, PNG or WEBP · Maximum 10 MB
                  </span>

                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setUploadFile(file);
                      event.target.value = "";
                    }}
                  />
                </label>

                {uploadFile && (
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => setUploadFile(null)}
                    className="mt-2 text-xs font-medium text-rose-600 hover:underline"
                  >
                    Remove selected file
                  </button>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="border-line"
                  onClick={closeUploadModal}
                  disabled={uploading}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={(!replacingDocument && !docType) || !uploadFile || uploading}
                  className="bg-orange text-white hover:bg-orange-deep"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="mr-2 size-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 size-4" />
                      {replacingDocument ? "Replace Document" : "Upload Document"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteDocument && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleting
            ) {
              setDeleteDocument(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-5 shadow-2xl">
            <div className="flex size-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Trash2 className="size-5" />
            </div>

            <h3 className="mt-4 text-base font-bold text-ink">
              Delete document?
            </h3>

            <p className="mt-2 text-sm leading-6 text-ink-soft">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-ink">
                {deleteDocument.original_name}
              </span>
              ? This document will no longer appear in the active shipment
              document list.
            </p>

            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-900">
              This permanently removes the document record and its stored file. Verified documents cannot be deleted.
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="border-line"
                onClick={() => setDeleteDocument(null)}
                disabled={deleting}
              >
                Cancel
              </Button>

              <Button
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 size-4" />
                    Delete Document
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
