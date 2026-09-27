import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

const DIVISIONS = [
  { badge: 'Desk 01 · Key Liaison', title: 'Forwarder & Agent Liaison', desc: 'Form C-30 terminal endorsements, customs agent accreditation, container staging, and physical off-dock allocations.', name: 'Muktar Mahdi', role: 'Head of Clearance & Partner Desk', phone: '0901 249 4493', email: 'mukkysmahdi@gmail.com', footerLeft: 'CRFFN · ANLCA · NAGAFF', footerRight: 'Direct Line', iconColor: 'text-secondary', icon: 'badge' },
  { badge: 'Desk 02 · Commercial', title: 'Commercial & Importers', desc: 'Published tariff matrices, extended bonded storage agreements, secure pharmaceutical vaults, and multimodal transit tariffs.', name: 'Commercial Desk', role: 'Inland Logistics Rate Desk', phone: '', email: 'commercial@trinu.ng', footerLeft: 'SLA Response < 2 hrs', footerRight: 'Volume Tariffs', iconColor: 'text-primary', icon: 'request_quote' },
  { badge: 'Desk 03 · Regulatory', title: 'Regulatory & Protocol', desc: 'Joint physical inspection scheduling with resident NCS Command, NAFDAC, SON, NDLEA, and quarantine services.', name: 'Statutory Protocol Unit', role: 'NCS Command Coordination Office', phone: '', email: 'regulatory@trinu.ng', footerLeft: 'Official Inquiries Only', footerRight: 'NCS Fast-Track', iconColor: 'text-secondary', icon: 'policy' },
  { badge: 'Desk 04 · Round-the-clock', title: '24/7 Gate & Operations', desc: 'Immediate gate-in/gate-out verification, real-time container seal tamper alerts, and convoy reception clearance.', name: 'Terminal Control Gate', role: 'Plot 1048 Idu Main Gate Access', phone: '+234 (0) 9 461 8809', email: '', footerLeft: 'Continuous Patrol', footerRight: '24/7 Active Gate', iconColor: 'text-primary', icon: 'gate' },
];

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Operational Strip */}
      <section className="w-full bg-surface-container-high py-space-sm">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex flex-wrap items-center justify-between gap-space-sm font-label-sm text-label-sm">
          <div className="flex items-center gap-space-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5 font-bold uppercase text-secondary">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
              Terminal Ops: Active
            </span>
            <span className="text-outline">/</span>
            <span>Abuja Cargo Gateway (NCS-ABJ-BOND)</span>
            <span className="text-outline">/</span>
            <span className="text-primary font-semibold">Desk 04-Clearance</span>
          </div>
          <div className="flex items-center gap-space-md text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Icon name="verified_user" className="text-[15px] text-secondary" />
              UI Preview: Local Demo
            </span>
            <span className="hidden md:inline text-outline">·</span>
            <span className="hidden md:flex items-center gap-1 font-semibold text-primary">
              <Icon name="event" className="text-[15px]" />
              Commercial Launch: 28 September 2026
            </span>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="w-full bg-surface-container-lowest py-space-xl">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-end">
            <div className="lg:col-span-8 flex flex-col gap-space-sm">
              <div className="inline-flex items-center gap-2 self-start bg-surface-container px-3 py-1 rounded-full text-secondary font-label-sm text-label-sm uppercase tracking-widest font-bold">
                <Icon name="local_shipping" className="text-[16px]" />
                Operational Liaison & Clearance Desk
              </div>
              <h1 className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">
                Get in Touch with TRÏNŪ Abuja
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[820px] leading-relaxed">
                Direct statutory and operational access to bonded terminal management, joint
                customs inspection scheduling, certified freight agent accreditation, and real-time
                cargo holding protocols.
              </p>
            </div>
            <div className="lg:col-span-4 bg-primary text-on-primary rounded-xl p-space-lg shadow-md flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary-fixed">
                  Direct Clearance Line
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FF6600] text-on-primary">
                  NCS Liaison
                </span>
              </div>
              <div className="font-headline-sm text-headline-sm font-bold text-surface-bright tracking-tight">
                +234 901 249 4493
              </div>
              <p className="font-body-sm text-body-sm text-primary-fixed-dim">
                Monitored by Muktar Mahdi (Brand & Clearance Liaison) for priority bonded transfers
                and yard gate entries.
              </p>
              <div className="pt-space-xs flex items-center gap-2 text-primary-fixed font-title-sm text-title-sm">
                <Icon name="mail" className="text-[18px]" />
                <a className="hover:underline text-surface-bright" href="mailto:mukkysmahdi@gmail.com">
                  mukkysmahdi@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divisions */}
      <section className="w-full bg-surface py-space-xl">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm mb-space-lg">
            <div>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">
                Inland Clearance Channels
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold">
                Specialized Division Directory
              </h2>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[420px]">
              Targeted communication channels configured for fast turnaround times. Direct routing
              prevents administrative bottlenecks.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {DIVISIONS.map((d) => (
              <div
                key={d.title}
                className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-space-sm">
                  <div
                    className={`w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center ${d.iconColor}`}
                  >
                    <Icon name={d.icon} className="text-[26px]" />
                  </div>
                  <div>
                    <span className={`font-label-sm text-label-sm uppercase font-bold ${d.iconColor}`}>
                      {d.badge}
                    </span>
                    <h3 className="font-title-lg text-title-lg text-primary font-bold mt-1">
                      {d.title}
                    </h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{d.desc}</p>
                  <div className="bg-surface-container-low rounded p-space-sm flex flex-col gap-1 font-body-sm text-body-sm">
                    <span className="font-title-sm text-title-sm text-primary font-bold">
                      {d.name}
                    </span>
                    <span className="text-on-surface-variant text-[12px]">{d.role}</span>
                    {d.phone && (
                      <a
                        className="text-secondary font-semibold hover:underline flex items-center gap-1 mt-1"
                        href={`tel:${d.phone.replace(/\s/g, '')}`}
                      >
                        <Icon name="call" className="text-[14px]" /> {d.phone}
                      </a>
                    )}
                    {d.email && (
                      <a
                        className="text-on-surface-variant hover:text-primary hover:underline text-[12px] truncate"
                        href={`mailto:${d.email}`}
                      >
                        {d.email}
                      </a>
                    )}
                  </div>
                </div>
                <div className="mt-space-md pt-space-sm flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>{d.footerLeft}</span>
                  <span className="text-secondary font-bold">{d.footerRight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="w-full bg-surface-container-low py-space-xl">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">
            <div className="lg:col-span-5 flex flex-col justify-between gap-space-lg">
              <div className="flex flex-col gap-space-sm">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">
                  Direct Docket Dispatch
                </span>
                <h2 className="font-headline-lg text-headline-lg text-primary font-bold leading-tight">
                  Operational Clearance Request
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Preview the enquiry flow for cargo, terminal transfers, or agent accreditation.
                  This form keeps its confirmation in the browser and does not send a request.
                </p>
                <div className="flex flex-col gap-space-xs mt-space-md">
                  {[
                    { icon: 'verified', title: 'Local interaction', desc: 'Form feedback is displayed in this browser only; no inquiry docket is created.' },
                    { icon: 'shield', title: 'No information sent', desc: 'This prototype does not transmit or retain names, contacts, or cargo details.' },
                    { icon: 'speed', title: 'Preview only', desc: 'A production enquiry workflow would require a configured and approved service.' },
                  ].map((h) => (
                    <div
                      key={h.title}
                      className="bg-surface-container-lowest p-space-md rounded-lg flex items-start gap-space-sm shadow-sm"
                    >
                      <Icon name={h.icon} className="text-secondary text-[22px] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-title-sm text-title-sm text-primary font-bold">
                          {h.title}
                        </h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{h.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-surface-container-highest p-space-md rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[14px]">
                    MM
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-sm text-title-sm text-primary font-semibold">
                      Muktar Mahdi
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Brand & Clearance Desk Direct
                    </span>
                  </div>
                </div>
                <a
                  href="tel:09012494493"
                  className="bg-primary text-on-primary font-label-sm text-label-sm px-3 py-2 rounded-lg font-bold hover:bg-primary-container transition-colors"
                >
                  Call Desk
                </a>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-surface-container-lowest rounded-xl p-space-lg md:p-space-xl shadow-md">
                <form className="flex flex-col gap-space-md" onSubmit={handleFormSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-title-sm text-title-sm text-primary font-semibold" htmlFor="fullName">
                        Full Name & Title <span className="text-secondary">*</span>
                      </label>
                      <input
                        id="fullName"
                        required
                        type="text"
                        placeholder="e.g. Ibrahim Abubakar, Senior Agent"
                        className="bg-surface-container-low px-4 py-2.5 rounded text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 transition-all placeholder:text-outline"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-title-sm text-title-sm text-primary font-semibold" htmlFor="organizationName">
                        Organization / Freight Agency <span className="text-secondary">*</span>
                      </label>
                      <input
                        id="organizationName"
                        required
                        type="text"
                        placeholder="e.g. Apex Global Logistics Ltd."
                        className="bg-surface-container-low px-4 py-2.5 rounded text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 transition-all placeholder:text-outline"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-title-sm text-title-sm text-primary font-semibold" htmlFor="officialEmail">
                        Official Corporate Email <span className="text-secondary">*</span>
                      </label>
                      <input
                        id="officialEmail"
                        required
                        type="email"
                        placeholder="agent@company.com.ng"
                        className="bg-surface-container-low px-4 py-2.5 rounded text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 transition-all placeholder:text-outline"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-title-sm text-title-sm text-primary font-semibold" htmlFor="phoneWhatsApp">
                        WhatsApp / Direct Phone <span className="text-secondary">*</span>
                      </label>
                      <input
                        id="phoneWhatsApp"
                        required
                        type="tel"
                        placeholder="+234 800 000 0000"
                        className="bg-surface-container-low px-4 py-2.5 rounded text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 transition-all placeholder:text-outline"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-title-sm text-title-sm text-primary font-semibold" htmlFor="inquiryCategory">
                        Inquiry Category <span className="text-secondary">*</span>
                      </label>
                      <select
                        id="inquiryCategory"
                        required
                        defaultValue=""
                        className="bg-surface-container-low px-4 py-2.5 rounded text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 transition-all"
                      >
                        <option value="" disabled>
                          Select Operational Department
                        </option>
                        <option value="forwarder-accreditation">
                          Forwarder & Agent Accreditation (Form C-30)
                        </option>
                        <option value="commercial-storage">Commercial Bonded Storage Quote</option>
                        <option value="customs-liaison">Customs / Regulatory Joint Inspection</option>
                        <option value="cargo-tracking">Active Cargo Tracking & Holding Support</option>
                        <option value="terminal-visit">
                          Terminal Site & Vault Walkthrough Inspection
                        </option>
                        <option value="general-inquiry">General Facility Inquiry</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-title-sm text-title-sm text-primary font-semibold" htmlFor="referenceNumber">
                        Consignment / Reference No.{' '}
                        <span className="text-on-surface-variant font-normal text-xs">(Optional)</span>
                      </label>
                      <input
                        id="referenceNumber"
                        type="text"
                        placeholder="e.g. TRN-2026-0881, BL Number, SGD No."
                        className="bg-surface-container-low px-4 py-2.5 rounded text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 transition-all placeholder:text-outline"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-title-sm text-title-sm text-primary font-semibold" htmlFor="detailedMessage">
                      Detailed Message / Cargo Specification <span className="text-secondary">*</span>
                    </label>
                    <textarea
                      id="detailedMessage"
                      required
                      rows={4}
                      placeholder="Detail your TEU volume, cargo nature (general, cold chain, hazardous, bonded vaults), expected inland transfer date, or agent accreditation credentials..."
                      className="bg-surface-container-low px-4 py-2.5 rounded text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 transition-all placeholder:text-outline resize-y"
                    />
                  </div>
                  <div className="flex items-start gap-3 bg-surface-container-low p-space-md rounded-lg">
                    <input
                      id="ndpaConsent"
                      required
                      type="checkbox"
                      className="mt-1 w-4 h-4 rounded text-secondary focus:ring-secondary accent-[#FF6600]"
                    />
                    <label
                      className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed select-none cursor-pointer"
                      htmlFor="ndpaConsent"
                    >
                      I confirm that all cargo declarations and partner details provided are accurate
                      and agree that submitted information is handled under the{' '}
                      <strong>Nigeria Data Protection Act (NDPA 2023)</strong> and the statutory
                      compliance rules of the{' '}
                      <strong>Nigeria Customs Service Act 2023</strong>.
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-xs">
                    <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                      <Icon name="encrypted" className="text-[18px] text-secondary" />
                      <span>Local demo · no information is transmitted</span>
                    </div>
                    <button
                      type="submit"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E55C00] text-on-primary font-title-sm text-title-sm font-semibold px-space-lg py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      <Icon name="send" className="text-[20px]" />
                      Send Inquiry to Clearance Desk
                    </button>
                  </div>
                  {submitted && (
                    <div className="p-space-md rounded-lg bg-surface-container-high text-primary flex items-start gap-3">
                      <Icon name="check_circle" className="text-secondary text-[24px]" />
                      <div className="flex flex-col">
                        <span className="font-title-sm text-title-sm font-bold">
                          Local enquiry preview complete
                        </span>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Nothing was sent to TRÏNŪ or stored. Your details stayed in this browser
                          and will clear when you leave the page.
                        </p>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facility */}
      <section className="w-full bg-surface-container-lowest py-space-xl">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm mb-space-lg">
            <div>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">
                Physical Facility Infrastructure
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold">
                Abuja Flagship Facility Access
              </h2>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[420px]">
              Positioned on the primary Idu heavy-freight corridor with dedicated rail siding
              connectivity and direct customs command access.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">
            <div className="lg:col-span-7 flex flex-col gap-space-sm">
              <div
                className="w-full h-[400px] md:h-[460px] bg-cover bg-center rounded-xl shadow-md relative overflow-hidden flex items-end p-space-md"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCHgCG_7GyWPoxKWeUAgbmuC0M8c21ZDXE-yFZNVZpOnL39hPHfPjr75zmkwL-bOmJkjwSRgLasGP1IHv2vQSmPLngVfMsbLMHSay0LOMrE7S27EKrLGlqlhuwY9VeG1ePt197Ng8vMwCyY4GW-CwMknXJkDSmL3sIgP_SyKvMgeuPwklQGZ8aTu8fSW8bBuwfOv7rwCApCBj7qiZdk9J3V17S1CFtr-AQktIVVsvj5X16GtR3QlA')",
                }}
              >
                <div className="bg-primary/95 text-on-primary backdrop-blur-md p-space-md rounded-lg max-w-[440px] shadow-lg flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary-fixed font-bold">
                      TRÏNŪ Inland Bonded Depot
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FF6600] text-on-primary">
                      NCS Code: ABJ-014
                    </span>
                  </div>
                  <p className="font-title-sm text-title-sm text-surface-bright font-semibold">
                    Plot 1048, Industrial Estate Road, Idu Industrial District
                  </p>
                  <p className="font-body-sm text-body-sm text-primary-fixed-dim">
                    Abuja Federal Capital Territory, Nigeria · Direct heavy haulage access from
                    Abuja-Kaduna Highway Link.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-sm pt-space-xs">
                {[
                  { icon: 'train', t: 'Idu Rail Siding', s: 'Connected Freight Spur' },
                  { icon: 'local_airport', t: 'Cargo Airport', s: '25 Mins via Outer Ring' },
                  { icon: 'verified', t: 'Terminal Perimeter', s: '100% Armed Cordon' },
                ].map((b) => (
                  <div
                    key={b.t}
                    className="bg-surface-container p-space-sm rounded-lg flex items-center gap-2"
                  >
                    <Icon name={b.icon} className="text-secondary text-[20px]" />
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-primary font-bold">
                        {b.t}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">{b.s}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5 flex flex-col justify-between gap-space-md">
              <div className="bg-surface-container rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="schedule" className="text-secondary text-[22px]" />
                    <h3 className="font-title-lg text-title-lg text-primary font-bold">
                      Facility Operating Hours
                    </h3>
                  </div>
                  <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">
                    WAT Timezone
                  </span>
                </div>
                <div className="flex flex-col gap-space-sm font-body-sm text-body-sm">
                  {[
                    ['Inland Terminal Main Gate', 'Container reception, dispatch & weighbridge', '24/7 / 365 Days', true],
                    ['Customs & Administrative Desk', 'Duty assessments, clearance stamps, billing', 'Mon – Fri: 08:00 – 17:00'],
                    ['Joint Physical Inspection Bay', 'NCS, NAFDAC, SON & agency walkthroughs', 'Saturday: 09:00 – 14:00'],
                  ].map(([t, s, v, accent]) => (
                    <div
                      key={t as string}
                      className="flex items-center justify-between bg-surface-container-lowest p-space-sm rounded"
                    >
                      <div className="flex flex-col">
                        <span className="font-title-sm text-title-sm text-primary font-bold">
                          {t}
                        </span>
                        <span className="text-on-surface-variant text-xs">{s}</span>
                      </div>
                      <span
                        className={`font-label-sm text-label-sm font-bold px-2.5 py-1 rounded ${
                          accent ? 'bg-[#FF6600]/10 text-secondary' : 'text-primary'
                        }`}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-surface-container-highest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-sm">
                <div className="flex items-center gap-2 text-secondary">
                  <Icon name="security" className="text-[20px]" />
                  <h4 className="font-title-sm text-title-sm uppercase tracking-wider font-bold">
                    Visitor & Inspection Protocol
                  </h4>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  All personnel entering the bonded perimeter must carry a valid photo
                  identification card:{' '}
                  <strong>
                    National Identification Number (NIN) slip, Federal Road Safety Driving Licence,
                    or CRFFN Freight Agent ID
                  </strong>
                  .
                </p>
                <div className="flex items-center gap-2 pt-1 font-body-sm text-body-sm text-primary font-semibold">
                  <Icon name="badge" className="text-secondary text-[18px]" />
                  <span>Biometric visitor passes are issued upon security screening at Gate 1.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Whistleblower */}
      <section className="w-full bg-primary-container text-on-primary py-space-xl">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="bg-primary rounded-xl p-space-lg md:p-space-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-space-lg">
            <div className="flex items-start gap-space-md max-w-[780px]">
              <div className="w-12 h-12 rounded-xl bg-[#B44D2F] flex items-center justify-center shrink-0 text-on-primary mt-1">
                <Icon name="gavel" className="text-[26px]" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-[#FF6600] font-bold">
                  Customs Compliance & Ethics
                </span>
                <h3 className="font-headline-sm text-headline-sm text-surface-bright font-bold">
                  Emergency & Statutory Whistleblower Channel
                </h3>
                <p className="font-body-sm text-body-sm text-inverse-primary leading-relaxed">
                  TRÏNŪ Bonded Warehouse strictly enforces zero tolerance for extortion, tariff
                  evasion, unmanifested transfers, or unauthorized container tamperings.
                  Discrepancies or integrity breaches can be confidentially reported directly to
                  our statutory compliance committee.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch md:items-end gap-space-sm shrink-0 w-full md:w-auto">
              <a
                href="mailto:compliance@trinu.ng"
                className="inline-flex items-center justify-center gap-2 bg-[#B44D2F] hover:bg-secondary text-on-primary px-space-lg py-3 rounded-xl font-title-sm text-title-sm font-semibold transition-colors shadow-md text-center"
              >
                <Icon name="report" className="text-[20px]" />
                compliance@trinu.ng
              </a>
              <a
                href="tel:+23494618800"
                className="inline-flex items-center justify-center gap-2 bg-surface-container-high/20 hover:bg-surface-container-high/30 text-surface-bright px-space-md py-3 rounded-xl font-title-sm text-title-sm font-semibold transition-colors text-center"
              >
                <Icon name="call" className="text-[18px]" />
                Ethics Hotline
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}