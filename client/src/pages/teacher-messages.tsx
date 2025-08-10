import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { MessageCircle, Send, User, Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { Scholar, Parent, ParentTeacherMessage } from "@shared/schema";

interface MessageFormData {
  parentId: string;
  scholarId: string;
  subject: string;
  message: string;
}

export default function TeacherMessages() {
  const [selectedScholar, setSelectedScholar] = useState<string>("");
  const [messageForm, setMessageForm] = useState<MessageFormData>({
    parentId: "",
    scholarId: "",
    subject: "",
    message: ""
  });
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  // Get teacher data from localStorage
  const teacherData = JSON.parse(localStorage.getItem("teacherData") || "{}");

  const { data: scholars = [] } = useQuery<Scholar[]>({
    queryKey: ["/api/scholars"],
    queryFn: async () => {
      const response = await fetch("/api/scholars");
      if (!response.ok) throw new Error("Failed to fetch scholars");
      return response.json();
    },
  });

  const { data: parents = [] } = useQuery<Parent[]>({
    queryKey: ["/api/parents"],
    queryFn: async () => {
      const response = await fetch("/api/parents");
      if (!response.ok) throw new Error("Failed to fetch parents");
      return response.json();
    },
  });

  const { data: messages = [] } = useQuery<ParentTeacherMessage[]>({
    queryKey: ["/api/parent-teacher-messages/teacher", teacherData.id],
    queryFn: async () => {
      const response = await fetch(`/api/parent-teacher-messages/teacher/${teacherData.id}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!teacherData.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await fetch("/api/parent-teacher-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...messageData,
          teacherId: teacherData.id,
          senderType: "teacher"
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent and the parent has been notified by email.",
      });
      setMessageForm({ parentId: "", scholarId: "", subject: "", message: "" });
      setShowForm(false);
      setSelectedScholar("");
      queryClient.invalidateQueries({ queryKey: ["/api/parent-teacher-messages/teacher"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleScholarSelect = (scholarId: string) => {
    setSelectedScholar(scholarId);
    const scholar = scholars.find(s => s.id === scholarId);
    if (scholar) {
      // Find parent linked to this scholar
      const parent = parents.find(p => p.scholarIds?.includes(scholarId));
      if (parent) {
        setMessageForm(prev => ({
          ...prev,
          parentId: parent.id,
          scholarId: scholarId,
          subject: `Update about ${scholar.name}`
        }));
        setShowForm(true);
      } else {
        toast({
          title: "No Parent Found",
          description: "This student doesn't have a parent account linked yet.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSendMessage = () => {
    if (!messageForm.message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }

    if (messageForm.message.length < 150) {
      toast({
        title: "Message Too Short",
        description: "Teacher messages must be at least 150 characters long to ensure detailed communication.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate(messageForm);
  };

  const getScholarName = (scholarId: string) => {
    const scholar = scholars.find(s => s.id === scholarId);
    return scholar?.name || "Unknown Student";
  };

  const getParentName = (parentId: string) => {
    const parent = parents.find(p => p.id === parentId);
    return parent ? `${parent.firstName} ${parent.lastName}` : "Unknown Parent";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="page-title">
          Parent Communication
        </h1>
        <p className="text-gray-600">
          Send detailed messages to parents about student progress and behavior.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Message Composition */}
        <Card data-testid="message-composition-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="mr-2 h-5 w-5 text-blue-600" />
              Send Message to Parent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="scholar-select">Select Student</Label>
                <Select value={selectedScholar} onValueChange={handleScholarSelect}>
                  <SelectTrigger data-testid="select-scholar">
                    <SelectValue placeholder="Choose a student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {scholars.map((scholar) => (
                      <SelectItem key={scholar.id} value={scholar.id}>
                        {scholar.name} (Grade {scholar.grade}) - {scholar.username || scholar.studentId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showForm && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={messageForm.subject}
                      onChange={(e) => setMessageForm(prev => ({...prev, subject: e.target.value}))}
                      placeholder="Message subject..."
                      data-testid="input-subject"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={messageForm.message}
                      onChange={(e) => setMessageForm(prev => ({...prev, message: e.target.value}))}
                      placeholder="Write a detailed message to the parent (minimum 150 characters)..."
                      rows={6}
                      className="resize-none"
                      data-testid="textarea-message"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-sm ${messageForm.message.length >= 150 ? 'text-green-600' : 'text-red-600'}`}>
                        {messageForm.message.length}/150 characters minimum
                      </span>
                      {messageForm.message.length >= 150 && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-900 mb-2">Message Details</h4>
                    <p className="text-sm text-gray-600">
                      <strong>To:</strong> {getParentName(messageForm.parentId)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>About:</strong> {getScholarName(messageForm.scholarId)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendMessageMutation.isPending || messageForm.message.length < 150}
                      className="flex-1"
                      data-testid="button-send-message"
                    >
                      {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setSelectedScholar("");
                        setMessageForm({ parentId: "", scholarId: "", subject: "", message: "" });
                      }}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {!showForm && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>Select a student to send a message to their parent</p>
                  <p className="text-sm mt-2">
                    All messages require a minimum of 150 characters for detailed communication
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message History */}
        <Card data-testid="message-history-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="mr-2 h-5 w-5 text-green-600" />
              Message History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className="p-4 bg-gray-50 rounded-lg border"
                    data-testid={`message-${message.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{message.subject}</h4>
                        <p className="text-sm text-gray-600">
                          To: {getParentName(message.parentId)} • About: {getScholarName(message.scholarId)}
                        </p>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {message.createdAt ? new Date(message.createdAt).toLocaleDateString() : 'Today'}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{message.message}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={message.senderType === 'teacher' ? 'default' : 'secondary'}>
                        {message.senderType === 'teacher' ? 'Sent by you' : 'Parent reply'}
                      </Badge>
                      {!message.isRead && (
                        <Badge variant="outline" className="text-blue-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Unread
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No messages sent yet</p>
                  <p className="text-sm">Your message history will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}