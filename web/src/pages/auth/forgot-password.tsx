import { useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	ArrowLeft,
	ArrowRight,
	Check,
	Mail,
	ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			toast.error("Enter the email address registered with your account.");
			return;
		}
		setSubmitting(true);
		setTimeout(() => {
			setSubmitting(false);
			setSubmitted(true);
			toast.success("Reset link sent locally — no email actually sent.");
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
				{/* LEFT — Brand + info (desktop only) */}
				<div className="hidden flex-col justify-between lg:flex">
					<Link to="/" aria-label="TRINU home" className="inline-flex">
						<img src="/logo.png" alt="TRINU Bonded Terminal" className="h-14 w-14" />
					</Link>

					<div className="max-w-lg">
						<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange">
							Account recovery
						</p>
						<h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-[1.05] text-ink xl:text-5xl">
							Reset your{" "}
							<span className="text-orange">TRINŪ password.</span>
						</h1>
						<p className="mt-6 text-base leading-7 text-ink-soft">
							If your account is registered with a valid email address, we'll send a
							secure reset link. The link expires after a short window to protect your
							account.
						</p>

						<ul className="mt-9 space-y-3">
							{[
								"Reset link expires in 30 minutes",
								"Your existing sessions stay signed in until reset",
								"Recovery events are logged to your account",
								"Contact your administrator if you don't receive the email",
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

					<div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
						<span className="inline-flex items-center gap-2">
							<span className="size-1.5 rounded-full bg-orange" />
							Demo only · no email is sent
						</span>
						<span>TRINŪ · Abuja Flagship Facility</span>
					</div>
				</div>

				{/* RIGHT — Form */}
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
										<Mail className="size-4" />
									</div>
									<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
										Password reset
									</p>
								</div>
								<h2 className="mt-4 font-display text-2xl font-bold text-ink">
									{submitted ? "Check your inbox" : "Forgot your password?"}
								</h2>
								<p className="mt-1 text-[12px] text-ink-soft">
									{submitted
										? "If an account exists for that email, we've sent a reset link."
										: "Enter the email address associated with your account."}
								</p>
							</div>

							{submitted ? (
								<div className="p-6 sm:p-7">
									<div className="flex items-start gap-3 rounded-xl bg-orange/10 p-4 ring-1 ring-orange/25">
										<div className="grid size-10 shrink-0 place-items-center rounded-full bg-orange text-white">
											<Check className="size-5" />
										</div>
										<div>
											<p className="text-sm font-semibold text-ink">
												Reset link sent
											</p>
											<p className="mt-1 text-[12px] leading-5 text-ink-soft">
												We sent a reset link to{" "}
												<span className="font-mono text-ink">{email}</span>.
												Follow the instructions in that email to set a new
												password.
											</p>
										</div>
									</div>

									<div className="mt-5 rounded-xl bg-sand p-4 ring-1 ring-line">
										<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
											Didn't receive it?
										</p>
										<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
											<li className="flex items-start gap-2">
												<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
												Check your spam or promotions folder.
											</li>
											<li className="flex items-start gap-2">
												<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
												Confirm the email address is correct — you can go back and
												try again.
											</li>
											<li className="flex items-start gap-2">
												<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
												If you still don't see it, contact your TRINŪ
												administrator.
											</li>
										</ul>
									</div>

									<div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
										<Button
											variant="outline"
											className="border-line bg-paper text-ink hover:bg-sand"
											onClick={() => {
												setSubmitted(false);
												setEmail("");
											}}
										>
											Use a different email
										</Button>
										<Link to="/login">
											<Button className="bg-orange text-white hover:bg-orange-deep">
												Back to sign-in <ArrowRight />
											</Button>
										</Link>
									</div>
								</div>
							) : (
								<form onSubmit={handleSubmit} className="p-6 sm:p-7">
									<label className="block">
										<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Email address
										</span>
										<div className="relative mt-2">
											<Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
											<Input
												required
												autoFocus
												type="email"
												autoComplete="email"
												placeholder="name@company.ng"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												className="h-11 border-line bg-sand pl-9 text-ink"
											/>
										</div>
									</label>

									<Button
										type="submit"
										disabled={submitting}
										className={
											"mt-5 h-11 w-full bg-orange text-white hover:bg-orange-deep" +
											(submitting ? " opacity-70" : "")
										}
									>
										{submitting ? "Sending reset link…" : "Send reset link"}
										{!submitting && <ArrowRight />}
									</Button>

									<div className="mt-5 flex items-start gap-2 rounded-xl bg-sand p-4 ring-1 ring-line">
										<ShieldCheck className="mt-0.5 size-4 shrink-0 text-orange" />
										<p className="text-[12px] leading-5 text-ink-soft">
											For security, we always respond the same way — whether or not
											an account exists for the email you entered. This prevents
											unauthorised enumeration.
										</p>
									</div>
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