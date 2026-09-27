import { useState, type FormEvent } from "react";
import {
	BadgeCheck,
	FileCheck2,
	Fingerprint,
	QrCode,
	ScanLine,
	ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicFrame, PublicKicker, PublicStatus } from "@/components/public/public-shell";

const sampleCodes = ["TRN-VER-928371", "TRN-VER-113042"];
const verifiedDocuments: Record<string, { type: string; reference: string; issueDate: string; issuer: string }> = {
	"TRN-VER-928371": {
		type: "Delivery Order",
		reference: "TRN-DO-2026-008721",
		issueDate: "08 Sep 2026",
		issuer: "Meridian Customs Services",
	},
	"TRN-VER-113042": {
		type: "Commercial Invoice",
		reference: "TRN-INV-2026-01482",
		issueDate: "09 Sep 2026",
		issuer: "Atlantic Trade Nigeria Ltd",
	},
};

export function VerifyPage() {
	const [code, setCode] = useState(new URLSearchParams(window.location.search).get("code") ?? "");
	const [verified, setVerified] = useState<{ type: string; reference: string; issueDate: string; issuer: string } | false | null>(null);

	const handleVerify = (event?: FormEvent<HTMLFormElement>) => {
		event?.preventDefault();
		const result = verifiedDocuments[code.trim().toUpperCase()] ?? false;
		setVerified(result);
		toast(result ? "Document verified locally." : "Verification code not found.");
	};

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
					<div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:px-8 lg:py-20">
						<div>
							<PublicKicker>Public document verification</PublicKicker>
							<h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
								Check a <span className="text-orange">TRÏNŪ record.</span>
							</h1>
							<p className="mt-5 max-w-xl leading-7 text-ink-soft">
								Verify the integrity of a document reference without exposing sensitive
								cargo information.
							</p>
						</div>
						<div className="grid grid-cols-3 gap-3">
							{[
								["Reference", "Lookup"],
								["QR", "Deep link"],
								["Safe", "Safe data only"],
							].map(([value, label]) => (
								<div key={label} className="rounded-xl bg-sand p-3 ring-1 ring-line">
									<p className="font-display text-sm font-bold text-ink">{value}</p>
									<p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
										{label}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* VERIFY CARD */}
				<section className="bg-sand">
					<div className="mx-auto max-w-3xl px-5 py-14 lg:px-8 lg:py-20">
						<div className="overflow-hidden rounded-2xl bg-paper shadow-xl ring-1 ring-line">
							<div className="border-b border-line bg-sand p-5 sm:p-7">
								<div className="flex items-center gap-2">
									<div className="grid size-8 place-items-center rounded-md bg-orange text-white">
										<ScanLine className="size-4" />
									</div>
									<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
										Enter verification code
									</p>
								</div>
								<form onSubmit={handleVerify} className="mt-5 flex flex-col gap-2 sm:flex-row">
									<Input
										id="verification-code"
										value={code}
										onChange={(event) => {
											setCode(event.target.value);
											setVerified(null);
										}}
										className="h-12 border-line bg-paper font-mono text-ink"
										placeholder="TRN-VER-XXXXXX"
									/>
									<Button type="submit" className="h-12 bg-orange text-white hover:bg-orange-deep">
										Verify <Fingerprint />
									</Button>
								</form>
								<div className="mt-4 flex flex-wrap items-center gap-2">
									<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Try:
									</span>
									{sampleCodes.map((sample) => (
										<button
											key={sample}
											type="button"
												onClick={() => {
												setCode(sample);
												setVerified(null);
											}}
											className="rounded-full border border-line bg-paper px-3 py-1 font-mono text-[11px] text-ink-soft transition-colors hover:border-orange/40 hover:bg-orange/10 hover:text-orange"
										>
											{sample}
										</button>
									))}
								</div>
							</div>

							{verified ? (
								<div className="p-5 sm:p-7">
									<div className="flex items-start gap-3">
										<div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange text-white">
											<BadgeCheck className="size-6" />
										</div>
										<div>
											<PublicStatus label="Document verified" tone="success" />
											<h2 className="mt-2 font-display text-xl font-bold text-ink">
												Record matches the controlled TRÏNŪ record.
											</h2>
											<p className="mt-1 text-[12px] text-ink-soft">
												Reference, issuer, and issue date align with the system of
												record.
											</p>
										</div>
									</div>

									<div className="mt-7 grid gap-6 border-t border-line pt-7 sm:grid-cols-[1fr_180px]">
										<div>
											<div className="flex items-center gap-2">
												<FileCheck2 className="size-4 text-orange" />
												<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
													Document detail
												</p>
											</div>
											<dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
												<div>
													<dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-soft">
														Document type
													</dt>
													<dd className="mt-1 font-medium text-ink">{verified.type}</dd>
												</div>
												<div>
													<dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-soft">
														Reference
													</dt>
													<dd className="mt-1 font-mono text-ink">{verified.reference}</dd>
												</div>
												<div>
													<dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-soft">
														Issue date
													</dt>
													<dd className="mt-1 text-ink">{verified.issueDate}</dd>
												</div>
												<div>
													<dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-soft">
														Issued by
													</dt>
													<dd className="mt-1 text-ink">{verified.issuer}</dd>
												</div>
											</dl>
											<div className="mt-6 flex items-center gap-2 rounded-lg bg-orange/10 px-3 py-2 ring-1 ring-orange/25">
												<ShieldCheck className="size-4 shrink-0 text-orange" />
												<p className="text-[12px] leading-5 text-orange">
													This check compares the reference to the controlled TRÏNŪ
													record.
												</p>
											</div>
										</div>
										<div className="grid aspect-square place-items-center rounded-2xl bg-sand p-4 ring-1 ring-line">
											<div className="grid size-full place-items-center rounded-md border-2 border-ink p-3">
												<QrCode className="size-full text-ink" />
											</div>
										</div>
									</div>
								</div>
							) : verified === false ? (
								<div className="p-5 sm:p-7">
									<div className="rounded-2xl bg-carmine/5 p-6 ring-1 ring-carmine/25">
										<div className="flex items-start gap-3">
											<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
												<ShieldCheck className="size-5" />
											</div>
											<div>
												<p className="font-display text-base font-bold text-ink">
													No controlled record matched that code.
												</p>
												<p className="mt-1 text-sm leading-6 text-ink-soft">
													Check the code, or contact the issuing desk if the document
													is still in review.
												</p>
											</div>
										</div>
									</div>
								</div>
							) : null}
						</div>
					</div>
				</section>
			</main>
		</PublicFrame>
	);
}