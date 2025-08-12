import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LogOut, User, Shield, Users, GraduationCap, Award, UserPlus, Eye } from "lucide-react";
import { useLocation } from "wouter";
import type { House, Scholar, InsertScholar } from "@shared/schema";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function AdminClean() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [newStudentHouse, setNewStudentHouse] = useState("");
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

  // Add scholar mutation
  const addScholarMutation = useMutation({
    mutationFn: async (data: InsertScholar) => {
      const response = await apiRequest("POST", "/api/scholars", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Scholar Added",
        description: "New scholar has been successfully added to the house.",
      });
      setNewStudentName("");
      setNewStudentId("");
      setNewStudentHouse("");
      queryClient.invalidateQueries({ queryKey: ["/api/houses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scholars"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add scholar. Please try again.",
        variant: "destructive",
      });
    },
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

  const handleAddScholar = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStudentName || !newStudentId) {
      toast({
        title: "Missing Information",
        description: "Please fill in student name and ID.",
        variant: "destructive",
      });
      return;
    }

    // Auto-assign to house with least members if no house selected
    let houseId = newStudentHouse;
    if ((!houseId || houseId === "auto") && houses) {
      const leastPopulatedHouse = houses.reduce((min, house) => 
        house.memberCount < min.memberCount ? house : min
      );
      houseId = leastPopulatedHouse.id;
    }

    addScholarMutation.mutate({
      name: newStudentName,
      studentId: newStudentId,
      houseId,
      grade: 6, // Default grade
    });
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
                onClick={() => setActiveTab("students")}
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

      {/* Student Management Modal/Tab */}
      {activeTab === "students" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Manage Students</h2>
              <Button
                variant="outline"
                onClick={() => setActiveTab("dashboard")}
                className="text-gray-600 hover:text-gray-800"
              >
                Close
              </Button>
            </div>

            {/* Add New Student Form */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add New Student
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddScholar} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="studentName">Student Name</Label>
                      <Input
                        id="studentName"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        placeholder="Enter student name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input
                        id="studentId"
                        value={newStudentId}
                        onChange={(e) => setNewStudentId(e.target.value)}
                        placeholder="Enter student ID"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="house">House Assignment</Label>
                      <Select value={newStudentHouse} onValueChange={setNewStudentHouse}>
                        <SelectTrigger>
                          <SelectValue placeholder="Auto-assign to least populated" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto-assign (recommended)</SelectItem>
                          {houses?.map((house) => (
                            <SelectItem key={house.id} value={house.id}>
                              {house.name.replace("House of ", "")} ({house.memberCount} members)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto"
                    disabled={addScholarMutation.isPending}
                  >
                    {addScholarMutation.isPending ? "Adding..." : "Add Student"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Current Students List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Current Students ({allScholars?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allScholars && allScholars.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Student ID</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">House</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Username</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Total Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allScholars.map((scholar) => {
                          const house = houses?.find(h => h.id === scholar.houseId);
                          const totalPoints = (scholar.academicPoints || 0) + (scholar.attendancePoints || 0) + (scholar.behaviorPoints || 0);
                          return (
                            <tr key={scholar.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2">{scholar.name}</td>
                              <td className="border border-gray-300 px-4 py-2">{scholar.studentId}</td>
                              <td className="border border-gray-300 px-4 py-2">
                                <Badge style={{ backgroundColor: house?.color || '#gray' }}>
                                  {house?.name.replace("House of ", "") || "Unknown"}
                                </Badge>
                              </td>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                                {scholar.username}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 font-bold">
                                {totalPoints}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No students registered yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}