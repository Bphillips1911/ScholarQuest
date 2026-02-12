import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import {
  ArrowLeft, BookOpen, Target, BarChart3, Shield, Settings, Brain,
  Plus, Loader2, CheckCircle, Clock, AlertTriangle, Eye,
  Database, FileText, History, Check, X, Sparkles, Users,
  GraduationCap, Zap, Activity, TrendingUp, Layers, PlayCircle,
  ClipboardList, Send, Award, Filter, Download, PieChart, Dna
} from "lucide-react";
import ProjectedAcapScoreTab from "@/components/admin/ProjectedAcapScoreTab";
import ImpactSimulatorTab from "@/components/admin/ImpactSimulatorTab";
import StudentGenomeTab from "@/components/admin/StudentGenomeTab";
import AdminRankingsPage from "@/pages/acap/AdminRankingsPage";
import ForgeBuilderTab from "@/components/acap/admin/ForgeBuilderTab";
import ForgeCostControlsTab from "@/components/acap/admin/ForgeCostControlsTab";
import { useAcapWebSocket } from "@/hooks/useAcapWebSocket";
import { Hammer, DollarSign } from "lucide-react";
import { ADMIN_PORTAL, TAGLINE, DISCLAIMER_ADMIN } from "@/lib/educapBrand";
type Tab = "overview" | "blueprints-standards" | "question-bank" | "assessments" | "assessment-completion" | "ai-settings" | "forge" | "forge-cost-controls" | "reports" | "bootcamp" | "projected-score" | "impact-simulator" | "student-genome" | "rankings";

export default function AdminAcap() {
  useAcapWebSocket();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const data = localStorage.getItem("adminData");
    if (token && data) {
      try {
        const parsedData = JSON.parse(data);
        setAdminData(parsedData);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        setLocation("/admin-login");
      }
    } else {
      setLocation("/admin-login");
    }
    setAuthLoading(false);
  }, [setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
          <p className="text-gray-500">Verifying admin session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "blueprints-standards", label: "Blueprints & Standards", icon: Layers },
    { id: "question-bank", label: "Question Bank", icon: BookOpen },
    { id: "assessments", label: "Assessments", icon: ClipboardList },
    { id: "assessment-completion", label: "Completion", icon: CheckCircle },
    { id: "forge", label: "Forge", icon: Hammer },
    { id: "forge-cost-controls", label: "Cost Controls", icon: DollarSign },
    { id: "ai-settings", label: "AI Settings", icon: Brain },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "bootcamp", label: "Boot Camp", icon: GraduationCap },
    { id: "projected-score", label: "Projected Score", icon: TrendingUp },
    { id: "impact-simulator", label: "Impact Simulator", icon: Sparkles },
    { id: "student-genome", label: "Student Genome", icon: Dna },
    { id: "rankings", label: "Rankings", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-slate-800 to-indigo-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => setLocation("/admin")}>
              <ArrowLeft className="h-5 w-5 mr-1" /> Back to Admin Dashboard
            </Button>
            <div className="border-l border-white/30 pl-4 flex items-center gap-3">
              <img src="/branding/educap-logo.png" alt="EduCAP Logo" className="h-10 w-auto object-contain" />
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="h-6 w-6" /> {ADMIN_PORTAL}
                </h1>
                <p className="text-slate-300 text-sm italic">{TAGLINE}</p>
                <p className="text-slate-400 text-xs">
                  Bush Hills STEAM Academy — {adminData?.firstName} {adminData?.lastName} — {adminData?.title || "Administrator"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-1 bg-gray-50 rounded-lg p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-indigo-700 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "blueprints-standards" && <BlueprintsStandardsTab />}
        {activeTab === "question-bank" && <QuestionBankTab />}
        {activeTab === "assessments" && <AssessmentsTab />}
        {activeTab === "assessment-completion" && <AssessmentCompletionTab />}
        {activeTab === "forge" && <ForgeBuilderTab />}
        {activeTab === "forge-cost-controls" && <ForgeCostControlsTab />}
        {activeTab === "ai-settings" && <AISettingsTab />}
        {activeTab === "reports" && <ReportsTab />}
        {activeTab === "bootcamp" && <BootCampTab />}
        {activeTab === "projected-score" && <ProjectedAcapScoreTab />}
        {activeTab === "impact-simulator" && <ImpactSimulatorTab />}
        {activeTab === "student-genome" && <StudentGenomeTab />}
        {activeTab === "rankings" && <AdminRankingsPage />}
      </div>
    </div>
  );
}

