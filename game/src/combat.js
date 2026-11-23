/* SENJA BAY — combat.js: explosions, tracers, wanted level, damage, weapons, shooting */
/* ---------- explosions ---------- */
function fireTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 2, 64, 64, 62);
  gr.addColorStop(0, 'rgba(255,255,240,1)');
  gr.addColorStop(0.25, 'rgba(255,200,80,0.95)');
  gr.addColorStop(0.6, 'rgba(255,110,20,0.7)');
  gr.addColorStop(1, 'rgba(255,60,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}
function smokeTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 60);
  gr.addColorStop(0, 'rgba(60,60,66,0.85)');
  gr.addColorStop(0.6, 'rgba(50,50,56,0.45)');
  gr.addColorStop(1, 'rgba(50,50,56,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}
let FIRE_TEX = null, SMOKE_TEX = null;
function spawnExplosion(x, z, big) {
  if (!FIRE_TEX) FIRE_TEX = fireTexture();
  if (!SMOKE_TEX) SMOKE_TEX = smokeTexture();
  const grp = new THREE.Group();
  const fbBase = big ? [5, 7, 10] : [4, 6, 8];
  const fb = [], sm = [];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: FIRE_TEX, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.position.set((Math.random() - 0.5) * 2.4, 1.2 + Math.random() * 1.6, (Math.random() - 0.5) * 2.4);
    s.scale.set(fbBase[i], fbBase[i], 1);
    grp.add(s); fb.push(s);
  }
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: FIRE_TEX, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
  core.scale.set(3.5, 3.5, 1); core.position.y = 1.6; grp.add(core);
  const ig = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xffc46a, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false }));
  ig.scale.set(5.5, 5.5, 1); ig.position.y = 1.5; grp.add(ig);
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: SMOKE_TEX, transparent: true, opacity: 0.35, depthWrite: false }));
    s.position.set((Math.random() - 0.5) * 3, 2 + Math.random() * 2, (Math.random() - 0.5) * 3);
    s.scale.set(4 + i, 4 + i, 1);
    grp.add(s); sm.push(s);
  }
  grp.position.set(x, 0, z);
  scene.add(grp);
  explosions.push({ grp, fb, sm, core, ig, fbBase, t: 0, big: !!big });
  sfxBoom();
}
function updateExplosions(dt) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i];
    ex.t += dt;
    if (ex.ig) { const isc = 5.5 * (1 + ex.t * 0.35); ex.ig.scale.set(isc, isc, 1); ex.ig.material.opacity = Math.max(0, 0.1 * (1 - ex.t / 0.8)); }
    if (ex.core) { const csc = 3.5 * (1 + ex.t * 0.3); ex.core.scale.set(csc, csc, 1); ex.core.material.opacity = Math.max(0, 0.88 * (1 - ex.t / 0.6)); }
    ex.fb.forEach((s, j) => { const sc = ex.fbBase[j] * (1 + ex.t * 0.36); s.scale.set(sc, sc, 1); s.material.opacity = Math.max(0, 0.68 * (1 - ex.t / 2.0)); });
    ex.sm.forEach((s, j) => { s.position.y += dt * 2.2; s.position.x += Math.sin(ex.t * 2 + j) * dt * 0.5; s.material.opacity = Math.max(0, 0.35 * (1 - Math.max(0, ex.t - 0.8) / 1.4)); });
    if (ex.t > 2.2) { scene.remove(ex.grp); explosions.splice(i, 1); }
  }
}
/* ---------- tracers + muzzle flash ---------- */
function spawnTracer(x1, y1, z1, x2, y2, z2) {
  const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2)]);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.95 }));
  scene.add(line);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xfff2c0, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
  flash.scale.set(1.6, 1.6, 1); flash.position.set(x1, y1, z1);
  scene.add(flash);
  if (shotFreeze) return; // staged stills keep the tracer and muzzle flash
  setTimeout(() => scene.remove(line), 90);
  setTimeout(() => scene.remove(flash), 70);
}
/* ---------- wanted ---------- */
function addWanted(n) {
  if (S.victory) return;
  S.wanted = clamp(S.wanted + n, 0, 5);
  S.lastSeen = { x: onFoot ? wx : px, z: onFoot ? wz : pz }; // a crime gives the SJPD your position
  S.wantedDecay = 0;
  if (S.wanted >= 5) toast('★★★★★ MAXIMUM HEAT — the whole SJPD is coming');
}
const SIGHT_R = 45, ARREST_R = 6;
// GTA-style heat: stars only fade while no unit can see you; standing still next to a unit gets you cuffed
function updateWanted(dt) {
  if (!S.started || S.paused) return;
  const tx = onFoot ? wx : px, tz = onFoot ? wz : pz;
  let near = 999;
  for (const c of police) if (c.userData.active && c.userData.hp > 0) near = Math.min(near, d2(c.position.x, c.position.z, tx, tz));
  S.nearestUnit = near;
  S.inSight = S.wanted > 0 && near < SIGHT_R;
  if (S.wanted > 0) {
    if (S.inSight || !S.lastSeen) { S.wantedDecay = 0; S.lastSeen = { x: tx, z: tz }; }
    else if ((S.wantedDecay = (S.wantedDecay || 0) + dt) > 9) {
      S.wantedDecay = 0; S.wanted--;
      if (S.wanted === 0) { floatText('LOST THEM', '#4be07a'); toast('🕶 LOST THEM — the SJPD called off the search'); sfxChime(); }
    }
    const slow = onFoot || Math.abs(speed) < 3;
    S.arrestT = slow && near < ARREST_R ? (S.arrestT || 0) + dt : Math.max(0, (S.arrestT || 0) - dt);
    if (S.arrestT > 2.5) { S.arrestT = 0; showBusted('SJPD boxed you in and cuffed you.'); }
  } else S.arrestT = 0;
  S.heat = S.wanted * 20 + (S.missionActive ? 15 : 0);
}
function damagePlayer(amount, src) {
  if (!S.started || S.busted || S.victory) return;
  let dmg = amount;
  if (S.armour > 0) { const absorbed = Math.min(S.armour, dmg); S.armour -= absorbed; dmg -= absorbed; }
  if (S.armourPlating) dmg *= 0.5;
  S.health -= dmg;
  camShake = Math.max(camShake, 0.25);
  if (S.health <= 0) { S.health = 0; showBusted((src || 'Gunfire') + ' took you down.', true); }
}

