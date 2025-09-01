import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Trophy, RotateCcw, Search } from "lucide-react";

interface WordSearchProps {
  onGameComplete: (score: number, duration: number) => void;
  onExit: () => void;
}

interface FoundWord {
  word: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export function WordSearch({ onGameComplete, onExit }: WordSearchProps) {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [grid, setGrid] = useState<string[][]>([]);
  const [wordsToFind, setWordsToFind] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [selectedCells, setSelectedCells] = useState<{row: number, col: number}[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  const GRID_SIZE = 12;
  const MUSTANG_WORDS = [
    'MUSTANG', 'BHSA', 'STEAM', 'SCIENCE', 'MATH', 'ART', 'TECH', 
    'LEARN', 'STUDY', 'BOOK', 'SCHOOL', 'GRADE', 'TEST', 'SMART'
  ];

  // Create random grid with hidden words
  const createGrid = () => {
    const newGrid: string[][] = Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill('').map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
    );
    
    const wordsUsed: string[] = [];
    
    // Place words randomly
    MUSTANG_WORDS.slice(0, 8).forEach(word => {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 50) {
        const direction = Math.floor(Math.random() * 8); // 8 directions
        const startRow = Math.floor(Math.random() * GRID_SIZE);
        const startCol = Math.floor(Math.random() * GRID_SIZE);
        
        if (canPlaceWord(newGrid, word, startRow, startCol, direction)) {
          placeWord(newGrid, word, startRow, startCol, direction);
          wordsUsed.push(word);
          placed = true;
        }
        attempts++;
      }
    });
    
    setGrid(newGrid);
    setWordsToFind(wordsUsed);
  };

  // Check if word can be placed
  const canPlaceWord = (grid: string[][], word: string, row: number, col: number, direction: number): boolean => {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    const [dRow, dCol] = directions[direction];
    
    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      
      if (newRow < 0 || newRow >= GRID_SIZE || newCol < 0 || newCol >= GRID_SIZE) {
        return false;
      }
    }
    
    return true;
  };

  // Place word in grid
  const placeWord = (grid: string[][], word: string, row: number, col: number, direction: number) => {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    const [dRow, dCol] = directions[direction];
    
    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      grid[newRow][newCol] = word[i];
    }
  };

  // Handle cell selection
  const handleCellClick = (row: number, col: number) => {
    if (gameState !== 'playing') return;

    if (!isSelecting) {
      setSelectedCells([{row, col}]);
      setIsSelecting(true);
    } else {
      const newSelection = [...selectedCells, {row, col}];
      setSelectedCells(newSelection);
      
      // Check if this forms a word
      const word = getWordFromSelection(newSelection);
      if (word && wordsToFind.includes(word) && !foundWords.some(fw => fw.word === word)) {
        const foundWord: FoundWord = {
          word,
          startRow: newSelection[0].row,
          startCol: newSelection[0].col,
          endRow: row,
          endCol: col
        };
        setFoundWords(prev => [...prev, foundWord]);
      }
      
      setSelectedCells([]);
      setIsSelecting(false);
    }
  };

  // Get word from selected cells
  const getWordFromSelection = (selection: {row: number, col: number}[]): string => {
    if (selection.length < 2) return '';
    
    // Check if selection is in a straight line
    const first = selection[0];
    const last = selection[selection.length - 1];
    
    const deltaRow = last.row - first.row;
    const deltaCol = last.col - first.col;
    const distance = Math.max(Math.abs(deltaRow), Math.abs(deltaCol));
    
    if (distance === 0) return '';
    
    const stepRow = deltaRow === 0 ? 0 : deltaRow / Math.abs(deltaRow);
    const stepCol = deltaCol === 0 ? 0 : deltaCol / Math.abs(deltaCol);
    
    let word = '';
    let currentRow = first.row;
    let currentCol = first.col;
    
    for (let i = 0; i <= distance; i++) {
      if (currentRow >= 0 && currentRow < GRID_SIZE && currentCol >= 0 && currentCol < GRID_SIZE) {
        word += grid[currentRow][currentCol];
      }
      currentRow += stepRow;
      currentCol += stepCol;
    }
    
    return word;
  };

  // Check if cell is part of found word
  const isCellFound = (row: number, col: number): boolean => {
    return foundWords.some(word => {
      const deltaRow = word.endRow - word.startRow;
      const deltaCol = word.endCol - word.startCol;
      const distance = Math.max(Math.abs(deltaRow), Math.abs(deltaCol));
      
      if (distance === 0) return false;
      
      const stepRow = deltaRow === 0 ? 0 : deltaRow / Math.abs(deltaRow);
      const stepCol = deltaCol === 0 ? 0 : deltaCol / Math.abs(deltaCol);
      
      for (let i = 0; i <= distance; i++) {
        const checkRow = word.startRow + i * stepRow;
        const checkCol = word.startCol + i * stepCol;
        if (checkRow === row && checkCol === col) return true;
      }
      return false;
    });
  };

  // Start game
  const startGame = () => {
    setGameState('playing');
    setFoundWords([]);
    setSelectedCells([]);
    setIsSelecting(false);
    setStartTime(Date.now());
    createGrid();
  };

  // Check win condition
  useEffect(() => {
    if (gameState === 'playing' && foundWords.length === wordsToFind.length && wordsToFind.length > 0) {
      setGameState('ended');
    }
  }, [foundWords, wordsToFind, gameState]);

  useEffect(() => {
    if (gameState === 'ended') {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const score = foundWords.length * 10;
      onGameComplete(score, duration);
    }
  }, [gameState, foundWords.length, startTime, onGameComplete]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Search className="w-6 h-6 text-purple-500" />
          <span className="text-xl font-bold">Mustang Word Search</span>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">Found: {foundWords.length}/{wordsToFind.length}</Badge>
        </div>
      </div>

      <div className="flex-1 flex space-x-4 p-4">
        {/* Game Grid */}
        <div className="flex-1 flex justify-center">
          {gameState === 'ready' ? (
            <div className="text-center space-y-4">
              <Button onClick={startGame} size="lg" className="bg-purple-600 hover:bg-purple-700">
                Start Word Search!
              </Button>
              <p className="text-sm text-gray-600">Find all the hidden BHSA and education words!</p>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-1 max-w-md">
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <motion.button
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-6 h-6 text-xs font-bold border border-gray-300 ${
                      isCellFound(rowIndex, colIndex) 
                        ? 'bg-green-200 text-green-800' 
                        : selectedCells.some(sc => sc.row === rowIndex && sc.col === colIndex)
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {cell}
                  </motion.button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Words List */}
        {gameState !== 'ready' && (
          <div className="w-48 space-y-2">
            <h3 className="font-bold text-lg">Words to Find:</h3>
            <div className="space-y-1">
              {wordsToFind.map(word => (
                <div
                  key={word}
                  className={`p-2 rounded ${
                    foundWords.some(fw => fw.word === word)
                      ? 'bg-green-100 text-green-800 line-through'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {word}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {gameState === 'ended' && (
        <div className="text-center space-y-4 p-4">
          <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <span>Congratulations! All words found!</span>
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
  );
}