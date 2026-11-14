
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	Boxes,
	CalendarDays,
	Clock,
	FileText,
	MapPin,
	Package,
	Plus,
	RefreshCw,
	Truck,
	Warehouse,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { http, type Resp } from "@/lib/httpClient";

interface Movement {
	id: string;
	reference: string;
	type: string;
	fromLocation: string;
	fromLocationKind: string;
	toLocation: string;
	toLocationKind: string;
	remarks: string;
	equipment: {
		id: string | null;
		name: string | null;
		code: string | null;
		type: string | null;
	};
	movedBy: {
		id: string | null;
		name: string;
	};
	completedAt: string | null;
	createdAt: string | null;
}

interface InventoryNote {
	id: string;
	note: string;
	recordedBy: {
		id: string;
		name: string;
	};
	createdAt: string | null;
	updatedAt: string | null;
}

interface InventoryItem {
	id: string;
	sku: string;
	container: string;
	containerSize: string;
	sealNumber: string;
	description: string;
	consignee: string;
	kind: string;
	quantity: number;
	unit: string;
	weight: string;
	volume: string;
	location: string;
	locationCode: string;
	locationKind: string;
	consignment: string;
	billOfLading: string;
	shipmentReference: string;
	shipmentType: string;
	shipmentStatus: string;
	organisation: string;
	organisationId: string;
	receivedAt: string;
	gateInAt: string;
	storedAt: string;
	gateOutAt: string;
	createdAt: string;
	updatedAt: string;
	status: string;
	notes: InventoryNote[];
	itemQuantity: number;
	specialInstructions: string;
	movementHistory: Movement[];
	movementCount: number;
}

interface InventoryApiItem {
	id?: string;
	sku?: string;
	container?: string;
	containerSize?: string;
	sealNumber?: string;
	description?: string;
	consignee?: string;
	kind?: string;
	quantity?: number | string;
	unit?: string;
	weight?: string | number;
	volume?: string | number;
	location?: string;
	consignment?: string;
	billOfLading?: string;
	status?: string;
	receivedAt?: string;
	gateInAt?: string;
	storedAt?: string;
	gateOutAt?: string;
	createdAt?: string;
	updatedAt?: string;
	notes?: Array<{
		id?: string;
		note?: string;
		recordedBy?: { id?: string; name?: string };
		createdAt?: string | null;
		updatedAt?: string | null;
	}>;
	itemQuantity?: number | string;
	specialInstructions?: string;
	currentLocation?: {
		id?: string;
		code?: string;
		name?: string;
		kind?: string;
		label?: string;
	};
	shipment?: {
		id?: string;
		reference?: string;
		type?: string;
		billOfLading?: string;
		status?: string;
		organisationId?: string;
		organisationName?: string;
		consignee?: string;
	};
	cargo?: {
		description?: string;
		packageType?: string;
		packageCount?: number | string;
		itemQuantity?: number | string;
		unitOfMeasure?: string;
		grossWeight?: number | string;
		volume?: number | string;
		specialInstructions?: string;
	};
	movementHistory?: Movement[];
	movementCount?: number;
	[key: string]: unknown;
}

