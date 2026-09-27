import { Link } from "@/components/router-link";
import { ArrowRight, Home, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
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
					<Link to="/tracking">
						<Button size="sm" className="bg-orange text-white hover:bg-orange-deep">
							Track cargo <ArrowRight />
						</Button>
					</Link>
				</header>

				<div className="flex flex-1 items-center py-16">
					<div className="grid w-full gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange">
								Error 404 · Off route
							</p>

							<h1 className="mt-4 max-w-xl font-display text-5xl font-bold leading-[0.98] text-ink sm:text-6xl lg:text-7xl">
								This path isn't
								<span className="text-orange"> on the ground map.</span>
							</h1>

							<p className="mt-6 max-w-lg text-base leading-7 text-ink-soft sm:text-lg">
								The page you were looking for may have been moved, renamed, or is no
								longer in service. Let's route you back to a working part of the
								terminal.
							</p>

							<div className="mt-9 flex flex-wrap gap-3">
								<Link to="/">
									<Button size="lg" className="bg-orange text-white hover:bg-orange-deep">
										Return home <ArrowRight />
									</Button>
								</Link>
								<Link to="/tracking">
									<Button
										size="lg"
										variant="outline"
										className="border-line bg-paper text-ink hover:bg-sand"
									>
										Track cargo
									</Button>
								</Link>
							</div>

							<div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
								<span className="inline-flex items-center gap-2">
									<span className="size-1.5 rounded-full bg-orange" />
									TRINŪ · Abuja Flagship Facility
								</span>
								<span>Ref · 404</span>
							</div>
						</div>

						<div className="relative">
							{/* Slate wayfinding card — formal/institutional tone */}
							<div className="relative overflow-hidden rounded-2xl bg-slate p-6 text-sand shadow-2xl ring-1 ring-slate sm:p-8">
								<div
									aria-hidden="true"
									className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-orange/25 blur-3xl"
								/>

								<div className="relative">
									<div className="flex items-center gap-2">
										<MapPin className="size-4 text-orange" />
										<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange">
											Wayfinding
										</p>
									</div>

									<p className="mt-5 font-display text-2xl font-bold leading-snug text-sand sm:text-3xl">
										Every page in the terminal should have a clear next step.
									</p>

									<p className="mt-3 text-sm leading-6 text-sand/75">
										Use one of the routes below to get back to where you were heading.
									</p>

									<div className="mt-7 grid gap-2">
										{[
											{ label: "Home", to: "/", detail: "Overview and terminal positioning" },
											{ label: "Track cargo", to: "/tracking", detail: "Live lookup by container or BL" },
											{ label: "Contact operations", to: "/contact", detail: "Send an enquiry to the team" },
										].map(({ label, to, detail }) => (
											<Link
												key={to}
												to={to}
												className="group flex items-center justify-between rounded-lg bg-sand/5 px-4 py-3 ring-1 ring-sand/15 transition-colors hover:bg-orange hover:ring-orange"
											>
												<div className="min-w-0">
													<p className="text-sm font-semibold text-sand">{label}</p>
													<p className="mt-0.5 text-[11px] text-sand/60">{detail}</p>
												</div>
												<ArrowRight className="size-4 shrink-0 text-sand/60 transition-transform group-hover:translate-x-0.5 group-hover:text-sand" />
											</Link>
										))}
									</div>
								</div>
							</div>

							<div className="mt-4 grid grid-cols-3 gap-3">
								{[
									["404", "Route"],
									["24/7", "Tracking"],
									["01", "Terminal"],
								].map(([value, label]) => (
									<div key={label} className="rounded-xl bg-sand p-3 ring-1 ring-line">
										<p className="font-display text-xl font-bold text-ink">{value}</p>
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