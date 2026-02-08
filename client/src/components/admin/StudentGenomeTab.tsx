import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dna, TrendingUp, Clock, Brain, BookOpen, Sparkles, CheckCircle2,
  AlertTriangle, Wand2, ArrowRight, Search, Users, GraduationCap,
  Target, Zap, Activity, Star
} from "lucide-react";
import bhsaCrestPath from "@assets/BHSA_Crest_1770514411089.jpg";

type TraitKey = "REASONING_STAMINA" | "MULTISTEP_REASONING" | "VOCAB_TOLERANCE" | "EVIDENCE_JUSTIFICATION" | "RESPONSE_LATENCY" | "ERROR_RECOVERY";

type Trait = {
  key?: string;
  traitKey?: string;
  label: string;
  score: number;
  level: number;
  description: string;
};

type Recommendation = {
  priority: number;
  category: string;
  recommendation: string;
  actionType: string;
  actionPayload: Record<string, any>;
};

type TutorAdaptations = {
  reduceVocabLoad: boolean;
  increaseWorkedExamples: boolean;
  requireJustificationEvery: number;
  hintPolicy: string;
};

function traitIcon(key: string) {
  switch (key) {
    case "REASONING_STAMINA": return <Clock className="h-5 w-5" />;
    case "MULTISTEP_REASONING": return <Brain className="h-5 w-5" />;
    case "VOCAB_TOLERANCE": return <BookOpen className="h-5 w-5" />;
    case "EVIDENCE_JUSTIFICATION": return <Sparkles className="h-5 w-5" />;
    case "RESPONSE_LATENCY": return <TrendingUp className="h-5 w-5" />;
    case "ERROR_RECOVERY": return <CheckCircle2 className="h-5 w-5" />;
    default: return <Dna className="h-5 w-5" />;
  }
}

