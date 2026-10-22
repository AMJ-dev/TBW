import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
	AlertTriangle,
	ArrowLeft,
	Check,
	ClipboardCheck,
	FileText,
	Info,
	Loader2,
	Mail,
	Send,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";

type ManifestStatus =
	| "Pre-advice"
	| "Review required"
	| "Validated"
	| "Received"
	| "Discrepancy"
	| "Duplicate";

type IntakeSource = "EDI" | "CSV" | "XLSX" | "Manual";

type ConsigneeStatus = "linked" | "unregistered";

interface ManifestRecord {
	id: string;
	manifestRef: string;
	bl: string;
	vessel: string;
	shippingLine: string;
	originPort: string;
	eta: string;
	containers: number;
	packages: number;
	grossWeight: string;
	consignee: string;
	consigneeOrganisationId?: string | null;
	consigneeStatus?: ConsigneeStatus;
	consigneeEmail?: string | null;
	consigneePhone?: string | null;
	consigneeAddress?: string | null;
	agent: string;
	source: IntakeSource;
	status: ManifestStatus;
	receivedAt: string;
	notes: string;
	shipmentReference?: string;
	shipmentReferences?: string;
	matchedShipmentId?: string | null;
}

const labelClass =
	"block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const textareaClass =
	"mt-1.5 w-full resize-y rounded-md border border-line bg-sand px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:ring-2 focus:ring-orange/30";

const formatStatus = (status: string) =>
	status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const extractList = <T,>(payload: any): T[] => {
	if (Array.isArray(payload)) return payload as T[];
	if (Array.isArray(payload?.results)) return payload.results as T[];
	if (Array.isArray(payload?.data)) return payload.data as T[];
	return [];
};

const normalizeRecord = (m: any): ManifestRecord => ({
	id: m.id,
	manifestRef: m.manifest_ref ?? m.manifestRef ?? "—",
	bl: m.bl ?? m.bill_of_lading ?? "—",
	vessel: m.vessel ?? "—",
	shippingLine: m.shipping_line ?? m.shippingLine ?? "—",
	originPort: m.origin_port ?? m.originPort ?? "—",
	eta: m.eta ?? "—",
	containers: Number(m.containers ?? 0),
	packages: Number(m.packages ?? 0),
	grossWeight: m.gross_weight ?? m.grossWeight ?? "—",
	consignee: m.consignee ?? "—",
	consigneeOrganisationId: m.consignee_organisation_id ?? null,
	consigneeStatus: (m.consignee_status ?? "unregistered") as ConsigneeStatus,
	consigneeEmail: m.consignee_email ?? null,
	consigneePhone: m.consignee_phone ?? null,
	consigneeAddress: m.consignee_address ?? null,
	agent: m.agent ?? "—",
	source: (m.source ?? "Manual") as IntakeSource,
	status: (String(m.status ?? "Pre-advice").toLowerCase() === "review_required" ||
	String(m.status ?? "").toLowerCase() === "review required"
		? "Review required"
		: m.status ?? "Pre-advice") as ManifestStatus,
	receivedAt: m.received_at ?? m.receivedAt ?? "—",
	notes: m.notes ?? "",
	shipmentReference: m.shipment_reference ?? "",
	shipmentReferences: m.shipment_reference ?? m.shipment_bill_of_lading ?? "",
	matchedShipmentId: m.matched_shipment_id ?? null,
});

