import { useState } from "react";
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
  Target, TrendingUp, Users, Eye, Pencil, Trash2, Send, Filter
} from "lucide-react";

type Tab = "overview" | "assignments" | "question-bank" | "reports" | "bootcamp";

export default function TeacherAcap() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const teacherId = localStorage.getItem("teacherAuthId") || "";
  const teacherName = localStorage.getItem("teacherName") || "Teacher";

  const tabs = [
    { id: "overview" as Tab, label: "Overview", icon: BarChart3 },
    { id: "assignments" as Tab, label: "Assignments", icon: ClipboardList },
    { id: "question-bank" as Tab, label: "Question Bank", icon: BookOpen },
    { id: "reports" as Tab, label: "Reports", icon: FileText },
    { id: "bootcamp" as Tab, label: "Boot Camp", icon: Brain },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => setLocation("/teacher-dashboard")}>
              <ArrowLeft className="h-5 w-5 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">ACAP Adaptive Skills</h1>
              <p className="text-indigo-200 text-sm">Standards-Based Assessment & AI-Powered Learning</p>
            </div>
          </div>
          <div className="text-right text-sm text-indigo-200">
            <p>{teacherName}</p>
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

        {activeTab === "overview" && <OverviewTab teacherId={teacherId} />}
        {activeTab === "assignments" && <AssignmentsTab teacherId={teacherId} />}
        {activeTab === "question-bank" && <QuestionBankTab teacherId={teacherId} />}
        {activeTab === "reports" && <ReportsTab teacherId={teacherId} />}
        {activeTab === "bootcamp" && <BootCampTab teacherId={teacherId} />}
      </div>
    </div>
  );
}

function OverviewTab({ teacherId }: { teacherId: string }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/acap/dashboard/teacher", teacherId],
    queryFn: () => fetch(`/api/acap/dashboard/teacher/${teacherId}`).then((r) => r.json()),
    enabled: !!teacherId,
  });

  const { data: standards } = useQuery({
    queryKey: ["/api/acap/standards"],
  });

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
                <p className="text-2xl font-bold text-amber-700">{stats?.totalStandards || 0}</p>
                <p className="text-sm text-gray-500">Standards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-indigo-500" /> Standards Coverage</CardTitle></CardHeader>
          <CardContent>
            {(standards as any[])?.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(standards as any[]).slice(0, 10).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-mono text-sm text-indigo-600">{s.code}</span>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{s.description}</p>
                    </div>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Grade {s.gradeLevel}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No standards loaded yet. Contact admin to import standards.</p>
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
    </div>
  );
}

