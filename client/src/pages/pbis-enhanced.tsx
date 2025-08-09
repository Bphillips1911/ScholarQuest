import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Award, Users, Star, Camera, Trash2, Upload, GraduationCap, CheckCircle, UserCheck, Calendar, BookOpen, Heart } from "lucide-react";
import type { Scholar, PbisEntry, PbisPhoto, InsertPbisEntry } from "@shared/schema";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

// PBIS Categories and Subcategories
const pbisCategories = {
  attendance: {
    label: "Attendance",
    icon: Calendar,
    color: "bg-green-500",
    subcategories: [
      { value: "perfect_attendance_week", label: "Perfect Attendance (1 Week)", points: 2 },
      { value: "perfect_attendance_month", label: "Perfect Attendance (1 Month)", points: 5 },
      { value: "on_time_daily", label: "On Time to Class Daily", points: 1 },
      { value: "improved_attendance", label: "Improved Attendance", points: 3 },
      { value: "returned_after_absence", label: "Returned Promptly After Absence", points: 1 },
      { value: "perfect_attendance_semester", label: "Perfect Attendance (Semester)", points: 10 }
    ]
  },
  behavior: {
    label: "Behavior",
    icon: Heart,
    color: "bg-blue-500",
    subcategories: [
      { value: "helping_others", label: "Helping Others", points: 2 },
      { value: "positive_attitude", label: "Positive Attitude", points: 1 },
      { value: "following_directions", label: "Following Directions", points: 1 },
      { value: "respectful_communication", label: "Respectful Communication", points: 2 },
      { value: "leadership_example", label: "Leadership Example", points: 3 },
      { value: "conflict_resolution", label: "Conflict Resolution", points: 3 },
      { value: "kindness_shown", label: "Kindness Shown to Peers", points: 2 },
      { value: "school_pride", label: "Showing School Pride", points: 1 },
      { value: "community_service", label: "Community Service", points: 5 }
    ]
  },
  academic: {
    label: "Academic",
    icon: BookOpen,
    color: "bg-purple-500",
    subcategories: [
      { value: "assignment_completed", label: "Assignment Completed on Time", points: 1 },
      { value: "extra_credit", label: "Extra Credit Work", points: 2 },
      { value: "improved_grades", label: "Improved Test/Quiz Grade", points: 3 },
      { value: "class_participation", label: "Outstanding Class Participation", points: 2 },
      { value: "project_excellence", label: "Excellent Project Work", points: 3 },
      { value: "helping_classmates", label: "Helping Classmates Learn", points: 2 },
      { value: "reading_goal", label: "Meeting Reading Goals", points: 2 },
      { value: "homework_streak", label: "Homework Completion Streak", points: 3 },
      { value: "academic_improvement", label: "Academic Improvement", points: 5 }
    ]
  },
  recognition: {
    label: "Universal Positive Characteristics",
    icon: Star,
    color: "bg-yellow-500",
    subcategories: [
      { value: "respect", label: "Respect", points: 2 },
      { value: "integrity", label: "Integrity", points: 3 },
      { value: "responsibility", label: "Responsibility", points: 2 },
      { value: "honesty", label: "Honesty", points: 3 },
      { value: "courteous", label: "Courteous", points: 2 },
      { value: "compassionate", label: "Compassionate", points: 2 },
      { value: "self_motivated", label: "Self-Motivated", points: 3 },
      { value: "humble", label: "Humble", points: 2 },
      { value: "kind", label: "Kind", points: 2 },
      { value: "optimistic", label: "Optimistic", points: 2 },
      { value: "grateful", label: "Grateful", points: 2 },
      { value: "accountable", label: "Accountable", points: 3 }
    ]
  }
};

const mustangTraits = [
  { value: "Make good choices", label: "M - Make good choices", color: "bg-red-500" },
  { value: "Use kind words", label: "U - Use kind words", color: "bg-orange-500" },
  { value: "Show school pride", label: "S - Show school pride", color: "bg-yellow-500" },
  { value: "Tolerant of others", label: "T - Tolerant of others", color: "bg-green-500" },
  { value: "Aim for excellence", label: "A - Aim for excellence", color: "bg-blue-500" },
  { value: "Need to be responsible", label: "N - Need to be responsible", color: "bg-indigo-500" },
  { value: "Give 100% everyday", label: "G - Give 100% everyday", color: "bg-purple-500" }
];

