import { useEffect, useState } from "react";
import { useContext } from "react";
import { Link } from "@/components/router-link";
import UserContext from "@/lib/userContext";
import {
	ArrowRight,
	Check,
	Home,
	LogOut,
	ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type LogoutState = "signing-out" | "signed-out";

export default function LogoutPage() {
	const [state, setState] = useState<LogoutState>("signing-out");
	const { logout } = useContext(UserContext);

	useEffect(() => {
		logout();
		const t = setTimeout(() => setState("signed-out"), 700);
		return () => clearTimeout(t);
	}, [logout]);

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

			<div className="relative mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5 py-16 lg:px-8">
				<div className="w-full text-center">
					{state === "signing-out" && (
						<>
							<div className="mx-auto grid size-16 place-items-center rounded-full bg-sand ring-1 ring-line">
								<span className="size-5 animate-spin rounded-full border-2 border-line border-t-orange" />
							</div>
							<p className="mt-7 font-mono text-[10px] uppercase tracking-[0.2em] text-orange">
								Signing out
							</p>
							<h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
								Closing your session.
							</h1>
							<p className="mx-auto mt-4 max-w-md leading-7 text-ink-soft">
								One moment while we end your session and clear any cached credentials on
								this device.
							</p>
						</>
					)}

					{state === "signed-out" && (
						<>
							<div className="mx-auto grid size-16 place-items-center rounded-full bg-orange text-white">
								<LogOut className="size-7" />
							</div>

							<p className="mt-7 font-mono text-[10px] uppercase tracking-[0.2em] text-orange">
								Signed out
							</p>
							<h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
								Your session has ended.
							</h1>
							<p className="mx-auto mt-4 max-w-md leading-7 text-ink-soft">
								You've been signed out safely. Any cached credentials on this device have
								been cleared.
							</p>

							<div className="mx-auto mt-8 max-w-md rounded-2xl bg-sand p-5 ring-1 ring-line">
								<div className="flex items-start gap-3 text-left">
									<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange text-white">
										<Check className="size-4" />
									</div>
									<div>
										<p className="text-sm font-semibold text-ink">
											Session closed on this device
										</p>
										<p className="mt-1 text-[12px] leading-5 text-ink-soft">
											The demo identity has been cleared from this browser session. No server session was
											created.
										</p>
									</div>
								</div>

								<div className="mt-4 border-t border-line pt-4 text-left">
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
										What you can do next
									</p>
									<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
										<li className="flex items-start gap-2">
											<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
											Sign back in to continue where you left off.
										</li>
										<li className="flex items-start gap-2">
											<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
											Use session management to preview device controls in the demo.
										</li>
										<li className="flex items-start gap-2">
											<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
											Track cargo without signing in using public tracking.
										</li>
									</ul>
								</div>
							</div>

							<div className="mt-8 flex flex-wrap justify-center gap-3">
								<Link to="/login">
									<Button className="bg-orange text-white hover:bg-orange-deep">
										Sign in again <ArrowRight />
									</Button>
								</Link>
								<Link to="/">
									<Button
										variant="outline"
										className="border-line bg-paper text-ink hover:bg-sand"
									>
										<Home className="mr-1.5 size-4" />
										Return home
									</Button>
								</Link>
							</div>

							<div className="mx-auto mt-8 flex max-w-md items-start gap-2 rounded-xl bg-sand p-4 text-left ring-1 ring-line">
								<ShieldCheck className="mt-0.5 size-4 shrink-0 text-orange" />
								<p className="text-[12px] leading-5 text-ink-soft">
									This prototype does not create or change a real account. You can enter the demo
									workspace again at any time.
								</p>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}