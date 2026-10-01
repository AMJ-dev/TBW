import { useEffect, useState, useContext, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "@/components/router-link";
import { toast } from "sonner";
import {
	Activity,
	AlertTriangle,
	ArrowRight,
	BarChart3,
	Bell,
	Boxes,
	ChevronLeft,
	ChevronRight,
	Check,
	ClipboardCheck,
	Clock3,
	Command,
	Container,
	FileCheck2,
	FileText,
	FileSpreadsheet,
	Grid2X2,
	ListChecks,
	HelpCircle,
	LayoutDashboard,
	LogOut,
	Menu,
	PackageCheck,
	Package,
	QrCode,
	Search,
	Settings,
	ShieldCheck,
	Truck,
	User,
	UsersRound,
	Warehouse,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import UserContext from "@/lib/userContext";
import { cargoRecords, notifications } from "@/data/mock";
import { resolveSrc } from "@/lib/functions";

export function TrinuMark({ compact = false }: { compact?: boolean }) {
	return (
		<div className="flex items-center gap-3">
			{!compact && (
				<div className="leading-tight">
					<img src="/logo.png" alt="TRÏNŪ Bonded Terminal" className="h-18 w-18" />
				</div>
			)}
		</div>
	);
}

const toneClasses: Record<string, string> = {
	success: "bg-teal/10 text-teal-deep ring-teal/25",
	info: "bg-sky/10 text-sky-deep ring-sky/25",
	warning: "bg-orange/10 text-orange-deep ring-orange/25",
	critical: "bg-coral/10 text-coral ring-coral/25",
	neutral: "bg-ink/5 text-ink-soft ring-line",
};

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: string }) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ring-1",
				toneClasses[tone] ?? toneClasses["neutral"]
			)}
		>
			<span className="size-1.5 rounded-full bg-current" />
			{label}
		</span>
	);
}

export function statusTone(status: string) {
	if (/held|overdue|referred|reject|critical/i.test(status)) return "critical";
	if (/stored|paid|verified|complete|authorised|admitted|received|success/i.test(status)) return "success";
	if (/documentation|review|loading|expected|issued|warning/i.test(status)) return "warning";
	return "info";
}

export function Metric({
	label,
	value,
	detail,
	subtext,
	tone = "neutral",
	icon: Icon = Activity,
}: {
	label: string;
	value: string;
	detail?: string;
	subtext?: string;
	tone?: string;
	icon?: typeof Activity;
}) {
	const info = detail ?? subtext;
	return (
		<div className="rounded-xl bg-paper p-4 ring-1 ring-line transition-transform hover:-translate-y-0.5">
			<div className="flex items-center justify-between gap-2">
				<span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">{label}</span>
				<Icon
					className={cn(
						"size-4",
						tone === "critical"
							? "text-coral"
							: tone === "warning"
							? "text-orange"
							: tone === "success"
							? "text-teal"
							: "text-ink-soft"
					)}
				/>
			</div>
			<div className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">{value}</div>
			{info && (
				<div
					className={cn(
						"mt-1 text-[11px]",
						tone === "critical" ? "text-coral" : tone === "warning" ? "text-orange-deep" : "text-ink-soft"
					)}
				>
					{info}
				</div>
			)}
		</div>
	);
}

export function Avatar({
	pics,
	fullName,
	size = 32,
	className,
}: {
	pics?: string | null | undefined;
	fullName?: string | undefined;
	size?: number | undefined;
	className?: string | undefined;
}) {
	const trimmed = (pics ?? "").trim();
	const isPlaceholder =
		!trimmed ||
		trimmed.toLowerCase() === "avatar.png" ||
		trimmed.toLowerCase().endsWith("/avatar.png");

	const initials = (() => {
		const parts = fullName?.trim().split(/\s+/).filter(Boolean) || [];
		if (parts.length >= 2) {
			return ((parts[0]?.charAt(0) ?? "") + (parts[1]?.charAt(0) ?? "")).toUpperCase();
		}
		return (parts[0]?.slice(0, 2) ?? "").toUpperCase();
	})();

	if (!isPlaceholder) {
		return (
			<img
				src={resolveSrc(trimmed)}
				alt={fullName ?? "Profile"}
				className={cn("shrink-0 rounded-full object-cover", className)}
				style={{ width: size, height: size }}
			/>
		);
	}

	return (
		<div
			className={cn(
				"grid shrink-0 place-items-center rounded-full bg-ink font-display font-semibold text-sand",
				className
			)}
			style={{ width: size, height: size, fontSize: size * 0.36 }}
		>
			{initials || "—"}
		</div>
	);
}

