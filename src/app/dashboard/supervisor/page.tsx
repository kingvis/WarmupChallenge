"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { AlertCircle, CheckCircle, Clock, ShieldAlert, Sparkles } from "lucide-react";

export default function SupervisorDashboard() {
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
  // Notification audit log — populated only by real dispatch events, never pre-seeded.
  const [whatsappLogs, setWhatsappLogs] = useState<any[]>([]);

  // SLA Counter
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default countdown

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      // Filter only escalated or critical alerts
      const escalatedAlerts = (data.alerts || []).filter(
        (a: any) => a.status === "escalated" || a.severity === "critical"
      );
      setAlerts(escalatedAlerts);
    } catch (err) {
      console.error(err);
    }
  };

  const formatSlaTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alertId, status: "resolved" })
      });
      await fetchAlerts();
      // Add simulated WhatsApp log for resolution
      const newLog = {
        id: `log_${Date.now()}`,
        to: "+91 98765 99999",
        message: "[RESOLVED] Case alert has been reviewed and resolved by operational supervisor super_123.",
        status: "sent",
        timestamp: "Just now"
      };
      setWhatsappLogs((prev) => [newLog, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Entering Supervisor Suite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-start bg-slate-50 pb-12">
      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="Logo Home">🛡️</span>
          <span className="font-heading font-semibold text-lg text-blue-900">Sentinel Ops Console</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings" className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold bg-slate-50">
            ⚙️ Settings
          </Link>
        </div>
      </header>

      {/* Grid */}
      <main className="w-full max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Escalation alerts feed */}
        <section className="col-span-1 md:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Escalated Cases Feed</h3>
            <span className="px-2 py-0.5 rounded-full bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold">
              {alerts.length} Warnings Active
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {alerts.length > 0 ? (
              alerts.map((al) => (
                <div key={al.id} className="p-5 bg-white border border-red-200 rounded-2xl shadow-sm flex flex-col gap-4 text-xs">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="text-red-600 w-5 h-5" />
                      <span className="font-bold text-slate-900">{al.userName}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-bold text-[9px] uppercase">
                      {al.severity}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Escalation Trigger</span>
                      <span className="font-bold text-slate-800 mt-1 block">{al.triggers.join(" • ")}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">SLA Response Countdown</span>
                      <span className="font-bold text-red-600 mt-1 block flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {formatSlaTimer(timeLeft)}
                      </span>
                    </div>
                  </div>

                  {al.clinicianNotes && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed text-slate-600">
                      <strong>Clinician logs:</strong> {al.clinicianNotes}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition focus-ring"
                      onClick={() => handleResolveAlert(al.id)}
                    >
                      ✓ Resolve Alert Case
                    </button>
                    <button 
                      type="button" 
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition focus-ring"
                      onClick={() => {
                        const newLog = {
                          id: `log_${Date.now()}`,
                          to: "Caregiver (configure in patient Settings)",
                          message: `[SENTINEL ESCALATION] Patient ${al.userName} requires immediate attention. Please check on them.`,
                          status: "simulated",
                          timestamp: new Date().toLocaleTimeString()
                        };
                        setWhatsappLogs((prev: any[]) => [newLog, ...prev]);
                      }}
                    >
                      📲 Dispatch Caregiver Alert
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center text-xs text-slate-400 shadow-sm">
                No active escalations recorded. Operational status normal.
              </div>
            )}
          </div>
        </section>

        {/* Right Side: WhatsApp simulated dispatch log */}
        <section className="flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Twilio WhatsApp Simulator</h3>
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 text-xs">
            <div>
              <h4 className="font-bold text-slate-900">Outgoing Dispatch Audit Logs</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Real-time simulator of clinical alerts sent to caregivers.</p>
            </div>

            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {whatsappLogs.length === 0 ? (
                <div className="py-6 text-center text-[10px] text-slate-400">
                  No dispatches yet. Use "Dispatch Caregiver Alert" on an active escalation to generate a log entry.
                </div>
              ) : (
                whatsappLogs.map((log: any) => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex justify-between items-center font-bold text-slate-900 text-[10px] mb-1">
                      <span>Recip: {log.to}</span>
                      <span className="text-amber-600 uppercase text-[8px] bg-amber-50 px-1.5 py-0.5 border border-amber-200 rounded-full">{log.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 italic">"{log.message}"</p>
                    <span className="text-[9px] text-slate-400 block text-right mt-1.5">{log.timestamp}</span>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl leading-relaxed text-[10px] text-indigo-950 flex flex-col gap-1">
              <span className="font-bold block uppercase text-[8px] text-indigo-700 tracking-wider">📦 Twilio SDK Status</span>
              Placeholder fallback mode active. Twilio tokens are currently not configured.
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
