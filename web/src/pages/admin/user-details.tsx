import { useEffect, useState } from "react";
import { Link } from "@/components/router-link";
import { useNavigate, useParams } from "react-router-dom";
import {
	AlertTriangle,
	ArrowLeft,
	Building2,
	Calendar,
	CheckCircle2,
	Clock3,
	KeyRound,
	Mail,
	Phone,
	ShieldCheck,
	ShieldX,
	User,
	UsersRound,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge, Metric, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";
import { resolveSrc } from "@/lib/functions";

interface UserDetail {
	id: string;
	full_name: string;
	email: string;
	phone?: string | null;
	pics?: string | null;
	account_status: string;
	email_verified_at?: string | null;
	last_login_at?: string | null;
	created_at?: string | null;
	updated_at?: string | null;
	role?: { key?: string; name?: string } | string | null;
	role_in_org?: string | null;
	organization?: {
		id: string;
		name: string;
		type?: string;
		rc_number?: string | null;
		tin?: string | null;
		status?: string;
	} | null;
	org_id?: string | null;
	org_name?: string | null;
	mfa_enabled?: boolean;
	two_factor_enabled?: boolean;
	last_password_change_at?: string | null;
	active_sessions?: number;
	delegations?: Array<{
		id: string;
		grantee_name?: string;
		grantee_email?: string;
		scope?: string;
		status?: string;
		expires_at?: string | null;
	}>;
}

interface ApiUserDetailResponse {
	user?: UserDetail;
	organisation?: UserDetail["organization"];
	organization?: UserDetail["organization"];
	staff?: UserDetail;
	delegations?: UserDetail["delegations"];
}

const statusLabel: Record<string, string> = {
	active: "Active",
	pending: "Pending",
	suspended: "Suspended",
	rejected: "Rejected",
	inactive: "Inactive",
	approved: "Approved",
	invited: "Invited",
};

const roleLabel = (role: UserDetail["role"]): string => {
	if (!role) return "—";
	if (typeof role === "string") return role;
	return role.name ?? role.key ?? "—";
};

const formatDate = (input?: string | null) => {
	if (!input) return "—";
	const d = new Date(input);
	if (Number.isNaN(d.getTime())) return "—";
	return d.toLocaleString("en-NG", {
		day: "numeric",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const formatRelative = (input?: string | null) => {
	if (!input) return "Never";
	const d = new Date(input);
	if (Number.isNaN(d.getTime())) return "—";
	const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
	if (diffMin < 1) return "Just now";
	if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
	const diffHr = Math.floor(diffMin / 60);
	if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
	const diffDay = Math.floor(diffHr / 24);
	if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
	return d.toLocaleDateString("en-NG", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
};

const extractUser = (raw: any): UserDetail | null => {
	if (!raw || typeof raw !== "object") return null;
	if (raw.user) return raw.user as UserDetail;
	if (raw.staff) return raw.staff as UserDetail;
	return raw as UserDetail;
};

export default function AdminUserDetailsPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [user, setUser] = useState<UserDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [working, setWorking] = useState(false);

	const fetchUser = async () => {
		if (!id) return;
		setLoading(true);
		setError("");
		try {
			const res = await http.get(`admin/users/${id}/`);
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load this user.");
				return;
			}
			const payload: ApiUserDetailResponse = resp.code ?? {};
			const record = extractUser(payload);
			if (!record) {
				setError("User record is empty.");
				return;
			}
			// Merge related blocks that may live at the payload root
			setUser({
				...record,
				organization:
					record.organization ??
					payload.organization ??
					payload.organisation ??
					null,
				delegations: record.delegations ?? payload.delegations ?? [],
			});
		} catch (err: any) {
			setError(err?.response?.data?.message || "Could not load this user.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchUser();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const handleSuspend = async () => {
		if (!user || working) return;
		setWorking(true);
		try {
			const res = await http.post(`admin/users/suspend/${user.id}/`);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not suspend this user.");
				return;
			}
			toast.success(`${user.full_name} suspended.`);
			await fetchUser();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Could not suspend this user.");
		} finally {
			setWorking(false);
		}
	};

	const handleReactivate = async () => {
		if (!user || working) return;
		setWorking(true);
		try {
			const res = await http.post(`admin/users/reactivate/${user.id}/`);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not reactivate this user.");
				return;
			}
			toast.success(`${user.full_name} reactivated.`);
			await fetchUser();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not reactivate this user."
			);
		} finally {
			setWorking(false);
		}
	};

	const handleResetMfa = async () => {
		if (!user || working) return;
		setWorking(true);
		try {
			const res = await http.post(`admin/users/reset-mfa/${user.id}/`);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not reset MFA.");
				return;
			}
			toast.success("MFA reset. User will be prompted to enrol again.");
			await fetchUser();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Could not reset MFA.");
		} finally {
			setWorking(false);
		}
	};

	if (loading) {
		return (
			<AppShell title="User details" eyebrow="Administration">
				<div className="flex items-center justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
					<span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
				</div>
			</AppShell>
		);
	}

	if (error || !user) {
		return (
			<AppShell title="User details" eyebrow="Administration">
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load this user
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">
								{error || "The account may have been removed."}
							</p>
						</div>
					</div>
					<div className="mt-5 flex flex-wrap gap-2">
						<Button
							onClick={() => void fetchUser()}
							className="bg-orange text-white hover:bg-orange-deep"
						>
							Try again
						</Button>
						<Button
							variant="outline"
							className="border-line bg-paper text-ink hover:bg-sand"
							onClick={() => navigate("/admin/users")}
						>
							Back to users
						</Button>
					</div>
				</div>
			</AppShell>
		);
	}

	const status = (user.account_status ?? "pending").toString();
	const mfa = Boolean(user.mfa_enabled ?? user.two_factor_enabled);
	const delegations = user.delegations ?? [];

	const canSuspend = status === "active" || status === "pending";
	const canReactivate = status === "suspended" || status === "inactive";

	return (
		<AppShell title={user.full_name} eyebrow="Administration · User">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0">
					<Link
						to="/admin/users"
						className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-orange"
					>
						<ArrowLeft className="size-3.5" />
						Back to users
					</Link>

					<div className="mt-3 flex items-start gap-4">
						<div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-sand ring-1 ring-line">
							{user.pics && user.pics !== "avatar.png" ? (
								<img
									src={resolveSrc(user.pics)}
									alt={user.full_name}
									className="size-full object-cover"
								/>
							) : (
								<span className="font-display text-lg font-semibold">
									{user.full_name.slice(0, 2).toUpperCase()}
								</span>
							)}
						</div>

						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-3">
								<h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
									{user.full_name}
								</h2>
								<StatusBadge
									label={statusLabel[status] ?? status}
									tone={statusTone(status)}
								/>
							</div>
							<p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-ink-soft">
								<span className="inline-flex items-center gap-1.5">
									<Mail className="size-3.5" />
									{user.email}
								</span>
								{user.phone && (
									<span className="inline-flex items-center gap-1.5">
										<Phone className="size-3.5" />
										{user.phone}
									</span>
								)}
								<span className="inline-flex items-center gap-1.5">
									<ShieldCheck className="size-3.5" />
									{roleLabel(user.role) !== "—"
										? roleLabel(user.role)
										: user.role_in_org ?? "—"}
								</span>
								{user.organization?.name && (
									<span className="inline-flex items-center gap-1.5">
										<Building2 className="size-3.5" />
										{user.organization.name}
									</span>
								)}
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap gap-2">
					{mfa && (
						<Button
							variant="outline"
							className="border-line bg-paper text-ink hover:bg-sand"
							onClick={handleResetMfa}
							disabled={working}
						>
							<KeyRound className="size-4" />
							Reset MFA
						</Button>
					)}
					{canReactivate && (
						<Button
							className="bg-orange text-white hover:bg-orange-deep"
							onClick={handleReactivate}
							disabled={working}
						>
							<CheckCircle2 className="size-4" />
							{working ? "Working…" : "Reactivate account"}
						</Button>
					)}
					{canSuspend && (
						<Button
							variant="outline"
							className="border-carmine/30 bg-paper text-carmine hover:bg-carmine/10"
							onClick={handleSuspend}
							disabled={working}
						>
							<ShieldX className="size-4" />
							{working ? "Working…" : "Suspend account"}
						</Button>
					)}
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Account status"
					value={statusLabel[status] ?? status}
					detail={user.email_verified_at ? "Email verified" : "Email not verified"}
					tone={
						status === "active"
							? "success"
							: status === "suspended" || status === "rejected"
							? "critical"
							: "warning"
					}
					icon={ShieldCheck}
				/>
				<Metric
					label="MFA"
					value={mfa ? "Enabled" : "Not enrolled"}
					detail={mfa ? "TOTP active" : "Strongly encouraged"}
					tone={mfa ? "success" : "warning"}
					icon={KeyRound}
				/>
				<Metric
					label="Last login"
					value={formatRelative(user.last_login_at)}
					detail={user.last_login_at ? formatDate(user.last_login_at) : "Never signed in"}
					tone="info"
					icon={Clock3}
				/>
				<Metric
					label="Delegations"
					value={String(delegations.length)}
					detail={
						delegations.length === 0
							? "No delegated access"
							: "Granted to this user"
					}
					tone="info"
					icon={UsersRound}
				/>
			</div>

			<div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-start">
				<div className="space-y-6">
					<section className="rounded-2xl bg-paper p-6 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
							Identity
						</p>
						<dl className="mt-4 grid gap-4 sm:grid-cols-2">
							<Field icon={User} label="Full name" value={user.full_name} />
							<Field icon={Mail} label="Email" value={user.email} mono />
							<Field
								icon={Phone}
								label="Phone"
								value={user.phone ?? "—"}
								mono
							/>
							<Field
								icon={ShieldCheck}
								label="System role"
								value={roleLabel(user.role)}
							/>
							<Field
								icon={UsersRound}
								label="Role in organisation"
								value={user.role_in_org ?? "—"}
							/>
							<Field
								icon={KeyRound}
								label="MFA"
								value={mfa ? "Enabled" : "Not enrolled"}
							/>
							<Field
								icon={Calendar}
								label="Registered"
								value={formatDate(user.created_at)}
							/>
							<Field
								icon={Clock3}
								label="Last updated"
								value={formatDate(user.updated_at)}
							/>
						</dl>
					</section>

					<section className="rounded-2xl bg-paper p-6 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
							Organisation
						</p>
						{user.organization?.name ? (
							<dl className="mt-4 grid gap-4 sm:grid-cols-2">
								<Field
									icon={Building2}
									label="Organisation name"
									value={user.organization.name}
								/>
								<Field
									icon={ShieldCheck}
									label="Organisation type"
									value={
										user.organization.type
											? user.organization.type.replace(/_/g, " ")
											: "—"
									}
								/>
								<Field
									icon={ShieldCheck}
									label="Organisation status"
									value={
										user.organization.status
											? statusLabel[user.organization.status] ??
											  user.organization.status
											: "—"
									}
								/>
								<Field
									icon={User}
									label="RC number"
									value={user.organization.rc_number ?? "—"}
									mono
								/>
								<Field
									icon={User}
									label="TIN"
									value={user.organization.tin ?? "—"}
									mono
								/>
								{user.organization.id && (
									<div className="sm:col-span-2">
										<Link
											to={`/admin/organizations/${user.organization.id}`}
											className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-orange-deep hover:underline"
										>
											View organisation account
										</Link>
									</div>
								)}
							</dl>
						) : (
							<p className="mt-4 text-sm text-ink-soft">
								This user is not attached to an organisation.
							</p>
						)}
					</section>

					<section className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line">
						<div className="flex items-center justify-between gap-3 border-b border-line p-4">
							<div>
								<h3 className="font-display text-sm font-bold text-ink">
									Delegated access
								</h3>
								<p className="text-[11px] text-ink-soft">
									Time-boxed permissions granted to or by this user.
								</p>
							</div>
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
								{delegations.length}{" "}
								{delegations.length === 1 ? "grant" : "grants"}
							</span>
						</div>
						{delegations.length === 0 ? (
							<div className="p-6 text-center text-sm text-ink-soft">
								No delegated access on record.
							</div>
						) : (
							<ul className="divide-y divide-line">
								{delegations.map((d) => (
									<li
										key={d.id}
										className="flex flex-wrap items-center gap-4 px-5 py-4"
									>
										<div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep">
											<UsersRound className="size-5" />
										</div>
										<div className="min-w-[200px] flex-1">
											<p className="text-sm font-semibold text-ink">
												{d.grantee_name ?? "—"}
											</p>
											<p className="mt-0.5 font-mono text-[11px] text-ink-soft">
												{d.grantee_email ?? "—"}
											</p>
										</div>
										<div className="min-w-[160px]">
											<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
												Scope
											</p>
											<p className="mt-0.5 text-[12px] text-ink">
												{d.scope ?? "—"}
											</p>
										</div>
										<div className="min-w-[140px]">
											<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
												Expires
											</p>
											<p className="mt-0.5 font-mono text-[11px] text-ink-soft">
												{d.expires_at ? formatDate(d.expires_at) : "—"}
											</p>
										</div>
										{d.status && (
											<StatusBadge
												label={d.status}
												tone={statusTone(d.status)}
											/>
										)}
									</li>
								))}
							</ul>
						)}
					</section>
				</div>

				<div className="space-y-4">
					<div className="rounded-2xl bg-slate p-5 text-sand ring-1 ring-slate">
						<div className="flex items-center gap-2">
							<ShieldCheck className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								Account health
							</p>
						</div>
						<div className="mt-4 space-y-3">
							<StatusRow
								icon={ShieldCheck}
								label="Account status"
								value={statusLabel[status] ?? status}
								tone={
									status === "active"
										? "success"
										: status === "suspended" || status === "rejected"
										? "critical"
										: "warning"
								}
							/>
							<StatusRow
								icon={Mail}
								label="Email verified"
								value={user.email_verified_at ? "Yes" : "No"}
								tone={user.email_verified_at ? "success" : "warning"}
							/>
							<StatusRow
								icon={KeyRound}
								label="MFA"
								value={mfa ? "Enabled" : "Not enrolled"}
								tone={mfa ? "success" : "warning"}
							/>
							<StatusRow
								icon={Clock3}
								label="Last login"
								value={formatRelative(user.last_login_at)}
								tone="info"
							/>
							<StatusRow
								icon={UsersRound}
								label="Delegations"
								value={String(delegations.length)}
								tone="info"
							/>
						</div>
					</div>

					<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
						<div className="flex items-center gap-2">
							<XCircle className="size-4 text-coral" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-coral">
								Administrative controls
							</p>
						</div>
						<p className="mt-2 text-[12px] leading-5 text-ink-soft">
							Suspending an account immediately blocks sign-in and revokes
							active sessions. Reactivation restores access with the same
							role and permissions.
						</p>
						<div className="mt-4 flex flex-wrap gap-2">
							{canSuspend && (
								<Button
									variant="outline"
									size="sm"
									onClick={handleSuspend}
									disabled={working}
									className="border-carmine/30 bg-paper text-carmine hover:bg-carmine/10"
								>
									<ShieldX className="size-3.5" />
									Suspend
								</Button>
							)}
							{canReactivate && (
								<Button
									size="sm"
									onClick={handleReactivate}
									disabled={working}
									className="bg-orange text-white hover:bg-orange-deep"
								>
									<CheckCircle2 className="size-3.5" />
									Reactivate
								</Button>
							)}
							{mfa && (
								<Button
									variant="outline"
									size="sm"
									onClick={handleResetMfa}
									disabled={working}
									className="border-line bg-paper text-ink hover:bg-sand"
								>
									<KeyRound className="size-3.5" />
									Reset MFA
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>
		</AppShell>
	);
}

function Field({
	icon: Icon,
	label,
	value,
	mono = false,
}: {
	icon: typeof User;
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div>
			<dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				<Icon className="size-3.5 text-orange" />
				{label}
			</dt>
			<dd
				className={cn(
					"mt-2 text-[14px]",
					mono ? "font-mono text-ink" : "font-medium text-ink"
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