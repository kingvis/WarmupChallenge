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

  // Preference states
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("recovery");
  const [supportStyle, setSupportStyle] = useState("gentle");
  const [calmingTone, setCalmingTone] = useState("soothing");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync preference state from Clerk unsafeMetadata
  useEffect(() => {
    if (isLoaded && user) {
      const metadata = (user.unsafeMetadata || {}) as {
        fullName?: string;
        role?: "recovery" | "caregiver" | "both";
        supportStyle?: "gentle" | "direct" | "structured";
        calmingTone?: "soothing" | "mindful" | "motivational";
        emergencyContactName?: string;
        emergencyContactPhone?: string;
      };

      setFullName(metadata.fullName || user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim());
      setRole(metadata.role || "recovery");
      setSupportStyle(metadata.supportStyle || "gentle");
      setCalmingTone(metadata.calmingTone || "soothing");
      setEmergencyContactName(metadata.emergencyContactName || "");
      setEmergencyContactPhone(metadata.emergencyContactPhone || "");
    }
  }, [isLoaded, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter your name.");
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
            supportStyle,
            calmingTone,
            emergencyContactName: emergencyContactName.trim(),
            emergencyContactPhone: emergencyContactPhone.trim()
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
      {/* Header bar */}
      <header className="w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="Logo Home">🏡</span>
          <span className="font-heading font-semibold text-lg text-blue-900">Settings Profile</span>
        </div>
        <Link href="/dashboard" className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm">
          🔙 Back to Dashboard
        </Link>
      </header>

      {/* Main panel */}
      <main className="w-full max-w-lg mx-auto px-6 py-6 flex flex-col gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          <div>
            <h2 className="font-heading font-bold text-lg text-slate-900">Configure Profile Preferences</h2>
            <p className="text-xs text-slate-500 mt-1">Adjust support styles, roles, and emergency information below.</p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs" role="alert">
              ✓ Preferences updated and saved to account.
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="settingsName" className="text-xs font-semibold text-slate-700">Display Name</label>
              <input 
                id="settingsName"
                type="text" 
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 text-xs focus-ring"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="settingsRole" className="text-xs font-semibold text-slate-700">Primary Role</label>
              <select
                id="settingsRole"
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 text-xs focus-ring"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="recovery">In Recovery</option>
                <option value="caregiver">Caregiver</option>
                <option value="both">Both Roles</option>
              </select>
            </div>

            {/* Support Style */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="settingsStyle" className="text-xs font-semibold text-slate-700">Preferred Support Style</label>
              <select
                id="settingsStyle"
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 text-xs focus-ring"
                value={supportStyle}
                onChange={(e) => setSupportStyle(e.target.value)}
              >
                <option value="gentle">Gentle</option>
                <option value="direct">Direct</option>
                <option value="structured">Structured</option>
              </select>
            </div>

            {/* Calming Tone */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="settingsTone" className="text-xs font-semibold text-slate-700">Preferred Calming Tone</label>
              <select
                id="settingsTone"
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 text-xs focus-ring"
                value={calmingTone}
                onChange={(e) => setCalmingTone(e.target.value)}
              >
                <option value="soothing">Soothing</option>
                <option value="mindful">Mindful</option>
                <option value="motivational">Motivational</option>
              </select>
            </div>

            {/* Emergency Contact Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="settingsContact" className="text-xs font-semibold text-slate-700">Emergency Contact Name</label>
              <input 
                id="settingsContact"
                type="text" 
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 text-xs focus-ring"
                placeholder="e.g. Mentor Aarav"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
              />
            </div>

            {/* Emergency Contact Phone */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="settingsPhone" className="text-xs font-semibold text-slate-700">Emergency Contact Phone</label>
              <input 
                id="settingsPhone"
                type="tel" 
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 text-xs focus-ring"
                placeholder="e.g. +91 98765 43210"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs rounded-xl shadow transition focus-ring flex justify-center items-center gap-1.5"
            >
              {saving ? "Saving Changes..." : "💾 Update Settings"}
            </button>
          </form>
        </div>

        {/* Account Details & Logs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-heading font-bold text-sm text-slate-900">Clerk Session Management</h3>
          <p className="text-xs text-slate-500 leading-relaxed">You are logged in as <strong>{user.primaryEmailAddress?.emailAddress}</strong>.</p>
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
