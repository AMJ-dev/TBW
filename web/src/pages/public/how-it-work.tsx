import { Link } from "@/components/router-link";
import {
	ArrowRight,
	ArrowDown,
	BadgeCheck,
	ClipboardCheck,
	FileCheck2,
	FileText,
	Fingerprint,
	KeyRound,
	PackageCheck,
	QrCode,
	Scale,
	ShieldCheck,
	Truck,
	Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PublicFrame, PublicKicker } from "@/components/public/public-shell";

type Metric = {
	label: string;
	value: string;
	accent?: boolean;
};

type Stage = {
	number: string;
	title: string;
	phase: string;
	short: string;
	detail: string;
	action: string;
	actionTitle: string;
	metricTitle: string;
	metricStatus: string;
	metrics?: readonly Metric[];
	footer: { left: string; leftStrong: string; right: string };
	icon: typeof Truck;
	critical?: boolean;
	orange?: boolean;
	manifestHash?: boolean;
	photography?: boolean;
	gatePass?: boolean;
};

type RoleCell =
	| string
	| {
			primary?: boolean;
			text: string;
			sub?: string;
			danger?: boolean;
			orange?: boolean;
	  };

type RoleRow = {
	domain: string;
	trinu: RoleCell;
	agent: RoleCell;
	ncs: RoleCell;
};

