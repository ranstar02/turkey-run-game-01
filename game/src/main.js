// Gobble Dash — main: game loop, state machine, collisions, scoring.
// States: title -> play <-> paused -> caught / escaped.
import { W, H, GROUND_Y, BEST_KEY, CORN_SCORE, COMBO_WINDOW, TOTAL_LENGTH, MAX_LIVES } from './config.js';
import { makeInput, hitRect } from './input.js';
import { makeAudio } from './audio.js';
import { makeWorld, stageOf, obstacleHeight, obstacleWidth, obstacleTop } from './world.js';
import { makeTurkey } from './turkey.js';
import { makeFarmer } from './farmer.js';
import { drawWorld, drawHUD, drawTitle, drawPaused, drawEnd } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = makeInput(canvas);
const audio = makeAudio();

const game = {
  state: 'title', // title | play | paused | caught | escaped
  seed: 1,
  distance: 0,
  score: 0,
  lives: MAX_LIVES,
  cornCount: 0,
  combo: 1,
  comboTimer: 0,
  stage: 0,
  best: 0,
  turkey: null,
  farmer: null,
  world: null,
  nearHay: null,
  buttons: {},
  time: 0,
  gobbleTimer: 6,
};

try {
  game.best = Number(localStorage.getItem(BEST_KEY) || 0) || 0;
} catch {
  game.best = 0;
}

function saveBest() {
  if (game.score > game.best) {
    game.best = Math.floor(game.score);
    try {
      localStorage.setItem(BEST_KEY, String(game.best));
    } catch {
      // storage unavailable (file:// or private mode) — best is session-only
    }
  }
}

game.startRun = function startRun(seed) {
  game.seed = seed || game.seed || 1;
  game.state = 'play';
  game.distance = 0;
  game.score = 0;
  game.lives = MAX_LIVES;
  game.cornCount = 0;
  game.combo = 1;
  game.comboTimer = 0;
  game.stage = 0;
  game.turkey = makeTurkey();
  game.farmer = makeFarmer(game.seed);
  game.world = makeWorld(game.seed);
  game.nearHay = null;
  audio.unlock();
  audio.gobble();
};

function endRun(escaped) {
  game.state = escaped ? 'escaped' : 'caught';
  saveBest();
  if (escaped) audio.win();
  else audio.lose();
  audio.stopOven();
}

