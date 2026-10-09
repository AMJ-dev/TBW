import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	CalendarClock,
	CheckCircle2,
	Clock,
	Coins,
	Hourglass,
	Pause,
	Save,
	ShieldCheck,
	Trash2,
	TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

interface EscalationTier {
	id: string;
	fromDay: number;
	rateMultiplier: number;
}

interface StorageConfig {
	baseRate: number;
	freeDays: number;
	chargingUnit: "day" | "week" | "month";
	minimumCharge: number;
	effectiveFrom: string;
	escalationTiers: EscalationTier[];
	overstayThresholdDays: number;
	overstayEscalationDays: number;
	pauseOnHold: boolean;
	pauseOnExamination: boolean;
	pauseOnCustomsHold: boolean;
}

const emptyConfig: StorageConfig = {
	baseRate: 0,
	freeDays: 5,
	chargingUnit: "day",
	minimumCharge: 0,
	effectiveFrom: "",
	escalationTiers: [],
	overstayThresholdDays: 30,
	overstayEscalationDays: 45,
	pauseOnHold: false,
	pauseOnExamination: false,
	pauseOnCustomsHold: false,
};

const formatMoney = (amount: number) =>
	new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		maximumFractionDigits: 2,
	}).format(Number.isFinite(amount) ? amount : 0);

const normaliseTier = (raw: any): EscalationTier => ({
	id: String(raw?.id ?? crypto.randomUUID()),
	fromDay: Number(raw?.from_day ?? raw?.fromDay ?? 0),
	rateMultiplier: Number(
		raw?.rate_multiplier ?? raw?.rateMultiplier ?? 1
	),
});

