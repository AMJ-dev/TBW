import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

const STAGES_DONE = [
  { stage: 'Stage 1: Arrival', status: 'COMPLETED', desc: 'Gate-in inspection completed. NCS official cargo seal intact.', time: '24 Oct 2026, 08:30 WAT', location: 'Terminal Gate 1 • Weighbridge In', icon: 'check' },
  { stage: 'Stage 2: Documentation', status: 'COMPLETED', desc: 'Electronic manifest registered and verified against NCS ASYCUDA records.', time: '24 Oct 2026, 11:15 WAT', location: 'EDI EDI-ASY-9481', icon: 'check' },
  { stage: 'Stage 3: Receiving & Tally', status: 'COMPLETED', desc: 'Goods tallied, external condition recorded, positioned at Bay B-04.', time: '24 Oct 2026, 14:00 WAT', location: 'Bay B-04 Tally Master Ref #0412', icon: 'check' },
];

const PENDING_STAGES = [
  { stage: 'Stage 6: Release Authorisation', status: 'PENDING', desc: 'Pending Customs out-of-charge notice & terminal settlement.', icon: 'assignment_turned_in', rightLabel: 'Awaiting NCS Out-of-Charge', opacity: 'opacity-75' },
  { stage: 'Stage 7: Final Delivery / Exit Gate', status: 'PENDING RELEASE', desc: 'Pending release.', icon: 'output', rightLabel: 'Terminal Outgate B', opacity: 'opacity-60' },
];

