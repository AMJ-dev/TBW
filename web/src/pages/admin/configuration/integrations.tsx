import { useEffect, useMemo, useState } from "react";
import {
	Activity,
	AlertTriangle,
	ArrowLeft,
	Check,
	ChevronDown,
	CircleDollarSign,
	Clock3,
	Eye,
	EyeOff,
	Landmark,
	Mail,
	MessageSquare,
	RefreshCcw,
	Save,
	ShieldCheck,
	Ship,
	Smartphone,
	Webhook,
	type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/components/router-link";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type Environment = "sandbox" | "production";
type FieldKind = "text" | "password" | "email" | "url" | "number";

type IntegrationField = {
	key: string;
	label: string;
	placeholder: string;
	kind: FieldKind;
	required?: boolean;
	secret?: boolean;
};

type Integration = {
	id: string;
	name: string;
	description: string;
	category: string;
	icon: LucideIcon;
	enabled: boolean;
	environment: Environment;
	retryCount: number;
	timeoutSeconds: number;
	fields: IntegrationField[];
};

type IntegrationConfig = {
	correlationIdLogging: boolean;
	deadLetterQueueEnabled: boolean;
	circuitBreakerEnabled: boolean;
	schemaValidationRequired: boolean;
	manualFallbackRequired: boolean;
	retryBackoffSeconds: number;
	integrations: Integration[];
	credentials: Record<string, string>;
};

/**
 * Icon lookup for adapter rows. The server sends an icon name and we map it
 * to the component here — the UI never receives components over the wire.
 */
const iconRegistry: Record<string, LucideIcon> = {
	ShieldCheck,
	Ship,
	CircleDollarSign,
	Landmark,
	Mail,
	Smartphone,
	MessageSquare,
	Webhook,
};

const emptyConfig: IntegrationConfig = {
	correlationIdLogging: true,
	deadLetterQueueEnabled: true,
	circuitBreakerEnabled: true,
	schemaValidationRequired: true,
	manualFallbackRequired: true,
	retryBackoffSeconds: 30,
	integrations: [],
	credentials: {},
};

const normaliseField = (raw: any): IntegrationField => ({
	key: raw?.key ?? "",
	label: raw?.label ?? raw?.name ?? "",
	placeholder: raw?.placeholder ?? "",
	kind: (raw?.kind ?? "text") as FieldKind,
	required: Boolean(raw?.required ?? false),
	secret: Boolean(raw?.secret ?? raw?.kind === "password"),
});

const normaliseIntegration = (raw: any): Integration => ({
	id: String(raw?.id ?? raw?.key ?? crypto.randomUUID()),
	name: raw?.name ?? "",
	description: raw?.description ?? raw?.desc ?? "",
	category: raw?.category ?? "",
	icon:
		iconRegistry[raw?.icon ?? raw?.icon_name ?? "Webhook"] ?? Webhook,
	enabled: Boolean(raw?.enabled ?? false),
	environment: (raw?.environment ?? "sandbox") as Environment,
	retryCount: Number(raw?.retry_count ?? raw?.retryCount ?? 3),
	timeoutSeconds: Number(
		raw?.timeout_seconds ?? raw?.timeoutSeconds ?? 30
	),
	fields: Array.isArray(raw?.fields)
		? raw.fields.map(normaliseField)
		: [],
});

function Toggle({
	checked,
	onChange,
	label,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
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

function SettingRow({
	title,
	description,
	checked,
	onChange,
}: {
	title: string;
	description: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between gap-4 border-b border-line py-4 last:border-b-0">
			<div className="min-w-0">
				<p className="text-sm font-medium text-ink">{title}</p>
				<p className="mt-1 text-xs leading-5 text-ink-soft">
					{description}
				</p>
			</div>
			<Toggle checked={checked} onChange={onChange} label={title} />
		</div>
	);
}

export default function AdminIntegrationsConfigurationPage() {
	const [config, setConfig] = useState<IntegrationConfig>(emptyConfig);
	const [savedConfig, setSavedConfig] =
		useState<IntegrationConfig>(emptyConfig);
	const [dirty, setDirty] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [expanded, setExpanded] = useState<string[]>([]);
	const [revealed, setRevealed] = useState<Set<string>>(new Set());
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("All");

	const fetchAll = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("/admin/config/integrations/");
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load integrations configuration.");
				return;
			}
			const payload: any = resp.code ?? {};

			const rawIntegrations: any[] = Array.isArray(payload.integrations)
				? payload.integrations
				: [];

			const loaded: IntegrationConfig = {
				correlationIdLogging: Boolean(
					payload.correlation_id_logging ??
						payload.correlationIdLogging ??
						true
				),
				deadLetterQueueEnabled: Boolean(
					payload.dead_letter_queue_enabled ??
						payload.deadLetterQueueEnabled ??
						true
				),
				circuitBreakerEnabled: Boolean(
					payload.circuit_breaker_enabled ??
						payload.circuitBreakerEnabled ??
						true
				),
				schemaValidationRequired: Boolean(
					payload.schema_validation_required ??
						payload.schemaValidationRequired ??
						true
				),
				manualFallbackRequired: Boolean(
					payload.manual_fallback_required ??
						payload.manualFallbackRequired ??
						true
				),
				retryBackoffSeconds: Number(
					payload.retry_backoff_seconds ??
						payload.retryBackoffSeconds ??
						30
				),
				integrations: rawIntegrations.map(normaliseIntegration),
				credentials: {},
			};

			setConfig(loaded);
			setSavedConfig(loaded);
			setDirty(false);
			setRevealed(new Set());
		} catch (err: any) {
			setError(
				err?.response?.data?.message ||
					"Could not load integrations configuration."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const markDirty = () => setDirty(true);

	const updateConfig = (patch: Partial<IntegrationConfig>) => {
		setConfig((current) => ({ ...current, ...patch }));
		markDirty();
	};

	const updateIntegration = (id: string, patch: Partial<Integration>) => {
		setConfig((current) => ({
			...current,
			integrations: current.integrations.map((integration) =>
				integration.id === id
					? { ...integration, ...patch }
					: integration
			),
		}));
		markDirty();
	};

	const updateCredential = (key: string, value: string) => {
		setConfig((current) => ({
			...current,
			credentials: { ...current.credentials, [key]: value },
		}));
		markDirty();
	};

	const toggleExpanded = (id: string) => {
		setExpanded((current) =>
			current.includes(id)
				? current.filter((item) => item !== id)
				: [...current, id]
		);
	};

	const toggleReveal = (key: string) => {
		setRevealed((current) => {
			const next = new Set(current);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	const validate = () => {
		if (config.retryBackoffSeconds < 1) {
			toast.error("Retry backoff must be at least one second.");
			return false;
		}
		for (const integration of config.integrations) {
			if (integration.retryCount < 0 || integration.retryCount > 10) {
				toast.error(`${integration.name}: retries must be between 0 and 10.`);
				return false;
			}
			if (
				integration.timeoutSeconds < 1 ||
				integration.timeoutSeconds > 300
			) {
				toast.error(
					`${integration.name}: timeout must be between 1 and 300 seconds.`
				);
				return false;
			}
		}
		return true;
	};

	const handleSave = async () => {
		if (!dirty || saving) return;
		if (!validate()) return;

		setSaving(true);
		try {
			const payload = {
				correlation_id_logging: config.correlationIdLogging,
				dead_letter_queue_enabled: config.deadLetterQueueEnabled,
				circuit_breaker_enabled: config.circuitBreakerEnabled,
				schema_validation_required: config.schemaValidationRequired,
				manual_fallback_required: config.manualFallbackRequired,
				retry_backoff_seconds: config.retryBackoffSeconds,
				integrations: config.integrations.map((integration) => ({
					id: integration.id,
					enabled: integration.enabled,
					environment: integration.environment,
					retry_count: integration.retryCount,
					timeout_seconds: integration.timeoutSeconds,
				})),
				credentials: config.credentials,
			};

			const res = await http.post(
				"/admin/config/integrations/update/",
				payload
			);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(
					resp.data || "Could not save the integrations configuration."
				);
				return;
			}
			toast.success("Integrations configuration saved. Change logged.");
			await fetchAll();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					"Could not save the integrations configuration."
			);
		} finally {
			setSaving(false);
		}
	};

	const handleDiscard = async () => {
		setRevealed(new Set());
		await fetchAll();
		toast.message("Changes discarded.");
	};

	const categories = useMemo(
		() => [
			"All",
			...Array.from(
				new Set(config.integrations.map((item) => item.category))
			),
		],
		[config.integrations]
	);

	const filteredIntegrations = useMemo(() => {
		const query = search.trim().toLowerCase();
		return config.integrations.filter((integration) => {
			const matchesCategory =
				category === "All" || integration.category === category;
			const matchesSearch =
				!query ||
				integration.name.toLowerCase().includes(query) ||
				integration.description.toLowerCase().includes(query) ||
				integration.category.toLowerCase().includes(query);
			return matchesCategory && matchesSearch;
		});
	}, [config.integrations, category, search]);

	const enabledCount = config.integrations.filter(
		(integration) => integration.enabled
	).length;

	if (loading) {
		return (
			<AppShell title="Integrations" eyebrow="Administration · Configuration">
				<div className="flex items-center justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
					<span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
				</div>
			</AppShell>
		);
	}

	if (error) {
		return (
			<AppShell title="Integrations" eyebrow="Administration · Configuration">
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load integrations configuration
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
		<AppShell title="Integrations" eyebrow="Administration · Configuration">
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
							Integration settings
						</h2>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
							Configure external services, connection options, credentials
							and failure-handling rules for the terminal platform. Every
							change is logged.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{dirty && <StatusBadge label="Unsaved changes" tone="warning" />}
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<div className="rounded-xl bg-paper p-4 ring-1 ring-line">
						<div className="flex items-center justify-between gap-3">
							<p className="text-xs text-ink-soft">Configured adapters</p>
							<Activity className="size-4 text-ink-soft" />
						</div>
						<p className="mt-3 font-display text-2xl font-bold text-ink">
							{config.integrations.length}
						</p>
						<p className="mt-1 text-xs text-ink-soft">
							Available integration definitions
						</p>
					</div>
					<div className="rounded-xl bg-paper p-4 ring-1 ring-line">
						<div className="flex items-center justify-between gap-3">
							<p className="text-xs text-ink-soft">Enabled adapters</p>
							<Check className="size-4 text-ink-soft" />
						</div>
						<p className="mt-3 font-display text-2xl font-bold text-ink">
							{enabledCount}
						</p>
						<p className="mt-1 text-xs text-ink-soft">
							Currently active
						</p>
					</div>
					<div className="rounded-xl bg-paper p-4 ring-1 ring-line">
						<div className="flex items-center justify-between gap-3">
							<p className="text-xs text-ink-soft">Retry backoff</p>
							<Clock3 className="size-4 text-ink-soft" />
						</div>
						<div className="mt-3 flex items-center gap-2">
							<Input
								type="number"
								min={1}
								max={3600}
								value={String(config.retryBackoffSeconds)}
								onChange={(event) =>
									updateConfig({
										retryBackoffSeconds: Number(event.target.value),
									})
								}
								className="h-9 w-24 border-line bg-sand font-mono text-sm text-ink"
							/>
							<span className="text-xs text-ink-soft">seconds</span>
						</div>
					</div>
					<div className="rounded-xl bg-paper p-4 ring-1 ring-line">
						<div className="flex items-center justify-between gap-3">
							<p className="text-xs text-ink-soft">Integration health</p>
							<RefreshCcw className="size-4 text-ink-soft" />
						</div>
						<p className="mt-3 text-sm font-semibold text-ink">
							{enabledCount > 0 ? "Monitored" : "Idle"}
						</p>
						<p className="mt-1 text-xs text-ink-soft">
							Health dashboard on the integrations overview
						</p>
					</div>
				</div>

				<section className="rounded-2xl bg-paper p-5 ring-1 ring-line">
					<div className="mb-2">
						<h3 className="text-sm font-semibold text-ink">
							Reliability and security
						</h3>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Define how adapters handle failures. These switches apply
							to every enabled adapter.
						</p>
					</div>

					<SettingRow
						title="Correlation ID logging"
						description="Associate requests, callbacks and errors with a trace identifier."
						checked={config.correlationIdLogging}
						onChange={(value) =>
							updateConfig({ correlationIdLogging: value })
						}
					/>
					<SettingRow
						title="Dead-letter queue"
						description="Keep failed messages available for controlled review and replay."
						checked={config.deadLetterQueueEnabled}
						onChange={(value) =>
							updateConfig({ deadLetterQueueEnabled: value })
						}
					/>
					<SettingRow
						title="Circuit breaker"
						description="Temporarily stop repeated calls to an unhealthy external service."
						checked={config.circuitBreakerEnabled}
						onChange={(value) =>
							updateConfig({ circuitBreakerEnabled: value })
						}
					/>
					<SettingRow
						title="Inbound schema validation"
						description="Validate incoming payload structure before processing."
						checked={config.schemaValidationRequired}
						onChange={(value) =>
							updateConfig({ schemaValidationRequired: value })
						}
					/>
					<SettingRow
						title="Manual fallback"
						description="Keep a documented manual operating path when an integration is unavailable."
						checked={config.manualFallbackRequired}
						onChange={(value) =>
							updateConfig({ manualFallbackRequired: value })
						}
					/>
				</section>

				<section className="space-y-4">
					<div className="flex flex-wrap items-end justify-between gap-3">
						<div>
							<h3 className="font-display text-lg font-bold text-ink">
								Integration adapters
							</h3>
							<p className="mt-1 text-xs leading-5 text-ink-soft">
								Expand an adapter to configure its environment,
								credentials and connection behaviour.
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<Input
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Search integrations..."
								className="h-10 w-full border-line bg-paper text-sm text-ink sm:w-56"
							/>
							<div className="relative">
								<select
									value={category}
									onChange={(event) => setCategory(event.target.value)}
									className="h-10 appearance-none rounded-md border border-line bg-paper py-2 pl-3 pr-9 text-sm text-ink outline-none focus:ring-2 focus:ring-orange"
									aria-label="Filter integrations by category"
								>
									{categories.map((item) => (
										<option key={item} value={item}>
											{item}
										</option>
									))}
								</select>
								<ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
							</div>
						</div>
					</div>

					<div className="space-y-3">
						{filteredIntegrations.map((integration) => {
							const Icon = integration.icon;
							const isExpanded = expanded.includes(integration.id);

							return (
								<article
									key={integration.id}
									className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line"
								>
									<div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
										<div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep">
											<Icon className="size-5" />
										</div>

										<button
											type="button"
											onClick={() => toggleExpanded(integration.id)}
											aria-expanded={isExpanded}
											className="min-w-0 flex-1 text-left"
										>
											<div className="flex flex-wrap items-center gap-2">
												<span className="text-sm font-semibold text-ink">
													{integration.name}
												</span>
												<StatusBadge
													label={
														integration.enabled ? "Enabled" : "Disabled"
													}
													tone={
														integration.enabled ? "success" : "neutral"
													}
												/>
											</div>
											<p className="mt-1 text-xs leading-5 text-ink-soft">
												{integration.description}
											</p>
											<p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
												{integration.category} · {integration.environment}
											</p>
										</button>

										<div className="flex items-center gap-3">
											<Toggle
												checked={integration.enabled}
												onChange={(value) =>
													updateIntegration(integration.id, {
														enabled: value,
													})
												}
												label={`Enable ${integration.name}`}
											/>
											<button
												type="button"
												onClick={() => toggleExpanded(integration.id)}
												aria-label={`${
													isExpanded ? "Collapse" : "Expand"
												} ${integration.name}`}
												className="grid size-9 place-items-center rounded-lg text-ink-soft hover:bg-sand hover:text-ink"
											>
												<ChevronDown
													className={cn(
														"size-4 transition-transform",
														isExpanded && "rotate-180"
													)}
												/>
											</button>
										</div>
									</div>

									{isExpanded && (
										<div className="space-y-5 border-t border-line bg-sand/40 p-4 sm:p-5">
											<div className="grid gap-4 sm:grid-cols-3">
												<label className="block">
													<span className="text-xs font-medium text-ink">
														Environment
													</span>
													<select
														value={integration.environment}
														onChange={(event) =>
															updateIntegration(integration.id, {
																environment:
																	event.target.value as Environment,
															})
														}
														className="mt-1.5 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange"
													>
														<option value="sandbox">
															Sandbox / testing
														</option>
														<option value="production">Production</option>
													</select>
												</label>

												<label className="block">
													<span className="text-xs font-medium text-ink">
														Maximum retries
													</span>
													<Input
														type="number"
														min={0}
														max={10}
														value={String(integration.retryCount)}
														onChange={(event) =>
															updateIntegration(integration.id, {
																retryCount:
																	Number(event.target.value),
															})
														}
														className="mt-1.5 h-10 border-line bg-paper text-sm text-ink"
													/>
												</label>

												<label className="block">
													<span className="text-xs font-medium text-ink">
														Timeout (seconds)
													</span>
													<Input
														type="number"
														min={1}
														max={300}
														value={String(integration.timeoutSeconds)}
														onChange={(event) =>
															updateIntegration(integration.id, {
																timeoutSeconds:
																	Number(event.target.value),
															})
														}
														className="mt-1.5 h-10 border-line bg-paper text-sm text-ink"
													/>
												</label>
											</div>

											{integration.fields.length > 0 && (
												<div>
													<div className="mb-3 flex items-center gap-2">
														<ShieldCheck className="size-4 text-ink-soft" />
														<h4 className="text-xs font-semibold text-ink">
															Connection settings
														</h4>
													</div>

													<div className="grid gap-4 sm:grid-cols-2">
														{integration.fields.map((field) => {
															const fieldKey = `${integration.id}.${field.key}`;
															const isRevealed = revealed.has(fieldKey);
															const isSecret = Boolean(field.secret);
															const value =
																config.credentials[fieldKey] ?? "";

															return (
																<label
																	key={field.key}
																	className="block"
																>
																	<span className="flex items-center gap-1 text-xs font-medium text-ink">
																		{field.label}
																		{field.required && (
																			<span className="text-coral">*</span>
																		)}
																	</span>
																	<div className="mt-1.5 flex gap-2">
																		<Input
																			type={
																				isSecret && !isRevealed
																					? "password"
																					: field.kind === "number"
																						? "number"
																						: field.kind === "email"
																							? "email"
																							: field.kind === "url"
																								? "url"
																								: "text"
																			}
																			inputMode={
																				field.kind === "number"
																					? "numeric"
																					: undefined
																			}
																			value={value}
																			onChange={(event) =>
																				updateCredential(
																					fieldKey,
																					event.target.value
																				)
																			}
																			placeholder={field.placeholder}
																			autoComplete="off"
																			className="h-10 min-w-0 flex-1 border-line bg-paper text-sm text-ink"
																		/>
																		{isSecret && (
																			<button
																				type="button"
																				onClick={() =>
																					toggleReveal(fieldKey)
																				}
																				aria-label={
																					isRevealed
																						? `Hide ${field.label}`
																						: `Show ${field.label}`
																				}
																				className="grid size-10 shrink-0 place-items-center rounded-md border border-line bg-paper text-ink-soft hover:bg-sand"
																			>
																				{isRevealed ? (
																					<EyeOff className="size-4" />
																				) : (
																					<Eye className="size-4" />
																				)}
																			</button>
																		)}
																	</div>
																</label>
															);
														})}
													</div>
												</div>
											)}
										</div>
									)}
								</article>
							);
						})}

						{filteredIntegrations.length === 0 && (
							<div className="rounded-xl border border-dashed border-line bg-paper p-10 text-center">
								<Webhook className="mx-auto size-8 text-ink-soft" />
								<p className="mt-3 text-sm font-semibold text-ink">
									No integrations found
								</p>
								<p className="mt-1 text-xs text-ink-soft">
									Try another search term or category.
								</p>
							</div>
						)}
					</div>
				</section>

				<div className="flex items-start gap-3 rounded-xl bg-paper p-4 ring-1 ring-line">
					<AlertTriangle className="mt-0.5 size-5 shrink-0 text-orange" />
					<div>
						<p className="text-sm font-semibold text-ink">
							Production safety
						</p>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Before enabling production integrations, server-side
							credential encryption, strict webhook signature
							verification, request timeouts, idempotency, access
							controls and audit logging must be in place. Frontend
							switches are not security controls, and no external
							integration may independently authorise customs release.
						</p>
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
									? "Save to apply adapter and credential changes."
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