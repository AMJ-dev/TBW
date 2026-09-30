import { useState, useEffect, useContext, startTransition, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import { useNavigate } from "react-router-dom";
import {
	ArrowRight,
	Check,
	KeyRound,
	ShieldCheck,
} from "lucide-react";
import { http, type Resp } from '@/lib/httpClient'
import userContext from '@/lib/userContext'
import { useDeviceInfo } from '@/hooks/useDeviceInfo'
import { useLocationInfo } from '@/hooks/useLocationInfo'
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function OtpPage() {
	const navigate = useNavigate()
	const { login } = useContext(userContext)
	const deviceInfo = useDeviceInfo()
	const { locationInfo, loading: locationLoading } = useLocationInfo()
	const [expiresIn, setExpiresIn] = useState<number>(300)
	const [remember, setRemember] = useState<boolean>(false)
	const [code, setCode] = useState("");
	const [trustDevice, setTrustDevice] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [mounted, setMounted] = useState(false)
	const [email, setEmail] = useState<string>('')
	const [countdown, setCountdown] = useState<number>(120)
	const [canResend, setCanResend] = useState<boolean>(false)
	const [sending, setSending] = useState<boolean>(false)
	const digits = code.replace(/\D/g, "").slice(0, 6);
	const complete = digits.length === 6;

	useEffect(() => {
		const ExpiresIn = sessionStorage.getItem('expires_in')
		const Email = sessionStorage.getItem('email')
		const Remember = sessionStorage.getItem('remember')
		if (!ExpiresIn || !Email) {
			startTransition(() => navigate('/login', { replace: true }))
			return
		}
		setExpiresIn(Number(ExpiresIn))
		setEmail(Email)
		setRemember(Remember === 'true')
		setMounted(true)
	}, [navigate])

	useEffect(() => {
		if (!mounted) return
		if (countdown > 0 && !canResend) {
			const t = setTimeout(() => setCountdown(prev => prev - 1), 1000)
			return () => clearTimeout(t)
		} else if (countdown === 0 && !canResend) setCanResend(true)
	}, [countdown, canResend, mounted])

	const formatDeviceInfo = () => `${deviceInfo.browser} on ${deviceInfo.os} (${deviceInfo.deviceType})`
	const formatLocationInfo = () => (locationInfo ? `${locationInfo.city}, ${locationInfo.region}, ${locationInfo.country}` : 'Location information not available')

	const handleResend = async () => {
		if (!canResend || sending || !email) return
		setSending(true)
		try {
			const res = await http.post('login-resend-otp/', { email })
			const resp: Resp = res.data
			if (resp.error) {
				toast.error(resp.data || 'Could not resend code. Please try again.')
			} else {
				toast.success(resp.data || 'A new code has been sent.')
				setCode('')
				setCountdown(120)
				setCanResend(false)
			}
		} catch (error: any) {
			console.error(error)
			toast.error(error?.response?.data?.message || 'Could not resend code. Please try again.')
		} finally {
			setSending(false)
		}
	}

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!complete) {
			toast.error("Enter all six digits to continue.");
			return;
		}
		setSubmitting(true);

		const formData = { email, otp: digits, deviceInfo: formatDeviceInfo(), locationInfo: formatLocationInfo() }
		try {
			const res = await http.post('login-verify-otp/', formData)
			const resp: Resp = res.data
			if (resp.error) toast.error(resp.data || 'Invalid OTP. Please try again.')
			else {
				sessionStorage.removeItem('jwt')
				sessionStorage.removeItem('email')
				toast.success(resp.data)
				login({
					remember,
					user: {
						id: resp.code.user.id,
						email: resp.code.user.email,
						full_name: resp.code.user.full_name,
						account_type: resp.code.user.account_type
					},
					role: resp.code.role,
					route: resp.code.route,
					privileges: resp.code.privileges,
					permissions: resp.code.permissions
				});
				startTransition(() => navigate(resp.code.route, { replace: true }))
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
						{canResend ? (
							<button
								type="button"
								className={cn(
									"font-semibold text-orange",
									sending && "cursor-not-allowed opacity-60"
								)}
								disabled={sending}
								onClick={handleResend}
							>
								{sending ? "Sending…" : "Resend code"}
							</button>
						) : (
							<span className="font-mono text-[11px] text-ink-soft">
								Resend in{" "}
								<span className="text-orange">
									{String(Math.floor(countdown / 60)).padStart(2, "0")}:
									{String(countdown % 60).padStart(2, "0")}
								</span>
							</span>
						)}
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