
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
	ArrowLeft,
	Check,
	ClipboardCheck,
	Clock,
	Container,
	FileText,
	MapPin,
	Package,
	Play,
	Ruler,
	UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import {
	formatNow,
	getOrder,
	kindMeta,
	updateOrder,
} from "./value-added.data";

function Detail({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div>
			<p className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-soft">
				{label}
			</p>
			<p className={`mt-1 break-words text-sm font-medium text-ink ${mono ? "font-mono" : ""}`}>
				{value || "—"}
			</p>
		</div>
	);
}

export default function OperationsValueAddedDetailsPage() {
	const { id = "" } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const order = useMemo(() => getOrder(id), [id]);

	if (!order) {
		return (
			<AppShell title="Service order" eyebrow="Operations · Value-added">
				<div className="rounded-2xl border border-line bg-paper px-6 py-16 text-center">
					<Package className="mx-auto size-8 text-ink-soft" />
					<h2 className="mt-3 font-display text-xl font-bold text-ink">
						Service order not found
					</h2>
					<p className="mt-1 text-sm text-ink-soft">
						The service order may have been removed or the reference is incorrect.
					</p>
					<Link to="/operations/value-added">
						<Button className="mt-5">
							<ArrowLeft className="mr-2 size-4" />
							Back to service orders
						</Button>
					</Link>
				</div>
			</AppShell>
		);
	}

	const Icon = kindMeta[order.kind].icon;

	const handleStart = () => {
		updateOrder(order.id, {
			status: "In progress",
			startedAt: formatNow(),
		});
		toast.success("Service order started.");
		navigate(0);
	};

	const handleVerify = () => {
		updateOrder(order.id, {
			status: "Completed",
			completedAt: formatNow(),
		});
		toast.success("Service order verified and completed.");
		navigate(0);
	};

	const handleCancel = () => {
		if (!window.confirm("Cancel this service order?")) return;

		updateOrder(order.id, { status: "Cancelled" });
		toast.success("Service order cancelled.");
		navigate(0);
	};

	const steps = [
		{ label: "Order created", value: order.createdAt, done: true },
		{ label: "Scheduled", value: order.scheduledFor, done: true },
		{
			label: "Work started",
			value: order.startedAt,
			done: order.startedAt !== "—",
		},
		{
			label: "Service completed",
			value: order.completedAt,
			done: order.completedAt !== "—",
		},
	];

	return (
		<AppShell title="Service order details" eyebrow="Operations · Value-added">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Link
					to="/operations/value-added"
					className="inline-flex items-center text-sm font-medium text-ink-soft hover:text-ink"
				>
					<ArrowLeft className="mr-2 size-4" />
					Back to service orders
				</Link>
				<StatusBadge label={order.status} tone={statusTone(order.status)} />
			</div>

			<div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
				<div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
					<div className="flex min-w-0 items-start gap-4">
						<div className="grid size-12 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep">
							<Icon className="size-6" />
						</div>
						<div className="min-w-0">
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								{kindMeta[order.kind].label}
							</p>
							<h2 className="mt-1 break-all font-display text-xl font-bold text-ink sm:text-2xl">
								{order.reference}
							</h2>
							<p className="mt-1 text-sm text-ink-soft">
								{order.container} · {order.consignment} · {order.cargoOwner}
							</p>
						</div>
					</div>

					<div className="flex flex-wrap gap-2">
						{order.status === "Scheduled" && (
							<Button
								onClick={handleStart}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Play className="mr-2 size-4" />
								Start service
							</Button>
						)}
						{order.status === "Awaiting verification" && (
							<Button
								onClick={handleVerify}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Check className="mr-2 size-4" />
								Verify & complete
							</Button>
						)}
						{!["Completed", "Cancelled"].includes(order.status) && (
							<Button variant="outline" onClick={handleCancel}>
								Cancel order
							</Button>
						)}
					</div>
				</div>

				<div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4 sm:p-6">
					<div className="rounded-xl bg-sand p-4">
						<p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
							Service type
						</p>
						<p className="mt-2 text-sm font-semibold text-ink">{order.kind}</p>
					</div>
					<div className="rounded-xl bg-sand p-4">
						<p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
							Service status
						</p>
						<div className="mt-2">
							<StatusBadge label={order.status} tone={statusTone(order.status)} />
						</div>
					</div>
					<div className="rounded-xl bg-sand p-4">
						<p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
							Scheduled for
						</p>
						<p className="mt-2 text-sm font-semibold text-ink">{order.scheduledFor}</p>
					</div>
					<div className="rounded-xl bg-sand p-4">
						<p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
							Quantity handled
						</p>
						<p className="mt-2 text-sm font-semibold text-ink">{order.quantity}</p>
					</div>
				</div>
			</div>

			<div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
				<div className="space-y-5">
					<section className="rounded-2xl border border-line bg-paper p-5 shadow-sm sm:p-6">
						<div className="mb-5 flex items-center gap-2">
							<Container className="size-4 text-orange-deep" />
							<h3 className="font-display text-lg font-bold text-ink">
								Cargo and assignment
							</h3>
						</div>
						<dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
							<Detail label="Container number" value={order.container} mono />
							<Detail label="Container record" value={order.containerRef} mono />
							<Detail label="Consignment" value={order.consignment} mono />
							<Detail label="Cargo owner" value={order.cargoOwner} />
							<Detail label="Current location" value={order.location} />
							<Detail label="Assigned to" value={order.assignedTo} />
						</dl>
					</section>

					<section className="rounded-2xl border border-line bg-paper p-5 shadow-sm sm:p-6">
						<div className="mb-5 flex items-center gap-2">
							<ClipboardCheck className="size-4 text-orange-deep" />
							<h3 className="font-display text-lg font-bold text-ink">
								Service results
							</h3>
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="rounded-xl border border-line bg-sand/60 p-4">
								<p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
									Before service
								</p>
								<p className="mt-2 text-sm font-semibold text-ink">
									{order.beforeValue}
								</p>
							</div>
							<div className="rounded-xl border border-line bg-sand/60 p-4">
								<p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
									After service
								</p>
								<p className="mt-2 text-sm font-semibold text-ink">
									{order.afterValue}
								</p>
							</div>
						</div>
						<div className="mt-4 rounded-xl bg-sand p-4">
							<p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
								Service description
							</p>
							<p className="mt-2 text-sm leading-6 text-ink-soft">
								{kindMeta[order.kind].detail}
							</p>
						</div>
					</section>

					<section className="rounded-2xl border border-line bg-paper p-5 shadow-sm sm:p-6">
						<div className="mb-4 flex items-center gap-2">
							<FileText className="size-4 text-orange-deep" />
							<h3 className="font-display text-lg font-bold text-ink">
								Operational notes
							</h3>
						</div>
						<p className="whitespace-pre-wrap text-sm leading-7 text-ink">
							{order.notes || "No operational notes recorded."}
						</p>
					</section>

					<section className="rounded-2xl border border-line bg-paper p-5 shadow-sm sm:p-6">
						<div className="mb-5 flex items-center gap-2">
							<Ruler className="size-4 text-orange-deep" />
							<h3 className="font-display text-lg font-bold text-ink">
								Charge information
							</h3>
						</div>
						<dl className="grid gap-6 sm:grid-cols-2">
							<Detail label="Charge reference" value={order.chargeRef} mono />
							<Detail label="Tariff line" value={order.tariffLine} mono />
						</dl>
						<p className="mt-4 rounded-lg bg-orange/5 p-3 text-xs leading-5 text-ink-soft">
							This service is associated with the cargo charge record. Actual
							billing posting should be confirmed by the finance workflow.
						</p>
					</section>
				</div>

				<aside className="space-y-5 xl:sticky xl:top-6">
					<section className="rounded-2xl bg-[#4B4F55] p-5 text-white shadow-sm">
						<div className="flex items-center justify-between">
							<h3 className="font-display font-bold">Service progress</h3>
							<span className="font-mono text-[9px] uppercase tracking-wider text-white/50">
								Activity
							</span>
						</div>
						<ol className="mt-5 space-y-5">
							{steps.map((step, index) => (
								<li key={step.label} className="flex gap-3">
									<span
										className={`grid size-6 shrink-0 place-items-center rounded-full ${
											step.done
												? "bg-orange text-white"
												: "bg-white/15 text-white/50"
										}`}
									>
										{step.done ? (
											<Check className="size-3.5" />
										) : (
											<span className="text-[10px]">{index + 1}</span>
										)}
									</span>
									<div>
										<p className={`text-sm font-semibold ${step.done ? "text-white" : "text-white/45"}`}>
											{step.label}
										</p>
										<p className="mt-1 text-xs text-white/55">{step.value}</p>
									</div>
								</li>
							))}
						</ol>
					</section>

					<section className="rounded-2xl border border-line bg-paper p-5 shadow-sm">
						<div className="flex items-center gap-2">
							<UserRound className="size-4 text-orange-deep" />
							<h3 className="font-display font-bold text-ink">Assignment</h3>
						</div>
						<p className="mt-3 text-sm font-semibold text-ink">{order.assignedTo}</p>
						<div className="mt-4 flex items-center gap-2 text-xs text-ink-soft">
							<MapPin className="size-3.5" />
							{order.location}
						</div>
						<div className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
							<Clock className="size-3.5" />
							{order.scheduledFor}
						</div>
					</section>

					<Link to="/operations/value-added">
						<Button variant="outline" className="w-full">
							<ArrowLeft className="mr-2 size-4" />
							All service orders
						</Button>
					</Link>
				</aside>
			</div>
		</AppShell>
	);
}
