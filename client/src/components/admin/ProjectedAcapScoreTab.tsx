import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Target, TrendingUp, Users, Award, Download, FileText, Zap,
  BarChart3, Settings, Loader2, X, ChevronRight, Shield, Activity,
  BookOpen, Sparkles, PieChart, Layers
} from "lucide-react";

export default function ProjectedAcapScoreTab() {
  const { toast } = useToast();

  const [phase, setPhase] = useState("baseline");
  const [attendancePoints, setAttendancePoints] = useState(12.5);
  const [elPoints, setElPoints] = useState(0);
  const [gradeFilter, setGradeFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [thresholds, setThresholds] = useState({ A: 90, B: 80, C: 70, D: 60, F: 0 });

  const [slider30, setSlider30] = useState(26);
  const [slider10, setSlider10] = useState(20);
  const [slider5, setSlider5] = useState(25);
  const [attendanceSlider, setAttendanceSlider] = useState(0.6);

  const [showBuilder, setShowBuilder] = useState(false);
  const [builderSubject, setBuilderSubject] = useState("Math");
  const [builderGrades, setBuilderGrades] = useState("6-8");
  const [builderItemCount, setBuilderItemCount] = useState(50);
  const [builderDok2, setBuilderDok2] = useState(30);
  const [builderDok3, setBuilderDok3] = useState(50);
  const [builderDok4, setBuilderDok4] = useState(20);
  const [builderWritingType, setBuilderWritingType] = useState("argumentative");
  const [builderDomainWeights, setBuilderDomainWeights] = useState<Record<string, number>>({});

  const { data: projections, isLoading: loadingProjections } = useQuery<any[]>({ queryKey: ["/api/acap/projections"] });
  const { data: schoolwideAssessments } = useQuery<any[]>({ queryKey: ["/api/acap/schoolwide-assessments"] });
  const { data: standards } = useQuery<any[]>({ queryKey: ["/api/acap/standards"] });
  const { data: items } = useQuery<any[]>({ queryKey: ["/api/acap/items"] });

  const latestRun = projections?.[0];

  const generateProjectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/acap/projections", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/projections"] });
      toast({ title: "Projection Generated", description: "Score report has been calculated and saved." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const saveSnapshotMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/acap/projections/${latestRun?.id}/snapshots`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Snapshot Saved", description: "What-If scenario has been stored." });
    },
  });

  const createSchoolwideAssessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/acap/schoolwide-assessments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/schoolwide-assessments"] });
      setShowBuilder(false);
      toast({ title: "Assessment Created", description: "Schoolwide assessment has been generated." });
    },
  });

  const handleGenerateReport = () => {
    generateProjectionMutation.mutate({
      gradeLevel: gradeFilter !== "all" ? parseInt(gradeFilter) : null,
      subject: subjectFilter !== "all" ? subjectFilter : null,
      assessmentPhase: phase,
      attendancePoints,
      elPoints,
      thresholds,
    });
  };

  const projScore = latestRun?.projectedScore ?? 0;
  const letterGrade = latestRun?.letterGrade ?? "—";
  const levelCounts = (latestRun?.levelCounts as Record<string, number>) ?? { level1: 0, level2: 0, level3: 0, level4: 0 };
  const totalStudents = latestRun?.totalStudentsTested ?? 0;
  const profDist = (latestRun?.proficiencyDistribution as Record<string, number>) ?? {};
  const dokBd = (latestRun?.dokBreakdown as Record<string, number>) ?? {};
  const recommendations = (latestRun?.coachingRecommendations as string[]) ?? [];

  const whatIfScore = useMemo(() => {
    if (!latestRun) return { score: 0, grade: "—", studentsNeeded: { l2: 0, l3: 0, l4: 0 } };
    const total = (levelCounts.level1 || 0) + (levelCounts.level2 || 0) + (levelCounts.level3 || 0) + (levelCounts.level4 || 0) || 1;

    const shifted30_l2 = Math.round(((levelCounts.level1 || 0) * slider30) / 100);
    const shifted10_l3 = Math.round(((levelCounts.level1 || 0) * slider10) / 100);
    const shifted5_l4 = Math.round(((levelCounts.level1 || 0) * slider5) / 100);

    const adjL3 = (levelCounts.level3 || 0) + shifted10_l3;
    const adjL4 = (levelCounts.level4 || 0) + shifted5_l4;

    const adjProfIndex = ((adjL3 + adjL4) / total) * 40;
    const adjAttendance = Math.min(attendancePoints + attendanceSlider, 15);

    const score = Math.min(Math.round((adjProfIndex + (latestRun.growthIndex || 0) + (latestRun.writingIndex || 0) + adjAttendance + (latestRun.elPoints || 0)) * 10) / 10, 100);

    let grade = "F";
    if (score >= thresholds.A) grade = "A";
    else if (score >= thresholds.B) grade = "B";
    else if (score >= thresholds.C) grade = "C";
    else if (score >= thresholds.D) grade = "D";

    return {
      score,
      grade,
      studentsNeeded: {
        l2: shifted30_l2,
        l3: shifted10_l3,
        l4: shifted5_l4,
      },
    };
  }, [latestRun, slider30, slider10, slider5, attendanceSlider, attendancePoints, thresholds, levelCounts]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "bg-emerald-500";
      case "B": return "bg-green-500";
      case "C": return "bg-amber-500";
      case "D": return "bg-orange-500";
      default: return "bg-red-500";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600";
    if (score >= 80) return "text-green-600";
    if (score >= 70) return "text-amber-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const handleExportCSV = () => {
    if (!latestRun) return;
    const rows = [
      ["Metric", "Value"],
      ["Projected Score", projScore.toString()],
      ["Letter Grade", letterGrade],
      ["Assessment Phase", latestRun.assessmentPhase],
      ["Total Students Tested", totalStudents.toString()],
      ["Proficiency Index", (latestRun.proficiencyIndex || 0).toFixed(2)],
      ["Growth Index", (latestRun.growthIndex || 0).toFixed(2)],
      ["Writing Index", (latestRun.writingIndex || 0).toFixed(2)],
      ["Attendance Points", (latestRun.attendancePoints || 0).toFixed(2)],
      ["EL Points", (latestRun.elPoints || 0).toFixed(2)],
      ["Level 1 Students", (levelCounts.level1 || 0).toString()],
      ["Level 2 Students", (levelCounts.level2 || 0).toString()],
      ["Level 3 Students", (levelCounts.level3 || 0).toString()],
      ["Level 4 Students", (levelCounts.level4 || 0).toString()],
      ["", ""],
      ["What-If Adjusted Score", whatIfScore.score.toString()],
      ["What-If Letter Grade", whatIfScore.grade],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acap_projected_score_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const subjectDomains: Record<string, string[]> = {
    Math: ["Proportional Reasoning", "Ratios & Number Systems", "Expressions & Equations", "Data & Statistics"],
    ELA: ["Reading Literature", "Reading Informational", "Writing", "Language"],
    Science: ["Physical Science", "Life Science", "Earth Science"],
  };

  useEffect(() => {
    const domains = subjectDomains[builderSubject] || [];
    const weight = domains.length > 0 ? Math.round(100 / domains.length) : 0;
    const w: Record<string, number> = {};
    domains.forEach((d) => { w[d] = weight; });
    setBuilderDomainWeights(w);
  }, [builderSubject]);

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-6 w-6 text-emerald-600" /> Projected ACAP Report Score
          </h2>
          <p className="text-gray-500 text-sm mt-1">Proprietary projection model with real-time what-if analysis</p>
        </div>
        <div className="flex gap-2">
          <Select value={phase} onValueChange={setPhase}>
            <SelectTrigger className="w-[140px] bg-white border-2 border-emerald-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baseline">Baseline</SelectItem>
              <SelectItem value="midpoint">Midpoint</SelectItem>
              <SelectItem value="final">Final</SelectItem>
              <SelectItem value="schoolwide">Schoolwide</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="border-blue-300 text-blue-700 hover:bg-blue-50">
            <FileText className="h-4 w-4 mr-1" /> Export PDF
          </Button>
          <Button onClick={() => setShowBuilder(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Sparkles className="h-4 w-4 mr-1" /> Generate Assessment
          </Button>
          <Button onClick={handleGenerateReport} disabled={generateProjectionMutation.isPending} className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg">
            {generateProjectionMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
            Score SIS
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Score Badge */}
        <div className="col-span-3">
          <Card className="border-2 border-emerald-100 bg-gradient-to-b from-white to-emerald-50/30 shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-emerald-700 text-sm uppercase tracking-wide">SIS Report</span>
              </div>
              <div className="relative mx-auto w-40 h-40 mb-4">
                <div className={`w-40 h-40 rounded-2xl ${getGradeColor(letterGrade)} shadow-xl flex flex-col items-center justify-center text-white`}>
                  <span className={`text-5xl font-black ${getScoreColor(projScore).replace("text-", "")}`} style={{ color: "white" }}>{projScore.toFixed(0)}</span>
                  <span className="text-3xl font-bold mt-1">{letterGrade}</span>
                </div>
              </div>
              <Badge className={`${getGradeColor(letterGrade)} text-white text-sm px-4 py-1`}>
                {phase.charAt(0).toUpperCase() + phase.slice(1)}
              </Badge>
              <div className="mt-4 grid grid-cols-4 gap-1">
                {[
                  { label: "L1", val: levelCounts.level1 || 0, color: "bg-red-400" },
                  { label: "L2", val: levelCounts.level2 || 0, color: "bg-amber-400" },
                  { label: "L3", val: levelCounts.level3 || 0, color: "bg-green-400" },
                  { label: "L4", val: levelCounts.level4 || 0, color: "bg-emerald-500" },
                ].map((l) => (
                  <div key={l.label} className={`${l.color} rounded-md p-1 text-white text-center`}>
                    <div className="text-xs font-bold">{l.label}</div>
                    <div className="text-sm font-semibold">{l.val}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-left space-y-2 border-t pt-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Score Breakdown</div>
                {[
                  { label: "Proficiency", val: latestRun?.proficiencyIndex || 0, max: 40, color: "bg-blue-500" },
                  { label: "Growth", val: latestRun?.growthIndex || 0, max: 25, color: "bg-purple-500" },
                  { label: "Writing", val: latestRun?.writingIndex || 0, max: 10, color: "bg-pink-500" },
                  { label: "Attendance", val: latestRun?.attendancePoints || 0, max: 15, color: "bg-teal-500" },
                  { label: "EL Points", val: latestRun?.elPoints || 0, max: 10, color: "bg-orange-500" },
                ].map((idx) => (
                  <div key={idx.label}>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{idx.label}</span>
                      <span className="font-semibold">{(idx.val as number).toFixed(1)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${idx.color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(((idx.val as number) / idx.max) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-t pt-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Admin Inputs</div>
                <div>
                  <Label className="text-xs text-gray-600">Attendance Points (1.00–15.00)</Label>
                  <Input type="number" min={1} max={15} step={0.5} value={attendancePoints} onChange={(e) => setAttendancePoints(parseFloat(e.target.value) || 0)} className="h-8 text-sm border-emerald-200" />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">EL Points (optional)</Label>
                  <Input type="number" min={0} max={10} step={0.5} value={elPoints} onChange={(e) => setElPoints(parseFloat(e.target.value) || 0)} className="h-8 text-sm border-emerald-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: What-If Lab + Analysis */}
        <div className="col-span-9 space-y-6">
          {/* What-If Scenario Lab */}
          <Card className="border-2 border-blue-100 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                What-If Scenario Lab
                <span className="text-sm text-gray-400 font-normal ml-2">See how performance and attendance goals could impact the projected ACAP report score</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  <span className="font-semibold text-sm text-gray-700">Spread Level 1 Students To Higher Levels</span>
                  <Badge variant="outline" className="ml-auto text-xs">{totalStudents} total students</Badge>
                </div>

                {/* Slider: Move 30% */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 w-48">Move 30% of Level 1 into</span>
                    <div className="flex-1">
                      <input type="range" min={0} max={100} value={slider30} onChange={(e) => setSlider30(parseInt(e.target.value))} className="w-full h-2 bg-gradient-to-r from-blue-200 to-blue-500 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <span className="text-sm font-semibold text-blue-700 w-12">{slider30}%</span>
                    <span className="text-sm text-gray-500 w-20">{Math.round(((levelCounts.level1 || 0) * slider30) / 100)} students</span>
                  </div>

                  {/* Slider: Move 10% */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 w-48">Move 10% of Level 1 into</span>
                    <div className="flex-1">
                      <input type="range" min={0} max={100} value={slider10} onChange={(e) => setSlider10(parseInt(e.target.value))} className="w-full h-2 bg-gradient-to-r from-green-200 to-green-500 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <span className="text-sm font-semibold text-green-700 w-12">{slider10}%</span>
                    <span className="text-sm text-gray-500 w-20">{Math.round(((levelCounts.level1 || 0) * slider10) / 100)} students</span>
                  </div>

                  {/* Slider: Move 5% */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 w-48">Move 5% of Level 1 into</span>
                    <div className="flex-1">
                      <input type="range" min={0} max={100} value={slider5} onChange={(e) => setSlider5(parseInt(e.target.value))} className="w-full h-2 bg-gradient-to-r from-emerald-200 to-emerald-500 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <span className="text-sm font-semibold text-emerald-700 w-12">{slider5}%</span>
                    <span className="text-sm text-gray-500 w-20">{Math.round(((levelCounts.level1 || 0) * slider5) / 100)} students</span>
                  </div>
                </div>

                {/* Attendance Slider */}
                <div className="mt-4 pt-3 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-700">Attendance Increase</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input type="range" min={0} max={5} step={0.1} value={attendanceSlider} onChange={(e) => setAttendanceSlider(parseFloat(e.target.value))} className="w-full h-2 bg-gradient-to-r from-teal-200 to-teal-500 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <span className="text-sm font-semibold text-teal-700 w-12">+{attendanceSlider.toFixed(1)}</span>
                    <span className="text-sm text-gray-500 w-32">{Math.min(attendancePoints + attendanceSlider, 15).toFixed(1)} total</span>
                  </div>
                </div>

                {/* What-If Results */}
                <div className="mt-4 flex items-center gap-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-4 border border-emerald-200">
                  <div className="bg-white rounded-lg px-3 py-1 border border-emerald-200">
                    <span className="text-xs text-gray-500">A Threshold</span>
                    <div className="text-sm font-bold text-gray-800">{thresholds.A}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-1 justify-center">
                    <span className="text-sm text-gray-600 font-medium">Projected Adjusted Score</span>
                    <div className={`${getGradeColor(whatIfScore.grade)} text-white font-bold px-4 py-2 rounded-lg text-lg shadow-md`}>
                      {whatIfScore.score.toFixed(1)} {whatIfScore.grade}
                    </div>
                  </div>
                  <Button onClick={() => {
                    if (latestRun) {
                      saveSnapshotMutation.mutate({
                        scenarioName: `Shift: L2+${slider30}%, L3+${slider10}%, L4+${slider5}%, Att+${attendanceSlider}`,
                        levelShifts: { toLevel2: slider30, toLevel3: slider10, toLevel4: slider5 },
                        attendanceWhatIf: { newAttendance: Math.min(attendancePoints + attendanceSlider, 15) },
                      });
                    }
                  }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Update Score
                  </Button>
                </div>

                {/* Students Needed Cards */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { pct: "30%", label: `Move ${slider30}% of Level 1 into`, target: "L2", badge: "Void", badgeColor: "bg-amber-400", students: whatIfScore.studentsNeeded.l2, delta: `+${((whatIfScore.studentsNeeded.l2 / (totalStudents || 1)) * 100).toFixed(1)}%` },
                    { pct: "10%", label: `Move ${slider10}% of Level 1 into`, target: "L3", badge: "Viable", badgeColor: "bg-blue-400", students: whatIfScore.studentsNeeded.l3, delta: `+${((whatIfScore.studentsNeeded.l3 / (totalStudents || 1)) * 100).toFixed(1)}%` },
                    { pct: "5%", label: `Move ${slider5}% of Level 1 into`, target: "L4", badge: "View", badgeColor: "bg-emerald-400", students: whatIfScore.studentsNeeded.l4, delta: `+${((whatIfScore.studentsNeeded.l4 / (totalStudents || 1)) * 100).toFixed(1)}%` },
                  ].map((card, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-xs text-gray-500 mb-1">{card.label}</div>
                      <div className="text-xs text-gray-400">0 Level 1 → {card.students} → {card.target} students</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`${card.badgeColor} text-white text-xs`}>{card.badge}</Badge>
                        <span className="text-green-600 text-sm font-semibold">{card.delta}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">+{card.students} students needed</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proficiency Breakdown */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="border-2 border-purple-100 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Proficiency Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Subject Performance</div>
                  {["ELA", "Math", "Science", "Writing"].map((subject, i) => {
                    const val = Math.max(10, Math.round(Math.random() * 30 + (projScore > 0 ? projScore / 2 : 20)));
                    return (
                      <div key={subject} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-20">{subject}</span>
                        <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                          <div className={`h-full ${["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-pink-500"][i]} rounded transition-all`} style={{ width: `${val}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-8">{val}%</span>
                      </div>
                    );
                  })}

                  <div className="mt-3 pt-2 border-t">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Total Proficient</span>
                      <span className="font-semibold text-emerald-600">{totalStudents} Students</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex items-center gap-1 text-xs">
                        <div className="w-3 h-3 rounded bg-emerald-500" />
                        <span>Proficient</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <div className="w-3 h-3 rounded bg-amber-500" />
                        <span>Developing</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <div className="w-3 h-3 rounded bg-red-400" />
                        <span>Beginning</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-teal-100 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Question Depth (DOK)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between h-32 gap-4 px-4">
                  {[
                    { label: "DOK 2", val: dokBd["dok2"] || dokBd["2"] || 23, color: "bg-blue-400" },
                    { label: "DOK 3", val: dokBd["dok3"] || dokBd["3"] || 30, color: "bg-emerald-500" },
                    { label: "DOK 4", val: dokBd["dok4"] || dokBd["4"] || 90, color: "bg-teal-600" },
                  ].map((d) => {
                    const maxVal = Math.max(d.val, 1);
                    const pct = Math.min((d.val / 100) * 100, 100);
                    return (
                      <div key={d.label} className="flex-1 flex flex-col items-center">
                        <span className="text-xs font-semibold text-gray-700 mb-1">{d.val}%</span>
                        <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: "90px" }}>
                          <div className={`w-full ${d.color} rounded-t-lg transition-all duration-500`} style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{d.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-2 border-t">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Level Distribution</div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Level 1", val: profDist.level1 || 0, color: "text-red-600", bg: "bg-red-50" },
                      { label: "Level 2", val: profDist.level2 || 0, color: "text-amber-600", bg: "bg-amber-50" },
                      { label: "Level 3", val: profDist.level3 || 0, color: "text-green-600", bg: "bg-green-50" },
                      { label: "Level 4", val: profDist.level4 || 0, color: "text-emerald-600", bg: "bg-emerald-50" },
                    ].map((l) => (
                      <div key={l.label} className={`${l.bg} rounded-lg p-2 text-center`}>
                        <div className={`text-lg font-bold ${l.color}`}>{l.val}%</div>
                        <div className="text-xs text-gray-500">{l.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coaching Recommendations */}
          {recommendations.length > 0 && (
            <Card className="border-2 border-amber-100 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-600" /> Coaching Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 bg-amber-50 rounded-lg p-3 border border-amber-100">
                      <ChevronRight className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 items-center">
            <Button onClick={handleGenerateReport} disabled={generateProjectionMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6">
              {generateProjectionMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Activity className="h-4 w-4 mr-1" />}
              Generate Report
            </Button>
            <Button variant="outline" onClick={handleExportPDF} className="border-red-300 text-red-700 hover:bg-red-50">
              <FileText className="h-4 w-4 mr-1" /> Export PDF
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="border-blue-300 text-blue-700 hover:bg-blue-50">
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>

          {/* Threshold Configuration */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" /> Grade Thresholds Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3">
                {(["A", "B", "C", "D", "F"] as const).map((g) => (
                  <div key={g}>
                    <Label className="text-xs text-gray-600">Grade {g}</Label>
                    <Input type="number" value={thresholds[g]} onChange={(e) => setThresholds((prev) => ({ ...prev, [g]: parseInt(e.target.value) || 0 }))} className="h-8 text-sm" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schoolwide Assessment Builder Sidebar */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 cursor-pointer" role="button" aria-label="Close sidebar" onClick={() => setShowBuilder(false)} />
          <div className="w-[420px] bg-white shadow-2xl border-l border-gray-200 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" /> Schoolwide Assessment Builder
              </h3>
              <Button variant="ghost" size="sm" aria-label="Close" onClick={() => setShowBuilder(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <Label className="text-sm font-semibold text-gray-700">Content Area</Label>
                <Select value={builderSubject} onValueChange={setBuilderSubject}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Math">Math</SelectItem>
                    <SelectItem value="ELA">ELA</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">Grades</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={builderGrades} onChange={(e) => setBuilderGrades(e.target.value)} placeholder="6-8" className="text-sm" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">Item Count</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input type="range" min={25} max={100} value={builderItemCount} onChange={(e) => setBuilderItemCount(parseInt(e.target.value))} className="flex-1 h-2 bg-gradient-to-r from-emerald-200 to-emerald-500 rounded-lg appearance-none cursor-pointer" />
                  <span className="text-sm font-bold text-emerald-700 w-8">{builderItemCount}</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">DOK Mix</Label>
                <div className="space-y-2 mt-2">
                  {[
                    { label: "DOK 2", key: "dok2", val: builderDok2, set: setBuilderDok2, color: "from-blue-200 to-blue-500" },
                    { label: "DOK 3", key: "dok3", val: builderDok3, set: setBuilderDok3, color: "from-green-200 to-green-500" },
                    { label: "DOK 4", key: "dok4", val: builderDok4, set: setBuilderDok4, color: "from-purple-200 to-purple-500" },
                  ].map((d) => (
                    <div key={d.key} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-14">{d.label}</span>
                      <input type="range" min={0} max={100} value={d.val} onChange={(e) => d.set(parseInt(e.target.value))} className={`flex-1 h-2 bg-gradient-to-r ${d.color} rounded-lg appearance-none cursor-pointer`} />
                      <span className="text-xs font-bold text-gray-700 w-10">{d.val}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">Blueprint Domain Weights</Label>
                <div className="space-y-2 mt-2">
                  {Object.entries(builderDomainWeights).map(([domain, weight]) => (
                    <div key={domain} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 flex-1">{domain}</span>
                      <input type="range" min={0} max={100} value={weight} onChange={(e) => setBuilderDomainWeights((prev) => ({ ...prev, [domain]: parseInt(e.target.value) }))} className="w-24 h-2 bg-gradient-to-r from-gray-200 to-gray-500 rounded-lg appearance-none cursor-pointer" />
                      <span className="text-xs font-bold text-gray-700 w-10">{weight}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {builderSubject === "ELA" && (
              <div>
                <Label className="text-sm font-semibold text-gray-700">Writing Task Type</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["Argumentative", "Persuasive", "Informational", "Research"].map((type) => (
                    <label key={type} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${builderWritingType === type.toLowerCase() ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input type="radio" name="writingType" value={type.toLowerCase()} checked={builderWritingType === type.toLowerCase()} onChange={(e) => setBuilderWritingType(e.target.value)} className="accent-emerald-600" />
                      <span className="text-xs font-medium text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              )}

              <Button
                onClick={() => {
                  const grades = builderGrades.split("-").map(Number).filter(Boolean);
                  const gradeLevels = grades.length === 2 ? Array.from({ length: grades[1] - grades[0] + 1 }, (_, i) => grades[0] + i) : grades;
                  createSchoolwideAssessmentMutation.mutate({
                    title: `Schoolwide ${builderSubject} Assessment — Grades ${builderGrades}`,
                    gradeLevels,
                    subject: builderSubject,
                    itemCount: builderItemCount,
                    dokMix: { dok2: builderDok2, dok3: builderDok3, dok4: builderDok4 },
                    domainWeights: builderDomainWeights,
                    writingTypes: [builderWritingType],
                    createdBy: "admin",
                  });
                }}
                disabled={createSchoolwideAssessmentMutation.isPending}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 text-sm font-bold shadow-lg"
              >
                {createSchoolwideAssessmentMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Generate Assessment <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}