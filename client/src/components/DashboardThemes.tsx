import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Palette, 
  Star, 
  Moon, 
  Sun, 
  Zap, 
  FlaskConical,
  Target,
  Computer,
  Check,
  X
} from "lucide-react";

interface Theme {
  id: string;
  name: string;
  description: string;
  background: string;
  accent: string;
  preview: string;
  icon: any;
  unlocked: boolean;
  requirement?: string;
}

interface DashboardThemesProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
  studentData: any;
}

export function DashboardThemes({ 
  isOpen, 
  onClose, 
  currentTheme, 
  onThemeChange,
  studentData 
}: DashboardThemesProps) {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);

  const themes: Theme[] = [
    {
      id: 'default',
      name: 'BHSA Traditional',
      description: 'The classic BHSA experience with traditional school colors',
      background: 'from-slate-900 via-purple-900 to-slate-900',
      accent: 'from-blue-600 to-purple-600',
      preview: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
      icon: Star,
      unlocked: true
    },
    {
      id: 'kelly-green',
      name: 'Kelly Green',
      description: 'Fresh and vibrant green theme for nature lovers',
      background: 'from-green-900 via-emerald-900 to-slate-900',
      accent: 'from-green-500 to-emerald-500',
      preview: 'linear-gradient(135deg, #14532d 0%, #047857 50%, #0f172a 100%)',
      icon: Target,
      unlocked: true
    },
    {
      id: 'gold',
      name: 'Golden Excellence',
      description: 'Luxurious gold theme representing achievement and success',
      background: 'from-yellow-900 via-amber-900 to-orange-900',
      accent: 'from-yellow-400 to-amber-400',
      preview: 'linear-gradient(135deg, #78350f 0%, #d97706 50%, #ea580c 100%)',
      icon: Star,
      unlocked: true
    },
    {
      id: 'orange',
      name: 'Energetic Orange',
      description: 'Vibrant orange theme for creativity and enthusiasm',
      background: 'from-orange-900 via-red-900 to-slate-900',
      accent: 'from-orange-500 to-red-500',
      preview: 'linear-gradient(135deg, #9a3412 0%, #7f1d1d 50%, #0f172a 100%)',
      icon: Computer,
      unlocked: true
    },
    {
      id: 'dark',
      name: 'Midnight Scholar',
      description: 'Dark mode for focused late-night studying',
      background: 'from-gray-900 via-slate-900 to-black',
      accent: 'from-gray-600 to-slate-600',
      preview: 'linear-gradient(135deg, #111827 0%, #0f172a 50%, #000000 100%)',
      icon: Moon,
      unlocked: (studentData?.academicPoints || 0) >= 50,
      requirement: 'Earn 50+ Academic Points'
    },
    {
      id: 'light',
      name: 'Sunrise Energy',
      description: 'Bright and energizing theme for morning motivation',
      background: 'from-yellow-100 via-orange-100 to-pink-100',
      accent: 'from-yellow-500 to-orange-500',
      preview: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fce7f3 100%)',
      icon: Sun,
      unlocked: (studentData?.behaviorPoints || 0) >= 50,
      requirement: 'Earn 50+ Behavior Points'
    },
    {
      id: 'champion',
      name: 'MUSTANG Champion',
      description: 'Elite theme for top performers with premium styling',
      background: 'from-purple-900 via-indigo-900 to-blue-900',
      accent: 'from-purple-400 to-blue-400',
      preview: 'linear-gradient(135deg, #581c87 0%, #312e81 50%, #1e3a8a 100%)',
      icon: Star,
      unlocked: ((studentData?.academicPoints || 0) + (studentData?.behaviorPoints || 0)) >= 150,
      requirement: 'Earn 150+ Total Points'
    }
  ];

  const handleThemeSelect = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme && theme.unlocked) {
      setSelectedTheme(themeId);
      onThemeChange(themeId);
      localStorage.setItem('studentDashboardTheme', themeId);
    }
  };

  // Load saved theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('studentDashboardTheme');
    if (savedTheme) {
      setSelectedTheme(savedTheme);
      onThemeChange(savedTheme);
    }
  }, [onThemeChange]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Palette className="h-6 w-6 text-blue-600" />
                  <div>
                    <h2 className="text-2xl font-bold">Dashboard Themes</h2>
                    <p className="text-gray-600 dark:text-gray-300">Customize your learning environment</p>
                  </div>
                </div>
                <Button variant="ghost" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themes.map((theme) => {
                  const IconComponent = theme.icon;
                  const isSelected = selectedTheme === theme.id;
                  const isUnlocked = theme.unlocked;

                  return (
                    <motion.div
                      key={theme.id}
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      } ${!isUnlocked ? 'opacity-60' : ''}`}
                      onClick={() => handleThemeSelect(theme.id)}
                      whileHover={isUnlocked ? { scale: 1.02 } : {}}
                      whileTap={isUnlocked ? { scale: 0.98 } : {}}
                    >
                      {/* Theme Preview */}
                      <div 
                        className="w-full h-24 rounded-lg mb-3 relative overflow-hidden"
                        style={{ background: theme.preview }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <IconComponent className="h-8 w-8 text-white opacity-80" />
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-5 w-5 text-white bg-blue-500 rounded-full p-1" />
                          </div>
                        )}
                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="text-sm">🔒</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Theme Info */}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {theme.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {theme.description}
                        </p>
                        {!isUnlocked && theme.requirement && (
                          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                            🔒 {theme.requirement}
                          </p>
                        )}
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Theme Statistics */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Unlocking Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Themes Unlocked</span>
                      <span>{themes.filter(t => t.unlocked).length}/{themes.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(themes.filter(t => t.unlocked).length / themes.length) * 100}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Unlock more themes by earning points and joining different houses!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}