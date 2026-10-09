import { useEffect, useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	CalendarX2,
	Clock,
	Plus,
	Save,
	ShieldCheck,
	Trash2,
	Truck,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";

interface BlackoutPeriod {
	id: string;
	date: string;
	reason: string;
}

interface VehicleRequirement {
	id: string;
	label: string;
}

interface GateConfig {
	slotDuration: number;
	concurrentSlots: number;
	advanceBookingWindowDays: number;
	amendmentCutoffHours: number;
	blackoutPeriods: BlackoutPeriod[];
	vehicleRequirements: VehicleRequirement[];
}

const emptyConfig: GateConfig = {
	slotDuration: 60,
	concurrentSlots: 3,
	advanceBookingWindowDays: 7,
	amendmentCutoffHours: 4,
	blackoutPeriods: [],
	vehicleRequirements: [],
};

const normaliseBlackout = (raw: any): BlackoutPeriod => ({
	id: String(raw?.id ?? crypto.randomUUID()),
	date: raw?.date ?? "",
	reason: raw?.reason ?? "",
});

const normaliseRequirement = (raw: any): VehicleRequirement => ({
	id: String(raw?.id ?? crypto.randomUUID()),
	label: raw?.label ?? raw?.name ?? "",
});

export default function AdminGateConfigurationPage() {
	const [config, setConfig] = useState<GateConfig>(emptyConfig);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [dirty, setDirty] = useState(false);

	const fetchAll = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("/admin/config/gate/");
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load gate configuration.");
				return;
			}
			const payload: any = resp.code ?? {};

			const rawBlackouts: any[] = Array.isArray(payload.blackout_periods)
				? payload.blackout_periods
				: Array.isArray(payload.blackoutPeriods)
					? payload.blackoutPeriods
					: [];
			const rawRequirements: any[] = Array.isArray(
				payload.vehicle_requirements
			)
				? payload.vehicle_requirements
				: Array.isArray(payload.vehicleRequirements)
					? payload.vehicleRequirements
					: [];

			setConfig({
				slotDuration: Number(
					payload.slot_duration ?? payload.slotDuration ?? 60
				),
				concurrentSlots: Number(
					payload.concurrent_slots ?? payload.concurrentSlots ?? 3
				),
				advanceBookingWindowDays: Number(
					payload.advance_booking_window_days ??
						payload.advanceBookingWindowDays ??
						7
				),
				amendmentCutoffHours: Number(
					payload.amendment_cutoff_hours ??
						payload.amendmentCutoffHours ??
						4
				),
				blackoutPeriods: rawBlackouts.map(normaliseBlackout),
				vehicleRequirements: rawRequirements.map(normaliseRequirement),
			});
			setDirty(false);
		} catch (err: any) {
			setError(
				err?.response?.data?.message ||
					"Could not load gate configuration."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const update = <K extends keyof GateConfig>(
		key: K,
		value: GateConfig[K]
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		setDirty(true);
	};

	const addBlackout = () => {
		setConfig((prev) => ({
			...prev,
			blackoutPeriods: [
				...prev.blackoutPeriods,
				{ id: `bo-${Date.now()}`, date: "", reason: "" },
			],
		}));
		setDirty(true);
	};

	const updateBlackout = (id: string, patch: Partial<BlackoutPeriod>) => {
		setConfig((prev) => ({
			...prev,
			blackoutPeriods: prev.blackoutPeriods.map((bo) =>
				bo.id === id ? { ...bo, ...patch } : bo
			),
		}));
		setDirty(true);
	};

	const removeBlackout = (id: string) => {
		setConfig((prev) => ({
			...prev,
			blackoutPeriods: prev.blackoutPeriods.filter((bo) => bo.id !== id),
		}));
		setDirty(true);
	};

	const addVehicleRequirement = () => {
		setConfig((prev) => ({
			...prev,
			vehicleRequirements: [
				...prev.vehicleRequirements,
				{ id: `vr-${Date.now()}`, label: "" },
			],
		}));
		setDirty(true);
	};

	const updateVehicleRequirement = (id: string, label: string) => {
		setConfig((prev) => ({
			...prev,
			vehicleRequirements: prev.vehicleRequirements.map((vr) =>
				vr.id === id ? { ...vr, label } : vr
			),
		}));
		setDirty(true);
	};

	const removeVehicleRequirement = (id: string) => {
		setConfig((prev) => ({
			...prev,
			vehicleRequirements: prev.vehicleRequirements.filter(
				(vr) => vr.id !== id
			),
		}));
		setDirty(true);
	};

	const handleSave = async () => {
		if (saving) return;

		if (config.slotDuration < 15) {
			toast.error("Slot duration must be at least 15 minutes.");
			return;
		}
		if (config.concurrentSlots < 1) {
			toast.error("At least one concurrent slot is required.");
			return;
		}

		const incompleteBlackout = config.blackoutPeriods.find(
			(bo) => !bo.date.trim() || !bo.reason.trim()
		);
		if (incompleteBlackout) {
			toast.error(
				"Every blackout period needs a date and a reason, or remove the empty row."
			);
			return;
		}

		const emptyRequirement = config.vehicleRequirements.find(
			(vr) => !vr.label.trim()
		);
		if (emptyRequirement) {
			toast.error(
				"Every vehicle requirement needs a label, or remove the empty row."
			);
			return;
		}

		const requirementLabels = config.vehicleRequirements.map((vr) =>
			vr.label.trim().toLowerCase()
		);
		const duplicateRequirement = requirementLabels.find(
			(label, index) => requirementLabels.indexOf(label) !== index
		);
		if (duplicateRequirement) {
			toast.error(`Duplicate vehicle requirement: "${duplicateRequirement}".`);
			return;
		}

		setSaving(true);
		try {
			const payload = {
				slot_duration: config.slotDuration,
				concurrent_slots: config.concurrentSlots,
				advance_booking_window_days: config.advanceBookingWindowDays,
				amendment_cutoff_hours: config.amendmentCutoffHours,
				blackout_periods: config.blackoutPeriods.map((bo) => ({
					id: bo.id,
					date: bo.date.trim(),
					reason: bo.reason.trim(),
				})),
				vehicle_requirements: config.vehicleRequirements.map((vr) => ({
					id: vr.id,
					label: vr.label.trim(),
				})),
			};

			const res = await http.post("/admin/config/gate/update/", payload);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not save the gate configuration.");
				return;
			}
			toast.success("Gate configuration saved. Change logged.");
			await fetchAll();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					"Could not save the gate configuration."
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
				title="Gate & Booking"
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
				title="Gate & Booking"
				eyebrow="Administration · Configuration"
			>
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load gate configuration
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
						Configure truck appointment slots, capacity, cut-off periods, and
						vehicle requirements. Changes affect new bookings only.
					</p>
				</div>

				{dirty && <StatusBadge label="Unsaved changes" tone="warning" />}
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
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
					<div>
						<h3 className="font-display text-sm font-bold text-ink">
							Blackout Periods
						</h3>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Dates when no slots are offered — public holidays, planned
							maintenance, or facility closures.
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addBlackout}
						className="border-line bg-paper text-ink hover:bg-sand"
					>
						<Plus className="size-3.5" />
						Add blackout
					</Button>
				</div>

				{config.blackoutPeriods.length === 0 ? (
					<div className="p-6 text-center text-sm text-ink-soft">
						No blackout periods configured.
					</div>
				) : (
					<ul className="divide-y divide-line">
						{config.blackoutPeriods.map((bo) => (
							<li key={bo.id} className="p-5">
								<div className="flex flex-wrap items-end gap-3">
									<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
										<CalendarX2 className="size-5" />
									</div>

									<label className="block min-w-[160px]">
										<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Date
										</span>
										<Input
											type="date"
											value={bo.date}
											onChange={(e) =>
												updateBlackout(bo.id, { date: e.target.value })
											}
											className="mt-1 h-11 border-line bg-sand font-mono text-ink"
										/>
									</label>

									<label className="block min-w-[220px] flex-1">
										<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Reason
										</span>
										<Input
											value={bo.reason}
											onChange={(e) =>
												updateBlackout(bo.id, {
													reason: e.target.value,
												})
											}
											placeholder="e.g. Christmas Day"
											className="mt-1 h-11 border-line bg-sand text-ink"
										/>
									</label>

									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => removeBlackout(bo.id)}
										aria-label="Remove blackout period"
										className="h-11 text-carmine hover:bg-carmine/10"
									>
										<Trash2 className="size-3.5" />
										Remove
									</Button>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
					<div>
						<h3 className="font-display text-sm font-bold text-ink">
							Vehicle &amp; Driver Requirements
						</h3>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Documents or conditions required at slot booking. Missing or
							expired items block booking when enforced server-side.
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addVehicleRequirement}
						className="border-line bg-paper text-ink hover:bg-sand"
					>
						<Plus className="size-3.5" />
						Add requirement
					</Button>
				</div>

				{config.vehicleRequirements.length === 0 ? (
					<div className="p-6 text-center text-sm text-ink-soft">
						No vehicle requirements configured.
					</div>
				) : (
					<ul className="divide-y divide-line">
						{config.vehicleRequirements.map((vr) => (
							<li
								key={vr.id}
								className="flex flex-wrap items-center gap-3 p-5"
							>
								<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
									<Truck className="size-4" />
								</div>

								<Input
									value={vr.label}
									onChange={(e) =>
										updateVehicleRequirement(vr.id, e.target.value)
									}
									placeholder="e.g. Vehicle insurance certificate"
									className="h-11 min-w-[220px] flex-1 border-line bg-sand text-ink"
								/>

								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => removeVehicleRequirement(vr.id)}
									aria-label={`Remove ${vr.label || "requirement"}`}
									className="text-carmine hover:bg-carmine/10"
								>
									<Trash2 className="size-3.5" />
									Remove
								</Button>
							</li>
						))}
					</ul>
				)}
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

			<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
							{dirty ? "Unsaved changes" : "All changes saved"}
						</p>
						<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
							{dirty
								? "Save to apply slot, blackout, and requirement changes."
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