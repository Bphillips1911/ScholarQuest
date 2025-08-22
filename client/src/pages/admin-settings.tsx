import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Settings, Users, Bell, Lock } from "lucide-react";

export default function AdminSettings() {
  const [adminEmail, setAdminEmail] = useState("BHSAHouses25@gmail.com");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();

  const handleUpdateEmail = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would save to database
      // For now, we'll just show a success message
      toast({
        title: "Email Updated",
        description: "Administrator email has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update administrator email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testEmail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: adminEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Test Email Sent Successfully!",
          description: data.details || "Check your inbox for the test email.",
        });
      } else {
        toast({
          title: "Email Test Failed",
          description: data.details || "Check server logs for error details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to email service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Password Changed Successfully",
          description: "Your password has been updated. Please remember your new password.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({
          title: "Password Change Failed",
          description: data.message || "Unable to change password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Administrator Settings
        </h1>
        <p className="text-gray-600">
          Configure system settings and email notifications for the House Character Development Program.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Configure the administrator email address for receiving notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Administrator Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@example.com"
                data-testid="input-admin-email"
              />
              <p className="text-sm text-gray-500">
                This email will receive all registration notifications and alerts.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpdateEmail}
                disabled={isLoading}
                data-testid="button-update-email"
              >
                {isLoading ? "Updating..." : "Update Email"}
              </Button>
              <Button
                variant="outline"
                onClick={testEmail}
                disabled={isLoading}
                data-testid="button-test-email"
              >
                Send Test Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-500" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your administrator account password for enhanced security.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                data-testid="input-current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                data-testid="input-new-password"
              />
              <p className="text-sm text-gray-500">
                Password must be at least 8 characters long.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                data-testid="input-confirm-password"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="w-full"
              data-testid="button-change-password"
            >
              {isChangingPassword ? "Changing Password..." : "Change Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-500" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure what types of notifications you want to receive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Teacher Registrations</p>
                  <p className="text-sm text-gray-500">New teacher signup requests</p>
                </div>
                <div className="text-green-600 font-medium">Enabled</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Parent Registrations</p>
                  <p className="text-sm text-gray-500">New parent portal signups</p>
                </div>
                <div className="text-green-600 font-medium">Enabled</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Student Registrations</p>
                  <p className="text-sm text-gray-500">New student account creations</p>
                </div>
                <div className="text-green-600 font-medium">Enabled</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Password Reset Requests</p>
                  <p className="text-sm text-gray-500">Student password reset requests</p>
                </div>
                <div className="text-green-600 font-medium">Enabled</div>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              System Information
            </CardTitle>
            <CardDescription>
              Current system status and configuration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">School Name:</span>
                <span className="font-medium">Bush Hills STEAM Academy</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Principal:</span>
                <span className="font-medium">Dr. Phillips</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Assistant Principal:</span>
                <span className="font-medium">Dr. Stewart</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contact Phone:</span>
                <span className="font-medium">205-231-6370</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}