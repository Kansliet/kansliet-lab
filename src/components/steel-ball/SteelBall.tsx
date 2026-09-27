"use client";

import { useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { clampToBounds, createBall, hold, isAtRest, release, speed, step, strike, type Params } from "./physics";
import { inverseMatrix } from "./quaternion";
import { BALL_PAD, createBallRenderer, type BallRenderer } from "./shader";

const PHOTO = "/kansliet-button-final-lores.png";
const MATCAP = "/ball/matcap.png";
const IMPERFECTIONS = "/ball/imperfections.png";
const PRINTS = "/ball/fingerprints.webp";

/** The readout pretends the ball is 40 mm across, to turn px into metres. */
const REAL_DIAMETER_M = 0.04;
/** The cursor or fingertip as a round body, px. */
const PUSHER_RADIUS = 12;

// Shadow, fitted to a reference photo of the ball on paper (rms error under
// 1% darkness over 809 samples round the ball): a soft disc centred a little
// down-right of the ball, a quarter dark at the core (hidden under the ball),
// easing out to nothing 38% of the radius past the rim on the far side and
// barely showing on the upper left. Warm dark, like paper in shade; 0.32 of
// it on this paper matches the reference's 25% darkening.
const SHADOW_RGB = "58 50 42";
/** Shadow box, in diameters: twice the fitted outer radius (1.38 R). */
const SHADOW_SIZE = 1.38;
/** How far the disc sits from the ball's centre, down-right, in diameters. */
const SHADOW_OFFSET_X = 0.08;
const SHADOW_OFFSET_Y = 0.09;
// Full strength to 0.8 R (58%), then easing out as (1 − t)² to 1.38 R.
const SHADOW_GRADIENT = `radial-gradient(circle closest-side, rgb(${SHADOW_RGB} / 0.32) 58%, rgb(${SHADOW_RGB} / 0.18) 68.5%, rgb(${SHADOW_RGB} / 0.08) 79%, rgb(${SHADOW_RGB} / 0.02) 89.5%, rgb(${SHADOW_RGB} / 0) 100%)`;

// Phones get a bigger share of the narrow side, so the ball is easy to flick.
const diameterFor = (w: number, h: number) =>
  Math.round(Math.min(322, Math.min(w, h) * (w < 640 ? 0.542 : 0.396)));

function paramsFor(diameter: number): Params {
  return {
    radius: diameter / 2,
    restitution: 0.28,
    drag: 0.13,
    rollingResistance: diameter * 0.2,
    restSpeed: 3,
    // Scaled to the ball, so it feels the same size-for-size on any screen:
    // the hardest hit rolls it ~2.2 of its own diameters a second.
    strikeLimit: diameter * 2.2,
    maxSpeed: diameter * 3,
  };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * The logomark as an object on the desk: a steel ball that rolls around the
 * window when the cursor pushes it, and bounces off the window edges. A slow
 * cursor nudges it along; a fast stroke knocks it away. On touch screens a
 * finger on the ball holds it (drag it around, flick it off), and a finger
 * swiping in from beside it pushes it like the cursor. Rendered
 * by a small WebGL shader (see shader.ts) so the reflections stay put while
 * the surface marks roll. Without WebGL it's the plain photo, still pushable.
 *
 * The ball takes no clicks, so anything under it stays clickable. The readout
 * element gets live speed and distance. The frame loop runs only while the
 * ball moves.
 */
export function SteelBall({ readoutRef }: { readoutRef: React.RefObject<HTMLElement | null> }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const layer = layerRef.current!;
    const ballEl = ballRef.current!;
    const canvas = canvasRef.current!;
    const shadow = shadowRef.current!;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let bounds = { width: layer.clientWidth, height: layer.clientHeight };
    let diameter = diameterFor(bounds.width, bounds.height);
    let params = paramsFor(diameter);
    const ball = createBall(bounds.width / 2, bounds.height / 2);
    const inverse = new Float32Array(9);
    let renderer: BallRenderer | null = null;
    let disposed = false;

    // The pusher: the mouse cursor, or a finger while it's on the screen.
    const pusher = { x: 0, y: 0, vx: 0, vy: 0, time: -Infinity };

    let frame = 0;
    let last = 0;
    let readoutAt = -Infinity;
    let readoutText = "";

    const sizeElements = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // The canvas carries a margin round the ball for the soft (depth of
      // field) edge; the fallback photo fills it minus that margin.
      const box = diameter * BALL_PAD;
      ballEl.style.width = ballEl.style.height = `${box}px`;
      ballEl.style.padding = renderer ? "0" : `${(box - diameter) / 2}px`;
      renderer?.resize(Math.round(box * dpr));
      shadow.style.width = shadow.style.height = `${diameter * SHADOW_SIZE}px`;
    };

    const render = () => {
      const half = (diameter * BALL_PAD) / 2;
      ballEl.style.transform = `translate3d(${ball.x - half}px, ${ball.y - half}px, 0)`;
      const sh = diameter * SHADOW_SIZE;
      const sx = ball.x + diameter * SHADOW_OFFSET_X - sh / 2;
      const sy = ball.y + diameter * SHADOW_OFFSET_Y - sh / 2;
      shadow.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
      if (renderer) renderer.draw(inverseMatrix(ball.q, inverse));
      // The readout is text in the page flow: changing it costs a layout, so
      // ~10 times a second is plenty (and always the final value at rest).
      const now = performance.now();
      if (readoutRef.current && (now - readoutAt > 100 || isAtRest(ball))) {
        readoutAt = now;
        const m = REAL_DIAMETER_M / diameter;
        const text = `V ${(speed(ball) * m).toFixed(2)} M/S · DIST ${(ball.distance * m).toFixed(2)} M`;
        if (text !== readoutText) readoutRef.current.textContent = readoutText = text;
      }
    };

    const tick = (now: number) => {
      // rAF's timestamp is the frame's start, which can be earlier than the
      // performance.now() taken when the loop was woken: never step backwards.
      const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 30);
      last = now;
      if (held) hold(ball, params, held.x - held.dx, held.y - held.dy);
      step(ball, dt, bounds, params);
      render();
      frame = isAtRest(ball) && !held ? 0 : requestAnimationFrame(tick);
    };
    const wake = () => {
      if (frame || disposed) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    /**
     * The pusher moved to (x, y). Its velocity is smoothed over recent moves;
     * after a pause (or a new touch) it starts from rest, with no path. The
     * path since the last move is swept against the ball, so a fast stroke
     * can't skip past it between events.
     */
    const moveTo = (x: number, y: number) => {
      const now = performance.now();
      const fresh = now - pusher.time < 100;
      const dt = Math.max((now - pusher.time) / 1000, 1 / 240);
      pusher.vx = fresh ? pusher.vx * 0.4 + ((x - pusher.x) / dt) * 0.6 : 0;
      pusher.vy = fresh ? pusher.vy * 0.4 + ((y - pusher.y) / dt) * 0.6 : 0;
      const x0 = fresh ? pusher.x : x;
      const y0 = fresh ? pusher.y : y;
      pusher.x = x;
      pusher.y = y;
      pusher.time = now;
      if (strike(ball, params, x0, y0, x, y, pusher.vx, pusher.vy, PUSHER_RADIUS)) wake();
    };
    // Safe zones (marked data-ball-safe, e.g. the menu): the cursor over them
    // doesn't touch the ball, and leaving one starts afresh, so the move out
    // can't count as a stroke either.
    const inSafeZone = (target: EventTarget | null) =>
      target instanceof Element && target.closest("[data-ball-safe]") !== null;
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (inSafeZone(e.target)) {
        pusher.time = -Infinity;
        return;
      }
      moveTo(e.clientX, e.clientY);
    };
    // Touch. A finger that lands on the ball holds it: the ball follows the
    // finger (rolling, with a touch of lag) and is flicked off at the finger's
    // speed when it lifts. A finger that lands beside the ball pushes it, as
    // the cursor does. Touch events, not pointer events: they keep coming even
    // when the browser treats the swipe as a scroll. A touch that starts in a
    // safe zone is ignored until it lifts.
    let touchSafe = false;
    let held: { id: number; x: number; y: number; dx: number; dy: number } | null = null;
    const touchOf = (list: TouchList, id: number) => Array.from(list).find((t) => t.identifier === id);
    const onTouchStart = (e: TouchEvent) => {
      touchSafe = inSafeZone(e.target);
      pusher.time = -Infinity; // a new finger starts from rest
      if (touchSafe || held) return;
      const t = e.changedTouches[0];
      // Fingers are broad: a touch just off the rim still counts as on the ball.
      if (Math.hypot(t.clientX - ball.x, t.clientY - ball.y) <= params.radius * 1.15) {
        held = { id: t.identifier, x: t.clientX, y: t.clientY, dx: t.clientX - ball.x, dy: t.clientY - ball.y };
        track(t.clientX, t.clientY);
        wake();
        return;
      }
      moveTo(t.clientX, t.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (held) {
        const t = touchOf(e.touches, held.id);
        if (!t) return;
        // Holding the ball: no pull-to-refresh or page scroll under the finger.
        if (e.cancelable) e.preventDefault();
        held.x = t.clientX;
        held.y = t.clientY;
        track(t.clientX, t.clientY);
        return;
      }
      if (!touchSafe) moveTo(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!held || !touchOf(e.changedTouches, held.id)) return;
      held = null;
      // A finger that had stopped before lifting just sets the ball down.
      const moving = performance.now() - pusher.time < 80;
      release(ball, params, moving ? pusher.vx : 0, moving ? pusher.vy : 0);
      wake();
    };
    /** Smoothed finger velocity while holding, for the flick on release. */
    const track = (x: number, y: number) => {
      const now = performance.now();
      const fresh = now - pusher.time < 100;
      const dt = Math.max((now - pusher.time) / 1000, 1 / 240);
      pusher.vx = fresh ? pusher.vx * 0.5 + ((x - pusher.x) / dt) * 0.5 : 0;
      pusher.vy = fresh ? pusher.vy * 0.5 + ((y - pusher.y) / dt) * 0.5 : 0;
      pusher.x = x;
      pusher.y = y;
      pusher.time = now;
    };

    const onResize = () => {
      bounds = { width: layer.clientWidth, height: layer.clientHeight };
      diameter = diameterFor(bounds.width, bounds.height);
      params = paramsFor(diameter);
      sizeElements();
      clampToBounds(ball, bounds, params.radius);
      render();
    };

    Promise.all([loadImage(MATCAP), loadImage(IMPERFECTIONS), loadImage(PRINTS)])
      .then(([matcap, imperfections, prints]) => {
        if (disposed) return;
        try {
          renderer = createBallRenderer(canvas, matcap, imperfections, prints);
        } catch {
          renderer = null;
        }
        if (!renderer) setFallback(true);
        sizeElements();
        render();
        layer.style.opacity = "1";
        // A small nudge so it's obvious the ball is loose.
        if (!reducedMotion) {
          ball.vx = diameter * 1.1;
          ball.vy = -diameter * 0.45;
          wake();
        }
      })
      .catch(() => {
        if (disposed) return;
        setFallback(true);
        sizeElements();
        render();
        layer.style.opacity = "1";
      });

    const onContextLost = () => {
      renderer = null;
      setFallback(true);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    // Not passive: holding the ball has to be able to stop the page scrolling.
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    window.addEventListener("resize", onResize);
    canvas.addEventListener("webglcontextlost", onContextLost);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      renderer?.dispose();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("webglcontextlost", onContextLost);
    };
  }, [readoutRef]);

  return (
    // The window is the table; overflow-hidden so the ball can never widen the page.
    <div
      ref={layerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden opacity-0 transition-opacity duration-500"
    >
      {/* will-change: each on its own compositor layer, so moving them is a
          GPU slide, not a repaint of the full-window layer. */}
      <div
        ref={shadowRef}
        className="absolute top-0 left-0 will-change-transform"
        style={{ background: SHADOW_GRADIENT }}
      />
      <div ref={ballRef} className="absolute top-0 left-0 will-change-transform">
        {fallback ? (
          // Fallback only (no WebGL). next/image serves it at the ball's size
          // (at most 322 px, see diameterFor) as WebP/AVIF instead of the
          // 1.1 MB source PNG. The wrapper div carries the per-frame transform.
          <NextImage src={PHOTO} alt="" fill sizes="322px" draggable={false} className="object-contain" />
        ) : (
          <canvas ref={canvasRef} className="block h-full w-full" />
        )}
      </div>
    </div>
  );
}
