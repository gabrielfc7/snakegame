"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  SetStateAction,
} from "react";

import { Toaster } from "@/components/ui/toaster";

const GRID_SIZE = 25;
const CELL_SIZE = 20;

type Cell = {
  x: number;
  y: number;
};

const areCellsEqual = (cell1: Cell, cell2: Cell) => {
  return cell1.x === cell2.x && cell1.y === cell2.y;
};

const INITIAL_SNAKE: Cell[] = [{ x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) }];
const INITIAL_FOOD: Cell = { x: Math.floor(GRID_SIZE * 0.70), y: Math.floor(GRID_SIZE * 0.25) };
const MOVE_INTERVAL = 150;
const Grid = ({
  GRID_SIZE,
  snake,
  food,
  cellSize,
  snakeColor,
  setDirection,
}: {
  GRID_SIZE: number;
  snake: { x: number; y: number }[];
  food: { x: number; y: number };
  cellSize: number;
  setDirection: React.Dispatch<SetStateAction<{ x: number; y: number }>>
  snakeColor: string;
}) => {
  const gridSizePx = (GRID_SIZE * cellSize) + 4;
  const gridRef = useRef<HTMLDivElement>(null);
  let startX: number, startY: number;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startX === undefined || startY === undefined || !gridRef.current) {
      return;
    }

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    let newDirection = { x: 0, y: 0 };

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      newDirection = deltaX > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    } else {
      newDirection = deltaY > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    }

    setDirection((currDir) => {
      if (!(newDirection.x === -currDir.x || newDirection.y === -currDir.y)) {
        return newDirection;
      }
      return currDir;
    });

    startX = undefined;
    startY = undefined;
  };

  return (
    <div
      ref={gridRef}
      className="grid"
      style={{
        boxShadow: "0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff",        
        border: "2px solid #0ff",
        borderRadius: "10px",
        gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize}px)`,
        width: gridSizePx,
        height: gridSizePx,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        overflow: "hidden",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
        const x = i % GRID_SIZE;
        const y = Math.floor(i / GRID_SIZE);
        const isSnake = snake.some((segment) => areCellsEqual(segment, { x, y }));
        const isFood = areCellsEqual(food, { x, y });
        let cellStyle: React.CSSProperties = {
          backgroundColor: "rgba(0, 100, 100, 0.5)",          
          width: cellSize,
          height: cellSize,
          boxSizing: "border-box",
          border: "1px solid transparent",          
        };

        if (isSnake) {
          cellStyle.backgroundColor = snakeColor;
          cellStyle.boxShadow = "0 0 5px #0f0";
        } else if (isFood) {
          cellStyle.backgroundColor = "#FFA500";
        }

        return <div key={i} style={cellStyle} />;
      })}
    </div>    
  );
};

export default function Home() {
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof localStorage !== "undefined") {
      const storedHighScore = localStorage.getItem("highScore");
      return storedHighScore ? parseInt(storedHighScore, 10) : 0;
    }
    return 0;
  });
  const [snake, setSnake] = useState<Cell[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Cell>(INITIAL_FOOD);
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [cellSize, setCellSize] = useState(20);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const snakeColors = ["#4CAF50", "#388E3C", "#2E7D32", "#1B5E20", "#004D40"];
  const [snakeColor, setSnakeColor] = useState(snakeColors[0]);
  useEffect(() => {
    if (!snakeColors.includes(snakeColor)) {
      setSnakeColor(
        snakeColors[Math.floor(Math.random() * snakeColors.length)]
      );
    }
  }, [snakeColor, snakeColors]);

  const gameInterval = useRef<NodeJS.Timeout | null>(null);

  const initializeGame = useCallback((gridSize: number) => {
    const initialSnake = [
      { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) },
    ];
    const initialFood = {
      x: Math.floor(gridSize * 0.75),
      y: Math.floor(gridSize * 0.25),
    };
    setSnake(initialSnake);
    setFood(initialFood);
  }, []);

  const startGame = useCallback(() => {
    setDirection({ x: 1, y: 0 });
    setScore(0);
    setGameOver(false);
    setIsNewHighScore(false);
    const initialSnake = [{ x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) }];
    setSnake(initialSnake);
    generateFood();
    setSnakeColor(snakeColors[Math.floor(Math.random() * snakeColors.length)]);
    const newGridSize = GRID_SIZE;
    setCellSize(calculateCellSize(newGridSize));
    initializeGame(newGridSize);    
  }, [initializeGame]);

  const endGame = useCallback(() => {
    setGameOver(true);
    if (gameInterval.current) {
      clearInterval(gameInterval.current);
      gameInterval.current = null;
    }

    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("highScore", score.toString());
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
    } while (snake.some((segment) => areCellsEqual(segment, newFood)));

    setFood(newFood);
  }, [snake, GRID_SIZE]);

  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      if (prevSnake.some((segment) => areCellsEqual(segment, newHead))) {
        endGame();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];
      if (areCellsEqual(newHead, food)) {
        setScore((prevScore) => prevScore + 10);
        if (newSnake.length <= snakeColors.length) {
          setSnakeColor(
            snakeColors[Math.floor(Math.random() * snakeColors.length)]
          );
        }
        generateFood();

        return newSnake;
      } else {
        return newSnake.slice(0, -1);
      }
    });
  }, [direction, endGame, food, generateFood, GRID_SIZE, snakeColors]);  

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
      let newDirection = { ...direction };
      switch (e.key) {          
          case "w":
          case "ArrowUp":
            newDirection = { x: 0, y: -1 };
            break;
          case "s":
          case "ArrowDown":
            newDirection = { x: 0, y: 1 };
            break;
          case "a":
          case "ArrowLeft":
          newDirection = { x: -1, y: 0 };
          break;
        case "d":
        case "ArrowRight":
          newDirection = { x: 1, y: 0 };
          break;
      }
      if (
        !(newDirection.x === -direction.x || newDirection.y === -direction.y)
      ) {
          setDirection(newDirection);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {        
          window.removeEventListener("keydown", handleKeyDown);
        };    
  }, [direction]);
  
  

  const isTouchDevice =
    typeof window !== "undefined" && "ontouchstart" in window;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-800 text-white">
      <Toaster />
      <div
        className="text-2xl font-bold text-center text-yellow-300 font-mono mb-4"
        style={{ fontFamily: "monospace", textShadow: "1px 1px 2px #000" }}
      >
        SNAKE
      </div>
      <div
        className="mb-6 px-4 py-2 rounded-md"
        style={{
          fontFamily: "monospace",
          fontSize: "1.5rem",
          color: "yellow",
          textShadow: "1px 1px 2px #000",
        }}
      >
        Score: {score}
      </div>
      {typeof window !== "undefined" && (
        <div className="p-2 rounded-md shadow-inner">
          <Grid
            GRID_SIZE={25}
            snake={snake}
            food={food}
            cellSize={cellSize}
            setDirection={setDirection}
            snakeColor={snakeColor}
          />
        </div>
      )}
      <div className="text-gray-400 mt-4 text-center">
        {isTouchDevice ? "Swipe to move." : "Use WASD or Arrow keys to move."}        
      </div>
      {gameOver && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 bg-opacity-90 text-yellow-300 p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-3xl font-bold mb-4 font-mono">Game Over!</h2>
          <p className="text-lg mb-2">Your score: {score}</p>
          {isNewHighScore ? (
            <div className="text-green-400 font-bold text-xl">
              New High Score!
            </div>
          ) : (
            <div>High Score: {highScore}</div>
          )}
          <button
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            onClick={startGame}
          >
            Play Again
          </button>
        </div>
      )}
      <div className="w-full max-w-md mt-8">
        <div          
          className="text-gray-400 mt-4 text-center"
        >          
            {isTouchDevice ? "Swipe to move." : "Use WASD or Arrow keys to move."}
        </div>        
      </div>
    </div>
  );
}