
import {
	Flame,
	Layers,
	Package,
	Scale,
	Sparkles,
	Tag,
	type LucideIcon,
} from "lucide-react";

export type ServiceKind =
	| "Palletisation"
	| "Repackaging"
	| "Labelling"
	| "Sorting"
	| "Fumigation"
	| "Weighing";

export type ServiceStatus =
	| "Scheduled"
	| "In progress"
	| "Awaiting verification"
	| "Completed"
	| "Cancelled";

export interface ServiceOrder {
	id: string;
	reference: string;
	kind: ServiceKind;
	status: ServiceStatus;
	container: string;
	containerRef: string;
	consignment: string;
	cargoOwner: string;
	location: string;
	scheduledFor: string;
	startedAt: string;
	completedAt: string;
	assignedTo: string;
	quantity: string;
	beforeValue: string;
	afterValue: string;
	chargeRef: string;
	tariffLine: string;
	notes: string;
	createdAt: string;
}

export const kindMeta: Record<
	ServiceKind,
	{ icon: LucideIcon; label: string; detail: string; tariffLine: string }
> = {
	Palletisation: {
		icon: Layers,
		label: "Palletisation",
		detail: "Consolidate loose cargo onto pallets for safe handling and storage.",
		tariffLine: "VAS-PAL-01",
	},
	Repackaging: {
		icon: Package,
		label: "Repackaging",
		detail: "Replace damaged packaging, reseal, or consolidate into new cartons.",
		tariffLine: "VAS-RPK-02",
	},
	Labelling: {
		icon: Tag,
		label: "Labelling",
		detail: "Apply marks, barcodes, warning labels, or customer-specific identifiers.",
		tariffLine: "VAS-LBL-04",
	},
	Sorting: {
		icon: Sparkles,
		label: "Sorting",
		detail: "Segregate by consignee, SKU, destination, or handling requirements.",
		tariffLine: "VAS-SRT-05",
	},
	Fumigation: {
		icon: Flame,
		label: "Fumigation coordination",
		detail: "Coordinate fumigation with the licensed operator and record the certificate.",
		tariffLine: "VAS-FUM-03",
	},
	Weighing: {
		icon: Scale,
		label: "Weighing",
		detail: "Record gross or net weights on the terminal weighbridge.",
		tariffLine: "VAS-WGH-02",
	},
};

export const serviceKinds = Object.keys(kindMeta) as ServiceKind[];

export const statusFilters: (ServiceStatus | "all")[] = [
	"all",
	"Scheduled",
	"In progress",
	"Awaiting verification",
	"Completed",
	"Cancelled",
];

