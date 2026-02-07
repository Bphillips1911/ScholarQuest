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
  ArrowLeft, BookOpen, Target, BarChart3, Shield, Settings,
  Plus, Loader2, CheckCircle, Clock, AlertTriangle, Eye,
  Database, FileText, History, Check, X, Sparkles, Users
} from "lucide-react";

type Tab = "standards" | "blueprints" | "question-bank" | "reports" | "audit-log";

export default function AdminAcap() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("standards");

  const tabs = [
    { id: "standards" as Tab, label: "Standards", icon: Target },
    { id: "blueprints" as Tab, label: "Blueprints", icon: Database },
    { id: "question-bank" as Tab, label: "Question Bank", icon: BookOpen },
    { id: "reports" as Tab, label: "Reports", icon: BarChart3 },
    { id: "audit-log" as Tab, label: "Audit Log", icon: History },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <div className="bg-gradient-to-r from-slate-800 to-purple-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => setLocation("/admin")}>
              <ArrowLeft className="h-5 w-5 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6" /> ACAP Administration</h1>
              <p className="text-slate-300 text-sm">Standards, Blueprints & Assessment Governance</p>
            </div>
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
                  ? "bg-slate-800 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "standards" && <StandardsTab />}
        {activeTab === "blueprints" && <BlueprintsTab />}
        {activeTab === "question-bank" && <QuestionBankGovernanceTab />}
        {activeTab === "reports" && <AdminReportsTab />}
        {activeTab === "audit-log" && <AuditLogTab />}
      </div>
    </div>
  );
}

