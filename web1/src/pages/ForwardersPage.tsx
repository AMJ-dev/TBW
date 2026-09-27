import { Icon } from '@/components/ui/Icon';

const CAPABILITIES = [
  { icon: 'desk', badge: 'Pre-Booking Enabled', title: 'Dedicated Agent Desk & Priority Examination Bays', desc: 'Pre-book physical examination slots directly via the forwarder portal before trucks arrive on site. Licensed clearing agents receive air-conditioned workstation hubs equipped with high-speed uplinks, direct NCS documentation desks, and priority staging lanes.', highlight: 'Guaranteed inspection staging slot within 45 minutes of scheduled gate check-in.', highlightIcon: 'event_available' },
  { icon: 'terminal', badge: 'Form TRN-T1 Validated', title: 'Real-Time Custody Telemetry & Cargo Milestone Logs', desc: 'Export signed intake & tally logs with cryptographic hash verification to share instantly with your cargo owners. Every container seal verification, yard movement, and customs release milestone is captured with tamper-proof timestamps.', highlight: 'Cryptographic verification allows your clients to inspect cargo condition records independently.', highlightIcon: 'qr_code_2' },
  { icon: 'precision_manufacturing', badge: 'Heavy Equipment Ready', title: 'Transparent Bonded Yard Staging', desc: 'Continuous 24/7 CCTV-monitored container yard with dedicated handling gear for 20ft, 40ft HC, open-top, and breakbulk cargo. Integrated weighbridge with immediate axle-weight calibration certificates issued on entry.', highlight: 'Full perimeter optical infrared coverage and secure biometrically audited gates.', highlightIcon: 'videocam' },
  { icon: 'gavel', badge: 'NCS Single Window', title: 'Collaborative Customs Coordination', desc: 'We provide modern physical facilities and rapid administrative staging for Customs examination — Customs decides. Full digital synchronization with NCS Single Window, ASYCUDA World, and resident command enforcement desks.', highlight: 'Seamless hand-off directly to designated NCS Resident Officers in designated examination bays.', highlightIcon: 'hub' },
];

const ONBOARDING = [
  { num: '01', icon: 'badge', title: 'Register Agency Credentials', desc: 'Submit Corporate Affairs Commission (CAC) registration, CRFFN compliance certificate, and valid NCS Form C-30 Customs Agent License via our secure portal.', footer: 'Doc Audit: ~4 Hours' },
  { num: '02', icon: 'key', title: 'Receive Fast-Track Token', desc: 'Obtain your encrypted Agent ID badge, biometric yard clearance passes for staff, and access keys for our digital gate scheduling and cargo status API.', footer: 'Issued Digitally' },
  { num: '03', icon: 'alt_route', title: 'Route Consignments Direct', desc: 'Instruct coastal ports and shipping lines to route Abuja & Northern inbound containers straight to inland node code NCS-ABJ-BOND under bonded transfer bond.', footer: 'Bypass Coastal Holds' },
  { num: '04', icon: 'assignment_turned_in', title: 'Coordinate Joint Inspection', desc: 'Attend physical unbundling or joint examination alongside NCS resident valuation officers directly in our sheltered bays, achieving immediate electronic release.', footer: 'Abuja On-Site Finality' },
];

