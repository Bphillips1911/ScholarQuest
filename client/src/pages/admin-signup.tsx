import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function AdminSignup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    title: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          title: formData.title,
          password: formData.password,
          permissions: formData.title === "Principal" 
            ? ["view_all", "manage_teachers", "manage_students", "manage_houses", "view_reports", "admin_settings"]
            : formData.title === "Assistant Principal"
            ? ["view_all", "manage_teachers", "manage_students", "manage_houses", "view_reports"]
            : formData.title === "Database Manager"
            ? ["view_all", "manage_data", "export_data", "backup_data", "view_reports"]
            : ["view_all", "manage_students", "view_reports"],
        }),
      });

      if (response.ok) {
        toast({
          title: "Account Created Successfully!",
          description: "Your administrator account has been created. You can now log in.",
        });
        setLocation("/admin-login");
      } else {
        const error = await response.json();
        toast({
          title: "Registration Failed",
          description: error.message || "Failed to create administrator account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
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
            <UserPlus className="h-6 w-6 text-blue-600" />
            Create Administrator Account
          </CardTitle>
          <CardDescription>
            Bush Hills STEAM Academy<br />
            House Character Development Program
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="First name"
                  required
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Last name"
                  required
                  data-testid="input-last-name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="admin@email.com or personal@email.com"
                required
                data-testid="input-email"
              />
              <p className="text-xs text-gray-500">
                You can use your school email or personal email address. You'll receive all notifications at this address.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Administrative Title</Label>
              <Select onValueChange={(value) => handleInputChange("title", value)} required>
                <SelectTrigger data-testid="select-title">
                  <SelectValue placeholder="Select your administrative role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Principal">Principal</SelectItem>
                  <SelectItem value="Assistant Principal">Assistant Principal</SelectItem>
                  <SelectItem value="Counselor">Counselor</SelectItem>
                  <SelectItem value="Database Manager">Database Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Create a strong password (8+ characters)"
                required
                data-testid="input-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Confirm your password"
                required
                data-testid="input-confirm-password"
              />
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Email Policy:</strong> You can use any email address (school or personal). All notifications including login alerts, system updates, and administrative communications will be sent to this address.
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-create-account"
              >
                {isLoading ? "Creating Account..." : "Create Administrator Account"}
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-blue-600"
                onClick={() => setLocation("/admin-login")}
                data-testid="link-login"
              >
                Sign in here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}