import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
	AlertTriangle,
	ArrowRight,
	Building2,
	Check,
	CheckCircle2,
	Clock3,
	FileText,
	Paperclip,
	ShieldCheck,
	ShieldX,
	Trash2,
	Upload,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";
import { resolveSrc } from "@/lib/functions";

type OrgStatus =
	| "pending"
	| "under_review"
	| "verified"
	| "rejected"
	| "suspended";

interface ApiOrganisation {
	id: string;
	name: string;
	type: "terminal" | "importer" | "agent";
	rc_number: string | null;
	tin: string | null;
	status: OrgStatus;
	rejection_reason: string | null;
	verified_by: string | null;
	verified_at: string | null;
	created_at: string;
	updated_at: string;
	contact_email?: string;
	contact_phone?: string;
}

interface ApiDocument {
	id: string;
	kind: "licence" | "tin" | "signatory_id" | "cac" | string;
	label: string;
	file_name: string;
	file_url: string;
	status: "pending" | "approved" | "rejected" | string;
	rejection_reason: string | null;
	reviewed_by: string | null;
	reviewed_at: string | null;
	uploaded_at: string;
}

const statusLabel: Record<OrgStatus, string> = {
	pending: "Pending",
	under_review: "Under review",
	verified: "Verified",
	rejected: "Rejected",
	suspended: "Suspended",
};

const MAX_DOC_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

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

