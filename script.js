const GRID_SIZE = 25;
const CELL_SIZE = 20;
const MOVE_INTERVAL = 150;
const snakeColors = ["#4CAF50", "#388E3C", "#2E7D32", "#1B5E20", "#004D40"];

let snake = [{ x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) }];
let food = { x: Math.floor(GRID_SIZE * 0.75), y: Math.floor(GRID_SIZE * 0.25) };
let direction = { x: 1, y: 0 };
let score = 0;
let gameOver = false;
let highScore = localStorage.getItem("highScore") ? parseInt(localStorage.getItem("highScore"), 10) : 0;
let isNewHighScore = false;
let snakeColor = snakeColors[0];
let gameInterval;

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);

canvas.width = GRID_SIZE * CELL_SIZE;
canvas.height = GRID_SIZE * CELL_SIZE;

const scoreDiv = document.createElement('div');
scoreDiv.style.fontFamily = "monospace";
scoreDiv.style.fontSize = "1.5rem";
scoreDiv.style.color = "yellow";
scoreDiv.style.textShadow = "1px 1px 2px #000";
scoreDiv.style.marginBottom = "10px";
document.body.appendChild(scoreDiv);

const gameOverDiv = document.createElement("div");
gameOverDiv.style.display = "none";
gameOverDiv.style.position = "absolute";
gameOverDiv.style.top = "50%";
gameOverDiv.style.left = "50%";
gameOverDiv.style.transform = "translate(-50%, -50%)";
gameOverDiv.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
gameOverDiv.style.color = "yellow";
gameOverDiv.style.padding = "20px";
gameOverDiv.style.borderRadius = "10px";
gameOverDiv.style.boxShadow = "0px 0px 10px #00ffff";
gameOverDiv.style.fontFamily = "monospace";
gameOverDiv.style.textAlign = "center";
document.body.appendChild(gameOverDiv);

const gameOverText = document.createElement("h2");
gameOverText.style.fontSize = "2rem";
gameOverText.style.marginBottom = "10px";
gameOverText.textContent = "Game Over!";
gameOverDiv.appendChild(gameOverText);

const scoreText = document.createElement("p");
scoreText.textContent = "Your score: 0";
gameOverDiv.appendChild(scoreText);

const highScoreText = document.createElement("div");
highScoreText.textContent = "High Score: 0";
gameOverDiv.appendChild(highScoreText);

const playAgainButton = document.createElement("button");
playAgainButton.textContent = "Play Again";
playAgainButton.style.marginTop = "10px";
playAgainButton.style.padding = "10px 20px";
playAgainButton.style.backgroundColor = "blue";
playAgainButton.style.color = "white";
playAgainButton.style.border = "none";
playAgainButton.style.borderRadius = "5px";
playAgainButton.style.cursor = "pointer";
playAgainButton.addEventListener("click", startGame);
gameOverDiv.appendChild(playAgainButton);

document.body.style.backgroundColor = 'gray';
document.body.style.display = 'flex';
document.body.style.flexDirection = 'column';
document.body.style.alignItems = 'center';
document.body.style.justifyContent = 'center';
document.body.style.minHeight = '100vh';
document.body.style.margin = '0';

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const x = i % GRID_SIZE;
    const y = Math.floor(i / GRID_SIZE);
    ctx.strokeStyle = "transparent";
    ctx.fillStyle = "rgba(0, 100, 100, 0.5)";
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }

  snake.forEach((segment, index) => {
    ctx.fillStyle = snakeColor;
    ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  });

  ctx.fillStyle = "#FFA500";
  ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function areCellsEqual(cell1, cell2) {
  return cell1.x === cell2.x && cell1.y === cell2.y;
}

function generateFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((segment) => areCellsEqual(segment, newFood)));
  food = newFood;
}

function moveSnake() {
  const head = snake[0];
  const newHead = {
    x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
    y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
  };

  if (snake.some((segment) => areCellsEqual(segment, newHead))) {
    endGame();
    return;
  }

  snake.unshift(newHead);

  if (areCellsEqual(newHead, food)) {
    score += 10;
      if (snake.length <= snakeColors.length) {
        snakeColor = snakeColors[Math.floor(Math.random() * snakeColors.length)];
      }
    generateFood();
  } else {
    snake.pop();
  }
  drawGrid();
  scoreDiv.textContent = `Score: ${score}`;
}

function endGame() {
  gameOver = true;
  clearInterval(gameInterval);
  gameOverDiv.style.display = "block";
  scoreText.textContent = `Your score: ${score}`;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore.toString());
    isNewHighScore = true;
  }
    highScoreText.textContent = `High Score: ${highScore}`;
}

function initializeGame() {
    snake = [{ x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) }];
    food = { x: Math.floor(GRID_SIZE * 0.75), y: Math.floor(GRID_SIZE * 0.25) };
}

function startGame() {
    snakeColor = snakeColors[Math.floor(Math.random() * snakeColors.length)];
    direction = { x: 1, y: 0 };
    score = 0;
    gameOver = false;
    isNewHighScore = false;
    initializeGame();
    gameOverDiv.style.display = "none";
    gameInterval = setInterval(moveSnake, MOVE_INTERVAL);
}

function handleKeyDown(e) {
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
    if (!(newDirection.x === -direction.x || newDirection.y === -direction.y)) {
        direction = newDirection;
    }
}

window.addEventListener("keydown", handleKeyDown);

let startX, startY;

const handleTouchStart = (e) => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
};

const handleTouchEnd = (e) => {
    if (startX === undefined || startY === undefined) {
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

    if (!(newDirection.x === -direction.x || newDirection.y === -direction.y)) {
        direction = newDirection;
    }

    startX = undefined;
    startY = undefined;
};

canvas.addEventListener("touchstart", handleTouchStart);
canvas.addEventListener("touchend", handleTouchEnd);
startGame();