const stages: readonly Stage[] = [
	{
		number: "01",
		title: "Coastal Transfer & Gate-In Arrival",
		phase: "Transit Phase",
		short: "Lagos / Onne → Abuja",
		detail:
			"Consignments discharge at Lagos ports (Apapa, Tin Can Island) or Onne Port and transition immediately under bonded customs bond escorts directly to TRÏNŪ's flagship inland terminal in the Idu Industrial District, bypassing coastal demurrage clocks.",
		action:
			"Automated in-motion weighbridge gross axle verification; high-resolution optical inspection of physical shipping line bolts and NCS bonded seals against carrier transfer manifest.",
		actionTitle: "Checkpoint & Verification Action",
		metricTitle: "Live Operational Metric",
		metricStatus: "Synchronized",
		metrics: [
			{ label: "Inbound Corridors", value: "Lagos • Onne" },
			{ label: "Demurrage Pause", value: "Immediate", accent: true },
		],
		footer: {
			left: "Primary Doc:",
			leftStrong: "Transire Bond Manifest",
			right: "NCS Form C18",
		},
		icon: Truck,
	},
	{
		number: "02",
		title: "Manifest Registration & Documentation",
		phase: "Digital Ledger",
		short: "Ingestion & reconciliation",
		detail:
			"Upon gate entry, the unit's bill of lading, manifest serials, and carrier electronic manifests are matched and ingested into the TRÏNŪ Terminal Operating System (TOS) and synchronized with the Nigeria Customs Service B'Odogwu unified customs management system.",
		action:
			"Single Goods Declaration (SGD) reconciliation, Form M validation, and generation of the immutable TRN Unique Consignment Identifier for real-time tracking.",
		actionTitle: "Checkpoint & Verification Action",
		metricTitle: "B'Odogwu Node Status",
		metricStatus: "B'Odogwu++ Live",
		footer: {
			left: "Customer Status:",
			leftStrong: "",
			right: "TRN Reference Issued",
		},
		manifestHash: true,
		icon: FileText,
	},
	{
		number: "03",
		title: "Receiving, Tally & Staging",
		phase: "Physical Operations",
		short: "Grounding & intake tally",
		detail:
			"Reach stackers ground the container into the receiving bay. Yard inspectors unlash, record 360-degree high-resolution condition telemetry, and generate the official intake tally under resident NCS surveillance.",
		action:
			"Issuance of electronic Form TRN-T1 Intake & Tally Certificate with photographic condition evidence logged in the customer dossier.",
		actionTitle: "Checkpoint & Verification Action",
		metricTitle: "Tally Dossier Artifact",
		metricStatus: "Form TRN-T1",
		footer: {
			left: "Discrepancy Protocol:",
			leftStrong: "",
			right: "Discrepancy Note Flagged If ±0.1%",
		},
		photography: true,
		icon: PackageCheck,
	},
	{
		number: "04",
		title: "Secure Bonded Storage & Telemetry",
		phase: "Custody & Security",
		short: "Slotted under perpetual fiscal bond",
		detail:
			"Consignments are slotted into dedicated bonded coordinates across our high-cube container yards, temperature-controlled cold chain lockers, or enclosed high-security vaults. Cargo remains under perpetual fiscal bond.",
		action:
			"Live telemetry active: coordinates locked in TOS, storage accrual transparently calculated, and 24/7 CCTV thermal perimeter logs available for institutional verification.",
		actionTitle: "Checkpoint & Verification Action",
		metricTitle: "Facility Safeguards",
		metricStatus: "Bond Covenants Active",
		metrics: [
			{ label: "CCTV Resolution", value: "4K Thermal • 90-Day" },
			{ label: "Storage Visibility", value: "Live Ledger Portal", accent: true },
		],
		footer: {
			left: "Security Tier:",
			leftStrong: "",
			right: "Class-A Regulated Bond Yard",
		},
		icon: Warehouse,
	},
	{
		number: "05",
		title: "Customs Processing & Joint Examination",
		phase: "Regulatory Decision Point",
		short: "Facility hosts, Customs decides",
		detail:
			"TRÏNŪ coordinates and stages the physical environment: we unstack, position containers at hydraulic ramps, de-stuff when requested, and provide administrative coordination. Nigeria Customs Service Officers conduct the legal physical examination and verify valuation; Customs decides.",
		action:
			"Resident NCS Examination Officers, alongside designated Licensed Customs Clearing Agents and regulatory partner bodies (NAFDAC/SON where applicable), inspect physical goods against the SGD.",
		actionTitle: "Statutory Checkpoint",
		metricTitle: "Customs Decisional Node",
		metricStatus: "NCS Mandate",
		footer: {
			left: "TRÏNŪ Role:",
			leftStrong: "",
			right: "Facility & Coordination Host",
		},
		critical: true,
		icon: Scale,
	},
	{
		number: "06",
		title: "Authorisation & Terminal Release",
		phase: "Compliance Dual-Key",
		short: "Electronic release unlocks",
		detail:
			"Once the statutory Out-of-Charge (OOC) note is electronically issued in the Customs Single Window and TRÏNŪ terminal handling invoices are settled, the system executes an automated cryptographic release.",
		action:
			"Dual-key electronic verification: Customs Single Window release authorization matched against the TRÏNŪ Terminal Clearance Voucher (TCV).",
		actionTitle: "Checkpoint & Verification Action",
		metricTitle: "Dual-Key Validation",
		metricStatus: "Electronic Lock Lifted",
		metrics: [
			{ label: "Key 1: NCS Portal", value: "OOC Authenticated", accent: true },
			{ label: "Key 2: TRÏNŪ Billing", value: "Discharged (Zero Dues)" },
		],
		footer: {
			left: "Authorization Document:",
			leftStrong: "",
			right: "Electronic TCV Voucher",
		},
		icon: FileCheck2,
	},
	{
		number: "07",
		title: "Gate-Out & Final Delivery",
		phase: "Final Mile Handover",
		short: "Container departs custody",
		detail:
			"The designated haulier presents biometric ID and gate clearance QR credentials at the automated terminal exit barrier. The container departs TRÏNŪ custody directly to the importer's Abuja warehouse, commercial store, or northern distribution center.",
		action:
			"Biometric driver verification, physical container out-gate timestamp, and instant electronic POD dispatched to consignee via SMS, WhatsApp, and email.",
		actionTitle: "Checkpoint & Verification Action",
		metricTitle: "Gate-Out Telemetry",
		metricStatus: "Live Exit Portal",
		footer: {
			left: "Post-Release Support:",
			leftStrong: "",
			right: "Direct Abuja Fleet Despatch",
		},
		gatePass: true,
		orange: true,
		icon: Fingerprint,
	},
];

