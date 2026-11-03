import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Container,
  ExternalLink,
  FileImage,
  FileText,
  LoaderCircle,
  MapPin,
  Package,
  RefreshCw,
  Scale,
  ShieldCheck,
  Truck,
  Warehouse,
  XCircle,
} from "lucide-react";
import {
  AppShell,
  Metric,
  StatusBadge,
  statusTone,
} from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { http, type Resp } from "@/lib/httpClient";

type DataRecord = Record<string, unknown>;

interface PhotoItem {
  url: string;
  name: string;
  description: string;
}

const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft";

const cardClass =
  "overflow-hidden rounded-xl bg-paper ring-1 ring-line";

const sectionTitleClass =
  "font-display text-base font-bold text-ink";

function isRecord(value: unknown): value is DataRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getValue(
  record: DataRecord,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return null;
}

function getText(
  record: DataRecord,
  ...keys: string[]
): string {
  const value = getValue(record, ...keys);

  if (value === null) return "";

  if (
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const object = value as DataRecord;

    return String(
      getValue(object, "name", "label", "value", "reference") ?? "",
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      if (isRecord(item)) {
        return String(
          getValue(item, "name", "label", "value", "reference") ?? "",
        );
      }

      return String(item ?? "");
    }).filter(Boolean).join(", ");
  }

  return String(value);
}

function getNumber(
  record: DataRecord,
  ...keys: string[]
): number | null {
  const value = getValue(record, ...keys);

  if (value === null) return null;

  const number = Number(String(value).replace(/,/g, ""));

  return Number.isFinite(number) ? number : null;
}

function formatDate(value: unknown): string {
  if (!value) return "—";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatWeight(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(String(value).replace(/,/g, ""));

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return `${new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 2,
  }).format(number)} kg`;
}

function formatLabel(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeStatus(value: unknown): string {
  return String(value ?? "UNKNOWN").trim().toUpperCase();
}

function getStatusTone(status: string): string {
  if (
    [
      "RECEIVED",
      "COMPLETED",
      "ACCEPTED",
      "VERIFIED",
      "PASSED",
      "GOOD",
      "NO_DAMAGE",
    ].includes(status)
  ) {
    return "success";
  }

  if (
    [
      "DAMAGED",
      "DISCREPANCY",
      "REJECTED",
      "FAILED",
      "MISSING",
      "BROKEN",
      "CRITICAL",
    ].includes(status)
  ) {
    return "critical";
  }

  if (
    [
      "PENDING",
      "PARTIAL",
      "EXPECTED",
      "INSPECTING",
      "UNDER_INSPECTION",
      "IN_PROGRESS",
    ].includes(status)
  ) {
    return "warning";
  }

  return statusTone(status);
}

function displayStatus(status: string): string {
  return formatLabel(status.toLowerCase().replace(/_/g, " "));
}

function extractDetails(response: unknown): DataRecord | null {
  if (!isRecord(response)) return null;

  let current: unknown = response;

  for (let depth = 0; depth < 5; depth += 1) {
    if (!isRecord(current)) return null;

    const object = current as DataRecord;

    if (object["error"] === true) {
      return null;
    }

    const nestedKeys = [
      "data",
      "receiving",
      "record",
      "details",
      "result",
      "item",
    ];

    let nested: unknown = null;

    for (const key of nestedKeys) {
      const value = object[key];

      if (isRecord(value)) {
        nested = value;
        break;
      }
    }

    if (!nested) {
      return object;
    }

    current = nested;
  }

  return isRecord(current) ? current : null;
}

function extractArray(
  record: DataRecord,
  ...keys: string[]
): DataRecord[] {
  for (const key of keys) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }

  return [];
}

function resolvePhotoUrl(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (!isRecord(value)) return "";

  return getText(
    value,
    "url",
    "image_url",
    "photo_url",
    "file_url",
    "path",
    "file_path",
    "src",
    "location",
    "document_url",
  );
}

function extractPhotos(
  record: DataRecord,
  prefix = "",
): PhotoItem[] {
  const photos: PhotoItem[] = [];

  const photoKeys = [
    "damage_photos",
    "damaged_goods_photos",
    "damaged_goods_pictures",
    "damage_images",
    "damaged_images",
    "condition_photos",
    "inspection_photos",
    "receiving_photos",
    "photos",
    "images",
    "pictures",
    "attachments",
    "evidence",
    "files",
  ];

  const addPhoto = (
    item: unknown,
    index: number,
    defaultName: string,
  ) => {
    const url = resolvePhotoUrl(item);

    if (!url) return;

    const photoRecord = isRecord(item) ? item : {};

    const existing = photos.some((photo) => photo.url === url);

    if (existing) return;

    photos.push({
      url,
      name:
        getText(
          photoRecord,
          "name",
          "file_name",
          "filename",
          "title",
        ) || `${defaultName} ${index + 1}`,
      description: getText(
        photoRecord,
        "description",
        "caption",
        "remarks",
        "notes",
      ),
    });
  };

  for (const key of photoKeys) {
    const value = record[key];

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        addPhoto(item, index, formatLabel(key));
      });
    } else if (typeof value === "string" && value.trim()) {
      const entries = value.trim().startsWith("[")
        ? (() => {
            try {
              const parsed: unknown = JSON.parse(value);
              return Array.isArray(parsed) ? parsed : [value];
            } catch {
              return [value];
            }
          })()
        : [value];

      entries.forEach((item, index) => {
        addPhoto(item, index, formatLabel(key));
      });
    } else if (isRecord(value)) {
      addPhoto(value, 0, formatLabel(key));
    }
  }

  const damage = getValue(
    record,
    "damage",
    "damaged_goods",
    "damage_details",
    "damage_evidence",
  );

  if (Array.isArray(damage)) {
    damage.forEach((item, index) => {
      if (isRecord(item)) {
        extractPhotos(item, prefix).forEach((photo) => {
          if (!photos.some((existing) => existing.url === photo.url)) {
            photos.push(photo);
          }
        });
      } else {
        addPhoto(item, index, "Damage evidence");
      }
    });
  } else if (isRecord(damage)) {
    extractPhotos(damage, prefix).forEach((photo) => {
      if (!photos.some((existing) => existing.url === photo.url)) {
        photos.push(photo);
      }
    });
  }

  return photos;
}

