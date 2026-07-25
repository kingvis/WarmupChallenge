import { NextResponse } from "next/server";

// Static global array in Node process. Starts empty. No pre-loaded sessions.
let sessions: any[] = [];

export async function GET() {
  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  try {
    const { userId, userName, transcript, facialDistressScore, vocalSentimentScore, combinedRiskScore } = await req.json();

    const newSession = {
      id: `session_${Date.now()}`,
      userId: userId || "anonymous",
      userName: userName || "Patient User",
      transcript: transcript || "",
      facialDistressScore: facialDistressScore || 0,
      vocalSentimentScore: vocalSentimentScore || 0,
      combinedRiskScore: combinedRiskScore || 0,
      timestamp: new Date().toISOString()
    };

    sessions.unshift(newSession);
    return NextResponse.json({ success: true, session: newSession });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
