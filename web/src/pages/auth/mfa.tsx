import { useState, useEffect, useContext, startTransition, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import { useNavigate } from "react-router-dom";
import {
	ArrowRight,
	Check,
	KeyRound,
	Lock,
	ShieldCheck,
	Smartphone,
} from "lucide-react";
import { http, type Resp } from '@/lib/httpClient'
import userContext from '@/lib/userContext'
import { useDeviceInfo } from '@/hooks/useDeviceInfo'
import { useLocationInfo } from '@/hooks/useLocationInfo'
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Mode = "setup" | "challenge";

export function MfaPage({ mode = "challenge" }: { mode?: Mode }) {
	return mode == "setup" ? <MfaSetup /> : <MfaChallenge />;
}

function MfaChallenge() {
	const navigate = useNavigate()
	const { login } = useContext(userContext)
	const deviceInfo = useDeviceInfo()
	const { locationInfo, loading: locationLoading } = useLocationInfo()
	const [jwt, setJwt] = useState<string>('')
	const [remember, setRemember] = useState<boolean>(false)
	const [code, setCode] = useState("");
	const [trustDevice, setTrustDevice] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [mounted, setMounted] = useState(false)
	const [email, setEmail] = useState<string>('')
	const [countdown, setCountdown] = useState<number>(30)
	const [canResend, setCanResend] = useState<boolean>(false)
	const digits = code.replace(/\D/g, "").slice(0, 6);
	const complete = digits.length === 6;

	useEffect(() => {
		setMounted(true)
		const JWT = sessionStorage.getItem('jwt')
		const Email = sessionStorage.getItem('email')
		const Remember = sessionStorage.getItem('remember')
		if (!JWT || !Email) {
			startTransition(() => navigate('/login'))
			return
		}
		setJwt(JWT)
		setEmail(Email)
		setRemember(Remember === 'true')
	}, [])
		
	useEffect(() => {
		if (countdown > 0 && !canResend) {
			const t = setTimeout(() => setCountdown(prev => prev - 1), 1000)
			return () => clearTimeout(t)
		} else if (countdown === 0 && !canResend) setCanResend(true)
	}, [countdown, canResend])


	const formatDeviceInfo = () => `${deviceInfo.browser} on ${deviceInfo.os} (${deviceInfo.deviceType})`
	const formatLocationInfo = () => (locationInfo ? `${locationInfo.city}, ${locationInfo.region}, ${locationInfo.country}` : 'Location information not available')

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!complete) {
			toast.error("Enter all six digits to continue.");
			return;
		}
		setSubmitting(true);

		const formData = { otp: digits, jwt, deviceInfo: formatDeviceInfo(), locationInfo: formatLocationInfo() }
		try {
			const resp: Resp = await http.post('login-verify-otp/', formData)
			if (resp.error) toast.error(resp.data || 'Invalid OTP. Please try again.')
			else {
				sessionStorage.removeItem('jwt')
				sessionStorage.removeItem('email')
				toast.success(resp.data)
				login({ token: resp.code.token, remember })
				let redirect = sessionStorage.getItem('redirect')
				// startTransition(() => navigate(redirect??'/dashboard', { replace: true }))
			}
		} catch (error: any) {
			console.error(error)
			toast.error(error?.response?.data?.message || 'Invalid OTP. Please try again.')
		} finally {
			setSubmitting(false)
		}
	};

	return (
		<AuthShell
			kicker="Two-factor authentication"
			title="Verify it's really you."
			titleAccent=""
			subtitle="We sent a six-digit code to the authenticator app registered on your account. Codes refresh every thirty seconds."
			leftBullets={[
				"Use the code from your authenticator app",
				"If you don't have your device, contact your administrator",
				"Trust this device for 30 days to reduce prompts",
				"Session and device controls stay active after sign-in",
			]}
		>
			<div className="overflow-hidden rounded-2xl bg-paper shadow-xl ring-1 ring-line">
				<div className="border-b border-line bg-sand p-6 sm:p-7">
					<div className="flex items-center gap-2">
						<div className="grid size-8 place-items-center rounded-md bg-orange text-white">
							<KeyRound className="size-4" />
						</div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
							Account security
						</p>
					</div>
					<h2 className="mt-4 font-display text-2xl font-bold text-ink">
						Enter your 6-digit code
					</h2>
					<p className="mt-1 text-[12px] text-ink-soft">
						Signing in as{" "}
						<span className="font-mono text-ink">{email}</span>
					</p>
				</div>

				<form onSubmit={handleSubmit} className="p-6 sm:p-7">
					<label className="block">
						<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							One-time code
						</span>
						<div className="mt-3 grid grid-cols-6 gap-2">
							{Array.from({ length: 6 }).map((_, i) => (
								<div
									key={i}
									className={cn(
										"grid h-12 place-items-center rounded-md border border-line bg-sand font-mono text-lg font-semibold text-ink transition-colors",
										digits[i] ? "border-orange/50 bg-orange/10 text-orange" : ""
									)}
								>
									{digits[i] ?? ""}
								</div>
							))}
						</div>
						<Input
							autoFocus
							inputMode="numeric"
							autoComplete="one-time-code"
							maxLength={6}
							value={digits}
							onChange={(e) => setCode(e.target.value)}
							placeholder=""
							aria-label="One-time code"
							className="sr-only"
						/>
					</label>

					<label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
						<input
							type="checkbox"
							checked={trustDevice}
							onChange={(e) => setTrustDevice(e.target.checked)}
							className="mt-0.5 size-4 shrink-0 rounded border-line accent-orange"
						/>
						<span className="text-[12px] leading-5 text-ink">
							Trust this device for 30 days
							<span className="block text-[11px] text-ink-soft">
								You will still need to sign in with your password each time.
							</span>
						</span>
					</label>

					<Button
						type="submit"
						disabled={submitting || !complete}
						className={cn(
							"mt-6 h-11 w-full bg-orange text-white hover:bg-orange-deep",
							(submitting || !complete) && "opacity-60"
						)}
					>
						{submitting ? "Verifying…" : "Verify and sign in"}
						{!submitting && <ArrowRight />}
					</Button>

					<div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[12px]">
						<button
							type="button"
							className="font-semibold text-orange"
							onClick={() => toast.success("Code resend simulated locally.")}
						>
							Resend code
						</button>
						<Link
							to="/login"
							className="text-ink-soft hover:text-orange"
						>
							Use a different account
						</Link>
					</div>

					<div className="mt-6 flex items-start gap-2 rounded-xl bg-sand p-4 ring-1 ring-line">
						<ShieldCheck className="mt-0.5 size-4 shrink-0 text-orange" />
						<p className="text-[12px] leading-5 text-ink-soft">
							Lost your device or can't access your authenticator?{" "}
							<Link to="/contact" className="font-semibold text-orange">
								Contact your administrator
							</Link>{" "}
							to begin account recovery. Recovery is dual-approved.
						</p>
					</div>
				</form>
			</div>

			<p className="mt-6 text-center text-[12px] text-ink-soft">
				Don't have two-factor yet?{" "}
				<Link to="/mfa/setup" className="font-semibold text-orange">
					Set it up now
				</Link>
			</p>

			<LegalFooter />
		</AuthShell>
	);
}

