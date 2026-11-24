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
// M: the pause menu on its MAP tab; M again (on the map) closes it
function toggleMap() {
  if (el('pause').classList.contains('on')) { if (curTab === 'map') togglePause(false); else pauseTab('map'); }
  else togglePause(true, 'map');
}
function cycleRadio() {
  if (!SET.radio) { toast('📻 Radio is off — turn it on in SETTINGS'); return; }
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
  // crew chips: [F] S ✓ — the ability text lives in the tooltip and the ability toast
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
  el('reticle').style.display = onFoot ? 'block' : 'none';
  // context prompt: what E does here (always shown behind the wheel), plus B at Bara's garage
  let pr = S.paused ? '' : tg ? (tg.steal ? '<b>[E]</b> STEAL · ' + tg.car.userData.model : '<b>[E]</b> ENTER · ' + (tg.car === arunika ? 'ARUNIKA GT' : tg.car.userData.model))
    : cash ? (onFoot ? '<b>💵</b> COLLECT THE CASH · walk over it' : '<b>[E]</b> GET OUT · COLLECT THE CASH') + ' · $' + (cash.val || 150)
    : onFoot ? '' : '<b>[E]</b> EXIT VEHICLE';
  if (!S.paused && d2(px2, pz2, GARAGE.x, GARAGE.z) <= 22) pr += (pr ? ' · ' : '') + (S.mission === 4 && S.missionActive ? '<b>[B]</b> SWAP PLATES' : '<b>[B]</b> GARAGE SHOP');
  if (onFoot && !S.drove && !S.paused) pr += '<div style="font-size:11px;font-weight:600;opacity:.85;margin-top:3px">WASD move · SHIFT sprint · MOUSE turn · CLICK shoot · <b>[E]</b> enter car</div>';
  el('prompt').style.display = pr ? 'block' : 'none';
  if (el('prompt').innerHTML !== pr) el('prompt').innerHTML = pr;
  el('condTxt').textContent = Math.round(S.condition) + '%';
  el('condBar').style.width = clamp(S.condition, 0, 100) + '%';
  el('condBar').style.background = S.condition > 50 ? '#4be07a' : S.condition > 25 ? '#ff9f2e' : '#ff5a5a';
  el('nitroTxt').textContent = Math.round(S.nitro);
  el('nitroBar').style.width = clamp(S.nitro, 0, 100) + '%';
  el('focusTxt').textContent = Math.round(focusLeft);
  el('focusBar').style.width = clamp(focusLeft, 0, 100) + '%';
  el('gearTxt').textContent = speed > 30 ? 'G4' : speed > 18 ? 'G3' : speed > 6 ? 'G2' : speed > 0.5 ? 'G1' : speed < -0.5 ? 'R' : 'N'; // from speed, so staged stills agree with the speedo
  const dist = districtAt(px2, pz2);
  if (S.started && !shotMode && !S.seen.includes(dist[0])) S.seen.push(dist[0]);
  if (S.waypoint && S.started && !S.paused && d2(px2, pz2, S.waypoint.x, S.waypoint.z) < 10) { S.waypoint = null; toast('📍 Waypoint reached'); sfxChime(); }
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
  if (big) {
    ctx.font = '800 11px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [n, x, z] of MAP_LABELS) { ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,8,20,.9)'; ctx.strokeText(n, X(x), Y(z)); ctx.fillStyle = '#e8eaf2'; ctx.fillText(n, X(x), Y(z)); }
    const done = jobsDone(); // every story job: grey = done, gold ring = still to come (the live one is the gold dot above)
    MISSIONS.forEach((m, i) => {
      if (S.missionActive && i === S.mission) return;
      const c = m.cps[m.cps.length - 1], x = X(c.x) + (i % 2 ? 7 : -7), y = Math.max(9, Y(c.z) - 9); // nudge: several jobs end at the pier (job 8 sits on the map's top edge)
      ctx.fillStyle = i < done ? '#4a4e66' : '#141428'; ctx.strokeStyle = i < done ? '#9aa0b5' : '#f5c542'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, 7.5, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = i < done ? '#cfd2e0' : '#ffd94a'; ctx.font = '900 10px Arial'; ctx.fillText(i + 1, x, y + 0.5);
    });
  }
  if (S.waypoint) { // player-set waypoint: magenta diamond, dashed route line on the big map
    const wpx = X(S.waypoint.x), wpy = Y(S.waypoint.z), r = big ? 8 : 5;
    if (big) { ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,90,220,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(pxx), Y(pzz)); ctx.lineTo(wpx, wpy); ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle = '#ff5adc'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(wpx, wpy - r); ctx.lineTo(wpx + r, wpy); ctx.lineTo(wpx, wpy + r); ctx.lineTo(wpx - r, wpy); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
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
  drawMap(bigCtx, el('bigmap').width, true);
}
const MAP_LABELS = [['MARINA PIER', 50, -146], ['OCEAN BOULEVARD', -70, -128], ['DOWNTOWN GRID', -25, -32], ['PASAR MALAM', 0, 100], ['SUNSET ROW', 128, 12], ['OLD DOCKS', -128, -20], ["BARA'S GARAGE", -100, 148]];
// click the pause map: set a waypoint there; click it again to clear it
function setWaypoint(e) {
  const c = el('bigmap'), x = e.offsetX / c.clientWidth * 320 - 160, z = e.offsetY / c.clientHeight * 320 - 160;
  if (S.waypoint && d2(x, z, S.waypoint.x, S.waypoint.z) < 10) { S.waypoint = null; toast('📍 Waypoint cleared'); }
  else { S.waypoint = { x, z }; toast('📍 Waypoint set — ' + districtAt(x, z)[0]); }
  drawBigMap(); sfxClick();
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
  S.introDone = true;
  showTitle();
}
function startGame() { // CONTINUE / LOAD / NEW GAME all land here once S holds the run to play
  initAudio();
  el('start').classList.remove('on');
  S.started = true; S.paused = false; S.victory = false; S.wanted = 0;
  camera.userData.snap = true; seenMoney = S.money;
  if (PAINTS[S.paint] && paintMat) paintMat.color.setHex(PAINTS[S.paint]);
  if (jobsDone() >= 8) { S.freeRoam = true; S.missionActive = false; S.offer = -1; cpMarker.visible = false; toast('🌇 Free roam — all eight jobs done. Senja Bay is yours'); }
  else { startMission(S.mission || 0); toast('🚗 Welcome back to Senja Bay, Raka · slot ' + S.slot); }
}
/* ---------- title menu: CONTINUE · NEW GAME · LOAD · SETTINGS + three save slots ---------- */
const KEYS = [['WASD / ARROWS', 'drive · on foot: move + strafe'], ['MOUSE', 'look / turn on foot'], ['SHIFT', 'nitro · sprint on foot'], ['SPACE', 'handbrake'], ['E', 'enter / exit / steal a car'], ['CLICK', 'fire'], ['1–5', 'weapons'], ['F / G / H', 'crew: Sinta · Bara · Nara'],
  ['B', 'Bara\'s garage: shop / swap plates'], ['C', 'horn'], ['V', 'hold to slow time'], ['R', 'radio station'], ['T', 'skip to dusk / night'], ['M', 'city map'], ['O', 'phone'], ['K', 'save game'], ['P / ESC', 'pause menu'], ['U', 'mute']];
