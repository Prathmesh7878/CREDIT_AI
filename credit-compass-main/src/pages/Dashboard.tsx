import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, CheckCircle, Brain, Heart } from "lucide-react";
import { kpiData, riskDistribution, predictionDistribution } from "@/data/mockData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const kpis = [
  { label: "Borrowers Scored", value: kpiData.totalBorrowers.toLocaleString(), icon: Users, accent: "text-primary" },
  { label: "Avg Credit Score", value: kpiData.avgCreditScore.toString(), icon: TrendingUp, accent: "text-teal" },
  { label: "Approval Rate", value: `${(kpiData.approvalRate * 100).toFixed(1)}%`, icon: CheckCircle, accent: "text-risk-low" },
  { label: "AUC Score", value: kpiData.aucScore.toFixed(3), icon: Brain, accent: "text-amber" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">AI-Powered Alternative Credit Scoring System</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="glass-card border-border/50">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`rounded-lg p-2.5 bg-secondary ${kpi.accent}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Band Distribution */}
        <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Risk Band Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    dataKey="count"
                    nameKey="band"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    strokeWidth={2}
                    stroke="hsl(222, 25%, 9%)"
                  >
                    {riskDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip
                    contentStyle={{ background: "hsl(222, 25%, 12%)", border: "1px solid hsl(220, 20%, 20%)", borderRadius: 8, color: "hsl(210, 40%, 95%)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Prediction Probability Distribution */}
        <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Prediction Probability Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={predictionDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 16%)" />
                  <XAxis dataKey="bin" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} interval={3} />
                  <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(222, 25%, 12%)", border: "1px solid hsl(220, 20%, 20%)", borderRadius: 8, color: "hsl(210, 40%, 95%)" }} />
                  <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Model Summary + Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} custom={6} initial="hidden" animate="visible">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Model Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Selected Model</span><span className="font-semibold text-primary">{kpiData.selectedModel}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">AUC Score</span><span className="font-semibold">{kpiData.aucScore}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">New Borrowers This Month</span><span className="font-semibold">{kpiData.newBorrowersScored.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Dataset</span><span className="font-semibold">Give Me Some Credit</span></div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} custom={7} initial="hidden" animate="visible">
          <Card className="gradient-electric text-white border-0">
            <CardContent className="p-6 flex items-start gap-4">
              <Heart className="h-8 w-8 mt-1 shrink-0 opacity-90" />
              <div>
                <h3 className="font-bold text-lg mb-1">Financial Inclusion Impact</h3>
                <p className="text-sm opacity-90">
                  This system has enabled credit scoring for <strong>{(kpiData.financialInclusionRate * 100).toFixed(0)}%</strong> more
                  unbanked individuals, expanding access to formal financial services for MSMEs and underserved communities.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
