import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, RotateCcw, Gamepad2 } from "lucide-react";

interface PacManProps {
  onGameComplete: (score: number, duration: number) => void;
  onExit: () => void;
}

interface Position {
  x: number;
  y: number;
}

interface Ghost {
  x: number;
  y: number;
  color: string;
  direction: string;
}

export function PacMan({ onGameComplete, onExit }: PacManProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [pacman, setPacman] = useState<Position>({ x: 400, y: 300 });
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [dots, setDots] = useState<Position[]>([]);
  const [direction, setDirection] = useState('right');
  const [startTime, setStartTime] = useState<number>(0);
  const gameLoopRef = useRef<number>();

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PACMAN_SIZE = 15;
  const DOT_SIZE = 3;
  const GHOST_SIZE = 15;

  // Initialize game
  const initializeGame = useCallback(() => {
    // Create maze-like dot pattern
    const newDots: Position[] = [];
    for (let x = 50; x < CANVAS_WIDTH - 50; x += 30) {
      for (let y = 50; y < CANVAS_HEIGHT - 50; y += 30) {
        // Skip center area for pacman starting position
        if (Math.abs(x - 400) > 60 || Math.abs(y - 300) > 60) {
          newDots.push({ x, y });
        }
      }
    }
    
    // Initialize ghosts
    const newGhosts: Ghost[] = [
      { x: 100, y: 100, color: '#ff0000', direction: 'right' },
      { x: 700, y: 100, color: '#00ffff', direction: 'left' },
      { x: 100, y: 500, color: '#ffb8ff', direction: 'up' },
      { x: 700, y: 500, color: '#ffb852', direction: 'down' }
    ];
    
    setDots(newDots);
    setGhosts(newGhosts);
    setPacman({ x: 400, y: 300 });
    setDirection('right');
  }, []);

  // Start game
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setStartTime(Date.now());
    initializeGame();
  };

  // Move pacman
  const movePacman = (newDirection: string) => {
    if (gameState !== 'playing') return;
    setDirection(newDirection);
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const updateGame = () => {
      // Move Pacman
      setPacman(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const speed = 3;

        switch (direction) {
          case 'up':
            newY = Math.max(PACMAN_SIZE, prev.y - speed);
            break;
          case 'down':
            newY = Math.min(CANVAS_HEIGHT - PACMAN_SIZE, prev.y + speed);
            break;
          case 'left':
            newX = Math.max(PACMAN_SIZE, prev.x - speed);
            break;
          case 'right':
            newX = Math.min(CANVAS_WIDTH - PACMAN_SIZE, prev.x + speed);
            break;
        }

        return { x: newX, y: newY };
      });

      // Move ghosts
      setGhosts(prev => prev.map(ghost => {
        let newX = ghost.x;
        let newY = ghost.y;
        const speed = 2;

        // Simple AI: change direction randomly or when hitting walls
        if (Math.random() < 0.02 || 
            ghost.x <= GHOST_SIZE || ghost.x >= CANVAS_WIDTH - GHOST_SIZE ||
            ghost.y <= GHOST_SIZE || ghost.y >= CANVAS_HEIGHT - GHOST_SIZE) {
          const directions = ['up', 'down', 'left', 'right'];
          ghost.direction = directions[Math.floor(Math.random() * directions.length)];
        }

        switch (ghost.direction) {
          case 'up':
            newY = Math.max(GHOST_SIZE, ghost.y - speed);
            break;
          case 'down':
            newY = Math.min(CANVAS_HEIGHT - GHOST_SIZE, ghost.y + speed);
            break;
          case 'left':
            newX = Math.max(GHOST_SIZE, ghost.x - speed);
            break;
          case 'right':
            newX = Math.min(CANVAS_WIDTH - GHOST_SIZE, ghost.x + speed);
            break;
        }

        return { ...ghost, x: newX, y: newY };
      }));

      gameLoopRef.current = requestAnimationFrame(updateGame);
    };

    gameLoopRef.current = requestAnimationFrame(updateGame);
  }, [gameState, direction]);

  // Check collisions
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Check dot collection
    setDots(prev => {
      const remaining = prev.filter(dot => {
        const distance = Math.sqrt(
          Math.pow(dot.x - pacman.x, 2) + Math.pow(dot.y - pacman.y, 2)
        );
        if (distance < PACMAN_SIZE + DOT_SIZE) {
          setScore(s => s + 10);
          return false;
        }
        return true;
      });
      
      // Check win condition
      if (remaining.length === 0) {
        setGameState('ended');
      }
      
      return remaining;
    });

    // Check ghost collision
    const ghostCollision = ghosts.some(ghost => {
      const distance = Math.sqrt(
        Math.pow(ghost.x - pacman.x, 2) + Math.pow(ghost.y - pacman.y, 2)
      );
      return distance < PACMAN_SIZE + GHOST_SIZE;
    });

    if (ghostCollision) {
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameState('ended');
        } else {
          // Reset pacman position
          setPacman({ x: 400, y: 300 });
        }
        return newLives;
      });
    }
  }, [pacman, ghosts, gameState]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw dots
    ctx.fillStyle = '#ffff00';
    dots.forEach(dot => {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, DOT_SIZE, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw Pacman
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    
    // Pacman mouth angle based on direction
    let startAngle = 0.2 * Math.PI;
    let endAngle = 1.8 * Math.PI;
    
    switch (direction) {
      case 'right':
        startAngle = 0.2 * Math.PI;
        endAngle = 1.8 * Math.PI;
        break;
      case 'left':
        startAngle = 1.2 * Math.PI;
        endAngle = 0.8 * Math.PI;
        break;
      case 'up':
        startAngle = 1.7 * Math.PI;
        endAngle = 1.3 * Math.PI;
        break;
      case 'down':
        startAngle = 0.7 * Math.PI;
        endAngle = 0.3 * Math.PI;
        break;
    }
    
    ctx.arc(pacman.x, pacman.y, PACMAN_SIZE, startAngle, endAngle);
    ctx.lineTo(pacman.x, pacman.y);
    ctx.fill();

    // Draw ghosts
    ghosts.forEach(ghost => {
      ctx.fillStyle = ghost.color;
      ctx.beginPath();
      ctx.arc(ghost.x, ghost.y, GHOST_SIZE, 0, Math.PI);
      ctx.fill();
      
      // Ghost bottom wavy part
      ctx.beginPath();
      ctx.moveTo(ghost.x - GHOST_SIZE, ghost.y);
      for (let i = 0; i < 4; i++) {
        const x = ghost.x - GHOST_SIZE + (i * GHOST_SIZE / 2);
        const y = ghost.y + (i % 2 === 0 ? 5 : -5);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(ghost.x + GHOST_SIZE, ghost.y);
      ctx.fill();

      // Ghost eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ghost.x - 5, ghost.y - 5, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ghost.x + 5, ghost.y - 5, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [pacman, ghosts, dots, direction]);

  useEffect(() => {
    if (gameState === 'ended') {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      onGameComplete(score, duration);
    }
  }, [gameState, score, startTime, onGameComplete]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Gamepad2 className="w-6 h-6 text-yellow-500" />
          <span className="text-xl font-bold">Pac-Man Mustang</span>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">Score: {score}</Badge>
          <Badge variant="outline">Lives: {lives}</Badge>
          <Badge variant="outline">Dots: {dots.length}</Badge>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-4 p-4">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border-2 border-gray-300 rounded-lg bg-black"
          />
        </div>

        {gameState === 'playing' && (
          <div className="flex justify-center space-x-2">
            <Button onClick={() => movePacman('up')} variant="outline">↑</Button>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => movePacman('left')} variant="outline">←</Button>
              <Button onClick={() => movePacman('right')} variant="outline">→</Button>
            </div>
            <Button onClick={() => movePacman('down')} variant="outline">↓</Button>
          </div>
        )}

        <div className="text-center space-y-4">
          {gameState === 'ready' && (
            <div>
              <Button onClick={startGame} size="lg" className="bg-yellow-600 hover:bg-yellow-700">
                Start Pac-Man!
              </Button>
              <p className="text-sm text-gray-600 mt-2">Collect all dots while avoiding ghosts!</p>
            </div>
          )}

          {gameState === 'ended' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <span>Game Over! Score: {score}</span>
              </div>
              <div className="flex justify-center space-x-2">
                <Button onClick={startGame} className="bg-yellow-600 hover:bg-yellow-700">
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