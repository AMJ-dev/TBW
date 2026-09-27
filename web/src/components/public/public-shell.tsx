import { useState, type ReactNode } from "react";
import { Link } from "@/components/router-link";
import {
	ArrowRight,
	ChevronDown,
	Menu,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
	["Services", "/services"],
	["Track cargo", "/tracking"],
	["Compliance", "/compliance"],
	["About", "/about"],
	["News & notices", "/news"],
	["FAQs", "/faq"],
] as const;

const audienceLinks = [
	["Importers & traders", "/for/importers"],
	["Forwarders & agents", "/for/agents"],
	["Shipping lines", "/for/shipping-lines"],
	["Transporters", "/for/transporters"],
] as const;

const footerLinks = {
	Explore: [
		["Services", "/services"],
		["Track cargo", "/tracking"],
		["Verify document", "/verify"],
		["Request a quote", "/quote"],
		["Compliance", "/compliance"],
	],
	Audiences: [
		["Importers & traders", "/for/importers"],
		["Forwarders & agents", "/for/agents"],
		["Shipping lines", "/for/shipping-lines"],
		["Transporters", "/for/transporters"],
	],
	Company: [
		["About", "/about"],
		["Careers", "/careers"],
		["Notices", "/news"],
		["Contact", "/contact"],
		["FAQs", "/faq"],
	],
	Account: [
		["Sign in", "/login"],
		["Register", "/register"],
		["Privacy notice", "/privacy"],
		["Terms of use", "/terms"],
	],
} as const;

const socialLinks = [
	{
		label: "X",
		href: "https://x.com/TrinuBonded",
		icon: (
			<svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
				<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
			</svg>
		),
	},
	{
		label: "Instagram",
		href: "https://www.instagram.com/trinubonded/",
		icon: (
			<svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
				<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
			</svg>
		),
	},
	{
		label: "TikTok",
		href: "https://www.tiktok.com/@trinubonded",
		icon: (
			<svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
				<path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.14 20.6a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.18-.6z" />
			</svg>
		),
	},
] as const;

export function PublicBrand({ compact = false }: { compact?: boolean }) {
	return (
		<div className="flex items-center gap-3">
			{!compact && (
				<img src="/logo.png" alt="TRÏNŪ Bonded Terminal" className="w-14 h-14" />
			)}
		</div>
	);
}

