import { useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import { useNavigate } from "react-router-dom";
import {
	ArrowRight,
	Check,
	Eye,
	EyeOff,
	Lock,
	Mail,
	ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

export default function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!email || !password) {
			toast.error("Enter your email and password to continue.");
			return;
		}
		setSubmitting(true);
		try {
			let res = await http.post("sign-in/",{ email, password});
			const resp:Resp = res.data;
			if (resp?.error){
				toast.error(resp?.data || "Login failed. Check the credentials and try again.")
				return
			}
			toast.success(resp.data);
			sessionStorage.setItem('remember', 'true')
			sessionStorage.setItem('expires_in', String(resp.code?.expires_in ?? 300))
			sessionStorage.setItem('email', String(email.trim()))
			const isMfaEnabled = String(resp.code?.mfa_enabled) === "1" || resp.code?.mfa_enabled === true;
			if(isMfaEnabled) sessionStorage.setItem('mfa_token', String(resp.code?.mfa_token));
			navigate(isMfaEnabled ? "/mfa" : "/otp");
		} catch (error) {
			toast.error("Could not complete login. Try again later.")
		}finally{
			setSubmitting(false);
		}
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

			<div className="relative mx-auto grid min-h-screen max-w-7xl gap-0 px-5 py-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-16 lg:px-8 lg:py-14">
				{/* LEFT — Brand + info (desktop only) */}
				<div className="hidden flex-col justify-between lg:flex">
					<Link to="/" aria-label="TRINU home" className="inline-flex">
						<img src="/logo.png" alt="TRINU Bonded Terminal" className="h-14 w-14" />
					</Link>

					<div className="max-w-lg">
						<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange">
							Stakeholder portal
						</p>
						<h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-[1.05] text-ink xl:text-5xl">
							Sign in to your{" "}
							<span className="text-orange">TRINŪ workspace.</span>
						</h1>
						<p className="mt-6 text-base leading-7 text-ink-soft">
							Access cargo, documents, financial obligations, and truck coordination for
							your organisation. Delegated agent access is scoped and revocable.
						</p>

						<ul className="mt-9 space-y-3">
							{[
								"Multi-client access for licensed agents",
								"Delegation scoped per consignment or container",
								"Read-only regulator access on request",
								"Session and device controls for staff accounts",
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
							No credentials sent
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
							<Link
								to="/tracking"
								className="text-[12px] font-semibold text-orange"
							>
								Track cargo
							</Link>
						</div>

						<div className="overflow-hidden rounded-2xl bg-paper shadow-xl ring-1 ring-line">
							<div className="border-b border-line bg-sand p-6 sm:p-7">
								<div className="flex items-center gap-2">
									<div className="grid size-8 place-items-center rounded-md bg-orange text-white">
										<Lock className="size-4" />
									</div>
									<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
										Sign in
									</p>
								</div>
								<h2 className="mt-4 font-display text-2xl font-bold text-ink">
									Welcome back
								</h2>
								<p className="mt-1 text-[12px] text-ink-soft">
									Enter any valid email and password to preview the portal.
								</p>
							</div>

							<form onSubmit={handleSubmit} className="p-6 sm:p-7">
								<div className="space-y-4">
									<label className="block">
										<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Email address
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
											Password
										</span>
										<div className="relative mt-2">
											<Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
											<Input
												required
												type={showPassword ? "text" : "password"}
												autoComplete="current-password"
												placeholder="••••••••"
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
								</div>

								<div className="mt-5 flex items-center justify-end">
									<Link
										to="/forgot-password"
										className="text-[12px] font-semibold text-orange"
									>
										Forgot password?
									</Link>
								</div>

								<Button
									type="submit"
									disabled={submitting}
									className={cn(
										"mt-6 h-11 w-full bg-orange text-white hover:bg-orange-deep",
										submitting && "opacity-70"
									)}
								>
									{submitting ? "Signing in…" : "Sign in"}
									{!submitting && <ArrowRight />}
								</Button>

								<p className="mt-6 text-center text-[12px] text-ink-soft">
									New to TRINŪ?{" "}
									<Link to="/register" className="font-semibold text-orange">
										Request access
									</Link>
								</p>
							</form>
						</div>

						<div className="mt-6 rounded-xl bg-sand p-4 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
								Account access tiers
							</p>
							<ul className="mt-3 grid gap-2 text-[12px] text-ink-soft sm:grid-cols-2">
								<li className="flex items-center gap-2">
									<span className="size-1.5 rounded-full bg-orange" />
									Importers & consignees
								</li>
								<li className="flex items-center gap-2">
									<span className="size-1.5 rounded-full bg-orange" />
									Licensed agents
								</li>
								<li className="flex items-center gap-2">
									<span className="size-1.5 rounded-full bg-orange" />
									Transporters & haulage
								</li>
								<li className="flex items-center gap-2">
									<span className="size-1.5 rounded-full bg-orange" />
									TRINŪ staff
								</li>
							</ul>
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