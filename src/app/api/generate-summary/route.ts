import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { transcript, facialScore, vocalSentimentScore, moodScore, stressLevel, cravingIndex, role, userName } = await req.json();

    const targetRole = role || "doctor";
    const selectedUserName = userName || "Patient";

    // Setup Gemini if API Key is configured
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let prompt = "";
        if (targetRole === "doctor") {
          prompt = `You are a clinically aware psychiatric triage assistant for Hearthline Sentinel. Summarize the patient's session:
- Patient Name: ${selectedUserName}
- Transcript: "${transcript || 'None recorded'}"
- Facial Distress Level: ${facialScore || 0} (0 to 1 scale)
- Vocal Stress Cue Rating: ${vocalSentimentScore || 0} (0 to 1 scale)
- Explicit Mood Score: ${moodScore || 5} (1 to 10 scale)
- Stress Level: ${stressLevel || 5} (1 to 10 scale)

Generate a JSON object matching this structure:
{
  "observedIndicators": "Detailed summary of verbal and visual distress indicators",
  "confidenceNotes": "Clinical assessment of data clarity and confidence levels",
  "riskRationale": "Why the current risk was determined based on inputs",
  "recommendedFollowUp": ["Question 1", "Question 2"],
  "suggestedIntervention": "Dialogue recommendations for the therapist"
}
Do not include any diagnostic claims or state that the patient has a specific medical condition. Output valid JSON only, without markdown formatting.`;
        } else if (targetRole === "supervisor") {
          prompt = `You are a mental health operations supervisor coordinator. Summarize an escalated case:
- Patient Name: ${selectedUserName}
- Transcript: "${transcript || 'None recorded'}"
- Combined stress signals (Mood, Face, Voice): High / Critical

Generate a JSON object matching this structure:
{
  "escalationReason": "Operational reason for this escalation warning",
  "slaUrgency": "High / Urgent / Critical operational response category",
  "recommendedAction": "Action for supervisor (e.g. check on therapist, dispatch notification)",
  "auditNote": "Operational notes for database audit logs"
}
Output valid JSON only, without markdown formatting.`;
        } else {
          // Caregiver view
          prompt = `You are a supportive mental health guidance companion. Construct a gentle, supportive update for a family caregiver:
- Patient Name: ${selectedUserName}
- Overall mood and stress: Mood ${moodScore}/10, Stress ${stressLevel}/10

Generate a JSON object matching this structure:
{
  "whatToSay": "Compassionate verbal support script caregiver can say to loved one",
  "whatToAvoid": "Things caregiver should avoid saying to prevent friction",
  "boundaryTip": "A self-care or boundary setting tip for the caregiver"
}
Do not use technical, psychiatric, or alarming terminology. Output valid JSON only.`;
        }

        const response = await model.generateContent(prompt);
        let responseText = response.response ? response.response.text().trim() : null;

        if (responseText) {
          // Clean JSON wrappers if generated
          responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
          const data = JSON.parse(responseText);
          return NextResponse.json({ ...data, source: "gemini" });
        }
      } catch (err: any) {
        console.error("Gemini API call failed:", err.message);
      }
    }

    // No API key configured — return a clear, actionable error. Never fabricate clinical summaries.
    return NextResponse.json({
      _error: "GEMINI_API_KEY is not configured. Add it to .env.local to enable AI-generated summaries. No summary has been generated.",
      source: "unconfigured"
    }, { status: 503 });
  } catch (err: any) {
    console.error("Endpoint crash:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
