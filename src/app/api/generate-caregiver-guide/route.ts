import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MOCK_CAREGIVER_GUIDANCE: Record<string, { whatToSay: string; whatToAvoid: string; boundaryTip: string; whenToEscalate: string }> = {
  trigger: {
    whatToSay: "Main samajh sakta/sakti hoon ki yeh moment mushkil hai. Hum saath milkar ek-ek minute karke isse handle karenge. (I understand this moment is tough. We will handle this together one minute at a time.)",
    whatToAvoid: "Avoid saying: 'Tum phir shuru ho gaye? Kya tum kabhi nahi sudhar sakte?' (Are you starting again? Will you never improve?) - Avoid shame.",
    boundaryTip: "Remember that you cannot control their cravings, but you can control your peaceful reactions. Step away if you feel overwhelmed.",
    whenToEscalate: "If they exhibit physical restlessness, intense mood swings, or signs of drug seeking, prepare a safety exit and contact Tele-MANAS."
  },
  help_now: {
    whatToSay: "Main yahan tumhare saath hoon. Abhi sabse pehle hume safe jagah par chalna chahiye. (I am here with you. First, let's get to a safe place.)",
    whatToAvoid: "Avoid lecturing or arguing about past mistakes in this high-panic crisis moment. Prioritize safety over lessons.",
    boundaryTip: "Do not hide or cover up relapse behavior. Be compassionate, but do not lie to protect them from the consequences.",
    whenToEscalate: "Immediately call Tele-MANAS (14416) or emergency lines if they state self-harm plans, exhibit slow/shallow breathing, or lose consciousness."
  },
  talk_someone: {
    whatToSay: "Main dekh raha hoon ki tum mehnat kar rahe ho. Agar tum share karna chaho toh main sunne ke liye taiyaar hoon. (I see you are working hard. If you want to share, I am ready to listen.)",
    whatToAvoid: "Avoid giving unsolicited advice or downplaying their stress by saying 'Yeh toh bas tumhare dimaag mein hai'.",
    boundaryTip: "Active listening does not mean agreeing to unreasonable demands. Keep conversations respectful and set limits on shouting.",
    whenToEscalate: "If they withdraw from family contact completely and refuse accountability checks, consult a recovery advisor or helpline."
  },
  prevention: {
    whatToSay: "Chalo hum donon milkar ek plan likhte hain taaki jab stress badhe, hume pata ho kya karna hai. (Let's write a plan together so when stress rises, we know what to do.)",
    whatToAvoid: "Avoid bringing up past relapse events in a blaming way. Keep it focused on future protective tools.",
    boundaryTip: "Set aside non-negotiable time for your own mental health, such as local family support meetings or hobbies.",
    whenToEscalate: "Escalate if they stop taking prescription support, miss recovery meetings consecutively, or begin showing old patterns."
  }
};

export async function POST(req: Request) {
  try {
    const { situation } = await req.json();

    if (!situation) {
      return NextResponse.json({ error: "Situation is required" }, { status: 400 });
    }

    const normalizedSituation = situation.toLowerCase();
    let situationKey = "trigger";
    if (normalizedSituation.includes("help now") || normalizedSituation.includes("crisis") || normalizedSituation.includes("urgent") || normalizedSituation.includes("need help now")) {
      situationKey = "help_now";
    } else if (normalizedSituation.includes("talk") || normalizedSituation.includes("someone") || normalizedSituation.includes("chat")) {
      situationKey = "talk_someone";
    } else if (normalizedSituation.includes("prevent") || normalizedSituation.includes("prevention") || normalizedSituation.includes("future")) {
      situationKey = "prevention";
    }

    // Setup Gemini if API Key is configured
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are a supportive, clinically aware advisor for caregivers in India supporting a loved one in substance use recovery. A caregiver is supporting a loved one who is in a high-stress situation: "${situation}".
Generate practical guidance containing:
1. WHAT TO SAY (a 1-2 sentence supportive, non-enabling script they can say to their loved one, using polite Indian phrases or local English/Hindi blends).
2. WHAT TO AVOID (1 sentence of what they should avoid saying, e.g., guilt-tripping or blaming).
3. BOUNDARY TIP (1 sentence on setting healthy limits or practicing self-care in this specific situation).
4. WHEN TO ESCALATE (1 brief warning sign or action to take if safety is compromised, mentioning local resources like Tele-MANAS 14416 or emergency numbers).

Return the output as a valid JSON object matching this structure:
{
  "whatToSay": "...",
  "whatToAvoid": "...",
  "boundaryTip": "...",
  "whenToEscalate": "..."
}
Ensure the JSON is valid and return ONLY the JSON block. Do not wrap in markdown code blocks like \`\`\`json.`;

        const response = await model.generateContent(prompt);
        let responseText = response.response ? response.response.text().trim() : null;

        if (responseText) {
          // Clean markdown blocks if returned
          responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
          const data = JSON.parse(responseText);
          return NextResponse.json({ ...data, source: "gemini" });
        }
      } catch (err: any) {
        console.error("Gemini API error:", err.message);
      }
    }

    // Fallback to Mock Data
    const guidance = MOCK_CAREGIVER_GUIDANCE[situationKey] || MOCK_CAREGIVER_GUIDANCE.trigger;
    return NextResponse.json({ ...guidance, source: "fallback" });
  } catch (err: any) {
    console.error("Endpoint crash:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
