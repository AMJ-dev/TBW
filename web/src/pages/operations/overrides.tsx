import { useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Check,
	ChevronLeft,
	ClipboardCheck,
	Clock3,
	Download,
	Filter,
	History,
	Search,
	ShieldAlert,
	ShieldCheck,
	User,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type OverrideKind =
	| "Gate admit"
	| "Gate refer"
	| "Gate reject"
	| "Payment release"
	| "Hold lift"
	| "Tariff waiver"
	| "Storage extension";

type OverrideStatus =
	| "Pending"
	| "Approved"
	| "Rejected"
	| "Expired"
	| "Withdrawn";

interface OverrideRequest {
	id: string;
	reference: string;
	kind: OverrideKind;
	status: OverrideStatus;
	requestedBy: string;
	requestedByRole: string;
	requestedAt: string;
	cargo: string;
	context: string;
	reason: string;
	evidence: string;
	reviewedBy?: string;
	reviewedAt?: string;
	reviewNotes?: string;
	expiresAt: string;
	priority: "Standard" | "Priority" | "Critical";
}

const initialRequests: OverrideRequest[] = [
	{
		id: "or-1",
		reference: "OVR-2026-00418",
		kind: "Gate admit",
		status: "Pending",
		requestedBy: "I. Musa · Gate officer",
		requestedByRole: "Gate Officer",
		requestedAt: "24 Sep 2026 · 09:15",
		cargo: "TRIU1234564 · TRN-IMP-002481",
		context: "Vehicle marked 'Needs verification' at gate-in console.",
		reason:
			"Driver licence expired on 22 Sep. Driver confirmed renewal is in progress and provided the receipt reference NGA-2026-88217. Requesting supervisor approval to admit for this scheduled slot.",
		evidence: "Attached: NGA-2026-88217 receipt photo",
		expiresAt: "24 Sep 2026 · 12:00",
		priority: "Priority",
	},
	{
		id: "or-2",
		reference: "OVR-2026-00417",
		kind: "Payment release",
		status: "Pending",
		requestedBy: "A. Yusuf · Finance Officer",
		requestedByRole: "Finance Officer",
		requestedAt: "24 Sep 2026 · 08:40",
		cargo: "TRN-IMP-002484 · invoice TRN-INV-2026-0142",
		context: "Customer requests partial release before full payment.",
		reason:
			"Atlantic Trade has paid ₦1,200,000 of ₦1,850,000 against TRN-INV-2026-0142. They are requesting release of 2 of the 4 containers now, with the balance due by end of week. Customer has an active credit limit of ₦5m and no outstanding history.",
		evidence: "Attached: bank transfer receipt, credit history",
		expiresAt: "25 Sep 2026 · 09:00",
		priority: "Priority",
	},
	{
		id: "or-3",
		reference: "OVR-2026-00416",
		kind: "Hold lift",
		status: "Pending",
		requestedBy: "M. Adeyemi · Documentation Officer",
		requestedByRole: "Documentation Officer",
		requestedAt: "23 Sep 2026 · 16:20",
		cargo: "TRN-IMP-002483 · HLD-2026-00871",
		context: "Documentation hold raised on 08 Sep for commercial invoice review.",
		reason:
			"Updated commercial invoice has been received and verified. The original discrepancy (line item description mismatch) has been resolved. Requesting approval to lift the hold and proceed with the standard flow.",
		evidence: "Attached: updated invoice v2, verification checklist",
		expiresAt: "25 Sep 2026 · 12:00",
		priority: "Standard",
	},
	{
		id: "or-4",
		reference: "OVR-2026-00415",
		kind: "Tariff waiver",
		status: "Approved",
		requestedBy: "M. Adeyemi · Documentation Officer",
		requestedByRole: "Documentation Officer",
		requestedAt: "22 Sep 2026 · 11:00",
		cargo: "TRN-IMP-002485 · invoice TRN-INV-2026-0146",
		context: "Customer requesting waiver on late-settlement surcharge.",
		reason:
			"Customer was in communication with the finance desk throughout the storage period and the delay in settlement was due to a banking channel outage documented by the customer's bank. Requesting waiver of the ₦62,000 late-settlement surcharge.",
		evidence: "Attached: bank outage notice dated 18 Sep 2026",
		reviewedBy: "D. Okafor · Operations Manager",
		reviewedAt: "22 Sep 2026 · 14:15",
		reviewNotes: "Waiver approved. Documented banking disruption.",
		expiresAt: "22 Oct 2026 · 14:15",
		priority: "Standard",
	},
	{
		id: "or-5",
		reference: "OVR-2026-00414",
		kind: "Storage extension",
		status: "Rejected",
		requestedBy: "K. Lawal · Warehouse Officer",
		requestedByRole: "Warehouse Officer",
		requestedAt: "21 Sep 2026 · 15:30",
		cargo: "TRN-IMP-002486 · TRIU1234565",
		context: "Customer requesting free storage extension beyond grace period.",
		reason:
			"Customer has requested an additional 7 free days of storage because their clearance is taking longer than expected. No specific hardship documented.",
		evidence: "No evidence attached",
		reviewedBy: "D. Okafor · Operations Manager",
		reviewedAt: "21 Sep 2026 · 17:00",
		reviewNotes:
			"Rejected. Storage escalation follows the published tariff. Standard escalation applies from day 11.",
		expiresAt: "21 Oct 2026 · 17:00",
		priority: "Standard",
	},
];

const statusFilters: (OverrideStatus | "all")[] = [
	"all",
	"Pending",
	"Approved",
	"Rejected",
	"Expired",
	"Withdrawn",
];

const kindFilters: (OverrideKind | "all")[] = [
	"all",
	"Gate admit",
	"Gate refer",
	"Gate reject",
	"Payment release",
	"Hold lift",
	"Tariff waiver",
	"Storage extension",
];

export default function OperationsOverridesRoute() {
	const [requests, setRequests] = useState<OverrideRequest[]>(initialRequests);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<OverrideStatus | "all">("all");
	const [kindFilter, setKindFilter] = useState<OverrideKind | "all">("all");
	const [selected, setSelected] = useState<OverrideRequest | null>(null);

	const filtered = useMemo(() => {
		return requests.filter((r) => {
			const matchQuery =
				r.reference.toLowerCase().includes(query.toLowerCase()) ||
				r.requestedBy.toLowerCase().includes(query.toLowerCase()) ||
				r.cargo.toLowerCase().includes(query.toLowerCase());
			const matchStatus = statusFilter === "all" || r.status === statusFilter;
			const matchKind = kindFilter === "all" || r.kind === kindFilter;
			return matchQuery && matchStatus && matchKind;
		});
	}, [requests, query, statusFilter, kindFilter]);

	const stats = useMemo(() => {
		const total = requests.length;
		const pending = requests.filter((r) => r.status === "Pending").length;
		const approved = requests.filter((r) => r.status === "Approved").length;
		const critical = requests.filter(
			(r) => r.priority === "Critical" && r.status === "Pending"
		).length;
		return { total, pending, approved, critical };
	}, [requests]);

	const handleDecide = (
		id: string,
		decision: "Approved" | "Rejected",
		reviewNotes: string
	) => {
		setRequests((prev) =>
			prev.map((r) =>
				r.id === id
					? {
							...r,
							status: decision as OverrideStatus,
							reviewedBy: "D. Okafor · Operations Manager",
							reviewedAt: new Date().toLocaleString("en-GB", {
								day: "2-digit",
								month: "short",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							}),
							reviewNotes,
						}
					: r
			)
		);
		toast.success(
			decision === "Approved" ? "Override approved." : "Override rejected."
		);
		setSelected(null);
	};

	return (
		<AppShell title="Overrides & approvals" eyebrow="Operations · Supervisor review">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Operations · Supervisor review
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Overrides & approvals
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Supervisor review for gate overrides, payment releases, hold lifts, tariff
						waivers, and storage extensions. Every decision requires a reason and is
						recorded to the audit trail.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link to="/admin/audit">
						<Button variant="outline" className="border-line bg-paper text-ink">
							<History className="mr-1.5 size-4" /> View audit log
						</Button>
					</Link>
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Daily override report exported locally.")}
					>
						<Download className="mr-1.5 size-4" /> Daily override report
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total requests"
					value={String(stats.total)}
					detail="Last 30 days"
					tone="info"
					icon={ClipboardCheck}
				/>
				<Metric
					label="Pending review"
					value={String(stats.pending)}
					detail="Awaiting supervisor action"
					tone={stats.pending > 0 ? "warning" : "success"}
					icon={Clock3}
				/>
				<Metric
					label="Approved"
					value={String(stats.approved)}
					detail="Cleared by supervisor"
					tone="success"
					icon={Check}
				/>
				<Metric
					label="Critical pending"
					value={String(stats.critical)}
					detail="Require immediate attention"
					tone={stats.critical > 0 ? "critical" : "success"}
					icon={ShieldAlert}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by reference, requestor, or cargo..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Filter className="size-4 text-ink-soft" />
						{statusFilters.map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => setStatusFilter(s)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									statusFilter === s
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{s === "all" ? "All" : s}
							</button>
						))}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 border-b border-line bg-sand/20 px-4 py-2">
					{kindFilters.map((k) => (
						<button
							key={k}
							type="button"
							onClick={() => setKindFilter(k)}
							className={cn(
								"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
								kindFilter === k
									? "bg-ink text-sand"
									: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
							)}
						>
							{k === "all" ? "All kinds" : k}
						</button>
					))}
				</div>

				{filtered.length === 0 ? (
					<div className="p-12 text-center">
						<ShieldCheck className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">
							No override requests match your filters.
						</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different reference, requestor, or status.
						</p>
					</div>
				) : (
					<ul className="divide-y divide-line">
						{filtered.map((r) => (
							<li key={r.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
								<div
									className={cn(
										"grid size-11 shrink-0 place-items-center rounded-xl",
										r.status === "Approved"
											? "bg-teal/10 text-teal-deep"
											: r.status === "Rejected"
											? "bg-coral/10 text-coral"
											: r.priority === "Critical"
											? "bg-coral/10 text-coral"
											: "bg-orange/10 text-orange-deep"
									)}
								>
									{r.status === "Approved" ? (
										<Check className="size-5" />
									) : r.status === "Rejected" ? (
										<X className="size-5" />
									) : (
										<ShieldAlert className="size-5" />
									)}
								</div>

								<div className="min-w-[240px] flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="font-mono text-[12px] font-semibold text-ink">
											{r.reference}
										</p>
										<StatusBadge label={r.status} tone={statusTone(r.status)} />
										<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
											{r.kind}
										</span>
										{r.priority !== "Standard" && (
											<span
												className={cn(
													"rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]",
													r.priority === "Critical"
														? "bg-coral/10 text-coral"
														: "bg-orange/10 text-orange-deep"
												)}
											>
												{r.priority}
											</span>
										)}
									</div>
									<p className="mt-1 text-[12px] text-ink-soft">
										<span className="font-semibold text-ink">{r.cargo}</span>
									</p>
									<p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										Requested by {r.requestedBy} · {r.requestedAt}
									</p>
								</div>

								<div className="min-w-[200px]">
									<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										Context
									</p>
									<p className="mt-1 text-[12px] text-ink-soft">{r.context}</p>
									{r.status === "Pending" && (
										<p className="mt-1 font-mono text-[10px] text-orange-deep">
											Expires {r.expiresAt}
										</p>
									)}
									{r.reviewedBy && (
										<p className="mt-1 font-mono text-[10px] text-ink-soft">
											Reviewed by {r.reviewedBy}
										</p>
									)}
								</div>

								<div className="ml-auto flex items-center gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSelected(r)}
										className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
									>
										{r.status === "Pending" ? "Review" : "View"}{" "}
										<ArrowRight className="ml-1 size-3.5" />
									</Button>
								</div>
							</li>
						))}
					</ul>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filtered.length} of {requests.length} override requests
					</span>
					<span>Every override is logged to the audit trail</span>
				</div>
			</section>

			{selected && (
				<OverrideDetailDialog
					request={selected}
					onClose={() => setSelected(null)}
					onApprove={(notes) => handleDecide(selected.id, "Approved", notes)}
					onReject={(notes) => handleDecide(selected.id, "Rejected", notes)}
				/>
			)}
		</AppShell>
	);
}

function OverrideDetailDialog({
	request,
	onClose,
	onApprove,
	onReject,
}: {
	request: OverrideRequest;
	onClose: () => void;
	onApprove: (notes: string) => void;
	onReject: (notes: string) => void;
}) {
	const [reviewNotes, setReviewNotes] = useState("");
	const [intent, setIntent] = useState<"Approved" | "Rejected" | null>(null);

	const isPending = request.status === "Pending";
	const canSubmit = isPending && intent !== null && reviewNotes.trim().length >= 5;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
							Override request
						</p>
						<h3 className="mt-1 font-display text-xl font-bold text-ink">
							{request.reference}
						</h3>
						<p className="mt-1 text-[12px] text-ink-soft">{request.cargo}</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						aria-label="Close dialog"
					>
						<X />
					</Button>
				</div>

				<div className="max-h-[70vh] space-y-4 overflow-y-auto p-5 sm:p-6">
					<div className="flex flex-wrap items-center gap-2">
						<StatusBadge label={request.status} tone={statusTone(request.status)} />
						<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
							{request.kind}
						</span>
						{request.priority !== "Standard" && (
							<span
								className={cn(
									"rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em]",
									request.priority === "Critical"
										? "bg-coral/10 text-coral"
										: "bg-orange/10 text-orange-deep"
								)}
							>
								{request.priority}
							</span>
						)}
					</div>

					<div className="grid gap-3 sm:grid-cols-3">
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Requested by
							</p>
							<p className="mt-1 text-[12px] font-medium text-ink">
								{request.requestedBy}
							</p>
							<p className="mt-0.5 text-[11px] text-ink-soft">
								{request.requestedByRole}
							</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Requested at
							</p>
							<p className="mt-1 font-mono text-[11px] text-ink">
								{request.requestedAt}
							</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								{request.status === "Pending" ? "Expires" : "Expired at"}
							</p>
							<p className="mt-1 font-mono text-[11px] text-ink">
								{request.expiresAt}
							</p>
						</div>
					</div>

					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Context
						</p>
						<p className="mt-2 text-[13px] leading-6 text-ink">{request.context}</p>
					</div>

					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Reason provided
						</p>
						<div className="mt-2 rounded-xl bg-sand p-4 ring-1 ring-line">
							<p className="text-[13px] leading-6 text-ink-soft">{request.reason}</p>
						</div>
					</div>

					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Evidence
						</p>
						<p className="mt-2 text-[12px] text-ink-soft">{request.evidence}</p>
					</div>

					{request.reviewedBy && (
						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<div className="flex items-center gap-2">
								<User className="size-4 text-ink-soft" />
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Supervisor decision
								</p>
							</div>
							<div className="mt-3 space-y-2 text-[12px]">
								<div className="flex justify-between">
									<span className="text-ink-soft">Decision</span>
									<span
										className={cn(
											"font-semibold",
											request.status === "Approved"
												? "text-teal-deep"
												: "text-coral"
										)}
									>
										{request.status}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-ink-soft">Reviewed by</span>
									<span className="text-ink">{request.reviewedBy}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-ink-soft">Reviewed at</span>
									<span className="font-mono text-ink">{request.reviewedAt}</span>
								</div>
								{request.reviewNotes && (
									<div className="border-t border-line pt-2">
										<p className="text-ink-soft">Notes</p>
										<p className="mt-1 text-ink">{request.reviewNotes}</p>
									</div>
								)}
							</div>
						</div>
					)}

					{isPending && (
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Review notes
							</p>
							<textarea
								value={reviewNotes}
								onChange={(e) => setReviewNotes(e.target.value)}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder="Explain the decision. This is recorded to the audit trail and visible to the requestor."
							/>
						</div>
					)}

					{isPending && (
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Decision
							</p>
							<div className="mt-3 grid gap-2 sm:grid-cols-2">
								<button
									type="button"
									onClick={() => setIntent("Approved")}
									className={cn(
										"rounded-xl border p-3 text-left transition-colors",
										intent === "Approved"
											? "border-teal bg-teal/10 ring-1 ring-teal/30"
											: "border-line bg-sand hover:bg-sand-2"
									)}
								>
									<div className="flex items-center gap-2">
										<Check
											className={cn(
												"size-4",
												intent === "Approved" ? "text-teal-deep" : "text-ink-soft"
											)}
										/>
										<p className="text-sm font-semibold text-ink">Approve</p>
									</div>
									<p className="mt-1 text-[11px] leading-5 text-ink-soft">
										Approve the override. The requestor is notified immediately.
									</p>
								</button>
								<button
									type="button"
									onClick={() => setIntent("Rejected")}
									className={cn(
										"rounded-xl border p-3 text-left transition-colors",
										intent === "Rejected"
											? "border-coral bg-coral/10 ring-1 ring-coral/30"
											: "border-line bg-sand hover:bg-sand-2"
									)}
								>
									<div className="flex items-center gap-2">
										<X
											className={cn(
												"size-4",
												intent === "Rejected" ? "text-coral" : "text-ink-soft"
											)}
										/>
										<p className="text-sm font-semibold text-ink">Reject</p>
									</div>
									<p className="mt-1 text-[11px] leading-5 text-ink-soft">
										Reject the override. Explain the reason clearly.
									</p>
								</button>
							</div>
						</div>
					)}
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line p-5 sm:p-6">
					<Button variant="ghost" onClick={onClose} className="text-ink-soft">
						{isPending ? "Cancel" : "Close"}
					</Button>
					{isPending && (
						<Button
							disabled={!canSubmit}
							onClick={() => {
								if (!canSubmit) return;
								if (intent === "Approved") onApprove(reviewNotes);
								else if (intent === "Rejected") onReject(reviewNotes);
							}}
							className={cn(
								"text-white",
								intent === "Rejected"
									? "bg-coral hover:bg-coral/90"
									: "bg-teal-deep hover:bg-teal-deep/90",
								!canSubmit && "opacity-60"
							)}
						>
							{intent === "Rejected" ? (
								<>
									<X className="mr-1.5 size-4" /> Confirm rejection
								</>
							) : intent === "Approved" ? (
								<>
									<Check className="mr-1.5 size-4" /> Confirm approval
								</>
							) : (
								<>
									Select a decision <ArrowRight className="ml-1.5 size-4" />
								</>
							)}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}