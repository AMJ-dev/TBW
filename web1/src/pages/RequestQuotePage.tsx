import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';

const INITIAL_FORM = {
  companyName: 'Northern Atlantic Traders Ltd',
  contactPerson: 'Musa Danjuma',
  corporateEmail: 'logistics@northernatlantic.ng',
  phoneNumber: '+234 803 123 4567',
  countryState: 'Nigeria — FCT Abuja',
  cargoType: 'Containerised',
  containerCount: '2x 40ft High Cube (FCL)',
  cargoWeightVolume: '48,000 kg / 130 CBM',
  arrivalDate: '2026-10-15',
  storageDuration: '14 to 21 Days (Bonded)',
  specialReq:
    'Requires undercover covered bay discharge and heavy lift forklift support for crate unbundling.',
};

export function RequestQuotePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const submitQuote = () => {
    setSubmitted(true);
    window.scrollTo({ top: 140, behavior: 'smooth' });
  };

  const update = <K extends keyof typeof INITIAL_FORM>(key: K, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <section className="w-full bg-primary-container text-on-primary py-16 px-margin md:px-margin-md lg:px-margin-lg relative overflow-hidden">
        <div className="absolute -right-24 -bottom-24 w-96 h-96 opacity-10 pointer-events-none">
          <svg className="w-full h-full text-surface-container-lowest" fill="none" viewBox="0 0 200 200">
            <path d="M20 20H180V180H20V20Z" stroke="currentColor" strokeWidth="6" />
            <path d="M50 50H150V150H50V50Z" stroke="currentColor" strokeWidth="4" />
            <path d="M100 20V180M20 100H180" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-space-lg relative z-10">
          <div>
            <div className="inline-flex items-center gap-space-xs bg-tertiary-container/60 px-space-sm py-1 rounded mb-space-sm text-primary-fixed">
              <Icon name="verified_user" className="text-[16px]" />
              <span className="font-label-sm text-label-sm uppercase tracking-wider">
                Customs Bonded Terminal Tariff Assessment
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-primary tracking-tight font-bold">
              Request a Quote
            </h1>
            <p className="font-body-lg text-body-lg text-on-primary/85 mt-space-xs max-w-2xl">
              Preview a quote request using sample form data. Nothing is submitted to a service.
            </p>
          </div>
          <div className="flex items-center gap-space-lg text-primary-fixed border-t md:border-t-0 md:border-l border-on-primary/15 pt-space-md md:pt-0 md:pl-space-lg">
            <div>
              <p className="font-headline-sm text-headline-sm text-on-primary font-bold">24h</p>
              <p className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider">
                SLA Response
              </p>
            </div>
            <div>
              <p className="font-headline-sm text-headline-sm text-on-primary font-bold">NCS-Act</p>
              <p className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider">
                2023 Compliant
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-[1280px] mx-auto w-full px-margin md:px-margin-md lg:px-margin-lg pb-space-xl">
        <div className="max-w-4xl mx-auto -mt-8 bg-surface-container-lowest rounded-xl shadow-xl p-6 md:p-10 relative z-20">
          {!submitted ? (
            <>
              <nav aria-label="Progress" className="mb-8 pb-6">
                <ol className="flex items-center justify-between w-full">
                  {[1, 2, 3].map((step) => (
                    <li
                      key={step}
                      className={`flex-1 flex flex-col items-start cursor-pointer group ${step === 3 ? 'flex-none' : ''}`}
                      onClick={() => goToStep(step)}
                    >
                      <div className="flex items-center w-full">
                        <span
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-title-sm text-title-sm transition-colors ${
                            currentStep === step
                              ? 'bg-secondary text-on-secondary shadow-sm'
                              : currentStep > step
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {step}
                        </span>
                        {step < 3 && (
                          <div
                            className={`flex-1 h-1 mx-2 rounded transition-colors ${
                              currentStep > step ? 'bg-primary' : 'bg-surface-container-high'
                            }`}
                          />
                        )}
                      </div>
                      <div className="mt-2 text-left">
                        <span className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                          Stage 0{step}
                        </span>
                        <span
                          className={`font-title-sm text-title-sm ${
                            currentStep === step ? 'text-primary font-bold' : 'text-on-surface-variant'
                          }`}
                        >
                          {step === 1
                            ? 'Contact Details'
                            : step === 2
                            ? 'Cargo & Services'
                            : 'Review & Submit'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </nav>

              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                {currentStep === 1 && (
                  <fieldset className="space-y-4">
                    <div className="pb-2">
                      <h2 className="font-headline-sm text-headline-sm text-primary">
                        Step 1 — Consignor & Representative Information
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Enter verified enterprise credentials matching Form M documentation and CAC
                        records.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="font-label-md text-label-md text-primary uppercase tracking-wider">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => update('companyName', e.target.value)}
                          className="w-full bg-surface-container-lowest px-4 py-3 rounded text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-md text-label-md text-primary uppercase tracking-wider">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          value={formData.contactPerson}
                          onChange={(e) => update('contactPerson', e.target.value)}
                          className="w-full bg-surface-container-lowest px-4 py-3 rounded text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-md text-label-md text-primary uppercase tracking-wider">
                          Corporate Email
                        </label>
                        <input
                          type="email"
                          value={formData.corporateEmail}
                          onChange={(e) => update('corporateEmail', e.target.value)}
                          className="w-full bg-surface-container-lowest px-4 py-3 rounded text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-md text-label-md text-primary uppercase tracking-wider">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => update('phoneNumber', e.target.value)}
                          className="w-full bg-surface-container-lowest px-4 py-3 rounded text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-md text-label-md text-primary uppercase tracking-wider">
                          Country & State
                        </label>
                        <input
                          type="text"
                          value={formData.countryState}
                          onChange={(e) => update('countryState', e.target.value)}
                          className="w-full bg-surface-container-lowest px-4 py-3 rounded text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => goToStep(2)}
                        className="inline-flex items-center justify-center gap-space-xs bg-secondary hover:bg-secondary-container text-on-secondary px-8 py-3.5 rounded-xl font-title-sm text-title-sm transition-all shadow-md"
                      >
                        <span>Continue to Cargo Specifications</span>
                        <Icon name="arrow_forward" className="text-[18px]" />
                      </button>
                    </div>
                  </fieldset>
                )}

                {currentStep === 2 && (
                  <fieldset className="space-y-4">
                    <div className="pb-2">
                      <h2 className="font-headline-sm text-headline-sm text-primary">
                        Step 2 — Cargo Specifications & Service Selection
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Declare physical cargo characteristics and required bonded operations within
                        Abuja Terminal.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="font-label-md text-label-md text-primary uppercase tracking-wider">
                          Cargo Type
                        </label>
                        <select
                          value={formData.cargoType}
                          onChange={(e) => update('cargoType', e.target.value)}
                          className="w-full bg-surface-container-lowest px-4 py-3 rounded text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm"
                        >
                          <option value="General Cargo">General Cargo</option>
                          <option value="Containerised">Containerised (FCL / LCL)</option>
                          <option value="Agricultural">Agricultural Commodities</option>
                          <option value="Industrial Machinery">Industrial Machinery & Heavy Units</option>
                          <option value="Automotive">Automotive & Rolling Stock</option>
                          <option value="Project Cargo">Project Cargo / Out of Gauge</option>
                          <option value="Special / Temperature-Controlled">
                            Special / Temperature-Controlled (Cold Chain)
                          </option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-md text-label-md text-primary uppercase tracking-wider">
                          Container Count & Size
                        </label>
                        <input
                          type="text"
                          value={formData.containerCount}
                          onChange={(e) => update('containerCount', e.target.value)}
                          className="w-full bg-surface-container-lowest px-4 py-3 rounded text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-md text-label-md text-primary uppercase tracking-wider">
                          Total Gross Weight / Volume
                        </label>
                        <input
                          type="text"
                          value={formData.cargoWeightVolume}
                          onChange={(e) => update('cargoWeightVolume', e.target.value)}
                          className="w-full bg-surface-container-lowest px-4 py-3 rounded text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-md text-label-md text-primary uppercase tracking-wider">
                          Expected Terminal Arrival Date
                        </label>
                        <input
                          type="date"
                          value={formData.arrivalDate}
                          onChange={(e) => update('arrivalDate', e.target.value)}
                          className="w-full bg-surface-container-lowest px-4 py-3 rounded text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-md text-label-md text-primary uppercase tracking-wider">
                          Estimated Storage Duration
                        </label>
                        <input
                          type="text"
                          value={formData.storageDuration}
                          onChange={(e) => update('storageDuration', e.target.value)}
                          className="w-full bg-surface-container-lowest px-4 py-3 rounded text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="pt-2 flex flex-col gap-2">
                      <span className="font-label-md text-label-md text-primary uppercase tracking-wider">
                        Services Required (Select Applicable Modules)
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { label: 'Bonded Warehousing', desc: 'Customs-supervised duty-deferred storage', checked: true },
                          { label: 'Cargo Handling & Positioning', desc: 'Ramp transfer, reach-stacker marshalling', checked: true },
                          { label: 'Customs Examination Support', desc: 'NCS inspection bay layout & coordination', checked: true },
                          { label: 'Container Destuffing & Yard Mgmt', desc: 'Cross-dock stripping & empty return staging', checked: false },
                          { label: 'Staging & Final Abuja Metropolitan Delivery', desc: 'Final leg secured haulage across FCT destination warehouses', checked: true, span: true },
                        ].map((s) => (
                          <label
                            key={s.label}
                            className={`flex items-start gap-3 p-3.5 bg-surface-container-low rounded cursor-pointer hover:bg-surface-container transition-colors ${s.span ? 'md:col-span-2' : ''}`}
                          >
                            <input
                              type="checkbox"
                              defaultChecked={s.checked}
                              className="mt-1 h-4 w-4 rounded accent-secondary"
                            />
                            <div className="flex flex-col">
                              <span className="font-title-sm text-title-sm text-primary">
                                {s.label}
                              </span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant">
                                {s.desc}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-md text-label-md text-primary uppercase tracking-wider">
                        Special Requirements
                      </label>
                      <textarea
                        rows={3}
                        value={formData.specialReq}
                        onChange={(e) => update('specialReq', e.target.value)}
                        className="w-full bg-surface-container-lowest px-4 py-3 rounded text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-label-md text-label-md text-primary uppercase tracking-wider">
                        Document Uploads
                      </span>
                      <div className="p-8 bg-surface-container-low hover:bg-surface-container rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                        <div className="w-12 h-12 rounded-full bg-surface-container-high group-hover:bg-surface-container-highest flex items-center justify-center text-secondary mb-2 transition-colors">
                          <Icon name="cloud_upload" className="text-[26px]" />
                        </div>
                        <p className="font-title-sm text-title-sm text-primary">
                          Upload Bill of Lading, Packing List, or Commercial Invoice
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                          (PDF, PNG up to 25MB)
                        </p>
                        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded font-label-sm text-label-sm text-secondary">
                          <Icon name="attach_file" className="text-[14px]" />
                          <span>Attach Trade Files</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => goToStep(1)}
                        className="inline-flex items-center justify-center gap-space-xs bg-surface-container hover:bg-surface-container-high text-primary px-6 py-3 rounded-xl font-title-sm text-title-sm transition-colors"
                      >
                        <Icon name="arrow_back" className="text-[18px]" />
                        <span>Back to Step 1</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => goToStep(3)}
                        className="inline-flex items-center justify-center gap-space-xs bg-secondary hover:bg-secondary-container text-on-secondary px-8 py-3.5 rounded-xl font-title-sm text-title-sm transition-all shadow-md"
                      >
                        <span>Proceed to Review Manifest</span>
                        <Icon name="arrow_forward" className="text-[18px]" />
                      </button>
                    </div>
                  </fieldset>
                )}

                {currentStep === 3 && (
                  <fieldset className="space-y-4">
                    <div className="pb-2">
                      <h2 className="font-headline-sm text-headline-sm text-primary">
                        Step 3 — Review & Official Submission
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Verify consignor metrics before generating the electronic request dossier.
                      </p>
                    </div>
                    <div className="bg-surface-container-low rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-surface-variant/40">
                        <div className="flex items-center gap-2">
                          <Icon name="assignment" className="text-secondary text-[22px]" />
                          <span className="font-title-md text-title-md text-primary">
                            Consolidated Declaration Summary
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-surface-container-high text-primary font-label-sm text-label-sm uppercase tracking-wider">
                          Pre-Audit Draft
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-body-sm text-body-sm">
                        <div className="space-y-2">
                          <div>
                            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant block">
                              Consignor Entity
                            </span>
                            <span className="font-title-sm text-title-sm text-primary">
                              {formData.companyName}
                            </span>
                          </div>
                          <div>
                            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant block">
                              Corporate Representative
                            </span>
                            <span className="text-on-surface">
                              {formData.contactPerson} ({formData.corporateEmail})
                            </span>
                          </div>
                          <div>
                            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant block">
                              Destination / Transit State
                            </span>
                            <span className="text-on-surface">{formData.countryState}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant block">
                              Cargo Category & Units
                            </span>
                            <span className="text-on-surface font-title-sm">
                              {formData.cargoType} — {formData.containerCount}
                            </span>
                          </div>
                          <div>
                            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant block">
                              Declared Weight & Cubage
                            </span>
                            <span className="text-on-surface">{formData.cargoWeightVolume}</span>
                          </div>
                          <div>
                            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant block">
                              ETA / Storage Timeline
                            </span>
                            <span className="text-on-surface">
                              ETA: {formData.arrivalDate} | Duration: {formData.storageDuration}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-surface-variant/40">
                        <span className="font-label-sm text-label-sm uppercase text-on-surface-variant block mb-2">
                          Requested Facility Services:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {[
                            'Bonded Storage',
                            'Customs Exam Support',
                            'Cargo Handling & Positioning',
                            'Abuja Metropolitan Delivery',
                          ].map((s) => (
                            <span
                              key={s}
                              className="px-2.5 py-1 rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => goToStep(2)}
                        className="inline-flex items-center justify-center gap-space-xs bg-surface-container hover:bg-surface-container-high text-primary px-6 py-3 rounded-xl font-title-sm text-title-sm transition-colors w-full sm:w-auto"
                      >
                        <Icon name="arrow_back" className="text-[18px]" />
                        <span>Modify Cargo Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={submitQuote}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E55C00] text-on-secondary px-8 py-4 rounded-xl font-title-md text-title-md font-semibold transition-all shadow-lg hover:shadow-xl"
                      >
                        <Icon name="send" className="text-[20px]" />
                        <span>Submit Quote Request</span>
                      </button>
                    </div>
                  </fieldset>
                )}
              </form>
            </>
          ) : (
            <div className="space-y-4 py-4">
              <div className="bg-surface-container-lowest rounded-xl p-8 text-center space-y-4 shadow-md">
                <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto">
                  <Icon name="task_alt" className="text-[36px]" />
                </div>
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-surface-container text-primary rounded-full font-label-sm text-label-sm uppercase tracking-widest font-semibold">
                    Local preview complete
                  </span>
                  <h3 className="font-headline-md text-headline-md text-primary">
                    Quote request preview
                  </h3>
                  <p className="font-body-lg text-body-lg text-primary font-medium">
                    Demo reference (not submitted):{' '}
                    <span className="text-secondary font-bold select-all tracking-wider">
                      TRN-QUO-2026-0928
                    </span>
                    .
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mx-auto">
                    Your entries were checked in this browser only. No quote request was sent or
                    saved, and this sample reference is not an issued quotation.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                  <Link
                    to="/track-cargo"
                    className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-title-sm text-title-sm px-5 py-2.5 rounded-lg hover:bg-primary-container transition-colors"
                  >
                    <Icon name="travel_explore" className="text-[18px]" />
                    <span>Track Cargo Status</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 bg-surface-container hover:bg-surface-container-high text-primary font-title-sm text-title-sm px-5 py-2.5 rounded-lg transition-colors"
                  >
                    <Icon name="print" className="text-[18px]" />
                    <span>Print Declaration Slip</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* KYC */}
        <div className="max-w-4xl mx-auto mt-6 bg-surface-container-low rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shrink-0 mt-0.5">
              <Icon name="shield" className="text-[20px]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-title-sm text-title-sm text-primary font-bold uppercase tracking-wider">
                  KYC Note & Customs Governance
                </h4>
                <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-semibold">
                  NCS REGS
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Formal KYC verification is required prior to terminal intake and account setup: CAC
                Certificate of Incorporation, Tax Identification Number (TIN), applicable Form M /
                PAAR documentation, and authorized signatory mandates. TRÏNŪ coordinates facility
                handling; Customs decides all clearance determinations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}