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
import { useLocation } from "wouter";
import {
  ArrowLeft, BookOpen, Target, BarChart3, Shield, Settings, Brain,
  Plus, Loader2, CheckCircle, Clock, AlertTriangle, Eye,
  Database, FileText, History, Check, X, Sparkles, Users,
  GraduationCap, Zap, Activity, TrendingUp, Layers, PlayCircle
} from "lucide-react";

type Tab = "overview" | "blueprints-standards" | "question-bank" | "ai-settings" | "reports" | "bootcamp";

export default function AdminAcap() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) { setLocation("/admin-login"); return; }
        const res = await fetch("/api/admin-auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setAdminData(data);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("adminToken");
          setLocation("/admin-login");
        }
      } catch {
        setLocation("/admin-login");
      } finally {
        setAuthLoading(false);
      }
    };
    verifyAdmin();
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
    { id: "ai-settings", label: "AI Settings", icon: Brain },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "bootcamp", label: "Boot Camp", icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-slate-800 to-indigo-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => setLocation("/admin")}>
              <ArrowLeft className="h-5 w-5 mr-1" /> Back to Admin Dashboard
            </Button>
            <div className="border-l border-white/30 pl-4">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6" /> ACAP Admin Portal
              </h1>
              <p className="text-slate-300 text-sm">
                {adminData?.firstName} {adminData?.lastName} — {adminData?.title || "Administrator"}
              </p>
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
        {activeTab === "ai-settings" && <AISettingsTab />}
        {activeTab === "reports" && <ReportsTab />}
        {activeTab === "bootcamp" && <BootCampTab />}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Standards by Grade Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[{ grade: 6, count: grade6 }, { grade: 7, count: grade7 }, { grade: 8, count: grade8 }].map((g) => (
              <div key={g.grade} className="flex items-center gap-3">
                <span className="text-sm font-medium w-16">Grade {g.grade}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${Math.max((g.count / maxGrade) * 100, 5)}%` }}
                  >
                    <span className="text-xs text-white font-medium">{g.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Last 10 audit log entries</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((entry: any) => (
                <div key={entry.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <History className="h-4 w-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.action.replace(/_/g, " ")}</p>
                    <p className="text-xs text-gray-400">
                      {entry.entityType} #{entry.entityId} • {entry.userRole || "system"}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
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
                      <Button
                        size="sm"
                        variant={s.isActive ? "default" : "outline"}
                        className={`text-xs h-7 ${s.isActive ? "bg-green-600 hover:bg-green-700" : "text-red-500 border-red-200"}`}
                        onClick={() => toggleActiveMutation.mutate({ id: s.id, isActive: s.isActive })}
                      >
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
            <Card key={item.id} className={
              item.reviewStatus === "pending" ? "border-amber-200" :
              item.reviewStatus === "rejected" ? "border-red-200" : ""
            }>
              <CardContent className="pt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">DOK {item.dokLevel}</Badge>
                  <Badge variant="secondary" className="text-xs">{(item.itemType || "").replace(/_/g, " ")}</Badge>
                  {item.aiGenerated && (
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      <Sparkles className="h-3 w-3 mr-1" /> AI Generated
                    </Badge>
                  )}
                  <Badge className={`text-xs ml-auto ${
                    item.reviewStatus === "approved" ? "bg-green-100 text-green-700" :
                    item.reviewStatus === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
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
            <p className="text-green-700 font-medium">
              {statusFilter === "pending" ? "All items reviewed!" : "No items found matching filters."}
            </p>
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
              <Input type="number" min="1" max="20" value={count} onChange={(e) => setCount(e.target.value)} />
            </div>
          </div>
          {selectedStd && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p><span className="font-medium">Subject:</span> {autoSubject}</p>
              <p><span className="font-medium">Standard:</span> {selectedStd.code} — {selectedStd.description}</p>
            </div>
          )}
          <Button
            onClick={() => generateMutation.mutate({
              standardId: parseInt(selectedStandard),
              dokLevel: parseInt(dokLevel),
              itemType,
              count: parseInt(count),
              subject: autoSubject,
            })}
            disabled={!selectedStandard || generateMutation.isPending}
            className="bg-purple-700 hover:bg-purple-800 w-full"
          >
            {generateMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Items...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate {count} Items</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsTab() {
  const { data: standards } = useQuery<any[]>({ queryKey: ["/api/acap/standards"] });
  const { data: items } = useQuery<any[]>({ queryKey: ["/api/acap/items"] });
  const { data: assessments } = useQuery<any[]>({ queryKey: ["/api/acap/assessments"] });
  const { data: blueprints } = useQuery<any[]>({ queryKey: ["/api/acap/blueprints"] });

  const allItems = items || [];
  const allStandards = standards || [];

  const standardsWithItems = new Set(allItems.map((i) => i.standardId));
  const coveragePercent = allStandards.length > 0 ? Math.round((standardsWithItems.size / allStandards.length) * 100) : 0;

  const itemsByType: Record<string, number> = {};
  const itemsByDok: Record<number, number> = {};
  allItems.forEach((i) => {
    const t = (i.itemType || "unknown").replace(/_/g, " ");
    itemsByType[t] = (itemsByType[t] || 0) + 1;
    itemsByDok[i.dokLevel] = (itemsByDok[i.dokLevel] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">System Reports</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5 text-center">
          <Target className="h-7 w-7 text-indigo-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-indigo-600">{allStandards.length}</p>
          <p className="text-xs text-gray-500">Standards</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 text-center">
          <BookOpen className="h-7 w-7 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-purple-600">{allItems.length}</p>
          <p className="text-xs text-gray-500">Total Items</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 text-center">
          <FileText className="h-7 w-7 text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-blue-600">{assessments?.length || 0}</p>
          <p className="text-xs text-gray-500">Assessments</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 text-center">
          <Database className="h-7 w-7 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-green-600">{blueprints?.length || 0}</p>
          <p className="text-xs text-gray-500">Blueprints</p>
        </CardContent></Card>
      </div>

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

      <Card>
        <CardHeader><CardTitle>Assessment Completion</CardTitle></CardHeader>
        <CardContent>
          {(assessments || []).length > 0 ? (
            <div className="space-y-2">
              {(assessments || []).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{a.title || `Assessment #${a.id}`}</p>
                    <p className="text-xs text-gray-400">{a.subject} • Grade {a.gradeLevel} • {a.assessmentType}</p>
                  </div>
                  <Badge variant={a.status === "published" ? "default" : "secondary"}>{a.status || "draft"}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No assessments created yet</p>
          )}
        </CardContent>
      </Card>
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
              <p className="text-xs text-gray-500 mt-1">Sessions tied to specific ACAP standards for targeted support</p>
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
