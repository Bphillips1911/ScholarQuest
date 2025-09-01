import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Car, Trophy, RotateCcw } from "lucide-react";

interface RacingGameProps {
  onGameComplete: (score: number, duration: number) => void;
  onExit: () => void;
}

export function RacingGame({ onGameComplete, onExit }: RacingGameProps) {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [position, setPosition] = useState(200);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [speed, setSpeed] = useState(0);
  const [obstacles, setObstacles] = useState<Array<{id: number, x: number, y: number}>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const obstacleIdRef = useRef(0);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 400;
  const CAR_WIDTH = 40;
  const CAR_HEIGHT = 20;

  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('ended');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing') {
      const gameLoop = () => {
        // Move obstacles
        setObstacles(prev => prev
          .map(obs => ({ ...obs, x: obs.x - 5 }))
          .filter(obs => obs.x > -50)
        );

        // Add new obstacles
        if (Math.random() < 0.02) {
          setObstacles(prev => [...prev, {
            id: obstacleIdRef.current++,
            x: CANVAS_WIDTH,
            y: Math.random() * (CANVAS_HEIGHT - 60) + 30
          }]);
        }

        // Increase score
        setScore(prev => prev + 1);

        gameLoopRef.current = requestAnimationFrame(gameLoop);
      };

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw road
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw road lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT / 2);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
    ctx.stroke();

    // Draw car
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(50, position, CAR_WIDTH, CAR_HEIGHT);
    ctx.fillStyle = '#000';
    ctx.fillRect(55, position + 5, 10, 10);
    ctx.fillRect(75, position + 5, 10, 10);

    // Draw obstacles
    obstacles.forEach(obstacle => {
      ctx.fillStyle = '#666';
      ctx.fillRect(obstacle.x, obstacle.y, 30, 30);
    });
  }, [position, obstacles]);

  const handleKeyPress = (direction: 'up' | 'down') => {
    if (gameState !== 'playing') return;
    
    setPosition(prev => {
      if (direction === 'up') {
        return Math.max(0, prev - 20);
      } else {
        return Math.min(CANVAS_HEIGHT - CAR_HEIGHT, prev + 20);
      }
    });
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(30);
    setPosition(200);
    setObstacles([]);
  };

  useEffect(() => {
    if (gameState === 'ended') {
      onGameComplete(score, 30);
    }
  }, [gameState, score, onGameComplete]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Car className="w-6 h-6 text-red-500" />
          <span className="text-xl font-bold">Racing Championship</span>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">Score: {score}</Badge>
          <Badge variant="outline">Time: {timeLeft}s</Badge>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-4 p-4">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border-2 border-gray-300 rounded-lg"
          />
        </div>

        <div className="flex justify-center space-x-4">
          <Button
            onMouseDown={() => handleKeyPress('up')}
            disabled={gameState !== 'playing'}
            variant="outline"
          >
            ↑ Up
          </Button>
          <Button
            onMouseDown={() => handleKeyPress('down')}
            disabled={gameState !== 'playing'}
            variant="outline"
          >
            ↓ Down
          </Button>
        </div>

        <div className="text-center space-y-4">
          {gameState === 'ready' && (
            <div>
              <Button onClick={startGame} size="lg" className="bg-red-600 hover:bg-red-700">
                Start Racing!
              </Button>
              <p className="text-sm text-gray-600 mt-2">Use Up/Down buttons to avoid obstacles!</p>
            </div>
          )}

          {gameState === 'ended' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <span>Race Complete! Score: {score}</span>
              </div>
              <div className="flex justify-center space-x-2">
                <Button onClick={startGame} className="bg-red-600 hover:bg-red-700">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Race Again
                </Button>
                <Button onClick={onExit} variant="outline">Exit</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}