/* ---------- combat ---------- */
function selectWeapon(i) {
  if (i < 0 || i >= WEAPONS.length) return;
  curWeapon = i; sfxClick();
}
function shoot() {
  if (!S.started || S.paused || S.busted || S.victory) return;
  if (shootCd > 0) return;
  const w = WEAPONS[curWeapon];
  if (w.ammo !== Infinity && w.ammo <= 0) {
    toast('Out of ammo — visit Bara\'s garage (E)');
    selectWeapon(0);
    return;
  }
  shootCd = w.rate;
  if (w.ammo !== Infinity) w.ammo--;
  sfxShot();
  // muzzle flash at the player
  const ox = onFoot ? wx : px, oz = onFoot ? wz : pz;
  const oy = onFoot ? 1.3 : 1.0;
  const hd = onFoot ? wHeading : heading;
  const fx = Math.sin(hd), fz = Math.cos(hd);
  // find the best target along the aim ray (camera forward on screen centre)
  const cx = onFoot ? wx : px, cz = onFoot ? wz : pz;
  let best = null, bestD = 60;
  const targets = [];
  for (const c of police) if (c.userData.active && c.userData.hp > 0) targets.push({ kind: 'police', obj: c, x: c.position.x, z: c.position.z, r: 2.4 });
  for (const t of traffic) targets.push({ kind: 'traffic', obj: t, x: t.position.x, z: t.position.z, r: 2.4 });
  for (const p of peds) if (!p.userData.down) targets.push({ kind: 'ped', obj: p, x: p.position.x, z: p.position.z, r: 0.9 });
  for (const tg of targets) {
    const dx = tg.x - cx, dz = tg.z - cz;
    const along = dx * fx + dz * fz;
    if (along < 1 || along > 70) continue;
    const perp = Math.abs(dx * fz - dz * fx);
    if (perp < tg.r + 1.2 && along < bestD) { bestD = along; best = tg; }
  }
  const ex = cx + fx * (best ? bestD : 55), ez = cz + fz * (best ? bestD : 55);
  spawnTracer(ox + fx * 1.5, oy, oz + fz * 1.5, ex, 1.1, ez);
  if (best) {
    if (best.kind === 'police') {
      const u = best.obj.userData;
      u.hp -= w.dmg;
      if (u.hp <= 0) {
        u.hp = 0; u.respawnT = 14;
        best.obj.visible = false;
        spawnExplosion(best.obj.position.x, best.obj.position.z, false);
        S.kills++;
        S.money += 150; S.rep += 15; S.respect = Math.min(550, S.respect + 15);
        floatText('UNIT DOWN · +15 REP', '#ffd94a');
        toast('🚔 SJPD unit down · +$150 · +15 REP');
        addWanted(1);
      } else {
        floatText('HIT · SJPD ' + Math.max(0, Math.round(u.hp)) + ' HP', '#ff8a5a');
      }
    } else if (best.kind === 'traffic') {
      best.obj.userData.speed = 0;
      spawnExplosion(best.obj.position.x, best.obj.position.z, false);
      scene.remove(best.obj);
      traffic.splice(traffic.indexOf(best.obj), 1);
      spawnTrafficCar();
      floatText('CAR DESTROYED', '#ff8a5a');
      addWanted(1);
    } else knockPed(best.obj);
  }
  camShake = Math.max(camShake, 0.08);
}
