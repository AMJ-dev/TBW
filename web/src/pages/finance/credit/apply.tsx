
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertCircle,
	ArrowRight,
	Building2,
	Check,
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	FileCheck2,
	Landmark,
	Search,
	ShieldCheck,
	Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type ApplicationStep = "tier" | "references" | "review";

interface CreditTier {
	id: string;
	name: string;
	code: string;
	description: string;
	minimum_limit: number;
	maximum_limit: number;
	payment_duration: number;
	payment_unit: "DAYS" | "MONTHS" | "YEARS";
	interest_rate: number;
	grace_period: number;
	eligibility_duration: number;
	eligibility_unit: "DAYS" | "MONTHS" | "YEARS";
	minimum_transaction_volume: number;
	status: string;
}

const steps: { key: ApplicationStep; label: string; detail: string }[] = [
	{ key: "tier", label: "Credit tier", detail: "Choose your facility" },
	{ key: "references", label: "References", detail: "Bank and trade" },
	{ key: "review", label: "Review", detail: "Confirm application" },
];

const formatCurrency = (value: number | string) =>
	new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		maximumFractionDigits: 0,
	}).format(Number(value || 0));

const formatDuration = (value: number, unit: string) => {
	const normalized = unit.toLowerCase();
	return `${value} ${normalized}${value === 1 ? "" : "s"}`;
};

const getTiers = (payload: unknown): CreditTier[] => {
	if (Array.isArray(payload)) return payload as CreditTier[];

	if (payload && typeof payload === "object") {
		const data = payload as Record<string, unknown>;
		const tiers =
			data["credit_tiers"] ??
			data["creditTiers"] ??
			data["tiers"] ??
			data["items"] ??
			data["data"];

		if (Array.isArray(tiers)) return tiers as CreditTier[];
	}

	return [];
};

