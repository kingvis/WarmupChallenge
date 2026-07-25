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

    // Fallback Mock System
    if (targetRole === "doctor") {
      return NextResponse.json({
        observedIndicators: `Simulated logs: Patient ${selectedUserName} reported a mood score of ${moodScore || 5}/10 and stress level of ${stressLevel || 5}/10. Facial analysis registered distress indicators with confidence: ${(facialScore || 0.35).toFixed(2)}. Verbal transcript contained stress cues: "${transcript || 'User remained mostly quiet during check-in'}"`,
        confidenceNotes: "Moderate data confidence. Audio signals match manual check-in parameters.",
        riskRationale: `Risk computed based on active check-in mood (${moodScore}/10) and stress level (${stressLevel}/10) exceeding baseline parameters.`,
        recommendedFollowUp: [
          `Can you describe the physical sensations you feel when stress rises to ${stressLevel}/10?`,
          "Who in your immediate circle is available to sit with you right now?"
        ],
        suggestedIntervention: "Invite the patient to sit in a quiet area and initiate a 5-minute Pranayama breathing guide.",
        source: "fallback"
      });
    } else if (targetRole === "supervisor") {
      return NextResponse.json({
        escalationReason: `Automatic alert triggered for patient ${selectedUserName} due to high stress level (${stressLevel}/10) and distress transcript patterns.`,
        slaUrgency: "HIGH URGENCY - Requires clinician response acknowledgement within 15 minutes.",
        recommendedAction: "Verify if the assigned doctor has reviewed the patient session log. Ready Twilio WhatsApp caregiver dispatch backup.",
        auditNote: "Alert log successfully dispatched to supervisor audit database.",
        source: "fallback"
      });
    } else {
      return NextResponse.json({
        whatToSay: `Namaste. I can see you are carrying a lot of weight today. Let's take a slow, deep breath together. I am right here with you.`,
        whatToAvoid: "Avoid asking demanding questions like 'Why are you feeling like this again?' or bringing up past relapse events.",
        boundaryTip: "Remember that you cannot force their recovery. Step away, drink a glass of water, and give yourself a 5-minute breather.",
        source: "fallback"
      });
    }
  } catch (err: any) {
    console.error("Endpoint crash:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
