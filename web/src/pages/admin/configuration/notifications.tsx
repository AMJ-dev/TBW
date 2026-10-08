import { useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	Bell,
	Mail,
	MessageSquare,
	Megaphone,
	Plus,
	Save,
	Send,
	ShieldCheck,
	Smartphone,
	Trash2,
	Clock,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Channel = "in_app" | "email" | "sms" | "whatsapp";

interface NotificationEvent {
	id: string;
	key: string;
	label: string;
	channels: Channel[];
	template: string;
	mandatory: boolean;
}

interface NotificationConfig {
	channelsEnabled: Record<Channel, boolean>;
	quietHoursEnabled: boolean;
	quietHoursStart: string;
	quietHoursEnd: string;
	rateLimitPerHour: number;
	digestFrequency: "immediate" | "hourly" | "daily";
	fallbackChannelEnabled: boolean;
	retryCount: number;
	trackDeliveryStatus: boolean;
	transactionalMarketingSplit: boolean;
	events: NotificationEvent[];
}

const channelMeta: Record<Channel, { label: string; icon: typeof Mail }> = {
	in_app: { label: "In-app", icon: Bell },
	email: { label: "Email", icon: Mail },
	sms: { label: "SMS", icon: Smartphone },
	whatsapp: { label: "WhatsApp", icon: MessageSquare },
};

const initialConfig: NotificationConfig = {
	channelsEnabled: {
		in_app: true,
		email: true,
		sms: true,
		whatsapp: true,
	},
	quietHoursEnabled: true,
	quietHoursStart: "22:00",
	quietHoursEnd: "07:00",
	rateLimitPerHour: 10,
	digestFrequency: "immediate",
	fallbackChannelEnabled: true,
	retryCount: 3,
	trackDeliveryStatus: true,
	transactionalMarketingSplit: true,
	events: [
		{ id: "e-1", key: "cargo_received", label: "Cargo received", channels: ["in_app", "email", "sms"], template: "cargo-received-v2", mandatory: false },
		{ id: "e-2", key: "cargo_positioned", label: "Cargo positioned", channels: ["in_app", "email"], template: "cargo-positioned-v1", mandatory: false },
		{ id: "e-3", key: "document_issued", label: "Document issued", channels: ["in_app", "email"], template: "document-issued-v3", mandatory: false },
		{ id: "e-4", key: "examination_scheduled", label: "Examination scheduled", channels: ["in_app", "email", "sms"], template: "exam-scheduled-v1", mandatory: false },
		{ id: "e-5", key: "hold_placed", label: "Hold placed", channels: ["in_app", "email", "sms"], template: "hold-placed-v2", mandatory: true },
		{ id: "e-6", key: "invoice_issued", label: "Invoice issued", channels: ["in_app", "email"], template: "invoice-issued-v1", mandatory: false },
		{ id: "e-7", key: "payment_received", label: "Payment received", channels: ["in_app", "email"], template: "payment-received-v2", mandatory: false },
		{ id: "e-8", key: "release_authorised", label: "Release authorised", channels: ["in_app", "email", "sms"], template: "release-authorised-v2", mandatory: true },
		{ id: "e-9", key: "slot_confirmed", label: "Slot confirmed", channels: ["in_app", "email", "sms"], template: "slot-confirmed-v1", mandatory: false },
		{ id: "e-10", key: "storage_deadline", label: "Storage deadline approaching", channels: ["in_app", "email", "sms"], template: "storage-deadline-v1", mandatory: false },
		{ id: "e-11", key: "overstay_escalation", label: "Overstay escalation", channels: ["in_app", "email", "sms"], template: "overstay-escalation-v1", mandatory: false },
		{ id: "e-12", key: "collection_ready", label: "Ready for collection", channels: ["in_app", "email", "sms"], template: "collection-ready-v2", mandatory: false },
	],
};

export default function AdminNotificationsConfigurationPage() {
	const [config, setConfig] = useState<NotificationConfig>(initialConfig);
	const [dirty, setDirty] = useState(false);

	const markDirty = () => setDirty(true);

	const update = <K extends keyof NotificationConfig>(
		key: K,
		value: NotificationConfig[K]
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		markDirty();
	};

	const toggleChannel = (channel: Channel) => {
		setConfig((prev) => ({
			...prev,
			channelsEnabled: {
				...prev.channelsEnabled,
				[channel]: !prev.channelsEnabled[channel],
			},
		}));
		markDirty();
	};

	const toggleEventChannel = (eventId: string, channel: Channel) => {
		setConfig((prev) => ({
			...prev,
			events: prev.events.map((e) =>
				e.id === eventId
					? {
							...e,
							channels: e.channels.includes(channel)
								? e.channels.filter((c) => c !== channel)
								: [...e.channels, channel],
					  }
					: e
			),
		}));
		markDirty();
	};

	const addEvent = () => {
		setConfig((prev) => ({
			...prev,
			events: [
				...prev.events,
				{
					id: `e-${Date.now()}`,
					key: "",
					label: "",
					channels: ["in_app", "email"],
					template: "",
					mandatory: false,
				},
			],
		}));
		markDirty();
	};

	const updateEvent = (id: string, patch: Partial<NotificationEvent>) => {
		setConfig((prev) => ({
			...prev,
			events: prev.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
		}));
		markDirty();
	};

	const removeEvent = (id: string) => {
		setConfig((prev) => ({
			...prev,
			events: prev.events.filter((e) => e.id !== id),
		}));
		markDirty();
	};

	const handleSave = () => {
		if (config.quietHoursEnabled && !config.quietHoursStart) {
			toast.error("Provide a quiet hours start time.");
			return;
		}
		const badEvent = config.events.find((e) => !e.key.trim() || !e.label.trim() || !e.template.trim());
		if (badEvent) {
			toast.error("Every event needs a key, label, and template.");
			return;
		}
		toast.success("Notification configuration saved. Change logged.");
		setDirty(false);
	};

	const handleDiscard = () => {
		setConfig(initialConfig);
		setDirty(false);
		toast.message("Changes discarded.");
	};

	return (
		<AppShell
			title="Notifications"
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
						Notifications &amp; Messaging
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Configure notification events, channels, templates, delivery
						behaviour, retries, fallback channels, and per-user preferences.
						Transactional and marketing messaging are separated.
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
							Event-driven dispatch
						</p>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Notifications are triggered by lifecycle events, not sent
							manually. Every dispatch records recipient, event, channel,
							template, payload, and delivery status. Mandatory events cannot
							be disabled by users.
						</p>
					</div>
				</div>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Channels
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Delivery channels available across the platform. Disabling a channel
						suppresses dispatch on it globally.
					</p>
				</div>
				<ul className="divide-y divide-line">
					{(Object.keys(channelMeta) as Channel[]).map((c) => {
						const meta = channelMeta[c];
						const Icon = meta.icon;
						const on = config.channelsEnabled[c];
						return (
							<li
								key={c}
								className="flex flex-wrap items-start justify-between gap-4 p-5"
							>
								<div className="flex min-w-[240px] flex-1 items-start gap-3">
									<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
										<Icon className="size-4" />
									</div>
									<div className="min-w-0">
										<p className="text-[13px] font-semibold text-ink">
											{meta.label}
										</p>
										<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
											{c === "in_app" && "Portal and in-app notifications."}
											{c === "email" && "SPF, DKIM, DMARC configured on Client domain."}
											{c === "sms" && "Nigerian aggregator with delivery receipts and sender ID."}
											{c === "whatsapp" && "Business API with approved templates only."}
										</p>
									</div>
								</div>
								<button
									type="button"
									onClick={() => toggleChannel(c)}
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
					})}
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Delivery Behaviour
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Quiet hours, rate limits, digests, retries, and fallbacks apply across
						all channels.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<RuleRow
						icon={Clock}
						label="Quiet hours"
						desc="Suppress non-mandatory notifications during these hours; queue for next active window."
						on={config.quietHoursEnabled}
						onToggle={() =>
							update("quietHoursEnabled", !config.quietHoursEnabled)
						}
					/>
					{config.quietHoursEnabled && (
						<div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
							<Field
								label="Quiet hours start"
								icon={Clock}
								value={config.quietHoursStart}
								onChange={(v) => update("quietHoursStart", v)}
								placeholder="22:00"
								mono
							/>
							<Field
								label="Quiet hours end"
								icon={Clock}
								value={config.quietHoursEnd}
								onChange={(v) => update("quietHoursEnd", v)}
								placeholder="07:00"
								mono
							/>
						</div>
					)}
					<div className="flex flex-wrap items-start justify-between gap-4 p-5">
						<div className="flex min-w-[240px] flex-1 items-start gap-3">
							<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
								<Send className="size-4" />
							</div>
							<div className="min-w-0">
								<p className="text-[13px] font-semibold text-ink">
									Rate limit per recipient
								</p>
								<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
									Maximum notifications per hour to a single recipient.
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Input
								value={String(config.rateLimitPerHour)}
								onChange={(e) =>
									update("rateLimitPerHour", Number(e.target.value) || 0)
								}
								className="h-9 w-24 border-line bg-sand font-mono text-sm text-ink"
							/>
							<span className="font-mono text-[11px] text-ink-soft">
								per hour
							</span>
						</div>
					</div>
					<div className="flex flex-wrap items-start justify-between gap-4 p-5">
						<div className="flex min-w-[240px] flex-1 items-start gap-3">
							<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
								<Clock className="size-4" />
							</div>
							<div className="min-w-0">
								<p className="text-[13px] font-semibold text-ink">
									Digest frequency
								</p>
								<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
									How non-urgent notifications are grouped.
								</p>
							</div>
						</div>
						<select
							value={config.digestFrequency}
							onChange={(e) =>
								update(
									"digestFrequency",
									e.target.value as NotificationConfig["digestFrequency"]
								)
							}
							className="h-9 rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
						>
							<option value="immediate">Immediate</option>
							<option value="hourly">Hourly digest</option>
							<option value="daily">Daily digest</option>
						</select>
					</div>
					<RuleRow
						icon={Send}
						label="Fallback channels"
						desc="Retry on a secondary channel when primary delivery fails."
						on={config.fallbackChannelEnabled}
						onToggle={() =>
							update(
								"fallbackChannelEnabled",
								!config.fallbackChannelEnabled
							)
						}
					/>
					<RuleRow
						icon={Send}
						label="Track delivery status"
						desc="Record per-recipient delivery and read status."
						on={config.trackDeliveryStatus}
						onToggle={() =>
							update("trackDeliveryStatus", !config.trackDeliveryStatus)
						}
					/>
					<RuleRow
						icon={ShieldCheck}
						label="Transactional / marketing separation"
						desc="Keep transactional and marketing messages distinct for compliance and opt-out."
						on={config.transactionalMarketingSplit}
						onToggle={() =>
							update(
								"transactionalMarketingSplit",
								!config.transactionalMarketingSplit
							)
						}
					/>
					<div className="flex flex-wrap items-start justify-between gap-4 p-5">
						<div className="flex min-w-[240px] flex-1 items-start gap-3">
							<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
								<Send className="size-4" />
							</div>
							<div className="min-w-0">
								<p className="text-[13px] font-semibold text-ink">
									Delivery retry count
								</p>
								<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
									Attempts before a notification is moved to failed status.
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Input
								value={String(config.retryCount)}
								onChange={(e) =>
									update("retryCount", Number(e.target.value) || 0)
								}
								className="h-9 w-24 border-line bg-sand font-mono text-sm text-ink"
							/>
							<span className="font-mono text-[11px] text-ink-soft">
								attempts
							</span>
						</div>
					</div>
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
					<div>
						<h3 className="font-display text-sm font-bold text-ink">
							Notification Events
						</h3>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Events the platform can dispatch. Mandatory events ignore user
							preferences and quiet hours.
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addEvent}
						className="border-line bg-paper text-ink hover:bg-sand"
					>
						<Plus className="size-3.5" />
						Add event
					</Button>
				</div>

				{config.events.length === 0 ? (
					<div className="p-6 text-center text-sm text-ink-soft">
						No events configured.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[1000px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">Event</th>
									<th className="px-4 py-3 font-medium">Template</th>
									<th className="px-4 py-3 font-medium text-center">
										In-app
									</th>
									<th className="px-4 py-3 font-medium text-center">Email</th>
									<th className="px-4 py-3 font-medium text-center">SMS</th>
									<th className="px-4 py-3 font-medium text-center">
										WhatsApp
									</th>
									<th className="px-4 py-3 font-medium text-center">
										Mandatory
									</th>
									<th className="px-4 py-3 font-medium text-right">
										Action
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{config.events.map((e) => (
									<tr key={e.id} className="hover:bg-sand/40">
										<td className="px-4 py-3">
											<div className="space-y-1.5">
												<Input
													value={e.label}
													onChange={(ev) =>
														updateEvent(e.id, { label: ev.target.value })
													}
													className="h-8 border-line bg-paper text-xs text-ink"
												/>
												<Input
													value={e.key}
													onChange={(ev) =>
														updateEvent(e.id, { key: ev.target.value })
													}
													className="h-7 border-line bg-paper font-mono text-[10px] text-ink-soft"
												/>
											</div>
										</td>
										<td className="px-4 py-3">
											<Input
												value={e.template}
												onChange={(ev) =>
													updateEvent(e.id, { template: ev.target.value })
												}
												className="h-9 border-line bg-paper font-mono text-[11px] text-ink"
											/>
										</td>
										{(["in_app", "email", "sms", "whatsapp"] as Channel[]).map(
											(c) => (
												<td key={c} className="px-4 py-3 text-center">
													<input
														type="checkbox"
														checked={e.channels.includes(c)}
														onChange={() => toggleEventChannel(e.id, c)}
														className="size-4 accent-orange"
													/>
												</td>
											)
										)}
										<td className="px-4 py-3 text-center">
											<input
												type="checkbox"
												checked={e.mandatory}
												onChange={(ev) =>
													updateEvent(e.id, {
														mandatory: ev.target.checked,
													})
												}
												className="size-4 accent-orange"
											/>
										</td>
										<td className="px-4 py-3 text-right">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => removeEvent(e.id)}
												className="text-carmine hover:bg-carmine/10"
											>
												<Trash2 className="size-3.5" />
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							Messaging compliance &amp; user preferences
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							SMS dispatch respects NCC requirements and sender ID
							registration. WhatsApp uses approved templates only. Marketing
							messages require opt-in and can be opted out at any time;
							transactional messages are delivered regardless. Per-user
							preferences and quiet hours apply on top of these controls, except
							for mandatory events.
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
	icon: typeof Clock;
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

function RuleRow({
	icon: Icon,
	label,
	desc,
	on,
	onToggle,
}: {
	icon: typeof Bell;
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