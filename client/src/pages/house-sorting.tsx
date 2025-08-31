import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";
import { Shuffle, Users, Home, Plus, Trash2, RotateCcw, Eye, Lock } from "lucide-react";
import { useLocation } from "wouter";

interface UnsortedStudent {
  id: string;
  name: string;
  studentId: string;
  grade: number;
  addedByTeacher?: string;
  isHouseSorted: boolean;
}

interface House {
  id: string;
  name: string;
  color: string;
  icon: string;
  motto: string;
  memberCount: number;
}

export default function HouseSorting() {
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [sortingInProgress, setSortingInProgress] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedHouseForStudents, setSelectedHouseForStudents] = useState<House | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch all unsorted students
  const { data: unsortedStudents = [], isLoading } = useQuery({
    queryKey: ["/api/sorting/unsorted-students"],
    queryFn: async () => {
      const token = localStorage.getItem('teacherToken') || localStorage.getItem('adminToken');
      const response = await fetch("/api/sorting/unsorted-students", {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      if (response.status === 401) {
        setIsUnauthorized(true);
        throw new Error("Unauthorized access");
      }
      if (!response.ok) throw new Error("Failed to fetch unsorted students");
      return response.json();
    },
    retry: false,
  });

  // Fetch houses for sorting
  const { data: houses = [] } = useQuery({
    queryKey: ["/api/houses"],
  });

  // Fetch students by house (only when a house is selected)
  const { data: houseStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/houses", selectedHouseForStudents?.id, "students"],
    queryFn: async () => {
      if (!selectedHouseForStudents?.id) return [];
      const token = localStorage.getItem('teacherToken') || localStorage.getItem('adminToken');
      const response = await fetch(`/api/houses/${selectedHouseForStudents.id}/students`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      if (response.status === 401) {
        setIsUnauthorized(true);
        throw new Error("Unauthorized access");
      }
      if (!response.ok) throw new Error("Failed to fetch house students");
      return response.json();
    },
    enabled: !!selectedHouseForStudents?.id,
    retry: false,
  });

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: async (studentData: any) => {
      const response = await apiRequest("POST", "/api/sorting/add-student", studentData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sorting/unsorted-students"] });
      setNewStudentName("");
      setNewStudentId("");
      setShowAddForm(false);
      toast({
        title: "Student Added",
        description: "Student has been added to the sorting queue",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add student",
        variant: "destructive",
      });
    },
  });

  // Remove student mutation
  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await apiRequest("DELETE", `/api/sorting/remove-student/${studentId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sorting/unsorted-students"] });
      toast({
        title: "Student Removed",
        description: "Student has been removed from the sorting queue",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove student",
        variant: "destructive",
      });
    },
  });

  // Sort students mutation
  const sortStudentsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sorting/sort-students");
      return await response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sorting/unsorted-students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/houses"] });
      setSortingInProgress(false);
      
      if (result.sortedStudents && result.sortedStudents.length > 0) {
        const sortingDetails = result.sortedStudents
          .map((s: any) => `${s.studentName} → ${s.houseName}`)
          .join(', ');
        
        toast({
          title: "House Sorting Complete!",
          description: `${result.sortedCount} students sorted: ${sortingDetails}`,
        });
      } else {
        toast({
          title: "House Sorting Complete!",
          description: `${result.sortedCount} students have been sorted into houses`,
        });
      }
    },
    onError: () => {
      setSortingInProgress(false);
      toast({
        title: "Error",
        description: "Failed to sort students into houses",
        variant: "destructive",
      });
    },
  });

  // Reset all houses mutation
  const resetHousesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sorting/reset-houses");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sorting/unsorted-students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/houses"] });
      toast({
        title: "Houses Reset",
        description: "All students have been moved back to the sorting queue",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset houses",
        variant: "destructive",
      });
    },
  });

  const handleAddStudent = () => {
    if (!newStudentName.trim() || !newStudentId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both student name and ID",
        variant: "destructive",
      });
      return;
    }

    addStudentMutation.mutate({
      name: newStudentName.trim(),
      studentId: newStudentId.trim(),
      grade: selectedGrade,
    });
  };

  const handleSortStudents = () => {
    if (unsortedStudents.length === 0) {
      toast({
        title: "No Students to Sort",
        description: "Please add students before sorting",
        variant: "destructive",
      });
      return;
    }

    setSortingInProgress(true);
    setTimeout(() => {
      sortStudentsMutation.mutate();
    }, 2000); // Add dramatic pause for sorting effect
  };

  const getGradeStats = (grade: number) => {
    return unsortedStudents.filter((student: UnsortedStudent) => student.grade === grade).length;
  };

  const getHouseIcon = (houseId: string) => {
    const houseIcons: { [key: string]: string } = {
      franklin: "🐎",
      courie: "🦉", 
      west: "🐺",
      blackwell: "🦅",
      berruguete: "🦁"
    };
    return houseIcons[houseId] || "🏠";
  };

  if (isUnauthorized) {
    return (
      <section className="min-h-screen bg-gray-50 p-4 flex items-center justify-center" data-testid="unauthorized-section">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Lock className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
            <p className="text-gray-600 mb-6">
              The House Sorting system is only accessible to teachers and administrators.
              Please log in with your authorized account to continue.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => setLocation('/teacher-login')}
                className="w-full"
                data-testid="button-teacher-login"
              >
                Teacher Login
              </Button>
              <Button 
                onClick={() => setLocation('/admin-login')}
                variant="outline"
                className="w-full"
                data-testid="button-admin-login"
              >
                Administrator Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 p-4" data-testid="house-sorting-section">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6 bg-white shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img 
                  src={schoolLogoPath} 
                  alt="Bush Hills STEAM Academy" 
                  className="h-12 w-auto mr-4 school-logo-3d"
                  data-testid="sorting-school-logo"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 school-name-3d">House Sorting System</h1>
                  <p className="text-sm text-gray-600 program-title-3d">Bush Hills STEAM Academy</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2"
                  data-testid="button-add-student"
                >
                  <Plus className="h-4 w-4" />
                  Add Student
                </Button>
                <Button
                  onClick={handleSortStudents}
                  disabled={sortingInProgress || unsortedStudents.length === 0}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                  data-testid="button-sort-students"
                >
                  <Shuffle className="h-4 w-4" />
                  {sortingInProgress ? "Sorting..." : "Sort Into Houses"}
                </Button>
                <Button
                  onClick={() => resetHousesMutation.mutate()}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-reset-houses"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset All
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{unsortedStudents.length}</div>
                <div className="text-sm text-gray-600">Students Waiting</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{getGradeStats(6)}</div>
                <div className="text-sm text-gray-600">6th Graders</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{getGradeStats(7)}</div>
                <div className="text-sm text-gray-600">7th Graders</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{getGradeStats(8)}</div>
                <div className="text-sm text-gray-600">8th Graders</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* House Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Current House Populations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {houses.map((house: House) => (
                <div
                  key={house.id}
                  className="text-center p-4 rounded-lg border"
                  style={{ borderColor: house.color }}
                >
                  <div className="text-2xl mb-2">{getHouseIcon(house.id)}</div>
                  <div className="font-semibold text-sm">{house.name}</div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        className="text-lg font-bold hover:underline cursor-pointer transition-all hover:scale-105"
                        style={{ color: house.color }}
                        onClick={() => setSelectedHouseForStudents(house)}
                        data-testid={`button-view-students-${house.id}`}
                      >
                        {house.memberCount}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <span className="text-2xl">{getHouseIcon(house.id)}</span>
                          Students in {house.name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
                        {studentsLoading ? (
                          <div className="text-center py-4">Loading students...</div>
                        ) : houseStudents.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            No students currently assigned to this house
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {houseStudents.map((student: any, index: number) => (
                              <div
                                key={student.id}
                                className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                data-testid={`student-item-${student.id}`}
                              >
                                <div>
                                  <div className="font-medium">{student.name}</div>
                                  <div className="text-sm text-gray-600">Grade {student.grade} • ID: {student.studentId}</div>
                                </div>
                                <Badge variant="outline" style={{ borderColor: house.color, color: house.color }}>
                                  {student.grade}th
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <div className="text-xs text-gray-500">
                    {house.memberCount === 1 ? 'member' : 'members'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Unsorted Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students Waiting for House Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading students...</p>
            ) : unsortedStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No students waiting for house assignment</p>
                <p className="text-sm">Add students to begin the sorting process</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unsortedStudents.map((student: UnsortedStudent) => (
                  <div
                    key={student.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    data-testid={`student-card-${student.studentId}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{student.name}</h4>
                        <p className="text-sm text-gray-600">ID: {student.studentId}</p>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline">Grade {student.grade}</Badge>
                          {student.addedByTeacher && (
                            <Badge variant="secondary" className="text-xs">
                              {student.addedByTeacher}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeStudentMutation.mutate(student.id)}
                        className="text-red-500 hover:text-red-700"
                        data-testid={`button-remove-${student.studentId}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Student Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add Student for House Sorting</CardTitle>
                <p className="text-sm text-gray-600">
                  Enter student information. Example: "John Doe" with ID "BH22"
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="studentName">Student Name</Label>
                  <Input
                    id="studentName"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="e.g., John Doe"
                    data-testid="input-student-name"
                  />
                </div>
                <div>
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    placeholder="e.g., BH22 or BH6001"
                    data-testid="input-student-id"
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grade Level</Label>
                  <Select 
                    value={selectedGrade.toString()} 
                    onValueChange={(value) => setSelectedGrade(parseInt(value))}
                  >
                    <SelectTrigger data-testid="select-grade">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6th Grade</SelectItem>
                      <SelectItem value="7">7th Grade</SelectItem>
                      <SelectItem value="8">8th Grade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAddStudent}
                    disabled={addStudentMutation.isPending}
                    data-testid="button-save-student"
                  >
                    {addStudentMutation.isPending ? "Adding..." : "Add Student"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                    data-testid="button-cancel-add"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sorting Animation */}
        {sortingInProgress && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <Card className="p-8 text-center">
              <div className="animate-spin text-6xl mb-4">🎭</div>
              <h3 className="text-xl font-bold mb-2">Sorting Students Into Houses...</h3>
              <p className="text-gray-600">The Sorting Hat is making its decisions...</p>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}