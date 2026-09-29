import { useEffect, useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Check,
	Laptop,
	Lock,
	LogOut,
	MapPin,
	ShieldCheck,
	Smartphone,
	Tablet,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";

type DeviceKind = "laptop" | "phone" | "tablet";

interface SessionRecord {
	id: string;
	kind: DeviceKind;
	deviceName: string;
	os: string;
	browser: string;
	location: string;
	ip: string;
	firstSeen: string;
	lastActive: string;
	current: boolean;
	trusted: boolean;
}

const initialSessions: SessionRecord[] = [
	{
		id: "ses-1",
		kind: "laptop",
		deviceName: "MacBook Pro",
		os: "macOS 15.1",
		browser: "Chrome 130",
		location: "Abuja, Nigeria",
		ip: "10.0.4.18",
		firstSeen: "12 Sep 2026 · 08:14",
		lastActive: "Active now",
		current: true,
		trusted: true,
	},
	{
		id: "ses-2",
		kind: "phone",
		deviceName: "iPhone 15",
		os: "iOS 18.1",
		browser: "Safari",
		location: "Abuja, Nigeria",
		ip: "102.89.44.71",
		firstSeen: "10 Sep 2026 · 19:02",
		lastActive: "2 hours ago",
		current: false,
		trusted: true,
	},
	{
		id: "ses-3",
		kind: "laptop",
		deviceName: "Windows Desktop",
		os: "Windows 11 Pro",
		browser: "Edge 130",
		location: "Lagos, Nigeria",
		ip: "105.112.8.14",
		firstSeen: "22 Sep 2026 · 14:45",
		lastActive: "Yesterday",
		current: false,
		trusted: false,
	},
	{
		id: "ses-4",
		kind: "tablet",
		deviceName: "iPad Air",
		os: "iPadOS 18",
		browser: "Safari",
		location: "Kano, Nigeria",
		ip: "197.210.72.99",
		firstSeen: "18 Sep 2026 · 09:21",
		lastActive: "3 days ago",
		current: false,
		trusted: false,
	},
];

const activity = [
	{
		id: "ev-1",
		event: "Signed in",
		detail: "Chrome 130 on macOS 15.1 · Abuja, Nigeria",
		time: "Active now",
		tone: "success" as const,
	},
	{
		id: "ev-2",
		event: "Two-factor code verified",
		detail: "Authenticator app · Abuja, Nigeria",
		time: "1 minute ago",
		tone: "success" as const,
	},
	{
		id: "ev-3",
		event: "New device signed in",
		detail: "iPhone 15 · Abuja, Nigeria",
		time: "2 hours ago",
		tone: "info" as const,
	},
	{
		id: "ev-4",
		event: "Failed sign-in attempt",
		detail: "Windows Desktop · Lagos, Nigeria · incorrect password",
		time: "Yesterday · 22:14",
		tone: "critical" as const,
	},
	{
		id: "ev-5",
		event: "Password changed",
		detail: "iPhone 15 · Abuja, Nigeria",
		time: "10 Sep 2026 · 19:05",
		tone: "warning" as const,
	},
];

const deviceIcon: Record<DeviceKind, typeof Laptop> = {
	laptop: Laptop,
	phone: Smartphone,
	tablet: Tablet,
};

export default function SessionManagementPage() {
	const [sessions, setSessions] = useState<SessionRecord[]>(initialSessions);
	const [revoking, setRevoking] = useState<string | null>(null);

	const stats = useMemo(() => {
		const current = sessions.find((s) => s.current);
		const trusted = sessions.filter((s) => s.trusted).length;
		const others = sessions.filter((s) => !s.current).length;
		return { current, trusted, others };
	}, [sessions]);

	const revokeSession = (id: string) => {
		const target = sessions.find((s) => s.id === id);
		if (!target) return;
		setRevoking(id);
		setTimeout(() => {
			setSessions((prev) => prev.filter((s) => s.id !== id));
			setRevoking(null);
			toast.success(`Signed out ${target.deviceName}.`);
		}, 500);
	};

	const revokeAllOthers = () => {
		setRevoking("all");
		setTimeout(() => {
			setSessions((prev) => prev.filter((s) => s.current));
			setRevoking(null);
			toast.success("Signed out all other devices.");
		}, 600);
	};

	return (
		<AppShell title="Account security" eyebrow="Session & device management">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-orange">
						Account & access · Active sessions
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Devices signed into your account
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Review every device with access to your account. If you see a device you don't
						recognise, sign it out and change your password immediately.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink hover:bg-sand"
						onClick={revokeAllOthers}
						disabled={revoking !== null || stats.others === 0}
					>
						<LogOut className="size-4" />
						Sign out all other devices
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Active sessions"
					value={String(sessions.length)}
					detail="Across all devices"
					tone="info"
					icon={ShieldCheck}
				/>
				<Metric
					label="Trusted devices"
					value={String(stats.trusted)}
					detail="Skip 2FA on future sign-ins"
					tone="success"
					icon={Check}
				/>
				<Metric
					label="Current device"
					value={stats.current?.deviceName ?? "—"}
					detail={stats.current?.location ?? "—"}
					tone="info"
					icon={Laptop}
				/>
				<Metric
					label="Other sessions"
					value={String(stats.others)}
					detail={stats.others > 0 ? "Review if unfamiliar" : "None"}
					tone={stats.others > 0 ? "warning" : "success"}
					icon={AlertTriangle}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="flex items-center gap-2">
						<Lock className="size-4 text-orange" />
						<div>
							<h3 className="font-display text-sm font-bold text-ink">
								Devices signed in
							</h3>
							<p className="text-[11px] text-ink-soft">
								Signed in devices can access your account until the session expires or is
								revoked.
							</p>
						</div>
					</div>
					<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
						{sessions.length} {sessions.length === 1 ? "session" : "sessions"}
					</span>
				</div>

				<ul className="divide-y divide-line">
					{sessions.map((s) => {
						const Icon = deviceIcon[s.kind];
						return (
							<li
								key={s.id}
								className="flex flex-wrap items-center gap-4 px-5 py-4"
							>
								<div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange text-white">
									<Icon className="size-5" />
								</div>

								<div className="min-w-[200px] flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="text-sm font-semibold text-ink">{s.deviceName}</p>
										{s.current && <StatusBadge label="This device" tone="success" />}
										{s.trusted && !s.current && (
											<StatusBadge label="Trusted" tone="info" />
										)}
									</div>
									<p className="mt-0.5 font-mono text-[11px] text-ink-soft">
										{s.os} · {s.browser}
									</p>
								</div>

								<div className="min-w-[180px]">
									<p className="flex items-center gap-1.5 text-[12px] text-ink">
										<MapPin className="size-3.5 text-ink-soft" />
										{s.location}
									</p>
									<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
										IP {s.ip}
									</p>
								</div>

								<div className="min-w-[160px]">
									<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										Last active
									</p>
									<p className="mt-0.5 text-[12px] text-ink">{s.lastActive}</p>
									<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
										First seen {s.firstSeen}
									</p>
								</div>

								<div className="ml-auto">
									{s.current ? (
										<Button
											variant="outline"
											size="sm"
											className="border-line bg-paper text-ink-soft"
											disabled
										>
											Current session
										</Button>
									) : (
										<Button
											variant="outline"
											size="sm"
											className="border-carmine/30 bg-paper text-carmine hover:bg-carmine/10 hover:text-carmine"
											onClick={() => revokeSession(s.id)}
											disabled={revoking === s.id || revoking === "all"}
										>
											<Trash2 className="size-3.5" />
											{revoking === s.id ? "Signing out…" : "Sign out"}
										</Button>
									)}
								</div>
							</li>
						);
					})}
				</ul>

				{sessions.length === 1 && (
					<div className="border-t border-line p-5">
						<div className="rounded-xl bg-orange/10 p-4 ring-1 ring-orange/25">
							<div className="flex items-start gap-3">
								<Check className="mt-0.5 size-4 shrink-0 text-orange" />
								<p className="text-[12px] leading-5 text-ink-soft">
									Only your current device is signed in. This is the recommended state
									for a secure account.
								</p>
							</div>
						</div>
					</div>
				)}
			</section>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div>
						<h3 className="font-display text-sm font-bold text-ink">
							Recent account activity
						</h3>
						<p className="text-[11px] text-ink-soft">
							Authentication and security events on your account.
						</p>
					</div>
					<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
						Last 7 days
					</span>
				</div>

				<ul className="divide-y divide-line">
					{activity.map((event) => (
						<li key={event.id} className="flex items-center gap-3 px-5 py-3.5">
							<span
								className={
									"size-1.5 shrink-0 rounded-full " +
									(event.tone === "critical"
										? "bg-carmine"
										: event.tone === "warning"
										? "bg-orange"
										: event.tone === "info"
										? "bg-slate"
										: "bg-orange")
								}
							/>
							<div className="min-w-0 flex-1">
								<p className="text-[13px] font-medium text-ink">{event.event}</p>
								<p className="mt-0.5 truncate font-mono text-[11px] text-ink-soft">
									{event.detail}
								</p>
							</div>
							<span className="font-mono text-[10px] text-ink-soft">{event.time}</span>
						</li>
					))}
				</ul>
			</section>

			<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
				<div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
					<div>
						<div className="flex items-center gap-2">
							<ShieldCheck className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								Account security
							</p>
						</div>
						<h3 className="mt-3 font-display text-xl font-bold text-ink">
							Lost a device? Don't wait.
						</h3>
						<p className="mt-2 max-w-xl text-[13px] leading-6 text-ink-soft">
							If you've lost a device or suspect unauthorised access, sign out the session
							immediately and change your password. For additional recovery, contact
							your TRINŪ administrator.
						</p>
						<div className="mt-5 flex flex-wrap gap-2">
							<Link to="/reset-password">
								<Button className="bg-orange text-white hover:bg-orange-deep">
									Change password <ArrowRight />
								</Button>
							</Link>
							<Link to="/mfa/setup">
								<Button
									variant="outline"
									className="border-line bg-paper text-ink hover:bg-sand"
								>
									Manage two-factor
								</Button>
							</Link>
						</div>
					</div>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
							Session policy
						</p>
						<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Idle sessions expire automatically
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Trusted devices skip 2FA for 30 days
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Staff accounts additionally require MFA
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								All sign-in and revocation events are logged
							</li>
						</ul>
					</div>
				</div>
			</section>
		</AppShell>
	);
}