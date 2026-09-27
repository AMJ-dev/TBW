import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';

const STAGES = [
  {
    num: '01',
    label: 'Step 1',
    phase: 'Transit Phase',
    phaseClass: 'bg-[#FFF5EB] text-[#FF6600]',
    title: 'Coastal Transfer & Gate-In Arrival',
    desc: "Consignments discharge at Lagos ports (Apapa, Tin Can Island) or Onne Port and transition immediately under bonded customs bond escorts directly to TRÏNŪ's flagship inland terminal in the Idu Industrial District, bypassing coastal demurrage clocks.",
    actionTitle: 'Checkpoint & Verification Action',
    action: 'Automated in-motion weighbridge gross axle verification; high-resolution optical inspection of physical shipping line bolts and NCS bonded seals against carrier transfer manifest.',
    actionIcon: 'verified_user',
    metricTitle: 'Live Operational Metric',
    metricStatus: 'Synchronized',
    metrics: [
      { label: 'Inbound Corridors', value: 'Lagos • Onne' },
      { label: 'Demurrage Pause', value: 'Immediate', accent: true },
    ],
    footer: { left: 'Primary Doc:', leftStrong: 'Transire Bond Manifest', right: 'NCS Form C18' },
  },
  {
    num: '02',
    label: 'Step 2',
    phase: 'Digital Ledger',
    phaseClass: 'bg-surface-container-highest text-primary',
    title: 'Manifest Registration & Documentation',
    desc: 'Upon gate entry, the unit\'s bill of lading, manifest serials, and carrier electronic manifests are matched and ingested into the TRÏNŪ Terminal Operating System (TOS) and synchronized with the Nigeria Customs Service ASYCUDA World database.',
    actionTitle: 'Checkpoint & Verification Action',
    action: 'Single Goods Declaration (SGD) reconciliation, Form M validation, and generation of the immutable TRN Unique Consignment Identifier for real-time tracking.',
    actionIcon: 'dataset',
    metricTitle: 'ASYCUDA Node Status',
    metricStatus: 'ASYCUDA ++ Live',
    metrics: null,
    footer: { left: 'Customer Status:', leftStrong: '', right: 'TRN Reference Issued' },
    manifestHash: true,
  },
  {
    num: '03',
    label: 'Step 3',
    phase: 'Physical Operations',
    phaseClass: 'bg-secondary-fixed text-on-secondary-fixed-variant',
    title: 'Receiving, Tally & Staging',
    desc: 'Reach stackers ground the container into the receiving bay. Yard inspectors unlash, record 360-degree high-resolution condition telemetry, and generate the official intake tally under resident NCS surveillance.',
    actionTitle: 'Checkpoint & Verification Action',
    action: 'Issuance of electronic Form TRN-T1 Intake & Tally Certificate with photographic condition evidence logged in the customer dossier.',
    actionIcon: 'assignment_turned_in',
    metricTitle: 'Tally Dossier Artifact',
    metricStatus: 'Form TRN-T1',
    metrics: null,
    footer: { left: 'Discrepancy Protocol:', leftStrong: '', right: 'Discrepancy Note Flagged If ±0.1%' },
    photography: true,
  },
  {
    num: '04',
    label: 'Step 4',
    phase: 'Custody & Security',
    phaseClass: 'bg-[#FFF5EB] text-[#FF6600]',
    title: 'Secure Bonded Storage & Telemetry',
    desc: 'Consignments are slotted into dedicated bonded coordinates across our high-cube container yards, temperature-controlled cold chain lockers, or enclosed high-security vaults. Cargo remains under perpetual fiscal bond.',
    actionTitle: 'Checkpoint & Verification Action',
    action: 'Live telemetry active: coordinates locked in TOS, storage accrual transparently calculated, and 24/7 CCTV thermal perimeter logs available for institutional verification.',
    actionIcon: 'security',
    metricTitle: 'Facility Safeguards',
    metricStatus: 'Bond Covenants Active',
    metrics: [
      { label: 'CCTV Resolution', value: '4K Thermal • 90-Day' },
      { label: 'Storage Visibility', value: 'Live Ledger Portal', accent: true },
    ],
    footer: { left: 'Security Tier:', leftStrong: '', right: 'Class-A Regulated Bond Yard' },
  },
  {
    num: '05',
    label: 'Step 5',
    phase: 'Regulatory Decision Point',
    phaseClass: 'bg-[#350f00] text-primary-fixed',
    title: 'Customs Processing & Joint Examination',
    desc: 'TRÏNŪ coordinates and stages the physical environment: we unstack, position containers at hydraulic ramps, de-stuff when requested, and provide administrative coordination. Nigeria Customs Service Officers conduct the legal physical examination and verify valuation; Customs decides.',
    actionTitle: 'Statutory Checkpoint',
    action: 'Resident NCS Examination Officers, alongside designated Licensed Customs Clearing Agents and regulatory partner bodies (NAFDAC/SON where applicable), inspect physical goods against the SGD.',
    actionIcon: 'policy',
    metricTitle: 'Customs Decisional Node',
    metricStatus: 'NCS Mandate',
    metrics: null,
    footer: { left: 'TRÏNŪ Role:', leftStrong: '', right: 'Facility & Coordination Host' },
    critical: true,
  },
  {
    num: '06',
    label: 'Step 6',
    phase: 'Compliance Dual-Key',
    phaseClass: 'bg-surface-container-highest text-primary',
    title: 'Authorisation & Terminal Release',
    desc: 'Once the statutory Out-of-Charge (OOC) note is electronically issued in the Customs Single Window and TRÏNŪ terminal handling invoices are settled, the system executes an automated cryptographic release.',
    actionTitle: 'Checkpoint & Verification Action',
    action: 'Dual-key electronic verification: Customs Single Window release authorization matched against the TRÏNŪ Terminal Clearance Voucher (TCV).',
    actionIcon: 'key',
    metricTitle: 'Dual-Key Validation',
    metricStatus: 'Electronic Lock Lifted',
    metrics: [
      { label: 'Key 1: NCS Portal', value: 'OOC Authenticated', accent: true },
      { label: 'Key 2: TRÏNŪ Billing', value: 'Discharged (Zero Dues)' },
    ],
    footer: { left: 'Authorization Document:', leftStrong: '', right: 'Electronic TCV Voucher' },
  },
  {
    num: '07',
    label: 'Step 7',
    phase: 'Final Mile Handover',
    phaseClass: 'bg-[#FFF5EB] text-[#FF6600]',
    title: 'Gate-Out & Final Delivery',
    desc: 'The designated haulier presents biometric ID and gate clearance QR credentials at the automated terminal exit barrier. The container departs TRÏNŪ custody directly to the importer\'s Abuja warehouse, commercial store, or northern distribution center.',
    actionTitle: 'Checkpoint & Verification Action',
    action: 'Biometric driver verification, physical container out-gate timestamp, and instant electronic POD dispatched to consignee via SMS, WhatsApp, and email.',
    actionIcon: 'local_shipping',
    metricTitle: 'Gate-Out Telemetry',
    metricStatus: 'Live Exit Portal',
    metrics: null,
    footer: { left: 'Post-Release Support:', leftStrong: '', right: 'Direct Abuja Fleet Despatch' },
    gatePass: true,
    orange: true,
  },
];

