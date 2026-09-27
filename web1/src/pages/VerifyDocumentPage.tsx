import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';

export function VerifyDocumentPage() {
  const sampleCode = 'TRN-DOC-VAL-88219-NCS';
  const [docCode, setDocCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'not-found' | null>(null);
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docCode.trim()) {
      setMessage('Enter a verification code to continue.');
      return;
    }
    setMessage('');
    setVerificationStatus(null);
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const isKnownSample = docCode.trim().toUpperCase() === sampleCode;
      setVerificationStatus(isKnownSample ? 'verified' : 'not-found');
      setMessage(isKnownSample ? 'Sample document matched in the local demo.' : 'No local demo document matches that code.');
      document.getElementById('verificationResult')?.scrollIntoView({ behavior: 'smooth' });
    }, 650);
  };

  const handleQrScan = () => {
    setDocCode(sampleCode);
    setVerificationStatus(null);
    setMessage('Sample code filled. Select Verify Document to check the local demo record.');
  };

  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <section className="w-full bg-surface-container-low py-space-xl px-margin md:px-margin-md lg:px-margin-lg">
        <div className="max-w-[1280px] mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-space-xs bg-surface-container px-space-md py-1 rounded-full mb-space-md shadow-sm">
            <Icon name="verified_user" className="text-[16px] text-secondary" />
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Local document verification demo
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-primary-container mb-space-sm max-w-3xl">
            Verify a Document
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-space-xl">
            Enter the sample verification code shown below. No terminal or Customs system is queried.
          </p>
          <div className="w-full max-w-2xl bg-surface-container-lowest rounded-lg shadow-md p-space-lg text-left">
            <form className="flex flex-col gap-space-xs" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-space-xs">
                <label
                  className="font-title-sm text-title-sm text-on-surface-variant"
                  htmlFor="docCode"
                >
                  Verification Code or Terminal Security Hash
                </label>
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <Icon name="info" className="text-[14px]" /> Code Format Guide
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="docCode"
                  type="text"
                  value={docCode}
                  onChange={(e) => {
                    setDocCode(e.target.value);
                    setVerificationStatus(null);
                    setMessage('');
                  }}
                  className="w-full bg-surface py-space-md pl-space-md pr-12 rounded-lg font-mono text-title-md text-primary tracking-wide focus:outline-none focus:bg-surface-container-lowest"
                />
                <button
                  type="button"
                  onClick={handleQrScan}
                  className="absolute right-3 p-2 text-on-surface-variant hover:text-secondary rounded-lg transition-colors"
                >
                  <Icon name="qr_code_scanner" className="text-[24px]" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-space-xs text-on-surface-variant font-label-sm text-label-sm">
                <span>Terminal Key: ABUJA-CENTRAL-NODE-01</span>
                <span className="text-on-surface-variant font-medium">Local sample only</span>
              </div>
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full mt-space-md bg-secondary text-on-secondary py-space-md px-space-lg rounded-xl font-title-md text-title-md shadow-sm hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-space-sm"
              >
                <Icon name={isVerifying ? 'sync' : 'search_check'} className={`text-[20px] ${isVerifying ? 'animate-spin' : ''}`} />
                <span>{isVerifying ? 'Querying Terminal Ledger...' : 'Verify Document'}</span>
              </button>
            </form>
            {message && <p role="status" className="mt-3 font-body-sm text-body-sm text-on-surface-variant">{message}</p>}
            <button type="button" onClick={() => handleQrScan()} className="mt-3 font-label-sm text-label-sm font-semibold text-secondary underline underline-offset-4">Use sample code: {sampleCode}</button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-space-sm mt-space-lg">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
              Standard Formats:
            </span>
            {['Form TRN-T1 (Intake)', 'Form TRN-C4 (Clearance)', 'Form TRN-WH2 (Bonded Transit)'].map((f) => (
              <span
                key={f}
                className="bg-surface-container-high px-space-sm py-0.5 rounded text-on-surface-variant font-label-sm text-label-sm"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Result */}
      {verificationStatus && <section
        className="w-full bg-background py-space-xl px-margin md:px-margin-md lg:px-margin-lg"
        id="verificationResult"
      >
        <div className="max-w-[1280px] mx-auto flex flex-col gap-space-lg">
          {verificationStatus === 'verified' ? <>
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-md overflow-hidden">
            <div className="bg-surface-container-low px-space-lg py-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="flex items-start md:items-center gap-space-md">
                <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0 shadow-sm text-secondary">
                  <Icon name="verified" className="text-[34px]" filled />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-sm flex-wrap">
                    <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-space-sm py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Sample reference matched
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Local demo record · not an official verification
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-primary mt-1">
                    Bonded Cargo Intake & Tally Certificate (Form TRN-T1)
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-space-md py-space-sm bg-surface-container text-primary font-title-sm text-title-sm rounded-lg hover:bg-surface-container-high transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Icon name="print" className="text-[18px]" />
                <span>Export Record</span>
              </button>
            </div>

            <div className="p-space-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter-lg">
              <div className="flex flex-col gap-space-md">
                {[
                  ['Document Reference Number', 'TRN-DOC-VAL-88219-NCS', true],
                  ['Issuing Authority', 'TRÏNŪ Inland Bonded Terminal — Abuja Central Records'],
                  ['Document Type Code', 'Form TRN-T1 (Physical Manifest Intake Validation)'],
                ].map(([k, v, mono]) => (
                  <div key={k as string} className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      {k}
                    </span>
                    <span
                      className={`text-primary font-medium mt-1 ${mono ? 'font-mono text-title-md font-semibold' : 'font-body-md text-body-md'}`}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-space-md">
                {[
                  ['Issue Timestamp', '24 October 2026, 14:15:02 WAT'],
                  ['Issuing Terminal Officer', 'Alhaji Ibrahim Bello (Badge ID: TRN-OFF-044)'],
                  ['Terminal Seal Reference', 'NCS-ABJ-BOND-SEAL #482019'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      {k}
                    </span>
                    <span className="font-body-md text-body-md text-primary font-medium mt-1">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col justify-between bg-surface-container-low p-space-md rounded-lg">
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Ledger Integrity Proof
                  </span>
                  <div className="flex items-center gap-space-xs text-primary mt-1">
                    <Icon name="lock" className="text-secondary text-[20px]" />
                    <span className="font-title-sm text-title-sm font-semibold">
                      Sample code match
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    This verification hash directly validates physical cargo placement in Bonded
                    Yard Sector 3-B under bonded warehouse license bond #BND-0941.
                  </p>
                </div>
                <div className="mt-space-md pt-space-xs flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Status: ACTIVE ON TERMINAL
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                </div>
              </div>
            </div>

            <div className="bg-surface-container px-space-lg py-space-md flex flex-col md:flex-row md:items-center justify-between gap-space-sm font-mono text-label-md">
              <div className="flex items-center gap-space-xs text-on-surface-variant overflow-hidden">
                <Icon name="fingerprint" className="text-[18px] text-secondary flex-shrink-0" />
                <span className="font-semibold text-primary flex-shrink-0">
                  Security Cryptographic Hash:
                </span>
                <span className="truncate text-on-surface">
                  SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
                  );
                  alert('Cryptographic Hash copied to clipboard.');
                }}
                className="text-secondary hover:text-primary transition-colors flex items-center gap-1 flex-shrink-0 font-sans font-medium text-body-sm"
              >
                <Icon name="content_copy" className="text-[16px]" />
                <span>Copy Hash</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter-lg">
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-space-md">
                  <h3 className="font-title-lg text-title-lg text-primary">
                    Terminal Intake Verification Profile
                  </h3>
                  <span className="font-label-sm text-label-sm bg-surface-container text-on-surface-variant px-space-sm py-1 rounded">
                    Yard Lot: ABJ-NORTH-44
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-md mb-space-lg">
                  {[
                    ['Handling Bay', 'Terminal Gate 2'],
                    ['Unit Count', '1x 40ft HC'],
                    ['NCS Tally No.', 'TAL-81992'],
                    ['Bond Guarantee', 'UNDERWRITTEN', true],
                  ].map(([k, v, accent]) => (
                    <div
                      key={k as string}
                      className="bg-surface-container-low p-space-sm rounded-lg flex flex-col"
                    >
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                        {k}
                      </span>
                      <span
                        className={`font-title-md text-title-md mt-1 ${accent ? 'text-secondary' : 'text-primary'}`}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  The intake registration for cargo tally reference{' '}
                  <span className="font-semibold text-primary">TRN-DOC-VAL-88219-NCS</span> confirms
                  successful offloading from inland bonded transit into Abuja Central Vaults.
                  Customs physically cross-checked tamper seals prior to vault admission.
                </p>
              </div>
              <div className="mt-space-md pt-space-md flex flex-wrap items-center justify-between gap-space-sm font-label-sm text-label-sm text-on-surface-variant">
                <span>Terminal Operating Authority: TRÏNŪ Logistics Infrastructures Nigeria Ltd.</span>
                <span className="flex items-center gap-1 text-secondary">
                  <Icon name="verified" className="text-[16px]" /> Validated Operational Node
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col">
              <div className="relative w-full h-44 bg-surface-container">
                <img
                  className="w-full h-full object-cover"
                  alt="Industrial bonded warehouse yard"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBm4q4KtION9zVj0J9OCD3T3HwbGHG5svbb0Wddld5IAcIr0PLXgVwFFiKkT6p3CkwrSe3RjsyEY12hAjWZtNp1Bt-95VG_-SlKOSg_QsndyE0p0ZMgmHZCGtyZGm6H1A2-Y5WobLO9vL3UKAIjJXmhcQP52pW76g_tZizpDSvIWp8QK0yRCyraRs9HkPGYV7nX9MkyQht3oXgkdTdH94Cit3Hb02Ty0GtueqfxaC4m-l4lDxBmdA"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-on-primary">
                  <span className="font-label-sm text-label-sm tracking-wide uppercase">
                    Abuja Flagship Facility
                  </span>
                  <span className="font-mono text-label-sm">ZONE-01-SEC</span>
                </div>
              </div>
              <div className="p-space-md flex flex-col justify-between flex-grow">
                <div>
                  <span className="font-title-sm text-title-sm text-primary">
                    Bonded terminal sample record
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    TRÏNŪ maintains dual custody control over inbound goods with Federal Customs
                    inspection personnel present on site.
                  </p>
                </div>
                <Link
                  to="/track-cargo"
                  className="mt-space-md inline-flex items-center gap-1 font-title-sm text-title-sm text-secondary hover:underline"
                >
                  <span>View Cargo Milestone History</span>
                  <Icon name="arrow_forward" className="text-[16px]" />
                </Link>
              </div>
            </div>
          </div>

          <div className="w-full bg-surface-container-low rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row gap-space-lg items-start">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0 text-secondary">
              <Icon name="shield_person" className="text-[28px]" />
            </div>
            <div className="flex flex-col gap-space-sm flex-grow">
              <h4 className="font-title-lg text-title-lg text-primary">
                Safe Authenticity Notice & Statutory Fraud Advisory
              </h4>
              <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                Only safe authenticity data is shown. Altered or counterfeit documents will fail
                verification. Consignee details, commercial invoice values, and specific itemized
                contents remain redacted in compliance with federal trade data privacy standards.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-xs">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Need to report an unverified or disputed document? Contact our terminal legal and
                  compliance desk directly at{' '}
                  <a className="font-semibold text-secondary hover:underline" href="mailto:compliance@trinu.ng">
                    compliance@trinu.ng
                  </a>
                  .
                </span>
                <a
                  href="mailto:compliance@trinu.ng?subject=Disputed%20Document%20TRN-DOC-VAL-88219-NCS"
                  className="px-space-md py-space-xs bg-surface-container-highest text-primary rounded-lg font-title-sm text-title-sm hover:bg-outline-variant transition-colors inline-flex items-center gap-1 flex-shrink-0"
                >
                  <Icon name="flag" className="text-[16px]" />
                  <span>Dispute Record</span>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
            <div className="mb-space-md">
              <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
                Integrity Architecture
              </span>
              <h3 className="font-headline-sm text-headline-sm text-primary mt-1">
                How the demo code match works
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-lg">
              {[
                { n: 1, t: 'Enter the sample code', d: 'Use the example verification code displayed above to test the local interface.' },
                { n: 2, t: 'Local comparison', d: 'The code is compared with a single sample record bundled in this UI prototype.' },
                { n: 3, t: 'No external check', d: 'No cryptographic authority, Customs system, or backend is queried by this demonstration.' },
              ].map((item) => (
                <div key={item.n} className="flex flex-col gap-space-xs">
                  <div className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold font-title-sm">
                    {item.n}
                  </div>
                  <h4 className="font-title-md text-title-md text-primary mt-space-xs">{item.t}</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {item.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
          </> : (
            <div role="alert" className="max-w-3xl border-l-4 border-error bg-error-container p-6 text-on-error-container">
              <h2 className="font-headline-sm text-headline-sm font-bold">No matching demo document</h2>
              <p className="mt-2 font-body-md text-body-md leading-relaxed">Check the code and try the supplied sample. Verification on this page uses local sample data only.</p>
              <button type="button" onClick={() => handleQrScan()} className="mt-4 font-title-sm text-title-sm font-semibold underline underline-offset-4">Fill the sample code</button>
            </div>
          )}
        </div>
      </section>}
    </div>
  );
}