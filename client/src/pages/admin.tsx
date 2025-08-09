import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AddPointsForm from "@/components/add-points-form";
import { Download, RefreshCw, UserPlus, Plus, CheckCircle, Clock, Users, GraduationCap, Award, Key, Eye, Settings, FileSpreadsheet } from "lucide-react";
import { Link } from "wouter";
import type { House, Scholar, InsertScholar, PointEntry, TeacherAuth } from "@shared/schema";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function Admin() {
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [newStudentHouse, setNewStudentHouse] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();

  const { data: houses } = useQuery<House[]>({
    queryKey: ["/api/houses"],
  });

  const { data: pointEntries } = useQuery<PointEntry[]>({
    queryKey: ["/api/points"],
  });

  const { data: pendingTeachers } = useQuery<TeacherAuth[]>({
    queryKey: ["/api/admin/teachers/pending"],
  });

  const { data: allScholars } = useQuery<Scholar[]>({
    queryKey: ["/api/scholars"],
  });

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
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add scholar. Please try again.",
        variant: "destructive",
      });
    },
  });

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
      grade: 6, // Default grade, can be made configurable
    });
  };

  const handleExportData = (format: 'csv' | 'excel') => {
    const url = `/api/admin/export/scholars/${format}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `bhsa-scholars-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
    link.click();
    
    toast({
      title: "Export Started",
      description: `Scholar data export in ${format.toUpperCase()} format has started.`,
    });
  };

  const handleResetPoints = () => {
    if (confirm("Are you sure you want to reset all points for the semester? This action cannot be undone.")) {
      toast({
        title: "Reset Confirmation",
        description: "Point reset functionality would be implemented here.",
      });
    }
  };

  const approveTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      return await apiRequest(`/api/admin/teachers/${teacherId}/approve`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Teacher Approved",
        description: "Teacher account has been approved and can now log in.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers/pending"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve teacher. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get recent point entries (last 10)
  const recentEntries = pointEntries
    ?.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 10) || [];

  return (
    <section data-testid="admin-section">
      <Card className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="flex items-center">
            <img 
              src={schoolLogoPath} 
              alt="Bush Hills STEAM Academy" 
              className="h-12 w-auto mr-4 school-logo-3d"
              data-testid="admin-school-logo"
            />
            <div>
              <h2 className="text-3xl font-bold text-gray-900" data-testid="admin-title">Administration Portal</h2>
              <p className="text-gray-600">Dr. Phillips - Principal • Dr. Stewart - Assistant Principal</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
            <Link href="/admin-settings">
              <Button 
                className="bg-gray-600 text-white hover:bg-gray-700"
                data-testid="button-admin-settings"
              >
                <Settings className="mr-2 h-4 w-4" />
                Email Settings
              </Button>
            </Link>
            <Button 
              onClick={() => window.open("/parent-letter", "_blank")}
              className="bg-blue-600 text-white hover:bg-blue-700"
              data-testid="button-parent-portal"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Parent Portal Info
            </Button>
            <Button 
              onClick={() => handleExportData('csv')}
              className="bg-green-600 text-white hover:bg-green-700"
              data-testid="button-export-csv"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button 
              onClick={() => handleExportData('excel')}
              className="bg-green-700 text-white hover:bg-green-800"
              data-testid="button-export-excel"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button 
              onClick={handleResetPoints}
              variant="destructive"
              data-testid="button-reset-points"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset Semester
            </Button>
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="clear-both pt-6 border-t border-gray-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto mb-6">
            <TabsTrigger value="dashboard" className="flex items-center justify-center text-sm px-2 py-3" data-testid="tab-dashboard">
              <GraduationCap className="mr-1 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">House Management</span>
              <span className="sm:hidden">Houses</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center justify-center text-sm px-2 py-3" data-testid="tab-students">
              <Users className="mr-1 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Student Information</span>
              <span className="sm:hidden">Students</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            {/* Add Points Form */}
            <div className="mb-8">
              <AddPointsForm />
            </div>

        {/* Teacher Approval Section */}
        {pendingTeachers && pendingTeachers.length > 0 && (
          <div className="mb-8">
            <Card className="border border-amber-200 bg-amber-50" data-testid="teacher-approval-card">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-amber-900 flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Pending Teacher Approvals ({pendingTeachers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingTeachers.map((teacher) => (
                    <div 
                      key={teacher.id} 
                      className="flex items-center justify-between p-4 bg-white rounded-lg border"
                      data-testid={`pending-teacher-${teacher.id}`}
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900" data-testid={`teacher-name-${teacher.id}`}>
                          {teacher.name}
                        </h4>
                        <p className="text-sm text-gray-600" data-testid={`teacher-email-${teacher.id}`}>
                          {teacher.email}
                        </p>
                        <p className="text-sm text-gray-500" data-testid={`teacher-role-${teacher.id}`}>
                          {teacher.gradeRole} • {teacher.subject}
                        </p>
                        <p className="text-xs text-gray-400" data-testid={`teacher-date-${teacher.id}`}>
                          Applied: {new Date(teacher.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => approveTeacherMutation.mutate(teacher.id)}
                        disabled={approveTeacherMutation.isPending}
                        className="bg-green-600 text-white hover:bg-green-700"
                        data-testid={`button-approve-${teacher.id}`}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {approveTeacherMutation.isPending ? "Approving..." : "Approve"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Scholar Management and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Add New Scholar */}
          <Card className="border border-gray-200" data-testid="add-scholar-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Add New Scholar</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddScholar} className="space-y-4">
                <div>
                  <Label htmlFor="student-name" className="text-sm font-medium text-gray-700 mb-2">
                    Student Name
                  </Label>
                  <Input
                    id="student-name"
                    type="text"
                    placeholder="Enter full name"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    data-testid="input-student-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="student-id" className="text-sm font-medium text-gray-700 mb-2">
                    Student ID
                  </Label>
                  <Input
                    id="student-id"
                    type="text"
                    placeholder="Enter student ID"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    data-testid="input-student-id"
                  />
                </div>

                <div>
                  <Label htmlFor="student-house" className="text-sm font-medium text-gray-700 mb-2">
                    Assign to House
                  </Label>
                  <Select value={newStudentHouse} onValueChange={setNewStudentHouse} data-testid="select-student-house">
                    <SelectTrigger id="student-house">
                      <SelectValue placeholder="Auto-assign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto" data-testid="option-auto-assign">Auto-assign</SelectItem>
                      {houses?.map((house) => (
                        <SelectItem key={house.id} value={house.id} data-testid={`option-house-${house.id}`}>
                          {house.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  disabled={addScholarMutation.isPending}
                  data-testid="button-add-scholar"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {addScholarMutation.isPending ? "Adding..." : "Add Scholar"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border border-gray-200" data-testid="recent-activity-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {recentEntries.length > 0 ? (
                  recentEntries.map((entry, index) => {
                    const house = houses?.find(h => h.id === entry.houseId);
                    const categoryColors = {
                      academic: "bg-blue-50 text-blue-600",
                      attendance: "bg-green-50 text-green-600",
                      behavior: "bg-purple-50 text-purple-600",
                    };
                    
                    return (
                      <div 
                        key={entry.id} 
                        className={`flex items-center justify-between p-3 rounded-lg ${categoryColors[entry.category as keyof typeof categoryColors]}`}
                        data-testid={`activity-item-${index}`}
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center mr-3">
                            <Plus className="text-xs" />
                          </div>
                          <div>
                            <p className="text-sm font-medium" data-testid={`activity-description-${index}`}>
                              {entry.points} points added to {house?.name?.replace("House of ", "")}
                            </p>
                            <p className="text-xs opacity-75" data-testid={`activity-category-${index}`}>
                              {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)} 
                              {entry.reason && ` - ${entry.reason}`}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs opacity-60" data-testid={`activity-time-${index}`}>
                          {entry.createdAt ? new Date(entry.createdAt!).toLocaleTimeString() : 'Now'}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 py-8" data-testid="no-activity-message">
                    No recent activity to display.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* House Management */}
        <div className="bg-gray-50 rounded-xl p-6" data-testid="house-management-section">
          <h3 className="text-xl font-bold text-gray-900 mb-6">House Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {houses?.map((house) => {
              const totalPoints = house.academicPoints + house.attendancePoints + house.behaviorPoints;
              const houseColorClass = {
                franklin: "bg-house-franklin",
                courie: "bg-house-courie", 
                west: "bg-house-west",
                blackwell: "bg-house-blackwell",
                berruguete: "bg-house-berruguete",
              }[house.id] || "bg-house-franklin";

              return (
                <Card key={house.id} className="border border-gray-200" data-testid={`house-management-${house.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900" data-testid={`house-mgmt-name-${house.id}`}>
                        {house.name.replace("House of ", "")}
                      </h4>
                      <div className={`w-6 h-6 ${houseColorClass} rounded-full`}></div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Scholars:</span>
                        <span className="font-medium" data-testid={`house-mgmt-scholars-${house.id}`}>
                          {house.memberCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Points:</span>
                        <span className="font-medium" data-testid={`house-mgmt-points-${house.id}`}>
                          {totalPoints.toLocaleString()}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs hover:bg-gray-200"
                        onClick={() => window.location.href = `/houses/${house.id}`}
                        data-testid={`button-manage-house-${house.id}`}
                      >
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
            </TabsContent>

            <TabsContent value="students" className="mt-6">
              <div className="space-y-6">
                {/* Student Portal Overview */}
                <Card className="border border-blue-200 bg-blue-50" data-testid="student-overview-card">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-blue-900 flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Student Portal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-blue-600" data-testid="total-students-count">
                          {allScholars?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Total Students</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-green-600" data-testid="students-with-credentials">
                          {allScholars?.filter(s => s.username).length || 0}
                        </div>
                        <div className="text-sm text-gray-600">With Login Credentials</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-orange-600" data-testid="password-reset-requests">
                          {allScholars?.filter(s => s.needsPasswordReset).length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Password Resets Needed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Student Information */}
                <Card data-testid="detailed-student-info-card">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                      <Eye className="mr-2 h-5 w-5" />
                      Detailed Student Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {allScholars && allScholars.length > 0 ? (
                      <div className="space-y-4">
                        {allScholars.map((scholar) => {
                          const house = houses?.find(h => h.id === scholar.houseId);
                          const totalPoints = scholar.academicPoints + scholar.attendancePoints + scholar.behaviorPoints;
                          const houseColor = house?.color || "#3B82F6";
                          
                          return (
                            <div key={scholar.id} className="border rounded-lg p-4 hover:bg-gray-50" data-testid={`student-info-${scholar.id}`}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div 
                                    className="w-4 h-4 rounded-full" 
                                    style={{ backgroundColor: houseColor }}
                                  ></div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900" data-testid={`student-name-${scholar.id}`}>
                                      {scholar.name}
                                    </h4>
                                    <p className="text-sm text-gray-600" data-testid={`student-id-${scholar.id}`}>
                                      ID: {scholar.studentId} • Grade: {scholar.grade}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <Badge variant={scholar.username ? "default" : "secondary"} data-testid={`login-status-${scholar.id}`}>
                                    {scholar.username ? (
                                      <div className="flex items-center">
                                        <Key className="mr-1 h-3 w-3" />
                                        Has Login
                                      </div>
                                    ) : (
                                      "No Login"
                                    )}
                                  </Badge>
                                  {scholar.needsPasswordReset && (
                                    <Badge variant="destructive" data-testid={`reset-needed-${scholar.id}`}>
                                      Reset Needed
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">House:</span>
                                  <div className="font-medium" data-testid={`student-house-${scholar.id}`}>
                                    {house?.name?.replace("House of ", "") || "Unassigned"}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Total Points:</span>
                                  <div className="font-medium text-blue-600" data-testid={`student-total-points-${scholar.id}`}>
                                    {totalPoints}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Academic:</span>
                                  <div className="font-medium text-green-600" data-testid={`student-academic-${scholar.id}`}>
                                    {scholar.academicPoints}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Behavior:</span>
                                  <div className="font-medium text-purple-600" data-testid={`student-behavior-${scholar.id}`}>
                                    {scholar.behaviorPoints}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                                <div>
                                  <span className="text-gray-600">Attendance Points:</span>
                                  <div className="font-medium text-orange-600" data-testid={`student-attendance-${scholar.id}`}>
                                    {scholar.attendancePoints}
                                  </div>
                                </div>
                                {scholar.username && (
                                  <div>
                                    <span className="text-gray-600">Username:</span>
                                    <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded" data-testid={`student-username-${scholar.id}`}>
                                      {scholar.username}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8" data-testid="no-students-message">
                        No students found in the system.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </section>
  );
}
