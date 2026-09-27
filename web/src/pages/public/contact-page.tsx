import { useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	ArrowRight,
	Check,
	Clock3,
	Mail,
	MapPin,
	MessageSquare,
	Phone,
	ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicFrame, PublicKicker } from "@/components/public/public-shell";

export function ContactPage() {
	const [sent, setSent] = useState(false);
	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSent(true);
		toast.success("Enquiry preview complete. Nothing was sent or saved.");
	};

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
					<div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[.9fr_1.1fr] lg:items-start lg:px-8 lg:py-20">
						<div>
							<PublicKicker>Contact TRÏNŪ</PublicKicker>
							<h1 className="mt-3 max-w-lg font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl">
								Start with the{" "}
								<span className="text-orange">cargo requirement.</span>
							</h1>
							<p className="mt-5 max-w-lg leading-7 text-ink-soft">
								Use this enquiry form for general questions. For pricing and service
								planning, use the detailed quote request. TRÏNŪ brings the port closer — so
								trade in Abuja moves at Abuja's pace.
							</p>

							<div className="mt-10 grid gap-3">
								<ContactCard
									icon={MapPin}
									label="Facility"
									value="Abuja, Nigeria"
									detail="Flagship Facility"
								/>
								<ContactCard
									icon={Mail}
									label="Enquiry desk"
									value="Operations team"
									detail="Direct line for active accounts"
								/>
								<ContactCard
									icon={Phone}
									label="Enquiries"
									value="Response by email"
									detail="Within 1 business day for quotes"
								/>
								<ContactCard
									icon={Clock3}
									label="Admin desk"
									value="Mon – Sat · 08:00 – 18:00"
									detail="Office hours for enquiries"
								/>
								<ContactCard
									icon={ShieldCheck}
									label="Gate operations"
									value="24/7 coordination"
									detail="Gate and yard movements around the clock"
								/>
							</div>

							<div className="mt-10 rounded-2xl bg-slate p-6 text-sand ring-1 ring-slate">
								<div className="flex items-center gap-2">
									<MessageSquare className="size-4 text-orange" />
									<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
										Detailed brief?
									</p>
								</div>
								<p className="mt-3 font-display text-xl font-bold text-sand">
									For pricing and service planning, use the quote form.
								</p>
								<p className="mt-2 text-sm leading-6 text-sand/75">
									Share cargo, timing, and service needs to preview the quote workflow. This demo
									does not send details to a coordinator.
								</p>
								<Link to="/quote">
									<Button className="mt-5 bg-orange text-white hover:bg-orange-deep">
										Request a quote <ArrowRight />
									</Button>
								</Link>
							</div>
						</div>

						<div className="overflow-hidden rounded-2xl bg-paper shadow-xl ring-1 ring-line">
							<div className="border-b border-line bg-sand p-5 sm:p-6">
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
												{sent ? "Local preview" : "Send an enquiry"}
								</p>
								<h2 className="mt-2 font-display text-xl font-bold text-ink">
											{sent ? "Your enquiry preview is ready." : "Tell us what you need."}
								</h2>
							</div>
							<div className="p-5 sm:p-6">
								{sent ? (
									<div className="grid min-h-[380px] place-items-center text-center">
										<div>
											<div className="mx-auto grid size-14 place-items-center rounded-full bg-orange text-white">
												<Check />
											</div>
											<h3 className="mt-5 font-display text-2xl font-bold text-ink">
												Preview complete.
											</h3>
											<p className="mt-2 text-sm text-ink-soft">
												Reference{" "}
												<span className="font-mono text-ink">TRN-ENQ-2026-0910</span>
											</p>
											<p className="mx-auto mt-3 max-w-xs text-[12px] leading-5 text-ink-soft">
													This message was not sent or stored. Your details stayed in this browser.
											</p>
											<Button
												variant="outline"
												className="mt-6 border-line bg-paper text-ink hover:bg-sand"
												onClick={() => setSent(false)}
											>
												Send another enquiry
											</Button>
										</div>
									</div>
								) : (
									<form onSubmit={submit} className="grid gap-5">
										<div className="grid gap-4 sm:grid-cols-2">
											<ContactField label="Name" placeholder="Your full name" />
											<ContactField label="Company" placeholder="Company name" />
										</div>
										<div className="grid gap-4 sm:grid-cols-2">
											<ContactField
												label="Email"
												placeholder="name@company.ng"
												type="email"
											/>
											<ContactField label="Phone" placeholder="+234 ..." />
										</div>
										<label>
											<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
												Enquiry type
											</span>
											<select
												required
												className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink"
											>
												<option>General terminal enquiry</option>
												<option>Cargo tracking support</option>
												<option>Documentation support</option>
												<option>Gate coordination</option>
											</select>
										</label>
										<label>
											<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
												Message
											</span>
											<textarea
												required
												className="mt-2 min-h-32 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
												placeholder="Tell us what you need help with"
											/>
										</label>
										<div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
											<p className="text-[11px] text-ink-soft">
												A coordinator will follow up using the contact information
												provided.
											</p>
											<Button
												type="submit"
												className="bg-orange text-white hover:bg-orange-deep"
											>
												Send enquiry <ArrowRight />
											</Button>
										</div>
									</form>
								)}
							</div>
						</div>
					</div>
				</section>
			</main>
		</PublicFrame>
	);
}

function ContactCard({
	icon: Icon,
	label,
	value,
	detail,
}: {
	icon: typeof MapPin;
	label: string;
	value: string;
	detail: string;
}) {
	return (
		<div className="flex items-start gap-4 rounded-xl bg-sand p-4 ring-1 ring-line">
			<div className="grid size-10 shrink-0 place-items-center rounded-md bg-orange text-white">
				<Icon className="size-5" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
					{label}
				</p>
				<p className="mt-1 text-sm font-semibold text-ink">{value}</p>
				<p className="mt-0.5 text-[12px] text-ink-soft">{detail}</p>
			</div>
		</div>
	);
}

function ContactField({
	label,
	placeholder,
	type = "text",
}: {
	label: string;
	placeholder: string;
	type?: string;
}) {
	return (
		<label>
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
			</span>
			<Input
				required
				type={type}
				placeholder={placeholder}
				className="mt-2 h-11 border-line bg-sand text-ink"
			/>
		</label>
	);
}