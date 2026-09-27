import { useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	ArrowRight,
	Building2,
	Check,
	Eye,
	EyeOff,
	Lock,
	Mail,
	Phone,
	ShieldCheck,
	User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AccountType = "importer" | "agent" | "transporter";

const accountTypes: { key: AccountType; label: string; detail: string }[] = [
	{
		key: "importer",
		label: "Importer / consignee",
		detail: "Direct access for your organisation's cargo.",
	},
	{
		key: "agent",
		label: "Licensed agent",
		detail: "Multi-client access with delegated authority.",
	},
	{
		key: "transporter",
		label: "Transporter / haulage",
		detail: "Truck slots, gate passes, and coordination.",
	},
];

const steps = ["Your details", "Organisation", "Verify"];

export function RegisterPage() {
	const [step, setStep] = useState(0);
	const [accountType, setAccountType] = useState<AccountType>("importer");

	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const [organisation, setOrganisation] = useState("");
	const [rcNumber, setRcNumber] = useState("");
	const [tin, setTin] = useState("");
	const [role, setRole] = useState("");
	const [agreed, setAgreed] = useState(false);

	const [verificationCode, setVerificationCode] = useState("");
	const [submitted, setSubmitted] = useState(false);

	const next = () => {
		if (step === 0) {
			if (!fullName.trim() || !email.trim() || !phone.trim()) {
				toast.error("Enter your name, email, and phone to continue.");
				return;
			}
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
				toast.error("Enter a valid email address.");
				return;
			}
			if (password.length < 8) {
				toast.error("Password must be at least 8 characters.");
				return;
			}
			if (password !== confirmPassword) {
				toast.error("Passwords do not match.");
				return;
			}
		}
		if (step === 1) {
			if (!organisation.trim()) {
				toast.error("Enter your organisation name to continue.");
				return;
			}
			if (!agreed) {
				toast.error("Accept the privacy notice and terms to continue.");
				return;
			}
		}
		setStep((s) => s + 1);
	};

	const handleVerify = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!verificationCode.trim()) {
			toast.error("Enter the verification code we sent you.");
			return;
		}
		setSubmitted(true);
		toast.success("Verification simulated locally — no account is created yet.");
	};

	if (submitted) {
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

				<main className="relative mx-auto grid min-h-screen max-w-3xl place-items-center px-5 py-16 text-center">
					<div>
						<div className="mx-auto grid size-16 place-items-center rounded-full bg-orange text-white">
							<Check className="size-8" />
						</div>
						<p className="mt-7 font-mono text-[10px] uppercase tracking-[0.2em] text-orange">
							Local preview complete
						</p>
						<h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
							Registration preview complete.
						</h1>
						<p className="mx-auto mt-4 max-w-md leading-7 text-ink-soft">
							Your details were validated in this browser only. No account was created and no
							information was sent to TRÏNŪ.
						</p>

						<div className="mt-7 rounded-xl bg-sand p-5 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
								Reference
							</p>
							<p className="mt-2 font-mono text-lg font-bold text-ink">
								TRN-REG-2026-00417
							</p>
						</div>

						<div className="mt-8 flex flex-wrap justify-center gap-3">
							<Link to="/">
								<Button
									variant="outline"
									className="border-line bg-paper text-ink hover:bg-sand"
								>
									Return home
								</Button>
							</Link>
							<Link to="/login">
								<Button className="bg-orange text-white hover:bg-orange-deep">
									Go to sign-in <ArrowRight />
								</Button>
							</Link>
						</div>
					</div>
				</main>
			</div>
		);
	}

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
							Request access
						</p>
						<h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-[1.05] text-ink xl:text-5xl">
							Create your{" "}
							<span className="text-orange">TRINŪ account.</span>
						</h1>
						<p className="mt-6 text-base leading-7 text-ink-soft">
							Registration is reviewed before access is granted. This keeps the operating
							record dependable for everyone on the platform.
						</p>

						<ol className="mt-9 space-y-5">
							{[
								["Submit your details", "Tell us who you are and what your organisation does."],
								[
									"Organisation review",
									"We verify RC, TIN, and licence references where applicable.",
								],
								[
									"Access granted",
									"Once approved, you receive credentials and delegation options.",
								],
							].map(([title, detail], i) => (
								<li key={title} className="flex gap-4">
									<span className="grid size-7 shrink-0 place-items-center rounded-full bg-orange font-mono text-[10px] font-semibold text-white">
										0{i + 1}
									</span>
									<div>
										<p className="text-sm font-semibold text-ink">{title}</p>
										<p className="mt-1 text-[12px] leading-5 text-ink-soft">{detail}</p>
									</div>
								</li>
							))}
						</ol>
					</div>

					<div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
						<span className="inline-flex items-center gap-2">
							<span className="size-1.5 rounded-full bg-orange" />
							Demo flow · no account created
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
								Already have an account?
							</Link>
						</div>

						<div className="overflow-hidden rounded-2xl bg-paper shadow-xl ring-1 ring-line">
							<div className="border-b border-line bg-sand p-6 sm:p-7">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="grid size-8 place-items-center rounded-md bg-orange text-white">
											<ShieldCheck className="size-4" />
										</div>
										<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
											Account registration
										</p>
									</div>
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
										Step {step + 1} / {steps.length}
									</p>
								</div>
								<h2 className="mt-4 font-display text-2xl font-bold text-ink">
									{steps[step]}
								</h2>
								<div className="mt-4 flex gap-1.5">
									{steps.map((_, i) => (
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

							{step < 2 && (
								<form
									onSubmit={(e) => {
										e.preventDefault();
										next();
									}}
									className="p-6 sm:p-7"
								>
									{step === 0 && (
										<div className="space-y-4">
											<div>
												<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
													Account type
												</p>
												<div className="mt-2 grid gap-2">
													{accountTypes.map((t) => (
														<label
															key={t.key}
															className={cn(
																"flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
																accountType === t.key
																	? "border-orange bg-orange/10"
																	: "border-line bg-sand hover:bg-sand-2"
															)}
														>
															<input
																type="radio"
																name="account-type"
																value={t.key}
																checked={accountType === t.key}
																onChange={() => setAccountType(t.key)}
																className="mt-1 size-3.5 accent-orange"
															/>
															<div className="min-w-0 flex-1">
																<p className="text-sm font-semibold text-ink">
																	{t.label}
																</p>
																<p className="mt-0.5 text-[11px] text-ink-soft">
																	{t.detail}
																</p>
															</div>
														</label>
													))}
												</div>
											</div>

											<label className="block">
												<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
													Full name
												</span>
												<div className="relative mt-2">
													<User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
													<Input
														required
														placeholder="Your full name"
														value={fullName}
														onChange={(e) => setFullName(e.target.value)}
														className="h-11 border-line bg-sand pl-9 text-ink"
													/>
												</div>
											</label>

											<div className="grid gap-4 sm:grid-cols-2">
												<label className="block">
													<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														Work email
													</span>
													<div className="relative mt-2">
														<Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
														<Input
															required
															type="email"
															autoComplete="email"
															placeholder="name@company.ng"
															value={email}
															onChange={(e) => setEmail(e.target.value)}
															className="h-11 border-line bg-sand pl-9 text-ink"
														/>
													</div>
												</label>

												<label className="block">
													<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														Phone
													</span>
													<div className="relative mt-2">
														<Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
														<Input
															required
															placeholder="+234 803 000 0000"
															value={phone}
															onChange={(e) => setPhone(e.target.value)}
															className="h-11 border-line bg-sand pl-9 text-ink"
														/>
													</div>
												</label>
											</div>

											<label className="block">
												<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
													Password
												</span>
												<div className="relative mt-2">
													<Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
													<Input
														required
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

											<label className="block">
												<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
													Confirm password
												</span>
												<div className="relative mt-2">
													<Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
													<Input
														required
														type={showPassword ? "text" : "password"}
														autoComplete="new-password"
														placeholder="Re-enter your password"
														value={confirmPassword}
														onChange={(e) => setConfirmPassword(e.target.value)}
														className="h-11 border-line bg-sand pl-9 text-ink"
													/>
												</div>
											</label>
										</div>
									)}

									{step === 1 && (
										<div className="space-y-4">
											<label className="block">
												<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
													Organisation name
												</span>
												<div className="relative mt-2">
													<Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
													<Input
														required
														placeholder="e.g. Atlantic Trade Nigeria Ltd"
														value={organisation}
														onChange={(e) => setOrganisation(e.target.value)}
														className="h-11 border-line bg-sand pl-9 text-ink"
													/>
												</div>
											</label>

											<div className="grid gap-4 sm:grid-cols-2">
												<label className="block">
													<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														RC number
													</span>
													<Input
														placeholder="e.g. RC-1284921"
														value={rcNumber}
														onChange={(e) => setRcNumber(e.target.value)}
														className="mt-2 h-11 border-line bg-sand font-mono text-ink"
													/>
												</label>

												<label className="block">
													<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														TIN
													</span>
													<Input
														placeholder="e.g. 20483012-0001"
														value={tin}
														onChange={(e) => setTin(e.target.value)}
														className="mt-2 h-11 border-line bg-sand font-mono text-ink"
													/>
												</label>
											</div>

											<label className="block">
												<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
													Your role in the organisation
												</span>
												<Input
													placeholder="e.g. Operations Manager"
													value={role}
													onChange={(e) => setRole(e.target.value)}
													className="mt-2 h-11 border-line bg-sand text-ink"
												/>
											</label>

											<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
												<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
													What happens next
												</p>
												<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
													<li className="flex items-start gap-2">
														<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
														We verify your organisation details and licence references
														where applicable.
													</li>
													<li className="flex items-start gap-2">
														<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
														Once approved, you receive credentials and delegation
														options.
													</li>
												</ul>
											</div>

											<label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
												<input
													type="checkbox"
													checked={agreed}
													onChange={(e) => setAgreed(e.target.checked)}
													className="mt-0.5 size-4 shrink-0 rounded border-line accent-orange"
												/>
												<span className="text-[12px] leading-5 text-ink">
													I accept the{" "}
													<Link to="/terms" className="font-semibold text-orange">
														terms of use
													</Link>{" "}
													and{" "}
													<Link to="/privacy" className="font-semibold text-orange">
														privacy notice
													</Link>
													.
												</span>
											</label>
										</div>
									)}

									<div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
										<Button
											type="button"
											variant="ghost"
											onClick={() => setStep((s) => Math.max(0, s - 1))}
											disabled={step === 0}
											className="text-ink-soft"
										>
											Back
										</Button>
										<Button
											type="submit"
											className="bg-orange text-white hover:bg-orange-deep"
										>
											Continue <ArrowRight />
										</Button>
									</div>
								</form>
							)}

							{step === 2 && (
								<form onSubmit={handleVerify} className="p-6 sm:p-7">
									<p className="text-[13px] leading-6 text-ink-soft">
										We sent a 6-digit verification code to{" "}
										<span className="font-mono text-ink">{email || "your email"}</span>.
										Enter it below to complete registration.
									</p>

									<label className="mt-5 block">
										<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Verification code
										</span>
										<Input
											required
											inputMode="numeric"
											autoComplete="one-time-code"
											placeholder="000000"
											maxLength={6}
											value={verificationCode}
											onChange={(e) => setVerificationCode(e.target.value)}
											className="mt-2 h-12 border-line bg-sand text-center font-mono text-lg tracking-[0.4em] text-ink"
										/>
									</label>

									<div className="mt-5 rounded-xl bg-sand p-4 ring-1 ring-line">
										<p className="text-[12px] leading-5 text-ink-soft">
											Didn't receive a code? Check that your email address is correct,
											or{" "}
											<button
												type="button"
												className="font-semibold text-orange"
												onClick={() => toast.success("Verification resend simulated locally.")}
											>
												resend the code
											</button>
											.
										</p>
									</div>

									<div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
										<Button
											type="button"
											variant="ghost"
											onClick={() => setStep(1)}
											className="text-ink-soft"
										>
											Back
										</Button>
										<Button
											type="submit"
											className="bg-orange text-white hover:bg-orange-deep"
										>
											Complete registration <ArrowRight />
										</Button>
									</div>
								</form>
							)}
						</div>

						<p className="mt-6 text-center text-[12px] text-ink-soft">
							Already have an account?{" "}
							<Link to="/login" className="font-semibold text-orange">
								Sign in
							</Link>
						</p>

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