function AssignmentsTab({ teacherId }: { teacherId: string }) {
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["/api/acap/assignments", { teacherId }],
    queryFn: () => fetch(`/api/acap/assignments?teacherId=${teacherId}`).then((r) => r.json()),
  });

  const { data: assessments } = useQuery({ queryKey: ["/api/acap/assessments"] });
  const { data: scholars } = useQuery({ queryKey: ["/api/scholars"] });

  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [selectedScholars, setSelectedScholars] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/acap/assignments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/assignments"] });
      toast({ title: "Assignment created successfully" });
      setShowCreate(false);
    },
    onError: () => toast({ title: "Failed to create assignment", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Assessment Assignments</h2>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" /> New Assignment
        </Button>
      </div>

      {showCreate && (
        <Card className="border-indigo-200">
          <CardHeader><CardTitle>Create Assignment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Assessment</Label>
              <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                <SelectTrigger><SelectValue placeholder="Select assessment..." /></SelectTrigger>
                <SelectContent>
                  {(assessments as any[])?.map((a: any) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.title} ({a.assessmentType})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label>Assign To</Label>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto mt-2">
                {(scholars as any[])?.map((s: any) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedScholars.includes(s.id)}
                      onChange={(e) => {
                        setSelectedScholars(e.target.checked
                          ? [...selectedScholars, s.id]
                          : selectedScholars.filter((id) => id !== s.id));
                      }}
                    />
                    {s.name}
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
              Assign
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
        <Card className="border-dashed"><CardContent className="text-center py-8 text-gray-500">No assignments yet. Create your first assessment assignment above.</CardContent></Card>
      )}
    </div>
  );
}

function QuestionBankTab({ teacherId }: { teacherId: string }) {
  const { toast } = useToast();
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState("");
  const [dokLevel, setDokLevel] = useState("2");
  const [itemType, setItemType] = useState("multiple_choice");
  const [itemCount, setItemCount] = useState("5");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: standards } = useQuery({ queryKey: ["/api/acap/standards"] });
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

  const filteredItems = filterStatus === "all" ? items : (items as any[])?.filter((i: any) => i.reviewStatus === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">AI-Powered Question Bank</h2>
        <Button onClick={() => setShowGenerate(!showGenerate)} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
          <Sparkles className="h-4 w-4 mr-2" /> Generate Items with AI
        </Button>
      </div>

      {showGenerate && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-500" /> AI Item Generator</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Standard</Label>
                <Select value={selectedStandard} onValueChange={setSelectedStandard}>
                  <SelectTrigger><SelectValue placeholder="Select standard..." /></SelectTrigger>
                  <SelectContent>
                    {(standards as any[])?.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.code} - {s.description?.substring(0, 50)}...</SelectItem>
                    ))}
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
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={() => generateMutation.mutate({
                standardId: parseInt(selectedStandard), dokLevel: parseInt(dokLevel),
                itemType, count: parseInt(itemCount), subject: "ELA", userId: teacherId,
              })}
              disabled={!selectedStandard || generateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generate Items</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        {["all", "pending", "approved", "rejected"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              filterStatus === status ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
      ) : (filteredItems as any[])?.length > 0 ? (
        <div className="space-y-3">
          {(filteredItems as any[]).map((item: any) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">DOK {item.dokLevel}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{item.itemType.replace("_", " ")}</span>
                      {item.aiGenerated && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI</span>}
                    </div>
                    <p className="text-sm text-gray-800">{item.stem?.substring(0, 150)}...</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ml-2 ${
                    item.reviewStatus === "approved" ? "bg-green-100 text-green-700" :
                    item.reviewStatus === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {item.reviewStatus}
                  </span>
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
            {(assessments as any[])?.map((a: any) => (
              <SelectItem key={a.id} value={String(a.id)}>{a.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-indigo-600">{report.averageScore}%</p>
              <p className="text-sm text-gray-500">Average Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">{report.completedAttempts}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-amber-600">{report.totalAttempts - report.completedAttempts}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-3">
            <CardHeader><CardTitle>Score Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-red-50 p-3 rounded"><p className="text-xl font-bold text-red-600">{report.scoreDistribution?.below40 || 0}</p><p className="text-xs text-gray-500">Below 40%</p></div>
                <div className="bg-amber-50 p-3 rounded"><p className="text-xl font-bold text-amber-600">{report.scoreDistribution?.["40to59"] || 0}</p><p className="text-xs text-gray-500">40-59%</p></div>
                <div className="bg-blue-50 p-3 rounded"><p className="text-xl font-bold text-blue-600">{report.scoreDistribution?.["60to79"] || 0}</p><p className="text-xs text-gray-500">60-79%</p></div>
                <div className="bg-green-50 p-3 rounded"><p className="text-xl font-bold text-green-600">{report.scoreDistribution?.["80to100"] || 0}</p><p className="text-xs text-gray-500">80-100%</p></div>
              </div>
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

function BootCampTab({ teacherId }: { teacherId: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">ACAP Boot Camp Management</h2>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-purple-500" /> Boot Camp Overview</CardTitle></CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Boot Camp provides AI-powered tutoring for scholars who need extra support on specific standards.
            Scholars can access tutoring sessions from their dashboard, and progress is tracked automatically.
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
              <p className="text-xs text-gray-500">Focused on specific ACAP standards</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="font-medium text-green-700">Growth Tracking</p>
              <p className="text-xs text-gray-500">Monitors improvement over time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
