import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CheckCircle, XCircle, ArrowRight, RotateCcw, Download, AlertTriangle,
  ShieldCheck, Info, Brain, Clock, Target, TrendingUp, User, Phone,
  Zap, ChevronRight, AlertCircle
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { type ScoringInput, type ScoringResult, type RiskBand, computeScore } from "@/lib/scoringEngine";
import { generateSuggestions, type Suggestion } from "@/lib/suggestions";
import { generatePdfReport } from "@/lib/pdfReport";
import { useTranslation } from "react-i18next";
import {
  computeBehaviouralConfidence,
  type QuestionMetric,
  type ConfidenceResult,
} from "@/lib/behaviouralConfidence";
import {
  buildAdaptiveQuestions,
  computeRiskAdjustmentScore,
  ADAPTIVE_TRIGGER_THRESHOLD,
  type AdaptiveQuestion,
  type AdaptiveInput,
} from "@/lib/adaptiveQuestions";
import {
  saveApplication,
  detectReApplication,
  type ReApplicationFlag,
} from "@/lib/applicationStore";

// ─── Static Questions ────────────────────────────────────────────────────────

const questions = [
  { key: "monthlyIncomeRange", labelKey: "questions.monthlyIncomeRange", descKey: "questions.monthlyIncomeDesc", options: ["< ₹15,000", "₹15,000–30,000", "₹30,000–60,000", "₹60,000–1L", "₹1L+"] },
  { key: "employmentType", labelKey: "questions.employmentType", descKey: "questions.employmentDesc", options: ["Salaried", "Self-employed", "Freelancer", "Business owner"] },
  { key: "incomeDuration", labelKey: "questions.incomeDuration", descKey: "questions.incomeDurationDesc", options: ["< 6 months", "6–12 months", "1–3 years", "3+ years"] },
  { key: "totalMonthlyEMI", labelKey: "questions.totalMonthlyEMI", descKey: "questions.emiDesc", options: ["None", "< ₹5,000", "₹5,000–15,000", "₹15,000+"] },
  { key: "missedPayments", labelKey: "questions.missedPayments", descKey: "questions.missedDesc", options: ["Never", "1–2 times", "3+ times"] },
  { key: "billPaymentBehavior", labelKey: "questions.billPaymentBehavior", descKey: "questions.billDesc", options: ["Before due date", "On due date", "After due date"] },
  { key: "avgBankBalance", labelKey: "questions.avgBankBalance", descKey: "questions.balanceDesc", options: ["< ₹5,000", "₹5,000–20,000", "₹20,000–50,000", "₹50,000+"] },
  { key: "savingsHabit", labelKey: "questions.savingsHabit", descKey: "questions.savingsDesc", options: ["No", "Occasionally", "Yes (less than 20%)", "Yes (20%+)"] },
  { key: "incomeSources", labelKey: "questions.incomeSources", descKey: "questions.incomeSourcesDesc", options: ["1", "2", "3+"] },
  { key: "loanRejectionHistory", labelKey: "questions.loanRejectionHistory", descKey: "questions.rejectionDesc", options: ["No", "Yes (once)", "Yes (multiple times)"] },
] as const;

