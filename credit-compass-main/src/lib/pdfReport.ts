import jsPDF from "jspdf";
import { type ScoringResult } from "./scoringEngine";
import { type Suggestion } from "./suggestions";

export function generatePdfReport(
  result: ScoringResult,
  answers: Record<string, string>,
  age: string,
  suggestions: Suggestion[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 45, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CreditAI", 20, 22);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Credit Score Report", 20, 32);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, 20, 40);

  y = 55;

  // Score section
  const riskColor = result.riskBand === "Prime" ? [34, 197, 94] :
    result.riskBand === "Near Prime" ? [59, 130, 246] :
    result.riskBand === "Subprime" ? [245, 158, 11] : [239, 68, 68];
  
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.roundedRect(20, y, pageWidth - 40, 35, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(`${result.creditScore}`, pageWidth / 2, y + 18, { align: "center" });
  doc.setFontSize(11);
  doc.text(`${result.riskBand} Risk — ${result.recommendation}`, pageWidth / 2, y + 28, { align: "center" });

  y += 45;

  // Key Metrics
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Key Financial Metrics", 20, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const metrics = [
    ["Credit Score", `${result.creditScore} / 850`],
    ["Risk Band", result.riskBand],
    ["Recommendation", result.recommendation],
    ["Default Probability", `${(result.predictionProbability * 100).toFixed(1)}%`],
    ["Debt-to-Income Ratio", `${(result.debtToIncomeRatio * 100).toFixed(0)}%`],
    ["Confidence", `${(result.confidence * 100).toFixed(0)}%`],
    ["Monthly Income", answers.monthlyIncomeRange || "N/A"],
    ["Employment", answers.employmentType || "N/A"],
    ["Age", age],
  ];

  metrics.forEach(([label, val]) => {
    doc.setTextColor(100, 116, 139);
    doc.text(label, 25, y);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text(val, pageWidth - 25, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 7;
  });

  y += 5;

  // Feature Analysis
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Feature Impact Analysis (SHAP)", 20, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  result.shapValues.forEach((sv) => {
    const barWidth = Math.abs(sv.value) * 300;
    const isPositive = sv.value > 0;
    doc.setTextColor(100, 116, 139);
    doc.text(sv.feature, 25, y);
    doc.setFillColor(isPositive ? 239 : 34, isPositive ? 68 : 197, isPositive ? 68 : 94);
    const barX = isPositive ? 120 : 120 - barWidth;
    doc.roundedRect(barX, y - 3, barWidth, 4, 1, 1, "F");
    doc.setTextColor(30, 41, 59);
    doc.text(`${sv.value > 0 ? "+" : ""}${sv.value.toFixed(3)}`, 170, y);
    y += 7;
  });

  y += 5;

  // Suggestions
  if (suggestions.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Improvement Recommendations", 20, y);
    y += 8;

    suggestions.forEach((s, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      const impactColor = s.impact === "High" ? [239, 68, 68] : s.impact === "Medium" ? [245, 158, 11] : [34, 197, 94];
      doc.setFillColor(impactColor[0], impactColor[1], impactColor[2]);
      doc.circle(27, y - 1.5, 2, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(`${s.title} (${s.impact} Impact)`, 33, y);
      y += 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      const lines = doc.splitTextToSize(s.description, pageWidth - 55);
      doc.text(lines, 33, y);
      y += lines.length * 4.5 + 4;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("CreditAI — AI-Powered Alternative Credit Scoring", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10, { align: "right" });
  }

  doc.save(`CreditAI_Report_${result.creditScore}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
