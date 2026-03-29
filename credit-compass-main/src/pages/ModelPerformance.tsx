import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { modelMetrics, rocCurves, confusionMatrices, thresholdData } from "@/data/mockData";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell,
} from "recharts";

const modelColors: Record<string, string> = {
  "Logistic Regression": "hsl(215, 20%, 55%)",
  "Random Forest": "hsl(152, 69%, 45%)",
  "XGBoost": "hsl(217, 91%, 60%)",
  "KNN": "hsl(38, 92%, 50%)",
};

const tooltipStyle = { background: "hsl(222, 25%, 12%)", border: "1px solid hsl(220, 20%, 20%)", borderRadius: 8, color: "hsl(210, 40%, 95%)" };

export default function ModelPerformance() {
  const [selectedModel, setSelectedModel] = useState("XGBoost");
  const [thresholdIdx, setThresholdIdx] = useState([10]);

  const cm = confusionMatrices[selectedModel];
  const cmData = [
    { label: "True Pos", value: cm.truePositive, color: "hsl(152, 69%, 45%)" },
    { label: "False Pos", value: cm.falsePositive, color: "hsl(38, 92%, 50%)" },
    { label: "True Neg", value: cm.trueNegative, color: "hsl(174, 72%, 46%)" },
    { label: "False Neg", value: cm.falseNegative, color: "hsl(0, 84%, 60%)" },
  ];

  // Merge ROC data for multi-line chart
  const rocData = rocCurves["XGBoost"].map((pt, i) => {
    const row: Record<string, number> = { fpr: pt.fpr };
    Object.entries(rocCurves).forEach(([model, points]) => {
      row[model] = points[i]?.tpr ?? 0;
    });
    return row;
  });

  const currentThreshold = thresholdData[thresholdIdx[0]];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Model Performance</h1>
          <p className="text-muted-foreground text-sm mt-1">Compare models and optimize thresholds</p>
        </div>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-48 bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            {modelMetrics.map(m => <SelectItem key={m.model} value={m.model}>{m.model}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Comparison Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card border-border/50 overflow-hidden">
          <CardHeader className="pb-2"><CardTitle className="text-base">Model Comparison</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Accuracy</TableHead>
                  <TableHead className="text-right">Precision</TableHead>
                  <TableHead className="text-right">Recall</TableHead>
                  <TableHead className="text-right">F1</TableHead>
                  <TableHead className="text-right">AUC</TableHead>
                  <TableHead className="text-right">CV Mean ± Std</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelMetrics.map(m => (
                  <TableRow key={m.model} className={`border-border ${m.model === selectedModel ? "bg-primary/5" : ""}`}>
                    <TableCell className="font-medium">
                      {m.model}
                      {m.model === "XGBoost" && <Badge className="ml-2 bg-primary text-xs">Best</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{(m.accuracy * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{(m.precision * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{(m.recall * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{(m.f1 * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-semibold">{m.auc.toFixed(3)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{m.crossValMean.toFixed(3)} ± {m.crossValStd.toFixed(3)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Curves */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-base">ROC Curves</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={rocData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 16%)" />
                  <XAxis dataKey="fpr" label={{ value: "FPR", position: "bottom", fill: "hsl(215, 20%, 55%)", fontSize: 11 }} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                  <YAxis label={{ value: "TPR", angle: -90, position: "insideLeft", fill: "hsl(215, 20%, 55%)", fontSize: 11 }} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  {/* Diagonal */}
                  <Line dataKey="fpr" stroke="hsl(220, 20%, 25%)" strokeDasharray="5 5" dot={false} name="Random" />
                  {Object.keys(modelColors).map(model => (
                    <Line key={model} dataKey={model} stroke={modelColors[model]} dot={false} strokeWidth={model === selectedModel ? 3 : 1.5} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Confusion Matrix */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-base">Confusion Matrix — {selectedModel}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {cmData.map(c => (
                  <div key={c.label} className="rounded-lg p-4 text-center" style={{ backgroundColor: c.color + "22", borderColor: c.color, borderWidth: 1 }}>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: c.color }}>{c.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Threshold Optimization */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base">Threshold Optimization</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-28">Threshold: {currentThreshold.threshold.toFixed(2)}</span>
              <Slider value={thresholdIdx} onValueChange={setThresholdIdx} min={0} max={20} step={1} className="flex-1" />
            </div>
            <div className="flex gap-6 text-sm">
              <span>Precision: <strong>{(currentThreshold.precision * 100).toFixed(1)}%</strong></span>
              <span>Recall: <strong>{(currentThreshold.recall * 100).toFixed(1)}%</strong></span>
              <span>F1: <strong>{(currentThreshold.f1 * 100).toFixed(1)}%</strong></span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={thresholdData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 16%)" />
                <XAxis dataKey="threshold" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line dataKey="precision" stroke="hsl(217, 91%, 60%)" dot={false} strokeWidth={2} />
                <Line dataKey="recall" stroke="hsl(152, 69%, 45%)" dot={false} strokeWidth={2} />
                <Line dataKey="f1" stroke="hsl(38, 92%, 50%)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