const playTime = s => { const m = Math.floor((s || 0) / 60); return Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm'; };
function slotHTML(n) {
  const d = readSlot(n);
  if (!d) return '<div class="sn">SLOT ' + n + '</div>EMPTY SLOT';
  const j = Math.max(d.mission || 0, (d.ratings || []).filter(Boolean).length);
  return '<div class="sn">SLOT ' + n + '<span>' + fmt$(d.money) + '</span></div>' + (d.district || 'Senja Bay') + ' · RANK ' + rankFor(d.rep || 0) +
    '<br>' + (d.freeRoam || j >= 8 ? 'FREE ROAM · all 8 jobs done' : 'JOB ' + (j + 1) + '/8 · ' + MISSIONS[j].name) + '<br><span class="dim">⏱ ' + playTime(d.playT) + ' played</span>';
}
let tmMode = '', tmArm = 0; // tmMode: '' | 'load' (pick a slot) | 'new' (all full: pick one to overwrite)
function showTitle() { el('start').classList.add('on'); tmMode = ''; tmArm = 0; renderTitle(); }
function renderTitle(hint) {
  const last = latestSlot(), d = last && readSlot(last);
  el('tmCont').disabled = !last;
  el('tmContSub').textContent = d ? 'slot ' + last + ' · ' + (d.district || 'Senja Bay') + ' · ' + fmt$(d.money) : 'no save yet';
  el('tmSlots').innerHTML = [1, 2, 3].map(n => '<div class="slot' + (readSlot(n) ? '' : ' empty') + '" data-slot="' + n + '">' + slotHTML(n) + '</div>').join('');
  el('tmR').classList.toggle('pick', !!tmMode);
  el('tmLoad').classList.toggle('on', tmMode === 'load');
  el('tmHint').textContent = hint || (tmMode === 'load' ? 'Pick a save slot on the right →' : tmMode === 'new' ? 'All three slots are in use — click one to overwrite it →' : '');
}
function beginNew(n) {
  newGame(n); onFoot = false; walker.visible = false; px = 0; pz = 40; heading = 0; speed = 0; // job 1 opens on Ocean Boulevard
  playerCar.position.set(px, 0, pz); playerCar.rotation.y = heading;
  startGame();
}
el('tmCont').onclick = () => { if (loadGame()) startGame(); };
el('startBtn').onclick = () => { const free = [1, 2, 3].find(n => !readSlot(n)); if (free) beginNew(free); else { tmMode = 'new'; tmArm = 0; renderTitle(); } };
el('tmLoad').onclick = () => { tmMode = tmMode === 'load' ? '' : 'load'; tmArm = 0; renderTitle(); };
el('tmSet').onclick = () => { const on = el('tmSettings').style.display !== 'block'; el('tmSettings').style.display = on ? 'block' : 'none'; el('tmIntro').style.display = on ? 'none' : ''; el('tmSet').classList.toggle('on', on); renderSettings(); };
el('tmSlots').onclick = e => {
  const s = e.target.closest('.slot'); if (!s) return;
  const n = +s.dataset.slot;
  if (!readSlot(n)) return tmMode === 'load' ? renderTitle('Slot ' + n + ' is empty — NEW GAME starts a story there') : beginNew(n);
  if (tmMode !== 'new') { loadGame(n); return startGame(); }
  if (tmArm === n) return beginNew(n);
  tmArm = n; renderTitle('Slot ' + n + ' will be overwritten — click it again to confirm');
};
el('intro').addEventListener('click', skipIntro);
/* ---------- settings (title menu): saved in their own localStorage key ---------- */
const SET = Object.assign({ radio: true, shadows: true, radar: true }, (() => { try { return JSON.parse(localStorage.getItem('senja-bay-settings')) || {}; } catch (e) { return {}; } })());
function applySettings() {
  el('radio').style.display = SET.radio ? '' : 'none';
  if (sun) sun.castShadow = SET.shadows;
  el('minimap').style.display = SET.radar ? '' : 'none';
}
function renderSettings() {
  const row = (k, label) => '<div class="row"><span>' + label + '</span><button class="tgl' + (SET[k] ? ' on' : '') + '" data-set="' + k + '">' + (SET[k] ? 'ON' : 'OFF') + '</button></div>';
  el('tmSettings').innerHTML = row('radio', '📻 Radio · SENJA 101.9 ticker, R changes station') + row('shadows', '🌗 Shadows · off = smoother on slow PCs') + row('radar', '🧭 Radar · the minimap') +
    '<div class="row" style="display:block"><b class="gold">⌨ CONTROLS</b><div style="font-size:12px;line-height:1.6;margin-top:3px;color:#cfd2e0">' + KEYS.map(([k, v]) => '<b>' + k + '</b> ' + v).join(' · ') + '</div></div>';
}
el('tmSettings').onclick = e => {
  const k = e.target.dataset.set; if (!k) return;
  SET[k] = !SET[k];
  try { localStorage.setItem('senja-bay-settings', JSON.stringify(SET)); } catch (er) {}
  applySettings(); renderSettings(); sfxClick();
};
/* ---------- pause menu tabs: MAP · STATS · CREW · CONTROLS · SAVE ---------- */
let curTab = 'map';
const RANK_AT = [110, 220, 330, 430, 520]; // rankFor() thresholds
function pauseTab(t) {
  curTab = t;
  document.querySelectorAll('#ptabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  document.querySelectorAll('.ptab').forEach(p => p.classList.toggle('on', p.id === 'tab-' + t));
  const tab = el('tab-' + t), done = Math.min(8, jobsDone()), here = [onFoot ? wx : px, onFoot ? wz : pz];
  if (t === 'map') {
    drawBigMap();
    const dot = (c, txt) => '<div><i style="background:' + c + '"></i>' + txt + '</div>', wp = S.waypoint;
    el('mapLegend').innerHTML = '<div class="pcol"><h3>SENJA BAY · CITY MAP</h3><div class="srow"><span>You are in</span><b class="gold">' + districtAt(here[0], here[1])[0] + '</b></div>' +
      '<div class="srow"><span>Waypoint</span><b style="color:#ff5adc">' + (wp ? districtAt(wp.x, wp.z)[0] + ' · ' + Math.round(d2(here[0], here[1], wp.x, wp.z)) + ' m' : 'none') + '</b></div><div style="margin:8px 0" class="gold">🖱 Click the map to set a waypoint · click it again to clear</div>' +
      dot('#ffd94a', 'You (arrow) · live job checkpoint (ringed dot)') + dot('#f5c542', 'Story jobs 1–8 (numbered · grey = done)') + dot('#3d8bff', 'Fixer to meet for the next job (initial)') + dot('#ff5adc', 'Your waypoint') +
      dot('#ff5a5a', 'SJPD units (while wanted or Nara\'s eyes are out)') + dot('#5fd6ff', 'Side race (R)') + dot('#ff9f2e', 'Stunt ramps · rival racers') + dot('#4be07a', 'The gator') + dot('#8a2a26', 'Bara\'s garage (B)') + '</div>';
  }
  if (t === 'stats') {
    const crew = CREW.filter(c => done > c.job).length;
    const list = [['Story missions', done, 8], ['Street races won', S.races, 5], ['Cash collected', S.cashGot, 25], ['Districts visited', S.seen.length, 7], ['Crew recruited', crew, 3]];
    const pct = Math.round(list.reduce((a, [, v, n]) => a + Math.min(1, v / n), 0) / list.length * 100), next = RANK_AT.find(r => r > S.rep);
    const row = (a, b) => '<div class="srow"><span>' + a + '</span><b>' + b + '</b></div>';
    tab.innerHTML = '<div class="pcol"><h3>COMPLETION</h3><div class="pct">' + pct + '%</div><div class="dim" style="margin-bottom:8px">of Senja Bay done</div>' +
      list.map(([n, v, max]) => row(n, Math.min(v, max) + ' / ' + max) + '<div class="pbar"><div style="width:' + Math.min(100, v / max * 100) + '%"></div></div>').join('') + '</div>' +
      '<div class="pcol"><h3>MISSION RATINGS</h3>' + MISSIONS.map((m, i) => row((i + 1) + '. ' + m.name, S.ratings[i] ? '<span class="gold">' + '★'.repeat(S.ratings[i]) + '☆'.repeat(3 - S.ratings[i]) + '</span>' : '<span class="dim">—</span>')).join('') + '<div class="dim" style="margin-top:6px">★★★ = finished with half the clock left</div></div>' +
      '<div class="pcol"><h3>RANK</h3><div style="font-size:20px;font-weight:900" class="gold">' + rankFor(S.rep) + '</div>' + row('RP', S.rep) + row('Next rank', next ? rankFor(next) + ' · ' + (next - S.rep) + ' RP to go' : 'top rank') +
      '<div class="pbar"><div style="width:' + (next ? S.rep / next * 100 : 100) + '%"></div></div><h3 style="margin-top:12px">CAREER</h3>' +
      row('Cash earned', fmt$(S.earned)) + row('Cars taken', S.cars) + row('Distance driven', (S.dist / 1000).toFixed(1) + ' km') + row('Top speed', Math.round(S.topSpd * 3.6) + ' km/h') + row('Time played', playTime(S.playT)) + '</div>';
  }
  if (t === 'crew') tab.innerHTML = CREW.map(c => '<div class="ccard"><div class="av" style="background:' + c.color + '">' + c.letter + '</div><div style="font-size:18px;font-weight:900">' + c.name + ' <span class="dim" style="font-size:12px">· ' + c.role.toUpperCase() + '</span></div>' +
    '<div style="margin-top:4px"><span class="kk">' + c.key + '</span> ' + c.ab + '</div><div class="dim">Cooldown ' + c.cd + 's · ' + (c.cdLeft > 0 ? '<span class="red">recharging ' + Math.ceil(c.cdLeft) + 's</span>' : '<span class="green">ready</span>') + '</div>' +
    '<div style="margin-top:8px">' + c.bio + '</div><div style="margin-top:8px" class="' + (done > c.job ? 'green">✓ RECRUITED · job ' + (c.job + 1) : 'gold">Signs on after job ' + (c.job + 1) + ' · ' + MISSIONS[c.job].name + ' (on call till then)') + '</div></div>').join('');
  if (t === 'controls') el('pauseKeys').innerHTML = KEYS.map(([k, v]) => '<div><b>' + k + '</b> ' + v + '</div>').join('');
  if (t === 'save') tab.innerHTML = '<div class="pcol"><h3>SAVE SLOTS · PLAYING SLOT ' + S.slot + '</h3>' + [1, 2, 3].map(n => {
    const has = !!readSlot(n), b = (a, l) => '<button data-act="' + a + '" data-n="' + n + '"' + (a !== 'save' && !has ? ' disabled' : '') + '>' + l + '</button>';
    return '<div class="slot' + (has ? '' : ' empty') + '" style="display:flex;justify-content:space-between;align-items:center;cursor:default"><div>' + slotHTML(n) + '</div><div class="sbtns">' + b('save', 'SAVE') + b('load', 'LOAD') + b('erase', 'ERASE') + '</div></div>';
  }).join('') + '<div class="dim">Finishing a job autosaves to the slot you are playing. LOAD restarts that slot\'s current job. LOAD, ERASE and saving over another slot ask you to click twice.</div></div>';
}
el('tab-save').onclick = e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const n = +b.dataset.n, act = b.dataset.act;
  if ((act !== 'save' || (readSlot(n) && n !== S.slot)) && b.dataset.arm !== '1') { b.dataset.arm = '1'; b.textContent = 'SURE?'; return; }
  if (act === 'load') { togglePause(false); loadGame(n); startGame(); return; }
  if (act === 'save') saveGame(n);
  if (act === 'erase') { localStorage.removeItem(slotKey(n)); toast('🗑 Slot ' + n + ' erased'); }
  pauseTab('save');
};
el('victoryBtn').addEventListener('click', () => {
  el('victory').classList.remove('on');
  S.victory = false; S.freeRoam = true; S.missionActive = false;
  toast('🌇 Free roam — Senja Bay is yours. Keep the heat on.');
});
el('bustedBtn').addEventListener('click', () => { el('busted').classList.remove('on'); });
