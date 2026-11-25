
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
import { format_currency } from "@/lib/functions";
import { http, type Resp } from "@/lib/httpClient";

type CreditTierStatus = "Active" | "Inactive";
type DurationUnit = "DAYS" | "MONTHS" | "YEARS";

interface CreditTierForm {
	name: string;
	code: string;
	description: string;
	minimumLimit: string;
	maximumLimit: string;
	paymentDuration: string;
	paymentUnit: DurationUnit;
	interestRate: string;
	gracePeriod: string;
	eligibilityDuration: string;
	eligibilityUnit: DurationUnit;
	minimumTransactionVolume: string;
	status: CreditTierStatus;
	internalNotes: string;
}

interface ApiCreditTier {
	id: string;
	name: string;
	code: string;
	description: string;
	minimum_limit: string | number;
	maximum_limit: string | number;
	payment_duration: string | number;
	payment_unit: DurationUnit;
	interest_rate: string | number;
	grace_period: string | number;
	eligibility_duration: string | number;
	eligibility_unit: DurationUnit;
	minimum_transaction_volume: string | number;
	status: string;
	internal_notes: string;
}

const emptyForm: CreditTierForm = {
	name: "",
	code: "",
	description: "",
	minimumLimit: "",
	maximumLimit: "",
	paymentDuration: "14",
	paymentUnit: "DAYS",
	interestRate: "0",
	gracePeriod: "0",
	eligibilityDuration: "0",
	eligibilityUnit: "MONTHS",
	minimumTransactionVolume: "",
	status: "Active",
	internalNotes: "",
};

const durationUnits: { label: string; value: DurationUnit }[] = [
	{ label: "Days", value: "DAYS" },
	{ label: "Months", value: "MONTHS" },
	{ label: "Years", value: "YEARS" },
];

function normaliseUnit(value?: string): DurationUnit {
	const unit = value?.toUpperCase();

	if (unit === "DAYS" || unit === "DAY") return "DAYS";
	if (unit === "YEARS" || unit === "YEAR") return "YEARS";
	return "MONTHS";
}

function formatDuration(value: string, unit: DurationUnit) {
	const amount = Number(value || 0);
	const label =
		amount === 1
			? unit === "DAYS"
				? "day"
				: unit === "MONTHS"
					? "month"
					: "year"
			: unit.toLowerCase();

	return `${amount} ${label}`;
}

function getApiTier(payload: unknown): ApiCreditTier | null {
	if (!payload || typeof payload !== "object") return null;

	const data = payload as Record<string, unknown>;

	const tier = (
		data["credit_tier"] ??
		data["creditTier"] ??
		data
	) as Record<string, unknown>;

	if (!tier || typeof tier !== "object" || !tier["id"]) return null;

	return tier as unknown as ApiCreditTier;
}

