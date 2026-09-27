import { type ReactNode } from "react";
import { Link } from "@/components/router-link";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicFrame, PublicKicker } from "@/components/public/public-shell";

const sections = [
	{
		id: "agreement",
		title: "1. Agreement to these terms",
		body: [
			"These terms of use govern your access to and use of the TRÏNŪ Bonded Warehouse public website, public cargo tracking, and stakeholder portal (together, \"the Services\").",
			"By accessing or using the Services, you agree to these terms on behalf of yourself and any organisation you represent. If you do not agree, do not use the Services.",
			"Where your organisation has a separate signed agreement with TRÏNŪ, that agreement governs in the event of any conflict with these terms.",
		],
	},
	{
		id: "who-we-are",
		title: "2. Who we are",
		body: [
			"TRÏNŪ Bonded Warehouse (\"TRÏNŪ\", \"we\", \"us\", \"our\") operates a bonded warehouse and terminal coordination facility at the Abuja Flagship Facility, Nigeria.",
			"Throughout these terms, \"you\" means the individual accessing the Services and, where applicable, the organisation you represent.",
		],
	},
	{
		id: "scope-of-services",
		title: "3. What the Services provide — and what they do not",
		body: [
			"TRÏNŪ provides facilities and coordination for bonded terminal activity, including cargo handling, storage, documentation support, and gate coordination. We keep records of coordination events and surface them to the people responsible for the next action.",
			"Important boundary: TRÏNŪ does not make, infer, or alter Customs decisions. Customs examinations, assessments, valuations, classifications, duty determinations, releases, and other statutory decisions remain solely with the competent authority. Where we record an outcome, we do so as provided by that authority.",
			"Nothing on the Services constitutes legal, customs, tax, or financial advice.",
		],
	},
	{
		id: "accounts",
		title: "4. Accounts and access",
		body: [
			"Some parts of the Services require an account. When you register or are granted access:",
			"you must provide accurate information and keep it up to date;",
			"you are responsible for maintaining the confidentiality of your credentials;",
			"you must tell us promptly if you believe your credentials have been compromised;",
			"you must not share your credentials or use another person's account;",
			"you must comply with our access, security, and delegation rules.",
			"Where your organisation grants you access through a delegation from a third party, your access is limited to the scope and time period granted. Delegations can be revoked at any time.",
			"We may suspend or close accounts that we believe are being misused, that breach these terms, or that pose a security or compliance risk.",
		],
	},
	{
		id: "acceptable-use",
		title: "5. Acceptable use",
		body: [
			"When you use the Services, you agree not to:",
			"submit false, misleading, or fraudulent information;",
			"attempt to gain unauthorised access to any part of the Services;",
			"probe, scan, or test the vulnerability of the Services without written permission;",
			"interfere with or disrupt the Services or the infrastructure that supports them;",
			"scrape, crawl, or extract data from the Services in a way that places unreasonable load on our systems;",
			"upload malicious code, malware, or files that could harm the Services or other users;",
			"use the Services to send unsolicited commercial messages;",
			"impersonate another person or organisation;",
			"use the Services in any way that breaks Nigerian law or the law of any applicable jurisdiction.",
		],
	},
	{
		id: "public-tracking",
		title: "6. Public cargo tracking",
		body: [
			"Public tracking returns controlled operational data only. It is designed to show movement status without exposing sensitive commercial information. The public view deliberately excludes consignee details, cargo value, invoice amounts, detailed goods descriptions, and exact storage positions.",
			"TRÏNŪ may change which fields are visible in public tracking at any time, including suppressing public statistics without notice, to protect privacy or commercial interests.",
			"You must not use public tracking to attempt to identify consignees, cargo values, or commercial arrangements you are not authorised to know.",
		],
	},
	{
		id: "documents-and-verification",
		title: "7. Documents and verification",
		body: [
			"Terminal-issued documents are generated from controlled TRÏNŪ records and include a unique reference, an issue timestamp, an issuing officer, and a verification code. Public verification is designed to return safe authenticity data only.",
			"If a document is altered, revoked, or no longer matches the controlled TRÏNŪ record, verification will fail. You must not present, rely on, or circulate a document that does not verify against the controlled record.",
			"If you believe a document has been tampered with or was issued in error, contact us immediately.",
		],
	},
	{
		id: "quotes-and-pricing",
		title: "8. Quotes, tariffs, and pricing",
		body: [
			"A quote request submitted through the Services is an enquiry. It is not a binding order and does not create a contract until both parties have agreed in writing.",
			"Tariffs, charges, and rates published or shown in the Services are subject to change and may depend on effective dates, cargo type, size, weight, storage duration, and other operational factors.",
			"Final pricing is confirmed in writing by TRÏNŪ before services are performed.",
		],
	},
	{
		id: "payments",
		title: "9. Payments and receipts",
		body: [
			"Where payments are handled through the Services, they are processed by third-party providers operating under their own terms. We do not process card numbers on our systems.",
			"Receipts and reconciliation status shown in the Services are provided for coordination and reference. If there is a discrepancy between a receipt in the Services and your bank or payment provider's record, please contact our finance desk.",
			"Financial clearance is one of the conditions considered for release. Satisfying financial obligations does not by itself release cargo — Customs authorisation and other terminal obligations must also be met.",
		],
	},
	{
		id: "intellectual-property",
		title: "10. Intellectual property",
		body: [
			"The Services, including the TRÏNŪ name, logo, design system, text, software, and compilations of operational data, are owned by or licensed to TRÏNŪ and are protected by applicable intellectual property laws.",
			"You may use the Services for their intended purpose. You may not copy, modify, distribute, sell, sublicense, or reverse-engineer any part of the Services except where the law clearly permits it or where you have our written permission.",
			"Content you submit (for example, a message through an enquiry form) remains yours. By submitting it, you grant us permission to use it to operate and improve the Services.",
		],
	},
	{
		id: "availability",
		title: "11. Availability and changes",
		body: [
			"We aim to keep the Services available and accurate, but we do not guarantee uninterrupted or error-free operation. Maintenance, upgrades, upstream outages, and events beyond our reasonable control may affect availability.",
			"We may change, suspend, or discontinue any part of the Services at any time. Where a change is material to you, we will provide reasonable notice through the Services or by email.",
		],
	},
	{
		id: "third-parties",
		title: "12. Third-party content and links",
		body: [
			"The Services may link to third-party websites, tools, or services. We do not control those third parties and are not responsible for their content, terms, or privacy practices. Links do not imply endorsement.",
			"If you access a third-party service from the Services, its terms and privacy notice apply to your use of that service.",
		],
	},
	{
		id: "disclaimer",
		title: "13. Disclaimers",
		body: [
			"The Services are provided on an \"as available\" basis. To the extent permitted by law, TRÏNŪ disclaims all warranties, express or implied, including any warranty of merchantability, fitness for a particular purpose, or non-infringement.",
			"TRÏNŪ does not warrant that:",
			"the Services will meet your requirements or operate uninterrupted;",
			"any information obtained through the Services is accurate, complete, or current at all times;",
			"any defect in the Services will be corrected.",
			"You use the Services at your own risk. Where the Services surface coordination records, you remain responsible for making your own decisions and taking your own operational, commercial, and regulatory steps.",
		],
	},
	{
		id: "limitation",
		title: "14. Limitation of liability",
		body: [
			"To the extent permitted by Nigerian law, TRÏNŪ is not liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Services — including loss of profit, loss of business, or loss of data.",
			"Where TRÏNŪ is liable to you, our total liability in connection with the Services in any 12-month period is limited to the amount you have paid TRÏNŪ for the specific service giving rise to the claim during that period.",
			"Nothing in these terms limits liability that cannot be limited by law, including liability for fraud, wilful misconduct, or death or personal injury caused by negligence.",
		],
	},
	{
		id: "indemnity",
		title: "15. Indemnity",
		body: [
			"You agree to indemnify and hold TRÏNŪ harmless from claims, losses, and expenses (including reasonable legal fees) arising from:",
			"your breach of these terms;",
			"your misuse of the Services;",
			"content you submit through the Services that infringes third-party rights or breaks the law.",
		],
	},
	{
		id: "termination",
		title: "16. Termination",
		body: [
			"We may suspend or terminate your access to the Services if you breach these terms, if we are required to do so by law, or if we discontinue the Services.",
			"You can stop using the Services at any time. If you have an account, you can request closure by contacting us.",
			"Termination does not affect obligations that by their nature survive — for example, intellectual property, disclaimers, limitations of liability, and indemnities.",
		],
	},
	{
		id: "governing-law",
		title: "17. Governing law and disputes",
		body: [
			"These terms are governed by the laws of the Federal Republic of Nigeria.",
			"The courts of Nigeria have exclusive jurisdiction over any dispute arising out of or relating to these terms or the Services, unless a separate signed agreement between you and TRÏNŪ states otherwise.",
			"Before starting formal proceedings, both parties agree to try to resolve the dispute in good faith through discussion and, if appropriate, mediation.",
		],
	},
	{
		id: "changes",
		title: "18. Changes to these terms",
		body: [
			"We may update these terms from time to time. When we make material changes, we will publish the updated version with a new effective date and, where required, provide additional notice through the Services or by email.",
			"Your continued use of the Services after a change takes effect means you accept the updated terms.",
		],
	},
	{
		id: "contact",
		title: "19. Contact",
		body: [
			"If you have questions about these terms, contact us using the details below.",
		],
	},
] as const;

