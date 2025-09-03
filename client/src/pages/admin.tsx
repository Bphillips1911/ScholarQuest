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
import { Download, RefreshCw, UserPlus, Plus, CheckCircle, Clock, Users, GraduationCap, Award, LogOut, User, MessageSquare, Send, Reply, Camera, Image, Palette } from "lucide-react";
import { useLocation } from "wouter";
import type { House, Scholar, TeacherAuth } from "@shared/schema";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function Admin() {
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

  // Fetch data hooks - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
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

  useEffect(() => {
    console.log("Admin component mounted");
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

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* CRITICAL NAVIGATION - VERY VISIBLE */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#ff0000',
        color: 'white',
        padding: '30px',
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        border: '5px solid #ffffff',
        boxShadow: '0 0 20px rgba(255,0,0,0.8)'
      }}>
        🚨 MAIN SYSTEM NAVIGATION - CLICK LINKS BELOW 🚨
      </div>
      <div style={{
        position: 'fixed',
        top: '100px',
        left: 0,
        right: 0,
        zIndex: 9998,
        backgroundColor: '#0000ff',
        color: 'white',
        padding: '20px',
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        border: '3px solid #ffffff'
      }}>
        <button onClick={() => window.location.href = '/dashboard'} style={{color: 'white', backgroundColor: '#1d4ed8', border: 'none', padding: '15px 20px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold'}}>Dashboard</button>
        <button onClick={() => window.location.href = '/tutorial'} style={{color: 'white', backgroundColor: '#1d4ed8', border: 'none', padding: '15px 20px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold'}}>Tutorial</button>
        <button onClick={() => window.location.href = '/houses'} style={{color: 'white', backgroundColor: '#1d4ed8', border: 'none', padding: '15px 20px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold'}}>Houses</button>
        <button onClick={() => window.location.href = '/pbis'} style={{color: 'white', backgroundColor: '#1d4ed8', border: 'none', padding: '15px 20px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold'}}>PBIS</button>
        <button onClick={() => window.location.href = '/monthly-pbis'} style={{color: 'white', backgroundColor: '#1d4ed8', border: 'none', padding: '15px 20px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold'}}>Monthly Tracking</button>
        <button onClick={() => window.location.href = '/pledge'} style={{color: 'white', backgroundColor: '#1d4ed8', border: 'none', padding: '15px 20px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold'}}>House Pledge</button>
        <button onClick={() => window.location.href = '/parent-letter'} style={{color: 'white', backgroundColor: '#1d4ed8', border: 'none', padding: '15px 20px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold'}}>Parent Letter</button>
        <button onClick={() => window.location.href = '/house-sorting'} style={{color: 'white', backgroundColor: '#1d4ed8', border: 'none', padding: '15px 20px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold'}}>House Sorting</button>
      </div>
      <div style={{marginTop: '200px'}}></div>

      <div className="bg-blue-600 text-white shadow-lg border-b-4 border-blue-800" style={{height: '60px', display: 'none'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-full py-3">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setLocation('/dashboard')}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white hover:text-blue-200 transition-colors bg-blue-700 hover:bg-blue-800 rounded"
                data-testid="nav-dashboard"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setLocation('/tutorial')}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white hover:text-blue-200 transition-colors bg-blue-700 hover:bg-blue-800 rounded"
                data-testid="nav-tutorial"
              >
                <BookOpen className="h-4 w-4" />
                <span>Tutorial</span>
              </button>
              <button
                onClick={() => setLocation('/houses')}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white hover:text-blue-200 transition-colors bg-blue-700 hover:bg-blue-800 rounded"
                data-testid="nav-houses"
              >
                <Trophy className="h-4 w-4" />
                <span>Houses</span>
              </button>
              <button
                onClick={() => setLocation('/pbis')}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white hover:text-blue-200 transition-colors bg-blue-700 hover:bg-blue-800 rounded"
                data-testid="nav-pbis"
              >
                <Award className="h-4 w-4" />
                <span>PBIS</span>
              </button>
              <button
                onClick={() => setLocation('/monthly-pbis')}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white hover:text-blue-200 transition-colors bg-blue-700 hover:bg-blue-800 rounded"
                data-testid="nav-monthly"
              >
                <Calendar className="h-4 w-4" />
                <span>Monthly Tracking</span>
              </button>
              <button
                onClick={() => setLocation('/pledge')}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white hover:text-blue-200 transition-colors bg-blue-700 hover:bg-blue-800 rounded"
                data-testid="nav-pledge"
              >
                <Heart className="h-4 w-4" />
                <span>House Pledge</span>
              </button>
              <button
                onClick={() => setLocation('/parent-letter')}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white hover:text-blue-200 transition-colors bg-blue-700 hover:bg-blue-800 rounded"
                data-testid="nav-parent-letter"
              >
                <FileText className="h-4 w-4" />
                <span>Parent Letter</span>
              </button>
              <button
                onClick={() => setLocation('/house-sorting')}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white hover:text-blue-200 transition-colors bg-blue-700 hover:bg-blue-800 rounded"
                data-testid="nav-house-sorting"
              >
                <Shuffle className="h-4 w-4" />
                <span>House Sorting</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Dashboard Content */}
      <section className="p-8" data-testid="admin-section">
        <Card className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="flex items-center">
            <img 
              src={schoolLogoPath} 
              alt="Bush Hills STEAM Academy" 
              className="h-12 w-auto mr-4 school-logo-3d"
              data-testid="admin-school-logo"
            />
            <div>
              <h2 className="text-3xl font-bold text-gray-900" data-testid="admin-title">Administration Portal</h2>
              <p className="text-gray-600">Welcome, {adminData?.firstName} {adminData?.lastName} ({adminData?.title})</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
            <Link href="/admin-settings">
              <Button 
                className="bg-gray-600 text-white hover:bg-gray-700"
                data-testid="button-admin-settings"
              >
                <Settings className="mr-2 h-4 w-4" />
                Email Settings
              </Button>
            </Link>
            <Button 
              onClick={() => window.open("/parent-letter", "_blank")}
              className="bg-blue-600 text-white hover:bg-blue-700"
              data-testid="button-parent-portal"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Parent Portal Info
            </Button>
            <Button 
              onClick={() => handleExportData('csv')}
              className="bg-green-600 text-white hover:bg-green-700"
              data-testid="button-export-csv"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button 
              onClick={() => handleExportData('excel')}
              className="bg-green-700 text-white hover:bg-green-800"
              data-testid="button-export-excel"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button 
              asChild 
              className="bg-blue-600 text-white hover:bg-blue-700"
              data-testid="button-qr-generator"
            >
              <Link href="/qr-generator">
                <QrCode className="mr-2 h-4 w-4" />
                Student QR Code
              </Link>
            </Button>
            <Button 
              onClick={handleResetPoints}
              variant="destructive"
              data-testid="button-reset-points"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset Semester
            </Button>
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="clear-both pt-6 border-t border-gray-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto mb-6" data-testid="admin-tabs-list">
            <TabsTrigger value="dashboard" className="flex items-center justify-center text-sm px-2 py-3" data-testid="tab-dashboard">
              <GraduationCap className="mr-1 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">House Management</span>
              <span className="sm:hidden">Houses</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center justify-center text-sm px-2 py-3" data-testid="tab-students">
              <Users className="mr-1 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Student Information</span>
              <span className="sm:hidden">Students</span>
            </TabsTrigger>
            <TabsTrigger 
              value="messaging" 
              className="flex items-center justify-center text-sm px-2 py-3" 
              data-testid="tab-messaging"
              onClick={() => setActiveTab("messaging")}
            >
              <MessageSquare className="mr-1 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Admin Messaging</span>
              <span className="sm:hidden">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="exports" className="flex items-center justify-center text-sm px-2 py-3" data-testid="tab-exports">
              <Download className="mr-1 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Data Export</span>
              <span className="sm:hidden">Export</span>
            </TabsTrigger>
            <TabsTrigger value="quick-actions" className="flex items-center justify-center text-sm px-2 py-3" data-testid="tab-quick-actions">
              <Settings className="mr-1 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Quick Actions</span>
              <span className="sm:hidden">Actions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            {/* Add Points Form */}
            <div className="mb-8">
              <AddPointsForm />
            </div>

        {/* Teacher Approval Section */}
        {pendingTeachers && pendingTeachers.length > 0 && (
          <div className="mb-8">
            <Card className="border border-amber-200 bg-amber-50" data-testid="teacher-approval-card">
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
                      data-testid={`pending-teacher-${teacher.id}`}
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900" data-testid={`teacher-name-${teacher.id}`}>
                          {teacher.name}
                        </h4>
                        <p className="text-sm text-gray-600" data-testid={`teacher-email-${teacher.id}`}>
                          {teacher.email}
                        </p>
                        <p className="text-sm text-gray-500" data-testid={`teacher-role-${teacher.id}`}>
                          {teacher.gradeRole} • {teacher.subject}
                        </p>
                        <p className="text-xs text-gray-400" data-testid={`teacher-date-${teacher.id}`}>
                          Applied: {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <Button
                        onClick={() => approveTeacherMutation.mutate(teacher.id)}
                        disabled={approveTeacherMutation.isPending}
                        className="bg-green-600 text-white hover:bg-green-700"
                        data-testid={`button-approve-${teacher.id}`}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {approveTeacherMutation.isPending ? "Approving..." : "Approve"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Scholar Management and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Add New Scholar */}
          <Card className="border border-gray-200" data-testid="add-scholar-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Add New Scholar</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddScholar} className="space-y-4">
                <div>
                  <Label htmlFor="student-name" className="text-sm font-medium text-gray-700 mb-2">
                    Student Name
                  </Label>
                  <Input
                    id="student-name"
                    type="text"
                    placeholder="Enter full name"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    data-testid="input-student-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="student-id" className="text-sm font-medium text-gray-700 mb-2">
                    Student ID
                  </Label>
                  <Input
                    id="student-id"
                    type="text"
                    placeholder="Enter student ID"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    data-testid="input-student-id"
                  />
                </div>

                <div>
                  <Label htmlFor="student-house" className="text-sm font-medium text-gray-700 mb-2">
                    Assign to House
                  </Label>
                  <Select value={newStudentHouse} onValueChange={setNewStudentHouse} data-testid="select-student-house">
                    <SelectTrigger id="student-house">
                      <SelectValue placeholder="Auto-assign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto" data-testid="option-auto-assign">Auto-assign</SelectItem>
                      {houses?.map((house) => (
                        <SelectItem key={house.id} value={house.id} data-testid={`option-house-${house.id}`}>
                          {house.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  disabled={addScholarMutation.isPending}
                  data-testid="button-add-scholar"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {addScholarMutation.isPending ? "Adding..." : "Add Scholar"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border border-gray-200" data-testid="recent-activity-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {recentEntries.length > 0 ? (
                  recentEntries.map((entry, index) => {
                    const house = houses?.find(h => h.id === entry.houseId);
                    const categoryColors = {
                      academic: "bg-blue-50 text-blue-600",
                      attendance: "bg-green-50 text-green-600",
                      behavior: "bg-purple-50 text-purple-600",
                    };
                    
                    return (
                      <div 
                        key={entry.id} 
                        className={`flex items-center justify-between p-3 rounded-lg ${categoryColors[entry.category as keyof typeof categoryColors]}`}
                        data-testid={`activity-item-${index}`}
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center mr-3">
                            <Plus className="text-xs" />
                          </div>
                          <div>
                            <p className="text-sm font-medium" data-testid={`activity-description-${index}`}>
                              {entry.points} points added to {house?.name?.replace("House of ", "")}
                            </p>
                            <p className="text-xs opacity-75" data-testid={`activity-category-${index}`}>
                              {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)} 
                              {entry.reason && ` - ${entry.reason}`}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs opacity-60" data-testid={`activity-time-${index}`}>
                          {entry.createdAt ? new Date(entry.createdAt!).toLocaleTimeString() : 'Now'}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 py-8" data-testid="no-activity-message">
                    No recent activity to display.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* House Management */}
        <div className="bg-gray-50 rounded-xl p-6" data-testid="house-management-section">
          <h3 className="text-xl font-bold text-gray-900 mb-6">House Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {houses?.map((house) => {
              const totalPoints = house.academicPoints + house.attendancePoints + house.behaviorPoints;
              const houseColorClass = {
                franklin: "bg-house-franklin",
                tesla: "bg-house-tesla",
                curie: "bg-house-curie", 
                nobel: "bg-house-nobel",
                lovelace: "bg-house-lovelace",
              }[house.id] || "bg-house-franklin";

              return (
                <Card key={house.id} className="border border-gray-200" data-testid={`house-management-${house.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900" data-testid={`house-mgmt-name-${house.id}`}>
                        {house.name.replace("House of ", "")}
                      </h4>
                      <div className={`w-6 h-6 ${houseColorClass} rounded-full`}></div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Scholars:</span>
                        <span className="font-medium" data-testid={`house-mgmt-scholars-${house.id}`}>
                          {house.memberCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Points:</span>
                        <span className="font-medium" data-testid={`house-mgmt-points-${house.id}`}>
                          {totalPoints.toLocaleString()}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs hover:bg-gray-200"
                        onClick={() => window.location.href = `/houses/${house.id}`}
                        data-testid={`button-manage-house-${house.id}`}
                      >
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
            </TabsContent>

            <TabsContent value="students" className="mt-6">
              <div className="space-y-6">
                {/* Student Portal Overview */}
                <Card className="border border-blue-200 bg-blue-50" data-testid="student-overview-card">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-blue-900 flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Student Portal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-blue-600" data-testid="total-students-count">
                          {allScholars?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Total Students</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-green-600" data-testid="students-with-credentials">
                          {allScholars?.filter(s => s.username).length || 0}
                        </div>
                        <div className="text-sm text-gray-600">With Login Credentials</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-orange-600" data-testid="password-reset-requests">
                          {allScholars?.filter(s => s.needsPasswordReset).length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Password Resets Needed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Student Information */}
                <Card data-testid="detailed-student-info-card">
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
                            <div key={scholar.id} className="border rounded-lg p-4 hover:bg-gray-50" data-testid={`student-info-${scholar.id}`}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div 
                                    className="w-4 h-4 rounded-full" 
                                    style={{ backgroundColor: houseColor }}
                                  ></div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900" data-testid={`student-name-${scholar.id}`}>
                                      {scholar.name}
                                    </h4>
                                    <p className="text-sm text-gray-600" data-testid={`student-id-${scholar.id}`}>
                                      ID: {scholar.studentId} • Grade: {scholar.grade}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <Badge variant={scholar.username ? "default" : "secondary"} data-testid={`login-status-${scholar.id}`}>
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
                                    <Badge variant="destructive" data-testid={`reset-needed-${scholar.id}`}>
                                      Reset Needed
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">House:</span>
                                  <div className="font-medium" data-testid={`student-house-${scholar.id}`}>
                                    {house?.name?.replace("House of ", "") || "Unassigned"}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Total Points:</span>
                                  <div className="font-medium text-blue-600" data-testid={`student-total-points-${scholar.id}`}>
                                    {totalPoints}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Academic:</span>
                                  <div className="font-medium text-green-600" data-testid={`student-academic-${scholar.id}`}>
                                    {scholar.academicPoints}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Behavior:</span>
                                  <div className="font-medium text-purple-600" data-testid={`student-behavior-${scholar.id}`}>
                                    {scholar.behaviorPoints}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                                <div>
                                  <span className="text-gray-600">Attendance Points:</span>
                                  <div className="font-medium text-orange-600" data-testid={`student-attendance-${scholar.id}`}>
                                    {scholar.attendancePoints}
                                  </div>
                                </div>
                                {scholar.username && (
                                  <div>
                                    <span className="text-gray-600">Username:</span>
                                    <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded" data-testid={`student-username-${scholar.id}`}>
                                      {scholar.username}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8" data-testid="no-students-message">
                        No students found in the system.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="messaging" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Send Message Form */}
                <Card className="border border-blue-200" data-testid="send-message-card">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-blue-900 flex items-center">
                      <Send className="mr-2 h-5 w-5" />
                      Send Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSendMessage} className="space-y-4">
                      <div>
                        <Label htmlFor="recipient-type" className="text-sm font-medium text-gray-700 mb-2">
                          Send to
                        </Label>
                        <Select value={messageRecipientType} onValueChange={setMessageRecipientType} data-testid="select-recipient-type">
                          <SelectTrigger id="recipient-type">
                            <SelectValue placeholder="Select recipient type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="teacher" data-testid="option-teacher">Teacher</SelectItem>
                            <SelectItem value="parent" data-testid="option-parent">Parent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {messageRecipientType === "teacher" && (
                        <div>
                          <Label htmlFor="teacher-select" className="text-sm font-medium text-gray-700 mb-2">
                            Select Teacher
                          </Label>
                          <Select value={messageTeacherId} onValueChange={setMessageTeacherId} data-testid="select-teacher">
                            <SelectTrigger id="teacher-select">
                              <SelectValue placeholder="Choose a teacher" />
                            </SelectTrigger>
                            <SelectContent>
                              {(allTeachers && Array.isArray(allTeachers)) ? allTeachers.map((teacher: any) => (
                                <SelectItem key={teacher.id} value={teacher.id.toString()} data-testid={`option-teacher-${teacher.id}`}>
                                  {teacher.name} ({teacher.gradeRole})
                                </SelectItem>
                              )) : []}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {messageRecipientType === "parent" && (
                        <div>
                          <Label htmlFor="parent-select" className="text-sm font-medium text-gray-700 mb-2">
                            Select Parent
                          </Label>
                          <Select value={messageParentId} onValueChange={setMessageParentId} data-testid="select-parent">
                            <SelectTrigger id="parent-select">
                              <SelectValue placeholder="Choose a parent" />
                            </SelectTrigger>
                            <SelectContent>
                              {(allParents && Array.isArray(allParents)) ? allParents.map((parent: any) => (
                                <SelectItem key={parent.id} value={parent.id.toString()} data-testid={`option-parent-${parent.id}`}>
                                  {parent.firstName} {parent.lastName} ({parent.email})
                                </SelectItem>
                              )) : []}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="message-priority" className="text-sm font-medium text-gray-700 mb-2">
                          Priority
                        </Label>
                        <Select value={messagePriority} onValueChange={setMessagePriority} data-testid="select-priority">
                          <SelectTrigger id="message-priority">
                            <SelectValue placeholder="Normal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal" data-testid="option-priority-normal">Normal</SelectItem>
                            <SelectItem value="high" data-testid="option-priority-high">High</SelectItem>
                            <SelectItem value="urgent" data-testid="option-priority-urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="message-subject" className="text-sm font-medium text-gray-700 mb-2">
                          Subject
                        </Label>
                        <Input
                          id="message-subject"
                          type="text"
                          placeholder="Message subject"
                          value={messageSubject}
                          onChange={(e) => setMessageSubject(e.target.value)}
                          data-testid="input-message-subject"
                        />
                      </div>

                      <div>
                        <Label htmlFor="message-content" className="text-sm font-medium text-gray-700 mb-2">
                          Message
                        </Label>
                        <textarea
                          id="message-content"
                          placeholder="Type your message here..."
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                          data-testid="textarea-message-content"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                        disabled={sendMessageMutation.isPending}
                        data-testid="button-send-message"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Message History */}
                <Card className="border border-gray-200" data-testid="message-history-card">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Message History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {(adminMessages && Array.isArray(adminMessages) && adminMessages.length > 0) ? (
                        adminMessages.map((message: any, index: number) => (
                          <div 
                            key={message.id} 
                            className={`p-4 rounded-lg border ${
                              message.priority === "urgent" ? "border-red-200 bg-red-50" :
                              message.priority === "high" ? "border-amber-200 bg-amber-50" :
                              "border-gray-200 bg-gray-50"
                            }`}
                            data-testid={`message-item-${index}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900" data-testid={`message-subject-${index}`}>
                                  {message.subject}
                                </h4>
                                <p className="text-sm text-gray-600" data-testid={`message-recipient-${index}`}>
                                  To: {message.recipientName ? `${message.recipientType === "teacher" ? "Teacher" : "Parent"} ${message.recipientName}` : `${message.recipientType} ${message.teacherId || message.parentId}`}
                                </p>
                                <p className="text-sm text-gray-500" data-testid={`message-sender-${index}`}>
                                  From: {message.sender_name || 'Unknown'} ({message.actual_sender_type || message.senderType || 'unknown'})
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex gap-2 justify-end mb-2">
                                  <Badge 
                                    variant={
                                      message.actual_sender_type === 'admin' ? "destructive" :
                                      message.actual_sender_type === 'parent' ? "default" : 
                                      "secondary"
                                    }
                                    className="text-xs"
                                    data-testid={`message-sender-badge-${index}`}
                                  >
                                    {message.actual_sender_type || message.senderType || 'unknown'}
                                  </Badge>
                                  <Badge 
                                    variant={
                                      message.priority === "urgent" ? "destructive" :
                                      message.priority === "high" ? "secondary" :
                                      "outline"
                                    }
                                    data-testid={`message-priority-${index}`}
                                  >
                                    {message.priority}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 mt-1" data-testid={`message-time-${index}`}>
                                  {(() => {
                                    // DEPLOYMENT FIX - Enhanced date handling for deployment sync
                                    const dateValue = message.createdAt || message.created_at;
                                    if (!dateValue) return 'Recently';
                                    
                                    try {
                                      const date = new Date(dateValue);
                                      if (isNaN(date.getTime())) {
                                        console.log('DEPLOYMENT: Invalid date detected:', dateValue);
                                        return 'Recently';
                                      }
                                      return date.toLocaleString();
                                    } catch (error) {
                                      console.log('DEPLOYMENT: Date parsing error:', error, dateValue);
                                      return 'Recently';
                                    }
                                  })()}
                                </p>
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm" data-testid={`message-content-${index}`}>
                              {message.message}
                            </p>
                            
                            {/* Reply Button - Show only for messages FROM parents/teachers TO admin */}
                            {(message.senderType === "parent" || message.senderType === "teacher" || message.sender_type === "parent" || message.sender_type === "teacher") && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMessage(message);
                                    setReplyForm({
                                      subject: message.subject.startsWith("Re: ") ? message.subject : `Re: ${message.subject}`,
                                      message: "",
                                      priority: message.priority || "normal"
                                    });
                                    setShowReplyModal(true);
                                  }}
                                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  data-testid={`button-reply-${index}`}
                                >
                                  <Reply className="h-4 w-4" />
                                  Reply
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-8" data-testid="no-messages">
                          No messages sent yet.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Reply Modal */}
              {showReplyModal && selectedMessage && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowReplyModal(false);
                      setSelectedMessage(null);
                      setReplyForm({ subject: "", message: "", priority: "normal" });
                    }
                  }}
                >
                  <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white border-b">
                      <div>
                        <CardTitle>Reply to Message</CardTitle>
                        <p className="text-sm text-gray-600">
                          Replying to: {selectedMessage.senderType === "teacher" || selectedMessage.sender_type === "teacher" ? "Teacher" : "Parent"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowReplyModal(false);
                          setSelectedMessage(null);
                          setReplyForm({ subject: "", message: "", priority: "normal" });
                        }}
                        className="h-10 w-10 p-0 border-2 border-gray-600 bg-white hover:bg-red-100 hover:border-red-500"
                        data-testid="button-close-reply-modal"
                      >
                        <span className="text-xl font-bold text-gray-800 hover:text-red-600">✕</span>
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        
                        if (!replyForm.subject.trim() || !replyForm.message.trim()) {
                          toast({
                            title: "Missing Information",
                            description: "Please fill in subject and message content.",
                            variant: "destructive",
                          });
                          return;
                        }

                        const replyData = {
                          recipientType: selectedMessage.senderType === "teacher" || selectedMessage.sender_type === "teacher" ? "teacher" : "parent",
                          teacherId: selectedMessage.senderType === "teacher" || selectedMessage.sender_type === "teacher" ? selectedMessage.teacherId || selectedMessage.teacher_id : null,
                          parentId: selectedMessage.senderType === "parent" || selectedMessage.sender_type === "parent" ? selectedMessage.parentId || selectedMessage.parent_id : null,
                          subject: replyForm.subject,
                          message: replyForm.message,
                          priority: replyForm.priority,
                          replyToMessageId: selectedMessage.id
                        };
                        
                        replyMutation.mutate(replyData);
                      }}>
                        
                        {/* Subject */}
                        <div>
                          <Label htmlFor="replySubject">Subject</Label>
                          <Input
                            id="replySubject"
                            value={replyForm.subject}
                            onChange={(e) => setReplyForm({...replyForm, subject: e.target.value})}
                            placeholder="Enter reply subject"
                            required
                            data-testid="input-reply-subject"
                          />
                        </div>
                        
                        {/* Message */}
                        <div>
                          <Label htmlFor="replyMessage">Message</Label>
                          <textarea
                            id="replyMessage"
                            value={replyForm.message}
                            onChange={(e) => setReplyForm({...replyForm, message: e.target.value})}
                            placeholder="Type your reply here..."
                            className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            data-testid="textarea-reply-message"
                          />
                        </div>

                        {/* Priority */}
                        <div>
                          <Label htmlFor="replyPriority">Priority</Label>
                          <Select 
                            value={replyForm.priority} 
                            onValueChange={(value) => setReplyForm({...replyForm, priority: value})}
                          >
                            <SelectTrigger data-testid="select-reply-priority">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low" data-testid="option-reply-priority-low">Low</SelectItem>
                              <SelectItem value="normal" data-testid="option-reply-priority-normal">Normal</SelectItem>
                              <SelectItem value="high" data-testid="option-reply-priority-high">High</SelectItem>
                              <SelectItem value="urgent" data-testid="option-reply-priority-urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                          <Button
                            type="submit"
                            className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                            disabled={replyMutation.isPending || !replyForm.subject.trim() || !replyForm.message.trim()}
                            data-testid="button-send-reply"
                          >
                            <Send className="mr-2 h-4 w-4" />
                            {replyMutation.isPending ? "Sending..." : "Send Reply"}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setShowReplyModal(false);
                              setSelectedMessage(null);
                              setReplyForm({ subject: "", message: "", priority: "normal" });
                            }}
                            data-testid="button-cancel-reply"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}
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
                          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                          data-testid="button-export-csv"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          Export CSV
                        </Button>
                        <Button 
                          onClick={() => handleExportData('excel')}
                          className="flex items-center gap-2 bg-green-700 text-white hover:bg-green-800"
                          data-testid="button-export-excel"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
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
                        data-testid="button-monthly-reports"
                      >
                        <QrCode className="h-4 w-4" />
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
                    asChild 
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    data-testid="button-qr-generator"
                  >
                    <Link href="/qr-generator">
                      Generate QR Codes
                    </Link>
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
                    asChild 
                    className="w-full"
                    data-testid="button-house-sorting"
                  >
                    <Link href="/admin-sorting">
                      House Sorting
                    </Link>
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
                    asChild 
                    className="w-full"
                    data-testid="button-pbis-management"
                  >
                    <Link href="/admin-pbis">
                      PBIS Management
                    </Link>
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
                  <p className="text-sm text-gray-600 mb-4">Configure system settings and permissions</p>
                  <Button 
                    asChild 
                    variant="outline"
                    className="w-full"
                    data-testid="button-admin-settings"
                  >
                    <Link href="/admin-settings">
                      Admin Settings
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Password Reset */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Key className="mr-2 h-5 w-5" />
                    Reset Semester
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">Reset all house points for new semester</p>
                  <Button 
                    onClick={handleResetPoints}
                    variant="destructive"
                    className="w-full"
                    data-testid="button-reset-points-quick"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset Semester
                  </Button>
                </CardContent>
              </Card>

              {/* Tutorial Access */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Tutorial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">Access system tutorial and guides</p>
                  <Button 
                    asChild 
                    variant="outline"
                    className="w-full"
                    data-testid="button-tutorial"
                  >
                    <Link href="/tutorial">
                      View Tutorial
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          </Tabs>
        </div>
      </Card>
      </section>
    </div>
  );
}