function isImageFile(url: string): boolean {
  return (
    /^data:image\//i.test(url) ||
    /\.(jpe?g|png|gif|webp|bmp|avif)(?:[?#].*)?$/i.test(url)
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: unknown;
  mono?: boolean;
}) {
  const text =
    value === null || value === undefined || value === ""
      ? "—"
      : String(value);

  return (
    <div className="min-w-0">
      <p className={labelClass}>{label}</p>
      <p
        className={`mt-1.5 break-words text-sm text-ink ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function InfoSection({
  title,
  icon: Icon,
  children,
  description,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <section className={cardClass}>
      <div className="flex items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sand">
          <Icon className="size-4 text-ink" />
        </div>

        <div className="min-w-0">
          <h2 className={sectionTitleClass}>{title}</h2>
          {description && (
            <p className="mt-1 text-xs leading-5 text-ink-soft">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function PhotoGallery({
  title,
  photos,
}: {
  title: string;
  photos: PhotoItem[];
}) {
  const [failedPhotos, setFailedPhotos] = useState<string[]>([]);

  if (!photos.length) return null;

  return (
    <section className={cardClass}>
      <div className="flex items-center gap-3 border-b border-line px-4 py-4 sm:px-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sand">
          <FileImage className="size-4 text-ink" />
        </div>

        <div>
          <h2 className={sectionTitleClass}>{title}</h2>
          <p className="mt-1 text-xs text-ink-soft">
            {photos.length} attachment{photos.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
        {photos.map((photo, index) => {
          const image = isImageFile(photo.url);
          const failed = failedPhotos.includes(photo.url);

          return (
            <article
              key={`${photo.url}-${index}`}
              className="overflow-hidden rounded-lg border border-line bg-paper"
            >
              {image && !failed ? (
                <a
                  href={photo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block aspect-[4/3] overflow-hidden bg-sand"
                  aria-label={`Open ${photo.name}`}
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={() =>
                      setFailedPhotos((current) =>
                        current.includes(photo.url)
                          ? current
                          : [...current, photo.url],
                      )
                    }
                  />
                </a>
              ) : (
                <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-sand p-4 text-center">
                  <FileText className="size-10 text-ink-soft" />
                  <p className="break-all text-xs text-ink-soft">
                    {failed
                      ? "Image could not be loaded"
                      : "Attachment"}
                  </p>
                  <a
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-ink underline"
                  >
                    Open attachment
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}

              <div className="space-y-2 p-3">
                <p className="break-words text-sm font-semibold text-ink">
                  {photo.name}
                </p>

                {photo.description && (
                  <p className="break-words text-xs leading-5 text-ink-soft">
                    {photo.description}
                  </p>
                )}

                <a
                  href={photo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
                >
                  Open original
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DetailList({
  title,
  record,
  exclude = [],
}: {
  title: string;
  record: DataRecord;
  exclude?: string[];
}) {
  const excluded = new Set([
    ...exclude,
    "id",
    "created_at",
    "updated_at",
    "deleted_at",
    "containers",
    "photos",
    "images",
    "attachments",
    "damage_photos",
    "damaged_goods_photos",
    "damaged_goods_pictures",
    "damage_images",
    "condition_photos",
    "inspection_photos",
    "receiving_photos",
  ]);

  const fields = Object.entries(record).filter(([key, value]) => {
    if (excluded.has(key.toLowerCase())) return false;
    if (value === null || value === undefined || value === "") return false;
    if (typeof value === "object") return false;

    return true;
  });

  if (!fields.length) return null;

  return (
    <section className={cardClass}>
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <h2 className={sectionTitleClass}>{title}</h2>
      </div>

      <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
        {fields.map(([key, value]) => (
          <Field
            key={key}
            label={formatLabel(key)}
            value={String(value)}
            mono={
              key.toLowerCase().includes("reference") ||
              key.toLowerCase().endsWith("_id") ||
              key.toLowerCase().includes("number")
            }
          />
        ))}
      </div>
    </section>
  );
}

export default function OperationsReceivingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<DataRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDetails = useCallback(
    async (refresh = false) => {
      if (!id) {
        setError("The receiving record ID is missing from the URL.");
        setLoading(false);
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await http.get(
          `/operator/receiving/details/${encodeURIComponent(id)}/`,
        );

        const resp: Resp = response.data;

        if (resp.error) {
          throw new Error(
            String(resp.data || "Could not load receiving details."),
          );
        }

        const details = extractDetails(resp);

        if (!details) {
          throw new Error("The receiving record was not found.");
        }

        setRecord(details);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load receiving details.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  const containers = useMemo(() => {
    if (!record) return [];

    return extractArray(
      record,
      "containers",
      "receiving_containers",
      "container_details",
      "items",
    );
  }, [record]);

  const expectedWeightTotal = containers.reduce((total, container) => {
    const value = getNumber(container, "expected_weight", "gross_weight");
    return total + (value ?? 0);
  }, 0);

  const actualWeightTotal = containers.reduce((total, container) => {
    const value = getNumber(container, "actual_weight", "verified_weight");
    return total + (value ?? 0);
  }, 0);

  const hasExpectedWeight = containers.some(
    (container) => getNumber(container, "expected_weight", "gross_weight") !== null,
  );

  const hasActualWeight = containers.some(
    (container) => getNumber(container, "actual_weight", "verified_weight") !== null,
  );

  const packageCountTotal = containers.reduce((total, container) => {
    const value = getNumber(container, "package_count", "expected_package_count");
    return total + (value ?? 0);
  }, 0);

  const hasPackageCount = containers.some(
    (container) => getNumber(container, "package_count", "expected_package_count") !== null,
  );

  const containerNumbers = containers
    .map((container) => getText(container, "container_no", "container_number"))
    .filter(Boolean)
    .join(", ");

  const expectedSeals = containers
    .map((container) => getText(container, "expected_seal_no", "expected_seal", "seal_no"))
    .filter(Boolean)
    .join(", ");

  const observedSeals = containers
    .map((container) => getText(container, "actual_seal_no", "observed_seal_number", "observed_seal"))
    .filter(Boolean)
    .join(", ");

  const cargoTypes = [...new Set(containers
    .map((container) => getText(container, "cargo_type", "container_package_type", "container_cargo_description"))
    .filter(Boolean))].join(", ");

  const cargoConditions = [...new Set(containers
    .map((container) => getText(container, "condition_status", "cargo_condition"))
    .filter(Boolean))].join(", ");

  const discrepancyStatuses = [...new Set(containers
    .map((container) => getText(container, "discrepancy_status", "receiving_status", "condition_status"))
    .filter(Boolean))].join(", ");

  const topLevelPhotos = useMemo(
    () => (record ? extractPhotos(record) : []),
    [record],
  );

  const containerPhotos = useMemo(() => {
    return containers.map((container) => ({
      container,
      photos: extractPhotos(container),
    }));
  }, [containers]);

  const allPhotos = useMemo(() => {
    const photos = [...topLevelPhotos];

    for (const entry of containerPhotos) {
      for (const photo of entry.photos) {
        if (!photos.some((existing) => existing.url === photo.url)) {
          photos.push(photo);
        }
      }
    }

    return photos;
  }, [topLevelPhotos, containerPhotos]);

  const status = normalizeStatus(
    record ? getValue(record, "status", "receiving_status") : "UNKNOWN",
  );

  const discrepancyNotes = record
    ? getText(
        record,
        "discrepancy_notes",
        "discrepancy_reason",
        "remarks",
        "notes",
      )
    : "";

  const damageStatus = record
    ? normalizeStatus(
        getValue(
          record,
          "cargo_condition",
          "condition_status",
          "damage_status",
        ),
      )
    : "";

  const totalContainers =
    getNumber(record ?? {}, "total_containers", "container_count") ??
    containers.length;

  const receivedContainers =
    getNumber(record ?? {}, "received_containers", "containers_received") ??
    containers.filter((container) =>
      ["RECEIVED", "COMPLETED"].includes(
        normalizeStatus(
          getValue(container, "receiving_status", "status"),
        ),
      ),
    ).length;

  const discrepancyContainers =
    getNumber(
      record ?? {},
      "discrepancy_containers",
      "damaged_containers",
      "containers_with_discrepancies",
    ) ??
    containers.filter((container) => {
      const condition = normalizeStatus(
        getValue(
          container,
          "condition_status",
          "cargo_condition",
          "damage_status",
        ),
      );

      const notes = getText(
        container,
        "discrepancy_notes",
        "damage_description",
        "remarks",
      );

      return (
        ["DAMAGED", "DISCREPANCY", "BROKEN", "FAILED"].includes(condition) ||
        Boolean(notes)
      );
    }).length;

  if (loading) {
    return (
      <AppShell title="Receiving Details" eyebrow="Operations · Cargo Receiving">
        <div className="flex min-h-80 flex-col items-center justify-center rounded-xl bg-paper p-8 text-center ring-1 ring-line">
          <LoaderCircle className="size-8 animate-spin text-ink-soft" />
          <p className="mt-4 text-sm font-semibold text-ink">
            Loading receiving details
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Retrieving shipment, container and inspection information.
          </p>
        </div>
      </AppShell>
    );
  }

  if (error || !record) {
    return (
      <AppShell title="Receiving Details" eyebrow="Operations · Cargo Receiving">
        <div className="space-y-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/operations/receiving")}
            className="border-line bg-paper text-ink hover:bg-sand"
          >
            <ArrowLeft className="size-4" />
            Back to receiving
          </Button>

          <section className={`${cardClass} p-6 sm:p-8`}>
            <div className="flex size-12 items-center justify-center rounded-xl bg-coral/10">
              <AlertTriangle className="size-6 text-coral" />
            </div>

            <h1 className="mt-4 font-display text-xl font-bold text-ink">
              Could not load receiving details
            </h1>

            <p className="mt-2 max-w-xl break-words text-sm leading-6 text-ink-soft">
              {error || "The requested receiving record could not be found."}
            </p>

            <Button
              type="button"
              onClick={() => void loadDetails()}
              className="mt-5 bg-ink text-sand hover:bg-ink/90"
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </section>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Receiving Details"
      eyebrow="Operations · Inbound Terminal"
    >
      <div className="space-y-6 pb-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigate("/operations/receiving")}
              className="mt-1 shrink-0 border-line bg-paper text-ink hover:bg-sand"
              aria-label="Back to receiving register"
            >
              <ArrowLeft className="size-4" />
            </Button>

            <div className="min-w-0">
              <p className={labelClass}>Receiving record</p>

              <h1 className="mt-2 break-words font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {getText(
                  record,
                  "receiving_reference",
                  "reference",
                  "reference_number",
                ) || "Receiving details"}
              </h1>

              <p className="mt-2 break-all font-mono text-xs text-ink-soft">
                Record ID: {getText(record, "id", "receiving_id") || id}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={displayStatus(status)}
                  tone={getStatusTone(status)}
                />

                {damageStatus && damageStatus !== "UNKNOWN" && (
                  <StatusBadge
                    label={displayStatus(damageStatus)}
                    tone={getStatusTone(damageStatus)}
                  />
                )}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void loadDetails(true)}
            disabled={refreshing}
            className="border-line bg-paper text-ink hover:bg-sand"
          >
            {refreshing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Receiving status"
            value={displayStatus(status)}
            detail="Current receiving record status"
            icon={ClipboardCheck}
            tone={getStatusTone(status)}
          />

          <Metric
            label="Total containers"
            value={String(totalContainers)}
            detail="Containers associated with this record"
            icon={Container}
          />

          <Metric
            label="Received containers"
            value={String(receivedContainers)}
            detail="Containers marked received or completed"
            icon={CheckCircle2}
            tone="success"
          />

          <Metric
            label="Discrepancies"
            value={String(discrepancyContainers)}
            detail={`${allPhotos.length} attachment${allPhotos.length === 1 ? "" : "s"} available`}
            icon={AlertTriangle}
            tone={discrepancyContainers > 0 ? "critical" : "neutral"}
          />
        </div>

        {discrepancyNotes && (
          <section className="rounded-xl border border-coral/30 bg-coral/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-coral/10">
                <AlertTriangle className="size-5 text-coral" />
              </div>

              <div className="min-w-0">
                <h2 className="text-sm font-bold text-ink">
                  Receiving remarks and discrepancies
                </h2>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-soft">
                  {discrepancyNotes}
                </p>
              </div>
            </div>
          </section>
        )}

        <InfoSection
          title="Receiving information"
          icon={ClipboardCheck}
          description="Reference, status, receiving location and timestamps."
        >
          <Field
            label="Receiving reference"
            value={getText(record, "receiving_reference", "reference")}
            mono
          />
          <Field
            label="Receiving ID"
            value={getText(record, "id", "receiving_id") || id}
            mono
          />
          <Field
            label="Status"
            value={displayStatus(status)}
          />
          <Field
            label="Receiving location"
            value={getText(
              record,
              "receiving_location",
              "receiving_bay",
              "received_bay",
              "yard_location",
            )}
          />
          <Field
            label="Received by"
            value={getText(
              record,
              "received_by_name",
              "receiver_name",
              "operator_name",
              "received_by",
            )}
          />
          <Field
            label="Received at"
            value={formatDate(
              getValue(record, "received_at", "received_on"),
            )}
          />
          <Field
            label="Created at"
            value={formatDate(getValue(record, "created_at"))}
          />
          <Field
            label="Last updated"
            value={formatDate(
              getValue(record, "updated_at", "modified_at"),
            )}
          />
          <Field
            label="Receiving remarks"
            value={getText(record, "remarks", "notes")}
          />
        </InfoSection>

        <InfoSection
          title="Shipment information"
          icon={Package}
          description="The shipment declaration associated with this receiving record."
        >
          <Field
            label="Shipment reference"
            value={getText(
              record,
              "shipment_reference",
              "shipment_ref",
            )}
            mono
          />
          <Field
            label="Shipment ID"
            value={getText(record, "shipment_id")}
            mono
          />
          <Field
            label="Bill of lading"
            value={getText(
              record,
              "bill_of_lading",
              "bill_of_lading_number",
              "bl_number",
            )}
            mono
          />
          <Field
            label="Shipping line"
            value={getText(record, "shipping_line", "carrier_name")}
          />
          <Field
            label="Vessel name"
            value={getText(record, "vessel_name", "vessel")}
          />
          <Field
            label="Voyage number"
            value={getText(record, "voyage_number", "voyage_no")}
          />
          <Field
            label="Origin port"
            value={getText(record, "origin_port", "port_of_origin")}
          />
          <Field
            label="Destination port"
            value={getText(
              record,
              "destination_port",
              "port_of_destination",
            )}
          />
          <Field
            label="Consignee"
            value={getText(
              record,
              "consignee_name",
              "consignee",
            )}
          />
          <Field
            label="Organisation"
            value={getText(
              record,
              "organisation_name",
              "organization_name",
              "company_name",
            )}
          />
          <Field
            label="Licensed agent"
            value={getText(
              record,
              "licensed_agent_name",
              "agent_name",
            )}
          />
        </InfoSection>

        <InfoSection
          title="Gate and transport information"
          icon={Truck}
          description="Gate-pass information and cargo arrival details."
        >
          <Field
            label="Gate pass number"
            value={getText(
              record,
              "gate_pass_number",
              "gate_pass",
              "gate_pass_reference",
            )}
            mono
          />
          <Field
            label="Gate pass ID"
            value={getText(record, "gate_pass_id")}
            mono
          />
          <Field
            label="Appointment reference"
            value={getText(
              record,
              "appointment_reference",
              "appointment_number",
            )}
            mono
          />
          <Field
            label="Gate-in time"
            value={formatDate(
              getValue(
                record,
                "gate_in_at",
                "gate_in_time",
                "entered_at",
              ),
            )}
          />
          <Field
            label="Gate-out time"
            value={formatDate(
              getValue(record, "gate_out_at", "gate_out_time", "exited_at"),
            )}
          />
          <Field
            label="Vehicle registration"
            value={getText(
              record,
              "vehicle_registration",
              "vehicle_number",
              "registration_number",
            )}
            mono
          />
          <Field
            label="Driver"
            value={getText(record, "driver_name", "driver")}
          />
          <Field
            label="Driver phone"
            value={getText(record, "driver_phone", "driver_mobile")}
          />
          <Field
            label="Gate lane"
            value={getText(record, "gate_lane", "lane_name")}
          />
          <Field
            label="Gate officer"
            value={getText(
              record,
              "gate_officer_name",
              "gate_operator",
            )}
          />
        </InfoSection>

        <InfoSection
          title="Cargo and weight verification"
          icon={Scale}
          description="Declared cargo quantities, expected weights and actual measurements."
        >
          <Field
            label="Container number"
            value={containerNumbers || getText(record, "container_no", "container_number")}
            mono
          />
          <Field
            label="Seal number"
            value={expectedSeals || getText(record, "seal_number", "seal_no")}
            mono
          />
          <Field
            label="Observed seal number"
            value={observedSeals || getText(
              record,
              "observed_seal_number",
              "observed_seal",
              "actual_seal_no",
            )}
            mono
          />
          <Field
            label="Expected weight"
            value={hasExpectedWeight
              ? formatWeight(expectedWeightTotal)
              : formatWeight(getValue(record, "expected_weight", "gross_weight", "declared_weight"))}
          />
          <Field
            label="Actual weight"
            value={hasActualWeight
              ? formatWeight(actualWeightTotal)
              : formatWeight(getValue(record, "actual_weight", "verified_weight", "measured_weight"))}
          />
          <Field
            label="Weight difference"
            value={(() => {
              const expected = hasExpectedWeight
                ? expectedWeightTotal
                : getNumber(record, "expected_weight", "gross_weight", "declared_weight");

              const actual = hasActualWeight
                ? actualWeightTotal
                : getNumber(record, "actual_weight", "verified_weight", "measured_weight");

              if (expected === null || actual === null) {
                return "—";
              }

              return formatWeight(actual - expected);
            })()}
          />
          <Field
            label="Package count"
            value={hasPackageCount
              ? new Intl.NumberFormat("en-NG").format(packageCountTotal)
              : getText(record, "package_count", "number_of_packages", "total_packages")}
          />
          <Field
            label="Cargo type"
            value={cargoTypes || getText(record, "cargo_type", "commodity", "cargo_category")}
          />
          <Field
            label="Cargo condition"
            value={cargoConditions || getText(record, "cargo_condition", "condition_status", "condition")}
          />
          <Field
            label="Discrepancy status"
            value={discrepancyStatuses || getText(record, "discrepancy_status", "damage_status")}
          />
        </InfoSection>

        <InfoSection
          title="Inspection and damage assessment"
          icon={ShieldCheck}
          description="Condition checks, damaged-goods information and inspection remarks."
        >
          <Field
            label="Inspection status"
            value={getText(
              record,
              "inspection_status",
              "inspection_result",
            )}
          />
          <Field
            label="Inspector"
            value={getText(
              record,
              "inspector_name",
              "inspected_by_name",
              "inspected_by",
            )}
          />
          <Field
            label="Inspection date"
            value={formatDate(
              getValue(
                record,
                "inspection_at",
                "inspected_at",
                "inspection_date",
              ),
            )}
          />
          <Field
            label="Damage reported"
            value={getText(
              record,
              "damage_reported",
              "has_damage",
              "damaged",
            )}
          />
          <Field
            label="Damage type"
            value={getText(
              record,
              "damage_type",
              "damage_category",
            )}
          />
          <Field
            label="Damage description"
            value={getText(
              record,
              "damage_description",
              "damage_details",
            )}
          />
          <Field
            label="Seal condition"
            value={getText(
              record,
              "seal_condition",
              "seal_status",
            )}
          />
          <Field
            label="Packaging condition"
            value={getText(
              record,
              "packaging_condition",
              "package_condition",
            )}
          />
          <Field
            label="Inspection remarks"
            value={getText(
              record,
              "inspection_remarks",
              "inspection_notes",
            )}
          />
          <Field
            label="Damage quantity"
            value={getText(
              record,
              "damaged_quantity",
              "damaged_packages",
            )}
          />
          <Field
            label="Damage location"
            value={getText(
              record,
              "damage_location",
              "affected_area",
            )}
          />
          <Field
            label="Reported by"
            value={getText(
              record,
              "damage_reported_by",
              "reported_by",
            )}
          />
        </InfoSection>

        {containers.length > 0 && (
          <section className={cardClass}>
            <div className="flex items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sand">
                <Container className="size-4 text-ink" />
              </div>

              <div>
                <h2 className={sectionTitleClass}>
                  Container inspection details
                </h2>
                <p className="mt-1 text-xs leading-5 text-ink-soft">
                  Container-level receiving status, seal verification,
                  actual weight, condition and damage evidence.
                </p>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {containers.map((container, index) => {
                const containerStatus = normalizeStatus(
                  getValue(
                    container,
                    "receiving_status",
                    "status",
                    "container_status",
                  ),
                );

                const containerCondition = normalizeStatus(
                  getValue(
                    container,
                    "condition_status",
                    "cargo_condition",
                    "damage_status",
                  ),
                );

                const containerNotes = getText(
                  container,
                  "discrepancy_notes",
                  "damage_description",
                  "remarks",
                  "notes",
                );

                const photos = extractPhotos(container);

                return (
                  <article
                    key={
                      getText(container, "id", "container_id") ||
                      `${getText(container, "container_no", "container_number")}-${index}`
                    }
                    className="overflow-hidden rounded-lg border border-line"
                  >
                    <div className="flex flex-col justify-between gap-3 bg-sand/50 p-4 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <p className={labelClass}>
                          Container {index + 1}
                        </p>

                        <h3 className="mt-1 break-all font-mono text-base font-bold text-ink">
                          {getText(
                            container,
                            "container_no",
                            "container_number",
                          ) || "Container number unavailable"}
                        </h3>

                        <p className="mt-1 break-all text-xs text-ink-soft">
                          ID: {getText(container, "id", "container_id") || "—"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <StatusBadge
                          label={displayStatus(containerStatus)}
                          tone={getStatusTone(containerStatus)}
                        />

                        {containerCondition &&
                          containerCondition !== "UNKNOWN" && (
                            <StatusBadge
                              label={displayStatus(containerCondition)}
                              tone={getStatusTone(containerCondition)}
                            />
                          )}
                      </div>
                    </div>

                    <div className="grid gap-5 p-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Field
                        label="Container number"
                        value={getText(
                          container,
                          "container_no",
                          "container_number",
                        )}
                        mono
                      />
                      <Field
                        label="Expected seal"
                        value={getText(
                          container,
                          "expected_seal_no",
                          "seal_number",
                          "seal_no",
                        )}
                        mono
                      />
                      <Field
                        label="Observed seal"
                        value={getText(
                          container,
                          "actual_seal_no",
                          "observed_seal_number",
                          "observed_seal",
                        )}
                        mono
                      />
                      <Field
                        label="Expected weight"
                        value={formatWeight(
                          getValue(
                            container,
                            "expected_weight",
                            "gross_weight",
                          ),
                        )}
                      />
                      <Field
                        label="Actual weight"
                        value={formatWeight(
                          getValue(
                            container,
                            "actual_weight",
                            "verified_weight",
                          ),
                        )}
                      />
                      <Field
                        label="Receiving location"
                        value={getText(
                          container,
                          "receiving_location",
                          "receiving_bay",
                          "yard_location",
                        )}
                      />
                      <Field
                        label="Cargo condition"
                        value={getText(
                          container,
                          "condition_status",
                          "cargo_condition",
                        )}
                      />
                      <Field
                        label="Received at"
                        value={formatDate(
                          getValue(container, "received_at", "received_on"),
                        )}
                      />
                      <Field
                        label="Damage type"
                        value={getText(
                          container,
                          "damage_type",
                          "damage_category",
                        )}
                      />
                      <Field
                        label="Damaged quantity"
                        value={getText(
                          container,
                          "damaged_quantity",
                          "damaged_packages",
                        )}
                      />
                      <Field
                        label="Inspection status"
                        value={getText(
                          container,
                          "inspection_status",
                          "inspection_result",
                        )}
                      />
                      <Field
                        label="Inspected by"
                        value={getText(
                          container,
                          "inspector_name",
                          "inspected_by",
                        )}
                      />
                    </div>

                    {containerNotes && (
                      <div className="border-t border-line bg-coral/5 p-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-coral" />
                          <div>
                            <p className="text-xs font-bold text-ink">
                              Discrepancy / damage remarks
                            </p>
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-ink-soft">
                              {containerNotes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {photos.length > 0 && (
                      <div className="border-t border-line p-4">
                        <PhotoGallery
                          title="Container damage photos and attachments"
                          photos={photos}
                        />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {allPhotos.length > 0 ? (
          <PhotoGallery
            title="Damaged goods photos and evidence"
            photos={allPhotos}
          />
        ) : (
          <section className={cardClass}>
            <div className="flex items-start gap-3 p-4 sm:p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sand">
                <FileImage className="size-5 text-ink-soft" />
              </div>

              <div>
                <h2 className={sectionTitleClass}>
                  Damage photos and attachments
                </h2>
                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  No photos were found in the image and attachment fields
                  returned by the receiving details API.
                </p>
                <p className="mt-2 text-xs leading-5 text-ink-soft">
                  If photos exist in your database, ensure the API returns
                  their URLs in fields such as{" "}
                  <code>damage_photos</code>, <code>damage_images</code>,{" "}
                  <code>photos</code>, or the relevant container records.
                </p>
              </div>
            </div>
          </section>
        )}

        <DetailList
          title="Additional receiving data"
          record={record}
          exclude={[
            "status",
            "receiving_status",
            "receiving_reference",
            "reference",
            "receiving_id",
            "shipment_reference",
            "shipment_ref",
            "shipment_id",
            "bill_of_lading",
            "bill_of_lading_number",
            "bl_number",
            "gate_pass_number",
            "gate_pass",
            "gate_pass_reference",
            "container_no",
            "container_number",
            "seal_number",
            "seal_no",
            "observed_seal_number",
            "observed_seal",
            "shipping_line",
            "carrier_name",
            "vessel_name",
            "vessel",
            "origin_port",
            "port_of_origin",
            "expected_weight",
            "gross_weight",
            "declared_weight",
            "actual_weight",
            "verified_weight",
            "measured_weight",
            "receiving_location",
            "receiving_bay",
            "received_bay",
            "cargo_condition",
            "condition_status",
            "condition",
            "discrepancy_notes",
            "discrepancy_reason",
            "remarks",
            "notes",
            "received_at",
            "received_on",
            "created_at",
            "updated_at",
            "modified_at",
            "total_containers",
            "container_count",
            "received_containers",
            "containers_received",
            "discrepancy_containers",
            "damaged_containers",
            "containers_with_discrepancies",
          ]}
        />

        <section className="rounded-xl bg-paper p-4 ring-1 ring-line sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sand">
              <Warehouse className="size-5 text-ink-soft" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-ink">
                Receiving control
              </h2>

              <p className="mt-1 max-w-3xl text-xs leading-5 text-ink-soft">
                This page displays receiving information returned by the
                server. Verify container identity, seal condition, actual
                weight and damage evidence before accepting discrepancies
                or completing receiving operations.
              </p>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-soft">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {formatDate(
                    getValue(record, "received_at", "created_at"),
                  )}
                </span>

                {getText(record, "receiving_location", "receiving_bay") && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {getText(
                      record,
                      "receiving_location",
                      "receiving_bay",
                    )}
                  </span>
                )}

                {getText(record, "gate_pass_number", "gate_pass") && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    Gate pass:{" "}
                    {getText(record, "gate_pass_number", "gate_pass")}
                  </span>
                )}

                {discrepancyContainers === 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    No container discrepancies reported
                  </span>
                )}

                {discrepancyContainers > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-coral">
                    <XCircle className="size-3.5" />
                    {discrepancyContainers} container
                    {discrepancyContainers === 1 ? "" : "s"} require attention
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/operations/receiving")}
            className="border-line bg-paper text-ink hover:bg-sand"
          >
            <ArrowLeft className="size-4" />
            Back to receiving register
          </Button>

          {getText(record, "shipment_id") && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(
                  `/operations/shipments/${encodeURIComponent(
                    getText(record, "shipment_id"),
                  )}`,
                )
              }
              className="border-line bg-paper text-ink hover:bg-sand"
            >
              <Package className="size-4" />
              View shipment
            </Button>
          )}

          {getText(record, "gate_pass_id") && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(
                  `/operations/gate/passes/${encodeURIComponent(
                    getText(record, "gate_pass_id"),
                  )}`,
                )
              }
              className="border-line bg-paper text-ink hover:bg-sand"
            >
              <Truck className="size-4" />
              View gate pass
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}