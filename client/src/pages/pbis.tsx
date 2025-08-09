import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Award, Users, Star, Camera, Trash2, Upload } from "lucide-react";
import type { Scholar, PbisEntry, PbisPhoto, InsertPbisEntry } from "@shared/schema";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

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
  ],
  "Administration": [
    { name: "Dr. Phillips", subject: "Principal" },
    { name: "Dr. Stewart", subject: "Assistant Principal" },
  ],
  "Counselor": [
    { name: "Counselor Kirkland", subject: "School Counselor" },
  ],
};

const mustangTraits = [
  { value: "Motivated", description: "Shows drive and determination" },
  { value: "Understanding", description: "Demonstrates empathy and compassion" },
  { value: "Safe", description: "Makes responsible choices" },
  { value: "Teamwork", description: "Works well with others" },
  { value: "Accountable", description: "Takes responsibility for actions" },
  { value: "Noble", description: "Shows integrity and honor" },
  { value: "Growth", description: "Embraces learning and improvement" },
];

interface PbisFormProps {
  teacherName: string;
  teacherRole: string;
  subject: string;
}

function PbisForm({ teacherName, teacherRole, subject }: PbisFormProps) {
  const [selectedScholar, setSelectedScholar] = useState("");
  const [selectedTrait, setSelectedTrait] = useState("");
  const [points, setPoints] = useState("1");
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  const { data: scholars } = useQuery<Scholar[]>({
    queryKey: ["/api/scholars"],
  });

  const addPbisMutation = useMutation({
    mutationFn: async (data: InsertPbisEntry) => {
      const response = await apiRequest("POST", "/api/pbis", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "PBIS Award Added",
        description: `Scholar has been recognized for demonstrating MUSTANG traits.`,
      });
      setSelectedScholar("");
      setSelectedTrait("");
      setPoints("1");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/pbis"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add PBIS award. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedScholar || !selectedTrait) {
      toast({
        title: "Missing Information",
        description: "Please select a scholar and MUSTANG trait.",
        variant: "destructive",
      });
      return;
    }

    const pointsNum = parseInt(points);
    if (pointsNum < 1 || pointsNum > 10) {
      toast({
        title: "Invalid Points",
        description: "Points must be between 1 and 10.",
        variant: "destructive",
      });
      return;
    }

    addPbisMutation.mutate({
      scholarId: selectedScholar,
      teacherName,
      teacherRole: teacherRole as "6th Grade" | "7th Grade" | "8th Grade" | "Unified Arts" | "Administration" | "Counselor",
      mustangTrait: selectedTrait as "Motivated" | "Understanding" | "Safe" | "Teamwork" | "Accountable" | "Noble" | "Growth",
      points: pointsNum,
      reason: reason || undefined,
    });
  };

  return (
    <Card className="bg-white border-green-200" data-testid={`pbis-form-${teacherName.replace(/\s+/g, '-').toLowerCase()}`}>
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
          <Award className="mr-2 h-5 w-5 text-green-600" />
          {teacherName} - {subject}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scholar-select" className="text-sm font-medium text-gray-700 mb-2">
                Select Scholar
              </Label>
              <Select value={selectedScholar} onValueChange={setSelectedScholar} data-testid="select-scholar">
                <SelectTrigger>
                  <SelectValue placeholder="Choose a scholar..." />
                </SelectTrigger>
                <SelectContent>
                  {scholars?.map((scholar) => (
                    <SelectItem key={scholar.id} value={scholar.id} data-testid={`option-scholar-${scholar.id}`}>
                      {scholar.name} (ID: {scholar.studentId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="trait-select" className="text-sm font-medium text-gray-700 mb-2">
                MUSTANG Trait
              </Label>
              <Select value={selectedTrait} onValueChange={setSelectedTrait} data-testid="select-trait">
                <SelectTrigger>
                  <SelectValue placeholder="Select trait..." />
                </SelectTrigger>
                <SelectContent>
                  {mustangTraits.map((trait) => (
                    <SelectItem key={trait.value} value={trait.value} data-testid={`option-trait-${trait.value}`}>
                      <div>
                        <div className="font-medium">{trait.value}</div>
                        <div className="text-xs text-gray-500">{trait.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="points-input" className="text-sm font-medium text-gray-700 mb-2">
                Points (1-10)
              </Label>
              <Input
                type="number"
                placeholder="1"
                min="1"
                max="10"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                data-testid="input-points"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason-input" className="text-sm font-medium text-gray-700 mb-2">
              Specific Example (Optional)
            </Label>
            <Input
              type="text"
              placeholder="e.g., Helped a classmate understand the assignment"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              data-testid="input-reason"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-green-600 text-white hover:bg-green-700"
            disabled={addPbisMutation.isPending}
            data-testid="button-award-pbis"
          >
            {addPbisMutation.isPending ? "Awarding..." : "Award MUSTANG Points"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PhotoUploadTab() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const { toast } = useToast();

  const { data: photos = [] } = useQuery<PbisPhoto[]>({
    queryKey: ["/api/pbis/photos"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/pbis/photos", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Photo Uploaded",
        description: "Photo has been uploaded successfully.",
      });
      setSelectedFile(null);
      setDescription("");
      setUploadedBy("");
      queryClient.invalidateQueries({ queryKey: ["/api/pbis/photos"] });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/pbis/photos/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Photo Deleted",
        description: "Photo has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pbis/photos"] });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !uploadedBy.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a photo and enter your name.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("photo", selectedFile);
    formData.append("description", description);
    formData.append("uploadedBy", uploadedBy);

    uploadMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="bg-white border-blue-200" data-testid="photo-upload-form">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
            <Camera className="mr-2 h-5 w-5 text-blue-600" />
            Upload MUSTANG Moments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="photo-file" className="text-sm font-medium text-gray-700 mb-2">
                Select Photo (Max 5MB)
              </Label>
              <Input
                id="photo-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
                data-testid="input-photo-file"
              />
              {selectedFile && (
                <p className="text-sm text-green-600 mt-1">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="uploaded-by" className="text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </Label>
                <Input
                  id="uploaded-by"
                  type="text"
                  placeholder="e.g., Ms. Brown"
                  value={uploadedBy}
                  onChange={(e) => setUploadedBy(e.target.value)}
                  data-testid="input-uploaded-by"
                />
              </div>

              <div>
                <Label htmlFor="photo-description" className="text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </Label>
                <Input
                  id="photo-description"
                  type="text"
                  placeholder="e.g., Students showing teamwork in science class"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-photo-description"
                />
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !uploadedBy.trim() || uploadMutation.isPending}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
              data-testid="button-upload-photo"
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploadMutation.isPending ? "Uploading..." : "Upload Photo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Photo Gallery */}
      <Card className="bg-white border-gray-200" data-testid="photo-gallery">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
            <Camera className="mr-2 h-5 w-5" />
            MUSTANG Moments Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo, index) => (
                <div key={photo.id} className="bg-gray-50 rounded-lg p-4" data-testid={`photo-item-${index}`}>
                  <div className="aspect-square mb-3 overflow-hidden rounded-lg bg-gray-200">
                    <img
                      src={`/uploads/${photo.filename}`}
                      alt={photo.description || "PBIS Photo"}
                      className="w-full h-full object-cover"
                      data-testid={`photo-image-${index}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900" data-testid={`photo-uploader-${index}`}>
                      By: {photo.uploadedBy}
                    </p>
                    {photo.description && (
                      <p className="text-sm text-gray-600" data-testid={`photo-description-${index}`}>
                        {photo.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500" data-testid={`photo-date-${index}`}>
                        {photo.createdAt ? new Date(photo.createdAt).toLocaleDateString() : 'Today'}
                      </span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(photo.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-photo-${index}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8" data-testid="no-photos-message">
              <Camera className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>No photos uploaded yet.</p>
              <p className="text-sm">Upload your first MUSTANG moment above!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PBIS() {
  const { data: pbisEntries } = useQuery<PbisEntry[]>({
    queryKey: ["/api/pbis"],
  });

  const recentEntries = pbisEntries
    ?.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 10) || [];

  return (
    <section data-testid="pbis-section">
      <Card className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center mb-8">
          <img 
            src={schoolLogoPath} 
            alt="Bush Hills STEAM Academy" 
            className="h-16 w-auto mr-6 school-logo-3d"
            data-testid="pbis-school-logo"
          />
          <div>
            <h2 className="text-3xl font-bold text-gray-900" data-testid="pbis-title">
              PBIS - MUSTANG Recognition
            </h2>
            <p className="text-gray-600">Positive Behavioral Interventions and Supports</p>
            <div className="flex items-center mt-2 text-sm text-green-600">
              <Star className="mr-1 h-4 w-4" />
              <span>Motivated • Understanding • Safe • Teamwork • Accountable • Noble • Growth</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="6th Grade" className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="6th Grade" data-testid="tab-6th-grade">6th Grade</TabsTrigger>
            <TabsTrigger value="7th Grade" data-testid="tab-7th-grade">7th Grade</TabsTrigger>
            <TabsTrigger value="8th Grade" data-testid="tab-8th-grade">8th Grade</TabsTrigger>
            <TabsTrigger value="Unified Arts" data-testid="tab-unified-arts">Unified Arts</TabsTrigger>
            <TabsTrigger value="Administration" data-testid="tab-administration">Administration</TabsTrigger>
            <TabsTrigger value="Counselor" data-testid="tab-counselor">Counselor</TabsTrigger>
            <TabsTrigger value="Photos" data-testid="tab-photos">📷 Photos</TabsTrigger>
          </TabsList>

          {Object.entries(gradeTeachers).map(([grade, teachers]) => (
            <TabsContent key={grade} value={grade} data-testid={`content-${grade.toLowerCase().replace(' ', '-')}`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {teachers.map((teacher) => (
                  <PbisForm
                    key={teacher.name}
                    teacherName={teacher.name}
                    teacherRole={grade}
                    subject={teacher.subject}
                  />
                ))}
              </div>
            </TabsContent>
          ))}

          <TabsContent value="Photos" data-testid="content-photos">
            <PhotoUploadTab />
          </TabsContent>
        </Tabs>

        {/* Recent Activity */}
        <Card className="mt-8 border border-gray-200" data-testid="recent-pbis-activity">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Recent MUSTANG Recognition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentEntries.length > 0 ? (
                recentEntries.map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-green-50"
                    data-testid={`pbis-activity-${index}`}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mr-3">
                        <Star className="text-xs" />
                      </div>
                      <div>
                        <p className="text-sm font-medium" data-testid={`pbis-description-${index}`}>
                          {entry.points} points for {entry.mustangTrait} by {entry.teacherName}
                        </p>
                        <p className="text-xs text-green-600" data-testid={`pbis-reason-${index}`}>
                          {entry.reason || "Demonstrating MUSTANG behavior"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500" data-testid={`pbis-time-${index}`}>
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString() : 'Now'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8" data-testid="no-pbis-activity">
                  No MUSTANG recognition entries yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Card>
    </section>
  );
}