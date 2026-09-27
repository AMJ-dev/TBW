import { useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	BadgeCheck,
	Banknote,
	Check,
	ChevronLeft,
	Clock3,
	Download,
	Filter,
	History,
	Link2,
	Search,
	ShieldCheck,
	Upload,
	Wallet,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalFilePicker } from "@/components/ui/local-file-picker";
import { cn } from "@/lib/utils";

type BankLineStatus =
	| "Matched"
	| "Suggested match"
	| "Unmatched"
	| "Duplicate"
	| "Excluded";

interface BankLine {
	id: string;
	statementDate: string;
	valueDate: string;
	description: string;
	reference: string;
	amount: number;
	direction: "credit" | "debit";
	status: BankLineStatus;
	suggestedMatch?: {
		receiptNumber: string;
		customer: string;
		invoiceRef: string;
		confidence: number;
	};
	matchedReceipt?: string;
	notes: string;
}

const initialLines: BankLine[] = [
	{
		id: "bl-1",
		statementDate: "24 Sep 2026",
		valueDate: "24 Sep 2026",
		description: "NIP INWARD TRANSFER · ATLANTIC TRADE NIGERIA LTD",
		reference: "NIP-9928172635",
		amount: 1850000,
		direction: "credit",
		status: "Suggested match",
		suggestedMatch: {
			receiptNumber: "TRN-RCP-2026-0911",
			customer: "Atlantic Trade Nigeria Ltd",
			invoiceRef: "TRN-INV-2026-0142",
			confidence: 96,
		},
		notes: "Amount and payer match the pending receipt.",
	},
	{
		id: "bl-2",
		statementDate: "24 Sep 2026",
		valueDate: "24 Sep 2026",
		description: "NIP INWARD TRANSFER · KANO FREIGHT FORWARDERS",
		reference: "NIP-8827163541",
		amount: 2640000,
		direction: "credit",
		status: "Matched",
		matchedReceipt: "TRN-RCP-2026-0912",
		notes: "Confirmed against TRN-INV-2026-0143.",
	},
	{
		id: "bl-3",
		statementDate: "23 Sep 2026",
		valueDate: "23 Sep 2026",
		description: "TRANSFER FROM · SAHARA ENERGY LOGISTICS",
		reference: "CBT-7736251423",
		amount: 640000,
		direction: "credit",
		status: "Unmatched",
		notes: "No matching receipt. Payer not recognized against open invoices.",
	},
	{
		id: "bl-4",
		statementDate: "23 Sep 2026",
		valueDate: "23 Sep 2026",
		description: "REVERSAL · NIP-8827163541",
		reference: "REV-9928172635",
		amount: 2640000,
		direction: "debit",
		status: "Matched",
		matchedReceipt: "TRN-RCP-2026-0912",
		notes: "Bank reversal. Original receipt marked pending review.",
	},
	{
		id: "bl-5",
		statementDate: "22 Sep 2026",
		valueDate: "22 Sep 2026",
		description: "NIP INWARD TRANSFER · MERIDIAN CUSTOMS SERVICES",
		reference: "NIP-6625143789",
		amount: 980000,
		direction: "credit",
		status: "Duplicate",
		notes: "Same reference as line 22 Sep 2026 · NIP-6625143789 already reconciled.",
	},
	{
		id: "bl-6",
		statementDate: "22 Sep 2026",
		valueDate: "22 Sep 2026",
		description: "BANK CHARGE · MONTHLY ACCOUNT FEE",
		reference: "CHG-2026-09-ACCT",
		amount: 25000,
		direction: "debit",
		status: "Excluded",
		notes: "Bank fees excluded from reconciliation.",
	},
];

const formatNaira = (amount: number) =>
	new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		maximumFractionDigits: 0,
	}).format(amount);

