import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, BookOpen, ClipboardList, FileText, BarChart3, Brain,
  Plus, Loader2, CheckCircle, Clock, AlertTriangle, Sparkles,
  Target, TrendingUp, Users, Eye, Pencil, Trash2, Send, Filter,
  ThumbsUp, ThumbsDown, XCircle, Calculator, PenTool, Award
} from "lucide-react";
import TeacherClassRankGoalsPage from "@/pages/acap/TeacherClassRankGoalsPage";
import AccessCodesManager from "@/components/acap/teacher/AccessCodesManager";
import { useAcapWebSocket } from "@/hooks/useAcapWebSocket";
import { PRODUCT_NAME_PLAIN, TAGLINE } from "@/lib/educapBrand";

type Tab = "overview" | "assignments" | "question-bank" | "reports" | "bootcamp" | "rank-goals" | "access-codes";

interface TeacherInfo {
  id: string;
  name: string;
  gradeRole: string;
  subject: string;
  canSeeGrades: number[];
}

export default function TeacherAcap() {
  useAcapWebSocket();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const getTeacherId = () => {
    const authId = localStorage.getItem("teacherAuthId");
    if (authId) return authId;
    try {
      const data = JSON.parse(localStorage.getItem("teacherData") || "{}");
      return data?.id || data?.teacherId || "";
    } catch { return ""; }
  };
  const teacherId = getTeacherId();
  const teacherName = localStorage.getItem("teacherName") || "Teacher";

  const { data: teacherInfo } = useQuery<TeacherInfo>({
    queryKey: ["/api/teacher-auth/verify"],
    queryFn: async () => {
      const token = localStorage.getItem("teacherToken");
      const res = await fetch("/api/teacher-auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Not authenticated");
      const data = await res.json();
      if (data.teacher?.id && !localStorage.getItem("teacherAuthId")) {
        localStorage.setItem("teacherAuthId", String(data.teacher.id));
      }
      return data.teacher;
    },
    enabled: true,
  });

  const gradeNumber = teacherInfo?.canSeeGrades?.[0] || extractGradeNumber(teacherInfo?.gradeRole || "");

  const tabs = [
    { id: "overview" as Tab, label: "Overview", icon: BarChart3 },
    { id: "assignments" as Tab, label: "Assignments", icon: ClipboardList },
    { id: "question-bank" as Tab, label: "Question Bank", icon: BookOpen },
    { id: "reports" as Tab, label: "Reports", icon: FileText },
    { id: "bootcamp" as Tab, label: "Boot Camp", icon: Brain },
    { id: "rank-goals" as Tab, label: "Rank & Goals", icon: Award },
    { id: "access-codes" as Tab, label: "Access Codes", icon: Target },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => setLocation("/teacher-dashboard")}>
              <ArrowLeft className="h-5 w-5 mr-1" /> Back
            </Button>
            <img src="/branding/educap-logo.png" alt="EduCAP Logo" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-bold">{PRODUCT_NAME_PLAIN}</h1>
              <p className="text-indigo-200 text-sm italic">{TAGLINE}</p>
            </div>
          </div>
          <div className="text-right text-sm text-indigo-200">
            <p>{teacherName}</p>
            <p className="text-xs">{teacherInfo?.gradeRole} {teacherInfo?.subject ? `- ${teacherInfo.subject}` : ""}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-2">
        <div className="flex gap-1 bg-white rounded-lg shadow-sm p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && <OverviewTab teacherId={teacherId} gradeNumber={gradeNumber} teacherInfo={teacherInfo} />}
        {activeTab === "assignments" && <AssignmentsTab teacherId={teacherId} gradeNumber={gradeNumber} />}
        {activeTab === "question-bank" && <QuestionBankTab teacherId={teacherId} gradeNumber={gradeNumber} />}
        {activeTab === "reports" && <ReportsTab teacherId={teacherId} />}
        {activeTab === "bootcamp" && <BootCampTab teacherId={teacherId} gradeNumber={gradeNumber} />}
        {activeTab === "rank-goals" && <TeacherClassRankGoalsPage />}
        {activeTab === "access-codes" && <AccessCodesManager teacherId={teacherId} />}
      </div>
    </div>
  );
}

function extractGradeNumber(gradeRole: string): number {
  const match = gradeRole.match(/(\d+)/);
  return match ? parseInt(match[1]) : 6;
}

