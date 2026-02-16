import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Download, FileText, Loader2, PenLine, Eye, AlertTriangle, Save, FolderOpen,
  RefreshCw, BarChart3, Target, Sparkles, Send, X, ChevronRight, BookOpen,
  Layers, Settings2, Zap,
} from "lucide-react";
import ProfessionalWorksheetPreview from "./ProfessionalWorksheetPreview";
import WorksheetShareDialog from "./WorksheetShareDialog";
import "@/styles/worksheet-preview.css";

type Std = { code: string; grade: number; subject: string; description?: string; domain?: string };
type CoverageInfo = { tags: string[]; standardCode: string; description?: string };
type GeneratedFile = { label: string; url: string; id: number };

interface WorksheetConfig {
  includeAnswerKey: boolean;
  studentOnly: boolean;
  includeVisuals: boolean;
  includePassage: boolean;
  includeWordBank: boolean;
  includePointValues: boolean;
  includeShowWorkBoxes: boolean;
  batchCount: number;
  differentiation: { enabled: boolean; variants: string[] };
}

const DEFAULT_CONFIG: WorksheetConfig = {
  includeAnswerKey: true,
  studentOnly: false,
  includeVisuals: true,
  includePassage: false,
  includeWordBank: false,
  includePointValues: false,
  includeShowWorkBoxes: false,
  batchCount: 1,
  differentiation: { enabled: false, variants: ["A", "B", "C"] },
};

