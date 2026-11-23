/* SENJA BAY — hud.js: garage shop, phone, map, radio, HUD panels, minimap, intro and start screen */
/* ---------- garage shop ---------- */
let shopOpen = false;
function buildShop() {
  const list = el('shopList');
  list.innerHTML = '';
  SHOP_ITEMS.forEach((it, i) => {
    const row = document.createElement('div');
    row.className = 'sitem';
    const dot = it.color ? '<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:' + it.color + ';margin-right:6px"></span>' : '🔧 ';
    row.innerHTML = '<div><div class="sn">' + dot + it.name + '</div><div class="sd">' + it.desc + '</div></div>';
    const btn = document.createElement('button');
    btn.className = 'sbuy'; btn.textContent = '$' + it.price;
    btn.onclick = () => buyItem(i);
    row.appendChild(btn);
    list.appendChild(row);
  });
}
function openShop() {
  if (d2(onFoot ? wx : px, onFoot ? wz : pz, GARAGE.x, GARAGE.z) > 22) { toast('TOO FAR — get closer to Bara\'s garage'); return; }
  buildShop();
  el('shopCash').textContent = fmt$(S.money);
  el('shop').style.display = 'block';
  shopOpen = true; S.paused = true;
  sfxClick();
}
function closeShop() {
  if (!shopOpen) return;
  el('shop').style.display = 'none';
  shopOpen = false; S.paused = false;
}
function shopToggle() {
  if (shopOpen) closeShop();
  else openShop();
}
function buyItem(i) {
  const it = SHOP_ITEMS[i];
  if (S.money < it.price) { toast('Not enough cash — ' + it.name + ' costs $' + it.price); return; }
  if (it.key === 'armour' && S.armourPlating) { toast('Armour plating already installed'); return; }
  S.money -= it.price;
  if (it.key === 'repair') { S.condition = 100; toast('🔧 Full repair — condition 100%'); }
  else if (it.key === 'armour') { S.armourPlating = true; S.armour = 100; toast('🛡 Armour plating installed — damage halved'); }
  else if (it.key === 'ammo') { WEAPONS.forEach(w => { if (w.max) w.ammo = w.max; }); toast('🔫 All weapons refilled'); }
  else if (it.key.startsWith('paint-')) {
    const pk = it.key.split('-')[1];
    S.paint = pk;
    if (paintMat) paintMat.color.setHex(PAINTS[pk]);
    toast('🎨 Fresh ' + it.name + ' — looking sharp');
  }
  el('shopCash').textContent = fmt$(S.money);
  sfxChime();
}
/* ---------- phone / map / radio ---------- */
function togglePhone() {
  const ph = el('phone');
  const show = ph.style.display !== 'block';
  ph.style.display = show ? 'block' : 'none';
  if (show) {
    const m = MISSIONS[S.mission];
    let html = '<div class="pm"><b>Dara (now):</b> ' + m.intro + '</div>';
    for (const pm of PHONE_MSGS) html += '<div class="pm"><b>' + pm.who + ':</b> ' + pm.txt + '</div>';
    el('phoneList').innerHTML = html;
    sfxClick();
  }
}
function toggleMap() {
  const mv = el('mapov');
  if (mv.classList.contains('on')) { mv.classList.remove('on'); S.paused = false; }
  else { mv.classList.add('on'); S.paused = true; drawBigMap(); sfxClick(); }
}
function cycleRadio() {
  S.radio = (S.radio + 1) % RADIO_TRACKS.length;
  const t = RADIO_TRACKS[S.radio];
  el('radio').textContent = '♪ SENJA 101.9 — ' + t.name;
  toast('📻 SENJA 101.9 — ' + t.name);
  sfxClick();
}

