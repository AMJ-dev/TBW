import { useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	BadgeCheck,
	Fingerprint,
	Info,
	Lock,
	QrCode,
	ScanLine,
	ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicFrame, PublicKicker, PublicStatus } from "@/components/public/public-shell";

type VerifiedDocument = {
	type: string;
	reference: string;
	issueDate: string;
	issuer: string;
	officer: string;
	seal: string;
	hash: string;
	notes: string;
};

const sampleCodes = ["TRN-DOC-VAL-88219-NCS", "TRN-VER-928371", "TRN-VER-113042"];

const verifiedDocuments: Record<string, VerifiedDocument> = {
	"TRN-DOC-VAL-88219-NCS": {
		type: "Bonded Cargo Intake & Tally Certificate (Form TRN-T1)",
		reference: "TRN-DOC-VAL-88219-NCS",
		issueDate: "24 October 2026, 14:15:02 WAT",
		issuer: "TRÏNŪ Inland Bonded Terminal — Abuja Central Records",
		officer: "Alhaji Ibrahim Bello (Badge ID: TRN-OFF-044)",
		seal: "NCS-ABJ-BOND-SEAL #482019",
		hash: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
		notes:
			"This verification hash directly validates physical cargo placement in Bonded Yard Sector 3-B under bonded warehouse licence bond #BND-0941.",
	},
	"TRN-VER-928371": {
		type: "Delivery Order",
		reference: "TRN-DO-2026-008721",
		issueDate: "08 Sep 2026, 11:04 WAT",
		issuer: "Meridian Customs Services",
		officer: "A. Balogun (Badge ID: MCS-OFF-212)",
		seal: "NCS-ABJ-BOND-SEAL #410882",
		hash: "e8b94f1c9842a17688cb998f420138d58a",
		notes:
			"Delivery Order released against satisfied terminal handling obligations and a valid NCS authorisation reference on the Customs Single Window.",
	},
	"TRN-VER-113042": {
		type: "Commercial Invoice",
		reference: "TRN-INV-2026-01482",
		issueDate: "09 Sep 2026, 16:22 WAT",
		issuer: "Atlantic Trade Nigeria Ltd",
		officer: "M. Adeyemi (Badge ID: ATN-OFF-018)",
		seal: "NCS-ABJ-BOND-SEAL #412077",
		hash: "3b1f5c920a4d77e8b8c9e0a1f3d5c8e7a2b6d8f4c1e3a5b7d9f2c4e6a8b0d1c3",
		notes:
			"Invoice reference matches the consignment file and terminal record. Financial clearance noted at the terminal billing desk.",
	},
};

