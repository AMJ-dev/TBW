import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	ClipboardCheck,
	FileCheck2,
	FileText,
	Scale,
	ShieldCheck,
	Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicFrame, PublicKicker } from "@/components/public/public-shell";

const boundary = [
	{
		icon: ShieldCheck,
		label: "TRÏNŪ coordinates",
		detail:
			"We provide facilities, records, and coordination support for examination, documentation, and terminal movement.",
	},
	{
		icon: Scale,
		label: "Customs decides",
		detail:
			"Examinations, assessments, valuations, classifications, duty determinations, releases, and other statutory decisions remain solely with the competent authority.",
	},
	{
		icon: FileCheck2,
		label: "Records are auditable",
		detail:
			"Every coordination event is timestamped, attributed, and searchable. Outcomes are recorded as provided by the competent authority.",
	},
];

const services = [
	{
		icon: ClipboardCheck,
		title: "Examination coordination",
		body: "We schedule, position, and prepare cargo for examination. We provide facilities and coordination — we do not carry out examinations or issue outcomes.",
		points: [
			"Schedule and bay coordination",
			"Container positioning and internal movement",
			"Attendance records for the examination window",
			"Return-to-storage after examination",
		],
	},
	{
		icon: FileText,
		title: "Documentation support",
		body: "We maintain a traceable workspace for the shipping and terminal records required around each movement — commercial invoice, packing list, bill of lading, and supporting records.",
		points: [
			"Versioned document records",
			"Review status and missing-record alerts",
			"Delivery order and terminal-issued documents",
			"Verification for terminal-issued documents",
		],
	},
	{
		icon: Users,
		title: "Clearance coordination",
		body: "We support and coordinate the clearance process. We do not clear cargo, we do not make Customs decisions, and we do not act as a Customs authority.",
		points: [
			"Coordination with licensed brokers and agents",
			"Readiness checks before movement",
			"Coordination records and audit trail",
			"Escalation paths for exceptions and holds",
		],
	},
	{
		icon: AlertTriangle,
		title: "Holds and exceptions",
		body: "We record holds with the correct authority, reference, reason, and actor. A hold is lifted only by an authorised actor with a documented reason.",
		points: [
			"Customs, agency, terminal, financial, damage, and documentation holds",
			"Traceable raise-and-lift history",
			"Overstay flagging and escalation",
			"Supervisor approval for overrides",
		],
	},
] as const;

const wording = [
	{
		use: "We support and coordinate the clearance process.",
		avoid: "We clear your cargo.",
	},
	{
		use: "We release cargo once Customs authorisation and all terminal obligations are satisfied.",
		avoid: "We release your cargo.",
	},
	{
		use: "We provide facilities and coordination for Customs examination.",
		avoid: "Customs examination by our team.",
	},
	{
		use: "Support with duty and charge payment processes.",
		avoid: "Duty payment.",
	},
	{
		use: "Only a specific licence or approval actually held, with reference.",
		avoid: "Approved by Customs badge.",
	},
] as const;

const publicTracking = [
	"Reference, container, or bill of lading lookup",
	"ISO 6346 check-digit validation on container numbers",
	"Current operational status and timestamped milestones",
	"Terminal reference and next expected step",
];

const publicTrackingExcluded = [
	"Consignee details",
	"Cargo value and invoice amounts",
	"Detailed goods description",
	"Exact storage position",
];

