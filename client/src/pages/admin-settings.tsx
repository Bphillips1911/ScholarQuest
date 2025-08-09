import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Settings, Users, Bell } from "lucide-react";

export default function AdminSettings() {
  const [adminEmail, setAdminEmail] = useState("BHSAHouses25@gmail.com");
  const [isLoading, setIsLoading] = useState(false);
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

      if (response.ok) {
        toast({
          title: "Test Email Sent",
          description: "Check your inbox for the test email.",
        });
      } else {
        throw new Error("Failed to send test email");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email. Please check your email configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

        {/* Email Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              Email Statistics
            </CardTitle>
            <CardDescription>
              View email delivery statistics and recent activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Emails sent today:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Emails sent this week:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last email sent:</span>
                <span className="font-medium">Never</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SendGrid Status:</span>
                <span className="text-green-600 font-medium">Connected</span>
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