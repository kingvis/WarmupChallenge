import { useState, useEffect, useRef } from 'react';

// Situation Lists (Localized for India)
const RECOVERY_SITUATIONS = {
  trigger: {
    id: 'trigger',
    title: 'I feel triggered',
    desc: 'Cravings wave, environmental triggers, or high stress',
    icon: '🌪️',
  },
  help_now: {
    id: 'help_now',
    title: 'I need help now',
    desc: 'Crisis moment or immediate relapse threat requiring urgent support',
    icon: '🚨',
  },
  talk_someone: {
    id: 'talk_someone',
    title: 'Help me talk to someone',
    desc: 'Looking for the right words to connect with support',
    icon: '🗣️',
  },
  prevention: {
    id: 'prevention',
    title: 'I want prevention tools',
    desc: 'Building safety buffers and planning ahead for triggers',
    icon: '🛡️',
  }
};

const CAREGIVER_SITUATIONS = {
  trigger: {
    id: 'trigger',
    title: 'Loved one is triggered',
    desc: 'How to support when they are having cravings or distress',
    icon: '🌱',
  },
  help_now: {
    id: 'help_now',
    title: 'Loved one is in crisis',
    desc: 'De-escalating urgent situations and safety guidelines',
    icon: '⚠️',
  },
  talk_someone: {
    id: 'talk_someone',
    title: 'Checking in with them',
    desc: 'How to start conversations without making them defensive',
    icon: '💬',
  },
  prevention: {
    id: 'prevention',
    title: 'Relapse prevention steps',
    desc: 'Boundary settings and preparing support strategies',
    icon: '🧱',
  }
};

