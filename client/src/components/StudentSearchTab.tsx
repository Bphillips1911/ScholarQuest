import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Star, Send, CheckCircle, Eye } from 'lucide-react';
import { PBISCategorySelector } from '@/components/PBISCategorySelector';

interface Student {
  id: string;
  name: string;
  grade: number;
  houseId: string;
  academicPoints: number;
  attendancePoints: number;
  behaviorPoints: number;
  totalPoints: number;
}

interface TeacherStudentSearchProps {
  teacher: any;
}

export function StudentSearchTab({ teacher }: TeacherStudentSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [awardPointsDialog, setAwardPointsDialog] = useState(false);
  const [messageParentDialog, setMessageParentDialog] = useState(false);
  const [viewDashboardDialog, setViewDashboardDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // PBIS Form states (matching teacher dashboard structure)
  const [pbisForm, setPbisForm] = useState({
    category: '',
    subcategory: '',
    points: 0,
    customReason: ''
  });

  const [messageForm, setMessageForm] = useState({
    subject: '',
    message: ''
  });

  // Get students for teacher's grade level
  const { data: students = [], isLoading } = useQuery({
    queryKey: [`/api/teacher/scholars/grade/${teacher.canSeeGrades[0]}`],
    enabled: !!teacher && teacher.canSeeGrades.length > 0
  });

  // Filter students based on search query
  const filteredStudents = (students as Student[]).filter((student: Student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Award points mutation (using PBIS system)
  const awardPointsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/pbis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify({
          scholarId: selectedStudent?.id,
          teacherName: teacher.name,
          teacherId: teacher.id,
          teacherRole: teacher.gradeRole,
          category: pbisForm.category,
          subcategory: pbisForm.subcategory,
          points: pbisForm.points,
          customReason: pbisForm.customReason,
          entryType: pbisForm.points < 0 ? 'negative' : 'positive',
          mustangTrait: pbisForm.points < 0 ? 'Need to be responsible' : 'Give 100% everyday',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to award points');
      }

      return response.json();
    },
    onSuccess: () => {
      const isNegative = pbisForm.points < 0;
      toast({
        title: "Success",
        description: isNegative 
          ? `Deducted ${Math.abs(pbisForm.points)} points from ${selectedStudent?.name}` 
          : `Awarded ${pbisForm.points} points to ${selectedStudent?.name}`,
        variant: isNegative ? "destructive" : "default"
      });
      setAwardPointsDialog(false);
      setPbisForm({ category: '', subcategory: '', points: 0, customReason: '' });
      // Invalidate multiple queries for real-time updates
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/scholars/grade/${teacher.canSeeGrades[0]}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/scholars'] });
      queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pbis'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to award points",
        variant: "destructive"
      });
    }
  });

  // Send message to parent mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedStudent?.id) {
        throw new Error('No student selected for messaging');
      }

      const response = await fetch('/api/teacher/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify({
          scholarId: selectedStudent.id,
          subject: data.subject,
          message: data.message,
          recipientType: 'parent',
          studentName: selectedStudent.name // Add student name for better parent lookup
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error occurred' }));
        throw new Error(errorData.error || `Failed to send message to ${selectedStudent.name}'s parent`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: `Message successfully sent to ${selectedStudent?.name}'s parent`,
        variant: "default"
      });
      setMessageParentDialog(false);
      setMessageForm({ subject: '', message: '' });
      // Refresh messages to show the sent message
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/messages'] });
    },
    onError: (error: Error) => {
      console.error('Parent message error:', error);
      toast({
        title: "Message Failed",
        description: error.message.includes('parent') ? 
          `Unable to locate parent contact for ${selectedStudent?.name}. Please contact administration.` : 
          "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });



  const handleSendMessage = () => {
    if (!messageForm.subject || !messageForm.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    sendMessageMutation.mutate(messageForm);
  };

  const handleAwardPoints = () => {
    if (!pbisForm.category || !pbisForm.subcategory) {
      toast({
        title: "Error", 
        description: "Please select both category and recognition",
        variant: "destructive"
      });
      return;
    }
    awardPointsMutation.mutate();
  };

  const openStudentDashboard = (student: Student) => {
    // Use the teacher's student dashboard viewer route
    fetch(`/api/teacher/student-dashboard/${student.id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data) {
        // Open in a new tab with the student dashboard data
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>${student.name} - Student Dashboard</title>
                <style>
                  body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
                  .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef; }
                  .points { font-size: 1.5em; font-weight: bold; color: #495057; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>${student.name} - Student Dashboard</h1>
                  <p>Grade ${student.grade} • House: ${student.houseId}</p>
                </div>
                <div class="stats">
                  <div class="stat-card">
                    <h3>Academic Points</h3>
                    <div class="points">${student.academicPoints}</div>
                  </div>
                  <div class="stat-card">
                    <h3>Attendance Points</h3>
                    <div class="points">${student.attendancePoints}</div>
                  </div>
                  <div class="stat-card">
                    <h3>Behavior Points</h3>
                    <div class="points">${student.behaviorPoints}</div>
                  </div>
                  <div class="stat-card">
                    <h3>Total Points</h3>
                    <div class="points">${student.totalPoints || (student.academicPoints + student.attendancePoints + student.behaviorPoints)}</div>
                  </div>
                </div>
              </body>
            </html>
          `);
        }
      }
    })
    .catch(error => {
      toast({
        title: "Error",
        description: "Failed to load student dashboard",
        variant: "destructive"
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={`Search ${teacher.gradeRole} students...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">
          {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading students...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student: Student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{student.name}</CardTitle>
                <CardDescription>
                  Grade {student.grade} • {student.totalPoints || (student.academicPoints + student.attendancePoints + student.behaviorPoints)} Total Points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Academic:</span>
                    <Badge variant="outline">{student.academicPoints}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Attendance:</span>
                    <Badge variant="outline">{student.attendancePoints}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Behavior:</span>
                    <Badge variant="outline">{student.behaviorPoints}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedStudent(student);
                      setAwardPointsDialog(true);
                    }}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Award Points
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedStudent(student);
                        setMessageParentDialog(true);
                      }}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Message Parent
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openStudentDashboard(student)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredStudents.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          {searchQuery ? 'No students found matching your search.' : 'No students available.'}
        </div>
      )}

      {/* Award Points Dialog - Enhanced with Scrollable Design */}
      {awardPointsDialog && selectedStudent && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setAwardPointsDialog(false);
              setPbisForm({ category: '', subcategory: '', points: 0, customReason: '' });
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden shadow-xl">
            {/* Header with X Button */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Award MUSTANG Points</h2>
                <p className="text-sm text-gray-600 font-medium">Scholar: {selectedStudent.name}</p>
              </div>
              <button
                onClick={() => {
                  setAwardPointsDialog(false);
                  setPbisForm({ category: '', subcategory: '', points: 0, customReason: '' });
                }}
                className="h-8 w-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors duration-200"
                data-testid="button-close-points-modal"
              >
                <span className="text-red-600 font-bold text-lg">×</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-4 space-y-4">
              {/* PBIS Recognition Categories */}
              <PBISCategorySelector
                selectedCategory={pbisForm.category}
                selectedSubcategory={pbisForm.subcategory}
                onCategorySelect={(categoryId) => setPbisForm({...pbisForm, category: categoryId, subcategory: ""})}
                onSubcategorySelect={(subcategoryId, points) => setPbisForm({...pbisForm, subcategory: subcategoryId, points: points})}
                onReasonChange={(reason) => setPbisForm({...pbisForm, customReason: reason})}
                customReason={pbisForm.customReason}
              />

              {pbisForm.points > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-medium text-green-800">
                    Points to Award: <span className="text-xl font-bold">{pbisForm.points}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Footer with Action Buttons */}
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setAwardPointsDialog(false);
                  setPbisForm({ category: '', subcategory: '', points: 0, customReason: '' });
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAwardPoints}
                disabled={!pbisForm.category || !pbisForm.subcategory || awardPointsMutation.isPending}
                className={`px-6 py-2 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 ${
                  pbisForm.points < 0 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {awardPointsMutation.isPending 
                  ? (pbisForm.points < 0 ? "Deducting..." : "Awarding...") 
                  : (pbisForm.points < 0 ? "Deduct Points" : "Award MUSTANG Points")
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Parent Dialog */}
      <Dialog open={messageParentDialog} onOpenChange={setMessageParentDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Message Parent</DialogTitle>
            <DialogDescription>
              Send a message to {selectedStudent?.name}'s parent
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Subject *</Label>
              <Input
                placeholder="Message subject"
                value={messageForm.subject}
                onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div>
              <Label>Message *</Label>
              <Textarea
                placeholder="Your message to the parent..."
                value={messageForm.message}
                onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageParentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={sendMessageMutation.isPending}>
              {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}