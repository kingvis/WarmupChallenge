/**
 * Unit tests for /api/sessions route
 *
 * Tests cover:
 *  GET    — returns empty array on fresh module
 *  POST   — creates session with all correct fields
 *  POST   — applies default values when body is sparse
 *  POST   — stores numeric scores correctly (0.0 – 1.0 range)
 *  POST   — multiple sessions are prepended (newest first)
 *  GET    — reflects all previously POSTed sessions
 *
 * Module-level state is reset per describe block via jest.isolateModules().
 */

import { NextResponse } from "next/server";

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function makePostRequest(body: unknown): Request {
  return new Request("http://localhost/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function freshModule() {
  let GET: () => Promise<NextResponse>;
  let POST: (req: Request) => Promise<NextResponse>;

  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("../../app/api/sessions/route");
    GET = mod.GET;
    POST = mod.POST;
  });

  // @ts-expect-error assigned inside isolateModules
  return { GET, POST };
}

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------

describe("GET /api/sessions", () => {
  it("returns an empty sessions array on a fresh module", async () => {
    const { GET } = await freshModule();
    const res = await GET();
    const body = await res.json();
    expect(body.sessions).toEqual([]);
  });
});

describe("POST /api/sessions", () => {
  it("creates a session with all provided fields", async () => {
    const { POST } = await freshModule();

    const req = makePostRequest({
      userId: "user_xyz",
      userName: "Arjun Mehta",
      transcript: "I have been feeling overwhelmed lately.",
      facialDistressScore: 0.72,
      vocalSentimentScore: 0.65,
      combinedRiskScore: 7,
    });

    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.session.userId).toBe("user_xyz");
    expect(body.session.userName).toBe("Arjun Mehta");
    expect(body.session.transcript).toBe("I have been feeling overwhelmed lately.");
    expect(body.session.facialDistressScore).toBe(0.72);
    expect(body.session.vocalSentimentScore).toBe(0.65);
    expect(body.session.combinedRiskScore).toBe(7);
    expect(body.session.id).toMatch(/^session_/);
    expect(typeof body.session.timestamp).toBe("string");
  });

  it("uses default values when body fields are missing", async () => {
    const { POST } = await freshModule();
    const req = makePostRequest({});
    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.session.userId).toBe("anonymous");
    expect(body.session.userName).toBe("Patient User");
    expect(body.session.transcript).toBe("");
    expect(body.session.facialDistressScore).toBe(0);
    expect(body.session.vocalSentimentScore).toBe(0);
    expect(body.session.combinedRiskScore).toBe(0);
  });

  it("preserves floating-point scores without rounding", async () => {
    const { POST } = await freshModule();
    const req = makePostRequest({
      userId: "u1",
      facialDistressScore: 0.123456789,
      vocalSentimentScore: 0.987654321,
      combinedRiskScore: 9.5,
    });
    const res = await POST(req);
    const body = await res.json();

    expect(body.session.facialDistressScore).toBeCloseTo(0.123456789, 8);
    expect(body.session.vocalSentimentScore).toBeCloseTo(0.987654321, 8);
    expect(body.session.combinedRiskScore).toBe(9.5);
  });

  it("allows zero-value facial and vocal scores", async () => {
    const { POST } = await freshModule();
    const req = makePostRequest({
      userId: "u2",
      facialDistressScore: 0,
      vocalSentimentScore: 0,
      combinedRiskScore: 0,
    });
    const res = await POST(req);
    const body = await res.json();

    // 0 || 0 evaluates to 0 in the route, so this should still be 0
    expect(body.session.facialDistressScore).toBe(0);
    expect(body.session.vocalSentimentScore).toBe(0);
  });

  it("generates unique session ids across multiple POSTs", async () => {
    const { POST } = await freshModule();
    const ids = new Set<string>();

    for (let i = 0; i < 5; i++) {
      const req = makePostRequest({ userId: `u${i}` });
      const res = await POST(req);
      const body = await res.json();
      ids.add(body.session.id);
      // Small delay to ensure Date.now() differs
      await new Promise((r) => setTimeout(r, 2));
    }

    expect(ids.size).toBe(5);
  });

  it("stores session timestamp as ISO string", async () => {
    const { POST } = await freshModule();
    const before = Date.now();
    const req = makePostRequest({ userId: "u_ts" });
    const res = await POST(req);
    const body = await res.json();
    const after = Date.now();

    const ts = new Date(body.session.timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

describe("GET /api/sessions — reflects all POSTed sessions (newest first)", () => {
  it("returns all sessions ordered most-recent first", async () => {
    const { GET, POST } = await freshModule();

    await POST(makePostRequest({ userId: "first", userName: "User A" }));
    await new Promise((r) => setTimeout(r, 2));
    await POST(makePostRequest({ userId: "second", userName: "User B" }));
    await new Promise((r) => setTimeout(r, 2));
    await POST(makePostRequest({ userId: "third", userName: "User C" }));

    const res = await GET();
    const body = await res.json();

    expect(body.sessions).toHaveLength(3);
    expect(body.sessions[0].userId).toBe("third");
    expect(body.sessions[1].userId).toBe("second");
    expect(body.sessions[2].userId).toBe("first");
  });
});
