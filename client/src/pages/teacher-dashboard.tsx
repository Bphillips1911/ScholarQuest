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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      // Set default grade for single-grade teachers
      if (parsedTeacher.canSeeGrades?.length === 1) {
        setSelectedGrade(parsedTeacher.canSeeGrades[0]);
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

  // Fetch houses for scholar creation
  const { data: houses = [] } = useQuery({
    queryKey: ["/api/houses"],
    enabled: showAddScholar,
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
                  <p className="text-xs text-gray-500">{teacher.role} - {teacher.subject}</p>
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

        {/* Actions */}
        {selectedGrade && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <Button
              onClick={() => setLocation("/teacher-messages")}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="button-parent-messages"
            >
              <MessageCircle className="h-4 w-4" />
              Parent Messages
            </Button>
          </div>
        )}

        {/* Scholars List */}
        {selectedGrade && (
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

        {/* Add Scholar Modal */}
        {showAddScholar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddScholar(false);
              }
            }}
          >
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Add New Scholar</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddScholar(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  data-testid="button-close-modal"
                >
                  <span className="text-lg font-bold text-gray-500 hover:text-gray-700">✕</span>
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
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAddScholar}
                    disabled={addScholarMutation.isPending}
                    data-testid="button-save-scholar"
                  >
                    {addScholarMutation.isPending ? "Adding..." : "Add Scholar"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddScholar(false)}
                    data-testid="button-cancel-scholar"
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
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAwardPoints(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  data-testid="button-close-points-modal"
                >
                  <span className="text-lg font-bold text-gray-500 hover:text-gray-700">✕</span>
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
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeactivateStudent(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  data-testid="button-close-deactivate-modal"
                >
                  <span className="text-lg font-bold text-gray-500 hover:text-gray-700">✕</span>
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