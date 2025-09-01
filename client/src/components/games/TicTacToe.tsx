import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, Brain, Zap } from "lucide-react";

interface TicTacToeProps {
  onGameComplete: (score: number, duration: number) => void;
  onExit: () => void;
}

type Player = 'X' | 'O' | null;
type Board = Player[];
type GameMode = 'easy' | 'hard';
type GameState = 'playing' | 'won' | 'lost' | 'draw';

export function TicTacToe({ onGameComplete, onExit }: TicTacToeProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [gameState, setGameState] = useState<GameState>('playing');
  const [score, setScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>('easy');
  const [startTime, setStartTime] = useState(Date.now());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');

  // Check for winner
  const checkWinner = (board: Board): Player => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  // Check if board is full
  const isBoardFull = (board: Board): boolean => {
    return board.every(cell => cell !== null);
  };

  // Get available moves
  const getAvailableMoves = (board: Board): number[] => {
    return board.map((cell, index) => cell === null ? index : -1).filter(index => index !== -1);
  };

  // Minimax algorithm for hard mode
  const minimax = (board: Board, depth: number, isMaximizing: boolean): number => {
    const winner = checkWinner(board);
    
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (isBoardFull(board)) return 0;

    const availableMoves = getAvailableMoves(board);

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (const move of availableMoves) {
        board[move] = 'O';
        const score = minimax(board, depth + 1, false);
        board[move] = null;
        bestScore = Math.max(score, bestScore);
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (const move of availableMoves) {
        board[move] = 'X';
        const score = minimax(board, depth + 1, true);
        board[move] = null;
        bestScore = Math.min(score, bestScore);
      }
      return bestScore;
    }
  };

  // Get best move for AI
  const getBestMove = (board: Board, mode: GameMode): number => {
    const availableMoves = getAvailableMoves(board);
    
    if (mode === 'easy') {
      // Random move for easy mode
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else {
      // Minimax for hard mode
      let bestScore = -Infinity;
      let bestMove = availableMoves[0];
      
      for (const move of availableMoves) {
        board[move] = 'O';
        const score = minimax(board, 0, false);
        board[move] = null;
        
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      return bestMove;
    }
  };

  // Handle player move
  const handleCellClick = (index: number) => {
    if (board[index] || gameState !== 'playing' || currentPlayer !== 'X') return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const winner = checkWinner(newBoard);
    if (winner === 'X') {
      setGameState('won');
      setScore(prev => prev + (gameMode === 'hard' ? 3 : 1));
      return;
    }

    if (isBoardFull(newBoard)) {
      setGameState('draw');
      return;
    }

    setCurrentPlayer('O');
  };

  // AI move
  useEffect(() => {
    if (currentPlayer === 'O' && gameState === 'playing') {
      const timer = setTimeout(() => {
        const newBoard = [...board];
        const aiMove = getBestMove(newBoard, gameMode);
        newBoard[aiMove] = 'O';
        setBoard(newBoard);

        const winner = checkWinner(newBoard);
        if (winner === 'O') {
          setGameState('lost');
        } else if (isBoardFull(newBoard)) {
          setGameState('draw');
        } else {
          setCurrentPlayer('X');
        }
      }, 500); // Small delay for AI move

      return () => clearTimeout(timer);
    }
  }, [currentPlayer, board, gameState, gameMode]);

  // Start new game
  const startNewGame = () => {
    setBoard(Array(9).fill(null));
    setGameState('playing');
    setCurrentPlayer('X');
    if (gamesPlayed === 0) {
      setStartTime(Date.now());
    }
    setGamesPlayed(prev => prev + 1);
  };

  // End session
  const endSession = () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    onGameComplete(score, duration);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-6 h-6 text-blue-500" />
              <span>Tic Tac Toe</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Score: {score}</Badge>
              <Badge variant="outline">Games: {gamesPlayed}</Badge>
              <Button variant="ghost" onClick={onExit} size="sm">×</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Game Mode Selection */}
          <div className="flex items-center justify-center space-x-4">
            <span className="font-medium">Difficulty:</span>
            <Button
              variant={gameMode === 'easy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGameMode('easy')}
              disabled={gameState === 'playing'}
            >
              Easy (1 pt)
            </Button>
            <Button
              variant={gameMode === 'hard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGameMode('hard')}
              disabled={gameState === 'playing'}
            >
              Hard (3 pts)
            </Button>
          </div>

          {/* Game Board */}
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-2 w-64 h-64">
              {board.map((cell, index) => (
                <motion.button
                  key={index}
                  className="w-20 h-20 border-2 border-gray-400 rounded-lg text-4xl font-bold flex items-center justify-center hover:bg-gray-50 disabled:hover:bg-white"
                  onClick={() => handleCellClick(index)}
                  disabled={cell !== null || gameState !== 'playing' || currentPlayer !== 'X'}
                  whileHover={{ scale: cell === null && gameState === 'playing' && currentPlayer === 'X' ? 1.05 : 1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: cell ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={cell === 'X' ? 'text-blue-600' : 'text-red-600'}
                  >
                    {cell}
                  </motion.span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Game Status */}
          <div className="text-center space-y-2">
            {gameState === 'playing' && (
              <div className="flex items-center justify-center space-x-2">
                {currentPlayer === 'X' ? (
                  <>
                    <span className="text-blue-600 font-semibold">Your turn</span>
                    <Zap className="w-4 h-4 text-blue-600" />
                  </>
                ) : (
                  <>
                    <span className="text-red-600 font-semibold">AI thinking...</span>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Brain className="w-4 h-4 text-red-600" />
                    </motion.div>
                  </>
                )}
              </div>
            )}

            {gameState === 'won' && (
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center space-x-2 text-green-600 text-xl font-bold">
                  <Trophy className="w-6 h-6" />
                  <span>You Won! +{gameMode === 'hard' ? 3 : 1} points</span>
                </div>
              </div>
            )}

            {gameState === 'lost' && (
              <div className="text-red-600 text-xl font-bold">
                AI Wins! Try again!
              </div>
            )}

            {gameState === 'draw' && (
              <div className="text-yellow-600 text-xl font-bold">
                It's a Draw!
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4">
            {gamesPlayed === 0 || gameState === 'playing' ? (
              <Button
                onClick={startNewGame}
                disabled={gameState === 'playing'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {gamesPlayed === 0 ? 'Start Game' : 'Game in Progress'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={startNewGame}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </Button>
                <Button
                  onClick={endSession}
                  className="bg-green-600 hover:bg-green-700"
                >
                  End Session
                </Button>
              </>
            )}
          </div>

          {/* Instructions */}
          {gamesPlayed === 0 && (
            <div className="text-center text-sm text-gray-600 bg-blue-50 p-4 rounded">
              <p className="font-semibold mb-2">How to Play:</p>
              <p>• You are X, AI is O</p>
              <p>• Get three in a row to win</p>
              <p>• Easy mode: 1 point per win</p>
              <p>• Hard mode: 3 points per win (smarter AI)</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}