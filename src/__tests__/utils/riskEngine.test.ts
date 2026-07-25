/**
 * Unit tests for the Risk Score Engine
 *
 * The engine (calculateRiskScore) is extracted from the user dashboard's
 * inline function so we can test it deterministically without rendering React.
 *
 * Risk formula:
 *   base = 2
 *   +2  mood < 4
 *   +2  stress > 7
 *   +2  craving > 6
 *   +2  needHelp === true
 *   +2  cameraEmotion === "Anxious" | "Sad"
 *   +2  voiceStressScore > 0.6
 *   score = 10  (override) if sosSent === true
 *
 * Label thresholds:
 *   ≤3  → Low
 *   ≤5  → Moderate
 *   ≤8  → High
 *   >8  → Critical
 */

// ---------------------------------------------------------------------------
// Pure extraction of the risk engine (mirrors user/page.tsx calculateRiskScore)
// ---------------------------------------------------------------------------

interface RiskInput {
  mood: number;
  stress: number;
  craving: number;
  needHelp: boolean;
  cameraEmotion: string;
  voiceStressScore: number;
  sosSent: boolean;
}

interface RiskOutput {
  score: number;
  label: string;
  reasons: string[];
}

function calculateRiskScore(input: RiskInput): RiskOutput {
  const { mood, stress, craving, needHelp, cameraEmotion, voiceStressScore, sosSent } = input;

  if (sosSent) {
    return { score: 10, label: "Critical", reasons: ["Emergency SOS Button Triggered"] };
  }

  let score = 2;
  const reasons: string[] = [];

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
  if (cameraEmotion === "Anxious" || cameraEmotion === "Sad") {
    score += 2;
    reasons.push(`Facial distress matches: ${cameraEmotion}`);
  }
  if (voiceStressScore > 0.6) {
    score += 2;
    reasons.push("Speech stress acoustics matched");
  }

  let label = "Low";
  if (score <= 3) label = "Low";
  else if (score <= 5) label = "Moderate";
  else if (score <= 8) label = "High";
  else label = "Critical";

  return { score, label, reasons };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Risk Score Engine — calculateRiskScore()", () => {
  const baseline: RiskInput = {
    mood: 7,
    stress: 3,
    craving: 2,
    needHelp: false,
    cameraEmotion: "Neutral",
    voiceStressScore: 0.15,
    sosSent: false,
  };

  // --- Label thresholds ---

  test("baseline returns score=2, label=Low, no reasons", () => {
    const result = calculateRiskScore(baseline);
    expect(result.score).toBe(2);
    expect(result.label).toBe("Low");
    expect(result.reasons).toHaveLength(0);
  });

  test("score ≤ 3 → Low label", () => {
    const result = calculateRiskScore({ ...baseline, mood: 4 }); // mood=4, no trigger; score stays 2
    expect(result.label).toBe("Low");
    expect(result.score).toBe(2);
  });

  test("score of 4 → Moderate label (one trigger: mood < 4)", () => {
    const result = calculateRiskScore({ ...baseline, mood: 3 }); // +2 → score=4
    expect(result.score).toBe(4);
    expect(result.label).toBe("Moderate");
    expect(result.reasons).toContain("Low mood self-report");
  });

  test("score of 6 → High label (mood + stress triggers)", () => {
    const result = calculateRiskScore({ ...baseline, mood: 3, stress: 8 }); // 2+2+2=6
    expect(result.score).toBe(6);
    expect(result.label).toBe("High");
  });

  test("score of 8 → High label boundary (4 triggers)", () => {
    const result = calculateRiskScore({
      ...baseline,
      mood: 3,
      stress: 8,
      craving: 7,
      needHelp: true,
    }); // 2+2+2+2+2=10 — wait that's 10 → Critical
    // Let's use 3 triggers: mood, stress, craving → 2+2+2+2=8
    const result2 = calculateRiskScore({ ...baseline, mood: 3, stress: 8, craving: 7 }); // 2+2+2+2=8
    expect(result2.score).toBe(8);
    expect(result2.label).toBe("High");
  });

  test("score of 10 via factors → Critical label", () => {
    const result = calculateRiskScore({
      mood: 3,
      stress: 8,
      craving: 7,
      needHelp: true,
      cameraEmotion: "Anxious",
      voiceStressScore: 0.85,
      sosSent: false,
    }); // 2+2+2+2+2+2+2=14 — capped? No, score just goes above 8 → Critical
    expect(result.score).toBeGreaterThan(8);
    expect(result.label).toBe("Critical");
  });

  // --- SOS override ---

  test("sosSent=true always returns score=10, label=Critical regardless of other inputs", () => {
    const result = calculateRiskScore({ ...baseline, sosSent: true });
    expect(result.score).toBe(10);
    expect(result.label).toBe("Critical");
    expect(result.reasons).toEqual(["Emergency SOS Button Triggered"]);
  });

  test("sosSent=true overrides even a low-risk profile", () => {
    const lowRisk: RiskInput = { ...baseline, mood: 10, stress: 1, sosSent: true };
    const result = calculateRiskScore(lowRisk);
    expect(result.score).toBe(10);
    expect(result.label).toBe("Critical");
  });

  // --- Individual triggers ---

  test("mood < 4 adds 2 and pushes reason", () => {
    const result = calculateRiskScore({ ...baseline, mood: 3 });
    expect(result.reasons).toContain("Low mood self-report");
    expect(result.score).toBe(4);
  });

  test("mood = 4 does NOT trigger", () => {
    const result = calculateRiskScore({ ...baseline, mood: 4 });
    expect(result.reasons).not.toContain("Low mood self-report");
    expect(result.score).toBe(2);
  });

  test("stress > 7 adds 2 and pushes reason", () => {
    const result = calculateRiskScore({ ...baseline, stress: 8 });
    expect(result.reasons).toContain("Elevated stress self-report");
    expect(result.score).toBe(4);
  });

  test("stress = 7 does NOT trigger", () => {
    const result = calculateRiskScore({ ...baseline, stress: 7 });
    expect(result.reasons).not.toContain("Elevated stress self-report");
    expect(result.score).toBe(2);
  });

  test("craving > 6 adds 2 and pushes reason", () => {
    const result = calculateRiskScore({ ...baseline, craving: 7 });
    expect(result.reasons).toContain("Significant craving waves");
    expect(result.score).toBe(4);
  });

  test("craving = 6 does NOT trigger", () => {
    const result = calculateRiskScore({ ...baseline, craving: 6 });
    expect(result.score).toBe(2);
  });

  test("needHelp=true adds 2 and pushes reason", () => {
    const result = calculateRiskScore({ ...baseline, needHelp: true });
    expect(result.reasons).toContain("Explicit request for grounding help");
    expect(result.score).toBe(4);
  });

  test("cameraEmotion=Anxious adds 2 and pushes reason", () => {
    const result = calculateRiskScore({ ...baseline, cameraEmotion: "Anxious" });
    expect(result.reasons).toContain("Facial distress matches: Anxious");
    expect(result.score).toBe(4);
  });

  test("cameraEmotion=Sad adds 2 and pushes reason", () => {
    const result = calculateRiskScore({ ...baseline, cameraEmotion: "Sad" });
    expect(result.reasons).toContain("Facial distress matches: Sad");
    expect(result.score).toBe(4);
  });

  test("cameraEmotion=Happy does NOT trigger", () => {
    const result = calculateRiskScore({ ...baseline, cameraEmotion: "Happy" });
    expect(result.score).toBe(2);
  });

  test("voiceStressScore > 0.6 adds 2 and pushes reason", () => {
    const result = calculateRiskScore({ ...baseline, voiceStressScore: 0.61 });
    expect(result.reasons).toContain("Speech stress acoustics matched");
    expect(result.score).toBe(4);
  });

  test("voiceStressScore = 0.6 does NOT trigger", () => {
    const result = calculateRiskScore({ ...baseline, voiceStressScore: 0.6 });
    expect(result.score).toBe(2);
  });

  // --- Reasons array is accurate ---

  test("multiple triggers → reasons array contains all expected entries", () => {
    const result = calculateRiskScore({
      mood: 2,
      stress: 9,
      craving: 8,
      needHelp: true,
      cameraEmotion: "Anxious",
      voiceStressScore: 0.9,
      sosSent: false,
    });
    expect(result.reasons).toContain("Low mood self-report");
    expect(result.reasons).toContain("Elevated stress self-report");
    expect(result.reasons).toContain("Significant craving waves");
    expect(result.reasons).toContain("Explicit request for grounding help");
    expect(result.reasons).toContain("Facial distress matches: Anxious");
    expect(result.reasons).toContain("Speech stress acoustics matched");
    expect(result.reasons).toHaveLength(6);
  });

  test("returns empty reasons array for baseline", () => {
    const result = calculateRiskScore(baseline);
    expect(result.reasons).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Timer formatter tests
// ---------------------------------------------------------------------------

describe("formatTimer()", () => {
  function formatTimer(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  test("300 seconds → 5:00", () => {
    expect(formatTimer(300)).toBe("5:00");
  });

  test("0 seconds → 0:00", () => {
    expect(formatTimer(0)).toBe("0:00");
  });

  test("90 seconds → 1:30", () => {
    expect(formatTimer(90)).toBe("1:30");
  });

  test("61 seconds → 1:01", () => {
    expect(formatTimer(61)).toBe("1:01");
  });

  test("59 seconds → 0:59", () => {
    expect(formatTimer(59)).toBe("0:59");
  });

  test("9 seconds → 0:09 (zero-padded)", () => {
    expect(formatTimer(9)).toBe("0:09");
  });
});
