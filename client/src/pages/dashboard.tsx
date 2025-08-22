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

  // COMPETITIVE BACKGROUND MUSIC STATE
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // COMPETITIVE BACKGROUND MUSIC SETUP
  useEffect(() => {
    return () => {
      if (musicIntervalRef.current) {
        clearInterval(musicIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
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

  // CREATE COMPETITIVE MUSIC FUNCTION - FIXED VERSION
  const createCompetitiveMusic = async () => {
    if (!audioContextRef.current || !hasUserInteracted) {
      console.log("MUSIC: Cannot create - no context or no interaction");
      return;
    }

    // Clear any existing interval
    if (musicIntervalRef.current) {
      clearInterval(musicIntervalRef.current);
    }

    // Ensure audio context is running
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
      console.log("MUSIC: Audio context resumed");
    }

    // Competitive melody frequencies - MUCH higher energy and faster
    const competitiveNotes = [
      880.00, 1108.73, 1396.91, 1760.00, // High intensity power notes
      987.77, 1244.51, 1567.98, 1975.53, // Aggressive ascending
      1046.50, 1318.51, 1661.22, 2093.00, // Driving competitive rhythm
      1174.66, 1479.98, 1864.66, 2349.32  // Maximum energy peaks
    ];
    
    let noteIndex = 0;
    let beatCounter = 0;
    let musicIsRunning = true; // Use local variable instead of React state

    const playCompetitiveNote = () => {
      console.log("MUSIC: playCompetitiveNote called, musicIsRunning:", musicIsRunning);
      
      if (!musicIsRunning || !audioContextRef.current) {
        console.log("MUSIC: Stopping - not running or no context");
        return;
      }
      
      if (audioContextRef.current.state !== 'running') {
        console.log("MUSIC: Audio context state:", audioContextRef.current.state);
        return;
      }

      try {
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        const currentNote = competitiveNotes[noteIndex];
        const isAccent = beatCounter % 4 === 0;
        const isDriving = beatCounter % 2 === 0;
        
        oscillator.frequency.setValueAtTime(currentNote, audioContextRef.current.currentTime);
        oscillator.type = isAccent ? 'square' : (isDriving ? 'sawtooth' : 'triangle');
        
        // Much louder and more aggressive - competitive sports style
        const baseVolume = isAccent ? 0.8 : (isDriving ? 0.6 : 0.4);
        gainNode.gain.setValueAtTime(baseVolume, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.2);
        
        oscillator.start(audioContextRef.current.currentTime);
        oscillator.stop(audioContextRef.current.currentTime + 0.2);
        
        noteIndex = (noteIndex + 1) % competitiveNotes.length;
        beatCounter++;
        
        console.log(`MUSIC: ♪ ${currentNote.toFixed(0)}Hz vol:${baseVolume.toFixed(1)} type:${oscillator.type} beat:${beatCounter}`);
      } catch (error) {
        console.log("MUSIC: Audio note creation failed:", error);
      }
    };

    // Store stop function in interval ref for cleanup
    const stopMusic = () => {
      musicIsRunning = false;
      console.log("MUSIC: Stopped competitive music");
    };

    // Test immediate playback
    console.log("MUSIC: About to call playCompetitiveNote immediately for test");
    playCompetitiveNote();
    
    // Very fast tempo for HIGH ENERGY competitive feel (150ms)
    console.log("MUSIC: Setting up interval with 150ms timing");
    musicIntervalRef.current = setInterval(() => {
      console.log("MUSIC: Interval tick - calling playCompetitiveNote");
      playCompetitiveNote();
    }, 150);
    
    // Store cleanup function
    (musicIntervalRef.current as any).stopMusic = stopMusic;
    
    console.log("MUSIC: Started competitive music interval with ID:", musicIntervalRef.current);
  };

  // MUSIC CONTROL FUNCTIONS
  const toggleMusic = async () => {
    handleUserInteraction();
    
    if (isPlaying) {
      // Stop music
      if (musicIntervalRef.current) {
        // Call stop function if available
        if ((musicIntervalRef.current as any).stopMusic) {
          (musicIntervalRef.current as any).stopMusic();
        }
        clearInterval(musicIntervalRef.current);
        musicIntervalRef.current = null;
      }
      setIsPlaying(false);
      console.log("MUSIC: Paused HIGH ENERGY competitive music");
    } else {
      try {
        // Initialize audio context if needed
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          console.log("MUSIC: Audio context created");
        }
        
        // Resume audio context if suspended
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
          console.log("MUSIC: Audio context resumed from suspended state");
        }
        
        // Test audio with immediate beep
        const testOscillator = audioContextRef.current.createOscillator();
        const testGain = audioContextRef.current.createGain();
        testOscillator.connect(testGain);
        testGain.connect(audioContextRef.current.destination);
        testOscillator.frequency.setValueAtTime(880, audioContextRef.current.currentTime);
        testOscillator.type = 'square';
        testGain.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
        testGain.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.2);
        testOscillator.start(audioContextRef.current.currentTime);
        testOscillator.stop(audioContextRef.current.currentTime + 0.2);
        console.log("MUSIC: Test beep played");
        
        // Start competitive music
        setIsPlaying(true);
        console.log("MUSIC: Setting isPlaying to true, about to create music");
        
        // Wait a moment for state to update, then start music
        setTimeout(async () => {
          await createCompetitiveMusic();
          console.log("MUSIC: createCompetitiveMusic completed");
        }, 50);
        
        console.log("MUSIC: Playing ULTRA HIGH ENERGY competitive sports music");
      } catch (error) {
        console.error("MUSIC: Failed to start audio:", error);
        alert("Audio failed to start. Please check your browser audio settings and try again.");
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
        <div className="sparkle-effect sparkle-5">✨</div>
        <div className="sparkle-effect sparkle-6">⭐</div>

        {/* Hero Content */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="text-center md:text-left mb-6 md:mb-0">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 pbis-champion-title" data-testid="title-pbis-champion">
              PBIS House of Champions
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-6" data-testid="subtitle-excellence">
              Promoting Excellence Through Character Development
            </p>
            
            {/* Music Toggle Button */}
            <Button
              onClick={toggleMusic}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 mr-4"
              data-testid="button-toggle-music"
            >
              {isPlaying ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
              {isPlaying ? "Pause Competitive Music" : "Play Competitive Music"}
            </Button>

            <Link href="/add-points">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                data-testid="button-add-points"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Points
              </Button>
            </Link>
          </div>
          
          {/* School Logo */}
          <div className="school-logo-container">
            <img 
              src={schoolLogoPath} 
              alt="BHSA Mustangs Crest" 
              className="w-32 h-32 md:w-40 md:h-40 object-contain school-logo"
              data-testid="img-school-logo"
            />
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card data-testid="card-academic-points">
          <CardContent className="p-6 text-center">
            <Book className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Academic Excellence</h3>
            <p className="text-3xl font-bold text-blue-600" data-testid="text-academic-total">{totalAcademic}</p>
            <p className="text-sm text-gray-500">Total Points</p>
          </CardContent>
        </Card>

        <Card data-testid="card-attendance-points">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Perfect Attendance</h3>
            <p className="text-3xl font-bold text-green-600" data-testid="text-attendance-total">{totalAttendance}</p>
            <p className="text-sm text-gray-500">Total Points</p>
          </CardContent>
        </Card>

        <Card data-testid="card-behavior-points">
          <CardContent className="p-6 text-center">
            <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Character Development</h3>
            <p className="text-3xl font-bold text-red-600" data-testid="text-behavior-total">{totalBehavior}</p>
            <p className="text-sm text-gray-500">Total Points</p>
          </CardContent>
        </Card>
      </div>

      {/* House Standings */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center" data-testid="heading-house-standings">
          🏆 House Standings 🏆
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {houses?.sort((a, b) => (b.academicPoints + b.attendancePoints + b.behaviorPoints) - (a.academicPoints + a.attendancePoints + a.behaviorPoints))
            .map((house, index) => {
              const IconComponent = iconMap[house.icon as keyof typeof iconMap];
              const totalPoints = house.academicPoints + house.attendancePoints + house.behaviorPoints;
              
              return (
                <Card 
                  key={house.id} 
                  className={`house-card hover:shadow-lg transition-all duration-300 ${
                    index === 0 ? 'ring-2 ring-yellow-400 shadow-xl transform scale-105 first-place-glow' : ''
                  }`}
                  data-testid={`card-house-${house.id}`}
                >
                  <CardContent className="p-6 text-center">
                    {index === 0 && (
                      <div className="flex justify-center mb-2">
                        <Trophy className="h-6 w-6 text-yellow-500" data-testid="icon-trophy-first-place" />
                      </div>
                    )}
                    
                    <div className="flex justify-center mb-4">
                      {IconComponent && (
                        <IconComponent 
                          className={`h-12 w-12 ${house.color}`} 
                          data-testid={`icon-house-${house.id}`}
                        />
                      )}
                    </div>
                    
                    <h3 className="font-bold text-lg mb-2 text-gray-800" data-testid={`text-house-name-${house.id}`}>
                      {house.name}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Academic:</span>
                        <span className="font-semibold text-blue-600" data-testid={`text-academic-${house.id}`}>
                          {house.academicPoints}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Attendance:</span>
                        <span className="font-semibold text-green-600" data-testid={`text-attendance-${house.id}`}>
                          {house.attendancePoints}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Behavior:</span>
                        <span className="font-semibold text-red-600" data-testid={`text-behavior-${house.id}`}>
                          {house.behaviorPoints}
                        </span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span className={`text-lg ${house.color}`} data-testid={`text-total-${house.id}`}>
                          {totalPoints}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/add-points">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="card-link-add-points">
            <CardContent className="p-6 text-center">
              <Plus className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-800">Add Points</h3>
              <p className="text-sm text-gray-600 mt-1">Award house points</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/pbis-recognition">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="card-link-pbis-recognition">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-800">PBIS Recognition</h3>
              <p className="text-sm text-gray-600 mt-1">Celebrate achievements</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/scholars">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="card-link-scholars">
            <CardContent className="p-6 text-center">
              <Book className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-800">View Scholars</h3>
              <p className="text-sm text-gray-600 mt-1">Student directory</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/house-sorting">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="card-link-house-sorting">
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-800">House Sorting</h3>
              <p className="text-sm text-gray-600 mt-1">Assign new students</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </section>
  );
}