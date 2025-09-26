import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { 
  ArrowLeft,
  BookOpen,
  Star,
  Zap,
  FlaskConical,
  Target,
  Computer,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Users,
  Award,
  User,
  Rocket,
  Scale,
  Navigation
} from "lucide-react";
import { isStudentAuthenticated, clearStudentAuth, maintainStudentSession, isTeacherViewing } from "@/lib/studentAuth";
import logoPath from "@assets/_BHSA Mustang 1_1754780382943.png";
import { motion, AnimatePresence } from "framer-motion";

interface HouseStory {
  id: string;
  title: string;
  chapter: number;
  content: string;
  historicalFact: string;
  modernConnection: string;
  houseValues: string[];
  timeline: string;
  achievements: string[];
  quotes: string[];
  personImage?: string;
  personName: string;
}

interface HouseHistoryData {
  franklin: HouseStory[];
  tesla: HouseStory[];
  curie: HouseStory[];
  nobel: HouseStory[];
  lovelace: HouseStory[];
}

export default function StudentHouseHistory() {
  const [, setLocation] = useLocation();
  const [studentData, setStudentData] = useState<any>(null);
  const [selectedHouse, setSelectedHouse] = useState<string>('');
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);

  // Authentication check - allow teacher viewing
  useEffect(() => {
    // Enhanced teacher viewing detection
    const teacherView = isTeacherViewing() || window.location.pathname.includes('teacher-student-view');
    
    if (teacherView) {
      // For teacher viewing mode, get student data from URL parameters or path
      const urlParams = new URLSearchParams(window.location.search);
      const studentId = urlParams.get('studentId') || window.location.pathname.split('/').pop();
      const studentName = urlParams.get('studentName') || 'Student';
      
      if (studentId) {
        setStudentData({
          id: studentId,
          name: studentName,
          houseName: 'franklin', // Default house for teacher viewing
        });
        setSelectedHouse('franklin');
      }
    } else {
      // Normal student authentication flow - be more lenient
      maintainStudentSession();
      
      const student = localStorage.getItem("studentData");
      if (student) {
        try {
          const data = JSON.parse(student);
          setStudentData(data);
          setSelectedHouse(data.houseName?.toLowerCase() || 'franklin');
        } catch (error) {
          console.warn("Error parsing student data:", error);
        }
      }
      
      // Only redirect if no student data and not authenticated
      if (!isStudentAuthenticated() && !studentData) {
        clearStudentAuth();
        setLocation("/student-login");
        return;
      }
    }
  }, [setLocation]);

  // Fetch student profile
  const { data: profile } = useQuery({
    queryKey: ["/api/student/profile"],
    enabled: !!studentData,
  });

  // House history stories data
  const houseHistories: HouseHistoryData = {
    franklin: [
      {
        id: 'franklin-1',
        title: 'Hidden Figures Hero',
        chapter: 1,
        content: 'Dr. Katherine Johnson was born in 1918 in West Virginia. She showed exceptional mathematical ability from an early age, graduating high school at 14 and college at 18. Her precise calculations made space travel possible.',
        historicalFact: 'Katherine Johnson calculated the exact trajectory for Alan Shepard\'s 1961 flight, America\'s first human spaceflight, using only pencil, paper, and her brilliant mind.',
        modernConnection: 'Like Dr. Johnson, House Johnson students are encouraged to pursue excellence in mathematics and science, knowing that precision and dedication can change the world.',
        houseValues: ['Mathematical Excellence', 'Precision', 'Perseverance', 'Breaking Barriers'],
        timeline: '1918-2020',
        achievements: ['NASA mathematician', 'Calculated space trajectories', 'Presidential Medal of Freedom recipient'],
        quotes: ['"I counted everything. I counted the steps to the road, the steps up to church, the number of dishes and silverware I washed."', '"Like what you do, and then you will do your best."'],
        personName: 'Dr. Katherine Johnson',
        personImage: '👩‍🔬'
      },
      {
        id: 'franklin-2',
        title: 'The Human Computer',
        chapter: 2,
        content: 'During the Space Race, astronaut John Glenn specifically requested that Katherine Johnson verify the computer calculations for his orbital mission. "Get the girl to check the numbers," he said. Her work was so trusted that lives depended on it.',
        historicalFact: 'Katherine Johnson\'s calculations were so accurate that NASA used them to verify the computer calculations for John Glenn\'s historic orbital flight in 1962.',
        modernConnection: 'Johnson House students learn that accuracy and attention to detail in mathematics and science can literally be matters of life and death.',
        houseValues: ['Accuracy', 'Trust', 'Scientific Excellence', 'Critical Thinking'],
        timeline: '1960s Space Race',
        achievements: ['Verified orbital calculations', 'Trusted by astronauts', 'Advanced space exploration'],
        quotes: ['"We will always have STEM with us. Some things will drop out of the public eye and will go away, but there will always be science, engineering, and technology."', '"You are no better than anyone else, and no one is better than you."'],
        personName: 'Dr. Katherine Johnson',
        personImage: '🚀'
      }
    ],
    tesla: [
      {
        id: 'tesla-1',
        title: 'The Visionary',
        chapter: 1,
        content: 'Nikola Tesla was born during a lightning storm in 1856 in Serbia. His mother said the midwife declared it was a bad omen, but she replied, "No, he will be a child of light."',
        historicalFact: 'Tesla had an eidetic memory and could perform integral calculus in his head, making teachers think he was cheating.',
        modernConnection: 'Tesla House students embrace their unique thinking patterns and use technology to amplify their natural abilities.',
        houseValues: ['Innovation', 'Electrical Excellence', 'Visionary Thinking', 'Technological Mastery'],
        timeline: '1856-1943',
        achievements: ['Invented AC motor', 'Developed radio technology', 'Created wireless power transmission'],
        quotes: ['"The present is theirs; the future, for which I really worked, is mine."', '"Invention is the most important product of man\'s creative brain."'],
        personName: 'Nikola Tesla',
        personImage: '🔬'
      },
      {
        id: 'tesla-2',
        title: 'The Electric Genius',
        chapter: 2,
        content: 'Tesla\'s AC electrical system powers the world today. His "War of Currents" with Edison changed how we generate and distribute electricity globally.',
        historicalFact: 'Tesla held over 300 patents and spoke 8 languages fluently.',
        modernConnection: 'Tesla House students learn that persistence and innovation can change the world, just like Tesla\'s AC system.',
        houseValues: ['Perseverance', 'Global Thinking', 'Electrical Innovation', 'Future Focus'],
        timeline: '1884-1943',
        achievements: ['Won War of Currents', 'Powered World\'s Fair', 'Invented Tesla coil'],
        quotes: ['"Be alone, that is the secret of invention; be alone, that is when ideas are born."', '"The scientists of today think deeply instead of clearly."'],
        personName: 'Nikola Tesla',
        personImage: '⚡'
      }
    ],
    curie: [
      {
        id: 'curie-1',
        title: 'The Life-Saving Pioneer',
        chapter: 1,
        content: 'Dr. Charles Drew was born in 1904 in Washington, D.C. He became a brilliant surgeon and researcher whose innovations in blood storage and transfusion saved countless lives during World War II.',
        historicalFact: 'Dr. Drew developed the technique for long-term preservation of blood plasma, which revolutionized blood banks and made modern surgery possible.',
        modernConnection: 'Drew House students learn that medical innovation combined with chemistry knowledge can literally save millions of lives.',
        houseValues: ['Medical Excellence', 'Life-Saving Innovation', 'Chemistry Mastery', 'Research Dedication'],
        timeline: '1904-1950',
        achievements: ['Revolutionized blood storage', 'Founded American Red Cross Blood Bank', 'Advanced surgical techniques'],
        quotes: ['"Excellence of performance will transcend artificial barriers created by man."', '"The blood of individual human beings may differ by blood groupings, but there is absolutely no scientific basis to indicate any difference in human blood from race to race."'],
        personName: 'Dr. Charles Drew',
        personImage: '👨‍⚕️'
      },
      {
        id: 'curie-2',
        title: 'The Blood Bank Pioneer',
        chapter: 2,
        content: 'During World War II, Dr. Drew organized the "Blood for Britain" program and later became the first director of the American Red Cross Blood Bank. His work saved thousands of Allied soldiers.',
        historicalFact: 'Ironically, Dr. Drew was excluded from donating to his own blood bank due to racial segregation policies, despite being its creator.',
        modernConnection: 'Drew House students understand that scientific excellence transcends social barriers and that true discovery serves all humanity.',
        houseValues: ['Universal Service', 'Scientific Integrity', 'Breaking Barriers', 'Global Impact'],
        timeline: '1940-1950',
        achievements: ['Organized Blood for Britain', 'Directed American Red Cross Blood Bank', 'Trained countless surgeons'],
        quotes: ['"I feel that the recent ruling by the United States Army and Navy regarding the refusal of colored blood donors is an indefensible one from any point of view."', '"Science knows no bias."'],
        personName: 'Dr. Charles Drew',
        personImage: '🧪'
      }
    ],
    nobel: [
      {
        id: 'nobel-1',
        title: 'The Justice Pioneer',
        chapter: 1,
        content: 'Thurgood Marshall was born in 1908 in Baltimore, Maryland. He became the first African American Supreme Court Justice and spent his career fighting for civil rights and equality under the law.',
        historicalFact: 'Before joining the Supreme Court, Marshall won 29 out of 32 cases before the Court as a civil rights lawyer, including the landmark Brown v. Board of Education.',
        modernConnection: 'Marshall House students learn that true leadership means standing up for justice and achieving excellence while helping others reach their potential.',
        houseValues: ['Justice and Equality', 'Leadership Excellence', 'Advocacy Skills', 'Honor and Integrity'],
        timeline: '1908-1993',
        achievements: ['First Black Supreme Court Justice', 'Won Brown v. Board of Education', 'NAACP Legal Defense Fund'],
        quotes: ['"In recognizing the humanity of our fellow beings, we pay ourselves the highest tribute."', '"Where you see wrong or inequality or injustice, speak out, because this is your country."'],
        personName: 'Thurgood Marshall',
        personImage: '⚖️'
      },
      {
        id: 'nobel-2',
        title: 'The Supreme Achievement',
        chapter: 2,
        content: 'As a Supreme Court Justice from 1967 to 1991, Marshall continued to champion civil rights, voting rights, and equal justice under law. His legal legacy transformed American society.',
        historicalFact: 'Marshall\'s legal strategy in Brown v. Board of Education ended the "separate but equal" doctrine and integrated American schools.',
        modernConnection: 'Marshall House students understand that the highest achievement is using your talents to create a more just and equitable society for everyone.',
        houseValues: ['Legal Excellence', 'Social Justice', 'Historical Achievement', 'Equality Leadership'],
        timeline: '1954-1991',
        achievements: ['Ended school segregation', '24 years on Supreme Court', 'Transformed American law'],
        quotes: ['"The measure of a country\'s greatness is its ability to retain compassion in times of crisis."', '"None of us got where we are solely by pulling ourselves up by our bootstraps."'],
        personName: 'Thurgood Marshall',
        personImage: '🎯'
      }
    ],
    lovelace: [
      {
        id: 'lovelace-1',
        title: 'The Hidden GPS Pioneer',
        chapter: 1,
        content: 'Dr. Gladys West was born in 1930 in rural Virginia. As a mathematician, she spent decades at the Naval Surface Warfare Center developing the mathematical models that became the foundation for GPS technology.',
        historicalFact: 'Dr. West programmed the IBM computer that modeled the shape of the Earth, work that was essential for creating accurate satellite navigation systems.',
        modernConnection: 'West House students learn that mathematical precision and computer programming can create technologies that guide the entire world.',
        houseValues: ['Mathematical Precision', 'Programming Excellence', 'Global Innovation', 'Computational Mastery'],
        timeline: '1930-present',
        achievements: ['Developed GPS mathematics', 'Programmed Earth modeling systems', 'Advanced satellite technology'],
        quotes: ['"When you\'re working every day, you\'re not thinking, \'What impact will this have on the world?\' You\'re thinking, \'I\'ve got to get this right.\'"', '"It never occurred to me that I was a pioneer. I was just doing my job."'],
        personName: 'Dr. Gladys West',
        personImage: '👩‍💻'
      },
      {
        id: 'lovelace-2',
        title: 'The Technology That Guides Us',
        chapter: 2,
        content: 'For decades, Dr. West\'s mathematical work remained largely unknown to the public. It wasn\'t until GPS became essential to everyday life that people realized a brilliant Black woman mathematician had made it all possible.',
        historicalFact: 'Dr. West was inducted into the Air Force Space and Missile Pioneers Hall of Fame in 2018, finally receiving recognition for her foundational GPS work.',
        modernConnection: 'West House students understand that behind every technology we use daily, there are brilliant minds whose precise work makes our connected world possible.',
        houseValues: ['Mathematical Legacy', 'Hidden Figures Recognition', 'Technology Innovation', 'Precision Excellence'],
        timeline: '1970s-present',
        achievements: ['GPS mathematics foundation', 'Earth modeling algorithms', 'Satellite navigation systems'],
        quotes: ['"What we were doing was so new back then. We were using the computer to do something that had never been done before."', '"I\'m glad that my work is finally being recognized."'],
        personName: 'Dr. Gladys West',
        personImage: '💻'
      }
    ]
  };

  const getHouseIcon = (house: string) => {
    switch (house) {
      case 'franklin': return <Rocket className="h-8 w-8" />;
      case 'tesla': return <Zap className="h-8 w-8" />;
      case 'curie': return <FlaskConical className="h-8 w-8" />;
      case 'nobel': return <Scale className="h-8 w-8" />;
      case 'lovelace': return <Navigation className="h-8 w-8" />;
      default: return <Star className="h-8 w-8" />;
    }
  };

  const getHouseColor = (house: string) => {
    switch (house) {
      case 'franklin': return 'from-blue-600 to-blue-800';
      case 'tesla': return 'from-purple-600 to-purple-800';
      case 'curie': return 'from-red-600 to-red-800';
      case 'nobel': return 'from-green-600 to-green-800';
      case 'lovelace': return 'from-orange-600 to-orange-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getHouseName = (house: string) => {
    switch (house) {
      case 'franklin': return 'Johnson';
      case 'tesla': return 'Tesla';
      case 'curie': return 'Drew';
      case 'nobel': return 'Marshall';
      case 'lovelace': return 'West';
      default: return house;
    }
  };

  const currentStories = houseHistories[selectedHouse as keyof HouseHistoryData] || [];
  const currentStory = currentStories[currentChapter];

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  // Audio narration function
  const readStoryContent = (story: HouseStory) => {
    if (!speechSynthesisRef.current || isMuted || isReading) return;

    // Stop any current speech with delay to prevent stuttering
    speechSynthesisRef.current.cancel();
    
    // Add delay to prevent rapid-fire calls
    setTimeout(() => {
      if (!speechSynthesisRef.current || speechSynthesisRef.current.speaking) return;
      
      const textToRead = `
        Chapter ${story.chapter}: ${story.title}.
        ${story.content}
        Historical Fact: ${story.historicalFact}
        Modern Connection: ${story.modernConnection}
        Achievements: ${story.achievements.join(', ')}.
        ${story.quotes.join(' ')}
      `;

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => setIsReading(true);
      utterance.onend = () => setIsReading(false);
      utterance.onerror = () => setIsReading(false);

      speechSynthesisRef.current.speak(utterance);
    }, 300);
  };

  // Stop audio reading
  const stopReading = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsReading(false);
    }
  };

  // Auto-advance chapters
  useEffect(() => {
    if (autoPlay && isPlaying) {
      const timer = setTimeout(() => {
        if (currentChapter < currentStories.length - 1) {
          setCurrentChapter(prev => prev + 1);
        } else {
          setIsPlaying(false);
          setAutoPlay(false);
        }
      }, 15000); // 15 seconds per chapter

      return () => clearTimeout(timer);
    }
  }, [autoPlay, isPlaying, currentChapter, currentStories.length]);

  // Auto-read when chapter changes and audio is enabled (only if autoPlay is active)
  useEffect(() => {
    if (currentStory && isPlaying && autoPlay && !isMuted) {
      setTimeout(() => readStoryContent(currentStory), 1000);
    }
  }, [currentChapter, currentStory, isPlaying, autoPlay, isMuted]);

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  // Enhanced navigation logic for deployed environment
                  const teacherView = isTeacherViewing() || window.location.pathname.includes('teacher-student-view');
                  if (teacherView) {
                    const returnTo = sessionStorage.getItem('teacherReturnPath') || '/teacher-dashboard';
                    window.location.href = returnTo;
                  } else {
                    setLocation("/student-dashboard");
                  }
                }}
                className="flex items-center space-x-2 text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{isTeacherViewing() ? "Return to Teacher Dashboard" : "Back to Dashboard"}</span>
              </Button>
              <img 
                src={logoPath} 
                alt="BHSA Mustangs Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">House History</h1>
                <p className="text-gray-300 text-sm">Immersive Storytelling Mode</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* House Selection */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.keys(houseHistories).map((house) => (
            <motion.div
              key={house}
              className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
                selectedHouse === house 
                  ? 'border-white bg-white/20' 
                  : 'border-white/20 bg-white/10 hover:bg-white/15'
              }`}
              onClick={() => {
                setSelectedHouse(house);
                setCurrentChapter(0);
                setIsPlaying(false);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col items-center text-white text-center">
                {getHouseIcon(house)}
                <span className="mt-2 font-semibold">{getHouseName(house)}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Story Content */}
        <AnimatePresence mode="wait">
          {currentStory && (
            <motion.div
              key={`${selectedHouse}-${currentChapter}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Story Header */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full bg-gradient-to-r ${getHouseColor(selectedHouse)}`}>
                        {getHouseIcon(selectedHouse)}
                      </div>
                      <div>
                        <CardTitle className="text-white text-2xl">{currentStory.title}</CardTitle>
                        <p className="text-gray-300">Chapter {currentStory.chapter} • {currentStory.timeline}</p>
                      </div>
                    </div>
                    <Badge className="bg-white/20 text-white">
                      {currentChapter + 1} of {currentStories.length}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Story Controls */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentChapter(Math.max(0, currentChapter - 1))}
                        disabled={currentChapter === 0}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPlayingState = !isPlaying;
                          
                          // Stop any current reading when toggling play
                          if (!newPlayingState) {
                            stopReading();
                            setAutoPlay(false);
                          }
                          
                          setIsPlaying(newPlayingState);
                          
                          // Start reading with proper delay when play is pressed
                          if (newPlayingState && currentStory && !isMuted && !isReading) {
                            setAutoPlay(true);
                            setTimeout(() => {
                              if (!isReading) readStoryContent(currentStory);
                            }, 800);
                          }
                        }}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        <span className="ml-2">{isPlaying ? 'Pause' : 'Play'}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentChapter(Math.min(currentStories.length - 1, currentChapter + 1))}
                        disabled={currentChapter === currentStories.length - 1}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        Next
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Stop autoplay if it's running to prevent interference
                          if (isPlaying) {
                            setIsPlaying(false);
                            setAutoPlay(false);
                          }
                          readStoryContent(currentStory);
                        }}
                        disabled={isReading}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <Volume2 className="h-4 w-4" />
                        <span className="ml-2">{isReading ? 'Reading...' : 'Read Story'}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={stopReading}
                        disabled={!isReading}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <VolumeX className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMuted(!isMuted)}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        <span className="ml-2">{isMuted ? 'Unmute' : 'Mute'}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Story Content */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Historical Person Image */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {currentStory.personName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    <div className="text-6xl mb-4">
                      {currentStory.personImage}
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-2">{currentStory.personName}</h3>
                      <p className="text-gray-300 text-sm">{currentStory.timeline}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      The Story
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-200 leading-relaxed">{currentStory.content}</p>
                    <div className="p-4 bg-white/10 rounded-lg">
                      <h4 className="font-semibold text-white mb-2">Historical Fact</h4>
                      <p className="text-gray-200 text-sm italic">{currentStory.historicalFact}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Modern Connection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-200 leading-relaxed">{currentStory.modernConnection}</p>
                    <div>
                      <h4 className="font-semibold text-white mb-2">House Values</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentStory.houseValues.map((value, index) => (
                          <Badge key={index} className="bg-white/20 text-white">
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Achievements and Quotes */}
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Key Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentStory.achievements.map((achievement, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-200">
                          <Star className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Inspiring Quotes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentStory.quotes.map((quote, index) => (
                      <blockquote key={index} className="border-l-4 border-white/30 pl-4 text-gray-200 italic">
                        {quote}
                      </blockquote>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Progress Indicator */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm">Chapter Progress</span>
                    <span className="text-white text-sm">{currentChapter + 1}/{currentStories.length}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full bg-gradient-to-r ${getHouseColor(selectedHouse)}`}
                      style={{ width: `${((currentChapter + 1) / currentStories.length) * 100}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentChapter + 1) / currentStories.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}