function OverviewTab() {
  const { data: standards } = useQuery<any[]>({ queryKey: ["/api/acap/standards"] });
  const { data: items } = useQuery<any[]>({ queryKey: ["/api/acap/items"] });
  const { data: assessments } = useQuery<any[]>({ queryKey: ["/api/acap/assessments"] });
  const { data: blueprints } = useQuery<any[]>({ queryKey: ["/api/acap/blueprints"] });
  const { data: auditLog } = useQuery<any[]>({ queryKey: ["/api/acap/audit-log"] });

  const pending = items?.filter((i) => i.reviewStatus === "pending").length || 0;
  const approved = items?.filter((i) => i.reviewStatus === "approved").length || 0;

  const statCards = [
    { label: "Total Standards", value: standards?.length || 0, icon: Target, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Pending Review", value: pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Approved Items", value: approved, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Assessments", value: assessments?.length || 0, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Blueprints", value: blueprints?.length || 0, icon: Database, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const grade6 = standards?.filter((s) => s.gradeLevel === 6).length || 0;
  const grade7 = standards?.filter((s) => s.gradeLevel === 7).length || 0;
  const grade8 = standards?.filter((s) => s.gradeLevel === 8).length || 0;
  const maxGrade = Math.max(grade6, grade7, grade8, 1);

  const recentActivity = (auditLog || []).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 text-center">
              <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-2`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="pt-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ClipboardList className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">EduCAP Action Plan</h3>
              <p className="text-sm text-gray-500">Generate a comprehensive improvement plan based on assessment data, mastery levels, and student performance trends.</p>
            </div>
          </div>
          <Button
            className="bg-indigo-700 hover:bg-indigo-800 gap-2 shrink-0"
            onClick={() => {
              const totalStudents = standards?.length || 0;
              const actionItems = [
                pending > 0 ? `Review ${pending} pending question bank items` : null,
                (assessments?.length || 0) === 0 ? "Create and assign baseline assessments" : null,
                "Analyze mastery gaps across grade levels",
                "Schedule Boot Camp interventions for at-risk scholars",
                "Set up projected score tracking for each grade",
              ].filter(Boolean);
              const plan = actionItems.join("\n- ");
              alert(`EduCAP Action Plan\n\nPriority Items:\n- ${plan}\n\nRecommendation: Start with the Impact Simulator tab to identify high-leverage instructional moves.`);
            }}
          >
            <PlayCircle className="h-4 w-4" />
            Generate Action Plan
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Standards by Grade Level</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[{ grade: 6, count: grade6 }, { grade: 7, count: grade7 }, { grade: 8, count: grade8 }].map((g) => (
              <div key={g.grade} className="flex items-center gap-3">
                <span className="text-sm font-medium w-16">Grade {g.grade}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full flex items-center justify-end pr-2 transition-all" style={{ width: `${Math.max((g.count / maxGrade) * 100, 5)}%` }}>
                    <span className="text-xs text-white font-medium">{g.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle><CardDescription>Last 10 audit log entries</CardDescription></CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((entry: any) => (
                <div key={entry.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <History className="h-4 w-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.action.replace(/_/g, " ")}</p>
                    <p className="text-xs text-gray-400">{entry.entityType} #{entry.entityId} • {entry.userRole || "system"}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{new Date(entry.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BlueprintsStandardsTab() {
  const { toast } = useToast();
  const [gradeFilter, setGradeFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [showAddStandard, setShowAddStandard] = useState(false);
  const [showAddBlueprint, setShowAddBlueprint] = useState(false);
  const [code, setCode] = useState("");
  const [domain, setDomain] = useState("ELA");
  const [subdomain, setSubdomain] = useState("");
  const [gradeLevel, setGradeLevel] = useState("6");
  const [description, setDescription] = useState("");
  const [bpName, setBpName] = useState("");
  const [bpGrade, setBpGrade] = useState("6");
  const [bpSubject, setBpSubject] = useState("ELA");
  const [bpItems, setBpItems] = useState("30");
  const [bpTime, setBpTime] = useState("60");

  const standardsQuery = gradeFilter !== "all" ? `/api/acap/standards?gradeLevel=${gradeFilter}` : "/api/acap/standards";
  const { data: standards, isLoading: standardsLoading } = useQuery<any[]>({ queryKey: [standardsQuery] });
  const { data: blueprints, isLoading: blueprintsLoading } = useQuery<any[]>({ queryKey: ["/api/acap/blueprints"] });

  const filteredStandards = (standards || []).filter((s: any) => {
    if (domainFilter !== "all" && s.domain !== domainFilter) return false;
    return true;
  });

  const groupedBySubdomain: Record<string, any[]> = {};
  filteredStandards.forEach((s: any) => {
    const key = s.subdomain || "Other";
    if (!groupedBySubdomain[key]) groupedBySubdomain[key] = [];
    groupedBySubdomain[key].push(s);
  });

  const createStandardMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/acap/standards", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/standards"] });
      toast({ title: "Standard created successfully" });
      setShowAddStandard(false);
      setCode(""); setSubdomain(""); setDescription("");
    },
    onError: () => toast({ title: "Failed to create standard", variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/acap/standards/${id}`, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/standards"] });
      toast({ title: "Standard updated" });
    },
  });

  const createBlueprintMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/acap/blueprints", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/blueprints"] });
      toast({ title: "Blueprint created" });
      setShowAddBlueprint(false);
      setBpName("");
    },
    onError: () => toast({ title: "Failed to create blueprint", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h2 className="text-xl font-bold text-gray-800">Standards & Blueprints</h2>
        <div className="flex gap-2">
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Grade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="6">Grade 6</SelectItem>
              <SelectItem value="7">Grade 7</SelectItem>
              <SelectItem value="8">Grade 8</SelectItem>
            </SelectContent>
          </Select>
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-28"><SelectValue placeholder="Domain" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Math">Math</SelectItem>
              <SelectItem value="ELA">ELA</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAddStandard(!showAddStandard)} className="bg-indigo-700 hover:bg-indigo-800">
            <Plus className="h-4 w-4 mr-1" /> Add Standard
          </Button>
        </div>
      </div>

      {showAddStandard && (
        <Card className="border-indigo-200">
          <CardHeader><CardTitle>Add New Standard</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Standard Code</Label><Input placeholder="e.g., RL.6.1" value={code} onChange={(e) => setCode(e.target.value)} /></div>
              <div>
                <Label>Grade Level</Label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">Grade 6</SelectItem>
                    <SelectItem value="7">Grade 7</SelectItem>
                    <SelectItem value="8">Grade 8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Domain</Label>
                <Select value={domain} onValueChange={setDomain}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Math">Math</SelectItem>
                    <SelectItem value="ELA">ELA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Subdomain</Label><Input placeholder="e.g., Proportional Reasoning" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} /></div>
            </div>
            <div><Label>Description</Label><Textarea placeholder="Standard description..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
            <Button
              onClick={() => createStandardMutation.mutate({ code, domain, subdomain, gradeLevel: parseInt(gradeLevel), description, dokLevels: [2, 3, 4], isActive: true, userRole: "admin" })}
              disabled={!code || !domain || !description || createStandardMutation.isPending}
              className="bg-indigo-700 hover:bg-indigo-800"
            >
              {createStandardMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Standard
            </Button>
          </CardContent>
        </Card>
      )}

      {standardsLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : Object.keys(groupedBySubdomain).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedBySubdomain).map(([sub, stds]) => (
            <Card key={sub}>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-500" /> {sub}
                  <Badge variant="secondary" className="ml-auto">{stds.length} standard{stds.length > 1 ? "s" : ""}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stds.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                    <span className="font-mono text-sm text-indigo-600 font-medium w-24 shrink-0">{s.code}</span>
                    <span className="text-sm text-gray-700 flex-1">{s.description}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.dokLevels && (
                        <div className="flex gap-1">
                          {(s.dokLevels as number[]).map((d: number) => (
                            <span key={d} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">DOK{d}</span>
                          ))}
                        </div>
                      )}
                      <Badge variant="outline" className="text-xs">G{s.gradeLevel}</Badge>
                      <Button size="sm" variant={s.isActive ? "default" : "outline"}
                        className={`text-xs h-7 ${s.isActive ? "bg-green-600 hover:bg-green-700" : "text-red-500 border-red-200"}`}
                        onClick={() => toggleActiveMutation.mutate({ id: s.id, isActive: s.isActive })}>
                        {s.isActive ? "Active" : "Inactive"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed"><CardContent className="text-center py-8 text-gray-500">No standards found. Add standards above.</CardContent></Card>
      )}

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Assessment Blueprints</h2>
          <Button onClick={() => setShowAddBlueprint(!showAddBlueprint)} className="bg-purple-700 hover:bg-purple-800">
            <Plus className="h-4 w-4 mr-1" /> New Blueprint
          </Button>
        </div>

        {showAddBlueprint && (
          <Card className="border-purple-200 mb-4">
            <CardHeader><CardTitle>Create Blueprint</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Blueprint Name</Label><Input placeholder="e.g., Grade 6 ELA Baseline" value={bpName} onChange={(e) => setBpName(e.target.value)} /></div>
                <div>
                  <Label>Grade</Label>
                  <Select value={bpGrade} onValueChange={setBpGrade}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">Grade 6</SelectItem>
                      <SelectItem value="7">Grade 7</SelectItem>
                      <SelectItem value="8">Grade 8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subject</Label>
                  <Select value={bpSubject} onValueChange={setBpSubject}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ELA">ELA</SelectItem>
                      <SelectItem value="Math">Math</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Total Items</Label><Input type="number" value={bpItems} onChange={(e) => setBpItems(e.target.value)} /></div>
                <div><Label>Time Limit (min)</Label><Input type="number" value={bpTime} onChange={(e) => setBpTime(e.target.value)} /></div>
              </div>
              <Button
                onClick={() => createBlueprintMutation.mutate({
                  name: bpName, gradeLevel: parseInt(bpGrade), subject: bpSubject,
                  standardIds: [], dokDistribution: { dok2: 40, dok3: 40, dok4: 20 },
                  totalItems: parseInt(bpItems), timeLimitMinutes: parseInt(bpTime), isActive: true, userRole: "admin",
                })}
                disabled={!bpName || createBlueprintMutation.isPending}
                className="bg-purple-700 hover:bg-purple-800"
              >
                {createBlueprintMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Blueprint
              </Button>
            </CardContent>
          </Card>
        )}

        {blueprintsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (blueprints || []).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blueprints!.map((b: any) => (
              <Card key={b.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-gray-800">{b.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">{b.subject}</Badge>
                    <Badge variant="secondary">Grade {b.gradeLevel}</Badge>
                    <Badge className="bg-blue-100 text-blue-700">{b.totalItems} items</Badge>
                    <Badge className="bg-green-100 text-green-700">{b.timeLimitMinutes} min</Badge>
                  </div>
                  <Button
                    size="sm"
                    className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 gap-1"
                    onClick={() => {
                      toast({ title: "Blueprint Assignment", description: `${b.name} is ready to assign. Go to the Assessments tab to create and assign an assessment from this blueprint.` });
                    }}
                  >
                    <Send className="h-3 w-3" />
                    Assign to Class
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed"><CardContent className="text-center py-8 text-gray-500">No blueprints yet.</CardContent></Card>
        )}
      </div>
    </div>
  );
}

function QuestionBankTab() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [dokFilter, setDokFilter] = useState("all");

  const queryParams = new URLSearchParams();
  if (statusFilter !== "all") queryParams.set("reviewStatus", statusFilter);
  if (dokFilter !== "all") queryParams.set("dokLevel", dokFilter);
  const url = `/api/acap/items${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const { data: items, isLoading } = useQuery<any[]>({
    queryKey: ["/api/acap/items", statusFilter, dokFilter],
    queryFn: () => fetch(url).then((r) => r.json()),
  });

  const { data: allItems } = useQuery<any[]>({ queryKey: ["/api/acap/items"] });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/acap/items/${id}`, { reviewStatus: status, reviewedBy: "admin" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/items"] });
      toast({ title: "Item review updated" });
    },
  });

  const totalCount = allItems?.length || 0;
  const pendingCount = allItems?.filter((i) => i.reviewStatus === "pending").length || 0;
  const approvedCount = allItems?.filter((i) => i.reviewStatus === "approved").length || 0;
  const rejectedCount = allItems?.filter((i) => i.reviewStatus === "rejected").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h2 className="text-xl font-bold text-gray-800">Question Bank</h2>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dokFilter} onValueChange={setDokFilter}>
            <SelectTrigger className="w-28"><SelectValue placeholder="DOK" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All DOK</SelectItem>
              <SelectItem value="1">DOK 1</SelectItem>
              <SelectItem value="2">DOK 2</SelectItem>
              <SelectItem value="3">DOK 3</SelectItem>
              <SelectItem value="4">DOK 4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-gray-50"><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{totalCount}</p><p className="text-xs text-gray-500">Total</p>
        </CardContent></Card>
        <Card className="bg-amber-50"><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p><p className="text-xs text-gray-500">Pending</p>
        </CardContent></Card>
        <Card className="bg-green-50"><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-green-600">{approvedCount}</p><p className="text-xs text-gray-500">Approved</p>
        </CardContent></Card>
        <Card className="bg-red-50"><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-red-600">{rejectedCount}</p><p className="text-xs text-gray-500">Rejected</p>
        </CardContent></Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (items || []).length > 0 ? (
        <div className="space-y-3">
          {items!.map((item: any) => (
            <Card key={item.id} className={item.reviewStatus === "pending" ? "border-amber-200" : item.reviewStatus === "rejected" ? "border-red-200" : ""}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">DOK {item.dokLevel}</Badge>
                  <Badge variant="secondary" className="text-xs">{(item.itemType || "").replace(/_/g, " ")}</Badge>
                  {item.aiGenerated && <Badge className="bg-purple-100 text-purple-700 text-xs"><Sparkles className="h-3 w-3 mr-1" /> AI Generated</Badge>}
                  <Badge className={`text-xs ml-auto ${item.reviewStatus === "approved" ? "bg-green-100 text-green-700" : item.reviewStatus === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {item.reviewStatus}
                  </Badge>
                </div>
                <p className="text-gray-800 font-medium">{item.stem}</p>
                {item.options && (item.options as any[]).length > 0 && (
                  <div className="space-y-1 ml-4">
                    {(item.options as any[]).map((opt: any) => (
                      <p key={opt.key} className={`text-sm ${JSON.stringify(item.correctAnswer) === JSON.stringify(opt.key) ? "text-green-700 font-medium" : "text-gray-600"}`}>
                        {opt.key}. {opt.text} {JSON.stringify(item.correctAnswer) === JSON.stringify(opt.key) ? "✓" : ""}
                      </p>
                    ))}
                  </div>
                )}
                {item.explanation && <p className="text-xs text-gray-500 italic">Explanation: {item.explanation}</p>}
                {item.reviewStatus === "pending" && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" onClick={() => reviewMutation.mutate({ id: item.id, status: "approved" })} disabled={reviewMutation.isPending} className="bg-green-600 hover:bg-green-700">
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reviewMutation.mutate({ id: item.id, status: "rejected" })} disabled={reviewMutation.isPending} className="border-red-300 text-red-600 hover:bg-red-50">
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-medium">{statusFilter === "pending" ? "All items reviewed!" : "No items found matching filters."}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AssessmentsTab() {
  const { toast } = useToast();
  const [subTab, setSubTab] = useState<"assessments" | "schoolwide-builder">("assessments");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [assessmentType, setAssessmentType] = useState("formative");
  const [gradeLevel, setGradeLevel] = useState("6");
  const [subject, setSubject] = useState("ELA");
  const [timeLimit, setTimeLimit] = useState("60");
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignAssessmentId, setAssignAssessmentId] = useState<number | null>(null);
  const [assignTargetType, setAssignTargetType] = useState("grade");
  const [assignTargetGrade, setAssignTargetGrade] = useState("6");
  const [assignTeacherId, setAssignTeacherId] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [selectedScholarIds, setSelectedScholarIds] = useState<string[]>([]);
  const [viewAssessment, setViewAssessment] = useState<any>(null);
  const [itemFilter, setItemFilter] = useState("approved");

  const [swSubject, setSwSubject] = useState("Math");
  const [swGrades, setSwGrades] = useState("6-8");
  const [swItemCount, setSwItemCount] = useState(50);
  const [swDok2, setSwDok2] = useState(30);
  const [swDok3, setSwDok3] = useState(50);
  const [swDok4, setSwDok4] = useState(20);
  const [swWritingType, setSwWritingType] = useState("argumentative");
  const [swDomainWeights, setSwDomainWeights] = useState<Record<string, number>>({});
  const [swGenerateVersions, setSwGenerateVersions] = useState(true);
  const [swVersionCount, setSwVersionCount] = useState(4);
  const [swCreatedDraft, setSwCreatedDraft] = useState<any>(null);

  const { data: assessments, isLoading: loadingAssessments } = useQuery<any[]>({ queryKey: ["/api/acap/assessments"] });
  const { data: items } = useQuery<any[]>({ queryKey: ["/api/acap/items"] });
  const { data: teachers } = useQuery<any[]>({ queryKey: ["/api/acap/teachers"] });
  const scholarUrl = `/api/acap/scholars?gradeLevel=${assignTargetGrade}`;
  const { data: scholars } = useQuery<any[]>({
    queryKey: ["/api/acap/scholars", assignTargetGrade],
    queryFn: () => fetch(scholarUrl).then((r) => r.json()),
    enabled: showAssignModal,
  });
  const { data: assignments } = useQuery<any[]>({ queryKey: ["/api/acap/admin/all-assignments"] });

  const availableItems = (items || []).filter((i: any) => {
    if (itemFilter === "approved") return i.reviewStatus === "approved";
    return true;
  });

  const createAssessmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/acap/assessments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/assessments"] });
      toast({ title: "Assessment created successfully!" });
      setShowCreate(false);
      setTitle(""); setSelectedItemIds([]);
    },
    onError: () => toast({ title: "Failed to create assessment", variant: "destructive" }),
  });

  const assignMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/acap/assignments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/admin/all-assignments"] });
      toast({ title: "Assessment assigned successfully!" });
      setShowAssignModal(false);
      setAssignAssessmentId(null);
      setSelectedScholarIds([]);
    },
    onError: () => toast({ title: "Failed to assign assessment", variant: "destructive" }),
  });

  const schoolwideBuilderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/acap/schoolwide-builder", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/forge/assessments"] });
      setSwCreatedDraft(data);
      toast({ title: "Forge Draft Created", description: `${data.matchedItemCount} items matched. ${data.versions?.length || 0} versions generated. Ready for publish in Forge tab.` });
    },
    onError: async (err: any) => {
      let msg = err.message || "Failed to create schoolwide assessment";
      try { const body = await err.json?.(); if (body?.error) msg = body.error; } catch {}
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const { data: standards } = useQuery<any[]>({ queryKey: ["/api/acap/standards"] });

  useEffect(() => {
    if (standards && standards.length > 0 && Object.keys(swDomainWeights).length === 0) {
      const domains = Array.from(new Set((standards || []).map((s: any) => s.domain).filter(Boolean)));
      const weights: Record<string, number> = {};
      domains.forEach(d => { weights[d] = Math.round(100 / domains.length); });
      setSwDomainWeights(weights);
    }
  }, [standards]);

  const toggleItem = (id: number) => {
    setSelectedItemIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleScholar = (id: string) => {
    setSelectedScholarIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const openAssign = (assessmentId: number) => {
    setAssignAssessmentId(assessmentId);
    setShowAssignModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 mb-4">
        <button
          onClick={() => setSubTab("assessments")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${subTab === "assessments" ? "bg-indigo-700 text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}
        >
          <ClipboardList className="h-4 w-4" /> Assessments
        </button>
        <button
          onClick={() => setSubTab("schoolwide-builder")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${subTab === "schoolwide-builder" ? "bg-emerald-700 text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}
        >
          <BookOpen className="h-4 w-4" /> Schoolwide Builder
        </button>
      </div>

      {subTab === "schoolwide-builder" && (
        <div className="space-y-6">
          <Card className="border-emerald-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" /> Schoolwide Assessment Builder
              </CardTitle>
              <CardDescription>Configure and generate assessment items using Gemini AI. Items are automatically created, saved to the question bank, and bundled into a Forge assessment draft.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Content Area</Label>
                  <Select value={swSubject} onValueChange={setSwSubject}>
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
                  <Input value={swGrades} onChange={(e) => setSwGrades(e.target.value)} placeholder="6-8" className="mt-1 text-sm" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Item Count</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <input type="range" min={10} max={100} value={swItemCount} onChange={(e) => setSwItemCount(parseInt(e.target.value))} className="flex-1 h-2 bg-gradient-to-r from-emerald-200 to-emerald-500 rounded-lg appearance-none cursor-pointer" />
                    <span className="text-sm font-bold text-emerald-700 w-8">{swItemCount}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Versions</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Checkbox checked={swGenerateVersions} onCheckedChange={(v) => setSwGenerateVersions(!!v)} />
                    <span className="text-xs text-gray-600">Generate</span>
                    {swGenerateVersions && (
                      <Select value={String(swVersionCount)} onValueChange={(v) => setSwVersionCount(parseInt(v))}>
                        <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="8">8</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">DOK Mix</Label>
                <div className="space-y-2 mt-2">
                  {[
                    { label: "DOK 2", val: swDok2, set: setSwDok2, color: "from-blue-200 to-blue-500" },
                    { label: "DOK 3", val: swDok3, set: setSwDok3, color: "from-green-200 to-green-500" },
                    { label: "DOK 4", val: swDok4, set: setSwDok4, color: "from-purple-200 to-purple-500" },
                  ].map((d) => (
                    <div key={d.label} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-14">{d.label}</span>
                      <input type="range" min={0} max={100} value={d.val} onChange={(e) => d.set(parseInt(e.target.value))} className={`flex-1 h-2 bg-gradient-to-r ${d.color} rounded-lg appearance-none cursor-pointer`} />
                      <span className="text-xs font-bold text-gray-700 w-10">{d.val}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {Object.keys(swDomainWeights).length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Blueprint Domain Weights</Label>
                  <div className="space-y-2 mt-2">
                    {Object.entries(swDomainWeights).map(([domain, weight]) => (
                      <div key={domain} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 flex-1 truncate">{domain}</span>
                        <input type="range" min={0} max={100} value={weight} onChange={(e) => setSwDomainWeights((prev) => ({ ...prev, [domain]: parseInt(e.target.value) }))} className="w-24 h-2 bg-gradient-to-r from-gray-200 to-gray-500 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-xs font-bold text-gray-700 w-10">{weight}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {swSubject === "ELA" && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Writing Task Type</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {["Argumentative", "Persuasive", "Informational", "Research"].map((type) => (
                      <label key={type} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${swWritingType === type.toLowerCase() ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <input type="radio" name="swWritingType" value={type.toLowerCase()} checked={swWritingType === type.toLowerCase()} onChange={(e) => setSwWritingType(e.target.value)} className="accent-emerald-600" />
                        <span className="text-xs font-medium text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => {
                  const grades = swGrades.split("-").map(Number).filter(Boolean);
                  const gradeLevels = grades.length === 2 ? Array.from({ length: grades[1] - grades[0] + 1 }, (_, i) => grades[0] + i) : grades;
                  setSwCreatedDraft(null);
                  schoolwideBuilderMutation.mutate({
                    subject: swSubject,
                    gradeLevels,
                    itemCount: swItemCount,
                    dokMix: { dok2: swDok2, dok3: swDok3, dok4: swDok4 },
                    domainWeights: swDomainWeights,
                    writingTypes: [swWritingType],
                    generateVersions: swGenerateVersions ? swVersionCount : false,
                  });
                }}
                disabled={schoolwideBuilderMutation.isPending}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 text-sm font-bold shadow-lg"
              >
                {schoolwideBuilderMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gemini AI is generating {swItemCount} items... This may take 30-60 seconds
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Assessment with Gemini AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {swCreatedDraft && (
            <Card className="border-emerald-300 bg-emerald-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle className="h-5 w-5" /> Forge Draft Created
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs text-gray-500">Title</p>
                    <p className="text-sm font-semibold text-gray-800">{swCreatedDraft.forgeAssessment?.title}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs text-gray-500">AI-Generated Items</p>
                    <p className="text-lg font-bold text-emerald-700">{swCreatedDraft.matchedItemCount}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs text-gray-500">Versions</p>
                    <p className="text-lg font-bold text-indigo-700">{swCreatedDraft.versions?.length || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs text-gray-500">Status</p>
                    <Badge className="bg-amber-100 text-amber-700 mt-1">{swCreatedDraft.forgeAssessment?.status}</Badge>
                  </div>
                </div>
                {swCreatedDraft.dokDistribution && (
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs text-gray-500 mb-1">DOK Distribution</p>
                    <div className="flex gap-3">
                      {Object.entries(swCreatedDraft.dokDistribution).map(([dok, count]: [string, any]) => (
                        <Badge key={dok} variant="outline" className="text-xs">{dok.toUpperCase()}: {count}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(swCreatedDraft.versions || []).length > 0 && (
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs text-gray-500 mb-2">Version Access Codes</p>
                    <div className="flex flex-wrap gap-2">
                      {swCreatedDraft.versions.map((v: any) => (
                        <Badge key={v.id} className="bg-indigo-100 text-indigo-700 font-mono text-xs">
                          {v.versionLabel}: {v.accessCode}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500">Go to the <span className="font-semibold text-indigo-600">Forge</span> tab to publish this assessment and generate printable versions.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {subTab === "assessments" && (
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Assessment Management</h2>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-indigo-700 hover:bg-indigo-800">
          <Plus className="h-4 w-4 mr-1" /> Create Assessment
        </Button>
      </div>

      {showCreate && (
        <Card className="border-indigo-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-indigo-600" /> Create New Assessment</CardTitle>
            <CardDescription>Build an assessment from approved questions in the bank</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label>Assessment Title</Label>
                <Input placeholder="e.g., Grade 6 ELA Midterm Assessment" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={assessmentType} onValueChange={setAssessmentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formative">Formative</SelectItem>
                    <SelectItem value="summative">Summative</SelectItem>
                    <SelectItem value="diagnostic">Diagnostic</SelectItem>
                    <SelectItem value="benchmark">Benchmark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Grade Level</Label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">Grade 6</SelectItem>
                    <SelectItem value="7">Grade 7</SelectItem>
                    <SelectItem value="8">Grade 8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ELA">ELA</SelectItem>
                    <SelectItem value="Math">Math</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Time Limit (min)</Label>
                <Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Select Questions from Bank ({selectedItemIds.length} selected)</Label>
                <Select value={itemFilter} onValueChange={setItemFilter}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved Only</SelectItem>
                    <SelectItem value="all">All Items</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
                {availableItems.length > 0 ? availableItems.map((item: any) => (
                  <div key={item.id} className={`flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer ${selectedItemIds.includes(item.id) ? "bg-indigo-50 border-l-4 border-l-indigo-500" : ""}`}
                    onClick={() => toggleItem(item.id)}>
                    <Checkbox checked={selectedItemIds.includes(item.id)} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.stem}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">DOK {item.dokLevel}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{(item.itemType || "").replace(/_/g, " ")}</Badge>
                        <Badge className={`text-[10px] ${item.reviewStatus === "approved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{item.reviewStatus}</Badge>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-gray-500 text-sm">No questions available. Generate items in AI Settings first.</div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t">
              <Button
                onClick={() => createAssessmentMutation.mutate({
                  title, assessmentType, gradeLevel: parseInt(gradeLevel), subject,
                  itemIds: selectedItemIds, timeLimitMinutes: parseInt(timeLimit),
                  isAdaptive: false, settings: {}, createdBy: "admin", isActive: true,
                })}
                disabled={!title || selectedItemIds.length === 0 || createAssessmentMutation.isPending}
                className="bg-indigo-700 hover:bg-indigo-800"
              >
                {createAssessmentMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ClipboardList className="h-4 w-4 mr-2" />}
                Create Assessment ({selectedItemIds.length} questions)
              </Button>
              <Button variant="outline" onClick={() => { setShowCreate(false); setSelectedItemIds([]); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingAssessments ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (assessments || []).length > 0 ? (
        <div className="space-y-4">
          {(assessments || []).map((a: any) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg">{a.title || `Assessment #${a.id}`}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline">{a.subject}</Badge>
                      <Badge variant="secondary">Grade {a.gradeLevel}</Badge>
                      <Badge className="bg-blue-100 text-blue-700">{a.assessmentType}</Badge>
                      <Badge className="bg-purple-100 text-purple-700">{(a.itemIds as number[])?.length || 0} questions</Badge>
                      <Badge className="bg-green-100 text-green-700">{a.timeLimitMinutes || 60} min</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Created: {new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setViewAssessment(viewAssessment?.id === a.id ? null : a)}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    <Button size="sm" onClick={() => openAssign(a.id)} className="bg-indigo-700 hover:bg-indigo-800">
                      <Send className="h-4 w-4 mr-1" /> Assign
                    </Button>
                  </div>
                </div>

                {viewAssessment?.id === a.id && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2">Questions ({(a.itemIds as number[])?.length || 0})</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {(items || []).filter((i: any) => (a.itemIds as number[])?.includes(i.id)).map((item: any, idx: number) => (
                        <div key={item.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm">
                          <span className="text-indigo-600 font-mono font-medium shrink-0">{idx + 1}.</span>
                          <div className="flex-1">
                            <p className="text-gray-700">{item.stem}</p>
                            <div className="flex gap-1 mt-1">
                              <Badge variant="outline" className="text-[10px]">DOK {item.dokLevel}</Badge>
                              <Badge variant="secondary" className="text-[10px]">{(item.itemType || "").replace(/_/g, " ")}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No assessments created yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "Create Assessment" to build your first assessment from the question bank</p>
          </CardContent>
        </Card>
      )}

      {(assignments || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-indigo-600" /> Active Assignments</CardTitle>
            <CardDescription>Assessments currently assigned to teachers and scholars</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(assignments || []).map((assign: any) => (
                <div key={assign.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{assign.assessmentTitle || `Assessment #${assign.assessmentId}`}</p>
                    <p className="text-xs text-gray-400">
                      {assign.subject} • Grade {assign.gradeLevel} • Assigned to: {assign.targetType === "all" ? "All Students" : `${(assign.targetIds as string[])?.length || 0} scholars`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={assign.status === "active" ? "default" : "secondary"}>{assign.status}</Badge>
                    {assign.dueDate && <span className="text-xs text-gray-400">Due: {new Date(assign.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      </div>)}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-indigo-600" /> Assign Assessment</CardTitle>
              <CardDescription>Assign this assessment to teachers or scholars</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Assign To</Label>
                <Select value={assignTargetType} onValueChange={setAssignTargetType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grade">Entire Grade Level</SelectItem>
                    <SelectItem value="individual">Individual Scholars</SelectItem>
                    <SelectItem value="all">All Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {assignTargetType !== "all" && (
                <div>
                  <Label>Grade Level</Label>
                  <Select value={assignTargetGrade} onValueChange={setAssignTargetGrade}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">Grade 6</SelectItem>
                      <SelectItem value="7">Grade 7</SelectItem>
                      <SelectItem value="8">Grade 8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Assigning Teacher</Label>
                <Select value={assignTeacherId} onValueChange={setAssignTeacherId}>
                  <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>
                    {(teachers || []).map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name} — {t.gradeRole || t.subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {assignTargetType === "individual" && (
                <div>
                  <Label className="mb-2 block">Select Scholars ({selectedScholarIds.length} selected)</Label>
                  <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {(scholars || []).map((s: any) => (
                      <div key={s.id} className={`flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer ${selectedScholarIds.includes(s.id) ? "bg-indigo-50" : ""}`}
                        onClick={() => toggleScholar(s.id)}>
                        <Checkbox checked={selectedScholarIds.includes(s.id)} />
                        <span className="text-sm">{s.name} — Grade {s.grade}</span>
                      </div>
                    ))}
                    {(!scholars || scholars.length === 0) && <p className="text-center text-gray-400 py-4 text-sm">No scholars in this grade</p>}
                  </div>
                </div>
              )}

              <div>
                <Label>Due Date (optional)</Label>
                <Input type="date" value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    let targetIds: string[] = [];
                    if (assignTargetType === "individual") targetIds = selectedScholarIds;
                    else if (assignTargetType === "grade") targetIds = (scholars || []).map((s: any) => s.id);

                    assignMutation.mutate({
                      assessmentId: assignAssessmentId,
                      teacherId: assignTeacherId || "admin",
                      targetType: assignTargetType,
                      targetIds,
                      dueDate: assignDueDate ? new Date(assignDueDate).toISOString() : null,
                      status: "active",
                    });
                  }}
                  disabled={!assignTeacherId || assignMutation.isPending || (assignTargetType === "individual" && selectedScholarIds.length === 0)}
                  className="bg-indigo-700 hover:bg-indigo-800 flex-1"
                >
                  {assignMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Assign Assessment
                </Button>
                <Button variant="outline" onClick={() => { setShowAssignModal(false); setSelectedScholarIds([]); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function AssessmentCompletionTab() {
  const { data: attempts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/acap/admin/all-attempts"],
  });
  const { data: assessments } = useQuery<any[]>({ queryKey: ["/api/acap/assessments"] });
  const { data: scholars } = useQuery<any[]>({
    queryKey: ["/api/acap/scholars"],
  });

  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("completed");

  const completedAttempts = (attempts || []).filter((a: any) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (gradeFilter !== "all" && a.gradeLevel !== parseInt(gradeFilter)) return false;
    return true;
  });

  const scholarMap: Record<string, string> = {};
  (scholars || []).forEach((s: any) => { scholarMap[s.id] = s.name; });

  const totalCompleted = completedAttempts.filter((a: any) => a.status === "completed").length;
  const avgScore = totalCompleted > 0
    ? completedAttempts.filter((a: any) => a.status === "completed").reduce((s: number, a: any) => s + (a.percentCorrect || 0), 0) / totalCompleted
    : 0;

  const proficient = completedAttempts.filter((a: any) => a.status === "completed" && (a.percentCorrect || 0) >= 70).length;
  const needsSupport = completedAttempts.filter((a: any) => a.status === "completed" && (a.percentCorrect || 0) < 40).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Assessment Completion Details</h2>
        <div className="flex gap-2">
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="6">Grade 6</SelectItem>
              <SelectItem value="7">Grade 7</SelectItem>
              <SelectItem value="8">Grade 8</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="pt-5 text-center">
            <FileText className="h-7 w-7 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-600">{completedAttempts.length}</p>
            <p className="text-xs text-gray-500">Total Attempts</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-5 text-center">
            <CheckCircle className="h-7 w-7 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">{totalCompleted}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-indigo-50">
          <CardContent className="pt-5 text-center">
            <TrendingUp className="h-7 w-7 text-indigo-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-indigo-600">{Math.round(avgScore)}%</p>
            <p className="text-xs text-gray-500">Average Score</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-5 text-center">
            <Award className="h-7 w-7 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-600">{proficient}</p>
            <p className="text-xs text-gray-500">Proficient (70%+)</p>
          </CardContent>
        </Card>
      </div>

      {needsSupport > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-700"><strong>{needsSupport} scholar{needsSupport !== 1 ? "s" : ""}</strong> scored below 40% and may need Boot Camp intervention.</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : completedAttempts.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Attempt Results</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium">Scholar</th>
                    <th className="text-left p-3 font-medium">Assessment</th>
                    <th className="text-left p-3 font-medium">Subject</th>
                    <th className="text-left p-3 font-medium">Grade</th>
                    <th className="text-left p-3 font-medium">Score</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {completedAttempts.slice(0, 50).map((a: any) => (
                    <tr key={a.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{scholarMap[a.scholarId] || a.scholarId}</td>
                      <td className="p-3">{a.assessmentTitle || `#${a.assessmentId}`}</td>
                      <td className="p-3"><Badge variant="outline">{a.subject}</Badge></td>
                      <td className="p-3">Grade {a.gradeLevel}</td>
                      <td className="p-3">
                        {a.status === "completed" ? (
                          <span className={`font-bold ${(a.percentCorrect || 0) >= 70 ? "text-green-600" : (a.percentCorrect || 0) >= 40 ? "text-amber-600" : "text-red-600"}`}>
                            {Math.round(a.percentCorrect || 0)}%
                          </span>
                        ) : "—"}
                      </td>
                      <td className="p-3">
                        <Badge className={a.status === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{a.status}</Badge>
                      </td>
                      <td className="p-3 text-gray-500">{a.completedAt ? new Date(a.completedAt).toLocaleDateString() : a.startedAt ? new Date(a.startedAt).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {completedAttempts.length > 50 && <p className="text-xs text-gray-400 text-center mt-3">Showing first 50 of {completedAttempts.length} attempts</p>}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No assessment attempts yet</p>
            <p className="text-gray-400 text-sm mt-1">Results will appear here once scholars begin taking assigned assessments</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AISettingsTab() {
  const { toast } = useToast();
  const [selectedStandard, setSelectedStandard] = useState("");
  const [dokLevel, setDokLevel] = useState("2");
  const [itemType, setItemType] = useState("multiple_choice");
  const [count, setCount] = useState("5");

  const { data: standards } = useQuery<any[]>({ queryKey: ["/api/acap/standards"] });

  const selectedStd = standards?.find((s) => String(s.id) === selectedStandard);
  const autoSubject = selectedStd?.domain === "Math" ? "Math" : "ELA";

  const generateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/acap/items/generate", data),
    onSuccess: async (res) => {
      const generated = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/acap/items"] });
      toast({ title: `Generated ${Array.isArray(generated) ? generated.length : 0} items successfully` });
    },
    onError: () => toast({ title: "Failed to generate items", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">AI Settings & Item Generation</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-purple-600" /> AI Model Configuration</CardTitle>
          <CardDescription>Current model used for item generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <div>
              <p className="font-semibold text-gray-800">GPT-4o</p>
              <p className="text-sm text-gray-600">OpenAI's latest model — used for generating assessment items, passages, and auto-grading</p>
            </div>
            <Badge className="bg-green-100 text-green-700 ml-auto">Active</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500" /> Generate Test Items</CardTitle>
          <CardDescription>Select parameters and generate AI-powered assessment items</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Standard</Label>
              <Select value={selectedStandard} onValueChange={setSelectedStandard}>
                <SelectTrigger><SelectValue placeholder="Select a standard" /></SelectTrigger>
                <SelectContent>
                  {(standards || []).map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.code} — {s.description?.substring(0, 60)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>DOK Level</Label>
              <Select value={dokLevel} onValueChange={setDokLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">DOK 2 — Skill/Concept</SelectItem>
                  <SelectItem value="3">DOK 3 — Strategic Thinking</SelectItem>
                  <SelectItem value="4">DOK 4 — Extended Thinking</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Item Type</Label>
              <Select value={itemType} onValueChange={setItemType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="constructed_response">Constructed Response</SelectItem>
                  <SelectItem value="multi_select">Multi-Select</SelectItem>
                  <SelectItem value="evidence_based">Evidence-Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Count</Label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 items</SelectItem>
                  <SelectItem value="5">5 items</SelectItem>
                  <SelectItem value="10">10 items</SelectItem>
                  <SelectItem value="15">15 items</SelectItem>
                  <SelectItem value="20">20 items</SelectItem>
                  <SelectItem value="25">25 items</SelectItem>
                  <SelectItem value="30">30 items</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedStd && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p><span className="font-medium">Subject:</span> {autoSubject}</p>
              <p><span className="font-medium">Standard:</span> {selectedStd.code} — {selectedStd.description}</p>
            </div>
          )}
          <Button
            onClick={() => generateMutation.mutate({ standardId: parseInt(selectedStandard), dokLevel: parseInt(dokLevel), itemType, count: parseInt(count), subject: autoSubject })}
            disabled={!selectedStandard || generateMutation.isPending}
            className="bg-purple-700 hover:bg-purple-800 w-full"
          >
            {generateMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Items...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate {count} Items</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsTab() {
  const { data: schoolReport, isLoading } = useQuery<any>({
    queryKey: ["/api/acap/admin/school-report"],
    queryFn: () => fetch("/api/acap/admin/school-report").then((r) => r.json()),
  });
  const { data: standards } = useQuery<any[]>({ queryKey: ["/api/acap/standards"] });
  const { data: items } = useQuery<any[]>({ queryKey: ["/api/acap/items"] });
  const { data: teachers } = useQuery<any[]>({ queryKey: ["/api/acap/teachers"] });

  const allItems = items || [];
  const allStandards = standards || [];
  const allTeachers = teachers || [];

  const standardsWithItems = new Set(allItems.map((i) => i.standardId));
  const coveragePercent = allStandards.length > 0 ? Math.round((standardsWithItems.size / allStandards.length) * 100) : 0;

  const itemsByType: Record<string, number> = {};
  const itemsByDok: Record<number, number> = {};
  allItems.forEach((i) => {
    const t = (i.itemType || "unknown").replace(/_/g, " ");
    itemsByType[t] = (itemsByType[t] || 0) + 1;
    itemsByDok[i.dokLevel] = (itemsByDok[i.dokLevel] || 0) + 1;
  });

  const summary = schoolReport?.summary || {};
  const gradeReport = schoolReport?.gradeReport || [];
  const subjectReport = schoolReport?.subjectReport || [];
  const teacherReport = schoolReport?.teacherReport || [];
  const masteryByLevel = schoolReport?.masteryByLevel || {};
  const profDist = schoolReport?.proficiencyDist || {};

  const teacherMap: Record<string, string> = {};
  allTeachers.forEach((t: any) => { teacherMap[t.id] = t.name; });

  const maxGradeScore = Math.max(...gradeReport.map((g: any) => g.avgScore), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">School-Wide EduCAP Reports</h2>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-5 text-center">
              <Target className="h-7 w-7 text-indigo-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-indigo-600">{summary.totalStandards || allStandards.length}</p>
              <p className="text-xs text-gray-500">Standards</p>
            </CardContent></Card>
            <Card><CardContent className="pt-5 text-center">
              <BookOpen className="h-7 w-7 text-purple-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-600">{summary.totalItems || allItems.length}</p>
              <p className="text-xs text-gray-500">Total Items</p>
            </CardContent></Card>
            <Card><CardContent className="pt-5 text-center">
              <FileText className="h-7 w-7 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-600">{summary.totalAssessments || 0}</p>
              <p className="text-xs text-gray-500">Assessments</p>
            </CardContent></Card>
            <Card><CardContent className="pt-5 text-center">
              <Users className="h-7 w-7 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-600">{summary.uniqueScholars || 0}</p>
              <p className="text-xs text-gray-500">Active Scholars</p>
            </CardContent></Card>
          </div>

          {summary.completedAttempts > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><CardContent className="pt-5 text-center">
                <TrendingUp className="h-7 w-7 text-indigo-500 mx-auto mb-1" />
                <p className="text-3xl font-bold text-indigo-600">{summary.averageScore || 0}%</p>
                <p className="text-xs text-gray-500">School-Wide Avg Score</p>
              </CardContent></Card>
              <Card><CardContent className="pt-5 text-center">
                <CheckCircle className="h-7 w-7 text-green-500 mx-auto mb-1" />
                <p className="text-3xl font-bold text-green-600">{summary.completedAttempts || 0}</p>
                <p className="text-xs text-gray-500">Completed Attempts</p>
              </CardContent></Card>
              <Card><CardContent className="pt-5 text-center">
                <Send className="h-7 w-7 text-blue-500 mx-auto mb-1" />
                <p className="text-3xl font-bold text-blue-600">{summary.totalAssignments || 0}</p>
                <p className="text-xs text-gray-500">Total Assignments</p>
              </CardContent></Card>
            </div>
          )}

          {gradeReport.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-indigo-600" /> Performance by Grade Level</CardTitle>
                <CardDescription>Compare average scores across grade levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gradeReport.map((g: any) => (
                    <div key={g.grade} className="flex items-center gap-4">
                      <span className="text-sm font-bold w-20">Grade {g.grade}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden relative">
                        <div className={`h-full rounded-full flex items-center justify-end pr-3 transition-all ${g.avgScore >= 70 ? "bg-green-500" : g.avgScore >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${Math.max((g.avgScore / 100) * 100, 5)}%` }}>
                          <span className="text-xs text-white font-bold">{g.avgScore}%</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 w-32">
                        <p className="text-xs text-gray-500">{g.completedAttempts} completed</p>
                        <p className="text-xs text-gray-400">{g.uniqueScholars} scholars</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {subjectReport.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5 text-purple-600" /> Performance by Subject</CardTitle>
                <CardDescription>Compare and contrast results across content areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {subjectReport.map((s: any) => (
                    <div key={s.subject} className={`p-5 rounded-lg border-2 text-center ${s.avgScore >= 70 ? "border-green-200 bg-green-50" : s.avgScore >= 40 ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
                      <h3 className="text-lg font-bold text-gray-800">{s.subject}</h3>
                      <p className={`text-4xl font-bold mt-2 ${s.avgScore >= 70 ? "text-green-600" : s.avgScore >= 40 ? "text-amber-600" : "text-red-600"}`}>{s.avgScore}%</p>
                      <p className="text-xs text-gray-500 mt-2">{s.completedAttempts} completed / {s.totalAttempts} total</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {teacherReport.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-600" /> Teacher Performance Overview</CardTitle>
                <CardDescription>Assessment usage and student performance by teacher</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-medium">Teacher</th>
                        <th className="text-center p-3 font-medium">Assignments</th>
                        <th className="text-center p-3 font-medium">Attempts</th>
                        <th className="text-center p-3 font-medium">Completed</th>
                        <th className="text-center p-3 font-medium">Avg Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherReport.map((t: any) => (
                        <tr key={t.teacherId} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{teacherMap[t.teacherId] || t.teacherId}</td>
                          <td className="p-3 text-center">{t.assignments}</td>
                          <td className="p-3 text-center">{t.totalAttempts}</td>
                          <td className="p-3 text-center">{t.completedAttempts}</td>
                          <td className="p-3 text-center">
                            <span className={`font-bold ${t.avgScore >= 70 ? "text-green-600" : t.avgScore >= 40 ? "text-amber-600" : t.avgScore > 0 ? "text-red-600" : "text-gray-400"}`}>
                              {t.avgScore > 0 ? `${t.avgScore}%` : "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {Object.values(profDist).some((v: any) => v > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Proficiency Distribution</CardTitle>
                <CardDescription>Score distribution across all completed assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{profDist.below40 || 0}</p>
                    <p className="text-xs text-gray-500">Below 40%</p>
                    <p className="text-[10px] text-red-400">Needs Support</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">{profDist["40to59"] || 0}</p>
                    <p className="text-xs text-gray-500">40-59%</p>
                    <p className="text-[10px] text-amber-400">Developing</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{profDist["60to79"] || 0}</p>
                    <p className="text-xs text-gray-500">60-79%</p>
                    <p className="text-[10px] text-blue-400">Proficient</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{profDist["80to100"] || 0}</p>
                    <p className="text-xs text-gray-500">80-100%</p>
                    <p className="text-[10px] text-green-400">Mastered</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {Object.values(masteryByLevel).some((v: any) => v > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Standards Mastery Levels</CardTitle>
                <CardDescription>Distribution of scholar mastery across all standards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-3 text-center">
                  {[
                    { key: "mastered", label: "Mastered", color: "text-green-600", bg: "bg-green-50" },
                    { key: "proficient", label: "Proficient", color: "text-blue-600", bg: "bg-blue-50" },
                    { key: "developing", label: "Developing", color: "text-amber-600", bg: "bg-amber-50" },
                    { key: "beginning", label: "Beginning", color: "text-red-600", bg: "bg-red-50" },
                    { key: "not_started", label: "Not Started", color: "text-gray-600", bg: "bg-gray-50" },
                  ].map((level) => (
                    <div key={level.key} className={`${level.bg} p-3 rounded-lg`}>
                      <p className={`text-2xl font-bold ${level.color}`}>{masteryByLevel[level.key] || 0}</p>
                      <p className="text-xs text-gray-500">{level.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Standards Coverage</CardTitle><CardDescription>How many standards have at least one item</CardDescription></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full flex items-center justify-center transition-all" style={{ width: `${Math.max(coveragePercent, 3)}%` }}>
                    <span className="text-xs text-white font-medium">{coveragePercent}%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 shrink-0">{standardsWithItems.size} / {allStandards.length}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Item Distribution by Type</CardTitle></CardHeader>
              <CardContent>
                {Object.keys(itemsByType).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(itemsByType).map(([type, cnt]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-100 rounded-full h-3">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(cnt / allItems.length) * 100}%` }} />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{cnt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No items yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Item Distribution by DOK Level</CardTitle></CardHeader>
              <CardContent>
                {Object.keys(itemsByDok).length > 0 ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].filter((d) => itemsByDok[d]).map((d) => (
                      <div key={d} className="flex items-center justify-between">
                        <span className="text-sm">DOK {d}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-100 rounded-full h-3">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(itemsByDok[d] / allItems.length) * 100}%` }} />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{itemsByDok[d]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No items yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Item Review Status</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">{allItems.filter((i) => i.reviewStatus === "pending").length}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{allItems.filter((i) => i.reviewStatus === "approved").length}</p>
                  <p className="text-sm text-gray-500">Approved</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{allItems.filter((i) => i.reviewStatus === "rejected").length}</p>
                  <p className="text-sm text-gray-500">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function BootCampTab() {
  const { data: auditLog } = useQuery<any[]>({ queryKey: ["/api/acap/audit-log"] });

  const bootcampEntries = (auditLog || []).filter((e: any) =>
    e.action?.includes("bootcamp") || e.entityType === "bootcamp"
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Boot Camp Sessions</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-indigo-600" /> About Boot Camp</CardTitle>
          <CardDescription>Intensive remediation sessions for scholars needing extra support</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <PlayCircle className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Adaptive Learning</p>
              <p className="text-xs text-gray-500 mt-1">AI-powered tutoring sessions that adapt to each scholar's needs</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Progress Tracking</p>
              <p className="text-xs text-gray-500 mt-1">Real-time mastery tracking across standards and DOK levels</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Standards-Aligned</p>
              <p className="text-xs text-gray-500 mt-1">Sessions tied to specific EduCAP standards for targeted support</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Boot Camp Activity Log</CardTitle>
          <CardDescription>Recent boot camp related activity from audit log</CardDescription>
        </CardHeader>
        <CardContent>
          {bootcampEntries.length > 0 ? (
            <div className="space-y-2">
              {bootcampEntries.map((entry: any) => (
                <div key={entry.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <GraduationCap className="h-4 w-4 text-indigo-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{entry.action.replace(/_/g, " ")}</p>
                    <p className="text-xs text-gray-400">{entry.userRole || "scholar"} • {entry.entityType} #{entry.entityId}</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <GraduationCap className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No boot camp sessions recorded yet.</p>
              <p className="text-xs text-gray-400 mt-1">Sessions will appear here as scholars use the boot camp feature.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
