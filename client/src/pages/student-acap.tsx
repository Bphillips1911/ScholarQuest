import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, BookOpen, Target, BarChart3, Brain, Trophy,
  Loader2, CheckCircle, Clock, AlertTriangle, TrendingUp,
  Send, Star, Play, MessageCircle, Sparkles, ChevronRight, Award
} from "lucide-react";
import StudentRankGoalsPanel from "@/components/acap/student/StudentRankGoalsPanel";
import AccessCodeEntry from "@/components/acap/student/AccessCodeEntry";
import { useAcapWebSocket } from "@/hooks/useAcapWebSocket";
import { PRODUCT_NAME_PLAIN, TAGLINE } from "@/lib/educapBrand";

type Tab = "mastery" | "assessments" | "bootcamp" | "reports" | "rank-goals";

export default function StudentAcap() {
  useAcapWebSocket();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("mastery");
  const studentDataRaw = localStorage.getItem("studentData");
  const studentDataParsed = studentDataRaw ? (() => { try { return JSON.parse(studentDataRaw); } catch { return null; } })() : null;
  const scholarId = localStorage.getItem("studentId") || studentDataParsed?.id || "";
  const scholarName = localStorage.getItem("studentName") || studentDataParsed?.name || (studentDataParsed?.firstName ? `${studentDataParsed.firstName} ${studentDataParsed.lastName || ""}`.trim() : "Scholar");

  const tabs = [
    { id: "mastery" as Tab, label: "Mastery Map", icon: Target },
    { id: "assessments" as Tab, label: "Assessments", icon: BookOpen },
    { id: "bootcamp" as Tab, label: "Boot Camp", icon: Brain },
    { id: "reports" as Tab, label: "My Growth", icon: TrendingUp },
    { id: "rank-goals" as Tab, label: "Rank & Goals", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => setLocation("/student-dashboard")}>
              <ArrowLeft className="h-5 w-5 mr-1" /> Back
            </Button>
            <img src="/branding/educap-logo.png" alt="EduCAP Logo" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-bold">{PRODUCT_NAME_PLAIN}</h1>
              <p className="text-blue-200 text-sm italic">{TAGLINE}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-300" />
            <span className="text-sm">{scholarName}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-2">
        <div className="flex gap-1 bg-white rounded-lg shadow-sm p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "mastery" && <MasteryTab scholarId={scholarId} />}
        {activeTab === "assessments" && <AssessmentsTab scholarId={scholarId} />}
        {activeTab === "bootcamp" && <BootCampTab scholarId={scholarId} scholarName={scholarName} />}
        {activeTab === "reports" && <GrowthTab scholarId={scholarId} />}
        {activeTab === "rank-goals" && <StudentRankGoalsPanel />}
      </div>
    </div>
  );
}

