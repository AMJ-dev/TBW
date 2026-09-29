import { useState } from "react";
import { Link } from "@/components/router-link";
import { ArrowRight, ChevronDown, HelpCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicFrame, PublicKicker } from "@/components/public/public-shell";

const faqs = [
	{
		category: "Tracking",
		question: "What can public cargo tracking show?",
		answer:
			"Current operational status and milestones, without sensitive commercial details.",
	},
	{
		category: "Authority",
		question: "Does TRÏNŪ make Customs decisions?",
		answer:
			"No. TRÏNŪ supports coordination and record visibility. Statutory decisions remain with the appropriate authority.",
	},
	{
		category: "Quotes",
		question: "How do I request a service quote?",
		answer:
			"Describe your cargo, timing, service needs, and supporting records in the six-step quote form.",
	},
	{
		category: "Appointments",
		question: "Can I reserve a truck slot?",
		answer:
			"Registered stakeholders can book a truck slot after cargo readiness checks are complete.",
	},
	{
		category: "Documents",
		question: "How can I check a TRÏNŪ document?",
		answer:
			"Enter its verification code on the public verification page to compare it with the controlled demo record.",
	},
] as const;

export default function FaqPage() {
	const [open, setOpen] = useState<number>(0);

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
					<div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:px-8 lg:py-20">
						<div>
							<PublicKicker>Frequently asked questions</PublicKicker>
							<h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
								Answers for the{" "}
								<span className="text-orange">next move.</span>
							</h1>
							<p className="mt-5 max-w-xl leading-7 text-ink-soft">
								Quick guidance for tracking, storage, documents, gate appointments, and
								release coordination across the TRÏNŪ bonded terminal.
							</p>
						</div>
						<div className="grid grid-cols-3 gap-3">
							{[
								["05", "Topics"],
								["5", "Answers"],
								["24/7", "Visibility"],
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
				</section>

				<section className="bg-sand">
					<div className="mx-auto max-w-5xl px-5 py-14 lg:px-8 lg:py-20">
						<div className="mb-8 flex items-center gap-2 border-b border-line pb-4">
							<HelpCircle className="size-4 text-orange" />
							<p className="font-mono text-[12px] uppercase tracking-[0.16em] text-orange">
								{faqs.length} common questions
							</p>
						</div>

						<div className="divide-y divide-line border-b border-line">
							{faqs.map(({ category, question, answer }, index) => {
								const isOpen = open === index;
								return (
									<div key={question}>
										<button
											type="button"
											onClick={() => setOpen(isOpen ? -1 : index)}
											aria-expanded={isOpen}
											className="group flex w-full items-start gap-5 py-6 text-left transition-colors hover:bg-paper"
										>
											<span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-orange font-mono text-[12px] font-semibold text-white">
												{String(index + 1).padStart(2, "0")}
											</span>
											<div className="min-w-0 flex-1">
												<p className="font-mono text-[12px] uppercase tracking-[0.14em] text-orange">
													{category}
												</p>
												<p className="mt-1.5 font-display text-lg font-bold text-ink">
													{question}
												</p>
											</div>
											<span
												className={`mt-1 grid size-7 shrink-0 place-items-center rounded-full border transition-all ${
													isOpen
														? "border-orange bg-orange text-white"
														: "border-line bg-paper text-ink-soft group-hover:border-orange/40 group-hover:text-orange"
												}`}
											>
												<ChevronDown
													className={`size-4 transition-transform duration-200 ${
														isOpen ? "rotate-180" : ""
													}`}
												/>
											</span>
										</button>
										{isOpen && (
											<div className="pb-6 pl-[52px] pr-12">
												<p className="text-sm leading-7 text-ink-soft">{answer}</p>
											</div>
										)}
									</div>
								);
							})}
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
								<div className="flex items-center gap-2">
									<MessageSquare className="size-4 text-orange" />
									<p className="font-mono text-[12px] uppercase tracking-[0.18em] text-orange">
										Still need an answer?
									</p>
								</div>
								<h2 className="mt-3 font-display text-3xl font-bold text-sand sm:text-4xl">
									Send the terminal team a clear enquiry.
								</h2>
								<p className="mt-4 max-w-xl leading-7 text-sand/75">
									Share the cargo reference, the question, and any supporting records. A
									TRÏNŪ coordinator will review the enquiry and follow up using the
									contact information provided.
								</p>
							</div>
							<div className="flex flex-wrap gap-3 lg:justify-end">
								<Link to="/contact">
									<Button size="lg" className="bg-orange text-white hover:bg-orange-deep">
										Contact TRÏNŪ <ArrowRight />
									</Button>
								</Link>
								<Link to="/tracking">
									<Button
										size="lg"
										variant="outline"
										className="border-sand/30 bg-transparent text-sand hover:bg-sand/10"
									>
										Track a shipment
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