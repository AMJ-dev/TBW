import { useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	ArrowRight,
	Check,
	ClipboardCheck,
	FileText,
	HelpCircle,
	Package,
	PackageCheck,
	Ruler,
	Sparkles,
	Upload,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalFilePicker } from "@/components/ui/local-file-picker";
import { cn } from "@/lib/utils";

type ServiceKind =
	| "inspection"
	| "repackaging"
	| "sample"
	| "handling";

interface ServiceOption {
	key: ServiceKind;
	label: string;
	detail: string;
	icon: typeof Package;
	needs: string[];
}

const serviceOptions: ServiceOption[] = [
	{
		key: "inspection",
		label: "Inspection",
		detail:
			"Request an internal inspection of cargo condition or contents. Results are recorded as evidence.",
		icon: ClipboardCheck,
		needs: ["Container or package reference", "Purpose of inspection"],
	},
	{
		key: "repackaging",
		label: "Repackaging",
		detail:
			"Request new packaging, palletisation, or consolidation. Handling time is recorded and billed per tariff.",
		icon: PackageCheck,
		needs: ["Container or package reference", "Preferred packaging type"],
	},
	{
		key: "sample",
		label: "Sample drawing",
		detail:
			"Request a sample to be drawn and documented. Samples are recorded with a reference and chain of custody.",
		icon: Sparkles,
		needs: ["Container or package reference", "Sample quantity and purpose"],
	},
	{
		key: "handling",
		label: "Additional handling",
		detail:
			"Request additional handling such as weighing, labelling, sorting, or fumigation coordination.",
		icon: Ruler,
		needs: ["Container or package reference", "Service description"],
	},
];

const urgencyOptions = [
	{ key: "standard", label: "Standard", detail: "Handled in the normal queue" },
	{ key: "priority", label: "Priority", detail: "Handled ahead of standard requests" },
	{ key: "scheduled", label: "Scheduled", detail: "Coordinate to a specific date or window" },
] as const;

type Urgency = (typeof urgencyOptions)[number]["key"];

