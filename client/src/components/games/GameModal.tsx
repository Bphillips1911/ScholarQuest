import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { TicTacToe } from "./TicTacToe";
import { WhackAMole } from "./WhackAMole";
import { PuzzleSlider } from "./PuzzleSlider";
import { BasketballGame } from "./Basketball";
import { RacingGame } from "./RacingGame";
import { BrickBreaker } from "./BrickBreaker";
import { MemoryMatch } from "./MemoryMatch";

interface GameModalProps {
  game: {
    id: string;
    name: string;
    description: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  isOpen: boolean;
  onClose: () => void;
}

export function GameModal({ game, isOpen, onClose }: GameModalProps) {
  const [gameScore, setGameScore] = useState<number | null>(null);
  const [gameTime, setGameTime] = useState<number | null>(null);

  const handleGameComplete = (score: number, duration: number) => {
    setGameScore(score);
    setGameTime(duration);
  };

  const handleGameExit = () => {
    onClose();
  };

  const renderGame = () => {
    const gameName = game.name.toLowerCase();
    
    // Exact game name mappings based on database
    if (gameName.includes('basketball')) {
      return <BasketballGame onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('whack') || gameName.includes('mole')) {
      return <WhackAMole onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('puzzle') || gameName.includes('slider') || gameName.includes('15-puzzle')) {
      return <PuzzleSlider onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('tic') || gameName.includes('tac')) {
      return <TicTacToe onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    // Map other games to appropriate existing components
    if (gameName.includes('memory') || gameName.includes('match')) {
      return <MemoryMatch onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('connect') || gameName.includes('four')) {
      return <TicTacToe onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('racing') || gameName.includes('championship')) {
      return <RacingGame onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('soccer') || gameName.includes('penalty')) {
      return <BasketballGame onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('word') || gameName.includes('search')) {
      return <PuzzleSlider onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('math') || gameName.includes('challenge')) {
      return <TicTacToe onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('chess') || gameName.includes('master')) {
      return <TicTacToe onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('space') || gameName.includes('invaders')) {
      return <WhackAMole onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('pac') || gameName.includes('man')) {
      return <WhackAMole onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('snake') || gameName.includes('adventure')) {
      return <WhackAMole onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('brick') || gameName.includes('breaker')) {
      return <BrickBreaker onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    // Default to Tic Tac Toe for strategy games
    return <TicTacToe onGameComplete={handleGameComplete} onExit={handleGameExit} />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] w-[95vw] h-[95vh] overflow-hidden p-2">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-bold">{game.name}</DialogTitle>
              <Badge variant={game.difficulty === 'easy' ? 'default' : game.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                {game.difficulty}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-gray-600 text-left">
            {game.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full w-full">
            {renderGame()}
          </div>
        </div>

        {gameScore !== null && gameTime !== null && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">Game Complete!</h3>
            <div className="flex gap-4 text-sm">
              <span className="text-green-700">Score: {gameScore}</span>
              <span className="text-green-700">Time: {Math.round(gameTime / 1000)}s</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}