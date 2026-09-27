import { useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	BadgePercent,
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

type ApprovalKind =
	| "Discount"
	| "Waiver"
	| "Credit note"
	| "Rate override"
	| "Settlement offer";

type ApprovalStatus = "Pending" | "Approved" | "Rejected" | "Expired" | "Withdrawn";

interface ApprovalRequest {
	id: string;
	reference: string;
	kind: ApprovalKind;
	status: ApprovalStatus;
	customer: string;
	accountRef: string;
	invoiceRef: string;
	originalAmount: number;
	requestedAmount: number;
	difference: number;
	differencePct: number;
	requestedBy: string;
	requestedByRole: string;
	requestedAt: string;
	reason: string;
	evidence: string;
	approverLevel: "First approver" | "Second approver" | "Dual approval";
	reviewedBy?: string;
	reviewedAt?: string;
	reviewNotes?: string;
	expiresAt: string;
	priority: "Standard" | "Priority" | "Critical";
}

const formatNaira = (amount: number) =>
	new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		maximumFractionDigits: 0,
	}).format(amount);

const initialRequests: ApprovalRequest[] = [
	{
		id: "ap-1",
		reference: "APR-2026-00418",
		kind: "Waiver",
		status: "Pending",
		customer: "Atlantic Trade Nigeria Ltd",
		accountRef: "TRN-CUST-0142",
		invoiceRef: "TRN-INV-2026-0142",
		originalAmount: 1850000,
		requestedAmount: 1788000,
		difference: 62000,
		differencePct: 3.4,
		requestedBy: "M. Adeyemi · Finance Officer",
		requestedByRole: "Finance Officer",
		requestedAt: "24 Sep 2026 · 08:40",
		reason:
			"Customer was in communication with the finance desk throughout the storage period and the delay in settlement was due to a documented banking channel outage on 18 Sep 2026. Requesting waiver of the late-settlement surcharge (₦62,000).",
		evidence: "Attached: bank outage notice dated 18 Sep 2026",
		approverLevel: "Dual approval",
		expiresAt: "25 Sep 2026 · 09:00",
		priority: "Priority",
	},
	{
		id: "ap-2",
		reference: "APR-2026-00417",
		kind: "Discount",
		status: "Pending",
		customer: "Kano Freight Forwarders",
		accountRef: "TRN-CUST-0281",
		invoiceRef: "TRN-INV-2026-0143",
		originalAmount: 2640000,
		requestedAmount: 2400000,
		difference: 240000,
		differencePct: 9.1,
		requestedBy: "A. Yusuf · Finance Officer",
		requestedByRole: "Finance Officer",
		requestedAt: "24 Sep 2026 · 07:20",
		reason:
			"Customer has committed to a 6-month storage volume agreement. Requesting a 9% discount on this and subsequent invoices for the next two quarters, as a volume incentive.",
		evidence: "Attached: signed letter of intent from customer",
		approverLevel: "First approver",
		expiresAt: "25 Sep 2026 · 12:00",
		priority: "Priority",
	},
	{
		id: "ap-3",
		reference: "APR-2026-00416",
		kind: "Credit note",
		status: "Pending",
		customer: "Meridian Customs Services",
		accountRef: "TRN-CUST-0073",
		invoiceRef: "TRN-INV-2026-0144",
		originalAmount: 980000,
		requestedAmount: 0,
		difference: 980000,
		differencePct: 100,
		requestedBy: "M. Adeyemi · Finance Officer",
		requestedByRole: "Finance Officer",
		requestedAt: "23 Sep 2026 · 16:20",
		reason:
			"Examination coordination line was double-counted on this invoice. The customer has already paid TRN-INV-2026-0139 covering the same coordination. Full credit note requested.",
		evidence: "Attached: side-by-side ledger comparison",
		approverLevel: "Second approver",
		expiresAt: "25 Sep 2026 · 16:20",
		priority: "Critical",
	},
	{
		id: "ap-4",
		reference: "APR-2026-00415",
		kind: "Rate override",
		status: "Approved",
		customer: "Sahara Energy Logistics",
		accountRef: "TRN-CUST-0194",
		invoiceRef: "TRN-INV-2026-0140",
		originalAmount: 5120000,
		requestedAmount: 4850000,
		difference: 270000,
		differencePct: 5.3,
		requestedBy: "A. Yusuf · Finance Officer",
		requestedByRole: "Finance Officer",
		requestedAt: "22 Sep 2026 · 11:00",
		reason:
			"Rate override requested under the corporate tier agreement. Confirmed by the signed tariff schedule for high-volume accounts.",
		evidence: "Attached: corporate tariff schedule v3",
		approverLevel: "Dual approval",
		reviewedBy: "D. Okafor · Operations Manager",
		reviewedAt: "22 Sep 2026 · 14:15",
		reviewNotes:
			"Override approved. Rate reduction confirmed against the corporate tariff schedule.",
		expiresAt: "22 Oct 2026 · 14:15",
		priority: "Standard",
	},
	{
		id: "ap-5",
		reference: "APR-2026-00414",
		kind: "Settlement offer",
		status: "Rejected",
		customer: "Coastal Freight Nigeria",
		accountRef: "TRN-CUST-0338",
		invoiceRef: "TRN-INV-2026-0141",
		originalAmount: 392000,
		requestedAmount: 275000,
		difference: 117000,
		differencePct: 30,
		requestedBy: "M. Adeyemi · Finance Officer",
		requestedByRole: "Finance Officer",
		requestedAt: "21 Sep 2026 · 15:30",
		reason:
			"Customer has proposed a 30% settlement on the outstanding invoice due to cash flow constraints and no dispute on the invoice itself.",
		evidence: "No evidence attached",
		approverLevel: "Second approver",
		reviewedBy: "D. Okafor · Operations Manager",
		reviewedAt: "21 Sep 2026 · 17:00",
		reviewNotes:
			"Rejected. No documented evidence of a banking issue or hardship. Standard payment terms apply.",
		expiresAt: "21 Oct 2026 · 17:00",
		priority: "Standard",
	},
];