function MasteryTab({ scholarId }: { scholarId: string }) {
  const { data: mastery, isLoading } = useQuery({
    queryKey: ["/api/acap/mastery", scholarId],
    queryFn: () => fetch(`/api/acap/mastery/${scholarId}`).then((r) => r.json()),
    enabled: !!scholarId,
  });

  const { data: standards } = useQuery({ queryKey: ["/api/acap/standards"] });

  const { data: stats } = useQuery({
    queryKey: ["/api/acap/dashboard/scholar", scholarId],
    queryFn: () => fetch(`/api/acap/dashboard/scholar/${scholarId}`).then((r) => r.json()),
    enabled: !!scholarId,
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;

  const masteryMap = new Map((mastery as any[])?.map((m: any) => [m.standardId, m]) || []);
  const levelColors: Record<string, string> = {
    mastered: "bg-green-500",
    proficient: "bg-blue-500",
    developing: "bg-amber-500",
    beginning: "bg-red-500",
    not_started: "bg-gray-300",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold">{stats?.masteryProgress || 0}%</p>
              <p className="text-blue-200 text-sm">Overall Mastery</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold">{stats?.completedAttempts || 0}</p>
              <p className="text-green-200 text-sm">Assessments Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold">{Math.round(stats?.averageScore || 0)}%</p>
              <p className="text-purple-200 text-sm">Average Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-blue-500" /> Standards Mastery Map</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4 text-xs">
            {Object.entries(levelColors).map(([level, color]) => (
              <div key={level} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="capitalize">{level.replace("_", " ")}</span>
              </div>
            ))}
          </div>
          {(standards as any[])?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(standards as any[]).map((s: any) => {
                const m = masteryMap.get(s.id);
                const level = m?.masteryLevel || "not_started";
                const score = m?.currentScore || 0;
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-4 h-4 rounded-full ${levelColors[level] || "bg-gray-300"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-indigo-600">{s.code}</p>
                      <p className="text-xs text-gray-600 truncate">{s.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{score}%</p>
                      <p className="text-xs text-gray-400 capitalize">{level.replace("_", " ")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No standards loaded yet. Master the Standards. Earn the Growth.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AssessmentsTab({ scholarId }: { scholarId: string }) {
  const { toast } = useToast();
  const [activeAttempt, setActiveAttempt] = useState<any>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showCodeEntry, setShowCodeEntry] = useState(false);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["/api/acap/assignments/scholar", scholarId],
    queryFn: () => fetch(`/api/acap/assignments/scholar/${scholarId}`).then((r) => r.json()),
    enabled: !!scholarId,
  });

  const startMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/acap/attempts", data),
    onSuccess: async (response) => {
      const attempt = await response.json();
      const assessmentData = await fetch(`/api/acap/assessments/${attempt.assessmentId}`).then((r) => r.json());
      setActiveAttempt({ ...attempt, assessment: assessmentData });
      setCurrentItemIndex(0);
    },
  });

  const respondMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/acap/attempts/${activeAttempt.id}/respond`, data),
    onSuccess: async (response) => {
      const result = await response.json();
      setFeedback(result.feedback);
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/acap/attempts/${activeAttempt.id}/complete`, {}),
    onSuccess: () => {
      toast({ title: "Assessment completed! Great work!" });
      setActiveAttempt(null);
      queryClient.invalidateQueries({ queryKey: ["/api/acap/assignments/scholar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/acap/mastery"] });
    },
  });

  const handleSubmitAnswer = () => {
    const items = activeAttempt?.assessment?.items || [];
    const currentItem = items[currentItemIndex];
    if (!currentItem) return;

    const answer = currentItem.itemType === "constructed_response" || currentItem.itemType === "evidence_based"
      ? { text: textAnswer } : selectedAnswer;

    respondMutation.mutate({
      itemId: currentItem.id, response: answer,
      sequenceNumber: currentItemIndex + 1, timeSpentSeconds: 30,
    });
  };

  const handleNextItem = () => {
    const items = activeAttempt?.assessment?.items || [];
    if (currentItemIndex < items.length - 1) {
      setCurrentItemIndex((i) => i + 1);
      setSelectedAnswer(null);
      setTextAnswer("");
      setFeedback(null);
    } else {
      completeMutation.mutate();
    }
  };

  if (activeAttempt) {
    const items = activeAttempt.assessment?.items || [];
    const currentItem = items[currentItemIndex];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{activeAttempt.assessment?.title}</h2>
          <span className="text-sm text-gray-500">Question {currentItemIndex + 1} of {items.length}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${((currentItemIndex + 1) / items.length) * 100}%` }} />
        </div>

        {currentItem ? (
          <Card className="border-blue-200">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">DOK {currentItem.dokLevel}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{currentItem.itemType.replace("_", " ")}</span>
              </div>
              <p className="text-lg font-medium text-gray-800">{currentItem.stem}</p>

              {(currentItem.itemType === "multiple_choice" || currentItem.itemType === "multi_select") && currentItem.options && (
                <div className="space-y-2">
                  {(currentItem.options as any[]).map((opt: any) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        if (currentItem.itemType === "multi_select") {
                          const current = selectedAnswer || [];
                          setSelectedAnswer(
                            current.includes(opt.key)
                              ? current.filter((k: string) => k !== opt.key)
                              : [...current, opt.key]
                          );
                        } else {
                          setSelectedAnswer(opt.key);
                        }
                      }}
                      disabled={!!feedback}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        (Array.isArray(selectedAnswer) ? selectedAnswer.includes(opt.key) : selectedAnswer === opt.key)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      } ${feedback ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span className="font-bold text-blue-600 mr-2">{opt.key}.</span>
                      {opt.text}
                    </button>
                  ))}
                </div>
              )}

              {(currentItem.itemType === "constructed_response" || currentItem.itemType === "evidence_based") && (
                <Textarea
                  placeholder="Type your answer here..."
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  rows={5}
                  disabled={!!feedback}
                />
              )}

              {feedback && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">{feedback}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                {!feedback ? (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={(!selectedAnswer && !textAnswer) || respondMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {respondMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Submit Answer
                  </Button>
                ) : (
                  <Button onClick={handleNextItem} className="bg-green-600 hover:bg-green-700" disabled={completeMutation.isPending}>
                    {completeMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                    {currentItemIndex < items.length - 1 ? "Next Question" : "Complete Assessment"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <p>No items available.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">My Assessments</h2>
      {showCodeEntry && (
        <div className="mb-4">
          <AccessCodeEntry onValidCode={(data) => {
            setShowCodeEntry(false);
            toast({ title: "Access Granted", description: `Starting ${data.accessCode.window.toLowerCase()} assessment.` });
            startMutation.mutate({ assessmentId: data.accessCode.assessmentId, scholarId });
          }} />
          <div className="flex justify-center mt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCodeEntry(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {!showCodeEntry && (
        <div className="mb-4 flex justify-end">
          <Button variant="outline" className="gap-2" onClick={() => setShowCodeEntry(true)}>
            <Target className="h-4 w-4" /> Enter Access Code
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
      ) : (assignments as any[])?.length > 0 ? (
        <div className="space-y-3">
          {(assignments as any[]).map((a: any) => {
            const hasCompleted = a.attempts?.some((t: any) => t.status === "completed");
            return (
              <Card key={a.id} className={`hover:shadow-md transition-shadow ${hasCompleted ? "border-green-200" : "border-blue-200"}`}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{a.assessment?.title || `Assessment #${a.assessmentId}`}</p>
                      <p className="text-sm text-gray-500">{a.assessment?.assessmentType} | {a.assessment?.subject}</p>
                      {a.dueDate && <p className="text-xs text-gray-400">Due: {new Date(a.dueDate).toLocaleDateString()}</p>}
                    </div>
                    {hasCompleted ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">
                          {Math.round(a.attempts.find((t: any) => t.status === "completed")?.percentCorrect || 0)}%
                        </span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => startMutation.mutate({ assessmentId: a.assessmentId, scholarId, assignmentId: a.id })}
                        disabled={startMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {startMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
                        Start
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed"><CardContent className="text-center py-8 text-gray-500">
          <BookOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          No assessments assigned yet. Check back soon!
        </CardContent></Card>
      )}
    </div>
  );
}

function BootCampTab({ scholarId, scholarName }: { scholarId: string; scholarName: string }) {
  const { toast } = useToast();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: standards } = useQuery({ queryKey: ["/api/acap/standards"] });
  const { data: mastery } = useQuery({
    queryKey: ["/api/acap/mastery", scholarId],
    queryFn: () => fetch(`/api/acap/mastery/${scholarId}`).then((r) => r.json()),
    enabled: !!scholarId,
  });

  const startMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/acap/bootcamp/start", data),
    onSuccess: async (response) => {
      const session = await response.json();
      setActiveSession(session);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/acap/bootcamp/${activeSession.id}/message`, data),
    onSuccess: async (response) => {
      const result = await response.json();
      setActiveSession((prev: any) => ({
        ...prev,
        messages: [
          ...(prev.messages || []),
          { role: "user", content: message, timestamp: new Date().toISOString() },
          { role: "assistant", content: result.message, timestamp: new Date().toISOString() },
        ],
      }));
      setMessage("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages]);

  if (activeSession) {
    const messages = activeSession.messages || [];
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" /> Boot Camp Tutoring
          </h2>
          <Button variant="outline" size="sm" onClick={() => setActiveSession(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Standards
          </Button>
        </div>

        <Card className="border-purple-200">
          <CardContent className="pt-4">
            <div className="h-96 overflow-y-auto space-y-3 mb-4 p-2">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Brain className="h-12 w-12 mx-auto text-purple-300 mb-2" />
                  <p>Say hello to start your tutoring session!</p>
                </div>
              )}
              {messages.map((m: any, i: number) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    m.role === "user" ? "bg-blue-600 text-white" : "bg-purple-50 text-gray-800 border border-purple-200"
                  }`}>
                    {m.role === "assistant" && <Sparkles className="h-3 w-3 text-purple-500 mb-1" />}
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask a question or say what you need help with..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && message.trim()) {
                    sendMutation.mutate({ message: message.trim(), scholarName });
                  }
                }}
              />
              <Button
                onClick={() => sendMutation.mutate({ message: message.trim(), scholarName })}
                disabled={!message.trim() || sendMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const masteryMap = new Map((mastery as any[])?.map((m: any) => [m.standardId, m]) || []);
  const needsHelp = (standards as any[])?.filter((s: any) => {
    const m = masteryMap.get(s.id);
    return !m || m.masteryLevel === "beginning" || m.masteryLevel === "developing" || m.masteryLevel === "not_started";
  }) || [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Brain className="h-5 w-5 text-purple-500" /> EduCAP Boot Camp
      </h2>
      <p className="text-gray-600">Get personalized AI tutoring on standards you're working to master.</p>

      {needsHelp.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {needsHelp.map((s: any) => {
            const m = masteryMap.get(s.id);
            return (
              <Card key={s.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => startMutation.mutate({ scholarId, standardId: s.id })}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm text-purple-600">{s.code}</p>
                      <p className="text-xs text-gray-600">{s.description?.substring(0, 80)}...</p>
                      <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${
                        m?.masteryLevel === "developing" ? "bg-amber-100 text-amber-700" :
                        m?.masteryLevel === "beginning" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {m?.masteryLevel?.replace("_", " ") || "Not started"}
                      </span>
                    </div>
                    <Brain className="h-6 w-6 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="text-center py-8">
            <Trophy className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-medium">Amazing! You've mastered all standards!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GrowthTab({ scholarId }: { scholarId: string }) {
  const { data: growth, isLoading } = useQuery({
    queryKey: ["/api/acap/growth", scholarId],
    queryFn: () => fetch(`/api/acap/growth/${scholarId}`).then((r) => r.json()),
    enabled: !!scholarId,
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-green-500" /> My Growth Journey
      </h2>

      {(growth as any[])?.length > 0 ? (
        <div className="space-y-3">
          {(growth as any[]).map((g: any) => (
            <Card key={g.id} className={`border-l-4 ${
              g.riskLevel === "none" ? "border-l-green-500" :
              g.riskLevel === "low" ? "border-l-blue-500" :
              g.riskLevel === "moderate" ? "border-l-amber-500" :
              "border-l-red-500"
            }`}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{g.snapshotType} Assessment</p>
                    <p className="text-xs text-gray-400">{new Date(g.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">{g.overallScore}%</p>
                    {g.growthFromBaseline != null && (
                      <p className={`text-xs ${g.growthFromBaseline >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {g.growthFromBaseline >= 0 ? "+" : ""}{g.growthFromBaseline}% from baseline
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed"><CardContent className="text-center py-8 text-gray-500">
          <TrendingUp className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          Complete assessments to see your growth over time!
        </CardContent></Card>
      )}
    </div>
  );
}
