import { useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Building2,
	Check,
	ChevronLeft,
	FileCheck2,
	Landmark,
	ShieldCheck,
	Upload,
	Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CreditTier = "starter" | "standard" | "corporate";
type ApplicationStep = "company" | "tier" | "references" | "review";

interface TierOption {
	key: CreditTier;
	label: string;
	limit: string;
	detail: string;
	terms: string;
}

const tierOptions: TierOption[] = [
	{
		key: "starter",
		label: "Starter credit",
		limit: "₦2,000,000",
		detail:
			"For newer accounts building a payment history with TRINŪ. 14-day terms.",
		terms: "14 days from invoice date",
	},
	{
		key: "standard",
		label: "Standard credit",
		limit: "₦10,000,000",
		detail:
			"For established accounts with at least 3 months of settled invoices. 21-day terms.",
		terms: "21 days from invoice date",
	},
	{
		key: "corporate",
		label: "Corporate credit",
		limit: "₦50,000,000",
		detail:
			"For high-volume accounts with a settled trading history. 30-day terms.",
		terms: "30 days from invoice date",
	},
];

const steps: { key: ApplicationStep; label: string; detail: string }[] = [
	{ key: "company", label: "Company details", detail: "Legal information" },
	{ key: "tier", label: "Credit tier", detail: "Requested facility" },
	{ key: "references", label: "References", detail: "Trade & bank" },
	{ key: "review", label: "Review", detail: "Confirm and submit" },
];

export default function FinanceCreditApplyRoute() {
	const [step, setStep] = useState<ApplicationStep>("company");
	const [tier, setTier] = useState<CreditTier>("standard");

	const [legalName, setLegalName] = useState("");
	const [rcNumber, setRcNumber] = useState("");
	const [tin, setTin] = useState("");
	const [registeredAddress, setRegisteredAddress] = useState("");
	const [contactName, setContactName] = useState("");
	const [contactEmail, setContactEmail] = useState("");
	const [contactPhone, setContactPhone] = useState("");

	const [bankName, setBankName] = useState("");
	const [bankAccount, setBankAccount] = useState("");
	const [bankContact, setBankContact] = useState("");
	const [trade1, setTrade1] = useState("");
	const [trade2, setTrade2] = useState("");
	const [requestedAmount, setRequestedAmount] = useState("");
	const [averageMonthlySpend, setAverageMonthlySpend] = useState("");
	const [notes, setNotes] = useState("");
	const [acknowledged, setAcknowledged] = useState(false);

	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const currentIndex = steps.findIndex((s) => s.key === step);
	const selectedTier = tierOptions.find((t) => t.key === tier)!;

	const goNext = () => {
		if (step === "company") {
			if (!legalName.trim() || !rcNumber.trim() || !tin.trim()) {
				toast.error("Legal name, RC number, and TIN are required.");
				return;
			}
			setStep("tier");
			return;
		}
		if (step === "tier") {
			setStep("references");
			return;
		}
		if (step === "references") {
			if (!bankName.trim() || !bankAccount.trim() || !trade1.trim()) {
				toast.error("Bank details and at least one trade reference are required.");
				return;
			}
			setStep("review");
			return;
		}
	};

	const goBack = () => {
		if (step === "tier") setStep("company");
		else if (step === "references") setStep("tier");
		else if (step === "review") setStep("references");
	};

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!acknowledged) {
			toast.error("Confirm the accuracy statement to submit.");
			return;
		}
		setSubmitting(true);
		setTimeout(() => {
			setSubmitting(false);
			setSubmitted(true);
			toast.success("Credit application submitted locally.");
		}, 700);
	};

	if (submitted) {
		return (
			<AppShell title="Credit application submitted" eyebrow="Finance workspace">
				<div className="mx-auto max-w-2xl rounded-2xl bg-paper p-8 text-center ring-1 ring-line sm:p-10">
					<div className="mx-auto grid size-16 place-items-center rounded-full bg-orange text-white">
						<Check className="size-8" />
					</div>
					<p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-deep">
						Application submitted
					</p>
					<h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
						We have your application.
					</h2>
					<p className="mx-auto mt-4 max-w-md leading-7 text-ink-soft">
						The finance desk will review the request and follow up using the contact
						information provided. Approved facilities activate on the first of the
						following month.
					</p>

					<div className="mx-auto mt-7 max-w-md rounded-xl bg-sand p-5 ring-1 ring-line">
						<dl className="space-y-2 text-left text-[12px]">
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Application reference</dt>
								<dd className="font-mono text-ink">TRN-CRA-2026-00214</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Legal name</dt>
								<dd className="text-right text-ink">{legalName || "—"}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Requested tier</dt>
								<dd className="text-ink">{selectedTier.label}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Requested limit</dt>
								<dd className="font-mono text-ink">
									{requestedAmount ? `₦${requestedAmount}` : selectedTier.limit}
								</dd>
							</div>
						</dl>
					</div>

					<p className="mx-auto mt-6 max-w-md text-[12px] leading-5 text-ink-soft">
						Until the facility is approved, new cargo is billed on payment terms. Existing
						credit limits remain unchanged while the application is under review.
					</p>

					<div className="mt-8 flex flex-wrap justify-center gap-3">
						<Link to="/portal/payments">
							<Button className="bg-orange text-white hover:bg-orange-deep">
								Back to payments <ArrowRight />
							</Button>
						</Link>
						<Link to="/portal/statement">
							<Button variant="outline" className="border-line bg-paper text-ink">
								View statement
							</Button>
						</Link>
					</div>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell title="Credit application" eyebrow="Finance workspace">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Finance workspace · Credit facility
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Apply for a credit facility
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Request a deferred payment facility on your account. The finance desk reviews
						the application and confirms the approved limit and terms in writing.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link to="/portal/statement">
						<Button variant="outline" className="border-line bg-paper text-ink">
							<ChevronLeft className="mr-1.5 size-4" /> View statement
						</Button>
					</Link>
				</div>
			</div>

			<div className="grid gap-5 xl:grid-cols-[260px_1fr]">
				<aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
					<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
							Progress
						</p>
						<div className="mt-3 flex items-baseline gap-2">
							<p className="font-display text-3xl font-bold text-ink">
								{String(currentIndex + 1).padStart(2, "0")}
							</p>
							<p className="font-mono text-[11px] text-ink-soft">
								/ {String(steps.length).padStart(2, "0")}
							</p>
						</div>
						<div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sand-2">
							<div
								className="h-full rounded-full bg-orange transition-[width] duration-300"
								style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
							/>
						</div>
						<ol className="mt-6 space-y-1">
							{steps.map((s, i) => {
								const active = s.key === step;
								const done = i < currentIndex;
								return (
									<li key={s.key}>
										<button
											type="button"
											onClick={() => {
												if (done) setStep(s.key);
											}}
											disabled={!done && !active}
											className={cn(
												"flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
												active
													? "bg-ink font-semibold text-sand"
													: done
													? "text-orange-deep hover:bg-sand"
													: "text-ink-soft"
											)}
										>
											<span
												className={cn(
													"grid size-7 shrink-0 place-items-center rounded-md border text-[11px]",
													done
														? "border-orange bg-orange text-white"
														: active
														? "border-orange text-orange"
														: "border-line"
												)}
											>
												{done ? <Check className="size-3.5" /> : i + 1}
											</span>
											<div className="min-w-0">
												<p>{s.label}</p>
												<p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
													{s.detail}
												</p>
											</div>
										</button>
									</li>
								);
							})}
						</ol>
					</div>

					<div className="rounded-xl bg-sand p-5 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							How review works
						</p>
						<p className="mt-3 text-[12px] leading-5 text-ink-soft">
							A credit officer reviews the application, the settled trading history on
							your account, and the references you provide. The approval is confirmed in
							writing before the facility activates.
						</p>
					</div>

					<div className="rounded-xl bg-slate p-5 text-sand ring-1 ring-slate">
						<div className="flex items-center gap-2">
							<ShieldCheck className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								What we check
							</p>
						</div>
						<ul className="mt-3 space-y-2 text-[12px] leading-5 text-sand/75">
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Legal entity and TIN match the account on file
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Settled invoices with no unresolved disputes
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Bank and trade references confirm the profile
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Requested limit aligns with declared activity
							</li>
						</ul>
					</div>
				</aside>

				<form onSubmit={handleSubmit} className="space-y-5">
					{step === "company" && (
						<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-7">
							<SectionHeader
								title="Company details"
								detail="Match your account"
								inline
							/>
							<div className="grid gap-4 sm:grid-cols-2">
								<Field
									label="Legal name"
									placeholder="Atlantic Trade Nigeria Ltd"
									value={legalName}
									onChange={setLegalName}
									required
								/>
								<Field
									label="RC number"
									placeholder="RC-1284921"
									value={rcNumber}
									onChange={setRcNumber}
									mono
									required
								/>
								<Field
									label="TIN"
									placeholder="20483012-0001"
									value={tin}
									onChange={setTin}
									mono
									required
								/>
								<Field
									label="Registered address"
									placeholder="Full registered office address"
									value={registeredAddress}
									onChange={setRegisteredAddress}
								/>
							</div>

							<div className="mt-6 border-t border-line pt-6">
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Primary contact for this application
								</p>
								<div className="mt-4 grid gap-4 sm:grid-cols-3">
									<Field
										label="Name"
										placeholder="Full name"
										value={contactName}
										onChange={setContactName}
									/>
									<Field
										label="Email"
										placeholder="name@company.ng"
										value={contactEmail}
										onChange={setContactEmail}
										type="email"
									/>
									<Field
										label="Phone"
										placeholder="+234 ..."
										value={contactPhone}
										onChange={setContactPhone}
									/>
								</div>
							</div>
						</section>
					)}

					{step === "tier" && (
						<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-7">
							<SectionHeader
								title="Credit tier"
								detail="Choose the facility"
								inline
							/>
							<p className="text-[13px] leading-6 text-ink-soft">
								Each tier comes with a standard limit and payment term. The finance
								desk may confirm a different limit or term based on the review.
							</p>

							<div className="mt-5 grid gap-3 md:grid-cols-3">
								{tierOptions.map((t) => {
									const active = tier === t.key;
									return (
										<button
											key={t.key}
											type="button"
											onClick={() => setTier(t.key)}
											className={cn(
												"flex flex-col rounded-xl border p-4 text-left transition-colors",
												active
													? "border-orange bg-orange/5 ring-1 ring-orange/30"
													: "border-line bg-sand hover:bg-sand-2"
											)}
										>
											<div className="flex items-start justify-between">
												<div className="grid size-9 place-items-center rounded-md bg-orange/10 text-orange-deep">
													<Wallet className="size-4" />
												</div>
												{active && (
													<span className="grid size-5 place-items-center rounded-full bg-orange text-white">
														<Check className="size-3" />
													</span>
												)}
											</div>
											<p className="mt-4 text-sm font-semibold text-ink">{t.label}</p>
											<p className="mt-2 font-display text-xl font-bold text-ink">
												{t.limit}
											</p>
											<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-orange-deep">
												{t.terms}
											</p>
											<p className="mt-3 text-[11px] leading-5 text-ink-soft">
												{t.detail}
											</p>
										</button>
									);
								})}
							</div>

							<div className="mt-6 grid gap-4 sm:grid-cols-2">
								<Field
									label="Requested limit (optional)"
									placeholder={selectedTier.limit.replace("₦", "")}
									value={requestedAmount}
									onChange={setRequestedAmount}
									mono
								/>
								<Field
									label="Average monthly spend (optional)"
									placeholder="e.g. 4,500,000"
									value={averageMonthlySpend}
									onChange={setAverageMonthlySpend}
									mono
								/>
							</div>
							<p className="mt-2 text-[11px] leading-5 text-ink-soft">
								If you request a limit different from the tier default, the finance
								desk will review it against your trading history.
							</p>
						</section>
					)}

					{step === "references" && (
						<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-7">
							<SectionHeader
								title="References"
								detail="Bank & trade"
								inline
							/>
							<p className="text-[13px] leading-6 text-ink-soft">
								Bank references confirm the account entity. Trade references confirm
								your settled history with other suppliers or service providers.
							</p>

							<div className="mt-5">
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Bank reference
								</p>
								<div className="mt-3 grid gap-4 sm:grid-cols-3">
									<Field
										label="Bank name"
										placeholder="e.g. Stanbic IBTC"
										value={bankName}
										onChange={setBankName}
										required
									/>
									<Field
										label="Account number"
										placeholder="0123456789"
										value={bankAccount}
										onChange={setBankAccount}
										mono
										required
									/>
									<Field
										label="Contact at bank"
										placeholder="Relationship manager"
										value={bankContact}
										onChange={setBankContact}
									/>
								</div>
							</div>

							<div className="mt-6 border-t border-line pt-6">
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Trade references
								</p>
								<div className="mt-4 grid gap-4 sm:grid-cols-2">
									<Field
										label="Trade reference 1"
										placeholder="e.g. Maersk Line · account M-88219"
										value={trade1}
										onChange={setTrade1}
										required
									/>
									<Field
										label="Trade reference 2 (optional)"
										placeholder="e.g. APM Terminals · account A-04128"
										value={trade2}
										onChange={setTrade2}
									/>
								</div>
							</div>

							<div className="mt-6 rounded-xl bg-sand p-4 ring-1 ring-line">
								<div className="flex items-start gap-3">
									<Landmark className="mt-0.5 size-4 shrink-0 text-orange" />
									<div>
										<p className="text-[13px] font-semibold text-ink">
											How references are used
										</p>
										<p className="mt-1 text-[12px] leading-5 text-ink-soft">
											The finance desk contacts the bank and trade references
											directly. We do not share your other customer relationships,
											and the references are used only to confirm the profile for
											this application.
										</p>
									</div>
								</div>
							</div>
						</section>
					)}

					{step === "review" && (
						<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-7">
							<SectionHeader
								title="Review"
								detail="Confirm before submitting"
								inline
							/>

							<div className="space-y-5">
								<ReviewBlock title="Company details" icon={Building2}>
									<Row label="Legal name" value={legalName || "—"} />
									<Row label="RC number" value={rcNumber || "—"} mono />
									<Row label="TIN" value={tin || "—"} mono />
									<Row label="Registered address" value={registeredAddress || "—"} />
									<Row label="Primary contact" value={contactName || "—"} />
									<Row label="Contact email" value={contactEmail || "—"} mono />
									<Row label="Contact phone" value={contactPhone || "—"} mono />
								</ReviewBlock>

								<ReviewBlock title="Requested facility" icon={Wallet}>
									<Row label="Tier" value={selectedTier.label} />
									<Row label="Standard limit" value={selectedTier.limit} mono />
									<Row label="Payment terms" value={selectedTier.terms} />
									{requestedAmount && (
										<Row
											label="Requested limit"
											value={`₦${requestedAmount}`}
											mono
										/>
									)}
									{averageMonthlySpend && (
										<Row
											label="Average monthly spend"
											value={`₦${averageMonthlySpend}`}
											mono
										/>
									)}
								</ReviewBlock>

								<ReviewBlock title="References" icon={Landmark}>
									<Row label="Bank" value={bankName || "—"} />
									<Row label="Account" value={bankAccount || "—"} mono />
									<Row label="Bank contact" value={bankContact || "—"} />
									<Row label="Trade reference 1" value={trade1 || "—"} />
									<Row label="Trade reference 2" value={trade2 || "—"} />
								</ReviewBlock>

								{notes && (
									<ReviewBlock title="Additional notes" icon={FileCheck2}>
										<p className="text-[12px] leading-6 text-ink-soft">{notes}</p>
									</ReviewBlock>
								)}
							</div>

							<label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
								<input
									type="checkbox"
									checked={acknowledged}
									onChange={(e) => setAcknowledged(e.target.checked)}
									className="mt-0.5 size-4 shrink-0 rounded border-line accent-orange"
								/>
								<span className="text-[12px] leading-6 text-ink">
									I confirm the details provided are accurate, and I understand that
									TRINŪ will contact the bank and trade references listed. I also
									understand that approval of a credit facility is at the sole
									discretion of TRINŪ finance.
								</span>
							</label>

							<div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
								<Button
									type="button"
									variant="ghost"
									onClick={goBack}
									className="text-ink-soft"
								>
									<ChevronLeft className="mr-1 size-4" /> Back
								</Button>
								<Button
									type="submit"
									disabled={submitting || !acknowledged}
									className={cn(
										"bg-orange text-white hover:bg-orange-deep",
										(submitting || !acknowledged) && "opacity-60"
									)}
								>
									{submitting ? "Submitting application…" : "Submit application"}
									{!submitting && <ArrowRight />}
								</Button>
							</div>
						</section>
					)}

					{step === "review" ? null : (
						<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Additional notes (optional)
								</p>
								<textarea
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
									placeholder="Any context the finance desk should know: expected volumes, sector, timing, or seasonal considerations."
								/>
							</div>

							<div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-5">
								<Button
									type="button"
									variant="ghost"
									onClick={goBack}
									disabled={step === "company"}
									className="text-ink-soft"
								>
									<ChevronLeft className="mr-1 size-4" /> Back
								</Button>
								<Button
									type="button"
									className="bg-orange text-white hover:bg-orange-deep"
									onClick={goNext}
								>
									Continue <ArrowRight />
								</Button>
							</div>
						</section>
					)}
				</form>
			</div>
		</AppShell>
	);
}

