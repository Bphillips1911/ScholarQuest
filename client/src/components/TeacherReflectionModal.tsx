import { useState } from "react";
import { X, Clock, CheckCircle, XCircle, Send } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Reflection {
  id: string;
  scholarId: string;
  prompt: string;
  response: string | null;
  status: 'assigned' | 'submitted' | 'approved' | 'rejected';
  teacherFeedback: string | null;
  dueDate: string | null;
  assignedAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
}

interface TeacherReflectionModalProps {
  reflection: Reflection;
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
}

export function TeacherReflectionModal({ 
  reflection, 
  isOpen, 
  onClose, 
  studentName = "Student" 
}: TeacherReflectionModalProps) {
  const [feedback, setFeedback] = useState(reflection.teacherFeedback || "");
  const [rejectionReason, setRejectionReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [showRejectOptions, setShowRejectOptions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const predefinedReasons = [
    "Insufficient detail",
    "Off-topic response", 
    "Inappropriate language",
    "Does not show understanding",
    "Needs more reflection on impact",
    "Response too brief",
    "Missing personal accountability",
    "Custom reason"
  ];

  const reviewReflection = useMutation({
    mutationFn: async ({ status, feedbackText, rejectionReason, customReason }: { 
      status: 'approved' | 'rejected'; 
      feedbackText?: string;
      rejectionReason?: string;
      customReason?: string;
    }) => {
      return apiRequest("POST", `/api/teacher/reflections/${reflection.id}/review`, { 
        status, 
        feedback: feedbackText,
        rejectionReason,
        customReason 
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: `Reflection ${variables.status} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/reflections"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to review reflection",
        variant: "destructive",
      });
    },
  });

  const sendToParent = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/teacher/reflections/${reflection.id}/send-to-parent`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Reflection sent to parent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/reflections"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reflection to parent",
        variant: "destructive",
      });
    },
  });

  if (!isOpen) return null;

  const canReview = reflection.status === 'submitted';
  const isReviewed = ['approved', 'rejected'].includes(reflection.status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Review Reflection
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Student: {studentName}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            data-testid="button-close-teacher-reflection"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Timeline */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2">
              {reflection.status === 'assigned' && <Clock className="h-4 w-4 text-yellow-600" />}
              {reflection.status === 'submitted' && <Clock className="h-4 w-4 text-blue-600" />}
              {reflection.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {reflection.status === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  reflection.status === 'assigned' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : reflection.status === 'submitted'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : reflection.status === 'approved'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
                data-testid={`teacher-status-${reflection.status}`}
              >
                {reflection.status.charAt(0).toUpperCase() + reflection.status.slice(1)}
              </span>
            </div>
            
            {reflection.dueDate && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Due: {new Date(reflection.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Prompt */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reflection Prompt:
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-gray-900 dark:text-gray-100">
              {reflection.prompt}
            </div>
          </div>

          {/* Student Response */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Student Response:
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-gray-900 dark:text-gray-100 min-h-[120px]">
              {reflection.response || "No response submitted yet"}
              {reflection.response && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {reflection.response.length} characters
                </div>
              )}
            </div>
          </div>

          {/* Teacher Feedback */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Teacher Feedback:
            </h3>
            
            {canReview ? (
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback on the student's reflection..."
                className="min-h-[100px] resize-none"
                data-testid="textarea-teacher-feedback"
              />
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-gray-900 dark:text-gray-100 min-h-[100px]">
                {reflection.teacherFeedback || "No feedback provided yet"}
              </div>
            )}
          </div>

          {/* Rejection Reason Selection */}
          {canReview && showRejectOptions && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Rejection
                </label>
                <Select value={rejectionReason} onValueChange={setRejectionReason}>
                  <SelectTrigger data-testid="select-rejection-reason">
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {rejectionReason === "Custom reason" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Rejection Reason
                  </label>
                  <Textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Please specify the reason for rejection..."
                    className="min-h-[80px] resize-none"
                    data-testid="textarea-custom-reason"
                  />
                </div>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 border-t pt-4">
            <div>Assigned: {new Date(reflection.assignedAt).toLocaleString()}</div>
            {reflection.submittedAt && (
              <div>Submitted: {new Date(reflection.submittedAt).toLocaleString()}</div>
            )}
            {reflection.approvedAt && (
              <div>Reviewed: {new Date(reflection.approvedAt).toLocaleString()}</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            {reflection.status === 'approved' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendToParent.mutate()}
                disabled={sendToParent.isPending}
                data-testid="button-send-to-parent"
              >
                <Send className="h-4 w-4 mr-1" />
                {sendToParent.isPending ? 'Sending...' : 'Send to Parent'}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-teacher-reflection"
            >
              Close
            </Button>
            
            {canReview && !showRejectOptions && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectOptions(true)}
                  disabled={reviewReflection.isPending}
                  data-testid="button-reject-reflection"
                >
                  Reject
                </Button>
                <Button
                  onClick={() => reviewReflection.mutate({ status: 'approved', feedbackText: feedback })}
                  disabled={reviewReflection.isPending}
                  data-testid="button-approve-reflection"
                >
                  {reviewReflection.isPending ? 'Processing...' : 'Approve'}
                </Button>
              </>
            )}
            
            {canReview && showRejectOptions && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectOptions(false);
                    setRejectionReason("");
                    setCustomReason("");
                  }}
                  data-testid="button-cancel-reject"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!rejectionReason && !customReason) {
                      toast({
                        title: "Error",
                        description: "Please select a rejection reason",
                        variant: "destructive",
                      });
                      return;
                    }
                    reviewReflection.mutate({ 
                      status: 'rejected', 
                      feedbackText: feedback,
                      rejectionReason: rejectionReason === "Custom reason" ? undefined : rejectionReason,
                      customReason: rejectionReason === "Custom reason" ? customReason : undefined
                    });
                  }}
                  disabled={reviewReflection.isPending}
                  data-testid="button-confirm-reject"
                >
                  {reviewReflection.isPending ? 'Processing...' : 'Confirm Rejection'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}