const sections = [
	{
		title: "Administration",
		items: [
			{ label: "Admin overview", to: "/admin", icon: LayoutDashboard, exact: true, permission: "administration.view" },
			{ label: "Organizations", to: "/admin/organizations", icon: Boxes, permission: "administration.organisations" },
			{ label: "Users", to: "/admin/users", icon: UsersRound, permission: "administration.users" },
			{ label: "Roles & permissions", to: "/admin/roles", icon: ShieldCheck, permission: "administration.roles" },
			{ label: "Configuration", to: "/admin/configuration", icon: Settings, permission: "administration.configuration" },
			{ label: "Audit Log", to: "/admin/audit", icon: Activity, permission: "administration.audit" },
		],
		permission_key: ["system_admin"],
	},
	{
		title: "Operations",
		items: [
			{ label: "Operations dashboard", to: "/operations/dashboard", icon: LayoutDashboard, permission: "operations.view" },
			{ label: "Manifest intake", to: "/operations/manifest", icon: FileSpreadsheet, permission: "operations.cargo" },
			{ label: "Receiving", to: "/operations/receiving", icon: PackageCheck, permission: "operations.cargo" },
			{ label: "Yard", to: "/operations/yard", icon: Grid2X2, permission: "warehouse.position" },
			{ label: "Warehouse", to: "/operations/warehouse", icon: Warehouse, permission: "warehouse.view" },
			{ label: "Examination", to: "/operations/examination", icon: ClipboardCheck, permission: "operations.examination" },
			{ label: "Seal events", to: "/operations/seals", icon: ShieldCheck, permission: "operations.manage" },
			{ label: "Inventory", to: "/operations/inventory", icon: Boxes, permission: "warehouse.inventory" },
			{ label: "Stuffing work orders", to: "/operations/stuffing", icon: PackageCheck, permission: "operations.manage" },
			{ label: "Cycle counts", to: "/operations/cycle-count", icon: ListChecks, permission: "warehouse.inventory" },
			{ label: "Value-added services", to: "/operations/value-added", icon: Settings, permission: "operations.manage" },
			{ label: "Overrides", to: "/operations/overrides", icon: ShieldCheck, permission: "operations.manage" },
		],
		permission_key: ["organisation_owner", "management", "terminal_operations", "warehouse_yard_officer"],
	},
	{
		title: "Cargo",
		items: [
			{ label: "Cargo records", to: "/portal/cargo", icon: Boxes, permission: "portal.cargo" },
			{ label: "Sample consignment", to: "/portal/cargo/2481", icon: PackageCheck, permission: "portal.cargo" },
			{ label: "Sample container", to: "/portal/containers/c-1", icon: Container, permission: "portal.cargo" },
			{ label: "Sample package", to: "/portal/packages/p-1", icon: Package, permission: "portal.cargo" },
			{ label: "Tracking", to: "/tracking", icon: Search, permission: "portal.cargo" },
			{ label: "Holds & Exceptions", to: "/operations/holds", icon: AlertTriangle, permission: "operations.holds" },
		],
		permission_key: [
			"organisation_owner", "management", "terminal_operations", "gate_officer",
			"warehouse_yard_officer", "documentation_officer", "customer_service_sales",
			"compliance_customs_liaison", "regulator_auditor",
		],
	},
	{
		title: "Stakeholder portal",
		items: [
			{ label: "Portal dashboard", to: "/portal/dashboard", icon: LayoutDashboard, permission: "portal.view" },
			{ label: "Bookings", to: "/portal/bookings", icon: Clock3, permission: "portal.requests" },
			{ label: "Documents", to: "/portal/documents", icon: FileText, permission: "portal.documents" },
			{ label: "Upload documents", to: "/portal/documents/upload", icon: FileCheck2, permission: "documents.manage" },
			{ label: "Invoices", to: "/portal/invoices", icon: FileSpreadsheet, permission: "portal.financials" },
			{ label: "Payments", to: "/portal/payments", icon: ClipboardCheck, permission: "portal.financials" },
			{ label: "Statement of account", to: "/portal/statement", icon: FileText, permission: "portal.financials" },
			{ label: "KYC & signatories", to: "/portal/kyc", icon: ShieldCheck, permission: "portal.requests" },
			{ label: "Delegated access", to: "/portal/delegation", icon: UsersRound, permission: "portal.requests" },
			{ label: "Portal users", to: "/portal/users", icon: UsersRound, permission: "administration.users" },
			{ label: "Session management", to: "/session-management", icon: ShieldCheck, permission: "portal.view" },
		],
		permission_key: [
			"organisation_owner", "management", "finance", "terminal_operations",
			"gate_officer", "warehouse_yard_officer", "documentation_officer",
			"customer_service_sales", "compliance_customs_liaison", "regulator_auditor", "portal_user",
		],
	},
	{
		title: "Gate",
		items: [
			{ label: "Gate dashboard", to: "/gate/dashboard", icon: LayoutDashboard, permission: "gate.view" },
			{ label: "Appointments", to: "/gate/appointments", icon: Clock3, permission: "gate.bookings" },
			{ label: "Gate Passes", to: "/gate/passes", icon: QrCode, permission: "gate.bookings" },
			{ label: "Gate-in console", to: "/gate/in", icon: Truck, permission: "gate.admit" },
			{ label: "Gate-out console", to: "/gate/out", icon: Truck, permission: "gate.gate_out" },
			{ label: "Vehicle registry", to: "/gate/vehicles", icon: UsersRound, permission: "gate.bookings" },
		],
		permission_key: ["organisation_owner", "management", "gate_officer"],
	},
	{
		title: "Finance",
		items: [
			{ label: "Finance dashboard", to: "/finance/dashboard", icon: BarChart3, permission: "finance.view" },
			{ label: "Invoice ledger", to: "/finance/invoices", icon: FileCheck2, permission: "finance.invoices" },
			{ label: "Payments & receipts", to: "/finance/payments", icon: ClipboardCheck, permission: "finance.payments" },
			{ label: "Tariffs", to: "/finance/tariffs", icon: FileSpreadsheet, permission: "finance.tariffs" },
			{ label: "Credit application", to: "/finance/credit/apply", icon: FileText, permission: "finance.view" },
			{ label: "Credit limits", to: "/finance/credit/limits", icon: ShieldCheck, permission: "finance.view" },
			{ label: "Collections", to: "/finance/collections", icon: Clock3, permission: "finance.collections" },
			{ label: "Customer statements", to: "/finance/statement/atlantic-trade", icon: FileText, permission: "finance.view" },
			{ label: "Approvals", to: "/finance/approvals", icon: Check, permission: "finance.adjustments" },
			{ label: "Tax rules", to: "/finance/tax", icon: FileSpreadsheet, permission: "finance.view" },
			{ label: "Reconciliation", to: "/finance/reconciliation", icon: ClipboardCheck, permission: "finance.reconciliation" },
		],
		permission_key: ["organisation_owner", "management", "finance"],
	},
	{
		title: "Reports",
		items: [
			{ label: "Report catalog", to: "/reports", icon: BarChart3, exact: true, permission: "reports.view" },
			{ label: "Operations report", to: "/reports/operations", icon: Truck, permission: "reports.view" },
			{ label: "Financial report", to: "/reports/financial", icon: FileSpreadsheet, permission: "reports.view" },
			{ label: "Compliance report", to: "/reports/compliance", icon: ShieldCheck, permission: "reports.view" },
		],
		permission_key: [
			"organisation_owner", "management", "finance", "terminal_operations",
			"gate_officer", "warehouse_yard_officer", "documentation_officer",
			"customer_service_sales", "compliance_customs_liaison", "regulator_auditor",
		],
	},
];

