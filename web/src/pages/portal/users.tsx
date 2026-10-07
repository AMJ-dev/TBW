import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Check,
	Loader2,
	Search,
	ShieldCheck,
	Trash2,
	UserCheck,
	UserPlus,
	Users,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";
import { resolveSrc } from "@/lib/functions";

type UserStatus = "Active" | "Invited" | "Suspended" | "Removed";

interface OrgUser {
	id: string;
	membership_id?: string;
	name: string;
	email: string;
	phone: string;
	role: string;
	role_key?: string;
	status: UserStatus | string;
	lastActive: string;
	invitedAt: string;
	acceptedAt?: string;
	mfa: boolean;
	pics?: string | null;
	membership_status?: string;
}

interface OrgRole {
	id: string;
	role_key: string;
	role_name: string;
	scope: "system" | "organisation";
	description?: string;
	is_active?: number | boolean;
}

interface UsersMetrics {
	total: number;
	active: number;
	invited: number;
	mfa_enabled: number;
}

const isRoleActive = (r: OrgRole) =>
	r.is_active === undefined ? true : Boolean(Number(r.is_active));

const formatDate = (input?: string | null) => {
	if (!input) return "—";
	const d = new Date(input);
	if (Number.isNaN(d.getTime())) return "—";
	return d.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

const formatLastActive = (input?: string | null) => {
	if (!input) return "Never";
	const d = new Date(input);
	if (Number.isNaN(d.getTime())) return "—";
	const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
	if (diffMin < 1) return "Active now";
	if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
	const diffHr = Math.floor(diffMin / 60);
	if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
	const diffDay = Math.floor(diffHr / 24);
	if (diffDay === 1) return "Yesterday";
	if (diffDay < 7) return `${diffDay} days ago`;
	return formatDate(input);
};

const displayStatus = (status: string) => {
	switch (status.toLowerCase()) {
		case "active":
			return "Active";
		case "pending":
		case "pending_approval":
		case "invited":
			return "Invited";
		case "suspended":
			return "Suspended";
		case "removed":
		case "revoked":
			return "Removed";
		default:
			return status;
	}
};

export default function PortalUsersRoute() {
	const [users, setUsers] = useState<OrgUser[]>([]);
	const [roles, setRoles] = useState<OrgRole[]>([]);
	const [metrics, setMetrics] = useState<UsersMetrics | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [query, setQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState<string>("all");
	const [isInviteOpen, setIsInviteOpen] = useState(false);
	const [removeTarget, setRemoveTarget] = useState<OrgUser | null>(null);
	const [removing, setRemoving] = useState(false);

	const fetchUsers = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("portal/users/");
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load users.");
				setUsers([]);
				setMetrics(null);
				return;
			}
			const payload: any = resp.code ?? {};
			const list: any[] = Array.isArray(payload)
				? payload
				: Array.isArray(payload.results)
				? payload.results
				: Array.isArray(payload.users)
				? payload.users
				: Array.isArray(payload.staff)
				? payload.staff
				: [];

			const normalized: OrgUser[] = list.map((u) => ({
				id: u.id,
				membership_id: u.membership_id,
				name:
					u.full_name?.trim() ||
					u.name?.trim() ||
					u.email?.split("@")[0] ||
					"Unknown user",
				email: u.email ?? "",
				phone: u.phone ?? "",
				role: u.role_name ?? u.role ?? u.role_in_org ?? "—",
				role_key: u.role_key ?? u.role?.role_key,
				status: displayStatus(
					(u.account_status ?? u.status ?? "pending").toString()
				),
				lastActive: formatLastActive(u.last_login_at ?? null),
				invitedAt: formatDate(u.membership_created_at ?? u.created_at ?? null),
				acceptedAt: u.joined_at ?? undefined,
				mfa: Boolean(u.mfa_enabled ?? u.two_factor_enabled ?? false),
				pics: u.pics ?? null,
				membership_status: u.membership_status,
			}));

			setUsers(normalized);

			const computedMetrics: UsersMetrics =
				payload.metrics ?? {
					total: normalized.length,
					active: normalized.filter((u) => u.status === "Active").length,
					invited: normalized.filter((u) => u.status === "Invited").length,
					mfa_enabled: normalized.filter(
						(u) => u.mfa && u.status === "Active"
					).length,
				};
			setMetrics(computedMetrics);
		} catch (err: any) {
			setError(err?.response?.data?.message || "Could not load users.");
			setUsers([]);
			setMetrics(null);
		} finally {
			setLoading(false);
		}
	};

	const fetchRoles = async () => {
		try {
			const res = await http.get("portal/roles/");
			const resp: Resp = res.data;
			if (resp.error) return;
			const payload: any = resp.code ?? {};
			const list: any[] = Array.isArray(payload)
				? payload
				: Array.isArray(payload.results)
				? payload.results
				: Array.isArray(payload.roles)
				? payload.roles
				: [];
			setRoles(
				list
					.map((r) => ({
						id: r.id,
						role_key: r.role_key ?? r.key ?? "",
						role_name: r.role_name ?? r.name ?? "—",
						scope: (r.scope ?? "organisation") as "system" | "organisation",
						description: r.description,
						is_active: r.is_active,
					}))
					.filter((r) => r.scope === "organisation" && isRoleActive(r))
			);
		} catch {
			// Silent — roles are used for filtering and the invite modal.
		}
	};

	useEffect(() => {
		void fetchUsers();
		void fetchRoles();
	}, []);

	const availableRoles = roles;

	const filtered = useMemo(() => {
		return users.filter((u) => {
			const q = query.trim().toLowerCase();
			const matchQuery =
				!q ||
				u.name.toLowerCase().includes(q) ||
				u.email.toLowerCase().includes(q) ||
				u.role.toLowerCase().includes(q);
			const matchRole = roleFilter === "all" || u.role === roleFilter;
			return matchQuery && matchRole;
		});
	}, [users, query, roleFilter]);

	const stats = useMemo(() => {
		const active =
			metrics?.active ?? users.filter((u) => u.status === "Active").length;
		const invited =
			metrics?.invited ?? users.filter((u) => u.status === "Invited").length;
		const mfaEnabled =
			metrics?.mfa_enabled ??
			users.filter((u) => u.mfa && u.status === "Active").length;
		const owners = users.filter(
			(u) => u.role_key === "organisation_owner" && u.status === "Active"
		).length;
		return { active, invited, mfaEnabled, owners };
	}, [users, metrics]);

	const mfaCoverage =
		stats.active > 0 ? Math.round((stats.mfaEnabled / stats.active) * 100) : 0;

	const handleInvite = async (payload: {
		name: string;
		email: string;
		phone: string;
		role_id: string;
	}) => {
		const res = await http.post("portal/user/invite/", {
			full_name: payload.name,
			email: payload.email.trim().toLowerCase(),
			phone: payload.phone.trim(),
			role_id: payload.role_id,
		});
		const resp: Resp = res.data;
		if (resp.error) {
			toast.error(resp.data || "Could not send the invitation.");
			return false;
		}
		toast.success(`Invitation sent to ${payload.email}.`);
		await fetchUsers();
		return true;
	};

	const handleRemove = async () => {
		if (!removeTarget || removing) return;
		setRemoving(true);
		try {
			const res = await http.post("portal/user/remove/", {
				user_id: removeTarget.id,
				membership_id: removeTarget.membership_id,
			});
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not remove this user.");
				return;
			}
			toast.success(`${removeTarget.name} has been removed.`);
			setRemoveTarget(null);
			await fetchUsers();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not remove this user."
			);
		} finally {
			setRemoving(false);
		}
	};

	const handleResend = async (user: OrgUser) => {
		try {
			const res = await http.post("portal/user/invite/resend/", {
				user_id: user.id,
				membership_id: user.membership_id,
			});
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not resend the invitation.");
				return;
			}
			toast.success(`Invitation re-sent to ${user.email}.`);
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not resend the invitation."
			);
		}
	};

	return (
		<AppShell title="Users & access" eyebrow="Account administration">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Account · Users
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Manage the users on your account
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Invite colleagues from your organisation, assign roles, and control who can act
						on your behalf. Every change is logged to the account audit trail.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link to="/portal/delegation">
						<Button variant="outline" className="border-line bg-paper text-ink">
							<Users className="mr-1.5 size-4" /> Manage delegations
						</Button>
					</Link>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsInviteOpen(true)}
						disabled={availableRoles.length === 0}
					>
						<UserPlus className="mr-1.5 size-4" /> Invite user
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Active users"
					value={String(stats.active)}
					detail={`${stats.owners} owner${stats.owners === 1 ? "" : "s"}`}
					tone="info"
					icon={UserCheck}
				/>
				<Metric
					label="Pending invites"
					value={String(stats.invited)}
					detail="Awaiting acceptance"
					tone="warning"
					icon={UserPlus}
				/>
				<Metric
					label="MFA coverage"
					value={`${mfaCoverage}%`}
					detail={`${stats.mfaEnabled} of ${stats.active} enabled`}
					tone={mfaCoverage >= 80 ? "success" : "warning"}
					icon={ShieldCheck}
				/>
				<Metric
					label="Total records"
					value={String(users.length)}
					detail="Including removed users"
					tone="neutral"
					icon={Users}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by name, email, or role..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={() => setRoleFilter("all")}
							className={cn(
								"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
								roleFilter === "all"
									? "bg-ink text-sand"
									: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
							)}
						>
							All
						</button>
						{availableRoles.map((r) => (
							<button
								key={r.id}
								type="button"
								onClick={() => setRoleFilter(r.role_name)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									roleFilter === r.role_name
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{r.role_name}
							</button>
						))}
					</div>
				</div>

				{loading ? (
					<div className="flex items-center justify-center p-10">
						<span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
					</div>
				) : error ? (
					<div className="p-6 sm:p-8">
						<div className="flex items-start gap-3">
							<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
								<AlertTriangle className="size-5" />
							</div>
							<div>
								<p className="font-display text-base font-bold text-ink">
									Could not load users
								</p>
								<p className="mt-1 text-sm leading-6 text-ink-soft">{error}</p>
							</div>
						</div>
						<div className="mt-5">
							<Button
								onClick={() => void fetchUsers()}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								Try again
							</Button>
						</div>
					</div>
				) : filtered.length === 0 ? (
					<div className="p-12 text-center">
						<Users className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">
							{users.length === 0
								? "No users on this account yet."
								: "No users match your filters."}
						</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							{users.length === 0
								? "Invite a colleague to get started."
								: "Try a different name, email, or role."}
						</p>
					</div>
				) : (
					<ul className="divide-y divide-line">
						{filtered.map((u) => {
							const isRemoved = u.status === "Removed";
							const isOwner = u.role_key === "organisation_owner";
							return (
								<li
									key={u.membership_id ?? u.id}
									className={cn(
										"flex flex-wrap items-center gap-4 px-5 py-4",
										isRemoved && "opacity-60"
									)}
								>
									<div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-ink font-display text-[13px] font-semibold text-sand">
										{u.pics && u.pics !== "avatar.png" ? (
											<img
												src={resolveSrc(u.pics)}
												alt={u.name}
												className="size-full object-cover"
											/>
										) : (
											u.name
												.split(" ")
												.map((p) => p.charAt(0))
												.join("")
												.slice(0, 2)
												.toUpperCase()
										)}
									</div>

									<div className="min-w-[220px] flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<p className="text-sm font-semibold text-ink">{u.name}</p>
											<StatusBadge
												label={u.status}
												tone={statusTone(u.status)}
											/>
											{isOwner && (
												<span className="rounded bg-orange/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-orange-deep">
													Owner
												</span>
											)}
										</div>
										<p className="mt-1 text-[12px] text-ink-soft">
											<span className="font-mono">{u.email}</span>
											{u.phone && (
												<>
													{" · "}
													<span className="font-mono">{u.phone}</span>
												</>
											)}
										</p>
									</div>

									<div className="min-w-[140px]">
										<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											Role
										</p>
										<p className="mt-1 text-[13px] font-medium text-ink">{u.role}</p>
									</div>

									<div className="min-w-[140px]">
										<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											MFA
										</p>
										<p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-ink">
											{u.mfa ? (
												<>
													<ShieldCheck className="size-3.5 text-teal-deep" />
													Enabled
												</>
											) : (
												<>
													<AlertTriangle className="size-3.5 text-orange-deep" />
													Not enabled
												</>
											)}
										</p>
									</div>

									<div className="min-w-[140px]">
										<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											Last active
										</p>
										<p className="mt-1 font-mono text-[12px] text-ink-soft">
											{u.lastActive}
										</p>
										<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
											Invited {u.invitedAt}
										</p>
									</div>

									<div className="ml-auto flex items-center gap-2">
										{u.status === "Invited" && (
											<Button
												variant="outline"
												size="sm"
												className="border-line bg-paper text-ink"
												onClick={() => handleResend(u)}
											>
												Resend invite
											</Button>
										)}
										{!isRemoved && !isOwner && (
											<Button
												variant="outline"
												size="sm"
												className="border-line bg-paper text-coral hover:bg-coral/10"
												onClick={() => setRemoveTarget(u)}
											>
												<Trash2 className="size-3.5" />
												Remove
											</Button>
										)}
										{isOwner && (
											<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
												Account owner
											</span>
										)}
										{isRemoved && (
											<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
												Removed
											</span>
										)}
									</div>
								</li>
							);
						})}
					</ul>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filtered.length} of {users.length} user records
					</span>
					<span>Every change logged to the account audit trail</span>
				</div>
			</section>

			<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
				<div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
					<div>
						<div className="flex items-center gap-2">
							<ShieldCheck className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								Roles at a glance
							</p>
						</div>
						<h3 className="mt-3 font-display text-xl font-bold text-ink">
							What each role can do
						</h3>
						<p className="mt-2 max-w-xl text-[13px] leading-6 text-ink-soft">
							Roles determine what a user can do in your account. Use the least privilege
							needed for each person's responsibilities.
						</p>
					</div>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						{availableRoles.length === 0 ? (
							<p className="text-[12px] text-ink-soft">
								Roles are loading or unavailable.
							</p>
						) : (
							<ul className="space-y-3 text-[12px] leading-5">
								{availableRoles.map((r) => (
									<li key={r.id}>
										<p className="font-semibold text-ink">{r.role_name}</p>
										<p className="mt-0.5 text-ink-soft">
											{r.description ?? "—"}
										</p>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</div>

			{isInviteOpen && (
				<InviteUserModal
					onClose={() => setIsInviteOpen(false)}
					onSubmit={handleInvite}
					existingUsers={users}
					roles={availableRoles}
				/>
			)}

			{removeTarget && (
				<RemoveUserDialog
					user={removeTarget}
					onClose={() => setRemoveTarget(null)}
					onConfirm={handleRemove}
					removing={removing}
				/>
			)}
		</AppShell>
	);
}

function InviteUserModal({
	onClose,
	onSubmit,
	existingUsers,
	roles,
}: {
	onClose: () => void;
	onSubmit: (payload: {
		name: string;
		email: string;
		phone: string;
		role_id: string;
	}) => Promise<boolean>;
	existingUsers: OrgUser[];
	roles: OrgRole[];
}) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [roleId, setRoleId] = useState<string>("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!roleId && roles.length > 0) {
			const defaultRole =
				roles.find((r) => r.role_key === "portal_user") ?? roles[0];
			if (defaultRole) setRoleId(defaultRole.id);
		}
	}, [roles, roleId]);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!name.trim() || !email.trim() || !phone.trim() || !roleId) {
			toast.error("Name, email, phone, and role are required.");
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			toast.error("Enter a valid email address.");
			return;
		}
		if (
			existingUsers.some(
				(u) => u.email.toLowerCase() === email.trim().toLowerCase()
			)
		) {
			toast.error("A user with that email already exists on this account.");
			return;
		}
		setSubmitting(true);
		try {
			const ok = await onSubmit({
				name: name.trim(),
				email: email.trim(),
				phone: phone.trim(),
				role_id: roleId,
			});
			if (ok) onClose();
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
					<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								New user
							</p>
							<h3 className="mt-1 font-display text-xl font-bold text-ink">
								Invite a colleague to your account
							</h3>
							<p className="mt-1 text-[12px] text-ink-soft">
								They receive an email invitation. Access begins once they accept and
								set up two-factor authentication.
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={onClose}
							aria-label="Close dialog"
						>
							<X />
						</Button>
					</div>

					<div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Full name"
								placeholder="e.g. Chinedu Okafor"
								value={name}
								onChange={setName}
								required
							/>
							<Field
								label="Email"
								placeholder="name@company.ng"
								value={email}
								onChange={setEmail}
								type="email"
								required
							/>
						</div>

						<Field
							label="Phone"
							placeholder="+234 ..."
							value={phone}
							onChange={setPhone}
							required
						/>

						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Role
							</p>
							<div className="mt-3 grid gap-2">
								{roles.map((r) => {
									const active = roleId === r.id;
									return (
										<button
											key={r.id}
											type="button"
											onClick={() => setRoleId(r.id)}
											className={cn(
												"flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
												active
													? "border-orange bg-orange/5 ring-1 ring-orange/30"
													: "border-line bg-sand hover:bg-sand-2"
											)}
										>
											<span
												className={cn(
													"mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
													active
														? "border-orange bg-orange text-white"
														: "border-line bg-paper"
												)}
											>
												{active && <Check className="size-3" />}
											</span>
											<span className="min-w-0">
												<span className="text-sm font-semibold text-ink">
													{r.role_name}
												</span>
												<span className="mt-0.5 block text-[11px] leading-5 text-ink-soft">
													{r.description ?? "—"}
												</span>
											</span>
										</button>
									);
								})}
							</div>
						</div>

						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<div className="flex items-start gap-3">
								<ShieldCheck className="mt-0.5 size-4 shrink-0 text-orange" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Two-factor authentication
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										The user will be asked to set up two-factor authentication when
										they accept the invitation. This is required for all account
										users.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-between gap-3 border-t border-line p-5 sm:p-6">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							className="text-ink-soft"
							disabled={submitting}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={submitting || roles.length === 0}
							className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
						>
							{submitting ? (
								<>
									<Loader2 className="size-4 animate-spin" />
									Sending…
								</>
							) : (
								<>
									Send invitation <ArrowRight />
								</>
							)}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

function RemoveUserDialog({
	user,
	onClose,
	onConfirm,
	removing,
}: {
	user: OrgUser;
	onClose: () => void;
	onConfirm: () => void;
	removing: boolean;
}) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-md rounded-2xl bg-paper p-6 shadow-2xl ring-1 ring-line">
				<div className="flex items-start gap-3">
					<div className="grid size-11 shrink-0 place-items-center rounded-full bg-coral/10 text-coral">
						<AlertTriangle className="size-5" />
					</div>
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-coral">
							Remove user
						</p>
						<h3 className="mt-1 font-display text-lg font-bold text-ink">
							Remove {user.name}?
						</h3>
						<p className="mt-2 text-[12px] leading-5 text-ink-soft">
							They immediately lose access to your account. Their historical actions
							remain on the audit trail. This action cannot be undone — you can invite
							them again at any time.
						</p>
					</div>
				</div>

				<div className="mt-5 rounded-xl bg-sand p-4 ring-1 ring-line">
					<dl className="space-y-2 text-[12px]">
						<div className="flex justify-between gap-3">
							<dt className="text-ink-soft">Email</dt>
							<dd className="font-mono text-ink">{user.email}</dd>
						</div>
						<div className="flex justify-between gap-3">
							<dt className="text-ink-soft">Role</dt>
							<dd className="text-ink">{user.role}</dd>
						</div>
						<div className="flex justify-between gap-3">
							<dt className="text-ink-soft">Status</dt>
							<dd className="text-ink">{user.status}</dd>
						</div>
					</dl>
				</div>

				<div className="mt-6 flex justify-end gap-2">
					<Button
						variant="outline"
						onClick={onClose}
						className="border-line bg-paper text-ink"
						disabled={removing}
					>
						Keep user
					</Button>
					<Button
						onClick={onConfirm}
						disabled={removing}
						className="bg-coral text-white hover:bg-coral/90 disabled:opacity-60"
					>
						{removing ? "Removing…" : "Remove user"}
					</Button>
				</div>
			</div>
		</div>
	);
}

function Field({
	label,
	placeholder,
	value,
	onChange,
	type = "text",
	required,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	required?: boolean;
}) {
	return (
		<label className="block">
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
				{required && <span className="text-coral"> *</span>}
			</span>
			<Input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="mt-2 h-11 border-line bg-sand text-ink"
			/>
		</label>
	);
}