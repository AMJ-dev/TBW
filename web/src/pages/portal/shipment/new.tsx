import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
	ArrowLeft,
	ArrowRight,
	Check,
	CheckCircle2,
	ClipboardList,
	FileCheck2,
	FileText,
	Info,
	MapPin,
	Package,
	Plus,
	Ship,
	Trash2,
	Upload,
	X,
	Building2,
	User,
	ChevronDown,
	Loader2,
	Search,
	ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { http, type Resp } from "@/lib/httpClient";
import { resolveSrc } from "@/lib/functions";

type OptionRow = {
	id: string;
	label: string;
};

type CustomsTariff = {
	id: string;
	hs_code: string;
	description: string;
	category?: string | null;
	rate_type?: "PERCENTAGE" | "FIXED";
	rate?: number | string | null;
	unit?: string | null;
	effective_from?: string;
	effective_to?: string | null;
	status?: string;
	import_duty?: number | string | null;
	vat?: number | string | null;
	levy?: number | string | null;
	exc?: number | string | null;
};

type DocumentRequirement = {
	documentKey: string;
	label: string;
	required: boolean;
	allowMultiple: boolean;
	sortOrder: number;
};

type ConfigOptions = {
	shipmentTypes: OptionRow[];
	cargoCategories: OptionRow[];
	packagingTypes: OptionRow[];
	containerSizes: OptionRow[];
	supportingDocuments: DocumentRequirement[];
};

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

const emptyOptions: ConfigOptions = {
	shipmentTypes: [],
	cargoCategories: [],
	packagingTypes: [],
	containerSizes: [],
	supportingDocuments: [],
};

const normaliseOptions = (raw: unknown): OptionRow[] => {
	if (!Array.isArray(raw)) return [];

	return raw
		.map((item: any) => {
			if (typeof item === "string") {
				return { id: item, label: item };
			}

			return {
				id: String(item?.id ?? item?.key ?? item?.label ?? ""),
				label: String(item?.label ?? item?.name ?? ""),
			};
		})
		.filter((item) => item.id && item.label.trim());
};

const normaliseDocuments = (raw: unknown): DocumentRequirement[] => {
	if (!Array.isArray(raw)) return [];

	return raw
		.map((item: any) => ({
			documentKey: String(item?.document_key ?? item?.key ?? ""),
			label: String(item?.label ?? item?.name ?? ""),
			required: Number(item?.required ?? 0) === 1,
			allowMultiple: Number(item?.allow_multiple ?? 0) === 1,
			sortOrder: Number(item?.sort_order ?? 999),
		}))
		.filter((item) => item.documentKey && item.label.trim())
		.sort((a, b) => a.sortOrder - b.sortOrder);
};

type ContainerItem = {
	containerNo: string;
	size: string;
	sealNo: string;
	packageCount: string;
	grossWeight: string;
	
	// Cargo / Tariff details per container
	cargoDescription: string;
	packageType: string;
	packageCountCargo: string;
	grossWeightCargo: string;
	hsCode: string;
	customsTariffId: string | null;
	
	// UI state for tariff search
	tariffQuery: string;
	tariffResults: CustomsTariff[];
	selectedTariff: CustomsTariff | null;
	searchingTariffs: boolean;
	tariffSearchError: string;
	showTariffDropdown: boolean;
};

type ShipmentDocument =
	| {
			kind: "existing";
			id: string;
			documentKey: string;
			documentLabel: string;
			originalName: string;
			fileSize?: number | null;
			filePath?: string;
			keep: boolean;
	  }
	| {
			kind: "new";
			id: string;
			file: File;
			documentKey: string;
			documentLabel: string;
	  };

type ExistingDocument = {
	id: string;
	document_type: string;
	original_name: string;
	stored_name?: string;
	file_path?: string;
	mime_type?: string | null;
	file_size?: number | null;
	uploaded_at?: string;
	document_label?: string | null;
};

interface ExistingShipment {
	id: string;
	shipment_reference?: string;
	status?: string;
	shipment_type?: string;
	bill_of_lading?: string;
	booking_number?: string;
	customs_reference?: string;
	shipping_line?: string;
	vessel_name?: string;
	voyage_number?: string;
	origin_country?: string;
	origin_port?: string;
	destination_port?: string;
	expected_arrival?: string;
	consignee?: string;
	consignee_email?: string;
	consignee_phone?: string;
	consignee_address?: string;
	cargo_description?: string;
	cargo_category?: string;
	package_type?: string;
	package_count?: number | string;
	gross_weight?: number | string;
	volume?: number | string;
	hs_code?: string;
	dangerous_goods?: string;
	temperature_controlled?: string;
	temperature?: string;
	special_instructions?: string;
	agent?: string;
	agentId?: string;
	containers?: Array<{
		container_no?: string;
		size?: string;
		seal_no?: string;
		package_count?: number | string;
		gross_weight?: number | string;
		cargo_description?: string;
		package_type?: string;
		hs_code?: string;
		customs_tariff_id?: string;
	}>;
	documents?: ExistingDocument[];
}

const inputClass =
	"mt-1.5 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:ring-2 focus:ring-orange/30";

const textareaClass =
	"mt-1.5 w-full resize-y rounded-md border border-line bg-sand px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:ring-2 focus:ring-orange/30";

const labelClass =
	"block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const formatTariffRate = (val?: number | string | null) => {
	if (val === null || val === undefined || val === "") return "—";
	const num = Number(val);
	return Number.isNaN(num) ? "—" : `${num.toFixed(2)}%`;
};

const emptyContainer = (): ContainerItem => ({
	containerNo: "",
	size: "20ft",
	sealNo: "",
	packageCount: "",
	grossWeight: "",
	cargoDescription: "",
	packageType: "",
	packageCountCargo: "",
	grossWeightCargo: "",
	hsCode: "",
	customsTariffId: null,
	tariffQuery: "",
	tariffResults: [],
	selectedTariff: null,
	searchingTariffs: false,
	tariffSearchError: "",
	showTariffDropdown: false,
});

const ALLOWED_EXTENSIONS = /\.(pdf|png|jpe?g)$/i;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const extractRecord = (raw: any): ExistingShipment | null => {
	if (!raw || typeof raw !== "object") return null;
	if (raw.shipment && typeof raw.shipment === "object") return raw.shipment;
	return raw as ExistingShipment;
};

const normaliseKey = (s: string) =>
	s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const matchRequirementKey = (
	docType: string,
	docLabel: string | null | undefined,
	requirements: DocumentRequirement[]
): { key: string; label: string } => {
	const candidates = [docLabel, docType].filter(Boolean) as string[];
	for (const c of candidates) {
		const norm = normaliseKey(c);
		const hit = requirements.find(
			(r) =>
				normaliseKey(r.documentKey) === norm ||
				normaliseKey(r.label) === norm ||
				normaliseKey(r.documentKey).includes(norm) ||
				norm.includes(normaliseKey(r.documentKey))
		);
		if (hit) return { key: hit.documentKey, label: hit.label };
	}
	return {
		key: normaliseKey(docLabel || docType || "document"),
		label: docLabel || docType || "Document",
	};
};

const extractList = <T,>(payload: any): T[] => {
	if (Array.isArray(payload)) return payload as T[];
	if (Array.isArray(payload?.results)) return payload.results as T[];
	if (Array.isArray(payload?.data)) return payload.data as T[];
	return [];
};

