import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Trophy, RotateCcw, Users } from "lucide-react";

interface ConnectFourProps {
  onGameComplete: (score: number, duration: number) => void;
  onExit: () => void;
}

type Player = 'red' | 'yellow' | null;
type Board = Player[][];

export function ConnectFour({ onGameComplete, onExit }: ConnectFourProps) {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [board, setBoard] = useState<Board>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'red' | 'yellow'>('red');
  const [winner, setWinner] = useState<Player>(null);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);

  const ROWS = 6;
  const COLS = 7;

  // Initialize board
  const initializeBoard = (): Board => {
    return Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
  };

  // Start game
  const startGame = () => {
    setGameState('playing');
    setBoard(initializeBoard());
    setCurrentPlayer('red');
    setWinner(null);
    setMoves(0);
    setStartTime(Date.now());
  };

  // Drop piece
  const dropPiece = (col: number) => {
    if (gameState !== 'playing' || winner) return;

    const newBoard = [...board];
    
    // Find the lowest empty row in the column
    for (let row = ROWS - 1; row >= 0; row--) {
      if (newBoard[row][col] === null) {
        newBoard[row][col] = currentPlayer;
        setBoard(newBoard);
        setMoves(prev => prev + 1);
        
        // Check for winner
        if (checkWinner(newBoard, row, col, currentPlayer)) {
          setWinner(currentPlayer);
          setGameState('ended');
        } else if (moves + 1 >= ROWS * COLS) {
          // Board is full, it's a tie
          setGameState('ended');
        } else {
          // Switch players
          setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red');
        }
        break;
      }
    }
  };

  // Check for winner
  const checkWinner = (board: Board, row: number, col: number, player: Player): boolean => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal /
      [1, -1],  // diagonal \
    ];

    for (const [dRow, dCol] of directions) {
      let count = 1;
      
      // Check in positive direction
      let r = row + dRow;
      let c = col + dCol;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count++;
        r += dRow;
        c += dCol;
      }
      
      // Check in negative direction
      r = row - dRow;
      c = col - dCol;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count++;
        r -= dRow;
        c -= dCol;
      }
      
      if (count >= 4) {
        return true;
      }
    }
    
    return false;
  };

  // Initialize board on component mount
  useEffect(() => {
    setBoard(initializeBoard());
  }, []);

  useEffect(() => {
    if (gameState === 'ended') {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const score = winner === 'red' ? 100 : winner === 'yellow' ? 50 : 25; // AI gets 50, tie gets 25
      onGameComplete(score, duration);
    }
  }, [gameState, winner, startTime, onGameComplete]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Users className="w-6 h-6 text-blue-500" />
          <span className="text-xl font-bold">Connect Four</span>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">Moves: {moves}</Badge>
          {gameState === 'playing' && (
            <Badge 
              className={currentPlayer === 'red' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}
            >
              {currentPlayer === 'red' ? 'Your Turn' : 'AI Turn'}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-4 p-4">
        {gameState === 'ready' && (
          <div className="text-center space-y-4">
            <Button onClick={startGame} size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start Connect Four!
            </Button>
            <p className="text-sm text-gray-600">Connect 4 pieces in a row to win!</p>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'ended') && (
          <div className="flex justify-center">
            <div className="grid grid-cols-7 gap-2 p-4 bg-blue-600 rounded-lg">
              {/* Column drop buttons */}
              {Array(COLS).fill(0).map((_, col) => (
                <Button
                  key={`drop-${col}`}
                  onClick={() => dropPiece(col)}
                  disabled={gameState !== 'playing' || board[0][col] !== null}
                  variant="outline"
                  size="sm"
                  className="w-12 h-8 p-0"
                >
                  ↓
                </Button>
              ))}
              
              {/* Game board */}
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <motion.div
                    key={`${rowIndex}-${colIndex}`}
                    className="w-12 h-12 rounded-full border-2 border-blue-800 flex items-center justify-center"
                    style={{
                      backgroundColor: cell === 'red' ? '#ef4444' : cell === 'yellow' ? '#eab308' : '#ffffff'
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2, delay: cell ? 0.1 : 0 }}
                  >
                    {cell && (
                      <motion.div
                        className="w-10 h-10 rounded-full"
                        style={{
                          backgroundColor: cell === 'red' ? '#dc2626' : '#ca8a04'
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {gameState === 'ended' && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <span>
                {winner === 'red' ? 'You Win!' : winner === 'yellow' ? 'AI Wins!' : "It's a Tie!"}
              </span>
            </div>
            <div className="flex justify-center space-x-2">
              <Button onClick={startGame} className="bg-blue-600 hover:bg-blue-700">
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