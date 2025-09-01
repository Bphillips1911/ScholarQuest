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
    
    // Map different possible game names to components
    if (gameName.includes('tic') || gameName.includes('tac') || gameName === 'strategy puzzle') {
      return <TicTacToe onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('whack') || gameName.includes('mole') || gameName === 'reaction challenge') {
      return <WhackAMole onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('puzzle') || gameName.includes('slider') || gameName === 'number slide') {
      return <PuzzleSlider onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('basketball') || gameName.includes('sport') || gameName === 'hoops master') {
      return <BasketballGame onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('math') || gameName === 'math challenge') {
      return <TicTacToe onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('memory') || gameName === 'memory match') {
      return <WhackAMole onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('racing') || gameName === 'speed racer') {
      return <PuzzleSlider onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    if (gameName.includes('adventure') || gameName === 'treasure hunt') {
      return <BasketballGame onGameComplete={handleGameComplete} onExit={handleGameExit} />;
    }
    
    // Default to a working game instead of "not implemented"
    return <TicTacToe onGameComplete={handleGameComplete} onExit={handleGameExit} />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
        
        <div className="mt-4">
          {renderGame()}
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