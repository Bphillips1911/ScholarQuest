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
import { LogOut, Users, Award, Plus, MessageCircle, UserX } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  email: string;
  role: string;
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

export default function TeacherDashboard() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [showAddScholar, setShowAddScholar] = useState(false);
  const [showAwardPoints, setShowAwardPoints] = useState(false);
  const [showDeactivateStudent, setShowDeactivateStudent] = useState(false);
  const [selectedScholar, setSelectedScholar] = useState<Scholar | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [activeView, setActiveView] = useState<'scholars' | 'messages'>('scholars');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // PBIS form state
  const [pbisForm, setPbisForm] = useState({
    mustangTrait: "",
    points: 1,
    reason: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("teacherToken");
    const teacherData = localStorage.getItem("teacherData");
    
    if (!token || !teacherData) {
      setLocation("/teacher-login");
      return;
    }
    
    try {
      const parsedTeacher = JSON.parse(teacherData);
      setTeacher(parsedTeacher);
      // Set default grade for single-grade teachers OR if teacher has canSeeGrades
      if (parsedTeacher.canSeeGrades?.length >= 1) {
        setSelectedGrade(parsedTeacher.canSeeGrades[0]);
        // Set default view to scholars so functionality is immediately visible
        setActiveView('scholars');
      }
    } catch (error) {
      setLocation("/teacher-login");
    }
  }, [setLocation]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("teacherToken");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
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
    queryKey: ["/api/parent-teacher-messages/teacher", teacher?.id],
    queryFn: async () => {
      if (!teacher?.id) return [];
      const response = await fetch(`/api/parent-teacher-messages/teacher/${teacher.id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!teacher?.id,
  });

  // Add scholar mutation
  const addScholarMutation = useMutation({
    mutationFn: async (scholarData: any) => {
      const response = await fetch("/api/teacher/scholars", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(scholarData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: Failed to add scholar`);
      }
      return response.json();
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

  // Award PBIS points mutation
  const awardPointsMutation = useMutation({
    mutationFn: async (pbisData: any) => {
      const response = await fetch("/api/teacher/pbis", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(pbisData),
      });
      if (!response.ok) throw new Error("Failed to award points");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholars"] });
      setShowAwardPoints(false);
      setSelectedScholar(null);
      setPbisForm({ mustangTrait: "", points: 1, reason: "" });
      toast({
        title: "Points Awarded",
        description: "MUSTANG points have been successfully awarded",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to award points",
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
    if (!selectedScholar || !pbisForm.mustangTrait) {
      toast({
        title: "Missing Information",
        description: "Please select a MUSTANG trait",
        variant: "destructive",
      });
      return;
    }
    
    awardPointsMutation.mutate({
      scholarId: selectedScholar.id,
      ...pbisForm,
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
    { value: "Motivated", label: "Motivated" },
    { value: "Understanding", label: "Understanding" },
    { value: "Safe", label: "Safe" },
    { value: "Teamwork", label: "Teamwork" },
    { value: "Accountable", label: "Accountable" },
    { value: "Noble", label: "Noble" },
    { value: "Growth", label: "Growth" },
  ];

  return (
    <section className="min-h-screen bg-gray-50 p-4" data-testid="teacher-dashboard-section">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6 bg-white shadow-lg">
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
                  <h1 className="text-xl font-bold text-gray-900 school-name-3d">Teacher Dashboard</h1>
                  <p className="text-sm text-gray-600 program-title-3d">Welcome, {teacher.name}</p>
                  <p className="text-xs text-gray-500">{teacher.gradeRole} - {teacher.subject}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="flex items-center gap-2"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Grade Selection */}
        {teacher.canSeeGrades?.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Grade Level</CardTitle>
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

        {/* Navigation Tabs - Always show when teacher is loaded */}
        {teacher && (
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
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
          </div>
        )}

        {/* Actions */}
        {teacher && activeView === 'scholars' && (
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
        )}

        {/* House Standings - Always visible */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              House Standings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {houses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {houses.map((house: any) => (
                  <div 
                    key={house.id} 
                    className="p-4 rounded-lg border-2 transition-all hover:shadow-md"
                    style={{ borderColor: house.color }}
                    data-testid={`house-card-${house.id}`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{house.icon}</div>
                      <h3 className="font-bold text-sm" style={{ color: house.color }}>
                        {house.name}
                      </h3>
                      <p className="text-xs text-gray-600 italic mb-3">{house.motto}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Academic:</span>
                          <span className="font-semibold">{house.academicPoints}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Attendance:</span>
                          <span className="font-semibold">{house.attendancePoints}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Behavior:</span>
                          <span className="font-semibold">{house.behaviorPoints}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 mt-2">
                          <span className="font-bold">Total:</span>
                          <span className="font-bold text-lg" style={{ color: house.color }}>
                            {house.academicPoints + house.attendancePoints + house.behaviorPoints}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Members:</span>
                          <span>{house.memberCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Loading house standings...</p>
            )}
          </CardContent>
        </Card>

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
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <MessageCircle className="mr-2 h-5 w-5 text-blue-600" />
                Parent Messages
              </CardTitle>
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
                          <div className="text-xs text-gray-500">
                            {message.created_at ? new Date(message.created_at).toLocaleDateString() : 'Today'}
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
                        
                        <Button size="sm" variant="outline" className="text-blue-600">
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAwardPoints(false);
              }
            }}
          >
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Award MUSTANG Points</CardTitle>
                  <p className="text-sm text-gray-600">Scholar: {selectedScholar.name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAwardPoints(false)}
                  className="h-10 w-10 p-0 border-2 border-gray-400 bg-white hover:bg-red-50 hover:border-red-400"
                  data-testid="button-close-points-modal"
                >
                  <span className="text-xl font-bold text-gray-700 hover:text-red-600">✕</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="mustangTrait">MUSTANG Trait</Label>
                  <Select 
                    value={pbisForm.mustangTrait} 
                    onValueChange={(value) => setPbisForm({...pbisForm, mustangTrait: value})}
                  >
                    <SelectTrigger data-testid="select-mustang-trait">
                      <SelectValue placeholder="Select MUSTANG trait" />
                    </SelectTrigger>
                    <SelectContent>
                      {mustangTraits.map((trait) => (
                        <SelectItem key={trait.value} value={trait.value}>
                          {trait.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="points">Points (1-10)</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    max="10"
                    value={pbisForm.points}
                    onChange={(e) => setPbisForm({...pbisForm, points: parseInt(e.target.value) || 1})}
                    data-testid="input-points"
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Input
                    id="reason"
                    value={pbisForm.reason}
                    onChange={(e) => setPbisForm({...pbisForm, reason: e.target.value})}
                    placeholder="Describe what the scholar did"
                    data-testid="input-reason"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAwardPoints}
                    disabled={awardPointsMutation.isPending}
                    data-testid="button-award-points-confirm"
                  >
                    {awardPointsMutation.isPending ? "Awarding..." : "Award Points"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAwardPoints(false)}
                    data-testid="button-cancel-points"
                  >
                    Cancel
                  </Button>
                </div>
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
      </div>
    </section>
  );
}