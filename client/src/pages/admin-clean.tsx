import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LogOut, User, Shield, Users, GraduationCap, Award } from "lucide-react";
import { useLocation } from "wouter";
import type { House, Scholar } from "@shared/schema";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function AdminClean() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const data = localStorage.getItem("adminData");
    
    if (token && data) {
      try {
        const parsedData = JSON.parse(data);
        setAdminData(parsedData);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        setLocation("/admin-login");
      }
    } else {
      setLocation("/admin-login");
    }
  }, [setLocation]);

  // Data queries - only run when authenticated
  const { data: houses } = useQuery<House[]>({
    queryKey: ["/api/houses"],
    enabled: isAuthenticated,
  });

  const { data: allScholars } = useQuery<Scholar[]>({
    queryKey: ["/api/scholars"],
    enabled: isAuthenticated,
  });

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    setIsAuthenticated(false);
    setAdminData(null);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    setLocation("/admin-login");
  };

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalStudents = allScholars?.length || 0;
  const totalPoints = allScholars?.reduce((sum, scholar) => 
    sum + scholar.academicPoints + scholar.attendancePoints + scholar.behaviorPoints, 0
  ) || 0;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img 
                src={schoolLogoPath} 
                alt="Bush Hills STEAM Academy" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  BHSA Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome, {adminData?.firstName} {adminData?.lastName} ({adminData?.title})
                </p>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Statistics Cards */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                  <p className="text-gray-600">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <GraduationCap className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{houses?.length || 0}</p>
                  <p className="text-gray-600">Houses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
                  <p className="text-gray-600">Total Points</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">Active</p>
                  <p className="text-gray-600">System Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Houses Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Houses Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {houses?.map((house) => (
                <div key={house.id} className="text-center p-4 border rounded-lg">
                  <div 
                    className="w-12 h-12 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: house.color }}
                  ></div>
                  <h3 className="font-semibold">{house.name.replace("House of ", "")}</h3>
                  <p className="text-2xl font-bold text-blue-600">{house.academicPoints + house.attendancePoints + house.behaviorPoints}</p>
                  <p className="text-sm text-gray-600">points</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => setLocation("/admin-full")}
                className="h-20 flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Users className="h-6 w-6 mb-2" />
                Manage Students
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation("/admin-sorting")}
                className="h-20 flex flex-col items-center justify-center"
              >
                <GraduationCap className="h-6 w-6 mb-2" />
                House Sorting
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation("/admin-pbis")}
                className="h-20 flex flex-col items-center justify-center"
              >
                <Award className="h-6 w-6 mb-2" />
                PBIS Awards
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation("/admin-settings")}
                className="h-20 flex flex-col items-center justify-center"
              >
                <Shield className="h-6 w-6 mb-2" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}