
import { useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertCircle,
	ArrowDownRight,
	ArrowRight,
	CalendarDays,
	CheckCircle2,
	Clock3,
	CreditCard,
	FileText,
	History,
	Info,
	ShieldCheck,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { AppShell, Metric } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type InvoiceStatus = "Overdue" | "Due soon" | "Pending" | "Paid";

interface CreditInvoice {
	id: string;
	reference: string;
	description: string;
	issuedAt: string;
	dueDate: string;
	amount: number;
	paidAmount: number;
	status: InvoiceStatus;
}

interface CreditPayment {
	id: string;
	reference: string;
	date: string;
	description: string;
	amount: number;
	method: string;
	status: "Successful" | "Pending" | "Failed";
}

const creditAccount = {
	accountRef: "TRN-CREDIT-0142",
	tier: "Standard",
	status: "Active",
	approvedLimit: 10000000,
	outstanding: 6480000,
	available: 3520000,
	paymentTerms: 21,
	creditScore: 82,
	scoreLabel: "Very good",
	nextReview: "19 Dec 2026",
	activatedAt: "01 Sep 2026",
};

const initialInvoices: CreditInvoice[] = [
	{
		id: "1",
		reference: "TRN-INV-2026-0184",
		description: "Terminal handling and documentation",
		issuedAt: "20 Oct 2026",
		dueDate: "10 Nov 2026",
		amount: 1850000,
		paidAmount: 0,
		status: "Overdue",
	},
	{
		id: "2",
		reference: "TRN-INV-2026-0192",
		description: "Storage and examination services",
		issuedAt: "05 Nov 2026",
		dueDate: "26 Nov 2026",
		amount: 2630000,
		paidAmount: 0,
		status: "Due soon",
	},
	{
		id: "3",
		reference: "TRN-INV-2026-0201",
		description: "Terminal delivery and handling",
		issuedAt: "12 Nov 2026",
		dueDate: "03 Dec 2026",
		amount: 2000000,
		paidAmount: 0,
		status: "Pending",
	},
];

const initialPayments: CreditPayment[] = [
	{
		id: "1",
		reference: "TRN-PAY-2026-0081",
		date: "18 Oct 2026",
		description: "Invoice TRN-INV-2026-0151",
		amount: 1250000,
		method: "Bank transfer",
		status: "Successful",
	},
	{
		id: "2",
		reference: "TRN-PAY-2026-0072",
		date: "25 Sep 2026",
		description: "Invoice TRN-INV-2026-0118",
		amount: 980000,
		method: "Bank transfer",
		status: "Successful",
	},
	{
		id: "3",
		reference: "TRN-PAY-2026-0064",
		date: "10 Sep 2026",
		description: "Invoice TRN-INV-2026-0094",
		amount: 1450000,
		method: "Card",
		status: "Successful",
	},
];

const formatNaira = (amount: number) =>
	new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		maximumFractionDigits: 0,
	}).format(amount);

const statusStyles: Record<string, string> = {
	Active: "bg-orange/10 text-orange-deep",
	Overdue: "bg-coral/10 text-coral",
	"Due soon": "bg-orange/10 text-orange-deep",
	Pending: "bg-sand-2 text-ink-soft",
	Paid: "bg-orange/10 text-orange-deep",
	Successful: "bg-orange/10 text-orange-deep",
	Failed: "bg-coral/10 text-coral",
	Inactive: "bg-sand-2 text-ink-soft",
};

function StatusBadge({ status }: { status: string }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold",
				statusStyles[status] || "bg-sand-2 text-ink-soft"
			)}
		>
			{status}
		</span>
	);
}