export default function FinanceCreditApplyRoute() {
	const [step, setStep] = useState<ApplicationStep>("tier");
	const [tiers, setTiers] = useState<CreditTier[]>([]);
	const [selectedTierId, setSelectedTierId] = useState("");
	const [search, setSearch] = useState("");
	const [showTierList, setShowTierList] = useState(false);
	const [loadingTiers, setLoadingTiers] = useState(true);

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

	useEffect(() => {
		const loadTiers = async () => {
			setLoadingTiers(true);

			try {
				const res = await http.get("/credit-tiers/active/");
				const resp: Resp = res.data;

				if (resp.error) {
					toast.error(String(resp.data || "Could not load credit tiers."));
					return;
				}

				const loaded = getTiers(resp.code).filter(
					(tier) => String(tier.status).toUpperCase() === "ACTIVE"
				);

				setTiers(loaded);

				const firstTier = loaded[0];
				if (firstTier) setSelectedTierId(firstTier.id);

			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Could not load credit tiers."
				);
			} finally {
				setLoadingTiers(false);
			}
		};

		loadTiers();
	}, []);

	const selectedTier = useMemo(
		() => tiers.find((tier) => tier.id === selectedTierId) ?? null,
		[tiers, selectedTierId]
	);

	const filteredTiers = useMemo(() => {
		const query = search.trim().toLowerCase();

		if (!query) return tiers;

		return tiers.filter(
			(tier) =>
				tier.name.toLowerCase().includes(query) ||
				tier.code.toLowerCase().includes(query) ||
				tier.description.toLowerCase().includes(query)
		);
	}, [tiers, search]);

	const visibleTiers = showTierList ? filteredTiers : filteredTiers.slice(0, 5);

	const currentIndex = steps.findIndex((item) => item.key === step);

	const goNext = () => {
		if (step === "tier") {
			if (!selectedTier) {
				toast.error("Please select a credit tier.");
				return;
			}

			const amount = Number(requestedAmount.replace(/,/g, ""));

			if (
				requestedAmount &&
				(!Number.isFinite(amount) ||
					amount < Number(selectedTier.minimum_limit) ||
					amount > Number(selectedTier.maximum_limit))
			) {
				toast.error(
					`Requested amount must be between ${formatCurrency(selectedTier.minimum_limit)} and ${formatCurrency(selectedTier.maximum_limit)}.`
				);
				return;
			}

			setStep("references");
			return;
		}

		if (step === "references") {
			if (!bankName.trim() || !bankAccount.trim() || !trade1.trim()) {
				toast.error(
					"Bank details and at least one trade reference are required."
				);
				return;
			}

			setStep("review");
		}
	};

	const goBack = () => {
		if (step === "references") setStep("tier");
		else if (step === "review") setStep("references");
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!selectedTier) {
			toast.error("Please select a credit tier.");
			return;
		}

		if (!acknowledged) {
			toast.error("Confirm the accuracy statement to submit.");
			return;
		}

		const requestedLimit = requestedAmount
			? Number(requestedAmount.replace(/,/g, ""))
			: Number(selectedTier.maximum_limit);

		const monthlySpend = averageMonthlySpend
			? Number(averageMonthlySpend.replace(/,/g, ""))
			: null;

		if (!Number.isFinite(requestedLimit) || requestedLimit <= 0) {
			toast.error("Enter a valid requested credit limit.");
			return;
		}

		if (
			monthlySpend !== null &&
			(!Number.isFinite(monthlySpend) || monthlySpend < 0)
		) {
			toast.error("Enter a valid average monthly spend.");
			return;
		}

		const payloads = {
			credit_tier_id: selectedTier.id,
			requested_limit: requestedLimit,
			average_monthly_spend: monthlySpend,
			bank_name: bankName.trim(),
			bank_account_number: bankAccount.trim(),
			bank_contact: bankContact.trim(),
			trade_reference_1: trade1.trim(),
			trade_reference_2: trade2.trim() || null,
			notes: notes.trim() || null,
		};

		setSubmitting(true);

		try {
			const res = await http.post("/credit/apply/", payloads);
			const resp: Resp = res.data;

			if (resp.error) {
				toast.error(String(resp.data || "Could not submit credit application."));
				return;
			}

			setSubmitted(true);
			toast.success(String(resp.data || "Credit application submitted successfully."));
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Could not submit credit application."
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (submitted && selectedTier) {
		return (
			<AppShell
				title="Credit application submitted"
				eyebrow="Finance workspace"
			>
				<div className="mx-auto max-w-2xl rounded-2xl bg-paper p-6 text-center ring-1 ring-line sm:p-10">
					<div className="mx-auto grid size-16 place-items-center rounded-full bg-orange text-white">
						<Check className="size-8" />
					</div>

					<p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-deep">
						Application submitted
					</p>

					<h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
						We have your application.
					</h2>

					<p className="mx-auto mt-4 max-w-md text-sm leading-7 text-ink-soft">
						The finance desk will review your request and follow up using your
						organisation's registered contact information.
					</p>

					<div className="mx-auto mt-7 max-w-md rounded-xl bg-sand p-5 text-left ring-1 ring-line">
						<ReviewRow label="Requested tier" value={selectedTier.name} />
						<ReviewRow
							label="Tier code"
							value={selectedTier.code}
							mono
						/>
						<ReviewRow
							label="Maximum facility"
							value={formatCurrency(selectedTier.maximum_limit)}
							mono
						/>
						<ReviewRow
							label="Requested amount"
							value={
								requestedAmount
									? formatCurrency(requestedAmount.replace(/,/g, ""))
									: "Not specified"
							}
							mono
						/>
					</div>

					<p className="mx-auto mt-6 max-w-md text-xs leading-5 text-ink-soft">
						Your credit facility will only become active after formal approval
						by the Finance Department.
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
			<div className="space-y-5">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
							Finance workspace · Credit facility
						</p>

						<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
							Apply for a credit facility
						</h2>

						<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
							Request a deferred payment facility on your account. Select a
							credit tier and provide the references required for assessment.
						</p>
					</div>

					<Link to="/portal/statement">
						<Button
							variant="outline"
							className="border-line bg-paper text-ink"
						>
							<FileCheck2 className="mr-1.5 size-4" />
							View statement
						</Button>
					</Link>
				</div>

				<div className="grid gap-5 xl:grid-cols-[250px_1fr]">
					<aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
						<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
								Application progress
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
									className="h-full rounded-full bg-orange transition-all duration-300"
									style={{
										width: `${((currentIndex + 1) / steps.length) * 100}%`,
									}}
								/>
							</div>

							<ol className="mt-6 space-y-1">
								{steps.map((item, index) => {
									const active = item.key === step;
									const done = index < currentIndex;

									return (
										<li key={item.key}>
											<button
												type="button"
												onClick={() => {
													if (done) setStep(item.key);
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
													{done ? <Check className="size-3.5" /> : index + 1}
												</span>

												<span className="min-w-0">
													<span className="block">{item.label}</span>
													<span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
														{item.detail}
													</span>
												</span>
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

							<p className="mt-3 text-xs leading-6 text-ink-soft">
								A credit officer reviews your selected facility, account
								activity and the references you provide. Approval is confirmed
								in writing before the facility becomes active.
							</p>
						</div>

						<div className="rounded-xl bg-slate p-5 text-sand ring-1 ring-slate">
							<div className="flex items-center gap-2">
								<ShieldCheck className="size-4 text-orange" />
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
									What we check
								</p>
							</div>

							<ul className="mt-3 space-y-2 text-xs leading-5 text-sand/75">
								<li className="flex items-start gap-2">
									<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
									Settled invoices and account activity
								</li>
								<li className="flex items-start gap-2">
									<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
									Bank and trade references
								</li>
								<li className="flex items-start gap-2">
									<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
									Requested facility limit
								</li>
							</ul>
						</div>
					</aside>

					<form onSubmit={handleSubmit} className="min-w-0 space-y-5">
						{step === "tier" && (
							<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-7">
								<SectionHeader
									title="Choose a credit tier"
									detail="Available facilities"
								/>

								<p className="text-sm leading-6 text-ink-soft">
									Select the facility that best suits your organisation.
									Compare the available limits and repayment terms before
									continuing.
								</p>

								<div className="mt-5">
									<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										<div>
											<p className="text-sm font-semibold text-ink">
												Available credit tiers
											</p>
											<p className="mt-1 text-xs text-ink-soft">
												{tiers.length} active {tiers.length === 1 ? "tier" : "tiers"} available
											</p>
										</div>

										<div className="relative w-full sm:max-w-xs">
											<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
											<Input
												value={search}
												onChange={(event) => setSearch(event.target.value)}
												placeholder="Search tiers..."
												className="h-10 border-line bg-sand pl-9 text-ink"
											/>
										</div>
									</div>

									{loadingTiers ? (
										<div className="mt-5 rounded-xl border border-line p-10 text-center">
											<div className="mx-auto size-7 animate-spin rounded-full border-2 border-line border-t-orange" />
											<p className="mt-3 text-sm text-ink-soft">
												Loading available credit tiers...
											</p>
										</div>
									) : tiers.length === 0 ? (
										<div className="mt-5 rounded-xl border border-line p-8 text-center">
											<AlertCircle className="mx-auto size-7 text-orange" />
											<p className="mt-3 text-sm font-semibold text-ink">
												No credit tiers available
											</p>
											<p className="mt-1 text-xs text-ink-soft">
												There are currently no active credit facilities available
												for applications.
											</p>
										</div>
									) : (
										<div className="mt-4 overflow-hidden rounded-xl border border-line">
											{filteredTiers.length === 0 ? (
												<div className="p-8 text-center text-sm text-ink-soft">
													No credit tiers match your search.
												</div>
											) : (
												<div className="max-h-[360px] divide-y divide-line overflow-y-auto">
													{visibleTiers.map((item) => {
														const active = selectedTierId === item.id;

														return (
															<button
																key={item.id}
																type="button"
																onClick={() => {
																	setSelectedTierId(item.id);
																	setRequestedAmount("");
																	setShowTierList(false);
																}}
																className={cn(
																	"flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-sand/70",
																	active && "bg-orange/5"
																)}
															>
																<span
																	className={cn(
																		"grid size-9 shrink-0 place-items-center rounded-lg",
																		active
																			? "bg-orange text-white"
																			: "bg-sand text-ink-soft"
																	)}
																>
																	<Wallet className="size-4" />
																</span>

																<span className="min-w-0 flex-1">
																	<span className="flex flex-wrap items-center gap-2">
																		<span className="text-sm font-semibold text-ink">
																			{item.name}
																		</span>
																		<span className="font-mono text-[9px] uppercase tracking-wider text-ink-soft">
																			{item.code}
																		</span>
																	</span>
																	<span className="mt-1 block truncate text-xs text-ink-soft">
																		{item.description}
																	</span>
																</span>

																<span className="hidden shrink-0 text-right sm:block">
																	<span className="block text-sm font-semibold text-ink">
																		{formatCurrency(item.maximum_limit)}
																	</span>
																	<span className="mt-1 block font-mono text-[9px] uppercase text-ink-soft">
																		Maximum limit
																	</span>
																</span>

																<span
																	className={cn(
																		"grid size-5 shrink-0 place-items-center rounded-full border",
																		active
																			? "border-orange bg-orange text-white"
																			: "border-line text-transparent"
																	)}
																>
																	<Check className="size-3" />
																</span>
															</button>
														);
													})}
												</div>
											)}

							{filteredTiers.length > 5 && (
								<div className="flex items-center justify-between border-t border-line bg-sand/60 px-4 py-2.5">
									<p className="font-mono text-[10px] text-ink-soft">
										Showing {visibleTiers.length} of {filteredTiers.length} tiers
									</p>
									<button
										type="button"
										onClick={() => setShowTierList((value) => !value)}
										className="text-[11px] font-semibold text-orange-deep"
									>
										{showTierList ? "Show less" : "Show list"}
									</button>
								</div>
							)}
										</div>
									)}
								</div>

								{selectedTier && (
									<div className="mt-5 rounded-xl border border-orange/40 bg-orange/5 p-4 sm:p-5">
										<div className="flex flex-wrap items-start justify-between gap-3">
											<div>
												<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-deep">
													Selected credit tier
												</p>
												<h3 className="mt-1 text-lg font-bold text-ink">
													{selectedTier.name}
												</h3>
												<p className="mt-1 font-mono text-[10px] text-ink-soft">
													{selectedTier.code}
												</p>
											</div>

											<span className="inline-flex items-center gap-1.5 rounded-full bg-orange px-3 py-1 text-[10px] font-semibold text-white">
												<CheckCircle2 className="size-3.5" />
												Selected
											</span>
										</div>

										<p className="mt-4 text-xs leading-6 text-ink-soft">
											{selectedTier.description}
										</p>

										<div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
											<DetailMetric
												label="Minimum limit"
												value={formatCurrency(selectedTier.minimum_limit)}
											/>
											<DetailMetric
												label="Maximum limit"
												value={formatCurrency(selectedTier.maximum_limit)}
												highlight
											/>
											<DetailMetric
												label="Interest rate"
												value={`${selectedTier.interest_rate}%`}
											/>
											<DetailMetric
												label="Repayment period"
												value={formatDuration(
													selectedTier.payment_duration,
													selectedTier.payment_unit
												)}
											/>
											<DetailMetric
												label="Grace period"
												value={`${selectedTier.grace_period} days`}
											/>
											<DetailMetric
												label="Trading history"
												value={formatDuration(
													selectedTier.eligibility_duration,
													selectedTier.eligibility_unit
												)}
											/>
										</div>

										<div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-orange/15 pt-4">
											<p className="text-xs text-ink-soft">
												Minimum transaction volume
											</p>
											<p className="font-mono text-sm font-semibold text-ink">
												{formatCurrency(selectedTier.minimum_transaction_volume)}
											</p>
										</div>

										<button
											type="button"
											onClick={() => setShowTierList((value) => !value)}
											className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-orange-deep"
										>
											{showTierList ? "Close tier selector" : "Change selected tier"}
											<ChevronDown
												className={cn(
													"size-4 transition-transform",
													!showTierList && "-rotate-90"
												)}
											/>
										</button>
									</div>
								)}

								{selectedTier && (
									<div className="mt-5 grid gap-4 sm:grid-cols-2">
										<Field
											label="Requested limit (optional)"
											placeholder={String(selectedTier.maximum_limit)}
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
								)}

								{selectedTier && (
									<p className="mt-3 text-xs leading-5 text-ink-soft">
										Your requested amount must be within the selected tier's
										minimum and maximum limits. Final approval is subject to
										Finance review.
									</p>
								)}

								<div className="mt-6 border-t border-line pt-5">
									<div className="flex justify-end">
										<Button
											type="button"
											disabled={!selectedTier || loadingTiers}
											onClick={goNext}
											className="bg-orange text-white hover:bg-orange-deep"
										>
											Continue to references <ArrowRight />
										</Button>
									</div>
								</div>
							</section>
						)}

						{step === "references" && (
							<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-7">
								<SectionHeader
									title="References"
									detail="Bank and trade"
								/>

								<p className="text-sm leading-6 text-ink-soft">
									Provide your bank details and at least one trade reference.
									These details help the Finance Department assess your
									application.
								</p>

								<div className="mt-6">
									<div className="flex items-center gap-2">
										<Landmark className="size-4 text-orange" />
										<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Bank reference
										</p>
									</div>

									<div className="mt-4 grid gap-4 sm:grid-cols-3">
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

								<div className="mt-7 border-t border-line pt-6">
									<div className="flex items-center gap-2">
										<Building2 className="size-4 text-orange" />
										<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Trade references
										</p>
									</div>

									<div className="mt-4 grid gap-4 sm:grid-cols-2">
										<Field
											label="Trade reference 1"
											placeholder="Company name and account reference"
											value={trade1}
											onChange={setTrade1}
											required
										/>
										<Field
											label="Trade reference 2 (optional)"
											placeholder="Company name and account reference"
											value={trade2}
											onChange={setTrade2}
										/>
									</div>
								</div>

								<div className="mt-6 rounded-xl bg-sand p-4 ring-1 ring-line">
									<div className="flex items-start gap-3">
										<ShieldCheck className="mt-0.5 size-4 shrink-0 text-orange" />
										<div>
											<p className="text-sm font-semibold text-ink">
												How references are used
											</p>
											<p className="mt-1 text-xs leading-5 text-ink-soft">
												The Finance Department may contact the bank and trade
												references directly to verify the information provided.
											</p>
										</div>
									</div>
								</div>

								<div className="mt-6">
									<label className="block">
										<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Additional notes (optional)
										</span>
										<textarea
											value={notes}
											onChange={(event) => setNotes(event.target.value)}
											className="mt-2 min-h-28 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
											placeholder="Share any relevant context about your expected cargo volumes, business activity or payment requirements."
										/>
									</label>
								</div>

								<div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
									<Button
										type="button"
										variant="ghost"
										onClick={goBack}
										className="text-ink-soft"
									>
										<ChevronLeft className="mr-1 size-4" />
										Back
									</Button>

									<Button
										type="button"
										onClick={goNext}
										className="bg-orange text-white hover:bg-orange-deep"
									>
										Review application <ArrowRight />
									</Button>
								</div>
							</section>
						)}

						{step === "review" && selectedTier && (
							<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-7">
								<SectionHeader
									title="Review application"
									detail="Confirm your details"
								/>

								<div className="space-y-4">
									<ReviewBlock title="Selected facility" icon={Wallet}>
										<ReviewRow label="Tier" value={selectedTier.name} />
										<ReviewRow label="Tier code" value={selectedTier.code} mono />
										<ReviewRow
											label="Minimum limit"
											value={formatCurrency(selectedTier.minimum_limit)}
											mono
										/>
										<ReviewRow
											label="Maximum limit"
											value={formatCurrency(selectedTier.maximum_limit)}
											mono
										/>
										<ReviewRow
											label="Interest rate"
											value={`${selectedTier.interest_rate}%`}
										/>
										<ReviewRow
											label="Payment period"
											value={formatDuration(
												selectedTier.payment_duration,
												selectedTier.payment_unit
											)}
										/>
										{requestedAmount && (
											<ReviewRow
												label="Requested limit"
												value={formatCurrency(requestedAmount.replace(/,/g, ""))}
												mono
											/>
										)}
										{averageMonthlySpend && (
											<ReviewRow
												label="Average monthly spend"
												value={formatCurrency(
													averageMonthlySpend.replace(/,/g, "")
												)}
												mono
											/>
										)}
									</ReviewBlock>

									<ReviewBlock title="Bank reference" icon={Landmark}>
										<ReviewRow label="Bank" value={bankName} />
										<ReviewRow label="Account number" value={bankAccount} mono />
										<ReviewRow label="Bank contact" value={bankContact || "—"} />
									</ReviewBlock>

									<ReviewBlock title="Trade references" icon={Building2}>
										<ReviewRow label="Reference 1" value={trade1} />
										<ReviewRow label="Reference 2" value={trade2 || "—"} />
									</ReviewBlock>

									{notes && (
										<ReviewBlock title="Additional notes" icon={FileCheck2}>
											<p className="text-xs leading-6 text-ink-soft">{notes}</p>
										</ReviewBlock>
									)}
								</div>

								<label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
									<input
										type="checkbox"
										checked={acknowledged}
										onChange={(event) =>
											setAcknowledged(event.target.checked)
										}
										className="mt-0.5 size-4 shrink-0 accent-orange"
									/>
									<span className="text-xs leading-6 text-ink">
										I confirm that the details provided are accurate and
										authorise TRINŪ to contact the bank and trade references
										listed. I understand that approval is subject to the
										Finance Department's assessment.
									</span>
								</label>

								<div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
									<Button
										type="button"
										variant="ghost"
										onClick={goBack}
										className="text-ink-soft"
									>
										<ChevronLeft className="mr-1 size-4" />
										Back
									</Button>

									<Button
										type="submit"
										disabled={submitting || !acknowledged}
										className={cn(
											"bg-orange text-white hover:bg-orange-deep",
											(submitting || !acknowledged) && "opacity-60"
										)}
									>
										{submitting ? "Submitting application..." : "Submit application"}
										{!submitting && <ArrowRight />}
									</Button>
								</div>
							</section>
						)}
					</form>
				</div>
			</div>
		</AppShell>
	);
}

function SectionHeader({
	title,
	detail,
}: {
	title: string;
	detail: string;
}) {
	return (
		<div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
			<h3 className="font-display text-base font-bold tracking-tight text-ink">
				{title}
			</h3>
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{detail}
			</span>
		</div>
	);
}

function DetailMetric({
	label,
	value,
	highlight,
}: {
	label: string;
	value: string;
	highlight?: boolean;
}) {
	return (
		<div className="rounded-lg bg-paper p-3 ring-1 ring-line">
			<p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
				{label}
			</p>
			<p
				className={cn(
					"mt-2 break-words text-sm font-semibold text-ink",
					highlight && "text-orange-deep"
				)}
			>
				{value}
			</p>
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
	onChange: (value: string) => void;
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
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				required={required}
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
			<div className="mt-4 space-y-3">{children}</div>
		</div>
	);
}

function ReviewRow({
	label,
	value,
	mono,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="flex flex-wrap items-baseline justify-between gap-3 text-xs">
			<p className="text-ink-soft">{label}</p>
			<p className={cn("text-right text-ink", mono && "font-mono")}>
				{value}
			</p>
		</div>
	);
}
