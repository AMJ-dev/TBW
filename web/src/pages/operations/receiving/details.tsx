import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { resolveSrc } from "@/lib/functions";

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

  const actualWeightTotal = containers.reduce((total, container) => {
    const value = getNumber(container, "actual_weight", "verified_weight");
    return total + (value ?? 0);
  }, 0);

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

  const root = record ?? {};
  const shipment = isRecord(root["shipment"]) ? root["shipment"] : {};
  const organisation = isRecord(root["organisation"])
    ? root["organisation"]
    : isRecord(root["organization"])
      ? root["organization"]
      : {};
  const gatePass = isRecord(root["gate_pass"])
    ? root["gate_pass"]
    : isRecord(root["gatePass"])
      ? root["gatePass"]
      : {};
  const appointment = isRecord(gatePass["appointment"])
    ? gatePass["appointment"]
    : isRecord(root["appointment"])
      ? root["appointment"]
      : {};
  const vehicle = isRecord(gatePass["vehicle"])
    ? gatePass["vehicle"]
    : isRecord(root["vehicle"])
      ? root["vehicle"]
      : {};
  const driver = isRecord(gatePass["driver"])
    ? gatePass["driver"]
    : isRecord(root["driver"])
      ? root["driver"]
      : {};
  const movements = extractArray(root, "movements").length
    ? extractArray(root, "movements")
    : extractArray(gatePass, "movements");
  const documents = extractArray(root, "documents");
  const logs = extractArray(root, "logs", "history");
  const cargoVerification = isRecord(root["cargo_verification"])
    ? root["cargo_verification"]
    : {};
  const summary = isRecord(root["summary"]) ? root["summary"] : {};

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
            Retrieving shipment, container and receiving information.
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

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={displayStatus(status)}
                  tone={getStatusTone(status)}
                />

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
          <Field label="Started by" value={getText(record, "started_by_name")} />
          <Field label="Started at" value={formatDate(getValue(record, "started_at"))} />
          <Field label="Completed by" value={getText(record, "completed_by_name")} />
          <Field label="Completed at" value={formatDate(getValue(record, "completed_at"))} />
          <Field label="Gate-in time" value={formatDate(getValue(record, "gate_in_time"))} />
          <Field label="Gate-out time" value={formatDate(getValue(record, "gate_out_time"))} />
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
          title="Organisation information"
          icon={Warehouse}
          description="Organisation details associated with this shipment."
        >
          <Field label="Organisation name" value={getText(organisation, "organisation_name", "name", "trading_name")} />
          <Field label="Trading name" value={getText(organisation, "trading_name")} />
          <Field label="RC number" value={getText(organisation, "rc_number")} mono />
          <Field label="TIN" value={getText(organisation, "tin")} mono />
          <Field label="Organisation type" value={getText(organisation, "organisation_type", "type")} />
          <Field label="Verification status" value={displayStatus(normalizeStatus(getText(organisation, "verification_status")))} />
          <Field label="Registered address" value={getText(organisation, "registered_address")} />
          <Field label="Contact person" value={getText(organisation, "contact_person")} />
          <Field label="Contact email" value={getText(organisation, "contact_email")} />
          <Field label="Contact phone" value={getText(organisation, "contact_phone")} />
        </InfoSection>

        <InfoSection
          title="Shipment declaration"
          icon={Package}
          description="Cargo, consignee and customs information from the shipment declaration."
        >
          <Field label="Shipment type" value={getText(shipment, "shipment_type")} />
          <Field label="Booking number" value={getText(shipment, "booking_number")} mono />
          <Field label="Origin country" value={getText(shipment, "origin_country")} />
          <Field label="Expected arrival" value={formatDate(getValue(shipment, "expected_arrival"))} />
          <Field label="Consignee" value={getText(shipment, "consignee")} />
          <Field label="Consignee contact person" value={getText(shipment, "consignee_contact_person")} />
          <Field label="Consignee email" value={getText(shipment, "consignee_email")} />
          <Field label="Consignee phone" value={getText(shipment, "consignee_phone")} />
          <Field label="Consignee address" value={getText(shipment, "consignee_address")} />
          <Field label="Consignee country" value={getText(shipment, "consignee_country")} />
          <Field label="Consignee type" value={getText(shipment, "consignee_type")} />
          <Field label="Consignee status" value={getText(shipment, "consignee_status")} />
          <Field label="Cargo description" value={getText(shipment, "cargo_description")} />
          <Field label="Cargo category" value={getText(shipment, "cargo_category")} />
          <Field label="Package type" value={getText(shipment, "package_type")} />
          <Field label="Declared package count" value={getText(shipment, "package_count")} />
          <Field label="Declared gross weight" value={formatWeight(getValue(shipment, "gross_weight"))} />
          <Field label="Cargo volume" value={getText(shipment, "volume")} />
          <Field label="Dangerous goods" value={getText(shipment, "dangerous_goods")} />
          <Field label="Temperature controlled" value={getText(shipment, "temperature_controlled")} />
          <Field label="Temperature" value={getText(shipment, "temperature")} />
          <Field label="Customs reference" value={getText(shipment, "customs_reference")} mono />
          <Field label="Special instructions" value={getText(shipment, "special_instructions")} />
        </InfoSection>

        <InfoSection
          title="Gate pass and appointment"
          icon={ClipboardCheck}
          description="Gate pass status, appointment booking and issuance details."
        >
          <Field label="Pass code" value={getText(gatePass, "pass_code")} mono />
          <Field label="Gate pass type" value={getText(gatePass, "type")} />
          <Field label="Gate pass status" value={displayStatus(normalizeStatus(getText(gatePass, "status")))} />
          <Field label="Issued by" value={getText(gatePass, "issued_by_name")} />
          <Field label="Issued at" value={formatDate(getValue(gatePass, "issued_at"))} />
          <Field label="Appointment reference" value={getText(appointment, "appointment_reference", "booking_ref")} mono />
          <Field label="Appointment date" value={formatDate(getValue(appointment, "appointment_date"))} />
          <Field label="Appointment time" value={getText(appointment, "slot_time")} />
          <Field label="Appointment status" value={displayStatus(normalizeStatus(getText(appointment, "status")))} />
          <Field label="Gate-in officer" value={getText(record, "gate_officer_name")} />
        </InfoSection>

        <InfoSection
          title="Vehicle and driver"
          icon={Truck}
          description="Transport details recorded against the gate pass."
        >
          <Field label="Vehicle registration" value={getText(vehicle, "plate", "registration", "registration_number", "vehicle_registration") || getText(record, "vehicle_registration")} mono />
          <Field label="Vehicle type" value={getText(vehicle, "kind", "type")} />
          <Field label="Make" value={getText(vehicle, "make")} />
          <Field label="Model" value={getText(vehicle, "model")} />
          <Field label="Year" value={getText(vehicle, "year")} />
          <Field label="Capacity" value={getText(vehicle, "capacity")} />
          <Field label="Vehicle owner" value={getText(vehicle, "owner")} />
          <Field label="Transporter" value={getText(vehicle, "transporter") || getText(driver, "transporter")} />
          <Field label="Insurance expiry" value={formatDate(getValue(vehicle, "insurance_expiry"))} />
          <Field label="Roadworthiness expiry" value={formatDate(getValue(vehicle, "roadworthiness_expiry"))} />
          <Field label="Driver name" value={getText(driver, "name", "full_name") || getText(record, "driver_name")} />
          <Field label="Driver phone" value={getText(driver, "phone", "phone_number") || getText(record, "driver_phone")} />
          <Field label="Licence number" value={getText(driver, "licence_number")} mono />
          <Field label="Licence class" value={getText(driver, "licence_class")} />
          <Field label="Licence expiry" value={formatDate(getValue(driver, "licence_expiry"))} />
          <Field label="Driver status" value={displayStatus(normalizeStatus(getText(driver, "status")))} />
        </InfoSection>

        {movements.length > 0 && (
          <section className={cardClass}>
            <div className="border-b border-line px-4 py-4 sm:px-5">
              <h2 className={sectionTitleClass}>Gate movement history</h2>
              <p className="mt-1 text-xs text-ink-soft">Recorded gate admission and exit decisions.</p>
            </div>
            <div className="divide-y divide-line">
              {movements.map((movement, index) => (
                <div key={`${getText(movement, "movement_at", "created_at")}-${index}`} className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Direction" value={displayStatus(normalizeStatus(getText(movement, "direction")))} />
                  <Field label="Decision" value={displayStatus(normalizeStatus(getText(movement, "decision")))} />
                  <Field label="Officer" value={getText(movement, "operator_name", "gate_officer_name")} />
                  <Field label="Movement time" value={formatDate(getValue(movement, "movement_at", "created_at"))} />
                  <div className="sm:col-span-2 lg:col-span-4"><Field label="Reason" value={getText(movement, "reason")} /></div>
                </div>
              ))}
            </div>
          </section>
        )}

        {documents.length > 0 && (
          <section className={cardClass}>
            <div className="flex items-center justify-between border-b border-line px-4 py-4 sm:px-5">
              <div>
                <h2 className={sectionTitleClass}>Receiving documents</h2>
                <p className="mt-1 text-xs text-ink-soft">{documents.length} uploaded document{documents.length === 1 ? "" : "s"} attached to this receiving record.</p>
              </div>
              <FileText className="size-5 text-ink-soft" />
            </div>
            <div className="divide-y divide-line">
              {documents.map((document, index) => {
                const filePath = getText(document, "file_url", "document_url", "file_path", "path");
                const fileUrl = filePath ? resolveSrc(filePath) : "";
                const fileSize = getNumber(document, "file_size");
                return (
                  <div key={`${getText(document, "document_key")}-${index}`} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sand"><FileText className="size-4 text-ink" /></div>
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-ink">{getText(document, "document_type", "document_key") || "Receiving document"}</p>
                        <p className="mt-1 break-all text-xs text-ink-soft">{getText(document, "original_name", "stored_name")}</p>
                        <p className="mt-1 text-xs text-ink-soft">Uploaded by {getText(document, "uploaded_by_name") || "—"} · {formatDate(getValue(document, "uploaded_at"))}{fileSize !== null ? ` · ${(fileSize / 1024 / 1024).toFixed(2)} MB` : ""}</p>
                      </div>
                    </div>
                    {fileUrl && <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-ink underline">Open document <ExternalLink className="size-3" /></a>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <InfoSection
          title="Cargo verification summary"
          icon={Scale}
          description="Summary values calculated from the receiving and container records."
        >
          <Field label="Container count" value={getText(cargoVerification, "container_count") || getText(summary, "total_containers")} />
          <Field label="Expected package count" value={getText(cargoVerification, "expected_package_count")} />
          <Field label="Declared gross weight" value={formatWeight(getValue(cargoVerification, "declared_gross_weight"))} />
          <Field label="Actual weight total" value={formatWeight(getValue(cargoVerification, "actual_weight_total") ?? getValue(summary, "actual_weight_total"))} />
          <Field label="Containers with actual weight" value={getText(cargoVerification, "container_count_with_weight") || getText(summary, "containers_with_weight")} />
          <Field label="Containers with seal mismatch" value={getText(cargoVerification, "container_count_with_seal_mismatch") || getText(summary, "containers_with_seal_mismatch")} />
          <Field label="Documents uploaded" value={getText(summary, "documents_count") || getText(record, "documents_count")} />
          <Field label="Containers returned" value={getText(summary, "containers_returned")} />
        </InfoSection>

        {logs.length > 0 && (
          <section className={cardClass}>
            <div className="border-b border-line px-4 py-4 sm:px-5">
              <h2 className={sectionTitleClass}>Receiving activity</h2>
              <p className="mt-1 text-xs text-ink-soft">A timeline of actions performed on this receiving record.</p>
            </div>
            <div className="divide-y divide-line">
              {logs.map((log, index) => (
                <div key={`${getText(log, "action")}-${index}`} className="grid gap-3 p-4 sm:grid-cols-[1fr_2fr_1fr]">
                  <div>
                    <p className={labelClass}>Action</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{formatLabel(getText(log, "action") || "Activity")}</p>
                    <p className="mt-1 text-xs text-ink-soft">{formatDate(getValue(log, "performed_at"))}</p>
                  </div>
                  <div>
                    <p className={labelClass}>Activity details</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">{getText(log, "description") || "—"}</p>
                    <p className="mt-1 text-xs text-ink-soft">{getText(log, "previous_status") ? `${displayStatus(normalizeStatus(getText(log, "previous_status")))} → ` : ""}{displayStatus(normalizeStatus(getText(log, "new_status")))}</p>
                  </div>
                  <Field label="Performed by" value={getText(log, "performed_by_name")} />
                </div>
              ))}
            </div>
          </section>
        )}

        <InfoSection
          title="Cargo details"
          icon={Scale}
          description="Container identifiers, seal details, package quantities and actual measurements."
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
            label="Actual weight"
            value={hasActualWeight
              ? formatWeight(actualWeightTotal)
              : formatWeight(getValue(record, "actual_weight", "verified_weight", "measured_weight"))}
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
        </InfoSection>

        {containers.length > 0 && (
          <section className={cardClass}>
            <div className="flex items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sand">
                <Container className="size-4 text-ink" />
              </div>

              <div>
                <h2 className={sectionTitleClass}>
                  Container receiving details
                </h2>
                <p className="mt-1 text-xs leading-5 text-ink-soft">
                  Container identity, seal verification, actual weight and receiving location.
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
            title="Receiving photos and evidence"
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
                  Receiving photos and attachments
                </h2>
                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  No photos were found in the receiving photo fields returned by the API.
                </p>
                <p className="mt-2 text-xs leading-5 text-ink-soft">
                  Upload receiving photographs through the receiving documents section.
                </p>
              </div>
            </div>
          </section>
        )}

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
        </div>
      </div>
    </AppShell>
  );
}