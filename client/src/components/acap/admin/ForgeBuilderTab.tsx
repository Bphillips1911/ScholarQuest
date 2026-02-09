import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Layers, Send, Download, Copy, Eye, Trash2 } from "lucide-react";

export default function ForgeBuilderTab() {
  const { toast } = useToast();
  const adminToken = localStorage.getItem("adminToken");

  const [title, setTitle] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [assessmentType, setAssessmentType] = useState("diagnostic");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [selectedStandardIds, setSelectedStandardIds] = useState<number[]>([]);
  const [dokFilter, setDokFilter] = useState<string>("all");
  const [standardFilter, setStandardFilter] = useState<string>("all");
  const [expandedAssessmentId, setExpandedAssessmentId] = useState<number | null>(null);
  const [publishTargetGrades, setPublishTargetGrades] = useState<number[]>([]);

  const { data: standards = [] } = useQuery<any[]>({
    queryKey: ["/api/acap/standards"],
  });

  const { data: approvedItems = [] } = useQuery<any[]>({
    queryKey: ["/api/acap/items", { reviewStatus: "approved" }],
    queryFn: async () => {
      const res = await fetch("/api/acap/items?reviewStatus=approved");
      if (!res.ok) throw new Error("Failed to fetch approved items");
      return res.json();
    },
  });

  const { data: forgeAssessments = [], isLoading: loadingAssessments } = useQuery<any[]>({
    queryKey: ["/api/acap/forge/assessments"],
    queryFn: async () => {
      const res = await fetch("/api/acap/forge/assessments", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch forge assessments");
      return res.json();
    },
    enabled: !!adminToken,
  });

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch("/api/acap/forge/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create assessment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/forge/assessments"] });
      toast({ title: "Assessment Created", description: "Forge assessment saved as draft." });
      setTitle("");
      setSelectedGrades([]);
      setSelectedSubjects([]);
      setAssessmentType("diagnostic");
      setTimeLimitMinutes(60);
      setSelectedItemIds([]);
      setSelectedStandardIds([]);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const differentiateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/acap/forge/assessments/${id}/differentiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to differentiate");
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/forge/assessments"] });
      toast({ title: "Versions Generated", description: "A/B/C/D versions created with unique access codes." });
      setExpandedAssessmentId(id);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, targetGrades }: { id: number; targetGrades: number[] }) => {
      const res = await fetch(`/api/acap/forge/assessments/${id}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ targetGrades }),
      });
      if (!res.ok) throw new Error("Failed to publish");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/forge/assessments"] });
      toast({ title: "Published", description: "Assessment is now live and assigned." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/acap/forge/assessments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/forge/assessments"] });
      toast({ title: "Deleted", description: "Assessment removed." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const expandedId = expandedAssessmentId;

  const { data: versions = [] } = useQuery<any[]>({
    queryKey: ["/api/acap/forge/assessments", expandedId, "versions"],
    queryFn: async () => {
      const res = await fetch(`/api/acap/forge/assessments/${expandedId}/versions`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch versions");
      return res.json();
    },
    enabled: !!adminToken && !!expandedId,
  });

  const toggleGrade = (g: number) => {
    setSelectedGrades((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const toggleSubject = (s: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggleItem = (id: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAllFilteredItems = () => {
    const filtered = filteredItems.map((i: any) => i.id);
    const allSelected = filtered.every((id: number) => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds((prev) => prev.filter((id) => !filtered.includes(id)));
    } else {
      setSelectedItemIds((prev) => Array.from(new Set([...prev, ...filtered])));
    }
  };

  const filteredItems = approvedItems.filter((item: any) => {
    if (dokFilter !== "all" && item.dokLevel !== parseInt(dokFilter)) return false;
    if (standardFilter !== "all" && item.standardId !== parseInt(standardFilter)) return false;
    return true;
  });

  const standardMap = standards.reduce((acc: Record<number, any>, s: any) => {
    acc[s.id] = s;
    return acc;
  }, {});

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: "Validation", description: "Assessment title is required.", variant: "destructive" });
      return;
    }
    if (selectedGrades.length === 0) {
      toast({ title: "Validation", description: "Select at least one grade level.", variant: "destructive" });
      return;
    }
    if (selectedItemIds.length === 0) {
      toast({ title: "Validation", description: "Select at least one item from the question bank.", variant: "destructive" });
      return;
    }

    const usedStandardIds = Array.from(new Set(
      selectedItemIds
        .map((id) => approvedItems.find((i: any) => i.id === id)?.standardId)
        .filter(Boolean)
    ));

    createMutation.mutate({
      title,
      grades: selectedGrades,
      subjects: selectedSubjects,
      assessmentType,
      timeLimitMinutes,
      itemIds: selectedItemIds,
      standardIds: usedStandardIds,
      dokDistribution: {},
      status: "draft",
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-700";
      case "versioned": return "bg-blue-100 text-blue-700";
      case "published": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-700 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <Layers className="h-7 w-7" />
          <h2 className="text-2xl font-bold">ACAP Forge™</h2>
        </div>
        <p className="text-indigo-200 text-sm">Build. Differentiate. Deliver. Diagnose.</p>
      </div>

      <Card className="border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <Plus className="h-5 w-5" /> Assessment Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label htmlFor="forge-title">Assessment Name</Label>
            <Input
              id="forge-title"
              placeholder="e.g. Fall Diagnostic — 7th Grade Math"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <Label className="mb-2 block">Grade Levels</Label>
              <div className="flex gap-3">
                {[6, 7, 8].map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedGrades.includes(g)}
                      onCheckedChange={() => toggleGrade(g)}
                    />
                    <span className="text-sm font-medium">Grade {g}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Subjects</Label>
              <div className="flex gap-2 flex-wrap">
                {["Math", "ELA", "Science"].map((s) => (
                  <Badge
                    key={s}
                    variant={selectedSubjects.includes(s) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      selectedSubjects.includes(s)
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "hover:bg-indigo-50 border-indigo-300 text-indigo-700"
                    }`}
                    onClick={() => toggleSubject(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Assessment Type</Label>
              <Select value={assessmentType} onValueChange={setAssessmentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diagnostic">Diagnostic</SelectItem>
                  <SelectItem value="baseline">Baseline</SelectItem>
                  <SelectItem value="midpoint">Midpoint</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="max-w-xs">
            <Label htmlFor="forge-time">Time Limit (minutes)</Label>
            <Input
              id="forge-time"
              type="number"
              min={10}
              max={180}
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 60)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <Layers className="h-5 w-5" /> Item Blueprint & Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-xs text-gray-500">Standard Filter</Label>
              <Select value={standardFilter} onValueChange={setStandardFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="All Standards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Standards</SelectItem>
                  {standards.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">DOK Level</Label>
              <Select value={dokFilter} onValueChange={setDokFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All DOK" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All DOK</SelectItem>
                  <SelectItem value="1">DOK 1</SelectItem>
                  <SelectItem value="2">DOK 2</SelectItem>
                  <SelectItem value="3">DOK 3</SelectItem>
                  <SelectItem value="4">DOK 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto">
              <Badge variant="outline" className="border-indigo-300 text-indigo-700 px-3 py-1">
                ACAP Question Bank: {approvedItems.length} approved items
              </Badge>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-indigo-50">
                <tr>
                  <th className="p-3 text-left w-10">
                    <Checkbox
                      checked={filteredItems.length > 0 && filteredItems.every((i: any) => selectedItemIds.includes(i.id))}
                      onCheckedChange={toggleAllFilteredItems}
                    />
                  </th>
                  <th className="p-3 text-left font-medium text-indigo-800">Standard</th>
                  <th className="p-3 text-left font-medium text-indigo-800">DOK</th>
                  <th className="p-3 text-left font-medium text-indigo-800">Type</th>
                  <th className="p-3 text-left font-medium text-indigo-800">Stem Preview</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
                      No approved items found. Generate and approve items in the Question Bank tab first.
                    </td>
                  </tr>
                ) : (
                  filteredItems.slice(0, 50).map((item: any) => {
                    const std = standardMap[item.standardId];
                    return (
                      <tr key={item.id} className={`border-t hover:bg-indigo-50/50 ${selectedItemIds.includes(item.id) ? "bg-indigo-50" : ""}`}>
                        <td className="p-3">
                          <Checkbox
                            checked={selectedItemIds.includes(item.id)}
                            onCheckedChange={() => toggleItem(item.id)}
                          />
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {std?.code || `STD-${item.standardId}`}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                            {item.dokLevel}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 capitalize">{item.itemType?.replace(/_/g, " ")}</td>
                        <td className="p-3 text-gray-700 max-w-xs truncate">{item.stem}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {Math.min(filteredItems.length, 50)} of {filteredItems.length} items
            </p>
            <div className="flex items-center gap-3">
              <Badge className="bg-indigo-600 text-white px-4 py-1.5 text-sm">
                {selectedItemIds.length} items selected
              </Badge>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="bg-indigo-700 hover:bg-indigo-800"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Forge Assessment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <Layers className="h-5 w-5" /> Existing Forge Assessments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAssessments ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-500">Loading assessments...</span>
            </div>
          ) : forgeAssessments.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No forge assessments yet. Create one above.</p>
          ) : (
            <div className="space-y-3">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left font-medium text-gray-700">Title</th>
                      <th className="p-3 text-left font-medium text-gray-700">Status</th>
                      <th className="p-3 text-left font-medium text-gray-700">Grades</th>
                      <th className="p-3 text-left font-medium text-gray-700">Subjects</th>
                      <th className="p-3 text-left font-medium text-gray-700">Items</th>
                      <th className="p-3 text-left font-medium text-gray-700">Type</th>
                      <th className="p-3 text-right font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forgeAssessments.map((a: any) => (
                      <tr key={a.id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-800">{a.title}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(a.status)}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {(a.grades || []).map((g: number) => (
                              <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {(a.subjects || []).map((s: string) => (
                              <Badge key={s} variant="outline" className="text-xs border-indigo-200 text-indigo-600">{s}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-gray-600">{(a.itemIds || []).length}</td>
                        <td className="p-3 text-gray-600 capitalize">{a.assessmentType}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => setExpandedAssessmentId(expandedAssessmentId === a.id ? null : a.id)}
                            >
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Button>
                            {a.status === "draft" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                                onClick={() => differentiateMutation.mutate(a.id)}
                                disabled={differentiateMutation.isPending}
                              >
                                {differentiateMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <Layers className="h-3 w-3 mr-1" />
                                )}
                                Differentiate
                              </Button>
                            )}
                            {(a.status === "versioned" || a.status === "draft") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-green-300 text-green-700 hover:bg-green-50"
                                onClick={() => {
                                  setPublishTargetGrades(a.grades || []);
                                  publishMutation.mutate({ id: a.id, targetGrades: a.grades || [] });
                                }}
                                disabled={publishMutation.isPending}
                              >
                                {publishMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <Send className="h-3 w-3 mr-1" />
                                )}
                                Publish
                              </Button>
                            )}
                            {a.status === "draft" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-red-300 text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm("Delete this assessment?")) {
                                    deleteMutation.mutate(a.id);
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {expandedAssessmentId && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Layers className="h-5 w-5" /> Differentiated Versions
              <Badge variant="outline" className="ml-2 text-xs">
                Assessment #{expandedAssessmentId}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {versions.length === 0 ? (
              <p className="text-center text-gray-400 py-6">
                No versions generated yet. Click "Differentiate" on a draft assessment to generate A/B/C/D versions.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {versions.map((v: any) => (
                  <Card key={v.id} className="border-blue-200">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-600 text-white text-lg px-3 py-1">
                          Version {v.versionLabel}
                        </Badge>
                        <span className="text-xs text-gray-400">#{v.id}</span>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Access Code</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-white border border-blue-200 rounded px-3 py-1.5 text-lg font-mono font-bold tracking-wider text-blue-800">
                            {v.accessCode || "N/A"}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              if (v.accessCode) {
                                navigator.clipboard.writeText(v.accessCode);
                                toast({ title: "Copied", description: `Access code ${v.accessCode} copied to clipboard.` });
                              }
                            }}
                          >
                            <Copy className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {(v.itemOrder || []).length} items in order
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
