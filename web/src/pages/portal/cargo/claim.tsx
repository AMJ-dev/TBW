import { useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Check,
	ClipboardCheck,
	FileText,
	HelpCircle,
	Package,
	ShieldAlert,
	Upload,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalFilePicker } from "@/components/ui/local-file-picker";
import { cn } from "@/lib/utils";

type ClaimKind =
	| "discrepancy"
	| "damage"
	| "seal"
	| "shortage";

interface ClaimOption {
	key: ClaimKind;
	label: string;
	detail: string;
	icon: typeof AlertTriangle;
}

const claimOptions: ClaimOption[] = [
	{
		key: "discrepancy",
		label: "Discrepancy",
		detail:
			"Cargo does not match the manifest, packing list, or expected record. Includes incorrect marks or weights.",
		icon: AlertTriangle,
	},
	{
		key: "damage",
		label: "Damage",
		detail:
			"Physical damage to the cargo, packaging, or container discovered at receipt, storage, or examination.",
		icon: ShieldAlert,
	},
	{
		key: "seal",
		label: "Seal mismatch",
		detail:
			"The seal number does not match the manifest, or the seal appears broken, missing, or altered.",
		icon: Package,
	},
	{
		key: "shortage",
		label: "Shortage",
		detail:
			"Fewer units, cartons, or packages than the manifest and packing list specify.",
		icon: ClipboardCheck,
	},
];

const severityOptions = [
	{ key: "low", label: "Low", detail: "Cosmetic or record-only — no operational impact" },
	{ key: "medium", label: "Medium", detail: "Needs review before next movement" },
	{ key: "high", label: "High", detail: "Blocks movement or examination coordination" },
	{ key: "critical", label: "Critical", detail: "Safety, security, or statutory concern" },
] as const;

type Severity = (typeof severityOptions)[number]["key"];

const discoveryPoints = [
	{ key: "receiving", label: "At receiving" },
	{ key: "storage", label: "In storage" },
	{ key: "examination", label: "During examination coordination" },
	{ key: "loading", label: "During loading" },
	{ key: "other", label: "Other" },
] as const;

type DiscoveryPoint = (typeof discoveryPoints)[number]["key"];

