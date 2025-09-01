import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, Target, Clock } from "lucide-react";

interface WhackAMoleProps {
  onGameComplete: (score: number, duration: number) => void;
  onExit: () => void;
}

interface Mole {
  id: number;
  position: number;
  isUp: boolean;
  timeLeft: number;
}

type GameState = 'ready' | 'playing' | 'ended';

export function WhackAMole({ onGameComplete, onExit }: WhackAMoleProps) {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [moles, setMoles] = useState<Mole[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [startTime, setStartTime] = useState(0);
  
  const moleIdRef = useRef(0);
  const gameLoopRef = useRef<number>();
  const timerRef = useRef<number>();
  const moleSpawnRef = useRef<number>();

  const BOARD_SIZE = 9; // 3x3 grid
  const MOLE_UP_TIME = 2000; // 2 seconds
  const SPAWN_INTERVAL = 800; // Spawn new mole every 800ms

  // Start game
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setMoles([]);
    setTimeLeft(30);
    setCombo(0);
    setMaxCombo(0);
    setStartTime(Date.now());

    // Start timer
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('ended');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start mole spawning
    spawnMole();
    moleSpawnRef.current = window.setInterval(spawnMole, SPAWN_INTERVAL);
  };

  // Spawn a new mole
  const spawnMole = () => {
    const availablePositions = Array.from({ length: BOARD_SIZE }, (_, i) => i).filter(
      pos => !moles.some(mole => mole.position === pos && mole.isUp)
    );

    if (availablePositions.length === 0) return;

    const position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
    const newMole: Mole = {
      id: moleIdRef.current++,
      position,
      isUp: true,
      timeLeft: MOLE_UP_TIME
    };

    setMoles(prev => [...prev, newMole]);
  };

  // Game loop to update moles
  useEffect(() => {
    if (gameState !== 'playing') return;

    const updateMoles = () => {
      setMoles(prevMoles => {
        return prevMoles.map(mole => {
          if (!mole.isUp) return mole;
          
          const newTimeLeft = mole.timeLeft - 16; // ~60fps
          if (newTimeLeft <= 0) {
            // Mole escaped, break combo
            setCombo(0);
            return { ...mole, isUp: false };
          }
          
          return { ...mole, timeLeft: newTimeLeft };
        }).filter(mole => mole.isUp || mole.timeLeft > -500); // Keep for exit animation
      });

      gameLoopRef.current = requestAnimationFrame(updateMoles);
    };

    gameLoopRef.current = requestAnimationFrame(updateMoles);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  // Whack a mole
  const whackMole = (moleId: number, position: number) => {
    if (gameState !== 'playing') return;

    const mole = moles.find(m => m.id === moleId && m.isUp);
    if (!mole) return;

    // Calculate points based on timing and combo
    const timingBonus = Math.floor((mole.timeLeft / MOLE_UP_TIME) * 50); // Up to 50 points for quick hits
    const comboBonus = combo * 5; // 5 points per combo level
    const totalPoints = 10 + timingBonus + comboBonus;

    setScore(prev => prev + totalPoints);
    setCombo(prev => {
      const newCombo = prev + 1;
      setMaxCombo(current => Math.max(current, newCombo));
      return newCombo;
    });

    // Remove the mole
    setMoles(prev => prev.map(m => 
      m.id === moleId ? { ...m, isUp: false } : m
    ));
  };

  // End game
  useEffect(() => {
    if (gameState === 'ended') {
      if (timerRef.current) clearInterval(timerRef.current);
      if (moleSpawnRef.current) clearInterval(moleSpawnRef.current);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      
      const duration = Math.floor((Date.now() - startTime) / 1000);
      onGameComplete(score, duration);
    }
  }, [gameState, score, startTime, onGameComplete]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (moleSpawnRef.current) clearInterval(moleSpawnRef.current);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-6 h-6 text-green-500" />
              <span>Whack-A-Mole</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Score: {score}</Badge>
              <Badge variant="outline">Combo: {combo}</Badge>
              <Badge variant="outline">Time: {timeLeft}s</Badge>
              <Button variant="ghost" onClick={onExit} size="sm">×</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Game Board */}
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-4 w-96 h-96 p-4 bg-green-100 rounded-lg">
              {Array.from({ length: BOARD_SIZE }, (_, index) => {
                const mole = moles.find(m => m.position === index && m.isUp);
                
                return (
                  <div
                    key={index}
                    className="relative w-24 h-24 bg-green-800 rounded-full border-4 border-green-900 overflow-hidden cursor-pointer"
                    onClick={() => mole && whackMole(mole.id, index)}
                  >
                    {/* Hole */}
                    <div className="absolute inset-2 bg-black rounded-full" />
                    
                    {/* Mole */}
                    <AnimatePresence>
                      {mole && (
                        <motion.div
                          initial={{ y: "100%" }}
                          animate={{ y: "10%" }}
                          exit={{ y: "100%" }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 flex items-end justify-center cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            whackMole(mole.id, index);
                          }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-16 h-16 bg-amber-700 rounded-full border-2 border-amber-900 flex items-center justify-center"
                          >
                            {/* Mole face */}
                            <div className="text-black text-2xl">🦫</div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Time indicator */}
                    {mole && (
                      <div className="absolute top-1 left-1 right-1">
                        <div className="h-1 bg-gray-300 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-red-500"
                            initial={{ width: "100%" }}
                            animate={{ width: `${(mole.timeLeft / MOLE_UP_TIME) * 100}%` }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Combo Display */}
          {combo > 0 && gameState === 'playing' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <div className="text-2xl font-bold text-yellow-600">
                {combo}x COMBO!
              </div>
            </motion.div>
          )}

          {/* Game Controls */}
          <div className="text-center space-y-4">
            {gameState === 'ready' && (
              <div>
                <Button
                  onClick={startGame}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Start Game
                </Button>
              </div>
            )}

            {gameState === 'ended' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    <span>Final Score: {score}</span>
                  </div>
                  <div className="text-gray-600">
                    <p>Max Combo: {maxCombo}x</p>
                    <p>Moles Whacked: {Math.floor(score / 10)}</p>
                  </div>
                </div>
                <div className="flex space-x-2 justify-center">
                  <Button
                    onClick={() => setGameState('ready')}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Play Again</span>
                  </Button>
                  <Button onClick={onExit} className="bg-green-600 hover:bg-green-700">
                    Exit Game
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          {gameState === 'ready' && (
            <div className="text-center text-sm text-gray-600 bg-green-50 p-4 rounded">
              <p className="font-semibold mb-2">How to Play:</p>
              <p>• Click on moles as they pop up from holes</p>
              <p>• Hit them quickly for timing bonus</p>
              <p>• Build combos for extra points</p>
              <p>• Don't let them escape or you'll lose your combo!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}