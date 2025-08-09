import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AddPointsForm from "@/components/add-points-form";
import { Download, RefreshCw, UserPlus, Plus } from "lucide-react";
import type { House, Scholar, InsertScholar, PointEntry } from "@shared/schema";

export default function Admin() {
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [newStudentHouse, setNewStudentHouse] = useState("");
  const { toast } = useToast();

  const { data: houses } = useQuery<House[]>({
    queryKey: ["/api/houses"],
  });

  const { data: pointEntries } = useQuery<PointEntry[]>({
    queryKey: ["/api/points"],
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
    if (!houseId && houses) {
      const leastPopulatedHouse = houses.reduce((min, house) => 
        house.memberCount < min.memberCount ? house : min
      );
      houseId = leastPopulatedHouse.id;
    }

    addScholarMutation.mutate({
      name: newStudentName,
      studentId: newStudentId,
      houseId,
    });
  };

  const handleExportData = () => {
    const data = {
      houses,
      pointEntries,
      exportDate: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `house-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleResetPoints = () => {
    if (confirm("Are you sure you want to reset all points for the semester? This action cannot be undone.")) {
      toast({
        title: "Reset Confirmation",
        description: "Point reset functionality would be implemented here.",
      });
    }
  };

  // Get recent point entries (last 10)
  const recentEntries = pointEntries
    ?.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 10) || [];

  return (
    <section data-testid="admin-section">
      <Card className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900" data-testid="admin-title">Admin Dashboard</h2>
            <p className="text-gray-600">Manage points, scholars, and house activities</p>
          </div>
          <div className="flex space-x-4">
            <Button 
              onClick={handleExportData}
              className="bg-green-600 text-white hover:bg-green-700"
              data-testid="button-export-data"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Data
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

        {/* Add Points Form */}
        <div className="mb-8">
          <AddPointsForm />
        </div>

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
                      <SelectItem value="" data-testid="option-auto-assign">Auto-assign</SelectItem>
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
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString() : 'Now'}
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
      </Card>
    </section>
  );
}
