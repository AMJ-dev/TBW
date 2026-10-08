import { useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	Clock,
	Eye,
	Fingerprint,
	KeyRound,
	Lock,
	LockKeyhole,
	Save,
	ShieldCheck,
	UserCheck,
	UserX,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SecurityConfig {
	mfaMandatoryForStaff: boolean;
	mfaEncouragedForTrade: boolean;
	sessionTimeoutMinutes: number;
	concurrentSessionsAllowed: number;
	breachedPasswordScreening: boolean;
	progressiveLockoutEnabled: boolean;
	lockoutThreshold: number;
	lockoutDurationMinutes: number;
	breakGlassRequiresDualApproval: boolean;
	regulatorReadOnlyAccess: boolean;
	regulatorAccessDurationHours: number;
	auditAllAuthEvents: boolean;
	deviceListEnabled: boolean;
	remoteSignOutEnabled: boolean;
}

const initialConfig: SecurityConfig = {
	mfaMandatoryForStaff: true,
	mfaEncouragedForTrade: true,
	sessionTimeoutMinutes: 30,
	concurrentSessionsAllowed: 3,
	breachedPasswordScreening: true,
	progressiveLockoutEnabled: true,
	lockoutThreshold: 5,
	lockoutDurationMinutes: 30,
	breakGlassRequiresDualApproval: true,
	regulatorReadOnlyAccess: false,
	regulatorAccessDurationHours: 24,
	auditAllAuthEvents: true,
	deviceListEnabled: true,
	remoteSignOutEnabled: true,
};

export default function AdminSecurityConfigurationPage() {
	const [config, setConfig] = useState<SecurityConfig>(initialConfig);
	const [dirty, setDirty] = useState(false);

	const markDirty = () => setDirty(true);

	const update = <K extends keyof SecurityConfig>(
		key: K,
		value: SecurityConfig[K]
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		markDirty();
	};

	const handleSave = () => {
		if (config.sessionTimeoutMinutes < 5) {
			toast.error("Session timeout must be at least 5 minutes.");
			return;
		}
		if (config.lockoutThreshold < 1) {
			toast.error("Lockout threshold must be at least 1.");
			return;
		}
		if (
			config.regulatorReadOnlyAccess &&
			config.regulatorAccessDurationHours < 1
		) {
			toast.error(
				"Regulator read-only access requires a positive duration in hours."
			);
			return;
		}
		toast.success("Security configuration saved. Change logged.");
		setDirty(false);
	};

	const handleDiscard = () => {
		setConfig(initialConfig);
		setDirty(false);
		toast.message("Changes discarded.");
	};

	return (
		<AppShell
			title="Access & Security"
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
						Access &amp; Security
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Configure authentication controls, session behaviour, lockout
						policy, and administrative access. Every authentication,
						authorisation, and delegation event is logged.
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
							Security &amp; privacy by design
						</p>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Least privilege, MFA for staff, encrypted secrets, and full
							auditability of every authentication and authorisation decision.
							Administrative interfaces are protected by network policy and
							MFA; break-glass access requires dual approval and alerts.
						</p>
					</div>
				</div>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Multi-Factor Authentication
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Controls who must enrol in MFA and who is strongly encouraged.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<RuleRow
						icon={Fingerprint}
						label="MFA mandatory for staff"
						desc="Enforce two-factor authentication for all internal roles. No exceptions."
						on={config.mfaMandatoryForStaff}
						onToggle={() =>
							update("mfaMandatoryForStaff", !config.mfaMandatoryForStaff)
						}
					/>
					<RuleRow
						icon={Fingerprint}
						label="MFA strongly encouraged for trade users"
						desc="Prompt importers, agents, and transporters to enrol but do not block."
						on={config.mfaEncouragedForTrade}
						onToggle={() =>
							update("mfaEncouragedForTrade", !config.mfaEncouragedForTrade)
						}
					/>
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Session Controls
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Idle timeout, concurrent session limits, and remote sign-out
						capabilities.
					</p>
				</div>
				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<NumberField
						label="Session timeout"
						icon={Clock}
						unit="minutes idle"
						value={config.sessionTimeoutMinutes}
						onChange={(v) => update("sessionTimeoutMinutes", v)}
					/>
					<NumberField
						label="Concurrent sessions"
						icon={UserCheck}
						unit="max per account"
						value={config.concurrentSessionsAllowed}
						onChange={(v) => update("concurrentSessionsAllowed", v)}
					/>
				</div>
				<ul className="divide-y divide-line border-t border-line">
					<RuleRow
						icon={Eye}
						label="Device list"
						desc="Show active sessions and devices per user account."
						on={config.deviceListEnabled}
						onToggle={() =>
							update("deviceListEnabled", !config.deviceListEnabled)
						}
					/>
					<RuleRow
						icon={UserX}
						label="Remote sign-out"
						desc="Allow users and admins to terminate other sessions."
						on={config.remoteSignOutEnabled}
						onToggle={() =>
							update("remoteSignOutEnabled", !config.remoteSignOutEnabled)
						}
					/>
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Password Policy
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Screening and lockout behaviour for failed authentication attempts.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<RuleRow
						icon={KeyRound}
						label="Breached-password screening"
						desc="Reject passwords found in known breach corpora at set and change time."
						on={config.breachedPasswordScreening}
						onToggle={() =>
							update(
								"breachedPasswordScreening",
								!config.breachedPasswordScreening
							)
						}
					/>
					<RuleRow
						icon={Lock}
						label="Progressive lockout on failed attempts"
						desc="Temporarily lock accounts after repeated failed sign-in attempts."
						on={config.progressiveLockoutEnabled}
						onToggle={() =>
							update(
								"progressiveLockoutEnabled",
								!config.progressiveLockoutEnabled
							)
						}
					/>
					{config.progressiveLockoutEnabled && (
						<div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
							<NumberField
								label="Lockout threshold"
								icon={AlertTriangle}
								unit="failed attempts"
								value={config.lockoutThreshold}
								onChange={(v) => update("lockoutThreshold", v)}
							/>
							<NumberField
								label="Lockout duration"
								icon={Clock}
								unit="minutes"
								value={config.lockoutDurationMinutes}
								onChange={(v) => update("lockoutDurationMinutes", v)}
							/>
						</div>
					)}
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Administrative Access
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Privileged access controls for administrative and regulatory
						read-only access.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<RuleRow
						icon={LockKeyhole}
						label="Break-glass access requires dual approval"
						desc="Emergency admin access requires a second approver and triggers an alert."
						on={config.breakGlassRequiresDualApproval}
						onToggle={() =>
							update(
								"breakGlassRequiresDualApproval",
								!config.breakGlassRequiresDualApproval
							)
						}
					/>
					<RuleRow
						icon={ShieldCheck}
						label="Regulator / auditor read-only access"
						desc="Permit time-boxed read-only access on request. Every access is logged."
						on={config.regulatorReadOnlyAccess}
						onToggle={() =>
							update(
								"regulatorReadOnlyAccess",
								!config.regulatorReadOnlyAccess
							)
						}
					/>
					{config.regulatorReadOnlyAccess && (
						<div className="px-5 py-4">
							<NumberField
								label="Default access duration"
								icon={Clock}
								unit="hours"
								value={config.regulatorAccessDurationHours}
								onChange={(v) =>
									update("regulatorAccessDurationHours", v)
								}
							/>
						</div>
					)}
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Audit
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Which authentication and authorisation events are written to the
						audit log.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<RuleRow
						icon={ShieldCheck}
						label="Log all authentication and authorisation events"
						desc="Sign-in, sign-out, MFA challenges, delegation changes, and permission decisions."
						on={config.auditAllAuthEvents}
						onToggle={() =>
							update("auditAllAuthEvents", !config.auditAllAuthEvents)
						}
					/>
				</ul>
			</section>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							Access policy changes take effect immediately
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Tightening a policy (e.g. enabling mandatory MFA) applies to the
							next sign-in; loosening a policy does not retroactively restore
							sessions already terminated. Break-glass and regulator access are
							always logged with actor, purpose, and duration. Role definitions
							and permission assignments live on the user and role
							administration screens.
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
	icon: typeof ShieldCheck;
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