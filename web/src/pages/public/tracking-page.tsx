import { useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Boxes,
	Check,
	ChevronLeft,
	Clock3,
	MapPin,
	Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cargoRecords } from "@/data/mock";
import type { CargoRecord } from "@/data/mock";
import { PublicFrame, PublicKicker, PublicStatus } from "@/components/public/public-shell";

const suggestedRefs = ["TRIU1234564", "TRN-BL-2026-008721", "TRN-IMP-002481"];

const ISO6346_LETTER_VALUES: Record<string, number> = {
	A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19,
	J: 20, K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29,
	S: 30, T: 31, U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38,
};

function validateISO6346(container: string): { valid: boolean; reason?: string } {
	const cleaned = container.trim().toUpperCase();

	if (!/^[A-Z]{4}\d{7}$/.test(cleaned)) {
		return {
			valid: false,
			reason:
				"Container numbers must be 4 letters followed by 7 digits (e.g. TRIU1234564).",
		};
	}

	let sum = 0;
	const weights = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512];

	for (let i = 0; i < 10; i++) {
		const char = cleaned.charAt(i);
		const value = /\d/.test(char) ? parseInt(char, 10) : ISO6346_LETTER_VALUES[char] ?? 0;
		sum += value * (weights[i] ?? 0);
	}

	const checkDigit = sum % 11;
	const expected = checkDigit === 10 ? 0 : checkDigit;
	const actual = parseInt(cleaned.charAt(10), 10);

	if (expected !== actual) {
		return {
			valid: false,
			reason: `Container check digit does not match. The correct check digit is ${expected}.`,
		};
	}

	return { valid: true };
}

