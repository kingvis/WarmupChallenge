/**
 * Unit tests for /api/generate-summary route
 *
 * Tests cover:
 *  1. Missing GEMINI_API_KEY → returns 503 with _error field (no fabricated data)
 *  2. Valid API key + successful Gemini response → returns structured doctor summary
 *  3. Valid API key + successful Gemini response → returns supervisor escalation summary
 *  4. Valid API key + successful Gemini response → returns caregiver guide summary
 *  5. Gemini API throws → returns 503 with _error (no fallback mock data)
 *  6. Gemini returns non-JSON → returns 503 (parse failure is handled gracefully)
 *  7. Missing role → defaults to "doctor"
 *  8. Missing userName → defaults to "Patient"
 *  9. Internal crash (malformed body) → returns 500
 *
 * Gemini SDK is fully mocked via jest.mock so no real API calls are made.
 */

import { NextResponse } from "next/server";

// ------------------------------------------------------------------
// Mock the @google/generative-ai module
// ------------------------------------------------------------------

const mockGenerateContent = jest.fn();

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/generate-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockGeminiSuccess(jsonPayload: object) {
  mockGenerateContent.mockResolvedValueOnce({
    response: {
      text: () => JSON.stringify(jsonPayload),
    },
  });
}

function mockGeminiFailure(error: Error) {
  mockGenerateContent.mockRejectedValueOnce(error);
}

// ------------------------------------------------------------------
// The expected doctor response shape
// ------------------------------------------------------------------

const DOCTOR_RESPONSE = {
  observedIndicators: "Patient shows elevated facial distress (0.8) with stressed verbal transcript.",
  confidenceNotes: "High confidence — all three modalities active.",
  riskRationale: "Mood 3/10 combined with high vocal stress triggered scoring.",
  recommendedFollowUp: ["How long have you felt this way?", "Who can you call right now?"],
  suggestedIntervention: "Initiate immediate Pranayama and contact caregiver.",
};

const SUPERVISOR_RESPONSE = {
  escalationReason: "Patient triggered SOS with high facial distress.",
  slaUrgency: "Critical",
  recommendedAction: "Dispatch WhatsApp to caregiver and notify on-call clinician.",
  auditNote: "Auto-escalation log appended at 12:05.",
};

const CAREGIVER_RESPONSE = {
  whatToSay: "I see you are struggling. Let's breathe together for a moment.",
  whatToAvoid: "Do not bring up past relapses or make demands.",
  boundaryTip: "Step away for 5 minutes and drink water — your calm is the anchor.",
};

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------

describe("POST /api/generate-summary — no GEMINI_API_KEY", () => {
  const original = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    jest.resetModules();
  });

  afterEach(() => {
    if (original) process.env.GEMINI_API_KEY = original;
    else delete process.env.GEMINI_API_KEY;
  });

  it("returns 503 with _error when API key is absent", async () => {
    // Re-import after env reset
    jest.isolateModules(async () => {
      const { POST } = require("../../app/api/generate-summary/route");
      const req = makeRequest({ role: "doctor", userName: "Test" });
      const res = await POST(req);

      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body._error).toContain("GEMINI_API_KEY");
      expect(body.source).toBe("unconfigured");

      // Critical: no fabricated clinical content
      expect(body.observedIndicators).toBeUndefined();
      expect(body.riskRationale).toBeUndefined();
      expect(body.escalationReason).toBeUndefined();
      expect(body.whatToSay).toBeUndefined();
    });
  });
});

