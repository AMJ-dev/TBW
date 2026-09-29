import { Link } from "@/components/router-link";
import { useParams } from "react-router-dom";
import {
	ArrowRight,
	Boxes,
	Check,
	ClipboardList,
	FileCheck2,
	Ship,
	ShieldCheck,
	Truck,
	Users,
	Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicFrame, PublicKicker } from "@/components/public/public-shell";

type AudienceKey = "importers" | "agents" | "shipping-lines" | "transporters";

interface AudienceConfig {
	kicker: string;
	title: string;
	titleAccent: string;
	intro: string;
	stat: [string, string][];
	summary: string;
	benefits: { icon: typeof Users; title: string; detail: string }[];
	features: string[];
	faqs: { q: string; a: string }[];
	ctaPrimary: { label: string; to: string };
	ctaSecondary: { label: string; to: string };
}

const audienceConfig: Record<AudienceKey, AudienceConfig> = {
	importers: {
		kicker: "For importers & traders",
		title: "Clear your goods",
		titleAccent: "closer to home.",
		intro:
			"Save time, save cost, and skip the long haul. TRÏNŪ brings the port closer — so trade in Abuja moves at Abuja's pace.",
		stat: [
			["01", "Flagship facility"],
			["Abuja", "Northern Nigeria"],
			["24/7", "Operational visibility"],
		],
		summary:
			"Importers and consignees use TRÏNŪ to store, coordinate, and clear cargo closer to where it's actually needed — with a single operating record that follows every consignment.",
		benefits: [
			{
				icon: Warehouse,
				title: "Bonded storage closer to your market",
				detail:
					"Store cargo in a secure, controlled facility in Abuja instead of hundreds of kilometres away.",
			},
			{
				icon: ClipboardList,
				title: "Clear visibility of every next step",
				detail:
					"See what's arrived, what's stored, what needs attention, and who owns the next action.",
			},
			{
				icon: FileCheck2,
				title: "Documentation ready for review",
				detail:
					"Keep required records organised and versioned before they're needed for coordination.",
			},
			{
				icon: Truck,
				title: "Slot-based collection",
				detail:
					"Coordinate truck pickups around confirmed cargo readiness to avoid unnecessary waiting.",
			},
		],
		features: [
			"Public tracking by container, BL, or terminal reference",
			"Stakeholder portal with cargo, documents, and financial obligations",
			"Storage visibility with clear deadlines and escalation",
			"Documentation support for invoice, packing list, and bill of lading",
			"Coordinated examination preparation and return-to-storage",
			"Slot-based collection and gate coordination",
		],
		faqs: [
			{
				q: "Do I need to be an existing customer?",
				a: "No. You can request a quote for a new consignment, or request a quote for a service if you're an existing customer with a specific requirement.",
			},
			{
				q: "How do I know what my cargo is doing?",
				a: "Public tracking shows current operational status. Authenticated stakeholder access shows full detail including documents, charges, and coordination records.",
			},
			{
				q: "Does TRÏNŪ clear my cargo?",
				a: "No. TRÏNŪ supports and coordinates the clearance process. Customs examinations, assessments, releases, and other statutory decisions remain solely with the competent authority.",
			},
		],
		ctaPrimary: { label: "Request a quote", to: "/quote" },
		ctaSecondary: { label: "Track cargo", to: "/tracking" },
	},
	agents: {
		kicker: "For forwarders & licensed agents",
		title: "A facility you",
		titleAccent: "plug into.",
		intro:
			"We're a facility you plug into, not a competitor — your clients, your relationships, just faster infrastructure.",
		stat: [
			["Multi", "Client access"],
			["Delegated", "By scope"],
			["Direct", "Coordination"],
		],
		summary:
			"Forwarders and licensed customs agents use TRÏNŪ to represent their clients around a shared operating record, with delegated access scoped per consignment or customer.",
		benefits: [
			{
				icon: Users,
				title: "Multi-client delegated access",
				detail:
					"Manage consignments for multiple clients under delegated authority, scoped by consignment, BL, container, and time period.",
			},
			{
				icon: FileCheck2,
				title: "One place for the documents that matter",
				detail:
					"Invoice, packing list, bill of lading, delivery order, and supporting records — versioned, reviewable, ready for coordination.",
			},
			{
				icon: ClipboardList,
				title: "Readiness before movement",
				detail:
					"Check cargo readiness before you present it for examination or position it for collection.",
			},
			{
				icon: Truck,
				title: "Coordinated gate and examination activity",
				detail:
					"Coordinate examination windows, gate access, and collection slots with clear records for every handoff.",
			},
		],
		features: [
			"Delegated access scoped per client, consignment, or container",
			"Revocable at any time by the delegating importer",
			"Document workspace with review status and missing-record alerts",
			"Coordination records visible to your team and the terminal",
			"Notification preferences for holds, deadlines, and release events",
			"Traceable audit trail for every coordination action",
		],
		faqs: [
			{
				q: "Do I need an existing relationship with TRÏNŪ?",
				a: "No. You can start by requesting a quote for a specific consignment. Delegation from your client is set up during onboarding.",
			},
			{
				q: "How does client delegation work?",
				a: "Your client grants you access scoped to a specific consignment, bill of lading, container, or time period. Access can be revoked at any time by the client.",
			},
			{
				q: "Can I use TRÏNŪ alongside my existing arrangements?",
				a: "Yes. TRÏNŪ adds an option — it doesn't ask you to abandon existing relationships. Positioning is deliberately complementary.",
			},
		],
		ctaPrimary: { label: "Request a quote", to: "/quote" },
		ctaSecondary: { label: "Contact operations", to: "/contact" },
	},
	"shipping-lines": {
		kicker: "For shipping lines & agents",
		title: "Manifest, container, and",
		titleAccent: "equipment visibility.",
		intro:
			"Coordinate arrival, container status, and equipment interchange with an inland bonded facility that shares your operational language.",
		stat: [
			["EDI", "Where applicable"],
			["CSV/XLSX", "Manual fallback"],
			["EIR", "Exchange"],
		],
		summary:
			"Shipping lines and their agents use TRÏNŪ to coordinate discharge, container status, gate-in, gate-out, and empty-return messages — with a clear fallback when API or EDI is unavailable.",
		benefits: [
			{
				icon: Ship,
				title: "Manifest and container status",
				detail:
					"Coordinate manifest references, container status updates, and equipment interchange records around each movement.",
			},
			{
				icon: FileCheck2,
				title: "EIR generation and exchange",
				detail:
					"Generate and exchange Equipment Interchange Receipts where the interface is available.",
			},
			{
				icon: Boxes,
				title: "Outbound coordination messages",
				detail:
					"Record gate-in, gate-out, discharge, and empty-return events where accepted by the receiving system.",
			},
			{
				icon: ClipboardList,
				title: "Per-line configuration",
				detail:
					"Each line has its own transport, format, and schedule configuration — no one-size-fits-all assumptions.",
			},
		],
		features: [
			"Line API integration where available",
			"EDI support (BAPLIE, COPARN, CODECO, COARRI, COPRAR) where applicable",
			"CSV/XLSX and manual fallback for every exchange",
			"Outbound gate-in, gate-out, discharge, and empty-return messages where accepted",
			"EIR generation and exchange",
			"Per-line transport, format, and schedule configuration",
		],
		faqs: [
			{
				q: "What integration options do you support?",
				a: "Line API where available, EDI where applicable, and CSV/XLSX or manual fallback in every case. Interface position is confirmed during Discovery with each line.",
			},
			{
				q: "Do you support equipment interchange?",
				a: "Yes. EIR generation and exchange is supported where accepted by the receiving system.",
			},
			{
				q: "How do you handle container status updates?",
				a: "Container status is recorded as part of the operating record and shared where the interface is available. Manual fallback is always available.",
			},
		],
		ctaPrimary: { label: "Contact operations", to: "/contact" },
		ctaSecondary: { label: "About TRÏNŪ", to: "/about" },
	},
	transporters: {
		kicker: "For transporters & haulage",
		title: "Plan around",
		titleAccent: "confirmed readiness.",
		intro:
			"Plan appointments and gate movements around confirmed cargo readiness — not around a phone call and a hope.",
		stat: [
			["Slot", "Based"],
			["QR", "Gate pass"],
			["24/7", "Coordination"],
		],
		summary:
			"Transporters and haulage fleets use TRÏNŪ to coordinate truck slots, gate movements, and gate passes around a shared record of what's actually ready for collection or discharge.",
		benefits: [
			{
				icon: Truck,
				title: "Slot-based access",
				detail:
					"Book truck slots linked to consignment, container, vehicle, and driver — coordinated around cargo readiness.",
			},
			{
				icon: ClipboardList,
				title: "Readiness before dispatch",
				detail:
					"Confirm cargo readiness before dispatching a truck, avoiding wasted trips and terminal congestion.",
			},
			{
				icon: Check,
				title: "Gate pass issuance",
				detail:
					"Receive a gate pass linked to the specific appointment, truck, driver, and container.",
			},
			{
				icon: ShieldCheck,
				title: "Recorded every time",
				detail:
					"Every gate-in and gate-out is timestamped and attributed. Turnaround is measured and reported.",
			},
		],
		features: [
			"Truck slot booking with configurable windows",
			"Gate pass issuance linked to specific appointments",
			"Plate, driver, and container verification at gate",
			"Turnaround measured gate-in to gate-out",
			"Manual fallback when upstream systems are unavailable",
			"Coordinated arrival around confirmed cargo readiness",
		],
		faqs: [
			{
				q: "How do I book a slot?",
				a: "Stakeholder and gate views provide appointment coordination and readiness checks. Where you're already registered, slot booking is available directly.",
			},
			{
				q: "What if my truck arrives without a slot?",
				a: "Without a confirmed slot, entry is at the gate officer's discretion. Slot-based entry is preferred to keep traffic and turnaround predictable.",
			},
			{
				q: "Do drivers need a phone?",
				a: "A gate pass can be issued to the driver by email, SMS, or WhatsApp where the interface is available. A printed or on-screen QR is accepted at gate.",
			},
		],
		ctaPrimary: { label: "Contact operations", to: "/contact" },
		ctaSecondary: { label: "Book a slot", to: "/portal/bookings" },
	},
};

