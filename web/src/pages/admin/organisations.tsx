import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	Building2,
	Check,
	Download,
	Filter,
	Plus,
	Search,
	Ship,
	Truck,
	Users,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";

type OrgStatus =
	| "pending"
	| "verified"
	| "under_review"
	| "rejected"
	| "suspended"
	| "approved";

type OrgType = "importer" | "agent" | "transporter" | "shipping_line" | "other";

interface OrgRecord {
	id: string;
	name: string;
	org_type: OrgType;
	rc_number?: string | null;
	tin?: string | null;
	status: OrgStatus;
	created_at?: string | null;
	contact_email?: string | null;
	contact_phone?: string | null;
}

interface OrgMetrics {
	total: number;
	shipping_lines: number;
	transporters: number;
	total_credit: number | null;
}

const statusLabel: Record<string, string> = {
	pending: "Pending",
	verified: "Verified",
	under_review: "Under Review",
	rejected: "Rejected",
	suspended: "Suspended",
	approved: "Approved",
};

const typeLabel: Record<string, string> = {
	importer: "Importer",
	agent: "Licensed Agent",
	transporter: "Transporter",
	shipping_line: "Shipping Line",
	other: "Other",
};

const formatDate = (input?: string | null) => {
	if (!input) return "—";
	const date = new Date(input);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleDateString("en-NG", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
};

const formatCurrency = (value?: number | null) => {
	if (value === null || value === undefined) return "—";
	return `₦${value.toLocaleString()}`;
};

export default function AdminOrganisationsRoute() {
	const [orgs, setOrgs] = useState<OrgRecord[]>([]);
	const [metrics, setMetrics] = useState<OrgMetrics | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState("ALL");

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [creating, setCreating] = useState(false);
	const [orgName, setOrgName] = useState("");
	const [orgType, setOrgType] = useState<OrgType>("importer");
	const [orgTin, setOrgTin] = useState("");
	const [orgRc, setOrgRc] = useState("");
	const [orgEmail, setOrgEmail] = useState("");
	const [orgPhone, setOrgPhone] = useState("");

	const fetchOrgs = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("admin/organisations/");
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load organisations.");
				setOrgs([]);
				setMetrics(null);
				return;
			}

			const payload = resp.code ?? {};
			const list: OrgRecord[] = Array.isArray(payload)
				? payload
				: Array.isArray(payload.results)
				? payload.results
				: Array.isArray(payload.organizations)
				? payload.organizations
				: [];

			setOrgs(list);

			const computedMetrics: OrgMetrics =
				payload.metrics ?? {
					total: list.length,
					shipping_lines: list.filter((o) => o.org_type === "shipping_line").length,
					transporters: list.filter((o) => o.org_type === "transporter").length,
					total_credit: null,
				};
			setMetrics(computedMetrics);
		} catch (err: any) {
			setError(err?.response?.data?.message || "Could not load organisations.");
			setOrgs([]);
			setMetrics(null);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchOrgs();
	}, []);

	const filteredOrgs = useMemo(() => {
		return orgs.filter((o) => {
			const q = searchQuery.trim().toLowerCase();
			const matchQuery =
				!q ||
				o.name.toLowerCase().includes(q) ||
				(o.tin ?? "").toLowerCase().includes(q) ||
				(o.rc_number ?? "").toLowerCase().includes(q) ||
				(typeLabel[o.org_type] ?? o.org_type).toLowerCase().includes(q);

			const matchType =
				typeFilter === "ALL"
					? true
					: (o.org_type ?? "").toUpperCase() === typeFilter.toUpperCase();

			return matchQuery && matchType;
		});
	}, [orgs, searchQuery, typeFilter]);

	const handleCreateOrg = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!orgName.trim() || !orgRc.trim()) {
			toast.error("Provide the organisation name and RC number.");
			return;
		}
		setCreating(true);
		try {
			const res = await http.post("admin/organisations/", {
				name: orgName.trim(),
				org_type: orgType,
				rc_number: orgRc.trim(),
				tin: orgTin.trim() || undefined,
				contact_email: orgEmail.trim() || undefined,
				contact_phone: orgPhone.trim() || undefined,
			});
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not register the organisation.");
				return;
			}
			toast.success(`${orgName} registered.`);
			setIsModalOpen(false);
			setOrgName("");
			setOrgTin("");
			setOrgRc("");
			setOrgEmail("");
			setOrgPhone("");
			await fetchOrgs();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Could not register the organisation.");
		} finally {
			setCreating(false);
		}
	};

	const handleExport = () => {
		const csv = [
			["Name", "Type", "RC Number", "TIN", "Status", "Joined"].join(","),
			...orgs.map((o) =>
				[
					`"${o.name}"`,
					`"${typeLabel[o.org_type] ?? o.org_type}"`,
					`"${o.rc_number ?? ""}"`,
					`"${o.tin ?? ""}"`,
					`"${statusLabel[o.status] ?? o.status}"`,
					`"${formatDate(o.created_at)}"`,
				].join(",")
			),
		].join("\n");

		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `trinu-organisations-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Organisations exported.");
	};

	return (
		<AppShell title="Organisations" eyebrow="Administration · Stakeholder Directory">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-orange">
						Commercial Registry · Port Stakeholders
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Registered Partner Organisations
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Manage authorized corporate accounts, shipping agents, haulage contractors,
						and credit limits.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink hover:bg-sand"
						onClick={handleExport}
						disabled={orgs.length === 0}
					>
						<Download className="size-4" />
						Export Directory
					</Button>
				</div>
			</div>

			{loading ? (
				<div className="flex items-center justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
					<span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
				</div>
			) : error ? (
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load organisations
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">{error}</p>
						</div>
					</div>
					<div className="mt-5 flex flex-wrap gap-2">
						<Button
							onClick={() => void fetchOrgs()}
							className="bg-orange text-white hover:bg-orange-deep"
						>
							Try again
						</Button>
					</div>
				</div>
			) : (
				<>
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<Metric
							label="Registered Stakeholders"
							value={String(metrics?.total ?? orgs.length)}
							detail="Across all categories"
							tone="success"
							icon={Building2}
						/>
						<Metric
							label="Shipping Lines"
							value={String(metrics?.shipping_lines ?? 0)}
							detail="Ocean & coastal carriers"
							tone="info"
							icon={Ship}
						/>
						<Metric
							label="Transporters"
							value={String(metrics?.transporters ?? 0)}
							detail="Approved haulage partners"
							tone="success"
							icon={Truck}
						/>
						<Metric
							label="Total Credit Line"
							value={formatCurrency(metrics?.total_credit)}
							detail="Subject to bank guarantee"
							tone="info"
							icon={Users}
						/>
					</div>

					<section className="rounded-xl bg-paper ring-1 ring-line">
						<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
							<div className="relative min-w-[260px] flex-1">
								<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
								<Input
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search by company name, TIN, RC, or type..."
									className="h-10 border-line bg-sand pl-9 text-sm text-ink"
								/>
							</div>

							<div className="flex flex-wrap items-center gap-2">
								<span className="flex items-center gap-1 text-xs text-ink-soft">
									<Filter className="size-3.5" /> Type:
								</span>
								{["ALL", "importer", "agent", "transporter", "shipping_line"].map((t) => (
									<button
										key={t}
										onClick={() => setTypeFilter(t)}
										className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
											typeFilter === t
												? "bg-orange text-white"
												: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
										}`}
									>
										{t === "ALL" ? "All" : typeLabel[t] ?? t}
									</button>
								))}
							</div>
						</div>

						<div className="overflow-x-auto">
							{filteredOrgs.length === 0 ? (
								<div className="p-8 text-center text-sm text-ink-soft">
									{orgs.length === 0
										? "No organisations registered yet."
										: "No organisations match your filters."}
								</div>
							) : (
								<table className="w-full min-w-[850px] text-left text-sm">
									<thead>
										<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											<th className="px-4 py-3 font-medium">Organisation / Name</th>
											<th className="px-4 py-3 font-medium">Category</th>
											<th className="px-4 py-3 font-medium">Tax ID / RC</th>
											<th className="px-4 py-3 font-medium">Contact</th>
											<th className="px-4 py-3 font-medium">Status</th>
											<th className="px-4 py-3 font-medium text-right">Action</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-line">
										{filteredOrgs.map((o) => (
											<tr key={o.id} className="transition-colors hover:bg-sand/60">
												<td className="px-4 py-3.5">
													<p className="font-semibold text-ink">{o.name}</p>
													<p className="font-mono text-xs text-ink-soft">
														Registered: {formatDate(o.created_at)}
													</p>
												</td>
												<td className="px-4 py-3.5 text-xs text-ink">
													{typeLabel[o.org_type] ?? o.org_type}
												</td>
												<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
													{o.rc_number ?? o.tin ?? "—"}
												</td>
												<td className="px-4 py-3.5 text-xs text-ink-soft">
													{o.contact_email ?? o.contact_phone ?? "—"}
												</td>
												<td className="px-4 py-3.5">
													<StatusBadge
														label={statusLabel[o.status] ?? o.status}
														tone={statusTone(o.status)}
													/>
												</td>
												<td className="px-4 py-3.5 text-right">
													<Link to={`/admin/organisations/${o.id}`}>
														<Button
															variant="ghost"
															size="sm"
															className="text-xs font-semibold text-orange hover:bg-orange/10"
														>
															View Account
														</Button>
													</Link>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</div>

						<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
							<span>
								Showing {filteredOrgs.length} of {orgs.length} organisations
							</span>
							<span>CAC / Federal Inland Revenue Service (FIRS) Verified</span>
						</div>
					</section>
				</>
			)}

			{isModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
				>
					<div className="w-full max-w-lg overflow-hidden rounded-xl bg-paper shadow-2xl ring-1 ring-line">
						<div className="flex items-center justify-between border-b border-line bg-sand p-5">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
									Corporate Onboarding
								</p>
								<h3 className="mt-1 font-display text-lg font-bold text-ink">
									Register Partner Organisation
								</h3>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsModalOpen(false)}
								aria-label="Close"
							>
								<X className="size-4" />
							</Button>
						</div>

						<form onSubmit={handleCreateOrg} className="space-y-4 p-5">
							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Company Legal Name
								</span>
								<Input
									required
									placeholder="e.g. West African Cold Chain Ltd"
									value={orgName}
									onChange={(e) => setOrgName(e.target.value)}
									className="mt-1.5 border-line bg-sand text-ink"
								/>
							</label>

							<div className="grid gap-3 sm:grid-cols-2">
								<label className="block">
									<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Organisation Type
									</span>
									<select
										value={orgType}
										onChange={(e) => setOrgType(e.target.value as OrgType)}
										className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink"
									>
										<option value="importer">Importer / Consignee</option>
										<option value="agent">Licensed Agent</option>
										<option value="transporter">Transporter</option>
										<option value="shipping_line">Shipping Line</option>
										<option value="other">Other</option>
									</select>
								</label>

								<label className="block">
									<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										RC Number
									</span>
									<Input
										required
										placeholder="e.g. RC-1284921"
										value={orgRc}
										onChange={(e) => setOrgRc(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-ink"
									/>
								</label>
							</div>

							<div className="grid gap-3 sm:grid-cols-2">
								<label className="block">
									<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										TIN
									</span>
									<Input
										placeholder="e.g. 20483012-0001"
										value={orgTin}
										onChange={(e) => setOrgTin(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-ink"
									/>
								</label>

								<label className="block">
									<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Contact Phone
									</span>
									<Input
										placeholder="+234 803 000 0000"
										value={orgPhone}
										onChange={(e) => setOrgPhone(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-ink"
									/>
								</label>
							</div>

							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Contact Email
								</span>
								<Input
									type="email"
									placeholder="ops@company.ng"
									value={orgEmail}
									onChange={(e) => setOrgEmail(e.target.value)}
									className="mt-1.5 border-line bg-sand text-ink"
								/>
							</label>

							<div className="flex items-center justify-end gap-2 border-t border-line pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsModalOpen(false)}
									disabled={creating}
									className="border-line bg-paper text-ink hover:bg-sand"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={creating}
									className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
								>
									<Check className="size-4" />
									{creating ? "Registering…" : "Register Account"}
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</AppShell>
	);
}