// Gobble Dash — render: every picture in the game is drawn here on canvas.
// Autumn sunset palette, three stage looks (farmyard / barn / kitchen), a
// hand-drawn turkey and farmer, HUD, title screen and end screens.
import { W, H, GROUND_Y, PALETTE, STAGE_NAMES } from './config.js';
import { obstacleHeight, obstacleTop, obstacleWidth } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function outlineText(ctx, str, x, y, size, color, align, weight) {
  ctx.font = `${weight || 'bold'} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size / 8);
  ctx.strokeStyle = 'rgba(40,16,8,0.85)';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function drawSky(ctx, stage, t) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  if (stage === 2) {
    // kitchen: warm indoor dusk through a window
    g.addColorStop(0, '#3a2a4d');
    g.addColorStop(0.6, '#8a4a5a');
    g.addColorStop(1, '#c97a4a');
  } else {
    g.addColorStop(0, PALETTE.skyTop);
    g.addColorStop(0.55, PALETTE.skyMid);
    g.addColorStop(1, PALETTE.skyBot);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, GROUND_Y + 2);
  // low sun
  ctx.fillStyle = PALETTE.sun;
  ellipse(ctx, 1020, 190, 58, 58);
  ctx.fillStyle = 'rgba(255,215,106,0.25)';
  ellipse(ctx, 1020, 190, 92, 92);
  // drifting clouds
  ctx.fillStyle = 'rgba(255,235,200,0.5)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 340 + t * 12) % 1500) - 110;
    const cy = 90 + i * 42;
    ellipse(ctx, cx, cy, 52, 16);
    ellipse(ctx, cx + 38, cy + 6, 40, 13);
  }
}

function drawHills(ctx, scroll, stage) {
  ctx.fillStyle = PALETTE.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= W; x += 40) {
    const px = x + scroll * 0.15;
    ctx.lineTo(x, GROUND_Y - 60 - Math.sin(px * 0.004) * 46 - Math.sin(px * 0.0013) * 30);
  }
  ctx.lineTo(W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= W; x += 40) {
    const px = x + scroll * 0.35;
    ctx.lineTo(x, GROUND_Y - 26 - Math.sin(px * 0.006 + 2) * 26);
  }
  ctx.lineTo(W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  if (stage === 1) {
    // barn silhouette on the horizon
    ctx.fillStyle = '#4a2438';
    ctx.fillRect(880, GROUND_Y - 130, 180, 130);
    ctx.beginPath();
    ctx.moveTo(860, GROUND_Y - 130);
    ctx.lineTo(970, GROUND_Y - 190);
    ctx.lineTo(1080, GROUND_Y - 130);
    ctx.closePath();
    ctx.fill();
  }
}

function drawGround(ctx, scroll, stage) {
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.fillStyle = PALETTE.groundTop;
  ctx.fillRect(0, GROUND_Y, W, 10);
  // moving ground texture: tufts and stones
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 26; i++) {
    const gx = ((i * 173 - scroll) % 1400 + 1400) % 1400 - 60;
    ctx.fillRect(gx, GROUND_Y + 34 + (i % 5) * 18, 26, 5);
  }
  if (stage === 2) {
    // kitchen tiles
    ctx.fillStyle = 'rgba(255,240,210,0.10)';
    for (let x = 0; x < W; x += 90) ctx.fillRect(x, GROUND_Y + 12, 3, H - GROUND_Y - 12);
  }
}

function drawScenery(ctx, scenery, distance, stage) {
  for (const s of scenery) {
    const x = 250 + (s.dist - distance) * 12;
    if (x < -160 || x > 1400) continue;
    if (s.kind === 'tree') {
      ctx.fillStyle = '#5a2e1a';
      ctx.fillRect(x - 7, GROUND_Y - 110, 14, 110);
      ctx.fillStyle = stage === 0 ? '#c96a1e' : '#8a4a1e';
      ellipse(ctx, x, GROUND_Y - 140, 52, 44);
      ellipse(ctx, x - 34, GROUND_Y - 116, 30, 26);
      ellipse(ctx, x + 34, GROUND_Y - 116, 30, 26);
    } else if (s.kind === 'pumpkin-patch') {
      ctx.fillStyle = '#e07b1f';
      for (let i = 0; i < 3; i++) ellipse(ctx, x + i * 30 - 30, GROUND_Y - 12, 20, 15);
      ctx.fillStyle = '#3f7a2a';
      ctx.fillRect(x - 34, GROUND_Y - 34, 4, 14);
    } else if (s.kind === 'fence-post') {
      ctx.fillStyle = PALETTE.fence;
      ctx.fillRect(x - 5, GROUND_Y - 56, 10, 56);
      ctx.fillRect(x - 46, GROUND_Y - 52, 92, 8);
      ctx.fillRect(x - 46, GROUND_Y - 30, 92, 8);
    } else if (s.kind === 'lamp' && stage === 1) {
      ctx.fillStyle = '#3a2415';
      ctx.fillRect(x - 3, GROUND_Y - 150, 6, 150);
      ctx.fillStyle = '#ffd76a';
      ellipse(ctx, x, GROUND_Y - 156, 16, 12);
      ctx.fillStyle = 'rgba(255,215,106,0.16)';
      ellipse(ctx, x, GROUND_Y - 120, 60, 46);
    } else if (s.kind === 'table' && stage === 2) {
      ctx.fillStyle = '#6e4520';
      ctx.fillRect(x - 60, GROUND_Y - 60, 120, 12);
      ctx.fillRect(x - 52, GROUND_Y - 48, 10, 48);
      ctx.fillRect(x + 42, GROUND_Y - 48, 10, 48);
    }
  }
}

function drawTurkey(ctx, tk, t) {
  if (tk.hidden) return; // tucked inside a haystack
  const x = tk.x;
  const y = tk.y;
  const blink = tk.invuln > 0 && Math.floor(t * 14) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.35;
  const legSwing = tk.grounded && tk.sliding <= 0 ? Math.sin(tk.runPhase * Math.PI * 2) * 14 : 0;
  const sliding = tk.sliding > 0;
  const air = !tk.grounded;

  ctx.save();
  ctx.translate(x, y);
  if (sliding) ctx.rotate(-0.12);

  // legs
  ctx.strokeStyle = '#ff8c1a';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -26);
  ctx.lineTo(-8 + legSwing, 0);
  ctx.moveTo(10, -26);
  ctx.lineTo(10 - legSwing, 0);
  ctx.stroke();

  // tail fan
  ctx.fillStyle = '#7a3b12';
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.rotate(i * 0.34);
    ctx.beginPath();
    ctx.ellipse(-26, -58, 10, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#c97a2a';
  for (let i = -1; i <= 1; i++) {
    ctx.save();
    ctx.rotate(i * 0.34);
    ctx.beginPath();
    ctx.ellipse(-22, -52, 6, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // body
  ctx.fillStyle = '#8a5a24';
  ellipse(ctx, 0, -40, 34, 30);
  ctx.fillStyle = '#a06a2e';
  ellipse(ctx, 6, -34, 24, 20);
  // wing
  const wingFlap = air ? -0.9 : sliding ? 0.3 : Math.sin(tk.runPhase * Math.PI * 2) * 0.25;
  ctx.save();
  ctx.translate(-4, -44);
  ctx.rotate(wingFlap);
  ctx.fillStyle = '#6e4518';
  ellipse(ctx, -6, 0, 20, 12);
  ctx.restore();

  // neck + head
  ctx.fillStyle = '#8a5a24';
  ctx.fillRect(20, -78, 12, 42);
  ctx.fillStyle = '#d8c49a';
  ellipse(ctx, 28, -82, 15, 14);
  // wattle + beak
  ctx.fillStyle = '#d21f2b';
  ellipse(ctx, 34, -68, 5, 9);
  ctx.fillStyle = '#ff8c1a';
  ctx.beginPath();
  ctx.moveTo(40, -86);
  ctx.lineTo(54, -80);
  ctx.lineTo(40, -76);
  ctx.closePath();
  ctx.fill();
  // eye
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, 32, -86, 3, 4);
  // comb
  ctx.fillStyle = '#d21f2b';
  ellipse(ctx, 24, -97, 5, 7);
  ellipse(ctx, 31, -98, 5, 7);

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawFarmer(ctx, fx, mode, phase, t) {
  const y = GROUND_Y;
  const legSwing = mode === 'chase' ? Math.sin(phase * Math.PI * 2) * 12 : 0;
  ctx.save();
  ctx.translate(fx, y);
  // legs (overalls)
  ctx.strokeStyle = '#2a4a7a';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -30);
  ctx.lineTo(-8 + legSwing, 0);
  ctx.moveTo(10, -30);
  ctx.lineTo(10 - legSwing, 0);
  ctx.stroke();
  // body: plaid shirt + overalls
  ctx.fillStyle = '#b8322a';
  roundRect(ctx, -22, -78, 46, 52, 8);
  ctx.fill();
  ctx.fillStyle = '#2a4a7a';
  ctx.fillRect(-18, -52, 38, 26);
  ctx.fillStyle = '#ffd23e';
  ctx.fillRect(-2, -52, 6, 26);
  // arm reaching forward
  ctx.strokeStyle = '#b8322a';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(16, -66);
  ctx.lineTo(38, -52 + Math.sin(t * 6) * 3);
  ctx.stroke();
  // head + straw hat
  ctx.fillStyle = '#e8b98a';
  ellipse(ctx, 4, -92, 15, 14);
  ctx.fillStyle = '#e0a83c';
  ellipse(ctx, 4, -102, 26, 7);
  ctx.fillStyle = '#c98f2e';
  ctx.fillRect(-12, -116, 32, 12);
  // beard
  ctx.fillStyle = '#f0e0c0';
  ellipse(ctx, 8, -80, 9, 7);
  // angry eye
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, 12, -94, 3, 3);
  ctx.restore();

  if (mode === 'search') {
    // lantern sweep: a cone of light sweeping the ground ahead of him
    const sweep = Math.sin(t * 1.4) * 0.5;
    ctx.save();
    ctx.translate(fx + 30, y - 60);
    ctx.rotate(sweep);
    const g = ctx.createLinearGradient(0, 0, 260, 0);
    g.addColorStop(0, 'rgba(255,220,120,0.5)');
    g.addColorStop(1, 'rgba(255,220,120,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(260, -46);
    ctx.lineTo(260, 46);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    text(ctx, 'SEARCHING...', fx + 10, y - 150, 20, '#ffe9a8', 'left', 'bold');
  }
}

function drawObstacle(ctx, it, t) {
  const x = it.x;
  if (x < -160 || x > 1440) return;
  const w = obstacleWidth(it.kind);
  const top = obstacleTop(it.kind);
  if (it.kind === 'fence') {
    ctx.fillStyle = PALETTE.fence;
    ctx.fillRect(x - 6, top, 12, obstacleHeight('fence'));
    ctx.fillRect(x + w - 6, top, 12, obstacleHeight('fence'));
    ctx.fillRect(x - 14, top + 8, w + 28, 10);
    ctx.fillRect(x - 14, top + 36, w + 28, 10);
    ctx.fillStyle = '#8a5a28';
    ctx.fillRect(x - 14, top + 8, w + 28, 3);
  } else if (it.kind === 'plank') {
    ctx.fillStyle = '#7a3b12';
    ctx.fillRect(x - 10, top, w + 20, 36);
    ctx.fillStyle = '#a06a2e';
    ctx.fillRect(x - 10, top, w + 20, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = 'bold 15px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▼ SLIDE ▼', x + w / 2, top + 56);
  } else if (it.kind === 'pumpkin') {
    ctx.fillStyle = '#e07b1f';
    ellipse(ctx, x + w / 2, GROUND_Y - 26, 34, 28);
    ctx.fillStyle = '#c96a1e';
    ellipse(ctx, x + w / 2 - 12, GROUND_Y - 26, 12, 26);
    ellipse(ctx, x + w / 2 + 12, GROUND_Y - 26, 12, 26);
    ctx.fillStyle = '#3f7a2a';
    ctx.fillRect(x + w / 2 - 2, GROUND_Y - 58, 5, 12);
  } else if (it.kind === 'hay') {
    ctx.fillStyle = PALETTE.hay;
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y);
    ctx.quadraticCurveTo(x + w / 2, GROUND_Y - 96, x + w, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c98f2e';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 14 + i * 20, GROUND_Y - 8);
      ctx.quadraticCurveTo(x + 20 + i * 20, GROUND_Y - 50, x + 26 + i * 20, GROUND_Y - 78);
      ctx.stroke();
    }
    if (it.nearHide) {
      text(ctx, 'H — HIDE!', x + w / 2, GROUND_Y - 96, 18, '#fff3c0', 'center');
    }
  } else if (it.kind === 'oven') {
    // glowing oven with an open door of fire
    ctx.fillStyle = '#3a3a44';
    roundRect(ctx, x, top, w, obstacleHeight('oven'), 8);
    ctx.fill();
    const flick = 0.75 + Math.sin(t * 9 + x) * 0.25;
    ctx.fillStyle = `rgba(255,${Math.floor(120 + 60 * flick)},20,${0.85 * flick})`;
    roundRect(ctx, x + 14, top + 34, w - 28, 62, 6);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ellipse(ctx, x + w / 2, top + 62, 18, 10);
    ctx.fillStyle = '#c0c0c8';
    ctx.fillRect(x + 8, top + 8, w - 16, 10);
    ctx.fillStyle = '#ff5a2a';
    ellipse(ctx, x + w / 2, top - 6, 26 + Math.sin(t * 7) * 4, 10);
  } else if (it.kind === 'knife') {
    const shadowX = x + 20;
    // warning shadow on the ground while it falls
    if (it.state === 'falling') {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ellipse(ctx, shadowX, GROUND_Y + 6, 34, 8);
      const fallY = 60 + it.t * 900;
      drawKnife(ctx, shadowX, Math.min(fallY, GROUND_Y - 40), -0.5);
    } else if (it.state === 'stuck') {
      drawKnife(ctx, shadowX, GROUND_Y - 40, -0.15);
    } else {
      // still above the screen: show the shadow + a glint so the player can react
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ellipse(ctx, shadowX, GROUND_Y + 6, 26, 6);
    }
  } else if (it.kind === 'corn') {
    const cy = GROUND_Y - 26 + (it.yOff || 0) + Math.sin(t * 3 + it.dist) * 4;
    ctx.fillStyle = PALETTE.corn;
    ellipse(ctx, x, cy, 12, 18);
    ctx.fillStyle = '#f0a500';
    ctx.fillRect(x - 2, cy - 16, 4, 32);
    ctx.fillStyle = '#3f7a2a';
    ellipse(ctx, x, cy + 20, 7, 5);
  } else if (it.kind === 'feather') {
    const cy = GROUND_Y - 46 + (it.yOff || 0) + Math.sin(t * 3 + it.dist) * 5;
    ctx.fillStyle = PALETTE.feather;
    ctx.beginPath();
    ctx.ellipse(x, cy, 8, 20, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8a83c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 6, cy + 14);
    ctx.lineTo(x + 6, cy - 14);
    ctx.stroke();
  } else if (it.kind === 'gravy') {
    const cy = GROUND_Y - 30 + (it.yOff || 0) + Math.sin(t * 2 + it.dist) * 4;
    ctx.fillStyle = '#8a4a1e';
    ellipse(ctx, x, cy, 16, 12);
    ctx.fillStyle = '#a06a2e';
    ellipse(ctx, x, cy - 4, 12, 7);
    ctx.fillStyle = '#fff3c0';
    ctx.font = 'bold 11px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GRAVY', x, cy + 26);
  }
}

function drawKnife(ctx, x, y, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.fillStyle = '#d8dce2';
  ctx.beginPath();
  ctx.moveTo(-6, -44);
  ctx.lineTo(6, -44);
  ctx.lineTo(10, 6);
  ctx.lineTo(0, 22);
  ctx.lineTo(-10, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2a2018';
  ctx.fillRect(-5, -62, 10, 20);
  ctx.restore();
}

function drawNet(ctx, net) {
  ctx.strokeStyle = '#e8e0c0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = -2; i <= 2; i++) {
    ctx.moveTo(net.x - 22, net.y + i * 12);
    ctx.lineTo(net.x + 22, net.y + i * 12);
    ctx.moveTo(net.x + i * 12, net.y - 22);
    ctx.lineTo(net.x + i * 12, net.y + 22);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(net.x, net.y, 24, 0, Math.PI * 2);
  ctx.stroke();
}

function drawDoor(ctx, x, t) {
  // the freedom door at the end of the kitchen
  ctx.fillStyle = '#5e3a5e';
  roundRect(ctx, x - 8, GROUND_Y - 190, 130, 190, 10);
  ctx.fill();
  ctx.fillStyle = `rgba(255,215,106,${0.7 + Math.sin(t * 4) * 0.3})`;
  roundRect(ctx, x + 8, GROUND_Y - 172, 98, 172, 8);
  ctx.fill();
  ctx.fillStyle = '#7a4a21';
  ctx.fillRect(x + 88, GROUND_Y - 96, 8, 8);
  text(ctx, 'FREEDOM', x + 57, GROUND_Y - 205, 22, '#ffe9a8', 'center');
}

export function drawWorld(ctx, g, t) {
  const stage = g.stage;
  drawSky(ctx, stage, t);
  drawHills(ctx, g.distance * 12, stage);
  drawScenery(ctx, g.world.scenery, g.distance, stage);
  drawGround(ctx, g.distance * 12, stage);
  if (g.distance >= 1290) drawDoor(ctx, g.world.screenX(1300, g.distance), t);
  for (const it of g.world.items) drawObstacle(ctx, it, t);
  for (const net of g.farmer.nets) drawNet(ctx, net);
  if (g.turkey.hidden) {
    // turkey peeking out of the haystack
    const hay = g.nearHay;
    if (hay) text(ctx, '...', hay.x + 48, GROUND_Y - 90, 22, '#fff', 'center');
  }
  drawFarmer(ctx, g.farmer.screenX(), g.farmer.mode, g.farmer.runPhase, t);
  drawTurkey(ctx, g.turkey, t);
}

export function drawHUD(ctx, g) {
  // top bar
  ctx.fillStyle = 'rgba(30,12,6,0.72)';
  roundRect(ctx, 16, 12, W - 32, 64, 12);
  ctx.fill();
  text(ctx, `SKOR ${Math.floor(g.score)}`, 36, 44, 26, '#ffd76a');
  text(ctx, `JARAK ${Math.floor(g.distance)} m`, 300, 44, 26, '#fff');
  // lives as hearts
  for (let i = 0; i < 3; i++) {
    const hx = 560 + i * 34;
    ctx.fillStyle = i < g.lives ? '#ff3b4e' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(hx, 52);
    ctx.bezierCurveTo(hx - 12, 38, hx - 26, 46, hx, 62);
    ctx.bezierCurveTo(hx + 26, 46, hx + 12, 38, hx, 52);
    ctx.fill();
  }
  text(ctx, 'NYAWA', 560, 24, 13, '#ffb0b8', 'left');
  // farmer gap meter
  const gx = 700;
  text(ctx, 'FARMER GAP', gx, 26, 13, '#ffb0b8', 'left');
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, gx, 34, 180, 16, 8);
  ctx.fill();
  const frac = Math.max(0, Math.min(1, g.farmer.gap / 100));
  ctx.fillStyle = frac > 0.4 ? '#7ddb4a' : frac > 0.2 ? '#ffd23e' : '#ff3b4e';
  roundRect(ctx, gx, 34, 180 * frac, 16, 8);
  ctx.fill();
  text(ctx, `${Math.max(0, Math.floor(g.farmer.gap))} m`, gx + 190, 44, 20, '#fff');
  // stage + combo
  text(ctx, `STAGE ${g.stage + 1}/3 ${STAGE_NAMES[g.stage]}`, 1010, 32, 20, '#ffe9a8', 'left');
  if (g.combo > 1) text(ctx, `KOMBO x${g.combo}`, 1010, 58, 20, '#7ddb4a', 'left');
  // progress to the freedom door
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 16, 84, W - 32, 10, 5);
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  roundRect(ctx, 16, 84, (W - 32) * Math.min(1, g.distance / 1300), 10, 5);
  ctx.fill();
  // search warning
  if (g.farmer.mode === 'search') {
    outlineText(ctx, 'PETANI MENCARI! SEMBUNYI DI JERAMI (H)', W / 2, 130, 26, '#ffe9a8', 'center');
  }
  if (g.turkey.hidden) {
    outlineText(ctx, 'KAMU SEMBUNYI...', W / 2, 170, 24, '#fff3c0', 'center');
  }
}

function drawButton(ctx, rect, label, hover) {
  ctx.fillStyle = hover ? '#ff8c1a' : '#e07b1f';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,20,0,0.6)';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 26, '#fff', 'center');
}

export function drawTitle(ctx, g, mouse, t) {
  drawSky(ctx, 0, t);
  drawHills(ctx, 0, 0);
  drawGround(ctx, 0, 0);
  // a calm turkey + farmer posing on the title screen
  drawTurkey(ctx, { ...g.turkey, x: 420, y: GROUND_Y, runPhase: 0.2, grounded: true, sliding: 0, hidden: false, invuln: 0 }, t);
  drawFarmer(ctx, 240, 'chase', 0.3, t);
  // fence + pumpkin props
  drawObstacle(ctx, { kind: 'fence', x: 950, dist: 0, state: 'idle', t: 0 }, t);
  drawObstacle(ctx, { kind: 'pumpkin', x: 1060, dist: 0, state: 'idle', t: 0 }, t);

  ctx.fillStyle = 'rgba(30,12,6,0.45)';
  ctx.fillRect(0, 0, W, H);
  outlineText(ctx, 'GOBBLE DASH', W / 2, 150, 84, '#ffd76a', 'center', '900');
  outlineText(ctx, 'Great Turkey Escape', W / 2, 220, 34, '#fff3c0', 'center');
  text(ctx, 'Kabur dari peternakan sebelum jadi santapan Thanksgiving!', W / 2, 268, 22, '#fff', 'center');

  const panel = { x: W / 2 - 330, y: 300, w: 660, h: 190 };
  ctx.fillStyle = 'rgba(30,12,6,0.72)';
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 14);
  ctx.fill();
  text(ctx, 'CARA MAIN', W / 2, 330, 22, '#ffd76a', 'center');
  text(ctx, 'SPASI / ↑  lompat pagar & labu', W / 2, 366, 20, '#fff', 'center');
  text(ctx, '↓ / S  slide di bawah papan  •  H  sembunyi di jerami saat petani mencari', W / 2, 396, 20, '#fff', 'center');
  text(ctx, 'Kumpulkan jagung (+100) • Gravy bikin petani melambat • Bulu emas +1 nyawa', W / 2, 426, 20, '#fff', 'center');
  text(ctx, 'P pause  •  R restart  •  M mute', W / 2, 456, 20, '#fff', 'center');

  const btn = { x: W / 2 - 150, y: 520, w: 300, h: 64 };
  const hover = mouse.x >= btn.x && mouse.x <= btn.x + btn.w && mouse.y >= btn.y && mouse.y <= btn.y + btn.h;
  drawButton(ctx, btn, '▶  MULAI LARI', hover);
  text(ctx, 'Stage 1 Farmyard → Stage 2 Barn → Stage 3 Kitchen → FREEDOM', W / 2, 620, 20, '#ffe9a8', 'center');
  text(ctx, `Best score: ${g.best}`, W / 2, 656, 20, '#fff', 'center');
  return { start: btn };
}

export function drawPaused(ctx, g) {
  ctx.fillStyle = 'rgba(20,8,4,0.6)';
  ctx.fillRect(0, 0, W, H);
  outlineText(ctx, 'PAUSED', W / 2, 340, 64, '#ffd76a', 'center');
  text(ctx, 'P lanjut  •  R restart dari awal', W / 2, 420, 22, '#fff', 'center');
}

export function drawEnd(ctx, g, mouse) {
  ctx.fillStyle = 'rgba(20,8,4,0.72)';
  ctx.fillRect(0, 0, W, H);
  const escaped = g.state === 'escaped';
  outlineText(ctx, escaped ? 'ESCAPED!' : 'CAUGHT!', W / 2, 190, 84, escaped ? '#7ddb4a' : '#ff5a4a', 'center', '900');
  text(
    ctx,
    escaped ? 'Kamu lolos dari dapur Thanksgiving. Merdeka, kalkun!' : 'Petani menangkapmu... jadi santapan Thanksgiving.',
    W / 2,
    260,
    24,
    '#fff',
    'center',
  );
  const panel = { x: W / 2 - 300, y: 300, w: 600, h: 210 };
  ctx.fillStyle = 'rgba(30,12,6,0.8)';
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 14);
  ctx.fill();
  text(ctx, `SKOR  ${Math.floor(g.score)}`, W / 2, 340, 30, '#ffd76a', 'center');
  text(ctx, `Jarak tempuh  ${Math.floor(g.distance)} m`, W / 2, 382, 22, '#fff', 'center');
  text(ctx, `Nyawa tersisa  ${g.lives}  •  Jagung  ${g.cornCount}`, W / 2, 416, 22, '#fff', 'center');
  text(ctx, `Stage tercapai  ${Math.min(g.stage + 1, 3)}/3  •  Best  ${Math.floor(g.best)}`, W / 2, 450, 22, '#fff', 'center');
  if (g.score >= g.best && g.score > 0) text(ctx, '★ SKOR TERBAIK BARU! ★', W / 2, 484, 22, '#7ddb4a', 'center');
  const btn = { x: W / 2 - 150, y: 550, w: 300, h: 64 };
  const hover = mouse.x >= btn.x && mouse.x <= btn.x + btn.w && mouse.y >= btn.y && mouse.y <= btn.y + btn.h;
  drawButton(ctx, btn, '↻  MAIN LAGI (R)', hover);
  return { restart: btn };
}