export function PublicHeader() {
	const [open, setOpen] = useState(false);
	const [audienceOpen, setAudienceOpen] = useState(false);

	return (
		<header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
			<div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-3.5 lg:px-8">
				<Link to="/" aria-label="TRÏNŪ home" onClick={() => setOpen(false)}>
					<PublicBrand />
				</Link>

				<nav
					className="hidden items-center gap-1 text-[13px] font-medium lg:flex"
					aria-label="Main navigation"
				>
					<Link
						to="/"
						activeOptions={{ exact: true }}
						className="rounded-md px-3 py-2 text-ink-soft transition-colors hover:bg-sand hover:text-ink"
						activeProps={{
							className: "bg-orange font-semibold text-white hover:bg-orange-deep hover:text-white",
						}}
					>
						Home
					</Link>

					{navigation.map(([label, to]) => (
						<Link
							key={to}
							to={to}
							className="rounded-md px-3 py-2 text-ink-soft transition-colors hover:bg-sand hover:text-ink"
							activeProps={{
								className: "bg-orange font-semibold text-white hover:bg-orange-deep hover:text-white",
							}}
						>
							{label}
						</Link>
					))}

					<div
						className="relative"
						onMouseEnter={() => setAudienceOpen(true)}
						onMouseLeave={() => setAudienceOpen(false)}
					>
						<button
							type="button"
							onClick={() => setAudienceOpen(true)}
							onFocus={() => setAudienceOpen(true)}
							aria-haspopup="menu"
							aria-expanded={audienceOpen}
							className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-ink-soft transition-colors hover:bg-sand hover:text-ink"
						>
							For you
							<ChevronDown
								className={cn(
									"size-3.5 transition-transform",
									audienceOpen && "rotate-180"
								)}
							/>
						</button>
						{audienceOpen && (
							<div className="absolute left-0 top-full pt-2">
								<div className="w-64 overflow-hidden rounded-xl bg-paper shadow-2xl ring-1 ring-line">
									<p className="border-b border-line bg-sand px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-brown">
										Built for the people around cargo
									</p>
									<ul className="p-2">
										{audienceLinks.map(([label, to]) => (
											<li key={to}>
												<Link
													to={to}
													className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] text-ink-soft transition-colors hover:bg-sand hover:text-ink"
													activeProps={{
														className:
															"flex items-center justify-between rounded-lg px-3 py-2 text-[13px] bg-orange text-white hover:bg-orange-deep hover:text-white",
													}}
												>
													{label}
													<ArrowRight className="size-3.5" />
												</Link>
											</li>
										))}
									</ul>
								</div>
							</div>
						)}
					</div>
				</nav>

				<div className="ml-auto flex items-center gap-2">
					<Link
						to="/login"
						className="hidden text-[12px] font-medium text-ink-soft transition-colors hover:text-carmine sm:inline-flex"
					>
						Sign in
					</Link>
					<Link to="/tracking">
						<Button
							size="sm"
							className="bg-orange text-white hover:bg-orange-deep"
						>
							Track cargo <ArrowRight />
						</Button>
					</Link>
					<Button
						variant="ghost"
						size="icon"
						className="min-h-10 min-w-10 text-ink-soft lg:hidden"
						onClick={() => setOpen((value) => !value)}
						aria-label={open ? "Close navigation" : "Open navigation"}
						aria-expanded={open}
					>
						{open ? <X /> : <Menu />}
					</Button>
				</div>
			</div>

			{open && (
				<nav
					className="border-t border-line bg-paper px-5 py-2 lg:hidden"
					aria-label="Mobile navigation"
				>
					<Link
						to="/"
						onClick={() => setOpen(false)}
						activeOptions={{ exact: true }}
						className="flex items-center justify-between border-b border-line py-3 text-sm text-ink"
						activeProps={{
							className:
								"flex items-center justify-between border-b border-line py-3 text-sm font-semibold text-orange",
						}}
					>
						Home
					</Link>

					{navigation.map(([label, to]) => (
						<Link
							key={to}
							to={to}
							onClick={() => setOpen(false)}
							className="flex items-center justify-between border-b border-line py-3 text-sm text-ink last:border-0"
							activeProps={{
								className:
									"flex items-center justify-between border-b border-line py-3 text-sm font-semibold text-orange last:border-0",
							}}
						>
							{label}
						</Link>
					))}

					<div className="border-b border-line py-3">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brown">
							For you
						</p>
						<ul className="mt-2 space-y-1">
							{audienceLinks.map(([label, to]) => (
								<li key={to}>
									<Link
										to={to}
										onClick={() => setOpen(false)}
										className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-ink-soft"
										activeProps={{
											className:
												"flex items-center justify-between rounded-md px-2 py-2 text-sm font-semibold text-orange bg-sand",
										}}
									>
										{label}
										<ArrowRight className="size-3.5" />
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div className="border-b border-line py-3">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brown">
							Follow TRÏNŪ
						</p>
						<div className="mt-2 flex items-center gap-2">
							{socialLinks.map(({ label, href, icon }) => (
								<a
									key={label}
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={`TRÏNŪ on ${label}`}
									className="grid size-9 place-items-center rounded-md bg-sand text-ink-soft transition-colors hover:bg-orange hover:text-white"
								>
									{icon}
								</a>
							))}
						</div>
					</div>

					<div className="mt-3 grid gap-2 pb-3">
						<Link to="/login" onClick={() => setOpen(false)}>
							<Button
								variant="outline"
								className="w-full border-line bg-paper text-ink"
							>
								Sign in
							</Button>
						</Link>
						<Link to="/register" onClick={() => setOpen(false)}>
							<Button className="w-full bg-orange text-white hover:bg-orange-deep">
								Register
							</Button>
						</Link>
					</div>
				</nav>
			)}
		</header>
	);
}

export function PublicFooter() {
	return (
		<footer className="border-t border-slate bg-slate text-sand">
			<div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
				<div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
					<div>
						<PublicBrand compact />
						<p className="mt-4 max-w-xs text-sm leading-6 text-sand/70">
							TRÏNŪ brings the port closer — bonded terminal operations in Abuja,
							digitally connected.
						</p>

						<div className="mt-6 flex items-center gap-2">
							{socialLinks.map(({ label, href, icon }) => (
								<a
									key={label}
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={`TRÏNŪ on ${label}`}
									className="grid size-9 place-items-center rounded-md bg-sand/10 text-sand/70 ring-1 ring-sand/15 transition-colors hover:bg-orange hover:text-white hover:ring-orange"
								>
									{icon}
								</a>
							))}
						</div>
					</div>

					{Object.entries(footerLinks).map(([title, links]) => (
						<div key={title}>
							<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange">
								{title}
							</p>
							<ul className="mt-4 space-y-2.5 text-sm">
								{links.map(([label, to]) => (
									<li key={to}>
										<Link
											to={to}
											className="text-sand/85 transition-colors hover:text-orange"
											activeProps={{
												className: "font-semibold text-orange hover:text-orange",
											}}
										>
											{label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="mt-12 flex flex-col gap-3 border-t border-sand/15 pt-6 text-[11px] text-sand/60 sm:flex-row sm:items-center sm:justify-between">
					<p>Abuja, Nigeria · Flagship Facility</p>
					<p>Customs support and coordination — not a Customs authority</p>
				</div>
			</div>
		</footer>
	);
}

export function PublicFrame({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-paper text-ink">
			<PublicHeader />
			{children}
			<PublicFooter />
		</div>
	);
}

export function PublicKicker({ children }: { children: ReactNode }) {
	return (
		<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange">
			{children}
		</p>
	);
}

export function PublicStatus({
	label,
	tone = "neutral",
}: {
	label: string;
	tone?: "success" | "info" | "warning" | "critical" | "neutral";
}) {
	const tones = {
		success: "bg-orange/15 text-orange ring-orange/30",
		info: "bg-slate/10 text-slate ring-slate/25",
		warning: "bg-carmine/15 text-carmine ring-carmine/30",
		critical: "bg-carmine/20 text-brown ring-carmine/40",
		neutral: "bg-ink/5 text-ink-soft ring-line",
	};
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ring-1",
				tones[tone]
			)}
		>
			<span className="size-1.5 rounded-full bg-current" />
			{label}
		</span>
	);
}