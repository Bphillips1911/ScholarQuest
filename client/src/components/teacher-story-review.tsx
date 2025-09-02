import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { FileText, Eye, MessageSquare, CheckCircle, Clock, Star, User, Calendar, WordCount } from 'lucide-react';

interface StorySubmission {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  content: string;
  prompt: string;
  gradeLevel: number;
  wordCount: number;
  aiFeedback: {
    strengths: string[];
    improvementAreas: string[];
    specificSuggestions: string[];
    encouragement: string;
    nextSteps: string[];
    overallScore: number;
    wordAnalysis: {
      vocabulary: string;
      sentence_structure: string;
      creativity: string;
    };
  };
  teacherReviewed: boolean;
  teacherNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
}

interface TeacherStoryReviewProps {
  className?: string;
}

export function TeacherStoryReview({ className }: TeacherStoryReviewProps) {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<StorySubmission | null>(null);
  const [teacherNotes, setTeacherNotes] = useState('');
  const [activeTab, setActiveTab] = useState('unreviewed');

  // Fetch story submissions
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['/api/teacher/story-submissions'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Review submission mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ id, teacherNotes }: { id: string; teacherNotes: string }) =>
      apiRequest('PUT', `/api/teacher/story-submissions/${id}/review`, { teacherNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/story-submissions'] });
      setSelectedSubmission(null);
      setTeacherNotes('');
    },
  });

  const handleReview = (submission: StorySubmission) => {
    setSelectedSubmission(submission);
    setTeacherNotes(submission.teacherNotes || '');
  };

  const handleSubmitReview = () => {
    if (!selectedSubmission) return;
    reviewMutation.mutate({
      id: selectedSubmission.id,
      teacherNotes,
    });
  };

  const unreviewed = submissions.filter((s: StorySubmission) => !s.teacherReviewed);
  const reviewed = submissions.filter((s: StorySubmission) => s.teacherReviewed);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const SubmissionCard = ({ submission }: { submission: StorySubmission }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{submission.title}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{submission.studentName}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(submission.submittedAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <WordCount className="w-3 h-3" />
                  <span>{submission.wordCount} words</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-blue-100 text-blue-800">
              AI Score: {submission.aiFeedback.overallScore}/100
            </Badge>
            {submission.teacherReviewed ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Reviewed
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {submission.prompt && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700"><strong>Prompt:</strong> {submission.prompt}</p>
            </div>
          )}
          <p className="text-gray-700 line-clamp-3">{submission.content}</p>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => handleReview(submission)}
              data-testid={`review-submission-${submission.id}`}
            >
              <Eye className="w-4 h-4 mr-2" />
              {submission.teacherReviewed ? 'View Review' : 'Review & Comment'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Story Submissions</h2>
            <p className="text-gray-600">Review AI feedback and add your teacher insights</p>
          </div>
          <div className="flex space-x-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{unreviewed.length}</div>
              <div className="text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{reviewed.length}</div>
              <div className="text-gray-600">Reviewed</div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unreviewed" className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Pending Review ({unreviewed.length})</span>
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Reviewed ({reviewed.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unreviewed" className="mt-6">
            {unreviewed.length === 0 ? (
              <Card className="text-center p-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">All Caught Up!</h3>
                <p className="text-gray-600">No pending story submissions to review.</p>
              </Card>
            ) : (
              <div>
                {unreviewed.map((submission: StorySubmission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviewed" className="mt-6">
            {reviewed.length === 0 ? (
              <Card className="text-center p-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Reviews Yet</h3>
                <p className="text-gray-600">Reviewed submissions will appear here.</p>
              </Card>
            ) : (
              <div>
                {reviewed.map((submission: StorySubmission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSubmission(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedSubmission.title}</h3>
                  <p className="text-gray-600">by {selectedSubmission.studentName}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSubmission(null)}
                >
                  ×
                </Button>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
                {/* Story Content */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Student's Story</h4>
                  {selectedSubmission.prompt && (
                    <div className="p-3 bg-blue-50 rounded-lg mb-3">
                      <p className="text-sm text-blue-800"><strong>Writing Prompt:</strong> {selectedSubmission.prompt}</p>
                    </div>
                  )}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedSubmission.content}</p>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span>{selectedSubmission.wordCount} words</span>
                    <span>Grade {selectedSubmission.gradeLevel}</span>
                    <span>Submitted {formatDate(selectedSubmission.submittedAt)}</span>
                  </div>
                </div>

                {/* AI Feedback */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">AI Feedback Summary</h4>
                  <div className="grid gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h5 className="font-medium text-green-800 mb-2">Strengths</h5>
                      <ul className="space-y-1">
                        {selectedSubmission.aiFeedback.strengths.map((strength, index) => (
                          <li key={index} className="text-green-700 text-sm flex items-start space-x-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h5 className="font-medium text-orange-800 mb-2">Areas for Improvement</h5>
                      <ul className="space-y-1">
                        {selectedSubmission.aiFeedback.improvementAreas.map((area, index) => (
                          <li key={index} className="text-orange-700 text-sm flex items-start space-x-2">
                            <span className="text-orange-600 mt-1">•</span>
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Teacher Notes */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Your Teacher Notes</h4>
                  <Textarea
                    value={teacherNotes}
                    onChange={(e) => setTeacherNotes(e.target.value)}
                    placeholder="Add your personal feedback and observations..."
                    className="min-h-[100px]"
                    data-testid="teacher-notes-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Share your personal insights, encouragement, or additional suggestions for the student.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSubmission(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={reviewMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="submit-teacher-review"
                >
                  {reviewMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>{selectedSubmission.teacherReviewed ? 'Update Review' : 'Submit Review'}</span>
                    </div>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}