export default function ServiceRequestRoute() {
	const [kind, setKind] = useState<ServiceKind>("inspection");
	const [reference, setReference] = useState("");
	const [purpose, setPurpose] = useState("");
	const [urgency, setUrgency] = useState<Urgency>("standard");
	const [scheduledFor, setScheduledFor] = useState("");
	const [notes, setNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const selected = serviceOptions.find((o) => o.key === kind)!;

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!reference.trim()) {
			toast.error("Enter the container or package reference.");
			return;
		}
		if (!purpose.trim()) {
			toast.error("Describe what you need from this service.");
			return;
		}
		if (urgency === "scheduled" && !scheduledFor.trim()) {
			toast.error("Enter the date or window you'd like to schedule this for.");
			return;
		}
		setSubmitting(true);
		setTimeout(() => {
			setSubmitting(false);
			setSubmitted(true);
			toast.success("Service request submitted locally.");
		}, 600);
	};

	if (submitted) {
		return (
			<AppShell title="Service request submitted" eyebrow="Cargo workspace">
				<div className="mx-auto max-w-2xl rounded-2xl bg-paper p-8 text-center ring-1 ring-line sm:p-10">
					<div className="mx-auto grid size-16 place-items-center rounded-full bg-orange text-white">
						<Check className="size-8" />
					</div>
					<p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-deep">
						Request submitted
					</p>
					<h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
						We have your request.
					</h2>
					<p className="mx-auto mt-4 max-w-md leading-7 text-ink-soft">
						A TRINŪ coordinator will review the brief and follow up with the contact
						information on file. You can track progress from the consignment workspace.
					</p>
					<div className="mx-auto mt-7 max-w-md rounded-xl bg-sand p-5 ring-1 ring-line">
						<dl className="space-y-2 text-left text-[12px]">
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Reference</dt>
								<dd className="font-mono text-ink">TRN-SRV-2026-01482</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Service</dt>
								<dd className="text-ink">{selected.label}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Cargo reference</dt>
								<dd className="font-mono text-ink">{reference}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Urgency</dt>
								<dd className="text-ink">
									{urgencyOptions.find((u) => u.key === urgency)?.label}
								</dd>
							</div>
						</dl>
					</div>
					<div className="mt-8 flex flex-wrap justify-center gap-3">
						<Link to="/portal/cargo">
							<Button className="bg-orange text-white hover:bg-orange-deep">
								Back to cargo <ArrowRight />
							</Button>
						</Link>
						<button
							type="button"
							onClick={() => setSubmitted(false)}
							className="inline-flex"
						>
							<Button variant="outline" className="border-line bg-paper text-ink">
								Submit another request
							</Button>
						</button>
					</div>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell title="Service request" eyebrow="Cargo workspace">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Cargo service request · Operational
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Request an operational service
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Request inspection, repackaging, sample drawing, or additional handling. A
						coordinator will review the brief and follow up using the contact information
						on file.
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[1.4fr_.9fr]">
				<div className="space-y-5">
					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader
							title="Service"
							detail="Select one"
							inline
						/>
						<div className="grid gap-3 sm:grid-cols-2">
							{serviceOptions.map((option) => {
								const Icon = option.icon;
								const active = kind === option.key;
								return (
									<button
										key={option.key}
										type="button"
										onClick={() => setKind(option.key)}
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
						<SectionHeader
							title="Cargo reference"
							detail="Container or package"
							inline
						/>
						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Container, package, or consignment reference
							</span>
							<Input
								required
								placeholder="e.g. TRIU1234564 or ATNL-2026-014-001"
								value={reference}
								onChange={(e) => setReference(e.target.value)}
								className="mt-2 h-11 border-line bg-sand font-mono text-ink"
							/>
							<span className="mt-2 block text-[11px] leading-5 text-ink-soft">
								We match by container number, package mark number, or consignment
								reference.
							</span>
						</label>
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="What you need" detail="Be specific" inline />
						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Purpose of the request
							</span>
							<textarea
								required
								value={purpose}
								onChange={(e) => setPurpose(e.target.value)}
								className="mt-2 min-h-32 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder={
									kind === "inspection"
										? "e.g. Check contents of cartons 1–4 for condition on arrival"
										: kind === "repackaging"
										? "e.g. Repack 48 cartons onto 6 pallets with shrink wrap"
										: kind === "sample"
										? "e.g. Draw 2 cartons as samples for laboratory testing"
										: "e.g. Weigh the package and confirm total gross mass"
								}
							/>
						</label>

						{selected.needs.length > 0 && (
							<div className="mt-5 rounded-xl bg-sand p-4 ring-1 ring-line">
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									What this request needs
								</p>
								<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
									{selected.needs.map((need) => (
										<li key={need} className="flex items-start gap-2">
											<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
											{need}
										</li>
									))}
								</ul>
							</div>
						)}
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="Attachments" detail="Optional" inline />
						<div className="rounded-xl border border-dashed border-line bg-sand p-6 text-center">
							<div className="mx-auto grid size-11 place-items-center rounded-full bg-orange/10 text-orange-deep">
								<Upload className="size-5" />
							</div>
							<p className="mt-4 font-display text-base font-bold text-ink">
								Add supporting files
							</p>
							<p className="mx-auto mt-2 max-w-sm text-[12px] leading-5 text-ink-soft">
								Photographs, packing lists, previous inspection notes, or any file that
								helps explain the request.
							</p>
							<div className="mt-4 flex justify-center"><LocalFilePicker /></div>
						</div>
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="Urgency" detail="How fast" inline />
						<div className="grid gap-3 sm:grid-cols-3">
							{urgencyOptions.map((option) => {
								const active = urgency === option.key;
								return (
									<button
										key={option.key}
										type="button"
										onClick={() => setUrgency(option.key)}
										className={cn(
											"rounded-xl border p-3 text-left transition-colors",
											active
												? "border-orange bg-orange/5 ring-1 ring-orange/30"
												: "border-line bg-sand hover:bg-sand-2"
										)}
									>
										<p className="text-sm font-semibold text-ink">{option.label}</p>
										<p className="mt-1 text-[11px] leading-5 text-ink-soft">
											{option.detail}
										</p>
									</button>
								);
							})}
						</div>

						{urgency === "scheduled" && (
							<label className="mt-5 block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Preferred date or window
								</span>
								<Input
									required
									placeholder="e.g. 18 Sep 2026 or 14:00–16:00 on 18 Sep"
									value={scheduledFor}
									onChange={(e) => setScheduledFor(e.target.value)}
									className="mt-2 h-11 border-line bg-sand text-ink"
								/>
							</label>
						)}
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
								placeholder="Access requirements, handling considerations, contact preferences"
							/>
						</label>
					</section>
				</div>

				<aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
					<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<SectionHeader title="Summary" detail="Before you submit" inline />
						<dl className="space-y-3 text-[12px]">
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Service</dt>
								<dd className="text-ink">{selected.label}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Cargo reference</dt>
								<dd className="font-mono text-ink">{reference || "—"}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Urgency</dt>
								<dd className="text-ink">
									{urgencyOptions.find((u) => u.key === urgency)?.label}
								</dd>
							</div>
							{urgency === "scheduled" && (
								<div className="flex justify-between gap-3">
									<dt className="text-ink-soft">Scheduled for</dt>
									<dd className="text-ink">{scheduledFor || "—"}</dd>
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
							{submitting ? "Submitting…" : "Submit request"}
							{!submitting && <ArrowRight />}
						</Button>

						<p className="mt-3 text-center text-[11px] text-ink-soft">
							A coordinator reviews the brief and follows up using the contact information
							on file.
						</p>
					</div>

					<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<div className="flex items-center gap-2">
							<HelpCircle className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
								How it works
							</p>
						</div>
						<ol className="mt-4 space-y-3 text-[12px] leading-5 text-ink-soft">
							<li className="flex gap-3">
								<span className="font-mono text-[11px] text-orange-deep">01</span>
								We receive the request and confirm the cargo reference.
							</li>
							<li className="flex gap-3">
								<span className="font-mono text-[11px] text-orange-deep">02</span>
								The coordinating desk reviews feasibility and timing.
							</li>
							<li className="flex gap-3">
								<span className="font-mono text-[11px] text-orange-deep">03</span>
								We follow up with next steps and any tariff impact.
							</li>
						</ol>
					</div>

					<div className="rounded-xl bg-slate p-5 text-sand ring-1 ring-slate">
						<div className="flex items-center gap-2">
							<FileText className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								Need a different request?
							</p>
						</div>
						<p className="mt-3 text-[12px] leading-5 text-sand/75">
							For pricing or service planning, use the quote form. For general questions,
							use the enquiry form.
						</p>
						<div className="mt-4 flex flex-wrap gap-2">
							<Link to="/quote">
								<Button size="sm" className="bg-orange text-white hover:bg-carmine">
									Request a quote <ArrowRight />
								</Button>
							</Link>
							<Link to="/contact">
								<Button
									size="sm"
									variant="outline"
									className="border-sand/30 bg-transparent text-sand hover:bg-sand/10"
								>
									Contact operations
								</Button>
							</Link>
						</div>
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