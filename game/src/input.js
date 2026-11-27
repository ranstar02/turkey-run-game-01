// Gobble Dash — input: keyboard + mouse, with edge-triggered "just pressed" keys
// so a jump only fires once per key press.
export function makeInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let mouse = { x: 0, y: 0, clicked: false };

  const KEYMAP = {
    Space: 'jump',
    ArrowUp: 'jump',
    KeyW: 'jump',
    ArrowDown: 'slide',
    KeyS: 'slide',
    KeyH: 'hide',
    KeyP: 'pause',
    KeyR: 'restart',
    KeyM: 'mute',
    Enter: 'confirm',
  };

  function onKeyDown(e) {
    const action = KEYMAP[e.code];
    if (!action) return;
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    if (!held.has(action)) pressed.add(action);
    held.add(action);
  }
  function onKeyUp(e) {
    const action = KEYMAP[e.code];
    if (action) held.delete(action);
  }
  function onMouseMove(e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
  }
  function onMouseDown(e) {
    onMouseMove(e);
    mouse.clicked = true;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    held(action) {
      return held.has(action);
    },
    // true once, then consumed — call once per frame per action.
    wasPressed(action) {
      if (pressed.has(action)) {
        pressed.delete(action);
        return true;
      }
      return false;
    },
    mousePos() {
      return { x: mouse.x, y: mouse.y };
    },
    wasClicked() {
      const c = mouse.clicked;
      mouse.clicked = false;
      return c;
    },
    // Clear edge state at the end of a frame so a press never leaks into the next one.
    endFrame() {
      pressed.clear();
    },
  };
}

// A clickable rectangle helper used by menus.
export function hitRect(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
