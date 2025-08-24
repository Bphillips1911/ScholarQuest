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
import { MessageCircle, Send, User, Clock, CheckCircle, AlertCircle, UserCheck } from "lucide-react";
import type { Scholar, Parent, ParentTeacherMessage } from "@shared/schema";

interface MessageFormData {
  recipientType: 'parent' | 'admin';
  parentId: string;
  adminId: string;
  scholarId: string;
  subject: string;
  message: string;
  priority: string;
}

export default function TeacherMessages() {
  const [selectedScholar, setSelectedScholar] = useState<string>("");
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [messageForm, setMessageForm] = useState<MessageFormData>({
    recipientType: 'parent',
    parentId: "",
    adminId: "",
    scholarId: "",
    subject: "",
    message: "",
    priority: "normal"
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

  const { data: admins = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/administrators"],
    queryFn: async () => {
      const token = localStorage.getItem("teacherToken");
      const response = await fetch("/api/admin/administrators", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch administrators");
      return response.json();
    },
  });

  const { data: messages = [] } = useQuery<ParentTeacherMessage[]>({
    queryKey: ["/api/teacher/messages"],
    queryFn: async () => {
      const token = localStorage.getItem("teacherToken");
      const response = await fetch("/api/teacher/messages", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!teacherData.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: MessageFormData) => {
      console.log("🚀 FORM SUBMISSION: Current messageForm state:", JSON.stringify(messageForm, null, 2));
      console.log("🚀 FORM SUBMISSION: Submitted messageData:", JSON.stringify(messageData, null, 2));
      
      const token = localStorage.getItem("teacherToken");
      const requestBody = {
        recipientType: messageData.recipientType,
        parentId: messageData.recipientType === 'parent' ? messageData.parentId : null,
        adminId: messageData.recipientType === 'admin' ? messageData.adminId : null,
        scholarId: messageData.recipientType === 'parent' ? messageData.scholarId : null,
        subject: messageData.subject,
        message: messageData.message,
        priority: messageData.priority
      };
      
      console.log("🚀 FORM SUBMISSION: Final request body:", JSON.stringify(requestBody, null, 2));
      
      const response = await fetch("/api/teacher/send-message", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      const recipient = messageForm.recipientType === 'parent' ? 'parent' : 'administrator';
      toast({
        title: "Message Sent",
        description: `Your message has been sent successfully to the ${recipient}.`,
      });
      setMessageForm({ 
        recipientType: 'parent',
        parentId: "", 
        adminId: "",
        scholarId: "", 
        subject: "", 
        message: "",
        priority: "normal"
      });
      setShowForm(false);
      setSelectedScholar("");
      setSelectedAdmin("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/messages"] });
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
    console.log("TEACHER-MESSAGES: Selecting scholar", scholarId);
    setSelectedScholar(scholarId);
    const scholar = scholars.find(s => s.id === scholarId);
    console.log("TEACHER-MESSAGES: Found scholar:", scholar?.name);
    
    if (scholar) {
      // Find parent linked to this scholar
      const parent = parents.find(p => p.scholarIds?.includes(scholarId));
      console.log("TEACHER-MESSAGES: Searching for parent with scholarId", scholarId);
      console.log("TEACHER-MESSAGES: Available parents:", parents.map(p => ({ 
        name: `${p.firstName} ${p.lastName}`, 
        scholarIds: p.scholarIds || [] 
      })));
      console.log("TEACHER-MESSAGES: Found parent:", parent ? `${parent.firstName} ${parent.lastName}` : "NONE");
      
      if (parent) {
        setMessageForm(prev => ({
          ...prev,
          recipientType: 'parent',
          parentId: parent.id,
          adminId: "",
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

  const handleAdminSelect = (adminId: string) => {
    console.log("TEACHER-MESSAGES: Selecting admin", adminId);
    setSelectedAdmin(adminId);
    const admin = admins.find(a => a.id === adminId);
    console.log("TEACHER-MESSAGES: Found admin:", admin);
    
    if (admin) {
      setMessageForm(prev => ({
        ...prev,
        recipientType: 'admin',
        parentId: "",
        adminId: adminId,
        scholarId: "",
        subject: `Message from ${teacherData.name || 'Teacher'}`
      }));
      setShowForm(true);
    }
  };

  const handleReply = (originalMessage: any) => {
    console.log("🔥 REPLY BUTTON CLICKED!");
    console.log("TEACHER-MESSAGES: Replying to message", originalMessage);
    console.log("TEACHER-MESSAGES: Original message structure:", JSON.stringify(originalMessage, null, 2));
    setReplyingTo(originalMessage);
    
    // Check both camelCase and snake_case properties
    const senderType = originalMessage.senderType || originalMessage.sender_type;
    const adminId = originalMessage.adminId || originalMessage.admin_id;
    const parentId = originalMessage.parentId || originalMessage.parent_id;
    const scholarId = originalMessage.scholarId || originalMessage.scholar_id;
    
    console.log("TEACHER-MESSAGES: Detected sender type:", senderType);
    console.log("TEACHER-MESSAGES: Admin ID:", adminId, "Parent ID:", parentId);
    
    if (senderType === 'admin' && adminId) {
      // Reply to admin
      console.log("TEACHER-MESSAGES: Setting up reply to admin with ID:", adminId);
      const newForm = {
        recipientType: 'admin' as const,
        parentId: "",
        adminId: adminId,
        scholarId: scholarId || "",
        subject: `Re: ${originalMessage.subject}`,
        message: "",
        priority: "normal"
      };
      console.log("TEACHER-MESSAGES: Setting form to:", JSON.stringify(newForm, null, 2));
      setMessageForm(newForm);
    } else if (senderType === 'parent' && parentId) {
      // Reply to parent
      console.log("TEACHER-MESSAGES: Setting up reply to parent with ID:", parentId);
      const newForm = {
        recipientType: 'parent' as const,
        parentId: parentId,
        adminId: "",
        scholarId: scholarId || "",
        subject: `Re: ${originalMessage.subject}`,
        message: "",
        priority: "normal"
      };
      console.log("TEACHER-MESSAGES: Setting form to:", JSON.stringify(newForm, null, 2));
      setMessageForm(newForm);
    } else {
      console.error("TEACHER-MESSAGES: Could not determine reply recipient:", { senderType, adminId, parentId });
      toast({
        title: "Error",
        description: "Could not determine who to reply to",
        variant: "destructive",
      });
      return;
    }
    
    setShowForm(true);
  };

  const handleSendMessage = () => {
    console.log("📤 SEND MESSAGE: Called with messageForm:", JSON.stringify(messageForm, null, 2));
    console.log("📤 SEND MESSAGE: replyingTo:", replyingTo ? JSON.stringify(replyingTo, null, 2) : "null");
    
    if (!messageForm.message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }

    if (messageForm.message.length < 10) {
      toast({
        title: "Message Too Short",
        description: "Please enter a message with at least 10 characters.",
        variant: "destructive",
      });
      return;
    }

    console.log("📤 SEND MESSAGE: About to mutate with:", JSON.stringify(messageForm, null, 2));
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

  const getAdminName = (adminId: string) => {
    const admin = admins.find(a => a.id === adminId);
    return admin ? `${admin.firstName} ${admin.lastName}` : "Administrator";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="page-title">
          Parent Communication
        </h1>
        <p className="text-gray-600">
          Send messages to parents about student progress and administrators about school matters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Message Composition */}
        <Card data-testid="message-composition-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="mr-2 h-5 w-5 text-blue-600" />
              Compose New Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipient-type">Message Recipient</Label>
                <Select 
                  value={messageForm.recipientType} 
                  onValueChange={(value: 'parent' | 'admin') => {
                    setMessageForm(prev => ({
                      ...prev, 
                      recipientType: value,
                      parentId: "",
                      adminId: "",
                      scholarId: "",
                      subject: ""
                    }));
                    setShowForm(false);
                    setSelectedScholar("");
                    setSelectedAdmin("");
                  }}
                >
                  <SelectTrigger data-testid="select-recipient-type">
                    <SelectValue placeholder="Choose recipient type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Parent (about student)
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center">
                        <UserCheck className="mr-2 h-4 w-4" />
                        Administrator
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {messageForm.recipientType === 'parent' && (
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
              )}

              {messageForm.recipientType === 'admin' && (
                <div>
                  <Label htmlFor="admin-select">Select Administrator</Label>
                  <Select value={selectedAdmin} onValueChange={handleAdminSelect}>
                    <SelectTrigger data-testid="select-admin">
                      <SelectValue placeholder="Choose an administrator..." />
                    </SelectTrigger>
                    <SelectContent>
                      {admins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.firstName} {admin.lastName} - {admin.role || 'Administrator'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                      placeholder="Write your message to the parent..."
                      rows={6}
                      className="resize-none"
                      data-testid="textarea-message"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-sm ${messageForm.message.length >= 10 ? 'text-green-600' : 'text-gray-500'}`}>
                        {messageForm.message.length} characters
                      </span>
                      {messageForm.message.length >= 10 && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-900 mb-2">Message Details</h4>
                    {messageForm.recipientType === 'parent' ? (
                      <>
                        <p className="text-sm text-gray-600">
                          <strong>To:</strong> {getParentName(messageForm.parentId)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>About:</strong> {getScholarName(messageForm.scholarId)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600">
                        <strong>To:</strong> {getAdminName(messageForm.adminId)}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      <strong>Priority:</strong> {messageForm.priority}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={messageForm.priority} 
                      onValueChange={(value) => setMessageForm(prev => ({...prev, priority: value}))}
                    >
                      <SelectTrigger data-testid="select-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="normal">Normal Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendMessageMutation.isPending || messageForm.message.length < 10}
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
                        setSelectedAdmin("");
                        setMessageForm({ 
                          recipientType: 'parent',
                          parentId: "", 
                          adminId: "",
                          scholarId: "", 
                          subject: "", 
                          message: "",
                          priority: "normal"
                        });
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
                  <p>
                    {messageForm.recipientType === 'parent' 
                      ? "Select a student to send a message to their parent"
                      : "Select an administrator to send a message"
                    }
                  </p>
                  <p className="text-sm mt-2">
                    All messages require a minimum of 10 characters
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
                          {message.parentId ? (
                            <>To: {getParentName(message.parentId)} • About: {getScholarName(message.scholarId)}</>
                          ) : (
                            <>To: {getAdminName((message as any).adminId || (message as any).admin_id)}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Today'}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{message.message}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={(message.senderType || message.sender_type) === 'teacher' ? 'default' : 'secondary'}>
                          {(message.senderType || message.sender_type) === 'teacher' ? 'Sent by you' : 
                           (message.senderType || message.sender_type) === 'admin' ? `Admin: ${(message as any).sender_name || 'Administrator'}` :
                           `Parent: ${(message as any).sender_name || 'Parent reply'}`}
                        </Badge>
                        {!message.isRead && (
                          <Badge variant="outline" className="text-blue-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Unread
                          </Badge>
                        )}
                      </div>
                      {(message.senderType || message.sender_type) !== 'teacher' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("🔥 BUTTON CLICK EVENT");
                            handleReply(message);
                          }}
                          className="ml-auto"
                          data-testid={`reply-button-${message.id}`}
                        >
                          Reply
                        </Button>
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