export function TrackCargoPage() {
  const initialReference = new URLSearchParams(window.location.search).get('ref') ?? '';
  const [trackingInput, setTrackingInput] = useState(initialReference);
  const [detectedFormat, setDetectedFormat] = useState(initialReference ? 'Reference entered' : 'Awaiting Identifier...');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  const handleInputChange = (value: string) => {
    setTrackingInput(value);
    setHasSearched(false);
    setTrackingError('');
    const val = value.toUpperCase().trim();
    if (val.startsWith('TRN') || val.includes('-ABJ-')) setDetectedFormat('Ref Detected: TRÏNŪ Terminal ID');
    else if (val.length >= 4 && /^[A-Z]{4}/.test(val)) setDetectedFormat('Ref Detected: ISO 6346 Container Number');
    else if (val.length > 5) setDetectedFormat('Ref Detected: Ocean Bill of Lading (BL)');
    else setDetectedFormat('Awaiting Identifier...');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = trackingInput.trim().toUpperCase().replace(/[\s-]/g, '');
    const supported = ['TRNABJ20268841X', 'MSKU9482104', 'MEDUJ8392100'];
    if (!normalized) {
      setTrackingError('Enter a terminal reference, container number, or bill of lading.');
      setHasSearched(false);
      return;
    }
    if (!supported.includes(normalized)) {
      setTrackingError('No local demo record matches that reference. Try TRN-ABJ-2026-8841X, MSKU9482104, or MEDUJ8392100.');
      setHasSearched(false);
      return;
    }
    setTrackingError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setHasSearched(true);
      document.getElementById('resultsSection')?.scrollIntoView({ behavior: 'smooth' });
    }, 450);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const input = document.getElementById('subContact') as HTMLInputElement | null;
    if (input) input.value = '';
    setSubscriptionMessage('Demo only: alert preferences were not sent or saved.');
  };
  const [subscriptionMessage, setSubscriptionMessage] = useState('');

  return (
    <div className="flex flex-col w-full">
      {/* Search Hero */}
      <section className="w-full bg-surface-container-low py-16 px-margin md:px-margin-md lg:px-margin-lg">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              Local cargo tracking demo
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight mb-4">
            Track Your Cargo
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-10">
            Try a sample container, Bill of Lading, or terminal reference to preview a public-safe status record.
          </p>
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-md p-8 md:p-10 text-left">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="font-title-sm text-title-sm text-on-surface font-medium" htmlFor="trackingInput">
                    Container / BL / Terminal Reference
                  </label>
                  <span className="font-label-sm text-label-sm text-secondary bg-surface-container-high px-2 py-0.5 rounded">
                    {detectedFormat}
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="trackingInput"
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    value={trackingInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="e.g. TRN-ABJ-2026-8841X or MSKU9482104"
                    className="w-full rounded-xl bg-surface-container-lowest text-primary font-title-md text-title-md py-4 px-5 pr-12 focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setTrackingInput('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                  >
                    <Icon name="cancel" className="text-[20px]" />
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-on-surface-variant pt-1">
                  <p className="font-body-sm text-body-sm flex items-center gap-1.5">
                    <Icon name="info" className="text-secondary text-[16px]" />
                    Format hints will appear as you type. ISO 6346 check digit validation applies.
                  </p>
                  <span className="font-label-sm text-label-sm text-outline font-mono">
                    Sample: TRN-ABJ-2026-8841X
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-secondary-container hover:bg-secondary text-on-secondary font-title-md text-title-md font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.99]"
              >
                <Icon name={isLoading ? 'sync' : 'search_check'} className={`text-[22px] ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Querying Manifest...' : 'Track Cargo'}</span>
              </button>
            </form>
            {trackingError && <p role="alert" className="mt-4 rounded-lg bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container">{trackingError}</p>}
            <p className="mt-3 font-label-sm text-label-sm text-on-surface-variant">This screen uses sample data only. No live terminal or Customs system is queried.</p>
          </div>
        </div>
      </section>

      {/* Results */}
      {hasSearched && (
      <section className="w-full bg-background py-12 px-margin md:px-margin-md lg:px-margin-lg" id="resultsSection">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-8">
          {/* Metadata Bar */}
          <div className="bg-surface-container-lowest rounded-xl shadow-md p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm uppercase font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary-container" />
                  SAMPLE RECORD · STORED — STAGE 4 OF 7
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface text-on-surface-variant font-label-sm text-label-sm font-medium">
                  <Icon name="verified" className="text-[15px] text-secondary" />
                  Demo status · not live
                </span>
                <span className="px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
                  Sample record ABJ-88419
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 pt-1">
                <div>
                  <span className="font-label-sm text-label-sm uppercase text-outline-variant block">
                    Terminal Reference
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold font-mono tracking-tight">
                    TRN-ABJ-2026-8841X
                  </span>
                </div>
                <div className="hidden sm:block text-outline-variant self-center font-headline-sm">|</div>
                <div>
                  <span className="font-label-sm text-label-sm uppercase text-outline-variant block">
                    Container Number
                  </span>
                  <span className="font-title-lg text-title-lg text-primary font-semibold font-mono">
                    MSKU-948210-4{' '}
                    <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                      (40ft High Cube)
                    </span>
                  </span>
                </div>
                <div className="hidden sm:block text-outline-variant self-center font-headline-sm">|</div>
                <div>
                  <span className="font-label-sm text-label-sm uppercase text-outline-variant block">
                    Master B/L
                  </span>
                  <span className="font-title-lg text-title-lg text-primary font-semibold font-mono">
                    MEDUJ8392100
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 pt-4 lg:pt-0">
              <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg">
                <Icon name="local_shipping" className="text-secondary text-[20px]" />
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                    Transit Route
                  </span>
                  <span className="font-title-sm text-title-sm text-primary font-medium">
                    Apapa Corridor → TRÏNŪ Inland Bonded Terminal, Abuja
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface text-on-surface-variant hover:text-primary font-title-sm text-title-sm transition-colors"
                >
                  <Icon name="print" className="text-[18px]" />
                  <span>Print Dossier</span>
                </button>
                <a
                  href="#qrPass"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface text-secondary hover:text-secondary-container font-title-sm text-title-sm transition-colors"
                >
                  <Icon name="qr_code_2" className="text-[18px]" />
                  <span>Gate Pass QR</span>
                </a>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">
            {/* Timeline */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-surface-container-lowest rounded-xl shadow-md p-6 md:p-8">
                <div className="flex items-center justify-between pb-6 mb-6">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">
                      Custody & Regulatory Audit Trail
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Example timeline for this local demo record. It is not connected to Customs or terminal systems.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
                    WAT (UTC+1)
                  </span>
                </div>

                <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-surface-variant">
                  {STAGES_DONE.map((s) => (
                    <div key={s.stage} className="relative flex items-start gap-4">
                      <div className="absolute -left-6 sm:-left-8 w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center ring-4 ring-surface-container-lowest">
                        <Icon name={s.icon} className="text-[16px]" />
                      </div>
                      <div className="bg-surface rounded-lg p-4 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-title-md text-title-md text-primary font-semibold">
                              {s.stage}
                            </span>
                            <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container text-on-surface font-medium">
                              {s.status}
                            </span>
                          </div>
                          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                            {s.desc}
                          </p>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <span className="font-title-sm text-title-sm text-primary block font-mono">
                            {s.time}
                          </span>
                          <span className="font-label-sm text-label-sm text-outline">
                            {s.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Active */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute -left-6 sm:-left-8 w-7 h-7 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center ring-4 ring-secondary-container/20 animate-pulse">
                      <Icon name="inventory_2" className="text-[16px]" />
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-5 w-full shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-title-md text-title-md text-primary font-bold">
                            Stage 4: Secure Bonded Storage
                          </span>
                          <span className="px-2.5 py-0.5 rounded font-label-sm text-label-sm bg-secondary-container text-on-secondary font-bold">
                            ACTIVE / CURRENT
                          </span>
                        </div>
                        <span className="font-title-sm text-title-sm text-secondary font-mono font-semibold">
                          Sample status
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface mt-2 font-medium">
                        Currently recorded as stored at the bonded terminal. Exact storage positions are not shown in this public preview.
                      </p>
                      <div className="mt-4 pt-3 flex flex-wrap items-center gap-4 text-on-surface-variant">
                        {[
                          { icon: 'thermostat', text: 'Temp: 21.4°C • Target (20–24°C)' },
                          { icon: 'verified_user', text: 'Movement recorded in demo timeline' },
                        ].map((m) => (
                          <div key={m.text} className="flex items-center gap-1.5">
                            <Icon name={m.icon} className="text-[18px] text-secondary" />
                            <span className="font-body-sm text-body-sm">{m.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Scheduled */}
                  <div className="relative flex items-start gap-4 opacity-90">
                    <div className="absolute -left-6 sm:-left-8 w-7 h-7 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center ring-4 ring-surface-container-lowest">
                      <Icon name="fact_check" className="text-[16px]" />
                    </div>
                    <div className="bg-surface rounded-lg p-4 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-title-md text-title-md text-primary font-semibold">
                            Stage 5: Customs Processing & Examination
                          </span>
                          <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container-high text-on-surface-variant font-medium">
                            SCHEDULED
                          </span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                          Joint inspection bay reserved.{' '}
                          <span className="font-semibold text-primary">
                            "Customs decides clearance status."
                          </span>
                        </p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="font-title-sm text-title-sm text-primary block font-mono">
                          Expected 26 Oct 2026, 10:00 WAT
                        </span>
                        <span className="font-label-sm text-label-sm text-outline">
                          Joint Physical Exam Area • Bay 2
                        </span>
                      </div>
                    </div>
                  </div>

                  {PENDING_STAGES.map((s) => (
                    <div key={s.stage} className={`relative flex items-start gap-4 ${s.opacity}`}>
                      <div className="absolute -left-6 sm:-left-8 w-7 h-7 rounded-full bg-surface-container-high text-outline flex items-center justify-center ring-4 ring-surface-container-lowest">
                        <Icon name={s.icon} className="text-[16px]" />
                      </div>
                      <div className="bg-surface rounded-lg p-4 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-title-md text-title-md text-on-surface-variant font-medium">
                              {s.stage}
                            </span>
                            <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container-high text-outline">
                              {s.status}
                            </span>
                          </div>
                          <p className="font-body-md text-body-md text-outline mt-1">{s.desc}</p>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <span className="font-title-sm text-title-sm text-outline block">—</span>
                          <span className="font-label-sm text-label-sm text-outline">
                            {s.rightLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Utility Column */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* QR Card */}
              <div className="bg-surface-container-lowest rounded-xl shadow-md p-6 flex flex-col items-center text-center" id="qrPass">
                <div className="w-full flex items-center justify-between pb-3 mb-4">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                    Fast-Scan Pass
                  </span>
                  <span className="font-label-sm text-label-sm text-outline">ISO/IEC 18004</span>
                </div>
                <div className="p-3 bg-surface-container-lowest rounded-lg shadow-inner flex items-center justify-center mb-4">
                  <svg className="text-primary fill-current" height="150" viewBox="0 0 100 100" width="150">
                    <rect fill="none" height="28" stroke="currentColor" strokeWidth="4" width="28" x="5" y="5" />
                    <rect fill="currentColor" height="16" width="16" x="11" y="11" />
                    <rect fill="none" height="28" stroke="currentColor" strokeWidth="4" width="28" x="67" y="5" />
                    <rect fill="currentColor" height="16" width="16" x="73" y="11" />
                    <rect fill="none" height="28" stroke="currentColor" strokeWidth="4" width="28" x="5" y="67" />
                    <rect fill="currentColor" height="16" width="16" x="11" y="73" />
                    <rect fill="none" height="16" stroke="currentColor" strokeWidth="3" width="16" x="70" y="70" />
                    <rect fill="currentColor" height="4" width="4" x="76" y="76" />
                    <rect height="5" width="5" x="38" y="8" />
                    <rect height="5" width="5" x="46" y="12" />
                    <rect height="5" width="5" x="55" y="8" />
                    <rect height="5" width="5" x="38" y="24" />
                    <rect height="4" width="8" x="48" y="20" />
                    <rect height="6" width="6" x="10" y="38" />
                    <rect height="5" width="5" x="22" y="42" />
                    <rect height="5" width="5" x="8" y="52" />
                    <rect height="4" width="7" x="20" y="55" />
                    <rect height="6" width="6" x="38" y="38" />
                    <rect height="8" width="8" x="50" y="38" />
                    <rect height="6" width="6" x="42" y="52" />
                    <rect height="6" width="8" x="54" y="50" />
                    <rect height="5" width="5" x="40" y="66" />
                    <rect height="5" width="8" x="50" y="72" />
                    <rect height="6" width="6" x="42" y="84" />
                    <rect height="8" width="5" x="54" y="82" />
                    <rect height="5" width="8" x="68" y="40" />
                    <rect height="6" width="8" x="82" y="42" />
                    <rect height="8" width="6" x="72" y="52" />
                    <rect height="5" width="5" x="85" y="56" />
                    <circle className="text-secondary-container fill-current" cx="50" cy="50" r="3" />
                  </svg>
                </div>
                <span className="font-title-sm text-title-sm text-primary font-mono font-semibold">
                  TRN-ABJ-2026-8841X
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Permanent handheld scanning code for clearing agents and authorized terminal
                  hauliers.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('TRN-ABJ-2026-8841X');
                    alert('Terminal Reference copied to clipboard');
                  }}
                  className="mt-4 w-full py-2 px-3 rounded-lg bg-surface hover:bg-surface-container text-primary font-title-sm text-title-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Icon name="content_copy" className="text-[16px]" />
                  <span>Copy Tracking Link</span>
                </button>
              </div>

              {/* Subscribe */}
              <div className="bg-surface-container-lowest rounded-xl shadow-md p-6 flex flex-col gap-4">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                    Cargo Alerts
                  </span>
                  <h3 className="font-title-lg text-title-lg text-primary font-bold mt-1">
                    Subscribe to Real-time Updates
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Receive automated gate-in, NCS examination calls, and release alerts via your
                    preferred channel.
                  </p>
                </div>
                <form className="flex flex-col gap-3" onSubmit={handleSubscribe}>
                  <div className="flex items-center gap-4 py-1">
                    {['WhatsApp', 'SMS', 'Email'].map((c) => (
                      <label
                        key={c}
                        className="flex items-center gap-2 cursor-pointer font-body-sm text-body-sm text-on-surface"
                      >
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 rounded text-secondary-container focus:ring-0"
                        />
                        <span>{c}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-title-sm text-title-sm text-primary font-medium" htmlFor="subContact">
                      Contact Destination
                    </label>
                    <input
                      id="subContact"
                      required
                      type="text"
                      placeholder="+234 800 000 0000 or email"
                      className="w-full rounded-lg bg-surface-container text-primary font-body-md text-body-md py-2.5 px-3.5 focus:outline-none focus:ring-1 focus:ring-secondary-container"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-container text-on-primary font-title-sm text-title-sm font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Icon name="notifications_active" className="text-[18px]" />
                    <span>Activate Subscriptions</span>
                  </button>
                  <span
                    className="hidden text-center font-label-sm text-label-sm text-secondary font-medium pt-1"
                    id="subConfirmation"
                  >
                    {subscriptionMessage || 'Alert preferences stay in this browser preview.'}
                  </span>
                </form>
              </div>

              {/* Quick Stats */}
              <div className="bg-surface-container rounded-xl p-5 flex flex-col gap-3">
                <span className="font-label-sm text-label-sm uppercase font-semibold text-primary">
                  Terminal Facilities Record
                </span>
                <div className="space-y-2 font-body-sm text-body-sm">
                  {[
                    ['Record type:', 'Sample cargo movement'],
                    ['Current status:', 'Stored'],
                    ['Next step:', 'Authorised processing'],
                    ['Record mode:', 'Local preview'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-on-surface-variant">{k}</span>
                      <span className="font-mono text-primary font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Security notice */}
          <div className="bg-surface-container-high rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
              <Icon name="shield" className="text-[20px]" />
            </div>
            <div className="flex-1">
              <span className="font-title-sm text-title-sm text-primary font-bold block mb-0.5">
                Statutory Security & Data Safeguard
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Consignee details, cargo value, invoice amounts, detailed goods description, and
                storage location are not shown publicly for security and privacy. Public tracking
                in this preview uses local sample data only. No account or network lookup is used.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="font-label-sm text-label-sm font-mono text-outline">
                SEC-ENC: SHA-256
              </span>
            </div>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}