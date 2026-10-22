import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
	AlertTriangle,
	ArrowLeft,
	Check,
	Loader2,
	Pencil,
	User,
	X,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";

type VehicleStatus =
	| "Approved"
	| "Pending review"
	| "Suspended"
	| "Expired documents"
	| "Rejected"
	| "Inactive";

type DriverStatus =
	| "Approved"
	| "Pending review"
	| "Suspended"
	| "Expired documents"
	| "Rejected"
	| "Inactive";

interface Driver {
	id: string;
	name: string;
	phone: string;
	licenceNumber: string;
	licenceClass: string;
	licenceExpiry: string;
	transporter: string;
	status: DriverStatus;
}

interface Vehicle {
	id: string;
	plate: string;
	kind: "Flatbed" | "Container" | "Reefer" | "Box" | "Tanker";
	make: string;
	model: string;
	year: string;
	capacity: string;
	owner: string;
	transporter: string;
	insuranceExpiry: string;
	roadworthinessExpiry: string;
	status: VehicleStatus;
	lastVisit: string;
	notes: string;
	drivers: Driver[];
}

const pageAnimations = `
	@keyframes slideInFromRight {
		from { opacity: 0; transform: translateX(24px); }
		to { opacity: 1; transform: translateX(0); }
	}
`;

const labelClass =
	"font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const textareaClass =
	"mt-2 w-full resize-y rounded-md border border-line bg-sand px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:ring-2 focus:ring-orange/30";

const normalizeStatus = (raw: unknown): VehicleStatus => {
	const s = String(raw ?? "").trim().toLowerCase();
	switch (s) {
		case "approved":
			return "Approved";
		case "pending":
		case "pending_review":
		case "pending review":
			return "Pending review";
		case "suspended":
			return "Suspended";
		case "expired":
		case "expired_documents":
		case "expired documents":
			return "Expired documents";
		case "rejected":
			return "Rejected";
		case "inactive":
			return "Inactive";
		default:
			return "Pending review";
	}
};

const normalizeDriver = (raw: any): Driver => ({
	id: String(raw?.id ?? ""),
	name: String(raw?.name ?? raw?.full_name ?? "—"),
	phone: String(raw?.phone ?? "—"),
	licenceNumber: String(raw?.licence_number ?? raw?.licenceNumber ?? "—"),
	licenceClass: String(raw?.licence_class ?? raw?.licenceClass ?? "—"),
	licenceExpiry: String(raw?.licence_expiry ?? raw?.licenceExpiry ?? "—"),
	transporter: String(raw?.transporter ?? "—"),
	status: normalizeStatus(raw?.status),
});

const normalizeVehicle = (raw: any): Vehicle => ({
	id: String(raw?.id ?? ""),
	plate: String(raw?.plate ?? raw?.plate_number ?? "—"),
	kind: (raw?.kind ?? raw?.vehicle_kind ?? "Container") as Vehicle["kind"],
	make: String(raw?.make ?? "—"),
	model: String(raw?.model ?? "—"),
	year: String(raw?.year ?? "—"),
	capacity: String(raw?.capacity ?? "—"),
	owner: String(raw?.owner ?? raw?.owner_name ?? "—"),
	transporter: String(raw?.transporter ?? raw?.transporter_name ?? "—"),
	insuranceExpiry: String(
		raw?.insurance_expiry ?? raw?.insuranceExpiry ?? "—"
	),
	roadworthinessExpiry: String(
		raw?.roadworthiness_expiry ?? raw?.roadworthinessExpiry ?? "—"
	),
	status: normalizeStatus(raw?.status),
	lastVisit: String(raw?.last_visit ?? raw?.lastVisit ?? "—"),
	notes: String(raw?.notes ?? ""),
	drivers: Array.isArray(raw?.drivers)
		? raw.drivers.map(normalizeDriver)
		: [],
});

