// Gobble Dash — config: all tunable numbers in one place.
// Canvas is 1280x800. The turkey runs left -> right while the world scrolls.
export const W = 1280;
export const H = 800;
export const GROUND_Y = 660; // top edge of the ground strip
export const PLAYER_X = 250; // turkey stays near this x, the world moves

export const GRAVITY = 2600; // px / s^2
export const JUMP_V = 980; // px / s
export const SLIDE_TIME = 0.9; // seconds a slide lasts
export const HIDE_TIME = 2.5; // seconds a hide lasts

// px per second per stage (farmyard, barn, kitchen)
export const STAGE_SPEED = [270, 315, 360];
// metres of running that finish each stage
export const STAGE_LENGTH = [400, 450, 450];
export const STAGE_NAMES = ['FARMYARD', 'BARN', 'KITCHEN'];
export const TOTAL_LENGTH = STAGE_LENGTH[0] + STAGE_LENGTH[1] + STAGE_LENGTH[2];

export const MAX_LIVES = 3;
export const GAP_START = 90; // farmer gap in metres
export const GAP_DRAIN = 0.45; // metres / s the farmer closes in
export const GAP_HIT = 12; // metres lost on a hit
export const GAP_GRAVY = 20; // metres gained from gravy
export const GAP_HIDE_RATE = 9; // metres / s gained while hidden
export const GAP_STAGE_BONUS = 25;

export const CORN_SCORE = 100;
export const COMBO_WINDOW = 3.0; // seconds between pickups to keep the combo

export const BEST_KEY = 'gobble-dash-best';

// Autumn sunset palette, shared by every scene.
export const PALETTE = {
  skyTop: '#ff9a3c',
  skyMid: '#e2607a',
  skyBot: '#7b4b94',
  sun: '#ffd76a',
  hillFar: '#8a5a7d',
  hillNear: '#5e3a5e',
  ground: '#7a4a21',
  groundTop: '#a06a2e',
  fence: '#6e4520',
  hay: '#e0a83c',
  corn: '#ffd23e',
  feather: '#ffe9a8',
};