function parseStatementCsv(content: string): BankLine[] | null {
	const rows = content.split(/\r?\n/).filter((row) => row.trim()).map(parseCsvRow);
	const headers = rows.shift()?.map((value) => value.trim().toLowerCase());
	if (!headers?.length || !rows.length) return null;
	const findColumn = (names: string[]) => headers.findIndex((header) => names.includes(header));
	const dateColumn = findColumn(["date", "transaction date", "value date"]);
	const descriptionColumn = findColumn(["description", "narration", "details"]);
	const referenceColumn = findColumn(["reference", "transaction reference", "reference no", "ref"]);
	const amountColumn = findColumn(["amount", "transaction amount"]);
	const directionColumn = findColumn(["direction", "type"]);
	if ([dateColumn, descriptionColumn, referenceColumn, amountColumn].some((column) => column < 0)) return null;

	const imported: BankLine[] = [];
	for (const [index, row] of rows.entries()) {
		const amount = Number((row[amountColumn] ?? "").replace(/[^\d.-]/g, ""));
		const date = row[dateColumn]?.trim();
		const description = row[descriptionColumn]?.trim();
		const reference = row[referenceColumn]?.trim();
		if (!Number.isFinite(amount) || !date || !description || !reference) return null;
		const direction = row[directionColumn]?.trim().toLowerCase();
		const isDebit = direction === "debit" || direction === "dr" || amount < 0;
		imported.push({
			id: `local-${Date.now()}-${index}`,
			statementDate: date,
			valueDate: date,
			description,
			reference,
			amount: Math.abs(amount),
			direction: isDebit ? "debit" : "credit",
			status: "Unmatched",
			notes: "Imported from a local CSV preview. No external matching was performed.",
		});
	}
	return imported;
}

function parseCsvRow(line: string) {
	const values: string[] = [];
	let value = "";
	let quoted = false;
	for (let index = 0; index < line.length; index += 1) {
		const character = line[index];
		if (character === '"' && quoted && line[index + 1] === '"') {
			value += '"';
			index += 1;
		} else if (character === '"') {
			quoted = !quoted;
		} else if (character === "," && !quoted) {
			values.push(value);
			value = "";
		} else {
			value += character;
		}
	}
	values.push(value);
	return values;
}

const statusFilters: (BankLineStatus | "all")[] = [
	"all",
	"Matched",
	"Suggested match",
	"Unmatched",
	"Duplicate",
	"Excluded",
];

