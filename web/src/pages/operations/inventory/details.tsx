
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "@/components/router-link";
import {
	ArrowLeft,
	Boxes,
	Package,
	RefreshCw,
	Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { http, type Resp } from "@/lib/httpClient";

interface InventoryItem {
	id: string;
	sku: string;
	description: string;
	consignee: string;
	kind: string;
	quantity: number;
	unit: string;
	weight: string;
	volume: string;
	location: string;
	consignment: string;
	container: string;
	receivedAt: string;
	status: string;
	notes: string;
}

interface InventoryApiItem {
	id?: string;
	sku?: string;
	description?: string;
	consignee?: string;
	kind?: string;
	quantity?: number | string;
	unit?: string;
	weight?: string | number;
	volume?: string | number;
	location?: string;
	consignment?: string;
	container?: string;
	receivedAt?: string;
	received_at?: string;
	status?: string;
	notes?: string;
	[key: string]: unknown;
}

const mapInventory = (item: InventoryApiItem): InventoryItem => ({
	id: String(item.id ?? ""),
	sku: String(item.sku ?? ""),
	description: String(item.description ?? ""),
	consignee: String(item.consignee ?? ""),
	kind: String(item.kind ?? ""),
	quantity: Number(item.quantity ?? 0),
	unit: String(item.unit ?? ""),
	weight: String(item.weight ?? ""),
	volume: String(item.volume ?? ""),
	location: String(item.location ?? ""),
	consignment: String(item.consignment ?? ""),
	container: String(item.container ?? ""),
	receivedAt: String(item.receivedAt ?? item.received_at ?? ""),
	status: String(item.status ?? "Unknown"),
	notes: String(item.notes ?? ""),
});

const getInventoryStatus = (status: string) => {
	const normalized = status.toUpperCase();

	if (["IN_YARD", "IN_WAREHOUSE"].includes(normalized)) {
		return "In Storage";
	}

	if (
		[
			"EXAMINATION_SCHEDULED",
			"UNDER_EXAMINATION",
			"EXAMINATION_COMPLETE",
		].includes(normalized)
	) {
		return "In Examination";
	}

	if (normalized === "EXAMINATION_REJECTED") {
		return "Examination Rejected";
	}

	return normalized
		.split("_")
		.map((word) => word.charAt(0) + word.slice(1).toLowerCase())
		.join(" ");
};

export default function OperationsInventoryDetailsPage() {
	const { id } = useParams<{ id: string }>();
	const [item, setItem] = useState<InventoryItem | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);
	const [notFound, setNotFound] = useState(false);

	const loadInventory = useCallback(async () => {
		if (!id) {
			setNotFound(true);
			setLoading(false);
			return;
		}

		setLoading(true);
		setLoadError(false);
		setNotFound(false);

		try {
			const res = await http.get(`/operations/inventory/${id}/`);
			const resp: Resp = res.data;

			if (resp.error) {
				throw new Error("Could not load inventory record.");
			}

			if (!resp.data || typeof resp.data !== "object") {
				setNotFound(true);
				setItem(null);
				return;
			}

			const record = resp.data as InventoryApiItem;

			if (!record.id) {
				setNotFound(true);
				setItem(null);
				return;
			}

			setItem(mapInventory(record));
		} catch {
			setLoadError(true);
			setItem(null);
			toast.error("Could not load inventory details.");
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		loadInventory();
	}, [loadInventory]);

	if (loading) {
		return (
			<AppShell title="Inventory details" eyebrow="Operations · Inventory">
				<div className="flex flex-col items-center justify-center rounded-xl bg-paper p-12 ring-1 ring-line">
					<RefreshCw className="size-7 animate-spin text-ink-soft" />
					<p className="mt-3 text-sm font-medium text-ink">
						Loading inventory details...
					</p>
				</div>
			</AppShell>
		);
	}

	if (loadError || notFound || !item) {
		return (
			<AppShell title="Inventory details" eyebrow="Operations · Inventory">
				<div className="rounded-xl bg-paper p-10 text-center ring-1 ring-line">
					<Package className="mx-auto size-8 text-ink-soft" />

					<h2 className="mt-3 font-display text-xl font-bold text-ink">
						{loadError
							? "Could not load inventory record"
							: "Inventory record not found"}
					</h2>

					<p className="mt-2 text-sm text-ink-soft">
						{loadError
							? "Check your connection and try again."
							: "The inventory record may have been removed or the address may be incorrect."}
					</p>

					<div className="mt-5 flex flex-wrap justify-center gap-2">
						{loadError && (
							<Button variant="outline" onClick={loadInventory}>
								<RefreshCw className="mr-2 size-4" />
								Retry
							</Button>
						)}

						<Button asChild>
							<Link to="/operations/inventory">
								<ArrowLeft className="mr-2 size-4" />
								Back to inventory
							</Link>
						</Button>
					</div>
				</div>
			</AppShell>
		);
	}

	const displayStatus = getInventoryStatus(item.status);

	return (
		<AppShell title="Inventory details" eyebrow="Operations · Bonded warehouse">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<Button asChild variant="ghost" className="-ml-3 text-ink-soft">
						<Link to="/operations/inventory">
							<ArrowLeft className="mr-2 size-4" />
							Back to inventory
						</Link>
					</Button>

					<p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
						Inventory record
					</p>

					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						{item.container}
					</h2>

					<p className="mt-1 text-sm text-ink-soft">
						{item.description}
					</p>
				</div>

				<StatusBadge
					label={displayStatus}
					tone={statusTone(displayStatus)}
				/>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
				<Metric
					label="Quantity"
					value={`${item.quantity} ${item.unit}`}
					detail={item.kind}
					tone="info"
					icon={Boxes}
				/>

				<Metric
					label="Current location"
					value={item.location || "Not assigned"}
					detail="Recorded terminal location"
					tone="success"
					icon={Warehouse}
				/>

				<Metric
					label="Received"
					value={item.receivedAt || "Not recorded"}
					detail="Terminal receiving date"
					tone="info"
					icon={Package}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5 sm:p-6">
					<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
						Stock line
					</p>

					<h3 className="mt-1 font-display text-xl font-bold text-ink">
						{item.sku}
					</h3>

					<p className="mt-1 text-sm text-ink-soft">
						{item.description}
					</p>
				</div>

				<div className="p-5 sm:p-6">
					<dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
						{[
							["SKU", item.sku, true],
							["Description", item.description, false],
							["Cargo type", item.kind, false],
							["Quantity", `${item.quantity} ${item.unit}`, true],
							["Weight", item.weight, true],
							["Volume", item.volume, true],
							["Current location", item.location || "Not assigned", false],
							["Consignment", item.consignment, true],
							["Container number", item.container, true],
							["Consignee", item.consignee, false],
							["Received date", item.receivedAt || "Not recorded", true],
							["Status", displayStatus, false],
						].map(([label, value, mono]) => (
							<div key={String(label)}>
								<dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-soft">
									{label}
								</dt>

								<dd
									className={`mt-1 text-sm font-medium text-ink ${
										mono ? "font-mono" : ""
									}`}
								>
									{String(value || "—")}
								</dd>
							</div>
						))}
					</dl>

					<div className="mt-8 rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-soft">
							Inventory notes
						</p>

						<p className="mt-2 text-sm leading-6 text-ink-soft">
							{item.notes || "No inventory notes recorded."}
						</p>
					</div>
				</div>
			</section>
		</AppShell>
	);
}
