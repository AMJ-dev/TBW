import { Link } from "@/components/router-link";
import {
	ArrowRight,
	ClipboardCheck,
	FileCheck2,
	PackageCheck,
	Search,
	ShieldCheck,
	Truck,
	Warehouse,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicFrame, PublicStatus } from "@/components/public/public-shell";

const audiences = [
	[
		"Importers & Traders",
		"Clear your goods closer to home. Save time, save cost, and skip the long haul.",
	],
	[
		"Forwarders & Agents",
		"We're a facility you plug into, not a competitor — your clients, your relationships, just faster infrastructure.",
	],
	[
		"Regulators & Government",
		"Fully compliant, fully transparent, built to support existing customs processes.",
	],
	[
		"Transporters",
		"Plan appointments and gate movements around confirmed readiness.",
	],
] as const;

const cargoCategories = [
	"General",
	"Containerised",
	"Agricultural",
	"Industrial",
	"Automotive",
	"Project cargo",
] as const;

const capabilities = [
	{
		title: "Bonded Warehousing",
		detail: "Controlled storage with clear position, dwell, and occupancy records.",
		icon: Warehouse,
	},
	{
		title: "Cargo Handling",
		detail: "Coordinated receiving, positioning, and authorised movement.",
		icon: PackageCheck,
	},
	{
		title: "Customs Support",
		detail: "Facilities and coordination for customs examination.",
		icon: ShieldCheck,
	},
	{
		title: "Container Handling",
		detail: "Stuffing, destuffing, and equipment interchange records.",
		icon: Truck,
	},
	{
		title: "Storage & Logistics",
		detail: "Bonded storage, staging, and release-ready handling.",
		icon: FileCheck2,
	},
	{
		title: "Documentation Support",
		detail: "Traceable records for shipping and terminal movements.",
		icon: ClipboardCheck,
	},
] as const;

const journey = [
	["Arrival", "Gate entry recorded with condition and time."],
	["Documentation", "Required records registered and versioned."],
	["Receiving", "Tally, weight, and seal verified against manifest."],
	["Secure Storage", "Positioned in bonded warehouse or yard."],
	["Customs Processing", "Facilities and coordination provided."],
	["Release", "Authorised movement and obligations confirmed."],
	["Delivery", "Gate-out recorded and consignment closed."],
] as const;

const notices = [
	{
		date: "09 Sep 2026",
		category: "Examination",
		title: "Afternoon examination window confirmed",
	},
	{
		date: "08 Sep 2026",
		category: "Gate",
		title: "Managed morning queue at Gate 3",
	},
	{
		date: "05 Sep 2026",
		category: "Documents",
		title: "Supporting record checklist updated",
	},
] as const;

