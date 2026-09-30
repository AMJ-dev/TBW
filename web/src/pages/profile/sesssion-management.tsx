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
import { http, type Resp } from "@/lib/httpClient";

type DeviceKind = "laptop" | "phone" | "tablet" | "unknown";

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

interface ActivityRecord {
	id: string;
	event: string;
	detail: string;
	time: string;
	tone: "success" | "info" | "warning" | "critical";
}

interface SessionsResponse {
	sessions?: Array<Record<string, any>>;
	activity?: Array<Record<string, any>>;
}

const deviceIcon: Record<DeviceKind, typeof Laptop> = {
	laptop: Laptop,
	phone: Smartphone,
	tablet: Tablet,
	unknown: Laptop,
};

const kindFromString = (raw: string | null | undefined): DeviceKind => {
	const v = String(raw ?? "").toLowerCase();
	if (v.includes("phone") || v.includes("mobile") || v.includes("iphone") || v.includes("android"))
		return "phone";
	if (v.includes("tablet") || v.includes("ipad")) return "tablet";
	if (v.includes("laptop") || v.includes("desktop") || v.includes("macbook") || v.includes("pc"))
		return "laptop";
	return "unknown";
};

const formatRelative = (input: string | null | undefined): string => {
	if (!input) return "—";
	const date = new Date(input);
	if (Number.isNaN(date.getTime())) return String(input);
	const diff = Date.now() - date.getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "Active now";
	if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
	return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
};

