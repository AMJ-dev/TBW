import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	Clock3,
	Download,
	Filter,
	Plus,
	Search,
	X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InvoiceRecord {
	id: string;
	number: string;
	customer: string;
	amount: string;
	due: string;
	status: "Paid" | "Overdue" | "Issued" | "Pending";
	category: "Storage escalation" | "Handling" | "Storage" | "Full terminal charge";
	issuedDate: string;
}

const initialInvoices: InvoiceRecord[] = [
	{
		id: "inv-1",
		number: "TRN-INV-2026-0142",
		customer: "Atlantic Trade Nigeria Ltd",
		amount: "₦1,850,000",
		due: "14 Sep 2026",
		status: "Paid",
		category: "Full terminal charge",
		issuedDate: "07 Sep 2026",
	},
	{
		id: "inv-2",
		number: "TRN-INV-2026-0143",
		customer: "Kano Freight Forwarders",
		amount: "₦2,640,000",
		due: "12 Sep 2026",
		status: "Overdue",
		category: "Storage",
		issuedDate: "01 Sep 2026",
	},
	{
		id: "inv-3",
		number: "TRN-INV-2026-0144",
		customer: "Meridian Customs Services",
		amount: "₦980,000",
		due: "18 Sep 2026",
		status: "Issued",
		category: "Handling",
		issuedDate: "08 Sep 2026",
	},
	{
		id: "inv-4",
		number: "TRN-INV-2026-0145",
		customer: "Zenith Global Cargo Ltd",
		amount: "₦1,250,000",
		due: "20 Sep 2026",
		status: "Pending",
		category: "Storage escalation",
		issuedDate: "09 Sep 2026",
	},
	{
		id: "inv-5",
		number: "TRN-INV-2026-0146",
		customer: "Sahara Energy Logistics",
		amount: "₦640,000",
		due: "22 Sep 2026",
		status: "Issued",
		category: "Handling",
		issuedDate: "09 Sep 2026",
	},
];

