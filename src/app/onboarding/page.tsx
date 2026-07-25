"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Onboarding Form States
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("user"); // user | doctor | supervisor | caregiver
  const [ageRange, setAgeRange] = useState("25-34");
  const [language, setLanguage] = useState("english");
  const [calmingMode, setCalmingMode] = useState("breathing");
  
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  
  const [assignedDoctorId, setAssignedDoctorId] = useState("Dr. Sen");
  const [assignedSupervisorId, setAssignedSupervisorId] = useState("Super Aarav");
  
  // Consent Preferences
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [transcriptsStored, setTranscriptsStored] = useState(true);
  const [snapshotsStored, setSnapshotsStored] = useState(false);
  const [alertSharing, setAlertSharing] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if onboarding is already completed
  useEffect(() => {
    if (isLoaded && user) {
      const metadata = user.unsafeMetadata as { onboardingCompleted?: boolean };
      if (metadata.onboardingCompleted) {
        // Redirect to their role-specific dashboard
        const userRole = (user.unsafeMetadata as any).role || "user";
        router.push(`/dashboard/${userRole}`);
      } else if (user.fullName || user.firstName) {
        setFullName(user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim());
      }
    }
  }, [isLoaded, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter your display name.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (user) {
        // Save the complete profile structure to Clerk's user metadata
        await user.update({
          unsafeMetadata: {
            onboardingCompleted: true,
            fullName: fullName.trim(),
            role,
            ageRange,
            language,
            calmingMode,
            emergencyContactName: emergencyContactName.trim(),
            emergencyContactPhone: emergencyContactPhone.trim(),
            assignedDoctorId,
            assignedSupervisorId,
            storagePolicy: {
              historyEnabled: true,
              transcriptsStored,
              snapshotsStored
            },
            consents: {
              cameraEnabled,
              microphoneEnabled,
              alertSharing
            },
            triggers: "",
            copingStrategies: ""
          }
        });
        
        // Push to role-specific route
        router.push(`/dashboard/${role}`);
      } else {
        throw new Error("No user session found.");
      }
    } catch (err: any) {
      console.error("Onboarding crash:", err);
      setError(err?.message || "Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium font-heading">Securing clinical logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center p-6 bg-slate-50 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-200/20 blur-3xl animate-orb-1"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-teal-200/15 blur-3xl animate-orb-2"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto bg-white border border-slate-200 shadow-md rounded-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <span className="text-3xl" role="img" aria-label="Shield lock icon">🛡️</span>
          <h1 className="font-heading font-bold text-2xl text-slate-900 mt-2">Hearthline Sentinel Setup</h1>
          <p className="text-sm text-slate-500 mt-1">Configure HIPAA profiles, assigned partners, and storage policies.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-xs">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="onbName" className="font-semibold text-slate-800">Your Display Name</label>
              <input 
                id="onbName"
                type="text" 
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 text-xs"
                placeholder="e.g. Dr. Rohan Sen"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="onbRole" className="font-semibold text-slate-800">Your Primary Role</label>
              <select
                id="onbRole"
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 text-xs"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">User / Patient</option>
                <option value="doctor">Clinician / Doctor</option>
                <option value="supervisor">Operational Supervisor</option>
                <option value="caregiver">Caregiver / Support Network</option>
              </select>
            </div>
          </div>

          {/* User Specific Settings */}
          {role === "user" && (
            <>
              {/* Partner Assignments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="onbDoc" className="font-semibold text-slate-800">Assigned Clinician</label>
                  <select
                    id="onbDoc"
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    value={assignedDoctorId}
                    onChange={(e) => setAssignedDoctorId(e.target.value)}
                  >
                    <option value="Dr. Sen">Dr. Rohan Sen (Therapist)</option>
                    <option value="Dr. Patel">Dr. Anjali Patel (Psychiatrist)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="onbSuper" className="font-semibold text-slate-800">Assigned Coordinator</label>
                  <select
                    id="onbSuper"
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    value={assignedSupervisorId}
                    onChange={(e) => setAssignedSupervisorId(e.target.value)}
                  >
                    <option value="Super Aarav">Aarav Sharma (Supervisor)</option>
                    <option value="Super Priya">Priya Nair (Operations)</option>
                  </select>
                </div>
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="onbAge" className="font-semibold text-slate-800">Age Range</label>
                  <select
                    id="onbAge"
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                  >
                    <option value="18-24">18 - 24</option>
                    <option value="25-34">25 - 34</option>
                    <option value="35-44">35 - 44</option>
                    <option value="45+">45+</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="onbLang" className="font-semibold text-slate-800">Intervention Language</label>
                  <select
                    id="onbLang"
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="english">English</option>
                    <option value="hinglish">Hinglish</option>
                    <option value="hindi">Hindi</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="onbCalm" className="font-semibold text-slate-800">Calming Focus</label>
                  <select
                    id="onbCalm"
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    value={calmingMode}
                    onChange={(e) => setCalmingMode(e.target.value)}
                  >
                    <option value="breathing">Sama Vritti Breathing</option>
                    <option value="sound">Binaural Waves</option>
                    <option value="text">Safe Affirmations</option>
                  </select>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="onbEmergName" className="font-semibold text-slate-800">Caregiver Name (Optional)</label>
                  <input 
                    id="onbEmergName"
                    type="text" 
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    placeholder="e.g. Kabir Sharma"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label htmlFor="onbEmergPhone" className="font-semibold text-slate-800">Caregiver Phone (Optional)</label>
                  <input 
                    id="onbEmergPhone"
                    type="tel" 
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    placeholder="e.g. +91 98765 99999"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Consents Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3">
                <span className="font-bold text-slate-900 mb-1">📋 Consent & Storage Policies</span>
                
                <div className="flex items-center justify-between">
                  <label htmlFor="chkCam" className="text-xs text-slate-600 font-medium">Allow Webcam Facial Expression Estimation</label>
                  <input 
                    id="chkCam"
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 accent-blue-600"
                    checked={cameraEnabled} 
                    onChange={(e) => setCameraEnabled(e.target.checked)} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="chkMic" className="text-xs text-slate-600 font-medium">Allow Microphone Vocal Sentiment & Stress Checks</label>
                  <input 
                    id="chkMic"
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 accent-blue-600"
                    checked={microphoneEnabled} 
                    onChange={(e) => setMicrophoneEnabled(e.target.checked)} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="chkSaveTx" className="text-xs text-slate-600 font-medium">Allow Transcription Storage (At-Rest Database Storage)</label>
                  <input 
                    id="chkSaveTx"
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 accent-blue-600"
                    checked={transcriptsStored} 
                    onChange={(e) => setTranscriptsStored(e.target.checked)} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="chkAlert" className="text-xs text-slate-600 font-medium">Enable Automatic Crisis Alert Dispatching to Doctor/Supervisor</label>
                  <input 
                    id="chkAlert"
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 accent-blue-600"
                    checked={alertSharing} 
                    onChange={(e) => setAlertSharing(e.target.checked)} 
                  />
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={saving}
            className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl shadow transition focus-ring flex justify-center items-center gap-2 text-sm"
          >
            {saving ? "Saving Configurations..." : "✓ Complete Sentinel Onboarding"}
          </button>
        </form>
      </div>
    </div>
  );
}
