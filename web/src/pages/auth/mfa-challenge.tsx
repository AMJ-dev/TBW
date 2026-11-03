import {
	useState,
	useEffect,
	useContext,
	useRef,
	startTransition,
	type FormEvent,
	type ChangeEvent,
	type KeyboardEvent,
	type ClipboardEvent,
} from "react";
import { Link } from "@/components/router-link";
import { useNavigate } from "react-router-dom";
import {
	ArrowRight,
	Check,
	KeyRound,
	LifeBuoy,
	Loader2,
} from "lucide-react";
import { http, type Resp } from "@/lib/httpClient";
import userContext from "@/lib/userContext";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";
import { useLocationInfo } from "@/hooks/useLocationInfo";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Mode = "verify" | "recovery";

export default function MfaChallenge() {
	const navigate = useNavigate();
	const { login } = useContext(userContext);
	const deviceInfo = useDeviceInfo();
	const { locationInfo } = useLocationInfo();

	const [mode, setMode] = useState<Mode>("verify");
	const [mfaToken, setMfaToken] = useState("");
	const [email, setEmail] = useState("");
	const [remember, setRemember] = useState(false);
	const [code, setCode] = useState("");
	const [trustDevice, setTrustDevice] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [mounted, setMounted] = useState(false);

	const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

	const digits =
		mode === "verify"
			? code.replace(/\D/g, "").slice(0, 6)
			: code.replace(/[^A-Z0-9]/gi, "").slice(0, 12).toUpperCase();

	const complete = mode === "verify" ? digits.length === 6 : digits.length === 12;

	useEffect(() => {
		const token = sessionStorage.getItem("mfa_token");
		const storedEmail = sessionStorage.getItem("email");
		const storedRemember = sessionStorage.getItem("remember");

		if (!token || !storedEmail) {
			startTransition(() => navigate("/login", { replace: true }));
			return;
		}

		setMfaToken(token);
		setEmail(storedEmail);
		setRemember(storedRemember === "true");
		setMounted(true);
	}, [navigate]);

	useEffect(() => {
		if (!mounted || submitting || !complete || mode !== "verify") return;
		const t = setTimeout(() => {
			const fakeEvent = { preventDefault: () => {} } as FormEvent<HTMLFormElement>;
			void handleSubmit(fakeEvent);
		}, 150);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [complete, mode, mounted]);

	useEffect(() => {
		if (!mounted || mode !== "verify") return;
		const t = setTimeout(() => inputsRef.current[0]?.focus(), 50);
		return () => clearTimeout(t);
	}, [mounted, mode]);

	const formatDeviceInfo = () =>
		`${deviceInfo.browser} on ${deviceInfo.os} (${deviceInfo.deviceType})`;

	const formatLocationInfo = () =>
		locationInfo
			? `${locationInfo.city}, ${locationInfo.region}, ${locationInfo.country}`
			: "Unknown";

	const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value.replace(/\D/g, "");
		if (!raw) return;

		const next = digits.split("");
		if (raw.length > 1) {
			const spread = raw.slice(0, 6 - index).split("");
			spread.forEach((d, i) => {
				if (index + i < 6) next[index + i] = d;
			});
			const joined = next.join("").slice(0, 6);
			setCode(joined);
			const focusIdx = Math.min(index + spread.length, 5);
			inputsRef.current[focusIdx]?.focus();
			return;
		}

		const first = raw.charAt(0);
		if (first) next[index] = first;
		const joined = next.join("").slice(0, 6);
		setCode(joined);
		if (index < 5) inputsRef.current[index + 1]?.focus();
	};

	const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Backspace") {
			e.preventDefault();
			const next = digits.split("");
			if (next[index]) {
				next[index] = "";
				setCode(next.join(""));
			} else if (index > 0) {
				next[index - 1] = "";
				setCode(next.join(""));
				inputsRef.current[index - 1]?.focus();
			}
			return;
		}
		if (e.key === "ArrowLeft" && index > 0) {
			e.preventDefault();
			inputsRef.current[index - 1]?.focus();
		}
		if (e.key === "ArrowRight" && index < 5) {
			e.preventDefault();
			inputsRef.current[index + 1]?.focus();
		}
		if (e.key === "Delete") {
			e.preventDefault();
			const next = digits.split("");
			next[index] = "";
			setCode(next.join(""));
		}
	};

	const handlePaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		const pasted = e.clipboardData
			.getData("text")
			.replace(/\D/g, "")
			.slice(0, 6);
		if (!pasted) return;
		const next = digits.split("");
		pasted.split("").forEach((d, i) => {
			if (index + i < 6) next[index + i] = d;
		});
		const joined = next.join("").slice(0, 6);
		setCode(joined);
		const focusIdx = Math.min(index + pasted.length, 5);
		inputsRef.current[focusIdx]?.focus();
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!complete || submitting) return;
		setSubmitting(true);

		try {
			const payload =
				mode === "verify"
					? {
							mfa_token: mfaToken,
							code: digits,
							trust_device: trustDevice,
							device_info: formatDeviceInfo(),
							location_info: formatLocationInfo(),
						}
					: {
							mfa_token: mfaToken,
							recovery_code: digits,
							trust_device: trustDevice,
							device_info: formatDeviceInfo(),
							location_info: formatLocationInfo(),
						};

			const res = await http.post("auth/mfa/verify/", payload);
			const resp: Resp = res.data;

			if (resp.error) {
				toast.error(resp.data || "Invalid code. Try again.");
				setCode("");
				if (mode === "verify") inputsRef.current[0]?.focus();
				return;
			}

			sessionStorage.removeItem("mfa_token");
			sessionStorage.removeItem("email");
			sessionStorage.removeItem("remember");

			if (resp.code?.trust_token) {
				localStorage.setItem("trust_token", resp.code.trust_token);
			}

			toast.success(resp.data || "Verified.");
			login({
				remember,
				user: {
					id: resp.code.user.id,
					email: resp.code.user.email,
					full_name: resp.code.user.full_name,
					account_type: resp.code.user.account_type,
				},
				role: resp.code.role,
				route: resp.code.route,
				privileges: resp.code.privileges,
				permissions: resp.code.permissions,
			});
			startTransition(() => navigate(resp.code.route, { replace: true }));
		} catch (error: any) {
			toast.error(error?.response?.data?.message || "Verification failed. Try again.");
			setCode("");
			if (mode === "verify") inputsRef.current[0]?.focus();
		} finally {
			setSubmitting(false);
		}
	};

	if (!mounted) return null;

	return (
		<AuthShell
			kicker="Two-factor authentication"
			title="Verify it's really you."
			titleAccent=""
			subtitle="Enter the six-digit code from your authenticator app. The code refreshes every thirty seconds."
			leftBullets={[
				"Open Google Authenticator, Authy, 1Password, or any TOTP app",
				"Enter the current six-digit code for TRÏNŪ",
				"Trust this device for 30 days to skip prompts",
				"Lost your device? Use a recovery code to sign in",
			]}
		>
			<div className="overflow-hidden rounded-2xl bg-paper shadow-xl ring-1 ring-line">
				<div className="border-b border-line bg-sand p-6 sm:p-7">
					<div className="flex items-center gap-2">
						<div className="grid size-8 place-items-center rounded-md bg-orange text-white">
							<KeyRound className="size-4" />
						</div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
							{mode === "verify" ? "Authenticator code" : "Recovery code"}
						</p>
					</div>
					<h2 className="mt-4 font-display text-2xl font-bold text-ink">
						{mode === "verify" ? "Enter your 6-digit code" : "Enter a recovery code"}
					</h2>
					<p className="mt-1 text-[12px] text-ink-soft">
						Signing in as <span className="font-mono text-ink">{email}</span>
					</p>
				</div>

				<form onSubmit={handleSubmit} className="p-6 sm:p-7">
					{mode === "verify" ? (
						<div className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								One-time code
							</span>

							<div className="mt-3 grid grid-cols-6 gap-2">
								{Array.from({ length: 6 }).map((_, i) => (
									<input
										key={i}
										ref={(el) => {
											inputsRef.current[i] = el;
										}}
										type="text"
										inputMode="numeric"
										autoComplete={i === 0 ? "one-time-code" : "off"}
										pattern="[0-9]*"
										maxLength={1}
										value={digits[i] ?? ""}
										onChange={(e) => handleChange(i, e)}
										onKeyDown={(e) => handleKeyDown(i, e)}
										onPaste={(e) => handlePaste(i, e)}
										onFocus={(e) => e.target.select()}
										aria-label={`Digit ${i + 1}`}
										className={cn(
											"h-12 w-full rounded-md border border-line bg-sand text-center font-mono text-lg font-semibold text-ink outline-none transition-colors",
											"focus:border-orange focus:bg-paper focus:ring-2 focus:ring-orange/25",
											digits[i] &&
												"border-orange/50 bg-orange/10 text-orange"
										)}
									/>
								))}
							</div>

							<p className="mt-3 text-[11px] leading-5 text-ink-soft">
								The code refreshes every 30 seconds. If it expires, wait for the next one.
							</p>
						</div>
					) : (
						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Recovery code
							</span>
							<Input
								autoFocus
								autoComplete="off"
								placeholder="XXXX-XXXX-XXXX"
								value={code}
								onChange={(e) => setCode(e.target.value.toUpperCase())}
								className="mt-2 h-12 border-line bg-sand text-center font-mono text-lg tracking-[0.2em] text-ink"
							/>
							<p className="mt-2 text-[11px] leading-5 text-ink-soft">
								Recovery codes are single-use. Each code works only once.
							</p>
						</label>
					)}

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
								You'll still need to sign in with your password each time.
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
						{submitting ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								Verifying…
							</>
						) : (
							<>
								Verify and sign in <ArrowRight />
							</>
						)}
					</Button>

					<div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[12px]">
						<button
							type="button"
							onClick={() => {
								setMode((m) => (m === "verify" ? "recovery" : "verify"));
								setCode("");
							}}
							className="font-semibold text-orange"
						>
							{mode === "verify" ? "Use a recovery code" : "Use authenticator code"}
						</button>
						<Link to="/login" className="text-ink-soft hover:text-orange">
							Use a different account
						</Link>
					</div>

					<div className="mt-6 flex items-start gap-2 rounded-xl bg-sand p-4 ring-1 ring-line">
						<LifeBuoy className="mt-0.5 size-4 shrink-0 text-orange" />
						<p className="text-[12px] leading-5 text-ink-soft">
							Lost access to your authenticator and recovery codes?{" "}
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