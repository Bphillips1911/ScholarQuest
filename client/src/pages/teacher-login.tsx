import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, QrCode } from "lucide-react";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function TeacherLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use deployment-compatible API endpoint
      const apiUrl = window.location.hostname.includes('replit.app') 
        ? `${window.location.origin}/api/teacher-auth/login`
        : "/api/teacher-auth/login";
      
      console.log("Teacher login attempt to:", apiUrl);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Teacher login successful - 30-day authentication active");
        localStorage.setItem("teacherToken", data.token);
        localStorage.setItem("teacherData", JSON.stringify(data.teacher));
        
        toast({
          title: "Login Successful - 30 Day Access",
          description: `Welcome back, ${data.teacher.name}! You're logged in for 30 days.`,
        });
        
        // Force reload to ensure proper authentication state
        window.location.href = "/teacher-dashboard";
      } else {
        const error = await response.json();
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center p-4" data-testid="teacher-login-section">
      <Card className="w-full max-w-md bg-white shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={schoolLogoPath} 
              alt="Bush Hills STEAM Academy" 
              className="h-16 w-auto school-logo-3d"
              data-testid="login-school-logo"
            />
          </div>
          <CardTitle className="text-2xl font-bold school-name-3d">Teacher Portal</CardTitle>
          <p className="text-gray-600 program-title-3d">Bush Hills STEAM Academy</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your school email"
                required
                data-testid="input-email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                data-testid="input-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center pt-4">
            <Link href="/teacher-forgot-password">
              <Button variant="link" className="text-sm text-blue-600 p-0" data-testid="link-forgot-password">
                Forgot your password?
              </Button>
            </Link>
          </div>
          
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600 mb-3">
              New to Bush Hills STEAM Academy?
            </p>
            <Link href="/teacher-signup">
              <Button variant="outline" className="w-full mb-3" data-testid="button-signup-link">
                <UserPlus className="mr-2 h-4 w-4" />
                Sign Up for Teacher Account
              </Button>
            </Link>
            
            <Link href="/teacher-qr-access">
              <Button variant="outline" className="w-full mb-4" data-testid="button-qr-access">
                <QrCode className="mr-2 h-4 w-4" />
                Generate QR Codes for Easy Access
              </Button>
            </Link>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Teacher Login Credentials</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Sarah Johnson (6th Grade):</strong> sarah.johnson@bhsteam.edu</p>
              <p><strong>Jennifer Adams (6th Grade):</strong> jennifer.adams@bhsteam.edu</p>
              <p><strong>Michael Davis (7th Grade):</strong> michael.davis@bhsteam.edu</p>
              <p><strong>Password for all teachers:</strong> BHSATeacher2025!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}