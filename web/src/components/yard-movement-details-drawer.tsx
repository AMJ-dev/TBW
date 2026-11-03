
import {
  ArrowRight,
  Calendar,
  Container,
  FileText,
  MapPin,
  Truck,
  User,
  X,
  Package,
  Weight,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface YardMovementLog {
  id?: string;
  action?: string;
  description?: string;
  previous_location_name?: string | null;
  new_location_name?: string | null;
  performed_by?: string;
  performed_at?: string;
}

export interface YardMovementItem {
  id: string;
  containerId: string;
  billOfLading: string;
  shipmentReference: string;
  containerNo: string;
  movementType: string;
  gateLane: string;
  originSlot: string;
  targetSlot: string;
  equipment: string;
  operator: string;
  reason: string;
  status: string;
  timestamp: string;
  blockedBy?: string;
  containerSize: string;
  sealNo: string;
  equipmentCode: string;
  equipmentType: string;
  registrationNumber: string;
  movementReference: string;
  shipmentId: string;
  containerStatus: string;
  logs: YardMovementLog[];
  grossWeight?: string;
  cargoDescription?: string;
  bookingNumber?: string;
  vesselName?: string;
  voyageNumber?: string;
  shippingLine?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  movement: YardMovementItem | null;
}

const formatDate = (value?: string) => {
  if (!value) return "Not recorded";

  const date = new Date(value.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
};

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null | undefined;
}) => (
  <div className="min-w-0 space-y-1">
    <p className="text-xs text-ink-soft">{label}</p>
    <p className="break-words text-sm font-medium text-ink">
      {value !== null && value !== undefined && value !== ""
        ? value
        : "Not recorded"}
    </p>
  </div>
);

export default function YardMovementDetailsDrawer({
  open,
  onClose,
  movement,
}: Props) {
  if (!movement) return null;

  const logs = movement.logs ?? [];

  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l border-sand bg-paper p-0 sm:max-w-xl"
      >
        <SheetHeader className="sticky top-0 z-10 border-b border-sand bg-paper px-6 py-5 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="text-lg font-semibold text-ink">
                Yard Movement Details
              </SheetTitle>
              <SheetDescription className="mt-1 text-sm text-ink-soft">
                {movement.movementReference || "Movement record"}
              </SheetDescription>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-ink-soft transition hover:bg-sand hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>
        </SheetHeader>

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-ink-soft">Movement reference</p>
              <p className="mt-1 font-semibold text-ink">
                {movement.movementReference || "Not recorded"}
              </p>
            </div>

            <Badge className="border-orange/20 bg-orange/10 text-orange">
              {movement.containerStatus || "Completed"}
            </Badge>
          </div>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Container size={17} className="text-orange" />
              <h3 className="text-sm font-semibold text-ink">
                Container Information
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <DetailItem label="Container number" value={movement.containerNo} />
              <DetailItem label="Container size" value={movement.containerSize} />
              <DetailItem label="Seal number" value={movement.sealNo} />
              <DetailItem label="Container status" value={movement.containerStatus} />
              <DetailItem label="Gross weight" value={movement.grossWeight} />
            </div>

            {movement.cargoDescription && (
              <DetailItem
                label="Cargo description"
                value={movement.cargoDescription}
              />
            )}
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText size={17} className="text-orange" />
              <h3 className="text-sm font-semibold text-ink">
                Shipment Information
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <DetailItem
                label="Shipment reference"
                value={movement.shipmentReference}
              />
              <DetailItem
                label="Bill of lading"
                value={movement.billOfLading}
              />
              <DetailItem label="Booking number" value={movement.bookingNumber} />
              <DetailItem label="Vessel" value={movement.vesselName} />
              <DetailItem label="Voyage" value={movement.voyageNumber} />
              <DetailItem label="Shipping line" value={movement.shippingLine} />
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin size={17} className="text-orange" />
              <h3 className="text-sm font-semibold text-ink">
                Movement Route
              </h3>
            </div>

            <div className="rounded-xl border border-sand p-4">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-soft">From location</p>
                  <p className="mt-1 text-sm font-medium text-ink">
                    {movement.originSlot || "Container Receiving Bay"}
                  </p>
                </div>

                <ArrowRight size={20} className="shrink-0 text-orange" />

                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-soft">To location</p>
                  <p className="mt-1 text-sm font-medium text-ink">
                    {movement.targetSlot || "Not recorded"}
                  </p>
                </div>
              </div>
            </div>

            <DetailItem
              label="Movement type"
              value={movement.movementType.replaceAll("_", " ")}
            />
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Truck size={17} className="text-orange" />
              <h3 className="text-sm font-semibold text-ink">
                Equipment Information
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <DetailItem label="Equipment" value={movement.equipment} />
              <DetailItem label="Equipment code" value={movement.equipmentCode} />
              <DetailItem label="Equipment type" value={movement.equipmentType} />
              <DetailItem
                label="Registration number"
                value={movement.registrationNumber}
              />
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <User size={17} className="text-orange" />
              <h3 className="text-sm font-semibold text-ink">
                Operator Information
              </h3>
            </div>

            <DetailItem label="Moved by" value={movement.operator} />
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar size={17} className="text-orange" />
              <h3 className="text-sm font-semibold text-ink">
                Movement Information
              </h3>
            </div>

            <DetailItem
              label="Completed at"
              value={formatDate(movement.timestamp)}
            />

            <div className="space-y-1">
              <p className="text-xs text-ink-soft">Remarks</p>
              <p className="rounded-lg bg-sand/60 p-3 text-sm text-ink">
                {movement.reason || "No remarks provided"}
              </p>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-ink">
                Movement Activity
              </h3>
              <p className="mt-1 text-xs text-ink-soft">
                Recorded activities for this movement
              </p>
            </div>

            {logs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-sand p-5 text-center">
                <p className="text-sm text-ink-soft">
                  No additional activity records found.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log, index) => (
                  <div key={log.id || index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-orange" />
                      {index !== logs.length - 1 && (
                        <div className="mt-1 w-px flex-1 bg-sand" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pb-3">
                      <p className="text-sm font-semibold text-ink">
                        {log.action || "Movement activity"}
                      </p>

                      {log.description && (
                        <p className="mt-1 text-sm text-ink-soft">
                          {log.description}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-ink-soft">
                        {log.performed_by || "Not recorded"}
                        {" · "}
                        {formatDate(log.performed_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
