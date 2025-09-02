import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Eye, Users, FileText, Award, Camera, Image } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Teacher {
  id: string;
  email: string;
  name: string;
  gradeRole: string;
  subject: string;
  isApproved: boolean;
}

interface Scholar {
  id: string;
  name: string;
  studentId: string;
  houseId: string;
  grade: number;
  academicPoints: number;
  attendancePoints: number;
  behaviorPoints: number;
}

interface Reflection {
  id: string;
  scholarId: string;
  prompt: string;
  response: string | null;
  status: 'assigned' | 'submitted' | 'approved' | 'rejected';
  teacherFeedback: string | null;
  dueDate: string | null;
  assignedAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
}

interface Message {
  id: string;
  teacherId: string;
  parentId: string;
  subject: string;
  content: string;
  isFromTeacher: boolean;
  createdAt: string;
  readAt: string | null;
}

export function AdminTeacherViewer() {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch all teachers
  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['/api/admin/teachers/all'],
  });

  // Fetch selected teacher's scholars
  const { data: teacherScholars } = useQuery<Scholar[]>({
    queryKey: ['/api/teacher/scholars', selectedTeacherId],
    enabled: !!selectedTeacherId,
  });

  // Fetch selected teacher's reflections
  const { data: teacherReflections } = useQuery<Reflection[]>({
    queryKey: ['/api/teacher/reflections', selectedTeacherId],
    enabled: !!selectedTeacherId,
  });

  // Fetch selected teacher's messages
  const { data: teacherMessages } = useQuery<Message[]>({
    queryKey: ['/api/teacher/messages', selectedTeacherId],
    enabled: !!selectedTeacherId,
  });

  // Fetch selected teacher's photos
  const { data: teacherPhotos } = useQuery({
    queryKey: ['/api/teacher/photos', selectedTeacherId],
    enabled: !!selectedTeacherId,
  });

  const selectedTeacher = teachers?.find(t => t.id === selectedTeacherId);

  const submittedReflections = teacherReflections?.filter(r => r.status === 'submitted') || [];
  const unreadMessages = teacherMessages?.filter(m => !m.readAt) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          Teacher Dashboard Viewer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Teacher Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Teacher:</label>
          <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a teacher to view their dashboard..." />
            </SelectTrigger>
            <SelectContent>
              {teachers?.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.email}) - {teacher.gradeRole} {teacher.subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Teacher Dashboard */}
        {selectedTeacher && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-lg">Viewing Dashboard for:</h3>
              <p className="text-gray-700">
                <strong>{selectedTeacher.name}</strong> - {selectedTeacher.gradeRole} {selectedTeacher.subject}
              </p>
              <p className="text-sm text-gray-600">{selectedTeacher.email}</p>
              <p className="text-sm">
                Status: <span className={selectedTeacher.isApproved ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  {selectedTeacher.isApproved ? "Approved" : "Pending Approval"}
                </span>
              </p>
            </div>

            {/* Teacher Dashboard Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="scholars">
                  <Users className="h-4 w-4 mr-1" />
                  Scholars ({teacherScholars?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="reflections">
                  Reflections
                  {submittedReflections.length > 0 && (
                    <span className="ml-1 px-1 bg-red-500 text-white text-xs rounded-full">
                      {submittedReflections.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="story-review">
                  <FileText className="h-4 w-4 mr-1" />
                  Story Review
                </TabsTrigger>
                <TabsTrigger value="messages">
                  Messages
                  {unreadMessages.length > 0 && (
                    <span className="ml-1 px-1 bg-blue-500 text-white text-xs rounded-full">
                      {unreadMessages.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="photos">
                  <Camera className="h-4 w-4 mr-1" />
                  Photos
                </TabsTrigger>
              </TabsList>

              {/* Dashboard Overview */}
              <TabsContent value="dashboard" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-2xl font-bold text-gray-900">{teacherScholars?.length || 0}</p>
                          <p className="text-gray-600">Students</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-2xl font-bold text-gray-900">{teacherReflections?.length || 0}</p>
                          <p className="text-gray-600">Reflections</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Award className="h-8 w-8 text-orange-600" />
                        <div className="ml-4">
                          <p className="text-2xl font-bold text-gray-900">{submittedReflections.length}</p>
                          <p className="text-gray-600">Pending Review</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Image className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-2xl font-bold text-gray-900">{teacherPhotos?.length || 0}</p>
                          <p className="text-gray-600">Photos Uploaded</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Scholars Tab */}
              <TabsContent value="scholars">
                <Card>
                  <CardHeader>
                    <CardTitle>Students in {selectedTeacher.gradeRole}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teacherScholars && teacherScholars.length > 0 ? (
                      <div className="space-y-2">
                        {teacherScholars.map((scholar) => (
                          <div key={scholar.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <p className="font-semibold">{scholar.name}</p>
                              <p className="text-sm text-gray-600">ID: {scholar.studentId} | Grade: {scholar.grade}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-blue-600">
                                {scholar.academicPoints + scholar.attendancePoints + scholar.behaviorPoints} pts
                              </p>
                              <p className="text-sm text-gray-600">House: {scholar.houseId}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No students assigned to this teacher</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reflections Tab */}
              <TabsContent value="reflections">
                <Card>
                  <CardHeader>
                    <CardTitle>Behavioral Reflections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teacherReflections && teacherReflections.length > 0 ? (
                      <div className="space-y-3">
                        {teacherReflections.map((reflection) => {
                          const student = teacherScholars?.find(s => s.id === reflection.scholarId);
                          return (
                            <div key={reflection.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold">{student?.name || 'Unknown Student'}</h4>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  reflection.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                                  reflection.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  reflection.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {reflection.status.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                <strong>Prompt:</strong> {reflection.prompt}
                              </p>
                              {reflection.response && (
                                <p className="text-sm mb-2">
                                  <strong>Response:</strong> {reflection.response}
                                </p>
                              )}
                              {reflection.teacherFeedback && (
                                <p className="text-sm text-blue-600">
                                  <strong>Teacher Feedback:</strong> {reflection.teacherFeedback}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No reflections assigned</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Story Review Tab */}
              <TabsContent value="story-review">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Story Feedback Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center py-8">
                      Story review functionality available - teacher can review AI-generated story feedback for their students.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages">
                <Card>
                  <CardHeader>
                    <CardTitle>Parent-Teacher Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teacherMessages && teacherMessages.length > 0 ? (
                      <div className="space-y-3">
                        {teacherMessages.map((message) => (
                          <div key={message.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{message.subject}</h4>
                              <div className="text-sm text-gray-500">
                                {new Date(message.createdAt).toLocaleDateString()}
                                {!message.readAt && (
                                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                    Unread
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {message.isFromTeacher ? "To Parent" : "From Parent"}
                            </p>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No messages</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos">
                <Card>
                  <CardHeader>
                    <CardTitle>Uploaded Photos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center py-8">
                      Photo gallery and upload functionality available for teacher.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {!selectedTeacherId && (
          <div className="text-center py-12 text-gray-500">
            <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Select a teacher from the dropdown above to view their dashboard</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}