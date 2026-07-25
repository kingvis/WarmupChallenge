"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  const handleQuickExit = () => {
    window.location.replace("https://www.google.com");
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-slate-50">
      {/* Calm Animated Background Orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-200/30 blur-3xl animate-orb-1"></div>
        <div className="absolute top-1/2 right-10 w-80 h-80 rounded-full bg-teal-200/25 blur-3xl animate-orb-2"></div>
      </div>

      {/* Header Navigation */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="Hearthline Logo">🛡️</span>
          <span className="font-heading font-semibold text-xl tracking-tight text-blue-900">
            Hearthline <span className="text-sm font-bold text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full">Sentinel</span>
          </span>
        </div>

        <nav className="flex items-center gap-4" aria-label="Main Navigation">
          <Link 
            href="/privacy"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition mr-2"
          >
            HIPAA & Consent
          </Link>
          
          {isSignedIn ? (
            <div className="flex items-center gap-4">
              <Link 
                href="/onboarding"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition focus-ring focus-visible:outline-none"
              >
                Go to Hub
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
          <span>🧠</span> Multimodal Mental Wellness Monitoring Platform
        </div>
        
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
          Clinically Aware Distress Diagnostics & Escalation Triage
        </h1>
        
        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Hearthline Sentinel unites users, clinicians, supervisors, and caregiver support networks. By assessing facial distress markers, speech sentiment, and active wellness logs, we trigger deterministic alerts before crisis thresholds are crossed.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isSignedIn ? (
            <Link 
              href="/onboarding" 
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition focus-ring text-center"
            >
              Enter Dashboard Portal
            </Link>
          ) : (
            <>
              <Link 
                href="/sign-up" 
                className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition focus-ring text-center"
              >
                Start Platform Setup
              </Link>
              <Link 
                href="/sign-in" 
                className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition focus-ring text-center"
              >
                Access Account Login
              </Link>
            </>
          )}
        </div>

        {/* Dynamic Multimodal Grid */}
        <section className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-6 text-left" aria-label="Feature Roster">
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <span className="text-2xl mb-2 block">📷</span>
            <h2 className="font-heading font-semibold text-slate-900">Webcam Analysis</h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Browser-based facial distress indicators tracking emotional volatility, panic, and distress ratios.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <span className="text-2xl mb-2 block">🎙️</span>
            <h2 className="font-heading font-semibold text-slate-900">Voice Sentiment</h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Microphone voice analysis capturing semantic keywords and vocal stress metrics in real-time.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <span className="text-2xl mb-2 block">⚡</span>
            <h2 className="font-heading font-semibold text-slate-900">Risk Scoring Engine</h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Deterministic scoring tracking mood indices, missed logs, and facial markers for rapid clinician warnings.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <span className="text-2xl mb-2 block">🤖</span>
            <h2 className="font-heading font-semibold text-slate-900">Gemini Triages</h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Generates structured clinician notes, supervisor logs, and caregiver-safe status updates.
            </p>
          </div>
        </section>

        {/* Roles Breakdown */}
        <section className="mt-16 p-6 rounded-2xl bg-indigo-50/50 border border-slate-200 text-left">
          <h3 className="font-heading font-bold text-slate-900 mb-4 text-center sm:text-left">👥 Role-Based Collaboration System</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600">
            <div>
              <p className="font-bold text-blue-900 mb-1">👩‍⚕️ Clinicians (Doctors)</p>
              <p className="leading-relaxed">Receive instant session summaries, risk warnings, transcripts, and note-taking interfaces to track recovery curves.</p>
            </div>
            <div>
              <p className="font-bold text-teal-800 mb-1">👔 Operational Supervisors</p>
              <p className="leading-relaxed">Coordinate escalations when doctors are delayed. Tracks response SLA timers and dispatch parameters.</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-1">🏠 Family Caregivers</p>
              <p className="leading-relaxed">Get simplified, caregiver-safe notifications, supportive prompts, and boundary settings without medical file exposure.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Disclaimer */}
      <footer className="relative z-10 w-full border-t border-slate-200 bg-white/80 backdrop-blur py-8 mt-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="text-center md:text-left">
            <p className="font-semibold text-slate-800">HiPAA Compliance & Consent Notice</p>
            <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
              Hearthline Sentinel is a clinical screening dashboard platform. Users control consent permissions for camera, microphone, and log storage at all times.
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
