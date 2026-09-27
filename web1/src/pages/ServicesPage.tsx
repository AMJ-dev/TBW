import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';

const SERVICES = [
  {
    num: '01',
    icon: 'warehouse',
    badge: 'Core',
    title: 'Bonded Warehousing',
    subtitle: 'Secure, customs-approved storage for bonded consignments with real-time digital inventory telemetry.',
    desc: 'Consignees defer duties legitimately while holding inventory in close proximity to the federal capital market. Avoid high-risk coastal storage and control inventory drawdown as commercial financing dictates.',
    features: [
      { icon: 'shelves', title: 'High-Density Pallet Racking', desc: 'Customs lot-numbered multi-tier structural pallet racking with aisle telemetry.' },
      { icon: 'thermostat', title: 'Climate-Controlled Zones', desc: 'Calibrated cold-chain preservation for pharmaceutical, foodstuff, and sensitive cargo.' },
      { icon: 'warning', title: 'Hazardous Protocol Handling', desc: 'Segregated spill-contained bays compliant with international IMDG regulatory mandates.' },
      { icon: 'calculate', title: 'Zero Demurrage Surprises', desc: 'Live transparent per-diem accrual tracking via self-service client dashboard.' },
    ],
    footer: 'Standard Bond Period: Up to 180 Days (Renewable per NCS Sanction)',
    footerLink: 'Book Space Allocation',
    footerHref: '/request-a-quote',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDI2BJ_l1ZnASZHOsJiy8KVQ7fh4onGUMwyZw503Lj5d8d0v2dM2u2Ym3RExff6_6lEe_C5D8rBifnPdrY69b8-9UKlVm9kOpWIZAuKvhx7LoLKMFjV0FUB3g3_g5mucisenT3jTs1bPhC1m5jaA600qDNoM6-HDwO3XmD-0Oyzk6S9TGK2HktarbWBAXH1NlBcT6rDRX23YD7L6X4u8tJz6UbNNoNUZ5QBM9DOWzRC5lQVqy0UUg',
    imageSide: 'left' as const,
  },
  {
    num: '02',
    icon: 'forklift',
    badge: 'Mechanized',
    title: 'Cargo Handling & Yard Operations',
    subtitle: 'Full-spectrum cargo reception, physical tally, positioning, and heavy lifting.',
    desc: 'We deploy industrial-tier reach stackers, rough-terrain forklifts, and crane systems to guarantee zero drop-damage and rapid container transfers directly upon arrival from coastal corridors.',
    features: [
      { icon: 'inventory_2', title: '20ft, 40ft HC & Open-Top', desc: 'Full capacity handling of standard TEUs, high cubes, flat racks, and oversize machinery.' },
      { icon: 'precision_manufacturing', title: '45-Tonne Reach Stackers', desc: 'Modern Kalmar and Konecranes fleet with container top-lift and automated load indicators.' },
      { icon: 'scale', title: 'Calibrated Axle Weighbridges', desc: '80T dual electronic weighbridges issuing digital weight tickets upon intake.' },
      { icon: 'pallet', title: 'Destuffing & Cross-Docking', desc: 'Professional destuffing, palletising, stretch-wrapping, and breakbulk sorting bays.' },
    ],
    footer: 'Standard Intake Cycle: < 38 Minutes per Flatbed Carriage',
    footerLink: 'View Handling Specs',
    footerHref: '/services/cargo-handling',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnFIAgFjEV634AJg2Mw1kS9ybe54XW0iSj0LNmdu4hhOGUXdLHrcVSeD520YWi08sZy3CAaUN8h0y1yYLfo9gd2hdT4F61eeIVssGqStU7lls1UPjUfP0Zw9tyOZ0I1UVzDqKmlJ-6B1At_JHvAROAOPPo8sQkhWR3a501He-TIn2BP3KMYbR2yA-NKazSINEH59I9WL4eIXAVokBJeoJ5_5OcsuJCJ08IX6S0OhzCcKBTt3E8A',
    imageSide: 'right' as const,
  },
  {
    num: '03',
    icon: 'verified_user',
    badge: 'Statutory Compliance',
    title: 'Customs Support & Examination Facilities',
    subtitle: 'Physical facilities and operational coordination for joint Customs examination — Customs decides.',
    desc: 'We provide facilities and coordination for Customs examination. TRÏNŪ never usurps statutory authority: we support with duty and charge payment processes, and release cargo once Customs authorisation and all terminal obligations are satisfied.',
    features: [
      { icon: 'roofing', title: 'Sheltered Inspection Staging', desc: '14 covered weather-proof staging bays designed for simultaneous physical container inspections.' },
      { icon: 'meeting_room', title: 'Resident NCS Officer Suites', desc: 'Dedicated administrative quarters for Nigeria Customs Service officers and inspection teams.' },
      { icon: 'science', title: 'Digital Sampling Desks', desc: 'Compliant quarantine sampling benches for NAFDAC, SON, and NDLEA regulatory agents.' },
      { icon: 'assignment_turned_in', title: 'NCS Form C-30 Hand-off', desc: 'End-to-end digital audit trail from Bonded Terminal Transfer (BTT) to final statutory out-turn.' },
    ],
    footer: 'Coordination Protocol: Single Window Joint NCS / SON / NAFDAC Inspection',
    footerLink: 'Verify Inspection Manifest',
    footerHref: '/verify-document',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDi7UQNgwON9XI6Fzm2HbZcpRnp7GSiGvu0n3RHvedhXnbRnmCNvWbv6kXSIcaVY6NKnRxdAFzyUumHxvxWpVUNXlCCds1He3wDFVKXF3aikgNUoRD-MlH9s9vdrjTd3M0FsQByqfXFMcmGKzg_HdYrEYqyitUtHOjKRjzvZN1roVTacEgqRa8EdwJa0-3jTZdrlfN4IPZcRl2D90-hDdVJG1RUTtnjmUn7wl8ZArRBXUQbZOcmg',
    imageSide: 'left' as const,
  },
  {
    num: '04',
    icon: 'security',
    badge: 'Access Protocol',
    title: 'Container Yard & Gate Management',
    subtitle: 'Precision container yard staging with cryptographic gate-in / gate-out tracking.',
    desc: 'Every container movement within the 12-hectare perimeter is tagged to a specific coordinate slot (Bay, Row, Tier). Gate ingress and egress are secured by biometric driver verification, automatic number plate recognition (ANPR), and seal validation against original shipping manifests.',
    features: [
      { icon: 'badge', title: 'Biometric Driver Authentication', desc: 'Strict biometric identification matching appointed trucking licenses before chassis release.' },
      { icon: 'qr_code_scanner', title: 'Seal Integrity Verification', desc: 'Tamper-evident photographic and barcode scanning against coastal Bill of Lading records.' },
      { icon: 'speed', title: 'Rapid Dwell Reduction', desc: 'Under 4.2 hours average dwell before container ground staging, eliminating port parking queues.' },
      { icon: 'grid_view', title: 'Cryptographic Interchange Receipts', desc: 'Instant digital Equipment Interchange Receipts (EIR) delivered to forwarders via portal.' },
    ],
    footer: 'Yard Capacity: 2,500 TEU Live Capacity · Monitored 24/7',
    footerLink: 'Track Container Live',
    footerHref: '/track-cargo',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPHC4cYSiFKwn1P8YXyy6SPVjO59TH64rTrmdOrjhQq3hFhqhf_AuVw_OSkuaTCETDYxh0VajSD-KNTRi1Qbhux1cCc1ahjNX-ppimuUp1dqBvF32gY4JAj-YdcFZR3QxfeRCozTqMxhCTOp9oY4onr8PwVnquga1uOjIR58ZL1sPjLYszecw3i7KPxLWEilrnq_FupswzuIUk7otPuifiOZV_aHgOzRh3IJgEyJCxUjBhGtfabw',
    imageSide: 'right' as const,
  },
  {
    num: '05',
    icon: 'local_shipping',
    badge: 'Billing & Accrual',
    title: 'Storage & Inland Logistics Accrual',
    subtitle: 'Flexible short and long-term storage under bonded regime with automated visibility.',
    desc: 'Complete financial clarity with no arbitrary holding surcharges. Forwarders and enterprise importers gain real-time visibility into per-diem accruals, terminal handling fees, and direct assistance with duty and charge payment processes.',
    features: [
      { icon: 'receipt_long', title: 'Digital Billing Portal', desc: 'Automated generation of transparent line-item terminal invoices and tax documentation.' },
      { icon: 'price_check', title: 'Transparent Tariff Schedules', desc: 'Published fixed tariffs without unannounced demurrage escalations or disguised demurrage lines.' },
      { icon: 'query_stats', title: 'Daily Accrual Logs', desc: 'Downloadable daily CSV and PDF balance sheets for supply chain finance controllers.' },
      { icon: 'chat', title: 'Automated Messaging Alerts', desc: 'Automated WhatsApp and SMS milestone alerts triggered at each customs release tier.' },
    ],
    footer: 'Duty Support: Assistance with NCS e-Payment & CBN Remittance Windows',
    footerLink: 'Review Tariff Framework',
    footerHref: '#tariff-framework',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsuPA-q0t04y0NrBGnJBiXJAFdhjWa-0ySR4wuRrBAhphaE1HYUnQI1ekMxxfrSVIgHEud8DLQTchepPscF6dW6HcO_UVN9eY_4OtS1_xRd2O1nhc4cM_kZ8VF5WukHmJ7brZTZcQ5IxPCfSSaeK6mdI431WRJGHCBtYXiRxCbXBiy2qLvs0nNnr5hI1xhsChRjtIEbfUuWq227n1ZxAmZ3K2xfXWfkaUVNgUju-gRpSGlhXtKrg',
    imageSide: 'left' as const,
  },
];