const statusFilters: (ApprovalStatus | "all")[] = [
	"all",
	"Pending",
	"Approved",
	"Rejected",
	"Expired",
	"Withdrawn",
];

const kindFilters: (ApprovalKind | "all")[] = [
	"all",
	"Discount",
	"Waiver",
	"Credit note",
	"Rate override",
	"Settlement offer",
];

export default function FinanceApprovalsRoute() {
	const [requests, setRequests] = useState<ApprovalRequest[]>(initialRequests);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "all">("all");
	const [kindFilter, setKindFilter] = useState<ApprovalKind | "all">("all");
	const [selected, setSelected] = useState<ApprovalRequest | null>(null);

	const filtered = useMemo(() => {
		return requests.filter((r) => {
			const matchQuery =
				r.reference.toLowerCase().includes(query.toLowerCase()) ||
				r.customer.toLowerCase().includes(query.toLowerCase()) ||
				r.invoiceRef.toLowerCase().includes(query.toLowerCase()) ||
				r.requestedBy.toLowerCase().includes(query.toLowerCase());
			const matchStatus = statusFilter === "all" || r.status === statusFilter;
			const matchKind = kindFilter === "all" || r.kind === kindFilter;
			return matchQuery && matchStatus && matchKind;
		});
	}, [requests, query, statusFilter, kindFilter]);

	const stats = useMemo(() => {
		const total = requests.length;
		const pending = requests.filter((r) => r.status === "Pending").length;
		const approved = requests.filter((r) => r.status === "Approved").length;
		const totalRequested = requests
			.filter((r) => r.status === "Pending")
			.reduce((sum, r) => sum + r.difference, 0);
		const critical = requests.filter(
			(r) => r.priority === "Critical" && r.status === "Pending"
		).length;
		return { total, pending, approved, totalRequested, critical };
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
							status: decision as ApprovalStatus,
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
			decision === "Approved" ? "Approval granted." : "Approval rejected."
		);
		setSelected(null);
	};

	return (
		<AppShell title="Discounts & waivers" eyebrow="Finance · Approvals">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Finance workspace · Approvals
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Discount, waiver & credit approvals
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Review discount, waiver, credit note, rate override, and settlement offers.
						Each request is subject to a configurable threshold and requires a reason
						that is logged to the audit trail.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link to="/finance/credit/limits">
						<Button variant="outline" className="border-line bg-paper text-ink">
							<Wallet className="mr-1.5 size-4" /> Credit limits
						</Button>
					</Link>
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Approval log exported locally.")}
					>
						<Download className="mr-1.5 size-4" /> Export approval log
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
					label="Pending"
					value={String(stats.pending)}
					detail="Awaiting approval"
					tone={stats.pending > 0 ? "warning" : "success"}
					icon={Clock3}
				/>
				<Metric
					label="Value pending"
					value={formatNaira(stats.totalRequested)}
					detail="Total difference at stake"
					tone={stats.totalRequested > 0 ? "warning" : "success"}
					icon={BadgePercent}
				/>
				<Metric
					label="Critical pending"
					value={String(stats.critical)}
					detail="Requires immediate review"
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
							placeholder="Search by reference, customer, invoice, or requestor..."
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
							No approval requests match your filters.
						</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different customer, invoice, or status.
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
										<BadgePercent className="size-5" />
									)}
								</div>

								<div className="min-w-[260px] flex-1">
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
										{r.approverLevel === "Dual approval" && (
											<span className="rounded bg-sky/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-sky-deep">
												Dual approval
											</span>
										)}
									</div>
									<p className="mt-1 text-[12px] text-ink">
										<span className="font-semibold">{r.customer}</span> ·{" "}
										<span className="font-mono text-ink-soft">{r.accountRef}</span>
									</p>
									<p className="mt-0.5 font-mono text-[11px] text-ink-soft">
										{r.invoiceRef} · requested by {r.requestedBy} · {r.requestedAt}
									</p>
								</div>

								<div className="min-w-[220px]">
									<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										Value difference
									</p>
									<p className="mt-1 font-display text-xl font-bold text-ink">
										{formatNaira(r.difference)}
									</p>
									<p className="mt-0.5 font-mono text-[11px] text-orange-deep">
										{r.differencePct}% of {formatNaira(r.originalAmount)}
									</p>
								</div>

								<div className="min-w-[180px]">
									<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										Approver level
									</p>
									<p className="mt-1 text-[12px] text-ink">{r.approverLevel}</p>
									{r.status === "Pending" ? (
										<p className="mt-1 font-mono text-[10px] text-orange-deep">
											Expires {r.expiresAt}
										</p>
									) : r.reviewedBy ? (
										<p className="mt-1 font-mono text-[10px] text-ink-soft">
											Reviewed by {r.reviewedBy}
										</p>
									) : null}
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
						Showing {filtered.length} of {requests.length} approval requests
					</span>
					<span>Every decision is logged to the audit trail</span>
				</div>
			</section>

			{selected && (
				<ApprovalDetailDialog
					request={selected}
					onClose={() => setSelected(null)}
					onApprove={(notes) => handleDecide(selected.id, "Approved", notes)}
					onReject={(notes) => handleDecide(selected.id, "Rejected", notes)}
				/>
			)}
		</AppShell>
	);
}