export function ForwardersPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <section className="relative w-full bg-primary-container text-on-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary-container to-tertiary-container opacity-95" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ff8664_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg pt-12 md:pt-16 pb-20 md:pb-24 flex flex-col gap-space-lg">
          <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-sm border-b border-inverse-primary/20">
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-primary-fixed uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
              <span>Partners in Trade · Forwarders & Licensed Agents</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest/10 backdrop-blur-sm text-secondary-fixed text-label-sm uppercase tracking-wider font-semibold">
              <Icon name="verified" className="text-[14px]" />
              <span>Respectful · Collaborative · Reassuring</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center pt-space-sm">
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <h1 className="font-headline-xl text-headline-xl text-surface-container-lowest leading-[1.1] tracking-tight">
                Your Clients.
                <br />
                Your Relationships.
                <br />
                <span className="text-secondary-fixed-dim italic font-serif">
                  Just Faster Infrastructure.
                </span>
              </h1>
              <p className="font-body-lg text-body-lg text-inverse-primary max-w-[620px] leading-relaxed">
                TRÏNŪ's Abuja flagship facility is built to empower clearing agents and freight
                forwarders across Northern Nigeria — not replace them. Plug into modern bonded
                storage, rapid examination bays, and transparent turnaround.
              </p>
              <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
                <a
                  href="#partner-form"
                  className="inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E55C00] text-surface-container-lowest px-6 py-3.5 rounded-[12px] font-title-sm text-title-sm shadow-md transition-all"
                >
                  <span>Partner With TRÏNŪ</span>
                  <Icon name="arrow_forward" className="text-[18px]" />
                </a>
                <a
                  href="#tariff-inquiry"
                  className="inline-flex items-center justify-center gap-2 bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 text-surface-container-lowest px-6 py-3.5 rounded-[12px] font-title-sm text-title-sm transition-all shadow-sm"
                >
                  <Icon name="request_quote" className="text-[18px]" />
                  <span>Request Facility Tariff Schedule</span>
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-space-sm">
                {[
                  { icon: 'shield', text: '100% Agency Neutrality Guaranteed' },
                  { icon: 'local_shipping', text: 'Dedicated Forwarder Desk & Staging' },
                  { icon: 'handshake', text: 'Zero Client Poaching Covenant' },
                ].map((b) => (
                  <div
                    key={b.text}
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-surface-container-lowest/5 backdrop-blur-sm"
                  >
                    <Icon name={b.icon} className="text-secondary-fixed text-[20px]" />
                    <span className="font-label-sm text-label-sm text-surface-bright leading-tight">
                      {b.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="rounded-xl overflow-hidden shadow-2xl bg-primary">
                <div className="relative h-64 sm:h-72 w-full">
                  <img
                    className="w-full h-full object-cover"
                    alt="Aerial view of inland bonded terminal"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQGLspR0SSRKMCedITG2BLbnTbdHjEG3tWvJeSSEDLxppJC36zhPulw5TiwkUihxngGq_EJBC3KJZSnVNLMsPtNrQxBz2EiWrBMuxcMfLbqfIFCBY9x8SKYNYpvBTf4YndAbC7G5xfG8x-nnybthfTMBHae62fK-WUd_4JWLVzv8BeGbPnK_wBuvzQ4-huHkvZS3ygm7p60gzuDsDBpgG6t8sC9ZkCxX2UMw99y2Qjlj1-Yh0BmQ"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
                  <div className="absolute top-4 left-4 bg-primary-container/90 text-surface-bright px-3 py-1 rounded text-label-sm font-semibold tracking-widest uppercase">
                    Node ID: NCS-ABJ-BOND
                  </div>
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#B44D2F] text-on-primary px-3 py-1 rounded text-label-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-surface-container-lowest animate-ping" />
                    <span>Active Staging</span>
                  </div>
                </div>
                <div className="p-space-md flex flex-col gap-space-sm bg-primary text-on-primary">
                  <div className="flex justify-between items-center text-label-sm text-primary-fixed uppercase tracking-wider pb-2 border-b border-primary-container">
                    <span>Abuja Flagship Gate Metrics</span>
                    <span>Live Feed</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <div className="text-body-sm text-inverse-primary">NCS Joint Exam Bays</div>
                      <div className="font-title-lg text-title-lg text-surface-bright font-bold">
                        14 Bays Operational
                      </div>
                    </div>
                    <div>
                      <div className="text-body-sm text-inverse-primary">Forwarder Turnaround</div>
                      <div className="font-title-lg text-title-lg text-secondary-fixed font-bold">
                        &lt; 4.2 Hours Avg.
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-primary-container rounded-lg flex items-center justify-between text-body-sm text-inverse-primary">
                    <div className="flex items-center gap-2">
                      <Icon name="verified_user" className="text-secondary-container text-[18px]" />
                      <span>License: NCS-CBW-2024-ABJ</span>
                    </div>
                    <span className="font-label-sm text-primary-fixed uppercase">
                      Federal Capital Territory
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="w-full bg-surface py-16 md:py-20">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex flex-col gap-space-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs max-w-[720px]">
              <span className="font-label-sm text-label-sm text-[#B44D2F] font-bold tracking-widest uppercase">
                The Mutual Growth Protocol
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                Why Licensed Forwarders Partner With TRÏNŪ
              </h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-[420px]">
              We are designed from the ground up as an enabler for the logistics fraternity,
              removing capital friction and distance barriers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-lg">
            {[
              { icon: 'lock_person', pillar: 'Pillar 01 · Trust', title: 'Client Protection & Neutrality', desc: 'You maintain 100% direct ownership of your consignor relationships. TRÏNŪ provides the physical terminal and customs staging; your agency handles the clearance mandates. We never solicit or undercut your shippers.', check: 'Binding Non-Circumvention Undertaking' },
              { icon: 'near_me_disabled', pillar: 'Pillar 02 · Efficiency', title: 'Eliminate the Costly Detour', desc: 'Avoid traveling back and forth or coordinating remote staging in distant coastal ports. Supervise examinations, sample extractions, and cargo releases right here in Abuja, close to your offices and principal clients.', check: 'Zero Unproductive Port Travel Expenses' },
              { icon: 'price_change', pillar: 'Pillar 03 · Governance', title: 'Predictable Demurrage & Accrual', desc: 'Clear, itemized bonded storage accrual visible in real time. Protect your operational margins with zero surprise terminal charges, arbitrary congestion penalties, or hidden staging surcharges.', check: 'Real-time Tariff Ledger & Digital Invoicing' },
            ].map((p) => (
              <div
                key={p.title}
                className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between transition-all hover:shadow-md"
              >
                <div className="flex flex-col gap-space-md">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-[#B44D2F]">
                    <Icon name={p.icon} className="text-[28px]" />
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <span className="font-label-sm text-label-sm text-[#B44D2F] uppercase tracking-wider font-semibold">
                      {p.pillar}
                    </span>
                    <h3 className="font-title-lg text-title-lg text-primary">{p.title}</h3>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    {p.desc}
                  </p>
                </div>
                <div className="pt-space-md mt-space-md flex items-center gap-2 text-label-sm font-semibold text-primary">
                  <Icon name="check_circle" className="text-secondary text-[16px]" />
                  <span>{p.check}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="w-full bg-surface-container-low py-16 md:py-24">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex flex-col gap-space-xl">
          <div className="flex flex-col gap-space-xs text-center max-w-[800px] mx-auto">
            <span className="font-label-sm text-label-sm text-secondary font-bold tracking-widest uppercase">
              Infrastructure Built for Movement
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
              The Forwarder Advantage: Operational Capabilities
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Purpose-built physical terminal tooling, automated administrative clearing
              interfaces, and institutional speed designed for modern freight managers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter-lg">
            {CAPABILITIES.map((c) => (
              <div
                key={c.title}
                className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md"
              >
                <div className="flex items-start justify-between gap-space-md">
                  <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
                    <Icon name={c.icon} className="text-[24px]" />
                  </div>
                  <span className="px-2.5 py-1 rounded bg-surface-container text-primary font-label-sm text-label-sm font-bold uppercase">
                    {c.badge}
                  </span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-title-lg text-title-lg text-primary">{c.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    {c.desc}
                  </p>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center gap-3">
                  <Icon name={c.highlightIcon} className="text-[#B44D2F]" />
                  <span className="font-body-sm text-body-sm text-on-surface">{c.highlight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="w-full bg-primary text-on-primary py-16 md:py-24 relative overflow-hidden">
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-secondary-container/10 filter blur-3xl" />
        <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative w-64 h-80 rounded-xl overflow-hidden shadow-xl bg-primary-container">
                <img
                  className="w-full h-full object-cover"
                  alt="Bilal Aijjola, CEO"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAW_yRvZ1nJCnqpKV0AeOuD-S9m8rnpjqwLEwxPN5mSes38DfL6CAkLcVrI9BVNP5C6JsS2GUfffyAhBnHA-gOyDYEf1uitTtdT1vtZZXRTO9huDCErF31mJsgRNAz-OPI4e95CCaLBIunGmrWNHpivTOBq0dLB35UIOBwaR0yIPV9Fk8cxQD5sMvJQVSNGsS5uB3tEEHZQmw99-2TbpIt0eCSIYTKcTEyEwDO5k5qsrl2XGLm56w"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <div className="font-title-md text-title-md text-surface-bright font-bold">
                    Bilal Aijjola
                  </div>
                  <div className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider">
                    Chief Executive Officer / MD
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-8 flex flex-col gap-space-md">
              <Icon name="format_quote" className="text-secondary text-[48px] opacity-80" />
              <blockquote className="font-headline-md text-headline-md text-surface-bright italic leading-snug">
                "Our vision is straightforward: make TRÏNŪ the leading inland bonded logistics hub
                for Abuja and Northern Nigeria. This facility is the first step, a secure,
                Customs-approved gateway that changes how this region moves goods."
              </blockquote>
              <div className="flex flex-col gap-1 pt-space-xs border-t border-primary-container/80">
                <div className="font-title-md text-title-md text-primary-fixed font-semibold">
                  Bilal Aijjola
                </div>
                <div className="font-body-sm text-body-sm text-inverse-primary">
                  Chief Executive Officer / Managing Director, TRÏNŪ Bonded Warehouse
                </div>
                <div className="font-label-sm text-label-sm text-outline-variant pt-1 uppercase tracking-wider">
                  Abuja Flagship Facility · Nigeria Customs Service Act 2023 Concession
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding */}
      <section className="w-full bg-surface py-16 md:py-24">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex flex-col gap-space-xl">
          <div className="flex flex-col gap-space-xs text-center max-w-[760px] mx-auto">
            <span className="font-label-sm text-label-sm text-[#B44D2F] font-bold tracking-widest uppercase">
              Streamlined Accreditation
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
              Agency Onboarding & Accreditation Flow
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Four structured steps to connect your clearing agency to TRÏNŪ's digital terminal
              gateway and secure designated staging priority.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {ONBOARDING.map((s) => (
              <div
                key={s.num}
                className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-surface-container text-primary font-bold flex items-center justify-center font-title-sm">
                    {s.num}
                  </div>
                  <Icon name={s.icon} className="text-secondary text-[20px]" />
                </div>
                <h4 className="font-title-md text-title-md text-primary">{s.title}</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  {s.desc}
                </p>
                <div className="mt-auto pt-2 text-label-sm text-on-surface-variant font-medium">
                  {s.footer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Form */}
      <section className="w-full bg-surface-container-low py-16 md:py-24" id="partner-form">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">
            <div className="lg:col-span-5 flex flex-col gap-space-lg">
              <div className="flex flex-col gap-space-xs">
                <span className="font-label-sm text-label-sm text-[#B44D2F] font-bold tracking-widest uppercase">
                  Direct Agent Support
                </span>
                <h2 className="font-headline-md text-headline-md text-primary">
                  Forwarder Relations & Accreditation Desk
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Connect directly with our liaison team to schedule a physical yard walkthrough,
                  verify agency credentials, or request custom consolidation staging rates.
                </p>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-md">
                <div className="flex items-center gap-space-md pb-space-sm border-b border-surface-container">
                  <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-title-lg font-bold">
                    MM
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-primary">Muktar Mahdi</span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase">
                      Brand & Forwarder Liaison
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      TRÏNŪ Bonded Facility Relations
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs font-body-md text-body-md">
                  <a
                    className="flex items-center gap-3 p-2 rounded hover:bg-surface-container transition-colors text-primary font-medium"
                    href="tel:09012494493"
                  >
                    <Icon name="call" className="text-[#B44D2F]" />
                    <span>09012494493</span>
                  </a>
                  <a
                    className="flex items-center gap-3 p-2 rounded hover:bg-surface-container transition-colors text-primary font-medium"
                    href="mailto:mukkysmahdi@gmail.com"
                  >
                    <Icon name="mail" className="text-[#B44D2F]" />
                    <span>mukkysmahdi@gmail.com</span>
                  </a>
                  <div className="flex items-start gap-3 p-2 text-on-surface-variant">
                    <Icon name="pin_drop" className="text-[#B44D2F] shrink-0" />
                    <span className="font-body-sm text-body-sm">
                      TRÏNŪ Bonded Warehouse, Abuja Flagship Facility, Federal Capital Territory,
                      Nigeria
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-secondary-container/20 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="rocket_launch" className="text-secondary" />
                    <span className="font-title-sm text-title-sm text-on-secondary-container">
                      Facility Milestone
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm font-bold text-on-secondary-container uppercase">
                    Launching 28 September 2026
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-surface-container-lowest p-space-lg md:p-space-xl rounded-xl shadow-md flex flex-col gap-space-md" id="tariff-inquiry">
              <div className="flex flex-col gap-1 pb-space-xs border-b border-surface-container">
                <h3 className="font-title-lg text-title-lg text-primary">
                  Request Forwarder Partnership & Tariff Schedule
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Submit your agency details to receive our wholesale bonded tariff structure and
                  initiate Form C-30 terminal registry.
                </p>
              </div>
              <form
                className="flex flex-col gap-space-md"
                onSubmit={(e) => {
                  e.preventDefault();
                  document.getElementById('form-success')?.classList.remove('hidden');
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-title-sm text-title-sm text-primary" htmlFor="agency-name">
                      Clearing Agency Name *
                    </label>
                    <input
                      id="agency-name"
                      required
                      type="text"
                      placeholder="e.g. Apex Global Logistics Ltd"
                      className="px-3 py-2.5 rounded bg-surface-container-lowest border border-outline/30 focus:border-primary focus:outline-none font-body-md text-body-md text-on-surface"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-title-sm text-title-sm text-primary" htmlFor="license-number">
                      CRFFN / NCS Form C-30 No. *
                    </label>
                    <input
                      id="license-number"
                      required
                      type="text"
                      placeholder="e.g. NCS/CBW/ABJ/9821"
                      className="px-3 py-2.5 rounded bg-surface-container-lowest border border-outline/30 focus:border-primary focus:outline-none font-body-md text-body-md text-on-surface"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-title-sm text-title-sm text-primary" htmlFor="contact-name">
                      Principal Contact / Managing Director *
                    </label>
                    <input
                      id="contact-name"
                      required
                      type="text"
                      placeholder="Full legal name"
                      className="px-3 py-2.5 rounded bg-surface-container-lowest border border-outline/30 focus:border-primary focus:outline-none font-body-md text-body-md text-on-surface"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-title-sm text-title-sm text-primary" htmlFor="contact-email">
                      Official Email Address *
                    </label>
                    <input
                      id="contact-email"
                      required
                      type="email"
                      placeholder="agent@company.ng"
                      className="px-3 py-2.5 rounded bg-surface-container-lowest border border-outline/30 focus:border-primary focus:outline-none font-body-md text-body-md text-on-surface"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-title-sm text-title-sm text-primary" htmlFor="contact-phone">
                      Direct Phone / WhatsApp *
                    </label>
                    <input
                      id="contact-phone"
                      required
                      type="tel"
                      placeholder="0803XXXXXXX"
                      className="px-3 py-2.5 rounded bg-surface-container-lowest border border-outline/30 focus:border-primary focus:outline-none font-body-md text-body-md text-on-surface"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-title-sm text-title-sm text-primary" htmlFor="estimated-volume">
                      Monthly TEU Throughput (Est.)
                    </label>
                    <select
                      id="estimated-volume"
                      className="px-3 py-2.5 rounded bg-surface-container-lowest border border-outline/30 focus:border-primary focus:outline-none font-body-md text-body-md text-on-surface"
                    >
                      <option value="1-10">1 – 10 TEUs (Spot & Small Consignments)</option>
                      <option value="11-40">11 – 40 TEUs (Regular Freight)</option>
                      <option value="41-100">41 – 100 TEUs (Fleet & Heavy Freight)</option>
                      <option value="100+">100+ TEUs (Enterprise / Project Cargo)</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-title-sm text-title-sm text-primary" htmlFor="special-requirements">
                    Operational Requirements or Notes
                  </label>
                  <textarea
                    id="special-requirements"
                    rows={3}
                    placeholder="Specify if you handle reefer containers, dangerous goods (IMO), high-value breakbulk, or require dedicated exam bay priority."
                    className="px-3 py-2 rounded bg-surface-container-lowest border border-outline/30 focus:border-primary focus:outline-none font-body-md text-body-md text-on-surface"
                  />
                </div>
                <div className="flex items-start gap-3 p-3 bg-surface-container-low rounded-lg">
                  <input id="neutrality-ack" required type="checkbox" className="mt-1 rounded accent-primary" />
                  <label
                    className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer"
                    htmlFor="neutrality-ack"
                  >
                    I acknowledge that TRÏNŪ operates as a neutral bonded infrastructure provider. I
                    request accredited partner access under the non-poaching and confidentiality
                    covenant.
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E55C00] text-surface-container-lowest py-3.5 px-6 rounded-[12px] font-title-sm text-title-sm shadow-md transition-all"
                >
                  <span>Submit Accreditation & Tariff Request</span>
                  <Icon name="send" className="text-[18px]" />
                </button>
              </form>
              <div
                className="hidden p-4 bg-surface-container rounded-xl flex items-center gap-3"
                id="form-success"
              >
                <Icon name="verified" className="text-secondary text-[24px]" />
                <div className="flex flex-col">
                  <span className="font-title-sm text-title-sm text-primary">
                    Accreditation Request Logged
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Liaison Officer Muktar Mahdi will contact your agency within 4 business hours
                    with the confidential forwarder tariff schedule.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="w-full bg-surface-container-high py-10">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col md:flex-row items-center gap-space-lg justify-between">
            <div className="flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
                <Icon name="policy" className="text-[28px]" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-[#B44D2F] font-bold uppercase tracking-wider">
                  Statutory Compliance Mandate
                </span>
                <p className="font-body-md text-body-md text-primary font-medium leading-relaxed max-w-[840px]">
                  "TRÏNŪ operates within the Nigeria Customs Service Act 2023. We support and
                  coordinate the clearance process; Customs decides. Consignor and cargo telemetry
                  protected under Nigeria Data Protection Act (NDPA) 2023."
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="px-3 py-1.5 rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold uppercase">
                NCS Act 2023
              </span>
              <span className="px-3 py-1.5 rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold uppercase">
                NDPA 2023 Compliant
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}