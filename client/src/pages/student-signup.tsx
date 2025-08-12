import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, GraduationCap, UserCheck, Check } from "lucide-react";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";
import type { Teacher } from "@shared/schema";

interface StudentSignupData {
  name: string;
  studentId: string;
  grade: number;
  teacherId: string;
  username: string;
  password: string;
}

interface SignupResponse {
  success: boolean;
  message: string;
  student?: {
    id: string;
    name: string;
    username: string;
    teacher: string;
  };
}

export default function StudentSignup() {
  const [formData, setFormData] = useState<StudentSignupData>({
    name: "",
    studentId: "",
    grade: 0,
    teacherId: "",
    username: "",
    password: "",
  });
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  // Fetch teachers for the selected grade
  const { data: teachers, isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers/by-grade", formData.grade],
    enabled: formData.grade > 0,
    queryFn: async () => {
      const response = await fetch(`/api/teachers/by-grade/${formData.grade}`);
      if (!response.ok) throw new Error("Failed to fetch teachers");
      return response.json();
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: StudentSignupData) => {
      const response = await apiRequest("/api/student/signup", "POST", data);
      return response.json() as Promise<SignupResponse>;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Registration Successful!",
          description: `Welcome ${data.student?.name}! Your teacher has been notified.`,
        });
        setStep(4); // Success step
        queryClient.invalidateQueries({ queryKey: ["/api/scholars"] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.studentId) {
        toast({
          title: "Missing Information",
          description: "Please enter your name and student ID.",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.grade || !formData.teacherId) {
        toast({
          title: "Missing Information",
          description: "Please select your grade level and homeroom teacher.",
          variant: "destructive",
        });
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please create a username and password.",
        variant: "destructive",
      });
      return;
    }
    signupMutation.mutate(formData);
  };

  const generateUsername = () => {
    if (formData.name && formData.studentId) {
      const firstName = formData.name.split(' ')[0].toLowerCase();
      const lastTwoDigits = formData.studentId.slice(-2);
      const suggested = `${firstName}${lastTwoDigits}`;
      setFormData(prev => ({ ...prev, username: suggested }));
    }
  };

  const selectedTeacher = teachers?.find(t => t.id === formData.teacherId);

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4" data-testid="student-signup-section">
      <Card className="w-full max-w-lg bg-white/90 backdrop-blur-sm shadow-2xl border-0">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <img 
              src={schoolLogoPath} 
              alt="Bush Hills STEAM Academy" 
              className="h-16 w-auto school-logo-3d"
              data-testid="student-signup-logo"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900" data-testid="student-signup-title">
            Student Registration
          </CardTitle>
          <p className="text-gray-600">Join the PBIS House of Champions</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                  data-testid={`step-indicator-${num}`}
                >
                  {step > num ? <Check className="h-4 w-4" /> : num}
                </div>
                {num < 4 && (
                  <div className={`w-8 h-0.5 ${step > num ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4" data-testid="step-1-basic-info">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <p className="text-sm text-gray-600">Tell us about yourself</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="pl-10"
                    data-testid="input-student-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-medium text-gray-700">
                  Student ID
                </Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="studentId"
                    type="text"
                    placeholder="Enter your student ID"
                    value={formData.studentId}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                    className="pl-10"
                    data-testid="input-student-id"
                  />
                </div>
              </div>

              <Button 
                onClick={handleNext} 
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                data-testid="button-next-step-1"
              >
                Next: Grade & Teacher
              </Button>
            </div>
          )}

          {/* Step 2: Grade and Teacher Selection */}
          {step === 2 && (
            <div className="space-y-4" data-testid="step-2-grade-teacher">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Grade & Homeroom</h3>
                <p className="text-sm text-gray-600">Select your grade level and homeroom teacher</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                  Grade Level
                </Label>
                <Select 
                  value={formData.grade.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, grade: parseInt(value), teacherId: "" }))}
                  data-testid="select-grade"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6th Grade</SelectItem>
                    <SelectItem value="7">7th Grade</SelectItem>
                    <SelectItem value="8">8th Grade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.grade > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="teacher" className="text-sm font-medium text-gray-700">
                    Homeroom Teacher
                  </Label>
                  {teachersLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading teachers...</div>
                  ) : (
                    <Select 
                      value={formData.teacherId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, teacherId: value }))}
                      data-testid="select-teacher"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your homeroom teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers?.filter(teacher => 
                          teacher.role.includes(`${formData.grade}th Grade`) || 
                          teacher.canSeeGrades?.includes(formData.grade)
                        ).map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name} - {teacher.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={() => setStep(1)} 
                  variant="outline" 
                  className="flex-1"
                  data-testid="button-back-step-2"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleNext} 
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                  disabled={!formData.grade || !formData.teacherId}
                  data-testid="button-next-step-2"
                >
                  Next: Account Setup
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Username and Password */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="step-3-account-setup">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create Your Account</h3>
                <p className="text-sm text-gray-600">Choose a username and password</p>
              </div>

              <Alert>
                <UserCheck className="h-4 w-4" />
                <AlertDescription>
                  <strong>Selected:</strong> {formData.name} • Grade {formData.grade} • {selectedTeacher?.name}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username
                  </Label>
                  <Button 
                    type="button"
                    onClick={generateUsername}
                    variant="link" 
                    className="text-xs p-0 h-auto"
                    data-testid="button-generate-username"
                  >
                    Suggest Username
                  </Button>
                </div>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  data-testid="input-password"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button"
                  onClick={() => setStep(2)} 
                  variant="outline" 
                  className="flex-1"
                  data-testid="button-back-step-3"
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-green-600 text-white hover:bg-green-700"
                  disabled={signupMutation.isPending}
                  data-testid="button-submit-signup"
                >
                  {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center space-y-4" data-testid="step-4-success">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Registration Complete!</h3>
              <p className="text-gray-600">
                Your account has been created and your homeroom teacher has been notified. 
                You can now log in to access your PBIS points and house information.
              </p>
              <Button 
                onClick={() => window.location.href = "/student-login"}
                className="bg-blue-600 text-white hover:bg-blue-700"
                data-testid="button-go-to-login"
              >
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}