export default function NewPortalShipmentPage() {
	const navigate = useNavigate();
	const params = useParams<{ id?: string }>();
	const [searchParams] = useSearchParams();
	const routeId = params?.id ?? searchParams.get("id") ?? "";

	const [shipmentId, setShipmentId] = useState<string>(routeId);
	const [step, setStep] = useState(1);
	const [saving, setSaving] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [loadingOptions, setLoadingOptions] = useState(true);
	const [loadingShipment, setLoadingShipment] = useState(false);
	const [optionsError, setOptionsError] = useState("");
	const [options, setOptions] = useState<ConfigOptions>(emptyOptions);
	const [form, setForm] = useState({
		shipmentType: "",
		billOfLading: "",
		bookingNumber: "",
		customsReference: "",
		shippingLine: "",
		vesselName: "",
		voyageNumber: "",
		originCountry: "",
		originPort: "",
		destinationPort: "",
		expectedArrival: "",
		cargoDescription: "",
		cargoCategory: "",
		packageType: "",
		packageCount: "",
		grossWeight: "",
		volume: "",
		hsCode: "",
		dangerousGoods: "no",
		temperatureControlled: "no",
		temperature: "",
		specialInstructions: "",
	});

	const [consignee, setConsignee] = useState<ConsigneeValue>(emptyConsignee);

	const [containers, setContainers] = useState<ContainerItem[]>([
		emptyContainer(),
	]);
	const [documents, setDocuments] = useState<ShipmentDocument[]>([]);
	const [declarationAccepted, setDeclarationAccepted] = useState(false);

	const isEditing = Boolean(shipmentId);

	const fetchOptions = async () => {
		setLoadingOptions(true);
		setOptionsError("");

		try {
			const res = await http.get("/portal/shipment/config/");
			const resp: Resp = res.data;

			if (resp.error) {
				setOptionsError(
					typeof resp.data === "string"
						? resp.data
						: "Could not load shipment configuration."
				);
				return;
			}

			const payload: any = resp.code ?? {};

			const loaded: ConfigOptions = {
				shipmentTypes: normaliseOptions(
					payload.shipment_types ?? payload.shipmentTypes
				),
				cargoCategories: normaliseOptions(
					payload.cargo_categories ?? payload.cargoCategories
				),
				packagingTypes: normaliseOptions(
					payload.packaging_types ?? payload.packagingTypes
				),
				containerSizes: normaliseOptions(
					payload.container_sizes ??
						payload.containerSizes ??
						payload.container_size
				),
				supportingDocuments: normaliseDocuments(
					payload.supporting_documents ?? payload.supportingDocuments
				),
			};

			setOptions(loaded);

			setForm((current) => ({
				...current,
				shipmentType:
					loaded.shipmentTypes.find(
						(item) => item.label === current.shipmentType
					)?.label ?? loaded.shipmentTypes[0]?.label ?? "",
				cargoCategory:
					loaded.cargoCategories.find(
						(item) => item.label === current.cargoCategory
					)?.label ?? loaded.cargoCategories[0]?.label ?? "",
				packageType:
					loaded.packagingTypes.find(
						(item) => item.label === current.packageType
					)?.label ?? loaded.packagingTypes[0]?.label ?? "",
			}));

			return loaded;
		} catch (err: any) {
			setOptionsError(
				err?.response?.data?.message ||
					"Could not load shipment configuration."
			);
			return null;
		} finally {
			setLoadingOptions(false);
		}
	};

	const fetchShipment = async (id: string, loadedOptions?: ConfigOptions) => {
		setLoadingShipment(true);
		try {
			const res = await http.get(`/portal/shipment/${id}/`);
			const resp: Resp = res.data;

			if (resp.error) {
				toast.error(
					typeof resp.data === "string"
						? resp.data
						: "Could not load this shipment."
				);
				return;
			}

			const record = extractRecord(resp.code);
			if (!record) {
				toast.error("Shipment record is empty.");
				return;
			}

			setForm({
				shipmentType: String(record.shipment_type ?? ""),
				billOfLading: String(record.bill_of_lading ?? ""),
				bookingNumber: String(record.booking_number ?? ""),
				customsReference: String(record.customs_reference ?? ""),
				shippingLine: String(record.shipping_line ?? ""),
				vesselName: String(record.vessel_name ?? ""),
				voyageNumber: String(record.voyage_number ?? ""),
				originCountry: String(record.origin_country ?? ""),
				originPort: String(record.origin_port ?? ""),
				destinationPort: String(record.destination_port ?? ""),
				expectedArrival: String(record.expected_arrival ?? "").slice(0, 10),
				cargoDescription: String(record.cargo_description ?? ""),
				cargoCategory: String(record.cargo_category ?? ""),
				packageType: String(record.package_type ?? ""),
				packageCount:
					record.package_count != null
						? String(record.package_count)
						: "",
				grossWeight:
					record.gross_weight != null ? String(record.gross_weight) : "",
				volume: record.volume != null ? String(record.volume) : "",
				hsCode: String(record.hs_code ?? ""),
				dangerousGoods: record.dangerous_goods === "yes" ? "yes" : "no",
				temperatureControlled:
					record.temperature_controlled === "yes" ? "yes" : "no",
				temperature: String(record.temperature ?? ""),
				specialInstructions: String(record.special_instructions ?? ""),
			});

			setConsignee((prev) => ({
				...prev,
				organisationId: (record as any).consignee_organisation_id ?? null,
				organisationName: String(record.consignee ?? ""),
				status: (record as any).consignee_organisation_id
					? "linked"
					: "unregistered",
				email: String(record.consignee_email ?? ""),
				phone: String(record.consignee_phone ?? ""),
				address: String(record.consignee_address ?? ""),
				agentId: (record as any).agent_id ?? (record as any).agentId ?? null,
				agentName: String((record as any).agent ?? ""),
			}));

			if (Array.isArray(record.containers) && record.containers.length) {
				setContainers(
					record.containers.map((container) => ({
						containerNo: String(container.container_no ?? ""),
						size: String(container.size ?? "20ft"),
						sealNo: String(container.seal_no ?? ""),
						packageCount:
							container.package_count != null
								? String(container.package_count)
								: "",
						grossWeight:
							container.gross_weight != null
								? String(container.gross_weight)
								: "",
						cargoDescription: String(container.cargo_description ?? ""),
						packageType: String(container.package_type ?? ""),
						packageCountCargo: "",
						grossWeightCargo: "",
						hsCode: String(container.hs_code ?? ""),
						customsTariffId: container.customs_tariff_id ?? null,
						tariffQuery: "",
						tariffResults: [],
						selectedTariff: null,
						searchingTariffs: false,
						tariffSearchError: "",
						showTariffDropdown: false,
					}))
				);
			}

			if (Array.isArray(record.documents) && record.documents.length) {
				const reqs = (loadedOptions ?? options).supportingDocuments;
				setDocuments(
					record.documents.map<ShipmentDocument>((doc: any) => {
						const match = matchRequirementKey(
							doc.document_type,
							doc.document_label,
							reqs
						);
						return {
							kind: "existing",
							id: doc.id,
							documentKey: match.key,
							documentLabel: match.label,
							originalName: doc.original_name,
							fileSize: doc.file_size ?? null,
							filePath: doc.file_path,
							keep: true,
						};
					})
				);
			}
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not load this shipment."
			);
		} finally {
			setLoadingShipment(false);
		}
	};

	useEffect(() => {
		let cancelled = false;
		const boot = async () => {
			const loaded = await fetchOptions();
			if (cancelled) return;
			if (shipmentId) {
				await fetchShipment(shipmentId, loaded ?? undefined);
			}
		};
		void boot();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (routeId && routeId !== shipmentId) {
			setShipmentId(routeId);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [routeId]);

	const searchCustomsTariffs = async (containerIndex: number, value: string) => {
		setContainers(current => current.map((c, i) => i === containerIndex ? { ...c, tariffQuery: value, tariffSearchError: "", selectedTariff: null, hsCode: value } : c));
		
		if (value.trim().length < 2) {
			setContainers(current => current.map((c, i) => i === containerIndex ? { ...c, tariffResults: [] } : c));
			return;
		}

		setContainers(current => current.map((c, i) => i === containerIndex ? { ...c, searchingTariffs: true } : c));
		
		try {
			const res = await http.post(
				"/admin/config/customs-tariffs/search/",
				{
					q: value.trim(),
					as_of: new Date().toISOString().slice(0, 10),
					limit: 20,
					page: 1,
				}
			);
			const resp: Resp = res.data;
			if (resp.error) {
				setContainers(current => current.map((c, i) => i === containerIndex ? { ...c, tariffResults: [], tariffSearchError: typeof resp.data === "string" ? resp.data : "Could not search customs tariff classifications." } : c));
				return;
			}

			const payload: any = resp.code ?? {};
			const records = Array.isArray(payload.tariffs) ? payload.tariffs : Array.isArray(payload.data) ? payload.data : [];
			
			setContainers(current => current.map((c, i) => i === containerIndex ? { ...c, tariffResults: records, showTariffDropdown: true } : c));
		} catch (error: any) {
			setContainers(current => current.map((c, i) => i === containerIndex ? { ...c, tariffResults: [], tariffSearchError: error?.response?.data?.data || error?.response?.data?.message || "Could not search customs tariff classifications." } : c));
		} finally {
			setContainers(current => current.map((c, i) => i === containerIndex ? { ...c, searchingTariffs: false } : c));
		}
	};

	const chooseCustomsTariff = (containerIndex: number, tariff: CustomsTariff) => {
		setContainers(current => current.map((c, i) => i === containerIndex ? { 
			...c, 
			selectedTariff: tariff, 
			tariffQuery: `${tariff.hs_code} — ${tariff.description}`,
			tariffResults: [],
			showTariffDropdown: false,
			hsCode: tariff.hs_code,
			customsTariffId: tariff.id
		} : c));
	};

	const clearCustomsTariff = (containerIndex: number) => {
		setContainers(current => current.map((c, i) => i === containerIndex ? { 
			...c, 
			selectedTariff: null, 
			tariffQuery: "",
			tariffResults: [],
			showTariffDropdown: false,
			hsCode: "",
			customsTariffId: null
		} : c));
	};

	const updateField = (name: string, value: string) => {
		setForm((current) => ({ ...current, [name]: value }));
	};

	const updateContainer = (
		index: number,
		field: keyof ContainerItem,
		value: string
	) => {
		setContainers((current) =>
			current.map((container, i) =>
				i === index ? { ...container, [field]: value } : container
			)
		);
	};

	const addContainer = () => {
		setContainers((current) => [...current, emptyContainer()]);
	};

	const removeContainer = (index: number) => {
		setContainers((current) =>
			current.length === 1
				? [emptyContainer()]
				: current.filter((_, i) => i !== index)
		);
	};

	const handleFiles = (
		files: FileList | null,
		requirement: DocumentRequirement
	) => {
		if (!files?.length) return;

		const selected = Array.from(files);

		const invalid = selected.filter(
			(file) =>
				file.size > MAX_FILE_SIZE || !ALLOWED_EXTENSIONS.test(file.name)
		);

		if (invalid.length) {
			toast.error("Only PDF, PNG, JPG and JPEG files up to 10 MB each.");
		}

		const valid = selected.filter(
			(file) =>
				file.size <= MAX_FILE_SIZE && ALLOWED_EXTENSIONS.test(file.name)
		);

		if (!valid.length) return;

		setDocuments((current) => {
			const existingForDoc = current.filter(
				(item) =>
					item.documentKey === requirement.documentKey &&
					(item.kind === "new" || item.keep)
			);

			if (!requirement.allowMultiple && existingForDoc.length > 0) {
				toast.error(
					`Only one file allowed for ${requirement.label}. Remove the existing file first.`
				);
				return current;
			}

			const toAdd = requirement.allowMultiple
				? valid
				: valid.slice(0, Math.max(0, 1 - existingForDoc.length));

			return [
				...current,
				...toAdd.map((file) => ({
					kind: "new" as const,
					id: `${requirement.documentKey}-${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
					file,
					documentKey: requirement.documentKey,
					documentLabel: requirement.label,
				})),
			];
		});
	};

	const removeDocument = (id: string) => {
		setDocuments((current) =>
			current.flatMap((document) => {
				if (document.id !== id) return [document];
				if (document.kind === "new") return [];
				return [{ ...document, keep: false }];
			})
		);
	};

	const documentsForRequirement = (documentKey: string) =>
		documents.filter(
			(doc) =>
				doc.documentKey === documentKey &&
				(doc.kind === "new" || doc.keep)
		);

	const missingRequiredDocuments = () => {
		return options.supportingDocuments
			.filter(
				(req) =>
					req.required &&
					documentsForRequirement(req.documentKey).length === 0
			)
			.map((req) => req.label);
	};

	const validateDocuments = () => {
		const missing = missingRequiredDocuments();

		if (missing.length) {
			toast.error(
				`Please attach the required document(s): ${missing.join(", ")}.`
			);
			return false;
		}

		return true;
	};

	const validateStep = () => {
		if (step === 1) {
			if (!form.shipmentType || !form.billOfLading.trim()) {
				toast.error("Complete the required shipment details.");
				return false;
			}
		}

		if (step === 2) {
			const hasAnyRoute =
				form.shippingLine.trim() ||
				form.vesselName.trim() ||
				form.voyageNumber.trim() ||
				form.originCountry.trim() ||
				form.originPort.trim() ||
				form.destinationPort.trim() ||
				form.expectedArrival;

			if (!hasAnyRoute) {
				toast.error(
					"Enter at least one route detail or continue if this shipment has no route."
				);
				return false;
			}
		}

		if (step === 3) {
			if (!form.cargoDescription.trim()) {
				toast.error("Enter a cargo description.");
				return false;
			}

			if (!form.cargoCategory) {
				toast.error("Select a cargo category.");
				return false;
			}

			if (!form.packageType) {
				toast.error("Select a packaging type.");
				return false;
			}

			const consigneeName =
				consignee.type === "organisation"
					? consignee.organisationName.trim()
					: consignee.fullName.trim();

			if (!consigneeName || !form.packageCount.trim()) {
				toast.error("Enter the consignee and total package count.");
				return false;
			}

			if (consignee.type === "organisation" && !consignee.organisationId) {
				if (!consignee.email.trim() && !consignee.phone.trim()) {
					toast.error(
						"This consignee is not yet in TRÏNŪ. Provide at least an email or phone number so we can follow up."
					);
					return false;
				}
			}

			if (
				!/^\d+(\.\d+)?$/.test(form.packageCount) ||
				Number(form.packageCount) <= 0
			) {
				toast.error("Enter a valid package count.");
				return false;
			}

			if (
				form.grossWeight &&
				(!/^\d+(\.\d+)?$/.test(form.grossWeight) ||
					Number(form.grossWeight) <= 0)
			) {
				toast.error("Enter a valid gross weight.");
				return false;
			}

			if (
				form.volume &&
				(!/^\d+(\.\d+)?$/.test(form.volume) ||
					Number(form.volume) <= 0)
			) {
				toast.error("Enter a valid cargo volume.");
				return false;
			}

			if (form.dangerousGoods === "yes" && !form.hsCode.trim()) {
				toast.error(
					"Provide the HS code for the declared dangerous goods."
				);
				return false;
			}

			if (
				form.temperatureControlled === "yes" &&
				!form.temperature.trim()
			) {
				toast.error("Enter the required temperature for this cargo.");
				return false;
			}

			const validContainers = containers.filter((container) =>
				container.containerNo.trim()
			);

			if (validContainers.length > 0) {
				const containerNumbers = validContainers.map((container) =>
					container.containerNo.trim().toUpperCase()
				);

				if (
					new Set(containerNumbers).size !== containerNumbers.length
				) {
					toast.error("Container numbers must be unique.");
					return false;
				}

				for (const container of validContainers) {
					if (
						container.packageCount &&
						(!/^\d+(\.\d+)?$/.test(container.packageCount) ||
							Number(container.packageCount) <= 0)
					) {
						toast.error(
							`Invalid package count for container ${container.containerNo}.`
						);
						return false;
					}

					if (
						container.grossWeight &&
						(!/^\d+(\.\d+)?$/.test(container.grossWeight) ||
							Number(container.grossWeight) <= 0)
					) {
						toast.error(
							`Invalid gross weight for container ${container.containerNo}.`
						);
						return false;
					}
				}
			}
		}

		if (step === 4) {
			if (!validateDocuments()) return false;
		}

		return true;
	};

	const validContainersForSubmit = () =>
		containers.filter((container) => container.containerNo.trim());

	const buildFormData = (status: "draft" | "pending_review") => {
		const formData = new FormData();

		const consigneeName =
			consignee.type === "organisation"
				? consignee.organisationName.trim()
				: consignee.fullName.trim();

		const fields: Record<string, string> = {
			shipment_type: form.shipmentType,
			bill_of_lading: form.billOfLading.trim(),
			booking_number: form.bookingNumber.trim(),
			customs_reference: form.customsReference.trim(),
			shipping_line: form.shippingLine.trim(),
			vessel_name: form.vesselName.trim(),
			voyage_number: form.voyageNumber.trim(),
			origin_country: form.originCountry.trim(),
			origin_port: form.originPort.trim(),
			destination_port: form.destinationPort.trim(),
			expected_arrival: form.expectedArrival,
			consignee: consigneeName,
			consignee_contact_person: consignee.contactPerson.trim(),
			consignee_country: consignee.country,
			
			consignee_type: consignee.type,
			consignee_organisation_id: consignee.organisationId ?? "",
			consignee_status: consignee.organisationId ? "linked" : "unregistered",
			consignee_email: consignee.email.trim(),
			consignee_phone: consignee.phone.trim(),
			consignee_address: consignee.address.trim(),
			agentId: consignee.agentId ?? "",
			agent: consignee.agentName,
			cargo_description: form.cargoDescription.trim(),
			cargo_category: form.cargoCategory,
			package_type: form.packageType,
			package_count: form.packageCount, 
			gross_weight: form.grossWeight,
			volume: form.volume,
			hs_code: form.hsCode.trim(),
			dangerous_goods: form.dangerousGoods,
			temperature_controlled: form.temperatureControlled,
			temperature: form.temperature.trim(),
			special_instructions: form.specialInstructions.trim(),
			declaration_accepted: declarationAccepted ? "1" : "0",
			status,
		};

		Object.entries(fields).forEach(([key, value]) =>
			formData.append(key, value)
		);

		formData.append(
			"containers",
			JSON.stringify(
				validContainersForSubmit().map((container) => ({
					containerNo: container.containerNo.trim(),
					size: container.size,
					sealNo: container.sealNo.trim(),
					packageCount: container.packageCount,
					grossWeight: container.grossWeight,
					cargoDescription: container.cargoDescription.trim(),
					packageType: container.packageType,
					hsCode: container.hsCode.trim(),
					customsTariffId: container.customsTariffId,
				}))
			)
		);

		const newDocuments = documents.filter(
			(d): d is Extract<ShipmentDocument, { kind: "new" }> =>
				d.kind === "new"
		);

		const keptExistingIds = documents
			.filter(
				(d): d is Extract<ShipmentDocument, { kind: "existing" }> =>
					d.kind === "existing" && d.keep
			)
			.map((d) => d.id);

		formData.append(
			"documents",
			JSON.stringify(
				newDocuments.map((document, index) => ({
					name: document.file.name,
					type: document.documentKey,
					label: document.documentLabel,
					size: document.file.size,
					index,
				}))
			)
		);

		newDocuments.forEach((document, index) => {
			formData.append(
				`document_file_${index}`,
				document.file,
				document.file.name
			);
		});

		formData.append(
			"existing_document_ids",
			JSON.stringify(keptExistingIds)
		);

		return formData;
	};

	const persistShipment = async (
		status: "draft" | "pending_review"
	): Promise<string | null> => {
		const endpoint = shipmentId
			? `/portal/shipments/update/${shipmentId}/`
			: "/portal/shipments/save/";

		const res = await http.post(endpoint, buildFormData(status));
		const resp: Resp = res.data;

		if (resp.error) {
			toast.error(
				typeof resp.data === "string"
					? resp.data
					: "Could not save the shipment."
			);
			return null;
		}

		const record = extractRecord(resp.code);
		toast.success(resp.data || "Shipment saved successfully.");
		navigate("/portal/shipments");
		return record?.id ?? shipmentId ?? null;
	};

	const saveDraft = async () => {
		setSaving(true);
		try {
			const nextId = await persistShipment("draft");
			if (!nextId) return;

			if (!shipmentId) {
				setShipmentId(nextId);
				navigate(`/portal/shipment/new?id=${nextId}`, {
					replace: true,
				});
			}

			toast.success("Draft saved. You can continue editing it later.");
		} catch (error: any) {
			toast.error(
				error?.response?.data?.data ||
					error?.response?.data?.message ||
					"Unable to save the shipment draft."
			);
		} finally {
			setSaving(false);
		}
	};

	const submitShipment = async () => {
		if (!validateStep()) return;

		if (!declarationAccepted) {
			toast.error("Confirm the shipment declaration before submitting.");
			return;
		}

		setSubmitting(true);
		try {
			const nextId = await persistShipment("pending_review");
			if (!nextId) return;

			setShipmentId(nextId);
			toast.success(
				isEditing
					? "Shipment updated and submitted."
					: "Shipment submitted successfully."
			);
			navigate("/portal/shipments");
		} catch (error: any) {
			toast.error(
				error?.response?.data?.data ||
					error?.response?.data?.message ||
					"Unable to submit the shipment."
			);
		} finally {
			setSubmitting(false);
		}
	};

	const steps = [
		{ number: 1, label: "Shipment details", icon: Ship },
		{ number: 2, label: "Route & vessel", icon: MapPin },
		{ number: 3, label: "Cargo & containers", icon: Package },
		{ number: 4, label: "Documents & review", icon: FileCheck2 },
	];

	const missingDocs = missingRequiredDocuments();
	const canSubmit =
		declarationAccepted && missingDocs.length === 0 && !submitting;

	return (
		<AppShell
			title={isEditing ? "Edit Shipment" : "Submit Shipment"}
			eyebrow="Stakeholder Portal · New Shipment"
		>
			<div className="mx-auto max-w-5xl space-y-6 pb-24">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-col gap-1.5">
						<nav
							aria-label="Breadcrumb"
							className="flex flex-wrap items-center gap-1.5 text-xs text-ink-soft"
						>
							<button
								type="button"
								onClick={() => navigate("/portal/shipments")}
								className="font-medium transition hover:text-orange-deep"
							>
								Shipments
							</button>
							<span aria-hidden="true">/</span>
							<span className="font-semibold text-ink">
								{isEditing ? "Edit Shipment" : "New Shipment"}
							</span>
						</nav>
						<h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
							{isEditing ? "Edit Shipment" : "Submit Shipment"}
						</h1>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							disabled={saving || loadingShipment}
							onClick={saveDraft}
							className="gap-2 border-line bg-paper text-ink hover:bg-sand"
						>
							<ClipboardList className="size-4" />
							{saving
								? "Saving…"
								: isEditing
									? "Save changes"
									: "Save draft"}
						</Button>
					</div>
				</div>

				{loadingShipment && (
					<div className="rounded-xl bg-paper p-4 text-[12px] text-ink-soft ring-1 ring-line">
						Loading existing shipment…
					</div>
				)}

				<section className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
					{steps.map((item) => {
						const Icon = item.icon;
						const active = step === item.number;
						const completed = step > item.number;

						return (
							<button
								type="button"
								key={item.number}
								onClick={() => {
									if (item.number < step) setStep(item.number);
								}}
								className={cn(
									"flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition sm:p-4",
									active
										? "border-orange bg-orange/5 ring-1 ring-orange/25"
										: completed
											? "border-orange/25 bg-paper"
											: "border-line bg-paper",
									item.number < step
										? "cursor-pointer hover:border-orange/40"
										: "cursor-default"
								)}
							>
								<span
									className={cn(
										"grid size-9 shrink-0 place-items-center rounded-lg border transition",
										active
											? "border-orange bg-orange text-white"
											: completed
												? "border-orange bg-orange text-white"
												: "border-line bg-sand text-ink-soft"
									)}
								>
									{completed ? (
										<Check className="size-4" />
									) : (
										<Icon className="size-4" />
									)}
								</span>

								<span className="min-w-0">
									<span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Step {item.number}
									</span>
									<span className="mt-0.5 block truncate text-[13px] font-semibold text-ink">
										{item.label}
									</span>
								</span>
							</button>
						);
					})}
				</section>

				{optionsError && (
					<div className="rounded-xl border border-carmine/30 bg-carmine/5 p-4 text-[12px] leading-5 text-carmine">
						{optionsError}
					</div>
				)}

				<form
					onSubmit={(event) => {
						event.preventDefault();

						if (step < 4) {
							if (validateStep()) setStep(step + 1);
						} else {
							void submitShipment();
						}
					}}
					className="space-y-5"
				>
					<AnimatePresence mode="wait">
						{step === 1 && (
							<motion.section
								key="step-1"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -12 }}
								className="rounded-2xl bg-paper ring-1 ring-line"
							>
								<SectionHeader
									title="Shipment details"
									description="Identify the shipment with its primary references."
								/>

								<div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
									<label className={labelClass}>
										Shipment type
										<span className="text-coral"> *</span>
										<select
											className={inputClass}
											value={form.shipmentType}
											onChange={(event) =>
												updateField("shipmentType", event.target.value)
											}
											required
											disabled={loadingOptions}
										>
											<option value="">Select shipment type</option>
											{options.shipmentTypes.map((item) => (
												<option key={item.id} value={item.label}>
													{item.label}
												</option>
											))}
										</select>
									</label>

									<label className={labelClass}>
										Bill of lading
										<span className="text-coral"> *</span>
										<Input
											required
											value={form.billOfLading}
											onChange={(event) =>
												updateField(
													"billOfLading",
													event.target.value.toUpperCase()
												)
											}
											placeholder="Enter B/L reference"
											className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
										/>
									</label>

									<label className={labelClass}>
										Booking number
										<Input
											value={form.bookingNumber}
											onChange={(event) =>
												updateField(
													"bookingNumber",
													event.target.value
												)
											}
											placeholder="Shipping booking reference"
											className="mt-1.5 h-11 border-line bg-sand text-ink"
										/>
									</label>

									<label className={labelClass}>
										Customs reference
										<Input
											value={form.customsReference}
											onChange={(event) =>
												updateField(
													"customsReference",
													event.target.value
												)
											}
											placeholder="If already available"
											className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
										/>
									</label>
								</div>
							</motion.section>
						)}

						{step === 2 && (
							<motion.section
								key="step-2"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -12 }}
								className="rounded-2xl bg-paper ring-1 ring-line"
							>
								<SectionHeader
									title="Route & vessel"
									description="Provide route and vessel details. All optional — skip if this shipment does not move by sea or air."
								/>

								<div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
									<label className={labelClass}>
										Shipping line
										<Input
											value={form.shippingLine}
											onChange={(event) =>
												updateField(
													"shippingLine",
													event.target.value
												)
											}
											placeholder="Shipping company"
											className="mt-1.5 h-11 border-line bg-sand text-ink"
										/>
									</label>

									<label className={labelClass}>
										Vessel name
										<Input
											value={form.vesselName}
											onChange={(event) =>
												updateField(
													"vesselName",
													event.target.value
												)
											}
											placeholder="Vessel carrying the cargo"
											className="mt-1.5 h-11 border-line bg-sand text-ink"
										/>
									</label>

									<label className={labelClass}>
										Voyage number
										<Input
											value={form.voyageNumber}
											onChange={(event) =>
												updateField(
													"voyageNumber",
													event.target.value
												)
											}
											placeholder="Voyage reference"
											className="mt-1.5 h-11 border-line bg-sand text-ink"
										/>
									</label>

									<label className={labelClass}>
										Origin country
										<Input
											value={form.originCountry}
											onChange={(event) =>
												updateField(
													"originCountry",
													event.target.value
												)
											}
											placeholder="e.g. China"
											className="mt-1.5 h-11 border-line bg-sand text-ink"
										/>
									</label>

									<label className={labelClass}>
										Port of loading
										<Input
											value={form.originPort}
											onChange={(event) =>
												updateField("originPort", event.target.value)
											}
											placeholder="Origin port"
											className="mt-1.5 h-11 border-line bg-sand text-ink"
										/>
									</label>

									<label className={labelClass}>
										Destination port
										<Input
											value={form.destinationPort}
											onChange={(event) =>
												updateField(
													"destinationPort",
													event.target.value
												)
											}
											placeholder="Destination port"
											className="mt-1.5 h-11 border-line bg-sand text-ink"
										/>
									</label>

									<label className={labelClass}>
										Expected arrival
										<Input
											type="date"
											value={form.expectedArrival}
											onChange={(event) =>
												updateField(
													"expectedArrival",
													event.target.value
												)
											}
											className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
										/>
									</label>
								</div>
							</motion.section>
						)}

						{step === 3 && (
							<motion.section
								key="step-3"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -12 }}
								className="space-y-5"
							>
								<div className="rounded-2xl bg-paper ring-1 ring-line">
									<SectionHeader
										title="Cargo declaration"
										description="Describe the goods and declare their quantities and handling requirements."
									/>

									<div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
										<label className={cn(labelClass, "sm:col-span-2")}>
											Cargo description
											<span className="text-coral"> *</span>
											<textarea
												required
												rows={3}
												value={form.cargoDescription}
												onChange={(event) =>
													updateField(
														"cargoDescription",
														event.target.value
													)
												}
												placeholder="Describe the goods, materials and intended handling…"
												className={textareaClass}
											/>
										</label>

										<label className={labelClass}>
											Cargo category
											<span className="text-coral"> *</span>
											<select
												className={inputClass}
												value={form.cargoCategory}
												onChange={(event) =>
													updateField("cargoCategory", event.target.value)
												}
												required
												disabled={loadingOptions}
											>
												<option value="">Select cargo category</option>
												{options.cargoCategories.map((item) => (
													<option key={item.id} value={item.label}>
														{item.label}
													</option>
												))}
											</select>
										</label>

										<label className={labelClass}>
											Packaging type
											<span className="text-coral"> *</span>
											<select
												className={inputClass}
												value={form.packageType}
												onChange={(event) =>
													updateField("packageType", event.target.value)
												}
												required
												disabled={loadingOptions}
											>
												<option value="">Select packaging type</option>
												{options.packagingTypes.map((item) => (
													<option key={item.id} value={item.label}>
														{item.label}
													</option>
												))}
											</select>
										</label>

										<label className={labelClass}>
											Total packages
											<span className="text-coral"> *</span>
											<Input
												required
												type="number"
												min="1"
												step="1"
												value={form.packageCount}
												onChange={(event) =>
													updateField(
														"packageCount",
														event.target.value
													)
												}
												placeholder="e.g. 250"
												className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
											/>
										</label>

										<label className={labelClass}>
											Gross weight (kg)
											<Input
												type="number"
												min="0"
												step="any"
												value={form.grossWeight}
												onChange={(event) =>
													updateField(
														"grossWeight",
														event.target.value
													)
												}
												placeholder="Total gross weight"
												className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
											/>
										</label>

										<label className={labelClass}>
											Volume (m³)
											<Input
												type="number"
												min="0"
												step="any"
												value={form.volume}
												onChange={(event) =>
													updateField("volume", event.target.value)
												}
												placeholder="Total cargo volume"
												className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
											/>
										</label>
									</div>

									<div className="grid gap-4 border-t border-line p-5 sm:grid-cols-2 sm:p-6">
										<CheckboxCard
											checked={form.dangerousGoods === "yes"}
											onChange={(checked) =>
												updateField(
													"dangerousGoods",
													checked ? "yes" : "no"
												)
											}
											title="Dangerous goods"
											description="Cargo requires special declarations or handling."
										/>
										<CheckboxCard
											checked={
												form.temperatureControlled === "yes"
											}
											onChange={(checked) =>
												updateField(
													"temperatureControlled",
													checked ? "yes" : "no"
												)
											}
											title="Temperature controlled"
											description="Cargo needs a specified storage temperature."
										/>
									</div>

									{form.dangerousGoods === "yes" && (
										<div className="mx-5 mb-5 rounded-xl border-l-4 border-orange bg-orange/5 p-4 ring-1 ring-orange/20 sm:mx-6 sm:mb-6">
											<p className="text-[13px] font-semibold text-ink">
												Dangerous goods declaration required
											</p>
											<p className="mt-1 text-[12px] leading-5 text-ink-soft">
												Upload the relevant dangerous goods
												declaration and safety documents in the
												Documents step.
											</p>
										</div>
									)}

									{form.temperatureControlled === "yes" && (
										<div className="border-t border-line p-5 sm:p-6">
											<label className={labelClass}>
												Required temperature
												<Input
													value={form.temperature}
													onChange={(event) =>
														updateField(
															"temperature",
															event.target.value
														)
													}
													placeholder="e.g. 2–8 °C"
													className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
												/>
											</label>
										</div>
									)}

									<div className="border-t border-line p-5 sm:p-6">
										<label className={labelClass}>
											Special handling instructions
											<textarea
												rows={3}
												value={form.specialInstructions}
												onChange={(event) =>
													updateField(
														"specialInstructions",
														event.target.value
													)
												}
												placeholder="Fragile cargo, special handling, stacking restrictions…"
												className={textareaClass}
											/>
										</label>
									</div>
								</div>

								<div className="rounded-2xl bg-paper ring-1 ring-line">
									<ConsigneeDetails
										value={consignee}
										onChange={setConsignee}
										disabled={submitting}
										source="manifest"
									/>
								</div>

								<div className="rounded-2xl bg-paper ring-1 ring-line">
									<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5 sm:p-6">
										<div>
											<div className="flex flex-wrap items-center gap-2">
												<h2 className="font-display text-sm font-bold text-ink">
													Container details
												</h2>
												<span className="rounded-full bg-ink-soft/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
													Optional
												</span>
											</div>
											<p className="mt-1 text-xs leading-5 text-ink-soft">
												Add containers if this shipment includes
												any. Skip if it doesn't.
											</p>
										</div>

										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={addContainer}
											className="gap-2 border-line bg-paper text-ink hover:bg-sand"
										>
											<Plus className="size-4" />
											Add container
										</Button>
									</div>

									<div className="space-y-4 p-5 sm:p-6">
										{containers.length === 0 ? (
											<div className="rounded-xl border border-dashed border-line bg-sand/50 p-6 text-center text-[12px] text-ink-soft">
												No containers added. This is fine for
												non-containerised cargo.
											</div>
										) : (
											containers.map((container, index) => (
												<div
													key={index}
													className="rounded-xl bg-sand p-4 ring-1 ring-line"
												>
													<div className="mb-4 flex items-center justify-between">
														<div className="flex items-center gap-3">
															<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
																<Package className="size-4" />
															</div>
															<p className="text-[13px] font-semibold text-ink">
																Container {index + 1}
															</p>
														</div>

														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() =>
																removeContainer(index)
															}
															aria-label="Remove container"
															className="text-carmine hover:bg-carmine/10"
														>
															<Trash2 className="size-3.5" />
															Remove
														</Button>
													</div>

													<div className="grid gap-4 sm:grid-cols-2">
														<label className={labelClass}>
															Container number
															<Input
																value={container.containerNo}
																onChange={(event) =>
																	updateContainer(
																		index,
																		"containerNo",
																		event.target.value.toUpperCase()
																	)
																}
																placeholder="e.g. ABCD1234567"
																className="mt-1.5 h-11 border-line bg-paper font-mono text-ink"
															/>
														</label>

														<label className={labelClass}>
															Container size
															<select
																className={inputClass}
																value={container.size}
																onChange={(event) =>
																	updateContainer(
																		index,
																		"size",
																		event.target.value
																	)
																}
															>
																{options.containerSizes.length > 0 ? (
																	options.containerSizes.map(
																		(item) => (
																			<option
																				key={item.id}
																				value={item.label}
																			>
																				{item.label}
																			</option>
																		)
																	)
																) : (
																	<>
																		<option value="20ft">20ft</option>
																		<option value="40ft">40ft</option>
																		<option value="40ft HC">
																			40ft HC
																		</option>
																		<option value="45ft">45ft</option>
																		<option value="Reefer">
																			Reefer
																		</option>
																		<option value="Other">Other</option>
																	</>
																)}
															</select>
														</label>

														<label className={labelClass}>
															Seal number
															<Input
																value={container.sealNo}
																onChange={(event) =>
																	updateContainer(
																		index,
																		"sealNo",
																		event.target.value
																	)
																}
																placeholder="Number printed on the container door"
																className="mt-1.5 h-11 border-line bg-paper font-mono text-ink"
															/>
														</label>

														<label className={labelClass}>
															Packages in container
															<Input
																type="number"
																min="0"
																value={container.packageCount}
																onChange={(event) =>
																	updateContainer(
																		index,
																		"packageCount",
																		event.target.value
																	)
																}
																placeholder="Optional"
																className="mt-1.5 h-11 border-line bg-paper font-mono text-ink"
															/>
														</label>

														<label
															className={cn(
																labelClass,
																"sm:col-span-2"
															)}
														>
															Gross weight (kg)
															<Input
																type="number"
																min="0"
																step="any"
																value={container.grossWeight}
																onChange={(event) =>
																	updateContainer(
																		index,
																		"grossWeight",
																		event.target.value
																	)
																}
																placeholder="Optional container gross weight"
																className="mt-1.5 h-11 border-line bg-paper font-mono text-ink"
															/>
														</label>
														
														<label className={cn(labelClass, "sm:col-span-2")}>
															Cargo Description (Items in this container)
															<Input
																value={container.cargoDescription}
																onChange={(event) => updateContainer(index, "cargoDescription", event.target.value)}
																placeholder="e.g. Electronics, textiles..."
																className="mt-1.5 h-11 border-line bg-paper text-ink"
															/>
														</label>
													</div>
													
													<div className="mt-4 border-t border-line pt-4">
														<div className="flex items-center gap-2 mb-3">
															<ShieldCheck className="size-4 text-orange" />
															<h3 className="font-display text-sm font-bold text-ink">
																Customs Tariff / HS Classification
															</h3>
														</div>
														
														<div className="relative">
															<div className="relative">
																<Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
																<Input
																	value={container.tariffQuery || container.hsCode}
																	onChange={(event) => {
																		void searchCustomsTariffs(index, event.target.value);
																	}}
																	onFocus={() => {
																		if (container.tariffQuery.length >= 2) {
																			setContainers(current => current.map((c, i) => i === index ? { ...c, showTariffDropdown: true } : c));
																		}
																	}}
																	placeholder="Search HS code or commodity description (e.g. 0403201000)"
																	className="h-12 w-full rounded-xl border-line bg-paper pl-10 pr-10 font-mono text-sm text-ink transition focus:ring-2 focus:ring-orange/30"
																/>
																{container.searchingTariffs && (
																	<Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-soft" />
																)}
															</div>
															
															{container.tariffSearchError && (
																<p role="alert" className="mt-2 text-xs text-carmine">{container.tariffSearchError}</p>
															)}

															{container.showTariffDropdown && container.tariffResults.length > 0 && (
																<div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-80 overflow-y-auto rounded-xl bg-paper p-1.5 shadow-2xl ring-1 ring-line">
																	{container.tariffResults.map((tariff) => (
																		<button
																			key={tariff.id}
																			type="button"
																			onClick={() => chooseCustomsTariff(index, tariff)}
																			className="flex w-full flex-col rounded-lg px-3 py-3 text-left transition-colors hover:bg-sand focus:bg-sand focus:outline-none"
																		>
																			<div className="flex w-full items-start justify-between gap-4">
																				<div className="min-w-0 flex-1">
																					<span className="block font-mono text-[13px] font-semibold text-ink">{tariff.hs_code}</span>
																					<span className="mt-1 block text-[13px] leading-5 text-ink-soft">{tariff.description}</span>
																				</div>
																				<span className="shrink-0 rounded-md bg-sand-2 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-soft ring-1 ring-line">
																					{tariff.category || "General"}
																				</span>
																			</div>
																			<div className="mt-2 flex gap-4 font-mono text-[10px] text-ink-soft">
																				<span>Rate: {tariff.rate ?? "—"}{tariff.rate_type === "PERCENTAGE" ? "%" : ""}</span>
																				{tariff.import_duty && <span>Duty: {tariff.import_duty}%</span>}
																				{tariff.vat && <span>VAT: {tariff.vat}%</span>}
																			</div>
																		</button>
																	))}
																</div>
															)}

															{container.selectedTariff && (
																<div className="mt-3 flex flex-col gap-3 rounded-xl border border-teal/25 bg-teal/5 p-4 sm:flex-row sm:items-center sm:justify-between">
																	<div className="min-w-0 flex-1">
																		<div className="flex items-center gap-2">
																			<CheckCircle2 className="size-4 text-teal-deep" />
																			<p className="text-[13px] font-semibold text-teal-deep">
																				{container.selectedTariff.hs_code}
																			</p>
																		</div>
																		<p className="mt-1 truncate text-[13px] text-ink">
																			{container.selectedTariff.description}
																		</p>
																	</div>
																	
																	<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
																		<div>
																			<p className="font-mono text-[9px] uppercase tracking-wider text-teal-deep/70">Import duty</p>
																			<p className="font-mono text-[13px] font-semibold text-teal-deep">{formatTariffRate(container.selectedTariff.import_duty)}</p>
																		</div>
																		<div>
																			<p className="font-mono text-[9px] uppercase tracking-wider text-teal-deep/70">VAT</p>
																			<p className="font-mono text-[13px] font-semibold text-teal-deep">{formatTariffRate(container.selectedTariff.vat)}</p>
																		</div>
																		{container.selectedTariff.levy && (
																			<div>
																				<p className="font-mono text-[9px] uppercase tracking-wider text-teal-deep/70">Levy</p>
																				<p className="font-mono text-[13px] font-semibold text-teal-deep">{container.selectedTariff.levy}%</p>
																			</div>
																		)}
																		
																		<Button
																			type="button"
																			variant="ghost"
																			size="sm"
																			onClick={() => clearCustomsTariff(index)}
																			className="ml-2 h-8 px-2 text-xs text-teal-deep hover:bg-teal/10 hover:text-teal-deep"
																		>
																			Clear
																		</Button>
																	</div>
																</div>
															)}
															
															<p className="mt-3 text-[11px] leading-5 text-ink-soft">
																Select a result to link the tariff record to this container. Classification should be verified before customs assessment.
															</p>
														</div>
													</div>
												</div>
											))
										)}
									</div>
								</div>
							</motion.section>
						)}

						{step === 4 && (
							<motion.section
								key="step-4"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -12 }}
								className="space-y-5"
							>
								<div className="rounded-2xl bg-paper ring-1 ring-line">
									<SectionHeader
										title="Supporting documents"
										description="Attach each required document. Only PDF, PNG, JPG and JPEG up to 10 MB are accepted."
									/>

									{missingDocs.length > 0 && (
										<div className="mx-5 mt-5 rounded-xl border-l-4 border-coral bg-coral/5 p-4 ring-1 ring-coral/20 sm:mx-6">
											<div className="flex items-start gap-3">
												<X className="mt-0.5 size-4 shrink-0 text-coral" />
												<div className="min-w-0">
													<p className="text-[13px] font-semibold text-ink">
														Missing required documents
													</p>
													<p className="mt-1 text-[12px] leading-5 text-ink-soft">
														Attach{" "}
														{missingDocs.length === 1
															? "the required document"
															: "all required documents"}{" "}
														below before submitting:{" "}
														<span className="font-semibold text-ink">
															{missingDocs.join(", ")}
														</span>
														.
													</p>
												</div>
											</div>
										</div>
									)}

									<div className="space-y-4 p-5 sm:p-6">
										{options.supportingDocuments.length === 0 ? (
											<div className="rounded-xl border border-dashed border-line bg-sand/50 p-6 text-center text-[12px] text-ink-soft">
												No document requirements were returned by
												the server. You may continue, but please
												confirm with operations.
											</div>
										) : (
											options.supportingDocuments.map(
												(requirement) => {
													const attached =
														documentsForRequirement(
															requirement.documentKey
														);
													const missing =
														requirement.required &&
														attached.length === 0;

													return (
														<div
															key={requirement.documentKey}
															className={cn(
																"rounded-xl p-4 ring-1",
																missing
																	? "bg-coral/5 ring-coral/25"
																	: "bg-sand ring-line"
															)}
														>
															<div className="flex flex-wrap items-start justify-between gap-3">
																<div className="min-w-0">
																	<div className="flex flex-wrap items-center gap-2">
																		<p className="text-[13px] font-semibold text-ink">
																			{requirement.label}
																		</p>
																		{requirement.required ? (
																			<span className="rounded-full bg-coral/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-coral">
																				Required
																			</span>
																		) : (
																			<span className="rounded-full bg-ink-soft/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
																				Optional
																			</span>
																		)}
																		{requirement.allowMultiple && (
																			<span className="rounded-full bg-orange/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-orange-deep">
																				Multiple
																			</span>
																		)}
																	</div>
																	<p className="mt-1 text-[11px] leading-5 text-ink-soft">
																		{requirement.allowMultiple
																			? "Attach one or more files."
																			: "Attach a single file."}
																	</p>
																</div>

																<label
																	className={cn(
																		"flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 text-[12px] font-semibold transition",
																		missing
																			? "border-coral/40 bg-paper text-coral hover:bg-coral/5"
																			: "border-line bg-paper text-ink-soft hover:border-orange/40 hover:bg-orange/5 hover:text-orange-deep"
																	)}
																>
																	<Upload className="size-3.5" />
																	{attached.length && !requirement.allowMultiple
																		? "Replace file"
																		: "Choose file"}
																	<input
																		type="file"
																		multiple={requirement.allowMultiple}
																		accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
																		className="sr-only"
																		onChange={(event) => {
																			handleFiles(
																				event.target.files,
																				requirement
																			);
																			event.target.value = "";
																		}}
																	/>
																</label>
															</div>

															{attached.length > 0 && (
																<div className="mt-3 space-y-2">
																	{attached.map((document) => {
																		const name =
																			document.kind === "new"
																				? document.file.name
																				: document.originalName;
																		const sizeLabel =
																			document.kind === "new"
																				? `${(
																						document.file
																							.size / 1024
																				  ).toFixed(1)} KB`
																				: document.fileSize != null
																					? `${(
																							document.fileSize /
																							1024
																					  ).toFixed(1)} KB`
																					: "—";
																		const isExisting =
																			document.kind ===
																			"existing";
																		const href =
																			isExisting &&
																			document.filePath
																				? resolveSrc(
																						document.filePath
																				  )
																				: undefined;

																		return (
																			<div
																				key={document.id}
																				className="flex items-center gap-3 rounded-lg bg-paper p-2.5 ring-1 ring-line"
																			>
																				<div className="grid size-9 shrink-0 place-items-center rounded-md bg-orange/10 text-orange-deep">
																					<FileText className="size-3.5" />
																				</div>
																				<div className="min-w-0 flex-1">
																					<p className="truncate text-[12px] font-semibold text-ink">
																						{name}
																					</p>
																					<p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
																						{
																							document.documentLabel
																						}{" "}
																						· {sizeLabel}
																						{isExisting &&
																							" · already uploaded"}
																					</p>
																				</div>
																				{href && (
																					<a
																						href={href}
																						target="_blank"
																						rel="noopener noreferrer"
																						className="grid size-8 shrink-0 place-items-center rounded-md text-orange-deep hover:bg-orange/10"
																						aria-label={`Open ${name}`}
																					>
																						<FileText className="size-3.5" />
																					</a>
																				)}
																				<button
																					type="button"
																					onClick={() =>
																						removeDocument(
																							document.id
																						)
																					}
																					aria-label="Remove document"
																					className="grid size-8 shrink-0 place-items-center rounded-md text-carmine transition-colors hover:bg-carmine/10"
																				>
																					<X className="size-3.5" />
																				</button>
																			</div>
																		);
																	})}
																</div>
															)}
														</div>
													);
												}
											)
										)}

										<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
											<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
												Before submitting
											</p>
											<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
												<li className="flex items-start gap-2">
													<CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-orange-deep" />
													Ensure the bill of lading and cargo details
													are accurate.
												</li>
												<li className="flex items-start gap-2">
													<CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-orange-deep" />
													Verify container numbers, quantities and
													seal references.
												</li>
												<li className="flex items-start gap-2">
													<CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-orange-deep" />
													Attach all documents required for your
													shipment.
												</li>
											</ul>
										</div>
									</div>
								</div>

								<div className="rounded-2xl bg-paper ring-1 ring-line">
									<SectionHeader
										title="Shipment summary"
										description="Review the declaration before submitting."
									/>

									<div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
										{[
											{
												label: "Bill of lading",
												value: form.billOfLading || "Not provided",
											},
											{
												label: "Shipment type",
												value: form.shipmentType || "Not selected",
											},
											{
												label: "Route",
												value:
													form.originPort || form.destinationPort
														? `${form.originPort || "Origin"} → ${
																form.destinationPort || "Destination"
															}`
														: "Not provided",
											},
											{
												label: "Vessel",
												value:
													form.vesselName || form.voyageNumber
														? `${form.vesselName || "Vessel"} ${
																form.voyageNumber
																	? `· ${form.voyageNumber}`
																	: ""
															}`
														: "Not provided",
											},
											{
												label: "Cargo",
												value:
													form.cargoDescription ||
													"Not provided",
											},
											{
												label: "Consignee",
												value:
													consignee.type === "organisation"
														? consignee.organisationName || "Not provided"
														: consignee.fullName || "Not provided",
											},
											{
												label: "Agent",
												value: consignee.agentName || "Not provided",
											},
											{
												label: "Total packages",
												value:
													form.packageCount || "Not provided",
											},
											{
												label: "Containers entered",
												value: String(
													validContainersForSubmit().length
												),
											},
											{
												label: "Documents attached",
												value: String(
													documents.filter(
														(d) =>
															d.kind === "new" || d.keep
													).length
												),
											},
										].map((item) => (
											<div
												key={item.label}
												className="min-w-0 rounded-lg bg-sand p-3 ring-1 ring-line"
											>
												<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
													{item.label}
												</p>
												<p className="mt-1.5 break-words text-[13px] font-semibold text-ink">
													{item.value}
												</p>
											</div>
										))}
									</div>

									{validContainersForSubmit().length > 0 && (
										<div className="border-t border-line p-5 sm:p-6">
											<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
												Containers
											</p>
											<ul className="mt-3 space-y-2">
												{validContainersForSubmit().map(
													(container, index) => (
														<li
															key={`${container.containerNo}-${index}`}
															className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-sand p-3 ring-1 ring-line"
														>
															<span className="font-mono text-[12px] font-semibold text-ink">
																{container.containerNo}
															</span>
															<span className="font-mono text-[11px] text-ink-soft">
																{container.size}
															</span>
															{container.sealNo && (
																<span className="font-mono text-[11px] text-ink-soft">
																	· seal {container.sealNo}
																</span>
															)}
															{container.packageCount && (
																<span className="font-mono text-[11px] text-ink-soft">
																	· {container.packageCount} pkgs
																</span>
															)}
															{container.grossWeight && (
																<span className="font-mono text-[11px] text-ink-soft">
																	· {container.grossWeight} kg
																</span>
															)}
															{container.cargoDescription && (
																<span className="font-mono text-[11px] text-ink-soft">
																	· {container.cargoDescription}
																</span>
															)}
															{container.hsCode && (
																<span className="font-mono text-[11px] text-ink-soft">
																	· HS: {container.hsCode}
																</span>
															)}
														</li>
													)
												)}
											</ul>
										</div>
									)}

									<div className="border-t border-line p-5 sm:p-6">
										<label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
											<input
												type="checkbox"
												checked={declarationAccepted}
												onChange={(event) =>
													setDeclarationAccepted(event.target.checked)
												}
												className="mt-0.5 size-4 shrink-0 accent-orange"
											/>
											<span className="text-[12px] leading-5 text-ink">
												I confirm that the shipment information
												provided is accurate to the best of my
												knowledge and that the supporting documents
												relate to this declaration.
											</span>
										</label>

										<p className="mt-3 text-[11px] leading-5 text-ink-soft">
											Submitting a declaration does not confirm
											terminal acceptance, customs clearance or
											cargo release. Those decisions are handled by
											the appropriate authorised parties.
										</p>
									</div>
								</div>
							</motion.section>
						)}
					</AnimatePresence>

					<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="min-w-0">
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
									Step {step} of 4
								</p>
								<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
									{steps[step - 1]?.label ?? ""}
								</p>
								{step === 4 && missingDocs.length > 0 && (
									<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-coral">
										Missing: {missingDocs.join(", ")}
									</p>
								)}
							</div>

							<div className="flex flex-wrap items-center gap-2">
								{step > 1 && (
									<Button
										type="button"
										variant="outline"
										onClick={() => setStep(step - 1)}
										className="border-sand/25 bg-transparent text-sand hover:bg-sand/10"
									>
										<ArrowLeft className="mr-2 size-4" />
										Previous
									</Button>
								)}

								{step < 4 ? (
									<Button
										type="submit"
										className="gap-2 bg-orange text-white hover:bg-orange-deep"
									>
										Continue
										<ArrowRight className="size-4" />
									</Button>
								) : (
									<Button
										type="submit"
										disabled={!canSubmit}
										className="gap-2 bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
									>
										{submitting
											? "Preparing…"
											: isEditing
												? "Update declaration"
												: "Submit declaration"}
										<CheckCircle2 className="size-4" />
									</Button>
								)}
							</div>
						</div>
					</div>
				</form>
			</div>
		</AppShell>
	);
}

function SectionHeader({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="border-b border-line p-5 sm:p-6">
			<h2 className="font-display text-sm font-bold text-ink">{title}</h2>
			<p className="mt-1 text-xs leading-5 text-ink-soft">{description}</p>
		</div>
	);
}

function CheckboxCard({
	checked,
	onChange,
	title,
	description,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	title: string;
	description: string;
}) {
	return (
		<label
			className={cn(
				"flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
				checked
					? "border-orange bg-orange/5 ring-1 ring-orange/25"
					: "border-line bg-sand hover:bg-sand-2"
			)}
		>
			<input
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange(event.target.checked)}
				className="mt-1 size-4 shrink-0 accent-orange"
			/>
			<span className="min-w-0">
				<span className="block text-[13px] font-semibold text-ink">
					{title}
				</span>
				<span className="mt-0.5 block text-[11px] leading-5 text-ink-soft">
					{description}
				</span>
			</span>
		</label>
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
		<div className="space-y-5 p-5 sm:p-6">
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
		<div className="relative mt-1.5">
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
		<div className="relative mt-1.5">
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