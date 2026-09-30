import { useContext, useEffect, useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Building2,
	Calendar,
	Check,
	Clock3,
	Fingerprint,
	KeyRound,
	Laptop,
	Lock,
	Mail,
	MapPin,
	Pencil,
	Phone,
	ShieldCheck,
	User,
} from "lucide-react";
import { AppShell, Avatar } from "@/components/shell";
import UserContext from "@/lib/userContext";
import { http, type Resp } from "@/lib/httpClient";

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

export default function MyProfilePage() {
	const { my_details, role, privileges, permissions } = useContext(UserContext);
	const [profile, setProfile] = useState<ProfileData | null>(my_details ?? null);
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
					setError(resp.data || "Could not load your profile.");
					setLoading(false);
					return;
				}
				setProfile({ ...(my_details ?? {}), ...(resp.code ?? {}) });
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

	const data = profile ?? {};

	const memberSince = data.created_at
		? new Date(data.created_at).toLocaleDateString("en-NG", {
				day: "numeric",
				month: "long",
				year: "numeric",
		  })
		: "—";

	const lastSignIn = data.last_login_at
		? new Date(data.last_login_at).toLocaleString("en-NG", {
				day: "numeric",
				month: "short",
				hour: "2-digit",
				minute: "2-digit",
		  })
		: "—";

	return (
		<AppShell title="My profile" eyebrow="Account">
			{loading && !data.full_name ? (
				<div className="flex items-center justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
					<span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
				</div>
			) : error && !data.full_name ? (
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
						<button
							onClick={() => window.location.reload()}
							className="inline-flex items-center gap-2 rounded-md bg-orange px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-orange-deep"
						>
							Try again
						</button>
						<Link
							to="/session-management"
							className="inline-flex items-center gap-2 rounded-md border border-line bg-paper px-4 py-2 text-[12px] font-semibold text-ink transition-colors hover:bg-sand"
						>
							Back to account security
						</Link>
					</div>
				</div>
			) : (
				<div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
					<div className="space-y-6">
						<div className="overflow-hidden rounded-2xl bg-paper shadow-sm ring-1 ring-line">
							<div className="relative border-b border-line bg-sand p-6 sm:p-7">
								<div className="flex flex-wrap items-center gap-5">
									<Avatar
										pics={data.pics}
										fullName={data.full_name}
										size={80}
										className="ring-4 ring-paper"
									/>
									<div className="min-w-0 flex-1">
										<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange">
											{role?.name ?? "Signed in"}
										</p>
										<h2 className="mt-1 truncate font-display text-2xl font-bold text-ink">
											{data.full_name ?? "Unknown user"}
										</h2>
										<p className="mt-1 truncate font-mono text-[12px] text-ink-soft">
											{data.email ?? "—"}
										</p>
									</div>
									<Link
										to="/profile/edit"
										className="inline-flex items-center gap-2 rounded-lg bg-orange px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-orange-deep"
									>
										<Pencil className="size-3.5" />
										Edit profile
									</Link>
								</div>
							</div>

							<div className="p-6 sm:p-7">
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
									Account details
								</p>
								<dl className="mt-4 grid gap-5 sm:grid-cols-2">
									<Field
										icon={User}
										label="Full name"
										value={data.full_name ?? "—"}
									/>
									<Field
										icon={Mail}
										label="Email address"
										value={data.email ?? "—"}
										mono
									/>
									<Field
										icon={Phone}
										label="Phone"
										value={data.phone ?? "Not provided"}
										mono={Boolean(data.phone)}
									/>
									<Field
										icon={Building2}
										label="Role in organisation"
										value={data.role_in_org ?? "Not provided"}
									/>
									<Field
										icon={ShieldCheck}
										label="Account type"
										value={
											data.account_type
												? data.account_type.charAt(0).toUpperCase() +
												  data.account_type.slice(1)
												: "—"
										}
									/>
									<Field
										icon={Calendar}
										label="Member since"
										value={memberSince}
									/>
								</dl>
							</div>

							<div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-sand px-6 py-4 sm:px-7">
								<p className="text-[12px] text-ink-soft">
									Keep your contact details up to date — the terminal team uses them for
									cargo coordination and release events.
								</p>
								<Link
									to="/profile/edit"
									className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-orange hover:text-orange-deep"
								>
									Edit details <ArrowRight className="size-3.5" />
								</Link>
							</div>
						</div>

						<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-7">
							<div className="flex items-center gap-2">
								<KeyRound className="size-4 text-orange" />
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
									Role & access
								</p>
							</div>
							<h3 className="mt-3 font-display text-xl font-bold text-ink">
								What you can do
							</h3>
							<p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink-soft">
								Your access is scoped to your role. Some actions are visible but disabled
								if your delegation doesn't permit them.
							</p>

							<div className="mt-5 grid gap-3 sm:grid-cols-2">
								<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
										Primary role
									</p>
									<p className="mt-1 text-sm font-semibold text-ink">
										{role?.name ?? "—"}
									</p>
									{role?.key && (
										<p className="mt-1 font-mono text-[11px] text-ink-soft">
											{role.key}
										</p>
									)}
								</div>
								<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
										Organisation
									</p>
									<p className="mt-1 text-sm font-semibold text-ink">
										{data.organisation_name ?? "—"}
									</p>
									{data.organisation_type && (
										<p className="mt-1 font-mono text-[11px] capitalize text-ink-soft">
											{data.organisation_type}
										</p>
									)}
								</div>
							</div>

							{privileges && privileges.length > 0 && (
								<div className="mt-5">
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
										Privileges
									</p>
									<div className="mt-2 flex flex-wrap gap-1.5">
										{privileges.map((p) => {
											const label =
												typeof p === "string"
													? p
													: (p as any)?.name ?? String(p);
											const key =
												typeof p === "string"
													? p
													: (p as any)?.code ?? label;
											return (
												<span
													key={key}
													className="inline-flex items-center gap-1.5 rounded-full bg-sand px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft ring-1 ring-line"
												>
													<Check className="size-3 text-orange" />
													{label}
												</span>
											);
										})}
									</div>
								</div>
							)}

							{permissions && permissions.length > 0 && (
								<div className="mt-5">
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
										Permissions
									</p>
									<div className="mt-2 flex flex-wrap gap-1.5">
										{permissions.map((p) => {
											const label =
												typeof p === "string"
													? p
													: (p as any)?.code ?? String(p);
											return (
												<span
													key={label}
													className="inline-flex items-center rounded-full bg-sand px-2.5 py-1 font-mono text-[10px] tracking-[0.04em] text-ink-soft ring-1 ring-line"
												>
													{label}
												</span>
											);
										})}
									</div>
								</div>
							)}
						</div>
					</div>

					<div className="space-y-4">
						<div className="rounded-2xl bg-slate p-5 text-sand ring-1 ring-slate">
							<div className="flex items-center gap-2">
								<ShieldCheck className="size-4 text-orange" />
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
									Security status
								</p>
							</div>
							<div className="mt-3 space-y-3">
								<SecurityRow
									icon={Lock}
									label="Password"
									value="Set"
									tone="success"
								/>
								<SecurityRow
									icon={Fingerprint}
									label="Two-factor"
									value={data.mfa_enabled ? "Enabled" : "Not enabled"}
									tone={data.mfa_enabled ? "success" : "warning"}
								/>
								<SecurityRow
									icon={Laptop}
									label="Active sessions"
									value="View devices"
									tone="info"
									asLink="/session-management"
								/>
								<SecurityRow
									icon={Clock3}
									label="Last sign-in"
									value={lastSignIn}
									tone="neutral"
								/>
								{data.last_login_ip && (
									<SecurityRow
										icon={MapPin}
										label="Last IP"
										value={data.last_login_ip}
										tone="neutral"
										mono
									/>
								)}
							</div>
						</div>

						<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
								Quick actions
							</p>
							<div className="mt-3 grid gap-2">
								<QuickLink to="/profile/edit" icon={Pencil} label="Edit profile" />
								<QuickLink to="/change-password" icon={Lock} label="Change password" />
								<QuickLink
									to="/mfa/setup"
									icon={Fingerprint}
									label="Manage two-factor"
								/>
								<QuickLink
									to="/session-management"
									icon={Laptop}
									label="Signed-in devices"
								/>
							</div>
						</div>

						<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
								Need help?
							</p>
							<p className="mt-2 text-[12px] leading-6 text-ink-soft">
								For account changes, delegation requests, or to report unauthorised
								access, contact the terminal team.
							</p>
							<Link
								to="/contact"
								className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-orange hover:text-orange-deep"
							>
								Contact operations <ArrowRight className="size-3.5" />
							</Link>
						</div>
					</div>
				</div>
			)}
		</AppShell>
	);
}