export default function DiscrepancyClaimRoute() {
	const [kind, setKind] = useState<ClaimKind>("discrepancy");
	const [severity, setSeverity] = useState<Severity>("medium");
	const [discoveredAt, setDiscoveredAt] = useState<DiscoveryPoint>("receiving");

	const [reference, setReference] = useState("");
	const [description, setDescription] = useState("");
	const [affectedUnits, setAffectedUnits] = useState("");
	const [contact, setContact] = useState("");
	const [notes, setNotes] = useState("");
	const [acknowledged, setAcknowledged] = useState(false);

	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const selected = claimOptions.find((o) => o.key === kind)!;

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!reference.trim()) {
			toast.error("Enter the container, package, or consignment reference.");
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
			toast.success("Claim submitted locally.");
		}, 600);
	};

	if (submitted) {
		return (
			<AppShell title="Claim submitted" eyebrow="Cargo workspace">
				<div className="mx-auto max-w-2xl rounded-2xl bg-paper p-8 text-center ring-1 ring-line sm:p-10">
					<div className="mx-auto grid size-16 place-items-center rounded-full bg-orange text-white">
						<Check className="size-8" />
					</div>
					<p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-deep">
						Claim submitted
					</p>
					<h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
						We have your claim.
					</h2>
					<p className="mx-auto mt-4 max-w-md leading-7 text-ink-soft">
						A TRINŪ coordinator will review the claim and follow up using the contact
						information on file. Claims are investigated and logged to the cargo record.
					</p>

					<div className="mx-auto mt-7 max-w-md rounded-xl bg-sand p-5 ring-1 ring-line">
						<dl className="space-y-2 text-left text-[12px]">
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Claim reference</dt>
								<dd className="font-mono text-ink">TRN-CLM-2026-00914</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Type</dt>
								<dd className="text-ink">{selected.label}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Severity</dt>
								<dd className="text-ink">
									{severityOptions.find((s) => s.key === severity)?.label}
								</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Cargo reference</dt>
								<dd className="font-mono text-ink">{reference}</dd>
							</div>
						</dl>
					</div>

					<p className="mx-auto mt-6 max-w-md text-[12px] leading-5 text-ink-soft">
						If the situation changes or you need to add evidence, you can amend the claim
						from the consignment workspace. The claim and every amendment are logged to
						the audit trail.
					</p>

					<div className="mt-8 flex flex-wrap justify-center gap-3">
						<Link to="/portal/cargo">
							<Button className="bg-orange text-white hover:bg-orange-deep">
								Back to cargo <ArrowRight />
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
								Submit another claim
							</Button>
						</button>
					</div>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell title="Discrepancy or damage claim" eyebrow="Cargo workspace">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Cargo workspace · Claim and evidence
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Report a discrepancy or damage
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Report a discrepancy, damage, seal mismatch, or shortage against a container,
						package, or consignment. Every claim is logged with evidence and a reference
						you can track.
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[1.4fr_.9fr]">
				<div className="space-y-5">
					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="Claim type" detail="Select one" inline />
						<div className="grid gap-3 sm:grid-cols-2">
							{claimOptions.map((option) => {
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
						<SectionHeader title="Cargo reference" detail="Where is it" inline />
						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Container, package, or consignment reference
							</span>
							<Input
								required
								placeholder="e.g. TRIU1234564, ATNL-2026-014-001, or TRN-IMP-002481"
								value={reference}
								onChange={(e) => setReference(e.target.value)}
								className="mt-2 h-11 border-line bg-sand font-mono text-ink"
							/>
							<span className="mt-2 block text-[11px] leading-5 text-ink-soft">
								We match by container number, package mark number, or consignment
								reference.
							</span>
						</label>

						<label className="mt-5 block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Where was this discovered?
							</span>
							<div className="mt-2 flex flex-wrap gap-2">
								{discoveryPoints.map((point) => {
									const active = discoveredAt === point.key;
									return (
										<button
											key={point.key}
											type="button"
											onClick={() => setDiscoveredAt(point.key)}
											className={cn(
												"rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
												active
													? "border-orange bg-orange text-white"
													: "border-line bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
											)}
										>
											{point.label}
										</button>
									);
								})}
							</div>
						</label>
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="What happened" detail="Be specific" inline />
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
									kind === "damage"
										? "e.g. Two cartons show crush damage on the north-facing side. Cardboard torn, contents visible. Photographs attached."
										: kind === "seal"
										? "e.g. Seal number on container door does not match the BL. Manifest states SL-992819, present seal reads SL-992820."
										: kind === "shortage"
										? "e.g. Packing list shows 52 cartons, tally recorded 49 cartons in the container at receiving."
										: "e.g. Weight recorded at receiving differs from the bill of lading by 420 kg. Manifest shows 18,000 kg, scale shows 18,420 kg."
								}
							/>
							<span className="mt-2 block text-[11px] leading-5 text-ink-soft">
								Include what you observed, where, and any reference numbers that help
								identify the affected cargo.
							</span>
						</label>

						<div className="mt-5 grid gap-4 sm:grid-cols-2">
							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Affected units (optional)
								</span>
								<Input
									placeholder="e.g. 2 cartons or Bay 2 · Rack 3"
									value={affectedUnits}
									onChange={(e) => setAffectedUnits(e.target.value)}
									className="mt-2 h-11 border-line bg-sand text-ink"
								/>
							</label>
							<label className="block">
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
						</div>
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="Evidence" detail="Upload what you have" inline />
						<div className="rounded-xl border border-dashed border-line bg-sand p-6 text-center">
							<div className="mx-auto grid size-11 place-items-center rounded-full bg-orange/10 text-orange-deep">
								<Upload className="size-5" />
							</div>
							<p className="mt-4 font-display text-base font-bold text-ink">
								Attach photographs or documents
							</p>
							<p className="mx-auto mt-2 max-w-sm text-[12px] leading-5 text-ink-soft">
								Photos of the affected area, packing list, tally sheet, or any other file
								that supports the claim.
							</p>
							<div className="mt-4 flex justify-center"><LocalFilePicker /></div>
						</div>
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="Severity" detail="How urgent" inline />
						<div className="grid gap-3 sm:grid-cols-2">
							{severityOptions.map((option) => {
								const active = severity === option.key;
								return (
									<button
										key={option.key}
										type="button"
										onClick={() => setSeverity(option.key)}
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

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
							<input
								type="checkbox"
								checked={acknowledged}
								onChange={(e) => setAcknowledged(e.target.checked)}
								className="mt-0.5 size-4 shrink-0 rounded border-line accent-orange"
							/>
							<span className="text-[12px] leading-6 text-ink">
								I confirm this claim is accurate to the best of my knowledge, and I
								understand that filing a false claim may result in account restrictions
								and notification to the appropriate authority.
							</span>
						</label>
					</section>
				</div>

				<aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
					<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<SectionHeader title="Summary" detail="Before you submit" inline />
						<dl className="space-y-3 text-[12px]">
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Claim type</dt>
								<dd className="text-ink">{selected.label}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Cargo reference</dt>
								<dd className="font-mono text-ink">{reference || "—"}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Discovered</dt>
								<dd className="text-ink">
									{discoveryPoints.find((p) => p.key === discoveredAt)?.label}
								</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Severity</dt>
								<dd className="text-ink">
									{severityOptions.find((s) => s.key === severity)?.label}
								</dd>
							</div>
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
							{submitting ? "Submitting claim…" : "Submit claim"}
							{!submitting && <ArrowRight />}
						</Button>

						<p className="mt-3 text-center text-[11px] text-ink-soft">
							Every claim is logged with evidence and reference to the cargo record.
						</p>
					</div>

					<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<div className="flex items-center gap-2">
							<HelpCircle className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
								How claims are handled
							</p>
						</div>
						<ol className="mt-4 space-y-3 text-[12px] leading-5 text-ink-soft">
							<li className="flex gap-3">
								<span className="font-mono text-[11px] text-orange-deep">01</span>
								A coordinator reviews the claim and confirms the cargo reference.
							</li>
							<li className="flex gap-3">
								<span className="font-mono text-[11px] text-orange-deep">02</span>
								We investigate using evidence, movement records, and any applicable
								examination outcome.
							</li>
							<li className="flex gap-3">
								<span className="font-mono text-[11px] text-orange-deep">03</span>
								We record the outcome on the cargo record and follow up with next steps.
							</li>
						</ol>
					</div>

					<div className="rounded-xl bg-slate p-5 text-sand ring-1 ring-slate">
						<div className="flex items-center gap-2">
							<FileText className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								What happens next
							</p>
						</div>
						<p className="mt-3 text-[12px] leading-5 text-sand/75">
							Claims are recorded on the cargo record and may affect release or
							examination coordination until resolved. You can track the claim from the
							consignment workspace.
						</p>
						<Link
							to="/portal/cargo"
							className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold text-orange"
						>
							Open cargo workspace <ArrowRight className="size-3.5" />
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