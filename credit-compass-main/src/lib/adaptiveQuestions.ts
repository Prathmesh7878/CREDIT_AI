// Adaptive Question Refinement Engine
// Triggered when credit score is near rejection threshold (550-620)

import { type ScoringInput, type ScoringResult } from "./scoringEngine";

export const ADAPTIVE_TRIGGER_THRESHOLD = 620; // trigger if score <= this

export interface AdaptiveQuestion {
  key: string;
  label: string;
  type: "options" | "agree_disagree";
  options: string[];
  reason: string; // why this question was included
}

export interface AdaptiveInput {
  profession: string;
  numberOfDependents: string;
  ownsAssets: string;
  estimatedAssetValue: string;
  existingLiabilities: string;
  loanPurpose: string;
  purchasePurpose: string;
  expectedTenure: string;
  seasonalIncome: string;
  stableIncomeAgree: string;
  noDefaultsAgree: string;
  emergencySavingsAgree: string;
  hasOutstandingLiabilities: string;
  delayedEmiHistory: string;
  speculativeInvestment: string;
}

function shouldAskAssetQuestions(input: ScoringInput): boolean {
  return (
    input.totalMonthlyEMI === "₹15,000+" ||
    input.totalMonthlyEMI === "₹5,000–15,000"
  );
}

function shouldAskIncomeVariability(input: ScoringInput): boolean {
  return (
    input.employmentType === "Self-employed" ||
    input.employmentType === "Freelancer"
  );
}

export function buildAdaptiveQuestions(
  input: ScoringInput,
  _result: ScoringResult
): AdaptiveQuestion[] {
  const questions: AdaptiveQuestion[] = [];

  // Always include core financial reinforcement questions
  questions.push(
    {
      key: "profession",
      label: "What is your current profession?",
      type: "options",
      options: ["Government Employee", "Private Sector", "Business", "Agriculture", "Student", "Other"],
      reason: "Profession provides stability context",
    },
    {
      key: "numberOfDependents",
      label: "How many dependents do you have?",
      type: "options",
      options: ["None", "1", "2", "3", "4+"],
      reason: "Dependents affect expense capacity",
    },
    {
      key: "loanPurpose",
      label: "What is the primary purpose of this loan?",
      type: "options",
      options: ["Home Purchase", "Education", "Business Expansion", "Medical", "Debt Consolidation", "Other"],
      reason: "Loan purpose determines repayment alignment",
    },
    {
      key: "expectedTenure",
      label: "What loan tenure are you expecting?",
      type: "options",
      options: ["< 1 year", "1–3 years", "3–5 years", "5+ years"],
      reason: "Tenure affects monthly repayment capacity",
    }
  );

  // Conditional: Asset questions for high EMI
  if (shouldAskAssetQuestions(input)) {
    questions.push(
      {
        key: "ownsAssets",
        label: "Do you own any significant assets?",
        type: "options",
        options: ["Yes – Property", "Yes – Vehicle", "Yes – Both", "No"],
        reason: "Assets provide collateral recovery buffer",
      },
      {
        key: "estimatedAssetValue",
        label: "Estimated value of your primary asset?",
        type: "options",
        options: ["< ₹5 Lakh", "₹5–20 Lakh", "₹20–50 Lakh", "₹50 Lakh+"],
        reason: "Asset value determines recovery potential",
      }
    );
  }

  // Conditional: Income variability for self-employed/freelancer
  if (shouldAskIncomeVariability(input)) {
    questions.push({
      key: "seasonalIncome",
      label: "Does your income fluctuate seasonally?",
      type: "options",
      options: ["No, consistent month to month", "Slightly (±20%)", "Significantly (±40%+)"],
      reason: "Income variability is critical for self-employed borrowers",
    });
  }

  // Behavioural agree/disagree statements
  questions.push(
    {
      key: "stableIncomeAgree",
      label: '"I have a stable and predictable monthly income."',
      type: "agree_disagree",
      options: ["Strongly Agree", "Agree", "Neutral", "Disagree"],
      reason: "Self-reported income stability signal",
    },
    {
      key: "noDefaultsAgree",
      label: '"I have no pending loan defaults or overdue amounts."',
      type: "agree_disagree",
      options: ["Strongly Agree", "Agree", "Neutral", "Disagree"],
      reason: "Hidden default detection",
    },
    {
      key: "emergencySavingsAgree",
      label: '"I have emergency savings to cover at least 2 months of expenses."',
      type: "agree_disagree",
      options: ["Strongly Agree", "Agree", "Neutral", "Disagree"],
      reason: "Financial resilience indicator",
    }
  );

  // Stress/negative testing questions
  questions.push(
    {
      key: "hasOutstandingLiabilities",
      label: "Do you currently have any outstanding liabilities not mentioned above?",
      type: "options",
      options: ["No", "Yes, minor (< ₹10,000)", "Yes, significant (₹10,000+)"],
      reason: "Hidden liability detection",
    },
    {
      key: "speculativeInvestment",
      label: "Is any part of this loan intended for speculative investment?",
      type: "options",
      options: ["No", "Partially (< 20%)", "Yes, significantly"],
      reason: "Speculative use greatly increases default risk",
    }
  );

  return questions;
}

