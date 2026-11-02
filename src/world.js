import * as THREE from 'three';

export const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.className = 'voxel-canvas';

export const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#aeb5a6', 82, 190);

export const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 520);
camera.position.set(0, 2, 38);
camera.rotation.order = 'YXZ';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const seeded = n => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const palette = {
  grass: ['#65794b', '#718451', '#5d7146', '#7b8956'],
  grassDark: '#526544',
  dirt: ['#70583e', '#806346', '#614d38'],
  stone: ['#a69f8b', '#938d7b', '#b4ac98'],
  stoneDark: '#777665',
  stoneLight: '#c2b79d',
  wood: ['#75462f', '#875238', '#68402f', '#95603e'],
  woodDark: '#4b3027',
  woodLight: '#a16b43',
  red: ['#8b3930', '#9c4436', '#78352d'],
  redDark: '#542a27',
  roof: ['#263f3d', '#304b47', '#385650', '#1e3635'],
  roofLight: '#49655a',
  gold: '#b58c4d',
  water: '#315a61',
  leaf: ['#526c43', '#5e7848', '#718452', '#435e3d'],
  leafDark: '#3c5638'
};

const staticBlocks = new Map();
const waterGlints = [];
const cube = new THREE.BoxGeometry(1, 1, 1);
const temp = new THREE.Object3D();

function addBlock(x, y, z, sx, sy, sz, color) {
  if (!staticBlocks.has(color)) staticBlocks.set(color, []);
  temp.position.set(x, y, z);
  temp.rotation.set(0, 0, 0);
  temp.scale.set(sx, sy, sz);
  temp.updateMatrix();
  staticBlocks.get(color).push(temp.matrix.clone());
}
function fillLayer(x1, x2, z1, z2, y, colors, sy = .8, sx = 1, sz = 1) {
  let n = 0;
  for (let x = x1; x <= x2; x += 1) {
    for (let z = z1; z <= z2; z += 1) {
      const c = Array.isArray(colors) ? colors[((n + Math.floor(x * 7 + z * 3)) % colors.length + colors.length) % colors.length] : colors;
      addBlock(x, y, z, sx, sy, sz, c);
      n++;
    }
  }
}
function addPillar(x, z, bottom, height, colors, width = 1) {
  const count = Math.ceil(height);
  for (let i = 0; i < count; i++) {
    addBlock(x, bottom + i + .5, z, width, 1, width, colors[i % colors.length]);
  }
}
function addBeam(x1, x2, z, y, color, depth = .9, height = .8) {
  addBlock((x1 + x2) / 2, y, z, x2 - x1 + 1, height, depth, color);
}
function addSideBeam(x, z1, z2, y, color, width = .9, height = .8) {
  addBlock(x, y, (z1 + z2) / 2, width, height, z2 - z1 + 1, color);
}

function addVoxelRoof(centerZ, baseY, width, depth, levels) {
  const roofColors = palette.roof;
  for (let layer = 0; layer < levels; layer++) {
    const w = width - layer * 2;
    const d = depth - layer * 2;
    const y = baseY + layer * .72;
    const x1 = -Math.floor(w / 2), x2 = Math.floor(w / 2);
    const z1 = centerZ - Math.floor(d / 2), z2 = centerZ + Math.floor(d / 2);
    fillLayer(x1, x2, z1, z2, y, roofColors, .72, 1.04, 1.04);
  }
  const ridgeY = baseY + levels * .72;
  const ridgeW = Math.max(4, width - levels * 3);
  for (let x = -Math.floor(ridgeW / 2); x <= Math.floor(ridgeW / 2); x++) {
    addBlock(x, ridgeY, centerZ, 1.1, .65, 1.25, palette.roofLight);
  }
  addBlock(0, ridgeY + .55, centerZ, 1.2, .85, 1.2, palette.gold);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBlock(sx * (width / 2 + .3), baseY + .85, centerZ + sz * (depth / 2 + .3), 1.3, .75, 1.3, palette.roofLight);
      addBlock(sx * (width / 2 + .75), baseY + 1.25, centerZ + sz * (depth / 2 + .75), .7, .65, .7, palette.gold);
    }
  }
  for (const z of [centerZ - Math.floor(depth / 2), centerZ + Math.floor(depth / 2)]) {
    addBeam(-Math.floor(width / 2), Math.floor(width / 2), z, baseY - .45, palette.woodDark, .7, .65);
  }
}