const gradeTeachers = {
  "6th Grade": [
    { name: "Ms. Buford", subject: "6th Grade Science" },
    { name: "Ms. Lewis", subject: "6th Grade Math" },
    { name: "Ms. Brown", subject: "6th Grade ELA" },
    { name: "Ms. Eatmon", subject: "6th Grade Social Studies" },
    { name: "Mrs. Gowdy", subject: "6th Grade Special Education" },
  ],
  "7th Grade": [
    { name: "Ms. Adefiwitan", subject: "7th Grade ELA" },
    { name: "Mrs. Ledlow", subject: "7th Grade Math" },
    { name: "Ms. Patten", subject: "7th Grade Science" },
    { name: "Ms. Wilson", subject: "7th Grade Social Studies" },
    { name: "Mr. Smith", subject: "7th Grade Special Education" },
  ],
  "8th Grade": [
    { name: "Ms. Jiles", subject: "8th Grade ELA" },
    { name: "Mr. Powell", subject: "8th Grade Social Studies" },
    { name: "Ms. Barnes", subject: "8th Grade Math" },
    { name: "Ms. Curry", subject: "8th Grade Science" },
    { name: "Ms. Spencer", subject: "8th Grade Special Education" },
  ],
  "Unified Arts": [
    { name: "Mrs. Gill", subject: "Librarian" },
    { name: "Ms. Edwards", subject: "Computer Science Discovery" },
    { name: "Ms. Riles", subject: "Theater" },
    { name: "Mr. Williams", subject: "STEM Technology" },
    { name: "Mr. Davison", subject: "Physical Education" },
    { name: "Mr. Shepherd", subject: "Physical Education" },
    { name: "Mr. Worley", subject: "Art" },
    { name: "Ms. Radney", subject: "Choir" },
    { name: "Mr. Hill", subject: "Band" },
    { name: "Mrs. Fields-Jones", subject: "Gifted Specialist" }
  ],
  "Administration": [
    { name: "Dr. Phillips", subject: "Principal" },
    { name: "Dr. Stewart", subject: "Assistant Principal" }
  ],
  "Counselor": [
    { name: "Counselor Kirkland", subject: "School Counselor" }
  ]
};

