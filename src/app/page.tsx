"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  // Quick safety exit redirecting to google.com (standard privacy practice in recovery apps)
  const handleQuickExit = () => {
    window.location.replace("https://www.google.com");
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-slate-50">
      {/* Calm Animated Background Orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-200/40 blur-3xl animate-orb-1"></div>
        <div className="absolute top-1/2 right-10 w-80 h-80 rounded-full bg-teal-200/35 blur-3xl animate-orb-2"></div>
      </div>

      {/* Header Navigation */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="Hearthline Home logo">🏡</span>
          <span className="font-heading font-semibold text-xl tracking-tight text-blue-900">
            Hearthline <span className="text-sm font-medium text-slate-500">India</span>
          </span>
        </div>

        <nav className="flex items-center gap-4" aria-label="Main Navigation">
          {isSignedIn ? (
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition focus-ring focus-visible:outline-none"
              >
                Go to Dashboard
              </Link>
              <UserButton />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition focus-ring focus-visible:outline-none"
              >
                Sign In
              </Link>
              <Link 
                href="/sign-up"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow focus-ring focus-visible:outline-none"
              >
                Create Account
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto px-6 flex flex-col justify-center text-center py-12">
        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider mx-auto">
          <span>✨</span> Smart Recovery & Caregiver Portal
        </div>
        
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-slate-900 tracking-tight leading-tight max-w-2xl mx-auto">
          A Calm, Safe Space for Grounding and Support
        </h1>
        
        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
          Navigating recovery or supporting a loved one is exhausting. Hearthline reduces cognitive load in high-stress moments with zero-typing assistance, Sama Vritti Pranayama, and instant WhatsApp crisis scripts.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isSignedIn ? (
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition focus-ring focus-visible:outline-none text-center"
            >
              Enter Support Hub
            </Link>
          ) : (
            <>
              <Link 
                href="/sign-up" 
                className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition focus-ring focus-visible:outline-none text-center"
              >
                Get Started (Free)
              </Link>
              <Link 
                href="/sign-in" 
                className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition focus-ring focus-visible:outline-none text-center"
              >
                Access My Account
              </Link>
            </>
          )}
        </div>

        {/* Feature Cards Grid */}
        <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left" aria-label="Product Features">
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <span className="text-3xl mb-3 block" role="img" aria-label="Intake Icon">🌪️</span>
            <h2 className="font-heading font-semibold text-lg text-slate-900">Zero-Typing Intake</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Identify cravings, anxiety, or emergency moments quickly through pre-configured tap selectors. No prompting needed.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <span className="text-3xl mb-3 block" role="img" aria-label="Breathing Icon">🧘</span>
            <h2 className="font-heading font-semibold text-lg text-slate-900">Sama Vritti Breathing</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              De-escalate panic attacks and cravings waves with a visual square breathing guide based on ancient yoga techniques.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <span className="text-3xl mb-3 block" role="img" aria-label="Caregiver Icon">👥</span>
            <h2 className="font-heading font-semibold text-lg text-slate-900">Caregiver Guidance</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Gain instant boundary instructions and dialogue structures explaining exactly what to say and what to avoid during crisis.
            </p>
          </div>
        </section>

        {/* Trust & Safety Banner */}
        <section className="mt-16 p-6 rounded-2xl bg-indigo-50/50 border border-slate-200 text-slate-700 text-sm max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <span className="text-3xl" role="img" aria-label="Shield lock icon">🛡️</span>
          <div className="text-left">
            <p className="font-semibold text-slate-900">Safe, Secure & Ad-Free</p>
            <p className="mt-1 text-xs text-slate-600">
              We respect your privacy. No data is shared with third parties. Tele-MANAS (`14416`) and KIRAN (`1800-599-0019`) support configurations are integrated directly in the dashboard.
            </p>
          </div>
        </section>
      </main>

      {/* Footer Disclaimer */}
      <footer className="relative z-10 w-full border-t border-slate-200 bg-white/80 backdrop-blur py-8 mt-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="text-center md:text-left">
            <p className="font-semibold text-slate-800">Medical Disclaimer</p>
            <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
              Hearthline is an educational wellness support application and is not a substitute for clinical psychiatric advice, diagnosis, or immediate emergency care.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="tel:14416" className="text-blue-600 font-semibold hover:underline">📞 Tele-MANAS (14416)</a>
            <a href="tel:18005990019" className="text-blue-600 font-semibold hover:underline">🛡️ KIRAN (1800-599-0019)</a>
            <button 
              type="button" 
              onClick={handleQuickExit} 
              className="px-3.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition border border-red-200"
            >
              ⚠️ Quick Safe Exit
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