const RESP_MATRIX = [
  {
    domain: 'Physical Staging & Cargo Lifting',
    trinu: { primary: true, text: 'Primary Provider', sub: 'Operates reach stackers, ramps, ground storage, and staging cranes.' },
    agent: 'Coordinates haulage booking and destination delivery timing.',
    ncs: 'Directs examination containment and inspection bays.',
  },
  {
    domain: 'Statutory Duty & Valuation',
    trinu: { primary: false, text: 'No legal authority; displays tariff status in customer portal.' },
    agent: { primary: true, text: 'SGD & Form M Filing', sub: 'Prepares declaration, pays assessed duties via commercial banks.' },
    ncs: { primary: true, danger: true, text: 'Sole Statutory Jurisdiction', sub: 'Assesses valuation, issues demand notices, and confirms duty liquidation.' },
  },
  {
    domain: 'Cargo Physical Inspection',
    trinu: { primary: false, text: 'Provides secure bay, de-stuffing crew, safety equipment, and optical tally recording.' },
    agent: 'Licensed broker represents consignee during joint examination opening.',
    ncs: { primary: true, orange: true, text: 'Exclusive Discretion', sub: 'Conducts physical examination; confirms classification and HS codes.' },
  },
  {
    domain: 'Custody & Electronic Telemetry',
    trinu: { primary: true, text: 'Primary Custodian', sub: 'Maintains 24/7 CCTV, TOS tracking, storage safety, and electronic logs.' },
    agent: 'Receives automated telemetry notifications via web portal and SMS.',
    ncs: 'Resident Customs Command audits facility inventory ledger at will.',
  },
  {
    domain: 'Final Release Authorization',
    trinu: { primary: false, text: 'Issues Terminal Clearance Voucher (TCV) once OOC verified & handling settled.' },
    agent: 'Presents signed Delivery Order (DO) and clears terminal dues.',
    ncs: { primary: true, danger: true, text: 'Issues Out-of-Charge (OOC)', sub: 'Sole authority permitting cargo departure from fiscal bonded status.' },
  },
];