function Field({
	icon: Icon,
	label,
	value,
	mono = false,
}: {
	icon: typeof User;
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div>
			<dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				<Icon className="size-3.5 text-orange" />
				{label}
			</dt>
			<dd
				className={
					"mt-2 truncate text-[14px] " +
					(mono ? "font-mono text-ink" : "font-medium text-ink")
				}
			>
				{value}
			</dd>
		</div>
	);
}

function SecurityRow({
	icon: Icon,
	label,
	value,
	tone = "neutral",
	mono = false,
	asLink,
}: {
	icon: typeof Lock;
	label: string;
	value: string;
	tone?: "success" | "warning" | "critical" | "info" | "neutral";
	mono?: boolean;
	asLink?: string;
}) {
	const dotTone =
		tone === "success"
			? "bg-teal"
			: tone === "warning"
			? "bg-orange"
			: tone === "critical"
			? "bg-coral"
			: tone === "info"
			? "bg-sky"
			: "bg-sand/40";

	const content = (
		<div className="flex items-center justify-between gap-3 rounded-lg bg-sand/5 px-3 py-2.5 ring-1 ring-sand/15 transition-colors hover:bg-sand/10">
			<div className="flex min-w-0 items-center gap-2">
				<Icon className="size-3.5 shrink-0 text-orange" />
				<span className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-sand/70">
					{label}
				</span>
			</div>
			<div className="flex min-w-0 items-center gap-2">
				<span
					className={
						"truncate text-[12px] text-sand " + (mono ? "font-mono" : "font-medium")
					}
				>
					{value}
				</span>
				<span className={`size-1.5 shrink-0 rounded-full ${dotTone}`} />
			</div>
		</div>
	);

	if (asLink) {
		return <Link to={asLink}>{content}</Link>;
	}
	return content;
}

function QuickLink({
	to,
	icon: Icon,
	label,
}: {
	to: string;
	icon: typeof Pencil;
	label: string;
}) {
	return (
		<Link
			to={to}
			className="flex items-center justify-between rounded-lg bg-sand px-3 py-2.5 text-[12px] text-ink transition-colors hover:bg-sand-2"
		>
			<span className="flex items-center gap-2">
				<Icon className="size-3.5 text-orange" />
				{label}
			</span>
			<ArrowRight className="size-3.5 text-ink-soft" />
		</Link>
	);
}