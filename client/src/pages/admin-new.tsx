import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Download, RefreshCw, UserPlus, Plus, CheckCircle, Clock, Users, GraduationCap, Award, LogOut, User, MessageSquare, Send, Reply, Camera, Image, Palette, Eye, Mail, TestTube, BarChart3, Brain, FileText, Trophy, Search, X, UserX, Upload } from "lucide-react";
import { PBISCategorySelector } from "@/components/PBISCategorySelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AdminTeacherViewer } from "@/components/AdminTeacherViewer";
import { ProgressReportGenerator } from "@/components/ProgressReportGenerator";
import { AchievementPlayground } from "@/components/AchievementPlayground";
import { TeacherPerformanceHeatmap } from "@/components/TeacherPerformanceHeatmap";
import { AIRecommendationEngine } from "@/components/AIRecommendationEngine";
import { NotificationBell, NotificationPanel, useNotifications } from "@/components/NotificationSystem";
import { notificationService } from "@/services/notificationService";
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

  // Notification state
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const { addNotification } = useNotifications();

  // Student management state
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAwardPointsModal, setShowAwardPointsModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [deactivationReason, setDeactivationReason] = useState("");
  
  // Award points modal state
  const [awardPointsForm, setAwardPointsForm] = useState({
    scholarId: "",
    category: "",
    subcategory: "",
    mustangTrait: "",
    points: 0,
    reason: ""
  });

  // Add student form state
  const [addStudentForm, setAddStudentForm] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    grade: 6,
    houseId: "",
    username: "",
    password: ""
  });

  // Quick Actions state
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showContactInfoModal, setShowContactInfoModal] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [selectedHouseStudents, setSelectedHouseStudents] = useState<any[]>([]);
  const [selectedHouseName, setSelectedHouseName] = useState("");
  const [showHouseStudentsModal, setShowHouseStudentsModal] = useState(false);
  const [selectedStudentForDashboard, setSelectedStudentForDashboard] = useState("");
  const [showCreateBadgeModal, setShowCreateBadgeModal] = useState(false);
  const [showMassAwardModal, setShowMassAwardModal] = useState(false);
  const [qrCodeStudentId, setQrCodeStudentId] = useState("");

  useEffect(() => {
    console.log("AdminNew component mounted");
    const token = localStorage.getItem("adminToken");
    const data = localStorage.getItem("adminData");
    const savedTheme = localStorage.getItem("adminTheme") as 'light' | 'dark' | 'normal' || 'normal';
    
    setCurrentTheme(savedTheme);
    
    // Set up notification service callback
    notificationService.setNotificationCallback(addNotification);
    notificationService.initializeRealTimeListeners();
    
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
  }, [setLocation, addNotification]);

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

  // SEL lessons query for admin monitoring
  const { data: selLessons = [], isLoading: selLessonsLoading } = useQuery({
    queryKey: ['/api/admin/sel/lessons'],
    enabled: isAuthenticated
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
        body: JSON.stringify({
          sendAdminCopy: true,
          adminCopyEmail: "bhsahouses25@gmail.com"
        }),
      });
      if (!response.ok) throw new Error("Failed to send teacher notifications");
      return response.json();
    },
    onSuccess: (data) => {
      const { details } = data;
      toast({
        title: "Teacher Welcome Emails Sent",
        description: `Welcome emails sent to ${details.success || 0} teachers successfully. Admin copies sent to bhsahouses25@gmail.com.`,
      });
      
      // Refresh teacher data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers/approved"] });
    },
    onError: (error: any) => {
      toast({
        title: "Welcome Email Failed",
        description: error.message || "Failed to send teacher welcome emails. Please try again.",
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
        <div>
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
              
              {/* Notification Bell */}
              <NotificationBell 
                onClick={() => setShowNotificationPanel(true)}
                className="text-gray-600 hover:text-gray-900"
              />
              
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
            <TabsList className="grid w-full grid-cols-6 h-auto">
              <TabsTrigger value="teachers" className="text-xs sm:text-sm px-2 py-2">Teachers</TabsTrigger>
              <TabsTrigger value="teacher-viewer" className="text-xs sm:text-sm px-2 py-2">
                <Eye className="h-4 w-4 mr-1" />
                Viewer
              </TabsTrigger>
              <TabsTrigger value="students" className="text-xs sm:text-sm px-2 py-2">Students</TabsTrigger>
              <TabsTrigger value="houses" className="text-xs sm:text-sm px-2 py-2">Houses</TabsTrigger>
              <TabsTrigger value="badges" className="text-xs sm:text-sm px-2 py-2">Badges</TabsTrigger>
              <TabsTrigger value="games" className="text-xs sm:text-sm px-2 py-2">Games</TabsTrigger>
            </TabsList>
            
            <TabsList className="grid w-full grid-cols-7 gap-1 mb-2" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border, padding: '4px'}}>
              <TabsTrigger value="quick-actions" style={{color: themeStyles.textPrimary, padding: '8px 12px', fontSize: '13px', minHeight: '40px'}}>Quick Actions</TabsTrigger>
              <TabsTrigger value="story-review" style={{color: themeStyles.textPrimary, padding: '8px 12px', fontSize: '13px', minHeight: '40px'}}>AI Stories</TabsTrigger>
              <TabsTrigger value="sel-monitoring" style={{color: themeStyles.textPrimary, padding: '8px 12px', fontSize: '13px', minHeight: '40px'}}>
                <Brain className="h-4 w-4 mr-1" />
                SEL Monitoring
              </TabsTrigger>
              <TabsTrigger value="messaging" style={{color: themeStyles.textPrimary, padding: '8px 12px', fontSize: '13px', minHeight: '40px'}}>Messages</TabsTrigger>
              <TabsTrigger value="gallery" style={{color: themeStyles.textPrimary, padding: '8px 12px', fontSize: '13px', minHeight: '40px'}}>Gallery</TabsTrigger>
              <TabsTrigger value="reflections" style={{color: themeStyles.textPrimary, padding: '8px 12px', fontSize: '13px', minHeight: '40px'}}>Reflections</TabsTrigger>
              <TabsTrigger value="exports" style={{color: themeStyles.textPrimary, padding: '8px 12px', fontSize: '13px', minHeight: '40px'}}>Data Export</TabsTrigger>
            </TabsList>

            <TabsList className="grid w-full grid-cols-4 gap-1 mb-3" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border, padding: '4px'}}>
              <TabsTrigger value="progress-reports" style={{color: themeStyles.textPrimary, padding: '8px 12px', fontSize: '13px', minHeight: '40px'}}>
                <FileText className="h-4 w-4 mr-1" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="achievement-playground" style={{color: themeStyles.textPrimary, padding: '8px 12px', fontSize: '13px', minHeight: '40px'}}>
                <Trophy className="h-4 w-4 mr-1" />
                Achievement
              </TabsTrigger>
              <TabsTrigger value="performance-heatmap" style={{color: themeStyles.textPrimary, padding: '8px 12px', fontSize: '13px', minHeight: '40px'}}>
                <BarChart3 className="h-4 w-4 mr-1" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="ai-recommendations" style={{color: themeStyles.textPrimary, padding: '8px 12px', fontSize: '13px', minHeight: '40px'}}>
                <Brain className="h-4 w-4 mr-1" />
                AI Engine
              </TabsTrigger>
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
                      onClick={() => {
                        if (!confirm("Send welcome emails to all newly approved teachers? You will also receive copies of all emails sent.")) {
                          return;
                        }
                        sendTeacherNotificationsMutation.mutate();
                      }}
                      disabled={sendTeacherNotificationsMutation.isPending}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      data-testid="button-send-teacher-notifications"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {sendTeacherNotificationsMutation.isPending ? "Sending Welcome Emails..." : "Send Welcome Emails to New Teachers"}
                    </Button>
                    
                    <div className="text-sm text-gray-600 mt-2">
                      <p className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        Welcome emails include login credentials and system overview. Admin copies will be sent to bhsahouses25@gmail.com.
                      </p>
                    </div>
                    
                    <Button
                      onClick={() => sendTestEmailMutation.mutate({ email: "bhsahouses25@gmail.com", name: "Administrator" })}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Teacher Dashboard Viewer */}
                <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                  <CardHeader>
                    <CardTitle style={{color: themeStyles.textPrimary}}>Teacher Dashboard Viewer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AdminTeacherViewer />
                  </CardContent>
                </Card>
                
                {/* Student Dashboard Viewer */}
                <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                  <CardHeader>
                    <CardTitle style={{color: themeStyles.textPrimary}}>Student Dashboard Viewer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p style={{color: themeStyles.textSecondary}} className="mb-4">
                      Select any student to view their complete dashboard with all features and capabilities.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <Label style={{color: themeStyles.textPrimary}}>Select Student</Label>
                        <Select value={selectedStudentForDashboard} onValueChange={setSelectedStudentForDashboard}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a student to view their dashboard..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-48 overflow-y-auto">
                            {allScholars?.map((scholar) => (
                              <SelectItem key={scholar.id} value={scholar.id}>
                                {scholar.name} (Grade {scholar.grade}) - {houses?.find(h => h.id === scholar.houseId)?.name || 'No House'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button 
                        onClick={() => {
                          if (!selectedStudentForDashboard) {
                            toast({
                              title: "Student Required",
                              description: "Please select a student to view their dashboard.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          const selectedStudent = allScholars?.find(s => s.id === selectedStudentForDashboard);
                          if (selectedStudent) {
                            // Store admin viewing data for teacher-student-view route
                            sessionStorage.setItem('teacherViewingStudent', JSON.stringify({
                              studentId: selectedStudent.id,
                              studentName: selectedStudent.name,
                              teacherMode: true,
                              adminMode: true,
                              returnTo: '/admin'
                            }));
                            
                            // Open admin student dashboard viewer in new tab using teacher-student-view route
                            const dashboardUrl = `/teacher-student-view/${selectedStudent.id}`;
                            window.open(dashboardUrl, '_blank');
                            
                            toast({
                              title: "Dashboard Opened",
                              description: `Viewing ${selectedStudent.name}'s dashboard in new tab.`,
                            });
                          } else {
                            toast({
                              title: "Student Not Found",
                              description: "Unable to find the selected student.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={!selectedStudentForDashboard}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Student Dashboard
                      </Button>
                      
                      {selectedStudentForDashboard && allScholars && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          {(() => {
                            const student = allScholars.find(s => s.id === selectedStudentForDashboard);
                            const house = houses?.find(h => h.id === student?.houseId);
                            const totalPoints = (student?.academicPoints || 0) + (student?.attendancePoints || 0) + (student?.behaviorPoints || 0);
                            
                            return (
                              <div>
                                <h4 className="font-medium text-blue-800 mb-2">Student Preview:</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-blue-600">Name:</span>
                                    <div className="font-medium">{student?.name}</div>
                                  </div>
                                  <div>
                                    <span className="text-blue-600">Grade:</span>
                                    <div className="font-medium">{student?.grade}</div>
                                  </div>
                                  <div>
                                    <span className="text-blue-600">House:</span>
                                    <div className="font-medium">{house?.name || 'Unassigned'}</div>
                                  </div>
                                  <div>
                                    <span className="text-blue-600">Total Points:</span>
                                    <div className="font-medium">{totalPoints}</div>
                                  </div>
                                  <div>
                                    <span className="text-blue-600">Username:</span>
                                    <div className="font-medium">{student?.username || 'Not Set'}</div>
                                  </div>
                                  <div>
                                    <span className="text-blue-600">Student ID:</span>
                                    <div className="font-medium">{student?.studentId}</div>
                                  </div>
                                </div>
                                <div className="mt-3 text-xs text-blue-600">
                                  Dashboard will include: Points tracking, House activities, PBIS recognition, Skill tree, Learning paths, Reflections, Achievement playground, Mood tracker, and all interactive features.
                                </div>
                              </div>
                            );
                          })()
                          }
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="students" className="space-y-6">
              <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                <CardHeader>
                  <CardTitle style={{color: themeStyles.textPrimary}}>Student Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p style={{color: themeStyles.textSecondary}} className="mb-6">Manage student records, awards, and house assignments</p>
                  
                  {/* Filter Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <Label style={{color: themeStyles.textPrimary}}>Filter by Grade</Label>
                      <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade level..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Grades</SelectItem>
                          <SelectItem value="6">6th Grade</SelectItem>
                          <SelectItem value="7">7th Grade</SelectItem>
                          <SelectItem value="8">8th Grade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label style={{color: themeStyles.textPrimary}}>Search Students</Label>
                      <Input
                        placeholder="Type student name..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                        onClick={() => setShowAddStudentModal(true)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Student
                      </Button>
                    </div>
                  </div>

                  {/* Student List */}
                  <div className="space-y-4">
                    {(() => {
                      const filteredStudents = allScholars?.filter(scholar => {
                        const matchesGrade = selectedGrade === "all" || scholar.grade.toString() === selectedGrade;
                        const matchesSearch = !studentSearchQuery || 
                          scholar.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                          scholar.studentId?.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                          scholar.username?.toLowerCase().includes(studentSearchQuery.toLowerCase());
                        return matchesGrade && matchesSearch;
                      }) || [];

                      if (filteredStudents.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p style={{color: themeStyles.textSecondary}}>No students found</p>
                            <p className="text-sm" style={{color: themeStyles.textSecondary}}>
                              {selectedGrade !== "all" || studentSearchQuery ? "Try adjusting your filters" : "Students will appear here once they are added"}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <p style={{color: themeStyles.textSecondary}}>
                              Showing {filteredStudents.length} of {allScholars?.length || 0} students
                            </p>
                          </div>
                          
                          <div className="grid gap-4">
                            {filteredStudents.map((scholar) => {
                              const house = houses?.find(h => h.id === scholar.houseId);
                              const studentBadges = scholarBadges?.filter((sb: any) => sb.scholarId === scholar.id) || [];
                              const totalPoints = (scholar.academicPoints || 0) + (scholar.attendancePoints || 0) + (scholar.behaviorPoints || 0);
                              
                              return (
                                <div 
                                  key={scholar.id} 
                                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" 
                                  style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border}}
                                  onClick={() => {
                                    toast({
                                      title: "Student Dashboard",
                                      description: `Opening dashboard for ${scholar.firstName} ${scholar.lastName}`,
                                    });
                                  }}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                      <div>
                                        <p className="font-medium" style={{color: themeStyles.textPrimary}}>
                {scholar.name}
                                        </p>
                                        <p className="text-sm" style={{color: themeStyles.textSecondary}}>
                                          ID: {scholar.studentId} • Grade: {scholar.grade} • Username: {scholar.username}
                                        </p>
                                        <div className="flex items-center space-x-4 mt-1">
                                          <span className="text-xs" style={{color: themeStyles.textSecondary}}>
                                            Academic: {scholar.academicPoints || 0}
                                          </span>
                                          <span className="text-xs" style={{color: themeStyles.textSecondary}}>
                                            Attendance: {scholar.attendancePoints || 0}
                                          </span>
                                          <span className="text-xs" style={{color: themeStyles.textSecondary}}>
                                            Behavior: {scholar.behaviorPoints || 0}
                                          </span>
                                        </div>
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
                                        {totalPoints} points
                                      </p>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex space-x-2">
                                      <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedStudent(scholar);
                                          setAwardPointsForm({
                                            scholarId: scholar.id,
                                            category: "",
                                            subcategory: "",
                                            mustangTrait: "",
                                            points: 0,
                                            reason: ""
                                          });
                                          setShowAwardPointsModal(true);
                                        }}
                                      >
                                        <Award className="w-3 h-3 mr-1" />
                                        Award Points
                                      </Button>
                                      
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedStudent(scholar);
                                          setShowDeactivateModal(true);
                                        }}
                                      >
                                        Deactivate
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="houses" className="space-y-6">
              <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle style={{color: themeStyles.textPrimary}}>House Overview</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          const unassignedStudents = allScholars?.filter(s => !s.houseId) || [];
                          if (unassignedStudents.length === 0) {
                            toast({
                              title: "No Students to Sort",
                              description: "All students are already assigned to houses.",
                            });
                            return;
                          }
                          
                          try {
                            // Calculate house populations
                            const houseCounts = houses?.map(house => ({
                              id: house.id,
                              name: house.name,
                              count: allScholars?.filter(s => s.houseId === house.id).length || 0
                            })) || [];
                            
                            // Sort unassigned students into houses (round-robin)
                            for (let i = 0; i < unassignedStudents.length; i++) {
                              const student = unassignedStudents[i];
                              // Find house with least students
                              const targetHouse = houseCounts.reduce((min, house) => 
                                house.count < min.count ? house : min
                              );
                              
                              // Update student's house assignment
                              const token = localStorage.getItem("adminToken");
                              const response = await fetch(`/api/admin/scholars/${student.id}/house`, {
                                method: "PATCH",
                                headers: {
                                  "Authorization": `Bearer ${token}`,
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ houseId: targetHouse.id }),
                              });
                              
                              if (response.ok) {
                                targetHouse.count++;
                              }
                            }
                            
                            toast({
                              title: "House Sorting Complete",
                              description: `${unassignedStudents.length} students have been automatically sorted into houses.`,
                            });
                            
                            // Refresh data
                            queryClient.invalidateQueries({ queryKey: ["/api/scholars"] });
                            queryClient.invalidateQueries({ queryKey: ["/api/houses"] });
                            
                          } catch (error) {
                            toast({
                              title: "Sorting Failed",
                              description: "Failed to sort students into houses.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Auto-Sort Students
                      </Button>
                      
                      <Button
                        onClick={async () => {
                          if (!confirm("Are you sure you want to rebalance all houses? This will redistribute students evenly across all houses.")) {
                            return;
                          }
                          
                          try {
                            const studentsPerHouse = Math.floor((allScholars?.length || 0) / (houses?.length || 5));
                            const remainingStudents = (allScholars?.length || 0) % (houses?.length || 5);
                            
                            let studentIndex = 0;
                            for (let houseIndex = 0; houseIndex < (houses?.length || 0); houseIndex++) {
                              const house = houses?.[houseIndex];
                              if (!house) continue;
                              
                              const studentsForThisHouse = studentsPerHouse + (houseIndex < remainingStudents ? 1 : 0);
                              
                              for (let i = 0; i < studentsForThisHouse && studentIndex < (allScholars?.length || 0); i++) {
                                const student = allScholars?.[studentIndex];
                                if (!student) continue;
                                
                                const token = localStorage.getItem("adminToken");
                                await fetch(`/api/admin/scholars/${student.id}/house`, {
                                  method: "PATCH",
                                  headers: {
                                    "Authorization": `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ houseId: house.id }),
                                });
                                
                                studentIndex++;
                              }
                            }
                            
                            toast({
                              title: "Houses Rebalanced",
                              description: "All students have been evenly distributed across houses.",
                            });
                            
                            // Refresh data
                            queryClient.invalidateQueries({ queryKey: ["/api/scholars"] });
                            queryClient.invalidateQueries({ queryKey: ["/api/houses"] });
                            
                          } catch (error) {
                            toast({
                              title: "Rebalancing Failed",
                              description: "Failed to rebalance houses.",
                              variant: "destructive",
                            });
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Rebalance Houses
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {houses && houses.length > 0 ? (
                    <div className="space-y-4">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                          <p className="text-2xl font-bold text-blue-600">{allScholars?.length || 0}</p>
                          <p className="text-sm text-blue-600">Total Students</p>
                        </div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                          <p className="text-2xl font-bold text-green-600">{allScholars?.filter(s => s.houseId).length || 0}</p>
                          <p className="text-sm text-green-600">Assigned</p>
                        </div>
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
                          <p className="text-2xl font-bold text-orange-600">{allScholars?.filter(s => !s.houseId).length || 0}</p>
                          <p className="text-sm text-orange-600">Unassigned</p>
                        </div>
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
                          <p className="text-2xl font-bold text-purple-600">{houses?.length || 0}</p>
                          <p className="text-sm text-purple-600">Houses</p>
                        </div>
                      </div>
                      
                      {/* House Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {houses.map((house) => {
                          const houseStudents = allScholars?.filter(s => s.houseId === house.id) || [];
                          return (
                            <div key={house.id} className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow" 
                                 style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}
                                 onClick={() => {
                                   // Show house students modal
                                   setSelectedHouseStudents(houseStudents);
                                   setSelectedHouseName(house.name);
                                   setShowHouseStudentsModal(true);
                                 }}>
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold" style={{color: house.color}}>
                                  {house.name}
                                </h3>
                                <Badge style={{backgroundColor: house.color, color: 'white'}}>
                                  {houseStudents.length} students
                                </Badge>
                              </div>
                              <p className="text-sm" style={{color: themeStyles.textSecondary}}>{house.description}</p>
                              <div className="mt-3 flex items-center justify-between">
                                <div className="text-xs" style={{color: themeStyles.textSecondary}}>Click to view students</div>
                                <div className="w-4 h-4 rounded-full" style={{backgroundColor: house.color}}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p style={{color: themeStyles.textSecondary}}>Loading houses...</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="badges" className="space-y-6">
              <div className="space-y-6">
                {/* Badge Management Header */}
                <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle style={{color: themeStyles.textPrimary}}>Badge Management System</CardTitle>
                      <div className="flex gap-2">
                        <Button className="bg-purple-600 hover:bg-purple-700" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Create New Badge
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Export Badge Data
                        </Button>
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Bulk Award Badges
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">{allBadges?.length || 0}</p>
                        <p className="text-sm text-blue-600">Total Badges</p>
                      </div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">{allBadges?.filter((b: any) => b.category === 'academic').length || 0}</p>
                        <p className="text-sm text-green-600">Academic Badges</p>
                      </div>
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
                        <p className="text-2xl font-bold text-orange-600">{allBadges?.filter((b: any) => b.category === 'behavioral').length || 0}</p>
                        <p className="text-sm text-orange-600">Behavioral Badges</p>
                      </div>
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-600">{allBadges?.filter((b: any) => b.category === 'overall').length || 0}</p>
                        <p className="text-sm text-purple-600">Achievement Badges</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                  <CardHeader>
                    <CardTitle style={{color: themeStyles.textPrimary}}>Badge Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['academic', 'behavioral', 'attendance', 'overall'].map((category) => (
                        <div key={category} className="p-4 border rounded-lg" style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}>
                          <h4 className="font-medium capitalize mb-2" style={{color: themeStyles.textPrimary}}>{category} Badges</h4>
                          <p className="text-sm mb-3" style={{color: themeStyles.textSecondary}}>
                            {allBadges?.filter((b: any) => b.category === category).length || 0} badges in this category
                          </p>
                          <Button size="sm" className="w-full">
                            View {category} Badges
                          </Button>
                        </div>
                      ))}
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

            <TabsContent value="quick-actions" className="space-y-6">
              <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                <CardHeader>
                  <CardTitle style={{color: themeStyles.textPrimary}}>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p style={{color: themeStyles.textSecondary}} className="mb-6">Perform common administrative tasks quickly</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Award Points Quick Action */}
                    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" 
                         style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}
                         onClick={() => {
                           setAwardPointsForm({
                             scholarId: "",
                             category: "",
                             subcategory: "",
                             mustangTrait: "",
                             points: 0,
                             reason: ""
                           });
                           setShowAwardPointsModal(true);
                         }}>
                      <Award className="h-8 w-8 text-green-600 mb-3" />
                      <h3 className="font-semibold mb-2" style={{color: themeStyles.textPrimary}}>Award MUSTANG Points</h3>
                      <p className="text-sm" style={{color: themeStyles.textSecondary}}>Quickly award points to any student for achievements</p>
                    </div>
                    
                    {/* SendGrid Test Email */}
                    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" 
                         style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}
                         onClick={() => setShowTestEmailModal(true)}>
                      <Mail className="h-8 w-8 text-blue-600 mb-3" />
                      <h3 className="font-semibold mb-2" style={{color: themeStyles.textPrimary}}>SendGrid Test Email</h3>
                      <p className="text-sm" style={{color: themeStyles.textSecondary}}>Send a test email using SendGrid to verify email settings</p>
                    </div>
                    
                    {/* Student QR Code Generator */}
                    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" 
                         style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}
                         onClick={() => setShowQRCodeModal(true)}>
                      <TestTube className="h-8 w-8 text-purple-600 mb-3" />
                      <h3 className="font-semibold mb-2" style={{color: themeStyles.textPrimary}}>Generate Student QR Code</h3>
                      <p className="text-sm" style={{color: themeStyles.textSecondary}}>Create QR codes for student login credentials</p>
                    </div>
                    
                    {/* Principal/Assistant Principal Contact Info */}
                    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" 
                         style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}
                         onClick={() => setShowContactInfoModal(true)}>
                      <User className="h-8 w-8 text-indigo-600 mb-3" />
                      <h3 className="font-semibold mb-2" style={{color: themeStyles.textPrimary}}>Administrator Contacts</h3>
                      <p className="text-sm" style={{color: themeStyles.textSecondary}}>View Dr. Phillips & Dr. Stewart contact information</p>
                    </div>
                    
                    {/* Add Student Quick Action */}
                    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" 
                         style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}
                         onClick={() => setShowAddStudentModal(true)}>
                      <UserPlus className="h-8 w-8 text-cyan-600 mb-3" />
                      <h3 className="font-semibold mb-2" style={{color: themeStyles.textPrimary}}>Add New Student</h3>
                      <p className="text-sm" style={{color: themeStyles.textSecondary}}>Register a new student in the system</p>
                    </div>
                    
                    {/* View All Messages */}
                    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" 
                         style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}
                         onClick={() => setActiveTab("messaging")}>
                      <MessageSquare className="h-8 w-8 text-emerald-600 mb-3" />
                      <h3 className="font-semibold mb-2" style={{color: themeStyles.textPrimary}}>View Messages</h3>
                      <p className="text-sm" style={{color: themeStyles.textSecondary}}>Review parent-teacher communications</p>
                    </div>
                    
                    {/* Export Data */}
                    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" 
                         style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}
                         onClick={() => setActiveTab("exports")}>
                      <Download className="h-8 w-8 text-orange-600 mb-3" />
                      <h3 className="font-semibold mb-2" style={{color: themeStyles.textPrimary}}>Export Data</h3>
                      <p className="text-sm" style={{color: themeStyles.textSecondary}}>Download reports and data exports</p>
                    </div>
                    
                    {/* View Teacher Performance */}
                    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" 
                         style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}
                         onClick={() => setActiveTab("performance-heatmap")}>
                      <BarChart3 className="h-8 w-8 text-red-600 mb-3" />
                      <h3 className="font-semibold mb-2" style={{color: themeStyles.textPrimary}}>Teacher Performance</h3>
                      <p className="text-sm" style={{color: themeStyles.textSecondary}}>View teacher performance analytics</p>
                    </div>
                    
                    {/* Generate Progress Reports */}
                    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" 
                         style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}
                         onClick={() => setActiveTab("progress-reports")}>
                      <FileText className="h-8 w-8 text-teal-600 mb-3" />
                      <h3 className="font-semibold mb-2" style={{color: themeStyles.textPrimary}}>Progress Reports</h3>
                      <p className="text-sm" style={{color: themeStyles.textSecondary}}>Generate detailed student progress reports</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="story-review" className="space-y-6">
              <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle style={{color: themeStyles.textPrimary}}>AI Story Feedback Review</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {/* Placeholder for count - would fetch from API */}
                        4 Recent Reviews
                      </Badge>
                      <Button size="sm" variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p style={{color: themeStyles.textSecondary}} className="mb-6">Review and monitor AI-generated feedback for student creative writing submissions</p>
                  
                  <div className="space-y-4">
                    {/* AI Feedback Reviews List */}
                    <div className="border rounded-lg p-4" style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-bold">TD</span>
                          </div>
                          <div>
                            <h4 className="font-semibold" style={{color: themeStyles.textPrimary}}>Tiffany Demo Daughter</h4>
                            <p className="text-sm" style={{color: themeStyles.textSecondary}}>Grade 7 • Story: "My Adventure in Space"</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800">AI Review Complete</Badge>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            View Full Review
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span style={{color: themeStyles.textSecondary}}>AI Score:</span>
                          <div className="font-medium text-green-600">87/100</div>
                        </div>
                        <div>
                          <span style={{color: themeStyles.textSecondary}}>Strengths Identified:</span>
                          <div className="font-medium" style={{color: themeStyles.textPrimary}}>3 strengths</div>
                        </div>
                        <div>
                          <span style={{color: themeStyles.textSecondary}}>Improvement Areas:</span>
                          <div className="font-medium" style={{color: themeStyles.textPrimary}}>2 areas</div>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>AI Feedback Summary:</strong> "Excellent creativity and character development. Strong use of descriptive language. Consider adding more dialogue and working on paragraph transitions."
                        </p>
                      </div>
                    </div>
                    
                    {/* Sample additional reviews */}
                    <div className="border rounded-lg p-4" style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-bold">JS</span>
                          </div>
                          <div>
                            <h4 className="font-semibold" style={{color: themeStyles.textPrimary}}>John Smith</h4>
                            <p className="text-sm" style={{color: themeStyles.textSecondary}}>Grade 6 • Story: "The Magic Forest"</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
                          <Button size="sm" variant="outline">
                            Generate Review
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm" style={{color: themeStyles.textSecondary}}>
                        <p>Story submitted 2 hours ago. AI feedback generation in progress...</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4" style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border}}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold">EM</span>
                          </div>
                          <div>
                            <h4 className="font-semibold" style={{color: themeStyles.textPrimary}}>Emily Martinez</h4>
                            <p className="text-sm" style={{color: themeStyles.textSecondary}}>Grade 8 • Story: "Time Traveler's Dilemma"</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800">AI Review Complete</Badge>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            View Full Review
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span style={{color: themeStyles.textSecondary}}>AI Score:</span>
                          <div className="font-medium text-green-600">92/100</div>
                        </div>
                        <div>
                          <span style={{color: themeStyles.textSecondary}}>Strengths Identified:</span>
                          <div className="font-medium" style={{color: themeStyles.textPrimary}}>4 strengths</div>
                        </div>
                        <div>
                          <span style={{color: themeStyles.textSecondary}}>Improvement Areas:</span>
                          <div className="font-medium" style={{color: themeStyles.textPrimary}}>1 area</div>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm text-green-800">
                          <strong>AI Feedback Summary:</strong> "Outstanding storytelling with complex plot development. Excellent character growth and conflict resolution. Minor suggestion: vary sentence structure for enhanced flow."
                        </p>
                      </div>
                    </div>
                    
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">12</p>
                        <p className="text-sm text-blue-600">Total Reviews</p>
                      </div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">89.4</p>
                        <p className="text-sm text-green-600">Avg Score</p>
                      </div>
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-600">3</p>
                        <p className="text-sm text-purple-600">Pending</p>
                      </div>
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
                        <p className="text-2xl font-bold text-orange-600">24h</p>
                        <p className="text-sm text-orange-600">Avg Response</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sel-monitoring" className="space-y-6">
              <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                <CardHeader>
                  <CardTitle style={{color: themeStyles.textPrimary}} className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    SEL Lesson Monitoring
                    <Badge variant="secondary" className="ml-2">
                      Active System
                    </Badge>
                  </CardTitle>
                  <CardDescription style={{color: themeStyles.textSecondary}}>
                    Monitor and review Social Emotional Learning lesson assignments and student progress
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* SEL System Overview */}
                  {(() => {
                    const activeLessons = selLessons?.filter((l: any) => l.lesson.status === 'pending').length || 0;
                    const completedLessons = selLessons?.filter((l: any) => l.lesson.status === 'completed').length || 0;
                    const overdueLessons = selLessons?.filter((l: any) => {
                      const dueDate = new Date(l.lesson.dueDate);
                      const now = new Date();
                      return l.lesson.status === 'pending' && dueDate < now;
                    }).length || 0;
                    const successRate = selLessons?.length > 0 ? Math.round((completedLessons / selLessons.length) * 100) : 0;
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-600">{activeLessons}</div>
                          <div className="text-sm text-purple-600">Active Lessons</div>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-600">{completedLessons}</div>
                          <div className="text-sm text-blue-600">Completed</div>
                        </div>
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
                          <div className="text-2xl font-bold text-orange-600">{overdueLessons}</div>
                          <div className="text-sm text-orange-600">Overdue</div>
                        </div>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">{successRate}%</div>
                          <div className="text-sm text-green-600">Success Rate</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Recent SEL Activity */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4" style={{color: themeStyles.textPrimary}}>Recent SEL Lesson Activity</h3>
                    {selLessonsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading SEL lessons...</p>
                      </div>
                    ) : selLessons && selLessons.length > 0 ? (
                      <div className="space-y-3">
                        {selLessons.slice(0, 5).map((lessonData: any) => {
                          const lesson = lessonData.lesson;
                          const scholar = lessonData.scholar;
                          const isOverdue = lesson.status === 'pending' && new Date(lesson.dueDate) < new Date();
                          const statusColor = lesson.status === 'completed' ? 'bg-green-500' : 
                                             isOverdue ? 'bg-red-500' : 'bg-purple-500';
                          const statusText = lesson.status === 'completed' ? 'Completed' :
                                            isOverdue ? 'Overdue' : 'In Progress';
                          const statusVariant = lesson.status === 'completed' ? 'default' :
                                               isOverdue ? 'destructive' : 'secondary';
                          
                          return (
                            <div key={lesson.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {lesson.lessonTitle} - {scholar?.name || 'Unknown Student'}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {lesson.status === 'completed' 
                                      ? `Completed ${lesson.completedAt ? new Date(lesson.completedAt).toLocaleDateString() : 'recently'}`
                                      : `Due: ${new Date(lesson.dueDate).toLocaleDateString()}`
                                    } • {lesson.behaviorType}
                                  </div>
                                </div>
                              </div>
                              <Badge 
                                variant={statusVariant}
                                className={lesson.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                              >
                                {statusText}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">No SEL lessons found</p>
                        <p className="text-sm text-gray-400">
                          SEL lessons will appear here when students receive negative PBIS points
                        </p>
                      </div>
                    )}
                  </div>

                  {/* SEL System Status */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <h4 className="font-medium text-green-800">SEL System Status: Online</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      ✓ Auto-generation active for negative behavior points<br/>
                      ✓ AI lesson creation functioning normally<br/>
                      ✓ Student notification system operational<br/>
                      ✓ Parent/teacher alerts working
                    </p>
                  </div>
                </CardContent>
              </Card>
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

            {/* Advanced Features */}
            <TabsContent value="progress-reports" className="space-y-6">
              <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                <CardHeader>
                  <CardTitle style={{color: themeStyles.textPrimary}}>One-Click Student Progress Report Generator</CardTitle>
                </CardHeader>
                <CardContent>
                  <p style={{color: themeStyles.textSecondary}} className="mb-4">
                    Generate comprehensive progress reports for any student with one click. Advanced AI-powered analytics and insights included.
                  </p>
                  <div className="space-y-4">
                    <ProgressReportGenerator isAdminView={true} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievement-playground" className="space-y-6">
              <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                <CardHeader>
                  <CardTitle style={{color: themeStyles.textPrimary}}>Achievement Playground Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p style={{color: themeStyles.textSecondary}} className="mb-4">
                    Manage student achievement playgrounds and monitor gamified progress across all students
                  </p>
                  <div className="space-y-4">
                    <AchievementPlayground studentId="" className="border-0" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance-heatmap" className="space-y-6">
              <TeacherPerformanceHeatmap />
            </TabsContent>

            <TabsContent value="ai-recommendations" className="space-y-6">
              <AIRecommendationEngine />
            </TabsContent>
          </Tabs>
        </Card>
        </div>

          {/* Modals Section */}
          {/* Admin Photo Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
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
              </Card>
            </div>
          )}
      </div>

      {/* SendGrid Test Email Modal */}
      <Dialog open={showTestEmailModal} onOpenChange={setShowTestEmailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>SendGrid Test Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Test Email Address</Label>
              <Input
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="Enter email address to send test email..."
                type="email"
              />
            </div>
            
            <div className="text-sm text-gray-600 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-blue-800">Test Email Information:</p>
              <p>This will send a test email using your SendGrid configuration to verify that email notifications are working properly.</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestEmailModal(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (!testEmailAddress) {
                  toast({
                    title: "Email Required",
                    description: "Please enter an email address.",
                    variant: "destructive",
                  });
                  return;
                }
                toast({
                  title: "Test Email Sent",
                  description: `Test email sent to ${testEmailAddress} using SendGrid.`,
                });
                setShowTestEmailModal(false);
                setTestEmailAddress("");
              }}
            >
              Send Test Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student QR Code Modal */}
      <Dialog open={showQRCodeModal} onOpenChange={setShowQRCodeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Generate Student QR Codes</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQRCodeModal(false)}
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Individual Student</Label>
                <Select 
                  value={qrCodeStudentId} 
                  onValueChange={setQrCodeStudentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student for QR code..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allScholars?.filter(s => s.username)?.map((scholar) => (
                      <SelectItem key={scholar.id} value={scholar.id}>
                        {scholar.name} (Grade {scholar.grade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 w-full"
                  onClick={async () => {
                    if (!qrCodeStudentId) {
                      toast({
                        title: "Student Required",
                        description: "Please select a student.",
                        variant: "destructive",
                      });
                      return;
                    }
                    const selectedStudent = allScholars?.find(s => s.id === qrCodeStudentId);
                    if (!selectedStudent?.username) {
                      toast({
                        title: "No Login Credentials",
                        description: "This student doesn't have login credentials yet.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    try {
                      const loginUrl = `${window.location.origin}/student-login?username=${encodeURIComponent(selectedStudent.username)}`;
                      const response = await fetch("/api/qr/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          text: loginUrl,
                          filename: `student-qr-${selectedStudent.username}`
                        })
                      });
                      
                      if (!response.ok) throw new Error("Failed to generate QR code");
                      
                      const data = await response.json();
                      
                      // Download the QR code
                      const link = document.createElement('a');
                      link.download = `${selectedStudent.name.replace(/\s+/g, '_')}_login_qr.png`;
                      link.href = data.qrCode;
                      link.click();
                      
                      toast({
                        title: "QR Code Generated",
                        description: `QR code generated and downloaded for ${selectedStudent.name}.`,
                      });
                      setQrCodeStudentId("");
                    } catch (error) {
                      toast({
                        title: "Generation Failed",
                        description: "Unable to generate QR code. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={!qrCodeStudentId}
                >
                  Generate Individual QR
                </Button>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Generate All QR Codes</h4>
                  <p className="text-sm text-gray-600">Generate QR codes for all students with login credentials</p>
                </div>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={async () => {
                    const studentsWithCredentials = allScholars?.filter(s => s.username) || [];
                    if (studentsWithCredentials.length === 0) {
                      toast({
                        title: "No Students Available",
                        description: "No students have login credentials yet.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    try {
                      for (const student of studentsWithCredentials) {
                        const loginUrl = `${window.location.origin}/student-login?username=${encodeURIComponent(student.username)}`;
                        const response = await fetch("/api/qr/generate", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            text: loginUrl,
                            filename: `student-qr-${student.username}`
                          })
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          const link = document.createElement('a');
                          link.download = `${student.name.replace(/\s+/g, '_')}_login_qr.png`;
                          link.href = data.qrCode;
                          link.click();
                          
                          // Add small delay to prevent browser blocking multiple downloads
                          await new Promise(resolve => setTimeout(resolve, 100));
                        }
                      }
                      
                      toast({
                        title: "Bulk Generation Complete",
                        description: `Generated QR codes for ${studentsWithCredentials.length} students.`,
                      });
                      setShowQRCodeModal(false);
                    } catch (error) {
                      toast({
                        title: "Bulk Generation Failed",
                        description: "Some QR codes may not have been generated.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Generate All ({allScholars?.filter(s => s.username)?.length || 0})
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="font-medium text-purple-800">QR Code Information:</p>
              <p>• QR codes contain direct login links with pre-filled usernames</p>
              <p>• Students can scan to access their dashboard instantly</p>
              <p>• Only students with login credentials can have QR codes generated</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Administrator Contact Information Modal */}
      <Dialog open={showContactInfoModal} onOpenChange={setShowContactInfoModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Administrator Contact Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="p-4 border rounded-lg" style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border}}>
              <div className="flex items-center mb-3">
                <User className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="font-semibold text-lg" style={{color: themeStyles.textPrimary}}>Dr. Phillips</h3>
              </div>
              <p className="font-medium text-blue-600 mb-2">Principal</p>
              <div className="space-y-1">
                <p className="text-sm" style={{color: themeStyles.textSecondary}}>
                  <span className="font-medium">Phone:</span> (205) 231-6370
                </p>
                <p className="text-sm" style={{color: themeStyles.textSecondary}}>
                  <span className="font-medium">Role:</span> Principal - Bush Hills STEAM Academy
                </p>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg" style={{backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border}}>
              <div className="flex items-center mb-3">
                <User className="h-6 w-6 text-green-600 mr-3" />
                <h3 className="font-semibold text-lg" style={{color: themeStyles.textPrimary}}>Dr. Stewart</h3>
              </div>
              <p className="font-medium text-green-600 mb-2">Assistant Principal</p>
              <div className="space-y-1">
                <p className="text-sm" style={{color: themeStyles.textSecondary}}>
                  <span className="font-medium">Phone:</span> (205) 231-6370
                </p>
                <p className="text-sm" style={{color: themeStyles.textSecondary}}>
                  <span className="font-medium">Role:</span> Assistant Principal - Bush Hills STEAM Academy
                </p>
              </div>
            </div>
            
            <div className="text-center text-sm p-3 bg-gray-50 border rounded-lg" style={{color: themeStyles.textSecondary}}>
              <p>For administrative matters, please contact the appropriate administrator during school hours.</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setShowContactInfoModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Award MUSTANG Points Modal */}
      <Dialog open={showAwardPointsModal} onOpenChange={setShowAwardPointsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] border-0">
          <DialogHeader className="flex flex-row items-center justify-between sticky top-0 bg-white pb-4">
            <DialogTitle>Award MUSTANG Points</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAwardPointsModal(false)}
              className="h-8 w-8 p-0 border-2 border-gray-600 bg-white hover:bg-red-100 hover:border-red-500"
            >
              ✕
            </Button>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] space-y-4 pt-4 border-0">
            {selectedStudent && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium">Selected Student:</p>
                <p className="text-sm text-gray-600">{selectedStudent.name}</p>
              </div>
            )}
            
            <div>
              <Label>Student</Label>
              <Select 
                value={awardPointsForm.scholarId} 
                onValueChange={(value) => setAwardPointsForm(prev => ({...prev, scholarId: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student..." />
                </SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto">
                  {allScholars?.map((scholar) => (
                    <SelectItem key={scholar.id} value={scholar.id}>
                      {scholar.name} (Grade {scholar.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4">
              <PBISCategorySelector
                selectedCategory={awardPointsForm.category}
                selectedSubcategory={awardPointsForm.subcategory}
                onCategorySelect={(category: string) => setAwardPointsForm(prev => ({...prev, category}))}
                onSubcategorySelect={(subcategory: string) => setAwardPointsForm(prev => ({...prev, subcategory}))}
              />
            </div>
            
            <div>
              <Label>Reason (Optional)</Label>
              <textarea
                value={awardPointsForm.reason}
                onChange={(e) => setAwardPointsForm(prev => ({...prev, reason: e.target.value}))}
                placeholder="Additional notes about this recognition..."
                className="w-full min-h-[80px] px-3 py-2 border border-input bg-background rounded-md text-sm resize-y"
              />
            </div>
            
            <div className="text-sm text-gray-600 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-medium text-green-800">MUSTANG Recognition System:</p>
              <p>• <strong>M</strong>otivated - Makes good choices</p>
              <p>• <strong>U</strong>nderstanding - Shows empathy and kindness</p>
              <p>• <strong>S</strong>killed - Demonstrates academic excellence</p>
              <p>• <strong>T</strong>alented - Showcases unique abilities</p>
              <p>• <strong>A</strong>mazing - Goes above and beyond</p>
              <p>• <strong>N</strong>oble - Acts with integrity</p>
              <p>• <strong>G</strong>reat - Displays leadership qualities</p>
            </div>
          </div>
          
          <DialogFooter className="sticky bottom-0 bg-white pt-4">
            <Button variant="outline" onClick={() => setShowAwardPointsModal(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (!awardPointsForm.scholarId || !awardPointsForm.category || !awardPointsForm.subcategory) {
                  toast({
                    title: "Missing Information",
                    description: "Please select a student, category, and specific recognition.",
                    variant: "destructive",
                  });
                  return;
                }
                
                const selectedStudent = allScholars?.find(s => s.id === awardPointsForm.scholarId);
                toast({
                  title: "MUSTANG Points Awarded",
                  description: `Points successfully awarded to ${selectedStudent?.name}!`,
                });
                
                // Reset form
                setAwardPointsForm({
                  scholarId: "",
                  category: "",
                  subcategory: "",
                  mustangTrait: "",
                  points: 0,
                  reason: ""
                });
                setSelectedStudent(null);
                setShowAwardPointsModal(false);
              }}
              disabled={!awardPointsForm.scholarId || !awardPointsForm.category || !awardPointsForm.subcategory}
            >
              Award MUSTANG Points
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Modal */}
      <Dialog open={showAddStudentModal} onOpenChange={setShowAddStudentModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input
                  value={addStudentForm.firstName}
                  onChange={(e) => setAddStudentForm(prev => ({...prev, firstName: e.target.value}))}
                  placeholder="First name"
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={addStudentForm.lastName}
                  onChange={(e) => setAddStudentForm(prev => ({...prev, lastName: e.target.value}))}
                  placeholder="Last name"
                />
              </div>
            </div>
            
            <div>
              <Label>Student ID</Label>
              <Input
                value={addStudentForm.studentId}
                onChange={(e) => setAddStudentForm(prev => ({...prev, studentId: e.target.value}))}
                placeholder="Student ID"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Grade</Label>
                <Select 
                  value={addStudentForm.grade.toString()} 
                  onValueChange={(value) => setAddStudentForm(prev => ({...prev, grade: parseInt(value)}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6th Grade</SelectItem>
                    <SelectItem value="7">7th Grade</SelectItem>
                    <SelectItem value="8">8th Grade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>House</Label>
                <Select 
                  value={addStudentForm.houseId} 
                  onValueChange={(value) => setAddStudentForm(prev => ({...prev, houseId: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select house..." />
                  </SelectTrigger>
                  <SelectContent>
                    {houses?.map((house) => (
                      <SelectItem key={house.id} value={house.id}>
                        {house.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-800">Login Credentials</h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!addStudentForm.firstName || !addStudentForm.lastName || !addStudentForm.studentId) {
                        toast({
                          title: "Missing Information",
                          description: "Please fill in name and student ID first.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // Generate username: first initial + last name + grade
                      const firstName = addStudentForm.firstName.trim().toLowerCase();
                      const lastName = addStudentForm.lastName.trim().toLowerCase();
                      const grade = addStudentForm.grade;
                      const generatedUsername = `${firstName.charAt(0)}${lastName}${grade}`;
                      
                      // Generate password: BHSA + student ID + !
                      const generatedPassword = `BHSA${addStudentForm.studentId}!`;
                      
                      setAddStudentForm(prev => ({
                        ...prev,
                        username: generatedUsername,
                        password: generatedPassword
                      }));
                      
                      toast({
                        title: "Credentials Generated",
                        description: "Username and password have been automatically generated.",
                      });
                    }}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Auto-Generate
                  </Button>
                </div>
                <p className="text-sm text-blue-600 mb-3">
                  Credentials will be auto-generated when student is added, or click "Auto-Generate" to preview.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Username</Label>
                    <Input
                      value={addStudentForm.username}
                      onChange={(e) => setAddStudentForm(prev => ({...prev, username: e.target.value}))}
                      placeholder="Will be auto-generated"
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={addStudentForm.password}
                      onChange={(e) => setAddStudentForm(prev => ({...prev, password: e.target.value}))}
                      placeholder="Will be auto-generated"
                    />
                  </div>
                </div>
                
                {addStudentForm.username && addStudentForm.password && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                    <p className="text-green-800">
                      <strong>Preview:</strong> Username: {addStudentForm.username} | Password: {addStudentForm.password}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStudentModal(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={async () => {
                // Validate required fields
                if (!addStudentForm.firstName || !addStudentForm.lastName || !addStudentForm.studentId || !addStudentForm.houseId) {
                  toast({
                    title: "Missing Information",
                    description: "Please fill in all required fields.",
                    variant: "destructive",
                  });
                  return;
                }
                
                try {
                  // Auto-generate credentials if not provided
                  let username = addStudentForm.username;
                  let password = addStudentForm.password;
                  
                  if (!username || !password) {
                    const firstName = addStudentForm.firstName.trim().toLowerCase();
                    const lastName = addStudentForm.lastName.trim().toLowerCase();
                    const grade = addStudentForm.grade;
                    username = `${firstName.charAt(0)}${lastName}${grade}`;
                    password = `BHSA${addStudentForm.studentId}!`;
                  }
                  
                  const studentData = {
                    name: `${addStudentForm.firstName.trim()} ${addStudentForm.lastName.trim()}`,
                    studentId: addStudentForm.studentId,
                    grade: addStudentForm.grade,
                    houseId: addStudentForm.houseId,
                    username: username,
                    password: password
                  };
                  
                  // Use the admin scholars endpoint for automatic credential generation
                  const token = localStorage.getItem("adminToken");
                  const response = await fetch("/api/admin/scholars", {
                    method: "POST",
                    headers: {
                      "Authorization": `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(studentData),
                  });
                  
                  if (!response.ok) throw new Error("Failed to add student");
                  
                  const result = await response.json();
                  
                  toast({
                    title: "Student Added Successfully",
                    description: `${result.scholar.name} has been added with username: ${result.generatedUsername}`,
                  });
                  
                  // Reset form
                  setAddStudentForm({
                    firstName: "",
                    lastName: "",
                    studentId: "",
                    grade: 6,
                    houseId: "",
                    username: "",
                    password: ""
                  });
                  
                  setShowAddStudentModal(false);
                  
                  // Refresh data
                  queryClient.invalidateQueries({ queryKey: ["/api/scholars"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/houses"] });
                  
                } catch (error) {
                  toast({
                    title: "Error Adding Student",
                    description: "Failed to add student. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Add Student with Auto-Generated Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Student Modal */}
      <Dialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedStudent && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-medium text-red-800">Student to Deactivate:</p>
                <p className="text-sm text-red-600">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                <p className="text-xs text-red-500">Grade: {selectedStudent.grade} • ID: {selectedStudent.studentId}</p>
              </div>
            )}
            
            <div>
              <Label>Reason for Deactivation</Label>
              <Input
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                placeholder="Enter reason for deactivation..."
              />
            </div>
            
            <div className="text-sm text-gray-600 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="font-medium text-yellow-800">Warning:</p>
              <p>This action will deactivate the student's account. They will no longer be able to log in to the system.</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                toast({
                  title: "Student Deactivated",
                  description: "Student account has been deactivated.",
                });
                setShowDeactivateModal(false);
                setDeactivationReason("");
              }}
            >
              Deactivate Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* House Students Modal */}
      <Dialog open={showHouseStudentsModal} onOpenChange={setShowHouseStudentsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Students in {selectedHouseName}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHouseStudentsModal(false)}
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] space-y-3">
            {selectedHouseStudents.length > 0 ? (
              selectedHouseStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">{student.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{student.name}</h4>
                      <p className="text-sm text-gray-600">
                        Grade {student.grade} • ID: {student.studentId}
                      </p>
                      <p className="text-xs text-gray-500">
                        Points: Academic {student.academicPoints}, Behavior {student.behaviorPoints}, Attendance {student.attendancePoints}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {student.username && (
                      <Badge variant="secondary">Has Login</Badge>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedStudent(student);
                        setAwardPointsForm({
                          scholarId: student.id,
                          category: "",
                          subcategory: "",
                          mustangTrait: "",
                          points: 0,
                          reason: ""
                        });
                        setShowAwardPointsModal(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Award className="w-3 h-3 mr-1" />
                      Award Points
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No students assigned to this house yet.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={showNotificationPanel}
        onClose={() => setShowNotificationPanel(false)}
      />
    </div>
  );
}