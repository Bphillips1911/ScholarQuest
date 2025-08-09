import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, User, Lock, HelpCircle } from "lucide-react";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

interface StudentLoginResponse {
  success: boolean;
  token?: string;
  student?: {
    id: string;
    name: string;
    username: string;
  };
  message?: string;
}

export default function StudentLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("/api/student/login", "POST", credentials);
      return response.json() as Promise<StudentLoginResponse>;
    },
    onSuccess: (data) => {
      if (data.success && data.token) {
        localStorage.setItem("student_token", data.token);
        localStorage.setItem("student_data", JSON.stringify(data.student));
        window.location.href = "/student-dashboard";
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (username: string) => {
      return await apiRequest("/api/student/forgot-password", "POST", { username });
    },
    onSuccess: () => {
      toast({
        title: "Request Sent",
        description: "Your teacher has been notified to reset your password.",
      });
      setShowForgotPassword(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send password reset request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ username, password });
  };

  const handleForgotPassword = () => {
    if (!username) {
      toast({
        title: "Username Required",
        description: "Please enter your username first.",
        variant: "destructive",
      });
      return;
    }
    forgotPasswordMutation.mutate(username);
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4" data-testid="student-login-section">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-2xl border-0">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <img 
              src={schoolLogoPath} 
              alt="Bush Hills STEAM Academy" 
              className="h-16 w-auto school-logo-3d"
              data-testid="student-login-logo"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900" data-testid="student-login-title">
            Student Portal
          </CardTitle>
          <p className="text-gray-600">Sign in to view your PBIS points and house status</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {!showForgotPassword ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    data-testid="input-username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    data-testid="input-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-blue-600 hover:text-blue-700"
                onClick={() => setShowForgotPassword(true)}
                data-testid="button-forgot-password"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Forgot Password?
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Enter your username and click "Send Request" to ask your teacher to reset your password.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="reset-username" className="text-sm font-medium text-gray-700">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="reset-username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    data-testid="input-reset-username"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleForgotPassword}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                  disabled={forgotPasswordMutation.isPending}
                  data-testid="button-send-request"
                >
                  {forgotPasswordMutation.isPending ? "Sending..." : "Send Request"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1"
                  data-testid="button-back-login"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          )}

          <div className="text-center text-sm text-gray-500">
            <p>Need help? Ask your teacher for assistance.</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}