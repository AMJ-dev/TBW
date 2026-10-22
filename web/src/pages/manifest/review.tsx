import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
	AlertTriangle,
	ArrowLeft,
	CheckCircle2,
	ChevronRight,
	FileText,
	RefreshCw,
	Search,
	Send,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";

type Manifest = {
	id: string;
	manifest_ref: string;
	bill_of_lading: string;
	vessel: string | null;
	shipping_line: string | null;
	origin_port: string | null;
	eta: string | null;
	containers: number;
	packages: number;
	gross_weight: string | null;
	notes: string | null;
	status: string;
	review_reason: string | null;
	correction_reason: string | null;
	review_status: string | null;
	flagged_at: string | null;
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

const toDraft = (manifest: Manifest): Draft => ({
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

const labelClass =
	"block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const textareaClass =
	"mt-1.5 w-full resize-y rounded-md border border-line bg-sand px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:ring-2 focus:ring-orange/30";

export default function ManifestSupervisorReviewPage() {
	const [manifests, setManifests] = useState<Manifest[]>([]);
	const [selectedId, setSelectedId] = useState("");
	const [draft, setDraft] = useState<Draft>(emptyDraft);
	const [correctionReason, setCorrectionReason] = useState("");
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [view, setView] = useState<View>("list");

	const selected = useMemo(
		() => manifests.find((manifest) => manifest.id === selectedId) ?? null,
		[manifests, selectedId],
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
				const rows = Array.isArray(resp.data) ? (resp.data as Manifest[]) : [];
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

	const openManifest = (manifest: Manifest) => {
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
    if(action === "validate"){
      body.append("id", selected.id);
      body.append("correction_reason", correctionReason.trim());

      Object.entries(draft).forEach(([key, value]) => {
        body.append(key, value);
      });
    }else{
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
			<div className="overflow-hidden">
				{view === "list" && (
					<div
						className="space-y-5"
						style={{
							animation:
								"slideInFromRight 260ms cubic-bezier(0.32, 0.72, 0, 1)",
						}}
					>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className="flex flex-wrap items-end justify-between gap-4"
						>
							<div className="min-w-0">
								<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
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
								className="border-line bg-paper text-ink hover:bg-sand"
							>
								<RefreshCw
									className={cn(
										"mr-1.5 size-4",
										loading && "animate-spin"
									)}
								/>
								Refresh queue
							</Button>
						</motion.div>

						<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

						<section className="rounded-xl bg-paper ring-1 ring-line">
							<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
								<div className="flex items-center gap-2">
									<span className="grid size-8 place-items-center rounded-lg bg-orange/10 text-orange-deep">
										<Sparkles className="size-4" />
									</span>
									<div>
										<h3 className="text-[13px] font-semibold text-ink">
											Review queue
										</h3>
										<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											{filteredManifests.length} of {manifests.length} records
										</p>
									</div>
								</div>
								<div className="relative min-w-[260px] flex-1 sm:max-w-[340px]">
									<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
									<Input
										value={search}
										onChange={(event) => setSearch(event.target.value)}
										placeholder="Search by reference, BL, or vessel…"
										className="h-10 border-line bg-sand pl-9 text-sm text-ink"
									/>
								</div>
							</div>

							{loading ? (
								<div className="flex items-center justify-center p-12">
									<RefreshCw className="size-6 animate-spin text-orange" />
									<span className="ml-3 text-sm text-ink-soft">
										Loading review queue…
									</span>
								</div>
							) : filteredManifests.length === 0 ? (
								<div className="p-12 text-center">
									<CheckCircle2 className="mx-auto size-7 text-teal-deep" />
									<p className="mt-3 font-medium text-ink">
										Nothing to review
									</p>
									<p className="mt-1 text-[12px] text-ink-soft">
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
												className="group flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-sand/60"
											>
												<span className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep ring-1 ring-orange/15 transition group-hover:bg-orange group-hover:text-white">
													<FileText className="size-5" />
												</span>
												<div className="min-w-[220px] flex-1">
													<div className="flex flex-wrap items-center gap-2">
														<p className="font-mono text-[12px] font-semibold text-ink">
															{manifest.manifest_ref}
														</p>
														<StatusBadge
															label={
																manifest.review_status ?? "Pending"
															}
															tone={statusTone(
																manifest.review_status ?? "Pending"
															)}
														/>
														{manifest.status && (
															<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
																{manifest.status}
															</span>
														)}
													</div>
													<p className="mt-1 text-[12px] text-ink-soft">
														<span className="font-mono text-ink">
															BL ·{" "}
														</span>
														{manifest.bill_of_lading}
													</p>
													<div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-soft">
														{manifest.vessel && (
															<span>
																<span className="font-mono uppercase tracking-[0.08em] text-ink-soft/70">
																	Vessel
																</span>{" "}
																{manifest.vessel}
															</span>
														)}
														{manifest.shipping_line && (
															<span>
																<span className="font-mono uppercase tracking-[0.08em] text-ink-soft/70">
																	Line
																</span>{" "}
																{manifest.shipping_line}
															</span>
														)}
														{manifest.flagged_at && (
															<span>
																<span className="font-mono uppercase tracking-[0.08em] text-ink-soft/70">
																	Flagged
																</span>{" "}
																{manifest.flagged_at}
															</span>
														)}
													</div>
												</div>
												<ChevronRight className="mt-3 size-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-orange-deep" />
											</button>
										</li>
									))}
								</ul>
							)}

							<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
								<span>
									Showing {filteredManifests.length} of {manifests.length} review
									records
								</span>
								<span>Decisions are recorded against the audit trail</span>
							</div>
						</section>
					</div>
				)}

				{view === "detail" && selected && (
					<div
						key={selected.id}
						className="space-y-5 pb-8"
						style={{
							animation:
								"slideInFromRight 260ms cubic-bezier(0.32, 0.72, 0, 1)",
						}}
					>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<Button
								variant="ghost"
								onClick={closeManifest}
								disabled={saving}
								className="-ml-3 gap-2 text-ink-soft hover:text-ink"
							>
								<ArrowLeft className="size-4" />
								Back to review queue
							</Button>
							<Button
								variant="outline"
								onClick={() => void fetchManifests(selectedId)}
								disabled={loading || saving}
								className="border-line bg-paper text-ink hover:bg-sand"
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

						<div className="rounded-2xl bg-paper ring-1 ring-line">
							<div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
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

							<div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
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
									value={selected.flagged_at || "—"}
									mono
								/>
							</div>
						</div>

						<div className="rounded-2xl border border-amber/30 bg-amber/5 p-5 ring-1 ring-amber/20 sm:p-6">
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

						<div className="rounded-2xl bg-paper ring-1 ring-line">
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
										className="border-line bg-paper text-ink hover:bg-sand"
									>
										<Send className="mr-1.5 size-4" />
										Return to Operations
									</Button>
									<Button
										type="button"
										onClick={() => void submitDecision("validate")}
										disabled={saving}
										className="bg-orange text-white hover:bg-orange-deep"
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
					</div>
				)}
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
		<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
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
		<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
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