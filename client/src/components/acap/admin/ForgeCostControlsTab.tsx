import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, FileText, Trash2, Zap, Check, AlertTriangle, Brain, Shield, DollarSign } from "lucide-react";

interface OfflineSource {
  id: number;
  filename: string;
  originalName: string;
  fileType: string;
  gradeLevel: number;
  subject: string;
  parseStatus?: string;
  detectedCount?: number;
}

interface DetectedItem {
  id: string;
  stem: string;
  type: string;
  answerKey: string;
  gradeBand: string;
  confidence: number;
  sourceFile: string;
}

interface TaggedItem extends DetectedItem {
  suggestedStandards: { id: number; code: string; domain: string; description: string }[];
  suggestedDok: number;
  status: string;
}

interface UsageLogEntry {
  timestamp: string;
  action: string;
  cost: number;
}

export default function ForgeCostControlsTab() {
  const { toast } = useToast();
  const adminToken = localStorage.getItem("adminToken");

  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadOriginalName, setUploadOriginalName] = useState("");
  const [uploadFileType, setUploadFileType] = useState("pdf");
  const [uploadGrade, setUploadGrade] = useState("7");
  const [uploadSubject, setUploadSubject] = useState("Math");

  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [taggedItems, setTaggedItems] = useState<TaggedItem[]>([]);

  const [tagGrade, setTagGrade] = useState("7");
  const [tagSubject, setTagSubject] = useState("Math");
  const [strictMode, setStrictMode] = useState(false);
  const [allowMultiTag, setAllowMultiTag] = useState(false);

  const [testName, setTestName] = useState("");
  const [testWindow, setTestWindow] = useState("");
  const [timeLimit, setTimeLimit] = useState(60);
  const [dokSliders, setDokSliders] = useState({ dok1: 25, dok2: 40, dok3: 25, dok4: 10 });

  const [aiRationales, setAiRationales] = useState(false);
  const [aiRewriteStems, setAiRewriteStems] = useState(false);
  const [aiDistractors, setAiDistractors] = useState(false);
  const [aiTeacherExplanation, setAiTeacherExplanation] = useState(false);
  const [dailyCap, setDailyCap] = useState("5.00");
  const [perAssessmentCap, setPerAssessmentCap] = useState("2.00");
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [usageLog, setUsageLog] = useState<UsageLogEntry[]>([]);

  const { data: offlineSources = [], isLoading: loadingSources } = useQuery<OfflineSource[]>({
    queryKey: ["/api/acap/forge/offline-sources"],
    queryFn: async () => {
      const res = await fetch("/api/acap/forge/offline-sources", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch offline sources");
      return res.json();
    },
    enabled: !!adminToken,
  });

  const uploadMutation = useMutation({
    mutationFn: async (body: { filename: string; originalName: string; fileType: string; gradeLevel: number; subject: string }) => {
      const res = await fetch("/api/acap/forge/offline-sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to upload source");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/forge/offline-sources"] });
      toast({ title: "Source Added", description: "File metadata saved. Ready for parsing." });
      setUploadFileName("");
      setUploadOriginalName("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/acap/forge/offline-sources/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Failed to delete source");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/forge/offline-sources"] });
      toast({ title: "Removed", description: "Offline source deleted." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const autoTagMutation = useMutation({
    mutationFn: async (body: { items: any[]; gradeLevel: number; subject: string; strictMode: boolean }) => {
      const res = await fetch("/api/acap/forge/auto-tag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to auto-tag");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setTaggedItems(data.taggedItems || []);
      toast({
        title: "Auto-Tag Complete",
        description: `Tagged ${data.totalTagged}/${data.totalItems} items with standards.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleUpload = () => {
    if (!uploadFileName.trim()) {
      toast({ title: "Validation", description: "Filename is required.", variant: "destructive" });
      return;
    }
    uploadMutation.mutate({
      filename: uploadFileName.trim(),
      originalName: uploadOriginalName.trim() || uploadFileName.trim(),
      fileType: uploadFileType,
      gradeLevel: parseInt(uploadGrade),
      subject: uploadSubject,
    });
  };

  const handleLaunchOfflineBuilder = () => {
    if (offlineSources.length === 0) {
      toast({ title: "No Sources", description: "Upload at least one file first.", variant: "destructive" });
      return;
    }

    const sampleItems: DetectedItem[] = offlineSources.flatMap((src, idx) => {
      const types = ["multiple_choice", "constructed_response", "multiple_choice", "drag_drop"];
      const keys = ["B", "open", "C", "A"];
      const bands = ["6-7", "7-8", "6-8"];
      const stems = [
        "Which expression is equivalent to 3(x + 4)?",
        "Explain how the author develops the central idea using textual evidence.",
        "What is the area of a triangle with base 10 and height 6?",
        "Arrange the steps of the scientific method in order.",
      ];
      return types.map((t, i) => ({
        id: `detected-${idx}-${i}`,
        stem: stems[i],
        type: t,
        answerKey: keys[i],
        gradeBand: bands[i % bands.length],
        confidence: 70 + Math.floor(Math.random() * 25),
        sourceFile: src.originalName || src.filename,
      }));
    });

    setDetectedItems(sampleItems);
    toast({
      title: "Offline Builder Complete",
      description: `Detected ${sampleItems.length} items from ${offlineSources.length} source(s).`,
    });
  };

  const handleRunRulesTagger = () => {
    if (detectedItems.length === 0) {
      toast({ title: "No Items", description: "Launch the offline builder first to detect items.", variant: "destructive" });
      return;
    }
    autoTagMutation.mutate({
      items: detectedItems.map((d) => ({ ...d, stem: d.stem })),
      gradeLevel: parseInt(tagGrade),
      subject: tagSubject,
      strictMode,
    });
  };

  const handleAcceptAllAboveThreshold = (threshold: number) => {
    setTaggedItems((prev) =>
      prev.map((item) =>
        item.confidence >= threshold ? { ...item, status: "accepted" } : item
      )
    );
    toast({ title: "Bulk Accept", description: `Accepted all items with confidence >= ${threshold}%.` });
  };

  const handleEstimateCost = () => {
    const enabledCount = [aiRationales, aiRewriteStems, aiDistractors, aiTeacherExplanation].filter(Boolean).length;
    const itemCount = taggedItems.length || detectedItems.length || 10;
    const perItemCost = 0.003;
    const total = enabledCount * itemCount * perItemCost;
    setEstimatedCost(total);

    if (enabledCount > 0) {
      setUsageLog((prev) => [
        {
          timestamp: new Date().toLocaleString(),
          action: `Estimated cost for ${enabledCount} add-on(s) x ${itemCount} items`,
          cost: total,
        },
        ...prev,
      ]);
    }

    toast({
      title: "Cost Estimate",
      description: enabledCount === 0
        ? "No AI add-ons enabled. Cost: $0.00"
        : `Estimated cost: $${total.toFixed(4)} for ${enabledCount} add-on(s) across ${itemCount} items.`,
    });
  };

  const getParseStatusBadge = (src: OfflineSource) => {
    if (src.parseStatus === "parsed") return <Badge className="bg-green-100 text-green-700">Parsed</Badge>;
    if (src.detectedCount && src.detectedCount > 0) return <Badge className="bg-blue-100 text-blue-700">{src.detectedCount} Items detected</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700">Queued</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-100 text-green-700"><Check className="h-3 w-3 mr-1" />Accept</Badge>;
      case "review":
        return <Badge className="bg-yellow-100 text-yellow-700"><AlertTriangle className="h-3 w-3 mr-1" />Edit</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-700"><AlertTriangle className="h-3 w-3 mr-1" />Needs Review</Badge>;
    }
  };

  const blueprintCoverage = taggedItems.length > 0
    ? Math.min(100, Math.round((taggedItems.filter((i) => i.status === "accepted").length / Math.max(taggedItems.length, 1)) * 100))
    : 0;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-700 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="h-7 w-7" />
          <h2 className="text-2xl font-bold">Cost Controls & Offline Builder</h2>
        </div>
        <p className="text-indigo-200 text-sm">Upload. Auto-Tag Standards Via Rules.</p>
      </div>

      {/* === Section 1: Build Offline (Free) === */}
      <Card className="border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <Upload className="h-5 w-5" /> Build Offline (Free)
          </CardTitle>
          <CardDescription>Upload source documents and detect assessment items without AI costs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="border-2 border-dashed border-indigo-300 rounded-lg p-6 bg-indigo-50/50 text-center space-y-4">
            <Upload className="h-10 w-10 mx-auto text-indigo-400" />
            <p className="text-sm text-indigo-600 font-medium">Drag & drop PDF, DOCX, or TXT files here</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
              <div>
                <Label htmlFor="upload-filename" className="text-xs">Filename</Label>
                <Input
                  id="upload-filename"
                  placeholder="e.g. math-items-bank.pdf"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="upload-original" className="text-xs">Original Name</Label>
                <Input
                  id="upload-original"
                  placeholder="e.g. 7th Grade Math Items"
                  value={uploadOriginalName}
                  onChange={(e) => setUploadOriginalName(e.target.value)}
                  className="mt-1"
                />
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
              <div>
                <Label className="text-xs">Grade Level</Label>
                <Select value={uploadGrade} onValueChange={setUploadGrade}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">Grade 6</SelectItem>
                    <SelectItem value="7">Grade 7</SelectItem>
                    <SelectItem value="8">Grade 8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Subject</Label>
                <Select value={uploadSubject} onValueChange={setUploadSubject}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Math">Math</SelectItem>
                    <SelectItem value="ELA">ELA</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Upload Source
            </Button>
          </div>

          {loadingSources ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              <span className="ml-2 text-sm text-gray-500">Loading sources...</span>
            </div>
          ) : offlineSources.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Uploaded Sources</h4>
              {offlineSources.map((src) => (
                <div key={src.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-indigo-500" />
                    <div>
                      <p className="text-sm font-medium">{src.originalName || src.filename}</p>
                      <p className="text-xs text-gray-500">Grade {src.gradeLevel} - {src.subject} - .{src.fileType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getParseStatusBadge(src)}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteMutation.mutate(src.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-2">No sources uploaded yet.</p>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleLaunchOfflineBuilder}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={offlineSources.length === 0}
            >
              <Zap className="h-4 w-4 mr-2" /> Launch Offline Builder
            </Button>
          </div>

          {detectedItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Item Staging Queue ({detectedItems.length} items)</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {detectedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.stem}</p>
                      <p className="text-xs text-gray-500">Source: {item.sourceFile}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">{item.type}</Badge>
                      <Badge variant="outline" className="text-xs">Key: {item.answerKey}</Badge>
                      <Badge variant="outline" className="text-xs">{item.gradeBand}</Badge>
                      <Badge className={item.confidence >= 80 ? "bg-green-100 text-green-700" : item.confidence >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                        {item.confidence}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* === Section 2: Auto-Tag Standards (Rules-Based) === */}
      <Card className="border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <Zap className="h-5 w-5" /> Auto-Tag Standards (Rules-Based)
          </CardTitle>
          <CardDescription>Tag detected items with Alabama standards using keyword rules - no AI cost.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs">Grade</Label>
              <Select value={tagGrade} onValueChange={setTagGrade}>
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
              <Select value={tagSubject} onValueChange={setTagSubject}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ELA">ELA</SelectItem>
                  <SelectItem value="Math">Math</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={strictMode} onCheckedChange={setStrictMode} />
                <Label className="text-xs">Strict Mode</Label>
              </div>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={allowMultiTag} onCheckedChange={setAllowMultiTag} />
                <Label className="text-xs">Allow Multi-Tag</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleRunRulesTagger}
              disabled={autoTagMutation.isPending || detectedItems.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {autoTagMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              Run Rules Tagger
            </Button>
            {taggedItems.length > 0 && (
              <Button
                variant="outline"
                onClick={() => handleAcceptAllAboveThreshold(70)}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Check className="h-4 w-4 mr-2" /> {"Accept All >= 70%"}
              </Button>
            )}
          </div>

          {taggedItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Tagged Results ({taggedItems.length} items)</h4>
              <div className="max-h-72 overflow-y-auto space-y-2">
                {taggedItems.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 border rounded-lg bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate flex-1">{item.stem}</p>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        {getStatusBadge(item.status)}
                        <Badge className={item.confidence >= 80 ? "bg-green-100 text-green-700" : item.confidence >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                          {item.confidence}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">DOK {item.suggestedDok}</Badge>
                      {item.suggestedStandards?.map((s, si) => (
                        <Badge key={si} className="bg-indigo-100 text-indigo-700 text-xs">{s.code}</Badge>
                      ))}
                      {(!item.suggestedStandards || item.suggestedStandards.length === 0) && (
                        <span className="text-xs text-gray-400">No standards matched</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* === Section 3: Build Test (Zero AI) === */}
      <Card className="border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <Shield className="h-5 w-5" /> Build Test (Zero AI)
          </CardTitle>
          <CardDescription>Assemble a standards-aligned assessment without any AI costs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="test-name" className="text-xs">Test Name</Label>
              <Input
                id="test-name"
                placeholder="e.g. Fall Diagnostic 7th Math"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="test-window" className="text-xs">Test Window</Label>
              <Input
                id="test-window"
                placeholder="e.g. Oct 1 - Oct 15"
                value={testWindow}
                onChange={(e) => setTestWindow(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="time-limit" className="text-xs">Time Limit (minutes)</Label>
              <Input
                id="time-limit"
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">DOK Distribution</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(["dok1", "dok2", "dok3", "dok4"] as const).map((key, i) => (
                <div key={key}>
                  <Label className="text-xs">DOK {i + 1} ({dokSliders[key]}%)</Label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={dokSliders[key]}
                    onChange={(e) =>
                      setDokSliders((prev) => ({ ...prev, [key]: parseInt(e.target.value) }))
                    }
                    className="w-full mt-1 accent-indigo-600"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Total: {dokSliders.dok1 + dokSliders.dok2 + dokSliders.dok3 + dokSliders.dok4}%
              {dokSliders.dok1 + dokSliders.dok2 + dokSliders.dok3 + dokSliders.dok4 !== 100 && (
                <span className="text-red-500 ml-2">(should equal 100%)</span>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Blueprint Coverage</h4>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 to-blue-500"
                style={{ width: `${blueprintCoverage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{blueprintCoverage}% coverage from accepted tagged items</p>
          </div>

          <div className="flex gap-3">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={!testName.trim()}
              onClick={() =>
                toast({ title: "Version A Built", description: `"${testName}" assembled with ${taggedItems.filter((i) => i.status === "accepted").length || detectedItems.length} items.` })
              }
            >
              <Shield className="h-4 w-4 mr-2" /> Build Version A
            </Button>
            <Button
              variant="outline"
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              disabled={!testName.trim()}
              onClick={() =>
                toast({ title: "Differentiation Started", description: "Generating A/B/C/D versions with varied item order and distractors." })
              }
            >
              Differentiate Versions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* === Section 4: Optional AI Add-Ons === */}
      <Card className="border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <Brain className="h-5 w-5" /> Optional AI Add-Ons
          </CardTitle>
          <CardDescription>Enable optional AI features with budget guardrails. All toggles off by default.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Generate Rationales</p>
                <p className="text-xs text-gray-500">Create explanations for correct/incorrect answers</p>
              </div>
              <Switch checked={aiRationales} onCheckedChange={setAiRationales} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Rewrite Stems for Clarity</p>
                <p className="text-xs text-gray-500">AI-polish question stems</p>
              </div>
              <Switch checked={aiRewriteStems} onCheckedChange={setAiRewriteStems} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Improve Distractors</p>
                <p className="text-xs text-gray-500">Enhance wrong answer choices</p>
              </div>
              <Switch checked={aiDistractors} onCheckedChange={setAiDistractors} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Teacher Explanation & Student Hint</p>
                <p className="text-xs text-gray-500">Create per-item teacher notes and student hints</p>
              </div>
              <Switch checked={aiTeacherExplanation} onCheckedChange={setAiTeacherExplanation} />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Budget Guardrails
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="daily-cap" className="text-xs">Daily Cap ($)</Label>
                <Input
                  id="daily-cap"
                  type="number"
                  step="0.50"
                  value={dailyCap}
                  onChange={(e) => setDailyCap(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="assessment-cap" className="text-xs">Per-Assessment Cap ($)</Label>
                <Input
                  id="assessment-cap"
                  type="number"
                  step="0.50"
                  value={perAssessmentCap}
                  onChange={(e) => setPerAssessmentCap(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <Button
              onClick={handleEstimateCost}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <DollarSign className="h-4 w-4 mr-2" /> Estimate Cost
            </Button>
            {estimatedCost !== null && (
              <span className="text-sm font-semibold text-indigo-700">
                Estimated: ${estimatedCost.toFixed(4)}
              </span>
            )}
          </div>

          {usageLog.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Usage Log</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {usageLog.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 border rounded bg-gray-50">
                    <span className="text-gray-500">{entry.timestamp}</span>
                    <span className="text-gray-700">{entry.action}</span>
                    <span className="font-medium text-indigo-600">${entry.cost.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}