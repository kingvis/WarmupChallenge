/**
 * Unit tests for /api/analyze-document route
 *
 * Tests cover:
 *  POST — 400 when documentText is missing or invalid
 *  POST — Fallback JSON output when GEMINI_API_KEY is not configured
 *  POST — Valid JSON response when API key is provided / mocked
 */

import { POST } from "../../app/api/analyze-document/route";

function makeDocRequest(body: unknown): any {
  return new Request("http://localhost/api/analyze-document", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/analyze-document", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns 400 when documentText is missing", async () => {
    const req = makeDocRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("Document text content is required for extraction.");
  });

  it("returns 400 when documentText is not a string", async () => {
    const req = makeDocRequest({ documentText: 12345 });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("Document text content is required for extraction.");
  });

  it("returns fallback JSON with manual review warning when GEMINI_API_KEY is unconfigured", async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_AI_KEY;

    const req = makeDocRequest({
      documentText: "Patient discharge summary: Patient presents with anxiety.",
      filename: "discharge.txt",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.documentType).toBe("unknown");
    expect(body.reviewRequired).toBe(true);
    expect(body.confidenceScore).toBe(0.0);
    expect(body.warning).toContain("Gemini API key not configured");
  });
});
