import { useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Calculator,
	Check,
	FileText,
	HelpCircle,
	Receipt,
	Upload,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalFilePicker } from "@/components/ui/local-file-picker";
import { cn } from "@/lib/utils";

type DisputeReason =
	| "incorrect-amount"
	| "duplicate"
	| "already-paid"
	| "service-not-rendered"
	| "other";

interface DisputeReasonOption {
	key: DisputeReason;
	label: string;
	detail: string;
	icon: typeof AlertTriangle;
}

const disputeReasonOptions: DisputeReasonOption[] = [
	{
		key: "incorrect-amount",
		label: "Incorrect amount",
		detail:
			"The invoiced amount doesn't match what was agreed or what the tariff matrix shows.",
		icon: Calculator,
	},
	{
		key: "duplicate",
		label: "Duplicate invoice",
		detail:
			"The same charge appears on more than one invoice, or on this invoice twice.",
		icon: Receipt,
	},
	{
		key: "already-paid",
		label: "Already paid",
		detail:
			"The charge has already been settled — by transfer, card, or terminal credit.",
		icon: Check,
	},
	{
		key: "service-not-rendered",
		label: "Service not rendered",
		detail:
			"The invoiced service was not performed, or was performed differently from what was billed.",
		icon: FileText,
	},
	{
		key: "other",
		label: "Other",
		detail:
			"Something else — describe it in the space provided and we'll review the details.",
		icon: AlertTriangle,
	},
];

const invoices = [
	{ number: "TRN-INV-2026-0142", amount: "₦1,850,000", customer: "Atlantic Trade Nigeria Ltd", date: "07 Sep 2026", status: "Issued" },
	{ number: "TRN-INV-2026-0143", amount: "₦2,640,000", customer: "Atlantic Trade Nigeria Ltd", date: "01 Sep 2026", status: "Overdue" },
	{ number: "TRN-INV-2026-0144", amount: "₦980,000", customer: "Atlantic Trade Nigeria Ltd", date: "08 Sep 2026", status: "Issued" },
	{ number: "TRN-INV-2026-0145", amount: "₦1,250,000", customer: "Atlantic Trade Nigeria Ltd", date: "09 Sep 2026", status: "Pending" },
	{ number: "TRN-INV-2026-0146", amount: "₦640,000", customer: "Atlantic Trade Nigeria Ltd", date: "09 Sep 2026", status: "Issued" },
];

