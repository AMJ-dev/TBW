import { Link } from "@/components/router-link";
import {
	Activity,
	ArrowRight,
	MapPin,
	Quote,
	ShieldCheck,
	Sparkles,
	Target,
} from "lucide-react";
import { PublicFrame, PublicKicker } from "@/components/public/public-shell";

export function AboutPage() {
	const values = [
		{
			number: "01",
			title: "Operational clarity",
			detail: "Teams see the same cargo state and the next responsible action.",
			icon: Activity,
		},
		{
			number: "02",
			title: "Controlled evidence",
			detail: "Movements, documents, exceptions, and obligations remain traceable.",
			icon: ShieldCheck,
		},
		{
			number: "03",
			title: "Local understanding",
			detail:
				"Workflows reflect practical Abuja terminal and Northern Nigeria trade operations.",
			icon: MapPin,
		},
	] as const;

	const principles = [
		"What is the current verified state?",
		"Who owns the next action?",
		"What evidence supports the handoff?",
	];

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
					<div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-8 lg:py-24">
						<div>
							<PublicKicker>About TRÏNŪ</PublicKicker>
							<h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.05] text-ink sm:text-6xl">
								Built around{" "}
								<span className="text-orange">responsible handoffs.</span>
							</h1>
							<p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
								TRÏNŪ is a bonded warehouse operating concept connecting terminal teams,
								importers, agents, finance desks, and gate officers around one dependable
								picture.
							</p>
							<p className="mt-4 max-w-2xl leading-7 text-ink-soft">
								TRÏNŪ brings the port closer — so trade in Abuja moves at Abuja's pace. We
								are the missing link between Nigeria's ports and the businesses that keep
								Abuja and the north moving.
							</p>
							<div className="mt-9 flex flex-wrap gap-3">
								<Link to="/contact">
									<ButtonLink>Speak with the team</ButtonLink>
								</Link>
								<Link
									to="/services"
									className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-paper px-5 text-sm font-semibold text-ink transition-colors hover:bg-sand"
								>
									Explore services <ArrowRight className="size-4" />
								</Link>
							</div>
						</div>

						{/* Operating principle card — Slate formal surface */}
						<div className="relative overflow-hidden rounded-2xl bg-slate p-7 text-sand shadow-2xl ring-1 ring-slate sm:p-9">
							<div
								aria-hidden="true"
								className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-orange/25 blur-3xl"
							/>
							<div className="relative">
								<div className="flex items-center gap-2">
									<Target className="size-4 text-orange" />
									<p className="font-mono text-[10px] uppercase tracking-[0.17em] text-orange">
										Operating principle
									</p>
								</div>
								<p className="mt-5 font-display text-2xl font-bold leading-snug text-sand sm:text-3xl">
									Every cargo movement should answer three questions.
								</p>
								<ol className="mt-8 space-y-4">
									{principles.map((item, index) => (
										<li
											key={item}
											className="flex gap-4 border-t border-sand/15 pt-4 first:border-t-0 first:pt-0"
										>
											<span className="font-mono text-[11px] text-orange">
												0{index + 1}
											</span>
											<span className="text-sm leading-6 text-sand/85">{item}</span>
										</li>
									))}
								</ol>
							</div>
						</div>
					</div>
				</section>

				{/* VALUES */}
				<section className="border-b border-line bg-sand">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="mb-12 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-8">
							<div>
								<PublicKicker>What we value</PublicKicker>
								<h2 className="mt-3 max-w-xl font-display text-3xl font-bold text-ink sm:text-4xl">
									Three principles behind every handoff.
								</h2>
							</div>
							<p className="max-w-md text-sm leading-6 text-ink-soft">
								These are the checks applied to every decision, record, and message we put
								in front of a customer, agent, or regulator.
							</p>
						</div>
						<div className="grid gap-px overflow-hidden rounded-2xl bg-line md:grid-cols-3">
							{values.map(({ number, title, detail, icon: Icon }) => (
								<article
									key={title}
									className="group relative bg-paper p-6 transition-colors hover:bg-sand-2 sm:p-8"
								>
									<div className="flex items-start justify-between gap-4">
										<div className="grid size-11 place-items-center rounded-xl bg-orange text-white transition-colors group-hover:bg-orange-deep">
											<Icon className="size-5" />
										</div>
										<span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
											{number}
										</span>
									</div>
									<h3 className="mt-6 font-display text-xl font-bold text-ink">{title}</h3>
									<p className="mt-3 text-sm leading-6 text-ink-soft">{detail}</p>
								</article>
							))}
						</div>
					</div>
				</section>

				{/* THE PROBLEM IT SOLVES — CEO quote from Quote Bank */}
				<section className="border-b border-line bg-paper">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
							<div>
								<div className="flex items-center gap-2">
									<Quote className="size-4 text-orange" />
									<PublicKicker>The problem it solves</PublicKicker>
								</div>
								<h2 className="mt-4 max-w-md font-display text-3xl font-bold text-ink sm:text-4xl">
									The hidden cost of clearing cargo somewhere else.
								</h2>
							</div>
							<div>
								<blockquote className="font-display text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl lg:text-3xl">
									<span className="text-orange">"</span>
									Importers and clearing agents serving Abuja have always paid a hidden
									cost in time, in money, in congestion simply because their cargo had to
									be handled somewhere else first. TRÏNŪ removes that detour. You store,
									process, and clear your goods closer to where they're actually going.
									<span className="text-orange">"</span>
								</blockquote>
								<div className="mt-6 border-t border-line pt-5">
									<p className="font-display text-sm font-bold text-ink">
										Bilal Aijjola
									</p>
									<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Chief Executive Officer / Managing Director, TRÏNŪ Bonded Warehouse
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* BOUNDARY */}
				<section className="bg-sand">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
							<div>
								<PublicKicker>Important boundary</PublicKicker>
								<h2 className="mt-3 max-w-md font-display text-3xl font-bold text-ink sm:text-4xl">
									Coordination, not regulatory authority.
								</h2>
							</div>
							<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
								<p className="leading-7 text-ink-soft">
									TRÏNŪ records and supports terminal workflows. Customs examinations,
									assessments, releases, and other statutory decisions remain solely with the
									appropriate authorities.
								</p>
								<p className="mt-4 leading-7 text-ink-soft">
									We support and coordinate the clearance process; we do not clear cargo,
									make Customs decisions, or act as a Customs authority.
								</p>
								<Link
									to="/contact"
									className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange"
								>
									Speak with the terminal team <ArrowRight className="size-4" />
								</Link>
							</div>
						</div>
					</div>
				</section>

				{/* WHY THE FACILITY MATTERS — CEO quote, Slate formal band */}
				<section className="relative overflow-hidden border-y border-slate bg-slate text-sand">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -right-32 top-1/2 size-[420px] -translate-y-1/2 rounded-full bg-orange/20 blur-3xl"
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -left-24 -top-24 size-[320px] rounded-full bg-carmine/25 blur-3xl"
					/>
					<div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[.6fr_1.4fr] lg:items-start lg:px-8 lg:py-24">
						<div>
							<div className="flex items-center gap-2">
								<Quote className="size-4 text-orange" />
								<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange">
									Why the facility matters
								</p>
							</div>
							<div className="mt-6 flex items-center gap-4">
								<div className="grid size-14 place-items-center rounded-full bg-orange font-display text-lg font-bold text-white ring-1 ring-orange/40">
									BA
								</div>
								<div>
									<p className="font-display text-sm font-bold text-sand">
										Bilal Aijjola
									</p>
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand/60">
										Chief Executive Officer / Managing Director
									</p>
								</div>
							</div>
						</div>
						<div>
							<blockquote className="font-display text-2xl font-bold leading-snug tracking-tight text-sand sm:text-3xl lg:text-4xl">
								<span className="text-orange">"</span>
								TRÏNŪ isn't just another warehouse, it's the missing link between Nigeria's
								ports and the businesses that keep Abuja and the north moving. For too
								long, cargo bound for this market has had to sit hundreds of kilometers
								away from where it's actually needed. We built TRÏNŪ to bring that process
								home.
								<span className="text-orange">"</span>
							</blockquote>
						</div>
					</div>
				</section>

				{/* VISION — using approved Quote Bank wording */}
				<section className="bg-sand">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="relative overflow-hidden rounded-3xl bg-paper p-8 ring-1 ring-line sm:p-12">
							<div
								aria-hidden="true"
								className="pointer-events-none absolute -right-32 -top-32 size-[420px] rounded-full bg-orange/15 blur-3xl"
							/>
							<div className="relative grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
								<div>
									<div className="flex items-center gap-2">
										<Sparkles className="size-4 text-orange" />
										<PublicKicker>Our vision</PublicKicker>
									</div>
									<h2 className="mt-4 max-w-sm font-display text-3xl font-bold text-ink sm:text-4xl">
										The leading inland bonded logistics hub for Abuja and Northern Nigeria.
									</h2>
								</div>
								<div>
									<blockquote className="font-display text-lg font-bold leading-snug tracking-tight text-ink sm:text-xl">
										<span className="text-orange">"</span>
										Our vision is straightforward: make TRÏNŪ the leading inland bonded
										logistics hub for Abuja and Northern Nigeria. This facility is the
										first step, a secure, Customs-approved gateway that changes how this
										region moves goods.
										<span className="text-orange">"</span>
									</blockquote>
									<div className="mt-6 border-t border-line pt-5">
										<p className="font-display text-sm font-bold text-ink">
											Bilal Aijjola
										</p>
										<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Chief Executive Officer / Managing Director, TRÏNŪ Bonded Warehouse
										</p>
									</div>

									<div className="mt-8 grid gap-3 sm:grid-cols-3">
										{[
											["01", "First of its kind in Abuja"],
											["02", "Built for expansion"],
											["03", "Partnership with agents"],
										].map(([step, label]) => (
											<div
												key={step}
												className="rounded-xl bg-sand p-4 ring-1 ring-line"
											>
												<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
													{step}
												</p>
												<p className="mt-2 text-[13px] font-semibold text-ink">{label}</p>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* BUILT TO EXPAND — Strategy §2 guardrail */}
				<section className="border-t border-line bg-paper">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
							<div>
								<PublicKicker>Built to expand</PublicKicker>
								<h2 className="mt-3 max-w-md font-display text-3xl font-bold text-ink sm:text-4xl">
									Positioning designed for what comes next.
								</h2>
							</div>
							<div className="rounded-2xl bg-sand p-6 ring-1 ring-line sm:p-8">
								<p className="leading-7 text-ink-soft">
									Our Abuja flagship facility is the first step. TRÏNŪ is deliberately
									built to extend — the operating model, the brand language, and the
									platform are all designed to support additional locations without
									reworking the core promise.
								</p>
								<p className="mt-4 leading-7 text-ink-soft">
									Every location will carry the same discipline: recorded handoffs,
									auditable evidence, and a partnership stance with the licensed
									agents and forwarders who move cargo on behalf of their clients.
								</p>
							</div>
						</div>
					</div>
				</section>
			</main>
		</PublicFrame>
	);
}

function ButtonLink({ children }: { children: React.ReactNode }) {
	return (
		<span className="inline-flex h-10 items-center gap-2 rounded-md bg-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-orange-deep">
			{children}
		</span>
	);
}