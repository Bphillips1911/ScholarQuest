import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Upload, Wand2, FileText, Tag, Hammer, Sparkles, RefreshCw, Trash2,
  CheckCircle2, AlertTriangle, XCircle, SlidersHorizontal, Download,
  Settings, Layers, ListChecks, FileUp, ShieldCheck, Plus, Loader2,
} from "lucide-react";

type Subject = "ELA" | "Math" | "Science";
type GradeBand = "6" | "7" | "8";
type ParseStatus = "queued" | "parsing" | "parsed" | "error";
type ItemType = "MCQ" | "Short Response" | "Passage" | "Writing Prompt";
type ReviewStatus = "Needs Review" | "Accepted" | "Edited" | "Rejected";

type StagedItem = {
  id: string;
  sourceDocId: string;
  type: string;
  subject?: Subject;
  grade?: GradeBand;
  stem: string;
  promptPreview?: string;
  hasKey: boolean;
  answerKey?: string;
  suggestedDOK?: number;
  suggestedStandards?: Array<{ code: string; label: string; confidence: number }>;
  reviewStatus: ReviewStatus;
  confidence: number;
  lastUpdated?: string;
};

type RuleRow = {
  id: number;
  enabled: boolean;
  matchPattern: string;
  mapsToStandard: string;
  dokHint?: number;
  notes?: string;
};

type BudgetState = {
  enabled: boolean;
  dailyCapUSD: number;
  perAssessmentCapUSD: number;
  usageTodayUSD: number;
  usageThisAssessmentUSD: number;
};

type AiAddonFlags = {
  rationales: boolean;
  rewriteStems: boolean;
  improveDistractors: boolean;
  teacherExplanation: boolean;
  studentHint: boolean;
};

