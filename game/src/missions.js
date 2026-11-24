/* SENJA BAY — missions.js: the 8 story jobs, job cards, busted, garage, crew abilities */
/* ---------- missions ---------- */
function currentCheckpoint() {
  const m = MISSIONS[S.mission];
  if (!m) return null;
  return m.cps[Math.min(S.stage, m.cps.length - 1)];
}
function startMission(i) {
  S.offer = -1; S.mission = i; S.stage = 0; S.hidden = 0; S.kills = 0; S.gHint = false;
  const m = MISSIONS[i];
  S.missionTimer = m.time; S.missionElapsed = 0; S.missionActive = true;
  banterIdx = 0; banterShown = [false, false, false];
  S.stageTarget = m.cps.length;
  const cp = currentCheckpoint();
  if (cp) { cpMarker.position.set(cp.x, 0, cp.z); cpMarker.visible = true; cpBeacon.position.set(cp.x, 6, cp.z); }
  if (cp && cp.foot) cashAt(cp.x, cp.z);
  if (i === 1) addWanted(Math.max(0, 2 - S.wanted));
  if (i === 6) addWanted(Math.max(0, 3 - S.wanted));
  if (i === 7) addWanted(Math.max(0, 4 - S.wanted));
  if (i === 5 && !S.night) setClock(21); // NIGHT RUN really runs at night
  say(m.fixer, m.intro);
  showJobCard('JOB ' + (i + 1) + '/8 · ' + m.name, actFor(i), m.obj, m.fixer + ' · $' + m.money.toLocaleString('en-US') + ' · +' + m.rep + ' REP');
  addPhoneMsg(m.fixer, m.obj + ' — $' + m.money.toLocaleString('en-US') + ' if you pull it off. Don\'t keep me waiting.');
  sfxHorn();
  jobStart(i); // flow.js: rivals, pier waves, Dara's live lines
}
// make sure street cash lies within 3 m of (x, z): reuse the pickup farthest from there
function cashAt(x, z) {
  const st = cashStashes.filter(c => c.val);
  if (st.some(c => !c.taken && d2(c.x, c.z, x, z) < 3)) return;
  const c = st.reduce((a, b) => d2(b.x, b.z, x, z) > d2(a.x, a.z, x, z) ? b : a);
  c.x = x; c.z = z; c.grp.position.set(x, 0, z); c.taken = false; c.grp.visible = true;
}
function say(who, txt) {
  const faces = { Dara: '👩', Sinta: '👩‍🦰', Bara: '👨‍🔧', Nara: '🕶️' };
  el('dlgName').textContent = who + (who === 'Dara' ? ' · FIXER · SENJA BAY' : who === 'Sinta' ? ' · DRIVER · CREW' : who === 'Bara' ? ' · MECHANIC · CREW' : ' · LOOKOUT · CREW');
  el('dlgTxt').textContent = txt;
  const face = el('dlg').querySelector('.face');
  if (face) face.textContent = faces[who] || '👤';
}
let jcLeft = 0;
function actFor(i) { return i < 2 ? 'ACT I · SMALL JOBS' : i < 6 ? 'ACT II · THE HEAT RISES' : 'ACT III · THE BOAT'; }
function showJobCard(title, act, obj, meta, done) {
  el('jcAct').textContent = act; el('jcTitle').textContent = title; el('jcObj').textContent = obj; el('jcMeta').textContent = meta;
  el('jobcard').classList.toggle('done', !!done); el('jobcard').classList.add('on');
  jcLeft = 4.5;
}
function addPhoneMsg(who, txt) {
  const list = el('phoneList'); if (!list) return;
  const d = document.createElement('div'); d.className = 'pm';
  d.innerHTML = '<b>' + who + '</b> · just now<br>' + txt;
  list.prepend(d);
  while (list.children.length > 6) list.removeChild(list.lastChild);
}
function updateMission(dt) {
  if (!S.missionActive || S.paused || !S.started) return;
  S.missionElapsed += dt;
  S.missionTimer -= dt;
  if (S.missionTimer <= 0) { S.missionTimer = 0; failMission('Out of time'); return; }
  const m = MISSIONS[S.mission];
  // banter at 15s / 45s / 80s
  const marks = [15, 45, 80];
  for (let b = 0; b < 3; b++) {
    if (!banterShown[b] && S.missionElapsed >= marks[b] && BANTER[S.mission] && BANTER[S.mission][b]) {
      banterShown[b] = true;
      say(BANTER[S.mission][b][0], BANTER[S.mission][b][1]);
    }
  }
  const cx = onFoot ? wx : px, cz = onFoot ? wz : pz;
  if (S.mission === 1) {
    // LOSE THE HEAT: stay hidden 15s (wanted must be 0)
    if (S.wanted === 0) S.hidden += dt;
    else S.hidden = Math.max(0, S.hidden - dt * 2);
    if (S.hidden >= 15) { completeMission(); return; }
  } else if (S.mission === 6) {
    // PIER STANDOFF: hold the pier through 3 waves (flow.js spawns them)
    if (S.wave >= 3) { completeMission(); return; }
  } else {
    const cp = currentCheckpoint();
    if (cp && d2(cx, cz, cp.x, cp.z) < (cp.foot ? (onFoot ? 2.2 : -1) : 9)) { // a foot step only clears on foot, at the cash
      if (S.mission === 4) {
        // SWAP PLATES needs G at the garage (hint once: this runs every frame)
        if (!S.gHint) { S.gHint = true; toast('🔧 Press B to swap plates'); }
      } else if (S.stage < m.cps.length - 1) {
        S.stage++;
        const ncp = currentCheckpoint();
        cpMarker.position.set(ncp.x, 0, ncp.z); cpBeacon.position.set(ncp.x, 6, ncp.z);
        toast('✓ Checkpoint ' + (S.stage + 1) + '/' + m.cps.length);
        sfxChime();
      } else {
        completeMission(); return;
      }
    }
  }
}
function completeMission() {
  const m = MISSIONS[S.mission];
  S.money += m.money; S.rep += m.rep; S.respect = Math.min(550, S.respect + m.rep);
  S.missionActive = false;
  cpMarker.visible = false;
  const left = S.missionTimer / m.time; // rating: 1★ done, 2★ with a quarter of the clock left, 3★ with half
  S.ratings[S.mission] = Math.max(S.ratings[S.mission] || 0, 1 + (left > 0.25) + (left > 0.5));
  if (S.mission === 3) S.races++;
  showJobCard('★ JOB COMPLETE ★', actFor(S.mission), m.name + ' — done.', '+$' + m.money.toLocaleString('en-US') + ' · +' + m.rep + ' REP', true);
  floatText('JOB COMPLETE · +$' + m.money.toLocaleString('en-US'), '#4be07a');
  say(m.fixer, m.done);
  sfxChime();
  if (S.mission < 7) S.offer = S.mission + 1;
  saveGame();
  if (S.mission >= 7) { showVictory(); return; }
  setTimeout(() => { if (S.offer >= 0 && !S.missionActive) offerJob(S.offer); }, 2600);
}
// between jobs: free roam until you drive (or walk) into the next fixer's blip
const CONTACT_AT = { Dara: [6, 6], Nara: [-56, -54], Sinta: [56, 66], Bara: [-112, 107] };
const contactOf = i => CONTACT_AT[MISSIONS[i].fixer];
function offerJob(i) {
  const m = MISSIONS[i], c = contactOf(i);
  cpMarker.position.set(c[0], 0, c[1]); cpBeacon.position.set(c[0], 6, c[1]); cpMarker.visible = true;
  say(m.fixer, 'Job ' + (i + 1) + ' is ready when you are, Raka. Take a drive, then come find me — I\'m the ' + m.fixer[0] + ' on your map.');
  toast('📍 Free roam — meet ' + m.fixer + ' for job ' + (i + 1));
  if (STORY_SMS[i]) setTimeout(() => storySms(STORY_SMS[i]), 6000);
}
function updateContact() {
  if (S.offer < 0 || S.missionActive || !cpMarker.visible || (race && race.side)) return;
  const c = contactOf(S.offer);
  if (d2(onFoot ? wx : px, onFoot ? wz : pz, c[0], c[1]) < 8) { const i = S.offer; S.offer = -1; startMission(i); }
}
function failMission(reason) {
  if (S.victory) return;
  if (S.offer >= 0 || S.freeRoam) { S.wanted = 0; S.health = Math.max(S.health, 50); return; } // no job running to fail
  const m = MISSIONS[S.mission];
  S.missionActive = false;
  cpMarker.visible = false;
  toast('❌ JOB FAILED' + (reason ? ' — ' + reason : '') + ' · try again', 4000);
  say('Dara', 'It went sideways, Raka. Dust yourself off — we run it back.');
  S.wanted = 0;
  S.health = Math.max(S.health, 50);
  setTimeout(() => { if (!S.victory && !S.busted) startMission(S.mission); }, 2600);
}
function showVictory() {
  S.victory = true; S.missionActive = false;
  cpMarker.visible = false;
  el('victory').classList.add('on');
  sfxChime(); setTimeout(sfxChime, 500);
}
// arrest = BUSTED (bail); HP 0 = TUMBANG ("fallen"), the clinic bill
function showBusted(reason, dead) {
  if (S.busted || S.victory) return;
  S.busted = true; S.missionActive = false; S.paused = true;
  const fee = dead ? 300 : 200;
  S.money = Math.max(0, S.money - fee);
  el('bustedTitle').textContent = dead ? 'TUMBANG' : 'BUSTED';
  el('bustedTxt').textContent = (reason || 'The SJPD takes you in.') + (dead ? ' Klinik Senja patched you up: $' : ' Bail posted: $') + fee + '.';
  el('busted').classList.toggle('dead', !!dead);
  el('busted').classList.add('on');
  speed = 0;
  setTimeout(() => {
    el('busted').classList.remove('on');
    S.busted = false; S.paused = false;
    S.health = 100; S.armour = 50; S.wanted = 0;
    respawnAtGarage();
    failMission(dead ? 'Tumbang' : 'Busted by the SJPD');
  }, 2600);
}
function garageAction() {
  if (!S.started || S.paused) return;
  if (d2(onFoot ? wx : px, onFoot ? wz : pz, GARAGE.x, GARAGE.z) > 22) {
    if (S.mission === 4 && S.missionActive) toast('Get to Bara\'s garage first');
    return;
  }
  if (S.mission === 4 && S.missionActive) {
    S.stage = 99;
    toast('🔧 Plates swapped — you\'re clean');
    S.wanted = 0;
    completeMission();
    return;
  }
  openShop();
}
/* ---------- crew abilities ---------- */
function useAbility(k) {
  const c = CREW.find(c => c.key.toLowerCase() === k);
  if (!c || !S.started || S.paused) return;
  if (c.cdLeft > 0) { toast(c.name + ' is on cooldown (' + Math.ceil(c.cdLeft) + 's)'); return; }
  c.cdLeft = c.cd;
  if (c.name === 'Sinta') {
    S.wanted = Math.max(0, S.wanted - 1);
    toast('🔁 Sinta swapped the plates · -1★ wanted');
    floatText('-1★ WANTED', '#5fd6ff');
  } else if (c.name === 'Bara') {
    S.condition = Math.min(100, S.condition + 40);
    toast('🔧 Bara quick fix · +40% condition');
    floatText('+40% CONDITION', '#4be07a');
  } else {
    eyesOutT = 20;
    toast('👁 Nara\'s eyes are out — SJPD marked on the map (20s)');
    floatText('EYES OUT · MAP MARKED', '#7a5cff');
  }
  sfxChime();
}
