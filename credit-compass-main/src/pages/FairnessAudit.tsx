import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fairnessData, disparateImpactRatio, costSimulation } from "@/data/mockData";
import { ShieldCheck, ShieldAlert, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const tooltipStyle = { background: "hsl(222, 25%, 12%)", border: "1px solid hsl(220, 20%, 20%)", borderRadius: 8, color: "hsl(210, 40%, 95%)" };

function formatCurrency(n: number) {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(1)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${n.toLocaleString()}`;
}

function DirGauge({ value }: { value: number }) {
  const pass = value >= 0.8;
  const pct = Math.min(value, 1) * 100;
  const color = pass ? "hsl(152, 69%, 45%)" : "hsl(0, 84%, 60%)";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(220, 20%, 16%)" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${pct * 3.14} 314`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{value.toFixed(3)}</span>
          <span className="text-xs text-muted-foreground">DIR</span>
        </div>
      </div>
      <Badge className={pass ? "bg-risk-low" : "bg-risk-high"}>
        {pass ? "PASS" : "FAIL"} (≥ 0.800)
      </Badge>
    </div>
  );
}

export default function FairnessAudit() {
  const accuracyData = fairnessData.map(f => ({ subgroup: f.subgroup, accuracy: +(f.accuracy * 100).toFixed(1), approval: +(f.approvalRate * 100).toFixed(1) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fairness & Bias Audit</h1>
        <p className="text-muted-foreground text-sm mt-1">Ensure equitable outcomes across subgroups</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DIR Gauge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-base">Disparate Impact Ratio</CardTitle></CardHeader>
            <CardContent className="flex justify-center py-4">
              <DirGauge value={disparateImpactRatio} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Subgroup Comparison */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-base">Subgroup Accuracy & Approval Rate</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={accuracyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 16%)" />
                  <XAxis dataKey="subgroup" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="accuracy" name="Accuracy %" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approval" name="Approval %" fill="hsl(174, 72%, 46%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bias Flags */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base">Bias Flags</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {fairnessData.map(f => {
                const diff = Math.abs(f.approvalRate - fairnessData[0].approvalRate);
                const flagged = diff > 0.1;
                return (
                  <div key={f.subgroup} className={`rounded-lg p-4 border ${flagged ? "border-risk-high/50 bg-risk-high/5" : "border-risk-low/50 bg-risk-low/5"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {flagged ? <ShieldAlert className="h-4 w-4 text-risk-high" /> : <ShieldCheck className="h-4 w-4 text-risk-low" />}
                      <span className="font-medium text-sm">{f.subgroup}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Approval: {(f.approvalRate * 100).toFixed(1)}% · Accuracy: {(f.accuracy * 100).toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">n = {f.count.toLocaleString()}</p>
                    <Badge className={`mt-2 text-xs ${flagged ? "bg-risk-high" : "bg-risk-low"}`}>{flagged ? "Flagged" : "Pass"}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cost-Sensitive Simulation */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base">Cost-Sensitive Business Simulation</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg p-4 bg-risk-high/10 border border-risk-high/30">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-risk-high" />
                  <span className="text-sm font-medium">Loss from False Negatives</span>
                </div>
                <p className="text-2xl font-bold text-risk-high">{formatCurrency(costSimulation.expectedLossFromFN)}</p>
                <p className="text-xs text-muted-foreground mt-1">{costSimulation.totalFalseNegatives} missed good borrowers × {formatCurrency(costSimulation.falseNegativeCost)}</p>
              </div>
              <div className="rounded-lg p-4 bg-risk-medium/10 border border-risk-medium/30">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-risk-medium" />
                  <span className="text-sm font-medium">Loss from False Positives</span>
                </div>
                <p className="text-2xl font-bold text-risk-medium">{formatCurrency(costSimulation.expectedLossFromFP)}</p>
                <p className="text-xs text-muted-foreground mt-1">{costSimulation.totalFalsePositives} bad loans × {formatCurrency(costSimulation.falsePositiveCost)}</p>
              </div>
              <div className="rounded-lg p-4 bg-risk-low/10 border border-risk-low/30">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-risk-low" />
                  <span className="text-sm font-medium">Revenue from True Positives</span>
                </div>
                <p className="text-2xl font-bold text-risk-low">{formatCurrency(costSimulation.totalProjectedGain)}</p>
                <p className="text-xs text-muted-foreground mt-1">{costSimulation.totalTruePositives} good loans × {formatCurrency(costSimulation.truePositiveGain)}</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg p-4 gradient-electric text-white flex items-center gap-3">
              <DollarSign className="h-6 w-6" />
              <div>
                <p className="text-sm font-medium">Net Projected Impact</p>
                <p className="text-2xl font-bold">{formatCurrency(costSimulation.netImpact)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
