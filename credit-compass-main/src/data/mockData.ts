// ============= Mock Data for AI Credit Scoring Dashboard =============

export interface Borrower {
  id: string;
  name: string;
  creditScore: number;
  riskBand: "Low" | "Medium" | "High";
  predictionProbability: number;
  debtToIncomeRatio: number;
  paymentUtilizationRatio: number;
  monthlyIncome: number;
  numberOfOpenAccounts: number;
  numberOfLatePayments: number;
  totalDebt: number;
  creditAge: number; // years
  recommendation: "Approve" | "Decline";
  confidence: number;
  shapValues: { feature: string; value: number }[];
}

export interface ModelMetrics {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  auc: number;
  crossValMean: number;
  crossValStd: number;
}

export interface ConfusionMatrixData {
  truePositive: number;
  falsePositive: number;
  trueNegative: number;
  falseNegative: number;
}

export interface RocPoint {
  fpr: number;
  tpr: number;
}

export interface FairnessData {
  subgroup: string;
  accuracy: number;
  approvalRate: number;
  count: number;
}

// ---- KPI Data ----
export const kpiData = {
  totalBorrowers: 15847,
  avgCreditScore: 682,
  approvalRate: 0.734,
  aucScore: 0.867,
  selectedModel: "XGBoost",
  financialInclusionRate: 0.23,
  newBorrowersScored: 3241,
};

// ---- Risk Band Distribution ----
export const riskDistribution = [
  { band: "Low Risk", count: 7234, percentage: 45.6, color: "hsl(152, 69%, 45%)" },
  { band: "Medium Risk", count: 5128, percentage: 32.4, color: "hsl(38, 92%, 50%)" },
  { band: "High Risk", count: 3485, percentage: 22.0, color: "hsl(0, 84%, 60%)" },
];

// ---- Prediction Probability Distribution ----
export const predictionDistribution = Array.from({ length: 20 }, (_, i) => {
  const binStart = i * 0.05;
  const binEnd = binStart + 0.05;
  const label = `${(binStart * 100).toFixed(0)}-${(binEnd * 100).toFixed(0)}%`;
  // Create a bimodal distribution
  const peak1 = Math.exp(-((binStart - 0.2) ** 2) / 0.02) * 800;
  const peak2 = Math.exp(-((binStart - 0.8) ** 2) / 0.03) * 1200;
  return { bin: label, count: Math.round(peak1 + peak2 + Math.random() * 50) };
});

// ---- Borrowers ----
const firstNames = ["Aarav", "Priya", "Rahul", "Sneha", "Vikram", "Ananya", "Rohan", "Kavita", "Arjun", "Meera", "Sanjay", "Divya", "Amit", "Pooja", "Karan", "Neha", "Raj", "Swati", "Deepak", "Ritu"];
const lastNames = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Reddy", "Joshi", "Mehta", "Nair", "Verma", "Iyer", "Chopra", "Das", "Bhat", "Rao", "Desai", "Mishra", "Pandey", "Shah", "Agarwal"];

