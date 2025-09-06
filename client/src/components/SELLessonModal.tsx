import { useState, useEffect } from "react";
import { X, Clock, CheckCircle2, AlertTriangle, PlayCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface SELLesson {
  id: string;
  lessonTitle: string;
  lessonContent: string;
  status: 'assigned' | 'in_progress' | 'completed';
  assignedAt: string;
  dueDate?: string;
  estimatedTime: number;
  difficulty: string;
  interventionLevel: number;
}

interface QuizQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: string;
  correctAnswer: string;
  choices?: string[];
  explanation: string;
}

interface SELLessonModalProps {
  lesson: SELLesson;
  isOpen: boolean;
  onClose: () => void;
}

export function SELLessonModal({ lesson, isOpen, onClose }: SELLessonModalProps) {
  const [currentStep, setCurrentStep] = useState<'lesson' | 'quiz' | 'results'>('lesson');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<number>(Date.now());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch quiz questions when starting quiz
  const { mutate: startLesson } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/student/sel/lessons/${lesson.id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('studentToken')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to start lesson');
      return response.json();
    },
    onSuccess: (data) => {
      setQuizQuestions(data.questions || []);
      setCurrentStep('quiz');
      setStartTime(Date.now());
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start lesson",
        variant: "destructive",
      });
    }
  });

  // Submit quiz answers
  const { mutate: submitQuiz, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      const response = await fetch(`/api/student/sel/lessons/${lesson.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('studentToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers,
          timeSpent
        })
      });
      if (!response.ok) throw new Error('Failed to submit quiz');
      return response.json();
    },
    onSuccess: (results) => {
      setCurrentStep('results');
      queryClient.invalidateQueries({ queryKey: ['/api/student/sel/lessons'] });
      
      // Show completion toast
      toast({
        title: results.isPassed ? "Great Job!" : "Keep Trying!",
        description: results.isPassed 
          ? `You scored ${results.scorePercentage}% and completed the lesson!`
          : `You scored ${results.scorePercentage}%. Review the feedback and try again.`,
        variant: results.isPassed ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit quiz",
        variant: "destructive",
      });
    }
  });

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const isQuizComplete = quizQuestions.length > 0 && 
    quizQuestions.every(q => answers[q.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto relative" style={{ zIndex: 10000 }}>
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{lesson.lessonTitle}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span>Level {lesson.interventionLevel}</span>
              <span>{lesson.difficulty}</span>
              <span>{lesson.estimatedTime} minutes</span>
              <Badge variant={
                lesson.status === 'assigned' ? 'secondary' :
                lesson.status === 'in_progress' ? 'default' : 'default'
              }>
                {lesson.status === 'assigned' && 'Ready to Start'}
                {lesson.status === 'in_progress' && 'In Progress'}
                {lesson.status === 'completed' && 'Completed'}
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-12rem)]">
          {/* Step 1: Lesson Content */}
          {currentStep === 'lesson' && (
            <div className="p-6">
              <div className="prose max-w-none">
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">Learning Objective</h3>
                  <p className="text-blue-800 text-sm">
                    This lesson will help you understand and improve your behavior choices.
                    Read carefully and then complete the comprehension quiz.
                  </p>
                </div>
                
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {lesson.lessonContent}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Quiz Questions */}
          {currentStep === 'quiz' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Comprehension Quiz</h3>
                <p className="text-sm text-gray-600">
                  Answer all questions to complete the lesson. You need 80% to pass.
                </p>
              </div>

              <div className="space-y-6">
                {quizQuestions.map((question, index) => (
                  <Card key={question.id} className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium">
                        Question {index + 1}: {question.questionText}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {question.questionType === 'multiple_choice' && question.choices && (
                        <RadioGroup
                          value={answers[question.id] || ''}
                          onValueChange={(value) => handleAnswerChange(question.id, value)}
                        >
                          {question.choices.map((choice, choiceIndex) => (
                            <div key={choiceIndex} className="flex items-center space-x-2">
                              <RadioGroupItem
                                value={choice}
                                id={`${question.id}-${choiceIndex}`}
                              />
                              <Label 
                                htmlFor={`${question.id}-${choiceIndex}`}
                                className="text-sm cursor-pointer"
                              >
                                {choice}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {question.questionType === 'true_false' && (
                        <RadioGroup
                          value={answers[question.id] || ''}
                          onValueChange={(value) => handleAnswerChange(question.id, value)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="True" id={`${question.id}-true`} />
                            <Label htmlFor={`${question.id}-true`} className="cursor-pointer">
                              True
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="False" id={`${question.id}-false`} />
                            <Label htmlFor={`${question.id}-false`} className="cursor-pointer">
                              False
                            </Label>
                          </div>
                        </RadioGroup>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {currentStep === 'results' && (
            <div className="p-6">
              <div className="text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Lesson Completed!</h3>
                <p className="text-gray-600 mb-4">
                  Great job completing your SEL lesson. Your progress has been saved.
                </p>
                
                <div className="bg-green-50 p-4 rounded-lg inline-block">
                  <p className="text-sm text-green-800">
                    This lesson will help you make better choices in the future.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-white shadow-lg relative z-30">
          <div className="text-sm text-gray-600 font-medium">
            {currentStep === 'lesson' && 'Step 1 of 3: Read the lesson'}
            {currentStep === 'quiz' && `Step 2 of 3: Answer ${quizQuestions.length} questions`}
            {currentStep === 'results' && 'Step 3 of 3: Completed!'}
          </div>
          
          <div className="flex items-center gap-3">
            {currentStep === 'lesson' && (
              <Button 
                onClick={() => startLesson()} 
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 text-base shadow-md hover:shadow-lg transition-all duration-200 relative z-40 border-0"
                style={{ zIndex: 9999 }}
              >
                <PlayCircle className="h-5 w-5 mr-2" />
                Start Quiz
              </Button>
            )}
            
            {currentStep === 'quiz' && (
              <Button 
                onClick={() => submitQuiz()}
                disabled={!isQuizComplete || isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 text-base shadow-md hover:shadow-lg transition-all duration-200 relative z-40 border-0"
                style={{ zIndex: 9999 }}
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Submit Quiz
                  </>
                )}
              </Button>
            )}

            {currentStep === 'results' && (
              <Button 
                onClick={onClose} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 text-base shadow-md hover:shadow-lg transition-all duration-200 relative z-40 border-0"
                style={{ zIndex: 9999 }}
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}