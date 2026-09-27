import { Link } from "@/components/router-link";
import { ArrowRight, RefreshCw, ServerCrash, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ServerError() {
	const reload = () => {
		if (typeof window !== "undefined") {
			window.location.reload();
		}
	};

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
					<Button
						size="sm"
						onClick={reload}
						className="bg-orange text-white hover:bg-orange-deep"
					>
						<RefreshCw className="size-3.5" />
						Try again
					</Button>
				</header>

				<div className="flex flex-1 items-center py-16">
					<div className="grid w-full gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange">
								Error 500 · Server error
							</p>

							<h1 className="mt-4 max-w-xl font-display text-5xl font-bold leading-[0.98] text-ink sm:text-6xl lg:text-7xl">
								Something went wrong
								<span className="text-orange"> on our side.</span>
							</h1>

							<p className="mt-6 max-w-lg text-base leading-7 text-ink-soft sm:text-lg">
								The terminal hit an unexpected problem while handling your request. This
								isn't something you did — the issue has been logged and our team will
								review it. You can try again, or continue with another part of the
								terminal.
							</p>

							<div className="mt-9 flex flex-wrap gap-3">
								<Button
									size="lg"
									onClick={reload}
									className="bg-orange text-white hover:bg-orange-deep"
								>
									<RefreshCw />
									Reload this page
								</Button>
								<Link to="/">
									<Button
										size="lg"
										variant="outline"
										className="border-line bg-paper text-ink hover:bg-sand"
									>
										Return home
									</Button>
								</Link>
							</div>

							<div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
								<span className="inline-flex items-center gap-2">
									<span className="size-1.5 rounded-full bg-orange" />
									TRINŪ · Abuja Flagship Facility
								</span>
								<span>Ref · 500</span>
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
										<ServerCrash className="size-4 text-orange" />
										<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange">
											What to expect
										</p>
									</div>

									<p className="mt-5 font-display text-2xl font-bold leading-snug text-sand sm:text-3xl">
										A failed request is not a failed record.
									</p>

									<p className="mt-3 text-sm leading-6 text-sand/75">
										Operational data is recorded independently of any single page. If a
										request fails, the underlying cargo, document, or coordination
										state is untouched.
									</p>

									<div className="mt-7 grid gap-2">
										{[
											{
												label: "Retry the request",
												to: "/",
												detail: "Reload — most 500s are transient",
												icon: RefreshCw,
												onClick: true,
											},
											{
												label: "Track cargo",
												to: "/tracking",
												detail: "Public tracking continues to work",
												icon: ShieldCheck,
											},
											{
												label: "Contact operations",
												to: "/contact",
												detail: "Report the issue with a reference",
												icon: ArrowRight,
											},
										].map((item) => {
											const { label, to, detail, icon: Icon, onClick } = item;
											const inner = (
												<>
													<div className="flex min-w-0 items-center gap-3">
														<Icon className="size-4 shrink-0 text-orange transition-colors group-hover:text-sand" />
														<div className="min-w-0">
															<p className="text-sm font-semibold text-sand">{label}</p>
															<p className="mt-0.5 text-[11px] text-sand/60">{detail}</p>
														</div>
													</div>
													<ArrowRight className="size-4 shrink-0 text-sand/60 transition-transform group-hover:translate-x-0.5 group-hover:text-sand" />
												</>
											);

											const className =
												"group flex w-full items-center justify-between rounded-lg bg-sand/5 px-4 py-3 text-left ring-1 ring-sand/15 transition-colors hover:bg-orange hover:ring-orange";

											return onClick ? (
												<button
													key={to}
													type="button"
													onClick={reload}
													className={className}
												>
													{inner}
												</button>
											) : (
												<Link key={to} to={to} className={className}>
													{inner}
												</Link>
											);
										})}
									</div>
								</div>
							</div>

							<div className="mt-4 grid grid-cols-3 gap-3">
								{[
									["500", "Status"],
									["Logged", "For review"],
									["Safe", "Data intact"],
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