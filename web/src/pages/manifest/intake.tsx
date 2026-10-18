import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	ArrowRight,
	Building2,
	Check,
	ChevronDown,
	ClipboardCheck,
	Info,
	Loader2,
	Plus,
	Search,
	Upload,
	User,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";

type IntakeSource = "EDI" | "CSV" | "XLSX" | "Manual";
type ConsigneeType = "organisation" | "individual";
type ConsigneeStatus = "linked" | "unregistered";

interface RegisteredOrganisation {
	id: string;
	name: string;
	rcNumber?: string;
	status: "verified" | "pending" | "under_review" | string;
}

interface RegisteredAgent {
	id: string;
	name: string;
	licenceNumber: string;
	contactEmail?: string;
	contactPhone?: string;
}

interface ConsigneeValue {
	type: ConsigneeType;
	organisationId: string | null;
	organisationName: string;
	status: ConsigneeStatus;
	contactPerson: string;
	fullName: string;
	email: string;
	phone: string;
	address: string;
	country: string;
	agentId: string | null;
	agentName: string;
}

const labelClass =
	"block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const inputClass =
	"mt-1.5 h-11 border-line bg-sand text-ink placeholder:text-ink-soft/60";

const textareaClass =
	"mt-1.5 w-full resize-y rounded-md border border-line bg-sand px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:ring-2 focus:ring-orange/30";

const emptyConsignee: ConsigneeValue = {
	type: "organisation",
	organisationId: null,
	organisationName: "",
	status: "unregistered",
	contactPerson: "",
	fullName: "",
	email: "",
	phone: "",
	address: "",
	country: "",
	agentId: null,
	agentName: "",
};

const extractList = <T,>(payload: any): T[] => {
	if (Array.isArray(payload)) return payload as T[];
	if (Array.isArray(payload?.results)) return payload.results as T[];
	if (Array.isArray(payload?.data)) return payload.data as T[];
	return [];
};

