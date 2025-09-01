import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, RotateCcw, Target } from "lucide-react";

interface BrickBreakerProps {
  onGameComplete: (score: number, duration: number) => void;
  onExit: () => void;
}

export function BrickBreaker({ onGameComplete, onExit }: BrickBreakerProps) {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [paddleX, setPaddleX] = useState(200);
  const [ballX, setBallX] = useState(250);
  const [ballY, setBallY] = useState(300);
  const [ballVX, setBallVX] = useState(3);
  const [ballVY, setBallVY] = useState(-3);
  const [bricks, setBricks] = useState<Array<{x: number, y: number, visible: boolean}>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();

  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 400;
  const PADDLE_WIDTH = 100;
  const PADDLE_HEIGHT = 10;
  const BALL_SIZE = 10;
  const BRICK_WIDTH = 50;
  const BRICK_HEIGHT = 20;

  useEffect(() => {
    // Initialize bricks
    const newBricks = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 8; col++) {
        newBricks.push({
          x: col * 60 + 10,
          y: row * 25 + 30,
          visible: true
        });
      }
    }
    setBricks(newBricks);
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      const gameLoop = () => {
        setBallX(prevX => {
          let newX = prevX + ballVX;
          if (newX <= 0 || newX >= CANVAS_WIDTH - BALL_SIZE) {
            setBallVX(-ballVX);
            newX = prevX;
          }
          return newX;
        });

        setBallY(prevY => {
          let newY = prevY + ballVY;
          
          // Top wall
          if (newY <= 0) {
            setBallVY(-ballVY);
            newY = 0;
          }
          
          // Bottom (lose life)
          if (newY >= CANVAS_HEIGHT) {
            setLives(prev => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                setGameState('ended');
              } else {
                // Reset ball
                setBallX(250);
                setBallY(300);
                setBallVX(3);
                setBallVY(-3);
              }
              return newLives;
            });
            return 300;
          }
          
          // Paddle collision
          if (newY >= 340 && newY <= 350 && ballX >= paddleX && ballX <= paddleX + PADDLE_WIDTH) {
            setBallVY(-Math.abs(ballVY));
            newY = 340;
          }
          
          return newY;
        });

        // Brick collision
        setBricks(prevBricks => {
          const newBricks = [...prevBricks];
          let hitBrick = false;
          
          for (let i = 0; i < newBricks.length; i++) {
            const brick = newBricks[i];
            if (brick.visible && 
                ballX >= brick.x && ballX <= brick.x + BRICK_WIDTH &&
                ballY >= brick.y && ballY <= brick.y + BRICK_HEIGHT) {
              newBricks[i] = { ...brick, visible: false };
              setBallVY(-ballVY);
              setScore(prev => prev + 10);
              hitBrick = true;
              break;
            }
          }
          
          // Check win condition
          if (newBricks.every(brick => !brick.visible)) {
            setGameState('ended');
          }
          
          return newBricks;
        });

        gameLoopRef.current = requestAnimationFrame(gameLoop);
      };

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, ballVX, ballVY, ballX, ballY, paddleX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw bricks
    bricks.forEach(brick => {
      if (brick.visible) {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
      }
    });

    // Draw paddle
    ctx.fillStyle = '#4dabf7';
    ctx.fillRect(paddleX, 350, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw ball
    ctx.fillStyle = '#ffd43b';
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_SIZE, 0, 2 * Math.PI);
    ctx.fill();
  }, [bricks, paddleX, ballX, ballY]);

  const movePaddle = (direction: 'left' | 'right') => {
    if (gameState !== 'playing') return;
    
    setPaddleX(prev => {
      if (direction === 'left') {
        return Math.max(0, prev - 20);
      } else {
        return Math.min(CANVAS_WIDTH - PADDLE_WIDTH, prev + 20);
      }
    });
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setPaddleX(200);
    setBallX(250);
    setBallY(300);
    setBallVX(3);
    setBallVY(-3);
    
    // Reset bricks
    const newBricks = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 8; col++) {
        newBricks.push({
          x: col * 60 + 10,
          y: row * 25 + 30,
          visible: true
        });
      }
    }
    setBricks(newBricks);
  };

  useEffect(() => {
    if (gameState === 'ended') {
      onGameComplete(score, 0);
    }
  }, [gameState, score, onGameComplete]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Target className="w-6 h-6 text-orange-500" />
          <span className="text-xl font-bold">Brick Breaker</span>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">Score: {score}</Badge>
          <Badge variant="outline">Lives: {lives}</Badge>
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
            onMouseDown={() => movePaddle('left')}
            disabled={gameState !== 'playing'}
            variant="outline"
          >
            ← Left
          </Button>
          <Button
            onMouseDown={() => movePaddle('right')}
            disabled={gameState !== 'playing'}
            variant="outline"
          >
            Right →
          </Button>
        </div>

        <div className="text-center space-y-4">
          {gameState === 'ready' && (
            <div>
              <Button onClick={startGame} size="lg" className="bg-orange-600 hover:bg-orange-700">
                Start Breaking!
              </Button>
              <p className="text-sm text-gray-600 mt-2">Break all bricks to win!</p>
            </div>
          )}

          {gameState === 'ended' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <span>Game Over! Score: {score}</span>
              </div>
              <div className="flex justify-center space-x-2">
                <Button onClick={startGame} className="bg-orange-600 hover:bg-orange-700">
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