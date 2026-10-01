import { useState, useEffect, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
	AlertTriangle,
	ArrowRight,
	Check,
	Copy,
	Download,
	Lock,
	ShieldCheck,
	Smartphone,
} from "lucide-react";
import { http, type Resp } from "@/lib/httpClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Step = "loading" | "scan" | "verify" | "recovery" | "error";

export default function MfaSetup() {
	const navigate = useNavigate();
	const [step, setStep] = useState<Step>("loading");
	const [otpauthUri, setOtpauthUri] = useState("");
	const [secret, setSecret] = useState("");
	const [code, setCode] = useState("");
	const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [loadError, setLoadError] = useState("");

	const digits = code.replace(/\D/g, "").slice(0, 6);
	const complete = digits.length === 6;

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await http.post("auth/mfa/setup/init/");
				const resp: Resp = res.data;
				if (cancelled) return;
				if (resp.error) {
					setLoadError(resp.data || "Could not start MFA setup.");
					setStep("error");
					return;
				}
				setOtpauthUri(resp.code.otpauth_uri);
				setSecret(resp.code.secret);
				setStep("scan");
			} catch (error: any) {
				if (cancelled) return;
				setLoadError(
					error?.response?.data?.message || "Could not start MFA setup."
				);
				setStep("error");
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!complete || submitting) return;
		setSubmitting(true);
		try {
			const res = await http.post("auth/mfa/setup/verify/", { code: digits });
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "That code didn't match. Try again.");
				setCode("");
				return;
			}
			setRecoveryCodes(resp.code.recovery_codes);
			setStep("recovery");
			toast.success("Two-factor authentication is now enabled.");
		} catch (error: any) {
			toast.error(
				error?.response?.data?.message || "Could not verify the code. Try again."
			);
			setCode("");
		} finally {
			setSubmitting(false);
		}
	};

	const copySecret = async () => {
		try {
			await navigator.clipboard.writeText(secret);
			toast.success("Setup key copied.");
		} catch {
			toast.error("Could not copy. Select the text manually.");
		}
	};

	const copyRecoveryCodes = async () => {
		try {
			await navigator.clipboard.writeText(recoveryCodes.join("\n"));
			toast.success("Recovery codes copied.");
		} catch {
			toast.error("Could not copy. Select the text manually.");
		}
	};

	const downloadRecoveryCodes = () => {
		const text = `TRINU Recovery Codes\nGenerated: ${new Date().toISOString()}\n\n${recoveryCodes.join("\n")}\n\nEach code can be used once. Keep these somewhere safe and offline.\n`;
		const blob = new Blob([text], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `trinu-recovery-codes-${Date.now()}.txt`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Recovery codes downloaded.");
	};

	return (
		<AuthShell
			kicker="Two-factor setup"
			title="Add a second factor"
			titleAccent="to your account."
			subtitle="Two-factor authentication protects your account even if your password is compromised. Setup takes about two minutes."
			leftBullets={[
				"Use an authenticator app (Google Authenticator, Authy, 1Password, or similar)",
				"Scan the QR code or enter the setup key manually",
				"Save your recovery codes somewhere safe",
				"Setup can be managed by your administrator later",
			]}
		>
			<div className="overflow-hidden rounded-2xl bg-paper shadow-xl ring-1 ring-line">
				<div className="border-b border-line bg-sand p-6 sm:p-7">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="grid size-8 place-items-center rounded-md bg-orange text-white">
								<Smartphone className="size-4" />
							</div>
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								Authenticator enrolment
							</p>
						</div>
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
							Step{" "}
							{step === "scan" || step === "loading" || step === "error"
								? 1
								: step === "verify"
								? 2
								: 3}{" "}
							/ 3
						</p>
					</div>
					<h2 className="mt-4 font-display text-2xl font-bold text-ink">
						{step === "loading" && "Preparing setup"}
						{step === "error" && "Could not start setup"}
						{step === "scan" && "Scan the code"}
						{step === "verify" && "Confirm the code"}
						{step === "recovery" && "Save your recovery codes"}
					</h2>
					<div className="mt-4 flex gap-1.5">
						{[0, 1, 2].map((i) => {
							const current =
								step === "scan" || step === "loading" || step === "error"
									? 0
									: step === "verify"
									? 1
									: 2;
							return (
								<div
									key={i}
									className={cn(
										"h-1 flex-1 rounded-full transition-colors",
										i <= current ? "bg-orange" : "bg-line"
									)}
								/>
							);
						})}
					</div>
				</div>

				{step === "loading" && (
					<div className="flex flex-col items-center gap-4 p-6 text-center sm:p-7">
						<span className="size-8 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
						<p className="text-sm text-ink-soft">
							Preparing your authenticator setup…
						</p>
					</div>
				)}

				{step === "error" && (
					<div className="p-6 sm:p-7">
						<div className="flex items-start gap-3 rounded-xl bg-carmine/5 p-4 ring-1 ring-carmine/25">
							<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
								<AlertTriangle className="size-5" />
							</div>
							<div>
								<p className="font-display text-base font-bold text-ink">
									Could not start setup
								</p>
								<p className="mt-1 text-sm leading-6 text-ink-soft">
									{loadError || "Try again in a moment."}
								</p>
							</div>
						</div>
						<div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
							<Link
								to="/session-management"
								className="text-[12px] text-ink-soft hover:text-orange"
							>
								Back to account security
							</Link>
							<Button
								onClick={() => window.location.reload()}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								Try again <ArrowRight />
							</Button>
						</div>
					</div>
				)}

				{step === "scan" && (
					<div className="p-6 sm:p-7">
						<p className="text-[13px] leading-6 text-ink-soft">
							Open your authenticator app and scan the code below. If you can't scan,
							enter the setup key manually.
						</p>

						<div className="mt-5 grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
							<div className="grid aspect-square place-items-center rounded-2xl bg-white p-4 ring-1 ring-line">
								<QRCodeSVG
									value={otpauthUri}
									size={160}
									level="M"
									bgColor="#ffffff"
									fgColor="#2B2A28"
								/>
							</div>
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
									Manual setup key
								</p>
								<div className="mt-2 flex items-center gap-2 rounded-md bg-sand px-3 py-2 ring-1 ring-line">
									<code className="min-w-0 flex-1 break-all font-mono text-[13px] text-ink">
										{secret}
									</code>
									<button
										type="button"
										onClick={copySecret}
										aria-label="Copy setup key"
										className="grid size-7 shrink-0 place-items-center rounded-md text-ink-soft transition-colors hover:bg-sand-2 hover:text-orange"
									>
										<Copy className="size-3.5" />
									</button>
								</div>
								<p className="mt-3 text-[11px] leading-5 text-ink-soft">
									The setup key is time-based. Any standard TOTP authenticator works
									(Google Authenticator, Authy, 1Password, Bitwarden).
								</p>
							</div>
						</div>

						<div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
							<Link
								to="/session-management"
								className="text-[12px] text-ink-soft hover:text-orange"
							>
								Cancel setup
							</Link>
							<Button
								onClick={() => setStep("verify")}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								I've scanned it <ArrowRight />
							</Button>
						</div>
					</div>
				)}

				{step === "verify" && (
					<form onSubmit={handleVerify} className="p-6 sm:p-7">
						<p className="text-[13px] leading-6 text-ink-soft">
							Enter the six-digit code from your authenticator app to confirm setup.
						</p>

						<label className="mt-5 block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Verification code
							</span>
							<Input
								autoFocus
								inputMode="numeric"
								maxLength={6}
								autoComplete="one-time-code"
								placeholder="000000"
								value={digits}
								onChange={(e) => setCode(e.target.value)}
								className="mt-2 h-12 border-line bg-sand text-center font-mono text-lg tracking-[0.4em] text-ink"
							/>
						</label>

						<div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
							<Button
								type="button"
								variant="ghost"
								onClick={() => setStep("scan")}
								className="text-ink-soft"
							>
								Back
							</Button>
							<Button
								type="submit"
								disabled={submitting || !complete}
								className={cn(
									"bg-orange text-white hover:bg-orange-deep",
									(submitting || !complete) && "opacity-60"
								)}
							>
								{submitting ? "Verifying…" : "Confirm and enable"}
								{!submitting && <ArrowRight />}
							</Button>
						</div>
					</form>
				)}

				{step === "recovery" && (
					<div className="p-6 sm:p-7">
						<div className="flex items-start gap-3">
							<div className="grid size-10 shrink-0 place-items-center rounded-full bg-orange text-white">
								<Check className="size-5" />
							</div>
							<div>
								<p className="font-display text-base font-bold text-ink">
									Two-factor is now enabled
								</p>
								<p className="mt-1 text-[12px] leading-5 text-ink-soft">
									Save the recovery codes below. Each code can be used once if you lose
									access to your authenticator.
								</p>
							</div>
						</div>

						<div className="mt-5 rounded-xl bg-sand p-4 ring-1 ring-line">
							<div className="grid grid-cols-2 gap-2">
								{recoveryCodes.map((c) => (
									<p
										key={c}
										className="rounded-md bg-paper px-2.5 py-1.5 font-mono text-[12px] text-ink ring-1 ring-line"
									>
										{c}
									</p>
								))}
							</div>
						</div>

						<div className="mt-5 flex items-start gap-2 rounded-xl bg-carmine/5 p-4 ring-1 ring-carmine/25">
							<Lock className="mt-0.5 size-4 shrink-0 text-carmine" />
							<p className="text-[12px] leading-5 text-ink-soft">
								Store these codes somewhere safe and offline. Do not share them. Anyone
								with a recovery code can sign in as you.
							</p>
						</div>

						<div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={copyRecoveryCodes}
									className="border-line bg-paper text-ink hover:bg-sand"
								>
									<Copy className="size-3.5" />
									Copy codes
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={downloadRecoveryCodes}
									className="border-line bg-paper text-ink hover:bg-sand"
								>
									<Download className="size-3.5" />
									Download
								</Button>
							</div>
							<Button
								onClick={() => navigate("/session-management", { replace: true })}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								Finish <ArrowRight />
							</Button>
						</div>
					</div>
				)}
			</div>

			<p className="mt-6 text-center text-[12px] text-ink-soft">
				Already set up?{" "}
				<Link to="/mfa" className="font-semibold text-orange">
					Go to verification
				</Link>
			</p>

			<LegalFooter />
		</AuthShell>
	);
}