export default function PortalCreditPage() {
	const [invoices] = useState<CreditInvoice[]>(initialInvoices);
	const [payments] = useState<CreditPayment[]>(initialPayments);
	const [invoiceFilter, setInvoiceFilter] = useState("ALL");
	const [search, setSearch] = useState("");

	const outstanding = useMemo(
		() =>
			invoices
				.filter((invoice) => invoice.status !== "Paid")
				.reduce(
					(total, invoice) =>
						total + invoice.amount - invoice.paidAmount,
					0
				),
		[invoices]
	);

	const overdueInvoices = invoices.filter(
		(invoice) => invoice.status === "Overdue"
	);

	const overdueAmount = overdueInvoices.reduce(
		(total, invoice) => total + invoice.amount - invoice.paidAmount,
		0
	);

	const utilisation = Math.min(
		(creditAccount.outstanding / creditAccount.approvedLimit) * 100,
		100
	);

	const filteredInvoices = invoices.filter((invoice) => {
		const matchesSearch =
			invoice.reference.toLowerCase().includes(search.toLowerCase()) ||
			invoice.description.toLowerCase().includes(search.toLowerCase());

		const matchesFilter =
			invoiceFilter === "ALL" ||
			invoice.status.toUpperCase() === invoiceFilter;

		return matchesSearch && matchesFilter;
	});

	return (
		<AppShell title="My credit" eyebrow="Organisation portal · Finance">
			<div className="space-y-5">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
							Organisation finance · Credit account
						</p>
						<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
							My credit
						</h2>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
							Monitor your credit facility, outstanding invoices, payment
							deadlines and account performance.
						</p>
					</div>

					<Link to="/portal/credit/apply">
						<Button className="bg-orange text-white hover:bg-orange-deep">
							<CreditCard className="mr-1.5 size-4" />
							Apply for credit
						</Button>
					</Link>
				</div>

				{overdueInvoices.length > 0 && (
					<div className="flex flex-col justify-between gap-3 rounded-xl border border-coral/20 bg-coral/5 p-4 sm:flex-row sm:items-center">
						<div className="flex items-start gap-3">
							<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-coral/10 text-coral">
								<AlertCircle className="size-4" />
							</div>
							<div>
								<p className="text-sm font-semibold text-ink">
									You have overdue payments
								</p>
								<p className="mt-1 text-xs leading-5 text-ink-soft">
									{overdueInvoices.length} invoice
									{overdueInvoices.length > 1 ? "s are" : " is"} overdue,
									totaling {formatNaira(overdueAmount)}. Settle outstanding
									payments to maintain your credit standing.
								</p>
							</div>
						</div>
						<Link to="/portal/payments" className="shrink-0">
							<Button
								size="sm"
								className="bg-orange text-white hover:bg-orange-deep"
							>
								Make payment
								<ArrowRight className="ml-1.5 size-3.5" />
							</Button>
						</Link>
					</div>
				)}

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<Metric
						label="Approved credit limit"
						value={formatNaira(creditAccount.approvedLimit)}
						detail={`${creditAccount.tier} facility`}
						tone="info"
						icon={ShieldCheck}
					/>
					<Metric
						label="Outstanding balance"
						value={formatNaira(creditAccount.outstanding)}
						detail="Current credit exposure"
						tone="warning"
						icon={Wallet}
					/>
					<Metric
						label="Available credit"
						value={formatNaira(creditAccount.available)}
						detail="Remaining facility balance"
						tone="info"
						icon={CreditCard}
					/>
					<Metric
						label="Overdue amount"
						value={formatNaira(overdueAmount)}
						detail={`${overdueInvoices.length} overdue invoice(s)`}
						tone={overdueAmount > 0 ? "warning" : "info"}
						icon={Clock3}
					/>
				</div>

				<div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
									Credit facility
								</p>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									{creditAccount.tier} credit account
								</h3>
								<p className="mt-1 font-mono text-[10px] text-ink-soft">
									{creditAccount.accountRef}
								</p>
							</div>
							<StatusBadge status={creditAccount.status} />
						</div>

						<div className="mt-6">
							<div className="flex flex-wrap items-end justify-between gap-3">
								<div>
									<p className="text-xs text-ink-soft">Available credit</p>
									<p className="mt-1 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
										{formatNaira(creditAccount.available)}
									</p>
								</div>
								<div className="text-right">
									<p className="text-[11px] text-ink-soft">Approved limit</p>
									<p className="mt-1 font-mono text-sm font-semibold text-ink">
										{formatNaira(creditAccount.approvedLimit)}
									</p>
								</div>
							</div>

							<div className="mt-5">
								<div className="mb-2 flex items-center justify-between gap-2">
									<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										Credit utilisation
									</span>
									<span className="font-mono text-xs font-semibold text-ink">
										{utilisation.toFixed(1)}%
									</span>
								</div>

								<div className="h-3 overflow-hidden rounded-full bg-sand-2">
									<div
										className={cn(
											"h-full rounded-full transition-all",
											utilisation >= 90
												? "bg-coral"
												: "bg-orange"
										)}
										style={{ width: `${utilisation}%` }}
									/>
								</div>

								<div className="mt-2 flex justify-between text-[10px] text-ink-soft">
									<span>₦0 used</span>
									<span>{formatNaira(creditAccount.outstanding)} used</span>
								</div>
							</div>
						</div>

						<div className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
							<DetailItem
								label="Payment terms"
								value={`${creditAccount.paymentTerms} days`}
								icon={CalendarDays}
							/>
							<DetailItem
								label="Facility activated"
								value={creditAccount.activatedAt}
								icon={CheckCircle2}
							/>
							<DetailItem
								label="Next account review"
								value={creditAccount.nextReview}
								icon={History}
							/>
						</div>
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<div className="flex items-center justify-between gap-3">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
									Account performance
								</p>
								<h3 className="mt-1 font-display text-lg font-bold text-ink">
									Credit score
								</h3>
							</div>
							<div className="grid size-10 place-items-center rounded-lg bg-orange/10 text-orange-deep">
								<TrendingUp className="size-5" />
							</div>
						</div>

						<div className="mt-5 flex items-center gap-5">
							<div
								className="relative grid size-28 shrink-0 place-items-center rounded-full"
								style={{
									background: `conic-gradient(#F97316 ${creditAccount.creditScore * 3.6}deg, #E9E5DC 0deg)`,
								}}
							>
								<div className="grid size-[88px] place-items-center rounded-full bg-paper">
									<div className="text-center">
										<p className="font-display text-3xl font-bold text-ink">
											{creditAccount.creditScore}
										</p>
										<p className="font-mono text-[9px] text-ink-soft">
											/ 100
										</p>
									</div>
								</div>
							</div>

							<div>
								<p className="text-sm font-bold text-orange-deep">
									{creditAccount.scoreLabel}
								</p>
								<p className="mt-1 text-[11px] leading-5 text-ink-soft">
									Your account performance is based on payment behaviour,
									credit utilisation and trading history.
								</p>
							</div>
						</div>

						<div className="mt-5 space-y-3 border-t border-line pt-4">
							<ScoreFactor
								label="Payment history"
								value="Good"
								tone="neutral"
							/>
							<ScoreFactor
								label="Credit utilisation"
								value="65%"
								tone="neutral"
							/>
							<ScoreFactor
								label="Account history"
								value="Established"
								tone="neutral"
							/>
							<ScoreFactor
								label="Outstanding overdue"
								value={overdueAmount > 0 ? "Needs attention" : "None"}
								tone={overdueAmount > 0 ? "warning" : "neutral"}
							/>
						</div>

						<div className="mt-4 flex items-start gap-2 rounded-lg bg-sand p-3">
							<Info className="mt-0.5 size-3.5 shrink-0 text-ink-soft" />
							<p className="text-[10px] leading-5 text-ink-soft">
								This is an illustrative terminal account score. Final scoring
								criteria and methodology must be configured by Trinu Finance.
							</p>
						</div>
					</section>
				</div>

				<section className="overflow-hidden rounded-xl bg-paper ring-1 ring-line">
					<div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
						<div>
							<h3 className="font-display text-lg font-bold text-ink">
								Outstanding invoices
							</h3>
							<p className="mt-1 text-xs text-ink-soft">
								Review your credit invoices and settle outstanding balances.
							</p>
						</div>
						<Link to="/portal/payments">
							<Button
								size="sm"
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Wallet className="mr-1.5 size-4" />
								Make a payment
							</Button>
						</Link>
					</div>

					<div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="relative w-full sm:max-w-xs">
							<FileText className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
							<Input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search invoice reference..."
								className="h-10 border-line bg-sand pl-9 text-sm"
							/>
						</div>

						<div className="flex flex-wrap gap-1.5">
							{["ALL", "Overdue", "Due soon", "Pending"].map((filter) => (
								<button
									key={filter}
									type="button"
									onClick={() => setInvoiceFilter(filter.toUpperCase())}
									className={cn(
										"rounded-md px-3 py-2 text-[11px] font-medium transition-colors",
										invoiceFilter === filter.toUpperCase()
											? "bg-ink text-sand"
											: "bg-sand text-ink-soft hover:text-ink"
									)}
								>
									{filter === "ALL" ? "All" : filter}
								</button>
							))}
						</div>
					</div>

					{filteredInvoices.length === 0 ? (
						<div className="p-10 text-center">
							<FileText className="mx-auto size-7 text-ink-soft" />
							<p className="mt-3 text-sm font-semibold text-ink">
								No invoices found
							</p>
							<p className="mt-1 text-xs text-ink-soft">
								There are no invoices matching your search.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[850px] text-left text-sm">
								<thead>
									<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.13em] text-ink-soft">
										<th className="px-4 py-3 font-medium">Invoice</th>
										<th className="px-4 py-3 font-medium">Issue date</th>
										<th className="px-4 py-3 font-medium">Due date</th>
										<th className="px-4 py-3 text-right font-medium">Amount</th>
										<th className="px-4 py-3 text-right font-medium">Outstanding</th>
										<th className="px-4 py-3 font-medium">Status</th>
										<th className="px-4 py-3 text-right font-medium">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-line">
									{filteredInvoices.map((invoice) => {
										const balance = invoice.amount - invoice.paidAmount;

										return (
											<tr
												key={invoice.id}
												className="transition-colors hover:bg-sand/50"
											>
												<td className="px-4 py-4">
													<p className="font-mono text-[11px] font-semibold text-ink">
														{invoice.reference}
													</p>
													<p className="mt-1 text-[11px] text-ink-soft">
														{invoice.description}
													</p>
												</td>
												<td className="px-4 py-4 text-xs text-ink-soft">
													{invoice.issuedAt}
												</td>
												<td className="px-4 py-4 text-xs text-ink">
													{invoice.dueDate}
												</td>
												<td className="px-4 py-4 text-right font-mono text-xs text-ink">
													{formatNaira(invoice.amount)}
												</td>
												<td className="px-4 py-4 text-right font-mono text-xs font-semibold text-ink">
													{formatNaira(balance)}
												</td>
												<td className="px-4 py-4">
													<StatusBadge status={invoice.status} />
												</td>
												<td className="px-4 py-4 text-right">
													<Link to="/portal/payments">
														<Button
															size="sm"
															variant="ghost"
															className="text-orange-deep hover:bg-orange/10"
														>
															Pay
															<ArrowRight className="ml-1 size-3.5" />
														</Button>
													</Link>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}

					<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
						<span>{filteredInvoices.length} invoice(s) displayed</span>
						<span>Outstanding: {formatNaira(outstanding)}</span>
					</div>
				</section>

				<section className="overflow-hidden rounded-xl bg-paper ring-1 ring-line">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:px-5">
						<div>
							<h3 className="font-display text-lg font-bold text-ink">
								Recent payments
							</h3>
							<p className="mt-1 text-xs text-ink-soft">
								Your recent credit repayments and payment confirmations.
							</p>
						</div>
						<Link
							to="/portal/payments"
							className="text-xs font-semibold text-orange-deep hover:underline"
						>
							View all payments
							<ArrowRight className="ml-1 inline size-3.5" />
						</Link>
					</div>

					<div className="divide-y divide-line">
						{payments.map((payment) => (
							<div
								key={payment.id}
								className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"
							>
								<div className="flex min-w-0 items-center gap-3">
									<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
										<ArrowDownRight className="size-4" />
									</div>
									<div className="min-w-0">
										<p className="truncate text-xs font-semibold text-ink">
											{payment.description}
										</p>
										<p className="mt-1 font-mono text-[10px] text-ink-soft">
											{payment.reference} · {payment.date}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-4">
									<div className="text-right">
										<p className="font-mono text-sm font-semibold text-ink">
											{formatNaira(payment.amount)}
										</p>
										<p className="mt-1 text-[10px] text-ink-soft">
											{payment.method}
										</p>
									</div>
									<StatusBadge status={payment.status} />
								</div>
							</div>
						))}
					</div>
				</section>

				<div className="grid gap-5 lg:grid-cols-2">
					<section className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<div className="flex items-center gap-2">
							<ShieldCheck className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft">
								Your credit facility
							</p>
						</div>
						<h3 className="mt-3 font-display text-lg font-bold text-ink">
							Need a higher credit limit?
						</h3>
						<p className="mt-2 text-xs leading-6 text-ink-soft">
							You can submit a request for a new credit facility or an
							increase to your existing limit. All requests are subject to
							Finance review and approval.
						</p>
						<Link to="/portal/credit/apply">
							<Button className="mt-4 bg-orange text-white hover:bg-orange-deep">
								Apply for credit
								<ArrowRight className="ml-1.5 size-4" />
							</Button>
						</Link>
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<div className="flex items-center gap-2">
							<Info className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft">
								Credit account information
							</p>
						</div>
						<div className="mt-4 space-y-3">
							<InfoRow label="Credit account" value={creditAccount.accountRef} />
							<InfoRow label="Facility tier" value={creditAccount.tier} />
							<InfoRow
								label="Payment terms"
								value={`${creditAccount.paymentTerms} days`}
							/>
							<InfoRow
								label="Facility activation"
								value={creditAccount.activatedAt}
							/>
							<InfoRow
								label="Next review"
								value={creditAccount.nextReview}
							/>
						</div>
					</section>
				</div>
			</div>
		</AppShell>
	);
}

function DetailItem({
	label,
	value,
	icon: Icon,
}: {
	label: string;
	value: string;
	icon: typeof CalendarDays;
}) {
	return (
		<div className="flex items-start gap-2.5">
			<Icon className="mt-0.5 size-4 shrink-0 text-ink-soft" />
			<div>
				<p className="text-[10px] text-ink-soft">{label}</p>
				<p className="mt-1 text-xs font-semibold text-ink">{value}</p>
			</div>
		</div>
	);
}

function ScoreFactor({
	label,
	value,
	tone,
}: {
	label: string;
	value: string;
	tone: "neutral" | "warning";
}) {
	const styles = {
		neutral: "bg-sand-2 text-ink-soft",
		warning: "bg-coral/10 text-coral",
	};

	return (
		<div className="flex items-center justify-between gap-3">
			<span className="text-[11px] text-ink-soft">{label}</span>
			<span
				className={cn(
					"rounded-md px-2 py-1 text-[10px] font-semibold",
					styles[tone]
				)}
			>
				{value}
			</span>
		</div>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
			<span className="text-[11px] text-ink-soft">{label}</span>
			<span className="text-right text-xs font-semibold text-ink">{value}</span>
		</div>
	);
}
