import { useState } from "react";
import { X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Reflection {
  id: string;
  prompt: string;
  response: string | null;
  status: 'assigned' | 'submitted' | 'approved' | 'rejected';
  teacherFeedback: string | null;
  dueDate: string | null;
  assignedAt: string;
  submittedAt: string | null;
}

interface ReflectionModalProps {
  reflection: Reflection;
  isOpen: boolean;
  onClose: () => void;
  isStudent?: boolean;
}

export function ReflectionModal({ reflection, isOpen, onClose, isStudent = false }: ReflectionModalProps) {
  const [response, setResponse] = useState(reflection.response || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitReflection = useMutation({
    mutationFn: async () => {
      if (response.length < 100) {
        throw new Error("Response must be at least 100 characters");
      }
      return apiRequest("POST", `/api/student/reflections/${reflection.id}/submit`, { response });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Reflection submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/student/reflections"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit reflection",
        variant: "destructive",
      });
    },
  });

  if (!isOpen) return null;

  const canSubmit = isStudent && reflection.status === 'assigned' && response.length >= 100;
  const isSubmitted = reflection.status !== 'assigned';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Behavioral Reflection
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            data-testid="button-close-reflection"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Status:</span>
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
              data-testid={`status-${reflection.status}`}
            >
              {reflection.status.charAt(0).toUpperCase() + reflection.status.slice(1)}
            </span>
          </div>

          {/* Due Date */}
          {reflection.dueDate && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Due:</span> {new Date(reflection.dueDate).toLocaleDateString()}
            </div>
          )}

          {/* Prompt */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reflection Prompt:
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-gray-900 dark:text-gray-100">
              {reflection.prompt}
            </div>
          </div>

          {/* Response */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Response:
              </h3>
              {isStudent && !isSubmitted && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {response.length}/100 characters minimum
                </span>
              )}
            </div>
            
            {isStudent && !isSubmitted ? (
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Write your reflection here... (minimum 100 characters)"
                className="min-h-[120px] resize-none"
                data-testid="textarea-reflection-response"
              />
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-gray-900 dark:text-gray-100 min-h-[120px]">
                {reflection.response || "No response submitted yet"}
              </div>
            )}
          </div>

          {/* Teacher Feedback */}
          {reflection.teacherFeedback && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teacher Feedback:
              </h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-gray-900 dark:text-gray-100">
                {reflection.teacherFeedback}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div>Assigned: {new Date(reflection.assignedAt).toLocaleString()}</div>
            {reflection.submittedAt && (
              <div>Submitted: {new Date(reflection.submittedAt).toLocaleString()}</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel-reflection"
          >
            {isStudent && !isSubmitted ? 'Cancel' : 'Close'}
          </Button>
          
          {canSubmit && (
            <Button
              onClick={() => submitReflection.mutate()}
              disabled={submitReflection.isPending || response.length < 100}
              data-testid="button-submit-reflection"
            >
              {submitReflection.isPending ? 'Submitting...' : 'Submit Reflection'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}