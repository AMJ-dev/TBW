import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

const FACILITIES = [
  { label: '01 / Command Office', icon: 'apartment', title: 'Dedicated Resident Command Offices', desc: 'Fully furnished, secure administrative suites on-site exclusively for the Nigeria Customs Service command staff and inspection teams. Includes independent air-gapped terminal rooms, private briefing lounges, and dedicated sanitised document holding cabinets.', badge: 'Restricted biometric access zone', badgeIcon: 'lock', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA36alHZLSmkBLUlA9koBkcRK7Sr2QyAedutwjZRsGMzIgkqMEnKnbktjdpqcKzF_ZxXPU0VMgTbtsxypmTgFzbv-hhMXP4R1XoAyl1-aU0knZs6h8gH6-yuaIE-EqYYnTx0PBe4Y0a4jsSFIFVD3VKY73F3X4BD1nzOW54iOGgzWu2jKmeqIfinzOC_C7p84aCQqRWAbyjmLE8Q6xBfSY4ueicecM-lSCWxAVE8F0W7Lvz24UdYQ' },
  { label: '02 / Examination Deck', icon: 'forklift', title: 'Heavy-Duty Joint Examination Bays', desc: 'High-capacity, weather-sheltered inspection bays equipped with 360° tamper-evident CCTV surveillance, certified digital weighbridges, and secure physical examination tables. We provide the facilities and logistical coordination for Customs examination without delay.', badge: 'Tamper-evident continuous recording (365d retention)', badgeIcon: 'videocam', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1rsxt53TWbPXBNqJ8ByzGG1Kp_rTGffSQOEkFT6vvRvdIzlapaT4Yh0bfqU0E2T_DqfcUMH9IdeVPvAXelL7czF4YwQjODXKbtsJMIoyYCJV_j3xQO1XGs3GM3WmjCPmsBvcK_ijLo92e_rMyuzTjxJ3ImM3CuFfkgGb5KqULT7pqUF8wDFppyg4dIpc531fs-EmgLxO3TgIvIwckaDkDjZFNZ2I8Mg68vMzagAoGVuALyd-mJg' },
  { label: '03 / Quarantine Enclosure', icon: 'key', title: 'Customs Seizure & Disputed Cargo Vault', desc: 'Dedicated high-security impound zone under exclusive Customs lock and key for pending investigations, forensic audits, or legal disputes. Complete physical severance from commercial throughput, ensuring irrevocable integrity for regulatory evidence.', badge: 'Exclusive NCS Sovereign Key Custody', badgeIcon: 'verified', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_rQKZPxsuevLCywiVvhxzC9G3yRdnBbbH1zKjqlKDv3KW4-u0E7tm4w-Aihdph62m3o1eQ6N4Hu1aWemmsKG5GXxFpCTzeSXFLh2hqncyuQsp9ljU97U4pAwm3_qtGHC4kft16pyfhOL7aqjBgYVv-_mRIjYtdBgvN4flJ8yaaPN0RTDQFdDUjms2pjiTrWOxnA1EdYITugtMMGj78USlGkBL5_7rpBsb02aOlbgJnZ1vNX_5mg' },
];

export function RegulatoryPage() {
  const [hashInput, setHashInput] = useState('');
  const [verificationMessage, setVerificationMessage] = useState(
    'TRN-T1-2026-DEMO: Verified by NCS Resident Officer on record. Dual-Key Escrow Armed.'
  );

  const simulateVerification = () => {
    if (!hashInput) {
      setVerificationMessage(
        'Please input reference number. Provide a TRN-T1 identifier or cryptographic hash to execute registry audit.'
      );
      return;
    }
    setVerificationMessage(
      `Ref: ${hashInput.toUpperCase().trim()} — NCS BOND CODE: VALID · DUAL-KEY ESCROW: ACTIVE`
    );
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      'Official regulatory dispatch received. Muktar Mahdi (Compliance & Brand Liaison) will contact your agency within the formal 24-hour statutory response SLA.'
    );
  };

  return (
    <div className="flex flex-col w-full">
      {/* Registry Strip */}
      <section className="w-full bg-primary-container text-on-primary">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-xs font-label-sm text-label-sm uppercase tracking-widest text-outline-variant">
          <div className="flex items-center gap-space-sm flex-wrap">
            <span className="inline-flex items-center gap-1 text-secondary-container">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
              OFFICIAL REGULATORY PORTAL
            </span>
            <span className="hidden md:inline">|</span>
            <span className="text-inverse-primary">
              NCS BOND UNDERTAKING REGISTRY ID: TRN-NCZ-ABJ-026
            </span>
          </div>
          <div className="flex items-center gap-space-md text-[11px] text-inverse-primary">
            <span>STATUTORY CO-LOCATION: ABUJA FLAGSHIP</span>
            <span className="text-secondary-fixed">LAUNCH DATE: 28 SEPT 2026</span>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="relative w-full bg-primary text-on-primary overflow-hidden">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern height="48" id="grid-pattern" patternUnits="userSpaceOnUse" width="48">
                <path d="M 48 0 L 0 0 0 48" fill="none" opacity="0.3" stroke="#ffdbc7" strokeWidth="0.75" />
              </pattern>
            </defs>
            <rect fill="url(#grid-pattern)" height="100%" width="100%" />
          </svg>
        </div>
        <div className="relative max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-xl lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
            <div className="lg:col-span-8 flex flex-col gap-space-md">
              <div className="inline-flex items-center gap-space-xs bg-primary-container text-primary-fixed px-space-sm py-1 rounded w-fit font-label-sm text-label-sm uppercase tracking-widest">
                <Icon name="gavel" className="text-[16px] text-secondary-container" />
                <span>STATUTORY CO-LOCATION · NIGERIA CUSTOMS SERVICE ACT 2023</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-primary leading-tight">
                Institutional Precision. Complete Transparency. Uncompromised Custody.
              </h1>
              <p className="font-body-lg text-body-lg text-inverse-primary max-w-3xl leading-relaxed">
                TRÏNŪ's Abuja flagship facility provides purpose-built, secure infrastructure and
                co-located administrative offices designed to support the regulatory oversight of
                the Nigeria Customs Service and relevant federal authorities.
              </p>
              <div className="bg-surface-container-highest/10 backdrop-blur rounded p-space-md max-w-3xl">
                <div className="flex items-start gap-space-sm">
                  <Icon name="verified_user" className="text-secondary-container text-xl mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="font-title-sm text-title-sm text-primary-fixed uppercase tracking-wider">
                      Strategic Deference Guarantee
                    </span>
                    <p className="font-body-sm text-body-sm text-inverse-primary italic">
                      "The platform facilitates and coordinates; Customs decides." All bonded
                      operations operate strictly within the facility's licensed bond undertakings
                      under the Nigeria Customs Service Act 2023.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
                <a
                  href="#regulatory-desk"
                  className="inline-flex items-center justify-center gap-space-xs bg-secondary hover:bg-secondary-container text-on-secondary px-space-lg py-space-md rounded font-title-sm text-title-sm shadow-md transition-all"
                >
                  <Icon name="admin_panel_settings" className="text-[18px]" />
                  <span>Regulatory Access Portal</span>
                </a>
                <a
                  href="#compliance-spec"
                  className="inline-flex items-center justify-center gap-space-xs bg-primary-container hover:bg-surface-container-highest/20 text-on-primary px-space-lg py-space-md rounded font-title-sm text-title-sm transition-all shadow-sm"
                >
                  <Icon name="download_for_offline" className="text-[18px]" />
                  <span>Download Compliance Dossier</span>
                </a>
              </div>
              <div className="pt-space-md grid grid-cols-1 sm:grid-cols-3 gap-space-sm max-w-3xl">
                {[
                  { icon: 'shield', title: 'NCS Act 2023', sub: 'Compliant Bond Undertaking' },
                  { icon: 'encrypted', title: 'NDPA 2023 Verified', sub: 'Audited Data Governance' },
                  { icon: 'vpn_key', title: 'Dual-Key Escrow', sub: 'Full Customs Release Gate' },
                ].map((b) => (
                  <div
                    key={b.title}
                    className="bg-surface-container-lowest/5 rounded p-space-sm flex items-center gap-space-sm"
                  >
                    <Icon name={b.icon} className="text-secondary-container text-xl" />
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-primary">{b.title}</span>
                      <span className="font-body-sm text-[11px] text-inverse-primary">{b.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-space-md">
              <div className="bg-primary-container rounded shadow-xl overflow-hidden">
                <img
                  className="w-full h-72 object-cover"
                  alt="TRINU bonded warehouse facility"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_brTNWpTy_PywzfGNolEUwQvWXG2m2F5hN1MZ9mev-cozCI9VvME5h3nhOzrqTxDKAedm1YZ8uqFhOsZX0JwQsvhiOQVq4lFkBlNm9IfOuiMqBZ70H7ZkHfs7dV0fm2COHPkJtqukLIbXCM3jwSOwzQgh5Op3HYeNJdWpw5TnNNnLpVO4se3c3loDKGwGKblr1s1QA1sY9MzvhQ9T7nvdzNifJKJKZjleyG6HiW0Hhp2NyRQTcw"
                />
                <div className="p-space-md flex flex-col gap-space-xs bg-primary-container">
                  <div className="flex items-center justify-between text-outline-variant font-label-sm text-label-sm">
                    <span>FACILITY SPECIFICATION</span>
                    <span className="text-secondary-fixed">ABUJA FEDERAL CAPITAL</span>
                  </div>
                  <p className="font-title-sm text-title-sm text-on-primary font-semibold">
                    Sovereign Customs Command Pavilion & Heavy Examination Yard
                  </p>
                  <div className="flex items-center gap-2 pt-2 text-inverse-primary text-[12px]">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span>Operational Status: Statutory Deployment Phase</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low rounded p-space-md text-on-surface shadow-sm">
                <div className="flex items-center justify-between pb-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Gateway Status · Demo
                  </span>
                  <span className="font-title-sm text-title-sm text-secondary font-bold">
                    Preview
                  </span>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                  <div className="bg-secondary h-1.5 rounded-full" style={{ width: '94%' }} />
                </div>
                <span className="font-body-sm text-[11px] text-on-surface-variant block mt-1.5">
                  This sample panel is illustrative only; no Customs gateway is connected.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Posture Bar */}
      <section className="w-full bg-surface-container-high py-space-sm">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex flex-wrap items-center justify-between gap-space-sm text-on-surface-variant font-label-sm text-label-sm">
          <div className="flex items-center gap-space-md">
            <span className="bg-surface-variant text-on-surface px-2 py-0.5 rounded font-bold">
              OPERATIONAL POSTURE
            </span>
            <span className="tracking-widest uppercase">FORMAL · DEFERENTIAL · PRECISE</span>
          </div>
          <div className="flex items-center gap-space-lg italic">
            <span>"Secure. Compliant. Closer."</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline font-sans not-italic">
              NCS Resident Command Coordination Facility
            </span>
          </div>
        </div>
      </section>

      {/* Institutional Architecture */}
      <section className="w-full py-space-xl lg:py-24 bg-surface">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
            <div className="flex flex-col gap-space-xs max-w-2xl">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                Physical Safeguards
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary">
                Institutional Architecture & Dedicated Regulatory Facilities
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Engineered expressly for the Nigeria Customs Service and allied enforcement
                agencies to execute comprehensive inspections with zero friction, utmost physical
                security, and absolute chain-of-custody preservation.
              </p>
            </div>
            <div className="bg-surface-container px-space-md py-space-sm rounded">
              <span className="font-label-sm text-label-sm text-on-surface uppercase">
                Direct Customs Authority: Absolute Oversight
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-lg">
            {FACILITIES.map((f) => (
              <div
                key={f.title}
                className="bg-surface-container-lowest rounded shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
              >
                <img className="w-full h-52 object-cover" alt={f.title} src={f.img} />
                <div className="p-space-lg flex flex-col flex-grow justify-between gap-space-md">
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-bold">
                        {f.label}
                      </span>
                      <Icon name={f.icon} className="text-outline" />
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary">{f.title}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                  <div className="bg-surface-container-low p-space-sm rounded text-[12px] text-on-surface font-title-sm flex items-center gap-space-xs">
                    <Icon name={f.badgeIcon} className="text-secondary text-sm" />
                    <span>{f.badge}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Digital Architecture */}
      <section className="w-full py-space-xl lg:py-24 bg-surface-container-low" id="compliance-spec">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="flex flex-col gap-space-xs mb-space-xl">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
              Interoperability & Data Rigor
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary">
              Regulatory Digital Architecture & ASYCUDA Synchronisation
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              Digital systems built in explicit compliance with the Nigeria Customs Service
              modernization parameters. Real-time telemetry, cryptographic validation, and rigorous
              privacy standards ensure complete statutory visibility.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter-lg">
            <div className="bg-surface-container-lowest p-space-lg rounded shadow-sm flex flex-col justify-between">
              <div className="flex flex-col gap-space-md">
                <div className="w-12 h-12 rounded bg-surface-container flex items-center justify-center text-secondary">
                  <Icon name="sync_alt" className="text-2xl" />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-secondary uppercase">
                    Telemetry Protocol
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    Real-Time ASYCUDA Integration
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Direct manifest reconciliation, electronic tally synchronisation, and automated
                    gate-in / gate-out telemetry mapped directly to the NCS Single Window platform.
                    Reduces administrative discrepancy windows to sub-second records.
                  </p>
                </div>
              </div>
              <div className="mt-space-md p-space-md bg-surface-container rounded font-mono text-[11px] text-on-surface flex flex-col gap-1.5">
                <div className="flex justify-between text-on-surface-variant pb-1">
                  <span>INTEGRATION PREVIEW · DISCONNECTED</span>
                  <span className="text-secondary font-bold">STATUS 200 OK</span>
                </div>
                <div className="text-outline">
                  PAYLOAD: {'{ terminalId: "TRN-ABJ-01", ncsDeclarationRef: "NCS-2026-X889", status: "VERIFIED" }'}
                </div>
                <div className="text-[10px] text-on-surface-variant">
                  Gate-In / Out Manifest Sync Rate: 99.98% Guaranteed Uptime
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded shadow-sm flex flex-col justify-between">
              <div className="flex flex-col gap-space-md">
                <div className="w-12 h-12 rounded bg-surface-container flex items-center justify-center text-secondary">
                  <Icon name="fingerprint" className="text-2xl" />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-secondary uppercase">
                    Chain-of-Custody
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    Tamper-Evident Ledger & Cryptographic Sealing
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Every terminal record—including Intake & Tally Form TRN-T1, Joint Inspection
                    Tally, and Exit Release Clearance—is stamped with SHA-256 cryptographic hashes
                    for instantaneous, immutable zero-trust verification by resident officers.
                  </p>
                </div>
              </div>
              <div className="mt-space-md p-space-md bg-surface-container rounded font-mono text-[11px] text-on-surface flex flex-col gap-1">
                <div className="text-[10px] text-secondary font-bold uppercase tracking-wider">
                  Document Integrity Fingerprint (TRN-T1 Standard)
                </div>
                <div className="truncate text-on-surface-variant">
                  0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                </div>
                <div className="flex items-center gap-1 text-[10px] text-secondary mt-1">
                  <Icon name="verified" className="text-[14px]" />
                  <span>Hardware Security Module Signed · Non-Repudiable</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded shadow-sm flex flex-col justify-between">
              <div className="flex flex-col gap-space-md">
                <div className="w-12 h-12 rounded bg-surface-container flex items-center justify-center text-secondary">
                  <Icon name="privacy_tip" className="text-2xl" />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-secondary uppercase">
                    Information Security
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    Strict Data Minimisation & NDPA 2023 Alignment
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Public cargo queries are rate-limited and sanitize commercially sensitive
                    data—such as supplier invoice totals, proprietary values, and confidential
                    pricing. Complete statutory 72-hour breach response SLA and NDPA audited
                    infrastructure.
                  </p>
                </div>
              </div>
              <div className="mt-space-md grid grid-cols-2 gap-space-sm">
                <div className="bg-surface-container p-space-sm rounded">
                  <span className="block text-primary font-bold text-title-sm">72-Hour</span>
                  <span className="text-[11px] text-on-surface-variant">
                    Breach Notification SLA
                  </span>
                </div>
                <div className="bg-surface-container p-space-sm rounded">
                  <span className="block text-primary font-bold text-title-sm">Zero Invoice</span>
                  <span className="text-[11px] text-on-surface-variant">Public Field Exposure</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded shadow-sm flex flex-col justify-between">
              <div className="flex flex-col gap-space-md">
                <div className="w-12 h-12 rounded bg-surface-container flex items-center justify-center text-secondary">
                  <Icon name="lock_open" className="text-2xl" />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-secondary uppercase">
                    Terminal Release Gate
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    Dual-Key Authorized Release Protocols
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    We release cargo once Customs authorisation and all terminal obligations are
                    satisfied. Physical and automated boom-gates remain locked until both the
                    electronic Out-of-Charge note from NCS and TRÏNŪ settlement clearance reconcile
                    concurrently.
                  </p>
                </div>
              </div>
              <div className="mt-space-md flex items-center justify-between bg-surface-container p-space-sm rounded text-[11px]">
                <div className="flex items-center gap-1 font-bold text-primary">
                  <Icon name="key" className="text-[16px] text-secondary" />
                  <span>1. NCS Out-of-Charge</span>
                </div>
                <Icon name="add" className="text-outline" />
                <div className="flex items-center gap-1 font-bold text-primary">
                  <Icon name="domain_verification" className="text-[16px] text-secondary" />
                  <span>2. Terminal Settlement</span>
                </div>
                <Icon name="arrow_forward" className="text-outline" />
                <span className="bg-primary text-on-primary px-2 py-0.5 rounded font-label-sm text-[10px]">
                  AUTHORIZED RELEASE
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corridor Alignment */}
      <section className="w-full py-space-xl lg:py-24 bg-surface text-on-surface">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
            <div className="lg:col-span-5 flex flex-col gap-space-md">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                National Trade Strategy
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary">
                Strategic Alignment with Federal Decongestion Mandates
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                By shifting customs inspection, dry storage, and clearance activities directly
                inland to Abuja, TRÏNŪ serves as a critical sovereign economic release valve,
                alleviating congestion at critical seaports and unlocking trade fluidness for
                Northern Nigeria.
              </p>
              <div className="flex flex-col gap-space-md pt-space-sm">
                {[
                  { t: 'Coastal Port Decongestion', d: 'Relieving acute holding bottlenecks at Apapa, Tin Can Island, and Onne Ports via bonded corridor intermodal transit straight to Abuja.' },
                  { t: 'Hinterland Trade Velocity', d: 'Accelerating cargo turnaround times for Abuja, Kaduna, Kano, and adjoining northern regional commerce hubs by cutting container dwell times.' },
                  { t: 'Statutory Revenue Integrity', d: 'Enhancing statutory revenue collection transparency through unalterable electronic tally ledgers and comprehensive payment facilitation.' },
                ].map((item, i) => (
                  <div key={item.t} className="flex items-start gap-space-sm">
                    <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center flex-shrink-0 text-on-secondary-fixed font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-title-sm text-title-sm text-primary">{item.t}</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="bg-surface-container p-space-lg rounded shadow-sm flex flex-col gap-space-md">
                <div className="flex items-center justify-between pb-space-sm">
                  <div className="flex flex-col">
                    <span className="font-title-sm text-title-sm text-primary font-bold">
                      Federal Inland Corridor Mapping
                    </span>
                    <span className="font-body-sm text-[12px] text-on-surface-variant">
                      Bonded Transshipment from Coastal Ports to Abuja Hub
                    </span>
                  </div>
                  <span className="bg-surface-container-highest px-space-sm py-1 rounded text-on-surface font-label-sm text-label-sm">
                    NCS SEALED CONVOY
                  </span>
                </div>
                <div className="relative bg-surface-container-lowest rounded p-space-md overflow-hidden">
                  <svg className="w-full h-64" fill="none" viewBox="0 0 600 240" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 80 180 C 180 180, 240 100, 380 90" stroke="#d3c3bb" strokeDasharray="6 6" strokeWidth="4" />
                    <path d="M 120 200 C 220 200, 280 110, 380 90" stroke="#a13f22" strokeWidth="3" />
                    <path d="M 380 90 L 520 40" stroke="#a13f22" strokeDasharray="4 4" strokeWidth="2" />
                    <circle cx="80" cy="180" fill="#422b1c" r="7" />
                    <text fill="#422b1c" fontFamily="Work Sans" fontSize="11" fontWeight="600" x="50" y="210">Apapa / Tin Can</text>
                    <text fill="#81756e" fontFamily="Work Sans" fontSize="9" x="50" y="222">Maritime Entry</text>
                    <circle cx="120" cy="200" fill="#422b1c" r="7" />
                    <text fill="#422b1c" fontFamily="Work Sans" fontSize="11" fontWeight="600" x="135" y="210">Onne Port</text>
                    <circle cx="380" cy="90" fill="#a13f22" r="11" stroke="#ffdbd1" strokeWidth="4" />
                    <text fill="#2a1709" fontFamily="Work Sans" fontSize="13" fontWeight="700" x="350" y="65">TRÏNŪ ABUJA HUB</text>
                    <text fill="#a13f22" fontFamily="Work Sans" fontSize="10" fontWeight="600" x="350" y="78">Inland Regulatory Flagship</text>
                    <circle cx="520" cy="40" fill="#81756e" r="6" />
                    <text fill="#422b1c" fontFamily="Work Sans" fontSize="11" fontWeight="600" x="505" y="30">Kano / North Hub</text>
                    <rect fill="#f2f3fb" height="26" rx="4" stroke="#e0e2e9" width="130" x="210" y="125" />
                    <text fill="#2a1709" fontFamily="Work Sans" fontSize="9" fontWeight="600" x="218" y="142">NCS Electronic Seal (E-Seal)</text>
                  </svg>
                </div>
                <div className="grid grid-cols-3 gap-space-sm pt-space-xs text-center">
                  {[
                    ['68%', 'Port dwell-time reduction'],
                    ['100%', 'Electronic seal compliance'],
                    ['Zero', 'Custody reconciliation loss'],
                  ].map(([v, l]) => (
                    <div key={l} className="bg-surface-container-lowest p-space-sm rounded">
                      <span className="block font-headline-sm text-headline-sm text-primary">{v}</span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="w-full py-space-xl lg:py-24 bg-primary-container text-on-primary relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="bg-primary/60 rounded p-space-lg lg:p-space-xl flex flex-col md:flex-row gap-space-xl items-center shadow-lg">
            <div className="w-36 h-36 lg:w-44 lg:h-44 rounded-full overflow-hidden flex-shrink-0 bg-surface-container-high shadow-md">
              <img
                className="w-full h-full object-cover"
                alt="Bilal Aijjola"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFD9gX8c_cczJhZ70qdYKzKOiZmDEtHyNbjhz4481c3cMjUW4ydvIUUQZOo6w3AspGAvnG_MPJNdhe4iys221XBXTgv-p-Fry-DBKgEFFFDPsCLmTpojfV-5o91MlwW19CiElz9QDFmVRT_CRK1bpPiA17bHtZehUEKi5pc35mJf2Xwzx5Iql9-Js4xFm9Q9Cxqo-V0qIVp3pnn_Vlt0dMyApJ8yCGZB_YcVrfKlqsCFVKM5wbgg"
              />
            </div>
            <div className="flex flex-col gap-space-md">
              <Icon name="format_quote" className="text-secondary-container text-4xl" />
              <blockquote className="font-headline-md text-headline-md text-primary-fixed italic font-normal leading-relaxed">
                "Our vision is straightforward: make TRÏNŪ the leading inland bonded logistics hub
                for Abuja and Northern Nigeria. This facility is the first step, a secure,
                Customs-approved gateway that changes how this region moves goods."
              </blockquote>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs pt-space-xs">
                <div className="flex flex-col">
                  <span className="font-title-lg text-title-lg text-on-primary font-bold">
                    Bilal Aijjola
                  </span>
                  <span className="font-body-sm text-body-sm text-inverse-primary">
                    Chief Executive Officer / Managing Director
                  </span>
                  <span className="font-label-sm text-[11px] text-outline-variant uppercase">
                    TRÏNŪ Bonded Warehouse
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 bg-surface-container-lowest/10 px-space-md py-1.5 rounded">
                  <Icon name="handshake" className="text-secondary-container text-sm" />
                  <span className="font-label-sm text-[11px] text-primary-fixed uppercase tracking-wider">
                    Statutory Commitment
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Authenticator */}
      <section className="w-full py-space-xl bg-surface-container">
        <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="bg-surface-container-lowest rounded p-space-lg lg:p-space-xl shadow-sm flex flex-col gap-space-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm">
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase font-bold">
                  Officer Direct Verification
                </span>
                <h3 className="font-headline-md text-headline-md text-primary">
                  Cryptographic Document Check
                </h3>
              </div>
              <span className="text-on-surface-variant font-label-sm text-label-sm">
                ZERO-TRUST AUDIT INTERFACE
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
              <div className="lg:col-span-2 flex flex-col gap-space-sm">
                <label className="font-label-md text-label-md text-primary uppercase">
                  Enter Document Hash or TRN Tally Reference
                </label>
                <div className="flex flex-col sm:flex-row gap-space-sm">
                  <input
                    type="text"
                    value={hashInput}
                    onChange={(e) => setHashInput(e.target.value)}
                    placeholder="e.g. TRN-T1-2026-ABJ-00924 or SHA-256 string"
                    className="w-full bg-surface-container-lowest text-on-surface px-space-md py-space-sm rounded font-mono text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={simulateVerification}
                    className="bg-primary hover:bg-primary-container text-on-primary font-title-sm text-title-sm px-space-lg py-space-sm rounded transition-colors flex-shrink-0 flex items-center justify-center gap-2"
                  >
                    <Icon name="search_check" className="text-sm" />
                    <span>Verify Record</span>
                  </button>
                </div>
                <p className="font-body-sm text-[12px] text-on-surface-variant">
                  Officers can immediately cross-reference TRN-T1 intake Tallies, customs release
                  locks, and container tare weights.
                </p>
              </div>
              <div
                className="bg-surface-container-low p-space-md rounded flex flex-col justify-center"
                id="verificationResult"
              >
                <div className="flex items-center gap-2 text-on-surface font-title-sm">
                  <Icon name="verified_user" className="text-secondary" />
                  <span>Sample Record Active</span>
                </div>
                <p className="font-mono text-[11px] text-on-surface-variant mt-1">
                  {verificationMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Desk */}
      <section className="w-full py-space-xl lg:py-24 bg-surface text-on-surface" id="regulatory-desk">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">
            <div className="lg:col-span-6 flex flex-col gap-space-md">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                Resident Liaison Infrastructure
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary">
                Regulatory Compliance Desk & Liaison Channel
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                The dedicated regulatory interface serves the Nigeria Customs Service, Port Health,
                NDLEA, NAFDAC, and SON leadership for protocol coordination, audit scheduling, and
                operational synchronization.
              </p>
              <div className="bg-surface-container-low rounded p-space-lg flex flex-col gap-space-md shadow-sm">
                <div className="flex items-start gap-space-md">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary flex-shrink-0">
                    <Icon name="badge" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary uppercase font-bold">
                      Principal Point of Contact
                    </span>
                    <span className="font-title-lg text-title-lg text-primary font-bold">
                      Muktar Mahdi
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Compliance & Brand Liaison, TRÏNŪ
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-space-xs font-body-sm">
                  <div className="flex items-center gap-space-xs text-on-surface">
                    <Icon name="call" className="text-secondary text-[18px]" />
                    <span className="font-mono font-semibold">09012494493</span>
                  </div>
                  <div className="flex items-center gap-space-xs text-on-surface">
                    <Icon name="mail" className="text-secondary text-[18px]" />
                    <span className="font-mono text-sm">mukkysmahdi@gmail.com</span>
                  </div>
                </div>
                <div className="pt-space-xs text-[12px] text-on-surface-variant flex flex-col gap-1">
                  <span className="font-semibold text-primary">Physical Facility Address:</span>
                  <span>TRÏNŪ Bonded Warehouse, Abuja Flagship Facility, Nigeria</span>
                  <span className="text-secondary font-semibold mt-1">
                    Official Statutory Inaugural Launch: 28 September 2026
                  </span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="bg-surface-container-lowest p-space-lg lg:p-space-xl rounded shadow-md flex flex-col gap-space-md">
                <div className="flex items-center justify-between pb-space-xs">
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    Agency Inquiry & Protocol Request
                  </h3>
                  <span className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                    OFFICIAL USE ONLY
                  </span>
                </div>
                <form className="flex flex-col gap-space-sm" onSubmit={handleInquirySubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                    <div className="flex flex-col gap-1">
                      <label className="font-label-md text-label-md text-primary">Official Name</label>
                      <input
                        required
                        type="text"
                        placeholder="Officer / Inspector Name"
                        className="bg-surface-container-lowest text-on-surface px-space-md py-space-sm rounded font-body-md text-sm shadow-sm focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-md text-label-md text-primary">
                        Regulatory Agency / Command
                      </label>
                      <select className="bg-surface-container-lowest text-on-surface px-space-md py-space-sm rounded font-body-md text-sm shadow-sm focus:outline-none">
                        <option>Nigeria Customs Service (NCS)</option>
                        <option>National Drug Law Enforcement Agency (NDLEA)</option>
                        <option>NAFDAC Port Inspection</option>
                        <option>Standards Organisation of Nigeria (SON)</option>
                        <option>Federal Ministry of Finance / Trade</option>
                        <option>Other Authorized Sovereign Agency</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                    <div className="flex flex-col gap-1">
                      <label className="font-label-md text-label-md text-primary">
                        Official Service Email / ID
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="service.gov.ng domain preferred"
                        className="bg-surface-container-lowest text-on-surface px-space-md py-space-sm rounded font-body-md text-sm shadow-sm focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-md text-label-md text-primary">Subject Matter</label>
                      <select className="bg-surface-container-lowest text-on-surface px-space-md py-space-sm rounded font-body-md text-sm shadow-sm focus:outline-none">
                        <option>Resident Office Allocation & Inspection</option>
                        <option>ASYCUDA Technical Data Sync Protocol</option>
                        <option>Joint Cargo Examination Bay Scheduling</option>
                        <option>Bond Undertaking Compliance Verification</option>
                        <option>Disputed Cargo Vault Storage Request</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-label-md text-primary">
                      Formal Dispatch Memorandum / Message
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Provide statutory reference or details of your regulatory inquiry..."
                      className="bg-surface-container-lowest text-on-surface px-space-md py-space-sm rounded font-body-md text-sm shadow-sm focus:outline-none"
                    />
                  </div>
                  <div className="p-space-sm bg-surface-container-low rounded text-[11px] text-on-surface-variant leading-relaxed">
                    By submitting, the requesting authority affirms communication is conducted for
                    official sovereign oversight purposes under the laws of the Federal Republic of
                    Nigeria.
                  </div>
                  <button
                    type="submit"
                    className="bg-secondary hover:bg-secondary-container text-on-secondary px-space-lg py-space-md rounded font-title-sm text-title-sm shadow-sm transition-colors flex items-center justify-center gap-2 mt-space-xs"
                  >
                    <Icon name="send" className="text-[18px]" />
                    <span>Submit Official Dispatch to Compliance Desk</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}