export default function WorksheetGeneratorTab({ userRole }: { userRole?: string }) {
  const { toast } = useToast();

  const [subject, setSubject] = useState<"ELA" | "Math" | "Science">("Math");
  const [grade, setGrade] = useState<6 | 7 | 8>(6);
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [standards, setStandards] = useState<Std[]>([]);
  const [standardCode, setStandardCode] = useState("");
  const [loadingStandards, setLoadingStandards] = useState(false);
  const [dokLevel, setDokLevel] = useState<2 | 3 | 4>(2);
  const [itemCount, setItemCount] = useState<5 | 10 | 15 | 20>(10);
  const [title, setTitle] = useState("EduCAP Worksheet");
  const [includeTextDependentWriting, setIncludeTextDependentWriting] = useState(false);

  const [config, setConfig] = useState<WorksheetConfig>({ ...DEFAULT_CONFIG });
  const [creating, setCreating] = useState(false);
  const [worksheetData, setWorksheetData] = useState<any>(null);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [previewCoverage, setPreviewCoverage] = useState<CoverageInfo | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewFallback, setPreviewFallback] = useState(false);

  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showCoverageModal, setShowCoverageModal] = useState(false);
  const [shareWorksheetId, setShareWorksheetId] = useState<number | null>(null);
  const [shareWorksheetTitle, setShareWorksheetTitle] = useState("");
  const [coverageData, setCoverageData] = useState<any>(null);

  const loadStandards = useCallback(async (nextSubject: string, nextGrade: number) => {
    setLoadingStandards(true);
    setStandards([]);
    setStandardCode("");
    try {
      const res = await fetch(`/api/acap/standards/list?subject=${encodeURIComponent(nextSubject)}&grades=${nextGrade}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const stds: Std[] = data.standards || [];
      setStandards(stds);
      if (stds.length > 0) setStandardCode(stds[0].code);
    } catch (e: any) {
      toast({ title: "Standards load failed", description: e.message, variant: "destructive" });
    } finally {
      setLoadingStandards(false);
    }
  }, [toast]);

  useEffect(() => { loadStandards(subject, grade); }, [subject, grade, loadStandards]);

  useEffect(() => {
    if (subject === "ELA" && dokLevel >= 3) setIncludeTextDependentWriting(true);
    if (subject === "ELA") setConfig(c => ({ ...c, includePassage: true }));
  }, [subject, dokLevel]);

  const templatesQuery = useQuery({
    queryKey: ["/api/acap/worksheets/templates"],
    enabled: false,
  });

  async function loadTemplates() {
    try {
      const res = await fetch("/api/acap/worksheets/templates", {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken") || localStorage.getItem("teacherToken")}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      return await res.json();
    } catch {
      return [];
    }
  }

  async function saveTemplate() {
    if (!templateName.trim()) {
      toast({ title: "Enter a template name", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("POST", "/api/acap/worksheets/templates", {
        name: templateName,
        subject, grade, standardCode, dokLevel, itemCount,
        config: { ...config, language, includeTextDependentWriting },
      });
      toast({ title: "Template saved!" });
      setShowTemplateDialog(false);
      setTemplateName("");
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  }

  async function loadTemplate(tpl: any) {
    setSubject(tpl.subject);
    setGrade(tpl.grade);
    setStandardCode(tpl.standardCode);
    setDokLevel(tpl.dokLevel);
    setItemCount(tpl.itemCount);
    if (tpl.config) {
      setConfig(c => ({ ...c, ...tpl.config }));
      if (tpl.config.language) setLanguage(tpl.config.language);
      if (tpl.config.includeTextDependentWriting !== undefined) setIncludeTextDependentWriting(tpl.config.includeTextDependentWriting);
    }
    toast({ title: `Loaded template: ${tpl.name}` });
  }

  async function previewSamples() {
    if (!standardCode) {
      toast({ title: "Select a standard first", variant: "destructive" });
      return;
    }
    setLoadingPreview(true);
    setPreviewItems([]);
    setPreviewCoverage(null);
    setPreviewFallback(false);
    try {
      const res = await apiRequest("POST", "/api/acap/worksheets/preview", {
        subject, grade, standardCode, dokLevel, language, includeTextDependentWriting, config,
      });
      const data = await res.json();
      setPreviewItems(data.questions || []);
      setPreviewCoverage(data.coverage || null);
      setPreviewFallback(!!data.usedFallback);
    } catch (e: any) {
      toast({ title: "Preview failed", description: e.message, variant: "destructive" });
    } finally {
      setLoadingPreview(false);
    }
  }

  async function loadCoverage() {
    if (!standardCode) return;
    try {
      const res = await fetch(`/api/acap/worksheets/standard-coverage/${encodeURIComponent(standardCode)}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCoverageData(data);
      setShowCoverageModal(true);
    } catch (e: any) {
      toast({ title: "Coverage load failed", variant: "destructive" });
    }
  }

  async function createWorksheet() {
    if (!standardCode) {
      toast({ title: "Select a standard first", variant: "destructive" });
      return;
    }
    setCreating(true);
    setWorksheetData(null);
    setUsedFallback(false);
    setShowPreview(false);
    setGeneratedFiles([]);

    try {
      const payload = {
        title: `${title} — ${subject} G${grade}`,
        subject, grade, standardCode, dokLevel, itemCount, language,
        includeTextDependentWriting: subject === "ELA" ? includeTextDependentWriting : false,
        config,
        batchCount: config.batchCount,
        differentiation: config.differentiation,
      };

      const res = await apiRequest("POST", "/api/acap/worksheets", payload);
      const data = await res.json();

      setWorksheetData(data.worksheet || data.worksheets?.[0]?.worksheet);
      setUsedFallback(!!data.usedFallback);
      setGeneratedFiles(data.files || []);
      setShowPreview(true);

      if (data.usedFallback) {
        toast({ title: "Worksheet created with templates", description: "AI was unavailable. Template questions were used." });
      } else {
        toast({ title: "Worksheet(s) created!", description: `${data.files?.length || 1} worksheet(s) ready.` });
      }
    } catch (e: any) {
      toast({ title: "Create failed", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  const selectedStd = standards.find(s => s.code === standardCode);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          EduCAP Worksheet Generator
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          AI-powered worksheet creation with preview, differentiation, and standard coverage alignment.
        </p>
      </div>

      {/* Template Actions Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowTemplateDialog(true)}>
          <Save className="w-4 h-4 mr-1" /> Save Template
        </Button>
        <TemplateLoader onLoad={loadTemplate} />
      </div>

      {/* Main Settings Card */}
      <Card className="p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="EduCAP Worksheet" />
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subject} onValueChange={(v: any) => setSubject(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ELA">ELA</SelectItem>
                <SelectItem value="Math">Math</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Grade</Label>
            <Select value={String(grade)} onValueChange={(v) => setGrade(Number(v) as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="6">Grade 6</SelectItem>
                <SelectItem value="7">Grade 7</SelectItem>
                <SelectItem value="8">Grade 8</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>ACAP Standard</Label>
            <Select value={standardCode} onValueChange={setStandardCode} disabled={loadingStandards}>
              <SelectTrigger>
                <SelectValue placeholder={loadingStandards ? "Loading..." : standards.length === 0 ? "No standards found" : "Select a standard"} />
              </SelectTrigger>
              <SelectContent className="max-h-[320px]">
                {loadingStandards && <div className="px-3 py-2 text-sm text-gray-400 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</div>}
                {!loadingStandards && standards.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">No standards for {subject} Grade {grade}</div>}
                {standards.map((s) => (
                  <SelectItem key={s.code} value={s.code}>{s.code} — {(s.description || "Standard").slice(0, 70)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>DOK Level</Label>
            <Select value={String(dokLevel)} onValueChange={(v) => setDokLevel(Number(v) as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">DOK 2 — Skills/Concepts</SelectItem>
                <SelectItem value="3">DOK 3 — Strategic Thinking</SelectItem>
                <SelectItem value="4">DOK 4 — Extended Thinking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Item Count</Label>
            <Select value={String(itemCount)} onValueChange={(v) => setItemCount(Number(v) as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Items</SelectItem>
                <SelectItem value="10">10 Items</SelectItem>
                <SelectItem value="15">15 Items</SelectItem>
                <SelectItem value="20">20 Items</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ELA Writing Option */}
        {subject === "ELA" && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center gap-3">
              <Checkbox id="tdw" checked={includeTextDependentWriting} onCheckedChange={(c) => setIncludeTextDependentWriting(!!c)} />
              <div>
                <label htmlFor="tdw" className="text-sm font-semibold text-indigo-800 flex items-center gap-2 cursor-pointer">
                  <PenLine className="w-4 h-4" /> Include Text-Dependent Writing (DOK 3-4)
                </label>
                <p className="text-xs text-indigo-600 mt-0.5">Extended writing prompt with rubric and model response.</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Feature Toggles & Options */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Settings2 className="w-5 h-5 text-indigo-600" /> Output Options
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ToggleOption label="Student-Only Output" description="No answer key in student copy" checked={config.studentOnly}
            onChange={(v) => setConfig(c => ({ ...c, studentOnly: v, includeAnswerKey: !v }))} />
          <ToggleOption label="Include Answer Key" description="Separate teacher answer key" checked={config.includeAnswerKey}
            onChange={(v) => setConfig(c => ({ ...c, includeAnswerKey: v, studentOnly: !v }))} />
          <ToggleOption label="Include Visuals" description="Charts, tables, number lines" checked={config.includeVisuals}
            onChange={(v) => setConfig(c => ({ ...c, includeVisuals: v }))} />
          <ToggleOption label="Include Passage" description="Reading passage for ELA" checked={config.includePassage}
            onChange={(v) => setConfig(c => ({ ...c, includePassage: v }))} />
          <ToggleOption label="Word Bank" description="Key vocabulary provided" checked={config.includeWordBank}
            onChange={(v) => setConfig(c => ({ ...c, includeWordBank: v }))} />
          <ToggleOption label="Point Values" description="Show points per question" checked={config.includePointValues}
            onChange={(v) => setConfig(c => ({ ...c, includePointValues: v }))} />
          <ToggleOption label="Show-Work Boxes" description="Space for showing work" checked={config.includeShowWorkBoxes}
            onChange={(v) => setConfig(c => ({ ...c, includeShowWorkBoxes: v }))} />
        </div>

        {/* Batch & Differentiation */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-600" /> Batch Count</Label>
            <Select value={String(config.batchCount)} onValueChange={(v) => setConfig(c => ({ ...c, batchCount: Number(v) }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} Worksheet{n > 1 ? "s" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Checkbox id="diff" checked={config.differentiation.enabled}
                onCheckedChange={(c) => setConfig(cfg => ({ ...cfg, differentiation: { ...cfg.differentiation, enabled: !!c } }))} />
              <label htmlFor="diff" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                <Zap className="w-4 h-4 text-amber-500" /> Differentiated Variants (A/B/C)
              </label>
            </div>
            {config.differentiation.enabled && (
              <div className="flex gap-2 mt-2">
                {["A", "B", "C"].map(v => (
                  <Badge key={v} variant={config.differentiation.variants.includes(v) ? "default" : "outline"}
                    className="cursor-pointer" onClick={() => {
                      setConfig(c => {
                        const vars = c.differentiation.variants.includes(v)
                          ? c.differentiation.variants.filter(x => x !== v)
                          : [...c.differentiation.variants, v];
                        return { ...c, differentiation: { ...c.differentiation, variants: vars } };
                      });
                    }}>
                    Level {v}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Standard Coverage Panel */}
      {standardCode && selectedStd && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">{standardCode}</p>
                <p className="text-sm text-blue-700">{selectedStd.description?.slice(0, 100)}</p>
                {selectedStd.domain && <Badge variant="outline" className="mt-1 text-xs">{selectedStd.domain}</Badge>}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadCoverage}>
              <BookOpen className="w-4 h-4 mr-1" /> View Full Breakdown
            </Button>
          </div>
          {previewCoverage && (
            <div className="flex flex-wrap gap-1 mt-3">
              {previewCoverage.tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ACAP Alignment Panel */}
      {standardCode && (
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-900">ACAP Test Preparation Alignment</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-white rounded p-2 border">
              <p className="text-gray-500 text-xs">Subject</p>
              <p className="font-semibold">{subject}</p>
            </div>
            <div className="bg-white rounded p-2 border">
              <p className="text-gray-500 text-xs">Standard</p>
              <p className="font-semibold">{standardCode}</p>
            </div>
            <div className="bg-white rounded p-2 border">
              <p className="text-gray-500 text-xs">DOK Level</p>
              <p className="font-semibold">Level {dokLevel}</p>
            </div>
            <div className="bg-white rounded p-2 border">
              <p className="text-gray-500 text-xs">Item Types</p>
              <p className="font-semibold">MC, MS, SR{includeTextDependentWriting ? ", TDW" : ""}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons: Preview + Generate */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={previewSamples} disabled={loadingPreview || !standardCode}>
          {loadingPreview ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Previewing...</> : <><Eye className="w-4 h-4 mr-2" /> Preview 3 Samples</>}
        </Button>
        <Button onClick={createWorksheet} disabled={creating || !standardCode || loadingStandards} className="bg-indigo-600 hover:bg-indigo-700">
          {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><FileText className="w-4 h-4 mr-2" /> Generate Full Worksheet</>}
        </Button>
      </div>

      {/* Preview Samples Section */}
      {previewItems.length > 0 && (
        <Card className="p-6 border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
              <Eye className="w-5 h-5" /> Sample Preview ({previewItems.length} items)
              {previewFallback && <Badge variant="secondary" className="text-xs ml-2">Template Mode</Badge>}
            </h3>
            <Button variant="outline" size="sm" onClick={previewSamples} disabled={loadingPreview}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loadingPreview ? "animate-spin" : ""}`} /> Regenerate
            </Button>
          </div>
          <ProfessionalWorksheetPreview
            items={previewItems}
            title="Sample Preview"
            subject={subject}
            grade={grade}
            standardCode={standardCode}
            dokLevel={dokLevel}
            usedFallback={previewFallback}
          />
        </Card>
      )}

      {/* Loading State */}
      {creating && (
        <Card className="p-6 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-500" />
          <p className="text-gray-600">AI is generating your worksheet items...</p>
          <p className="text-xs text-gray-400 mt-1">
            {config.batchCount > 1 || config.differentiation.enabled
              ? `Generating ${config.batchCount} batch(es) ${config.differentiation.enabled ? `with ${config.differentiation.variants.length} variants` : ""}...`
              : "This usually takes 10-20 seconds"}
          </p>
        </Card>
      )}

      {/* Fallback Warning */}
      {usedFallback && !creating && worksheetData && (
        <Card className="p-4 border-amber-300 bg-amber-50">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <p className="font-semibold text-sm">Template Mode</p>
              <p className="text-xs text-amber-700">AI was unavailable. Template questions were used. Worksheets are fully functional.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Generated Files / Downloads */}
      {generatedFiles.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" /> Generated Worksheets
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {generatedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                <PdfDownloadButton url={`${f.url}?studentOnly=${config.studentOnly}&includeAnswerKey=${config.includeAnswerKey}`} label={f.label} sublabel="PDF Download" />
                <Button variant="ghost" size="sm" className="shrink-0" onClick={() => { setShareWorksheetId(f.id); setShareWorksheetTitle(f.label); }}>
                  <Send className="w-4 h-4 text-indigo-500" />
                </Button>
              </div>
            ))}
          </div>
          {config.includeAnswerKey && !config.studentOnly && (
            <div className="mt-3 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {generatedFiles.map((f, i) => (
                <PdfDownloadButton key={`key-${i}`} url={`${f.url}?includeAnswerKey=true`} label={`${f.label} — Answer Key`} sublabel="Teacher Copy" variant="answer-key" />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Full Preview */}
      {showPreview && worksheetData && worksheetData.items && (
        <ProfessionalWorksheetPreview
          items={Array.isArray(worksheetData.items) ? worksheetData.items : []}
          title={worksheetData.title || title}
          subject={subject}
          grade={grade}
          standardCode={standardCode}
          dokLevel={dokLevel}
          usedFallback={usedFallback}
        />
      )}

      {/* Post-Assessment Analytics Stub */}
      <Card className="p-6 border-dashed border-2 border-gray-300 bg-gray-50">
        <div className="flex items-center gap-3 mb-3">
          <BarChart3 className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-500">Post-Assessment Analytics</h3>
          <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {["Class Average", "Mastery Rate", "Most Missed Item", "Growth Trend"].map(label => (
            <div key={label} className="bg-white rounded-lg p-4 border border-gray-200 text-center">
              <p className="text-xs text-gray-400 uppercase">{label}</p>
              <p className="text-2xl font-bold text-gray-300 mt-1">—</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">Analytics data will populate after students complete assigned worksheets.</p>
      </Card>

      {/* Save Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Save Worksheet Template</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g., G6 Math Fractions DOK2" />
            </div>
            <div className="text-sm text-gray-500">
              <p>Saves: {subject} | Grade {grade} | {standardCode} | DOK {dokLevel} | {itemCount} items</p>
              <p>Options: {config.studentOnly ? "Student-only" : "With Answer Key"} | Batch: {config.batchCount} | Diff: {config.differentiation.enabled ? config.differentiation.variants.join(",") : "Off"}</p>
            </div>
            <Button onClick={saveTemplate} className="w-full bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4 mr-2" /> Save Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Standard Coverage Modal */}
      <Dialog open={showCoverageModal} onOpenChange={setShowCoverageModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Standard Breakdown — {coverageData?.standardCode}</DialogTitle></DialogHeader>
          {coverageData && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-700">{coverageData.description}</p>
              {coverageData.domain && <Badge variant="outline">{coverageData.domain}</Badge>}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">Sub-Skills Coverage</h4>
                {coverageData.subskills?.map((sk: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                    <span className="text-sm">{sk.label}</span>
                    <Badge variant="secondary">{sk.itemsPlanned} items planned</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Worksheet Dialog */}
      <WorksheetShareDialog
        open={shareWorksheetId !== null}
        onOpenChange={(v) => { if (!v) { setShareWorksheetId(null); setShareWorksheetTitle(""); } }}
        worksheetId={shareWorksheetId || 0}
        worksheetTitle={shareWorksheetTitle}
        role={userRole === "admin" ? "admin" : "teacher"}
      />
    </div>
  );
}

function PdfDownloadButton({ url, label, sublabel, variant }: {
  url: string; label: string; sublabel: string; variant?: "answer-key";
}) {
  const [downloading, setDownloading] = useState(false);
  const isAnswerKey = variant === "answer-key";

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${label.replace(/[^a-zA-Z0-9 -]/g, "").trim()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button onClick={handleDownload} disabled={downloading}
      className={`flex items-center gap-3 flex-1 min-w-0 p-3 rounded-lg border transition-colors text-left ${
        isAnswerKey ? "bg-green-50 border-green-200 hover:bg-green-100" : "hover:bg-gray-100"
      }`}>
      {downloading
        ? <Loader2 className={`w-5 h-5 shrink-0 animate-spin ${isAnswerKey ? "text-green-600" : "text-indigo-600"}`} />
        : <FileText className={`w-5 h-5 shrink-0 ${isAnswerKey ? "text-green-600" : "text-indigo-600"}`} />}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isAnswerKey ? "text-green-900" : "text-gray-900"}`}>{label}</p>
        <p className={`text-xs ${isAnswerKey ? "text-green-600" : "text-gray-500"}`}>{downloading ? "Generating PDF..." : sublabel}</p>
      </div>
      <Download className={`w-4 h-4 shrink-0 ${isAnswerKey ? "text-green-400" : "text-gray-400"}`} />
    </button>
  );
}

function ToggleOption({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-0.5" />
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function TemplateLoader({ onLoad }: { onLoad: (t: any) => void }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/acap/worksheets/templates", {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken") || localStorage.getItem("teacherToken")}` },
      });
      if (res.ok) setTemplates(await res.json());
    } catch {} finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) load(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><FolderOpen className="w-4 h-4 mr-1" /> Load Template</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Load Template</DialogTitle></DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
        ) : templates.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No saved templates yet.</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {templates.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-indigo-50 cursor-pointer"
                onClick={() => { onLoad(t); setOpen(false); }}>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.subject} G{t.grade} | {t.standardCode} | DOK {t.dokLevel}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