export default function ForgeCostControlsTab() {
  const { toast } = useToast();
  const adminToken = localStorage.getItem("adminToken");
  const authHeaders = { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" };

  const [subject, setSubject] = useState<Subject>("Math");
  const [grade, setGrade] = useState<GradeBand>("6");
  const [strictMode, setStrictMode] = useState(true);
  const [allowMultiTag, setAllowMultiTag] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(80);
  const [selectedRulePackId, setSelectedRulePackId] = useState<string>("");
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [budget, setBudget] = useState<BudgetState>({
    enabled: false, dailyCapUSD: 10, perAssessmentCapUSD: 3,
    usageTodayUSD: 0, usageThisAssessmentUSD: 0,
  });
  const [aiAddons, setAiAddons] = useState<AiAddonFlags>({
    rationales: false, rewriteStems: false, improveDistractors: false,
    teacherExplanation: false, studentHint: false,
  });

  const { data: offlineSources = [], isLoading: loadingSources } = useQuery<any[]>({
    queryKey: ["/api/acap/forge/offline-sources"],
    queryFn: async () => {
      const res = await fetch("/api/acap/forge/offline-sources", { headers: { Authorization: `Bearer ${adminToken}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!adminToken,
  });

  const { data: rulePacks = [] } = useQuery<any[]>({
    queryKey: ["/api/acap/forge/rule-packs"],
    queryFn: async () => {
      const res = await fetch("/api/acap/forge/rule-packs", { headers: { Authorization: `Bearer ${adminToken}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!adminToken,
  });

  const rulePackIdNum = parseInt(selectedRulePackId) || (rulePacks[0]?.id ?? 0);

  const { data: rules = [] } = useQuery<RuleRow[]>({
    queryKey: ["/api/acap/forge/rule-packs", rulePackIdNum, "rules"],
    queryFn: async () => {
      const res = await fetch(`/api/acap/forge/rule-packs/${rulePackIdNum}/rules`, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!adminToken && rulePackIdNum > 0,
  });

  const { data: aiUsage } = useQuery<any>({
    queryKey: ["/api/acap/forge/ai/usage"],
    queryFn: async () => {
      const res = await fetch("/api/acap/forge/ai/usage?range=today", { headers: { Authorization: `Bearer ${adminToken}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!adminToken,
  });

  useEffect(() => {
    if (aiUsage && aiUsage.todayUsd !== undefined) {
      setBudget(prev => {
        if (prev.usageTodayUSD !== aiUsage.todayUsd) {
          return { ...prev, usageTodayUSD: aiUsage.todayUsd || 0 };
        }
        return prev;
      });
    }
  }, [aiUsage]);

  const uploadMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch("/api/acap/forge/offline/upload", { method: "POST", headers: authHeaders, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/forge/offline-sources"] });
      toast({ title: "Source Added", description: "File uploaded. Ready for parsing." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/acap/forge/offline-sources/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/forge/offline-sources"] });
      toast({ title: "Removed" });
    },
  });

  const parseMutation = useMutation({
    mutationFn: async (sourceId: number) => {
      const res = await fetch("/api/acap/forge/offline/parse", { method: "POST", headers: authHeaders, body: JSON.stringify({ sourceId }) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/forge/offline-sources"] });
      const newItems: StagedItem[] = (data.items || []).map((it: any) => ({
        id: it.id,
        sourceDocId: it.sourceDocId || `src_${data.sourceId}`,
        type: it.type || "MCQ",
        subject,
        grade,
        stem: it.stem,
        promptPreview: it.stem,
        hasKey: !!it.answerKey,
        answerKey: it.answerKey,
        suggestedDOK: undefined,
        suggestedStandards: [],
        reviewStatus: "Needs Review" as ReviewStatus,
        confidence: it.confidence || 0,
      }));
      setStagedItems(prev => [...prev, ...newItems]);
      toast({ title: "Parsed", description: `${data.itemCount} items detected.` });
    },
    onError: (e: any) => toast({ title: "Parse Error", description: e.message, variant: "destructive" }),
  });

  const autoTagRulesMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch("/api/acap/forge/auto-tag-rules", { method: "POST", headers: authHeaders, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      const tagged = data.taggedItems || [];
      setStagedItems(prev => {
        const updated = [...prev];
        for (const t of tagged) {
          const idx = updated.findIndex(it => it.id === t.id);
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], suggestedStandards: t.suggestedStandards, suggestedDOK: t.suggestedDOK, confidence: t.confidence, reviewStatus: t.reviewStatus || "Needs Review" };
          }
        }
        return updated;
      });
      toast({ title: "Auto-Tag Complete", description: `Tagged ${data.totalTagged}/${data.totalItems} items.` });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveRulePackMutation = useMutation({
    mutationFn: async (body: { rulePackId: number; rules: any[] }) => {
      const res = await fetch(`/api/acap/forge/rule-packs/${body.rulePackId}/rules/bulk`, {
        method: "PUT", headers: authHeaders,
        body: JSON.stringify({ rules: body.rules }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/forge/rule-packs", rulePackIdNum, "rules"] });
      toast({ title: "Rules Saved" });
    },
  });

  const aiEstimateMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch("/api/acap/forge/ai/estimate", { method: "POST", headers: authHeaders, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      setBudget(prev => ({ ...prev, usageThisAssessmentUSD: data.estimatedCostUsd }));
      toast({ title: "Estimate", description: data.enabledFeatures === 0 ? "No AI add-ons enabled. Cost: $0.00" : `Estimated: $${data.estimatedCostUsd.toFixed(4)} for ${data.enabledFeatures} add-on(s) × ${data.itemCount} items.` });
    },
  });

  const aiRunMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch("/api/acap/forge/ai/run", { method: "POST", headers: authHeaders, body: JSON.stringify(body) });
      if (!res.ok) { const t = await res.text(); throw new Error(t); }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/forge/ai/usage"] });
      toast({ title: "AI Enhancements Applied", description: `$${data.totalCost.toFixed(4)} spent on ${data.features.length} feature(s).` });
    },
    onError: (e: any) => toast({ title: "AI Error", description: e.message, variant: "destructive" }),
  });

  const buildMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch("/api/acap/forge/build-from-staged", { method: "POST", headers: authHeaders, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/forge/assessments"] });
      toast({ title: "Assessment Built", description: `"${data.title}" created as draft.` });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filteredItems = useMemo(() => stagedItems.filter(it => it.subject === subject && it.grade === grade), [stagedItems, subject, grade]);
  const acceptedAboveThreshold = useMemo(() => filteredItems.filter(it => (it.suggestedStandards?.[0]?.confidence ?? it.confidence) >= confidenceThreshold).length, [filteredItems, confidenceThreshold]);

  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadOriginalName, setUploadOriginalName] = useState("");
  const [uploadFileType, setUploadFileType] = useState("pdf");
  const [localRules, setLocalRules] = useState<RuleRow[]>([]);
  const prevRulePackRef = useRef<number>(0);

  useEffect(() => {
    if (rules.length > 0 && rulePackIdNum !== prevRulePackRef.current) {
      setLocalRules(rules);
      prevRulePackRef.current = rulePackIdNum;
    }
  }, [rules, rulePackIdNum]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Forge → Cost Controls & Offline Builder</div>
          <div className="mt-1 text-sm text-muted-foreground">Upload → auto-tag standards (rules-based) → build test with $0 AI. Optional AI add-ons for the final 10%.</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => {
            const csv = stagedItems.map(it => `"${it.stem}",${it.type},${it.suggestedDOK || ""},${it.suggestedStandards?.[0]?.code || ""},${it.confidence},${it.reviewStatus}`).join("\n");
            const blob = new Blob(["Stem,Type,DOK,Standard,Confidence,Status\n" + csv], { type: "text/csv" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "forge-items-export.csv"; a.click();
          }}>
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        <Card className="md:col-span-8">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Offline Pipeline</CardTitle>
            <CardDescription>Run the pipeline in order. Everything works without AI.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="upload" className="gap-2"><Upload className="h-4 w-4" /> Upload</TabsTrigger>
                <TabsTrigger value="tag" className="gap-2"><Tag className="h-4 w-4" /> Auto-tag</TabsTrigger>
                <TabsTrigger value="build" className="gap-2"><Hammer className="h-4 w-4" /> Build Test</TabsTrigger>
                <TabsTrigger value="ai" className="gap-2"><Sparkles className="h-4 w-4" /> AI Add-ons</TabsTrigger>
              </TabsList>

              {/* ===== UPLOAD TAB ===== */}
              <TabsContent value="upload" className="mt-4">
                <div className="grid gap-4">
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2"><FileUp className="h-5 w-5" /> Upload Sources (No AI)</CardTitle>
                      <CardDescription>Add source documents. Offline parsing detects items & passages.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid gap-3 rounded-lg border bg-muted/20 p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <Label className="text-xs">Filename</Label>
                            <Input className="mt-1" placeholder="e.g. math-items-bank.pdf" value={uploadFileName} onChange={e => setUploadFileName(e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-xs">Display Name</Label>
                            <Input className="mt-1" placeholder="e.g. 7th Grade Math Items" value={uploadOriginalName} onChange={e => setUploadOriginalName(e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-xs">File Type</Label>
                            <Select value={uploadFileType} onValueChange={setUploadFileType}>
                              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="docx">DOCX</SelectItem>
                                <SelectItem value="txt">TXT</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Grade</Label>
                              <Select value={grade} onValueChange={v => setGrade(v as GradeBand)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="6">Grade 6</SelectItem>
                                  <SelectItem value="7">Grade 7</SelectItem>
                                  <SelectItem value="8">Grade 8</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Subject</Label>
                              <Select value={subject} onValueChange={v => setSubject(v as Subject)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Math">Math</SelectItem>
                                  <SelectItem value="ELA">ELA</SelectItem>
                                  <SelectItem value="Science">Science</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button onClick={() => {
                            if (!uploadFileName.trim()) { toast({ title: "Validation", description: "Filename required.", variant: "destructive" }); return; }
                            uploadMutation.mutate({ filename: uploadFileName.trim(), originalName: uploadOriginalName.trim() || uploadFileName.trim(), fileType: uploadFileType, gradeLevel: parseInt(grade), subject });
                            setUploadFileName(""); setUploadOriginalName("");
                          }} disabled={uploadMutation.isPending} className="gap-2">
                            {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload Source
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Uploaded Sources</CardTitle>
                      <CardDescription>Parse status + detected items.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>File</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Items</TableHead>
                            <TableHead className="w-[140px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingSources ? (
                            <TableRow><TableCell colSpan={4} className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                          ) : offlineSources.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No uploads yet.</TableCell></TableRow>
                          ) : offlineSources.map((d: any) => (
                            <TableRow key={d.id}>
                              <TableCell>
                                <div className="font-medium">{d.originalName || d.filename}</div>
                                <div className="text-xs text-muted-foreground">{(d.fileType || "txt").toUpperCase()} • Grade {d.gradeLevel} {d.subject}</div>
                              </TableCell>
                              <TableCell><ParseStatusBadge status={d.parseStatus || "queued"} /></TableCell>
                              <TableCell className="text-right font-medium">{(d.detectedItems || []).length}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="outline" size="sm" onClick={() => parseMutation.mutate(d.id)} disabled={parseMutation.isPending}>
                                    <RefreshCw className={cn("h-4 w-4", parseMutation.isPending && "animate-spin")} />
                                  </Button>
                                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(d.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ===== AUTO-TAG TAB ===== */}
              <TabsContent value="tag" className="mt-4">
                <Card className="mb-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" /> Auto-Tag Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-4 md:grid-cols-12">
                      <div className="md:col-span-3">
                        <Label className="text-xs">Subject</Label>
                        <Select value={subject} onValueChange={v => setSubject(v as Subject)}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Math">Math</SelectItem>
                            <SelectItem value="ELA">ELA</SelectItem>
                            <SelectItem value="Science">Science</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs">Grade</Label>
                        <Select value={grade} onValueChange={v => setGrade(v as GradeBand)}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="6">6</SelectItem>
                            <SelectItem value="7">7</SelectItem>
                            <SelectItem value="8">8</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2 flex items-end gap-2">
                        <Switch checked={strictMode} onCheckedChange={setStrictMode} />
                        <Label className="text-xs">Strict</Label>
                      </div>
                      <div className="md:col-span-2 flex items-end gap-2">
                        <Switch checked={allowMultiTag} onCheckedChange={setAllowMultiTag} />
                        <Label className="text-xs">Multi-Tag</Label>
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-xs">Confidence Threshold: {confidenceThreshold}%</Label>
                        <Slider value={[confidenceThreshold]} min={40} max={100} step={5} onValueChange={v => setConfidenceThreshold(v[0] ?? 80)} className="mt-2" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button onClick={() => {
                        if (stagedItems.length === 0) { toast({ title: "No Items", description: "Upload and parse sources first.", variant: "destructive" }); return; }
                        autoTagRulesMutation.mutate({
                          items: stagedItems.filter(i => i.subject === subject && i.grade === grade),
                          gradeLevel: parseInt(grade), subject, rulePackId: rulePackIdNum,
                          strictMode, allowMultiTag,
                        });
                      }} disabled={autoTagRulesMutation.isPending || stagedItems.length === 0} className="gap-2">
                        {autoTagRulesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Run Auto-Tag
                      </Button>
                      <Badge variant="secondary">{acceptedAboveThreshold} items above {confidenceThreshold}%</Badge>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-12">
                  <Card className="lg:col-span-5">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5" /> Rule Pack + Editor</CardTitle>
                      <CardDescription>Rules-based tagging. No AI required.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 mb-3">
                        <Select value={selectedRulePackId || String(rulePacks[0]?.id || "")} onValueChange={v => { setSelectedRulePackId(v); prevRulePackRef.current = 0; }}>
                          <SelectTrigger><SelectValue placeholder="Select pack" /></SelectTrigger>
                          <SelectContent>
                            {rulePacks.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Separator className="my-3" />
                      <ScrollArea className="h-[280px]">
                        <div className="space-y-2">
                          {localRules.map((rule, idx) => (
                            <div key={rule.id || idx} className="rounded-lg border p-2 space-y-1">
                              <div className="flex items-center gap-2">
                                <Checkbox checked={rule.enabled} onCheckedChange={(v) => {
                                  setLocalRules(prev => prev.map((r, i) => i === idx ? { ...r, enabled: Boolean(v) } : r));
                                }} />
                                <Input value={rule.matchPattern} className="text-xs h-7" onChange={e => {
                                  setLocalRules(prev => prev.map((r, i) => i === idx ? { ...r, matchPattern: e.target.value } : r));
                                }} />
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <Input value={rule.mapsToStandard} className="text-xs h-7" placeholder="Standard" onChange={e => {
                                  setLocalRules(prev => prev.map((r, i) => i === idx ? { ...r, mapsToStandard: e.target.value } : r));
                                }} />
                                <Select value={String(rule.dokHint || 2)} onValueChange={v => {
                                  setLocalRules(prev => prev.map((r, i) => i === idx ? { ...r, dokHint: parseInt(v) } : r));
                                }}>
                                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="2">DOK 2</SelectItem>
                                    <SelectItem value="3">DOK 3</SelectItem>
                                    <SelectItem value="4">DOK 4</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => {
                                  setLocalRules(prev => prev.filter((_, i) => i !== idx));
                                }}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                              {rule.notes && <div className="text-xs text-muted-foreground pl-6">{rule.notes}</div>}
                            </div>
                          ))}
                          <Button variant="outline" size="sm" className="w-full gap-1" onClick={() => {
                            setLocalRules(prev => [...prev, { id: 0, enabled: true, matchPattern: "", mapsToStandard: "", dokHint: 2, notes: "" }]);
                          }}><Plus className="h-3 w-3" /> Add Rule</Button>
                        </div>
                      </ScrollArea>
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                      <Button variant="outline" className="gap-2" onClick={() => {
                        saveRulePackMutation.mutate({ rulePackId: rulePackIdNum, rules: localRules.map(r => ({ enabled: r.enabled, matchPattern: r.matchPattern, mapsToStandard: r.mapsToStandard, dokHint: r.dokHint, notes: r.notes })) });
                      }} disabled={saveRulePackMutation.isPending}>
                        {saveRulePackMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />} Save Pack
                      </Button>
                      <Button className="gap-2" onClick={() => {
                        if (stagedItems.length === 0) { toast({ title: "No items", variant: "destructive" }); return; }
                        autoTagRulesMutation.mutate({
                          items: stagedItems.filter(i => i.subject === subject && i.grade === grade),
                          gradeLevel: parseInt(grade), subject, rulePackId: rulePackIdNum,
                          strictMode, allowMultiTag,
                        });
                      }} disabled={autoTagRulesMutation.isPending}>
                        <Wand2 className="h-4 w-4" /> Apply Rules
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card className="lg:col-span-7">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" /> Item Staging Queue</CardTitle>
                      <CardDescription>Review, accept, edit, or reject items before building a test.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary">{filteredItems.length} items • {filteredItems.filter(i => i.reviewStatus === "Accepted").length} accepted</Badge>
                        <Button variant="outline" size="sm" onClick={() => {
                          setStagedItems(prev => prev.map(it => {
                            if (it.subject !== subject || it.grade !== grade) return it;
                            const conf = it.suggestedStandards?.[0]?.confidence ?? it.confidence;
                            return conf >= confidenceThreshold ? { ...it, reviewStatus: "Accepted" } : it;
                          }));
                          toast({ title: "Bulk Accept", description: `Accepted items above ${confidenceThreshold}%.` });
                        }} className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Accept All ≥ {confidenceThreshold}%
                        </Button>
                      </div>
                      <ScrollArea className="h-[300px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>DOK</TableHead>
                              <TableHead>Standard</TableHead>
                              <TableHead>Confidence</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredItems.length === 0 ? (
                              <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">No items. Upload and parse sources first.</TableCell></TableRow>
                            ) : filteredItems.map(it => (
                              <TableRow key={it.id}>
                                <TableCell className="max-w-[180px]">
                                  <div className="text-sm truncate">{it.stem || it.promptPreview}</div>
                                  <div className="text-xs text-muted-foreground">{it.type}{it.hasKey ? " • Has Key" : ""}</div>
                                </TableCell>
                                <TableCell><Badge variant="outline">{it.suggestedDOK || "—"}</Badge></TableCell>
                                <TableCell>
                                  {it.suggestedStandards?.slice(0, 1).map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s.code}</Badge>)}
                                  {(!it.suggestedStandards || it.suggestedStandards.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
                                </TableCell>
                                <TableCell><ConfidencePill value={it.suggestedStandards?.[0]?.confidence ?? it.confidence} threshold={confidenceThreshold} /></TableCell>
                                <TableCell><ReviewStatusBadge status={it.reviewStatus} /></TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Set</Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => setStagedItems(prev => prev.map(i => i.id === it.id ? { ...i, reviewStatus: "Accepted" } : i))}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Accept
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setStagedItems(prev => prev.map(i => i.id === it.id ? { ...i, reviewStatus: "Edited" } : i))}>
                                        <Wand2 className="mr-2 h-4 w-4" /> Mark Edited
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => setStagedItems(prev => prev.map(i => i.id === it.id ? { ...i, reviewStatus: "Rejected" } : i))} className="text-destructive">
                                        <XCircle className="mr-2 h-4 w-4" /> Reject
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ===== BUILD TEST TAB ===== */}
              <TabsContent value="build" className="mt-4">
                <BuildTestPanel
                  subject={subject} grade={grade}
                  stagedItems={filteredItems.filter(i => i.reviewStatus === "Accepted" || i.reviewStatus === "Edited")}
                  onBuild={(opts) => buildMutation.mutate(opts)}
                  isBuilding={buildMutation.isPending}
                />
              </TabsContent>

              {/* ===== AI ADD-ONS TAB ===== */}
              <TabsContent value="ai" className="mt-4">
                <AiAddOnsPanel
                  budget={budget} setBudget={setBudget}
                  aiAddons={aiAddons} setAiAddons={setAiAddons}
                  itemCount={stagedItems.length}
                  onEstimate={() => aiEstimateMutation.mutate({ flags: aiAddons, itemCount: stagedItems.length })}
                  onRunEnhancements={() => aiRunMutation.mutate({ flags: aiAddons, itemCount: stagedItems.length, dailyCap: budget.dailyCapUSD, perAssessmentCap: budget.perAssessmentCapUSD })}
                  isEstimating={aiEstimateMutation.isPending}
                  isRunning={aiRunMutation.isPending}
                  aiUsageLog={aiUsage?.log || []}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="md:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Cost Controls</CardTitle>
            <CardDescription>Always know what you'll spend. Default is $0.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <BudgetMeter budget={budget} onChange={setBudget} />
            <Separator className="my-4" />
            <OfflineStatusCard docs={offlineSources} items={stagedItems} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ParseStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    queued: { label: "Queued", variant: "secondary" },
    parsing: { label: "Parsing", variant: "outline" },
    parsed: { label: "Parsed", variant: "default" },
    error: { label: "Error", variant: "destructive" },
  };
  const v = map[status] || map.queued;
  return <Badge variant={v.variant}>{v.label}</Badge>;
}

function ReviewStatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: any; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    "Needs Review": { icon: <AlertTriangle className="mr-1 h-3.5 w-3.5" />, variant: "outline" },
    "Accepted": { icon: <CheckCircle2 className="mr-1 h-3.5 w-3.5" />, variant: "default" },
    "Edited": { icon: <Wand2 className="mr-1 h-3.5 w-3.5" />, variant: "secondary" },
    "Rejected": { icon: <XCircle className="mr-1 h-3.5 w-3.5" />, variant: "destructive" },
  };
  const v = map[status] || map["Needs Review"];
  return <Badge variant={v.variant} className="inline-flex items-center">{v.icon}{status}</Badge>;
}

function ConfidencePill({ value, threshold }: { value: number; threshold: number }) {
  const good = value >= threshold;
  return (
    <div className="inline-flex items-center gap-2">
      <Badge variant={good ? "default" : "secondary"}>{value}%</Badge>
    </div>
  );
}

function BuildTestPanel({ subject, grade, stagedItems, onBuild, isBuilding }: {
  subject: Subject; grade: GradeBand; stagedItems: StagedItem[];
  onBuild: (opts: any) => void; isBuilding: boolean;
}) {
  const [testName, setTestName] = useState(`Forge Assessment — Grade ${grade} ${subject}`);
  const [timeLimitMin, setTimeLimitMin] = useState(60);
  const [randomize, setRandomize] = useState(true);
  const [dok2, setDok2] = useState(40);
  const [dok3, setDok3] = useState(40);
  const [dok4, setDok4] = useState(20);
  const [lockPlayer, setLockPlayer] = useState(true);
  const [requireReflection, setRequireReflection] = useState(true);
  const [reorderItems, setReorderItems] = useState(true);
  const [shuffleChoices, setShuffleChoices] = useState(true);

  const dokTotal = dok2 + dok3 + dok4;
  const itemsWithKeys = stagedItems.filter(i => i.hasKey || i.answerKey).length;
  const uniqueStandards = new Set(stagedItems.flatMap(i => (i.suggestedStandards || []).map(s => s.code)));

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2"><Hammer className="h-5 w-5" /> Assemble Assessment (Zero AI)</CardTitle>
          <CardDescription>Build from accepted/edited items, then differentiate A/B/C using offline logic.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-8 grid gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Assessment name</Label>
                <Input className="mt-1" value={testName} onChange={e => setTestName(e.target.value)} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Time limit (minutes)</Label>
                  <Input className="mt-1" type="number" value={timeLimitMin} onChange={e => setTimeLimitMin(Number(e.target.value || 0))} />
                </div>
                <div className="flex items-end gap-2">
                  <Checkbox checked={randomize} onCheckedChange={v => setRandomize(Boolean(v))} />
                  <Label className="text-sm">Randomize order</Label>
                </div>
              </div>
              <Separator />
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">DOK Distribution</div>
                  <Badge variant={dokTotal === 100 ? "default" : "destructive"}>DOK2 {dok2}% • DOK3 {dok3}% • DOK4 {dok4}% {dokTotal !== 100 ? `(${dokTotal}%)` : ""}</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <DokSlider label="DOK 2" value={dok2} onChange={setDok2} />
                  <DokSlider label="DOK 3" value={dok3} onChange={setDok3} />
                  <DokSlider label="DOK 4" value={dok4} onChange={setDok4} />
                </div>
              </div>
            </div>
            <div className="md:col-span-4">
              <div className="rounded-lg border bg-muted/10 p-4">
                <div className="text-sm font-medium">Blueprint Coverage</div>
                <div className="mt-2 space-y-3">
                  <CoverageRow label="Accepted items" value={stagedItems.length > 0 ? 100 : 0} />
                  <CoverageRow label="Standards covered" value={Math.min(100, uniqueStandards.size * 15)} />
                  <CoverageRow label="Items with keys" value={stagedItems.length > 0 ? Math.round((itemsWithKeys / stagedItems.length) * 100) : 0} />
                </div>
                <div className="mt-3 text-xs text-muted-foreground">{stagedItems.length} items ready to build</div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button onClick={() => onBuild({
            title: testName, grades: [parseInt(grade)], subjects: [subject],
            assessmentType: "diagnostic", timeLimitMinutes: timeLimitMin,
            lockMode: lockPlayer, antiRushMonitor: requireReflection,
            stagedItems, dokDistribution: { dok2, dok3, dok4 },
          })} disabled={isBuilding || stagedItems.length === 0} className="gap-2">
            {isBuilding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hammer className="h-4 w-4" />} Build Assessment
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Versioning & Integrity Controls (Offline)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium mb-2">Offline Differentiation</div>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2"><Checkbox checked={reorderItems} onCheckedChange={v => setReorderItems(Boolean(v))} /><span>Reorder items</span></div>
                <div className="flex items-center gap-2"><Checkbox checked={shuffleChoices} onCheckedChange={v => setShuffleChoices(Boolean(v))} /><span>Shuffle answer choices</span></div>
                <div className="flex items-center gap-2"><Checkbox /><span>Swap equivalent items from pool</span></div>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium mb-2">Integrity Options</div>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2"><Checkbox checked={lockPlayer} onCheckedChange={v => setLockPlayer(Boolean(v))} /><span>Lock player navigation</span></div>
                <div className="flex items-center gap-2"><Checkbox checked={requireReflection} onCheckedChange={v => setRequireReflection(Boolean(v))} /><span>Require reflection on submit</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DokSlider({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <Badge variant="secondary">{value}%</Badge>
      </div>
      <Slider value={[value]} min={0} max={100} step={5} onValueChange={v => onChange(v[0] ?? 0)} className="mt-3" />
    </div>
  );
}

function CoverageRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

function AiAddOnsPanel({ budget, setBudget, aiAddons, setAiAddons, itemCount, onEstimate, onRunEnhancements, isEstimating, isRunning, aiUsageLog }: {
  budget: BudgetState; setBudget: (b: BudgetState) => void;
  aiAddons: AiAddonFlags; setAiAddons: (f: AiAddonFlags) => void;
  itemCount: number; onEstimate: () => void; onRunEnhancements: () => void;
  isEstimating: boolean; isRunning: boolean; aiUsageLog: any[];
}) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> AI Add-ons (Optional "Last 10%")</CardTitle>
          <CardDescription>AI is OFF by default. Use only for rationales, clarity rewrites, and polish.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7 rounded-lg border p-4">
              <div className="text-sm font-medium mb-3">Select AI Enhancements</div>
              <div className="grid gap-3">
                <ToggleRow label="Generate rationales (correct + common distractors)" checked={aiAddons.rationales} onChange={v => setAiAddons({ ...aiAddons, rationales: v })} />
                <ToggleRow label="Rewrite stems for clarity (no standard shift)" checked={aiAddons.rewriteStems} onChange={v => setAiAddons({ ...aiAddons, rewriteStems: v })} />
                <ToggleRow label="Improve distractors (same difficulty band)" checked={aiAddons.improveDistractors} onChange={v => setAiAddons({ ...aiAddons, improveDistractors: v })} />
                <ToggleRow label="Teacher explanation" checked={aiAddons.teacherExplanation} onChange={v => setAiAddons({ ...aiAddons, teacherExplanation: v })} />
                <ToggleRow label="Student hint" checked={aiAddons.studentHint} onChange={v => setAiAddons({ ...aiAddons, studentHint: v })} />
              </div>
            </div>
            <div className="lg:col-span-5">
              <BudgetMeter budget={budget} onChange={setBudget} />
              <div className="mt-3 flex items-center justify-end gap-2">
                <Button variant="outline" onClick={onEstimate} disabled={isEstimating} className="gap-2">
                  {isEstimating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Estimate
                </Button>
                <Button onClick={onRunEnhancements} disabled={isRunning || !budget.enabled} className="gap-2">
                  {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Run AI
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">AI Usage Log</CardTitle>
          <CardDescription>Track every AI run for transparency.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!aiUsageLog || aiUsageLog.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-sm text-muted-foreground">No AI usage yet. Cost: $0.00</TableCell>
                </TableRow>
              ) : aiUsageLog.map((entry: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="text-sm">{new Date(entry.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{entry.feature}</TableCell>
                  <TableCell className="text-sm">{entry.itemCount}</TableCell>
                  <TableCell className="text-right text-sm font-medium">${(entry.costUsd || 0).toFixed(4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/10 p-3">
      <div className="text-sm">{label}</div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function BudgetMeter({ budget, onChange }: { budget: BudgetState; onChange: (b: BudgetState) => void }) {
  const pctDaily = Math.min(100, Math.round((budget.usageTodayUSD / Math.max(0.01, budget.dailyCapUSD)) * 100));
  const pctAssessment = Math.min(100, Math.round((budget.usageThisAssessmentUSD / Math.max(0.01, budget.perAssessmentCapUSD)) * 100));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" /> Budget Guardrails</CardTitle>
        <CardDescription>Hard caps prevent surprise costs.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Enable AI spend</div>
            <div className="text-xs text-muted-foreground">Off by default</div>
          </div>
          <Switch checked={budget.enabled} onCheckedChange={v => onChange({ ...budget, enabled: Boolean(v) })} />
        </div>
        <Separator className="my-4" />
        <div className="grid gap-3">
          <div className="grid gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Daily cap</span>
              <span className="font-medium">${budget.dailyCapUSD.toFixed(2)}</span>
            </div>
            <Input type="number" value={budget.dailyCapUSD} min={0} step={0.5} disabled={!budget.enabled}
              onChange={e => onChange({ ...budget, dailyCapUSD: Number(e.target.value || 0) })} />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Per-assessment cap</span>
              <span className="font-medium">${budget.perAssessmentCapUSD.toFixed(2)}</span>
            </div>
            <Input type="number" value={budget.perAssessmentCapUSD} min={0} step={0.25} disabled={!budget.enabled}
              onChange={e => onChange({ ...budget, perAssessmentCapUSD: Number(e.target.value || 0) })} />
          </div>
          <div className="rounded-lg border bg-muted/10 p-3 grid gap-3">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Usage today</span>
                <span className="font-medium">${budget.usageTodayUSD.toFixed(2)} / ${budget.dailyCapUSD.toFixed(2)}</span>
              </div>
              <Progress value={pctDaily} className="mt-2" />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">This assessment</span>
                <span className="font-medium">${budget.usageThisAssessmentUSD.toFixed(2)} / ${budget.perAssessmentCapUSD.toFixed(2)}</span>
              </div>
              <Progress value={pctAssessment} className="mt-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OfflineStatusCard({ docs, items }: { docs: any[]; items: StagedItem[] }) {
  const parsedDocs = docs.filter(d => (d.parseStatus || d.status) === "parsed").length;
  const parsingDocs = docs.filter(d => (d.parseStatus || d.status) === "parsing").length;
  const byStatus = useMemo(() => {
    const counts: Record<string, number> = { "Needs Review": 0, Accepted: 0, Edited: 0, Rejected: 0 };
    for (const it of items) counts[it.reviewStatus] = (counts[it.reviewStatus] || 0) + 1;
    return counts;
  }, [items]);
  const readyToBuild = (byStatus.Accepted || 0) + (byStatus.Edited || 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Offline Builder Status</CardTitle>
        <CardDescription>Quick snapshot of readiness.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Docs parsed</span><span className="font-medium">{parsedDocs}</span></div>
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Docs parsing</span><span className="font-medium">{parsingDocs}</span></div>
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Items staged</span><span className="font-medium">{items.length}</span></div>
        </div>
        <Separator className="my-3" />
        <div className="grid gap-2">
          <StatusRow label="Needs Review" value={byStatus["Needs Review"] || 0} variant="outline" icon={<AlertTriangle className="h-4 w-4" />} />
          <StatusRow label="Accepted" value={byStatus.Accepted || 0} variant="default" icon={<CheckCircle2 className="h-4 w-4" />} />
          <StatusRow label="Edited" value={byStatus.Edited || 0} variant="secondary" icon={<Wand2 className="h-4 w-4" />} />
          <StatusRow label="Rejected" value={byStatus.Rejected || 0} variant="destructive" icon={<XCircle className="h-4 w-4" />} />
        </div>
        {readyToBuild > 0 && (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-2 text-center">
            <Badge className="bg-green-600">{readyToBuild} items ready to build</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, value, variant, icon }: { label: string; value: number; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/10 p-2">
      <div className="flex items-center gap-2"><span className="text-muted-foreground">{icon}</span><span className="text-sm">{label}</span></div>
      <Badge variant={variant}>{value}</Badge>
    </div>
  );
}
