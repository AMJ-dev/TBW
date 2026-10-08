import { useEffect, useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Boxes,
	Building2,
	CalendarClock,
	CircleDollarSign,
	ClipboardCheck,
	FileCog,
	Flag,
	LockKeyhole,
	Megaphone,
	Network,
	Settings2,
	ShieldCheck,
	TimerReset,
	Trash2,
	Truck,
	Users,
	type LucideIcon,
} from "lucide-react";
import { AppShell, StatusBadge, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { http, type Resp } from "@/lib/httpClient";

type Tone = "info" | "success" | "warning" | "critical";
type GroupKey = "identity" | "commercial" | "platform" | "governance";

interface ApiSection {
	key: string;
	title: string;
	desc: string;
	href: string;
	icon: keyof typeof iconRegistry;
	group: GroupKey;
	state: string;
	stateTone: Tone;
	lastChanged: string;
	featured: boolean;
	enabled: boolean;
}

interface ApiGroup {
	key: GroupKey;
	label: string;
	hint: string;
}

interface ApiMetric {
	key: string;
	label: string;
	value: string;
	detail: string;
	tone: Tone;
	icon: keyof typeof iconRegistry;
}

interface ConfigHubPayload {
	sections: ApiSection[];
	groups: ApiGroup[];
	metrics: ApiMetric[];
	status: {
		environment: string;
		auditEnabled: boolean;
		mfaRequired: boolean;
	};
	conventions: {
		title: string;
		detail: string;
	}[];
}

const iconRegistry = {
	Boxes,
	Building2,
	CalendarClock,
	CircleDollarSign,
	ClipboardCheck,
	FileCog,
	Flag,
	LockKeyhole,
	Megaphone,
	Network,
	Settings2,
	ShieldCheck,
	TimerReset,
	Trash2,
	Truck,
	Users,
} as const;

const groupOrder: GroupKey[] = [
	"identity",
	"commercial",
	"platform",
	"governance",
];

const fallbackGroups: Record<GroupKey, ApiGroup> = {
	identity: {
		key: "identity",
		label: "Identity & Terminal",
		hint: "Who we are and what the facility handles",
	},
	commercial: {
		key: "commercial",
		label: "Commercial",
		hint: "Money, storage, and gate economics",
	},
	platform: {
		key: "platform",
		label: "Platform",
		hint: "Documents, messaging, integrations, and flags",
	},
	governance: {
		key: "governance",
		label: "Governance",
		hint: "Security, availability, and data lifecycle",
	},
};

export default function ConfigurationRoute() {
	const [data, setData] = useState<ConfigHubPayload | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const fetchConfig = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("admin/config/hub/");
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load configuration.");
				setData(null);
				return;
			}
			const payload = (resp.code ?? {}) as Partial<ConfigHubPayload>;
			setData({
				sections: payload.sections ?? [],
				groups: payload.groups ?? [],
				metrics: payload.metrics ?? [],
				status: payload.status ?? {
					environment: "Production",
					auditEnabled: true,
					mfaRequired: true,
				},
				conventions: payload.conventions ?? [],
			});
		} catch (err: any) {
			setError(
				err?.response?.data?.message || "Could not load configuration."
			);
			setData(null);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchConfig();
	}, []);

	const visibleSections = useMemo(() => {
		if (!data) return [];
		return data.sections.filter((s) => s.enabled);
	}, [data]);

	const featured = useMemo(
		() => visibleSections.filter((s) => s.featured),
		[visibleSections]
	);

	const grouped = useMemo(() => {
		const serverGroups =
			data?.groups && data.groups.length > 0
				? data.groups
				: groupOrder.map((g) => fallbackGroups[g]);
		return serverGroups
			.filter((g) => groupOrder.includes(g.key))
			.map((g) => ({
				...g,
				items: visibleSections.filter((s) => s.group === g.key),
			}))
			.filter((g) => g.items.length > 0);
	}, [data, visibleSections]);

	const status = data?.status;

	return (
		<AppShell title="Configuration" eyebrow="Administration & System Control">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div className="min-w-0">
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Administration · Business Rules · Platform Control
					</p>

					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						System Configuration
					</h2>

					<p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
						Manage designated business rules without hard-coding operational
						behaviour. Every change is audited. Scope changes follow the Change
						Control procedure.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{status && (
						<>
							<StatusBadge label={status.environment} tone="info" />
							<StatusBadge
								label={status.auditEnabled ? "Audit enabled" : "Audit OFF"}
								tone={status.auditEnabled ? "success" : "critical"}
							/>
							<StatusBadge
								label={status.mfaRequired ? "MFA required" : "MFA optional"}
								tone={status.mfaRequired ? "success" : "warning"}
							/>
						</>
					)}
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
								Could not load configuration
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">{error}</p>
						</div>
					</div>
					<div className="mt-5 flex flex-wrap gap-2">
						<Button
							onClick={() => void fetchConfig()}
							className="bg-orange text-white hover:bg-orange-deep"
						>
							Try again
						</Button>
					</div>
				</div>
			) : (
				<>
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						{(data?.metrics ?? []).map((m) => {
							const Icon = iconRegistry[m.icon] ?? Settings2;
							return (
								<Metric
									key={m.key}
									label={m.label}
									value={m.value}
									detail={m.detail}
									tone={m.tone}
									icon={Icon}
								/>
							);
						})}
					</div>

					{featured.length > 0 && (
						<section className="rounded-2xl bg-slate p-5 text-sand ring-1 ring-slate">
							<div className="flex flex-wrap items-center justify-between gap-4">
								<div className="flex min-w-0 items-start gap-3">
									<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/15 text-orange">
										<Settings2 className="size-5" />
									</div>
									<div className="min-w-0">
										<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
											Quick access
										</p>
										<p className="mt-1 font-display text-base font-bold text-sand">
											Most-visited configuration areas
										</p>
										<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
											Direct links for day-to-day operations.
										</p>
									</div>
								</div>
								<Link to="/admin/audit">
									<Button
										variant="outline"
										size="sm"
										className="border-sand/25 bg-transparent text-sand hover:bg-sand/10"
									>
										View audit log
										<ArrowRight className="ml-1 size-3.5" />
									</Button>
								</Link>
							</div>

							<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
								{featured.map((s) => {
									const Icon = iconRegistry[s.icon] ?? Settings2;
									return (
										<Link
											key={s.key}
											to={s.href}
											className="group flex items-center justify-between gap-3 rounded-xl bg-sand/5 px-4 py-3 ring-1 ring-sand/15 transition-colors hover:bg-sand/10"
										>
											<div className="flex min-w-0 items-center gap-3">
												<div className="grid size-8 shrink-0 place-items-center rounded-md bg-orange/15 text-orange">
													<Icon className="size-4" />
												</div>
												<div className="min-w-0">
													<p className="truncate text-[13px] font-semibold text-sand">
														{s.title}
													</p>
													<p className="truncate font-mono text-[10px] text-sand/70">
														{s.state}
													</p>
												</div>
											</div>
											<ArrowRight className="size-4 shrink-0 text-sand/50 transition-transform group-hover:translate-x-0.5 group-hover:text-orange" />
										</Link>
									);
								})}
							</div>
						</section>
					)}

					{grouped.map((g) => (
						<section key={g.key} className="space-y-3">
							<div className="flex flex-wrap items-end justify-between gap-2">
								<div>
									<h3 className="font-display text-sm font-bold text-ink">
										{g.label}
									</h3>
									<p className="text-[11px] text-ink-soft">{g.hint}</p>
								</div>
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									{g.items.length}{" "}
									{g.items.length === 1 ? "area" : "areas"}
								</span>
							</div>

							<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
								{g.items.map((s) => {
									const Icon = iconRegistry[s.icon] ?? Settings2;
									return (
										<Link
											key={s.key}
											to={s.href}
											className="group flex flex-col justify-between rounded-xl bg-paper p-5 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:ring-orange/40 hover:shadow-lg"
										>
											<div>
												<div className="flex items-start justify-between gap-3">
													<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
														<Icon className="size-5" />
													</div>
													<StatusBadge
														label={s.state}
														tone={s.stateTone}
													/>
												</div>

												<h4 className="mt-4 font-display text-base font-bold text-ink">
													{s.title}
												</h4>
												<p className="mt-1.5 text-[12px] leading-5 text-ink-soft">
													{s.desc}
												</p>
											</div>

											<div className="mt-5 flex items-center justify-between border-t border-line pt-3">
												<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
													Changed {s.lastChanged}
												</span>
												<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-deep">
													Configure
													<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
												</span>
											</div>
										</Link>
									);
								})}
							</div>
						</section>
					))}

					{data?.conventions && data.conventions.length > 0 && (
						<section className="rounded-2xl bg-paper p-5 ring-1 ring-line">
							<div className="flex flex-wrap items-start gap-3">
								<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
									<ShieldCheck className="size-5" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
										Conventions
									</p>
									<p className="mt-1 font-display text-base font-bold text-ink">
										How configuration changes behave
									</p>

									<ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
										{data.conventions.map((c) => (
											<li
												key={c.title}
												className="rounded-lg bg-sand p-3 ring-1 ring-line"
											>
												<p className="text-[12px] font-semibold text-ink">
													{c.title}
												</p>
												<p className="mt-1 text-[11px] leading-5 text-ink-soft">
													{c.detail}
												</p>
											</li>
										))}
									</ul>

									<div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
										<Link to="/admin/audit">
											<Button
												variant="outline"
												size="sm"
												className="border-line bg-paper text-ink hover:bg-sand"
											>
												<ClipboardCheck className="size-3.5" />
												View configuration history
											</Button>
										</Link>
										<Link to="/admin/users">
											<Button
												variant="outline"
												size="sm"
												className="border-line bg-paper text-ink hover:bg-sand"
											>
												<Users className="size-3.5" />
												Manage access
											</Button>
										</Link>
									</div>
								</div>
							</div>
						</section>
					)}
				</>
			)}
		</AppShell>
	);
}