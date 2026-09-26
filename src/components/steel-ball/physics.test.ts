import { describe, it, expect } from "vitest";
import { createBall, hold, isAtRest, release, step, strike, type Params } from "./physics";
import { angle } from "./quaternion";

const params: Params = {
  radius: 50,
  restitution: 0.6,
  drag: 0.5,
  rollingResistance: 30,
  restSpeed: 4,
  maxSpeed: 6000,
  strikeLimit: 6000,
};
const bounds = { width: 1000, height: 800 };
// Same ball but no losses, for exact kinematics.
const frictionless: Params = { ...params, drag: 0, rollingResistance: 0, restSpeed: 0 };

function run(ball: ReturnType<typeof createBall>, seconds: number, p = params) {
  for (let t = 0; t < seconds; t += 1 / 120) step(ball, 1 / 120, bounds, p);
}

describe("steel ball physics", () => {
  it("bounces off a wall keeping `restitution` of its speed", () => {
    const ball = createBall(900, 400);
    ball.vx = 1000;
    const impact = step(ball, 0.1, bounds, frictionless); // hits x = 950 within 0.05 s
    expect(impact).toBeCloseTo(1000);
    expect(ball.vx).toBeCloseTo(-600);
    expect(ball.x).toBeLessThanOrEqual(950);
  });

  it("slows down and comes to rest", () => {
    const ball = createBall(500, 400);
    ball.vx = 800;
    ball.vy = -300;
    run(ball, 30);
    expect(isAtRest(ball)).toBe(true);
  });

  it("never leaves the walls, even at max speed in one long frame", () => {
    const ball = createBall(500, 400);
    ball.vx = 6000;
    ball.vy = 4500;
    for (let i = 0; i < 50; i++) {
      step(ball, 0.05, bounds, params);
      expect(ball.x).toBeGreaterThanOrEqual(50);
      expect(ball.x).toBeLessThanOrEqual(950);
      expect(ball.y).toBeGreaterThanOrEqual(50);
      expect(ball.y).toBeLessThanOrEqual(750);
    }
  });

  it("rolls without slipping: turned angle = distance / radius", () => {
    const ball = createBall(100, 400);
    ball.vx = 100;
    step(ball, 1, bounds, frictionless); // 100 px on a 50 px radius = 2 rad
    expect(ball.distance).toBeCloseTo(100);
    expect(angle(ball.q)).toBeCloseTo(2, 5);
  });

  it("is struck by a cursor sweeping through it, from the side it came from", () => {
    // The stroke jumps from well left of the ball to past its centre in one event.
    const ball = createBall(500, 400);
    const hit = strike(ball, params, 300, 410, 540, 410, 2400, 0, 12);
    expect(hit).toBe(true);
    // Heavy: it goes the way it was hit, but slower than the stroke.
    expect(ball.vx).toBeGreaterThan(1500);
    expect(ball.vx).toBeLessThan(2400);
    // Moved only by velocity, never teleported along with the stroke.
    expect(ball.x).toBe(500);
  });

  it("never flies off, however wild the flick or how many", () => {
    const heavy = { ...params, strikeLimit: 700 };
    const ball = createBall(500, 400);
    strike(ball, heavy, 300, 400, 560, 400, 50000, 0, 12);
    expect(ball.vx).toBeGreaterThan(600); // a firm hit…
    expect(ball.vx).toBeLessThanOrEqual(700); // …but capped
    // Keep flicking it from behind as it rolls: still never past the limit.
    for (let i = 0; i < 10; i++) {
      strike(ball, heavy, ball.x - 200, ball.y, ball.x + 10, ball.y, 50000, 0, 12);
      expect(Math.hypot(ball.vx, ball.vy)).toBeLessThanOrEqual(700);
    }
  });

  it("is nudged gently by a slow cursor", () => {
    const ball = createBall(500, 400);
    expect(strike(ball, params, 430, 400, 445, 400, 60, 0, 12)).toBe(true);
    expect(ball.vx).toBeGreaterThan(0);
    expect(ball.vx).toBeLessThan(80);
  });

  it("keeps being pushed while the cursor presses on its rim", () => {
    const ball = createBall(500, 400);
    // Cursor already touching the left rim (reach 62), moving right at 100 px/s.
    expect(strike(ball, params, 440, 400, 443, 400, 100, 0, 12)).toBe(true);
    expect(ball.vx).toBeCloseTo(100, 0); // carried at the hand's speed, not faster
  });

  it("isn't steered by a cursor hovering over it", () => {
    // Rolling right; the cursor sits well inside the ball, twitching upward.
    const ball = createBall(500, 400);
    ball.vx = 300;
    expect(strike(ball, params, 495, 405, 495, 395, 0, -400, 12)).toBe(false);
    expect(ball.vx).toBe(300);
    expect(ball.vy).toBe(0);
    // Nor by a still cursor at its rim as it rolls away underneath.
    expect(strike(ball, params, 445, 400, 445, 400, 0, 0, 12)).toBe(false);
    expect(ball.vx).toBe(300);
  });

  it("isn't struck by a path that misses, or by a cursor moving away", () => {
    const miss = createBall(500, 400);
    expect(strike(miss, params, 300, 300, 700, 300, 2400, 0, 12)).toBe(false);
    const away = createBall(500, 400);
    expect(strike(away, params, 460, 400, 300, 400, -2400, 0, 12)).toBe(false);
    expect(isAtRest(miss) && isAtRest(away)).toBe(true);
  });

  it("follows a holding finger, rolling as it goes, and trails it slightly", () => {
    const ball = createBall(500, 400);
    for (let i = 0; i < 12; i++) {
      hold(ball, params, 600, 400);
      step(ball, 1 / 60, bounds, params);
    }
    expect(ball.x).toBeGreaterThan(590); // there, nearly
    expect(ball.x).toBeLessThanOrEqual(600); // never overshoots
    expect(ball.distance).toBeGreaterThan(90); // it rolled, not slid
  });

  it("is flicked off the finger at the finger's speed, softly capped", () => {
    const heavy = { ...params, strikeLimit: 700 };
    const gentle = createBall(500, 400);
    release(gentle, heavy, 150, 0);
    expect(gentle.vx).toBeCloseTo(150 * (700 * Math.tanh(150 / 700)) / 150, 5);
    const wild = createBall(500, 400);
    release(wild, heavy, 20000, -20000);
    expect(Math.hypot(wild.vx, wild.vy)).toBeLessThanOrEqual(700);
  });
});
