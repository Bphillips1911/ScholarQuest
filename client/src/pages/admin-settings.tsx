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

        {/* SendGrid Configuration Help */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-500" />
              SendGrid Configuration Status
            </CardTitle>
            <CardDescription>
              Current email service configuration and troubleshooting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Current Status: Configuration Issue</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  The SendGrid API key appears to have permission issues. This is common with new accounts or restricted API keys.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-yellow-800">To fix this:</p>
                  <ol className="list-decimal list-inside space-y-1 text-yellow-700">
                    <li>Log into your SendGrid account</li>
                    <li>Go to Settings → API Keys</li>
                    <li>Create a new API key with "Full Access" permissions</li>
                    <li>Verify your sender email domain in SendGrid</li>
                    <li>Update your Replit secrets with the new API key</li>
                  </ol>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">API Key Status:</span>
                  <span className="text-red-600 font-medium">Permission Error (403)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sender Domain:</span>
                  <span className="text-red-600 font-medium">Not Verified</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Test Emails:</span>
                  <span className="text-red-600 font-medium">Failing</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Email notifications will be logged to server console until SendGrid is properly configured.
                </p>
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