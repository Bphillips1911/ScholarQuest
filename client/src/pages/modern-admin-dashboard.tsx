import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GameModal } from "@/components/games/GameModal";
import { ReflectionLogs } from "@/components/admin/ReflectionLogs";
import { ProgressReportGenerator } from "@/components/ProgressReportGenerator";
import { AchievementPlayground } from "@/components/AchievementPlayground";
import { TeacherPerformanceHeatmap } from "@/components/TeacherPerformanceHeatmap";
import { AIRecommendationEngine } from "@/components/AIRecommendationEngine";
import { AdminTeacherViewer } from "@/components/AdminTeacherViewer";
import { useLocation } from "wouter";
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
  const [activeTab, setActiveTab] = useState("overview");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
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
    enabled: isAuthenticated,
  });

  // Fetch gallery photos for admin
  const { data: galleryPhotos = [] } = useQuery({
    queryKey: ["/api/pbis-photos"],
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

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    setLocation("/admin-login");
    toast({
      title: "Logged out successfully",
      description: "You have been safely logged out of the admin portal.",
    });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-white/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={schoolLogoPath} 
                  alt="BHSA Mustangs" 
                  className="h-12 w-12 rounded-full shadow-lg ring-2 ring-blue-500/20"
                />
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  PBIS Command Center
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Welcome back, {adminData?.name || 'Administrator'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="hidden md:flex items-center gap-2 px-3 py-1.5">
                <Shield className="h-4 w-4 text-green-500" />
                {adminData?.title || 'Principal'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Navigation */}
      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 p-1 h-auto">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="students" 
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Students</span>
            </TabsTrigger>
            <TabsTrigger 
              value="teachers" 
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Teachers</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ai-tools" 
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Tools</span>
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger 
              value="gallery" 
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Gallery</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Key Metrics Cards */}
              <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Students</p>
                      <p className="text-3xl font-bold">847</p>
                      <p className="text-blue-200 text-xs">+12 this month</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-white/10 rounded-full"></div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Active Teachers</p>
                      <p className="text-3xl font-bold">42</p>
                      <p className="text-emerald-200 text-xs">All systems active</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-white/10 rounded-full"></div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">PBIS Points Today</p>
                      <p className="text-3xl font-bold">1,247</p>
                      <p className="text-purple-200 text-xs">+18% vs yesterday</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-white/10 rounded-full"></div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">AI Insights</p>
                      <p className="text-3xl font-bold">94%</p>
                      <p className="text-orange-200 text-xs">Student engagement</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-white/10 rounded-full"></div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => setActiveTab("ai-tools")}
                    className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Brain className="h-6 w-6" />
                    <span className="text-sm font-medium">AI Reports</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("analytics")}
                    className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm font-medium">Analytics</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("students")}
                    className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <GraduationCap className="h-6 w-6" />
                    <span className="text-sm font-medium">Students</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("teachers")}
                    className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm font-medium">Teachers</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Tools Tab */}
          <TabsContent value="ai-tools" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Progress Report Generator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProgressReportGenerator />
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    AI Recommendation Engine
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AIRecommendationEngine />
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Achievement Playground
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AchievementPlayground />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Teacher Performance Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TeacherPerformanceHeatmap />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-500" />
                    Student Roster ({allScholars?.length || 0} Students)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {allScholars?.map((scholar: Scholar) => (
                      <div key={scholar.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {scholar.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-blue-900">{scholar.name}</p>
                            <p className="text-sm text-blue-700">Grade {scholar.grade} • {scholar.studentId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-900">{scholar.academicPoints + scholar.attendancePoints + scholar.behaviorPoints} Points</p>
                          <p className="text-xs text-blue-700">Total PBIS</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    House Standings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {houses?.map((house: House, index) => (
                      <div key={house.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: `${house.color}20`, borderColor: house.color }}>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full" style={{ backgroundColor: house.color }}></div>
                          <span className="font-medium">{house.name}</span>
                        </div>
                        <div className="text-right">
                          <Badge className="text-xs">#{index + 1}</Badge>
                          <p className="text-sm font-medium">{house.totalPoints} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Teacher Management & Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminTeacherViewer />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-green-500" />
                    Send Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="recipientType">Send To</Label>
                    <Select value={messageForm.recipientType} onValueChange={(value) => setMessageForm(prev => ({ ...prev, recipientType: value }))}>
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
                    <Input 
                      id="subject"
                      placeholder="Message subject"
                      value={messageForm.subject}
                      onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <textarea 
                      id="message"
                      className="w-full h-32 p-3 border rounded-lg resize-none"
                      placeholder="Type your message here..."
                      value={messageForm.message}
                      onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                    />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Recent Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {adminMessages?.slice(0, 10).map((message: any) => (
                      <div key={message.id} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-blue-900">{message.subject}</span>
                          <Badge variant="outline">{message.type}</Badge>
                        </div>
                        <p className="text-sm text-blue-700 mb-1">{message.message.substring(0, 100)}...</p>
                        <p className="text-xs text-blue-600">To: {message.recipientType}</p>
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
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-green-500" />
                    Upload Photo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="photo">Select Photo</Label>
                    <Input 
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input 
                      id="description"
                      placeholder="Photo description"
                      value={photoDescription}
                      onChange={(e) => setPhotoDescription(e.target.value)}
                    />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                    <Camera className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-purple-500" />
                    PBIS Photo Gallery
                  </CardTitle>
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
        </Tabs>
      </div>
    </div>
  );
}