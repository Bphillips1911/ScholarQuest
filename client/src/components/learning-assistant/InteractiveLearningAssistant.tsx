import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterAnimations, houseCharacters } from './CharacterAnimations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, HelpCircle, BookOpen, Trophy, Target, Sparkles, Volume2, VolumeX, X, Heart, Star } from 'lucide-react';

interface LearningTip {
  id: string;
  category: 'academic' | 'behavior' | 'house' | 'achievement';
  title: string;
  content: string;
  houseSpecific?: string;
}

interface InteractiveLearningAssistantProps {
  studentHouse?: string;
  studentPoints?: {
    academic: number;
    behavior: number;
    attendance: number;
  };
  onHelpRequest?: (topic: string) => void;
}

export function InteractiveLearningAssistant({ 
  studentHouse = 'franklin', 
  studentPoints = { academic: 0, behavior: 0, attendance: 0 },
  onHelpRequest 
}: InteractiveLearningAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(
    houseCharacters.find(c => c.house.toLowerCase() === studentHouse.toLowerCase()) || houseCharacters[0]
  );
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [showQuickHelp, setShowQuickHelp] = useState(true);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [learningTips] = useState<LearningTip[]>([
    {
      id: 'mood-tracker-tip',
      category: 'academic',
      title: 'Mood Tracker Benefits',
      content: 'The Mood Tracker helps you understand how your emotions affect your learning. Log your mood daily and set goals to improve your mindset and academic performance!',
    },
    {
      id: 'learning-path-tip',
      category: 'academic', 
      title: 'Learning Path Power',
      content: 'Your Learning Path is personalized just for you! Choose from Academic Excellence, Character Development, House Leadership, or STEAM Innovation tracks to boost your growth.',
    },
    {
      id: 'skill-tree-tip',
      category: 'achievement',
      title: 'Skill Tree Mastery',
      content: 'The Skill Tree shows your progress across Academic, Behavioral, Social, and Leadership skills. Earn points to unlock new achievements and work toward legendary status!',
    },
    {
      id: 'house-history-tip',
      category: 'house',
      title: 'House History Magic',
      content: 'Discover the amazing stories of your house founder! Learn how Franklin, Tesla, Curie, Nobel, or Lovelace changed the world through STEAM innovation and perseverance.',
    },
    {
      id: 'mustang-traits-tip',
      category: 'behavior',
      title: 'MUSTANG Power',
      content: 'MUSTANG traits are your guide to success: Make good choices, Use kind words, Show school pride, Tolerant of others, Aim for excellence, Need to be responsible, Give 100% everyday!',
    },
    {
      id: 'dashboard-themes-tip',
      category: 'achievement',
      title: 'Dashboard Themes',
      content: 'Unlock beautiful dashboard themes by earning points! Choose from Traditional, Kelly Green, Gold, Orange, Midnight Scholar, Sunrise Energy, and MUSTANG Champion themes.',
    }
  ]);

  const translations = {
    en: {
      welcomeMessages: [
        `Hello! I'm ${currentCharacter.name}, your ${currentCharacter.house} learning buddy! 🌟`,
        `Ready to explore and learn together? I'm here to help you succeed! 📚`,
        `Your house spirit is strong! I'm here to help you earn more points and learn new things.`,
        `Need some study tips or want to know more about your house? I'm here to help!`
      ],
      featureExplanations: {
        'mood-tracker': {
          title: 'Mood Tracker',
          explanation: 'Track your daily emotions and set personal goals to improve your mindset and academic performance. Use emojis to log how you feel and reflect on your day!',
          benefits: ['Better self-awareness', 'Improved emotional intelligence', 'Academic performance insights', 'Daily goal setting']
        },
        'learning-path': {
          title: 'Learning Path',
          explanation: 'Follow personalized learning journeys designed to help you grow academically and personally. Choose from four exciting tracks based on your interests and goals!',
          benefits: ['Personalized education', 'Clear progression milestones', 'Achievement badges', 'Skill development']
        },
        'skill-tree': {
          title: 'Skill Tree',
          explanation: 'Visualize your growth across Academic, Behavioral, Social, and Leadership skills. Earn points to unlock new achievements and progress toward legendary status!',
          benefits: ['Gamified learning', 'Visual progress tracking', 'Skill connections', 'Achievement celebrations']
        },
        'house-history': {
          title: 'House History',
          explanation: 'Explore immersive stories about your house founder and learn how they changed the world through innovation, perseverance, and STEAM excellence!',
          benefits: ['Historical inspiration', 'Audio narration', 'House pride building', 'STEAM connection']
        }
      },
      quickHelpExplanations: {
        'academic': 'Study Tips help you learn better with proven techniques like the 25-minute study method, Cornell note-taking, and effective time management strategies.',
        'behavior': 'MUSTANG Tips teach you the 7 traits of excellence: Make good choices, Use kind words, Show school pride, Tolerant of others, Aim for excellence, Need to be responsible, Give 100% everyday.',
        'house': 'House Points strategies show you how to earn points through participation, helping classmates, showing excellent behavior, and contributing to your house victory.',
        'achievement': 'Goal setting guides help you create SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound) and track your daily progress effectively.'
      },
      tabOverviews: {
        'dashboard': 'Your main dashboard shows your current points, house standings, recent achievements, and quick access to all platform features. Customize themes and track your legendary status progress.',
        'mood-tracker': 'The Mood Tracker helps you log daily emotions using fun emojis and set personal goals. Research shows that students who track their mood perform 23% better academically!',
        'learning-path': 'Learning Paths offer four personalized tracks: Academic Excellence (study mastery), Character Development (MUSTANG traits), House Leadership (team skills), and STEAM Innovation (creative problem-solving).',
        'skill-tree': 'The Skill Tree gamifies your growth across Academic, Behavioral, Social, and Leadership areas. Earn points to unlock new skills, watch celebration animations, and work toward 1000 points for legendary status!',
        'house-history': 'House History features immersive storytelling about your house founder with audio narration. Learn how Franklin, Tesla, Curie, Nobel, or Lovelace overcame challenges to achieve greatness in STEAM fields.'
      }
    },
    es: {
      welcomeMessages: [
        `¡Hola! Soy ${currentCharacter.name}, tu compañero de aprendizaje de ${currentCharacter.house}! 🌟`,
        `¿Listo para explorar y aprender juntos? ¡Estoy aquí para ayudarte a tener éxito! 📚`,
        `¡Tu espíritu de casa es fuerte! Estoy aquí para ayudarte a ganar más puntos y aprender cosas nuevas.`,
        `¿Necesitas consejos de estudio o quieres saber más sobre tu casa? ¡Estoy aquí para ayudar!`
      ],
      featureExplanations: {
        'mood-tracker': {
          title: 'Rastreador de Estado de Ánimo',
          explanation: '¡Rastrea tus emociones diarias y establece metas personales para mejorar tu mentalidad y rendimiento académico. Usa emojis para registrar cómo te sientes y reflexionar sobre tu día!',
          benefits: ['Mejor autoconciencia', 'Inteligencia emocional mejorada', 'Perspectivas de rendimiento académico', 'Establecimiento de metas diarias']
        },
        'learning-path': {
          title: 'Ruta de Aprendizaje',
          explanation: '¡Sigue viajes de aprendizaje personalizados diseñados para ayudarte a crecer académica y personalmente. Elige entre cuatro pistas emocionantes basadas en tus intereses y metas!',
          benefits: ['Educación personalizada', 'Hitos de progreso claros', 'Insignias de logros', 'Desarrollo de habilidades']
        },
        'skill-tree': {
          title: 'Árbol de Habilidades',
          explanation: '¡Visualiza tu crecimiento en habilidades Académicas, Conductuales, Sociales y de Liderazgo. Gana puntos para desbloquear nuevos logros y progresa hacia el estatus legendario!',
          benefits: ['Aprendizaje gamificado', 'Seguimiento visual de progreso', 'Conexiones de habilidades', 'Celebraciones de logros']
        },
        'house-history': {
          title: 'Historia de la Casa',
          explanation: '¡Explora historias inmersivas sobre el fundador de tu casa y aprende cómo cambiaron el mundo a través de la innovación, perseverancia y excelencia STEAM!',
          benefits: ['Inspiración histórica', 'Narración de audio', 'Construcción de orgullo de casa', 'Conexión STEAM']
        }
      },
      quickHelpExplanations: {
        'academic': 'Los Consejos de Estudio te ayudan a aprender mejor con técnicas probadas como el método de estudio de 25 minutos, tomar notas Cornell y estrategias efectivas de manejo del tiempo.',
        'behavior': 'Los Consejos MUSTANG te enseñan los 7 rasgos de excelencia: Tomar buenas decisiones, Usar palabras amables, Mostrar orgullo escolar, Ser tolerante con otros, Aspirar a la excelencia, Necesidad de ser responsable, Dar el 100% todos los días.',
        'house': 'Las estrategias de Puntos de Casa te muestran cómo ganar puntos a través de la participación, ayudar a compañeros, mostrar excelente comportamiento y contribuir a la victoria de tu casa.',
        'achievement': 'Las guías de establecimiento de metas te ayudan a crear metas SMART (Específicas, Medibles, Alcanzables, Relevantes, Con tiempo límite) y rastrear tu progreso diario efectivamente.'
      },
      tabOverviews: {
        'dashboard': 'Tu panel principal muestra tus puntos actuales, clasificaciones de casa, logros recientes y acceso rápido a todas las características de la plataforma. Personaliza temas y rastrea tu progreso de estatus legendario.',
        'mood-tracker': '¡El Rastreador de Estado de Ánimo te ayuda a registrar emociones diarias usando emojis divertidos y establecer metas personales. La investigación muestra que los estudiantes que rastrean su estado de ánimo rinden 23% mejor académicamente!',
        'learning-path': 'Las Rutas de Aprendizaje ofrecen cuatro pistas personalizadas: Excelencia Académica (dominio de estudio), Desarrollo de Carácter (rasgos MUSTANG), Liderazgo de Casa (habilidades de equipo) e Innovación STEAM (resolución creativa de problemas).',
        'skill-tree': '¡El Árbol de Habilidades gamifica tu crecimiento en áreas Académicas, Conductuales, Sociales y de Liderazgo. Gana puntos para desbloquear nuevas habilidades, ver animaciones de celebración y trabajar hacia 1000 puntos para el estatus legendario!',
        'house-history': 'La Historia de la Casa presenta narración inmersiva sobre el fundador de tu casa con narración de audio. Aprende cómo Franklin, Tesla, Curie, Nobel o Lovelace superaron desafíos para lograr grandeza en campos STEAM.'
      }
    }
  };

  const currentTranslation = translations[language];
  const featureExplanations = currentTranslation.featureExplanations;
  const welcomeMessages = currentTranslation.welcomeMessages;

  // Text-to-speech functionality
  const speakMessage = (message: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;

    // Set language for speech
    utterance.lang = language === 'es' ? 'es-ES' : 'en-US';

    // Try to find a friendly voice in the selected language
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.includes(language === 'es' ? 'es' : 'en') && (
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Karen') ||
        voice.name.includes('Diego') ||
        voice.name.includes('Monica')
      )
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (currentMessage) {
      speakMessage(currentMessage);
    }
  };

  useEffect(() => {
    if (isOpen && !currentMessage) {
      const welcomeMsg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      setCurrentMessage(welcomeMsg);
      
      // Auto-speak welcome message after a short delay
      setTimeout(() => {
        if (speechEnabled) {
          speakMessage(welcomeMsg);
        }
      }, 1000);
    }
  }, [isOpen]);

  useEffect(() => {
    // Speak new messages when they change
    if (currentMessage && isOpen && speechEnabled) {
      setTimeout(() => {
        speakMessage(currentMessage);
      }, 500);
    }
  }, [currentMessage, speechEnabled]);

  const handleCharacterClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setCurrentMessage(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const explanation = currentTranslation.quickHelpExplanations[category as keyof typeof currentTranslation.quickHelpExplanations];
    if (explanation) {
      setCurrentMessage(`💡 ${explanation}`);
    } else {
      const categoryTips = learningTips.filter(tip => 
        tip.category === category && 
        (!tip.houseSpecific || tip.houseSpecific === studentHouse.toLowerCase())
      );
      
      if (categoryTips.length > 0) {
        const randomTip = categoryTips[Math.floor(Math.random() * categoryTips.length)];
        setCurrentMessage(`💡 ${randomTip.title}: ${randomTip.content}`);
      }
    }
  };

  const handleTabOverview = (tab: string) => {
    const overview = currentTranslation.tabOverviews[tab as keyof typeof currentTranslation.tabOverviews];
    if (overview) {
      setCurrentMessage(`📋 ${overview}`);
    }
  };

  const handleHelpRequest = (topic: string) => {
    if (featureExplanations[topic as keyof typeof featureExplanations]) {
      const feature = featureExplanations[topic as keyof typeof featureExplanations];
      setCurrentMessage(`📚 ${feature.title}: ${feature.explanation} Benefits include: ${feature.benefits.join(', ')}. Want to explore this feature now?`);
    } else {
      setCurrentMessage(`Great question about ${topic}! Let me help you with that...`);
    }
    onHelpRequest?.(topic);
  };

  const handleFeatureExplanation = (featureName: string) => {
    const feature = featureExplanations[featureName as keyof typeof featureExplanations];
    if (feature) {
      setCurrentMessage(`📚 ${feature.title}: ${feature.explanation} Key benefits: ${feature.benefits.join(', ')}. Ready to try it?`);
    }
  };

  const getMotivationalMessage = () => {
    const totalPoints = studentPoints.academic + studentPoints.behavior + studentPoints.attendance;
    
    if (totalPoints >= 100) {
      return `Wow! You have ${totalPoints} total points! You're a true ${currentCharacter.house} champion! 🏆`;
    } else if (totalPoints >= 50) {
      return `Great job! ${totalPoints} points shows real dedication to ${currentCharacter.house}! Keep it up! ⭐`;
    } else {
      return `You're off to a good start with ${totalPoints} points! Every point brings ${currentCharacter.house} closer to victory! 💪`;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Character */}
      <CharacterAnimations
        character={currentCharacter}
        isActive={isOpen}
        message={currentMessage}
        onInteraction={handleCharacterClick}
      />

      {/* Learning Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-full max-w-md max-h-[80vh]">
              <Card className={`shadow-xl border-2 border-${currentCharacter.color}-200 bg-white h-full flex flex-col overflow-hidden`}>
              {/* Header - Fixed at top */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="text-2xl">{currentCharacter.avatar}</div>
                  <div>
                    <h3 className={`font-bold text-${currentCharacter.color}-600`}>
                      {currentCharacter.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {language === 'es' ? 'Asistente de Aprendizaje' : 'Learning Assistant'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {/* Language Toggle - Make it prominent */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                    className={`text-xs px-2 py-1 font-semibold ${language === 'es' ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-blue-100 text-blue-700 border-blue-300'}`}
                    title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                  >
                    {language === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
                  </Button>
                  
                  {/* Speech Controls */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSpeech}
                    className={`${isSpeaking ? 'text-green-600' : 'text-gray-400'} hover:text-gray-600`}
                    disabled={!currentMessage}
                    title={isSpeaking ? 'Stop speaking' : 'Read message aloud'}
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  
                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      stopSpeaking();
                      setIsOpen(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    title="Close assistant"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Message Display */}
                <div className={`p-3 rounded-lg bg-${currentCharacter.color}-50 border border-${currentCharacter.color}-200`}>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {currentMessage || `Hi! I'm ${currentCharacter.name}, ready to help you succeed! 🌟`}
                  </p>
                </div>

                {/* Quick Help Toggle */}
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">
                    {language === 'es' ? '¿Cómo puedo ayudarte?' : 'How can I help you?'}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuickHelp(!showQuickHelp)}
                    className={`text-xs px-2 py-1 ${showQuickHelp ? 'text-blue-600' : 'text-gray-400'}`}
                  >
                    {showQuickHelp 
                      ? (language === 'es' ? 'Ayuda Rápida' : 'Quick Help')
                      : (language === 'es' ? 'Ayuda de Funciones' : 'Feature Help')
                    }
                  </Button>
                </div>

                {/* Quick Help or Feature Explanations */}
                {showQuickHelp ? (
                  <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCategorySelect('academic')}
                    className={`flex items-center space-x-1 border-${currentCharacter.color}-200 hover:bg-${currentCharacter.color}-50`}
                  >
                    <BookOpen className="w-3 h-3" />
                    <span className="text-xs">
                      {language === 'es' ? 'Consejos de Estudio' : 'Study Tips'}
                    </span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCategorySelect('behavior')}
                    className={`flex items-center space-x-1 border-${currentCharacter.color}-200 hover:bg-${currentCharacter.color}-50`}
                  >
                    <Target className="w-3 h-3" />
                    <span className="text-xs">
                      {language === 'es' ? 'Consejos MUSTANG' : 'MUSTANG Tips'}
                    </span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCategorySelect('house')}
                    className={`flex items-center space-x-1 border-${currentCharacter.color}-200 hover:bg-${currentCharacter.color}-50`}
                  >
                    <Trophy className="w-3 h-3" />
                    <span className="text-xs">
                      {language === 'es' ? 'Puntos de Casa' : 'House Points'}
                    </span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCategorySelect('achievement')}
                    className={`flex items-center space-x-1 border-${currentCharacter.color}-200 hover:bg-${currentCharacter.color}-50`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span className="text-xs">
                      {language === 'es' ? 'Metas' : 'Goals'}
                    </span>
                  </Button>
                </div>
                ) : (
                  <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeatureExplanation('mood-tracker')}
                    className="w-full justify-start text-xs p-2 h-auto border-blue-200 hover:bg-blue-50"
                  >
                    <Heart className="w-3 h-3 mr-2" />
                    <span>
                      {language === 'es' ? '¿Qué es el Rastreador de Estado de Ánimo?' : 'What is Mood Tracker?'}
                    </span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeatureExplanation('learning-path')}
                    className="w-full justify-start text-xs p-2 h-auto border-green-200 hover:bg-green-50"
                  >
                    <Target className="w-3 h-3 mr-2" />
                    <span>
                      {language === 'es' ? '¿Cómo funciona la Ruta de Aprendizaje?' : 'How does Learning Path work?'}
                    </span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeatureExplanation('skill-tree')}
                    className="w-full justify-start text-xs p-2 h-auto border-purple-200 hover:bg-purple-50"
                  >
                    <Star className="w-3 h-3 mr-2" />
                    <span>
                      {language === 'es' ? 'Explica el sistema del Árbol de Habilidades' : 'Explain the Skill Tree system'}
                    </span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeatureExplanation('house-history')}
                    className="w-full justify-start text-xs p-2 h-auto border-orange-200 hover:bg-orange-50"
                  >
                    <BookOpen className="w-3 h-3 mr-2" />
                    <span>
                      {language === 'es' ? 'Cuéntame sobre la Historia de la Casa' : 'Tell me about House History'}
                    </span>
                  </Button>
                </div>
              )}

                {/* Tab Overview Section */}
                <div className="pt-3 border-t border-gray-200">
                  <h5 className="text-xs font-semibold text-gray-600 mb-2">
                    {language === 'es' ? 'Vista General de Pestañas:' : 'Tab Overviews:'}
                  </h5>
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTabOverview('dashboard')}
                      className="text-xs p-1 h-auto text-left justify-start"
                    >
                      {language === 'es' ? 'Tablero' : 'Dashboard'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTabOverview('mood-tracker')}
                      className="text-xs p-1 h-auto text-left justify-start"
                    >
                      {language === 'es' ? 'Estado de Ánimo' : 'Mood Tracker'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTabOverview('learning-path')}
                      className="text-xs p-1 h-auto text-left justify-start"
                    >
                      {language === 'es' ? 'Ruta de Aprendizaje' : 'Learning Path'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTabOverview('skill-tree')}
                      className="text-xs p-1 h-auto text-left justify-start"
                    >
                      {language === 'es' ? 'Árbol de Habilidades' : 'Skill Tree'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTabOverview('house-history')}
                      className="text-xs p-1 h-auto text-left justify-start col-span-2"
                    >
                      {language === 'es' ? 'Historia de la Casa' : 'House History'}
                    </Button>
                  </div>
                </div>

                {/* Motivational Section */}
                <div className={`bg-${currentCharacter.color}-50 rounded-lg p-3`}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">
                    {language === 'es' ? 'Tu Progreso' : 'Your Progress'}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {getMotivationalMessage()}
                  </p>
                </div>

                {/* Settings */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-500">
                      {language === 'es' ? 'Configuraciones:' : 'Settings:'}
                    </p>
                    {/* Voice Toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSpeechEnabled(!speechEnabled)}
                      className={`text-xs px-2 py-1 ${speechEnabled ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {speechEnabled 
                        ? (language === 'es' ? 'Voz: ON' : 'Voice: ON') 
                        : (language === 'es' ? 'Voz: OFF' : 'Voice: OFF')
                      }
                    </Button>
                  </div>
                  
                  {/* Character Selector */}
                  <p className="text-xs text-gray-500 mb-2">
                    {language === 'es' ? 'Elige tu compañero de aprendizaje:' : 'Choose your learning buddy:'}
                  </p>
                  <div className="flex space-x-2 pb-2">
                    {houseCharacters.map((character) => (
                      <button
                        key={character.id}
                        onClick={() => {
                          setCurrentCharacter(character);
                          const message = language === 'es' 
                            ? `¡Hola! Soy ${character.name}, tu nuevo compañero de aprendizaje de ${character.house}!`
                            : `Hi! I'm ${character.name}, your new ${character.house} learning buddy!`;
                          if (speechEnabled) {
                            speakMessage(message);
                          }
                        }}
                        className={`w-8 h-8 rounded-full border-2 ${
                          currentCharacter.id === character.id
                            ? `border-${character.color}-400`
                            : 'border-gray-200'
                        } flex items-center justify-center text-sm hover:scale-110 transition-transform`}
                        title={`${character.name} from ${character.house}`}
                      >
                        {character.avatar}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              stopSpeaking();
              setIsOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}