function MfaSetup() {
	const [step, setStep] = useState(0);
	const [code, setCode] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const digits = code.replace(/\D/g, "").slice(0, 6);
	const complete = digits.length === 6;

	const backupCodes = [
		"8F2H-P9QW-4L2K",
		"7M3N-B6VC-9X1D",
		"5K8J-R2YF-3T4W",
		"9Q4P-L7ZH-6N2B",
		"2X6D-W1KM-8R5J",
		"4B9V-T3YQ-7P1C",
		"6L1R-K9JN-2W8F",
		"3C7M-H5VD-4Y9X",
	];

	const handleVerify = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!complete) {
			toast.error("Enter all six digits from your authenticator to continue.");
			return;
		}
		setSubmitting(true);
		setTimeout(() => {
			setSubmitting(false);
			setStep(2);
			toast.success("Two-factor enabled locally.");
		}, 700);
	};

	const downloadCodes = () => {
		const text = `TRINU Recovery Codes\nGenerated: ${new Date().toISOString()}\n\n${backupCodes.join("\n")}\n\nKeep these in a safe place. Each code can only be used once.\n`;
		const blob = new Blob([text], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "trinu-recovery-codes.txt";
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Recovery codes prepared for download.");
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
							Step {step + 1} / 3
						</p>
					</div>
					<h2 className="mt-4 font-display text-2xl font-bold text-ink">
						{step === 0 && "Scan the code"}
						{step === 1 && "Confirm the code"}
						{step === 2 && "Save your recovery codes"}
					</h2>
					<div className="mt-4 flex gap-1.5">
						{[0, 1, 2].map((i) => (
							<div
								key={i}
								className={cn(
									"h-1 flex-1 rounded-full transition-colors",
									i <= step ? "bg-orange" : "bg-line"
								)}
							/>
						))}
					</div>
				</div>

				{step === 0 && (
					<div className="p-6 sm:p-7">
						<p className="text-[13px] leading-6 text-ink-soft">
							Open your authenticator app and scan the code below. If you can't scan,
							enter the setup key manually.
						</p>

						<div className="mt-5 grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
							<div className="grid aspect-square place-items-center rounded-2xl bg-sand p-4 ring-1 ring-line">
								<div className="grid size-full place-items-center rounded-md border-2 border-ink p-3">
									<QrPlaceholder />
								</div>
							</div>
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
									Manual setup key
								</p>
								<p className="mt-2 break-all rounded-md bg-sand px-3 py-2 font-mono text-[13px] text-ink ring-1 ring-line">
									JBSW Y3DP EHPK 3PXP
								</p>
								<p className="mt-3 text-[11px] leading-5 text-ink-soft">
									The setup key is time-based. Any standard TOTP authenticator works
									(Google Authenticator, Authy, 1Password, Bitwarden).
								</p>
							</div>
						</div>

						<div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
							<Link to="/session-management" className="text-[12px] text-ink-soft hover:text-orange">
								Cancel setup
							</Link>
							<Button
								onClick={() => setStep(1)}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								I've scanned it <ArrowRight />
							</Button>
						</div>
					</div>
				)}

				{step === 1 && (
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
								onClick={() => setStep(0)}
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

				{step === 2 && (
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
								{backupCodes.map((c) => (
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
							<Button
								type="button"
								variant="outline"
								onClick={downloadCodes}
								className="border-line bg-paper text-ink hover:bg-sand"
							>
								Download codes
							</Button>
							<Link to="/session-management">
								<Button className="bg-orange text-white hover:bg-orange-deep">
									Finish <ArrowRight />
								</Button>
							</Link>
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

			<div className="relative mx-auto grid min-h-screen max-w-7xl gap-0 px-5 py-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:px-8 lg:py-14">
				<div className="hidden flex-col justify-between lg:flex">
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
						<span className="inline-flex items-center gap-2">
							<span className="size-1.5 rounded-full bg-orange" />
							Local simulation · no code is sent
						</span>
						<span>TRINŪ · Abuja Flagship Facility</span>
					</div>
				</div>

				<div className="flex items-center justify-center">
					<div className="w-full max-w-lg">
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

function QrPlaceholder() {
	// Simple visual placeholder for a QR-style grid — replaced with a real QR generator in production.
	const pattern = [
		"111111101011101111111",
		"100000101001001000001",
		"101110101101101011101",
		"101110100011001011101",
		"101110101110101011101",
		"100000101010001000001",
		"111111101010101111111",
		"000000001101000000000",
		"110110110110110110110",
		"001001001001001001001",
		"110110110110110110110",
		"000000001010000000000",
		"111111101101101111111",
		"100000101010101000001",
		"101110101110101011101",
		"101110100010101011101",
		"101110101110101011101",
		"100000101010101000001",
		"111111101101101111111",
	];
	return (
		<div className="grid size-full grid-cols-[repeat(21,1fr)] gap-px">
			{pattern.flatMap((row, ri) =>
				row.split("").map((cell, ci) => (
					<span
						key={`${ri}-${ci}`}
						className={cell === "1" ? "bg-ink" : "bg-transparent"}
					/>
				))
			)}
		</div>
	);
}