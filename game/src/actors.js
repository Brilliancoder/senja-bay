/* SENJA BAY — actors.js: pedestrians, Raka on foot, gator, collision, traffic / police / heli AI */
/* ---------- people: peds, SJPD officers, drivers, beach-goers ----------
   Each person is one merged vertex-coloured body mesh + 4 pivoting limbs (5 draw calls), so 60+ people stay cheap. */
const PERSON_MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
function mergeBoxes(parts) { // parts: [w, h, d, colour, x, y, z]
  const pos = [], nor = [], col = [], c = new THREE.Color();
  for (const [w, h, d, hex, x, y, z] of parts) {
    const g = new THREE.BoxGeometry(w, h, d).translate(x, y, z).toNonIndexed();
    c.setHex(hex);
    pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array);
    for (let i = 0; i < g.attributes.position.count; i++) col.push(c.r, c.g, c.b);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return out;
}
const SKINS = [0x8d5a3b, 0xa86f4c, 0xc98e68, 0xb57a55, 0x6e4630, 0xd9a986];
const HAIRS = [0x141010, 0x1f1712, 0x2e2018, 0x4a3020];
const PANTS = [0x2a2a3a, 0x3c64a8, 0x4a3a2a, 0x1e2e4a, 0x6a6a72, 0xd8cfb8];
const SCARVES = [0xd21f26, 0x2e6fc2, 0xe8a81c, 0x2e8b57, 0xc98a9a, 0x7a5cff, 0xf0ece4];
// o: { shirt, accent, pants, skin, hair, style: short|long|bun|hijab|cap|peci|cop, shorts, shades, long (sleeves), cop, lite }
function makePerson(o) {
  const g = new THREE.Group(), B = [];
  const skin = o.skin, hair = o.hair, sleeve = o.shirt, fore = o.long ? o.shirt : skin;
  B.push([0.4, 0.16, 0.24, o.pants, 0, 0.97, 0]); // hips
  B.push([0.46, 0.56, 0.26, o.shirt, 0, 1.32, 0]); // torso
  if (o.accent !== undefined) for (const y of [1.18, 1.32, 1.46]) B.push([0.47, 0.05, 0.27, o.accent, 0, y, 0]); // batik / striped shirt bands
  if (o.cop) {
    B.push([0.44, 0.07, 0.26, 0x141414, 0, 1.06, 0]); // duty belt
    B.push([0.07, 0.08, 0.02, 0xffd94a, 0.11, 1.44, 0.135]); // badge
    B.push([0.1, 0.03, 0.02, 0x141414, -0.11, 1.44, 0.135]); // name tag
    for (const sx of [-0.17, 0.17]) B.push([0.1, 0.03, 0.2, 0x2a2018, sx, 1.61, 0]); // epaulettes
  } else if (!o.lite) B.push([0.14, 0.07, 0.02, skin, 0, 1.565, 0.131]); // neckline
  B.push([0.12, 0.08, 0.12, skin, 0, 1.63, 0]); // neck
  B.push([0.26, 0.3, 0.26, skin, 0, 1.8, 0]); // head
  B.push([0.04, 0.08, 0.05, skin, -0.14, 1.8, 0], [0.04, 0.08, 0.05, skin, 0.14, 1.8, 0]); // ears
  if (o.shades) B.push([0.23, 0.055, 0.03, 0x0c0c10, 0, 1.83, 0.135]);
  else for (const ex of [-0.06, 0.06]) B.push([0.055, 0.045, 0.02, 0xffffff, ex, 1.83, 0.13], [0.028, 0.036, 0.02, 0x1a1410, ex, 1.83, 0.138]);
  for (const ex of [-0.06, 0.06]) B.push([0.075, 0.02, 0.02, hair, ex, 1.875, 0.132]); // brows
  B.push([0.045, 0.06, 0.045, skin, 0, 1.78, 0.145], [0.09, 0.02, 0.02, 0x7a3b2e, 0, 1.715, 0.131]); // nose, mouth
  const shortHair = () => B.push([0.28, 0.07, 0.28, hair, 0, 1.975, 0], [0.28, 0.2, 0.05, hair, 0, 1.87, -0.128], [0.03, 0.12, 0.2, hair, -0.135, 1.9, -0.03], [0.03, 0.12, 0.2, hair, 0.135, 1.9, -0.03]);
  const st = o.style;
  if (st === 'hijab') { // headscarf framing the face, draped over the shoulders
    const c = o.scarf;
    B.push([0.31, 0.08, 0.31, c, 0, 1.975, 0], [0.31, 0.38, 0.06, c, 0, 1.79, -0.15], [0.04, 0.34, 0.29, c, -0.155, 1.8, -0.01], [0.04, 0.34, 0.29, c, 0.155, 1.8, -0.01]);
    B.push([0.3, 0.05, 0.03, c, 0, 1.935, 0.142], [0.42, 0.16, 0.3, c, 0, 1.6, -0.01]);
  } else if (st === 'long') {
    shortHair(); B.push([0.3, 0.46, 0.07, hair, 0, 1.75, -0.135], [0.04, 0.34, 0.12, hair, -0.15, 1.8, 0.02], [0.04, 0.34, 0.12, hair, 0.15, 1.8, 0.02], [0.28, 0.05, 0.04, hair, 0, 1.935, 0.13]);
  } else if (st === 'bun') { shortHair(); B.push([0.14, 0.13, 0.12, hair, 0, 1.96, -0.17]); }
  else if (st === 'cap') { shortHair(); B.push([0.3, 0.1, 0.3, o.capCol, 0, 1.99, 0], [0.24, 0.025, 0.15, o.capCol, 0, 1.95, 0.2]); }
  else if (st === 'peci') { shortHair(); B.push([0.28, 0.12, 0.28, 0x141414, 0, 2.0, 0]); } // black songkok
  else if (st === 'cop') { shortHair(); B.push([0.31, 0.11, 0.31, 0x2a2018, 0, 2.0, 0], [0.29, 0.05, 0.29, 0x141414, 0, 1.95, 0], [0.26, 0.025, 0.13, 0x0c0c0c, 0, 1.94, 0.19], [0.06, 0.06, 0.02, 0xffd94a, 0, 2.0, 0.158]); }
  else shortHair();
  const body = new THREE.Mesh(mergeBoxes(B), PERSON_MAT); body.castShadow = true; g.add(body);
  // limbs pivot at the hip / shoulder so updatePeds can swing them
  const limb = (parts, x, y) => { const m = new THREE.Mesh(mergeBoxes(parts), PERSON_MAT); m.position.set(x, y, 0); m.rotation.order = 'YXZ'; m.castShadow = !o.lite; g.add(m); return m; };
  const leg = o.shorts ? [[0.18, 0.36, 0.21, o.pants, 0, -0.18, 0], [0.15, 0.52, 0.17, skin, 0, -0.6, 0]] : [[0.17, 0.86, 0.2, o.pants, 0, -0.43, 0]];
  const shoe = [0.19, 0.1, 0.29, o.shoes || 0x1a1a1a, 0, -0.87, 0.045];
  const arm = gun => [[0.14, 0.3, 0.15, sleeve, 0, -0.14, 0], [0.12, 0.3, 0.13, fore, 0, -0.43, 0], [0.11, 0.1, 0.11, skin, 0, -0.62, 0], ...(gun ? [[0.07, 0.3, 0.09, 0x141414, 0, -0.74, 0.02], [0.06, 0.08, 0.14, 0x141414, 0, -0.64, -0.08]] : [])];
  const L = [limb([...leg, shoe], 0.105, 0.92), limb([...leg, shoe], -0.105, 0.92), limb(arm(false), 0.3, 1.56), limb(arm(o.gun), -0.3, 1.56)];
  g.userData.limbs = L; // [leftLeg, rightLeg, leftArm, rightArm]
  return g;
}
// poses: two-handed aim forward, seated at a wheel, mid-stride (s = -1..1)
function poseAim(p) { const L = p.userData.limbs; L[2].rotation.set(-1.5, -0.32, 0); L[3].rotation.set(-1.5, 0.32, 0); }
function poseSeated(p, wheel) { const L = p.userData.limbs; L[0].rotation.x = L[1].rotation.x = -1.5; if (wheel) { L[2].rotation.set(-1.1, -0.2, 0); L[3].rotation.set(-1.1, 0.2, 0); } }
function poseStride(p, s) { const L = p.userData.limbs; L[0].rotation.x = s * 0.45; L[1].rotation.x = -s * 0.45; L[2].rotation.x = -s * 0.4; L[3].rotation.x = s * 0.4; }
const randPerson = extra => {
  const female = Math.random() < 0.5, r = Math.random();
  const style = female ? (r < 0.4 ? 'hijab' : r < 0.75 ? 'long' : 'bun') : (r < 0.15 ? 'peci' : r < 0.4 ? 'cap' : 'short');
  return Object.assign({ shirt: pick(PED_SHIRTS), pants: pick(PANTS), skin: pick(SKINS), hair: pick(HAIRS), style, scarf: pick(SCARVES), capCol: pick(PED_SHIRTS),
    accent: Math.random() < 0.3 ? pick(PED_SHIRTS) : undefined, shorts: !female && Math.random() < 0.3, shades: Math.random() < 0.18, long: style === 'hijab', shoes: pick([0x1a1a1a, 0xf0ece4, 0x6a3a1e]) }, extra);
};
const COP = { shirt: 0x8a6a46, pants: 0x3a2c1e, style: 'cop', cop: true, long: true, shoes: 0x0c0c0c, hair: 0x141010 }; // SJPD khaki, Polri-style
function makeCop(gun) { return makePerson(Object.assign({ skin: pick(SKINS), gun }, COP)); }
function makePed(shirt) { return makePerson(randPerson({ shirt })); }
function makeWalker() {
  // Raka: black leather jacket over a white tee, blue jeans, red cap; two-handed aim straight ahead (+z)
  const g = new THREE.Group();
  const M = c => new THREE.MeshLambertMaterial({ color: c });
  const jacket = M(0x22222a), tee = M(0xf0ece4), jeans = M(0x3c64a8), skin = M(0xc98e68), hair = M(0x1a120c),
    red = M(0xd21f26), dark = M(0x141414), white = M(0xffffff);
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  // a box stretched between two points (arms)
  const limb = (a, b, t, mat) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const m = new THREE.Mesh(new THREE.BoxGeometry(t, t, A.distanceTo(B) + t * 0.5), mat);
    m.position.copy(A).add(B).multiplyScalar(0.5); m.lookAt(B); m.castShadow = true; g.add(m);
  };
  // legs: shooter's stance, left foot forward
  box(0.2, 0.8, 0.24, jeans, -0.13, 0.52, 0.08); box(0.2, 0.8, 0.24, jeans, 0.13, 0.52, -0.08);
  box(0.22, 0.12, 0.34, dark, -0.13, 0.06, 0.13); box(0.22, 0.12, 0.34, dark, 0.13, 0.06, -0.03);
  box(0.48, 0.12, 0.28, dark, 0, 0.96, 0); // belt
  // torso: open jacket, tee showing down the front
  box(0.56, 0.64, 0.3, jacket, 0, 1.33, 0);
  box(0.2, 0.56, 0.02, tee, 0, 1.33, 0.155);
  box(0.4, 0.08, 0.32, jacket, 0, 1.64, 0); // collar
  box(0.13, 0.1, 0.13, skin, 0, 1.71, 0); // neck
  // head: face, hair, red cap with brim
  box(0.28, 0.32, 0.28, skin, 0, 1.9, 0);
  box(0.3, 0.2, 0.12, hair, 0, 1.92, -0.1); box(0.3, 0.12, 0.2, hair, 0, 1.98, 0.02); // back + sides under the cap
  box(0.05, 0.05, 0.02, white, -0.065, 1.93, 0.142); box(0.05, 0.05, 0.02, white, 0.065, 1.93, 0.142);
  box(0.03, 0.03, 0.02, dark, -0.065, 1.93, 0.152); box(0.03, 0.03, 0.02, dark, 0.065, 1.93, 0.152);
  box(0.12, 0.025, 0.02, hair, -0.065, 1.975, 0.142); box(0.12, 0.025, 0.02, hair, 0.065, 1.975, 0.142);
  box(0.05, 0.07, 0.05, skin, 0, 1.87, 0.16); // nose
  box(0.1, 0.02, 0.02, M(0x7a3b2e), 0, 1.8, 0.142); // mouth
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.17, 0.12, 12), red);
  cap.position.set(0, 2.08, 0); cap.castShadow = true; g.add(cap);
  box(0.28, 0.03, 0.18, red, 0, 2.03, 0.2); // brim
  // arms: both hands meet on the gun, held at chest height, aimed forward
  limb([-0.33, 1.58, 0], [-0.24, 1.36, 0.26], 0.15, jacket); limb([-0.24, 1.36, 0.26], [-0.04, 1.42, 0.5], 0.13, jacket);
  limb([0.33, 1.58, 0], [0.26, 1.36, 0.24], 0.15, jacket); limb([0.26, 1.36, 0.24], [0.05, 1.42, 0.5], 0.13, jacket);
  box(0.1, 0.1, 0.1, skin, -0.03, 1.4, 0.54); box(0.1, 0.1, 0.1, skin, 0.04, 1.4, 0.54);
  box(0.07, 0.16, 0.08, dark, 0, 1.36, 0.6); // grip
  box(0.08, 0.1, 0.38, dark, 0, 1.47, 0.68); // slide, muzzle at z 0.87
  return g;
}
function makeGator() { // one merged low-poly croc: long toothy snout, raised eyes, splayed legs, tapering ridged tail
  const S0 = 0x41592a, R = 0x26361a, P = 0xcdbb8a, B = [];
  B.push([1.1, 0.42, 2.4, S0, 0, 0.36, 0], [1.0, 0.08, 2.2, P, 0, 0.13, 0]); // body, pale belly
  B.push([0.78, 0.34, 0.8, S0, 0, 0.34, 1.6], [0.56, 0.2, 1.3, S0, 0, 0.3, 2.6], [0.6, 0.08, 1.9, P, 0, 0.16, 2.3]); // head, snout, jaw
  B.push([0.1, 0.06, 0.08, 0x1a1a10, -0.12, 0.42, 3.18], [0.1, 0.06, 0.08, 0x1a1a10, 0.12, 0.42, 3.18]); // nostrils
  for (let z = 1.9; z < 3.2; z += 0.22) B.push([0.62, 0.07, 0.05, 0xf4f0e0, 0, 0.22, z]); // teeth poking out both sides
  for (const s of [-1, 1]) {
    B.push([0.22, 0.18, 0.26, S0, s * 0.26, 0.55, 1.5], [0.07, 0.09, 0.14, 0xffd23a, s * 0.37, 0.58, 1.55], [0.03, 0.09, 0.05, 0x101010, s * 0.41, 0.58, 1.58]); // eye bump, eye, slit
    for (const z of [0.85, -0.85]) B.push([0.42, 0.22, 0.3, S0, s * 0.68, 0.2, z], [0.42, 0.07, 0.42, R, s * 0.92, 0.04, z + 0.08]); // splayed leg + foot
  }
  [[0.8, 0.36, -1.6], [0.6, 0.3, -2.45], [0.42, 0.24, -3.3], [0.26, 0.18, -4.1], [0.14, 0.12, -4.8]].forEach(([w, h, z]) => B.push([w, h, 0.9, S0, 0, 0.18 + h / 2, z]));
  for (let z = 1.1; z > -4.6; z -= 0.42) { // back ridges: two rows on the body, one down the tail
    const t = z > -1.2 ? 1 : 0, y = z > -1.2 ? 0.6 : 0.36 + (z + 4.8) * 0.06;
    for (const x of t ? [-0.24, 0.24] : [0]) B.push([0.12, 0.13, 0.22, R, x, y, z]);
  }
  const g = new THREE.Group(), m = new THREE.Mesh(mergeBoxes(B), PERSON_MAT);
  m.castShadow = true; g.add(m);
  return g;
}
/* ---------- collision ---------- */
function resolveAABB(x, z, r) {
  for (let pass = 0; pass < 3; pass++) {
    let hit = false;
    for (const b of SOLIDS) {
      const dx = x - b.x, dz = z - b.z;
      const ox = b.hw + r - Math.abs(dx), oz = b.hd + r - Math.abs(dz);
      if (ox > 0 && oz > 0) {
        hit = true;
        if (ox < oz) x = b.x + (dx >= 0 ? 1 : -1) * (b.hw + r);
        else z = b.z + (dz >= 0 ? 1 : -1) * (b.hd + r);
      }
    }
    if (!hit) break;
  }
  x = clamp(x, -140, 150); z = clamp(z, Math.abs(x - 50) < 2 ? -167 : -150, 150); // the pier runs on out over the water
  return { x, z };
}
// true when the straight line a→b crosses no building footprint (sampled every 1 m)
function losClear(ax, az, bx, bz) {
  const n = Math.ceil(d2(ax, az, bx, bz));
  for (let i = 1; i < n; i++) { const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n; if (SOLIDS.some(b => Math.abs(x - b.x) < b.hw && Math.abs(z - b.z) < b.hd)) return false; }
  return true;
}
function circlePush(ax, az, bx, bz, minD) {
  const dx = bx - ax, dz = bz - az;
  const d = Math.hypot(dx, dz) || 0.001;
  if (d >= minD) return null;
  const push = (minD - d) / 2;
  const nx = dx / d, nz = dz / d;
  return { ax: ax - nx * push, az: az - nz * push, bx: bx + nx * push, bz: bz + nz * push };
}
function updateWalker(dt) {
  // screen-relative movement: camera sits behind the walker
  const fwd = (keys['w'] || keys['arrowup']) ? 1 : 0;
  const back = (keys['s'] || keys['arrowdown']) ? 1 : 0;
  const left = (keys['a'] || keys['arrowleft']) ? 1 : 0;
  const right = (keys['d'] || keys['arrowright']) ? 1 : 0;
  // wHeading is the aim/camera yaw: arrows and the mouse turn it, A/D strafe without touching it
  wHeading += ((keys['arrowleft'] ? 1 : 0) - (keys['arrowright'] ? 1 : 0)) * 2.4 * dt;
  let mx = 0, mz = 0;
  const fx = Math.sin(wHeading), fz = Math.cos(wHeading);
  const rx = -Math.cos(wHeading), rz = Math.sin(wHeading); // screen-right when the camera looks along wHeading
  mx += fx * (fwd - back); mz += fz * (fwd - back);
  const strafe = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0);
  mx += rx * strafe; mz += rz * strafe;
  const ml = Math.hypot(mx, mz);
  if (ml > 0.01) {
    mx /= ml; mz /= ml;
    const sp = 7.5;
    const res = resolveAABB(wx + mx * sp * dt, wz + mz * sp * dt, 0.8);
    wx = res.x; wz = res.z;
  }
  walker.position.set(wx, 0, wz);
  walker.rotation.y = wHeading;
  // cash stashes: walk over to collect
  for (const c of cashStashes) {
    if (!c.taken && d2(wx, wz, c.x, c.z) < 2.2) {
      const v = c.val || 150;
      c.taken = true; c.grp.visible = false; c.back = 120;
      S.money += v; S.cashGot++;
      toast((c.val ? '💵 Collected the cash +$' : '💰 Cash stash +$') + v); floatText('+$' + v + ' CASH', '#ffd94a'); sfxChime();
    }
  }
}
/* ---------- traffic / peds / police / heli / gator ---------- */
const TRAFFIC_COLORS = [0x3d8bff, 0xe8a81c, 0x7a5cff, 0x4be07a, 0xd8d8e0, 0xff8a3d, 0x2e8b57, 0xc98a9a];
const pick = a => a[Math.floor(Math.random() * a.length)];
// Senja Bay keeps left (Indonesian rule of the road): the lane sits on the left of the travel direction
function laneOf(t) { return t.userData.road + (t.userData.vertical ? 2.2 : -2.2) * t.userData.dir; }
function placeOnRoad(car, vertical, road, dir, along) {
  Object.assign(car.userData, { vertical, road, dir, lastJ: '' });
  car.rotation.y = vertical ? (dir > 0 ? 0 : Math.PI) : dir * Math.PI / 2;
  if (vertical) car.position.set(laneOf(car), 0, along); else car.position.set(along, 0, laneOf(car));
}
function spawnTrafficCar() {
  const ci = Math.floor(Math.random() * TRAFFIC_COLORS.length);
  const car = makeTrafficCar(TRAFFIC_COLORS[ci]);
  car.userData.model = TRAFFIC_MODELS[ci % TRAFFIC_MODELS.length];
  const vertical = Math.random() < 0.55;
  placeOnRoad(car, vertical, pick(vertical ? V_ROADS : H_ROADS), Math.random() < 0.5 ? 1 : -1, vertical ? -140 + Math.random() * 280 : -105 + Math.random() * 250);
  car.userData.speed = 7 + Math.random() * 4.5;
  car.userData.brakeT = 0;
  scene.add(car); traffic.push(car);
  return car;
}
// at a junction: 50% straight, else turn onto the crossing road (left or right)
function trafficJunction(t) {
  const u = t.userData;
  const along = u.vertical ? t.position.z : t.position.x;
  for (const cr of (u.vertical ? H_ROADS : V_ROADS)) {
    const key = u.road + ':' + cr;
    if (Math.abs(along - cr) > 1.5 || u.lastJ === key) continue;
    u.lastJ = key;
    if (Math.random() < 0.5) return;
    const at = u.road;
    placeOnRoad(t, !u.vertical, cr, Math.random() < 0.5 ? 1 : -1, at);
    u.lastJ = cr + ':' + at;
    return;
  }
}
function updateTraffic(dt) {
  for (const t of traffic) {
    // brake if something is right ahead
    let brake = false;
    const fx = Math.sin(t.rotation.y), fz = Math.cos(t.rotation.y);
    const ax = t.position.x + fx * 8, az = t.position.z + fz * 8;
    if (d2(ax, az, px, pz) < 5 && !onFoot) brake = true;
    for (const o of traffic) {
      if (o !== t && d2(ax, az, o.position.x, o.position.z) < 5) { brake = true; break; }
    }
    for (const c of police) {
      if (c.userData.active && d2(ax, az, c.position.x, c.position.z) < 5) { brake = true; break; }
    }
    const sp = brake ? 0 : t.userData.speed;
    let nx = t.position.x + fx * sp * dt, nz = t.position.z + fz * sp * dt;
    // keep on the road: wrap around at the ends, and ease back to the lane
    // (gentle return, never a teleport — a shoved car must stay shoved for a beat)
    const lane = laneOf(t), ease = Math.min(1, dt * 0.15);
    if (t.userData.vertical) {
      if (nz > 148) nz = -146;
      if (nz < -148) nz = 146;
      nx += (lane - nx) * ease;
    } else {
      if (nx > 147) nx = -107; // west end stops short of the garage on z=120
      if (nx < -108) nx = 146;
      nz += (lane - nz) * ease;
    }
    const res = resolveAABB(nx, nz, 2.2);
    t.position.x = res.x; t.position.z = res.z;
    if (sp > 0) trafficJunction(t);
  }
  // separation between traffic cars
  for (let i = 0; i < traffic.length; i++) for (let j = i + 1; j < traffic.length; j++) {
    const a = traffic[i], b = traffic[j];
    const p = circlePush(a.position.x, a.position.z, b.position.x, b.position.z, 4.4);
    if (p) { a.position.x = p.ax; a.position.z = p.az; b.position.x = p.bx; b.position.z = p.bz; }
  }
}
const PED_SHIRTS = [0xd21f26, 0x2e6fc2, 0xe8a81c, 0x4be07a, 0x7a5cff, 0xff8a3d, 0xd8d8e0, 0x3d8bff];
// peds live on a sidewalk line (v: x fixed beside a vertical road, h: z fixed beside a horizontal one) and walk along it
function placePed(p) {
  const v = Math.random() < 0.55, side = Math.random() < 0.5 ? 6.6 : -6.6;
  const u = Object.assign(p.userData, { v, line: (v ? pick(V_ROADS) : pick(H_ROADS)) + side, down: 0, fleeT: 0 });
  u.dir = v ? (Math.random() < 0.5 ? 0 : Math.PI) : (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
  const along = v ? -140 + Math.random() * 280 : -105 + Math.random() * 250;
  if (v) p.position.set(u.line, 0, along); else p.position.set(along, 0, u.line);
  p.rotation.set(0, u.dir, 0); p.visible = true;
}
function spawnPed() {
  const p = makePed(PED_SHIRTS[Math.floor(Math.random() * PED_SHIRTS.length)]);
  p.userData.speed = 1 + Math.random() * 0.8;
  placePed(p);
  scene.add(p); peds.push(p);
  return p;
}
// shot or run over: the ped falls flat, lies there 8 s, then a new one walks in elsewhere
function knockPed(p) {
  if (p.userData.down) return;
  p.userData.down = 8; p.rotation.x = -Math.PI / 2; p.position.y = 0.15; poseStride(p, 0);
  floatText('PED DOWN · +1★', '#ff8a5a'); addWanted(1);
}
function updatePeds(dt) {
  const ox = onFoot ? wx : px, oz = onFoot ? wz : pz;
  for (const p of peds) {
    const u = p.userData;
    if (u.down) { u.down = Math.max(0, u.down - dt); if (!u.down) placePed(p); continue; }
    if (!onFoot && Math.abs(speed) > 6 && d2(p.position.x, p.position.z, px, pz) < 2.4) { knockPed(p); continue; }
    // flee along the sidewalk only from a threat: wanted, or on foot with a gun out (slot 0 is fists)
    if ((S.wanted > 0 || onFoot && curWeapon > 0) && d2(p.position.x, p.position.z, ox, oz) < 12) {
      u.dir = u.v ? (p.position.z > oz ? 0 : Math.PI) : (p.position.x > ox ? 1 : -1) * Math.PI / 2;
      u.fleeT = 1.2;
    }
    const sp = u.fleeT > 0 ? u.speed * 2.4 : u.speed;
    u.fleeT = Math.max(0, u.fleeT - dt);
    if (Math.random() < dt * 0.03) u.dir += Math.PI; // turn back now and then
    let nx = p.position.x + Math.sin(u.dir) * sp * dt, nz = p.position.z + Math.cos(u.dir) * sp * dt;
    const al = u.v ? nz : nx;
    if (al > 146 || al < (u.v ? -146 : -108)) u.dir += Math.PI;
    if (u.v) nx += (u.line - nx) * Math.min(1, dt * 2); else nz += (u.line - nz) * Math.min(1, dt * 2);
    const res = resolveAABB(nx, nz, 0.8);
    p.position.x = res.x; p.position.z = res.z;
    p.rotation.y = u.dir;
    u.ph = (u.ph || 0) + sp * dt * 4.5; // walk cycle: legs and arms swing, faster and wider when fleeing
    poseStride(p, Math.sin(u.ph) * Math.min(1.7, sp * 0.6));
    p.position.y = Math.abs(Math.cos(u.ph)) * 0.04;
  }
}
function spawnPolice() {
  for (let i = 0; i < 5; i++) {
    const c = makePoliceCar();
    const road = V_ROADS[i % V_ROADS.length];
    c.position.set(road, 0, -100 + i * 45);
    c.rotation.y = 0;
    c.userData = Object.assign(c.userData, { active: false, hp: 100, tactic: 'CLOSING IN', tacticT: 0, shootT: 0, respawnT: 0, id: i, speed: 0, callsign: ['ELANG', 'GARUDA', 'BANGAU', 'MERPATI', 'RAJAWALI'][i] });
    scene.add(c); police.push(c);
  }
}
function updatePolice(dt) {
  // 3★+ escalates: more units, spawned closer, more roadblocks; PIER STANDOFF sends its own waves (flow.js)
  const hot = S.wanted >= 3, hunt = S.missionActive && S.mission === 1, waves = S.missionActive && S.mission === 6;
  const activeN = waves ? 0 : [0, 2, 2, 4, 5, 5][S.wanted];
  police.forEach((c, i) => {
    const u = c.userData;
    if (!u.active) {
      if (i < activeN && S.started && !S.paused) {
        u.active = true; u.hp = 100;
        const road = hot || hunt ? V_ROADS.reduce((a, b) => Math.abs(b - px) < Math.abs(a - px) ? b : a) : V_ROADS[Math.floor(Math.random() * V_ROADS.length)]; // high heat: on your street
        c.position.set(road, 0, clamp(pz + (Math.random() < 0.5 ? -1 : 1) * ((hot || hunt ? 26 + i * 7 : 55 + i * 14) + Math.random() * 10), -145, 145)); // staggered, not all at 70 m
        c.visible = true;
      } else { c.visible = false; return; }
    }
    if (u.hp <= 0) {
      u.respawnT -= dt;
      if (u.respawnT <= 0) { u.active = false; c.visible = false; }
      return;
    }
    // in sight: chase you; out of sight: sweep a ring around the last place you were seen
    const seen = S.inSight || !S.lastSeen, st = performance.now() / 5000 + i * 1.3;
    const tx = seen ? (onFoot ? wx : px) : S.lastSeen.x + Math.sin(st) * 20, tz = seen ? (onFoot ? wz : pz) : S.lastSeen.z + Math.cos(st) * 20;
    const dd = d2(c.position.x, c.position.z, tx, tz);
    u.tacticT -= dt;
    if (u.tacticT <= 0) {
      u.tacticT = hunt ? 1 : 2.5 + Math.random() * 2;
      if (hunt) u.tactic = dd < 40 ? 'RAMMING' : 'CLOSING IN'; // LOSE THE HEAT: hunters ram, they don't stop to shoot
      else if (dd > 55) u.tactic = hot && Math.random() < 0.3 ? 'ROADBLOCK' : 'CLOSING IN';
      else if (dd > 26) u.tactic = Math.random() < (hot ? 0.75 : 0.5) ? 'ROADBLOCK' : 'CLOSING IN';
      else if (dd > 12) u.tactic = 'FIRING';
      else u.tactic = 'CLOSING IN';
    }
    let gx2, gz2;
    const ph = Math.atan2(tx - c.position.x, tz - c.position.z);
    if (!seen) { gx2 = tx; gz2 = tz; u.tactic = 'SEARCHING'; u.tacticT = 0; }
    else if (u.tactic === 'ROADBLOCK') {
      const fx = Math.sin(heading), fz = Math.cos(heading);
      gx2 = px + fx * 25; gz2 = pz + fz * 25;
    } else if (u.tactic === 'FIRING') {
      // hold 10-14m and shoot
      const hold = 12;
      gx2 = tx - Math.sin(ph) * hold; gz2 = tz - Math.cos(ph) * hold;
      u.shootT -= dt;
      if (u.shootT <= 0 && dd < 30 && !losClear(c.position.x, c.position.z, tx, tz)) u.shootT = 0.3; // wall in the way: hold fire, look again soon
      else if (u.shootT <= 0 && dd < 30) {
        u.shootT = 1.8;
        damagePlayer(S.armourPlating ? 2 : 4, 'SJPD fire');
        // tracer from police car to player
        spawnTracer(c.position.x, c.position.y + 1.1, c.position.z, tx, 1.2, tz);
      }
    } else if (u.tactic === 'RAMMING') { // aim a car length ahead of Raka and floor it
      gx2 = tx + Math.sin(heading) * 3; gz2 = tz + Math.cos(heading) * 3;
      if (onFoot && dd < 3 && crashCd <= 0) { crashCd = 1.2; damagePlayer(10, 'SJPD ram'); floatText('RAMMED · -10 HP', '#ff8a5a'); }
    } else {
      // CLOSING IN: intercept 8m ahead of the player
      const fx = Math.sin(heading), fz = Math.cos(heading);
      gx2 = tx + fx * 8; gz2 = tz + fz * 8;
    }
    // FIRING: brake at the hold point and the partner steps out to shoot (was: the car looped through it at 24 m/s)
    const hold = u.tactic === 'FIRING' && d2(c.position.x, c.position.z, gx2, gz2) < 5;
    const want = Math.atan2(gx2 - c.position.x, gz2 - c.position.z);
    let dh = want - c.rotation.y;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    if (!hold) c.rotation.y += clamp(dh, -2.4 * dt, 2.4 * dt);
    const spd = u.tactic === 'RAMMING' ? 29 : u.tactic === 'ROADBLOCK' ? 26 : 24;
    u.speed = hold ? Math.max(0, u.speed - 40 * dt) : Math.min(u.speed + 18 * dt, spd);
    u.officer.visible = hold && u.speed < 3;
    if (u.officer.visible) u.officer.rotation.y = ph - c.rotation.y; // face Raka
    let nx = c.position.x + Math.sin(c.rotation.y) * u.speed * dt;
    let nz = c.position.z + Math.cos(c.rotation.y) * u.speed * dt;
    const res = resolveAABB(nx, nz, 2.2);
    c.position.x = res.x; c.position.z = res.z;
    // light bar flash
    const fl = Math.sin(performance.now() / 130) > 0;
    u.barR.material.color.setHex(fl ? 0xff2a2a : 0x881111);
    u.barB.material.color.setHex(fl ? 0x2a6aff : 0x111188);
    // roadblock collision with the player
    if (u.tactic === 'ROADBLOCK' && d2(c.position.x, c.position.z, px, pz) < 4.6 && !onFoot) {
      if (Math.abs(speed) > 6 && crashCd <= 0) {
        speed *= 0.4; S.condition = Math.max(0, S.condition - 5); camShake = 0.8; crashCd = 1.2;
        floatText('ROADBLOCK HIT · -5%', '#ff8a5a');
      }
    }
  });
  // heli: comes in at 3★, keeps circling 20 s after the heat drops below 3★; a second one joins at 5★
  heliHold = hot ? 20 : S.wanted ? heliHold - dt : 0;
  if (heliHold > 0 && S.started && !S.paused) {
    if (!heli) {
      heli = makeHeli(); heli.position.set(px + 10, 34, pz - 12); scene.add(heli);
      el('airTxt').textContent = '🚁 AIR UNIT ACTIVE';
      toast('🚁 SJPD air unit is overhead');
    }
    if (S.wanted >= 5 && !heli2) { heli2 = makeHeli(); heli2.position.set(px - 20, 34, pz + 14); scene.add(heli2); toast('🚁🚁 Second air unit joins the hunt'); }
    else if (S.wanted < 5 && heli2) { scene.remove(heli2); heli2 = null; }
    const hs = S.inSight || !S.lastSeen, hx = hs ? (onFoot ? wx : px) : S.lastSeen.x, hz = hs ? (onFoot ? wz : pz) : S.lastSeen.z;
    [heli, heli2].forEach((h, k) => {
      if (!h) return;
      const f = dt * (S.wanted >= 4 ? 1.1 : 0.7);
      h.position.x = lerp(h.position.x, hx + (k ? -12 : 10), f);
      h.position.z = lerp(h.position.z, hz + (k ? 10 : -12), f);
      h.position.y = 22 + Math.sin(performance.now() / 900 + k) * 2;
      h.rotation.y += dt * 0.4;
      h.userData.rotor.rotation.y += dt * 22;
      h.userData.rotor2.rotation.y += dt * 22;
      if (S.wanted >= 4 && S.inSight && (h.userData.lockT = (h.userData.lockT ?? (k ? 2.5 : 0)) - dt) <= 0) {
        h.userData.lockT = 5;
        damagePlayer(2, 'Heli lock-on');
        toast('🚁 HELI LOCK-ON — take cover!');
      }
    });
  } else if (heli) {
    scene.remove(heli); heli = null; el('airTxt').textContent = '';
    if (heli2) { scene.remove(heli2); heli2 = null; }
  }
}
function updateGator(dt) {
  if (!gator) return;
  const dd = d2(gator.position.x, gator.position.z, wx, wz);
  if (onFoot && dd < 14 && S.started && !S.paused) {
    const a = Math.atan2(wx - gator.position.x, wz - gator.position.z);
    gator.rotation.y = a;
    const nx = gator.position.x + Math.sin(a) * 3.2 * dt;
    const nz = gator.position.z + Math.cos(a) * 3.2 * dt;
    const res = resolveAABB(nx, nz, 1.2);
    gator.position.x = res.x; gator.position.z = res.z;
    gator.position.y = Math.abs(Math.sin(performance.now() / 300)) * 0.08;
    if (dd < 1.8 && (gator.userData.biteT || 0) <= 0) {
      gator.userData.biteT = 3;
      damagePlayer(5, 'Gator bite');
      floatText('🐊 GATOR BITE · -5 HP', '#ff8a5a');
    }
  }
  if (gator.userData.biteT) gator.userData.biteT -= dt;
}
