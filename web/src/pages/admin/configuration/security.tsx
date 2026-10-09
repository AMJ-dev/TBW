import { useEffect, useState } from "react";
import {
	AlertTriangle,
	ArrowLeft,
	BellRing,
	Fingerprint,
	KeyRound,
	Laptop,
	Lock,
	LockKeyhole,
	Save,
	ShieldCheck,
	UserCheck,
	UserX,
	type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/components/router-link";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

interface SecurityConfig {
	mfaMandatoryForStaff: boolean;
	mfaEncouragedForTrade: boolean;
	mfaGracePeriodHours: number;
	sessionTimeoutMinutes: number;
	concurrentSessionsAllowed: number;
	reauthenticationForSensitiveActions: boolean;
	trustedDevicesEnabled: boolean;
	breachedPasswordScreening: boolean;
	minimumPasswordLength: number;
	progressiveLockoutEnabled: boolean;
	lockoutThreshold: number;
	lockoutDurationMinutes: number;
	breakGlassRequiresDualApproval: boolean;
	regulatorReadOnlyAccess: boolean;
	regulatorAccessDurationHours: number;
	auditAllAuthEvents: boolean;
	securityAlertsEnabled: boolean;
	alertOnPrivilegeChanges: boolean;
	alertOnRepeatedLoginFailures: boolean;
	deviceManagementEnabled: boolean;
	remoteSignOutEnabled: boolean;
}

const emptyConfig: SecurityConfig = {
	mfaMandatoryForStaff: true,
	mfaEncouragedForTrade: true,
	mfaGracePeriodHours: 24,
	sessionTimeoutMinutes: 30,
	concurrentSessionsAllowed: 3,
	reauthenticationForSensitiveActions: true,
	trustedDevicesEnabled: false,
	breachedPasswordScreening: true,
	minimumPasswordLength: 12,
	progressiveLockoutEnabled: true,
	lockoutThreshold: 5,
	lockoutDurationMinutes: 30,
	breakGlassRequiresDualApproval: true,
	regulatorReadOnlyAccess: false,
	regulatorAccessDurationHours: 24,
	auditAllAuthEvents: true,
	securityAlertsEnabled: true,
	alertOnPrivilegeChanges: true,
	alertOnRepeatedLoginFailures: true,
	deviceManagementEnabled: true,
	remoteSignOutEnabled: true,
};

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
	icon: Icon,
	label,
	description,
	checked,
	onChange,
}: {
	icon: LucideIcon;
	label: string;
	description: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-4 last:border-b-0">
			<div className="flex min-w-0 flex-1 items-start gap-3">
				<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
					<Icon className="size-4" />
				</div>
				<div className="min-w-0">
					<p className="text-sm font-semibold text-ink">{label}</p>
					<p className="mt-1 text-xs leading-5 text-ink-soft">
						{description}
					</p>
				</div>
			</div>
			<Toggle checked={checked} onChange={onChange} label={label} />
		</div>
	);
}

function NumberField({
	label,
	description,
	value,
	min,
	max,
	unit,
	onChange,
}: {
	label: string;
	description?: string;
	value: number;
	min: number;
	max: number;
	unit: string;
	onChange: (value: number) => void;
}) {
	return (
		<label className="block min-w-0">
			<span className="text-sm font-medium text-ink">{label}</span>
			{description && (
				<span className="mt-1 block text-xs leading-5 text-ink-soft">
					{description}
				</span>
			)}
			<div className="mt-2 flex items-center gap-2">
				<Input
					type="number"
					min={min}
					max={max}
					value={String(value)}
					onChange={(event) => {
						const raw = event.target.value;
						onChange(raw === "" ? 0 : Number(raw));
					}}
					className="h-10 w-full max-w-36 border-line bg-sand font-mono text-sm text-ink"
				/>
				<span className="text-xs text-ink-soft">{unit}</span>
			</div>
			<span className="mt-1 block text-[10px] text-ink-soft">
				Allowed: {min}–{max}
			</span>
		</label>
	);
}