function ApprovalDetailDialog({
	request,
	onClose,
	onApprove,
	onReject,
}: {
	request: ApprovalRequest;
	onClose: () => void;
	onApprove: (notes: string) => void;
	onReject: (notes: string) => void;
}) {
	const [reviewNotes, setReviewNotes] = useState("");
	const [intent, setIntent] = useState<"Approved" | "Rejected" | null>(null);

	const isPending = request.status === "Pending";
	const isDual = request.approverLevel === "Dual approval";
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
							{request.kind} approval
						</p>
						<h3 className="mt-1 font-display text-xl font-bold text-ink">
							{request.reference}
						</h3>
						<p className="mt-1 text-[12px] text-ink-soft">
							{request.customer} · {request.invoiceRef}
						</p>
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
						<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
							{request.approverLevel}
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

					{isDual && isPending && (
						<div className="rounded-xl bg-sky/5 p-4 ring-1 ring-sky/20">
							<div className="flex items-start gap-3">
								<ShieldCheck className="mt-0.5 size-4 shrink-0 text-sky-deep" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Dual approval required
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										This request exceeds the threshold for a single approver and
										requires dual approval. Your decision is recorded as the first
										approver; a second approver will confirm before the request is
										enacted.
									</p>
								</div>
							</div>
						</div>
					)}

					<div className="grid gap-3 sm:grid-cols-3">
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Original amount
							</p>
							<p className="mt-1 font-mono text-[12px] text-ink">
								{formatNaira(request.originalAmount)}
							</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Requested amount
							</p>
							<p className="mt-1 font-mono text-[12px] text-ink">
								{formatNaira(request.requestedAmount)}
							</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Difference
							</p>
							<p className="mt-1 font-mono text-[12px] font-semibold text-orange-deep">
								{formatNaira(request.difference)} ({request.differencePct}%)
							</p>
						</div>
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

					<div className="grid gap-3 sm:grid-cols-2">
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Requested by
							</p>
							<p className="mt-1 text-[12px] text-ink">{request.requestedBy}</p>
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
					</div>

					{request.reviewedBy && (
						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<div className="flex items-center gap-2">
								<User className="size-4 text-ink-soft" />
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Prior decision
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
						<>
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
											{isDual
												? "Recorded as first approver. A second approver will confirm."
												: "The adjustment will be applied to the invoice."}
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
											Explain the reason clearly. The requestor is notified.
										</p>
									</button>
								</div>
							</div>
						</>
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
									<Check className="mr-1.5 size-4" />{" "}
									{isDual ? "Approve as first approver" : "Confirm approval"}
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

function Wallet(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
			<path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
		</svg>
	);
}