export default function FinanceInvoicesRoute() {
	const [invoices, setInvoices] = useState<InvoiceRecord[]>(initialInvoices);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

	const [newCustomer, setNewCustomer] = useState("");
	const [newAmount, setNewAmount] = useState("");
	const [newCategory, setNewCategory] =
		useState<InvoiceRecord["category"]>("Full terminal charge");
	const [newDue, setNewDue] = useState("14 calendar days");

	const filteredInvoices = useMemo(() => {
		return invoices.filter((inv) => {
			const matchQuery =
				inv.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
				inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
				inv.category.toLowerCase().includes(searchQuery.toLowerCase());

			const matchStatus =
				statusFilter === "ALL" ? true : inv.status.toUpperCase() === statusFilter.toUpperCase();

			return matchQuery && matchStatus;
		});
	}, [invoices, searchQuery, statusFilter]);

	const handleCreateInvoice = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newCustomer || !newAmount) {
			toast.error("Please specify customer and amount.");
			return;
		}

		const nextNumber = `TRN-INV-2026-01${47 + invoices.length}`;
		const newRecord: InvoiceRecord = {
			id: `inv-${invoices.length + 1}`,
			number: nextNumber,
			customer: newCustomer,
			amount: newAmount.startsWith("₦") ? newAmount : `₦${newAmount}`,
			due: "24 Sep 2026",
			status: "Issued",
			category: newCategory,
			issuedDate: "Today",
		};

		setInvoices([newRecord, ...invoices]);
		setIsModalOpen(false);
		setNewCustomer("");
		setNewAmount("");
		toast.success(`Invoice ${nextNumber} created locally.`);
	};

	return (
		<AppShell title="Invoices" eyebrow="Finance Workspace · Billing Ledger">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Commercial billing · Terminal obligations
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Invoicing & tariff ledger
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Issue and track terminal handling charges, storage obligations, and settlement
						records.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Invoice ledger exported locally.")}
					>
						<Download className="size-4" /> Export Ledger
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsModalOpen(true)}
					>
						<Plus className="size-4" /> Create Invoice
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total Outstanding"
					value="₦4.49m"
					detail="2 invoices overdue"
					tone="warning"
					icon={AlertTriangle}
				/>
				<Metric
					label="Collected This Month"
					value="₦8.12m"
					detail="+14% vs August"
					tone="success"
					icon={CheckCircle2}
				/>
				<Metric
					label="Pro-forma Pending"
					value="3"
					detail="₦1.26m awaiting confirmation"
					tone="info"
					icon={Clock3}
				/>
				<Metric
					label="Settled Rate"
					value="94.8%"
					detail="Average dwell: 4.2 days"
					tone="success"
					icon={CheckCircle2}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by invoice number, customer, or fee category..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" /> Status:
						</span>
						{["ALL", "Paid", "Overdue", "Issued", "Pending"].map((s) => (
							<button
								key={s}
								onClick={() => setStatusFilter(s)}
								className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
									statusFilter === s
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								}`}
							>
								{s}
							</button>
						))}
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-[850px] text-left text-sm">
						<thead>
							<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								<th className="px-4 py-3 font-medium">Invoice Number</th>
								<th className="px-4 py-3 font-medium">Customer / Consignee</th>
								<th className="px-4 py-3 font-medium">Fee Category</th>
								<th className="px-4 py-3 font-medium">Amount (NGN)</th>
								<th className="px-4 py-3 font-medium">Due Date</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium text-right">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{filteredInvoices.map((inv) => (
								<tr key={inv.id} className="transition-colors hover:bg-sand/60">
									<td className="px-4 py-3.5 font-mono text-xs font-semibold text-orange-deep">
										{inv.number}
									</td>
									<td className="px-4 py-3.5">
										<p className="font-semibold text-ink">{inv.customer}</p>
										<p className="font-mono text-[10px] text-ink-soft">
											Issued: {inv.issuedDate}
										</p>
									</td>
									<td className="px-4 py-3.5 text-xs text-ink-soft">{inv.category}</td>
									<td className="px-4 py-3.5 font-mono text-xs font-bold text-ink">
										{inv.amount}
									</td>
									<td className="px-4 py-3.5 text-xs text-ink-soft">{inv.due}</td>
									<td className="px-4 py-3.5">
										<StatusBadge label={inv.status} tone={statusTone(inv.status)} />
									</td>
									<td className="px-4 py-3.5 text-right">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setSelectedInvoice(inv)}
											className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
										>
											View Invoice <ArrowRight className="ml-1 size-3.5" />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredInvoices.length} of {invoices.length} billing records
					</span>
					<span>Currency: Nigerian Naira (NGN) · Effective-dated tariff engine</span>
				</div>
			</section>

			{isModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
				>
					<div className="w-full max-w-lg rounded-xl bg-paper p-6 shadow-2xl ring-1 ring-line">
						<div className="flex items-center justify-between border-b border-line pb-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
									Billing engine
								</p>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									Generate Terminal Invoice
								</h3>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
								<X />
							</Button>
						</div>

						<form onSubmit={handleCreateInvoice} className="mt-5 space-y-4">
							<div>
								<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Customer / Payer Account
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
										Tariff Category
									</label>
									<select
										value={newCategory}
										onChange={(e) =>
											setNewCategory(e.target.value as InvoiceRecord["category"])
										}
										className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none"
									>
										<option>Full terminal charge</option>
										<option>Handling</option>
										<option>Storage</option>
										<option>Storage escalation</option>
									</select>
								</div>
							</div>

							<div className="flex justify-end gap-2 border-t border-line pt-4">
								<Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
									Issue Invoice
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}

			{selectedInvoice && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setSelectedInvoice(null)}
				>
					<div className="w-full max-w-md rounded-xl bg-paper p-6 shadow-2xl ring-1 ring-line">
						<div className="flex items-center justify-between border-b border-line pb-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
									Invoice record
								</p>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									{selectedInvoice.number}
								</h3>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(null)}>
								<X />
							</Button>
						</div>

						<div className="mt-4 space-y-3 rounded-lg bg-sand p-4 text-xs ring-1 ring-line">
							<div className="flex justify-between">
								<span className="text-ink-soft">Customer</span>
								<span className="font-semibold text-ink">{selectedInvoice.customer}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-ink-soft">Amount</span>
								<span className="font-mono font-bold text-ink">
									{selectedInvoice.amount}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-ink-soft">Category</span>
								<span className="text-ink">{selectedInvoice.category}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-ink-soft">Due Date</span>
								<span className="font-medium text-ink">{selectedInvoice.due}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-ink-soft">Status</span>
								<StatusBadge
									label={selectedInvoice.status}
									tone={statusTone(selectedInvoice.status)}
								/>
							</div>
						</div>

						<div className="mt-5 flex gap-2">
							<Button
								variant="outline"
								className="w-1/2 border-line bg-paper text-ink"
								onClick={() => {
									toast.success(`PDF for ${selectedInvoice.number} prepared for download.`);
									setSelectedInvoice(null);
								}}
							>
								<Download className="mr-1.5 size-4" /> Download PDF
							</Button>
							<Button
								className="w-1/2 bg-orange text-white hover:bg-orange-deep"
								onClick={() => {
									toast.success(`Payment recording opened for ${selectedInvoice.number}.`);
									setSelectedInvoice(null);
								}}
							>
								Record Payment
							</Button>
						</div>
					</div>
				</div>
			)}
		</AppShell>
	);
}