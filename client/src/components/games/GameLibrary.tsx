import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Gamepad2, Car, Rocket, Clock, Lock, 
  Unlock, Star, Trophy, Puzzle, Target, Zap,
  PlayCircle, Pause, RotateCcw, Volume2, Circle
} from "lucide-react";
import type { Game, GameAccess, GameSession } from "@shared/schema";

interface GameLibraryProps {
  scholarId: string;
  isTeacher?: boolean;
}

interface GameWithAccess extends Game {
  access?: GameAccess;
  lastSession?: GameSession;
  isUnlocked: boolean;
  canPlay: boolean;
}

// Game category icons
const categoryIcons = {
  sports: Circle,
  puzzle: Puzzle,
  arcade: Target,
  strategy: Zap,
  racing: Car,
  adventure: Rocket,
};

// Difficulty colors
const difficultyColors = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800", 
  hard: "bg-red-100 text-red-800",
};

function GameCard({ game, onPlay, isTeacher = false, onGrantAccess }: {
  game: GameWithAccess;
  onPlay: (game: GameWithAccess) => void;
  isTeacher?: boolean;
  onGrantAccess?: (gameId: string) => void;
}) {
  const IconComponent = categoryIcons[game.category as keyof typeof categoryIcons] || Gamepad2;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <Card className={`relative overflow-hidden transition-all duration-300 ${
        game.canPlay ? 'hover:shadow-lg cursor-pointer' : 'opacity-60'
      }`}>
        {/* Unlock Status Indicator */}
        <div className="absolute top-2 right-2 z-10">
          {game.canPlay ? (
            <Unlock className="w-5 h-5 text-green-500" />
          ) : (
            <Lock className="w-5 h-5 text-gray-400" />
          )}
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              game.canPlay ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{game.name}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className={difficultyColors[game.difficulty as keyof typeof difficultyColors]}>
                  {game.difficulty}
                </Badge>
                <Badge variant="secondary">
                  {game.category}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">{game.description}</p>
          
          {/* Requirements */}
          {!game.canPlay && (
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
              {game.badgeRequired ? (
                <span>🏆 Badge required to unlock</span>
              ) : (
                <span>⭐ {game.pointsRequired} points needed</span>
              )}
            </div>
          )}

          {/* Last Session Info */}
          {game.lastSession && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              Last played: {new Date(game.lastSession.startedAt).toLocaleDateString()}
              {game.lastSession.score > 0 && (
                <span className="ml-2">• Best score: {game.lastSession.score}</span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {game.canPlay ? (
              <Button 
                onClick={() => onPlay(game)}
                className="flex-1"
                size="sm"
              >
                <PlayCircle className="w-4 h-4 mr-1" />
                Play Game
              </Button>
            ) : isTeacher && onGrantAccess ? (
              <Button 
                onClick={() => onGrantAccess(game.id)}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <Unlock className="w-4 h-4 mr-1" />
                Grant Access
              </Button>
            ) : (
              <Button 
                disabled
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <Lock className="w-4 h-4 mr-1" />
                Locked
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function GameLibrary({ scholarId, isTeacher = false }: GameLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGame, setSelectedGame] = useState<GameWithAccess | null>(null);

  // Fetch games with access status
  const { data: games = [], isLoading } = useQuery({
    queryKey: ['/api/games', scholarId],
    enabled: !!scholarId,
  });

  // Group games by category
  const gamesByCategory = games.reduce((acc: Record<string, GameWithAccess[]>, game: GameWithAccess) => {
    if (!acc[game.category]) acc[game.category] = [];
    acc[game.category].push(game);
    return acc;
  }, {});

  const categories = ["all", ...Object.keys(gamesByCategory)];
  
  const filteredGames = selectedCategory === "all" 
    ? games 
    : gamesByCategory[selectedCategory] || [];

  const unlockedCount = games.filter((g: GameWithAccess) => g.canPlay).length;
  const totalCount = games.length;

  const handlePlayGame = (game: GameWithAccess) => {
    setSelectedGame(game);
    // Game will be loaded in modal/fullscreen
  };

  const handleGrantAccess = async (gameId: string) => {
    try {
      const response = await fetch(`/api/teacher/grant-game-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify({ 
          scholarId, 
          gameId,
          expiresIn: 30 // 30 days access
        })
      });
      
      if (response.ok) {
        // Refresh games list
        window.location.reload();
      }
    } catch (error) {
      console.error('Error granting game access:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Game Library</h2>
          <p className="text-gray-600">
            {unlockedCount} of {totalCount} games unlocked
          </p>
        </div>
        
        {/* Progress Ring */}
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              cx="32"
              cy="32" 
              r="28"
              stroke="#e5e7eb"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#3b82f6"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${(unlockedCount / totalCount) * 175.93} 175.93`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold">
              {Math.round((unlockedCount / totalCount) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Games</TabsTrigger>
          <TabsTrigger value="sports">Sports</TabsTrigger>
          <TabsTrigger value="puzzle">Puzzle</TabsTrigger>
          <TabsTrigger value="arcade">Arcade</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="racing">Racing</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {/* Games Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            layout
          >
            <AnimatePresence>
              {filteredGames.map((game: GameWithAccess) => (
                <motion.div
                  key={game.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <GameCard 
                    game={game}
                    onPlay={handlePlayGame}
                    isTeacher={isTeacher}
                    onGrantAccess={isTeacher ? handleGrantAccess : undefined}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredGames.length === 0 && (
            <div className="text-center py-12">
              <Gamepad2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No games found in this category</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Game Modal will be rendered here when selectedGame is set */}
      {selectedGame && (
        <GameModal 
          game={selectedGame} 
          onClose={() => setSelectedGame(null)}
          scholarId={scholarId}
        />
      )}
    </div>
  );
}

// Game Modal Component (placeholder for now)
function GameModal({ game, onClose, scholarId }: {
  game: GameWithAccess;
  onClose: () => void;
  scholarId: string;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{game.name}</h3>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>
        
        <div className="text-center py-12">
          <Gamepad2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Game will be loaded here</p>
          <p className="text-sm text-gray-500 mt-2">Component: {game.gamePath}</p>
        </div>
      </div>
    </div>
  );
}