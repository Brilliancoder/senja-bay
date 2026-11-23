/* SENJA BAY — audio.js: procedural WebAudio: engine, siren, shots, boom */
/* ---------- audio (procedural WebAudio, lazy init) ---------- */
let AC = null, engOsc = null, engOsc2 = null, engGain = null, sirOsc = null, sirGain = null, noiseBuf = null;
function initAudio() {
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    engOsc = AC.createOscillator(); engOsc.type = 'sawtooth'; engOsc.frequency.value = 55;
    engOsc2 = AC.createOscillator(); engOsc2.type = 'square'; engOsc2.frequency.value = 28;
    engGain = AC.createGain(); engGain.gain.value = 0.0;
    engOsc.connect(engGain); engOsc2.connect(engGain); engGain.connect(AC.destination);
    engOsc.start(); engOsc2.start();
    sirOsc = AC.createOscillator(); sirOsc.type = 'sine'; sirOsc.frequency.value = 720;
    sirGain = AC.createGain(); sirGain.gain.value = 0.0;
    sirOsc.connect(sirGain); sirGain.connect(AC.destination); sirOsc.start();
    noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.5, AC.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { AC = null; }
}
function audioTick() {
  if (!AC || S.muted) return;
  const sp = onFoot ? 0 : speed;
  if (engOsc) { engOsc.frequency.value = 50 + sp * 3.2; engOsc2.frequency.value = 25 + sp * 1.6; }
  if (engGain) engGain.gain.value = S.started && !S.paused ? 0.028 + Math.min(0.05, sp * 0.0012) : 0.0;
  if (sirGain) sirGain.gain.value = S.wanted >= 1 && S.started ? 0.014 : 0.0;
  if (sirOsc) sirOsc.frequency.value = 680 + 160 * Math.sin(performance.now() / 380);
}
function blip(freq, dur, type, vol) {
  if (!AC || S.muted) return;
  try {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.12, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + dur);
    o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + dur);
  } catch (e) {}
}
function noiseHit(dur, vol, freq) {
  if (!AC || S.muted || !noiseBuf) return;
  try {
    const src = AC.createBufferSource(); src.buffer = noiseBuf;
    const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 900;
    const g = AC.createGain();
    g.gain.setValueAtTime(vol || 0.25, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + dur);
    src.connect(f); f.connect(g); g.connect(AC.destination); src.start(); src.stop(AC.currentTime + dur);
  } catch (e) {}
}
const sfxShot = () => { noiseHit(0.09, 0.22, 2400); blip(190, 0.07, 'square', 0.08); };
const sfxBoom = () => { noiseHit(0.8, 0.5, 320); blip(52, 0.7, 'sine', 0.3); };
const sfxChime = () => { blip(880, 0.14, 'sine', 0.12); setTimeout(() => blip(1320, 0.2, 'sine', 0.1), 90); };
const sfxClick = () => blip(660, 0.05, 'square', 0.06);
const sfxHorn = () => { blip(370, 0.18, 'square', 0.07); };
