"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { FamilyGallery, FamilyMemberPhoto } from "@/components/family-gallery";
import { Shield, Heart, User, Sparkles, AlertCircle } from "lucide-react";

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
  const [emergencyContactRelation, setEmergencyContactRelation] = useState("Spouse");
  
  const [assignedDoctorId, setAssignedDoctorId] = useState("");
  const [assignedSupervisorId, setAssignedSupervisorId] = useState("");
  
  // Consent Preferences
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [transcriptsStored, setTranscriptsStored] = useState(true);
  const [snapshotsStored, setSnapshotsStored] = useState(false);
  const [alertSharing, setAlertSharing] = useState(true);

  // Family Members Calming Gallery
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberPhoto[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if onboarding is already completed
  useEffect(() => {
    if (isLoaded && user) {
      const metadata = user.unsafeMetadata as { 
        onboardingCompleted?: boolean; 
        familyMembers?: FamilyMemberPhoto[];
      };
      if (metadata.onboardingCompleted) {
        const userRole = (user.unsafeMetadata as any).role || "user";
        router.push(`/dashboard/${userRole}`);
      } else {
        if (user.fullName || user.firstName) {
          setFullName(user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim());
        }
        if (metadata.familyMembers) {
          setFamilyMembers(metadata.familyMembers);
        }
      }
    }
  }, [isLoaded, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter your full display name.");
      return;
    }

    if (role === "user") {
      if (!assignedDoctorId) {
        setError("Please select an assigned clinician.");
        return;
      }
      if (!assignedSupervisorId) {
        setError("Please select an assigned coordinator.");
        return;
      }
      if (!emergencyContactName.trim() || !emergencyContactPhone.trim()) {
        setError("Please complete your emergency contact details (Name & Phone).");
        return;
      }
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
            emergencyContactRelation,
            assignedDoctorId,
            assignedSupervisorId,
            familyMembers,
            storagePolicy: {
              historyEnabled: true,
              transcriptsStored,
              snapshotsStored,
            },
            consents: {
              cameraEnabled,
              microphoneEnabled,
              alertSharing,
            },
            triggers: "",
            copingStrategies: "",
          },
        });
        
        // Push to role-specific route
        router.push(`/dashboard/${role}`);
      } else {
        throw new Error("No user session found.");
      }
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err?.message || "Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium font-heading">Securing profile & encryption tokens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center p-4 sm:p-8 bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* Calm Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-200/30 blur-3xl animate-orb-1"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-teal-200/25 blur-3xl animate-orb-2"></div>
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto bg-white border border-slate-200 shadow-md rounded-3xl p-6 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900">Hearthline Sentinel Profile Setup</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
            Configure your clinical support role, emergency contacts, consent policies, and calming family photo gallery.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-xs">
          {/* Main Info */}
          <div className="p-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-4">
            <h3 className="font-heading font-semibold text-sm text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Account & Role Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="onbName" className="font-semibold text-slate-800">Your Full Display Name <span className="text-rose-500">*</span></label>
                <input 
                  id="onbName"
                  type="text" 
                  className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900 text-xs"
                  placeholder="e.g. Eleanor Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label htmlFor="onbRole" className="font-semibold text-slate-800">Your Role</label>
                <select
                  id="onbRole"
                  className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900 text-xs"
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
          </div>

          {/* User Specific Settings */}
          {role === "user" && (
            <>
              {/* Clinician & Coordinator Assignment */}
              <div className="p-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-4">
                <h3 className="font-heading font-semibold text-sm text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" /> Clinical Care Team Assignment
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="onbDoc" className="font-semibold text-slate-800">Assigned Clinician <span className="text-rose-500">*</span></label>
                    <select
                      id="onbDoc"
                      className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900"
                      value={assignedDoctorId}
                      onChange={(e) => setAssignedDoctorId(e.target.value)}
                    >
                      <option value="">-- Select Clinician --</option>
                      <option value="Dr. Rohan Sen">Dr. Rohan Sen (Therapist)</option>
                      <option value="Dr. Anjali Patel">Dr. Anjali Patel (Psychiatrist)</option>
                      <option value="Dr. Marcus Vance">Dr. Marcus Vance (Clinical Director)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="onbSuper" className="font-semibold text-slate-800">Assigned Coordinator <span className="text-rose-500">*</span></label>
                    <select
                      id="onbSuper"
                      className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900"
                      value={assignedSupervisorId}
                      onChange={(e) => setAssignedSupervisorId(e.target.value)}
                    >
                      <option value="">-- Select Coordinator --</option>
                      <option value="Aarav Sharma">Aarav Sharma (Supervisor)</option>
                      <option value="Priya Nair">Priya Nair (Operations Director)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Family Members Calming Gallery */}
              <FamilyGallery
                familyMembers={familyMembers}
                onUpdateFamilyMembers={setFamilyMembers}
              />

              {/* Emergency Contacts */}
              <div className="p-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-4">
                <h3 className="font-heading font-semibold text-sm text-slate-900 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" /> Emergency Caregiver Contact
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="onbEmergName" className="font-semibold text-slate-800">Caregiver Name <span className="text-rose-500">*</span></label>
                    <input 
                      id="onbEmergName"
                      type="text" 
                      className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900"
                      placeholder="e.g. Kabir Vance"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="onbEmergPhone" className="font-semibold text-slate-800">Phone Number <span className="text-rose-500">*</span></label>
                    <input 
                      id="onbEmergPhone"
                      type="tel" 
                      className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900"
                      placeholder="e.g. +1 555 019 2831"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="onbEmergRel" className="font-semibold text-slate-800">Relationship</label>
                    <select
                      id="onbEmergRel"
                      className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900"
                      value={emergencyContactRelation}
                      onChange={(e) => setEmergencyContactRelation(e.target.value)}
                    >
                      <option value="Spouse">Spouse / Partner</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Friend">Friend</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Consents & Storage */}
              <div className="p-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
                <h3 className="font-heading font-semibold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" /> Consent & Storage Policies
                </h3>
                
                <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                  <label htmlFor="chkCam" className="text-xs text-slate-700 font-medium">Allow Webcam Facial Expression & Distress Check-in</label>
                  <input 
                    id="chkCam"
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 accent-blue-600 rounded"
                    checked={cameraEnabled} 
                    onChange={(e) => setCameraEnabled(e.target.checked)} 
                  />
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                  <label htmlFor="chkMic" className="text-xs text-slate-700 font-medium">Allow Microphone Vocal Sentiment & Stress Scoring</label>
                  <input 
                    id="chkMic"
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 accent-blue-600 rounded"
                    checked={microphoneEnabled} 
                    onChange={(e) => setMicrophoneEnabled(e.target.checked)} 
                  />
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                  <label htmlFor="chkSaveTx" className="text-xs text-slate-700 font-medium">Allow Encrypted Transcript Storage at Rest</label>
                  <input 
                    id="chkSaveTx"
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 accent-blue-600 rounded"
                    checked={transcriptsStored} 
                    onChange={(e) => setTranscriptsStored(e.target.checked)} 
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <label htmlFor="chkAlert" className="text-xs text-slate-700 font-medium">Enable Automatic Alert Escalation to Assigned Doctor</label>
                  <input 
                    id="chkAlert"
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 accent-blue-600 rounded"
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
            className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl shadow transition focus-ring flex justify-center items-center gap-2 text-sm cursor-pointer"
          >
            {saving ? "Saving Configurations..." : "✓ Complete Hearthline Sentinel Onboarding"}
          </button>
        </form>
      </div>
    </div>
  );
}