export default function PBIS() {
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [selectedTrait, setSelectedTrait] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoDescription, setPhotoDescription] = useState<string>("");
  const { toast } = useToast();

  // Fetch scholars
  const { data: scholars = [] } = useQuery<Scholar[]>({
    queryKey: ["/api/scholars"],
    retry: false,
  });

  // Fetch PBIS entries
  const { data: pbisEntries = [] } = useQuery<PbisEntry[]>({
    queryKey: ["/api/pbis"],
    retry: false,
  });

  // Fetch PBIS photos
  const { data: pbisPhotos = [] } = useQuery<PbisPhoto[]>({
    queryKey: ["/api/pbis/photos"],
    retry: false,
  });

  // Add PBIS entry mutation
  const addPbisEntryMutation = useMutation({
    mutationFn: async (entryData: InsertPbisEntry) => {
      return await apiRequest("/api/pbis", "POST", entryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pbis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scholars"] });
      toast({
        title: "PBIS Entry Added",
        description: "Student has been awarded MUSTANG points!",
      });
      // Reset form
      setSelectedStudent("");
      setSelectedCategory("");
      setSelectedSubcategory("");
      setSelectedTrait("");
      setCustomReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add PBIS entry",
        variant: "destructive",
      });
    },
  });

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ file, description }: { file: File; description: string }) => {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("description", description);
      formData.append("uploadedBy", selectedTeacher || "Unknown Teacher");

      const response = await fetch("/api/pbis/photos", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pbis/photos"] });
      toast({
        title: "Photo Uploaded",
        description: "MUSTANG moment captured successfully!",
      });
      setPhotoFile(null);
      setPhotoDescription("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      });
    },
  });

  const handleSubmitEntry = () => {
    if (!selectedStudent || !selectedCategory || !selectedSubcategory || !selectedTrait || !selectedTeacher) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const subcategoryData = pbisCategories[selectedCategory as keyof typeof pbisCategories]
      ?.subcategories.find(sub => sub.value === selectedSubcategory);

    if (!subcategoryData) {
      toast({
        title: "Error",
        description: "Invalid subcategory selected",
        variant: "destructive",
      });
      return;
    }

    const entryData: InsertPbisEntry = {
      scholarId: selectedStudent,
      teacherName: selectedTeacher,
      teacherRole: selectedGrade as "6th Grade" | "7th Grade" | "8th Grade" | "Unified Arts" | "Administration" | "Counselor",
      points: subcategoryData.points,
      reason: customReason || subcategoryData.label,
      mustangTrait: selectedTrait as "Make good choices" | "Use kind words" | "Show school pride" | "Tolerant of others" | "Aim for excellence" | "Need to be responsible" | "Give 100% everyday",
      category: selectedCategory as "attendance" | "behavior" | "academic",
      subcategory: selectedSubcategory,
    };

    addPbisEntryMutation.mutate(entryData);
  };

  const handlePhotoUpload = () => {
    if (!photoFile || !photoDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a photo and add a description",
        variant: "destructive",
      });
      return;
    }

    uploadPhotoMutation.mutate({
      file: photoFile,
      description: photoDescription.trim(),
    });
  };

  const getGradeStudents = () => {
    if (!selectedGrade) return [];
    const gradeNumber = selectedGrade.includes("6th") ? 6 : 
                       selectedGrade.includes("7th") ? 7 : 
                       selectedGrade.includes("8th") ? 8 : null;
    
    if (selectedGrade === "Unified Arts" || selectedGrade === "Administration" || selectedGrade === "Counselor") {
      return scholars; // Can see all students
    }
    
    return scholars.filter(scholar => scholar.grade === gradeNumber);
  };

  const getCurrentSubcategories = () => {
    if (!selectedCategory) return [];
    return pbisCategories[selectedCategory as keyof typeof pbisCategories]?.subcategories || [];
  };

  const getSelectedPoints = () => {
    if (!selectedCategory || !selectedSubcategory) return 0;
    const subcategoryData = pbisCategories[selectedCategory as keyof typeof pbisCategories]
      ?.subcategories.find(sub => sub.value === selectedSubcategory);
    return subcategoryData?.points || 0;
  };

  return (
    <section className="min-h-screen bg-gray-50 p-4" data-testid="pbis-section">
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
                  data-testid="pbis-school-logo"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 school-name-3d">PBIS Recognition System</h1>
                  <p className="text-sm text-gray-600 program-title-3d">MUSTANG Traits Recognition Portal</p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="award-points" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="award-points" data-testid="tab-award-points">Award Points</TabsTrigger>
            <TabsTrigger value="recent-entries" data-testid="tab-recent-entries">Recent Entries</TabsTrigger>
            <TabsTrigger value="photo-gallery" data-testid="tab-photo-gallery">Photo Gallery</TabsTrigger>
          </TabsList>

          {/* Award Points Tab */}
          <TabsContent value="award-points">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Award MUSTANG Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Teacher Selection */}
                  <div>
                    <Label htmlFor="grade">Teacher Grade/Role</Label>
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger data-testid="select-grade">
                        <SelectValue placeholder="Select your grade/role" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(gradeTeachers).map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="teacher">Teacher Name</Label>
                    <Select value={selectedTeacher} onValueChange={setSelectedTeacher} disabled={!selectedGrade}>
                      <SelectTrigger data-testid="select-teacher">
                        <SelectValue placeholder="Select your name" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedGrade && gradeTeachers[selectedGrade as keyof typeof gradeTeachers]?.map((teacher) => (
                          <SelectItem key={teacher.name} value={teacher.name}>
                            {teacher.name} - {teacher.subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Student Selection */}
                <div>
                  <Label htmlFor="student">Student</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={!selectedGrade}>
                    <SelectTrigger data-testid="select-student">
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {getGradeStudents().map((scholar) => (
                        <SelectItem key={scholar.id} value={scholar.id}>
                          {scholar.name} (ID: {scholar.studentId}) - Grade {scholar.grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Selection */}
                <div>
                  <Label htmlFor="category">Recognition Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(pbisCategories).map(([key, category]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <category.icon className="h-4 w-4" />
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subcategory Selection */}
                {selectedCategory && (
                  <div>
                    <Label htmlFor="subcategory">Specific Recognition</Label>
                    <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                      <SelectTrigger data-testid="select-subcategory">
                        <SelectValue placeholder="Select specific recognition" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCurrentSubcategories().map((subcategory) => (
                          <SelectItem key={subcategory.value} value={subcategory.value}>
                            <div className="flex justify-between items-center w-full">
                              <span>{subcategory.label}</span>
                              <Badge variant="secondary" className="ml-2">
                                {subcategory.points} pts
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* MUSTANG Trait Selection */}
                <div>
                  <Label htmlFor="trait">MUSTANG Trait</Label>
                  <Select value={selectedTrait} onValueChange={setSelectedTrait}>
                    <SelectTrigger data-testid="select-trait">
                      <SelectValue placeholder="Select MUSTANG trait" />
                    </SelectTrigger>
                    <SelectContent>
                      {mustangTraits.map((trait) => (
                        <SelectItem key={trait.value} value={trait.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${trait.color}`}></div>
                            {trait.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Reason */}
                <div>
                  <Label htmlFor="reason">Additional Comments (Optional)</Label>
                  <Textarea
                    id="reason"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Add any additional details about this recognition..."
                    data-testid="textarea-reason"
                  />
                </div>

                {/* Points Preview */}
                {selectedSubcategory && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Points to Award:</span>
                      <Badge variant="default" className="text-lg">
                        {getSelectedPoints()} MUSTANG Points
                      </Badge>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleSubmitEntry}
                  disabled={addPbisEntryMutation.isPending || !selectedStudent || !selectedCategory || !selectedSubcategory || !selectedTrait}
                  className="w-full"
                  data-testid="button-submit-entry"
                >
                  {addPbisEntryMutation.isPending ? "Awarding Points..." : "Award MUSTANG Points"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Entries Tab */}
          <TabsContent value="recent-entries">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent PBIS Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pbisEntries.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No PBIS entries yet</p>
                  ) : (
                    pbisEntries.slice(0, 20).map((entry) => {
                      const scholar = scholars.find(s => s.id === entry.scholarId);
                      const trait = mustangTraits.find(t => t.value === entry.mustangTrait);
                      const categoryData = pbisCategories[entry.category as keyof typeof pbisCategories];
                      
                      return (
                        <div key={entry.id} className="p-4 border rounded-lg" data-testid={`entry-${entry.id}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{scholar?.name || "Unknown Student"}</h4>
                                <Badge variant="outline">ID: {scholar?.studentId}</Badge>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                {categoryData && <categoryData.icon className="h-4 w-4" />}
                                <span className="text-sm font-medium capitalize">{entry.category}</span>
                                <span className="text-sm text-gray-600">• {entry.reason}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {trait && <div className={`w-3 h-3 rounded-full ${trait.color}`}></div>}
                                <span className="text-sm">{trait?.label}</span>
                                <span className="text-sm text-gray-500">by {entry.teacherName}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-green-500">+{entry.points} pts</Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(entry.createdAt!).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photo Gallery Tab */}
          <TabsContent value="photo-gallery">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Photo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Capture MUSTANG Moments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="photo">Photo</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                      data-testid="input-photo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="photoDescription">Description</Label>
                    <Textarea
                      id="photoDescription"
                      value={photoDescription}
                      onChange={(e) => setPhotoDescription(e.target.value)}
                      placeholder="Describe this MUSTANG moment..."
                      data-testid="textarea-photo-description"
                    />
                  </div>
                  <Button 
                    onClick={handlePhotoUpload}
                    disabled={uploadPhotoMutation.isPending || !photoFile || !photoDescription.trim()}
                    className="w-full"
                    data-testid="button-upload-photo"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadPhotoMutation.isPending ? "Uploading..." : "Upload Photo"}
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Photos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Recent MUSTANG Moments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {pbisPhotos.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No photos uploaded yet</p>
                    ) : (
                      pbisPhotos.map((photo) => (
                        <div key={photo.id} className="border rounded-lg p-4" data-testid={`photo-${photo.id}`}>
                          <img 
                            src={`/uploads/${photo.filename}`} 
                            alt={photo.description || "MUSTANG moment"}
                            className="w-full h-48 object-cover rounded-lg mb-2"
                          />
                          <p className="text-sm font-medium">{photo.description}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded by {photo.uploadedBy} on {new Date(photo.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}