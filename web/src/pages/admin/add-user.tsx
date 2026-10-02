import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import { useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	ArrowRight,
	Building2,
	CheckCircle2,
	ShieldCheck,
	UserPlus,
	UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";

type AccountType = "organisation" | "system";

interface OrgOption {
	id: string;
	name: string;
	status?: string;
	type?: string;
}

interface RoleOption {
	id: string;
	role_key: string;
	role_name: string;
	scope: "system" | "organisation";
	description?: string;
	is_active?: number | boolean;
}

const accountTypeMeta: Record<
	AccountType,
	{ title: string; detail: string; icon: typeof Building2 }
> = {
	organisation: {
		title: "Organisation user",
		detail:
			"Belongs to an existing organisation on the platform. Access is scoped to that organisation and the role you assign.",
		icon: Building2,
	},
	system: {
		title: "System user",
		detail:
			"TRÏNŪ internal user with platform-wide scope. Reserved for terminal staff and administrators.",
		icon: ShieldCheck,
	},
};

const statusLabel: Record<string, string> = {
	pending: "Pending",
	under_review: "Under review",
	verified: "Verified",
	rejected: "Rejected",
	suspended: "Suspended",
	approved: "Approved",
};

const INTERNAL_ROLE_KEYS = new Set([
	"system_admin",
	"terminal_operations",
	"gate_officer",
	"warehouse_yard_officer",
	"documentation_officer",
]);

const isActive = (r: RoleOption) =>
	r.is_active === undefined ? true : Boolean(Number(r.is_active));

export default function AdminAddUsersPage() {
	const navigate = useNavigate();

	const [step, setStep] = useState<"form" | "review">("form");

	const [accountType, setAccountType] = useState<AccountType>("organisation");
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [jobTitle, setJobTitle] = useState("");

	const [orgId, setOrgId] = useState("");
	const [roleId, setRoleId] = useState("");

	const [orgs, setOrgs] = useState<OrgOption[]>([]);
	const [orgsLoading, setOrgsLoading] = useState(false);
	const [orgsError, setOrgsError] = useState("");

	const [roles, setRoles] = useState<RoleOption[]>([]);
	const [rolesLoading, setRolesLoading] = useState(false);
	const [rolesError, setRolesError] = useState("");

	const [sending, setSending] = useState(false);

	const fetchOrgs = async () => {
		setOrgsLoading(true);
		setOrgsError("");
		try {
			const res = await http.get("admin/organizations/");
			const resp: Resp = res.data;
			if (resp.error) {
				setOrgsError(resp.data || "Could not load organisations.");
				setOrgs([]);
				return;
			}
			const payload: any = resp.code ?? {};
			const list: any[] = Array.isArray(payload)
				? payload
				: Array.isArray(payload.results)
				? payload.results
				: Array.isArray(payload.organizations)
				? payload.organizations
				: [];
			setOrgs(
				list.map((o) => ({
					id: o.id,
					name: o.name ?? o.organisation_name ?? "—",
					status: o.status ?? o.verification_status,
					type: o.org_type ?? o.type ?? o.organisation_type,
				}))
			);
		} catch (err: any) {
			setOrgsError(
				err?.response?.data?.message || "Could not load organisations."
			);
			setOrgs([]);
		} finally {
			setOrgsLoading(false);
		}
	};

	const fetchRoles = async () => {
		setRolesLoading(true);
		setRolesError("");
		try {
			const res = await http.get("admin/roles/");
			const resp: Resp = res.data;
			if (resp.error) {
				setRolesError(resp.data || "Could not load roles.");
				setRoles([]);
				return;
			}
			const payload: any = resp.code ?? {};
			const list: any[] = Array.isArray(payload)
				? payload
				: Array.isArray(payload.results)
				? payload.results
				: Array.isArray(payload.roles)
				? payload.roles
				: [];
			setRoles(
				list.map((r) => ({
					id: r.id,
					role_key: r.role_key ?? r.key ?? "",
					role_name: r.role_name ?? r.name ?? "—",
					scope: (r.scope ?? "organisation") as "system" | "organisation",
					description: r.description,
					is_active: r.is_active,
				}))
			);
		} catch (err: any) {
			setRolesError(err?.response?.data?.message || "Could not load roles.");
			setRoles([]);
		} finally {
			setRolesLoading(false);
		}
	};

	useEffect(() => {
		void fetchRoles();
		void fetchOrgs();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const scopedRoles = useMemo(() => {
		return roles.filter((r) => {
			if (!isActive(r)) return false;
			if (accountType === "system") {
				return r.scope === "system";
			}
			if (r.scope !== "organisation") return false;
			if (INTERNAL_ROLE_KEYS.has(r.role_key)) return false;
			return true;
		});
	}, [roles, accountType]);

	useEffect(() => {
		setRoleId("");
	}, [accountType]);

	const selectedOrg = orgs.find((o) => o.id === orgId) ?? null;
	const selectedRole = roles.find((r) => r.id === roleId) ?? null;

	const canContinue =
		accountType === "organisation"
			? fullName.trim() && email.trim() && phone.trim() && orgId && roleId
			: fullName.trim() && email.trim() && phone.trim() && roleId;

	const handleReview = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!canContinue) {
			toast.error("Please complete all required fields.");
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			toast.error("Enter a valid email address.");
			return;
		}
		setStep("review");
	};

	const handleSendInvite = async () => {
		if (sending) return;
		setSending(true);
		try {
			const payload: Record<string, any> = {
				account_type: accountType,
				full_name: fullName.trim(),
				email: email.trim().toLowerCase(),
				phone: phone.trim(),
				role_id: roleId,
			};
			if (accountType === "organisation") {
				payload.organisation_id = orgId;
				if (jobTitle.trim()) payload.job_title = jobTitle.trim();
			}

			const res = await http.post("admin/users/invite/", payload);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not send the invite.");
				return;
			}
			toast.success(`Invite sent to ${email.trim()}.`);
			navigate("/admin/users");
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Could not send the invite.");
		} finally {
			setSending(false);
		}
	};

	return (
		<AppShell title="Add user" eyebrow="Administration · Identity Management">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0">
					<Link
						to="/admin/users"
						className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-orange"
					>
						<ArrowLeft className="size-3.5" />
						Back to users
					</Link>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Invite a new user
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						The invited user completes their own registration and sets
						their password. You choose the scope and the role they receive
						once they accept.
					</p>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr] lg:items-start">
				{step === "form" ? (
					<form
						onSubmit={handleReview}
						className="space-y-5 rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6"
					>
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Account type
							</p>
							<div className="mt-3 grid gap-2 sm:grid-cols-2">
								{(Object.keys(accountTypeMeta) as AccountType[]).map((key) => {
									const meta = accountTypeMeta[key];
									const Icon = meta.icon;
									const active = accountType === key;
									return (
										<button
											key={key}
											type="button"
											onClick={() => setAccountType(key)}
											className={cn(
												"rounded-xl border p-4 text-left transition-colors",
												active
													? "border-orange bg-orange/5 ring-1 ring-orange/30"
													: "border-line bg-sand hover:bg-sand-2"
											)}
										>
											<div className="flex items-center gap-2">
												<Icon
													className={cn(
														"size-4",
														active ? "text-orange-deep" : "text-ink-soft"
													)}
												/>
												<p className="text-[13px] font-semibold text-ink">
													{meta.title}
												</p>
											</div>
											<p className="mt-2 text-[11px] leading-5 text-ink-soft">
												{meta.detail}
											</p>
										</button>
									);
								})}
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<label className="block sm:col-span-2">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Full name <span className="text-coral">*</span>
								</span>
								<Input
									required
									value={fullName}
									onChange={(e) => setFullName(e.target.value)}
									placeholder="e.g. Tunde Lawal"
									className="mt-1.5 h-11 border-line bg-sand text-ink"
								/>
							</label>

							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Work email <span className="text-coral">*</span>
								</span>
								<Input
									required
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="e.g. tunde@atlantictrade.com"
									className="mt-1.5 h-11 border-line bg-sand text-ink"
								/>
							</label>

							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Phone <span className="text-coral">*</span>
								</span>
								<Input
									required
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									placeholder="e.g. +234 803 000 0000"
									className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
								/>
							</label>
						</div>

						{accountType === "organisation" && (
							<>
								<label className="block">
									<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Organisation <span className="text-coral">*</span>
									</span>
									{orgsLoading ? (
										<div className="mt-2 flex items-center gap-2 text-[12px] text-ink-soft">
											<span className="size-3.5 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
											Loading organisations…
										</div>
									) : orgsError ? (
										<div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-coral">
											{orgsError}
											<button
												type="button"
												onClick={() => void fetchOrgs()}
												className="font-semibold underline"
											>
												Retry
											</button>
										</div>
									) : (
										<select
											required
											value={orgId}
											onChange={(e) => setOrgId(e.target.value)}
											className="mt-1.5 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none"
										>
											<option value="">Select an organisation…</option>
											{orgs.map((o) => (
												<option key={o.id} value={o.id}>
													{o.name}
													{o.status && o.status !== "verified"
														? ` · ${statusLabel[o.status] ?? o.status}`
														: ""}
												</option>
											))}
										</select>
									)}
								</label>

								<label className="block">
									<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Job title
									</span>
									<Input
										value={jobTitle}
										onChange={(e) => setJobTitle(e.target.value)}
										placeholder="e.g. Clearing Agent, Operations Lead"
										className="mt-1.5 h-11 border-line bg-sand text-ink"
									/>
								</label>
							</>
						)}

						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Role <span className="text-coral">*</span>
							</span>
							{rolesLoading ? (
								<div className="mt-2 flex items-center gap-2 text-[12px] text-ink-soft">
									<span className="size-3.5 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
									Loading roles…
								</div>
							) : rolesError ? (
								<div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-coral">
									{rolesError}
									<button
										type="button"
										onClick={() => void fetchRoles()}
										className="font-semibold underline"
									>
										Retry
									</button>
								</div>
							) : scopedRoles.length === 0 ? (
								<p className="mt-2 text-[12px] text-ink-soft">
									No roles available for this account type.
								</p>
							) : (
								<select
									required
									value={roleId}
									onChange={(e) => setRoleId(e.target.value)}
									className="mt-1.5 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none"
								>
									<option value="">Select a role…</option>
									{scopedRoles.map((r) => (
										<option key={r.id} value={r.id}>
											{r.role_name}
										</option>
									))}
								</select>
							)}
							{accountType === "organisation" && (
								<p className="mt-2 text-[11px] leading-5 text-ink-soft">
									Terminal operations roles (Gate Officer, Warehouse/Yard
									Officer, Documentation Officer, Terminal Operations) are
									TRÏNŪ internal and are not assignable to organisation
									users.
								</p>
							)}
						</label>

						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<div className="flex items-start gap-3">
								<ShieldCheck className="mt-0.5 size-4 shrink-0 text-orange" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										What happens next
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										We'll email {email.trim() || "the user"} an invite link.
										They set their own password, verify their email and
										phone, then become active. You can revoke access at any
										time from the users page.
									</p>
								</div>
							</div>
						</div>

						<div className="flex items-center justify-end gap-2 border-t border-line pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => navigate("/admin/users")}
								className="border-line bg-paper text-ink hover:bg-sand"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={!canContinue}
								className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
							>
								Review invite
								<ArrowRight className="size-4" />
							</Button>
						</div>
					</form>
				) : (
					<div className="space-y-5 rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
								Review
							</p>
							<p className="mt-1 text-[13px] leading-6 text-ink-soft">
								Confirm the details below before sending the invite.
							</p>
						</div>

						<dl className="grid gap-4 sm:grid-cols-2">
							<ReviewField
								label="Account type"
								value={
									accountType === "organisation"
										? "Organisation user"
										: "System user"
								}
							/>
							<ReviewField label="Full name" value={fullName.trim()} />
							<ReviewField label="Email" value={email.trim()} mono />
							<ReviewField label="Phone" value={phone.trim()} mono />
							{accountType === "organisation" && (
								<>
									<ReviewField
										label="Organisation"
										value={selectedOrg?.name ?? "—"}
									/>
									<ReviewField
										label="Job title"
										value={jobTitle.trim() || "—"}
									/>
								</>
							)}
							<ReviewField
								label="Role"
								value={selectedRole?.role_name ?? "—"}
							/>
						</dl>

						<div className="rounded-xl bg-orange/5 p-4 ring-1 ring-orange/20">
							<div className="flex items-start gap-3">
								<ShieldCheck className="mt-0.5 size-4 shrink-0 text-orange-deep" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Invite email
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										An invite will be sent to{" "}
										<span className="font-mono text-ink">
											{email.trim()}
										</span>
										. The invite expires in 72 hours. You can resend from
										the users page if it lapses.
									</p>
								</div>
							</div>
						</div>

						<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
							<Button
								type="button"
								variant="ghost"
								onClick={() => setStep("form")}
								disabled={sending}
								className="text-ink-soft"
							>
								Back
							</Button>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => navigate("/admin/users")}
									disabled={sending}
									className="border-line bg-paper text-ink hover:bg-sand"
								>
									Cancel
								</Button>
								<Button
									type="button"
									onClick={handleSendInvite}
									disabled={sending}
									className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
								>
									<UserPlus className="size-4" />
									{sending ? "Sending invite…" : "Send invite"}
								</Button>
							</div>
						</div>
					</div>
				)}

				<aside className="space-y-4 lg:sticky lg:top-20">
					<div className="rounded-2xl bg-slate p-5 text-sand ring-1 ring-slate">
						<div className="flex items-center gap-2">
							<ShieldCheck className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								Access control
							</p>
						</div>
						<p className="mt-3 text-[13px] leading-6 text-sand/90">
							Only administrators can invite users. The invited user never
							sees your password, and you never set theirs. Roles and
							organisation scope are locked when the invite is accepted.
						</p>
						<div className="mt-4 space-y-3">
							<StatusRow
								icon={UsersRound}
								label="Account type"
								value={
									accountType === "organisation"
										? "Organisation"
										: "System"
								}
								tone="info"
							/>
							<StatusRow
								icon={Building2}
								label="Organisation"
								value={selectedOrg?.name ?? "Not selected"}
								tone={selectedOrg ? "success" : "warning"}
							/>
							<StatusRow
								icon={ShieldCheck}
								label="Role"
								value={selectedRole?.role_name ?? "Not selected"}
								tone={selectedRole ? "success" : "warning"}
							/>
						</div>
					</div>

					<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
						<div className="flex items-center gap-2">
							<CheckCircle2 className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								Invite flow
							</p>
						</div>
						<ol className="mt-3 space-y-2.5 text-[12px] leading-5 text-ink-soft">
							<li className="flex gap-2">
								<span className="mt-1 size-1.5 shrink-0 rounded-full bg-orange" />
								Admin sends invite from this page.
							</li>
							<li className="flex gap-2">
								<span className="mt-1 size-1.5 shrink-0 rounded-full bg-orange" />
								User receives an email with a signed invite link.
							</li>
							<li className="flex gap-2">
								<span className="mt-1 size-1.5 shrink-0 rounded-full bg-orange" />
								User sets their own password and verifies email + phone.
							</li>
							<li className="flex gap-2">
								<span className="mt-1 size-1.5 shrink-0 rounded-full bg-orange" />
								Account becomes active with the assigned role and scope.
							</li>
							<li className="flex gap-2">
								<span className="mt-1 size-1.5 shrink-0 rounded-full bg-orange" />
								Admin can suspend or revoke from the users page.
							</li>
						</ol>
					</div>
				</aside>
			</div>
		</AppShell>
	);
}

function ReviewField({
	label,
	value,
	mono,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div>
			<dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
			</dt>
			<dd
				className={cn(
					"mt-1.5 text-[13px] text-ink",
					mono ? "font-mono" : "font-medium"
				)}
			>
				{value}
			</dd>
		</div>
	);
}

function StatusRow({
	icon: Icon,
	label,
	value,
	tone = "neutral",
}: {
	icon: typeof ShieldCheck;
	label: string;
	value: string;
	tone?: "success" | "warning" | "critical" | "info" | "neutral";
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
			: "bg-sand/40";

	return (
		<div className="flex items-center justify-between gap-3 rounded-lg bg-sand/5 px-3 py-2.5 ring-1 ring-sand/15">
			<div className="flex min-w-0 items-center gap-2">
				<Icon className="size-3.5 shrink-0 text-orange" />
				<span className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-sand/70">
					{label}
				</span>
			</div>
			<div className="flex min-w-0 items-center gap-2">
				<span className="truncate text-[12px] font-medium text-sand">
					{value}
				</span>
				<span className={cn("size-1.5 shrink-0 rounded-full", dotTone)} />
			</div>
		</div>
	);
}