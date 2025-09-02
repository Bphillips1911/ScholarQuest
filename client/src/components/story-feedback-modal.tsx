import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { useAdvancedUI } from '@/components/ui/advanced-ui-system';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { X, FileText, Sparkles, CheckCircle, Clock, Target, Lightbulb, ArrowRight } from 'lucide-react';

interface StoryFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  className?: string;
}

interface AIFeedback {
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
}

export function StoryFeedbackModal({ 
  isOpen, 
  onClose, 
  studentId, 
  studentName, 
  className 
}: StoryFeedbackModalProps) {
  const { showEmojiNotification, announce } = useAdvancedUI();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [prompt, setPrompt] = useState('');
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const storyFeedbackMutation = useMutation({
    mutationFn: async ({ title, content, prompt }: { title: string; content: string; prompt?: string }) =>
      apiRequest('POST', '/api/student/story-feedback', {
        studentId,
        title,
        content,
        prompt: prompt || '',
        gradeLevel: 7
      }),
    onSuccess: (data) => {
      setFeedback(data.feedback);
      setSubmissionId(data.submissionId);
      setShowFeedback(true);
      showEmojiNotification('achievement', 'feedback_received', 'Your teacher feedback is ready!');
      announce('Story submitted successfully! Your personalized feedback is now available.');
    },
    onError: (error) => {
      console.error('Story feedback error:', error);
      showEmojiNotification('general', 'error', 'Unable to process your story right now. Please try again.');
    }
  });

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      showEmojiNotification('general', 'warning', 'Please add both a title and your story content.');
      return;
    }

    if (content.trim().split(' ').length < 10) {
      showEmojiNotification('general', 'warning', 'Your story needs to be at least 10 words long.');
      return;
    }

    storyFeedbackMutation.mutate({ title: title.trim(), content: content.trim(), prompt: prompt.trim() });
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setPrompt('');
    setFeedback(null);
    setShowFeedback(false);
    setSubmissionId(null);
    onClose();
  };

  const wordCount = content.trim().split(' ').filter(word => word.length > 0).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Creative Writing Assistant</h2>
                <p className="text-sm text-gray-600">Get personalized feedback on your story</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
              data-testid="close-story-modal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {!showFeedback ? (
              // Story Input Form
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Story Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your story title..."
                    className="w-full"
                    data-testid="story-title-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Writing Prompt (Optional)</label>
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter the writing prompt if you have one..."
                    className="w-full"
                    data-testid="story-prompt-input"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Your Story</label>
                    <Badge variant={wordCount >= 50 ? "default" : "secondary"}>
                      {wordCount} words
                    </Badge>
                  </div>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your story here... Let your creativity flow!"
                    className="w-full min-h-[200px] resize-none"
                    data-testid="story-content-input"
                  />
                  <p className="text-xs text-gray-500">
                    Minimum 10 words required. Aim for 50+ words for detailed feedback.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    data-testid="cancel-story-submission"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={storyFeedbackMutation.isPending || !title.trim() || !content.trim() || wordCount < 10}
                    className="bg-purple-600 hover:bg-purple-700"
                    data-testid="submit-story"
                  >
                    {storyFeedbackMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Getting Feedback...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Get Feedback</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              // Feedback Display
              <div className="p-6 space-y-6">
                <div className="text-center space-y-2">
                  <div className="p-3 bg-green-100 rounded-full w-fit mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Your Personalized Feedback</h3>
                  <p className="text-gray-600">Here's what your teacher thinks about "{title}"</p>
                  <Badge className="bg-blue-100 text-blue-800">
                    Score: {feedback?.overallScore}/100
                  </Badge>
                </div>

                {feedback && (
                  <div className="grid gap-6">
                    {/* Strengths */}
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-green-800 flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5" />
                          <span>What You Did Great</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {feedback.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-green-600 mt-1">•</span>
                              <span className="text-green-700">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Improvement Areas */}
                    <Card className="border-orange-200 bg-orange-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-orange-800 flex items-center space-x-2">
                          <Target className="w-5 h-5" />
                          <span>Areas to Work On</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {feedback.improvementAreas.map((area, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-orange-600 mt-1">•</span>
                              <span className="text-orange-700">{area}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Specific Suggestions */}
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-blue-800 flex items-center space-x-2">
                          <Lightbulb className="w-5 h-5" />
                          <span>Specific Tips</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {feedback.specificSuggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-blue-600 mt-1">•</span>
                              <span className="text-blue-700">{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Encouragement */}
                    <Card className="border-purple-200 bg-purple-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-purple-800 flex items-center space-x-2">
                          <Sparkles className="w-5 h-5" />
                          <span>Encouragement</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-purple-700 italic">{feedback.encouragement}</p>
                      </CardContent>
                    </Card>

                    {/* Next Steps */}
                    <Card className="border-indigo-200 bg-indigo-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-indigo-800 flex items-center space-x-2">
                          <ArrowRight className="w-5 h-5" />
                          <span>Next Steps</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {feedback.nextSteps.map((step, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-indigo-600 mt-1">{index + 1}.</span>
                              <span className="text-indigo-700">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowFeedback(false)}
                    data-testid="write-another-story"
                  >
                    Write Another Story
                  </Button>
                  <Button
                    onClick={handleClose}
                    className="bg-purple-600 hover:bg-purple-700"
                    data-testid="close-feedback"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}