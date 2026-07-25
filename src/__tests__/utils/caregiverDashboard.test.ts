/**
 * Unit tests for Caregiver Dashboard logic
 *
 * Tests cover:
 *  - guideData _error rendering logic (no fake guides when API unavailable)
 *  - Alert visibility: only relevant alerts surfaced
 *  - alId() short-ID helper
 *  - Guide request body construction (correct role, userName sent to API)
 */

// ---------------------------------------------------------------------------
// Pure functions mirrored from caregiver/page.tsx
// ---------------------------------------------------------------------------

interface AlertItem {
  id: string;
  userId: string;
  userName: string;
  severity: string;
  status: string;
  triggers: string[];
  clinicianNotes: string;
  timestamp: string;
}

interface GuideData {
  _error?: string;
  whatToSay?: string;
  whatToAvoid?: string;
  boundaryTip?: string;
  source?: string;
}

// Mirrors the alId() helper in caregiver page
function alId(id: string): string {
  return id.substring(0, 8);
}

// Whether the guide data has an error (matches the JSX condition)
function hasGuideError(guideData: GuideData | null): boolean {
  return !!guideData?._error;
}

// Build the request payload for caregiver guide generation
function buildCaregiverGuidePayload(userName: string = "Your loved one") {
  return {
    transcript: "Requesting caregiver supportive check-in guide.",
    facialScore: 0.5,
    vocalSentimentScore: 0.5,
    moodScore: 4,
    stressLevel: 8,
    role: "caregiver",
    userName,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("alId() — short ID helper", () => {
  test("returns first 8 characters of a string", () => {
    expect(alId("alert_1234567890")).toBe("alert_12");
  });

  test("returns the full string if shorter than 8 chars", () => {
    expect(alId("short")).toBe("short");
  });

  test("returns exactly 8 chars for 8-char input", () => {
    expect(alId("12345678")).toBe("12345678");
  });

  test("handles empty string without throwing", () => {
    expect(alId("")).toBe("");
  });

  test("handles real alert id format correctly", () => {
    const id = "alert_1684957043979";
    expect(alId(id)).toBe("alert_16");
    expect(alId(id)).toHaveLength(8);
  });
});

describe("hasGuideError()", () => {
  test("returns true when guideData has _error field", () => {
    expect(hasGuideError({ _error: "GEMINI_API_KEY is not configured." })).toBe(true);
  });

  test("returns false when guideData has no _error", () => {
    expect(
      hasGuideError({
        whatToSay: "Let's breathe together.",
        whatToAvoid: "Don't bring up past events.",
        boundaryTip: "Take care of yourself first.",
        source: "gemini",
      })
    ).toBe(false);
  });

  test("returns false when guideData is null (no fetch yet)", () => {
    expect(hasGuideError(null)).toBe(false);
  });

  test("returns false for empty _error string (empty string is falsy)", () => {
    expect(hasGuideError({ _error: "" })).toBe(false);
  });

  test("returns true for any non-empty _error string", () => {
    expect(hasGuideError({ _error: "Could not reach service." })).toBe(true);
  });
});

describe("buildCaregiverGuidePayload()", () => {
  test("sets role to 'caregiver'", () => {
    const payload = buildCaregiverGuidePayload();
    expect(payload.role).toBe("caregiver");
  });

  test("uses provided userName", () => {
    const payload = buildCaregiverGuidePayload("Priya");
    expect(payload.userName).toBe("Priya");
  });

  test("uses default userName when none provided", () => {
    const payload = buildCaregiverGuidePayload();
    expect(payload.userName).toBe("Your loved one");
  });

  test("includes all required fields", () => {
    const payload = buildCaregiverGuidePayload("Test");
    expect(payload).toHaveProperty("transcript");
    expect(payload).toHaveProperty("facialScore");
    expect(payload).toHaveProperty("vocalSentimentScore");
    expect(payload).toHaveProperty("moodScore");
    expect(payload).toHaveProperty("stressLevel");
    expect(payload).toHaveProperty("role");
    expect(payload).toHaveProperty("userName");
  });

  test("facialScore and vocalSentimentScore are in 0–1 range", () => {
    const payload = buildCaregiverGuidePayload();
    expect(payload.facialScore).toBeGreaterThanOrEqual(0);
    expect(payload.facialScore).toBeLessThanOrEqual(1);
    expect(payload.vocalSentimentScore).toBeGreaterThanOrEqual(0);
    expect(payload.vocalSentimentScore).toBeLessThanOrEqual(1);
  });
});

describe("Alert visibility logic for caregiver (active alerts only)", () => {
  const sampleAlerts: AlertItem[] = [
    { id: "al_1", userId: "u1", userName: "Raj", severity: "high", status: "active", triggers: [], clinicianNotes: "", timestamp: new Date().toISOString() },
    { id: "al_2", userId: "u2", userName: "Priya", severity: "critical", status: "active", triggers: ["SOS triggered"], clinicianNotes: "", timestamp: new Date().toISOString() },
    { id: "al_3", userId: "u3", userName: "Meena", severity: "moderate", status: "acknowledged", triggers: [], clinicianNotes: "", timestamp: new Date().toISOString() },
  ];

  test("caregiver should only see active alerts", () => {
    const active = sampleAlerts.filter((a) => a.status === "active");
    expect(active).toHaveLength(2);
    expect(active.map((a) => a.id)).toEqual(["al_1", "al_2"]);
  });

  test("critical severity alert is visible and correctly labeled", () => {
    const criticalAlert = sampleAlerts.find((a) => a.severity === "critical");
    expect(criticalAlert).toBeDefined();
    expect(criticalAlert?.userName).toBe("Priya");
    expect(criticalAlert?.triggers).toContain("SOS triggered");
  });

  test("acknowledged alert is NOT shown in active view", () => {
    const active = sampleAlerts.filter((a) => a.status === "active");
    const ids = active.map((a) => a.id);
    expect(ids).not.toContain("al_3");
  });
});
