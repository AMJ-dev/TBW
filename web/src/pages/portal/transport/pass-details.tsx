import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  LoaderCircle,
  Printer,
  RefreshCw,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  AppShell,
  StatusBadge,
  statusTone,
} from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { http, type Resp } from "@/lib/httpClient";

type GatePass = {
  id: string;
  pass_code: string;
  vehicle_plate: string;
  driver_name: string;
  driver_phone: string;
  type: string;
  issued_at: string;
  valid_until: string;
  status: string;
  container_nos: string[];
};

export default function GatePassDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pass, setPass] = useState<GatePass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;

  const fetchPassWithRetry = useCallback(
    async (attempt = 1): Promise<void> => {
      if (!id) {
        setLoading(false);
        setError("No pass ID provided.");
        return;
      }

      try {
        const response = await http.get(`gate-passes/view/${id}/`);
        const resp: Resp = response.data;

        if (resp.error) {
          throw new Error(String(resp.data || "Could not load gate pass."));
        }

        setPass(resp.code as GatePass);
        setError(null);
      } catch (err: any) {
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAY_MS * attempt)
          );
          return fetchPassWithRetry(attempt + 1);
        }
        
        const errorMessage =
          err?.message || "Could not load gate pass after multiple attempts.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    },
    [id]
  );

  const loadPass = useCallback(async () => {
    setLoading(true);
    setError(null);
    await fetchPassWithRetry(1);
    setLoading(false);
  }, [fetchPassWithRetry]);

  useEffect(() => {
    void loadPass();
  }, [loadPass]);

  const formatDate = (value: string) => {
    if (!value) return "—";
    const date = new Date(value.replace(" ", "T"));
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell title="Gate Pass Details" eyebrow="Gate Control · Pass Record">
      <motion.div
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mx-auto max-w-4xl space-y-6"
      >
        <div className="flex items-center justify-between print:hidden">
          <Button
            variant="outline"
            className="border-line bg-paper text-ink hover:bg-sand"
            onClick={() => navigate("/portal/passes")}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to Passes
          </Button>

          {pass && (
            <Button
              onClick={handlePrint}
              className="bg-orange text-white hover:bg-orange-deep"
            >
              <Printer className="mr-2 size-4" />
              Print Gate Slip
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-paper p-16 ring-1 ring-line">
            <LoaderCircle className="mb-4 size-8 animate-spin text-orange" />
            <p className="text-sm font-medium text-ink-soft">
              Retrieving pass details...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-carmine/25 bg-carmine/5 p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 size-8 text-carmine" />
            <p className="font-display text-lg font-bold text-ink">
              Failed to load pass
            </p>
            <p className="mt-1 text-sm text-ink-soft">{error}</p>
            <Button
              onClick={() => void loadPass()}
              className="mt-6 bg-carmine text-white hover:bg-carmine/90"
            >
              <RefreshCw className="mr-2 size-4" />
              Retry Connection
            </Button>
          </div>
        ) : !pass ? (
          <div className="rounded-xl bg-paper p-12 text-center ring-1 ring-line">
            <Ticket className="mx-auto mb-3 size-7 text-ink-soft" />
            <p className="font-semibold text-ink">Gate pass not found</p>
            <p className="mt-1 text-sm text-ink-soft">
              This pass may have been revoked or deleted.
            </p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl bg-paper shadow-sm ring-1 ring-line print:shadow-none print:ring-0">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-slate px-6 py-5 text-sand">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-orange text-white">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
                    TRÏNŪ Bonded Warehouse
                  </p>
                  <h2 className="mt-0.5 font-display text-lg font-bold text-sand">
                    Terminal Gate Clearance
                  </h2>
                </div>
              </div>
              <StatusBadge
                label={pass.status}
                tone={statusTone(pass.status)}
              />
            </div>

            <div className="grid gap-0 lg:grid-cols-[1fr_300px]">
              <div className="p-6 sm:p-8">
                <div className="mb-6 border-b border-line border-dashed pb-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Pass Code / Reference
                  </p>
                  <h3 className="mt-1 font-mono text-3xl font-bold tracking-tight text-orange-deep">
                    {pass.pass_code}
                  </h3>
                  <p className="mt-2 text-sm text-ink">
                    <span className="font-semibold text-ink-soft">Type:</span>{" "}
                    {pass.type}
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                      Truck Plate
                    </p>
                    <p className="mt-1 rounded-md bg-sand px-3 py-2 font-mono text-lg font-bold text-ink ring-1 ring-line">
                      {pass.vehicle_plate || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                      Driver Details
                    </p>
                    <div className="mt-1 rounded-md bg-sand px-3 py-2 ring-1 ring-line">
                      <p className="font-semibold text-ink">
                        {pass.driver_name || "—"}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-ink-soft">
                        {pass.driver_phone || "—"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                      Issued At
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink">
                      {formatDate(pass.issued_at)}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                      Valid Until
                    </p>
                    <p className="mt-1 text-sm font-medium text-carmine">
                      {formatDate(pass.valid_until)}
                    </p>
                  </div>
                </div>

                <div className="mt-8 border-t border-line border-dashed pt-6">
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Authorised Containers ({pass.container_nos.length})
                  </h4>

                  {pass.container_nos.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pass.container_nos.map((container) => (
                        <span
                          key={container}
                          className="rounded-md border border-line bg-sand px-3 py-2 font-mono text-sm font-semibold text-ink"
                        >
                          {container}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-ink-soft">
                      No containers authorised on this pass.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center border-t border-line bg-sand/30 p-8 lg:border-l lg:border-t-0">
                <div className="rounded-xl border-4 border-ink bg-white p-4">
                  <QRCodeSVG
                    value={pass.pass_code}
                    size={128}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                
                <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                  Scan at Gate Lane
                  <br />
                  ANPR & QR Compatible
                </p>

                <div className="mt-6 w-full rounded-lg bg-orange/10 p-3 text-center ring-1 ring-orange/20">
                  <p className="text-[11px] font-semibold text-orange-deep">
                    Must present physical slip at checkpoint.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </motion.div>
    </AppShell>
  );
}