function addRailing(width, depth, baseY, centerZ, openCenter = false) {
  const z = centerZ + Math.floor(depth / 2) + .15;
  const y = baseY + 1.15;
  for (let x = -Math.floor(width / 2) + 1; x <= Math.floor(width / 2) - 1; x += 2) {
    if (openCenter && Math.abs(x) < 1) continue;
    addBlock(x, y - .45, z, .42, .95, .42, palette.woodLight);
    addBlock(x, y + .12, z, .62, .2, .62, palette.gold);
  }
  addBeam(-Math.floor(width / 2) + 1, Math.floor(width / 2) - 1, z, y + .15, palette.woodLight, .55, .35);
  addBeam(-Math.floor(width / 2) + 1, Math.floor(width / 2) - 1, z, y - .55, palette.woodDark, .45, .22);
  for (const x of [-Math.floor(width / 2) + 1, Math.floor(width / 2) - 1]) {
    addSideBeam(x, centerZ - Math.floor(depth / 2) + 1, centerZ + Math.floor(depth / 2) - 1, y + .15, palette.woodLight, .5, .35);
  }
}

function addWallPanels(width, depth, baseY, height, centerZ, options = {}) {
  const top = Math.floor(height);
  const backZ = centerZ - Math.floor(depth / 2);
  for (let x = -Math.floor(width / 2) + 2; x <= Math.floor(width / 2) - 2; x += 1) {
    for (let y = 1; y < top - 1; y++) {
      const windowSlot = Math.abs(x) > 1 && (x % 4 === 0 || x % 4 === 1);
      if (windowSlot && y > 1) continue;
      addBlock(x, baseY + y, backZ, .94, .94, .35, y % 2 ? palette.wood[(x + y + 8) % palette.wood.length] : palette.woodDark);
    }
  }
  for (const side of [-1, 1]) {
    const sideX = side * (Math.floor(width / 2) - .1);
    for (let z = centerZ - Math.floor(depth / 2) + 2; z <= centerZ + Math.floor(depth / 2) - 2; z++) {
      for (let y = 1; y < top - 1; y++) {
        if (y > 1 && z % 4 !== 0 && z % 4 !== 1) continue;
        addBlock(sideX, baseY + y, z, .35, .94, .94, y % 2 ? palette.wood[(z + y + 8) % palette.wood.length] : palette.woodDark);
      }
    }
  }
}

function addLevel(baseY, width, depth, columnHeight, roofBase, roofLevels, centerZ, options = {}) {
  fillLayer(-Math.floor(width / 2), Math.floor(width / 2), centerZ - Math.floor(depth / 2), centerZ + Math.floor(depth / 2), baseY, [palette.wood[0], palette.woodDark, palette.woodLight], .5, 1, 1);

  const xs = [];
  for (let x = -Math.floor(width / 2) + 1; x <= Math.floor(width / 2) - 1; x += 4) xs.push(x);
  if (!xs.includes(0)) xs.push(0);
  const frontZ = centerZ + Math.floor(depth / 2) - .5;
  const backZ = centerZ - Math.floor(depth / 2) + .5;

  xs.forEach(x => {
    addPillar(x, frontZ, baseY + .5, columnHeight, palette.red, 1.15);
    addPillar(x, backZ, baseY + .5, columnHeight, palette.red, 1.15);
    addBlock(x, baseY + columnHeight + .1, frontZ, 1.45, .35, 1.45, palette.gold);
    addBlock(x, baseY + columnHeight + .1, backZ, 1.45, .35, 1.45, palette.gold);
  });
  for (const side of [-1, 1]) {
    const x = side * (Math.floor(width / 2) - .5);
    for (let z = centerZ - Math.floor(depth / 2) + 2; z <= centerZ + Math.floor(depth / 2) - 2; z += 3) {
      addPillar(x, z, baseY + .5, columnHeight, palette.red, 1.05);
    }
  }

  const beamY = baseY + columnHeight + .55;
  addBeam(-Math.floor(width / 2), Math.floor(width / 2), frontZ, beamY, palette.woodDark, 1.1, .8);
  addBeam(-Math.floor(width / 2), Math.floor(width / 2), backZ, beamY, palette.woodDark, 1.1, .8);
  addSideBeam(-Math.floor(width / 2), backZ, frontZ, beamY, palette.woodDark, 1.1, .8);
  addSideBeam(Math.floor(width / 2), backZ, frontZ, beamY, palette.woodDark, 1.1, .8);

  if (options.walls) addWallPanels(width, depth, baseY, columnHeight, centerZ);
  addRailing(width, depth, baseY, centerZ, options.openCenter === true);

  const eaveW = width + 4;
  const eaveD = depth + 4;
  addVoxelRoof(centerZ, roofBase, eaveW, eaveD, roofLevels);
}

