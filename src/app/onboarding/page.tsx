"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("recovery"); // recovery | caregiver | both
  const [supportStyle, setSupportStyle] = useState("gentle"); // gentle | direct | structured
  const [calmingTone, setCalmingTone] = useState("soothing"); // soothing | mindful | motivational
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user is loaded and already onboarded, send them directly to the dashboard
  useEffect(() => {
    if (isLoaded && user) {
      const metadata = user.unsafeMetadata as { onboardingCompleted?: boolean; fullName?: string };
      if (metadata.onboardingCompleted) {
        router.push("/dashboard");
      } else if (user.fullName || user.firstName) {
        // Pre-fill name from Clerk profile if available
        setFullName(user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim());
      }
    }
  }, [isLoaded, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (user) {
        // Update user metadata in Clerk (persisted globally across sessions)
        await user.update({
          unsafeMetadata: {
            onboardingCompleted: true,
            fullName: fullName.trim(),
            role,
            supportStyle,
            calmingTone,
            emergencyContactName: emergencyContactName.trim(),
            emergencyContactPhone: emergencyContactPhone.trim(),
            triggers: "",
            copingStrategies: ""
          }
        });
        router.push("/dashboard");
      } else {
        throw new Error("No authenticated user session found.");
      }
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err?.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Preparing your safe space...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center p-6 bg-slate-50 overflow-hidden">
      {/* Calm Animated Background Orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-200/25 blur-3xl animate-orb-1"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-teal-200/20 blur-3xl animate-orb-2"></div>
      </div>

      <div className="relative z-10 w-full max-w-xl mx-auto bg-white border border-slate-200 shadow-md rounded-2xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <span className="text-4xl" role="img" aria-label="Heart badge logo">🏡</span>
          <h1 className="font-heading font-bold text-2xl text-slate-900 mt-2">Welcome to Hearthline</h1>
          <p className="text-sm text-slate-500 mt-1">Let's customize your healing dashboard to reduce stress.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Full Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="fullName" className="text-sm font-semibold text-slate-800">Your Full Name</label>
            <input 
              id="fullName"
              type="text" 
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 text-sm focus-ring"
              placeholder="e.g. Aarav Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Primary Role */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-800">Your Primary Role</span>
            <div className="grid grid-cols-3 gap-3">
              <button 
                type="button" 
                className={`py-3 px-4 border text-sm font-medium rounded-xl transition ${role === 'recovery' ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                onClick={() => setRole("recovery")}
              >
                In Recovery
              </button>
              <button 
                type="button" 
                className={`py-3 px-4 border text-sm font-medium rounded-xl transition ${role === 'caregiver' ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                onClick={() => setRole("caregiver")}
              >
                Caregiver
              </button>
              <button 
                type="button" 
                className={`py-3 px-4 border text-sm font-medium rounded-xl transition ${role === 'both' ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                onClick={() => setRole("both")}
              >
                Both Roles
              </button>
            </div>
          </div>

          {/* Calming Tone */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-800">Preferred Support Style</span>
            <div className="grid grid-cols-3 gap-3">
              <button 
                type="button" 
                className={`py-3 px-4 border text-sm font-medium rounded-xl transition ${supportStyle === 'gentle' ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                onClick={() => setSupportStyle("gentle")}
              >
                Gentle
              </button>
              <button 
                type="button" 
                className={`py-3 px-4 border text-sm font-medium rounded-xl transition ${supportStyle === 'direct' ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                onClick={() => setSupportStyle("direct")}
              >
                Direct
              </button>
              <button 
                type="button" 
                className={`py-3 px-4 border text-sm font-medium rounded-xl transition ${supportStyle === 'structured' ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                onClick={() => setSupportStyle("structured")}
              >
                Structured
              </button>
            </div>
          </div>

          {/* Emergency Contact Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="emergencyName" className="text-sm font-semibold text-slate-800">Emergency Contact (Optional)</label>
              <input 
                id="emergencyName"
                type="text" 
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 text-sm focus-ring"
                placeholder="e.g. Mentor Aarav"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="emergencyPhone" className="text-sm font-semibold text-slate-800">Contact Number (Optional)</label>
              <input 
                id="emergencyPhone"
                type="tel" 
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 text-sm focus-ring"
                placeholder="e.g. +91 98765 43210"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full mt-4 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl shadow transition focus-ring focus-visible:outline-none flex justify-center items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving Setup...
              </>
            ) : (
              "Save & Enter Support Hub"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