const riskBandConfig: Record<RiskBand, { color: string; bgColor: string; icon: typeof ShieldCheck; label: string; desc: string }> = {
  "Prime":      { color: "hsl(152, 69%, 45%)", bgColor: "bg-risk-low",    icon: ShieldCheck,   label: "riskBands.prime",    desc: "riskBands.primeDesc" },
  "Near Prime": { color: "hsl(217, 91%, 60%)", bgColor: "bg-primary",     icon: CheckCircle,   label: "riskBands.nearPrime", desc: "riskBands.nearPrimeDesc" },
  "Subprime":   { color: "hsl(38, 92%, 50%)",  bgColor: "bg-risk-medium", icon: AlertTriangle, label: "riskBands.subprime",  desc: "riskBands.subprimeDesc" },
  "High Risk":  { color: "hsl(0, 84%, 60%)",   bgColor: "bg-risk-high",   icon: XCircle,       label: "riskBands.highRisk", desc: "riskBands.highRiskDesc" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function RiskGauge({ score, riskBand }: { score: number; riskBand: RiskBand }) {
  const { t } = useTranslation();
  const pct = ((score - 300) / 550) * 100;
  const config = riskBandConfig[riskBand];
  const Icon = config.icon;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-44 h-44">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <motion.circle
            cx="60" cy="60" r="50" fill="none" stroke={config.color} strokeWidth="10"
            strokeLinecap="round"
            initial={{ strokeDasharray: "0 314" }}
            animate={{ strokeDasharray: `${pct * 3.14} 314` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted-foreground">/ 850</span>
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger>
          <Badge className={`${config.bgColor} ${riskBand === "Subprime" ? "text-black" : ""}`}>
            <Icon className="h-3 w-3 mr-1" />
            {t(config.label)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{t(config.desc)}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function ConfidenceGauge({ confidence }: { confidence: ConfidenceResult }) {
  const labelColor =
    confidence.label === "High Stability"
      ? "text-risk-low"
      : confidence.label === "Moderate Stability"
      ? "text-risk-medium"
      : "text-risk-high";
  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Decision Confidence Score
          <Tooltip>
            <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              Measures behavioural consistency: how stable were your choices and how natural was your response timing? Used as tie-breaker only — does NOT replace the credit score.
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <span className="text-5xl font-bold">{confidence.total}</span>
          <span className="text-muted-foreground text-lg mb-1">/ 100</span>
          <Badge variant="outline" className={`mb-1 ${labelColor}`}>{confidence.label}</Badge>
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><Target className="h-3 w-3" /> Interaction Stability</span>
              <span>{confidence.stabilityScore} / 50</span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <motion.div
                className="h-2 rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${(confidence.stabilityScore / 50) * 100}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Response Time Analysis</span>
              <span>{confidence.responseTimeScore} / 50</span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <motion.div
                className="h-2 rounded-full bg-teal"
                initial={{ width: 0 }}
                animate={{ width: `${(confidence.responseTimeScore / 50) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground italic border-l-2 border-primary/50 pl-3">
          Confidence score is supplementary intelligence — it acts as a tie-breaker when two borrowers share the same credit score.
        </p>
      </CardContent>
    </Card>
  );
}

function ReApplicationBanner({ flag }: { flag: ReApplicationFlag }) {
  const tagColor: Record<string, string> = {
    "Re-Apply Detected": "border-risk-high bg-risk-high/10 text-risk-high",
    "Duplicate Submission": "border-risk-high bg-risk-high/10 text-risk-high",
    "Optimisation Attempt": "border-risk-medium bg-risk-medium/10 text-risk-medium",
    "Frequent Re-Application": "border-risk-high bg-risk-high/10 text-risk-high",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 rounded-lg border p-4 ${tagColor[flag.tag]}`}
    >
      <AlertCircle className="h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold text-sm">⚠ {flag.tag}</p>
        <p className="text-xs opacity-80">{flag.reason} — {flag.submissionCount} submission{flag.submissionCount > 1 ? "s" : ""} detected.</p>
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

type Phase =
  | "questions"       // core 10 questions
  | "age"             // age input
  | "identity"        // name + phone
  | "adaptive"        // adaptive refinement questions
  | "results";        // final results

export default function ScoreBorrower() {
  const { t } = useTranslation();

  // Core form state
  const [phase, setPhase] = useState<Phase>("questions");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [age, setAge] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Results state
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [confidence, setConfidence] = useState<ConfidenceResult | null>(null);
  const [reAppFlag, setReAppFlag] = useState<ReApplicationFlag | null>(null);

  // Adaptive questions state
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<AdaptiveQuestion[]>([]);
  const [adaptiveStep, setAdaptiveStep] = useState(0);
  const [adaptiveAnswers, setAdaptiveAnswers] = useState<Record<string, string>>({});
  const [riskAdjustmentScore, setRiskAdjustmentScore] = useState<number | null>(null);

  // Behavioural tracking
  const questionStartTime = useRef<number>(Date.now());
  const metrics = useRef<QuestionMetric[]>([]);
  const changeCountRef = useRef<number>(0);

  // Reset timer when step changes
  useEffect(() => {
    questionStartTime.current = Date.now();
    changeCountRef.current = 0;
  }, [step]);

  const recordMetric = useCallback((questionIndex: number) => {
    const elapsed = Date.now() - questionStartTime.current;
    metrics.current.push({
      questionIndex,
      changeCount: changeCountRef.current,
      timeSpentMs: elapsed,
    });
  }, []);

  const handleSelect = (value: string) => {
    const key = questions[step].key;
    const prev = answers[key];
    if (prev && prev !== value) changeCountRef.current += 1;
    setAnswers(prev => ({ ...prev, [key]: value }));

    setTimeout(() => {
      recordMetric(step);
      if (step < questions.length - 1) {
        setStep(s => s + 1);
      } else {
        setPhase("age");
      }
    }, 300);
  };

  const handleAgeSubmit = () => {
    if (!age || isNaN(Number(age)) || Number(age) < 18 || Number(age) > 100) return;
    setPhase("identity");
  };

  const handleIdentitySubmit = () => {
    if (!name.trim()) return;

    const input: ScoringInput = {
      monthlyIncomeRange: answers.monthlyIncomeRange ?? "",
      employmentType: answers.employmentType ?? "",
      incomeDuration: answers.incomeDuration ?? "",
      totalMonthlyEMI: answers.totalMonthlyEMI ?? "",
      missedPayments: answers.missedPayments ?? "",
      billPaymentBehavior: answers.billPaymentBehavior ?? "",
      avgBankBalance: answers.avgBankBalance ?? "",
      savingsHabit: answers.savingsHabit ?? "",
      incomeSources: answers.incomeSources ?? "",
      loanRejectionHistory: answers.loanRejectionHistory ?? "",
      age: Number(age),
    };

    const res = computeScore(input);
    const sug = generateSuggestions(input, res);
    const conf = computeBehaviouralConfidence(metrics.current);
    const reApp = detectReApplication(phone, answers);

    setResult(res);
    setSuggestions(sug);
    setConfidence(conf);
    setReAppFlag(reApp);

    // Check if adaptive questions should be triggered
    if (res.creditScore <= ADAPTIVE_TRIGGER_THRESHOLD) {
      const aq = buildAdaptiveQuestions(input, res);
      setAdaptiveQuestions(aq);
      setAdaptiveStep(0);
      setPhase("adaptive");
    } else {
      // Save application record
      saveApplication({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        phone,
        ip: "",
        name,
        answers,
        age,
        creditScore: res.creditScore,
        riskBand: res.riskBand,
        recommendation: res.recommendation,
        confidenceScore: conf.total,
        interactionStability: conf.stabilityScore,
        responseTimeScore: conf.responseTimeScore,
        adaptiveTriggered: false,
      });
      setPhase("results");
    }
  };

  const handleAdaptiveSelect = (value: string) => {
    const key = adaptiveQuestions[adaptiveStep].key;
    setAdaptiveAnswers(prev => ({ ...prev, [key]: value }));

    setTimeout(() => {
      if (adaptiveStep < adaptiveQuestions.length - 1) {
        setAdaptiveStep(s => s + 1);
      } else {
        // All adaptive answers collected — compute risk adjustment
        if (result) {
          const adjusted = computeRiskAdjustmentScore(
            { ...adaptiveAnswers, [key]: value } as Partial<AdaptiveInput>,
            result.creditScore
          );
          setRiskAdjustmentScore(adjusted);

          const conf = confidence ?? { total: 70, stabilityScore: 35, responseTimeScore: 35, label: "Moderate Stability" as const };

          saveApplication({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            phone,
            ip: "",
            name,
            answers,
            age,
            creditScore: result.creditScore,
            riskBand: result.riskBand,
            recommendation: result.recommendation,
            confidenceScore: conf.total,
            interactionStability: conf.stabilityScore,
            responseTimeScore: conf.responseTimeScore,
            adaptiveTriggered: true,
            riskAdjustmentScore: adjusted,
          });
        }
        setPhase("results");
      }
    }, 300);
  };

  const handleReset = () => {
    setPhase("questions");
    setStep(0);
    setAnswers({});
    setAge("");
    setName("");
    setPhone("");
    setResult(null);
    setSuggestions([]);
    setConfidence(null);
    setReAppFlag(null);
    setAdaptiveQuestions([]);
    setAdaptiveStep(0);
    setAdaptiveAnswers({});
    setRiskAdjustmentScore(null);
    metrics.current = [];
  };

  const handleDownloadPdf = () => {
    if (result) generatePdfReport(result, answers, age, suggestions);
  };

  // ── Progress computation
  const totalSteps = questions.length + 1; // questions + age
  const currentProgressStep =
    phase === "questions" ? step
    : phase === "age" ? questions.length
    : phase === "identity" ? questions.length + 1
    : totalSteps + 1;
  const progressPct = Math.min(100, (currentProgressStep / totalSteps) * 100);

  const shapData = result?.shapValues.map(s => ({
    feature: s.feature,
    value: s.value,
    fill: s.value > 0 ? "hsl(0, 84%, 60%)" : "hsl(152, 69%, 45%)",
  })) ?? [];

  // ─── Adaptive phase score display
  const displayScore = riskAdjustmentScore ?? result?.creditScore ?? 0;
  const scoreChanged = riskAdjustmentScore !== null && result !== null && riskAdjustmentScore !== result.creditScore;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("score.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Multi-Layer Intelligent Credit Decision Engine — {totalSteps} core questions
        </p>
      </div>

      {/* Progress bar */}
      {phase !== "results" && (
        <>
          <div className="w-full bg-secondary rounded-full h-2">
            <motion.div
              className="h-2 rounded-full gradient-electric"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {phase === "questions" && `Question ${step + 1} of ${questions.length}`}
            {phase === "age" && "Final Step: Age Verification"}
            {phase === "identity" && "Identity & Contact Details"}
            {phase === "adaptive" && `🔄 Adaptive Refinement — Question ${adaptiveStep + 1} of ${adaptiveQuestions.length}`}
          </p>
        </>
      )}

      {/* ── PHASE: Core Questions ── */}
      <AnimatePresence mode="wait">
        {phase === "questions" && (
          <motion.div
            key={`q-${step}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">{t(questions[step].labelKey)}</CardTitle>
                <p className="text-sm text-muted-foreground">{t(questions[step].descKey)}</p>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers[questions[step].key] ?? ""}
                  onValueChange={handleSelect}
                  className="space-y-3"
                >
                  {questions[step].options.map(opt => (
                    <label
                      key={opt}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/60 hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      <RadioGroupItem value={opt} />
                      <span className="text-sm font-medium">{opt}</span>
                    </label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── PHASE: Age ── */}
        {phase === "age" && (
          <motion.div
            key="age"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">{t("questions.ageLabel")}</CardTitle>
                <p className="text-sm text-muted-foreground">{t("questions.ageDesc")}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label htmlFor="age">{t("common.age")} (18–100)</Label>
                    <Input
                      id="age"
                      type="number"
                      min={18}
                      max={100}
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      placeholder="e.g. 28"
                      className="bg-secondary border-border mt-1"
                      onKeyDown={e => e.key === "Enter" && handleAgeSubmit()}
                    />
                  </div>
                  <Button onClick={handleAgeSubmit} className="gradient-electric text-primary-foreground">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── PHASE: Identity ── */}
        {phase === "identity" && (
          <motion.div
            key="identity"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Applicant Details
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Used for re-application detection and personalised reporting. Phone is optional.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone Number (optional — for duplicate detection)
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <Button
                  onClick={handleIdentitySubmit}
                  disabled={!name.trim()}
                  className="gradient-electric text-primary-foreground w-full"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Calculate Credit Score
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── PHASE: Adaptive Questions ── */}
        {phase === "adaptive" && adaptiveQuestions.length > 0 && (
          <motion.div
            key={`adaptive-${adaptiveStep}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            {adaptiveStep === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-risk-medium/50 bg-risk-medium/10 p-4 mb-4 flex items-start gap-3"
              >
                <AlertTriangle className="h-5 w-5 text-risk-medium shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-risk-medium">Low Score Recovery Flow Activated</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your credit score ({result?.creditScore}) is near the review threshold. Answer a few more questions to help our system make a fairer assessment. Your score may improve.
                  </p>
                </div>
              </motion.div>
            )}
            <Card className="glass-card border-primary/30 border-2">
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-primary border-primary text-xs">
                    Adaptive Refinement {adaptiveStep + 1}/{adaptiveQuestions.length}
                  </Badge>
                  {adaptiveQuestions[adaptiveStep].type === "agree_disagree" && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Behavioural Signal
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{adaptiveQuestions[adaptiveStep].label}</CardTitle>
                <p className="text-xs text-muted-foreground italic">{adaptiveQuestions[adaptiveStep].reason}</p>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={adaptiveAnswers[adaptiveQuestions[adaptiveStep].key] ?? ""}
                  onValueChange={handleAdaptiveSelect}
                  className="space-y-3"
                >
                  {adaptiveQuestions[adaptiveStep].options.map(opt => (
                    <label
                      key={opt}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/60 hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      <RadioGroupItem value={opt} />
                      <span className="text-sm font-medium">{opt}</span>
                    </label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PHASE: Results ── */}
      {phase === "results" && result && confidence && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Re-application banner */}
          {reAppFlag && <ReApplicationBanner flag={reAppFlag} />}

          {/* Adaptive score improvement notice */}
          {scoreChanged && riskAdjustmentScore !== null && result && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-risk-low/60 bg-risk-low/10 p-4 flex items-start gap-3"
            >
              <TrendingUp className="h-5 w-5 text-risk-low shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-risk-low">Adaptive Refinement Applied ✓</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your Risk Adjustment Score: <strong>{result.creditScore}</strong> → <strong>{riskAdjustmentScore}</strong>
                  {riskAdjustmentScore > result.creditScore
                    ? ` (+${riskAdjustmentScore - result.creditScore} pts improvement)`
                    : ` (${riskAdjustmentScore - result.creditScore} pts)`}
                  . Additional financial context was factored into the final assessment.
                </p>
              </div>
            </motion.div>
          )}

          <div className="flex justify-between items-center">
            <div>
              {name && <p className="text-sm text-muted-foreground">Applicant: <span className="font-medium text-foreground">{name}</span></p>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadPdf} size="sm">
                <Download className="mr-2 h-4 w-4" /> {t("score.downloadPdf")}
              </Button>
              <Button variant="outline" onClick={handleReset} size="sm">
                <RotateCcw className="mr-2 h-4 w-4" /> {t("common.reset")}
              </Button>
            </div>
          </div>

          {/* Top row: Score + Metrics + SHAP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Card */}
            <Card className="glass-card border-border/50">
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <RiskGauge score={displayScore} riskBand={result.riskBand} />
                <div className="flex items-center gap-2 mt-2">
                  {(result.recommendation === "Strong Approve" || result.recommendation === "Approve") ? (
                    <CheckCircle className="h-5 w-5 text-risk-low" />
                  ) : result.recommendation === "Review" ? (
                    <AlertTriangle className="h-5 w-5 text-risk-medium" />
                  ) : (
                    <XCircle className="h-5 w-5 text-risk-high" />
                  )}
                  <span className="font-semibold">{result.recommendation}</span>
                  <span className="text-sm text-muted-foreground">({(result.confidence * 100).toFixed(0)}%)</span>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-base">{t("common.keyMetrics")}</CardTitle></CardHeader>
              <CardContent className="space-y-2.5">
                {[
                  [t("common.creditScore"), displayScore],
                  ...(scoreChanged && result ? [[`Base Score`, result.creditScore]] : []),
                  [t("common.riskBand"), result.riskBand],
                  [t("common.defaultProb"), `${(result.predictionProbability * 100).toFixed(1)}%`],
                  [t("common.dti"), `${(result.debtToIncomeRatio * 100).toFixed(0)}%`],
                  [t("common.confidence"), `${(result.confidence * 100).toFixed(0)}%`],
                  ["Behavioural Confidence", `${confidence.total}/100 (${confidence.label})`],
                  ["Expected Value", result.expectedValue],
                  [t("common.monthlyIncome"), answers.monthlyIncomeRange],
                  [t("common.employment"), answers.employmentType],
                  [t("common.age"), age],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* SHAP */}
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-base">{t("common.featureImpact")}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={shapData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis type="category" dataKey="feature" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} width={120} />
                    <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {shapData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Confidence Score */}
          <ConfidenceGauge confidence={confidence} />

          {/* Risk Band Distribution */}
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Risk Band Distribution
                <Tooltip>
                  <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Prime (750+): Very Low Risk → Strong Approve. Near Prime (650-749): Low Risk → Approve. Subprime (550-649): Moderate Risk → Review. High Risk (&lt;550): High Default → Reject.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {(Object.entries(riskBandConfig) as [RiskBand, typeof riskBandConfig.Prime][]).map(([band, config]) => {
                  const isActive = result.riskBand === band;
                  const Icon = config.icon;
                  return (
                    <Tooltip key={band}>
                      <TooltipTrigger asChild>
                        <div className={`rounded-xl p-4 text-center border-2 transition-all cursor-default ${
                          isActive ? "border-primary scale-105 shadow-lg" : "border-border/30 opacity-60"
                        }`} style={{ backgroundColor: isActive ? config.color + "22" : undefined }}>
                          <Icon className="h-6 w-6 mx-auto mb-2" style={{ color: config.color }} />
                          <p className="text-sm font-semibold">{t(config.label)}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {band === "Prime" ? "750+" : band === "Near Prime" ? "650-749" : band === "Subprime" ? "550-649" : "<550"}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{t(config.desc)}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Adaptive Details */}
          {Object.keys(adaptiveAnswers).length > 0 && (
            <Card className="glass-card border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  Adaptive Refinement Responses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {adaptiveQuestions.map(aq => (
                    adaptiveAnswers[aq.key] && (
                      <div key={aq.key} className="flex justify-between text-sm p-2 rounded-lg bg-secondary/30 border border-border/30">
                        <span className="text-muted-foreground text-xs">{aq.label.replace(/"/g, "")}</span>
                        <span className="font-medium text-xs ml-2">{adaptiveAnswers[aq.key]}</span>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Credit Improvement Suggestions */}
          {suggestions.length > 0 && (
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-base">{t("score.suggestions")}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-lg p-4 border border-border/50 bg-secondary/30"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium text-sm">{s.title}</p>
                        <Badge variant="outline" className={`text-xs shrink-0 ${
                          s.impact === "High" ? "border-risk-high text-risk-high" :
                          s.impact === "Medium" ? "border-risk-medium text-risk-medium" :
                          "border-risk-low text-risk-low"
                        }`}>
                          {s.impact}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feature Breakdown */}
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-base">{t("common.yourAnswers")}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.featureScores.map(fs => (
                  <div key={fs.feature} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/30">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{fs.feature}</p>
                      <p className="text-sm font-medium">
                        {fs.feature === "Age" ? age : answers[questions.find(q => {
                          const featureMap: Record<string, string> = {
                            "monthlyIncomeRange": "Monthly Income",
                            "employmentType": "Employment Type",
                            "incomeDuration": "Income Duration",
                            "totalMonthlyEMI": "Monthly EMI",
                            "missedPayments": "Missed Payments",
                            "billPaymentBehavior": "Bill Payment Behavior",
                            "avgBankBalance": "Avg Bank Balance",
                            "savingsHabit": "Savings Habit",
                            "incomeSources": "Income Sources",
                            "loanRejectionHistory": "Loan Rejection History",
                          };
                          return featureMap[q.key] === fs.feature;
                        })?.key ?? ""] ?? ""}
                      </p>
                    </div>
                    <div className="w-16">
                      <div className="h-2 rounded-full bg-border">
                        <motion.div
                          className="h-2 rounded-full"
                          style={{ backgroundColor: fs.score >= 70 ? "hsl(152, 69%, 45%)" : fs.score >= 40 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${fs.score}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-right mt-0.5">{fs.score}/100</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