function buildPavilion() {
  const z = 1;
  fillLayer(-13, 13, -10, 12, .05, palette.stone, 1.1, 1.05, 1.05);
  fillLayer(-13, 13, -10, 12, .68, palette.stoneDark, .22, 1.05, 1.05);
  fillLayer(-11, 11, -8, 10, .87, palette.wood, .34, 1.02, 1.02);

  for (let x = -13; x <= 13; x++) {
    addBlock(x, 1.25, -10, 1, .25, 1, palette.stoneLight);
    addBlock(x, 1.25, 12, 1, .25, 1, palette.stoneLight);
  }
  for (let zz = -9; zz <= 11; zz++) {
    addBlock(-13, 1.25, zz, 1, .25, 1, palette.stoneLight);
    addBlock(13, 1.25, zz, 1, .25, 1, palette.stoneLight);
  }

  addLevel(1.45, 20, 14, 4.2, 6.25, 4, z, { walls: true, openCenter: true });
  addLevel(9.8, 16, 11, 3.5, 13.8, 4, z, { walls: true, openCenter: true });
  addLevel(17.35, 11, 8, 3.0, 20.85, 4, z, { walls: true, openCenter: true });

  // Broad stone steps and a clear central approach.
  for (let i = 0; i < 8; i++) {
    const zz = 23 - i * 1.55;
    const yy = .05 + i * .11;
    addBlock(0, yy, zz, 6.5, .25 + i * .02, 1.7, i % 2 ? palette.stone : palette.stoneLight);
    addBlock(-3.55, yy + .15, zz, .55, .45, 1.7, palette.stoneDark);
    addBlock(3.55, yy + .15, zz, .55, .45, 1.7, palette.stoneDark);
  }
  for (let zPath = 26; zPath <= 35; zPath++) {
    for (let x = -3; x <= 3; x++) {
      addBlock(x, -.02, zPath, .95, .16, .95, (x + zPath) % 3 ? palette.stone : palette.stoneLight);
    }
  }

  // A simple pixel sign, built as a block-backed plaque.
  addBlock(0, 5.35, 8.65, 5.4, 1.45, .5, palette.redDark);
  addBlock(0, 5.35, 8.93, 5.1, 1.18, .12, palette.gold);
  addBlock(0, 5.35, 9.02, 4.85, .96, .08, palette.redDark);
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512; signCanvas.height = 128;
  const signCtx = signCanvas.getContext('2d');
  signCtx.fillStyle = '#542a27'; signCtx.fillRect(0, 0, 512, 128);
  signCtx.strokeStyle = '#d0aa68'; signCtx.lineWidth = 7; signCtx.strokeRect(8, 8, 496, 112);
  signCtx.fillStyle = '#f0d59b'; signCtx.font = 'bold 78px KaiTi, STKaiti, serif';
  signCtx.textAlign = 'center'; signCtx.textBaseline = 'middle'; signCtx.fillText('滕 王 阁', 256, 66);
  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  signTexture.magFilter = THREE.NearestFilter;
  signTexture.minFilter = THREE.NearestFilter;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.65, 1.05), new THREE.MeshBasicMaterial({ map: signTexture }));
  sign.position.set(0, 5.35, 9.1);
  scene.add(sign);
}

