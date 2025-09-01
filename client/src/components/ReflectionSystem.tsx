import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, Clock, CheckCircle, AlertCircle, Send, 
  MessageSquare, User, Calendar, FileText, Eye,
  ThumbsUp, ThumbsDown, Users, Mail
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Reflection, PbisEntry } from "@shared/schema";

interface ReflectionSystemProps {
  userType: 'teacher' | 'student';
  userId: string;
  studentId?: string; // For teachers viewing student reflections
}

interface ReflectionWithDetails extends Reflection {
  pbisEntry?: PbisEntry;
  studentName?: string;
  assignerName?: string;
}

export function ReflectionSystem({ userType, userId, studentId }: ReflectionSystemProps) {
  const [selectedReflection, setSelectedReflection] = useState<ReflectionWithDetails | null>(null);
  const [response, setResponse] = useState("");
  const [teacherFeedback, setTeacherFeedback] = useState("");
  const { toast } = useToast();

  // Fetch reflections based on user type
  const { data: reflections = [], isLoading } = useQuery({
    queryKey: userType === 'teacher' 
      ? ['/api/teacher/reflections', studentId] 
      : ['/api/student/reflections', userId],
    enabled: !!userId,
  });

  // Submit student reflection
  const submitReflectionMutation = useMutation({
    mutationFn: async ({ reflectionId, response }: { reflectionId: string; response: string }) => {
      const response_data = await fetch(`/api/student/reflections/${reflectionId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('studentToken')}`
        },
        body: JSON.stringify({ response })
      });
      if (!response_data.ok) throw new Error('Failed to submit reflection');
      return response_data.json();
    },
    onSuccess: () => {
      toast({
        title: "Reflection Submitted",
        description: "Your reflection has been sent to your teacher for review.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/reflections'] });
      setSelectedReflection(null);
      setResponse("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit reflection. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Approve/reject reflection (teacher)
  const reviewReflectionMutation = useMutation({
    mutationFn: async ({ 
      reflectionId, 
      status, 
      feedback 
    }: { 
      reflectionId: string; 
      status: 'approved' | 'rejected'; 
      feedback?: string;
    }) => {
      const response_data = await fetch(`/api/teacher/reflections/${reflectionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify({ status, feedback })
      });
      if (!response_data.ok) throw new Error('Failed to review reflection');
      return response_data.json();
    },
    onSuccess: (_, { status }) => {
      toast({
        title: status === 'approved' ? "Reflection Approved" : "Reflection Rejected", 
        description: status === 'approved' 
          ? "The reflection has been approved and sent to the parent."
          : "The reflection has been rejected and returned to the student.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/reflections'] });
      setSelectedReflection(null);
      setTeacherFeedback("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to review reflection. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Assign new reflection (teacher)
  const assignReflectionMutation = useMutation({
    mutationFn: async ({ 
      studentId, 
      pbisEntryId, 
      prompt,
      dueDate 
    }: { 
      studentId: string; 
      pbisEntryId: string; 
      prompt: string;
      dueDate: string;
    }) => {
      const response_data = await fetch('/api/teacher/reflections/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify({ studentId, pbisEntryId, prompt, dueDate })
      });
      if (!response_data.ok) throw new Error('Failed to assign reflection');
      return response_data.json();
    },
    onSuccess: () => {
      toast({
        title: "Reflection Assigned",
        description: "The student has been notified of their reflection assignment.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/reflections'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return Clock;
      case 'submitted': return MessageSquare;
      case 'approved': return CheckCircle;
      case 'rejected': return AlertCircle;
      default: return FileText;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          {userType === 'teacher' ? 'Student Reflections' : 'My Reflections'}
        </h2>
        <Badge variant="outline">
          {reflections.length} reflection{reflections.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {userType === 'teacher' && (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
            <TabsTrigger value="submitted">Submitted</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="all">All Reflections</TabsTrigger>
          </TabsList>

          {['pending', 'submitted', 'approved', 'all'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              <ReflectionList 
                reflections={reflections.filter(r => 
                  tab === 'all' ? true : 
                  tab === 'pending' ? r.status === 'submitted' :
                  r.status === tab
                )}
                userType={userType}
                onSelectReflection={setSelectedReflection}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {userType === 'student' && (
        <ReflectionList 
          reflections={reflections}
          userType={userType}
          onSelectReflection={setSelectedReflection}
        />
      )}

      {/* Reflection Detail Modal */}
      <AnimatePresence>
        {selectedReflection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedReflection(null);
                setResponse("");
                setTeacherFeedback("");
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <ReflectionDetail
                reflection={selectedReflection}
                userType={userType}
                response={response}
                setResponse={setResponse}
                teacherFeedback={teacherFeedback}
                setTeacherFeedback={setTeacherFeedback}
                onSubmit={(response) => 
                  submitReflectionMutation.mutate({ 
                    reflectionId: selectedReflection.id, 
                    response 
                  })
                }
                onReview={(status, feedback) =>
                  reviewReflectionMutation.mutate({
                    reflectionId: selectedReflection.id,
                    status,
                    feedback
                  })
                }
                onClose={() => {
                  setSelectedReflection(null);
                  setResponse("");
                  setTeacherFeedback("");
                }}
                isSubmitting={submitReflectionMutation.isPending}
                isReviewing={reviewReflectionMutation.isPending}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReflectionList({ 
  reflections, 
  userType, 
  onSelectReflection 
}: {
  reflections: ReflectionWithDetails[];
  userType: 'teacher' | 'student';
  onSelectReflection: (reflection: ReflectionWithDetails) => void;
}) {
  if (reflections.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No reflections found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {reflections.map((reflection) => {
        const StatusIcon = getStatusIcon(reflection.status);
        const isOverdue = reflection.dueDate && new Date(reflection.dueDate) < new Date() && reflection.status === 'assigned';
        
        return (
          <motion.div
            key={reflection.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isOverdue ? 'border-red-300 bg-red-50' : ''
              }`}
              onClick={() => onSelectReflection(reflection)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className="w-5 h-5" />
                    <Badge className={getStatusColor(reflection.status)}>
                      {reflection.status}
                    </Badge>
                  </div>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      Overdue
                    </Badge>
                  )}
                </div>
                {userType === 'teacher' && reflection.studentName && (
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{reflection.studentName}</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700 line-clamp-2">
                  {reflection.prompt}
                </p>
                
                {reflection.pbisEntry && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    Related to: {reflection.pbisEntry.mustangTrait} - {reflection.pbisEntry.reason}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(reflection.assignedAt), 'MMM d')}</span>
                  </div>
                  {reflection.dueDate && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Due {format(new Date(reflection.dueDate), 'MMM d')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function ReflectionDetail({
  reflection,
  userType,
  response,
  setResponse,
  teacherFeedback,
  setTeacherFeedback,
  onSubmit,
  onReview,
  onClose,
  isSubmitting,
  isReviewing
}: {
  reflection: ReflectionWithDetails;
  userType: 'teacher' | 'student';
  response: string;
  setResponse: (value: string) => void;
  teacherFeedback: string;
  setTeacherFeedback: (value: string) => void;
  onSubmit: (response: string) => void;
  onReview: (status: 'approved' | 'rejected', feedback?: string) => void;
  onClose: () => void;
  isSubmitting: boolean;
  isReviewing: boolean;
}) {
  const StatusIcon = getStatusIcon(reflection.status);

  return (
    <div>
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center space-x-3">
          <StatusIcon className="w-6 h-6" />
          <div>
            <h3 className="text-lg font-semibold">Reflection Assignment</h3>
            <Badge className={getStatusColor(reflection.status)}>
              {reflection.status}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" onClick={onClose}>×</Button>
      </div>

      <div className="p-6 space-y-6">
        {/* Assignment Details */}
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Reflection Prompt:</h4>
            <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
              {reflection.prompt}
            </p>
          </div>

          {reflection.pbisEntry && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Related Incident:</h4>
              <div className="bg-red-50 p-4 rounded-lg">
                <p><strong>MUSTANG Trait:</strong> {reflection.pbisEntry.mustangTrait}</p>
                <p><strong>Category:</strong> {reflection.pbisEntry.category}</p>
                <p><strong>Reason:</strong> {reflection.pbisEntry.reason}</p>
                <p><strong>Points:</strong> {reflection.pbisEntry.points}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>Assigned:</strong> {format(new Date(reflection.assignedAt), 'MMM d, yyyy')}
            </div>
            {reflection.dueDate && (
              <div>
                <strong>Due:</strong> {format(new Date(reflection.dueDate), 'MMM d, yyyy')}
              </div>
            )}
          </div>
        </div>

        {/* Student Response Section */}
        {userType === 'student' && reflection.status === 'assigned' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Your Response:</h4>
            <Textarea
              placeholder="Take time to reflect on your actions and explain how you plan to improve your behavior..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="min-h-32"
            />
            <Button
              onClick={() => onSubmit(response)}
              disabled={!response.trim() || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Reflection'}
            </Button>
          </div>
        )}

        {/* Show student response if submitted */}
        {reflection.response && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Student Response:</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{reflection.response}</p>
              {reflection.submittedAt && (
                <p className="text-xs text-gray-500 mt-2">
                  Submitted: {format(new Date(reflection.submittedAt), 'MMM d, yyyy h:mm a')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Teacher Review Section */}
        {userType === 'teacher' && reflection.status === 'submitted' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Teacher Feedback (Optional):</h4>
            <Textarea
              placeholder="Provide feedback on the student's reflection..."
              value={teacherFeedback}
              onChange={(e) => setTeacherFeedback(e.target.value)}
              className="min-h-24"
            />
            <div className="flex space-x-2">
              <Button
                onClick={() => onReview('approved', teacherFeedback)}
                disabled={isReviewing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Approve & Send to Parent
              </Button>
              <Button
                onClick={() => onReview('rejected', teacherFeedback)}
                disabled={isReviewing}
                variant="outline"
                className="flex-1"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Reject & Return
              </Button>
            </div>
          </div>
        )}

        {/* Show teacher feedback if provided */}
        {reflection.teacherFeedback && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Teacher Feedback:</h4>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-700">{reflection.teacherFeedback}</p>
            </div>
          </div>
        )}

        {/* Approval status */}
        {reflection.status === 'approved' && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Reflection Approved</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              This reflection has been sent to the parent.
              {reflection.sentToParentAt && (
                <span className="ml-1">
                  (Sent: {format(new Date(reflection.sentToParentAt), 'MMM d, yyyy h:mm a')})
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}