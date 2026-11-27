// Gobble Dash — shots: deterministic setups for the four screenshots.
// ?shot=start|play|chase|end&seed=N — the browser screenshot command passes these.
export function applyShot(game, params) {
  const shot = params.get('shot');
  if (!shot) return false;
  const seed = Number(params.get('seed') || '1') || 1;
  game.seed = seed;

  if (shot === 'start') {
    game.state = 'title';
    return true;
  }
  if (shot === 'play') {
    // Mid-run in the farmyard: turkey running, farmer behind, fence + corn ahead.
    // Frozen: the frame is a still photo, the run does not continue on its own.
    game.startRun(seed);
    game.distance = 96;
    game.score = 1250;
    game.cornCount = 8;
    game.farmer.gap = 11; // close enough that the farmer is visible right behind the turkey
    game.turkey.runPhase = 0.35;
    game.frozen = true;
    game.world.update(0, game.distance);
    return true;
  }
  if (shot === 'chase') {
    // Kitchen chase: oven glowing, a knife falling, turkey sliding, farmer close.
    game.startRun(seed);
    game.distance = 1050;
    game.stage = 2;
    game.score = 4860;
    game.cornCount = 31;
    game.lives = 2;
    game.farmer.gap = 9; // farmer right on the turkey's tail for the chase shot
    game.farmer.mode = 'chase';
    game.turkey.sliding = 0.5;
    game.turkey.runPhase = 0.6;
    game.frozen = true;
    game.world.update(0, game.distance);
    // Force one knife to be mid-fall right in front of the turkey.
    const knife = game.world.items.find((it) => it.kind === 'knife' && it.x > 300 && it.x < 900);
    if (knife) {
      knife.state = 'falling';
      knife.t = 0.3;
    }
    // Force an oven into view on the right so the kitchen danger reads clearly.
    const oven = game.world.items.find((it) => it.kind === 'oven' && it.dist > game.distance);
    if (oven) {
      oven.dist = game.distance + 62;
      oven.x = game.world.screenX(oven.dist, game.distance);
    }
    return true;
  }
  if (shot === 'end') {
    game.startRun(seed);
    game.distance = 1300;
    game.stage = 2;
    game.score = 9840;
    game.cornCount = 52;
    game.lives = 2;
    game.state = 'escaped';
    game.best = Math.max(game.best, 9840);
    return true;
  }
  return false;
}
