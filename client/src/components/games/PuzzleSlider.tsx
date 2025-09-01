import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, Shuffle, CheckCircle } from "lucide-react";

interface PuzzleSliderProps {
  onGameComplete: (score: number, duration: number) => void;
  onExit: () => void;
}

type GameState = 'ready' | 'playing' | 'solved';

export function PuzzleSlider({ onGameComplete, onExit }: PuzzleSliderProps) {
  const [board, setBoard] = useState<number[]>([]);
  const [gameState, setGameState] = useState<GameState>('ready');
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [bestMoves, setBestMoves] = useState<number | null>(null);

  const BOARD_SIZE = 4;
  const TOTAL_TILES = BOARD_SIZE * BOARD_SIZE;

  // Initialize solved board
  const initializeSolvedBoard = (): number[] => {
    return [...Array(TOTAL_TILES - 1).keys()].map(i => i + 1).concat([0]);
  };

  // Shuffle board
  const shuffleBoard = (board: number[]): number[] => {
    const shuffled = [...board];
    // Perform random valid moves to ensure solvability
    for (let i = 0; i < 1000; i++) {
      const emptyIndex = shuffled.indexOf(0);
      const validMoves = getValidMoves(shuffled, emptyIndex);
      if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        const temp = shuffled[emptyIndex];
        shuffled[emptyIndex] = shuffled[randomMove];
        shuffled[randomMove] = temp;
      }
    }
    return shuffled;
  };

  // Get valid moves for empty tile
  const getValidMoves = (board: number[], emptyIndex: number): number[] => {
    const moves: number[] = [];
    const row = Math.floor(emptyIndex / BOARD_SIZE);
    const col = emptyIndex % BOARD_SIZE;

    // Up
    if (row > 0) moves.push(emptyIndex - BOARD_SIZE);
    // Down
    if (row < BOARD_SIZE - 1) moves.push(emptyIndex + BOARD_SIZE);
    // Left
    if (col > 0) moves.push(emptyIndex - 1);
    // Right
    if (col < BOARD_SIZE - 1) moves.push(emptyIndex + 1);

    return moves;
  };

  // Check if puzzle is solved
  const isSolved = (board: number[]): boolean => {
    const solved = initializeSolvedBoard();
    return board.every((tile, index) => tile === solved[index]);
  };

  // Handle tile click
  const handleTileClick = (index: number) => {
    if (gameState !== 'playing') return;

    const emptyIndex = board.indexOf(0);
    const validMoves = getValidMoves(board, emptyIndex);

    if (validMoves.includes(index)) {
      const newBoard = [...board];
      newBoard[emptyIndex] = newBoard[index];
      newBoard[index] = 0;
      
      setBoard(newBoard);
      setMoves(prev => prev + 1);

      if (isSolved(newBoard)) {
        const endTime = Date.now();
        const duration = Math.floor((endTime - startTime) / 1000);
        
        // Calculate score based on moves and time
        const moveBonus = Math.max(0, 100 - moves);
        const timeBonus = Math.max(0, 300 - duration); // 5 minutes max for bonus
        const totalScore = moveBonus + timeBonus;

        // Update best records
        if (!bestTime || duration < bestTime) setBestTime(duration);
        if (!bestMoves || moves < bestMoves) setBestMoves(moves);

        setGameState('solved');
        onGameComplete(totalScore, duration);
      }
    }
  };

  // Start new game
  const startNewGame = () => {
    const solvedBoard = initializeSolvedBoard();
    const shuffledBoard = shuffleBoard(solvedBoard);
    setBoard(shuffledBoard);
    setGameState('playing');
    setMoves(0);
    setStartTime(Date.now());
  };

  // Get tile color based on whether it's in correct position
  const getTileColor = (tile: number, index: number): string => {
    if (tile === 0) return 'transparent';
    const correctPosition = tile - 1;
    return index === correctPosition ? 'bg-green-100 border-green-400' : 'bg-blue-100 border-blue-400';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Shuffle className="w-6 h-6 text-purple-500" />
              <span>15-Puzzle Slider</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Moves: {moves}</Badge>
              {gameState === 'playing' && (
                <Badge variant="outline">
                  Time: {Math.floor((Date.now() - startTime) / 1000)}s
                </Badge>
              )}
              <Button variant="ghost" onClick={onExit} size="sm">×</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Game Board */}
          <div className="flex justify-center">
            <div className="grid grid-cols-4 gap-2 w-80 h-80 p-4 bg-gray-100 rounded-lg">
              {board.map((tile, index) => (
                <motion.button
                  key={index}
                  className={`
                    w-16 h-16 rounded-lg border-2 text-xl font-bold
                    ${tile === 0 ? 'invisible' : getTileColor(tile, index)}
                    ${gameState === 'playing' ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}
                    transition-all duration-200
                  `}
                  onClick={() => handleTileClick(index)}
                  disabled={gameState !== 'playing'}
                  whileHover={gameState === 'playing' ? { scale: 1.05 } : {}}
                  whileTap={gameState === 'playing' ? { scale: 0.95 } : {}}
                  layout
                >
                  {tile !== 0 && tile}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Personal Records */}
          {(bestTime || bestMoves) && (
            <div className="flex justify-center space-x-6 text-sm text-gray-600">
              {bestMoves && (
                <div className="text-center">
                  <div className="font-semibold">Best Moves</div>
                  <div>{bestMoves}</div>
                </div>
              )}
              {bestTime && (
                <div className="text-center">
                  <div className="font-semibold">Best Time</div>
                  <div>{bestTime}s</div>
                </div>
              )}
            </div>
          )}

          {/* Game Status */}
          <div className="text-center space-y-4">
            {gameState === 'ready' && (
              <div>
                <Button
                  onClick={startNewGame}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Start Puzzle
                </Button>
              </div>
            )}

            {gameState === 'solved' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-green-600 text-xl font-bold">
                  <CheckCircle className="w-8 h-8" />
                  <span>Puzzle Solved!</span>
                </div>
                <div className="text-gray-600">
                  <p>Completed in {moves} moves</p>
                  <p>Score: {Math.max(0, 100 - moves) + Math.max(0, 300 - Math.floor((Date.now() - startTime) / 1000))}</p>
                </div>
                <div className="flex space-x-2 justify-center">
                  <Button
                    onClick={startNewGame}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>New Puzzle</span>
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
            <div className="text-center text-sm text-gray-600 bg-purple-50 p-4 rounded">
              <p className="font-semibold mb-2">How to Play:</p>
              <p>• Click on tiles adjacent to the empty space to move them</p>
              <p>• Arrange numbers 1-15 in order, with empty space in bottom-right</p>
              <p>• Green tiles are in correct positions</p>
              <p>• Score based on moves and time - fewer is better!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}