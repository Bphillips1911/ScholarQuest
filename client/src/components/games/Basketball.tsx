import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Play, Pause, Trophy, Target } from "lucide-react";

interface BasketballGameProps {
  onGameComplete: (score: number, duration: number) => void;
  onExit: () => void;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  shooting: boolean;
  scored: boolean;
}

export function BasketballGame({ onGameComplete, onExit }: BasketballGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'ended'>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60 second game
  const [balls, setBalls] = useState<Ball[]>([]);
  const [power, setPower] = useState(0);
  const [powerIncreasing, setPowerIncreasing] = useState(false);
  const [shootAngle, setShootAngle] = useState(45); // degrees
  const ballIdRef = useRef(0);
  const gameLoopRef = useRef<number>();
  const timerRef = useRef<number>();

  const CANVAS_WIDTH = 900;
  const CANVAS_HEIGHT = 500;
  const BASKET_X = 650;
  const BASKET_Y = 150;
  const BASKET_WIDTH = 80;
  const BASKET_HEIGHT = 40;
  const PLAYER_X = 100;
  const PLAYER_Y = 300;

  // Start game
  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(60);
    setBalls([]);
    
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
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const updateGame = () => {
      setBalls(prevBalls => {
        return prevBalls.map(ball => {
          if (!ball.shooting) return ball;

          const newX = ball.x + ball.vx;
          const newY = ball.y + ball.vy;
          const newVy = ball.vy + 0.5; // gravity

          // Check if ball scores
          if (!ball.scored && 
              newX >= BASKET_X && newX <= BASKET_X + BASKET_WIDTH &&
              newY >= BASKET_Y && newY <= BASKET_Y + BASKET_HEIGHT &&
              ball.vy > 0) {
            setScore(prev => prev + 2);
            return { ...ball, scored: true };
          }

          // Remove ball if it goes off screen
          if (newX > CANVAS_WIDTH || newY > CANVAS_HEIGHT) {
            return null as any;
          }

          return {
            ...ball,
            x: newX,
            y: newY,
            vy: newVy
          };
        }).filter(Boolean);
      });

      gameLoopRef.current = requestAnimationFrame(updateGame);
    };

    gameLoopRef.current = requestAnimationFrame(updateGame);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  // Power meter
  useEffect(() => {
    if (!powerIncreasing) return;

    const interval = setInterval(() => {
      setPower(prev => {
        if (prev >= 100) {
          setPowerIncreasing(false);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [powerIncreasing]);

  // Shoot ball
  const shootBall = useCallback(() => {
    if (gameState !== 'playing' || powerIncreasing) return;

    const angleRad = (shootAngle * Math.PI) / 180;
    const velocity = (power / 100) * 15;
    
    const newBall: Ball = {
      id: ballIdRef.current++,
      x: PLAYER_X,
      y: PLAYER_Y,
      vx: Math.cos(angleRad) * velocity,
      vy: -Math.sin(angleRad) * velocity,
      shooting: true,
      scored: false
    };

    setBalls(prev => [...prev, newBall]);
    setPower(0);
  }, [power, shootAngle, gameState, powerIncreasing]);

  // Handle power charging
  const handleMouseDown = () => {
    if (gameState === 'playing' && !powerIncreasing) {
      setPowerIncreasing(true);
    }
  };

  const handleMouseUp = () => {
    if (powerIncreasing) {
      setPowerIncreasing(false);
      shootBall();
    }
  };

  // Handle angle adjustment
  const adjustAngle = (delta: number) => {
    setShootAngle(prev => Math.max(15, Math.min(75, prev + delta)));
  };

  // End game
  useEffect(() => {
    if (gameState === 'ended') {
      if (timerRef.current) clearInterval(timerRef.current);
      onGameComplete(score, 60);
    }
  }, [gameState, score, onGameComplete]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw court
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 350, CANVAS_WIDTH, 50);

    // Draw basket
    ctx.fillStyle = '#FF4500';
    ctx.fillRect(BASKET_X, BASKET_Y, BASKET_WIDTH, 10);
    ctx.fillStyle = '#000';
    ctx.fillRect(BASKET_X + 10, BASKET_Y + 10, BASKET_WIDTH - 20, BASKET_HEIGHT - 10);

    // Draw player
    ctx.fillStyle = '#0066CC';
    ctx.beginPath();
    ctx.arc(PLAYER_X, PLAYER_Y, 20, 0, 2 * Math.PI);
    ctx.fill();

    // Draw angle indicator
    const angleRad = (shootAngle * Math.PI) / 180;
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(PLAYER_X, PLAYER_Y);
    ctx.lineTo(
      PLAYER_X + Math.cos(angleRad) * 60,
      PLAYER_Y - Math.sin(angleRad) * 60
    );
    ctx.stroke();

    // Draw balls
    balls.forEach(ball => {
      ctx.fillStyle = ball.scored ? '#FFD700' : '#FF6600';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 8, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [balls, shootAngle]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Target className="w-6 h-6 text-orange-500" />
          <span className="text-xl font-bold">Basketball Shootout</span>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">Score: {score}</Badge>
          <Badge variant="outline">Time: {timeLeft}s</Badge>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-4 p-4">
          {/* Game Canvas */}
          <div className="flex justify-center">
            <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="block"
              />
            </div>
          </div>

          {/* Game Controls */}
          <div className="flex items-center justify-between">
            {/* Angle Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Angle:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => adjustAngle(-5)}
                disabled={gameState !== 'playing'}
              >
                ↓
              </Button>
              <Badge variant="secondary">{shootAngle}°</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => adjustAngle(5)}
                disabled={gameState !== 'playing'}
              >
                ↑
              </Button>
            </div>

            {/* Power Meter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Power:</span>
              <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-red-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${power}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <Badge variant="secondary">{power}%</Badge>
            </div>

            {/* Shoot Button */}
            <Button
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              disabled={gameState !== 'playing'}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {powerIncreasing ? 'Release to Shoot!' : 'Hold to Charge'}
            </Button>
          </div>

          {/* Game State Controls */}
          <div className="flex items-center justify-center space-x-4">
            {gameState === 'ready' && (
              <Button onClick={startGame} size="lg" className="bg-green-600 hover:bg-green-700">
                <Play className="w-5 h-5 mr-2" />
                Start Game
              </Button>
            )}

            {gameState === 'playing' && (
              <Button 
                onClick={() => setGameState('paused')} 
                variant="outline"
                size="lg"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            )}

            {gameState === 'paused' && (
              <div className="flex space-x-2">
                <Button 
                  onClick={() => setGameState('playing')} 
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </Button>
                <Button 
                  onClick={() => setGameState('ready')} 
                  variant="outline"
                  size="lg"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Restart
                </Button>
              </div>
            )}

            {gameState === 'ended' && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <span>Final Score: {score}</span>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => setGameState('ready')} 
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Play Again
                  </Button>
                  <Button onClick={onExit} variant="outline" size="lg">
                    Exit Game
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          {gameState === 'ready' && (
            <div className="text-center text-sm text-gray-600 bg-blue-50 p-4 rounded">
              <p className="font-semibold mb-2">How to Play:</p>
              <p>• Adjust your shooting angle with the ↑↓ buttons</p>
              <p>• Hold the "Hold to Charge" button to build power</p>
              <p>• Release to shoot the basketball into the hoop</p>
              <p>• Score as many baskets as possible in 60 seconds!</p>
            </div>
          )}
      </div>
    </div>
  );
}