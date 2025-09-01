import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LogIn, User, Lock, GraduationCap } from "lucide-react";
import logoPath from "@assets/_BHSA Mustang 1_1754780382943.png";

export default function StudentLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      console.log("Attempting login with:", credentials.username);
      try {
        const response = await apiRequest("POST", "/api/student/login", credentials);
        const data = await response.json();
        console.log("Login response:", data);
        return data;
      } catch (error) {
        console.error("Login API error:", error);
        throw error;
      }
    },
    onSuccess: (data: any) => {
      console.log("Login successful:", data);
      // Store token and student info with expiration tracking
      localStorage.setItem("studentToken", data.token);
      localStorage.setItem("studentData", JSON.stringify(data.student));
      localStorage.setItem("studentTokenExpiry", String(Date.now() + (30 * 24 * 60 * 60 * 1000))); // 30 days
      
      // Verify token was stored properly
      const storedToken = localStorage.getItem("studentToken");
      console.log("Token stored successfully:", !!storedToken);
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.student.name}!`,
      });
      
      // Navigate to student dashboard
      setLocation("/student-dashboard");
    },
    onError: (error: any) => {
      console.error("Login mutation error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Please check your username and password.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/95 backdrop-blur">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
              <img 
                src={logoPath} 
                alt="BHSA Mustangs Logo" 
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            Student Portal
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            Bush Hills STEAM Academy
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="pl-10"
                  data-testid="input-username"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10"
                  data-testid="input-password"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Need your login credentials?</strong>
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Your teacher will provide your unique username and password when you're added to the class roster.
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Having trouble? Contact your teacher for assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}