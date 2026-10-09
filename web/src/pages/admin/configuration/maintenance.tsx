import { useEffect, useMemo, useState } from "react";
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
import { http, type Resp } from "@/lib/httpClient";

type Severity = "info" | "warning" | "critical";
type Audience = "public" | "portal" | "all";

interface Notice {
	id: string;
	message: string;
	severity: Severity;
	active: boolean;
	audience: Audience;
	startsAt: string;
	endsAt: string;
}

interface MaintenanceConfig {
	maintenanceMode: boolean;
	emergencyMaintenance: boolean;
	allowStaffAccess: boolean;
	message: string;
	scheduledStart: string;
	scheduledDurationMinutes: number;
	notifyUsersAheadHours: number;
	noticeBannerEnabled: boolean;
	notices: Notice[];
}

const emptyConfig: MaintenanceConfig = {
	maintenanceMode: false,
	emergencyMaintenance: false,
	allowStaffAccess: true,
	message:
		"TRÏNŪ's platform is temporarily unavailable for maintenance. We apologise for the inconvenience and will restore service as soon as possible.",
	scheduledStart: "",
	scheduledDurationMinutes: 60,
	notifyUsersAheadHours: 24,
	noticeBannerEnabled: false,
	notices: [],
};

const severityTone: Record<
	Severity,
	"info" | "warning" | "critical"
> = {
	info: "info",
	warning: "warning",
	critical: "critical",
};

const normaliseNotice = (raw: any): Notice => ({
	id: String(raw?.id ?? crypto.randomUUID()),
	message: raw?.message ?? "",
	severity: (raw?.severity ?? "info") as Severity,
	active: Boolean(raw?.active ?? true),
	audience: (raw?.audience ?? "all") as Audience,
	startsAt: raw?.starts_at ?? raw?.startsAt ?? "",
	endsAt: raw?.ends_at ?? raw?.endsAt ?? "",
});

function Toggle({
	checked,
	onChange,
	label,
}: {
	checked: boolean;
	onChange: (value: boolean) => void;
	label: string;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			onClick={() => onChange(!checked)}
			className={cn(
				"relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
				checked ? "bg-orange" : "bg-sand-2"
			)}
		>
			<span
				className={cn(
					"size-5 rounded-full bg-white shadow-sm transition-transform",
					checked ? "translate-x-5" : "translate-x-0.5"
				)}
			/>
		</button>
	);
}

function RuleRow({
	icon: Icon,
	label,
	description,
	checked,
	onChange,
}: {
	icon: typeof Wrench;
	label: string;
	description: string;
	checked: boolean;
	onChange: (value: boolean) => void;
}) {
	return (
		<li className="flex flex-wrap items-center justify-between gap-4 p-5">
			<div className="flex min-w-[240px] flex-1 items-start gap-3">
				<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
					<Icon className="size-4" />
				</div>
				<div className="min-w-0">
					<p className="text-[13px] font-semibold text-ink">{label}</p>
					<p className="mt-1 text-[11px] leading-5 text-ink-soft">
						{description}
					</p>
				</div>
			</div>
			<Toggle checked={checked} onChange={onChange} label={label} />
		</li>
	);
}

function NumberField({
	label,
	icon: Icon,
	unit,
	value,
	min,
	max,
	onChange,
}: {
	label: string;
	icon: typeof Clock;
	unit: string;
	value: number;
	min: number;
	max: number;
	onChange: (value: number) => void;
}) {
	return (
		<label className="block min-w-0">
			<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				<Icon className="size-3.5 text-orange" />
				{label}
			</span>
			<div className="mt-1.5 flex flex-wrap items-center gap-2">
				<Input
					type="number"
					min={min}
					max={max}
					value={String(value)}
					onChange={(event) =>
						onChange(
							event.target.value === "" ? 0 : Number(event.target.value)
						)
					}
					className="h-11 w-36 border-line bg-sand font-mono text-sm text-ink"
				/>
				<span className="text-[11px] text-ink-soft">{unit}</span>
			</div>
			<span className="mt-1 block text-[10px] text-ink-soft">
				Allowed: {min}–{max}
			</span>
		</label>
	);
}

