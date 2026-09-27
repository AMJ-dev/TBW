import { Link } from "@/components/router-link";
import { ArrowRight, Clock3, Gauge, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RateLimited() {
	return (
		<main className="relative min-h-screen overflow-hidden bg-paper text-ink">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -right-40 -top-40 size-[620px] rounded-full bg-orange/20 blur-3xl"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -left-40 bottom-0 size-[480px] rounded-full bg-carmine/15 blur-3xl"
			/>

			<div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-10 lg:px-10 lg:py-14">
				<header className="flex items-center justify-between">
					<Link to="/" aria-label="TRINU home" className="shrink-0">
						<img src="/logo.png" alt="TRINU Bonded Terminal" className="h-14 w-14" />
					</Link>
					<Link to="/">
						<Button size="sm" variant="outline" className="border-line bg-paper text-ink hover:bg-sand">
							Return home <ArrowRight />
						</Button>
					</Link>
				</header>

				<div className="flex flex-1 items-center py-16">
					<div className="grid w-full gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange">
								Error 429 · Too many requests
							</p>

							<h1 className="mt-4 max-w-xl font-display text-5xl font-bold leading-[0.98] text-ink sm:text-6xl lg:text-7xl">
								Slow down
								<span className="text-orange"> for a moment.</span>
							</h1>

							<p className="mt-6 max-w-lg text-base leading-7 text-ink-soft sm:text-lg">
								You've made too many requests in a short period. Rate limits protect the
								terminal from overload and keep tracking and coordination fair for
								everyone. Try again shortly.
							</p>

							<div className="mt-9 flex flex-wrap gap-3">
								<Link to="/">
									<Button size="lg" className="bg-orange text-white hover:bg-orange-deep">
										Return home <ArrowRight />
									</Button>
								</Link>
								<Link to="/contact">
									<Button
										size="lg"
										variant="outline"
										className="border-line bg-paper text-ink hover:bg-sand"
									>
										Contact operations
									</Button>
								</Link>
							</div>

							<div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
								<span className="inline-flex items-center gap-2">
									<span className="size-1.5 rounded-full bg-orange" />
									TRINŪ · Abuja Flagship Facility
								</span>
								<span>Ref · 429</span>
							</div>
						</div>

						<div className="relative">
							<div className="relative overflow-hidden rounded-2xl bg-slate p-6 text-sand shadow-2xl ring-1 ring-slate sm:p-8">
								<div
									aria-hidden="true"
									className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-orange/25 blur-3xl"
								/>

								<div className="relative">
									<div className="flex items-center gap-2">
										<Gauge className="size-4 text-orange" />
										<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange">
											Rate limit policy
										</p>
									</div>

									<p className="mt-5 font-display text-2xl font-bold leading-snug text-sand sm:text-3xl">
										Limits keep the terminal dependable.
									</p>

									<p className="mt-3 text-sm leading-6 text-sand/75">
										Authenticated accounts receive higher limits than anonymous requests.
										If you need sustained access, request a portal account instead of
										polling.
									</p>

									<div className="mt-7 grid gap-2">
										{[
											{
												label: "Wait a minute, then retry",
												to: "/",
												detail: "Most limits reset within 60 seconds",
												icon: Clock3,
											},
											{
												label: "Track cargo",
												to: "/tracking",
												detail: "Public tracking for a single reference",
												icon: ShieldCheck,
											},
											{
												label: "Contact operations",
												to: "/contact",
												detail: "Request higher limits or portal access",
												icon: ArrowRight,
											},
										].map(({ label, to, detail, icon: Icon }) => (
											<Link
												key={to}
												to={to}
												className="group flex items-center justify-between rounded-lg bg-sand/5 px-4 py-3 ring-1 ring-sand/15 transition-colors hover:bg-orange hover:ring-orange"
											>
												<div className="flex min-w-0 items-center gap-3">
													<Icon className="size-4 shrink-0 text-orange transition-colors group-hover:text-sand" />
													<div className="min-w-0">
														<p className="text-sm font-semibold text-sand">{label}</p>
														<p className="mt-0.5 text-[11px] text-sand/60">{detail}</p>
													</div>
												</div>
												<ArrowRight className="size-4 shrink-0 text-sand/60 transition-transform group-hover:translate-x-0.5 group-hover:text-sand" />
											</Link>
										))}
									</div>
								</div>
							</div>

							<div className="mt-4 grid grid-cols-3 gap-3">
								{[
									["429", "Status"],
									["60s", "Typical reset"],
									["Fair", "For everyone"],
								].map(([value, label]) => (
									<div key={label} className="rounded-xl bg-sand p-3 ring-1 ring-line">
										<p className="font-display text-sm font-bold text-ink">{value}</p>
										<p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
											{label}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				<footer className="border-t border-line pt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<span>TRINŪ Bonded Warehouse · Abuja, Nigeria</span>
						<span>Customs support and coordination — not a Customs authority</span>
					</div>
				</footer>
			</div>
		</main>
	);
}