export default function FinanceReconciliationRoute() {
	const [lines, setLines] = useState<BankLine[]>(initialLines);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<BankLineStatus | "all">("all");
	const [selected, setSelected] = useState<BankLine | null>(null);
	const [isImportOpen, setIsImportOpen] = useState(false);

	const filtered = useMemo(() => {
		return lines.filter((l) => {
			const matchQuery =
				l.description.toLowerCase().includes(query.toLowerCase()) ||
				l.reference.toLowerCase().includes(query.toLowerCase());
			const matchStatus = statusFilter === "all" || l.status === statusFilter;
			return matchQuery && matchStatus;
		});
	}, [lines, query, statusFilter]);

	const stats = useMemo(() => {
		const total = lines.length;
		const matched = lines.filter((l) => l.status === "Matched").length;
		const suggested = lines.filter((l) => l.status === "Suggested match").length;
		const unmatched = lines.filter(
			(l) => l.status === "Unmatched" || l.status === "Duplicate"
		).length;
		return { total, matched, suggested, unmatched };
	}, [lines]);

	const handleConfirmMatch = (id: string) => {
		setLines((prev) =>
			prev.map((l) =>
				l.id === id && l.suggestedMatch
					? {
							...l,
							status: "Matched" as BankLineStatus,
							matchedReceipt: l.suggestedMatch.receiptNumber,
							notes: `${l.notes} Confirmed by finance desk.`,
						}
					: l
			)
		);
		toast.success("Match confirmed.");
		setSelected(null);
	};

	const handleExclude = (id: string) => {
		setLines((prev) =>
			prev.map((l) => (l.id === id ? { ...l, status: "Excluded" as BankLineStatus } : l))
		);
		toast.success("Line excluded from reconciliation.");
		setSelected(null);
	};

	const handleImport = async (file: File | null, source: "csv" | "mt940" | "feed" | "manual") => {
		if ((source === "csv" || source === "mt940") && !file) {
			toast.error("Choose a statement file to continue.");
			return;
		}
		if (file && source === "csv") {
			const imported = parseStatementCsv(await file.text());
			if (!imported) {
				toast.error("CSV needs date, description, reference, and amount columns.");
				return;
			}
			setLines((current) => [...imported, ...current]);
			toast.success(`${imported.length} statement lines added to this browser demo.`);
		} else if (file) {
			toast.success("Statement file selected locally. MT940 parsing is not enabled in this demo.");
		} else {
			toast.success("Local preview opened. No bank connection was made.");
		}
		setIsImportOpen(false);
	};

	return (
		<AppShell title="Bank reconciliation" eyebrow="Finance · Treasury">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Finance workspace · Treasury
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Bank reconciliation
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Import bank statements, match credits against pending receipts, resolve
						unmatched deposits, and handle reversals. Every match and exclusion is logged
						to the audit trail.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link to="/finance/payments">
						<Button variant="outline" className="border-line bg-paper text-ink">
							<ChevronLeft className="mr-1.5 size-4" /> Payment ledger
						</Button>
					</Link>
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Reconciliation report exported locally.")}
					>
						<Download className="mr-1.5 size-4" /> Export report
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsImportOpen(true)}
					>
						<Upload className="mr-1.5 size-4" /> Import statement
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Statement lines"
					value={String(stats.total)}
					detail="Most recent statement"
					tone="info"
					icon={Banknote}
				/>
				<Metric
					label="Matched"
					value={String(stats.matched)}
					detail="Reconciled to receipts"
					tone="success"
					icon={Check}
				/>
				<Metric
					label="Suggested matches"
					value={String(stats.suggested)}
					detail="Awaiting confirmation"
					tone={stats.suggested > 0 ? "warning" : "success"}
					icon={BadgeCheck}
				/>
				<Metric
					label="Unmatched / duplicate"
					value={String(stats.unmatched)}
					detail="Requires finance review"
					tone={stats.unmatched > 0 ? "critical" : "success"}
					icon={AlertTriangle}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by description or reference..."
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

				{filtered.length === 0 ? (
					<div className="p-12 text-center">
						<Banknote className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">
							No statement lines match your filters.
						</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different description, reference, or status.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[1000px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">Value date</th>
									<th className="px-4 py-3 font-medium">Description</th>
									<th className="px-4 py-3 font-medium text-right">Amount</th>
									<th className="px-4 py-3 font-medium">Suggested match</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 font-medium text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{filtered.map((l) => (
									<tr
										key={l.id}
										className={cn(
											"transition-colors hover:bg-sand/60",
											l.status === "Unmatched" && "bg-coral/5",
											l.status === "Duplicate" && "bg-coral/5"
										)}
									>
										<td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft">
											{l.valueDate}
										</td>
										<td className="px-4 py-3.5">
											<p className="text-[12px] text-ink">{l.description}</p>
											<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
												{l.reference}
											</p>
										</td>
										<td
											className={cn(
												"px-4 py-3.5 text-right font-mono text-[12px] font-semibold",
												l.direction === "credit" ? "text-teal-deep" : "text-coral"
											)}
										>
											{l.direction === "credit" ? "+" : "−"}
											{formatNaira(l.amount)}
										</td>
										<td className="px-4 py-3.5">
											{l.suggestedMatch ? (
												<div>
													<p className="font-mono text-[11px] text-ink">
														{l.suggestedMatch.receiptNumber}
													</p>
													<p className="mt-0.5 text-[11px] text-ink-soft">
														{l.suggestedMatch.customer}
													</p>
													<p className="mt-0.5 font-mono text-[10px] text-orange-deep">
														{l.suggestedMatch.confidence}% confidence
													</p>
												</div>
											) : l.matchedReceipt ? (
												<p className="font-mono text-[11px] text-teal-deep">
													{l.matchedReceipt}
												</p>
											) : (
												<p className="text-[11px] text-ink-soft">—</p>
											)}
										</td>
										<td className="px-4 py-3.5">
											<StatusBadge label={l.status} tone={statusTone(l.status)} />
										</td>
										<td className="px-4 py-3.5 text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setSelected(l)}
												className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
											>
												{l.status === "Suggested match"
													? "Review"
													: l.status === "Unmatched"
													? "Resolve"
													: "View"}{" "}
												<ArrowRight className="ml-1 size-3.5" />
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filtered.length} of {lines.length} statement lines
					</span>
					<span>Every match and exclusion is logged to the audit trail</span>
				</div>
			</section>

			<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
				<div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
					<div>
						<div className="flex items-center gap-2">
							<ShieldCheck className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								How reconciliation works
							</p>
						</div>
						<h3 className="mt-3 font-display text-xl font-bold text-ink">
							Statement lines are matched to receipts or explicitly resolved
						</h3>
						<p className="mt-2 max-w-xl text-[13px] leading-6 text-ink-soft">
							The reconciliation engine compares imported bank statement lines against
							pending receipts. High-confidence matches are suggested; low-confidence
							lines go to the exception queue for a finance officer to resolve.
						</p>
					</div>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Statement import
						</p>
						<p className="mt-3 text-[12px] leading-5 text-ink-soft">
							Statements are imported from supported bank formats or via CSV. Duplicate
							references are flagged automatically; bank charges are excluded by default.
						</p>
						<p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Supported sources
						</p>
						<ul className="mt-2 space-y-1.5 text-[12px] leading-5 text-ink-soft">
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Bank statement CSV / MT940
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Sample feed preview
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Manual entry for one-off deposits
							</li>
						</ul>
					</div>
				</div>
			</div>

			{selected && (
				<LineDetailDialog
					line={selected}
					onClose={() => setSelected(null)}
					onConfirmMatch={() => handleConfirmMatch(selected.id)}
					onExclude={() => handleExclude(selected.id)}
				/>
			)}

			{isImportOpen && <ImportModal onClose={() => setIsImportOpen(false)} onSubmit={handleImport} />}
		</AppShell>
	);
}

function LineDetailDialog({
	line,
	onClose,
	onConfirmMatch,
	onExclude,
}: {
	line: BankLine;
	onClose: () => void;
	onConfirmMatch: () => void;
	onExclude: () => void;
}) {
	const canConfirm = line.status === "Suggested match";
	const canExclude = line.status !== "Excluded";

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
							Statement line
						</p>
						<h3 className="mt-1 font-display text-xl font-bold text-ink">{line.reference}</h3>
						<p className="mt-1 text-[12px] text-ink-soft">{line.description}</p>
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
						<StatusBadge label={line.status} tone={statusTone(line.status)} />
						<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
							{line.direction === "credit" ? "Credit" : "Debit"}
						</span>
					</div>

					<div className="rounded-xl bg-sand p-5 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
							Amount
						</p>
						<p
							className={cn(
								"mt-2 font-display text-4xl font-bold",
								line.direction === "credit" ? "text-teal-deep" : "text-coral"
							)}
						>
							{line.direction === "credit" ? "+" : "−"}
							{formatNaira(line.amount)}
						</p>
					</div>

					<dl className="grid gap-4 sm:grid-cols-2">
						{[
							["Statement date", line.statementDate, true],
							["Value date", line.valueDate, true],
							["Reference", line.reference, true],
							["Direction", line.direction === "credit" ? "Inward credit" : "Outward debit"],
						].map(([label, value, mono]) => (
							<div key={label as string}>
								<dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-soft">
									{label}
								</dt>
								<dd
									className={cn(
										"mt-1 text-sm font-medium text-ink",
										mono && "font-mono"
									)}
								>
									{value}
								</dd>
							</div>
						))}
					</dl>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="text-[12px] leading-6 text-ink-soft">{line.notes}</p>
					</div>

					{line.suggestedMatch && (
						<div className="rounded-xl bg-orange/5 p-4 ring-1 ring-orange/20">
							<div className="flex items-center gap-2">
								<Link2 className="size-4 text-orange-deep" />
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-deep">
									Suggested match · {line.suggestedMatch.confidence}% confidence
								</p>
							</div>
							<dl className="mt-3 space-y-2 text-[12px]">
								<div className="flex justify-between">
									<dt className="text-ink-soft">Receipt</dt>
									<dd className="font-mono text-ink">
										{line.suggestedMatch.receiptNumber}
									</dd>
								</div>
								<div className="flex justify-between">
									<dt className="text-ink-soft">Customer</dt>
									<dd className="text-ink">{line.suggestedMatch.customer}</dd>
								</div>
								<div className="flex justify-between">
									<dt className="text-ink-soft">Invoice</dt>
									<dd className="font-mono text-ink">
										{line.suggestedMatch.invoiceRef}
									</dd>
								</div>
							</dl>
						</div>
					)}

					{line.status === "Duplicate" && (
						<div className="rounded-xl bg-coral/5 p-4 ring-1 ring-coral/20">
							<div className="flex items-start gap-3">
								<AlertTriangle className="mt-0.5 size-4 shrink-0 text-coral" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Duplicate reference detected
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										A statement line with the same reference was already reconciled.
										This line is excluded automatically unless a supervisor overrides.
									</p>
								</div>
							</div>
						</div>
					)}

					{line.status === "Unmatched" && (
						<div className="rounded-xl bg-coral/5 p-4 ring-1 ring-coral/20">
							<div className="flex items-start gap-3">
								<AlertTriangle className="mt-0.5 size-4 shrink-0 text-coral" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										No matching receipt
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										The payer and amount do not match any pending receipt. Contact the
										customer or check for a pro-forma payment before deciding.
									</p>
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line p-5 sm:p-6">
					<Button variant="ghost" onClick={onClose} className="text-ink-soft">
						Close
					</Button>
					<div className="flex flex-wrap gap-2">
						{canExclude && (
							<Button
								variant="outline"
								className="border-line bg-paper text-ink"
								onClick={onExclude}
							>
								Exclude from reconciliation
							</Button>
						)}
						{canConfirm && (
							<Button
								onClick={onConfirmMatch}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Check className="mr-1.5 size-4" /> Confirm match
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function ImportModal({
	onClose,
	onSubmit,
}: {
	onClose: () => void;
	onSubmit: (file: File | null, source: "csv" | "mt940" | "feed" | "manual") => void;
}) {
	const [source, setSource] = useState<"csv" | "mt940" | "feed" | "manual">("csv");
	const [bank, setBank] = useState("");
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if ((source === "csv" || source === "mt940") && !selectedFile) {
			toast.error("Choose a statement file to continue.");
			return;
		}
		onSubmit(selectedFile, source);
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
					<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								Import statement
							</p>
							<h3 className="mt-1 font-display text-xl font-bold text-ink">
								Import a bank statement
							</h3>
							<p className="mt-1 text-[12px] text-ink-soft">
								Select a source. Duplicate references and bank charges are handled
								automatically.
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={onClose}
							aria-label="Close dialog"
						>
							<X />
						</Button>
					</div>

					<div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Source
							</p>
							<div className="mt-3 grid gap-2 sm:grid-cols-2">
								{[
									{ key: "csv" as const, label: "CSV upload" },
									{ key: "mt940" as const, label: "MT940 file" },
									{ key: "feed" as const, label: "Sample feed preview" },
									{ key: "manual" as const, label: "Manual entry" },
								].map((s) => {
									const active = source === s.key;
									return (
										<button
											key={s.key}
											type="button"
											onClick={() => {
											setSource(s.key);
											setSelectedFile(null);
										}}
											className={cn(
												"rounded-xl border p-3 text-left text-[12px] font-medium transition-colors",
												active
													? "border-orange bg-orange/5 ring-1 ring-orange/30 text-orange-deep"
													: "border-line bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
											)}
										>
											{s.label}
										</button>
									);
								})}
							</div>
						</div>

						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Bank account
							</span>
							<Input
								value={bank}
								onChange={(e) => setBank(e.target.value)}
								placeholder="e.g. Stanbic IBTC · 0123456789"
								className="mt-2 h-11 border-line bg-sand text-ink"
							/>
						</label>

						{(source === "csv" || source === "mt940") && (
							<div className="rounded-xl border border-dashed border-line bg-sand p-6 text-center">
								<p className="mb-4 font-display text-sm font-bold text-ink">
									{source === "csv" ? "Choose a CSV statement" : "Choose an MT940 statement"}
								</p>
								<LocalFilePicker
									key={source}
									accept={source === "csv" ? ".csv" : ".sta,.txt,.mt940"}
									multiple={false}
									buttonLabel="Choose statement file"
									onFilesSelected={(files) => setSelectedFile(files[0] ?? null)}
								/>
								<a href="/demo-statement.csv" download className="mt-3 inline-block text-xs font-semibold text-orange-deep underline underline-offset-4">
									Download sample CSV
								</a>
							</div>
						)}

						{source === "feed" && (
							<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
								<div className="flex items-start gap-3">
									<Link2 className="mt-0.5 size-4 shrink-0 text-orange" />
									<div>
										<p className="text-[13px] font-semibold text-ink">
											Sample feed preview
										</p>
										<p className="mt-1 text-[12px] leading-5 text-ink-soft">
											Uses only the example statement records already shown in this screen.
											No bank connection is made.
										</p>
									</div>
								</div>
							</div>
						)}

						{(source === "manual" || source === "feed") && (
							<div className="grid gap-3 sm:grid-cols-2">
								<label className="block">
									<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										From date
									</span>
									<Input
										type="date"
										value={fromDate}
										onChange={(e) => setFromDate(e.target.value)}
										className="mt-2 h-11 border-line bg-sand font-mono text-ink"
									/>
								</label>
								<label className="block">
									<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										To date
									</span>
									<Input
										type="date"
										value={toDate}
										onChange={(e) => setToDate(e.target.value)}
										className="mt-2 h-11 border-line bg-sand font-mono text-ink"
									/>
								</label>
							</div>
						)}

						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<div className="flex items-start gap-3">
								<History className="mt-0.5 size-4 shrink-0 text-orange" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										What happens on import
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										Duplicate references are flagged. Bank charges are excluded by
										default. High-confidence matches are suggested for confirmation;
										the rest are queued for exception review.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-between gap-3 border-t border-line p-5 sm:p-6">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							className="text-ink-soft"
						>
							Cancel
						</Button>
						<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
							Import statement <ArrowRight />
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}