export default function OrganisationResubmitPage() {
	const navigate = useNavigate();

	const [org, setOrg] = useState<ApiOrganisation | null>(null);
	const [documents, setDocuments] = useState<ApiDocument[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [orgName, setOrgName] = useState("");
	const [rcNumber, setRcNumber] = useState("");
	const [tin, setTin] = useState("");

	const [replacements, setReplacements] = useState<Record<string, File | null>>(
		{}
	);
	const [saving, setSaving] = useState(false);

	const fetchAll = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("organisation/my-registration/");
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load your registration.");
				return;
			}
			const payload: any = resp.code ?? {};
			const record: ApiOrganisation | null =
				payload.organization ?? payload.organisation ?? null;
			const docs: ApiDocument[] = payload.documents ?? [];

			setOrg(record);
			setOrgName(record?.name ?? "");
			setRcNumber(record?.rc_number ?? "");
			setTin(record?.tin ?? "");
			setDocuments(docs);
		} catch (err: any) {
			setError(
				err?.response?.data?.message || "Could not load your registration."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchAll();
	}, []);

	const pickReplacement = (documentId: string, file: File | null) => {
		if (!file) {
			setReplacements((prev) => ({ ...prev, [documentId]: null }));
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
		setReplacements((prev) => ({ ...prev, [documentId]: file }));
	};

	const handleSubmitAll = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (saving) return;

		if (!orgName.trim() || !rcNumber.trim()) {
			toast.error("Company name and RC number are required.");
			return;
		}

		setSaving(true);
		try {
			const form = new FormData();
			form.append("name", orgName.trim());
			form.append("rc_number", rcNumber.trim());
			form.append("tin", tin.trim());

			Object.entries(replacements).forEach(([docId, file]) => {
				if (file) {
					form.append(`documents[${docId}]`, file);
				}
			});

			const res = await http.post(
				"organisation/submit-registration/",
				form,
				{ headers: { "Content-Type": "multipart/form-data" } }
			);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not submit your registration.");
				return;
			}
			toast.success("Registration submitted for review.");
			setReplacements({});
			await fetchAll();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not submit your registration."
			);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<AppShell title="My registration" eyebrow="Organisation">
				<div className="flex items-center justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
					<span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
				</div>
			</AppShell>
		);
	}

	if (error || !org) {
		return (
			<AppShell title="My registration" eyebrow="Organisation">
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load your registration
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">
								{error || "You do not have an active registration request."}
							</p>
						</div>
					</div>
					<div className="mt-5 flex flex-wrap gap-2">
						<Button
							onClick={() => void fetchAll()}
							className="bg-orange text-white hover:bg-orange-deep"
						>
							Try again
						</Button>
						<Button
							variant="outline"
							className="border-line bg-paper text-ink hover:bg-sand"
							onClick={() => navigate("/portal")}
						>
							Back to portal
						</Button>
					</div>
				</div>
			</AppShell>
		);
	}

	const isRejectedOrg = org.status === "rejected";
	const canEditOrg = isRejectedOrg || org.status === "pending";

	const rejectedRows = documents.filter((d) => d.status === "rejected");
	const approvedRows = documents.filter((d) => d.status !== "rejected");

	const canSave =
		canEditOrg && rejectedRows.every((d) => !!replacements[d.id]);

	return (
		<AppShell title="My registration" eyebrow="Organisation">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0">
					<div className="mt-2 flex flex-wrap items-center gap-3">
						<h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
							{org.name}
						</h2>
						<StatusBadge
							label={statusLabel[org.status] ?? org.status}
							tone={statusTone(org.status)}
						/>
					</div>
					<p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-ink-soft">
						<span className="inline-flex items-center gap-1.5">
							<Building2 className="size-3.5" />
							{org.type}
						</span>
						{org.rc_number && (
							<span className="inline-flex items-center gap-1.5">
								<FileText className="size-3.5" />
								{org.rc_number}
							</span>
						)}
						{org.created_at && (
							<span className="inline-flex items-center gap-1.5">
								<Clock3 className="size-3.5" />
								Submitted {formatDate(org.created_at)}
							</span>
						)}
					</p>
				</div>
			</div>

			{isRejectedOrg && org.rejection_reason && (
				<div className="rounded-xl border-l-4 border-carmine bg-carmine/5 p-4 ring-1 ring-carmine/20">
					<div className="flex items-start gap-3">
						<ShieldX className="mt-0.5 size-4 shrink-0 text-carmine" />
						<div className="min-w-0">
							<p className="font-display text-sm font-bold text-ink">
								Registration rejected
							</p>
							<p className="mt-1 text-[13px] leading-6 text-ink-soft">
								{org.rejection_reason}
							</p>
							<p className="mt-2 text-[11px] leading-5 text-ink-soft">
								Correct any details flagged, re-upload the rejected documents,
								then submit for review.
							</p>
						</div>
					</div>
				</div>
			)}

			{org.status === "pending" && (
				<div className="rounded-xl bg-orange/10 p-4 ring-1 ring-orange/25">
					<div className="flex items-start gap-3">
						<Clock3 className="mt-0.5 size-4 shrink-0 text-orange" />
						<p className="text-[13px] leading-6 text-ink-soft">
							Your registration is being reviewed. You can still correct your
							details below and re-submit.
						</p>
					</div>
				</div>
			)}

			{org.status === "verified" && (
				<div className="rounded-xl bg-orange/10 p-4 ring-1 ring-orange/25">
					<div className="flex items-start gap-3">
						<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-orange" />
						<p className="text-[13px] leading-6 text-ink-soft">
							Your organisation is verified. Contact operations if you need to
							update any of the details below.
						</p>
					</div>
				</div>
			)}

			<form onSubmit={handleSubmitAll} className="space-y-5">
				<section className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
						<div>
							<h3 className="font-display text-sm font-bold text-ink">
								Company details
							</h3>
							<p className="text-[11px] text-ink-soft">
								{canEditOrg
									? "Correct any details that were flagged."
									: "These details are locked. Contact operations if you need to change them."}
							</p>
						</div>
						{canEditOrg && (
							<span className="rounded-full bg-orange/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-orange ring-1 ring-orange/25">
								Editable
							</span>
						)}
					</div>

					<div className="p-5">
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="block sm:col-span-2">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Company name
								</span>
								<Input
									required
									value={orgName}
									onChange={(e) => setOrgName(e.target.value)}
									disabled={!canEditOrg}
									className={cn(
										"mt-2 h-11 border-line text-ink",
										canEditOrg ? "bg-sand" : "bg-sand-2 text-ink-soft"
									)}
								/>
							</label>

							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									RC number
								</span>
								<Input
									required
									value={rcNumber}
									onChange={(e) => setRcNumber(e.target.value)}
									disabled={!canEditOrg}
									className={cn(
										"mt-2 h-11 border-line font-mono text-ink",
										canEditOrg ? "bg-sand" : "bg-sand-2 text-ink-soft"
									)}
								/>
							</label>

							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									TIN
								</span>
								<Input
									value={tin}
									onChange={(e) => setTin(e.target.value)}
									disabled={!canEditOrg}
									className={cn(
										"mt-2 h-11 border-line font-mono text-ink",
										canEditOrg ? "bg-sand" : "bg-sand-2 text-ink-soft"
									)}
								/>
							</label>
						</div>
					</div>
				</section>

				<section className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
						<div>
							<h3 className="font-display text-sm font-bold text-ink">
								Documents
							</h3>
							<p className="text-[11px] text-ink-soft">
								Only documents flagged as rejected need to be replaced. Approved
								documents are locked.
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<span className="rounded-full bg-orange/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-orange ring-1 ring-orange/25">
								{approvedRows.length} approved
							</span>
							{rejectedRows.length > 0 && (
								<span className="rounded-full bg-carmine/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-carmine ring-1 ring-carmine/25">
									{rejectedRows.length} rejected
								</span>
							)}
						</div>
					</div>

					{documents.length === 0 ? (
						<div className="p-6 text-center text-sm text-ink-soft">
							No documents on file.
						</div>
					) : (
						<ul className="divide-y divide-line">
							{documents.map((doc) => {
								const isRejected = doc.status === "rejected";
								const replacement = replacements[doc.id] ?? null;

								return (
									<li key={doc.id} className="p-5">
										<div className="flex flex-wrap items-start gap-4">
											<div
												className={cn(
													"grid size-11 shrink-0 place-items-center rounded-xl text-white",
													isRejected ? "bg-carmine" : "bg-orange"
												)}
											>
												{isRejected ? (
													<ShieldX className="size-5" />
												) : (
													<CheckCircle2 className="size-5" />
												)}
											</div>

											<div className="min-w-[200px] flex-1">
												<div className="flex flex-wrap items-center gap-2">
													<p className="text-sm font-semibold text-ink">
														{doc.label}
													</p>
													{isRejected ? (
														<span className="inline-flex items-center gap-1.5 rounded-full bg-carmine/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-carmine ring-1 ring-carmine/25">
															<ShieldX className="size-3" />
															Rejected
														</span>
													) : (
														<span className="inline-flex items-center gap-1.5 rounded-full bg-orange/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-orange ring-1 ring-orange/25">
															<Check className="size-3" />
															Approved
														</span>
													)}
												</div>
												<p className="mt-1 font-mono text-[11px] text-ink-soft">
													{doc.file_name}
												</p>
												{isRejected && doc.rejection_reason && (
													<div className="mt-2 rounded-md bg-carmine/5 px-3 py-2 ring-1 ring-carmine/20">
														<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-carmine">
															Rejection reason
														</p>
														<p className="mt-0.5 text-[12px] leading-5 text-ink-soft">
															{doc.rejection_reason}
														</p>
													</div>
												)}
											</div>

											<div className="flex min-w-[140px] flex-col items-end gap-2">
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
														View current
													</Button>
												</a>

												{!isRejected && (
													<span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-orange">
														<ShieldCheck className="size-3" />
														Locked
													</span>
												)}
											</div>
										</div>

										{isRejected && (
											<div className="mt-4 rounded-xl bg-sand p-4 ring-1 ring-line">
												<p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
													Replacement file
												</p>
												{replacement ? (
													<div className="flex items-center justify-between gap-3 rounded-md bg-paper px-3 py-2 ring-1 ring-line">
														<div className="flex min-w-0 items-center gap-2">
															<Paperclip className="size-3.5 shrink-0 text-orange" />
															<span className="truncate font-mono text-[11px] text-ink">
																{replacement.name}
															</span>
														</div>
														<button
															type="button"
															onClick={() => pickReplacement(doc.id, null)}
															className="grid size-7 shrink-0 place-items-center rounded-md text-carmine transition-colors hover:bg-carmine/10"
															aria-label="Remove replacement"
														>
															<Trash2 className="size-3.5" />
														</button>
													</div>
												) : (
													<label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-line bg-paper px-3 py-3 text-[12px] text-ink-soft transition-colors hover:border-orange/40 hover:bg-orange/5 hover:text-orange">
														<span className="inline-flex items-center gap-2">
															<Upload className="size-3.5" />
															Choose replacement file
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
																pickReplacement(doc.id, picked);
															}}
															className="hidden"
														/>
													</label>
												)}
											</div>
										)}
									</li>
								);
							})}
						</ul>
					)}
				</section>

				{canEditOrg && (
					<section className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
									Submit registration
								</p>
								<p className="mt-1 text-[13px] leading-6 text-ink-soft">
									{canSave
										? "Submit your updated details and documents for review."
										: "Upload replacements for every rejected document to enable submission."}
								</p>
							</div>
							<Button
								type="submit"
								disabled={!canSave || saving}
								className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
							>
								<Check className="size-4" />
								{saving ? "Submitting…" : "Submit registration"}
								{!saving && <ArrowRight />}
							</Button>
						</div>
					</section>
				)}
			</form>
		</AppShell>
	);
}