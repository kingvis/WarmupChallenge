export function sanitizeRole(role?: string): "user" | "doctor" | "supervisor" | "caregiver" {
  if (!role) return "user";
  const r = role.toLowerCase().trim();
  if (r === "doctor" || r === "clinician") return "doctor";
  if (r === "supervisor" || r === "operations") return "supervisor";
  if (r === "caregiver" || r === "support") return "caregiver";
  // "user", "recovery", "both", "patient", or any unrecognized string maps to "user"
  return "user";
}