const rolesMatrix: readonly RoleRow[] = [
	{
		domain: "Physical Staging & Cargo Lifting",
		trinu: {
			primary: true,
			text: "Primary Provider",
			sub: "Operates reach stackers, ramps, ground storage, and staging cranes.",
		},
		agent: "Coordinates haulage booking and destination delivery timing.",
		ncs: "Directs examination containment and inspection bays.",
	},
	{
		domain: "Statutory Duty & Valuation",
		trinu: {
			primary: false,
			text: "No legal authority; displays tariff status in customer portal.",
		},
		agent: {
			primary: true,
			text: "SGD & Form M Filing",
			sub: "Prepares declaration, pays assessed duties via commercial banks.",
		},
		ncs: {
			primary: true,
			danger: true,
			text: "Sole Statutory Jurisdiction",
			sub: "Assesses valuation, issues demand notices, and confirms duty liquidation.",
		},
	},
	{
		domain: "Cargo Physical Inspection",
		trinu: {
			primary: false,
			text: "Provides secure bay, de-stuffing crew, safety equipment, and optical tally recording.",
		},
		agent: "Licensed broker represents consignee during joint examination opening.",
		ncs: {
			primary: true,
			orange: true,
			text: "Exclusive Discretion",
			sub: "Conducts physical examination; confirms classification and HS codes.",
		},
	},
	{
		domain: "Custody & Electronic Telemetry",
		trinu: {
			primary: true,
			text: "Primary Custodian",
			sub: "Maintains 24/7 CCTV, TOS tracking, storage safety, and electronic logs.",
		},
		agent: "Receives automated telemetry notifications via web portal and SMS.",
		ncs: "Resident Customs Command audits facility inventory ledger at will.",
	},
	{
		domain: "Final Release Authorization",
		trinu: {
			primary: false,
			text: "Issues Terminal Clearance Voucher (TCV) once OOC verified & handling settled.",
		},
		agent: "Presents signed Delivery Order (DO) and clears terminal dues.",
		ncs: {
			primary: true,
			danger: true,
			text: "Issues Out-of-Charge (OOC)",
			sub: "Sole authority permitting cargo departure from fiscal bonded status.",
		},
	},
];

const faqs = [
	{
		q: "How do I consign cargo directly to TRÏNŪ Abuja?",
		a: 'Instruct your international freight forwarder to state "TRÏNŪ Bonded Terminal, Idu Industrial Estate, Abuja (Port Code: NGABJ)" as the final port of delivery on the Master Bill of Lading (MBL) and Form M.',
	},
	{
		q: "Can my existing clearing agent process my release in Abuja?",
		a: "Yes. Any licensed customs broker registered with the Nigeria Customs Service FCT Command can attend joint inspection and complete entry declarations right inside our facility.",
	},
	{
		q: "Who determines the customs duties and tariff codes?",
		a: "The Nigeria Customs Service possesses sole statutory authority under the NCS Act 2023. TRÏNŪ never levies duty assessments; we host and facilitate the inspection environment.",
	},
	{
		q: "What happens if a container seal is broken in coastal transit?",
		a: "At Stage 1 Gate-In, discrepancies trigger an immediate joint Discrepancy Protocol. Resident Customs Officers and terminal security reseal the unit under an official transire exception log.",
	},
] as const;

function RoleCellContent({ cell }: { cell: RoleCell }) {
	if (typeof cell === "string") {
		return <span className="text-[13px] leading-6 text-ink-soft">{cell}</span>;
	}

	return (
		<>
			<span
				className={cn(
					"block font-semibold",
					cell.danger ? "text-carmine" : cell.orange ? "text-orange" : "text-ink"
				)}
			>
				{cell.text}
			</span>
			{cell.sub && (
				<span className="mt-1 block text-[13px] leading-6 text-ink-soft">
					{cell.sub}
				</span>
			)}
		</>
	);
}

