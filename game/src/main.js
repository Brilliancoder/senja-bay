/* SENJA BAY — main.js: input, camera, screenshot staging, touch, main loop, rain, boot */
/* ================= BLOCK 3 — input, movement, collision, missions, AI, HUD, loop ================= */
const keys = {};
let focusLeft = 100, focusOn = false, rain = null, rainSpd = null, rainOn = false, rainT = 0, rainNext = 150;
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === ' ') e.preventDefault();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  initAudio();
  if (!S.started) { if (k === 'enter') skipIntro(); return; }
  if (el('intro').classList.contains('on')) { if (k === 'enter') skipIntro(); return; }
  if (el('pause').classList.contains('on')) { if (k === 'p' || k === 'escape') togglePause(); return; }
  if (k === 'p') togglePause();
  if (k === 'f') toggleFoot();
  if (k === 'g') garageAction();
  if (k === 'e') shopToggle();
  if (k === 't') setClock(S.night ? 17.5 : 21); // skip to dusk / night
  if (k === 'r') cycleRadio();
  if (k === 'm') toggleMap();
  if (k === 'o') togglePhone();
  if (k === 'k') saveGame();
  if (k === 'u') { S.muted = !S.muted; toast(S.muted ? '🔇 Sound muted (U to unmute)' : '🔊 Sound on'); }
  if (k === 'z' || k === 'x' || k === 'c') useAbility(k);
  if (k === 'v') focusOn = true;
  if (k >= '1' && k <= '5') selectWeapon(parseInt(k) - 1);
  if (k === 'escape') {
    const ui = shopOpen || el('phone').style.display === 'block' || el('mapov').classList.contains('on');
    if (ui) { closeShop(); el('phone').style.display = 'none'; if (el('mapov').classList.contains('on')) toggleMap(); }
    else togglePause();
  }
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; if (e.key.toLowerCase() === 'v') focusOn = false; });
addEventListener('mousemove', e => {
  if (onFoot && S.started && !S.paused) wHeading -= (e.movementX || 0) * 0.0045; // mouse-look on foot
});
addEventListener('mousedown', e => {
  if (!S.started || S.paused || S.busted || S.victory) return;
  if (e.target.closest('#start') || e.target.closest('#shop') || e.target.closest('#victory') || e.target.closest('#busted') || e.target.closest('#touch') || e.target.closest('button')) return;
  initAudio();
  if (onFoot && !document.pointerLockElement && renderer) { try { renderer.domElement.requestPointerLock(); } catch (err) {} }
  shoot();
});
addEventListener('resize', () => {
  if (!renderer) return;
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
/* ---------- pause menu (P / Esc) ---------- */
function togglePause(force) {
  if (!S.started || S.busted || S.victory || shopOpen || el('mapov').classList.contains('on')) return;
  const on = force !== undefined ? force : !el('pause').classList.contains('on');
  el('pause').classList.toggle('on', on); S.paused = on;
  el('pauseKeys').style.display = 'none';
  if (on && document.pointerLockElement) document.exitPointerLock();
}
el('pResume').onclick = () => togglePause(false);
el('pSave').onclick = () => saveGame();
el('pKeys').onclick = () => { const k = el('pauseKeys'); k.innerHTML = document.querySelector('#start .keys').innerHTML; k.style.display = k.style.display === 'block' ? 'none' : 'block'; };
el('pQuit').onclick = () => { // back to the title screen; START ENGINE re-runs the current job
  togglePause(false); S.started = false; S.missionActive = false; S.wanted = 0; speed = 0;
  el('jobcard').classList.remove('on'); el('start').classList.add('on');
};
/* ---------- camera ---------- */
function updateCamera(dt) {
  if (!S.started) {
    const t = performance.now() / 1000 * 0.045;
    camera.position.set(Math.sin(t) * 95, 44, Math.cos(t) * 95);
    camera.lookAt(0, 2, -20);
    if (camera.fov !== 55) { camera.fov = 55; camera.updateProjectionMatrix(); }
    return;
  }
  const cx = onFoot ? wx : px, cz = onFoot ? wz : pz, hd = onFoot ? wHeading : heading;
  const fx = Math.sin(hd), fz = Math.cos(hd);
  const rx = Math.cos(hd), rz = -Math.sin(hd);
  const [back, side, height, look, lookY] = shotCam || (onFoot ? [3.4, 0.8, 2.1, 8, 1.8] : [5.1, 1.05, 2.45, 8, 1.8]);
  const tx = cx - fx * back + rx * side, tz = cz - fz * back + rz * side;
  const hy = height + airY; // follow the car up off a stunt ramp
  if (camera.userData.snap) { camera.position.set(tx, hy, tz); camera.userData.snap = false; }
  else camera.position.lerp(new THREE.Vector3(tx, hy, tz), 0.45);
  if (camShake > 0) {
    camera.position.x += (Math.random() - 0.5) * camShake * 0.5;
    camera.position.y += (Math.random() - 0.5) * camShake * 0.4;
    camShake = Math.max(0, camShake - dt * 1.4);
  }
  camera.lookAt(cx + fx * look, lookY + airY, cz + fz * look);
  const targetFov = onFoot ? 62 : (keys['shift'] && speed > 20 ? 70 : 62);
  if (Math.abs(camera.fov - targetFov) > 0.2) {
    camera.fov = lerp(camera.fov, targetFov, 0.08);
    camera.updateProjectionMatrix();
  }
}
/* ---------- shot setups (probe + screenshots) ---------- */
function setupShot(kind) {
  el('intro').classList.remove('on');
  el('start').classList.remove('on');
  S.started = true; S.introDone = true;
  camera.userData.snap = true;
  initAudio();
  if (kind === 'onfoot') {
    onFoot = true; walker.visible = true;
    wx = 50; wz = 30; wHeading = -Math.PI / 2;
    walker.position.set(wx, 0, wz);
    px = 50; pz = 38; heading = -Math.PI / 2;
    playerCar.position.set(px, 0, pz);
    startMission(0);
  } else if (kind === 'cover') {
    S.money = 18500; S.rep = 520; S.respect = 520;
    px = -1.6; pz = 40; heading = Math.PI; speed = 21;
    startMission(7); S.kills = 1;
  } else if (kind === 'fight') {
    S.money = 11200; S.rep = 380; S.respect = 380;
    onFoot = true; walker.visible = true; wx = 50; wz = -166; wHeading = 0; // PIER STANDOFF at the pier: Raka on the end of Marina Pier, facing the units on the sand
    px = 44; pz = -128; heading = 0;
    startMission(6); S.kills = 1;
  } else if (kind === 'pier') {
    S.money = 21300; S.rep = 540; S.respect = 540;
    px = 51.2; pz = -150; heading = Math.PI - 0.2; speed = 4; // the red Arunika GT on the pier planks, nose on the boat
    startMission(7); S.wanted = 2;
  } else if (kind === 'neon') {
    S.money = 16200; S.rep = 480; S.respect = 480;
    px = 2.2; pz = 46; heading = 0; speed = 18; // north-south road, close enough that the Pasar Malam gate and stalls fill the frame
    setClock(21.6);
    startMission(5); S.stage = 1; S.wanted = 2;
  } else if (kind === 'chase' || kind === '1') {
    S.money = 18500; S.rep = 520; S.respect = 520;
    px = 0; pz = 40; heading = 0; speed = 12;
    startMission(7);
  } else if (kind === 'ending') {
    S.money = 24000; S.rep = 550; S.respect = 550;
    showVictory();
  } else {
    startMission(0);
  }
  // sync the meshes to the shot positions (the loop only syncs them while driving)
  playerCar.position.set(px, 0, pz);
  playerCar.rotation.y = heading;
  walker.position.set(wx, 0, wz);
  walker.rotation.y = wHeading;
  if (['cover', 'fight', 'pier', 'neon'].includes(kind)) stageShot(kind);
  if (kind === 'pier') { // fleeing to the boat: 2★, the SJPD is sweeping the last place they saw you
    S.inSight = false; S.lastSeen = { x: 20, z: -70 };
    [0, 1].forEach(i => { const c = police[i]; Object.assign(c.userData, { active: true, hp: 100, tactic: 'SEARCHING' }); c.position.set(10 + i * 25, 0, -62); c.visible = true; });
  }
}
/* ---------- staged stills (?shot=cover|fight|pier|neon) ----------
   Headless SwiftShader runs ~1 fps, so AI timing never plays out: freeze the sim and pose every actor directly. */
let shotCam = null, shotFreeze = false;
function stageShot(kind) {
  shotFreeze = true; autoDisabled = true;
  const foot = kind === 'fight';
  const bx = foot ? wx : px, bz = foot ? wz : pz, h = foot ? wHeading : heading;
  const f = [Math.sin(h), Math.cos(h)], r = [-Math.cos(h), Math.sin(h)]; // forward, screen-right
  // place an object `a` m ahead and `s` m to the right of the hero, turned `rot` from the hero's heading
  const at = (o, a, s, rot, y) => { o.position.set(bx + f[0] * a + r[0] * s, y || 0, bz + f[1] * a + r[1] * s); if (rot !== undefined) o.rotation.y = h + rot; o.visible = true; return o; };
  const cop = (i, a, s, rot, tactic) => { const c = police[i]; Object.assign(c.userData, { active: true, hp: 100, tactic }); return at(c, a, s, rot); };
  const ped = (i, a, s, rot) => { const p = peds[i]; p.userData.down = 0; p.rotation.set(0, 0, 0); poseStride(p, i % 2 ? 0.8 : -0.8); return at(p, a, s, rot); };
  const pin = (txt, col) => { const d = document.createElement('div'); d.className = 'floater'; d.textContent = txt; d.style.color = col; el('floaters').appendChild(d); };
  police.forEach(c => { c.visible = false; c.userData.active = false; });
  peds.forEach(p => { p.visible = false; });
  traffic.forEach(t => { t.visible = false; });
  S.inSight = S.wanted > 0; S.heat = S.wanted * 20 + 15;
  if (kind === 'cover') {
    shotCam = [8.6, 1.3, 3.5, 15, 2.4];
    cop(0, 7, 3.6, -0.12, 'CLOSING IN');
    cop(1, 19, 2.6, Math.PI - 0.35, 'ROADBLOCK');
    cop(2, 30, -1.5, Math.PI / 2, 'FIRING'); spawnExplosion(police[2].position.x, police[2].position.z, true);
    cop(3, 55, 3.4, Math.PI, 'CLOSING IN');
    at(traffic[0], 42, 4.6, Math.PI);
    heli = heli || makeHeli(); scene.add(heli); at(heli, 34, 1.5, 0.6, 16); el('airTxt').textContent = '🚁 AIR UNIT ACTIVE';
    [[9, -4.6], [12, 9.6], [16, -4.4], [21, 9.8], [26, -4.8], [32, 9.4], [38, -4.5], [46, 9.7]].forEach(([a, s], i) => ped(i, a, s, i % 3 ? 0 : Math.PI));
    pin('UNIT DOWN · +15 REP', '#ffd94a');
  } else if (kind === 'fight') {
    shotCam = [4.6, 1.2, 2.9, 12, 1.9];
    scene.children.forEach(o => { if (o.name === 'pierTip') o.visible = false; }); // fisherman + surf strollers sit right beside the camera
    cop(0, 15, 8.5, Math.PI / 2, 'FIRING'); spawnExplosion(police[0].position.x, police[0].position.z, false);
    const c1 = cop(1, 20, -5.5, Math.PI - 0.5, 'FIRING');
    c1.userData.officer.visible = true; c1.userData.officer.rotation.y = Math.atan2(wx - c1.position.x, wz - c1.position.z) - c1.rotation.y; // the partner out of the car, aiming back at Raka
    spawnTracer(wx + f[0] * 0.9, 1.87, wz + f[1] * 0.9, c1.position.x, 1.1, c1.position.z); // from the two-handed gun's muzzle (Raka stands on the 0.4 m deck)
    at(gator, 4, -6.5, -1.3, -0.05); // in the shallows beside the pier, belly under the water
    [[9, 6, 0.2], [13, -7, 0.4], [19, 8, 0], [33, -9, 0], [36, 6, Math.PI]].forEach(([a, s, rt], i) => ped(i, a, s, rt));
    at(traffic[0], 46, -3, Math.PI / 2); // crossing the coastal road behind the units
    selectWeapon(2); pin('HIT · SJPD 34 HP', '#ff8a5a');
  } else if (kind === 'pier') {
    shotCam = [9.2, -1.2, 4.6, 24, 1.2]; playerCar.position.y = 0.4; // higher than v24: the Arunika is taller than the taxi and hid the boat
    cpMarker.position.set(boat.position.x, 0, boat.position.z); cpMarker.children[1].visible = false; // keep the gold ring, drop the beam that washes out the boat
    cpBeacon.position.set(boat.position.x, 6, boat.position.z); cpMarker.scale.setScalar(1.4); // ring around the 1.5x boat
    [[3, -6.5, 0.4], [6, 7.5, -0.6], [-2, 9.5, 2.5]].forEach(([a, s, rt], i) => ped(i, a, s, rt));
  } else if (kind === 'neon') {
    shotCam = [7.4, 1.2, 3.1, 14, 2.2];
    cop(0, 4, 3.8, -0.1, 'CLOSING IN');
    cop(1, 20, 2.4, Math.PI - 0.3, 'ROADBLOCK'); // across the gate
    at(traffic[0], 11, -3.4, Math.PI);
    [[10, -4.8], [15, 8.4], [22, -4.6], [30, 8.4], [36, -4.9]].forEach(([a, s], i) => ped(i, a, s, i % 2 ? Math.PI : 0));
    rain.visible = true; rain.material.opacity = 0.6; rain.position.set(px, 0, pz);
  }
  playerCar.position.set(px, playerCar.position.y, pz); playerCar.rotation.y = heading;
  walker.position.set(wx, foot ? 0.4 : 0, wz); walker.rotation.y = wHeading; // fight: on the pier deck
  el('jobcard').classList.remove('on'); jcLeft = 0; // the 4.5 s job card would sit on every still
  el('toasts').innerHTML = '';
}
/* ---------- touch controls ---------- */
function bindBtn(id, key, fn) {
  const b = el(id);
  if (!b) return;
  const dn = e => { e.preventDefault(); if (fn) fn(); else keys[key] = true; initAudio(); };
  const up = e => { e.preventDefault(); if (!fn) keys[key] = false; };
  b.addEventListener('touchstart', dn, { passive: false });
  b.addEventListener('touchend', up, { passive: false });
  b.addEventListener('mousedown', dn);
  b.addEventListener('mouseup', up);
}
function setupTouch() {
  if (!('ontouchstart' in window)) return;
  el('touch').classList.add('on');
  bindBtn('btnFire', null, () => shoot());
  bindBtn('btnBrake', ' ', null);
  bindBtn('btnNitro', 'shift', null);
  bindBtn('btnEnter', null, () => toggleFoot());
  bindBtn('btnMap', null, () => toggleMap());
  bindBtn('btnShop', null, () => shopToggle());
  const joy = el('joy'), knob = el('joyKnob');
  let joyId = null;
  const setJoy = e => {
    const r = joy.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2);
    const l = Math.hypot(dx, dy);
    if (l > 1) { dx /= l; dy /= l; }
    knob.style.left = (38 + dx * 34) + 'px';
    knob.style.top = (38 + dy * 34) + 'px';
    keys['w'] = dy < -0.35; keys['s'] = dy > 0.35;
    keys['arrowleft'] = dx < -0.35; keys['arrowright'] = dx > 0.35; // arrows: steer in the car, turn on foot
  };
  joy.addEventListener('touchstart', e => { joyId = e.changedTouches[0].identifier; setJoy(e.changedTouches[0]); e.preventDefault(); }, { passive: false });
  joy.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) if (t.identifier === joyId) setJoy(t);
    e.preventDefault();
  }, { passive: false });
  const endJoy = () => { joyId = null; knob.style.left = '38px'; knob.style.top = '38px'; keys['w'] = keys['s'] = keys['arrowleft'] = keys['arrowright'] = false; };
  joy.addEventListener('touchend', endJoy);
  joy.addEventListener('touchcancel', endJoy);
}
/* ---------- main loop ---------- */
let lastT = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - lastT) / 1000, 0.05);
  lastT = now;
  if (S.started && !S.paused && !S.busted && !shotFreeze) {
    if (crashCd > 0) crashCd -= dt;
    if (jcLeft > 0) { jcLeft -= dt; if (jcLeft <= 0) el('jobcard').classList.remove('on'); }
    if (shootCd > 0) shootCd -= dt;
    CREW.forEach(c => { if (c.cdLeft > 0) c.cdLeft -= dt; });
    if (eyesOutT > 0) eyesOutT -= dt;
    if (focusOn && focusLeft > 0) focusLeft = Math.max(0, focusLeft - dt * 30); else if (focusLeft < 100) focusLeft = Math.min(100, focusLeft + dt * 8);
    const effDt = (focusOn && focusLeft > 0) ? dt * 0.35 : dt;
    if (onFoot) updateWalker(effDt); else updateCar(effDt);
    updateAutopilot(effDt);
    updateTraffic(effDt);
    updatePeds(effDt);
    updatePolice(effDt);
    updateGator(effDt);
    updateExplosions(effDt);
    updateMission(dt);
    updateWanted(dt);
    updateClock(dt);
    updateContact();
    updateFlow(dt);
    rainNext -= dt;
    if (rainNext <= 0 && !rainOn) { rainOn = true; rainT = 45; if (rain) rain.visible = true; toast('🌧 Rain rolling in over Senja Bay'); rainNext = 200 + Math.random() * 120; }
    if (rainOn) { rainT -= dt; updateRain(dt); if (rainT <= 0) { rainOn = false; if (rain) rain.visible = false; toast('🌤 Rain clearing — the sun is back'); } }
    audioTick();
  }
  if (cpMarker.visible) { cpMarker.rotation.y += dt * 0.8; cpMarker.position.y = Math.sin(now / 400) * 0.3; }
  if (boat) { boat.position.y = Math.sin(now / 700) * 0.09; boat.rotation.z = Math.sin(now / 900) * 0.03; }
  seaTex.offset.y += dt * 0.012; glintTex.offset.x += dt * 0.008; glintTex.offset.y += dt * 0.02; // swells roll in, glints shimmer
  foamMats.forEach((m, i) => { m.opacity = 0.35 + 0.3 * Math.sin(now / 900 + i * 2); });
  clouds.forEach((c, i) => {
    c.position.x += dt * 0.6 * (i % 2 ? 1 : -1);
    if (c.position.x > 300) c.position.x = -300;
    if (c.position.x < -300) c.position.x = 300;
  });
  updateCamera(dt);
  updateHUD();
  drawMinimap();
  if (el('mapov').classList.contains('on')) drawBigMap();
  renderer.render(scene, camera);
}
function buildRain() {
  const N = 140;
  const pos = new Float32Array(N * 6);
  rainSpd = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const x = (Math.random() - 0.5) * 100, y = Math.random() * 35, z = (Math.random() - 0.5) * 100;
    pos.set([x, y, z, x, y + 1.3, z], i * 6);
    rainSpd[i] = 26 + Math.random() * 10;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x9fb8d8, transparent: true, opacity: 0.4 }));
  rain.visible = false; rain.frustumCulled = false;
  scene.add(rain);
}
function updateRain(dt) {
  if (!rain || !rain.visible) return;
  rain.position.set(px, 0, pz);
  const a = rain.geometry.attributes.position.array;
  for (let i = 0; i < rainSpd.length; i++) {
    let y = a[i * 6 + 1] - rainSpd[i] * dt;
    if (y < 0.2) { y = 32 + Math.random() * 6; a[i * 6] = (Math.random() - 0.5) * 100; a[i * 6 + 2] = (Math.random() - 0.5) * 100; }
    a[i * 6 + 1] = y; a[i * 6 + 4] = y + 1.3;
    a[i * 6 + 3] = a[i * 6]; a[i * 6 + 5] = a[i * 6 + 2];
  }
  rain.geometry.attributes.position.needsUpdate = true;
}
/* ---------- boot ---------- */
buildWorld(); buildRain(); buildFlow();
playerCar = arunika = makeCarMesh(PAINTS[S.paint], true);
playerCar.position.set(px, 0, pz);
scene.add(playerCar);
walker = makeWalker();
walker.visible = false;
scene.add(walker);
for (let i = 0; i < 18; i++) spawnTrafficCar();
for (let i = 0; i < 30; i++) spawnPed();
spawnPolice();
gator = makeGator();
gator.position.set(82, 0, -149); // lurks on the waterline east of Marina Pier
gator.userData.biteT = 0;
scene.add(gator);
applyTimeOfDay('golden');
loadGame();
if (PAINTS[S.paint] && paintMat) paintMat.color.setHex(PAINTS[S.paint]);
el('shop').style.display = 'none';
el('phone').style.display = 'none';
buildShop();
setupTouch();
const qp = new URLSearchParams(location.search);
shotMode = qp.get('shot') || '';
if (shotMode) setupShot(shotMode);
else playIntro();
animate();