export const initialOrders: ServiceOrder[] = [
	{
		id: "sv-1",
		reference: "TRN-VAS-2026-00871",
		kind: "Palletisation",
		status: "In progress",
		container: "TRIU1234564",
		containerRef: "c-1",
		consignment: "TRN-IMP-002481",
		cargoOwner: "Atlantic Trade Nigeria Ltd",
		location: "Bond WH · Bay 2",
		scheduledFor: "24 Sep 2026 · 10:00",
		startedAt: "24 Sep 2026 · 10:12",
		completedAt: "—",
		assignedTo: "S. Eze · Yard officer",
		quantity: "48 cartons → 6 pallets",
		beforeValue: "Loose cartons",
		afterValue: "—",
		chargeRef: "CHG-PAL-2026-00871",
		tariffLine: "VAS-PAL-01",
		notes: "Consolidate loose cartons onto standard 120×100 pallets with stretch wrap.",
		createdAt: "24 Sep 2026 · 09:30",
	},
	{
		id: "sv-2",
		reference: "TRN-VAS-2026-00872",
		kind: "Weighing",
		status: "Awaiting verification",
		container: "CMAU4829106",
		containerRef: "c-2",
		consignment: "TRN-IMP-002482",
		cargoOwner: "Kano Freight Forwarders",
		location: "Weighbridge A",
		scheduledFor: "23 Sep 2026 · 11:00",
		startedAt: "23 Sep 2026 · 11:05",
		completedAt: "23 Sep 2026 · 11:20",
		assignedTo: "K. Lawal · Warehouse officer",
		quantity: "2 pallets",
		beforeValue: "Declared 1,180 kg",
		afterValue: "Recorded 1,204 kg",
		chargeRef: "CHG-WGH-2026-00872",
		tariffLine: "VAS-WGH-02",
		notes: "Gross weight recorded on terminal weighbridge. Discrepancy of +24 kg to be verified.",
		createdAt: "23 Sep 2026 · 10:45",
	},
	{
		id: "sv-3",
		reference: "TRN-VAS-2026-00873",
		kind: "Fumigation",
		status: "Scheduled",
		container: "MSCU9876540",
		containerRef: "c-3",
		consignment: "TRN-IMP-002483",
		cargoOwner: "Meridian Customs Services",
		location: "Quarantine Bay",
		scheduledFor: "25 Sep 2026 · 14:00",
		startedAt: "—",
		completedAt: "—",
		assignedTo: "Vendor: NAQS-certified operator",
		quantity: "1 container",
		beforeValue: "Pre-fumigation",
		afterValue: "—",
		chargeRef: "CHG-FUM-2026-00873",
		tariffLine: "VAS-FUM-03",
		notes: "Fumigation coordination with NAQS-certified operator. Certificate to be attached on completion.",
		createdAt: "24 Sep 2026 · 12:00",
	},
	{
		id: "sv-4",
		reference: "TRN-VAS-2026-00869",
		kind: "Labelling",
		status: "Completed",
		container: "TEMU3849204",
		containerRef: "c-4",
		consignment: "TRN-IMP-002483",
		cargoOwner: "Meridian Customs Services",
		location: "Bond WH · Bay 3",
		scheduledFor: "22 Sep 2026 · 09:00",
		startedAt: "22 Sep 2026 · 09:05",
		completedAt: "22 Sep 2026 · 10:40",
		assignedTo: "M. Adeyemi · Documentation desk",
		quantity: "85 pallets",
		beforeValue: "Unlabelled",
		afterValue: "Labelled with customer marks",
		chargeRef: "CHG-LBL-2026-00869",
		tariffLine: "VAS-LBL-04",
		notes: "Customer-specific barcodes applied and verified against the packing list.",
		createdAt: "22 Sep 2026 · 08:30",
	},
	{
		id: "sv-5",
		reference: "TRN-VAS-2026-00867",
		kind: "Sorting",
		status: "Completed",
		container: "OOLU2948108",
		containerRef: "c-5",
		consignment: "TRN-IMP-002485",
		cargoOwner: "Prime Haulage Ltd",
		location: "Bond WH · Bay 4",
		scheduledFor: "21 Sep 2026 · 13:00",
		startedAt: "21 Sep 2026 · 13:10",
		completedAt: "21 Sep 2026 · 15:30",
		assignedTo: "Warehouse team 01",
		quantity: "62 pallets",
		beforeValue: "Mixed consignee pallets",
		afterValue: "Segregated by consignee",
		chargeRef: "CHG-SRT-2026-00867",
		tariffLine: "VAS-SRT-05",
		notes: "Sorted by consignee into designated bays.",
		createdAt: "21 Sep 2026 · 12:30",
	},
];

const STORAGE_KEY = "trinu.operations.value-added.orders";

export function getOrders(): ServiceOrder[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return initialOrders;

		const parsed = JSON.parse(stored);
		return Array.isArray(parsed) ? parsed : initialOrders;
	} catch {
		return initialOrders;
	}
}

export function saveOrders(orders: ServiceOrder[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function getOrder(id: string) {
	return getOrders().find((order) => order.id === id) ?? null;
}

export function saveOrder(order: ServiceOrder) {
	const orders = getOrders();
	const next = [order, ...orders.filter((item) => item.id !== order.id)];
	saveOrders(next);
	return next;
}

export function updateOrder(id: string, changes: Partial<ServiceOrder>) {
	const orders = getOrders().map((order) =>
		order.id === id ? { ...order, ...changes } : order
	);
	saveOrders(orders);
	return orders;
}

export function createServiceReference(orders: ServiceOrder[]) {
	const nextNumber =
		Math.max(
			0,
			...orders.map((order) => {
				const value = Number(order.reference.split("-").pop());
				return Number.isFinite(value) ? value : 0;
			})
		) + 1;

	return `TRN-VAS-${new Date().getFullYear()}-${String(nextNumber).padStart(5, "0")}`;
}

export function formatNow() {
	return new Date().toLocaleString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}
