import { useEffect, useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	Building2,
	CheckCircle2,
	Clock3,
	FileText,
	Globe,
	Mail,
	MapPin,
	Phone,
	Plus,
	Save,
	ShieldCheck,
	ShieldX,
	Trash2,
	Upload,
	Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { sectorOptions } from "@/lib/constants";
import { http, type Resp } from "@/lib/httpClient";
import { resolveSrc } from "@/lib/functions";

type OrgStatus =
	| "pending"
	| "under_review"
	| "verified"
	| "rejected"
	| "suspended";

type OrgType = "terminal" | "importer" | "agent";

interface ApiDocument {
	id: string;
	kind: string;
	label: string;
	file_name: string;
	file_url: string;
	status: "pending" | "approved" | "rejected" | string;
	rejection_reason: string | null;
	reviewed_by: string | null;
	reviewed_at: string | null;
	uploaded_at: string;
}

interface OrganisationConfig {
	legalName: string;
	tradingName: string;
	orgType: OrgType;
	status: OrgStatus;
	rcNumber: string;
	tin: string;
	dateOfIncorporation: string;
	sector: string;
	registeredAddress: string;
	operatingAddress: string;
	website: string;
	contactEmail: string;
	contactPhone: string;
	contactPerson: string;
	contactPersonTitle: string;
}

interface OrgMeta {
	rejectionReason: string | null;
	verifiedBy: string | null;
	verifiedAt: string | null;
	createdAt: string | null;
	updatedAt: string | null;
}

const emptyConfig: OrganisationConfig = {
	legalName: "",
	tradingName: "",
	orgType: "terminal",
	status: "pending",
	rcNumber: "",
	tin: "",
	dateOfIncorporation: "",
	sector: "",
	registeredAddress: "",
	operatingAddress: "",
	website: "",
	contactEmail: "",
	contactPhone: "",
	contactPerson: "",
	contactPersonTitle: "",
};

const emptyMeta: OrgMeta = {
	rejectionReason: null,
	verifiedBy: null,
	verifiedAt: null,
	createdAt: null,
	updatedAt: null,
};

const statusLabel: Record<OrgStatus, string> = {
	pending: "Pending",
	under_review: "Under review",
	verified: "Verified",
	rejected: "Rejected",
	suspended: "Suspended",
};

const DOCUMENT_KINDS = [
	{ value: "cac", label: "CAC Certificate" },
	{ value: "tin", label: "Tax Identification" },
	{ value: "signatory_id", label: "Authorised Signatory ID" },
	{ value: "directors_list", label: "Directors & Shareholders List" },
	{ value: "utility_bill", label: "Utility Bill (Proof of Address)" },
	{ value: "licence", label: "Operational Licence" },
	{ value: "other", label: "Other document" },
];

const MAX_DOC_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = [
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/webp",
];

const formatDate = (input: string | null) => {
	if (!input) return "—";
	const d = new Date(input);
	if (Number.isNaN(d.getTime())) return "—";
	return d.toLocaleString("en-NG", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const pickFirstArray = (payload: any): ApiDocument[] => {
	const candidates = [
		payload?.documents,
		payload?.docs,
		payload?.kyc_documents,
		payload?.organisation?.documents,
		payload?.organization?.documents,
	];
	for (const c of candidates) {
		if (Array.isArray(c)) return c as ApiDocument[];
	}
	return [];
};

const normaliseDocument = (raw: any): ApiDocument => ({
	id: String(raw?.id ?? raw?.document_id ?? ""),
	kind: raw?.kind ?? raw?.document_type ?? "document",
	label: raw?.label ?? raw?.name ?? raw?.kind ?? "Document",
	file_name: raw?.file_name ?? raw?.filename ?? "—",
	file_url: raw?.file_url ?? raw?.url ?? "",
	status: raw?.status ?? "pending",
	rejection_reason: raw?.rejection_reason ?? null,
	reviewed_by: raw?.reviewed_by_name ?? raw?.reviewed_by ?? null,
	reviewed_at: raw?.reviewed_at ?? null,
	uploaded_at: raw?.uploaded_at ?? raw?.created_at ?? "",
});

export default function AdminOrganisationConfigurationPage() {
	const [config, setConfig] = useState<OrganisationConfig>(emptyConfig);
	const [meta, setMeta] = useState<OrgMeta>(emptyMeta);
	const [documents, setDocuments] = useState<ApiDocument[]>([]);
	const [documentsKeyFound, setDocumentsKeyFound] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [dirty, setDirty] = useState(false);

	const [addOpen, setAddOpen] = useState(false);
	const [newDocKind, setNewDocKind] = useState("cac");
	const [newDocFile, setNewDocFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);

	const fetchAll = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("/admin/config/organisation/");
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load organisation configuration.");
				return;
			}
			const payload: any = resp.code ?? {};
			const org = payload.organisation ?? payload.organization ?? {};

			setConfig({
				legalName: org.legal_name ?? org.name ?? "",
				tradingName: org.trading_name ?? "",
				orgType: (org.org_type ?? org.type ?? "terminal") as OrgType,
				status: (org.status ?? "pending") as OrgStatus,
				rcNumber: org.rc_number ?? "",
				tin: org.tin ?? "",
				dateOfIncorporation: org.date_of_incorporation ?? "",
				sector: org.sector ?? "",
				registeredAddress: org.registered_address ?? "",
				operatingAddress: org.operating_address ?? "",
				website: org.website ?? "",
				contactEmail: org.contact_email ?? "",
				contactPhone: org.contact_phone ?? "",
				contactPerson: org.contact_person ?? "",
				contactPersonTitle: org.contact_person_title ?? "",
			});
			setMeta({
				rejectionReason: org.rejection_reason ?? null,
				verifiedBy: org.verified_by ?? null,
				verifiedAt: org.verified_at ?? null,
				createdAt: org.created_at ?? null,
				updatedAt: org.updated_at ?? null,
			});

			const rawDocs = pickFirstArray(payload);
			setDocumentsKeyFound(
				rawDocs.length > 0 ||
					Array.isArray(payload?.documents) ||
					Array.isArray(payload?.docs) ||
					Array.isArray(payload?.kyc_documents)
			);
			setDocuments(rawDocs.map(normaliseDocument));
		} catch (err: any) {
			setError(
				err?.response?.data?.message ||
					"Could not load organisation configuration."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const update = <K extends keyof OrganisationConfig>(
		key: K,
		value: OrganisationConfig[K]
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		setDirty(true);
	};

	const handleSave = async () => {
		if (saving) return;
		if (!config.legalName.trim()) {
			toast.error("Legal name is required.");
			return;
		}
		if (
			config.contactEmail &&
			!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contactEmail)
		) {
			toast.error("Contact email is not valid.");
			return;
		}

		setSaving(true);
		try {
			const payload = {
				legal_name: config.legalName.trim(),
				trading_name: config.tradingName.trim() || null,
				org_type: config.orgType,
				rc_number: config.rcNumber.trim() || null,
				tin: config.tin.trim() || null,
				date_of_incorporation: config.dateOfIncorporation.trim() || null,
				sector: config.sector.trim() || null,
				registered_address: config.registeredAddress.trim() || null,
				operating_address: config.operatingAddress.trim() || null,
				website: config.website.trim() || null,
				contact_email: config.contactEmail.trim() || null,
				contact_phone: config.contactPhone.trim() || null,
				contact_person: config.contactPerson.trim() || null,
				contact_person_title: config.contactPersonTitle.trim() || null,
			};

			const res = await http.post("/admin/config/organisation/update/", payload);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not save the configuration.");
				return;
			}
			toast.success("Organisation configuration saved. Change logged.");
			setDirty(false);
			await fetchAll();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					"Could not save the configuration."
			);
		} finally {
			setSaving(false);
		}
	};

	const handleDiscard = async () => {
		setDirty(false);
		await fetchAll();
		toast.message("Changes discarded.");
	};

	const pickNewFile = (file: File | null) => {
		if (!file) {
			setNewDocFile(null);
			return;
		}
		if (file.size > MAX_DOC_BYTES) {
			toast.error("Each document must be 5MB or smaller.");
			return;
		}
		if (!ALLOWED_MIME.includes(file.type)) {
			toast.error("Only PDF, JPG, PNG, or WebP files are accepted.");
			return;
		}
		setNewDocFile(file);
	};

	const handleUpload = async () => {
		if (!newDocFile) {
			toast.error("Choose a file first.");
			return;
		}
		setUploading(true);
		try {
			const form = new FormData();
			form.append("kind", newDocKind);
			form.append("file", newDocFile);

			const res = await http.post(
				"/admin/config/organisation/documents/add/",
				form,
				{ headers: { "Content-Type": "multipart/form-data" } }
			);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not upload the document.");
				return;
			}
			toast.success("Document uploaded and queued for review.");
			setNewDocFile(null);
			setNewDocKind("cac");
			setAddOpen(false);
			await fetchAll();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					"Could not upload the document."
			);
		} finally {
			setUploading(false);
		}
	};

	const handleDelete = async (doc: ApiDocument) => {
		if (doc.status !== "pending") {
			toast.error(
				"Only documents awaiting review can be removed. Approved and rejected documents carry a decision record."
			);
			return;
		}
		try {
			const res = await http.post(`/admin/config/organisation/documents/remove/`, { document_id: doc.id });
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not remove the document.");
				return;
			}
			toast.success("Document removed.");
			await fetchAll();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not remove the document."
			);
		}
	};

	if (loading) {
		return (
			<AppShell
				title="Organisation Settings"
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
				title="Organisation Settings"
				eyebrow="Administration · Configuration"
			>
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load organisation configuration
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">{error}</p>
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

	const isRejected = config.status === "rejected";
	const rejectedDocs = documents.filter((d) => d.status === "rejected");
	const approvedDocs = documents.filter((d) => d.status === "approved");
	const pendingDocs = documents.filter((d) => d.status === "pending");

	return (
		<AppShell
			title="Organisation Settings"
			eyebrow="Administration · Configuration"
		>
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
						Organisation Settings
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Identity, lifecycle, and documents for the organisation. Status is
						controlled by the review flow. All changes are written to the audit
						log.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{dirty && <StatusBadge label="Unsaved changes" tone="warning" />}
					<Button
						type="button"
						variant="outline"
						onClick={handleDiscard}
						disabled={!dirty || saving}
						className="border-line bg-paper text-ink hover:bg-sand disabled:opacity-60"
					>
						Discard
					</Button>
					<Button
						type="button"
						onClick={handleSave}
						disabled={!dirty || saving}
						className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
					>
						<Save className="size-4" />
						{saving ? "Saving…" : "Save changes"}
					</Button>
				</div>
			</div>

			<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
						<ShieldCheck className="size-5" />
					</div>
					<div className="min-w-0">
						<p className="text-sm font-semibold text-ink">
							Identity &amp; Compliance
						</p>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Legal name, RC number, and TIN feed terminal-issued documents and
							verification. Status is a decision record, controlled from the
							organisation review flow.
						</p>
					</div>
				</div>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h3 className="font-display text-sm font-bold text-ink">
								Lifecycle
							</h3>
							<p className="mt-1 text-[12px] leading-5 text-ink-soft">
								Current status and verification record. Status is set by
								approving or rejecting the organisation from the review flow.
							</p>
						</div>
						<StatusBadge
							label={statusLabel[config.status] ?? config.status}
							tone={statusTone(config.status)}
						/>
					</div>
				</div>

				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<label className="block">
						<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							<Building2 className="size-3.5 text-orange" />
							Organisation type
						</span>
						<select
							value={config.orgType}
							onChange={(e) =>
								update("orgType", e.target.value as OrgType)
							}
							className="mt-1.5 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
						>
							<option value="terminal">Terminal</option>
							<option value="importer">Importer</option>
							<option value="agent">Agent</option>
						</select>
					</label>

					<div>
						<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							<ShieldCheck className="size-3.5 text-orange" />
							Status
						</span>
						<div className="mt-2 flex items-center gap-2">
							<StatusBadge
								label={statusLabel[config.status] ?? config.status}
								tone={statusTone(config.status)}
							/>
							<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Read-only · set via review flow
							</span>
						</div>
					</div>

					<MetaField
						icon={Clock3}
						label="Submitted"
						value={formatDate(meta.createdAt)}
					/>
					<MetaField
						icon={Clock3}
						label="Last updated"
						value={formatDate(meta.updatedAt)}
					/>
					<MetaField
						icon={ShieldCheck}
						label="Verified by"
						value={meta.verifiedBy ?? "—"}
					/>
					<MetaField
						icon={Clock3}
						label="Verified at"
						value={formatDate(meta.verifiedAt)}
					/>
				</div>

				{isRejected && meta.rejectionReason && (
					<div className="mx-5 mb-5 rounded-md border-l-4 border-carmine bg-carmine/5 p-4 ring-1 ring-carmine/20">
						<div className="flex items-start gap-3">
							<ShieldX className="mt-0.5 size-4 shrink-0 text-carmine" />
							<div className="min-w-0">
								<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-carmine">
									Rejection reason
								</p>
								<p className="mt-1 text-[12px] leading-5 text-ink-soft">
									{meta.rejectionReason}
								</p>
							</div>
						</div>
					</div>
				)}
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Legal Identity
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Registered corporate details as they appear on incorporation records.
					</p>
				</div>

				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<Field
						label="Legal name"
						required
						icon={Building2}
						value={config.legalName}
						onChange={(v) => update("legalName", v)}
						placeholder="e.g. TRÏNŪ Bonded Warehouse Limited"
						full
					/>
					<Field
						label="Trading name"
						icon={Building2}
						value={config.tradingName}
						onChange={(v) => update("tradingName", v)}
						placeholder="e.g. TRÏNŪ"
					/>
					<SelectField
						label="Sector"
						value={config.sector}
						onChange={(v) => update("sector", v)}
						placeholder="Select a sector…"
						options={sectorOptions}
					/>
					<Field
						label="RC number"
						icon={FileText}
						value={config.rcNumber}
						onChange={(v) => update("rcNumber", v)}
						placeholder="e.g. RC-1284921"
						mono
					/>
					<Field
						label="TIN"
						icon={FileText}
						value={config.tin}
						onChange={(v) => update("tin", v)}
						placeholder="e.g. 20483012-0001"
						mono
					/>
					<Field
						label="Date of incorporation"
						icon={FileText}
						value={config.dateOfIncorporation}
						onChange={(v) => update("dateOfIncorporation", v)}
						placeholder="YYYY-MM-DD"
						mono
					/>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Addresses
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Registered address is used for legal correspondence. Operating
						address is the physical facility location.
					</p>
				</div>

				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<Field
						label="Registered address"
						icon={MapPin}
						value={config.registeredAddress}
						onChange={(v) => update("registeredAddress", v)}
						placeholder="Registered corporate address"
						full
					/>
					<Field
						label="Operating address"
						icon={MapPin}
						value={config.operatingAddress}
						onChange={(v) => update("operatingAddress", v)}
						placeholder="Abuja Flagship Facility"
						full
					/>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Contact Details
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Primary contact used on the public site, document headers, and
						customer correspondence.
					</p>
				</div>

				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<Field
						label="Contact email"
						icon={Mail}
						value={config.contactEmail}
						onChange={(v) => update("contactEmail", v)}
						placeholder="operations@trinu.ng"
						mono
					/>
					<Field
						label="Contact phone"
						icon={Phone}
						value={config.contactPhone}
						onChange={(v) => update("contactPhone", v)}
						placeholder="+234 800 000 0000"
						mono
					/>
					<Field
						label="Contact person"
						icon={Users}
						value={config.contactPerson}
						onChange={(v) => update("contactPerson", v)}
						placeholder="e.g. Muktar Mahdi"
					/>
					<Field
						label="Contact person title"
						icon={Users}
						value={config.contactPersonTitle}
						onChange={(v) => update("contactPersonTitle", v)}
						placeholder="e.g. Brand Manager"
					/>
					<Field
						label="Website"
						icon={Globe}
						value={config.website}
						onChange={(v) => update("website", v)}
						placeholder="https://trinu.ng"
						mono
						full
					/>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h3 className="font-display text-sm font-bold text-ink">
								Documents
							</h3>
							<p className="mt-1 text-[12px] leading-5 text-ink-soft">
								Uploaded KYC documents and their review status. Admin can add
								documents on behalf of the organisation; approve or reject from
								the review flow.
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<span className="rounded-full bg-orange/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-orange ring-1 ring-orange/25">
								{approvedDocs.length} approved
							</span>
							{pendingDocs.length > 0 && (
								<span className="rounded-full bg-sky/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-sky-deep ring-1 ring-sky/25">
									{pendingDocs.length} pending
								</span>
							)}
							{rejectedDocs.length > 0 && (
								<span className="rounded-full bg-carmine/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-carmine ring-1 ring-carmine/25">
									{rejectedDocs.length} rejected
								</span>
							)}
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setAddOpen((v) => !v)}
								className="border-line bg-paper text-ink hover:bg-sand"
							>
								<Plus className="size-3.5" />
								{addOpen ? "Cancel" : "Add document"}
							</Button>
						</div>
					</div>
				</div>

				{addOpen && (
					<div className="border-b border-line bg-sand/50 p-5">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							New document
						</p>
						<div className="mt-3 grid gap-3 sm:grid-cols-2">
							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Document type
								</span>
								<select
									value={newDocKind}
									onChange={(e) => setNewDocKind(e.target.value)}
									className="mt-1.5 h-11 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
								>
									{DOCUMENT_KINDS.map((k) => (
										<option key={k.value} value={k.value}>
											{k.label}
										</option>
									))}
								</select>
							</label>

							<div>
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									File
								</span>
								<div className="mt-1.5">
									{newDocFile ? (
										<div className="flex items-center justify-between gap-3 rounded-md bg-paper px-3 py-2 ring-1 ring-line">
											<div className="flex min-w-0 items-center gap-2">
												<FileText className="size-3.5 shrink-0 text-orange" />
												<span className="truncate font-mono text-[11px] text-ink">
													{newDocFile.name}
												</span>
											</div>
											<button
												type="button"
												onClick={() => setNewDocFile(null)}
												className="grid size-7 shrink-0 place-items-center rounded-md text-carmine transition-colors hover:bg-carmine/10"
												aria-label="Remove file"
											>
												<Trash2 className="size-3.5" />
											</button>
										</div>
									) : (
										<label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-line bg-paper px-3 py-3 text-[12px] text-ink-soft transition-colors hover:border-orange/40 hover:bg-orange/5 hover:text-orange">
											<span className="inline-flex items-center gap-2">
												<Upload className="size-3.5" />
												Choose file
											</span>
											<span className="font-mono text-[10px] text-ink-soft">
												PDF, JPG, PNG · max 5MB
											</span>
											<input
												type="file"
												accept="application/pdf,image/*"
												onChange={(e) => {
													const picked =
														e.target.files?.[0] ?? null;
													e.target.value = "";
													pickNewFile(picked);
												}}
												className="hidden"
											/>
										</label>
									)}
								</div>
							</div>
						</div>

						<div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
							<p className="text-[11px] text-ink-soft">
								Uploaded documents enter the review queue and are logged with
								the acting admin as the uploader.
							</p>
							<Button
								type="button"
								onClick={handleUpload}
								disabled={uploading || !newDocFile}
								className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
							>
								<Upload className="size-4" />
								{uploading ? "Uploading…" : "Upload document"}
							</Button>
						</div>
					</div>
				)}

				{documents.length === 0 ? (
					<div className="p-6 text-center text-sm text-ink-soft">
						{documentsKeyFound
							? "No documents on file for this organisation."
							: "The response from the server did not include a documents array."}
					</div>
				) : (
					<ul className="divide-y divide-line">
						{documents.map((doc) => {
							const isRejectedDoc = doc.status === "rejected";
							const isApprovedDoc = doc.status === "approved";
							const isPendingDoc = doc.status === "pending";
							return (
								<li key={doc.id} className="p-5">
									<div className="flex flex-wrap items-start gap-4">
										<div
											className={cn(
												"grid size-11 shrink-0 place-items-center rounded-xl text-white",
												isRejectedDoc
													? "bg-carmine"
													: isApprovedDoc
														? "bg-orange"
														: "bg-sky"
											)}
										>
											{isRejectedDoc ? (
												<ShieldX className="size-5" />
											) : isApprovedDoc ? (
												<CheckCircle2 className="size-5" />
											) : (
												<Clock3 className="size-5" />
											)}
										</div>

										<div className="min-w-[200px] flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<p className="text-sm font-semibold text-ink">
													{doc.label}
												</p>
												<StatusBadge
													label={doc.status}
													tone={
														isApprovedDoc
															? "success"
															: isRejectedDoc
																? "critical"
																: "warning"
													}
												/>
											</div>
											<p className="mt-1 font-mono text-[11px] text-ink-soft">
												{doc.file_name}
											</p>
											{isRejectedDoc && doc.rejection_reason && (
												<div className="mt-2 rounded-md bg-carmine/5 px-3 py-2 ring-1 ring-carmine/20">
													<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-carmine">
														Rejection reason
													</p>
													<p className="mt-0.5 text-[12px] leading-5 text-ink-soft">
														{doc.rejection_reason}
													</p>
												</div>
											)}
											{doc.reviewed_by && (
												<p className="mt-1 text-[11px] text-ink-soft">
													Reviewed by {doc.reviewed_by} ·{" "}
													{formatDate(doc.reviewed_at)}
												</p>
											)}
										</div>

										<div className="flex min-w-[160px] flex-col items-end gap-2">
											{doc.file_url && (
												<a
													href={resolveSrc(doc.file_url)}
													target="_blank"
													rel="noopener noreferrer"
												>
													<Button
														type="button"
														variant="outline"
														size="sm"
														className="border-line bg-paper text-ink hover:bg-sand"
													>
														<FileText className="size-3.5" />
														View file
													</Button>
												</a>
											)}
											{isPendingDoc && (
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => handleDelete(doc)}
													className="text-carmine hover:bg-carmine/10"
												>
													<Trash2 className="size-3.5" />
													Remove
												</Button>
											)}
											<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
												Uploaded {formatDate(doc.uploaded_at)}
											</span>
										</div>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</section>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							Status, decisions, and audit trail
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Status is a decision, not a setting. Approve or reject an
							organisation from the review flow, where the decision records
							authority, reason, actor, and timestamp. Admin-added documents go
							into the same review queue as member uploads and log the acting
							admin as the uploader. Only pending documents can be removed;
							approved and rejected documents carry a decision record and
							cannot be deleted.
						</p>
					</div>
				</div>
			</div>
		</AppShell>
	);
}

function MetaField({
	icon: Icon,
	label,
	value,
}: {
	icon: typeof Clock3;
	label: string;
	value: string;
}) {
	return (
		<div>
			<dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				<Icon className="size-3.5 text-orange" />
				{label}
			</dt>
			<dd className="mt-2 text-[14px] font-mono text-ink">{value}</dd>
		</div>
	);
}

function Field({
	label,
	value,
	onChange,
	placeholder,
	icon: Icon,
	mono,
	required,
	full,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	icon: typeof Building2;
	mono?: boolean;
	required?: boolean;
	full?: boolean;
}) {
	return (
		<label className={cn("block", full && "sm:col-span-2")}>
			<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				<Icon className="size-3.5 text-orange" />
				{label}
				{required && <span className="text-coral">*</span>}
			</span>
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={cn(
					"mt-1.5 h-11 border-line bg-sand text-ink",
					mono && "font-mono"
				)}
			/>
		</label>
	);
}

function SelectField({
	label,
	value,
	onChange,
	options,
	placeholder,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: string[];
	placeholder?: string;
}) {
	return (
		<label className="block">
			<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				<Globe className="size-3.5 text-orange" />
				{label}
			</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="mt-1.5 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
			>
				<option value="">{placeholder ?? "Select…"}</option>
				{options.map((o) => (
					<option key={o} value={o}>
						{o}
					</option>
				))}
			</select>
		</label>
	);
}