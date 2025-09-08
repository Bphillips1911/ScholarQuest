import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Star, Send, Eye, Trash2, Edit, Search, X } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  grade: number;
  houseId: string;
  academicPoints: number;
  attendancePoints: number;
  behaviorPoints: number;
}

interface ClassPeriod {
  id: string;
  name: string;
  description: string;
  students: Student[];
  teacherId: string;
  createdAt: string;
}

interface UnifiedArtsClassManagerProps {
  teacher: any;
}

export function UnifiedArtsClassManager({ teacher }: UnifiedArtsClassManagerProps) {
  const [createClassDialog, setCreateClassDialog] = useState(false);
  const [manageStudentsDialog, setManageStudentsDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassPeriod | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form states
  const [studentSearch, setStudentSearch] = useState('');
  const [classForm, setClassForm] = useState({
    name: '',
    description: ''
  });

  // Get teacher's class periods
  const { data: classPeriods = [], isLoading: classesLoading } = useQuery({
    queryKey: ['/api/teacher/class-periods'],
    enabled: !!teacher,
    queryFn: async () => {
      const response = await fetch('/api/teacher/class-periods', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch class periods');
      }
      return response.json();
    }
  });

  // Get all students from grades 6-8 for unified arts teachers
  const { data: allStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students/grades/6-8'],
    enabled: !!teacher,
    queryFn: async () => {
      const response = await fetch('/api/students/grades/6-8', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      return response.json();
    }
  });

  // Create class period mutation
  const createClassMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/teacher/class-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create class period');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class period created successfully",
        variant: "default"
      });
      setCreateClassDialog(false);
      setClassForm({ name: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/class-periods'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create class period",
        variant: "destructive"
      });
    }
  });

  // Add students to class mutation
  const addStudentsMutation = useMutation({
    mutationFn: async (data: { classId: string; studentIds: string[] }) => {
      const response = await fetch(`/api/teacher/class-periods/${data.classId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify({ studentIds: data.studentIds })
      });

      if (!response.ok) {
        throw new Error('Failed to add students');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Students added to class period",
        variant: "default"
      });
      setManageStudentsDialog(false);
      setSelectedStudents([]);
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/class-periods'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add students",
        variant: "destructive"
      });
    }
  });

  // Delete class period mutation
  const deleteClassMutation = useMutation({
    mutationFn: async (classId: string) => {
      const response = await fetch(`/api/teacher/class-periods/${classId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete class period');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class period deleted",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/class-periods'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete class period",
        variant: "destructive"
      });
    }
  });

  // Remove student from class mutation
  const removeStudentMutation = useMutation({
    mutationFn: async (data: { classId: string; studentId: string }) => {
      const response = await fetch(`/api/teacher/class-periods/${data.classId}/students/${data.studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove student from class');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student removed from class period",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/class-periods'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove student from class",
        variant: "destructive"
      });
    }
  });

  const handleCreateClass = () => {
    if (!classForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a class name",
        variant: "destructive"
      });
      return;
    }

    createClassMutation.mutate({
      name: classForm.name,
      description: classForm.description,
      teacherId: teacher.id
    });
  };

  const handleAddStudents = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student",
        variant: "destructive"
      });
      return;
    }

    addStudentsMutation.mutate({
      classId: selectedClass?.id!,
      studentIds: selectedStudents
    });
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const openStudentDashboard = (student: Student) => {
    window.open(`/student-dashboard?studentId=${student.id}`, '_blank');
  };

  const handleRemoveStudent = (classId: string, studentId: string, studentName: string) => {
    if (confirm(`Are you sure you want to remove ${studentName} from this class period?`)) {
      removeStudentMutation.mutate({ classId, studentId });
    }
  };

  const getAvailableStudents = () => {
    if (!selectedClass) return allStudents;
    const classStudentIds = selectedClass.students.map(s => s.id);
    let availableStudents = allStudents.filter((student: Student) => !classStudentIds.includes(student.id));
    
    // Filter by search term
    if (studentSearch.trim()) {
      availableStudents = availableStudents.filter((student: Student) =>
        student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.grade.toString().includes(studentSearch)
      );
    }
    
    return availableStudents;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Class Period Management</h2>
          <p className="text-gray-600">Manage your Unified Arts class periods and students</p>
        </div>
        <Button onClick={() => setCreateClassDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Class Period
        </Button>
      </div>

      {classesLoading ? (
        <div className="text-center py-8">Loading class periods...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {classPeriods.map((classPeriod: ClassPeriod) => (
            <Card key={classPeriod.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{classPeriod.name}</CardTitle>
                    <CardDescription>{classPeriod.description}</CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedClass(classPeriod);
                        setManageStudentsDialog(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteClassMutation.mutate(classPeriod.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      <Users className="w-3 h-3 mr-1" />
                      {classPeriod.students.length} Students
                    </Badge>
                  </div>

                  {classPeriod.students.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Recent Students:</h4>
                      <div className="space-y-1">
                        {classPeriod.students.slice(0, 3).map((student: Student) => (
                          <div key={student.id} className="flex items-center justify-between text-sm">
                            <span>{student.name}</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                Grade {student.grade}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openStudentDashboard(student)}
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveStudent(classPeriod.id, student.id, student.name)}
                                className="h-6 w-6 p-0"
                                title={`Remove ${student.name} from class`}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {classPeriod.students.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{classPeriod.students.length - 3} more students
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2 mt-4">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedClass(classPeriod);
                        setManageStudentsDialog(true);
                      }}
                    >
                      Manage Students
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {classPeriods.length === 0 && !classesLoading && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Class Periods Yet</h3>
          <p className="text-gray-500 mb-4">Create your first class period to get started</p>
          <Button onClick={() => setCreateClassDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Class Period
          </Button>
        </div>
      )}

      {/* Create Class Dialog */}
      <Dialog open={createClassDialog} onOpenChange={setCreateClassDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Class Period</DialogTitle>
            <DialogDescription>
              Create a new class period for your Unified Arts course
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Class Name *</Label>
              <Input
                placeholder="e.g., Art - Period 1, Music - Morning"
                value={classForm.name}
                onChange={(e) => setClassForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description of the class"
                value={classForm.description}
                onChange={(e) => setClassForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateClassDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateClass} disabled={createClassMutation.isPending}>
              {createClassMutation.isPending ? 'Creating...' : 'Create Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Students Dialog */}
      <Dialog open={manageStudentsDialog} onOpenChange={setManageStudentsDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Students - {selectedClass?.name}</DialogTitle>
            <DialogDescription>
              Add or remove students from this class period
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="add" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add">Add Students</TabsTrigger>
              <TabsTrigger value="current">Current Students ({selectedClass?.students.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Available Students</h4>
                  <Badge variant="outline">
                    {selectedStudents.length} selected
                  </Badge>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name or grade..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {studentsLoading ? (
                  <div className="text-center py-4">Loading students...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {getAvailableStudents().map((student: Student) => (
                      <div
                        key={student.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-gray-500">Grade {student.grade}</div>
                        </div>
                        <Badge variant="secondary">
                          {(student.academicPoints + student.attendancePoints + student.behaviorPoints)} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {getAvailableStudents().length === 0 && !studentsLoading && (
                  <div className="text-center py-8 text-gray-500">
                    All available students have been added to this class.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="current" className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedClass?.students.map((student: Student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-gray-500">Grade {student.grade}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {(student.academicPoints + student.attendancePoints + student.behaviorPoints)} pts
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openStudentDashboard(student)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveStudent(selectedClass!.id, student.id, student.name)}
                        title={`Remove ${student.name} from class`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedClass?.students.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No students added to this class yet.
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageStudentsDialog(false)}>
              Close
            </Button>
            {selectedStudents.length > 0 && (
              <Button onClick={handleAddStudents} disabled={addStudentsMutation.isPending}>
                {addStudentsMutation.isPending ? 'Adding...' : `Add ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}