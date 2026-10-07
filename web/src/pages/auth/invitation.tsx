import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import { useNavigate, useParams } from "react-router-dom";
import {
	AlertTriangle,
	ArrowRight,
	Check,
	CheckCircle2,
	Clock3,
	Eye,
	EyeOff,
	Mail,
	Phone,
	ShieldCheck,
	User,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";
import { client_url } from "@/lib/constants";

interface InviteContext {
	email: string;
	full_name?: string;
	phone?: string;
	account_type: "organisation" | "system";
	organisation_name?: string;
	role_name?: string;
	expires_at?: string;
	state: "valid" | "expired" | "used" | "invalid";
}

type Step = "loading" | "invalid" | "form" | "otp" | "done";

const passwordRules = [
	{ label: "At least 10 characters", test: (v: string) => v.length >= 10 },
	{ label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
	{ label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
	{ label: "One number", test: (v: string) => /\d/.test(v) },
	{ label: "One symbol", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

const formatDate = (input?: string) => {
	if (!input) return "—";
	const d = new Date(input);
	if (Number.isNaN(d.getTime())) return "—";
	return d.toLocaleString("en-NG", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

export default function AcceptInvitePage() {
	const {token} = useParams();
	const navigate = useNavigate();

	const [step, setStep] = useState<Step>("loading");
	const [ctx, setCtx] = useState<InviteContext | null>(null);
	const [errorMsg, setErrorMsg] = useState("");

	const [fullName, setFullName] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const [otpCode, setOtpCode] = useState("");
	const [resending, setResending] = useState(false);
	const [secondsLeft, setSecondsLeft] = useState(0);

	const fetchInvite = async () => {
		if (!token) {
			setErrorMsg("This invite link is missing its token.");
			setStep("invalid");
			return;
		}
		try {
			const res = await http.get(`auth/invite/${encodeURIComponent(token)}/`);
			const resp: Resp = res.data;
			if (resp.error) {
				setErrorMsg(resp.data || "Could not load this invite.");
				setStep("invalid");
				return;
			}
			const payload: any = resp.code ?? {};
			const invite: InviteContext = {
				email: payload.email ?? "",
				full_name: payload.full_name ?? "",
				phone: payload.phone ?? "",
				account_type: (payload.account_type ?? "organisation") as
					| "organisation"
					| "system",
				organisation_name: payload.organisation_name ?? payload.organisation?.name,
				role_name: payload.role_name ?? payload.role?.role_name,
				expires_at: payload.expires_at,
				state: (payload.state ?? "valid") as InviteContext["state"],
			};

			setCtx(invite);
			setFullName(invite.full_name ?? "");
			setPhone(invite.phone ?? "");

			if (invite.state === "expired" || invite.state === "used" || invite.state === "invalid") {
				setStep("invalid");
				return;
			}

			setStep("form");
		} catch (err: any) {
			setErrorMsg(
				err?.response?.data?.message || "Could not load this invite."
			);
			setStep("invalid");
		}
	};

	useEffect(() => {
		void fetchInvite();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token]);

	useEffect(() => {
		if (secondsLeft <= 0) return;
		const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
		return () => clearInterval(t);
	}, [secondsLeft]);

	const passwordOk = useMemo(
		() => passwordRules.every((r) => r.test(password)),
		[password]
	);

	const canSubmitForm =
		!!fullName.trim() &&
		!!phone.trim() &&
		passwordOk &&
		password === confirmPassword &&
		!submitting;

	const requiresPhoneVerification =
		!!ctx?.phone && ctx.phone.replace(/\D/g, "").length > 0;

	const handleSubmitForm = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!canSubmitForm) {
			if (password !== confirmPassword) {
				toast.error("Passwords do not match.");
			} else if (!passwordOk) {
				toast.error("Password does not meet the requirements.");
			}
			return;
		}
		setSubmitting(true);
		try {
			const res = await http.post("auth/invite/complete/", {
				token,
				full_name: fullName.trim(),
				phone: phone.trim(),
				password,
				password_confirmation: confirmPassword,
			});
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not complete your registration.");
				return;
			}

			if (requiresPhoneVerification) {
				setOtpCode("");
				setSecondsLeft(60);
				setStep("otp");
				toast.success("Verification code sent to your phone.");
			} else {
				setStep("done");
			}
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not complete your registration."
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!otpCode.trim() || otpCode.trim().length < 4) {
			toast.error("Enter the verification code.");
			return;
		}
		setSubmitting(true);
		try {
			const res = await http.post("auth/invite/verify-phone/", {
				token,
				code: otpCode.trim(),
			});
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not verify the code.");
				return;
			}
			setStep("done");
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Could not verify the code.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleResendOtp = async () => {
		if (resending || secondsLeft > 0) return;
		setResending(true);
		try {
			const res = await http.post("auth/invite/resend-phone/", { token });
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not resend the code.");
				return;
			}
			setSecondsLeft(60);
			toast.success("A new code has been sent.");
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Could not resend the code.");
		} finally {
			setResending(false);
		}
	};

	if (step === "loading") {
		return (
			<div className="grid min-h-screen place-items-center bg-sand p-6">
				<div className="flex flex-col items-center gap-4">
					<span className="size-8 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
					<p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
						Verifying your invite…
					</p>
				</div>
			</div>
		);
	}

	if (step === "invalid") {
		const reason =
			ctx?.state === "expired"
				? "This invite has expired."
				: ctx?.state === "used"
				? "This invite has already been used."
				: errorMsg || "This invite link is not valid.";

		return (
			<div className="grid min-h-screen place-items-center bg-sand px-4 py-10">
				<div className="w-full max-w-md rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<XCircle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Invite could not be used
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">{reason}</p>
						</div>
					</div>

					<div className="mt-5 rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="text-[12px] leading-5 text-ink-soft">
							Ask your administrator to send a fresh invite from the
							<span className="font-mono"> Users </span>
							page. Invites are valid for 72 hours.
						</p>
					</div>

					<div className="mt-5 flex flex-wrap gap-2">
						<Link to="/login">
							<Button className="bg-orange text-white hover:bg-orange-deep">
								Go to sign-in
							</Button>
						</Link>
					</div>
				</div>
			</div>
		);
	}

	if (step === "done") {
		return (
			<div className="grid min-h-screen place-items-center bg-sand px-4 py-10">
				<div className="w-full max-w-md rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-orange text-white">
							<CheckCircle2 className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								You're all set
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">
								Your account is active. You can sign in now and start
								working from your organisation's dashboard.
							</p>
						</div>
					</div>

					<Button
						className="mt-6 w-full bg-orange text-white hover:bg-orange-deep"
						onClick={() => navigate("/login", { replace: true })}
					>
						Continue to sign in
						<ArrowRight className="size-4" />
					</Button>
				</div>
			</div>
		);
	}

	if (step === "otp") {
		return (
			<div className="grid min-h-screen place-items-center bg-sand px-4 py-10">
				<div className="w-full max-w-md rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-orange text-white">
							<Phone className="size-5" />
						</div>
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								Verify your phone
							</p>
							<h1 className="mt-1 font-display text-xl font-bold text-ink">
								Enter the code we sent
							</h1>
							<p className="mt-1 text-[12px] leading-5 text-ink-soft">
								We sent a 6-digit code to{" "}
								<span className="font-mono text-ink">{ctx?.phone}</span>.
								It expires in 10 minutes.
							</p>
						</div>
					</div>

					<form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Verification code
							</span>
							<Input
								autoFocus
								inputMode="numeric"
								autoComplete="one-time-code"
								maxLength={6}
								value={otpCode}
								onChange={(e) =>
									setOtpCode(e.target.value.replace(/\D/g, ""))
								}
								placeholder="123456"
								className="mt-1.5 h-12 border-line bg-sand text-center font-mono text-lg tracking-[0.4em] text-ink"
							/>
						</label>

						<Button
							type="submit"
							disabled={submitting || otpCode.length < 4}
							className="h-11 w-full bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
						>
							{submitting ? "Verifying…" : "Verify & continue"}
						</Button>
					</form>

					<div className="mt-4 flex items-center justify-between text-[12px] text-ink-soft">
						<span>
							{secondsLeft > 0
								? `Resend available in ${secondsLeft}s`
								: "Didn't get the code?"}
						</span>
						<button
							type="button"
							onClick={handleResendOtp}
							disabled={resending || secondsLeft > 0}
							className={cn(
								"font-semibold text-orange-deep",
								(secondsLeft > 0 || resending) && "opacity-50"
							)}
						>
							{resending ? "Resending…" : "Resend code"}
						</button>
					</div>
				</div>
			</div>
		);
	}

	// step === "form"
	return (
		<div className="grid min-h-screen bg-sand lg:grid-cols-2">
			<div className="flex items-center justify-center px-4 py-10 lg:px-8">
				<div className="w-full max-w-md">
					<Link
						to="/"
						className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-orange"
					>
						← Back to {client_url}
					</Link>

					<p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-deep">
						Accept your invitation
					</p>
					<h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Set up your account
					</h1>
					<p className="mt-2 text-sm leading-6 text-ink-soft">
						You've been invited to join TRÏNŪ as{" "}
						<span className="font-semibold text-ink">
							{ctx?.role_name ?? "a user"}
						</span>
						{ctx?.organisation_name ? (
							<>
								{" "}
								at{" "}
								<span className="font-semibold text-ink">
									{ctx.organisation_name}
								</span>
							</>
						) : null}
						. Finish the form below to activate your access.
					</p>

					<form onSubmit={handleSubmitForm} className="mt-6 space-y-5">
						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Email
							</span>
							<div className="mt-1.5 flex items-center gap-2 rounded-md border border-line bg-sand-2 px-3 py-2.5">
								<Mail className="size-4 text-ink-soft" />
								<span className="font-mono text-sm text-ink-soft">
									{ctx?.email}
								</span>
							</div>
							<p className="mt-1 text-[11px] text-ink-soft">
								This is fixed by your invite. Contact your administrator
								if it's wrong.
							</p>
						</label>

						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Full name <span className="text-coral">*</span>
							</span>
							<Input
								required
								value={fullName}
								onChange={(e) => setFullName(e.target.value)}
								placeholder="e.g. Tunde Lawal"
								className="mt-1.5 h-11 border-line bg-sand text-ink"
							/>
						</label>

						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Phone <span className="text-coral">*</span>
							</span>
							<Input
								required
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="e.g. +234 803 000 0000"
								className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
							/>
							<p className="mt-1 text-[11px] text-ink-soft">
								We'll send a one-time code to this number to confirm it's
								yours.
							</p>
						</label>

						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Password <span className="text-coral">*</span>
							</span>
							<div className="relative mt-1.5">
								<Input
									required
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Create a strong password"
									className="h-11 border-line bg-sand pr-11 font-mono text-ink"
								/>
								<button
									type="button"
									onClick={() => setShowPassword((v) => !v)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
									aria-label={showPassword ? "Hide password" : "Show password"}
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
								Confirm password <span className="text-coral">*</span>
							</span>
							<Input
								required
								type={showPassword ? "text" : "password"}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Repeat your password"
								className="h-11 border-line bg-sand font-mono text-ink mt-1.5"
							/>
						</label>

						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Password requirements
							</p>
							<ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
								{passwordRules.map((rule) => {
									const passed = rule.test(password);
									return (
										<li
											key={rule.label}
											className={cn(
												"flex items-center gap-2 text-[11px]",
												passed ? "text-teal-deep" : "text-ink-soft"
											)}
										>
											<Check
												className={cn(
													"size-3.5",
													passed ? "text-teal-deep" : "text-ink-soft/50"
												)}
											/>
											{rule.label}
										</li>
									);
								})}
							</ul>
						</div>

						<Button
							type="submit"
							disabled={!canSubmitForm}
							className="h-11 w-full bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
						>
							{submitting ? "Creating your account…" : "Create my account"}
							{!submitting && <ArrowRight className="size-4" />}
						</Button>

						<p className="text-center text-[11px] leading-5 text-ink-soft">
							By continuing you confirm that the details above are correct
							and that you accept TRÏNŪ's terms of use and privacy notice.
						</p>
					</form>
				</div>
			</div>

			<aside className="hidden bg-slate p-10 text-sand lg:flex lg:flex-col lg:justify-between">
				<div>
					<img src="/logo.png" alt="TRÏNŪ" className="h-14 w-14" />
					<p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
						Invitation summary
					</p>
					<h2 className="mt-2 font-display text-2xl font-bold leading-tight text-sand">
						You're joining {ctx?.organisation_name ?? "TRÏNŪ"}.
					</h2>
					<p className="mt-3 max-w-sm text-[13px] leading-6 text-sand/80">
						TRÏNŪ brings the port closer — so trade in Abuja moves at
						Abuja's pace.
					</p>
				</div>

				<div className="space-y-3">
					<SummaryRow
						icon={User}
						label="Role"
						value={ctx?.role_name ?? "—"}
					/>
					<SummaryRow
						icon={ShieldCheck}
						label="Account type"
						value={
							ctx?.account_type === "system"
								? "System user"
								: "Organisation user"
						}
					/>
					<SummaryRow
						icon={Clock3}
						label="Invite expires"
						value={formatDate(ctx?.expires_at)}
					/>
				</div>
			</aside>
		</div>
	);
}

function SummaryRow({
	icon: Icon,
	label,
	value,
}: {
	icon: typeof ShieldCheck;
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-lg bg-sand/5 px-3 py-2.5 ring-1 ring-sand/15">
			<div className="flex items-center gap-2">
				<Icon className="size-3.5 text-orange" />
				<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand/70">
					{label}
				</span>
			</div>
			<span className="truncate text-[12px] font-medium text-sand">{value}</span>
		</div>
	);
}