function generateShapValues(riskBand: "Low" | "Medium" | "High"): { feature: string; value: number }[] {
  const multiplier = riskBand === "High" ? 1 : riskBand === "Medium" ? 0.3 : -1;
  return [
    { feature: "Debt-to-Income Ratio", value: +(multiplier * (0.15 + Math.random() * 0.2)).toFixed(3) },
    { feature: "Payment Utilization", value: +(multiplier * (0.1 + Math.random() * 0.15)).toFixed(3) },
    { feature: "Late Payments", value: +(multiplier * (0.08 + Math.random() * 0.12)).toFixed(3) },
    { feature: "Credit Age", value: +(-multiplier * (0.05 + Math.random() * 0.1)).toFixed(3) },
    { feature: "Monthly Income", value: +(-multiplier * (0.04 + Math.random() * 0.08)).toFixed(3) },
    { feature: "Open Accounts", value: +((Math.random() - 0.5) * 0.06).toFixed(3) },
    { feature: "Total Debt", value: +(multiplier * (0.03 + Math.random() * 0.05)).toFixed(3) },
  ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

export const borrowers: Borrower[] = Array.from({ length: 50 }, (_, i) => {
  const creditScore = Math.round(350 + Math.random() * 500);
  const riskBand: "Low" | "Medium" | "High" = creditScore >= 700 ? "Low" : creditScore >= 550 ? "Medium" : "High";
  const prob = riskBand === "Low" ? 0.1 + Math.random() * 0.25 : riskBand === "Medium" ? 0.35 + Math.random() * 0.3 : 0.65 + Math.random() * 0.3;
  return {
    id: `BRW-${String(i + 1001).padStart(4, "0")}`,
    name: `${firstNames[i % 20]} ${lastNames[(i * 7) % 20]}`,
    creditScore,
    riskBand,
    predictionProbability: +prob.toFixed(3),
    debtToIncomeRatio: +(0.1 + Math.random() * 0.7).toFixed(2),
    paymentUtilizationRatio: +(0.05 + Math.random() * 0.9).toFixed(2),
    monthlyIncome: Math.round(15000 + Math.random() * 185000),
    numberOfOpenAccounts: Math.round(1 + Math.random() * 12),
    numberOfLatePayments: riskBand === "Low" ? Math.round(Math.random() * 2) : riskBand === "Medium" ? Math.round(1 + Math.random() * 5) : Math.round(3 + Math.random() * 10),
    totalDebt: Math.round(10000 + Math.random() * 2000000),
    creditAge: +(1 + Math.random() * 20).toFixed(1),
    recommendation: creditScore >= 550 ? "Approve" : "Decline",
    confidence: +(0.6 + Math.random() * 0.35).toFixed(2),
    shapValues: generateShapValues(riskBand),
  };
});

// ---- Model Metrics ----
export const modelMetrics: ModelMetrics[] = [
  { model: "Logistic Regression", accuracy: 0.792, precision: 0.756, recall: 0.681, f1: 0.717, auc: 0.812, crossValMean: 0.788, crossValStd: 0.015 },
  { model: "Random Forest", accuracy: 0.841, precision: 0.823, recall: 0.748, f1: 0.784, auc: 0.856, crossValMean: 0.835, crossValStd: 0.012 },
  { model: "XGBoost", accuracy: 0.862, precision: 0.847, recall: 0.789, f1: 0.817, auc: 0.891, crossValMean: 0.857, crossValStd: 0.009 },
  { model: "KNN", accuracy: 0.743, precision: 0.712, recall: 0.634, f1: 0.671, auc: 0.768, crossValMean: 0.738, crossValStd: 0.022 },
];

// ---- ROC Curves ----
function generateRocCurve(auc: number): RocPoint[] {
  const points: RocPoint[] = [{ fpr: 0, tpr: 0 }];
  for (let i = 1; i <= 19; i++) {
    const fpr = i / 20;
    const tpr = Math.min(1, Math.pow(fpr, 1 / (auc * 2.5)) + (Math.random() - 0.5) * 0.03);
    points.push({ fpr: +fpr.toFixed(3), tpr: +tpr.toFixed(3) });
  }
  points.push({ fpr: 1, tpr: 1 });
  return points;
}

export const rocCurves: Record<string, RocPoint[]> = {
  "Logistic Regression": generateRocCurve(0.812),
  "Random Forest": generateRocCurve(0.856),
  "XGBoost": generateRocCurve(0.891),
  "KNN": generateRocCurve(0.768),
};

// ---- Confusion Matrices ----
export const confusionMatrices: Record<string, ConfusionMatrixData> = {
  "Logistic Regression": { truePositive: 1362, falsePositive: 438, trueNegative: 4538, falseNegative: 638 },
  "Random Forest": { truePositive: 1496, falsePositive: 322, trueNegative: 4654, falseNegative: 504 },
  "XGBoost": { truePositive: 1578, falsePositive: 284, trueNegative: 4692, falseNegative: 422 },
  "KNN": { truePositive: 1268, falsePositive: 514, trueNegative: 4462, falseNegative: 732 },
};

// ---- Threshold Optimization ----
export const thresholdData = Array.from({ length: 21 }, (_, i) => {
  const threshold = i * 0.05;
  return {
    threshold: +threshold.toFixed(2),
    precision: +(0.55 + 0.4 * threshold + (Math.random() - 0.5) * 0.03).toFixed(3),
    recall: +(0.95 - 0.6 * threshold + (Math.random() - 0.5) * 0.03).toFixed(3),
    f1: 0,
  };
}).map((d) => ({ ...d, f1: +((2 * d.precision * d.recall) / (d.precision + d.recall)).toFixed(3) }));

// ---- Fairness Data ----
export const fairnessData: FairnessData[] = [
  { subgroup: "Urban", accuracy: 0.87, approvalRate: 0.78, count: 8234 },
  { subgroup: "Semi-Urban", accuracy: 0.84, approvalRate: 0.72, count: 4512 },
  { subgroup: "Rural", accuracy: 0.81, approvalRate: 0.65, count: 3101 },
];

export const disparateImpactRatio = 0.833;

// ---- Cost-Sensitive Simulation ----
export const costSimulation = {
  avgLoanAmount: 250000,
  falseNegativeCost: 18500, // missed good borrower opportunity
  falsePositiveCost: 62000, // bad loan default loss
  totalFalseNegatives: 422,
  totalFalsePositives: 284,
  expectedLossFromFN: 422 * 18500,
  expectedLossFromFP: 284 * 62000,
  truePositiveGain: 12500, // revenue from good loan
  totalTruePositives: 1578,
  totalProjectedGain: 1578 * 12500,
  netImpact: 1578 * 12500 - 284 * 62000 - 422 * 18500,
};

// ---- Feature Importance (Global SHAP) ----
export const globalShapImportance = [
  { feature: "Debt-to-Income Ratio", importance: 0.284 },
  { feature: "Payment Utilization", importance: 0.213 },
  { feature: "Late Payments", importance: 0.176 },
  { feature: "Credit Age", importance: 0.112 },
  { feature: "Monthly Income", importance: 0.089 },
  { feature: "Total Debt", importance: 0.067 },
  { feature: "Open Accounts", importance: 0.041 },
  { feature: "Revolving Balance", importance: 0.018 },
];
