"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

// Situation Lists
const RECOVERY_SITUATIONS = {
  trigger: {
    id: "trigger",
    title: "I feel triggered",
    desc: "Cravings wave, environmental triggers, or emotional stress",
    icon: "🌪️",
  },
  help_now: {
    id: "help_now",
    title: "I need help now",
    desc: "Crisis moment or immediate relapse threat requiring urgent support",
    icon: "🚨",
  },
  talk_someone: {
    id: "talk_someone",
    title: "Help me talk to someone",
    desc: "Looking for the right words to connect with support",
    icon: "🗣️",
  },
  prevention: {
    id: "prevention",
    title: "I want prevention tools",
    desc: "Building safety buffers and planning ahead for triggers",
    icon: "🛡️",
  }
};

const CAREGIVER_SITUATIONS = {
  trigger: {
    id: "trigger",
    title: "Loved one is triggered",
    desc: "How to support when they are having cravings or distress",
    icon: "🌱",
  },
  help_now: {
    id: "help_now",
    title: "Loved one is in crisis",
    desc: "De-escalating urgent situations and safety guidelines",
    icon: "⚠️",
  },
  talk_someone: {
    id: "talk_someone",
    title: "Checking in with them",
    desc: "How to start conversations without making them defensive",
    icon: "💬",
  },
  prevention: {
    id: "prevention",
    title: "Relapse prevention steps",
    desc: "Boundary settings and preparing support strategies",
    icon: "🧱",
  }
};

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Guard routing: redirect if onboarding is not completed
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

  // Onboarding parameters loaded from metadata
  const metadata = (user?.unsafeMetadata || {}) as {
    fullName?: string;
    role?: "recovery" | "caregiver" | "both";
    supportStyle?: "gentle" | "direct" | "structured";
    calmingTone?: "soothing" | "mindful" | "motivational";
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    triggers?: string;
    copingStrategies?: string;
  };

  const userDisplayName = metadata.fullName || user?.firstName || "Friend";
  const userRole = metadata.role || "recovery";

  // Active dashboard states
  const [roleView, setRoleView] = useState<"recovery" | "caregiver">("recovery");
  const [selectedSituation, setSelectedSituation] = useState("trigger");
  const [recipient, setRecipient] = useState("sponsor"); // sponsor | family | friend
  const [language, setLanguage] = useState("english"); // english | hinglish | hindi

  // AI script generator states
  const [scriptText, setScriptText] = useState("");
  const [caregiverGuide, setCaregiverGuide] = useState({ whatToSay: "", whatToAvoid: "", boundaryTip: "", whenToEscalate: "" });
  const [aiSource, setAiSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sama Vritti (Pranayama) Breathing states
  const [activeTab, setActiveTab] = useState("home"); // home | grounding | plan
  const [groundingActive, setGroundingActive] = useState(false);
  const [groundingTimer, setGroundingTimer] = useState(300); // 5 minutes
  const [breathingState, setBreathingState] = useState("inhale"); // inhale, hold-in, exhale, hold-out
  
  // Safety Plan states
  const [safetyPlanOpen, setSafetyPlanOpen] = useState(false);
  const [sponsorName, setSponsorName] = useState(metadata.emergencyContactName || "Aarav (Mentor)");
  const [sponsorPhone, setSponsorPhone] = useState(metadata.emergencyContactPhone || "+91 98765 43210");
  const [triggersInput, setTriggersInput] = useState(metadata.triggers || "");
  const [copingInput, setCopingInput] = useState(metadata.copingStrategies || "");
  const [savingPlan, setSavingPlan] = useState(false);

  // UI toast feedback
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [nextStepVisible, setNextStepVisible] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const breathRef = useRef<NodeJS.Timeout | null>(null);

  // Sync the UI role view to metadata role
  useEffect(() => {
    if (userRole === "caregiver") {
      setRoleView("caregiver");
    } else {
      setRoleView("recovery");
    }
  }, [userRole]);

  // Triggers API fetch on settings updates
  useEffect(() => {
    if (selectedSituation && isLoaded && user) {
      triggerAIRequest(selectedSituation, roleView, recipient, language);
    }
  }, [roleView, selectedSituation, recipient, language, isLoaded, user]);

  // Timer loop for box breathing
  useEffect(() => {
    if (groundingActive) {
      timerRef.current = setInterval(() => {
        setGroundingTimer((prev) => {
          if (prev <= 1) {
            triggerGroundingStop();
            return 300;
          }
          return prev - 1;
        });
      }, 1000);

      const states = ["inhale", "hold-in", "exhale", "hold-out"];
      let stateIdx = 0;
      setBreathingState(states[0]);

      breathRef.current = setInterval(() => {
        stateIdx = (stateIdx + 1) % 4;
        setBreathingState(states[stateIdx]);
      }, 4000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (breathRef.current) clearInterval(breathRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (breathRef.current) clearInterval(breathRef.current);
    };
  }, [groundingActive]);

  const triggerAIRequest = async (situationId: string, currentRole: string, currentRecipient: string, currentLanguage: string) => {
    setLoading(true);
    setError(null);
    setNextStepVisible(false);

    const list = currentRole === "recovery" ? RECOVERY_SITUATIONS : CAREGIVER_SITUATIONS;
    const situationName = (list as any)[situationId]?.title || situationId;

    try {
      if (currentRole === "recovery") {
        const res = await fetch("/api/generate-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ situation: situationName, recipient: currentRecipient, language: currentLanguage })
        });
        
        if (!res.ok) throw new Error("Server error");
        const data = await res.json();
        setScriptText(data.script);
        setAiSource(data.source);
      } else {
        const res = await fetch("/api/generate-caregiver-guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ situation: situationName })
        });
        
        if (!res.ok) throw new Error("Server error");
        const data = await res.json();
        setCaregiverGuide({
          whatToSay: data.whatToSay,
          whatToAvoid: data.whatToAvoid,
          boundaryTip: data.boundaryTip,
          whenToEscalate: data.whenToEscalate
        });
        setAiSource(data.source);
      }
    } catch (err: any) {
      console.warn("API failed, fallback to template: ", err.message);
      setError("Fallback Mode: Running safe local intervention modules.");
      setScriptText("Hey, I'm feeling triggered right now and experiencing intense cravings. Are you free for a quick call or check-in?");
      setCaregiverGuide({
        whatToSay: "I can see you're going through a really hard moment right now. I'm here with you.",
        whatToAvoid: "Avoid shame or blame. Prioritize listening over offering immediate lessons.",
        boundaryTip: "Remember that you cannot control their cravings, but you can control your own calm reaction.",
        whenToEscalate: "If they become verbally abusive or physically unsafe, contact professional help (Tele-MANAS) immediately."
      });
      setAiSource("offline");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSafetyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingPlan(true);
    try {
      // Direct integration to save metadata to Clerk
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          emergencyContactName: sponsorName.trim(),
          emergencyContactPhone: sponsorPhone.trim(),
          triggers: triggersInput.trim(),
          copingStrategies: copingInput.trim()
        }
      });
      displayToast("Safety Plan updated and saved to account");
      setSafetyPlanOpen(false);
    } catch (err) {
      console.error(err);
      displayToast("Failed to save plan.");
    } finally {
      setSavingPlan(false);
    }
  };

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(scriptText);
    displayToast("Copied script to clipboard");
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`"${scriptText}" - Shared via Hearthline Support`);
    const url = `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, "_blank");
    displayToast("WhatsApp sharing opened");
  };

  const displayToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const triggerGroundingStart = () => {
    setGroundingActive(true);
    setGroundingTimer(300);
    setActiveTab("grounding");
  };

  const triggerGroundingStop = () => {
    setGroundingActive(false);
    setActiveTab("home");
  };

  const formatTimer = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getContextualNextStep = () => {
    switch (selectedSituation) {
      case "help_now":
        return "1. Remove yourself from your current location immediately.\n2. Call your mentor/sponsor Aarav or family using the call buttons below.\n3. Call Tele-MANAS (14416) for immediate psychological support.\n4. Head to a busy, safe public area or relative's home.";
      case "trigger":
        return "1. Drink a glass of cold water (stops physical craving spikes).\n2. Start the Sama Vritti (Pranayama) 5-Minute Box Breathing tool.\n3. Send the prepared Hinglish or Hindi script to Aarav via the WhatsApp shortcut.";
      case "talk_someone":
        return "1. Click the 'Share on WhatsApp' button below.\n2. Select your contact and send the text.\n3. Give them 10 minutes. If they are busy, reach out to the KIRAN helpline (1800-599-0019).";
      case "prevention":
        return "1. Review your triggers and coping checklist under 'My Plan'.\n2. Do 5 minutes of deep breathing. Practice naming three positive things in your surrounding.\n3. Stay connected with support groups and mentors.";
      default:
        return "Take deep breaths, step away from triggers, and call Tele-MANAS (14416).";
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Entering dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-start bg-slate-50 pb-24">
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full shadow-lg" role="alert">
          {toastMessage}
        </div>
      )}

      {/* Header bar */}
      <header className="w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="Logo Home">🏡</span>
          <span className="font-heading font-semibold text-lg text-blue-900">Hearthline India</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings" className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold transition bg-slate-50">
            ⚙️ Settings
          </Link>
          <SignOutButton>
            <button type="button" className="px-3.5 py-1.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-lg text-xs font-semibold transition">
              🚪 Sign Out
            </button>
          </SignOutButton>
        </div>
      </header>

      {/* Main panel */}
      <main className="w-full max-w-xl mx-auto px-6 py-6 flex flex-col gap-6">
        {activeTab === "home" && (
          <>
            {/* Header role switcher tabs (Visible for hybrid roles) */}
            {userRole === "both" && (
              <div className="flex bg-slate-100 p-1 rounded-xl" role="tablist">
                <button 
                  type="button"
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${roleView === "recovery" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  onClick={() => setRoleView("recovery")}
                  role="tab"
                  aria-selected={roleView === "recovery"}
                >
                  My Recovery Plan
                </button>
                <button 
                  type="button"
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${roleView === "caregiver" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  onClick={() => setRoleView("caregiver")}
                  role="tab"
                  aria-selected={roleView === "caregiver"}
                >
                  Caregiver Guidance
                </button>
              </div>
            )}

            {/* Greeting */}
            <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-xl">
              <h2 className="font-heading font-bold text-lg text-slate-950">
                Namaste, {userDisplayName}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {roleView === "recovery" 
                  ? "We are in this together. Select a situation card to generate immediate coping responses without typing."
                  : "Thank you for supporting your loved one. Select a situation to configure safe caregiver responses."}
              </p>
            </div>

            {/* Situation cards */}
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Intake Selector</h3>
              <div className="flex flex-col gap-2">
                {Object.values(roleView === "recovery" ? RECOVERY_SITUATIONS : CAREGIVER_SITUATIONS).map((sit) => (
                  <button
                    key={sit.id}
                    type="button"
                    className={`flex items-center gap-4 p-4 text-left border rounded-xl transition ${selectedSituation === sit.id ? "bg-blue-50 border-blue-500 shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                    onClick={() => setSelectedSituation(sit.id)}
                    aria-pressed={selectedSituation === sit.id}
                  >
                    <span className="text-2xl p-2 bg-slate-50 rounded-full border border-slate-100 flex-shrink-0">{sit.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800">{sit.title}</span>
                      <span className="text-xs text-slate-400 mt-0.5">{sit.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Script Gen Panel (Recovery View) */}
            {roleView === "recovery" && (
              <section className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Prepared Script</h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase">AI Generator</span>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400">Send to:</span>
                    <div className="flex gap-2">
                      {["sponsor", "family", "friend"].map((rec) => (
                        <button 
                          key={rec}
                          type="button"
                          className={`px-3 py-1.5 border text-xs font-semibold rounded-lg transition ${recipient === rec ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                          onClick={() => setRecipient(rec)}
                        >
                          {rec === "sponsor" ? "Mentor" : rec.charAt(0).toUpperCase() + rec.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400">Language:</span>
                    <div className="flex gap-2">
                      {["english", "hinglish", "hindi"].map((lang) => (
                        <button 
                          key={lang}
                          type="button"
                          className={`px-3 py-1.5 border text-xs font-semibold rounded-lg transition ${language === lang ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                          onClick={() => setLanguage(lang)}
                        >
                          {lang === "hindi" ? "हिन्दी" : lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Output */}
                {loading ? (
                  <div className="flex flex-col gap-2.5 animate-pulse py-4">
                    <div className="h-4 bg-slate-100 rounded-md w-full"></div>
                    <div className="h-4 bg-slate-100 rounded-md w-11/12"></div>
                    <div className="h-4 bg-slate-100 rounded-md w-3/4"></div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 bg-slate-50 border-l-4 border-blue-600 text-slate-800 text-sm font-medium leading-relaxed italic rounded-r-xl">
                      "{scriptText}"
                    </div>
                    
                    <div className="flex gap-2.5">
                      <button type="button" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm focus-ring" onClick={copyScriptToClipboard}>
                        📋 Copy Script
                      </button>
                      <button type="button" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition shadow-sm focus-ring" onClick={shareOnWhatsApp}>
                        💬 WhatsApp Share
                      </button>
                      <button type="button" className="px-4 py-2.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition focus-ring" onClick={() => setNextStepVisible(!nextStepVisible)}>
                        {nextStepVisible ? "Hide Steps" : "Safe Steps"}
                      </button>
                    </div>
                  </div>
                )}

                {nextStepVisible && !loading && (
                  <div className="mt-2 p-4 bg-indigo-50 border border-indigo-100 text-slate-700 text-xs rounded-xl leading-relaxed whitespace-pre-line">
                    <h4 className="font-bold text-slate-900 mb-1.5">Contextual Actions:</h4>
                    {getContextualNextStep()}
                  </div>
                )}
              </section>
            )}

            {/* Caregiver view */}
            {roleView === "caregiver" && (
              <section className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Support Advice Card</h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase">AI Advisor</span>
                </div>

                {loading ? (
                  <div className="flex flex-col gap-2.5 animate-pulse py-4">
                    <div className="h-4 bg-slate-100 rounded-md w-full"></div>
                    <div className="h-4 bg-slate-100 rounded-md w-11/12"></div>
                    <div className="h-4 bg-slate-100 rounded-md w-3/4"></div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs">
                      <h4 className="font-bold text-emerald-800 uppercase tracking-wider mb-1">💡 What to Say</h4>
                      <p className="text-slate-700">"{caregiverGuide.whatToSay}"</p>
                    </div>

                    <div className="p-4 bg-red-50/50 border border-red-200 rounded-xl text-xs">
                      <h4 className="font-bold text-red-800 uppercase tracking-wider mb-1">🚫 What to Avoid</h4>
                      <p className="text-slate-700">{caregiverGuide.whatToAvoid}</p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-1">🛡️ Boundary Guidance</h4>
                      <p className="text-slate-600">{caregiverGuide.boundaryTip}</p>
                    </div>

                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs">
                      <h4 className="font-bold text-amber-800 uppercase tracking-wider mb-1">🚨 Safety Escalation</h4>
                      <p className="text-slate-700">{caregiverGuide.whenToEscalate}</p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Educational card info */}
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recovery Tips</h3>
              <div className="flex flex-col gap-3">
                <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-1">💡 Urge Surfing Technique</h4>
                  <p className="text-slate-600 leading-relaxed">Cravings peak within 15–20 minutes. Instead of fighting it, analyze the physical sensation, breathe into it, and watch the wave pass safely.</p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-1">🧘 Sama Vritti Breathing</h4>
                  <p className="text-slate-600 leading-relaxed">Box breathing (Equal Breathing) calms stress receptors. Follow the Pranayama tab prompts regularly during triggers.</p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Sama Vritti Grounding Tab */}
        {activeTab === "grounding" && (
          <section className="p-6 bg-blue-50/30 border border-blue-200/50 rounded-2xl flex flex-col items-center text-center gap-6">
            <h3 className="font-heading font-bold text-lg text-blue-900">Sama Vritti Pranayama</h3>
            <p className="text-xs text-slate-500 max-w-sm">Equal square breathing balances the autonomic nervous system. Focus on the central visual expander.</p>

            <div className={`relative w-40 h-40 flex items-center justify-center`}>
              {/* Pulsing visual element */}
              <div className={`absolute w-20 h-20 bg-blue-600 rounded-full opacity-10 transition-transform duration-[4000ms] ease-linear 
                ${breathingState === 'inhale' ? 'scale-[2]' : ''} 
                ${breathingState === 'hold-in' ? 'scale-[2]' : ''} 
                ${breathingState === 'exhale' ? 'scale-[1]' : ''} 
                ${breathingState === 'hold-out' ? 'scale-[1]' : ''}
              `}></div>
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md z-10">
                {breathingState === "inhale" && "Inhale"}
                {breathingState === "hold-in" && "Hold"}
                {breathingState === "exhale" && "Exhale"}
                {breathingState === "hold-out" && "Hold"}
              </div>
            </div>

            <div className="text-sm font-semibold text-blue-800 h-8">
              {breathingState === "inhale" && "Puraka: Breathe in slowly... (4s)"}
              {breathingState === "hold-in" && "Antar Kumbhaka: Hold the air inside... (4s)"}
              {breathingState === "exhale" && "Rechaka: Release the air slowly... (4s)"}
              {breathingState === "hold-out" && "Bahya Kumbhaka: Hold on empty... (4s)"}
            </div>

            <div className="text-xs text-slate-400">
              Remaining: <strong>{formatTimer(groundingTimer)}</strong>
            </div>

            <button type="button" className="py-2.5 px-6 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-xl hover:bg-red-100 transition focus-ring" onClick={triggerGroundingStop}>
              Stop Pranayama
            </button>
          </section>
        )}

        {/* Safety Plan Tab */}
        {activeTab === "plan" && (
          <section className="flex flex-col gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col gap-4">
              <h3 className="font-heading font-bold text-base text-slate-900">Safety & Check-ins</h3>
              <p className="text-xs text-slate-500">Persist your primary recovery contacts and personal triggers directly in your account.</p>

              <div className="flex flex-col gap-3 mt-2">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <h4 className="font-semibold text-blue-900">👤 Sponsor/Mentor Contact</h4>
                  <p className="text-slate-800 mt-1 font-medium">{sponsorName} • {sponsorPhone}</p>
                  <div className="flex gap-2 mt-3">
                    <a href={`tel:${sponsorPhone}`} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] text-center hover:no-underline">
                      📞 Call
                    </a>
                    <a href={`https://api.whatsapp.com/send?phone=${sponsorPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-[10px] text-center hover:no-underline">
                      💬 WhatsApp
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <h4 className="font-semibold text-slate-700">🎯 Triggers of Concern</h4>
                  <p className="text-slate-600 mt-1 whitespace-pre-wrap">{triggersInput || "No triggers logged yet. Edit plan to add."}</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <h4 className="font-semibold text-slate-700">⚙️ Personal Coping Rules</h4>
                  <p className="text-slate-600 mt-1 whitespace-pre-wrap">{copingInput || "No strategies logged yet. Edit plan to add."}</p>
                </div>
              </div>

              <button 
                type="button" 
                className="py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition focus-ring"
                onClick={() => setSafetyPlanOpen(true)}
              >
                📝 Edit Safety Profile
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Safety Plan Edit Modal */}
      {safetyPlanOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-xl border border-slate-100 flex flex-col gap-4 animate-slideUp">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-base text-slate-900">Update Safety Profile</h3>
              <button type="button" className="text-slate-400 hover:text-slate-600 text-lg" onClick={() => setSafetyPlanOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleUpdateSafetyPlan} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="modalSponsorName" className="text-xs font-semibold text-slate-700">Mentor Name</label>
                <input 
                  id="modalSponsorName"
                  type="text" 
                  className="px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="modalSponsorPhone" className="text-xs font-semibold text-slate-700">Mentor Phone</label>
                <input 
                  id="modalSponsorPhone"
                  type="text" 
                  className="px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900"
                  value={sponsorPhone}
                  onChange={(e) => setSponsorPhone(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="modalTriggers" className="text-xs font-semibold text-slate-700">Triggers</label>
                <textarea 
                  id="modalTriggers"
                  className="px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 min-h-[60px]"
                  placeholder="e.g. Peer triggers, late night exhaustion..."
                  value={triggersInput}
                  onChange={(e) => setTriggersInput(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="modalCoping" className="text-xs font-semibold text-slate-700">Coping Strategies</label>
                <textarea 
                  id="modalCoping"
                  className="px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 min-h-[60px]"
                  placeholder="e.g. Take cold showers, square pranayama breathing..."
                  value={copingInput}
                  onChange={(e) => setCopingInput(e.target.value)}
                />
              </div>

              <button type="submit" disabled={savingPlan} className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl transition shadow flex justify-center items-center gap-1.5">
                {savingPlan ? "Saving Plan..." : "💾 Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Safety Nav Bar bottom menu */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur z-40 py-2.5 px-6 flex justify-around items-center" role="navigation" aria-label="Safety menu">
        <button type="button" className={`flex flex-col items-center gap-1.5 text-[10px] font-semibold transition ${activeTab === "home" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`} onClick={() => { setActiveTab("home"); setGroundingActive(false); }}>
          <span className="text-lg">🏡</span>
          <span>Support Hub</span>
        </button>

        <button type="button" className={`flex flex-col items-center gap-1.5 text-[10px] font-semibold transition ${activeTab === "grounding" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`} onClick={triggerGroundingStart}>
          <span className="text-lg">🧘</span>
          <span>Pranayama</span>
        </button>

        <button type="button" className={`flex flex-col items-center gap-1.5 text-[10px] font-semibold transition ${activeTab === "plan" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`} onClick={() => { setActiveTab("plan"); setGroundingActive(false); }}>
          <span className="text-lg">📋</span>
          <span>My Plan</span>
        </button>

        <a href="tel:14416" className="flex flex-col items-center gap-1.5 text-[10px] font-semibold text-red-500 hover:text-red-700 hover:no-underline">
          <span className="text-lg">🚨</span>
          <span>Call 14416</span>
        </a>
      </div>
    </div>
  );
}
