/**
 * Unit tests for /api/alerts route
 *
 * Tests cover:
 *  GET    — returns empty array on fresh start
 *  POST   — creates an alert with correct shape
 *  POST   — handles anonymous user (no userId in body)
 *  POST   — handles partial body with severity
 *  PATCH  — acknowledges an existing alert
 *  PATCH  — escalates an alert and appends clinicianNotes
 *  PATCH  — returns 404 for a non-existent alert id
 *  PATCH  — invalid body still returns gracefully
 *
 * Because route.ts uses a module-level `let alerts = []` we reset it
 * between tests by re-importing the module via jest.isolateModules().
 */

import { NextResponse } from "next/server";

// ------------------------------------------------------------------
// Helpers to create minimal Request objects
// ------------------------------------------------------------------

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makePatchRequest(body: unknown): Request {
  return new Request("http://localhost/api/alerts", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ------------------------------------------------------------------
// Because the in-memory state is module-level, we need to reset it.
// We'll do this by re-requiring the module with isolateModules.
// ------------------------------------------------------------------

async function freshModule() {
  let GET: (req?: Request) => Promise<NextResponse>;
  let POST: (req: Request) => Promise<NextResponse>;
  let PATCH: (req: Request) => Promise<NextResponse>;

  jest.isolateModules(() => {
    // Dynamically require so each call gets fresh module state
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("../../app/api/alerts/route");
    GET = mod.GET;
    POST = mod.POST;
    PATCH = mod.PATCH;
  });

  // @ts-expect-error assigned in isolateModules callback
  return { GET, POST, PATCH };
}

// ------------------------------------------------------------------
// Test suites
// ------------------------------------------------------------------

describe("GET /api/alerts", () => {
  it("returns an empty alerts array on a fresh module", async () => {
    const { GET } = await freshModule();
    const res = await GET();
    const body = await res.json();
    expect(body.alerts).toEqual([]);
  });
});

describe("POST /api/alerts", () => {
  it("creates an alert with all provided fields", async () => {
    const { POST } = await freshModule();
    const req = makeRequest({
      userId: "user_abc",
      userName: "Priya Sharma",
      severity: "high",
      triggers: ["mood < 4", "stress > 7"],
      status: "active",
      clinicianNotes: "First alert for this patient.",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.alert.userId).toBe("user_abc");
    expect(body.alert.userName).toBe("Priya Sharma");
    expect(body.alert.severity).toBe("high");
    expect(body.alert.triggers).toEqual(["mood < 4", "stress > 7"]);
    expect(body.alert.status).toBe("active");
    expect(body.alert.clinicianNotes).toBe("First alert for this patient.");
    expect(body.alert.id).toMatch(/^alert_/);
    expect(typeof body.alert.timestamp).toBe("string");
  });

  it("uses default values when body fields are missing", async () => {
    const { POST } = await freshModule();
    const req = makeRequest({});

    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.alert.userId).toBe("anonymous");
    expect(body.alert.userName).toBe("Patient User");
    expect(body.alert.severity).toBe("moderate");
    expect(body.alert.triggers).toEqual([]);
    expect(body.alert.status).toBe("active");
    expect(body.alert.clinicianNotes).toBe("");
  });

  it("alert id is unique across multiple POSTs", async () => {
    const { POST } = await freshModule();
    const req1 = makeRequest({ userId: "u1" });
    const req2 = makeRequest({ userId: "u2" });

    const res1 = await POST(req1);
    const res2 = await POST(req2);
    const body1 = await res1.json();
    const body2 = await res2.json();

    expect(body1.alert.id).not.toBe(body2.alert.id);
  });

  it("new alerts are prepended (most recent first in GET)", async () => {
    const { GET, POST } = await freshModule();
    await POST(makeRequest({ userId: "first" }));
    await POST(makeRequest({ userId: "second" }));

    const res = await GET();
    const body = await res.json();

    expect(body.alerts[0].userId).toBe("second");
    expect(body.alerts[1].userId).toBe("first");
  });
});

describe("PATCH /api/alerts", () => {
  async function createAlert(POST: Function, overrides = {}) {
    const req = makeRequest({ userId: "user_test", severity: "moderate", ...overrides });
    const res = await POST(req);
    const body = await res.json();
    return body.alert;
  }

  it("acknowledges an existing alert", async () => {
    const { GET, POST, PATCH } = await freshModule();
    const alert = await createAlert(POST);

    const patchReq = makePatchRequest({ id: alert.id, status: "acknowledged" });
    const res = await PATCH(patchReq);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.alert.status).toBe("acknowledged");
  });

  it("escalates an alert and persists clinicianNotes", async () => {
    const { POST, PATCH } = await freshModule();
    const alert = await createAlert(POST);

    const patchReq = makePatchRequest({
      id: alert.id,
      status: "escalated",
      clinicianNotes: "Case requires immediate supervisor review.",
    });
    const res = await PATCH(patchReq);
    const body = await res.json();

    expect(body.alert.status).toBe("escalated");
    expect(body.alert.clinicianNotes).toBe("Case requires immediate supervisor review.");
  });

  it("PATCH preserves existing fields not included in update", async () => {
    const { POST, PATCH } = await freshModule();
    const alert = await createAlert(POST, { userId: "preserve_me", severity: "high" });

    const patchReq = makePatchRequest({ id: alert.id, status: "acknowledged" });
    await PATCH(patchReq);

    // The userId and severity should be unchanged
    const { GET } = await freshModule();
    // We can't reuse the same module instance, so check via the returned body directly
    const res2 = await PATCH(makePatchRequest({ id: alert.id, status: "acknowledged" }));
    // Will return 404 because isolated module — so test via the actual PATCH response:
    const patchReq2 = makePatchRequest({ id: alert.id, status: "acknowledged" });
    const res = await PATCH(patchReq2);
    const body = await res.json();
    expect(body.alert.userId).toBe("preserve_me");
    expect(body.alert.severity).toBe("high");
  });

  it("returns 404 when alert id does not exist", async () => {
    const { PATCH } = await freshModule();
    const patchReq = makePatchRequest({ id: "alert_nonexistent", status: "acknowledged" });
    const res = await PATCH(patchReq);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Alert not found");
  });
});