function SectionHeader({
	title,
	detail,
	inline = false,
}: {
	title: string;
	detail: string;
	inline?: boolean;
}) {
	return (
		<div
			className={
				"mb-4 flex flex-wrap items-center justify-between gap-3 " +
				(inline ? "px-0 pt-0" : "px-5 pt-5")
			}
		>
			<h3 className="font-display text-sm font-bold tracking-tight text-ink">{title}</h3>
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{detail}
			</span>
		</div>
	);
}

function Field({
	label,
	placeholder,
	value,
	onChange,
	type = "text",
	mono,
	required,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	mono?: boolean;
	required?: boolean;
}) {
	return (
		<label className="block">
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
				{required && <span className="text-coral"> *</span>}
			</span>
			<Input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={cn(
					"mt-2 h-11 border-line bg-sand text-ink",
					mono && "font-mono"
				)}
			/>
		</label>
	);
}

function ReviewBlock({
	title,
	icon: Icon,
	children,
}: {
	title: string;
	icon: typeof Building2;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
			<div className="flex items-center gap-2">
				<Icon className="size-4 text-orange" />
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
					{title}
				</p>
			</div>
			<div className="mt-4 space-y-2.5">{children}</div>
		</div>
	);
}

function Row({
	label,
	value,
	mono,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="flex flex-wrap items-baseline justify-between gap-3 text-[12px]">
			<p className="text-ink-soft">{label}</p>
			<p className={cn("text-right text-ink", mono && "font-mono")}>{value}</p>
		</div>
	);
}