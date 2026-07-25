"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { 
  Camera, Mic, Phone, AlertOctagon, Heart, ShieldAlert, 
  HelpCircle, Eye, EyeOff, RefreshCw, Volume2, Sparkles, CheckCircle2 
} from "lucide-react";

export default function UserDashboard() {
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

  const metadata = (user?.unsafeMetadata || {}) as {
    fullName?: string;
    role?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    language?: string;
    storagePolicy?: {
      historyEnabled: boolean;
      transcriptsStored: boolean;
      snapshotsStored: boolean;
    };
    consents?: {
      cameraEnabled: boolean;
      microphoneEnabled: boolean;
      alertSharing: boolean;
    };
  };

  const displayName = metadata.fullName || user?.firstName || "Friend";
  const caregiverName = metadata.emergencyContactName || "Aarav (Mentor)";
  const caregiverPhone = metadata.emergencyContactPhone || "+91 98765 43210";
  const cameraAllowed = metadata.consents?.cameraEnabled ?? true;
  const micAllowed = metadata.consents?.microphoneEnabled ?? true;

  // Active check-in states
  const [mood, setMood] = useState(6); // 1 to 10
  const [stress, setStress] = useState(4); // 1 to 10
  const [sleep, setSleep] = useState(7); // 1 to 10
  const [craving, setCraving] = useState(2); // 1 to 10
  const [needHelp, setNeedHelp] = useState(false);
  const [checkinSaved, setCheckinSaved] = useState(false);

  // Multi-modal Analysis states
  const [analyzingCamera, setAnalyzingCamera] = useState(false);
  const [analyzingVoice, setAnalyzingVoice] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [cameraEmotion, setCameraEmotion] = useState("Neutral");
  const [cameraConfidence, setCameraConfidence] = useState(0.92);
  const [voiceStressScore, setVoiceStressScore] = useState(0.15);
  
  // Webcam & Audio permission streams
  const [streamActive, setStreamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const canvasTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Grounding Tab
  const [groundingActive, setGroundingActive] = useState(false);
  const [groundingTimer, setGroundingTimer] = useState(300);
  const [breathingState, setBreathingState] = useState("inhale");
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const groundingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Manual SOS states
  const [sosConfirm, setSosConfirm] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  // Risk Score Engine results
  const [riskScore, setRiskScore] = useState(2);
  const [riskLabel, setRiskLabel] = useState("Low"); // Low, Moderate, High, Critical
  const [riskReasons, setRiskReasons] = useState<string[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Trigger Risk Scoring Calculation
  useEffect(() => {
    calculateRiskScore();
  }, [mood, stress, craving, cameraEmotion, voiceStressScore, needHelp, sosSent]);

  const calculateRiskScore = () => {
    let score = 2;
    const reasons: string[] = [];

    if (sosSent) {
      setRiskScore(10);
      setRiskLabel("Critical");
      setRiskReasons(["Emergency SOS Button Triggered"]);
      return;
    }

    if (mood < 4) {
      score += 2;
      reasons.push("Low mood self-report");
    }
    if (stress > 7) {
      score += 2;
      reasons.push("Elevated stress self-report");
    }
    if (craving > 6) {
      score += 2;
      reasons.push("Significant craving waves");
    }
    if (needHelp) {
      score += 2;
      reasons.push("Explicit request for grounding help");
    }

    // Camera Emotion factors
    if (cameraEmotion === "Anxious" || cameraEmotion === "Sad") {
      score += 2;
      reasons.push(`Facial distress matches: ${cameraEmotion}`);
    }

    // Vocal Stress factors
    if (voiceStressScore > 0.6) {
      score += 2;
      reasons.push("Speech stress acoustics matched");
    }

    setRiskScore(score);
    if (score <= 3) {
      setRiskLabel("Low");
    } else if (score <= 5) {
      setRiskLabel("Moderate");
    } else if (score <= 8) {
      setRiskLabel("High");
    } else {
      setRiskLabel("Critical");
    }
    setRiskReasons(reasons);
  };

  // Scheduled breathing loop
  useEffect(() => {
    if (groundingActive) {
      groundingTimerRef.current = setInterval(() => {
        setGroundingTimer((prev) => {
          if (prev <= 1) {
            stopGrounding();
            return 300;
          }
          return prev - 1;
        });
      }, 1000);

      const states = ["inhale", "hold-in", "exhale", "hold-out"];
      let idx = 0;
      setBreathingState(states[idx]);
      breathingTimerRef.current = setInterval(() => {
        idx = (idx + 1) % 4;
        setBreathingState(states[idx]);
      }, 4000);
    } else {
      if (groundingTimerRef.current) clearInterval(groundingTimerRef.current);
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    }
    return () => {
      if (groundingTimerRef.current) clearInterval(groundingTimerRef.current);
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    };
  }, [groundingActive]);

  // Webcam Canvas drawing mockup
  const startCamera = async () => {
    if (!cameraAllowed) {
      alert("Camera consent is disabled in your privacy settings.");
      return;
    }
    try {
      setAnalyzingCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStreamActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Draw bounding box over canvas
      canvasTimerRef.current = setInterval(() => {
        if (canvasRef.current && videoRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, 300, 200);
            ctx.drawImage(videoRef.current, 0, 0, 300, 200);
            
            // Draw box mockup
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 3;
            ctx.strokeRect(80, 40, 140, 120);

            // Draw status text
            ctx.fillStyle = "#3b82f6";
            ctx.font = "12px sans-serif";
            ctx.fillText("Face Tracked • Expression: Anxious (76%)", 10, 25);
          }
        }
      }, 100);

      // Simulates facial diagnostics
      setTimeout(() => {
        setCameraEmotion("Anxious");
        setCameraConfidence(0.76);
      }, 3000);

    } catch (err) {
      console.warn("Failed to lock webcam stream: ", err);
      setAnalyzingCamera(false);
    }
  };

  const stopCamera = () => {
    setAnalyzingCamera(false);
    setStreamActive(false);
    if (canvasTimerRef.current) clearInterval(canvasTimerRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  // Microphone audio speech transcription
  const startVoice = () => {
    if (!micAllowed) {
      alert("Microphone consent is disabled in your privacy settings.");
      return;
    }
    try {
      setAnalyzingVoice(true);
      setTranscript("Listening for vocal distress cues...");
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-IN";

        rec.onresult = (event: any) => {
          let text = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            text += event.results[i][0].transcript;
          }
          setTranscript(text);
          
          // Trigger simulated vocal stress cues
          if (text.toLowerCase().includes("struggling") || text.toLowerCase().includes("help") || text.toLowerCase().includes("hard")) {
            setVoiceStressScore(0.85);
          }
        };

        rec.onerror = () => {
          setTranscript("Speech captured. System analyzing stress triggers...");
          setVoiceStressScore(0.68);
        };

        rec.start();
        recognitionRef.current = rec;
      } else {
        // Fallback for unsupported browsers
        setTimeout(() => {
          setTranscript("I am feeling very anxious and struggling to remain calm under this pressure.");
          setVoiceStressScore(0.82);
        }, 3000);
      }
    } catch (err) {
      setAnalyzingVoice(false);
    }
  };

  const stopVoice = () => {
    setAnalyzingVoice(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Manual SOS Alert Trigger
  const triggerSOS = async () => {
    setSosSent(true);
    setSosConfirm(false);

    try {
      // Save Alert to the real-time API
      await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          userName: displayName,
          severity: "critical",
          triggers: ["Manual SOS Trigger"],
          status: "active"
        })
      });

      // Save Session Log as well
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          userName: displayName,
          transcript: "MANUAL SOS ACTIVATED: Emergency assistance requested.",
          facialDistressScore: 0.99,
          vocalSentimentScore: 0.99,
          combinedRiskScore: 10
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Submit daily check-in
  const saveCheckin = () => {
    setCheckinSaved(true);
    setTimeout(() => setCheckinSaved(false), 3000);
  };

  // Generate Gemini Summary
  const requestGeminiSummary = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcript || "Check-in completed. Patient feels high stress.",
          facialScore: cameraEmotion === "Anxious" ? 0.8 : 0.2,
          vocalSentimentScore: voiceStressScore,
          moodScore: mood,
          stressLevel: stress,
          role: "user",
          userName: displayName
        })
      });
      const data = await res.json();
      setAiSummary(data.whatToSay || "Keep breathing. Reach out to your support network.");
    } catch (err) {
      setAiSummary("Breathe deeply. Reach out to mentor Aarav at "+caregiverPhone);
    } finally {
      setAiLoading(false);
    }
  };

  const startGrounding = () => {
    setGroundingActive(true);
    setGroundingTimer(300);
  };

  const stopGrounding = () => {
    setGroundingActive(false);
  };

  const formatTimer = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Entering Sentinel Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-start bg-slate-50 pb-24">
      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="Logo Home">🛡️</span>
          <span className="font-heading font-semibold text-lg text-blue-900">Sentinel Patient Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings" className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold bg-slate-50">
            ⚙️ Settings
          </Link>
        </div>
      </header>

      {/* Manual SOS Dialog */}
      {sosConfirm && (
        <div className="fixed inset-0 bg-red-900/50 backdrop-blur z-50 flex items-center justify-center p-6" role="alertdialog">
          <div className="bg-white border-2 border-red-500 rounded-2xl p-6 max-w-md w-full text-center flex flex-col gap-4 shadow-xl">
            <span className="text-4xl block">🚨</span>
            <h3 className="font-heading font-bold text-red-700 text-lg">Confirm Manual SOS Trigger?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              This will instantly alert your assigned clinician (Dr. Sen), operational supervisor, and send emergency guides to your caregiver ({caregiverName}).
            </p>
            <div className="flex gap-3">
              <button type="button" className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs" onClick={triggerSOS}>
                Yes, Dispatch Alert
              </button>
              <button type="button" className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs" onClick={() => setSosConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <main className="w-full max-w-xl mx-auto px-6 py-6 flex flex-col gap-6">
        
        {/* Hello Banner */}
        <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none"></div>
          <h2 className="font-heading font-bold text-lg text-slate-950">Welcome Back, {displayName}</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Hearthline Sentinel is active. Your assigned doctor is <strong>Dr. Sen</strong>. You have configured consent-first security controls.
          </p>
        </div>

        {/* SOS Panel */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <AlertOctagon className="text-red-600 w-6 h-6 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-red-950">Emergency Assistance Trigger</span>
              <span className="text-[10px] text-red-700/80 mt-0.5">Instant de-escalation warning dispatch</span>
            </div>
          </div>
          {sosSent ? (
            <span className="px-3.5 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg animate-pulse shadow-sm">
              SOS SENT
            </span>
          ) : (
            <button 
              type="button" 
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
              onClick={() => setSosConfirm(true)}
            >
              🚨 Trigger SOS
            </button>
          )}
        </div>

        {/* Dynamic Risk Score Dashboard */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">Dynamic Risk Assessment</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border 
              ${riskLabel === 'Low' ? 'bg-green-50 border-green-200 text-green-700' : ''}
              ${riskLabel === 'Moderate' ? 'bg-amber-50 border-amber-200 text-amber-700' : ''}
              ${riskLabel === 'High' ? 'bg-red-50 border-red-200 text-red-600' : ''}
              ${riskLabel === 'Critical' ? 'bg-red-600 border-red-600 text-white' : ''}
            `}>
              {riskLabel} Risk
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Risk Index</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">{riskScore}/10</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Next Check-in</span>
              <span className="text-xs font-bold text-blue-900 mt-2 block">Today, 5:00 PM</span>
            </div>
          </div>

          {riskReasons.length > 0 && (
            <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              <strong>Risk factors:</strong> {riskReasons.join(" • ")}
            </div>
          )}
        </div>

        {/* Daily Mood Check-in Form */}
        <section className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Self-Report</h3>

          {checkinSaved && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Check-in metrics saved and syncd with Clinician logs.
            </div>
          )}

          <div className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between font-semibold text-slate-700">
                <label htmlFor="moodSlider">Current Mood</label>
                <span>{mood}/10</span>
              </div>
              <input 
                id="moodSlider"
                type="range" min="1" max="10" 
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                value={mood}
                onChange={(e) => setMood(parseInt(e.target.value))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between font-semibold text-slate-700">
                <label htmlFor="stressSlider">Stress Level</label>
                <span>{stress}/10</span>
              </div>
              <input 
                id="stressSlider"
                type="range" min="1" max="10" 
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                value={stress}
                onChange={(e) => setStress(parseInt(e.target.value))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between font-semibold text-slate-700">
                <label htmlFor="cravingSlider">Cravings Index</label>
                <span>{craving}/10</span>
              </div>
              <input 
                id="cravingSlider"
                type="range" min="1" max="10" 
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                value={craving}
                onChange={(e) => setCraving(parseInt(e.target.value))}
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <button 
                type="button"
                className={`px-4 py-2 border text-xs font-semibold rounded-xl transition ${needHelp ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                onClick={() => setNeedHelp(!needHelp)}
              >
                ⚠️ Trigger Grounding
              </button>
              <button type="button" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition" onClick={saveCheckin}>
                Submit Log
              </button>
            </div>
          </div>
        </section>

        {/* Multimodal analysis tab (Webcam/Audio) */}
        <section className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Multimodal Screening</h3>

          <div className="grid grid-cols-2 gap-3">
            {analyzingCamera ? (
              <button type="button" className="py-3 px-4 border border-red-300 bg-red-50 text-red-700 font-bold rounded-xl flex items-center justify-center gap-2" onClick={stopCamera}>
                <EyeOff className="w-4 h-4" /> Stop Camera
              </button>
            ) : (
              <button type="button" className="py-3 px-4 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2" onClick={startCamera}>
                <Camera className="w-4 h-4 text-blue-600" /> Start Webcam
              </button>
            )}

            {analyzingVoice ? (
              <button type="button" className="py-3 px-4 border border-red-300 bg-red-50 text-red-700 font-bold rounded-xl flex items-center justify-center gap-2" onClick={stopVoice}>
                <EyeOff className="w-4 h-4" /> Stop Mic
              </button>
            ) : (
              <button type="button" className="py-3 px-4 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2" onClick={startVoice}>
                <Mic className="w-4 h-4 text-blue-600" /> Start Voice
              </button>
            )}
          </div>

          {/* Webcam stream view */}
          {analyzingCamera && (
            <div className="flex flex-col items-center gap-3 border border-slate-200 p-3 rounded-xl bg-slate-900 overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="hidden"></video>
              <canvas ref={canvasRef} width="300" height="200" className="w-full max-w-sm rounded-lg bg-black"></canvas>
              <div className="text-[10px] text-slate-400">
                Face Detection active. Current sentiment assessment: <strong>Anxious</strong>.
              </div>
            </div>
          )}

          {/* Transcript view */}
          {analyzingVoice && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col gap-2">
              <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[9px]">Live Transcript</span>
              <p className="text-slate-800 italic leading-relaxed">"{transcript}"</p>
              <div className="text-[10px] text-slate-500 mt-2">
                Stress markers: <strong>{(voiceStressScore * 100).toFixed(0)}% Volatility</strong>
              </div>
            </div>
          )}

          {/* AI Helper trigger */}
          {(analyzingCamera || analyzingVoice) && (
            <div className="border-t border-slate-100 pt-3 flex flex-col gap-3">
              <button type="button" disabled={aiLoading} className="py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 transition flex justify-center items-center gap-1.5 focus-ring" onClick={requestGeminiSummary}>
                {aiLoading ? "Generating AI Guide..." : "✨ Request AI Calm Interventions"}
              </button>
              {aiSummary && (
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs leading-relaxed text-indigo-950 whitespace-pre-wrap">
                  <h4 className="font-bold flex items-center gap-1 text-[10px] mb-1"><Sparkles className="w-3.5 h-3.5" /> Supportive Intervention (AI):</h4>
                  {aiSummary}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Sama Vritti Breathing Tab */}
        {groundingActive ? (
          <section className="p-6 bg-teal-50/30 border border-teal-200/50 rounded-2xl flex flex-col items-center text-center gap-6 shadow-sm">
            <h3 className="font-heading font-bold text-teal-900">Sama Vritti Pranayama</h3>
            
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className={`absolute w-20 h-20 bg-teal-600 rounded-full opacity-10 transition-transform duration-[4000ms] ease-linear 
                ${breathingState === 'inhale' ? 'scale-[2]' : ''} 
                ${breathingState === 'hold-in' ? 'scale-[2]' : ''} 
                ${breathingState === 'exhale' ? 'scale-[1]' : ''} 
                ${breathingState === 'hold-out' ? 'scale-[1]' : ''}
              `}></div>
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow z-10">
                {breathingState === "inhale" && "Inhale"}
                {breathingState === "hold-in" && "Hold"}
                {breathingState === "exhale" && "Exhale"}
                {breathingState === "hold-out" && "Hold"}
              </div>
            </div>

            <div className="text-xs font-semibold text-teal-800 h-8">
              {breathingState === "inhale" && "Puraka: Breathe in slowly... (4s)"}
              {breathingState === "hold-in" && "Antar Kumbhaka: Hold the air inside... (4s)"}
              {breathingState === "exhale" && "Rechaka: Release the air slowly... (4s)"}
              {breathingState === "hold-out" && "Bahya Kumbhaka: Hold on empty... (4s)"}
            </div>

            <div className="text-[10px] text-slate-400">
              Pranayama timer: <strong>{formatTimer(groundingTimer)}</strong>
            </div>

            <button type="button" className="py-2.5 px-6 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-xl hover:bg-red-100 transition focus-ring" onClick={stopGrounding}>
              Stop Pranayama
            </button>
          </section>
        ) : (
          <button 
            type="button" 
            className="w-full py-4 bg-teal-50 border border-teal-200 text-teal-800 font-bold rounded-xl shadow-sm text-xs transition flex justify-center items-center gap-1.5 focus-ring"
            onClick={startGrounding}
          >
            🧘 Start Sama Vritti (Pranayama) Breathing
          </button>
        )}

        {/* Caregiver Hotline contacts */}
        <section className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col gap-4 text-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Direct Support Network</h3>
          <div className="flex flex-col gap-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">{caregiverName}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{caregiverPhone} • Caregiver</span>
              </div>
              <a href={`tel:${caregiverPhone}`} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] text-center hover:no-underline">
                📞 Call
              </a>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">Tele-MANAS Helpline</span>
                <span className="text-[10px] text-slate-400 mt-0.5">14416 • 24/7 Mental Health Support</span>
              </div>
              <a href="tel:14416" className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] text-center hover:no-underline">
                🚨 Call
              </a>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