const domainFilters = [
  { label: "All", value: "all", icon: BookOpen },
  { label: "Reading", value: "reading", icon: BookOpen },
  { label: "Writing", value: "writing", icon: PenTool },
  { label: "Math", value: "math", icon: Calculator },
  { label: "Science", value: "science", icon: Brain },
];

function filterByDomain(standards: any[], domain: string): any[] {
  if (domain === "all") return standards;
  return standards.filter((s: any) => {
    const d = (s.domain || "").toLowerCase();
    if (domain === "reading") return d.includes("reading") || d.includes("literature") || d.includes("informational");
    if (domain === "writing") return d.includes("writing");
    if (domain === "math") return d.includes("math") || d.includes("number") || d.includes("ratio") || d.includes("expression") || d.includes("geometry") || d.includes("algebra") || d.includes("statistics") || d.includes("proportional");
    if (domain === "science") return d.includes("science") || d.includes("physical") || d.includes("earth") || d.includes("life") || d.includes("engineering");
    return true;
  });
}

function OverviewTab({ teacherId, gradeNumber, teacherInfo }: { teacherId: string; gradeNumber: number; teacherInfo?: TeacherInfo }) {
  const [selectedGrade, setSelectedGrade] = useState<number>(gradeNumber);
  const [selectedDomain, setSelectedDomain] = useState("all");

  useEffect(() => {
    if (gradeNumber) setSelectedGrade(gradeNumber);
  }, [gradeNumber]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/acap/dashboard/teacher", teacherId],
    queryFn: () => fetch(`/api/acap/dashboard/teacher/${teacherId}`).then((r) => r.json()),
    enabled: !!teacherId,
  });

  const { data: standards } = useQuery({
    queryKey: ["/api/acap/standards", { gradeLevel: selectedGrade }],
    queryFn: () => fetch(`/api/acap/standards?gradeLevel=${selectedGrade}`).then((r) => r.json()),
  });

  const filteredStandards = filterByDomain(standards || [], selectedDomain);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-3 rounded-lg"><ClipboardList className="h-6 w-6 text-indigo-600" /></div>
              <div>
                <p className="text-2xl font-bold text-indigo-700">{stats?.activeAssignments || 0}</p>
                <p className="text-sm text-gray-500">Active Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg"><FileText className="h-6 w-6 text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold text-purple-700">{stats?.totalAssessments || 0}</p>
                <p className="text-sm text-gray-500">Assessments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold text-green-700">{stats?.approvedItems || 0}</p>
                <p className="text-sm text-gray-500">Approved Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-3 rounded-lg"><Target className="h-6 w-6 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{filteredStandards?.length || 0}</p>
                <p className="text-sm text-gray-500">Standards (Grade {selectedGrade})</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-indigo-500" /> Standards Coverage</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[6, 7, 8].map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGrade(g)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      selectedGrade === g ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Grade {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-1 mt-2">
            {domainFilters.map((df) => (
              <button
                key={df.value}
                onClick={() => setSelectedDomain(df.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  selectedDomain === df.value ? "bg-purple-600 text-white shadow-sm" : "bg-gray-50 text-gray-600 hover:bg-gray-100 border"
                }`}
              >
                <df.icon className="h-3 w-3" />
                {df.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filteredStandards?.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredStandards.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-indigo-600">{s.code}</span>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Grade {s.gradeLevel || s.grade_level}</span>
                      {s.dokLevels && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          DOK {Array.isArray(s.dokLevels) ? s.dokLevels.join(",") : s.dok_levels}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{s.domain} - {s.subdomain}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No standards found for Grade {selectedGrade} - {selectedDomain}. Contact admin to import standards.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Pending Review</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-amber-600">{stats?.pendingItems || 0}</p>
            <p className="text-sm text-gray-500">Items awaiting review</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AssignmentsTab({ teacherId, gradeNumber }: { teacherId: string; gradeNumber: number }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateAssessment, setShowCreateAssessment] = useState(false);
  const { toast } = useToast();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["/api/acap/assignments", { teacherId }],
    queryFn: () => fetch(`/api/acap/assignments?teacherId=${teacherId}`).then((r) => r.json()),
  });

  const { data: assessments, isLoading: loadingAssessments } = useQuery({ queryKey: ["/api/acap/assessments"] });
  const { data: scholars } = useQuery({ queryKey: ["/api/scholars"] });
  const { data: standards } = useQuery({
    queryKey: ["/api/acap/standards", { gradeLevel: gradeNumber }],
    queryFn: () => fetch(`/api/acap/standards?gradeLevel=${gradeNumber}`).then((r) => r.json()),
  });
  const { data: items } = useQuery({
    queryKey: ["/api/acap/items"],
    queryFn: () => fetch(`/api/acap/items?reviewStatus=approved`).then((r) => r.json()),
  });

  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [selectedScholars, setSelectedScholars] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [assessmentType, setAssessmentType] = useState("daily");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedStandardForAssessment, setSelectedStandardForAssessment] = useState("");
  const [assessmentSubject, setAssessmentSubject] = useState("ELA");

  const createAssessmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/acap/assessments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/assessments"] });
      toast({ title: "Assessment created successfully!" });
      setShowCreateAssessment(false);
      setAssessmentTitle("");
      setSelectedItems([]);
    },
    onError: () => toast({ title: "Failed to create assessment", variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/acap/assignments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/assignments"] });
      toast({ title: "Assignment created and assigned!" });
      setShowCreate(false);
      setSelectedAssessment("");
      setSelectedScholars([]);
      setDueDate("");
    },
    onError: () => toast({ title: "Failed to create assignment", variant: "destructive" }),
  });

  const gradeScholars = (scholars as any[])?.filter((s: any) => {
    const g = s.grade || s.gradeLevel;
    return g === gradeNumber || g === String(gradeNumber);
  }) || scholars || [];

  const approvedItems = (items as any[])?.filter((i: any) => i.reviewStatus === "approved") || [];

  const standardItems = selectedStandardForAssessment && selectedStandardForAssessment !== "all"
    ? approvedItems.filter((i: any) => String(i.standardId) === selectedStandardForAssessment)
    : approvedItems;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-800">Assessment Assignments</h2>
        <div className="flex gap-2">
          <Button onClick={() => { setShowCreateAssessment(!showCreateAssessment); setShowCreate(false); }} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" /> Create Assessment
          </Button>
          <Button onClick={() => { setShowCreate(!showCreate); setShowCreateAssessment(false); }} className="bg-indigo-600 hover:bg-indigo-700">
            <Send className="h-4 w-4 mr-2" /> Assign to Students
          </Button>
        </div>
      </div>

      {showCreateAssessment && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-purple-500" /> Create New Assessment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assessment Title</Label>
                <Input
                  value={assessmentTitle}
                  onChange={(e) => setAssessmentTitle(e.target.value)}
                  placeholder="e.g., Grade 6 ELA Reading Quiz"
                />
              </div>
              <div>
                <Label>Assessment Type</Label>
                <Select value={assessmentType} onValueChange={setAssessmentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baseline">Baseline</SelectItem>
                    <SelectItem value="daily">Daily Practice</SelectItem>
                    <SelectItem value="midpoint">Midpoint Check</SelectItem>
                    <SelectItem value="final">Final Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subject</Label>
                <Select value={assessmentSubject} onValueChange={setAssessmentSubject}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ELA">ELA</SelectItem>
                    <SelectItem value="MATH">Math</SelectItem>
                    <SelectItem value="SCI">Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Filter by Standard (auto-selects matching items)</Label>
                <Select value={selectedStandardForAssessment} onValueChange={(val) => {
                  setSelectedStandardForAssessment(val);
                  if (val && val !== "all") {
                    const matching = approvedItems.filter((i: any) => String(i.standardId) === val).map((i: any) => i.id);
                    setSelectedItems(matching);
                  } else {
                    setSelectedItems([]);
                  }
                }}>
                  <SelectTrigger><SelectValue placeholder="All approved items..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Standards</SelectItem>
                    {(standards as any[])?.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.code} - {s.domain}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Select Items to Include ({selectedItems.length} selected)</Label>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-2 mt-1 space-y-1">
                {standardItems.length > 0 ? standardItems.map((item: any) => (
                  <label key={item.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        setSelectedItems(e.target.checked
                          ? [...selectedItems, item.id]
                          : selectedItems.filter((id) => id !== item.id));
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">DOK {item.dokLevel}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{(item.itemType || "").replace("_", " ")}</span>
                      </div>
                      <p className="text-xs text-gray-700 mt-1">{item.stem?.substring(0, 120)}...</p>
                    </div>
                  </label>
                )) : (
                  <p className="text-sm text-gray-500 text-center py-4">No approved items available. Generate and approve items in the Question Bank first.</p>
                )}
              </div>
            </div>
            <Button
              onClick={() => createAssessmentMutation.mutate({
                title: assessmentTitle,
                gradeLevel: gradeNumber,
                subject: assessmentSubject,
                assessmentType,
                itemIds: selectedItems,
                totalPoints: selectedItems.length * 10,
                timeLimit: selectedItems.length * 3,
                isActive: true,
                createdBy: teacherId,
              })}
              disabled={!assessmentTitle || selectedItems.length === 0 || createAssessmentMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createAssessmentMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Assessment ({selectedItems.length} items)
            </Button>
          </CardContent>
        </Card>
      )}

      {showCreate && (
        <Card className="border-indigo-200">
          <CardHeader><CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-indigo-500" /> Assign Assessment to Students</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Assessment</Label>
              <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                <SelectTrigger><SelectValue placeholder="Select assessment..." /></SelectTrigger>
                <SelectContent>
                  {(assessments as any[])?.length > 0 ? (
                    (assessments as any[]).map((a: any) => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.title} ({a.assessmentType})</SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">No assessments yet. Create one first.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label>Assign To (Grade {gradeNumber} Students)</Label>
              <div className="flex gap-2 mb-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedScholars((gradeScholars as any[]).map((s: any) => s.id))}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedScholars([])}
                >
                  Clear All
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                {(gradeScholars as any[])?.map((s: any) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedScholars.includes(s.id)}
                      onChange={(e) => {
                        setSelectedScholars(e.target.checked
                          ? [...selectedScholars, s.id]
                          : selectedScholars.filter((id) => id !== s.id));
                      }}
                    />
                    {s.firstName || s.name} {s.lastName || ""}
                  </label>
                ))}
              </div>
            </div>
            <Button
              onClick={() => createMutation.mutate({
                assessmentId: parseInt(selectedAssessment),
                teacherId, targetType: "scholars", targetIds: selectedScholars,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null, status: "active",
              })}
              disabled={!selectedAssessment || selectedScholars.length === 0 || createMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Assign to {selectedScholars.length} Students
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
      ) : (assignments as any[])?.length > 0 ? (
        <div className="space-y-3">
          {(assignments as any[]).map((a: any) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Assignment #{a.id}</p>
                    <p className="text-sm text-gray-500">Assessment #{a.assessmentId} | {(a.targetIds as string[])?.length || 0} scholars</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${a.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                      {a.status}
                    </span>
                    {a.dueDate && <span className="text-xs text-gray-400">Due: {new Date(a.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed"><CardContent className="text-center py-8 text-gray-500">No assignments yet. Create an assessment and assign it to students above.</CardContent></Card>
      )}
    </div>
  );
}

function QuestionBankTab({ teacherId, gradeNumber }: { teacherId: string; gradeNumber: number }) {
  const { toast } = useToast();
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState("");
  const [dokLevel, setDokLevel] = useState("2");
  const [itemType, setItemType] = useState("multiple_choice");
  const [itemCount, setItemCount] = useState("5");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDomain, setFilterDomain] = useState("all");
  const [filterGrade, setFilterGrade] = useState<number>(gradeNumber);
  const [filterStandard, setFilterStandard] = useState("all");
  const [subjectForGen, setSubjectForGen] = useState("ELA");

  useEffect(() => {
    if (gradeNumber) setFilterGrade(gradeNumber);
  }, [gradeNumber]);

  const { data: standards } = useQuery({
    queryKey: ["/api/acap/standards", { gradeLevel: filterGrade }],
    queryFn: () => fetch(`/api/acap/standards?gradeLevel=${filterGrade}`).then((r) => r.json()),
  });

  const { data: items, isLoading } = useQuery({ queryKey: ["/api/acap/items"] });

  const generateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/acap/items/generate", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/items"] });
      toast({ title: "Items generated successfully!" });
      setShowGenerate(false);
    },
    onError: () => toast({ title: "Failed to generate items", variant: "destructive" }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ itemId, status }: { itemId: number; status: string }) =>
      apiRequest("PATCH", `/api/acap/items/${itemId}`, { reviewStatus: status, reviewedBy: teacherId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/items"] });
      toast({ title: "Item review updated!" });
    },
    onError: () => toast({ title: "Failed to update item", variant: "destructive" }),
  });

  let filteredItems = (items as any[]) || [];
  if (filterStatus !== "all") filteredItems = filteredItems.filter((i: any) => i.reviewStatus === filterStatus);
  if (filterDomain !== "all") filteredItems = filteredItems.filter((i: any) => {
    const d = (i.domain || i.subject || "").toLowerCase();
    if (filterDomain === "reading") return d.includes("reading") || d.includes("ela") || d.includes("literature");
    if (filterDomain === "writing") return d.includes("writing");
    if (filterDomain === "math") return d.includes("math");
    return true;
  });
  if (filterStandard !== "all") filteredItems = filteredItems.filter((i: any) => String(i.standardId) === filterStandard);

  const filteredStandards = filterByDomain(standards || [], filterDomain);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-800">AI-Powered Question Bank</h2>
        <Button onClick={() => setShowGenerate(!showGenerate)} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
          <Sparkles className="h-4 w-4 mr-2" /> Generate Items with AI
        </Button>
      </div>

      {showGenerate && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-500" /> AI Item Generator</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-1 mb-2">
              <Label className="text-xs font-medium text-gray-500 mb-1 block w-full">Grade Level</Label>
            </div>
            <div className="flex gap-1 mb-3">
              {[6, 7, 8].map((g) => (
                <button
                  key={g}
                  onClick={() => setFilterGrade(g)}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    filterGrade === g ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Grade {g}
                </button>
              ))}
            </div>
            <div className="flex gap-1 mb-3">
              {domainFilters.map((df) => (
                <button
                  key={df.value}
                  onClick={() => setFilterDomain(df.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium ${
                    filterDomain === df.value ? "bg-purple-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100 border"
                  }`}
                >
                  <df.icon className="h-3 w-3" />
                  {df.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Standard</Label>
                <Select value={selectedStandard} onValueChange={setSelectedStandard}>
                  <SelectTrigger><SelectValue placeholder="Select standard..." /></SelectTrigger>
                  <SelectContent>
                    {filteredStandards?.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.code} - {s.description?.substring(0, 50)}...</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Select value={subjectForGen} onValueChange={setSubjectForGen}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ELA">ELA (Reading/Writing)</SelectItem>
                    <SelectItem value="Math">Mathematics</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>DOK Level</Label>
                <Select value={dokLevel} onValueChange={setDokLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">DOK 2 - Skills/Concepts</SelectItem>
                    <SelectItem value="3">DOK 3 - Strategic Thinking</SelectItem>
                    <SelectItem value="4">DOK 4 - Extended Thinking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Item Type</Label>
                <Select value={itemType} onValueChange={setItemType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="multi_select">Multi-Select</SelectItem>
                    <SelectItem value="constructed_response">Constructed Response</SelectItem>
                    <SelectItem value="evidence_based">Evidence-Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Number of Items</Label>
                <Select value={itemCount} onValueChange={setItemCount}>
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
            <Button
              onClick={() => generateMutation.mutate({
                standardId: parseInt(selectedStandard), dokLevel: parseInt(dokLevel),
                itemType, count: parseInt(itemCount), subject: subjectForGen, userId: teacherId,
              })}
              disabled={!selectedStandard || generateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 w-full"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating with AI...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generate {itemCount} Items</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-500 font-medium">Filter:</span>
        <div className="flex gap-1">
          {["all", "pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded text-xs font-medium ${
                filterStatus === status ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <span className="text-gray-300">|</span>
        <div className="flex gap-1">
          {domainFilters.map((df) => (
            <button
              key={df.value}
              onClick={() => setFilterDomain(df.value)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium ${
                filterDomain === df.value ? "bg-purple-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100 border"
              }`}
            >
              <df.icon className="h-3 w-3" />
              {df.label}
            </button>
          ))}
        </div>
        <span className="text-gray-300">|</span>
        <Select value={filterStandard} onValueChange={setFilterStandard}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue placeholder="Filter by standard..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Standards</SelectItem>
            {(filteredStandards || []).map((s: any) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.code} - {s.domain}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
      ) : filteredItems?.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item: any) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">DOK {item.dokLevel}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{(item.itemType || "").replace("_", " ")}</span>
                      {item.aiGenerated && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI Generated</span>}
                      {item.standardId && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">Std #{item.standardId}</span>}
                    </div>
                    <p className="text-sm text-gray-800 mt-2">{item.stem?.substring(0, 200)}{item.stem?.length > 200 ? "..." : ""}</p>
                    {item.options && (
                      <div className="mt-2 space-y-1">
                        {(Array.isArray(item.options) ? item.options : []).map((opt: any, idx: number) => (
                          <div key={idx} className={`text-xs px-2 py-1 rounded ${
                            opt.isCorrect || opt.correct ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-600"
                          }`}>
                            {String.fromCharCode(65 + idx)}. {opt.text || opt.label || opt}
                            {(opt.isCorrect || opt.correct) && <CheckCircle className="h-3 w-3 inline ml-1" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-3">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      item.reviewStatus === "approved" ? "bg-green-100 text-green-700" :
                      item.reviewStatus === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {item.reviewStatus}
                    </span>
                    {item.reviewStatus === "pending" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-green-600 hover:bg-green-50 border-green-200"
                          onClick={() => reviewMutation.mutate({ itemId: item.id, status: "approved" })}
                          disabled={reviewMutation.isPending}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-red-600 hover:bg-red-50 border-red-200"
                          onClick={() => reviewMutation.mutate({ itemId: item.id, status: "rejected" })}
                          disabled={reviewMutation.isPending}
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed"><CardContent className="text-center py-8 text-gray-500">No items in question bank. Use AI to generate items above.</CardContent></Card>
      )}
    </div>
  );
}

function ReportsTab({ teacherId }: { teacherId: string }) {
  const { data: assessments } = useQuery({ queryKey: ["/api/acap/assessments"] });
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);

  const { data: report } = useQuery({
    queryKey: ["/api/acap/reports/assessment", selectedAssessment],
    queryFn: () => fetch(`/api/acap/reports/assessment/${selectedAssessment}`).then((r) => r.json()),
    enabled: !!selectedAssessment,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Assessment Reports</h2>
      <div>
        <Label>Select Assessment</Label>
        <Select value={selectedAssessment ? String(selectedAssessment) : ""} onValueChange={(v) => setSelectedAssessment(parseInt(v))}>
          <SelectTrigger><SelectValue placeholder="Choose an assessment..." /></SelectTrigger>
          <SelectContent>
            {(assessments as any[])?.length > 0 ? (
              (assessments as any[]).map((a: any) => (
                <SelectItem key={a.id} value={String(a.id)}>{a.title}</SelectItem>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">No assessments created yet.</div>
            )}
          </SelectContent>
        </Select>
      </div>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-indigo-600">{report.averageScore || 0}%</p>
              <p className="text-sm text-gray-500">Average Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">{report.completedAttempts || 0}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-amber-600">{(report.totalAttempts || 0) - (report.completedAttempts || 0)}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedAssessment && (
        <Card className="border-dashed"><CardContent className="text-center py-8 text-gray-500">Select an assessment to view its report.</CardContent></Card>
      )}
    </div>
  );
}

function BootCampTab({ teacherId, gradeNumber }: { teacherId: string; gradeNumber: number }) {
  const { data: sessions } = useQuery({
    queryKey: ["/api/acap/bootcamp/sessions"],
    queryFn: () => fetch(`/api/acap/bootcamp/sessions`).then((r) => r.json()),
  });

  const { data: standards } = useQuery({
    queryKey: ["/api/acap/standards", { gradeLevel: gradeNumber }],
    queryFn: () => fetch(`/api/acap/standards?gradeLevel=${gradeNumber}`).then((r) => r.json()),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">EduCAP Boot Camp Management</h2>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-purple-500" /> Boot Camp Overview</CardTitle></CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Boot Camp provides AI-powered tutoring for scholars who need extra support on specific standards.
            Students can access tutoring sessions from their dashboard. Progress is tracked automatically.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-purple-50 p-4 rounded-lg">
              <Brain className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="font-medium text-purple-700">AI Tutor</p>
              <p className="text-xs text-gray-500">Personalized tutoring with scaffolded questions</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <Target className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
              <p className="font-medium text-indigo-700">Standard-Aligned</p>
              <p className="text-xs text-gray-500">Focused on Grade {gradeNumber} EduCAP standards</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="font-medium text-green-700">Growth Tracking</p>
              <p className="text-xs text-gray-500">Monitors improvement over time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Grade {gradeNumber} Standards for Boot Camp</CardTitle></CardHeader>
        <CardContent>
          {(standards as any[])?.length > 0 ? (
            <div className="space-y-2">
              {(standards as any[]).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-indigo-50">
                  <div>
                    <span className="font-mono text-sm text-indigo-600 font-semibold">{s.code}</span>
                    <span className="text-xs text-gray-500 ml-2">{s.domain}</span>
                    <p className="text-xs text-gray-600 mt-0.5">{s.description?.substring(0, 100)}...</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No standards loaded for Grade {gradeNumber}.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
