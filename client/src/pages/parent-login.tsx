import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Lock, Mail } from "lucide-react";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function ParentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      console.log("🔐 Parent login attempt:", credentials.email);
      
      const response = await fetch("/api/parent/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      
      console.log("📡 Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Login error:", errorData);
        throw new Error(errorData.message || "Login failed");
      }
      
      const result = await response.json();
      console.log("✅ Login success:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("✅ Frontend login success - storing data:", data);
      localStorage.setItem("parentToken", data.token);
      localStorage.setItem("parentData", JSON.stringify(data.parent));
      console.log("✅ Token stored:", data.token?.substring(0, 20) + "...");
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.parent.firstName}!`,
      });
      
      // Redirect to parent portal
      console.log("🚀 Redirecting to parent portal...");
      window.location.href = "/parent-portal";
    },
    onError: (error) => {
      console.error("❌ Frontend login error:", error);
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate({ email, password });
  };

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center p-4" data-testid="parent-login-section">
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
          <CardTitle className="text-2xl font-bold text-gray-900" data-testid="login-title">
            Parent Portal Login
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Access your child's academic progress
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  data-testid="input-login-email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  data-testid="input-login-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {loginMutation.isPending ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <a href="/parent-signup" className="text-blue-600 hover:underline" data-testid="link-signup">
                Register here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}