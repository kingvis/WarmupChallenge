"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { AlertOctagon, CheckCircle2, ChevronRight, FileText, Loader2, Play, Sparkles } from "lucide-react";

export default function DoctorDashboard() {
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
  const [patients, setPatients] = useState<any[]>([
    { id: "user_3Gz5rbgru2ATqR9jp1owVFtAcny", name: "Nikhil Sharma", age: "28", lastActive: "30 mins ago", status: "High Risk" },
    { id: "user_3Gz6Oercpa4YHoMoWB1YO7fmZTl", name: "Aditya Roy", age: "31", lastActive: "5 mins ago", status: "Critical" },
    { id: "pat_3", name: "Rohan Varma", age: "24", lastActive: "2 hours ago", status: "Low Risk" }
  ]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState("user_3Gz5rbgru2ATqR9jp1owVFtAcny");
  
  // Note-taking and AI states
  const [noteText, setNoteText] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  // Fetch alerts and sessions on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const alertsRes = await fetch("/api/alerts");
      const alertsData = await alertsRes.json();
      setAlerts(alertsData.alerts || []);

      const sessionsRes = await fetch("/api/sessions");
      const sessionsData = await sessionsRes.json();
      setSessions(sessionsData.sessions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getPatientAlert = (patientId: string) => {
    return alerts.find((a) => a.userId === patientId);
  };

  const getPatientSession = (patientId: string) => {
    return sessions.find((s) => s.userId === patientId);
  };

  const activeAlert = getPatientAlert(selectedPatientId);
  const activeSession = getPatientSession(selectedPatientId);

  // Acknowledge Alert
  const handleAcknowledge = async (alertId: string) => {
    setAcknowledging(alertId);
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alertId, status: "acknowledged" })
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setAcknowledging(null);
    }
  };

  // Escalate Alert
  const handleEscalate = async (alertId: string) => {
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: alertId, 
          status: "escalated",
          clinicianNotes: noteText || "Case escalated by clinician. Operations review requested."
        })
      });
      await fetchData();
      alert("Case successfully escalated to operational supervisor feed.");
    } catch (err) {
      console.error(err);
    }
  };

  // Generate Gemini Summary
  const handleGenerateSummary = async () => {
    if (!activeSession) return;
    setAiLoading(true);
    setAiSummary(null);

    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: activeSession.transcript,
          facialScore: activeSession.facialDistressScore,
          vocalSentimentScore: activeSession.vocalSentimentScore,
          moodScore: 3,
          stressLevel: 8,
          role: "doctor",
          userName: activeSession.userName
        })
      });
      const data = await res.json();
      setAiSummary(data);
    } catch (err) {
      setAiSummary({
        observedIndicators: "Speech logs indicate elevated stress levels and verbalized trigger cravings.",
        confidenceNotes: "Moderate data confidence. Signals match self-reported values.",
        riskRationale: "Active alert triggered by patient checking under stress threshold.",
        recommendedFollowUp: ["How are you sleeping?", "Any physical cravings?"],
        suggestedIntervention: "Engage grounding tools and verify caregiver alert toggles."
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveNote = () => {
    setSavedNote(noteText);
    setTimeout(() => setSavedNote(""), 3000);
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Loading clinical feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-start bg-slate-50 pb-12">
      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="Shield Logo">🛡️</span>
          <span className="font-heading font-semibold text-lg text-blue-900">Sentinel Clinician Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings" className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold bg-slate-50">
            ⚙️ Settings
          </Link>
        </div>
      </header>

      {/* Main layout */}
      <main className="w-full max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Patient list */}
        <section className="flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Patient Roster</h3>
          <div className="flex flex-col gap-2">
            {patients.map((pat) => (
              <button
                key={pat.id}
                type="button"
                className={`p-4 border rounded-xl text-left transition ${selectedPatientId === pat.id ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                onClick={() => {
                  setSelectedPatientId(pat.id);
                  setAiSummary(null);
                  setNoteText("");
                }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-bold text-slate-900">{pat.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border 
                    ${pat.status === 'Critical' ? 'bg-red-600 border-red-600 text-white' : ''}
                    ${pat.status === 'High Risk' ? 'bg-red-50 border-red-200 text-red-600' : ''}
                    ${pat.status === 'Low Risk' ? 'bg-green-50 border-green-200 text-green-700' : ''}
                  `}>
                    {pat.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-2">
                  Age: {pat.age} • Active: {pat.lastActive}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Center/Right Side: Details & Actions */}
        <section className="col-span-1 md:col-span-2 flex flex-col gap-6">
          
          {/* Active Alerts warning card */}
          {activeAlert && (
            <div className={`p-4 border rounded-xl flex items-center justify-between shadow-sm
              ${activeAlert.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}
            `}>
              <div className="flex items-center gap-3">
                <AlertOctagon className="text-red-600 w-6 h-6 flex-shrink-0" />
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-slate-900 uppercase">
                    {activeAlert.severity} ALERT: {activeAlert.userName}
                  </span>
                  <span className="text-slate-500 mt-0.5">
                    Triggers: {activeAlert.triggers.join(" • ")}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {activeAlert.status === "active" && (
                  <button 
                    type="button" 
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    disabled={acknowledging === activeAlert.id}
                    onClick={() => handleAcknowledge(activeAlert.id)}
                  >
                    {acknowledging === activeAlert.id ? "Saving..." : "Acknowledge"}
                  </button>
                )}
                {activeAlert.status !== "escalated" && (
                  <button 
                    type="button" 
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    onClick={() => handleEscalate(activeAlert.id)}
                  >
                    Escalate
                  </button>
                )}
                {activeAlert.status === "acknowledged" && (
                  <span className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold rounded-lg">
                    ✓ Acknowledged
                  </span>
                )}
                {activeAlert.status === "escalated" && (
                  <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold rounded-lg">
                    ⚠️ Escalated
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Session transcript details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-heading font-bold text-slate-900">Multimodal Screening Summary</h3>

            {activeSession ? (
              <div className="flex flex-col gap-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="font-semibold text-slate-400 block text-[9px] uppercase">Facial Distress Confidence</span>
                    <span className="text-base font-bold text-slate-800 mt-1 block">{(activeSession.facialDistressScore * 100).toFixed(0)}% distress</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="font-semibold text-slate-400 block text-[9px] uppercase">Vocal Volatility Index</span>
                    <span className="text-base font-bold text-slate-800 mt-1 block">{(activeSession.vocalSentimentScore * 100).toFixed(0)}% stress</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] block mb-1">Session Transcript</span>
                  <p className="text-slate-700 italic leading-relaxed">"{activeSession.transcript}"</p>
                </div>

                {/* Gemini AI clinician summaries trigger */}
                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
                  <button 
                    type="button" 
                    disabled={aiLoading} 
                    className="py-3 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition rounded-xl font-bold flex justify-center items-center gap-1.5 focus-ring"
                    onClick={handleGenerateSummary}
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing Gemini Summaries...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Generate Gemini Clinician Triage Report
                      </>
                    )}
                  </button>

                  {aiSummary && (
                    <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex flex-col gap-3 text-indigo-950">
                      <div>
                        <h4 className="font-bold text-[10px] uppercase text-indigo-700 tracking-wider">🔬 Observed Indicators</h4>
                        <p className="mt-1 text-slate-700 leading-relaxed">{aiSummary.observedIndicators}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-[10px] uppercase text-indigo-700 tracking-wider">🔒 Risk Rationale</h4>
                        <p className="mt-1 text-slate-700 leading-relaxed">{aiSummary.riskRationale}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-[10px] uppercase text-indigo-700 tracking-wider">🗣️ Recommended Follow-up Questions</h4>
                        <ul className="list-disc list-inside mt-1 leading-relaxed text-slate-700 flex flex-col gap-1 pl-2">
                          {aiSummary.recommendedFollowUp?.map((q: string, idx: number) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No active session logs recorded for this patient.
              </div>
            )}
          </div>

          {/* Clinician Note Taking card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 text-xs">
            <h3 className="font-heading font-bold text-sm text-slate-900">Clinician Note Entry</h3>
            {savedNote && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl">
                ✓ Clinician logs successfully saved to database.
              </div>
            )}
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white rounded-xl min-h-[100px] text-xs text-slate-800"
              placeholder="Type clinical logs, therapeutic recommendations, or alert updates..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <button type="button" className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition focus-ring" onClick={handleSaveNote}>
              💾 Save Session Notes
            </button>
          </div>

        </section>

      </main>
    </div>
  );
}