export default function FinanceCreditTierFormPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const isEdit = Boolean(id);

	const [form, setForm] = useState<CreditTierForm>(emptyForm);
	const [saving, setSaving] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!id) {
			setForm({ ...emptyForm });
			return;
		}

		const fetchCreditTier = async () => {
			setLoading(true);

			try {
				const res = await http.get(`/credit-tiers/${id}/`);
				const resp: Resp = res.data;

				if (resp.error) {
					toast.error(String(resp.data || "Could not load credit tier."));
					return;
				}

				const tier = getApiTier(resp.code);

				if (!tier) {
					toast.error("Credit tier details were not returned.");
					return;
				}

				setForm({
					name: String(tier.name ?? ""),
					code: String(tier.code ?? ""),
					description: String(tier.description ?? ""),
					minimumLimit: String(tier.minimum_limit ?? ""),
					maximumLimit: String(tier.maximum_limit ?? ""),
					paymentDuration: String(tier.payment_duration ?? "14"),
					paymentUnit: normaliseUnit(tier.payment_unit),
					interestRate: String(tier.interest_rate ?? "0"),
					gracePeriod: String(tier.grace_period ?? "0"),
					eligibilityDuration: String(tier.eligibility_duration ?? "0"),
					eligibilityUnit: normaliseUnit(tier.eligibility_unit),
					minimumTransactionVolume: String(tier.minimum_transaction_volume ?? ""),
					status: String(tier.status).toUpperCase() === "INACTIVE" ? "Inactive" : "Active",
					internalNotes: String(tier.internal_notes ?? ""),
				});
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Could not load credit tier."
				);
			} finally {
				setLoading(false);
			}
		};

		fetchCreditTier();
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

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!form.name.trim()) {
			toast.error("Enter the credit tier name.");
			return;
		}

		if (!form.code.trim()) {
			toast.error("Enter a credit tier code.");
			return;
		}

		if (!form.description.trim()) {
			toast.error("Enter a description for this credit tier.");
			return;
		}

		const minimum = Number(form.minimumLimit.replace(/,/g, ""));
		const maximum = Number(form.maximumLimit.replace(/,/g, ""));
		const paymentDuration = Number(form.paymentDuration);
		const interestRate = Number(form.interestRate);
		const gracePeriod = Number(form.gracePeriod);
		const eligibilityDuration = Number(form.eligibilityDuration);
		const minimumTransactionVolume = Number(
			form.minimumTransactionVolume || 0
		);

		if (
			!Number.isFinite(minimum) ||
			!Number.isFinite(maximum) ||
			minimum <= 0 ||
			maximum <= 0 ||
			maximum < minimum
		) {
			toast.error("Enter valid minimum and maximum credit limits.");
			return;
		}

		if (!Number.isFinite(paymentDuration) || paymentDuration < 1) {
			toast.error("Payment period must be at least 1.");
			return;
		}

		if (
			!Number.isFinite(interestRate) ||
			!Number.isFinite(gracePeriod) ||
			!Number.isFinite(eligibilityDuration) ||
			!Number.isFinite(minimumTransactionVolume) ||
			interestRate < 0 ||
			gracePeriod < 0 ||
			eligibilityDuration < 0 ||
			minimumTransactionVolume < 0
		) {
			toast.error("Review the numeric values entered.");
			return;
		}

		const formData: Record<string, string | number> = {
			name: form.name.trim(),
			code: form.code.trim().toUpperCase(),
			description: form.description.trim(),
			minimum_limit: minimum,
			maximum_limit: maximum,
			payment_duration: paymentDuration,
			payment_unit: form.paymentUnit,
			interest_rate: interestRate,
			grace_period: gracePeriod,
			eligibility_duration: eligibilityDuration,
			eligibility_unit: form.eligibilityUnit,
			minimum_transaction_volume: minimumTransactionVolume,
			status: form.status.toUpperCase(),
			internal_notes: form.internalNotes.trim(),
		};

		if (isEdit && id) formData["id"] = id;

		setSaving(true);

		try {
			const res = isEdit
				? await http.post("/credit-tiers/update/", formData)
				: await http.post("/credit-tiers/save/", formData);

			const resp: Resp = res.data;

			if (resp.error) {
				toast.error(
					String(
						resp.data ||
							(isEdit
								? "Could not update credit tier."
								: "Could not create credit tier.")
					)
				);
				return;
			}

			toast.success(
				String(
					resp.data ||
						(isEdit
							? "Credit tier updated successfully."
							: "Credit tier created successfully.")
				)
			);

			navigate("/finance/credit-tiers");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "An unexpected error occurred."
			);
		} finally {
			setSaving(false);
		}
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

				{loading ? (
					<div className="rounded-xl bg-paper p-10 text-center ring-1 ring-line">
						<div className="mx-auto size-7 animate-spin rounded-full border-2 border-line border-t-orange" />
						<p className="mt-3 text-sm text-ink-soft">
							Loading credit tier...
						</p>
					</div>
				) : (
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

									<div className="rounded-lg bg-sand p-4 ring-1 ring-line sm:col-span-2">
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
									<DurationField
										label="Payment period"
										value={form.paymentDuration}
										unit={form.paymentUnit}
										onValueChange={(value) =>
											updateField("paymentDuration", value)
										}
										onUnitChange={(value) =>
											updateField("paymentUnit", value)
										}
										placeholder="14"
										required
									/>

									<Field
										label="Grace period"
										value={form.gracePeriod}
										onChange={(value) =>
											updateField("gracePeriod", value)
										}
										placeholder="0"
										suffix="Days"
										type="number"
									/>

									<Field
										label="Interest rate"
										value={form.interestRate}
										onChange={(value) =>
											updateField("interestRate", value)
										}
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
											{formatDuration(
												form.paymentDuration,
												form.paymentUnit
											)}
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
									<DurationField
										label="Minimum trading history"
										value={form.eligibilityDuration}
										unit={form.eligibilityUnit}
										onValueChange={(value) =>
											updateField("eligibilityDuration", value)
										}
										onUnitChange={(value) =>
											updateField("eligibilityUnit", value)
										}
										placeholder="e.g. 3"
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
										<p className="text-[10px] text-ink-soft">
											Payment terms
										</p>
										<p className="mt-1 font-semibold text-ink">
											{formatDuration(
												form.paymentDuration,
												form.paymentUnit
											)}
										</p>
									</div>
									<div className="rounded-lg bg-sand p-3">
										<p className="text-[10px] text-ink-soft">
											Interest rate
										</p>
										<p className="mt-1 font-semibold text-ink">
											{form.interestRate || "0"}%
										</p>
									</div>
								</div>

								<div className="mt-4 rounded-lg bg-sand p-3">
									<p className="text-[10px] text-ink-soft">
										Minimum trading history
									</p>
									<p className="mt-1 font-semibold text-ink">
										{formatDuration(
											form.eligibilityDuration,
											form.eligibilityUnit
										)}
									</p>
								</div>

								<div className="mt-4 flex items-center justify-between border-t border-line pt-4">
									<span className="text-[11px] text-ink-soft">
										Availability
									</span>
									<span
										className={cn(
											"rounded-md px-2.5 py-1 text-[10px] font-semibold",
											form.status === "Active"
												? "bg-orange/10 text-orange-deep"
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
										<Check className="mt-0.5 size-3.5 shrink-0 text-orange" />
										Define a minimum and maximum facility limit.
									</li>
									<li className="flex items-start gap-2">
										<Check className="mt-0.5 size-3.5 shrink-0 text-orange" />
										Set clear repayment terms for the organisation.
									</li>
									<li className="flex items-start gap-2">
										<Check className="mt-0.5 size-3.5 shrink-0 text-orange" />
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
				)}
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

function DurationField({
	label,
	value,
	unit,
	onValueChange,
	onUnitChange,
	placeholder,
	required,
}: {
	label: string;
	value: string;
	unit: DurationUnit;
	onValueChange: (value: string) => void;
	onUnitChange: (value: DurationUnit) => void;
	placeholder: string;
	required?: boolean;
}) {
	return (
		<div className="min-w-0">
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
				{required && <span className="text-coral"> *</span>}
			</span>

			<div className="mt-2 grid grid-cols-[1fr_120px] gap-2">
				<Input
					type="number"
					min={required ? 1 : 0}
					step="1"
					value={value}
					onChange={(e) => onValueChange(e.target.value)}
					placeholder={placeholder}
					required={required}
					className="h-11 border-line bg-sand text-ink"
				/>

				<select
					value={unit}
					onChange={(e) =>
						onUnitChange(e.target.value as DurationUnit)
					}
					className="h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/30"
				>
					{durationUnits.map((item) => (
						<option key={item.value} value={item.value}>
							{item.label}
						</option>
					))}
				</select>
			</div>
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
