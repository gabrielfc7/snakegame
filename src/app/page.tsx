"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { adjustDifficulty } from "@/ai/flows/dynamic-difficulty-adjustment";
import { Toaster } from "@/components/ui/toaster";

const calculateGridSize = () => {
  if (typeof window === 'undefined') {
    return 20;
  }
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // Determine the smaller dimension to adapt the grid size
  const smallerDimension = Math.min(screenWidth, screenHeight);

  // Define a base grid size and adjust based on the smaller dimension
  let baseGridSize = 20;

  // Adjust baseGridSize based on the screen size
  if (smallerDimension <= 400) {
    baseGridSize = 15; // Smaller screens
  } else if (smallerDimension > 800) {
    baseGridSize = 25; // Larger screens
  }

  return baseGridSize;
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

export default function Home() {
  const [GRID_SIZE, setGRID_SIZE] = useState(20); // Initialize with a default value
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [foodSpawnRate, setFoodSpawnRate] = useState(1);
  const [genAIOutput, setGenAIOutput] = useState<{suggestedFoodSpawnRate: number, reasoning: string} | null>(null);

  const gameInterval = useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection({ x: 1, y: 0 });
    setScore(0);
    setGameOver(false);
    setFoodSpawnRate(1);
  }, []);

  const endGame = useCallback(() => {
    setGameOver(true);
    if (gameInterval.current) {
      clearInterval(gameInterval.current);
      gameInterval.current = null;
    }
  }, []);

  const generateFood = useCallback(() => {
    let newFood: Cell;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some(segment => areCellsEqual(segment, newFood))); // Ensure food doesn't spawn on the snake

    setFood(newFood);
  }, [snake, GRID_SIZE]);

  const moveSnake = useCallback(() => {
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
      setGRID_SIZE(calculateGridSize());
    };

    // Only add the event listener on the client-side
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      handleResize(); // Initial calculation

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        // WASD controls
        case 'w':
          setDirection({ x: 0, y: -1 });
          break;
        case 's':
          setDirection({ x: 0, y: 1 });
          break;
        case 'a':
          setDirection({ x: -1, y: 0 });
          break;
        case 'd':
          setDirection({ x: 1, y: 0 });
          break;

        // Arrow key controls
        case 'ArrowUp':
          setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
        <Grid GRID_SIZE={GRID_SIZE} snake={snake} food={food} cellSize={Math.min(window.innerWidth, window.innerHeight) / (GRID_SIZE + 2)}/>
      )}
      {gameOver ? (
        <div className="text-yellow-500 mt-4">
          Game Over! Your score: {score}
          <button className="bg-green-500 text-white px-4 py-2 rounded ml-4" onClick={startGame}>
            Play Again
          </button>
        </div>
      ) : (
        <div className="text-gray-500 mt-4">Use WASD or Arrow keys to move.</div>
      )}
      {!gameOver && <div className="text-gray-500 mt-2">Food Spawn Rate: {foodSpawnRate.toFixed(2)}</div>}

      {/* Ad Banner */}
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
}

const Grid: React.FC<GridProps> = ({ GRID_SIZE, snake, food, cellSize }) => {
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
            cellColor = 'bg-primary'; // Snake color
          } else if (isFood) {
            cellColor = 'bg-destructive'; // Food color (using destructive for red)
          }

          return <div key={i} className={`${cellColor} w-[${cellSize}px] h-[${cellSize}px]`}/>;
        })}
      </div>
  )
}
