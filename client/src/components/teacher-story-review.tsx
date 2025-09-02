import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, User, Calendar, MessageCircle, Check, Eye, BookOpen } from "lucide-react";
import { format } from "date-fns";

interface StorySubmission {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  content: string;
  prompt: string;
  gradeLevel: number;
  wordCount: number;
  aiFeedback: any;
  teacherReviewed: boolean;
  teacherNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string;
}

export function TeacherStoryReview() {
  const [selectedSubmission, setSelectedSubmission] = useState<StorySubmission | null>(null);
  const [teacherNotes, setTeacherNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch story submissions
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["/api/teacher/story-submissions"],
    queryFn: async () => {
      const token = localStorage.getItem("teacherToken");
      const response = await fetch("/api/teacher/story-submissions", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) throw new Error("Failed to fetch submissions");
      return response.json();
    }
  });

  // Review submission mutation
  const reviewMutation = useMutation({
    mutationFn: async (data: { id: string; teacherNotes: string }) => {
      const token = localStorage.getItem("teacherToken");
      const response = await fetch(`/api/teacher/story-submissions/${data.id}/review`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ teacherNotes: data.teacherNotes })
      });
      if (!response.ok) throw new Error("Failed to review submission");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/story-submissions"] });
      setSelectedSubmission(null);
      setTeacherNotes("");
      toast({
        title: "Review submitted",
        description: "Your review has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Review failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleReview = () => {
    if (!selectedSubmission) return;
    reviewMutation.mutate({
      id: selectedSubmission.id,
      teacherNotes
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI Story Feedback Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading submissions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Student Story Submissions with AI Feedback
            <Badge variant="secondary">{submissions.length} submissions</Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Review student stories and the AI-generated feedback. Students see this as "teacher feedback" to maintain the educational experience.
          </p>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
              <p className="text-gray-600">
                Students haven't submitted any stories for AI feedback yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission: StorySubmission) => (
                <Card key={submission.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{submission.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {submission.studentName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(submission.submittedAt), 'MMM dd, yyyy')}
                          </span>
                          <Badge variant="outline">
                            Grade {submission.gradeLevel}
                          </Badge>
                          <Badge variant="outline">
                            {submission.wordCount} words
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {submission.teacherReviewed ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            Reviewed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Pending Review
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setTeacherNotes(submission.teacherNotes || "");
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {submission.prompt && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-700 mb-1">Writing Prompt:</p>
                        <p className="text-sm text-gray-600">{submission.prompt}</p>
                      </div>
                    )}
                    <div className="text-sm text-gray-600 line-clamp-3">
                      {submission.content.substring(0, 200)}...
                    </div>
                    {submission.aiFeedback && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm font-medium text-blue-700 mb-1">AI Feedback Summary:</p>
                        <p className="text-sm text-blue-600">
                          Score: {submission.aiFeedback.overallScore}/100 | 
                          {submission.aiFeedback.strengths?.length || 0} strengths identified | 
                          {submission.aiFeedback.improvementAreas?.length || 0} improvement areas
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedSubmission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Reviewing: {selectedSubmission.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Student Story */}
            <div>
              <h4 className="font-medium mb-2">Student Story</h4>
              <div className="max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-md border">
                <p className="whitespace-pre-wrap">{selectedSubmission.content}</p>
              </div>
            </div>

            {/* AI Feedback */}
            {selectedSubmission.aiFeedback && (
              <div>
                <h4 className="font-medium mb-2">AI-Generated Feedback (shown to student as "teacher feedback")</h4>
                <div className="p-4 bg-blue-50 rounded-md border space-y-3">
                  <div>
                    <p className="font-medium text-blue-900">Overall Score: {selectedSubmission.aiFeedback.overallScore}/100</p>
                  </div>
                  
                  {selectedSubmission.aiFeedback.strengths && (
                    <div>
                      <p className="font-medium text-green-700 mb-1">Strengths:</p>
                      <ul className="list-disc list-inside text-sm text-green-600 space-y-1">
                        {selectedSubmission.aiFeedback.strengths.map((strength: string, idx: number) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedSubmission.aiFeedback.improvementAreas && (
                    <div>
                      <p className="font-medium text-orange-700 mb-1">Areas for Improvement:</p>
                      <ul className="list-disc list-inside text-sm text-orange-600 space-y-1">
                        {selectedSubmission.aiFeedback.improvementAreas.map((area: string, idx: number) => (
                          <li key={idx}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedSubmission.aiFeedback.specificSuggestions && (
                    <div>
                      <p className="font-medium text-blue-700 mb-1">Specific Suggestions:</p>
                      <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                        {selectedSubmission.aiFeedback.specificSuggestions.map((suggestion: string, idx: number) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedSubmission.aiFeedback.encouragement && (
                    <div className="p-3 bg-green-100 rounded-md">
                      <p className="font-medium text-green-800 mb-1">Encouragement:</p>
                      <p className="text-sm text-green-700">{selectedSubmission.aiFeedback.encouragement}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Teacher Notes */}
            <div>
              <label htmlFor="teacher-notes" className="block font-medium mb-2">
                Your Review Notes (internal, not shown to students)
              </label>
              <textarea
                id="teacher-notes"
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                placeholder="Add your thoughts about the AI feedback quality, any concerns, or additional notes..."
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleReview}
                disabled={reviewMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSubmission(null);
                  setTeacherNotes("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}