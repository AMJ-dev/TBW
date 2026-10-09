import { useEffect, useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	Award,
	Building2,
	Clock3,
	FileText,
	Globe,
	Mail,
	MapPin,
	Paperclip,
	Phone,
	Plus,
	Save,
	ShieldCheck,
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

type OrgStatus =
	| "pending"
	| "under_review"
	| "verified"
	| "rejected"
	| "suspended";

type OrgType = "terminal" | "importer" | "agent";

type DocKey = "cac" | "tin" | "signatory_id" | "directors_list" | "utility_bill";

interface ApiDocument {
	id: string;
	kind: string;
	label: string;
	file_name: string;
	file_url: string;
	uploaded_at: string;
	licence_type?: string | null;
	licence_reference?: string | null;
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

interface DocumentSlot {
	key: DocKey;
	label: string;
	detail: string;
	accept: string;
}

const documentSlots: DocumentSlot[] = [
	{
		key: "cac",
		label: "CAC certificate",
		detail: "Certificate of incorporation or business name registration.",
		accept: "application/pdf,image/*",
	},
	{
		key: "tin",
		label: "TIN certificate",
		detail: "Tax Identification Number certificate issued by FIRS.",
		accept: "application/pdf,image/*",
	},
	{
		key: "signatory_id",
		label: "Authorised signatory ID",
		detail: "National ID, driver's licence, or international passport.",
		accept: "application/pdf,image/*",
	},
	{
		key: "directors_list",
		label: "Directors and shareholders list",
		detail: "A current list of the company's directors and shareholders.",
		accept: "application/pdf",
	},
	{
		key: "utility_bill",
		label: "Utility bill (proof of address)",
		detail: "A recent utility bill showing the organisation's registered address.",
		accept: "application/pdf,image/*",
	},
];

type LicenceType =
	| "ncs_customs_agent"
	| "nafdac"
	| "son"
	| "naqs"
	| "soncap"
	| "other";

const licenceTypes: { key: LicenceType; label: string }[] = [
	{ key: "ncs_customs_agent", label: "NCS Customs Agent Licence" },
	{ key: "nafdac", label: "NAFDAC Permit" },
	{ key: "son", label: "SON (Standards Organisation of Nigeria)" },
	{ key: "naqs", label: "NAQS (Quarantine Service)" },
	{ key: "soncap", label: "SONCAP Certificate" },
	{ key: "other", label: "Other operational licence" },
];

interface LicenceEntry {
	id: string;
	kind: "licence";
	type: LicenceType | "";
	reference: string;
	file: File | null;
}

const MAX_DOC_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = [
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/webp",
];
const ALLOWED_PDF_ONLY = ["application/pdf"];

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

const pickLicencesArray = (payload: any): ApiDocument[] => {
	const candidates = [
		payload?.licences,
		payload?.licenses,
		payload?.organisation?.licences,
		payload?.organization?.licences,
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
	uploaded_at: raw?.uploaded_at ?? raw?.created_at ?? "",
	licence_type: raw?.licence_type ?? null,
	licence_reference: raw?.licence_reference ?? raw?.reference ?? null,
});

export default function AdminOrganisationConfigurationPage() {
	const [config, setConfig] = useState<OrganisationConfig>(emptyConfig);
	const [meta, setMeta] = useState<OrgMeta>(emptyMeta);
	const [documents, setDocuments] = useState<ApiDocument[]>([]);
	const [licences, setLicences] = useState<ApiDocument[]>([]);

	const [slotFiles, setSlotFiles] = useState<Record<DocKey, File | null>>({
		cac: null,
		tin: null,
		signatory_id: null,
		directors_list: null,
		utility_bill: null,
	});

	const [newLicences, setNewLicences] = useState<LicenceEntry[]>([]);

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [removing, setRemoving] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [dirty, setDirty] = useState(false);

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

			setDocuments(pickFirstArray(payload).map(normaliseDocument));
			setLicences(pickLicencesArray(payload).map(normaliseDocument));
			resetPendingEdits();
		} catch (err: any) {
			setError(
				err?.response?.data?.message ||
					"Could not load organisation configuration."
			);
		} finally {
			setLoading(false);
		}
	};

	const resetPendingEdits = () => {
		setSlotFiles({
			cac: null,
			tin: null,
			signatory_id: null,
			directors_list: null,
			utility_bill: null,
		});
		setNewLicences([]);
		setDirty(false);
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

	const pickSlotFile = (key: DocKey, file: File | null) => {
		if (!file) {
			setSlotFiles((prev) => ({ ...prev, [key]: null }));
			return;
		}
		const slot = documentSlots.find((s) => s.key === key);
		const allowed =
			slot?.accept.includes("pdf") && !slot?.accept.includes("image")
				? ALLOWED_PDF_ONLY
				: ALLOWED_MIME;

		if (file.size > MAX_DOC_BYTES) {
			toast.error("Each document must be 5MB or smaller.");
			return;
		}
		if (!allowed.includes(file.type)) {
			toast.error(
				allowed === ALLOWED_PDF_ONLY
					? "Only PDF files are accepted for this document."
					: "Only PDF, JPG, PNG, or WebP files are accepted."
			);
			return;
		}
		setSlotFiles((prev) => ({ ...prev, [key]: file }));
		setDirty(true);
	};

	const addLicenceEntry = () => {
		setNewLicences((prev) => [
			...prev,
			{
				id: crypto.randomUUID(),
				kind: "licence",
				type: "",
				reference: "",
				file: null,
			},
		]);
		setDirty(true);
	};

	const updateLicenceEntry = (id: string, patch: Partial<LicenceEntry>) => {
		setNewLicences((prev) =>
			prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
		);
		setDirty(true);
	};

	const removeLicenceEntry = (id: string) => {
		setNewLicences((prev) => prev.filter((l) => l.id !== id));
		setDirty(true);
	};

	const pickLicenceFile = (id: string, file: File | null) => {
		if (!file) {
			updateLicenceEntry(id, { file: null });
			return;
		}
		if (file.size > MAX_DOC_BYTES) {
			toast.error("Each licence document must be 5MB or smaller.");
			return;
		}
		if (!ALLOWED_MIME.includes(file.type)) {
			toast.error("Only PDF, JPG, PNG, or WebP files are accepted.");
			return;
		}
		updateLicenceEntry(id, { file });
	};

	const existingDocFor = (key: DocKey) =>
		documents.find((d) => d.kind === key) ?? null;

	const handleRemoveExistingDocument = async (doc: ApiDocument) => {
		if (removing) return;
		const confirmed = window.confirm(
			`Remove ${doc.file_name}? This takes effect immediately and is logged.`
		);
		if (!confirmed) return;

		setRemoving(doc.id);
		try {
			const res = await http.post(
				`/admin/config/organisation/documents/remove/`,
				{ document_id: doc.id }
			);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not remove the document.");
				return;
			}
			toast.success("Document removed. Change logged.");
			await fetchAll();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not remove the document."
			);
		} finally {
			setRemoving(null);
		}
	};

	const handleRemoveExistingLicence = async (lic: ApiDocument) => {
		if (removing) return;
		const confirmed = window.confirm(
			`Remove this licence? This takes effect immediately and is logged.`
		);
		if (!confirmed) return;

		setRemoving(lic.id);
		try {
			const res = await http.post(
				`/admin/config/organisation/documents/remove/`,
				{ document_id: lic.id }
			);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not remove the licence.");
				return;
			}
			toast.success("Licence removed. Change logged.");
			await fetchAll();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not remove the licence."
			);
		} finally {
			setRemoving(null);
		}
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
		const incompleteLicence = newLicences.find(
			(l) => !l.type || !l.reference.trim() || !l.file
		);
		if (incompleteLicence) {
			toast.error(
				"Each new licence needs a type, a reference number, and a file."
			);
			return;
		}

		setSaving(true);
		try {
			const form = new FormData();

			form.append("legal_name", config.legalName.trim());
			form.append("trading_name", config.tradingName.trim());
			form.append("org_type", config.orgType);
			form.append("rc_number", config.rcNumber.trim());
			form.append("tin", config.tin.trim());
			form.append(
				"date_of_incorporation",
				config.dateOfIncorporation.trim()
			);
			form.append("sector", config.sector.trim());
			form.append("registered_address", config.registeredAddress.trim());
			form.append("operating_address", config.operatingAddress.trim());
			form.append("website", config.website.trim());
			form.append("contact_email", config.contactEmail.trim());
			form.append("contact_phone", config.contactPhone.trim());
			form.append("contact_person", config.contactPerson.trim());
			form.append("contact_person_title", config.contactPersonTitle.trim());

			documentSlots.forEach((slot) => {
				const file = slotFiles[slot.key];
				if (file) form.append(slot.key, file);
			});

			const licenceMeta = newLicences.map((l) => ({
				id: l.id,
				licence_type: l.type,
				licence_reference: l.reference.trim(),
			}));
			form.append("licences", JSON.stringify(licenceMeta));

			newLicences.forEach((l, index) => {
				if (l.file) {
					form.append(`licence_file_${index}`, l.file);
					form.append(`licence_id_${index}`, l.id);
				}
			});

			const res = await http.post(
				"/admin/config/organisation/update/",
				form,
				{ headers: { "Content-Type": "multipart/form-data" } }
			);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not save the configuration.");
				return;
			}
			toast.success("Organisation configuration saved. Change logged.");
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
		resetPendingEdits();
		await fetchAll();
		toast.message("Changes discarded.");
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

				{dirty && <StatusBadge label="Unsaved changes" tone="warning" />}
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
								Current status and verification record.
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
							<AlertTriangle className="mt-0.5 size-4 shrink-0 text-carmine" />
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
					<h3 className="font-display text-sm font-bold text-ink">
						Documents
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Upload or replace the organisation's KYC documents. Each slot holds
						one document. Removing an existing document takes effect
						immediately.
					</p>
				</div>

				<div className="space-y-3 p-5">
					{documentSlots.map((slot) => {
						const existing = existingDocFor(slot.key);
						const picked = slotFiles[slot.key];
						return (
							<DocumentCard
								key={slot.key}
								icon={FileText}
								label={slot.label}
								detail={slot.detail}
								accept={slot.accept}
								existing={existing}
								picked={picked}
								removing={removing === existing?.id}
								onPick={(f) => pickSlotFile(slot.key, f)}
								onRemove={() =>
									existing &&
									handleRemoveExistingDocument(existing)
								}
							/>
						);
					})}
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h3 className="font-display text-sm font-bold text-ink">
								Operational licences
							</h3>
							<p className="mt-1 text-[12px] leading-5 text-ink-soft">
								The organisation can hold more than one licence. Each entry
								needs a licence type, a reference number, and the licence
								document. Removing an existing licence takes effect
								immediately.
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={addLicenceEntry}
							className="border-line bg-paper text-ink hover:bg-sand-2"
						>
							<Plus className="size-3.5" />
							Add licence
						</Button>
					</div>
				</div>

				<div className="space-y-3 p-5">
					{licences.length > 0 && (
						<div className="space-y-3">
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								On file
								<span className="ml-2 text-ink-soft/70">
									· {licences.length}{" "}
									{licences.length === 1 ? "licence" : "licences"}
								</span>
							</p>
							{licences.map((lic) => (
								<ExistingLicenceCard
									key={lic.id}
									licence={lic}
									removing={removing === lic.id}
									onRemove={() =>
										handleRemoveExistingLicence(lic)
									}
								/>
							))}
						</div>
					)}

					{newLicences.length > 0 && (
						<div className="space-y-3">
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								New licences to add
							</p>
							{newLicences.map((licence, index) => (
								<LicenceCard
									key={licence.id}
									index={index}
									licence={licence}
									onUpdate={updateLicenceEntry}
									onRemove={removeLicenceEntry}
									onPickFile={pickLicenceFile}
								/>
							))}
						</div>
					)}

					{licences.length === 0 && newLicences.length === 0 && (
						<div className="rounded-xl border border-dashed border-line bg-sand px-4 py-6 text-center text-[12px] text-ink-soft">
							No licences on file. Click{" "}
							<span className="font-semibold text-ink">Add licence</span> to
							upload one.
						</div>
					)}
				</div>
			</section>

			<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
							{dirty ? "Unsaved changes" : "All changes saved"}
						</p>
						<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
							{dirty
								? "Save to apply profile, document, and licence changes."
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
							<Save className="size-4" />
							{saving ? "Saving…" : "Save changes"}
						</Button>
					</div>
				</div>
			</div>
		</AppShell>
	);
}

