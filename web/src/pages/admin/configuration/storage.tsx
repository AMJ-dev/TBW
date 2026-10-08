import { useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	CalendarClock,
	Clock,
	Coins,
	Hourglass,
	Pause,
	Save,
	ShieldCheck,
	TimerReset,
	TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EscalationTier {
	id: string;
	fromDay: number;
	rateMultiplier: number;
}

interface StorageConfig {
	freeDays: number;
	chargingUnit: "day" | "week" | "month";
	minimumCharge: number;
	escalationTiers: EscalationTier[];
	overstayThresholdDays: number;
	overstayEscalationDays: number;
	pauseOnHold: boolean;
	pauseOnExamination: boolean;
	pauseOnCustomsHold: boolean;
	clockStartsAt: "stored" | "received";
	clockEndsAt: "gate_out" | "release_authorised";
}

const initialConfig: StorageConfig = {
	freeDays: 5,
	chargingUnit: "day",
	minimumCharge: 0,
	escalationTiers: [
		{ id: "t-1", fromDay: 6, rateMultiplier: 1 },
		{ id: "t-2", fromDay: 16, rateMultiplier: 1.5 },
		{ id: "t-3", fromDay: 31, rateMultiplier: 2 },
	],
	overstayThresholdDays: 30,
	overstayEscalationDays: 45,
	pauseOnHold: false,
	pauseOnExamination: false,
	pauseOnCustomsHold: false,
	clockStartsAt: "stored",
	clockEndsAt: "gate_out",
};

export default function AdminStorageConfigurationPage() {
	const [config, setConfig] = useState<StorageConfig>(initialConfig);
	const [dirty, setDirty] = useState(false);

	const markDirty = () => setDirty(true);

	const update = <K extends keyof StorageConfig>(
		key: K,
		value: StorageConfig[K]
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		markDirty();
	};

	const updateTier = (id: string, patch: Partial<EscalationTier>) => {
		setConfig((prev) => ({
			...prev,
			escalationTiers: prev.escalationTiers.map((t) =>
				t.id === id ? { ...t, ...patch } : t
			),
		}));
		markDirty();
	};

	const addTier = () => {
		setConfig((prev) => {
			const last = prev.escalationTiers[prev.escalationTiers.length - 1];
			return {
				...prev,
				escalationTiers: [
					...prev.escalationTiers,
					{
						id: `t-${Date.now()}`,
						fromDay: (last?.fromDay ?? 0) + 30,
						rateMultiplier: (last?.rateMultiplier ?? 1) + 0.5,
					},
				],
			};
		});
		markDirty();
	};

	const removeTier = (id: string) => {
		setConfig((prev) => ({
			...prev,
			escalationTiers: prev.escalationTiers.filter((t) => t.id !== id),
		}));
		markDirty();
	};

	const handleSave = () => {
		if (config.freeDays < 0) {
			toast.error("Free days cannot be negative.");
			return;
		}
		if (config.minimumCharge < 0) {
			toast.error("Minimum charge cannot be negative.");
			return;
		}
		const tiers = [...config.escalationTiers].sort((a, b) => a.fromDay - b.fromDay);
        let lastDay = -Infinity;
        for (const tier of tiers) {
            if (tier.fromDay <= lastDay) {
                toast.error("Escalation tiers must start on increasing days.");
                return;
            }
            lastDay = tier.fromDay;
        }
		if (config.overstayEscalationDays <= config.overstayThresholdDays) {
			toast.error("Overstay escalation day must be after the overstay threshold.");
			return;
		}
		toast.success("Storage configuration saved. Change logged.");
		setDirty(false);
	};

	const handleDiscard = () => {
		setConfig(initialConfig);
		setDirty(false);
		toast.message("Changes discarded.");
	};

	return (
		<AppShell
			title="Storage Rules"
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
						Storage Rules
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Configure free storage, charging units, progressive escalation,
						minimum charges, pause conditions, and overstay rules. Rate changes
						apply to new storage clocks only; existing accruals keep their
						original terms.
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
							Storage clock
						</p>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							The storage clock drives chargeable events. Automatic charging
							creates charge lines from these rules; live accrual is visible in
							the portal and evidenced on every invoice.
						</p>
					</div>
				</div>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Free Period &amp; Charging Unit
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Days before storage charges begin. Charging unit is the granularity
						of accrual.
					</p>
				</div>
				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<NumberField
						label="Free storage period"
						icon={Hourglass}
						unit="days"
						value={config.freeDays}
						onChange={(v) => update("freeDays", v)}
					/>
					<label className="block">
						<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							<Clock className="size-3.5 text-orange" />
							Charging unit
						</span>
						<select
							value={config.chargingUnit}
							onChange={(e) =>
								update(
									"chargingUnit",
									e.target.value as StorageConfig["chargingUnit"]
								)
							}
							className="mt-1.5 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
						>
							<option value="day">Per day</option>
							<option value="week">Per week</option>
							<option value="month">Per month</option>
						</select>
					</label>
					<NumberField
						label="Minimum charge"
						icon={Coins}
						unit="NGN"
						value={config.minimumCharge}
						onChange={(v) => update("minimumCharge", v)}
					/>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Clock Boundaries
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						When the storage clock starts and stops. Changing a boundary does not
						recompute historical accruals.
					</p>
				</div>
				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<label className="block">
						<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							<Clock className="size-3.5 text-orange" />
							Clock starts at
						</span>
						<select
							value={config.clockStartsAt}
							onChange={(e) =>
								update(
									"clockStartsAt",
									e.target.value as StorageConfig["clockStartsAt"]
								)
							}
							className="mt-1.5 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
						>
							<option value="received">Received</option>
							<option value="stored">Stored</option>
						</select>
					</label>
					<label className="block">
						<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							<Clock className="size-3.5 text-orange" />
							Clock ends at
						</span>
						<select
							value={config.clockEndsAt}
							onChange={(e) =>
								update(
									"clockEndsAt",
									e.target.value as StorageConfig["clockEndsAt"]
								)
							}
							className="mt-1.5 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
						>
							<option value="gate_out">Gate out</option>
							<option value="release_authorised">Release authorised</option>
						</select>
					</label>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
					<div>
						<h3 className="font-display text-sm font-bold text-ink">
							Progressive Escalation
						</h3>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Multiplier applied to the base storage rate from each tier's
							starting day onward. Tiers must start on strictly increasing days.
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addTier}
						className="border-line bg-paper text-ink hover:bg-sand"
					>
						<TrendingUp className="size-3.5" />
						Add tier
					</Button>
				</div>

				{config.escalationTiers.length === 0 ? (
					<div className="p-6 text-center text-sm text-ink-soft">
						No escalation tiers. Storage accrues at the base rate for the whole
						period.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[600px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">From day</th>
									<th className="px-4 py-3 font-medium">Multiplier</th>
									<th className="px-4 py-3 font-medium">Example rate</th>
									<th className="px-4 py-3 font-medium text-right">
										Action
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{config.escalationTiers.map((t) => (
									<tr key={t.id} className="hover:bg-sand/40">
										<td className="px-4 py-3">
											<Input
												value={String(t.fromDay)}
												onChange={(e) =>
													updateTier(t.id, {
														fromDay: Number(e.target.value) || 0,
													})
												}
												className="h-9 w-28 border-line bg-paper font-mono text-xs text-ink"
											/>
										</td>
										<td className="px-4 py-3">
											<Input
												value={String(t.rateMultiplier)}
												onChange={(e) =>
													updateTier(t.id, {
														rateMultiplier:
															Number(e.target.value) || 0,
													})
												}
												className="h-9 w-24 border-line bg-paper font-mono text-xs text-ink"
											/>
										</td>
										<td className="px-4 py-3 font-mono text-xs text-ink-soft">
											1.00 × {t.rateMultiplier.toFixed(2)} ={" "}
											{t.rateMultiplier.toFixed(2)}
										</td>
										<td className="px-4 py-3 text-right">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => removeTier(t.id)}
												className="text-carmine hover:bg-carmine/10"
											>
												Remove
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Pause Conditions
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Suspend storage accrual while the specified condition is active.
						Pauses require an authorised actor and reason.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<PauseRow
						icon={Pause}
						label="Pause on terminal hold"
						desc="Suspend accrual while cargo is under an authorised terminal hold."
						on={config.pauseOnHold}
						onToggle={() => update("pauseOnHold", !config.pauseOnHold)}
					/>
					<RuleRow
						icon={Pause}
						label="Pause during examination"
						desc="Suspend accrual while cargo is presented for examination."
						on={config.pauseOnExamination}
						onToggle={() =>
							update("pauseOnExamination", !config.pauseOnExamination)
						}
					/>
					<RuleRow
						icon={Pause}
						label="Pause on customs hold"
						desc="Suspend accrual while cargo is held by Customs authority."
						on={config.pauseOnCustomsHold}
						onToggle={() =>
							update("pauseOnCustomsHold", !config.pauseOnCustomsHold)
						}
					/>
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Overstay
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Threshold at which cargo is flagged as overstayed, and the day
						escalation notices dispatch to the customer and Customs liaison.
					</p>
				</div>
				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<NumberField
						label="Overstay threshold"
						icon={CalendarClock}
						unit="days from STORED"
						value={config.overstayThresholdDays}
						onChange={(v) => update("overstayThresholdDays", v)}
					/>
					<NumberField
						label="Escalation notice day"
						icon={AlertTriangle}
						unit="days from STORED"
						value={config.overstayEscalationDays}
						onChange={(v) => update("overstayEscalationDays", v)}
					/>
				</div>
			</section>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							Effective-dated rules
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Storage rules are versioned. Existing accruals keep the version in
							force when their clock started; new clocks use the current
							version. Every change is logged with actor, prior value, and
							reason. Overstay flags feed the overstay register and Customs
							liaison report.
						</p>
					</div>
				</div>
			</div>
		</AppShell>
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
	icon: typeof Clock;
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
	icon: typeof Pause;
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

function PauseRow({
	icon,
	label,
	desc,
	on,
	onToggle,
}: {
	icon: typeof Pause;
	label: string;
	desc: string;
	on: boolean;
	onToggle: () => void;
}) {
	return (
		<RuleRow
			icon={icon}
			label={label}
			desc={desc}
			on={on}
			onToggle={onToggle}
		/>
	);
}