const mapInventory = (item: InventoryApiItem): InventoryItem => ({
	id: String(item.id ?? ""),
	sku: String(item.sku ?? item.container ?? ""),
	container: String(item.container ?? ""),
	containerSize: String(item.containerSize ?? ""),
	sealNumber: String(item.sealNumber ?? ""),
	description: String(item.description ?? item.cargo?.description ?? ""),
	consignee: String(item.consignee ?? item.shipment?.consignee ?? ""),
	kind: String(item.kind ?? item.cargo?.packageType ?? ""),
	quantity: Number(item.quantity ?? item.cargo?.packageCount ?? 0),
	unit: String(item.unit ?? item.cargo?.unitOfMeasure ?? ""),
	weight: String(item.weight ?? item.cargo?.grossWeight ?? ""),
	volume: String(item.volume ?? item.cargo?.volume ?? ""),
	location: String(item.location ?? item.currentLocation?.label ?? ""),
	locationCode: String(item.currentLocation?.code ?? ""),
	locationKind: String(item.currentLocation?.kind ?? ""),
	consignment: String(item.consignment ?? item.shipment?.reference ?? ""),
	billOfLading: String(item.billOfLading ?? item.shipment?.billOfLading ?? ""),
	shipmentReference: String(item.shipment?.reference ?? item.consignment ?? ""),
	shipmentType: String(item.shipment?.type ?? ""),
	shipmentStatus: String(item.shipment?.status ?? ""),
	organisation: String(item.shipment?.organisationName ?? ""),
	organisationId: String(item.shipment?.organisationId ?? ""),
	receivedAt: String(item.receivedAt ?? ""),
	gateInAt: String(item.gateInAt ?? ""),
	storedAt: String(item.storedAt ?? ""),
	gateOutAt: String(item.gateOutAt ?? ""),
	createdAt: String(item.createdAt ?? ""),
	updatedAt: String(item.updatedAt ?? ""),
	status: String(item.status ?? "Unknown"),
	notes: Array.isArray(item.notes)
		? item.notes.map((note, index) => ({
				id: String(note.id ?? index),
				note: String(note.note ?? ""),
				recordedBy: {
					id: String(note.recordedBy?.id ?? ""),
					name: String(note.recordedBy?.name ?? "Unknown user"),
				},
				createdAt: note.createdAt ? String(note.createdAt) : null,
				updatedAt: note.updatedAt ? String(note.updatedAt) : null,
			}))
		: [],
	itemQuantity: Number(item.itemQuantity ?? item.cargo?.itemQuantity ?? 0),
	specialInstructions: String(
		item.specialInstructions ?? item.cargo?.specialInstructions ?? ""
	),
	movementHistory: Array.isArray(item.movementHistory)
		? item.movementHistory
		: [],
	movementCount: Number(item.movementCount ?? item.movementHistory?.length ?? 0),
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

const formatDate = (value: string | null) => {
	if (!value) return "Not recorded";

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) return value;

	return date.toLocaleString();
};

const Detail = ({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: string | number;
	mono?: boolean;
}) => (
	<div>
		<dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-soft">
			{label}
		</dt>
		<dd className={`mt-1 break-words text-sm font-medium text-ink ${mono ? "font-mono" : ""}`}>
			{value || "—"}
		</dd>
	</div>
);

export default function OperationsInventoryDetailsPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [item, setItem] = useState<InventoryItem | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);
	const [notFound, setNotFound] = useState(false);
	const [showNoteEditor, setShowNoteEditor] = useState(false);
	const [noteDraft, setNoteDraft] = useState("");
	const [isLeaving, setIsLeaving] = useState(false);
	const [isSavingNote, setIsSavingNote] = useState(false);

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

	const handleBack = () => {
		setIsLeaving(true);
		window.setTimeout(() => navigate("/operations/inventory"), 180);
	};

	const handleAddNote = async () => {
		const note = noteDraft.trim();

		if (!note) {
			toast.error("Enter a note first.");
			return;
		}

		if (!id) {
			toast.error("Invalid inventory record.");
			return;
		}

		setIsSavingNote(true);

		try {
			const res = await http.post("/operations/inventory/note/", {
				id,
				note,
			});

			const resp: Resp = res.data;

			if (resp.error) {
				throw new Error("Could not save note.");
			}

			setNoteDraft("");
			setShowNoteEditor(false);
			await loadInventory();

			toast.success("Inventory note saved successfully.");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not save inventory note.");
		} finally {
			setIsSavingNote(false);
		}
	};

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
						<Button onClick={handleBack}>
							<ArrowLeft className="mr-2 size-4" />
							Back to inventory
						</Button>
					</div>
				</div>
			</AppShell>
		);
	}

	const displayStatus = getInventoryStatus(item.status);

	return (
		<AppShell title="Inventory details" eyebrow="Operations · Bonded warehouse">
			<motion.div
				initial={{ opacity: 0, x: 28 }}
				animate={{
					opacity: isLeaving ? 0 : 1,
					x: isLeaving ? -28 : 0,
				}}
				transition={{ duration: 0.18, ease: "easeInOut" }}
				className="space-y-5"
			>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<Button
							variant="ghost"
							className="-ml-3 text-ink-soft"
							onClick={handleBack}
						>
							<ArrowLeft className="mr-2 size-4" />
							Back to inventory
						</Button>

						<p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
							Inventory record
						</p>

						<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
							{item.container || item.sku}
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
						detail={item.locationKind || "Terminal location"}
						tone="success"
						icon={Warehouse}
					/>
					<Metric
						label="Movement records"
						value={String(item.movementCount)}
						detail="Recorded yard and warehouse movements"
						tone="info"
						icon={Truck}
					/>
				</div>

				<div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
					<div className="min-w-0 space-y-5">
						<section className="rounded-xl bg-paper ring-1 ring-line">
							<div className="border-b border-line p-5 sm:p-6">
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
									Container information
								</p>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									{item.container || item.sku}
								</h3>
								<p className="mt-1 text-sm text-ink-soft">
									{item.description || "No cargo description provided."}
								</p>
							</div>

							<div className="p-5 sm:p-6">
								<dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
									<Detail label="Container number" value={item.container} mono />
									<Detail label="Container size" value={item.containerSize} mono />
									<Detail label="Seal number" value={item.sealNumber} mono />
									<Detail label="Cargo type" value={item.kind} />
									<Detail label="Cargo description" value={item.description} />
									<Detail label="Quantity" value={`${item.quantity} ${item.unit}`} mono />
									<Detail label="Item quantity" value={item.itemQuantity} mono />
									<Detail label="Gross weight" value={item.weight} mono />
									<Detail label="Volume" value={item.volume} mono />
									<Detail label="Consignee" value={item.consignee} />
									<Detail label="Shipment reference" value={item.shipmentReference} mono />
									<Detail label="Bill of lading" value={item.billOfLading} mono />
									<Detail label="Shipment type" value={item.shipmentType} />
									<Detail label="Shipment status" value={getInventoryStatus(item.shipmentStatus || "Unknown")} />
									<Detail label="Organisation" value={item.organisation} />
									<Detail label="Organisation ID" value={item.organisationId} mono />
									<Detail label="Current location" value={item.location} />
									<Detail label="Location code" value={item.locationCode} mono />
									<Detail label="Location type" value={item.locationKind} />
									<Detail label="Container status" value={displayStatus} />
								</dl>
							</div>
						</section>

						<section className="rounded-xl bg-paper ring-1 ring-line">
							<div className="border-b border-line p-5 sm:p-6">
								<div className="flex items-center gap-2">
									<FileText className="size-4 text-orange-deep" />
									<h3 className="font-display text-lg font-bold text-ink">
										Cargo instructions
									</h3>
								</div>
							</div>
							<div className="p-5 sm:p-6">
								<p className="text-sm leading-6 text-ink">
									{item.specialInstructions || "No special instructions recorded."}
								</p>
							</div>
						</section>

						<section className="rounded-xl bg-paper ring-1 ring-line">
							<div className="border-b border-line p-5 sm:p-6">
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div>
										<h3 className="font-display text-lg font-bold text-ink">
											Terminal timeline
										</h3>
										<p className="mt-1 text-xs text-ink-soft">
											Key container timestamps recorded by the terminal
										</p>
									</div>
									<CalendarDays className="size-5 text-orange-deep" />
								</div>
							</div>

							<div className="grid gap-6 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
								<Detail label="Gate in" value={formatDate(item.gateInAt)} />
								<Detail label="Received" value={formatDate(item.receivedAt)} />
								<Detail label="Stored" value={formatDate(item.storedAt)} />
								<Detail label="Gate out" value={formatDate(item.gateOutAt)} />
								<Detail label="Record created" value={formatDate(item.createdAt)} />
								<Detail label="Last updated" value={formatDate(item.updatedAt)} />
							</div>
						</section>

						<section className="rounded-xl bg-paper ring-1 ring-line">
							<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5 sm:p-6">
								<div>
									<h3 className="font-display text-lg font-bold text-ink">
										Inventory notes
									</h3>
									<p className="mt-1 text-xs text-ink-soft">
										Operational notes for this container
									</p>
								</div>

								<Button
									size="sm"
									onClick={() => setShowNoteEditor((current) => !current)}
								>
									{showNoteEditor ? (
										<X className="mr-1.5 size-4" />
									) : (
										<Plus className="mr-1.5 size-4" />
									)}
									{showNoteEditor ? "Close" : "Add note"}
								</Button>
							</div>

							<div className="space-y-4 p-5 sm:p-6">
								{showNoteEditor && (
									<div className="space-y-3 rounded-lg bg-sand p-4 ring-1 ring-line">
										<label className="text-xs font-semibold text-ink">
											New note
										</label>
										<textarea
											value={noteDraft}
											onChange={(event) => setNoteDraft(event.target.value)}
											placeholder="Enter an operational note..."
											rows={4}
											className="w-full resize-y rounded-md border border-line bg-paper p-3 text-sm text-ink outline-none transition-colors focus:border-orange"
										/>
										<div className="flex justify-end gap-2">
											<Button
												variant="outline"
												onClick={() => {
													setShowNoteEditor(false);
													setNoteDraft("");
												}}
											>
												Cancel
											</Button>
											<Button onClick={handleAddNote} disabled={isSavingNote}>
												{isSavingNote ? (
													<>
														<RefreshCw className="mr-1.5 size-4 animate-spin" />
														Saving...
													</>
												) : (
													<>
														<Plus className="mr-1.5 size-4" />
														Add note
													</>
												)}
											</Button>
										</div>
									</div>
								)}

								{item.notes.length > 0 ? (
									<div className="space-y-3">
										{item.notes.map((note) => (
											<article
												key={note.id}
												className="rounded-lg bg-sand p-4 ring-1 ring-line"
											>
												<p className="whitespace-pre-wrap text-sm leading-6 text-ink">
													{note.note}
												</p>
												<div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[11px] text-ink-soft">
													<span className="font-medium text-ink">
														{note.recordedBy?.name || "Unknown user"}
													</span>
													<span className="flex flex-wrap items-center gap-2">
														<span className="flex items-center gap-1">
															<Clock className="size-3.5" />
															{formatDate(note.createdAt)}
														</span>
														{note.updatedAt && note.updatedAt !== note.createdAt && (
															<span>Updated {formatDate(note.updatedAt)}</span>
														)}
													</span>
												</div>
											</article>
										))}
									</div>
								) : (
									<p className="py-4 text-center text-sm text-ink-soft">
										No inventory notes recorded.
									</p>
								)}
							</div>
						</section>
					</div>

					<aside className="min-w-0 lg:sticky lg:top-6">
						<section className="overflow-hidden rounded-xl bg-[#4B4F55] text-white shadow-sm">
							<div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
								<div>
									<h3 className="font-display text-base font-bold text-white">
										Container movement
									</h3>
									<p className="mt-1 text-xs text-white/60">
										Recorded movement timeline
									</p>
								</div>
								<span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/50">
									Operational state
								</span>
							</div>

							{item.movementHistory.length === 0 ? (
								<div className="px-5 py-8 text-center">
									<MapPin className="mx-auto size-6 text-white/40" />
									<p className="mt-3 text-sm font-medium text-white/80">
										No movement recorded
									</p>
									<p className="mt-1 text-xs text-white/50">
										Container movements will appear here when recorded.
									</p>
								</div>
							) : (
								<div className="px-5 py-5">
									<ol className="relative space-y-0">
										{[...item.movementHistory].reverse().map((movement, index, history) => {
											const isLatest = index === history.length - 1;
											const movementLabel =
												movement.type === "YARD"
													? "Yard movement"
													: movement.type === "WAREHOUSE"
														? "Warehouse movement"
														: movement.type
																.split("_")
																.map((part) => part.charAt(0) + part.slice(1).toLowerCase())
																.join(" ");

											return (
												<li
													key={`${movement.type}-${movement.id}`}
													className="relative flex gap-3 pb-6 last:pb-0"
												>
													{!isLatest && (
														<span className="absolute left-[11px] top-6 h-full w-px bg-white/15" />
													)}
													<span className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FF6900] text-white">
														{isLatest ? (
															<span className="text-[10px] font-bold">
																{index + 1}
															</span>
														) : (
															<span className="text-sm leading-none">✓</span>
														)}
													</span>
													<div className="min-w-0 flex-1 pt-0.5">
														<p
															className={`text-sm font-semibold ${
																isLatest ? "text-[#FF8A38]" : "text-white"
															}`}
														>
															{movementLabel}
														</p>
														<p className="mt-1 break-words text-xs leading-5 text-white/75">
															{movement.fromLocation || "Origin not recorded"}
															<span className="px-1 text-white/40">→</span>
															{movement.toLocation || "Destination not recorded"}
														</p>
														<p className="mt-1 text-[11px] text-white/50">
															{formatDate(movement.completedAt || movement.createdAt)}
														</p>
														<div className="mt-2 space-y-1 text-[11px] text-white/55">
															{movement.movedBy?.name && (
																<p>Moved by: {movement.movedBy.name}</p>
															)}
															{movement.equipment?.name && (
																<p>
																	Equipment: {movement.equipment.name}
																	{movement.equipment.code
																		? ` · ${movement.equipment.code}`
																		: ""}
																</p>
															)}
															{movement.remarks && (
																<p className="break-words">
																	Remarks: {movement.remarks}
																</p>
															)}
														</div>
													</div>
												</li>
											);
										})}
									</ol>
								</div>
							)}
						</section>
					</aside>
				</div>
			</motion.div>
		</AppShell>
	);
}
