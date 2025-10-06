import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, Mail } from "lucide-react";
import { useLocation } from "wouter";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function AdminLogin() {
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
        ? `${window.location.origin}/api/admin/login`
        : "/api/admin/login";
      
      console.log("Admin login attempt to:", apiUrl);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminData", JSON.stringify(data.admin));
        
        toast({
          title: "Login Successful - 30 Day Access",
          description: `Welcome back, ${data.admin.firstName} ${data.admin.lastName}! You're logged in for 30 days.`,
        });
        
        console.log("Admin login successful - 30-day authentication active");
        // Force redirect to admin dashboard 
        window.location.href = "/admin";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
            <img 
              src={schoolLogoPath} 
              alt="Bush Hills STEAM Academy" 
              className="w-16 h-16 object-contain rounded-full"
            />
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Shield className="h-6 w-6 text-blue-600" />
            Administrator Login
          </CardTitle>
          <CardDescription>
            Bush Hills STEAM Academy<br />
            PBIS House of Champions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@bhsteam.edu"
                required
                data-testid="input-admin-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                data-testid="input-admin-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              data-testid="button-admin-login"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Need to create an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-blue-600"
                onClick={() => setLocation("/admin-signup")}
                data-testid="link-signup"
              >
                Create administrator account
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}