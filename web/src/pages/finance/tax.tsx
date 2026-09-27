import { useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	BadgeCheck,
	Calculator,
	Check,
	ChevronLeft,
	Clock3,
	FileText,
	History,
	Percent,
	Plus,
	Search,
	ShieldCheck,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TaxKind = "VAT" | "Withholding" | "Levy" | "Service charge";
type TaxStatus = "Active" | "Draft" | "Superseded" | "Retired";


interface TaxRule {
	id: string;
	code: string;
	name: string;
	kind: TaxKind;
	rate: number;
	appliesTo: string;
	effectiveFrom: string;
	effectiveTo: string;
	status: TaxStatus;
	regulator?: string | undefined;
	notes: string;
	createdBy: string;
	lastUpdatedAt: string;
}
const initialRules: TaxRule[] = [
	{
		id: "tax-1",
		code: "VAT-STD-75",
		name: "VAT · Standard rate",
		kind: "VAT",
		rate: 7.5,
		appliesTo: "All taxable services (excluding exempt categories)",
		effectiveFrom: "01 Jan 2026",
		effectiveTo: "—",
		status: "Active",
		regulator: "FIRS",
		notes: "Standard VAT rate under the Nigeria Tax Act.",
		createdBy: "D. Okafor · Operations Manager",
		lastUpdatedAt: "01 Jan 2026",
	},
	{
		id: "tax-2",
		code: "VAT-EXM-00",
		name: "VAT · Exempt examination coordination",
		kind: "VAT",
		rate: 0,
		appliesTo: "Examination coordination services under Tariff line EXM-COR-03",
		effectiveFrom: "01 Jan 2026",
		effectiveTo: "—",
		status: "Active",
		notes: "Zero-rated treatment for coordination-only services. Applied where the service is pass-through.",
		createdBy: "D. Okafor · Operations Manager",
		lastUpdatedAt: "01 Jan 2026",
	},
	{
		id: "tax-3",
		code: "WHT-5-STD",
		name: "Withholding tax · Standard",
		kind: "Withholding",
		rate: 5,
		appliesTo: "Applicable vendor and contractor payments",
		effectiveFrom: "01 Jan 2026",
		effectiveTo: "—",
		status: "Active",
		regulator: "FIRS",
		notes: "Standard withholding rate applied to qualifying payments.",
		createdBy: "M. Adeyemi · Finance Officer",
		lastUpdatedAt: "01 Jan 2026",
	},
	{
		id: "tax-4",
		code: "LEV-NSC-03",
		name: "Nigerian Shippers' Council levy",
		kind: "Levy",
		rate: 3,
		appliesTo: "Applicable cargo handling services under the published tariff",
		effectiveFrom: "01 Jan 2026",
		effectiveTo: "—",
		status: "Active",
		regulator: "NSC",
		notes: "Statutory levy applied to the designated services per NSC schedule.",
		createdBy: "M. Adeyemi · Finance Officer",
		lastUpdatedAt: "01 Jan 2026",
	},
	{
		id: "tax-5",
		code: "LEV-ETLS-05",
		name: "ETLS levy · Temporary",
		kind: "Levy",
		rate: 0.5,
		appliesTo: "Applicable import-related handling services",
		effectiveFrom: "01 Apr 2026",
		effectiveTo: "30 Sep 2026",
		status: "Superseded",
		regulator: "FIRS",
		notes: "Historical ETLS treatment. Superseded by the current levy schedule from 01 Oct 2026.",
		createdBy: "D. Okafor · Operations Manager",
		lastUpdatedAt: "30 Sep 2026",
	},
	{
		id: "tax-6",
		code: "SVC-INS-15",
		name: "Insurance handling surcharge",
		kind: "Service charge",
		rate: 1.5,
		appliesTo: "Insurance coordination and documentation handling",
		effectiveFrom: "15 Oct 2026",
		effectiveTo: "—",
		status: "Draft",
		notes: "Pending finance review before activation.",
		createdBy: "M. Adeyemi · Finance Officer",
		lastUpdatedAt: "22 Sep 2026",
	},
];

const kindFilters: (TaxKind | "all")[] = ["all", "VAT", "Withholding", "Levy", "Service charge"];
const statusFilters: (TaxStatus | "all")[] = ["all", "Active", "Draft", "Superseded", "Retired"];

const formatRate = (rate: number) => `${rate}%`;

export default function FinanceTaxRoute() {
	const [rules, setRules] = useState<TaxRule[]>(initialRules);
	const [query, setQuery] = useState("");
	const [kindFilter, setKindFilter] = useState<TaxKind | "all">("all");
	const [statusFilter, setStatusFilter] = useState<TaxStatus | "all">("all");
	const [selected, setSelected] = useState<TaxRule | null>(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isSimulateOpen, setIsSimulateOpen] = useState(false);

	const filtered = useMemo(() => {
		return rules.filter((r) => {
			const matchQuery =
				r.code.toLowerCase().includes(query.toLowerCase()) ||
				r.name.toLowerCase().includes(query.toLowerCase()) ||
				r.appliesTo.toLowerCase().includes(query.toLowerCase());
			const matchKind = kindFilter === "all" || r.kind === kindFilter;
			const matchStatus = statusFilter === "all" || r.status === statusFilter;
			return matchQuery && matchKind && matchStatus;
		});
	}, [rules, query, kindFilter, statusFilter]);

	const stats = useMemo(() => {
		const total = rules.length;
		const active = rules.filter((r) => r.status === "Active").length;
		const draft = rules.filter((r) => r.status === "Draft").length;
		const superseded = rules.filter(
			(r) => r.status === "Superseded" || r.status === "Retired"
		).length;
		return { total, active, draft, superseded };
	}, [rules]);

	const handleCreate = (next: TaxRule) => {
		setRules((prev) => [next, ...prev]);
		setIsCreateOpen(false);
		toast.success("Tax rule created locally.");
	};

	const handleActivate = (id: string) => {
		setRules((prev) =>
			prev.map((r) => (r.id === id ? { ...r, status: "Active" as TaxStatus } : r))
		);
		toast.success("Tax rule activated.");
		setSelected(null);
	};

	const handleSupersede = (id: string) => {
		setRules((prev) =>
			prev.map((r) => (r.id === id ? { ...r, status: "Superseded" as TaxStatus } : r))
		);
		toast.success("Tax rule marked as superseded.");
		setSelected(null);
	};

	return (
		<AppShell title="Tax configuration" eyebrow="Finance · Tax & levies">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Finance workspace · Tax & levies
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Tax configuration
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Effective-dated tax, VAT, levy, and service-charge rules applied to invoices.
						Historical rates are preserved for audit; changes create a new effective-dated
						rule rather than editing the old one.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => setIsSimulateOpen(true)}
					>
						<Calculator className="mr-1.5 size-4" /> Simulate an invoice
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsCreateOpen(true)}
					>
						<Plus className="mr-1.5 size-4" /> New tax rule
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total rules"
					value={String(stats.total)}
					detail="All effective dates"
					tone="info"
					icon={FileText}
				/>
				<Metric
					label="Active"
					value={String(stats.active)}
					detail="Currently applying to invoices"
					tone="success"
					icon={Check}
				/>
				<Metric
					label="Draft"
					value={String(stats.draft)}
					detail="Awaiting activation"
					tone={stats.draft > 0 ? "warning" : "success"}
					icon={Clock3}
				/>
				<Metric
					label="Superseded / retired"
					value={String(stats.superseded)}
					detail="Historical, retained for audit"
					tone="neutral"
					icon={History}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by code, name, or scope..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
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
				</div>

				<div className="flex flex-wrap items-center gap-2 border-b border-line bg-sand/20 px-4 py-2">
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
							{s === "all" ? "All statuses" : s}
						</button>
					))}
				</div>

				{filtered.length === 0 ? (
					<div className="p-12 text-center">
						<Percent className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">No tax rules match your filters.</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different code, kind, or status.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[1000px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">Code / name</th>
									<th className="px-4 py-3 font-medium">Kind</th>
									<th className="px-4 py-3 font-medium text-right">Rate</th>
									<th className="px-4 py-3 font-medium">Applies to</th>
									<th className="px-4 py-3 font-medium">Effective</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 font-medium text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{filtered.map((r) => (
									<tr
										key={r.id}
										className={cn(
											"transition-colors hover:bg-sand/60",
											r.status === "Draft" && "bg-orange/5"
										)}
									>
										<td className="px-4 py-3.5">
											<p className="font-mono text-[12px] font-semibold text-ink">
												{r.code}
											</p>
											<p className="mt-0.5 text-[12px] text-ink-soft">{r.name}</p>
										</td>
										<td className="px-4 py-3.5">
											<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
												{r.kind}
											</span>
										</td>
										<td className="px-4 py-3.5 text-right font-mono text-[13px] font-bold text-ink">
											{formatRate(r.rate)}
										</td>
										<td className="px-4 py-3.5 text-[12px] text-ink-soft">
											{r.appliesTo}
										</td>
										<td className="px-4 py-3.5">
											<p className="font-mono text-[11px] text-ink">
												{r.effectiveFrom}
											</p>
											<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
												{r.effectiveTo === "—" ? "No end date" : `To ${r.effectiveTo}`}
											</p>
										</td>
										<td className="px-4 py-3.5">
											<StatusBadge label={r.status} tone={statusTone(r.status)} />
										</td>
										<td className="px-4 py-3.5 text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setSelected(r)}
												className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
											>
												{r.status === "Draft" ? "Review" : "View"}{" "}
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
						Showing {filtered.length} of {rules.length} tax rules
					</span>
					<span>Historical rates are never edited — new effective-dated rules supersede them</span>
				</div>
			</section>

			<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
				<div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
					<div>
						<div className="flex items-center gap-2">
							<ShieldCheck className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								How tax rules work
							</p>
						</div>
						<h3 className="mt-3 font-display text-xl font-bold text-ink">
							Effective-dated, never edited in place
						</h3>
						<p className="mt-2 max-w-xl text-[13px] leading-6 text-ink-soft">
							Tax rules are never edited after they have been applied to an invoice. A new
							effective-dated rule supersedes the old one. This keeps the historical
							calculation of every invoice reproducible for audit.
						</p>
					</div>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Rule lifecycle
						</p>
						<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange" />
								<strong className="text-ink">Draft</strong> · under review, not applied
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal" />
								<strong className="text-ink">Active</strong> · applied to matching invoices
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-soft/40" />
								<strong className="text-ink">Superseded</strong> · replaced, kept for audit
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-soft/40" />
								<strong className="text-ink">Retired</strong> · no longer relevant, retained
							</li>
						</ul>
					</div>
				</div>
			</div>

			{selected && (
				<TaxRuleDetailDialog
					rule={selected}
					onClose={() => setSelected(null)}
					onActivate={() => handleActivate(selected.id)}
					onSupersede={() => handleSupersede(selected.id)}
				/>
			)}

			{isCreateOpen && (
				<NewTaxRuleModal
					onClose={() => setIsCreateOpen(false)}
					onSubmit={handleCreate}
				/>
			)}

			{isSimulateOpen && (
				<SimulateModal onClose={() => setIsSimulateOpen(false)} rules={rules} />
			)}
		</AppShell>
	);
}

function TaxRuleDetailDialog({
	rule,
	onClose,
	onActivate,
	onSupersede,
}: {
	rule: TaxRule;
	onClose: () => void;
	onActivate: () => void;
	onSupersede: () => void;
}) {
	const canActivate = rule.status === "Draft";
	const canSupersede = rule.status === "Active";

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
							Tax rule
						</p>
						<h3 className="mt-1 font-display text-xl font-bold text-ink">{rule.code}</h3>
						<p className="mt-1 text-[12px] text-ink-soft">{rule.name}</p>
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
						<StatusBadge label={rule.status} tone={statusTone(rule.status)} />
						<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
							{rule.kind}
						</span>
						{rule.regulator && (
							<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
								{rule.regulator}
							</span>
						)}
					</div>

					<div className="rounded-xl bg-sand p-5 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
							Rate
						</p>
						<p className="mt-2 font-display text-4xl font-bold text-ink">
							{formatRate(rule.rate)}
						</p>
						<p className="mt-1 text-[12px] text-ink-soft">{rule.appliesTo}</p>
					</div>

					<dl className="grid gap-4 sm:grid-cols-2">
						{[
							["Code", rule.code, true],
							["Name", rule.name],
							["Kind", rule.kind],
							["Regulator", rule.regulator ?? "—"],
							["Effective from", rule.effectiveFrom, true],
							["Effective to", rule.effectiveTo, true],
							["Created by", rule.createdBy],
							["Last updated", rule.lastUpdatedAt, true],
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
						<p className="text-[12px] leading-6 text-ink-soft">{rule.notes}</p>
					</div>

					{rule.status === "Draft" && (
						<div className="rounded-xl bg-orange/5 p-4 ring-1 ring-orange/20">
							<div className="flex items-start gap-3">
								<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Draft rule not yet active
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										This rule is not applied to invoices until it is activated. Activating
										records the reviewer and timestamp to the audit trail.
									</p>
								</div>
							</div>
						</div>
					)}

					{rule.status === "Active" && (
						<div className="rounded-xl bg-teal/5 p-4 ring-1 ring-teal/20">
							<div className="flex items-start gap-3">
								<BadgeCheck className="mt-0.5 size-4 shrink-0 text-teal-deep" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Currently applied to matching invoices
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										When a rate changes, a new effective-dated rule supersedes this one.
										The historical rate is preserved for audit.
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
						{canSupersede && (
							<Button
								variant="outline"
								className="border-line bg-paper text-ink"
								onClick={onSupersede}
							>
								Mark as superseded
							</Button>
						)}
						{canActivate && (
							<Button
								onClick={onActivate}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Check className="mr-1.5 size-4" /> Activate rule
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function NewTaxRuleModal({
	onClose,
	onSubmit,
}: {
	onClose: () => void;
	onSubmit: (rule: TaxRule) => void;
}) {
	const [code, setCode] = useState("");
	const [name, setName] = useState("");
	const [kind, setKind] = useState<TaxKind>("VAT");
	const [rate, setRate] = useState("");
	const [appliesTo, setAppliesTo] = useState("");
	const [effectiveFrom, setEffectiveFrom] = useState("");
	const [effectiveTo, setEffectiveTo] = useState("");
	const [regulator, setRegulator] = useState("");
	const [notes, setNotes] = useState("");

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!code.trim() || !name.trim() || !rate.trim() || !effectiveFrom.trim()) {
			toast.error("Code, name, rate, and effective-from date are required.");
			return;
		}
		const parsedRate = parseFloat(rate.replace("%", ""));
		if (isNaN(parsedRate) || parsedRate < 0) {
			toast.error("Enter a valid rate.");
			return;
		}
		onSubmit({
			id: `tax-${Date.now()}`,
			code: code.toUpperCase(),
			name,
			kind,
			rate: parsedRate,
			appliesTo: appliesTo || "To be specified",
			effectiveFrom,
			effectiveTo: effectiveTo || "—",
			status: "Draft",
			regulator: regulator || undefined,
			notes: notes || "New tax rule created from the finance console.",
			createdBy: "D. Okafor · Operations Manager",
			lastUpdatedAt: new Date().toLocaleDateString("en-GB", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			}),
		});
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
					<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								New tax rule
							</p>
							<h3 className="mt-1 font-display text-xl font-bold text-ink">
								Create a tax or levy rule
							</h3>
							<p className="mt-1 text-[12px] text-ink-soft">
								Rules start as drafts and are activated after review.
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
						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Code"
								placeholder="VAT-STD-75"
								value={code}
								onChange={setCode}
								mono
								required
							/>
							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Kind
								</span>
								<select
									value={kind}
									onChange={(e) => setKind(e.target.value as TaxKind)}
									className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none"
								>
									<option value="VAT">VAT</option>
									<option value="Withholding">Withholding</option>
									<option value="Levy">Levy</option>
									<option value="Service charge">Service charge</option>
								</select>
							</label>
						</div>

						<Field
							label="Name"
							placeholder="VAT · Standard rate"
							value={name}
							onChange={setName}
							required
						/>

						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Rate (%)"
								placeholder="7.5"
								value={rate}
								onChange={setRate}
								mono
								required
							/>
							<Field
								label="Regulator (optional)"
								placeholder="FIRS"
								value={regulator}
								onChange={setRegulator}
							/>
						</div>

						<Field
							label="Applies to"
							placeholder="Which services or tariff lines does this apply to?"
							value={appliesTo}
							onChange={setAppliesTo}
						/>

						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Effective from"
								placeholder="01 Jan 2026"
								value={effectiveFrom}
								onChange={setEffectiveFrom}
								required
							/>
							<Field
								label="Effective to (optional)"
								placeholder="Leave blank for open-ended"
								value={effectiveTo}
								onChange={setEffectiveTo}
							/>
						</div>

						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Notes
							</span>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder="Source of the rate, reasoning, or regulatory basis."
							/>
						</label>

						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<div className="flex items-start gap-3">
								<History className="mt-0.5 size-4 shrink-0 text-orange" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Effective-dated rule
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										Once activated, this rule applies to invoices dated on or after the
										effective-from date. Historical invoices keep the rule that was
										active at their date.
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
							Create draft rule <ArrowRight />
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

function SimulateModal({
	onClose,
	rules,
}: {
	onClose: () => void;
	rules: TaxRule[];
}) {
	const [amount, setAmount] = useState("1000000");
	const [selectedCodes, setSelectedCodes] = useState<string[]>(["VAT-STD-75"]);

	const activeRules = rules.filter((r) => r.status === "Active");

	const toggle = (code: string) => {
		setSelectedCodes((prev) =>
			prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
		);
	};

	const parsedAmount = parseFloat(amount.replace(/,/g, "")) || 0;

	const lines = selectedCodes
		.map((code) => activeRules.find((r) => r.code === code))
		.filter(Boolean) as TaxRule[];

	const totalRate = lines.reduce((sum, r) => sum + r.rate, 0);
	const totalTax = Math.round((parsedAmount * totalRate) / 100);
	const total = parsedAmount + totalTax;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
			role="dialog"
			aria-modal="true"
		>
			<div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
							Simulate an invoice
						</p>
						<h3 className="mt-1 font-display text-xl font-bold text-ink">
							Tax breakdown preview
						</h3>
						<p className="mt-1 text-[12px] text-ink-soft">
							Preview how the current active rules would apply to an invoice amount.
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

				<div className="max-h-[70vh] space-y-5 overflow-y-auto p-5 sm:p-6">
					<Field
						label="Invoice amount (NGN)"
						placeholder="1000000"
						value={amount}
						onChange={setAmount}
						mono
					/>

					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Active rules to apply
						</p>
						<div className="mt-3 space-y-2">
							{activeRules.map((r) => {
								const active = selectedCodes.includes(r.code);
								return (
									<label
										key={r.id}
										className="flex cursor-pointer items-center gap-3 rounded-xl bg-sand px-3 py-2.5 ring-1 ring-line transition-colors hover:bg-sand-2"
									>
										<input
											type="checkbox"
											checked={active}
											onChange={() => toggle(r.code)}
											className="size-4 rounded border-line accent-orange"
										/>
										<div className="min-w-0 flex-1">
											<p className="text-[12px] font-semibold text-ink">{r.name}</p>
											<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
												{r.code} · {r.appliesTo}
											</p>
										</div>
										<span className="font-mono text-[12px] font-bold text-ink">
											{formatRate(r.rate)}
										</span>
									</label>
								);
							})}
						</div>
					</div>

					<div className="rounded-xl bg-sand p-5 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Preview
						</p>
						<dl className="mt-3 space-y-2 text-[13px]">
							<div className="flex justify-between">
								<dt className="text-ink-soft">Invoice amount</dt>
								<dd className="font-mono text-ink">
									{new Intl.NumberFormat("en-NG", {
										style: "currency",
										currency: "NGN",
										maximumFractionDigits: 0,
									}).format(parsedAmount)}
								</dd>
							</div>
							{lines.map((r) => (
								<div className="flex justify-between" key={r.id}>
									<dt className="text-ink-soft">
										{r.name} ({formatRate(r.rate)})
									</dt>
									<dd className="font-mono text-ink">
										{new Intl.NumberFormat("en-NG", {
											style: "currency",
											currency: "NGN",
											maximumFractionDigits: 0,
										}).format(Math.round((parsedAmount * r.rate) / 100))}
									</dd>
								</div>
							))}
							<div className="flex justify-between border-t border-line pt-2">
								<dt className="font-semibold text-ink">Total tax</dt>
								<dd className="font-mono font-semibold text-orange-deep">
									{new Intl.NumberFormat("en-NG", {
										style: "currency",
										currency: "NGN",
										maximumFractionDigits: 0,
									}).format(totalTax)}
								</dd>
							</div>
							<div className="flex justify-between border-t border-line pt-2">
								<dt className="font-semibold text-ink">Invoice total</dt>
								<dd className="font-mono text-[15px] font-bold text-ink">
									{new Intl.NumberFormat("en-NG", {
										style: "currency",
										currency: "NGN",
										maximumFractionDigits: 0,
									}).format(total)}
								</dd>
							</div>
						</dl>
					</div>
				</div>

				<div className="flex justify-end gap-2 border-t border-line p-5 sm:p-6">
					<Button variant="outline" onClick={onClose} className="border-line bg-paper text-ink">
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}

function Field({
	label,
	placeholder,
	value,
	onChange,
	type = "text",
	mono,
	required,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	mono?: boolean;
	required?: boolean;
}) {
	return (
		<label className="block">
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
				{required && <span className="text-coral"> *</span>}
			</span>
			<Input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={cn(
					"mt-2 h-11 border-line bg-sand text-ink",
					mono && "font-mono"
				)}
			/>
		</label>
	);
}