export default function TrackingPage() {
	const initialReference = new URLSearchParams(window.location.search).get("ref") ?? "";
	const initialRecord = cargoRecords.find((cargo) =>
		[cargo.container, cargo.reference, cargo.billOfLading].includes(initialReference.trim().toUpperCase())
	);
	const [value, setValue] = useState(initialReference);
	const [tracked, setTracked] = useState(Boolean(initialRecord));
	const [record, setRecord] = useState<CargoRecord | null>(initialRecord ?? null);
	const [error, setError] = useState(initialReference && !initialRecord ? "We couldn't find that reference in the local demo records." : "");

	const submit = () => {
		const cleaned = value.trim().toUpperCase();

		if (!cleaned) {
			setError("Enter a container, BL, or terminal reference to continue.");
			setTracked(false);
			return;
		}

		const looksLikeContainer = /^[A-Z]{4}\d{7}$/i.test(cleaned);
		if (looksLikeContainer) {
			const result = validateISO6346(cleaned);
			if (!result.valid) {
				setError(result.reason ?? "Invalid container number.");
				setTracked(false);
				return;
			}
		}

		const match = cargoRecords.find((cargo) =>
			[cargo.container, cargo.reference, cargo.billOfLading].includes(cleaned)
		);

		if (!match) {
			setError(
				"We couldn't find that reference. Try TRIU1234564, TRN-BL-2026-008721, or TRN-IMP-002481."
			);
			setTracked(false);
			return;
		}

		setError("");
		setRecord(match);
		setTracked(true);
		toast.success("Cargo record found.");
	};

	return (
		<PublicFrame>
			<main className="mx-auto max-w-5xl px-5 py-12 lg:px-8 lg:py-20">
				<div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
					<div>
						<PublicKicker>Public cargo tracking</PublicKicker>
						<h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl">
							Know where your <span className="text-orange">cargo stands.</span>
						</h1>
						<p className="mt-5 max-w-xl text-base leading-7 text-ink-soft">
							Enter a container number, bill of lading, or terminal reference. Public
							tracking shows movement status without exposing sensitive commercial
							details.
						</p>
					</div>
					<div className="grid grid-cols-3 gap-3">
						{[
							["6", "Lifecycle stages"],
							["ISO", "6346 check"],
							["24/7", "Visibility"],
						].map(([value, label]) => (
							<div key={label} className="rounded-xl bg-sand p-3 ring-1 ring-line">
								<p className="font-display text-xl font-bold text-ink">{value}</p>
								<p className="mt-1 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-soft">
									{label}
								</p>
							</div>
						))}
					</div>
				</div>

				<div className="mt-10 overflow-hidden rounded-2xl bg-paper shadow-xl ring-1 ring-line">
					<div className="border-b border-line bg-sand p-5 sm:p-7">
						<div className="flex items-center gap-2">
							<div className="grid size-8 place-items-center rounded-md bg-orange text-white">
								<Search className="size-4" />
							</div>
							<p className="font-mono text-[15px] font-bold uppercase tracking-[0.16em] text-orange">
								Track a shipment
							</p>
						</div>
						<div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
							<div>
								<label
									htmlFor="tracking-ref"
									className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-soft"
								>
									Container, BL, or terminal reference
								</label>
								<Input
									id="tracking-ref"
									value={value}
									onChange={(event) => {
										setValue(event.target.value);
										setTracked(false);
										setRecord(null);
										setError("");
									}}
									onKeyDown={(event) => {
										if (event.key === "Enter") submit();
									}}
									className="mt-2 h-12 border-line bg-paper font-mono text-sm text-ink"
									placeholder="TRIU1234564"
								/>
							</div>
							<Button
								onClick={() => submit()}
								className="h-12 self-end bg-orange text-white hover:bg-orange-deep"
							>
								Track cargo <ArrowRight />
							</Button>
						</div>
						<div className="mt-4 flex flex-wrap items-center gap-2">
							<span className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-soft">
								Try:
							</span>
							{suggestedRefs.map((ref) => (
								<button
									key={ref}
									type="button"
									onClick={() => setValue(ref)}
									className="rounded-full border border-line bg-paper px-3 py-1 font-mono text-[12px] text-ink-soft transition-colors hover:border-orange/40 hover:bg-orange/10 hover:text-orange"
								>
									{ref}
								</button>
							))}
						</div>
						{error && (
							<p
								role="alert"
								className="mt-4 flex items-center gap-2 rounded-md bg-carmine/10 px-3 py-2 text-sm text-carmine ring-1 ring-carmine/25"
							>
								<AlertTriangle className="size-4 shrink-0" />
								{error}
							</p>
						)}
					</div>
					{tracked && record && (
						<TrackingResult
							record={record}
							onReset={() => {
								setTracked(false);
								setRecord(null);
								setValue("");
								setError("");
								window.scrollTo({ top: 0, behavior: "smooth" });
							}}
						/>
					)}
				</div>

				<Link
					to="/"
					className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange"
				>
					<ChevronLeft className="size-4" /> Back to TRÏNŪ
				</Link>
			</main>
		</PublicFrame>
	);
}