export default function CompliancePage() {
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
								<PublicKicker>Customs & compliance</PublicKicker>
								<h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
									Coordination, not
									<span className="text-orange"> regulatory authority.</span>
								</h1>
								<p className="mt-5 max-w-2xl leading-7 text-ink-soft">
									TRÏNŪ operates within the Nigeria Customs Service Act 2023, applicable
									NCS procedures for bonded facilities, and the Nigeria Data Protection
									Act 2023. We record and coordinate. Customs decides.
								</p>
							</div>
							<div className="grid grid-cols-3 gap-3">
								{[
									["NCS", "Act 2023"],
									["NDPA", "2023"],
									["B'Odogwu", "Aligned"],
								].map(([value, label]) => (
									<div key={label} className="rounded-xl bg-sand p-3 ring-1 ring-line">
										<p className="font-display text-sm font-bold text-ink">{value}</p>
										<p className="mt-1 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-soft">
											{label}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>

				{/* BOUNDARY */}
				<section className="border-b border-line bg-sand">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="mb-12 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
							<div>
								<PublicKicker>The boundary</PublicKicker>
								<h2 className="mt-3 max-w-xl font-display text-3xl font-bold text-ink sm:text-4xl">
									Where we stand, clearly.
								</h2>
							</div>
							<p className="max-w-md text-sm leading-6 text-ink-soft">
								Everything TRÏNŪ does sits inside a specific boundary. It's worth
								repeating what we do and what we don't.
							</p>
						</div>

						<div className="grid gap-4 md:grid-cols-3">
							{boundary.map((b) => {
								const Icon = b.icon;
								return (
									<article
										key={b.label}
										className="rounded-2xl bg-paper p-6 ring-1 ring-line"
									>
										<div className="grid size-11 place-items-center rounded-xl bg-orange text-white">
											<Icon className="size-5" />
										</div>
										<h3 className="mt-5 font-display text-lg font-bold text-ink">
											{b.label}
										</h3>
										<p className="mt-2 text-sm leading-6 text-ink-soft">{b.detail}</p>
									</article>
								);
							})}
						</div>
					</div>
				</section>

				{/* SERVICES */}
				<section className="bg-paper">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
							<div>
								<PublicKicker>What we coordinate</PublicKicker>
								<h2 className="mt-3 max-w-xl font-display text-3xl font-bold text-ink sm:text-4xl">
									Four areas, all under the same boundary.
								</h2>
							</div>
							<p className="max-w-md text-sm leading-6 text-ink-soft">
								Each service is documented, auditable, and deferential to the competent
								authority.
							</p>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							{services.map((s) => {
								const Icon = s.icon;
								return (
									<article
										key={s.title}
										className="flex flex-col rounded-2xl bg-sand p-6 ring-1 ring-line"
									>
										<div className="grid size-11 place-items-center rounded-xl bg-orange text-white">
											<Icon className="size-5" />
										</div>
										<h3 className="mt-5 font-display text-xl font-bold text-ink">
											{s.title}
										</h3>
										<p className="mt-3 text-sm leading-6 text-ink-soft">{s.body}</p>
										<ul className="mt-5 space-y-2 border-t border-line pt-5">
											{s.points.map((point) => (
												<li
													key={point}
													className="flex items-start gap-2.5 text-[13px] text-ink"
												>
													<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
													{point}
												</li>
											))}
										</ul>
									</article>
								);
							})}
						</div>
					</div>
				</section>

				{/* WORDING */}
				<section className="border-y border-line bg-sand">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
							<div>
								<PublicKicker>Wording we use</PublicKicker>
								<h2 className="mt-3 max-w-md font-display text-3xl font-bold text-ink sm:text-4xl">
									Every claim is deliberate.
								</h2>
								<p className="mt-4 max-w-md leading-7 text-ink-soft">
									Words matter in compliance. We use the exact language our regulatory
									position requires, and we avoid the shortcuts that blur the line
									between coordination and decision.
								</p>
							</div>

							<div className="overflow-hidden rounded-2xl bg-slate text-sand ring-1 ring-slate">
								<div className="grid grid-cols-2 border-b border-sand/10">
									<div className="p-4">
										<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
											We use
										</p>
									</div>
									<div className="border-l border-sand/10 p-4">
										<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sand/50">
											We avoid
										</p>
									</div>
								</div>
								<ul>
									{wording.map((w) => (
										<li
											key={w.avoid}
											className="grid grid-cols-2 border-b border-sand/10 last:border-b-0"
										>
											<div className="p-4">
												<p className="text-[13px] leading-5 text-sand">{w.use}</p>
											</div>
											<div className="border-l border-sand/10 p-4">
												<p className="text-[13px] leading-5 text-sand/45 line-through">
													{w.avoid}
												</p>
											</div>
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</section>

				{/* PUBLIC TRACKING */}
				<section className="bg-paper">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
							<div>
								<PublicKicker>Public tracking</PublicKicker>
								<h2 className="mt-3 max-w-xl font-display text-3xl font-bold text-ink sm:text-4xl">
									What public tracking shows — and what it protects.
								</h2>
							</div>
							<p className="max-w-md text-sm leading-6 text-ink-soft">
								Public cargo tracking is designed to be useful without exposing sensitive
								commercial information.
							</p>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<article className="rounded-2xl bg-sand p-6 ring-1 ring-line">
								<div className="flex items-center gap-2">
									<FileCheck2 className="size-4 text-orange" />
									<p className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-orange">
										Shown publicly
									</p>
								</div>
								<ul className="mt-5 space-y-3">
									{publicTracking.map((item) => (
										<li key={item} className="flex items-start gap-3 text-sm text-ink">
											<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange" />
											{item}
										</li>
									))}
								</ul>
							</article>

							<article className="rounded-2xl bg-paper p-6 ring-1 ring-line">
								<div className="flex items-center gap-2">
									<ShieldCheck className="size-4 text-slate" />
									<p className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-slate">
										Excluded from public view
									</p>
								</div>
								<ul className="mt-5 space-y-3">
									{publicTrackingExcluded.map((item) => (
										<li key={item} className="flex items-start gap-3 text-sm text-ink-soft">
											<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate/40" />
											{item}
										</li>
									))}
								</ul>
								<p className="mt-6 border-t border-line pt-5 text-[12px] leading-5 text-ink-soft">
									Authenticated stakeholders can view full detail through the portal, as
									permitted by their authorisation.
								</p>
							</article>
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
								<p className="font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-orange">
									Need clarification?
								</p>
								<h2 className="mt-3 font-display text-3xl font-bold text-sand sm:text-4xl">
									Speak with the terminal team.
								</h2>
								<p className="mt-4 max-w-xl leading-7 text-sand/75">
									If you have a question about how we coordinate with the competent
									authority, our documentation practice, or the wording we use, contact
									us. We'll answer clearly.
								</p>
							</div>
							<div className="flex flex-wrap gap-3 lg:justify-end">
								<Link to="/contact">
									<Button size="lg" className="bg-orange text-white hover:bg-orange-deep">
										Contact operations <ArrowRight />
									</Button>
								</Link>
								<Link to="/faq">
									<Button
										size="lg"
										variant="outline"
										className="border-sand/30 bg-transparent text-sand hover:bg-sand/10"
									>
										Read FAQs
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