export default function AdminStorageConfigurationPage() {
	const [config, setConfig] = useState<StorageConfig>(emptyConfig);
	const [savedConfig, setSavedConfig] = useState<StorageConfig>(emptyConfig);
	const [changeReason, setChangeReason] = useState("");
	const [dirty, setDirty] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const fetchAll = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("/admin/config/storage/");
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load storage configuration.");
				return;
			}
			const payload: any = resp.code ?? {};

			const rawTiers: any[] = Array.isArray(payload.escalation_tiers)
				? payload.escalation_tiers
				: Array.isArray(payload.escalationTiers)
					? payload.escalationTiers
					: [];

			const loaded: StorageConfig = {
				baseRate: Number(payload.base_rate ?? payload.baseRate ?? 0),
				freeDays: Number(payload.free_days ?? payload.freeDays ?? 5),
				chargingUnit: (payload.charging_unit ??
					payload.chargingUnit ??
					"day") as StorageConfig["chargingUnit"],
				minimumCharge: Number(
					payload.minimum_charge ?? payload.minimumCharge ?? 0
				),
				effectiveFrom:
					payload.effective_from ?? payload.effectiveFrom ?? "",
				escalationTiers: rawTiers.map(normaliseTier),
				overstayThresholdDays: Number(
					payload.overstay_threshold_days ??
						payload.overstayThresholdDays ??
						30
				),
				overstayEscalationDays: Number(
					payload.overstay_escalation_days ??
						payload.overstayEscalationDays ??
						45
				),
				pauseOnHold: Boolean(
					payload.pause_on_hold ?? payload.pauseOnHold ?? false
				),
				pauseOnExamination: Boolean(
					payload.pause_on_examination ??
						payload.pauseOnExamination ??
						false
				),
				pauseOnCustomsHold: Boolean(
					payload.pause_on_customs_hold ??
						payload.pauseOnCustomsHold ??
						false
				),
			};

			setConfig(loaded);
			setSavedConfig(loaded);
			setChangeReason("");
			setDirty(false);
		} catch (err: any) {
			setError(
				err?.response?.data?.message ||
					"Could not load storage configuration."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const update = <K extends keyof StorageConfig>(
		key: K,
		value: StorageConfig[K]
	) => {
		setConfig((previous) => {
			const next = { ...previous, [key]: value };
			setDirty(JSON.stringify(next) !== JSON.stringify(savedConfig));
			return next;
		});
	};

	const updateTier = (id: string, patch: Partial<EscalationTier>) => {
		setConfig((previous) => {
			const next = {
				...previous,
				escalationTiers: previous.escalationTiers.map((tier) =>
					tier.id === id ? { ...tier, ...patch } : tier
				),
			};
			setDirty(JSON.stringify(next) !== JSON.stringify(savedConfig));
			return next;
		});
	};

	const addTier = () => {
		setConfig((previous) => {
			const sorted = [...previous.escalationTiers].sort(
				(a, b) => a.fromDay - b.fromDay
			);
			const last = sorted[sorted.length - 1];

			const next = {
				...previous,
				escalationTiers: [
					...previous.escalationTiers,
					{
						id: `tier-${Date.now()}`,
						fromDay: (last?.fromDay ?? previous.freeDays) + 10,
						rateMultiplier: (last?.rateMultiplier ?? 1) + 0.5,
					},
				],
			};

			setDirty(JSON.stringify(next) !== JSON.stringify(savedConfig));
			return next;
		});
	};

	const removeTier = (id: string) => {
		setConfig((previous) => {
			const next = {
				...previous,
				escalationTiers: previous.escalationTiers.filter(
					(tier) => tier.id !== id
				),
			};
			setDirty(JSON.stringify(next) !== JSON.stringify(savedConfig));
			return next;
		});
	};

	const validate = () => {
		if (
			!Number.isFinite(config.baseRate) ||
			config.baseRate <= 0
		) {
			toast.error("Base storage rate must be greater than zero.");
			return false;
		}

		if (
			!Number.isInteger(config.freeDays) ||
			config.freeDays < 0 ||
			config.freeDays > 3650
		) {
			toast.error("Free storage days must be between 0 and 3650.");
			return false;
		}

		if (
			!Number.isFinite(config.minimumCharge) ||
			config.minimumCharge < 0
		) {
			toast.error("Minimum charge must be a valid non-negative amount.");
			return false;
		}

		if (!config.effectiveFrom) {
			toast.error("Select the effective date for these rules.");
			return false;
		}

		const tiers = [...config.escalationTiers].sort(
			(a, b) => a.fromDay - b.fromDay
		);

		let lastDay = 0;

		for (const tier of tiers) {
			if (
				!Number.isInteger(tier.fromDay) ||
				tier.fromDay <= config.freeDays ||
				tier.fromDay <= lastDay
			) {
				toast.error(
					"Tier start days must be unique, increasing, positive integers after the free period."
				);
				return false;
			}

			if (
				!Number.isFinite(tier.rateMultiplier) ||
				tier.rateMultiplier <= 0 ||
				tier.rateMultiplier > 1000
			) {
				toast.error(
					"Each escalation multiplier must be greater than zero and no more than 1000."
				);
				return false;
			}

			lastDay = tier.fromDay;
		}

		if (
			!Number.isInteger(config.overstayThresholdDays) ||
			config.overstayThresholdDays < 1 ||
			config.overstayThresholdDays > 3650
		) {
			toast.error(
				"Overstay threshold must be between 1 and 3650 days."
			);
			return false;
		}

		if (
			!Number.isInteger(config.overstayEscalationDays) ||
			config.overstayEscalationDays <=
				config.overstayThresholdDays ||
			config.overstayEscalationDays > 3650
		) {
			toast.error(
				"Escalation notice day must be after the overstay threshold and no more than 3650 days."
			);
			return false;
		}

		if (!changeReason.trim()) {
			toast.error("Enter a reason for changing these rules.");
			return false;
		}

		if (changeReason.trim().length > 500) {
			toast.error("The change reason cannot exceed 500 characters.");
			return false;
		}

		return true;
	};

	const handleSave = async () => {
		if (!dirty || saving) return;
		if (!validate()) return;

		setSaving(true);
		try {
			const sortedTiers = [...config.escalationTiers].sort(
				(a, b) => a.fromDay - b.fromDay
			);

			const payload = {
				base_rate: config.baseRate,
				free_days: config.freeDays,
				charging_unit: config.chargingUnit,
				minimum_charge: config.minimumCharge,
				effective_from: config.effectiveFrom,
				escalation_tiers: sortedTiers.map((tier) => ({
					id: tier.id,
					from_day: tier.fromDay,
					rate_multiplier: tier.rateMultiplier,
				})),
				overstay_threshold_days: config.overstayThresholdDays,
				overstay_escalation_days: config.overstayEscalationDays,
				pause_on_hold: config.pauseOnHold,
				pause_on_examination: config.pauseOnExamination,
				pause_on_customs_hold: config.pauseOnCustomsHold,
				change_reason: changeReason.trim(),
			};

			const res = await http.post(
				"/admin/config/storage/update/",
				payload
			);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(
					resp.data || "Could not save the storage configuration."
				);
				return;
			}
			toast.success("Storage configuration saved. Change logged.");
			await fetchAll();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					"Could not save the storage configuration."
			);
		} finally {
			setSaving(false);
		}
	};

	const handleDiscard = async () => {
		await fetchAll();
		toast.message("Changes discarded.");
	};

	const getTierRate = (multiplier: number) =>
		config.baseRate * multiplier;

	if (loading) {
		return (
			<AppShell
				title="Storage Rules"
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
				title="Storage Rules"
				eyebrow="Administration · Configuration"
			>
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load storage configuration
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
						Configure storage rates, free periods, progressive escalation,
						authorised pause conditions, and overstay thresholds. Every
						change is logged with actor and reason.
					</p>
				</div>

				{dirty && <StatusBadge label="Unsaved changes" tone="warning" />}
			</div>

			<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
						<ShieldCheck className="size-5" />
					</div>

					<div className="min-w-0 flex-1">
						<p className="text-sm font-semibold text-ink">
							Storage clock boundaries
						</p>

						<p className="mt-1 text-xs leading-5 text-ink-soft">
							The storage clock starts when cargo enters the STORED
							lifecycle state and ends when it reaches GATE_OUT. These
							boundaries follow the terminal lifecycle specification.
						</p>

						<div className="mt-4 grid gap-3 sm:grid-cols-2">
							<div className="flex items-center gap-3 rounded-lg border border-line bg-sand/50 p-3">
								<div className="grid size-9 shrink-0 place-items-center rounded-md bg-paper text-orange-deep">
									<Clock className="size-4" />
								</div>
								<div>
									<p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
										Clock starts
									</p>
									<p className="mt-1 text-sm font-semibold text-ink">
										STORED
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3 rounded-lg border border-line bg-sand/50 p-3">
								<div className="grid size-9 shrink-0 place-items-center rounded-md bg-paper text-orange-deep">
									<CheckCircle2 className="size-4" />
								</div>
								<div>
									<p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
										Clock ends
									</p>
									<p className="mt-1 text-sm font-semibold text-ink">
										GATE_OUT
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<SectionHeader
					title="Storage Rate & Free Period"
					description="Set the base daily rate, free storage period, charging unit, and minimum charge. Confirm commercial rates against the approved tariff."
				/>

				<div className="grid gap-5 p-5 sm:grid-cols-2">
					<NumberField
						label="Base storage rate"
						icon={Coins}
						unit="NGN per charging unit"
						value={config.baseRate}
						min={0.01}
						step="0.01"
						onChange={(value) => update("baseRate", value)}
					/>

					<NumberField
						label="Free storage period"
						icon={Hourglass}
						unit="days"
						value={config.freeDays}
						min={0}
						step={1}
						onChange={(value) => update("freeDays", value)}
					/>

					<label className="block">
						<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							<Clock className="size-3.5 text-orange" />
							Charging unit
						</span>

						<select
							value={config.chargingUnit}
							onChange={(event) =>
								update(
									"chargingUnit",
									event.target.value as StorageConfig["chargingUnit"]
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
						label="Minimum storage charge"
						icon={Coins}
						unit="NGN"
						value={config.minimumCharge}
						min={0}
						step="0.01"
						onChange={(value) => update("minimumCharge", value)}
					/>

					<label className="block sm:col-span-2">
						<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							<CalendarClock className="size-3.5 text-orange" />
							Rules effective from
						</span>

						<Input
							type="date"
							value={config.effectiveFrom}
							onChange={(event) =>
								update("effectiveFrom", event.target.value)
							}
							className="mt-1.5 h-11 border-line bg-sand text-ink"
						/>

						<span className="mt-1.5 block text-xs leading-5 text-ink-soft">
							The date this configuration is intended to take effect.
							Existing accruals keep the version in force when their
							clock started.
						</span>
					</label>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<SectionHeader
					title="Progressive Escalation"
					description="Configure the multiplier applied to the base storage rate from each tier's starting day. The first tier must begin after the free storage period."
				/>

				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
					<div>
						<p className="text-sm font-semibold text-ink">
							{config.escalationTiers.length}{" "}
							{config.escalationTiers.length === 1 ? "tier" : "tiers"}{" "}
							configured
						</p>
						<p className="mt-1 text-xs text-ink-soft">
							Base rate: {formatMoney(config.baseRate)} per charging unit
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
					<div className="p-6 text-center">
						<TrendingUp className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 text-sm font-semibold text-ink">
							No escalation tiers
						</p>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Storage will use the base rate throughout the chargeable
							period unless a tariff defines another rule.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[650px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">From day</th>
									<th className="px-4 py-3 font-medium">Multiplier</th>
									<th className="px-4 py-3 font-medium">
										Calculated rate
									</th>
									<th className="px-4 py-3 text-right font-medium">
										Action
									</th>
								</tr>
							</thead>

							<tbody className="divide-y divide-line">
								{[...config.escalationTiers]
									.sort((a, b) => a.fromDay - b.fromDay)
									.map((tier) => (
										<tr
											key={tier.id}
											className="hover:bg-sand/40"
										>
											<td className="px-4 py-3">
												<Input
													type="number"
													min={config.freeDays + 1}
													step={1}
													value={String(tier.fromDay)}
													onChange={(event) =>
														updateTier(tier.id, {
															fromDay:
																event.target.value === ""
																	? 0
																	: Number(event.target.value),
														})
													}
													className="h-9 w-28 border-line bg-paper font-mono text-xs text-ink"
												/>
											</td>

											<td className="px-4 py-3">
												<div className="flex items-center gap-2">
													<Input
														type="number"
														min={0.01}
														max={1000}
														step="0.01"
														value={String(tier.rateMultiplier)}
														onChange={(event) =>
															updateTier(tier.id, {
																rateMultiplier:
																	event.target.value === ""
																		? 0
																		: Number(event.target.value),
															})
														}
														className="h-9 w-24 border-line bg-paper font-mono text-xs text-ink"
													/>
													<span className="font-mono text-xs text-ink-soft">
														×
													</span>
												</div>
											</td>

											<td className="px-4 py-3">
												<p className="font-mono text-xs font-semibold text-ink">
													{formatMoney(
														getTierRate(tier.rateMultiplier)
													)}
												</p>
												<p className="mt-1 text-[10px] text-ink-soft">
													Per charging unit
												</p>
											</td>

											<td className="px-4 py-3 text-right">
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => removeTier(tier.id)}
													className="text-carmine hover:bg-carmine/10"
												>
													<Trash2 className="size-3.5" />
													Remove
												</Button>
											</td>
										</tr>
									))}
							</tbody>
						</table>
					</div>
				)}

				<div className="border-t border-line bg-sand/30 p-4">
					<p className="text-xs leading-5 text-ink-soft">
						Example: a 1.5× multiplier on a base rate of{" "}
						{formatMoney(config.baseRate)} produces{" "}
						{formatMoney(config.baseRate * 1.5)} per charging unit.
					</p>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<SectionHeader
					title="Authorised Pause Conditions"
					description="Choose which approved operational conditions can suspend storage accrual. Activating a rule here does not itself create or authorise an operational hold."
				/>

				<div className="divide-y divide-line">
					<RuleRow
						icon={Pause}
						label="Pause on terminal hold"
						desc="Allow storage accrual to be paused while an authorised terminal hold is active."
						on={config.pauseOnHold}
						onToggle={() =>
							update("pauseOnHold", !config.pauseOnHold)
						}
					/>

					<RuleRow
						icon={Pause}
						label="Pause during examination"
						desc="Allow accrual to be paused while cargo is presented for examination, subject to the approved policy."
						on={config.pauseOnExamination}
						onToggle={() =>
							update(
								"pauseOnExamination",
								!config.pauseOnExamination
							)
						}
					/>

					<RuleRow
						icon={ShieldCheck}
						label="Pause on Customs hold"
						desc="Allow accrual to be paused while an authorised Customs hold is active."
						on={config.pauseOnCustomsHold}
						onToggle={() =>
							update(
								"pauseOnCustomsHold",
								!config.pauseOnCustomsHold
							)
						}
					/>
				</div>

				<div className="border-t border-line bg-sand/30 p-4">
					<p className="text-xs leading-5 text-ink-soft">
						Each operational pause records its hold type, authority or
						reference, reason, actor, and timestamp. Those records belong
						to the operational hold workflow.
					</p>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<SectionHeader
					title="Overstay Policy"
					description="Configure when cargo should be flagged as overstayed and when the next escalation should occur."
				/>

				<div className="grid gap-5 p-5 sm:grid-cols-2">
					<NumberField
						label="Overstay threshold"
						icon={CalendarClock}
						unit="days from STORED"
						value={config.overstayThresholdDays}
						min={1}
						step={1}
						onChange={(value) =>
							update("overstayThresholdDays", value)
						}
					/>

					<NumberField
						label="Escalation notice day"
						icon={AlertTriangle}
						unit="days from STORED"
						value={config.overstayEscalationDays}
						min={1}
						step={1}
						onChange={(value) =>
							update("overstayEscalationDays", value)
						}
					/>
				</div>

				<div className="border-t border-line p-5">
					<div className="flex items-start gap-3">
						<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
							<AlertTriangle className="size-4" />
						</div>

						<div>
							<p className="text-sm font-semibold text-ink">
								Overstay workflow
							</p>
							<p className="mt-1 text-xs leading-5 text-ink-soft">
								The operational system creates time-based overstay
								flags, dispatches escalating customer notices, and
								provides the Customs-liaison report.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex items-start gap-3">
					<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
						<AlertTriangle className="size-5" />
					</div>

					<div className="min-w-0 flex-1">
						<h3 className="text-sm font-semibold text-ink">
							Reason for configuration change
						</h3>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Record why the storage policy is being changed. The reason
							is persisted with the actor, previous values, and new
							values.
						</p>

						<textarea
							value={changeReason}
							onChange={(event) => {
								setChangeReason(event.target.value);
								setDirty(true);
							}}
							maxLength={500}
							rows={3}
							placeholder="Explain the reason for this change..."
							className="mt-3 w-full rounded-md border border-line bg-sand p-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
						/>

						<p className="mt-1 text-right font-mono text-[10px] text-ink-soft">
							{changeReason.length}/500
						</p>
					</div>
				</div>
			</section>

			<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
							{dirty ? "Unsaved changes" : "All changes saved"}
						</p>

						<p className="mt-1 text-xs text-sand/75">
							{dirty
								? "Save to apply rate, escalation, pause, and overstay changes."
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
	min,
	step,
	onChange,
}: {
	label: string;
	icon: LucideIcon;
	unit: string;
	value: number;
	min: number;
	step: number | string;
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
					min={min}
					step={step}
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

				<span className="font-mono text-[11px] text-ink-soft">
					{unit}
				</span>
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
	icon: LucideIcon;
	label: string;
	desc: string;
	on: boolean;
	onToggle: () => void;
}) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-4 p-5">
			<div className="flex min-w-[240px] flex-1 items-start gap-3">
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