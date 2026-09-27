import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	AlertTriangle,
	ArrowRight,
	Check,
	ChevronDown,
	Clock3,
	CreditCard,
	Download,
	FileCheck2,
	Filter,
	Plus,
	Receipt,
	Search,
	Wallet,
	X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invoices } from "@/data/mock";

interface PaymentRecord {
	id: string;
	reference: string;
	receiptNumber: string;
	customer: string;
	amount: string;
	method: string;
	date: string;
	status: "Reconciled" | "Unallocated" | "Pending" | "Failed";
	invoiceRef: string;
	bankRef: string;
}

const initialPayments: PaymentRecord[] = [
	{
		id: "pay-1",
		reference: "TRN-PAY-2026-0911",
		receiptNumber: "TRN-RCP-00841",
		customer: "Atlantic Trade Nigeria Ltd",
		amount: "₦1,850,000",
		method: "Bank Transfer",
		date: "09 Sep 2026 · 11:24",
		status: "Reconciled",
		invoiceRef: "TRN-INV-2026-0142",
		bankRef: "NIP-9928172635",
	},
	{
		id: "pay-2",
		reference: "TRN-PAY-2026-0912",
		receiptNumber: "TRN-RCP-00842",
		customer: "Kano Freight Forwarders",
		amount: "₦2,640,000",
		method: "Bank Transfer",
		date: "08 Sep 2026 · 15:40",
		status: "Reconciled",
		invoiceRef: "TRN-INV-2026-0143",
		bankRef: "WIR-8827163541",
	},
	{
		id: "pay-3",
		reference: "TRN-PAY-2026-0913",
		receiptNumber: "TRN-RCP-00843",
		customer: "Sahara Energy Logistics",
		amount: "₦640,000",
		method: "Bank Transfer",
		date: "08 Sep 2026 · 09:15",
		status: "Unallocated",
		invoiceRef: "Pending match",
		bankRef: "CBT-7736251423",
	},
	{
		id: "pay-4",
		reference: "TRN-PAY-2026-0914",
		receiptNumber: "TRN-RCP-00844",
		customer: "Meridian Customs Services",
		amount: "₦980,000",
		method: "Bank Transfer",
		date: "07 Sep 2026 · 16:02",
		status: "Reconciled",
		invoiceRef: "TRN-INV-2026-0144",
		bankRef: "NIP-6625143789",
	},
	{
		id: "pay-5",
		reference: "TRN-PAY-2026-0915",
		receiptNumber: "TRN-RCP-00845",
		customer: "Zenith Global Cargo Ltd",
		amount: "₦1,250,000",
		method: "Card Payment",
		date: "07 Sep 2026 · 13:18",
		status: "Pending",
		invoiceRef: "TRN-INV-2026-0145",
		bankRef: "CRD-5514238971",
	},
	{
		id: "pay-6",
		reference: "TRN-PAY-2026-0916",
		receiptNumber: "TRN-RCP-00846",
		customer: "Apex Multimodal Systems",
		amount: "₦760,000",
		method: "Card Payment",
		date: "06 Sep 2026 · 10:45",
		status: "Failed",
		invoiceRef: "TRN-INV-2026-0146",
		bankRef: "CRD-4403928172",
	},
];

