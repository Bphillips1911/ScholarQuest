import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Trophy, RotateCcw } from "lucide-react";

interface MemoryMatchProps {
  onGameComplete: (score: number, duration: number) => void;
  onExit: () => void;
}

interface MemoryCard {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export function MemoryMatch({ onGameComplete, onExit }: MemoryMatchProps) {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);

  const cardValues = ['🏠', '📚', '⭐', '🎯', '🏆', '🎨', '🔬', '🎵'];

  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState, startTime]);

  const initializeGame = () => {
    const shuffledCards = [...cardValues, ...cardValues]
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false
      }));
    
    setCards(shuffledCards);
    setFlippedCards([]);
    setScore(0);
    setMoves(0);
    setTimeElapsed(0);
    setStartTime(Date.now());
  };

  const handleCardClick = (cardId: number) => {
    if (gameState !== 'playing') return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard?.value === secondCard?.value) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isMatched: true } 
              : c
          ));
          setScore(prev => prev + 10);
          setFlippedCards([]);
          
          // Check if game is complete
          if (cards.filter(c => !c.isMatched).length === 2) {
            setGameState('ended');
          }
        }, 1000);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isFlipped: false } 
              : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const startGame = () => {
    setGameState('playing');
    initializeGame();
  };

  useEffect(() => {
    if (gameState === 'ended') {
      const finalScore = Math.max(0, 100 - moves * 2 + Math.floor(score / 10));
      onGameComplete(finalScore, timeElapsed);
    }
  }, [gameState, moves, score, timeElapsed, onGameComplete]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-purple-500" />
          <span className="text-xl font-bold">Memory Match</span>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">Score: {score}</Badge>
          <Badge variant="outline">Moves: {moves}</Badge>
          <Badge variant="outline">Time: {timeElapsed}s</Badge>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-4 p-4">
        {gameState === 'ready' && (
          <div className="text-center space-y-4">
            <Button onClick={startGame} size="lg" className="bg-purple-600 hover:bg-purple-700">
              Start Memory Challenge
            </Button>
            <p className="text-sm text-gray-600">Match all pairs to win!</p>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="flex justify-center">
            <div className="grid grid-cols-4 gap-4 max-w-md">
              {cards.map((card) => (
                <motion.div
                  key={card.id}
                  className="w-16 h-16 cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCardClick(card.id)}
                >
                  <div className="w-full h-full relative preserve-3d">
                    <motion.div
                      className="absolute inset-0 w-full h-full rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold backface-hidden"
                      animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      ?
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 w-full h-full rounded-lg bg-white border-2 border-gray-300 flex items-center justify-center text-2xl backface-hidden"
                      style={{ rotateY: '180deg' }}
                      animate={{ rotateY: card.isFlipped || card.isMatched ? 0 : -180 }}
                      transition={{ duration: 0.3 }}
                    >
                      {card.value}
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'ended' && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <span>Congratulations!</span>
            </div>
            <div className="text-lg">
              <p>Final Score: {Math.max(0, 100 - moves * 2 + Math.floor(score / 10))}</p>
              <p>Completed in {moves} moves and {timeElapsed} seconds</p>
            </div>
            <div className="flex justify-center space-x-2">
              <Button onClick={startGame} className="bg-purple-600 hover:bg-purple-700">
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
              <Button onClick={onExit} variant="outline">Exit</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}