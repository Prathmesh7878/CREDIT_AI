import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { borrowers, type Borrower } from "@/data/mockData";
import { Search, CheckCircle, XCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

function ScoreGauge({ score, riskBand }: { score: number; riskBand: string }) {
  const pct = ((score - 300) / 550) * 100;
  const colorMap: Record<string, string> = { "Low": "hsl(152, 69%, 45%)", "Medium": "hsl(38, 92%, 50%)", "High": "hsl(0, 84%, 60%)", "Prime": "hsl(152, 69%, 45%)", "Near Prime": "hsl(217, 91%, 60%)", "Subprime": "hsl(38, 92%, 50%)", "High Risk": "hsl(0, 84%, 60%)" };
  const color = colorMap[riskBand] ?? "hsl(215, 20%, 55%)";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${pct * 3.14} 314`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{score}</span>
          <span className="text-xs text-muted-foreground">/ 850</span>
        </div>
      </div>
      <Badge variant={riskBand === "Low" ? "default" : "destructive"}
        className={riskBand === "Low" ? "bg-risk-low" : riskBand === "Medium" ? "bg-risk-medium text-black" : "bg-risk-high"}>
        {riskBand} Risk
      </Badge>
    </div>
  );
}

export default function BorrowerProfile() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Borrower>(borrowers[0]);

  const filtered = useMemo(() => {
    if (!query) return borrowers.slice(0, 10);
    return borrowers.filter(b => b.name.toLowerCase().includes(query.toLowerCase()) || b.id.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  const shapData = selected.shapValues.map(s => ({
    feature: s.feature,
    value: s.value,
    fill: s.value > 0 ? "hsl(0, 84%, 60%)" : "hsl(152, 69%, 45%)",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Borrower Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Search and inspect individual credit assessments</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or ID..." value={query} onChange={(e) => setQuery(e.target.value)}
          className="pl-10 bg-secondary border-border" />
      </div>

      {/* Search Results */}
      {query && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.slice(0, 6).map(b => (
            <button key={b.id} onClick={() => { setSelected(b); setQuery(""); }}
              className={`text-left p-3 rounded-lg border transition-colors ${selected.id === b.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 bg-secondary/50"}`}>
              <p className="font-medium text-sm">{b.name}</p>
              <p className="text-xs text-muted-foreground">{b.id} · Score: {b.creditScore}</p>
            </button>
          ))}
        </div>
      )}

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score + Recommendation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card border-border/50">
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground">{selected.name}</p>
              <p className="text-xs text-muted-foreground">{selected.id}</p>
              <ScoreGauge score={selected.creditScore} riskBand={selected.riskBand} />
              <div className="flex items-center gap-2 mt-2">
                {selected.recommendation === "Approve" ? (
                  <CheckCircle className="h-5 w-5 text-risk-low" />
                ) : (
                  <XCircle className="h-5 w-5 text-risk-high" />
                )}
                <span className="font-semibold">{selected.recommendation}</span>
                <span className="text-sm text-muted-foreground">({(selected.confidence * 100).toFixed(0)}%)</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Details Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-base">Borrower Details</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {[
                ["Debt-to-Income", `${(selected.debtToIncomeRatio * 100).toFixed(0)}%`],
                ["Payment Utilization", `${(selected.paymentUtilizationRatio * 100).toFixed(0)}%`],
                ["Monthly Income", `₹${selected.monthlyIncome.toLocaleString()}`],
                ["Open Accounts", selected.numberOfOpenAccounts],
                ["Late Payments", selected.numberOfLatePayments],
                ["Total Debt", `₹${selected.totalDebt.toLocaleString()}`],
                ["Credit Age", `${selected.creditAge} yrs`],
                ["Default Prob.", `${(selected.predictionProbability * 100).toFixed(1)}%`],
              ].map(([label, val]) => (
                <div key={label as string} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* SHAP Waterfall */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-base">SHAP Explanation</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={shapData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 16%)" />
                  <XAxis type="number" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                  <YAxis type="category" dataKey="feature" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} width={110} />
                  <Tooltip contentStyle={{ background: "hsl(222, 25%, 12%)", border: "1px solid hsl(220, 20%, 20%)", borderRadius: 8, color: "hsl(210, 40%, 95%)" }} />
                  <ReferenceLine x={0} stroke="hsl(215, 20%, 55%)" />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {shapData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
