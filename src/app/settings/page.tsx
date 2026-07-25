"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Guard routing: redirect if unauthenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  // Profile preferences states
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("user");
  const [language, setLanguage] = useState("english");
  const [calmingMode, setCalmingMode] = useState("breathing");
  
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  
  // Consent and Storage policies
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [transcriptsStored, setTranscriptsStored] = useState(true);
  const [snapshotsStored, setSnapshotsStored] = useState(false);
  const [alertSharing, setAlertSharing] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync state from Clerk user metadata
  useEffect(() => {
    if (isLoaded && user) {
      const metadata = (user.unsafeMetadata || {}) as {
        fullName?: string;
        role?: "user" | "doctor" | "supervisor" | "caregiver";
        language?: "english" | "hinglish" | "hindi";
        calmingMode?: "breathing" | "sound" | "text";
        emergencyContactName?: string;
        emergencyContactPhone?: string;
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

      setFullName(metadata.fullName || user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim());
      setRole(metadata.role || "user");
      setLanguage(metadata.language || "english");
      setCalmingMode(metadata.calmingMode || "breathing");
      setEmergencyContactName(metadata.emergencyContactName || "");
      setEmergencyContactPhone(metadata.emergencyContactPhone || "");
      
      if (metadata.consents) {
        setCameraEnabled(metadata.consents.cameraEnabled ?? true);
        setMicrophoneEnabled(metadata.consents.microphoneEnabled ?? true);
        setAlertSharing(metadata.consents.alertSharing ?? true);
      }
      if (metadata.storagePolicy) {
        setTranscriptsStored(metadata.storagePolicy.transcriptsStored ?? true);
        setSnapshotsStored(metadata.storagePolicy.snapshotsStored ?? false);
      }
    }
  }, [isLoaded, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter your display name.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (user) {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            fullName: fullName.trim(),
            role,
            language,
            calmingMode,
            emergencyContactName: emergencyContactName.trim(),
            emergencyContactPhone: emergencyContactPhone.trim(),
            storagePolicy: {
              historyEnabled: true,
              transcriptsStored,
              snapshotsStored
            },
            consents: {
              cameraEnabled,
              microphoneEnabled,
              alertSharing
            }
          }
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Entering settings...</p>
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
          <span className="font-heading font-semibold text-lg text-blue-900">Sentinel Settings</span>
        </div>
        <Link href={`/dashboard/${role === 'recovery' || role === 'both' ? 'user' : role}`} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm">
          🔙 Back to Dashboard
        </Link>
      </header>

      {/* Main panel */}
      <main className="w-full max-w-xl mx-auto px-6 py-6 flex flex-col gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          <div>
            <h2 className="font-heading font-bold text-lg text-slate-900">HIPAA & Storage Configurations</h2>
            <p className="text-xs text-slate-500 mt-1">Adjust data consent scopes, active diagnostic triggers, and logs policies.</p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs" role="alert">
              ✓ Sentinel preferences updated and synchronized.
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
            {/* Display Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="setFullName" className="font-semibold text-slate-700">Display Name</label>
              <input 
                id="setFullName"
                type="text" 
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 text-xs"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="setRole" className="font-semibold text-slate-700">Sentinel Role</label>
              <select
                id="setRole"
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">User / Patient</option>
                <option value="doctor">Clinician / Doctor</option>
                <option value="supervisor">Operational Supervisor</option>
                <option value="caregiver">Caregiver / Support Network</option>
              </select>
            </div>

            {/* Check-in preferences */}
            {role === "user" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="setLanguage" className="font-semibold text-slate-700">Interaction Language</label>
                    <select
                      id="setLanguage"
                      className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="english">English</option>
                      <option value="hinglish">Hinglish</option>
                      <option value="hindi">Hindi</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="setMode" className="font-semibold text-slate-700">Calming Mode</label>
                    <select
                      id="setMode"
                      className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                      value={calmingMode}
                      onChange={(e) => setCalmingMode(e.target.value)}
                    >
                      <option value="breathing">Sama Vritti Breathing</option>
                      <option value="sound">Binaural Waves</option>
                      <option value="text">Safe Affirmations</option>
                    </select>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="setEmergName" className="font-semibold text-slate-700">Caregiver Name</label>
                    <input 
                      id="setEmergName"
                      type="text" 
                      className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="setEmergPhone" className="font-semibold text-slate-700">Caregiver Phone</label>
                    <input 
                      id="setEmergPhone"
                      type="tel" 
                      className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Consent switches */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3 mt-2">
                  <span className="font-bold text-slate-900 mb-1">📋 HIPAA & Logs Storage Policies</span>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-medium">Camera expression estimation</span>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 accent-blue-600"
                      checked={cameraEnabled} 
                      onChange={(e) => setCameraEnabled(e.target.checked)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-medium">Microphone vocal sentiment check</span>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 accent-blue-600"
                      checked={microphoneEnabled} 
                      onChange={(e) => setMicrophoneEnabled(e.target.checked)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-medium">Store session transcript in database</span>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 accent-blue-600"
                      checked={transcriptsStored} 
                      onChange={(e) => setTranscriptsStored(e.target.checked)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-medium">Store camera snapshot in database</span>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 accent-blue-600"
                      checked={snapshotsStored} 
                      onChange={(e) => setSnapshotsStored(e.target.checked)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-medium">Alert supervisor/doctor automatically</span>
                    <input 
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
              className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs rounded-xl shadow transition focus-ring flex justify-center items-center gap-1.5"
            >
              {saving ? "Saving Changes..." : "💾 Update Settings"}
            </button>
          </form>
        </div>

        {/* Account Details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 text-xs">
          <h3 className="font-heading font-bold text-sm text-slate-900">Session Account Management</h3>
          <p className="text-slate-500 leading-relaxed">Logged in as <strong>{user.primaryEmailAddress?.emailAddress}</strong>.</p>
          <SignOutButton>
            <button type="button" className="w-full py-3 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 text-xs font-bold rounded-xl transition">
              🚪 Log Out from Account
            </button>
          </SignOutButton>
        </div>
      </main>
    </div>
  );
}
