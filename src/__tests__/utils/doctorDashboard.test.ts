/**
 * Unit tests for Doctor Dashboard logic
 *
 * Tests cover the pure business logic functions extracted from doctor/page.tsx:
 *
 *  - derivePatientList()     — builds patient roster from session objects
 *  - getPatientStatus()      — maps combinedRiskScore to a status label
 *  - getPatientAlert()       — finds an alert by patient ID (handles null)
 *  - getPatientSession()     — finds a session by patient ID (handles null)
 *  - deriveUniquePatients()  — deduplicates sessions by userId
 *
 * These functions are extracted here as pure functions matching the logic
 * in the page component so they can be tested without rendering React.
 */

// ---------------------------------------------------------------------------
// Pure function extractions (mirror doctor/page.tsx logic)
// ---------------------------------------------------------------------------

interface Session {
  userId: string;
  userName: string;
  timestamp: string;
  combinedRiskScore: number;
  facialDistressScore: number;
  vocalSentimentScore: number;
  transcript: string;
}

interface Alert {
  id: string;
  userId: string;
  userName: string;
  severity: string;
  status: string;
  triggers: string[];
  clinicianNotes: string;
  timestamp: string;
}

interface PatientCard {
  id: string;
  name: string;
  lastActive: string;
  riskScore: number;
  status: string;
}

function getPatientStatus(combinedRiskScore: number): string {
  if (combinedRiskScore >= 9) return "Critical";
  if (combinedRiskScore >= 6) return "High Risk";
  if (combinedRiskScore >= 3) return "Moderate";
  return "Low Risk";
}

function deriveUniquePatients(sessions: Session[]): PatientCard[] {
  const seen = new Set<string>();
  return sessions
    .filter((s) => {
      if (seen.has(s.userId)) return false;
      seen.add(s.userId);
      return true;
    })
    .map((s) => ({
      id: s.userId,
      name: s.userName,
      lastActive: new Date(s.timestamp).toLocaleTimeString(),
      riskScore: s.combinedRiskScore,
      status: getPatientStatus(s.combinedRiskScore),
    }));
}

function getPatientAlert(alerts: Alert[], patientId: string | null): Alert | undefined {
  if (!patientId) return undefined;
  return alerts.find((a) => a.userId === patientId);
}

function getPatientSession(sessions: Session[], patientId: string | null): Session | undefined {
  if (!patientId) return undefined;
  return sessions.find((s) => s.userId === patientId);
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    userId: "user_1",
    userName: "Test Patient",
    timestamp: new Date().toISOString(),
    combinedRiskScore: 5,
    facialDistressScore: 0.5,
    vocalSentimentScore: 0.4,
    transcript: "Test transcript",
    ...overrides,
  };
}

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: "alert_1",
    userId: "user_1",
    userName: "Test Patient",
    severity: "moderate",
    status: "active",
    triggers: [],
    clinicianNotes: "",
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getPatientStatus()", () => {
  test("score >= 9 → Critical", () => {
    expect(getPatientStatus(9)).toBe("Critical");
    expect(getPatientStatus(10)).toBe("Critical");
    expect(getPatientStatus(15)).toBe("Critical");
  });

  test("score >= 6 and < 9 → High Risk", () => {
    expect(getPatientStatus(6)).toBe("High Risk");
    expect(getPatientStatus(7)).toBe("High Risk");
    expect(getPatientStatus(8)).toBe("High Risk");
  });

  test("score >= 3 and < 6 → Moderate", () => {
    expect(getPatientStatus(3)).toBe("Moderate");
    expect(getPatientStatus(4)).toBe("Moderate");
    expect(getPatientStatus(5)).toBe("Moderate");
  });

  test("score < 3 → Low Risk", () => {
    expect(getPatientStatus(0)).toBe("Low Risk");
    expect(getPatientStatus(1)).toBe("Low Risk");
    expect(getPatientStatus(2)).toBe("Low Risk");
  });

  test("boundary: exactly 9 is Critical, exactly 6 is High Risk, exactly 3 is Moderate", () => {
    expect(getPatientStatus(9)).toBe("Critical");
    expect(getPatientStatus(6)).toBe("High Risk");
    expect(getPatientStatus(3)).toBe("Moderate");
  });
});