function RejectedPanel() {
	return (
		<div className="space-y-3 px-2 py-6">
			<div className="flex items-center gap-2 rounded-md bg-coral/10 px-3 py-2 ring-1 ring-coral/25">
				<AlertTriangle className="size-4 shrink-0 text-coral" />
				<p className="font-display text-[13px] font-semibold text-coral">
					Account rejected
				</p>
			</div>
			<p className="text-[12px] leading-5 text-ink-soft">
				Your registration was not approved. This usually means the details
				submitted during onboarding could not be verified, or a required
				document was missing or expired.
			</p>
			<div className="rounded-md bg-sand-2 px-3 py-2.5 ring-1 ring-line">
				<p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-soft">
					Next step
				</p>
				<p className="mt-1 text-[12px] text-ink">
					Contact the terminal operations team to correct your details and
					request a review.
				</p>
			</div>
			<a
				href="mailto:operations@trinu.ng"
				className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-orange-deep hover:underline"
			>
				Contact operations <ArrowRight className="size-3.5" />
			</a>
		</div>
	);
}

function PendingPanel() {
	return (
		<div className="space-y-3 px-2 py-6">
			<div className="flex items-center gap-2 rounded-md bg-orange/10 px-3 py-2 ring-1 ring-orange/25">
				<Clock3 className="size-4 shrink-0 text-orange-deep" />
				<p className="font-display text-[13px] font-semibold text-orange-deep">
					Approval in progress
				</p>
			</div>
			<p className="text-[12px] leading-5 text-ink-soft">
				Your account is being reviewed. Access to portal and operations
				modules will unlock once your organisation and documents are
				verified.
			</p>
			<div className="rounded-md bg-sand-2 px-3 py-2.5 ring-1 ring-line">
				<p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-soft">
					Need it faster?
				</p>
				<p className="mt-1 text-[12px] text-ink">
					Email your onboarding documents to the operations desk so we can
					complete verification.
				</p>
			</div>
			<a
				href="mailto:operations@trinu.ng"
				className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-orange-deep hover:underline"
			>
				Contact operations <ArrowRight className="size-3.5" />
			</a>
		</div>
	);
}

