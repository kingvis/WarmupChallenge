import { computeDeterministicRiskScore } from "../lib/risk-engine";

describe("Deterministic Risk Scoring Engine", () => {
  test("returns Critical Risk (10/10) immediately when Manual SOS button is pressed", () => {
    const result = computeDeterministicRiskScore({
      sosTriggered: true,
      moodScore: 8,
      stressScore: 2,
      cravingScore: 1,
    });

    expect(result.score).toBe(10);
    expect(result.level).toBe("Critical");
    expect(result.reasons).toContain("Manual Emergency SOS Button Triggered");
    expect(result.triggeredAlert).toBe(true);
    expect(result.escalationRequired).toBe(true);
  });

  test("calculates Low Risk (1/10) for normal check-in parameters", () => {
    const result = computeDeterministicRiskScore({
      moodScore: 8,
      stressScore: 3,
      cravingScore: 2,
    });

    expect(result.score).toBe(1);
    expect(result.level).toBe("Low");
    expect(result.triggeredAlert).toBe(false);
  });

  test("calculates High Risk (6/10) when mood is low (<4), stress is high (>7), and help is requested", () => {
    const result = computeDeterministicRiskScore({
      moodScore: 3,
      stressScore: 8,
      cravingScore: 2,
      needHelp: true,
    });

    expect(result.score).toBe(7); // 1 base + 2 mood + 2 stress + 2 needHelp
    expect(result.level).toBe("High");
    expect(result.triggeredAlert).toBe(true);
  });

  test("incorporates facial distress indicators when face is detected", () => {
    const result = computeDeterministicRiskScore({
      moodScore: 6,
      stressScore: 5,
      cravingScore: 3,
      facialDistress: "anxious",
    });

    expect(result.score).toBe(3); // 1 base + 2 facial distress
    expect(result.reasons).toContain("Facial analysis distress indicator detected: anxious");
  });

  test("handles unavailable facial analysis gracefully without inflating fake risk", () => {
    const result = computeDeterministicRiskScore({
      moodScore: 7,
      stressScore: 3,
      cravingScore: 2,
      facialDistress: "unavailable",
    });

    expect(result.score).toBe(1);
    expect(result.reasons).not.toContain("Facial analysis distress indicator detected: unavailable");
  });

  test("factors in acoustic vocal stress and keyword detection", () => {
    const result = computeDeterministicRiskScore({
      moodScore: 5,
      stressScore: 5,
      cravingScore: 3,
      voiceStressScore: 0.75,
      distressKeywordsFound: ["panic", "relapse"],
    });

    expect(result.score).toBe(5); // 1 base + 2 voice stress + 2 keywords
    expect(result.level).toBe("Moderate");
    expect(result.reasons).toContain("Vocal stress acoustic score elevated (75%)");
  });
});
