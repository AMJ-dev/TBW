import { useState } from "react";
import { Link } from "@/components/router-link";
import {
	ArrowRight,
	Building2,
	Check,
	ClipboardList,
	FileCheck2,
	Package,
	Upload,
	User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalFilePicker } from "@/components/ui/local-file-picker";
import { PublicFrame, PublicKicker } from "@/components/public/public-shell";

const steps = [
	{ key: "company", label: "Company", icon: Building2 },
	{ key: "cargo", label: "Cargo", icon: Package },
	{ key: "services", label: "Services", icon: ClipboardList },
	{ key: "requirements", label: "Requirements", icon: FileCheck2 },
	{ key: "documents", label: "Documents", icon: Upload },
	{ key: "review", label: "Review", icon: User },
] as const;

const cargoCategories = [
	"General",
	"Containerised",
	"Agricultural",
	"Industrial",
	"Automotive",
	"Project cargo",
] as const;

export function QuotePage() {
	const [step, setStep] = useState(0);
	const [submitted, setSubmitted] = useState(false);
	const [company, setCompany] = useState("");
	const [contact, setContact] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [cargo, setCargo] = useState("");
	const [volume, setVolume] = useState("");
	const [requirements, setRequirements] = useState("");

	const next = () => {
		if (step === 0 && company.trim().length < 3) {
			toast.error("Add a company name to continue.");
			return;
		}
		if (step === steps.length - 1) {
			setSubmitted(true);
			toast.success("Quote request submitted locally.");
			return;
		}
		setStep((value) => value + 1);
	};

	if (submitted)
		return (
			<PublicFrame>
				<main className="mx-auto max-w-2xl px-5 py-24 text-center">
					<div className="mx-auto grid size-16 place-items-center rounded-full bg-orange text-white">
						<Check className="size-8" />
					</div>
					<PublicKicker>Local quote preview</PublicKicker>
					<h1 className="mt-3 font-display text-4xl font-bold text-ink">Your quote brief is ready.</h1>
					<p className="mx-auto mt-4 max-w-md leading-7 text-ink-soft">
						Your entries were checked in this browser only. No quote request was sent and no
						contact details were stored.
					</p>
					<div className="mt-7 rounded-xl bg-sand p-5 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
							Demo reference · not submitted
						</p>
						<p className="mt-2 font-display text-2xl font-bold text-ink">TRN-Q-2026-004821</p>
					</div>
					<div className="mt-8 flex flex-wrap justify-center gap-3">
						<Link
							to="/"
							className="inline-flex items-center gap-2 rounded-md border border-line bg-paper px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sand"
						>
							Return home
						</Link>
						<Link
							to="/tracking"
							className="inline-flex items-center gap-2 rounded-md bg-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-deep"
						>
							Track a shipment <ArrowRight className="size-4" />
						</Link>
					</div>
				</main>
			</PublicFrame>
		);

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
					<div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:px-8 lg:py-20">
						<div>
							<PublicKicker>Request a quote</PublicKicker>
							<h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
								Plan the{" "}
								<span className="text-orange">next move.</span>
							</h1>
							<p className="mt-5 max-w-xl leading-7 text-ink-soft">
								Tell us what needs to move through TRÏNŪ. Six guided steps, saved locally
								in this prototype.
							</p>
						</div>
						<div className="grid grid-cols-3 gap-3">
							{[
								["06", "Guided steps"],
								["NGN", "Local currency"],
								["NG", "No obligation"],
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

				{/* FORM */}
				<section className="bg-sand">
					<div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
						<div className="grid gap-10 lg:grid-cols-[260px_1fr]">
							<aside className="lg:sticky lg:top-24 lg:self-start">
								<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
									<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
										Progress
									</p>
									<div className="mt-4 flex items-baseline gap-2">
										<p className="font-display text-3xl font-bold text-ink">
											{String(step + 1).padStart(2, "0")}
										</p>
										<p className="font-mono text-[11px] text-ink-soft">
											/ {String(steps.length).padStart(2, "0")}
										</p>
									</div>
									<div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line">
										<div
											className="h-full rounded-full bg-orange transition-[width] duration-300"
											style={{ width: `${((step + 1) / steps.length) * 100}%` }}
										/>
									</div>
									<ol className="mt-6 space-y-1">
										{steps.map(({ key, label, icon: Icon }, index) => {
											const isActive = index === step;
											const isDone = index < step;
											return (
												<li
													key={key}
													className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
														isActive
															? "bg-orange font-semibold text-white"
															: isDone
															? "text-orange"
															: "text-ink-soft"
													}`}
												>
													<span
														className={`grid size-7 place-items-center rounded-md border text-[11px] ${
															isDone
																? "border-orange bg-orange text-white"
																: isActive
																? "border-white/40 text-white"
																: "border-line"
														}`}
													>
														{isDone ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
													</span>
													{label}
												</li>
											);
										})}
									</ol>
								</div>

								<div className="mt-4 rounded-2xl bg-paper p-5 ring-1 ring-line">
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
										What happens next
									</p>
									<p className="mt-3 text-sm leading-6 text-ink-soft">
										A coordinator reviews your brief and follows up with the contact
										information provided. No commitment at this stage.
									</p>
								</div>
							</aside>

							<div className="overflow-hidden rounded-2xl bg-paper shadow-lg ring-1 ring-line">
								<div className="border-b border-line p-5 sm:p-7">
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div>
											<p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange">
												Step {String(step + 1).padStart(2, "0")} of{" "}
												{String(steps.length).padStart(2, "0")}
											</p>
											<h2 className="mt-2 font-display text-2xl font-bold text-ink">
												{steps[step]?.label}
											</h2>
										</div>
										<span className="rounded-full bg-sand px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft ring-1 ring-line">
											Saved locally
										</span>
									</div>
								</div>

								<div className="p-5 sm:p-7">
									<div className="space-y-4">
										{step === 0 && (
											<>
												<Field
													label="Company name"
													placeholder="Atlantic Trade Nigeria Ltd"
													value={company}
													onChange={setCompany}
												/>
												<div className="grid gap-4 sm:grid-cols-2">
													<Field
														label="Contact person"
														placeholder="Mary Adeyemi"
														value={contact}
														onChange={setContact}
													/>
													<Field
														label="Email"
														placeholder="ops@company.ng"
														value={email}
														onChange={setEmail}
														type="email"
													/>
												</div>
												<Field
													label="Phone"
													placeholder="+234 803 000 0000"
													value={phone}
													onChange={setPhone}
												/>
											</>
										)}
										{step === 1 && (
											<>
												<label className="block">
													<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														Cargo category
													</span>
													<div className="mt-2 flex flex-wrap gap-2">
														{cargoCategories.map((cat) => (
															<button
																key={cat}
																type="button"
																onClick={() => setCargo(cat)}
																className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
																	cargo === cat
																		? "bg-orange text-white"
																		: "bg-sand text-ink-soft ring-1 ring-line hover:bg-sand-2 hover:text-ink"
																}`}
															>
																{cat}
															</button>
														))}
													</div>
													<p className="mt-2 text-[11px] leading-5 text-ink-soft">
														Categories served at the Abuja flagship facility, subject to
														licence conditions and equipment availability.
													</p>
												</label>
												<div className="grid gap-4 sm:grid-cols-2">
													<Field
														label="Cargo description"
														placeholder="Consumer electronics"
														value={cargo}
														onChange={setCargo}
													/>
													<Field
														label="Volume"
														placeholder="4 × 40ft containers"
														value={volume}
														onChange={setVolume}
													/>
												</div>
												<div className="grid gap-4 sm:grid-cols-2">
													<Field label="Container count" placeholder="4" />
													<Field label="Container size" placeholder="40ft" />
													<Field label="Total weight" placeholder="18,420 kg" />
													<Field label="Expected arrival" placeholder="18 Sep 2026" />
												</div>
											</>
										)}
										{step === 2 && <ServiceSelects />}
										{step === 3 && (
											<label className="block">
												<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
													Special requirements
												</span>
												<textarea
													value={requirements}
													onChange={(event) => setRequirements(event.target.value)}
													className="mt-2 min-h-32 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
													placeholder="Access requirements, handling considerations, or other notes"
												/>
											</label>
										)}
										{step === 4 && (
											<div className="rounded-xl border border-dashed border-line bg-sand p-8 text-center">
												<div className="mx-auto grid size-12 place-items-center rounded-full bg-orange text-white">
													<Upload className="size-5" />
												</div>
												<p className="mt-4 font-display text-base font-bold text-ink">
													Add supporting documents
												</p>
												<p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-soft">
													Commercial invoice, packing list, bill of lading, or any
													applicable support record.
												</p>
												<div className="mt-5 flex justify-center">
													<LocalFilePicker />
												</div>
											</div>
										)}
										{step === 5 && (
											<div className="space-y-3">
												{[
													["Company", company || "Atlantic Trade Nigeria Ltd"],
													["Cargo category", cargo || "Containerised"],
													["Volume", volume || "4 × 40ft containers"],
													[
														"Services",
														"Bonded storage · handling · documentation support",
													],
													["Requirements", requirements || "14 days · arrival 18 Sep 2026"],
												].map(([label, value]) => (
													<div
														key={label}
														className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-sand px-4 py-3 ring-1 ring-line"
													>
														<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
															{label}
														</span>
														<span className="text-right text-sm font-medium text-ink">
															{value}
														</span>
													</div>
												))}
											</div>
										)}
									</div>

									<div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
										<Button
											variant="ghost"
											disabled={step === 0}
											onClick={() => setStep((value) => Math.max(0, value - 1))}
											className="text-ink-soft"
										>
											Back
										</Button>
										<div className="flex items-center gap-3">
											<span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft sm:inline">
												{step === steps.length - 1
													? "Ready to send"
													: `${steps.length - step - 1} steps remaining`}
											</span>
											<Button
												className="bg-orange text-white hover:bg-orange-deep"
												onClick={next}
											>
												{step === steps.length - 1 ? "Submit request" : "Continue"}
												<ArrowRight />
											</Button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			</main>
		</PublicFrame>
	);
}

function Field({
	label,
	placeholder,
	value,
	onChange,
	type = "text",
}: {
	label: string;
	placeholder: string;
	value?: string;
	onChange?: (value: string) => void;
	type?: string;
}) {
	return (
		<label className="block">
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
			</span>
			<Input
				value={value}
				onChange={(event) => onChange?.(event.target.value)}
				type={type}
				placeholder={placeholder}
				className="mt-2 h-11 border-line bg-sand text-ink"
			/>
		</label>
	);
}

function ServiceSelects() {
	return (
		<div className="space-y-3">
			{[
				"Bonded warehousing",
				"Cargo receiving & handling",
				"Documentation support",
				"Truck appointment coordination",
			].map((service, index) => (
				<label
					key={service}
					className="flex cursor-pointer items-center gap-3 rounded-xl bg-sand px-4 py-3 ring-1 ring-line transition-colors hover:bg-sand-2"
				>
					<input type="checkbox" defaultChecked={index < 3} className="size-4 accent-orange" />
					<span className="text-sm text-ink">{service}</span>
				</label>
			))}
		</div>
	);
}