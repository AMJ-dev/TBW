import { Link } from "@/components/router-link";
import {
	ArrowRight,
	Briefcase,
	Building2,
	GraduationCap,
	Heart,
	MapPin,
	ShieldCheck,
	Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicFrame, PublicKicker } from "@/components/public/public-shell";

const openRoles = [
	{
		title: "Terminal Operations Coordinator",
		department: "Operations",
		location: "Abuja · Flagship Facility",
		type: "Full-time",
		summary:
			"Coordinate receiving, positioning, examination coordination, and release workflow across the bonded terminal.",
	},
	{
		title: "Gate Officer",
		department: "Gate & Access",
		location: "Abuja · Flagship Facility",
		type: "Full-time",
		summary:
			"Verify truck, driver, and container details at gate-in and gate-out. Record every movement with the correct timestamp and attribution.",
	},
	{
		title: "Warehouse Inventory Officer",
		department: "Bonded Warehouse",
		location: "Abuja · Flagship Facility",
		type: "Full-time",
		summary:
			"Track bonded stock, run cycle counts, and maintain accurate bin allocation across aisles, racks, and cold bays.",
	},
	{
		title: "Documentation Officer",
		department: "Documentation",
		location: "Abuja · Flagship Facility",
		type: "Full-time",
		summary:
			"Register, version, and verify shipping and terminal records. Support customers and agents with the document checklist.",
	},
	{
		title: "Finance & Billing Officer",
		department: "Finance",
		location: "Abuja · Flagship Facility",
		type: "Full-time",
		summary:
			"Issue invoices, reconcile payments, and manage customer accounts and credit limits in line with the tariff matrix.",
	},
	{
		title: "Customer Success Coordinator",
		department: "Customer Service",
		location: "Abuja · Flagship Facility",
		type: "Full-time",
		summary:
			"Work with importers, agents, and transporters to onboard accounts, resolve queries, and keep communications clear.",
	},
];

const values = [
	{
		icon: ShieldCheck,
		title: "Compliance first",
		detail:
			"Every decision we make is checked against the regulatory position. We coordinate; the competent authority decides.",
	},
	{
		icon: Users,
		title: "Partnership with agents",
		detail:
			"We work alongside licensed brokers and forwarders. Our success depends on theirs.",
	},
	{
		icon: GraduationCap,
		title: "Learn the terminal",
		detail:
			"Whether you come from logistics or from another sector, we invest in training you on how a bonded terminal actually works.",
	},
	{
		icon: Heart,
		title: "Long-term thinking",
		detail:
			"The flagship facility is the first step. We're building a team that can grow with us into new locations.",
	},
];

