import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, Settings2, Sparkles, Loader2 } from "lucide-react";
import RankSettingsModal from "@/components/acap/admin/RankSettingsModal";
import bhsaCrestPath from "@assets/BHSA_Crest_1770514411089.jpg";

type RankingRow = {
  id: string;
  label: string;
  proficiencyRank: number;
  growthRank: number;
  proficiencyScore: number;
  growthScore: number;
  studentCount?: number;
};

export default function AdminRankingsPage() {
  const { toast } = useToast();
  const [subject, setSubject] = useState("MATH");
  const [grade, setGrade] = useState("all");
  const [window, setWindow] = useState("ALL_THREE");
  const [q, setQ] = useState("");
  const [openSettings, setOpenSettings] = useState(false);

  const { data, isLoading } = useQuery<{ grades: RankingRow[]; classes: RankingRow[]; teachers: RankingRow[] }>({
    queryKey: ["/api/acap/rankings/admin", subject, grade, window],
    queryFn: async () => {
      const res = await fetch(`/api/acap/rankings/admin?subject=${subject}&grade=${grade}&window=${window}`);
      return res.json();
    },
  });

  const recomputeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/acap/rankings/recompute", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acap/rankings/admin"] });
      toast({ title: "Rankings Recomputed", description: "Rankings have been refreshed with the latest data." });
    },
    onError: () => toast({ title: "Recompute Failed", variant: "destructive" }),
  });

  const handleExportCSV = async () => {
    try {
      const res = await apiRequest("POST", "/api/acap/rankings/export/csv", { subject });
      const result = await res.json();
      if (result.csv) {
        const blob = new Blob([result.csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `acap-rankings-${subject}.csv`; a.click();
        URL.revokeObjectURL(url);
      }
      toast({ title: "CSV Exported" });
    } catch { toast({ title: "Export failed", variant: "destructive" }); }
  };

  function filterRows(rows: RankingRow[]) {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.label.toLowerCase().includes(s));
  }

  return (
    <div className="space-y-6">
      <div className="border-b bg-gradient-to-r from-slate-900 to-indigo-900 rounded-xl p-6 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img src={bhsaCrestPath} alt="BHSA" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin ACAP Rankings</h1>
              <p className="text-sm text-slate-300">
                Bush Hills STEAM Academy — Proficiency and growth rankings across grades, classes, and teachers.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10" onClick={handleExportCSV}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10" onClick={() => setOpenSettings(true)}>
              <Settings2 className="h-4 w-4" /> Settings
            </Button>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => recomputeMutation.mutate()} disabled={recomputeMutation.isPending}>
              <Sparkles className="h-4 w-4" /> {recomputeMutation.isPending ? "Computing..." : "Recompute"}
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white"><SelectValue placeholder="Subject" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MATH">Math</SelectItem>
                      <SelectItem value="ELA">ELA</SelectItem>
                      <SelectItem value="SCI">Science</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white"><SelectValue placeholder="Grade" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      <SelectItem value="6">Grade 6</SelectItem>
                      <SelectItem value="7">Grade 7</SelectItem>
                      <SelectItem value="8">Grade 8</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={window} onValueChange={setWindow}>
                    <SelectTrigger className="w-[170px] bg-white/10 border-white/20 text-white"><SelectValue placeholder="Window" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_THREE">All Three</SelectItem>
                      <SelectItem value="BASELINE">Baseline</SelectItem>
                      <SelectItem value="MIDPOINT">Midpoint</SelectItem>
                      <SelectItem value="FINAL">Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full lg:max-w-[360px]">
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search grade, class, or teacher..." className="bg-white/10 border-white/20 text-white placeholder:text-white/40" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Rank Tables</CardTitle>
            <CardDescription>Compare proficiency and growth ranks across the school.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="grades">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="grades">Grades</TabsTrigger>
                <TabsTrigger value="classes">Classes</TabsTrigger>
                <TabsTrigger value="teachers">Teachers</TabsTrigger>
              </TabsList>
              <TabsContent value="grades" className="pt-4">
                <RankTable rows={filterRows(data?.grades ?? [])} />
              </TabsContent>
              <TabsContent value="classes" className="pt-4">
                <RankTable rows={filterRows(data?.classes ?? [])} />
              </TabsContent>
              <TabsContent value="teachers" className="pt-4">
                <RankTable rows={filterRows(data?.teachers ?? [])} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <RankSettingsModal open={openSettings} onOpenChange={setOpenSettings} />
    </div>
  );
}

function RankTable({ rows }: { rows: RankingRow[] }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-muted-foreground">
        <div className="col-span-4">Name</div>
        <div className="col-span-2">Prof Rank</div>
        <div className="col-span-2">Growth Rank</div>
        <div className="col-span-2">Prof Score</div>
        <div className="col-span-2">Growth Score</div>
      </div>
      {rows.map((r) => (
        <div key={r.id} className="grid grid-cols-12 gap-2 rounded-lg border bg-white px-3 py-3 text-sm">
          <div className="col-span-4 font-semibold">{r.label}</div>
          <div className="col-span-2"><Badge variant="secondary">#{r.proficiencyRank}</Badge></div>
          <div className="col-span-2"><Badge variant="secondary">#{r.growthRank}</Badge></div>
          <div className="col-span-2"><Badge variant="outline">{r.proficiencyScore}%</Badge></div>
          <div className="col-span-2"><Badge variant="outline">{r.growthScore >= 0 ? "+" : ""}{r.growthScore}</Badge></div>
        </div>
      ))}
      {!rows.length && (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">
          No ranking data available yet. Rankings are computed from completed ACAP assessment attempts.
        </div>
      )}
    </div>
  );
}