/* ---------- HUD ---------- */
let wSig = '';
function updateWeaponsHUD() {
  const sig = curWeapon + '|' + WEAPONS.map(w => w.ammo).join(',');
  if (sig === wSig) return;
  wSig = sig;
  el('weapons').innerHTML = WEAPONS.map((w, i) => '<div class="wslot' + (i === curWeapon ? ' sel' : '') + '"><div class="wi">' + w.icon + '</div><div>' + w.name + '</div><div class="wa">' + (w.ammo === Infinity ? '∞' : w.ammo) + '</div></div>').join('');
}
function updateHUD() {
  const m = MISSIONS[S.mission];
  el('jobN').textContent = (S.mission + 1) + '/8';
  el('jobName').textContent = m.name;
  const tt = Math.max(0, Math.ceil(S.missionTimer));
  el('jobTimer').textContent = Math.floor(tt / 60) + ':' + String(tt % 60).padStart(2, '0');
  el('jobObj').textContent = m.obj;
  if (S.offer >= 0) { el('jobName').textContent = 'FREE ROAM'; el('jobTimer').textContent = '--:--'; el('jobObj').textContent = 'Meet ' + MISSIONS[S.offer].fixer + ' for job ' + (S.offer + 1) + ' · ' + MISSIONS[S.offer].name; }
  if (race && race.side) { el('jobName').textContent = 'SIDE RACE · SUNSET SPRINT'; el('jobTimer').textContent = '0:' + String(Math.ceil(race.t)).padStart(2, '0'); el('jobObj').textContent = 'Beat the rival to Marina Pier · $' + SIDE.pay; }
  el('jobStage').textContent = (Math.min(S.stage, m.cps.length - 1) + 1) + '/' + m.cps.length;
  const js = jobStatus(m); // [stage line, next line, progress 0-1]
  el('jobStageTxt').textContent = js[0];
  el('jobbarfill').style.width = clamp(js[2] * 100, 0, 100) + '%';
  el('jobNext').textContent = js[1];
  const ws = '★'.repeat(S.wanted) + '☆'.repeat(5 - S.wanted);
  const inSight = S.inSight, arrest = S.arrestT > 0.3 ? ' · <span style="color:#ff5a5a">⛓ ARREST ' + Math.round(S.arrestT / 2.5 * 100) + '%</span>' : '';
  el('wantedStars').innerHTML = ws + ' · ' + (S.wanted === 0 ? 'CLEAR' : S.wanted + (S.wanted === 1 ? ' STAR' : ' STARS')) + (inSight ? ' · <span style="color:#ff5a5a">● IN SIGHT</span>' + arrest : (S.wanted > 0 ? ' · <span style="color:#ffb02e">○ SEARCHING</span>' : ''));
  el('cashTxt').textContent = fmt$(S.money);
  const hh = Math.floor(S.clock), wt = S.wxTxt + ' · ' + String(hh).padStart(2, '0') + ':' + String(Math.floor((S.clock - hh) * 60)).padStart(2, '0') + ' · DAY ' + S.day;
  if (el('weather').textContent !== wt) el('weather').textContent = wt;
  el('rankName').textContent = rankFor(S.rep);
  el('rankRp').textContent = S.rep + ' / 550 RP';
  el('rankbarfill').style.width = clamp(S.rep / 550 * 100, 0, 100) + '%';
  // dispatch
  const act = police.filter(c => c.userData.active);
  el('dispCount').textContent = act.length + ' UNITS';
  el('dispStars').textContent = S.wanted + '★';
  const px2 = onFoot ? wx : px, pz2 = onFoot ? wz : pz;
  let dh = '';
  if (act.length === 0) dh = '<div class="small">Streets are quiet — for now.</div>';
  else act.forEach((c, i) => {
    const dd = Math.round(d2(c.position.x, c.position.z, px2, pz2));
    const tc = /FIRING|RAMMING/.test(c.userData.tactic) ? 'fire' : c.userData.tactic === 'ROADBLOCK' ? 'road' : c.userData.tactic === 'SEARCHING' ? 'idle' : 'close';
    dh += '<div class="du"><span>' + (c.userData.callsign || ('SJ-' + (100 + c.userData.id))) + '</span><span class="tag ' + tc + '">' + c.userData.tactic + '</span><span>' + dd + 'm</span></div>';
  });
  [heli, heli2].forEach((h, k) => { if (h) dh += '<div class="du"><span>AIR-' + (k + 1) + ' · HELI</span><span class="tag close">SPOTLIGHT</span><span>' + Math.round(d2(h.position.x, h.position.z, px2, pz2)) + 'm</span></div>'; });
  el('dispList').innerHTML = dh;
  el('dispNote').textContent = S.wanted >= 4 ? 'Full response — roadblocks and air support deployed.' : S.wanted >= 1 ? 'Units converging on your position.' : 'Streets are quiet — for now.';
  // crew
  // crew chips: [Z] S ✓ — the ability text lives in the tooltip and the ability toast
  const crewSig = CREW.map(c => Math.ceil(Math.max(0, c.cdLeft))).join();
  if (crewSig !== el('crew').dataset.sig) {
    el('crew').dataset.sig = crewSig;
    el('crew').innerHTML = CREW.map(c => '<div class="cm" title="' + c.name + ' · ' + c.role + ' — ' + c.ab + '"><div class="av" style="background:' + c.color + '">' + c.letter + '</div>[' + c.key + '] <span class="' + (c.cdLeft <= 0 ? 'ready">✓' : 'cd">' + Math.ceil(c.cdLeft) + 's') + '</span></div>').join('');
  }
  updateWeaponsHUD();
  // bars
  el('hpTxt').textContent = Math.round(S.health);
  el('hpBar').style.width = clamp(S.health, 0, 100) + '%';
  el('arTxt').textContent = Math.round(S.armour);
  el('arBar').style.width = clamp(S.armour, 0, 100) + '%';
  el('spdTxt').textContent = Math.round(Math.abs(speed) * 3.6);
  el('spdTxt').parentNode.style.display = el('gearTxt').parentNode.style.display = onFoot ? 'none' : ''; // speed + gear only mean something behind the wheel
  const cn = carName(); el('carName').textContent = cn; el('carName').style.color = playerCar === arunika ? '#4be07a' : '#ffb14d';
  const tg = onFoot && !S.paused ? enterTarget() : null;
  const cash = !S.paused && !tg && cashStashes.find(c => !c.taken && d2(px2, pz2, c.x, c.z) < (onFoot ? 7 : 12));
  el('prompt').style.display = tg || cash ? 'block' : 'none';
  el('reticle').style.display = onFoot ? 'block' : 'none';
  if (tg) el('prompt').innerHTML = tg.steal ? '<b>[F]</b> STEAL · ' + tg.car.userData.model : '<b>[F]</b> ENTER · ' + (tg.car === arunika ? 'ARUNIKA GT' : tg.car.userData.model);
  else if (cash) el('prompt').innerHTML = (onFoot ? '<b>💵</b> COLLECT THE CASH · walk over it' : '<b>[F]</b> GET OUT · COLLECT THE CASH') + ' · $' + (cash.val || 150);
  el('condTxt').textContent = Math.round(S.condition) + '%';
  el('condBar').style.width = clamp(S.condition, 0, 100) + '%';
  el('condBar').style.background = S.condition > 50 ? '#4be07a' : S.condition > 25 ? '#ff9f2e' : '#ff5a5a';
  el('nitroTxt').textContent = Math.round(S.nitro);
  el('nitroBar').style.width = clamp(S.nitro, 0, 100) + '%';
  el('focusTxt').textContent = Math.round(focusLeft);
  el('focusBar').style.width = clamp(focusLeft, 0, 100) + '%';
  el('gearTxt').textContent = speed > 30 ? 'G4' : speed > 18 ? 'G3' : speed > 6 ? 'G2' : speed > 0.5 ? 'G1' : speed < -0.5 ? 'R' : 'N'; // from speed, so staged stills agree with the speedo
  const dist = districtAt(px2, pz2);
  el('district').innerHTML = dist[0] + '<div class="sub">' + dist[1] + ' · ' + (S.wanted > 0 ? 'HOT · ' + S.heat : 'NEUTRAL · ' + S.heat) + '</div>';
}
/* ---------- minimap / big map ---------- */
function drawMap(ctx, size, big) {
  const sc = size / 320;
  const X = x => (x + 160) * sc, Y = z => (z + 160) * sc;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#0c1226'; ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#1d6f8f'; ctx.fillRect(X(0), Y(-195), 120 * sc, 40 * sc);
  ctx.fillStyle = '#c9a86a'; ctx.fillRect(X(0), Y(-163), 120 * sc, 34 * sc);
  ctx.strokeStyle = '#3a3a46'; ctx.lineWidth = 10 * sc; ctx.lineCap = 'round';
  for (const rx of V_ROADS) { ctx.beginPath(); ctx.moveTo(X(rx), Y(-160)); ctx.lineTo(X(rx), Y(160)); ctx.stroke(); }
  for (const rz of H_ROADS) { ctx.beginPath(); ctx.moveTo(X(-160), Y(rz)); ctx.lineTo(X(160), Y(rz)); ctx.stroke(); }
  ctx.fillStyle = '#2a2a44';
  for (const b of BUILDINGS) ctx.fillRect(X(b.x - b.w / 2), Y(b.z - b.d / 2), b.w * sc, b.d * sc);
  ctx.fillStyle = '#8a2a26'; ctx.fillRect(X(-137), Y(111), 24 * sc, 18 * sc);
  ctx.fillStyle = '#ffd94a';
  for (const c of cashStashes) {
    if (c.taken) continue;
    ctx.beginPath(); ctx.arc(X(c.x), Y(c.z), big ? 5 : 2.5, 0, 7); ctx.fill();
  }
  if (S.missionActive && cpMarker.visible) {
    const cp = currentCheckpoint();
    if (cp) {
      ctx.fillStyle = '#ffd94a';
      ctx.beginPath(); ctx.arc(X(cp.x), Y(cp.z), big ? 8 : 4.5, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(X(cp.x), Y(cp.z), big ? 12 : 7, 0, 7); ctx.stroke();
    }
  }
  if (S.offer >= 0 && cpMarker.visible) { // next job: the fixer's initial on a ring
    const m = MISSIONS[S.offer], c = contactOf(S.offer), cr = (CREW.find(k => k.name === m.fixer) || { color: '#f5a623' }).color;
    ctx.fillStyle = cr; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(X(c[0]), Y(c[1]), big ? 11 : 6.5, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '900 ' + (big ? 13 : 8) + 'px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(m.fixer[0], X(c[0]), Y(c[1]) + 0.5);
  }
  if (S.wanted > 0 && !S.inSight && S.lastSeen) { // SJPD search area: get outside it and stay unseen to shed stars
    ctx.fillStyle = 'rgba(255,60,60,.16)'; ctx.strokeStyle = 'rgba(255,90,90,.85)'; ctx.lineWidth = big ? 2 : 1.2;
    ctx.beginPath(); ctx.arc(X(S.lastSeen.x), Y(S.lastSeen.z), SIGHT_R * sc, 0, 7); ctx.fill(); ctx.stroke();
  }
  for (const c of police) {
    if (!c.userData.active) continue;
    if (S.wanted > 0 || eyesOutT > 0) {
      ctx.fillStyle = '#ff5a5a';
      ctx.beginPath(); ctx.arc(X(c.position.x), Y(c.position.z), big ? 5 : 3, 0, 7); ctx.fill();
    }
  }
  ctx.fillStyle = '#ff9f2e';
  for (const r of RAMPS) ctx.fillRect(X(r[0]) - 2, Y(r[1]) - 2, 4, 4);
  if (race) for (const r of race.rivals) { ctx.beginPath(); ctx.arc(X(r.position.x), Y(r.position.z), big ? 5 : 3, 0, 7); ctx.fill(); }
  if (sideOpen()) { // side-race blip: a cyan R
    ctx.fillStyle = '#5fd6ff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(X(SIDE.x), Y(SIDE.z), big ? 10 : 6, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0c1226'; ctx.font = '900 ' + (big ? 12 : 8) + 'px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('R', X(SIDE.x), Y(SIDE.z) + 0.5);
  }
  ctx.fillStyle = '#d8d8e0';
  for (const t of traffic) ctx.fillRect(X(t.position.x) - 1.5, Y(t.position.z) - 1.5, 3, 3);
  if (gator) {
    ctx.fillStyle = '#4be07a';
    ctx.beginPath(); ctx.arc(X(gator.position.x), Y(gator.position.z), big ? 4 : 2.5, 0, 7); ctx.fill();
  }
  const pxx = onFoot ? wx : px, pzz = onFoot ? wz : pz, ph = onFoot ? wHeading : heading;
  ctx.fillStyle = '#ffd94a';
  ctx.beginPath();
  ctx.moveTo(X(pxx) + Math.sin(ph) * (big ? 9 : 6), Y(pzz) + Math.cos(ph) * (big ? 9 : 6));
  ctx.lineTo(X(pxx) + Math.sin(ph + 2.5) * (big ? 7 : 5), Y(pzz) + Math.cos(ph + 2.5) * (big ? 7 : 5));
  ctx.lineTo(X(pxx) + Math.sin(ph - 2.5) * (big ? 7 : 5), Y(pzz) + Math.cos(ph - 2.5) * (big ? 7 : 5));
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
}
function drawMinimap() {
  if (!mmCtx) mmCtx = el('minimap').getContext('2d');
  drawMap(mmCtx, 150, false);
}
function drawBigMap() {
  if (!bigCtx) bigCtx = el('bigmap').getContext('2d');
  drawMap(bigCtx, 560, true);
}
/* ---------- intro / start ---------- */
const INTRO_CARDS = [
  { k: 'SENJA BAY', t: 'TWO YEARS AGO — Raka walks free', b: 'The gate clangs shut behind him. No money. No crew. Just a name the whole city still whispers.' },
  { k: 'SENJA BAY', t: 'TONIGHT — one last plan, eight jobs', b: 'Fixer Dara has the jobs. Sinta drives, Bara wrenches, Nara watches. All Raka has to do is survive the night.' },
  { k: 'SENJA BAY', t: 'THE CITY IS WAITING', b: 'Eight jobs from the Marina Pier to Pasar Malam. The SJPD is watching every street. Drive fast. Stay sharp.' }
];
let introIdx = 0, introTimer = null;
function showIntroCard(i) {
  const c = INTRO_CARDS[i];
  el('icKicker').textContent = c.k;
  el('icTitle').textContent = c.t;
  el('icBody').textContent = c.b;
}
function playIntro() {
  el('intro').classList.add('on');
  el('start').classList.remove('on');
  showIntroCard(0);
  introIdx = 0;
  introTimer = setInterval(() => {
    introIdx++;
    if (introIdx >= INTRO_CARDS.length) skipIntro();
    else showIntroCard(introIdx);
  }, 3000);
}
function skipIntro() {
  if (introTimer) { clearInterval(introTimer); introTimer = null; }
  el('intro').classList.remove('on');
  el('start').classList.add('on');
  S.introDone = true;
}
function startGame() {
  initAudio();
  el('start').classList.remove('on');
  S.started = true;
  camera.userData.snap = true;
  if (PAINTS[S.paint] && paintMat) paintMat.color.setHex(PAINTS[S.paint]);
  startMission(S.mission || 0);
  toast('🚗 Welcome back to Senja Bay, Raka');
}
el('startBtn').addEventListener('click', startGame);
el('intro').addEventListener('click', skipIntro);
el('victoryBtn').addEventListener('click', () => {
  el('victory').classList.remove('on');
  S.victory = false; S.freeRoam = true; S.missionActive = false;
  toast('🌇 Free roam — Senja Bay is yours. Keep the heat on.');
});
el('bustedBtn').addEventListener('click', () => { el('busted').classList.remove('on'); });
