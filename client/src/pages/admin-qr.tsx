import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Download, ArrowLeft, Eye, Key } from "lucide-react";
import { useLocation } from "wouter";
import type { Scholar, House } from "@shared/schema";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function AdminQR() {
  const [, setLocation] = useLocation();
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLocation("/admin-login");
    }
  }, [setLocation]);

  // Fetch scholars data
  const { data: allScholars } = useQuery<Scholar[]>({
    queryKey: ["/api/scholars"],
  });

  // Fetch houses data
  const { data: houses } = useQuery<House[]>({
    queryKey: ["/api/houses"],
  });

  const generateStudentQR = async (scholar: Scholar) => {
    if (!scholar.username) {
      toast({
        title: "No Username",
        description: `${scholar.name} doesn't have login credentials yet.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      // Generate QR code for student login with their username pre-filled
      const loginUrl = `${window.location.origin}/student-login?username=${encodeURIComponent(scholar.username)}`;
      
      const response = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: loginUrl,
          filename: `student-qr-${scholar.username}`
        })
      });

      if (!response.ok) throw new Error("Failed to generate QR code");
      
      const data = await response.json();
      setQrCodes(prev => ({ ...prev, [scholar.id]: data.qrCode }));
      
      toast({
        title: "QR Code Generated",
        description: `QR code created for ${scholar.name}`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Unable to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = (scholar: Scholar) => {
    const qrCode = qrCodes[scholar.id];
    if (!qrCode) return;

    const link = document.createElement('a');
    link.download = `${scholar.name.replace(/\s+/g, '_')}_login_qr.png`;
    link.href = qrCode;
    link.click();
  };

  const generateAllQRCodes = async () => {
    const scholarsWithUsernames = allScholars?.filter(s => s.username) || [];
    if (scholarsWithUsernames.length === 0) {
      toast({
        title: "No Login Credentials",
        description: "No students have login credentials yet.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      for (const scholar of scholarsWithUsernames) {
        await generateStudentQR(scholar);
      }
      toast({
        title: "Bulk Generation Complete",
        description: `Generated QR codes for ${scholarsWithUsernames.length} students`,
      });
    } catch (error) {
      toast({
        title: "Bulk Generation Failed",
        description: "Some QR codes may not have been generated.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const studentsWithCredentials = allScholars?.filter(s => s.username) || [];
  const studentsWithoutCredentials = allScholars?.filter(s => !s.username) || [];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/admin")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Button>
              <img 
                src={schoolLogoPath} 
                alt="Bush Hills STEAM Academy" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Student QR Code Generator
                </h1>
                <p className="text-sm text-gray-600">
                  Generate QR codes for student login access
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <QrCode className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {Object.keys(qrCodes).length}
                    </p>
                    <p className="text-gray-600">QR Codes Generated</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Key className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {studentsWithCredentials.length}
                    </p>
                    <p className="text-gray-600">With Login Credentials</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {studentsWithoutCredentials.length}
                    </p>
                    <p className="text-gray-600">Need Credentials</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Bulk Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  onClick={generateAllQRCodes}
                  disabled={isGenerating || studentsWithCredentials.length === 0}
                  className="flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  {isGenerating ? "Generating..." : `Generate All QR Codes (${studentsWithCredentials.length})`}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Students with Credentials */}
          {studentsWithCredentials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Students with Login Credentials ({studentsWithCredentials.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentsWithCredentials.map((scholar) => {
                    const house = houses?.find(h => h.id === scholar.houseId);
                    const hasQR = qrCodes[scholar.id];
                    
                    return (
                      <div key={scholar.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: house?.color || "#3B82F6" }}
                          ></div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{scholar.name}</h4>
                            <p className="text-sm text-gray-600">
                              ID: {scholar.studentId} • Username: {scholar.username}
                            </p>
                            <p className="text-xs text-gray-500">
                              {house?.name?.replace("House of ", "") || "No House"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {hasQR && (
                            <div className="flex items-center gap-2">
                              <img 
                                src={qrCodes[scholar.id]} 
                                alt={`QR Code for ${scholar.name}`}
                                className="w-12 h-12 border rounded"
                              />
                              <Badge variant="secondary">Generated</Badge>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => generateStudentQR(scholar)}
                              disabled={isGenerating}
                            >
                              <QrCode className="h-4 w-4 mr-1" />
                              {hasQR ? "Regenerate" : "Generate"}
                            </Button>
                            
                            {hasQR && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadQR(scholar)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Students without Credentials */}
          {studentsWithoutCredentials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Students Needing Login Credentials ({studentsWithoutCredentials.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    These students need to be added through the admin portal to automatically generate usernames before QR codes can be created.
                  </p>
                </div>
                <div className="space-y-3">
                  {studentsWithoutCredentials.map((scholar) => {
                    const house = houses?.find(h => h.id === scholar.houseId);
                    
                    return (
                      <div key={scholar.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: house?.color || "#3B82F6" }}
                          ></div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{scholar.name}</h4>
                            <p className="text-sm text-gray-600">
                              ID: {scholar.studentId}
                            </p>
                            <p className="text-xs text-gray-500">
                              {house?.name?.replace("House of ", "") || "No House"}
                            </p>
                          </div>
                        </div>
                        
                        <Badge variant="outline">No Credentials</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}