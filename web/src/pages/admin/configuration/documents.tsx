import { useEffect, useMemo, useState } from "react";
import {
	AlertTriangle,
	Check,
	ChevronDown,
	FileText,
	Hash,
	LockKeyhole,
	Plus,
	Save,
	Search,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type DocumentType = {
	id: string;
	key: string;
	label: string;
};

type DocumentRule = {
	isRequired: boolean;
	allowMultiple: boolean;
};

type UploadLocation = {
	id: string;
	key: string;
	label: string;
	description: string;
	documents: Record<string, DocumentRule>;
};

type DocumentConfig = {
	id?: string;
	numberingPrefix: string;
	numberingFormat: string;
	retentionMonths: number;
	documentTypes: DocumentType[];
	uploadLocations: UploadLocation[];
};

type ServerLocation = {
	id?: string;
	key?: string;
	location_key?: string;
	label?: string;
	description?: string;
	document_type_keys?: string[];
	documentTypeKeys?: string[];
	document_settings?: any;
	documentSettings?: any;
	documents?: any;
	allow_multiple?: boolean;
};

const locationDefinitions = [
	{
		key: "quote_request",
		label: "Quote Request",
		description: "Documents attached to a quotation request.",
	},
	{
		key: "organisation_kyc",
		label: "Organisation KYC / Onboarding",
		description: "CAC, TIN, licences and authorised signatory documents.",
	},
	{
		key: "shipment_documents",
		label: "Shipment / Consignment",
		description: "Documents associated with a shipment or consignment.",
	},
	{
		key: "document_centre",
		label: "Document Centre",
		description: "Additional documents requested for cargo processing or compliance.",
	},
	{
		key: "proof_of_payment",
		label: "Proof of Payment",
		description: "Payment evidence submitted for finance confirmation.",
	},
	{
		key: "receiving_tally",
		label: "Receiving / Tally",
		description: "Cargo condition, quantity, seal and discrepancy evidence.",
	},
	{
		key: "examination",
		label: "Examination / Inspection",
		description: "Inspection photographs and examination evidence.",
	},
	{
		key: "loading_collection",
		label: "Loading / Collection",
		description: "Evidence of loading, cargo condition and collection.",
	},
	{
		key: "damage_claim",
		label: "Discrepancy / Damage Claim",
		description: "Photographs and supporting evidence for cargo claims.",
	},
	{
		key: "gate_vehicle_driver",
		label: "Gate / Vehicle and Driver",
		description: "Applicable driver licences, vehicle insurance and roadworthiness documents.",
	},
];

function createEmptyConfig(): DocumentConfig {
	return {
		numberingPrefix: "TRN",
		numberingFormat: "TRN-{TYPE}-{YYYY}-{SEQ:6}",
		retentionMonths: 84,
		documentTypes: [],
		uploadLocations: locationDefinitions.map((location) => ({
			id: location.key,
			key: location.key,
			label: location.label,
			description: location.description,
			documents: {},
		})),
	};
}

function createKeyFromName(name: string): string {
	const cleaned = name
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");

	let key = cleaned || "document";

	if (!/^[a-z]/.test(key)) {
		key = `document_${key}`;
	}

	return key.slice(0, 80).replace(/_+$/g, "") || "document";
}

function createUniqueKey(
	name: string,
	documentTypes: DocumentType[],
	excludeId?: string
): string {
	const base = createKeyFromName(name);

	const used = new Set(
		documentTypes
			.filter((item) => item.id !== excludeId)
			.map((item) => item.key.trim().toLowerCase())
			.filter(Boolean)
	);

	if (!used.has(base)) return base;

	let suffix = 2;
	while (used.has(`${base}_${suffix}`)) suffix++;

	return `${base}_${suffix}`.slice(0, 80);
}

function toBoolean(value: unknown): boolean {
	return value === true || value === 1 || value === "1" || value === "true";
}

function normaliseDocumentType(item: any): DocumentType {
	return {
		id: String(item?.id ?? crypto.randomUUID()),
		key: String(item?.key ?? item?.document_key ?? ""),
		label: String(item?.label ?? item?.name ?? ""),
	};
}

function normaliseDocumentRule(value: any): DocumentRule {
	return {
		isRequired: toBoolean(
			value?.is_required ??
				value?.isRequired ??
				value?.required ??
				false
		),
		allowMultiple: toBoolean(
			value?.allow_multiple ??
				value?.allowMultiple ??
				value?.multiple ??
				false
		),
	};
}

function extractRuleMap(source: any): Record<string, DocumentRule> {
	const result: Record<string, DocumentRule> = {};

	if (!source) return result;

	if (Array.isArray(source)) {
		source.forEach((entry: any) => {
			const key = String(
				entry?.document_key ?? entry?.key ?? entry?.documentKey ?? ""
			);
			if (key) {
				result[key] = normaliseDocumentRule(entry);
			}
		});
		return result;
	}

	if (typeof source === "object") {
		Object.entries(source).forEach(([key, value]) => {
			if (!key) return;
			if (typeof value === "string" || typeof value === "number") {
				result[key] = {
					isRequired: toBoolean(value),
					allowMultiple: false,
				};
				return;
			}
			result[key] = normaliseDocumentRule(value);
		});
	}

	return result;
}

function normaliseUploadLocation(
	serverLocation: ServerLocation,
	fallback: { key: string; label: string; description: string }
): UploadLocation {
	const documents: Record<string, DocumentRule> = {};

	const sources = [
		serverLocation.document_settings,
		serverLocation.documentSettings,
		serverLocation.documents,
	];

	sources.forEach((source) => {
		const rules = extractRuleMap(source);
		Object.entries(rules).forEach(([key, rule]) => {
			documents[key] = rule;
		});
	});

	const keyList = Array.isArray(serverLocation.document_type_keys)
		? serverLocation.document_type_keys
		: Array.isArray(serverLocation.documentTypeKeys)
			? serverLocation.documentTypeKeys
			: [];

	keyList.forEach((rawKey) => {
		const key = String(rawKey);
		if (!key) return;

		if (!documents[key]) {
			documents[key] = { isRequired: false, allowMultiple: false };
		}
	});

	return {
		id: String(serverLocation.id ?? fallback.key),
		key: String(
			serverLocation.key ??
				serverLocation.location_key ??
				fallback.key
		),
		label: String(serverLocation.label ?? fallback.label),
		description: String(
			serverLocation.description ?? fallback.description
		),
		documents,
	};
}

export default function AdminDocumentsConfigurationPage() {
	const [config, setConfig] = useState<DocumentConfig>(createEmptyConfig);
	const [savedConfig, setSavedConfig] =
		useState<DocumentConfig>(createEmptyConfig);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [dirty, setDirty] = useState(false);
	const [error, setError] = useState("");
	const [openLocationId, setOpenLocationId] = useState<string | null>(null);
	const [searchByLocation, setSearchByLocation] = useState<
		Record<string, string>
	>({});

	async function loadConfig() {
		setLoading(true);
		setError("");

		try {
			const response = await http.get("/admin/config/documents/");
			const result: Resp = response.data;

			if (result.error) {
				setError(
					typeof result.data === "string"
						? result.data
						: "Could not load document configuration."
				);
				return;
			}

			const data: any = result.code ?? {};
			const defaults = createEmptyConfig();

			const rawTypes = Array.isArray(data.document_types)
				? data.document_types
				: Array.isArray(data.documentTypes)
					? data.documentTypes
					: [];

			const rawLocations: ServerLocation[] = Array.isArray(
				data.upload_locations
			)
				? data.upload_locations
				: Array.isArray(data.uploadLocations)
					? data.uploadLocations
					: [];

			const locationsByKey = new Map<string, ServerLocation>();
			rawLocations.forEach((item) => {
				const key = String(
					item?.key ?? item?.location_key ?? ""
				);
				if (key) locationsByKey.set(key, item);
			});

			const documentTypes = rawTypes.map(normaliseDocumentType);

			const uploadLocations = defaults.uploadLocations.map(
				(defaultLocation) => {
					const serverLocation = locationsByKey.get(
						defaultLocation.key
					);
					if (!serverLocation) return defaultLocation;

					return normaliseUploadLocation(serverLocation, {
						key: defaultLocation.key,
						label: defaultLocation.label,
						description: defaultLocation.description,
					});
				}
			);

			const loaded: DocumentConfig = {
				...(data.id ? { id: String(data.id) } : {}),
				numberingPrefix: String(
					data.numbering_prefix ?? data.numberingPrefix ?? "TRN"
				),
				numberingFormat: String(
					data.numbering_format ??
						data.numberingFormat ??
						"TRN-{TYPE}-{YYYY}-{SEQ:6}"
				),
				retentionMonths: Number(
					data.retention_months ?? data.retentionMonths ?? 84
				),
				documentTypes,
				uploadLocations,
			};

			setConfig(loaded);
			setSavedConfig(structuredClone(loaded));
			setDirty(false);
			setOpenLocationId(null);
			setSearchByLocation({});
		} catch (err: any) {
			setError(
				err?.response?.data?.data ||
					err?.response?.data?.message ||
					"Could not load document configuration."
			);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		void loadConfig();
	}, []);

	function updateConfig<K extends keyof DocumentConfig>(
		key: K,
		value: DocumentConfig[K]
	) {
		setConfig((current) => ({ ...current, [key]: value }));
		setDirty(true);
	}

	function addDocumentType() {
		setConfig((current) => ({
			...current,
			documentTypes: [
				...current.documentTypes,
				{
					id: crypto.randomUUID(),
					key: "",
					label: "",
				},
			],
		}));
		setDirty(true);
	}

	function updateDocumentName(id: string, label: string) {
		setConfig((current) => {
			const previous = current.documentTypes.find(
				(item) => item.id === id
			);
			if (!previous) return current;

			const key = createUniqueKey(label, current.documentTypes, id);

			const documentTypes = current.documentTypes.map((item) =>
				item.id === id ? { ...item, label, key } : item
			);

			const uploadLocations = current.uploadLocations.map(
				(location) => {
					const documents = { ...location.documents };
					const previousRule = previous.key
						? documents[previous.key]
						: undefined;

					if (
						previous.key &&
						previous.key !== key &&
						previousRule
					) {
						documents[key] = previousRule;
						delete documents[previous.key];
					}

					return { ...location, documents };
				}
			);

			return { ...current, documentTypes, uploadLocations };
		});

		setDirty(true);
	}

	function removeDocumentType(id: string) {
		const document = config.documentTypes.find((item) => item.id === id);
		if (!document) return;

		setConfig((current) => ({
			...current,
			documentTypes: current.documentTypes.filter(
				(item) => item.id !== id
			),
			uploadLocations: current.uploadLocations.map((location) => {
				const documents = { ...location.documents };
				if (document.key) delete documents[document.key];
				return { ...location, documents };
			}),
		}));

		setDirty(true);
	}

	function updateDocumentRule(
		locationId: string,
		documentKey: string,
		changes: Partial<DocumentRule>
	) {
		setConfig((current) => ({
			...current,
			uploadLocations: current.uploadLocations.map((location) => {
				if (location.id !== locationId) return location;

				const documents = { ...location.documents };
				const existing = documents[documentKey] ?? {
					isRequired: false,
					allowMultiple: false,
				};

				documents[documentKey] = { ...existing, ...changes };

				return { ...location, documents };
			}),
		}));

		setDirty(true);
	}

	function toggleDocumentType(locationId: string, documentKey: string) {
		setConfig((current) => ({
			...current,
			uploadLocations: current.uploadLocations.map((location) => {
				if (location.id !== locationId) return location;

				const documents = { ...location.documents };

				if (documents[documentKey]) {
					delete documents[documentKey];
				} else {
					documents[documentKey] = {
						isRequired: false,
						allowMultiple: false,
					};
				}

				return { ...location, documents };
			}),
		}));

		setDirty(true);
	}

	function selectAllFilteredTypes(
		location: UploadLocation,
		filteredTypes: DocumentType[]
	) {
		setConfig((current) => ({
			...current,
			uploadLocations: current.uploadLocations.map((item) => {
				if (item.id !== location.id) return item;

				const documents = { ...item.documents };

				filteredTypes.forEach((document) => {
					if (!documents[document.key]) {
						documents[document.key] = {
							isRequired: false,
							allowMultiple: false,
						};
					}
				});

				return { ...item, documents };
			}),
		}));

		setDirty(true);
	}

	function clearFilteredTypes(
		location: UploadLocation,
		filteredTypes: DocumentType[]
	) {
		const keys = new Set(filteredTypes.map((item) => item.key));

		setConfig((current) => ({
			...current,
			uploadLocations: current.uploadLocations.map((item) => {
				if (item.id !== location.id) return item;

				const documents = { ...item.documents };
				keys.forEach((key) => delete documents[key]);

				return { ...item, documents };
			}),
		}));

		setDirty(true);
	}

	const documentPreview = useMemo(() => {
		const firstType = config.documentTypes.find((item) => item.key.trim());

		return config.numberingFormat
			.replaceAll(
				"{TYPE}",
				(firstType?.key || "DOCUMENT").toUpperCase()
			)
			.replaceAll("{YYYY}", String(new Date().getFullYear()))
			.replace(/\{SEQ:(\d+)\}/g, (_match, width: string) =>
				"1".padStart(Number(width), "0")
			);
	}, [config.numberingFormat, config.documentTypes]);

	function validateConfig() {
		if (!config.numberingPrefix.trim()) {
			toast.error("Enter a numbering prefix.");
			return false;
		}

		if (!/^[A-Za-z0-9_-]{1,20}$/.test(config.numberingPrefix.trim())) {
			toast.error("The numbering prefix contains invalid characters.");
			return false;
		}

		if (
			!config.numberingFormat.includes("{TYPE}") ||
			!config.numberingFormat.includes("{YYYY}") ||
			!/\{SEQ:\d+\}/.test(config.numberingFormat)
		) {
			toast.error(
				"The format must contain {TYPE}, {YYYY} and a token such as {SEQ:6}."
			);
			return false;
		}

		if (
			!Number.isInteger(config.retentionMonths) ||
			config.retentionMonths < 1 ||
			config.retentionMonths > 1200
		) {
			toast.error("Retention must be between 1 and 1,200 months.");
			return false;
		}

		if (config.documentTypes.length === 0) {
			toast.error("Add at least one document type.");
			return false;
		}

		if (
			config.documentTypes.some(
				(item) => !item.label.trim() || !item.key.trim()
			)
		) {
			toast.error("Enter a name for every document type.");
			return false;
		}

		const keys = config.documentTypes.map((item) =>
			item.key.trim().toLowerCase()
		);

		if (new Set(keys).size !== keys.length) {
			toast.error("Document type keys must be unique.");
			return false;
		}

		if (
			config.documentTypes.some(
				(item) => !/^[a-z][a-z0-9_]*$/.test(item.key)
			)
		) {
			toast.error(
				"A document key is invalid. Rename the document to regenerate its key."
			);
			return false;
		}

		const validKeys = new Set(config.documentTypes.map((item) => item.key));

		for (const location of config.uploadLocations) {
			for (const key of Object.keys(location.documents)) {
				if (!validKeys.has(key)) {
					toast.error(
						"An upload location references a document that no longer exists."
					);
					return false;
				}
			}
		}

		return true;
	}

	async function saveConfig() {
		if (saving || !dirty) return;
		if (!validateConfig()) return;

		setSaving(true);

		try {
			const formData = new FormData();

			if (config.id) {
				formData.append("id", config.id);
			}

			formData.append(
				"numbering_prefix",
				config.numberingPrefix.trim()
			);
			formData.append(
				"numbering_format",
				config.numberingFormat.trim()
			);
			formData.append(
				"retention_months",
				String(config.retentionMonths)
			);

			formData.append(
				"document_types",
				JSON.stringify(
					config.documentTypes.map((item) => ({
						id: item.id,
						key: item.key.trim(),
						label: item.label.trim(),
					}))
				)
			);

			formData.append(
				"upload_locations",
				JSON.stringify(
					config.uploadLocations.map((location) => {
						const documentSettings = Object.entries(
							location.documents
						).map(([documentKey, rule]) => ({
							document_key: documentKey,
							is_required: rule.isRequired ? 1 : 0,
							allow_multiple: rule.allowMultiple ? 1 : 0,
						}));

						return {
							id: location.id,
							key: location.key,
							label: location.label,
							description: location.description,
							document_type_keys: Object.keys(
								location.documents
							),
							document_settings: documentSettings,
							is_active: true,
						};
					})
				)
			);

			const response = await http.post(
				"/admin/config/documents/update/",
				formData
			);

			const result: Resp = response.data;

			if (result.error) {
				toast.error(
					typeof result.data === "string"
						? result.data
						: "Could not save document configuration."
				);
				return;
			}

			toast.success("Document configuration saved successfully.");
			await loadConfig();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.data ||
					err?.response?.data?.message ||
					"Could not save document configuration."
			);
		} finally {
			setSaving(false);
		}
	}

	function discardChanges() {
		setConfig(structuredClone(savedConfig));
		setDirty(false);
		setError("");
		toast.success("Unsaved changes discarded.");
	}

	return (
		<AppShell
			title="Documents configuration"
			eyebrow="Administration · Configuration"
		>
			<div className="space-y-6 pb-8">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Administration · Configuration
						</p>
						<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
							Documents configuration
						</h2>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
							Manage document types, upload locations and
							document-specific rules for each location.
						</p>
					</div>
				</div>

				{error && (
					<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
						<div className="flex items-start gap-3">
							<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
								<AlertTriangle className="size-5" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="font-display text-sm font-bold text-ink">
									Unable to load configuration
								</p>
								<p className="mt-1 text-[12px] leading-5 text-ink-soft">
									{error}
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => void loadConfig()}
								className="border-line bg-paper text-ink hover:bg-sand"
							>
								Retry
							</Button>
						</div>
					</div>
				)}

				{loading ? (
					<div className="flex items-center justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
						<span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
					</div>
				) : (
					<>
						<section className="rounded-2xl bg-paper ring-1 ring-line">
							<div className="border-b border-line p-5">
								<div className="flex items-start gap-3">
									<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
										<Hash className="size-4" />
									</div>
									<div className="min-w-0">
										<h3 className="font-display text-sm font-bold text-ink">
											Numbering and retention
										</h3>
										<p className="mt-1 text-[12px] leading-5 text-ink-soft">
											Set the numbering pattern and retention period.
										</p>
									</div>
								</div>
							</div>

							<div className="grid gap-4 p-5 sm:grid-cols-2">
								<label className="block">
									<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Numbering prefix
									</span>
									<Input
										value={config.numberingPrefix}
										maxLength={20}
										onChange={(event) =>
											updateConfig(
												"numberingPrefix",
												event.target.value
											)
										}
										placeholder="TRN"
										className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
									/>
								</label>

								<label className="block">
									<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Retention period
									</span>
									<div className="mt-1.5 flex items-center gap-2">
										<Input
											type="number"
											min={1}
											max={1200}
											value={String(config.retentionMonths)}
											onChange={(event) =>
												updateConfig(
													"retentionMonths",
													Number(event.target.value) || 0
												)
											}
											className="h-11 w-32 border-line bg-sand font-mono text-ink"
										/>
										<span className="font-mono text-[11px] text-ink-soft">
											months
										</span>
									</div>
								</label>

								<label className="block sm:col-span-2">
									<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Numbering format
									</span>
									<Input
										value={config.numberingFormat}
										onChange={(event) =>
											updateConfig(
												"numberingFormat",
												event.target.value
											)
										}
										placeholder="TRN-{TYPE}-{YYYY}-{SEQ:6}"
										className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
									/>
									<span className="mt-1 block text-[10px] text-ink-soft">
										Use {"{TYPE}"}, {"{YYYY}"} and a sequence
										token such as {"{SEQ:6}"}.
									</span>
								</label>

								<div className="rounded-xl bg-sand p-4 ring-1 ring-line sm:col-span-2">
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Example document reference
									</p>
									<p className="mt-2 break-all font-mono text-sm font-semibold text-ink">
										{documentPreview}
									</p>
								</div>
							</div>
						</section>

						<section className="rounded-2xl bg-paper ring-1 ring-line">
							<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
								<div className="flex items-start gap-3">
									<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
										<FileText className="size-4" />
									</div>
									<div className="min-w-0">
										<h3 className="font-display text-sm font-bold text-ink">
											Document types
										</h3>
										<p className="mt-1 text-[12px] leading-5 text-ink-soft">
											Enter a name. The unique key is generated
											automatically.
										</p>
									</div>
								</div>

								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addDocumentType}
									className="border-line bg-paper text-ink hover:bg-sand"
								>
									<Plus className="size-3.5" />
									Add document type
								</Button>
							</div>

							{config.documentTypes.length === 0 ? (
								<div className="p-8 text-center">
									<FileText className="mx-auto size-8 text-ink-soft" />
									<p className="mt-3 text-sm font-semibold text-ink">
										No document types yet
									</p>
									<p className="mt-1 text-xs text-ink-soft">
										Add the documents your users may upload.
									</p>
								</div>
							) : (
								<ul className="divide-y divide-line">
									{config.documentTypes.map((document, index) => (
										<li
											key={document.id}
											className="flex flex-wrap items-start gap-4 p-5"
										>
											<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
												<FileText className="size-4" />
											</div>

											<div className="grid min-w-[240px] flex-1 gap-3 sm:grid-cols-[1.2fr_1fr]">
												<label className="block">
													<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														Document name
													</span>
													<Input
														value={document.label}
														onChange={(event) =>
															updateDocumentName(
																document.id,
																event.target.value
															)
														}
														placeholder="e.g. Certificate of Incorporation"
														className="mt-1.5 h-10 border-line bg-sand text-ink"
													/>
												</label>

												<div>
													<span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														<LockKeyhole className="size-3" />
														Generated key
													</span>
													<div className="mt-1.5 flex h-10 items-center rounded-md border border-line bg-sand/60 px-3 font-mono text-[12px] text-ink-soft">
														<span className="truncate">
															{document.key ||
																"Generated from name"}
														</span>
													</div>
												</div>
											</div>

											<Button
												type="button"
												variant="ghost"
												size="sm"
												aria-label={`Remove ${
													document.label ||
													`document ${index + 1}`
												}`}
												onClick={() =>
													removeDocumentType(document.id)
												}
												className="text-carmine hover:bg-carmine/10"
											>
												<Trash2 className="size-3.5" />
												Remove
											</Button>
										</li>
									))}
								</ul>
							)}
						</section>

						<section className="rounded-2xl bg-paper ring-1 ring-line">
							<div className="border-b border-line p-5">
								<div className="flex items-start gap-3">
									<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
										<Upload className="size-4" />
									</div>
									<div className="min-w-0">
										<h3 className="font-display text-sm font-bold text-ink">
											Upload locations and rules
										</h3>
										<p className="mt-1 text-[12px] leading-5 text-ink-soft">
											Select the documents accepted at each
											location and configure whether each is
											required and whether multiple files are
											allowed.
										</p>
									</div>
								</div>
							</div>

							<div className="p-5">
								<div className="mb-4 rounded-xl bg-sand p-4 ring-1 ring-line">
									<div className="flex items-start gap-2">
										<Check className="mt-0.5 size-3.5 shrink-0 text-orange-deep" />
										<p className="text-[12px] leading-5 text-ink-soft">
											A document can be required at one
											location and optional at another. If no
											documents are selected for a location,
											that location has no configured document
											requirements.
										</p>
									</div>
								</div>

								<div className="space-y-3">
									{config.uploadLocations.map((location) => {
										const isOpen = openLocationId === location.id;
										const selectedCount = Object.keys(
											location.documents
										).length;
										const search = (
											searchByLocation[location.id] ?? ""
										).toLowerCase();

										const filteredTypes =
											config.documentTypes.filter((document) =>
												`${document.label} ${document.key}`
													.toLowerCase()
													.includes(search)
											);

										return (
											<div
												key={location.id}
												className="overflow-hidden rounded-xl bg-paper ring-1 ring-line"
											>
												<button
													type="button"
													onClick={() =>
														setOpenLocationId(
															isOpen ? null : location.id
														)
													}
													className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-sand/60"
												>
													<div className="min-w-0 flex-1">
														<div className="flex flex-wrap items-center gap-2">
															<span className="text-[13px] font-semibold text-ink">
																{location.label}
															</span>
															<span
																className={cn(
																	"rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em]",
																	selectedCount > 0
																		? "bg-orange/10 text-orange-deep ring-1 ring-orange/25"
																		: "bg-sand text-ink-soft ring-1 ring-line"
																)}
															>
																{selectedCount} selected
															</span>
														</div>
														<p className="mt-1 text-[11px] leading-5 text-ink-soft">
															{location.description}
														</p>
													</div>

													<ChevronDown
														className={cn(
															"size-5 shrink-0 text-ink-soft transition-transform",
															isOpen && "rotate-180"
														)}
													/>
												</button>

												{isOpen && (
													<div className="border-t border-line bg-sand/30 p-5">
														{config.documentTypes.length === 0 ? (
															<div className="rounded-lg border border-dashed border-line bg-paper p-6 text-center text-sm text-ink-soft">
																Add document types above
																before configuring this
																location.
															</div>
														) : (
															<>
																<div className="mb-4 flex flex-col gap-3 sm:flex-row">
																	<div className="relative flex-1">
																		<Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
																		<Input
																			className="h-10 border-line bg-paper pl-9 text-sm text-ink"
																			value={
																				searchByLocation[
																					location.id
																				] ?? ""
																			}
																			onChange={(event) =>
																				setSearchByLocation(
																					(current) => ({
																						...current,
																						[location.id]:
																							event.target.value,
																					})
																				)
																			}
																			placeholder="Search document types…"
																		/>
																	</div>

																	<div className="flex gap-2">
																		<Button
																			type="button"
																			size="sm"
																			variant="outline"
																			onClick={() =>
																				selectAllFilteredTypes(
																					location,
																					filteredTypes
																				)
																			}
																			className="border-line bg-paper text-ink hover:bg-sand"
																		>
																			Select shown
																		</Button>
																		<Button
																			type="button"
																			size="sm"
																			variant="outline"
																			onClick={() =>
																				clearFilteredTypes(
																					location,
																					filteredTypes
																				)
																			}
																			className="border-line bg-paper text-ink hover:bg-sand"
																		>
																			Clear shown
																		</Button>
																	</div>
																</div>

																{filteredTypes.length === 0 ? (
																	<div className="rounded-lg border border-dashed border-line bg-paper p-6 text-center text-sm text-ink-soft">
																		No matching document types.
																	</div>
																) : (
																	<ul className="space-y-3">
																		{filteredTypes.map(
																			(document) => {
																				const rule =
																					location.documents[
																						document.key
																					];
																				const selected =
																					Boolean(rule);

																				return (
																					<li
																						key={
																							document.id
																						}
																						className={cn(
																							"rounded-xl p-4 ring-1 transition-colors",
																							selected
																								? "bg-paper ring-orange/30"
																								: "bg-paper ring-line"
																						)}
																					>
																						<div className="flex flex-wrap items-start justify-between gap-4">
																							<label className="flex min-w-[220px] flex-1 cursor-pointer items-start gap-3">
																								<input
																									type="checkbox"
																									className="mt-1 size-4 shrink-0 accent-orange"
																									checked={
																										selected
																									}
																									onChange={() =>
																										toggleDocumentType(
																											location.id,
																											document.key
																										)
																									}
																								/>
																								<span className="min-w-0">
																									<span className="block text-[13px] font-semibold text-ink">
																										{document.label ||
																											document.key}
																									</span>
																									<span className="mt-0.5 block break-all font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
																										{
																											document.key
																										}
																									</span>
																								</span>
																							</label>

																							{rule && (
																								<div className="grid gap-2 sm:grid-cols-2 sm:min-w-[340px]">
																									<RuleToggle
																										label="Required"
																										detail="Must be uploaded"
																										checked={
																											rule.isRequired
																										}
																										onChange={(
																											checked
																										) =>
																											updateDocumentRule(
																												location.id,
																												document.key,
																												{
																													isRequired:
																														checked,
																												}
																											)
																										}
																									/>
																									<RuleToggle
																										label="Allow multiple"
																										detail="Accept multiple files"
																										checked={
																											rule.allowMultiple
																										}
																										onChange={(
																											checked
																										) =>
																											updateDocumentRule(
																												location.id,
																												document.key,
																												{
																													allowMultiple:
																														checked,
																												}
																											)
																										}
																									/>
																								</div>
																							)}
																						</div>
																					</li>
																				);
																			}
																		)}
																	</ul>
																)}

																<div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
																	<span>
																		{selectedCount} document
																		type
																		{selectedCount === 1
																			? ""
																			: "s"}{" "}
																		selected
																	</span>
																	{selectedCount === 0 && (
																		<span className="rounded-full bg-sand px-2.5 py-1 ring-1 ring-line">
																			No documents configured
																		</span>
																	)}
																</div>
															</>
														)}
													</div>
												)}
											</div>
										);
									})}
								</div>
							</div>
						</section>
					</>
				)}

				<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="min-w-0">
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								{dirty ? "Unsaved changes" : "All changes saved"}
							</p>
							<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
								{dirty
									? "Save to apply document type, location and rule changes."
									: "No pending changes."}
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={discardChanges}
								disabled={!dirty || saving}
								className="border-sand/25 bg-transparent text-sand hover:bg-sand/10 disabled:opacity-40"
							>
								<X className="mr-2 size-4" />
								Discard
							</Button>
							<Button
								type="button"
								onClick={saveConfig}
								disabled={!dirty || saving || loading}
								className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
							>
								<Save className="mr-2 size-4" />
								{saving ? "Saving…" : "Save configuration"}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</AppShell>
	);
}

function RuleToggle({
	label,
	detail,
	checked,
	onChange,
}: {
	label: string;
	detail: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			onClick={() => onChange(!checked)}
			className={cn(
				"flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left ring-1 transition-colors",
				checked
					? "bg-orange/10 ring-orange/30"
					: "bg-sand/40 ring-line hover:bg-sand"
			)}
		>
			<span className="min-w-0">
				<span
					className={cn(
						"block text-[12px] font-semibold",
						checked ? "text-orange-deep" : "text-ink"
					)}
				>
					{label}
				</span>
				<span className="block text-[10px] text-ink-soft">{detail}</span>
			</span>
			<span
				className={cn(
					"relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
					checked ? "bg-orange" : "bg-sand-2"
				)}
			>
				<span
					className={cn(
						"size-4 rounded-full bg-white shadow-sm transition-transform",
						checked ? "translate-x-4" : "translate-x-0.5"
					)}
				/>
			</span>
		</button>
	);
}