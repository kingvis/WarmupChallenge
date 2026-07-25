/**
 * Unit tests for Supervisor Dashboard logic
 *
 * Tests cover:
 *  - WhatsApp dispatch log generation (newLog shape)
 *  - Alert filtering (only escalated alerts visible in supervisor feed)
 *  - SLA countdown timer formatting (same formatTimer as user dashboard)
 *  - Dispatch log immutability — each dispatch creates a unique log entry
 */

// ---------------------------------------------------------------------------
// Pure functions mirrored from supervisor/page.tsx
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

interface DispatchLog {
  id: string;
  to: string;
  message: string;
  status: string;
  timestamp: string;
}

function createDispatchLog(userName: string): DispatchLog {
  return {
    id: `log_${Date.now()}`,
    to: "Caregiver (configure in patient Settings)",
    message: `[SENTINEL ESCALATION] Patient ${userName} requires immediate attention. Please check on them.`,
    status: "simulated",
    timestamp: new Date().toLocaleTimeString(),
  };
}

function filterEscalatedAlerts(alerts: AlertItem[]): AlertItem[] {
  return alerts.filter((a) => a.status === "escalated");
}

function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeAlert(overrides: Partial<AlertItem> = {}): AlertItem {
  return {
    id: "al_1",
    userId: "u1",
    userName: "Test User",
    severity: "high",
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

describe("createDispatchLog()", () => {
  test("creates a log entry with the correct patient name in message", () => {
    const log = createDispatchLog("Priya Mehta");
    expect(log.message).toContain("Priya Mehta");
  });

  test("status is always 'simulated' for dispatcher logs", () => {
    const log = createDispatchLog("Someone");
    expect(log.status).toBe("simulated");
  });

  test("id starts with 'log_'", () => {
    const log = createDispatchLog("Someone");
    expect(log.id).toMatch(/^log_/);
  });

  test("recipient is always the generic 'configure in patient Settings' message", () => {
    const log = createDispatchLog("Raj");
    expect(log.to).toBe("Caregiver (configure in patient Settings)");
  });

  test("message follows the SENTINEL ESCALATION format", () => {
    const log = createDispatchLog("Ananya");
    expect(log.message).toMatch(/^\[SENTINEL ESCALATION\] Patient Ananya/);
  });

  test("two consecutive logs have different ids", async () => {
    const log1 = createDispatchLog("User A");
    await new Promise((r) => setTimeout(r, 2));
    const log2 = createDispatchLog("User B");
    expect(log1.id).not.toBe(log2.id);
  });

  test("timestamp is a non-empty string", () => {
    const log = createDispatchLog("User");
    expect(typeof log.timestamp).toBe("string");
    expect(log.timestamp.length).toBeGreaterThan(0);
  });
});

describe("filterEscalatedAlerts()", () => {
  const alerts = [
    makeAlert({ id: "a1", status: "active" }),
    makeAlert({ id: "a2", status: "escalated" }),
    makeAlert({ id: "a3", status: "acknowledged" }),
    makeAlert({ id: "a4", status: "escalated" }),
    makeAlert({ id: "a5", status: "resolved" }),
  ];

  test("returns only alerts with status=escalated", () => {
    const result = filterEscalatedAlerts(alerts);
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.id)).toEqual(["a2", "a4"]);
  });

  test("returns empty array when no alerts are escalated", () => {
    const noEscalations = [
      makeAlert({ status: "active" }),
      makeAlert({ status: "acknowledged" }),
    ];
    expect(filterEscalatedAlerts(noEscalations)).toHaveLength(0);
  });

  test("returns empty array for empty input", () => {
    expect(filterEscalatedAlerts([])).toHaveLength(0);
  });

  test("returns all alerts if all are escalated", () => {
    const allEscalated = [
      makeAlert({ id: "e1", status: "escalated" }),
      makeAlert({ id: "e2", status: "escalated" }),
    ];
    expect(filterEscalatedAlerts(allEscalated)).toHaveLength(2);
  });

  test("preserves alert data fields after filtering", () => {
    const result = filterEscalatedAlerts(alerts);
    const found = result.find((a) => a.id === "a2");
    expect(found?.userId).toBe("u1");
    expect(found?.severity).toBe("high");
  });
});

describe("SLA formatTimer() — supervisor countdown", () => {
  test("600 seconds → 10:00", () => {
    expect(formatTimer(600)).toBe("10:00");
  });

  test("0 seconds → 0:00", () => {
    expect(formatTimer(0)).toBe("0:00");
  });

  test("1 second → 0:01 (zero-padded)", () => {
    expect(formatTimer(1)).toBe("0:01");
  });

  test("75 seconds → 1:15", () => {
    expect(formatTimer(75)).toBe("1:15");
  });

  test("900 seconds → 15:00", () => {
    expect(formatTimer(900)).toBe("15:00");
  });
});

describe("Dispatch log prepend behaviour", () => {
  test("prepending new logs produces newest-first ordering", async () => {
    let logs: DispatchLog[] = [];

    logs = [createDispatchLog("User A"), ...logs];
    await new Promise((r) => setTimeout(r, 2));
    logs = [createDispatchLog("User B"), ...logs];
    await new Promise((r) => setTimeout(r, 2));
    logs = [createDispatchLog("User C"), ...logs];

    expect(logs[0].message).toContain("User C");
    expect(logs[1].message).toContain("User B");
    expect(logs[2].message).toContain("User A");
  });
});
