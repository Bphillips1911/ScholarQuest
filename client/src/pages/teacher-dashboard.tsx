import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";
import { LogOut, Users, Award, Plus, MessageCircle, UserX, Clock, Send, Home, BookOpen, Trophy, Calendar, Heart, FileText, Shuffle, Camera, Image, Download, ChevronDown, Palette, Edit3 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { TeacherReflectionModal } from "@/components/TeacherReflectionModal";
import { PBISCategorySelector } from "@/components/PBISCategorySelector";
import { TeacherStoryReview } from "@/components/teacher-story-review";

interface Teacher {
  id: string;
  name: string;
  email: string;
  role: string;
  gradeRole: string;
  subject?: string;
  canSeeGrades: number[];
}

interface Scholar {
  id: string;
  name: string;
  studentId: string;
  houseId: string;
  grade: number;
  academicPoints: number;
  attendancePoints: number;
  behaviorPoints: number;
}

interface Reflection {
  id: string;
  scholarId: string;
  prompt: string;
  response: string | null;
  status: 'assigned' | 'submitted' | 'approved' | 'rejected';
  teacherFeedback: string | null;
  dueDate: string | null;
  assignedAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
}

export default function TeacherDashboard() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [showAddScholar, setShowAddScholar] = useState(false);
  const [showAwardPoints, setShowAwardPoints] = useState(false);
  const [showDeactivateStudent, setShowDeactivateStudent] = useState(false);
  const [selectedScholar, setSelectedScholar] = useState<Scholar | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [activeView, setActiveView] = useState<'scholars' | 'messages'>('scholars');
  const [activeTab, setActiveTab] = useState("dashboard");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [photoDescription, setPhotoDescription] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'normal'>('normal');

  // Modal close helper function
  const closeAddScholarModal = () => {
    setShowAddScholar(false);
    setNewScholar({
      name: "",
      studentId: "",
      houseId: "",
      grade: 6,
      username: "",
      password: "",
    });
  };

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showAddScholar) {
          closeAddScholarModal();
        } else if (showAwardPoints) {
          setShowAwardPoints(false);
        } else if (showDeactivateStudent) {
          setShowDeactivateStudent(false);
          setDeactivationReason("");
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showAddScholar, showAwardPoints, showDeactivateStudent]);

  // Scholar form state
  const [newScholar, setNewScholar] = useState({
    name: "",
    studentId: "",
    houseId: "",
    grade: 6,
    username: "",
    password: "",
  });

  // PBIS form state - Updated for new category system
  const [pbisForm, setPbisForm] = useState({
    category: "",
    subcategory: "",
    customReason: "",
    points: 0
  });

  // Reply modal state
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyForm, setReplyForm] = useState({
    subject: "",
    message: "",
    priority: "normal"
  });

  // Compose new message modal state
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeForm, setComposeForm] = useState({
    recipientType: "",
    parentId: "",
    adminId: "",
    scholarId: "",
    subject: "",
    message: "",
    priority: "normal"
  });

  // Function to refresh teacher data from server
  const refreshTeacherData = async () => {
    const token = localStorage.getItem("teacherToken");
    if (!token) return;
    
    try {
      // Detect deployment environment
      const isDeployment = window.location.hostname.includes('.replit.app');
      const timestamp = Date.now();
      
      console.log("CACHE DEBUG: Environment:", isDeployment ? "DEPLOYMENT" : "PREVIEW");
      console.log("CACHE DEBUG: Fetching fresh teacher data with timestamp:", timestamp);
      
      // DEPLOYMENT SPECIFIC: Aggressive cache busting for deployment environment
      const deploymentParams = isDeployment ? 
        `bust=${timestamp}&deploy=true&force=${Math.random()}&clear=cache&env=deployment` :
        `bust=${timestamp}&env=preview`;
        
      const response = await fetch(`/api/teacher-auth/verify?${deploymentParams}`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
          "If-None-Match": "*",
          "X-Deployment-Cache-Bust": isDeployment ? "true" : "false",
          "X-Fresh-Data-Request": "true"
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("TEACHER DASHBOARD: Fresh teacher data from server:", data.teacher);
        console.log("CACHE DEBUG: Grade Role received:", data.teacher.gradeRole, "Subject:", data.teacher.subject);
        
        // Force immediate state update to ensure UI reflects fresh data
        console.log("CACHE DEBUG: Setting fresh teacher data immediately");
        setTeacher(data.teacher); // Set fresh data immediately
        
        if (data.teacher.canSeeGrades?.length >= 1) {
          setSelectedGrade(data.teacher.canSeeGrades[0]);
          setActiveView('scholars');
        }
      } else {
        console.log("CACHE DEBUG: Auth failed, redirecting to login");
        setLocation("/teacher-login");
      }
    } catch (error) {
      console.log("Could not refresh teacher data", error);
      setLocation("/teacher-login");
    }
  };

  // Theme toggle function
  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'normal')[] = ['normal', 'light', 'dark'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setCurrentTheme(nextTheme);
    localStorage.setItem("teacherTheme", nextTheme);
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

  useEffect(() => {
    const token = localStorage.getItem("teacherToken");
    const savedTheme = localStorage.getItem("teacherTheme") as 'light' | 'dark' | 'normal' || 'normal';
    const isDeployment = window.location.hostname.includes('replit.app');
    
    setCurrentTheme(savedTheme);
    
    console.log("TEACHER DASHBOARD INIT:", {
      hasToken: !!token,
      isDeployment,
      hostname: window.location.hostname
    });
    
    if (!token) {
      console.log("No token found, redirecting to login");
      setLocation("/teacher-login");
      return;
    }
    
    // DEPLOYMENT CACHE FIX: Always fetch fresh data, never use localStorage cache
    // This ensures deployments always show correct data from database
    console.log("DEPLOYMENT CACHE FIX: Clearing all cached teacher data and fetching fresh from server...");
    
    // Clear all cached teacher data to force fresh fetch
    localStorage.removeItem("teacherData");
    
    if (isDeployment) {
      // DEPLOYMENT FIX: Extra verification of token validity in deployment
      console.log("DEPLOYMENT MODE: Verifying token validity before proceeding...");
      
      // Test token with a simple API call first
      fetch("/api/teacher-auth/verify", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
      .then(response => {
        if (response.ok) {
          console.log("DEPLOYMENT: Token verified successfully");
          refreshTeacherData();
        } else {
          console.error("DEPLOYMENT: Token verification failed, redirecting to login");
          localStorage.removeItem("teacherToken");
          localStorage.removeItem("teacherData");
          setLocation("/teacher-login");
        }
      })
      .catch(error => {
        console.error("DEPLOYMENT: Token verification error:", error);
        refreshTeacherData(); // Try anyway as a fallback
      });
    } else {
      // Preview mode: proceed normally
      refreshTeacherData();
    }
  }, [setLocation]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("teacherToken");
    console.log("DEPLOYMENT AUTH DEBUG: Getting token from localStorage:", token ? "Token found" : "No token");
    
    if (!token) {
      console.error("TEACHER AUTH: No token found in localStorage, redirecting to login");
      setLocation("/teacher-login");
      throw new Error("Authentication token not found");
    }
    
    // DEPLOYMENT FIX: Add deployment-specific headers for cache-busting
    const isDeployment = window.location.hostname.includes('replit.app');
    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Requested-With": "XMLHttpRequest"
    };
    
    if (isDeployment) {
      headers["X-Deployment-Cache-Bust"] = Date.now().toString();
      headers["X-Force-Fresh"] = "true";
      console.log("DEPLOYMENT AUTH: Added deployment-specific headers");
    }
    
    return headers;
  };

  // Fetch scholars based on selected grade
  const { data: scholars = [], isLoading } = useQuery({
    queryKey: ["scholars", "grade", selectedGrade],
    queryFn: async () => {
      if (!selectedGrade) return [];
      const response = await fetch(`/api/scholars/grade/${selectedGrade}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch scholars");
      return response.json();
    },
    enabled: !!selectedGrade,
  });

  // Fetch houses for dashboard and scholar creation
  const { data: houses = [] } = useQuery({
    queryKey: ["/api/houses"],
    // Always fetch houses for dashboard display
  });

  // Fetch messages for the teacher
  const { data: messages = [] } = useQuery({
    queryKey: ["/api/teacher/messages", teacher?.id],
    queryFn: async () => {
      if (!teacher?.id) return [];
      const response = await fetch(`/api/teacher/messages`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!teacher?.id,
  });

  // Fetch parents for compose message dropdown
  const { data: parents = [] } = useQuery({
    queryKey: ["/api/teacher/parents"],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/parents`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch parents");
      return response.json();
    },
    enabled: !!teacher?.id,
  });

  // Fetch administrators for compose message dropdown
  const { data: administrators = [] } = useQuery({
    queryKey: ["/api/teacher/administrators"],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/administrators`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch administrators");
      const data = response.json();
      console.log("🔍 FRONTEND: Administrators data received:", data);
      return data;
    },
    enabled: !!teacher?.id,
  });

  // Fetch reflections for teacher
  const { data: reflections = [] } = useQuery({
    queryKey: ["/api/teacher/reflections"],
    queryFn: async () => {
      const response = await fetch("/api/teacher/reflections", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch reflections");
      return response.json();
    },
    enabled: !!teacher?.id,
  });

  // Reply to parent or admin mutation
  const replyMutation = useMutation({
    mutationFn: async (replyData: any) => {
      console.log("🚀 TEACHER DASHBOARD REPLY: Sending reply with data:", JSON.stringify(replyData, null, 2));
      const response = await fetch("/api/teacher/send-message", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(replyData),
      });
      if (!response.ok) throw new Error("Failed to send reply");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/messages"] });
      setShowReplyModal(false);
      setReplyForm({ subject: "", message: "", priority: "normal" });
      toast({
        title: "Reply sent successfully",
        description: `Your message has been sent to the ${selectedMessage?.sender_type === 'admin' ? 'administrator' : 'parent'}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send reply",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Compose new message mutation
  const composeMutation = useMutation({
    mutationFn: async (messageData: any) => {
      console.log("🚀 TEACHER DASHBOARD COMPOSE: Sending new message with data:", JSON.stringify(messageData, null, 2));
      const response = await fetch("/api/teacher/send-message", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(messageData),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/messages"] });
      setShowComposeModal(false);
      setComposeForm({
        recipientType: "",
        parentId: "",
        adminId: "",
        scholarId: "",
        subject: "",
        message: "",
        priority: "normal"
      });
      toast({
        title: "Message sent successfully",
        description: `Your message has been sent to the ${composeForm.recipientType === 'admin' ? 'administrator' : 'parent'}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send reply",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch gallery photos
  const { data: galleryPhotos = [] } = useQuery({
    queryKey: ["/api/pbis-photos"],
    queryFn: async () => {
      const response = await fetch("/api/pbis-photos");
      if (!response.ok) throw new Error("Failed to fetch photos");
      return response.json();
    },
  });

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/upload-pbis-photo", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("teacherToken")}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload photo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pbis-photos"] });
      setShowUploadModal(false);
      setUploadedFile(null);
      setPhotoDescription("");
      toast({
        title: "Photo uploaded successfully",
        description: "Your photo has been added to the gallery.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please select a photo to upload.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("photo", uploadedFile);
    formData.append("description", photoDescription);
    formData.append("uploadedBy", teacher?.name || "Teacher");

    uploadPhotoMutation.mutate(formData);
  };

  // Add scholar mutation with enhanced deployment error handling
  const addScholarMutation = useMutation({
    mutationFn: async (scholarData: any) => {
      console.log("ADD SCHOLAR: Starting request with data:", scholarData);
      console.log("ADD SCHOLAR: Environment check - Deployment:", window.location.hostname.includes('replit.app'));
      
      try {
        // DEPLOYMENT FIX: Verify token exists before proceeding
        const token = localStorage.getItem("teacherToken");
        if (!token) {
          console.error("ADD SCHOLAR: No token in localStorage, redirecting");
          setLocation("/teacher-login");
          throw new Error("Authentication required. Please login again.");
        }
        
        const headers = getAuthHeaders();
        console.log("ADD SCHOLAR: Headers prepared successfully");
        
        const response = await fetch("/api/teacher/scholars", {
          method: "POST",
          headers,
          body: JSON.stringify(scholarData),
        });
        
        console.log("ADD SCHOLAR: Response status:", response.status);
        console.log("ADD SCHOLAR: Response headers:", Object.fromEntries(response.headers.entries()));
        
        if (response.status === 401) {
          console.error("ADD SCHOLAR: Token invalid (401), clearing storage and redirecting");
          localStorage.removeItem("teacherToken");
          localStorage.removeItem("teacherData");
          setLocation("/teacher-login");
          throw new Error("Session expired. Please login again.");
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("ADD SCHOLAR: Server error response:", errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || `HTTP ${response.status}` };
          }
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: Failed to add scholar`);
        }
        
        const result = await response.json();
        console.log("ADD SCHOLAR: Success:", result);
        return result;
      } catch (error) {
        console.error("ADD SCHOLAR: Mutation error:", error);
        // DEPLOYMENT FIX: Special handling for deployment auth errors
        if (error.message.includes("token") || error.message.includes("401")) {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Your session has expired. Please login again.",
          });
          localStorage.removeItem("teacherToken");
          localStorage.removeItem("teacherData");
          setLocation("/teacher-login");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholars"] });
      setShowAddScholar(false);
      setNewScholar({ name: "", studentId: "", houseId: "", grade: 6, username: "", password: "" });
      toast({
        title: "Scholar Added",
        description: "Student has been successfully added with login credentials",
      });
    },
    onError: (error: Error) => {
      console.error("Add scholar error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add scholar",
        variant: "destructive",
      });
    },
  });

  // Award PBIS points mutation - Updated for new system
  const awardPointsMutation = useMutation({
    mutationFn: async (pbisData: {
      scholarId: string;
      teacherName: string;
      teacherRole: string;
      mustangTrait: string;
      points: number;
      reason: string;
    }) => {
      const response = await fetch("/api/pbis", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(pbisData),
      });
      if (!response.ok) throw new Error("Failed to award PBIS points");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholars"] });
      queryClient.invalidateQueries({ queryKey: ["houses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pbis"] });
      setShowAwardPoints(false);
      setSelectedScholar(null);
      const pointValue = pbisForm.points;
      setPbisForm({ category: "", subcategory: "", customReason: "", points: 0 });
      toast({
        title: "PBIS Recognition Added",
        description: `${selectedScholar?.name} has been recognized with ${pointValue > 0 ? 'positive' : 'corrective'} points.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to award PBIS points",
        variant: "destructive",
      });
    },
  });

  // Deactivate student mutation
  const deactivateStudentMutation = useMutation({
    mutationFn: async (data: { studentId: string; reason: string }) => {
      const response = await fetch("/api/teacher/deactivate-student", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to deactivate student");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholars"] });
      setShowDeactivateStudent(false);
      setSelectedScholar(null);
      setDeactivationReason("");
      toast({
        title: "Student Deactivated",
        description: "Student has been successfully deactivated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate student",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("teacherToken");
    localStorage.removeItem("teacherData");
    setLocation("/teacher-login");
  };

  // Username generation function
  const generateUsername = () => {
    if (!newScholar.name || !newScholar.studentId) {
      toast({
        title: "Missing Information",
        description: "Please enter student name and ID first",
        variant: "destructive",
      });
      return;
    }

    const nameParts = newScholar.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';
    
    // Take first 3 letters of first and last name
    const firstPart = firstName.toLowerCase().substring(0, 3);
    const lastPart = lastName.toLowerCase().substring(0, 3);
    
    // Get last 2 digits of student ID
    const studentIdDigits = newScholar.studentId.replace(/\D/g, '');
    const lastTwoDigits = studentIdDigits.slice(-2).padStart(2, '0');
    
    const generatedUsername = `${firstPart}${lastPart}${lastTwoDigits}`;
    
    setNewScholar(prev => ({
      ...prev,
      username: generatedUsername
    }));

    toast({
      title: "Username Generated",
      description: `Generated username: ${generatedUsername}`,
    });
  };

  // Password generation function
  const generatePassword = () => {
    if (!newScholar.studentId) {
      toast({
        title: "Missing Information",
        description: "Please enter student ID first",
        variant: "destructive",
      });
      return;
    }

    const generatedPassword = `bhsa${newScholar.studentId.toLowerCase()}`;
    
    setNewScholar(prev => ({
      ...prev,
      password: generatedPassword
    }));

    toast({
      title: "Password Generated",
      description: "Password generated successfully",
    });
  };


  const handleAddScholar = () => {
    if (!newScholar.name || !newScholar.studentId || !newScholar.houseId || !newScholar.username || !newScholar.password) {
      toast({
        title: "Missing Information", 
        description: "Please fill in all required fields including username and password",
        variant: "destructive",
      });
      return;
    }
    addScholarMutation.mutate(newScholar);
  };

  const handleAwardPoints = () => {
    if (!selectedScholar) {
      toast({
        title: "Missing Information",
        description: "Please select a student",
        variant: "destructive",
      });
      return;
    }

    if (!pbisForm.category || !pbisForm.subcategory) {
      toast({
        title: "Missing Information",
        description: "Please select a recognition category and specific recognition",
        variant: "destructive",
      });
      return;
    }
    
    const finalReason = pbisForm.customReason.trim() ? pbisForm.customReason : pbisForm.subcategory;
    
    awardPointsMutation.mutate({
      scholarId: selectedScholar.id,
      teacherName: teacher?.name || "Unknown Teacher",
      teacherRole: teacher?.gradeRole as "6th Grade" | "7th Grade" | "8th Grade" | "Unified Arts" | "Administration" | "Counselor",
      mustangTrait: "Make good choices",
      category: pbisForm.category,
      subcategory: pbisForm.subcategory,
      points: pbisForm.points,
      reason: finalReason,
      entryType: pbisForm.points > 0 ? "positive" : "negative",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });
  };

  const handleDeactivateStudent = () => {
    if (!selectedScholar || !deactivationReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for deactivation",
        variant: "destructive",
      });
      return;
    }
    
    deactivateStudentMutation.mutate({
      studentId: selectedScholar.id,
      reason: deactivationReason,
    });
  };

  if (!teacher) {
    return <div>Loading...</div>;
  }

  const mustangTraits = [
    { value: "Make Good Choices", label: "M - Make Good Choices" },
    { value: "Use Kind Words", label: "U - Use Kind Words" },
    { value: "Show School Pride", label: "S - Show School Pride" },
    { value: "Tolerant of Others", label: "T - Tolerant of Others" },
    { value: "Aim for Excellence", label: "A - Aim for Excellence" },
    { value: "Need to be responsible", label: "N - Need to be responsible" },
    { value: "Give 100% everyday", label: "G - Give 100% everyday" },
  ];

  const pointCategories = [
    { value: "behavior", label: "Behavior (MUSTANG Traits)" },
    { value: "academic", label: "Academic Performance" },
    { value: "attendance", label: "Attendance" },
  ];

  const academicCriteria = [
    "Scoring Green on I-Ready assessments",
    "Show growth on I-Ready and ACAP Practice Test",
    "Passing required pathway lessons", 
    "Scoring proficient on ACAP Practice Test 1 and 2",
    "Passing teacher assessments",
    "Turning in homework consistently",
    "Completing projects on time",
    "Achieving A/B honor roll status"
  ];

  const attendanceCriteria = [
    "Perfect attendance for the week",
    "Arriving to class on time",
    "Being prepared for class",
    "Attend school between 90%-100% during each month"
  ];

  const positiveReasons = [
    "Demonstrated excellent MUSTANG trait behavior",
    "Helped a classmate with their work",
    "Showed outstanding leadership skills",
    "Completed work above expectations",
    "Participated actively in class discussion",
    "Showed improvement in academic performance",
    "Demonstrated good sportsmanship",
    "Followed directions immediately",
    "Showed respect to teachers and peers",
    "Went above and beyond on assignment",
    "Perfect attendance for the week",
    "Arrived to class on time consistently",
    "Came to class prepared every day",
    "Scored Green on I-Ready assessment",
    "Showed growth on standardized tests",
    "Completed all homework assignments",
    "Achieved honor roll status"
  ];

  const negativeReasons = [
    "Disruptive behavior in class",
    "Did not follow classroom rules",
    "Incomplete or missing homework",
    "Disrespectful to teacher or peers",
    "Not prepared for class",
    "Excessive tardiness",
    "Poor academic effort",
    "Inappropriate language or behavior",
    "Not participating in class activities",
    "Violating school dress code",
    "Using phone during class time",
    "Sleeping or not paying attention"
  ];

  return (
    <div className="min-h-screen" style={{background: themeStyles.background}}>
      {/* Main Navigation Bar with Dropdown Menus */}
      <div className="bg-blue-600 text-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-4">
              
              {/* Main Pages Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:text-blue-200 hover:bg-blue-700">
                    <Home className="h-4 w-4 mr-2" />
                    Main Pages
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white">
                  <DropdownMenuItem onClick={() => setLocation('/dashboard')}>
                    <Home className="h-4 w-4 mr-2" />
                    Main Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/tutorial')}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Tutorial
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/houses')}>
                    <Trophy className="h-4 w-4 mr-2" />
                    Houses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/pbis')}>
                    <Award className="h-4 w-4 mr-2" />
                    PBIS
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/pledge')}>
                    <Heart className="h-4 w-4 mr-2" />
                    House Pledge
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Reports & Tools Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:text-blue-200 hover:bg-blue-700">
                    <FileText className="h-4 w-4 mr-2" />
                    Reports & Tools
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white">
                  <DropdownMenuItem onClick={() => setLocation('/monthly-pbis')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Monthly Tracking
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/house-sorting')}>
                    <Shuffle className="h-4 w-4 mr-2" />
                    House Sorting
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/parent-letter')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Parent Letter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Teacher Messaging */}
              <Button 
                variant="ghost" 
                className="text-white hover:text-blue-200 hover:bg-blue-700"
                onClick={() => setLocation('/teacher-messages')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Messages
              </Button>

            </div>
            
            <div className="flex items-center space-x-2">
              {/* Theme Toggle Button */}
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
                {currentTheme === 'dark' ? 'Dark' : currentTheme === 'light' ? 'Light' : 'Normal'}
              </Button>
              
              <Button 
                variant="ghost" 
                className="text-white hover:text-red-200 hover:bg-red-600"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Dashboard Content */}
      <section className="p-4" data-testid="teacher-dashboard-section">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
        <Card className="mb-6 shadow-lg" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img 
                  src={schoolLogoPath} 
                  alt="Bush Hills STEAM Academy" 
                  className="h-12 w-auto mr-4 school-logo-3d"
                  data-testid="dashboard-school-logo"
                />
                <div>
                  <h1 className="text-xl font-bold school-name-3d" style={{color: themeStyles.textPrimary}}>Teacher Dashboard</h1>
                  <p className="text-sm program-title-3d" style={{color: themeStyles.textSecondary}}>Welcome, {teacher.name}</p>
                  <p className="text-xs" style={{color: themeStyles.textSecondary}}>{teacher.gradeRole} - {teacher.subject}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: themeStyles.cardBg,
                  color: themeStyles.textPrimary,
                  borderColor: themeStyles.border
                }}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Main Teacher Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
            <TabsTrigger value="dashboard" style={{color: themeStyles.textPrimary}}>Dashboard</TabsTrigger>
            <TabsTrigger value="scholars" style={{color: themeStyles.textPrimary}}>Scholars</TabsTrigger>
            <TabsTrigger value="reflections" style={{color: themeStyles.textPrimary}}>
              Reflections
              {reflections.filter((r: Reflection) => r.status === 'submitted').length > 0 && (
                <span className="ml-1 px-1 bg-red-500 text-white text-xs rounded-full">
                  {reflections.filter((r: Reflection) => r.status === 'submitted').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="story-review" style={{color: themeStyles.textPrimary}}>
              <FileText className="h-4 w-4 mr-1" />
              Story Review
            </TabsTrigger>
            <TabsTrigger value="upload" style={{color: themeStyles.textPrimary}}>Upload Photos</TabsTrigger>
            <TabsTrigger value="gallery" style={{color: themeStyles.textPrimary}}>Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Grade Selection */}
            {teacher.canSeeGrades?.length > 1 && (
              <Card className="mb-6" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                <CardHeader>
                  <CardTitle style={{color: themeStyles.textPrimary}}>Select Grade Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {teacher.canSeeGrades.map((grade) => (
                      <Button
                        key={grade}
                        variant={selectedGrade === grade ? "default" : "outline"}
                        onClick={() => setSelectedGrade(grade)}
                        data-testid={`button-grade-${grade}`}
                      >
                        Grade {grade}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* House Statistics Dashboard */}
            {houses && houses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {houses.map((house) => (
                  <Card key={house.id} className="text-center" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg" style={{ color: house.color }}>
                        {house.icon} {house.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 text-sm">
                        <p style={{color: themeStyles.textPrimary}}><strong>Academic:</strong> {house.academicPoints || 0}</p>
                        <p style={{color: themeStyles.textPrimary}}><strong>Attendance:</strong> {house.attendancePoints || 0}</p>
                        <p style={{color: themeStyles.textPrimary}}><strong>Behavior:</strong> {house.behaviorPoints || 0}</p>
                        <p className="font-bold" style={{color: themeStyles.textPrimary}}>
                          <strong>Total:</strong> {(house.academicPoints || 0) + (house.attendancePoints || 0) + (house.behaviorPoints || 0)}
                        </p>
                        <p style={{color: themeStyles.textSecondary}}>Members: {house.memberCount || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scholars" className="space-y-6">
            {/* Grade Selection for Scholars Tab */}
            {teacher.canSeeGrades?.length > 1 && (
              <Card className="mb-6" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                <CardHeader>
                  <CardTitle style={{color: themeStyles.textPrimary}}>Select Grade Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {teacher.canSeeGrades.map((grade) => (
                      <Button
                        key={grade}
                        variant={selectedGrade === grade ? "default" : "outline"}
                        onClick={() => setSelectedGrade(grade)}
                        data-testid={`button-grade-${grade}`}
                      >
                        Grade {grade}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons for Scholars Tab */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Button
                onClick={() => setShowAddScholar(true)}
                className="flex items-center gap-2"
                data-testid="button-add-scholar"
              >
                <Plus className="h-4 w-4" />
                Add Scholar
              </Button>
              <Button
                onClick={() => setShowAwardPoints(true)}
                disabled={!selectedScholar}
                className="flex items-center gap-2"
                data-testid="button-award-points"
              >
                <Award className="h-4 w-4" />
                Award MUSTANG Points
              </Button>
              <Button
                onClick={() => setShowDeactivateStudent(true)}
                disabled={!selectedScholar}
                variant="destructive"
                className="flex items-center gap-2"
                data-testid="button-deactivate-student"
              >
                <UserX className="h-4 w-4" />
                Deactivate Student
              </Button>
            </div>

            {/* Scholars Content */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
              <button
                onClick={() => setActiveView('scholars')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'scholars'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-testid="tab-scholars"
              >
                <Users className="h-4 w-4 inline mr-2" />
                My Scholars
              </button>
              <button
                onClick={() => setActiveView('messages')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'messages'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-testid="tab-messages"
              >
                <MessageCircle className="h-4 w-4 inline mr-2" />
                Messages {messages.length > 0 && (
                  <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                    {messages.length}
                  </span>
                )}
              </button>
            </div>

            {/* Scholars and Messages Content would go here - keeping existing content */}
          </TabsContent>

          <TabsContent value="reflections" className="space-y-6">
            <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{color: themeStyles.textPrimary}}>
                  <FileText className="h-5 w-5" />
                  Behavioral Reflections
                  <span className="text-sm font-normal" style={{color: themeStyles.textSecondary}}>
                    ({reflections.length} total)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reflections.length > 0 ? (
                  <div className="space-y-3">
                    {reflections.map((reflection: Reflection) => {
                      const student = scholars.find((s: Scholar) => s.id === reflection.scholarId);
                      return (
                        <div 
                          key={reflection.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          style={{borderColor: themeStyles.border}}
                          onClick={() => {
                            setSelectedReflection(reflection);
                            setShowReflectionModal(true);
                          }}
                          data-testid={`teacher-reflection-item-${reflection.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className={`w-3 h-3 rounded-full ${
                                  reflection.status === 'assigned' ? 'bg-yellow-500' :
                                  reflection.status === 'submitted' ? 'bg-blue-500' :
                                  reflection.status === 'approved' ? 'bg-green-500' :
                                  'bg-red-500'
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium" style={{color: themeStyles.textPrimary}}>
                                  {student?.name || 'Unknown Student'}
                                </p>
                                <p className="text-sm" style={{color: themeStyles.textSecondary}}>
                                  {reflection.status.charAt(0).toUpperCase() + reflection.status.slice(1)}
                                  {reflection.status === 'submitted' && ' • Needs Review'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-sm" style={{color: themeStyles.textSecondary}}>
                                  Assigned {new Date(reflection.assignedAt).toLocaleDateString()}
                                </p>
                                {reflection.submittedAt && (
                                  <p className="text-xs" style={{color: themeStyles.textSecondary}}>
                                    Submitted {new Date(reflection.submittedAt).toLocaleDateString()}
                                  </p>
                                )}
                                {reflection.dueDate && (
                                  <p className="text-xs text-orange-600">
                                    Due {new Date(reflection.dueDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <Edit3 className="h-4 w-4" style={{color: themeStyles.textSecondary}} />
                            </div>
                          </div>
                          {reflection.response && (
                            <div className="mt-3 p-3 bg-gray-50 rounded text-sm" style={{color: themeStyles.textPrimary}}>
                              <strong>Student Response:</strong> {reflection.response.substring(0, 100)}...
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto mb-4" style={{color: themeStyles.textSecondary}} />
                    <h3 className="text-lg font-medium mb-2" style={{color: themeStyles.textPrimary}}>
                      No reflections yet
                    </h3>
                    <p style={{color: themeStyles.textSecondary}}>
                      Reflections are automatically assigned when students receive negative PBIS points.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="story-review" className="space-y-6">
            <TeacherStoryReview />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Upload Activity Photos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="photo-input">Select Photo</Label>
                  <Input
                    id="photo-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo-description">Description</Label>
                  <textarea
                    id="photo-description"
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Describe the activity or event in this photo..."
                    value={photoDescription}
                    onChange={(e) => setPhotoDescription(e.target.value)}
                  />
                </div>
                {uploadedFile && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>File:</strong> {uploadedFile.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Size:</strong> {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
                <Button 
                  onClick={handlePhotoUpload}
                  disabled={!uploadedFile || uploadPhotoMutation.isPending}
                  className="w-full"
                >
                  {uploadPhotoMutation.isPending ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Photo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Activity Gallery ({galleryPhotos?.length || 0} photos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {galleryPhotos && galleryPhotos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          {/* Teacher Download Button */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
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
                          <p className="text-sm text-gray-600 mb-2">{photo.description || 'No description'}</p>
                          <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                            <span className="font-medium">By: {photo.uploadedBy}</span>
                            <span>{photo.createdAt ? new Date(photo.createdAt).toLocaleDateString() : 'Recently'}</span>
                          </div>
                          <div className="pt-2 border-t border-gray-100">
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
                              Download Photo
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">No photos uploaded yet</p>
                    <p className="text-gray-400 text-sm">Upload your first activity photo using the Upload Photos tab</p>
                    <Button 
                      onClick={() => setActiveTab('upload')}
                      className="mt-4"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Photos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Content for existing sections would continue here */}
        {teacher && activeView === 'scholars' && selectedGrade && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Grade {selectedGrade} Scholars</CardTitle>
            </CardHeader>
            <CardContent>
              {scholars && scholars.length > 0 ? (
                <div className="space-y-2">
                  {scholars.map((scholar: Scholar) => (
                    <div
                      key={scholar.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedScholar?.id === scholar.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedScholar(scholar)}
                      data-testid={`scholar-card-${scholar.id}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{scholar.name}</h4>
                          <p className="text-sm text-gray-600">ID: {scholar.studentId}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p><strong>Academic:</strong> {scholar.academicPoints}</p>
                          <p><strong>Attendance:</strong> {scholar.attendancePoints}</p>
                          <p><strong>Behavior:</strong> {scholar.behaviorPoints}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No scholars found for this grade level.</p>
              )}
            </CardContent>
          </Card>
        )}

        {teacher && activeView === 'messages' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Message content goes here */}
              <p className="text-gray-500">Message functionality will be displayed here.</p>
            </CardContent>
          </Card>
        )}

        {/* Scholars List */}
        {teacher && activeView === 'scholars' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Grade {selectedGrade} Scholars
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading scholars...</p>
              ) : scholars.length === 0 ? (
                <p className="text-gray-500">No scholars found for Grade {selectedGrade}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scholars.map((scholar: Scholar) => (
                    <div
                      key={scholar.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedScholar?.id === scholar.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedScholar(scholar)}
                      data-testid={`scholar-card-${scholar.studentId}`}
                    >
                      <h4 className="font-semibold">{scholar.name}</h4>
                      <p className="text-sm text-gray-600">ID: {scholar.studentId}</p>
                      <p className="text-sm text-gray-600">House: {scholar.houseId}</p>
                      <div className="mt-2 text-xs">
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1">
                          Academic: {scholar.academicPoints}
                        </span>
                        <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-1">
                          Attendance: {scholar.attendancePoints}
                        </span>
                        <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          Behavior: {scholar.behaviorPoints}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Messages Inbox */}
        {teacher && activeView === 'messages' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <MessageCircle className="mr-2 h-5 w-5 text-blue-600" />
                  Messages
                </CardTitle>
                <Button
                  onClick={() => {
                    setComposeForm({
                      recipientType: "",
                      parentId: "",
                      adminId: "",
                      scholarId: "",
                      subject: "",
                      message: "",
                      priority: "normal"
                    });
                    setShowComposeModal(true);
                  }}
                  className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                  data-testid="button-compose-message"
                >
                  <Send className="h-4 w-4" />
                  Compose New Message
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message: any) => (
                    <div
                      key={message.id}
                      className={`p-4 border rounded-lg ${
                        message.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                      }`}
                      data-testid={`message-${message.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{message.subject}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <span>From: <strong>{message.first_name} {message.last_name}</strong></span>
                            <span>•</span>
                            <span>About: <strong>{message.scholar_name}</strong></span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!message.is_read && (
                            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                              New
                            </span>
                          )}
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <div>
                              {message.created_at && !isNaN(new Date(message.created_at).getTime()) ? (
                                <div>
                                  <div className="font-medium">
                                    {format(new Date(message.created_at), 'MMM dd, yyyy')}
                                  </div>
                                  <div className="text-gray-400">
                                    {format(new Date(message.created_at), 'h:mm a')} • 
                                    {isToday(new Date(message.created_at)) ? ' Today' :
                                     isYesterday(new Date(message.created_at)) ? ' Yesterday' :
                                     ` ${formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}`
                                    }
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="font-medium">Today</div>
                                  <div className="text-gray-400">Just now</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded border-l-4 border-green-500 mb-3">
                        <p className="text-gray-700">{message.message}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            message.sender_type === 'parent' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {message.sender_type === 'parent' ? 'From parent' : 'From you'}
                          </span>
                          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                            Priority: {message.priority}
                          </span>
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-blue-600"
                          onClick={() => {
                            console.log("🔥 TEACHER DASHBOARD: Reply button clicked for message:", JSON.stringify(message, null, 2));
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
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">📨 Teacher Communication Hub</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>✓ Receive messages directly from parents about their scholars</p>
                      <p>✓ Messages are securely stored in the database</p>
                      <p>✓ Email notifications sent when parents contact you</p>
                      <p>✓ Track communication history for each scholar</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 text-gray-300 mx-auto mb-4">
                    <MessageCircle className="h-full w-full" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                  <p className="text-gray-600 mb-4">
                    Messages from parents will appear here when they contact you about their scholars.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 max-w-md mx-auto">
                    <p className="text-sm text-blue-700">
                      <strong>✅ System Active:</strong> Parent-teacher messaging is now fully operational with database persistence.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add Scholar Modal */}
        {showAddScholar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              // Close modal when clicking outside the modal content
              if (e.target === e.currentTarget) {
                closeAddScholarModal();
              }
            }}
          >
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white border-b">
                <CardTitle>Add New Scholar</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeAddScholarModal}
                  className="h-10 w-10 p-0 border-2 border-gray-600 bg-white hover:bg-red-100 hover:border-red-500 transition-colors"
                  data-testid="button-close-modal"
                  title="Close modal"
                >
                  <span className="text-xl font-bold text-gray-800 hover:text-red-600">✕</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="scholarName">Scholar Name</Label>
                  <Input
                    id="scholarName"
                    value={newScholar.name}
                    onChange={(e) => setNewScholar({...newScholar, name: e.target.value})}
                    placeholder="Enter scholar's full name"
                    data-testid="input-scholar-name"
                  />
                </div>
                <div>
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={newScholar.studentId}
                    onChange={(e) => setNewScholar({...newScholar, studentId: e.target.value})}
                    placeholder="e.g., BH6001"
                    data-testid="input-student-id"
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grade</Label>
                  <Select 
                    value={newScholar.grade.toString()} 
                    onValueChange={(value) => setNewScholar({...newScholar, grade: parseInt(value)})}
                  >
                    <SelectTrigger data-testid="select-grade">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {teacher.canSeeGrades?.map((grade) => (
                        <SelectItem key={grade} value={grade.toString()}>
                          Grade {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="house">House</Label>
                  <Select 
                    value={newScholar.houseId} 
                    onValueChange={(value) => setNewScholar({...newScholar, houseId: value})}
                  >
                    <SelectTrigger data-testid="select-house">
                      <SelectValue placeholder="Select house" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(houses) && houses.map((house: any) => (
                        <SelectItem key={house.id} value={house.id}>
                          {house.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Username Generation Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Student Login Credentials</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateUsername}
                        disabled={!newScholar.name || !newScholar.studentId}
                        data-testid="button-generate-username"
                      >
                        Generate Username
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generatePassword}
                        disabled={!newScholar.studentId}
                        data-testid="button-generate-password"
                      >
                        Generate Password
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newScholar.username}
                        onChange={(e) => setNewScholar({...newScholar, username: e.target.value})}
                        placeholder="Generated or custom username"
                        data-testid="input-username"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Students will use this to log in to their accounts
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="text"
                        value={newScholar.password}
                        onChange={(e) => setNewScholar({...newScholar, password: e.target.value})}
                        placeholder="Generated or custom password"
                        data-testid="input-password"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Students will use this password to log in
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleAddScholar}
                    disabled={addScholarMutation.isPending || !newScholar.name || !newScholar.studentId || !newScholar.houseId}
                    data-testid="button-save-scholar"
                    className="flex-1"
                  >
                    {addScholarMutation.isPending ? "Adding..." : "Add Scholar"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={closeAddScholarModal}
                    data-testid="button-cancel-scholar"
                    className="flex-1 border-2 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Award Points Modal */}
        {showAwardPoints && selectedScholar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAwardPoints(false);
              }
            }}
          >
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">Award MUSTANG Points</CardTitle>
                  <p className="text-sm text-gray-600 font-medium">Scholar: {selectedScholar.name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAwardPoints(false)}
                  className="h-10 w-10 p-0 border-2 border-red-400 bg-white hover:bg-red-100 hover:border-red-600 flex-shrink-0"
                  data-testid="button-close-points-modal"
                >
                  <span className="text-xl font-bold text-red-600 hover:text-red-800">✕</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* PBIS Recognition Categories */}
                <PBISCategorySelector
                  selectedCategory={pbisForm.category}
                  selectedSubcategory={pbisForm.subcategory}
                  onCategorySelect={(categoryId) => setPbisForm({...pbisForm, category: categoryId, subcategory: ""})}
                  onSubcategorySelect={(subcategoryId, points) => setPbisForm({...pbisForm, subcategory: subcategoryId, points: points})}
                  onReasonChange={(reason) => setPbisForm({...pbisForm, customReason: reason})}
                  customReason={pbisForm.customReason}
                />





                <Button 
                  onClick={handleAwardPoints}
                  disabled={!pbisForm.category || !pbisForm.subcategory || !selectedScholar || awardPointsMutation.isPending}
                  className="w-full"
                  data-testid="button-award-points"
                >
                  {awardPointsMutation.isPending ? "Awarding..." : "Award MUSTANG Points"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Deactivate Student Modal */}
        {showDeactivateStudent && selectedScholar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDeactivateStudent(false);
              }
            }}
          >
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-red-600">Deactivate Student</CardTitle>
                  <p className="text-sm text-gray-600">Student: {selectedScholar.name}</p>
                  <p className="text-sm text-red-600 font-medium">⚠️ This action cannot be undone</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeactivateStudent(false)}
                  className="h-10 w-10 p-0 border-2 border-gray-400 bg-white hover:bg-red-50 hover:border-red-400"
                  data-testid="button-close-deactivate-modal"
                >
                  <span className="text-xl font-bold text-gray-700 hover:text-red-600">✕</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="deactivationReason">Reason for Deactivation</Label>
                  <Input
                    id="deactivationReason"
                    value={deactivationReason}
                    onChange={(e) => setDeactivationReason(e.target.value)}
                    placeholder="e.g., Student transferred to another school"
                    data-testid="input-deactivation-reason"
                  />
                </div>
                <div className="bg-red-50 p-3 rounded-md border border-red-200">
                  <h4 className="text-red-800 font-medium text-sm">What happens when you deactivate a student:</h4>
                  <ul className="text-red-700 text-xs mt-1 list-disc pl-4">
                    <li>Student will no longer appear in active student lists</li>
                    <li>Student will not be able to log in to their account</li>
                    <li>Previous points and records will be preserved</li>
                    <li>This action is permanent and cannot be reversed</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleDeactivateStudent}
                    disabled={deactivateStudentMutation.isPending || !deactivationReason.trim()}
                    variant="destructive"
                    data-testid="button-confirm-deactivation"
                  >
                    {deactivateStudentMutation.isPending ? "Deactivating..." : "Deactivate Student"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowDeactivateStudent(false);
                      setDeactivationReason("");
                    }}
                    data-testid="button-cancel-deactivation"
                  >
                    Cancel
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
                  <CardTitle>
                    {selectedMessage.sender_type === 'admin' ? 'Reply to Administrator' : 'Reply to Parent'}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {selectedMessage.sender_type === 'admin' 
                      ? `To: ${selectedMessage.sender_name || 'Administrator'}`
                      : `To: ${selectedMessage.first_name} ${selectedMessage.last_name}`
                    }
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
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Original Message:</h4>
                  <div className="text-sm">
                    <p><strong>Subject:</strong> {selectedMessage.subject}</p>
                    <p><strong>About:</strong> {selectedMessage.scholar_name}</p>
                    <div className="mt-2 p-3 bg-white rounded border-l-4 border-blue-500">
                      <p className="text-gray-700">{selectedMessage.message}</p>
                    </div>
                  </div>
                </div>

                {/* Reply Form */}
                <div>
                  <Label htmlFor="replySubject">Subject</Label>
                  <Input
                    id="replySubject"
                    value={replyForm.subject}
                    onChange={(e) => setReplyForm({...replyForm, subject: e.target.value})}
                    placeholder="Enter reply subject"
                    data-testid="input-reply-subject"
                  />
                </div>
                
                <div>
                  <Label htmlFor="replyMessage">Message</Label>
                  <textarea
                    id="replyMessage"
                    value={replyForm.message}
                    onChange={(e) => setReplyForm({...replyForm, message: e.target.value})}
                    placeholder="Type your reply message here..."
                    className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="textarea-reply-message"
                  />
                </div>

                <div>
                  <Label htmlFor="replyPriority">Priority</Label>
                  <Select 
                    value={replyForm.priority} 
                    onValueChange={(value) => setReplyForm({...replyForm, priority: value})}
                  >
                    <SelectTrigger data-testid="select-reply-priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      if (!replyForm.subject.trim() || !replyForm.message.trim()) {
                        toast({
                          title: "Missing information",
                          description: "Please fill in both subject and message.",
                          variant: "destructive",
                        });
                        return;
                      }

                      console.log("🔥 TEACHER DASHBOARD SEND: selectedMessage:", JSON.stringify(selectedMessage, null, 2));
                      
                      // Create reply data based on sender type - admin vs parent
                      let replyData;
                      
                      if (selectedMessage.sender_type === 'admin') {
                        // Reply to admin
                        replyData = {
                          recipientType: "admin",
                          adminId: selectedMessage.admin_id,
                          subject: replyForm.subject,
                          message: replyForm.message,
                          priority: replyForm.priority,
                        };
                      } else {
                        // Reply to parent
                        const parentId = selectedMessage.parentId || selectedMessage.parent_id;
                        const scholarId = selectedMessage.scholarId || selectedMessage.scholar_id;
                        
                        replyData = {
                          recipientType: "parent",
                          parentId: parentId,
                          subject: replyForm.subject,
                          message: replyForm.message,
                          priority: replyForm.priority,
                        };
                        
                        // Only add scholarId if it's not null
                        if (scholarId) {
                          replyData.scholarId = scholarId;
                        }
                      }
                      
                      console.log("🔥 TEACHER DASHBOARD SEND: Final replyData:", JSON.stringify(replyData, null, 2));
                      replyMutation.mutate(replyData);
                    }}
                    disabled={replyMutation.isPending || !replyForm.subject.trim() || !replyForm.message.trim()}
                    data-testid="button-send-reply"
                  >
                    {replyMutation.isPending ? "Sending..." : "Send Reply"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowReplyModal(false);
                      setReplyForm({ subject: "", message: "", priority: "normal" });
                    }}
                    data-testid="button-cancel-reply"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Compose New Message Modal */}
        {showComposeModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowComposeModal(false);
                setComposeForm({
                  recipientType: "",
                  parentId: "",
                  adminId: "",
                  scholarId: "",
                  subject: "",
                  message: "",
                  priority: "normal"
                });
              }
            }}
          >
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white border-b">
                <div>
                  <CardTitle>Compose New Message</CardTitle>
                  <p className="text-sm text-gray-600">Send a message to administrator or parent</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowComposeModal(false);
                    setComposeForm({
                      recipientType: "",
                      parentId: "",
                      adminId: "",
                      scholarId: "",
                      subject: "",
                      message: "",
                      priority: "normal"
                    });
                  }}
                  className="h-10 w-10 p-0 border-2 border-gray-600 bg-white hover:bg-red-100 hover:border-red-500"
                  data-testid="button-close-compose-modal"
                >
                  <span className="text-xl font-bold text-gray-800 hover:text-red-600">✕</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  
                  const messageData = {
                    recipientType: composeForm.recipientType,
                    subject: composeForm.subject,
                    message: composeForm.message,
                    priority: composeForm.priority,
                    parentId: composeForm.recipientType === 'parent' ? composeForm.parentId : undefined,
                    scholarId: composeForm.recipientType === 'parent' ? composeForm.scholarId : undefined,
                    adminId: composeForm.recipientType === 'admin' ? composeForm.adminId : undefined
                  };
                  
                  console.log("🚀 TEACHER COMPOSE: Submitting compose form:", messageData);
                  composeMutation.mutate(messageData);
                }}>
                  
                  {/* Recipient Type Selection */}
                  <div>
                    <Label htmlFor="recipientType">Send to</Label>
                    <Select 
                      value={composeForm.recipientType} 
                      onValueChange={(value) => setComposeForm({...composeForm, recipientType: value})}
                    >
                      <SelectTrigger data-testid="select-recipient-type">
                        <SelectValue placeholder="Select recipient type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin" data-testid="option-admin">Administrator</SelectItem>
                        <SelectItem value="parent" data-testid="option-parent">Parent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Parent Selection (only if recipient is parent) */}
                  {composeForm.recipientType === "parent" && (
                    <div>
                      <Label htmlFor="parentSelect">Select Parent</Label>
                      <Select 
                        value={composeForm.parentId} 
                        onValueChange={(value) => setComposeForm({...composeForm, parentId: value})}
                      >
                        <SelectTrigger data-testid="select-parent">
                          <SelectValue placeholder="Select a parent" />
                        </SelectTrigger>
                        <SelectContent>
                          {parents.map((parent: any) => (
                            <SelectItem key={parent.id} value={parent.id} data-testid={`option-parent-${parent.id}`}>
                              {parent.name} - {parent.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Administrator Selection (only if recipient is admin) */}
                  {composeForm.recipientType === "admin" && (
                    <div>
                      <Label htmlFor="adminSelect">Select Administrator</Label>
                      <Select 
                        value={composeForm.adminId} 
                        onValueChange={(value) => setComposeForm({...composeForm, adminId: value})}
                      >
                        <SelectTrigger data-testid="select-admin">
                          <SelectValue placeholder="Select an administrator" />
                        </SelectTrigger>
                        <SelectContent>
                          {administrators.length === 0 ? (
                            <SelectItem value="no-admins" disabled>
                              No administrators available
                            </SelectItem>
                          ) : (
                            administrators.map((admin: any) => {
                              console.log("🔍 FRONTEND: Rendering admin:", admin);
                              return (
                                <SelectItem key={admin.id} value={admin.id} data-testid={`option-admin-${admin.id}`}>
                                  {admin.firstName && admin.lastName ? 
                                    `${admin.firstName} ${admin.lastName} - ${admin.title || admin.role || 'Administrator'}` :
                                    `${admin.name || admin.email || 'Unknown'} - ${admin.title || admin.role || 'Administrator'}`
                                  }
                                </SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Subject */}
                  <div>
                    <Label htmlFor="composeSubject">Subject</Label>
                    <Input
                      id="composeSubject"
                      value={composeForm.subject}
                      onChange={(e) => setComposeForm({...composeForm, subject: e.target.value})}
                      placeholder="Enter message subject"
                      required
                      data-testid="input-compose-subject"
                    />
                  </div>
                  
                  {/* Message */}
                  <div>
                    <Label htmlFor="composeMessage">Message</Label>
                    <textarea
                      id="composeMessage"
                      value={composeForm.message}
                      onChange={(e) => setComposeForm({...composeForm, message: e.target.value})}
                      placeholder="Type your message here..."
                      className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      data-testid="textarea-compose-message"
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <Label htmlFor="composePriority">Priority</Label>
                    <Select 
                      value={composeForm.priority} 
                      onValueChange={(value) => setComposeForm({...composeForm, priority: value})}
                    >
                      <SelectTrigger data-testid="select-compose-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low" data-testid="option-priority-low">Low</SelectItem>
                        <SelectItem value="normal" data-testid="option-priority-normal">Normal</SelectItem>
                        <SelectItem value="high" data-testid="option-priority-high">High</SelectItem>
                        <SelectItem value="urgent" data-testid="option-priority-urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowComposeModal(false);
                        setComposeForm({
                          recipientType: "",
                          parentId: "",
                          adminId: "",
                          scholarId: "",
                          subject: "",
                          message: "",
                          priority: "normal"
                        });
                      }}
                      data-testid="button-cancel-compose"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      disabled={composeMutation.isPending || !composeForm.recipientType || !composeForm.subject || !composeForm.message || 
                        (composeForm.recipientType === 'parent' && !composeForm.parentId) ||
                        (composeForm.recipientType === 'admin' && !composeForm.adminId)}
                      data-testid="button-send-compose"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {composeMutation.isPending ? "Sending..." : "Send Message"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Teacher Reflection Modal */}
        {selectedReflection && (
          <TeacherReflectionModal
            reflection={selectedReflection}
            isOpen={showReflectionModal}
            onClose={() => {
              setShowReflectionModal(false);
              setSelectedReflection(null);
            }}
            studentName={scholars.find((s: Scholar) => s.id === selectedReflection.scholarId)?.name || 'Unknown Student'}
          />
        )}
        </div>
      </section>
    </div>
  );
}