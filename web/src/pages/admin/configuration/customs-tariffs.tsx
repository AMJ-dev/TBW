import React from "react";
import { useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	Boxes,
	CalendarDays,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	CircleDollarSign,
	Clock3,
	FileText,
	Filter,
	LoaderCircle,
	Pencil,
	Plus,
	RefreshCw,
	Search,
	ShieldCheck,
	SlidersHorizontal,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell, Metric, StatusBadge } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { http, type Resp } from "@/lib/httpClient";

type TariffStatus = "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED";
type RateType = "PERCENTAGE" | "FIXED";

type Tariff = {
	id: string;
	hs_code: string;
	description: string;
	category: string;
	rate_type: RateType;
	rate: number;
	unit: string;
	effective_from: string;
	effective_to: string | null;
	status: TariffStatus;
	source: string | null;
	updated_at: string | null;
	date_of_version: string | null;
	import_duty: number | null;
	vat: number | null;
	levy: number | null;
	exc: number | null;
	wgl: number | null;
	ric: number | null;
	brl: number | null;
	wfl: number | null;
	sug: number | null;
	cem: number | null;
	cig: number | null;
	iro: number | null;
	crl: number | null;
	tpl: number | null;
	nau: number | null;
	nan: number | null;
	gts: number | null;
	t5: number | null;
	t6: number | null;
	t7: number | null;
	t8: number | null;
	t9: number | null;
	t10: number | null;
};

type TariffForm = {
	hs_code: string;
	description: string;
	category: string;
	rate_type: RateType;
	rate: string;
	unit: string;
	effective_from: string;
	effective_to: string;
	status: TariffStatus;
	source: string;
	date_of_version: string;
	import_duty: string;
	vat: string;
	levy: string;
	exc: string;
	wgl: string;
	ric: string;
	brl: string;
	wfl: string;
	sug: string;
	cem: string;
	cig: string;
	iro: string;
	crl: string;
	tpl: string;
	nau: string;
	nan: string;
	gts: string;
	t5: string;
	t6: string;
	t7: string;
	t8: string;
	t9: string;
	t10: string;
};

type ApiResponse<T> = {
	error: boolean;
	data: string;
	code: T | null;
};

const emptyForm: TariffForm = {
	hs_code: "",
	description: "",
	category: "",
	rate_type: "PERCENTAGE",
	rate: "",
	unit: "CIF value",
	effective_from: new Date().toISOString().slice(0, 10),
	effective_to: "",
	status: "ACTIVE",
	source: "",
	date_of_version: "",
	import_duty: "",
	vat: "",
	levy: "",
	exc: "",
	wgl: "",
	ric: "",
	brl: "",
	wfl: "",
	sug: "",
	cem: "",
	cig: "",
	iro: "",
	crl: "",
	tpl: "",
	nau: "",
	nan: "",
	gts: "",
	t5: "",
	t6: "",
	t7: "",
	t8: "",
	t9: "",
	t10: "",
};

const statusTone: Record<
	TariffStatus,
	"success" | "warning" | "danger" | "neutral"
> = {
	ACTIVE: "success",
	INACTIVE: "neutral",
	SCHEDULED: "warning",
	EXPIRED: "danger",
};

const formatDate = (value: string | null | undefined) => {
	if (!value) return "No end date";

	const date = new Date(`${value.slice(0, 10)}T00:00:00`);

	if (Number.isNaN(date.getTime())) return value;

	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
};

const formatRate = (tariff: Tariff) => {
	const rate = Number(tariff.rate);

	if (tariff.rate_type === "PERCENTAGE") {
		return `${new Intl.NumberFormat("en-NG", {
			maximumFractionDigits: 4,
		}).format(rate)}%`;
	}

	return new Intl.NumberFormat("en-NG", {
		maximumFractionDigits: 4,
	}).format(rate);
};

const getEffectiveStatus = (tariff: Tariff): TariffStatus => {
	if (tariff.status === "INACTIVE") return "INACTIVE";

	const today = new Date().toISOString().slice(0, 10);

	if (tariff.effective_from > today) return "SCHEDULED";

	if (tariff.effective_to && tariff.effective_to < today) {
		return "EXPIRED";
	}

	return tariff.status === "SCHEDULED" || tariff.status === "EXPIRED"
		? "ACTIVE"
		: tariff.status;
};

