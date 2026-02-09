import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Key, Copy, Loader2, Trash2, Plus, Clock, CheckCircle2, XCircle } from "lucide-react";

interface AccessCode {
  id: number;
  code: string;
  assessmentId: number;
  teacherId: string;
  window: string;
  gradeLevel: number;
  subject: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export default function AccessCodesManager({ teacherId }: { teacherId: string }) {
  const { toast } = useToast();
  const [subject, setSubject] = useState("MATH");
  const [grade, setGrade] = useState("6");
  const [window, setWindow] = useState("BASELINE");

  const { data: assessments } = useQuery<any[]>({
    queryKey: ["/api/acap/assessments"],
  });

  const { data: codes, isLoading } = useQuery<AccessCode[]>({
    queryKey: ["/api/acap/access-codes", teacherId],
    queryFn: async () => {
      const res = await fetch(`/api/acap/access-codes?teacherId=${teacherId}`);
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const matchingAssessment = (assessments || []).find((a: any) =>
        a.subject === subject && a.gradeLevel === parseInt(grade) &&
        (a.assessmentType?.toLowerCase().includes(window.toLowerCase()) || !a.assessmentType)
      );
      const res = await apiRequest("POST", "/api/acap/access-codes", {
        assessmentId: matchingAssessment?.id || null, teacherId, window, gradeLevel: parseInt(grade), subject,
      });
      return res.json();
    },
    onSuccess: (data: AccessCode) => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/access-codes"] });
      toast({ title: "Access Code Created", description: `Code: ${data.code} — Share this with students to start the ${window.toLowerCase()} assessment.` });
    },
    onError: (err: any) => toast({ title: "Failed to create code", description: err.message || "Please try again.", variant: "destructive" }),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/acap/access-codes/${id}/deactivate`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/access-codes"] });
      toast({ title: "Code Deactivated" });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: `Code ${code} copied to clipboard.` });
  };

  const activeCodes = (codes || []).filter((c) => c.isActive);
  const inactiveCodes = (codes || []).filter((c) => !c.isActive);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-indigo-600" /> Generate Access Code</CardTitle>
          <CardDescription>Create a one-time access code for students to begin a baseline, midpoint, or final EduCAP assessment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MATH">Math</SelectItem>
                  <SelectItem value="ELA">ELA</SelectItem>
                  <SelectItem value="SCI">Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Grade</label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">Grade 6</SelectItem>
                  <SelectItem value="7">Grade 7</SelectItem>
                  <SelectItem value="8">Grade 8</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Window</label>
              <Select value={window} onValueChange={setWindow}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASELINE">Baseline</SelectItem>
                  <SelectItem value="MIDPOINT">Midpoint</SelectItem>
                  <SelectItem value="FINAL">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Generate Code
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Active Codes ({activeCodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
          ) : activeCodes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No active access codes. Generate one above to get started.</p>
          ) : (
            <div className="space-y-2">
              {activeCodes.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border bg-white p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-sm">
                      <Key className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg tracking-wider">{c.code}</span>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyCode(c.code)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex gap-1.5 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">{c.subject}</Badge>
                        <Badge variant="outline" className="text-[10px]">Grade {c.gradeLevel}</Badge>
                        <Badge variant="outline" className="text-[10px]">{c.window}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active
                    </div>
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deactivateMutation.mutate(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {inactiveCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Expired / Deactivated ({inactiveCodes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {inactiveCodes.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded border border-dashed p-2 opacity-60">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-gray-400" />
                    <span className="font-mono text-sm">{c.code}</span>
                    <Badge variant="outline" className="text-[10px]">{c.window} {c.subject} G{c.gradeLevel}</Badge>
                  </div>
                  <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