const EQUIPMENT = [
  { icon: 'front_loader', title: 'Heavy Reach Stackers', desc: 'Equipped with up to 45-Tonne lifting capacity, supporting 5-high stacking for laden containers and rapid flatbed handling.', metric: 'Fleet: 4 Heavy Units', sub: 'Tested and certified bi-annually', accent: 'secondary' },
  { icon: 'balance', title: 'Calibrated Weighbridges', desc: '80-tonne heavy vehicle electronic weighbridges with dual-direction axle load scales, certified to NCS and Weights & Measures standards.', metric: 'Tolerance: ± 0.05% Accuracy', sub: 'Automated ticket stamping', accent: 'primary' },
  { icon: 'nest_cam_floodlight', title: '360° Infrared CCTV', desc: 'Comprehensive tamper-evident high-definition perimeter and internal optical surveillance, archived offsite with continuous audit coverage.', metric: 'Retention: 180 Days Archived', sub: 'NCS joint control room feed', accent: 'secondary' },
  { icon: 'terminal', title: 'ASYCUDA Single Window', desc: 'Direct live sync to Nigeria Customs Service ASYCUDA World single-window portal, automating manifest declarations and clearance tallies.', metric: 'Latency: Real-Time EDI', sub: 'Statutory C-Series dispatch', accent: 'primary' },
];