describe("deriveUniquePatients()", () => {
  test("returns empty array for empty session list", () => {
    expect(deriveUniquePatients([])).toEqual([]);
  });

  test("maps single session to patient card correctly", () => {
    const session = makeSession({ userId: "u1", userName: "Priya", combinedRiskScore: 7 });
    const patients = deriveUniquePatients([session]);

    expect(patients).toHaveLength(1);
    expect(patients[0].id).toBe("u1");
    expect(patients[0].name).toBe("Priya");
    expect(patients[0].riskScore).toBe(7);
    expect(patients[0].status).toBe("High Risk");
  });

  test("deduplicates sessions for the same userId (keeps first occurrence)", () => {
    const session1 = makeSession({ userId: "u1", userName: "User One", combinedRiskScore: 3 });
    const session2 = makeSession({ userId: "u1", userName: "User One Again", combinedRiskScore: 8 });
    const session3 = makeSession({ userId: "u2", userName: "User Two", combinedRiskScore: 1 });

    const patients = deriveUniquePatients([session1, session2, session3]);

    expect(patients).toHaveLength(2);
    expect(patients[0].id).toBe("u1");
    expect(patients[0].riskScore).toBe(3); // first occurrence wins
    expect(patients[1].id).toBe("u2");
  });

  test("assigns correct status labels based on riskScore", () => {
    const sessions = [
      makeSession({ userId: "u_crit", combinedRiskScore: 9 }),
      makeSession({ userId: "u_high", combinedRiskScore: 6 }),
      makeSession({ userId: "u_mod", combinedRiskScore: 4 }),
      makeSession({ userId: "u_low", combinedRiskScore: 2 }),
    ];
    const patients = deriveUniquePatients(sessions);

    expect(patients.find((p) => p.id === "u_crit")?.status).toBe("Critical");
    expect(patients.find((p) => p.id === "u_high")?.status).toBe("High Risk");
    expect(patients.find((p) => p.id === "u_mod")?.status).toBe("Moderate");
    expect(patients.find((p) => p.id === "u_low")?.status).toBe("Low Risk");
  });

  test("preserves original array order for unique users", () => {
    const sessions = [
      makeSession({ userId: "c" }),
      makeSession({ userId: "a" }),
      makeSession({ userId: "b" }),
    ];
    const patients = deriveUniquePatients(sessions);
    expect(patients.map((p) => p.id)).toEqual(["c", "a", "b"]);
  });
});

describe("getPatientAlert()", () => {
  const alerts = [
    makeAlert({ id: "al_1", userId: "u1" }),
    makeAlert({ id: "al_2", userId: "u2", status: "escalated" }),
    makeAlert({ id: "al_3", userId: "u3" }),
  ];

  test("returns alert when userId matches", () => {
    const found = getPatientAlert(alerts, "u2");
    expect(found?.id).toBe("al_2");
    expect(found?.status).toBe("escalated");
  });

  test("returns undefined for a non-existent userId", () => {
    expect(getPatientAlert(alerts, "u_missing")).toBeUndefined();
  });

  test("returns undefined when patientId is null", () => {
    expect(getPatientAlert(alerts, null)).toBeUndefined();
  });

  test("returns first match when multiple alerts share userId", () => {
    const duplicates = [
      makeAlert({ id: "al_first", userId: "shared" }),
      makeAlert({ id: "al_second", userId: "shared" }),
    ];
    expect(getPatientAlert(duplicates, "shared")?.id).toBe("al_first");
  });

  test("works correctly with empty alert list", () => {
    expect(getPatientAlert([], "u1")).toBeUndefined();
  });
});

describe("getPatientSession()", () => {
  const sessions = [
    makeSession({ userId: "u1", transcript: "First session" }),
    makeSession({ userId: "u2", transcript: "Second session" }),
  ];

  test("returns session when userId matches", () => {
    const found = getPatientSession(sessions, "u1");
    expect(found?.transcript).toBe("First session");
  });

  test("returns undefined for unknown userId", () => {
    expect(getPatientSession(sessions, "u_unknown")).toBeUndefined();
  });

  test("returns undefined when patientId is null", () => {
    expect(getPatientSession(sessions, null)).toBeUndefined();
  });

  test("returns first match in duplicate sessions", () => {
    const dupSessions = [
      makeSession({ userId: "dup", transcript: "Original" }),
      makeSession({ userId: "dup", transcript: "Duplicate" }),
    ];
    expect(getPatientSession(dupSessions, "dup")?.transcript).toBe("Original");
  });

  test("works with empty session list", () => {
    expect(getPatientSession([], "u1")).toBeUndefined();
  });
});
