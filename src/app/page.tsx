"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { adjustDifficulty } from "@/ai/flows/dynamic-difficulty-adjustment";
import { Toaster } from "@/components/ui/toaster";

const GRID_SIZE = 20;
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
  }, [snake]);

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
  }, [direction, endGame, food, generateFood]);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
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
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 20px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 20px)`,
          width: `${GRID_SIZE * 20}px`,
          height: `${GRID_SIZE * 20}px`,
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

          return <div key={i} className={`${cellColor} w-[20px] h-[20px]`}/>;
        })}
      </div>
      {gameOver ? (
        <div className="text-yellow-500 mt-4">
          Game Over! Your score: {score}
          <button className="bg-green-500 text-white px-4 py-2 rounded ml-4" onClick={startGame}>
            Play Again
          </button>
        </div>
      ) : (
        <div className="text-gray-500 mt-4">Use arrow keys to move.</div>
      )}
      {!gameOver && <div className="text-gray-500 mt-2">Food Spawn Rate: {foodSpawnRate.toFixed(2)}</div>}
    </div>
  );
}
