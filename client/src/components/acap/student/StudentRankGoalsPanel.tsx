import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Target, TrendingUp, Sparkles, MessageSquare, PlayCircle, Plus, CheckCircle2, Pencil, Loader2 } from "lucide-react";
import { RingKpi } from "@/components/acap/shared/RingKpi";
import { getStudentRankAndGoals } from "@/lib/acap/api";
import { StudentGoal } from "@/lib/acap/types";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function StudentRankGoalsPanel() {
  const [loading, setLoading] = useState(true);
  const [openGoal, setOpenGoal] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const { toast } = useToast();

  const [subject, setSubject] = useState<"MATH" | "ELA" | "SCI">("MATH");
  const [rank, setRank] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [goals, setGoals] = useState<StudentGoal[]>([]);

  const [goalTitle, setGoalTitle] = useState("");
  const [goalReason, setGoalReason] = useState("");
  const [goalType, setGoalType] = useState("OUTCOME");
  const [goalTarget, setGoalTarget] = useState("FINAL");
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await getStudentRankAndGoals();
    setRank(data.rank);
    setDrivers(data.drivers);
    setGoals(data.goals);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getScholarId = () => {
    const direct = localStorage.getItem("studentId");
    if (direct) return direct;
    try {
      const data = JSON.parse(localStorage.getItem("studentData") || "{}");
      return data?.id || "";
    } catch { return ""; }
  };

  const goalMutation = useMutation({
    mutationFn: async (data: any) => {
      const scholarId = getScholarId();
      if (!scholarId) throw new Error("No student ID found");
      const endpoint = editingGoalId
        ? `/api/acap/goals/${editingGoalId}`
        : "/api/acap/goals";
      const method = editingGoalId ? "PUT" : "POST";
      const res = await apiRequest(method, endpoint, { ...data, scholarId });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: editingGoalId ? "Goal Updated" : "Goal Submitted", description: "Your goal has been sent for teacher review." });
      setOpenGoal(false);
      resetGoalForm();
      loadData();
    },
    onError: () => toast({ title: "Failed to save goal", variant: "destructive" }),
  });

  const resetGoalForm = () => {
    setGoalTitle("");
    setGoalReason("");
    setGoalType("OUTCOME");
    setGoalTarget("FINAL");
    setEditingGoalId(null);
  };

  const openEditGoal = (goal: StudentGoal) => {
    setGoalTitle(goal.title);
    setGoalReason("");
    setGoalType(goal.type || "OUTCOME");
    setGoalTarget("FINAL");
    setEditingGoalId(goal.id);
    setOpenGoal(true);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Rank & Goals</h2>
            <p className="text-sm text-muted-foreground">
              Your private rank + ACAP targets. No other scholar names are shown.
            </p>
          </div>

          <div className="flex items-center gap-2">
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

            <Button className="gap-2" onClick={() => setOpenGoal(true)}>
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <RingKpi
            title="Proficiency Rank"
            valueLabel={rank ? `${rank.proficiencyRank} / ${rank.populationN}` : "\u2014"}
            subLabel={rank ? `Score: ${rank.proficiencyScore}/100 \u2022 ${rank.updatedAtLabel}` : "\u2014"}
            badge="Private"
          />
          <RingKpi
            title="Growth Rank"
            valueLabel={rank ? `${rank.growthRank} / ${rank.populationN}` : "\u2014"}
            subLabel={rank ? `Score: ${rank.growthScore}/100 \u2022 ${rank.updatedAtLabel}` : "\u2014"}
            badge="Private"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Card className="lg:col-span-6 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Rank Drivers
              </CardTitle>
              <CardDescription>What is moving your rank right now (and what to do next).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {drivers.map((d, idx) => (
                <div key={idx} className="rounded-lg border bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{d.label}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{d.detail}</div>
                    </div>
                    <Badge variant="secondary">{d.deltaLabel}</Badge>
                  </div>
                </div>
              ))}

              <Separator />

              <Button className="w-full gap-2" onClick={() => {
                toast({ title: "Skills Activity Launched", description: `Starting ${subject === "MATH" ? "Math" : subject === "ELA" ? "ELA" : "Science"} adaptive practice. Navigate to the Boot Camp tab to begin your session.` });
              }}>
                <PlayCircle className="h-4 w-4" />
                Start Today's Skills
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-6 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                ACAP Targets
              </CardTitle>
              <CardDescription>Set goals. Your teacher can review and approve them.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="active">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="active">Active Goals</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-3">
                  <ScrollArea className="h-[260px] pr-2">
                    <div className="space-y-3">
                      {goals.map((g) => (
                        <GoalCard key={g.id} goal={g} />
                      ))}
                      {!goals.length && (
                        <div className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">
                          No goals yet. Click <span className="font-medium">New Goal</span> to create one.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="messages" className="space-y-3">
                  <div className="rounded-lg border bg-white p-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <div className="text-sm font-semibold">Goal Progress Updates</div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Your goal progress updates and rank change notifications will appear here.
                    </p>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Today</div>
                        <div className="mt-1 font-medium">You improved DOK 3 accuracy by +4%. Keep going.</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Yesterday</div>
                        <div className="mt-1 font-medium">Teacher reviewed your Math goal. Next step assigned.</div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-2" onClick={() => { resetGoalForm(); setOpenGoal(true); }}>
                  <Pencil className="h-4 w-4" />
                  Create / Edit Goal
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setShowProgress(!showProgress)}>
                  <TrendingUp className="h-4 w-4" />
                  {showProgress ? "Hide Progress" : "View Progress Details"}
                </Button>
              </div>
              {showProgress && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4 space-y-3">
                    <h4 className="font-semibold text-sm">Progress Summary</h4>
                    {goals.length > 0 ? goals.map((g) => (
                      <div key={g.id} className="flex items-center justify-between text-sm">
                        <span className="truncate flex-1">{g.title}</span>
                        <div className="flex items-center gap-2 ml-2">
                          <Progress value={g.progressPct} className="w-24" />
                          <span className="text-xs font-medium w-10 text-right">{g.progressPct}%</span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-xs text-muted-foreground">Create goals above to see your progress details here.</p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Proficiency Score: {rank?.proficiencyScore || 0}/100 | Growth Score: {rank?.growthScore || 0}/100
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={openGoal} onOpenChange={setOpenGoal}>
          <DialogContent className="sm:max-w-[640px]">
            <DialogHeader>
              <DialogTitle>Create an ACAP Goal</DialogTitle>
              <DialogDescription>
                Choose an outcome, skill, or process goal. Teacher review is required for approval.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Subject</div>
                <Select value={subject} onValueChange={(v) => setSubject(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MATH">Math</SelectItem>
                    <SelectItem value="ELA">ELA</SelectItem>
                    <SelectItem value="SCI">Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Goal Type</div>
                <Select value={goalType} onValueChange={setGoalType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OUTCOME">Outcome (Level Target)</SelectItem>
                    <SelectItem value="SKILL">Skill (Domain/Standard)</SelectItem>
                    <SelectItem value="PROCESS">Process (Minutes/Week)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="text-xs text-muted-foreground">Goal Title</div>
                <Input placeholder="e.g., Reach Level 3 by Final (Math)" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="text-xs text-muted-foreground">Why this goal?</div>
                <Input placeholder="Short explanation (optional)" value={goalReason} onChange={(e) => setGoalReason(e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="text-xs text-muted-foreground">Target Date</div>
                <Select value={goalTarget} onValueChange={setGoalTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Target window" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MIDPOINT">Midpoint</SelectItem>
                    <SelectItem value="FINAL">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setOpenGoal(false); resetGoalForm(); }}>
                Cancel
              </Button>
              <Button
                className="gap-2"
                disabled={!goalTitle.trim() || goalMutation.isPending}
                onClick={() => goalMutation.mutate({
                  title: goalTitle,
                  reason: goalReason,
                  type: goalType,
                  subject,
                  targetWindow: goalTarget,
                  status: "SUBMITTED",
                })}
              >
                {goalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {editingGoalId ? "Update Goal" : "Submit for Teacher Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function GoalCard({ goal }: { goal: StudentGoal }) {
  const statusVariant =
    goal.status === "APPROVED"
      ? "secondary"
      : goal.status === "SUBMITTED"
      ? "outline"
      : goal.status === "REVISION_REQUESTED"
      ? "destructive"
      : "outline";

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold">{goal.title}</div>
            <Badge variant={statusVariant as any}>{goal.status.replace("_", " ")}</Badge>
            <Badge variant="outline">{goal.subject}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">{goal.nextStep}</div>
          {goal.teacherNote ? <div className="text-xs text-muted-foreground">Teacher: {goal.teacherNote}</div> : null}
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{goal.progressPct}%</span>
        </div>
        <Progress value={goal.progressPct} />
      </div>
    </div>
  );
}
