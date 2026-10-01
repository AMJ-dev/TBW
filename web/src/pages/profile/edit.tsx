import { useState, useEffect, useContext, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import { useNavigate } from "react-router-dom";
import {
	AlertTriangle,
	ArrowRight,
	Building2,
	Camera,
	Check,
	Mail,
	Phone,
	Save,
	ShieldCheck,
	Trash2,
	Upload,
	User,
	X,
} from "lucide-react";
import { http, type Resp } from "@/lib/httpClient";
import UserContext from "@/lib/userContext";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell, Avatar } from "@/components/shell";
import { cn } from "@/lib/utils";
import { resolveSrc } from "@/lib/functions";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

type ProfileData = {
	id?: string;
	email?: string;
	full_name?: string;
	phone?: string;
	pics?: string;
	account_type?: string;
	role_in_org?: string;
	organisation_name?: string;
	organisation_type?: string;
	mfa_enabled?: boolean;
	last_login_at?: string;
	last_login_ip?: string;
	created_at?: string;
};

export default function EditProfilePage() {
	const navigate = useNavigate();
	const { my_details, role } = useContext(UserContext);
	const deviceInfo = useDeviceInfo();

	const [profile, setProfile] = useState<ProfileData | null>(my_details ?? null);
	const [fullName, setFullName] = useState("");
	const [phone, setPhone] = useState("");
	const [roleInOrg, setRoleInOrg] = useState("");
	const [original, setOriginal] = useState({
		fullName: "",
		phone: "",
		roleInOrg: "",
		pics: "",
	});

	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string>("");
	const [removeAvatar, setRemoveAvatar] = useState(false);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);

	const [submitting, setSubmitting] = useState(false);
	const [loading, setLoading] = useState(!my_details);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await http.get("my-profile/");
				const resp: Resp = res.data;
				if (cancelled) return;
				if (resp.error) {
					if (!my_details) {
						setError(resp.data || "Could not load your profile.");
					}
					setLoading(false);
					return;
				}
					console.log(resolveSrc("uploads/73b2c6e1af2026_09_30_09_46_43x612.jpg"))
				const data: ProfileData = { ...(my_details ?? {}), ...(resp.code ?? {}) };
				setProfile(data);

				const initial = {
					fullName: data.full_name ?? "",
					phone: data.phone ?? "",
					roleInOrg: data.role_in_org ?? "",
					pics: data.pics ?? "",
				};
				setFullName(initial.fullName);
				setPhone(initial.phone);
				setRoleInOrg(initial.roleInOrg);
				setOriginal(initial);
			} catch (err: any) {
				if (cancelled) return;
				if (!my_details) {
					setError(err?.response?.data?.message || "Could not load your profile.");
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (!avatarFile) {
			setAvatarPreview("");
			return;
		}
		const url = URL.createObjectURL(avatarFile);
		setAvatarPreview(url);
		return () => URL.revokeObjectURL(url);
	}, [avatarFile]);

	const trimmedFullName = fullName.trim();
	const trimmedPhone = phone.trim();
	const trimmedRoleInOrg = roleInOrg.trim();

	const phoneValid =
		trimmedPhone.length === 0 || /^\+?[\d\s\-()]{7,20}$/.test(trimmedPhone);

	const avatarChanged = Boolean(avatarFile) || removeAvatar;

	const isDirty =
		trimmedFullName !== original.fullName.trim() ||
		trimmedPhone !== original.phone.trim() ||
		trimmedRoleInOrg !== original.roleInOrg.trim() ||
		avatarChanged;

	const canSubmit =
		isDirty && trimmedFullName.length >= 2 && phoneValid && !submitting;

	const handlePickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			toast.error("Choose an image file (JPG, PNG, or WebP).");
			return;
		}
		if (file.size > MAX_AVATAR_BYTES) {
			toast.error("Image must be 2MB or smaller.");
			return;
		}

		setRemoveAvatar(false);
		setAvatarFile(file);
	};

	const handleRemoveAvatar = () => {
		setAvatarFile(null);
		setRemoveAvatar(true);
	};

	const handleDiscard = () => {
		setFullName(original.fullName);
		setPhone(original.phone);
		setRoleInOrg(original.roleInOrg);
		setAvatarFile(null);
		setAvatarPreview("");
		setRemoveAvatar(false);
	};

	const uploadAvatarIfNeeded = async (): Promise<boolean> => {
		if (!avatarChanged) return true;

		const form = new FormData();
		if (avatarFile) {
			form.append("avatar", avatarFile);
		} else if (removeAvatar) {
			form.append("remove", "1");
		}

		setUploadingAvatar(true);
		try {
			const res = await http.post("auth/profile/avatar/", form, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not update your photo.");
				return false;
			}
			return true;
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Could not update your photo.");
			return false;
		} finally {
			setUploadingAvatar(false);
		}
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!canSubmit) return;

		if (trimmedFullName.length < 2) {
			toast.error("Enter your full name to continue.");
			return;
		}
		if (!phoneValid) {
			toast.error("Enter a valid phone number.");
			return;
		}

		setSubmitting(true);
		try {
			const profileChanged =
				trimmedFullName !== original.fullName.trim() ||
				trimmedPhone !== original.phone.trim() ||
				trimmedRoleInOrg !== original.roleInOrg.trim();

			if (profileChanged) {
				const payload: {
					full_name: string;
					phone?: string;
					role_in_org?: string;
				} = {
					full_name: trimmedFullName,
				};
				if (trimmedPhone !== original.phone.trim()) payload.phone = trimmedPhone;
				if (trimmedRoleInOrg !== original.roleInOrg.trim())
					payload.role_in_org = trimmedRoleInOrg;

				const res = await http.patch("auth/profile/update/", {
					...payload,
					device_info: `${deviceInfo.browser} on ${deviceInfo.os} (${deviceInfo.deviceType})`,
				});
				const resp: Resp = res.data;
				if (resp.error) {
					toast.error(resp.data || "Could not save your changes.");
					return;
				}
			}

			const avatarOk = await uploadAvatarIfNeeded();
			if (!avatarOk) return;

			setOriginal({
				fullName: trimmedFullName,
				phone: trimmedPhone,
				roleInOrg: trimmedRoleInOrg,
				pics: removeAvatar ? "" : original.pics,
			});
			setAvatarFile(null);
			setAvatarPreview("");
			setRemoveAvatar(false);

			toast.success("Profile updated.");
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Could not save your changes.");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading && !profile?.full_name) {
		return (
			<AppShell title="Edit profile" eyebrow="Account · Profile">
				<div className="flex items-center justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
					<span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
				</div>
			</AppShell>
		);
	}

	if (error && !profile?.full_name) {
		return (
			<AppShell title="Edit profile" eyebrow="Account · Profile">
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load your profile
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">{error}</p>
						</div>
					</div>
					<div className="mt-5 flex flex-wrap gap-2">
						<Button
							onClick={() => window.location.reload()}
							className="bg-orange text-white hover:bg-orange-deep"
						>
							Try again
						</Button>
						<Link to="/my-profile">
							<Button
								variant="outline"
								className="border-line bg-paper text-ink hover:bg-sand"
							>
								Back to profile
							</Button>
						</Link>
					</div>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell title="Edit profile" eyebrow="Account · Profile">
			<div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
				<div className="overflow-hidden rounded-2xl bg-paper shadow-sm ring-1 ring-line">
					<div className="border-b border-line bg-sand p-5 sm:p-7">
						<div className="flex items-center gap-2">
							<div className="grid size-8 place-items-center rounded-md bg-orange text-white">
								<User className="size-4" />
							</div>
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								Personal details
							</p>
						</div>
						<h2 className="mt-4 font-display text-2xl font-bold text-ink">
							Update your profile
						</h2>
						<p className="mt-1 text-[12px] text-ink-soft">
							Keep your details accurate — this is how the terminal team reaches you.
						</p>
					</div>

					<form onSubmit={handleSubmit} className="p-5 sm:p-7">
						<div className="space-y-5">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Profile photo
								</p>
								<div className="mt-3 flex flex-wrap items-center gap-4">
									{avatarPreview ? (
										<img
											src={avatarPreview}
											alt="Preview"
											className="size-20 shrink-0 rounded-full object-cover ring-4 ring-paper"
										/>
									) : removeAvatar ? (
										<Avatar
											pics="avatar.png"
											fullName={trimmedFullName || profile?.full_name}
											size={80}
											className="ring-4 ring-paper"
										/>
									) : (
										<Avatar
											pics={original.pics}
											fullName={trimmedFullName || profile?.full_name}
											size={80}
											className="ring-4 ring-paper"
										/>
									)}

									<div className="flex flex-wrap items-center gap-2">
										<label>
											<input
												type="file"
												accept="image/*"
												onChange={handlePickAvatar}
												className="hidden"
											/>
											<span className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line bg-paper px-3.5 py-2 text-[12px] font-semibold text-ink transition-colors hover:bg-sand">
												<Upload className="size-3.5" />
												{avatarPreview || original.pics ? "Replace photo" : "Upload photo"}
											</span>
										</label>

										{(avatarPreview || (original.pics && !removeAvatar)) && (
											<button
												type="button"
												onClick={handleRemoveAvatar}
												className="inline-flex items-center gap-2 rounded-md border border-line bg-paper px-3.5 py-2 text-[12px] font-semibold text-carmine transition-colors hover:bg-carmine/10"
											>
												<Trash2 className="size-3.5" />
												Remove
											</button>
										)}
									</div>
								</div>
								<p className="mt-2 text-[11px] leading-5 text-ink-soft">
									JPG, PNG, or WebP. Max 2MB. Square images look best.
								</p>
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

							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Email address
								</span>
								<div className="relative mt-2">
									<Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
									<Input
										disabled
										value={profile?.email ?? ""}
										className="h-11 cursor-not-allowed border-line bg-sand-2 pl-9 text-ink-soft"
									/>
								</div>
								<p className="mt-2 text-[11px] leading-5 text-ink-soft">
									Email is tied to your account and can't be changed here. Contact your
									administrator if you need to update it.
								</p>
							</label>

							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Phone number
								</span>
								<div className="relative mt-2">
									<Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
									<Input
										placeholder="+234 803 000 0000"
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										className={cn(
											"h-11 border-line bg-sand pl-9 text-ink",
											!phoneValid && "border-carmine/50 ring-1 ring-carmine/25"
										)}
									/>
								</div>
								{!phoneValid && (
									<p className="mt-2 text-[11px] text-carmine">
										Enter a valid phone number.
									</p>
								)}
							</label>

							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Role in organisation
								</span>
								<div className="relative mt-2">
									<Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
									<Input
										placeholder="e.g. Operations Manager"
										value={roleInOrg}
										onChange={(e) => setRoleInOrg(e.target.value)}
										className="h-11 border-line bg-sand pl-9 text-ink"
									/>
								</div>
							</label>

							<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
								<div className="flex items-center gap-2">
									<ShieldCheck className="size-4 text-orange" />
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
										Account
									</p>
								</div>
								<dl className="mt-3 grid gap-2 text-[12px] text-ink-soft sm:grid-cols-2">
									<div className="flex items-center justify-between gap-2">
										<dt>Account type</dt>
										<dd className="font-medium capitalize text-ink">
											{profile?.account_type ?? "—"}
										</dd>
									</div>
									<div className="flex items-center justify-between gap-2">
										<dt>Role</dt>
										<dd className="text-right font-medium text-ink">
											{role?.name ?? "—"}
										</dd>
									</div>
								</dl>
							</div>
						</div>

						<div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
							<button
								type="button"
								onClick={handleDiscard}
								disabled={!isDirty || submitting}
								className={cn(
									"inline-flex items-center gap-1.5 text-[12px] font-semibold",
									isDirty && !submitting
										? "text-ink-soft hover:text-ink"
										: "cursor-not-allowed text-ink-soft/50"
								)}
							>
								<X className="size-3.5" />
								Discard changes
							</button>
							<Button
								type="submit"
								disabled={!canSubmit || uploadingAvatar}
								className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
							>
								{submitting || uploadingAvatar ? "Saving…" : "Save changes"}
								{!submitting && !uploadingAvatar && <Save />}
							</Button>
						</div>
					</form>
				</div>

				<div className="space-y-4">
					<div className="rounded-2xl bg-slate p-5 text-sand ring-1 ring-slate">
						<div className="flex items-center gap-2">
							<Camera className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								About your photo
							</p>
						</div>
						<p className="mt-3 text-[12px] leading-6 text-sand/75">
							A clear photo helps the terminal team recognise you on coordination
							records. If you don't upload one, we show your initials instead.
						</p>
					</div>

					<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
							Field policy
						</p>
						<ul className="mt-3 space-y-2.5 text-[12px] leading-5 text-ink-soft">
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 size-3.5 shrink-0 text-orange" />
								Full name: your legal name as it appears on documents.
							</li>
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 size-3.5 shrink-0 text-orange" />
								Phone: the fastest number to reach you on.
							</li>
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 size-3.5 shrink-0 text-orange" />
								Role in organisation: how you're identified internally.
							</li>
							<li className="flex items-start gap-2">
								<X className="mt-0.5 size-3.5 shrink-0 text-carmine" />
								Email: locked to your account for security.
							</li>
						</ul>
					</div>

					<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
							Related settings
						</p>
						<div className="mt-3 grid gap-2">
							<Link
								to="/change-password"
								className="flex items-center justify-between rounded-lg bg-sand px-3 py-2.5 text-[12px] text-ink transition-colors hover:bg-sand-2"
							>
								<span>Change password</span>
								<ArrowRight className="size-3.5 text-ink-soft" />
							</Link>
							<Link
								to="/mfa/setup"
								className="flex items-center justify-between rounded-lg bg-sand px-3 py-2.5 text-[12px] text-ink transition-colors hover:bg-sand-2"
							>
								<span>Two-factor authentication</span>
								<ArrowRight className="size-3.5 text-ink-soft" />
							</Link>
							<Link
								to="/session-management"
								className="flex items-center justify-between rounded-lg bg-sand px-3 py-2.5 text-[12px] text-ink transition-colors hover:bg-sand-2"
							>
								<span>Signed-in devices</span>
								<ArrowRight className="size-3.5 text-ink-soft" />
							</Link>
							<Link
								to="/my-profile"
								className="flex items-center justify-between rounded-lg bg-sand px-3 py-2.5 text-[12px] text-ink transition-colors hover:bg-sand-2"
							>
								<span>Back to profile</span>
								<ArrowRight className="size-3.5 text-ink-soft" />
							</Link>
						</div>
					</div>
				</div>
			</div>
		</AppShell>
	);
}