function hurt(reason) {
  if (game.turkey.invuln > 0 || game.state !== 'play') return;
  game.lives -= 1;
  game.turkey.invuln = 1.6;
  game.farmer.onHit();
  game.combo = 1;
  audio.hit();
  audio.farmerShout();
  if (game.lives <= 0) endRun(false);
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function updatePlay(dt) {
  const tk = game.turkey;
  const fm = game.farmer;
  const speed = game.world.speedAt(game.distance);

  // --- input
  if (input.wasPressed('jump') && tk.jump()) audio.jump();
  if (input.wasPressed('slide') && tk.slide()) audio.whoosh();
  if (input.wasPressed('hide') && game.nearHay && fm.mode === 'search' && tk.hide()) {
    audio.gobble();
  }
  if (input.wasPressed('pause')) {
    game.state = 'paused';
    return;
  }
  if (input.wasPressed('mute')) audio.toggleMute();
  if (input.wasPressed('restart')) {
    game.startRun(game.seed);
    return;
  }

  // --- movement & distance
  tk.update(dt, speed, () => audio.step());
  game.distance += (speed * dt) / 12;
  game.score += (speed * dt) / 12; // 1 point per metre run
  const stage = stageOf(game.distance);
  if (stage !== game.stage) {
    game.stage = stage;
    fm.onStageClear();
    audio.feather();
  }
  if (game.stage === 2) audio.startOven();
  else audio.stopOven();

  // --- farmer
  fm.update(dt, tk.hidden, speed);
  if (fm.shoutTimer > 0.01 - dt && fm.shoutTimer <= 0.01) audio.farmerShout();
  if (fm.gap <= 0) {
    endRun(false);
    return;
  }

  // --- world
  game.world.update(dt, game.distance);
  game.nearHay = null;
  const box = tk.box();

  for (const it of game.world.items) {
    if (it.x < -200 || it.x > 1500) continue;
    if (it.kind === 'hay' && Math.abs(it.x + 48 - tk.x) < 120 && fm.mode === 'search') {
      game.nearHay = it;
      it.nearHide = true;
    } else if (it.kind === 'hay') {
      it.nearHide = false;
    }

    if (it.hit || it.passed) {
      // still allow corn collection below
    }

    // pickups
    if ((it.kind === 'corn' || it.kind === 'feather' || it.kind === 'gravy') && !it.hit && box) {
      const py = GROUND_Y - 26 + (it.yOff || 0);
      const pbox = { x: it.x - 16, y: py - 22, w: 32, h: 44 };
      if (overlap(box, pbox)) {
        it.hit = true;
        if (it.kind === 'corn') {
          game.cornCount += 1;
          if (game.comboTimer > 0) game.combo = Math.min(game.combo + 1, 5);
          else game.combo = 1;
          game.comboTimer = COMBO_WINDOW;
          game.score += CORN_SCORE * game.combo;
          audio.pickup(game.combo);
        } else if (it.kind === 'feather') {
          game.lives = Math.min(MAX_LIVES, game.lives + 1);
          audio.feather();
        } else {
          fm.onGravy();
          audio.gobble();
        }
      }
    }

    // obstacles: only matter while on screen and not yet passed
    if (it.kind === 'fence' || it.kind === 'plank' || it.kind === 'pumpkin' || it.kind === 'oven') {
      const w = obstacleWidth(it.kind);
      const top = obstacleTop(it.kind);
      // The plank is a hanging bar: it blocks a standing turkey (box top 582)
      // but a sliding turkey (box top 618) ducks under it. Every other
      // obstacle stands on the ground, so its box runs down to the ground.
      const h = it.kind === 'plank' ? 36 : GROUND_Y - top;
      const obox = { x: it.x, y: top, w, h };
      if (!it.passed && it.x + w < tk.x - 40) {
        it.passed = true;
        game.score += 25; // cleared an obstacle
      }
      if (!it.hit && box && overlap(box, obox)) {
        it.hit = true;
        hurt(it.kind);
      }
    }

    // falling knife: dangerous only while stuck in the ground near the turkey
    if (it.kind === 'knife' && it.state === 'stuck' && !it.hit && box) {
      const kbox = { x: it.x + 4, y: GROUND_Y - 64, w: 32, h: 64 };
      if (overlap(box, kbox)) {
        it.hit = true;
        hurt('knife');
      }
    }
  }

  // nets thrown by the farmer
  if (box) {
    for (const net of fm.nets) {
      const nbox = { x: net.x - 22, y: net.y - 22, w: 44, h: 44 };
      if (overlap(box, nbox)) {
        net.state = 'gone';
        hurt('net');
      }
    }
  }

  // combo timer
  if (game.comboTimer > 0) {
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) game.combo = 1;
  }

  // occasional gobble for charm
  game.gobbleTimer -= dt;
  if (game.gobbleTimer <= 0) {
    game.gobbleTimer = 9 + Math.random() * 6;
    audio.gobble();
  }

  // freedom door
  if (game.distance >= TOTAL_LENGTH) {
    game.score += game.lives * 500; // surviving-lives bonus
    endRun(true);
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - (frame.last || now)) / 1000 || 0.016);
  frame.last = now;
  game.time += dt;
  const mouse = input.mousePos();

  if (game.state === 'title') {
    game.buttons = drawTitle(ctx, game, mouse, game.time);
    if (input.wasPressed('confirm') || input.wasPressed('jump')) {
      game.startRun(game.seed);
    } else if (input.wasClicked() && hitRect(game.buttons.start, mouse.x, mouse.y)) {
      game.startRun(game.seed);
    }
  } else if (game.state === 'play') {
    if (!game.frozen) updatePlay(dt);
    if (game.state === 'play') {
      drawWorld(ctx, game, game.time);
      drawHUD(ctx, game);
    } else {
      // endRun was called inside updatePlay: draw the end screen this frame
      drawWorld(ctx, game, game.time);
      game.buttons = drawEnd(ctx, game, mouse);
    }
  } else if (game.state === 'paused') {
    drawWorld(ctx, game, game.time);
    drawHUD(ctx, game);
    drawPaused(ctx, game);
    if (input.wasPressed('pause') || input.wasPressed('confirm')) game.state = 'play';
    if (input.wasPressed('restart')) game.startRun(game.seed);
  } else {
    // caught | escaped: keep the world visible behind the end panel
    drawWorld(ctx, game, game.time);
    game.buttons = drawEnd(ctx, game, mouse);
    if (input.wasPressed('restart') || input.wasPressed('confirm')) {
      game.startRun(game.seed);
    } else if (input.wasClicked() && hitRect(game.buttons.restart, mouse.x, mouse.y)) {
      game.startRun(game.seed);
    }
  }

  input.endFrame();
  requestAnimationFrame(frame);
}

// Boot: title screen with a demo turkey/farmer so the page is never blank.
game.turkey = makeTurkey();
game.farmer = makeFarmer(game.seed);
game.world = makeWorld(game.seed);
// Debug/test hook: lets an automated check read score, distance, lives and
// drive the state machine without touching the real game code.
window.__gobble = game;
applyShot(game, new URLSearchParams(location.search));
if (game.state === 'title') {
  // title screen needs a world to pose against
  game.world = makeWorld(game.seed);
}
requestAnimationFrame(frame);
