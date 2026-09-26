import { fromAngularVelocity, multiply, normalize, type Quat } from "./quaternion";

// A steel ball on a table, seen from above. Screen pixels: x right, y down.
// Everything here is pure and allocation-light so it can run every frame and
// be unit-tested without a browser.

export type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Orientation (ball → world), world = x right, y up, z toward the viewer. */
  q: Quat;
  /** Total distance rolled, px. */
  distance: number;
};

export type Params = {
  radius: number;
  /** Share of speed kept when bouncing off a wall. */
  restitution: number;
  /** Speed-proportional loss, 1/s (air, a slightly soft desk). */
  drag: number;
  /** Constant deceleration, px/s² (rolling resistance), so it comes to rest. */
  rollingResistance: number;
  /** Below this speed, px/s, the ball is at rest. */
  restSpeed: number;
  /** Hard cap on speed, px/s (a backstop; strikeLimit does the real work). */
  maxSpeed: number;
  /**
   * The speed a hit can leave the ball with, px/s, approached smoothly: gentle
   * pushes pass through almost untouched, and no flick, however wild, and no
   * run of flicks, can send it faster. A heavy ball absorbs hard hits.
   */
  strikeLimit: number;
};

export type Bounds = { width: number; height: number };

/** Bounciness of a cursor hit. */
const STRIKE_RESTITUTION = 0.2;
/**
 * The cursor's mass as a share of cursor + ball, m_c / (m_b + m_c). Below 1 the
 * hand is not an immovable bat: a solid steel ball takes only part of the hit
 * and leaves slower than the stroke (0.66 with the restitution above: ~0.79×).
 */
const CURSOR_MASS_SHARE = 0.66;

export function createBall(x: number, y: number): Ball {
  return { x, y, vx: 0, vy: 0, q: [0, 0, 0, 1], distance: 0 };
}

export const speed = (b: Ball) => Math.hypot(b.vx, b.vy);

export function isAtRest(b: Ball) {
  return b.vx === 0 && b.vy === 0;
}

/**
 * Advances the ball by dt seconds, in substeps short enough that even the
 * fastest ball moves under half its radius per substep (no tunnelling through
 * walls). Returns the strongest wall impact speed, px/s (0 if
 * none), for sound or feedback.
 */
export function step(
  ball: Ball,
  dt: number,
  bounds: Bounds,
  p: Params,
): number {
  const fastest = speed(ball);
  const n = Math.min(64, Math.max(1, Math.ceil((fastest * dt) / (p.radius * 0.5))));
  const h = dt / n;
  let impact = 0;
  for (let i = 0; i < n; i++) impact = Math.max(impact, substep(ball, h, bounds, p));
  return impact;
}

function substep(
  ball: Ball,
  h: number,
  bounds: Bounds,
  p: Params,
): number {
  // Rolling losses: proportional plus constant, applied to the speed.
  const s0 = speed(ball);
  if (s0 > 0) {
    const next = Math.max(0, s0 - (p.drag * s0 + p.rollingResistance) * h);
    const k = next < p.restSpeed ? 0 : next / s0;
    ball.vx *= k;
    ball.vy *= k;
  }

  const s = speed(ball);
  if (s > p.maxSpeed) {
    ball.vx *= p.maxSpeed / s;
    ball.vy *= p.maxSpeed / s;
  }

  const x0 = ball.x;
  const y0 = ball.y;
  ball.x += ball.vx * h;
  ball.y += ball.vy * h;
  const impact = walls(ball, bounds, p);
  roll(ball, ball.x - x0, ball.y - y0, p.radius);
  return impact;
}

/**
 * How deep, as a share of the ball's radius, the cursor can sit inside the
 * ball's edge and still be pushing it. Deeper than this it is hovering over
 * the ball (after a hit, or the ball rolled under it) and is ignored until it
 * leaves, so hovering never steers the ball.
 */
const PUSH_SHELL = 0.35;

/**
 * The cursor moved from (x0, y0) to (x1, y1) at velocity (vx, vy) since the
 * last pointer event; it's a round body of radius `cursorRadius`. Two kinds
 * of contact, both driven only by the cursor's own motion (a ball rolling
 * under a still cursor is never deflected):
 *
 * - Hit: the path enters the ball from outside. Found by sweeping the path,
 *   since a fast flick can jump clean past the centre between events; the
 *   ball is knocked from the entry point with the collision impulse.
 * - Push: the cursor is already touching, near the edge, and moving into the
 *   ball. The ball is carried along at the cursor's speed, never faster, like
 *   a hand steering a heavy ball.
 *
 * Either way the result passes through the soft speed ceiling. Returns
 * whether the ball was touched.
 */
