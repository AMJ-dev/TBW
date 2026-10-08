import { useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	CircleDollarSign,
	Container,
	FileSpreadsheet,
	Landmark,
	MessageSquare,
	Network,
	RefreshCcw,
	Save,
	ShieldCheck,
	Ship,
	Smartphone,
	Truck,
	type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type IntegrationTone = "success" | "warning" | "info" | "critical";

interface Integration {
	id: string;
	name: string;
	desc: string;
	icon: LucideIcon;
	status: string;
	tone: IntegrationTone;
	enabled: boolean;
	retryCount: number;
	healthLabel: string;
}

interface IntegrationsConfig {
	correlationIdLogging: boolean;
	deadLetterQueueEnabled: boolean;
	circuitBreakerEnabled: boolean;
	schemaValidationRequired: boolean;
	manualFallbackRequired: boolean;
	retryBackoffSeconds: number;
	integrations: Integration[];
}

const initialConfig: IntegrationsConfig = {
	correlationIdLogging: true,
	deadLetterQueueEnabled: true,
	circuitBreakerEnabled: true,
	schemaValidationRequired: true,
	manualFallbackRequired: true,
	retryBackoffSeconds: 30,
	integrations: [
		{
			id: "i-1",
			name: "NCS / B'Odogwu",
			desc: "Manifest and declaration references, status alignment, examination reference, and release authorisation reference where an approved interface exists.",
			icon: ShieldCheck,
			status: "Manual gateway",
			tone: "warning",
			enabled: true,
			retryCount: 3,
			healthLabel: "Officer-keyed reference capture active",
		},
		{
			id: "i-2",
			name: "Shipping lines & carriers",
			desc: "Line API where available, EDI (BAPLIE, COPARN, CODECO, COARRI, COPRAR), CSV/XLSX fallback, and EIR exchange.",
			icon: Ship,
			status: "Partial",
			tone: "info",
			enabled: true,
			retryCount: 3,
			healthLabel: "EDI + CSV fallback",
		},
		{
			id: "i-3",
			name: "Payment gateway",
			desc: "Gateway-hosted payment flow with signed webhooks and idempotency. No cardholder data on platform-controlled systems.",
			icon: CircleDollarSign,
			status: "Active",
			tone: "success",
			enabled: true,
			retryCount: 3,
			healthLabel: "Webhook signature verified",
		},
		{
			id: "i-4",
			name: "Bank reconciliation",
			desc: "Virtual/dedicated account where supported; statement import fallback with manual exception queue.",
			icon: Landmark,
			status: "Active",
			tone: "success",
			enabled: true,
			retryCount: 3,
			healthLabel: "Statement import running",
		},
		{
			id: "i-5",
			name: "Email",
			desc: "SPF, DKIM, and DMARC configured on the Client domain. Delivery status tracked per recipient.",
			icon: MessageSquare,
			status: "Active",
			tone: "success",
			enabled: true,
			retryCount: 3,
			healthLabel: "Domain authenticated",
		},
		{
			id: "i-6",
			name: "SMS aggregator",
			desc: "Nigerian aggregator with delivery receipts and registered sender ID.",
			icon: Smartphone,
			status: "Active",
			tone: "success",
			enabled: true,
			retryCount: 3,
			healthLabel: "Sender ID registered",
		},
		{
			id: "i-7",
			name: "WhatsApp Business API",
			desc: "Approved templates only. Delivery and read receipts captured where available.",
			icon: MessageSquare,
			status: "Active",
			tone: "success",
			enabled: true,
			retryCount: 3,
			healthLabel: "Templates approved",
		},
		{
			id: "i-8",
			name: "Accounting / ERP",
			desc: "API adapter or scheduled export to the accounting system. Customer master source-of-truth agreed during Discovery.",
			icon: FileSpreadsheet,
			status: "Scheduled export",
			tone: "info",
			enabled: true,
			retryCount: 3,
			healthLabel: "Daily export scheduled",
		},
		{
			id: "i-9",
			name: "Weighbridge",
			desc: "Serial/TCP weight ticket capture with operator attribution.",
			icon: Truck,
			status: "Active",
			tone: "success",
			enabled: true,
			retryCount: 3,
			healthLabel: "Ticket capture healthy",
		},
		{
			id: "i-10",
			name: "ANPR / barriers / ACS",
			desc: "Plate recognition and booking-validated barrier commands with manual fallback. Optional per site.",
			icon: Container,
			status: "Manual fallback",
			tone: "info",
			enabled: false,
			retryCount: 3,
			healthLabel: "Disabled — manual gate flow active",
		},
	],
};

export default function AdminIntegrationsConfigurationPage() {
	const [config, setConfig] = useState<IntegrationsConfig>(initialConfig);
	const [dirty, setDirty] = useState(false);

	const markDirty = () => setDirty(true);

	const update = <K extends keyof IntegrationsConfig>(
		key: K,
		value: IntegrationsConfig[K]
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		markDirty();
	};

	const toggleIntegration = (id: string) => {
		setConfig((prev) => ({
			...prev,
			integrations: prev.integrations.map((i) =>
				i.id === id ? { ...i, enabled: !i.enabled } : i
			),
		}));
		markDirty();
	};

	const updateRetry = (id: string, count: number) => {
		setConfig((prev) => ({
			...prev,
			integrations: prev.integrations.map((i) =>
				i.id === id ? { ...i, retryCount: count } : i
			),
		}));
		markDirty();
	};

	const handleSave = () => {
		if (config.retryBackoffSeconds < 1) {
			toast.error("Retry backoff must be at least 1 second.");
			return;
		}
		toast.success("Integration configuration saved. Change logged.");
		setDirty(false);
	};

	const handleDiscard = () => {
		setConfig(initialConfig);
		setDirty(false);
		toast.message("Changes discarded.");
	};

	return (
		<AppShell
			title="Integrations"
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
						Integrations
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Manage integration adapters, enable or disable them independently,
						and configure retry behaviour. Every adapter has a manual fallback;
						no integration failure blocks operations.
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
							Manual fallback for every integration
						</p>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Each adapter has a documented manual path. Invalid inbound
							payloads are quarantined; failed outbound messages route to the
							dead-letter queue for administrator replay. All exchanges are
							correlated and logged end-to-end.
						</p>
					</div>
				</div>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Integration Controls
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Cross-cutting behaviour applied to every adapter.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<RuleRow
						icon={Network}
						label="Correlation ID logging"
						desc="Attach a correlation ID to every request and response across adapters."
						on={config.correlationIdLogging}
						onToggle={() =>
							update("correlationIdLogging", !config.correlationIdLogging)
						}
					/>
					<RuleRow
						icon={RefreshCcw}
						label="Dead-letter queue with admin replay"
						desc="Failed messages retained and replayable by an administrator."
						on={config.deadLetterQueueEnabled}
						onToggle={() =>
							update(
								"deadLetterQueueEnabled",
								!config.deadLetterQueueEnabled
							)
						}
					/>
					<RuleRow
						icon={ShieldCheck}
						label="Circuit breaker"
						desc="Pause dispatch to an adapter after repeated failures and reopen automatically."
						on={config.circuitBreakerEnabled}
						onToggle={() =>
							update("circuitBreakerEnabled", !config.circuitBreakerEnabled)
						}
					/>
					<RuleRow
						icon={ShieldCheck}
						label="Schema validation and quarantine"
						desc="Reject and quarantine inbound payloads that fail schema validation."
						on={config.schemaValidationRequired}
						onToggle={() =>
							update(
								"schemaValidationRequired",
								!config.schemaValidationRequired
							)
						}
					/>
					<RuleRow
						icon={ShieldCheck}
						label="Enforce manual fallback"
						desc="Require a documented manual path for every enabled adapter."
						on={config.manualFallbackRequired}
						onToggle={() =>
							update(
								"manualFallbackRequired",
								!config.manualFallbackRequired
							)
						}
					/>
					<div className="flex flex-wrap items-start justify-between gap-4 p-5">
						<div className="flex min-w-[240px] flex-1 items-start gap-3">
							<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
								<RefreshCcw className="size-4" />
							</div>
							<div className="min-w-0">
								<p className="text-[13px] font-semibold text-ink">
									Retry backoff base
								</p>
								<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
									Base interval for exponential retry/backoff across adapters.
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Input
								value={String(config.retryBackoffSeconds)}
								onChange={(e) =>
									update(
										"retryBackoffSeconds",
										Number(e.target.value) || 0
									)
								}
								className="h-9 w-24 border-line bg-sand font-mono text-sm text-ink"
							/>
							<span className="font-mono text-[11px] text-ink-soft">
								seconds
							</span>
						</div>
					</div>
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Adapters
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Each adapter can be enabled or disabled independently. Disabling an
						adapter falls back to the manual path.
					</p>
				</div>
				<ul className="divide-y divide-line">
					{config.integrations.map((i) => {
						const Icon = i.icon;
						return (
							<li key={i.id} className="p-5">
								<div className="flex flex-wrap items-start gap-4">
									<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
										<Icon className="size-5" />
									</div>

									<div className="min-w-[260px] flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<p className="text-[13px] font-semibold text-ink">
												{i.name}
											</p>
											<StatusBadge label={i.status} tone={i.tone} />
											<StatusBadge
												label={i.enabled ? "Enabled" : "Disabled"}
												tone={i.enabled ? "success" : "neutral"}
											/>
										</div>
										<p className="mt-1 text-[11px] leading-5 text-ink-soft">
											{i.desc}
										</p>
										<p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											Health · {i.healthLabel}
										</p>
									</div>

									<div className="flex flex-col items-end gap-2">
										<button
											type="button"
											onClick={() => toggleIntegration(i.id)}
											aria-pressed={i.enabled}
											className={cn(
												"inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
												i.enabled ? "bg-orange" : "bg-sand-2"
											)}
										>
											<span
												className={cn(
													"size-5 rounded-full bg-white shadow-sm transition-transform",
													i.enabled
														? "translate-x-5"
														: "translate-x-0.5"
												)}
											/>
										</button>
										<div className="flex items-center gap-2">
											<span className="font-mono text-[10px] text-ink-soft">
												retries
											</span>
											<Input
												value={String(i.retryCount)}
												onChange={(e) =>
													updateRetry(
														i.id,
														Number(e.target.value) || 0
													)
												}
												className="h-8 w-16 border-line bg-sand font-mono text-xs text-ink"
											/>
										</div>
									</div>
								</div>
							</li>
						);
					})}
				</ul>
			</section>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							No adapter failure blocks operations
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							The platform degrades, it does not stop. Customs decisions are
							never made by an integration — the platform records what the
							competent authority has provided, whether by API or by an officer
							entering a reference. Integration changes are logged with actor,
							prior value, and reason.
						</p>
					</div>
				</div>
			</div>
		</AppShell>
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