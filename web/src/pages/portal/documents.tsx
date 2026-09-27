import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  reference: string;
  uploadedBy: string;
  uploadDate: string;
  version: string;
  status: "Verified" | "Under Review" | "Action Required" | "Superseded";
  fileSize: string;
}

const initialDocuments: DocumentItem[] = [
  {
    id: "doc-1",
    name: "Master Bill of Lading (TRN-BL-2026-008721)",
    type: "Bill of Lading",
    reference: "TRN-BL-2026-008721",
    uploadedBy: "TRÏNŪ Ocean Service",
    uploadDate: "07 Sep 2026",
    version: "v1.2 Signed",
    status: "Verified",
    fileSize: "2.4 MB",
  },
  {
    id: "doc-2",
    name: "Customs Single Goods Declaration (SGD C-4891)",
    type: "Customs Declaration",
    reference: "NCS-SGD-2026-4891",
    uploadedBy: "Meridian Customs Services",
    uploadDate: "08 Sep 2026",
    version: "v1.0 Assessment",
    status: "Verified",
    fileSize: "1.8 MB",
  },
  {
    id: "doc-3",
    name: "Shipping Line Delivery Order (DO Authorization)",
    type: "Delivery Order",
    reference: "TRN-DO-2026-008721",
    uploadedBy: "TRÏNŪ Desk",
    uploadDate: "08 Sep 2026",
    version: "v1.0 Final",
    status: "Verified",
    fileSize: "940 KB",
  },
  {
    id: "doc-4",
    name: "Commercial Invoice & Packing List",
    type: "Commercial Record",
    reference: "INV-ATL-88210",
    uploadedBy: "Atlantic Trade Nigeria Ltd",
    uploadDate: "06 Sep 2026",
    version: "v1.1",
    status: "Verified",
    fileSize: "3.1 MB",
  },
  {
    id: "doc-5",
    name: "SONCAP Quality Certificate",
    type: "Regulatory Certificate",
    reference: "SON-QC-99281-26",
    uploadedBy: "Atlantic Trade Nigeria Ltd",
    uploadDate: "09 Sep 2026",
    version: "v1.0 Draft",
    status: "Under Review",
    fileSize: "1.2 MB",
  },
];

export default function PortalDocumentsRoute() {
  const [docs, setDocs] = useState<DocumentItem[]>(initialDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("Commercial Invoice");
  const [docRef, setDocRef] = useState("");

  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      const matchQuery =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === "ALL" ? true : d.status.toUpperCase() === statusFilter.toUpperCase();

      return matchQuery && matchStatus;
    });
  }, [docs, searchQuery, statusFilter]);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !docRef) {
      toast.error("Please provide document name and reference.");
      return;
    }

    const newDoc: DocumentItem = {
      id: `doc-${docs.length + 1}`,
      name: docName,
      type: docType,
      reference: docRef,
      uploadedBy: "Atlantic Trade (Self)",
      uploadDate: "Today",
      version: "v1.0 Initial",
      status: "Under Review",
      fileSize: "1.5 MB",
    };

    setDocs([newDoc, ...docs]);
    setIsModalOpen(false);
    setDocName("");
    setDocRef("");
    toast.success(`Document "${docName}" uploaded and queued for Customs desk review.`);
  };

  return (
    <AppShell title="Document Center" eyebrow="Customer Portal · Controlled Records">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            Secure Digital Repository · Cryptographic Verification
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Controlled Clearance Documents
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
            Upload and review bills of lading, Single Goods Declarations (SGD), delivery orders, and regulatory approvals.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-line bg-paper"
            onClick={() => toast.success("Document dossier downloaded as encrypted ZIP.")}
          >
            <Download className="size-4" /> Download All
          </Button>
          <Button
            className="bg-orange text-white hover:bg-orange-deep"
            onClick={() => setIsModalOpen(true)}
          >
            <Upload className="size-4" /> Upload Document
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Verified Records" value={String(docs.filter(d => d.status === "Verified").length)} detail="Ready for release" tone="success" icon={FileCheck} />
        <Metric label="Under Review" value={String(docs.filter(d => d.status === "Under Review").length)} detail="Assigned to Customs desk" tone="warning" icon={FileText} />
        <Metric label="Required for Release" value="0 Outstanding" detail="All statutory criteria met" tone="success" icon={CheckCircle2} />
        <Metric label="Integrity Signatures" value="SHA-256 Valid" detail="Tamper-proof storage" tone="info" icon={ShieldCheck} />
      </div>

      <section className="rounded-xl bg-paper ring-1 ring-line">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by document name, reference, or type..."
              className="h-10 border-line bg-sand pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-ink-soft">
              <Filter className="size-3.5" /> Status:
            </span>
            {["ALL", "Verified", "Under Review", "Action Required"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-ink text-sand"
                    : "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                <th className="px-4 py-3 font-medium">Document Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Reference Code</th>
                <th className="px-4 py-3 font-medium">Uploaded By</th>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="transition-colors hover:bg-sand/60">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-ink">{doc.name}</p>
                    <p className="font-mono text-[10px] text-ink-soft">{doc.fileSize} · {doc.uploadDate}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-ink">{doc.type}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-teal-deep font-semibold">
                    {doc.reference}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-ink-soft">{doc.uploadedBy}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-ink-soft">{doc.version}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge
                      label={doc.status}
                      tone={doc.status === "Verified" ? "success" : doc.status === "Action Required" ? "critical" : "warning"}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.success(`Viewing ${doc.name}`)}
                      className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
                    >
                      <Eye className="mr-1 size-3.5" /> View PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
          <span>
            Showing {filteredDocs.length} of {docs.length} controlled documents
          </span>
          <span>Encrypted with SHA-256 Checksums for Public QR Verification</span>
        </div>
      </section>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className="w-full max-w-lg rounded-xl bg-paper p-6 shadow-2xl ring-1 ring-line">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-teal-deep">
                  Document Intake
                </p>
                <h3 className="mt-1 font-display text-xl font-bold">Upload Cargo Clearance Document</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X />
              </Button>
            </div>

            <form onSubmit={handleUpload} className="mt-5 space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  Document Description / Title
                </label>
                <Input
                  required
                  placeholder="e.g. Endorsed Delivery Order"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="mt-1.5 border-line bg-sand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Category
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs outline-none"
                  >
                    <option>Bill of Lading</option>
                    <option>Customs Declaration (SGD)</option>
                    <option>Delivery Order</option>
                    <option>Commercial Invoice</option>
                    <option>Regulatory Certificate</option>
                    <option>Packing List</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Reference Number
                  </label>
                  <Input
                    required
                    placeholder="e.g. TRN-DO-2026-99"
                    value={docRef}
                    onChange={(e) => setDocRef(e.target.value)}
                    className="mt-1.5 border-line bg-sand font-mono text-xs"
                  />
                </div>
              </div>

              <div className="rounded-lg border-2 border-dashed border-line p-6 text-center">
                <Upload className="mx-auto size-8 text-ink-soft" />
                <p className="mt-2 text-xs font-semibold text-ink">Choose PDF, PNG, or JPG file to upload</p>
                <p className="mt-1 font-mono text-[10px] text-ink-soft">Maximum file size: 25 MB</p>
              </div>

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
                  Upload & Queue
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
