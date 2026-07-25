import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MOCK_RECOVERY_SCRIPTS: Record<string, Record<string, Record<string, string>>> = {
  trigger: {
    english: {
      sponsor: "Hey, I'm feeling triggered right now and experiencing intense cravings. Are you free for a quick call or check-in?",
      family: "I'm having a tough moment and wanted to let you know so I can stay accountable. I just need a calm space to sit for a bit.",
      friend: "Hey, I'm in a situation where I feel triggered. Can we chat for a bit to help me distract myself and stay safe?",
      default: "I am experiencing cravings right now. I'm reaching out because I want to stay safe and talk through this trigger."
    },
    hinglish: {
      sponsor: "Bhai, mujhe thoda trigger feel ho raha hai aur cravings ho rahi hain. Kya hum thodi der baat kar sakte hain?",
      family: "Ghar pe sab theek hai, par mujhe thoda heavy feel ho raha hai aur cravings ho rahi hain. Bas batana chahta tha taki safety bani rahe.",
      friend: "Hey, main abhi thoda negative zone mein hoon aur triggered feel kar raha hoon. Kya free ho chat karne ke liye?",
      default: "Mujhe cravings ho rahi hain abhi. Main safe rehna chahta hoon aur aapse baat karna chahta hoon."
    },
    hindi: {
      sponsor: "नमस्ते, मुझे इस समय काफी तीव्र क्रेविंग (इच्छा) महसूस हो रही है। क्या हम थोड़ी देर फोन पर बात कर सकते हैं?",
      family: "मुझे इस समय थोड़ा तनाव महसूस हो रहा है और मैं अपनी रिकवरी को सुरक्षित रखना चाहता हूँ। मुझे बस थोड़े शांत समय की आवश्यकता है।",
      friend: "नमस्ते, मैं अभी एक ऐसी स्थिति में हूँ जहाँ मुझे असहज महसूस हो रहा है। क्या हम थोड़ी देर बातचीत कर सकते हैं?",
      default: "मुझे इस समय क्रेविंग महसूस हो रही है। मैं सुरक्षित रहने के लिए आपसे बात करना चाहता हूँ।"
    }
  },
  help_now: {
    english: {
      sponsor: "I need help right now. I'm struggling to stay safe and really need someone to talk to or sit with me immediately.",
      family: "I'm in a crisis moment. Can you please sit with me or help me get to a safe place? I need your support to stay safe.",
      friend: "Hey, I'm in a crisis situation. Can you talk or help me get out of here? I need help staying safe right now.",
      default: "I am in distress right now and need immediate support to help me stay safe. Please contact me as soon as you can."
    },
    hinglish: {
      sponsor: "Mujhe abhi help ki zaroorat hai. Mujhe safe rehne mein mushkil ho rahi hai, please jaldi call karo.",
      family: "Main abhi crisis moment mein hoon. Kya aap mere saath thodi der baith sakte hain ya mujhe safe jagah le ja sakte hain?",
      friend: "Bhai, emergency hai. Main abhi bohot stress mein hoon aur safe rehna mushkil ho raha hai. Kya hum mil sakte hain?",
      default: "Main abhi bohot pareshan hoon aur mujhe immediate help chahiye safe rehne ke liye. Please call kijiye."
    },
    hindi: {
      sponsor: "मुझे अभी तुरंत सहायता की आवश्यकता है। मुझे खुद को सुरक्षित रखने में कठिनाई हो रही है, कृपया तुरंत बात करें।",
      family: "मैं अभी एक कठिन संकट में हूँ। क्या आप कृपया मेरे साथ बैठ सकते हैं या मुझे किसी सुरक्षित स्थान पर ले जा सकते हैं?",
      friend: "नमस्ते, यह एक आपातकालीन स्थिति है। मुझे सुरक्षित रहने के लिए तुरंत आपकी मदद की ज़रूरत है।",
      default: "मैं अभी संकट में हूँ और मुझे सुरक्षित रहने के लिए तत्काल सहायता की आवश्यकता है। कृपया जल्द से जल्द संपर्क करें।"
    }
  },
  talk_someone: {
    english: {
      sponsor: "Hey, do you have a few minutes today? I'd like to check in and talk about how my week is going to help prevent triggers.",
      family: "Hey, I just wanted to check in. Talking with you helps keep me grounded and reminds me of my recovery goals.",
      friend: "Hey, are you free to chat? Just checking in to stay connected and keep my recovery on track.",
      default: "Hey, I'm looking for someone to talk to. Just checking in to stay connected and keep my recovery on track."
    },
    hinglish: {
      sponsor: "Bhaiya, thoda free ho? Socha aapse thodi baat karke apna status share kar loon, taaki mind clear rahe.",
      family: "Ghar pe bas check-in karne ke liye call/text kiya tha. Aapse baat karke achha lagta hai aur focus bana rehta hai.",
      friend: "Hey! Bas aise hi check-in karne ke liye message kiya. Kya chal raha hai? Free ho toh baat karte hain.",
      default: "Hey, bas check-in karne ke liye message kiya. Socha thodi baat karke connect kar loon."
    },
    hindi: {
      sponsor: "नमस्ते, क्या आपके पास कुछ समय है? मैं अपनी हफ़्ते की प्रगति साझा करने और सलाह लेने के लिए बात करना चाहता था।",
      family: "नमस्ते, मैं केवल आपसे संपर्क करने के लिए संदेश भेज रहा हूँ। आपसे बात करके मुझे संबल मिलता है।",
      friend: "नमस्ते, क्या आप थोड़ी बातचीत के लिए उपलब्ध हैं? बस ऐसे ही संपर्क करने और जुड़े रहने के लिए संदेश भेजा है।",
      default: "नमस्ते, बस हाल-चाल जानने के लिए संदेश भेजा। आशा है सब ठीक होगा।"
    }
  },
  prevention: {
    english: {
      sponsor: "I'm working on my recovery prevention plan and wanted to check in. It helps me to know you are in my corner.",
      family: "I am planning my safety strategies for the week and wanted to reach out. Thank you for being part of my support network.",
      friend: "Hey, just checking in to stay grounded. Having you as a friend helps me keep my recovery in focus.",
      default: "I am planning my safety strategies and wanted to check in. It helps me to know I have you in my support network."
    },
    hinglish: {
      sponsor: "Aapka support mere liye bohot important hai. Main apna trigger prevention plan update kar raha tha, socha aapko batadoon.",
      family: "Mummy/Papa, main is week ke liye apne safety steps prepare kar raha hoon. Supportive rehne ke liye thank you.",
      friend: "Hey, socha thoda connect karke stay grounded rahoon. Tu humesha sahi advice deta hai, thanks for being there.",
      default: "Main apne safety steps aur prevention plan pe kaam kar raha hoon. Reaching out to stay grounded."
    },
    hindi: {
      sponsor: "मैं अपनी रिकवरी योजना पर काम कर रहा हूँ। मेरे साथ खड़े रहने और मेरा मार्गदर्शन करने के लिए आपका धन्यवाद।",
      family: "मैं इस सप्ताह के लिए अपने सुरक्षा कदमों की योजना बना रहा हूँ। मेरे पूरे परिवार के सहयोग के लिए मैं आभारी हूँ।",
      friend: "नमस्ते, बस जुड़े रहने और सकारात्मक महसूस करने के लिए संदेश भेजा है। आपकी मित्रता मेरे लिए अमूल्य है।",
      default: "मैं अपने ट्रिगर प्रिवेंशन (रोकथाम) प्लान पर काम कर रहा हूँ। सुरक्षित रहने के लिए आपसे संपर्क कर रहा हूँ।"
    }
  }
};

