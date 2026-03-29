import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  Users, CheckCircle, XCircle, RefreshCw, Brain, TrendingUp, AlertTriangle,
  ShieldAlert, Info, BarChart3, Activity,
} from "lucide-react";
import { getAllApplications, getAnalyticsSummary } from "@/lib/applicationStore";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4 } }),
};

const TAG_COLORS: Record<string, string> = {
  "Re-Apply Detected": "text-risk-high border-risk-high",
  "Frequent Re-Application": "text-risk-high border-risk-high",
  "Optimisation Attempt": "text-risk-medium border-risk-medium",
  "Duplicate Submission": "text-risk-high border-risk-high",
};

export default function LoanAnalytics() {
  const summary = useMemo(() => getAnalyticsSummary(), []);
  const applications = useMemo(() => getAllApplications(), []);

  // Confidence vs approval correlation buckets
  const confidenceBuckets = useMemo(() => {
    const buckets: Record<string, { approved: number; rejected: number; total: number }> = {
      "0-25": { approved: 0, rejected: 0, total: 0 },
      "26-50": { approved: 0, rejected: 0, total: 0 },
      "51-75": { approved: 0, rejected: 0, total: 0 },
      "76-100": { approved: 0, rejected: 0, total: 0 },
    };
    applications.forEach(app => {
      const bucket =
        app.confidenceScore <= 25 ? "0-25"
        : app.confidenceScore <= 50 ? "26-50"
        : app.confidenceScore <= 75 ? "51-75"
        : "76-100";
      buckets[bucket].total += 1;
      if (app.recommendation === "Strong Approve" || app.recommendation === "Approve") {
        buckets[bucket].approved += 1;
      } else {
        buckets[bucket].rejected += 1;
      }
    });
    return Object.entries(buckets).map(([range, v]) => ({
      range,
      approved: v.approved,
      rejected: v.rejected,
      approvalRate: v.total > 0 ? +((v.approved / v.total) * 100).toFixed(1) : 0,
    }));
  }, [applications]);

  // Score distribution buckets
  const scoreBuckets = useMemo(() => {
    const bands = [
      { label: "High Risk\n<550", min: 0, max: 549, color: "hsl(0, 84%, 60%)" },
      { label: "Subprime\n550-649", min: 550, max: 649, color: "hsl(38, 92%, 50%)" },
      { label: "Near Prime\n650-749", min: 650, max: 749, color: "hsl(217, 91%, 60%)" },
      { label: "Prime\n750+", min: 750, max: 999, color: "hsl(152, 69%, 45%)" },
    ];
    return bands.map(b => ({
      ...b,
      count: applications.filter(a => a.creditScore >= b.min && a.creditScore <= b.max).length,
    }));
  }, [applications]);

  const kpiCards = [
    { label: "Total Applications", value: summary.total, icon: Users, accent: "text-primary" },
    { label: "Approved", value: summary.approved, icon: CheckCircle, accent: "text-risk-low" },
    { label: "Rejected", value: summary.rejected, icon: XCircle, accent: "text-risk-high" },
    { label: "Approval Rate", value: `${summary.approvalRate.toFixed(1)}%`, icon: TrendingUp, accent: "text-teal" },
    { label: "Re-Application Cases", value: summary.reApplicationCount, icon: RefreshCw, accent: "text-risk-medium" },
    { label: "Avg Confidence Score", value: summary.total > 0 ? `${summary.avgConfidence}/100` : "—", icon: Brain, accent: "text-primary" },
    { label: "Avg Credit Score", value: summary.total > 0 ? summary.avgCreditScore : "—", icon: BarChart3, accent: "text-amber" },
    { label: "Adaptive Flow Triggered", value: summary.adaptiveSaved, icon: Activity, accent: "text-risk-low" },
  ];

  const isEmpty = summary.total === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Loan Approval Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          System Performance Intelligence — based on {summary.total} live application{summary.total !== 1 ? "s" : ""} from this session.
        </p>
      </div>

      {isEmpty && (
        <Card className="glass-card border-border/50 text-center p-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-semibold text-lg">No Applications Yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Go to <strong>Score Borrower</strong> and complete the credit assessment flow. Data will appear here automatically.
          </p>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <motion.div key={kpi.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="glass-card border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`rounded-lg p-2 bg-secondary ${kpi.accent}`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground leading-tight">{kpi.label}</p>
                  <p className="text-xl font-bold tracking-tight">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {!isEmpty && (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <motion.div variants={fadeUp} custom={8} initial="hidden" animate="visible">
              <Card className="glass-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Credit Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={scoreBuckets} margin={{ top: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {scoreBuckets.map((b, i) => <Cell key={i} fill={b.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Confidence vs Approval */}
            <motion.div variants={fadeUp} custom={9} initial="hidden" animate="visible">
              <Card className="glass-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    Confidence Score vs Approval
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent className="text-xs max-w-xs">
                        Higher behavioural confidence correlates with higher approval rates, validating its use as a tie-breaker.
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={confidenceBuckets} margin={{ top: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="range" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} label={{ value: "Confidence Range", position: "insideBottom", offset: -2, fontSize: 10 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                      <Legend />
                      <Bar dataKey="approved" fill="hsl(152, 69%, 45%)" radius={[4, 4, 0, 0]} name="Approved" />
                      <Bar dataKey="rejected" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} name="Rejected" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* System Performance Insights */}
          <motion.div variants={fadeUp} custom={10} initial="hidden" animate="visible">
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  System Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-secondary/50 border border-border/30 p-4 text-center">
                    <p className="text-3xl font-bold text-risk-low">{summary.adaptiveSaved}</p>
                    <p className="text-xs text-muted-foreground mt-1">Users Saved from Rejection by Adaptive Flow</p>
                  </div>
                  <div className="rounded-xl bg-secondary/50 border border-border/30 p-4 text-center">
                    <p className="text-3xl font-bold text-risk-medium">{summary.reApplicationCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Re-Application / Fraud Flags Detected</p>
                  </div>
                  <div className="rounded-xl bg-secondary/50 border border-border/30 p-4 text-center">
                    <p className="text-3xl font-bold text-primary">
                      {summary.total > 0
                        ? `${((summary.reApplicationCount / summary.total) * 100).toFixed(1)}%`
                        : "0%"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Fraud Attempt Detection Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Banking Advantages */}
          <motion.div variants={fadeUp} custom={11} initial="hidden" animate="visible">
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Banking Intelligence Advantages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  {[
                    {
                      icon: TrendingUp, color: "text-risk-low",
                      title: "Cost Reduction",
                      points: ["Automated duplicate detection", "Reduced manual review cases", "Lower repeated processing cost"],
                    },
                    {
                      icon: Brain, color: "text-primary",
                      title: "Accuracy Improvement",
                      points: ["Behavioural signal integration", "Dynamic question refinement", "Manipulation detection layer"],
                    },
                    {
                      icon: ShieldAlert, color: "text-risk-medium",
                      title: "Risk Prediction",
                      points: ["IP & submission pattern tracking", "Behavioural confidence signals", "Repeat behaviour monitoring"],
                    },
                  ].map((block) => (
                    <div key={block.title} className="rounded-xl bg-secondary/30 border border-border/30 p-4">
                      <div className={`flex items-center gap-2 mb-3 font-semibold ${block.color}`}>
                        <block.icon className="h-4 w-4" />
                        {block.title}
                      </div>
                      <ul className="space-y-1.5">
                        {block.points.map((p) => (
                          <li key={p} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle className="h-3 w-3 shrink-0 text-risk-low mt-0.5" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* Re-Application Monitoring Table */}
      <motion.div variants={fadeUp} custom={12} initial="hidden" animate="visible">
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-risk-medium" />
              Repeated Application Monitoring
              <Badge variant="outline" className="text-xs ml-auto">
                {summary.reApplicationGroups.length} flag{summary.reApplicationGroups.length !== 1 ? "s" : ""}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.reApplicationGroups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No re-application patterns detected yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border">
                      <th className="text-left pb-2">Name</th>
                      <th className="text-left pb-2">Phone</th>
                      <th className="text-center pb-2">Submissions</th>
                      <th className="text-center pb-2">Latest Score</th>
                      <th className="text-left pb-2">Risk Tag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {summary.reApplicationGroups.map((row, i) => (
                      <tr key={i} className="py-2">
                        <td className="py-2 font-medium">{row.name || "—"}</td>
                        <td className="py-2 text-muted-foreground">
                          {row.phone ? `${row.phone.slice(0, 4)}XXXXXX` : "—"}
                        </td>
                        <td className="py-2 text-center">
                          <span className="font-bold text-risk-medium">{row.submissions} ⚠</span>
                        </td>
                        <td className="py-2 text-center font-medium">{row.latestScore}</td>
                        <td className="py-2">
                          <Badge variant="outline" className={`text-xs ${TAG_COLORS[row.tag] ?? ""}`}>
                            {row.tag}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