const formatStatus = (status: string) =>
	status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function OperationsManifestIntakePage() {
	const navigate = useNavigate();

	const [source, setSource] = useState<IntakeSource>("Manual");
	const [manifestRef, setManifestRef] = useState("");
	const [bl, setBl] = useState("");
	const [shipmentMatches, setShipmentMatches] = useState<any[]>([]);
	const [searchingShipments, setSearchingShipments] = useState(false);
	const [matchedShipment, setMatchedShipment] = useState<any | null>(null);
	const [vessel, setVessel] = useState("");
	const [shippingLine, setShippingLine] = useState("");
	const [originPort, setOriginPort] = useState("");
	const [eta, setEta] = useState("");
	const [containers, setContainers] = useState("");
	const [containerNumbers, setContainerNumbers] = useState("");
	const [packages, setPackages] = useState("");
	const [grossWeight, setGrossWeight] = useState("");
	const [consignee, setConsignee] = useState<ConsigneeValue>(emptyConsignee);

	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadToken, setUploadToken] = useState<string | null>(null);
	const [uploadedName, setUploadedName] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const normalizeBillOfLading = (value: unknown) =>
		String(value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "");

	const applyShipmentDetails = (shipment: any) => {
		const shipmentBl = String(shipment.bill_of_lading ?? shipment.bl ?? bl).trim();
		const shipmentContainers = Array.isArray(shipment.containers) ? shipment.containers : [];
		const packageTotal = shipmentContainers.reduce(
			(total: number, item: any) =>
				total + (Number(item.package_count ?? item.packages ?? 0) || 0),
			0
		);
		const weightTotal = shipmentContainers.reduce(
			(total: number, item: any) =>
				total + (Number(item.gross_weight ?? item.grossWeight ?? 0) || 0),
			0
		);

		setMatchedShipment(shipment);
		setBl(shipmentBl);
		setVessel(String(shipment.vessel_name ?? shipment.vessel ?? ""));
		setShippingLine(String(shipment.shipping_line ?? shipment.shippingLine ?? ""));
		setOriginPort(String(shipment.origin_port ?? shipment.originPort ?? ""));
		setEta(String(shipment.expected_arrival ?? shipment.eta ?? ""));
		setContainers(
			String(
				shipmentContainers.length ||
					shipment.container_count ||
					shipment.containers_count ||
					0
			)
		);
		setPackages(String(packageTotal || shipment.packages || 0));
		setGrossWeight(
			weightTotal
				? `${weightTotal.toLocaleString("en-US")} kg`
				: String(shipment.gross_weight ?? shipment.grossWeight ?? "")
		);
		setContainerNumbers(
			shipmentContainers
				.map((item: any) => item.container_no ?? item.containerNo)
				.filter(Boolean)
				.join("\n")
		);
		setConsignee((current) => ({
			...current,
			type: "organisation",
			organisationId:
				shipment.consignee_organisation_id ??
				shipment.consigneeOrganisationId ??
				null,
			organisationName: String(shipment.consignee ?? shipment.consignee_name ?? ""),
			status:
				shipment.consignee_organisation_id ?? shipment.consigneeOrganisationId
					? "linked"
					: "unregistered",
		}));
	};

	useEffect(() => {
		const q = bl.trim();
		if (q.length < 2) {
			setShipmentMatches([]);
			setSearchingShipments(false);
			return;
		}
		let cancelled = false;
		const timer = window.setTimeout(async () => {
			setSearchingShipments(true);
			try {
				const res = await http.post("operations/manifests/shipments/", { q });
				const payload: any = res.data;
				const results = Array.isArray(payload)
					? payload
					: payload?.error
						? []
						: extractList<any>(payload?.code ?? payload?.data ?? payload);
				if (!cancelled) {
					setShipmentMatches(results);
					const exactMatch = results.find(
						(shipment: any) =>
							normalizeBillOfLading(
								shipment.bill_of_lading ?? shipment.bl
							) === normalizeBillOfLading(q)
					);
					if (exactMatch) applyShipmentDetails(exactMatch);
					else if (
						matchedShipment &&
						normalizeBillOfLading(
							matchedShipment.bill_of_lading ?? matchedShipment.bl
						) !== normalizeBillOfLading(q)
					)
						setMatchedShipment(null);
				}
			} catch {
				if (!cancelled) setShipmentMatches([]);
			} finally {
				if (!cancelled) setSearchingShipments(false);
			}
		}, 300);
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [bl]);

	const chooseShipment = (shipment: any) => applyShipmentDetails(shipment);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0];
		if (!f) return;
		setFile(f);
		setUploading(true);
		setUploadToken(null);
		setUploadedName(null);
		try {
			const formData = new FormData();
			formData.append("file", f);
			formData.append("source", source);

			const res = await http.post("operations/manifests/upload/", formData);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not parse the file.");
				return;
			}
			const payload: any = resp.code ?? {};
			setUploadToken(payload.upload_token ?? null);
			setUploadedName(f.name);

			const parsed = payload.parsed ?? {};
			if (parsed.manifestRef ?? parsed.manifest_ref) {
				setManifestRef(parsed.manifestRef ?? parsed.manifest_ref ?? "");
			}
			if (parsed.bl ?? parsed.bill_of_lading) {
				setMatchedShipment(null);
				setBl(parsed.bl ?? parsed.bill_of_lading ?? "");
			}
			if (parsed.vessel) setVessel(parsed.vessel);
			if (parsed.shippingLine ?? parsed.shipping_line) {
				setShippingLine(parsed.shippingLine ?? parsed.shipping_line ?? "");
			}
			if (parsed.originPort ?? parsed.origin_port) {
				setOriginPort(parsed.originPort ?? parsed.origin_port ?? "");
			}
			if (parsed.eta) setEta(parsed.eta);
			if (parsed.containers != null) setContainers(String(parsed.containers));
			if (parsed.packages != null) setPackages(String(parsed.packages));
			if (parsed.grossWeight ?? parsed.gross_weight) {
				setGrossWeight(parsed.grossWeight ?? parsed.gross_weight ?? "");
			}

			toast.success("File parsed. Review the fields below before submitting.");
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not upload the file."
			);
		} finally {
			setUploading(false);
		}
	};

	const clearFile = () => {
		setFile(null);
		setUploadToken(null);
		setUploadedName(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!manifestRef.trim() || !bl.trim()) {
			toast.error("Manifest reference and bill of lading are required.");
			return;
		}

		if (!matchedShipment?.id) {
			toast.error(
				"Search for and confirm the matching shipment declaration before adding this manifest."
			);
			return;
		}

		const consigneeName =
			consignee.type === "organisation"
				? consignee.organisationName.trim()
				: consignee.fullName.trim();

		if (!consigneeName) {
			toast.error("Consignee name is required.");
			return;
		}

		if (consignee.type === "organisation" && !consignee.organisationId) {
			if (!consignee.email.trim() && !consignee.phone.trim()) {
				toast.error(
					"This consignee is not yet in TRÏNŪ. Provide at least an email or phone number so we can follow up."
				);
				return;
			}
		}

		if (source !== "Manual" && !uploadToken) {
			toast.error("Upload the manifest file before submitting.");
			return;
		}

		setSubmitting(true);
		try {
			const formData = new FormData();
			formData.append("manifest_ref", manifestRef.trim());
			formData.append("bl", bl.trim());
			formData.append("vessel", vessel.trim());
			formData.append("shipping_line", shippingLine.trim());
			formData.append("origin_port", originPort.trim());
			formData.append("eta", eta.trim());
			formData.append("containers", String(Number(containers) || 0));
			formData.append("packages", String(Number(packages) || 0));
			formData.append("gross_weight", grossWeight.trim());
			formData.append("consignee", consigneeName);
			formData.append("consignee_type", consignee.type);
			formData.append(
				"consignee_organisation_id",
				consignee.organisationId ?? ""
			);
			formData.append(
				"consignee_status",
				consignee.organisationId ? "linked" : "unregistered"
			);
			formData.append("consignee_email", consignee.email.trim());
			formData.append("consignee_phone", consignee.phone.trim());
			formData.append("consignee_address", consignee.address.trim());
			formData.append("agentId", consignee.agentId ?? "");
			formData.append("agent", consignee.agentName);
			formData.append("source", source);
			formData.append("status", "Pre-advice");
			formData.append("matched_shipment_id", String(matchedShipment.id));
			formData.append("containerNumbers", containerNumbers);
			if (uploadToken) formData.append("uploadToken", uploadToken);

			const res = await http.post("operations/manifests/save/", formData);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not add the manifest.");
				return;
			}
			toast.success("Manifest added.");
			navigate("/operations/manifest");
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not add the manifest."
			);
		} finally {
			setSubmitting(false);
		}
	};

	const acceptMap: Record<Exclude<IntakeSource, "Manual">, string> = {
		EDI: ".edi,.txt",
		CSV: ".csv",
		XLSX: ".xlsx,.xls",
	};

	return (
		<AppShell title="Manifest intake" eyebrow="Operations · Inbound">
			<form
				onSubmit={handleSubmit}
				className="space-y-5 pb-24"
				style={{
					animation: "slideInFromLeft 260ms cubic-bezier(0.32, 0.72, 0, 1)",
				}}
			>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Button
						type="button"
						variant="ghost"
						onClick={() => navigate("/operations/manifest")}
						disabled={submitting || uploading}
						className="-ml-3 gap-2 text-ink-soft hover:text-ink"
					>
						<ArrowLeft className="size-4" />
						Back to manifests
					</Button>
				</div>

				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Terminal operations · Intake
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Add a new manifest
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Upload an EDI, CSV, or XLSX file and we'll parse the fields for you. Or
						enter the manifest manually. Duplicates are detected automatically
						before the manifest is accepted.
					</p>
				</div>

				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="border-b border-line p-5 sm:p-6">
						<h3 className="font-display text-sm font-bold text-ink">
							Intake source
						</h3>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Select how this manifest arrived.
						</p>
					</div>
					<div className="p-5 sm:p-6">
						<div className="grid gap-2 sm:grid-cols-4">
							{(["EDI", "CSV", "XLSX", "Manual"] as IntakeSource[]).map((s) => {
								const active = source === s;
								return (
									<button
										key={s}
										type="button"
										disabled={submitting || uploading}
										onClick={() => {
											setSource(s);
											if (s === "Manual") clearFile();
										}}
										className={cn(
											"rounded-xl border p-3 text-center transition-colors disabled:opacity-60",
											active
												? "border-orange bg-orange/5 text-orange-deep ring-1 ring-orange/30"
												: "border-line bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
										)}
									>
										<p className="font-mono text-[11px] font-semibold">
											{s}
										</p>
									</button>
								);
							})}
						</div>

						{source !== "Manual" && (
							<div className="mt-4 rounded-xl border border-dashed border-line bg-sand p-4">
								<div className="flex flex-wrap items-start gap-3">
									<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-paper text-orange-deep ring-1 ring-line">
										{uploading ? (
											<Loader2 className="size-4 animate-spin" />
										) : (
											<Upload className="size-4" />
										)}
									</div>
									<div className="min-w-[200px] flex-1">
										<p className="text-[13px] font-semibold text-ink">
											{uploadedName
												? `Uploaded: ${uploadedName}`
												: `Upload ${source} file`}
										</p>
										<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
											{uploading
												? "Parsing file and extracting fields…"
												: "We'll parse the file and pre-fill the fields below. Review them before submitting."}
										</p>
										{uploadedName && !uploading && (
											<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-teal-deep">
												Parsed successfully
											</p>
										)}
									</div>
									<div className="flex flex-wrap items-center gap-2">
										<input
											ref={fileInputRef}
											type="file"
											accept={
												acceptMap[source as Exclude<IntakeSource, "Manual">]
											}
											onChange={handleFileChange}
											disabled={submitting || uploading}
											className="hidden"
										/>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => fileInputRef.current?.click()}
											disabled={submitting || uploading}
											className="border-line bg-paper text-ink hover:bg-sand"
										>
											<Upload className="mr-1.5 size-3.5" />
											{uploadedName ? "Replace file" : "Choose file"}
										</Button>
										{uploadedName && (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={clearFile}
												disabled={submitting || uploading}
												className="text-ink-soft hover:text-coral"
											>
												<X className="size-3.5" />
											</Button>
										)}
									</div>
								</div>
								{file && !uploading && uploadToken && (
									<p className="mt-3 font-mono text-[10px] text-ink-soft">
										{file.name} · {(file.size / 1024).toFixed(1)} KB
									</p>
								)}
							</div>
						)}
					</div>
				</section>

				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="border-b border-line p-5 sm:p-6">
						<h3 className="font-display text-sm font-bold text-ink">
							Manifest details
						</h3>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Primary references from the carrier. Edit anything the parser got
							wrong.
						</p>
					</div>
					<div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
						<Field
							label="Manifest reference"
							placeholder="MAN-2026-008721"
							value={manifestRef}
							onChange={setManifestRef}
							mono
							required
						/>
						<Field
							label="Bill of lading"
							placeholder="TRN-BL-2026-008721"
							value={bl}
							onChange={(value) => {
								setBl(value);
								setMatchedShipment(null);
							}}
							mono
							required
						/>
						<div className="sm:col-span-2 rounded-xl border border-line bg-sand/50 p-4">
							<div className="flex items-start gap-3">
								<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-paper text-orange-deep ring-1 ring-line">
									{searchingShipments ? (
										<Loader2 className="size-4 animate-spin" />
									) : matchedShipment ? (
										<Check className="size-4" />
									) : (
										<Search className="size-4" />
									)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold text-ink">
										Shipment declaration match
									</p>
									<p className="mt-1 text-xs leading-5 text-ink-soft">
										{matchedShipment
											? `Confirmed: ${
													matchedShipment.shipment_reference ??
													matchedShipment.shipmentReference ??
													matchedShipment.id
											  }`
											: searchingShipments
												? "Searching existing shipment declarations…"
												: bl.trim().length < 2
													? "Enter at least two characters of the bill of lading to search existing declarations."
													: "Select the correct declaration below. The manifest cannot be added until a match is confirmed."}
									</p>
									{matchedShipment && (
										<div className="mt-3 rounded-lg border border-teal/25 bg-teal/5 p-3">
											<div className="flex flex-wrap items-start justify-between gap-2">
												<div className="min-w-0">
													<p className="font-mono text-xs font-semibold text-ink">
														{matchedShipment.shipment_reference ??
															matchedShipment.shipmentReference ??
															"Shipment declaration"}
													</p>
													<p className="mt-1 text-xs text-ink-soft">
														B/L:{" "}
														{matchedShipment.bill_of_lading ??
															matchedShipment.bl ??
															"—"}{" "}
														· Consignee:{" "}
														{matchedShipment.consignee ?? "—"}
													</p>
													<p className="mt-1 text-xs text-ink-soft">
														Status:{" "}
														{formatStatus(
															String(
																matchedShipment.status ?? "Unknown"
															)
														)}{" "}
														· Containers:{" "}
														{Array.isArray(matchedShipment.containers)
															? matchedShipment.containers
																	.map(
																		(c: any) =>
																			c.container_no ??
																			c.containerNo
																	)
																	.filter(Boolean)
																	.join(", ") ||
																matchedShipment.containers.length
															: matchedShipment.container_count ??
																matchedShipment.containers_count ??
																"—"}
													</p>
												</div>
												<Button
													type="button"
													variant="outline"
													size="sm"
													className="border-line bg-paper"
													onClick={() => setMatchedShipment(null)}
												>
													Change match
												</Button>
											</div>
										</div>
									)}
								</div>
							</div>
							{!matchedShipment &&
								!searchingShipments &&
								bl.trim().length >= 2 && (
									<div className="mt-3 space-y-2">
										{shipmentMatches.length ? (
											shipmentMatches.map((shipment: any) => (
												<button
													key={shipment.id}
													type="button"
													onClick={() => chooseShipment(shipment)}
													className="w-full rounded-lg border border-line bg-paper p-3 text-left transition hover:border-orange/50 hover:bg-orange/5"
												>
													<div className="flex flex-wrap items-start justify-between gap-2">
														<span className="font-mono text-xs font-semibold text-ink">
															{shipment.shipment_reference ??
																shipment.shipmentReference ??
																shipment.id}
														</span>
														<span className="rounded bg-sand px-2 py-0.5 text-[10px] text-ink-soft">
															{formatStatus(
																String(shipment.status ?? "Unknown")
															)}
														</span>
													</div>
													<p className="mt-1 text-xs text-ink-soft">
														B/L:{" "}
														{shipment.bill_of_lading ??
															shipment.bl ??
															"—"}{" "}
														· Consignee: {shipment.consignee ?? "—"}
													</p>
													<p className="mt-1 text-xs text-ink-soft">
														Shipping line:{" "}
														{shipment.shipping_line ??
															shipment.shippingLine ??
															"—"}{" "}
														· Vessel:{" "}
														{shipment.vessel_name ??
															shipment.vessel ??
															"—"}
													</p>
												</button>
											))
										) : (
											<p className="rounded-lg border border-dashed border-line p-3 text-xs text-ink-soft">
												No matching declarations found. Try the full B/L
												number or correct the entered value.
											</p>
										)}
									</div>
								)}
						</div>
						<Field
							label="Vessel"
							placeholder="Maersk Voyager V.2604"
							value={vessel}
							onChange={setVessel}
						/>
						<Field
							label="Shipping line"
							placeholder="Maersk Line"
							value={shippingLine}
							onChange={setShippingLine}
						/>
						<Field
							label="Origin port"
							placeholder="Apapa Port"
							value={originPort}
							onChange={setOriginPort}
						/>
						<Field
							label="ETA at terminal"
							placeholder="06 Sep 2026 · 08:30"
							value={eta}
							onChange={setEta}
						/>
						<Field
							label="Containers"
							placeholder="4"
							value={containers}
							onChange={setContainers}
							mono
						/>
						<Field
							label="Packages"
							placeholder="220"
							value={packages}
							onChange={setPackages}
							mono
						/>
						<div className="sm:col-span-2">
							<label className="block">
								<span className={labelClass}>
									Container numbers (optional)
								</span>
								<textarea
									rows={3}
									value={containerNumbers}
									onChange={(e) => setContainerNumbers(e.target.value)}
									placeholder="One container per line, or separate with commas"
									className={textareaClass}
								/>
							</label>
							<p className="mt-1 text-[11px] text-ink-soft">
								Enter individual container numbers when available. Leave blank
								when the carrier manifest only provides a total.
							</p>
						</div>
						<div className="sm:col-span-2">
							<Field
								label="Gross weight"
								placeholder="72,860 kg"
								value={grossWeight}
								onChange={setGrossWeight}
								mono
							/>
						</div>
					</div>
				</section>

				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="p-5 sm:p-6">
						<ConsigneeDetails
							value={consignee}
							onChange={setConsignee}
							disabled={submitting}
							source="manifest"
						/>
					</div>
				</section>

				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="p-5 sm:p-6">
						<div className="flex items-start gap-3">
							<ClipboardCheck className="mt-0.5 size-4 shrink-0 text-orange" />
							<div>
								<p className="text-[13px] font-semibold text-ink">
									Duplicate detection
								</p>
								<p className="mt-1 text-[12px] leading-5 text-ink-soft">
									If the manifest reference or bill of lading matches an
									existing record, the intake is flagged as a duplicate and
									marked for review rather than silently accepted.
								</p>
							</div>
						</div>
					</div>
				</section>

				<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="min-w-0">
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								Manifest intake
							</p>
							<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
								{manifestRef || "Reference pending"} · {source}
								{uploadedName ? ` · ${uploadedName}` : ""}
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => navigate("/operations/manifest")}
								disabled={submitting || uploading}
								className="border-sand/25 bg-transparent text-sand hover:bg-sand/10"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={submitting || uploading}
								className="gap-2 bg-orange text-white hover:bg-orange-deep"
							>
								{submitting ? (
									<>
										<Loader2 className="size-4 animate-spin" />
										Adding…
									</>
								) : (
									<>
										Add manifest
										<ArrowRight className="size-4" />
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			</form>
		</AppShell>
	);
}

