import { useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Calendar,
	Check,
	ChevronLeft,
	Plus,
	Search,
	ShieldCheck,
	Trash2,
	UserCheck,
	Users,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Scope = "view" | "act";
type ScopeArea = "cargo" | "documents" | "payments" | "bookings";
type Status = "Active" | "Pending" | "Expired" | "Revoked";

interface Delegation {
	id: string;
	agentName: string;
	agentEmail: string;
	organisation: string;
	agentType: "Customs agent" | "Forwarder" | "Haulage" | "Other";
	scopeAreas: ScopeArea[];
	scope: Scope;
	validFrom: string;
	validUntil: string;
	status: Status;
	reference: string;
	notes: string;
}

const initialDelegations: Delegation[] = [
	{
		id: "dlg-1",
		agentName: "Adewale Ogundipe",
		agentEmail: "adewale@meridiancustoms.ng",
		organisation: "Meridian Customs Services",
		agentType: "Customs agent",
		scopeAreas: ["cargo", "documents"],
		scope: "act",
		validFrom: "01 Sep 2026",
		validUntil: "31 Dec 2026",
		status: "Active",
		reference: "TRN-DLG-2026-00121",
		notes: "Full representation on TRN-IMP-002481 and follow-on consignments.",
	},
	{
		id: "dlg-2",
		agentName: "Emeka Okoro",
		agentEmail: "emeka@apexhaulage.com",
		organisation: "Apex Haulage Logistics",
		agentType: "Haulage",
		scopeAreas: ["bookings"],
		scope: "act",
		validFrom: "12 Sep 2026",
		validUntil: "30 Nov 2026",
		status: "Active",
		reference: "TRN-DLG-2026-00132",
		notes: "Truck slot coordination for our account.",
	},
	{
		id: "dlg-3",
		agentName: "Fatima Yusuf",
		agentEmail: "fatima@westbridge.co",
		organisation: "Westbridge Logistics",
		agentType: "Forwarder",
		scopeAreas: ["cargo", "documents", "payments"],
		scope: "view",
		validFrom: "15 Aug 2026",
		validUntil: "14 Nov 2026",
		status: "Active",
		reference: "TRN-DLG-2026-00098",
		notes: "Read-only oversight for group reporting.",
	},
	{
		id: "dlg-4",
		agentName: "Kingsley Obi",
		agentEmail: "kingsley@meridiancustoms.ng",
		organisation: "Meridian Customs Services",
		agentType: "Customs agent",
		scopeAreas: ["cargo", "documents"],
		scope: "act",
		validFrom: "01 Jun 2026",
		validUntil: "31 Aug 2026",
		status: "Expired",
		reference: "TRN-DLG-2026-00064",
		notes: "Previous engagement; superseded by TRN-DLG-2026-00121.",
	},
];

const agentTypes: Delegation["agentType"][] = [
	"Customs agent",
	"Forwarder",
	"Haulage",
	"Other",
];

const scopeAreas: { key: ScopeArea; label: string; detail: string }[] = [
	{ key: "cargo", label: "Cargo & consignments", detail: "Cargo records, tracking, holds" },
	{ key: "documents", label: "Documents", detail: "Uploads, versions, verification" },
	{ key: "payments", label: "Payments & invoices", detail: "Receipts, disputes, statements" },
	{ key: "bookings", label: "Truck bookings", detail: "Slot coordination and gate passes" },
];

export default function DelegationPage() {
	const [delegations, setDelegations] = useState<Delegation[]>(initialDelegations);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
	const [isGrantOpen, setIsGrantOpen] = useState(false);
	const [revokeTarget, setRevokeTarget] = useState<Delegation | null>(null);

	const filtered = useMemo(() => {
		return delegations.filter((d) => {
			const matchQuery =
				d.agentName.toLowerCase().includes(query.toLowerCase()) ||
				d.agentEmail.toLowerCase().includes(query.toLowerCase()) ||
				d.organisation.toLowerCase().includes(query.toLowerCase()) ||
				d.reference.toLowerCase().includes(query.toLowerCase());
			const matchStatus = statusFilter === "all" || d.status === statusFilter;
			return matchQuery && matchStatus;
		});
	}, [delegations, query, statusFilter]);

	const stats = useMemo(() => {
		const active = delegations.filter((d) => d.status === "Active").length;
		const view = delegations.filter((d) => d.scope === "view" && d.status === "Active").length;
		const act = delegations.filter((d) => d.scope === "act" && d.status === "Active").length;
		return { active, view, act };
	}, [delegations]);

	const handleGrant = (next: Delegation) => {
		setDelegations((prev) => [next, ...prev]);
		setIsGrantOpen(false);
		toast.success("Access granted locally.");
	};

	const handleRevoke = () => {
		if (!revokeTarget) return;
		setDelegations((prev) =>
			prev.map((d) => (d.id === revokeTarget.id ? { ...d, status: "Revoked" as Status } : d))
		);
		toast.success(`Access revoked for ${revokeTarget.agentName}.`);
		setRevokeTarget(null);
	};

	return (
		<AppShell title="Delegation & access" eyebrow="Account & compliance">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Account · Delegated access
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Delegate access to your account
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Grant named agents, forwarders, and hauliers access to your account. Every
						delegation is scoped, time-bound, and revocable at any time. Revocations take
						effect immediately.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link to="/session-management">
						<Button variant="outline" className="border-line bg-paper text-ink">
							<ShieldCheck className="mr-1.5 size-4" /> Session management
						</Button>
					</Link>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsGrantOpen(true)}
					>
						<Plus className="mr-1.5 size-4" /> Grant access
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Active delegations"
					value={String(stats.active)}
					detail="Currently in force"
					tone="info"
					icon={Users}
				/>
				<Metric
					label="Act on your behalf"
					value={String(stats.act)}
					detail="Full operational scope"
					tone="warning"
					icon={UserCheck}
				/>
				<Metric
					label="View-only"
					value={String(stats.view)}
					detail="Read-only oversight"
					tone="info"
					icon={ShieldCheck}
				/>
				<Metric
					label="Total records"
					value={String(delegations.length)}
					detail="Historical and current"
					tone="neutral"
					icon={Calendar}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by agent, organisation, or reference..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{(["all", "Active", "Pending", "Expired", "Revoked"] as const).map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => setStatusFilter(s)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									statusFilter === s
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{s === "all" ? "All" : s}
							</button>
						))}
					</div>
				</div>

				{filtered.length === 0 ? (
					<div className="p-12 text-center">
						<Users className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">No delegations match your filters.</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different agent, organisation, or reference.
						</p>
					</div>
				) : (
					<ul className="divide-y divide-line">
						{filtered.map((d) => (
							<li key={d.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
								<div className="grid size-11 shrink-0 place-items-center rounded-full bg-ink font-display text-[13px] font-semibold text-sand">
									{d.agentName
										.split(" ")
										.map((p) => p[0] ?? "")
										.join("")
										.slice(0, 2)}
								</div>

								<div className="min-w-[220px] flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="text-sm font-semibold text-ink">{d.agentName}</p>
										<StatusBadge label={d.status} tone={statusTone(d.status)} />
										<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
											{d.agentType}
										</span>
									</div>
									<p className="mt-1 text-[12px] text-ink-soft">
										{d.organisation} ·{" "}
										<span className="font-mono">{d.agentEmail}</span>
									</p>
									<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										Ref · {d.reference}
									</p>
								</div>

								<div className="min-w-[180px]">
									<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										Scope
									</p>
									<p className="mt-1 text-[12px] text-ink">
										{d.scope === "act" ? "View & act" : "View only"}
									</p>
									<p className="mt-1 flex flex-wrap gap-1">
										{d.scopeAreas.map((area) => (
											<span
												key={area}
												className="rounded bg-sand-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft"
											>
												{area}
											</span>
										))}
									</p>
								</div>

								<div className="min-w-[180px]">
									<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										Validity
									</p>
									<p className="mt-1 font-mono text-[12px] text-ink">
										{d.validFrom} → {d.validUntil}
									</p>
									<p className="mt-1 text-[11px] text-ink-soft">{d.notes}</p>
								</div>

								<div className="ml-auto flex items-center gap-2">
									{d.status === "Active" || d.status === "Pending" ? (
										<Button
											variant="outline"
											size="sm"
											className="border-line bg-paper text-coral hover:bg-coral/10"
											onClick={() => setRevokeTarget(d)}
										>
											<Trash2 className="size-3.5" />
											Revoke
										</Button>
									) : (
										<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											{d.status}
										</span>
									)}
								</div>
							</li>
						))}
					</ul>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filtered.length} of {delegations.length} delegation records
					</span>
					<span>Revocations take effect immediately</span>
				</div>
			</section>

			<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
				<div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
					<div>
						<div className="flex items-center gap-2">
							<ShieldCheck className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								How delegation works
							</p>
						</div>
						<h3 className="mt-3 font-display text-xl font-bold text-ink">
							Scoped, time-bound, and revocable.
						</h3>
						<p className="mt-2 max-w-xl text-[13px] leading-6 text-ink-soft">
							Every delegation is scoped to specific areas of your account and time-bound
							to the period you specify. You can revoke access at any time, and revocations
							take effect immediately — the agent's active session ends on their next
							request.
						</p>
						<div className="mt-5 flex flex-wrap gap-2">
							<Link to="/session-management">
								<Button variant="outline" className="border-line bg-paper text-ink">
									Manage sessions
								</Button>
							</Link>
							<Link to="/portal/kyc">
								<Button variant="outline" className="border-line bg-paper text-ink">
									KYC & signatories
								</Button>
							</Link>
						</div>
					</div>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							What you control
						</p>
						<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Who can access your account, and by what scope
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								How long the access lasts
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Which areas of the account are shared
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								The right to revoke immediately at any time
							</li>
						</ul>
					</div>
				</div>
			</div>

			{isGrantOpen && (
				<GrantModal
					onClose={() => setIsGrantOpen(false)}
					onSubmit={handleGrant}
					existingReferences={delegations.map((d) => d.reference)}
				/>
			)}

			{revokeTarget && (
				<RevokeDialog
					delegation={revokeTarget}
					onClose={() => setRevokeTarget(null)}
					onConfirm={handleRevoke}
				/>
			)}
		</AppShell>
	);
}

