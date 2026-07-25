import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve static folder paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// Initialize Gemini API client if API key is provided
let ai = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Gemini API client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini API client:', err.message);
  }
} else {
  console.log('No GEMINI_API_KEY found in environment. Using high-quality mock fallback system.');
}

// Fallback Mock Data for Offline/Missing Key scenarios (localized for India)
const MOCK_RECOVERY_SCRIPTS = {
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

const MOCK_CAREGIVER_GUIDANCE = {
  trigger: {
    whatToSay: "main samajh sakta/sakti hoon ki yeh moment mushkil hai. Hum saath milkar ek-ek minute karke isse handle karenge. (I understand this moment is tough. We will handle this together one minute at a time.)",
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

// Endpoints
app.post('/api/generate-script', async (req, res) => {
  const { situation, recipient, language } = req.body;
  
  if (!situation) {
    return res.status(400).json({ error: 'Situation is required.' });
  }

  const normalizedSituation = situation.toLowerCase();
  
  // Find key based on situation input
  let situationKey = 'trigger';
  if (normalizedSituation.includes('help now') || normalizedSituation.includes('crisis') || normalizedSituation.includes('urgent') || normalizedSituation.includes('need help now')) {
    situationKey = 'help_now';
  } else if (normalizedSituation.includes('talk') || normalizedSituation.includes('someone') || normalizedSituation.includes('chat')) {
    situationKey = 'talk_someone';
  } else if (normalizedSituation.includes('prevent') || normalizedSituation.includes('prevention') || normalizedSituation.includes('future')) {
    situationKey = 'prevention';
  }

  const recipientKey = recipient || 'default';
  const selectedLanguage = language || 'english';

  // If AI client is active, call Gemini
  if (ai) {
    try {
      let languageInstructions = "";
      if (selectedLanguage === 'hinglish') {
        languageInstructions = "Generate the script in conversational Hinglish (Hindi language written phonetically using the Latin/Roman script, e.g., 'Bhai, mujhe thoda trigger feel ho raha hai...'). Make it sound natural, modern, and colloquial in India.";
      } else if (selectedLanguage === 'hindi') {
        languageInstructions = "Generate the script in clear Devanagari Hindi (e.g., 'नमस्ते, मुझे इस समय सहायता की आवश्यकता है...'). Make it respectful, calm, and simple.";
      } else {
        languageInstructions = "Generate the script in polite, direct Indian English (e.g., using simple phrasing and respectful tone suitable for India).";
      }

      const prompt = `You are a compassionate, clinically aware crisis support assistant for Hearthline India, a substance use recovery platform. The user is in a high-stress recovery situation: "${situation}".
Generate a brief, calm, and practical script (e.g., for a WhatsApp text message or verbal conversation) they can use to communicate their needs to their ${recipientKey === 'default' ? 'trusted support person' : recipientKey}.
Requirements:
1. Keep the generated script under 3 sentences.
2. The language must be calm, direct, and free of shame or guilt.
3. ${languageInstructions}
4. Return ONLY the script text itself. Do not include any introductory, explanatory, or concluding conversational filler (no "Here is the script:", no quotes around the whole text unless they are part of the spoken words).`;

      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const response = await model.generateContent(prompt);

      const scriptText = response.response ? response.response.text().trim() : null;
      if (scriptText) {
        return res.json({ script: scriptText, source: 'gemini' });
      }
    } catch (err) {
      console.error('Gemini API call failed. Falling back to template.', err.message);
    }
  }

  // Fallback to Mock response
  const situationMap = MOCK_RECOVERY_SCRIPTS[situationKey] || MOCK_RECOVERY_SCRIPTS.trigger;
  const languageMap = situationMap[selectedLanguage] || situationMap.english;
  const script = languageMap[recipientKey] || languageMap.default;
  return res.json({ script, source: 'fallback' });
});

app.post('/api/generate-caregiver-guide', async (req, res) => {
  const { situation } = req.body;

  if (!situation) {
    return res.status(400).json({ error: 'Situation is required.' });
  }

  const normalizedSituation = situation.toLowerCase();
  
  // Find key based on situation input
  let situationKey = 'trigger';
  if (normalizedSituation.includes('help now') || normalizedSituation.includes('crisis') || normalizedSituation.includes('urgent') || normalizedSituation.includes('need help now')) {
    situationKey = 'help_now';
  } else if (normalizedSituation.includes('talk') || normalizedSituation.includes('someone') || normalizedSituation.includes('chat')) {
    situationKey = 'talk_someone';
  } else if (normalizedSituation.includes('prevent') || normalizedSituation.includes('prevention') || normalizedSituation.includes('future')) {
    situationKey = 'prevention';
  }

  // If AI client is active, call Gemini
  if (ai) {
    try {
      const prompt = `You are a supportive, clinically aware advisor for caregivers in India supporting a loved one in substance use recovery. A caregiver is supporting a loved one who is in a high-stress situation: "${situation}".
Generate practical guidance containing:
1. WHAT TO SAY (a 1-2 sentence supportive, non-enabling script they can say to their loved one, using polite Indian phrases or local English/Hindi blends).
2. WHAT TO AVOID (1 sentence of what they should avoid saying, e.g., guilt-tripping or blaming).
3. BOUNDARY TIP (1 sentence on setting healthy limits or practicing self-care in this specific situation).
4. WHEN TO ESCALATE (1 brief warning sign or action to take if safety is compromised, mentioning local resources like Tele-MANAS or emergency numbers).

Return the output as a valid JSON object matching this structure:
{
  "whatToSay": "...",
  "whatToAvoid": "...",
  "boundaryTip": "...",
  "whenToEscalate": "..."
}
Ensure the JSON is valid and return ONLY the JSON block. Do not wrap in markdown code blocks like \`\`\`json.`;

      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const response = await model.generateContent(prompt);

      let responseText = response.response ? response.response.text().trim() : null;
      if (responseText) {
        // Clean markdown blocks if returned
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(responseText);
        return res.json({ ...data, source: 'gemini' });
      }
    } catch (err) {
      console.error('Gemini API call failed. Falling back to template.', err.message);
    }
  }

  // Fallback to Mock response
  const guidance = MOCK_CAREGIVER_GUIDANCE[situationKey] || MOCK_CAREGIVER_GUIDANCE.trigger;
  return res.json({ ...guidance, source: 'fallback' });
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
