import { Link } from "@/components/router-link";
import {
	Activity,
	ArrowRight,
	Building2,
	FileCheck2,
	KeyRound,
	Lock,
	Server,
	Settings,
	Shield,
	ShieldCheck,
	UserCheck,
	Users,
} from "lucide-react";
import { AppShell, StatusBadge, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";

const adminModules = [
	{
		title: "User Management",
		desc: "Manage operator accounts, licensed agents, and access policies.",
		href: "/admin/users",
		icon: Users,
		stat: "84 active users",
		badge: "Identity",
	},
	{
		title: "Roles & Permissions",
		desc: "Configure role-based access control and operational permission boundaries.",
		href: "/admin/roles",
		icon: Shield,
		stat: "5 configured roles",
		badge: "Access",
	},
	{
		title: "Partner Organizations",
		desc: "Registry of approved shipping lines, licensed customs brokers, and haulage fleets.",
		href: "/admin/organizations",
		icon: Building2,
		stat: "12 corporate partners",
		badge: "Registry",
	},
	{
		title: "System Configuration",
		desc: "Set storage grace periods, weighbridge tolerances, and integration endpoints.",
		href: "/admin/configuration",
		icon: Settings,
		stat: "28 active parameters",
		badge: "Engine",
	},
	{
		title: "Security & Audit Trail",
		desc: "Searchable audit log of cargo movements, coordination events, and approvals.",
		href: "/admin/audit",
		icon: Activity,
		stat: "14.2k events",
		badge: "Audit",
	},
];

export default function AdminRoute() {
	return (
		<AppShell title="Administration" eyebrow="System Governance & Security">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Administration · Access & configuration
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Governance, security & access management
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Control organizational access, system operating parameters, user accounts, and
						audit records.
					</p>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total User Accounts"
					value="84"
					detail="Across 12 organizations"
					tone="info"
					icon={UserCheck}
				/>
				<Metric
					label="Access Model"
					value="Least privilege"
					detail="Per module and action"
					tone="success"
					icon={ShieldCheck}
				/>
				<Metric
					label="Active Sessions"
					value="23"
					detail="Tracked and logged"
					tone="success"
					icon={KeyRound}
				/>
				<Metric
					label="Audit Logging"
					value="Enabled"
					detail="Searchable by actor and event"
					tone="info"
					icon={Server}
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{adminModules.map((m) => {
					const Icon = m.icon;
					return (
						<div
							key={m.title}
							className="flex flex-col justify-between rounded-xl bg-paper p-6 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:shadow-lg"
						>
							<div>
								<div className="flex items-center justify-between">
									<div className="grid size-10 place-items-center rounded-lg bg-orange/10 text-orange-deep">
										<Icon className="size-5" />
									</div>
									<StatusBadge label={m.badge} tone="info" />
								</div>
								<h3 className="mt-4 font-display text-lg font-bold text-ink">{m.title}</h3>
								<p className="mt-2 text-xs leading-5 text-ink-soft">{m.desc}</p>
							</div>

							<div className="mt-6 flex items-center justify-between border-t border-line pt-4">
								<span className="font-mono text-xs text-ink-soft">{m.stat}</span>
								<Link to={m.href}>
									<Button
										size="sm"
										className="bg-orange text-white hover:bg-orange-deep"
									>
										Open <ArrowRight className="ml-1 size-3.5" />
									</Button>
								</Link>
							</div>
						</div>
					);
				})}
			</div>
		</AppShell>
	);
}