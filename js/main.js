// js/main.js
import { Paddle, Ball, Brick, checkCollisions } from './entities.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const uiLayer = document.getElementById('uiLayer');
const scoreEl = document.getElementById('score');
const messageEl = document.getElementById('message');
const actionBtn = document.getElementById('actionBtn');

const CANVAS_W = canvas.width;
const CANVAS_H = canvas.height;

// Paddle constants
const PADDLE_W = 100;
const PADDLE_H = 15;
const PADDLE_START_X = (CANVAS_W / 2) - (PADDLE_W / 2);
const PADDLE_START_Y = CANVAS_H - 35;
const PADDLE_SPEED = 400;

// Ball constants
const BALL_RADIUS = 6;
const BALL_SPEED = 400;

// Bricks
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_W = 75;
const BRICK_H = 20;
const BRICK_PADDING_X = 15;
const BRICK_PADDING_Y = 15;
const BRICK_OFFSET_TOP = 50;
const BRICK_OFFSET_LEFT = 47.5;
const BRICK_COLORS = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0000ff'];

// Game state
let paddle;
let ball;
let bricks = [];
let score = 0; // in TB units
let gameState = 'START'; // 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'
let keys = { ArrowLeft: false, ArrowRight: false };
let rafId = null;
let lastTime = 0;

function createBricks() {
  const arr = [];
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      const x = BRICK_OFFSET_LEFT + col * (BRICK_W + BRICK_PADDING_X);
      const y = BRICK_OFFSET_TOP + row * (BRICK_H + BRICK_PADDING_Y);
      const color = BRICK_COLORS[row] || '#ffffff';
      arr.push(new Brick(x, y, BRICK_W, BRICK_H, color));
    }
  }
  return arr;
}

function initGame() {
  // reset
  paddle = new Paddle(PADDLE_START_X, PADDLE_START_Y, PADDLE_W, PADDLE_H, PADDLE_SPEED);
  ball = new Ball(paddle.x + paddle.width / 2, paddle.y - BALL_RADIUS - 1, BALL_RADIUS, BALL_SPEED);

  // initial angle: mostly upward with small random X component
  const angleVariance = 0.6; // radians total spread
  const angle = -Math.PI / 2 + (Math.random() * angleVariance - angleVariance / 2);
  ball.setDirection(angle);

  bricks = createBricks();
  score = 0;
  updateScoreUI();

  gameState = 'PLAYING';
  messageEl.textContent = '';
  actionBtn.style.display = 'none';

  // reset timing
  lastTime = performance.now();
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(gameLoop);
}

function updateScoreUI() {
  scoreEl.textContent = `Çalınan Veri: ${score} TB`;
}

function endGame(state) {
  gameState = state;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (state === 'VICTORY') {
    messageEl.textContent = 'SİSTEME SIZILDI - VERİLER İNDİRİLDİ';
  } else if (state === 'GAMEOVER') {
    messageEl.textContent = 'BAĞLANTI KOPTU - SİSTEM KİLİTLENDİ';
  }
  actionBtn.textContent = 'YENİDEN BAĞLAN';
  actionBtn.style.display = 'inline-block';
}

function drawBackground() {
  // fill background
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // subtle grid or neon lines could be added but not required by spec
}

function gameLoop(timestamp) {
  // dt calculation with cap
  let dt = (timestamp - lastTime) / 1000;
  dt = Math.min(dt, 0.05);
  lastTime = timestamp;

  // update
  if (gameState === 'PLAYING') {
    paddle.update(dt, keys, canvas);
    ball.update(dt);

    // collisions
    const result = checkCollisions(ball, paddle, bricks, canvas);
    if (result.status === 'LOSE') {
      endGame('GAMEOVER');
    } else if (result.status === 'BRICK_HIT') {
      // increment score by 10 TB per brick
      score += 10;
      updateScoreUI();
      // check victory
      const remaining = bricks.filter(b => b.active).length;
      if (remaining === 0) {
        endGame('VICTORY');
      }
    }
  }

  // render
  drawBackground();
  // draw bricks
  for (const b of bricks) b.draw(ctx);
  // draw paddle and ball
  paddle.draw(ctx);
  ball.draw(ctx);

  // continue loop if playing
  if (gameState === 'PLAYING') {
    rafId = requestAnimationFrame(gameLoop);
  } else {
    rafId = null;
  }
}

// Input handlers
window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
    keys[e.code] = true;
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
    keys[e.code] = false;
    e.preventDefault();
  }
});

// Button click
actionBtn.addEventListener('click', () => {
  if (gameState === 'START') {
    initGame();
  } else if (gameState === 'GAMEOVER' || gameState === 'VICTORY') {
    // restart
    actionBtn.style.display = 'none';
    initGame();
  }
});

// Initial UI state
function setupInitialUI() {
  scoreEl.textContent = 'Çalınan Veri: 0 TB';
  messageEl.textContent = '';
  actionBtn.textContent = 'SİSTEME SIZ';
  actionBtn.style.display = 'inline-block';
  // draw initial static scene
  drawBackground();
  // draw initial paddle and ball for visual
  const tempPaddle = new Paddle(PADDLE_START_X, PADDLE_START_Y, PADDLE_W, PADDLE_H, PADDLE_SPEED);
  const tempBall = new Ball(tempPaddle.x + tempPaddle.width / 2, tempPaddle.y - BALL_RADIUS - 1, BALL_RADIUS, BALL_SPEED);
  tempPaddle.draw(ctx);
  tempBall.draw(ctx);
}

setupInitialUI();
