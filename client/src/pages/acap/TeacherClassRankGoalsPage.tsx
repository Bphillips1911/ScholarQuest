import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RingKpi } from "@/components/acap/shared/RingKpi";
import { GoalReviewQueue } from "@/components/acap/teacher/GoalReviewQueue";
import { getTeacherClassRanksAndQueue } from "@/lib/acap/api";
import { Download, Sparkles, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TeacherClassRankGoalsPage() {
  const [subject, setSubject] = useState<"MATH" | "ELA" | "SCI">("MATH");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [summary, setSummary] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    const data = await getTeacherClassRanksAndQueue();
    setSummary(data.summary);
    setDrivers(data.drivers);
    setQueue(data.queue);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const recomputeMutation = useMutation({
    mutationFn: async () => {
      const teacherId = localStorage.getItem("teacherAuthId") || "";
      const res = await apiRequest("POST", "/api/acap/rankings/recompute", { subject, teacherId });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Rankings Recomputed", description: "Class rankings have been refreshed with the latest data." });
      loadData();
    },
    onError: () => toast({ title: "Recompute Failed", description: "Could not refresh rankings. Try again.", variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Teacher Dashboard - Rank & Goals</h1>
              <p className="text-sm text-muted-foreground">
                Class ranking + student goal review to drive proficiency and growth.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={subject} onValueChange={(v) => setSubject(v as any)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MATH">Math</SelectItem>
                  <SelectItem value="ELA">ELA</SelectItem>
                  <SelectItem value="SCI">Science</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>

              <Button className="gap-2" onClick={() => recomputeMutation.mutate()} disabled={recomputeMutation.isPending}>
                {recomputeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {recomputeMutation.isPending ? "Computing..." : "Recompute"}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <RingKpi
                title="Class Proficiency Rank"
                valueLabel={summary ? `${summary.proficiencyRank} / ${summary.totalClassesN}` : "\u2014"}
                subLabel={summary ? summary.className : "\u2014"}
              />
            </div>
            <div className="md:col-span-4">
              <RingKpi
                title="Class Growth Rank"
                valueLabel={summary ? `${summary.growthRank} / ${summary.totalClassesN}` : "\u2014"}
                subLabel="Across school"
              />
            </div>
            <div className="md:col-span-4">
              <RingKpi
                title="Grade Rank"
                valueLabel={summary ? `${summary.gradeRank} / ${summary.totalGradesN}` : "\u2014"}
                subLabel="Grade-level placement"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-7 border-slate-200">
            <CardHeader>
              <CardTitle>Class Rank Drivers</CardTitle>
              <CardDescription>Domains and DOK distribution impacting your class rank.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {drivers.map((d, idx) => (
                  <div key={idx} className="rounded-lg border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{d.domain}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{d.note}</div>
                      </div>
                      <Badge variant="secondary">High leverage</Badge>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">DOK 2 share</div>
                        <div className="mt-1 font-semibold">{d.dok2Pct}%</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">DOK 3\u20134 share</div>
                        <div className="mt-1 font-semibold">{d.dok34Pct}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Click Recompute to refresh rankings with latest assessment data.
              </p>
            </CardContent>
          </Card>

          <div className="lg:col-span-5">
            <GoalReviewQueue items={queue} />
          </div>
        </div>
      </div>
    </div>
  );
}
