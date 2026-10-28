import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	ChevronRight,
	ClipboardCheck,
	Clock3,
	FileText,
	Hash,
	Info,
	Loader2,
	MapPin,
	Package,
	RefreshCw,
	Search,
	Send,
	ShieldCheck,
	Ship,
	Sparkles,
	User,
	X,
	Container as ContainerIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";
import {statusLabel} from "@/lib/functions"

type ShipmentContainer = {
	id: string;
	shipment_id: string;
	container_no: string;
	size: string;
	seal_no: string;
	package_count: string | null;
	gross_weight: string | null;
	customs_tariff_id: string | null;
	cargo_description: string | null;
	package_type: string | null;
	hs_code: string | null;
	item_quantity: string | null;
	unit_of_measure: string | null;
	unit_value: string;
	currency: string;
	total_value: string;
	created_at: string;
	status: string;
	gate_in_at: string | null;
	received_at: string | null;
	stored_at: string | null;
	gate_out_at: string | null;
	updated_at: string;
	tariff_hs_code: string | null;
	customs_tariff_description: string | null;
};

type ManifestReviewRecord = {
	id: string;
	manifest_ref: string;
	bill_of_lading: string;
	vessel: string;
	shipping_line: string;
	origin_port: string;
	eta: string;
	containers: number;
	packages: string;
	gross_weight: string;
	consignee: string;
	consignee_type: string;
	consignee_organisation_id: string | null;
	agent: string;
	agent_organisation_id: string | null;
	consignee_email: string | null;
	consignee_phone: string | null;
	consignee_address: string | null;
	source: string;
	status: string;
	notes: string | null;
	review_reason: string | null;
	review_responsible_party: string | null;
	flagged_by: string | null;
	flagged_at: string | null;
	duplicate_of: string | null;
	matched_shipment_id: string | null;
	created_by: string;
	validated_by: string | null;
	validated_at: string | null;
	received_at: string;
	updated_at: string;
	consignee_status: string | null;
	review_status: string | null;
	correction_reason: string | null;
	reviewed_by: string | null;
	reviewed_at: string | null;
	shipment_id: string | null;
	shipment_reference: string | null;
	shipment_user_id: string | null;
	shipment_organisation_id: string | null;
	shipment_type: string | null;
	booking_number: string | null;
	voyage_number: string | null;
	origin_country: string | null;
	destination_port: string | null;
	cargo_description: string | null;
	cargo_category: string | null;
	package_type: string | null;
	shipment_package_count: string | null;
	shipment_gross_weight: string | null;
	volume: string | null;
	dangerous_goods: string | null;
	temperature_controlled: string | null;
	temperature: string | null;
	special_instructions: string | null;
	customs_reference: string | null;
	shipment_status: string | null;
	shipment_created_at: string | null;
	shipment_updated_at: string | null;
	shipment_containers: ShipmentContainer[];
	container_count: number;
};

type Draft = {
	manifest_ref: string;
	bill_of_lading: string;
	vessel: string;
	shipping_line: string;
	origin_port: string;
	eta: string;
	containers: string;
	packages: string;
	gross_weight: string;
	notes: string;
};

const emptyDraft: Draft = {
	manifest_ref: "",
	bill_of_lading: "",
	vessel: "",
	shipping_line: "",
	origin_port: "",
	eta: "",
	containers: "0",
	packages: "0",
	gross_weight: "",
	notes: "",
};

const toDraft = (manifest: ManifestReviewRecord): Draft => ({
	manifest_ref: manifest.manifest_ref ?? "",
	bill_of_lading: manifest.bill_of_lading ?? "",
	vessel: manifest.vessel ?? "",
	shipping_line: manifest.shipping_line ?? "",
	origin_port: manifest.origin_port ?? "",
	eta: manifest.eta ?? "",
	containers: String(manifest.containers ?? 0),
	packages: String(manifest.packages ?? 0),
	gross_weight: manifest.gross_weight ?? "",
	notes: manifest.notes ?? "",
});

