import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	CheckCircle2,
	Download,
	Eye,
	Filter,
	Receipt,
	Search,
	Upload,
	X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PaymentReceipt {
	id: string;
	receiptNumber: string;
	invoiceNumber: string;
	channel: "Bank Transfer" | "Card Payment" | "USSD" | "Terminal Credit";
	amount: number;
	paymentDate: string;
	time: string;
	status: "Reconciled" | "Pending Review" | "Processing";
	payerName: string;
	referenceCode: string;
}

const initialPayments: PaymentReceipt[] = [
	{
		id: "rcp-1",
		receiptNumber: "TRN-RCP-2026-0811",
		invoiceNumber: "TRN-INV-2026-0792",
		channel: "Bank Transfer",
		amount: 980000,
		paymentDate: "18 Sep 2026",
		time: "14:22 WAT",
		status: "Reconciled",
		payerName: "Atlantic Trade Nigeria Ltd",
		referenceCode: "REF-2918-0049-2182",
	},
	{
		id: "rcp-2",
		receiptNumber: "TRN-RCP-2026-0805",
		invoiceNumber: "TRN-INV-2026-0761",
		channel: "Bank Transfer",
		amount: 3100000,
		paymentDate: "12 Sep 2026",
		time: "11:05 WAT",
		status: "Reconciled",
		payerName: "Atlantic Trade Nigeria Ltd",
		referenceCode: "REF-TXN-9948201",
	},
	{
		id: "rcp-3",
		receiptNumber: "TRN-RCP-2026-0799",
		invoiceNumber: "TRN-INV-2026-0740",
		channel: "Terminal Credit",
		amount: 1450000,
		paymentDate: "05 Sep 2026",
		time: "16:40 WAT",
		status: "Reconciled",
		payerName: "Atlantic Trade Nigeria Ltd",
		referenceCode: "CR-DRAW-2026-041",
	},
	{
		id: "rcp-4",
		receiptNumber: "TRN-RCP-2026-0814",
		invoiceNumber: "TRN-INV-2026-0814",
		channel: "Bank Transfer",
		amount: 1850000,
		paymentDate: "23 Sep 2026",
		time: "09:15 WAT",
		status: "Pending Review",
		payerName: "Atlantic Trade Nigeria Ltd",
		referenceCode: "REF-TLR-004921",
	},
];

