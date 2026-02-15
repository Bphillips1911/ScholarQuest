import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Loader2, PenLine } from "lucide-react";

type Std = { code: string; grade: number; subject: string; description?: string; domain?: string };

export default function WorksheetGeneratorTab() {
  const { toast } = useToast();

  const [subject, setSubject] = useState<"ELA" | "Math" | "Science">("Math");
  const [grade, setGrade] = useState<6 | 7 | 8>(6);
  const [language, setLanguage] = useState<"en" | "es">("en");

  const [standards, setStandards] = useState<Std[]>([]);
  const [standardCode, setStandardCode] = useState<string>("");
  const [loadingStandards, setLoadingStandards] = useState(false);

  const [dokLevel, setDokLevel] = useState<2 | 3 | 4>(2);
  const [itemCount, setItemCount] = useState<5 | 10 | 15 | 20>(10);
  const [title, setTitle] = useState("ACAP Worksheet");
  const [includeTextDependentWriting, setIncludeTextDependentWriting] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(null);

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
      if (stds.length > 0) {
        setStandardCode(stds[0].code);
      }
    } catch (e: any) {
      console.error("Standards load error:", e);
      toast({ title: "Standards load failed", description: e.message, variant: "destructive" });
    } finally {
      setLoadingStandards(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStandards(subject, grade);
  }, [subject, grade, loadStandards]);

  useEffect(() => {
    if (subject === "ELA" && dokLevel >= 3) {
      setIncludeTextDependentWriting(true);
    }
  }, [subject, dokLevel]);

  async function createWorksheet() {
    if (!standardCode) {
      toast({ title: "Select a standard first", variant: "destructive" });
      return;
    }
    setCreating(true);
    setCreatedId(null);

    try {
      const payload = {
        title: `${title} — ${subject} G${grade}`,
        subject,
        grade,
        standardCode,
        dokLevel,
        itemCount,
        language,
        includeTextDependentWriting: subject === "ELA" ? includeTextDependentWriting : false,
      };

      const res = await apiRequest("POST", "/api/acap/worksheets", payload);
      const data = await res.json();

      setCreatedId(data.worksheet.id);
      toast({ title: "Worksheet created!", description: "PDF is ready to download." });
    } catch (e: any) {
      toast({ title: "Create failed", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  const pdfHref = createdId ? `/api/acap/worksheets/${createdId}/pdf` : "#";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          ACAP Worksheet Generator
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Select a standard, DOK level, and item count. Generate a printable EduCAP worksheet with answer key.
        </p>
      </div>

      <Card className="p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ACAP Worksheet" />
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
                <SelectValue placeholder={loadingStandards ? "Loading standards..." : standards.length === 0 ? "No standards found" : "Select a standard"} />
              </SelectTrigger>
              <SelectContent className="max-h-[320px]">
                {loadingStandards && (
                  <div className="px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading standards...
                  </div>
                )}
                {!loadingStandards && standards.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-400">No standards found for {subject} Grade {grade}</div>
                )}
                {standards.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.code} — {(s.description || "Standard").slice(0, 70)}
                  </SelectItem>
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

        {subject === "ELA" && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center gap-3">
              <Checkbox
                id="tdw"
                checked={includeTextDependentWriting}
                onCheckedChange={(checked) => setIncludeTextDependentWriting(!!checked)}
              />
              <div>
                <label htmlFor="tdw" className="text-sm font-semibold text-indigo-800 flex items-center gap-2 cursor-pointer">
                  <PenLine className="w-4 h-4" />
                  Include Text-Dependent Writing (DOK 3-4)
                </label>
                <p className="text-xs text-indigo-600 mt-0.5">
                  Adds an extended writing prompt requiring multi-paragraph analysis with textual evidence, scoring rubric, and model response.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-6">
          <Button onClick={createWorksheet} disabled={creating || !standardCode || loadingStandards} className="bg-indigo-600 hover:bg-indigo-700">
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Worksheet
              </>
            )}
          </Button>

          {createdId && (
            <a href={pdfHref} target="_blank" rel="noreferrer">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </a>
          )}

          {createdId && (
            <p className="text-sm text-gray-500">
              Worksheet ID: <span className="font-mono font-semibold">{createdId}</span>
            </p>
          )}
        </div>
      </Card>

      {creating && (
        <Card className="p-6 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-500" />
          <p className="text-gray-600">AI is generating your worksheet items...</p>
          <p className="text-xs text-gray-400 mt-1">This usually takes 10-20 seconds</p>
        </Card>
      )}
    </div>
  );
}
