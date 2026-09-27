import { Link } from "@/components/router-link";
import { ArrowRight, Boxes, Check, FileCheck2, Truck, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicFrame, PublicKicker } from "@/components/public/public-shell";

const services = [
	{
		number: "01",
		title: "Bonded warehousing",
		summary:
			"Controlled storage with clear position, dwell, occupancy, and movement records — a dependable record across yards, bays, and bonded warehouse zones.",
		icon: Warehouse,
		facts: ["Yard and bay visibility", "Cycle-count support", "Storage obligation tracking"],
	},
	{
		number: "02",
		title: "Cargo handling",
		summary:
			"Coordinated receiving, positioning, examination preparation, and authorised movement — with a shared record for every handoff.",
		icon: Boxes,
		facts: ["Arrival planning", "Discrepancy recording", "Movement history"],
	},
	{
		number: "03",
		title: "Documentation support",
		summary:
			"A traceable workspace for shipping and terminal records required around each cargo movement — versioned, reviewable, and ready for coordination.",
		icon: FileCheck2,
		facts: ["Versioned documents", "Review status", "Missing-record alerts"],
	},
	{
		number: "04",
		title: "Gate coordination",
		summary:
			"Appointment, readiness, admission, loading, referral, and gate-out coordination — so truck movements align with confirmed cargo readiness.",
		icon: Truck,
		facts: ["Truck time slots", "Readiness checks", "Gate pass records"],
	},
] as const;

const cargoCategories = [
	"General",
	"Containerised",
	"Agricultural",
	"Industrial",
	"Automotive",
	"Project cargo",
] as const;

const heroStats = [
	["04", "Core services"],
	["06", "Cargo categories"],
	["NGN", "Local currency"],
	["NG", "Naira-based pricing"],
] as const;

