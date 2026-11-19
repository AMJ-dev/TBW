
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
	ArrowLeft,
	ArrowRight,
	Check,
	Clock3,
	CreditCard,
	Info,
	ShieldCheck,
	Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {format_currency} from "@/lib/functions"

type CreditTierStatus = "Active" | "Inactive";

interface CreditTierForm {
	name: string;
	code: string;
	description: string;
	minimumLimit: string;
	maximumLimit: string;
	paymentDays: string;
	interestRate: string;
	gracePeriod: string;
	eligibilityMonths: string;
	minimumTransactionVolume: string;
	status: CreditTierStatus;
	eligibilityRequirements: string;
	internalNotes: string;
}

const emptyForm: CreditTierForm = {
	name: "",
	code: "",
	description: "",
	minimumLimit: "",
	maximumLimit: "",
	paymentDays: "14",
	interestRate: "0",
	gracePeriod: "0",
	eligibilityMonths: "0",
	minimumTransactionVolume: "",
	status: "Active",
	eligibilityRequirements: "",
	internalNotes: "",
};

const sampleTiers: Record<string, CreditTierForm> = {
	starter: {
		name: "Starter",
		code: "STARTER",
		description:
			"Entry-level credit facility for organisations establishing a payment history with the terminal.",
		minimumLimit: "500000",
		maximumLimit: "2000000",
		paymentDays: "14",
		interestRate: "0",
		gracePeriod: "0",
		eligibilityMonths: "0",
		minimumTransactionVolume: "",
		status: "Active",
		eligibilityRequirements:
			"Valid business registration and an active organisation account.",
		internalNotes: "",
	},
	standard: {
		name: "Standard",
		code: "STANDARD",
		description:
			"Credit facility for established organisations with a consistent transaction and payment history.",
		minimumLimit: "2000000",
		maximumLimit: "10000000",
		paymentDays: "21",
		interestRate: "0",
		gracePeriod: "0",
		eligibilityMonths: "3",
		minimumTransactionVolume: "5000000",
		status: "Active",
		eligibilityRequirements:
			"At least 3 months of trading history and settled invoices.",
		internalNotes: "",
	},
	corporate: {
		name: "Corporate",
		code: "CORPORATE",
		description:
			"Extended credit facility for high-volume organisations with an established business relationship.",
		minimumLimit: "10000000",
		maximumLimit: "50000000",
		paymentDays: "30",
		interestRate: "0",
		gracePeriod: "0",
		eligibilityMonths: "6",
		minimumTransactionVolume: "20000000",
		status: "Active",
		eligibilityRequirements:
			"Established trading history, satisfactory payment record and finance approval.",
		internalNotes: "",
	},
};