export default function HomePage() {
	const [trackRef, setTrackRef] = useState("TRIU1234567");

	const handleTrack = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!trackRef.trim()) {
			toast.error("Enter a container, BL, or terminal reference.");
			return;
		}
		toast.success(`Looking up ${trackRef.trim().toUpperCase()}…`);
	};

	return (
		<PublicFrame>
			<main>
				{/* HERO */}
				<section className="relative overflow-hidden border-b border-line bg-paper">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -right-36 -top-32 size-[540px] rounded-full bg-orange/20 blur-3xl"
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -left-40 top-1/3 size-[460px] rounded-full bg-carmine/15 blur-3xl"
					/>
					<div className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-16 sm:pt-24 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:pb-24">
						<div className="relative z-10 max-w-3xl">
							<p className="mb-5 inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-orange ring-1 ring-orange/25">
								<span className="size-1.5 rounded-full bg-orange" />
								Abuja · Flagship Facility · Live operations
							</p>
							<h1 className="max-w-3xl font-display text-5xl font-bold leading-[0.98] text-ink sm:text-6xl lg:text-7xl">
								TRÏNŪ brings the port closer —{" "}
								<span className="text-orange">so trade in Abuja moves at Abuja's pace.</span>
							</h1>
							<p className="mt-6 max-w-xl text-base leading-7 text-ink-soft sm:text-lg">
								Clear your goods closer to home. Save time, save cost, and skip the trip to 
								Lagos, Kano and Port Harcourt - with customs coordination built in.
							</p>
							<div className="mt-8 flex flex-wrap gap-3">
								<Link to="/tracking">
									<Button size="lg" className="bg-orange text-white hover:bg-orange-deep">
										Track cargo <ArrowRight />
									</Button>
								</Link>
								<Link to="/quote">
									<Button
										size="lg"
										variant="outline"
										className="border-line bg-paper text-ink hover:bg-sand"
									>
										Request a quote
									</Button>
								</Link>
							</div>
							<div className="mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-line pt-5">
								<div>
									<p className="font-display text-2xl font-bold text-ink">06</p>
									<p className="mt-1 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-soft">
										Terminal capabilities
									</p>
								</div>
								<div>
									<p className="font-display text-2xl font-bold text-ink">07</p>
									<p className="mt-1 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-soft">
										Lifecycle stages
									</p>
								</div>
								<div>
									<p className="font-display text-2xl font-bold text-ink">24/7</p>
									<p className="mt-1 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-soft">
										Operational visibility
									</p>
								</div>
							</div>
						</div>

						{/* Live cargo card — Bistre Brown depth */}
						<div className="relative min-h-[360px] overflow-hidden rounded-2xl bg-brown p-5 text-sand shadow-2xl ring-1 ring-brown lg:mt-8">
							<div
								className="absolute inset-0 opacity-20"
								style={{
									backgroundImage:
										"linear-gradient(to right, var(--color-sand) 1px, transparent 1px), linear-gradient(to bottom, var(--color-sand) 1px, transparent 1px)",
									backgroundSize: "34px 34px",
								}}
							/>
							<div className="relative flex items-center justify-between">
								<div>
									<p className="font-mono  font-bold text-[12px] uppercase tracking-[0.18em] text-sand/60">
										Public cargo view
									</p>
									<p className="mt-1 font-display text-xl font-bold text-sand">
										TRN-IMP-002481
									</p>
								</div>
								<PublicStatus label="Stored" tone="success" />
							</div>
							<div className="relative mt-8 rounded-xl bg-sand/5 p-4 ring-1 ring-sand/15">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-mono text-[9px] uppercase tracking-[0.16em] text-sand/60">
											Container
										</p>
										<p className="font-mono text-sm text-sand">TRIU1234567</p>
									</div>
									<div className="text-right">
										<p className="font-mono text-[9px] uppercase tracking-[0.16em] text-sand/60">
											Updated
										</p>
										<p className="font-mono text-sm text-sand">12 seconds ago</p>
									</div>
								</div>
								<div className="mt-6 flex items-center gap-2">
									<span className="size-3 rounded-full bg-orange ring-4 ring-orange/25" />
									<span className="h-px flex-1 bg-orange/60" />
									<span className="size-3 rounded-full bg-orange ring-4 ring-orange/25" />
									<span className="h-px flex-1 bg-orange/60" />
									<span className="size-4 rounded-full bg-orange ring-4 ring-orange/25" />
									<span className="h-px flex-1 bg-sand/15" />
									<span className="size-3 rounded-full border border-sand/40" />
									<span className="h-px flex-1 bg-sand/15" />
								</div>
								<div className="mt-3 flex justify-between font-mono text-[9px] text-sand/55">
									<span>Arrived</span>
									<span>Received</span>
									<span className="text-orange">Stored</span>
									<span>Release</span>
									<span>Gate out</span>
								</div>
							</div>
							<Link
								to="/tracking"
								className="relative mt-5 flex items-center justify-between rounded-lg bg-orange px-4 py-3 text-[12px] font-semibold text-white hover:bg-orange-deep"
							>
								<span>View cargo status</span>
								<ArrowRight className="size-4" />
							</Link>
						</div>
					</div>
				</section>

				{/* TRACK FORM */}
				<section className="border-b border-line bg-sand">
					<div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
						<form
							onSubmit={handleTrack}
							className="grid gap-4 rounded-2xl bg-paper p-5 ring-1 ring-line sm:grid-cols-[1fr_auto] sm:items-end sm:p-6"
						>
							<div>
								<label
									htmlFor="home-track-ref"
									className="font-mono font-bold text-[15px] uppercase tracking-[0.14em] text-ink-soft"
								>
									Track a shipment
								</label>
								<div className="relative mt-2">
									<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
									<Input
										id="home-track-ref"
										value={trackRef}
										onChange={(event) => setTrackRef(event.target.value)}
										placeholder="Container, BL, or terminal reference"
										className="h-12 border-line bg-paper pl-10 font-mono text-sm text-ink"
									/>
								</div>
							</div>
							<Link to="/tracking">
								<Button className="h-12 bg-orange text-white hover:bg-orange-deep">
									Track cargo <ArrowRight />
								</Button>
							</Link>
						</form>
					</div>
				</section>

				{/* NOTICES */}
				<section className="border-b border-line bg-paper">
					<div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
						<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
							<div>
								<p className="font-mono text-[15px] font-bold uppercase tracking-[0.18em] text-orange">
									Latest notices
								</p>
								<h2 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">
									Operational information worth planning around.
								</h2>
							</div>
							<Link
								to="/news"
								className="inline-flex items-center gap-2 text-sm font-semibold text-orange"
							>
								All notices <ArrowRight className="size-4" />
							</Link>
						</div>
						<div className="grid gap-3 md:grid-cols-3">
							{notices.map((notice) => (
								<article
									key={notice.title}
									className="rounded-xl bg-sand p-5 ring-1 ring-line transition-colors hover:bg-sand-2"
								>
									<div className="flex items-center justify-between">
										<span className="font-mono text-[15px] font-bold uppercase tracking-[0.14em] text-orange">
											{notice.category}
										</span>
										<span className="font-mono text-[15px] text-ink-soft">{notice.date}</span>
									</div>
									<h3 className="mt-4 font-display text-base font-bold text-ink">
										{notice.title}
									</h3>
									<Link
										to="/news"
										className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-orange"
									>
										Read notice <ArrowRight className="size-3.5" />
									</Link>
								</article>
							))}
						</div>
					</div>
				</section>

				{/* CAPABILITIES + CARGO CATEGORIES */}
				<section className="border-b border-line bg-sand">
					<div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
						<div className="mb-12 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
							<div>
								<p className="font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-orange">
									What we do
								</p>
								<h2 className="mt-3 max-w-xl font-display text-3xl font-bold text-ink sm:text-4xl">
									Built for the way Abuja moves goods.
								</h2>
							</div>
							<Link
								to="/services"
								className="inline-flex items-center gap-2 text-sm font-semibold text-orange"
							>
								See all services <ArrowRight className="size-4" />
							</Link>
						</div>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{capabilities.map(({ title, detail, icon: Icon }, index) => (
								<article
									key={title}
									className="group relative overflow-hidden rounded-2xl bg-paper p-6 ring-1 ring-line transition-all duration-300 hover:-translate-y-1 hover:ring-orange/40 hover:shadow-lg"
								>
									<div className="flex items-start justify-between gap-4">
										<div className="grid size-11 place-items-center rounded-xl bg-orange text-white transition-colors duration-300 group-hover:bg-orange-deep">
											<Icon className="size-5" />
										</div>
										<span className="font-mono text-[12px] uppercase tracking-[0.16em] text-ink-soft">
											0{index + 1}
										</span>
									</div>
									<h3 className="mt-6 font-display text-lg font-bold text-ink">{title}</h3>
									<p className="mt-3 text-[12px] leading-6 text-ink-soft">{detail}</p>
								</article>
							))}
						</div>

						{/* Cargo categories */}
						<div className="mt-16 rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
							<div className="flex flex-wrap items-end justify-between gap-4">
								<div>
									<p className="font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-orange">
										Cargo we handle
									</p>
									<h3 className="mt-2 font-display text-xl font-bold text-ink sm:text-2xl">
										Categories served at the Abuja flagship facility.
									</h3>
								</div>
								<p className="max-w-md text-[15px] leading-5 text-ink-soft">
									Subject to licence conditions and equipment availability. Contact
									operations for specialised or project cargo.
								</p>
							</div>
							<div className="mt-6 flex flex-wrap gap-2">
								{cargoCategories.map((cat) => (
									<span
										key={cat}
										className="inline-flex items-center rounded-full bg-sand px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink ring-1 ring-line"
									>
										{cat}
									</span>
								))}
							</div>
						</div>
					</div>
				</section>

				{/* JOURNEY */}
				<section className="bg-paper">
					<div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
						<div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
							<div className="lg:sticky lg:top-24">
								<p className="font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-orange">
									How it works
								</p>
								<h2 className="mt-3 max-w-md font-display text-3xl font-bold text-ink sm:text-4xl">
									Seven stages from arrival to delivery.
								</h2>
								<p className="mt-5 max-w-md leading-7 text-ink-soft">
									A single operating record follows every consignment through the terminal,
									so operations, agents, and finance work from the same verified state.
								</p>
								<Link
									to="/tracking"
									className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-orange"
								>
									See a live record <ArrowRight className="size-4" />
								</Link>
							</div>
							<ol className="relative space-y-3 border-l border-line pl-6">
								{journey.map(([label, detail], index) => (
									<li key={label} className="relative">
										<span className="absolute -left-[31px] top-5 grid size-3 place-items-center rounded-full border-2 border-orange bg-paper" />
										<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
											<div className="flex items-center gap-3">
												<span className="font-mono text-[11px] font-semibold text-orange">
													{String(index + 1).padStart(2, "0")}
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

				{/* CEO QUOTE — Slate formal band */}
				<section className="relative overflow-hidden border-y border-slate bg-slate">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -right-40 top-1/2 size-[420px] -translate-y-1/2 rounded-full bg-orange/20 blur-3xl"
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -left-32 bottom-0 size-[320px] rounded-full bg-carmine/25 blur-3xl"
					/>
					<div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
						<div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
							<div>
								<p className="font-mono text-[15px] font-bold uppercase tracking-[0.18em] text-orange">
									From our CEO
								</p>
								<div className="mt-6 flex items-center gap-4">
									<div className="grid size-14 place-items-center rounded-full bg-orange font-display text-lg font-bold text-white">
										BA
									</div>
									<div>
										<p className="font-display text-sm font-bold text-sand">
											Bilal Aijjola
										</p>
										<p className="font-mono text-[12px] uppercase tracking-[0.14em] text-sand/60">
											Chief Executive Officer / Managing Director, TRÏNŪ Bonded Warehouse
										</p>
									</div>
								</div>
							</div>
							<blockquote className="font-display text-2xl font-bold leading-snug tracking-tight text-sand sm:text-3xl lg:text-4xl">
								<span className="text-orange">"</span>
								TRÏNŪ isn't just another warehouse, it's the missing link between Nigeria's
								ports and the businesses that keep Abuja and the north moving.
								<span className="text-orange">"</span>
							</blockquote>
						</div>
					</div>
				</section>

				{/* AUDIENCES — Bistre Brown depth band */}
				<section className="bg-brown">
					<div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
						<div className="mb-12 max-w-2xl">
							<p className="font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-orange">
								Built for the people around cargo
							</p>
							<h2 className="mt-3 font-display text-3xl font-bold text-sand sm:text-4xl">
								One dependable picture, different responsibilities.
							</h2>
						</div>
						<div className="grid gap-px overflow-hidden rounded-2xl bg-sand/10 sm:grid-cols-2 lg:grid-cols-4">
							{audiences.map(([title, detail], index) => (
								<article key={title} className="relative bg-brown p-6">
									<div className="flex items-center justify-between">
										<ShieldCheck className="size-5 text-orange" />
										<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand/50">
											0{index + 1}
										</span>
									</div>
									<h3 className="mt-8 font-display text-lg font-bold text-sand">{title}</h3>
									<p className="mt-3 text-sm leading-6 text-sand/70">{detail}</p>
								</article>
							))}
						</div>
					</div>
				</section>

				{/* CTA — Slate formal full-bleed band */}
				<section className="relative overflow-hidden bg-slate">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -right-32 -top-32 size-[420px] rounded-full bg-orange/25 blur-3xl"
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -left-24 bottom-0 size-[320px] rounded-full bg-carmine/25 blur-3xl"
					/>
					<div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
						<div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
							<div>
								<p className="font-mono text-[12px] uppercase tracking-[0.18em] text-orange">
									Contact operations
								</p>
								<h2 className="mt-3 font-display text-3xl font-bold text-sand sm:text-4xl">
									Talk to the terminal team.
								</h2>
								<p className="mt-4 max-w-xl leading-7 text-sand/75">
									Send an enquiry for a general question, or use the quote form for cargo
									planning and service needs.
								</p>
							</div>
							<div className="flex flex-wrap gap-3 lg:justify-end">
								<Link to="/contact">
									<Button size="lg" className="bg-orange text-white hover:bg-orange-deep">
										Contact operations <ArrowRight />
									</Button>
								</Link>
								<Link to="/quote">
									<Button
										size="lg"
										variant="outline"
										className="border-sand/30 bg-transparent text-sand hover:bg-sand/10"
									>
										Request a quote
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