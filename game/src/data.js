/* SENJA BAY — data.js: shared helpers, game state, missions, banter, crew, shop data, world layout, save/rank */
const el = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const fmt$ = n => '$' + Math.round(n).toLocaleString('en-US');
const d2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
function toast(msg, ms) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  el('toasts').appendChild(t);
  setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, ms || 3200);
}
function floatText(txt, color) {
  const f = document.createElement('div'); f.className = 'floater'; f.textContent = txt;
  if (color) f.style.color = color;
  el('floaters').appendChild(f);
  setTimeout(() => { if (f.parentNode) f.parentNode.removeChild(f); }, 1800);
}
/* ---------- state ---------- */
const S = {
  money: 1500, rep: 0, respect: 0, wanted: 0, health: 100, armour: 50,
  mission: 0, offer: -1, missionActive: false, missionTime: 0, missionTimer: 180, missionElapsed: 0,
  stage: 0, hidden: 0, kills: 0, stageTarget: 1,
  condition: 100, nitro: 100, gear: 'N', paint: 'red', armourPlating: false,
  clock: 18.87, day: 1, night: false, radio: 0, radioOn: true, muted: false,
  started: false, paused: false, victory: false, busted: false, introDone: false,
  cashGot: 0, heat: 0
};
const WEAPONS = [
  { name: 'Fists', icon: '✊', ammo: Infinity, dmg: 8, rate: 0.32 },
  { name: 'Pistol', icon: '🔫', ammo: 24, max: 24, dmg: 22, rate: 0.28 },
  { name: 'SMG', icon: '🔫', ammo: 60, max: 60, dmg: 12, rate: 0.09 },
  { name: 'Shotgun', icon: '💥', ammo: 12, max: 12, dmg: 45, rate: 0.7 },
  { name: 'Rifle', icon: '🎯', ammo: 30, max: 30, dmg: 34, rate: 0.16 }
];
let curWeapon = 1, shootCd = 0;
/* ---------- missions ---------- */
const MISSIONS = [
  { name: 'FIRST GEAR', fixer: 'Dara', cps: [{ x: 50, z: -130 }], time: 180, money: 800, rep: 40, obj: 'Drive to Marina Pier', next: 'Reach the gold checkpoint', intro: 'Raka, first job is easy — just drive to the Marina Pier and follow the gold marker. Don\'t attract the SJPD yet.', done: 'Clean run, Raka. Dara\'s already got the next one lined up.' },
  { name: 'LOSE THE HEAT', fixer: 'Nara', cps: [{ x: -50, z: -60 }], time: 120, money: 1200, rep: 60, obj: 'Stay hidden until the heat dies down', next: 'Stay out of sight — 15s hidden', intro: 'SJPD is all over the Strip tonight. Lay low, keep your head down, and let the heat burn itself out.', done: 'They lost you. Nara says the streets are yours again — for now.' },
  { name: 'PIER DELIVERY', fixer: 'Dara', cps: [{ x: -28, z: 60 }], time: 150, money: 1500, rep: 70, obj: 'Deliver the package to Pasar Malam', next: 'Reach the gold checkpoint', intro: 'A package for the night market. No questions, no stops, no cops. The buyer is waiting at Pasar Malam.', done: 'Delivered. The buyer paid in full — and he wants you for the next one too.' },
  { name: 'STREET RACE', fixer: 'Sinta', cps: [{ x: 50, z: -60 }, { x: 0, z: -60 }, { x: 0, z: 60 }, { x: 50, z: 60 }], time: 120, money: 2500, rep: 100, obj: 'Beat the rival crew through 4 checkpoints', next: 'Hit the next checkpoint', intro: 'A rival crew thinks they own the Strip. Four checkpoints, no rules. Sinta\'s riding shotgun — don\'t embarrass her.', done: 'You smoked them. Sinta\'s already spending your winnings.' },
  { name: 'SWAP PLATES', fixer: 'Bara', cps: [{ x: -125, z: 134 }], time: 150, money: 1000, rep: 50, obj: 'Reach the garage and press G', next: 'Get to Bara\'s garage', intro: 'Your plates are burned — every SJPD unit has your tag. Get to Bara\'s garage and swap them before they box you in.', done: 'Fresh plates, clean record. Bara even threw in a wash.' },
  { name: 'NIGHT RUN', fixer: 'Dara', cps: [{ x: -50, z: -60 }, { x: 50, z: -130 }, { x: -100, z: 0 }], time: 180, money: 2200, rep: 90, obj: 'Make 3 drops across the city at night', next: 'Reach the next drop', intro: 'Three drops, one night, no headlights on the back streets. The city never sleeps, Raka — and neither do we.', done: 'All three drops made. Dara says you\'re the best runner she\'s ever had.' },
  { name: 'PIER STANDOFF', fixer: 'Nara', cps: [{ x: 50, z: -100 }], time: 180, money: 3000, rep: 120, obj: 'Disable 3 SJPD units at the pier', next: 'Take down SJPD units — 0/3', intro: 'They\'re coming for the pier, Raka. Three units, no backup, no mercy. Nara\'s got eyes on every approach — make it count.', done: 'Three units down and the pier is still ours. Nara owes you a drink.' },
  { name: 'THE BOAT', fixer: 'Dara', cps: [{ x: 50, z: -157 }], time: 150, money: 5000, rep: 200, obj: 'Reach the boat at Marina Pier', next: 'Reach the gold checkpoint', intro: 'This is it, Raka. The boat is waiting at the far end of the pier. Eight jobs, one last drive — and the whole city behind you. Go.', done: 'Eight jobs. One last plan. The boat is yours.' }
];
const BANTER = [
  [ ['Dara', 'Easy does it, Raka. The pier isn\'t going anywhere.'], ['Dara', 'You know, two years ago you couldn\'t even park straight.'], ['Dara', 'When this is done, we\'re both out. Remember that.'] ],
  [ ['Nara', 'Eyes up — SJPD just rolled a second unit onto the Strip.'], ['Nara', 'If they spot you, run. Don\'t be a hero, be a ghost.'], ['Nara', 'Almost there. The heat always burns out if you wait it out.'] ],
  [ ['Dara', 'Package is fragile. Drive like your grandma is in the back.'], ['Sinta', 'Grandma? He drives like the cops are already behind him.'], ['Dara', 'Both of you, focus. The buyer does not wait.'] ],
  [ ['Sinta', 'Left! Left! The checkpoint is left, Raka!'], ['Sinta', 'Ha! Did you see their faces? Keep pushing!'], ['Sinta', 'One more checkpoint and we own the Strip tonight.'] ],
  [ ['Bara', 'Plates are hot. Real hot. Get here before they lock the roads.'], ['Bara', 'I\'ve got the swap kit ready. Five minutes, tops.'], ['Bara', 'Almost home. Don\'t scratch the paint on the way in.'] ],
  [ ['Dara', 'Night runs pay double because the night takes double.'], ['Nara', 'Second drop is clear. You\'re a shadow out there.'], ['Dara', 'Last drop, Raka. Then we disappear till morning.'] ],
  [ ['Nara', 'Three units inbound. I\'ve marked them all — pick your ground.'], ['Nara', 'One down! Two to go. The pier is holding.'], ['Bara', 'Your armour is holding. Keep the pressure on!'] ],
  [ ['Dara', 'The boat is right there. Don\'t stop for anything.'], ['Sinta', 'Four stars and you\'re still smiling. That\'s my driver.'], ['Dara', 'Raka — thank you. For all eight of them. Now go.'] ]
];
const PHONE_MSGS = [
  { who: 'Dara', txt: 'Job\'s on the board. Don\'t keep me waiting, Raka.' },
  { who: 'Sinta', txt: 'If you scratch my plates I\'m taking it out of your cut.' },
  { who: 'Bara', txt: 'Garage is open all night. Bring the car, I\'ll bring the tools.' },
  { who: 'Nara', txt: 'I can see the whole Strip from up here. You\'re clear — for now.' }
];
const RADIO_TRACKS = [
  { name: '"Island Pop" · Vela Roja', hue: 0xff9a3d },
  { name: '"Neon Coast" · Mira Sol', hue: 0x5fd6ff },
  { name: '"Golden Hour" · The Palms', hue: 0xf5c542 },
  { name: '"Night Drive" · Kota Band', hue: 0x7a5cff }
];
const SHOP_ITEMS = [
  { name: 'Full Repair', desc: 'Condition back to 100%', price: 400, key: 'repair' },
  { name: 'Armour Plating', desc: 'Halves all damage taken', price: 800, key: 'armour' },
  { name: 'Ammo Refill', desc: 'All weapons back to full ammo', price: 300, key: 'ammo' },
  { name: 'Arunika Red paint', desc: 'Fresh coat for the Arunika GT', price: 600, key: 'paint-red', color: '#d21f26' },
  { name: 'Marina Blue paint', desc: 'Fresh coat for the Arunika GT', price: 600, key: 'paint-blue', color: '#2e6fc2' },
  { name: 'Sunset Gold paint', desc: 'Fresh coat for the Arunika GT', price: 600, key: 'paint-gold', color: '#e8a81c' },
  { name: 'Palm Green paint', desc: 'Fresh coat for the Arunika GT', price: 600, key: 'paint-green', color: '#2e8b57' }
];
const PAINTS = { red: 0xd21f26, blue: 0x2e6fc2, gold: 0xe8a81c, green: 0x2e8b57 };
const CREW = [
  { name: 'Sinta', role: 'Driver', ab: 'Swap plates · -1★ wanted', key: 'Z', cd: 60, cdLeft: 0, color: '#3d8bff', letter: 'S' },
  { name: 'Bara', role: 'Mechanic', ab: 'Quick fix · +40% condition', key: 'X', cd: 45, cdLeft: 0, color: '#ff5a5a', letter: 'B' },
  { name: 'Nara', role: 'Lookout', ab: 'Eyes out · marks map 20s', key: 'C', cd: 30, cdLeft: 0, color: '#7a5cff', letter: 'N' }
];
let eyesOutT = 0;
// original model names for the street cars you can steal (indexed by traffic colour)
const TRAFFIC_MODELS = ['KANCIL SEDAN', 'PELITA TAXI', 'MERAK HATCH', 'BAYU WAGON'];
/* ---------- player / entity globals (probe reads these) ---------- */
let px = 0, pz = 40, heading = 0, speed = 0, autoT = 0, autoDisabled = false;
let wx = 0, wz = 0, wHeading = 0, onFoot = false;
let playerCar = null, arunika = null, walker = null, camShake = 0, crashCd = 0, driftChain = 0, driftT = 0;
const parked = []; // cars you left at the kerb (the Arunika or an earlier stolen ride)
let nearMissCd = 0, heliLockT = 0, banterIdx = 0, banterShown = [false, false, false];
const police = [], traffic = [], peds = [];
const explosions = [];
const cashStashes = [];
let heli = null, gator = null, cpMarker = null, cpBeacon = null;
let shotMode = '';
/* ---------- world layout data ---------- */
const SOLIDS = [];
const BUILDINGS = [];
for (let gx = 0; gx < 4; gx++) for (let gz = 0; gz < 4; gz++) {
  const seed = gx * 3 + gz * 5;
  const w = 22 + ((seed * 3) % 8), d = 20 + ((seed * 5) % 10);
  const bx = -75 + gx * 50, bz = -90 + gz * 60;
  const h = 12 + ((seed * 11) % 28) + (gx === 3 ? 6 : 0);
  BUILDINGS.push({ x: bx, z: bz, w, d, h, seed, gx, gz });
  SOLIDS.push({ x: bx, z: bz, hw: w / 2, hd: d / 2 });
}
SOLIDS.push({ x: -125, z: 120, hw: 12, hd: 9 }); // garage
const GARAGE = { x: -125, z: 120 };
const CASH_SPOTS = [[-100, 120], [50, -130], [-50, 60], [0, 0], [100, 60], [-100, -60]];
const V_ROADS = [-100, -50, 0, 50, 100];
const H_ROADS = [-120, -60, 0, 60, 120];
/* ---------- save / rank ---------- */
function saveGame() {
  try {
    localStorage.setItem('senja-bay-save', JSON.stringify({ money: S.money, rep: S.rep, respect: S.respect, mission: S.offer >= 0 ? S.offer : S.mission, paint: S.paint, condition: S.condition, armourPlating: S.armourPlating }));
    toast('💾 Game saved');
  } catch (e) {}
}
function loadGame() {
  try {
    const d = JSON.parse(localStorage.getItem('senja-bay-save') || 'null');
    if (!d) return false;
    S.money = d.money; S.rep = d.rep; S.respect = d.respect; S.mission = d.mission || 0;
    S.paint = d.paint || 'red'; S.condition = d.condition || 100; S.armourPlating = !!d.armourPlating;
    return true;
  } catch (e) { return false; }
}
function rankFor(rep) {
  if (rep >= 520) return 'S · LEGEND';
  if (rep >= 430) return 'A · WHEELMAN';
  if (rep >= 330) return 'B · HUSTLER';
  if (rep >= 220) return 'C · RUNNER';
  if (rep >= 110) return 'D · ROOKIE+';
  return 'D · ROOKIE';
}
function districtAt(x, z) {
  if (z < -110) return ['Marina Pier', 'Marina Pier · Senja Bay'];
  if (x < -110 && z > 100) return ["Bara's Garage", 'Ocean Boulevard · Senja Bay'];
  if (Math.abs(x) < 12 && Math.abs(z) < 12) return ['Plaza Senja', 'Plaza Senja · Senja Bay'];
  if (z > 40) return ['Pasar Malam', 'Pasar Malam · Senja Bay'];
  if (x > 60) return ['Sunset Row', 'Sunset Row · Senja Bay'];
  if (x < -60) return ['Old Docks', 'Old Docks · Senja Bay'];
  return ['Ocean Boulevard', 'Ocean Boulevard · Senja Bay'];
}