export default function FinanceCreditTierFormPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const isEdit = Boolean(id);

	const [form, setForm] = useState<CreditTierForm>(emptyForm);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (id && sampleTiers[id]) {
			setForm({ ...sampleTiers[id] });
		} else {
			setForm({ ...emptyForm });
		}
	}, [id]);

	const updateField = <K extends keyof CreditTierForm>(
		field: K,
		value: CreditTierForm[K]
	) => {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!form.name.trim()) {
			toast.error("Enter the credit tier name.");
			return;
		}

		if (!form.code.trim()) {
			toast.error("Enter a credit tier code.");
			return;
		}

		const minimum = Number(form.minimumLimit.replace(/,/g, ""));
		const maximum = Number(form.maximumLimit.replace(/,/g, ""));

		if (!minimum || !maximum || minimum < 0 || maximum < minimum) {
			toast.error("Enter valid minimum and maximum credit limits.");
			return;
		}

		if (Number(form.paymentDays) < 1) {
			toast.error("Payment terms must be at least 1 day.");
			return;
		}

		if (
			Number(form.interestRate) < 0 ||
			Number(form.gracePeriod) < 0 ||
			Number(form.eligibilityMonths) < 0
		) {
			toast.error("Review the numeric values entered.");
			return;
		}

		setSaving(true);

		setTimeout(() => {
			setSaving(false);
			toast.success(
				isEdit
					? "Credit tier updated successfully."
					: "Credit tier created successfully."
			);
			navigate("/finance/credit-tiers");
		}, 500);
	};

	return (
		<AppShell
			title={isEdit ? "Edit credit tier" : "Create credit tier"}
			eyebrow="Finance · Credit configuration"
		>
			<div className="space-y-5">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
							Finance workspace · Credit configuration
						</p>
						<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
							{isEdit ? "Edit credit tier" : "Create credit tier"}
						</h2>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
							{isEdit
								? "Update the credit facility limits, repayment terms and eligibility requirements."
								: "Configure a new credit facility that can be assigned to eligible organisations."}
						</p>
					</div>

					<Link to="/finance/credit-tiers">
						<Button
							variant="outline"
							className="border-line bg-paper text-ink"
						>
							<ArrowLeft className="mr-1.5 size-4" />
							Back to credit tiers
						</Button>
					</Link>
				</div>

				<div className="grid gap-5 xl:grid-cols-[1fr_310px]">
					<form onSubmit={handleSubmit} className="space-y-5">
						<section className="rounded-xl bg-paper ring-1 ring-line">
							<SectionHeader
								title="Basic information"
								detail="Credit tier details"
							/>

							<div className="grid gap-5 p-5 pt-0 sm:grid-cols-2">
								<Field
									label="Tier name"
									value={form.name}
									onChange={(value) => updateField("name", value)}
									placeholder="e.g. Starter"
									required
								/>

								<Field
									label="Tier code"
									value={form.code}
									onChange={(value) =>
										updateField(
											"code",
											value.toUpperCase().replace(/\s/g, "_")
										)
									}
									placeholder="e.g. STARTER"
									required
									mono
								/>

								<div className="sm:col-span-2">
									<label className="block">
										<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Description
											<span className="text-coral"> *</span>
										</span>
										<textarea
											value={form.description}
											onChange={(e) =>
												updateField("description", e.target.value)
											}
											placeholder="Describe the organisations this credit tier is intended for..."
											className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
											required
										/>
									</label>
								</div>

								<div>
									<label className="block">
										<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Status
										</span>
										<select
											value={form.status}
											onChange={(e) =>
												updateField(
													"status",
													e.target.value as CreditTierStatus
												)
											}
											className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/30"
										>
											<option value="Active">Active</option>
											<option value="Inactive">Inactive</option>
										</select>
									</label>
								</div>
							</div>
						</section>

						<section className="rounded-xl bg-paper ring-1 ring-line">
							<SectionHeader
								title="Credit limits"
								detail="Facility amount"
							/>

							<div className="grid gap-5 p-5 pt-0 sm:grid-cols-2">
								<Field
									label="Minimum credit limit"
									value={form.minimumLimit}
									onChange={(value) =>
										updateField("minimumLimit", value)
									}
									placeholder="e.g. 500000"
									required
									mono
									prefix="₦"
									type="number"
								/>

								<Field
									label="Maximum credit limit"
									value={form.maximumLimit}
									onChange={(value) =>
										updateField("maximumLimit", value)
									}
									placeholder="e.g. 2000000"
									required
									mono
									prefix="₦"
									type="number"
								/>

								<div className="sm:col-span-2 rounded-lg bg-sand p-4 ring-1 ring-line">
									<div className="flex items-start gap-3">
										<Wallet className="mt-0.5 size-4 shrink-0 text-orange" />
										<div>
											<p className="text-[12px] font-semibold text-ink">
												Credit facility range
											</p>
											<p className="mt-1 text-[12px] text-ink-soft">
												{form.minimumLimit && form.maximumLimit
													? `${format_currency(form.minimumLimit)} to ${format_currency(form.maximumLimit)}`
													: "Enter the minimum and maximum credit amounts to preview the facility range."}
											</p>
										</div>
									</div>
								</div>
							</div>
						</section>

						<section className="rounded-xl bg-paper ring-1 ring-line">
							<SectionHeader
								title="Repayment terms"
								detail="Payment conditions"
							/>

							<div className="grid gap-5 p-5 pt-0 sm:grid-cols-2">
								<Field
									label="Payment period"
									value={form.paymentDays}
									onChange={(value) => updateField("paymentDays", value)}
									placeholder="14"
									required
									suffix="Days"
									type="number"
								/>

								<Field
									label="Grace period"
									value={form.gracePeriod}
									onChange={(value) => updateField("gracePeriod", value)}
									placeholder="0"
									suffix="Days"
									type="number"
								/>

								<Field
									label="Interest rate"
									value={form.interestRate}
									onChange={(value) => updateField("interestRate", value)}
									placeholder="0"
									suffix="%"
									type="number"
								/>

								<div className="rounded-lg bg-sand p-4 ring-1 ring-line">
									<div className="flex items-center gap-2">
										<Clock3 className="size-4 text-orange" />
										<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Repayment summary
										</p>
									</div>
									<p className="mt-2 font-display text-2xl font-bold text-ink">
										{form.paymentDays || "0"} days
									</p>
									<p className="mt-1 text-[11px] text-ink-soft">
										{form.gracePeriod || "0"} additional grace days
									</p>
								</div>
							</div>
						</section>

						<section className="rounded-xl bg-paper ring-1 ring-line">
							<SectionHeader
								title="Eligibility requirements"
								detail="Organisation qualification"
							/>

							<div className="grid gap-5 p-5 pt-0 sm:grid-cols-2">
								<Field
									label="Minimum trading history"
									value={form.eligibilityMonths}
									onChange={(value) =>
										updateField("eligibilityMonths", value)
									}
									placeholder="e.g. 3"
									suffix="Months"
									type="number"
								/>

								<Field
									label="Minimum transaction volume"
									value={form.minimumTransactionVolume}
									onChange={(value) =>
										updateField("minimumTransactionVolume", value)
									}
									placeholder="e.g. 5000000"
									prefix="₦"
									type="number"
								/>

								<div className="sm:col-span-2">
									<label className="block">
										<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Additional requirements
										</span>
										<textarea
											value={form.eligibilityRequirements}
											onChange={(e) =>
												updateField(
													"eligibilityRequirements",
													e.target.value
												)
											}
											placeholder="Specify any additional requirements an organisation must meet..."
											className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
										/>
									</label>
								</div>
							</div>
						</section>

						<section className="rounded-xl bg-paper ring-1 ring-line">
							<SectionHeader
								title="Internal notes"
								detail="Finance use only"
							/>

							<div className="p-5 pt-0">
								<label className="block">
									<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Notes
									</span>
									<textarea
										value={form.internalNotes}
										onChange={(e) =>
											updateField("internalNotes", e.target.value)
										}
										placeholder="Add internal information about this credit tier..."
										className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
									/>
								</label>
							</div>
						</section>

						<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-paper p-4 ring-1 ring-line">
							<Link to="/finance/credit-tiers">
								<Button
									type="button"
									variant="ghost"
									className="text-ink-soft"
								>
									Cancel
								</Button>
							</Link>

							<Button
								type="submit"
								disabled={saving}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								{saving
									? "Saving..."
									: isEdit
										? "Save changes"
										: "Create credit tier"}
								{!saving && <ArrowRight className="ml-1.5 size-4" />}
							</Button>
						</div>
					</form>

					<aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
						<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
								Live preview
							</p>

							<div className="mt-4 flex items-center gap-3">
								<div className="grid size-11 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
									<CreditCard className="size-5" />
								</div>
								<div className="min-w-0">
									<p className="truncate font-display text-lg font-bold text-ink">
										{form.name || "New credit tier"}
									</p>
									<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										{form.code || "TIER CODE"}
									</p>
								</div>
							</div>

							<div className="mt-4 border-t border-line pt-4">
								<p className="text-[11px] text-ink-soft">
									Maximum facility
								</p>
								<p className="mt-1 font-display text-2xl font-bold text-ink">
									{form.maximumLimit
										? format_currency(form.maximumLimit)
										: "₦0"}
								</p>
								<p className="mt-1 text-[11px] text-ink-soft">
									Minimum:{" "}
									{form.minimumLimit
										? format_currency(form.minimumLimit)
										: "Not set"}
								</p>
							</div>

							<div className="mt-4 grid grid-cols-2 gap-3">
								<div className="rounded-lg bg-sand p-3">
									<p className="text-[10px] text-ink-soft">Payment terms</p>
									<p className="mt-1 font-semibold text-ink">
										{form.paymentDays || "0"} days
									</p>
								</div>
								<div className="rounded-lg bg-sand p-3">
									<p className="text-[10px] text-ink-soft">Interest rate</p>
									<p className="mt-1 font-semibold text-ink">
										{form.interestRate || "0"}%
									</p>
								</div>
							</div>

							<div className="mt-4 flex items-center justify-between border-t border-line pt-4">
								<span className="text-[11px] text-ink-soft">
									Availability
								</span>
								<span
									className={cn(
										"rounded-md px-2.5 py-1 text-[10px] font-semibold",
										form.status === "Active"
											? "bg-teal/10 text-teal-deep"
											: "bg-sand text-ink-soft"
									)}
								>
									{form.status}
								</span>
							</div>
						</div>

						<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
							<div className="flex items-center gap-2">
								<ShieldCheck className="size-4 text-orange" />
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-deep">
									Important
								</p>
							</div>

							<ul className="mt-4 space-y-3 text-[12px] leading-5 text-ink-soft">
								<li className="flex items-start gap-2">
									<Check className="mt-0.5 size-3.5 shrink-0 text-teal" />
									Define a minimum and maximum facility limit.
								</li>
								<li className="flex items-start gap-2">
									<Check className="mt-0.5 size-3.5 shrink-0 text-teal" />
									Set clear repayment terms for the organisation.
								</li>
								<li className="flex items-start gap-2">
									<Check className="mt-0.5 size-3.5 shrink-0 text-teal" />
									Specify eligibility requirements for the tier.
								</li>
								<li className="flex items-start gap-2">
									<Info className="mt-0.5 size-3.5 shrink-0 text-orange" />
									Deactivating a tier should not automatically cancel existing approved credit facilities.
								</li>
							</ul>
						</div>
					</aside>
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
		<div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
			<h3 className="font-display text-sm font-bold tracking-tight text-ink">
				{title}
			</h3>
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{detail}
			</span>
		</div>
	);
}

function Field({
	label,
	value,
	onChange,
	placeholder,
	type = "text",
	required,
	mono,
	prefix,
	suffix,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	type?: string;
	required?: boolean;
	mono?: boolean;
	prefix?: string;
	suffix?: string;
}) {
	return (
		<label className="block min-w-0">
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
				{required && <span className="text-coral"> *</span>}
			</span>

			<div className="relative mt-2">
				{prefix && (
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
						{prefix}
					</span>
				)}

				<Input
					type={type}
					min={type === "number" ? 0 : undefined}
					step={type === "number" ? "any" : undefined}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					required={required}
					className={cn(
						"h-11 border-line bg-sand text-ink",
						mono && "font-mono",
						prefix && "pl-8",
						suffix && "pr-14"
					)}
				/>

				{suffix && (
					<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-soft">
						{suffix}
					</span>
				)}
			</div>
		</label>
	);
}