function ConsigneeDetails({
	value,
	onChange,
	disabled = false,
	source = "manual",
}: {
	value: ConsigneeValue;
	onChange: (next: ConsigneeValue) => void;
	disabled?: boolean;
	source?: "manifest" | "manual";
}) {
	const update = (patch: Partial<ConsigneeValue>) =>
		onChange({ ...value, ...patch });

	const isOrganisation = value.type === "organisation";
	const isUnregistered =
		isOrganisation && !value.organisationId && !!value.organisationName;

	return (
		<div className="space-y-5">
			<div>
				<h3 className="font-display text-sm font-bold text-ink">
					Consignee details
				</h3>
				<p className="mt-1 text-xs leading-5 text-ink-soft">
					Who is receiving the cargo. Used by Operations to verify the recipient
					and resolve discrepancies.
				</p>
			</div>

			<div>
				<p className={labelClass}>Consignee type</p>
				<div className="mt-2 flex flex-wrap gap-2">
					{(
						[
							{ key: "organisation", label: "Organisation", icon: Building2 },
							{ key: "individual", label: "Individual", icon: User },
						] as const
					).map((option) => {
						const Icon = option.icon;
						const active = value.type === option.key;
						return (
							<label
								key={option.key}
								className={cn(
									"flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-medium transition-colors",
									active
										? "border-orange bg-orange/5 text-orange-deep ring-1 ring-orange/25"
										: "border-line bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink",
									disabled && "cursor-not-allowed opacity-60"
								)}
							>
								<input
									type="radio"
									name="consignee-type"
									value={option.key}
									checked={active}
									disabled={disabled}
									onChange={() =>
										update({
											type: option.key,
											organisationId:
												option.key === "organisation"
													? value.organisationId
													: null,
											organisationName:
												option.key === "organisation"
													? value.organisationName
													: "",
										})
									}
									className="sr-only"
								/>
								<Icon className="size-3.5" />
								{option.label}
							</label>
						);
					})}
				</div>
			</div>

			{isOrganisation ? (
				<div>
					<p className={labelClass}>
						Organisation / company name
						<span className="text-coral"> *</span>
					</p>
					<OrgSearchPicker
						value={{
							id: value.organisationId,
							name: value.organisationName,
						}}
						onChange={(next) =>
							update({
								organisationId: next.id,
								organisationName: next.name,
								status: next.id ? "linked" : "unregistered",
							})
						}
						disabled={disabled}
					/>
					<p className="mt-2 text-[11px] leading-5 text-ink-soft">
						Start typing to search registered organisations. If the consignee
						isn't in TRÏNŪ yet, you can continue — we'll record them by the
						name on the manifest and follow up with an onboarding invite.
					</p>
				</div>
			) : (
				<label className="block">
					<span className={labelClass}>
						Full name
						<span className="text-coral"> *</span>
					</span>
					<Input
						required
						disabled={disabled}
						value={value.fullName}
						onChange={(e) => update({ fullName: e.target.value })}
						placeholder="Enter full name"
						className={cn(
							inputClass,
							disabled && "cursor-not-allowed opacity-60"
						)}
					/>
				</label>
			)}

			{isUnregistered && (
				<div className="rounded-xl border border-orange/25 bg-orange/5 p-3.5">
					<div className="flex items-start gap-3">
						<Info className="mt-0.5 size-4 shrink-0 text-orange-deep" />
						<div className="min-w-0">
							<p className="text-[12px] font-semibold text-ink">
								This consignee is not yet in TRÏNŪ
							</p>
							<p className="mt-1 text-[11px] leading-5 text-ink-soft">
								We'll record them by the name you entered. Provide at least
								one contact method below so Operations can follow up and
								send an onboarding invite.
							</p>
						</div>
					</div>
				</div>
			)}

			{isOrganisation && (
				<label className="block">
					<span className={labelClass}>Contact person</span>
					<Input
						disabled={disabled}
						value={value.contactPerson}
						onChange={(e) => update({ contactPerson: e.target.value })}
						placeholder="Name of contact person"
						className={cn(
							inputClass,
							disabled && "cursor-not-allowed opacity-60"
						)}
					/>
				</label>
			)}

			<div className="grid gap-5 sm:grid-cols-2">
				<label className="block">
					<span className={labelClass}>
						Email address
						{isUnregistered && <span className="text-coral"> ·</span>}
					</span>
					<Input
						type="email"
						disabled={disabled}
						value={value.email}
						onChange={(e) => update({ email: e.target.value })}
						placeholder="contact@company.com"
						className={cn(
							inputClass,
							disabled && "cursor-not-allowed opacity-60"
						)}
					/>
				</label>

				<label className="block">
					<span className={labelClass}>
						Phone number
						{isUnregistered && <span className="text-coral"> ·</span>}
					</span>
					<Input
						type="tel"
						disabled={disabled}
						value={value.phone}
						onChange={(e) => update({ phone: e.target.value })}
						placeholder="+234 …"
						className={cn(
							inputClass,
							disabled && "cursor-not-allowed opacity-60"
						)}
					/>
				</label>
			</div>

			<label className="block">
				<span className={labelClass}>Address</span>
				<textarea
					rows={3}
					disabled={disabled}
					value={value.address}
					onChange={(e) => update({ address: e.target.value })}
					placeholder="Street address, city and state"
					className={cn(
						textareaClass,
						disabled && "cursor-not-allowed opacity-60"
					)}
				/>
			</label>

			<label className="block">
				<span className={labelClass}>Country</span>
				<Input
					disabled={disabled}
					value={value.country}
					onChange={(e) => update({ country: e.target.value })}
					placeholder="e.g. Nigeria"
					className={cn(
						inputClass,
						disabled && "cursor-not-allowed opacity-60"
					)}
				/>
			</label>

			<div>
				<p className={labelClass}>Licensed agent</p>
				<AgentSearchPicker
					value={{
						id: value.agentId,
						name: value.agentName,
					}}
					onChange={(next) =>
						update({ agentId: next.id, agentName: next.name })
					}
					disabled={disabled}
				/>
				<p className="mt-2 text-[11px] leading-5 text-ink-soft">
					{value.agentId
						? "Linked to a verified TRÏNŪ agent record."
						: "Start typing to search licensed clearing agents."}
				</p>
			</div>

			{source === "manifest" && (
				<div className="flex items-start gap-3 rounded-xl border border-orange/25 bg-orange/5 p-3.5">
					<Info className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[12px] font-semibold text-ink">
							Imported from the manifest
						</p>
						<p className="mt-1 text-[11px] leading-5 text-ink-soft">
							Consignee details from the carrier are treated as unverified
							until an operator confirms them. Existing verified contact
							details on a linked organisation will not be overwritten by
							this record.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

function useDebounced<T>(value: T, delay = 300): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(t);
	}, [value, delay]);
	return debounced;
}

function OrgSearchPicker({
	value,
	onChange,
	disabled = false,
}: {
	value: { id: string | null; name: string };
	onChange: (next: { id: string | null; name: string }) => void;
	disabled?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<RegisteredOrganisation[]>([]);
	const [searching, setSearching] = useState(false);

	const debouncedQuery = useDebounced(query, 300);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const q = debouncedQuery.trim();
		if (q.length < 2) {
			setResults([]);
			setSearching(false);
			return;
		}
		let cancelled = false;
		(async () => {
			setSearching(true);
			try {
				const res = await http.post(`operations/manifests/organisations/`, { q });
				const resp: Resp = res.data;
				if (cancelled) return;
				if (resp.error) {
					setResults([]);
					return;
				}
				const list = extractList<any>(resp.code);
				setResults(
					list.map((o) => ({
						id: o.id,
						name: o.name ?? o.organisation_name ?? "—",
						rcNumber: o.rc_number ?? o.rcNumber,
						status: o.status ?? o.verification_status ?? "pending",
					}))
				);
			} catch {
				if (!cancelled) setResults([]);
			} finally {
				if (!cancelled) setSearching(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [debouncedQuery, open]);

	useEffect(() => {
		if (!open) return;
		const onClick = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [open]);

	const choose = (org: RegisteredOrganisation) => {
		onChange({ id: org.id, name: org.name });
		setOpen(false);
		setQuery("");
	};

	const clear = () => {
		onChange({ id: null, name: "" });
		setQuery("");
	};

	const typedName = query.trim();
	const canUseAsUnregistered = typedName.length >= 2 && !searching;

	const useAsUnregistered = () => {
		onChange({ id: null, name: typedName });
		setOpen(false);
		setQuery("");
	};

	return (
		<div ref={containerRef} className="relative mt-1.5">
			<div
				className={cn(
					"flex h-11 w-full items-center gap-2 rounded-md border border-line bg-sand px-3 text-sm text-ink transition focus-within:ring-2 focus-within:ring-orange/30",
					disabled && "cursor-not-allowed opacity-60"
				)}
			>
				<Building2 className="size-3.5 shrink-0 text-ink-soft" />
				<input
					type="text"
					disabled={disabled}
					value={open ? query : value.name}
					placeholder={
						value.name ? value.name : "Search registered organisations…"
					}
					onFocus={() => {
						if (disabled) return;
						setOpen(true);
						setQuery("");
					}}
					onChange={(e) => setQuery(e.target.value)}
					className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
				/>
				{value.id && (
					<span className="rounded-full bg-orange/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-orange-deep ring-1 ring-orange/25">
						Linked
					</span>
				)}
				{value.name && !value.id && (
					<span className="rounded-full bg-amber/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-orange-deep ring-1 ring-orange/25">
						Not yet in TRÏNŪ
					</span>
				)}
				{value.name && !disabled && (
					<button
						type="button"
						onClick={clear}
						className="grid size-5 shrink-0 place-items-center rounded text-ink-soft hover:bg-sand-2 hover:text-ink"
						aria-label="Clear organisation"
					>
						<X className="size-3" />
					</button>
				)}
				{searching ? (
					<Loader2 className="size-3.5 shrink-0 animate-spin text-ink-soft" />
				) : (
					<ChevronDown
						className={cn(
							"size-4 shrink-0 text-ink-soft transition-transform",
							open && "rotate-180"
						)}
					/>
				)}
			</div>

			{open && (
				<div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl bg-paper shadow-2xl ring-1 ring-line">
					<div className="max-h-72 overflow-y-auto p-1">
						{query.trim().length < 2 ? (
							<div className="px-3 py-6 text-center text-[12px] text-ink-soft">
								Type at least 2 characters to search registered
								organisations.
							</div>
						) : searching ? (
							<div className="flex items-center justify-center gap-2 px-3 py-6 text-[12px] text-ink-soft">
								<Loader2 className="size-3.5 animate-spin" />
								Searching…
							</div>
						) : (
							<>
								{results.map((org) => {
									const active = org.id === value.id;
									return (
										<button
											key={org.id}
											type="button"
											onClick={() => choose(org)}
											className={cn(
												"flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
												active
													? "bg-orange/10 ring-1 ring-orange/25"
													: "hover:bg-sand"
											)}
										>
											<span
												className={cn(
													"mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
													active
														? "bg-orange text-white"
														: "bg-sand text-ink-soft ring-1 ring-line"
												)}
											>
												{active ? (
													<Check className="size-4" />
												) : (
													<Building2 className="size-4" />
												)}
											</span>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-[13px] font-semibold text-ink">
													{org.name}
												</span>
												{org.rcNumber && (
													<span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
														{org.rcNumber}
													</span>
												)}
											</span>
											{org.status === "verified" && (
												<span className="rounded-full bg-teal/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-teal-deep ring-1 ring-teal/25">
													Verified
												</span>
											)}
										</button>
									);
								})}

								{results.length === 0 && (
									<div className="px-3 py-4 text-center text-[12px] text-ink-soft">
										No registered organisation matches.
									</div>
								)}

								{canUseAsUnregistered && (
									<button
										type="button"
										onClick={useAsUnregistered}
										className="cursor-pointer mt-1 flex w-full items-start gap-3 rounded-lg bg-orange/5 px-3 py-3 text-left transition-colors ring-1 ring-orange/20 hover:bg-orange/10"
									>
										<span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-orange text-white">
											<Plus className="size-4" />
										</span>
										<span className="min-w-0 flex-1">
											<span className="block text-[13px] font-semibold text-ink">
												Use "{typedName}" as an unregistered consignee
											</span>
											<span className="mt-1 block text-[11px] leading-5 text-ink-soft">
												We'll record them by the name on the manifest. You
												can send an onboarding invite after the manifest
												is added.
											</span>
										</span>
									</button>
								)}
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function AgentSearchPicker({
	value,
	onChange,
	disabled = false,
}: {
	value: { id: string | null; name: string };
	onChange: (next: { id: string | null; name: string }) => void;
	disabled?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<RegisteredAgent[]>([]);
	const [searching, setSearching] = useState(false);

	const debouncedQuery = useDebounced(query, 300);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const q = debouncedQuery.trim();
		if (q.length < 2) {
			setResults([]);
			setSearching(false);
			return;
		}
		let cancelled = false;
		(async () => {
			setSearching(true);
			try {
				const res = await http.post(`operations/manifests/agents/`, { q });
				const resp: Resp = res.data;
				if (cancelled) return;
				if (resp.error) {
					setResults([]);
					return;
				}
				const list = extractList<any>(resp.code);
				setResults(
					list.map((a) => ({
						id: a.id,
						name: a.name ?? "—",
						licenceNumber: a.licence_number ?? a.licenceNumber ?? "—",
						contactEmail: a.contact_email ?? a.contactEmail,
						contactPhone: a.contact_phone ?? a.contactPhone,
					}))
				);
			} catch {
				if (!cancelled) setResults([]);
			} finally {
				if (!cancelled) setSearching(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [debouncedQuery, open]);

	useEffect(() => {
		if (!open) return;
		const onClick = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [open]);

	const choose = (agent: RegisteredAgent) => {
		onChange({ id: agent.id, name: agent.name });
		setOpen(false);
		setQuery("");
	};

	const clear = () => {
		onChange({ id: null, name: "" });
		setQuery("");
	};

	return (
		<div ref={containerRef} className="relative mt-1.5">
			<div
				className={cn(
					"flex h-11 w-full items-center gap-2 rounded-md border border-line bg-sand px-3 text-sm text-ink transition focus-within:ring-2 focus-within:ring-orange/30",
					disabled && "cursor-not-allowed opacity-60"
				)}
			>
				<User className="size-3.5 shrink-0 text-ink-soft" />
				<input
					type="text"
					disabled={disabled}
					value={open ? query : value.name}
					placeholder={value.name ? value.name : "Search licensed agents…"}
					onFocus={() => {
						if (disabled) return;
						setOpen(true);
						setQuery("");
					}}
					onChange={(e) => setQuery(e.target.value)}
					className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
				/>
				{value.id && (
					<span className="rounded-full bg-orange/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-orange-deep ring-1 ring-orange/25">
						Linked
					</span>
				)}
				{value.name && !disabled && (
					<button
						type="button"
						onClick={clear}
						className="grid size-5 shrink-0 place-items-center rounded text-ink-soft hover:bg-sand-2 hover:text-ink"
						aria-label="Clear agent"
					>
						<X className="size-3" />
					</button>
				)}
				{searching ? (
					<Loader2 className="size-3.5 shrink-0 animate-spin text-ink-soft" />
				) : (
					<ChevronDown
						className={cn(
							"size-4 shrink-0 text-ink-soft transition-transform",
							open && "rotate-180"
						)}
					/>
				)}
			</div>

			{open && (
				<div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl bg-paper shadow-2xl ring-1 ring-line">
					<div className="max-h-64 overflow-y-auto p-1">
						{query.trim().length < 2 ? (
							<div className="px-3 py-6 text-center text-[12px] text-ink-soft">
								Type at least 2 characters to search licensed agents.
							</div>
						) : searching ? (
							<div className="flex items-center justify-center gap-2 px-3 py-6 text-[12px] text-ink-soft">
								<Loader2 className="size-3.5 animate-spin" />
								Searching…
							</div>
						) : results.length === 0 ? (
							<div className="px-3 py-6 text-center text-[12px] text-ink-soft">
								No licensed agent matches that search.
							</div>
						) : (
							results.map((agent) => {
								const active = agent.id === value.id;
								return (
									<button
										key={agent.id}
										type="button"
										onClick={() => choose(agent)}
										className={cn(
											"flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
											active
												? "bg-orange/10 ring-1 ring-orange/25"
												: "hover:bg-sand"
										)}
									>
										<span
											className={cn(
												"mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
												active
													? "bg-orange text-white"
													: "bg-sand text-ink-soft ring-1 ring-line"
											)}
										>
											{active ? (
												<Check className="size-4" />
											) : (
												<User className="size-4" />
											)}
										</span>
										<span className="min-w-0 flex-1">
											<span className="block truncate text-[13px] font-semibold text-ink">
												{agent.name}
											</span>
											<span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
												{agent.licenceNumber}
											</span>
											{(agent.contactEmail || agent.contactPhone) && (
												<span className="mt-1 block truncate text-[11px] text-ink-soft">
													{agent.contactEmail} · {agent.contactPhone}
												</span>
											)}
										</span>
									</button>
								);
							})
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function Field({
	label,
	placeholder,
	value,
	onChange,
	type = "text",
	mono,
	required,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	mono?: boolean;
	required?: boolean;
}) {
	return (
		<label className="block">
			<span className={labelClass}>
				{label}
				{required && <span className="text-coral"> *</span>}
			</span>
			<Input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={cn("mt-2 h-11 border-line bg-sand text-ink", mono && "font-mono")}
			/>
		</label>
	);
}