export function TermsPage() {
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
									Terms of <span className="text-orange">use</span>
								</h1>
								<p className="mt-5 max-w-2xl leading-7 text-ink-soft">
									The rules that govern your access to and use of the TRÏNŪ public
									website, public tracking, and stakeholder portal.
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
										<dt className="text-ink-soft">Governing law</dt>
										<dd className="text-right font-mono text-ink">Federal Republic of Nigeria</dd>
									</div>
									<div className="flex justify-between">
										<dt className="text-ink-soft">Reference</dt>
										<dd className="font-mono text-ink">TRN-TOU-001</dd>
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
										Important boundary
									</p>
								</div>
								<p className="mt-3 text-[12px] leading-5 text-sand/75">
									TRÏNŪ provides facilities and coordination. Customs decisions and other
									statutory outcomes remain with the competent authority.
								</p>
								<a
									href="#scope-of-services"
									className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold text-orange hover:text-orange-deep"
								>
									Read the scope <ArrowRight className="size-3.5" />
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
									<FileText className="size-4 text-orange" />
									<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
										Legal contact
									</p>
								</div>
								<h2 className="mt-3 font-display text-2xl font-bold text-ink">
									Contact TRÏNŪ about these terms
								</h2>
								<p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
									If you have questions about these terms, need a signed copy, or believe
									someone is misusing the Services, contact us using the details below.
								</p>
								<div className="mt-6 grid gap-3 sm:grid-cols-3">
									<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
										<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
											Legal contact
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
											Jurisdiction
										</p>
										<p className="mt-1 text-sm font-semibold text-ink">
											Federal Republic of Nigeria
										</p>
									</div>
								</div>
								<div className="mt-6 flex flex-wrap gap-3">
									<Link to="/contact">
										<Button className="bg-orange text-white hover:bg-orange-deep">
											Contact operations <ArrowRight />
										</Button>
									</Link>
									<Link to="/privacy">
										<Button
											variant="outline"
											className="border-line bg-paper text-ink hover:bg-sand"
										>
											Read privacy notice
										</Button>
									</Link>
								</div>
							</section>

							<div className="mt-10 border-t border-line pt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								<p>
									TRN-TOU-001 · v1.0 · Effective 24 Sep 2026 · These terms are governed by
									the laws of the Federal Republic of Nigeria.
								</p>
							</div>
						</div>
					</div>
				</section>
			</main>
		</PublicFrame>
	);
}