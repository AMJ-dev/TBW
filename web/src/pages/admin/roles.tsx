import { useState } from "react";
import { toast } from "sonner";
import {
	Check,
	Download,
	KeyRound,
	Lock,
	Plus,
	Shield,
	ShieldAlert,
	ShieldCheck,
	UserCheck,
	X,
} from "lucide-react";
import { AppShell, StatusBadge, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RoleRecord {
	id: string;
	name: string;
	category: "Terminal Staff" | "Regulator Access" | "Customer / Agent";
	assignedUsers: number;
	permissionsCount: number;
	description: string;
	modules: string[];
}

const initialRoles: RoleRecord[] = [
	{
		id: "rol-1",
		name: "Terminal Operations Manager",
		category: "Terminal Staff",
		assignedUsers: 4,
		permissionsCount: 42,
		description:
			"Oversees yard stacking, gate admittance, receiving exceptions, and equipment dispatch.",
		modules: ["Receiving", "Yard", "Warehouse", "Gate", "Examination", "Exceptions"],
	},
	{
		id: "rol-2",
		name: "Regulator Read-Only Access",
		category: "Regulator Access",
		assignedUsers: 8,
		permissionsCount: 6,
		description:
			"Time-boxed read-only access for authorised regulators and auditors. No decision-making authority within the platform.",
		modules: ["Coordination Record", "Movement Register", "Overstay Register"],
	},
	{
		id: "rol-3",
		name: "Finance & Billing Controller",
		category: "Terminal Staff",
		assignedUsers: 5,
		permissionsCount: 26,
		description:
			"Issues pro-forma invoices, records bank payments, maintains tariffs, and clears payment holds.",
		modules: ["Invoices", "Payments", "Tariff Matrix", "Refunds", "Reconciliation"],
	},
	{
		id: "rol-4",
		name: "Licensed Clearing Agent",
		category: "Customer / Agent",
		assignedUsers: 34,
		permissionsCount: 12,
		description:
			"Consignee representative with delegated rights for document upload, bookings, and delivery orders.",
		modules: ["Document Upload", "Truck Appointments", "Status Tracking", "Payment Portal"],
	},
	{
		id: "rol-5",
		name: "Gate Marshal / Security",
		category: "Terminal Staff",
		assignedUsers: 14,
		permissionsCount: 9,
		description:
			"Inbound and outbound lane verification, plate scanning, weighbridge checks, and barrier operation.",
		modules: ["Gate Lanes", "Pass Verification", "Weighbridges", "Truck Inspection"],
	},
];

export default function AdminRolesRoute() {
	const [rolesList, setRolesList] = useState<RoleRecord[]>(initialRoles);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [selectedRole, setSelectedRole] = useState<RoleRecord | null>(null);

	const [roleName, setRoleName] = useState("");
	const [roleCategory, setRoleCategory] = useState<RoleRecord["category"]>("Terminal Staff");
	const [roleDesc, setRoleDesc] = useState("");

	const handleCreateRole = (e: React.FormEvent) => {
		e.preventDefault();
		if (!roleName) return;

		const newRole: RoleRecord = {
			id: `rol-${rolesList.length + 1}`,
			name: roleName,
			category: roleCategory,
			assignedUsers: 0,
			permissionsCount: 6,
			description: roleDesc || "Custom defined terminal access profile.",
			modules: ["Read-only access", "Audit trail"],
		};

		setRolesList([...rolesList, newRole]);
		setIsCreateModalOpen(false);
		setRoleName("");
		setRoleDesc("");
		toast.success(`Role profile "${roleName}" created locally.`);
	};

	return (
		<AppShell title="Roles & Permissions" eyebrow="Administration · Access Control">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Role-based access · Permission boundaries
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Roles & permission boundaries
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Define system roles, operational authorization boundaries, and time-boxed
						regulator access.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Access policy matrix exported locally.")}
					>
						<Download className="size-4" /> Export Matrix
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsCreateModalOpen(true)}
					>
						<Plus className="size-4" /> Create Role
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Configured Roles"
					value={String(rolesList.length)}
					detail="Across 3 tiers"
					tone="success"
					icon={Shield}
				/>
				<Metric
					label="Assigned Users"
					value="65"
					detail="Staff & external agents"
					tone="info"
					icon={UserCheck}
				/>
				<Metric
					label="Regulator Access"
					value="Time-boxed"
					detail="Read-only, revocable"
					tone="warning"
					icon={ShieldAlert}
				/>
				<Metric
					label="Least Privilege"
					value="Applied"
					detail="Per module and action"
					tone="success"
					icon={Lock}
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{rolesList.map((role) => (
					<div
						key={role.id}
						className="flex flex-col justify-between rounded-xl bg-paper p-5 ring-1 ring-line transition-shadow hover:shadow-md"
					>
						<div>
							<div className="flex items-start justify-between gap-2">
								<span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-soft">
									{role.category}
								</span>
								<StatusBadge label={`${role.assignedUsers} users`} tone="info" />
							</div>
							<h3 className="mt-2 font-display text-lg font-bold text-ink">{role.name}</h3>
							<p className="mt-2 text-xs leading-5 text-ink-soft">{role.description}</p>
						</div>

						<div className="mt-6 border-t border-line pt-4">
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Authorized modules ({role.modules.length})
							</p>
							<div className="mt-2 flex flex-wrap gap-1.5">
								{role.modules.map((mod) => (
									<span
										key={mod}
										className="inline-flex items-center gap-1 rounded bg-sand px-2 py-0.5 font-mono text-[10px] text-ink"
									>
										<Check className="size-3 text-orange" /> {mod}
									</span>
								))}
							</div>

							<div className="mt-5 flex items-center justify-between">
								<span className="font-mono text-xs text-ink-soft">
									{role.permissionsCount} permissions
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setSelectedRole(role)}
									className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
								>
									Edit Permissions
								</Button>
							</div>
						</div>
					</div>
				))}
			</div>

			{isCreateModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setIsCreateModalOpen(false)}
				>
					<div className="w-full max-w-lg rounded-xl bg-paper p-6 shadow-2xl ring-1 ring-line">
						<div className="flex items-center justify-between border-b border-line pb-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
									Access management
								</p>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									Create System Role
								</h3>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)}>
								<X />
							</Button>
						</div>

						<form onSubmit={handleCreateRole} className="mt-5 space-y-4">
							<div>
								<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Role Title
								</label>
								<Input
									required
									placeholder="e.g. Weighbridge Controller"
									value={roleName}
									onChange={(e) => setRoleName(e.target.value)}
									className="mt-1.5 border-line bg-sand text-ink"
								/>
							</div>

							<div>
								<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Category
								</label>
								<select
									value={roleCategory}
									onChange={(e) => setRoleCategory(e.target.value as RoleRecord["category"])}
									className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none"
								>
									<option>Terminal Staff</option>
									<option>Regulator Access</option>
									<option>Customer / Agent</option>
								</select>
							</div>

							<div>
								<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Operational scope & description
								</label>
								<textarea
									rows={3}
									placeholder="Detail the operational authority assigned to this role..."
									value={roleDesc}
									onChange={(e) => setRoleDesc(e.target.value)}
									className="mt-1.5 w-full rounded-md border border-line bg-sand p-3 text-xs text-ink outline-none"
								/>
							</div>

							<div className="flex justify-end gap-2 border-t border-line pt-4">
								<Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
									Save Role
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}

			{selectedRole && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setSelectedRole(null)}
				>
					<div className="w-full max-w-md rounded-xl bg-paper p-6 shadow-2xl ring-1 ring-line">
						<div className="flex items-center justify-between border-b border-line pb-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
									Role configuration
								</p>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									{selectedRole.name}
								</h3>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setSelectedRole(null)}>
								<X />
							</Button>
						</div>

						<div className="mt-4 space-y-3">
							<p className="text-xs text-ink-soft">{selectedRole.description}</p>
							<div className="rounded-lg bg-sand p-3 text-xs ring-1 ring-line">
								<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
									Assigned capabilities
								</p>
								<ul className="mt-2 space-y-1.5 font-medium text-ink">
									{selectedRole.modules.map((m) => (
										<li key={m} className="flex items-center gap-2">
											<ShieldCheck className="size-3.5 text-orange" /> {m} (Read & write)
										</li>
									))}
								</ul>
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-2">
							<Button variant="outline" onClick={() => setSelectedRole(null)}>
								Close
							</Button>
							<Button
								className="bg-orange text-white hover:bg-orange-deep"
								onClick={() => {
									toast.success("Role permissions updated locally.");
									setSelectedRole(null);
								}}
							>
								Save Changes
							</Button>
						</div>
					</div>
				</div>
			)}
		</AppShell>
	);
}