function TrackingResult({ record, onReset }: { record: CargoRecord; onReset: () => void }) {
	const status = record.status === "Held" ? "Review required" : record.status;
	const currentStage = record.status === "Gate out" ? 5 : record.status === "Release authorised" ? 4 : record.status === "Documentation" || record.status === "Held" ? 3 : 2;
	const stages = ["Arrived at terminal", "Receiving completed", "In terminal", "Documentation review", "Release authorisation", "Gate out"];
	const nextStage = stages[Math.min(currentStage + 1, stages.length - 1)] ?? "Gate out";
	return (
		<div>
			<div className="relative overflow-hidden bg-slate p-5 text-sand sm:p-7">
				<div
					aria-hidden="true"
					className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-orange/25 blur-3xl"
				/>
				<div className="relative flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="font-mono text-[12px] uppercase tracking-[0.15em] text-sand/60">
							{record.reference} · {record.container}
						</p>
						<div className="mt-3 flex flex-wrap items-center gap-3">
							<h2 className="font-display text-3xl font-bold text-sand">{status.toUpperCase()}</h2>
							<PublicStatus label="Current status" tone={record.status === "Held" ? "warning" : record.status === "Gate out" ? "info" : "success"} />
						</div>
						<p className="mt-3 max-w-lg text-sm leading-6 text-sand/75">
							Movement status for this reference is shown without consignee, goods description,
							commercial values, or exact storage position.
						</p>
					</div>
					<div className="rounded-lg bg-sand/5 p-3 ring-1 ring-sand/15">
						<div className="flex items-center gap-2">
							<Clock3 className="size-4 text-orange" />
							<div>
								<p className="font-mono text-[12px] uppercase tracking-[0.14em] text-sand/60">
									Last updated
								</p>
								<p className="mt-0.5 font-mono text-[11px] text-sand">
									{record.arrival} · Demo record
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_260px]">
				<div>
					<p className="mb-5 font-mono text-[12px] uppercase tracking-[0.16em] text-orange">
						Movement timeline
					</p>
					<div className="relative space-y-6 before:absolute before:bottom-4 before:left-[12px] before:top-4 before:w-px before:bg-line">
						{stages.map((label, index) => (
							<TimelineItem
								key={label}
								label={label}
								date={index < currentStage ? "Complete" : index === currentStage ? "Current stage" : "Pending"}
								location="Abuja terminal"
								complete={index < currentStage}
								active={index === currentStage}
							/>
						))}
					</div>
				</div>

				<aside className="h-fit space-y-4">
					<div className="rounded-xl bg-paper p-4 ring-1 ring-line">
						<div className="flex items-center gap-2">
							<Boxes className="size-4 text-orange" />
							<p className="font-mono text-[12px] uppercase tracking-[0.14em] text-orange">
								Cargo summary
							</p>
						</div>
						<dl className="mt-4 space-y-3 text-sm">
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Reference</dt>
								<dd className="font-mono text-[12px] text-ink">{record.reference}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Container</dt>
								<dd className="font-mono text-[12px] text-ink">{record.container}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Current stage</dt>
								<dd className="text-[12px] font-medium text-orange">{status}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Next step</dt>
								<dd className="text-right text-[12px] font-medium text-ink">{nextStage}</dd>
							</div>
						</dl>
					</div>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<div className="flex items-center gap-2">
							<MapPin className="size-4 text-orange" />
							<p className="font-mono text-[12px] uppercase tracking-[0.14em] text-orange">
								Public view excludes
							</p>
						</div>
						<ul className="mt-4 space-y-2 text-[12px] leading-5 text-ink-soft">
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-soft/40" />
								Cargo value and invoice amounts
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-soft/40" />
								Exact storage position
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-soft/40" />
								Sensitive goods information
							</li>
						</ul>
					</div>
				</aside>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-5 sm:p-7">
				<p className="max-w-md text-[12px] leading-5 text-ink-soft">
					Need a full record? Sign in to the stakeholder portal for documents, charges, and
					release readiness.
				</p>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink hover:bg-sand"
						onClick={onReset}
					>
						Track another shipment
					</Button>
					<Link to="/portal">
						<Button className="bg-orange text-white hover:bg-orange-deep">
							Open portal <ArrowRight />
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}

function TimelineItem({
	label,
	date,
	location,
	complete,
	active,
}: {
	label: string;
	date: string;
	location: string;
	complete?: boolean;
	active?: boolean;
}) {
	return (
		<div className="relative flex gap-4">
			<span
				className={`relative z-10 mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border-2 bg-paper ${
					complete
						? "border-orange"
						: active
						? "border-orange ring-4 ring-orange/20"
						: "border-line"
				}`}
			>
				{complete && <Check className="size-2.5 text-orange" />}
				{active && <span className="size-1.5 rounded-full bg-orange" />}
			</span>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-baseline justify-between gap-2">
					<p
						className={`text-sm font-semibold ${
							!complete && !active ? "text-ink-soft" : "text-ink"
						}`}
					>
						{label}
					</p>
					{active && (
						<span className="font-mono text-[12px] uppercase tracking-[0.14em] text-orange">
							Current
						</span>
					)}
				</div>
				<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-ink-soft">
					<span className="font-mono">{date}</span>
					<span className="inline-flex items-center gap-1">
						<MapPin className="size-3" />
						{location}
					</span>
				</div>
			</div>
		</div>
	);
}