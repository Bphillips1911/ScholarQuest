import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { QrCode, UserPlus, LogIn, Download, Printer } from "lucide-react";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function TeacherQRAccess() {
  const [loginQR, setLoginQR] = useState<string>("");
  const [signupQR, setSignupQR] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQRCodes = async () => {
    setIsGenerating(true);
    try {
      // Get current domain/host
      const baseUrl = window.location.origin;
      
      // Generate QR codes for both login and signup using separate calls
      const loginResponse = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${baseUrl}/teacher-login`,
          filename: "teacher-login-qr"
        })
      });

      console.log("Login response status:", loginResponse.status);
      console.log("Login response headers:", loginResponse.headers.get('content-type'));

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        console.error("Login QR error:", errorText);
        throw new Error(`Login QR failed: ${loginResponse.status}`);
      }

      const loginData = await loginResponse.json();
      if (loginData.qrCode) setLoginQR(loginData.qrCode);

      // Generate signup QR
      const signupResponse = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${baseUrl}/teacher-signup`,
          filename: "teacher-signup-qr"
        })
      });

      console.log("Signup response status:", signupResponse.status);
      
      if (!signupResponse.ok) {
        const errorText = await signupResponse.text();
        console.error("Signup QR error:", errorText);
        throw new Error(`Signup QR failed: ${signupResponse.status}`);
      }

      const signupData = await signupResponse.json();
      if (signupData.qrCode) setSignupQR(signupData.qrCode);

    } catch (error) {
      console.error("Failed to generate QR codes:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateQRCodes();
  }, []);

  const downloadQR = (qrCode: string, filename: string) => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQR = (qrCode: string, title: string, url: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Teacher ${title} QR Code</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                margin: 0;
              }
              .header {
                margin-bottom: 20px;
              }
              .logo {
                max-height: 80px;
                margin-bottom: 10px;
              }
              .qr-container {
                border: 2px solid #ddd;
                border-radius: 8px;
                padding: 20px;
                margin: 20px auto;
                max-width: 400px;
              }
              .qr-code {
                max-width: 200px;
                height: auto;
                margin: 20px 0;
              }
              .instructions {
                margin-top: 20px;
                padding: 15px;
                background-color: #f5f5f5;
                border-radius: 5px;
                font-size: 14px;
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="${schoolLogoPath}" alt="Bush Hills STEAM Academy" class="logo" />
              <h1>Bush Hills STEAM Academy</h1>
              <h2>Teacher Portal - ${title}</h2>
            </div>
            
            <div class="qr-container">
              <img src="${qrCode}" alt="QR Code for ${title}" class="qr-code" />
              <p><strong>Scan to ${title.toLowerCase()}</strong></p>
              <p style="font-size: 12px; color: #666;">${url}</p>
            </div>

            <div class="instructions">
              <h3>Instructions:</h3>
              <ol style="text-align: left; max-width: 300px; margin: 0 auto;">
                <li>Open your phone's camera app</li>
                <li>Point camera at the QR code above</li>
                <li>Tap the notification that appears</li>
                <li>${title === 'Login' ? 'Sign in with your approved account' : 'Complete the teacher registration form'}</li>
              </ol>
            </div>
            
            <p style="font-size: 12px; color: #888; margin-top: 30px;">
              Generated on ${new Date().toLocaleDateString()}
            </p>
            
            <button class="no-print" onclick="window.print()" style="
              margin-top: 20px; 
              padding: 10px 20px; 
              background-color: #007bff; 
              color: white; 
              border: none; 
              border-radius: 5px; 
              cursor: pointer;
            ">Print This Page</button>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 p-4" data-testid="teacher-qr-access-section">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src={schoolLogoPath} 
            alt="Bush Hills STEAM Academy" 
            className="h-16 w-auto mx-auto mb-4 school-logo-3d"
            data-testid="school-logo"
          />
          <h1 className="text-3xl font-bold school-name-3d mb-2">Teacher Portal Access</h1>
          <p className="text-gray-600 program-title-3d">Quick QR Code Access - Bush Hills STEAM Academy</p>
        </div>

        {/* Navigation */}
        <div className="text-center mb-8">
          <Link href="/teacher-login">
            <Button variant="outline" className="mr-4">
              <LogIn className="mr-2 h-4 w-4" />
              Direct Login
            </Button>
          </Link>
          <Link href="/teacher-signup">
            <Button variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Direct Signup
            </Button>
          </Link>
        </div>

        {/* QR Code Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Login QR Card */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold">
                <LogIn className="h-6 w-6 text-blue-600" />
                Teacher Login QR
              </CardTitle>
              <p className="text-gray-600">For existing approved teachers</p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {isGenerating ? (
                <div className="flex items-center justify-center h-48">
                  <QrCode className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Generating QR code...</span>
                </div>
              ) : loginQR ? (
                <>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                    <img 
                      src={loginQR} 
                      alt="Teacher Login QR Code" 
                      className="w-48 h-48"
                      data-testid="login-qr-image"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Scan to access the teacher login page
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadQR(loginQR, "teacher-login-qr")}
                      data-testid="button-download-login-qr"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printQR(loginQR, "Login", `${window.location.origin}/teacher-login`)}
                      data-testid="button-print-login-qr"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center p-8">
                  <p className="text-red-600">Failed to generate QR code</p>
                  <Button onClick={generateQRCodes} className="mt-2">
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signup QR Card */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold">
                <UserPlus className="h-6 w-6 text-green-600" />
                Teacher Signup QR
              </CardTitle>
              <p className="text-gray-600">For new teacher registration</p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {isGenerating ? (
                <div className="flex items-center justify-center h-48">
                  <QrCode className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Generating QR code...</span>
                </div>
              ) : signupQR ? (
                <>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                    <img 
                      src={signupQR} 
                      alt="Teacher Signup QR Code" 
                      className="w-48 h-48"
                      data-testid="signup-qr-image"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Scan to access the teacher registration page
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadQR(signupQR, "teacher-signup-qr")}
                      data-testid="button-download-signup-qr"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printQR(signupQR, "Signup", `${window.location.origin}/teacher-signup`)}
                      data-testid="button-print-signup-qr"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center p-8">
                  <p className="text-red-600">Failed to generate QR code</p>
                  <Button onClick={generateQRCodes} className="mt-2">
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">How to Use QR Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">For Mobile Devices:</h4>
                <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
                  <li>Open your phone's camera app</li>
                  <li>Point the camera at the QR code</li>
                  <li>Tap the notification that appears</li>
                  <li>Complete login or registration</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">For Distribution:</h4>
                <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
                  <li>Download QR codes as PNG images</li>
                  <li>Print QR codes with instructions</li>
                  <li>Share in faculty meetings or orientation</li>
                  <li>Post in teacher lounges or bulletin boards</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Note */}
        <Alert className="mt-6">
          <QrCode className="h-4 w-4" />
          <AlertDescription>
            <strong>Administrator Note:</strong> These QR codes provide direct access to the teacher portal pages. 
            The signup QR leads to registration (requires admin approval), while the login QR is for already approved teachers.
            You can print and distribute these codes during faculty meetings or orientation sessions.
          </AlertDescription>
        </Alert>
      </div>
    </section>
  );
}