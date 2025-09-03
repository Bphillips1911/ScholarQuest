import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GameModal } from "@/components/games/GameModal";
import { ReflectionLogs } from "@/components/admin/ReflectionLogs";
import { ProgressReportGenerator } from "@/components/ProgressReportGenerator";
import { AchievementPlayground } from "@/components/AchievementPlayground";
import { TeacherPerformanceHeatmap } from "@/components/TeacherPerformanceHeatmap";
import { AIRecommendationEngine } from "@/components/AIRecommendationEngine";
import { AdminTeacherViewer } from "@/components/AdminTeacherViewer";
import { 
  Users, 
  GraduationCap, 
  Award, 
  LogOut, 
  MessageSquare, 
  Camera, 
  BarChart3, 
  Brain, 
  FileText, 
  Trophy,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  Target,
  Layers,
  Download,
  RefreshCw,
  UserPlus,
  Plus,
  CheckCircle,
  Clock,
  Send,
  Reply,
  Image,
  Palette,
  Eye,
  Mail,
  TestTube,
  Settings
} from "lucide-react";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";
import type { House, Scholar, TeacherAuth } from "@shared/schema";

export default function ModernAdminDashboard() {
  const [activeTab, setActiveTab] = useState("scholars-dashboard");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const [currentTheme, setCurrentTheme] = useState<'normal' | 'light' | 'dark'>('normal');

  // Theme toggle function
  const toggleTheme = () => {
    setCurrentTheme(prev => {
      if (prev === 'normal') return 'light';
      if (prev === 'light') return 'dark';
      return 'normal';
    });
  };

  // Theme styles
  const themeStyles = {
    normal: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      cardBg: '#ffffff',
      textPrimary: '#1a202c',
      textSecondary: '#4a5568',
      border: '#e2e8f0'
    },
    light: {
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      cardBg: '#f7fafc',
      textPrimary: '#2d3748',
      textSecondary: '#4a5568',
      border: '#cbd5e0'
    },
    dark: {
      background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
      cardBg: '#2d3748',
      textPrimary: '#f7fafc',
      textSecondary: '#cbd5e0',
      border: '#4a5568'
    }
  }[currentTheme];

  // Photo upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [photoDescription, setPhotoDescription] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [showGameModal, setShowGameModal] = useState(false);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const storedAdminData = localStorage.getItem("adminData");
    
    if (token && storedAdminData) {
      setIsAuthenticated(true);
      setAdminData(JSON.parse(storedAdminData));
    } else {
      setLocation("/admin-login");
    }
  }, [setLocation]);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    setLocation("/admin-login");
  };

  // Fetch all data
  const { data: pendingTeachers = [] } = useQuery({
    queryKey: ["/api/admin/teachers/pending"],
    queryFn: async () => {
      const response = await fetch("/api/admin/teachers/pending", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("adminToken")}` }
      });
      if (!response.ok) throw new Error("Failed to fetch pending teachers");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const { data: allScholars = [] } = useQuery({
    queryKey: ["/api/scholars"],
    enabled: isAuthenticated,
  });

  const { data: houses = [] } = useQuery({
    queryKey: ["/api/houses"],
    enabled: isAuthenticated,
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ["/api/badges"],
    enabled: isAuthenticated,
  });

  const { data: allGames = [] } = useQuery({
    queryKey: ["/api/games"],
    enabled: isAuthenticated,
  });

  const { data: galleryPhotos = [] } = useQuery({
    queryKey: ["/api/pbis-photos"],
    enabled: isAuthenticated,
  });

  const { data: adminMessages = [] } = useQuery({
    queryKey: ["/api/admin/messages"],
    queryFn: async () => {
      const response = await fetch("/api/admin/messages", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("adminToken")}` }
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Mutations
  const approveTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      return apiRequest(`/api/admin/approve-teacher/${teacherId}`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers/pending"] });
      toast({ title: "Teacher approved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to approve teacher", variant: "destructive" });
    },
  });

  const sendTeacherNotificationsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/admin/send-teacher-notifications", { method: "POST" });
    },
    onSuccess: () => {
      toast({ title: "Notifications sent successfully" });
    },
    onError: () => {
      toast({ title: "Failed to send notifications", variant: "destructive" });
    },
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: async (data: { email: string; name: string }) => {
      return apiRequest("/api/admin/send-test-email", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Test email sent successfully" });
    },
    onError: () => {
      toast({ title: "Failed to send test email", variant: "destructive" });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ file, description }: { file: File; description: string }) => {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("description", description);
      formData.append("uploadedBy", adminData?.firstName + " " + adminData?.lastName || "Admin");

      const response = await fetch("/api/upload-pbis-photo", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("adminToken")}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload photo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pbis-photos"] });
      setUploadedFile(null);
      setPhotoDescription("");
      setShowUploadModal(false);
      toast({ title: "Photo uploaded successfully" });
    },
    onError: () => {
      toast({ title: "Upload failed", variant: "destructive" });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedFile(file);
    } else {
      toast({ title: "Please select an image file", variant: "destructive" });
    }
  };

  const handleUploadPhoto = () => {
    if (!uploadedFile) {
      toast({ title: "Please select a photo to upload", variant: "destructive" });
      return;
    }
    uploadPhotoMutation.mutate({ file: uploadedFile, description: photoDescription });
  };

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: themeStyles.background }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={schoolLogoPath} 
                alt="Bush Hills STEAM Academy" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-white/80">Welcome, {adminData?.firstName} {adminData?.lastName} ({adminData?.title})</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={toggleTheme}
                variant="outline"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Palette className="h-4 w-4 mr-2" />
                {currentTheme === 'normal' ? 'Normal' : currentTheme === 'light' ? 'Light' : 'Dark'}
              </Button>
              
              <Select onValueChange={(value) => window.location.href = value}>
                <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
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
                <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
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
                className="bg-red-500/20 border-red-400/30 text-white hover:bg-red-500/30"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <div className="space-y-2">
            <TabsList className="grid grid-cols-6 gap-1 bg-white/10 backdrop-blur-sm border border-white/20 p-1">
              <TabsTrigger value="scholars-dashboard" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">
                <Users className="h-3 w-3 mr-1" />Dashboard
              </TabsTrigger>
              <TabsTrigger value="pbis-awards" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">
                <Award className="h-3 w-3 mr-1" />PBIS Awards
              </TabsTrigger>
              <TabsTrigger value="teachers" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">Teachers</TabsTrigger>
              <TabsTrigger value="teacher-viewer" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">
                <Eye className="h-3 w-3 mr-1" />Viewer
              </TabsTrigger>
              <TabsTrigger value="students" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">Students</TabsTrigger>
              <TabsTrigger value="houses" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">Houses</TabsTrigger>
            </TabsList>
            
            <TabsList className="grid grid-cols-6 gap-1 bg-white/10 backdrop-blur-sm border border-white/20 p-1">
              <TabsTrigger value="badges" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">Badges</TabsTrigger>
              <TabsTrigger value="games" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">Games</TabsTrigger>
              <TabsTrigger value="messaging" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">Messages</TabsTrigger>
              <TabsTrigger value="gallery" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">Gallery</TabsTrigger>
              <TabsTrigger value="reflections" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">Reflections</TabsTrigger>
              <TabsTrigger value="exports" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">Export</TabsTrigger>
            </TabsList>

            <TabsList className="grid grid-cols-5 gap-1 bg-white/10 backdrop-blur-sm border border-white/20 p-1">
              <TabsTrigger value="progress-reports" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">
                <FileText className="h-3 w-3 mr-1" />Reports
              </TabsTrigger>
              <TabsTrigger value="achievement-playground" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">
                <Trophy className="h-3 w-3 mr-1" />Achievements
              </TabsTrigger>
              <TabsTrigger value="performance-heatmap" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">
                <BarChart3 className="h-3 w-3 mr-1" />Analytics
              </TabsTrigger>
              <TabsTrigger value="ai-recommendations" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">
                <Brain className="h-3 w-3 mr-1" />AI Engine
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 text-xs">
                <Settings className="h-3 w-3 mr-1" />Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scholars Dashboard Tab - Main Overview */}
          <TabsContent value="scholars-dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
                <CardHeader>
                  <CardTitle style={{ color: themeStyles.textPrimary }}>School Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                      <div className="text-2xl font-bold" style={{ color: themeStyles.textPrimary }}>{allScholars?.length || 0}</div>
                      <div className="text-sm" style={{ color: themeStyles.textSecondary }}>Total Students</div>
                    </div>
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                      <div className="text-2xl font-bold" style={{ color: themeStyles.textPrimary }}>{houses?.length || 0}</div>
                      <div className="text-sm" style={{ color: themeStyles.textSecondary }}>Houses</div>
                    </div>
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                      <div className="text-2xl font-bold" style={{ color: themeStyles.textPrimary }}>{allBadges?.length || 0}</div>
                      <div className="text-sm" style={{ color: themeStyles.textSecondary }}>Badges</div>
                    </div>
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                      <div className="text-2xl font-bold" style={{ color: themeStyles.textPrimary }}>{allGames?.length || 0}</div>
                      <div className="text-sm" style={{ color: themeStyles.textSecondary }}>Games</div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-medium mb-3" style={{ color: themeStyles.textPrimary }}>House Standings</h4>
                    <div className="space-y-2">
                      {houses?.sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 3).map((house: House, index) => (
                        <div key={house.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: `${house.color}20` }}>
                          <div className="flex items-center gap-2">
                            <Badge className="text-xs" style={{ backgroundColor: house.color, color: 'white' }}>#{index + 1}</Badge>
                            <span className="font-medium">{house.name}</span>
                          </div>
                          <span className="font-bold" style={{ color: house.color }}>{house.totalPoints}pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="lg:col-span-2 bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
                <CardHeader>
                  <CardTitle style={{ color: themeStyles.textPrimary }}>Recent Activity & Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3" style={{ color: themeStyles.textPrimary }}>Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          onClick={() => setActiveTab("pbis-awards")}
                          className="h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white flex flex-col items-center justify-center"
                        >
                          <Award className="h-5 w-5 mb-1" />
                          <span className="text-xs">Award Points</span>
                        </Button>
                        <Button 
                          onClick={() => setActiveTab("students")}
                          className="h-16 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white flex flex-col items-center justify-center"
                        >
                          <Users className="h-5 w-5 mb-1" />
                          <span className="text-xs">View Students</span>
                        </Button>
                        <Button 
                          onClick={() => setActiveTab("messaging")}
                          className="h-16 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white flex flex-col items-center justify-center"
                        >
                          <MessageSquare className="h-5 w-5 mb-1" />
                          <span className="text-xs">Send Message</span>
                        </Button>
                        <Button 
                          onClick={() => setActiveTab("exports")}
                          className="h-16 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white flex flex-col items-center justify-center"
                        >
                          <Download className="h-5 w-5 mb-1" />
                          <span className="text-xs">Export Data</span>
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3" style={{ color: themeStyles.textPrimary }}>System Status</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                          <span className="text-sm">Database</span>
                          <Badge className="bg-green-500 text-white">Online</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                          <span className="text-sm">SMS Service</span>
                          <Badge className="bg-green-500 text-white">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                          <span className="text-sm">Email Service</span>
                          <Badge className="bg-green-500 text-white">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                          <span className="text-sm">AI Features</span>
                          <Badge className="bg-green-500 text-white">Available</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PBIS Awards Tab - Award Mustang Points */}
          <TabsContent value="pbis-awards" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
                <CardHeader>
                  <CardTitle style={{ color: themeStyles.textPrimary }}>Award MUSTANG Points</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="student-select">Select Student</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {allScholars?.map((scholar: Scholar) => (
                          <SelectItem key={scholar.id} value={scholar.id}>
                            {scholar.name} - Grade {scholar.grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="point-type">Point Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">Academic Excellence</SelectItem>
                        <SelectItem value="behavior">Positive Behavior</SelectItem>
                        <SelectItem value="attendance">Perfect Attendance</SelectItem>
                        <SelectItem value="leadership">Leadership</SelectItem>
                        <SelectItem value="citizenship">Good Citizenship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="points">Points to Award</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select points" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Point</SelectItem>
                        <SelectItem value="2">2 Points</SelectItem>
                        <SelectItem value="3">3 Points</SelectItem>
                        <SelectItem value="5">5 Points</SelectItem>
                        <SelectItem value="10">10 Points</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="reason">Reason for Award</Label>
                    <textarea 
                      className="w-full h-20 p-3 border rounded-lg resize-none" 
                      placeholder="Describe why this student is receiving points..."
                      style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : '#ffffff', borderColor: themeStyles.border, color: themeStyles.textPrimary }}
                    />
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
                    <Award className="h-4 w-4 mr-2" />
                    Award MUSTANG Points
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
                <CardHeader>
                  <CardTitle style={{ color: themeStyles.textPrimary }}>Recent Awards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    <div className="p-3 border rounded-lg" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium" style={{ color: themeStyles.textPrimary }}>Recent Awards</span>
                        <Badge className="bg-green-500 text-white">Active</Badge>
                      </div>
                      <p className="text-sm" style={{ color: themeStyles.textSecondary }}>
                        View recent PBIS point awards and their details. All awards are automatically tracked and added to student records.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-lg" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium" style={{ color: themeStyles.textPrimary }}>Bulk Actions</span>
                        <Badge className="bg-blue-500 text-white">Available</Badge>
                      </div>
                      <p className="text-sm" style={{ color: themeStyles.textSecondary }}>
                        Award points to multiple students at once for class-wide achievements or events.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teachers Tab - Exact replica of original functionality */}
          <TabsContent value="teachers" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
              <CardHeader>
                <CardTitle style={{ color: themeStyles.textPrimary }}>Teacher Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p style={{ color: themeStyles.textSecondary }} className="mb-4">Manage teacher approvals and access</p>
                
                {/* Email Notification Controls */}
                <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-lg" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border }}>
                  <Button
                    onClick={() => sendTeacherNotificationsMutation.mutate()}
                    disabled={sendTeacherNotificationsMutation.isPending}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {sendTeacherNotificationsMutation.isPending ? "Sending..." : "Send Welcome Emails to New Teachers"}
                  </Button>
                  
                  <Button
                    onClick={() => sendTestEmailMutation.mutate({ email: "bphillips@bhm.k12.al.us", name: "Administrator" })}
                    disabled={sendTestEmailMutation.isPending}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <TestTube className="mr-2 h-4 w-4" />
                    {sendTestEmailMutation.isPending ? "Sending..." : "Send Test Email"}
                  </Button>
                </div>
                
                {pendingTeachers && pendingTeachers.length > 0 ? (
                  <div className="space-y-4">
                    {pendingTeachers.map((teacher: any) => (
                      <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border }}>
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: themeStyles.textPrimary }}>{teacher.firstName} {teacher.lastName}</p>
                          <p className="text-sm" style={{ color: themeStyles.textSecondary }}>{teacher.email}</p>
                          <p className="text-sm" style={{ color: themeStyles.textSecondary }}>{teacher.gradeRole} • {teacher.subject}</p>
                          <p className="text-xs" style={{ color: themeStyles.textSecondary }}>
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
                    <p style={{ color: themeStyles.textSecondary }}>No pending teacher approvals</p>
                    <p className="text-sm" style={{ color: themeStyles.textSecondary }}>All teachers have been approved</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teacher Viewer Tab */}
          <TabsContent value="teacher-viewer" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardContent className="p-0">
                <AdminTeacherViewer />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
              <CardHeader>
                <CardTitle style={{ color: themeStyles.textPrimary }}>Student Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                      <h3 className="font-medium mb-2" style={{ color: themeStyles.textPrimary }}>Student Overview</h3>
                      <p style={{ color: themeStyles.textSecondary }}>Total Students: {allScholars?.length || 0}</p>
                    </div>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {allScholars?.map((scholar: Scholar) => (
                        <div key={scholar.id} className="flex items-center justify-between p-4 border rounded-lg" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border }}>
                          <div className="flex-1">
                            <p className="font-medium" style={{ color: themeStyles.textPrimary }}>{scholar.name}</p>
                            <p className="text-sm" style={{ color: themeStyles.textSecondary }}>Grade {scholar.grade} • ID: {scholar.studentId}</p>
                            <p className="text-xs" style={{ color: themeStyles.textSecondary }}>
                              Academic: {scholar.academicPoints} | Attendance: {scholar.attendancePoints} | Behavior: {scholar.behaviorPoints}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs">
                              {scholar.academicPoints + scholar.attendancePoints + scholar.behaviorPoints} Total
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Card style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
                      <CardHeader>
                        <CardTitle style={{ color: themeStyles.textPrimary }}>House Distribution</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {houses?.map((house: House) => {
                          const houseScholars = allScholars?.filter((s: Scholar) => s.houseId === house.id) || [];
                          return (
                            <div key={house.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: `${house.color}20`, borderColor: house.color }}>
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: house.color }}></div>
                                <span className="font-medium">{house.name}</span>
                              </div>
                              <Badge variant="outline">{houseScholars.length} students</Badge>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Houses Tab */}
          <TabsContent value="houses" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
              <CardHeader>
                <CardTitle style={{ color: themeStyles.textPrimary }}>House Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {houses?.map((house: House, index) => (
                    <Card key={house.id} className="relative overflow-hidden group" style={{ backgroundColor: `${house.color}15`, borderColor: house.color }}>
                      <CardContent className="p-6 text-center">
                        <div className="h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl" style={{ backgroundColor: house.color }}>
                          {house.name.charAt(0)}
                        </div>
                        <h3 className="font-bold text-lg mb-2">{house.name}</h3>
                        <div className="space-y-2">
                          <div className="bg-white/50 rounded-lg p-2">
                            <p className="text-sm font-medium">Total Points</p>
                            <p className="text-2xl font-bold" style={{ color: house.color }}>{house.totalPoints}</p>
                          </div>
                          <Badge className="w-full" style={{ backgroundColor: house.color, color: 'white' }}>
                            Rank #{index + 1}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
                <CardHeader>
                  <CardTitle style={{ color: themeStyles.textPrimary }}>Badge Overview ({allBadges?.length || 0} Total)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {allBadges && allBadges.length > 0 ? (
                      allBadges.map((badge: any) => (
                        <div key={badge.id} className="p-4 border rounded-lg" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border }}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium" style={{ color: themeStyles.textPrimary }}>{badge.name}</h4>
                              <p className="text-sm" style={{ color: themeStyles.textSecondary }}>{badge.description}</p>
                            </div>
                            <Badge variant={badge.category === 'overall' ? 'default' : 'secondary'}>
                              Level {badge.level}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span style={{ color: themeStyles.textSecondary }}>
                              {badge.category} • {badge.pointsRequired} points
                            </span>
                            <span style={{ color: themeStyles.textSecondary }}>
                              {badge.houseId ? badge.houseId.charAt(0).toUpperCase() + badge.houseId.slice(1) : 'Universal'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p style={{ color: themeStyles.textSecondary }}>No badges found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
                <CardHeader>
                  <CardTitle style={{ color: themeStyles.textPrimary }}>Badge Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['academic', 'behavior', 'attendance', 'overall'].map(category => {
                      const categoryBadges = allBadges?.filter((b: any) => b.category === category) || [];
                      return (
                        <div key={category} className="p-3 border rounded-lg" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border }}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium capitalize" style={{ color: themeStyles.textPrimary }}>
                              {category}
                            </span>
                            <Badge variant="outline">
                              {categoryBadges.length} badges
                            </Badge>
                          </div>
                          <p className="text-xs mt-1" style={{ color: themeStyles.textSecondary }}>
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

          {/* Games Tab */}
          <TabsContent value="games" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
                <CardHeader>
                  <CardTitle style={{ color: themeStyles.textPrimary }}>Game Library ({allGames?.length || 0} Games)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {allGames && allGames.length > 0 ? (
                      allGames.map((game: any) => (
                        <div key={game.id} className="p-4 border rounded-lg" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#ffffff', borderColor: themeStyles.border }}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium" style={{ color: themeStyles.textPrimary }}>{game.name}</h4>
                              <p className="text-sm" style={{ color: themeStyles.textSecondary }}>{game.description}</p>
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
                                style={{ color: themeStyles.textPrimary, borderColor: themeStyles.border }}
                              >
                                Test Game
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span style={{ color: themeStyles.textSecondary }}>
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
                        <p style={{ color: themeStyles.textSecondary }}>No games found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
                <CardHeader>
                  <CardTitle style={{ color: themeStyles.textPrimary }}>Game Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['sports', 'puzzle', 'strategy', 'arcade', 'adventure', 'racing'].map(category => {
                      const categoryGames = allGames?.filter((g: any) => g.category === category) || [];
                      return (
                        <div key={category} className="p-3 border rounded-lg" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border }}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium capitalize" style={{ color: themeStyles.textPrimary }}>
                              {category}
                            </span>
                            <Badge variant="outline">
                              {categoryGames.length} games
                            </Badge>
                          </div>
                          {categoryGames.length > 0 && (
                            <p className="text-xs mt-1" style={{ color: themeStyles.textSecondary }}>
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

          {/* Messaging Tab */}
          <TabsContent value="messaging" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
                <CardHeader>
                  <CardTitle style={{ color: themeStyles.textPrimary }}>Send Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="recipientType">Send To</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_parents">All Parents</SelectItem>
                        <SelectItem value="all_teachers">All Teachers</SelectItem>
                        <SelectItem value="grade_6_parents">Grade 6 Parents</SelectItem>
                        <SelectItem value="grade_7_parents">Grade 7 Parents</SelectItem>
                        <SelectItem value="grade_8_parents">Grade 8 Parents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input placeholder="Message subject" />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <textarea className="w-full h-32 p-3 border rounded-lg resize-none" placeholder="Type your message here..." />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
                <CardHeader>
                  <CardTitle style={{ color: themeStyles.textPrimary }}>Recent Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {adminMessages?.slice(0, 10).map((message: any) => (
                      <div key={message.id} className="p-3 border rounded-lg" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb', borderColor: themeStyles.border }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium" style={{ color: themeStyles.textPrimary }}>{message.subject}</span>
                          <Badge variant="outline">{message.type}</Badge>
                        </div>
                        <p className="text-sm mb-1" style={{ color: themeStyles.textSecondary }}>{message.message.substring(0, 100)}...</p>
                        <p className="text-xs" style={{ color: themeStyles.textSecondary }}>To: {message.recipientType}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
                <CardHeader>
                  <CardTitle style={{ color: themeStyles.textPrimary }}>Upload Photo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="photo">Select Photo</Label>
                    <Input 
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input 
                      placeholder="Photo description"
                      value={photoDescription}
                      onChange={(e) => setPhotoDescription(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleUploadPhoto}
                    disabled={uploadPhotoMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {uploadPhotoMutation.isPending ? "Uploading..." : "Upload Photo"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
                <CardHeader>
                  <CardTitle style={{ color: themeStyles.textPrimary }}>PBIS Photo Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {galleryPhotos?.map((photo: any) => (
                      <div key={photo.id} className="relative group">
                        <img 
                          src={photo.photoUrl} 
                          alt={photo.description}
                          className="w-full h-32 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow duration-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors duration-200"></div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-xs font-medium bg-black/50 rounded px-2 py-1 truncate">
                            {photo.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reflections Tab */}
          <TabsContent value="reflections" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
              <CardHeader>
                <CardTitle style={{ color: themeStyles.textPrimary }}>Behavioral Reflection Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <ReflectionLogs />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Export Tab */}
          <TabsContent value="exports" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
              <CardHeader>
                <CardTitle style={{ color: themeStyles.textPrimary }}>Data Export Center</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => window.open('/api/admin/export/scholars', '_blank')}
                    className="flex items-center gap-2 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                  >
                    <Download className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">Export Students</div>
                      <div className="text-sm opacity-75">Download all student data</div>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => window.open('/api/admin/export/pbis', '_blank')}
                    className="flex items-center gap-2 h-20 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    <Download className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">Export PBIS Data</div>
                      <div className="text-sm opacity-75">Download all PBIS entries</div>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => window.open('/api/admin/export/houses', '_blank')}
                    className="flex items-center gap-2 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                  >
                    <Download className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">Export House Data</div>
                      <div className="text-sm opacity-75">Download house standings</div>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => window.open('/api/admin/export/reflections', '_blank')}
                    className="flex items-center gap-2 h-20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
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

          {/* Progress Reports Tab */}
          <TabsContent value="progress-reports" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
              <CardHeader>
                <CardTitle style={{ color: themeStyles.textPrimary }}>AI-Powered Progress Report Generator</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressReportGenerator />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievement Playground Tab */}
          <TabsContent value="achievement-playground" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
              <CardHeader>
                <CardTitle style={{ color: themeStyles.textPrimary }}>Interactive Achievement Playground</CardTitle>
              </CardHeader>
              <CardContent>
                <AchievementPlayground />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Heatmap Tab */}
          <TabsContent value="performance-heatmap" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
              <CardHeader>
                <CardTitle style={{ color: themeStyles.textPrimary }}>Teacher Performance Analytics & Heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                <TeacherPerformanceHeatmap />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Recommendations Tab */}
          <TabsContent value="ai-recommendations" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
              <CardHeader>
                <CardTitle style={{ color: themeStyles.textPrimary }}>AI-Powered Adaptive Recommendation Engine</CardTitle>
              </CardHeader>
              <CardContent>
                <AIRecommendationEngine />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab - Complete System Configuration */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* System Settings */}
              <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
                <CardHeader>
                  <CardTitle style={{ color: themeStyles.textPrimary }}>System Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* School Information */}
                  <div className="space-y-3">
                    <h4 className="font-medium" style={{ color: themeStyles.textPrimary }}>School Information</h4>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="school-name">School Name</Label>
                        <Input defaultValue="Bush Hills STEAM Academy" />
                      </div>
                      <div>
                        <Label htmlFor="school-year">Academic Year</Label>
                        <Input defaultValue="2024-2025" />
                      </div>
                      <div>
                        <Label htmlFor="principal">Principal</Label>
                        <Input defaultValue="Dr. Smith" />
                      </div>
                    </div>
                  </div>

                  {/* PBIS Settings */}
                  <div className="space-y-3">
                    <h4 className="font-medium" style={{ color: themeStyles.textPrimary }}>PBIS Point System</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                        <span className="text-sm">Enable PBIS Points</span>
                        <Badge className="bg-green-500 text-white">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                        <span className="text-sm">Auto Badge Awards</span>
                        <Badge className="bg-green-500 text-white">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                        <span className="text-sm">House Competition</span>
                        <Badge className="bg-green-500 text-white">Running</Badge>
                      </div>
                    </div>
                  </div>

                  {/* User Management */}
                  <div className="space-y-3">
                    <h4 className="font-medium" style={{ color: themeStyles.textPrimary }}>User Management</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button className="bg-blue-500 hover:bg-blue-600 text-white text-xs">
                        <UserPlus className="h-3 w-3 mr-1" />
                        Add Teacher
                      </Button>
                      <Button className="bg-green-500 hover:bg-green-600 text-white text-xs">
                        <UserPlus className="h-3 w-3 mr-1" />
                        Add Student
                      </Button>
                      <Button className="bg-purple-500 hover:bg-purple-600 text-white text-xs">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Reset Passwords
                      </Button>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                        <Download className="h-3 w-3 mr-1" />
                        QR Codes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Communication & Notifications */}
              <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
                <CardHeader>
                  <CardTitle style={{ color: themeStyles.textPrimary }}>Communication Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Email Configuration */}
                  <div className="space-y-3">
                    <h4 className="font-medium" style={{ color: themeStyles.textPrimary }}>Email Service</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                        <span className="text-sm">SendGrid API</span>
                        <Badge className="bg-green-500 text-white">Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                        <span className="text-sm">Auto Notifications</span>
                        <Badge className="bg-green-500 text-white">Enabled</Badge>
                      </div>
                      <Button 
                        onClick={() => sendTestEmailMutation.mutate({ email: "admin@bhm.k12.al.us", name: "Test User" })}
                        disabled={sendTestEmailMutation.isPending}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs"
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        {sendTestEmailMutation.isPending ? "Sending..." : "Send Test Email"}
                      </Button>
                    </div>
                  </div>

                  {/* SMS Configuration */}
                  <div className="space-y-3">
                    <h4 className="font-medium" style={{ color: themeStyles.textPrimary }}>SMS Service</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                        <span className="text-sm">Twilio API</span>
                        <Badge className="bg-green-500 text-white">Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                        <span className="text-sm">Parent Notifications</span>
                        <Badge className="bg-green-500 text-white">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                        <span className="text-sm">Bilingual Support</span>
                        <Badge className="bg-green-500 text-white">Enabled</Badge>
                      </div>
                    </div>
                  </div>

                  {/* System Maintenance */}
                  <div className="space-y-3">
                    <h4 className="font-medium" style={{ color: themeStyles.textPrimary }}>System Maintenance</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Clear Cache
                      </Button>
                      <Button className="bg-purple-500 hover:bg-purple-600 text-white text-xs">
                        <Download className="h-3 w-3 mr-1" />
                        Backup Data
                      </Button>
                      <Button className="bg-red-500 hover:bg-red-600 text-white text-xs">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Reset Semester
                      </Button>
                      <Button className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs">
                        <Settings className="h-3 w-3 mr-1" />
                        Admin Tools
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Features */}
              <Card className="lg:col-span-2 bg-white/60 backdrop-blur-sm border border-white/20 shadow-xl" style={{ backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border }}>
                <CardHeader>
                  <CardTitle style={{ color: themeStyles.textPrimary }}>Advanced System Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Data Management */}
                    <div className="space-y-3">
                      <h4 className="font-medium" style={{ color: themeStyles.textPrimary }}>Data Management</h4>
                      <div className="space-y-2">
                        <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs justify-start">
                          <Download className="h-3 w-3 mr-2" />
                          Export All Data (CSV)
                        </Button>
                        <Button className="w-full bg-green-500 hover:bg-green-600 text-white text-xs justify-start">
                          <Download className="h-3 w-3 mr-2" />
                          Export All Data (Excel)
                        </Button>
                        <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white text-xs justify-start">
                          <RefreshCw className="h-3 w-3 mr-2" />
                          Import Student Data
                        </Button>
                        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs justify-start">
                          <Settings className="h-3 w-3 mr-2" />
                          Database Tools
                        </Button>
                      </div>
                    </div>

                    {/* Security & Access */}
                    <div className="space-y-3">
                      <h4 className="font-medium" style={{ color: themeStyles.textPrimary }}>Security & Access</h4>
                      <div className="space-y-2">
                        <Button className="w-full bg-red-500 hover:bg-red-600 text-white text-xs justify-start">
                          <Shield className="h-3 w-3 mr-2" />
                          Admin Permissions
                        </Button>
                        <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-xs justify-start">
                          <Users className="h-3 w-3 mr-2" />
                          Teacher Roles
                        </Button>
                        <Button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs justify-start">
                          <RefreshCw className="h-3 w-3 mr-2" />
                          Reset All Passwords
                        </Button>
                        <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white text-xs justify-start">
                          <Eye className="h-3 w-3 mr-2" />
                          Audit Logs
                        </Button>
                      </div>
                    </div>

                    {/* System Status */}
                    <div className="space-y-3">
                      <h4 className="font-medium" style={{ color: themeStyles.textPrimary }}>System Status</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded text-xs" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                          <span>Total Students</span>
                          <Badge className="bg-blue-500 text-white">{allScholars?.length || 0}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded text-xs" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                          <span>Active Teachers</span>
                          <Badge className="bg-green-500 text-white">20</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded text-xs" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                          <span>Total Houses</span>
                          <Badge className="bg-purple-500 text-white">{houses?.length || 0}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded text-xs" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                          <span>Active Badges</span>
                          <Badge className="bg-yellow-500 text-white">{allBadges?.length || 0}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded text-xs" style={{ backgroundColor: currentTheme === 'dark' ? '#374151' : currentTheme === 'light' ? '#f0fdf4' : '#f9fafb' }}>
                          <span>Available Games</span>
                          <Badge className="bg-orange-500 text-white">{allGames?.length || 0}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* Game Modal */}
      {selectedGame && (
        <GameModal 
          game={selectedGame} 
          isOpen={showGameModal} 
          onClose={() => setShowGameModal(false)} 
        />
      )}
    </div>
  );
}