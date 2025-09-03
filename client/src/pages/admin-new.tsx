import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GameModal } from "@/components/games/GameModal";
import { ReflectionLogs } from "@/components/admin/ReflectionLogs";
import { Download, RefreshCw, UserPlus, Plus, CheckCircle, Clock, Users, GraduationCap, Award, LogOut, User, MessageSquare, Send, Reply, Camera, Image, Palette, Eye, Mail, TestTube } from "lucide-react";
import { AdminTeacherViewer } from "@/components/AdminTeacherViewer";
import { useLocation } from "wouter";
import type { House, Scholar, TeacherAuth } from "@shared/schema";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function AdminNew() {
  const [activeTab, setActiveTab] = useState("teachers");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if admin is logged in
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  
  // Message form state
  const [messageForm, setMessageForm] = useState({
    subject: "",
    message: "",
    recipientType: ""
  });

  // Photo upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [photoDescription, setPhotoDescription] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'normal'>('normal');
  
  // Game modal state
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [showGameModal, setShowGameModal] = useState(false);

  useEffect(() => {
    console.log("AdminNew component mounted");
    const token = localStorage.getItem("adminToken");
    const data = localStorage.getItem("adminData");
    const savedTheme = localStorage.getItem("adminTheme") as 'light' | 'dark' | 'normal' || 'normal';
    
    setCurrentTheme(savedTheme);
    
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

  // Theme toggle function
  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'normal')[] = ['normal', 'light', 'dark'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setCurrentTheme(nextTheme);
    localStorage.setItem("adminTheme", nextTheme);
  };

  // Theme styles
  const getThemeStyles = () => {
    switch (currentTheme) {
      case 'dark':
        return {
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          cardBg: '#2d3748',
          textPrimary: '#f7fafc',
          textSecondary: '#cbd5e0',
          border: '#4a5568'
        };
      case 'light':
        return {
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
          cardBg: '#ffffff',
          textPrimary: '#14532d',
          textSecondary: '#166534',
          border: '#22c55e'
        };
      default: // normal
        return {
          background: '#f9fafb',
          cardBg: '#ffffff',
          textPrimary: '#1f2937',
          textSecondary: '#6b7280',
          border: '#e5e7eb'
        };
    }
  };

  const themeStyles = getThemeStyles();

  // Fetch data hooks
  const { data: houses } = useQuery<House[]>({
    queryKey: ["/api/houses"],
    enabled: isAuthenticated,
  });

  const { data: allScholars } = useQuery<Scholar[]>({
    queryKey: ["/api/scholars"],
    enabled: isAuthenticated,
  });

  const { data: pendingTeachers } = useQuery<TeacherAuth[]>({
    queryKey: ["/api/admin/teachers/pending"],
    enabled: isAuthenticated,
  });

  // Fetch admin messages
  const { data: adminMessages = [] } = useQuery({
    queryKey: ["/api/admin/messages"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/messages", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Fetch gallery photos for admin
  const { data: galleryPhotos = [] } = useQuery({
    queryKey: ["/api/pbis-photos"],
    queryFn: async () => {
      const response = await fetch("/api/pbis-photos");
      if (!response.ok) throw new Error("Failed to fetch photos");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Fetch badges data
  const { data: allBadges = [] } = useQuery({
    queryKey: ["/api/badges"],
    enabled: isAuthenticated,
  });

  // Fetch games data
  const { data: allGames = [] } = useQuery({
    queryKey: ["/api/games"],
    enabled: isAuthenticated,
  });

  // Fetch scholar badges (badges earned by students)
  const { data: scholarBadges = [] } = useQuery({
    queryKey: ["/api/scholar-badges"],
    enabled: isAuthenticated,
  });

  // Fetch game access data
  const { data: gameAccess = [] } = useQuery({
    queryKey: ["/api/game-access"],
    enabled: isAuthenticated,
  });

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

  // Export data functions
  const handleExportData = async (format: 'csv' | 'excel') => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/export/${format}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `pbis-data.${format === 'excel' ? 'xlsx' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export Successful",
          description: `Data exported as ${format.toUpperCase()}`,
        });
      } else {
        throw new Error(`Export failed: ${response.status}`);
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Teacher approval functions
  const approveTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/teachers/${teacherId}/approve`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to approve teacher");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers/pending"] });
      toast({
        title: "Teacher Approved",
        description: "Teacher has been successfully approved.",
      });
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
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/broadcast-message", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Broadcast message sent successfully.",
      });
    },
  });

  // Send teacher notifications mutation
  const sendTeacherNotificationsMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/send-teacher-notifications", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to send teacher notifications");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Teacher Notifications Sent",
        description: `Email notifications sent to ${data.details.success} teachers successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Notification Failed",
        description: "Failed to send teacher notifications. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send test email mutation
  const sendTestEmailMutation = useMutation({
    mutationFn: async (emailData: { email: string; name?: string }) => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/send-test-email", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });
      if (!response.ok) throw new Error("Failed to send test email");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test Email Sent",
        description: `Test email sent successfully to ${data.message.split(' ').pop()}`,
      });
    },
    onError: () => {
      toast({
        title: "Test Email Failed",
        description: "Failed to send test email. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      setMessageForm({ subject: "", message: "", recipientType: "" });
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Send Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageForm.subject || !messageForm.message || !messageForm.recipientType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      subject: messageForm.subject,
      message: messageForm.message,
      recipientType: messageForm.recipientType,
      priority: 'normal'
    });
  };

  // Photo upload mutation for admin
  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ file, description }: { file: File; description: string }) => {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('description', description);
      formData.append('uploadedBy', `${adminData?.firstName} ${adminData?.lastName} (Admin)`);

      const response = await fetch('/api/upload-pbis-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pbis-photos"] });
      setUploadedFile(null);
      setPhotoDescription("");
      setShowUploadModal(false);
      toast({
        title: "Photo Uploaded",
        description: "Your photo has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setUploadedFile(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please select an image file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUploadPhoto = () => {
    if (!uploadedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a photo to upload.",
        variant: "destructive",
      });
      return;
    }

    uploadPhotoMutation.mutate({
      file: uploadedFile,
      description: photoDescription,
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: themeStyles.background
    }}>
      <div style={{padding: '20px'}}>
        <Card className="rounded-2xl shadow-lg p-8" style={{backgroundColor: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`}}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
            <div className="flex items-center">
              <img 
                src={schoolLogoPath} 
                alt="Bush Hills STEAM Academy" 
                className="h-12 w-auto mr-4"
                data-testid="admin-school-logo"
              />
              <div>
                <h2 className="text-3xl font-bold" data-testid="admin-title" style={{color: themeStyles.textPrimary}}>Administration Portal</h2>
                <p style={{color: themeStyles.textSecondary}}>Welcome, {adminData?.firstName} {adminData?.lastName} ({adminData?.title})</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
              <Button
                onClick={toggleTheme}
                variant="outline"
                className="flex items-center gap-2"
                style={{
                  backgroundColor: currentTheme === 'dark' ? '#4a5568' : currentTheme === 'light' ? '#22c55e' : '#ffffff',
                  color: currentTheme === 'dark' ? '#f7fafc' : currentTheme === 'light' ? '#ffffff' : '#1a202c',
                  borderColor: themeStyles.border
                }}
                data-testid="button-theme-toggle"
              >
                <Palette className="h-4 w-4" />
                {currentTheme === 'normal' ? 'Normal' : currentTheme === 'light' ? 'Light' : 'Dark'}
              </Button>
              
              <Select onValueChange={(value) => window.location.href = value}>
                <SelectTrigger className="w-40" style={{backgroundColor: themeStyles.cardBg, color: themeStyles.textPrimary, borderColor: themeStyles.border}}>
                  <SelectValue placeholder="Main Pages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="/dashboard">Main Dashboard</SelectItem>
                  <SelectItem value="/tutorial">Tutorial</SelectItem>
                  <SelectItem value="/houses">Houses</SelectItem>
                  <SelectItem value="/pbis">PBIS System</SelectItem>
                  <SelectItem value="/house-sorting">House Sorting</SelectItem>
                </SelectContent>
              </Select>
              
              <Select onValueChange={(value) => window.location.href = value}>
                <SelectTrigger className="w-40" style={{backgroundColor: themeStyles.cardBg, color: themeStyles.textPrimary, borderColor: themeStyles.border}}>
                  <SelectValue placeholder="Reports & Tools" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="/monthly-pbis">Monthly Tracking</SelectItem>
                  <SelectItem value="/parent-letter">Parent Letter</SelectItem>
                  <SelectItem value="/pledge">House Pledge</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2"
                style={{
                  backgroundColor: themeStyles.cardBg,
                  color: themeStyles.textPrimary,
                  borderColor: themeStyles.border
                }}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 gap-1" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border, padding: '2px'}}>
              <TabsTrigger value="teachers" style={{color: themeStyles.textPrimary, padding: '6px 8px', fontSize: '14px'}}>Teachers</TabsTrigger>
              <TabsTrigger value="teacher-viewer" style={{color: themeStyles.textPrimary, padding: '6px 8px', fontSize: '14px'}}>
                <Eye className="h-3 w-3 mr-1" />
                Viewer
              </TabsTrigger>
              <TabsTrigger value="students" style={{color: themeStyles.textPrimary, padding: '6px 8px', fontSize: '14px'}}>Students</TabsTrigger>
              <TabsTrigger value="houses" style={{color: themeStyles.textPrimary, padding: '6px 8px', fontSize: '14px'}}>Houses</TabsTrigger>
              <TabsTrigger value="badges" style={{color: themeStyles.textPrimary, padding: '6px 8px', fontSize: '14px'}}>Badges</TabsTrigger>
              <TabsTrigger value="games" style={{color: themeStyles.textPrimary, padding: '6px 8px', fontSize: '14px'}}>Games</TabsTrigger>
            </TabsList>
            
            <TabsList className="grid w-full grid-cols-4 gap-1 mt-2" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border, padding: '2px'}}>
              <TabsTrigger value="messaging" style={{color: themeStyles.textPrimary, padding: '6px 8px', fontSize: '14px'}}>Messages</TabsTrigger>
              <TabsTrigger value="gallery" style={{color: themeStyles.textPrimary, padding: '6px 8px', fontSize: '14px'}}>Gallery</TabsTrigger>
              <TabsTrigger value="reflections" style={{color: themeStyles.textPrimary, padding: '6px 8px', fontSize: '14px'}}>Reflections</TabsTrigger>
              <TabsTrigger value="exports" style={{color: themeStyles.textPrimary, padding: '6px 8px', fontSize: '14px'}}>Data Export</TabsTrigger>
            </TabsList>



            <TabsContent value="teachers" className="space-y-6">
              <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                <CardHeader>
                  <CardTitle style={{color: themeStyles.textPrimary}}>Teacher Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p style={{color: themeStyles.textSecondary}} className="mb-4">Manage teacher approvals and access</p>
                  
                  {/* Email Notification Controls */}
                  <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-lg" style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border}}>
                    <Button
                      onClick={() => sendTeacherNotificationsMutation.mutate()}
                      disabled={sendTeacherNotificationsMutation.isPending}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      data-testid="button-send-teacher-notifications"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {sendTeacherNotificationsMutation.isPending ? "Sending..." : "Send Welcome Emails to New Teachers"}
                    </Button>
                    
                    <Button
                      onClick={() => sendTestEmailMutation.mutate({ email: "bphillips@bhm.k12.al.us", name: "Administrator" })}
                      disabled={sendTestEmailMutation.isPending}
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50"
                      data-testid="button-send-test-email"
                    >
                      <TestTube className="mr-2 h-4 w-4" />
                      {sendTestEmailMutation.isPending ? "Sending..." : "Send Test Email"}
                    </Button>
                  </div>
                  
                  {pendingTeachers && pendingTeachers.length > 0 ? (
                    <div className="space-y-4">
                      {pendingTeachers.map((teacher) => (
                        <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg" style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border}}>
                          <div className="flex-1">
                            <p className="font-medium" style={{color: themeStyles.textPrimary}}>{teacher.firstName} {teacher.lastName}</p>
                            <p className="text-sm" style={{color: themeStyles.textSecondary}}>{teacher.email}</p>
                            <p className="text-sm" style={{color: themeStyles.textSecondary}}>{teacher.gradeRole} • {teacher.subject}</p>
                            <p className="text-xs" style={{color: themeStyles.textSecondary}}>
                              Applied: {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'Recently'}
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
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                      <p style={{color: themeStyles.textSecondary}}>No pending teacher approvals</p>
                      <p className="text-sm" style={{color: themeStyles.textSecondary}}>All teachers have been approved</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teacher-viewer" className="space-y-6">
              <AdminTeacherViewer />
            </TabsContent>

            <TabsContent value="students" className="space-y-6">
              <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                <CardHeader>
                  <CardTitle style={{color: themeStyles.textPrimary}}>Student Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p style={{color: themeStyles.textSecondary}} className="mb-4">Manage student records and house assignments</p>
                  
                  {/* Student Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-lg" style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border}}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium" style={{color: themeStyles.textSecondary}}>Total Students</p>
                          <p className="text-2xl font-bold" style={{color: themeStyles.textPrimary}}>
                            {allScholars?.length || 0}
                          </p>
                        </div>
                        <Users className="h-8 w-8" style={{color: themeStyles.textSecondary}} />
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg" style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border}}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium" style={{color: themeStyles.textSecondary}}>Active Houses</p>
                          <p className="text-2xl font-bold" style={{color: themeStyles.textPrimary}}>
                            {houses?.length || 0}
                          </p>
                        </div>
                        <GraduationCap className="h-8 w-8" style={{color: themeStyles.textSecondary}} />
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg" style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border}}>
                      <div>
                        <p className="text-sm font-medium" style={{color: themeStyles.textSecondary}}>Badges Earned</p>
                        <p className="text-2xl font-bold" style={{color: themeStyles.textPrimary}}>
                          {scholarBadges?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Student List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold" style={{color: themeStyles.textPrimary}}>All Students</h3>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          toast({
                            title: "Add Student",
                            description: "Student addition functionality can be implemented here.",
                          });
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Student
                      </Button>
                    </div>

                    {allScholars && allScholars.length > 0 ? (
                      <div className="grid gap-4">
                        {allScholars.map((scholar) => {
                          const house = houses?.find(h => h.id === scholar.houseId);
                          const studentBadges = scholarBadges?.filter((sb: any) => sb.scholarId === scholar.id) || [];
                          
                          return (
                            <div 
                              key={scholar.id} 
                              className="flex items-center justify-between p-4 border rounded-lg" 
                              style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border}}
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <div>
                                    <p className="font-medium" style={{color: themeStyles.textPrimary}}>
                                      {scholar.firstName} {scholar.lastName}
                                    </p>
                                    <p className="text-sm" style={{color: themeStyles.textSecondary}}>
                                      ID: {scholar.id.slice(0, 8)}... • Grade: {scholar.grade}
                                    </p>
                                    <p className="text-sm" style={{color: themeStyles.textSecondary}}>
                                      Username: {scholar.username}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                {house && (
                                  <Badge 
                                    className="text-white"
                                    style={{backgroundColor: house.color}}
                                  >
                                    {house.name}
                                  </Badge>
                                )}
                                <Badge variant="outline">
                                  {studentBadges.length} badges
                                </Badge>
                                <div className="text-right">
                                  <p className="text-sm font-medium" style={{color: themeStyles.textPrimary}}>
                                    {scholar.totalPoints || 0} points
                                  </p>
                                  <p className="text-xs" style={{color: themeStyles.textSecondary}}>
                                    Joined: {scholar.createdAt ? new Date(scholar.createdAt).toLocaleDateString() : 'Recently'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p style={{color: themeStyles.textSecondary}}>No students found</p>
                        <p className="text-sm" style={{color: themeStyles.textSecondary}}>Students will appear here once they are added to the system</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="houses" className="space-y-6">
              <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                <CardHeader>
                  <CardTitle style={{color: themeStyles.textPrimary}}>House Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {houses && houses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {houses.map((house) => (
                        <div key={house.id} className="p-4 border rounded-lg" style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}>
                          <h3 className="font-bold" style={{color: house.color}}>
                            {house.name}
                          </h3>
                          <p className="text-sm" style={{color: themeStyles.textSecondary}}>{house.description}</p>
                          <div className="mt-2">
                            <Badge>
                              {allScholars?.filter(s => s.houseId === house.id).length || 0} students
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{color: themeStyles.textSecondary}}>Loading houses...</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="badges" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                  <CardHeader>
                    <CardTitle style={{color: themeStyles.textPrimary}}>Badge Overview ({allBadges?.length || 0} Total)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {allBadges && allBadges.length > 0 ? (
                        allBadges.map((badge: any) => (
                          <div key={badge.id} className="p-4 border rounded-lg" style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium" style={{color: themeStyles.textPrimary}}>{badge.name}</h4>
                                <p className="text-sm" style={{color: themeStyles.textSecondary}}>{badge.description}</p>
                              </div>
                              <Badge variant={badge.category === 'overall' ? 'default' : 'secondary'}>
                                Level {badge.level}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span style={{color: themeStyles.textSecondary}}>
                                {badge.category} • {badge.pointsRequired} points
                              </span>
                              <span style={{color: themeStyles.textSecondary}}>
                                {badge.houseId ? badge.houseId.charAt(0).toUpperCase() + badge.houseId.slice(1) : 'Universal'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p style={{color: themeStyles.textSecondary}}>No badges found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                  <CardHeader>
                    <CardTitle style={{color: themeStyles.textPrimary}}>Badge Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['academic', 'behavior', 'attendance', 'overall'].map(category => {
                        const categoryBadges = allBadges?.filter((b: any) => b.category === category) || [];
                        return (
                          <div key={category} className="p-3 border rounded-lg" style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border}}>
                            <div className="flex justify-between items-center">
                              <span className="font-medium capitalize" style={{color: themeStyles.textPrimary}}>
                                {category}
                              </span>
                              <Badge variant="outline">
                                {categoryBadges.length} badges
                              </Badge>
                            </div>
                            <p className="text-xs mt-1" style={{color: themeStyles.textSecondary}}>
                              {categoryBadges.map((b: any) => `${b.pointsRequired}pts`).join(', ')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="games" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                  <CardHeader>
                    <CardTitle style={{color: themeStyles.textPrimary}}>Game Library ({allGames?.length || 0} Games)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {allGames && allGames.length > 0 ? (
                        allGames.map((game: any) => (
                          <div key={game.id} className="p-4 border rounded-lg" style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium" style={{color: themeStyles.textPrimary}}>{game.name}</h4>
                                <p className="text-sm" style={{color: themeStyles.textSecondary}}>{game.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={game.difficulty === 'easy' ? 'default' : game.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                                  {game.difficulty}
                                </Badge>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedGame(game);
                                    setShowGameModal(true);
                                  }}
                                  style={{color: themeStyles.textPrimary, borderColor: themeStyles.border}}
                                >
                                  Test Game
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span style={{color: themeStyles.textSecondary}}>
                                {game.category} • {game.pointsRequired} points required
                              </span>
                              <span className={`px-2 py-1 rounded ${game.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {game.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p style={{color: themeStyles.textSecondary}}>No games found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                  <CardHeader>
                    <CardTitle style={{color: themeStyles.textPrimary}}>Game Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['sports', 'puzzle', 'strategy', 'arcade', 'adventure', 'racing'].map(category => {
                        const categoryGames = allGames?.filter((g: any) => g.category === category) || [];
                        return (
                          <div key={category} className="p-3 border rounded-lg" style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border}}>
                            <div className="flex justify-between items-center">
                              <span className="font-medium capitalize" style={{color: themeStyles.textPrimary}}>
                                {category}
                              </span>
                              <Badge variant="outline">
                                {categoryGames.length} games
                              </Badge>
                            </div>
                            {categoryGames.length > 0 && (
                              <p className="text-xs mt-1" style={{color: themeStyles.textSecondary}}>
                                {categoryGames.map((g: any) => g.name).slice(0, 2).join(', ')}
                                {categoryGames.length > 2 && ` +${categoryGames.length - 2} more`}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="messaging" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Messages ({adminMessages?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {adminMessages && adminMessages.length > 0 ? (
                        adminMessages.slice(0, 10).map((message: any) => (
                          <div key={message.id} className="p-4 border rounded-lg bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{message.subject}</h4>
                              <span className="text-xs text-gray-500">
                                {message.created_at ? new Date(message.created_at).toLocaleDateString() : 'Recently'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{message.message}</p>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span>From: {message.sender_name || 'Unknown'}</span>
                              <span>To: {message.recipient_name || 'Unknown'}</span>
                            </div>
                            {message.priority === 'urgent' && (
                              <Badge variant="destructive" className="mt-2">Urgent</Badge>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-gray-500">No messages found</p>
                          <p className="text-sm text-gray-400">Messages between parents and teachers will appear here</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Send Message</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="message-subject">Subject</Label>
                      <Input
                        id="message-subject"
                        placeholder="Message subject"
                        value={messageForm.subject}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="message-content">Message</Label>
                      <textarea
                        id="message-content"
                        className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Type your message here..."
                        value={messageForm.message}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="message-type">Send To</Label>
                      <Select onValueChange={(value) => setMessageForm(prev => ({ ...prev, recipientType: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recipient type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-parents">All Parents</SelectItem>
                          <SelectItem value="all-teachers">All Teachers</SelectItem>
                          <SelectItem value="broadcast">School-wide Announcement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleSendMessage}
                      disabled={sendMessageMutation.isPending || !messageForm.subject || !messageForm.message || !messageForm.recipientType}
                      className="w-full"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                    </Button>
                    <div className="pt-4 border-t space-y-2">
                      <Button onClick={() => window.location.href = '/parent-letter'} variant="outline" className="w-full justify-start">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Parent Portal Information
                      </Button>
                      <Button 
                        onClick={() => {
                          queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
                          toast({
                            title: "Messages Refreshed",
                            description: "Latest messages have been loaded.",
                          });
                        }}
                        variant="outline" 
                        className="w-full justify-start"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Messages
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="exports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Export & Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">Export system data in various formats for analysis and reporting</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button 
                      onClick={() => handleExportData('csv')}
                      className="bg-green-600 text-white hover:bg-green-700 justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="flex items-center">
                          <Download className="mr-2 h-4 w-4" />
                          Export CSV
                        </div>
                        <p className="text-sm text-gray-300 mt-1">All data in spreadsheet format</p>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => handleExportData('excel')}
                      className="bg-green-700 text-white hover:bg-green-800 justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="flex items-center">
                          <Download className="mr-2 h-4 w-4" />
                          Export Excel
                        </div>
                        <p className="text-sm text-gray-300 mt-1">Formatted Excel workbook</p>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => window.location.href = '/qr-generator'}
                      className="bg-blue-600 text-white hover:bg-blue-700 justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="flex items-center">
                          <Plus className="mr-2 h-4 w-4" />
                          QR Generator
                        </div>
                        <p className="text-sm text-gray-300 mt-1">Generate student QR codes</p>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => window.location.href = '/admin-settings'}
                      className="bg-gray-600 text-white hover:bg-gray-700 justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          Email Settings
                        </div>
                        <p className="text-sm text-gray-300 mt-1">Configure email notifications</p>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => window.open("/parent-letter", "_blank")}
                      className="bg-blue-600 text-white hover:bg-blue-700 justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="flex items-center">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Parent Portal Info
                        </div>
                        <p className="text-sm text-gray-300 mt-1">Parent setup instructions</p>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        if (confirm("Are you sure you want to reset all semester points? This action cannot be undone.")) {
                          toast({
                            title: "Feature Coming Soon",
                            description: "Semester reset functionality will be available soon.",
                          });
                        }
                      }}
                      variant="destructive"
                      className="justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="flex items-center">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reset Semester
                        </div>
                        <p className="text-sm text-red-300 mt-1">Clear all point data</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gallery" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image className="h-5 w-5" />
                      Activity Photo Gallery ({galleryPhotos?.length || 0} photos)
                    </div>
                    <Button
                      onClick={() => setShowUploadModal(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {galleryPhotos && galleryPhotos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {galleryPhotos.map((photo: any) => (
                        <div key={photo.id} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="aspect-video bg-gray-100 flex items-center justify-center relative group">
                            <img 
                              src={`/uploads/${photo.filename}`}
                              alt={photo.description || 'Activity photo'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling!.style.display = 'flex';
                              }}
                            />
                            <div className="hidden w-full h-full items-center justify-center text-gray-400">
                              <Image className="h-12 w-12" />
                            </div>
                            {/* Admin Download Button */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = `/uploads/${photo.filename}`;
                                  link.download = photo.originalName || photo.filename;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  toast({
                                    title: "Download Started",
                                    description: `Downloading ${photo.originalName || 'photo'}`,
                                  });
                                }}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {photo.description || 'No description provided'}
                            </p>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span className="font-medium">By: {photo.uploadedBy}</span>
                              <span>
                                {photo.createdAt 
                                  ? new Date(photo.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })
                                  : 'Recently'
                                }
                              </span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = `/uploads/${photo.filename}`;
                                  link.download = photo.originalName || photo.filename;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  toast({
                                    title: "Download Started",
                                    description: `Downloading ${photo.originalName || 'photo'}`,
                                  });
                                }}
                              >
                                <Download className="h-3 w-3 mr-2" />
                                Download Original
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Image className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Photos Yet</h3>
                      <p className="text-gray-500 mb-4">
                        Teachers haven't uploaded any activity photos yet. Photos uploaded by teachers will appear here.
                      </p>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>For Teachers:</strong> Use the "Upload Photos" tab in your teacher dashboard to add activity photos that will appear in this gallery.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reflections" className="space-y-6">
              <ReflectionLogs />
            </TabsContent>

            <TabsContent value="exports" className="space-y-6">
              <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                <CardHeader>
                  <CardTitle style={{color: themeStyles.textPrimary}}>Data Export Center</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={() => window.open('/api/admin/export/scholars', '_blank')}
                      className="flex items-center gap-2 h-20"
                      variant="outline"
                    >
                      <Download className="h-6 w-6" />
                      <div className="text-left">
                        <div className="font-semibold">Export Students</div>
                        <div className="text-sm opacity-75">Download all student data</div>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => window.open('/api/admin/export/pbis', '_blank')}
                      className="flex items-center gap-2 h-20"
                      variant="outline"
                    >
                      <Download className="h-6 w-6" />
                      <div className="text-left">
                        <div className="font-semibold">Export PBIS Data</div>
                        <div className="text-sm opacity-75">Download all PBIS entries</div>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => window.open('/api/admin/export/houses', '_blank')}
                      className="flex items-center gap-2 h-20"
                      variant="outline"
                    >
                      <Download className="h-6 w-6" />
                      <div className="text-left">
                        <div className="font-semibold">Export House Data</div>
                        <div className="text-sm opacity-75">Download house standings</div>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => window.open('/api/admin/export/reflections', '_blank')}
                      className="flex items-center gap-2 h-20"
                      variant="outline"
                    >
                      <Download className="h-6 w-6" />
                      <div className="text-left">
                        <div className="font-semibold">Export Reflections</div>
                        <div className="text-sm opacity-75">Download reflection logs</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Admin Photo Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Upload Photo</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadedFile(null);
                      setPhotoDescription("");
                    }}
                  >
                    ×
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="photo-upload">Select Photo</Label>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="mt-1"
                    />
                  </div>
                  
                  {uploadedFile && (
                    <div className="text-sm text-gray-600">
                      Selected: {uploadedFile.name}
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="photo-description">Description</Label>
                    <Input
                      id="photo-description"
                      value={photoDescription}
                      onChange={(e) => setPhotoDescription(e.target.value)}
                      placeholder="Enter photo description..."
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => {
                        setShowUploadModal(false);
                        setUploadedFile(null);
                        setPhotoDescription("");
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUploadPhoto}
                      disabled={!uploadedFile || uploadPhotoMutation.isPending}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {uploadPhotoMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Uploading...
                        </div>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Game Modal */}
      {selectedGame && (
        <GameModal
          game={selectedGame}
          isOpen={showGameModal}
          onClose={() => {
            setShowGameModal(false);
            setSelectedGame(null);
          }}
        />
      )}
    </div>
  );
}