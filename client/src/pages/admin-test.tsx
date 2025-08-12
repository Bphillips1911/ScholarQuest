import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminTest() {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    setLocation("/admin-login");
  };

  const adminData = localStorage.getItem("adminData") ? JSON.parse(localStorage.getItem("adminData") || "{}") : null;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="bg-blue-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6" />
                ADMIN DASHBOARD TEST
              </CardTitle>
              <p className="mt-2">
                Welcome, {adminData?.firstName} {adminData?.lastName} ({adminData?.title})
              </p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">This is the Admin Dashboard</h2>
            <p>If you can see this page and the logout button, the routing is working correctly.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800">Authentication Status</h3>
              <p className="text-green-700">
                Token: {localStorage.getItem("adminToken") ? "Present" : "Missing"}
              </p>
              <p className="text-green-700">
                Admin Data: {adminData ? "Loaded" : "Missing"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}