export default function CareersPage() {
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
					<div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="grid gap-12 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
							<div>
								<PublicKicker>Careers</PublicKicker>
								<h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
									Build the terminal
									<span className="text-orange"> that Abuja deserves.</span>
								</h1>
								<p className="mt-5 max-w-2xl leading-7 text-ink-soft">
									TRÏNŪ is building Nigeria's inland bonded logistics hub. We're hiring
									people who care about doing the operational work properly — with
									clear records, honest communication, and respect for the regulatory
									boundary.
								</p>
								<div className="mt-8 flex flex-wrap gap-3">
									<a href="#open-roles">
										<Button className="bg-orange text-white hover:bg-orange-deep">
											View open roles <ArrowRight />
										</Button>
									</a>
									<Link to="/about">
										<Button
											variant="outline"
											className="border-line bg-paper text-ink hover:bg-sand"
										>
											About TRÏNŪ
										</Button>
									</Link>
								</div>
							</div>
							<div className="grid grid-cols-3 gap-3">
								{[
									["6", "Open roles"],
									["1", "Location"],
									["NG", "Based in Abuja"],
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
				</section>

				{/* VALUES */}
				<section className="border-b border-line bg-sand">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="mb-12 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
							<div>
								<PublicKicker>How we work</PublicKicker>
								<h2 className="mt-3 max-w-xl font-display text-3xl font-bold text-ink sm:text-4xl">
									Four things that shape every role at TRÏNŪ.
								</h2>
							</div>
							<p className="max-w-md text-sm leading-6 text-ink-soft">
								These aren't slogans — they show up in how we hire, how we train, and how
								we make decisions day to day.
							</p>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							{values.map((v) => {
								const Icon = v.icon;
								return (
									<article
										key={v.title}
										className="rounded-2xl bg-paper p-6 ring-1 ring-line"
									>
										<div className="grid size-11 place-items-center rounded-xl bg-orange text-white">
											<Icon className="size-5" />
										</div>
										<h3 className="mt-5 font-display text-lg font-bold text-ink">
											{v.title}
										</h3>
										<p className="mt-2 text-sm leading-6 text-ink-soft">{v.detail}</p>
									</article>
								);
							})}
						</div>
					</div>
				</section>

				{/* OPEN ROLES */}
				<section id="open-roles" className="scroll-mt-24 bg-paper">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
							<div>
								<PublicKicker>Open roles</PublicKicker>
								<h2 className="mt-3 max-w-xl font-display text-3xl font-bold text-ink sm:text-4xl">
									Six positions open at the Abuja Flagship Facility.
								</h2>
							</div>
							<p className="max-w-md text-sm leading-6 text-ink-soft">
								All roles are based on-site. We're building a team that grows together,
								so we invest in training on the bonded terminal operating model.
							</p>
						</div>

						<div className="divide-y divide-line border-y border-line">
							{openRoles.map((role) => (
								<article
									key={role.title}
									className="grid gap-6 py-7 md:grid-cols-[1fr_auto] md:items-center"
								>
									<div>
										<div className="flex flex-wrap items-center gap-3">
											<span className="inline-flex items-center gap-1.5 rounded-full bg-orange px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white">
												{role.department}
											</span>
											<span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
												<MapPin className="size-3" /> {role.location}
											</span>
											<span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
												<Briefcase className="size-3" /> {role.type}
											</span>
										</div>
										<h3 className="mt-3 font-display text-xl font-bold text-ink">
											{role.title}
										</h3>
										<p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
											{role.summary}
										</p>
									</div>
									<div className="flex md:justify-end">
										<Link to="/contact">
											<Button className="bg-orange text-white hover:bg-orange-deep">
												Apply <ArrowRight />
											</Button>
										</Link>
									</div>
								</article>
							))}
						</div>
					</div>
				</section>

				{/* HIRING PROCESS */}
				<section className="border-y border-line bg-sand">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
							<div>
								<PublicKicker>What to expect</PublicKicker>
								<h2 className="mt-3 max-w-md font-display text-3xl font-bold text-ink sm:text-4xl">
									A clear, honest hiring process.
								</h2>
								<p className="mt-4 max-w-md leading-7 text-ink-soft">
									No trick questions. No hidden process. We tell you what each stage is
									and who you'll meet — so you can decide whether TRÏNŪ is right for you
									as much as we decide whether you're right for the role.
								</p>
							</div>
							<ol className="grid gap-3">
								{[
									[
										"01",
										"Application",
										"Send your details through the contact form. Include the role you're applying for.",
									],
									[
										"02",
										"Introductory call",
										"A short call with the hiring manager to talk about your background and the role.",
									],
									[
										"03",
										"Working conversation",
										"A longer session focused on how you'd handle real terminal scenarios.",
									],
									[
										"04",
										"Offer and onboarding",
										"If we're both happy, we make an offer and start training.",
									],
								].map(([step, label, detail]) => (
									<li key={step} className="relative">
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
									Ready to apply?
								</p>
								<h2 className="mt-3 font-display text-3xl font-bold text-sand sm:text-4xl">
									Tell us which role interests you.
								</h2>
								<p className="mt-4 max-w-xl leading-7 text-sand/75">
									Send your details through our contact form. Include the role you're
									applying for and a short note about what draws you to TRÏNŪ.
								</p>
							</div>
							<div className="flex flex-wrap gap-3 lg:justify-end">
								<Link to="/contact">
									<Button size="lg" className="bg-orange text-white hover:bg-orange-deep">
										Contact us <ArrowRight />
									</Button>
								</Link>
								<Link to="/about">
									<Button
										size="lg"
										variant="outline"
										className="border-sand/30 bg-transparent text-sand hover:bg-sand/10"
									>
										About TRÏNŪ
									</Button>
								</Link>
							</div>
						</div>
					</div>
				</section>

				{/* FOOTER STATS */}
				<section className="bg-paper">
					<div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
						<div className="grid gap-6 md:grid-cols-3">
							<div className="flex items-start gap-3">
								<div className="grid size-9 shrink-0 place-items-center rounded-md bg-orange text-white">
									<Building2 className="size-4" />
								</div>
								<div>
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
										Location
									</p>
									<p className="mt-1 text-sm font-semibold text-ink">
										Abuja Flagship Facility
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<div className="grid size-9 shrink-0 place-items-center rounded-md bg-orange text-white">
									<Users className="size-4" />
								</div>
								<div>
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
										Team
									</p>
									<p className="mt-1 text-sm font-semibold text-ink">
										Growing across operations, gate, warehouse, docs, and finance
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<div className="grid size-9 shrink-0 place-items-center rounded-md bg-orange text-white">
									<ShieldCheck className="size-4" />
								</div>
								<div>
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
										What we look for
									</p>
									<p className="mt-1 text-sm font-semibold text-ink">
										Clear records, honest communication, respect for regulatory
										boundaries
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>
			</main>
		</PublicFrame>
	);
}