function DocumentCard({
	icon: Icon,
	label,
	detail,
	accept,
	existing,
	picked,
	removing,
	onPick,
	onRemove,
}: {
	icon: typeof FileText;
	label: string;
	detail: string;
	accept: string;
	existing: ApiDocument | null;
	picked: File | null;
	removing: boolean;
	onPick: (f: File | null) => void;
	onRemove: () => void;
}) {
	const acceptHint =
		accept.includes("pdf") && !accept.includes("image")
			? "PDF · max 5MB"
			: "PDF, JPG, PNG · max 5MB";

	return (
		<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
			<div className="flex items-start gap-3">
				<div className="grid size-9 shrink-0 place-items-center rounded-md bg-orange text-white">
					<Icon className="size-4" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-ink">{label}</p>
					<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
						{detail}
					</p>
				</div>
			</div>

			{picked ? (
				<div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-paper px-3 py-2 ring-1 ring-orange/30">
					<div className="flex min-w-0 items-center gap-2">
						<Paperclip className="size-3.5 shrink-0 text-orange" />
						<span className="truncate font-mono text-[11px] text-ink">
							{picked.name}
						</span>
						<span className="shrink-0 font-mono text-[10px] text-ink-soft">
							{(picked.size / 1024).toFixed(0)} KB
						</span>
					</div>
					<button
						type="button"
						onClick={() => onPick(null)}
						aria-label="Remove file"
						className="grid size-7 shrink-0 place-items-center rounded-md text-carmine transition-colors hover:bg-carmine/10"
					>
						<Trash2 className="size-3.5" />
					</button>
				</div>
			) : existing ? (
				<div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-paper px-3 py-2 ring-1 ring-line">
					<div className="flex min-w-0 items-center gap-2">
						<Paperclip className="size-3.5 shrink-0 text-orange" />
						<span className="truncate font-mono text-[11px] text-ink">
							{existing.file_name}
						</span>
					</div>
					<div className="flex items-center gap-2">
						{existing.file_url && (
							<a
								href={existing.file_url}
								target="_blank"
								rel="noopener noreferrer"
								className="font-mono text-[10px] uppercase tracking-[0.12em] text-orange hover:text-orange-deep"
							>
								View
							</a>
						)}
						<label className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft hover:text-orange">
							Replace
							<input
								type="file"
								accept={accept}
								onChange={(e) => {
									const f = e.target.files?.[0] ?? null;
									e.target.value = "";
									onPick(f);
								}}
								className="hidden"
							/>
						</label>
						<button
							type="button"
							onClick={onRemove}
							disabled={removing}
							aria-label="Remove document"
							className="grid size-7 shrink-0 place-items-center rounded-md text-carmine transition-colors hover:bg-carmine/10 disabled:opacity-40"
						>
							{removing ? (
								<span className="size-3.5 animate-spin rounded-full border-2 border-carmine/25 border-t-carmine" />
							) : (
								<Trash2 className="size-3.5" />
							)}
						</button>
					</div>
				</div>
			) : (
				<label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-line bg-paper px-3 py-3 text-[12px] text-ink-soft transition-colors hover:border-orange/40 hover:bg-orange/5 hover:text-orange">
					<span className="inline-flex items-center gap-2">
						<Upload className="size-3.5" />
						Choose file
					</span>
					<span className="font-mono text-[10px] text-ink-soft">
						{acceptHint}
					</span>
					<input
						type="file"
						accept={accept}
						onChange={(e) => {
							const f = e.target.files?.[0] ?? null;
							e.target.value = "";
							onPick(f);
						}}
						className="hidden"
					/>
				</label>
			)}
		</div>
	);
}

