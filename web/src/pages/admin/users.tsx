import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
	AlertTriangle,
	Download,
	Filter,
	KeyRound,
	Plus,
	Search,
	ShieldCheck,
	UserCheck,
	UserPlus,
	Users,
	X,
} from "lucide-react";
import { Link } from "@/components/router-link";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";

interface UserRecord {
	id: string;
	name: string;
	email: string;
	role: string;
	organization: string;
	status: string;
	lastLogin: string;
	twoFactor: boolean;
}

interface ApiUser {
	id: string;
	full_name?: string;
	name?: string;
	email: string;
	role?: string | { name?: string };
	role_in_org?: string;
	organization?: string | { name?: string };
	org_name?: string;
	account_status?: string;
	status?: string;
	last_login_at?: string | null;
	mfa_enabled?: boolean;
	two_factor_enabled?: boolean;
	email_verified_at?: string | null;
}

interface UsersMetrics {
	total: number;
	active: number;
	pending: number;
	two_factor_pct: number | null;
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

const formatLastLogin = (input?: string | null) => {
	if (!input) return "Never";
	const date = new Date(input);
	if (Number.isNaN(date.getTime())) return "—";
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMin = Math.floor(diffMs / 60000);
	if (diffMin < 1) return "Just now";
	if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
	const diffHr = Math.floor(diffMin / 60);
	if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
	const diffDay = Math.floor(diffHr / 24);
	if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
	return date.toLocaleDateString("en-NG", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
};

const extractUser = (raw: ApiUser): UserRecord => {
	const name =
		raw.full_name?.trim() ||
		raw.name?.trim() ||
		raw.email.split("@")[0] ||
		"Unknown user";

	const role =
		typeof raw.role === "string"
			? raw.role
			: raw.role?.name?.trim() ||
			  raw.role_in_org?.trim() ||
			  "—";

	const organization =
		typeof raw.organization === "string"
			? raw.organization
			: raw.organization?.name?.trim() ||
			  raw.org_name?.trim() ||
			  "—";

	const status = (raw.account_status ?? raw.status ?? "pending").toString();
	const twoFactor = Boolean(raw.mfa_enabled ?? raw.two_factor_enabled ?? false);

	return {
		id: raw.id,
		name,
		email: raw.email,
		role,
		organization,
		status,
		lastLogin: formatLastLogin(raw.last_login_at ?? null),
		twoFactor,
	};
};

export default function AdminUsersRoute() {
	const [users, setUsers] = useState<UserRecord[]>([]);
	const [metrics, setMetrics] = useState<UsersMetrics | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [searchQuery, setSearchQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState("ALL");
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);

	const [newName, setNewName] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [newRole, setNewRole] = useState("Consignee Agent");
	const [newOrg, setNewOrg] = useState("");

	const fetchUsers = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("admin/users/");
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load users.");
				setUsers([]);
				setMetrics(null);
				return;
			}

			const payload: any = resp.code ?? {};
			const list: ApiUser[] = Array.isArray(payload)
				? payload
				: Array.isArray(payload.results)
				? payload.results
				: Array.isArray(payload.users)
				? payload.users
				: [];

			const normalized = list.map(extractUser);
			setUsers(normalized);

			const computedMetrics: UsersMetrics =
				payload.metrics ?? {
					total: normalized.length,
					active: normalized.filter((u) => u.status === "active").length,
					pending: normalized.filter((u) => u.status === "pending").length,
					two_factor_pct:
						normalized.length === 0
							? null
							: Math.round(
									(normalized.filter((u) => u.twoFactor).length /
										normalized.length) *
										100
							  ),
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

	useEffect(() => {
		void fetchUsers();
	}, []);

	const filteredUsers = useMemo(() => {
		return users.filter((u) => {
			const q = searchQuery.trim().toLowerCase();
			const matchQuery =
				!q ||
				u.name.toLowerCase().includes(q) ||
				u.email.toLowerCase().includes(q) ||
				u.organization.toLowerCase().includes(q) ||
				u.role.toLowerCase().includes(q);

			const matchRole =
				roleFilter === "ALL"
					? true
					: u.role.toLowerCase().includes(roleFilter.toLowerCase());

			return matchQuery && matchRole;
		});
	}, [users, searchQuery, roleFilter]);

	const handleAddUser = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!newName || !newEmail || !newOrg) {
			toast.error("Please fill in all required fields.");
			return;
		}

		const newUser: UserRecord = {
			id: `usr-${users.length + 1}`,
			name: newName,
			email: newEmail,
			role: newRole,
			organization: newOrg,
			status: "pending",
			lastLogin: "Never",
			twoFactor: false,
		};

		setUsers([newUser, ...users]);
		setIsAddModalOpen(false);
		setNewName("");
		setNewEmail("");
		setNewOrg("");
		toast.success(`User ${newName} added to the directory.`);
	};

