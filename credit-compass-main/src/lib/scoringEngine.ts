// Scoring engine: maps user form inputs to credit score, risk band, SHAP values, recommendation

export interface ScoringInput {
  monthlyIncomeRange: string;
  employmentType: string;
  incomeDuration: string;
  totalMonthlyEMI: string;
  missedPayments: string;
  billPaymentBehavior: string;
  avgBankBalance: string;
  savingsHabit: string;
  incomeSources: string;
  loanRejectionHistory: string;
  age: number;
}

interface FeatureScore {
  feature: string;
  score: number; // 0–100 contribution
  shapValue: number; // positive = risk increasing, negative = risk decreasing
}

function scoreFeature(feature: string, value: string | number): FeatureScore {
  switch (feature) {
    case "Monthly Income": {
      const map: Record<string, number> = {
        "< ₹15,000": 20, "₹15,000–30,000": 40, "₹30,000–60,000": 65, "₹60,000–1L": 80, "₹1L+": 95
      };
      const s = map[value as string] ?? 50;
      return { feature, score: s, shapValue: -((s - 50) / 100) * 0.18 };
    }
    case "Employment Type": {
      const map: Record<string, number> = {
        "Salaried": 90, "Business owner": 70, "Self-employed": 55, "Freelancer": 40
      };
      const s = map[value as string] ?? 50;
      return { feature, score: s, shapValue: -((s - 50) / 100) * 0.12 };
    }
    case "Income Duration": {
      const map: Record<string, number> = {
        "< 6 months": 25, "6–12 months": 45, "1–3 years": 70, "3+ years": 95
      };
      const s = map[value as string] ?? 50;
      return { feature, score: s, shapValue: -((s - 50) / 100) * 0.15 };
    }
    case "Monthly EMI": {
      const map: Record<string, number> = {
        "None": 95, "< ₹5,000": 75, "₹5,000–15,000": 45, "₹15,000+": 20
      };
      const s = map[value as string] ?? 50;
      return { feature, score: s, shapValue: -((s - 50) / 100) * 0.2 };
    }
    case "Missed Payments": {
      const map: Record<string, number> = {
        "Never": 95, "1–2 times": 40, "3+ times": 10
      };
      const s = map[value as string] ?? 50;
      return { feature, score: s, shapValue: -((s - 50) / 100) * 0.25 };
    }
    case "Bill Payment Behavior": {
      const map: Record<string, number> = {
        "Before due date": 90, "On due date": 65, "After due date": 25
      };
      const s = map[value as string] ?? 50;
      return { feature, score: s, shapValue: -((s - 50) / 100) * 0.1 };
    }
    case "Avg Bank Balance": {
      const map: Record<string, number> = {
        "< ₹5,000": 15, "₹5,000–20,000": 40, "₹20,000–50,000": 70, "₹50,000+": 92
      };
      const s = map[value as string] ?? 50;
      return { feature, score: s, shapValue: -((s - 50) / 100) * 0.12 };
    }
    case "Savings Habit": {
      const map: Record<string, number> = {
        "No": 15, "Occasionally": 40, "Yes (less than 20%)": 65, "Yes (20%+)": 90
      };
      const s = map[value as string] ?? 50;
      return { feature, score: s, shapValue: -((s - 50) / 100) * 0.08 };
    }
    case "Income Sources": {
      const map: Record<string, number> = { "1": 50, "2": 75, "3+": 92 };
      const s = map[value as string] ?? 50;
      return { feature, score: s, shapValue: -((s - 50) / 100) * 0.06 };
    }
    case "Loan Rejection History": {
      const map: Record<string, number> = {
        "No": 90, "Yes (once)": 50, "Yes (multiple times)": 15
      };
      const s = map[value as string] ?? 50;
      return { feature, score: s, shapValue: -((s - 50) / 100) * 0.14 };
    }
    case "Age": {
      const age = value as number;
      const s = age < 21 ? 30 : age < 25 ? 50 : age < 35 ? 80 : age < 50 ? 85 : age < 60 ? 70 : 55;
      return { feature, score: s, shapValue: -((s - 50) / 100) * 0.05 };
    }
    default:
      return { feature, score: 50, shapValue: 0 };
  }
}

export type RiskBand = "Prime" | "Near Prime" | "Subprime" | "High Risk";

export interface ScoringResult {
  creditScore: number;
  riskBand: RiskBand;
  recommendation: "Strong Approve" | "Approve" | "Review" | "Reject";
  confidence: number;
  predictionProbability: number;
  shapValues: { feature: string; value: number }[];
  debtToIncomeRatio: number;
  featureScores: { feature: string; score: number }[];
  expectedValue: number;
}

export function computeScore(input: ScoringInput): ScoringResult {
  const features: FeatureScore[] = [
    scoreFeature("Monthly Income", input.monthlyIncomeRange),
    scoreFeature("Employment Type", input.employmentType),
    scoreFeature("Income Duration", input.incomeDuration),
    scoreFeature("Monthly EMI", input.totalMonthlyEMI),
    scoreFeature("Missed Payments", input.missedPayments),
    scoreFeature("Bill Payment Behavior", input.billPaymentBehavior),
    scoreFeature("Avg Bank Balance", input.avgBankBalance),
    scoreFeature("Savings Habit", input.savingsHabit),
    scoreFeature("Income Sources", input.incomeSources),
    scoreFeature("Loan Rejection History", input.loanRejectionHistory),
    scoreFeature("Age", input.age),
  ];

  // Weighted average score (0-100)
  const weights = [0.15, 0.08, 0.12, 0.18, 0.2, 0.07, 0.08, 0.04, 0.03, 0.03, 0.02];
  const weightedSum = features.reduce((sum, f, i) => sum + f.score * weights[i], 0);

  // Map to 300–850 credit score range
  const creditScore = Math.round(300 + (weightedSum / 100) * 550);
  const riskBand: RiskBand = creditScore >= 750 ? "Prime" : creditScore >= 650 ? "Near Prime" : creditScore >= 550 ? "Subprime" : "High Risk";
  const recommendation = creditScore >= 750 ? "Strong Approve" as const : creditScore >= 650 ? "Approve" as const : creditScore >= 550 ? "Review" as const : "Reject" as const;
  const confidence = +(0.65 + (weightedSum / 100) * 0.3).toFixed(2);
  const predictionProbability = +(1 - weightedSum / 100).toFixed(3);
  const expectedValue = +(creditScore * confidence * (1 - predictionProbability)).toFixed(0);

  // DTI proxy from EMI selection
  const dtiMap: Record<string, number> = { "None": 0.05, "< ₹5,000": 0.2, "₹5,000–15,000": 0.45, "₹15,000+": 0.7 };
  const debtToIncomeRatio = dtiMap[input.totalMonthlyEMI] ?? 0.3;

  const shapValues = features
    .map(f => ({ feature: f.feature, value: +f.shapValue.toFixed(3) }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return {
    creditScore,
    riskBand,
    recommendation,
    confidence,
    predictionProbability,
    shapValues,
    debtToIncomeRatio,
    featureScores: features.map(f => ({ feature: f.feature, score: f.score })),
    expectedValue,
  };
}
