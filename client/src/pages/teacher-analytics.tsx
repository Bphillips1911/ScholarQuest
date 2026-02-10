import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Target, Users,
  BarChart3, Loader2, ChevronRight, X, BookOpen, Sparkles, Shield,
  Activity, ArrowUpRight, ArrowDownRight, Minus, Eye
} from "lucide-react";
import { TAGLINE } from "@/lib/educapBrand";

function insightFetch(url: string) {
  const token = localStorage.getItem("teacherToken");
  return fetch(url, {
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    credentials: "include"
  }).then(r => {
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  });
}

const BANDS = ["PRO", "ON", "DEV", "HR", "ND"] as const;

const bandColors: Record<string, string> = {
  PRO: "bg-emerald-500",
  ON: "bg-blue-500",
  DEV: "bg-amber-500",
  HR: "bg-red-500",
  ND: "bg-gray-400",
};

const bandLabels: Record<string, string> = {
  PRO: "Proficient",
  ON: "On Track",
  DEV: "Developing",
  HR: "High Risk",
  ND: "No Data",
};

function riskBadge(flag: boolean | string | null) {
  if (flag === true || flag === "High Risk") return <Badge className="bg-red-100 text-red-700 border-red-200">High Risk</Badge>;
  if (flag === "At Risk") return <Badge className="bg-orange-100 text-orange-700 border-orange-200">At Risk</Badge>;
  if (flag === "Low Risk") return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Low Risk</Badge>;
  if (flag === false || flag === "On Track") return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">On Track</Badge>;
  return null;
}

function ScoreBar({ value, max = 100, className = "" }: { value: number | null; max?: number; className?: string }) {
  if (value === null || value === undefined) return <div className="h-4 bg-gray-100 rounded-full w-full" />;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : pct >= 30 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className={`h-4 bg-gray-100 rounded-full w-full overflow-hidden ${className}`}>
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <BarChart3 className="h-12 w-12 text-gray-300 mb-4" />
      <p className="text-gray-500 text-sm max-w-md">
        {message || "No data yet. Assessment results will appear here after assessments are completed."}
      </p>
      <p className="text-gray-400 text-xs mt-2">If you're an admin, seed data via the InsightStack seeder.</p>
    </div>
  );
}

