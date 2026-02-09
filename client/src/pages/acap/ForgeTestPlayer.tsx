import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, Clock, ChevronLeft, ChevronRight, Flag, Send, AlertTriangle, CheckCircle, Shield, ArrowLeft } from "lucide-react";

type Phase = "access" | "info" | "test" | "review" | "reflection" | "results";

interface AssessmentInfo {
  forgeAssessmentId: number;
  versionId: number;
  title: string;
  timeLimitMinutes: number;
  itemCount: number;
  versionLabel: string;
  items: TestItem[];
}

interface TestItem {
  id: number;
  stem: string;
  options: { label: string; text: string }[];
}

interface AttemptResult {
  attemptId: number;
}

interface SubmitResult {
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  integrityStatus: string;
  integrityReasons: string[];
}

export default function ForgeTestPlayer() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("access");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [assessmentInfo, setAssessmentInfo] = useState<AssessmentInfo | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [scholarId, setScholarId] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [reflection, setReflection] = useState("");
  const [confirmIntegrity, setConfirmIntegrity] = useState(false);
  const [results, setResults] = useState<SubmitResult | null>(null);

  const lastAnswerTime = useRef<number>(0);
  const itemStartTime = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("studentData");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setScholarId(parsed.id?.toString() || "");
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (phase !== "test" || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, timeLeft > 0]);

  const logEvent = useCallback(async (eventType: string) => {
    if (!attemptId || !scholarId) return;
    try {
      await fetch(`/api/acap/forge/test/attempts/${attemptId}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scholarId, eventType }),
      });
    } catch {}
  }, [attemptId, scholarId]);

  useEffect(() => {
    if (phase !== "test" || !attemptId) return;

    const handleVisibility = () => {
      if (document.hidden) {
        logEvent("tab_blur");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [phase, attemptId, logEvent]);

  const handleAutoSubmit = useCallback(async () => {
    if (!attemptId || !scholarId) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    try {
      const res = await fetch(`/api/acap/forge/test/attempts/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scholarId,
          reflection: "Time expired - auto submitted",
          timeSpentSeconds: elapsed,
        }),
      });
      const data = await res.json();
      setResults(data);
      setPhase("results");
    } catch {
      toast({ title: "Error", description: "Failed to auto-submit test", variant: "destructive" });
    }
  }, [attemptId, scholarId, startTime, toast]);

  const handleAccessSubmit = async () => {
    if (accessCode.length !== 6) {
      toast({ title: "Invalid Code", description: "Please enter a 6-character access code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/acap/forge/test/access/${accessCode}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Invalid access code" }));
        throw new Error(err.error || "Invalid access code");
      }
      const data = await res.json();
      setAssessmentInfo(data);
      setPhase("info");
    } catch (err: any) {
      toast({ title: "Access Denied", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBeginTest = async () => {
    if (!assessmentInfo || !scholarId) {
      toast({ title: "Error", description: "Student data not found. Please log in again.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/acap/forge/test/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scholarId,
          forgeAssessmentId: assessmentInfo.forgeAssessmentId,
          versionId: assessmentInfo.versionId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to start test" }));
        throw new Error(err.error || "Failed to start test");
      }
      const data: AttemptResult = await res.json();
      setAttemptId(data.attemptId);
      setTimeLeft(assessmentInfo.timeLimitMinutes * 60);
      setStartTime(Date.now());
      itemStartTime.current = Date.now();
      setPhase("test");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveAnswer = useCallback(async (itemId: number, selectedOption: string, idx: number) => {
    if (!attemptId || !scholarId) return;
    const timeSpent = Math.floor((Date.now() - itemStartTime.current) / 1000);
    try {
      await fetch(`/api/acap/forge/test/attempts/${attemptId}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          selectedOption,
          scholarId,
          timeSpent,
          itemIndex: idx,
        }),
      });
    } catch {}
  }, [attemptId, scholarId]);

  const handleSelectOption = (option: string) => {
    if (!assessmentInfo) return;
    const item = assessmentInfo.items[currentIndex];
    if (!item) return;

    const now = Date.now();
    if (lastAnswerTime.current > 0 && (now - lastAnswerTime.current) < 3000) {
      logEvent("fast_response");
    }
    lastAnswerTime.current = now;

    setAnswers((prev) => ({ ...prev, [item.id]: option }));
    saveAnswer(item.id, option, currentIndex);
  };

  const toggleFlag = () => {
    if (!assessmentInfo) return;
    const item = assessmentInfo.items[currentIndex];
    if (!item) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  const goToQuestion = (idx: number) => {
    setCurrentIndex(idx);
    itemStartTime.current = Date.now();
    if (phase === "review") setPhase("test");
  };

  const handleNext = () => {
    if (!assessmentInfo) return;
    if (currentIndex < assessmentInfo.items.length - 1) {
      setCurrentIndex((i) => i + 1);
      itemStartTime.current = Date.now();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      itemStartTime.current = Date.now();
    }
  };

  const handleSubmitTest = async () => {
    if (!reflection.trim() || !confirmIntegrity) {
      toast({ title: "Required", description: "Please complete the reflection and confirmation", variant: "destructive" });
      return;
    }
    if (!attemptId || !scholarId) return;
    setLoading(true);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    try {
      const res = await fetch(`/api/acap/forge/test/attempts/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scholarId,
          reflection,
          timeSpentSeconds: elapsed,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to submit" }));
        throw new Error(err.error || "Failed to submit test");
      }
      const data = await res.json();
      setResults(data);
      setPhase("results");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getIntegrityColor = (status: string) => {
    if (status === "clean" || status === "green") return "bg-green-100 text-green-800 border-green-300";
    if (status === "warning" || status === "yellow") return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getIntegrityIcon = (status: string) => {
    if (status === "clean" || status === "green") return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === "warning" || status === "yellow") return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  if (phase === "access") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">EduCAP Forge™ Assessment</CardTitle>
            <p className="text-gray-500 text-sm">Enter your 6-character access code to begin</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Enter access code"
              className="text-center text-2xl tracking-[0.3em] font-mono uppercase h-14"
              maxLength={6}
              onKeyDown={(e) => e.key === "Enter" && handleAccessSubmit()}
            />
            <Button
              onClick={handleAccessSubmit}
              disabled={loading || accessCode.length !== 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base"
            >
              {loading ? "Verifying..." : "Enter Assessment"}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-gray-500"
              onClick={() => setLocation("/student-dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "info" && assessmentInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">{assessmentInfo.title}</CardTitle>
            <Badge variant="secondary" className="mx-auto">{assessmentInfo.versionLabel}</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-700">{assessmentInfo.timeLimitMinutes}</p>
                <p className="text-xs text-blue-500">Minutes</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <Shield className="h-6 w-6 text-indigo-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-indigo-700">{assessmentInfo.itemCount}</p>
                <p className="text-xs text-indigo-500">Questions</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <p className="font-semibold text-amber-800">Important Instructions</p>
              </div>
              <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                <li>Do not leave this tab during the test</li>
                <li>All tab switches are recorded</li>
                <li>Answer each question carefully</li>
                <li>You must submit a reflection before finishing</li>
              </ul>
            </div>
            <Button
              onClick={handleBeginTest}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base gap-2"
            >
              {loading ? "Starting..." : "Begin Test"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "test" && assessmentInfo) {
    const item = assessmentInfo.items[currentIndex];
    const totalItems = assessmentInfo.items.length;
    const answeredCount = Object.keys(answers).length;
    const isTimeLow = timeLeft < 120;
    const optionLabels = ["A", "B", "C", "D"];

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-gradient-to-r from-slate-800 to-indigo-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-indigo-300" />
            <span className="font-semibold text-lg">{assessmentInfo.title}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-300">Question</span>
              <span className="font-bold">{currentIndex + 1} / {totalItems}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-300">Answered</span>
              <span className="font-bold">{answeredCount} / {totalItems}</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isTimeLow ? "bg-red-600/80 animate-pulse" : "bg-white/10"}`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col gap-6">
          {item && (
            <>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-sm">
                  Question {currentIndex + 1}
                </Badge>
                <Button
                  variant={flagged.has(item.id) ? "default" : "outline"}
                  size="sm"
                  onClick={toggleFlag}
                  className={flagged.has(item.id) ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}
                >
                  <Flag className="h-4 w-4 mr-1" />
                  {flagged.has(item.id) ? "Flagged" : "Flag"}
                </Button>
              </div>

              <Card className="shadow-md">
                <CardContent className="pt-6">
                  <p className="text-lg text-gray-800 leading-relaxed">{item.stem}</p>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {(item.options || []).map((opt, i) => {
                  const label = opt.label || optionLabels[i] || String.fromCharCode(65 + i);
                  const isSelected = answers[item.id] === label;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectOption(label)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {label}
                      </div>
                      <span className={`text-base ${isSelected ? "text-indigo-900 font-medium" : "text-gray-700"}`}>
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex items-center justify-between mt-auto pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPhase("review")}
              className="gap-2"
            >
              Review All
            </Button>
            {currentIndex < totalItems - 1 ? (
              <Button onClick={handleNext} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => setPhase("review")} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                Review & Submit
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "review" && assessmentInfo) {
    const totalItems = assessmentInfo.items.length;
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = totalItems - answeredCount;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-gradient-to-r from-slate-800 to-indigo-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-indigo-300" />
            <span className="font-semibold text-lg">{assessmentInfo.title} - Review</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${timeLeft < 120 ? "bg-red-600/80 animate-pulse" : "bg-white/10"}`}>
            <Clock className="h-4 w-4" />
            <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-700">{answeredCount}</p>
              <p className="text-sm text-green-600">Answered</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-2xl font-bold text-red-700">{unansweredCount}</p>
              <p className="text-sm text-red-600">Unanswered</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-2xl font-bold text-yellow-700">{flagged.size}</p>
              <p className="text-sm text-yellow-600">Flagged</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {assessmentInfo.items.map((item, idx) => {
                  const isAnswered = !!answers[item.id];
                  const isFlagged = flagged.has(item.id);
                  let bg = "bg-red-100 border-red-300 text-red-700";
                  if (isFlagged) bg = "bg-yellow-100 border-yellow-300 text-yellow-700";
                  else if (isAnswered) bg = "bg-green-100 border-green-300 text-green-700";

                  return (
                    <button
                      key={item.id}
                      onClick={() => goToQuestion(idx)}
                      className={`w-full aspect-square rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all hover:scale-105 ${bg}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-400" /> Answered</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-400" /> Unanswered</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-400" /> Flagged</div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setPhase("test")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Test
            </Button>
            <Button
              onClick={() => setPhase("reflection")}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              Proceed to Submit
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "reflection") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <Send className="h-8 w-8 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Submit Assessment</CardTitle>
            <p className="text-gray-500 text-sm">Complete your reflection before submitting</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Reflect on your effort and integrity during this test
              </label>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Write your reflection here... How did you approach this assessment? Did you give your best effort?"
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                id="integrity"
                checked={confirmIntegrity}
                onCheckedChange={(checked) => setConfirmIntegrity(checked === true)}
              />
              <label htmlFor="integrity" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                I confirm I did my best work on this assessment and maintained academic integrity throughout.
              </label>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setPhase("review")} className="flex-1 gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Review
              </Button>
              <Button
                onClick={handleSubmitTest}
                disabled={loading || !reflection.trim() || !confirmIntegrity}
                className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? "Submitting..." : "Submit Test"}
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "results" && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Assessment Complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-6xl font-bold text-indigo-600">{results.scorePercent}%</p>
              <p className="text-gray-500 mt-1">
                {results.correctCount} of {results.totalCount} correct
              </p>
            </div>

            <div className={`flex items-center gap-3 p-4 rounded-lg border ${getIntegrityColor(results.integrityStatus)}`}>
              {getIntegrityIcon(results.integrityStatus)}
              <div>
                <p className="font-semibold capitalize">
                  Integrity: {results.integrityStatus === "clean" ? "Clean" : results.integrityStatus}
                </p>
                {results.integrityReasons && results.integrityReasons.length > 0 && (
                  <ul className="text-sm mt-1 space-y-0.5">
                    {results.integrityReasons.map((reason, i) => (
                      <li key={i}>- {reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <Button
              onClick={() => setLocation("/student-dashboard")}
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
