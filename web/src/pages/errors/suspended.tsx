import { Link } from "@/components/router-link";
import { ArrowRight, Lock, Mail, ShieldAlert, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContext, useEffect } from "react";
import { http, type Resp } from "@/lib/httpClient";
import UserContext from "@/lib/userContext";

export default function AccountSuspended() {

    const { logout } = useContext(UserContext);

	useEffect(() => {
		const revokeToken = async () => {
			try {
				const res:any = await http.post("logout/");
				const resp: Resp = res.data;
				if (resp.error === false) logout();
			} catch (error) {
				console.log(error);
			} 
		}
		revokeToken();
	}, [logout]);
	return (
		<main className="relative min-h-screen overflow-hidden bg-paper text-ink">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -right-40 -top-40 size-[620px] rounded-full bg-orange/20 blur-3xl"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -left-40 bottom-0 size-[480px] rounded-full bg-carmine/15 blur-3xl"
			/>

			<div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-10 lg:px-10 lg:py-14">
				<header className="flex items-center justify-between">
					<Link to="/" aria-label="TRINU home" className="shrink-0">
						<img src="/logo.png" alt="TRINU Bonded Terminal" className="h-14 w-14" />
					</Link>
					<Link to="/contact">
						<Button size="sm" variant="outline" className="border-line bg-paper text-ink hover:bg-sand">
							Contact operations <ArrowRight />
						</Button>
					</Link>
				</header>

				<div className="flex flex-1 items-center py-16">
					<div className="grid w-full gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange">
								Account status · Suspended
							</p>

							<h1 className="mt-4 max-w-xl font-display text-5xl font-bold leading-[0.98] text-ink sm:text-6xl lg:text-7xl">
								This account is
								<span className="text-orange"> currently suspended.</span>
							</h1>

							<p className="mt-6 max-w-lg text-base leading-7 text-ink-soft sm:text-lg">
								Access to this account has been temporarily paused. This may be due to
								a security review, an unresolved obligation, or an administrative
								decision. Your cargo records and documents remain intact — suspension
								affects access, not custody.
							</p>

							<div className="mt-9 flex flex-wrap gap-3">
								<Link to="/contact">
									<Button size="lg" className="bg-orange text-white hover:bg-orange-deep">
										Contact operations <ArrowRight />
									</Button>
								</Link>
								<Link to="/">
									<Button
										size="lg"
										variant="outline"
										className="border-line bg-paper text-ink hover:bg-sand"
									>
										Return home
									</Button>
								</Link>
							</div>

							<div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
								<span className="inline-flex items-center gap-2">
									<span className="size-1.5 rounded-full bg-orange" />
									TRINŪ · Abuja Flagship Facility
								</span>
								<span>Ref · ACC-SUS</span>
							</div>
						</div>

						<div className="relative">
							<div className="relative overflow-hidden rounded-2xl bg-slate p-6 text-sand shadow-2xl ring-1 ring-slate sm:p-8">
								<div
									aria-hidden="true"
									className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-orange/25 blur-3xl"
								/>

								<div className="relative">
									<div className="flex items-center gap-2">
										<UserX className="size-4 text-orange" />
										<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange">
											What this means
										</p>
									</div>

									<p className="mt-5 font-display text-2xl font-bold leading-snug text-sand sm:text-3xl">
										Suspension is controlled, recorded, and reversible.
									</p>

									<p className="mt-3 text-sm leading-6 text-sand/75">
										Every account action in TRÏNŪ is logged with actor, reason and
										timestamp. If you believe this suspension is in error, contact
										operations — the team can review and, where appropriate, restore
										access.
									</p>

									<div className="mt-7 grid gap-2">
										{[
											{
												label: "Contact operations",
												to: "/contact",
												detail: "Request a review with your account reference",
												icon: Mail,
											},
											{
												label: "Sign in with another account",
												to: "/login",
												detail: "If you hold more than one TRÏNŪ account",
												icon: Lock,
											},
											{
												label: "Account & access policy",
												to: "/contact",
												detail: "How suspension and reinstatement work",
												icon: ShieldAlert,
											},
										].map(({ label, to, detail, icon: Icon }) => (
											<Link
												key={label}
												to={to}
												className="group flex items-center justify-between rounded-lg bg-sand/5 px-4 py-3 ring-1 ring-sand/15 transition-colors hover:bg-orange hover:ring-orange"
											>
												<div className="flex min-w-0 items-center gap-3">
													<Icon className="size-4 shrink-0 text-orange transition-colors group-hover:text-sand" />
													<div className="min-w-0">
														<p className="text-sm font-semibold text-sand">{label}</p>
														<p className="mt-0.5 text-[11px] text-sand/60">{detail}</p>
													</div>
												</div>
												<ArrowRight className="size-4 shrink-0 text-sand/60 transition-transform group-hover:translate-x-0.5 group-hover:text-sand" />
											</Link>
										))}
									</div>
								</div>
							</div>

							<div className="mt-4 grid grid-cols-3 gap-3">
								{[
									["Suspended", "Status"],
									["Logged", "By policy"],
									["Intact", "Your records"],
								].map(([value, label]) => (
									<div key={label} className="rounded-xl bg-sand p-3 ring-1 ring-line">
										<p className="font-display text-sm font-bold text-ink">{value}</p>
										<p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
											{label}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				<footer className="border-t border-line pt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<span>TRINŪ Bonded Warehouse · Abuja, Nigeria</span>
						<span>Customs support and coordination — not a Customs authority</span>
					</div>
				</footer>
			</div>
		</main>
	);
}