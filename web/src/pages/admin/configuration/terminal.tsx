import { useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	Boxes,
	Building2,
	Container,
	Grid3x3,
	Layers,
	Package,
	Plus,
	Save,
	ShieldCheck,
	Trash2,
	Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ZoneRow {
	id: string;
	code: string;
	name: string;
	kind: "yard" | "warehouse";
	bonded: boolean;
	capacity: string;
}

interface CargoService {
	id: string;
	label: string;
	enabled: boolean;
}

interface HoldReason {
	id: string;
	label: string;
	category: "customs" | "agency" | "terminal" | "financial" | "damage" | "documentation";
}

interface OperationalArea {
	id: string;
	label: string;
	enabled: boolean;
}

interface TerminalConfig {
	terminalName: string;
	terminalCode: string;
	terminalType: string;
	operatingHours: string;
	weeklyClosure: string;
	zones: ZoneRow[];
	cargoServices: CargoService[];
	holdReasons: HoldReason[];
	operationalAreas: OperationalArea[];
}

const initialConfig: TerminalConfig = {
	terminalName: "Abuja Flagship Facility",
	terminalCode: "",
	terminalType: "Inland Bonded Terminal",
	operatingHours: "08:00 – 18:00",
	weeklyClosure: "Sunday",
	zones: [
		{
			id: "z-1",
			code: "CY-A",
			name: "Container Yard A",
			kind: "yard",
			bonded: true,
			capacity: "120 TEU",
		},
		{
			id: "z-2",
			code: "BW-1",
			name: "Bonded Warehouse 1",
			kind: "warehouse",
			bonded: true,
			capacity: "2,400 sqm",
		},
	],
	cargoServices: [
		{ id: "cs-1", label: "General cargo", enabled: true },
		{ id: "cs-2", label: "Containerised cargo", enabled: true },
		{ id: "cs-3", label: "Agricultural cargo", enabled: true },
		{ id: "cs-4", label: "Industrial cargo", enabled: true },
		{ id: "cs-5", label: "Automotive cargo", enabled: true },
		{ id: "cs-6", label: "Project cargo", enabled: false },
		{ id: "cs-7", label: "Special cargo", enabled: false },
	],
	holdReasons: [
		{ id: "hr-1", label: "Customs inspection hold", category: "customs" },
		{ id: "hr-2", label: "Regulatory agency hold", category: "agency" },
		{ id: "hr-3", label: "Seal mismatch", category: "terminal" },
		{ id: "hr-4", label: "Outstanding charges", category: "financial" },
		{ id: "hr-5", label: "Cargo damage", category: "damage" },
		{ id: "hr-6", label: "Missing documentation", category: "documentation" },
	],
	operationalAreas: [
		{ id: "oa-1", label: "Gate", enabled: true },
		{ id: "oa-2", label: "Receiving & tally", enabled: true },
		{ id: "oa-3", label: "Examination bay", enabled: true },
		{ id: "oa-4", label: "Loading & discharge", enabled: true },
		{ id: "oa-5", label: "Reefer points", enabled: false },
	],
};

export default function AdminTerminalConfigurationPage() {
	const [config, setConfig] = useState<TerminalConfig>(initialConfig);
	const [dirty, setDirty] = useState(false);

	const markDirty = () => setDirty(true);

	const update = <K extends keyof TerminalConfig>(
		key: K,
		value: TerminalConfig[K]
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		markDirty();
	};

	const addZone = () => {
		setConfig((prev) => ({
			...prev,
			zones: [
				...prev.zones,
				{
					id: `z-${Date.now()}`,
					code: "",
					name: "",
					kind: "yard",
					bonded: true,
					capacity: "",
				},
			],
		}));
		markDirty();
	};

	const updateZone = (id: string, patch: Partial<ZoneRow>) => {
		setConfig((prev) => ({
			...prev,
			zones: prev.zones.map((z) => (z.id === id ? { ...z, ...patch } : z)),
		}));
		markDirty();
	};

	const removeZone = (id: string) => {
		setConfig((prev) => ({
			...prev,
			zones: prev.zones.filter((z) => z.id !== id),
		}));
		markDirty();
	};

	const addHoldReason = () => {
		setConfig((prev) => ({
			...prev,
			holdReasons: [
				...prev.holdReasons,
				{
					id: `hr-${Date.now()}`,
					label: "",
					category: "terminal",
				},
			],
		}));
		markDirty();
	};

	const updateHoldReason = (id: string, patch: Partial<HoldReason>) => {
		setConfig((prev) => ({
			...prev,
			holdReasons: prev.holdReasons.map((h) =>
				h.id === id ? { ...h, ...patch } : h
			),
		}));
		markDirty();
	};

	const removeHoldReason = (id: string) => {
		setConfig((prev) => ({
			...prev,
			holdReasons: prev.holdReasons.filter((h) => h.id !== id),
		}));
		markDirty();
	};

	const toggleService = (id: string) => {
		setConfig((prev) => ({
			...prev,
			cargoServices: prev.cargoServices.map((s) =>
				s.id === id ? { ...s, enabled: !s.enabled } : s
			),
		}));
		markDirty();
	};

	const toggleArea = (id: string) => {
		setConfig((prev) => ({
			...prev,
			operationalAreas: prev.operationalAreas.map((a) =>
				a.id === id ? { ...a, enabled: !a.enabled } : a
			),
		}));
		markDirty();
	};

	const handleSave = () => {
		if (!config.terminalName.trim()) {
			toast.error("Terminal name is required.");
			return;
		}
		toast.success("Terminal configuration saved. Change logged.");
		setDirty(false);
	};

	const handleDiscard = () => {
		setConfig(initialConfig);
		setDirty(false);
		toast.message("Changes discarded.");
	};

	return (
		<AppShell
			title="Terminal Operations"
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
						Terminal Operations
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Configure terminal identity, zones, cargo services, operational areas,
						hold reasons, and operational hours. Changes affect new events only;
						historical records retain their original configuration.
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
							Operational Rules
						</p>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Zone, service, and hold definitions are configuration, not
							hard-coded behaviour. Every movement, hold, and service event
							references this configuration and remains immutable on the record.
						</p>
					</div>
				</div>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Terminal Identity
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Facility label, code, type, and operating hours for this terminal.
					</p>
				</div>
				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<Field
						label="Terminal name"
						required
						icon={Building2}
						value={config.terminalName}
						onChange={(v) => update("terminalName", v)}
						placeholder="e.g. Abuja Flagship Facility"
					/>
					<Field
						label="Terminal code"
						icon={Building2}
						value={config.terminalCode}
						onChange={(v) => update("terminalCode", v)}
						placeholder="e.g. TRN-ABJ-01"
						mono
					/>
					<Field
						label="Terminal type"
						icon={Building2}
						value={config.terminalType}
						onChange={(v) => update("terminalType", v)}
						placeholder="e.g. Inland Bonded Terminal"
					/>
					<Field
						label="Operating hours"
						icon={Building2}
						value={config.operatingHours}
						onChange={(v) => update("operatingHours", v)}
						placeholder="e.g. 08:00 – 18:00"
						mono
					/>
					<Field
						label="Weekly closure"
						icon={Building2}
						value={config.weeklyClosure}
						onChange={(v) => update("weeklyClosure", v)}
						placeholder="e.g. Sunday"
					/>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
					<div>
						<h3 className="font-display text-sm font-bold text-ink">
							Zones &amp; Locations
						</h3>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Yard and warehouse zones. Bonded flag controls segregation on the
							floor.
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addZone}
						className="border-line bg-paper text-ink hover:bg-sand"
					>
						<Plus className="size-3.5" />
						Add zone
					</Button>
				</div>

				{config.zones.length === 0 ? (
					<div className="p-6 text-center text-sm text-ink-soft">
						No zones configured.
					</div>
				) : (
					<ul className="divide-y divide-line">
						{config.zones.map((z) => (
							<li key={z.id} className="p-5">
								<div className="flex flex-wrap items-start gap-4">
									<div
										className={cn(
											"grid size-10 shrink-0 place-items-center rounded-lg text-white",
											z.kind === "warehouse" ? "bg-orange" : "bg-slate"
										)}
									>
										{z.kind === "warehouse" ? (
											<Warehouse className="size-5" />
										) : (
											<Boxes className="size-5" />
										)}
									</div>

									<div className="min-w-[220px] flex-1 space-y-3">
										<div className="grid gap-3 sm:grid-cols-3">
											<SmallField
												label="Code"
												value={z.code}
												onChange={(v) => updateZone(z.id, { code: v })}
												placeholder="CY-A"
												mono
											/>
											<SmallField
												label="Name"
												value={z.name}
												onChange={(v) => updateZone(z.id, { name: v })}
												placeholder="Container Yard A"
												full
											/>
											<SmallField
												label="Capacity"
												value={z.capacity}
												onChange={(v) => updateZone(z.id, { capacity: v })}
												placeholder="120 TEU"
											/>
										</div>

										<div className="flex flex-wrap items-center gap-3">
											<select
												value={z.kind}
												onChange={(e) =>
													updateZone(z.id, {
														kind: e.target.value as ZoneRow["kind"],
													})
												}
												className="h-9 rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
											>
												<option value="yard">Yard</option>
												<option value="warehouse">Warehouse</option>
											</select>

											<label className="inline-flex items-center gap-2 text-[12px] text-ink">
												<input
													type="checkbox"
													checked={z.bonded}
													onChange={(e) =>
														updateZone(z.id, { bonded: e.target.checked })
													}
													className="size-4 accent-orange"
												/>
												Bonded
											</label>
										</div>
									</div>

									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => removeZone(z.id)}
										className="text-carmine hover:bg-carmine/10"
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
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Cargo Services
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Cargo categories the terminal is licensed and equipped to handle.
						Disabling a service removes it from intake forms and public pages.
					</p>
				</div>
				<ul className="divide-y divide-line">
					{config.cargoServices.map((s) => (
						<li
							key={s.id}
							className="flex flex-wrap items-center justify-between gap-3 p-5"
						>
							<div className="flex items-center gap-3">
								<div className="grid size-9 place-items-center rounded-lg bg-orange/10 text-orange-deep">
									<Package className="size-4" />
								</div>
								<p className="text-[13px] font-semibold text-ink">
									{s.label}
								</p>
							</div>
							<div className="flex items-center gap-3">
								<StatusBadge
									label={s.enabled ? "Enabled" : "Disabled"}
									tone={s.enabled ? "success" : "neutral"}
								/>
								<Toggle
									on={s.enabled}
									onToggle={() => toggleService(s.id)}
								/>
							</div>
						</li>
					))}
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
					<div>
						<h3 className="font-display text-sm font-bold text-ink">
							Operational Areas
						</h3>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Areas of the terminal that appear in operational workflows and
							service requests.
						</p>
					</div>
				</div>
				<ul className="divide-y divide-line">
					{config.operationalAreas.map((a) => (
						<li
							key={a.id}
							className="flex flex-wrap items-center justify-between gap-3 p-5"
						>
							<div className="flex items-center gap-3">
								<div className="grid size-9 place-items-center rounded-lg bg-orange/10 text-orange-deep">
									<Grid3x3 className="size-4" />
								</div>
								<p className="text-[13px] font-semibold text-ink">
									{a.label}
								</p>
							</div>
							<div className="flex items-center gap-3">
								<StatusBadge
									label={a.enabled ? "Enabled" : "Disabled"}
									tone={a.enabled ? "success" : "neutral"}
								/>
								<Toggle on={a.enabled} onToggle={() => toggleArea(a.id)} />
							</div>
						</li>
					))}
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
					<div>
						<h3 className="font-display text-sm font-bold text-ink">
							Hold Reasons
						</h3>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Categories and reasons available when placing a hold on a
							consignment. Every hold requires authority, reference, actor, and
							reason.
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addHoldReason}
						className="border-line bg-paper text-ink hover:bg-sand"
					>
						<Plus className="size-3.5" />
						Add reason
					</Button>
				</div>

				{config.holdReasons.length === 0 ? (
					<div className="p-6 text-center text-sm text-ink-soft">
						No hold reasons configured.
					</div>
				) : (
					<ul className="divide-y divide-line">
						{config.holdReasons.map((h) => (
							<li key={h.id} className="p-5">
								<div className="flex flex-wrap items-center gap-4">
									<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
										<Layers className="size-5" />
									</div>

									<div className="min-w-[220px] flex-1">
										<SmallField
											label="Reason"
											value={h.label}
											onChange={(v) => updateHoldReason(h.id, { label: v })}
											placeholder="e.g. Seal mismatch"
											full
										/>
									</div>

									<select
										value={h.category}
										onChange={(e) =>
											updateHoldReason(h.id, {
												category: e.target.value as HoldReason["category"],
											})
										}
										className="h-9 rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
									>
										<option value="customs">Customs</option>
										<option value="agency">Agency</option>
										<option value="terminal">Terminal</option>
										<option value="financial">Financial</option>
										<option value="damage">Damage</option>
										<option value="documentation">Documentation</option>
									</select>

									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => removeHoldReason(h.id)}
										className="text-carmine hover:bg-carmine/10"
									>
										<Trash2 className="size-3.5" />
									</Button>
								</div>
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
							Cargo type &amp; service scope
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Cargo services and zones should reflect what the facility is
							licensed and equipped for. Changes to licensed categories should
							be confirmed against the facility licence before being enabled.
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
	required,
	full,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	icon: typeof Building2;
	mono?: boolean;
	required?: boolean;
	full?: boolean;
}) {
	return (
		<label className={cn("block", full && "sm:col-span-2")}>
			<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				<Icon className="size-3.5 text-orange" />
				{label}
				{required && <span className="text-coral">*</span>}
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

function SmallField({
	label,
	value,
	onChange,
	placeholder,
	mono,
	full,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	mono?: boolean;
	full?: boolean;
}) {
	return (
		<label className={cn("block", full && "sm:col-span-2")}>
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
			</span>
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={cn(
					"mt-1 h-9 border-line bg-paper text-[13px] text-ink",
					mono && "font-mono"
				)}
			/>
		</label>
	);
}

function Toggle({
	on,
	onToggle,
}: {
	on: boolean;
	onToggle: () => void;
}) {
	return (
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
	);
}