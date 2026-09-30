import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
	ArrowLeft,
	ArrowRight,
	Check,
	Eye,
	EyeOff,
	Lock,
	ShieldAlert,
	ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TokenState = "verifying" | "valid" | "invalid";

export default function ResetPasswordPage() {
	const [params] = useSearchParams();
	const token = params.get("token") ?? "";

	const [tokenState, setTokenState] = useState<TokenState>("verifying");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [done, setDone] = useState(false);

	useEffect(() => {
		// In production this would call the backend to validate the token.
		// For the prototype we simulate: valid if the token looks plausible.
		const t = setTimeout(() => {
			if (token && token.length >= 8) {
				setTokenState("valid");
				setEmail("ops@company.ng");
			} else {
				setTokenState("invalid");
			}
		}, 500);
		return () => clearTimeout(t);
	}, [token]);

	const strength = useMemo(() => {
		let score = 0;
		if (password.length >= 8) score += 1;
		if (password.length >= 12) score += 1;
		if (/[A-Z]/.test(password)) score += 1;
		if (/[a-z]/.test(password)) score += 1;
		if (/\d/.test(password)) score += 1;
		if (/[^A-Za-z0-9]/.test(password)) score += 1;
		return Math.min(score, 5);
	}, [password]);

	const strengthLabel = ["Very weak", "Weak", "Fair", "Good", "Strong", "Very strong"][
		strength
	];
	const strengthTone =
		strength <= 1
			? "bg-carmine"
			: strength <= 2
			? "bg-orange/60"
			: strength <= 4
			? "bg-orange"
			: "bg-orange";

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (password.length < 8) {
			toast.error("Password must be at least 8 characters.");
			return;
		}
		if (password !== confirm) {
			toast.error("Passwords do not match.");
			return;
		}
		setSubmitting(true);
		setTimeout(() => {
			setSubmitting(false);
			setDone(true);
			toast.success("Password reset simulated locally — no credentials are sent.");
		}, 700);
	};

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
							Account recovery
						</p>
						<h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-[1.05] text-ink xl:text-5xl">
							Set a new{" "}
							<span className="text-orange">password.</span>
						</h1>
						<p className="mt-6 text-base leading-7 text-ink-soft">
							Choose a strong password that you don't use anywhere else. Once you set it,
							your other signed-in devices may be prompted to sign in again.
						</p>

						<ul className="mt-9 space-y-3">
							{[
								"At least 8 characters, ideally 12 or more",
								"Mix upper and lower case letters, numbers, and a symbol",
								"Avoid reused passwords from other services",
								"We screen new passwords against known breached lists",
							].map((item) => (
								<li key={item} className="flex items-start gap-3 text-sm text-ink">
									<span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-orange text-white">
										<Check className="size-3" />
									</span>
									{item}
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="flex items-center justify-center">
					<div className="w-full max-w-md">
						<div className="mb-8 flex items-center justify-between lg:hidden">
							<Link to="/" aria-label="TRINU home" className="inline-flex">
								<img src="/logo.png" alt="TRINU Bonded Terminal" className="h-12 w-12" />
							</Link>
							<Link to="/login" className="text-[12px] font-semibold text-orange">
								Back to sign-in
							</Link>
						</div>

						<div className="overflow-hidden rounded-2xl bg-paper shadow-xl ring-1 ring-line">
							<div className="border-b border-line bg-sand p-6 sm:p-7">
								<div className="flex items-center gap-2">
									<div className="grid size-8 place-items-center rounded-md bg-orange text-white">
										<Lock className="size-4" />
									</div>
									<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
										Password reset
									</p>
								</div>
								<h2 className="mt-4 font-display text-2xl font-bold text-ink">
									{done
										? "Password updated"
										: tokenState === "verifying"
										? "Verifying your link"
										: tokenState === "invalid"
										? "Link not valid"
										: "Choose a new password"}
								</h2>
								<p className="mt-1 text-[12px] text-ink-soft">
									{done
										? "Your password has been set. You can sign in with your new credentials."
										: tokenState === "verifying"
										? "One moment while we check your reset link."
										: tokenState === "invalid"
										? "This reset link has expired or is not recognised."
										: "Your new password replaces the old one immediately."}
								</p>
							</div>

							{done && (
								<div className="p-6 sm:p-7">
									<div className="flex items-start gap-3 rounded-xl bg-orange/10 p-4 ring-1 ring-orange/25">
										<div className="grid size-10 shrink-0 place-items-center rounded-full bg-orange text-white">
											<Check className="size-5" />
										</div>
										<div>
											<p className="text-sm font-semibold text-ink">
												Password changed
											</p>
											<p className="mt-1 text-[12px] leading-5 text-ink-soft">
												Sign in with your new password on{" "}
												<span className="font-mono text-ink">
													{email || "your account"}
												</span>
												. If you didn't make this change, contact your TRINŪ
												administrator immediately.
											</p>
										</div>
									</div>

									<div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
										<Link to="/login" className="flex-1">
											<Button className="w-full bg-orange text-white hover:bg-orange-deep">
												Sign in <ArrowRight />
											</Button>
										</Link>
									</div>
								</div>
							)}

							{!done && tokenState === "verifying" && (
								<div className="p-6 sm:p-7">
									<div className="flex items-center gap-3 text-[13px] text-ink-soft">
										<span className="size-3 animate-spin rounded-full border-2 border-line border-t-orange" />
										Checking your reset link…
									</div>
								</div>
							)}

							{!done && tokenState === "invalid" && (
								<div className="p-6 sm:p-7">
									<div className="flex items-start gap-3 rounded-xl bg-carmine/5 p-4 ring-1 ring-carmine/25">
										<div className="grid size-10 shrink-0 place-items-center rounded-full bg-carmine text-white">
											<ShieldAlert className="size-5" />
										</div>
										<div>
											<p className="text-sm font-semibold text-ink">
												This link can't be used
											</p>
											<p className="mt-1 text-[12px] leading-5 text-ink-soft">
												Reset links expire after 30 minutes and can only be used
												once. Request a new one and try again.
											</p>
										</div>
									</div>

									<div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
										<Link to="/forgot-password" className="flex-1">
											<Button className="w-full bg-orange text-white hover:bg-orange-deep">
												Request a new link <ArrowRight />
											</Button>
										</Link>
										<Link to="/login">
											<Button
												variant="outline"
												className="border-line bg-paper text-ink hover:bg-sand"
											>
												Back to sign-in
											</Button>
										</Link>
									</div>
								</div>
							)}

							{!done && tokenState === "valid" && (
								<form onSubmit={handleSubmit} className="p-6 sm:p-7">
									<p className="text-[13px] leading-6 text-ink-soft">
										Resetting password for{" "}
										<span className="font-mono text-ink">{email}</span>
									</p>

									<label className="mt-5 block">
										<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											New password
										</span>
										<div className="relative mt-2">
											<Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
											<Input
												required
												autoFocus
												type={showPassword ? "text" : "password"}
												autoComplete="new-password"
												placeholder="At least 8 characters"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												className="h-11 border-line bg-sand pl-9 pr-10 text-ink"
											/>
											<button
												type="button"
												onClick={() => setShowPassword((v) => !v)}
												aria-label={showPassword ? "Hide password" : "Show password"}
												className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink-soft transition-colors hover:bg-sand-2 hover:text-orange"
											>
												{showPassword ? (
													<EyeOff className="size-4" />
												) : (
													<Eye className="size-4" />
												)}
											</button>
										</div>
									</label>

									{password.length > 0 && (
										<div className="mt-3">
											<div className="flex items-center gap-2">
												<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
													<div
														className={`h-full rounded-full transition-all ${strengthTone}`}
														style={{ width: `${(strength / 5) * 100}%` }}
													/>
												</div>
												<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
													{strengthLabel}
												</span>
											</div>
											<ul className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] text-ink-soft">
												<Rule ok={password.length >= 8}>At least 8 characters</Rule>
												<Rule ok={/[A-Z]/.test(password)}>Upper case letter</Rule>
												<Rule ok={/[a-z]/.test(password)}>Lower case letter</Rule>
												<Rule ok={/\d/.test(password)}>A number</Rule>
												<Rule ok={/[^A-Za-z0-9]/.test(password)}>
													A symbol
												</Rule>
											</ul>
										</div>
									)}

									<label className="mt-5 block">
										<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Confirm new password
										</span>
										<div className="relative mt-2">
											<Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
											<Input
												required
												type={showPassword ? "text" : "password"}
												autoComplete="new-password"
												placeholder="Re-enter your new password"
												value={confirm}
												onChange={(e) => setConfirm(e.target.value)}
												className="h-11 border-line bg-sand pl-9 text-ink"
											/>
										</div>
									</label>

									<div className="mt-5 flex items-start gap-2 rounded-xl bg-sand p-4 ring-1 ring-line">
										<ShieldCheck className="mt-0.5 size-4 shrink-0 text-orange" />
										<p className="text-[12px] leading-5 text-ink-soft">
											New passwords are screened against known breach lists.
											Choosing a strong, unique password is the best protection
											for your account.
										</p>
									</div>

									<Button
										type="submit"
										disabled={submitting}
										className={
											"mt-5 h-11 w-full bg-orange text-white hover:bg-orange-deep" +
											(submitting ? " opacity-70" : "")
										}
									>
										{submitting ? "Updating password…" : "Set new password"}
										{!submitting && <ArrowRight />}
									</Button>
								</form>
							)}
						</div>

						<div className="mt-6 text-center">
							<Link
								to="/login"
								className="inline-flex items-center gap-2 text-[12px] font-semibold text-orange"
							>
								<ArrowLeft className="size-3.5" />
								Back to sign-in
							</Link>
						</div>

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
					</div>
				</div>
			</div>
		</div>
	);
}

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
	return (
		<li className="flex items-center gap-2">
			<span
				className={
					"grid size-3.5 shrink-0 place-items-center rounded-full " +
					(ok ? "bg-orange text-white" : "bg-sand-2 text-ink-soft")
				}
			>
				{ok && <Check className="size-2.5" />}
			</span>
			{children}
		</li>
	);
}