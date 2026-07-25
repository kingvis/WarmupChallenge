"use client";

import { useState } from "react";
import { Heart, Plus, Trash2, Sparkles, Image as ImageIcon, X } from "lucide-react";

export interface FamilyMemberPhoto {
  id: string;
  name: string;
  relationship: string;
  photoUrl: string; // Base64 string or image URL
  calmingAffirmation?: string;
  createdAt: string;
}

interface FamilyGalleryProps {
  familyMembers: FamilyMemberPhoto[];
  onUpdateFamilyMembers?: (members: FamilyMemberPhoto[]) => void;
  readOnly?: boolean;
}

export function FamilyGallery({
  familyMembers = [],
  onUpdateFamilyMembers,
  readOnly = false,
}: FamilyGalleryProps) {
  const [members, setMembers] = useState<FamilyMemberPhoto[]>(familyMembers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Spouse");
  const [photoUrl, setPhotoUrl] = useState("");
  const [calmingAffirmation, setCalmingAffirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoUrl(event.target.result as string);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your family member's name.");
      return;
    }

    const newMember: FamilyMemberPhoto = {
      id: "fam_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      relationship,
      photoUrl: photoUrl.trim() || getDefaultAvatarSvg(name),
      calmingAffirmation: calmingAffirmation.trim() || `Remember, ${name.trim()} loves you and is cheering for you!`,
      createdAt: new Date().toISOString(),
    };

    const updated = [...members, newMember];
    setMembers(updated);
    if (onUpdateFamilyMembers) {
      onUpdateFamilyMembers(updated);
    }

    // Reset form
    setName("");
    setRelationship("Spouse");
    setPhotoUrl("");
    setCalmingAffirmation("");
    setError(null);
    setShowAddModal(false);
  };

  const handleRemoveMember = (id: string) => {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    if (onUpdateFamilyMembers) {
      onUpdateFamilyMembers(updated);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
            <Heart className="w-5 h-5 fill-rose-500/20" />
          </div>
          <div>
            <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              Calming Family Gallery
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                {members.length} {members.length === 1 ? "Member" : "Members"}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Photos of your loved ones bring emotional grounding and calm whenever you open Hearthline.
            </p>
          </div>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Family Photo
          </button>
        )}
      </div>

      {/* Gallery Grid */}
      {members.length === 0 ? (
        <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-2">
            <Heart className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 mb-1">No family pictures added yet</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Adding pictures of your spouse, children, parents, or friends helps lower stress levels and brings immediate calm during recovery.
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-rose-700 border border-rose-200 text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add Your First Picture
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="relative group bg-slate-50/70 border border-slate-200 rounded-xl overflow-hidden hover:border-rose-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div className="p-4 flex items-start gap-3.5">
                <div className="relative shrink-0">
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-rose-300 shadow-sm bg-white"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                    <Heart className="w-3 h-3 fill-current" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-heading font-bold text-sm text-slate-900 truncate">{member.name}</h4>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition rounded-md hover:bg-slate-200/60 opacity-0 group-hover:opacity-100"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 mb-1">
                    {member.relationship}
                  </span>
                  {member.calmingAffirmation && (
                    <p className="text-xs text-slate-700 italic line-clamp-2 mt-1 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                      "{member.calmingAffirmation}"
                    </p>
                  )}
                </div>
              </div>

              <div className="px-4 py-2 bg-white border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-teal-700 font-semibold">
                  <Sparkles className="w-3 h-3 text-teal-600" /> Calming Anchor
                </span>
                <span className="text-slate-400">Connected</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal to Add Family Member */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Heart className="w-5 h-5 fill-rose-500/20" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-slate-900 text-base">Add Family Member Photo</h3>
                <p className="text-xs text-slate-500">Upload a picture and comforting message</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">Relationship</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="Spouse">Spouse / Partner</option>
                  <option value="Child">Child / Son / Daughter</option>
                  <option value="Parent">Mother / Father</option>
                  <option value="Sibling">Sister / Brother</option>
                  <option value="Friend">Close Friend</option>
                  <option value="Caregiver">Primary Caregiver</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Upload Picture (PNG, JPG, WEBP)
                </label>
                <div className="flex items-center gap-3">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Preview"
                      className="w-14 h-14 rounded-full object-cover border-2 border-rose-400 shrink-0 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Calming Affirmation / Message
                </label>
                <textarea
                  rows={2}
                  placeholder={`e.g., "Stay calm and take one breath at a time. We love you!"`}
                  value={calmingAffirmation}
                  onChange={(e) => setCalmingAffirmation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-sm"
                >
                  Save Picture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getDefaultAvatarSvg(name: string): string {
  const initial = (name[0] || "F").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <rect width="100%" height="100%" fill="#f8fafc"/>
    <circle cx="50" cy="50" r="45" fill="#ffe4e6"/>
    <circle cx="50" cy="40" r="20" fill="#e11d48"/>
    <path d="M 20 85 C 20 65, 80 65, 80 85 Z" fill="#e11d48"/>
    <text x="50" y="46" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