function GrantModal({
	onClose,
	onSubmit,
	existingReferences,
}: {
	onClose: () => void;
	onSubmit: (d: Delegation) => void;
	existingReferences: string[];
}) {
	const [agentName, setAgentName] = useState("");
	const [agentEmail, setAgentEmail] = useState("");
	const [organisation, setOrganisation] = useState("");
	const [agentType, setAgentType] = useState<Delegation["agentType"]>("Customs agent");
	const [scope, setScope] = useState<Scope>("act");
	const [areas, setAreas] = useState<ScopeArea[]>(["cargo", "documents"]);
	const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10));
	const [validUntil, setValidUntil] = useState("");
	const [notes, setNotes] = useState("");

	const toggleArea = (area: ScopeArea) => {
		setAreas((prev) =>
			prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
		);
	};

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!agentName.trim() || !agentEmail.trim() || !organisation.trim()) {
			toast.error("Agent name, email, and organisation are required.");
			return;
		}
		if (areas.length === 0) {
			toast.error("Select at least one scope area.");
			return;
		}
		if (!validUntil.trim()) {
			toast.error("Set an expiry date for the delegation.");
			return;
		}

		const nextNumber = String(
			Math.max(
				...existingReferences
					.map((r) => parseInt(r.split("-").pop() ?? "0", 10))
					.filter((n) => !isNaN(n)),
				0
			) + 1
		).padStart(5, "0");

		onSubmit({
			id: `dlg-${Date.now()}`,
			agentName,
			agentEmail,
			organisation,
			agentType,
			scopeAreas: areas,
			scope,
			validFrom,
			validUntil,
			status: "Active",
			reference: `TRN-DLG-2026-${nextNumber}`,
			notes: notes || "Granted from the delegation workspace.",
		});
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
					<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								New delegation
							</p>
							<h3 className="mt-1 font-display text-xl font-bold text-ink">
								Grant account access
							</h3>
							<p className="mt-1 text-[12px] text-ink-soft">
								The agent receives an email invitation. Access begins once they accept and
								complete identity confirmation.
							</p>
						</div>
						<Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
							<X />
						</Button>
					</div>

					<div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Agent details
							</p>
							<div className="mt-3 grid gap-3 sm:grid-cols-2">
								<Field
									label="Agent name"
									placeholder="e.g. Adewale Ogundipe"
									value={agentName}
									onChange={setAgentName}
									required
								/>
								<Field
									label="Agent email"
									placeholder="name@company.ng"
									value={agentEmail}
									onChange={setAgentEmail}
									type="email"
									required
								/>
								<Field
									label="Organisation"
									placeholder="e.g. Meridian Customs Services"
									value={organisation}
									onChange={setOrganisation}
									required
								/>
								<label className="block">
									<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Agent type
									</span>
									<select
										value={agentType}
										onChange={(e) => setAgentType(e.target.value as Delegation["agentType"])}
										className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none"
									>
										{agentTypes.map((t) => (
											<option key={t} value={t}>
												{t}
											</option>
										))}
									</select>
								</label>
							</div>
						</div>

						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Permission scope
							</p>
							<div className="mt-3 grid gap-2 sm:grid-cols-2">
								{[
									{
										key: "view" as Scope,
										label: "View only",
										detail: "Agent can see records but cannot act.",
									},
									{
										key: "act" as Scope,
										label: "View & act",
										detail: "Agent can upload, book, and coordinate on your behalf.",
									},
								].map((option) => {
									const active = scope === option.key;
									return (
										<button
											key={option.key}
											type="button"
											onClick={() => setScope(option.key)}
											className={cn(
												"rounded-xl border p-3 text-left transition-colors",
												active
													? "border-orange bg-orange/5 ring-1 ring-orange/30"
													: "border-line bg-sand hover:bg-sand-2"
											)}
										>
											<p className="text-sm font-semibold text-ink">{option.label}</p>
											<p className="mt-1 text-[11px] leading-5 text-ink-soft">
												{option.detail}
											</p>
										</button>
									);
								})}
							</div>
						</div>

						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Which areas are shared
							</p>
							<div className="mt-3 grid gap-2 sm:grid-cols-2">
								{scopeAreas.map((area) => {
									const active = areas.includes(area.key);
									return (
										<button
											key={area.key}
											type="button"
											onClick={() => toggleArea(area.key)}
											className={cn(
												"flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
												active
													? "border-orange bg-orange/5 ring-1 ring-orange/30"
													: "border-line bg-sand hover:bg-sand-2"
											)}
										>
											<span
												className={cn(
													"mt-0.5 grid size-5 shrink-0 place-items-center rounded border transition-colors",
													active
														? "border-orange bg-orange text-white"
														: "border-line bg-paper"
												)}
											>
												{active && <Check className="size-3" />}
											</span>
											<span className="min-w-0">
												<span className="text-sm font-semibold text-ink">
													{area.label}
												</span>
												<span className="mt-0.5 block text-[11px] leading-5 text-ink-soft">
													{area.detail}
												</span>
											</span>
										</button>
									);
								})}
							</div>
						</div>

						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Validity
							</p>
							<div className="mt-3 grid gap-3 sm:grid-cols-2">
								<Field
									label="Valid from"
									placeholder="2026-09-24"
									value={validFrom}
									onChange={setValidFrom}
									type="date"
									required
								/>
								<Field
									label="Valid until"
									placeholder="2026-12-31"
									value={validUntil}
									onChange={setValidUntil}
									type="date"
									required
								/>
							</div>
							<p className="mt-2 text-[11px] leading-5 text-ink-soft">
								Delegations are time-bound by design. Set an expiry date; you can revoke
								earlier at any time.
							</p>
						</div>

						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Notes
							</span>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder="Anything the agent or your team should know about this delegation."
							/>
						</label>
					</div>

					<div className="flex items-center justify-between gap-3 border-t border-line p-5 sm:p-6">
						<Button type="button" variant="ghost" onClick={onClose} className="text-ink-soft">
							Cancel
						</Button>
						<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
							Grant access <ArrowRight />
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

