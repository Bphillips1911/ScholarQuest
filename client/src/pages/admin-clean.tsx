import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LogOut, User, Shield, Users, GraduationCap, Award, UserPlus, Eye, Download, QrCode, Settings, FileText, Calendar, Key, Clock, CheckCircle, AlertTriangle, MessageSquare, Send } from "lucide-react";
import { AdminTeacherViewer } from "@/components/AdminTeacherViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import type { House, Scholar, InsertScholar, TeacherAuth } from "@shared/schema";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function AdminClean() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [newStudentHouse, setNewStudentHouse] = useState("");
  const { toast } = useToast();

  // Messaging states
  const [messageRecipientType, setMessageRecipientType] = useState("");
  const [messageTeacherId, setMessageTeacherId] = useState("");
  const [messageParentId, setMessageParentId] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [messagePriority, setMessagePriority] = useState("normal");
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const data = localStorage.getItem("adminData");
    
    if (token && data) {
      try {
        const parsedData = JSON.parse(data);
        setAdminData(parsedData);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        setLocation("/admin-login");
      }
    } else {
      setLocation("/admin-login");
    }
  }, [setLocation]);

  // Data queries - only run when authenticated
  const { data: houses } = useQuery<House[]>({
    queryKey: ["/api/houses"],
    enabled: isAuthenticated,
  });

  const { data: allScholars } = useQuery<Scholar[]>({
    queryKey: ["/api/scholars"],
    enabled: isAuthenticated,
  });

  // Pending teachers query
  const { data: pendingTeachers } = useQuery<TeacherAuth[]>({
    queryKey: ["/api/admin/teachers/pending"],
    enabled: isAuthenticated,
  });

  // Fetch teachers for messaging
  const { data: teachers = [] } = useQuery({
    queryKey: ["/api/admin/teachers"],
    enabled: isAuthenticated && activeTab === "messaging" && !!localStorage.getItem("adminToken")
  });

  // Fetch parents for messaging  
  const { data: parents = [] } = useQuery({
    queryKey: ["/api/admin/parents"],
    enabled: isAuthenticated && activeTab === "messaging" && !!localStorage.getItem("adminToken")
  });

  // Fetch sent messages
  const { data: sentMessages = [] } = useQuery({
    queryKey: ["/api/admin/messages"],
    enabled: isAuthenticated && activeTab === "messaging" && !!localStorage.getItem("adminToken")
  });

  // Add scholar mutation with auto-generated username
  const addScholarMutation = useMutation({
    mutationFn: async (data: InsertScholar) => {
      const response = await apiRequest("POST", "/api/admin/scholars", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Student Added Successfully",
        description: `Username auto-generated: ${data.generatedUsername}`,
      });
      setNewStudentName("");
      setNewStudentId("");
      setNewStudentHouse("");
      queryClient.invalidateQueries({ queryKey: ["/api/houses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scholars"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add student. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Teacher approval mutation
  const approveTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      const response = await apiRequest("POST", `/api/admin/teachers/${teacherId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Teacher Approved",
        description: "Teacher account has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers/pending"] });
    },
    onError: () => {
      toast({
        title: "Approval Failed",
        description: "Failed to approve teacher. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await apiRequest("POST", "/api/admin/send-message", messageData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
      // Reset form
      setMessageRecipientType("");
      setMessageTeacherId("");
      setMessageParentId("");
      setMessageSubject("");
      setMessageContent("");
      setMessagePriority("normal");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Export functions
  const handleExportData = async (format: 'csv' | 'excel') => {
    try {
      const response = await fetch(`/api/admin/export/scholars/${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `bhsa-scholars-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `Student data exported as ${format.toUpperCase()} file.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    setIsAuthenticated(false);
    setAdminData(null);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    setLocation("/admin-login");
  };

  const handleAddScholar = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStudentName || !newStudentId) {
      toast({
        title: "Missing Information",
        description: "Please fill in student name and ID.",
        variant: "destructive",
      });
      return;
    }

    // Auto-assign to house with least members if no house selected
    let houseId = newStudentHouse;
    if ((!houseId || houseId === "auto") && houses) {
      const leastPopulatedHouse = houses.reduce((min, house) => 
        house.memberCount < min.memberCount ? house : min
      );
      houseId = leastPopulatedHouse.id;
    }

    addScholarMutation.mutate({
      name: newStudentName,
      studentId: newStudentId,
      houseId,
      grade: 6, // Default grade
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageRecipientType || !messageSubject || !messageContent) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (messageRecipientType === "teacher" && !messageTeacherId) {
      toast({
        title: "Teacher Required",
        description: "Please select a teacher to send the message to.",
        variant: "destructive",
      });
      return;
    }

    if (messageRecipientType === "parent" && !messageParentId) {
      toast({
        title: "Parent Required",
        description: "Please select a parent to send the message to.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      recipientType: messageRecipientType,
      teacherId: messageRecipientType === "teacher" ? messageTeacherId : undefined,
      parentId: messageRecipientType === "parent" ? messageParentId : undefined,
      subject: messageSubject,
      message: messageContent,
      priority: messagePriority,
    });
  };

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalStudents = allScholars?.length || 0;
  const totalPoints = allScholars?.reduce((sum, scholar) => 
    sum + scholar.academicPoints + scholar.attendancePoints + scholar.behaviorPoints, 0
  ) || 0;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img 
                src={schoolLogoPath} 
                alt="Bush Hills STEAM Academy" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  BHSA Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome, {adminData?.firstName} {adminData?.lastName} ({adminData?.title})
                </p>
                {/* Debug info */}
                <p className="text-xs text-blue-600">Active Tab: {activeTab}</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="students">Student Information</TabsTrigger>
            <TabsTrigger value="teacher-viewer">
              <Eye className="h-4 w-4 mr-2" />
              Teacher Viewer
            </TabsTrigger>
            <TabsTrigger value="messaging">Admin Messaging</TabsTrigger>
            <TabsTrigger value="exports">Data Export</TabsTrigger>
            <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Statistics Cards */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                      <p className="text-gray-600">Total Students</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <GraduationCap className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{houses?.length || 0}</p>
                      <p className="text-gray-600">Houses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Award className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
                      <p className="text-gray-600">Total Points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Shield className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">Active</p>
                      <p className="text-gray-600">System Status</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Houses Overview */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Houses Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {houses?.map((house) => (
                    <div key={house.id} className="text-center p-4 border rounded-lg">
                      <div 
                        className="w-12 h-12 rounded-full mx-auto mb-2"
                        style={{ backgroundColor: house.color }}
                      ></div>
                      <h3 className="font-semibold">{house.name.replace("House of ", "")}</h3>
                      <p className="text-2xl font-bold text-blue-600">{house.academicPoints + house.attendancePoints + house.behaviorPoints}</p>
                      <p className="text-sm text-gray-600">points</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Always Show Teacher Approval Section for Testing */}
            <Card className="border border-amber-200 bg-amber-50 mb-8">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-amber-900 flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Teacher Registration Approvals
                </CardTitle>
                <CardDescription>
                  Review and approve teacher registration requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    <p>Debug Info:</p>
                    <p>• Authenticated: {isAuthenticated ? 'YES' : 'NO'}</p>
                    <p>• Pending Teachers: {pendingTeachers?.length || 0}</p>
                    <p>• Data: {JSON.stringify(pendingTeachers)}</p>
                  </div>
                  
                  {pendingTeachers && pendingTeachers.length > 0 ? (
                    pendingTeachers.map((teacher) => (
                      <div 
                        key={teacher.id} 
                        className="flex items-center justify-between p-4 bg-white rounded-lg border"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {teacher.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {teacher.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            {teacher.gradeRole} • {teacher.subject}
                          </p>
                          <p className="text-xs text-gray-400">
                            Applied: {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <Button
                          onClick={() => approveTeacherMutation.mutate(teacher.id)}
                          disabled={approveTeacherMutation.isPending}
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {approveTeacherMutation.isPending ? "Approving..." : "Approve"}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                      <p>No pending teacher registrations</p>
                      <p className="text-sm">Teachers can register at /teacher-signup</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Teacher Approval Section */}
            {pendingTeachers && pendingTeachers.length > 0 && (
              <Card className="border border-amber-200 bg-amber-50 mb-8">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-amber-900 flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Pending Teacher Approvals ({pendingTeachers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingTeachers.map((teacher) => (
                      <div 
                        key={teacher.id} 
                        className="flex items-center justify-between p-4 bg-white rounded-lg border"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {teacher.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {teacher.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            {teacher.gradeRole} • {teacher.subject}
                          </p>
                          <p className="text-xs text-gray-400">
                            Applied: {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <Button
                          onClick={() => approveTeacherMutation.mutate(teacher.id)}
                          disabled={approveTeacherMutation.isPending}
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {approveTeacherMutation.isPending ? "Approving..." : "Approve"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Teacher Viewer Tab */}
          <TabsContent value="teacher-viewer" className="mt-6">
            <AdminTeacherViewer />
          </TabsContent>

          <TabsContent value="students" className="mt-6">
            <div className="space-y-6">
              {/* Student Portal Overview */}
              <Card className="border border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-blue-900 flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Student Portal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {allScholars?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Students</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {allScholars?.filter(s => s.username).length || 0}
                      </div>
                      <div className="text-sm text-gray-600">With Login Credentials</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {allScholars?.filter(s => s.needsPasswordReset).length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Password Resets Needed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Student Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <Eye className="mr-2 h-5 w-5" />
                    Detailed Student Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allScholars && allScholars.length > 0 ? (
                    <div className="space-y-4">
                      {allScholars.map((scholar) => {
                        const house = houses?.find(h => h.id === scholar.houseId);
                        const totalPoints = scholar.academicPoints + scholar.attendancePoints + scholar.behaviorPoints;
                        const houseColor = house?.color || "#3B82F6";
                        
                        return (
                          <div key={scholar.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-4 h-4 rounded-full" 
                                  style={{ backgroundColor: houseColor }}
                                ></div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{scholar.name}</h4>
                                  <p className="text-sm text-gray-600">ID: {scholar.studentId} • Grade: {scholar.grade}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <Badge variant={scholar.username ? "default" : "secondary"}>
                                  {scholar.username ? (
                                    <div className="flex items-center">
                                      <Key className="mr-1 h-3 w-3" />
                                      Has Login
                                    </div>
                                  ) : (
                                    "No Login"
                                  )}
                                </Badge>
                                {scholar.needsPasswordReset && (
                                  <Badge variant="destructive">Reset Needed</Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">House:</span>
                                <div className="font-medium">{house?.name?.replace("House of ", "") || "Unassigned"}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Total Points:</span>
                                <div className="font-medium text-blue-600">{totalPoints}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Academic:</span>
                                <div className="font-medium text-green-600">{scholar.academicPoints}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Behavior:</span>
                                <div className="font-medium text-purple-600">{scholar.behaviorPoints}</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                              <div>
                                <span className="text-gray-600">Attendance Points:</span>
                                <div className="font-medium text-orange-600">{scholar.attendancePoints}</div>
                              </div>
                              {scholar.username && (
                                <div>
                                  <span className="text-gray-600">Username:</span>
                                  <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{scholar.username}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">No students found in the system.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="messaging" className="mt-6">
            <div className="space-y-6">
              {/* Send Message Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Send className="mr-2 h-5 w-5" />
                    Send Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendMessage} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Recipient Type */}
                      <div>
                        <Label htmlFor="recipient-type">Send To</Label>
                        <Select value={messageRecipientType} onValueChange={setMessageRecipientType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select recipient type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Teacher Selection */}
                      {messageRecipientType === "teacher" && (
                        <div>
                          <Label htmlFor="teacher-select">Select Teacher</Label>
                          <Select value={messageTeacherId} onValueChange={setMessageTeacherId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose teacher" />
                            </SelectTrigger>
                            <SelectContent>
                              {teachers?.map((teacher: any) => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.name} ({teacher.gradeRole || teacher.gradeLevel})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Parent Selection */}
                      {messageRecipientType === "parent" && (
                        <div>
                          <Label htmlFor="parent-select">Select Parent</Label>
                          <Select value={messageParentId} onValueChange={setMessageParentId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose parent" />
                            </SelectTrigger>
                            <SelectContent>
                              {parents?.map((parent: any) => (
                                <SelectItem key={parent.id} value={parent.id}>
                                  {parent.firstName} {parent.lastName} ({parent.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Priority */}
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={messagePriority} onValueChange={setMessagePriority}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={messageSubject}
                        onChange={(e) => setMessageSubject(e.target.value)}
                        placeholder="Enter message subject"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <textarea
                        id="message"
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Enter your message here..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={sendMessageMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Message History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Sent Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sentMessages?.length > 0 ? (
                      sentMessages.map((message: any, index: number) => (
                        <div key={message.id || index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{message.subject}</h4>
                              <p className="text-sm text-gray-600">
                                To: {message.recipientType === "teacher" ? "Teacher" : "Parent"}
                                {message.teacherName && ` - ${message.teacherName}`}
                                {message.parentName && ` - ${message.parentName}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={
                                  message.priority === "urgent" ? "destructive" :
                                  message.priority === "high" ? "secondary" :
                                  "outline"
                                }
                              >
                                {message.priority}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(message.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm">{message.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        No messages sent yet.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="exports" className="mt-6">
            <div className="space-y-6">
              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Download className="mr-2 h-5 w-5" />
                    Data Export Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Student Data Export</h3>
                      <p className="text-sm text-gray-600">
                        Export comprehensive student information including points, house assignments, and login credentials.
                      </p>
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handleExportData('csv')}
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Export CSV
                        </Button>
                        <Button 
                          onClick={() => handleExportData('excel')}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Export Excel
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Monthly PBIS Reports</h3>
                      <p className="text-sm text-gray-600">
                        Generate monthly reports for individual students or house-wide analytics.
                      </p>
                      <Button 
                        onClick={() => setLocation("/admin-reports")}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Calendar className="h-4 w-4" />
                        Monthly Reports
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quick-actions" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Student QR Codes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <QrCode className="mr-2 h-5 w-5" />
                    Student QR Codes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">Generate QR codes for student login information</p>
                  <Button 
                    onClick={() => setLocation("/admin-qr")}
                    className="w-full"
                  >
                    Generate QR Codes
                  </Button>
                </CardContent>
              </Card>

              {/* House Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="mr-2 h-5 w-5" />
                    House Sorting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">Manage house assignments and balance distributions</p>
                  <Button 
                    onClick={() => setLocation("/admin-sorting")}
                    className="w-full"
                  >
                    House Sorting
                  </Button>
                </CardContent>
              </Card>

              {/* PBIS Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="mr-2 h-5 w-5" />
                    PBIS Awards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">Review and manage PBIS point awards</p>
                  <Button 
                    onClick={() => setLocation("/admin-pbis")}
                    className="w-full"
                  >
                    PBIS Management
                  </Button>
                </CardContent>
              </Card>

              {/* System Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Admin Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">Configure system settings and email notifications</p>
                  <Button 
                    onClick={() => setLocation("/admin-settings")}
                    className="w-full"
                  >
                    Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Add Student (moved here) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Add New Student
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    ✨ Usernames are automatically generated from student name and ID
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddScholar} className="space-y-4">
                    <div>
                      <Label htmlFor="student-name">Student Name</Label>
                      <Input
                        id="student-name"
                        type="text"
                        placeholder="Enter full student name"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="student-id">Student ID</Label>
                      <Input
                        id="student-id"
                        type="text"
                        placeholder="e.g., BH7025"
                        value={newStudentId}
                        onChange={(e) => setNewStudentId(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="student-house">Assign to House</Label>
                      <Select value={newStudentHouse} onValueChange={setNewStudentHouse}>
                        <SelectTrigger>
                          <SelectValue placeholder="Auto-assign" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto-assign</SelectItem>
                          {houses?.map((house) => (
                            <SelectItem key={house.id} value={house.id}>
                              {house.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={addScholarMutation.isPending}
                      >
                        {addScholarMutation.isPending ? "Adding Student..." : "Add Student (Auto-Generate Username)"}
                      </Button>
                      <p className="text-xs text-gray-500">
                        System will create a unique username like "johsmi123" from John Smith + Student ID
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>


    </div>
  );
}