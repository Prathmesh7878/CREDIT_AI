// Decision Confidence Score Engine
// Two sections: Interaction Stability (50pts) + Response Time (50pts) = 100pts

export interface BehaviouralMetrics {
  optimalTimeMs: number; // ideal time window per question in ms
}

// Per-question optimal reading + response time (ms)
const OPTIMAL_MIN_MS = 4000;  // 4 seconds
const OPTIMAL_MAX_MS = 25000; // 25 seconds

export interface QuestionMetric {
  questionIndex: number;
  changeCount: number;     // how many times option changed before final selection
  timeSpentMs: number;     // time from question display to selection
}

export function computeInteractionStability(metrics: QuestionMetric[]): number {
  if (!metrics.length) return 45;

  const totalChanges = metrics.reduce((sum, m) => sum + m.changeCount, 0);
  const avgChanges = totalChanges / metrics.length;

  // Score: 0 avg changes → 50, 1-2 avg → 35, 3+ → 15
  if (avgChanges === 0) return 50;
  if (avgChanges <= 1) return 42;
  if (avgChanges <= 2) return 33;
  if (avgChanges <= 3) return 22;
  return 12;
}

export function computeResponseTimeScore(metrics: QuestionMetric[]): number {
  if (!metrics.length) return 45;

  let totalScore = 0;
  for (const m of metrics) {
    const t = m.timeSpentMs;
    if (t >= OPTIMAL_MIN_MS && t <= OPTIMAL_MAX_MS) {
      // Optimal window → full marks
      totalScore += 50;
    } else if (t < OPTIMAL_MIN_MS) {
      // Too fast → might be random clicking
      const ratio = t / OPTIMAL_MIN_MS;
      totalScore += Math.round(30 * ratio + 10);
    } else {
      // Too slow → uncertainty or distraction
      const overshoot = (t - OPTIMAL_MAX_MS) / 10000;
      totalScore += Math.max(10, Math.round(50 - overshoot * 15));
    }
  }

  return Math.min(50, Math.round(totalScore / metrics.length));
}

export interface ConfidenceResult {
  total: number; // 0-100
  stabilityScore: number; // 0-50
  responseTimeScore: number; // 0-50
  label: "High Stability" | "Moderate Stability" | "Low Stability";
}

export function computeBehaviouralConfidence(
  metrics: QuestionMetric[]
): ConfidenceResult {
  const stability = computeInteractionStability(metrics);
  const responseTime = computeResponseTimeScore(metrics);
  const total = stability + responseTime;

  const label: ConfidenceResult["label"] =
    total >= 75 ? "High Stability" : total >= 50 ? "Moderate Stability" : "Low Stability";

  return { total, stabilityScore: stability, responseTimeScore: responseTime, label };
}