export default function AdminMaintenancePage() {
	const [config, setConfig] = useState<MaintenanceConfig>(emptyConfig);
	const [savedConfig, setSavedConfig] =
		useState<MaintenanceConfig>(emptyConfig);
	const [dirty, setDirty] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [changeReason, setChangeReason] = useState("");

	const fetchAll = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("/admin/config/maintenance/");
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load maintenance configuration.");
				return;
			}
			const payload: any = resp.code ?? {};

			const rawNotices: any[] = Array.isArray(payload.notices)
				? payload.notices
				: [];

			const loaded: MaintenanceConfig = {
				maintenanceMode: Boolean(
					payload.maintenance_mode ?? payload.maintenanceMode ?? false
				),
				emergencyMaintenance: Boolean(
					payload.emergency_maintenance ??
						payload.emergencyMaintenance ??
						false
				),
				allowStaffAccess: Boolean(
					payload.allow_staff_access ?? payload.allowStaffAccess ?? true
				),
				message:
					payload.message ??
					"TRÏNŪ's platform is temporarily unavailable for maintenance. We apologise for the inconvenience and will restore service as soon as possible.",
				scheduledStart:
					payload.scheduled_start ?? payload.scheduledStart ?? "",
				scheduledDurationMinutes: Number(
					payload.scheduled_duration_minutes ??
						payload.scheduledDurationMinutes ??
						60
				),
				notifyUsersAheadHours: Number(
					payload.notify_users_ahead_hours ??
						payload.notifyUsersAheadHours ??
						24
				),
				noticeBannerEnabled: Boolean(
					payload.notice_banner_enabled ??
						payload.noticeBannerEnabled ??
						false
				),
				notices: rawNotices.map(normaliseNotice),
			};

			setConfig(loaded);
			setSavedConfig(loaded);
			setChangeReason("");
			setDirty(false);
		} catch (err: any) {
			setError(
				err?.response?.data?.message ||
					"Could not load maintenance configuration."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const update = <K extends keyof MaintenanceConfig>(
		key: K,
		value: MaintenanceConfig[K]
	) => {
		setConfig((current) => ({ ...current, [key]: value }));
		setDirty(true);
	};

	const addNotice = () => {
		const notice: Notice = {
			id: crypto.randomUUID(),
			message: "",
			severity: "info",
			active: true,
			audience: "all",
			startsAt: "",
			endsAt: "",
		};
		setConfig((current) => ({
			...current,
			notices: [...current.notices, notice],
		}));
		setDirty(true);
	};

	const updateNotice = (id: string, patch: Partial<Notice>) => {
		setConfig((current) => ({
			...current,
			notices: current.notices.map((notice) =>
				notice.id === id ? { ...notice, ...patch } : notice
			),
		}));
		setDirty(true);
	};

	const removeNotice = (id: string) => {
		setConfig((current) => ({
			...current,
			notices: current.notices.filter((notice) => notice.id !== id),
		}));
		setDirty(true);
	};

	const validate = () => {
		if (config.maintenanceMode && !config.message.trim()) {
			toast.error("Maintenance mode requires a message for users.");
			return false;
		}
		if (
			!Number.isInteger(config.scheduledDurationMinutes) ||
			config.scheduledDurationMinutes < 1 ||
			config.scheduledDurationMinutes > 10080
		) {
			toast.error("Duration must be between 1 and 10,080 minutes.");
			return false;
		}
		if (
			!Number.isInteger(config.notifyUsersAheadHours) ||
			config.notifyUsersAheadHours < 0 ||
			config.notifyUsersAheadHours > 720
		) {
			toast.error("Advance notice must be between 0 and 720 hours.");
			return false;
		}
		if (config.scheduledStart) {
			const start = new Date(config.scheduledStart);
			if (Number.isNaN(start.getTime())) {
				toast.error("Enter a valid maintenance start date and time.");
				return false;
			}
			if (start.getTime() <= Date.now()) {
				toast.error("Scheduled maintenance must start in the future.");
				return false;
			}
		}
		if (config.emergencyMaintenance && !config.maintenanceMode) {
			toast.error("Enable maintenance mode for emergency maintenance.");
			return false;
		}
		if (config.emergencyMaintenance && config.scheduledStart) {
			toast.error(
				"Emergency maintenance cannot use a scheduled start time. Clear the scheduled start first."
			);
			return false;
		}
		if (config.noticeBannerEnabled) {
			const invalid = config.notices.find(
				(notice) => !notice.message.trim()
			);
			if (invalid) {
				toast.error("Every notice needs a message.");
				return false;
			}
		}
		for (const notice of config.notices) {
			if (notice.startsAt && notice.endsAt) {
				if (
					new Date(notice.endsAt).getTime() <=
					new Date(notice.startsAt).getTime()
				) {
					toast.error(
						"Each notice end time must be later than its start time."
					);
					return false;
				}
			}
		}
		if (config.noticeBannerEnabled && !changeReason.trim()) {
			toast.error("Enter a reason before applying notice changes.");
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
				maintenance_mode: config.maintenanceMode,
				emergency_maintenance: config.emergencyMaintenance,
				allow_staff_access: config.allowStaffAccess,
				message: config.message.trim(),
				scheduled_start: config.scheduledStart || null,
				scheduled_duration_minutes: config.scheduledDurationMinutes,
				notify_users_ahead_hours: config.notifyUsersAheadHours,
				notice_banner_enabled: config.noticeBannerEnabled,
				notices: config.notices.map((notice) => ({
					id: notice.id,
					message: notice.message.trim(),
					severity: notice.severity,
					active: notice.active,
					audience: notice.audience,
					starts_at: notice.startsAt || null,
					ends_at: notice.endsAt || null,
				})),
				change_reason: changeReason.trim(),
			};

			const res = await http.post(
				"/admin/config/maintenance/update/",
				payload
			);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(
					resp.data || "Could not save the maintenance configuration."
				);
				return;
			}
			toast.success("Maintenance configuration saved. Change logged.");
			await fetchAll();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					"Could not save the maintenance configuration."
			);
		} finally {
			setSaving(false);
		}
	};

	const handleDiscard = async () => {
		setChangeReason("");
		await fetchAll();
		toast.message("Changes discarded.");
	};

	const activeNotices = useMemo(
		() => config.notices.filter((notice) => notice.active).length,
		[config.notices]
	);

	if (loading) {
		return (
			<AppShell
				title="Maintenance & Notices"
				eyebrow="Administration · Platform Control"
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
				title="Maintenance & Notices"
				eyebrow="Administration · Platform Control"
			>
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load maintenance configuration
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
			title="Maintenance & Notices"
			eyebrow="Administration · Platform Control"
		>
			<div className="space-y-6 pb-8">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div className="min-w-0">
						<Link
							to="/admin/configuration"
							className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-orange"
						>
							<ArrowLeft className="size-3.5" />
							Back to configuration
						</Link>
						<h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
							Maintenance &amp; Notices
						</h2>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
							Prepare maintenance windows, configure maintenance messaging
							and manage notices for customers and portal users. Every
							change is logged.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{config.maintenanceMode && (
							<StatusBadge
								label={
									config.emergencyMaintenance
										? "Emergency maintenance ON"
										: "Maintenance ON"
								}
								tone="critical"
							/>
						)}
						{dirty && (
							<StatusBadge label="Unsaved changes" tone="warning" />
						)}
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-3">
					<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<div className="flex items-center justify-between">
							<p className="text-xs text-ink-soft">Maintenance mode</p>
							<Wrench className="size-4 text-orange" />
						</div>
						<p className="mt-3 text-lg font-bold text-ink">
							{config.maintenanceMode ? "On" : "Off"}
						</p>
						<p className="mt-1 text-xs text-ink-soft">
							{config.allowStaffAccess
								? "Staff consoles remain available"
								: "All access disabled"}
						</p>
					</div>
					<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<div className="flex items-center justify-between">
							<p className="text-xs text-ink-soft">Configured notices</p>
							<Megaphone className="size-4 text-orange" />
						</div>
						<p className="mt-3 text-lg font-bold text-ink">
							{config.notices.length}
						</p>
						<p className="mt-1 text-xs text-ink-soft">
							{activeNotices} marked active
						</p>
					</div>
					<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<div className="flex items-center justify-between">
							<p className="text-xs text-ink-soft">Scheduled start</p>
							<CalendarClock className="size-4 text-orange" />
						</div>
						<p className="mt-3 text-lg font-bold text-ink">
							{config.scheduledStart
								? new Date(config.scheduledStart).toLocaleString()
								: "Not scheduled"}
						</p>
						<p className="mt-1 text-xs text-ink-soft">
							Advance notice {config.notifyUsersAheadHours}h
						</p>
					</div>
				</div>

				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="border-b border-line p-5">
						<h3 className="font-display text-sm font-bold text-ink">
							Maintenance mode
						</h3>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Prepare the public-facing maintenance behaviour and
							message.
						</p>
					</div>

					<ul className="divide-y divide-line">
						<RuleRow
							icon={Wrench}
							label="Maintenance mode"
							description="Show the maintenance page to public and portal users."
							checked={config.maintenanceMode}
							onChange={(value) => {
								update("maintenanceMode", value);
								if (!value) {
									update("emergencyMaintenance", false);
								}
							}}
						/>
						<RuleRow
							icon={AlertTriangle}
							label="Emergency maintenance"
							description="Mark this as urgent, unscheduled maintenance. Forces maintenance mode on and clears any scheduled start."
							checked={config.emergencyMaintenance}
							onChange={(value) => {
								update("emergencyMaintenance", value);
								if (value) {
									update("maintenanceMode", true);
									update("scheduledStart", "");
								}
							}}
						/>
						<RuleRow
							icon={ShieldCheck}
							label="Allow staff access"
							description="Keep internal staff consoles available where technically safe."
							checked={config.allowStaffAccess}
							onChange={(value) => update("allowStaffAccess", value)}
						/>
					</ul>

					{config.maintenanceMode && (
						<div className="border-t border-line p-5">
							<label className="block">
								<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<Megaphone className="size-3.5 text-orange" />
									Maintenance message
								</span>
								<textarea
									value={config.message}
									onChange={(event) =>
										update("message", event.target.value)
									}
									maxLength={1000}
									placeholder="Message displayed to users during maintenance."
									className="mt-2 min-h-28 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/25"
								/>
								<span className="mt-1 block text-right text-[10px] text-ink-soft">
									{config.message.length}/1000
								</span>
							</label>
						</div>
					)}
				</section>

				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="border-b border-line p-5">
						<h3 className="font-display text-sm font-bold text-ink">
							Scheduled downtime
						</h3>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Configure the planned start, duration and notification lead
							time.
						</p>
					</div>

					<div className="grid gap-5 p-5 sm:grid-cols-2">
						<label className="block">
							<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								<CalendarClock className="size-3.5 text-orange" />
								Scheduled start
							</span>
							<Input
								type="datetime-local"
								value={config.scheduledStart}
								disabled={config.emergencyMaintenance}
								onChange={(event) =>
									update("scheduledStart", event.target.value)
								}
								className="mt-2 h-11 border-line bg-sand font-mono text-sm text-ink disabled:opacity-50"
							/>
							<span className="mt-1 block text-[10px] text-ink-soft">
								Leave blank when no downtime is scheduled.
							</span>
						</label>

						<NumberField
							label="Scheduled duration"
							icon={Clock}
							unit="minutes"
							value={config.scheduledDurationMinutes}
							min={1}
							max={10080}
							onChange={(value) =>
								update("scheduledDurationMinutes", value)
							}
						/>

						<NumberField
							label="Advance notification"
							icon={Bell}
							unit="hours before start"
							value={config.notifyUsersAheadHours}
							min={0}
							max={720}
							onChange={(value) =>
								update("notifyUsersAheadHours", value)
							}
						/>
					</div>
				</section>

				<section className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
						<div>
							<h3 className="font-display text-sm font-bold text-ink">
								Platform notices
							</h3>
							<p className="mt-1 text-xs leading-5 text-ink-soft">
								Create announcements with severity, audience and optional
								visibility dates.
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<label className="inline-flex items-center gap-2 text-xs text-ink">
								<input
									type="checkbox"
									checked={config.noticeBannerEnabled}
									onChange={(event) =>
										update("noticeBannerEnabled", event.target.checked)
									}
									className="size-4 accent-orange"
								/>
								Enable notice banner
							</label>

							<Button
								type="button"
								variant="outline"
								onClick={addNotice}
								className="border-line bg-paper text-ink hover:bg-sand"
							>
								<Plus className="mr-2 size-4" />
								Add notice
							</Button>
						</div>
					</div>

					{config.notices.length === 0 ? (
						<div className="p-10 text-center">
							<Megaphone className="mx-auto size-8 text-ink-soft" />
							<p className="mt-3 text-sm font-semibold text-ink">
								No notices configured
							</p>
							<p className="mt-1 text-xs text-ink-soft">
								Add a notice to prepare an announcement.
							</p>
						</div>
					) : (
						<ul className="divide-y divide-line">
							{config.notices.map((notice, index) => (
								<li key={notice.id} className="space-y-4 p-5">
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div className="flex flex-wrap items-center gap-2">
											<span className="text-sm font-semibold text-ink">
												Notice {index + 1}
											</span>
											<StatusBadge
												label={notice.severity}
												tone={severityTone[notice.severity]}
											/>
											<StatusBadge
												label={notice.active ? "Active" : "Inactive"}
												tone={notice.active ? "success" : "neutral"}
											/>
										</div>

										<Button
											type="button"
											variant="ghost"
											onClick={() => removeNotice(notice.id)}
											className="text-carmine hover:bg-carmine/10"
										>
											<Trash2 className="mr-2 size-4" />
											Remove
										</Button>
									</div>

									<label className="block">
										<span className="text-xs font-medium text-ink">
											Notice message
										</span>
										<textarea
											value={notice.message}
											onChange={(event) =>
												updateNotice(notice.id, {
													message: event.target.value,
												})
											}
											maxLength={1000}
											placeholder="Write a clear message for the selected audience."
											className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
										/>
										<span className="mt-1 block text-right text-[10px] text-ink-soft">
											{notice.message.length}/1000
										</span>
									</label>

									<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
										<label className="block">
											<span className="text-xs font-medium text-ink">
												Severity
											</span>
											<select
												value={notice.severity}
												onChange={(event) =>
													updateNotice(notice.id, {
														severity: event.target.value as Severity,
													})
												}
												className="mt-2 h-10 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
											>
												<option value="info">Information</option>
												<option value="warning">Warning</option>
												<option value="critical">Critical</option>
											</select>
										</label>

										<label className="block">
											<span className="text-xs font-medium text-ink">
												Audience
											</span>
											<select
												value={notice.audience}
												onChange={(event) =>
													updateNotice(notice.id, {
														audience: event.target.value as Audience,
													})
												}
												className="mt-2 h-10 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
											>
												<option value="public">Public website</option>
												<option value="portal">Customer portal</option>
												<option value="all">All audiences</option>
											</select>
										</label>

										<label className="block">
											<span className="text-xs font-medium text-ink">
												Start showing
											</span>
											<Input
												type="datetime-local"
												value={notice.startsAt}
												onChange={(event) =>
													updateNotice(notice.id, {
														startsAt: event.target.value,
													})
												}
												className="mt-2 h-10 border-line bg-sand text-xs text-ink"
											/>
										</label>

										<label className="block">
											<span className="text-xs font-medium text-ink">
												Stop showing
											</span>
											<Input
												type="datetime-local"
												value={notice.endsAt}
												onChange={(event) =>
													updateNotice(notice.id, {
														endsAt: event.target.value,
													})
												}
												className="mt-2 h-10 border-line bg-sand text-xs text-ink"
											/>
										</label>
									</div>

									<label className="inline-flex items-center gap-2 text-xs text-ink">
										<input
											type="checkbox"
											checked={notice.active}
											onChange={(event) =>
												updateNotice(notice.id, {
													active: event.target.checked,
												})
											}
											className="size-4 accent-orange"
										/>
										Mark this notice active
									</label>
								</li>
							))}
						</ul>
					)}
				</section>

				{dirty && (
					<section className="rounded-2xl bg-paper p-5 ring-1 ring-line">
						<label className="block">
							<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								<AlertTriangle className="size-3.5 text-orange" />
								Reason for change
								<span className="text-coral">*</span>
							</span>
							<textarea
								value={changeReason}
								onChange={(event) => setChangeReason(event.target.value)}
								maxLength={500}
								rows={3}
								placeholder="Explain why this configuration is being changed."
								className="mt-2 w-full rounded-md border border-line bg-sand p-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
							/>
							<span className="mt-1 block text-right font-mono text-[10px] text-ink-soft">
								{changeReason.length}/500
							</span>
						</label>
					</section>
				)}

				<div className="rounded-xl border border-line bg-paper p-4">
					<div className="flex items-start gap-3">
						<AlertTriangle className="mt-0.5 size-5 shrink-0 text-orange-deep" />
						<div>
							<p className="text-sm font-semibold text-ink">
								Operational resilience
							</p>
							<p className="mt-1 text-xs leading-5 text-ink-soft">
								Critical operations — gate decisions, queued transactions
								and reconciliation — continue during public maintenance
								according to the offline operating policy. Staff access
								remains protected by server-side authentication and
								authorisation.
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
									? "Save to apply maintenance mode, downtime, and notice changes."
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
								<Save className="mr-2 size-4" />
								{saving ? "Saving…" : "Save changes"}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</AppShell>
	);
}