export default function PortalPaymentsRoute() {
	const [payments, setPayments] = useState<PaymentReceipt[]>(initialPayments);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("ALL");
	const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
	const [isSubmitOpen, setIsSubmitOpen] = useState(false);

	const [formInvoice, setFormInvoice] = useState("");
	const [formAmount, setFormAmount] = useState("");
	const [formChannel, setFormChannel] =
		useState<PaymentReceipt["channel"]>("Bank Transfer");
	const [formRef, setFormRef] = useState("");

	const formatNaira = (amount: number) => {
		return new Intl.NumberFormat("en-NG", {
			style: "currency",
			currency: "NGN",
			maximumFractionDigits: 0,
		}).format(amount);
	};

	const filteredPayments = useMemo(() => {
		return payments.filter((item) => {
			const matchesSearch =
				item.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
				item.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
				item.referenceCode.toLowerCase().includes(search.toLowerCase()) ||
				item.channel.toLowerCase().includes(search.toLowerCase());

			const matchesStatus =
				statusFilter === "ALL" || item.status.toUpperCase() === statusFilter.toUpperCase();

			return matchesSearch && matchesStatus;
		});
	}, [payments, search, statusFilter]);

	const stats = useMemo(() => {
		const totalReconciled = payments
			.filter((p) => p.status === "Reconciled")
			.reduce((sum, p) => sum + p.amount, 0);
		const pendingTotal = payments
			.filter((p) => p.status === "Pending Review" || p.status === "Processing")
			.reduce((sum, p) => sum + p.amount, 0);

		return {
			totalSettled: formatNaira(totalReconciled),
			pendingVerification: formatNaira(pendingTotal),
			receiptCount: payments.length,
			creditLimit: "₦25,000,000",
		};
	}, [payments]);

	const handleSubmitRemittance = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formInvoice || !formAmount || !formRef) {
			toast.error("Please fill in all remittance details.");
			return;
		}

		const newPayment: PaymentReceipt = {
			id: `rcp-${Date.now()}`,
			receiptNumber: `TRN-RCP-2026-0${Math.floor(820 + Math.random() * 80)}`,
			invoiceNumber: formInvoice,
			channel: formChannel,
			amount: Number(formAmount) || 0,
			paymentDate: new Date().toLocaleDateString("en-GB", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			}),
			time: "Just now",
			status: "Pending Review",
			payerName: "Atlantic Trade Nigeria Ltd",
			referenceCode: formRef,
		};

		setPayments([newPayment, ...payments]);
		toast.success("Remittance proof submitted locally.");
		setIsSubmitOpen(false);
		setFormInvoice("");
		setFormAmount("");
		setFormRef("");
	};

	const handleExportCSV = () => {
		const header =
			"Receipt Number,Invoice Number,Channel,Amount,Payment Date,Status,Reference\n";
		const rows = payments
			.map(
				(p) =>
					`"${p.receiptNumber}","${p.invoiceNumber}","${p.channel}",${p.amount},"${p.paymentDate}","${p.status}","${p.referenceCode}"`
			)
			.join("\n");
		const blob = new Blob([header + rows], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `payment-receipts-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Payments ledger exported locally.");
	};

	return (
		<AppShell title="Payments" eyebrow="Stakeholder Receipts & Remittances">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Treasury & settlement desk
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Payment receipts & remittances
					</h2>
					<p className="mt-1 text-sm text-ink-soft">
						Access receipts, submit bank proofs, and track reconciliation status.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleExportCSV}
						className="border-line font-mono text-xs text-ink"
					>
						<Download className="mr-1.5 size-3.5" />
						Export Ledger
					</Button>
					<Button
						size="sm"
						onClick={() => setIsSubmitOpen(true)}
						className="bg-orange text-white hover:bg-orange-deep"
					>
						<Upload className="mr-1.5 size-3.5" />
						Submit Remittance Proof
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<Metric
					label="Total Settled"
					value={stats.totalSettled}
					tone="success"
					subtext="Reconciled receipts"
				/>
				<Metric
					label="Pending Review"
					value={stats.pendingVerification}
					tone="warning"
					subtext="Awaiting finance confirmation"
				/>
				<Metric
					label="Receipts Generated"
					value={`${stats.receiptCount} Vouchers`}
					tone="info"
					subtext="Terminal payment receipts"
				/>
				<Metric
					label="Facility Credit Limit"
					value={stats.creditLimit}
					tone="neutral"
					subtext="Approved deferred facility"
				/>
			</div>

			<div className="flex flex-col gap-3 rounded-lg border border-line bg-sand/30 p-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative flex-1 sm:max-w-md">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search by receipt #, invoice #, or reference..."
						className="border-line bg-paper pl-9 text-sm text-ink"
					/>
				</div>
				<div className="flex items-center gap-2">
					<Filter className="size-4 text-ink-soft" />
					<span className="text-xs font-medium text-ink-soft">Status:</span>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						aria-label="Filter by payment status"
						className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-orange"
					>
						<option value="ALL">All Receipts</option>
						<option value="RECONCILED">Reconciled</option>
						<option value="PENDING REVIEW">Pending Review</option>
						<option value="PROCESSING">Processing</option>
					</select>
				</div>
			</div>

			<div className="overflow-hidden rounded-lg border border-line bg-paper shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[780px] text-left text-sm">
						<thead className="border-b border-line bg-sand/50 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
							<tr>
								<th className="px-4 py-3">Receipt #</th>
								<th className="px-4 py-3">Invoice Ref</th>
								<th className="px-4 py-3">Payment Channel</th>
								<th className="px-4 py-3">Transaction Date</th>
								<th className="px-4 py-3">Amount</th>
								<th className="px-4 py-3">Status</th>
								<th className="px-4 py-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{filteredPayments.length === 0 ? (
								<tr>
									<td colSpan={7} className="px-4 py-12 text-center text-ink-soft">
										<Receipt className="mx-auto size-8 opacity-40" />
										<p className="mt-2 text-sm">No payment records found.</p>
									</td>
								</tr>
							) : (
								filteredPayments.map((p) => (
									<tr key={p.id} className="transition-colors hover:bg-sand/30">
										<td className="px-4 py-4 font-mono font-semibold text-orange-deep">
											{p.receiptNumber}
										</td>
										<td className="px-4 py-4 font-mono text-xs font-medium text-ink">
											{p.invoiceNumber}
										</td>
										<td className="px-4 py-4">
											<span className="text-xs font-medium text-ink">{p.channel}</span>
											<div className="font-mono text-[10px] text-ink-soft">
												{p.referenceCode}
											</div>
										</td>
										<td className="px-4 py-4">
											<div className="text-xs font-medium text-ink">
												{p.paymentDate}
											</div>
											<div className="text-[10px] text-ink-soft">{p.time}</div>
										</td>
										<td className="px-4 py-4 font-mono text-sm font-semibold text-ink">
											{formatNaira(p.amount)}
										</td>
										<td className="px-4 py-4">
											<StatusBadge label={p.status} tone={statusTone(p.status)} />
										</td>
										<td className="px-4 py-4 text-right">
											<div className="flex items-center justify-end gap-1.5">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setSelectedReceipt(p)}
													className="h-8 px-2 text-xs text-orange-deep hover:bg-orange/10"
												>
													<Eye className="mr-1 size-3.5" />
													View Receipt
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														toast.success(
															`Receipt ${p.receiptNumber} prepared for download.`
														);
													}}
													className="h-8 border-line px-2 text-xs text-ink"
												>
													<Download className="size-3.5" />
												</Button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{selectedReceipt && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setSelectedReceipt(null)}
				>
					<div className="w-full max-w-lg rounded-xl border border-line bg-paper p-6 shadow-2xl">
						<div className="flex items-start justify-between border-b border-line pb-4">
							<div>
								<span className="font-mono text-[10px] uppercase tracking-wider text-orange-deep">
									Payment voucher
								</span>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									{selectedReceipt.receiptNumber}
								</h3>
								<p className="text-xs text-ink-soft">
									{selectedReceipt.paymentDate} · {selectedReceipt.time}
								</p>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setSelectedReceipt(null)}
								aria-label="Close dialog"
							>
								<X className="size-4" />
							</Button>
						</div>

						<div className="mt-4 space-y-4">
							<div className="rounded-lg border border-orange/20 bg-orange/5 p-4 text-center">
								<CheckCircle2 className="mx-auto size-8 text-orange-deep" />
								<h4 className="mt-2 text-sm font-semibold text-orange-deep">
									{selectedReceipt.status === "Reconciled"
										? "Receipt reconciled"
										: selectedReceipt.status === "Pending Review"
										? "Awaiting finance confirmation"
										: "Processing"}
								</h4>
								<div className="mt-1 font-mono text-2xl font-bold text-ink">
									{formatNaira(selectedReceipt.amount)}
								</div>
								<p className="mt-1 font-mono text-xs text-ink-soft">
									Ref: {selectedReceipt.referenceCode}
								</p>
							</div>

							<div className="divide-y divide-line rounded border border-line text-xs">
								<div className="flex justify-between p-2.5">
									<span className="text-ink-soft">Issued To</span>
									<span className="font-semibold text-ink">
										{selectedReceipt.payerName}
									</span>
								</div>
								<div className="flex justify-between p-2.5">
									<span className="text-ink-soft">Settled Invoice</span>
									<span className="font-mono font-semibold text-ink">
										{selectedReceipt.invoiceNumber}
									</span>
								</div>
								<div className="flex justify-between p-2.5">
									<span className="text-ink-soft">Remittance Method</span>
									<span className="font-medium text-ink">
										{selectedReceipt.channel}
									</span>
								</div>
								<div className="flex justify-between p-2.5">
									<span className="text-ink-soft">Reconciliation</span>
									<StatusBadge
										label={selectedReceipt.status}
										tone={statusTone(selectedReceipt.status)}
									/>
								</div>
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									toast.success(
										`Receipt ${selectedReceipt.receiptNumber} prepared for print.`
									);
									setSelectedReceipt(null);
								}}
								className="border-line text-ink"
							>
								<Download className="mr-1.5 size-3.5" />
								Print / Save PDF
							</Button>
							<Button
								size="sm"
								onClick={() => setSelectedReceipt(null)}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								Done
							</Button>
						</div>
					</div>
				</div>
			)}

			{isSubmitOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setIsSubmitOpen(false)}
				>
					<div className="w-full max-w-md rounded-xl border border-line bg-paper p-6 shadow-2xl">
						<div className="flex items-start justify-between border-b border-line pb-4">
							<div>
								<span className="font-mono text-[10px] uppercase tracking-wider text-orange-deep">
									Manual remittance intake
								</span>
								<h3 className="mt-1 font-display text-lg font-bold text-ink">
									Submit payment proof
								</h3>
								<p className="text-xs text-ink-soft">
									Upload a bank deposit slip or enter the transaction reference for
									verification.
								</p>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsSubmitOpen(false)}
								aria-label="Close dialog"
							>
								<X className="size-4" />
							</Button>
						</div>

						<form onSubmit={handleSubmitRemittance} className="mt-4 space-y-3.5 text-xs">
							<div>
								<label className="font-semibold text-ink-soft">Target Invoice Number</label>
								<Input
									required
									placeholder="e.g. TRN-INV-2026-0814"
									value={formInvoice}
									onChange={(e) => setFormInvoice(e.target.value)}
									className="mt-1 border-line bg-sand font-mono text-xs text-ink"
								/>
							</div>

							<div>
								<label className="font-semibold text-ink-soft">Amount Paid (NGN ₦)</label>
								<Input
									required
									type="number"
									placeholder="e.g. 1850000"
									value={formAmount}
									onChange={(e) => setFormAmount(e.target.value)}
									className="mt-1 border-line bg-sand font-mono text-xs text-ink"
								/>
							</div>

							<div>
								<label className="font-semibold text-ink-soft">Payment Method</label>
								<select
									value={formChannel}
									onChange={(e) =>
										setFormChannel(e.target.value as PaymentReceipt["channel"])
									}
									className="mt-1 w-full rounded-md border border-line bg-sand p-2 text-xs text-ink"
								>
									<option value="Bank Transfer">Bank transfer</option>
									<option value="Card Payment">Card payment</option>
									<option value="USSD">USSD</option>
									<option value="Terminal Credit">Approved terminal credit</option>
								</select>
							</div>

							<div>
								<label className="font-semibold text-ink-soft">
									Bank reference / teller number
								</label>
								<Input
									required
									placeholder="e.g. REF-TLR-992140"
									value={formRef}
									onChange={(e) => setFormRef(e.target.value)}
									className="mt-1 border-line bg-sand font-mono text-xs text-ink"
								/>
							</div>

							<div className="rounded-lg border border-dashed border-line bg-sand/40 p-4 text-center">
								<Upload className="mx-auto size-6 text-ink-soft" />
								<p className="mt-1 text-xs font-medium text-ink">
									Attach bank teller or slip (PDF, JPG, PNG)
								</p>
								<p className="text-[10px] text-ink-soft">Maximum file size 5MB</p>
							</div>

							<div className="flex justify-end gap-2 border-t border-line pt-4">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setIsSubmitOpen(false)}
									className="border-line text-ink"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									size="sm"
									className="bg-orange text-white hover:bg-orange-deep"
								>
									Submit Proof
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</AppShell>
	);
}