const getErrorMessage = (error: unknown, fallback: string) => {
	const responseError = error as {
		response?: {
			data?: {
				data?: string;
				message?: string;
			};
		};
		message?: string;
	};

	return (
		responseError?.response?.data?.data ||
		responseError?.response?.data?.message ||
		responseError?.message ||
		fallback
	);
};

function FormField({
	label,
	required,
	children,
	description,
}: {
	label: string;
	required?: boolean;
	children: React.ReactNode;
	description?: string;
}) {
	return (
		<label className="block space-y-2">
			<span className="block text-sm font-medium text-ink">
				{label}
				{required && <span className="ml-1 text-carmine">*</span>}
			</span>
			{children}
			{description && (
				<span className="block text-xs leading-5 text-ink-soft">
					{description}
				</span>
			)}
		</label>
	);
}

const inputClass =
	"w-full rounded-xl border border-sand-300 bg-white px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-carmine focus:ring-2 focus:ring-carmine/10";

function AdminCustomsTariffsConfigurationPage() {
	const navigate = useNavigate();
	const [tariffs, setTariffs] = React.useState<Tariff[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [search, setSearch] = React.useState("");
	const [statusFilter, setStatusFilter] = React.useState("ALL");
	const [categoryFilter, setCategoryFilter] = React.useState("ALL");
	const [view, setView] = React.useState<"list" | "form">("list");
	const [editingTariff, setEditingTariff] = React.useState<Tariff | null>(null);
	const [form, setForm] = React.useState<TariffForm>(emptyForm);
	const [page, setPage] = React.useState(1);
	const [notice, setNotice] = React.useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const pageSize = 10;

	const loadTariffs = React.useCallback(async () => {
		setLoading(true);

		try {
			const response = await http.get("admin/config/customs-tariffs/");
			const result = response.data as ApiResponse<{
				tariffs?: Tariff[];
			}>;

			if (result.error) {
				throw new Error(result.data || "Could not load customs tariffs.");
			}

			setTariffs(result.code?.tariffs ?? []);
		} catch (error) {
			setNotice({
				type: "error",
				message: getErrorMessage(error, "Could not load customs tariffs."),
			});
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		void loadTariffs();
	}, [loadTariffs]);

	React.useEffect(() => {
		if (!notice) return;

		const timeout = window.setTimeout(() => setNotice(null), 5000);

		return () => window.clearTimeout(timeout);
	}, [notice]);

	const categories = React.useMemo(
		() =>
			Array.from(
				new Set(
					tariffs
						.map((tariff) => tariff.category)
						.filter((category) => category.trim() !== ""),
				),
			).sort((a, b) => a.localeCompare(b)),
		[tariffs],
	);

	const filteredTariffs = React.useMemo(() => {
		const term = search.trim().toLowerCase();

		return tariffs.filter((tariff) => {
			const matchesSearch =
				!term ||
				tariff.hs_code.toLowerCase().includes(term) ||
				tariff.description.toLowerCase().includes(term) ||
				tariff.category.toLowerCase().includes(term);

			const effectiveStatus = getEffectiveStatus(tariff);

			const matchesStatus =
				statusFilter === "ALL" || effectiveStatus === statusFilter;

			const matchesCategory =
				categoryFilter === "ALL" || tariff.category === categoryFilter;

			return matchesSearch && matchesStatus && matchesCategory;
		});
	}, [tariffs, search, statusFilter, categoryFilter]);

	const totalPages = Math.max(
		1,
		Math.ceil(filteredTariffs.length / pageSize),
	);

	React.useEffect(() => {
		setPage((current) => Math.min(current, totalPages));
	}, [totalPages]);

	const paginatedTariffs = React.useMemo(() => {
		const start = (page - 1) * pageSize;
		return filteredTariffs.slice(start, start + pageSize);
	}, [filteredTariffs, page]);

	const activeCount = tariffs.filter(
		(tariff) => getEffectiveStatus(tariff) === "ACTIVE",
	).length;

	const scheduledCount = tariffs.filter(
		(tariff) => getEffectiveStatus(tariff) === "SCHEDULED",
	).length;

	const expiredCount = tariffs.filter(
		(tariff) => getEffectiveStatus(tariff) === "EXPIRED",
	).length;

	const goBackToConfiguration = () => {
		navigate("/admin/configuration/");
	};

	const openCreatePage = () => {
		setEditingTariff(null);
		setForm({
			...emptyForm,
			effective_from: new Date().toISOString().slice(0, 10),
		});
		setNotice(null);
		setView("form");
	};

	const openEditPage = (tariff: Tariff) => {
		setEditingTariff(tariff);
		setForm({
			hs_code: tariff.hs_code,
			description: tariff.description,
			category: tariff.category,
			rate_type: tariff.rate_type,
			rate: String(tariff.rate),
			unit: tariff.unit,
			effective_from: tariff.effective_from?.slice(0, 10) ?? "",
			effective_to: tariff.effective_to?.slice(0, 10) ?? "",
			status: tariff.status,
			source: tariff.source ?? "",
			date_of_version: tariff.date_of_version?.slice(0, 10) ?? "",
			import_duty: tariff.import_duty == null ? "" : String(tariff.import_duty),
			vat: tariff.vat == null ? "" : String(tariff.vat),
			levy: tariff.levy == null ? "" : String(tariff.levy),
			exc: tariff.exc == null ? "" : String(tariff.exc),
			wgl: tariff.wgl == null ? "" : String(tariff.wgl),
			ric: tariff.ric == null ? "" : String(tariff.ric),
			brl: tariff.brl == null ? "" : String(tariff.brl),
			wfl: tariff.wfl == null ? "" : String(tariff.wfl),
			sug: tariff.sug == null ? "" : String(tariff.sug),
			cem: tariff.cem == null ? "" : String(tariff.cem),
			cig: tariff.cig == null ? "" : String(tariff.cig),
			iro: tariff.iro == null ? "" : String(tariff.iro),
			crl: tariff.crl == null ? "" : String(tariff.crl),
			tpl: tariff.tpl == null ? "" : String(tariff.tpl),
			nau: tariff.nau == null ? "" : String(tariff.nau),
			nan: tariff.nan == null ? "" : String(tariff.nan),
			gts: tariff.gts == null ? "" : String(tariff.gts),
			t5: tariff.t5 == null ? "" : String(tariff.t5),
			t6: tariff.t6 == null ? "" : String(tariff.t6),
			t7: tariff.t7 == null ? "" : String(tariff.t7),
			t8: tariff.t8 == null ? "" : String(tariff.t8),
			t9: tariff.t9 == null ? "" : String(tariff.t9),
			t10: tariff.t10 == null ? "" : String(tariff.t10),
		});
		setNotice(null);
		setView("form");
	};

	const closeFormPage = () => {
		setView("list");
		setEditingTariff(null);
		setNotice(null);
	};

	const updateField = <K extends keyof TariffForm>(
		key: K,
		value: TariffForm[K],
	) => {
		setForm((current) => ({
			...current,
			[key]: value,
		}));
	};

	const saveTariff = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSaving(true);
		setNotice(null);

		const payload = {
			...(editingTariff ? { id: editingTariff.id } : {}),
			hs_code: form.hs_code.trim(),
			description: form.description.trim(),
			category: form.category.trim(),
			rate_type: form.rate_type,
			rate: form.rate,
			unit: form.unit.trim(),
			effective_from: form.effective_from,
			effective_to: form.effective_to,
			status: form.status,
			source: form.source.trim(),
			date_of_version: form.date_of_version,
			import_duty: form.import_duty,
			vat: form.vat,
			levy: form.levy,
			exc: form.exc,
			wgl: form.wgl,
			ric: form.ric,
			brl: form.brl,
			wfl: form.wfl,
			sug: form.sug,
			cem: form.cem,
			cig: form.cig,
			iro: form.iro,
			crl: form.crl,
			tpl: form.tpl,
			nau: form.nau,
			nan: form.nan,
			gts: form.gts,
			t5: form.t5,
			t6: form.t6,
			t7: form.t7,
			t8: form.t8,
			t9: form.t9,
			t10: form.t10,
		};

		try {
			const body = new URLSearchParams();

			Object.entries(payload).forEach(([key, value]) => {
				body.append(key, String(value ?? ""));
			});

			const response = await http.post(
				"admin/config/customs-tariffs/update/",
				body,
			);

			const result = response.data as ApiResponse<{
				tariff?: Tariff;
			}>;

			if (result.error) {
				throw new Error(result.data || "Could not save customs tariff.");
			}

			setNotice({
				type: "success",
				message:
					result.data ||
					(editingTariff
						? "Tariff updated successfully."
						: "Tariff created successfully."),
			});

			await loadTariffs();
			setView("list");
			setEditingTariff(null);
		} catch (error) {
			setNotice({
				type: "error",
				message: getErrorMessage(error, "Could not save customs tariff."),
			});
		} finally {
			setSaving(false);
		}
	};

	return (
		<AppShell
			title="Customs Tariff & Commodity Classification"
			eyebrow="Administration · Configuration"
		>
			<div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-col gap-2">
						<nav
							aria-label="Breadcrumb"
							className="flex flex-wrap items-center gap-1.5 text-xs text-ink-soft"
						>
							<button
								type="button"
								onClick={goBackToConfiguration}
								className="font-medium transition hover:text-carmine"
							>
								Admin
							</button>
							<span aria-hidden="true">/</span>
							<button
								type="button"
								onClick={goBackToConfiguration}
								className="font-medium transition hover:text-carmine"
							>
								Configuration
							</button>
							<span aria-hidden="true">/</span>
							<span className="font-semibold text-ink">Customs Tariffs</span>
						</nav>
					</div>

					<button
						type="button"
						onClick={goBackToConfiguration}
						className="inline-flex items-center gap-2 self-start rounded-lg border border-sand-200 bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-carmine/30 hover:bg-carmine/5 hover:text-carmine sm:self-auto"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						Back to Configuration
					</button>
				</div>

				<AnimatePresence mode="wait" initial={false}>
					{view === "list" ? (
						<motion.div
							key="tariff-list"
							initial={{ x: "-5%", opacity: 0 }}
							animate={{ x: 0, opacity: 1 }}
							exit={{ x: "-8%", opacity: 0 }}
							transition={{ duration: 0.28, ease: "easeInOut" }}
							className="space-y-6"
						>
							<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
								<div>
									<div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-carmine">
										<ShieldCheck className="h-4 w-4" />
										System Configuration
									</div>

									<h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
										Customs Tariffs
									</h1>

									<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
										Manage HS commodity codes, classifications, tariff rates,
										and effective dates.
									</p>
								</div>

								<div className="flex flex-wrap items-center gap-2">
									<Button
										type="button"
										variant="outline"
										onClick={() => void loadTariffs()}
										disabled={loading}
									>
										<RefreshCw
											className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
										/>
										Refresh
									</Button>

									<Button type="button" onClick={openCreatePage}>
										<Plus className="mr-2 h-4 w-4" />
										Add Tariff
									</Button>
								</div>
							</div>

							{notice && (
								<div
									role="status"
									className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
										notice.type === "success"
											? "border-emerald-200 bg-emerald-50 text-emerald-800"
											: "border-red-200 bg-red-50 text-red-800"
									}`}
								>
									<div className="flex items-start gap-2">
										{notice.type === "success" ? (
											<Check className="mt-0.5 h-4 w-4 shrink-0" />
										) : (
											<X className="mt-0.5 h-4 w-4 shrink-0" />
										)}
										<span>{notice.message}</span>
									</div>

									<button
										type="button"
										onClick={() => setNotice(null)}
										className="shrink-0 opacity-70 transition hover:opacity-100"
										aria-label="Dismiss notification"
									>
										<X className="h-4 w-4" />
									</button>
								</div>
							)}

							<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
								<Metric
									label="Total Tariffs"
									value={tariffs.length.toLocaleString()}
									detail="Registered classifications"
									icon={Boxes}
									tone="neutral"
								/>

								<Metric
									label="Active Rates"
									value={activeCount.toLocaleString()}
									detail="Currently effective"
									icon={ShieldCheck}
									tone="success"
								/>

								<Metric
									label="Scheduled"
									value={scheduledCount.toLocaleString()}
									detail="Future effective dates"
									icon={Clock3}
									tone="warning"
								/>

								<Metric
									label="Expired"
									value={expiredCount.toLocaleString()}
									detail="Past effective periods"
									icon={CalendarDays}
									tone="danger"
								/>
							</div>

							<div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
								<div className="border-b border-sand-200 p-4 sm:p-5">
									<div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
										<div>
											<h2 className="text-base font-semibold text-ink">
												Tariff Register
											</h2>
											<p className="mt-1 text-sm text-ink-soft">
												Search and review your configured tariff records.
											</p>
										</div>

										<div className="flex flex-col gap-3 sm:flex-row">
											<div className="relative min-w-0 sm:min-w-[260px]">
												<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />

												<input
													value={search}
													onChange={(event) => {
														setSearch(event.target.value);
														setPage(1);
													}}
													placeholder="Search HS code or description"
													className={`${inputClass} pl-9`}
												/>
											</div>

											<div className="relative">
												<Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />

												<select
													value={statusFilter}
													onChange={(event) => {
														setStatusFilter(event.target.value);
														setPage(1);
													}}
													className={`${inputClass} min-w-[165px] appearance-none pl-9 pr-9`}
												>
													<option value="ALL">All statuses</option>
													<option value="ACTIVE">Active</option>
													<option value="SCHEDULED">Scheduled</option>
													<option value="EXPIRED">Expired</option>
													<option value="INACTIVE">Inactive</option>
												</select>

												<ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
											</div>

											<div className="relative">
												<SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />

												<select
													value={categoryFilter}
													onChange={(event) => {
														setCategoryFilter(event.target.value);
														setPage(1);
													}}
													className={`${inputClass} min-w-[165px] appearance-none pl-9 pr-9`}
												>
													<option value="ALL">All categories</option>
													{categories.map((category) => (
														<option key={category} value={category}>
															{category}
														</option>
													))}
												</select>

												<ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
											</div>
										</div>
									</div>
								</div>

								{loading ? (
									<div className="flex min-h-[300px] flex-col items-center justify-center gap-3 px-6 text-center">
										<LoaderCircle className="h-8 w-8 animate-spin text-carmine" />
										<p className="text-sm text-ink-soft">
											Loading customs tariffs...
										</p>
									</div>
								) : filteredTariffs.length === 0 ? (
									<div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
										<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sand-100 text-ink-soft">
											<FileText className="h-7 w-7" />
										</div>

										<h3 className="text-base font-semibold text-ink">
											{tariffs.length === 0
												? "No tariffs configured"
												: "No matching tariffs"}
										</h3>

										<p className="mt-2 max-w-md text-sm leading-6 text-ink-soft">
											{tariffs.length === 0
												? "Add your first customs tariff to begin managing commodity classifications and rates."
												: "Try changing your search terms or filters."}
										</p>

										{tariffs.length === 0 && (
											<Button
												type="button"
												className="mt-5"
												onClick={openCreatePage}
											>
												<Plus className="mr-2 h-4 w-4" />
												Add Tariff
											</Button>
										)}
									</div>
								) : (
									<>
										<div className="overflow-x-auto">
											<table className="w-full min-w-[1050px] border-collapse text-left">
												<thead>
													<tr className="border-b border-sand-200 bg-sand-50/70">
														<th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
															HS Code
														</th>
														<th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
															Commodity
														</th>
														<th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
															Category
														</th>
														<th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
															Tariff Rate
														</th>
														<th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
															Effective Period
														</th>
														<th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
															Status
														</th>
														<th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-soft">
															Action
														</th>
													</tr>
												</thead>

												<tbody className="divide-y divide-sand-100">
													{paginatedTariffs.map((tariff) => {
														const effectiveStatus = getEffectiveStatus(tariff);

														return (
															<tr
																key={tariff.id}
																className="transition-colors hover:bg-sand-50/70"
															>
																<td className="px-5 py-4 align-top">
																	<span className="font-mono text-sm font-semibold text-ink">
																		{tariff.hs_code}
																	</span>
																</td>

																<td className="max-w-[340px] px-5 py-4 align-top">
																	<p className="line-clamp-2 text-sm font-medium leading-5 text-ink">
																		{tariff.description}
																	</p>
																	<p className="mt-1 text-xs text-ink-soft">
																		Unit: {tariff.unit}
																	</p>
																</td>

																<td className="px-5 py-4 align-top">
																	<span className="inline-flex rounded-lg bg-sand-100 px-2.5 py-1.5 text-xs font-medium text-ink">
																		{tariff.category}
																	</span>
																</td>

																<td className="px-5 py-4 align-top">
																	<p className="text-sm font-semibold text-ink">
																		{formatRate(tariff)}
																	</p>
																	<p className="mt-1 text-xs text-ink-soft">
																		{tariff.rate_type === "PERCENTAGE"
																			? "Percentage rate"
																			: "Fixed rate"}
																	</p>
																</td>

																<td className="px-5 py-4 align-top">
																	<p className="text-sm text-ink">
																		{formatDate(tariff.effective_from)}
																	</p>
																	<p className="mt-1 text-xs text-ink-soft">
																		Until {formatDate(tariff.effective_to)}
																	</p>
																</td>

																<td className="px-5 py-4 align-top">
																	<StatusBadge
																		label={effectiveStatus}
																		tone={statusTone[effectiveStatus]}
																	/>
																</td>

																<td className="px-5 py-4 text-right align-top">
																	<button
																		type="button"
																		onClick={() => openEditPage(tariff)}
																		className="inline-flex items-center gap-2 rounded-lg border border-sand-200 px-3 py-2 text-xs font-semibold text-ink transition hover:border-carmine/30 hover:bg-carmine/5 hover:text-carmine"
																	>
																		<Pencil className="h-3.5 w-3.5" />
																		Edit
																	</button>
																</td>
															</tr>
														);
													})}
												</tbody>
											</table>
										</div>

										<div className="flex flex-col justify-between gap-3 border-t border-sand-200 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
											<p className="text-sm text-ink-soft">
												Showing{" "}
												<span className="font-semibold text-ink">
													{(page - 1) * pageSize + 1}
												</span>
												{"–"}
												<span className="font-semibold text-ink">
													{Math.min(page * pageSize, filteredTariffs.length)}
												</span>{" "}
												of{" "}
												<span className="font-semibold text-ink">
													{filteredTariffs.length}
												</span>{" "}
												tariffs
											</p>

											<div className="flex items-center gap-2">
												<button
													type="button"
													disabled={page <= 1}
													onClick={() => setPage((current) => current - 1)}
													className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sand-200 text-ink transition hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-40"
													aria-label="Previous page"
												>
													<ChevronLeft className="h-4 w-4" />
												</button>

												<span className="min-w-20 text-center text-sm text-ink-soft">
													Page {page} of {totalPages}
												</span>

												<button
													type="button"
													disabled={page >= totalPages}
													onClick={() => setPage((current) => current + 1)}
													className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sand-200 text-ink transition hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-40"
													aria-label="Next page"
												>
													<ChevronRight className="h-4 w-4" />
												</button>
											</div>
										</div>
									</>
								)}
							</div>

							<div className="flex items-start gap-3 rounded-xl border border-sand-200 bg-sand-50/70 p-4">
								<ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" />
								<div>
									<p className="text-sm font-semibold text-ink">
										Tariff data governance
									</p>
									<p className="mt-1 text-xs leading-5 text-ink-soft">
										Maintain accurate classifications, rates, and effective
										periods. Confirm official tariff applicability before
										using a rate to calculate customs duty.
									</p>
								</div>
							</div>
						</motion.div>
					) : (
						<motion.div
							key="tariff-form"
							initial={{ x: "8%", opacity: 0 }}
							animate={{ x: 0, opacity: 1 }}
							exit={{ x: "5%", opacity: 0 }}
							transition={{ duration: 0.28, ease: "easeInOut" }}
							className="space-y-6"
						>
							<div>
								<button
									type="button"
									onClick={closeFormPage}
									className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition hover:text-carmine"
								>
									<ArrowLeft className="h-4 w-4" />
									Back to Tariffs
								</button>

								<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
									<div>
										<div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-carmine">
											<Boxes className="h-4 w-4" />
											Customs Configuration
										</div>

										<h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
											{editingTariff ? "Edit Tariff" : "Add Tariff"}
										</h1>

										<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
											{editingTariff
												? "Update the commodity classification, rate, and effective period."
												: "Create a commodity classification and configure its applicable tariff rate."}
										</p>
									</div>

									{editingTariff && (
										<StatusBadge
											label={getEffectiveStatus(editingTariff)}
											tone={statusTone[getEffectiveStatus(editingTariff)]}
										/>
									)}
								</div>
							</div>

							<form onSubmit={saveTariff} className="space-y-6">
								<div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
									<div className="border-b border-sand-200 px-5 py-4 sm:px-6">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-carmine/10 text-carmine">
												<FileText className="h-5 w-5" />
											</div>

											<div>
												<h2 className="font-semibold text-ink">
													Commodity Classification
												</h2>
												<p className="mt-1 text-xs text-ink-soft">
													Identify the commodity and its classification.
												</p>
											</div>
										</div>
									</div>

									<div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
										<FormField
											label="HS Code"
											required
											description="Enter the official Harmonized System commodity code."
										>
											<input
												required
												maxLength={20}
												value={form.hs_code}
												onChange={(event) =>
													updateField("hs_code", event.target.value)
												}
												placeholder="e.g. 0101.21.00"
												className={inputClass}
											/>
										</FormField>

										<FormField label="Category" required>
											<input
												required
												maxLength={150}
												list="customs-tariff-categories"
												value={form.category}
												onChange={(event) =>
													updateField("category", event.target.value)
												}
												placeholder="e.g. Live animals"
												className={inputClass}
											/>

											<datalist id="customs-tariff-categories">
												{categories.map((category) => (
													<option key={category} value={category} />
												))}
											</datalist>
										</FormField>

										<div className="sm:col-span-2">
											<FormField label="Commodity Description" required>
												<textarea
													required
													rows={4}
													value={form.description}
													onChange={(event) =>
														updateField("description", event.target.value)
													}
													placeholder="Enter the official commodity description"
													className={`${inputClass} resize-y`}
												/>
											</FormField>
										</div>
									</div>
								</div>

								<div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
									<div className="border-b border-sand-200 px-5 py-4 sm:px-6">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
												<CircleDollarSign className="h-5 w-5" />
											</div>

											<div>
												<h2 className="font-semibold text-ink">Tariff Rate</h2>
												<p className="mt-1 text-xs text-ink-soft">
													Configure the rate and its applicable unit.
												</p>
											</div>
										</div>
									</div>

									<div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
										<FormField label="Rate Type" required>
											<select
												required
												value={form.rate_type}
												onChange={(event) =>
													updateField(
														"rate_type",
														event.target.value as RateType,
													)
												}
												className={inputClass}
											>
												<option value="PERCENTAGE">Percentage (%)</option>
												<option value="FIXED">Fixed amount</option>
											</select>
										</FormField>

										<FormField
											label="Tariff Rate"
											required
											description={
												form.rate_type === "PERCENTAGE"
													? "Enter the percentage rate without the % symbol."
													: "Enter the fixed amount as a non-negative number."
											}
										>
											<input
												required
												type="number"
												min="0"
												step="any"
												value={form.rate}
												onChange={(event) =>
													updateField("rate", event.target.value)
												}
												placeholder="0.00"
												className={inputClass}
											/>
										</FormField>

										<FormField label="Rate Unit" required>
											<input
												required
												maxLength={100}
												value={form.unit}
												onChange={(event) =>
													updateField("unit", event.target.value)
												}
												placeholder="e.g. CIF value, per kg"
												className={inputClass}
											/>
										</FormField>

										<FormField label="Record Status" required>
											<select
												required
												value={form.status}
												onChange={(event) =>
													updateField(
														"status",
														event.target.value as TariffStatus,
													)
												}
												className={inputClass}
											>
												<option value="ACTIVE">Active</option>
												<option value="INACTIVE">Inactive</option>
												<option value="SCHEDULED">Scheduled</option>
												<option value="EXPIRED">Expired</option>
											</select>
										</FormField>
									</div>
								</div>

								<div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
									<div className="border-b border-sand-200 px-5 py-4 sm:px-6">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
												<CalendarDays className="h-5 w-5" />
											</div>

											<div>
												<h2 className="font-semibold text-ink">
													Effective Period
												</h2>
												<p className="mt-1 text-xs text-ink-soft">
													Define when this tariff record applies.
												</p>
											</div>
										</div>
									</div>

									<div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
										<FormField label="Effective From" required>
											<input
												required
												type="date"
												value={form.effective_from}
												onChange={(event) =>
													updateField("effective_from", event.target.value)
												}
												className={inputClass}
											/>
										</FormField>

										<FormField
											label="Effective To"
											description="Leave blank if no end date has been specified."
										>
											<input
												type="date"
												min={form.effective_from || undefined}
												value={form.effective_to}
												onChange={(event) =>
													updateField("effective_to", event.target.value)
												}
												className={inputClass}
											/>
										</FormField>

										<div className="sm:col-span-2">
											<FormField
												label="Source or Reference"
												description="Record the official tariff schedule, publication, or reference used."
											>
												<input
													maxLength={255}
													value={form.source}
													onChange={(event) =>
														updateField("source", event.target.value)
													}
													placeholder="e.g. Official customs tariff schedule"
													className={inputClass}
												/>
											</FormField>
										</div>
									</div>
								</div>


								<div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
									<div className="border-b border-sand-200 px-5 py-4 sm:px-6">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
												<SlidersHorizontal className="h-5 w-5" />
											</div>
											<div>
												<h2 className="font-semibold text-ink">National Tariff Components</h2>
												<p className="mt-1 text-xs text-ink-soft">Optional duty, tax, levy and national-list values.</p>
											</div>
										</div>
									</div>
									<div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
										<FormField label="Date of Version">
											<input type="date" value={form.date_of_version} onChange={(event) => updateField("date_of_version", event.target.value)} className={inputClass} />
										</FormField>
										<FormField label="IMPORT DUTY" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.import_duty} onChange={(event) => updateField("import_duty", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="VAT" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.vat} onChange={(event) => updateField("vat", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="LEVY" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.levy} onChange={(event) => updateField("levy", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="EXC" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.exc} onChange={(event) => updateField("exc", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="WGL" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.wgl} onChange={(event) => updateField("wgl", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="RIC" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.ric} onChange={(event) => updateField("ric", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="BRL" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.brl} onChange={(event) => updateField("brl", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="WFL" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.wfl} onChange={(event) => updateField("wfl", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="SUG" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.sug} onChange={(event) => updateField("sug", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="CEM" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.cem} onChange={(event) => updateField("cem", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="CIG" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.cig} onChange={(event) => updateField("cig", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="IRO" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.iro} onChange={(event) => updateField("iro", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="CRL" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.crl} onChange={(event) => updateField("crl", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="TPL" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.tpl} onChange={(event) => updateField("tpl", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="NAU" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.nau} onChange={(event) => updateField("nau", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="NAN" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.nan} onChange={(event) => updateField("nan", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="GTS" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.gts} onChange={(event) => updateField("gts", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="T5" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.t5} onChange={(event) => updateField("t5", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="T6" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.t6} onChange={(event) => updateField("t6", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="T7" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.t7} onChange={(event) => updateField("t7", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="T8" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.t8} onChange={(event) => updateField("t8", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="T9" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.t9} onChange={(event) => updateField("t9", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
										<FormField label="T10" description="Optional numeric tariff component.">
											<input type="number" min="0" step="any" value={form.t10} onChange={(event) => updateField("t10", event.target.value)} className={inputClass} placeholder="—" />
										</FormField>
									</div>
								</div>

								{notice && (
									<div
										role="alert"
										className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
											notice.type === "success"
												? "border-emerald-200 bg-emerald-50 text-emerald-800"
												: "border-red-200 bg-red-50 text-red-800"
										}`}
									>
										{notice.type === "success" ? (
											<Check className="mt-0.5 h-4 w-4 shrink-0" />
										) : (
											<X className="mt-0.5 h-4 w-4 shrink-0" />
										)}
										<span>{notice.message}</span>
									</div>
								)}

								<div className="flex flex-col-reverse justify-between gap-3 border-t border-sand-200 pt-5 sm:flex-row sm:items-center">
									<p className="max-w-lg text-xs leading-5 text-ink-soft">
										Verify tariff classifications, rate units, and effective
										dates against the applicable official schedule.
									</p>

									<div className="flex flex-col gap-2 sm:flex-row">
										<Button
											type="button"
											variant="outline"
											onClick={closeFormPage}
											disabled={saving}
										>
											Cancel
										</Button>

										<Button type="submit" disabled={saving}>
											{saving ? (
												<>
													<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
													Saving...
												</>
											) : (
												<>
													<Check className="mr-2 h-4 w-4" />
													{editingTariff ? "Save Changes" : "Create Tariff"}
												</>
											)}
										</Button>
									</div>
								</div>
							</form>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</AppShell>
	);
}

export default AdminCustomsTariffsConfigurationPage;