const FAQ = [
  { q: 'How do I consign cargo directly to TRÏNŪ Abuja?', a: 'Instruct your international freight forwarder to state "TRÏNŪ Bonded Terminal, Idu Industrial Estate, Abuja (Port Code: NGABJ)" as the final port of delivery on the Master Bill of Lading (MBL) and Form M.' },
  { q: 'Can my existing clearing agent process my release in Abuja?', a: 'Yes. Any licensed customs broker registered with the Nigeria Customs Service FCT Command can attend joint inspection and complete entry declarations right inside our facility.' },
  { q: 'Who determines the customs duties and tariff codes?', a: 'The Nigeria Customs Service possesses sole statutory authority under the NCS Act 2023. TRÏNŪ never levies duty assessments; we host and facilitate the inspection environment.' },
  { q: 'What happens if a container seal is broken in coastal transit?', a: 'At Stage 1 Gate-In, discrepancies trigger an immediate joint Discrepancy Protocol. Resident Customs Officers and terminal security reseal the unit under an official transire exception log.' },
];

export function HowItWorksPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <section className="relative w-full bg-primary text-on-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ff680c_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-xl md:py-28 relative z-10 flex flex-col gap-space-lg">
          <div className="flex flex-wrap items-center gap-space-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#FF6600]/20 text-tertiary-fixed text-label-sm font-label-sm tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-[#FF6600] animate-pulse" />
              Statutory Transit Protocol • NCS Act 2023
            </span>
            <span className="text-primary-fixed-dim text-label-sm font-label-sm uppercase tracking-wider">
              Abuja Idu Industrial District ICD
            </span>
          </div>
          <div className="max-w-4xl flex flex-col gap-space-md">
            <p className="text-tertiary-fixed font-title-sm text-title-sm uppercase tracking-widest">
              The Custody & Regulatory Journey
            </p>
            <h1 className="font-headline-xl text-headline-xl md:text-[54px] text-on-primary leading-tight font-bold tracking-tight">
              How It Works: Seven Stages from Port to Release
            </h1>
            <p className="font-body-lg text-body-lg text-primary-fixed-dim max-w-2xl leading-relaxed">
              A transparent, compliant inland cargo transit protocol designed to eliminate coastal
              maritime congestion, mitigate detention tariffs, and keep Federal Capital Territory
              trade moving at Abuja's pace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
            <a
              href="#stages"
              className="inline-flex items-center justify-center bg-[#FF6600] hover:bg-[#E55C00] text-on-primary px-space-lg py-3 rounded-xl font-title-sm text-title-sm font-semibold transition-all shadow-md gap-2"
            >
              <span>Explore 7-Stage Protocol</span>
              <Icon name="arrow_downward" className="text-[18px]" />
            </a>
            <button
              type="button"
              onClick={() =>
                alert('TRÏNŪ 7-Stage Bonded Transit Specification [PDF, 4.2MB] queued for download.')
              }
              className="inline-flex items-center justify-center bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 text-on-primary px-space-lg py-3 rounded-xl font-title-sm text-title-sm font-medium transition-all gap-2"
            >
              <Icon name="file_download" className="text-[20px] text-tertiary-fixed" />
              <span>Download 7-Stage Process Guide (PDF)</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter pt-space-lg">
            {[
              { label: 'Coastal Corridors', value: 'Apapa • TCIT • Onne' },
              { label: 'Average Transfer Time', value: '48 – 72 Hours', accent: true },
              { label: 'Custody Verification', value: 'SHA-256 Electronic' },
              { label: 'Legal Framework', value: 'NCS Act 2023 Compliant' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-1 p-space-md rounded-xl bg-surface-container-lowest/5">
                <span className="font-label-sm text-label-sm text-primary-fixed-dim uppercase tracking-wider">
                  {s.label}
                </span>
                <span
                  className={`font-headline-sm text-headline-sm font-bold ${
                    s.accent ? 'text-tertiary-fixed' : 'text-on-primary'
                  }`}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statutory Notice */}
      <section className="w-full bg-[#350f00] text-primary-fixed py-space-sm px-margin md:px-margin-md lg:px-margin-lg">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-space-md text-label-sm font-label-sm">
          <div className="flex items-center gap-space-sm">
            <Icon name="gavel" className="text-[18px] text-[#FF6600]" />
            <span className="tracking-wide">
              <strong>STATUTORY NOTICE:</strong> TRÏNŪ Bonded Terminal operates under licensed
              statutory customs custody.{' '}
              <em>
                The terminal facilitates, monitors, and coordinates physical staging; Nigeria
                Customs Service (NCS) alone decides duty classification, inspection findings, and
                official release.
              </em>
            </span>
          </div>
          <span className="hidden lg:inline-block uppercase tracking-widest text-primary-fixed-dim text-[10px]">
            Command: FCT Area Command
          </span>
        </div>
      </section>

      {/* 7 Stage Timeline */}
      <section className="w-full py-space-xl bg-surface-container-lowest" id="stages">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex flex-col gap-space-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs max-w-2xl">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold">
                Sequential Protocol
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
                The End-to-End Inland Lifecycle
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                From the instant maritime seals are cross-verified at coastal off-dock berths to the
                final physical gate-out in Abuja, every container follows a rigid, audited custody
                cycle.
              </p>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-label-sm font-label-sm">
              <span className="px-3 py-1.5 rounded-full bg-primary text-on-primary font-medium">
                All 7 Stages
              </span>
              <span className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant">
                Gate-In (1-3)
              </span>
              <span className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant">
                Custody & NCS (4-5)
              </span>
              <span className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant">
                Release (6-7)
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-space-lg">
            {STAGES.map((s) => (
              <article
                key={s.num}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-space-md p-space-lg rounded-2xl ${
                  s.critical ? 'bg-surface-container shadow-md' : 'bg-surface-container-low shadow-sm'
                } transition-all hover:shadow-md`}
              >
                <div className="lg:col-span-1 flex lg:flex-col items-center justify-between lg:justify-start gap-space-sm">
                  <span
                    className={`w-12 h-12 rounded-xl ${
                      s.orange ? 'bg-[#FF6600] text-on-primary' : s.critical ? 'bg-[#350f00] text-[#FF6600]' : 'bg-primary text-tertiary-fixed'
                    } font-headline-sm text-headline-sm font-bold flex items-center justify-center`}
                  >
                    {s.num}
                  </span>
                  <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                    {s.label}
                  </span>
                </div>
                <div className="lg:col-span-6 flex flex-col gap-space-sm">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-label-sm font-semibold tracking-wide uppercase ${s.phaseClass}`}>
                      {s.phase}
                    </span>
                    <span className="text-body-sm font-body-sm text-on-surface-variant">
                      • Transit Escort Active
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">{s.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    {s.desc}
                  </p>
                  <div className="p-space-sm rounded-xl bg-surface-container flex items-start gap-space-sm mt-space-xs">
                    <Icon name={s.actionIcon} className="text-secondary text-[22px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-title-sm text-title-sm text-primary font-semibold">
                        {s.actionTitle}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {s.action}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-5 flex flex-col justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                      {s.metricTitle}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-label-sm text-secondary font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> {s.metricStatus}
                    </span>
                  </div>
                  {s.metrics && (
                    <div className="grid grid-cols-2 gap-space-sm py-space-xs">
                      {s.metrics.map((m) => (
                        <div key={m.label} className="p-2.5 rounded bg-surface-container-low flex flex-col">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {m.label}
                          </span>
                          <span
                            className={`font-title-md text-title-md font-bold ${
                              m.accent ? 'text-[#FF6600]' : 'text-primary'
                            }`}
                          >
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {s.manifestHash && (
                    <div className="p-space-sm rounded-lg bg-primary text-on-primary flex flex-col gap-1 font-mono text-xs">
                      <div className="flex justify-between text-primary-fixed-dim">
                        <span>TRN-MANIFEST-RECORD</span>
                        <span className="text-[#FF6600]">MATCH_CONFIRMED</span>
                      </div>
                      <p className="text-primary-fixed truncate">
                        SHA-256: e8b94f1c9842a17688cb998f420138d58a
                      </p>
                      <div className="flex justify-between text-[11px] text-primary-fixed-dim pt-1">
                        <span>Declaration: SGD C-88219</span>
                        <span>Command: FCT-01</span>
                      </div>
                    </div>
                  )}
                  {s.photography && (
                    <div className="flex items-center gap-space-sm p-space-sm rounded bg-surface-container-low">
                      <Icon name="photo_camera_back" className="text-[32px] text-primary" />
                      <div className="flex flex-col">
                        <span className="font-title-sm text-title-sm text-primary font-semibold">
                          6-Angle Seal & Shell Photography
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Indexed to Bill of Lading with zero discrepancies
                        </span>
                      </div>
                    </div>
                  )}
                  {s.gatePass && (
                    <div className="p-space-sm rounded bg-surface-container-low flex items-center gap-space-sm">
                      <Icon name="qr_code_scanner" className="text-[#FF6600] text-[28px]" />
                      <div className="flex flex-col">
                        <span className="font-title-sm text-title-sm text-primary font-semibold">
                          Automated Gate Pass Issued
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Instant delivery timestamp • Custody concluded
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                    <span>
                      {s.footer.left} {s.footer.leftStrong && <strong>{s.footer.leftStrong}</strong>}
                    </span>
                    <span className="font-label-sm text-label-sm text-primary font-bold">
                      {s.footer.right}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Tracking Simulator */}
      <section className="w-full py-space-xl bg-surface-container">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="p-space-lg md:p-space-xl rounded-2xl bg-surface-container-lowest shadow-md flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="flex flex-col gap-1 max-w-xl">
                <span className="font-label-sm text-label-sm text-[#FF6600] uppercase tracking-wider font-bold">
                  Interactive Telemetry Test
                </span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  Test the 7-Stage Tracker with a Sample Cargo
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  See how our terminal ledger visualizes real-time bonded cargo movements for
                  registered importers and forwarders.
                </p>
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-surface-container text-primary font-title-sm text-title-sm hover:bg-surface-container-high transition-colors"
                onClick={() => {
                  const el = document.getElementById('tracking-input') as HTMLInputElement | null;
                  if (el) {
                    el.value = 'TRN-ABJ-2026-8841X';
                    el.focus();
                  }
                }}
              >
                Load Sample: TRN-ABJ-2026-8841X
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-space-sm">
              <div className="md:col-span-9 flex items-center bg-surface-container-low rounded-xl px-space-md py-2 shadow-inner">
                <Icon name="search" className="text-outline text-[22px] mr-2" />
                <input
                  id="tracking-input"
                  type="text"
                  defaultValue="TRN-ABJ-2026-8841X"
                  placeholder="Enter Container #, SGD #, or TRN Reference..."
                  className="bg-transparent w-full text-primary font-title-sm text-title-sm focus:outline-none placeholder:text-outline"
                />
              </div>
              <div className="md:col-span-3">
                <button
                  type="button"
                  className="w-full h-full py-3 bg-[#FF6600] hover:bg-[#E55C00] text-on-primary rounded-xl font-title-sm text-title-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Icon name="travel_explore" className="text-[18px]" />
                  <span>Audit Progress</span>
                </button>
              </div>
            </div>
            <div className="p-space-md md:p-space-lg rounded-xl bg-surface-container-low flex flex-col gap-space-md">
              <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-sm border-b border-outline-variant/30">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-primary text-tertiary-fixed flex items-center justify-center">
                    <Icon name="inventory_2" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-primary font-bold">
                      MSKU-9941029 / TRN-ABJ-2026-8841X
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Consignee: Northern Agro-Machinery Distribution Ltd • 1x40ft HC
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-label-sm font-label-sm bg-[#FFF5EB] text-[#FF6600] font-bold">
                  Stage 5 of 7: Joint NCS Examination Pending
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-2 pt-space-xs text-center font-label-sm text-[11px]">
                {[
                  { n: 1, label: 'Coastal Gate-In', state: 'done' },
                  { n: 2, label: 'ASYCUDA Sync', state: 'done' },
                  { n: 3, label: 'T1 Tally Rec', state: 'done' },
                  { n: 4, label: 'Bonded Stored', state: 'done' },
                  { n: 5, label: 'NCS Exam Bay', state: 'active' },
                  { n: 6, label: 'Dual TCV Release', state: 'pending' },
                  { n: 7, label: 'Final Gate-Out', state: 'pending' },
                ].map((s) => (
                  <div
                    key={s.n}
                    className={`p-2 rounded ${
                      s.state === 'active'
                        ? 'bg-[#350f00] text-primary-fixed font-bold shadow-sm'
                        : s.state === 'done'
                        ? 'bg-surface-container-lowest text-primary font-medium'
                        : 'bg-surface-container text-on-surface-variant/60 font-medium'
                    }`}
                  >
                    <span className={`block ${s.state === 'active' ? 'text-[#FF6600]' : 'text-secondary'} font-bold`}>
                      Stage {s.n}
                    </span>
                    <span>{s.label}</span>
                    <Icon
                      name={
                        s.state === 'done'
                          ? 'check_circle'
                          : s.state === 'active'
                          ? 'radio_button_checked'
                          : 'schedule'
                      }
                      className={`text-[16px] mt-1 ${
                        s.state === 'done' ? 'text-secondary' : s.state === 'active' ? 'text-[#FF6600] animate-pulse' : ''
                      }`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-2">
                <span>
                  Current Coordinate: <strong>Zone C, Bay 14-B (Abuja Flagship ICD)</strong>
                </span>
                <span>
                  Inspection Slated: <strong>Tomorrow, 10:30 AM (NCS Resident Team)</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles & Responsibilities Matrix */}
      <section className="w-full py-space-xl bg-surface-container-lowest">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex flex-col gap-space-xl">
          <div className="flex flex-col gap-space-xs max-w-3xl">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold">
              Institutional Governance
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
              Roles & Responsibilities Matrix
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Operational success in bonded logistics relies on strict procedural separation between
              facility coordination, commercial agency, and sovereign Customs authority.
            </p>
          </div>
          <div className="w-full overflow-x-auto rounded-2xl shadow-sm bg-surface-container-low">
            <table className="w-full text-left font-body-md text-body-md">
              <thead className="bg-primary text-on-primary font-title-sm text-title-sm uppercase tracking-wider">
                <tr>
                  <th className="py-space-md px-space-lg w-1/4">Operational Domain</th>
                  <th className="py-space-md px-space-lg w-1/4 bg-[#571e00] text-primary-fixed">
                    TRÏNŪ Bonded Terminal
                  </th>
                  <th className="py-space-md px-space-lg w-1/4">Licensed Agent / Importer</th>
                  <th className="py-space-md px-space-lg w-1/4 bg-[#2a1709] text-[#FF6600]">
                    Nigeria Customs Service
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 bg-surface-container-lowest text-on-surface">
                {RESP_MATRIX.map((row) => (
                  <tr key={row.domain} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-space-md px-space-lg font-title-sm text-title-sm text-primary">
                      {row.domain}
                    </td>
                    <td className="py-space-md px-space-lg bg-surface-container-low/30 font-medium text-primary">
                      {typeof row.trinu === 'object' ? (
                        <>
                          <div className="flex items-center gap-1.5 text-secondary">
                            <Icon name="check_circle" className="text-[20px]" />
                            <span>{row.trinu.text}</span>
                          </div>
                          {row.trinu.sub && (
                            <span className="block text-body-sm text-on-surface-variant mt-1">
                              {row.trinu.sub}
                            </span>
                          )}
                        </>
                      ) : null}
                    </td>
                    <td className="py-space-md px-space-lg text-on-surface-variant text-body-sm">
                      {typeof row.agent === 'object' ? (
                        <>
                          <div className="flex items-center gap-1.5 text-primary font-semibold">
                            <Icon name="upload_file" className="text-[20px] text-secondary" />
                            <span>{row.agent.text}</span>
                          </div>
                          {row.agent.sub && <span className="block mt-1">{row.agent.sub}</span>}
                        </>
                      ) : (
                        row.agent
                      )}
                    </td>
                    <td className="py-space-md px-space-lg bg-[#350f00]/5 font-semibold text-primary text-body-sm">
                      {typeof row.ncs === 'object' ? (
                        <>
                          <div className={`flex items-center gap-1.5 ${row.ncs.danger ? 'text-[#B44D2F]' : row.ncs.orange ? 'text-[#FF6600]' : 'text-secondary'}`}>
                            <Icon name="verified" className="text-[20px]" />
                            <span>{row.ncs.text}</span>
                          </div>
                          {row.ncs.sub && <span className="block mt-1">{row.ncs.sub}</span>}
                        </>
                      ) : (
                        row.ncs
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md p-space-lg rounded-2xl bg-surface-container-low">
            {[
              { icon: 'verified', text: '100% Audit Readiness', sub: 'Every gate movement, container movement, and inspection action is timestamped in accordance with statutory requirements.', color: 'text-secondary' },
              { icon: 'bolt', text: 'Zero Port Demurrage', sub: 'Transferring to TRÏNŪ Abuja pauses maritime port storage clocks immediately upon bonded coastal discharge.', color: 'text-[#FF6600]' },
              { icon: 'shield', text: 'Facility Security Bond', sub: 'Our terminal maintains an institutional statutory bond covenant lodged with the Nigeria Customs Service.', color: 'text-primary' },
            ].map((t) => (
              <div key={t.text} className="flex items-start gap-space-sm">
                <Icon name={t.icon} className={`${t.color} text-[28px]`} />
                <div className="flex flex-col">
                  <h4 className="font-title-sm text-title-sm text-primary font-bold">{t.text}</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{t.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full py-space-xl bg-surface-container">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex flex-col gap-space-lg">
          <div className="flex flex-col gap-space-xs max-w-2xl">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold">
              Answers for Shippers
            </span>
            <h2 className="font-headline-md text-headline-md text-primary font-bold">
              Frequently Asked Regulatory Questions
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            {FAQ.map((f) => (
              <div
                key={f.q}
                className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-2"
              >
                <h4 className="font-title-sm text-title-sm text-primary font-bold flex items-center gap-2">
                  <Icon name="help" className="text-[#FF6600] text-[20px]" />
                  {f.q}
                </h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full bg-[#422B1C] text-on-primary py-space-xl relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg relative z-10 flex flex-col lg:flex-row items-center justify-between gap-space-xl">
          <div className="flex flex-col gap-space-sm max-w-2xl">
            <span className="font-label-sm text-label-sm text-[#FF6600] font-bold uppercase tracking-widest">
              Initiate Bonded Transfer
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-primary font-bold tracking-tight">
              Have Cargo En Route to Nigerian Waters?
            </h2>
            <p className="font-body-md text-body-md text-primary-fixed-dim leading-relaxed">
              Divert your consignments directly to our Abuja ICD before vessel arrival. Stop
              coastal shipping line demurrage, secure your audit trail, and inspect your goods in
              the Federal Capital Territory.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-space-md w-full lg:w-auto">
            <Link
              to="/request-a-quote"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-[#FF6600] hover:bg-[#E55C00] text-on-primary px-space-lg py-4 rounded-xl font-title-sm text-title-sm font-semibold transition-all shadow-lg whitespace-nowrap"
            >
              Speak with Clearance Coordination
            </Link>
            <Link
              to="/services"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-transparent hover:bg-surface-container-lowest/10 text-primary-fixed px-space-lg py-4 rounded-xl font-title-sm text-title-sm font-semibold transition-all whitespace-nowrap border-2 border-primary-fixed/30 hover:border-primary-fixed"
            >
              Request Tariff Schedule
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}