function traitBgColor(key: string) {
  switch (key) {
    case "REASONING_STAMINA": return "bg-blue-100 text-blue-700";
    case "MULTISTEP_REASONING": return "bg-purple-100 text-purple-700";
    case "VOCAB_TOLERANCE": return "bg-amber-100 text-amber-700";
    case "EVIDENCE_JUSTIFICATION": return "bg-emerald-100 text-emerald-700";
    case "RESPONSE_LATENCY": return "bg-teal-100 text-teal-700";
    case "ERROR_RECOVERY": return "bg-pink-100 text-pink-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

function recIcon(category: string) {
  if (category === "BOOTCAMP") return <Brain className="h-4 w-4" />;
  if (category === "WRITING") return <BookOpen className="h-4 w-4" />;
  if (category === "VOCAB") return <BookOpen className="h-4 w-4" />;
  if (category === "INSTRUCTION") return <Sparkles className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
}

export default function StudentGenomeTab() {
  const { toast } = useToast();
  const [subject, setSubject] = useState("MATH");
  const [grade, setGrade] = useState("6");
  const [house, setHouse] = useState("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("Select a Student");

  const { data: scholars } = useQuery<any[]>({ queryKey: ["/api/acap/scholars"] });

  const filteredScholars = (scholars || []).filter((s: any) => {
    if (grade !== "all" && s.grade && String(s.grade) !== grade) return false;
    if (house !== "all" && s.house && s.house !== house) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q);
    }
    return true;
  }).slice(0, 20);

  const { data: genomeData, isLoading: loadingGenome } = useQuery({
    queryKey: ["/api/acap/genome/student", selectedStudentId, subject],
    queryFn: async () => {
      if (!selectedStudentId) return null;
      const res = await fetch(`/api/acap/genome/student/${selectedStudentId}?subject=${subject}`);
      return res.json();
    },
    enabled: !!selectedStudentId,
  });

  const { data: recsData, isLoading: loadingRecs } = useQuery({
    queryKey: ["/api/acap/genome/recommendations/student", selectedStudentId, subject],
    queryFn: async () => {
      if (!selectedStudentId) return null;
      const res = await fetch(`/api/acap/genome/recommendations/student/${selectedStudentId}?subject=${subject}`);
      return res.json();
    },
    enabled: !!selectedStudentId,
  });

  const recomputeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudentId) throw new Error("No student selected");
      const res = await apiRequest("POST", `/api/acap/genome/recompute/student/${selectedStudentId}`, { subject, gradeLevel: parseInt(grade) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/genome/student", selectedStudentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/acap/genome/recommendations/student", selectedStudentId] });
      toast({ title: "Genome Recomputed", description: "Traits and recommendations have been refreshed." });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const { data: tutorData } = useQuery({
    queryKey: ["/api/acap/tutor-adaptations", selectedStudentId, subject],
    queryFn: async () => {
      if (!selectedStudentId) return null;
      const res = await fetch(`/api/acap/tutor-adaptations/${selectedStudentId}?subject=${subject}`);
      return res.json();
    },
    enabled: !!selectedStudentId,
  });

  const saveTutorMutation = useMutation({
    mutationFn: async (data: TutorAdaptations) => {
      if (!selectedStudentId) throw new Error("No student");
      const res = await apiRequest("PUT", `/api/acap/tutor-adaptations/${selectedStudentId}`, { ...data, subject });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/tutor-adaptations", selectedStudentId] });
      toast({ title: "Tutor Adaptations Saved", description: "Settings have been persisted for this student." });
    },
    onError: () => toast({ title: "Save Failed", variant: "destructive" }),
  });

  const traits: Trait[] = genomeData?.traits || [];
  const readinessScore = genomeData?.readinessScore || 0;
  const recommendations: Recommendation[] = recsData?.recommendations || [];
  const defaultTutor: TutorAdaptations = { reduceVocabLoad: false, increaseWorkedExamples: false, requireJustificationEvery: 2, hintPolicy: "standard" };
  const [tutor, setTutor] = useState<TutorAdaptations>(defaultTutor);

  useEffect(() => {
    const source = tutorData?.id ? tutorData : (recsData?.tutorAdaptations || defaultTutor);
    setTutor({
      reduceVocabLoad: !!source.reduceVocabLoad,
      increaseWorkedExamples: !!source.increaseWorkedExamples,
      requireJustificationEvery: source.requireJustificationEvery ?? 2,
      hintPolicy: source.hintPolicy || "standard",
    });
  }, [tutorData, recsData]);

  const selectStudent = (scholar: any) => {
    setSelectedStudentId(scholar.id);
    setStudentName(`${scholar.firstName} ${scholar.lastName}`);
    setSearchQuery("");
  };

  return (
    <div className="space-y-6">
      <div className="border-b bg-gradient-to-r from-slate-900 to-emerald-900 rounded-xl p-6 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img src={bhsaCrestPath} alt="BHSA" className="h-10 w-10 object-contain" />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Dna className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Student Readiness Genome™</h2>
              <p className="text-sm text-emerald-200">Bush Hills STEAM Academy — Student diagnostics that power tutoring, coaching, and growth.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-[130px] bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ELA">ELA</SelectItem><SelectItem value="MATH">Math</SelectItem><SelectItem value="SCI">Science</SelectItem></SelectContent>
            </Select>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="w-[110px] bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Grades</SelectItem>{["6", "7", "8"].map((g) => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={house} onValueChange={setHouse}>
              <SelectTrigger className="w-[130px] bg-white/10 border-white/20 text-white"><SelectValue placeholder="House" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Houses</SelectItem>
                <SelectItem value="Johnson">Johnson</SelectItem>
                <SelectItem value="Marshall">Marshall</SelectItem>
                <SelectItem value="West">West</SelectItem>
                <SelectItem value="Drew">Drew</SelectItem>
                <SelectItem value="Tesla">Tesla</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => recomputeMutation.mutate()} disabled={!selectedStudentId || recomputeMutation.isPending} className="gap-2 border-white/30 text-white hover:bg-white/10">
              <Sparkles className="h-4 w-4" /> Refresh Genome
            </Button>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
              <span className="text-xs text-white/70">Advanced</span>
              <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
          <Card className="md:col-span-8 bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Search className="h-4 w-4 text-white/60" />
                <Input
                  placeholder="Search students by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              {searchQuery && filteredScholars.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1 bg-white rounded-lg p-2">
                  {filteredScholars.map((s: any) => (
                    <button key={s.id} onClick={() => selectStudent(s)} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm text-gray-800 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{s.firstName} {s.lastName}</span>
                      <Badge variant="outline" className="ml-auto text-xs">{s.id}</Badge>
                    </button>
                  ))}
                </div>
              )}
              {selectedStudentId && !searchQuery && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/30 text-white font-bold text-sm">
                    {studentName.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">{studentName}</div>
                    <div className="flex gap-2">
                      <Badge className="bg-white/20 text-white border-0">Grade {grade} {subject}</Badge>
                      <Badge variant="outline" className="text-white/70 border-white/30">ID: {selectedStudentId}</Badge>
                    </div>
                  </div>
                </div>
              )}
              {!selectedStudentId && !searchQuery && (
                <p className="text-sm text-white/50 mt-2">Search for a student above to view their Readiness Genome.</p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-4 bg-white/10 border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white">Tutor Adaptations</CardTitle>
              <CardDescription className="text-xs text-white/60">Boot Camp tutor adapts based on traits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-xs">Reduce vocab load</span>
                <Switch checked={tutor.reduceVocabLoad} onCheckedChange={(v) => setTutor(prev => ({ ...prev, reduceVocabLoad: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-xs">More worked examples</span>
                <Switch checked={tutor.increaseWorkedExamples} onCheckedChange={(v) => setTutor(prev => ({ ...prev, increaseWorkedExamples: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-xs">Require justification every</span>
                <Select value={String(tutor.requireJustificationEvery)} onValueChange={(v) => setTutor(prev => ({ ...prev, requireJustificationEvery: parseInt(v) }))}>
                  <SelectTrigger className="w-[80px] h-7 bg-white/10 border-white/20 text-white text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} items</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-xs">Hint policy</span>
                <Select value={tutor.hintPolicy} onValueChange={(v) => setTutor(prev => ({ ...prev, hintPolicy: v }))}>
                  <SelectTrigger className="w-[100px] h-7 bg-white/10 border-white/20 text-white text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="standard">Standard</SelectItem><SelectItem value="minimal">Minimal</SelectItem><SelectItem value="aggressive">Aggressive</SelectItem></SelectContent>
                </Select>
              </div>
              {selectedStudentId && (
                <Button size="sm" className="w-full mt-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => saveTutorMutation.mutate(tutor)} disabled={saveTutorMutation.isPending}>
                  <CheckCircle2 className="h-3 w-3" /> {saveTutorMutation.isPending ? "Saving..." : "Save Adaptations"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedStudentId ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4">
            <Card className="border-2 border-slate-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-blue-600" /> Core Skill Levels</CardTitle>
                <CardDescription>Trait-level diagnostics that explain why mastery moves (or stalls).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {traits.slice(0, 4).map((t) => {
                    const key = t.traitKey || t.key || "";
                    return (
                      <Card key={key} className="border-slate-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${traitBgColor(key)}`}>
                                {traitIcon(key)}
                              </div>
                              <div>
                                <div className="text-sm font-semibold">{t.label}</div>
                                <p className="mt-1 text-xs text-gray-500">{t.description}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">Level {t.level}</Badge>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-400">Score</span>
                              <span className="font-semibold">{Math.round(t.score)}/100</span>
                            </div>
                            <Progress value={t.score} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {traits.length > 4 && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {traits.slice(4).map((t) => {
                        const key = t.traitKey || t.key || "";
                        return (
                          <Card key={key} className="border-slate-200">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${traitBgColor(key)}`}>
                                    {traitIcon(key)}
                                  </div>
                                  <span className="text-xs font-semibold">{t.label}</span>
                                </div>
                                <Badge variant="secondary" className="text-[10px]">L{t.level}</Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-400">Score</span>
                                <span className="font-semibold">{Math.round(t.score)}/100</span>
                              </div>
                              <Progress value={t.score} className="h-1.5" />
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}

                {showAdvanced && (
                  <>
                    <Separator />
                    <Card className="border-slate-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Advanced Genome Signals</CardTitle>
                        <CardDescription className="text-xs">DOK breakdown trends and misconception clusters.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-lg border bg-gray-50 p-3"><div className="text-xs text-gray-500">DOK 3–4 Accuracy</div><div className="mt-1 text-lg font-semibold">54%</div></div>
                        <div className="rounded-lg border bg-gray-50 p-3"><div className="text-xs text-gray-500">Idle Minutes / Session</div><div className="mt-1 text-lg font-semibold">2.1</div></div>
                        <div className="rounded-lg border bg-gray-50 p-3"><div className="text-xs text-gray-500">Top Misconception</div><div className="mt-1 text-lg font-semibold">Rate vs Ratio</div></div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Dna className="h-5 w-5 text-emerald-600" /> Student Readiness Genome™</CardTitle>
                <CardDescription>{studentName}'s Readiness Genome combines cognitive diagnostics to guide personalized learning.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 mb-4">
                  {traits.map((t) => {
                    const key = t.traitKey || t.key || "";
                    return (
                      <div key={key} className="flex flex-col items-center gap-1">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${traitBgColor(key)}`}>
                          <Star className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-semibold text-gray-600 text-center max-w-[80px]">{t.label}</span>
                        <span className="text-[10px] text-gray-400">{Math.round(t.score)}/100</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-700">{readinessScore}</div>
                    <div className="text-xs text-gray-500">Readiness Score</div>
                  </div>
                  <Progress value={readinessScore} className="flex-1 h-3" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <Card className="border-2 border-purple-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-purple-600" /> Coaching Dashboard</CardTitle>
                <CardDescription>High-priority actions to accelerate growth.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.map((rec) => (
                  <Card key={`${rec.priority}-${rec.category}`} className="border-slate-200">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-900 flex-shrink-0">
                          {recIcon(rec.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-1 mb-1">
                            <Badge variant="secondary" className="text-[10px]">P{rec.priority}</Badge>
                            <Badge variant="outline" className="text-[10px]">{rec.category}</Badge>
                          </div>
                          <p className="text-xs font-medium text-gray-800">{rec.recommendation}</p>
                          <p className="text-[10px] text-gray-400 mt-1">Action: {rec.actionType}</p>
                        </div>
                        <Button size="sm" variant="outline" className="flex-shrink-0 text-xs" onClick={() => toast({ title: "Action Applied", description: `${rec.actionType} initiated for ${studentName}.` })}>
                          Apply <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Separator />

                <Button className="w-full gap-2" variant="outline" onClick={() => recomputeMutation.mutate()} disabled={recomputeMutation.isPending}>
                  <Wand2 className="h-4 w-4" /> Regenerate Recommendations
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-teal-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-teal-600" /> Enable Interventions</CardTitle>
                <CardDescription className="text-xs">Activate personalized Boot Camp tutoring sessions tailored to this student's cognitive profile.</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button variant="outline" className="flex-1 text-xs">Remind Later</Button>
                <Button className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700">Enable Now</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="py-16 text-center">
            <Dna className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Student Selected</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">Search for a student above to view their Readiness Genome, cognitive trait diagnostics, and personalized coaching recommendations.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
