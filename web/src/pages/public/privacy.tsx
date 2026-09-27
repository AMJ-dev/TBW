import { type ReactNode } from "react";
import { Link } from "@/components/router-link";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicFrame, PublicKicker } from "@/components/public/public-shell";

const sections = [
	{
		id: "who-we-are",
		title: "1. Who we are",
		body: [
			"This privacy notice explains how TRÏNŪ Bonded Warehouse (\"TRÏNŪ\", \"we\", \"us\", \"our\") collects, uses, and protects personal data when you use our public website, track cargo, request a quote, or use the stakeholder portal.",
			"TRÏNŪ operates a bonded warehouse and terminal coordination facility at the Abuja Flagship Facility, Nigeria. We are a data controller for the personal data described in this notice. Where we handle operational records on behalf of our customers, we act as a data processor.",
		],
	},
	{
		id: "scope",
		title: "2. Scope of this notice",
		body: [
			"This notice applies to personal data we process through:",
			"the public TRÏNŪ website and public cargo tracking;",
			"enquiry, quotation, and onboarding forms;",
			"the stakeholder portal and related authenticated services;",
			"terminal coordination records where personal data is included (for example, driver details and gate pass records).",
			"It does not apply to third-party sites we link to, or to processing carried out independently by regulators, Customs, shipping lines, or other agencies.",
		],
	},
	{
		id: "lawful-basis",
		title: "3. Lawful basis for processing",
		body: [
			"We process personal data under the Nigeria Data Protection Act 2023 and applicable guidance from the Nigeria Data Protection Commission. Depending on the situation, we rely on the following lawful bases:",
			"Contract: to provide services you or your organisation have requested (for example, cargo handling, quotes, gate coordination).",
			"Legitimate interests: to operate and secure the terminal, prevent fraud, and improve our services — balanced against your rights.",
			"Legal obligation: to comply with statutory and regulatory duties, including coordination with competent authorities where required.",
			"Consent: where you have opted in — for example, subscribing to status notifications. You can withdraw consent at any time.",
		],
	},
	{
		id: "what-we-collect",
		title: "4. What we collect",
		body: [
			"Depending on how you interact with TRÏNŪ, we may collect:",
			"Contact data — name, company, email address, phone number.",
			"Organisation data — company name, contact person, and (where applicable) RC number, TIN, and licence references you provide.",
			"Cargo-related data — terminal references, container numbers, bills of lading, and coordination notes.",
			"Booking and gate data — driver names, phone numbers, truck plate numbers, and appointment records.",
			"Payment and receipt data — receipt references, payment channel, and reconciliation status. We do not process card numbers on our systems.",
			"Technical data — IP address, device information, and usage logs when you use the website or portal.",
			"Communications data — messages you send to our enquiry desk or via the portal.",
			"We do not intentionally collect special category data (for example, health, biometric, or religious data) unless a specific operational need has been identified, assessed, and disclosed to you separately.",
		],
	},
	{
		id: "how-we-use",
		title: "5. How we use your data",
		body: [
			"We use personal data to:",
			"respond to enquiries and prepare quotes;",
			"operate and secure the terminal, including coordinating cargo movements and gate access;",
			"issue documents, receipts, and gate passes;",
			"support your stakeholder portal account and delegation settings;",
			"send transactional notifications related to cargo status, holds, storage deadlines, and releases;",
			"meet legal, regulatory, and audit obligations;",
			"protect against fraud, misuse, and security incidents;",
			"improve our services and understand how they are used.",
			"We do not sell personal data. We do not use personal data for automated decision-making that produces legal or similarly significant effects.",
		],
	},
	{
		id: "sharing",
		title: "6. Who we share with",
		body: [
			"We may share personal data with:",
			"the organisations you are associated with (for example, your employer, your licensed agent, or your consignee), where this is part of the operating record;",
			"competent authorities, including Customs, where statutory coordination requires it. We do not make or alter statutory decisions; we record and coordinate.",
			"service providers who support our operations (hosting, email, SMS, payment gateway, monitoring) under appropriate processor agreements;",
			"our professional advisers (auditors, lawyers) where required;",
			"any party where disclosure is required by law or necessary to protect rights, safety, or property.",
			"We require third parties to protect personal data to standards that meet or exceed the Nigeria Data Protection Act 2023.",
		],
	},
	{
		id: "transfers",
		title: "7. Where your data is held",
		body: [
			"Primary personal and operational records are held within Nigeria. Where we need to process data outside Nigeria, we apply the safeguards required by the Nigeria Data Protection Act 2023 — for example, transfer assessments, contractual safeguards, and appropriate technical and organisational measures.",
		],
	},
	{
		id: "retention",
		title: "8. How long we keep it",
		body: [
			"We keep personal data only for as long as needed for the purposes described in this notice, or for a longer period where required by law. Retention periods depend on the type of record — for example:",
			"enquiries and quotes are kept while we assess the request and for a reasonable follow-up period;",
			"cargo and gate records are kept for the operational, tax, and audit retention period that applies to bonded terminal activity;",
			"user accounts are kept while they are active, and for a short period after closure to resolve outstanding matters;",
			"records that are subject to a legal hold are retained until the hold is lifted.",
			"When retention ends, we securely delete or anonymise the data using technical controls.",
		],
	},
	{
		id: "your-rights",
		title: "9. Your rights",
		body: [
			"Under the Nigeria Data Protection Act 2023, you have the right to:",
			"access the personal data we hold about you;",
			"ask us to correct inaccurate or incomplete data;",
			"ask us to delete personal data where there is no lawful reason for us to keep it;",
			"ask us to restrict processing in certain circumstances;",
			"object to processing based on legitimate interests;",
			"withdraw consent where processing is based on consent;",
			"request portability of data you provided to us, where applicable.",
			"To exercise any of these rights, contact our data protection contact using the details below. We will respond within the timeframe required by law. We may need to verify your identity before acting on your request.",
		],
	},
	{
		id: "security",
		title: "10. How we protect your data",
		body: [
			"We use a combination of technical and organisational measures to protect personal data, including:",
			"encryption in transit and at rest for systems that handle personal data;",
			"role-based access controls and the principle of least privilege;",
			"multi-factor authentication for administrative access;",
			"logging of access and processing events;",
			"regular review of who has access and why;",
			"vendor and processor due diligence.",
			"If you become aware of a possible security issue, please contact us using the details below.",
		],
	},
	{
		id: "cookies",
		title: "11. Cookies and similar technologies",
		body: [
			"Our public website uses a small number of essential cookies and local storage to operate safely and remember your preferences. Where we introduce analytics or non-essential cookies, we will publish a separate cookie notice and request your consent where required.",
			"You can control cookies through your browser settings. Turning off essential cookies may affect how parts of the site work.",
		],
	},
	{
		id: "children",
		title: "12. Children",
		body: [
			"TRÏNŪ services are intended for business use. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us so we can address it.",
		],
	},
	{
		id: "changes",
		title: "13. Changes to this notice",
		body: [
			"We may update this notice from time to time to reflect changes in our practices or the law. When we make material changes, we will publish the updated notice with a new effective date and, where required, provide additional notice through the portal or by email.",
			"This notice is versioned. The current version is shown at the top of this page.",
		],
	},
	{
		id: "contact",
		title: "14. Contact us",
		body: [
			"If you have questions about this notice or want to exercise your rights, contact us using the details below. If you are not satisfied with our response, you have the right to lodge a complaint with the Nigeria Data Protection Commission.",
		],
	},
] as const;

