import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	ArrowDownRight,
	ArrowUpRight,
	Download,
	FileSpreadsheet,
	Search,
	X,
} from "lucide-react";
import { AppShell, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FinancialStreamRecord {
	id: string;
	category: string;
	code: string;
	transactionsCount: number;
	invoiced: number;
	collected: number;
	outstanding: number;
	recoveryRate: number;
	period: string;
}

const financialStreams: FinancialStreamRecord[] = [
	{
		id: "fs-1",
		category: "Terminal handling & receiving",
		code: "THC-REC-01",
		transactionsCount: 384,
		invoiced: 168400000,
		collected: 164200000,
		outstanding: 4200000,
		recoveryRate: 97.5,
		period: "September 2026",
	},
	{
		id: "fs-2",
		category: "Bonded storage & escalation",
		code: "STR-ESC-02",
		transactionsCount: 219,
		invoiced: 142800000,
		collected: 128500000,
		outstanding: 14300000,
		recoveryRate: 89.9,
		period: "September 2026",
	},
	{
		id: "fs-3",
		category: "Examination coordination handling",
		code: "EXM-COR-03",
		transactionsCount: 142,
		invoiced: 58200000,
		collected: 58200000,
		outstanding: 0,
		recoveryRate: 100.0,
		period: "September 2026",
	},
	{
		id: "fs-4",
		category: "Reefer power & temperature monitoring",
		code: "REEF-PWR-04",
		transactionsCount: 68,
		invoiced: 34100000,
		collected: 32400000,
		outstanding: 1700000,
		recoveryRate: 95.0,
		period: "September 2026",
	},
	{
		id: "fs-5",
		category: "Gate pass & administration",
		code: "GATE-ADM-05",
		transactionsCount: 492,
		invoiced: 25000000,
		collected: 24800000,
		outstanding: 200000,
		recoveryRate: 99.2,
		period: "September 2026",
	},
];

const agingBuckets = [
	{ label: "Current (0 – 7 days)", amount: "₦11,200,000", pct: 54, status: "Normal" },
	{ label: "8 – 14 days", amount: "₦5,800,000", pct: 28, status: "Watch" },
	{ label: "15 – 30 days", amount: "₦2,400,000", pct: 12, status: "Escalate" },
	{ label: "30+ days", amount: "₦1,000,000", pct: 6, status: "Follow-up" },
];

export default function ReportsFinancialRoute() {
	const [streams] = useState<FinancialStreamRecord[]>(financialStreams);
	const [search, setSearch] = useState("");
	const [isExportModalOpen, setIsExportModalOpen] = useState(false);
	const [exportPeriod, setExportPeriod] = useState("Month-to-Date (September 2026)");
	const [exportFormat, setExportFormat] = useState("CSV");

	const formatNaira = (amount: number) => {
		return new Intl.NumberFormat("en-NG", {
			style: "currency",
			currency: "NGN",
			maximumFractionDigits: 0,
		}).format(amount);
	};

	const filteredStreams = useMemo(() => {
		return streams.filter(
			(s) =>
				s.category.toLowerCase().includes(search.toLowerCase()) ||
				s.code.toLowerCase().includes(search.toLowerCase())
		);
	}, [streams, search]);

	const totals = useMemo(() => {
		const totalInvoiced = streams.reduce((acc, s) => acc + s.invoiced, 0);
		const totalCollected = streams.reduce((acc, s) => acc + s.collected, 0);
		const totalOutstanding = streams.reduce((acc, s) => acc + s.outstanding, 0);
		const overallRate = ((totalCollected / totalInvoiced) * 100).toFixed(1);

		return {
			invoiced: formatNaira(totalInvoiced),
			collected: formatNaira(totalCollected),
			outstanding: formatNaira(totalOutstanding),
			recoveryRate: `${overallRate}%`,
		};
	}, [streams]);

	const handleExportCSV = () => {
		const header =
			"Category,Code,Transactions,Invoiced (NGN),Collected (NGN),Outstanding (NGN),Recovery Rate,Period\n";
		const rows = streams
			.map(
				(s) =>
					`"${s.category}","${s.code}",${s.transactionsCount},${s.invoiced},${s.collected},${s.outstanding},"${s.recoveryRate}%","${s.period}"`
			)
			.join("\n");
		const blob = new Blob([header + rows], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `financial-revenue-report-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Financial revenue schedule exported locally.");
	};

	return (
		<AppShell title="Financial Reports" eyebrow="Commercial Revenue & Ledger Analytics">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Commercial & accounting analytics
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Revenue & collections analytics
					</h2>
					<p className="mt-1 text-sm text-ink-soft">
						Monitor terminal tariff collections, storage accruals, and receivables aging
						schedules.
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
						Export Schedule
					</Button>
					<Button
						size="sm"
						onClick={() => setIsExportModalOpen(true)}
						className="bg-orange text-white hover:bg-orange-deep"
					>
						<FileSpreadsheet className="mr-1.5 size-3.5" />
						Generate Statement
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<Metric
					label="Total Collected MTD"
					value={totals.collected}
					tone="success"
					subtext="+14.2% MoM collection velocity"
				/>
				<Metric
					label="Gross Invoiced MTD"
					value={totals.invoiced}
					tone="info"
					subtext="Across all active tariff lines"
				/>
				<Metric
					label="Total Outstanding"
					value={totals.outstanding}
					tone="warning"
					subtext="Pending customer settlement"
				/>
				<Metric
					label="Overall recovery rate"
					value={totals.recoveryRate}
					tone="neutral"
					subtext="Target benchmark: > 92.0%"
				/>
			</div>

			<div className="rounded-lg border border-line bg-paper p-5">
				<div className="flex items-center justify-between border-b border-line pb-3">
					<div>
						<h3 className="font-display text-sm font-bold text-ink">
							Aging receivables distribution
						</h3>
						<p className="text-xs text-ink-soft">
							Active ledger breakdown by invoice aging bucket
						</p>
					</div>
					<span className="font-mono text-xs font-semibold text-orange-deep">
						Total outstanding: {totals.outstanding}
					</span>
				</div>

				<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{agingBuckets.map((bucket) => (
						<div
							key={bucket.label}
							className="rounded-lg border border-line/70 bg-sand/30 p-3.5"
						>
							<span className="text-[11px] font-semibold text-ink-soft">
								{bucket.label}
							</span>
							<div className="mt-1 font-mono text-lg font-bold text-ink">
								{bucket.amount}
							</div>
							<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sand">
								<div
									className={`h-full rounded-full ${
										bucket.status === "Normal"
											? "bg-orange"
											: bucket.status === "Watch"
											? "bg-amber"
											: "bg-coral"
									}`}
									style={{ width: `${bucket.pct}%` }}
								/>
							</div>
							<div className="mt-1.5 flex justify-between text-[10px] text-ink-soft">
								<span>{bucket.pct}% of total</span>
								<span className="font-medium text-ink">{bucket.status}</span>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="flex flex-col gap-3 rounded-lg border border-line bg-sand/30 p-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative flex-1 sm:max-w-md">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search revenue streams by category or code..."
						className="border-line bg-paper pl-9 text-sm text-ink"
					/>
				</div>
				<div className="font-mono text-xs text-ink-soft">
					Period: September 2026
				</div>
			</div>

			<div className="overflow-hidden rounded-lg border border-line bg-paper shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[800px] text-left text-sm">
						<thead className="border-b border-line bg-sand/50 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
							<tr>
								<th className="px-4 py-3">Tariff Code</th>
								<th className="px-4 py-3">Revenue Stream</th>
								<th className="px-4 py-3">Transactions</th>
								<th className="px-4 py-3">Invoiced (₦)</th>
								<th className="px-4 py-3">Collected (₦)</th>
								<th className="px-4 py-3">Outstanding (₦)</th>
								<th className="px-4 py-3">Recovery rate</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{filteredStreams.map((s) => (
								<tr key={s.id} className="transition-colors hover:bg-sand/30">
									<td className="px-4 py-4 font-mono font-semibold text-orange-deep">
										{s.code}
									</td>
									<td className="px-4 py-4">
										<span className="font-medium text-ink">{s.category}</span>
										<div className="text-[10px] text-ink-soft">{s.period}</div>
									</td>
									<td className="px-4 py-4 font-mono text-xs text-ink">
										{s.transactionsCount} ops
									</td>
									<td className="px-4 py-4 font-mono text-xs font-semibold text-ink">
										{formatNaira(s.invoiced)}
									</td>
									<td className="px-4 py-4 font-mono text-xs font-semibold text-teal-deep">
										{formatNaira(s.collected)}
									</td>
									<td className="px-4 py-4 font-mono text-xs font-semibold text-orange-deep">
										{formatNaira(s.outstanding)}
									</td>
									<td className="px-4 py-4">
										<span
											className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${
												s.recoveryRate >= 95
													? "text-teal-deep"
													: "text-orange-deep"
											}`}
										>
											{s.recoveryRate >= 95 ? (
												<ArrowUpRight className="size-3.5" />
											) : (
												<ArrowDownRight className="size-3.5" />
											)}
											{s.recoveryRate}%
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{isExportModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setIsExportModalOpen(false)}
				>
					<div className="w-full max-w-md rounded-xl border border-line bg-paper p-6 shadow-2xl">
						<div className="flex items-start justify-between border-b border-line pb-4">
							<div>
								<span className="font-mono text-[10px] uppercase tracking-wider text-orange-deep">
									Financial reporting
								</span>
								<h3 className="mt-1 font-display text-lg font-bold text-ink">
									Generate statement
								</h3>
								<p className="text-xs text-ink-soft">
									Export collections and accrual schedules for internal review.
								</p>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsExportModalOpen(false)}
								aria-label="Close dialog"
							>
								<X className="size-4" />
							</Button>
						</div>

						<div className="mt-4 space-y-3.5 text-xs">
							<div>
								<label className="font-semibold text-ink-soft">
									Reporting accounting period
								</label>
								<select
									value={exportPeriod}
									onChange={(e) => setExportPeriod(e.target.value)}
									className="mt-1 w-full rounded-md border border-line bg-sand p-2 text-xs text-ink"
								>
									<option value="Month-to-Date (September 2026)">
										Month-to-date (September 2026)
									</option>
									<option value="August 2026 Full Close">
										August 2026 full close
									</option>
									<option value="Q3 2026 Comprehensive">
										Q3 2026 comprehensive
									</option>
									<option value="Year-to-Date 2026">
										Year-to-date 2026
									</option>
								</select>
							</div>

							<div>
								<label className="font-semibold text-ink-soft">Export format</label>
								<div className="mt-1 grid grid-cols-2 gap-2">
									<button
										type="button"
										onClick={() => setExportFormat("CSV")}
										className={`rounded border p-2 text-center text-xs font-semibold transition-colors ${
											exportFormat === "CSV"
												? "border-orange bg-orange/10 text-orange-deep"
												: "border-line bg-paper text-ink-soft hover:bg-sand"
										}`}
									>
										CSV / Excel
									</button>
									<button
										type="button"
										onClick={() => setExportFormat("PDF")}
										className={`rounded border p-2 text-center text-xs font-semibold transition-colors ${
											exportFormat === "PDF"
												? "border-orange bg-orange/10 text-orange-deep"
												: "border-line bg-paper text-ink-soft hover:bg-sand"
										}`}
									>
										PDF summary
									</button>
								</div>
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsExportModalOpen(false)}
								className="border-line text-ink"
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={() => {
									toast.success(
										`Financial statement for ${exportPeriod} prepared locally (${exportFormat}).`
									);
									setIsExportModalOpen(false);
								}}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Download className="mr-1.5 size-3.5" />
								Generate & Export
							</Button>
						</div>
					</div>
				</div>
			)}
		</AppShell>
	);
}