const formatAbsolute = (input: string | null | undefined): string => {
	if (!input) return "—";
	const date = new Date(input);
	if (Number.isNaN(date.getTime())) return String(input);
	return date.toLocaleString("en-NG", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const normaliseSession = (raw: Record<string, any>): SessionRecord => {
	const deviceName =
		raw["device_name"] ??
		raw["device"] ??
		raw["user_agent"] ??
		raw["browser"] ??
		"Unknown device";
	const os = raw["os"] ?? raw["platform"] ?? "";
	const browser = raw["browser"] ?? "";
	const location =
		raw["location"] ??
		[raw["city"], raw["region"], raw["country"]].filter(Boolean).join(", ") ??
		"Unknown location";

	return {
		id: String(raw["id"] ?? raw["session_id"] ?? crypto.randomUUID()),
		kind: kindFromString(
			raw["device_kind"] ?? raw["kind"] ?? raw["device_name"] ?? raw["user_agent"]
		),
		deviceName: String(deviceName),
		os: String(os),
		browser: String(browser),
		location: String(location || "Unknown location"),
		ip: String(raw["ip"] ?? raw["ip_address"] ?? "—"),
		firstSeen: formatAbsolute(
			raw["created_at"] ?? raw["first_seen"] ?? raw["started_at"]
		),
		lastActive: formatRelative(
			raw["last_active_at"] ?? raw["last_seen"] ?? raw["updated_at"]
		),
		current: Boolean(raw["current"] ?? raw["is_current"]),
		trusted: Boolean(raw["trusted"] ?? raw["is_trusted"]),
	};
};

const toneFromEvent = (raw: string | null | undefined): ActivityRecord["tone"] => {
	const v = String(raw ?? "").toLowerCase();
	if (/fail|error|block|reject|critical/.test(v)) return "critical";
	if (/password|reset|warning|suspend/.test(v)) return "warning";
	if (/signin|login|verified|success|mfa/.test(v)) return "success";
	return "info";
};

const normaliseActivity = (raw: Record<string, any>): ActivityRecord => {
	const event = raw["event"] ?? raw["action"] ?? raw["title"] ?? "Account activity";
	const detail =
		raw["detail"] ??
		raw["description"] ??
		[raw["device_name"], raw["location"]].filter(Boolean).join(" · ");

	return {
		id: String(raw["id"] ?? crypto.randomUUID()),
		event: String(event),
		detail: String(detail ?? ""),
		time: formatRelative(raw["created_at"] ?? raw["timestamp"] ?? raw["time"]),
		tone: toneFromEvent(event),
	};
};
export default function SessionManagementPage() {
	const [sessions, setSessions] = useState<SessionRecord[]>([]);
	const [activity, setActivity] = useState<ActivityRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [revoking, setRevoking] = useState<string | null>(null);

	const fetchSessions = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("my-sessions/");
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load your sessions.");
				setSessions([]);
				setActivity([]);
				return;
			}
			const payload: SessionsResponse = resp.code ?? {};
			const sessionList = Array.isArray(payload.sessions)
				? payload.sessions.map(normaliseSession)
				: Array.isArray(resp.code)
				? (resp.code as Array<Record<string, any>>).map(normaliseSession)
				: [];
			const activityList = Array.isArray(payload.activity)
				? payload.activity.map(normaliseActivity)
				: [];
			setSessions(sessionList);
			setActivity(activityList);
		} catch (err: any) {
			setError(err?.response?.data?.message || "Could not load your sessions.");
			setSessions([]);
			setActivity([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchSessions();
	}, []);

	const stats = useMemo(() => {
		const current = sessions.find((s) => s.current);
		const trusted = sessions.filter((s) => s.trusted).length;
		const others = sessions.filter((s) => !s.current).length;
		return { current, trusted, others };
	}, [sessions]);

	const revokeSession = async (id: string) => {
		const target = sessions.find((s) => s.id === id);
		if (!target) return;

		setRevoking(id);
		try {
			const res = await http.post(`my-sessions/revoke/${id}/`);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not sign out that device.");
				return;
			}
			setSessions((prev) => prev.filter((s) => s.id !== id));
			toast.success(`Signed out ${target.deviceName}.`);
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Could not sign out that device.");
		} finally {
			setRevoking(null);
		}
	};

	const revokeAllOthers = async () => {
		setRevoking("all");
		try {
			const res = await http.post("my-sessions/revoke-others/");
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not sign out other devices.");
				return;
			}
			setSessions((prev) => prev.filter((s) => s.current));
			toast.success("Signed out all other devices.");
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Could not sign out other devices.");
		} finally {
			setRevoking(null);
		}
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
						disabled={loading || revoking !== null || stats.others === 0}
					>
						<LogOut className="size-4" />
						Sign out all other devices
					</Button>
				</div>
			</div>

			{loading ? (
				<div className="flex items-center justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
					<span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
				</div>
			) : error ? (
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load your sessions
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">{error}</p>
						</div>
					</div>
					<div className="mt-5 flex flex-wrap gap-2">
						<Button
							onClick={() => void fetchSessions()}
							className="bg-orange text-white hover:bg-orange-deep"
						>
							Try again
						</Button>
						<Link to="/my-profile">
							<Button
								variant="outline"
								className="border-line bg-paper text-ink hover:bg-sand"
							>
								Back to profile
							</Button>
						</Link>
					</div>
				</div>
			) : (
				<>
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
										Signed in devices can access your account until the session expires
										or is revoked.
									</p>
								</div>
							</div>
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
								{sessions.length} {sessions.length === 1 ? "session" : "sessions"}
							</span>
						</div>

						{sessions.length === 0 ? (
							<div className="p-6 text-center text-sm text-ink-soft">
								No active sessions found.
							</div>
						) : (
							<ul className="divide-y divide-line">
								{sessions.map((s) => {
									const Icon = deviceIcon[s.kind];
									return (
										<li key={s.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
											<div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange text-white">
												<Icon className="size-5" />
											</div>

											<div className="min-w-[200px] flex-1">
												<div className="flex flex-wrap items-center gap-2">
													<p className="text-sm font-semibold text-ink">
														{s.deviceName}
													</p>
													{s.current && (
														<StatusBadge label="This device" tone="success" />
													)}
													{s.trusted && !s.current && (
														<StatusBadge label="Trusted" tone="info" />
													)}
												</div>
												<p className="mt-0.5 font-mono text-[11px] text-ink-soft">
													{s.os}
													{s.os && s.browser ? " · " : ""}
													{s.browser}
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
						)}

						{sessions.length === 1 && (
							<div className="border-t border-line p-5">
								<div className="rounded-xl bg-orange/10 p-4 ring-1 ring-orange/25">
									<div className="flex items-start gap-3">
										<Check className="mt-0.5 size-4 shrink-0 text-orange" />
										<p className="text-[12px] leading-5 text-ink-soft">
											Only your current device is signed in. This is the recommended
											state for a secure account.
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

						{activity.length === 0 ? (
							<div className="p-6 text-center text-sm text-ink-soft">
								No recent activity to display.
							</div>
						) : (
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
											<p className="text-[13px] font-medium text-ink">
												{event.event}
											</p>
											<p className="mt-0.5 truncate font-mono text-[11px] text-ink-soft">
												{event.detail}
											</p>
										</div>
										<span className="font-mono text-[10px] text-ink-soft">
											{event.time}
										</span>
									</li>
								))}
							</ul>
						)}
					</section>
				</>
			)}

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
							<Link to="/change-password">
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