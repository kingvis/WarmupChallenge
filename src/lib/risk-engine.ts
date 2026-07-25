export interface RiskEvaluationInput {
  sosTriggered?: boolean;
  moodScore: number;
  stressScore: number;
  cravingScore: number;
  needHelp?: boolean;
  facialDistress?: "neutral" | "anxious" | "sad" | "distressed" | "unavailable";
  voiceStressScore?: number;
  hasRedFlagsInDoc?: boolean;
  distressKeywordsFound?: string[];
}

export interface RiskEvaluationResult {
  score: number; // 1 to 10
  level: "Low" | "Moderate" | "High" | "Critical";
  reasons: string[];
  triggeredAlert: boolean;
  escalationRequired: boolean;
}

export function computeDeterministicRiskScore(params: RiskEvaluationInput): RiskEvaluationResult {
  let score = 1;
  const reasons: string[] = [];

  // Manual Emergency SOS Trigger Override
  if (params.sosTriggered) {
    return {
      score: 10,
      level: "Critical",
      reasons: ["Manual Emergency SOS Button Triggered"],
      triggeredAlert: true,
      escalationRequired: true,
    };
  }

  // Self-report inputs
  if (params.moodScore < 4) {
    score += 2;
    reasons.push("Low self-reported mood (<4)");
  }

  if (params.stressScore > 7) {
    score += 2;
    reasons.push("Elevated self-reported stress (>7)");
  }

  if (params.cravingScore > 6) {
    score += 2;
    reasons.push("Significant self-reported craving waves (>6)");
  }

  if (params.needHelp) {
    score += 2;
    reasons.push("Explicit user request for crisis / grounding assistance");
  }

  // Multi-modal sensor inputs
  if (params.facialDistress && ["anxious", "sad", "distressed"].includes(params.facialDistress)) {
    score += 2;
    reasons.push(`Facial analysis distress indicator detected: ${params.facialDistress}`);
  }

  if (params.voiceStressScore && params.voiceStressScore > 0.6) {
    score += 2;
    reasons.push(`Vocal stress acoustic score elevated (${Math.round(params.voiceStressScore * 100)}%)`);
  }

  if (params.distressKeywordsFound && params.distressKeywordsFound.length > 0) {
    score += 2;
    reasons.push(`Distress keywords detected in transcript: ${params.distressKeywordsFound.join(", ")}`);
  }

  if (params.hasRedFlagsInDoc) {
    score += 2;
    reasons.push("Active emergency precautions/red flags present in medical profile");
  }

  const finalScore = Math.min(10, score);
  let level: "Low" | "Moderate" | "High" | "Critical" = "Low";

  if (finalScore >= 9) {
    level = "Critical";
  } else if (finalScore >= 6) {
    level = "High";
  } else if (finalScore >= 4) {
    level = "Moderate";
  }

  const triggeredAlert = finalScore >= 6;
  const escalationRequired = finalScore >= 9;

  return {
    score: finalScore,
    level,
    reasons,
    triggeredAlert,
    escalationRequired,
  };
}
