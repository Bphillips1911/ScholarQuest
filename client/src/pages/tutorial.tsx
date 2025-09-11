import logoPath from "@assets/_BHSA Mustang 1_1754780382943.png";
import thumbnailPath from "@assets/generated_images/PBIS_app_tutorial_thumbnail_3d985a18.png";

export default function Tutorial() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-12">
            <img 
              src={logoPath} 
              alt="Bush Hills STEAM Academy Mustang Logo" 
              className="h-32 w-auto mx-auto mb-6 drop-shadow-lg"
            />
            <h1 className="text-4xl font-bold text-blue-600 mb-4">Bush Hills STEAM Academy</h1>
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">PBIS House of Champions - Interactive Tutorial</h2>
            <p className="text-xl text-gray-600">Complete guide to using our character development platform</p>
            <img 
              src={thumbnailPath} 
              alt="Tutorial Thumbnail" 
              className="max-w-full rounded-xl shadow-lg mt-6"
            />
          </div>

          {/* Live Demo Access */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center">
              🎯 Live Demo Access
            </h2>
            <p className="text-gray-700 mb-6">
              The application is currently running and ready for demonstration. Access the live system using the credentials below:
            </p>
            
            {/* Student Credentials */}
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">👨‍🎓 Student Login Demo</h3>
              <div className="bg-white p-3 rounded border-l-4 border-blue-500 font-mono">
                <strong>Username:</strong> bh6001sarah<br/>
                <strong>Password:</strong> student123
              </div>
              <p className="text-sm text-green-700 mt-2">
                <em>Note: Also works with usernames: bh7002michael, bh8003emma, bh6004david, bh7005olivia</em>
              </p>
            </div>

            {/* Admin Credentials */}
            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">👨‍💼 Administrator Access</h3>
              <div className="bg-white p-3 rounded border-l-4 border-purple-500 font-mono text-sm">
                <strong>Principal:</strong> dr.phillips@bhsteam.edu<br/>
                <strong>Assistant Principal:</strong> dr.stewart@bhsteam.edu<br/>
                <strong>Counselor:</strong> sharon.blanding@bhsteam.edu<br/>
                <strong>Password:</strong> BHSAAdmin2025!
              </div>
            </div>
          </div>

          {/* Tutorial Walkthrough */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📚 Tutorial Walkthrough</h2>
            
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-5 border border-gray-200">
                <h3 className="text-lg font-semibold text-green-600 mb-2">Step 1: Main Dashboard Overview</h3>
                <p className="text-gray-700">
                  Start at the main page to see the new title: <strong>"Bush Hills STEAM Academy PBIS House of Champions"</strong>
                </p>
                <p className="text-gray-700">Explore the five houses: Franklin, Tesla, Curie, Nobel, and Lovelace</p>
              </div>

              <div className="bg-white rounded-lg p-5 border border-gray-200">
                <h3 className="text-lg font-semibold text-green-600 mb-2">Step 2: Student Experience</h3>
                <p className="text-gray-700 mb-2">Click "Student Login" and use the demo credentials above</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>View personal dashboard with house information</li>
                  <li>See individual points (Academic, Attendance, Behavior)</li>
                  <li>Review PBIS recognition and MUSTANG trait awards</li>
                  <li>Track achievement history</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-5 border border-gray-200">
                <h3 className="text-lg font-semibold text-green-600 mb-2">Step 3: Administrator Functions</h3>
                <p className="text-gray-700 mb-2">Login as administrator to access full management features</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Student management and house sorting</li>
                  <li>PBIS point tracking and awards</li>
                  <li>Generate QR codes for student access</li>
                  <li>Export student data (CSV/Excel)</li>
                  <li>Email notification settings</li>
                  <li>Teacher registration management</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-5 border border-gray-200">
                <h3 className="text-lg font-semibold text-green-600 mb-2">Step 4: QR Code System</h3>
                <p className="text-gray-700">
                  From the admin panel, generate QR codes that allow students quick mobile access to check their points and achievements
                </p>
              </div>
            </div>
          </div>

          {/* MUSTANG Traits */}
          <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">🏆 MUSTANG Traits - Character Development Core</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-white/20 backdrop-blur rounded p-3"><strong>M</strong> - Make good choices</div>
              <div className="bg-white/20 backdrop-blur rounded p-3"><strong>U</strong> - Use kind words</div>
              <div className="bg-white/20 backdrop-blur rounded p-3"><strong>S</strong> - Show school pride</div>
              <div className="bg-white/20 backdrop-blur rounded p-3"><strong>T</strong> - Tolerant of others</div>
              <div className="bg-white/20 backdrop-blur rounded p-3"><strong>A</strong> - Aim for excellence</div>
              <div className="bg-white/20 backdrop-blur rounded p-3"><strong>N</strong> - Need to be responsible</div>
              <div className="bg-white/20 backdrop-blur rounded p-3"><strong>G</strong> - Give 100% everyday</div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h4 className="text-lg font-semibold text-purple-600 mb-2">🏠 House System</h4>
              <p className="text-gray-700">Students are assigned to one of five houses, earning points through academic achievement, attendance, and positive behavior.</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h4 className="text-lg font-semibold text-purple-600 mb-2">⭐ PBIS Recognition</h4>
              <p className="text-gray-700">Teachers can award MUSTANG trait recognition with detailed reasons, automatically notifying parents via email.</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h4 className="text-lg font-semibold text-purple-600 mb-2">💬 Parent Communication</h4>
              <p className="text-gray-700">Bi-directional messaging system between parents and teachers with real-time email notifications.</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h4 className="text-lg font-semibold text-purple-600 mb-2">📱 Mobile Access</h4>
              <p className="text-gray-700">QR code system allows students to quickly access their dashboard and check points on mobile devices.</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h4 className="text-lg font-semibold text-purple-600 mb-2">📊 Data Export</h4>
              <p className="text-gray-700">Comprehensive reporting with CSV and Excel export capabilities for administrators.</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h4 className="text-lg font-semibold text-purple-600 mb-2">🔔 Email Notifications</h4>
              <p className="text-gray-700">Automatic email alerts for PBIS recognition, registrations, and important updates.</p>
            </div>
          </div>

          {/* Video Production Section */}
          <div className="bg-gray-800 text-white rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">🎬 Video Tutorial Production</h3>
            <p className="mb-4">A complete video tutorial script has been prepared covering all features and user types. The tutorial includes:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>9-minute comprehensive walkthrough</li>
              <li>Live demonstrations with actual login credentials</li>
              <li>Coverage of all user types (Students, Teachers, Parents, Administrators)</li>
              <li>Mobile and QR code functionality showcase</li>
              <li>Email notification system demonstration</li>
            </ul>
            <p className="mt-4 font-semibold">Tutorial script and production notes are available in the project files.</p>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">🚀 Next Steps</h2>
            <p className="text-gray-700 mb-4">To create the actual video tutorial:</p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>Use the detailed script provided in <code className="bg-gray-200 px-2 py-1 rounded">tutorial-script.md</code></li>
              <li>Record screen captures using the live demo with provided credentials</li>
              <li>Follow the 9-section format for comprehensive coverage</li>
              <li>Include the professional thumbnail generated for the video</li>
            </ol>
          </div>

        </div>
      </div>
    </div>
  );
}