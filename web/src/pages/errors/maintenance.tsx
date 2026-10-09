import { useEffect, useState } from "react";
import {
	AlertTriangle,
	CalendarClock,
	Clock,
	RefreshCw,
	ShieldCheck,
	Wrench,
} from "lucide-react";
import { http, type Resp } from "@/lib/httpClient";

type NoticeSeverity = "info" | "warning" | "critical";

interface ScheduledMaintenance {
	message: string;
	severity: NoticeSeverity;
	scheduledStart: string | null;
	durationMinutes: number;
}

const defaultNotice: ScheduledMaintenance = {
	message:
		"We have scheduled a short period of maintenance to improve platform performance, reliability, and security. Please plan your activities accordingly.",
	severity: "info",
	scheduledStart: null,
	durationMinutes: 60,
};

const normaliseSeverity = (raw: any): NoticeSeverity => {
	const value = String(raw ?? "info").toLowerCase();
	if (value === "warning" || value === "critical") return value;
	return "info";
};

export default function ScheduledMaintenancePage() {
	const [notice, setNotice] = useState<ScheduledMaintenance>(defaultNotice);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [currentTime, setCurrentTime] = useState(new Date());

	const fetchSchedule = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("/public/maintenance/schedule/");
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load the maintenance schedule.");
				return;
			}
			const payload: any = resp.code ?? {};

			const scheduledStart =
				payload.scheduled_start ??
				payload.scheduledStart ??
				null;

			setNotice({
				message: payload.message ?? defaultNotice.message,
				severity: normaliseSeverity(payload.severity),
				scheduledStart:
					typeof scheduledStart === "string" && scheduledStart.length > 0
						? scheduledStart
						: null,
				durationMinutes: Number(
					payload.duration_minutes ??
						payload.durationMinutes ??
						defaultNotice.durationMinutes
				),
			});
		} catch (err: any) {
			setError(
				err?.response?.data?.message ||
					"Could not load the maintenance schedule."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchSchedule();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const interval = window.setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);
		return () => window.clearInterval(interval);
	}, []);

	const severityStyles = {
		info: {
			badge: "border-sky/20 bg-sky/10 text-sky-deep",
			icon: "text-sky-deep",
			glow: "bg-sky/15",
			Icon: ShieldCheck,
		},
		warning: {
			badge: "border-orange/25 bg-orange/10 text-orange-deep",
			icon: "text-orange-deep",
			glow: "bg-orange/15",
			Icon: AlertTriangle,
		},
		critical: {
			badge: "border-carmine/25 bg-carmine/10 text-carmine",
			icon: "text-carmine",
			glow: "bg-carmine/15",
			Icon: AlertTriangle,
		},
	};

	const style = severityStyles[notice.severity];
	const NoticeIcon = style.Icon;

	const startDate = notice.scheduledStart
		? new Date(notice.scheduledStart)
		: null;
	const endDate = startDate
		? new Date(startDate.getTime() + notice.durationMinutes * 60 * 1000)
		: null;

	const isUpcoming = startDate ? currentTime < startDate : false;
	const isWithinWindow =
		startDate && endDate
			? currentTime >= startDate && currentTime < endDate
			: false;

	const formatDate = (date: Date) =>
		date.toLocaleDateString([], {
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
		});

	const formatTime = (date: Date) =>
		date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});

	if (loading) {
		return (
			<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-5 py-10 text-ink">
				<div className="flex items-center gap-3 rounded-xl bg-paper px-4 py-3 ring-1 ring-line">
					<span className="size-4 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
					<span className="text-sm text-ink-soft">
						Loading maintenance schedule…
					</span>
				</div>
			</main>
		);
	}

	if (error) {
		return (
			<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-5 py-10 text-ink">
				<div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-carmine/15 blur-3xl" />

				<div className="relative z-10 mx-auto w-full max-w-lg">
					<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
						<div className="flex items-start gap-3">
							<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
								<AlertTriangle className="size-5" />
							</div>
							<div>
								<p className="font-display text-base font-bold text-ink">
									Could not load the maintenance schedule
								</p>
								<p className="mt-1 text-sm leading-6 text-ink-soft">
									{error}
								</p>
							</div>
						</div>
						<div className="mt-5">
							<button
								type="button"
								onClick={() => void fetchSchedule()}
								className="inline-flex items-center gap-2 rounded-md bg-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-deep"
							>
								<RefreshCw className="size-4" />
								Try again
							</button>
						</div>
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-5 py-10 text-ink">
			<div
				className={`pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full blur-3xl ${style.glow}`}
			/>
			<div className="pointer-events-none absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-orange/10 blur-3xl" />

			<div className="relative z-10 mx-auto w-full max-w-5xl">
				<header className="mb-14 flex items-center justify-between gap-4">
					<a href="/" className="flex items-center gap-3">
						<img
							src="/logo.png"
							alt="TRÏNŪ"
							className="h-11 w-auto object-contain"
						/>
					</a>

					<span className="inline-flex items-center gap-2 rounded-full border border-sky/20 bg-sky/10 px-3.5 py-2 text-xs font-semibold text-sky-deep sm:text-sm">
						<CalendarClock size={15} />
						Planned downtime
					</span>
				</header>

				<div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
					<section>
						<div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-paper text-orange-deep shadow-sm">
							<CalendarClock size={30} strokeWidth={1.7} />
						</div>

						<p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
							A heads-up from our team
						</p>

						<h1 className="max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
							Scheduled downtime.
							<span className="mt-2 block text-orange">
								Better service ahead.
							</span>
						</h1>

						<p className="mt-6 max-w-xl text-base leading-8 text-ink-soft sm:text-lg">
							We have planned a maintenance window to improve your
							experience. Some services may be temporarily unavailable
							during this period.
						</p>

						<div className="mt-8 rounded-2xl border border-line bg-paper p-5 shadow-sm sm:p-6">
							<div className="mb-3 flex items-center gap-2">
								<NoticeIcon size={18} className={style.icon} />
								<h2 className="text-sm font-semibold">
									Maintenance notice
								</h2>
								<span
									className={`ml-auto rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] capitalize ${style.badge}`}
								>
									{notice.severity}
								</span>
							</div>

							<p className="text-sm leading-7 text-ink-soft sm:text-base">
								{notice.message}
							</p>
						</div>

						<div className="mt-8 flex flex-wrap items-center gap-3">
							<div className="flex h-12 items-center gap-3 rounded-xl border border-line bg-paper px-4">
								<Clock size={18} className="text-orange" />
								<div>
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Estimated duration
									</p>
									<p className="text-sm font-semibold">
										{notice.durationMinutes} minutes
									</p>
								</div>
							</div>

							<div className="flex h-12 items-center gap-3 rounded-xl border border-line bg-paper px-4">
								<CalendarClock size={18} className="text-orange" />
								<div>
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Planned start
									</p>
									<p className="text-sm font-semibold">
										{startDate ? formatTime(startDate) : "To be announced"}
									</p>
								</div>
							</div>
						</div>
					</section>

					<aside className="relative overflow-hidden rounded-3xl bg-slate p-7 text-sand shadow-2xl ring-1 ring-slate sm:p-9">
						<div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange/20 blur-3xl" />

						<div className="relative">
							<div className="mb-8 flex items-center justify-between">
								<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sand/15 bg-sand/5">
									<Wrench size={23} className="text-orange" />
								</div>

								<span className="rounded-full border border-sky/25 bg-sky/15 px-3 py-1.5 text-xs font-medium text-sand">
									{!startDate
										? "Awaiting schedule"
										: isUpcoming
											? "Scheduled"
											: isWithinWindow
												? "Maintenance window"
												: "Window ended"}
								</span>
							</div>

							<h2 className="font-display text-2xl font-semibold tracking-tight">
								Maintenance schedule
							</h2>

							<p className="mt-3 text-sm leading-7 text-sand/70">
								{startDate
									? "Here is the planned service window. Times are displayed in your browser's local timezone."
									: "A maintenance window has not yet been scheduled. Check back soon."}
							</p>

							<div className="my-8 h-px bg-sand/10" />

							<div className="space-y-6">
								<div className="flex gap-4">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand/5">
										<CalendarClock
											size={18}
											className="text-sand/80"
										/>
									</div>
									<div>
										<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand/50">
											Scheduled date
										</p>
										<p className="mt-1 text-sm font-medium">
											{startDate ? formatDate(startDate) : "Not yet scheduled"}
										</p>
									</div>
								</div>

								<div className="flex gap-4">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand/5">
										<Clock size={18} className="text-sand/80" />
									</div>
									<div>
										<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand/50">
											Expected maintenance window
										</p>
										<p className="mt-1 text-sm font-medium">
											{startDate && endDate
												? `${formatTime(startDate)} – ${formatTime(endDate)}`
												: "To be announced"}
										</p>
									</div>
								</div>
							</div>

							<div className="mt-8 rounded-2xl border border-sand/15 bg-sand/5 p-4">
								<div className="flex items-center gap-3">
									<span
										className={`h-2.5 w-2.5 rounded-full ${
											!startDate
												? "bg-sand/40"
												: isUpcoming
													? "bg-sky"
													: isWithinWindow
														? "bg-orange"
														: "bg-sand/40"
										}`}
									/>
									<span className="text-sm text-sand/80">
										{!startDate
											? "No maintenance is currently scheduled."
											: isUpcoming
												? "We will begin at the scheduled time."
												: isWithinWindow
													? "The scheduled window is in progress."
													: "The planned window has ended."}
									</span>
								</div>
							</div>

							<p className="mt-5 text-xs leading-6 text-sand/50">
								The actual restoration time may vary if additional work is
								required.
							</p>
						</div>
					</aside>
				</div>

				<footer className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft sm:flex-row sm:text-left">
					<p>© {new Date().getFullYear()} TRÏNŪ. All rights reserved.</p>
					<p>Thank you for planning ahead with us.</p>
				</footer>
			</div>
		</main>
	);
}