const fieldGroups: {
	title: string;
	fields: { name: keyof Draft; label: string; required?: boolean }[];
}[] = [
	{
		title: "Manifest identification",
		fields: [
			{ name: "manifest_ref", label: "Manifest reference", required: true },
			{ name: "bill_of_lading", label: "Bill of lading", required: true },
			{ name: "vessel", label: "Vessel name" },
			{ name: "shipping_line", label: "Shipping line" },
		],
	},
	{
		title: "Arrival and cargo",
		fields: [
			{ name: "origin_port", label: "Origin port" },
			{ name: "eta", label: "Expected arrival" },
			{ name: "containers", label: "Number of containers", required: true },
			{ name: "packages", label: "Number of packages", required: true },
			{ name: "gross_weight", label: "Gross weight (KG)" },
		],
	},
];

const pageAnimations = `
	@keyframes slideInFromRight {
		from { opacity: 0; transform: translateX(24px); }
		to { opacity: 1; transform: translateX(0); }
	}
`;

type View = "list" | "detail";

const labelClass = "block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const textareaClass = "mt-1.5 w-full resize-y rounded-md border border-line bg-sand px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:ring-2 focus:ring-orange/30";

const formatDate = (value: string | null) => {
	if (!value) return "—";
	const date = new Date(String(value).replace(" ", "T"));
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

export default function ManifestSupervisorReviewPage() {
	const [manifests, setManifests] = useState<ManifestReviewRecord[]>([]);
	const [selectedId, setSelectedId] = useState("");
	const [draft, setDraft] = useState<Draft>(emptyDraft);
	const [correctionReason, setCorrectionReason] = useState("");
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [view, setView] = useState<View>("list");

	const selected = useMemo(
		() => manifests.find((manifest) => manifest.id === selectedId) ?? null,
		[manifests, selectedId]
	);

	const fetchManifests = useCallback(
		async (preferredId?: string) => {
			setLoading(true);
			try {
				const res = await http.get("operations/manifests/review/");
				const resp: Resp = res.data;
				if (resp.error) {
					toast.error(
						typeof resp.data === "string"
							? resp.data
							: "Could not load manifest reviews."
					);
					return;
				}
				const rows = Array.isArray(resp.data) ? (resp.data as ManifestReviewRecord[]) : [];
				setManifests(rows);
				const nextId =
					rows.find((item) => item.id === preferredId)?.id ??
					rows.find((item) => item.id === selectedId)?.id ??
					rows[0]?.id ??
					"";
				setSelectedId(nextId);
				const next = rows.find((item) => item.id === nextId);
				setDraft(next ? toDraft(next) : emptyDraft);
				setCorrectionReason(next?.correction_reason ?? "");
			} catch {
				toast.error("Could not load manifest reviews.");
			} finally {
				setLoading(false);
			}
		},
		[selectedId]
	);

	useEffect(() => {
		void fetchManifests();
	}, [fetchManifests]);

	const filteredManifests = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return manifests;
		return manifests.filter((manifest) =>
			[manifest.manifest_ref, manifest.bill_of_lading, manifest.vessel]
				.filter(Boolean)
				.some((value) => String(value).toLowerCase().includes(query))
		);
	}, [manifests, search]);

	const pendingCount = useMemo(
		() =>
			manifests.filter((m) => {
				const s = (m.review_status ?? "pending").toLowerCase();
				return s === "pending" || s === "flagged" || s === "under review";
			}).length,
		[manifests]
	);

	const openManifest = (manifest: ManifestReviewRecord) => {
		setSelectedId(manifest.id);
		setDraft(toDraft(manifest));
		setCorrectionReason(manifest.correction_reason ?? "");
		setView("detail");
	};

	const closeManifest = () => setView("list");

	const updateField = (name: keyof Draft, value: string) => {
		setDraft((current) => ({ ...current, [name]: value }));
	};

	const submitDecision = async (action: "validate" | "return") => {
		if (!selected) {
			toast.error("Select a manifest first.");
			return;
		}

		if (correctionReason.trim().length < 5) {
			toast.error("Enter a correction or return reason of at least 5 characters.");
			return;
		}

		if (!draft.manifest_ref.trim() || !draft.bill_of_lading.trim()) {
			toast.error("Manifest reference and bill of lading are required.");
			return;
		}

		const body = new FormData();
		if (action === "validate") {
			body.append("id", selected.id);
			body.append("correction_reason", correctionReason.trim());

			Object.entries(draft).forEach(([key, value]) => {
				body.append(key, value);
			});
		} else {
			body.append("responsible_party", "Organisation");
			body.append("reason", correctionReason.trim());
		}

		setSaving(true);

		try {
			const endpoint =
				action === "validate"
					? `operations/manifests/validate/${selected.id}/`
					: `operations/manifests/flag/${selected.id}/`;

			const res = await http.post(endpoint, body);
			const resp: Resp = res.data;

			if (resp.error) {
				toast.error(
					typeof resp.data === "string"
						? resp.data
						: "The manifest action could not be completed."
				);
				return;
			}

			toast.success(
				typeof resp.data === "string"
					? resp.data
					: action === "validate"
						? "Manifest validated."
						: "Manifest returned to Operations."
			);

			await fetchManifests();
			setView("list");
		} catch (error: any) {
			toast.error(
				error?.response?.data?.data ||
					error?.response?.data?.message ||
					"The manifest action could not be completed."
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<AppShell title="Manifest Review" eyebrow="Operations">
			<style>{pageAnimations}</style>
			<div className="overflow-hidden pb-12">
				<AnimatePresence mode="wait">
					{view === "list" && (
						<motion.div
							key="list"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.2 }}
							className="space-y-6"
						>
							<div className="flex flex-wrap items-end justify-between gap-4">
								<div className="min-w-0">
									<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-orange-deep">
										Operations · Supervisor review
									</p>
									<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
										Manifest review
									</h2>
									<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
										Verify flagged manifest details, document corrections, and
										approve or return the record to Operations.
									</p>
								</div>
								<Button
									variant="outline"
									onClick={() => void fetchManifests(selectedId)}
									disabled={loading || saving}
									className="cursor-pointer border-line bg-paper text-ink hover:bg-sand"
								>
									<RefreshCw
										className={cn(
											"mr-1.5 size-4",
											loading && "animate-spin"
										)}
									/>
									Refresh queue
								</Button>
							</div>

							<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
								<ReviewMetric
									label="In queue"
									value={String(manifests.length)}
									detail="Flagged for review"
									tone="info"
									icon={FileText}
								/>
								<ReviewMetric
									label="Awaiting decision"
									value={String(pendingCount)}
									detail="Pending action from you"
									tone={pendingCount > 0 ? "warning" : "success"}
									icon={AlertTriangle}
								/>
								<ReviewMetric
									label="Reviewed today"
									value={String(
										manifests.filter((m) => {
											const s = (m.review_status ?? "").toLowerCase();
											return s === "approved" || s === "returned";
										}).length
									)}
									detail="Approved or returned"
									tone="success"
									icon={CheckCircle2}
								/>
								<ReviewMetric
									label="Review SLA"
									value="24h"
									detail="Target turnaround"
									tone="info"
									icon={ShieldCheck}
								/>
							</div>

							<section className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
								<div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-sand/30 p-5 sm:p-6">
									<div className="flex items-center gap-3">
										<span className="grid size-10 place-items-center rounded-xl bg-orange/10 text-orange-deep">
											<Sparkles className="size-5" />
										</span>
										<div>
											<h3 className="font-display text-base font-bold text-ink">
												Review queue
											</h3>
											<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
												{filteredManifests.length} of {manifests.length} records
											</p>
										</div>
									</div>
									<div className="relative w-full max-w-sm">
										<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
										<Input
											value={search}
											onChange={(event) => setSearch(event.target.value)}
											placeholder="Search by reference, BL, or vessel…"
											className="h-10 border-line bg-paper pl-9 text-sm text-ink"
										/>
									</div>
								</div>

								{loading ? (
									<div className="flex flex-col items-center justify-center p-12">
										<RefreshCw className="size-8 animate-spin text-orange" />
										<span className="mt-3 text-sm text-ink-soft">
											Loading review queue…
										</span>
									</div>
								) : filteredManifests.length === 0 ? (
									<div className="flex flex-col items-center justify-center p-12 text-center">
										<div className="grid size-14 place-items-center rounded-2xl bg-teal/10 text-teal-deep">
											<CheckCircle2 className="size-7" />
										</div>
										<p className="mt-4 font-display text-lg font-bold text-ink">
											Nothing to review
										</p>
										<p className="mt-1 max-w-xs text-sm text-ink-soft">
											There are no matching Operations reviews right now.
										</p>
									</div>
								) : (
									<ul className="divide-y divide-line">
										{filteredManifests.map((manifest) => (
											<li key={manifest.id}>
												<button
													type="button"
													onClick={() => openManifest(manifest)}
													className="group flex w-full cursor-pointer items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-sand/60 sm:px-6 sm:py-5"
												>
													<span className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep ring-1 ring-orange/15 transition group-hover:bg-orange group-hover:text-white">
														<FileText className="size-5" />
													</span>
													<div className="min-w-[220px] flex-1">
														<div className="flex flex-wrap items-center gap-2">
															<p className="font-mono text-[13px] font-semibold text-ink">
																{manifest.manifest_ref}
															</p>
															<StatusBadge
																label={manifest.review_status ?? "Pending"}
																tone={statusTone(manifest.review_status ?? "Pending")}
															/>
															{manifest.status && (
																<span className="rounded bg-sand-2 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
																	{manifest.status}
																</span>
															)}
														</div>
														<p className="mt-1.5 text-[13px] text-ink-soft">
															<span className="font-mono text-ink">BL · </span>
															{manifest.bill_of_lading}
														</p>
														<div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-ink-soft">
															{manifest.vessel && (
																<span className="flex items-center gap-1.5">
																	<Ship className="size-3" />
																	{manifest.vessel}
																</span>
															)}
															{manifest.shipping_line && (
																<span className="flex items-center gap-1.5">
																	<ClipboardCheck className="size-3" />
																	{manifest.shipping_line}
																</span>
															)}
															{manifest.flagged_at && (
																<span className="flex items-center gap-1.5 text-orange-deep">
																	<Clock3 className="size-3" />
																	Flagged: {formatDate(manifest.flagged_at)}
																</span>
															)}
														</div>
													</div>
													<ChevronRight className="mt-3 size-5 shrink-0 text-ink-soft transition-transform group-hover:translate-x-1 group-hover:text-orange-deep" />
												</button>
											</li>
										))}
									</ul>
								)}

								<div className="flex items-center justify-between border-t border-line bg-sand/30 px-5 py-4 font-mono text-[10px] text-ink-soft sm:px-6">
									<span>
										Showing {filteredManifests.length} of {manifests.length} review records
									</span>
									<span>Decisions are recorded against the audit trail</span>
								</div>
							</section>
						</motion.div>
					)}

					{view === "detail" && selected && (
						<motion.div
							key="detail"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.2 }}
							className="space-y-6"
						>
							<div className="flex flex-wrap items-center justify-between gap-3">
								<Button
									variant="ghost"
									onClick={closeManifest}
									disabled={saving}
									className="-ml-3 cursor-pointer gap-2 text-ink-soft hover:text-ink"
								>
									<ArrowLeft className="size-4" />
									Back to review queue
								</Button>
								<Button
									variant="outline"
									onClick={() => void fetchManifests(selectedId)}
									disabled={loading || saving}
									className="cursor-pointer border-line bg-paper text-ink hover:bg-sand"
								>
									<RefreshCw
										className={cn(
											"mr-1.5 size-4",
											loading && "animate-spin"
										)}
									/>
									Refresh
								</Button>
							</div>

							<div className="rounded-2xl border border-line bg-paper shadow-sm">
								<div className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-sand/30 p-5 sm:p-6">
									<div className="min-w-0">
										<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
											Supervisor review
										</p>
										<h3 className="mt-1 break-words font-display text-xl font-bold text-ink">
											{selected.manifest_ref}
										</h3>
										<p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">
											BL · {selected.bill_of_lading}
										</p>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										<StatusBadge
											label={selected.status || "Unknown"}
											tone={statusTone(selected.status || "Unknown")}
										/>
										{selected.review_status && (
											<StatusBadge
												label={selected.review_status}
												tone={statusTone(selected.review_status)}
											/>
										)}
									</div>
								</div>

								<div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
									<ReviewHeroStat
										label="Vessel"
										value={selected.vessel || "—"}
									/>
									<ReviewHeroStat
										label="Shipping line"
										value={selected.shipping_line || "—"}
									/>
									<ReviewHeroStat
										label="Flagged"
										value={formatDate(selected.flagged_at)}
										mono
									/>
								</div>
							</div>

							<div className="rounded-2xl border border-amber/30 bg-amber/5 p-5 shadow-sm ring-1 ring-amber/20 sm:p-6">
								<div className="flex items-start gap-3">
									<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber/15 text-orange-deep">
										<AlertTriangle className="size-4" />
									</span>
									<div className="min-w-0">
										<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-deep">
											Reason flagged for review
										</p>
										<p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-ink">
											{selected.review_reason || "No reason was supplied."}
										</p>
									</div>
								</div>
							</div>

							<div className="rounded-2xl border border-line bg-paper shadow-sm">
								<div className="border-b border-line p-5 sm:p-6">
									<h3 className="font-display text-sm font-bold text-ink">
										Manifest details
									</h3>
									<p className="mt-1 text-xs leading-5 text-ink-soft">
										Edit incorrect information before approving. Required
										fields are marked.
									</p>
								</div>

								<div className="space-y-7 p-5 sm:p-6">
									{fieldGroups.map((group) => (
										<div key={group.title}>
											<div className="mb-4 flex items-center gap-2">
												<span className="h-px flex-1 bg-line" />
												<h4 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
													{group.title}
												</h4>
												<span className="h-px flex-1 bg-line" />
											</div>
											<div className="grid gap-4 sm:grid-cols-2">
												{group.fields.map((field) => (
													<label
														key={field.name}
														className="block space-y-2"
													>
														<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
															{field.label}
															{field.required && (
																<span className="ml-1 text-coral">
																	*
																</span>
															)}
														</span>
														<Input
															value={draft[field.name]}
															onChange={(event) =>
																updateField(
																	field.name,
																	event.target.value
																)
															}
															required={field.required}
															inputMode={
																field.name === "containers" ||
																field.name === "packages"
																	? "numeric"
																	: undefined
															}
															disabled={saving}
															className="h-11 border-line bg-sand font-medium text-ink placeholder:text-ink-soft/60 focus:ring-2 focus:ring-orange/30"
														/>
													</label>
												))}
											</div>
										</div>
									))}

									<div>
										<label className={labelClass}>Internal notes</label>
										<textarea
											value={draft.notes}
											onChange={(event) =>
												updateField("notes", event.target.value)
											}
											disabled={saving}
											rows={3}
											className={textareaClass}
											placeholder="Additional manifest notes…"
										/>
									</div>

									<div className="rounded-xl border border-line bg-sand/40 p-4 sm:p-5">
										<label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Correction / decision reason
											<span className="ml-1 text-coral">*</span>
										</label>
										<textarea
											value={correctionReason}
											onChange={(event) =>
												setCorrectionReason(event.target.value)
											}
											disabled={saving}
											required
											minLength={5}
											maxLength={2000}
											rows={4}
											className="w-full resize-y rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:ring-2 focus:ring-orange/30"
											placeholder="Explain what was corrected and why, or what Operations must do next…"
										/>
										<p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
											{correctionReason.length}/2000 · saved with the decision
										</p>
									</div>

									<div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
										<Button
											type="button"
											variant="outline"
											onClick={() => void submitDecision("return")}
											disabled={saving}
											className="cursor-pointer border-line bg-paper text-ink hover:bg-sand"
										>
											<Send className="mr-1.5 size-4" />
											Return to Operations
										</Button>
										<Button
											type="button"
											onClick={() => void submitDecision("validate")}
											disabled={saving}
											className="cursor-pointer bg-orange text-white hover:bg-orange-deep"
										>
											{saving ? (
												<RefreshCw className="mr-1.5 size-4 animate-spin" />
											) : (
												<CheckCircle2 className="mr-1.5 size-4" />
											)}
											{saving ? "Processing…" : "Approve Manifest"}
										</Button>
									</div>
								</div>
							</div>

							{/* Premium Linked Shipment Details Panel */}
							{selected.shipment_id && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
									className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm"
								>
									<div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-slate px-5 py-4 text-sand sm:px-6">
										<div className="flex items-center gap-3">
											<div className="grid size-10 place-items-center rounded-xl bg-white/10 text-white backdrop-blur-sm">
												<Ship className="size-5" />
											</div>
											<div>
												<h3 className="font-display text-sm font-bold text-white">
													Linked Shipment Declaration
												</h3>
												<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-sand/70">
													Ref: {selected.shipment_reference || "—"}
												</p>
											</div>
										</div>
										<StatusBadge
											label={statusLabel(selected.shipment_status)}
											tone={statusTone(selected.shipment_status || "")}
										/>
									</div>

									<div className="p-5 sm:p-6">
										<div className="grid gap-6 md:grid-cols-2">
											{/* Shipment Details */}
											<div className="space-y-4">
												<div className="rounded-xl border border-line bg-sand/40 p-4">
													<h4 className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														Shipping Information
													</h4>
													<div className="grid gap-4 sm:grid-cols-2">
														<div>
															<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Booking No.</p>
															<p className="mt-0.5 text-[12px] font-medium text-ink">{selected.booking_number || "—"}</p>
														</div>
														<div>
															<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Voyage No.</p>
															<p className="mt-0.5 text-[12px] font-medium text-ink">{selected.voyage_number || "—"}</p>
														</div>
														<div>
															<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Origin Port</p>
															<p className="mt-0.5 text-[12px] font-medium text-ink">{selected.origin_port || "—"} <span className="text-ink-soft">({selected.origin_country || "—"})</span></p>
														</div>
														<div>
															<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Destination Port</p>
															<p className="mt-0.5 text-[12px] font-medium text-ink">{selected.destination_port || "—"}</p>
														</div>
													</div>
												</div>

												<div className="rounded-xl border border-line bg-sand/40 p-4">
													<h4 className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														Cargo Details
													</h4>
													<div className="space-y-3">
														<div>
															<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Description</p>
															<p className="mt-0.5 text-[12px] leading-relaxed text-ink">{selected.cargo_description || "—"}</p>
														</div>
														<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
															<div>
																<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Category</p>
																<p className="mt-0.5 text-[12px] text-ink">{selected.cargo_category || "—"}</p>
															</div>
															<div>
																<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Type</p>
																<p className="mt-0.5 text-[12px] text-ink">{selected.package_type || "—"}</p>
															</div>
															<div>
																<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Packages</p>
																<p className="mt-0.5 text-[12px] text-ink">{selected.shipment_package_count || "—"}</p>
															</div>
															<div>
																<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Gross Wt.</p>
																<p className="mt-0.5 text-[12px] text-ink">{selected.shipment_gross_weight || "—"}</p>
															</div>
														</div>
													</div>
												</div>
											</div>

											{/* Consignee Details */}
											<div className="space-y-4">
												<div className="rounded-xl border border-line bg-sand/40 p-4">
													<h4 className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														Consignee Details
													</h4>
													<div className="space-y-3">
														<div>
															<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Name</p>
															<p className="mt-0.5 text-[12px] font-medium text-ink">{selected.consignee || "—"}</p>
														</div>
														<div className="grid gap-3 sm:grid-cols-2">
															<div>
																<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Email</p>
																<p className="mt-0.5 text-[12px] text-ink">{selected.consignee_email || "—"}</p>
															</div>
															<div>
																<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Phone</p>
																<p className="mt-0.5 text-[12px] text-ink">{selected.consignee_phone || "—"}</p>
															</div>
														</div>
														<div>
															<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Address</p>
															<p className="mt-0.5 text-[12px] text-ink">{selected.consignee_address || "—"}</p>
														</div>
													</div>
												</div>

												{selected.customs_reference && (
													<div className="rounded-xl border border-orange/20 bg-orange/5 p-4">
														<div className="flex items-center gap-2">
															<Hash className="size-4 text-orange-deep" />
															<div>
																<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-orange-deep">Customs Reference</p>
																<p className="mt-0.5 font-mono text-[13px] font-semibold text-ink">{selected.customs_reference}</p>
															</div>
														</div>
													</div>
												)}
											</div>
										</div>

										{/* Container Details */}
										<div className="mt-6 border-t border-line pt-6">
											<div className="mb-4 flex items-center justify-between">
												<h4 className="font-display text-sm font-bold text-ink flex items-center gap-2">
													<ContainerIcon className="size-4 text-orange" />
													Containers Declared
												</h4>
												<span className="rounded-full bg-sand px-2.5 py-0.5 font-mono text-[10px] font-semibold text-ink-soft">
													{selected.container_count || selected.shipment_containers?.length || 0} total
												</span>
											</div>

											<div className="grid gap-4 sm:grid-cols-2">
												{selected.shipment_containers?.map((container, idx) => (
													<div key={container.id} className="overflow-hidden rounded-xl border border-line bg-sand/30 shadow-sm">
														{/* Container Header */}
														<div className="flex items-center justify-between border-b border-line bg-paper px-4 py-2.5">
															<div className="flex items-center gap-2">
																<Package className="size-3.5 text-ink-soft" />
																<p className="font-mono text-[12px] font-bold text-ink">
																	{container.container_no}
																</p>
															</div>
															<StatusBadge label={statusLabel(container.status)} tone={statusTone(container.status)} />
														</div>
														
														{/* Container Stats */}
														<div className="grid grid-cols-2 gap-y-2 p-3">
															<div>
																<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Size</p>
																<p className="mt-0.5 text-[11px] font-medium text-ink">{container.size || "—"}</p>
															</div>
															<div>
																<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Seal No.</p>
																<p className="mt-0.5 font-mono text-[11px] text-ink">{container.seal_no || "—"}</p>
															</div>
															<div>
																<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Packages</p>
																<p className="mt-0.5 font-mono text-[11px] text-ink">{container.package_count || "—"}</p>
															</div>
															<div>
																<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">Gross Wt.</p>
																<p className="mt-0.5 font-mono text-[11px] text-ink">{container.gross_weight || "—"}</p>
															</div>
														</div>

														{/* Tariff / HS Code Info */}
														<div className="border-t border-line bg-paper px-4 py-2.5">
															<div className="flex items-start gap-2">
																<ShieldCheck className="mt-0.5 size-3 shrink-0 text-teal-deep" />
																<div>
																	<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">HS Code / Tariff</p>
																	<p className="mt-0.5 font-mono text-[11px] font-semibold text-ink">
																		{container.hs_code || container.tariff_hs_code || "Not assigned"}
																	</p>
																</div>
															</div>
														</div>
													</div>
												))}
												{(!selected.shipment_containers || selected.shipment_containers.length === 0) && (
													<p className="col-span-2 rounded-lg bg-sand p-4 text-center text-xs text-ink-soft">
														No containers declared for this shipment.
													</p>
												)}
											</div>
										</div>
									</div>
								</motion.div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</AppShell>
	);
}

