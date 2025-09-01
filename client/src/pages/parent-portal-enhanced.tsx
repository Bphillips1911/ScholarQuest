import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { translate, getParentLanguage, formatDateInLanguage, translateMustangTrait, type Language } from "@/lib/translations";
import { 
  User, Star, TrendingUp, Calendar, LogOut, UserPlus, Award, 
  MessageCircle, Send, Phone, Bell, GraduationCap, Home,
  CheckCircle, AlertCircle, Clock, Trophy, FileText, Clock3
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import type { Scholar, PbisEntry, ParentTeacherMessage } from "@shared/schema";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

interface ParentData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  preferredLanguage?: string;
}

interface ScholarDetail {
  scholar: Scholar;
  pbisEntries: PbisEntry[];
}

interface HouseData {
  id: string;
  name: string;
  color: string;
  academicPoints: number;
  attendancePoints: number;
  behaviorPoints: number;
  memberCount: number;
}

export default function ParentPortalEnhanced() {
  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [selectedScholarId, setSelectedScholarId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("my-scholars");
  const [showAddScholar, setShowAddScholar] = useState(false);
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [showAddPhone, setShowAddPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Language support
  const [language, setLanguage] = useState<Language>("en");

  // MODAL CLOSE HELPER: Centralized function to close add scholar modal
  const closeAddScholarModal = () => {
    console.log("MODAL: Closing add scholar modal and resetting forms");
    setShowAddScholar(false);
    setStudentCredentials({ username: "", password: "" });
    setStudentIdInput("");
  };

  // LANGUAGE INITIALIZATION: Set language from parent data
  useEffect(() => {
    try {
      const storedParentData = localStorage.getItem("parentData");
      if (storedParentData) {
        const parsedParent = JSON.parse(storedParentData);
        setParentData(parsedParent);
        setLanguage((parsedParent.preferredLanguage as Language) || "en");
      }
    } catch (error) {
      console.warn("Could not parse parent data for language");
      setLanguage("en");
    }
  }, []);

  // KEYBOARD SUPPORT: Handle escape key to close modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showAddScholar) {
          console.log("MODAL: Escape key pressed, closing add scholar modal");
          closeAddScholarModal();
        }
        if (showSendMessage) {
          console.log("MODAL: Escape key pressed, closing send message modal");
          setShowSendMessage(false);
        }
        if (showAddPhone) {
          console.log("MODAL: Escape key pressed, closing add phone modal");
          setShowAddPhone(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showAddScholar, showSendMessage, showAddPhone]);
  
  // Scholar addition forms
  const [studentCredentials, setStudentCredentials] = useState({
    username: "",
    password: "",
  });
  const [studentIdInput, setStudentIdInput] = useState("");
  
  // Messaging form
  const [messageForm, setMessageForm] = useState({
    recipientType: "teacher" as "teacher" | "admin",
    teacherId: "",
    subject: "",
    message: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
  });

  // Reply functionality state
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyForm, setReplyForm] = useState({
    subject: "",
    message: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
  });

  const { toast } = useToast();

  // Add phone number mutation
  const addPhoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await fetch("/api/parent/update-phone", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ phone }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update phone number");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent/scholars"] });
      setShowAddPhone(false);
      setPhoneNumber("");
      
      // Update parent data in localStorage and state
      if (data.parent && parentData) {
        const updatedParentData = { ...parentData, phone: data.parent.phone };
        localStorage.setItem("parentData", JSON.stringify(updatedParentData));
        setParentData(updatedParentData);
      }
      
      toast({
        title: "Phone Number Added",
        description: "You will now receive SMS notifications for important updates.",
      });
    },
    onError: (error: Error) => {
      console.error("Add phone error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add phone number",
        variant: "destructive",
      });
    },
  });

  const handleAddPhone = () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }
    
    addPhoneMutation.mutate(phoneNumber);
  };

  useEffect(() => {
    const token = localStorage.getItem("parentToken");
    const savedParentData = localStorage.getItem("parentData");
    
    if (!token || !savedParentData) {
      window.location.href = "/parent-login";
      return;
    }
    
    setParentData(JSON.parse(savedParentData));
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("parentToken");
    console.log("🔐 Getting auth headers, token exists:", !!token);
    if (token) {
      console.log("🔐 Token preview:", token.substring(0, 20) + "...");
    }
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // Fetch parent's scholars
  const { data: scholars = [] } = useQuery<Scholar[]>({
    queryKey: ["/api/parent/scholars"],
    queryFn: async () => {
      const response = await fetch("/api/parent/scholars", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch scholars");
      return response.json();
    },
    enabled: !!parentData,
  });

  // Fetch selected scholar details
  const { data: scholarDetail } = useQuery<ScholarDetail>({
    queryKey: ["/api/parent/scholar", selectedScholarId],
    queryFn: async () => {
      const response = await fetch(`/api/parent/scholar/${selectedScholarId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch scholar details");
      return response.json();
    },
    enabled: !!selectedScholarId,
  });

  // Fetch houses data for context
  const { data: houses = [] } = useQuery<HouseData[]>({
    queryKey: ["/api/houses"],
    queryFn: async () => {
      const response = await fetch("/api/houses");
      if (!response.ok) throw new Error("Failed to fetch houses");
      return response.json();
    },
  });

  // Fetch parent messages
  const { data: messages = [] } = useQuery<ParentTeacherMessage[]>({
    queryKey: ["/api/parent/messages"],
    queryFn: async () => {
      const response = await fetch("/api/parent/messages", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!parentData,
  });

  // Fetch teachers for messaging
  const { data: teachers = [] } = useQuery({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const response = await fetch("/api/teachers", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch teachers");
      return response.json();
    },
    enabled: showSendMessage,
  });

  // Fetch reflections for the parent
  const { data: reflections = [], refetch: refetchReflections } = useQuery({
    queryKey: ["/api/parent/reflections"],
    queryFn: async () => {
      console.log('🔍 PARENT PORTAL: Fetching reflections...');
      const response = await fetch("/api/parent/reflections", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch reflections");
      const data = await response.json();
      console.log('🔍 PARENT PORTAL: Received reflections:', data);
      return data;
    },
    enabled: !!parentData,
    refetchInterval: 30000, // Auto-refresh every 30 seconds to check for new approved reflections
  });

  // Add scholar by credentials mutation
  const addScholarByCredentialsMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      console.log("🔑 Adding scholar by credentials:", credentials.username);
      const headers = getAuthHeaders();
      console.log("📋 Request headers:", headers);
      
      const response = await fetch("/api/parent/add-scholar-by-credentials", {
        method: "POST",
        headers,
        body: JSON.stringify(credentials),
      });
      
      console.log("📡 Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Error response:", errorData);
        throw new Error(errorData.message || "Failed to add scholar");
      }
      
      const result = await response.json();
      console.log("✅ Success response:", result);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Scholar Added Successfully",
        description: `${data.scholar.name} has been automatically linked to your account.`,
      });
      setStudentCredentials({ username: "", password: "" });
      setShowAddScholar(false);
      queryClient.invalidateQueries({ queryKey: ["/api/parent/scholars"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Scholar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add scholar by ID mutation (fallback)
  const addScholarByIdMutation = useMutation({
    mutationFn: async (studentId: string) => {
      console.log("🆔 Adding scholar by ID:", studentId);
      const headers = getAuthHeaders();
      console.log("📋 Request headers:", headers);
      
      const response = await fetch("/api/parent/add-scholar", {
        method: "POST",
        headers,
        body: JSON.stringify({ studentId }),
      });
      
      console.log("📡 Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Error response:", errorData);
        throw new Error(errorData.message || "Failed to add scholar");
      }
      
      const result = await response.json();
      console.log("✅ Success response:", result);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Scholar Added",
        description: data.message || "Scholar has been successfully added to your account.",
      });
      setStudentIdInput("");
      setShowAddScholar(false);
      queryClient.invalidateQueries({ queryKey: ["/api/parent/scholars"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await fetch("/api/parent/send-message", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(messageData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send message");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully. You'll receive an SMS confirmation.",
      });
      setMessageForm({
        recipientType: "teacher",
        teacherId: "",
        subject: "",
        message: "",
        priority: "normal",
      });
      setShowSendMessage(false);
      queryClient.invalidateQueries({ queryKey: ["/api/parent/messages"] });
    },
    onError: (error) => {
      toast({
        title: "Error Sending Message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reply to message mutation
  const replyMutation = useMutation({
    mutationFn: async (replyData: any) => {
      const response = await fetch("/api/parent/send-message", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(replyData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send reply");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent successfully.",
      });
      setReplyForm({ subject: "", message: "", priority: "normal" });
      setShowReplyModal(false);
      queryClient.invalidateQueries({ queryKey: ["/api/parent/messages"] });
    },
    onError: (error) => {
      toast({
        title: "Error Sending Reply",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("parentToken");
    localStorage.removeItem("parentData");
    window.location.href = "/parent-login";
  };

  const handleAddByCredentials = () => {
    if (!studentCredentials.username || !studentCredentials.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password for your child.",
        variant: "destructive",
      });
      return;
    }
    addScholarByCredentialsMutation.mutate(studentCredentials);
  };

  const handleAddById = () => {
    if (!studentIdInput.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a student ID.",
        variant: "destructive",
      });
      return;
    }
    addScholarByIdMutation.mutate(studentIdInput);
  };

  const handleSendMessage = () => {
    if (!messageForm.subject || !messageForm.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const messageData = {
      ...messageForm,
      parentId: parentData?.id,
      senderType: "parent",
    };

    sendMessageMutation.mutate(messageData);
  };

  const getHouseData = (houseId: string) => {
    return houses.find(h => h.id === houseId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "normal": return "bg-blue-100 text-blue-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  if (!parentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your parent portal...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50" data-testid="parent-portal-enhanced-section">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img src={schoolLogoPath} alt="BHSA Logo" className="h-12 w-12 rounded-full" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{translate("parentPortal", language)}</h1>
                <p className="text-gray-600">{translate("welcomeBack", language)}, {parentData.firstName}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => setShowSendMessage(true)}>
                <MessageCircle className="h-4 w-4 mr-2" />
                {translate("sendMessage", language)}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLanguage(language === "en" ? "es" : "en")}
                data-testid="button-toggle-language"
                title={language === "en" ? "Cambiar a Español" : "Switch to English"}
              >
                {language === "en" ? "ES" : "EN"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4 mr-2" />
                {translate("logout", language)}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="my-scholars" className="text-xs sm:text-sm px-2 py-2">
              {translate("myScholars", language)}
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-xs sm:text-sm px-2 py-2">
              <span className="text-center">
                {language === "es" ? "Académico y Comportamiento" : "Progress & Achievements"}
              </span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs sm:text-sm px-2 py-2">
              {translate("messaging", language)}
            </TabsTrigger>
            <TabsTrigger value="reflections" className="text-xs sm:text-sm px-2 py-2">
              {translate("reflections", language)}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm px-2 py-2">
              {language === "es" ? "Notificaciones" : "Notifications"}
            </TabsTrigger>
          </TabsList>

          {/* My Scholars Tab */}
          <TabsContent value="my-scholars" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">{translate("myScholars", language)}</h2>
              <Button onClick={() => setShowAddScholar(true)} data-testid="button-add-scholar">
                <UserPlus className="h-4 w-4 mr-2" />
                {translate("addScholar", language)}
              </Button>
            </div>

            {scholars.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{translate("noScholars", language)}</h3>
                  <p className="text-gray-600 mb-4">
                    {language === "es" 
                      ? "Agregue a su estudiante para ver su progreso, logros y comunicarse con los maestros."
                      : "Add your child to view their progress, achievements, and communicate with teachers."
                    }
                  </p>
                  <Button onClick={() => setShowAddScholar(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {translate("addScholar", language)}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scholars.map((scholar) => {
                  const house = getHouseData(scholar.houseId || "");
                  return (
                    <Card
                      key={scholar.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedScholarId === scholar.id ? "ring-2 ring-blue-500" : ""
                      }`}
                      onClick={() => {
                        setSelectedScholarId(scholar.id);
                        setActiveTab("progress");
                      }}
                      data-testid={`scholar-card-${scholar.studentId}`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{scholar.name}</CardTitle>
                          {house && (
                            <Badge style={{ backgroundColor: house.color }} className="text-white">
                              {house.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">ID: {scholar.studentId} • Grade {scholar.grade}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-blue-50 p-2 rounded">
                            <p className="text-xs text-blue-600 font-medium">{translate("academic", language)}</p>
                            <p className="text-lg font-bold text-blue-800">{scholar.academicPoints}</p>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-xs text-green-600 font-medium">{translate("attendance", language)}</p>
                            <p className="text-lg font-bold text-green-800">{scholar.attendancePoints}</p>
                          </div>
                          <div className="bg-purple-50 p-2 rounded">
                            <p className="text-xs text-purple-600 font-medium">{translate("behavior", language)}</p>
                            <p className="text-lg font-bold text-purple-800">{scholar.behaviorPoints}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700">
                            {translate("totalPoints", language)}: {scholar.academicPoints + scholar.attendancePoints + scholar.behaviorPoints}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Progress & Achievements Tab */}
          <TabsContent value="progress" className="space-y-6">
            {!selectedScholarId ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Child</h3>
                  <p className="text-gray-600">Choose one of your children from the "My Scholars" tab to view their detailed progress.</p>
                </CardContent>
              </Card>
            ) : scholarDetail ? (
              <div className="space-y-6">
                {/* Scholar Overview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{scholarDetail.scholar.name}</CardTitle>
                        <p className="text-gray-600">Grade {scholarDetail.scholar.grade} • ID: {scholarDetail.scholar.studentId}</p>
                      </div>
                      {getHouseData(scholarDetail.scholar.houseId || "") && (
                        <div className="text-center">
                          <Badge 
                            style={{ backgroundColor: getHouseData(scholarDetail.scholar.houseId || "")?.color }} 
                            className="text-white text-lg px-4 py-2"
                          >
                            <Home className="h-4 w-4 mr-2" />
                            {getHouseData(scholarDetail.scholar.houseId || "")?.name}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <h3 className="text-sm font-medium text-blue-600">Academic Excellence</h3>
                        <p className="text-3xl font-bold text-blue-800">{scholarDetail.scholar.academicPoints}</p>
                        <p className="text-xs text-blue-600 mt-1">points earned</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <h3 className="text-sm font-medium text-green-600">Attendance</h3>
                        <p className="text-3xl font-bold text-green-800">{scholarDetail.scholar.attendancePoints}</p>
                        <p className="text-xs text-green-600 mt-1">points earned</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <h3 className="text-sm font-medium text-purple-600">Behavior</h3>
                        <p className="text-3xl font-bold text-purple-800">{scholarDetail.scholar.behaviorPoints}</p>
                        <p className="text-xs text-purple-600 mt-1">points earned</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <h3 className="text-sm font-medium text-yellow-600">Total Points</h3>
                        <p className="text-3xl font-bold text-yellow-800">
                          {scholarDetail.scholar.academicPoints + scholarDetail.scholar.attendancePoints + scholarDetail.scholar.behaviorPoints}
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">overall score</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent PBIS Achievements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2" />
                      Recent MUSTANG Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scholarDetail.pbisEntries.length === 0 ? (
                      <p className="text-gray-600 text-center py-8">No PBIS entries yet. Keep encouraging your child!</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {scholarDetail.pbisEntries.slice(0, 10).map((entry) => (
                          <div key={entry.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{entry.mustangTrait}</p>
                                <p className="text-sm text-gray-600">{entry.reason}</p>
                                <p className="text-xs text-gray-500">
                                  {entry.teacherName} • {entry.category} • {new Date(entry.createdAt!).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant={entry.points > 0 ? "default" : "destructive"}>
                                {entry.points > 0 ? "+" : ""}{entry.points} pts
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading progress details...</p>
              </div>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Messages</h2>
              <Button onClick={() => setShowSendMessage(true)}>
                <Send className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </div>

            {messages.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                  <p className="text-gray-600 mb-4">Start a conversation with your child's teachers or the administration.</p>
                  <Button onClick={() => setShowSendMessage(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Send First Message
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <Card key={message.id} className={`${!message.isRead ? "bg-blue-50 border-blue-200" : ""}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{message.subject}</h3>
                          <Badge className={getPriorityColor(message.priority || "normal")}>
                            {message.priority || "normal"}
                          </Badge>
                          {!message.isRead && (
                            <Badge variant="destructive">New</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <div>
                            {message.createdAt && !isNaN(new Date(message.createdAt).getTime()) ? (
                              <div>
                                <div className="font-medium">
                                  {format(new Date(message.createdAt), 'MMM dd, yyyy')}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  {format(new Date(message.createdAt), 'h:mm a')} • 
                                  {isToday(new Date(message.createdAt)) ? ' Today' :
                                   isYesterday(new Date(message.createdAt)) ? ' Yesterday' :
                                   ` ${formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}`
                                  }
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium">Today</div>
                                <div className="text-gray-400 text-xs">Just now</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        From: {message.senderType === "teacher" ? "Teacher" : 
                              message.senderType === "admin" ? "Administration" : "You"}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">{message.message}</p>
                      
                      {/* Reply button - only show for messages from teachers/admin */}
                      {message.senderType !== "parent" && (
                        <div className="flex justify-end">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-blue-600"
                            onClick={() => {
                              setSelectedMessage(message);
                              setReplyForm({
                                subject: `Re: ${message.subject}`,
                                message: "",
                                priority: "normal"
                              });
                              setShowReplyModal(true);
                            }}
                            data-testid={`button-reply-${message.id}`}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">SMS & Email Notifications</h2>
              <Badge variant="outline" className="flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                {parentData.phone || "No phone number"}
              </Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">Teacher Messages</p>
                      <p className="text-sm text-gray-600">Get notified when teachers send messages</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">PBIS Achievements</p>
                      <p className="text-sm text-gray-600">Alerts for your child's accomplishments</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">House Updates</p>
                      <p className="text-sm text-gray-600">House competition and events</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">General Announcements</p>
                      <p className="text-sm text-gray-600">School-wide updates and events</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                
                {!parentData.phone && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                        <div>
                          <p className="font-medium text-yellow-800">Add Phone Number</p>
                          <p className="text-sm text-yellow-700">
                            Add your phone number to receive SMS notifications for important updates.
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setShowAddPhone(true)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        data-testid="button-add-phone"
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Add Phone
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reflections Tab */}
          <TabsContent value="reflections" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Behavioral Reflections</h2>
              <Badge variant="secondary" className="text-sm">
                Auto-refreshes every 30 seconds
              </Badge>
            </div>
            
            {reflections.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reflections assigned yet</h3>
                  <p className="text-gray-600">
                    When teachers assign behavioral reflections to your child, they will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reflections.map((reflection: any) => (
                  <Card key={reflection.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {reflection.status === 'assigned' && (
                              <AlertCircle className="h-5 w-5 text-yellow-500" />
                            )}
                            {reflection.status === 'submitted' && (
                              <Clock3 className="h-5 w-5 text-blue-500" />
                            )}
                            {reflection.status === 'approved' && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            <span className="font-medium">{reflection.studentName}</span>
                          </div>
                          <Badge variant={
                            reflection.status === 'assigned' ? 'destructive' :
                            reflection.status === 'submitted' ? 'secondary' :
                            reflection.status === 'approved' ? 'default' : 'outline'
                          }>
                            {reflection.status === 'assigned' ? 'Needs Response' :
                             reflection.status === 'submitted' ? 'Under Review' :
                             reflection.status === 'approved' ? 'Completed' : reflection.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(reflection.assignedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Assignment:</h4>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-md italic">
                            "{reflection.prompt}"
                          </p>
                        </div>
                        
                        {reflection.response && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Student Response:</h4>
                            <p className="text-gray-700 bg-blue-50 p-3 rounded-md">
                              {reflection.response}
                            </p>
                          </div>
                        )}
                        
                        {reflection.teacherFeedback && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Teacher Feedback:</h4>
                            <p className="text-gray-700 bg-green-50 p-3 rounded-md">
                              {reflection.teacherFeedback}
                            </p>
                          </div>
                        )}
                        
                        {reflection.dueDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            Due: {new Date(reflection.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

        </Tabs>
      </div>

      {/* Add Scholar Modal */}
      {showAddScholar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              console.log("MODAL: Clicked outside, closing modal");
              closeAddScholarModal();
            }
          }}
        >
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Your Child</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("MODAL: X button clicked, closing modal");
                    closeAddScholarModal();
                  }}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  data-testid="button-close-modal"
                  type="button"
                >
                  ✕
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Connect your child's account to view their progress and achievements.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Method 1: Auto-populate using credentials */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Method 1: Student Login Credentials</h3>
                <p className="text-sm text-gray-600">
                  Enter your child's username and password if their teacher has already created their account.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Student accounts must be created by teachers first. If your child doesn't have login credentials yet, contact their teacher or use Method 2 below.
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="studentUsername">Student Username</Label>
                    <Input
                      id="studentUsername"
                      value={studentCredentials.username}
                      onChange={(e) => setStudentCredentials({...studentCredentials, username: e.target.value})}
                      placeholder="e.g., bh6001alex"
                      data-testid="input-student-username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="studentPassword">Student Password</Label>
                    <Input
                      id="studentPassword"
                      type="password"
                      value={studentCredentials.password}
                      onChange={(e) => setStudentCredentials({...studentCredentials, password: e.target.value})}
                      placeholder="Student's login password"
                      data-testid="input-student-password"
                    />
                  </div>
                  <Button 
                    onClick={handleAddByCredentials}
                    disabled={addScholarByCredentialsMutation.isPending}
                    className="w-full"
                    data-testid="button-add-by-credentials"
                  >
                    {addScholarByCredentialsMutation.isPending ? "Adding..." : "Link Account Automatically"}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>

              {/* Method 2: Manual entry by Student ID */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Method 2: Student ID</h3>
                <p className="text-sm text-gray-600">
                  If your child's teacher hasn't created login credentials yet, you can link by Student ID.
                </p>
                <div>
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value)}
                    placeholder="e.g., BH6001"
                    data-testid="input-student-id"
                  />
                </div>
                <Button 
                  onClick={handleAddById}
                  disabled={addScholarByIdMutation.isPending}
                  variant="outline"
                  className="w-full"
                  data-testid="button-add-by-id"
                >
                  {addScholarByIdMutation.isPending ? "Adding..." : "Add by Student ID"}
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={closeAddScholarModal}
                  className="flex-1"
                  data-testid="button-cancel-add"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Phone Number Modal */}
      {showAddPhone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Phone Number</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddPhone(false)}
                  className="h-8 w-8 p-0"
                  data-testid="button-close-phone-modal"
                >
                  ✕
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Receive SMS notifications for important updates about your child's progress.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="(555) 123-4567"
                  data-testid="input-phone-number"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your 10-digit phone number for SMS notifications
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <Bell className="h-4 w-4 inline mr-1" />
                  You'll receive notifications for teacher messages, PBIS achievements, and important school updates.
                </p>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddPhone(false);
                    setPhoneNumber("");
                  }}
                  className="flex-1"
                  data-testid="button-cancel-phone"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddPhone}
                  disabled={addPhoneMutation.isPending || !phoneNumber.trim()}
                  className="flex-1"
                  data-testid="button-save-phone"
                >
                  {addPhoneMutation.isPending ? "Saving..." : "Save Phone"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Send Message Modal */}
      {showSendMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
              <p className="text-sm text-gray-600">
                Contact your child's teacher or the school administration.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipientType">Send To</Label>
                  <Select 
                    value={messageForm.recipientType} 
                    onValueChange={(value: "teacher" | "admin") => 
                      setMessageForm({...messageForm, recipientType: value, teacherId: ""})
                    }
                  >
                    <SelectTrigger data-testid="select-recipient-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Administration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={messageForm.priority} 
                    onValueChange={(value: any) => setMessageForm({...messageForm, priority: value})}
                  >
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {messageForm.recipientType === "teacher" && (
                <div>
                  <Label htmlFor="teacher">Select Teacher</Label>
                  <Select 
                    value={messageForm.teacherId} 
                    onValueChange={(value) => setMessageForm({...messageForm, teacherId: value})}
                  >
                    <SelectTrigger data-testid="select-teacher">
                      <SelectValue placeholder="Choose a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher: any) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name} - {teacher.gradeRole}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                  placeholder="Message subject"
                  data-testid="input-message-subject"
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={4}
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                  placeholder="Type your message here..."
                  data-testid="textarea-message"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-sm text-blue-700">
                  <Phone className="h-4 w-4 inline mr-1" />
                  You'll receive an SMS confirmation when your message is sent and when you receive a reply.
                </p>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowSendMessage(false);
                    setMessageForm({
                      recipientType: "teacher",
                      teacherId: "",
                      subject: "",
                      message: "",
                      priority: "normal",
                    });
                  }}
                  className="flex-1"
                  data-testid="button-cancel-message"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending}
                  className="flex-1"
                  data-testid="button-send-message"
                >
                  {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowReplyModal(false);
              setReplyForm({ subject: "", message: "", priority: "normal" });
            }
          }}
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white border-b">
              <div>
                <CardTitle>Reply to Message</CardTitle>
                <p className="text-sm text-gray-600">
                  From: {selectedMessage.senderType === "teacher" ? "Teacher" : "Administration"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyForm({ subject: "", message: "", priority: "normal" });
                }}
                className="h-10 w-10 p-0 border-2 border-gray-600 bg-white hover:bg-red-100 hover:border-red-500"
                data-testid="button-close-reply-modal"
              >
                <span className="text-xl font-bold text-gray-800 hover:text-red-600">✕</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Original Message Reference */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium text-sm text-gray-700 mb-2">
                  {language === "es" ? "Mensaje Original:" : "Original Message:"}
                </h4>
                <div className="text-sm">
                  <p><strong>{language === "es" ? "Asunto:" : "Subject:"}</strong> {selectedMessage.subject}</p>
                  <p><strong>{language === "es" ? "Acerca de:" : "About:"}</strong> {selectedMessage.scholarName || (language === "es" ? "General" : "General")}</p>
                  <div className="mt-2 p-3 bg-white rounded border-l-4 border-blue-500">
                    <p className="text-gray-700">{selectedMessage.message}</p>
                  </div>
                </div>
              </div>

              {/* Reply Form */}
              <div>
                <Label htmlFor="replySubject">{language === "es" ? "Asunto" : "Subject"}</Label>
                <Input
                  id="replySubject"
                  value={replyForm.subject}
                  onChange={(e) => setReplyForm({...replyForm, subject: e.target.value})}
                  placeholder={language === "es" ? "Ingrese el asunto de la respuesta" : "Enter reply subject"}
                  data-testid="input-reply-subject"
                />
              </div>
              
              <div>
                <Label htmlFor="replyMessage">{language === "es" ? "Mensaje" : "Message"}</Label>
                <textarea
                  id="replyMessage"
                  value={replyForm.message}
                  onChange={(e) => setReplyForm({...replyForm, message: e.target.value})}
                  placeholder={language === "es" ? "Escriba su mensaje de respuesta aquí..." : "Type your reply message here..."}
                  className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="textarea-reply-message"
                />
              </div>

              <div>
                <Label htmlFor="replyPriority">{language === "es" ? "Prioridad" : "Priority"}</Label>
                <Select 
                  value={replyForm.priority} 
                  onValueChange={(value) => setReplyForm({...replyForm, priority: value as "low" | "normal" | "high" | "urgent"})}
                >
                  <SelectTrigger data-testid="select-reply-priority">
                    <SelectValue placeholder={language === "es" ? "Seleccionar prioridad" : "Select priority"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{language === "es" ? "Baja" : "Low"}</SelectItem>
                    <SelectItem value="normal">{language === "es" ? "Normal" : "Normal"}</SelectItem>
                    <SelectItem value="high">{language === "es" ? "Alta" : "High"}</SelectItem>
                    <SelectItem value="urgent">{language === "es" ? "Urgente" : "Urgent"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-sm text-blue-700">
                  <Phone className="h-4 w-4 inline mr-1" />
                  {language === "es" 
                    ? "Recibirá confirmación por SMS cuando se envíe su respuesta."
                    : "You'll receive an SMS confirmation when your reply is sent."
                  }
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    if (!replyForm.subject.trim() || !replyForm.message.trim()) {
                      toast({
                        title: language === "es" ? "Información faltante" : "Missing information",
                        description: language === "es" 
                          ? "Por favor complete tanto el asunto como el mensaje."
                          : "Please fill in both subject and message.",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Prepare reply data based on original message sender
                    const replyData = {
                      recipientType: selectedMessage.senderType === "teacher" ? "teacher" : "admin",
                      teacherId: selectedMessage.senderType === "teacher" ? selectedMessage.senderId : undefined,
                      subject: replyForm.subject,
                      message: replyForm.message,
                      priority: replyForm.priority,
                      parentId: parentData?.id,
                      senderType: "parent",
                      scholarId: selectedMessage.scholarId,
                    };

                    replyMutation.mutate(replyData);
                  }}
                  disabled={replyMutation.isPending || !replyForm.subject.trim() || !replyForm.message.trim()}
                  data-testid="button-send-reply"
                >
                  {replyMutation.isPending 
                    ? (language === "es" ? "Enviando..." : "Sending...")
                    : (language === "es" ? "Enviar Respuesta" : "Send Reply")
                  }
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowReplyModal(false);
                    setReplyForm({ subject: "", message: "", priority: "normal" });
                  }}
                  data-testid="button-cancel-reply"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}