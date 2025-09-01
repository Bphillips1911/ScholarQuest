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
  User
} from "lucide-react";
import { isStudentAuthenticated, clearStudentAuth, maintainStudentSession } from "@/lib/studentAuth";
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

  // Authentication check
  useEffect(() => {
    if (!isStudentAuthenticated()) {
      clearStudentAuth();
      setLocation("/student-login");
      return;
    }
    
    maintainStudentSession();
    
    const student = localStorage.getItem("studentData");
    if (student) {
      try {
        const data = JSON.parse(student);
        setStudentData(data);
        setSelectedHouse(data.houseName?.toLowerCase() || 'franklin');
      } catch (error) {
        clearStudentAuth();
        setLocation("/student-login");
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
        title: 'The Curious Mind',
        chapter: 1,
        content: 'Benjamin Franklin was born in Boston in 1706, the 15th of 17 children. Despite having only two years of formal education, his insatiable curiosity led him to become one of history\'s greatest polymaths.',
        historicalFact: 'Franklin invented the lightning rod, bifocal glasses, and the Franklin stove, proving that scientific innovation comes from observing everyday problems.',
        modernConnection: 'Like Franklin, House Franklin students are encouraged to question everything and find creative solutions to real-world challenges.',
        houseValues: ['Curiosity', 'Innovation', 'Problem-Solving', 'Scientific Method'],
        timeline: '1706-1790',
        achievements: ['Founded first public library', 'Discovered electricity principles', 'Diplomat and statesman'],
        quotes: ['"Tell me and I forget, teach me and I may remember, involve me and I learn."', '"An investment in knowledge pays the best interest."'],
        personName: 'Benjamin Franklin',
        personImage: '👨‍🔬'
      },
      {
        id: 'franklin-2',
        title: 'The Experimenter',
        chapter: 2,
        content: 'Franklin\'s famous kite experiment in 1752 proved that lightning was electrical. This dangerous experiment changed our understanding of electricity forever.',
        historicalFact: 'The kite experiment was incredibly risky - Franklin could have been killed by the lightning bolt.',
        modernConnection: 'Franklin House students learn to take calculated risks in their learning, always prioritizing safety while pushing boundaries.',
        houseValues: ['Courage', 'Scientific Inquiry', 'Risk Assessment', 'Discovery'],
        timeline: '1740-1752',
        achievements: ['Proved lightning is electricity', 'Invented lightning rod', 'Founded scientific societies'],
        quotes: ['"Genius without education is like silver in the mine."', '"Energy and persistence conquer all things."'],
        personName: 'Benjamin Franklin',
        personImage: '⚡'
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
        title: 'The Pioneering Scientist',
        chapter: 1,
        content: 'Marie Curie was born Maria Sklodowska in Poland in 1867. Despite facing discrimination as a woman in science, she became the first woman to win a Nobel Prize.',
        historicalFact: 'Curie had to attend the "Flying University," an underground educational movement in Poland, as women were banned from Warsaw University.',
        modernConnection: 'Curie House students learn that barriers are meant to be broken through dedication, hard work, and scientific excellence.',
        houseValues: ['Scientific Excellence', 'Determination', 'Breaking Barriers', 'Research Innovation'],
        timeline: '1867-1934',
        achievements: ['First woman Nobel Prize winner', 'Discovered polonium and radium', 'Founded field of radioactivity'],
        quotes: ['"Nothing in life is to be feared, it is only to be understood."', '"I was taught that the way of progress was neither swift nor easy."'],
        personName: 'Marie Curie',
        personImage: '👩‍🔬'
      },
      {
        id: 'curie-2',
        title: 'The Double Nobel Laureate',
        chapter: 2,
        content: 'Marie Curie remains the only person to win Nobel Prizes in two different scientific fields - Physics (1903) and Chemistry (1911).',
        historicalFact: 'Curie\'s laboratory notebooks are still radioactive and will remain so for another 1,500 years.',
        modernConnection: 'Curie House students understand that groundbreaking research requires dedication and leaves a lasting impact on future generations.',
        houseValues: ['Excellence', 'Legacy Building', 'Interdisciplinary Learning', 'Scientific Impact'],
        timeline: '1895-1934',
        achievements: ['Two Nobel Prizes', 'Founded Radium Institute', 'Advanced medical X-ray technology'],
        quotes: ['"Science is the basis of human progress."', '"You cannot hope to build a better world without improving the individuals."'],
        personName: 'Marie Curie',
        personImage: '🧪'
      }
    ],
    nobel: [
      {
        id: 'nobel-1',
        title: 'The Achievement Pioneer',
        chapter: 1,
        content: 'Alfred Nobel was born in Stockholm in 1833 and became one of the wealthiest men of his time through his 355 inventions, including dynamite.',
        historicalFact: 'Nobel was called "the merchant of death" in a premature obituary, which motivated him to leave a better legacy.',
        modernConnection: 'Nobel House students learn that true achievement comes from using success to benefit others and create positive change.',
        houseValues: ['Excellence in Achievement', 'Legacy Thinking', 'Global Impact', 'Humanitarian Values'],
        timeline: '1833-1896',
        achievements: ['355 patents', 'Invented dynamite', 'Established Nobel Prize'],
        quotes: ['"Contentment is natural wealth, luxury is artificial poverty."', '"Hope is nature\'s veil for hiding truth\'s nakedness."'],
        personName: 'Alfred Nobel',
        personImage: '🏆'
      },
      {
        id: 'nobel-2',
        title: 'The Legacy Builder',
        chapter: 2,
        content: 'Nobel dedicated his entire fortune to establishing the Nobel Prizes, recognizing achievements in Physics, Chemistry, Medicine, Literature, and Peace.',
        historicalFact: 'The Nobel Prize fund was worth about $250 million in today\'s money when established.',
        modernConnection: 'Nobel House students understand that the highest achievement is lifting others up and recognizing excellence in all its forms.',
        houseValues: ['Recognition of Excellence', 'Global Citizenship', 'Philanthropic Spirit', 'Achievement Culture'],
        timeline: '1895-present',
        achievements: ['Nobel Prize establishment', 'Global recognition system', 'Centuries of inspiration'],
        quotes: ['"If I have a thousand ideas and only one turns out to be good, I am satisfied."', '"Justice is truth in action."'],
        personName: 'Alfred Nobel',
        personImage: '🎯'
      }
    ],
    lovelace: [
      {
        id: 'lovelace-1',
        title: 'The First Programmer',
        chapter: 1,
        content: 'Ada Lovelace, born in 1815, was the daughter of poet Lord Byron. She combined her father\'s creativity with her mother\'s love of mathematics.',
        historicalFact: 'Lovelace wrote the first computer program in 1843, nearly 100 years before the first computer was built.',
        modernConnection: 'Lovelace House students blend creativity with computational thinking to solve tomorrow\'s challenges.',
        houseValues: ['Computational Thinking', 'Creative Problem-Solving', 'Future Innovation', 'Algorithmic Excellence'],
        timeline: '1815-1852',
        achievements: ['First computer program', 'Analytical Engine collaboration', 'Mathematical innovation'],
        quotes: ['"The Analytical Engine might act upon other things besides number."', "That brain of mine is something more than merely mortal; as time will show."],
        personName: 'Ada Lovelace',
        personImage: '👩‍💻'
      },
      {
        id: 'lovelace-2',
        title: 'The Code Visionary',
        chapter: 2,
        content: 'Lovelace envisioned computers doing more than calculations - she imagined them composing music, creating art, and solving complex problems.',
        historicalFact: 'Lovelace predicted that computers could be programmed to follow instructions and perform any task that could be expressed algorithmically.',
        modernConnection: 'Lovelace House students code the future by combining logical thinking with creative imagination.',
        houseValues: ['Visionary Programming', 'Creative Algorithms', 'Future Technology', 'Digital Innovation'],
        timeline: '1840-1852',
        achievements: ['Computer programming concepts', 'Algorithmic thinking', 'Technology vision'],
        quotes: ['"Mathematical science shows us what is. It is the language of unseen relations between things."', '"I believe in the power of the analytical engine to revolutionize human thought."'],
        personName: 'Ada Lovelace',
        personImage: '💻'
      }
    ]
  };

  const getHouseIcon = (house: string) => {
    switch (house) {
      case 'franklin': return <FlaskConical className="h-8 w-8" />;
      case 'tesla': return <Zap className="h-8 w-8" />;
      case 'curie': return <FlaskConical className="h-8 w-8" />;
      case 'nobel': return <Target className="h-8 w-8" />;
      case 'lovelace': return <Computer className="h-8 w-8" />;
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
                onClick={() => setLocation("/student-dashboard")}
                className="flex items-center space-x-2 text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
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
                <span className="mt-2 font-semibold capitalize">{house}</span>
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