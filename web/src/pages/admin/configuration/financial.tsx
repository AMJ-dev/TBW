import { useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	BadgeDollarSign,
	CircleDollarSign,
	Clock,
	Coins,
	CreditCard,
	Landmark,
	Percent,
	Save,
	ShieldCheck,
	TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FinancialConfig {
	baseCurrency: string;
	fxEnabled: boolean;
	fxSource: string;
	fxRate: number;
	vatRate: number;
	vatAppliesTo: string;
	discountThreshold: number;
	waiverThreshold: number;
	creditNoteThreshold: number;
	dualApprovalRequired: boolean;
	clearanceGateEnforced: boolean;
	allowApprovedCredit: boolean;
	allowWaiver: boolean;
	autoBlockOnExposure: boolean;
	defaultCreditTermsDays: number;
	dunningIntervalDays: number;
}

const initialConfig: FinancialConfig = {
	baseCurrency: "NGN",
	fxEnabled: false,
	fxSource: "",
	fxRate: 0,
	vatRate: 7.5,
	vatAppliesTo: "All taxable services",
	discountThreshold: 500000,
	waiverThreshold: 250000,
	creditNoteThreshold: 100000,
	dualApprovalRequired: true,
	clearanceGateEnforced: true,
	allowApprovedCredit: true,
	allowWaiver: false,
	autoBlockOnExposure: true,
	defaultCreditTermsDays: 30,
	dunningIntervalDays: 7,
};

export default function AdminFinancialConfigurationPage() {
	const [config, setConfig] = useState<FinancialConfig>(initialConfig);
	const [dirty, setDirty] = useState(false);

	const markDirty = () => setDirty(true);

	const update = <K extends keyof FinancialConfig>(
		key: K,
		value: FinancialConfig[K]
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		markDirty();
	};

	const handleSave = () => {
		if (config.fxEnabled && (!config.fxSource.trim() || config.fxRate <= 0)) {
			toast.error(
				"When FX is enabled, provide a conversion source and a positive rate."
			);
			return;
		}
		if (config.vatRate < 0 || config.vatRate > 100) {
			toast.error("VAT rate must be between 0 and 100.");
			return;
		}
		toast.success("Financial configuration saved. Change logged.");
		setDirty(false);
	};

	const handleDiscard = () => {
		setConfig(initialConfig);
		setDirty(false);
		toast.message("Changes discarded.");
	};

	return (
		<AppShell
			title="Financial Rules"
			eyebrow="Administration · Configuration"
		>
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div className="min-w-0">
					<Link
						to="/admin/configuration"
						className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-orange"
					>
						<ArrowLeft className="size-3.5" />
						Back to configuration
					</Link>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Financial Rules
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Configure currency, tax behaviour, approval thresholds, credit
						controls, and financial clearance rules. Rate changes, overrides,
						waivers, and adjustments are immutably logged.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{dirty && <StatusBadge label="Unsaved changes" tone="warning" />}
					<Button
						type="button"
						variant="outline"
						onClick={handleDiscard}
						disabled={!dirty}
						className="border-line bg-paper text-ink hover:bg-sand disabled:opacity-60"
					>
						Discard
					</Button>
					<Button
						type="button"
						onClick={handleSave}
						disabled={!dirty}
						className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
					>
						<Save className="size-4" />
						Save changes
					</Button>
				</div>
			</div>

			<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
						<ShieldCheck className="size-5" />
					</div>
					<div className="min-w-0">
						<p className="text-sm font-semibold text-ink">
							Dual approval and audit
						</p>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Thresholds below require a second approver when the value is
							exceeded. Every override, waiver, and adjustment is logged with
							actor, prior value, and reason. No cardholder data is stored on
							platform-controlled systems; payments use gateway-hosted flows
							with signed webhooks and idempotency.
						</p>
					</div>
				</div>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Currency
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Base currency is used for all invoices and reporting. Optional
						foreign-currency display requires a documented conversion source and
						rate.
					</p>
				</div>
				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<label className="block">
						<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							<CircleDollarSign className="size-3.5 text-orange" />
							Base currency
						</span>
						<select
							value={config.baseCurrency}
							onChange={(e) => update("baseCurrency", e.target.value)}
							className="mt-1.5 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
						>
							<option value="NGN">NGN — Nigerian Naira</option>
							<option value="USD">USD — US Dollar</option>
							<option value="GBP">GBP — Pound Sterling</option>
							<option value="EUR">EUR — Euro</option>
						</select>
					</label>

					<div className="flex items-end">
						<label className="inline-flex items-center gap-2 text-[13px] text-ink">
							<input
								type="checkbox"
								checked={config.fxEnabled}
								onChange={(e) => update("fxEnabled", e.target.checked)}
								className="size-4 accent-orange"
							/>
							Enable foreign-currency display
						</label>
					</div>

					{config.fxEnabled && (
						<>
							<Field
								label="FX conversion source"
								icon={Landmark}
								value={config.fxSource}
								onChange={(v) => update("fxSource", v)}
								placeholder="e.g. CBN official rate"
							/>
							<Field
								label="FX rate"
								icon={TrendingUp}
								value={String(config.fxRate)}
								onChange={(v) => update("fxRate", Number(v) || 0)}
								placeholder="e.g. 1550"
								mono
							/>
						</>
					)}
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Tax
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Default VAT rate and scope. Per-service tax configuration lives in
						the tariff schedule.
					</p>
				</div>
				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<NumberField
						label="VAT rate"
						icon={Percent}
						unit="%"
						value={config.vatRate}
						onChange={(v) => update("vatRate", v)}
					/>
					<Field
						label="VAT applies to"
						icon={Coins}
						value={config.vatAppliesTo}
						onChange={(v) => update("vatAppliesTo", v)}
						placeholder="e.g. All taxable services"
					/>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Approval Thresholds
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Values above these thresholds require a second approver. Set to 0 to
						require dual approval for any amount.
					</p>
				</div>
				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<NumberField
						label="Discount threshold"
						icon={BadgeDollarSign}
						unit={config.baseCurrency}
						value={config.discountThreshold}
						onChange={(v) => update("discountThreshold", v)}
					/>
					<NumberField
						label="Waiver threshold"
						icon={BadgeDollarSign}
						unit={config.baseCurrency}
						value={config.waiverThreshold}
						onChange={(v) => update("waiverThreshold", v)}
					/>
					<NumberField
						label="Credit note threshold"
						icon={BadgeDollarSign}
						unit={config.baseCurrency}
						value={config.creditNoteThreshold}
						onChange={(v) => update("creditNoteThreshold", v)}
					/>
					<div className="flex items-end">
						<label className="inline-flex items-center gap-2 text-[13px] text-ink">
							<input
								type="checkbox"
								checked={config.dualApprovalRequired}
								onChange={(e) =>
									update("dualApprovalRequired", e.target.checked)
								}
								className="size-4 accent-orange"
							/>
							Require dual approval above thresholds
						</label>
					</div>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Financial Clearance
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Clearance is consumed by release authorisation and gate-out. Blocked
						clearance prevents the release transition from completing.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<RuleRow
						icon={ShieldCheck}
						label="Enforce financial clearance gate"
						desc="Block release until charges are settled or credit/waiver is approved."
						on={config.clearanceGateEnforced}
						onToggle={() =>
							update("clearanceGateEnforced", !config.clearanceGateEnforced)
						}
					/>
					<RuleRow
						icon={CreditCard}
						label="Allow approved credit at gate"
						desc="Permit release against an approved credit limit."
						on={config.allowApprovedCredit}
						onToggle={() =>
							update("allowApprovedCredit", !config.allowApprovedCredit)
						}
					/>
					<RuleRow
						icon={BadgeDollarSign}
						label="Allow waiver at gate"
						desc="Permit release against an approved waiver."
						on={config.allowWaiver}
						onToggle={() => update("allowWaiver", !config.allowWaiver)}
					/>
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Credit Controls
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Default credit terms and exposure controls. Per-customer limits are
						set on the customer account.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<RuleRow
						icon={AlertTriangle}
						label="Auto-block on exposure exceeded"
						desc="Prevent new chargeable events when a customer is over limit."
						on={config.autoBlockOnExposure}
						onToggle={() =>
							update("autoBlockOnExposure", !config.autoBlockOnExposure)
						}
					/>
					<div className="flex flex-wrap items-start justify-between gap-4 p-5">
						<div className="flex min-w-[240px] flex-1 items-start gap-3">
							<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
								<Clock className="size-4" />
							</div>
							<div className="min-w-0">
								<p className="text-[13px] font-semibold text-ink">
									Default credit terms
								</p>
								<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
									Default days until invoice due for credit accounts.
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Input
								value={String(config.defaultCreditTermsDays)}
								onChange={(e) =>
									update(
										"defaultCreditTermsDays",
										Number(e.target.value) || 0
									)
								}
								className="h-9 w-24 border-line bg-sand font-mono text-sm text-ink"
							/>
							<span className="font-mono text-[11px] text-ink-soft">days</span>
						</div>
					</div>
					<div className="flex flex-wrap items-start justify-between gap-4 p-5">
						<div className="flex min-w-[240px] flex-1 items-start gap-3">
							<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
								<Clock className="size-4" />
							</div>
							<div className="min-w-0">
								<p className="text-[13px] font-semibold text-ink">
									Dunning interval
								</p>
								<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
									Days between reminder dispatches for overdue invoices.
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Input
								value={String(config.dunningIntervalDays)}
								onChange={(e) =>
									update(
										"dunningIntervalDays",
										Number(e.target.value) || 0
									)
								}
								className="h-9 w-24 border-line bg-sand font-mono text-sm text-ink"
							/>
							<span className="font-mono text-[11px] text-ink-soft">days</span>
						</div>
					</div>
				</ul>
			</section>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							Financial rules are effective-dated
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Changes take effect on new chargeable events. Existing invoices,
							receipts, and tariff lines retain the rate and rule version in
							force at the time of the event. Reverting a rate does not
							retroactively alter already-issued documents.
						</p>
					</div>
				</div>
			</div>
		</AppShell>
	);
}

function Field({
	label,
	value,
	onChange,
	placeholder,
	icon: Icon,
	mono,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	icon: typeof Landmark;
	mono?: boolean;
}) {
	return (
		<label className="block">
			<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				<Icon className="size-3.5 text-orange" />
				{label}
			</span>
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={cn(
					"mt-1.5 h-11 border-line bg-sand text-ink",
					mono && "font-mono"
				)}
			/>
		</label>
	);
}

function NumberField({
	label,
	icon: Icon,
	unit,
	value,
	onChange,
}: {
	label: string;
	icon: typeof BadgeDollarSign;
	unit: string;
	value: number;
	onChange: (value: number) => void;
}) {
	return (
		<label className="block">
			<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				<Icon className="size-3.5 text-orange" />
				{label}
			</span>
			<div className="mt-1.5 flex items-center gap-2">
				<Input
					value={String(value)}
					onChange={(e) => onChange(Number(e.target.value) || 0)}
					className="h-11 w-40 border-line bg-sand font-mono text-sm text-ink"
				/>
				<span className="font-mono text-[11px] text-ink-soft">{unit}</span>
			</div>
		</label>
	);
}

function RuleRow({
	icon: Icon,
	label,
	desc,
	on,
	onToggle,
}: {
	icon: typeof ShieldCheck;
	label: string;
	desc: string;
	on: boolean;
	onToggle: () => void;
}) {
	return (
		<li className="flex flex-wrap items-start justify-between gap-4 p-5">
			<div className="flex min-w-[240px] flex-1 items-start gap-3">
				<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
					<Icon className="size-4" />
				</div>
				<div className="min-w-0">
					<p className="text-[13px] font-semibold text-ink">{label}</p>
					<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">{desc}</p>
				</div>
			</div>
			<button
				type="button"
				onClick={onToggle}
				aria-pressed={on}
				className={cn(
					"inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
					on ? "bg-orange" : "bg-sand-2"
				)}
			>
				<span
					className={cn(
						"size-5 rounded-full bg-white shadow-sm transition-transform",
						on ? "translate-x-5" : "translate-x-0.5"
					)}
				/>
			</button>
		</li>
	);
}