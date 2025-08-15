import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Trophy, Plus, Book, Calendar, Heart, Shield, Star, Leaf, Mountain, Flame, Volume2, VolumeX } from "lucide-react";
import type { House } from "@shared/schema";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";
import LionIcon from "@/components/icons/Lion";
import MustangIcon from "@/components/icons/MustangIcon";

const iconMap = {
  "shield-alt": Shield,
  "mustang": MustangIcon,
  "star": Star,
  "leaf": Leaf,
  "mountain": Mountain,
  "fire": Flame,
  "lion": LionIcon,
};

export default function Dashboard() {
  const { data: houses, isLoading } = useQuery<House[]>({
    queryKey: ["/api/houses"],
  });

  // BACKGROUND MUSIC STATE
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // EDUCATIONAL BACKGROUND MUSIC SETUP
  useEffect(() => {
    // Create educational background music using Web Audio API for a positive, uplifting melody
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.3;
      audioRef.current.loop = true;
      
      // Use a data URL for a simple educational melody
      const createEducationalTone = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Educational melody frequencies (C major scale)
        const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
        let noteIndex = 0;
        
        const playNote = () => {
          if (isPlaying && hasUserInteracted) {
            oscillator.frequency.setValueAtTime(notes[noteIndex], audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
            
            noteIndex = (noteIndex + 1) % notes.length;
            setTimeout(playNote, 600);
          }
        };
        
        if (isPlaying && hasUserInteracted) {
          oscillator.start();
          playNote();
        }
      };
      
      // Alternative: Use a positive educational background music URL
      audioRef.current.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCCeB0fPWeSsF";
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // HANDLE USER INTERACTION FOR AUDIO
  const handleUserInteraction = () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      console.log("USER INTERACTION: Audio can now play");
    }
  };

  // MUSIC CONTROL FUNCTIONS
  const toggleMusic = () => {
    handleUserInteraction();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        console.log("MUSIC: Paused educational background music");
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          console.log("MUSIC: Playing educational background music");
        }).catch(error => {
          console.log("MUSIC: Audio play failed (browser security):", error);
        });
      }
    }
  };

  // AUTO-START MUSIC ON FIRST USER INTERACTION
  useEffect(() => {
    const handleFirstClick = () => {
      handleUserInteraction();
      document.removeEventListener('click', handleFirstClick);
      document.removeEventListener('keydown', handleFirstClick);
    };

    document.addEventListener('click', handleFirstClick);
    document.addEventListener('keydown', handleFirstClick);

    return () => {
      document.removeEventListener('click', handleFirstClick);
      document.removeEventListener('keydown', handleFirstClick);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const totalAcademic = houses?.reduce((sum, house) => sum + house.academicPoints, 0) || 0;
  const totalAttendance = houses?.reduce((sum, house) => sum + house.attendancePoints, 0) || 0;
  const totalBehavior = houses?.reduce((sum, house) => sum + house.behaviorPoints, 0) || 0;

  return (
    <section data-testid="dashboard-section">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8 hero-section-enhanced" data-testid="hero-section">
        {/* SPARKLE EFFECTS */}
        <div className="sparkle-effect sparkle-1">✨</div>
        <div className="sparkle-effect sparkle-2">⭐</div>
        <div className="sparkle-effect sparkle-3">✨</div>
        <div className="sparkle-effect sparkle-4">⭐</div>

        <div className="flex items-center justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center mb-4">
              <img 
                src={schoolLogoPath} 
                alt="Bush Hills STEAM Academy" 
                className="h-16 w-auto mr-4 bg-white rounded-lg p-2 school-logo-champion"
                data-testid="hero-school-logo"
              />
              <div>
                <h2 className="text-4xl font-bold mb-2 champion-title">Bush Hills STEAM Academy PBIS House of Champions</h2>
                <p className="text-blue-100 font-medium">Bush Hills STEAM Academy</p>
              </div>
            </div>
            <p className="text-xl text-blue-100 mb-6">
              Building character, fostering community, and celebrating excellence in our five distinguished houses.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/houses">
                <Button className="bg-white text-blue-600 hover:bg-blue-50" data-testid="button-view-leaderboard">
                  <Trophy className="mr-2 h-4 w-4" />
                  View Leaderboard
                </Button>
              </Link>
              <Link href="/admin">
                <Button className="bg-blue-500 hover:bg-blue-400" data-testid="button-add-points">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Points
                </Button>
              </Link>
              <Button 
                onClick={toggleMusic}
                className="bg-yellow-500 hover:bg-yellow-400 text-black"
                data-testid="button-toggle-music"
              >
                {isPlaying ? (
                  <>
                    <VolumeX className="mr-2 h-4 w-4" />
                    Pause Music
                  </>
                ) : (
                  <>
                    <Volume2 className="mr-2 h-4 w-4" />
                    Play Music
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* House Leaderboard */}
      <Card className="bg-white rounded-2xl shadow-lg p-6 mb-8" data-testid="house-standings-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">House Standings</h3>
          <span className="text-sm text-gray-500">
            Updated: <span data-testid="last-update">{new Date().toLocaleString()}</span>
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {houses?.map((house, index) => {
            // Use direct emoji icon instead of mapping
            const totalPoints = house.academicPoints + house.attendancePoints + house.behaviorPoints;
            
            const houseBgLightClass = {
              franklin: "bg-red-50 border-red-200",
              courie: "bg-purple-50 border-purple-200", 
              west: "bg-emerald-50 border-emerald-200",
              blackwell: "bg-gray-50 border-gray-200",
              berruguete: "bg-orange-50 border-orange-200",
            }[house.id] || "bg-red-50 border-red-200";

            const houseBgClass = {
              franklin: "bg-house-franklin",
              courie: "bg-house-courie", 
              west: "bg-house-west",
              blackwell: "bg-house-blackwell",
              berruguete: "bg-house-berruguete",
            }[house.id] || "bg-house-franklin";

            const houseColorClass = {
              franklin: "house-franklin",
              courie: "house-courie", 
              west: "house-west",
              blackwell: "house-blackwell",
              berruguete: "house-berruguete",
            }[house.id] || "house-franklin";

            return (
              <div
                key={house.id}
                className={`${houseBgLightClass} border-2 rounded-xl p-4 text-center hover:shadow-md transition-shadow house-card-celebration`}
                data-testid={`house-standing-${house.id}`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className={`w-12 h-12 ${houseBgClass} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <div className="house-icon-3d text-white" data-testid={`icon-house-${house.id}`}>
                    {(() => {
                      const IconComponent = iconMap[house.icon as keyof typeof iconMap];
                      return IconComponent ? <IconComponent size={24} className="text-white" /> : <span>{house.icon}</span>;
                    })()}
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 mb-1" data-testid={`house-name-${house.id}`}>
                  {house.name.replace("House of ", "")}
                </h4>
                <div className={`text-2xl font-bold ${houseColorClass} mb-1`} data-testid={`house-points-${house.id}`}>
                  {totalPoints.toLocaleString()}
                </div>
                <span className="text-xs text-gray-600" data-testid={`house-members-${house.id}`}>
                  {house.memberCount} Scholars
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Point Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white rounded-xl shadow-lg p-6" data-testid="academic-category-card">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <Book className="text-blue-600 text-lg" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Academic Excellence</h4>
              <p className="text-sm text-gray-600">Outstanding academic performance</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600" data-testid="academic-total-points">
            {totalAcademic.toLocaleString()}
          </div>
          <p className="text-sm text-gray-500">Total points awarded this semester</p>
        </Card>

        <Card className="bg-white rounded-xl shadow-lg p-6" data-testid="attendance-category-card">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <Calendar className="text-green-600 text-lg" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Perfect Attendance</h4>
              <p className="text-sm text-gray-600">Consistent daily attendance</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-green-600" data-testid="attendance-total-points">
            {totalAttendance.toLocaleString()}
          </div>
          <p className="text-sm text-gray-500">Total points awarded this semester</p>
        </Card>

        <Card className="bg-white rounded-xl shadow-lg p-6" data-testid="behavior-category-card">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              <Heart className="text-purple-600 text-lg" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Character Behavior</h4>
              <p className="text-sm text-gray-600">Positive behavior and leadership</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600" data-testid="behavior-total-points">
            {totalBehavior.toLocaleString()}
          </div>
          <p className="text-sm text-gray-500">Total points awarded this semester</p>
        </Card>
      </div>
    </section>
  );
}