function addTree(x, z, scale = 1, seed = 1) {
  const trunkH = Math.round(4 * scale);
  for (let y = 0; y < trunkH; y++) addBlock(x, y + .25, z, .9 * scale, 1, .9 * scale, palette.woodDark);
  const crownY = trunkH + 1;
  const radius = Math.round(2.2 * scale);
  for (let y = -1; y <= 2; y++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const edge = Math.abs(dx) + Math.abs(dz) + Math.abs(y) * .65;
        if (edge > radius * 2.1) continue;
        if (seeded(seed + dx * 13 + dz * 7 + y * 19) > .13) {
          const c = palette.leaf[Math.floor(seeded(seed + dx * 3 + dz * 5 + y * 11) * palette.leaf.length)];
          addBlock(x + dx * scale, crownY + y * scale, z + dz * scale, 1.15 * scale, 1.05 * scale, 1.15 * scale, c);
        }
      }
    }
  }
  addBlock(x, crownY + 2.1 * scale, z, .85 * scale, .65 * scale, .85 * scale, palette.leafDark);
}

function buildLandscape() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 300),
    new THREE.MeshStandardMaterial({ color: '#65784d', roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -.62, -20);
  ground.receiveShadow = true;
  scene.add(ground);

  // River bank and low stone edging.
  for (let x = -38; x <= 38; x += 1) {
    addBlock(x, -.12, -17, 1, .75, 1, palette.stoneDark);
    if (x % 3 === 0) addBlock(x, .22, -18, 1, .3, 1, palette.stoneLight);
  }

  const waterGeo = new THREE.PlaneGeometry(240, 82, 120, 44);
  const water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({
    color: palette.water, roughness: .27, metalness: .12
  }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -.35, -60);
  water.receiveShadow = true;
  scene.add(water);

  // Pixel-like bands of reflected sky.
  const reflections = new THREE.Group();
  for (let i = 0; i < 68; i++) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(1 + seeded(i + 1) * 4, .035, .18 + seeded(i + 3) * .3),
      new THREE.MeshBasicMaterial({ color: i % 4 === 0 ? '#c49a69' : '#78928a', transparent: true, opacity: .18 + seeded(i + 5) * .16 })
    );
    m.position.set((seeded(i + 9) - .5) * 56, -.29, -35 - seeded(i + 17) * 46);
    reflections.add(m);
    waterGlints.push(m);
  }
  scene.add(reflections);
  reflections.userData.animate = true;

  // Three distant stepped mountain ranges.
  const ranges = [
    { z: -112, color: ['#718078', '#7e897d', '#63756e'], height: 13, step: 2.2, seed: 7 },
    { z: -126, color: ['#899187', '#96998a', '#78867e'], height: 18, step: 2.5, seed: 19 },
    { z: -140, color: ['#a9a999', '#b3ad9b', '#969b8e'], height: 22, step: 2.8, seed: 31 }
  ];
  for (const range of ranges) {
    for (let x = -92; x <= 92; x += 2) {
      const n = Math.sin(x * .045 + range.seed) * .28 + Math.sin(x * .12 + range.seed * 2) * .18 + seeded(x + range.seed) * .2;
      const h = Math.max(3, range.height * (.45 + n));
      for (let y = 0; y < h; y += 2) {
        addBlock(x, y + 1, range.z, 2.1, 2.1, range.step, range.color[Math.floor(seeded(x + y + range.seed) * range.color.length)]);
      }
    }
  }

  // Trees frame the approach without hiding the pavilion.
  [
    [-23, 12, 1.4, 3], [-29, -2, 1.65, 8], [-21, -18, 1.25, 13],
    [24, 15, 1.45, 22], [30, -2, 1.7, 27], [22, -19, 1.3, 32],
    [-39, 18, 1.5, 41], [40, 14, 1.55, 47], [-42, -12, 1.4, 52], [43, -12, 1.5, 61]
  ].forEach(v => addTree(v[0], v[1], v[2], v[3]));

  // Reeds as small vertical voxel clusters along the near bank.
  for (let i = 0; i < 54; i++) {
    const x = -40 + i * 1.5;
    const z = -20 - seeded(i + 8) * 2.5;
    const h = 1.5 + seeded(i + 31) * 2.5;
    addBlock(x, h / 2, z, .16, h, .16, i % 3 ? '#7b8552' : '#a08b58');
    addBlock(x + .35, h * .7, z, .8, .12, .12, '#78804d');
  }
}