function StandardsTab() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [code, setCode] = useState("");
  const [domain, setDomain] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [gradeLevel, setGradeLevel] = useState("6");
  const [description, setDescription] = useState("");

  const { data: standards, isLoading } = useQuery({ queryKey: ["/api/acap/standards"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/acap/standards", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/standards"] });
      toast({ title: "Standard created successfully" });
      setShowAdd(false);
      setCode(""); setDomain(""); setSubdomain(""); setDescription("");
    },
    onError: () => toast({ title: "Failed to create standard", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">ACAP Standards Management</h2>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-slate-700 hover:bg-slate-800">
          <Plus className="h-4 w-4 mr-2" /> Add Standard
        </Button>
      </div>

      {showAdd && (
        <Card className="border-slate-200">
          <CardHeader><CardTitle>Add New Standard</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Standard Code</Label>
                <Input placeholder="e.g., RL.6.1" value={code} onChange={(e) => setCode(e.target.value)} />
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
                <Label>Domain</Label>
                <Input placeholder="e.g., Reading Literature" value={domain} onChange={(e) => setDomain(e.target.value)} />
              </div>
              <div>
                <Label>Subdomain</Label>
                <Input placeholder="e.g., Key Ideas and Details" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Standard description..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <Button
              onClick={() => createMutation.mutate({
                code, domain, subdomain, gradeLevel: parseInt(gradeLevel),
                description, dokLevels: [2, 3, 4], isActive: true, userRole: "admin",
              })}
              disabled={!code || !domain || !description || createMutation.isPending}
              className="bg-slate-700 hover:bg-slate-800"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Standard
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {(standards as any[])?.length > 0 ? (
            <>
              <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-500 px-4 py-2 bg-gray-50 rounded">
                <span>Code</span><span>Domain</span><span>Grade</span><span>Description</span>
              </div>
              {(standards as any[]).map((s: any) => (
                <Card key={s.id} className="hover:shadow-sm">
                  <CardContent className="py-3 px-4">
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <span className="font-mono text-sm text-indigo-600 font-medium">{s.code}</span>
                      <span className="text-sm text-gray-600">{s.domain}</span>
                      <span className="text-sm"><span className="bg-gray-100 px-2 py-0.5 rounded">Grade {s.gradeLevel}</span></span>
                      <span className="text-sm text-gray-500 truncate">{s.description}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <Card className="border-dashed"><CardContent className="text-center py-8 text-gray-500">No standards loaded. Add standards above or import from a standards file.</CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}

function BlueprintsTab() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("6");
  const [subject, setSubject] = useState("ELA");
  const [totalItems, setTotalItems] = useState("30");
  const [timeLimit, setTimeLimit] = useState("60");

  const { data: blueprints, isLoading } = useQuery({ queryKey: ["/api/acap/blueprints"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/acap/blueprints", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/blueprints"] });
      toast({ title: "Blueprint created successfully" });
      setShowAdd(false);
      setName("");
    },
    onError: () => toast({ title: "Failed to create blueprint", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Assessment Blueprints</h2>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-slate-700 hover:bg-slate-800">
          <Plus className="h-4 w-4 mr-2" /> New Blueprint
        </Button>
      </div>

      {showAdd && (
        <Card className="border-slate-200">
          <CardHeader><CardTitle>Create Assessment Blueprint</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Blueprint Name</Label>
                <Input placeholder="e.g., Grade 6 ELA Baseline" value={name} onChange={(e) => setName(e.target.value)} />
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
                <Label>Total Items</Label>
                <Input type="number" value={totalItems} onChange={(e) => setTotalItems(e.target.value)} />
              </div>
              <div>
                <Label>Time Limit (minutes)</Label>
                <Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
              </div>
            </div>
            <Button
              onClick={() => createMutation.mutate({
                name, gradeLevel: parseInt(gradeLevel), subject,
                standardIds: [], dokDistribution: { "dok2": 40, "dok3": 40, "dok4": 20 },
                totalItems: parseInt(totalItems), timeLimitMinutes: parseInt(timeLimit), isActive: true, userRole: "admin",
              })}
              disabled={!name || createMutation.isPending}
              className="bg-slate-700 hover:bg-slate-800"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Blueprint
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (blueprints as any[])?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(blueprints as any[]).map((b: any) => (
            <Card key={b.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <h3 className="font-medium text-gray-800">{b.name}</h3>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{b.subject}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Grade {b.gradeLevel}</span>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">{b.totalItems} items</span>
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">{b.timeLimitMinutes} min</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed"><CardContent className="text-center py-8 text-gray-500">No blueprints yet. Create your first assessment blueprint above.</CardContent></Card>
      )}
    </div>
  );
}

function QuestionBankGovernanceTab() {
  const { toast } = useToast();

  const { data: items, isLoading } = useQuery({
    queryKey: ["/api/acap/items", { reviewStatus: "pending" }],
    queryFn: () => fetch("/api/acap/items?reviewStatus=pending").then((r) => r.json()),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/acap/items/${id}`, { reviewStatus: status, reviewedBy: "admin" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/items"] });
      toast({ title: "Item review updated" });
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Question Bank Governance</h2>
      <p className="text-gray-600">Review and approve AI-generated assessment items before they can be used in assessments.</p>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (items as any[])?.length > 0 ? (
        <div className="space-y-4">
          {(items as any[]).map((item: any) => (
            <Card key={item.id} className="border-amber-200">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">DOK {item.dokLevel}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{item.itemType.replace("_", " ")}</span>
                  {item.aiGenerated && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI Generated</span>}
                </div>

                <p className="text-gray-800 font-medium">{item.stem}</p>

                {item.options && (item.options as any[]).length > 0 && (
                  <div className="space-y-1 ml-4">
                    {(item.options as any[]).map((opt: any) => (
                      <p key={opt.key} className={`text-sm ${JSON.stringify(item.correctAnswer) === JSON.stringify(opt.key) ? "text-green-700 font-medium" : "text-gray-600"}`}>
                        {opt.key}. {opt.text} {JSON.stringify(item.correctAnswer) === JSON.stringify(opt.key) ? "(correct)" : ""}
                      </p>
                    ))}
                  </div>
                )}

                {item.explanation && (
                  <p className="text-xs text-gray-500 italic">Explanation: {item.explanation}</p>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    onClick={() => reviewMutation.mutate({ id: item.id, status: "approved" })}
                    disabled={reviewMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reviewMutation.mutate({ id: item.id, status: "rejected" })}
                    disabled={reviewMutation.isPending}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-medium">All items reviewed!</p>
            <p className="text-sm text-green-600">No pending items to review.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AdminReportsTab() {
  const { data: standards } = useQuery({ queryKey: ["/api/acap/standards"] });
  const { data: items } = useQuery({ queryKey: ["/api/acap/items"] });
  const { data: assessments } = useQuery({ queryKey: ["/api/acap/assessments"] });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">System Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-indigo-600">{(standards as any[])?.length || 0}</p>
            <p className="text-sm text-gray-500">Total Standards</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{(items as any[])?.length || 0}</p>
            <p className="text-sm text-gray-500">Total Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{(items as any[])?.filter((i: any) => i.reviewStatus === "approved").length || 0}</p>
            <p className="text-sm text-gray-500">Approved Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{(assessments as any[])?.length || 0}</p>
            <p className="text-sm text-gray-500">Assessments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Item Review Status Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">{(items as any[])?.filter((i: any) => i.reviewStatus === "pending").length || 0}</p>
              <p className="text-sm text-gray-500">Pending Review</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{(items as any[])?.filter((i: any) => i.reviewStatus === "approved").length || 0}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{(items as any[])?.filter((i: any) => i.reviewStatus === "rejected").length || 0}</p>
              <p className="text-sm text-gray-500">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AuditLogTab() {
  const { data: auditLog, isLoading } = useQuery({
    queryKey: ["/api/acap/audit-log"],
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Audit Log</h2>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (auditLog as any[])?.length > 0 ? (
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-4 text-xs font-medium text-gray-500 px-4 py-2 bg-gray-50 rounded">
            <span>Time</span><span>Action</span><span>Entity</span><span>User</span><span>Details</span>
          </div>
          {(auditLog as any[]).map((entry: any) => (
            <Card key={entry.id} className="hover:shadow-sm">
              <CardContent className="py-2 px-4">
                <div className="grid grid-cols-5 gap-4 items-center text-sm">
                  <span className="text-gray-400 text-xs">{new Date(entry.createdAt).toLocaleString()}</span>
                  <span className="font-medium">{entry.action}</span>
                  <span className="text-gray-600">{entry.entityType} #{entry.entityId}</span>
                  <span className="text-gray-500">{entry.userRole || "system"}</span>
                  <span className="text-xs text-gray-400 truncate">{JSON.stringify(entry.details)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed"><CardContent className="text-center py-8 text-gray-500">
          <History className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          No audit entries yet.
        </CardContent></Card>
      )}
    </div>
  );
}