export default function InvoiceDisputeRoute() {
	const [invoiceNumber, setInvoiceNumber] = useState("");
	const [reason, setReason] = useState<DisputeReason>("incorrect-amount");
	const [description, setDescription] = useState("");
	const [disputedAmount, setDisputedAmount] = useState("");
	const [expectedAmount, setExpectedAmount] = useState("");
	const [contact, setContact] = useState("");
	const [notes, setNotes] = useState("");
	const [acknowledged, setAcknowledged] = useState(false);

	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const selected = disputeReasonOptions.find((o) => o.key === reason)!;
	const invoice = invoices.find((i) => i.number === invoiceNumber);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!invoiceNumber.trim()) {
			toast.error("Enter the invoice number you're disputing.");
			return;
		}
		if (!description.trim() || description.trim().length < 20) {
			toast.error("Describe the issue in at least 20 characters.");
			return;
		}
		if (!acknowledged) {
			toast.error("Confirm the accuracy statement to submit.");
			return;
		}
		setSubmitting(true);
		setTimeout(() => {
			setSubmitting(false);
			setSubmitted(true);
			toast.success("Invoice dispute submitted locally.");
		}, 600);
	};

	if (submitted) {
		return (
			<AppShell title="Dispute submitted" eyebrow="Finance workspace">
				<div className="mx-auto max-w-2xl rounded-2xl bg-paper p-8 text-center ring-1 ring-line sm:p-10">
					<div className="mx-auto grid size-16 place-items-center rounded-full bg-orange text-white">
						<Check className="size-8" />
					</div>
					<p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-deep">
						Dispute submitted
					</p>
					<h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
						We have your dispute.
					</h2>
					<p className="mx-auto mt-4 max-w-md leading-7 text-ink-soft">
						A TRINŪ finance officer will review the dispute and follow up using the
						contact information on file. All disputes and any amendments are logged to
						the invoice record.
					</p>

					<div className="mx-auto mt-7 max-w-md rounded-xl bg-sand p-5 ring-1 ring-line">
						<dl className="space-y-2 text-left text-[12px]">
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Dispute reference</dt>
								<dd className="font-mono text-ink">TRN-DIS-2026-00418</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Invoice</dt>
								<dd className="font-mono text-ink">{invoiceNumber}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Reason</dt>
								<dd className="text-ink">{selected.label}</dd>
							</div>
							{invoice && (
								<div className="flex justify-between gap-3">
									<dt className="text-ink-soft">Invoice amount</dt>
									<dd className="font-mono text-ink">{invoice.amount}</dd>
								</div>
							)}
						</dl>
					</div>

					<p className="mx-auto mt-6 max-w-md text-[12px] leading-5 text-ink-soft">
						While the dispute is under review, the affected amount is marked as disputed
						and does not accrue. Outstanding balances unrelated to this dispute continue
						to age normally.
					</p>

					<div className="mt-8 flex flex-wrap justify-center gap-3">
						<Link to="/portal/payments">
							<Button className="bg-orange text-white hover:bg-orange-deep">
								Back to payments <ArrowRight />
							</Button>
						</Link>
						<button
							type="button"
							onClick={() => {
								setSubmitted(false);
								setAcknowledged(false);
							}}
							className="inline-flex"
						>
							<Button variant="outline" className="border-line bg-paper text-ink">
								Submit another dispute
							</Button>
						</button>
					</div>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell title="Dispute an invoice" eyebrow="Finance workspace">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Finance workspace · Billing dispute
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Dispute an invoice
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Raise a dispute about a charge on your account. A finance officer will review
						the dispute and follow up with next steps. Every dispute is logged to the
						invoice record.
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[1.4fr_.9fr]">
				<div className="space-y-5">
					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="Invoice" detail="Which one" inline />
						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Invoice number
							</span>
							<Input
								required
								placeholder="e.g. TRN-INV-2026-0142"
								value={invoiceNumber}
								onChange={(e) => setInvoiceNumber(e.target.value)}
								className="mt-2 h-11 border-line bg-sand font-mono text-ink"
							/>
						</label>

						<div className="mt-5">
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Or pick from recent invoices
							</p>
							<ul className="mt-3 divide-y divide-line border-y border-line">
								{invoices.map((inv) => {
									const active = invoiceNumber === inv.number;
									return (
										<li key={inv.number}>
											<button
												type="button"
												onClick={() => setInvoiceNumber(inv.number)}
												className={cn(
													"flex w-full items-center justify-between gap-3 py-3 text-left transition-colors",
													active ? "bg-orange/5" : "hover:bg-sand"
												)}
											>
												<div className="min-w-0">
													<p className="font-mono text-[12px] font-semibold text-ink">
														{inv.number}
													</p>
													<p className="mt-0.5 text-[11px] text-ink-soft">
														Issued {inv.date} · {inv.status}
													</p>
												</div>
												<div className="flex items-center gap-3">
													<p className="font-mono text-[12px] text-ink">
														{inv.amount}
													</p>
													{active && (
														<span className="grid size-5 shrink-0 place-items-center rounded-full bg-orange text-white">
															<Check className="size-3" />
														</span>
													)}
												</div>
											</button>
										</li>
									);
								})}
							</ul>
						</div>
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="Reason" detail="Select one" inline />
						<div className="grid gap-3 sm:grid-cols-2">
							{disputeReasonOptions.map((option) => {
								const Icon = option.icon;
								const active = reason === option.key;
								return (
									<button
										key={option.key}
										type="button"
										onClick={() => setReason(option.key)}
										className={cn(
											"flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
											active
												? "border-orange bg-orange/5 ring-1 ring-orange/30"
												: "border-line bg-sand hover:bg-sand-2"
										)}
									>
										<div
											className={cn(
												"grid size-9 shrink-0 place-items-center rounded-md",
												active
													? "bg-orange text-white"
													: "bg-orange/10 text-orange-deep"
											)}
										>
											<Icon className="size-4" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-sm font-semibold text-ink">{option.label}</p>
											<p className="mt-1 text-[12px] leading-5 text-ink-soft">
												{option.detail}
											</p>
										</div>
										{active && (
											<span className="grid size-5 shrink-0 place-items-center rounded-full bg-orange text-white">
												<Check className="size-3" />
											</span>
										)}
									</button>
								);
							})}
						</div>
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="Disputed amount" detail="Optional" inline />
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Amount in dispute (NGN)
								</span>
								<Input
									placeholder="e.g. 1,850,000"
									value={disputedAmount}
									onChange={(e) => setDisputedAmount(e.target.value)}
									className="mt-2 h-11 border-line bg-sand font-mono text-ink"
								/>
							</label>
							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Amount you expect (NGN)
								</span>
								<Input
									placeholder="e.g. 1,700,000"
									value={expectedAmount}
									onChange={(e) => setExpectedAmount(e.target.value)}
									className="mt-2 h-11 border-line bg-sand font-mono text-ink"
								/>
							</label>
						</div>
						<p className="mt-3 text-[11px] leading-5 text-ink-soft">
							If you know the exact amount you believe is correct, include it here. If
							you're unsure, leave this blank and describe the issue in the next
							section.
						</p>
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="Details" detail="Be specific" inline />
						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Describe the issue
							</span>
							<textarea
								required
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								className="mt-2 min-h-40 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder={
									reason === "incorrect-amount"
										? "e.g. Terminal handling charge shows ₦560,000 but the agreed tariff for 40ft containers is ₦140,000 per unit × 4 = ₦560,000. The storage line seems to double-count days."
										: reason === "duplicate"
										? "e.g. The same examination coordination fee appears on TRN-INV-2026-0142 and TRN-INV-2026-0144."
										: reason === "already-paid"
										? "e.g. This invoice was settled by bank transfer on 12 Sep. Receipt reference TRN-RCP-00805."
										: reason === "service-not-rendered"
										? "e.g. The invoice includes a reefer power line, but the cargo is dry. No reefer service was requested or used."
										: "e.g. The storage charges appear to escalate earlier than the agreed free period allows."
								}
							/>
							<span className="mt-2 block text-[11px] leading-5 text-ink-soft">
								Include any reference numbers or dates that help the finance officer
								review the dispute.
							</span>
						</label>

						<label className="mt-5 block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Contact for follow-up (optional)
							</span>
							<Input
								placeholder="e.g. name@company.ng or +234 ..."
								value={contact}
								onChange={(e) => setContact(e.target.value)}
								className="mt-2 h-11 border-line bg-sand text-ink"
							/>
						</label>
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="Evidence" detail="Upload what you have" inline />
						<div className="rounded-xl border border-dashed border-line bg-sand p-6 text-center">
							<div className="mx-auto grid size-11 place-items-center rounded-full bg-orange/10 text-orange-deep">
								<Upload className="size-5" />
							</div>
							<p className="mt-4 font-display text-base font-bold text-ink">
								Attach supporting files
							</p>
							<p className="mx-auto mt-2 max-w-sm text-[12px] leading-5 text-ink-soft">
								Payment receipts, agreed tariff references, or prior correspondence
								about this invoice.
							</p>
							<div className="mt-4 flex justify-center"><LocalFilePicker /></div>
						</div>
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="Additional notes" detail="Optional" inline />
						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Anything else we should know
							</span>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder="Contact preferences, timing considerations, or other context"
							/>
						</label>
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
							<input
								type="checkbox"
								checked={acknowledged}
								onChange={(e) => setAcknowledged(e.target.checked)}
								className="mt-0.5 size-4 shrink-0 rounded border-line accent-orange"
							/>
							<span className="text-[12px] leading-6 text-ink">
								I confirm this dispute is accurate to the best of my knowledge, and I
								understand that filing a false dispute may result in account
								restrictions and additional review.
							</span>
						</label>
					</section>
				</div>

				<aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
					<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<SectionHeader title="Summary" detail="Before you submit" inline />
						<dl className="space-y-3 text-[12px]">
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Invoice</dt>
								<dd className="font-mono text-ink">{invoiceNumber || "—"}</dd>
							</div>
							{invoice && (
								<div className="flex justify-between gap-3">
									<dt className="text-ink-soft">Invoice amount</dt>
									<dd className="font-mono text-ink">{invoice.amount}</dd>
								</div>
							)}
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Reason</dt>
								<dd className="text-ink">{selected.label}</dd>
							</div>
							{disputedAmount && (
								<div className="flex justify-between gap-3">
									<dt className="text-ink-soft">Disputed</dt>
									<dd className="font-mono text-ink">₦{disputedAmount}</dd>
								</div>
							)}
							{expectedAmount && (
								<div className="flex justify-between gap-3">
									<dt className="text-ink-soft">Expected</dt>
									<dd className="font-mono text-ink">₦{expectedAmount}</dd>
								</div>
							)}
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Attachments</dt>
								<dd className="text-ink-soft">Add files above</dd>
							</div>
						</dl>

						<Button
							type="submit"
							disabled={submitting}
							className={cn(
								"mt-5 h-11 w-full bg-orange text-white hover:bg-orange-deep",
								submitting && "opacity-70"
							)}
						>
							{submitting ? "Submitting dispute…" : "Submit dispute"}
							{!submitting && <ArrowRight />}
						</Button>

						<p className="mt-3 text-center text-[11px] text-ink-soft">
							A finance officer reviews the dispute and follows up using the contact
							information on file.
						</p>
					</div>

					<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<div className="flex items-center gap-2">
							<HelpCircle className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
								How disputes are handled
							</p>
						</div>
						<ol className="mt-4 space-y-3 text-[12px] leading-5 text-ink-soft">
							<li className="flex gap-3">
								<span className="font-mono text-[11px] text-orange-deep">01</span>
								The affected amount is marked as disputed and stops accruing.
							</li>
							<li className="flex gap-3">
								<span className="font-mono text-[11px] text-orange-deep">02</span>
								A finance officer reviews the tariff lines, receipts, and any evidence
								you attached.
							</li>
							<li className="flex gap-3">
								<span className="font-mono text-[11px] text-orange-deep">03</span>
								We record the outcome on the invoice record and follow up with next
								steps.
							</li>
						</ol>
					</div>

					<div className="rounded-xl bg-slate p-5 text-sand ring-1 ring-slate">
						<div className="flex items-center gap-2">
							<Receipt className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								What happens next
							</p>
						</div>
						<p className="mt-3 text-[12px] leading-5 text-sand/75">
							While the dispute is under review, the disputed amount is not collected.
							Outstanding balances unrelated to the dispute continue to age normally.
						</p>
						<Link
							to="/portal/payments"
							className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold text-orange"
						>
							Open payment ledger <ArrowRight className="size-3.5" />
						</Link>
					</div>
				</aside>
			</form>
		</AppShell>
	);
}

function SectionHeader({
	title,
	detail,
	inline = false,
	dark = false,
}: {
	title: string;
	detail: string;
	inline?: boolean;
	dark?: boolean;
}) {
	return (
		<div
			className={
				"mb-4 flex flex-wrap items-center justify-between gap-3 " +
				(inline ? "px-0 pt-0" : "px-5 pt-5")
			}
		>
			<h3
				className={
					"font-display text-sm font-bold tracking-tight " +
					(dark ? "text-sand" : "text-ink")
				}
			>
				{title}
			</h3>
			<span
				className={
					"font-mono text-[10px] uppercase tracking-[0.14em] " +
					(dark ? "text-sand/50" : "text-ink-soft")
				}
			>
				{detail}
			</span>
		</div>
	);
}