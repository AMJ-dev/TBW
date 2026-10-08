import { useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	Bell,
	CalendarClock,
	Clock,
	Megaphone,
	Plus,
	Save,
	ShieldCheck,
	Trash2,
	Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Notice {
	id: string;
	message: string;
	severity: "info" | "warning" | "critical";
	active: boolean;
	audience: "public" | "portal" | "all";
}

interface MaintenanceConfig {
	maintenanceMode: boolean;
	allowStaffAccess: boolean;
	message: string;
	scheduledStart: string;
	scheduledDurationMinutes: number;
	notifyUsersAheadHours: number;
	noticeBannerEnabled: boolean;
	notices: Notice[];
}

const initialConfig: MaintenanceConfig = {
	maintenanceMode: false,
	allowStaffAccess: true,
	message:
		"TRÏNŪ's platform is temporarily unavailable for scheduled maintenance. We will be back shortly.",
	scheduledStart: "",
	scheduledDurationMinutes: 60,
	notifyUsersAheadHours: 24,
	noticeBannerEnabled: false,
	notices: [],
};

const severityTone: Record<
	Notice["severity"],
	"info" | "warning" | "critical"
> = {
	info: "info",
	warning: "warning",
	critical: "critical",
};

export default function AdminMaintenancePage() {
	const [config, setConfig] = useState<MaintenanceConfig>(initialConfig);
	const [dirty, setDirty] = useState(false);

	const markDirty = () => setDirty(true);

	const update = <K extends keyof MaintenanceConfig>(
		key: K,
		value: MaintenanceConfig[K]
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		markDirty();
	};

	const addNotice = () => {
		setConfig((prev) => ({
			...prev,
			notices: [
				...prev.notices,
				{
					id: `n-${Date.now()}`,
					message: "",
					severity: "info",
					active: true,
					audience: "all",
				},
			],
		}));
		markDirty();
	};

	const updateNotice = (id: string, patch: Partial<Notice>) => {
		setConfig((prev) => ({
			...prev,
			notices: prev.notices.map((n) =>
				n.id === id ? { ...n, ...patch } : n
			),
		}));
		markDirty();
	};

	const removeNotice = (id: string) => {
		setConfig((prev) => ({
			...prev,
			notices: prev.notices.filter((n) => n.id !== id),
		}));
		markDirty();
	};

	const handleSave = () => {
		if (config.maintenanceMode && !config.message.trim()) {
			toast.error("Maintenance mode requires a message for users.");
			return;
		}
		if (config.scheduledDurationMinutes < 1) {
			toast.error("Scheduled duration must be at least 1 minute.");
			return;
		}
		if (config.noticeBannerEnabled) {
			const badNotice = config.notices.find((n) => !n.message.trim());
			if (badNotice) {
				toast.error("Every notice needs a message.");
				return;
			}
		}
		toast.success("Maintenance configuration saved. Change logged.");
		setDirty(false);
	};

	const handleDiscard = () => {
		setConfig(initialConfig);
		setDirty(false);
		toast.message("Changes discarded.");
	};

	return (
		<AppShell
			title="Maintenance & Notices"
			eyebrow="Administration · Platform Control"
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
						Maintenance &amp; Notices
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Control maintenance mode, scheduled downtime, and platform notices.
						Staff access can remain available during public maintenance windows.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{config.maintenanceMode && (
						<StatusBadge label="Maintenance ON" tone="critical" />
					)}
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
							Maintenance mode is a platform-wide switch
						</p>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							When enabled, the public site and portal show a maintenance page.
							Staff consoles can remain available. Every toggle is logged with
							actor, timestamp, and prior state.
						</p>
					</div>
				</div>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Maintenance Mode
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Toggle public maintenance mode and set the message users see.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<RuleRow
						icon={Wrench}
						label="Maintenance mode"
						desc="Show the maintenance page to public and portal users."
						on={config.maintenanceMode}
						onToggle={() =>
							update("maintenanceMode", !config.maintenanceMode)
						}
					/>
					<RuleRow
						icon={ShieldCheck}
						label="Allow staff access during maintenance"
						desc="Keep internal consoles available while public is down."
						on={config.allowStaffAccess}
						onToggle={() =>
							update("allowStaffAccess", !config.allowStaffAccess)
						}
					/>
					{config.maintenanceMode && (
						<div className="p-5">
							<label className="block">
								<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<Megaphone className="size-3.5 text-orange" />
									Maintenance message
								</span>
								<textarea
									value={config.message}
									onChange={(e) => update("message", e.target.value)}
									placeholder="Message shown to users on the maintenance page."
									className="mt-1.5 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/25"
								/>
							</label>
						</div>
					)}
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Scheduled Downtime
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Optional scheduled window. Users are notified in advance at the
						chosen lead time.
					</p>
				</div>
				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<label className="block">
						<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							<CalendarClock className="size-3.5 text-orange" />
							Scheduled start
						</span>
						<Input
							value={config.scheduledStart}
							onChange={(e) => update("scheduledStart", e.target.value)}
							placeholder="YYYY-MM-DDTHH:MM"
							className="mt-1.5 h-11 border-line bg-sand font-mono text-sm text-ink"
						/>
					</label>
					<NumberField
						label="Scheduled duration"
						icon={Clock}
						unit="minutes"
						value={config.scheduledDurationMinutes}
						onChange={(v) => update("scheduledDurationMinutes", v)}
					/>
					<NumberField
						label="Notify users ahead"
						icon={Bell}
						unit="hours before start"
						value={config.notifyUsersAheadHours}
						onChange={(v) => update("notifyUsersAheadHours", v)}
					/>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
					<div>
						<h3 className="font-display text-sm font-bold text-ink">
							Platform Notices
						</h3>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Banners shown to selected audiences. Each notice has a severity
							and audience scope.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<label className="inline-flex items-center gap-2 text-[12px] text-ink">
							<input
								type="checkbox"
								checked={config.noticeBannerEnabled}
								onChange={(e) =>
									update("noticeBannerEnabled", e.target.checked)
								}
								className="size-4 accent-orange"
							/>
							Banner enabled
						</label>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={addNotice}
							className="border-line bg-paper text-ink hover:bg-sand"
						>
							<Plus className="size-3.5" />
							Add notice
						</Button>
					</div>
				</div>

				{config.notices.length === 0 ? (
					<div className="p-6 text-center text-sm text-ink-soft">
						No notices configured.
					</div>
				) : (
					<ul className="divide-y divide-line">
						{config.notices.map((n) => (
							<li key={n.id} className="p-5">
								<div className="flex flex-wrap items-start gap-4">
									<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
										<Megaphone className="size-5" />
									</div>

									<div className="min-w-[260px] flex-1 space-y-3">
										<div className="flex flex-wrap items-center gap-2">
											<StatusBadge
												label={n.severity}
												tone={severityTone[n.severity]}
											/>
											<StatusBadge
												label={n.active ? "Active" : "Inactive"}
												tone={n.active ? "success" : "neutral"}
											/>
											<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
												{n.audience}
											</span>
										</div>
										<textarea
											value={n.message}
											onChange={(e) =>
												updateNotice(n.id, { message: e.target.value })
											}
											placeholder="Notice message shown to the selected audience."
											className="min-h-20 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/25"
										/>
										<div className="flex flex-wrap items-center gap-2">
											<select
												value={n.severity}
												onChange={(e) =>
													updateNotice(n.id, {
														severity: e.target.value as Notice["severity"],
													})
												}
												className="h-9 rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
											>
												<option value="info">Info</option>
												<option value="warning">Warning</option>
												<option value="critical">Critical</option>
											</select>
											<select
												value={n.audience}
												onChange={(e) =>
													updateNotice(n.id, {
														audience: e.target.value as Notice["audience"],
													})
												}
												className="h-9 rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
											>
												<option value="public">Public only</option>
												<option value="portal">Portal only</option>
												<option value="all">All audiences</option>
											</select>
											<label className="inline-flex items-center gap-2 text-[12px] text-ink">
												<input
													type="checkbox"
													checked={n.active}
													onChange={(e) =>
														updateNotice(n.id, {
															active: e.target.checked,
														})
													}
													className="size-4 accent-orange"
												/>
												Active
											</label>
										</div>
									</div>

									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => removeNotice(n.id)}
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

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							Operational resilience
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Planned maintenance should be scheduled outside gate and
							warehouse operating hours where possible. Offline gate
							authorisations remain available during upstream maintenance, and
							queued transactions reconcile on reconnection. Notice changes are
							logged with actor, timestamp, and prior state.
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
	icon: typeof Wrench;
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