import { NextResponse } from "next/server";

// Static global array in Node process to simulate a real-time database table for sessions
let sessions: any[] = [
  {
    id: "session_1",
    userId: "user_3Gz5rbgru2ATqR9jp1owVFtAcny",
    userName: "Nikhil Sharma",
    transcript: "I'm having a hard time today. The cravings are hitting, and I feel overwhelmed by work stress.",
    facialDistressScore: 0.82,
    vocalSentimentScore: 0.74,
    combinedRiskScore: 8,
    timestamp: new Date(Date.now() - 30 * 60000).toISOString()
  },
  {
    id: "session_2",
    userId: "user_3Gz6Oercpa4YHoMoWB1YO7fmZTl",
    userName: "Aditya Roy",
    transcript: "Emergency situation. Need someone to help me stay safe right now. Please notify coordinator.",
    facialDistressScore: 0.94,
    vocalSentimentScore: 0.88,
    combinedRiskScore: 10,
    timestamp: new Date(Date.now() - 5 * 60000).toISOString()
  }
];

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

    sessions.unshift(newSession); // add to top of list
    return NextResponse.json({ success: true, session: newSession });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
