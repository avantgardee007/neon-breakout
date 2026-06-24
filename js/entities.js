// js/entities.js

export class Paddle {
  constructor(x, y, width = 100, height = 15, speed = 400) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.color = '#00ffff';
    this.shadow = '#00ffff';
  }

  update(dt, keys, canvas) {
    if (keys.ArrowLeft) {
      this.x -= this.speed * dt;
    }
    if (keys.ArrowRight) {
      this.x += this.speed * dt;
    }
    // Clamp
    this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.shadow;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

export class Ball {
  constructor(x, y, radius = 6, speed = 400) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = speed;
    this.vx = 0;
    this.vy = 0;
    this.color = '#ff0055';
    this.shadow = '#ff0055';
  }

  setDirection(angle) {
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.shadow;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

export class Brick {
  constructor(x, y, width = 75, height = 20, color = '#ff0000') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.active = true;
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

/**
 * checkCollisions(ball, paddle, bricks, canvas)
 * Handles:
 * - wall collisions (left/right/top)
 * - bottom detection (returns 'LOSE' if ball falls)
 * - paddle collision with bounce angle
 * - brick collisions (circle-rect) via penetration depth
 *
 * Returns:
 * { status: null | 'LOSE' | 'BRICK_HIT', brick?: Brick }
 */
export function checkCollisions(ball, paddle, bricks, canvas) {
  // Walls: left & right
  if (ball.x - ball.radius <= 0) {
    ball.x = ball.radius;
    ball.vx *= -1;
  } else if (ball.x + ball.radius >= canvas.width) {
    ball.x = canvas.width - ball.radius;
    ball.vx *= -1;
  }

  // Top
  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.vy *= -1;
  }

  // Bottom -> lose
  if (ball.y - ball.radius > canvas.height) {
    return { status: 'LOSE' };
  }

  // Paddle collision (circle-rect)
  const nearestX = Math.max(paddle.x, Math.min(ball.x, paddle.x + paddle.width));
  const nearestY = Math.max(paddle.y, Math.min(ball.y, paddle.y + paddle.height));
  const dx = ball.x - nearestX;
  const dy = ball.y - nearestY;
  const distSq = dx * dx + dy * dy;
  
  if (distSq <= ball.radius * ball.radius) {
    if (ball.vy > 0) {
      const hitPoint = ball.x - (paddle.x + paddle.width / 2);
      const normalizedHit = hitPoint / (paddle.width / 2);
      const bounceAngle = normalizedHit * (Math.PI / 3); // Max 60 degrees
      const speed = ball.speed;
      
      ball.vx = Math.sin(bounceAngle) * speed;
      ball.vy = -Math.cos(bounceAngle) * speed;
      ball.y = paddle.y - ball.radius - 0.1;
    }
  }

  // Bricks collision via Penetration Depth
  for (let i = 0; i < bricks.length; i++) {
    const b = bricks[i];
    if (!b.active) continue;

    const nx = Math.max(b.x, Math.min(ball.x, b.x + b.width));
    const ny = Math.max(b.y, Math.min(ball.y, b.y + b.height));
    const ddx = ball.x - nx;
    const ddy = ball.y - ny;
    const dist2 = ddx * ddx + ddy * ddy;

    if (dist2 <= ball.radius * ball.radius) {
      const brickCenterX = b.x + b.width / 2;
      const brickCenterY = b.y + b.height / 2;
      
      const diffX = ball.x - brickCenterX;
      const diffY = ball.y - brickCenterY;
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);

      const halfWidth = b.width / 2;
      const halfHeight = b.height / 2;

      const overlapX = halfWidth - absX;
      const overlapY = halfHeight - absY;

      b.active = false;

      if (overlapX < overlapY) {
        ball.vx *= -1;
      } else {
        ball.vy *= -1;
      }

      return { status: 'BRICK_HIT', brick: b };
    }
  }

  return { status: null };
}