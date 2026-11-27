// Gobble Dash — farmer: the chaser. He runs behind the turkey, closes the gap
// over time, and every so often stops to SEARCH (sweeping his lantern). While he
// searches the gap stops shrinking and the turkey can hide in a haystack to
// win distance back. He also hurls a net from time to time.
import { GAP_START, GAP_DRAIN, GAP_HIT, GAP_GRAVY, GAP_HIDE_RATE, GAP_STAGE_BONUS } from './config.js';
import { makeRng } from './random.js';

export function makeFarmer(seed) {
  const rng = makeRng(seed + 777);
  const f = {
    gap: GAP_START, // metres between turkey and farmer; 0 = caught
    mode: 'chase', // 'chase' | 'search'
    modeTimer: 0,
    searchEvery: rng.range(20, 28),
    searchLen: 4.5,
    netTimer: rng.range(9, 14),
    nets: [], // {x, vx, y, state}
    slowTimer: 0, // gravy slowdown
    runPhase: 0,
    shoutTimer: 0,
  };

  f.reset = function reset() {
    f.gap = GAP_START;
    f.mode = 'chase';
    f.modeTimer = 0;
    f.searchEvery = rng.range(20, 28);
    f.netTimer = rng.range(9, 14);
    f.nets = [];
    f.slowTimer = 0;
  };

  f.onHit = function onHit() {
    f.gap = Math.max(0, f.gap - GAP_HIT);
  };

  f.onGravy = function onGravy() {
    f.gap += GAP_GRAVY;
    f.slowTimer = 5;
  };

  f.onStageClear = function onStageClear() {
    f.gap += GAP_STAGE_BONUS;
  };

  f.update = function update(dt, turkeyHidden, speed) {
    f.runPhase = (f.runPhase + (dt * speed) / 110) % 1;
    if (f.slowTimer > 0) f.slowTimer -= dt;
    if (f.shoutTimer > 0) f.shoutTimer -= dt;

    if (f.mode === 'chase') {
      // The farmer gains ground steadily; gravy slows him to a third.
      const drain = GAP_DRAIN * (f.slowTimer > 0 ? 0.33 : 1);
      f.gap -= drain * dt;
      f.modeTimer += dt;
      if (f.modeTimer >= f.searchEvery) {
        f.mode = 'search';
        f.modeTimer = 0;
        f.shoutTimer = 0.01; // shout once when he stops
      }
      // Hurl a net every so often while chasing.
      f.netTimer -= dt;
      if (f.netTimer <= 0) {
        f.netTimer = rng.range(11, 17);
        f.nets.push({ x: -40, vx: 620, y: 600, state: 'fly' });
      }
    } else {
      // Searching: he stands still and sweeps his lantern. Hiding wins gap back.
      f.modeTimer += dt;
      if (turkeyHidden) f.gap += GAP_HIDE_RATE * dt;
      if (f.modeTimer >= f.searchLen) {
        f.mode = 'chase';
        f.modeTimer = 0;
        f.searchEvery = rng.range(20, 30);
      }
    }

    for (const net of f.nets) {
      if (net.state === 'fly') {
        net.x += net.vx * dt;
        if (net.x > 1400) net.state = 'gone';
      }
    }
    f.nets = f.nets.filter((n) => n.state !== 'gone');
    f.gap = Math.min(f.gap, 140);
  };

  // Screen x of the farmer: gap metres behind the turkey, 12 px per metre,
  // clamped so he stays visible at the left edge when close.
  f.screenX = function screenX() {
    return Math.max(-70, 250 - f.gap * 12 - 60);
  };

  return f;
}
