import { useContext, useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import { useNavigate } from "react-router-dom";
import {
	AlertTriangle,
	ArrowRight,
	Check,
	Eye,
	EyeOff,
	Lock,
	ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/shell";
import UserContext from "@/lib/userContext";
import { http, type Resp } from "@/lib/httpClient";

export default function ChangePasswordPage() {
	const navigate = useNavigate();
	const { my_details } = useContext(UserContext);

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPasswords, setShowPasswords] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const strength = useMemo(() => {
		let score = 0;
		if (newPassword.length >= 8) score += 1;
		if (newPassword.length >= 12) score += 1;
		if (/[A-Z]/.test(newPassword)) score += 1;
		if (/[a-z]/.test(newPassword)) score += 1;
		if (/\d/.test(newPassword)) score += 1;
		if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
		return Math.min(score, 5);
	}, [newPassword]);

	const strengthLabel = ["Very weak", "Weak", "Fair", "Good", "Strong", "Very strong"][strength];
	const strengthTone =
		strength <= 1
			? "bg-carmine"
			: strength <= 2
			? "bg-orange/60"
			: strength <= 4
			? "bg-orange"
			: "bg-orange";

	const canSubmit =
		currentPassword.length > 0 &&
		newPassword.length >= 8 &&
		newPassword === confirmPassword &&
		newPassword !== currentPassword;

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!currentPassword.trim()) {
			toast.error("Enter your current password to continue.");
			return;
		}
		if (newPassword.length < 8) {
			toast.error("New password must be at least 8 characters.");
			return;
		}
		if (newPassword === currentPassword) {
			toast.error("New password must be different from the current password.");
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.error("Passwords do not match.");
			return;
		}

		setSubmitting(true);
		try {
			const res = await http.post("auth/change-password/", {
				current_password: currentPassword,
				new_password: newPassword,
				confirm_password: confirmPassword,
			});
			const resp: Resp = res.data;

			if (resp?.error) {
				toast.error(
					resp?.data || "Could not change your password. Check the current password and try again."
				);
				return;
			}

			toast.success(resp?.data || "Password updated. Other sessions have been signed out.");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			navigate("/session-management", { replace: true });
		} catch {
			toast.error("Could not complete the request. Try again later.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<AppShell title="Change password" eyebrow="Account · Security">
			<div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
				{/* FORM */}
				<div className="overflow-hidden rounded-2xl bg-paper shadow-sm ring-1 ring-line">
					<div className="border-b border-line bg-sand p-5 sm:p-7">
						<div className="flex items-center gap-2">
							<div className="grid size-8 place-items-center rounded-md bg-orange text-white">
								<Lock className="size-4" />
							</div>
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								Password change
							</p>
						</div>
						<h2 className="mt-4 font-display text-2xl font-bold text-ink">
							Update your password
						</h2>
						<p className="mt-1 text-[12px] text-ink-soft">
							Signing in as{" "}
							<span className="font-mono text-ink">
								{my_details?.email ?? "your account"}
							</span>
							. You'll be signed out of other devices after saving.
						</p>
					</div>

					<form onSubmit={handleSubmit} className="p-5 sm:p-7">
						<div className="space-y-5">
							{/* Current password */}
							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Current password
								</span>
								<div className="relative mt-2">
									<Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
									<Input
										required
										type={showPasswords ? "text" : "password"}
										autoComplete="current-password"
										placeholder="Enter your current password"
										value={currentPassword}
										onChange={(e) => setCurrentPassword(e.target.value)}
										className="h-11 border-line bg-sand pl-9 pr-10 text-ink"
									/>
								</div>
							</label>

							{/* New password */}
							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									New password
								</span>
								<div className="relative mt-2">
									<Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
									<Input
										required
										type={showPasswords ? "text" : "password"}
										autoComplete="new-password"
										placeholder="At least 8 characters"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										className="h-11 border-line bg-sand pl-9 pr-10 text-ink"
									/>
									<button
										type="button"
										onClick={() => setShowPasswords((v) => !v)}
										aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
										className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink-soft transition-colors hover:bg-sand-2 hover:text-orange"
									>
										{showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
									</button>
								</div>
							</label>

							{/* Strength meter */}
							{newPassword.length > 0 && (
								<div>
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
										<Rule ok={newPassword.length >= 8}>At least 8 characters</Rule>
										<Rule ok={/[A-Z]/.test(newPassword)}>Upper case letter</Rule>
										<Rule ok={/[a-z]/.test(newPassword)}>Lower case letter</Rule>
										<Rule ok={/\d/.test(newPassword)}>A number</Rule>
										<Rule ok={/[^A-Za-z0-9]/.test(newPassword)}>A symbol</Rule>
										<Rule ok={newPassword !== currentPassword && newPassword.length > 0}>
											Different from current
										</Rule>
									</ul>
								</div>
							)}

							{/* Confirm password */}
							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Confirm new password
								</span>
								<div className="relative mt-2">
									<Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
									<Input
										required
										type={showPasswords ? "text" : "password"}
										autoComplete="new-password"
										placeholder="Re-enter your new password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className="h-11 border-line bg-sand pl-9 text-ink"
									/>
								</div>
								{confirmPassword.length > 0 && confirmPassword !== newPassword && (
									<p className="mt-2 flex items-center gap-1.5 text-[11px] text-carmine">
										<AlertTriangle className="size-3.5" />
										Passwords do not match.
									</p>
								)}
							</label>
						</div>

						<div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
							<Link
								to="/session-management"
								className="text-[12px] font-semibold text-ink-soft hover:text-orange"
							>
								Cancel
							</Link>
							<Button
								type="submit"
								disabled={submitting || !canSubmit}
								className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
							>
								{submitting ? "Updating password…" : "Update password"}{" "}
								{!submitting && <ArrowRight />}
							</Button>
						</div>
					</form>
				</div>

				{/* SIDE PANEL */}
				<div className="space-y-4">
					<div className="rounded-2xl bg-slate p-5 text-sand ring-1 ring-slate">
						<div className="flex items-center gap-2">
							<ShieldCheck className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								Security notice
							</p>
						</div>
						<p className="mt-3 text-[12px] leading-6 text-sand/75">
							Changing your password signs out every other device on your account.
							Your current session will continue until you sign out or it expires.
						</p>
					</div>

					<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
							Choosing a strong password
						</p>
						<ul className="mt-3 space-y-2.5 text-[12px] leading-5 text-ink-soft">
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Use at least 12 characters where possible.
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Mix upper case, lower case, numbers, and symbols.
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Don't reuse passwords from other services.
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Avoid obvious personal details or dates.
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								We screen new passwords against known breach lists.
							</li>
						</ul>
					</div>

					<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
							Need to do something else?
						</p>
						<div className="mt-3 grid gap-2">
							<Link
								to="/session-management"
								className="flex items-center justify-between rounded-lg bg-sand px-3 py-2.5 text-[12px] text-ink transition-colors hover:bg-sand-2"
							>
								<span>Review signed-in devices</span>
								<ArrowRight className="size-3.5 text-ink-soft" />
							</Link>
							<Link
								to="/mfa/setup"
								className="flex items-center justify-between rounded-lg bg-sand px-3 py-2.5 text-[12px] text-ink transition-colors hover:bg-sand-2"
							>
								<span>Manage two-factor authentication</span>
								<ArrowRight className="size-3.5 text-ink-soft" />
							</Link>
							<Link
								to="/contact"
								className="flex items-center justify-between rounded-lg bg-sand px-3 py-2.5 text-[12px] text-ink transition-colors hover:bg-sand-2"
							>
								<span>Contact operations</span>
								<ArrowRight className="size-3.5 text-ink-soft" />
							</Link>
						</div>
					</div>
				</div>
			</div>
		</AppShell>
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