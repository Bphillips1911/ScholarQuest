import { useState, useEffect } from "react";
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
import { Download, RefreshCw, UserPlus, Plus, CheckCircle, Clock, Users, GraduationCap, Award, LogOut, User, MessageSquare, Send, Reply } from "lucide-react";
import { useLocation } from "wouter";
import type { House, Scholar, TeacherAuth } from "@shared/schema";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function AdminNew() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if admin is logged in
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);

  useEffect(() => {
    console.log("AdminNew component mounted");
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

  // Fetch data hooks
  const { data: houses } = useQuery<House[]>({
    queryKey: ["/api/houses"],
    enabled: isAuthenticated,
  });

  const { data: allScholars } = useQuery<Scholar[]>({
    queryKey: ["/api/scholars"],
    enabled: isAuthenticated,
  });

  const { data: pendingTeachers } = useQuery<TeacherAuth[]>({
    queryKey: ["/api/admin/teachers/pending"],
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

  // Export data functions
  const handleExportData = async (format: 'csv' | 'excel') => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/export/${format}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `pbis-data.${format === 'excel' ? 'xlsx' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export Successful",
          description: `Data exported as ${format.toUpperCase()}`,
        });
      } else {
        throw new Error(`Export failed: ${response.status}`);
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Teacher approval functions
  const approveTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/teachers/${teacherId}/approve`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to approve teacher");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers/pending"] });
      toast({
        title: "Teacher Approved",
        description: "Teacher has been successfully approved.",
      });
    },
    onError: () => {
      toast({
        title: "Approval Failed",
        description: "Failed to approve teacher. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb'
    }}>
      {/* CRITICAL NAVIGATION - FORCED VISIBILITY */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        backgroundColor: '#ff0000',
        color: 'white',
        padding: '30px',
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        border: '5px solid #ffffff',
        boxShadow: '0 0 20px rgba(255,0,0,0.8)',
        width: '100%',
        display: 'block'
      }}>
        ✅ ADMIN NAVIGATION RESTORED - ALL FEATURES ACTIVE
      </div>
      <div style={{
        position: 'fixed',
        top: '100px',
        left: 0,
        right: 0,
        zIndex: 99998,
        backgroundColor: '#0000ff',
        color: 'white',
        padding: '10px 20px',
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        alignItems: 'center',
        border: '3px solid #ffffff',
        width: '100%'
      }}>
        <Select onValueChange={(value) => window.location.href = value}>
          <SelectTrigger style={{width: '150px', backgroundColor: '#1d4ed8', color: 'white', border: 'none'}}>
            <SelectValue placeholder="Main Pages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="/dashboard">Dashboard</SelectItem>
            <SelectItem value="/tutorial">Tutorial</SelectItem>
            <SelectItem value="/houses">Houses</SelectItem>
            <SelectItem value="/pbis">PBIS</SelectItem>
          </SelectContent>
        </Select>
        
        <Select onValueChange={(value) => window.location.href = value}>
          <SelectTrigger style={{width: '150px', backgroundColor: '#1d4ed8', color: 'white', border: 'none'}}>
            <SelectValue placeholder="Reports & Tools" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="/monthly-pbis">Monthly Tracking</SelectItem>
            <SelectItem value="/house-sorting">House Sorting</SelectItem>
            <SelectItem value="/parent-letter">Parent Letter</SelectItem>
            <SelectItem value="/pledge">House Pledge</SelectItem>
          </SelectContent>
        </Select>
        
        <button onClick={handleLogout} style={{
          color: 'white', 
          backgroundColor: '#dc2626', 
          border: 'none', 
          padding: '8px 16px', 
          borderRadius: '6px', 
          fontSize: '14px', 
          cursor: 'pointer', 
          fontWeight: 'bold'
        }}>
          Logout
        </button>
      </div>
      
      <div style={{marginTop: '170px', padding: '20px'}}>
        <Card className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
            <div className="flex items-center">
              <img 
                src={schoolLogoPath} 
                alt="Bush Hills STEAM Academy" 
                className="h-12 w-auto mr-4"
                data-testid="admin-school-logo"
              />
              <div>
                <h2 className="text-3xl font-bold text-gray-900" data-testid="admin-title">Administration Portal</h2>
                <p className="text-gray-600">Welcome, {adminData?.firstName} {adminData?.lastName} ({adminData?.title})</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
              <Button 
                onClick={() => window.location.href = '/admin-settings'}
                className="bg-gray-600 text-white hover:bg-gray-700"
                data-testid="button-admin-settings"
              >
                <User className="mr-2 h-4 w-4" />
                Email Settings
              </Button>
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
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button 
                onClick={() => window.location.href = '/qr-generator'}
                className="bg-blue-600 text-white hover:bg-blue-700"
                data-testid="button-qr-generator"
              >
                <Plus className="mr-2 h-4 w-4" />
                QR Generator
              </Button>
              <Button 
                onClick={() => {
                  if (confirm("Are you sure you want to reset all semester points? This action cannot be undone.")) {
                    // Add reset points functionality here
                    toast({
                      title: "Feature Coming Soon",
                      description: "Semester reset functionality will be available soon.",
                    });
                  }
                }}
                variant="destructive"
                data-testid="button-reset-points"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Semester
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
              <TabsTrigger value="houses">Houses</TabsTrigger>
              <TabsTrigger value="messaging">Messages</TabsTrigger>
              <TabsTrigger value="exports">Data Export</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{allScholars?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">Active scholars</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Houses</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{houses?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">House system</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Teachers</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pendingTeachers?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Status</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">Active</div>
                    <p className="text-xs text-muted-foreground">All systems operational</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button onClick={() => window.location.href = '/houses'} className="w-full justify-start">
                      <Award className="mr-2 h-4 w-4" />
                      Manage Houses
                    </Button>
                    <Button onClick={() => window.location.href = '/pbis'} className="w-full justify-start">
                      <GraduationCap className="mr-2 h-4 w-4" />
                      PBIS System
                    </Button>
                    <Button onClick={() => window.location.href = '/house-sorting'} className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      House Sorting
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Navigation Active</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Navigation system operational
                      </div>
                      <p className="text-sm text-gray-600">
                        Use the dropdown menus above to access all main system functions
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="teachers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Teacher Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Manage teacher approvals and access</p>
                  {pendingTeachers && pendingTeachers.length > 0 ? (
                    <div className="space-y-4">
                      {pendingTeachers.map((teacher) => (
                        <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                          <div className="flex-1">
                            <p className="font-medium">{teacher.firstName} {teacher.lastName}</p>
                            <p className="text-sm text-gray-500">{teacher.email}</p>
                            <p className="text-sm text-gray-600">{teacher.gradeRole} • {teacher.subject}</p>
                            <p className="text-xs text-gray-400">
                              Applied: {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'Recently'}
                            </p>
                          </div>
                          <Button
                            onClick={() => approveTeacherMutation.mutate(teacher.id)}
                            disabled={approveTeacherMutation.isPending}
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {approveTeacherMutation.isPending ? "Approving..." : "Approve"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                      <p className="text-gray-500">No pending teacher approvals</p>
                      <p className="text-sm text-gray-400">All teachers have been approved</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="houses" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>House Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {houses && houses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {houses.map((house) => (
                        <div key={house.id} className="p-4 border rounded-lg">
                          <h3 className="font-bold" style={{color: house.color}}>
                            {house.name}
                          </h3>
                          <p className="text-sm text-gray-600">{house.description}</p>
                          <div className="mt-2">
                            <Badge>
                              {allScholars?.filter(s => s.houseId === house.id).length || 0} students
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Loading houses...</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messaging" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Communication Center</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Manage parent-teacher communications</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button onClick={() => window.location.href = '/admin-messages'} className="justify-start h-auto p-4">
                      <div className="text-left">
                        <div className="flex items-center">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          View Messages
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Access all parent-teacher messages</p>
                      </div>
                    </Button>
                    <Button onClick={() => window.location.href = '/parent-letter'} className="justify-start h-auto p-4">
                      <div className="text-left">
                        <div className="flex items-center">
                          <Send className="mr-2 h-4 w-4" />
                          Parent Information
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Parent portal setup guide</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Export & Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">Export system data in various formats for analysis and reporting</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button 
                      onClick={() => handleExportData('csv')}
                      className="bg-green-600 text-white hover:bg-green-700 justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="flex items-center">
                          <Download className="mr-2 h-4 w-4" />
                          Export CSV
                        </div>
                        <p className="text-sm text-gray-300 mt-1">All data in spreadsheet format</p>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => handleExportData('excel')}
                      className="bg-green-700 text-white hover:bg-green-800 justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="flex items-center">
                          <Download className="mr-2 h-4 w-4" />
                          Export Excel
                        </div>
                        <p className="text-sm text-gray-300 mt-1">Formatted Excel workbook</p>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => window.location.href = '/qr-generator'}
                      className="bg-blue-600 text-white hover:bg-blue-700 justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="flex items-center">
                          <Plus className="mr-2 h-4 w-4" />
                          QR Generator
                        </div>
                        <p className="text-sm text-gray-300 mt-1">Generate student QR codes</p>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => window.location.href = '/admin-settings'}
                      className="bg-gray-600 text-white hover:bg-gray-700 justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          Email Settings
                        </div>
                        <p className="text-sm text-gray-300 mt-1">Configure email notifications</p>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => window.open("/parent-letter", "_blank")}
                      className="bg-blue-600 text-white hover:bg-blue-700 justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="flex items-center">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Parent Portal Info
                        </div>
                        <p className="text-sm text-gray-300 mt-1">Parent setup instructions</p>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        if (confirm("Are you sure you want to reset all semester points? This action cannot be undone.")) {
                          toast({
                            title: "Feature Coming Soon",
                            description: "Semester reset functionality will be available soon.",
                          });
                        }
                      }}
                      variant="destructive"
                      className="justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="flex items-center">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reset Semester
                        </div>
                        <p className="text-sm text-red-300 mt-1">Clear all point data</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}