import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import { useNavigate, useParams } from "react-router-dom";
import {
	AlertTriangle,
	ArrowLeft,
	Building2,
	Calendar,
	Check,
	CheckCircle2,
	Clock3,
	Container,
	Download,
	FileText,
	Mail,
	MapPin,
	Phone,
	ShieldCheck,
	ShieldX,
	UsersRound,
	X,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge, Metric, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";
import { resolveSrc } from "@/lib/functions";

type Status =
	| "pending"
	| "verified"
	| "under_review"
	| "rejected"
	| "suspended";

interface OrgDetail {
	id: string;
	name: string;
	type: string;
	rc_number?: string;
	tin?: string;
	contact_email?: string;
	contact_phone?: string;
	address?: string;
	status: Status;
	rejection_reason?: string | null;
	verified_by?: string | null;
	verified_at?: string | null;
	created_at?: string;
	updated_at?: string;
}

interface OrgStaff {
	id: string;
	full_name: string;
	email: string;
	phone?: string;
	role_in_org?: string;
	pics?: string;
	account_status?: string;
	email_verified_at?: string | null;
	last_login_at?: string | null;
	created_at?: string;
}

interface OrgDocument {
	id: string;
	kind: string;
	label: string;
	file_name?: string;
	file_url?: string;
	status: "pending" | "approved" | "rejected";
	rejection_reason?: string | null;
	reviewed_by?: string | null;
	reviewed_at?: string | null;
	uploaded_at?: string;
}

interface OrgContainer {
	id: string;
	number: string;
	iso_type?: string;
	seal_number?: string;
	weight_kg?: number;
	status: string;
	consignment_ref?: string;
	arrived_at?: string;
}

interface OrgDetailPayload {
	organization?: OrgDetail;
	staff?: OrgStaff[];
	documents?: OrgDocument[];
	containers?: OrgContainer[];
}

const tabs = [
	{ key: "overview", label: "Overview", icon: Building2 },
	{ key: "staff", label: "Staff", icon: UsersRound },
	{ key: "documents", label: "Documents", icon: FileText },
	{ key: "containers", label: "Containers", icon: Container },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const statusLabel: Record<Status, string> = {
	pending: "Pending",
	verified: "Verified",
	under_review: "Under Review",
	rejected: "Rejected",
	suspended: "Suspended",
};

const extractPayload = (raw: any): OrgDetailPayload => {
	if (!raw || typeof raw !== "object") return {};
	if (raw.organization || raw.staff || raw.documents || raw.containers) {
		return raw as OrgDetailPayload;
	}
	if (raw.organisation || raw.org) {
		return {
			organization: raw.organisation ?? raw.org,
			staff: raw.staff ?? [],
			documents: raw.documents ?? [],
			containers: raw.containers ?? [],
		};
	}
	return { organization: raw as OrgDetail, staff: [], documents: [], containers: [] };
};

export default function AdminOrganizationDetailsPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [tab, setTab] = useState<TabKey>("overview");
	const [org, setOrg] = useState<OrgDetail | null>(null);
	const [staff, setStaff] = useState<OrgStaff[]>([]);
	const [documents, setDocuments] = useState<OrgDocument[]>([]);
	const [containers, setContainers] = useState<OrgContainer[]>([]);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [working, setWorking] = useState(false);

	const [rejectMode, setRejectMode] = useState(false);
	const [docDecisions, setDocDecisions] = useState<
		Record<string, { mode: "approve" | "reject"; reason: string }>
	>({});
	const [generalReason, setGeneralReason] = useState("");

	const fetchAll = async () => {
		if (!id) return;
		setLoading(true);
		setError("");
		try {
			const res = await http.get(`admin/organizations/${id}/`);
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load this organisation.");
				return;
			}
			const payload = extractPayload(resp.code);
			setOrg(payload.organization ?? null);
			setStaff(payload.staff ?? []);
			setDocuments(payload.documents ?? []);
			setContainers(payload.containers ?? []);
		} catch (err: any) {
			setError(err?.response?.data?.message || "Could not load this organisation.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	useEffect(() => {
		if (!rejectMode) {
			setDocDecisions({});
			setGeneralReason("");
		}
	}, [rejectMode]);

	const initialiseRejectDecisions = () => {
		const next: Record<string, { mode: "approve" | "reject"; reason: string }> = {};
		documents.forEach((d) => {
			next[d.id] = {
				mode: d.status === "rejected" ? "reject" : "approve",
				reason: d.rejection_reason ?? "",
			};
		});
		setDocDecisions(next);
		setGeneralReason(org?.rejection_reason ?? "");
		setRejectMode(true);
	};

	const setDocumentDecision = (
		docId: string,
		mode: "approve" | "reject",
		reason?: string
	) => {
		setDocDecisions((prev) => ({
			...prev,
			[docId]: {
				mode,
				reason: reason ?? (mode === "reject" ? prev[docId]?.reason ?? "" : ""),
			},
		}));
	};

	const setDocumentReason = (docId: string, reason: string) => {
		setDocDecisions((prev) => ({
			...prev,
			[docId]: {
				mode: prev[docId]?.mode ?? "reject",
				reason,
			},
		}));
	};

	const handleApproveOrganization = async () => {
		if (!id || working) return;
		setWorking(true);
		try {
			const res = await http.post(`admin/organizations/approve/${id}/`);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not approve this organisation.");
				return;
			}
			toast.success("Organisation approved.");
			await fetchAll();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Could not approve this organisation.");
		} finally {
			setWorking(false);
		}
	};

	const handleSubmitRejection = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!id || working || !org) return;

		if (generalReason.trim().length < 5) {
			toast.error("Enter an organisation-level reason of at least 5 characters.");
			return;
		}

		const rejectedDocs = Object.entries(docDecisions)
			.filter(([, d]) => d.mode === "reject")
			.map(([docId, d]) => ({ id: docId, reason: d.reason.trim() }));

		const missingReason = rejectedDocs.find((d) => d.reason.length < 5);
		if (missingReason) {
			toast.error("Every rejected document needs a reason of at least 5 characters.");
			return;
		}

		const approvedDocs = Object.entries(docDecisions)
			.filter(([, d]) => d.mode === "approve")
			.map(([docId]) => docId);

		setWorking(true);
		try {
			const res = await http.post(`admin/organizations/reject/${id}/`, {
				reason: generalReason.trim(),
				documents: rejectedDocs.map((d) => ({
					id: d.id,
					status: "rejected",
					reason: d.reason,
				})),
				approved_documents: approvedDocs,
			});
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not reject this organisation.");
				return;
			}
			toast.success("Organisation rejected. Applicant notified.");
			setRejectMode(false);
			await fetchAll();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Could not reject this organisation.");
		} finally {
			setWorking(false);
		}
	};

	if (loading) {
		return (
			<AppShell title="Organisation details" eyebrow="Administration">
				<div className="flex items-center justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
					<span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
				</div>
			</AppShell>
		);
	}

	if (error || !org) {
		return (
			<AppShell title="Organisation details" eyebrow="Administration">
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load this organisation
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">
								{error || "The organisation may have been removed."}
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
							onClick={() => navigate("/admin/organizations")}
						>
							Back to organisations
						</Button>
					</div>
				</div>
			</AppShell>
		);
	}

	const canApprove = org.status === "pending" || org.status === "under_review";
	const canReject = org.status === "pending" || org.status === "under_review";
	const pendingDocs = documents.filter((d) => d.status === "pending").length;
	const rejectedDocs = documents.filter((d) => d.status === "rejected").length;

	return (
		<AppShell title={org.name} eyebrow="Administration · Organisation">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0">
					<Link
						to="/admin/organizations"
						className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-orange"
					>
						<ArrowLeft className="size-3.5" />
						Back to organisations
					</Link>
					<div className="mt-2 flex flex-wrap items-center gap-3">
						<h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
							{org.name}
						</h2>
						<StatusBadge
							label={statusLabel[org.status]}
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
								RC {org.rc_number}
							</span>
						)}
						{org.tin && (
							<span className="inline-flex items-center gap-1.5">
								<FileText className="size-3.5" />
								TIN {org.tin}
							</span>
						)}
						{org.created_at && (
							<span className="inline-flex items-center gap-1.5">
								<Calendar className="size-3.5" />
								Joined{" "}
								{new Date(org.created_at).toLocaleDateString("en-NG", {
									day: "numeric",
									month: "short",
									year: "numeric",
								})}
							</span>
						)}
					</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink hover:bg-sand"
						onClick={() => toast.success("Export queued.")}
					>
						<Download className="size-4" />
						Export
					</Button>
					{canReject && !rejectMode && (
						<Button
							variant="outline"
							className="border-carmine/30 bg-paper text-carmine hover:bg-carmine/10"
							onClick={initialiseRejectDecisions}
							disabled={working}
						>
							<ShieldX className="size-4" />
							Reject
						</Button>
					)}
					{canApprove && !rejectMode && (
						<Button
							className="bg-orange text-white hover:bg-orange-deep"
							onClick={handleApproveOrganization}
							disabled={working}
						>
							<CheckCircle2 className="size-4" />
							{working ? "Approving…" : "Approve organisation"}
						</Button>
					)}
					{rejectMode && (
						<Button
							variant="outline"
							className="border-line bg-paper text-ink hover:bg-sand"
							onClick={() => setRejectMode(false)}
							disabled={working}
						>
							<X className="size-4" />
							Cancel rejection
						</Button>
					)}
				</div>
			</div>

			{!rejectMode && (org.status === "rejected" || rejectedDocs > 0) && (
				<div className="rounded-xl border-l-4 border-carmine bg-carmine/5 p-4 ring-1 ring-carmine/20">
					<div className="flex items-start gap-3">
						<ShieldX className="mt-0.5 size-4 shrink-0 text-carmine" />
						<div className="min-w-0">
							<p className="font-display text-sm font-bold text-ink">
								Previously rejected
								{org.verified_at
									? ` on ${new Date(org.verified_at).toLocaleDateString("en-NG")}`
									: ""}
								{rejectedDocs > 0 ? ` · ${rejectedDocs} document${rejectedDocs === 1 ? "" : "s"}` : ""}
							</p>
							{org.rejection_reason && (
								<p className="mt-1 text-[13px] leading-6 text-ink-soft">
									{org.rejection_reason}
								</p>
							)}
							<p className="mt-2 text-[11px] leading-5 text-ink-soft">
								The applicant has been notified and can re-upload the rejected items.
							</p>
						</div>
					</div>
				</div>
			)}

			{rejectMode && (
				<form
					onSubmit={handleSubmitRejection}
					className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line"
				>
					<div className="border-b border-line bg-carmine/5 p-5">
						<div className="flex items-start gap-3">
							<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
								<ShieldX className="size-5" />
							</div>
							<div className="min-w-0">
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-carmine">
									Rejection review
								</p>
								<p className="mt-1 font-display text-lg font-bold text-ink">
									Review each document, then reject the organisation
								</p>
								<p className="mt-1 max-w-2xl text-[12px] leading-5 text-ink-soft">
									Mark each document as approved or rejected and give a reason for
									every rejected document. The applicant will see these reasons and
									can re-upload only the rejected items.
								</p>
							</div>
						</div>
					</div>

					<div className="divide-y divide-line">
						{documents.length === 0 && (
							<div className="p-6 text-center text-sm text-ink-soft">
								No documents on file for this organisation. You can still reject
								the organisation with a general reason below.
							</div>
						)}

						{documents.map((d) => {
							const decision = docDecisions[d.id] ?? {
								mode: "approve" as const,
								reason: "",
							};
							return (
								<div key={d.id} className="p-5">
									<div className="flex flex-wrap items-start gap-4">
										<div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange text-white">
											<FileText className="size-5" />
										</div>
										<div className="min-w-[200px] flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<p className="text-sm font-semibold text-ink">{d.label}</p>
												<StatusBadge
													label={d.status}
													tone={
														d.status === "approved"
															? "success"
															: d.status === "rejected"
															? "critical"
															: "warning"
													}
												/>
											</div>
											<p className="mt-0.5 font-mono text-[11px] text-ink-soft">
												{d.file_name ?? d.kind}
											</p>
											{d.status === "rejected" && d.rejection_reason && (
												<p className="mt-1 text-[11px] text-carmine">
													Previously rejected: {d.rejection_reason}
												</p>
											)}
										</div>
										{d.file_url && (
											<a
												href={resolveSrc(d.file_url)}
												target="_blank"
												rel="noopener noreferrer"
											>
												<Button
													variant="outline"
													size="sm"
													className="border-line bg-paper text-ink hover:bg-sand"
												>
													<FileText className="size-3.5" />
													View file
												</Button>
											</a>
										)}
									</div>

									<div className="mt-4 flex flex-wrap items-center gap-2">
										<button
											type="button"
											onClick={() => setDocumentDecision(d.id, "approve")}
											className={cn(
												"inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-semibold transition-colors",
												decision.mode === "approve"
													? "border-orange bg-orange text-white"
													: "border-line bg-paper text-ink-soft hover:bg-sand hover:text-ink"
											)}
										>
											<Check className="size-3.5" />
											Approve
										</button>
										<button
											type="button"
											onClick={() => setDocumentDecision(d.id, "reject")}
											className={cn(
												"inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-semibold transition-colors",
												decision.mode === "reject"
													? "border-carmine bg-carmine text-white"
													: "border-line bg-paper text-ink-soft hover:bg-sand hover:text-ink"
											)}
										>
											<XCircle className="size-3.5" />
											Reject
										</button>
									</div>

									{decision.mode === "reject" && (
										<label className="mt-3 block">
											<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-carmine">
												Reason for rejecting this document
											</span>
											<textarea
												value={decision.reason}
												onChange={(e) => setDocumentReason(d.id, e.target.value)}
												placeholder="e.g. The RC number is unreadable on the certificate."
												className="mt-2 min-h-24 w-full rounded-md border border-carmine/30 bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-carmine/25"
											/>
										</label>
									)}
								</div>
							);
						})}
					</div>

					<div className="border-t border-line bg-sand p-5">
						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-carmine">
								Organisation-level rejection reason
							</span>
							<textarea
								required
								value={generalReason}
								onChange={(e) => setGeneralReason(e.target.value)}
								placeholder="e.g. The organisation name provided does not match the CAC record."
								className="mt-2 min-h-28 w-full rounded-md border border-carmine/30 bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-carmine/25"
							/>
							<p className="mt-2 text-[11px] text-ink-soft">
								This is what the applicant sees first. Minimum 5 characters.
							</p>
						</label>

						<div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
							<p className="text-[11px] leading-5 text-ink-soft">
								{Object.values(docDecisions).filter((d) => d.mode === "reject").length}{" "}
								document(s) marked for rejection ·{" "}
								{Object.values(docDecisions).filter((d) => d.mode === "approve").length}{" "}
								approved
							</p>
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => setRejectMode(false)}
									disabled={working}
									className="border-line bg-paper text-ink hover:bg-sand"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={working}
									className="bg-carmine text-white hover:bg-carmine/90 disabled:opacity-60"
								>
									{working ? "Rejecting…" : "Reject organisation"}
								</Button>
							</div>
						</div>
					</div>
				</form>
			)}

			{!rejectMode && (
				<>
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<Metric
							label="Staff accounts"
							value={String(staff.length)}
							detail={
								staff.filter((s) => s.account_status === "active").length + " active"
							}
							tone="info"
							icon={UsersRound}
						/>
						<Metric
							label="Documents"
							value={String(documents.length)}
							detail={
								pendingDocs > 0
									? `${pendingDocs} pending review`
									: rejectedDocs > 0
									? `${rejectedDocs} rejected`
									: "All reviewed"
							}
							tone={
								rejectedDocs > 0
									? "critical"
									: pendingDocs > 0
									? "warning"
									: "success"
							}
							icon={FileText}
						/>
						<Metric
							label="Containers"
							value={String(containers.length)}
							detail="In terminal custody"
							tone="info"
							icon={Container}
						/>
						<Metric
							label="Account status"
							value={statusLabel[org.status]}
							detail={
								org.verified_by
									? `Reviewed by ${org.verified_by}`
									: "Awaiting review"
							}
							tone={
								org.status === "verified"
									? "success"
									: org.status === "rejected"
									? "critical"
									: "warning"
							}
							icon={ShieldCheck}
						/>
					</div>

					<div className="flex flex-wrap items-center gap-1.5 border-b border-line">
						{tabs.map((t) => {
							const Icon = t.icon;
							const active = tab === t.key;
							const badge =
								t.key === "staff"
									? staff.length
									: t.key === "documents"
									? documents.length
									: t.key === "containers"
									? containers.length
									: null;
							return (
								<button
									key={t.key}
									type="button"
									onClick={() => setTab(t.key)}
									className={cn(
										"inline-flex items-center gap-2 rounded-t-md border-b-2 px-4 py-2.5 text-[13px] transition-colors",
										active
											? "border-orange bg-orange/5 font-semibold text-orange"
											: "border-transparent text-ink-soft hover:bg-sand hover:text-ink"
									)}
								>
									<Icon className="size-4" />
									{t.label}
									{badge !== null && badge > 0 && (
										<span
											className={cn(
												"rounded-full px-1.5 py-0.5 font-mono text-[10px]",
												active ? "bg-orange text-white" : "bg-sand-2 text-ink-soft"
											)}
										>
											{badge}
										</span>
									)}
								</button>
							);
						})}
					</div>

					{tab === "overview" && (
						<div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-start">
							<div className="rounded-2xl bg-paper p-6 ring-1 ring-line">
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
									Contact details
								</p>
								<dl className="mt-4 grid gap-4 sm:grid-cols-2">
									<Field
										icon={Mail}
										label="Contact email"
										value={org.contact_email ?? "—"}
										mono
									/>
									<Field
										icon={Phone}
										label="Contact phone"
										value={org.contact_phone ?? "—"}
										mono
									/>
									<Field
										icon={MapPin}
										label="Address"
										value={org.address ?? "—"}
										full
									/>
									<Field
										icon={FileText}
										label="RC number"
										value={org.rc_number ?? "—"}
										mono
									/>
									<Field icon={FileText} label="TIN" value={org.tin ?? "—"} mono />
									<Field icon={Building2} label="Account type" value={org.type} />
									<Field
										icon={Calendar}
										label="Registered"
										value={
											org.created_at
												? new Date(org.created_at).toLocaleString("en-NG", {
														day: "numeric",
														month: "long",
														year: "numeric",
														hour: "2-digit",
														minute: "2-digit",
												  })
												: "—"
										}
									/>
									<Field
										icon={Clock3}
										label="Last updated"
										value={
											org.updated_at
												? new Date(org.updated_at).toLocaleString("en-NG", {
														day: "numeric",
														month: "long",
														year: "numeric",
														hour: "2-digit",
														minute: "2-digit",
												  })
												: "—"
										}
									/>
								</dl>
							</div>

							<div className="rounded-2xl bg-slate p-5 text-sand ring-1 ring-slate">
								<div className="flex items-center gap-2">
									<ShieldCheck className="size-4 text-orange" />
									<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
										Verification status
									</p>
								</div>
								<div className="mt-4 space-y-3">
									<StatusRow
										icon={FileText}
										label="Documents reviewed"
										value={`${documents.filter((d) => d.status !== "pending").length} / ${documents.length}`}
										tone={
											rejectedDocs > 0
												? "critical"
												: pendingDocs === 0
												? "success"
												: "warning"
										}
									/>
									<StatusRow
										icon={UsersRound}
										label="Staff accounts"
										value={`${staff.length}`}
										tone="info"
									/>
									<StatusRow
										icon={Container}
										label="Active containers"
										value={`${containers.length}`}
										tone="info"
									/>
									<StatusRow
										icon={ShieldCheck}
										label="Account status"
										value={statusLabel[org.status]}
										tone={
											org.status === "verified"
												? "success"
												: org.status === "rejected"
												? "critical"
												: "warning"
										}
									/>
								</div>
							</div>
						</div>
					)}

					{tab === "staff" && (
						<section className="rounded-2xl bg-paper ring-1 ring-line">
							<div className="flex items-center justify-between gap-3 border-b border-line p-4">
								<div>
									<h3 className="font-display text-sm font-bold text-ink">
										Staff accounts
									</h3>
									<p className="text-[11px] text-ink-soft">
										Users belonging to this organisation.
									</p>
								</div>
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
									{staff.length} {staff.length === 1 ? "user" : "users"}
								</span>
							</div>
							{staff.length === 0 ? (
								<div className="p-6 text-center text-sm text-ink-soft">
									No staff accounts on record.
								</div>
							) : (
								<ul className="divide-y divide-line">
									{staff.map((s) => (
										<li
											key={s.id}
											className="flex flex-wrap items-center gap-4 px-5 py-4"
										>
											<div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-sand">
												{s.pics && s.pics !== "avatar.png" ? (
													<img
														src={resolveSrc(s.pics)}
														alt={s.full_name}
														className="size-full object-cover"
													/>
												) : (
													<span className="font-display text-sm font-semibold">
														{s.full_name.slice(0, 2).toUpperCase()}
													</span>
												)}
											</div>
											<div className="min-w-[200px] flex-1">
												<div className="flex flex-wrap items-center gap-2">
													<p className="text-sm font-semibold text-ink">
														{s.full_name}
													</p>
													{s.account_status && (
														<StatusBadge
															label={s.account_status}
															tone={statusTone(s.account_status)}
														/>
													)}
												</div>
												<p className="mt-0.5 font-mono text-[11px] text-ink-soft">
													{s.email}
												</p>
											</div>
											<div className="min-w-[160px]">
												<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
													Role
												</p>
												<p className="mt-0.5 text-[12px] text-ink">
													{s.role_in_org ?? "—"}
												</p>
											</div>
											<div className="min-w-[160px]">
												<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
													Last login
												</p>
												<p className="mt-0.5 text-[12px] text-ink">
													{s.last_login_at
														? new Date(s.last_login_at).toLocaleDateString(
																"en-NG",
																{
																	day: "numeric",
																	month: "short",
																	year: "numeric",
																}
														  )
														: "—"}
												</p>
											</div>
										</li>
									))}
								</ul>
							)}
						</section>
					)}

					{tab === "documents" && (
						<section className="rounded-2xl bg-paper ring-1 ring-line">
							<div className="flex items-center justify-between gap-3 border-b border-line p-4">
								<div>
									<h3 className="font-display text-sm font-bold text-ink">
										KYC documents
									</h3>
									<p className="text-[11px] text-ink-soft">
										Documents uploaded by the applicant for verification.
									</p>
								</div>
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
									{documents.length} {documents.length === 1 ? "file" : "files"}
								</span>
							</div>
							{documents.length === 0 ? (
								<div className="p-6 text-center text-sm text-ink-soft">
									No documents uploaded yet.
								</div>
							) : (
								<ul className="divide-y divide-line">
									{documents.map((d) => (
										<li
											key={d.id}
											className="flex flex-wrap items-center gap-4 px-5 py-4"
										>
											<div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange text-white">
												<FileText className="size-5" />
											</div>
											<div className="min-w-[200px] flex-1">
												<div className="flex flex-wrap items-center gap-2">
													<p className="text-sm font-semibold text-ink">
														{d.label}
													</p>
													<StatusBadge
														label={d.status}
														tone={
															d.status === "approved"
																? "success"
																: d.status === "rejected"
																? "critical"
																: "warning"
														}
													/>
												</div>
												<p className="mt-0.5 font-mono text-[11px] text-ink-soft">
													{d.file_name ?? d.kind}
												</p>
												{d.status === "rejected" && d.rejection_reason && (
													<p className="mt-1 text-[11px] text-carmine">
														Rejected: {d.rejection_reason}
													</p>
												)}
											</div>
											<div className="min-w-[150px]">
												<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
													Uploaded
												</p>
												<p className="mt-0.5 text-[12px] text-ink">
													{d.uploaded_at
														? new Date(d.uploaded_at).toLocaleDateString(
																"en-NG",
																{
																	day: "numeric",
																	month: "short",
																	year: "numeric",
																}
														  )
														: "—"}
												</p>
											</div>
											{d.file_url && (
												<a
													href={resolveSrc(d.file_url)}
													target="_blank"
													rel="noopener noreferrer"
												>
													<Button
														variant="outline"
														size="sm"
														className="border-line bg-paper text-ink hover:bg-sand"
													>
														<FileText className="size-3.5" />
														View file
													</Button>
												</a>
											)}
										</li>
									))}
								</ul>
							)}
						</section>
					)}

					{tab === "containers" && (
						<section className="rounded-2xl bg-paper ring-1 ring-line">
							<div className="flex items-center justify-between gap-3 border-b border-line p-4">
								<div>
									<h3 className="font-display text-sm font-bold text-ink">
										Containers in custody
									</h3>
									<p className="text-[11px] text-ink-soft">
										Containers currently assigned to this organisation.
									</p>
								</div>
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
									{containers.length} {containers.length === 1 ? "unit" : "units"}
								</span>
							</div>
							{containers.length === 0 ? (
								<div className="p-6 text-center text-sm text-ink-soft">
									No containers in custody.
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full min-w-[800px] text-left text-sm">
										<thead>
											<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
												<th className="px-4 py-3 font-medium">Container</th>
												<th className="px-4 py-3 font-medium">Type</th>
												<th className="px-4 py-3 font-medium">Seal</th>
												<th className="px-4 py-3 font-medium">Weight</th>
												<th className="px-4 py-3 font-medium">Consignment</th>
												<th className="px-4 py-3 font-medium">Status</th>
												<th className="px-4 py-3 font-medium">Arrived</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-line">
											{containers.map((c) => (
												<tr
													key={c.id}
													className="transition-colors hover:bg-sand/60"
												>
													<td className="px-4 py-3.5 font-mono font-semibold text-ink">
														{c.number}
													</td>
													<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
														{c.iso_type ?? "—"}
													</td>
													<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
														{c.seal_number ?? "—"}
													</td>
													<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
														{c.weight_kg
															? `${c.weight_kg.toLocaleString()} kg`
															: "—"}
													</td>
													<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
														{c.consignment_ref ?? "—"}
													</td>
													<td className="px-4 py-3.5">
														<StatusBadge
															label={c.status}
															tone={statusTone(c.status)}
														/>
													</td>
													<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
														{c.arrived_at
															? new Date(c.arrived_at).toLocaleDateString(
																	"en-NG",
																	{
																		day: "numeric",
																		month: "short",
																		year: "numeric",
																	}
															  )
															: "—"}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</section>
					)}
				</>
			)}
		</AppShell>
	);
}

function Field({
	icon: Icon,
	label,
	value,
	mono = false,
	full = false,
}: {
	icon: typeof Mail;
	label: string;
	value: string;
	mono?: boolean;
	full?: boolean;
}) {
	return (
		<div className={full ? "sm:col-span-2" : ""}>
			<dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				<Icon className="size-3.5 text-orange" />
				{label}
			</dt>
			<dd
				className={cn(
					"mt-2 text-[14px]",
					mono ? "font-mono text-ink" : "font-medium text-ink"
				)}
			>
				{value}
			</dd>
		</div>
	);
}

function StatusRow({
	icon: Icon,
	label,
	value,
	tone = "neutral",
}: {
	icon: typeof ShieldCheck;
	label: string;
	value: string;
	tone?: "success" | "warning" | "critical" | "info" | "neutral";
}) {
	const dotTone =
		tone === "success"
			? "bg-teal"
			: tone === "warning"
			? "bg-orange"
			: tone === "critical"
			? "bg-coral"
			: tone === "info"
			? "bg-sky"
			: "bg-sand/40";

	return (
		<div className="flex items-center justify-between gap-3 rounded-lg bg-sand/5 px-3 py-2.5 ring-1 ring-sand/15">
			<div className="flex min-w-0 items-center gap-2">
				<Icon className="size-3.5 shrink-0 text-orange" />
				<span className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-sand/70">
					{label}
				</span>
			</div>
			<div className="flex min-w-0 items-center gap-2">
				<span className="truncate text-[12px] font-medium text-sand">{value}</span>
				<span className={cn("size-1.5 shrink-0 rounded-full", dotTone)} />
			</div>
		</div>
	);
}