import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { User, Star, TrendingUp, Calendar, LogOut, UserPlus, Award, MessageCircle, Clock, Send, FileText, CheckCircle, AlertCircle, Clock3 } from "lucide-react";
import type { Scholar, PbisEntry } from "@shared/schema";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

interface ParentData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface ScholarDetail {
  scholar: Scholar;
  pbisEntries: PbisEntry[];
}

export default function ParentPortal() {
  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [selectedScholarId, setSelectedScholarId] = useState<string>("");
  const [studentIdInput, setStudentIdInput] = useState("");
  const [showAddScholar, setShowAddScholar] = useState(false);
  const [activeView, setActiveView] = useState<'scholars' | 'messages' | 'reflections'>('scholars');
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("parentToken");
    const savedParentData = localStorage.getItem("parentData");
    
    if (!token || !savedParentData) {
      window.location.href = "/parent-login";
      return;
    }
    
    setParentData(JSON.parse(savedParentData));
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("parentToken");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const { data: scholars = [] } = useQuery<Scholar[]>({
    queryKey: ["/api/parent/scholars"],
    queryFn: async () => {
      const response = await fetch("/api/parent/scholars", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch scholars");
      return response.json();
    },
    enabled: !!parentData,
  });

  // Fetch messages for the parent
  const { data: messages = [] } = useQuery({
    queryKey: ["/api/parent-teacher-messages/parent", parentData?.id],
    queryFn: async () => {
      if (!parentData?.id) return [];
      const response = await fetch(`/api/parent-teacher-messages/parent/${parentData.id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!parentData?.id,
  });

  // Fetch reflections for the parent
  const { data: reflections = [] } = useQuery({
    queryKey: ["/api/parent/reflections"],
    queryFn: async () => {
      const response = await fetch("/api/parent/reflections", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch reflections");
      return response.json();
    },
    enabled: !!parentData,
  });

  const { data: scholarDetail } = useQuery<ScholarDetail>({
    queryKey: ["/api/parent/scholar", selectedScholarId],
    queryFn: async () => {
      const response = await fetch(`/api/parent/scholar/${selectedScholarId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch scholar details");
      return response.json();
    },
    enabled: !!selectedScholarId,
  });

  const addScholarMutation = useMutation({
    mutationFn: async (studentUsername: string) => {
      if (!parentData?.id) throw new Error("Parent ID not found");
      
      const response = await fetch(`/api/parents/${parentData.id}/add-scholar-by-username`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentUsername }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add scholar");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Scholar Added",
        description: data.message || "Scholar has been successfully added to your account.",
      });
      setStudentIdInput("");
      setShowAddScholar(false);
      queryClient.invalidateQueries({ queryKey: ["/api/parent/scholars"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("parentToken");
    localStorage.removeItem("parentData");
    window.location.href = "/parent-login";
  };

  const handleAddScholar = () => {
    if (!studentIdInput.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a student username.",
        variant: "destructive",
      });
      return;
    }
    
    addScholarMutation.mutate(studentIdInput);
  };

  const getHouseColor = (houseId: string) => {
    const colors: Record<string, string> = {
      franklin: "text-blue-600 bg-blue-100",
      courie: "text-green-600 bg-green-100", 
      west: "text-purple-600 bg-purple-100",
      blackwell: "text-gray-600 bg-gray-100",
      berruguete: "text-orange-600 bg-orange-100",
    };
    return colors[houseId] || "text-gray-600 bg-gray-100";
  };

  const getTraitIcon = (trait: string) => {
    const icons: Record<string, string> = {
      Motivated: "🚀",
      Understanding: "💡",
      Safe: "🛡️",
      Teamwork: "🤝",
      Accountable: "✅",
      Noble: "👑",
      Growth: "📈",
    };
    return icons[trait] || "⭐";
  };

  if (!parentData) {
    return <div>Loading...</div>;
  }

  return (
    <section className="min-h-screen bg-gray-50 p-4" data-testid="parent-portal-section">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6 bg-white shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img 
                  src={schoolLogoPath} 
                  alt="Bush Hills STEAM Academy" 
                  className="h-12 w-auto mr-4 school-logo-3d"
                  data-testid="portal-school-logo"
                />
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900" data-testid="portal-title">
                    Parent Portal
                  </CardTitle>
                  <p className="text-gray-600">
                    Welcome, {parentData.firstName} {parentData.lastName}
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="text-gray-600 hover:text-gray-800"
                data-testid="button-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveView('scholars')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'scholars'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid="tab-scholars"
            >
              <User className="h-4 w-4 inline mr-2" />
              My Scholars
            </button>
            <button
              onClick={() => setActiveView('messages')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'messages'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid="tab-messages"
            >
              <MessageCircle className="h-4 w-4 inline mr-2" />
              Messages {messages.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {messages.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveView('reflections')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'reflections'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid="tab-reflections"
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Reflections
            </button>
          </div>
        </div>

        {activeView === 'scholars' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scholars List */}
            <Card className="lg:col-span-1" data-testid="scholars-list-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  My Scholars
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowAddScholar(!showAddScholar)}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  data-testid="button-add-scholar-toggle"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddScholar && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg" data-testid="add-scholar-form">
                  <Label htmlFor="studentUsername" className="text-sm font-medium text-gray-700 mb-2">
                    Enter Student Username
                  </Label>
                  <p className="text-xs text-gray-600 mb-2">
                    Use your child's unique system-generated username (e.g., bh6001sarah)
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="studentUsername"
                      type="text"
                      placeholder="e.g., bh6001sarah"
                      value={studentIdInput}
                      onChange={(e) => setStudentIdInput(e.target.value)}
                      data-testid="input-student-username"
                    />
                    <Button
                      onClick={handleAddScholar}
                      disabled={addScholarMutation.isPending}
                      size="sm"
                      data-testid="button-add-scholar"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {scholars.length > 0 ? (
                  scholars.map((scholar) => (
                    <div
                      key={scholar.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedScholarId === scholar.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedScholarId(scholar.id)}
                      data-testid={`scholar-card-${scholar.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900" data-testid={`scholar-name-${scholar.id}`}>
                            {scholar.name}
                          </h3>
                          <p className="text-sm text-gray-500" data-testid={`scholar-student-id-${scholar.id}`}>
                            ID: {scholar.studentId}
                          </p>
                        </div>
                        <Badge className={getHouseColor(scholar.houseId)} data-testid={`scholar-house-${scholar.id}`}>
                          {scholar.houseId}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8" data-testid="no-scholars-message">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No scholars added yet.</p>
                    <p className="text-sm">Click the + button to add a scholar.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scholar Details */}
          <div className="lg:col-span-2">
            {selectedScholarId && scholarDetail ? (
              <div className="space-y-6">
                {/* Scholar Overview */}
                <Card data-testid="scholar-overview-card">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                      <Star className="mr-2 h-5 w-5 text-yellow-500" />
                      {scholarDetail.scholar.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg" data-testid="academic-points">
                        <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-600">
                          {scholarDetail.scholar.academicPoints}
                        </p>
                        <p className="text-sm text-gray-600">Academic Points</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg" data-testid="attendance-points">
                        <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-600">
                          {scholarDetail.scholar.attendancePoints}
                        </p>
                        <p className="text-sm text-gray-600">Attendance Points</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg" data-testid="behavior-points">
                        <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-purple-600">
                          {scholarDetail.scholar.behaviorPoints}
                        </p>
                        <p className="text-sm text-gray-600">Behavior Points</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* PBIS Recognition */}
                <Card data-testid="pbis-recognition-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                      <Award className="mr-2 h-5 w-5 text-green-600" />
                      MUSTANG Recognition
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {scholarDetail.pbisEntries.length > 0 ? (
                        scholarDetail.pbisEntries.map((entry, index) => (
                          <div 
                            key={entry.id}
                            className="p-4 bg-green-50 rounded-lg border border-green-200"
                            data-testid={`pbis-entry-${index}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <span className="text-lg mr-2">
                                    {getTraitIcon(entry.mustangTrait)}
                                  </span>
                                  <h4 className="font-medium text-gray-900" data-testid={`pbis-trait-${index}`}>
                                    {entry.mustangTrait}
                                  </h4>
                                  <Badge className="ml-2 bg-green-600 text-white" data-testid={`pbis-points-${index}`}>
                                    +{entry.points}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2" data-testid={`pbis-teacher-${index}`}>
                                  Recognized by: {entry.teacherName}
                                </p>
                                {entry.reason && (
                                  <p className="text-sm text-gray-700" data-testid={`pbis-reason-${index}`}>
                                    "{entry.reason}"
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-gray-500" data-testid={`pbis-date-${index}`}>
                                {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'Today'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-8" data-testid="no-pbis-entries">
                          <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p>No MUSTANG recognition yet.</p>
                          <p className="text-sm">Recognition will appear here when teachers award points.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Teacher Messages */}
                <Card data-testid="teacher-messages-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                      <MessageCircle className="mr-2 h-5 w-5 text-blue-600" />
                      Messages from Teachers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-2">📨 Communication Hub</h4>
                        <p className="text-sm text-blue-700 mb-3">
                          Teachers can send you detailed messages about {scholarDetail.scholar.name}'s progress, behavior, and achievements. 
                          You can reply directly through this system, and teachers will receive email notifications.
                        </p>
                        <div className="flex items-center text-xs text-blue-600">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Messages will appear here when teachers send them</span>
                        </div>
                      </div>
                      
                      <div className="text-center text-gray-500 py-6">
                        <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm">When teachers send messages about {scholarDetail.scholar.name}, they will appear here.</p>
                        <p className="text-xs text-blue-600 mt-2">
                          ✓ Teachers can send messages of any length (minimum 10 characters)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-96 flex items-center justify-center" data-testid="select-scholar-prompt">
                <CardContent className="text-center">
                  <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Scholar
                  </h3>
                  <p className="text-gray-600">
                    Choose a scholar from the list to view their progress and achievements.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeView === 'messages' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <MessageCircle className="mr-2 h-5 w-5 text-blue-600" />
                Message Inbox
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message: any) => (
                    <div
                      key={message.id}
                      className={`p-4 border rounded-lg ${
                        message.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                      }`}
                      data-testid={`message-${message.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{message.subject}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <span>From: <strong>{message.teacher_name}</strong></span>
                            <span>•</span>
                            <span>About: <strong>{message.scholar_name}</strong></span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!message.is_read && (
                            <Badge variant="default" className="bg-blue-600 text-white">
                              New
                            </Badge>
                          )}
                          <div className="text-xs text-gray-500">
                            {message.created_at ? new Date(message.created_at).toLocaleDateString() : 'Today'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded border-l-4 border-blue-500 mb-3">
                        <p className="text-gray-700">{message.message}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={message.sender_type === 'parent' ? 'default' : 'secondary'}>
                            {message.sender_type === 'parent' ? 'Sent by you' : 'From teacher'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Priority: {message.priority}
                          </Badge>
                        </div>
                        
                        <Button size="sm" variant="outline" className="text-blue-600">
                          <Send className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">💬 Communication Features</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>✓ Direct messaging with your child's teachers</p>
                      <p>✓ Real-time notifications when messages arrive</p>
                      <p>✓ Messages are stored securely in the database</p>
                      <p>✓ Teachers receive email notifications of your messages</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 text-gray-300 mx-auto mb-4">
                    <MessageCircle className="h-full w-full" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                  <p className="text-gray-600 mb-4">
                    Your messages from teachers will appear here when they contact you about your scholars.
                  </p>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 max-w-md mx-auto">
                    <p className="text-sm text-green-700">
                      <strong>✅ Database Active:</strong> Messages are now being stored in the database and will persist across sessions.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reflections Content */}
        {activeView === 'reflections' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Behavioral Reflections
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                View your child's behavioral reflection assignments and responses
              </p>
            </CardHeader>
            <CardContent>
              {reflections.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No reflections assigned yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reflections.map((reflection: any) => (
                    <Card key={reflection.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {reflection.status === 'assigned' && (
                                <AlertCircle className="h-5 w-5 text-yellow-500" />
                              )}
                              {reflection.status === 'submitted' && (
                                <Clock3 className="h-5 w-5 text-blue-500" />
                              )}
                              {reflection.status === 'approved' && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                              <span className="font-medium">{reflection.studentName}</span>
                            </div>
                            <Badge variant={
                              reflection.status === 'assigned' ? 'destructive' :
                              reflection.status === 'submitted' ? 'secondary' :
                              reflection.status === 'approved' ? 'default' : 'outline'
                            }>
                              {reflection.status === 'assigned' ? 'Needs Response' :
                               reflection.status === 'submitted' ? 'Under Review' :
                               reflection.status === 'approved' ? 'Completed' : reflection.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(reflection.assignedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Assignment:</h4>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-md italic">
                              "{reflection.prompt}"
                            </p>
                          </div>
                          
                          {reflection.response && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Student Response:</h4>
                              <p className="text-gray-700 bg-blue-50 p-3 rounded-md">
                                {reflection.response}
                              </p>
                            </div>
                          )}
                          
                          {reflection.teacherFeedback && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Teacher Feedback:</h4>
                              <p className="text-gray-700 bg-green-50 p-3 rounded-md">
                                {reflection.teacherFeedback}
                              </p>
                            </div>
                          )}
                          
                          {reflection.dueDate && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              Due: {new Date(reflection.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}