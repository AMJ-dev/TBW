import { useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	BarChart3,
	Boxes,
	Flag,
	Globe,
	Map,
	MessageSquare,
	Save,
	ShieldCheck,
	Smartphone,
	Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FeatureFlag {
	id: string;
	key: string;
	label: string;
	desc: string;
	scope: "public" | "portal" | "operations" | "platform";
	enabled: boolean;
	requiresApproval: boolean;
}

interface FlagsConfig {
	auditAllChanges: boolean;
	allowPerOrgOverride: boolean;
	requireReason: boolean;
	flags: FeatureFlag[];
}

const initialConfig: FlagsConfig = {
	auditAllChanges: true,
	allowPerOrgOverride: false,
	requireReason: true,
	flags: [
		{
			id: "f-1",
			key: "public.cargo_tracking",
			label: "Public cargo tracking",
			desc: "Allow unauthenticated tracking lookups on the public site.",
			scope: "public",
			enabled: true,
			requiresApproval: false,
		},
		{
			id: "f-2",
			key: "public.metrics_display",
			label: "Public metrics display",
			desc: "Show aggregate operational metrics on the public site. Suppressible without deploy.",
			scope: "public",
			enabled: true,
			requiresApproval: true,
		},
		{
			id: "f-3",
			key: "public.terminal_map",
			label: "Interactive terminal map",
			desc: "Enable the public zone visualisation.",
			scope: "public",
			enabled: false,
			requiresApproval: false,
		},
		{
			id: "f-4",
			key: "portal.self_registration",
			label: "Portal self-registration",
			desc: "Allow prospects to create an account pending approval.",
			scope: "portal",
			enabled: true,
			requiresApproval: false,
		},
		{
			id: "f-5",
			key: "portal.quote_request",
			label: "Quote request submission",
			desc: "Allow unauth and auth users to submit quote requests.",
			scope: "portal",
			enabled: true,
			requiresApproval: false,
		},
		{
			id: "f-6",
			key: "portal.online_payment",
			label: "Online payment initiation",
			desc: "Allow customers to initiate payment from the portal.",
			scope: "portal",
			enabled: true,
			requiresApproval: true,
		},
		{
			id: "f-7",
			key: "portal.storage_accrual",
			label: "Live storage accrual",
			desc: "Show real-time storage cost accrual in the portal.",
			scope: "portal",
			enabled: true,
			requiresApproval: false,
		},
		{
			id: "f-8",
			key: "ops.offline_gate",
			label: "Offline gate authorisation",
			desc: "Allow gate decisions from cached authorisations when upstream is unavailable.",
			scope: "operations",
			enabled: true,
			requiresApproval: true,
		},
		{
			id: "f-9",
			key: "ops.anpr",
			label: "ANPR plate recognition",
			desc: "Enable automatic plate match to booking at gate. Manual fallback always available.",
			scope: "operations",
			enabled: false,
			requiresApproval: false,
		},
		{
			id: "f-10",
			key: "ops.handheld_scanner",
			label: "Handheld scanning",
			desc: "Enable barcode/QR scanning on staff handhelds.",
			scope: "operations",
			enabled: true,
			requiresApproval: false,
		},
		{
			id: "f-11",
			key: "ops.automated_yard",
			label: "Automated yard optimisation",
			desc: "Deferred scope. Reserved for future phases; disabled by default.",
			scope: "operations",
			enabled: false,
			requiresApproval: true,
		},
		{
			id: "f-12",
			key: "platform.native_mobile",
			label: "Native mobile applications",
			desc: "Deferred scope. Reserved for Phase 3+; no effect while disabled.",
			scope: "platform",
			enabled: false,
			requiresApproval: true,
		},
		{
			id: "f-13",
			key: "platform.developer_api",
			label: "Developer public API",
			desc: "Deferred scope. Public developer programme; disabled by default.",
			scope: "platform",
			enabled: false,
			requiresApproval: true,
		},
		{
			id: "f-14",
			key: "platform.trade_finance",
			label: "Trade finance marketplace",
			desc: "Deferred scope. Reserved for future phases; disabled by default.",
			scope: "platform",
			enabled: false,
			requiresApproval: true,
		},
	],
};

const scopeMeta: Record<
	FeatureFlag["scope"],
	{ label: string; icon: typeof Globe }
> = {
	public: { label: "Public", icon: Globe },
	portal: { label: "Portal", icon: Users },
	operations: { label: "Operations", icon: Boxes },
	platform: { label: "Platform", icon: Flag },
};

export default function AdminFeatureFlagsPage() {
	const [config, setConfig] = useState<FlagsConfig>(initialConfig);
	const [dirty, setDirty] = useState(false);
	const [scopeFilter, setScopeFilter] = useState<"all" | FeatureFlag["scope"]>(
		"all"
	);

	const markDirty = () => setDirty(true);

	const update = <K extends keyof FlagsConfig>(
		key: K,
		value: FlagsConfig[K]
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		markDirty();
	};

	const toggleFlag = (id: string) => {
		setConfig((prev) => ({
			...prev,
			flags: prev.flags.map((f) =>
				f.id === id ? { ...f, enabled: !f.enabled } : f
			),
		}));
		markDirty();
	};

	const visibleFlags = config.flags.filter(
		(f) => scopeFilter === "all" || f.scope === scopeFilter
	);

	const enabledCount = config.flags.filter((f) => f.enabled).length;
	const disabledCount = config.flags.length - enabledCount;

	const handleSave = () => {
		toast.success("Feature flag configuration saved. Change logged.");
		setDirty(false);
	};

	const handleDiscard = () => {
		setConfig(initialConfig);
		setDirty(false);
		toast.message("Changes discarded.");
	};

	return (
		<AppShell
			title="Feature Flags"
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
						Feature Flags
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Enable or disable controlled platform capabilities without a
						deployment. Every change is logged and reversible. Flags marked as
						requiring approval cannot be toggled without a second approver.
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

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total Flags"
					value={String(config.flags.length)}
					detail="Across all scopes"
					tone="info"
					icon={Flag}
				/>
				<Metric
					label="Enabled"
					value={String(enabledCount)}
					detail="Active in production"
					tone="success"
					icon={ShieldCheck}
				/>
				<Metric
					label="Disabled"
					value={String(disabledCount)}
					detail="Inactive"
					tone="neutral"
					icon={Flag}
				/>
				<Metric
					label="Requires Approval"
					value={String(config.flags.filter((f) => f.requiresApproval).length)}
					detail="Controlled toggles"
					tone="warning"
					icon={ShieldCheck}
				/>
			</div>

			<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
						<ShieldCheck className="size-5" />
					</div>
					<div className="min-w-0">
						<p className="text-sm font-semibold text-ink">
							Controlled, reversible, audited
						</p>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Flags gate features without deployment. Toggling a flag records
							actor, prior state, new state, and (when required) reason.
							Deferred-scope flags have no operational effect while disabled.
						</p>
					</div>
				</div>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Flag Behaviour
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Cross-cutting controls applied to every flag.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<RuleRow
						icon={ShieldCheck}
						label="Audit every change"
						desc="Record actor, timestamp, prior state, new state, and reason."
						on={config.auditAllChanges}
						onToggle={() =>
							update("auditAllChanges", !config.auditAllChanges)
						}
					/>
					<RuleRow
						icon={Users}
						label="Allow per-organisation override"
						desc="Enable flags for specific organisations without changing the global default."
						on={config.allowPerOrgOverride}
						onToggle={() =>
							update("allowPerOrgOverride", !config.allowPerOrgOverride)
						}
					/>
					<RuleRow
						icon={ShieldCheck}
						label="Require reason on toggle"
						desc="Prompt for a reason whenever a flag changes state."
						on={config.requireReason}
						onToggle={() => update("requireReason", !config.requireReason)}
					/>
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
					<div>
						<h3 className="font-display text-sm font-bold text-ink">
							Platform Flags
						</h3>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Flags grouped by scope. Public flags affect the website; portal
							affects authenticated customers; operations affects staff
							consoles and gate; platform covers deferred scope.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-1.5">
						{(["all", "public", "portal", "operations", "platform"] as const).map(
							(s) => (
								<button
									key={s}
									type="button"
									onClick={() => setScopeFilter(s)}
									className={cn(
										"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
										scopeFilter === s
											? "bg-orange text-white"
											: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
									)}
								>
									{s === "all"
										? "All"
										: scopeMeta[s as FeatureFlag["scope"]].label}
								</button>
							)
						)}
					</div>
				</div>

				{visibleFlags.length === 0 ? (
					<div className="p-6 text-center text-sm text-ink-soft">
						No flags in this scope.
					</div>
				) : (
					<ul className="divide-y divide-line">
						{visibleFlags.map((f) => {
							const ScopeIcon = scopeMeta[f.scope].icon;
							return (
								<li
									key={f.id}
									className="flex flex-wrap items-start justify-between gap-4 p-5"
								>
									<div className="flex min-w-[240px] flex-1 items-start gap-3">
										<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
											<ScopeIcon className="size-4" />
										</div>
										<div className="min-w-0">
											<div className="flex flex-wrap items-center gap-2">
												<p className="text-[13px] font-semibold text-ink">
													{f.label}
												</p>
												<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
													{scopeMeta[f.scope].label}
												</span>
												{f.requiresApproval && (
													<StatusBadge
														label="Approval"
														tone="warning"
													/>
												)}
											</div>
											<p className="mt-1 text-[11px] leading-5 text-ink-soft">
												{f.desc}
											</p>
											<p className="mt-2 font-mono text-[10px] text-ink-soft">
												{f.key}
											</p>
										</div>
									</div>

									<div className="flex flex-col items-end gap-2">
										<StatusBadge
											label={f.enabled ? "Enabled" : "Disabled"}
											tone={f.enabled ? "success" : "neutral"}
										/>
										<button
											type="button"
											onClick={() => toggleFlag(f.id)}
											aria-pressed={f.enabled}
											className={cn(
												"inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
												f.enabled ? "bg-orange" : "bg-sand-2"
											)}
										>
											<span
												className={cn(
													"size-5 rounded-full bg-white shadow-sm transition-transform",
													f.enabled
														? "translate-x-5"
														: "translate-x-0.5"
												)}
											/>
										</button>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</section>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							Deferred-scope flags are reserved
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Flags in the platform scope (native mobile, developer API, trade
							finance, automated yard) cover features listed as deferred or
							candidate future scope. They have no operational effect while
							disabled and should not be enabled ahead of an approved scope
							change.
						</p>
					</div>
				</div>
			</div>
		</AppShell>
	);
}

function Metric({
	label,
	value,
	detail,
	tone,
	icon: Icon,
}: {
	label: string;
	value: string;
	detail: string;
	tone: "success" | "warning" | "critical" | "info" | "neutral";
	icon: typeof Flag;
}) {
	const dotTone =
		tone === "success"
			? "bg-teal"
			: tone === "warning"
			? "bg-orange"
			: tone === "critical"
			? "bg-coral"
			: tone === "info"
			? "bg-sky"
			: "bg-sand-2";

	return (
		<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
			<div className="flex items-center justify-between">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
					{label}
				</p>
				<Icon className="size-4 text-orange" />
			</div>
			<p className="mt-3 font-display text-2xl font-bold text-ink">{value}</p>
			<div className="mt-1 flex items-center gap-2">
				<span className={cn("size-1.5 rounded-full", dotTone)} />
				<span className="text-[11px] text-ink-soft">{detail}</span>
			</div>
		</div>
	);
}

function RuleRow({
	icon: Icon,
	label,
	desc,
	on,
	onToggle,
}: {
	icon: typeof Flag;
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