export default function HowItWorksPage() {
	return (
		<PublicFrame>
			<main>
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
								<PublicKicker>How it works</PublicKicker>
								<h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
									Seven stages from{" "}
									<span className="text-orange">port to release.</span>
								</h1>
								<p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
									A transparent, compliant inland cargo transit protocol designed to
									eliminate coastal maritime congestion, mitigate detention tariffs, and
									keep Federal Capital Territory trade moving at Abuja's pace.
								</p>
								<div className="mt-9 flex flex-wrap gap-3">
									<a href="#stages">
										<Button size="lg" className="bg-orange text-white hover:bg-orange-deep">
											Explore 7-stage protocol <ArrowDown />
										</Button>
									</a>
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
							</div>
							<div className="grid grid-cols-3 gap-3">
								{[
									["48–72", "Hours transfer"],
									["07", "Lifecycle stages"],
									["NCS", "Act 2023"],
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
				</section>

				<section className="bg-brown py-5">
					<div className="mx-auto max-w-7xl px-5 lg:px-8">
						<div className="flex flex-wrap items-start gap-3">
							<ShieldCheck className="mt-0.5 size-4 shrink-0 text-orange" />
							<p className="max-w-4xl text-[12px] leading-6 text-sand/85">
								<span className="font-semibold text-sand">STATUTORY NOTICE:</span> TRÏNŪ
								Bonded Terminal operates under licensed statutory customs custody. The
								terminal facilitates, monitors, and coordinates physical staging; Nigeria
								Customs Service (NCS) alone decides duty classification, inspection
								findings, and official release.
							</p>
							<span className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.14em] text-sand/50 lg:inline">
								Command: FCT Area Command
							</span>
						</div>
					</div>
				</section>

				<section id="stages" className="scroll-mt-24 bg-sand">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="mb-12 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
							<div>
								<PublicKicker>Sequential protocol</PublicKicker>
								<h2 className="mt-3 max-w-xl font-display text-3xl font-bold text-ink sm:text-4xl">
									The end-to-end inland lifecycle.
								</h2>
							</div>
							<p className="max-w-md text-sm leading-6 text-ink-soft">
								From the instant maritime seals are cross-verified at coastal off-dock
								berths to the final physical gate-out in Abuja, every container follows a
								rigid, audited custody cycle.
							</p>
						</div>

						<div className="space-y-4">
							{stages.map((stage) => {
								const Icon = stage.icon;
								const isCritical = stage.critical;
								const isOrange = stage.orange;

								return (
									<article
										key={stage.number}
										className={cn(
											"group relative overflow-hidden rounded-2xl bg-paper p-6 ring-1 transition-all duration-300 hover:shadow-lg sm:p-8",
											isCritical
												? "ring-brown/30"
												: "ring-line hover:ring-orange/40"
										)}
									>
										<div
											aria-hidden="true"
											className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-orange/10 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
										/>

										<div className="relative grid gap-6 lg:grid-cols-12 lg:gap-8">
											<div className="lg:col-span-1">
												<div
													className={cn(
														"grid size-12 place-items-center rounded-xl font-display text-sm font-bold",
														isCritical && !isOrange
															? "bg-brown text-orange"
															: "bg-orange text-white"
													)}
												>
													{stage.number}
												</div>
											</div>

											<div className="lg:col-span-6">
												<div className="flex flex-wrap items-center gap-2">
													<span className="inline-flex items-center gap-1.5 rounded-full bg-orange/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-orange ring-1 ring-orange/25">
														{stage.phase}
													</span>
													<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
														• Transit escort active
													</span>
												</div>
												<h3 className="mt-3 flex items-start gap-3 font-display text-xl font-bold text-ink sm:text-2xl">
													<Icon className="mt-1 size-5 shrink-0 text-orange" />
													{stage.title}
												</h3>
												<p className="mt-3 leading-7 text-ink-soft">
													{stage.detail}
												</p>

												<div className="mt-5 flex items-start gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
													<ClipboardCheck className="mt-0.5 size-4 shrink-0 text-orange" />
													<div>
														<p className="font-display text-sm font-bold text-ink">
															{stage.actionTitle}
														</p>
														<p className="mt-1 text-[13px] leading-6 text-ink-soft">
															{stage.action}
														</p>
													</div>
												</div>
											</div>

											<div className="flex flex-col gap-3 lg:col-span-5">
												<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
													<div className="flex items-center justify-between">
														<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
															{stage.metricTitle}
														</p>
														<span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-orange">
															<span className="size-1.5 rounded-full bg-orange" />
															{stage.metricStatus}
														</span>
													</div>
													{stage.metrics && (
														<div className="mt-3 grid grid-cols-2 gap-2">
															{stage.metrics.map((m) => (
																<div
																	key={m.label}
																	className="rounded-lg bg-paper p-3 ring-1 ring-line"
																>
																	<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
																		{m.label}
																	</p>
																	<p
																		className={cn(
																			"mt-1 font-display text-sm font-bold",
																			m.accent ? "text-orange" : "text-ink"
																		)}
																	>
																		{m.value}
																	</p>
																</div>
															))}
														</div>
													)}
												</div>

												{stage.manifestHash && (
													<div className="rounded-xl bg-brown p-4 font-mono text-[10px] text-sand ring-1 ring-brown">
														<div className="flex justify-between text-sand/60">
															<span>TRN-MANIFEST-RECORD</span>
															<span className="text-orange">MATCH_CONFIRMED</span>
														</div>
														<p className="mt-1 truncate text-[11px] text-sand">
															SHA-256: e8b94f1c9842a17688cb998f420138d58a
														</p>
														<div className="mt-1 flex justify-between text-[10px] text-sand/60">
															<span>Declaration: SGD C-88219</span>
															<span>Command: FCT-01</span>
														</div>
													</div>
												)}

												{stage.photography && (
													<div className="flex items-center gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
														<BadgeCheck className="size-6 shrink-0 text-orange" />
														<div>
															<p className="font-display text-sm font-bold text-ink">
																6-Angle Seal & Shell Photography
															</p>
															<p className="mt-0.5 text-[12px] leading-5 text-ink-soft">
																Indexed to Bill of Lading with zero discrepancies
															</p>
														</div>
													</div>
												)}

												{stage.gatePass && (
													<div className="flex items-center gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
														<QrCode className="size-6 shrink-0 text-orange" />
														<div>
															<p className="font-display text-sm font-bold text-ink">
																Automated Gate Pass Issued
															</p>
															<p className="mt-0.5 text-[12px] leading-5 text-ink-soft">
																Instant delivery timestamp • Custody concluded
															</p>
														</div>
													</div>
												)}

												<div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
													<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
														{stage.footer.left}{" "}
														{stage.footer.leftStrong && (
															<strong className="text-ink">
																{stage.footer.leftStrong}
															</strong>
														)}
													</span>
													<span className="font-mono text-[10px] uppercase tracking-[0.12em] font-bold text-orange">
														{stage.footer.right}
													</span>
												</div>
											</div>
										</div>
									</article>
								);
							})}
						</div>
					</div>
				</section>

				<section className="border-y border-line bg-paper">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="mb-10 max-w-3xl">
							<PublicKicker>Institutional governance</PublicKicker>
							<h2 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
								Roles & responsibilities matrix.
							</h2>
							<p className="mt-4 leading-7 text-ink-soft">
								Operational success in bonded logistics relies on strict procedural
								separation between facility coordination, commercial agency, and
								sovereign Customs authority.
							</p>
						</div>

						<div className="overflow-x-auto rounded-2xl bg-sand ring-1 ring-line">
							<table className="w-full min-w-[880px] text-left text-sm">
								<thead>
									<tr className="bg-brown font-mono text-[10px] uppercase tracking-[0.14em] text-sand">
										<th className="px-4 py-4 font-medium">Operational domain</th>
										<th className="px-4 py-4 font-medium">TRÏNŪ Bonded Terminal</th>
										<th className="px-4 py-4 font-medium">Licensed agent / importer</th>
										<th className="px-4 py-4 font-medium text-orange">
											Nigeria Customs Service
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-line">
									{rolesMatrix.map((row) => (
										<tr key={row.domain} className="transition-colors hover:bg-paper/60">
											<td className="px-4 py-4 font-display font-bold text-ink">
												{row.domain}
											</td>
											<td className="px-4 py-4">
												<RoleCellContent cell={row.trinu} />
											</td>
											<td className="px-4 py-4">
												<RoleCellContent cell={row.agent} />
											</td>
											<td className="px-4 py-4">
												<RoleCellContent cell={row.ncs} />
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className="mt-6 grid gap-4 md:grid-cols-3">
							{[
								{
									icon: ShieldCheck,
									title: "100% Audit Readiness",
									sub: "Every gate movement, container movement, and inspection action is timestamped in accordance with statutory requirements.",
								},
								{
									icon: Truck,
									title: "Zero Port Demurrage",
									sub: "Transferring to TRÏNŪ Abuja pauses maritime port storage clocks immediately upon bonded coastal discharge.",
								},
								{
									icon: KeyRound,
									title: "Facility Security Bond",
									sub: "Our terminal maintains an institutional statutory bond covenant lodged with the Nigeria Customs Service.",
								},
							].map((t) => {
								const Icon = t.icon;
								return (
									<div
										key={t.title}
										className="rounded-2xl bg-sand p-5 ring-1 ring-line"
									>
										<Icon className="size-6 text-orange" />
										<p className="mt-3 font-display text-base font-bold text-ink">
											{t.title}
										</p>
										<p className="mt-2 text-[13px] leading-6 text-ink-soft">{t.sub}</p>
									</div>
								);
							})}
						</div>
					</div>
				</section>

				<section className="bg-sand">
					<div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
						<div className="mb-10 max-w-2xl">
							<PublicKicker>Answers for shippers</PublicKicker>
							<h2 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
								Frequently asked regulatory questions.
							</h2>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							{faqs.map((faq) => (
								<article
									key={faq.q}
									className="rounded-2xl bg-paper p-6 ring-1 ring-line"
								>
									<h3 className="font-display text-base font-bold text-ink">
										{faq.q}
									</h3>
									<p className="mt-3 text-sm leading-7 text-ink-soft">{faq.a}</p>
								</article>
							))}
						</div>
					</div>
				</section>

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
									Initiate bonded transfer
								</p>
								<h2 className="mt-3 font-display text-3xl font-bold text-sand sm:text-4xl">
									Have cargo en route to Nigerian waters?
								</h2>
								<p className="mt-4 max-w-xl leading-7 text-sand/75">
									Divert your consignments directly to our Abuja ICD before vessel
									arrival. Stop coastal shipping line demurrage, secure your audit trail,
									and inspect your goods in the Federal Capital Territory.
								</p>
							</div>
							<div className="flex flex-wrap gap-3 lg:justify-end">
								<Link to="/quote">
									<Button size="lg" className="bg-orange text-white hover:bg-orange-deep">
										Speak with clearance coordination <ArrowRight />
									</Button>
								</Link>
								<Link to="/services">
									<Button
										size="lg"
										variant="outline"
										className="border-sand/30 bg-transparent text-sand hover:bg-sand/10"
									>
										Request tariff schedule
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