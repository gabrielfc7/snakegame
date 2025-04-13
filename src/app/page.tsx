"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { adjustDifficulty } from "@/ai/flows/dynamic-difficulty-adjustment";
import { Toaster } from "@/components/ui/toaster";

const calculateGridSize = () => {
  if (typeof window === 'undefined') {
    return 20;
  }

  return 20;
};

const INITIAL_SNAKE = [{ x: 5, y: 5 }];
const INITIAL_FOOD = { x: 10, y: 10 };
const MOVE_INTERVAL = 150;

type Cell = {
  x: number;
  y: number;
};

// Helper function to check if two cells are equal
const areCellsEqual = (cell1: Cell, cell2: Cell) => {
  return cell1.x === cell2.x && cell1.y === cell2.y;
};

// Helper function to generate a random color
const getRandomColor = (excludeColor: string) => {
  let newColor = '';
  do {
    newColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  } while (newColor === excludeColor); // Ensure it's not the same as the excluded color
  return newColor;
};

export default function Home() {
  const [GRID_SIZE, setGRID_SIZE] = useState(20);
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [foodSpawnRate, setFoodSpawnRate] = useState(1);
  const [genAIOutput, setGenAIOutput] = useState<{suggestedFoodSpawnRate: number, reasoning: string} | null>(null);
  const [cellSize, setCellSize] = useState(20);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [snakeColor, setSnakeColor] = useState('#32CD32'); // Initial snake color
  const [moveCount, setMoveCount] = useState(0);

  const gameInterval = useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection({ x: 1, y: 0 });
    setScore(0);
    setGameOver(false);
    setFoodSpawnRate(1);
    setIsNewHighScore(false);
    setMoveCount(0);
    setSnakeColor('#32CD32'); // Reset snake color on game start
  }, []);

  const endGame = useCallback(() => {
    setGameOver(true);
    if (gameInterval.current) {
      clearInterval(gameInterval.current);
      gameInterval.current = null;
    }

    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('highScore', score.toString());
      setIsNewHighScore(true);
    }
  }, [score, highScore]);

  const generateFood = useCallback(() => {
    let newFood: Cell;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some(segment => areCellsEqual(segment, newFood)));

    setFood(newFood);
  }, [snake, GRID_SIZE]);

  const moveSnake = useCallback(() => {
    setMoveCount(prevCount => prevCount + 1); // Increment move count on each move

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      if (prevSnake.some(segment => areCellsEqual(segment, newHead))) {
        endGame();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];
      if (areCellsEqual(newHead, food)) {
        setScore(prevScore => prevScore + 10);
        generateFood();
        return newSnake;
      } else {
        return newSnake.slice(0, -1);
      }
    });
  }, [direction, endGame, food, generateFood, GRID_SIZE]);

  useEffect(() => {
    const getAISuggestion = async () => {
      if (score > 0 && score % 50 === 0) {
        const aiResponse = await adjustDifficulty({
          currentScore: score,
          currentFoodSpawnRate: foodSpawnRate,
        });

        setGenAIOutput(aiResponse);
        setFoodSpawnRate(aiResponse.suggestedFoodSpawnRate);
      }
    }
    getAISuggestion();
  }, [score, foodSpawnRate]);

  useEffect(() => {
    if (!gameOver) {
      gameInterval.current = setInterval(moveSnake, MOVE_INTERVAL);
    }
    return () => {
      if (gameInterval.current) {
        clearInterval(gameInterval.current);
      }
    };
  }, [gameOver, moveSnake]);

  useEffect(() => {
    const handleResize = () => {
      const newGridSize = calculateGridSize();
      setGRID_SIZE(newGridSize);
      setCellSize(Math.min(window.innerWidth, window.innerHeight) / (newGridSize + 2));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      handleResize();

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let newDirection = { ...direction };

      switch (e.key) {
        case 'w':
        case 'ArrowUp':
          newDirection = { x: 0, y: -1 };
          break;
        case 's':
        case 'ArrowDown':
          newDirection = { x: 0, y: 1 };
          break;
        case 'a':
        case 'ArrowLeft':
          newDirection = { x: -1, y: 0 };
          break;
        case 'd':
        case 'ArrowRight':
          newDirection = { x: 1, y: 0 };
          break;
      }

      if (!(newDirection.x === -direction.x || newDirection.y === -direction.y)) {
        setDirection(newDirection);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [direction]);

  useEffect(() => {
    const storedHighScore = localStorage.getItem('highScore');
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore, 10));
    }
  }, []);

  // Change snake color every 5 moves
  useEffect(() => {
    if (moveCount > 0 && moveCount % 5 === 0) {
      const foodColor = 'var(--destructive)'; // Get the food color
      setSnakeColor(getRandomColor(foodColor)); // Change snake color, excluding food color
    }
  }, [moveCount]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Toaster />
      <div className="text-yellow-500 text-xl mb-4">Score: {score}</div>
      {genAIOutput && (
        <div className="text-yellow-500 text-sm mb-2">
          AI Suggestion: Spawn Rate - {genAIOutput.suggestedFoodSpawnRate.toFixed(2)}, Reasoning - {genAIOutput.reasoning}
        </div>
      )}
      {typeof window !== 'undefined' && (
        <Grid GRID_SIZE={GRID_SIZE} snake={snake} food={food} cellSize={cellSize} snakeColor={snakeColor}/>
      )}
      {gameOver ? (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-800 bg-opacity-75 text-yellow-500 p-4 rounded-md text-center">
          Game Over! Your score: {score}
          {isNewHighScore ? (
            <div className="text-green-500">New High Score!</div>
          ) : (
            <div>High Score: {highScore}</div>
          )}
          <button className="bg-green-500 text-white px-4 py-2 rounded ml-4 mt-2" onClick={startGame}>
            Play Again
          </button>
        </div>
      ) : (
        <div className="text-gray-500 mt-4">Use WASD or Arrow keys to move.</div>
      )}
      {!gameOver && <div className="text-gray-500 mt-2">Food Spawn Rate: {foodSpawnRate.toFixed(2)}</div>}

      <div className="w-full mt-8">
        <div className="bg-yellow-200 text-gray-800 text-center p-2 rounded">
          Ad: Support this game! Click here!
        </div>
      </div>
    </div>
  );
}

interface GridProps {
  GRID_SIZE: number;
  snake: { x: number; y: number; }[];
  food: { x: number; y: number; };
  cellSize: number;
  snakeColor: string;
}

const Grid: React.FC<GridProps> = ({ GRID_SIZE, snake, food, cellSize, snakeColor }) => {
  return (
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize}px)`,
          width: `${GRID_SIZE * cellSize}px`,
          height: `${GRID_SIZE * cellSize}px`,
          border: '2px solid var(--accent)',
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          const isSnake = snake.some(segment => areCellsEqual(segment, { x, y }));
          const isFood = areCellsEqual(food, { x, y });

          let cellColor = 'bg-zinc-800'; // Default cell color
          if (isSnake) {
            cellColor = 'w-[${cellSize}px] h-[${cellSize}px]'
            return <div key={i} className={`${cellColor}`} style={{backgroundColor: snakeColor, width: cellSize, height: cellSize}}/>;
          } else if (isFood) {
            cellColor = 'bg-destructive';
          }

          return <div key={i} className={`${cellColor} w-[${cellSize}px] h-[${cellSize}px]`}/>;
        })}
      </div>
  )
}
