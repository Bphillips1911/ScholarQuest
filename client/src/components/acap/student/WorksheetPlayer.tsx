import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, ArrowLeft, ArrowRight, CheckCircle, Clock, FileText,
  Loader2, Trophy, AlertCircle, Send, X
} from "lucide-react";

interface AssignedWorksheet {
  assignment: any;
  worksheet: any;
  submission: any;
}

export default function StudentWorksheetAssignments({ scholarId }: { scholarId: string }) {
  const { toast } = useToast();
  const [activeWorksheet, setActiveWorksheet] = useState<any>(null);
  const [worksheetItems, setWorksheetItems] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<number, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loadingWorksheet, setLoadingWorksheet] = useState(false);

  const token = localStorage.getItem("studentToken") || localStorage.getItem("scholarToken") || "";

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["/api/acap/worksheets/my-assignments"],
    queryFn: async () => {
      const res = await fetch("/api/acap/worksheets/my-assignments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load assignments");
      return res.json();
    },
    enabled: !!token,
  });

  async function startWorksheet(assigned: AssignedWorksheet) {
    if (assigned.submission?.status === "completed") {
      setResult(assigned.submission);
      setActiveWorksheet(assigned);
      return;
    }

    setLoadingWorksheet(true);
    try {
      const res = await fetch(`/api/acap/worksheets/${assigned.worksheet.id}/take`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load worksheet");
      const data = await res.json();
      setWorksheetItems(data.items || []);
      setActiveWorksheet(assigned);
      setResponses({});
      setResult(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoadingWorksheet(false);
    }
  }

  async function submitWorksheet() {
    if (!activeWorksheet) return;
    setSubmitting(true);
    try {
      const responseArray = worksheetItems.map((item, idx) => ({
        itemIndex: idx,
        answer: responses[idx] || "",
      }));

      const res = await fetch(`/api/acap/worksheets/${activeWorksheet.assignment.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ responses: responseArray }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Submit failed");
      }

      const data = await res.json();
      setResult(data.submission);
      toast({ title: "Worksheet submitted!", description: `Score: ${data.submission.score}/${data.submission.totalPoints} (${data.submission.percentage}%)` });
      queryClient.invalidateQueries({ queryKey: ["/api/acap/worksheets/my-assignments"] });
    } catch (e: any) {
      toast({ title: "Submit failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  const assignmentsList = (assignments as AssignedWorksheet[]) || [];

  if (result && activeWorksheet) {
    return (
      <ScoreDisplay
        result={result}
        worksheet={activeWorksheet}
        onBack={() => { setActiveWorksheet(null); setResult(null); }}
      />
    );
  }

  if (activeWorksheet && worksheetItems.length > 0) {
    return (
      <WorksheetTaker
        items={worksheetItems}
        worksheet={activeWorksheet}
        responses={responses}
        setResponses={setResponses}
        onSubmit={submitWorksheet}
        onBack={() => { setActiveWorksheet(null); setWorksheetItems([]); }}
        submitting={submitting}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <FileText className="w-5 h-5 text-indigo-600" /> Assigned EduCAP Worksheets
      </h3>

      {assignmentsList.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No worksheets assigned yet.</p>
          <p className="text-xs text-gray-400 mt-1">Your teacher will assign worksheets here.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {assignmentsList.map((a, i) => (
            <Card key={i} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => startWorksheet(a)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    a.submission?.status === "completed" ? "bg-green-100" : "bg-blue-100"
                  }`}>
                    {a.submission?.status === "completed"
                      ? <CheckCircle className="w-5 h-5 text-green-600" />
                      : <FileText className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{a.assignment.title || a.worksheet?.title || "Worksheet"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">{a.worksheet?.subject}</Badge>
                      <Badge variant="outline" className="text-xs">Grade {a.worksheet?.grade}</Badge>
                      <Badge variant="outline" className="text-xs">{a.worksheet?.standardCode}</Badge>
                      <Badge variant="outline" className="text-xs">{a.worksheet?.itemCount} items</Badge>
                    </div>
                    {a.assignment.instructions && (
                      <p className="text-xs text-gray-500 mt-1">{a.assignment.instructions}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {a.submission?.status === "completed" ? (
                    <div>
                      <p className="text-lg font-bold text-green-600">{a.submission.percentage}%</p>
                      <p className="text-xs text-gray-500">{a.submission.score}/{a.submission.totalPoints}</p>
                    </div>
                  ) : (
                    <Badge className="bg-blue-600">Start</Badge>
                  )}
                  {a.assignment.dueDate && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Due: {new Date(a.assignment.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function WorksheetTaker({ items, worksheet, responses, setResponses, onSubmit, onBack, submitting }: {
  items: any[]; worksheet: any; responses: Record<number, any>;
  setResponses: (r: Record<number, any>) => void; onSubmit: () => void; onBack: () => void; submitting: boolean;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const answered = Object.keys(responses).length;
  const total = items.length;
  const current = items[currentIdx];

  if (!current) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Back to List</Button>
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-indigo-600">{answered}</span> / {total} answered
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg">
        <h3 className="font-bold text-lg">{worksheet.assignment.title || worksheet.worksheet?.title}</h3>
        <p className="text-blue-200 text-sm">{worksheet.worksheet?.subject} | Grade {worksheet.worksheet?.grade} | {worksheet.worksheet?.standardCode}</p>
      </div>

      <div className="flex gap-1 flex-wrap">
        {items.map((_, idx) => (
          <button key={idx} onClick={() => setCurrentIdx(idx)}
            className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
              idx === currentIdx ? "bg-indigo-600 text-white scale-110" :
              responses[idx] !== undefined ? "bg-green-500 text-white" :
              "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}>
            {idx + 1}
          </button>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge className="bg-indigo-600">Q{currentIdx + 1}</Badge>
          <Badge variant="outline" className="text-xs">{current.type || "multiple_choice"}</Badge>
        </div>

        {current.passage && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4 border max-h-48 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 mb-2">READING PASSAGE</p>
            {current.passage.split("\n").map((p: string, i: number) => (
              <p key={i} className="text-sm text-gray-700 mb-2 leading-relaxed">{p}</p>
            ))}
          </div>
        )}

        <p className="text-gray-900 font-medium mb-4">{current.stem}</p>

        {current.diagramDescription && (
          <p className="text-xs text-gray-500 italic mb-3">[Diagram: {current.diagramDescription}]</p>
        )}

        {(current.type === "multiple_choice" || current.type === "multiple_select" || !current.type) && current.options && (
          <div className="space-y-2">
            {Object.entries(current.options).map(([key, val]) => {
              const isSelected = current.type === "multiple_select"
                ? (Array.isArray(responses[currentIdx]) && responses[currentIdx].includes(key))
                : responses[currentIdx] === key;

              return (
                <button key={key}
                  onClick={() => {
                    if (current.type === "multiple_select") {
                      const prev = Array.isArray(responses[currentIdx]) ? responses[currentIdx] : [];
                      const next = prev.includes(key) ? prev.filter((k: string) => k !== key) : [...prev, key];
                      setResponses({ ...responses, [currentIdx]: next });
                    } else {
                      setResponses({ ...responses, [currentIdx]: key });
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${
                    isSelected ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200" : "border-gray-200 hover:border-gray-400"
                  }`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isSelected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}>{key}</span>
                  <span className="text-sm">{String(val)}</span>
                </button>
              );
            })}
            {current.type === "multiple_select" && (
              <p className="text-xs text-gray-400 italic mt-1">Select all that apply.</p>
            )}
          </div>
        )}

        {(current.type === "short_response" || current.type === "text_dependent_writing") && (
          <Textarea
            value={responses[currentIdx] || ""}
            onChange={(e) => setResponses({ ...responses, [currentIdx]: e.target.value })}
            placeholder="Type your answer here..."
            rows={current.linesProvided || 6}
            className="mt-2"
          />
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={currentIdx === 0} onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Previous
        </Button>

        {currentIdx < total - 1 ? (
          <Button onClick={() => setCurrentIdx(Math.min(total - 1, currentIdx + 1))}>
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={onSubmit} disabled={submitting || answered < total}
            className="bg-green-600 hover:bg-green-700">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit Worksheet</>}
          </Button>
        )}
      </div>

      {answered < total && currentIdx === total - 1 && (
        <p className="text-center text-sm text-amber-600 flex items-center justify-center gap-1">
          <AlertCircle className="w-4 h-4" /> Answer all {total} questions to submit. ({total - answered} remaining)
        </p>
      )}
    </div>
  );
}

function ScoreDisplay({ result, worksheet, onBack }: { result: any; worksheet: any; onBack: () => void }) {
  const pct = result.percentage || 0;
  const grade = pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : "F";
  const gradeColor = pct >= 90 ? "text-green-600" : pct >= 80 ? "text-blue-600" : pct >= 70 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Back to Assignments</Button>

      <Card className="p-8 text-center bg-gradient-to-br from-indigo-50 to-blue-50">
        <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Worksheet Complete!</h2>
        <p className="text-gray-500 mt-1">{worksheet.assignment?.title || worksheet.worksheet?.title}</p>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Score</p>
            <p className="text-3xl font-bold text-indigo-600">{result.score}/{result.totalPoints}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Percentage</p>
            <p className={`text-3xl font-bold ${gradeColor}`}>{pct}%</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Grade</p>
            <p className={`text-3xl font-bold ${gradeColor}`}>{grade}</p>
          </div>
        </div>

        {result.responses && Array.isArray(result.responses) && (
          <div className="mt-6 text-left">
            <h4 className="font-semibold text-gray-800 mb-3">Response Details</h4>
            <div className="space-y-2">
              {result.responses.map((r: any, i: number) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${
                  r.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                }`}>
                  <div className="flex items-center gap-2">
                    {r.isCorrect
                      ? <CheckCircle className="w-4 h-4 text-green-600" />
                      : <X className="w-4 h-4 text-red-600" />}
                    <span className="text-sm font-medium">Question {i + 1}</span>
                  </div>
                  <div className="text-xs text-right">
                    <span className="text-gray-500">Your answer: </span>
                    <span className="font-medium">{Array.isArray(r.answer) ? r.answer.join(", ") : r.answer}</span>
                    {!r.isCorrect && r.correctAnswer && (
                      <span className="text-green-700 ml-2">(Correct: {r.correctAnswer})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
