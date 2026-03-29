// Application Store - tracks all submissions for re-application detection
// Persisted to localStorage for cross-session detection

export interface ApplicationRecord {
  id: string;
  timestamp: number;
  phone: string;
  ip: string; // estimated via public API or hashed identifier
  name: string;
  answers: Record<string, string>;
  age: string;
  creditScore: number;
  riskBand: string;
  recommendation: string;
  confidenceScore: number;      // behavioural confidence (0-100)
  interactionStability: number; // Section 1 of confidence
  responseTimeScore: number;    // Section 2 of confidence
  adaptiveTriggered: boolean;
  riskAdjustmentScore?: number;
  submissionCount?: number;     // for tracking re-applications
}

export type ReApplicationTag =
  | "Re-Apply Detected"
  | "Duplicate Submission"
  | "Optimisation Attempt"
  | "Frequent Re-Application";

export interface ReApplicationFlag {
  tag: ReApplicationTag;
  reason: string;
  submissionCount: number;
}

const STORE_KEY = "creditai_applications";

export function getAllApplications(): ApplicationRecord[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as ApplicationRecord[]) : [];
  } catch {
    return [];
  }
}

function saveApplications(apps: ApplicationRecord[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(apps));
}

export function saveApplication(app: ApplicationRecord) {
  const all = getAllApplications();
  // Limit to last 500 entries
  const updated = [...all, app].slice(-500);
  saveApplications(updated);
}

export function detectReApplication(
  phone: string,
  answers: Record<string, string>
): ReApplicationFlag | null {
  const all = getAllApplications();
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;

  // Same phone matches
  const byPhone = all.filter((a) => a.phone && a.phone === phone && phone.length >= 6);

  // Submissions in last 24h (any user, same browser)
  const recent = all.filter((a) => a.timestamp > last24h);

  // Check for highly similar answers (optimisation attempt)
  function similarity(a: Record<string, string>, b: Record<string, string>): number {
    const keys = Object.keys(a);
    if (!keys.length) return 0;
    const matches = keys.filter((k) => a[k] === b[k]).length;
    return matches / keys.length;
  }

  const similarPrev = all.filter(
    (a) => a.timestamp > now - 72 * 60 * 60 * 1000 && similarity(a.answers, answers) >= 0.8
  );

  if (byPhone.length >= 2) {
    return {
      tag: "Re-Apply Detected",
      reason: `Phone number appeared ${byPhone.length + 1} times`,
      submissionCount: byPhone.length + 1,
    };
  }

  if (recent.length >= 3) {
    return {
      tag: "Frequent Re-Application",
      reason: `${recent.length + 1} submissions in the last 24 hours`,
      submissionCount: recent.length + 1,
    };
  }

  if (similarPrev.length >= 1) {
    return {
      tag: "Optimisation Attempt",
      reason: "Highly similar inputs to a recent application (≥80% match)",
      submissionCount: similarPrev.length + 1,
    };
  }

  return null;
}

export function getAnalyticsSummary() {
  const all = getAllApplications();
  const total = all.length;
  const approved = all.filter(
    (a) => a.recommendation === "Strong Approve" || a.recommendation === "Approve"
  ).length;
  const rejected = all.filter((a) => a.recommendation === "Reject").length;
  const reviewed = all.filter((a) => a.recommendation === "Review").length;
  const adaptive = all.filter((a) => a.adaptiveTriggered).length;

  const avgConfidence =
    total > 0 ? all.reduce((s, a) => s + a.confidenceScore, 0) / total : 0;
  const avgCreditScore =
    total > 0 ? all.reduce((s, a) => s + a.creditScore, 0) / total : 0;

  const approvalRate = total > 0 ? (approved / total) * 100 : 0;

  // Re-application flags
  const phoneGroups: Record<string, ApplicationRecord[]> = {};
  all.forEach((a) => {
    if (a.phone) {
      if (!phoneGroups[a.phone]) phoneGroups[a.phone] = [];
      phoneGroups[a.phone].push(a);
    }
  });
  const reApplications = Object.values(phoneGroups).filter((g) => g.length > 1);

  return {
    total,
    approved,
    rejected,
    reviewed,
    approvalRate,
    avgConfidence: +avgConfidence.toFixed(1),
    avgCreditScore: +avgCreditScore.toFixed(0),
    adaptiveSaved: adaptive,
    reApplicationCount: reApplications.length,
    reApplicationGroups: reApplications.map((grp) => ({
      phone: grp[0].phone,
      name: grp[0].name,
      submissions: grp.length,
      latestScore: grp[grp.length - 1].creditScore,
      tag: (grp.length >= 3
        ? "Frequent Re-Application"
        : "Re-Apply Detected") as ReApplicationTag,
    })),
  };
}