export default function GateVehicleDetailsPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [vehicle, setVehicle] = useState<Vehicle | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [actioning, setActioning] = useState(false);

	const [suspendOpen, setSuspendOpen] = useState(false);
	const [rejectOpen, setRejectOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	const fetchVehicle = useCallback(async () => {
		if (!id) return;
		setLoading(true);
		setError("");
		try {
			// Using the endpoint that returns details for a specific vehicle
			const res = await http.get(`vehicles/details/${id}/portal/`);
			const resp: Resp = res.data;

			if (resp.error) {
				const message =
					typeof resp.data === "string"
						? resp.data
						: "Could not load vehicle details.";
				setError(message);
				toast.error(message);
				return;
			}

			// Assuming the API returns the vehicle object directly or wrapped
			const payload = resp.code ?? resp.data;
			const rawVehicle = payload?.vehicle ?? payload;
			
			setVehicle(normalizeVehicle(rawVehicle));
		} catch (err: any) {
			const message =
				err?.response?.data?.message ||
				err?.response?.data?.data ||
				"Could not load vehicle details.";
			setError(message);
			toast.error(message);
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		void fetchVehicle();
	}, [fetchVehicle]);

	const mutateStatus = async (
		endpoint: string,
		nextStatus: VehicleStatus,
		payload: Record<string, string> = {}
	) => {
		if (!vehicle) return false;
		setActioning(true);
		try {
			const res = await http.post(endpoint, { id: vehicle.id, ...payload });
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Action could not be completed.");
				return false;
			}
			setVehicle((prev) =>
				prev ? { ...prev, status: nextStatus } : prev
			);
			toast.success(
				typeof resp.data === "string" ? resp.data : "Vehicle updated."
			);
			return true;
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					err?.response?.data?.data ||
					"Action could not be completed."
			);
			return false;
		} finally {
			setActioning(false);
		}
	};

	const handleApprove = () =>
		mutateStatus("vehicles/approve/", "Approved");

	const handleActivate = () =>
		mutateStatus("vehicles/activate/", "Approved");

	const handleSuspend = (reason: string) =>
		mutateStatus("vehicles/suspend/", "Suspended", { reason });

	const handleReject = (reason: string) =>
		mutateStatus("vehicles/reject/", "Rejected", { reason });

	const handleDelete = async (reason: string) => {
		if (!vehicle) return;
		setActioning(true);
		try {
			const res = await http.post("vehicles/delete/", { id: vehicle.id, reason });
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not remove vehicle.");
				return;
			}
			toast.success("Vehicle removed from the registry.");
			navigate("/portal/vehicles");
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					err?.response?.data?.data ||
					"Could not remove vehicle."
			);
		} finally {
			setActioning(false);
		}
	};

	if (loading) {
		return (
			<AppShell title="Vehicle details" eyebrow="Gate control · Registry">
				<div className="flex items-center justify-center gap-2 py-24">
					<Loader2 className="size-6 animate-spin text-orange" />
					<span className="text-sm text-ink-soft">
						Loading vehicle record…
					</span>
				</div>
			</AppShell>
		);
	}

	if (error || !vehicle) {
		return (
			<AppShell title="Vehicle details" eyebrow="Gate control · Registry">
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-coral text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load vehicle
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">
								{error || "The vehicle may have been removed."}
							</p>
						</div>
					</div>
					<div className="mt-5 flex gap-2">
						<Button
							onClick={() => void fetchVehicle()}
							className="bg-orange text-white hover:bg-orange-deep"
						>
							Try again
						</Button>
						<Button
							variant="outline"
							onClick={() => navigate("/portal/vehicles")}
							className="border-line bg-paper text-ink hover:bg-sand"
						>
							Back to registry
						</Button>
					</div>
				</div>
			</AppShell>
		);
	}

	const isPending = vehicle.status === "Pending review";
	const isSuspended = vehicle.status === "Suspended";
	const isActive = vehicle.status === "Approved";

	return (
		<AppShell title="Vehicle details" eyebrow="Gate control · Registry">
			<style>{pageAnimations}</style>
			<div
				className="space-y-5 pb-8"
				style={{
					animation: "slideInFromRight 260ms cubic-bezier(0.32, 0.72, 0, 1)",
				}}
			>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Button
						variant="ghost"
						onClick={() => navigate("/portal/vehicles")}
						disabled={actioning}
						className="-ml-3 gap-2 text-ink-soft hover:text-ink"
					>
						<ArrowLeft className="size-4" />
						Back to registry
					</Button>

					<Button
						variant="outline"
						onClick={() => navigate(`/portal/vehicle/edit/${vehicle.id}`)}
						disabled={actioning}
						className="border-line bg-paper text-ink hover:bg-sand"
					>
						<Pencil className="mr-1.5 size-4" />
						Edit
					</Button>
				</div>

				<div className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
						<div className="min-w-0">
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								Vehicle record
							</p>
							<h3 className="mt-1 break-words font-display text-xl font-bold text-ink">
								{vehicle.plate}
							</h3>
							<p className="mt-1 text-[12px] text-ink-soft">
								{vehicle.kind} · {vehicle.make} {vehicle.model} ·{" "}
								{vehicle.year}
							</p>
						</div>
						<StatusBadge
							label={vehicle.status}
							tone={statusTone(vehicle.status)}
						/>
					</div>

					<div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
						<InfoStat label="Owner" value={vehicle.owner} />
						<InfoStat label="Transporter" value={vehicle.transporter} />
						<InfoStat label="Capacity" value={vehicle.capacity} mono />
					</div>
				</div>

				<div className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
					<div className="flex items-center justify-between gap-3">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Assigned drivers
						</p>
						<span className="rounded-full bg-sand px-2 py-0.5 font-mono text-[10px] text-ink-soft">
							{vehicle.drivers.length}
						</span>
					</div>

					{vehicle.drivers.length === 0 ? (
						<div className="mt-3 rounded-xl border border-dashed border-line bg-sand/40 p-4 text-center">
							<User className="mx-auto size-6 text-ink-soft" />
							<p className="mt-2 text-[12px] font-semibold text-ink">
								No driver assigned
							</p>
							<p className="mt-1 text-[11px] text-ink-soft">
								Assign a driver from the driver assignments page.
							</p>
						</div>
					) : (
						<ul className="mt-3 space-y-2">
							{vehicle.drivers.map((d) => (
								<li
									key={d.id}
									className="flex items-start gap-3 rounded-lg border border-line bg-sand p-3"
								>
									<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-paper text-orange-deep ring-1 ring-line">
										<User className="size-4" />
									</span>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<p className="text-[13px] font-semibold text-ink">
												{d.name}
											</p>
											<StatusBadge
												label={d.status}
												tone={statusTone(d.status)}
											/>
										</div>
										<p className="mt-0.5 font-mono text-[11px] text-ink-soft">
											{d.phone} · {d.licenceNumber}
										</p>
										<p className="mt-0.5 text-[11px] text-ink-soft">
											{d.licenceClass} · Expires {d.licenceExpiry}
										</p>
										<p className="mt-0.5 text-[11px] text-ink-soft">
											Transporter: {d.transporter}
										</p>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Insurance
						</p>
						<p className="mt-1 font-mono text-sm font-semibold text-ink">
							{vehicle.insuranceExpiry}
						</p>
					</div>
					<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Roadworthiness
						</p>
						<p className="mt-1 font-mono text-sm font-semibold text-ink">
							{vehicle.roadworthinessExpiry}
						</p>
					</div>
				</div>

				<div className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
					<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
						Notes
					</p>
					<p className="mt-2 text-[13px] leading-6 text-ink-soft">
						{vehicle.notes || "No additional notes for this vehicle."}
					</p>
					<p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
						Last visit: {vehicle.lastVisit}
					</p>
				</div>

				<div className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
					<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
						Actions
					</p>

					<div className="mt-3 flex flex-wrap gap-2">
						{isPending && (
							<>
								<Button
									disabled={actioning}
									onClick={() => void handleApprove()}
									className="bg-orange text-white hover:bg-orange-deep"
								>
									{actioning ? (
										<Loader2 className="mr-1.5 size-4 animate-spin" />
									) : (
										<Check className="mr-1.5 size-4" />
									)}
									Approve
								</Button>
								<Button
									disabled={actioning}
									onClick={() => setRejectOpen(true)}
									variant="outline"
									className="border-coral/30 bg-coral/5 text-coral hover:bg-coral/10"
								>
									<XCircle className="mr-1.5 size-4" />
									Reject
								</Button>
							</>
						)}

						{isActive && (
							<Button
								disabled={actioning}
								onClick={() => setSuspendOpen(true)}
								variant="outline"
								className="border-coral/30 bg-coral/5 text-coral hover:bg-coral/10"
							>
								<AlertTriangle className="mr-1.5 size-4" />
								Suspend
							</Button>
						)}

						{isSuspended && (
							<Button
								disabled={actioning}
								onClick={() => void handleActivate()}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								{actioning ? (
									<Loader2 className="mr-1.5 size-4 animate-spin" />
								) : (
									<Check className="mr-1.5 size-4" />
								)}
								Activate
							</Button>
						)}
					</div>

					<div className="mt-5 border-t border-line pt-4">
						<Button
							disabled={actioning}
							onClick={() => setDeleteOpen(true)}
							variant="ghost"
							className="text-coral hover:bg-coral/10"
						>
							<XCircle className="mr-1.5 size-4" />
							Delete vehicle
						</Button>
					</div>
				</div>

				{suspendOpen && (
					<ConfirmDialog
						title="Suspend vehicle"
						description="Suspending this vehicle blocks gate entry. Provide a reason for the audit trail."
						confirmLabel="Suspend vehicle"
						tone="danger"
						requireReason
						onClose={() => setSuspendOpen(false)}
						onConfirm={async (reason) => {
							const ok = await handleSuspend(reason ?? "");
							if (ok) setSuspendOpen(false);
						}}
					/>
				)}

				{rejectOpen && (
					<ConfirmDialog
						title="Reject vehicle"
						description="Rejecting this vehicle prevents it from being approved. Provide a reason for the audit trail."
						confirmLabel="Reject vehicle"
						tone="danger"
						requireReason
						onClose={() => setRejectOpen(false)}
						onConfirm={async (reason) => {
							const ok = await handleReject(reason ?? "");
							if (ok) setRejectOpen(false);
						}}
					/>
				)}

				{deleteOpen && (
					<ConfirmDialog
						title="Delete vehicle"
						description="This removes the vehicle from the registry. Provide a reason for the audit trail."
						confirmLabel="Delete vehicle"
						tone="danger"
						requireReason
						onClose={() => setDeleteOpen(false)}
						onConfirm={async (reason) => {
							await handleDelete(reason ?? "");
							setDeleteOpen(false);
						}}
					/>
				)}
			</div>
		</AppShell>
	);
}

function InfoStat({
	label,
	value,
	mono,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
			<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
				{label}
			</p>
			<p
				className={cn(
					"mt-1 truncate text-[13px] font-semibold text-ink",
					mono && "font-mono"
				)}
			>
				{value}
			</p>
		</div>
	);
}

function ConfirmDialog({
	title,
	description,
	confirmLabel,
	tone,
	requireReason,
	onClose,
	onConfirm,
}: {
	title: string;
	description: string;
	confirmLabel: string;
	tone: "danger" | "default";
	requireReason?: boolean;
	onClose: () => void;
	onConfirm: (reason?: string) => void | Promise<unknown>;
}) {
	const [reason, setReason] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (requireReason && reason.trim().length < 5) {
			toast.error("Enter a reason of at least 5 characters.");
			return;
		}
		setSubmitting(true);
		try {
			await onConfirm(reason.trim());
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) =>
				e.target === e.currentTarget && !submitting && onClose()
			}
		>
			<form
				onSubmit={handleSubmit}
				className="w-full max-w-lg overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line"
			>
				<div className="flex items-start gap-3 border-b border-line p-5 sm:p-6">
					<div
						className={cn(
							"grid size-10 shrink-0 place-items-center rounded-full",
							tone === "danger"
								? "bg-coral/10 text-coral"
								: "bg-orange/10 text-orange-deep"
						)}
					>
						<AlertTriangle className="size-5" />
					</div>
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
							Confirm action
						</p>
						<h3 className="mt-1 font-display text-lg font-bold text-ink">
							{title}
						</h3>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							{description}
						</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={onClose}
						disabled={submitting}
						aria-label="Close"
					>
						<X className="size-4" />
					</Button>
				</div>

				{requireReason && (
					<div className="space-y-2 p-5 sm:p-6">
						<label className="block">
							<span className={labelClass}>
								Reason <span className="text-coral">*</span>
							</span>
							<textarea
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								rows={4}
								minLength={5}
								maxLength={2000}
								disabled={submitting}
								required
								placeholder="Explain the reason. Recorded in the audit trail."
								className={textareaClass}
							/>
						</label>
						<p className="text-right font-mono text-[10px] text-ink-soft">
							{reason.length}/2000
						</p>
					</div>
				)}

				<div className="flex justify-end gap-2 border-t border-line p-5 sm:p-6">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={submitting}
						className="border-line bg-paper text-ink hover:bg-sand"
					>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={
							submitting || (requireReason && reason.trim().length < 5)
						}
						className={cn(
							"text-white",
							tone === "danger"
								? "bg-coral hover:bg-coral/90"
								: "bg-orange hover:bg-orange-deep"
						)}
					>
						{submitting && (
							<Loader2 className="mr-1.5 size-4 animate-spin" />
						)}
						{confirmLabel}
					</Button>
				</div>
			</form>
		</div>
	);
}