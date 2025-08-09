import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download, QrCode, Mail, Phone, Users } from "lucide-react";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

export default function ParentLetter() {
  const { data: qrData } = useQuery({
    queryKey: ["/api/parent/qr-code"],
    queryFn: async () => {
      const response = await fetch("/api/parent/qr-code");
      if (!response.ok) throw new Error("Failed to generate QR code");
      return response.json();
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (qrData?.qrCode) {
      const link = document.createElement('a');
      link.href = qrData.qrCode;
      link.download = 'BHSA-Parent-Portal-QR.png';
      link.click();
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 p-4 print:bg-white print:p-0" data-testid="parent-letter-section">
      <div className="max-w-4xl mx-auto">
        {/* Print/Download Controls */}
        <div className="mb-6 flex justify-end gap-2 print:hidden">
          <Button onClick={handleDownload} variant="outline" data-testid="button-download-qr">
            <Download className="mr-2 h-4 w-4" />
            Download QR Code
          </Button>
          <Button onClick={handlePrint} className="bg-blue-600 text-white hover:bg-blue-700" data-testid="button-print-letter">
            <Printer className="mr-2 h-4 w-4" />
            Print Letter
          </Button>
        </div>

        {/* Letter Content */}
        <Card className="bg-white shadow-lg print:shadow-none print:border-none">
          <CardHeader className="text-center border-b print:border-b-2">
            <div className="flex justify-center mb-4">
              <img 
                src={schoolLogoPath} 
                alt="Bush Hills STEAM Academy" 
                className="h-20 w-auto"
                data-testid="letter-school-logo"
              />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2" data-testid="letter-title">
              Bush Hills STEAM Academy
            </CardTitle>
            <p className="text-lg text-gray-600">
              House Character Development Program - Parent Portal
            </p>
          </CardHeader>
          
          <CardContent className="p-8">
            <div className="space-y-6 text-gray-800 leading-relaxed">
              <div>
                <p className="text-lg font-medium mb-4">Dear Bush Hills STEAM Academy Families,</p>
                
                <p className="mb-4">
                  We are excited to introduce our new <strong>Parent Portal</strong> for the House Character Development Program! 
                  This digital platform will allow you to stay connected with your child's academic progress, character development, 
                  and MUSTANG recognition in real-time.
                </p>

                <p className="mb-4">
                  Through the Parent Portal, you will be able to:
                </p>

                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>View your child's academic, attendance, and behavior points</li>
                  <li>See detailed MUSTANG trait recognition from teachers</li>
                  <li>Track your child's house standings and achievements</li>
                  <li>Read specific comments and reasons for point awards</li>
                  <li>Stay updated on your child's character development journey</li>
                </ul>

                <div className="bg-blue-50 p-6 rounded-lg mb-6 border border-blue-200">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                    <QrCode className="mr-2 h-5 w-5" />
                    Getting Started - Scan to Register
                  </h3>
                  
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-shrink-0">
                      {qrData?.qrCode ? (
                        <img 
                          src={qrData.qrCode} 
                          alt="QR Code for Parent Portal Registration"
                          className="w-32 h-32 border-2 border-blue-300 rounded-lg"
                          data-testid="qr-code-image"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-200 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                          <QrCode className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-blue-800 font-medium mb-2">
                        Scan this QR code with your phone's camera to access the registration page
                      </p>
                      <p className="text-sm text-blue-700 mb-3">
                        Or visit: <span className="font-mono bg-white px-2 py-1 rounded border">
                          {qrData?.url || "Loading..."}
                        </span>
                      </p>
                      <div className="text-sm text-blue-700">
                        <strong>You will need:</strong>
                        <ul className="list-disc pl-4 mt-1">
                          <li>Your email address</li>
                          <li>Your child's Student ID (found on report cards and school communications)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg mb-6 border border-green-200">
                  <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    About Our MUSTANG Values
                  </h3>
                  <p className="text-green-800 mb-3">
                    The House Character Development Program focuses on recognizing students who demonstrate our core MUSTANG traits:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
                    <div><strong>M</strong> - Motivated</div>
                    <div><strong>U</strong> - Understanding</div>
                    <div><strong>S</strong> - Safe</div>
                    <div><strong>T</strong> - Teamwork</div>
                    <div><strong>A</strong> - Accountable</div>
                    <div><strong>N</strong> - Noble</div>
                    <div><strong>G</strong> - Growth</div>
                  </div>
                </div>

                <p className="mb-4">
                  We believe that strong home-school partnerships are essential for student success. This portal represents 
                  our commitment to keeping you informed and engaged in your child's educational journey at Bush Hills STEAM Academy.
                </p>

                <p className="mb-6">
                  If you have any questions about the Parent Portal or need assistance with registration, please don't hesitate to contact us.
                </p>

                <div className="border-t pt-6 text-center">
                  <p className="font-medium mb-2">Sincerely,</p>
                  <p className="text-lg font-bold">Bush Hills STEAM Academy Administration</p>
                  
                  <div className="mt-6 flex flex-col md:flex-row justify-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center justify-center">
                      <Phone className="mr-2 h-4 w-4" />
                      <span>Phone: (555) 123-4567</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Email: info@bushillssteam.edu</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:border-b-2 { border-bottom: 2px solid #000 !important; }
        }
      `}</style>
    </section>
  );
}