function LicenceCard({
	index,
	licence,
	onUpdate,
	onRemove,
	onPickFile,
}: {
	index: number;
	licence: LicenceEntry;
	onUpdate: (id: string, patch: Partial<LicenceEntry>) => void;
	onRemove: (id: string) => void;
	onPickFile: (id: string, f: File | null) => void;
}) {
	return (
		<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
			<div className="flex items-start gap-3">
				<div className="grid size-9 shrink-0 place-items-center rounded-md bg-orange text-white">
					<Award className="size-4" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-ink">
						Licence {index + 1}
					</p>
					<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
						Add the licence type, reference number, and document.
					</p>
				</div>
				<button
					type="button"
					onClick={() => onRemove(licence.id)}
					aria-label="Remove licence"
					className="grid size-7 shrink-0 place-items-center rounded-md text-carmine transition-colors hover:bg-carmine/10"
				>
					<Trash2 className="size-3.5" />
				</button>
			</div>

			<div className="mt-3 grid gap-3 sm:grid-cols-2">
				<label className="block">
					<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
						Licence type
					</span>
					<select
						value={licence.type}
						onChange={(e) =>
							onUpdate(licence.id, {
								type: e.target.value as LicenceType,
							})
						}
						className="mt-1.5 h-11 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
					>
						<option value="">Select a licence type…</option>
						{licenceTypes.map((t) => (
							<option key={t.key} value={t.key}>
								{t.label}
							</option>
						))}
					</select>
				</label>

				<label className="block">
					<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
						Licence reference number
					</span>
					<Input
						placeholder="e.g. NCS/AG/2026/00123"
						value={licence.reference}
						onChange={(e) =>
							onUpdate(licence.id, { reference: e.target.value })
						}
						className="mt-1.5 h-11 border-line bg-paper font-mono text-ink"
					/>
				</label>
			</div>

			{licence.file ? (
				<div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-paper px-3 py-2 ring-1 ring-line">
					<div className="flex min-w-0 items-center gap-2">
						<Paperclip className="size-3.5 shrink-0 text-orange" />
						<span className="truncate font-mono text-[11px] text-ink">
							{licence.file.name}
						</span>
						<span className="shrink-0 font-mono text-[10px] text-ink-soft">
							{(licence.file.size / 1024).toFixed(0)} KB
						</span>
					</div>
					<button
						type="button"
						onClick={() => onPickFile(licence.id, null)}
						aria-label="Remove file"
						className="grid size-7 shrink-0 place-items-center rounded-md text-carmine transition-colors hover:bg-carmine/10"
					>
						<Trash2 className="size-3.5" />
					</button>
				</div>
			) : (
				<label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-line bg-paper px-3 py-3 text-[12px] text-ink-soft transition-colors hover:border-orange/40 hover:bg-orange/5 hover:text-orange">
					<span className="inline-flex items-center gap-2">
						<Upload className="size-3.5" />
						Upload licence document
					</span>
					<span className="font-mono text-[10px] text-ink-soft">
						PDF, JPG, PNG · max 5MB
					</span>
					<input
						type="file"
						accept="application/pdf,image/*"
						onChange={(e) => {
							const f = e.target.files?.[0] ?? null;
							e.target.value = "";
							onPickFile(licence.id, f);
						}}
						className="hidden"
					/>
				</label>
			)}
		</div>
	);
}

