import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="Shield Logo">🛡️</span>
          <span className="font-heading font-semibold text-lg text-blue-900">Hearthline Sentinel</span>
        </div>
        <Link href="/" className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm">
          Return Home
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-heading font-bold text-3xl text-slate-900 tracking-tight">
          Privacy, Consent, and Compliance Notice
        </h1>
        
        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          At Hearthline Sentinel, we prioritize user privacy, clinical integrity, and compliance. This notice outlines how your data is handled, stored, and utilized.
        </p>

        {/* Not a Diagnosis */}
        <section className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-xl">
          <h2 className="font-bold text-amber-800 text-sm uppercase tracking-wider mb-2">⚠️ Important: Not a Clinical Diagnosis</h2>
          <p className="text-xs text-amber-900 leading-relaxed">
            Hearthline Sentinel provides automated emotional distress diagnostics, voice sentiment indices, and checking metrics. These outputs are intended to assist clinical teams and supervisors by surfacing potential warning flags. They are **NOT** medical diagnoses, psychiatric evaluation tests, or replacement therapies. In crisis events, please call Tele-MANAS (`14416`) or KIRAN (`1800-599-0019`) directly.
          </p>
        </section>

        {/* HIPAA */}
        <section className="mt-8 flex flex-col gap-4">
          <h2 className="font-heading font-bold text-lg text-slate-900">🛡️ HIPAA & Data Encryptions</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            All user data, transcripts, check-in histories, and risk records are encrypted both in transit (TLS 1.3) and at rest (AES-256). Clerk-managed authentication handles user profile metadata safely without leaking sensitive information.
          </p>
        </section>

        {/* Consent options */}
        <section className="mt-8 flex flex-col gap-4">
          <h2 className="font-heading font-bold text-lg text-slate-900">🔒 Consent-First Storage Policies</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hearthline Sentinel operates under a strict consent model. During onboarding or through the account settings panel, patients can toggle preferences:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-600 flex flex-col gap-2 pl-2">
            <li>
              <strong>Camera Consent</strong>: Allows the local webcam feed to estimate facial distress markers. No video is ever stored on our servers.
            </li>
            <li>
              <strong>Microphone Consent</strong>: Allows voice sentiment tracking and live speech-to-text translation.
            </li>
            <li>
              <strong>At-Rest Storage Policies</strong>: If you select "Session Only" storage, no session logs or voice transcripts are written to the database. They are processed entirely in-memory and discarded immediately upon session closure.
            </li>
          </ul>
        </section>

        {/* Contacts */}
        <section className="mt-12 border-t border-slate-200 pt-8 text-center sm:text-left text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>Hearthline Sentinel Compliance Operations</span>
          <div className="flex gap-4">
            <a href="mailto:compliance@hearthline.in" className="hover:underline text-blue-600">compliance@hearthline.in</a>
            <a href="tel:14416" className="hover:underline text-blue-600">Tele-MANAS (14416)</a>
          </div>
        </section>
      </main>
    </div>
  );
}