export function strike(
  ball: Ball,
  p: Params,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  vx: number,
  vy: number,
  cursorRadius: number,
): boolean {
  const reach = p.radius + cursorRadius;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const fx = x0 - ball.x;
  const fy = y0 - ball.y;
  const c = fx * fx + fy * fy - reach * reach;

  if (c > 0) {
    // Started outside: does the path enter? |f + t·d|² = reach², t in [0, 1].
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const disc = b * b - 4 * a * c;
    if (a === 0 || disc < 0) return false;
    const t = (-b - Math.sqrt(disc)) / (2 * a);
    if (t < 0 || t > 1) return false;
    const [nx, ny] = unit(ball.x - (x0 + t * dx), ball.y - (y0 + t * dy));
    if (vx * nx + vy * ny <= 0) return false; // the cursor itself must move into the ball
    // Closing speed along the contact normal (negative = approaching).
    const vn = (ball.vx - vx) * nx + (ball.vy - vy) * ny;
    if (vn >= 0) return false; // the ball is already getting away faster
    ball.vx -= (1 + STRIKE_RESTITUTION) * CURSOR_MASS_SHARE * vn * nx;
    ball.vy -= (1 + STRIKE_RESTITUTION) * CURSOR_MASS_SHARE * vn * ny;
  } else {
    // Started touching: push only from the rim, only into the ball.
    const dist = Math.hypot(ball.x - x1, ball.y - y1);
    if (dist >= reach || dist < reach - PUSH_SHELL * p.radius) return false;
    const [nx, ny] = unit(ball.x - x1, ball.y - y1);
    const push = vx * nx + vy * ny;
    const vbn = ball.vx * nx + ball.vy * ny;
    if (push <= 0 || vbn >= push) return false;
    ball.vx += (push - vbn) * nx;
    ball.vy += (push - vbn) * ny;
  }

  // Soft ceiling: s → L·tanh(s/L), nearly linear well below L, never above it.
  const s = speed(ball);
  if (s > 0) {
    const k = (p.strikeLimit * Math.tanh(s / p.strikeLimit)) / s;
    ball.vx *= k;
    ball.vy *= k;
  }
  return true;
}

function unit(x: number, y: number): [number, number] {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

/** The window edges: reflect with restitution. Returns the impact speed. */
function walls(ball: Ball, b: Bounds, p: Params): number {
  const r = p.radius;
  let impact = 0;
  // v is the velocity component into the wall (positive = moving into it).
  const bounce = (v: number) => {
    impact = Math.max(impact, v);
    return v * p.restitution;
  };
  if (ball.x < r) {
    ball.x = r;
    if (ball.vx < 0) ball.vx = bounce(-ball.vx);
  } else if (ball.x > b.width - r) {
    ball.x = b.width - r;
    if (ball.vx > 0) ball.vx = -bounce(ball.vx);
  }
  if (ball.y < r) {
    ball.y = r;
    if (ball.vy < 0) ball.vy = bounce(-ball.vy);
  } else if (ball.y > b.height - r) {
    ball.y = b.height - r;
    if (ball.vy > 0) ball.vy = -bounce(ball.vy);
  }
  return impact;
}

/**
 * Rolling without slipping: moving by d turns the ball |d|/r radians about the
 * axis (table normal × d). In world axes (y up) a screen move (dx, dy) is
 * (dx, −dy), and z × (dx, −dy, 0) = (dy, dx, 0).
 */
function roll(ball: Ball, dx: number, dy: number, r: number) {
  const d = Math.hypot(dx, dy);
  if (d === 0) return;
  ball.distance += d;
  ball.q = normalize(multiply(fromAngularVelocity(dy / r, dx / r, 0, 1), ball.q));
}

/** Keeps a resting ball inside new bounds (window resize). */
export function clampToBounds(ball: Ball, b: Bounds, r: number) {
  ball.x = Math.min(Math.max(ball.x, r), Math.max(r, b.width - r));
  ball.y = Math.min(Math.max(ball.y, r), Math.max(r, b.height - r));
}