export default function FinancePaymentsRoute() {
	const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("ALL");
	const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
	const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

	const [newCustomer, setNewCustomer] = useState("");
	const [newAmount, setNewAmount] = useState("");
	const [newMethod, setNewMethod] = useState("Bank Transfer");
	const [newInvoiceRef, setNewInvoiceRef] = useState(invoices[0]?.number ?? "");
	const [newBankRef, setNewBankRef] = useState("");

	const filteredPayments = useMemo(() => {
		return payments.filter((item) => {
			const matchesSearch =
				item.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.bankRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.invoiceRef.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesStatus =
				statusFilter === "ALL" ? true : item.status.toUpperCase() === statusFilter.toUpperCase();

			return matchesSearch && matchesStatus;
		});
	}, [payments, searchQuery, statusFilter]);

	const handleRecordPayment = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newCustomer || !newAmount) {
			toast.error("Please fill in customer and amount.");
			return;
		}

		const nextId = `pay-${payments.length + 1}`;
		const nextReceiptNum = `TRN-RCP-00${841 + payments.length}`;
		const nextRef = `TRN-PAY-2026-09${String(17 + payments.length).padStart(2, "0")}`;

		const newRecord: PaymentRecord = {
			id: nextId,
			reference: nextRef,
			receiptNumber: nextReceiptNum,
			customer: newCustomer,
			amount: newAmount.startsWith("₦") ? newAmount : `₦${newAmount}`,
			method: newMethod,
			date: "Just now · Today",
			status: newInvoiceRef && newInvoiceRef !== "Pending match" ? "Reconciled" : "Unallocated",
			invoiceRef: newInvoiceRef || "Pending match",
			bankRef:
				newBankRef || `REF-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
		};

		setPayments([newRecord, ...payments]);
		setIsRecordModalOpen(false);
		setNewCustomer("");
		setNewAmount("");
		setNewBankRef("");
		toast.success(`Payment ${nextReceiptNum} recorded locally.`);
	};

	const handleDownloadLedger = () => {
		const csvContent = [
			[
				"Receipt",
				"Reference",
				"Customer",
				"Amount",
				"Method",
				"Date",
				"Status",
				"Invoice",
				"Bank Ref",
			].join(","),
			...payments.map((p) =>
				[
					p.receiptNumber,
					p.reference,
					`"${p.customer}"`,
					`"${p.amount}"`,
					`"${p.method}"`,
					`"${p.date}"`,
					p.status,
					p.invoiceRef,
					p.bankRef,
				].join(",")
			),
		].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.setAttribute(
			"download",
			`TRINU-Payments-Ledger-${new Date().toISOString().slice(0, 10)}.csv`
		);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		toast.success("Payments ledger exported locally.");
	};

	return (
		<AppShell title="Payments & Receipts" eyebrow="Finance Workspace · Reconciliation">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Treasury & Audit Control · Abuja Flagship Facility
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Payments & Receipt Reconciliation
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Track bank confirmations, receipts, unallocated deposits, and terminal invoice
						settlements.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={handleDownloadLedger}
					>
						<Download className="size-4" /> Export Ledger
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsRecordModalOpen(true)}
					>
						<Plus className="size-4" /> Record Payment
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total Collected"
					value="₦8.12m"
					detail="September · +14% vs Aug"
					tone="success"
					icon={Wallet}
				/>
				<Metric
					label="Unallocated Transfers"
					value="₦640k"
					detail="2 deposits require matching"
					tone="warning"
					icon={AlertTriangle}
				/>
				<Metric
					label="Failed Transfers"
					value="1"
					detail="Requires payer bank trace"
					tone="critical"
					icon={Clock3}
				/>
				<Metric
					label="Settlement Ratio"
					value="98.2%"
					detail="Same-day invoice matching"
					tone="success"
					icon={Check}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by customer, receipt, reference, or bank ref..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex items-center gap-2">
						<div className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" /> Filter status:
						</div>
						{(["ALL", "Reconciled", "Unallocated", "Pending", "Failed"] as const).map(
							(status) => (
								<button
									key={status}
									onClick={() => setStatusFilter(status)}
									className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
										statusFilter === status
											? "bg-ink text-sand"
											: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
									}`}
								>
									{status}
								</button>
							)
						)}
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-[850px] text-left text-sm">
						<thead>
							<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								<th className="px-4 py-3 font-medium">Receipt / Ref</th>
								<th className="px-4 py-3 font-medium">Customer / Payer</th>
								<th className="px-4 py-3 font-medium">Channel / Bank Ref</th>
								<th className="px-4 py-3 font-medium">Amount</th>
								<th className="px-4 py-3 font-medium">Date</th>
								<th className="px-4 py-3 font-medium">Invoice Match</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium text-right">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{filteredPayments.map((item) => (
								<tr key={item.id} className="transition-colors hover:bg-sand/60">
									<td className="px-4 py-3.5 font-mono text-xs">
										<span className="font-semibold text-orange-deep">{item.receiptNumber}</span>
										<span className="block text-[10px] text-ink-soft">{item.reference}</span>
									</td>
									<td className="px-4 py-3.5">
										<p className="font-medium text-ink">{item.customer}</p>
									</td>
									<td className="px-4 py-3.5">
										<p className="text-xs text-ink">{item.method}</p>
										<p className="font-mono text-[10px] text-ink-soft">{item.bankRef}</p>
									</td>
									<td className="px-4 py-3.5 font-mono font-semibold text-ink">{item.amount}</td>
									<td className="px-4 py-3.5 text-xs text-ink-soft">{item.date}</td>
									<td className="px-4 py-3.5 font-mono text-xs">
										{item.invoiceRef === "Pending match" ? (
											<span className="text-coral">Pending match</span>
										) : (
											<span className="text-ink">{item.invoiceRef}</span>
										)}
									</td>
									<td className="px-4 py-3.5">
										<StatusBadge label={item.status} tone={statusTone(item.status)} />
									</td>
									<td className="px-4 py-3.5 text-right">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setSelectedPayment(item)}
											className="text-xs font-semibold text-orange-deep hover:bg-orange/10 hover:text-orange-deep"
										>
											{item.status === "Unallocated" ? "Allocate" : "View"}{" "}
											<ArrowRight className="ml-1 size-3.5" />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{filteredPayments.length === 0 && (
					<div className="p-12 text-center">
						<Receipt className="mx-auto size-8 text-ink-soft" />
						<h3 className="mt-3 font-display text-base font-bold text-ink">No payments found</h3>
						<p className="mt-1 text-xs text-ink-soft">
							No transactions match your current query or filter criteria.
						</p>
					</div>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredPayments.length} of {payments.length} transactions
					</span>
					<span>Payment provider confirmed during Discovery</span>
				</div>
			</section>

			{isRecordModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setIsRecordModalOpen(false)}
				>
					<div className="w-full max-w-lg rounded-xl bg-paper p-6 shadow-2xl ring-1 ring-line">
						<div className="flex items-center justify-between border-b border-line pb-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
									Treasury Intake
								</p>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									Record Customer Payment
								</h3>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsRecordModalOpen(false)}
								aria-label="Close dialog"
							>
								<X />
							</Button>
						</div>

						<form onSubmit={handleRecordPayment} className="mt-5 space-y-4">
							<div>
								<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Customer / Payer Organization
								</label>
								<Input
									required
									placeholder="e.g. Atlantic Trade Nigeria Ltd"
									value={newCustomer}
									onChange={(e) => setNewCustomer(e.target.value)}
									className="mt-1.5 border-line bg-sand text-ink"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Amount (NGN)
									</label>
									<Input
										required
										placeholder="e.g. 1,450,000"
										value={newAmount}
										onChange={(e) => setNewAmount(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-ink"
									/>
								</div>
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Payment Channel
									</label>
									<select
										value={newMethod}
										onChange={(e) => setNewMethod(e.target.value)}
										className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs font-medium text-ink outline-none"
									>
										<option>Bank Transfer</option>
										<option>Card Payment</option>
										<option>USSD</option>
									</select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Match with Invoice
									</label>
									<select
										value={newInvoiceRef}
										onChange={(e) => setNewInvoiceRef(e.target.value)}
										className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 font-mono text-xs text-ink outline-none"
									>
										<option value="">Leave unallocated</option>
										{invoices.map((inv) => (
											<option key={inv.number} value={inv.number}>
												{inv.number} ({inv.amount})
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Bank Reference / Session ID
									</label>
									<Input
										placeholder="e.g. NIP-998234812"
										value={newBankRef}
										onChange={(e) => setNewBankRef(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-xs text-ink"
									/>
								</div>
							</div>

							<div className="flex justify-end gap-2 border-t border-line pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsRecordModalOpen(false)}
								>
									Cancel
								</Button>
								<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
									Confirm & Post Receipt
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}

			{selectedPayment && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setSelectedPayment(null)}
				>
					<div className="w-full max-w-md rounded-xl bg-paper p-6 shadow-2xl ring-1 ring-line">
						<div className="flex items-center justify-between border-b border-line pb-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
									Receipt Details
								</p>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									{selectedPayment.receiptNumber}
								</h3>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setSelectedPayment(null)}
								aria-label="Close dialog"
							>
								<X />
							</Button>
						</div>

						<div className="mt-4 space-y-3 rounded-lg bg-sand p-4 text-xs ring-1 ring-line">
							<div className="flex justify-between">
								<span className="text-ink-soft">Payer</span>
								<span className="font-semibold text-ink">{selectedPayment.customer}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-ink-soft">Amount</span>
								<span className="font-mono font-bold text-ink">{selectedPayment.amount}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-ink-soft">Channel</span>
								<span className="text-ink">{selectedPayment.method}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-ink-soft">Bank Session ID</span>
								<span className="font-mono text-ink-soft">{selectedPayment.bankRef}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-ink-soft">Matched Invoice</span>
								<span className="font-mono font-medium text-orange-deep">
									{selectedPayment.invoiceRef}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-ink-soft">Status</span>
								<StatusBadge
									label={selectedPayment.status}
									tone={statusTone(selectedPayment.status)}
								/>
							</div>
						</div>

						<div className="mt-5 flex gap-2">
							<Button
								variant="outline"
								className="w-1/2 border-line bg-paper text-ink"
								onClick={() => {
									toast.success(`Receipt ${selectedPayment.receiptNumber} prepared for download.`);
									setSelectedPayment(null);
								}}
							>
								<Download className="mr-1.5 size-4" /> Download PDF
							</Button>
							<Button
								className="w-1/2 bg-orange text-white hover:bg-orange-deep"
								onClick={() => {
									toast.success(`Payment ${selectedPayment.receiptNumber} marked verified.`);
									setSelectedPayment(null);
								}}
							>
								Verify Deposit
							</Button>
						</div>
					</div>
				</div>
			)}
		</AppShell>
	);
}