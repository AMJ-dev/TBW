import { useEffect, useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	BadgeDollarSign,
	Clock,
	CreditCard,
	Percent,
	Save,
	ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

interface FinancialConfig {
	baseCurrency: string;
	vatRate: number;
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

const emptyConfig: FinancialConfig = {
	baseCurrency: "NGN",
	vatRate: 7.5,
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
	const [config, setConfig] = useState<FinancialConfig>(emptyConfig);
	const [savedConfig, setSavedConfig] = useState<FinancialConfig>(emptyConfig);
	const [changeReason, setChangeReason] = useState("");
	const [dirty, setDirty] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const fetchAll = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("/admin/config/financial/");
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load financial configuration.");
				return;
			}
			const payload: any = resp.code ?? {};

			const loaded: FinancialConfig = {
				baseCurrency:
					payload.base_currency ?? payload.baseCurrency ?? "NGN",
				vatRate: Number(payload.vat_rate ?? payload.vatRate ?? 7.5),
				discountThreshold: Number(
					payload.discount_threshold ?? payload.discountThreshold ?? 0
				),
				waiverThreshold: Number(
					payload.waiver_threshold ?? payload.waiverThreshold ?? 0
				),
				creditNoteThreshold: Number(
					payload.credit_note_threshold ??
						payload.creditNoteThreshold ??
						0
				),
				dualApprovalRequired: Boolean(
					payload.dual_approval_required ??
						payload.dualApprovalRequired ??
						true
				),
				clearanceGateEnforced: Boolean(
					payload.clearance_gate_enforced ??
						payload.clearanceGateEnforced ??
						true
				),
				allowApprovedCredit: Boolean(
					payload.allow_approved_credit ??
						payload.allowApprovedCredit ??
						true
				),
				allowWaiver: Boolean(
					payload.allow_waiver ?? payload.allowWaiver ?? false
				),
				autoBlockOnExposure: Boolean(
					payload.auto_block_on_exposure ??
						payload.autoBlockOnExposure ??
						true
				),
				defaultCreditTermsDays: Number(
					payload.default_credit_terms_days ??
						payload.defaultCreditTermsDays ??
						30
				),
				dunningIntervalDays: Number(
					payload.dunning_interval_days ??
						payload.dunningIntervalDays ??
						7
				),
			};

			setConfig(loaded);
			setSavedConfig(loaded);
			setChangeReason("");
			setDirty(false);
		} catch (err: any) {
			setError(
				err?.response?.data?.message ||
					"Could not load financial configuration."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const update = <K extends keyof FinancialConfig>(
		key: K,
		value: FinancialConfig[K]
	) => {
		setConfig((previous) => {
			const next = { ...previous, [key]: value };
			setDirty(JSON.stringify(next) !== JSON.stringify(savedConfig));
			return next;
		});
	};

	const validate = () => {
		if (
			!Number.isFinite(config.vatRate) ||
			config.vatRate < 0 ||
			config.vatRate > 100
		) {
			toast.error("VAT rate must be between 0 and 100.");
			return false;
		}

		const amounts = [
			["Discount threshold", config.discountThreshold],
			["Waiver threshold", config.waiverThreshold],
			["Credit note threshold", config.creditNoteThreshold],
		] as const;

		for (const [label, value] of amounts) {
			if (
				!Number.isFinite(value) ||
				value < 0 ||
				value > 9999999999999999
			) {
				toast.error(`${label} must be a valid non-negative amount.`);
				return false;
			}
		}

		if (
			!Number.isInteger(config.defaultCreditTermsDays) ||
			config.defaultCreditTermsDays < 1 ||
			config.defaultCreditTermsDays > 3650
		) {
			toast.error("Credit terms must be between 1 and 3650 days.");
			return false;
		}

		if (
			!Number.isInteger(config.dunningIntervalDays) ||
			config.dunningIntervalDays < 1 ||
			config.dunningIntervalDays > 365
		) {
			toast.error("Dunning interval must be between 1 and 365 days.");
			return false;
		}

		if (!changeReason.trim()) {
			toast.error("Enter a reason for the configuration change.");
			return false;
		}

		if (changeReason.trim().length > 500) {
			toast.error("Change reason cannot exceed 500 characters.");
			return false;
		}

		return true;
	};

	const handleSave = async () => {
		if (!dirty || saving) return;
		if (!validate()) return;

		setSaving(true);
		try {
			const payload = {
				base_currency: config.baseCurrency,
				vat_rate: config.vatRate,
				discount_threshold: config.discountThreshold,
				waiver_threshold: config.waiverThreshold,
				credit_note_threshold: config.creditNoteThreshold,
				dual_approval_required: config.dualApprovalRequired,
				clearance_gate_enforced: config.clearanceGateEnforced,
				allow_approved_credit: config.allowApprovedCredit,
				allow_waiver: config.allowWaiver,
				auto_block_on_exposure: config.autoBlockOnExposure,
				default_credit_terms_days: config.defaultCreditTermsDays,
				dunning_interval_days: config.dunningIntervalDays,
				change_reason: changeReason.trim(),
			};

			const res = await http.post(
				"/admin/config/financial/update/",
				payload
			);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(
					resp.data || "Could not save the financial configuration."
				);
				return;
			}
			toast.success("Financial configuration saved. Change logged.");
			await fetchAll();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					"Could not save the financial configuration."
			);
		} finally {
			setSaving(false);
		}
	};

	const handleDiscard = async () => {
		await fetchAll();
		toast.message("Changes discarded.");
	};

	if (loading) {
		return (
			<AppShell
				title="Financial Rules"
				eyebrow="Administration · Configuration"
			>
				<div className="flex items-center justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
					<span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
				</div>
			</AppShell>
		);
	}

	if (error) {
		return (
			<AppShell
				title="Financial Rules"
				eyebrow="Administration · Configuration"
			>
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load financial configuration
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">{error}</p>
						</div>
					</div>
					<div className="mt-5">
						<Button
							onClick={() => void fetchAll()}
							className="bg-orange text-white hover:bg-orange-deep"
						>
							Try again
						</Button>
					</div>
				</div>
			</AppShell>
		);
	}

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
						Configure tax, approval thresholds, credit controls, and
						financial clearance rules. Every change is logged with actor
						and reason.
					</p>
				</div>

				{dirty && <StatusBadge label="Unsaved changes" tone="warning" />}
			</div>

			<section className="mt-6 rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex items-start gap-3">
					<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
						<ShieldCheck className="size-5" />
					</div>

					<div>
						<h3 className="text-sm font-semibold text-ink">
							Financial controls and audit
						</h3>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Configure financial approval limits, credit policies, and
							clearance requirements. Every change is logged with actor,
							prior value, and reason.
						</p>
					</div>
				</div>
			</section>

			<section className="mt-5 rounded-2xl bg-paper ring-1 ring-line">
				<SectionHeader
					title="Tax"
					description="Set the default VAT rate used by applicable tariffs and invoicing rules."
				/>

				<div className="p-5">
					<NumberField
						label="VAT rate"
						icon={Percent}
						unit="%"
						value={config.vatRate}
						onChange={(value) => update("vatRate", value)}
					/>
				</div>
			</section>

			<section className="mt-5 rounded-2xl bg-paper ring-1 ring-line">
				<SectionHeader
					title="Approval thresholds"
					description="Configure monetary limits for discounts, waivers, and credit notes."
				/>

				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<NumberField
						label="Discount threshold"
						icon={BadgeDollarSign}
						unit={config.baseCurrency}
						value={config.discountThreshold}
						onChange={(value) => update("discountThreshold", value)}
					/>

					<NumberField
						label="Waiver threshold"
						icon={BadgeDollarSign}
						unit={config.baseCurrency}
						value={config.waiverThreshold}
						onChange={(value) => update("waiverThreshold", value)}
					/>

					<NumberField
						label="Credit note threshold"
						icon={BadgeDollarSign}
						unit={config.baseCurrency}
						value={config.creditNoteThreshold}
						onChange={(value) => update("creditNoteThreshold", value)}
					/>

					<RuleRow
						icon={ShieldCheck}
						label="Require dual approval"
						desc="Require a second authorized approver when configured thresholds are exceeded."
						on={config.dualApprovalRequired}
						onToggle={() =>
							update(
								"dualApprovalRequired",
								!config.dualApprovalRequired
							)
						}
					/>
				</div>
			</section>

			<section className="mt-5 rounded-2xl bg-paper ring-1 ring-line">
				<SectionHeader
					title="Financial clearance"
					description="Configure clearance rules for release authorization and gate-out."
				/>

				<div className="divide-y divide-line">
					<RuleRow
						icon={ShieldCheck}
						label="Enforce financial clearance"
						desc="Require charges to be settled or an eligible credit or waiver approval to be recorded."
						on={config.clearanceGateEnforced}
						onToggle={() =>
							update(
								"clearanceGateEnforced",
								!config.clearanceGateEnforced
							)
						}
					/>

					<RuleRow
						icon={CreditCard}
						label="Allow approved credit"
						desc="Permit release against an approved credit facility."
						on={config.allowApprovedCredit}
						onToggle={() =>
							update(
								"allowApprovedCredit",
								!config.allowApprovedCredit
							)
						}
					/>

					<RuleRow
						icon={BadgeDollarSign}
						label="Allow approved waivers"
						desc="Permit release against a properly approved waiver."
						on={config.allowWaiver}
						onToggle={() => update("allowWaiver", !config.allowWaiver)}
					/>
				</div>
			</section>

			<section className="mt-5 rounded-2xl bg-paper ring-1 ring-line">
				<SectionHeader
					title="Credit controls"
					description="Set exposure behaviour, invoice credit terms, and overdue-payment reminder intervals."
				/>

				<div className="divide-y divide-line">
					<RuleRow
						icon={AlertTriangle}
						label="Auto-block on exceeded exposure"
						desc="Prevent new chargeable events when a customer exceeds the permitted credit exposure."
						on={config.autoBlockOnExposure}
						onToggle={() =>
							update(
								"autoBlockOnExposure",
								!config.autoBlockOnExposure
							)
						}
					/>

					<div className="grid gap-4 p-5 sm:grid-cols-2">
						<NumberField
							label="Default credit terms"
							icon={Clock}
							unit="days"
							value={config.defaultCreditTermsDays}
							onChange={(value) =>
								update("defaultCreditTermsDays", value)
							}
						/>

						<NumberField
							label="Dunning interval"
							icon={Clock}
							unit="days"
							value={config.dunningIntervalDays}
							onChange={(value) =>
								update("dunningIntervalDays", value)
							}
						/>
					</div>
				</div>
			</section>

			<section className="mt-5 rounded-2xl bg-paper p-5 ring-1 ring-line">
				<label className="block">
					<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
						<AlertTriangle className="size-3.5 text-orange" />
						Reason for configuration change
					</span>

					<textarea
						value={changeReason}
						onChange={(event) => setChangeReason(event.target.value)}
						maxLength={500}
						rows={3}
						placeholder="Explain why these financial settings are being changed."
						className="mt-2 w-full rounded-md border border-line bg-sand p-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
					/>

					<span className="mt-1 block text-right font-mono text-[10px] text-ink-soft">
						{changeReason.length}/500
					</span>
				</label>
			</section>

			<div className="sticky bottom-4 z-10 mt-5 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
							{dirty ? "Unsaved changes" : "All changes saved"}
						</p>

						<p className="mt-1 text-xs text-sand/75">
							{dirty
								? "Save to apply tax, threshold, and credit changes."
								: "No pending changes."}
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleDiscard}
							disabled={!dirty || saving}
							className="border-sand/25 bg-transparent text-sand hover:bg-sand/10 disabled:opacity-40"
						>
							Discard
						</Button>

						<Button
							type="button"
							onClick={handleSave}
							disabled={!dirty || saving}
							className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
						>
							<Save className="size-4" />
							{saving ? "Saving…" : "Save changes"}
						</Button>
					</div>
				</div>
			</div>
		</AppShell>
	);
}

function SectionHeader({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="border-b border-line p-5">
			<h3 className="font-display text-sm font-bold text-ink">{title}</h3>
			<p className="mt-1 text-xs leading-5 text-ink-soft">{description}</p>
		</div>
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

			<div className="mt-1.5 flex flex-wrap items-center gap-2">
				<Input
					type="number"
					min={0}
					step="any"
					value={String(value)}
					onChange={(event) =>
						onChange(
							event.target.value === ""
								? 0
								: Number(event.target.value)
						)
					}
					className="h-11 w-44 border-line bg-sand font-mono text-sm text-ink"
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
		<div className="flex flex-wrap items-start justify-between gap-4 p-5">
			<div className="flex min-w-[220px] flex-1 items-start gap-3">
				<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
					<Icon className="size-4" />
				</div>

				<div className="min-w-0">
					<p className="text-[13px] font-semibold text-ink">{label}</p>
					<p className="mt-1 text-xs leading-5 text-ink-soft">{desc}</p>
				</div>
			</div>

			<button
				type="button"
				role="switch"
				aria-checked={on}
				aria-label={label}
				onClick={onToggle}
				className={cn(
					"inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
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
		</div>
	);
}