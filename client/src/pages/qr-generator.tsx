import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Download, Eye, Users, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import logoPath from "@assets/_BHSA Mustang 1_1754780382943.png";

export default function QRGenerator() {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Generate QR code on component mount
  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      // Get the current domain/URL for the student login page
      const studentPortalURL = `${window.location.origin}/student-login`;
      
      const options = {
        width: 400,
        margin: 2,
        color: {
          dark: '#1e40af', // Blue color matching the app theme
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M' as const,
      };

      const qrDataURL = await QRCode.toDataURL(studentPortalURL, options);
      setQrCodeDataURL(qrDataURL);

      // Also draw on canvas for download
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, studentPortalURL, options);
      }

      toast({
        title: "QR Code Generated",
        description: "Students can now scan this code to access their portal.",
      });
    } catch (error) {
      console.error("QR Code generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!canvasRef.current) return;

    // Create a larger canvas with branding
    const downloadCanvas = document.createElement('canvas');
    const downloadCtx = downloadCanvas.getContext('2d');
    if (!downloadCtx) return;

    // Set larger size for printing
    const size = 800;
    downloadCanvas.width = size;
    downloadCanvas.height = size + 150; // Extra space for text

    // White background
    downloadCtx.fillStyle = '#ffffff';
    downloadCtx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

    // Draw QR code
    const qrSize = size * 0.8;
    const qrX = (size - qrSize) / 2;
    const qrY = 50;
    downloadCtx.drawImage(canvasRef.current, qrX, qrY, qrSize, qrSize);

    // Add school branding
    downloadCtx.fillStyle = '#1e40af';
    downloadCtx.font = 'bold 32px Arial, sans-serif';
    downloadCtx.textAlign = 'center';
    downloadCtx.fillText('Bush Hills STEAM Academy', size / 2, qrY + qrSize + 50);
    
    downloadCtx.font = 'bold 28px Arial, sans-serif';
    downloadCtx.fillText('Student Portal Access', size / 2, qrY + qrSize + 85);

    downloadCtx.fillStyle = '#6b7280';
    downloadCtx.font = '20px Arial, sans-serif';
    downloadCtx.fillText('Scan to check your house points and PBIS recognition', size / 2, qrY + qrSize + 115);

    // Download the image
    const link = document.createElement('a');
    link.download = `BHSA-Student-Portal-QR-${new Date().toISOString().split('T')[0]}.png`;
    link.href = downloadCanvas.toDataURL();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "QR Code Downloaded",
      description: "The QR code has been saved as a PNG image.",
    });
  };

  const previewStudentLogin = () => {
    window.open('/student-login', '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex justify-center items-center gap-3 mb-4">
          <img 
            src={logoPath} 
            alt="BHSA Mustangs Logo" 
            className="w-12 h-12 object-contain"
          />
          <h1 className="text-3xl font-bold text-gray-900">Student Portal QR Code</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Generate and download a QR code that students can scan with their phones to quickly access the student portal and check their house points and PBIS recognition.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Code Display */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <QrCode className="mr-2 h-5 w-5 text-blue-600" />
              Generated QR Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex flex-col items-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Generating QR code...</p>
              </div>
            ) : qrCodeDataURL ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                  <img 
                    src={qrCodeDataURL} 
                    alt="Student Portal QR Code"
                    className="max-w-full h-auto"
                  />
                </div>
                <div className="flex justify-center space-x-3">
                  <Button onClick={downloadQRCode} className="flex items-center">
                    <Download className="mr-2 h-4 w-4" />
                    Download QR Code
                  </Button>
                  <Button variant="outline" onClick={previewStudentLogin}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Portal
                  </Button>
                </div>
              </div>
            ) : null}
            
            {/* Hidden canvas for download functionality */}
            <canvas 
              ref={canvasRef} 
              style={{ display: 'none' }}
              data-testid="qr-canvas"
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="mr-2 h-5 w-5 text-green-600" />
              How Students Use This QR Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">1</div>
                <div>
                  <p className="font-medium text-gray-900">Scan the QR Code</p>
                  <p className="text-sm text-gray-600">Students use their phone's camera or QR code scanner app to scan this code.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">2</div>
                <div>
                  <p className="font-medium text-gray-900">Access Student Portal</p>
                  <p className="text-sm text-gray-600">The QR code will automatically open the student login page in their web browser.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">3</div>
                <div>
                  <p className="font-medium text-gray-900">Login with Credentials</p>
                  <p className="text-sm text-gray-600">Students enter their unique username and auto-generated password provided by their teacher.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">4</div>
                <div>
                  <p className="font-medium text-gray-900">View Points & Recognition</p>
                  <p className="text-sm text-gray-600">Students can see their house points, PBIS recognition, and MUSTANG trait achievements.</p>
                </div>
              </div>
            </div>

            <Alert className="mt-6">
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Students must have login credentials created by their teacher before they can access the portal. The QR code only provides the login page link.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Usage Tips */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Usage Tips for Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Classroom Display</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Print and display the QR code prominently in your classroom</li>
                  <li>• Post on classroom bulletin board or near the door</li>
                  <li>• Include in weekly newsletters to parents</li>
                  <li>• Share during parent-teacher conferences</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Student Setup</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Create student login credentials through the teacher dashboard</li>
                  <li>• Provide students with their unique username and password</li>
                  <li>• Test the QR code with a few students first</li>
                  <li>• Help students bookmark the portal on their devices</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regenerate Button */}
      <div className="mt-8 text-center">
        <Button 
          variant="outline" 
          onClick={generateQRCode}
          disabled={isGenerating}
          className="w-auto"
        >
          {isGenerating ? "Generating..." : "Regenerate QR Code"}
        </Button>
      </div>
    </div>
  );
}