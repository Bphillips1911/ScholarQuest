import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, Settings2, Sparkles } from "lucide-react";
import { getAdminRankings } from "@/lib/acap/api";
import RankSettingsModal from "@/components/acap/admin/RankSettingsModal";
import { AdminRankingRow } from "@/lib/acap/types";

export default function AdminRankingsPage() {
  const [subject, setSubject] = useState<"MATH" | "ELA" | "SCI">("MATH");
  const [grade, setGrade] = useState<string>("all");
  const [window, setWindow] = useState<"ALL_THREE" | "BASELINE" | "MIDPOINT" | "FINAL">("ALL_THREE");
  const [q, setQ] = useState("");

  const [openSettings, setOpenSettings] = useState(false);
  const [data, setData] = useState<{ grades: AdminRankingRow[]; classes: AdminRankingRow[]; teachers: AdminRankingRow[] } | null>(null);

  useEffect(() => {
    (async () => {
      const d = await getAdminRankings();
      setData(d);
    })();
  }, []);

  function filterRows(rows: AdminRankingRow[]) {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.label.toLowerCase().includes(s));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Admin \u2022 ACAP Rankings</h1>
              <p className="text-sm text-muted-foreground">
                Proficiency and growth rankings across grades, classes, and teachers\u2014based on Baseline/Midpoint/Final.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setOpenSettings(true)}>
                <Settings2 className="h-4 w-4" />
                Settings
              </Button>
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" />
                Recompute
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
            <Card className="md:col-span-12 border-slate-200">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

                    <Select value={grade} onValueChange={setGrade}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All grades</SelectItem>
                        <SelectItem value="6">Grade 6</SelectItem>
                        <SelectItem value="7">Grade 7</SelectItem>
                        <SelectItem value="8">Grade 8</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={window} onValueChange={(v) => setWindow(v as any)}>
                      <SelectTrigger className="w-[170px]">
                        <SelectValue placeholder="Window" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL_THREE">All Three</SelectItem>
                        <SelectItem value="BASELINE">Baseline</SelectItem>
                        <SelectItem value="MIDPOINT">Midpoint</SelectItem>
                        <SelectItem value="FINAL">Final</SelectItem>
                      </SelectContent>
                    </Select>

                    <Badge variant="secondary">Population: Admin-configured</Badge>
                  </div>

                  <div className="w-full lg:max-w-[360px]">
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search grade/class/teacher\u2026" />
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  TODO: Wire filters to GET /api/acap/rank/* endpoints and enforce role-based visibility.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
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
      </div>

      <RankSettingsModal open={openSettings} onOpenChange={setOpenSettings} />
    </div>
  );
}

function RankTable({ rows }: { rows: AdminRankingRow[] }) {
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
          <div className="col-span-2">
            <Badge variant="secondary">{r.proficiencyRank}</Badge>
          </div>
          <div className="col-span-2">
            <Badge variant="secondary">{r.growthRank}</Badge>
          </div>
          <div className="col-span-2">
            <Badge variant="outline">{r.proficiencyScore}</Badge>
          </div>
          <div className="col-span-2">
            <Badge variant="outline">{r.growthScore}</Badge>
          </div>
        </div>
      ))}

      {!rows.length && <div className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">No results.</div>}
    </div>
  );
}
