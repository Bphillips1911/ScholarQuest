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

  // Form states
  const [pointsForm, setPointsForm] = useState({
    category: '',
    subcategory: '',
    mustangTrait: '',
    points: 1,
    reason: ''
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
  const filteredStudents = students.filter((student: Student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Award points mutation
  const awardPointsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/pbis-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify({
          scholarId: selectedStudent?.id,
          teacherName: teacher.name,
          teacherRole: teacher.gradeRole,
          category: data.category,
          subcategory: data.subcategory,
          mustangTrait: data.mustangTrait,
          points: data.points,
          reason: data.reason,
          entryType: 'positive'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to award points');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Awarded ${pointsForm.points} points to ${selectedStudent?.name}`,
        variant: "default"
      });
      setAwardPointsDialog(false);
      setPointsForm({ category: '', subcategory: '', mustangTrait: '', points: 1, reason: '' });
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/scholars/grade/${teacher.canSeeGrades[0]}`] });
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
      const response = await fetch('/api/teacher/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify({
          scholarId: selectedStudent?.id,
          subject: data.subject,
          message: data.message,
          recipientType: 'parent'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Message sent to ${selectedStudent?.name}'s parent`,
        variant: "default"
      });
      setMessageParentDialog(false);
      setMessageForm({ subject: '', message: '' });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  });

  const handleAwardPoints = () => {
    if (!pointsForm.category || !pointsForm.mustangTrait) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    awardPointsMutation.mutate(pointsForm);
  };

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

  const openStudentDashboard = (student: Student) => {
    window.open(`/student-portal?student=${student.id}`, '_blank');
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

      {/* Award Points Dialog */}
      <Dialog open={awardPointsDialog} onOpenChange={setAwardPointsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Award Mustang Points</DialogTitle>
            <DialogDescription>
              Award points to {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Category *</Label>
              <Select onValueChange={(value) => setPointsForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="behavior">Behavior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>MUSTANG Trait *</Label>
              <Select onValueChange={(value) => setPointsForm(prev => ({ ...prev, mustangTrait: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trait" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">M - Motivated</SelectItem>
                  <SelectItem value="U">U - Understanding</SelectItem>
                  <SelectItem value="S">S - Safe</SelectItem>
                  <SelectItem value="T">T - Teamwork</SelectItem>
                  <SelectItem value="A">A - Accountable</SelectItem>
                  <SelectItem value="N">N - Noble</SelectItem>
                  <SelectItem value="G">G - Growth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Points</Label>
              <Select onValueChange={(value) => setPointsForm(prev => ({ ...prev, points: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="1" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Point</SelectItem>
                  <SelectItem value="2">2 Points</SelectItem>
                  <SelectItem value="3">3 Points</SelectItem>
                  <SelectItem value="5">5 Points</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Reason</Label>
              <Textarea
                placeholder="Why are you awarding these points?"
                value={pointsForm.reason}
                onChange={(e) => setPointsForm(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAwardPointsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAwardPoints} disabled={awardPointsMutation.isPending}>
              {awardPointsMutation.isPending ? 'Awarding...' : 'Award Points'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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