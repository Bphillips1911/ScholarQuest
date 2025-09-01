import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, RotateCcw, Target } from "lucide-react";

interface SoccerPenaltyProps {
  onGameComplete: (score: number, duration: number) => void;
  onExit: () => void;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  scored: boolean;
}

export function SoccerPenalty({ onGameComplete, onExit }: SoccerPenaltyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [aimDirection, setAimDirection] = useState(0); // -1 to 1
  const [power, setPower] = useState(50);
  const ballIdRef = useRef(0);
  const gameLoopRef = useRef<number>();

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const GOAL_X = 600;
  const GOAL_Y = 100;
  const GOAL_WIDTH = 150;
  const GOAL_HEIGHT = 200;
  const PLAYER_X = 100;
  const PLAYER_Y = 400;
  const MAX_ATTEMPTS = 10;

  // Start game
  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setAttempts(0);
    setBalls([]);
  }, []);

  // Shoot ball
  const shootBall = () => {
    if (gameState !== 'playing' || attempts >= MAX_ATTEMPTS) return;

    const ball: Ball = {
      id: ballIdRef.current++,
      x: PLAYER_X,
      y: PLAYER_Y,
      vx: (power / 10) + (aimDirection * 3),
      vy: -(power / 8),
      active: true,
      scored: false
    };

    setBalls(prev => [...prev, ball]);
    setAttempts(prev => prev + 1);
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const updateGame = () => {
      setBalls(prevBalls => {
        return prevBalls.map(ball => {
          if (!ball.active) return ball;

          const newX = ball.x + ball.vx;
          const newY = ball.y + ball.vy;
          const newVy = ball.vy + 0.3; // gravity

          // Check goal collision
          if (newX >= GOAL_X && newX <= GOAL_X + GOAL_WIDTH &&
              newY >= GOAL_Y && newY <= GOAL_Y + GOAL_HEIGHT) {
            setScore(prev => prev + 1);
            return { ...ball, x: newX, y: newY, active: false, scored: true };
          }

          // Check boundaries
          if (newX > CANVAS_WIDTH || newY > CANVAS_HEIGHT || newX < 0) {
            return { ...ball, active: false };
          }

          return { ...ball, x: newX, y: newY, vy: newVy };
        });
      });

      gameLoopRef.current = requestAnimationFrame(updateGame);
    };

    gameLoopRef.current = requestAnimationFrame(updateGame);
  }, [gameState]);

  // End game check
  useEffect(() => {
    if (attempts >= MAX_ATTEMPTS && gameState === 'playing') {
      setGameState('ended');
    }
  }, [attempts, gameState]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw field
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw field lines
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Center line
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    // Goal area
    ctx.rect(GOAL_X - 50, GOAL_Y - 20, GOAL_WIDTH + 100, GOAL_HEIGHT + 40);
    ctx.stroke();

    // Draw goal posts
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(GOAL_X - 10, GOAL_Y, 10, GOAL_HEIGHT);
    ctx.fillRect(GOAL_X + GOAL_WIDTH, GOAL_Y, 10, GOAL_HEIGHT);
    ctx.fillRect(GOAL_X - 10, GOAL_Y - 10, GOAL_WIDTH + 20, 10);

    // Draw goal net
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(GOAL_X + (i * GOAL_WIDTH / 9), GOAL_Y);
      ctx.lineTo(GOAL_X + (i * GOAL_WIDTH / 9), GOAL_Y + GOAL_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(GOAL_X, GOAL_Y + (i * GOAL_HEIGHT / 7));
      ctx.lineTo(GOAL_X + GOAL_WIDTH, GOAL_Y + (i * GOAL_HEIGHT / 7));
      ctx.stroke();
    }

    // Draw player
    ctx.fillStyle = '#FF4444';
    ctx.beginPath();
    ctx.arc(PLAYER_X, PLAYER_Y, 15, 0, 2 * Math.PI);
    ctx.fill();

    // Draw aim indicator
    if (gameState === 'playing') {
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(PLAYER_X, PLAYER_Y);
      const aimX = PLAYER_X + Math.cos(aimDirection * 0.5) * 80;
      const aimY = PLAYER_Y - 60;
      ctx.lineTo(aimX, aimY);
      ctx.stroke();
    }

    // Draw balls
    balls.forEach(ball => {
      ctx.fillStyle = ball.scored ? '#FFD700' : '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [balls, aimDirection, gameState]);

  useEffect(() => {
    if (gameState === 'ended') {
      onGameComplete(score, attempts);
    }
  }, [gameState, score, attempts, onGameComplete]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Target className="w-6 h-6 text-green-500" />
          <span className="text-xl font-bold">Soccer Penalty Kicks</span>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">Goals: {score}</Badge>
          <Badge variant="outline">Attempts: {attempts}/{MAX_ATTEMPTS}</Badge>
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

        {gameState === 'playing' && (
          <div className="space-y-4">
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => setAimDirection(prev => Math.max(-1, prev - 0.2))}
                variant="outline"
              >
                ← Aim Left
              </Button>
              <Button
                onClick={() => setAimDirection(prev => Math.min(1, prev + 0.2))}
                variant="outline"
              >
                Aim Right →
              </Button>
            </div>
            
            <div className="flex justify-center items-center space-x-4">
              <span>Power:</span>
              <input
                type="range"
                min="20"
                max="100"
                value={power}
                onChange={(e) => setPower(Number(e.target.value))}
                className="w-32"
              />
              <span>{power}%</span>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={shootBall}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                SHOOT!
              </Button>
            </div>
          </div>
        )}

        <div className="text-center space-y-4">
          {gameState === 'ready' && (
            <div>
              <Button onClick={startGame} size="lg" className="bg-green-600 hover:bg-green-700">
                Start Penalty Shootout!
              </Button>
              <p className="text-sm text-gray-600 mt-2">Score as many goals as you can in 10 attempts!</p>
            </div>
          )}

          {gameState === 'ended' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <span>Shootout Complete! {score}/{attempts} goals</span>
              </div>
              <div className="flex justify-center space-x-2">
                <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Play Again
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