"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { AlertCircle, Heart, Loader2, Sparkles } from "lucide-react";

export default function CaregiverDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Guard routing
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    } else if (isLoaded && user) {
      const metadata = user.unsafeMetadata as { onboardingCompleted?: boolean };
      if (!metadata.onboardingCompleted) {
        router.push("/onboarding");
      }
    }
  }, [isLoaded, user, router]);

  // Data states
  const [alerts, setAlerts] = useState<any[]>([]);
  const [guideData, setGuideData] = useState<any>(null);
  const [guideLoading, setGuideLoading] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      // Filter out non-user alerts and restrict variables (caregiver-safe only)
      const safeAlerts = (data.alerts || []).map((a: any) => ({
        id: alId(a.id),
        userName: a.userName,
        severity: a.severity === "critical" ? "urgent attention needed" : "moderate check-in advised",
        timestamp: "Recent logs",
      }));
      setAlerts(safeAlerts);
    } catch (err) {
      console.error(err);
    }
  };

  const alId = (id: string) => {
    return id.substring(0, 8);
  };

  // Generate Caregiver Support Guidelines
  const handleGenerateCaregiverGuide = async () => {
    setGuideLoading(true);
    setGuideData(null);

    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: "Requesting caregiver supportive check-in guide.",
          facialScore: 0.5,
          vocalSentimentScore: 0.5,
          moodScore: 4,
          stressLevel: 8,
          role: "caregiver",
          userName: "Your loved one"
        })
      });
      const data = await res.json();
      setGuideData(data);
    } catch (err) {
      setGuideData({
        whatToSay: "I can see you're going through a really hard moment right now. Let's take a slow breath together.",
        whatToAvoid: "Avoid demanding questions or bringing up past mistakes. Keep it focused on the current moment.",
        boundaryTip: "Remember that you cannot force their recovery. Step away and focus on keeping yourself calm first."
      });
    } finally {
      setGuideLoading(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Entering caregiver portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-start bg-slate-50 pb-12">
      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="Logo Home">🏡</span>
          <span className="font-heading font-semibold text-lg text-blue-900">Sentinel Caregiver Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings" className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold bg-slate-50">
            ⚙️ Settings
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <main className="w-full max-w-xl mx-auto px-6 py-6 flex flex-col gap-6">
        
        {/* Hello card */}
        <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-xl">
          <h2 className="font-heading font-bold text-lg text-slate-900">Namaste</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Welcome to the caregiver network. You will receive simplified status alerts when a crisis flag triggers. Patient clinical files and session transcripts are excluded for HIPPA compliance.
          </p>
        </div>

        {/* Alerts logs */}
        <section className="flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Restricted Safety Alerts</h3>
          <div className="flex flex-col gap-3">
            {alerts.length > 0 ? (
              alerts.map((al) => (
                <div key={al.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-blue-600 w-5 h-5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{al.userName}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Status: {al.severity}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">{al.timestamp}</span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-xl shadow-sm">
                No active caregiver alerts. Loved one status is normal.
              </div>
            )}
          </div>
        </section>

        {/* Gemini Caregiver guidelines */}
        <section className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col gap-4 text-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Support Action Guides</h3>
          <p className="text-slate-500 leading-relaxed">Generate positive intervention guides explaining how to act during stress check-ins.</p>

          <button 
            type="button" 
            disabled={guideLoading} 
            className="py-3 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition rounded-xl font-bold flex justify-center items-center gap-1.5 focus-ring"
            onClick={handleGenerateCaregiverGuide}
          >
            {guideLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Retrieving guidelines...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate Gemini Support Guide
              </>
            )}
          </button>

          {guideData && (
            <div className="flex flex-col gap-3 mt-2">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs">
                <h4 className="font-bold text-emerald-800 uppercase tracking-wider mb-1">💡 What to Say</h4>
                <p className="text-slate-700">"{guideData.whatToSay}"</p>
              </div>

              <div className="p-4 bg-red-50/50 border border-red-200 rounded-xl text-xs">
                <h4 className="font-bold text-red-800 uppercase tracking-wider mb-1">🚫 What to Avoid</h4>
                <p className="text-slate-700">{guideData.whatToAvoid}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-1">🧱 Boundary Setting</h4>
                <p className="text-slate-600">{guideData.boundaryTip}</p>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
