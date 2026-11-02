import * as THREE from 'three';
import {
  renderer, camera, resizeRenderer, resetCamera, getGroundHeight,
  updateWorld, renderWorld
} from './world.js?v=voxel-fix-2';

const mount = document.querySelector('#world');
mount.appendChild(renderer.domElement);

const $ = id => document.getElementById(id);
const intro = $('intro');
const toastEl = $('toast');
const keys = new Set();
let yaw = 0;
let pitch = .17;
let playerY = 1.72;
let verticalSpeed = 0;
let grounded = true;
let elapsed = 0;
let lastFrame = performance.now();
let touring = false;
let tourElapsed = 0;
let touchPointer = null;
let lastTouchX = 0;
let lastTouchY = 0;
let godMode = false;

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

function applyLook() {
  camera.rotation.order = 'YXZ';
  camera.rotation.set(pitch, yaw, 0);
}

function resetPlayer(silent = false) {
  resetCamera();
  yaw = 0;
  pitch = .17;
  playerY = 1.72;
  verticalSpeed = 0;
  grounded = true;
  applyLook();
  if (!silent) toast('已回到入口，滕王阁就在前方。');
}

function resetGodCamera() {
  camera.position.set(0, 48, 76);
  yaw = 0;
  pitch = -.36;
  applyLook();
}

function setViewMode(enabled) {
  godMode = enabled;
  touring = false;
  tourElapsed = 0;
  intro.classList.add('hidden');
  $('tour').classList.remove('selected');
  if (godMode) {
    resetGodCamera();
    $('mode').textContent = '上帝视角';
    $('view-toggle').textContent = '第一人称';
    $('hints').textContent = 'W A S D 飞行 · 鼠标环视 · Space / E 上升 · Q / C 下降 · Shift 加速';
    toast('上帝视角已开启：自由飞行，可穿越建筑。');
  } else {
    resetPlayer(true);
    $('mode').textContent = '第一人称';
    $('view-toggle').textContent = '上帝视角';
    $('hints').textContent = 'W A S D 移动 · 鼠标环顾 · Shift 奔跑 · Space 跳跃';
    toast('已切回第一人称漫游。');
  }
  if (matchMedia('(pointer:fine)').matches && document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock?.();
  }
}

function toggleViewMode() {
  setViewMode(!godMode);
}

function resetView() {
  if (touring) touring = false;
  if (godMode) {
    resetGodCamera();
    toast('上帝视角已重置。');
  } else {
    resetPlayer();
  }
}

function enterWorld() {
  intro.classList.add('hidden');
  if (matchMedia('(pointer:fine)').matches) {
    renderer.domElement.requestPointerLock?.();
  }
  toast(godMode ? 'WASD 飞行 · 鼠标环视 · Space/E 上升 · Q/C 下降' : 'WASD 行走 · 鼠标环顾 · Shift 奔跑 · Space 跳跃');
}

function updatePlayer(dt) {
  const forward = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
  const right = { x: Math.cos(yaw), z: -Math.sin(yaw) };
  let dx = 0, dz = 0;
  if (keys.has('w') || keys.has('arrowup')) { dx += forward.x; dz += forward.z; }
  if (keys.has('s') || keys.has('arrowdown')) { dx -= forward.x; dz -= forward.z; }
  if (keys.has('a') || keys.has('arrowleft')) { dx -= right.x; dz -= right.z; }
  if (keys.has('d') || keys.has('arrowright')) { dx += right.x; dz += right.z; }
  const length = Math.hypot(dx, dz);
  if (length > 0) {
    const speed = keys.has('shift') ? 10.5 : 6.2;
    camera.position.x += dx / length * speed * dt;
    camera.position.z += dz / length * speed * dt;
  }

  camera.position.x = Math.max(-88, Math.min(88, camera.position.x));
  camera.position.z = Math.max(-132, Math.min(42, camera.position.z));

  const floorY = getGroundHeight(camera.position.x, camera.position.z) + 1.72;
  if (keys.has(' ') && grounded) {
    verticalSpeed = 6.2;
    grounded = false;
  }
  if (!grounded) {
    verticalSpeed -= 17 * dt;
    playerY += verticalSpeed * dt;
    if (playerY <= floorY) {
      playerY = floorY;
      verticalSpeed = 0;
      grounded = true;
    }
  } else {
    playerY = floorY;
  }
  camera.position.y = playerY;
  applyLook();
  $('coords').textContent = '位置 ' + camera.position.x.toFixed(0) + ' / ' + camera.position.z.toFixed(0);
}

function updateGodMode(dt) {
  applyLook();
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  const movement = new THREE.Vector3();
  if (keys.has('w') || keys.has('arrowup')) movement.add(forward);
  if (keys.has('s') || keys.has('arrowdown')) movement.sub(forward);
  if (keys.has('d') || keys.has('arrowright')) movement.add(right);
  if (keys.has('a') || keys.has('arrowleft')) movement.sub(right);
  if (keys.has(' ') || keys.has('e')) movement.y += 1;
  if (keys.has('q') || keys.has('c')) movement.y -= 1;
  if (movement.lengthSq() > 0) {
    movement.normalize();
    const speed = keys.has('shift') ? 38 : 16;
    camera.position.addScaledVector(movement, speed * dt);
  }
  camera.position.x = Math.max(-180, Math.min(180, camera.position.x));
  camera.position.y = Math.max(2, Math.min(170, camera.position.y));
  camera.position.z = Math.max(-190, Math.min(90, camera.position.z));
  $('coords').textContent = '飞行 ' + camera.position.x.toFixed(0) + ' / ' + camera.position.y.toFixed(0) + ' / ' + camera.position.z.toFixed(0);
}

