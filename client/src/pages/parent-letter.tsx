import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Printer, CheckCircle, Book, Calendar, Heart } from "lucide-react";

export default function ParentLetter() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long", 
    day: "numeric"
  });

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    const subject = "House Character Development Program Information";
    const body = "Please find attached information about our House Character Development Program.";
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <section data-testid="parent-letter-section">
      <Card className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <Mail className="text-blue-600 text-2xl" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900" data-testid="parent-letter-title">Letter to Parents</h2>
            <p className="text-gray-600" data-testid="parent-letter-subtitle">
              Information about our House Character Development Program
            </p>
          </div>
        </div>

        <div className="prose max-w-none">
          <div className="bg-gray-50 rounded-lg p-6 mb-6" data-testid="letter-header">
            <p className="text-sm text-gray-600 mb-2">
              Date: <span data-testid="letter-date">{currentDate}</span>
            </p>
            <p className="text-sm text-gray-600">From: Middle School Administration</p>
          </div>

          <div className="space-y-6 text-gray-800 leading-relaxed" data-testid="letter-content">
            <p className="text-lg font-medium text-gray-900">Dear Parents and Guardians,</p>
            
            <p>
              We are excited to introduce our innovative House Character Development Program, designed to foster 
              community, character, and academic excellence among our middle school students.
            </p>
            
            <Card className="bg-blue-50 p-6" data-testid="program-overview">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Program Overview</h3>
              <p>
                Your child has been placed into one of five distinguished houses: Franklin, Courie, West, 
                Blackwell, or Berruguete. Each house represents unique values and characteristics that 
                contribute to our school's diverse community.
              </p>
            </Card>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">How the Point System Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="point-system-grid">
                <Card className="bg-green-50 p-4" data-testid="academic-points-info">
                  <h4 className="font-bold text-green-700 mb-2">
                    <Book className="inline mr-2" />
                    Academic Excellence
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Outstanding test scores</li>
                    <li>• Completed assignments</li>
                    <li>• Academic improvement</li>
                    <li>• Participation in class</li>
                  </ul>
                </Card>
                
                <Card className="bg-blue-50 p-4" data-testid="attendance-points-info">
                  <h4 className="font-bold text-blue-700 mb-2">
                    <Calendar className="inline mr-2" />
                    Perfect Attendance
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Daily attendance</li>
                    <li>• Punctuality to class</li>
                    <li>• Consistent presence</li>
                    <li>• Engagement in learning</li>
                  </ul>
                </Card>

                <Card className="bg-purple-50 p-4" data-testid="behavior-points-info">
                  <h4 className="font-bold text-purple-700 mb-2">
                    <Heart className="inline mr-2" />
                    Character Behavior
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Respectful interactions</li>
                    <li>• Helping others</li>
                    <li>• Following school rules</li>
                    <li>• Leadership qualities</li>
                  </ul>
                </Card>
              </div>
            </div>

            <Card className="bg-yellow-50 p-6" data-testid="benefits-section">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Benefits for Your Child</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="text-green-500 mr-3 mt-1 h-4 w-4" />
                  <span><strong>Sense of Belonging:</strong> Students develop connections and friendships within their house community</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-500 mr-3 mt-1 h-4 w-4" />
                  <span><strong>Character Development:</strong> Focus on core values that build strong character traits</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-500 mr-3 mt-1 h-4 w-4" />
                  <span><strong>Academic Motivation:</strong> Positive competition encourages academic excellence</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-green-500 mr-3 mt-1 h-4 w-4" />
                  <span><strong>Recognition System:</strong> Regular celebration of achievements and positive behaviors</span>
                </li>
              </ul>
            </Card>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">How You Can Support Your Child</h3>
              <Card className="bg-gray-50 p-6" data-testid="support-section">
                <ul className="space-y-3 text-gray-700">
                  <li>• Ask about their house activities and point earnings regularly</li>
                  <li>• Celebrate their achievements in academics, attendance, and behavior</li>
                  <li>• Reinforce the house values at home</li>
                  <li>• Encourage positive peer relationships within their house community</li>
                  <li>• Support consistent school attendance and punctuality</li>
                </ul>
              </Card>
            </div>

            <p>
              We believe this program will provide your child with valuable opportunities for growth, 
              leadership, and community engagement. Thank you for your continued support of our school's 
              mission to develop well-rounded, character-driven students.
            </p>

            <div className="border-t pt-6" data-testid="letter-signature">
              <p className="font-medium text-gray-900">Sincerely,</p>
              <p className="text-gray-700 mt-2">The Middle School Administration Team</p>
              <div className="mt-6 text-sm text-gray-600" data-testid="contact-info">
                <p><strong>Contact Information:</strong></p>
                <p>Phone: <span data-testid="school-phone">(555) 123-4567</span></p>
                <p>Email: <span data-testid="school-email">houses@middleschool.edu</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8 space-x-4" data-testid="letter-actions">
          <Button 
            onClick={handlePrint}
            className="bg-blue-600 text-white hover:bg-blue-700"
            data-testid="button-print-letter"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Letter
          </Button>
          <Button 
            onClick={handleEmail}
            className="bg-green-600 text-white hover:bg-green-700"
            data-testid="button-email-letter"
          >
            <Mail className="mr-2 h-4 w-4" />
            Email to Parents
          </Button>
        </div>
      </Card>
    </section>
  );
}
