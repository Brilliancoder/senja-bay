/* SENJA BAY — flow.js: what makes the jobs play differently — rival racers, pier waves, stunt ramps, street cash, Dara's live lines, story texts, the free-roam side race */
let race = null, air = null, airY = 0, sideCd = 0, sideRing = null, jobF = {};
const SIDE = { x: 100, z: 100, pay: 800, cps: [{ x: 100, z: 0 }, { x: 100, z: -120 }, { x: 50, z: -120 }] }; // SUNSET SPRINT: down Sunset Row to the pier
const RAMPS = [[100, 30, Math.PI], [-100, -90, 0], [75, 120, Math.PI / 2]]; // x, z, launch heading
const WAVES = [2, 3, 3], WAVE_AT = [[50, -40], [0, -120], [100, -120], [100, -60], [0, -60], [-50, -120]];
const DARA_LINES = [ // [job start, midpoint]
  ['Wheels warm? Good. Keep it legal till the pier — no stars on day one.', 'Halfway. See the water? That\'s where the new life starts.'],
  ['They\'re ramming, not shooting. Don\'t trade paint — just get gone.', 'Stars are dropping. Find a dark corner and breathe.'],
  ['The buyer pays extra if the box arrives in one piece. Hint, Raka.', 'Market lights ahead. Slow and boring wins this one.'],
  ['Those two crews race for blood money. Make them pay you instead.', 'You\'re halfway round. Don\'t lift now.'],
  ['Every unit has your plate. Bara\'s door is open — don\'t make him wait.', 'Garage is close. Shake any tail before you pull in.'],
  ['Lights low, Raka. Night drops pay because nobody sane does them.', 'More than halfway. One more push and we sleep rich.'],
  ['They want the pier back. Plant your feet — Nara will feed you ammo.', 'They\'re thinning out. One more wave and the pier is ours.'],
  ['Last ride. Everything we built ends at that boat.', 'I can see your lights from the deck. Keep coming.']
];
const DARA_DANGER = ['You\'re bleeding, Raka — get out of their sights!', 'Too hot! Break off, lose them in the back streets!', 'Clock\'s running out — move!', 'That car won\'t take much more. Ease up or grab another.'];
const STORY_SMS = { // arrive in free roam before these jobs
  3: 'Word tonight: the SJPD has a new captain and she wants your name on her board. Every job from here runs hotter. Stay sharp.',
  6: 'I bought us a boat. Cash, no papers. Two more jobs and we sail out past the bay — you, me, the crew. Don\'t tell Sinta, she\'ll want to drive it.'
};
function buildFlow() {
  const M = c => new THREE.MeshLambertMaterial({ color: c });
  for (const [x, z, h] of RAMPS) { // orange kicker with dark chevrons; the high lip faces the launch heading
    const g = new THREE.Group(), deck = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.25, 7.2), M(0xff9f2e));
    deck.rotation.x = -0.2; deck.position.y = 0.72; g.add(deck);
    for (const s of [-2.4, -0.4, 1.6]) { const st = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.27, 0.45), M(0x16161c)); st.position.z = s; deck.add(st); }
    const lip = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.42, 0.3), M(0x2a2a30)); lip.position.set(0, 0.71, 3.5); g.add(lip);
    g.position.set(x, 0, z); g.rotation.y = h; scene.add(g);
  }
  sideRing = new THREE.Mesh(new THREE.TorusGeometry(4, 0.22, 8, 32), new THREE.MeshBasicMaterial({ color: 0x5fd6ff }));
  sideRing.rotation.x = Math.PI / 2; sideRing.position.set(SIDE.x, 0.4, SIDE.z); sideRing.visible = false; scene.add(sideRing);
}
const here = () => onFoot ? [wx, wz] : [px, pz];
const atPier = () => { const [x, z] = here(); return z < -70 && Math.abs(x - 50) < 50; };
const sideOpen = () => S.started && !S.missionActive && (S.offer >= 0 || S.freeRoam) && !race && sideCd <= 0;
function moveMarker(cp) { cpMarker.position.set(cp.x, 0, cp.z); cpBeacon.position.set(cp.x, 6, cp.z); cpMarker.visible = true; }
function storySms(txt) { PHONE_MSGS.unshift({ who: 'Dara', txt }); addPhoneMsg('Dara', txt); say('Dara', '📱 ' + txt); toast('📱 New text from Dara — O to read', 4000); sfxChime(); }
// called by startMission
function jobStart(i) {
  jobF = {}; endRace();
  if (i === 3) startRace(MISSIONS[3].cps, 2, false);
  if (i === 6) { S.wave = 0; police.forEach(c => { Object.assign(c.userData, { active: false, wave: false }); c.visible = false; }); }
}
// HUD job panel: [stage line, next line, progress 0-1]
function jobStatus(m) {
  const i = S.mission, next = m.next, base = (S.stage + 1) / m.cps.length;
  if (i === 1) return ['Hidden ' + Math.floor(S.hidden) + 's / 15s', S.wanted ? 'Shake the hunters — break line of sight' : next, S.hidden / 15];
  if (i === 6) return ['Wave ' + Math.min(3, (S.wave || 0) + 1) + '/3 · ' + police.filter(c => c.userData.active && c.userData.hp > 0).length + ' units left', atPier() ? next : 'Get to Marina Pier', (S.wave || 0) / 3];
  if (i === 3 && race && !race.side) return ['P' + racePlace() + '/' + (race.rivals.length + 1) + ' · ' + next, next, base];
  return [next, next, base];
}
/* ---------- races: job 4 (two crews) and the free-roam side race (one rival) ---------- */
function startRace(cps, n, side) {
  endRace();
  const h = Math.atan2(cps[0].x - px, cps[0].z - pz);
  race = { cps, side, wait: 3, t: 60, stage: 0, rivals: [] };
  for (let k = 0; k < n; k++) {
    const r = makeTrafficCar(k ? 0x4be07a : 0x7a5cff), s = k ? -3.6 : 3.6, p = resolveAABB(px + Math.cos(h) * s, pz - Math.sin(h) * s, 2.2);
    Object.assign(r.userData, { stage: 0, sp: 0, base: side ? 27 : 25 + k * 2, name: k ? 'TOKEK CREW' : 'KALONG CREW' });
    r.position.set(p.x, 0, p.z); r.rotation.y = h; scene.add(r); race.rivals.push(r);
  }
  toast('🏁 ' + (side ? 'SIDE RACE · SUNSET SPRINT' : 'STREET RACE') + ' — 3…', 1000);
}
function endRace() { if (race) race.rivals.forEach(r => scene.remove(r)); race = null; }
const raceStage = () => race.side ? race.stage : S.stage;
function racePlace() {
  const ps = raceStage(), cp = race.cps[Math.min(ps, race.cps.length - 1)], [x, z] = here(), me = d2(x, z, cp.x, cp.z);
  return 1 + race.rivals.filter(r => r.userData.stage > ps || r.userData.stage === ps && d2(r.position.x, r.position.z, cp.x, cp.z) < me).length;
}
function updateRace(dt) {
  if (race.wait > 0) { const w = Math.ceil(race.wait); race.wait -= dt; if (Math.ceil(race.wait) !== w) toast(race.wait > 0 ? '🏁 ' + Math.ceil(race.wait) + '…' : '🏁 GO!', 900); return; }
  race.t -= dt;
  const n = race.cps.length, ps = raceStage();
  for (const r of race.rivals) {
    const u = r.userData, cp = race.cps[u.stage];
    if (!cp) continue;
    const a = Math.atan2(cp.x - r.position.x, cp.z - r.position.z) - r.rotation.y, dh = Math.atan2(Math.sin(a), Math.cos(a));
    r.rotation.y += clamp(dh, -2.2 * dt, 2.2 * dt);
    const top = u.base * (u.stage > ps ? 0.92 : u.stage < ps ? 1.1 : 1); // a little rubber band keeps it close
    u.sp = Math.min(u.sp + 16 * dt, Math.abs(dh) > 0.6 ? 12 : top);
    const p = resolveAABB(r.position.x + Math.sin(r.rotation.y) * u.sp * dt, r.position.z + Math.cos(r.rotation.y) * u.sp * dt, 2.2);
    r.position.set(p.x, 0, p.z);
    if (!onFoot) { const q = circlePush(px, pz, p.x, p.z, 4.4); if (q) { px = q.ax; pz = q.az; r.position.set(q.bx, 0, q.bz); } }
    for (const t of traffic) { const q = circlePush(r.position.x, r.position.z, t.position.x, t.position.z, 4.4); if (q) { t.position.x = q.bx; t.position.z = q.bz; } }
    if (d2(r.position.x, r.position.z, cp.x, cp.z) < 7) u.stage++;
  }
  if (race.side) {
    const cp = race.cps[race.stage];
    if (d2(px, pz, cp.x, cp.z) < 9) {
      race.stage++; sfxChime();
      if (race.stage >= n) return sideEnd(true);
      toast('✓ Checkpoint ' + race.stage + '/' + n); moveMarker(race.cps[race.stage]);
    }
    if (race.t <= 0) return sideEnd(false, 'out of time');
  }
  const win = race.rivals.find(r => r.userData.stage >= n);
  if (win) { const who = win.userData.name; if (race.side) sideEnd(false, who + ' got there first'); else { endRace(); failMission('The ' + who + ' won the race'); } }
}
function startSide() {
  startRace(SIDE.cps, 1, true); moveMarker(SIDE.cps[0]);
  say('Sinta', 'Kalong Crew wants a run to the pier. Three checkpoints, $' + SIDE.pay + ' if you beat them. Don\'t blink.');
}
function sideEnd(won, why) {
  endRace(); sideCd = 20;
  if (won) { S.money += SIDE.pay; floatText('RACE WON · +$' + SIDE.pay, '#4be07a'); toast('🏆 SUNSET SPRINT won · +$' + SIDE.pay + ' · the blip is back in 20s'); say('Sinta', 'Ha! They\'ll be telling that one at the market all week.'); }
  else toast('🏁 Race lost — ' + why + '. The R blip is back in 20s', 4000);
  if (S.offer >= 0) { const c = contactOf(S.offer); moveMarker({ x: c[0], z: c[1] }); } else cpMarker.visible = false;
}
/* ---------- PIER STANDOFF: 3 waves; they only roll in while you hold the pier ---------- */
function updateWaves(dt) {
  const alive = police.filter(c => c.userData.wave && c.userData.active && c.userData.hp > 0).length;
  if (!atPier()) {
    if (alive && (jobF.away = (jobF.away || 0) + dt) > 15) failMission('You gave up the pier');
    else if (alive && !jobF.warned) { jobF.warned = 1; toast('⚠ Get back to the pier — hold it or lose it!', 4000); }
    return;
  }
  jobF.away = 0; jobF.warned = 0;
  if (alive) return;
  if (jobF.live) { // a wave just broke
    jobF.live = 0; jobF.gap = 4; S.wave++;
    if (S.wave >= WAVES.length) return; // updateMission completes the job
    WEAPONS.forEach(w => { if (w.max) w.ammo = w.max; }); S.armour = Math.min(100, S.armour + 25);
    toast('📦 Wave ' + S.wave + ' broken — Nara dropped ammo + armour');
  }
  if ((jobF.gap = (jobF.gap || 0) - dt) > 0) return;
  const [x0, z0] = here(), spots = WAVE_AT.filter(([x, z]) => d2(x, z, x0, z0) > 30);
  let k = 0;
  for (const c of police) {
    if (k >= WAVES[S.wave]) break;
    if (c.userData.active && c.userData.hp > 0) continue;
    const [x, z] = spots[k % spots.length];
    Object.assign(c.userData, { active: true, hp: 100, wave: true, tactic: 'CLOSING IN', tacticT: 0, speed: 0 });
    c.position.set(x, 0, z); c.visible = true; k++;
  }
  jobF.live = 1; addWanted(Math.max(0, 3 - S.wanted));
  toast('🚔 WAVE ' + (S.wave + 1) + '/3 — ' + k + ' SJPD units inbound', 3500); sfxHorn();
}
/* ---------- Dara on the line: job start, halfway, and when it gets dangerous ---------- */
function jobLines() {
  const m = MISSIONS[S.mission], L = DARA_LINES[S.mission], cp = currentCheckpoint(), [x, z] = here();
  const dd = cp ? d2(x, z, cp.x, cp.z) : 0;
  if (!jobF.s) { if (S.missionElapsed > 4) { jobF.s = 1; jobF.d0 = Math.max(dd, 1); say('Dara', L[0]); } return; }
  const prog = S.mission === 1 ? S.hidden / 15 : S.mission === 6 ? S.wave / 3 : m.cps.length > 1 ? S.stage / m.cps.length : 1 - dd / jobF.d0;
  if (!jobF.m && (prog >= 0.5 || S.missionElapsed > m.time / 2)) { jobF.m = 1; say('Dara', L[1]); }
  const why = S.health < 40 ? 0 : S.missionTimer < 20 ? 2 : S.condition < 30 && !onFoot ? 3 : S.wanted >= 4 ? 1 : -1;
  if (why >= 0 && S.missionElapsed - (jobF.dz ?? -99) > 25 && S.missionElapsed > 8) { jobF.dz = S.missionElapsed; say('Dara', DARA_DANGER[why]); }
}
/* ---------- per-frame ---------- */
function updateFlow(dt) {
  for (const c of cashStashes) if (c.taken && c.val && (c.back -= dt) <= 0) { c.taken = false; c.grp.visible = true; } // street cash comes back
  if (air) { // stunt jump: a parabola off the ramp lip, paid on landing by air time
    air.t += dt; const u = Math.min(1, air.t / air.T);
    airY = 4 * air.H * u * (1 - u); playerCar.position.y = airY; playerCar.rotation.x = (u - 0.5) * 0.35;
    if (u >= 1 || onFoot) {
      const pay = Math.round(air.T * 10) * 25;
      airY = 0; playerCar.position.y = 0; playerCar.rotation.x = 0; air = null;
      if (!onFoot) { S.money += pay; camShake = 0.6; toast('🛬 STUNT JUMP · ' + (pay / 250).toFixed(1) + 's air · +$' + pay); floatText('STUNT JUMP · +$' + pay, '#5fd6ff'); sfxChime(); }
    }
  } else if (!onFoot && speed > 16) for (const [x, z, h] of RAMPS) {
    const dx = px - x, dz = pz - z, al = dx * Math.sin(h) + dz * Math.cos(h), lat = dx * Math.cos(h) - dz * Math.sin(h);
    if (Math.abs(lat) < 3 && al > 0 && al < 3.8 && Math.cos(heading - h) > 0.7) { air = { t: 0, T: 0.6 + speed * 0.03, H: 1.2 + speed * 0.1 }; floatText('AIRBORNE!', '#5fd6ff'); break; }
  }
  if (race) { if (!race.side && !(S.missionActive && S.mission === 3)) endRace(); else updateRace(dt); }
  if (sideCd > 0) sideCd -= dt;
  sideRing.visible = sideOpen();
  if (sideRing.visible && !onFoot && d2(px, pz, SIDE.x, SIDE.z) < 8) startSide();
  if (S.missionActive && S.mission === 6) updateWaves(dt);
  if (S.missionActive) jobLines();
}