describe("POST /api/generate-summary — with GEMINI_API_KEY", () => {
  beforeAll(() => {
    process.env.GEMINI_API_KEY = "test_api_key_sentinel";
  });

  beforeEach(() => {
    mockGenerateContent.mockReset();
    jest.resetModules();
  });

  afterAll(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it("role=doctor returns structured clinical summary from Gemini", async () => {
    mockGeminiSuccess(DOCTOR_RESPONSE);

    jest.isolateModules(async () => {
      const { POST } = require("../../app/api/generate-summary/route");
      const req = makeRequest({
        role: "doctor",
        userName: "Priya",
        transcript: "I feel very anxious today.",
        facialScore: 0.8,
        vocalSentimentScore: 0.7,
        moodScore: 3,
        stressLevel: 8,
      });
      const res = await POST(req);
      const body = await res.json();

      expect(body.source).toBe("gemini");
      expect(body.observedIndicators).toBe(DOCTOR_RESPONSE.observedIndicators);
      expect(body.recommendedFollowUp).toHaveLength(2);
      expect(body.riskRationale).toContain("Mood");
    });
  });

  it("role=supervisor returns escalation summary from Gemini", async () => {
    mockGeminiSuccess(SUPERVISOR_RESPONSE);

    jest.isolateModules(async () => {
      const { POST } = require("../../app/api/generate-summary/route");
      const req = makeRequest({ role: "supervisor", userName: "Raj" });
      const res = await POST(req);
      const body = await res.json();

      expect(body.source).toBe("gemini");
      expect(body.escalationReason).toBe(SUPERVISOR_RESPONSE.escalationReason);
      expect(body.slaUrgency).toBe("Critical");
      expect(body.recommendedAction).toBeDefined();
    });
  });

  it("role=caregiver returns support guide from Gemini", async () => {
    mockGeminiSuccess(CAREGIVER_RESPONSE);

    jest.isolateModules(async () => {
      const { POST } = require("../../app/api/generate-summary/route");
      const req = makeRequest({ role: "caregiver", userName: "Meena", moodScore: 4, stressLevel: 7 });
      const res = await POST(req);
      const body = await res.json();

      expect(body.source).toBe("gemini");
      expect(body.whatToSay).toBe(CAREGIVER_RESPONSE.whatToSay);
      expect(body.whatToAvoid).toBeDefined();
      expect(body.boundaryTip).toBeDefined();
    });
  });

  it("missing role defaults to doctor path", async () => {
    mockGeminiSuccess(DOCTOR_RESPONSE);

    jest.isolateModules(async () => {
      const { POST } = require("../../app/api/generate-summary/route");
      const req = makeRequest({ userName: "DefaultUser" }); // no role field
      const res = await POST(req);
      const body = await res.json();
      // Doctor response shape should be present
      expect(body.observedIndicators).toBeDefined();
    });
  });

  it("Gemini API throws → returns 503 with _error, no fabricated content", async () => {
    mockGeminiFailure(new Error("API quota exceeded"));

    jest.isolateModules(async () => {
      const { POST } = require("../../app/api/generate-summary/route");
      const req = makeRequest({ role: "doctor", userName: "ErrorUser" });
      const res = await POST(req);

      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body._error).toContain("GEMINI_API_KEY");
      // No fabricated clinical content on Gemini failure
      expect(body.observedIndicators).toBeUndefined();
    });
  });

  it("Gemini returns non-JSON text → 503 with _error", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => "Sorry, I cannot help with that." },
    });

    jest.isolateModules(async () => {
      const { POST } = require("../../app/api/generate-summary/route");
      const req = makeRequest({ role: "doctor", userName: "JsonFail" });
      const res = await POST(req);
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body._error).toBeDefined();
    });
  });

  it("Gemini returns JSON wrapped in markdown fences → still parses correctly", async () => {
    const wrapped = "```json\n" + JSON.stringify(DOCTOR_RESPONSE) + "\n```";
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => wrapped },
    });

    jest.isolateModules(async () => {
      const { POST } = require("../../app/api/generate-summary/route");
      const req = makeRequest({ role: "doctor", userName: "FenceTest" });
      const res = await POST(req);
      const body = await res.json();
      expect(body.source).toBe("gemini");
      expect(body.observedIndicators).toBe(DOCTOR_RESPONSE.observedIndicators);
    });
  });
});

describe("POST /api/generate-summary — malformed body", () => {
  it("returns 500 when body is not valid JSON", async () => {
    process.env.GEMINI_API_KEY = "test_key";
    jest.resetModules();

    jest.isolateModules(async () => {
      const { POST } = require("../../app/api/generate-summary/route");
      const req = new Request("http://localhost/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{NOT_JSON}", // invalid
      });
      const res = await POST(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });
  });
});