export function ServicesPage() {
	return (
		<PublicFrame>
			<main>
				{/* HERO */}
				<section className="relative overflow-hidden border-b border-line bg-paper">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -right-32 -top-40 size-[560px] rounded-full bg-orange/20 blur-3xl"
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -left-40 bottom-0 size-[420px] rounded-full bg-carmine/15 blur-3xl"
					/>
					<div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
						<div className="grid gap-12 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
							<div>
								<PublicKicker>Terminal services</PublicKicker>
								<h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.05] text-ink sm:text-6xl">
									One operating record from{" "}
									<span className="text-orange">arrival to gate-out.</span>
								</h1>
								<p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
									Practical bonded terminal services supported by clear records,
									responsible handoffs, and visible next actions. TRÏNŪ brings the port
									closer — so trade in Abuja moves at Abuja's pace.
								</p>
								<div className="mt-9 flex flex-wrap gap-3">
									<Link to="/quote">
										<Button size="lg" className="bg-orange text-white hover:bg-orange-deep">
											Request a quote <ArrowRight />
										</Button>
									</Link>
									<Link to="/contact">
										<Button
											size="lg"
											variant="outline"
											className="border-line bg-paper text-ink hover:bg-sand"
										>
											Talk to the team
										</Button>
									</Link>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3 self-end">
								{heroStats.map(([value, label]) => (
									<div
										key={label}
										className="rounded-xl bg-sand p-4 ring-1 ring-line"
									>
										<p className="font-display text-2xl font-bold text-ink">{value}</p>
										<p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
											{label}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>

				{/* SERVICES */}
				<section className="bg-sand">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
							<div>
								<PublicKicker>What we do</PublicKicker>
								<h2 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
									Four services, one dependable picture.
								</h2>
							</div>
							<p className="max-w-md text-sm leading-6 text-ink-soft">
								Each service is backed by an auditable operating record — so every handoff
								has a name, a timestamp, and a next action.
							</p>
						</div>

						<div className="grid gap-6 md:grid-cols-2">
							{services.map(({ number, title, summary, icon: Icon, facts }) => (
								<article
									key={title}
									className="group relative flex flex-col overflow-hidden rounded-2xl bg-paper p-6 ring-1 ring-line transition-all duration-300 hover:-translate-y-1 hover:ring-orange/40 hover:shadow-xl sm:p-8"
								>
									<div
										aria-hidden="true"
										className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-orange/10 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
									/>
									<div className="relative flex items-start justify-between gap-4">
										<div className="grid size-12 place-items-center rounded-xl bg-orange text-white transition-colors duration-300 group-hover:bg-orange-deep">
											<Icon className="size-6" />
										</div>
										<span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
											{number}
										</span>
									</div>
									<h3 className="relative mt-6 font-display text-2xl font-bold text-ink">
										{title}
									</h3>
									<p className="relative mt-3 flex-1 leading-7 text-ink-soft">{summary}</p>
									<ul className="relative mt-6 space-y-2.5 border-t border-line pt-5">
										{facts.map((fact) => (
											<li key={fact} className="flex items-center gap-3 text-sm text-ink">
												<span className="grid size-5 place-items-center rounded-full bg-orange/15 text-orange">
													<Check className="size-3" />
												</span>
												{fact}
											</li>
										))}
									</ul>
								</article>
							))}
						</div>
					</div>
				</section>

				{/* CARGO CATEGORIES */}
				<section className="border-y border-line bg-paper">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
							<div>
								<PublicKicker>Cargo we handle</PublicKicker>
								<h2 className="mt-3 max-w-md font-display text-3xl font-bold text-ink sm:text-4xl">
									Categories served at the Abuja flagship facility.
								</h2>
								<p className="mt-4 max-w-md leading-7 text-ink-soft">
									Subject to licence conditions and equipment availability. Contact
									operations for specialised or project cargo.
								</p>
							</div>
							<div className="grid gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-2 lg:grid-cols-3">
								{cargoCategories.map((cat, index) => (
									<div
										key={cat}
										className="flex items-center justify-between bg-paper px-5 py-4"
									>
										<span className="font-display text-sm font-bold text-ink">
											{cat}
										</span>
										<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
											0{index + 1}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>

				{/* HOW IT WORKS */}
				<section className="bg-sand">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
							<div>
								<PublicKicker>How it works</PublicKicker>
								<h2 className="mt-3 max-w-md font-display text-3xl font-bold text-ink sm:text-4xl">
									From arrival to gate-out — clearly documented.
								</h2>
								<p className="mt-4 max-w-md leading-7 text-ink-soft">
									A single operating record follows every consignment through the
									terminal, so operations, agents, and finance all work from the same
									verified state.
								</p>
								<Link
									to="/tracking"
									className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange"
								>
									See a live cargo record <ArrowRight className="size-4" />
								</Link>
							</div>
							<ol className="relative grid gap-3 border-l border-line pl-6">
								{[
									["01", "Arrival & receiving", "Gate entry, tally, and condition recorded."],
									["02", "Storage & positioning", "Bonded zone, yard slot, and dwell tracked."],
									["03", "Documentation & review", "Required records checked and versioned."],
									["04", "Release & gate-out", "Authorised movement and departure recorded."],
								].map(([step, label, detail]) => (
									<li key={step} className="relative">
										<span className="absolute -left-[31px] top-4 grid size-3 place-items-center rounded-full border-2 border-orange bg-paper" />
										<div className="rounded-xl bg-paper p-4 ring-1 ring-line">
											<div className="flex items-center gap-3">
												<span className="font-mono text-[11px] font-semibold text-orange">
													{step}
												</span>
												<p className="font-display text-base font-bold text-ink">
													{label}
												</p>
											</div>
											<p className="mt-1.5 text-sm text-ink-soft">{detail}</p>
										</div>
									</li>
								))}
							</ol>
						</div>
					</div>
				</section>

				{/* CTA — Slate formal band */}
				<section className="relative overflow-hidden bg-slate">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -right-32 -top-32 size-[420px] rounded-full bg-orange/25 blur-3xl"
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -left-24 bottom-0 size-[320px] rounded-full bg-carmine/25 blur-3xl"
					/>
					<div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange">
									Next step
								</p>
								<h2 className="mt-3 font-display text-3xl font-bold text-sand sm:text-4xl">
									Tell us what needs to move.
								</h2>
								<p className="mt-4 max-w-xl leading-7 text-sand/75">
									Share your cargo, timing, and service needs. A TRÏNŪ coordinator will
									review the brief and follow up using the contact information provided.
								</p>
							</div>
							<div className="flex flex-wrap gap-3 lg:justify-end">
								<Link to="/quote">
									<Button size="lg" className="bg-orange text-white hover:bg-orange-deep">
										Request a quote <ArrowRight />
									</Button>
								</Link>
								<Link to="/contact">
									<Button
										size="lg"
										variant="outline"
										className="border-sand/30 bg-transparent text-sand hover:bg-sand/10"
									>
										Talk to the team
									</Button>
								</Link>
							</div>
						</div>
					</div>
				</section>
			</main>
		</PublicFrame>
	);
}