const tourFrames = [
  { t: 0, p: [0, 2, 38], l: [0, 10, 1] },
  { t: 7, p: [-10, 3.2, 29], l: [0, 11, 1] },
  { t: 15, p: [-13, 7, 12], l: [0, 12, 0] },
  { t: 23, p: [-2, 8, 15], l: [0, 5, -52] },
  { t: 32, p: [12, 5, 14], l: [0, 6, -54] },
  { t: 42, p: [0, 2, 38], l: [0, 10, 1] }
];
function updateTour(dt) {
  tourElapsed += dt;
  const t = Math.min(tourElapsed, 42);
  let i = 0;
  while (i < tourFrames.length - 2 && t > tourFrames[i + 1].t) i++;
  const a = tourFrames[i], b = tourFrames[i + 1];
  const raw = Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t)));
  const f = raw * raw * (3 - 2 * raw);
  const p = a.p.map((v, k) => v + (b.p[k] - v) * f);
  const l = a.l.map((v, k) => v + (b.l[k] - v) * f);
  camera.position.set(p[0], p[1], p[2]);
  camera.lookAt(l[0], l[1], l[2]);
  if (t >= 42) {
    touring = false;
    $('tour').classList.remove('selected');
    $('mode').textContent = godMode ? '上帝视角' : '第一人称';
    yaw = camera.rotation.y;
    pitch = camera.rotation.x;
    toast('导览结束，现在可以自由探索。');
  }
}

function startTour() {
  touring = !touring;
  tourElapsed = 0;
  if (touring) {
    intro.classList.add('hidden');
    document.exitPointerLock?.();
    $('tour').classList.add('selected');
    $('mode').textContent = '自动导览';
    toast('开始 42 秒场景导览。');
  } else {
    $('tour').classList.remove('selected');
    $('mode').textContent = godMode ? '上帝视角' : '第一人称';
    if (godMode) { yaw = camera.rotation.y; pitch = camera.rotation.x; }
    else resetPlayer();
  }
}

$('enter').addEventListener('click', enterWorld);
$('reset').addEventListener('click', resetView);
$('tour').addEventListener('click', startTour);
$('view-toggle').addEventListener('click', toggleViewMode);
$('fullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});

document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault();
  keys.add(key);
  if (key === 'v') toggleViewMode();
  if (key === 'escape' && document.pointerLockElement !== renderer.domElement) {
    $('mode').textContent = godMode ? '上帝视角' : '第一人称';
  }
});
document.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

renderer.domElement.addEventListener('click', () => {
  if (!touring && matchMedia('(pointer:fine)').matches && document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock?.();
  }
});
document.addEventListener('mousemove', event => {
  if (document.pointerLockElement === renderer.domElement && !touring) {
    yaw -= event.movementX * .0021;
    pitch = Math.max(-1.15, Math.min(1.05, pitch - event.movementY * .0018));
  }
});

renderer.domElement.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'touch' || touring) return;
  touchPointer = event.pointerId;
  lastTouchX = event.clientX;
  lastTouchY = event.clientY;
  renderer.domElement.setPointerCapture?.(event.pointerId);
});
renderer.domElement.addEventListener('pointermove', event => {
  if (event.pointerId !== touchPointer || touring) return;
  const dx = event.clientX - lastTouchX;
  const dy = event.clientY - lastTouchY;
  lastTouchX = event.clientX;
  lastTouchY = event.clientY;
  yaw -= dx * .004;
  pitch = Math.max(-1.15, Math.min(1.05, pitch - dy * .003));
});
renderer.domElement.addEventListener('pointerup', event => {
  if (event.pointerId === touchPointer) touchPointer = null;
});
renderer.domElement.addEventListener('pointercancel', () => { touchPointer = null; });

document.querySelectorAll('[data-key]').forEach(button => {
  const key = button.dataset.key;
  const down = event => { event.preventDefault(); keys.add(key); button.classList.add('pressed'); };
  const up = event => { event.preventDefault(); keys.delete(key); button.classList.remove('pressed'); };
  button.addEventListener('pointerdown', down);
  button.addEventListener('pointerup', up);
  button.addEventListener('pointerleave', up);
  button.addEventListener('pointercancel', up);
});

window.addEventListener('resize', resizeRenderer);

function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, .04);
  lastFrame = now;
  elapsed += dt;
  if (touring) updateTour(dt);
  else if (godMode) updateGodMode(dt);
  else updatePlayer(dt);
  updateWorld(elapsed, dt);
  renderWorld();
  requestAnimationFrame(frame);
}
resetCamera();
applyLook();
requestAnimationFrame(frame);