function AuthShell({
	kicker,
	title,
	titleAccent,
	subtitle,
	leftBullets,
	children,
}: {
	kicker: string;
	title: string;
	titleAccent: string;
	subtitle: string;
	leftBullets: string[];
	children: React.ReactNode;
}) {
	return (
		<div className="relative min-h-screen overflow-hidden bg-paper text-ink">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -right-40 -top-40 size-[620px] rounded-full bg-orange/20 blur-3xl"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -left-40 bottom-0 size-[480px] rounded-full bg-carmine/15 blur-3xl"
			/>

			<div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-0 px-5 py-10 lg:grid-cols-[1fr_520px] lg:gap-16 lg:px-8 lg:py-14">
				<div className="hidden min-w-0 flex-col justify-between lg:flex">
					<Link to="/" aria-label="TRINU home" className="inline-flex">
						<img src="/logo.png" alt="TRINU Bonded Terminal" className="h-14 w-14" />
					</Link>

					<div className="max-w-lg">
						<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange">
							{kicker}
						</p>
						<h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-[1.05] text-ink xl:text-5xl">
							{title}
							{titleAccent ? (
								<>
									{" "}
									<span className="text-orange">{titleAccent}</span>
								</>
							) : null}
						</h1>
						<p className="mt-6 text-base leading-7 text-ink-soft">{subtitle}</p>

						<ul className="mt-9 space-y-3">
							{leftBullets.map((item) => (
								<li key={item} className="flex items-start gap-3 text-sm text-ink">
									<span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-orange text-white">
										<Check className="size-3" />
									</span>
									{item}
								</li>
							))}
						</ul>
					</div>

					<div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
						<span>TRINŪ · Abuja Flagship Facility</span>
					</div>
				</div>

				<div className="flex min-w-0 items-center justify-center">
					<div className="w-full min-w-0 max-w-lg">
						<div className="mb-8 flex items-center justify-between lg:hidden">
							<Link to="/" aria-label="TRINU home" className="inline-flex">
								<img src="/logo.png" alt="TRINU Bonded Terminal" className="h-12 w-12" />
							</Link>
							<Link to="/login" className="text-[12px] font-semibold text-orange">
								Back to sign-in
							</Link>
						</div>
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}

function LegalFooter() {
	return (
		<nav className="mt-6 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
			<Link to="/" className="hover:text-orange">
				← Back to TRINŪ
			</Link>
			<div className="flex items-center gap-4">
				<Link to="/privacy" className="hover:text-orange">
					Privacy
				</Link>
				<Link to="/terms" className="hover:text-orange">
					Terms
				</Link>
				<Link to="/compliance" className="hover:text-orange">
					Compliance
				</Link>
			</div>
		</nav>
	);
}