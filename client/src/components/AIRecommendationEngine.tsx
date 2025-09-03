import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Brain, 
  Sparkles, 
  Target, 
  Clock, 
  Star, 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  User,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AIRecommendationEngineProps {
  studentId?: string;
  grade?: string;
  className?: string;
}

export function AIRecommendationEngine({ studentId, grade, className }: AIRecommendationEngineProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>(studentId || '');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [showImplementationForm, setShowImplementationForm] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get student recommendations
  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ['/api/teacher/recommendations', selectedStudent],
    enabled: !!selectedStudent
  });

  // Get class recommendations if grade is provided
  const { data: classRecommendations } = useQuery({
    queryKey: ['/api/teacher/recommendations/class', grade],
    enabled: !!grade && !selectedStudent
  });

  // Generate new recommendations mutation
  const generateRecommendationsMutation = useMutation({
    mutationFn: async (studentId: string) => {
      return await apiRequest(`/api/teacher/recommendations/generate/${studentId}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "AI Recommendations Generated",
        description: "New personalized recommendations are ready for review",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate AI recommendations",
        variant: "destructive",
      });
    }
  });

  // Update recommendation status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, feedback }: { id: string; status: string; feedback?: string }) => {
      return await apiRequest(`/api/teacher/recommendations/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, implementationFeedback: feedback })
      });
    },
    onSuccess: (_, variables) => {
      refetch();
      setShowImplementationForm(null);
      setFeedbackText('');
      
      const statusMessages = {
        'in_progress': 'Recommendation marked as in progress',
        'completed': 'Recommendation marked as completed',
        'dismissed': 'Recommendation dismissed'
      };
      
      toast({
        title: "Status Updated",
        description: statusMessages[variables.status as keyof typeof statusMessages] || "Status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update recommendation status",
        variant: "destructive",
      });
    }
  });

  const priorityConfig = {
    urgent: { 
      color: 'bg-red-100 text-red-800 border-red-200', 
      icon: AlertTriangle,
      bgColor: 'bg-red-50 border-red-200'
    },
    high: { 
      color: 'bg-orange-100 text-orange-800 border-orange-200', 
      icon: TrendingUp,
      bgColor: 'bg-orange-50 border-orange-200'
    },
    medium: { 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      icon: Target,
      bgColor: 'bg-blue-50 border-blue-200'
    },
    low: { 
      color: 'bg-gray-100 text-gray-800 border-gray-200', 
      icon: Lightbulb,
      bgColor: 'bg-gray-50 border-gray-200'
    }
  };

  const typeConfig = {
    learning_activity: {
      label: 'Learning Activity',
      icon: Target,
      color: 'bg-purple-100 text-purple-800'
    },
    intervention: {
      label: 'Intervention',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-800'
    },
    enrichment: {
      label: 'Enrichment',
      icon: Star,
      color: 'bg-yellow-100 text-yellow-800'
    },
    behavioral_support: {
      label: 'Behavioral Support',
      icon: User,
      color: 'bg-green-100 text-green-800'
    }
  };

  const statusConfig = {
    pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    dismissed: { label: 'Dismissed', color: 'bg-gray-100 text-gray-800', icon: XCircle }
  };

  const handleImplement = (recommendation: any) => {
    setShowImplementationForm(recommendation.id);
  };

  const handleSubmitImplementation = (recommendationId: string, status: string) => {
    updateStatusMutation.mutate({
      id: recommendationId,
      status,
      feedback: feedbackText
    });
  };

  const RecommendationCard = ({ recommendation }: { recommendation: any }) => {
    const priority = priorityConfig[recommendation.priority as keyof typeof priorityConfig];
    const type = typeConfig[recommendation.recommendationType as keyof typeof typeConfig];
    const status = statusConfig[recommendation.status as keyof typeof statusConfig];
    
    return (
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-200 hover:shadow-md",
          priority.bgColor
        )}
        data-testid={`recommendation-${recommendation.id}`}
      >
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={type.color}>
                    <type.icon className="h-3 w-3 mr-1" />
                    {type.label}
                  </Badge>
                  <Badge className={priority.color}>
                    <priority.icon className="h-3 w-3 mr-1" />
                    {recommendation.priority.charAt(0).toUpperCase() + recommendation.priority.slice(1)}
                  </Badge>
                  <Badge className={status.color}>
                    <status.icon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg leading-tight">{recommendation.title}</h3>
              </div>
              
              <div className="text-right text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {recommendation.estimatedDuration} min
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Brain className="h-3 w-3" />
                  {recommendation.confidence}% confidence
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">
              {recommendation.description}
            </p>

            {/* AI Reasoning */}
            {recommendation.aiReasoning && (
              <div className="bg-white/50 p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">AI Analysis</span>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  {recommendation.aiReasoning}
                </p>
              </div>
            )}

            {/* Action Items */}
            {recommendation.actionItems && recommendation.actionItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Action Items</span>
                </div>
                <ul className="space-y-1 ml-6">
                  {recommendation.actionItems.map((item: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Target Skills */}
            {recommendation.targetSkills && recommendation.targetSkills.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-sm">Target Skills</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {recommendation.targetSkills.map((skill: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Implementation Form */}
            {showImplementationForm === recommendation.id && (
              <div className="border-t pt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium">Implementation Notes (Optional)</label>
                  <Textarea
                    placeholder="Share your experience implementing this recommendation..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="mt-1"
                    rows={3}
                    data-testid={`feedback-${recommendation.id}`}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitImplementation(recommendation.id, 'in_progress')}
                    disabled={updateStatusMutation.isPending}
                    data-testid={`button-start-${recommendation.id}`}
                  >
                    Start Implementation
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSubmitImplementation(recommendation.id, 'completed')}
                    disabled={updateStatusMutation.isPending}
                    data-testid={`button-complete-${recommendation.id}`}
                  >
                    Mark Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowImplementationForm(null)}
                    data-testid={`button-cancel-${recommendation.id}`}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {recommendation.status === 'pending' && showImplementationForm !== recommendation.id && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleImplement(recommendation)}
                  data-testid={`button-implement-${recommendation.id}`}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Implement
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateStatusMutation.mutate({ id: recommendation.id, status: 'dismissed' })}
                  disabled={updateStatusMutation.isPending}
                  data-testid={`button-dismiss-${recommendation.id}`}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Dismiss
                </Button>
              </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <div>Generated: {format(new Date(recommendation.createdAt), 'PPp')}</div>
              {recommendation.implementedAt && (
                <div>Implemented: {format(new Date(recommendation.implementedAt), 'PPp')}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const currentRecommendations = recommendations || classRecommendations || [];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Powered Adaptive Recommendation Engine
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Personalized learning and behavioral insights powered by artificial intelligence
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          {!studentId && (
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">Student (Optional)</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger data-testid="select-student">
                    <SelectValue placeholder="Select student for personalized recommendations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students (Class View)</SelectItem>
                    {/* This would be populated with actual students from the API */}
                  </SelectContent>
                </Select>
              </div>
              {selectedStudent && (
                <Button
                  onClick={() => generateRecommendationsMutation.mutate(selectedStudent)}
                  disabled={generateRecommendationsMutation.isPending}
                  data-testid="button-generate-recommendations"
                >
                  {generateRecommendationsMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Recommendations
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {studentId && (
            <div className="flex justify-end">
              <Button
                onClick={() => generateRecommendationsMutation.mutate(studentId)}
                disabled={generateRecommendationsMutation.isPending}
                data-testid="button-refresh-recommendations"
              >
                {generateRecommendationsMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Recommendations
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Brain className="h-6 w-6 animate-pulse text-purple-600" />
              <span>AI is analyzing student data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations List */}
      {currentRecommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {selectedStudent ? 'Personalized Recommendations' : 'Class Recommendations'}
            </h3>
            <Badge variant="outline">
              {currentRecommendations.length} Recommendations
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentRecommendations.map((recommendation: any) => (
              <RecommendationCard key={recommendation.id} recommendation={recommendation} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && currentRecommendations.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Recommendations Available</h3>
            <p className="text-muted-foreground mb-4">
              {selectedStudent 
                ? "Generate AI-powered recommendations for this student based on their recent activity and performance data."
                : "Select a student to view personalized recommendations or view class-wide insights."
              }
            </p>
            {selectedStudent && (
              <Button 
                onClick={() => generateRecommendationsMutation.mutate(selectedStudent)}
                disabled={generateRecommendationsMutation.isPending}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate First Recommendations
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}