export async function POST(req: Request) {
  try {
    const { situation, recipient, language } = await req.json();

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

    const recipientKey = recipient || "default";
    const selectedLanguage = language || "english";

    // Setup Gemini if API Key is configured
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let languageInstructions = "";
        if (selectedLanguage === "hinglish") {
          languageInstructions = "Generate the script in conversational Hinglish (Hindi written phonetically in Latin script, e.g., 'Bhai, mujhe thoda trigger feel ho raha hai...'). Natural, colloquial in India.";
        } else if (selectedLanguage === "hindi") {
          languageInstructions = "Generate the script in clear Devanagari Hindi (e.g., 'नमस्ते, मुझे इस समय सहायता की आवश्यकता है...'). Respectful and calm.";
        } else {
          languageInstructions = "Generate the script in polite, direct Indian English.";
        }

        const prompt = `You are a compassionate, clinically aware crisis support assistant for Hearthline India, a substance use recovery platform. The user is in a high-stress recovery situation: "${situation}".
Generate a brief, calm, and practical script (e.g. for a WhatsApp text or verbal statement) they can use to communicate their needs to their ${recipientKey === 'default' ? 'trusted support person' : recipientKey}.
Requirements:
1. Keep the generated script under 3 sentences.
2. The language must be calm, direct, and free of shame.
3. ${languageInstructions}
4. Return ONLY the script text itself. Do not include any introductory, explanatory, or concluding conversational filler (no "Here is the script:", no quotes around the whole text).`;

        const response = await model.generateContent(prompt);
        const scriptText = response.response ? response.response.text().trim() : null;

        if (scriptText) {
          return NextResponse.json({ script: scriptText, source: "gemini" });
        }
      } catch (err: any) {
        console.error("Gemini API error:", err.message);
      }
    }

    // Fallback to Mock Data
    const situationMap = MOCK_RECOVERY_SCRIPTS[situationKey] || MOCK_RECOVERY_SCRIPTS.trigger;
    const languageMap = situationMap[selectedLanguage] || situationMap.english;
    const script = languageMap[recipientKey] || languageMap.default;

    return NextResponse.json({ script, source: "fallback" });
  } catch (err: any) {
    console.error("Endpoint crash:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