export default function TeacherAnalytics() {
  const [, setLocation] = useLocation();
  const [subject, setSubject] = useState<"ELA" | "Math">("ELA");
  const [fromWindow, setFromWindow] = useState<number | null>(null);
  const [toWindow, setToWindow] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("snapshot");

  const { data: windows, isLoading: windowsLoading } = useQuery<any[]>({
    queryKey: ["/api/educap/analytics/windows"],
    queryFn: () => insightFetch("/api/educap/analytics/windows"),
  });

  const sortedWindows = useMemo(() => {
    if (!windows) return [];
    return [...windows].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [windows]);

  useMemo(() => {
    if (sortedWindows.length >= 2 && fromWindow === null && toWindow === null) {
      setFromWindow(sortedWindows[0].id);
      setToWindow(sortedWindows[sortedWindows.length - 1].id);
    }
  }, [sortedWindows, fromWindow, toWindow]);

  const enabled = !!fromWindow && !!toWindow && fromWindow !== toWindow;

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["/api/educap/analytics/overview", subject, fromWindow, toWindow],
    queryFn: () => insightFetch(`/api/educap/analytics/overview?subject=${subject}&fromWindow=${fromWindow}&toWindow=${toWindow}`),
    enabled,
  });

  const { data: movementData, isLoading: movementLoading } = useQuery({
    queryKey: ["/api/educap/analytics/movement", subject, fromWindow, toWindow],
    queryFn: () => insightFetch(`/api/educap/analytics/movement?subject=${subject}&fromWindow=${fromWindow}&toWindow=${toWindow}`),
    enabled,
  });

  const { data: standardsData } = useQuery({
    queryKey: ["/api/educap/analytics/standards", subject, fromWindow, toWindow],
    queryFn: () => insightFetch(`/api/educap/analytics/standards?subject=${subject}&fromWindow=${fromWindow}&toWindow=${toWindow}`),
    enabled,
  });

  const { data: studentsData } = useQuery({
    queryKey: ["/api/educap/analytics/students", subject, fromWindow, toWindow],
    queryFn: () => insightFetch(`/api/educap/analytics/students?subject=${subject}&fromWindow=${fromWindow}&toWindow=${toWindow}`),
    enabled,
  });

  const { data: studentDetail } = useQuery({
    queryKey: ["/api/educap/analytics/student", selectedStudentId, subject],
    queryFn: () => insightFetch(`/api/educap/analytics/student/${selectedStudentId}?subject=${subject}`),
    enabled: !!selectedStudentId,
  });

  const openDrawer = (studentId: string) => {
    setSelectedStudentId(studentId);
    setDrawerOpen(true);
  };

  const fromWindowName = sortedWindows.find(w => w.id === fromWindow)?.name || "From";
  const toWindowName = sortedWindows.find(w => w.id === toWindow)?.name || "To";

  if (windowsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => setLocation("/teacher-dashboard")}>
              <ArrowLeft className="h-5 w-5 mr-1" /> Back
            </Button>
            <img src="/branding/educap-logo.png" alt="EduCAP Logo" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-bold">EduCAP Insights™</h1>
              <p className="text-purple-200 text-sm italic">{TAGLINE}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-white/30">
              <Users className="h-3 w-3 mr-1" />
              {overview?.totalStudents || 0} Scholars
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4 space-y-4">
        {/* Controls Bar */}
        <Card className="border-purple-200">
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-600 mr-2">Subject:</span>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  {(["ELA", "Math"] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        subject === s ? "bg-purple-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Separator orientation="vertical" className="h-8" />

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Compare:</span>
                <Select value={fromWindow?.toString() || ""} onValueChange={v => setFromWindow(parseInt(v))}>
                  <SelectTrigger className="w-40 h-8 text-sm">
                    <SelectValue placeholder="From Window" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedWindows.map(w => (
                      <SelectItem key={w.id} value={w.id.toString()} disabled={w.id === toWindow}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <Select value={toWindow?.toString() || ""} onValueChange={v => setToWindow(parseInt(v))}>
                  <SelectTrigger className="w-40 h-8 text-sm">
                    <SelectValue placeholder="To Window" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedWindows.map(w => (
                      <SelectItem key={w.id} value={w.id.toString()} disabled={w.id === fromWindow}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        {overviewLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-purple-500" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-xs font-medium uppercase tracking-wide">Proficiency Now</p>
                    <p className="text-3xl font-bold mt-1">{overview?.proficiencyNow ?? 0}%</p>
                    <p className="text-emerald-200 text-xs mt-1">of scholars in PRO band</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Target className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Median Growth</p>
                    <p className="text-3xl font-bold mt-1">
                      {(overview?.growth ?? 0) >= 0 ? "+" : ""}{overview?.growth ?? 0}
                    </p>
                    <p className="text-blue-200 text-xs mt-1">pts {fromWindowName} → {toWindowName}</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-xs font-medium uppercase tracking-wide">Off Track</p>
                    <p className="text-3xl font-bold mt-1">{overview?.offTrack ?? 0}</p>
                    <p className="text-orange-200 text-xs mt-1">scholars below ON band</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs font-medium uppercase tracking-wide">Leverage Standards</p>
                    <p className="text-3xl font-bold mt-1">{overview?.leverageStandards?.length ?? 0}</p>
                    <p className="text-purple-200 text-xs mt-1">high-impact focus areas</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="snapshot">Snapshot</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
            <TabsTrigger value="standards">Standards</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="snapshot" className="mt-4 space-y-4">
            <SnapshotTab
              movementData={movementData}
              movementLoading={movementLoading}
              fromWindowName={fromWindowName}
              toWindowName={toWindowName}
              subject={subject}
              fromWindow={fromWindow}
              toWindow={toWindow}
              onStudentClick={openDrawer}
            />
          </TabsContent>

          <TabsContent value="growth" className="mt-4">
            <GrowthTab
              standardsData={standardsData}
              studentsData={studentsData}
              onStudentClick={openDrawer}
            />
          </TabsContent>

          <TabsContent value="projections" className="mt-4">
            <ProjectionsTab studentsData={studentsData} onStudentClick={openDrawer} />
          </TabsContent>

          <TabsContent value="standards" className="mt-4">
            <StandardsTab standardsData={standardsData} />
          </TabsContent>

          <TabsContent value="students" className="mt-4">
            <StudentsTab
              studentsData={studentsData}
              sortedWindows={sortedWindows}
              onStudentClick={openDrawer}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Student Drilldown Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              Student Drilldown
            </SheetTitle>
          </SheetHeader>
          {selectedStudentId && studentDetail ? (
            <StudentDrawerContent detail={studentDetail} subject={subject} />
          ) : (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ===================== SNAPSHOT TAB ===================== */
function SnapshotTab({
  movementData, movementLoading, fromWindowName, toWindowName,
  subject, fromWindow, toWindow, onStudentClick,
}: any) {
  const [cellStudents, setCellStudents] = useState<any[] | null>(null);
  const [cellLabel, setCellLabel] = useState("");

  const handleCellClick = async (fromBand: string, toBand: string, count: number) => {
    if (count === 0) return;
    setCellLabel(`${fromBand} → ${toBand}`);
    try {
      const data = await insightFetch(
        `/api/educap/analytics/movement/cell?subject=${subject}&fromWindow=${fromWindow}&toWindow=${toWindow}&fromBand=${fromBand}&toBand=${toBand}`
      );
      setCellStudents(data.students || []);
    } catch {
      setCellStudents([]);
    }
  };

  if (movementLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!movementData?.grid || Object.keys(movementData.grid).length === 0) return <EmptyState />;

  const grid = movementData.grid;
  const summary = movementData.movementSummary || { accelerated: 0, typical: 0, flat: 0, decline: 0 };
  const totalMovement = summary.accelerated + summary.typical + summary.flat + summary.decline;

  const getCellColor = (fromBand: string, toBand: string) => {
    const fromIdx = BANDS.indexOf(fromBand as any);
    const toIdx = BANDS.indexOf(toBand as any);
    if (fromIdx < 0 || toIdx < 0) return "bg-gray-50";
    if (toIdx < fromIdx) return "bg-emerald-100 hover:bg-emerald-200";
    if (toIdx === fromIdx) return "bg-amber-50 hover:bg-amber-100";
    return "bg-red-100 hover:bg-red-200";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Movement Map */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              Movement Map: {fromWindowName} → {toWindowName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-xs text-gray-500 w-16">From ↓ / To →</th>
                    {BANDS.map(b => (
                      <th key={b} className="p-2 text-xs font-semibold text-center">
                        <Badge variant="outline" className="text-xs">{b}</Badge>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BANDS.map(fromBand => (
                    <tr key={fromBand}>
                      <td className="p-2 text-xs font-semibold">
                        <Badge variant="outline" className="text-xs">{fromBand}</Badge>
                      </td>
                      {BANDS.map(toBand => {
                        const cell = grid[fromBand]?.[toBand];
                        const count = cell?.count || 0;
                        return (
                          <td key={toBand} className="p-1">
                            <button
                              onClick={() => handleCellClick(fromBand, toBand, count)}
                              className={`w-full h-12 rounded-md text-sm font-semibold transition-all ${getCellColor(fromBand, toBand)} ${
                                count > 0 ? "cursor-pointer" : "cursor-default opacity-60"
                              }`}
                            >
                              {count > 0 ? count : "–"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-100 rounded" /> Growth</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-50 rounded border" /> Flat</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 rounded" /> Decline</span>
            </div>
          </CardContent>
        </Card>

        {/* Growth Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Growth Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Accelerated", value: summary.accelerated, color: "bg-emerald-500", icon: ArrowUpRight },
              { label: "Typical", value: summary.typical, color: "bg-blue-500", icon: TrendingUp },
              { label: "Flat", value: summary.flat, color: "bg-amber-500", icon: Minus },
              { label: "Decline", value: summary.decline, color: "bg-red-500", icon: ArrowDownRight },
            ].map(item => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                  <span className="font-semibold">{item.value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: totalMovement > 0 ? `${(item.value / totalMovement) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Cell Detail Students */}
      {cellStudents !== null && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Students: {cellLabel}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setCellStudents(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {cellStudents.length === 0 ? (
              <p className="text-sm text-gray-500">No students in this cell.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {cellStudents.map((s: any) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-purple-50 cursor-pointer"
                    onClick={() => onStudentClick(s.id)}
                  >
                    <div>
                      <span className="font-medium text-sm">{s.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">G{s.grade}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">{s.fromScore ?? "–"} → {s.toScore ?? "–"}</span>
                      {s.growth !== null && (
                        <Badge className={s.growth >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                          {s.growth >= 0 ? "+" : ""}{s.growth}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ===================== GROWTH TAB ===================== */
function GrowthTab({ standardsData, studentsData, onStudentClick }: any) {
  const standards = standardsData?.standards || [];
  const students = studentsData?.students || [];

  const topGrowth = useMemo(() => {
    return [...standards].filter((s: any) => s.growth > 0).sort((a: any, b: any) => b.growth - a.growth).slice(0, 10);
  }, [standards]);

  const biggestMovers = useMemo(() => {
    return [...students].filter((s: any) => s.growth !== null).sort((a: any, b: any) => (b.growth || 0) - (a.growth || 0)).slice(0, 10);
  }, [students]);

  if (standards.length === 0 && students.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Top Growth Drivers (Standards)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topGrowth.length === 0 ? (
            <p className="text-sm text-gray-500">No growth data available.</p>
          ) : (
            <div className="space-y-3">
              {topGrowth.map((s: any, i: number) => (
                <div key={s.standardId || i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono font-semibold text-purple-600">{s.code}</span>
                    <Badge className="bg-emerald-100 text-emerald-700">+{s.growth.toFixed(1)}%</Badge>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, s.growth))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            Biggest Movers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {biggestMovers.length === 0 ? (
            <p className="text-sm text-gray-500">No growth data available.</p>
          ) : (
            <div className="space-y-2">
              {biggestMovers.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-purple-50 cursor-pointer"
                  onClick={() => onStudentClick(s.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{s.name}</span>
                    <Badge variant="outline" className="text-xs">G{s.grade}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{s.fromBand} → {s.toBand}</span>
                    <Badge className="bg-emerald-100 text-emerald-700">
                      +{(s.growth || 0).toFixed(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ===================== PROJECTIONS TAB ===================== */
function ProjectionsTab({ studentsData, onStudentClick }: any) {
  const students = studentsData?.students || [];

  const projGroups = useMemo(() => {
    const groups: Record<string, any[]> = {
      "Likely Proficient": [],
      "On Track": [],
      "Needs Acceleration": [],
      "High Risk": [],
      "Unknown": [],
    };
    for (const s of students) {
      const band = s.projectionBand;
      if (band === "PRO") groups["Likely Proficient"].push(s);
      else if (band === "ON") groups["On Track"].push(s);
      else if (band === "DEV") groups["Needs Acceleration"].push(s);
      else if (band === "HR") groups["High Risk"].push(s);
      else groups["Unknown"].push(s);
    }
    return groups;
  }, [students]);

  if (students.length === 0) return <EmptyState message="No projection data yet. Projections are computed after at least 2 assessment windows." />;

  const groupMeta: Record<string, { color: string; icon: any }> = {
    "Likely Proficient": { color: "border-emerald-200 bg-emerald-50", icon: Target },
    "On Track": { color: "border-blue-200 bg-blue-50", icon: TrendingUp },
    "Needs Acceleration": { color: "border-amber-200 bg-amber-50", icon: AlertTriangle },
    "High Risk": { color: "border-red-200 bg-red-50", icon: Shield },
    "Unknown": { color: "border-gray-200 bg-gray-50", icon: BarChart3 },
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(projGroups).filter(([k]) => k !== "Unknown").map(([label, list]) => {
          const meta = groupMeta[label];
          const Icon = meta.icon;
          return (
            <Card key={label} className={`${meta.color}`}>
              <CardContent className="pt-4 pb-3 text-center">
                <Icon className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                <p className="text-2xl font-bold">{list.length}</p>
                <p className="text-xs text-gray-600">{label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {Object.entries(projGroups).filter(([, list]) => list.length > 0).map(([label, list]) => (
        <Card key={label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{label} ({list.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {list.slice(0, 12).map((s: any) => (
                <div
                  key={s.id}
                  className="p-2 bg-gray-50 rounded-lg hover:bg-purple-50 cursor-pointer flex items-center justify-between"
                  onClick={() => onStudentClick(s.id)}
                >
                  <div>
                    <span className="text-sm font-medium">{s.name}</span>
                    <Badge variant="outline" className="ml-1 text-xs">G{s.grade}</Badge>
                  </div>
                  <span className="text-xs text-gray-500">{s.toScore ?? "–"}%</span>
                </div>
              ))}
              {list.length > 12 && (
                <p className="text-xs text-gray-400 p-2">+{list.length - 12} more</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ===================== STANDARDS TAB ===================== */
function StandardsTab({ standardsData }: any) {
  const [sortKey, setSortKey] = useState<string>("leverageScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const standards = standardsData?.standards || [];

  const sorted = useMemo(() => {
    return [...standards].sort((a: any, b: any) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [standards, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  if (standards.length === 0) return <EmptyState />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-purple-500" />
          Standards Growth Attribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("code")}>Standard</TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("fromMastery")}>From %</TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("toMastery")}>To %</TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("growth")}>Growth</TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("studentCount")}>Students</TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("leverageScore")}>Leverage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((s: any, i: number) => (
                <TableRow key={s.standardId || i}>
                  <TableCell>
                    <span className="font-mono font-semibold text-purple-600 text-sm">{s.code}</span>
                    {s.description && (
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{s.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm">{s.fromMastery?.toFixed(1)}%</TableCell>
                  <TableCell className="text-right text-sm">{s.toMastery?.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">
                    <Badge className={s.growth >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                      {s.growth >= 0 ? "+" : ""}{s.growth?.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">{s.studentCount}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-semibold">{s.leverageScore?.toFixed(1)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/* ===================== STUDENTS TAB ===================== */
function StudentsTab({ studentsData, sortedWindows, onStudentClick }: any) {
  const students = studentsData?.students || [];

  if (students.length === 0) return <EmptyState />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-purple-500" />
          Roster Insights
          <Badge variant="outline" className="ml-2">{students.length} scholars</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scholar</TableHead>
                <TableHead>Baseline</TableHead>
                <TableHead>Current</TableHead>
                <TableHead className="text-right">Growth</TableHead>
                <TableHead className="text-center">Band</TableHead>
                <TableHead className="text-center">Risk</TableHead>
                <TableHead className="text-center">Projection</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s: any) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer hover:bg-purple-50"
                  onClick={() => onStudentClick(s.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{s.name}</span>
                      <Badge variant="outline" className="text-xs">G{s.grade}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="w-32">
                    <div className="flex items-center gap-2">
                      <ScoreBar value={s.fromScore} className="flex-1" />
                      <span className="text-xs text-gray-500 w-8 text-right">{s.fromScore ?? "–"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-32">
                    <div className="flex items-center gap-2">
                      <ScoreBar value={s.toScore} className="flex-1" />
                      <span className="text-xs text-gray-500 w-8 text-right">{s.toScore ?? "–"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {s.growth !== null ? (
                      <Badge className={s.growth >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                        {s.growth >= 0 ? "+" : ""}{s.growth.toFixed(1)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-400">–</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${bandColors[s.toBand] || "bg-gray-400"} text-white text-xs`}>
                      {s.toBand}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {riskBadge(s.riskFlag)}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.projectionBand ? (
                      <Badge variant="outline" className="text-xs">{s.projectionBand}</Badge>
                    ) : (
                      <span className="text-xs text-gray-400">–</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/* ===================== STUDENT DRAWER ===================== */
function StudentDrawerContent({ detail, subject }: { detail: any; subject: string }) {
  const [drawerTab, setDrawerTab] = useState("growth");
  const student = detail.student || {};
  const windowScores = detail.windowScores || [];
  const masteryMap = detail.masteryMap || [];
  const projection = detail.projection;
  const growthTrend = detail.growthTrend || [];

  const firstScore = windowScores.length > 0 ? windowScores[0] : null;
  const lastScore = windowScores.length > 0 ? windowScores[windowScores.length - 1] : null;
  const delta = firstScore?.scaledPercent != null && lastScore?.scaledPercent != null
    ? lastScore.scaledPercent - firstScore.scaledPercent : null;

  return (
    <div className="mt-4 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-bold">{student.name}</h3>
        <Badge variant="outline">Grade {student.grade} • {subject}</Badge>
      </div>

      {projection && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-medium">Projected Band</p>
                <p className="text-lg font-bold text-purple-700">{projection.projectionBand}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-purple-600 font-medium">Probability Proficient</p>
                <p className="text-lg font-bold text-purple-700">
                  {(projection.probabilityProficient * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={drawerTab} onValueChange={setDrawerTab}>
        <TabsList className="w-full">
          <TabsTrigger value="growth" className="flex-1">Growth</TabsTrigger>
          <TabsTrigger value="mastery" className="flex-1">Mastery</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="mt-3 space-y-4">
          {delta !== null && (
            <div className="text-center">
              <p className="text-3xl font-bold">
                <span className={delta >= 0 ? "text-emerald-600" : "text-red-600"}>
                  {delta >= 0 ? "+" : ""}{delta.toFixed(1)}
                </span>
              </p>
              <p className="text-sm text-gray-500">Score Delta</p>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Baseline: {firstScore?.scaledPercent?.toFixed(1) ?? "–"}%</span>
              <span>Current: {lastScore?.scaledPercent?.toFixed(1) ?? "–"}%</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
              {firstScore?.scaledPercent != null && (
                <div
                  className="absolute h-full bg-gray-300 rounded-full"
                  style={{ width: `${firstScore.scaledPercent}%` }}
                />
              )}
              {lastScore?.scaledPercent != null && (
                <div
                  className="absolute h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                  style={{ width: `${lastScore.scaledPercent}%` }}
                />
              )}
            </div>
          </div>

          {growthTrend.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Score Trend</p>
              {growthTrend.map((pt: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 truncate">{pt.windowName}</span>
                  <div className="flex-1">
                    <Progress value={pt.scaledPercent || 0} className="h-2" />
                  </div>
                  <span className="text-xs font-medium w-10 text-right">{pt.scaledPercent?.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mastery" className="mt-3">
          {masteryMap.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No mastery data available.</p>
          ) : (
            <div className="space-y-2">
              {masteryMap.map((m: any, i: number) => {
                const levelColor = m.masteryLevel === "mastered" ? "bg-emerald-100 text-emerald-700"
                  : m.masteryLevel === "proficient" ? "bg-blue-100 text-blue-700"
                  : m.masteryLevel === "developing" ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700";
                return (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-mono text-sm font-semibold text-purple-600">{m.code}</span>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{m.description}</p>
                    </div>
                    <Badge className={levelColor}>{m.masteryLevel || "unknown"}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          {windowScores.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No assessment history available.</p>
          ) : (
            <div className="space-y-2">
              {windowScores.map((ws: any, i: number) => (
                <Card key={i} className="border-gray-200">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{ws.windowName}</p>
                        <p className="text-xs text-gray-400">{ws.subject}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={`${bandColors[ws.band] || "bg-gray-400"} text-white`}>{ws.band}</Badge>
                        <p className="text-xs text-gray-500 mt-1">{ws.scaledPercent?.toFixed(1)}%</p>
                      </div>
                    </div>
                    <Progress value={ws.scaledPercent || 0} className="h-1.5 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
