import { Link } from "@/components/router-link";
import {
	ArrowRight,
	CalendarCheck,
	CheckCircle2,
	Clock,
	QrCode,
	ScanLine,
	ShieldCheck,
	Truck,
} from "lucide-react";
import { AppShell, StatusBadge, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";

const gateModules = [
	{
		title: "Ground Map & Control Tower",
		desc: "Interactive overview of yard zones, container bays, active gate lanes, and slots.",
		href: "/gate/dashboard",
		icon: ScanLine,
		stat: "1,284 cargo in terminal",
		badge: "Overview",
	},
	{
		title: "Truck Appointments",
		desc: "Pre-arrival slot reservations coordinated around cargo readiness.",
		href: "/gate/appointments",
		icon: CalendarCheck,
		stat: "48 slots today",
		badge: "Scheduling",
	},
	{
		title: "Gate Passes & QR Clearances",
		desc: "Digital entry and exit passes linked to truck plates and driver details.",
		href: "/gate/passes",
		icon: QrCode,
		stat: "Check-in at gate",
		badge: "Access",
	},
];

export default function GateRoute() {
	return (
		<AppShell title="Gate Operations" eyebrow="Access & Terminal Movement Control">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Gate control · Access coordination
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Gate coordination & access control
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Coordinate truck appointments, gate check-ins, weighbridge records, and gate pass
						documentation.
					</p>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Gate Status"
					value="Lane 1 & 2 Open"
					detail="Current queue: zero"
					tone="success"
					icon={Truck}
				/>
				<Metric
					label="Today's Bookings"
					value="24 Confirmed"
					detail="12 slots available"
					tone="info"
					icon={CalendarCheck}
				/>
				<Metric
					label="Average Dwell"
					value="42 Minutes"
					detail="From entry to gate-out"
					tone="success"
					icon={Clock}
				/>
				<Metric
					label="Gate Records"
					value="Logged"
					detail="Every entry and exit timestamped"
					tone="info"
					icon={ShieldCheck}
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				{gateModules.map((m) => {
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