export default function VerifyPage() {
	const [code, setCode] = useState(
		new URLSearchParams(window.location.search).get("code") ?? ""
	);
	const [verified, setVerified] = useState<VerifiedDocument | false | null>(null);
	const [busy, setBusy] = useState(false);

	const handleVerify = (event?: FormEvent<HTMLFormElement>) => {
		event?.preventDefault();
		const cleaned = code.trim().toUpperCase();
		if (!cleaned) {
			toast.error("Enter a verification code to continue.");
			return;
		}
		setBusy(true);
		setTimeout(() => {
			const result = verifiedDocuments[cleaned] ?? false;
			setVerified(result);
			setBusy(false);
			toast(result ? "Document verified locally." : "Verification code not found.");
			if (result) {
				document
					.getElementById("verification-result")
					?.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		}, 500);
	};

	const fillSample = (value: string) => {
		setCode(value);
		setVerified(null);
	};

	return (
		<PublicFrame>
			<main>
				{/* HERO — matches VerifyDocumentPage structure */}
				<section className="relative overflow-hidden border-b border-line bg-sand">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -right-32 -top-40 size-[560px] rounded-full bg-orange/20 blur-3xl"
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -left-40 bottom-0 size-[420px] rounded-full bg-carmine/15 blur-3xl"
					/>
					<div className="relative mx-auto flex max-w-4xl flex-col items-center px-5 py-16 text-center lg:px-8 lg:py-20">
						<span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1 font-mono text-[12px] uppercase tracking-[0.16em] text-orange ring-1 ring-orange/25">
							<ShieldCheck className="size-3.5" />
							Local document verification
						</span>
						<h1 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
							Verify a <span className="text-orange">document.</span>
						</h1>
						<p className="mt-5 max-w-2xl text-base leading-7 text-ink-soft sm:text-lg">
							Enter the sample verification code shown below. No terminal or Customs
							system is queried. Only safe authenticity data is returned.
						</p>

						{/* Verify form card */}
						<div className="mt-10 w-full max-w-2xl rounded-2xl bg-paper p-6 text-left shadow-xl ring-1 ring-line sm:p-7">
							<form onSubmit={handleVerify} className="flex flex-col gap-4">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<label
										htmlFor="docCode"
										className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-soft"
									>
										Verification code or terminal security hash
									</label>
									<span className="inline-flex items-center gap-1 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-soft">
										<Info className="size-3" />
										Code format guide
									</span>
								</div>

								<div className="relative">
									<Input
										id="docCode"
										value={code}
										onChange={(event) => {
											setCode(event.target.value);
											setVerified(null);
										}}
										className="h-12 border-line bg-sand pr-12 font-mono text-ink"
										placeholder="TRN-DOC-VAL-XXXXX-NCS"
									/>
									<button
										type="button"
										onClick={() => fillSample("TRN-DOC-VAL-88219-NCS")}
										aria-label="Fill sample code"
										className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-ink-soft transition-colors hover:bg-sand-2 hover:text-orange"
									>
										<QrCode className="size-4" />
									</button>
								</div>

								<div className="flex flex-wrap items-center justify-between gap-2 text-ink-soft">
									<span className="font-mono text-[12px] uppercase tracking-[0.12em]">
										Terminal key: ABUJA-CENTRAL-NODE-01
									</span>
									<span className="font-mono text-[12px] uppercase tracking-[0.12em]">
										Local sample only
									</span>
								</div>

								<Button
									type="submit"
									disabled={busy}
									className="mt-1 h-12 w-full bg-orange text-white hover:bg-orange-deep"
								>
									{busy ? (
										<>
											<span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
											Querying terminal ledger…
										</>
									) : (
										<>
											Verify document <Fingerprint />
										</>
									)}
								</Button>
							</form>

							<div className="mt-4 flex flex-wrap items-center gap-2">
								<span className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-soft">
									Try:
								</span>
								{sampleCodes.map((sample) => (
									<button
										key={sample}
										type="button"
										onClick={() => fillSample(sample)}
										className="rounded-full border border-line bg-sand px-3 py-1 font-mono text-[11px] text-ink-soft transition-colors hover:border-orange/40 hover:bg-orange/10 hover:text-orange"
									>
										{sample}
									</button>
								))}
							</div>
						</div>

						<div className="mt-6 flex flex-wrap items-center justify-center gap-2">
							<span className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-soft">
								Standard formats:
							</span>
							{[
								"Form TRN-T1 (Intake)",
								"Form TRN-C4 (Clearance)",
								"Form TRN-WH2 (Bonded Transit)",
							].map((f) => (
								<span
									key={f}
									className="inline-flex items-center rounded-md bg-paper px-2 py-0.5 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-soft ring-1 ring-line"
								>
									{f}
								</span>
							))}
						</div>
					</div>
				</section>

				{/* RESULT — same rich layout as VerifyDocumentPage */}
				{verified && (
					<section id="verification-result" className="scroll-mt-24 bg-paper">
						<div className="mx-auto max-w-4xl px-5 py-14 lg:px-8 lg:py-20">
							{/* Header */}
							<div className="overflow-hidden rounded-2xl bg-paper shadow-lg ring-1 ring-line">
								<div className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-sand p-6 sm:p-7">
									<div className="flex items-start gap-3">
										<div className="grid size-12 shrink-0 place-items-center rounded-xl bg-orange text-white">
											<BadgeCheck className="size-6" />
										</div>
										<div>
											<div className="flex flex-wrap items-center gap-2">
												<PublicStatus label="Document verified" tone="success" />
												<span className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink-soft">
													Local record
												</span>
											</div>
											<h2 className="mt-2 font-display text-xl font-bold text-ink sm:text-2xl">
												{verified.type}
											</h2>
										</div>
									</div>
									<Button
										variant="outline"
										onClick={() => window.print()}
										className="border-line bg-paper text-ink hover:bg-sand"
									>
										Export record
									</Button>
								</div>

								{/* Detail grid */}
								<div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[1fr_180px]">
									<div>
										<dl className="grid gap-4 text-sm sm:grid-cols-2">
											<div>
												<dt className="font-mono text-[12px] uppercase tracking-[0.13em] text-ink-soft">
													Document reference
												</dt>
												<dd className="mt-1 font-mono text-ink">
													{verified.reference}
												</dd>
											</div>
											<div>
												<dt className="font-mono text-[12px] uppercase tracking-[0.13em] text-ink-soft">
													Issue timestamp
												</dt>
												<dd className="mt-1 font-mono text-ink">
													{verified.issueDate}
												</dd>
											</div>
											<div>
												<dt className="font-mono text-[12px] uppercase tracking-[0.13em] text-ink-soft">
													Issuing authority
												</dt>
												<dd className="mt-1 text-ink">{verified.issuer}</dd>
											</div>
											<div>
												<dt className="font-mono text-[12px] uppercase tracking-[0.13em] text-ink-soft">
													Issuing officer
												</dt>
												<dd className="mt-1 text-ink">{verified.officer}</dd>
											</div>
											<div className="sm:col-span-2">
												<dt className="font-mono text-[12px] uppercase tracking-[0.13em] text-ink-soft">
													Terminal seal reference
												</dt>
												<dd className="mt-1 font-mono text-ink">
													{verified.seal}
												</dd>
											</div>
										</dl>

										<div className="mt-6 rounded-xl bg-sand p-4 ring-1 ring-line">
											<div className="flex items-center gap-2">
												<Lock className="size-4 text-orange" />
												<p className="font-mono text-[12px] uppercase tracking-[0.14em] text-orange">
													Ledger integrity proof
												</p>
											</div>
											<p className="mt-2 text-[12px] leading-6 text-ink-soft">
												{verified.notes}
											</p>
											<div className="mt-3 flex items-center justify-between border-t border-line pt-3">
												<span className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink-soft">
													Status: Active on terminal
												</span>
												<span className="size-2 rounded-full bg-orange" />
											</div>
										</div>
									</div>

									<div className="grid aspect-square place-items-center rounded-2xl bg-sand p-4 ring-1 ring-line">
										<div className="grid size-full place-items-center rounded-md border-2 border-ink p-3">
											<QrCode className="size-full text-ink" />
										</div>
									</div>
								</div>

								{/* Hash footer */}
								<div className="flex flex-wrap items-center gap-3 border-t border-line bg-sand px-6 py-3 sm:px-7">
									<Fingerprint className="size-4 shrink-0 text-orange" />
									<span className="font-mono text-[12px] uppercase tracking-[0.12em] text-orange">
										Security hash
									</span>
									<code className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-soft">
										SHA-256: {verified.hash}
									</code>
									<button
										type="button"
										onClick={() => {
											navigator.clipboard.writeText(verified.hash);
											toast.success("Cryptographic hash copied.");
										}}
										className="font-mono text-[12px] uppercase tracking-[0.12em] font-semibold text-orange hover:text-orange-deep"
									>
										Copy hash
									</button>
								</div>
							</div>

							{/* Cargo milestone CTA */}
							<div className="mt-6 rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-7">
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div className="flex items-start gap-3">
										<ScanLine className="mt-0.5 size-4 shrink-0 text-orange" />
										<p className="max-w-md text-[13px] leading-6 text-ink-soft">
											This document is linked to a consignment. View the movement
											timeline on public tracking.
										</p>
									</div>
									<Link to="/tracking">
										<Button
											variant="outline"
											className="border-line bg-paper text-ink hover:bg-sand"
										>
											View cargo milestones <ArrowRight className="size-4" />
										</Button>
									</Link>
								</div>
							</div>

							{/* Safe authenticity notice */}
							<div className="mt-6 rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-7">
								<div className="flex items-start gap-3">
									<div className="grid size-10 shrink-0 place-items-center rounded-full bg-orange/10 text-orange">
										<ShieldCheck className="size-5" />
									</div>
									<div>
										<p className="font-display text-sm font-bold text-ink">
											Safe authenticity notice & statutory fraud advisory
										</p>
										<p className="mt-2 text-[12px] leading-5 text-ink-soft">
											Only safe authenticity data is shown. Altered or counterfeit
											documents will fail verification. Consignee details,
											commercial invoice values, and specific itemised contents
											remain redacted in compliance with federal trade data privacy
											standards.
										</p>
										<p className="mt-3 text-[12px] leading-5 text-ink-soft">
											Need to report an unverified or disputed document? Contact
											our terminal legal and compliance desk at{" "}
											<a
												href="mailto:compliance@trinu.ng"
												className="font-semibold text-orange hover:text-orange-deep"
											>
												compliance@trinu.ng
											</a>
											.
										</p>
									</div>
								</div>
							</div>

							{/* Integrity architecture */}
							<div className="mt-6 rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-7">
								<PublicKicker>Integrity architecture</PublicKicker>
								<h2 className="mt-2 font-display text-lg font-bold text-ink">
									How the code match works
								</h2>
								<div className="mt-5 grid gap-5 sm:grid-cols-3">
									{[
										{
											n: "01",
											t: "Enter the sample code",
											d: "Use the example verification code displayed above to test the local interface.",
										},
										{
											n: "02",
											t: "Local comparison",
											d: "The code is compared with a single sample record bundled in this UI prototype.",
										},
										{
											n: "03",
											t: "No external check",
											d: "No cryptographic authority, Customs system, or backend is queried by this demonstration.",
										},
									].map((item) => (
										<div key={item.n} className="flex flex-col gap-2">
											<span className="grid size-8 place-items-center rounded-full bg-orange font-mono text-[12px] font-semibold text-white">
												{item.n}
											</span>
											<p className="font-display text-sm font-bold text-ink">
												{item.t}
											</p>
											<p className="text-[12px] leading-5 text-ink-soft">
												{item.d}
											</p>
										</div>
									))}
								</div>
							</div>
						</div>
					</section>
				)}

				{/* NOT FOUND — same treatment as VerifyDocumentPage */}
				{verified === false && (
					<section id="verification-result" className="scroll-mt-24 bg-paper">
						<div className="mx-auto max-w-4xl px-5 py-14 lg:px-8 lg:py-20">
							<div className="rounded-2xl border-l-4 border-carmine bg-carmine/5 p-6 ring-1 ring-carmine/25 sm:p-7">
								<div className="flex items-start gap-3">
									<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
										<AlertTriangle className="size-5" />
									</div>
									<div>
										<p className="font-display text-base font-bold text-ink">
											No matching document
										</p>
										<p className="mt-1 text-sm leading-6 text-ink-soft">
											Check the code and try one of the supplied samples.
											Verification on this page uses local sample data only.
										</p>
										<button
											type="button"
											onClick={() => fillSample("TRN-DOC-VAL-88219-NCS")}
											className="mt-3 font-mono text-[12px] uppercase tracking-[0.12em] font-semibold text-carmine hover:text-brown"
										>
											Fill the sample code
										</button>
									</div>
								</div>
							</div>
						</div>
					</section>
				)}
			</main>
		</PublicFrame>
	);
}