const TARIFF_TABLE = [
  ['Terminal Handling Charge (THC)', 'Standard Schedule', 'Standard Schedule'],
  ['Bonded Inspection Coordination Fee', 'Fixed per Manifest', 'Fixed per Manifest'],
  ['Free Storage Allowance', '5 Working Days', '5 Working Days'],
  ['Electronic Weighbridge Stamp', 'Included', 'Included'],
];

const WORKFLOW = [
  { num: 1, title: 'Manifest Endorsement', desc: 'Bonded transfer requested at port of entry (Lagos/Onne). Cargo transferred under customs escort to Abuja.', color: 'bg-[#FF6600]' },
  { num: 2, title: 'Biometric Gate-In', desc: 'Automated weighbridge check, seal scanning, and electronic tally generation into the warehouse management system.', color: 'bg-primary' },
  { num: 3, title: 'Joint Examination', desc: 'We provide facilities and coordination for Customs examination. Nigeria Customs Service inspects and assesses statutory duties.', color: 'bg-primary' },
  { num: 4, title: 'Authorised Release', desc: 'We release cargo once Customs authorisation and all terminal obligations are satisfied. Instant dispatch to final destinations.', color: 'bg-secondary' },
];

export function ServicesPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Operational Alert Strip */}
      <section className="w-full bg-surface-container-high py-space-xs text-on-surface">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex flex-wrap items-center justify-between gap-space-sm text-body-sm font-body-sm">
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
            <span className="font-title-sm text-title-sm text-primary tracking-wide uppercase">
              Operational Mandate:
            </span>
            <span className="text-on-surface-variant font-medium">
              The platform facilitates and coordinates terminal transfers; Customs decides.
            </span>
          </div>
          <div className="flex items-center gap-space-md text-label-sm font-label-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Icon name="verified" className="text-[15px] text-secondary" />
              NCS Bonded Station No. ABJ/BND-0104
            </span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:flex items-center gap-1">
              <Icon name="schedule" className="text-[15px] text-secondary" />
              24/7 Gate-In Telemetry
            </span>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="w-full bg-surface-container-low py-space-xl relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <div className="inline-flex items-center gap-2 self-start bg-surface-container px-3 py-1.5 rounded-full shadow-sm">
                <Icon name="hub" className="text-[16px] text-on-tertiary-container" />
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-tertiary-container font-bold">
                  Bonded Infrastructure & Terminal Capabilities
                </span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight font-bold leading-tight">
                End-to-End Inland Logistics & Bonded Services
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[620px] leading-relaxed">
                Engineered for importers, forwarders, and commercial traders moving cargo directly to
                Abuja and Northern Nigeria. We eliminate port bottlenecks with customs-bonded
                security and dedicated inland clearing.
              </p>
              <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
                <Link
                  to="/request-a-quote"
                  className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E55C00] text-on-primary font-title-sm text-title-sm font-semibold px-space-lg py-space-sm rounded-xl transition-all duration-200 shadow-md"
                >
                  <span>Request Terminal Tariff</span>
                  <Icon name="arrow_forward" className="text-[18px]" />
                </Link>
                <a
                  href="#services-matrix"
                  className="inline-flex items-center gap-2 bg-surface hover:bg-surface-container-high text-primary font-title-sm text-title-sm font-semibold px-space-lg py-space-sm rounded-xl transition-all duration-200 shadow-sm"
                >
                  <Icon name="inventory_2" className="text-[18px] text-secondary" />
                  <span>Explore 5 Core Operations</span>
                </a>
              </div>
              <div className="pt-space-sm flex items-center gap-space-sm text-body-sm font-body-sm text-on-surface-variant">
                <Icon name="format_image_left" className="text-secondary text-[20px]" />
                <span>
                  We support and coordinate the clearance process; we release cargo once Customs
                  authorisation and all terminal obligations are satisfied.
                </span>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-xl overflow-hidden shadow-xl bg-surface-container">
                <img
                  className="w-full h-[380px] object-cover"
                  alt="Inland bonded container terminal"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBT2lEGvEIoFbmFt0ZfqtCfr5xPnsTtXxfAH7elvVWbZLC_ItlNN-h_5SljQS6HBYW_3FSiQW6SyyRNCTWsA2GPD_L2srwuWBzh71Y0KQEb9elqj5MdAhZR4B099VNLa6CwRi2XuwRGXWdRa_SqLh3-PU8UUr7b9hKe1rpvinYbsRSV_gJgJbNtizVWj9VcoVlP2JGZsb8IbE3MPLABtjKEMXG-GZO16z5UsAvt3Li9jbcS3z_Ttw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent flex flex-col justify-end p-space-lg text-on-primary">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider">
                        Facility Coordinates
                      </p>
                      <p className="font-title-md text-title-md font-bold text-on-primary">
                        Idu Industrial Zone, Abuja FCT
                      </p>
                    </div>
                    <div className="bg-surface-container-lowest/90 text-primary px-3 py-1.5 rounded-lg shadow-sm">
                      <span className="font-label-sm text-label-sm font-bold text-[#FF6600]">
                        99.8% ON-TIME GATE RUN
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-space-xl grid grid-cols-2 lg:grid-cols-4 gap-gutter bg-surface-container-lowest rounded-xl p-space-md shadow-md">
            {[
              { icon: 'gavel', value: '14', label: 'Joint Inspection Bays' },
              { icon: 'videocam', value: '24/7 CCTV', label: 'Bonded Vault Storage' },
              { icon: 'fingerprint', value: 'Biometric', label: 'Gate In/Out Access' },
              { icon: 'sync_alt', value: 'Direct Sync', label: 'NCS ASYCUDA Single Window' },
            ].map((kpi) => (
              <div key={kpi.label} className="flex items-center gap-space-sm p-space-xs">
                <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
                  <Icon name={kpi.icon} className="text-[24px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-headline-sm text-headline-sm font-bold text-primary">
                    {kpi.value}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider truncate">
                    {kpi.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Matrix */}
      <section className="w-full py-space-xl bg-surface" id="services-matrix">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex flex-col gap-space-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs max-w-[760px]">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
                Terminal Operational Matrix
              </span>
              <h2 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">
                Institutional Bonded Services Engineered for Sovereign Reliability
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Each operation operates strictly under bonded customs covenants with precision
                telemetry, chain of custody compliance, and direct hand-off workflows for freight
                owners and clearing agents.
              </p>
            </div>
            <div className="bg-surface-container px-space-md py-space-sm rounded-xl shadow-sm shrink-0">
              <p className="font-label-sm text-label-sm text-on-surface-variant">STATUTORY ROLE</p>
              <p className="font-title-sm text-title-sm text-primary font-bold">
                Coordination & Physical Infrastructure
              </p>
            </div>
          </div>

          {SERVICES.map((s) => (
            <div
              key={s.num}
              className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all hover:shadow-lg"
            >
              <div
                className={`lg:col-span-5 relative min-h-[260px] lg:min-h-full ${
                  s.imageSide === 'right' ? 'lg:order-2' : ''
                }`}
              >
                <img className="w-full h-full object-cover" alt={s.title} src={s.image} />
                <div
                  className={`absolute top-4 ${
                    s.imageSide === 'right' ? 'right-4' : 'left-4'
                  } bg-primary text-on-primary font-label-sm text-label-sm font-bold uppercase tracking-wider px-3 py-1 rounded-lg`}
                >
                  Service {s.num} · {s.badge}
                </div>
              </div>
              <div
                className={`lg:col-span-7 p-space-lg md:p-space-xl flex flex-col justify-between gap-space-md ${
                  s.imageSide === 'right' ? 'lg:order-1' : ''
                }`}
              >
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <Icon name={s.icon} className="text-[32px] text-secondary" />
                    <h3 className="font-headline-md text-headline-md font-bold text-primary">
                      {s.title}
                    </h3>
                  </div>
                  <p className="font-body-lg text-body-lg font-semibold text-on-surface">
                    {s.subtitle}
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    {s.desc}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-space-xs">
                    {s.features.map((f) => (
                      <div
                        key={f.title}
                        className="bg-surface-container-low p-space-sm rounded-lg flex items-start gap-2"
                      >
                        <Icon name={f.icon} className="text-[20px] text-secondary shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-title-sm text-title-sm text-primary font-semibold">
                            {f.title}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            {f.desc}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-sm bg-surface-container px-space-md py-space-sm rounded-lg">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                    {s.footer}
                  </span>
                  <Link
                    to={s.footerHref}
                    className="text-secondary font-title-sm text-title-sm font-bold hover:underline inline-flex items-center gap-1"
                  >
                    {s.footerLink} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Equipment */}
      <section className="w-full py-space-xl bg-surface-container-low">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex flex-col gap-space-lg">
          <div className="flex flex-col gap-space-xs max-w-[800px]">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
              Terminal Assets & Technical Compliance
            </span>
            <h2 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">
              Heavy Industrial Infrastructure Engineered for Uptime
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Built according to rigorous Nigerian Ports Authority (NPA) and Nigeria Customs Service
              (NCS) bonded terminal guidelines for off-dock inland operations.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {EQUIPMENT.map((e) => (
              <div
                key={e.title}
                className="bg-surface-container-lowest p-space-lg rounded-xl shadow-md flex flex-col justify-between gap-space-md hover:-translate-y-1 transition-transform duration-200"
              >
                <div className="flex flex-col gap-space-sm">
                  <div
                    className={`w-12 h-12 rounded-xl ${
                      e.accent === 'secondary'
                        ? 'bg-secondary-fixed text-secondary'
                        : 'bg-primary-fixed text-primary'
                    } flex items-center justify-center`}
                  >
                    <Icon name={e.icon} className="text-[26px]" />
                  </div>
                  <h3 className="font-title-lg text-title-lg font-bold text-primary">{e.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {e.desc}
                  </p>
                </div>
                <div className="pt-space-sm border-t border-surface-container flex flex-col gap-1 text-label-sm font-label-sm text-on-surface">
                  <span
                    className={
                      e.accent === 'secondary' ? 'text-secondary font-bold' : 'text-primary font-bold'
                    }
                  >
                    {e.metric}
                  </span>
                  <span className="text-on-surface-variant">{e.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tariff */}
      <section className="w-full py-space-xl bg-surface" id="tariff-framework">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
            <div className="lg:col-span-6 flex flex-col gap-space-md">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
                Fiscal Advantage
              </span>
              <h2 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">
                Stop Bleeding Demurrage at Congested Coastal Sea Ports
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                Shipping lines and port terminals in Lagos impose punitive daily demurrage when
                cargo is stuck in gridlock. Routing directly to TRÏNŪ Bonded Terminal Abuja on a
                Bonded Terminal Transfer (BTT) stops sea-port demurrage accruals upon discharge
                from vessel.
              </p>
              <div className="bg-surface-container p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                  <span className="font-title-sm text-title-sm text-primary font-bold">
                    Cost Factor Comparison
                  </span>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                    Up to 60% Savings
                  </span>
                </div>
                <div className="flex items-start justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">
                    Coastal Sea Port Demurrage (After Free Days):
                  </span>
                  <span className="font-bold text-error">₦45,000 – ₦110,000 / day</span>
                </div>
                <div className="flex items-start justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">TRÏNŪ Inland Bonded Holding Fee:</span>
                  <span className="font-bold text-secondary">Structured Low-Accrual Tariff</span>
                </div>
                <div className="flex items-start justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Inland Transport Congestion Risk:</span>
                  <span className="font-bold text-primary">Pre-Cleared Rail/Road Freight Corridor</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
                <Link
                  to="/request-a-quote"
                  className="bg-[#FF6600] hover:bg-[#E55C00] text-on-primary font-title-sm text-title-sm font-semibold px-space-lg py-space-sm rounded-xl transition-all shadow-md inline-flex items-center gap-2"
                >
                  <Icon name="receipt" className="text-[18px]" />
                  <span>Download 2026 Tariff Guide (PDF)</span>
                </Link>
                <Link
                  to="/contact"
                  className="bg-surface-container hover:bg-surface-container-high text-primary font-title-sm text-title-sm font-semibold px-space-lg py-space-sm rounded-xl transition-all shadow-sm inline-flex items-center gap-2"
                >
                  <Icon name="calculate" className="text-[18px]" />
                  <span>Tariff Calculator Desk</span>
                </Link>
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xl flex flex-col gap-space-md">
                <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high">
                  <div>
                    <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                      Transparent Line Items
                    </p>
                    <h3 className="font-title-lg text-title-lg font-bold text-primary">
                      Consolidated Terminal Fee Model
                    </h3>
                  </div>
                  <Icon name="analytics" className="text-[28px] text-secondary" />
                </div>
                <div className="flex flex-col gap-space-xs py-space-xs">
                  <div className="flex justify-between text-body-sm font-body-sm text-on-surface-variant">
                    <span>Traditional Coastal Route + Detention Accrual</span>
                    <span className="font-bold text-error">₦1,850,000 est.</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden">
                    <div className="bg-error h-full rounded-full" style={{ width: '100%' }} />
                  </div>
                  <div className="flex justify-between text-body-sm font-body-sm text-on-surface-variant pt-2">
                    <span>TRÏNŪ Bonded Route (Direct to Abuja + Inland Clearance)</span>
                    <span className="font-bold text-[#FF6600]">₦740,000 est.</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden">
                    <div className="bg-[#FF6600] h-full rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-body-sm font-body-sm">
                    <thead>
                      <tr className="bg-surface-container text-primary font-title-sm text-title-sm">
                        <th className="py-2.5 px-3 rounded-l-lg">Tariff Element</th>
                        <th className="py-2.5 px-3">20FT TEU</th>
                        <th className="py-2.5 px-3 rounded-r-lg">40FT HC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                      {TARIFF_TABLE.map(([el, teu, hc]) => (
                        <tr key={el} className="hover:bg-surface-container-low transition-colors">
                          <td className="py-2.5 px-3 text-on-surface font-medium">{el}</td>
                          <td className="py-2.5 px-3 font-semibold text-primary">{teu}</td>
                          <td className="py-2.5 px-3 font-semibold text-primary">{hc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed">
                  * Note: Exact statutory duty assessments are established exclusively by the
                  Nigeria Customs Service via ASYCUDA SGD assessment. TRÏNŪ facilitates clearance
                  and physical staging; statutory import duties are payable directly to designated
                  Federal Government revenue accounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="w-full py-space-xl bg-surface-container-low">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex flex-col gap-space-lg">
          <div className="text-center max-w-[700px] mx-auto flex flex-col gap-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
              Operational Precision
            </span>
            <h2 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">
              How Consignments Move Through TRÏNŪ
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              A synchronized protocol connecting sea ports, customs authorities, and northern
              distributors.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
            {WORKFLOW.map((w) => (
              <div
                key={w.num}
                className="bg-surface-container-lowest p-space-md rounded-xl shadow-md flex flex-col gap-space-sm"
              >
                <div
                  className={`w-10 h-10 rounded-full ${w.color} text-on-primary font-bold flex items-center justify-center font-title-md text-title-md`}
                >
                  {w.num}
                </div>
                <h3 className="font-title-md text-title-md font-bold text-primary">{w.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full bg-primary-container text-on-primary py-space-xl relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-space-xl">
            <div className="flex flex-col gap-space-sm max-w-[760px]">
              <div className="inline-flex items-center gap-2 self-start bg-on-primary/10 px-3 py-1 rounded-full">
                <Icon name="anchor" className="text-[16px] text-primary-fixed" />
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary-fixed font-bold">
                  Inland Clearance Hub Abuja
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg font-bold text-on-primary tracking-tight">
                Ready to Route Your Cargo Through TRÏNŪ?
              </h2>
              <p className="font-body-lg text-body-lg text-inverse-primary leading-relaxed">
                Consult our clearance coordination desk or request a customized terminal tariff
                schedule today. Let our team prepare your transit manifests and ensure immediate
                yard readiness.
              </p>
              <div className="flex items-center gap-space-sm pt-space-xs text-body-sm font-body-sm text-primary-fixed">
                <Icon name="help_center" className="text-[20px]" />
                <span>We support and coordinate the clearance process · Customs decides</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-space-md w-full lg:w-auto shrink-0">
              <Link
                to="/request-a-quote"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E55C00] text-on-primary px-space-lg py-space-sm rounded-xl font-title-sm text-title-sm font-semibold transition-all duration-200 shadow-lg text-center"
              >
                <span>Request a Quote</span>
                <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
              <Link
                to="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent hover:bg-on-primary/10 text-on-primary border-2 border-on-primary px-space-lg py-space-sm rounded-xl font-title-sm text-title-sm font-semibold transition-all duration-200 text-center"
              >
                <Icon name="support_agent" className="text-[18px]" />
                <span>Contact Clearance Desk</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}