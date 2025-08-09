import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, Mail, Key, Shield, Globe } from "lucide-react";

export default function EmailTroubleshooting() {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testEmail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com" }),
      });
      
      const data = await response.json();
      setTestResult(response.ok ? "success" : "failed");
    } catch (error) {
      setTestResult("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          SendGrid Email Configuration Troubleshooting
        </h1>
        <p className="text-gray-600">
          Step-by-step guide to fix email notification issues
        </p>
      </div>

      {/* Current Status */}
      <Alert className="mb-6 border-red-200 bg-red-50">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Current Status:</strong> SendGrid API returning 403 Forbidden error. 
          Email notifications are not working.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Step 1: API Key Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-500" />
              Step 1: Check API Key Permissions
            </CardTitle>
            <CardDescription>
              Ensure your SendGrid API key has the correct permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Required API Key Settings:</h4>
              <ul className="space-y-2 text-sm text-yellow-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  API key must start with "SG."
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Permission level: "Full Access" (not "Restricted Access")
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Must include "Mail Send" permission at minimum
                </li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">How to create a new API key:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                <li>Log into your SendGrid account</li>
                <li>Go to Settings → API Keys</li>
                <li>Click "Create API Key"</li>
                <li>Choose "Full Access" (recommended for testing)</li>
                <li>Name it "Bush Hills STEAM Academy"</li>
                <li>Copy the generated key immediately (it won't be shown again)</li>
                <li>Update your Replit Secrets with the new key</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Sender Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Step 2: Verify Sender Authentication
            </CardTitle>
            <CardDescription>
              SendGrid requires sender verification to prevent spam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Sender Verification Options:</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <h5 className="font-medium text-green-700">Option 1: Single Sender Verification (Easier)</h5>
                  <ol className="list-decimal list-inside space-y-1 text-green-600 ml-4">
                    <li>In SendGrid, go to Settings → Sender Authentication</li>
                    <li>Click "Verify a Single Sender"</li>
                    <li>Enter: BHSAHouses25@gmail.com</li>
                    <li>Fill out the form with your school details</li>
                    <li>Check your email and click the verification link</li>
                  </ol>
                </div>
                
                <div>
                  <h5 className="font-medium text-green-700">Option 2: Domain Authentication (Advanced)</h5>
                  <p className="text-green-600 ml-4">
                    Requires DNS setup for gmail.com domain (not recommended for Gmail accounts)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Account Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-500" />
              Step 3: Account Verification
            </CardTitle>
            <CardDescription>
              New SendGrid accounts may require additional verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-2">Account Requirements:</h4>
              <ul className="space-y-2 text-sm text-purple-700">
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Phone number verification completed
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Account may need manual review (can take 24-72 hours)
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Some restrictions apply to new free accounts
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Test Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-500" />
              Test Email Configuration
            </CardTitle>
            <CardDescription>
              Test your configuration after making changes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testEmail} 
              disabled={isLoading}
              className="w-full"
              data-testid="button-test-email-config"
            >
              {isLoading ? "Testing..." : "Test Email Configuration"}
            </Button>
            
            {testResult && (
              <Alert className={testResult === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                {testResult === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={testResult === "success" ? "text-green-800" : "text-red-800"}>
                  {testResult === "success" 
                    ? "Email configuration is working correctly!" 
                    : "Email test failed. Please check the steps above."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Quick Fixes */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Troubleshooting Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="check1" />
                <label htmlFor="check1">API key starts with "SG." and is recently created</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="check2" />
                <label htmlFor="check2">API key has "Full Access" permissions</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="check3" />
                <label htmlFor="check3">Sender email (BHSAHouses25@gmail.com) is verified in SendGrid</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="check4" />
                <label htmlFor="check4">SendGrid account phone verification completed</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="check5" />
                <label htmlFor="check5">Replit Secrets updated with new API key</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="check6" />
                <label htmlFor="check6">Application restarted after updating secrets</label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}