import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Lock, Mail, User, Phone } from "lucide-react";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

interface ParentData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export default function ParentSignup() {
  const [formData, setFormData] = useState<ParentData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async (data: ParentData) => {
      const response = await fetch("/api/parent/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("parentToken", data.token);
      localStorage.setItem("parentData", JSON.stringify(data.parent));
      toast({
        title: "Registration Successful",
        description: "Welcome to the Bush Hills STEAM Academy Parent Portal!",
      });
      
      // Redirect to parent portal
      window.location.href = "/parent-portal";
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof ParentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    const submitData = { ...formData };
    if (!submitData.phone) {
      delete submitData.phone;
    }

    registerMutation.mutate(submitData);
  };

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center p-4" data-testid="parent-signup-section">
      <Card className="w-full max-w-md bg-white shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={schoolLogoPath} 
              alt="Bush Hills STEAM Academy" 
              className="h-16 w-auto"
              data-testid="signup-school-logo"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900" data-testid="signup-title">
            Parent Portal Registration
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Join the Bush Hills STEAM Academy parent community
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="pl-10"
                    data-testid="input-first-name"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="pl-10"
                    data-testid="input-last-name"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10"
                  data-testid="input-email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2">
                Phone Number (Optional)
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="pl-10"
                  data-testid="input-phone"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2">
                Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-10"
                  data-testid="input-password"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  data-testid="input-confirm-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
              disabled={registerMutation.isPending}
              data-testid="button-register"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {registerMutation.isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Parent Communication System</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p>✓ <strong>Real-time alerts</strong> when your child receives PBIS points</p>
              <p>✓ <strong>Both positive and negative</strong> behavior notifications</p>
              <p>✓ <strong>Teacher messaging</strong> with bi-directional communication</p>
              <p>✓ <strong>Username-based child tracking</strong> for secure access</p>
              <p>✓ <strong>24/7 access</strong> to your child's progress through the parent portal</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/parent-login" className="text-blue-600 hover:underline" data-testid="link-login">
                Sign in here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}