function RevokeDialog({
	delegation,
	onClose,
	onConfirm,
}: {
	delegation: Delegation;
	onClose: () => void;
	onConfirm: () => void;
}) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-md rounded-2xl bg-paper p-6 shadow-2xl ring-1 ring-line">
				<div className="flex items-start gap-3">
					<div className="grid size-11 shrink-0 place-items-center rounded-full bg-coral/10 text-coral">
						<AlertTriangle className="size-5" />
					</div>
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-coral">
							Revoke delegation
						</p>
						<h3 className="mt-1 font-display text-lg font-bold text-ink">
							Remove access for {delegation.agentName}?
						</h3>
						<p className="mt-2 text-[12px] leading-5 text-ink-soft">
							The agent's active session ends on their next request. Their historical
							actions remain on the audit trail. This action cannot be undone — you can
							grant a new delegation at any time.
						</p>
					</div>
				</div>

				<div className="mt-5 rounded-xl bg-sand p-4 ring-1 ring-line">
					<dl className="space-y-2 text-[12px]">
						<div className="flex justify-between gap-3">
							<dt className="text-ink-soft">Organisation</dt>
							<dd className="text-ink">{delegation.organisation}</dd>
						</div>
						<div className="flex justify-between gap-3">
							<dt className="text-ink-soft">Reference</dt>
							<dd className="font-mono text-ink">{delegation.reference}</dd>
						</div>
						<div className="flex justify-between gap-3">
							<dt className="text-ink-soft">Scope</dt>
							<dd className="text-ink">
								{delegation.scope === "act" ? "View & act" : "View only"} ·{" "}
								{delegation.scopeAreas.join(", ")}
							</dd>
						</div>
					</dl>
				</div>

				<div className="mt-6 flex justify-end gap-2">
					<Button variant="outline" onClick={onClose} className="border-line bg-paper text-ink">
						Keep access
					</Button>
					<Button
						onClick={onConfirm}
						className="bg-coral text-white hover:bg-coral/90"
					>
						Revoke access
					</Button>
				</div>
			</div>
		</div>
	);
}

function Field({
	label,
	placeholder,
	value,
	onChange,
	type = "text",
	required,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	required?: boolean;
}) {
	return (
		<label className="block">
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
				{required && <span className="text-coral"> *</span>}
			</span>
			<Input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="mt-2 h-11 border-line bg-sand text-ink"
			/>
		</label>
	);
}