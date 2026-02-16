import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, BookOpen, Loader2, CheckCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  worksheetId: number;
  worksheetTitle: string;
  role: "admin" | "teacher";
}

export default function WorksheetShareDialog({ open, onOpenChange, worksheetId, worksheetTitle, role }: Props) {
  const { toast } = useToast();
  const [assignToType, setAssignToType] = useState<string>(role === "admin" ? "teacher" : "grade");
  const [assignToId, setAssignToId] = useState("");
  const [assignToGrade, setAssignToGrade] = useState<string>("6");
  const [title, setTitle] = useState(worksheetTitle);
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    if (open && (role === "admin" || assignToType === "teacher")) {
      const token = localStorage.getItem("adminToken") || localStorage.getItem("teacherToken") || "";
      fetch("/api/acap/worksheets/teachers-list", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => setTeachers(Array.isArray(data) ? data : []))
        .catch(() => setTeachers([]));
    }
  }, [open, role, assignToType]);

  useEffect(() => {
    if (open) {
      setSuccess(false);
      setTitle(worksheetTitle);
    }
  }, [open, worksheetTitle]);

  async function handleAssign() {
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/acap/worksheets/assign", {
        worksheetId,
        assignedToType: assignToType,
        assignedToId: assignToType === "teacher" || assignToType === "scholar" ? assignToId : undefined,
        assignedToGrade: assignToType === "grade" ? parseInt(assignToGrade) : undefined,
        title,
        instructions: instructions || undefined,
        dueDate: dueDate || undefined,
      });
      setSuccess(true);
      toast({ title: "Worksheet assigned!", description: `Shared to ${assignToType === "grade" ? `Grade ${assignToGrade}` : assignToType}` });
      setTimeout(() => onOpenChange(false), 1500);
    } catch (e: any) {
      toast({ title: "Assignment failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-600" />
            {role === "admin" ? "Share to Teachers" : "Share to Scholars"}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <p className="font-semibold text-green-800">Worksheet Assigned!</p>
            <p className="text-sm text-gray-500 mt-1">Recipients will see it in their dashboard.</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Assignment Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={assignToType} onValueChange={setAssignToType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {role === "admin" && <SelectItem value="teacher">Specific Teacher</SelectItem>}
                  <SelectItem value="grade">Entire Grade Level</SelectItem>
                  <SelectItem value="all">All Scholars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {assignToType === "teacher" && (
              <div className="space-y-2">
                <Label>Select Teacher</Label>
                <Select value={assignToId} onValueChange={setAssignToId}>
                  <SelectTrigger><SelectValue placeholder="Choose a teacher" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name} ({t.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {assignToType === "grade" && (
              <div className="space-y-2">
                <Label>Grade Level</Label>
                <Select value={assignToGrade} onValueChange={setAssignToGrade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">Grade 6</SelectItem>
                    <SelectItem value="7">Grade 7</SelectItem>
                    <SelectItem value="8">Grade 8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Instructions (optional)</Label>
              <Textarea value={instructions} onChange={e => setInstructions(e.target.value)}
                placeholder="Complete all questions. Show your work on math problems." rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Due Date (optional)</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>

            <Button onClick={handleAssign} disabled={submitting || (assignToType === "teacher" && !assignToId)}
              className="w-full bg-indigo-600 hover:bg-indigo-700">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Assigning...</> : <><Send className="w-4 h-4 mr-2" /> Assign Worksheet</>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