function makeAnimatedBlock(parent, x, y, z, sx, sy, sz, color) {
  const m = new THREE.Mesh(cube, new THREE.MeshStandardMaterial({ color, roughness: .88 }));
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function buildBoat() {
  const boat = new THREE.Group();
  const hullColors = ['#69432f', '#805338', '#583a2c'];
  for (let x = -3; x <= 3; x++) {
    const taper = Math.abs(x) === 3 ? 1.1 : Math.abs(x) === 2 ? 2.0 : 2.5;
    makeAnimatedBlock(boat, x, .15, 0, 1.05, .55, taper, hullColors[(x + 9) % hullColors.length]);
    makeAnimatedBlock(boat, x, .48, 0, 1.02, .16, taper * .8, '#9b6945');
  }
  for (let x = -2; x <= 2; x++) {
    makeAnimatedBlock(boat, x, 1.25, 0, 1.05, .45, 1.9, '#263d3b');
  }
  for (let x = -1; x <= 1; x++) {
    makeAnimatedBlock(boat, x, 1.75, 0, 1.05, .55, 1.9, '#263d3b');
  }
  makeAnimatedBlock(boat, 0, 2.08, 0, 3.4, .22, 2.6, '#1d3332');
  makeAnimatedBlock(boat, 2.5, 1.35, .7, .4, .5, .4, '#d7a45f');
  makeAnimatedBlock(boat, 2.5, 1.9, .7, .18, .7, .18, '#e3ba75');
  boat.position.set(-26, -.2, -51);
  scene.add(boat);
  return boat;
}
const boat = buildBoat();

function buildClouds() {
  const clouds = [];
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group();
    const cx = (seeded(i + 4) - .5) * 150;
    const cy = 29 + seeded(i + 17) * 17;
    const cz = -65 - seeded(i + 21) * 55;
    const count = 5 + Math.floor(seeded(i + 31) * 5);
    for (let j = 0; j < count; j++) {
      makeAnimatedBlock(g, (j - count / 2) * 2.1, (j % 3) * .7, (j % 2) * .5, 3.2, 1.1, 2.2, j % 3 ? '#d5cdb5' : '#e4d6b8');
    }
    g.position.set(cx, cy, cz);
    scene.add(g);
    clouds.push(g);
  }
  return clouds;
}
const clouds = buildClouds();

function buildBird(x, y, z, scale, phase) {
  const g = new THREE.Group();
  makeAnimatedBlock(g, 0, 0, 0, 1.4 * scale, .24 * scale, .35 * scale, '#3b403b');
  const left = new THREE.Group();
  const right = new THREE.Group();
  makeAnimatedBlock(left, -.7 * scale, .2 * scale, 0, 1.5 * scale, .18 * scale, .28 * scale, '#303832');
  makeAnimatedBlock(right, .7 * scale, .2 * scale, 0, 1.5 * scale, .18 * scale, .28 * scale, '#303832');
  left.position.x = -.55 * scale;
  right.position.x = .55 * scale;
  g.add(left, right);
  g.position.set(x, y, z);
  scene.add(g);
  return { group: g, left, right, phase, startX: x, startY: y, startZ: z };
}
const birds = [
  buildBird(-19, 20, -83, 1.25, 0),
  buildBird(-26, 23, -91, .7, 1.2),
  buildBird(-31, 21, -95, .6, 2.1),
  buildBird(23, 17, -77, .65, .6),
  buildBird(28, 18, -84, .55, 1.7)
];

function buildSky() {
  const uniforms = {
    topColor: { value: new THREE.Color('#657b83') },
    horizonColor: { value: new THREE.Color('#e0b98c') },
    sunColor: { value: new THREE.Color('#f4d2a0') },
    sunDirection: { value: new THREE.Vector3(-.5, .18, -.84).normalize() }
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(480, 32, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms,
      vertexShader: 'varying vec3 vDir; void main(){ vDir=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 sunColor; uniform vec3 sunDirection; varying vec3 vDir; void main(){ float h=smoothstep(-.12,.82,vDir.y); vec3 c=mix(horizonColor,topColor,h); float s=max(dot(normalize(vDir),normalize(sunDirection)),0.0); c=mix(c,sunColor,pow(s,9.0)*.28+pow(s,160.0)*1.5); gl_FragColor=vec4(c,1.0); }'
    })
  );
  scene.add(sky);
  return uniforms;
}
const skyUniforms = buildSky();