export default function AdminSecurityConfigurationPage() {
	const [config, setConfig] = useState<SecurityConfig>(emptyConfig);
	const [savedConfig, setSavedConfig] =
		useState<SecurityConfig>(emptyConfig);
	const [dirty, setDirty] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const fetchAll = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("/admin/config/security/");
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load security configuration.");
				return;
			}
			const payload: any = resp.code ?? {};

			const loaded: SecurityConfig = {
				mfaMandatoryForStaff: Boolean(
					payload.mfa_mandatory_for_staff ??
						payload.mfaMandatoryForStaff ??
						true
				),
				mfaEncouragedForTrade: Boolean(
					payload.mfa_encouraged_for_trade ??
						payload.mfaEncouragedForTrade ??
						true
				),
				mfaGracePeriodHours: Number(
					payload.mfa_grace_period_hours ??
						payload.mfaGracePeriodHours ??
						24
				),
				sessionTimeoutMinutes: Number(
					payload.session_timeout_minutes ??
						payload.sessionTimeoutMinutes ??
						30
				),
				concurrentSessionsAllowed: Number(
					payload.concurrent_sessions_allowed ??
						payload.concurrentSessionsAllowed ??
						3
				),
				reauthenticationForSensitiveActions: Boolean(
					payload.reauthentication_for_sensitive_actions ??
						payload.reauthenticationForSensitiveActions ??
						true
				),
				trustedDevicesEnabled: Boolean(
					payload.trusted_devices_enabled ??
						payload.trustedDevicesEnabled ??
						false
				),
				breachedPasswordScreening: Boolean(
					payload.breached_password_screening ??
						payload.breachedPasswordScreening ??
						true
				),
				minimumPasswordLength: Number(
					payload.minimum_password_length ??
						payload.minimumPasswordLength ??
						12
				),
				progressiveLockoutEnabled: Boolean(
					payload.progressive_lockout_enabled ??
						payload.progressiveLockoutEnabled ??
						true
				),
				lockoutThreshold: Number(
					payload.lockout_threshold ?? payload.lockoutThreshold ?? 5
				),
				lockoutDurationMinutes: Number(
					payload.lockout_duration_minutes ??
						payload.lockoutDurationMinutes ??
						30
				),
				breakGlassRequiresDualApproval: Boolean(
					payload.break_glass_requires_dual_approval ??
						payload.breakGlassRequiresDualApproval ??
						true
				),
				regulatorReadOnlyAccess: Boolean(
					payload.regulator_read_only_access ??
						payload.regulatorReadOnlyAccess ??
						false
				),
				regulatorAccessDurationHours: Number(
					payload.regulator_access_duration_hours ??
						payload.regulatorAccessDurationHours ??
						24
				),
				auditAllAuthEvents: Boolean(
					payload.audit_all_auth_events ??
						payload.auditAllAuthEvents ??
						true
				),
				securityAlertsEnabled: Boolean(
					payload.security_alerts_enabled ??
						payload.securityAlertsEnabled ??
						true
				),
				alertOnPrivilegeChanges: Boolean(
					payload.alert_on_privilege_changes ??
						payload.alertOnPrivilegeChanges ??
						true
				),
				alertOnRepeatedLoginFailures: Boolean(
					payload.alert_on_repeated_login_failures ??
						payload.alertOnRepeatedLoginFailures ??
						true
				),
				deviceManagementEnabled: Boolean(
					payload.device_management_enabled ??
						payload.deviceManagementEnabled ??
						true
				),
				remoteSignOutEnabled: Boolean(
					payload.remote_sign_out_enabled ??
						payload.remoteSignOutEnabled ??
						true
				),
			};

			setConfig(loaded);
			setSavedConfig(loaded);
			setDirty(false);
		} catch (err: any) {
			setError(
				err?.response?.data?.message ||
					"Could not load security configuration."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const update = <K extends keyof SecurityConfig>(
		key: K,
		value: SecurityConfig[K]
	) => {
		setConfig((current) => ({ ...current, [key]: value }));
		setDirty(true);
	};

	const validate = () => {
		const numberRules: {
			key: keyof SecurityConfig;
			label: string;
			min: number;
			max: number;
		}[] = [
			{
				key: "mfaGracePeriodHours",
				label: "MFA grace period",
				min: 0,
				max: 720,
			},
			{
				key: "sessionTimeoutMinutes",
				label: "Session timeout",
				min: 5,
				max: 480,
			},
			{
				key: "concurrentSessionsAllowed",
				label: "Concurrent sessions",
				min: 1,
				max: 20,
			},
			{
				key: "minimumPasswordLength",
				label: "Minimum password length",
				min: 12,
				max: 128,
			},
			{
				key: "lockoutThreshold",
				label: "Lockout threshold",
				min: 1,
				max: 20,
			},
			{
				key: "lockoutDurationMinutes",
				label: "Lockout duration",
				min: 1,
				max: 1440,
			},
			{
				key: "regulatorAccessDurationHours",
				label: "Regulator access duration",
				min: 1,
				max: 168,
			},
		];

		for (const rule of numberRules) {
			const value = config[rule.key];
			if (
				typeof value !== "number" ||
				!Number.isFinite(value) ||
				value < rule.min ||
				value > rule.max
			) {
				toast.error(
					`${rule.label} must be between ${rule.min} and ${rule.max}.`
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
				mfa_mandatory_for_staff: config.mfaMandatoryForStaff,
				mfa_encouraged_for_trade: config.mfaEncouragedForTrade,
				mfa_grace_period_hours: config.mfaGracePeriodHours,
				session_timeout_minutes: config.sessionTimeoutMinutes,
				concurrent_sessions_allowed: config.concurrentSessionsAllowed,
				reauthentication_for_sensitive_actions:
					config.reauthenticationForSensitiveActions,
				trusted_devices_enabled: config.trustedDevicesEnabled,
				breached_password_screening: config.breachedPasswordScreening,
				minimum_password_length: config.minimumPasswordLength,
				progressive_lockout_enabled: config.progressiveLockoutEnabled,
				lockout_threshold: config.lockoutThreshold,
				lockout_duration_minutes: config.lockoutDurationMinutes,
				break_glass_requires_dual_approval:
					config.breakGlassRequiresDualApproval,
				regulator_read_only_access: config.regulatorReadOnlyAccess,
				regulator_access_duration_hours:
					config.regulatorAccessDurationHours,
				audit_all_auth_events: config.auditAllAuthEvents,
				security_alerts_enabled: config.securityAlertsEnabled,
				alert_on_privilege_changes: config.alertOnPrivilegeChanges,
				alert_on_repeated_login_failures:
					config.alertOnRepeatedLoginFailures,
				device_management_enabled: config.deviceManagementEnabled,
				remote_sign_out_enabled: config.remoteSignOutEnabled,
			};

			const res = await http.post(
				"/admin/config/security/update/",
				payload
			);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(
					resp.data || "Could not save the security configuration."
				);
				return;
			}
			toast.success("Security configuration saved. Change logged.");
			await fetchAll();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					"Could not save the security configuration."
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
				title="Access & Security"
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
				title="Access & Security"
				eyebrow="Administration · Configuration"
			>
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load security configuration
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
			title="Access & Security"
			eyebrow="Administration · Configuration"
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
							Access &amp; Security
						</h2>

						<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
							Configure authentication policies, session protection,
							administrator access and security monitoring. Every change
							is logged.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{dirty && (
							<StatusBadge label="Unsaved changes" tone="warning" />
						)}
					</div>
				</div>

				<section className="rounded-2xl bg-paper p-5 ring-1 ring-line">
					<div className="mb-2">
						<h3 className="font-display text-sm font-bold text-ink">
							Multi-factor authentication
						</h3>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Control MFA requirements for internal staff and external
							trade users.
						</p>
					</div>

					<SettingRow
						icon={Fingerprint}
						label="MFA mandatory for staff"
						description="Require additional verification for internal accounts."
						checked={config.mfaMandatoryForStaff}
						onChange={(value) => update("mfaMandatoryForStaff", value)}
					/>
					<SettingRow
						icon={Fingerprint}
						label="MFA encouraged for trade users"
						description="Encourage importers, agents and transporters to enrol."
						checked={config.mfaEncouragedForTrade}
						onChange={(value) => update("mfaEncouragedForTrade", value)}
					/>

					{config.mfaMandatoryForStaff && (
						<div className="mt-4 border-t border-line pt-4">
							<NumberField
								label="MFA enrolment grace period"
								description="Time allowed for existing staff accounts to enrol."
								value={config.mfaGracePeriodHours}
								min={0}
								max={720}
								unit="hours"
								onChange={(value) =>
									update("mfaGracePeriodHours", value)
								}
							/>
						</div>
					)}
				</section>

				<section className="rounded-2xl bg-paper p-5 ring-1 ring-line">
					<div className="mb-2">
						<h3 className="font-display text-sm font-bold text-ink">
							Session controls
						</h3>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Limit session exposure and provide account holders with
							control over active sessions.
						</p>
					</div>

					<div className="grid gap-5 border-b border-line py-4 sm:grid-cols-2">
						<NumberField
							label="Idle session timeout"
							description="Automatically expire inactive sessions."
							value={config.sessionTimeoutMinutes}
							min={5}
							max={480}
							unit="minutes"
							onChange={(value) =>
								update("sessionTimeoutMinutes", value)
							}
						/>
						<NumberField
							label="Concurrent sessions"
							description="Maximum active sessions per account."
							value={config.concurrentSessionsAllowed}
							min={1}
							max={20}
							unit="sessions"
							onChange={(value) =>
								update("concurrentSessionsAllowed", value)
							}
						/>
					</div>

					<SettingRow
						icon={LockKeyhole}
						label="Re-authentication for sensitive actions"
						description="Require recent verification before sensitive administrative or financial actions."
						checked={config.reauthenticationForSensitiveActions}
						onChange={(value) =>
							update("reauthenticationForSensitiveActions", value)
						}
					/>
					<SettingRow
						icon={Laptop}
						label="Trusted devices"
						description="Allow device-trust with expiry and revocation controls."
						checked={config.trustedDevicesEnabled}
						onChange={(value) => update("trustedDevicesEnabled", value)}
					/>
					<SettingRow
						icon={UserCheck}
						label="Device and session management"
						description="Provide an interface for reviewing active devices and sessions."
						checked={config.deviceManagementEnabled}
						onChange={(value) => update("deviceManagementEnabled", value)}
					/>
					<SettingRow
						icon={UserX}
						label="Remote sign-out"
						description="Allow users or authorised administrators to revoke sessions."
						checked={config.remoteSignOutEnabled}
						onChange={(value) => update("remoteSignOutEnabled", value)}
					/>
				</section>

				<section className="rounded-2xl bg-paper p-5 ring-1 ring-line">
					<div className="mb-2">
						<h3 className="font-display text-sm font-bold text-ink">
							Password and login protection
						</h3>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Set password requirements and protections against repeated
							failed login attempts.
						</p>
					</div>

					<div className="border-b border-line py-4">
						<NumberField
							label="Minimum password length"
							description="Use a longer passphrase-friendly minimum for account passwords."
							value={config.minimumPasswordLength}
							min={12}
							max={128}
							unit="characters"
							onChange={(value) =>
								update("minimumPasswordLength", value)
							}
						/>
					</div>

					<SettingRow
						icon={KeyRound}
						label="Breached-password screening"
						description="Reject known compromised passwords when users set or change passwords."
						checked={config.breachedPasswordScreening}
						onChange={(value) =>
							update("breachedPasswordScreening", value)
						}
					/>
					<SettingRow
						icon={Lock}
						label="Progressive account lockout"
						description="Temporarily restrict sign-in after repeated failed attempts."
						checked={config.progressiveLockoutEnabled}
						onChange={(value) =>
							update("progressiveLockoutEnabled", value)
						}
					/>

					{config.progressiveLockoutEnabled && (
						<div className="grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
							<NumberField
								label="Failed attempt threshold"
								value={config.lockoutThreshold}
								min={1}
								max={20}
								unit="attempts"
								onChange={(value) =>
									update("lockoutThreshold", value)
								}
							/>
							<NumberField
								label="Lockout duration"
								value={config.lockoutDurationMinutes}
								min={1}
								max={1440}
								unit="minutes"
								onChange={(value) =>
									update("lockoutDurationMinutes", value)
								}
							/>
						</div>
					)}
				</section>

				<section className="rounded-2xl bg-paper p-5 ring-1 ring-line">
					<div className="mb-2">
						<h3 className="font-display text-sm font-bold text-ink">
							Privileged and regulatory access
						</h3>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Protect emergency administration and any temporary auditor
							or regulator access.
						</p>
					</div>

					<SettingRow
						icon={LockKeyhole}
						label="Dual approval for emergency access"
						description="Require a second authorised approver for emergency privileged access."
						checked={config.breakGlassRequiresDualApproval}
						onChange={(value) =>
							update("breakGlassRequiresDualApproval", value)
						}
					/>
					<SettingRow
						icon={ShieldCheck}
						label="Regulator / auditor read-only access"
						description="Enable time-limited, read-only access on request."
						checked={config.regulatorReadOnlyAccess}
						onChange={(value) =>
							update("regulatorReadOnlyAccess", value)
						}
					/>

					{config.regulatorReadOnlyAccess && (
						<div className="mt-4 border-t border-line pt-4">
							<NumberField
								label="Default access duration"
								description="Maximum default duration for a temporary access grant."
								value={config.regulatorAccessDurationHours}
								min={1}
								max={168}
								unit="hours"
								onChange={(value) =>
									update("regulatorAccessDurationHours", value)
								}
							/>
						</div>
					)}
				</section>

				<section className="rounded-2xl bg-paper p-5 ring-1 ring-line">
					<div className="mb-2">
						<h3 className="font-display text-sm font-bold text-ink">
							Audit and security alerts
						</h3>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Configure which security events should be recorded or
							surfaced for review.
						</p>
					</div>

					<SettingRow
						icon={ShieldCheck}
						label="Authentication and authorisation audit"
						description="Record sign-ins, sign-outs, MFA events, access denials and permission changes."
						checked={config.auditAllAuthEvents}
						onChange={(value) => update("auditAllAuthEvents", value)}
					/>
					<SettingRow
						icon={BellRing}
						label="Security alerts"
						description="Route security alerts to authorised staff."
						checked={config.securityAlertsEnabled}
						onChange={(value) =>
							update("securityAlertsEnabled", value)
						}
					/>

					{config.securityAlertsEnabled && (
						<div className="border-t border-line pt-2">
							<SettingRow
								icon={UserCheck}
								label="Alert on privilege changes"
								description="Surface changes to roles, permissions and privileged accounts."
								checked={config.alertOnPrivilegeChanges}
								onChange={(value) =>
									update("alertOnPrivilegeChanges", value)
								}
							/>
							<SettingRow
								icon={AlertTriangle}
								label="Alert on repeated login failures"
								description="Surface repeated authentication failures for security review."
								checked={config.alertOnRepeatedLoginFailures}
								onChange={(value) =>
									update("alertOnRepeatedLoginFailures", value)
								}
							/>
						</div>
					)}
				</section>

				<div className="rounded-xl border border-line bg-paper p-4">
					<div className="flex items-start gap-3">
						<AlertTriangle className="mt-0.5 size-5 shrink-0 text-orange-deep" />
						<div>
							<p className="text-sm font-semibold text-ink">
								Backend enforcement is required
							</p>
							<p className="mt-1 text-xs leading-5 text-ink-soft">
								MFA, password rules, session expiry, lockout, permissions,
								dual approval, security alerts and regulator access are all
								enforced server-side. Frontend controls alone do not
								provide security.
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
									? "Save to apply authentication, session, and access changes."
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