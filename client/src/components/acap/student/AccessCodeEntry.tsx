import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Key, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface ValidatedCode {
  valid: boolean;
  accessCode: {
    id: number;
    code: string;
    assessmentId: number;
    window: string;
    gradeLevel: number;
    subject: string;
  };
}

export default function AccessCodeEntry({ onValidCode }: { onValidCode: (data: ValidatedCode) => void }) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [validated, setValidated] = useState<ValidatedCode | null>(null);
  const [error, setError] = useState("");

  const validateMutation = useMutation({
    mutationFn: async () => {
      if (!code.trim()) throw new Error("Please enter an access code");
      const res = await apiRequest("POST", "/api/acap/access-codes/validate", { code: code.trim() });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Invalid code");
      }
      return res.json();
    },
    onSuccess: (data: ValidatedCode) => {
      setValidated(data);
      setError("");
      toast({ title: "Access Code Validated", description: `You are cleared to take the ${data.accessCode.window.toLowerCase()} assessment.` });
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
            maxLength={8}
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
            <div className="flex gap-2">
              <Badge variant="secondary">{validated.accessCode.subject}</Badge>
              <Badge variant="outline">Grade {validated.accessCode.gradeLevel}</Badge>
              <Badge variant="outline">{validated.accessCode.window}</Badge>
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
            <><CheckCircle2 className="h-4 w-4" /> Start Assessment</>
          ) : (
            <><Key className="h-4 w-4" /> Validate Code</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