export function AppShell({ children, title, eyebrow }: { children: ReactNode; title: string; eyebrow?: string }) {
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const { privileges, permissions, role, my_details } = useContext(UserContext);
	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [notificationsOpen, setNotificationsOpen] = useState(false);
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const [loggingOut, setLoggingOut] = useState(false);

	const matchingCargo = cargoRecords.filter((cargo) =>
		[cargo.reference, cargo.container, cargo.billOfLading, cargo.cargo, cargo.consignee]
			.some((value) => value.toLowerCase().includes(searchQuery.trim().toLowerCase()))
	);

	const isActive = (to: string, exact = false) => exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

	const handleLogout = async () => {
		if (loggingOut) return;
		setLoggingOut(true);
		try {
			sessionStorage.removeItem("jwt");
			sessionStorage.removeItem("remember");
			sessionStorage.removeItem("email");
			setUserMenuOpen(false);
			setMobileOpen(false);
			toast.success("Signed out.");
			navigate("/logout", { replace: true });
		} catch {
			toast.error("Could not complete sign-out. Try again.");
		} finally {
			setLoggingOut(false);
		}
	};

	const goToProfile = () => {
		setUserMenuOpen(false);
		setMobileOpen(false);
		navigate("/my-profile");
	};

	useEffect(() => {
		console.log(my_details?.account_status);
		if (!userMenuOpen) return;
		const close = () => setUserMenuOpen(false);
		window.addEventListener("click", close);
		return () => window.removeEventListener("click", close);
	}, [userMenuOpen]);

	useEffect(() => {
		if (my_details?.account_status === "rejected") {
			toast.error("Your account has been rejected. Contact operations.");
		}
		if (my_details?.account_status === "active") {
			toast.success("Account approved. Full access enabled.");
		}
	}, [my_details?.account_status]);

	return (
		<div className="min-h-screen bg-sand font-sans text-ink">
			<div className="relative flex min-h-screen">
				{mobileOpen && (
					<button
						className="fixed inset-0 z-40 bg-ink/20 lg:hidden"
						onClick={() => setMobileOpen(false)}
						aria-label="Close navigation"
					/>
				)}
				<aside
					className={cn(
						"fixed inset-y-0 left-0 z-50 flex w-[248px] shrink-0 flex-col border-r border-line bg-paper/95 shadow-2xl backdrop-blur transition-[transform,width] duration-200 lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:shadow-none",
						collapsed ? "lg:w-[76px]" : "",
						mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
					)}
				>
					<div
						className={cn(
							"flex items-center justify-between px-5 pb-5 pt-6",
							collapsed ? "lg:justify-center lg:px-3" : ""
						)}
					>
						<Link to={"/operations"} onClick={() => setMobileOpen(false)}>
							<TrinuMark compact={collapsed} />
						</Link>
						<Button
							variant="ghost"
							size="icon"
							className="min-h-10 min-w-10 text-ink-soft lg:hidden"
							onClick={() => setMobileOpen(false)}
							aria-label="Close navigation"
						>
							<X />
						</Button>
					</div>
					{!collapsed && (
						<div className="mx-4 mb-4 rounded-lg bg-sand-2 px-3 py-2.5 ring-1 ring-line">
							<p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft">
								Sector
							</p>
							<p className="mt-0.5 font-display text-[13px] font-semibold text-ink">
								Abuja · Flagship Facility
							</p>
						</div>
					)}
					<nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
						{my_details?.account_status === "active" ? (
							sections.map((section) => (
								role && section.permission_key.includes(role.key) && (
									<div key={section.title}>
										<p
											className={cn(
												"px-2 pb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft/70",
												collapsed ? "lg:hidden" : ""
											)}
										>
											{section.title}
										</p>
										{section.items.map((item) => {
											const { label, to, icon: Icon } = item;
											const active = isActive(to, "exact" in item && item.exact);
											return (
												<Link
													key={to}
													to={to}
													onClick={() => setMobileOpen(false)}
													className={cn(
														"group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] transition-colors",
														active
															? "bg-ink text-sand shadow-sm"
															: "text-ink-soft hover:bg-sand-2 hover:text-ink",
														collapsed ? "lg:justify-center lg:px-0" : ""
													)}
													title={collapsed ? label : undefined}
												>
													<Icon className="size-4 shrink-0" />
													<span className={collapsed ? "lg:hidden" : ""}>{label}</span>
												</Link>
											);
										})}
									</div>
								)
							))
						) : my_details?.account_status === "rejected" ? (
							<RejectedPanel />
						) : (
							<PendingPanel />
						)}
					</nav>

					<div className="relative border-t border-line p-4">
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setUserMenuOpen((v) => !v);
							}}
							aria-haspopup="menu"
							aria-expanded={userMenuOpen}
							className={cn(
								"flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sand-2",
								collapsed ? "lg:justify-center lg:px-0" : ""
							)}
						>
							<Avatar
								pics={my_details?.pics}
								fullName={my_details?.full_name}
								size={32}
							/>
							<div className={cn("min-w-0 leading-tight", collapsed ? "lg:hidden" : "")}>
								<p className="truncate text-[12px] font-semibold text-ink">
									{my_details?.full_name ?? "Unknown user"}
								</p>
								<p className="truncate font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
									{role?.name ?? "—"}
								</p>
							</div>
							{!collapsed && (
								<ChevronRight
									className={cn(
										"ml-auto size-3.5 shrink-0 text-ink-soft transition-transform",
										userMenuOpen && "rotate-90"
									)}
								/>
							)}
						</button>

						{userMenuOpen && (
							<div
								role="menu"
								onClick={(e) => e.stopPropagation()}
								className={cn(
									"absolute bottom-[calc(100%-8px)] z-40 w-[220px] overflow-hidden rounded-lg bg-paper shadow-2xl ring-1 ring-line",
									collapsed ? "left-[72px] lg:left-[68px]" : "left-4"
								)}
							>
								<div className="border-b border-line px-3 py-2.5">
									<p className="truncate text-[12px] font-semibold text-ink">
										{my_details?.full_name ?? "Unknown user"}
									</p>
									<p className="truncate font-mono text-[10px] text-ink-soft">
										{my_details?.email ?? ""}
									</p>
								</div>

								<button
									type="button"
									role="menuitem"
									onClick={goToProfile}
									className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[12px] text-ink-soft transition-colors hover:bg-sand-2 hover:text-ink"
								>
									<User className="size-3.5" />
									View profile
								</button>

								<Link
									to="/change-password"
									onClick={() => setUserMenuOpen(false)}
									className="flex items-center gap-2 px-3 py-2.5 text-[12px] text-ink-soft transition-colors hover:bg-sand-2 hover:text-ink"
								>
									<Settings className="size-3.5" />
									Change password
								</Link>

								<Link
									to="/session-management"
									onClick={() => setUserMenuOpen(false)}
									className="flex items-center gap-2 px-3 py-2.5 text-[12px] text-ink-soft transition-colors hover:bg-sand-2 hover:text-ink"
								>
									<ShieldCheck className="size-3.5" />
									Account security
								</Link>

								<Link
									to="/faq"
									onClick={() => setUserMenuOpen(false)}
									className="flex items-center gap-2 px-3 py-2.5 text-[12px] text-ink-soft transition-colors hover:bg-sand-2 hover:text-ink"
								>
									<HelpCircle className="size-3.5" />
									Help & FAQs
								</Link>

								<button
									type="button"
									role="menuitem"
									onClick={handleLogout}
									disabled={loggingOut}
									className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-left text-[12px] font-semibold text-carmine transition-colors hover:bg-carmine/10 disabled:opacity-60"
								>
									<LogOut className="size-3.5" />
									{loggingOut ? "Signing out…" : "Sign out"}
								</button>
							</div>
						)}
					</div>
				</aside>

				<div className="min-w-0 flex-1">
					<header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-sand/85 px-4 py-3 backdrop-blur-md sm:px-6">
						<Button
							variant="ghost"
							size="icon"
							className="min-h-10 min-w-10 lg:hidden"
							onClick={() => setMobileOpen(true)}
							aria-label="Open navigation"
						>
							<Menu />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="hidden min-h-10 min-w-10 text-ink-soft lg:inline-flex"
							onClick={() => setCollapsed((value) => !value)}
							aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
						>
							{collapsed ? <ChevronRight /> : <ChevronLeft />}
						</Button>
						<div className="flex min-w-0 items-baseline gap-2">
							<h1 className="truncate font-display text-lg font-bold tracking-tight text-ink">
								{title}
							</h1>
							{eyebrow && (
								<span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft sm:inline">
									{eyebrow}
								</span>
							)}
						</div>
						<div className="ml-auto flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								className="hidden border-line bg-paper text-ink-soft sm:inline-flex"
								onClick={() => setSearchOpen(true)}
							>
								<Search /> <span className="hidden md:inline">Search</span>
								<span className="rounded bg-sand-2 px-1.5 py-0.5 font-mono text-[9px]">⌘K</span>
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="relative min-h-10 min-w-10 text-ink-soft"
								aria-label="Notifications"
								onClick={() => setNotificationsOpen((value) => !value)}
								aria-expanded={notificationsOpen}
							>
								<Bell />
								<span className="absolute right-2 top-2 size-1.5 rounded-full bg-coral" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="hidden min-h-10 min-w-10 text-ink-soft sm:inline-flex"
								onClick={() => navigate("/faq")}
								title="Open help and FAQs"
								aria-label="Help"
							>
								<HelpCircle />
							</Button>
							<button
								type="button"
								onClick={goToProfile}
								title="View profile"
								aria-label="View profile"
								className="ml-1 rounded-full ring-2 ring-transparent transition-all hover:ring-orange/40"
							>
								<Avatar
									pics={my_details?.pics}
									fullName={my_details?.full_name}
									size={36}
								/>
							</button>
							<Button
								variant="ghost"
								size="icon"
								className="min-h-10 min-w-10 text-ink-soft hover:text-carmine"
								onClick={handleLogout}
								disabled={loggingOut}
								title="Sign out"
								aria-label="Sign out"
							>
								<LogOut />
							</Button>
						</div>
					</header>

					{notificationsOpen && (
						<div className="fixed right-4 top-[68px] z-50 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-xl bg-paper shadow-2xl ring-1 ring-line sm:right-6">
							<div className="flex items-center justify-between border-b border-line px-4 py-3">
								<div>
									<p className="font-display text-sm font-bold text-ink">Notifications</p>
									<p className="mt-0.5 text-[11px] text-ink-soft">Local activity</p>
								</div>
								<Button variant="ghost" size="icon" className="min-h-9 min-w-9" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications">
									<X className="size-4" />
								</Button>
							</div>
							<div className="max-h-[60vh] overflow-y-auto px-4">
								{notifications.map((item) => {
									const destination =
										item.category === "Documents" ? "/portal/documents" :
										item.category === "Examination" ? "/operations/examination" :
										item.category === "Holds" ? "/operations/holds" :
										"/gate/passes";
									return (
										<Link
											key={item.title}
											to={destination}
											onClick={() => setNotificationsOpen(false)}
											className="block border-b border-line py-3 last:border-0 hover:bg-sand/60"
										>
											<div className="flex items-start justify-between gap-3">
												<p className="text-sm font-semibold text-ink">{item.title}</p>
												<span className="font-mono text-[9px] uppercase text-ink-soft">{item.time}</span>
											</div>
											<p className="mt-1 text-[12px] leading-5 text-ink-soft">{item.detail}</p>
										</Link>
									);
								})}
							</div>
						</div>
					)}
					<main className="space-y-5 p-4 sm:p-6">{children}</main>
				</div>
			</div>
			{searchOpen && (
				<div
					className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/25 px-4 pt-[12vh]"
					onMouseDown={(event) => {
						if (event.currentTarget === event.target) setSearchOpen(false);
					}}
				>
					<div className="w-full max-w-xl overflow-hidden rounded-xl bg-paper shadow-2xl ring-1 ring-line">
						<div className="flex items-center gap-3 border-b border-line px-4 py-4">
							<Command className="size-5 text-orange" />
							<Input
								autoFocus
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.target.value)}
								placeholder="Search cargo, containers, organizations, invoices..."
								className="border-0 bg-transparent p-0 text-ink shadow-none focus-visible:ring-0"
							/>
							<Button
								variant="ghost"
								size="icon"
								className="min-h-10 min-w-10"
								onClick={() => setSearchOpen(false)}
								aria-label="Close search"
							>
								<X />
							</Button>
						</div>
						<div className="p-3">
							<p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
								Suggested records
							</p>
							{matchingCargo.slice(0, 5).map((cargo) => (
								<Link
									key={cargo.id}
									to={`/portal/cargo/${cargo.id}`}
									onClick={() => setSearchOpen(false)}
									className="flex items-center justify-between rounded-md px-3 py-3 hover:bg-sand-2"
								>
									<div>
										<p className="font-mono text-[12px] font-medium text-ink">
											{cargo.reference}
										</p>
										<p className="text-[12px] text-ink-soft">
											{cargo.container} · {cargo.cargo}
										</p>
									</div>
									<ArrowRight className="size-4 text-ink-soft" />
								</Link>
							))}
							{matchingCargo.length === 0 && (
								<p className="px-3 py-6 text-center text-sm text-ink-soft">
									No local records match that search.
								</p>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}