export function PrivacyPage() {
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
								<PublicKicker>Legal</PublicKicker>
								<h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
									Privacy <span className="text-orange">notice</span>
								</h1>
								<p className="mt-5 max-w-2xl leading-7 text-ink-soft">
									How TRÏNŪ Bonded Warehouse collects, uses, and protects personal data
									across our public website, public tracking, and stakeholder portal.
								</p>
							</div>
							<div className="rounded-2xl bg-sand p-5 ring-1 ring-line">
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
									Document control
								</p>
								<dl className="mt-3 space-y-2.5 text-[12px]">
									<div className="flex justify-between">
										<dt className="text-ink-soft">Version</dt>
										<dd className="font-mono text-ink">v1.0</dd>
									</div>
									<div className="flex justify-between">
										<dt className="text-ink-soft">Effective date</dt>
										<dd className="font-mono text-ink">24 Sep 2026</dd>
									</div>
									<div className="flex justify-between">
										<dt className="text-ink-soft">Applies to</dt>
										<dd className="text-right font-mono text-ink">Public website + portal</dd>
									</div>
									<div className="flex justify-between">
										<dt className="text-ink-soft">Reference</dt>
										<dd className="font-mono text-ink">TRN-PRV-001</dd>
									</div>
								</dl>
							</div>
						</div>
					</div>
				</section>

				{/* CONTENT */}
				<section className="bg-sand">
					<div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[240px_1fr] lg:px-8 lg:py-20">
						<aside className="h-fit lg:sticky lg:top-24">
							<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
									Contents
								</p>
								<ul className="mt-4 space-y-2">
									{sections.map((s) => (
										<li key={s.id}>
											<a
												href={`#${s.id}`}
												className="block text-[12px] leading-5 text-ink-soft transition-colors hover:text-orange"
											>
												{s.title}
											</a>
										</li>
									))}
								</ul>
							</div>

							<div className="mt-4 rounded-2xl bg-slate p-5 text-sand ring-1 ring-slate">
								<div className="flex items-center gap-2">
									<ShieldCheck className="size-4 text-orange" />
									<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
										Your rights
									</p>
								</div>
								<p className="mt-3 text-[12px] leading-5 text-sand/75">
									You can exercise your data protection rights at any time. Reach our data
									protection contact below.
								</p>
								<a
									href="#contact"
									className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold text-orange hover:text-orange-deep"
								>
									Jump to contact <ArrowRight className="size-3.5" />
								</a>
							</div>
						</aside>

						<div className="min-w-0">
							<div className="space-y-12">
								{sections.map((s) => (
									<section key={s.id} id={s.id} className="scroll-mt-24">
										<h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
											{s.title}
										</h2>
										<div className="mt-4 space-y-3.5">
											{s.body.map((paragraph, i) => (
												<p
													key={i}
													className="max-w-3xl text-[14px] leading-7 text-ink-soft"
												>
													{paragraph}
												</p>
											))}
										</div>
									</section>
								))}
							</div>

							<section
								id="contact"
								className="mt-16 scroll-mt-24 rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8"
							>
								<div className="flex items-center gap-2">
									<Mail className="size-4 text-orange" />
									<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
										Data protection contact
									</p>
								</div>
								<h2 className="mt-3 font-display text-2xl font-bold text-ink">
									Contact TRÏNŪ about your data
								</h2>
								<p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
									Use the enquiry form for any data protection question, request, or
									complaint. Please include enough information for us to identify the
									relevant record and verify your request.
								</p>
								<div className="mt-6 grid gap-3 sm:grid-cols-3">
									<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
										<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
											Data protection desk
										</p>
										<p className="mt-1 text-sm font-semibold text-ink">
											TRÏNŪ Bonded Warehouse
										</p>
									</div>
									<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
										<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
											Facility
										</p>
										<p className="mt-1 text-sm font-semibold text-ink">
											Abuja Flagship Facility
										</p>
									</div>
									<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
										<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
											Regulator
										</p>
										<p className="mt-1 text-sm font-semibold text-ink">
											Nigeria Data Protection Commission
										</p>
									</div>
								</div>
								<div className="mt-6 flex flex-wrap gap-3">
									<Link to="/contact">
										<Button className="bg-orange text-white hover:bg-orange-deep">
											Contact operations <ArrowRight />
										</Button>
									</Link>
									<a href="#who-we-are" className="inline-flex">
										<Button
											variant="outline"
											className="border-line bg-paper text-ink hover:bg-sand"
										>
											Back to top
										</Button>
									</a>
								</div>
							</section>

							<div className="mt-10 border-t border-line pt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								<p>
									TRN-PRV-001 · v1.0 · Effective 24 Sep 2026 · This notice is published,
									versioned, and timestamped in line with the Nigeria Data Protection Act
									2023.
								</p>
							</div>
						</div>
					</div>
				</section>
			</main>
		</PublicFrame>
	);
}