function finalizeBlocks() {
  for (const [color, matrices] of staticBlocks.entries()) {
    const material = new THREE.MeshStandardMaterial({ color, roughness: .9, metalness: 0 });
    const mesh = new THREE.InstancedMesh(cube, material, matrices.length);
    mesh.name = 'voxel-' + color.replace('#', '');
    for (let i = 0; i < matrices.length; i++) mesh.setMatrixAt(i, matrices[i]);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
  }
}
buildLandscape();
buildPavilion();
finalizeBlocks();

scene.add(new THREE.HemisphereLight('#e4e6d6', '#46523c', 1.55));
const sun = new THREE.DirectionalLight('#ffe0b6', 2.25);
sun.position.set(-42, 58, 34);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -72;
sun.shadow.camera.right = 72;
sun.shadow.camera.top = 72;
sun.shadow.camera.bottom = -72;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 190;
sun.shadow.bias = -0.00025;
sun.shadow.normalBias = .035;
scene.add(sun);
const fill = new THREE.DirectionalLight('#b7c9cb', .35);
fill.position.set(36, 25, -60);
scene.add(fill);

const water = scene.children.find(o => o.isMesh && o.geometry.type === 'PlaneGeometry' && o.position.z === -60);
const waterPosition = water.geometry.attributes.position;
const baseWater = waterPosition.array.slice();

export function resizeRenderer() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

export function resetCamera() {
  camera.position.set(0, 2, 38);
  camera.rotation.order = 'YXZ';
  camera.rotation.set(.17, 0, 0);
}

export function getGroundHeight(x, z) {
  if (Math.abs(x) < 3.7 && z >= 10.2 && z <= 24.5) {
    const step = clamp(Math.floor((24.5 - z) / 1.55), 0, 7);
    return .175 + step * .12;
  }
  if (Math.abs(x) <= 13 && z >= -10 && z <= 12) return 1.04;
  return 0;
}

export function updateWorld(time, dt) {
  const t = time || 0;
  const pos = waterPosition;
  for (let i = 0; i < pos.count; i++) {
    const x = baseWater[i * 3];
    const z = baseWater[i * 3 + 1];
    pos.array[i * 3 + 2] = Math.sin(x * .09 + t * .7) * .035 + Math.cos(z * .12 - t * .5) * .025;
  }
  pos.needsUpdate = true;
  water.geometry.computeVertexNormals();

  waterGlints.forEach((m, i) => {
    m.position.x += dt * (.45 + (i % 4) * .18);
    if (m.position.x > 32) m.position.x = -32;
    m.material.opacity = .13 + Math.sin(t * .8 + i) * .045;
  });

  boat.position.x = -26 + ((t * .52) % 52);
  boat.position.z = -51 + Math.sin(t * .18) * 1.2;
  boat.position.y = -.2 + Math.sin(t * 1.1) * .05;
  boat.rotation.y = Math.sin(t * .12) * .035;

  clouds.forEach((c, i) => {
    c.position.x += dt * (.7 + (i % 3) * .2);
    if (c.position.x > 112) c.position.x = -112;
    c.position.y += Math.sin(t * .14 + i) * .001;
  });

  birds.forEach((b, i) => {
    b.group.position.x = b.startX + Math.sin(t * .13 + b.phase) * 8 + (t * .16) % 24;
    b.group.position.y = b.startY + Math.sin(t * .9 + b.phase) * 1.2;
    b.group.position.z = b.startZ + Math.cos(t * .2 + b.phase) * 3;
    b.left.rotation.z = Math.sin(t * 4.4 + b.phase) * .38;
    b.right.rotation.z = -Math.sin(t * 4.4 + b.phase) * .38;
  });
}

export function renderWorld() {
  renderer.render(scene, camera);
}
