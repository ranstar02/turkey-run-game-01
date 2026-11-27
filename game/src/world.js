// Gobble Dash — world: stages, obstacle spawning, pickups, and the freedom door.
// Everything is placed by distance (metres) so a seeded run is fully repeatable.
// One metre = 12 px of scrolling.
import { GROUND_Y, STAGE_LENGTH, STAGE_SPEED, TOTAL_LENGTH } from './config.js';
import { makeRng } from './random.js';

export const PX_PER_M = 12;

export function stageOf(distance) {
  if (distance < STAGE_LENGTH[0]) return 0;
  if (distance < STAGE_LENGTH[0] + STAGE_LENGTH[1]) return 1;
  return 2;
}

export function stageProgress(distance) {
  const start = [0, STAGE_LENGTH[0], STAGE_LENGTH[0] + STAGE_LENGTH[1]];
  const s = stageOf(distance);
  return (distance - start[s]) / STAGE_LENGTH[s];
}

export function makeWorld(seed) {
  const rng = makeRng(seed);
  // Pre-generate the whole course: a list of entities keyed by distance.
  // Obstacles: fence (jump), plank (slide under), pumpkin (jump), oven (jump, kitchen),
  // knife (falls from the sky), net (thrown by the farmer, handled by farmer.js).
  // Pickups: corn (+score), feather (+1 life, rare), gravy (farmer slows).
  // Haystacks: hide spots, only useful while the farmer is searching.
  const items = [];
  let d = 18; // first obstacle at 18 m
  while (d < TOTAL_LENGTH - 25) {
    const s = stageOf(d);
    const roll = rng.next();
    let kind;
    if (s === 2) {
      kind = roll < 0.28 ? 'oven' : roll < 0.5 ? 'fence' : roll < 0.68 ? 'plank' : roll < 0.84 ? 'knife' : 'pumpkin';
    } else if (s === 1) {
      kind = roll < 0.4 ? 'fence' : roll < 0.62 ? 'plank' : roll < 0.82 ? 'pumpkin' : 'knife';
    } else {
      kind = roll < 0.45 ? 'fence' : roll < 0.7 ? 'pumpkin' : roll < 0.88 ? 'plank' : 'knife';
    }
    items.push({ kind, dist: d, x: 0, state: 'idle', t: 0, hit: false, passed: false });
    // A haystack every ~70 m, always a little before an obstacle cluster.
    if (rng.chance(0.45)) {
      items.push({ kind: 'hay', dist: d + rng.range(6, 12), x: 0, state: 'idle', t: 0, hit: false, passed: false });
    }
    // Corn trails: 3-5 kernels in a row, sometimes arcing over a fence.
    const trail = rng.int(3, 5);
    const arc = kind === 'fence' && rng.chance(0.6);
    for (let i = 0; i < trail; i++) {
      items.push({
        kind: 'corn',
        dist: d - 6 + i * 2.2,
        x: 0,
        yOff: arc ? [0, -46, -70, -46, 0][Math.min(i, 4)] || 0 : 0,
        state: 'idle',
        t: 0,
        hit: false,
        passed: false,
      });
    }
    if (rng.chance(0.1)) items.push({ kind: 'gravy', dist: d + 4, x: 0, yOff: -40, state: 'idle', t: 0, hit: false, passed: false });
    if (rng.chance(0.06)) items.push({ kind: 'feather', dist: d + 8, x: 0, yOff: -60, state: 'idle', t: 0, hit: false, passed: false });
    d += rng.range(13, 22) - s * 1.5; // tighter spacing in later stages
  }

  // Scenery anchors, also by distance, for the parallax layers.
  const scenery = [];
  for (let sd = 0; sd < TOTAL_LENGTH; sd += rng.range(9, 18)) {
    scenery.push({ dist: sd, kind: rng.pick(['tree', 'pumpkin-patch', 'fence-post', 'lamp', 'table']) });
  }

  return {
    items,
    scenery,
    // Convert a distance (m) to a screen x for the current scroll position:
    // an item at the turkey's own distance sits at the turkey (x 250);
    // items ahead of it appear to the right and scroll left as it runs.
    screenX(dist, distance) {
      return 250 + (dist - distance) * PX_PER_M;
    },
    speedAt(distance) {
      return STAGE_SPEED[stageOf(distance)];
    },
    // Move falling knives and tick timers. Returns events for the main loop.
    update(dt, distance) {
      for (const it of items) {
        it.x = this.screenX(it.dist, distance);
        if (it.kind === 'knife') {
          if (it.state === 'idle' && it.x < 1280 && it.x > 0) {
            it.state = 'falling';
            it.t = 0;
          }
          if (it.state === 'falling') {
            it.t += dt;
            if (it.t > 0.55) it.state = 'stuck';
          }
        }
      }
    },
  };
}

// Height (px) of an obstacle, used for drawing and collision.
export function obstacleHeight(kind) {
  switch (kind) {
    case 'fence':
      return 74;
    case 'plank':
      return 34;
    case 'pumpkin':
      return 52;
    case 'oven':
      return 120;
    case 'hay':
      return 64;
    default:
      return 40;
  }
}

export function obstacleWidth(kind) {
  switch (kind) {
    case 'fence':
      return 26;
    case 'plank':
      return 90;
    case 'pumpkin':
      return 64;
    case 'oven':
      return 110;
    case 'hay':
      return 96;
    default:
      return 40;
  }
}

export function obstacleTop(kind) {
  if (kind === 'plank') return GROUND_Y - 96; // hangs at head height: slide under it
  return GROUND_Y - obstacleHeight(kind);
}