function ExistingLicenceCard({
	licence,
	removing,
	onRemove,
}: {
	licence: ApiDocument;
	removing: boolean;
	onRemove: () => void;
}) {
	const typeLabel =
		licenceTypes.find((t) => t.key === licence.licence_type)?.label ??
		licence.licence_type ??
		"Operational licence";

	return (
		<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
			<div className="flex items-start gap-3">
				<div className="grid size-9 shrink-0 place-items-center rounded-md bg-orange text-white">
					<Award className="size-4" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-ink">{typeLabel}</p>
					{licence.licence_reference && (
						<p className="mt-0.5 font-mono text-[11px] text-ink-soft">
							Ref · {licence.licence_reference}
						</p>
					)}
				</div>
				<button
					type="button"
					onClick={onRemove}
					disabled={removing}
					aria-label="Remove licence"
					className="grid size-7 shrink-0 place-items-center rounded-md text-carmine transition-colors hover:bg-carmine/10 disabled:opacity-40"
				>
					{removing ? (
						<span className="size-3.5 animate-spin rounded-full border-2 border-carmine/25 border-t-carmine" />
					) : (
						<Trash2 className="size-3.5" />
					)}
				</button>
			</div>

			<div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-paper px-3 py-2 ring-1 ring-line">
				<div className="flex min-w-0 items-center gap-2">
					<Paperclip className="size-3.5 shrink-0 text-orange" />
					<span className="truncate font-mono text-[11px] text-ink">
						{licence.file_name}
					</span>
				</div>
				{licence.file_url && (
					<a
						href={licence.file_url}
						target="_blank"
						rel="noopener noreferrer"
						className="font-mono text-[10px] uppercase tracking-[0.12em] text-orange hover:text-orange-deep"
					>
						View
					</a>
				)}
			</div>
		</div>
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