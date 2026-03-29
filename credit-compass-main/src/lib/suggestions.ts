import { type ScoringInput, type ScoringResult } from "./scoringEngine";

export interface Suggestion {
  title: string;
  description: string;
  impact: "High" | "Medium" | "Low";
}

export function generateSuggestions(input: ScoringInput, result: ScoringResult): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (input.missedPayments !== "Never") {
    suggestions.push({
      title: "Eliminate Missed Payments",
      description: "Set up auto-pay or payment reminders for all bills and EMIs. Even 1-2 missed payments significantly hurt your score.",
      impact: "High",
    });
  }

  if (input.totalMonthlyEMI === "₹15,000+" || input.totalMonthlyEMI === "₹5,000–15,000") {
    suggestions.push({
      title: "Reduce Your Debt-to-Income Ratio",
      description: "Focus on paying down existing EMIs before taking new loans. Consider debt consolidation to lower monthly obligations.",
      impact: "High",
    });
  }

  if (input.billPaymentBehavior !== "Before due date") {
    suggestions.push({
      title: "Pay Bills Before Due Date",
      description: "Paying bills early demonstrates financial discipline. Set up auto-debit 3-5 days before due dates.",
      impact: "Medium",
    });
  }

  if (input.avgBankBalance === "< ₹5,000" || input.avgBankBalance === "₹5,000–20,000") {
    suggestions.push({
      title: "Build a Liquidity Buffer",
      description: "Maintain at least 3 months of expenses as bank balance. Start with ₹1,000/month auto-transfer to savings.",
      impact: "High",
    });
  }

  if (input.savingsHabit === "No" || input.savingsHabit === "Occasionally") {
    suggestions.push({
      title: "Develop Consistent Savings Habit",
      description: "Save at least 10-20% of monthly income. Use recurring deposits or SIPs for automated savings.",
      impact: "Medium",
    });
  }

  if (input.incomeSources === "1") {
    suggestions.push({
      title: "Diversify Income Sources",
      description: "Explore freelancing, part-time work, or passive income streams. Multiple income sources reduce default risk significantly.",
      impact: "Medium",
    });
  }

  if (input.incomeDuration === "< 6 months" || input.incomeDuration === "6–12 months") {
    suggestions.push({
      title: "Build Income Stability",
      description: "Stay in your current role longer to demonstrate income consistency. Avoid frequent job changes.",
      impact: "Medium",
    });
  }

  if (input.monthlyIncomeRange === "< ₹15,000" || input.monthlyIncomeRange === "₹15,000–30,000") {
    suggestions.push({
      title: "Increase Earning Capacity",
      description: "Invest in skill development or certifications to boost income. Consider upskilling in high-demand areas.",
      impact: "Low",
    });
  }

  if (input.loanRejectionHistory !== "No") {
    suggestions.push({
      title: "Address Past Loan Rejections",
      description: "Understand why past applications were rejected. Fix those specific issues before reapplying.",
      impact: "Medium",
    });
  }

  // Return top 6 sorted by impact
  const impactOrder = { High: 0, Medium: 1, Low: 2 };
  return suggestions.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]).slice(0, 6);
}
