/* SENJA BAY — vehicles.js: car, traffic, SJPD and heli meshes; player driving, wrecks, carjack, staging autopilot */
/* ---------- vehicle + character factories ---------- */
function makeCarMesh(colorHex, isPlayer) {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhongMaterial({ color: colorHex, shininess: 110, specular: 0x999999 });
  if (isPlayer) { paintMat = paint; } // NOTE: no envMap — the cube envmap reflected the dark horizon and turned the paint black from the chase cam
  const darkTrim = new THREE.MeshLambertMaterial({ color: 0x14141c });
  const glass = new THREE.MeshPhongMaterial({ color: 0x2a3a55, transparent: true, opacity: 0.72, shininess: 200, specular: 0xdddddd });
  // lower body: wide, low slab
  const lower = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.42, 4.7), paint);
  lower.position.y = 0.52; lower.castShadow = true; g.add(lower);
  // side skirts (dark, along the lower sides)
  for (const sx of [-1.02, 1.02]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 3.4), darkTrim);
    skirt.position.set(sx, 0.38, 0); g.add(skirt);
  }
  // door shut-lines (thin dark vertical strips on the flanks)
  for (const sx of [-1.035, 1.035]) for (const dz of [-0.72, 0.55]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.04), darkTrim);
    line.position.set(sx, 0.56, dz); g.add(line);
  }
  // hood: sloped down toward the nose
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.14, 1.35), paint);
  hood.position.set(0, 0.8, 1.5); hood.rotation.x = 0.1; hood.castShadow = true; g.add(hood);
  // front nose + splitter lip
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.3, 0.5), paint);
  nose.position.set(0, 0.62, 2.2); nose.castShadow = true; g.add(nose);
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.5), darkTrim);
  splitter.position.set(0, 0.3, 2.32); g.add(splitter);
  // trunk deck (sloped slightly down to the rear)
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.14, 0.85), paint);
  trunk.position.set(0, 0.8, -1.9); trunk.rotation.x = -0.08; trunk.castShadow = true; g.add(trunk);
  // glasshouse: sloped windshield + long sloped fastback rear glass + side glass
  const shield = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.5, 0.1), glass);
  shield.position.set(0, 1.05, 0.78); shield.rotation.x = -0.5; g.add(shield);
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.62, 0.1), glass);
  rearGlass.position.set(0, 1.06, -1.28); rearGlass.rotation.x = 0.62; g.add(rearGlass);
  // painted roof panel — shorter, lower, sloped fastback, WIDER than the glass so a red frame reads from the chase cam
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1.5), paint);
  roof.position.set(0, 1.26, -0.12); roof.rotation.x = 0.07; roof.castShadow = true; g.add(roof);
  // small dark sunroof inset, narrow and pushed forward so the roof reads as one clean red panel from behind
  const sunGlass = new THREE.MeshPhongMaterial({ color: 0x0d1420, transparent: true, opacity: 0.9, shininess: 300, specular: 0xffffff });
  const roofGlass = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.5), sunGlass);
  roofGlass.position.set(0, 1.31, 0.35); roofGlass.rotation.x = 0.07; g.add(roofGlass);
  // side glass panels
  for (const sx of [-0.8, 0.8]) {
    const sg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 1.9), glass);
    sg.position.set(sx, 1.04, -0.25); g.add(sg);
  }
  // side mirrors on stalks (at the A-pillars)
  for (const mx of [-1.08, 1.08]) {
    const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.05), darkTrim);
    stalk.position.set(mx * 0.95, 1.12, 0.62); g.add(stalk);
    const mir = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.22), paint);
    mir.position.set(mx, 1.14, 0.62); g.add(mir);
  }
  // wheels: tyre + silver rim + 5 spokes, wide track so they read from behind
  const wheels = [];
  const tyreGeo = new THREE.CylinderGeometry(0.47, 0.47, 0.42, 16);
  const tyreMat = new THREE.MeshLambertMaterial({ color: 0x121212 });
  const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.44, 12);
  const rimMat = new THREE.MeshLambertMaterial({ color: 0xdde2ea });
  const caliperMat = new THREE.MeshLambertMaterial({ color: 0xd21f26 });
  const spokeGeo = new THREE.BoxGeometry(0.4, 0.3, 0.09);
  for (const [wx2, wz2] of [[-1.04, 1.5], [1.04, 1.5], [-1.04, -1.5], [1.04, -1.5]]) {
    const w = new THREE.Group();
    const tyre = new THREE.Mesh(tyreGeo, tyreMat); tyre.rotation.z = Math.PI / 2; tyre.castShadow = true; w.add(tyre);
    const rim = new THREE.Mesh(rimGeo, rimMat); rim.rotation.z = Math.PI / 2; w.add(rim);
    const cal = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.12), caliperMat);
    cal.position.set(0, 0.1, 0.2); w.add(cal);
    for (let si = 0; si < 5; si++) {
      const a = (si / 5) * Math.PI * 2;
      const sp = new THREE.Mesh(spokeGeo, rimMat);
      sp.position.set(0, 0.13 * Math.cos(a), 0.13 * Math.sin(a));
      sp.rotation.x = a; w.add(sp);
    }
    w.position.set(wx2, 0.47, wz2);
    g.add(w); wheels.push(w);
  }
  // rear + front fender flares (wide hips — the muscle stance from the chase cam)
  for (const [fx, fz] of [[-1.06, 1.5], [1.06, 1.5], [-1.06, -1.5], [1.06, -1.5]]) {
    const fl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 1.25), paint);
    fl.position.set(fx, 0.8, fz); g.add(fl);
  }
  // dark roof edge trim (defines the red roof from above)
  for (const rx of [-0.9, 0.9]) {
    const rt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 1.5), darkTrim);
    rt.position.set(rx, 1.31, -0.12); rt.rotation.x = 0.07; g.add(rt);
  }
  // diffuser fins (vertical strakes under the rear)
  for (const fx of [-0.6, 0, 0.6]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.3), darkTrim);
    fin.position.set(fx, 0.28, -2.4); g.add(fin);
  }
  // headlights: sleek angled lenses + glow sprites
  const hm = new THREE.MeshBasicMaterial({ color: 0xfff6d8 });
  if (isPlayer) headMat = hm;
  for (const hx of [-0.6, 0.6]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.15, 0.1), hm);
    hl.position.set(hx, 0.78, 2.36); hl.rotation.y = hx > 0 ? -0.18 : 0.18; g.add(hl);
    const gs = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xfff2c0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    gs.scale.set(1.8, 1.8, 1); gs.position.set(hx, 0.78, 2.5); g.add(gs);
    if (isPlayer) { if (!g.userData.headGlow) g.userData.headGlow = []; g.userData.headGlow.push(gs); }
  }
  // headlight beams (visible at night): translucent cones + ground pool
  if (isPlayer) {
    beamMat = new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.5, 7, 12, 1, true), beamMat);
    beam.rotation.x = Math.PI / 2 + 0.1; beam.position.set(0, 0.55, 5.6); g.add(beam);
    beamPoolMat = new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const pool = new THREE.Mesh(new THREE.CircleGeometry(2.6, 20), beamPoolMat);
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.06, 7.5); g.add(pool);
  }
  // REAR: full-width black light panel + bright LED bar + clusters + glow (the money view — must read against the red paint)
  const tm = new THREE.MeshBasicMaterial({ color: 0xff2a2a });
  const rearBand = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.56, 0.08), darkTrim);
  rearBand.position.set(0, 0.84, -2.37); g.add(rearBand);
  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.26, 0.1), tm);
  tailBar.position.set(0, 0.9, -2.43); g.add(tailBar);
  const tailGlow = [];
  for (const tx of [-0.62, 0.62]) {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.24, 0.1), tm);
    tl.position.set(tx, 0.9, -2.44); g.add(tl);
    const gs = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xff3a3a, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
    gs.scale.set(2.0, 2.0, 1); gs.position.set(tx, 0.9, -2.52); g.add(gs);
    tailGlow.push(gs);
  }
  // rear valance: full-width dark panel so the bottom of the car reads as diffuser, not a red wall
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.34, 0.16), darkTrim);
  diffuser.position.set(0, 0.3, -2.36); g.add(diffuser);
  const pipeMat = new THREE.MeshLambertMaterial({ color: 0xbbbbbb });
  for (const ex of [-0.72, 0.72]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.26, 10), pipeMat);
    pipe.rotation.x = Math.PI / 2; pipe.position.set(ex, 0.32, -2.44); g.add(pipe);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 10), darkTrim);
    tip.rotation.x = Math.PI / 2; tip.position.set(ex, 0.32, -2.56); g.add(tip);
  }
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.15), new THREE.MeshBasicMaterial({ color: 0xf2f2f2 }));
  plate.position.set(0, 0.58, -2.42); plate.rotation.y = Math.PI; g.add(plate);
  // spoiler: BLACK GT wing (reads against the red roof and the sky) on two slim supports + red end plates
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.06, 0.4), darkTrim);
  wing.position.set(0, 1.52, -2.05); wing.rotation.x = -0.1; wing.castShadow = true; g.add(wing);
  const wingUnder = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.03, 0.36), darkTrim);
  wingUnder.position.set(0, 1.49, -2.05); wingUnder.rotation.x = -0.1; g.add(wingUnder);
  for (const sx of [-0.72, 0.72]) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.62, 0.22), darkTrim);
    strut.position.set(sx, 1.2, -2.05); g.add(strut);
  }
  for (const sx of [-1.0, 1.0]) {
    const ep = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.42), paint);
    ep.position.set(sx, 1.52, -2.05); g.add(ep);
  }
  // rim light strip along both sides
  const rm = new THREE.MeshBasicMaterial({ color: 0xffc46a, transparent: true, opacity: 0.2 });
  for (const sx of [-1.04, 1.04]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 4.2), rm);
    strip.position.set(sx, 0.62, 0); g.add(strip);
  }
  // front grille + amber indicators + bumpers
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.22, 0.08), darkTrim);
  grille.position.set(0, 0.58, 2.36); g.add(grille);
  for (const ix of [-0.88, 0.88]) {
    const ind = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.08), new THREE.MeshBasicMaterial({ color: 0xff9f2e }));
    ind.position.set(ix, 0.78, 2.36); g.add(ind);
  }
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.26, 0.24), darkTrim);
  bumper.position.set(0, 0.32, 2.3); g.add(bumper);
  const bumperR = bumper.clone(); bumperR.position.z = -2.3; g.add(bumperR);
  g.userData.wheels = wheels;
  if (isPlayer) {
    g.userData.headMat = hm; g.userData.rimStrip = { material: rm };
    g.userData.beam = { material: beamMat }; g.userData.beamPool = { material: beamPoolMat };
    g.userData.tailGlow = tailGlow;
  }
  return g;
}
// street sedan shell shared by traffic + SJPD: 3 merged meshes (paint, glass, lamps) + 4 tyres, so 23 cars stay cheap
const CAR_MATS = [new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 70 }), new THREE.MeshPhongMaterial({ vertexColors: true, transparent: true, opacity: 0.62, shininess: 160, specular: 0xbbbbbb }), new THREE.MeshBasicMaterial({ vertexColors: true })];
const TYRE = [new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12), new THREE.MeshLambertMaterial({ color: 0x161616 })];
function sedanShell(g, paint, W, L, cop) {
  const hw = W / 2, hl = L / 2, D = 0x16161c, B = [], Gl = [], Lm = [];
  B.push([W, 0.46, L, paint, 0, 0.56, 0], [W - 0.06, 0.1, 1.15, paint, 0, 0.83, hl - 0.62], [W * 0.4, 0.04, 1.05, paint, 0, 0.9, hl - 0.62]); // body, hood, hood crease
  B.push([W - 0.06, 0.12, 0.85, paint, 0, 0.85, 0.48 - hl], [W - 0.2, 0.07, 1.45, paint, 0, 1.36, -0.2], [0.7, 0.14, 0.04, D, 0, 0.66, hl + 0.01]); // trunk, roof, grille
  for (const s of [-1, 1]) {
    for (const z of [0.62, -0.2, -1.0]) B.push([0.07, 0.46, 0.1, paint, s * (hw - 0.13), 1.1, z]); // A/B/C pillars
    B.push([0.03, 0.06, L - 0.4, D, s * (hw + 0.01), 0.5, 0], [0.03, 0.4, 0.03, D, s * (hw + 0.01), 0.58, 0.15], [0.14, 0.1, 0.18, paint, s * (hw + 0.04), 1.0, 0.62]); // rub strip, door gap, mirror
    B.push([W + 0.04, 0.18, 0.2, cop ? D : 0x2a2a30, 0, 0.36, s * (hl - 0.02)], [0.46, 0.12, 0.02, 0xf2f2f2, 0, 0.5, s * (hl + 0.04)]); // bumper, plate
    for (const z of [hl - 0.75, 0.75 - hl]) B.push([0.04, 0.28, 0.28, 0xc8ccd4, s * (hw + 0.06), 0.4, z]); // hubcaps
    Lm.push([0.42, 0.14, 0.06, 0xfff6d8, s * 0.58, 0.68, hl + 0.01], [0.42, 0.14, 0.06, 0xff2a2a, s * 0.58, 0.68, -hl - 0.01]);
    if (cop) Lm.push([0.1, 0.1, 0.06, s < 0 ? 0xff2a2a : 0x2a6aff, s * 0.3, 0.42, hl + 0.11]); // grille strobes
  }
  if (cop) B.push([W + 0.02, 0.3, 2.3, D, 0, 0.6, -0.1], [1.2, 0.06, 0.32, D, 0, 1.43, -0.2], [1.3, 0.3, 0.08, D, 0, 0.52, hl + 0.14]); // black doors, light-bar base, push bar
  Gl.push([W - 0.28, 0.22, 2.2, 0x1c2a40, 0, 1.0, -0.2], [W - 0.3, 0.24, 1.6, 0x1c2a40, 0, 1.21, -0.2]); // stepped glasshouse: raked screens front and back
  [B, Gl, Lm].forEach((p, i) => { const m = new THREE.Mesh(mergeBoxes(p), CAR_MATS[i]); m.castShadow = !i; g.add(m); });
  for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const w = new THREE.Mesh(TYRE[0], TYRE[1]); w.rotation.z = Math.PI / 2; w.position.set(x * (hw - 0.05), 0.4, z * (hl - 0.75)); g.add(w); }
}
function makeTrafficCar(colorHex) {
  const g = new THREE.Group();
  sedanShell(g, colorHex, 1.9, 4.2);
  g.userData.driver = addDriver(g, makePerson(randPerson({ lite: true })));
  g.userData.wheels = []; // drivable once stolen (updateCar spins userData.wheels)
  return g;
}
// a seated driver behind the wheel; Senja Bay keeps left, so the wheel is on the right (-x when facing +z)
function addDriver(car, p) { poseSeated(p, true); p.position.set(-0.42, -0.66, 0.05); car.add(p); return p; }
function makePoliceCar() {
  const g = new THREE.Group();
  sedanShell(g, 0xf0f0f0, 1.95, 4.4, true);
  addDriver(g, makePerson(Object.assign({ skin: pick(SKINS), lite: true }, COP)));
  // the partner steps out and aims while the unit holds position to fire (updatePolice / stageShot show it)
  const off = makeCop(true); poseAim(off); off.position.set(-1.75, 0, 0.9); off.visible = false; g.add(off); g.userData.officer = off;
  const barR = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 0.3), new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
  barR.position.set(-0.3, 1.54, -0.2); g.add(barR);
  const barB = barR.clone(); barB.material = new THREE.MeshBasicMaterial({ color: 0x2a6aff }); barB.position.x = 0.3; g.add(barB);
  g.userData.barR = barR; g.userData.barB = barB;
  return g;
}
function makeHeli() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 4.6), new THREE.MeshPhongMaterial({ color: 0x2a2a34, shininess: 60 }));
  body.castShadow = true; g.add(body);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 1.4), new THREE.MeshPhongMaterial({ color: 0x0e1626, transparent: true, opacity: 0.85 }));
  glass.position.set(0, 0.2, 1.8); g.add(glass);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 4.4), new THREE.MeshLambertMaterial({ color: 0x2a2a34 }));
  tail.position.set(0, 0.3, -4.2); g.add(tail);
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(9, 0.08, 0.5), new THREE.MeshLambertMaterial({ color: 0x181818 }));
  rotor.position.y = 1.0; g.add(rotor);
  const rotor2 = rotor.clone(); rotor2.rotation.y = Math.PI / 2; g.add(rotor2);
  const spot = new THREE.Mesh(new THREE.ConeGeometry(3.4, 21, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.10, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  spot.rotation.x = Math.PI; spot.position.y = -11; g.add(spot); // long enough to touch the road from y≈22
  g.userData.rotor = rotor; g.userData.rotor2 = rotor2;
  return g;
}
/* ---------- car + walker movement ---------- */
function updateCar(dt) {
  const fwd = (keys['w'] || keys['arrowup']) ? 1 : 0;
  const back = (keys['s'] || keys['arrowdown']) ? 1 : 0;
  const left = (keys['a'] || keys['arrowleft']) ? 1 : 0;
  const right = (keys['d'] || keys['arrowright']) ? 1 : 0;
  const brake = keys[' '] ? 1 : 0;
  const nitro = (keys['shift']) && S.nitro > 0 && speed > 4;
  const top = nitro ? 45 : 31;
  if (fwd) speed += 26 * dt * (speed < 0 ? 2.2 : 1);
  if (back) speed -= 20 * dt;
  if (brake) speed *= Math.max(0, 1 - 3.2 * dt);
  if (!fwd && !back) speed *= Math.max(0, 1 - 0.55 * dt);
  if (nitro) { speed += 14 * dt; S.nitro = Math.max(0, S.nitro - 26 * dt); }
  else S.nitro = Math.min(100, S.nitro + 7 * dt);
  speed = clamp(speed, -12, top);
  if (Math.abs(speed) > 0.4) {
    const steer = (left ? 1 : 0) - (right ? 1 : 0);
    heading += steer * 1.9 * dt * (speed >= 0 ? 1 : -1) * clamp(Math.abs(speed) / 12, 0.35, 1);
  }
  // drift detection
  const steerNow = ((keys['a'] || keys['arrowleft']) ? 1 : 0) - ((keys['d'] || keys['arrowright']) ? 1 : 0);
  if (Math.abs(speed) > 18 && steerNow !== 0 && fwd) {
    driftT += dt;
    if (driftT > 0.6) { driftChain = Math.min(5, 2 + Math.floor(driftT)); }
  } else {
    if (driftT > 0) { driftT = Math.max(0, driftT - dt * 0.4); if (driftT <= 0) driftChain = 0; }
  }
  const fx = Math.sin(heading), fz = Math.cos(heading);
  const nx = px + fx * speed * dt, nz = pz + fz * speed * dt;
  const before = { x: px, z: pz };
  const res = resolveAABB(nx, nz, 2.2);
  px = res.x; pz = res.z;
  const hitWall = (Math.abs(px - nx) > 0.01 || Math.abs(pz - nz) > 0.01);
  if (hitWall && Math.abs(speed) > 8 && crashCd <= 0) {
    speed *= 0.4; S.condition = Math.max(0, S.condition - 2); camShake = 0.55; crashCd = 1.2;
    floatText('CRASH · -2% CONDITION', '#ff8a5a');
    noiseHit(0.25, 0.3, 500);
  }
  // circle vs traffic + police
  for (const t of traffic) {
    const p = circlePush(px, pz, t.position.x, t.position.z, 4.6);
    if (p) {
      px = p.ax; pz = p.az;
      t.position.x = p.bx; t.position.z = p.bz;
      if (Math.abs(speed) > 14 && crashCd <= 0) {
        speed *= 0.55; S.condition = Math.max(0, S.condition - 3); camShake = 0.7; crashCd = 1.2;
        floatText('TRAFFIC CRASH · -3%', '#ff8a5a');
      }
    }
  }
  for (const c of police) {
    if (!c.userData.active) continue;
    const p = circlePush(px, pz, c.position.x, c.position.z, 4.6);
    if (p) {
      px = p.ax; pz = p.az;
      c.position.x = p.bx; c.position.z = p.bz;
      const ram = c.userData.tactic === 'RAMMING'; // their ram: it costs you more, but no extra star
      if ((Math.abs(speed) > 14 || ram) && crashCd <= 0) {
        speed *= 0.5; S.condition = Math.max(0, S.condition - (ram ? 6 : 4)); camShake = ram ? 1.1 : 0.8; crashCd = 1.2;
        if (ram) { heading += (Math.random() - 0.5) * 0.7; floatText('RAMMED BY SJPD · -6%', '#ff8a5a'); }
        else { floatText('RAMMED SJPD · -4%', '#ff8a5a'); addWanted(1); }
      }
    }
  }
  for (const c of parked) { const p = circlePush(px, pz, c.position.x, c.position.z, 4.6); if (p) { px += (p.ax - px) * 2; pz += (p.az - pz) * 2; } } // parked cars don't budge
  const res2 = resolveAABB(px, pz, 2.2);
  px = res2.x; pz = res2.z;
  // near-miss bonus
  if (nearMissCd > 0) nearMissCd -= dt;
  for (const t of traffic) {
    const dd = d2(px, pz, t.position.x, t.position.z);
    if (dd > 4.6 && dd < 7 && Math.abs(speed) > 24 && nearMissCd <= 0) {
      S.money += 100; nearMissCd = 1.5;
      floatText('NEAR MISS · +$100', '#4be07a'); sfxChime();
    }
  }
  // drift payout
  if (driftChain >= 2 && driftT > 1.2) {
    const gain = driftChain * 10;
    if (Math.floor(driftT * 2) !== Math.floor((driftT - dt) * 2)) {
      S.money += gain; floatText('DRIFT ×' + driftChain + ' · +$' + gain, '#ffd94a');
    }
  }
  if (S.condition <= 0) { carDestroyed(); speed = 0; }
  playerCar.position.set(px, 0, pz);
  playerCar.rotation.y = heading;
  playerCar.userData.wheels.forEach((w, i) => { w.rotation.x += speed * dt * 0.9 * (i < 2 ? 1 : 1); });
}
function carDestroyed() {
  if (S.busted || S.victory || S.destroyed) return; // once per wreck: updateCar calls this every frame at 0%
  S.destroyed = true;
  spawnExplosion(px, pz, true);
  S.condition = 0; speed = 0;
  toast('💥 ' + carName() + ' DESTROYED', 3500);
  failMission('Car destroyed');
  setTimeout(() => {
    if (playerCar !== arunika) scene.remove(playerCar); // a stolen wreck is gone for good
    respawnAtGarage(); // while S.destroyed is still set, so the wreck is not parked
    S.destroyed = false;
    toast('🔧 Bara towed you to the garage — the Arunika is good as new');
  }, 2600);
}
const carName = () => playerCar === arunika ? 'ARUNIKA GT' : 'STOLEN · ' + playerCar.userData.model;
// back in the Arunika at Bara's garage (after a wreck, an arrest or tumbang)
function respawnAtGarage() {
  if (playerCar !== arunika) driveCar(arunika);
  S.condition = 100;
  px = GARAGE.x + 4; pz = GARAGE.z - 6; heading = Math.PI / 2; speed = 0;
  if (onFoot) { onFoot = false; walker.visible = false; }
  playerCar.position.set(px, 0, pz); playerCar.rotation.y = heading; camera.userData.snap = true;
}
// make `car` the player's car; the one you were in stays parked at the kerb with its own condition
function driveCar(car) {
  if (car === playerCar) return;
  playerCar.userData.cond = S.condition;
  if (!S.destroyed) parked.push(playerCar);
  if (parked.length > 4) { const old = parked.find(c => c !== arunika); parked.splice(parked.indexOf(old), 1); scene.remove(old); }
  const i = parked.indexOf(car); if (i >= 0) parked.splice(i, 1);
  playerCar = car;
  S.condition = car.userData.cond ?? 100;
}
// on foot: what F would do right now (the HUD prompt reads this too)
function enterTarget() {
  for (const c of [playerCar, ...parked]) if (d2(wx, wz, c.position.x, c.position.z) < 6) return { car: c, steal: false }; // your own ride wins
  let best = null, bd = 7;
  for (const t of traffic) { const dd = d2(wx, wz, t.position.x, t.position.z); if (dd < bd) { bd = dd; best = t; } }
  return best && { car: best, steal: true };
}
function toggleFoot() {
  if (S.busted || S.victory) return;
  if (!onFoot) {
    onFoot = true;
    wx = px + Math.sin(heading + Math.PI / 2) * 3; wz = pz + Math.cos(heading + Math.PI / 2) * 3;
    wHeading = heading;
    walker.visible = true;
    toast('🚶 On foot — WASD move/strafe · mouse or ←→ turn · click shoot · F back in');
  } else {
    // carjack the nearest street car (within 7 m), else climb back into your own / a parked one
    const tg = enterTarget();
    if (!tg) { toast('Nothing to drive here — walk up to a car ([F] within 7 m).'); return; }
    const car = tg.car;
    if (tg.steal) {
      traffic.splice(traffic.indexOf(car), 1);
      spawnTrafficCar(); // keep the street full
      // the driver bails out and runs for the sidewalk (reuse a ped so the crowd count stays fixed)
      const d = peds.find(p => !p.userData.down && d2(p.position.x, p.position.z, wx, wz) > 40) || peds[0];
      if (car.userData.driver) car.userData.driver.visible = false;
      const u = car.userData, side =u.vertical ? Math.sign(car.position.x - u.road) || 1 : Math.sign(car.position.z - u.road) || 1;
      Object.assign(d.userData, { v: u.vertical, line: u.road + side * 6.6, fleeT: 6, down: 0 });
      d.rotation.set(0, 0, 0); d.visible = true;
      d.position.set(car.position.x + (u.vertical ? side * 1.6 : 0), 0, car.position.z + (u.vertical ? 0 : side * 1.6));
      floatText('STOLEN · ' + u.model, '#ffd94a');
      addWanted(1);
    }
    driveCar(car);
    px = car.position.x; pz = car.position.z; heading = car.rotation.y;
    toast(tg.steal ? '🚗 STOLEN · ' + car.userData.model + ' — the driver legged it' : '🚗 Back in the ' + carName());
    onFoot = false; walker.visible = false; speed = 0;
    if (document.pointerLockElement) document.exitPointerLock();
  }
  sfxClick();
}
function updateAutopilot(dt) {
  if (!shotMode) return; // staging only (?shot=): a real player who lets go must never see the car drive itself
  if (onFoot || autoDisabled || !S.missionActive || S.paused) { autoT = 0; return; }
  const anyKey = keys['w'] || keys['a'] || keys['s'] || keys['d'] || keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright'];
  if (anyKey) { autoT = 0; return; }
  autoT += dt;
  if (autoT < 1.5) return;
  const cp = currentCheckpoint();
  if (!cp) return;
  const target = Math.atan2(cp.x - px, cp.z - pz);
  let dh = target - heading;
  while (dh > Math.PI) dh -= Math.PI * 2;
  while (dh < -Math.PI) dh += Math.PI * 2;
  heading += clamp(dh, -1.4 * dt, 1.4 * dt);
  speed = Math.min(speed + 20 * dt, 20);
  // stuck detector: barely moving while trying -> reverse + turn
  if (Math.abs(speed) < 1.5 && autoT > 3) {
    speed = -8; heading += 0.9 * dt;
    if (autoT > 4.2) autoT = 1.5;
  }
}