export default function OperationsManifestDetailsPage() {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();

	const [manifest, setManifest] = useState<ManifestRecord | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [actioning, setActioning] = useState(false);

	const [shipmentQuery, setShipmentQuery] = useState("");
	const [shipmentResults, setShipmentResults] = useState<any[]>([]);
	const [matchSuggestions, setMatchSuggestions] = useState<any[]>([]);
	const [loadingSuggestions, setLoadingSuggestions] = useState(false);
	const [shipmentId, setShipmentId] = useState("");
	const [matchReason, setMatchReason] = useState("");
	const [searchingShipments, setSearchingShipments] = useState(false);
	const [matchingShipment, setMatchingShipment] = useState(false);

	const [flagDialogOpen, setFlagDialogOpen] = useState(false);
	const [flagReason, setFlagReason] = useState("");
	const [responsibleParty, setResponsibleParty] = useState<
		"" | "Organisation" | "Operations"
	>("");
	const [submittingFlag, setSubmittingFlag] = useState(false);

	const [linkedShipment, setLinkedShipment] = useState<any>(null);
	const [loadingLinkedShipment, setLoadingLinkedShipment] = useState(false);
	const [linkedShipmentError, setLinkedShipmentError] = useState("");

	const [inviteEmail, setInviteEmail] = useState("");
	const [inviting, setInviting] = useState(false);

	const fetchManifest = async () => {
		if (!id) return;
		setLoading(true);
		setError("");
		try {
			const res = await http.get(`operations/manifests/details/${id}/`);
			const resp: Resp = res.data;
			if (resp.error) {
				setError(
					typeof resp.data === "string"
						? resp.data
						: "Could not load this manifest."
				);
				return;
			}
			const payload: any = resp.code ?? {};
			const record = payload.manifest ?? payload.data ?? payload;
			if (!record || typeof record !== "object") {
				setError("Manifest record is empty.");
				return;
			}
			const normalized = normalizeRecord(record);
			setManifest(normalized);
			setShipmentQuery(normalized.bl);
			setInviteEmail(normalized.consigneeEmail ?? "");
		} catch (err: any) {
			setError(
				err?.response?.data?.message ||
					err?.response?.data?.data ||
					"Could not load this manifest."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchManifest();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	useEffect(() => {
		const q = shipmentQuery.trim();
		if (q.length < 2) {
			setShipmentResults([]);
			return;
		}
		let cancelled = false;
		const timer = window.setTimeout(async () => {
			setSearchingShipments(true);
			try {
				const res = await http.post(`operations/manifests/shipments/`, { q });
				const resp: Resp = res.data;
				if (!cancelled)
					setShipmentResults(resp.error ? [] : extractList<any>(resp.code));
			} catch {
				if (!cancelled) setShipmentResults([]);
			} finally {
				if (!cancelled) setSearchingShipments(false);
			}
		}, 300);
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [shipmentQuery]);

	useEffect(() => {
		if (!manifest?.id) return;
		let cancelled = false;
		(async () => {
			setLoadingSuggestions(true);
			try {
				const res = await http.post("operations/manifests/suggestions/", {
					manifest_id: manifest.id,
				});
				const resp: Resp = res.data;
				if (!cancelled)
					setMatchSuggestions(
						resp.error
							? []
							: extractList<any>(
									(resp.code as any)?.suggestions ?? resp.code
							  )
					);
			} catch {
				if (!cancelled) setMatchSuggestions([]);
			} finally {
				if (!cancelled) setLoadingSuggestions(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [manifest?.id]);

	const isShipmentLinked = Boolean(
		(manifest?.shipmentReference && manifest.shipmentReference.trim()) ||
			(manifest?.shipmentReferences && manifest.shipmentReferences.trim())
	);
	const canChangeLink = manifest?.status === "Pre-advice";
	const correctionSubmitted = manifest?.status === "Review required";
	const canValidate = isShipmentLinked && (canChangeLink || correctionSubmitted);
	const canFlag = isShipmentLinked && (canChangeLink || correctionSubmitted);

	useEffect(() => {
		let cancelled = false;
		if (!isShipmentLinked || !manifest?.matchedShipmentId) {
			setLinkedShipment(null);
			setLinkedShipmentError("");
			return;
		}
		(async () => {
			setLoadingLinkedShipment(true);
			setLinkedShipmentError("");
			try {
				const res = await http.get(`operations/manifests/review/details/${manifest.matchedShipmentId}/`);
				const resp: Resp = res.data;
				if (resp.error)
					throw new Error(
						String(resp.data || "Could not load linked shipment details.")
					);
				if (!cancelled)
					setLinkedShipment((resp.code as any)?.shipment ?? resp.code ?? null);
			} catch (err: any) {
				if (!cancelled)
					setLinkedShipmentError(
						err?.response?.data?.data ||
							err?.message ||
							"Could not load linked shipment details."
					);
			} finally {
				if (!cancelled) setLoadingLinkedShipment(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [
		manifest?.id,
		manifest?.matchedShipmentId,
		manifest?.shipmentReference,
		manifest?.shipmentReferences,
		isShipmentLinked,
	]);

	const handleValidate = async () => {
		if (!manifest) return;
		setActioning(true);
		try {
			const res = await http.post(`operations/manifests/validate/${manifest.id}/`);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not validate the manifest.");
				return;
			}
			toast.success("Manifest marked as validated.");
			setManifest((current) =>
				current ? { ...current, status: "Validated" } : current
			);
			await fetchManifest();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not validate the manifest."
			);
		} finally {
			setActioning(false);
		}
	};

	const handleFlag = async (
		reason: string,
		party: "Organisation" | "Operations" | ""
	) => {
		if (!manifest) return false;
		setActioning(true);
		try {
			const res = await http.post(`operations/manifests/flag/${manifest.id}/`, {
				reason: reason.trim(),
				responsible_party: party,
			});
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not flag the manifest.");
				return false;
			}
			toast.success("Manifest flagged for review.");
			await fetchManifest();
			return true;
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not flag the manifest."
			);
			return false;
		} finally {
			setActioning(false);
		}
	};

	const handleMatch = async (selectedShipmentId: string, reason: string) => {
		if (!manifest) return false;
		if (manifest.status !== "Pre-advice") {
			toast.error(
				"The shipment link can only be changed while the manifest is in Pre-advice."
			);
			return false;
		}
		setMatchingShipment(true);
		try {
			const res = await http.post(`operations/manifests/match/`, {
				manifest_id: manifest.id,
				shipment_id: selectedShipmentId,
				reason,
			});
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not link shipment declaration.");
				return false;
			}
			toast.success(resp.data || "Shipment declaration linked.");
			setManifest((current) =>
				current
					? {
							...current,
							matchedShipmentId: selectedShipmentId,
							shipmentReference:
								current.shipmentReference || selectedShipmentId,
							shipmentReferences:
								current.shipmentReferences ||
								current.shipmentReference ||
								selectedShipmentId,
					  }
					: current
			);
			await fetchManifest();
			return true;
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not link shipment declaration."
			);
			return false;
		} finally {
			setMatchingShipment(false);
		}
	};

	const handleSendInvite = async () => {
		if (!manifest) return;
		if (!inviteEmail.trim()) {
			toast.error("Enter an email address to send the invite.");
			return;
		}
		setInviting(true);
		try {
			const res = await http.post("operations/manifests/invite-consignee/", {
				manifest_id: manifest.id,
				email: inviteEmail.trim(),
			});
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not send the invite.");
				return;
			}
			toast.success(`Onboarding invite sent to ${inviteEmail.trim()}.`);
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not send the invite."
			);
		} finally {
			setInviting(false);
		}
	};

	const handleCopyInviteLink = async () => {
		if (!manifest) return;
		try {
			const res = await http.post("operations/manifests/invite-link/", {
				manifest_id: manifest.id,
			});
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not generate invite link.");
				return;
			}
			const payload: any = resp.code ?? {};
			const link = payload.link ?? payload.url ?? "";
			if (!link) {
				toast.error("Invite link was empty.");
				return;
			}
			await navigator.clipboard.writeText(link);
			toast.success("Invite link copied to clipboard.");
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not generate invite link."
			);
		}
	};

	if (loading) {
		return (
			<AppShell title="Manifest details" eyebrow="Operations · Inbound">
				<div className="flex items-center gap-2 rounded-2xl bg-paper p-5 ring-1 ring-line">
					<Loader2 className="size-4 animate-spin text-orange" />
					<span className="text-sm text-ink-soft">Loading manifest…</span>
				</div>
			</AppShell>
		);
	}

	if (error || !manifest) {
		return (
			<AppShell title="Manifest details" eyebrow="Operations · Inbound">
				<div className="space-y-4 rounded-2xl bg-paper p-6 ring-1 ring-line">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load this manifest
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">
								{error || "The manifest may have been removed."}
							</p>
						</div>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							onClick={() => void fetchManifest()}
							className="bg-orange text-white hover:bg-orange-deep"
						>
							Try again
						</Button>
						<Button
							variant="outline"
							className="border-line bg-paper text-ink hover:bg-sand"
							onClick={() => navigate("/operations/manifest")}
						>
							Back to manifests
						</Button>
					</div>
				</div>
			</AppShell>
		);
	}

	const isUnregistered = manifest.consigneeStatus === "unregistered";

	return (
		<AppShell title="Manifest details" eyebrow="Operations · Inbound">
			<div
				className="space-y-5 pb-24"
				style={{
					animation: "slideInFromRight 260ms cubic-bezier(0.32, 0.72, 0, 1)",
				}}
			>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Button
						variant="ghost"
						onClick={() => navigate("/operations/manifest")}
						disabled={actioning}
						className="-ml-3 gap-2 text-ink-soft hover:text-ink"
					>
						<ArrowLeft className="size-4" />
						Back to manifests
					</Button>
				</div>

				<div className="rounded-2xl bg-paper shadow-sm ring-1 ring-line">
					<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
						<div className="min-w-0">
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								Manifest record
							</p>
							<h3 className="mt-1 break-words font-display text-xl font-bold text-ink">
								{manifest.manifestRef}
							</h3>
							<p className="mt-1 text-[12px] text-ink-soft">
								Received {manifest.receivedAt} via {manifest.source}
							</p>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => navigate("/operations/manifest")}
							disabled={actioning}
							aria-label="Close manifest details"
						>
							<X />
						</Button>
					</div>

					<div className="space-y-4 p-5 sm:p-6">
						<div className="flex flex-wrap items-center gap-2">
							<StatusBadge
								label={manifest.status}
								tone={statusTone(manifest.status)}
							/>
							{correctionSubmitted && (
								<span className="rounded bg-teal/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-teal-deep ring-1 ring-teal/25">
									Organisation resubmitted · Review required
								</span>
							)}
							<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
								{manifest.source}
							</span>
							{manifest.status === "Duplicate" && (
								<span className="rounded bg-coral/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-coral">
									Duplicate detected
								</span>
							)}
							{isUnregistered && (
								<span className="rounded bg-amber/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-orange-deep ring-1 ring-orange/25">
									Consignee not yet in TRÏNŪ
								</span>
							)}
						</div>

						<div
							className={cn(
								"rounded-xl border p-4",
								isShipmentLinked
									? "border-teal/25 bg-teal/5"
									: "border-orange/30 bg-orange/5"
							)}
						>
							<div className="flex items-start gap-3">
								<span
									className={cn(
										"grid size-9 shrink-0 place-items-center rounded-lg",
										isShipmentLinked
											? "bg-teal/10 text-teal-deep"
											: "bg-orange/10 text-orange-deep"
									)}
								>
									{isShipmentLinked ? (
										<Check className="size-4" />
									) : (
										<Info className="size-4" />
									)}
								</span>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold text-ink">
										{isShipmentLinked
											? "Shipment declaration linked"
											: "Step 1 of 2: Link a shipment declaration"}
									</p>
									<p className="mt-1 text-xs leading-5 text-ink-soft">
										{isShipmentLinked
											? `Linked shipment: ${
													manifest.shipmentReferences ||
													manifest.shipmentReference
											  }. You can now complete the checks and validate or flag this manifest if needed.`
											: "You must link this manifest to the correct shipment declaration before you can validate it or flag it for review. Choose a suggested match or search for a declaration below."}
									</p>
									{!isShipmentLinked && (
										<p className="mt-2 text-[11px] font-medium text-orange-deep">
											Validation and flagging are locked until a shipment is
											linked.
										</p>
									)}
								</div>
							</div>
						</div>

						{isShipmentLinked && (
							<section className="space-y-4 rounded-xl border border-teal/25 bg-paper p-4 sm:p-5">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal-deep">
											Linked declaration
										</p>
										<h4 className="mt-1 text-base font-bold text-ink">
											{linkedShipment?.shipment_reference ||
												manifest.shipmentReferences ||
												manifest.shipmentReference}
										</h4>
										<p className="mt-1 text-xs text-ink-soft">
											Review declaration fields, container seals and uploaded
											documents before validating or flagging.
										</p>
									</div>
									{loadingLinkedShipment && (
										<Loader2 className="size-4 animate-spin text-teal-deep" />
									)}
								</div>
								{linkedShipmentError ? (
									<div className="rounded-lg border border-coral/20 bg-coral/5 p-3 text-xs text-coral">
										{linkedShipmentError} Ensure the operations linked-shipment
										details endpoint is configured.
									</div>
								) : loadingLinkedShipment && !linkedShipment ? (
									<p className="text-xs text-ink-soft">
										Loading shipment declaration, containers and documents…
									</p>
								) : linkedShipment ? (
									<>
										<dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
											{[
												[
													"Organisation",
													linkedShipment.organisation_name ||
														linkedShipment.organisation?.name,
												],
												["Shipment status", formatStatus(linkedShipment.status)],
												[
													"Bill of lading",
													linkedShipment.bill_of_lading || linkedShipment.bl,
												],
												["Booking reference", linkedShipment.booking_reference],
												[
													"Vessel / voyage",
													[
														linkedShipment.vessel_name || linkedShipment.vessel,
														linkedShipment.voyage_number || linkedShipment.voyage,
													]
														.filter(Boolean)
														.join(" / "),
												],
												["Shipping line", linkedShipment.shipping_line],
												[
													"Origin",
													linkedShipment.origin_port || linkedShipment.origin,
												],
												[
													"Destination",
													linkedShipment.destination_port ||
														linkedShipment.destination,
												],
												[
													"Expected arrival",
													linkedShipment.expected_arrival || linkedShipment.eta,
												],
												[
													"Consignee",
													linkedShipment.consignee_name ||
														linkedShipment.consignee,
												],
												["Consignee email", linkedShipment.consignee_email],
												["Consignee phone", linkedShipment.consignee_phone],
												["Cargo description", linkedShipment.cargo_description],
												[
													"Packages",
													linkedShipment.package_count ?? linkedShipment.packages,
												],
												["Gross weight (KG)", linkedShipment.gross_weight],
												["Volume", linkedShipment.volume],
												["HS code", linkedShipment.hs_code],
												["Customs reference", linkedShipment.customs_reference],
											]
												.filter(
													([, value]) =>
														value !== null &&
														value !== undefined &&
														String(value).trim() !== ""
												)
												.map(([label, value]) => (
													<div
														key={String(label)}
														className="rounded-lg bg-sand/70 p-3"
													>
														<dt className="text-[10px] uppercase tracking-wide text-ink-soft">
															{label}
														</dt>
														<dd className="mt-1 break-words text-xs font-medium text-ink">
															{String(value)}
														</dd>
													</div>
												))}
										</dl>
										<div>
											<h5 className="mb-2 text-xs font-bold text-ink">
												Containers and seal numbers
											</h5>
											{(linkedShipment.containers || []).length ? (
												<div className="overflow-x-auto rounded-lg border border-line">
													<table className="w-full text-left text-xs">
														<thead className="bg-sand text-ink-soft">
															<tr>
																<th className="p-2.5">Container</th>
																<th className="p-2.5">Size</th>
																<th className="p-2.5">Seal no.</th>
																<th className="p-2.5">Packages</th>
																<th className="p-2.5">Gross weight</th>
															</tr>
														</thead>
														<tbody>
															{linkedShipment.containers.map(
																(c: any, i: number) => (
																	<tr
																		key={c.id || c.container_no || i}
																		className="border-t border-line"
																	>
																		<td className="p-2.5 font-mono">
																			{c.container_no || "—"}
																		</td>
																		<td className="p-2.5">
																			{c.size || c.container_size || "—"}
																		</td>
																		<td className="p-2.5">
																			{c.seal_no || "Not provided"}
																		</td>
																		<td className="p-2.5">
																			{c.package_count ?? "—"}
																		</td>
																		<td className="p-2.5">
																			{c.gross_weight ?? "—"}
																		</td>
																	</tr>
																)
															)}
														</tbody>
													</table>
												</div>
											) : (
												<p className="rounded-lg bg-sand p-3 text-xs text-ink-soft">
													No container rows were returned for this
													declaration.
												</p>
											)}
										</div>
										<div>
											<h5 className="mb-2 text-xs font-bold text-ink">
												Uploaded documents
											</h5>
											{(linkedShipment.documents || []).length ? (
												<div className="grid gap-2 sm:grid-cols-2">
													{linkedShipment.documents.map(
														(doc: any, i: number) => (
															<div
																key={doc.id || doc.file_path || i}
																className="flex items-start gap-3 rounded-lg border border-line p-3"
															>
																<FileText className="mt-0.5 size-4 shrink-0 text-orange" />
																<div className="min-w-0 flex-1">
																	<p className="break-words text-xs font-semibold text-ink">
																		{doc.original_name ||
																			doc.document_type ||
																			`Document ${i + 1}`}
																	</p>
																	<p className="mt-1 text-[10px] text-ink-soft">
																		{doc.document_type || "Document"}
																		{doc.file_size
																			? ` · ${Math.round(
																					Number(doc.file_size) / 1024
																			  )} KB`
																			: ""}
																		{doc.uploaded_at
																			? ` · ${doc.uploaded_at}`
																			: ""}
																	</p>
																	{(doc.url ||
																		doc.file_url ||
																		doc.file_path) && (
																		<a
																			href={
																				doc.url ||
																				doc.file_url ||
																				doc.file_path
																			}
																			target="_blank"
																			rel="noreferrer"
																			className="mt-2 inline-flex text-xs font-semibold text-teal-deep underline"
																		>
																			Open document
																		</a>
																	)}
																</div>
															</div>
														)
													)}
												</div>
											) : (
												<p className="rounded-lg bg-sand p-3 text-xs text-ink-soft">
													No documents were returned for this declaration.
												</p>
											)}
										</div>
									</>
								) : null}
							</section>
						)}

						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<p className="text-[12px] leading-6 text-ink-soft">
								{manifest.notes || "No additional notes for this manifest."}
							</p>
						</div>

						<dl className="grid gap-4 sm:grid-cols-2">
							{(
								[
									["Bill of lading", manifest.bl, true],
									["Vessel", manifest.vessel, false],
									["Shipping line", manifest.shippingLine, false],
									["Origin port", manifest.originPort, false],
									["ETA at terminal", manifest.eta, true],
									["Containers", String(manifest.containers), true],
									["Packages", String(manifest.packages), true],
									["Gross weight (KG)", manifest.grossWeight, true],
									["Consignee", manifest.consignee, false],
									["Licensed agent", manifest.agent, false],
								] as const
							).map(([label, value, mono]) => (
								<div key={label}>
									<dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-soft">
										{label}
									</dt>
									<dd
										className={cn(
											"mt-1 text-sm font-medium text-ink",
											mono && "font-mono"
										)}
									>
										{value}
									</dd>
								</div>
							))}
						</dl>

						{isUnregistered && (
							<div className="rounded-xl border border-orange/25 bg-orange/5 p-4">
								<div className="flex items-start gap-3">
									<Info className="mt-0.5 size-4 shrink-0 text-orange-deep" />
									<div className="min-w-0">
										<p className="text-[13px] font-semibold text-ink">
											Consignee not yet in TRÏNŪ
										</p>
										<p className="mt-1 text-[12px] leading-5 text-ink-soft">
											This consignee is recorded by the name on the manifest.
											You can continue with the shipment. Send them an
											onboarding invite so future shipments link
											automatically to their organisation account.
										</p>
										<div className="mt-3 space-y-3">
											<label className="block">
												<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
													Email
												</span>
												<Input
													type="email"
													value={inviteEmail}
													onChange={(e) => setInviteEmail(e.target.value)}
													placeholder="consignee@example.com"
													className="mt-1.5 h-11 border-line bg-paper text-ink"
												/>
											</label>
											<div className="flex flex-wrap gap-2">
												<Button
													type="button"
													onClick={handleSendInvite}
													disabled={inviting}
													className="bg-orange text-white hover:bg-orange-deep"
												>
													{inviting ? (
														<Loader2 className="mr-1.5 size-4 animate-spin" />
													) : (
														<Send className="mr-1.5 size-4" />
													)}
													Send onboarding invite
												</Button>
												<Button
													type="button"
													variant="outline"
													onClick={handleCopyInviteLink}
													className="border-line bg-paper text-ink hover:bg-sand"
												>
													<Mail className="mr-1.5 size-4" />
													Copy invite link
												</Button>
											</div>
										</div>
									</div>
								</div>
							</div>
						)}

						{canChangeLink ? (
							<section className="space-y-3 rounded-xl bg-sand p-4 ring-1 ring-line">
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Step 1 · Link shipment declaration
									</p>
									<p className="mt-1 text-[11px] leading-5 text-ink-soft">
										Select the declaration that belongs to this carrier
										manifest. Check the bill of lading and container numbers
										before confirming. A bill-of-lading mismatch requires an
										explanation.
									</p>
								</div>
								<div className="rounded-lg border border-teal/25 bg-teal/5 p-3">
									<div className="flex items-center justify-between gap-2">
										<p className="text-xs font-semibold text-ink">
											Suggested shipment matches
										</p>
										{loadingSuggestions && (
											<Loader2 className="size-3.5 animate-spin text-ink-soft" />
										)}
									</div>
									<p className="mt-1 text-[11px] leading-5 text-ink-soft">
										Suggestions are based on exact bill-of-lading and saved
										container-number matches. Nothing is linked until an
										operations user confirms it.
									</p>
									{!loadingSuggestions && matchSuggestions.length === 0 && (
										<p className="mt-2 text-[11px] text-ink-soft">
											No exact bill-of-lading or container matches found.
											Search manually below.
										</p>
									)}
									{matchSuggestions.length > 0 && (
										<div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
											{matchSuggestions.map((s) => (
												<div
													key={s.id}
													className={cn(
														"rounded-lg border p-3",
														shipmentId === s.id
															? "border-orange bg-orange/10"
															: "border-line bg-paper"
													)}
												>
													<div className="flex items-start justify-between gap-3">
														<div className="min-w-0">
															<p className="text-xs font-semibold text-ink">
																{s.shipment_reference || s.id}
															</p>
															<p className="mt-1 text-[11px] text-ink-soft">
																BL: {s.bill_of_lading || "—"} ·{" "}
																{s.consignee || "No consignee"}
															</p>
															<p className="mt-1 text-[10px] text-ink-soft">
																{s.organisation_name || "No organisation"} ·
																Score {s.match_score}%
															</p>
															<p className="mt-1 text-[10px] text-teal-deep">
																{Array.isArray(s.match_reasons)
																	? s.match_reasons.join(" · ")
																	: "Potential match — verify details"}
															</p>
														</div>
														<Button
															type="button"
															variant="outline"
															className={cn(
																"shrink-0",
																shipmentId === s.id &&
																	"border-orange bg-orange/10 text-ink"
															)}
															onClick={() => {
																setShipmentId(s.id);
																setShipmentQuery(
																	s.shipment_reference ||
																		s.bill_of_lading ||
																		""
																);
															}}
														>
															{shipmentId === s.id
																? "Selected"
																: "Review match"}
														</Button>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
								<input
									value={shipmentQuery}
									onChange={(e) => {
										setShipmentQuery(e.target.value);
										setShipmentId("");
									}}
									placeholder="Search by shipment reference, BL, consignee, vessel…"
									className="h-10 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/30"
								/>
								{searchingShipments && (
									<p className="text-xs text-ink-soft">
										Searching declarations…
									</p>
								)}
								{shipmentResults.length > 0 && (
									<div className="max-h-44 space-y-1 overflow-y-auto">
										{shipmentResults.map((s) => (
											<button
												key={s.id}
												type="button"
												onClick={() => setShipmentId(s.id)}
												className={cn(
													"w-full rounded-lg border p-3 text-left transition",
													shipmentId === s.id
														? "border-orange bg-orange/10"
														: "border-line bg-paper hover:bg-sand-2"
												)}
											>
												<p className="text-xs font-semibold text-ink">
													{s.shipment_reference || s.id}
												</p>
												<p className="mt-1 text-[11px] text-ink-soft">
													BL: {s.bill_of_lading || "—"} ·{" "}
													{s.consignee || "No consignee"}
												</p>
												<p className="mt-1 text-[10px] text-ink-soft">
													{s.organisation_name || "No organisation"} ·{" "}
													{s.vessel_name || "No vessel"} · {s.status}
												</p>
											</button>
										))}
									</div>
								)}
								{shipmentQuery.trim().length >= 2 &&
									!searchingShipments &&
									shipmentResults.length === 0 && (
										<p className="text-xs text-ink-soft">
											No shipment declarations found.
										</p>
									)}
								{shipmentId &&
									shipmentResults.find((s) => s.id === shipmentId) &&
									shipmentResults
										.find((s) => s.id === shipmentId)
										.bill_of_lading?.trim()
										.toLowerCase() !== manifest.bl.trim().toLowerCase() && (
										<label className="block">
											<span className={labelClass}>
												Reason for BL mismatch{" "}
												<span className="text-coral">*</span>
											</span>
											<textarea
												rows={2}
												value={matchReason}
												onChange={(e) => setMatchReason(e.target.value)}
												className={textareaClass}
												placeholder="Explain why these records should be linked"
											/>
										</label>
									)}
								<div className="flex justify-end">
									<Button
										type="button"
										disabled={
											!shipmentId ||
											matchingShipment ||
											(shipmentResults.find((s) => s.id === shipmentId)
												?.bill_of_lading?.trim()
												.toLowerCase() !==
												manifest.bl.trim().toLowerCase() &&
												!matchReason.trim())
										}
										onClick={async () => {
											const ok = await handleMatch(
												shipmentId,
												matchReason.trim()
											);
											if (ok) {
												setShipmentId("");
												setMatchReason("");
											}
										}}
										className="bg-orange text-white hover:bg-orange-deep"
									>
										{matchingShipment ? (
											<Loader2 className="mr-1.5 size-4 animate-spin" />
										) : (
											<Check className="mr-1.5 size-4" />
										)}
										Link shipment
									</Button>
								</div>
							</section>
						) : (
							<section className="rounded-xl border border-line bg-sand p-4">
								<div className="flex items-start gap-3">
									<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink-soft">
										<ClipboardCheck className="size-4" />
									</span>
									<div className="min-w-0">
										<p className="text-sm font-semibold text-ink">
											Shipment link is locked
										</p>
										<p className="mt-1 text-xs leading-5 text-ink-soft">
											{manifest.status === "Validated"
												? "This manifest has been validated. The linked shipment cannot be changed."
												: manifest.status === "Discrepancy"
													? "This manifest has been flagged for review. Resolve the issue through the authorised review process before changing the shipment link."
													: manifest.status === "Duplicate"
														? "This manifest is marked as a duplicate. The shipment link cannot be changed until the duplicate is resolved."
														: "This manifest has moved beyond the matching stage. The shipment link cannot be changed."}
										</p>
										{isShipmentLinked && (
											<p className="mt-2 text-xs font-semibold text-ink">
												Linked shipment:{" "}
												{manifest.shipmentReferences ||
													manifest.shipmentReference}
											</p>
										)}
									</div>
								</div>
							</section>
						)}

						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<div className="flex items-start gap-3">
								<ClipboardCheck className="mt-0.5 size-4 shrink-0 text-orange" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										What validation does
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										Validation confirms the manifest fields are consistent, the
										shipping line reference is registered, and no duplicate
										exists. Validated manifests are available for the receiving
										workflow.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line p-5 sm:p-6">
						<Button
							variant="ghost"
							onClick={() => navigate("/operations/manifest")}
							disabled={actioning}
							className="text-ink-soft"
						>
							Close
						</Button>
						<div className="flex flex-wrap gap-2">
                            {canFlag && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setFlagReason("");
                                        setResponsibleParty("");
                                        setFlagDialogOpen(true);
                                    }}
                                    disabled={actioning}
                                    className="border-line bg-paper text-coral hover:bg-coral/10"
                                >
                                    {actioning ? (
                                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                                    ) : (
                                        <AlertTriangle className="mr-1.5 size-4" />
                                    )}
                                    Flag for review
                                </Button>
                            )}

                            {canValidate && (
                                <Button
                                    onClick={handleValidate}
                                    disabled={actioning}
                                    className="bg-orange text-white hover:bg-orange-deep"
                                >
                                    {actioning ? (
                                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                                    ) : (
                                        <Check className="mr-1.5 size-4" />
                                    )}
                                    Mark as validated
                                </Button>
                            )}
                        </div>
					</div>
				</div>

				{flagDialogOpen && (
					<div
						className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
						onMouseDown={(e) =>
							e.target === e.currentTarget &&
							!submittingFlag &&
							setFlagDialogOpen(false)
						}
					>
						<form
							className="w-full max-w-lg space-y-5 rounded-2xl bg-paper p-5 shadow-2xl ring-1 ring-line sm:p-6"
							onSubmit={async (e) => {
								e.preventDefault();
								if (flagReason.trim().length < 5) {
									toast.error("Enter a reason of at least 5 characters.");
									return;
								}
								setSubmittingFlag(true);
								try {
									const ok = await handleFlag(
										flagReason.trim(),
										responsibleParty
									);
									if (ok) setFlagDialogOpen(false);
								} finally {
									setSubmittingFlag(false);
								}
							}}
						>
							<div className="flex items-start gap-3">
								<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-coral/10 text-coral">
									<AlertTriangle className="size-5" />
								</span>
								<div>
									<h3 className="font-display text-lg font-bold text-ink">
										Flag manifest for review
									</h3>
									<p className="mt-1 text-xs leading-5 text-ink-soft">
										Record the issue and, if known, identify who needs to
										act next.
									</p>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									aria-label="Close flag dialog"
									disabled={submittingFlag}
									onClick={() => setFlagDialogOpen(false)}
								>
									<X className="size-4" />
								</Button>
							</div>
							<div className="rounded-lg bg-sand px-3 py-2 text-xs text-ink-soft">
								Manifest{" "}
								<span className="font-mono font-semibold text-ink">
									{manifest.manifestRef}
								</span>
							</div>
							<label className="block">
								<span className={labelClass}>
									Reason for review <span className="text-coral">*</span>
								</span>
								<textarea
									value={flagReason}
									onChange={(e) => setFlagReason(e.target.value)}
									minLength={5}
									maxLength={2000}
									required
									rows={4}
									placeholder="Describe the discrepancy, missing information, or issue requiring follow-up…"
									className={textareaClass}
								/>
								<span className="mt-1 block text-right text-[10px] text-ink-soft">
									{flagReason.length}/2000
								</span>
							</label>
							<fieldset className="space-y-2">
								<legend className={labelClass}>
									Who needs to act?{" "}
									<span className="normal-case tracking-normal">
										(optional)
									</span>
								</legend>
								<div className="grid gap-2 sm:grid-cols-2">
									{(["Organisation", "Operations"] as const).map((party) => (
										<button
											key={party}
											type="button"
											onClick={() =>
												setResponsibleParty(
													responsibleParty === party ? "" : party
												)
											}
											className={cn(
												"rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
												responsibleParty === party
													? "border-orange bg-orange/10 text-orange-deep ring-1 ring-orange/30"
													: "border-line bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
											)}
											aria-pressed={responsibleParty === party}
										>
											{party}
										</button>
									))}
								</div>
								{responsibleParty && (
									<p className="text-xs text-ink-soft">
										Next action assigned to:{" "}
										<span className="font-semibold text-ink">
											{responsibleParty}
										</span>
									</p>
								)}
							</fieldset>
							<div className="flex justify-end gap-2 border-t border-line pt-4">
								<Button
									type="button"
									variant="outline"
									disabled={submittingFlag}
									onClick={() => setFlagDialogOpen(false)}
									className="border-line"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={submittingFlag || flagReason.trim().length < 5}
									className="bg-orange text-white hover:bg-orange-deep"
								>
									{submittingFlag ? (
										<>
											<Loader2 className="mr-2 size-4 animate-spin" />
											Submitting…
										</>
									) : (
										<>
											<AlertTriangle className="mr-2 size-4" />
											Confirm flag
										</>
									)}
								</Button>
							</div>
						</form>
					</div>
				)}
			</div>
		</AppShell>
	);
}