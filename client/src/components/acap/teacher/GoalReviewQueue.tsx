import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, MessageSquare, Pencil } from "lucide-react";
import { GoalQueueItem } from "@/lib/acap/types";

export function GoalReviewQueue({ items }: { items: GoalQueueItem[] }) {
  const [openComment, setOpenComment] = useState(false);
  const [activeGoal, setActiveGoal] = useState<GoalQueueItem | null>(null);

  const submitted = items.filter((i) => i.status === "SUBMITTED");
  const revision = items.filter((i) => i.status === "REVISION_REQUESTED");
  const approved = items.filter((i) => i.status === "APPROVED");

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle>Goal Review Queue</CardTitle>
        <CardDescription>Review student goals for approval, revision, or feedback.</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="submitted">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="submitted">Submitted</TabsTrigger>
            <TabsTrigger value="revision">Revision</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>

          <TabsContent value="submitted" className="space-y-3 pt-3">
            {submitted.map((g) => (
              <QueueRow key={g.goalId} item={g} onComment={() => { setActiveGoal(g); setOpenComment(true); }} />
            ))}
            {!submitted.length && <EmptyState label="No submitted goals." />}
          </TabsContent>

          <TabsContent value="revision" className="space-y-3 pt-3">
            {revision.map((g) => (
              <QueueRow key={g.goalId} item={g} onComment={() => { setActiveGoal(g); setOpenComment(true); }} />
            ))}
            {!revision.length && <EmptyState label="No goals in revision." />}
          </TabsContent>

          <TabsContent value="approved" className="space-y-3 pt-3">
            {approved.map((g) => (
              <QueueRow key={g.goalId} item={g} onComment={() => { setActiveGoal(g); setOpenComment(true); }} />
            ))}
            {!approved.length && <EmptyState label="No approved goals yet." />}
          </TabsContent>
        </Tabs>

        <p className="mt-3 text-xs text-muted-foreground">
          TODO: Wire Approve/Revise/Comment to PATCH /api/acap/goals/:goalId/review.
        </p>
      </CardContent>

      <Dialog open={openComment} onOpenChange={setOpenComment}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Comment on Goal</DialogTitle>
            <DialogDescription>
              Provide feedback to help the student refine the goal or take next steps.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {activeGoal ? (
              <div className="rounded-lg border bg-white p-3 text-sm">
                <div className="font-semibold">{activeGoal.studentName}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {activeGoal.subject} \u2022 Grade {activeGoal.grade} \u2022 {activeGoal.goalTitle}
                </div>
              </div>
            ) : null}

            <Textarea placeholder="Write feedback\u2026" />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenComment(false)}>
              Cancel
            </Button>
            <Button className="gap-2" onClick={() => setOpenComment(false)}>
              <MessageSquare className="h-4 w-4" />
              Send Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function QueueRow({ item, onComment }: { item: GoalQueueItem; onComment: () => void }) {
  const statusVariant =
    item.status === "APPROVED" ? "secondary" : item.status === "REVISION_REQUESTED" ? "destructive" : "outline";

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold">{item.studentName}</div>
            <Badge variant="outline">{item.studentId}</Badge>
            <Badge variant={statusVariant as any}>{item.status.replace("_", " ")}</Badge>
            <Badge variant="outline">{item.subject}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">{item.goalTitle}</div>
          <div className="text-xs text-muted-foreground">Submitted: {item.submittedAtLabel}</div>
        </div>

        <div className="flex flex-col gap-2">
          <Button size="sm" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </Button>
          <Button size="sm" variant="outline" className="gap-2">
            <Pencil className="h-4 w-4" />
            Revise
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={onComment}>
            <MessageSquare className="h-4 w-4" />
            Comment
          </Button>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{item.progressPct}%</span>
        </div>
        <Progress value={item.progressPct} />
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">
      {label}
    </div>
  );
}