// Client-Side Fail-Safe Data (Dual-layer translation for offline support)
const FRONTEND_FALLBACK_SCRIPTS = {
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

const FRONTEND_FALLBACK_GUIDES = {
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

function App() {
  // Application states
  const [role, setRole] = useState('recovery'); // 'recovery' | 'caregiver'
  const [theme, setTheme] = useState('light');
  const [selectedSituation, setSelectedSituation] = useState('trigger'); // 'trigger' | 'help_now' | 'talk_someone' | 'prevention'
  const [recipient, setRecipient] = useState('sponsor'); // 'sponsor' | 'family' | 'friend'
  const [language, setLanguage] = useState('english'); // 'english' | 'hinglish' | 'hindi'
  
  // AI response states
  const [scriptText, setScriptText] = useState('');
  const [caregiverGuide, setCaregiverGuide] = useState({ whatToSay: '', whatToAvoid: '', boundaryTip: '', whenToEscalate: '' });
  const [aiSource, setAiSource] = useState(''); // 'gemini' | 'fallback' | 'offline-fallback'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Grounding timer states
  const [groundingActive, setGroundingActive] = useState(false);
  const [groundingTimer, setGroundingTimer] = useState(300); // 5 minutes
  const [breathingState, setBreathingState] = useState('inhale'); // inhale, hold-in, exhale, hold-out
  
  // Safety Plan Modal state (Updated with Indian Defaults)
  const [safetyPlanOpen, setSafetyPlanOpen] = useState(false);
  const [safetyPlan, setSafetyPlan] = useState({
    sponsorName: 'Aarav (Mentor)',
    sponsorPhone: '+91 98765 43210',
    triggers: '',
    copingStrategies: '',
    safePlaces: ''
  });

  // UI status states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [nextStepVisible, setNextStepVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'grounding' | 'plan'

  // Ref for audio/timers
  const timerRef = useRef(null);
  const breathRef = useRef(null);

  // Sync state to theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load configuration on role, situation, recipient, or language change
  useEffect(() => {
    if (selectedSituation) {
      triggerAIRequest(selectedSituation, role, recipient, language);
    }
  }, [role, selectedSituation, recipient, language]);

  // Sama Vritti (Pranayama) Breathing exercise loops
  useEffect(() => {
    if (groundingActive) {
      // Primary 5-minute Countdown Timer
      timerRef.current = setInterval(() => {
        setGroundingTimer((prev) => {
          if (prev <= 1) {
            triggerGroundingStop();
            return 300;
          }
          return prev - 1;
        });
      }, 1000);

      // 4-4-4-4 breathing cycle state machine
      const states = ['inhale', 'hold-in', 'exhale', 'hold-out'];
      let stateIdx = 0;
      setBreathingState(states[0]);

      breathRef.current = setInterval(() => {
        stateIdx = (stateIdx + 1) % 4;
        setBreathingState(states[stateIdx]);
      }, 4000);
    } else {
      clearInterval(timerRef.current);
      clearInterval(breathRef.current);
    }

    return () => {
      clearInterval(timerRef.current);
      clearInterval(breathRef.current);
    };
  }, [groundingActive]);

  // Core API integration logic
  const triggerAIRequest = async (situationId, currentRole, currentRecipient, currentLanguage) => {
    setLoading(true);
    setError(null);
    setNextStepVisible(false);

    const list = currentRole === 'recovery' ? RECOVERY_SITUATIONS : CAREGIVER_SITUATIONS;
    const situationName = list[situationId]?.title || situationId;

    try {
      if (currentRole === 'recovery') {
        const res = await fetch('/api/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ situation: situationName, recipient: currentRecipient, language: currentLanguage })
        });
        
        if (!res.ok) throw new Error('API server unreachable');
        const data = await res.json();
        setScriptText(data.script);
        setAiSource(data.source);
      } else {
        const res = await fetch('/api/generate-caregiver-guide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ situation: situationName })
        });
        
        if (!res.ok) throw new Error('API server unreachable');
        const data = await res.json();
        setCaregiverGuide({
          whatToSay: data.whatToSay,
          whatToAvoid: data.whatToAvoid,
          boundaryTip: data.boundaryTip,
          whenToEscalate: data.whenToEscalate
        });
        setAiSource(data.source);
      }
    } catch (err) {
      console.warn('API call failed, running frontend fallback:', err.message);
      
      // Client-side fail-safe logic (supports multi-language)
      if (currentRole === 'recovery') {
        const langMap = FRONTEND_FALLBACK_SCRIPTS[situationId]?.[currentLanguage] || FRONTEND_FALLBACK_SCRIPTS[situationId]?.english;
        const fallbackScript = langMap[currentRecipient] || langMap.default;
        setScriptText(fallbackScript);
      } else {
        const fallbackGuide = FRONTEND_FALLBACK_GUIDES[situationId];
        setCaregiverGuide(fallbackGuide);
      }
      setAiSource('offline-fallback');
    } finally {
      setLoading(false);
    }
  };

  // UI Event Handlers
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setSelectedSituation('trigger'); // Reset to default situation
  };

  const handleSituationSelect = (situationId) => {
    setSelectedSituation(situationId);
  };

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(scriptText);
    displayToast('Script copied to clipboard');
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`"${scriptText}" - Hearthline India Recovery Tool`);
    const url = `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
    displayToast('Opening WhatsApp Share');
  };

  const displayToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const triggerGroundingStart = () => {
    setGroundingActive(true);
    setGroundingTimer(300);
    setActiveTab('grounding');
  };

  const triggerGroundingStop = () => {
    setGroundingActive(false);
    setActiveTab('home');
  };

  const formatTimer = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSaveSafetyPlan = (e) => {
    e.preventDefault();
    setSafetyPlanOpen(false);
    displayToast('Safety plan updated');
  };

  const resetAllSelections = () => {
    setSelectedSituation('trigger');
    setRecipient('sponsor');
    setLanguage('english');
    setNextStepVisible(false);
    displayToast('Preferences cleared');
  };

  // Safety next step generator based on situation (Localized for India)
  const getContextualNextStep = () => {
    switch (selectedSituation) {
      case 'help_now':
        return "1. Remove yourself from your current location immediately.\n2. Call your mentor/sponsor Aarav or family using the call buttons below.\n3. Call Tele-MANAS (14416) for immediate psychological support.\n4. Head to a busy, safe public area or relative's home.";
      case 'trigger':
        return "1. Drink a glass of cold water (stops physical craving spikes).\n2. Start the Sama Vritti (Pranayama) 5-Minute Box Breathing tool.\n3. Send the prepared Hinglish or Hindi script to Aarav via the WhatsApp shortcut.";
      case 'talk_someone':
        return "1. Click the 'Share on WhatsApp' button below.\n2. Select your contact and send the text.\n3. Give them 10 minutes. If they are busy, reach out to the KIRAN helpline (1800-599-0019).";
      case 'prevention':
        return "1. Review your triggers and coping checklist under 'My Plan'.\n2. Do 5 minutes of deep breathing. Practice naming three positive things in your surrounding.\n3. Stay connected with support groups and mentors.";
      default:
        return "Take deep breaths, step away from triggers, and call Tele-MANAS (14416).";
    }
  };

  return (
    <>
      {showToast && <div className="toast" role="alert">{toastMessage}</div>}

      {/* Header */}
      <header>
        <div className="brand">
          <span className="brand-logo">🏡</span>
          <span className="brand-name">Hearthline India</span>
        </div>
        <div className="header-controls">
          <button 
            type="button" 
            className="reset-btn" 
            onClick={resetAllSelections} 
            title="Reset selections"
            aria-label="Reset options"
          >
            🔄
          </button>
          <button 
            type="button" 
            className="theme-toggle" 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {activeTab === 'home' && (
          <>
            {/* Role switchers */}
            <div className="role-tabs" role="tablist">
              <button 
                type="button"
                className={`role-tab ${role === 'recovery' ? 'active' : ''}`}
                onClick={() => handleRoleChange('recovery')}
                role="tab"
                aria-selected={role === 'recovery'}
              >
                Recovery Support
              </button>
              <button 
                type="button"
                className={`role-tab ${role === 'caregiver' ? 'active' : ''}`}
                onClick={() => handleRoleChange('caregiver')}
                role="tab"
                aria-selected={role === 'caregiver'}
              >
                Caregiver Guidance
              </button>
            </div>

            {/* Hero Section */}
            <div className="welcome-card">
              <h2>{role === 'recovery' ? 'Your Safe Space' : 'Caregiver Guidance'}</h2>
              <p>
                {role === 'recovery' 
                  ? 'Immediate, zero-typing support for cravings and stress. Get localized scripts in English, Hindi, or Hinglish.' 
                  : 'Support your loved one while maintaining healthy boundaries. Get structured, clinically sound advice.'}
              </p>
            </div>

            {/* Zero-Typing Situation Grid */}
            <section className="situation-section">
              <h3>{role === 'recovery' ? 'Choose Your Situation' : 'Identify the Challenge'}</h3>
              <div className="situation-grid">
                {Object.values(role === 'recovery' ? RECOVERY_SITUATIONS : CAREGIVER_SITUATIONS).map((sit) => (
                  <button
                    key={sit.id}
                    type="button"
                    className={`situation-card ${selectedSituation === sit.id ? 'selected' : ''}`}
                    onClick={() => handleSituationSelect(sit.id)}
                    aria-pressed={selectedSituation === sit.id}
                  >
                    <span className="situation-icon">{sit.icon}</span>
                    <div className="situation-details">
                      <span className="situation-title">{sit.title}</span>
                      <span className="situation-desc">{sit.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* AI Generator Panel (Recovery Mode) */}
            {role === 'recovery' && selectedSituation && (
              <section className="result-panel">
                <div className="panel-header">
                  <h3>AI Crisis Script</h3>
                  <span className="ai-badge" title={`Engine source: ${aiSource}`}>
                    ✨ AI Powered
                  </span>
                </div>

                {/* Recipient Selection tabs */}
                <div className="recipient-selector">
                  <label htmlFor="recipient-tabs">Who are you contacting?</label>
                  <div id="recipient-tabs" className="recipient-options">
                    <button 
                      type="button"
                      className={`recipient-btn ${recipient === 'sponsor' ? 'active' : ''}`}
                      onClick={() => setRecipient('sponsor')}
                    >
                      Mentor/Sponsor
                    </button>
                    <button 
                      type="button"
                      className={`recipient-btn ${recipient === 'family' ? 'active' : ''}`}
                      onClick={() => setRecipient('family')}
                    >
                      Family
                    </button>
                    <button 
                      type="button"
                      className={`recipient-btn ${recipient === 'friend' ? 'active' : ''}`}
                      onClick={() => setRecipient('friend')}
                    >
                      Friend
                    </button>
                  </div>
                </div>

                {/* Language Selection tabs */}
                <div className="recipient-selector" style={{ marginTop: '8px' }}>
                  <label htmlFor="language-tabs">Script Language</label>
                  <div id="language-tabs" className="recipient-options">
                    <button 
                      type="button"
                      className={`recipient-btn ${language === 'english' ? 'active' : ''}`}
                      onClick={() => setLanguage('english')}
                    >
                      English
                    </button>
                    <button 
                      type="button"
                      className={`recipient-btn ${language === 'hinglish' ? 'active' : ''}`}
                      onClick={() => setLanguage('hinglish')}
                    >
                      Hinglish
                    </button>
                    <button 
                      type="button"
                      className={`recipient-btn ${language === 'hindi' ? 'active' : ''}`}
                      onClick={() => setLanguage('hindi')}
                    >
                      हिन्दी (Hindi)
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="skeleton-box" aria-label="Generating script text">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                  </div>
                ) : error ? (
                  <div className="error-box" role="alert">
                    <p>{error}</p>
                  </div>
                ) : (
                  <div className="script-container">
                    <div className="script-box">
                      "{scriptText}"
                    </div>
                    <div className="script-actions">
                      <button 
                        type="button" 
                        className="action-btn-primary" 
                        onClick={copyScriptToClipboard}
                      >
                        📋 Copy
                      </button>
                      <button 
                        type="button" 
                        className="action-btn-primary whatsapp-btn" 
                        onClick={shareOnWhatsApp}
                      >
                        💬 WhatsApp
                      </button>
                      <button 
                        type="button" 
                        className="action-btn-secondary"
                        onClick={() => setNextStepVisible(!nextStepVisible)}
                      >
                        {nextStepVisible ? 'Hide Steps' : 'Safe Steps'}
                      </button>
                    </div>
                  </div>
                )}

                {nextStepVisible && !loading && (
                  <div className="welcome-card" style={{ marginTop: '8px' }}>
                    <h4>Contextual Next Steps (India)</h4>
                    <p style={{ whiteSpace: 'pre-line', marginTop: '6px', fontSize: '0.85rem' }}>
                      {getContextualNextStep()}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* AI Generator Panel (Caregiver Mode) */}
            {role === 'caregiver' && selectedSituation && (
              <section className="result-panel">
                <div className="panel-header">
                  <h3>Caregiver Response Guide</h3>
                  <span className="ai-badge" title={`Engine source: ${aiSource}`}>
                    ✨ AI Powered
                  </span>
                </div>

                {loading ? (
                  <div className="skeleton-box" aria-label="Generating caregiver advice">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                  </div>
                ) : (
                  <div className="caregiver-tabs">
                    <div className="caregiver-card say">
                      <h4>💡 What to Say (Hinglish/English)</h4>
                      <p>"{caregiverGuide.whatToSay}"</p>
                    </div>
                    <div className="caregiver-card avoid">
                      <h4>🚫 What to Avoid</h4>
                      <p>{caregiverGuide.whatToAvoid}</p>
                    </div>
                    <div className="caregiver-card boundary">
                      <h4>🛡️ Boundary Setting</h4>
                      <p>{caregiverGuide.boundaryTip}</p>
                    </div>
                    <div className="caregiver-card" style={{ borderColor: 'var(--error)' }}>
                      <h4 style={{ color: 'var(--error)' }}>🚨 When to Escalate (India Hotlines)</h4>
                      <p>{caregiverGuide.whenToEscalate}</p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Educational Resource Grid (Localized) */}
            <section className="resources-section">
              <h3>Concise Recovery Cards</h3>
              <div className="resources-list">
                <div className="resource-card">
                  <h4>💡 What are Craving Waves?</h4>
                  <p>Cravings usually peak within 15–20 minutes. Practice "urge surfing" — instead of fighting the wave, observe it, let it peak, and watch it subside without action.</p>
                </div>
                <div className="resource-card">
                  <h4>🧘 Sama Vritti Pranayama</h4>
                  <p>Sama Vritti (Equal Breathing) regulates autonomic responses. Inhale, Hold, Exhale, and Hold for equal counts of 4 seconds to calm the nervous system.</p>
                </div>
                <div className="resource-card">
                  <h4>🛡️ Helping vs. Enabling</h4>
                  <p>Helping is doing something for your loved one that they physically cannot do. Enabling is shielding them from natural consequences, which ultimately delays recovery.</p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Sama Vritti Breathing ground tab */}
        {activeTab === 'grounding' && (
          <section className="grounding-panel">
            <h3>Sama Vritti Pranayama (Square Breathing)</h3>
            <p>Focus on the circle. Follow the breathing prompts below to interrupt stress responses.</p>
            
            <div className={`grounding-indicator ${breathingState}`}>
              <div className="breathing-ring"></div>
              <div className="breathing-center">
                {breathingState === 'inhale' && 'Inhale'}
                {breathingState === 'hold-in' && 'Hold'}
                {breathingState === 'exhale' && 'Exhale'}
                {breathingState === 'hold-out' && 'Hold'}
              </div>
            </div>

            <div className="breathing-instruction">
              {breathingState === 'inhale' && 'Puraka: Breathe in slowly through your nose... (4s)'}
              {breathingState === 'hold-in' && 'Antar Kumbhaka: Hold the breath in comfortably... (4s)'}
              {breathingState === 'exhale' && 'Rechaka: Release the breath gently through your mouth... (4s)'}
              {breathingState === 'hold-out' && 'Bahya Kumbhaka: Rest empty before the next breath... (4s)'}
            </div>

            <div className="grounding-timer-countdown">
              Time remaining: <strong>{formatTimer(groundingTimer)}</strong>
            </div>

            <button 
              type="button" 
              className="action-btn-primary" 
              style={{ backgroundColor: 'var(--error)' }}
              onClick={triggerGroundingStop}
            >
              Stop Exercise
            </button>
          </section>
        )}

        {/* Safety Plan Tab */}
        {activeTab === 'plan' && (
          <section className="result-panel">
            <h3>My Safety Plan</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Keep your primary checkins and emergency contacts easily accessible.</p>
            
            <div className="caregiver-tabs" style={{ marginTop: '12px' }}>
              <div className="caregiver-card boundary">
                <h4 style={{ color: 'var(--accent)' }}>👤 Primary Mentor Contact (India)</h4>
                <p><strong>{safetyPlan.sponsorName}</strong>: {safetyPlan.sponsorPhone}</p>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <a href={`tel:${safetyPlan.sponsorPhone}`} className="action-btn-primary" style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.85rem', textDecoration: 'none' }}>
                    📞 Call Mentor
                  </a>
                  <a href={`https://api.whatsapp.com/send?phone=${safetyPlan.sponsorPhone.replace(/[^0-9+]/g, '')}`} target="_blank" rel="noreferrer" className="action-btn-primary whatsapp-btn" style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.85rem', textDecoration: 'none' }}>
                    💬 WhatsApp Chat
                  </a>
                </div>
              </div>

              <div className="caregiver-card boundary">
                <h4>🎯 Personal Triggers to Watch</h4>
                <p>{safetyPlan.triggers || "No triggers specified. Edit your plan to add."}</p>
              </div>

              <div className="caregiver-card boundary">
                <h4>⚙️ Custom Coping Strategies</h4>
                <p>{safetyPlan.copingStrategies || "No strategies specified. Edit your plan to add."}</p>
              </div>
            </div>

            <button 
              type="button" 
              className="action-btn-secondary" 
              onClick={() => setSafetyPlanOpen(true)}
            >
              📝 Edit Safety Plan
            </button>
          </section>
        )}
      </main>

      {/* Safety Plan Edit Modal */}
      {safetyPlanOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Safety Plan</h3>
              <button 
                type="button" 
                className="close-btn" 
                onClick={() => setSafetyPlanOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveSafetyPlan}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="sponsor-name">Mentor / Contact Name</label>
                <input 
                  id="sponsor-name"
                  type="text" 
                  className="form-input" 
                  value={safetyPlan.sponsorName} 
                  onChange={(e) => setSafetyPlan({ ...safetyPlan, sponsorName: e.target.value })} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="sponsor-phone">Mentor / Contact Phone</label>
                <input 
                  id="sponsor-phone"
                  type="tel" 
                  className="form-input" 
                  value={safetyPlan.sponsorPhone} 
                  onChange={(e) => setSafetyPlan({ ...safetyPlan, sponsorPhone: e.target.value })} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="plan-triggers">My Primary Triggers</label>
                <textarea 
                  id="plan-triggers"
                  className="form-textarea" 
                  placeholder="e.g. peer pressure, stress, passing by old hangouts..."
                  value={safetyPlan.triggers} 
                  onChange={(e) => setSafetyPlan({ ...safetyPlan, triggers: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="plan-coping">Coping Actions that Work</label>
                <textarea 
                  id="plan-coping"
                  className="form-textarea" 
                  placeholder="e.g. Puraka pranayama, drinking cold water, talking to Aarav..."
                  value={safetyPlan.copingStrategies} 
                  onChange={(e) => setSafetyPlan({ ...safetyPlan, copingStrategies: e.target.value })}
                />
              </div>

              <button type="submit" className="action-btn-primary">
                💾 Save Safety Plan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer (Emergency Disclaimer & Indian Hotlines) */}
      <footer>
        <p className="emergency-disclaimer">
          <strong>Medical Disclaimer:</strong> Hearthline India is an educational support tool and is not a substitute for professional clinical advice, psychiatric treatment, or emergency care.
        </p>
        <div className="hotline-links">
          <a href="tel:14416" className="hotline-link">📞 Tele-MANAS (14416)</a>
          <a href="tel:18005990019" className="hotline-link">🛡️ KIRAN (1800-599-0019)</a>
        </div>
      </footer>

      {/* Safety Action Bar (Fixed Bottom Menu Localized) */}
      <div className="safety-action-bar" role="navigation" aria-label="Safety menu">
        <button 
          type="button" 
          className={`safety-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => { setActiveTab('home'); setGroundingActive(false); }}
        >
          <span className="safety-btn-icon">🏡</span>
          <span>Support Hub</span>
        </button>
        
        <button 
          type="button" 
          className={`safety-btn ${activeTab === 'grounding' ? 'active' : ''}`}
          onClick={triggerGroundingStart}
        >
          <span className="safety-btn-icon">🧘</span>
          <span>Pranayama (5m)</span>
        </button>

        <button 
          type="button" 
          className={`safety-btn ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => { setActiveTab('plan'); setGroundingActive(false); }}
        >
          <span className="safety-btn-icon">📋</span>
          <span>My Plan</span>
        </button>

        <a 
          href="tel:14416" 
          className="safety-btn emergency"
          aria-label="Call Tele-MANAS Helpline"
        >
          <span className="safety-btn-icon">🚨</span>
          <span>Call 14416</span>
        </a>
      </div>
    </>
  );
}

export default App;
