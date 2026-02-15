import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Key, Loader2, CheckCircle2, AlertTriangle, Play } from "lucide-react";

interface ValidatedResult {
  valid: boolean;
  accessCode: {
    id: number;
    code: string;
    assessmentId: number | null;
    forgeAssessmentId?: number | null;
    versionId?: number | null;
    window?: string;
    gradeLevel?: number;
    subject?: string;
    source?: string;
  };
  assessmentId?: number | null;
  forgeAssessmentId?: number | null;
  versionId?: number | null;
  instanceId?: number | null;
  launchUrl?: string;
}

export default function AccessCodeEntry({ onValidCode, studentId }: { onValidCode: (data: ValidatedResult) => void; studentId?: string }) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [validated, setValidated] = useState<ValidatedResult | null>(null);
  const [error, setError] = useState("");

  const validateMutation = useMutation({
    mutationFn: async (): Promise<ValidatedResult> => {
      if (!code.trim()) throw new Error("Please enter an access code");
      const res = await fetch("/api/acap/access-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          studentId: studentId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid access code");
      }
      return data as ValidatedResult;
    },
    onSuccess: (data: ValidatedResult) => {
      setValidated(data);
      setError("");
      const source = data.accessCode?.source || "teacher";
      const label = source === "forge" ? "Forge assessment" : (data.accessCode?.window?.toLowerCase() || "assessment");
      toast({ title: "Access Code Validated", description: `You are cleared to take the ${label}.` });
    },
    onError: (err: any) => {
      setError(err.message || "Invalid access code");
      setValidated(null);
    },
  });

  const handleSubmit = () => {
    if (validated) {
      onValidCode(validated);
    } else {
      validateMutation.mutate();
    }
  };

  return (
    <Card className="max-w-md mx-auto border-2 border-indigo-100 shadow-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center">
            <Key className="h-7 w-7 text-indigo-600" />
          </div>
        </div>
        <CardTitle>Enter Access Code</CardTitle>
        <CardDescription>Your teacher will give you a code to start the EduCAP assessment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); setValidated(null); }}
            placeholder="Enter code (e.g. ABC123)"
            className="text-center text-2xl font-mono tracking-[0.3em] h-14"
            maxLength={12}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {validated && (
          <div className="flex flex-col items-center gap-2 bg-emerald-50 rounded-lg p-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">Code Verified</span>
            <div className="flex gap-2 flex-wrap justify-center">
              {validated.accessCode?.subject && <Badge variant="secondary">{validated.accessCode.subject}</Badge>}
              {validated.accessCode?.gradeLevel && <Badge variant="outline">Grade {validated.accessCode.gradeLevel}</Badge>}
              {validated.accessCode?.source === "forge" && <Badge className="bg-purple-100 text-purple-700">Forge</Badge>}
              {validated.accessCode?.window && <Badge variant="outline">{validated.accessCode.window}</Badge>}
            </div>
          </div>
        )}

        <Button
          className="w-full h-12 text-base gap-2"
          onClick={handleSubmit}
          disabled={!code.trim() || validateMutation.isPending}
        >
          {validateMutation.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Validating...</>
          ) : validated ? (
            <><Play className="h-4 w-4" /> Start Assessment</>
          ) : (
            <><Key className="h-4 w-4" /> Validate Code</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
