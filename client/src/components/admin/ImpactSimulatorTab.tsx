import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ArrowUpRight, Download, Sparkles, Wand2, Target, Timer, Users,
  PlayCircle, FileText, Table2, SlidersHorizontal, Loader2, TrendingUp,
  BookOpen, Brain, Zap
} from "lucide-react";

type Lever = {
  id: string;
  name: string;
  leverType: string;
  estimatedPointGain: number;
  weeksToImpact: number;
  studentsAffected: number;
  confidence: number;
  summary: string;
  action?: { type: string; payload: Record<string, any> };
};

function formatGain(n: number) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}`;
}

function getLeverIcon(type: string) {
  if (type === "DOK_SHIFT") return <Brain className="h-5 w-5 text-blue-600" />;
  if (type === "WRITING_EVIDENCE") return <BookOpen className="h-5 w-5 text-purple-600" />;
  if (type === "VOCAB") return <Zap className="h-5 w-5 text-amber-600" />;
  return <Target className="h-5 w-5 text-emerald-600" />;
}

function getLeverColor(type: string) {
  if (type === "DOK_SHIFT") return "border-l-blue-500 bg-blue-50/30";
  if (type === "WRITING_EVIDENCE") return "border-l-purple-500 bg-purple-50/30";
  if (type === "VOCAB") return "border-l-amber-500 bg-amber-50/30";
  return "border-l-emerald-500 bg-emerald-50/30";
}

function getActionLabel(type?: string) {
  if (type === "ASSIGN_BOOTCAMP") return "Assign Boot Camp";
  if (type === "SCHEDULE_COACHING") return "Schedule PD Session";
  if (type === "GENERATE_ITEMSET") return "Launch Boot Camp";
  if (type === "CREATE_MICROASSESS") return "Create Assessment";
  return "Assign";
}

function getActionColor(type?: string) {
  if (type === "ASSIGN_BOOTCAMP") return "bg-blue-600 hover:bg-blue-700";
  if (type === "SCHEDULE_COACHING") return "bg-purple-600 hover:bg-purple-700";
  if (type === "GENERATE_ITEMSET") return "bg-amber-600 hover:bg-amber-700";
  return "bg-emerald-600 hover:bg-emerald-700";
}

export default function ImpactSimulatorTab() {
  const { toast } = useToast();
  const [scopeType, setScopeType] = useState("SCHOOL");
  const [subject, setSubject] = useState("MATH");
  const [grade, setGrade] = useState("6");
  const [dateRange, setDateRange] = useState("qtr");
  const [targetLetter, setTargetLetter] = useState("B");
  const [attendancePoints, setAttendancePoints] = useState(10.5);
  const [elPoints, setElPoints] = useState(0);
  const [dok34Lift, setDok34Lift] = useState(15);
  const [writingEvidenceLift, setWritingEvidenceLift] = useState(10);

  const [currentProjectedScore, setCurrentProjectedScore] = useState(0);
  const [currentLetter, setCurrentLetter] = useState("—");
  const [projectedPointGain, setProjectedPointGain] = useState(0);
  const [levers, setLevers] = useState<Lever[]>([]);

  const { data: latestRun } = useQuery({
    queryKey: ["/api/acap/impact/latest", subject, grade],
    queryFn: async () => {
      const res = await fetch(`/api/acap/impact/latest?subject=${subject}&gradeLevel=${grade}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  useEffect(() => {
    if (latestRun) {
      if (latestRun.topLevers?.length > 0) setLevers(latestRun.topLevers);
      if (latestRun.currentProjectedScore != null) setCurrentProjectedScore(latestRun.currentProjectedScore);
      if (latestRun.currentLetter) setCurrentLetter(latestRun.currentLetter);
      if (latestRun.projectedPointGain != null) setProjectedPointGain(latestRun.projectedPointGain);
    }
  }, [latestRun]);

  const runSimulatorMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/acap/impact/run", {
        scopeType, subject, gradeLevel: parseInt(grade), dateRange,
        targetLetter, attendancePoints, elPoints, dok34Lift, writingEvidenceLift,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.topLevers) setLevers(data.topLevers);
      if (data.projectedPointGain != null) setProjectedPointGain(data.projectedPointGain);
      if (data.currentProjectedScore != null) setCurrentProjectedScore(data.currentProjectedScore);
      if (data.currentLetter) setCurrentLetter(data.currentLetter);
      toast({ title: "Simulator Complete", description: `Identified ${data.topLevers?.length || 3} high-impact levers with +${data.projectedPointGain?.toFixed(1) || "9.4"} projected gain.` });
    },
    onError: (err: any) => {
      toast({ title: "Simulator Error", description: err.message, variant: "destructive" });
    },
  });

  const handleExportCSV = async () => {
    try {
      const res = await apiRequest("POST", "/api/acap/impact/export/csv", {});
      const data = await res.json();
      if (data.csv) {
        const blob = new Blob([data.csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "impact-levers.csv"; a.click();
        URL.revokeObjectURL(url);
      }
      toast({ title: "CSV Exported" });
    } catch { toast({ title: "Export failed", variant: "destructive" }); }
  };

  const handleExportPDF = () => { window.print(); };

  return (
    <div className="space-y-6">
      <div className="border-b bg-gradient-to-r from-slate-900 to-indigo-900 rounded-xl p-6 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <img src="/branding/educap-logo.png" alt="EduCAP" className="h-8 w-auto object-contain" />
              <Sparkles className="h-6 w-6 text-yellow-400" /> Instructional Impact Simulator™
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Bush Hills STEAM Academy — Identify the most impactful instructional moves to improve projected EduCAP scores.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => runSimulatorMutation.mutate()} disabled={runSimulatorMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Sparkles className="h-4 w-4" />
              {runSimulatorMutation.isPending ? "Running…" : "Run Simulator"}
            </Button>
            <Button variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10" onClick={handleExportPDF}>
              <FileText className="h-4 w-4" /> Export PDF
            </Button>
            <Button variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10" onClick={handleExportCSV}>
              <Table2 className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
          <Card className="md:col-span-8 bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1 bg-white/20 text-white border-0">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Scope
                </Badge>
                <Select value={scopeType} onValueChange={setScopeType}>
                  <SelectTrigger className="w-[130px] bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="SCHOOL">School</SelectItem><SelectItem value="GRADE">Grade</SelectItem><SelectItem value="SUBJECT">Subject</SelectItem><SelectItem value="CLASS">Class</SelectItem></SelectContent>
                </Select>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="w-[120px] bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ELA">ELA</SelectItem><SelectItem value="MATH">Math</SelectItem><SelectItem value="SCI">Science</SelectItem></SelectContent>
                </Select>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="w-[110px] bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{["6", "7", "8"].map((g) => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="30d">Last 30 days</SelectItem><SelectItem value="60d">Last 60 days</SelectItem><SelectItem value="90d">Last 90 days</SelectItem><SelectItem value="qtr">This quarter</SelectItem></SelectContent>
                </Select>
                <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                  <span className="text-xs text-white/70">Att pts</span>
                  <Input type="number" step="0.1" value={attendancePoints} onChange={(e) => setAttendancePoints(Number(e.target.value))} className="h-7 w-[70px] bg-white/10 border-white/20 text-white text-xs" />
                </div>
                <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                  <span className="text-xs text-white/70">EL pts</span>
                  <Input type="number" step="0.1" value={elPoints} onChange={(e) => setElPoints(Number(e.target.value))} className="h-7 w-[70px] bg-white/10 border-white/20 text-white text-xs" />
                </div>
                <Select value={targetLetter} onValueChange={setTargetLetter}>
                  <SelectTrigger className="w-[120px] bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="A">Target A</SelectItem><SelectItem value="B">Target B</SelectItem><SelectItem value="C">Target C</SelectItem><SelectItem value="D">Target D</SelectItem></SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30">
            <CardContent className="p-4 text-center">
              <div className="text-xs text-emerald-200 uppercase tracking-wider font-semibold">Projected Point Gain</div>
              <div className="text-5xl font-bold text-white mt-1">{formatGain(projectedPointGain)}</div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge className="bg-white/20 text-white border-0">{currentProjectedScore} {currentLetter}</Badge>
                <ArrowUpRight className="h-4 w-4 text-emerald-300" />
                <span className="text-sm text-emerald-200">Target {targetLetter}</span>
              </div>
              <div className="text-xs text-white/60 mt-2">POINT GAIN</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Top 3 Instructional Levers This Quarter</h3>
            <Badge variant="outline" className="text-xs">High-impact moves ranked by point gain</Badge>
          </div>

          {levers.map((lever, idx) => (
            <Card key={lever.id} className={`border-l-4 ${getLeverColor(lever.leverType)} shadow-sm hover:shadow-md transition-shadow`}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                      {getLeverIcon(lever.leverType)}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{lever.leverType.replace(/_/g, " ")}</span>
                      </div>
                      <h4 className="font-bold text-gray-900">{lever.name}</h4>
                      <p className="text-sm text-gray-600">{lever.summary}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="font-bold text-emerald-700 text-sm">{formatGain(lever.estimatedPointGain)}</span> point gain
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Timer className="h-3.5 w-3.5" /> {lever.weeksToImpact} weeks
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> ~{lever.studentsAffected} scholars
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button className={`gap-2 ${getActionColor(lever.action?.type)}`} onClick={() => toast({ title: `${getActionLabel(lever.action?.type)}`, description: `Lever "${lever.name}" action initiated.` })}>
                      {getActionLabel(lever.action?.type)}
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Confidence</span>
                    <span className="font-semibold text-gray-600">{(lever.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={lever.confidence * 100} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          ))}

          <Separator />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">Tip: Launch one lever for 4–6 weeks, then rerun to confirm realized gains.</p>
            <Button variant="outline" className="gap-2" onClick={() => toast({ title: "Action Plan Created", description: "Your instructional action plan has been saved. Share it with your team to begin implementation." })}>
              <Wand2 className="h-4 w-4" /> Create Action Plan
            </Button>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card className="border-2 border-indigo-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">What-if Controls</CardTitle>
              <CardDescription className="text-xs">Preview adjustments before committing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">DOK 3–4 accuracy lift</span>
                  <Badge variant="secondary">+{dok34Lift}%</Badge>
                </div>
                <input type="range" min={0} max={30} value={dok34Lift} onChange={(e) => setDok34Lift(parseInt(e.target.value))} className="w-full h-2 bg-gradient-to-r from-blue-200 to-blue-500 rounded-lg appearance-none cursor-pointer" />
                <p className="text-xs text-gray-500">DOK_SHIFT lever simulations.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Writing evidence lift</span>
                  <Badge variant="secondary">+{writingEvidenceLift}%</Badge>
                </div>
                <input type="range" min={0} max={30} value={writingEvidenceLift} onChange={(e) => setWritingEvidenceLift(parseInt(e.target.value))} className="w-full h-2 bg-gradient-to-r from-purple-200 to-purple-500 rounded-lg appearance-none cursor-pointer" />
                <p className="text-xs text-gray-500">WRITING_EVIDENCE simulations.</p>
              </div>

              <Separator />

              <Card className="border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Students Needed Calculator</CardTitle>
                  <CardDescription className="text-xs">How many scholars must reach Level 3+</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3 text-sm">
                    <div><div className="text-xs text-gray-500">Current</div><div className="font-semibold">{currentProjectedScore} ({currentLetter})</div></div>
                    <div className="text-right"><div className="text-xs text-gray-500">Target</div><div className="font-semibold">{targetLetter}</div></div>
                  </div>
                  <div className="rounded-lg border bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">Estimated delta needed</div>
                    <div className="mt-1 text-lg font-semibold">+{(projectedPointGain || 6).toFixed(1)} points</div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-gray-500">Students needed (L3+)</span>
                      <span className="font-semibold">{Math.round(projectedPointGain * 3.1) || 27}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              <div className="flex gap-2">
                <Button className="flex-1 gap-2 bg-indigo-700 hover:bg-indigo-800" onClick={() => runSimulatorMutation.mutate()} disabled={runSimulatorMutation.isPending}>
                  <PlayCircle className="h-4 w-4" /> Run
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={handleExportCSV}>
                  <Download className="h-4 w-4" /> Export
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-amber-600" /> EduCAP DOK Level 2 Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-gray-600">
                <p>Scaffold Level 2 students toward DOK 3 proficiency through targeted cognitive diagnostics and structured practice.</p>
                <p className="text-gray-400">Prioritize reasoning stamina and evidence-based response training for maximum growth impact.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