export function computeRiskAdjustmentScore(
  adaptiveAnswers: Partial<AdaptiveInput>,
  baseScore: number
): number {
  let adjustment = 0;

  // Loan purpose bonus/penalty
  const purposeMap: Record<string, number> = {
    "Home Purchase": +15, "Education": +12, "Business Expansion": +8,
    "Medical": +5, "Debt Consolidation": -5, "Other": 0,
  };
  if (adaptiveAnswers.loanPurpose) adjustment += purposeMap[adaptiveAnswers.loanPurpose] ?? 0;

  // Asset ownership
  if (adaptiveAnswers.ownsAssets === "Yes – Both") adjustment += 20;
  else if (adaptiveAnswers.ownsAssets?.startsWith("Yes")) adjustment += 12;

  // Asset value
  const assetMap: Record<string, number> = {
    "₹50 Lakh+": 15, "₹20–50 Lakh": 10, "₹5–20 Lakh": 5, "< ₹5 Lakh": 0,
  };
  if (adaptiveAnswers.estimatedAssetValue) adjustment += assetMap[adaptiveAnswers.estimatedAssetValue] ?? 0;

  // Behavioural statements
  const agreeMap: Record<string, number> = {
    "Strongly Agree": 10, "Agree": 6, "Neutral": 0, "Disagree": -8,
  };
  if (adaptiveAnswers.stableIncomeAgree) adjustment += agreeMap[adaptiveAnswers.stableIncomeAgree] ?? 0;
  if (adaptiveAnswers.noDefaultsAgree) adjustment += agreeMap[adaptiveAnswers.noDefaultsAgree] ?? 0;
  if (adaptiveAnswers.emergencySavingsAgree) adjustment += (agreeMap[adaptiveAnswers.emergencySavingsAgree] ?? 0) * 0.5;

  // Negative signals
  if (adaptiveAnswers.hasOutstandingLiabilities === "Yes, significant (₹10,000+)") adjustment -= 15;
  else if (adaptiveAnswers.hasOutstandingLiabilities === "Yes, minor (< ₹10,000)") adjustment -= 5;

  if (adaptiveAnswers.speculativeInvestment === "Yes, significantly") adjustment -= 30;
  else if (adaptiveAnswers.speculativeInvestment?.startsWith("Partially")) adjustment -= 10;

  // Seasonal income penalty
  if (adaptiveAnswers.seasonalIncome === "Significantly (±40%+)") adjustment -= 10;

  // Dependents
  const depMap: Record<string, number> = { "None": 5, "1": 2, "2": 0, "3": -5, "4+": -12 };
  if (adaptiveAnswers.numberOfDependents) adjustment += depMap[adaptiveAnswers.numberOfDependents] ?? 0;

  const adjusted = Math.min(850, Math.max(300, baseScore + adjustment));
  return Math.round(adjusted);
}
