// Gobble Dash — turkey: the player. Jump, slide, hide; run-cycle animation phase.
import { GRAVITY, GROUND_Y, JUMP_V, SLIDE_TIME, HIDE_TIME, PLAYER_X } from './config.js';

export function makeTurkey() {
  const t = {
    x: PLAYER_X,
    y: GROUND_Y, // feet position
    vy: 0,
    grounded: true,
    sliding: 0, // seconds left of a slide
    hiding: 0, // seconds left of a hide
    hidden: false,
    runPhase: 0, // 0..1 run cycle
    invuln: 0, // seconds of post-hit protection
    stepTimer: 0,
    face: 1,
  };

  t.reset = function reset() {
    t.y = GROUND_Y;
    t.vy = 0;
    t.grounded = true;
    t.sliding = 0;
    t.hiding = 0;
    t.hidden = false;
    t.invuln = 0;
    t.runPhase = 0;
  };

  // Body box for collisions. Sliding halves the height; hiding removes the box.
  t.box = function box() {
    if (t.hidden) return null;
    const h = t.sliding > 0 ? 42 : 78;
    const w = t.sliding > 0 ? 92 : 62;
    return { x: t.x - w / 2 + 6, y: t.y - h, w, h };
  };

  t.jump = function jump() {
    if (!t.grounded || t.hiding > 0) return false;
    t.vy = -JUMP_V;
    t.grounded = false;
    t.sliding = 0;
    return true;
  };

  t.slide = function slide() {
    if (!t.grounded || t.hiding > 0) return false;
    t.sliding = SLIDE_TIME;
    return true;
  };

  t.hide = function hide() {
    if (!t.grounded || t.sliding > 0) return false;
    t.hiding = HIDE_TIME;
    t.hidden = true;
    return true;
  };

  t.update = function update(dt, speed, onStep) {
    if (t.hiding > 0) {
      t.hiding -= dt;
      if (t.hiding <= 0) t.hidden = false;
      return;
    }
    if (t.sliding > 0) t.sliding -= dt;
    if (t.invuln > 0) t.invuln -= dt;
    if (!t.grounded) {
      t.vy += GRAVITY * dt;
      t.y += t.vy * dt;
      if (t.y >= GROUND_Y) {
        t.y = GROUND_Y;
        t.vy = 0;
        t.grounded = true;
      }
    } else {
      t.runPhase = (t.runPhase + (dt * speed) / 90) % 1;
      t.stepTimer += dt;
      if (t.stepTimer > 0.28) {
        t.stepTimer = 0;
        if (onStep) onStep();
      }
    }
  };

  return t;
}
