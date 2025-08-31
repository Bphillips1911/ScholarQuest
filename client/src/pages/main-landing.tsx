import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";
import { GraduationCap, Shield, Users, Trophy, Sparkles, Star, Crown, Zap } from "lucide-react";

interface House {
  id: string;
  name: string;
  color: string;
  icon: string;
  motto: string;
  description: string;
}

const houses: House[] = [
  {
    id: "franklin",
    name: "House of Franklin",
    color: "#1e40af",
    icon: "🔬",
    motto: "Innovation Through Discovery",
    description: "Science • Technology • Research"
  },
  {
    id: "tesla", 
    name: "House of Tesla",
    color: "#7c3aed",
    icon: "⚡",
    motto: "Electrifying Excellence",
    description: "Engineering • Energy • Innovation"
  },
  {
    id: "curie",
    name: "House of Curie", 
    color: "#dc2626",
    icon: "🧪",
    motto: "Pioneering Progress",
    description: "Chemistry • Medicine • Discovery"
  },
  {
    id: "nobel",
    name: "House of Nobel",
    color: "#059669", 
    icon: "🎯",
    motto: "Excellence in Achievement",
    description: "Leadership • Achievement • Honor"
  },
  {
    id: "lovelace",
    name: "House of Lovelace",
    color: "#ea580c",
    icon: "💻", 
    motto: "Coding the Future",
    description: "Technology • Programming • Logic"
  }
];

