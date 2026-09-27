import { useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Check,
	Plus,
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
import { cn } from "@/lib/utils";

type OrgRole =
	| "Owner"
	| "Admin"
	| "Operations"
	| "Finance"
	| "Read-only";

type UserStatus = "Active" | "Invited" | "Suspended" | "Removed";

interface OrgUser {
	id: string;
	name: string;
	email: string;
	phone: string;
	role: OrgRole;
	status: UserStatus;
	lastActive: string;
	invitedAt: string;
	acceptedAt?: string;
	mfa: boolean;
}

const initialUsers: OrgUser[] = [
	{
		id: "u-1",
		name: "Adewale Ogundipe",
		email: "adewale@atlantictrade.ng",
		phone: "+234 803 112 3456",
		role: "Owner",
		status: "Active",
		lastActive: "Active now",
		invitedAt: "12 Jan 2026",
		acceptedAt: "12 Jan 2026",
		mfa: true,
	},
	{
		id: "u-2",
		name: "Chinedu Okafor",
		email: "chinedu@atlantictrade.ng",
		phone: "+234 802 987 6543",
		role: "Operations",
		status: "Active",
		lastActive: "2 hours ago",
		invitedAt: "18 Jan 2026",
		acceptedAt: "19 Jan 2026",
		mfa: true,
	},
	{
		id: "u-3",
		name: "Halima Bello",
		email: "halima@atlantictrade.ng",
		phone: "+234 814 332 1199",
		role: "Finance",
		status: "Active",
		lastActive: "Yesterday",
		invitedAt: "03 Mar 2026",
		acceptedAt: "03 Mar 2026",
		mfa: false,
	},
	{
		id: "u-4",
		name: "Ifeoma Nwosu",
		email: "ifeoma@atlantictrade.ng",
		phone: "+234 805 441 2288",
		role: "Admin",
		status: "Active",
		lastActive: "3 days ago",
		invitedAt: "22 Apr 2026",
		acceptedAt: "22 Apr 2026",
		mfa: true,
	},
	{
		id: "u-5",
		name: "Tunde Adeyemi",
		email: "tunde@atlantictrade.ng",
		phone: "+234 816 778 9900",
		role: "Read-only",
		status: "Invited",
		lastActive: "—",
		invitedAt: "22 Sep 2026",
		mfa: false,
	},
];

const roleOptions: {
	key: OrgRole;
	label: string;
	detail: string;
}[] = [
	{
		key: "Owner",
		label: "Owner",
		detail:
			"Full access including billing, users, delegations, and account closure. At least one required.",
	},
	{
		key: "Admin",
		label: "Admin",
		detail:
			"Manage users, delegations, and account settings. Cannot close the account.",
	},
	{
		key: "Operations",
		label: "Operations",
		detail:
			"Access cargo, documents, and bookings. Cannot manage users or billing.",
	},
	{
		key: "Finance",
		label: "Finance",
		detail:
			"Access invoices, payments, statements, and disputes. Cannot manage users.",
	},
	{
		key: "Read-only",
		label: "Read-only",
		detail:
			"View everything in the account, but no actions. Useful for auditors or oversight.",
	},
];

export default function PortalUsersRoute() {
	const [users, setUsers] = useState<OrgUser[]>(initialUsers);
	const [query, setQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState<"all" | OrgRole>("all");
	const [isInviteOpen, setIsInviteOpen] = useState(false);
	const [removeTarget, setRemoveTarget] = useState<OrgUser | null>(null);

	const filtered = useMemo(() => {
		return users.filter((u) => {
			const matchQuery =
				u.name.toLowerCase().includes(query.toLowerCase()) ||
				u.email.toLowerCase().includes(query.toLowerCase()) ||
				u.role.toLowerCase().includes(query.toLowerCase());
			const matchRole = roleFilter === "all" || u.role === roleFilter;
			return matchQuery && matchRole;
		});
	}, [users, query, roleFilter]);

	const stats = useMemo(() => {
		const active = users.filter((u) => u.status === "Active").length;
		const invited = users.filter((u) => u.status === "Invited").length;
		const mfaEnabled = users.filter((u) => u.mfa && u.status === "Active").length;
		const owners = users.filter((u) => u.role === "Owner" && u.status === "Active").length;
		return { active, invited, mfaEnabled, owners };
	}, [users]);

	const mfaCoverage = stats.active > 0 ? Math.round((stats.mfaEnabled / stats.active) * 100) : 0;

	const handleInvite = (next: OrgUser) => {
		setUsers((prev) => [next, ...prev]);
		setIsInviteOpen(false);
		toast.success(`Invitation sent to ${next.email} (simulated).`);
	};

	const handleRemove = () => {
		if (!removeTarget) return;
		setUsers((prev) =>
			prev.map((u) => (u.id === removeTarget.id ? { ...u, status: "Removed" as UserStatus } : u))
		);
		toast.success(`${removeTarget.name} has been removed.`);
		setRemoveTarget(null);
	};

	const handleResend = (user: OrgUser) => {
		toast.success(`Invitation re-sent to ${user.email} (simulated).`);
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
						{(
							[
								{ key: "all", label: "All" },
								{ key: "Owner", label: "Owner" },
								{ key: "Admin", label: "Admin" },
								{ key: "Operations", label: "Operations" },
								{ key: "Finance", label: "Finance" },
								{ key: "Read-only", label: "Read-only" },
							] as const
						).map((r) => (
							<button
								key={r.key}
								type="button"
								onClick={() => setRoleFilter(r.key as typeof roleFilter)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									roleFilter === r.key
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{r.label}
							</button>
						))}
					</div>
				</div>

				{filtered.length === 0 ? (
					<div className="p-12 text-center">
						<Users className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">No users match your filters.</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different name, email, or role.
						</p>
					</div>
				) : (
					<ul className="divide-y divide-line">
						{filtered.map((u) => {
							const isRemoved = u.status === "Removed";
							const isOwner = u.role === "Owner";
							return (
								<li
									key={u.id}
									className={cn(
										"flex flex-wrap items-center gap-4 px-5 py-4",
										isRemoved && "opacity-60"
									)}
								>
									<div className="grid size-11 shrink-0 place-items-center rounded-full bg-ink font-display text-[13px] font-semibold text-sand">
										{u.name
											.split(" ")
											.map((p) => p[0] ?? "")
											.join("")
											.slice(0, 2)}
									</div>

									<div className="min-w-[220px] flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<p className="text-sm font-semibold text-ink">{u.name}</p>
											<StatusBadge label={u.status} tone={statusTone(u.status)} />
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
						<ul className="space-y-3 text-[12px] leading-5">
							{roleOptions.map((r) => (
								<li key={r.key}>
									<p className="font-semibold text-ink">{r.label}</p>
									<p className="mt-0.5 text-ink-soft">{r.detail}</p>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>

			{isInviteOpen && (
				<InviteUserModal
					onClose={() => setIsInviteOpen(false)}
					onSubmit={handleInvite}
					existingUsers={users}
				/>
			)}

			{removeTarget && (
				<RemoveUserDialog
					user={removeTarget}
					onClose={() => setRemoveTarget(null)}
					onConfirm={handleRemove}
				/>
			)}
		</AppShell>
	);
}

function InviteUserModal({
	onClose,
	onSubmit,
	existingUsers,
}: {
	onClose: () => void;
	onSubmit: (u: OrgUser) => void;
	existingUsers: OrgUser[];
}) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [role, setRole] = useState<OrgRole>("Operations");

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!name.trim() || !email.trim()) {
			toast.error("Name and email are required.");
			return;
		}
		if (existingUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
			toast.error("A user with that email already exists on this account.");
			return;
		}
		onSubmit({
			id: `u-${Date.now()}`,
			name,
			email,
			phone,
			role,
			status: "Invited",
			lastActive: "—",
			invitedAt: new Date().toLocaleDateString("en-GB", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			}),
			mfa: false,
		});
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
								They receive an email invitation. Access begins once they accept and set
								up two-factor authentication.
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
							label="Phone (optional)"
							placeholder="+234 ..."
							value={phone}
							onChange={setPhone}
						/>

						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Role
							</p>
							<div className="mt-3 grid gap-2">
								{roleOptions.map((r) => {
									const active = role === r.key;
									return (
										<button
											key={r.key}
											type="button"
											onClick={() => setRole(r.key)}
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
												<span className="text-sm font-semibold text-ink">{r.label}</span>
												<span className="mt-0.5 block text-[11px] leading-5 text-ink-soft">
													{r.detail}
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
										The user will be asked to set up two-factor authentication when they
										accept the invitation. This is required for all account users.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-between gap-3 border-t border-line p-5 sm:p-6">
						<Button type="button" variant="ghost" onClick={onClose} className="text-ink-soft">
							Cancel
						</Button>
						<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
							Send invitation <ArrowRight />
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
}: {
	user: OrgUser;
	onClose: () => void;
	onConfirm: () => void;
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
					<Button variant="outline" onClick={onClose} className="border-line bg-paper text-ink">
						Keep user
					</Button>
					<Button onClick={onConfirm} className="bg-coral text-white hover:bg-coral/90">
						Remove user
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