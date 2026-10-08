import { useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	CalendarX2,
	Clock,
	MapPin,
	Save,
	ShieldCheck,
	Truck,
	User,
	Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface GateConfig {
	slotDuration: number;
	concurrentSlots: number;
	advanceBookingWindowDays: number;
	amendmentCutoffHours: number;
	blackoutPeriods: string;
	offlineCacheDurationHours: number;
	requireVehicleInsurance: boolean;
	requireRoadworthiness: boolean;
	requireDriverLicence: boolean;
	blockExpiredDocuments: boolean;
	anprEnabled: boolean;
	autoAdmitOnBooking: boolean;
}

const initialConfig: GateConfig = {
	slotDuration: 60,
	concurrentSlots: 3,
	advanceBookingWindowDays: 7,
	amendmentCutoffHours: 4,
	blackoutPeriods: "",
	offlineCacheDurationHours: 12,
	requireVehicleInsurance: true,
	requireRoadworthiness: true,
	requireDriverLicence: true,
	blockExpiredDocuments: true,
	anprEnabled: false,
	autoAdmitOnBooking: false,
};

export default function AdminGateConfigurationPage() {
	const [config, setConfig] = useState<GateConfig>(initialConfig);
	const [dirty, setDirty] = useState(false);

	const markDirty = () => setDirty(true);

	const update = <K extends keyof GateConfig>(
		key: K,
		value: GateConfig[K]
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		markDirty();
	};

	const handleSave = () => {
		if (config.slotDuration < 15) {
			toast.error("Slot duration must be at least 15 minutes.");
			return;
		}
		if (config.concurrentSlots < 1) {
			toast.error("At least one concurrent slot is required.");
			return;
		}
		toast.success("Gate configuration saved. Change logged.");
		setDirty(false);
	};

	const handleDiscard = () => {
		setConfig(initialConfig);
		setDirty(false);
		toast.message("Changes discarded.");
	};

	return (
		<AppShell
			title="Gate & Booking"
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
						Gate &amp; Booking
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Configure truck appointment slots, capacity, cut-off periods,
						vehicle requirements, and gate-in decision rules. Changes affect new
						bookings only; existing appointments keep their original terms.
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
							Gate-in decisions are logged
						</p>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Every ADMIT / REFER / REJECT decision records actor, timestamp,
							reason, and (where taken) supervisor override. Offline decisions
							cache locally and reconcile on reconnection with conflict
							reporting.
						</p>
					</div>
				</div>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Slot Scheduling
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Slot length, concurrency, and booking window for truck appointments.
					</p>
				</div>
				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<NumberField
						label="Slot duration"
						icon={Clock}
						unit="minutes"
						value={config.slotDuration}
						onChange={(v) => update("slotDuration", v)}
					/>
					<NumberField
						label="Concurrent slots"
						icon={Truck}
						unit="slots"
						value={config.concurrentSlots}
						onChange={(v) => update("concurrentSlots", v)}
					/>
					<NumberField
						label="Advance booking window"
						icon={Clock}
						unit="days"
						value={config.advanceBookingWindowDays}
						onChange={(v) => update("advanceBookingWindowDays", v)}
					/>
					<NumberField
						label="Amendment / cancellation cut-off"
						icon={Clock}
						unit="hours before slot"
						value={config.amendmentCutoffHours}
						onChange={(v) => update("amendmentCutoffHours", v)}
					/>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Blackout Periods
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Periods when no slots are offered — public holidays, planned
						maintenance, or facility closures. One per line.
					</p>
				</div>
				<div className="p-5">
					<label className="block">
						<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							<CalendarX2 className="size-3.5 text-orange" />
							Blackout periods
						</span>
						<textarea
							value={config.blackoutPeriods}
							onChange={(e) => update("blackoutPeriods", e.target.value)}
							placeholder={"2026-12-25 — Christmas Day\n2026-12-26 — Boxing Day\n2027-01-01 — New Year's Day"}
							className="mt-1.5 min-h-32 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/25"
						/>
						<p className="mt-2 text-[11px] text-ink-soft">
							Format: <span className="font-mono">YYYY-MM-DD — Reason</span>. Blank
							lines are ignored.
						</p>
					</label>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Vehicle &amp; Driver Requirements
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Documents required at slot booking. Missing or expired items block
						booking when enforcement is on.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<RequirementRow
						icon={Truck}
						label="Vehicle insurance"
						desc="Proof of valid vehicle insurance required at booking."
						on={config.requireVehicleInsurance}
						onToggle={() =>
							update("requireVehicleInsurance", !config.requireVehicleInsurance)
						}
					/>
					<RequirementRow
						icon={Wrench}
						label="Roadworthiness certificate"
						desc="Current vehicle roadworthiness certificate required."
						on={config.requireRoadworthiness}
						onToggle={() =>
							update("requireRoadworthiness", !config.requireRoadworthiness)
						}
					/>
					<RequirementRow
						icon={User}
						label="Driver licence"
						desc="Valid driver licence with contact details required."
						on={config.requireDriverLicence}
						onToggle={() =>
							update("requireDriverLicence", !config.requireDriverLicence)
						}
					/>
					<RequirementRow
						icon={AlertTriangle}
						label="Block on expired documents"
						desc="Refuse booking when any required document is past its expiry date."
						on={config.blockExpiredDocuments}
						onToggle={() =>
							update("blockExpiredDocuments", !config.blockExpiredDocuments)
						}
					/>
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Gate-in Rules
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Behaviour at the gate: recognition, decisioning, and offline
						resilience.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<RequirementRow
						icon={MapPin}
						label="ANPR plate recognition"
						desc="Attempt automatic plate match to booking. Manual fallback always available."
						on={config.anprEnabled}
						onToggle={() => update("anprEnabled", !config.anprEnabled)}
					/>
					<RequirementRow
						icon={ShieldCheck}
						label="Auto-admit on valid booking"
						desc="Admit vehicles automatically when booking, documents, and readiness checks pass."
						on={config.autoAdmitOnBooking}
						onToggle={() =>
							update("autoAdmitOnBooking", !config.autoAdmitOnBooking)
						}
					/>
					<div className="flex flex-wrap items-start justify-between gap-4 p-5">
						<div className="flex min-w-[240px] flex-1 items-start gap-3">
							<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
								<Clock className="size-4" />
							</div>
							<div className="min-w-0">
								<p className="text-[13px] font-semibold text-ink">
									Offline cache duration
								</p>
								<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
									How long gate authorisations remain valid offline before
									requiring re-sync.
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Input
								value={String(config.offlineCacheDurationHours)}
								onChange={(e) =>
									update(
										"offlineCacheDurationHours",
										Number(e.target.value) || 0
									)
								}
								className="h-9 w-24 border-line bg-sand font-mono text-sm text-ink"
							/>
							<span className="font-mono text-[11px] text-ink-soft">
								hours
							</span>
						</div>
					</div>
				</ul>
			</section>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							Gate decisions and offline integrity
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Gate-in and gate-out events are the highest-value operational
							records. Every ADMIT / REFER / REJECT, every override, and every
							offline-then-synced decision is written as an immutable event with
							device, actor, and timestamp. Release authorisation is
							independently verifiable at gate and revoked immediately if the
							underlying document is revoked.
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
					className="h-11 w-32 border-line bg-sand font-mono text-sm text-ink"
				/>
				<span className="font-mono text-[11px] text-ink-soft">{unit}</span>
			</div>
		</label>
	);
}

function RequirementRow({
	icon: Icon,
	label,
	desc,
	on,
	onToggle,
}: {
	icon: typeof Truck;
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