function ReviewMetric({
	label,
	value,
	detail,
	tone,
	icon: Icon,
}: {
	label: string;
	value: string;
	detail: string;
	tone: "info" | "warning" | "success" | "critical";
	icon: typeof FileText;
}) {
	const toneClass =
		tone === "success"
			? "bg-teal/10 text-teal-deep ring-teal/20"
			: tone === "warning"
				? "bg-amber/15 text-orange-deep ring-amber/25"
				: tone === "critical"
					? "bg-coral/10 text-coral ring-coral/20"
					: "bg-orange/10 text-orange-deep ring-orange/20";

	return (
		<div className="rounded-2xl border border-line bg-paper p-5 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
						{label}
					</p>
					<p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
						{value}
					</p>
					<p className="mt-1 text-[11px] text-ink-soft">{detail}</p>
				</div>
				<span
					className={cn(
						"grid size-10 shrink-0 place-items-center rounded-lg ring-1",
						toneClass
					)}
				>
					<Icon className="size-5" />
				</span>
			</div>
		</div>
	);
}

function ReviewHeroStat({
	label,
	value,
	mono,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="rounded-xl border border-line bg-sand/50 p-3">
			<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
				{label}
			</p>
			<p
				className={cn(
					"mt-1 truncate text-[13px] font-semibold text-ink",
					mono && "font-mono"
				)}
			>
				{value}
			</p>
		</div>
	);
}