export default function MainLanding() {
  const [, setLocation] = useLocation();
  const [currentHouse, setCurrentHouse] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [sparklePositions, setSparklePositions] = useState<Array<{x: number, y: number, delay: number}>>([]);

  // Cycle through houses for animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHouse((prev) => (prev + 1) % houses.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Generate random sparkle positions
  useEffect(() => {
    const sparkles = Array.from({ length: 15 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3
    }));
    setSparklePositions(sparkles);
  }, []);

  // Hide welcome message after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const navigateToLogin = (userType: string) => {
    switch (userType) {
      case 'student':
        setLocation('/student-login');
        break;
      case 'parent':
        setLocation('/parent-login');
        break;
      case 'teacher':
        setLocation('/teacher-login');
        break;
      case 'admin':
        setLocation('/admin-login');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Sparkles */}
      {sparklePositions.map((sparkle, index) => (
        <div
          key={index}
          className="absolute pointer-events-none"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            animation: `twinkle 3s infinite ${sparkle.delay}s`
          }}
        >
          <Sparkles className="h-4 w-4 text-yellow-300 opacity-70" />
        </div>
      ))}

      {/* Floating House Icons Animation */}
      <div className="absolute inset-0 pointer-events-none">
        {houses.map((house, index) => (
          <div
            key={house.id}
            className={`absolute text-6xl transition-all duration-1000 ${
              index === currentHouse 
                ? 'opacity-100 scale-125 animate-bounce' 
                : 'opacity-30 scale-100'
            }`}
            style={{
              left: `${20 + index * 15}%`,
              top: `${30 + Math.sin(index) * 20}%`,
              color: house.color,
              textShadow: `0 0 20px ${house.color}50`
            }}
          >
            {house.icon}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        {/* Welcome Animation */}
        {showWelcome && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center animate-pulse">
              <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 mb-4 animate-bounce">
                WELCOME TO
              </div>
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                PBIS HOUSE OF CHAMPIONS
              </div>
              <div className="mt-4 flex justify-center space-x-4">
                <Trophy className="h-12 w-12 text-yellow-400 animate-spin" />
                <Crown className="h-12 w-12 text-purple-400 animate-pulse" />
                <Star className="h-12 w-12 text-blue-400 animate-bounce" />
              </div>
            </div>
          </div>
        )}

        {/* Main Interface */}
        <div className={`transition-opacity duration-1000 ${showWelcome ? 'opacity-0' : 'opacity-100'} w-full max-w-6xl`}>
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-6 mb-6">
              <img 
                src={schoolLogoPath} 
                alt="Bush Hills STEAM Academy Mustangs Crest" 
                className="h-24 w-24 object-contain animate-floating animate-glow-pulse"
                data-testid="main-school-logo"
                style={{ filter: 'drop-shadow(0 0 20px #fbbf24)' }}
              />
              <div>
                <h1 className="text-5xl font-bold text-white mb-2 animate-bounce-in">
                  Bush Hills STEAM Academy
                </h1>
                <div className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 animate-rainbow">
                  PBIS House of Champions
                </div>
              </div>
            </div>
            
            <p className="text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
              Join your house, earn points for excellence, and become a champion! 
              Choose your role below to access your personalized dashboard.
            </p>
          </div>

          {/* Current House Spotlight */}
          <div className="text-center mb-12">
            <div className="inline-block">
              <Badge 
                className="text-lg px-6 py-3 mb-4 animate-pulse"
                style={{ 
                  backgroundColor: houses[currentHouse].color,
                  color: 'white',
                  boxShadow: `0 0 30px ${houses[currentHouse].color}80`
                }}
              >
                ✨ Featuring: {houses[currentHouse].name} ✨
              </Badge>
              <div 
                className="text-8xl mb-4 animate-bounce"
                style={{ 
                  filter: `drop-shadow(0 0 20px ${houses[currentHouse].color})`,
                  textShadow: `0 0 30px ${houses[currentHouse].color}`
                }}
              >
                {houses[currentHouse].icon}
              </div>
              <div className="text-2xl font-bold text-white mb-2">
                {houses[currentHouse].motto}
              </div>
              <div className="text-lg text-gray-300">
                {houses[currentHouse].description}
              </div>
            </div>
          </div>

          {/* Login Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Student Login */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl group hover-lift">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <GraduationCap className="h-16 w-16 text-blue-400 mx-auto mb-4 group-hover:animate-bounce" />
                  <h3 className="text-2xl font-bold text-white mb-2">Student</h3>
                  <p className="text-gray-300 text-sm">
                    Access your personal dashboard, view house points, and track achievements
                  </p>
                </div>
                <Button 
                  onClick={() => navigateToLogin('student')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                  data-testid="button-student-login"
                >
                  Student Login
                </Button>
              </CardContent>
            </Card>

            {/* Parent Login */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl group hover-lift">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <Users className="h-16 w-16 text-green-400 mx-auto mb-4 group-hover:animate-bounce" />
                  <h3 className="text-2xl font-bold text-white mb-2">Parent</h3>
                  <p className="text-gray-300 text-sm">
                    Monitor your child's progress, communicate with teachers, and stay connected
                  </p>
                </div>
                <Button 
                  onClick={() => navigateToLogin('parent')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 mb-3"
                  data-testid="button-parent-login"
                >
                  Parent Login
                </Button>
                <button
                  onClick={() => setLocation('/parent-signup')}
                  className="w-full text-green-300 hover:text-green-100 text-sm underline transition-colors duration-200"
                  data-testid="link-parent-signup"
                >
                  Create Parent Account
                </button>
              </CardContent>
            </Card>

            {/* Teacher Login */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl group hover-lift">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <Shield className="h-16 w-16 text-purple-400 mx-auto mb-4 group-hover:animate-bounce" />
                  <h3 className="text-2xl font-bold text-white mb-2">Teacher</h3>
                  <p className="text-gray-300 text-sm">
                    Manage classes, award points, track student progress, and access all features
                  </p>
                </div>
                <Button 
                  onClick={() => navigateToLogin('teacher')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 mb-3"
                  data-testid="button-teacher-login"
                >
                  Teacher Login
                </Button>
                <button
                  onClick={() => setLocation('/teacher-signup')}
                  className="w-full text-purple-300 hover:text-purple-100 text-sm underline transition-colors duration-200"
                  data-testid="link-teacher-signup"
                >
                  Create Teacher Account
                </button>
              </CardContent>
            </Card>

            {/* Administrator Login */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl group hover-lift">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4 group-hover:animate-bounce" />
                  <h3 className="text-2xl font-bold text-white mb-2">Administrator</h3>
                  <p className="text-gray-300 text-sm">
                    Full system access, manage users, oversee houses, and administrative controls
                  </p>
                </div>
                <Button 
                  onClick={() => navigateToLogin('admin')}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 mb-3"
                  data-testid="button-admin-login"
                >
                  Administrator Login
                </Button>
                <button
                  onClick={() => setLocation('/admin-signup')}
                  className="w-full text-yellow-300 hover:text-yellow-100 text-sm underline transition-colors duration-200"
                  data-testid="link-admin-signup"
                >
                  Create Administrator Account
                </button>
              </CardContent>
            </Card>
          </div>

          {/* House Gallery */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-8">The Five Houses of Champions</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {houses.map((house, index) => (
                <div 
                  key={house.id}
                  className={`p-4 rounded-lg transition-all duration-500 cursor-pointer ${
                    index === currentHouse 
                      ? 'bg-white/20 scale-110 shadow-2xl' 
                      : 'bg-white/10 hover:bg-white/15'
                  }`}
                  style={{
                    borderColor: house.color,
                    borderWidth: index === currentHouse ? '3px' : '1px',
                    boxShadow: index === currentHouse ? `0 0 30px ${house.color}50` : 'none'
                  }}
                >
                  <div 
                    className="text-4xl mb-2"
                    style={{ 
                      filter: index === currentHouse ? `drop-shadow(0 0 10px ${house.color})` : 'none'
                    }}
                  >
                    {house.icon}
                  </div>
                  <div className="text-white font-bold text-sm">{house.name.replace('House of ', '')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes floating {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes glow-pulse {
          0%, 100% { 
            box-shadow: 0 0 5px currentColor;
          }
          50% { 
            box-shadow: 0 0 20px currentColor, 0 0 30px currentColor;
          }
        }
        
        @keyframes rainbow-text {
          0% { filter: hue-rotate(0deg); }
          25% { filter: hue-rotate(90deg); }
          50% { filter: hue-rotate(180deg); }
          75% { filter: hue-rotate(270deg); }
          100% { filter: hue-rotate(360deg); }
        }
        
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-100px);
          }
          50% {
            opacity: 1;
            transform: scale(1.1) translateY(0px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0px);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-floating {
          animation: floating 3s ease-in-out infinite;
        }
        
        .animate-glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }
        
        .animate-rainbow {
          animation: rainbow-text 3s linear infinite;
        }
        
        .animate-bounce-in {
          animation: bounce-in 1s ease-out;
        }
        
        .hover-lift {
          transition: all 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-10px) scale(1.05);
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
}