const audiences = [
	{ key: "importers", label: "Importers & traders", icon: Boxes },
	{ key: "agents", label: "Forwarders & agents", icon: Users },
	{ key: "shipping-lines", label: "Shipping lines", icon: Ship },
	{ key: "transporters", label: "Transporters", icon: Truck },
] as const;

export default function AudiencePage({ audience }: { audience?: AudienceKey }) {
	const params = useParams<{ audience?: string }>();
	const key = (audience ?? (params.audience as AudienceKey) ?? "importers") as AudienceKey;
	const config = audienceConfig[key];

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

					<div className="relative mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
						{/* Audience switcher */}
						<div className="mb-10 flex flex-wrap gap-2">
							{audiences.map((a) => {
								const Icon = a.icon;
								const active = key === a.key;
								return (
									<Link
										key={a.key}
										to={`/for/${a.key}`}
										className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
											active
												? "bg-orange text-white"
												: "bg-sand text-ink-soft ring-1 ring-line hover:bg-sand-2 hover:text-ink"
										}`}
									>
										<Icon className="size-3.5" />
										{a.label}
									</Link>
								);
							})}
						</div>

						<div className="grid gap-12 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
							<div>
								<PublicKicker>{config.kicker}</PublicKicker>
								<h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
									{config.title}{" "}
									<span className="text-orange">{config.titleAccent}</span>
								</h1>
								<p className="mt-5 max-w-2xl leading-7 text-ink-soft">{config.intro}</p>
							</div>

							<div className="grid grid-cols-3 gap-3">
								{config.stat.map(([value, label]) => (
									<div key={label} className="rounded-xl bg-sand p-3 ring-1 ring-line">
										<p className="font-display text-xl font-bold text-ink">{value}</p>
										<p className="mt-1 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-soft">
											{label}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>

				{/* OVERVIEW */}
				<section className="border-b border-line bg-sand">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
							<div>
								<PublicKicker>Overview</PublicKicker>
								<h2 className="mt-3 max-w-md font-display text-3xl font-bold text-ink sm:text-4xl">
									How {config.kicker.toLowerCase()} use TRÏNŪ.
								</h2>
							</div>
							<p className="max-w-2xl text-base leading-7 text-ink-soft">{config.summary}</p>
						</div>
					</div>
				</section>

				{/* BENEFITS */}
				<section className="border-b border-line bg-paper">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="mb-10 border-b border-line pb-6">
							<PublicKicker>What you get</PublicKicker>
							<h2 className="mt-3 max-w-xl font-display text-3xl font-bold text-ink sm:text-4xl">
								Built around your responsibilities.
							</h2>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							{config.benefits.map((b) => {
								const Icon = b.icon;
								return (
									<article key={b.title} className="rounded-2xl bg-sand p-6 ring-1 ring-line">
										<div className="grid size-11 place-items-center rounded-xl bg-orange text-white">
											<Icon className="size-5" />
										</div>
										<h3 className="mt-5 font-display text-lg font-bold text-ink">
											{b.title}
										</h3>
										<p className="mt-2 text-sm leading-6 text-ink-soft">{b.detail}</p>
									</article>
								);
							})}
						</div>
					</div>
				</section>

				{/* FEATURES */}
				<section className="border-b border-line bg-sand">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
							<div>
								<PublicKicker>Features</PublicKicker>
								<h2 className="mt-3 max-w-md font-display text-3xl font-bold text-ink sm:text-4xl">
									Everything in the platform.
								</h2>
								<p className="mt-4 max-w-md leading-7 text-ink-soft">
									These features are part of the TRÏNŪ operating model. Availability
									depends on your access and delegation.
								</p>
							</div>

							<ul className="grid gap-3">
								{config.features.map((f) => (
									<li
										key={f}
										className="flex items-start gap-3 rounded-xl bg-paper p-4 text-[14px] text-ink ring-1 ring-line"
									>
										<span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-orange text-white">
											<Check className="size-3" />
										</span>
										{f}
									</li>
								))}
							</ul>
						</div>
					</div>
				</section>

				{/* FAQ */}
				<section className="bg-paper">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
							<div>
								<PublicKicker>Questions</PublicKicker>
								<h2 className="mt-3 max-w-xl font-display text-3xl font-bold text-ink sm:text-4xl">
									Common questions from {config.kicker.toLowerCase()}.
								</h2>
							</div>
						</div>

						<div className="divide-y divide-line border-y border-line">
							{config.faqs.map((f) => (
								<article key={f.q} className="grid gap-4 py-6 sm:grid-cols-[1fr_1.4fr]">
									<h3 className="font-display text-base font-bold text-ink">{f.q}</h3>
									<p className="text-sm leading-7 text-ink-soft">{f.a}</p>
								</article>
							))}
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
								<p className="font-mono text-[12px] uppercase tracking-[0.18em] text-orange">
									Next step
								</p>
								<h2 className="mt-3 font-display text-3xl font-bold text-sand sm:text-4xl">
									Start with the cargo requirement.
								</h2>
								<p className="mt-4 max-w-xl leading-7 text-sand/75">
									Share your cargo, timing, and service needs. A TRÏNŪ coordinator will
									review the brief and follow up using the contact information provided.
								</p>
							</div>
							<div className="flex flex-wrap gap-3 lg:justify-end">
								<Link to={config.ctaPrimary.to}>
									<Button size="lg" className="bg-orange text-white hover:bg-orange-deep">
										{config.ctaPrimary.label} <ArrowRight />
									</Button>
								</Link>
								<Link to={config.ctaSecondary.to}>
									<Button
										size="lg"
										variant="outline"
										className="border-sand/30 bg-transparent text-sand hover:bg-sand/10"
									>
										{config.ctaSecondary.label}
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