	const handleExportUsers = () => {
		const csv = [
			["Name", "Email", "Role", "Organization", "Status", "Last Login", "2FA"].join(","),
			...users.map((u) =>
				[
					`"${u.name}"`,
					u.email,
					`"${u.role}"`,
					`"${u.organization}"`,
					statusLabel[u.status] ?? u.status,
					`"${u.lastLogin}"`,
					u.twoFactor ? "Yes" : "No",
				].join(",")
			),
		].join("\n");

		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `TRINU-Users-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("User directory exported locally.");
	};

	const activeCount =
		metrics?.active ??
		users.filter((u) => u.status === "active").length;
	const pendingCount =
		metrics?.pending ??
		users.filter((u) => u.status === "pending").length;
	const twoFactorPct =
		metrics?.two_factor_pct === null || metrics?.two_factor_pct === undefined
			? "—"
			: `${metrics.two_factor_pct}%`;

	return (
		<AppShell title="Users & Access" eyebrow="Administration · Identity Management">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Security & Governance · Identity Provider
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						User Accounts & Delegated Access
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Manage terminal staff, licensed agents, consignees, and third-party
						transporters working from the same operating record.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={handleExportUsers}
						disabled={users.length === 0}
					>
						<Download className="size-4" /> Export CSV
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsAddModalOpen(true)}
					>
						<UserPlus className="size-4" /> Add User
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Active Users"
					value={String(activeCount)}
					detail="Across registered organizations"
					tone="success"
					icon={Users}
				/>
				<Metric
					label="Pending Invites"
					value={String(pendingCount)}
					detail="Awaiting onboarding"
					tone="warning"
					icon={UserCheck}
				/>
				<Metric
					label="2FA Enrollment"
					value={twoFactorPct}
					detail="Strongly encouraged for trade users"
					tone="info"
					icon={KeyRound}
				/>
				<Metric
					label="Audit Trail"
					value="Logging"
					detail="Authentication events recorded"
					tone="info"
					icon={ShieldCheck}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by name, email, organization, or role..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" /> Filter:
						</span>
						{["ALL", "Terminal", "Agent", "Consignee", "Finance"].map((cat) => (
							<button
								key={cat}
								onClick={() => setRoleFilter(cat)}
								className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
									roleFilter === cat
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								}`}
							>
								{cat}
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
				) : filteredUsers.length === 0 ? (
					<div className="p-8 text-center text-sm text-ink-soft">
						{users.length === 0
							? "No user accounts registered yet."
							: "No users match your filters."}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[850px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">User / Email</th>
									<th className="px-4 py-3 font-medium">Role</th>
									<th className="px-4 py-3 font-medium">Organization</th>
									<th className="px-4 py-3 font-medium">2FA</th>
									<th className="px-4 py-3 font-medium">Last Login</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 font-medium text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{filteredUsers.map((u) => (
									<tr key={u.id} className="transition-colors hover:bg-sand/60">
										<td className="px-4 py-3.5">
											<p className="font-semibold text-ink">{u.name}</p>
											<p className="font-mono text-xs text-ink-soft">{u.email}</p>
										</td>
										<td className="px-4 py-3.5 text-xs text-ink">{u.role}</td>
										<td className="px-4 py-3.5 text-xs text-ink-soft">
											{u.organization}
										</td>
										<td className="px-4 py-3.5">
											{u.twoFactor ? (
												<span className="inline-flex items-center gap-1 font-mono text-[10px] text-teal-deep">
													<KeyRound className="size-3" /> Enabled
												</span>
											) : (
												<span className="font-mono text-[10px] text-orange-deep">
													Not enrolled
												</span>
											)}
										</td>
										<td className="px-4 py-3.5 text-xs text-ink-soft">
											{u.lastLogin}
										</td>
										<td className="px-4 py-3.5">
											<StatusBadge
												label={statusLabel[u.status] ?? u.status}
												tone={statusTone(u.status)}
											/>
										</td>
										<td className="px-4 py-3.5 text-right">
											<Link to={`/admin/users/${u.id}`}>
												<Button
													variant="ghost"
													size="sm"
													className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
												>
													Manage
												</Button>
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredUsers.length} of {users.length} registered accounts
					</span>
					<span>Role-based access control</span>
				</div>
			</section>

			{isAddModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setIsAddModalOpen(false)}
				>
					<div className="w-full max-w-lg rounded-xl bg-paper p-6 shadow-2xl ring-1 ring-line">
						<div className="flex items-center justify-between border-b border-line pb-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
									Identity Provisioning
								</p>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									Create User Account
								</h3>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsAddModalOpen(false)}
							>
								<X />
							</Button>
						</div>

						<form onSubmit={handleAddUser} className="mt-5 space-y-4">
							<div>
								<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Full Name
								</label>
								<Input
									required
									placeholder="e.g. Tunde Lawal"
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									className="mt-1.5 border-line bg-sand text-ink"
								/>
							</div>

							<div>
								<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Work Email Address
								</label>
								<Input
									required
									type="email"
									placeholder="e.g. tunde@atlantictrade.com"
									value={newEmail}
									onChange={(e) => setNewEmail(e.target.value)}
									className="mt-1.5 border-line bg-sand text-ink"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Assigned Role
									</label>
									<select
										value={newRole}
										onChange={(e) => setNewRole(e.target.value)}
										className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none"
									>
										<option>Consignee Agent</option>
										<option>Licensed Customs Broker</option>
										<option>Terminal Operations Staff</option>
										<option>Finance Officer</option>
										<option>Transporter Dispatcher</option>
									</select>
								</div>

								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Organization
									</label>
									<Input
										required
										placeholder="e.g. Atlantic Trade Ltd"
										value={newOrg}
										onChange={(e) => setNewOrg(e.target.value)}
										className="mt-1.5 border-line bg-sand text-ink"
									/>
								</div>
							</div>

							<div className="flex justify-end gap-2 border-t border-line pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsAddModalOpen(false)}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									className="bg-orange text-white hover:bg-orange-deep"
								>
									Add User
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</AppShell>
	);
}