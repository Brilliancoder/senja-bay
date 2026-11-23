/* SENJA BAY — world.js: Three.js scene: sky, lights, roads, pier, city blocks, garage, props, time of day */
let scene, camera, renderer, sun, amb, hemi, rim, skyMat, skyMesh, sunBall, moonBall;
let clouds = [], cloudMats = [], lampGlows = [], neonGlows = [], facadeGlowMats = [], buildingMats = [];
let sandMat, grassMat, seaMat, pierMat;
let paintMat, headMat, beamMat, beamPoolMat;
let mmCtx = null, bigCtx = null;
function glowTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 2, 64, 64, 62);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.35, 'rgba(255,255,255,.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const tx = new THREE.CanvasTexture(cv); return tx;
}
let GLOW_TEX = null;
function buildingTexture(base, lit) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 512;
  const g = cv.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 256, 512);
  // subtle vertical panel joints
  for (let c = 0; c < 8; c++) {
    g.fillStyle = c % 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)';
    g.fillRect(c * 32, 0, 32, 512);
  }
  // floor separator lines
  g.fillStyle = 'rgba(0,0,0,.28)';
  for (let r = 0; r <= 14; r++) g.fillRect(0, 36 + r * 33, 256, 2);
  // windows: 8 cols x 14 rows, framed, with mullions; some lit warm, some lit cool, some dark
  const cols = 8, rows = 14;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = 6 + c * 31, y = 42 + r * 33;
    const on = ((r * 5 + c * 3 + lit) % 4) !== 0;
    const warm = ((r * 3 + c * 7 + lit) % 5) < 3;
    g.fillStyle = 'rgba(18,20,32,.92)'; g.fillRect(x - 2, y - 2, 24, 26);
    g.fillStyle = on ? (lit ? (warm ? '#ffd98a' : '#9fc4ff') : '#2c3550') : '#121826';
    g.fillRect(x, y, 20, 22);
    if (on && lit) { g.fillStyle = 'rgba(255,220,140,.35)'; g.fillRect(x - 1, y - 1, 22, 24); }
    g.fillStyle = 'rgba(18,20,32,.6)'; g.fillRect(x + 9, y, 2, 22); g.fillRect(x, y + 10, 20, 2);
  }
  // ground floor: dark shopfront band with glass panels
  g.fillStyle = '#1c1e28'; g.fillRect(0, 470, 256, 42);
  for (let c = 0; c < 4; c++) {
    g.fillStyle = '#2a3448'; g.fillRect(10 + c * 62, 476, 50, 30);
    g.fillStyle = 'rgba(255,220,140,.3)'; g.fillRect(10 + c * 62, 476, 50, 3);
  }
  // cornice / parapet strip at the top
  g.fillStyle = 'rgba(0,0,0,.32)'; g.fillRect(0, 0, 256, 10);
  g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(0, 10, 256, 4);
  const tx = new THREE.CanvasTexture(cv); return tx;
}
function signTexture(text, color) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
  const g = cv.getContext('2d');
  g.fillStyle = '#101018'; g.fillRect(0, 0, 256, 64);
  g.strokeStyle = color; g.lineWidth = 4; g.strokeRect(3, 3, 250, 58);
  g.fillStyle = color; g.font = '900 34px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = color; g.shadowBlur = 14;
  g.fillText(text, 128, 34);
  return new THREE.CanvasTexture(cv);
}
function sandTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = '#e8c98a'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(120,85,30,.35)' : 'rgba(255,240,200,.5)';
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(120,85,30,.25)'; g.fillRect(Math.random() * 256, Math.random() * 256, 14, 3); }
  // wind ripples: soft wavy ridges, tileable (whole sine periods across the tile)
  g.lineWidth = 2;
  for (let r = 0; r < 16; r++) {
    g.strokeStyle = r % 2 ? 'rgba(150,105,45,.28)' : 'rgba(255,236,190,.35)';
    g.beginPath();
    for (let x = 0; x <= 256; x += 8) g.lineTo(x, r * 16 + 6 + Math.sin(x / 256 * Math.PI * 4 + r) * 4);
    g.stroke();
  }
  const tx = new THREE.CanvasTexture(cv);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(9, 3); // ~13 m tiles: was 3x3 on a 120x34 plane, smeared 3.5:1
  return tx;
}
// sea: `map` darkens the troughs between swells, `emissiveMap` adds sun glints on the crests (tinted per time of day)
let seaTex = null, glintTex = null;
function seaTextures() {
  const mk = draw => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; draw(cv.getContext('2d')); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 26); return t; };
  seaTex = mk(g => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256);
    for (let r = 0; r < 16; r++) {
      g.strokeStyle = 'rgba(10,40,70,.28)'; g.lineWidth = 5; g.beginPath();
      for (let x = 0; x <= 256; x += 8) g.lineTo(x, r * 16 + 8 + Math.sin(x / 256 * Math.PI * 6 + r * 1.7) * 3);
      g.stroke();
    }
  });
  glintTex = mk(g => {
    g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 140; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.35 + Math.random() * 0.65) + ')'; g.fillRect(Math.random() * 246, Math.random() * 252, 4 + Math.random() * 10, 2); }
  });
}
function buildWorld() {
  GLOW_TEX = glowTexture();
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffc07a, 110, 340);
  camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 900);
  camera.position.set(0, 3, 12);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'webgl';
  el('c').appendChild(renderer.domElement);
  /* ----- sky dome ----- */
  skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x2e6fc2) }, mid: { value: new THREE.Color(0xff9a3d) }, bot: { value: new THREE.Color(0x3a1c4a) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bot; void main(){ float h = normalize(vP).y; vec3 c = h > 0.12 ? mix(mid, top, smoothstep(0.12, 0.65, h)) : mix(bot, mid, smoothstep(-0.25, 0.12, h)); gl_FragColor = vec4(c, 1.0); }'
  });
  skyMesh = new THREE.Mesh(new THREE.SphereGeometry(420, 24, 16), skyMat);
  scene.add(skyMesh);
  sunBall = new THREE.Mesh(new THREE.SphereGeometry(9, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe9b0, fog: false }));
  sunBall.position.set(-160, 90, -300); scene.add(sunBall);
  for (const [s, o] of [[60, 0.75], [170, 0.3]]) { // halo: reads as a sun, not a white disc
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xffb860, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    h.scale.set(s, s, 1); sunBall.add(h);
  }
  moonBall = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 12), new THREE.MeshBasicMaterial({ color: 0xdfe8ff, fog: false }));
  moonBall.position.set(170, 120, -280); moonBall.visible = false; scene.add(moonBall);
  /* ----- lights ----- */
  sun = new THREE.DirectionalLight(0xffe0b3, 1.05);
  sun.position.set(-90, 120, -60); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -180; sun.shadow.camera.right = 180;
  sun.shadow.camera.top = 180; sun.shadow.camera.bottom = -180;
  sun.shadow.camera.far = 500; sun.shadow.bias = -0.0004;
  scene.add(sun);
  amb = new THREE.AmbientLight(0xffe8cc, 0.56); scene.add(amb);
  hemi = new THREE.HemisphereLight(0xffd9a0, 0x2a2a44, 0.5); scene.add(hemi);
  rim = new THREE.DirectionalLight(0xff9a3d, 0.5);
  rim.position.set(120, 60, 140); scene.add(rim);
  /* ----- ground ----- */
  grassMat = new THREE.MeshLambertMaterial({ color: 0x5d8a4a });
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), grassMat);
  grass.rotation.x = -Math.PI / 2; grass.position.y = -0.05; grass.receiveShadow = true; scene.add(grass);
  const roadBase = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshLambertMaterial({ color: 0x2e2e38 }));
  roadBase.rotation.x = -Math.PI / 2; roadBase.position.y = -0.02; roadBase.receiveShadow = true; scene.add(roadBase);
  // vertical roads (dark strips with lighter sidewalks)
  for (const rx of V_ROADS) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(10, 320), new THREE.MeshLambertMaterial({ color: 0x3a3a46 }));
    r.rotation.x = -Math.PI / 2; r.position.set(rx, 0.01, 0); r.receiveShadow = true; scene.add(r);
    for (const sx of [-6.4, 6.4]) {
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 320), new THREE.MeshLambertMaterial({ color: 0x8a8a96 }));
      sw.rotation.x = -Math.PI / 2; sw.position.set(rx + sx, 0.02, 0); sw.receiveShadow = true; scene.add(sw);
    }
    // dashed centre line
    for (let z = -150; z < 150; z += 8) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 3.4), new THREE.MeshBasicMaterial({ color: 0xf5e9c8 }));
      dash.rotation.x = -Math.PI / 2; dash.position.set(rx, 0.03, z); scene.add(dash);
    }
  }
  for (const rz of H_ROADS) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(320, 10), new THREE.MeshLambertMaterial({ color: 0x3a3a46 }));
    r.rotation.x = -Math.PI / 2; r.position.set(0, 0.01, rz); r.receiveShadow = true; scene.add(r);
    for (const sz of [-6.4, 6.4]) {
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(320, 2.6), new THREE.MeshLambertMaterial({ color: 0x8a8a96 }));
      sw.rotation.x = -Math.PI / 2; sw.position.set(0, 0.02, rz + sz); sw.receiveShadow = true; scene.add(sw);
    }
    for (let x = -150; x < 150; x += 8) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.5), new THREE.MeshBasicMaterial({ color: 0xf5e9c8 }));
      dash.rotation.x = -Math.PI / 2; dash.position.set(x, 0.03, rz); scene.add(dash);
    }
  }
  // zebra crossings at the main junctions
  for (const jx of [-50, 0, 50]) for (const jz of [-60, 0, 60]) {
    for (let i = -4; i <= 4; i++) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 4.6), new THREE.MeshBasicMaterial({ color: 0xe8e8e8 }));
      stripe.rotation.x = -Math.PI / 2; stripe.position.set(jx + i * 1.15, 0.04, jz - 5.4); scene.add(stripe);
    }
  }
  // pier sand + sea (Marina Pier, north edge)
  sandMat = new THREE.MeshLambertMaterial({ map: sandTexture(), color: 0xd6b277 });
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(120, 34), sandMat);
  sand.rotation.x = -Math.PI / 2; sand.position.set(60, 0.05, -146); sand.receiveShadow = true; scene.add(sand);
  seaTextures();
  seaMat = new THREE.MeshLambertMaterial({ color: 0x1d6f8f, map: seaTex, emissive: 0xffa850, emissiveMap: glintTex, emissiveIntensity: 0.6 });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(700, 300), seaMat); // the bay runs out to the far skyline
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.0, -298); scene.add(sea);
  // wooden pier planks
  pierMat = new THREE.MeshLambertMaterial({ color: 0x7a5a34 });
  for (let i = 0; i < 13; i++) {
    const pl = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.3, 2.6), pierMat);
    pl.position.set(50, 0.25, -132 - i * 3.1); pl.castShadow = true; scene.add(pl);
    if (i % 3 === 2) for (const sx of [-2.3, 2.3]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.8, 6), pierMat);
      post.position.set(50 + sx, 0.4, -132 - i * 3.1); scene.add(post);
    }
  }
  buildBoat(); buildBeach();
  // distant skyline + hills
  const skyCols = ['#5a4a72', '#6a4a6a', '#4a4a72', '#7a5a52'];
  for (let i = 0; i < 9; i++) {
    const h = 45 + ((i * 37) % 55);
    const stex = buildingTexture(skyCols[i % 4], i + 40);
    const smat = new THREE.MeshLambertMaterial({ map: stex, emissive: 0xffffff, emissiveMap: stex, emissiveIntensity: 0.3 });
    buildingMats.push(smat);
    const t = new THREE.Mesh(new THREE.BoxGeometry(16 + (i % 3) * 5, h, 16 + (i % 2) * 6), smat);
    t.position.set(-260 + i * 62, h / 2 - 2, -260 - (i % 3) * 24);
    scene.add(t);
  }
  for (let i = 0; i < 5; i++) {
    const h = 30 + ((i * 23) % 30);
    const stex2 = buildingTexture('#4a4468', i + 60);
    const smat2 = new THREE.MeshLambertMaterial({ map: stex2, emissive: 0xffffff, emissiveMap: stex2, emissiveIntensity: 0.3 });
    buildingMats.push(smat2);
    const t = new THREE.Mesh(new THREE.BoxGeometry(20, h, 20), smat2);
    t.position.set(-220 + i * 110, h / 2 - 2, 250 + (i % 2) * 30);
    scene.add(t);
  }
  for (const hx of [-300, 300]) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(90, 16, 10), new THREE.MeshLambertMaterial({ color: 0x4a6a4a }));
    hill.scale.y = 0.28; hill.position.set(hx, -4, -200); scene.add(hill);
  }
  // clouds — big, low, fog-proof (fog:false keeps them crisp at distance) so the sky reads in the chase cam.
  // Spots are hand-placed in the two sightlines the screenshots look down: dead-ahead south (x≈0, z 230-280,
  // visible down the x=0 road above the skyline towers) and the north corridor past the garage (x≈-120, z -220..-280)
  const CLOUD_SPOTS = [
    [-15, 84, 240], [10, 92, 270], [28, 80, 225], [-5, 88, 285],
    [-120, 86, -230], [-95, 94, -270], [-140, 80, -210], [-110, 90, -285],
    [-220, 85, 60], [220, 90, -80], [180, 78, 160], [-260, 92, -140],
    [90, 86, -240], [-190, 80, 240],
    [70, 60, -330], [-25, 66, -340], [135, 58, -310] // low over the bay: the pier shot's sky
  ];
  for (let i = 0; i < CLOUD_SPOTS.length; i++) {
    const cmat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false });
    cloudMats.push(cmat);
    const cl = new THREE.Group();
    for (let j = 0; j < 5; j++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(10 + j * 3.2, 10, 8), cmat);
      s.position.set(j * 11 - 22, (j % 2) * 2.5, (j % 3) * 5 - 5);
      s.scale.y = 0.42; cl.add(s);
    }
    cl.position.set(CLOUD_SPOTS[i][0], CLOUD_SPOTS[i][1], CLOUD_SPOTS[i][2]);
    scene.add(cl); clouds.push(cl);
  }
  buildCity(); buildGarage(); buildProps(); buildNightMarket(); buildCash(); buildCheckpoint();
}

const NEON_SIGNS = ['OPEN', '24/7', 'EATS', 'DRINKS', 'POOL', 'RENTAL', 'MARKET', 'BAY GOODS'];
const NEON_COLORS = [0xff5a5a, 0x4be07a, 0x5fd6ff, 0xffd94a, 0xff9f2e, 0x7a5cff];
const BLD_COLORS = ['#c98a9a', '#7ab8a8', '#d9b06a', '#8a9ab8', '#b87a9a', '#6a8a5a', '#c9a06a', '#9a8ac9'];
const SHOP_SIGNS = ['KOPI', 'TOKO', 'MART', 'BAKSO', 'BAR', 'RAMEN', 'LAUNDRY', 'BENGKEL'];
function buildCity() {
  BUILDINGS.forEach((b, idx) => {
    const base = BLD_COLORS[idx % BLD_COLORS.length];
    const tex = buildingTexture(base, idx);
    const mat = new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.15 });
    buildingMats.push(mat);
    const tall = b.h > 30;
    const podiumH = tall ? 14 : b.h;
    const towerW = b.w * 0.72, towerD = b.d * 0.72;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, podiumH, b.d), mat);
    mesh.position.set(b.x, podiumH / 2, b.z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh);
    // stepped tower on tall buildings (darker shade of the same tone)
    if (tall) {
      const tmat = new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.15, color: 0xbbbbbb });
      buildingMats.push(tmat);
      const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, b.h - podiumH, towerD), tmat);
      tower.position.set(b.x, podiumH + (b.h - podiumH) / 2, b.z);
      tower.castShadow = true; tower.receiveShadow = true; scene.add(tower);
    }
    // cornice band at the roofline (proud of the facade, reads as a real roof edge)
    const topW = tall ? towerW : b.w, topD = tall ? towerD : b.d;
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(topW + 0.6, 0.55, topD + 0.6), new THREE.MeshLambertMaterial({ color: 0x2e2e3a }));
    cornice.position.set(b.x, b.h + 0.1, b.z); cornice.castShadow = true; scene.add(cornice);
    // setback top floor
    if (b.h > 22) {
      const top = new THREE.Mesh(new THREE.BoxGeometry(topW * 0.55, 3.4, topD * 0.55), new THREE.MeshLambertMaterial({ color: 0x3a3a4a }));
      top.position.set(b.x, b.h + 1.7, b.z); top.castShadow = true; scene.add(top);
    }
    // rooftop props: AC units, pipes, dishes
    const nRoof = 2 + (b.seed % 3);
    for (let i = 0; i < nRoof; i++) {
      const kind = (b.seed + i) % 3;
      let rp;
      if (kind === 0) rp = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.6), new THREE.MeshLambertMaterial({ color: 0x8a8a92 }));
      else if (kind === 1) rp = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.4, 8), new THREE.MeshLambertMaterial({ color: 0x6a6a72 }));
      else rp = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xd8d8e0 }));
      rp.position.set(b.x + ((i * 7) % (b.w - 6)) - b.w / 2 + 3, b.h + 0.6, b.z + ((i * 5) % (b.d - 6)) - b.d / 2 + 3);
      rp.castShadow = true; scene.add(rp);
    }
    // pilasters: vertical fins on both street-facing (x) sides — breaks the flat wall
    const pilMat = new THREE.MeshLambertMaterial({ color: 0x2e2e3a });
    for (const side of [-1, 1]) {
      for (let pi = -1; pi <= 1; pi++) {
        const pil = new THREE.Mesh(new THREE.BoxGeometry(0.35, podiumH, 0.5), pilMat);
        pil.position.set(b.x + side * (b.w / 2 + 0.12), podiumH / 2, b.z + pi * (b.d / 3.2));
        pil.castShadow = true; scene.add(pil);
      }
    }
    // shopfront on the approach (-z) face: glass + sign band + awning
    const shopTxt = SHOP_SIGNS[idx % SHOP_SIGNS.length];
    const shopCol = NEON_COLORS[idx % NEON_COLORS.length];
    const shopTex = signTexture(shopTxt, '#' + shopCol.toString(16).padStart(6, '0'));
    const glassMat = new THREE.MeshPhongMaterial({ color: 0x1a2438, transparent: true, opacity: 0.85, shininess: 120 });
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(b.w * 0.62, 3.1), glassMat);
    sg.position.set(b.x, 1.7, b.z - b.d / 2 - 0.06); sg.rotation.y = Math.PI; scene.add(sg);
    const sb = new THREE.Mesh(new THREE.PlaneGeometry(b.w * 0.55, 1.5), new THREE.MeshBasicMaterial({ map: shopTex, transparent: true }));
    sb.position.set(b.x, 4.3, b.z - b.d / 2 - 0.12); sb.rotation.y = Math.PI; scene.add(sb);
    const saw = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.55, 0.22, 2.6), new THREE.MeshLambertMaterial({ color: idx % 4 === 0 ? 0x2e6fc2 : 0xd21f26 }));
    saw.position.set(b.x, 3.6, b.z - b.d / 2 - 1.3); saw.castShadow = true; scene.add(saw);
    // shopfront on the street-facing x side (toward road 0): glass + sign band
    const xSide = b.x < 0 ? 1 : -1;
    const sg2 = new THREE.Mesh(new THREE.PlaneGeometry(b.d * 0.6, 3.1), glassMat);
    sg2.position.set(b.x + xSide * (b.w / 2 + 0.06), 1.7, b.z);
    sg2.rotation.y = xSide * Math.PI / 2; scene.add(sg2);
    const sb2 = new THREE.Mesh(new THREE.PlaneGeometry(b.d * 0.52, 1.5), new THREE.MeshBasicMaterial({ map: shopTex, transparent: true }));
    sb2.position.set(b.x + xSide * (b.w / 2 + 0.12), 4.3, b.z);
    sb2.rotation.y = xSide * Math.PI / 2; scene.add(sb2);
    // facade light-bleed panel (warm strip, glows at night)
    const fmat = new THREE.MeshBasicMaterial({ color: 0xffc46a, transparent: true, opacity: 0.07 });
    facadeGlowMats.push(fmat);
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(b.w * 0.7, 2.2), fmat);
    fp.position.set(b.x, 3.2, b.z + b.d / 2 + 0.06); scene.add(fp);
    // awning over the shopfront
    if (idx % 2 === 0) {
      const aw = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.5, 0.25, 3.2), new THREE.MeshLambertMaterial({ color: idx % 4 === 0 ? 0x2e6fc2 : 0xd21f26 }));
      aw.position.set(b.x, 4.4, b.z + b.d / 2 + 1.4); aw.castShadow = true; scene.add(aw);
      for (const px2 of [-1, 1]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.4, 6), new THREE.MeshLambertMaterial({ color: 0x2a2a34 }));
        pole.position.set(b.x + px2 * b.w * 0.24, 2.2, b.z + b.d / 2 + 2.8); scene.add(pole);
      }
    }
    // balcony railings on tall buildings
    if (b.h > 26) {
      for (let f = 0; f < 2; f++) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.8, 0.9, 0.18), new THREE.MeshLambertMaterial({ color: 0x2a2a34 }));
        rail.position.set(b.x, 9 + f * 7, b.z + b.d / 2 + 0.35); scene.add(rail);
      }
    }
    // neon sign on every 2nd building
    if (idx % 2 === 0) {
      const signTxt = NEON_SIGNS[(idx / 2) % NEON_SIGNS.length];
      const nc = NEON_COLORS[idx % NEON_COLORS.length];
      const stex = signTexture(signTxt, '#' + nc.toString(16).padStart(6, '0'));
      const smat = new THREE.MeshBasicMaterial({ map: stex, transparent: true });
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.25), smat);
      sign.position.set(b.x, Math.min(b.h - 2.5, 13), b.z + b.d / 2 + 0.12);
      scene.add(sign);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: nc, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.scale.set(13, 5, 1); glow.position.copy(sign.position); glow.position.z += 0.4;
      scene.add(glow); neonGlows.push(glow);
    }
  });
}
// THE BOAT (job 8): a speedboat moored off the end of Marina Pier — hull, bow, cabin, stripe, wake
let boat = null;
function buildBoat() {
  const g = new THREE.Group();
  const white = new THREE.MeshPhongMaterial({ color: 0xf4f1ea, shininess: 80 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.1, 6.4), white);
  hull.position.y = 0.45; hull.castShadow = true; g.add(hull);
  const bow = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1.98, 2.4, 4, 1), white); // a 4-sided cone = pointed prow
  bow.rotation.set(-Math.PI / 2, Math.PI / 4, 0); bow.scale.set(1, 1, 0.55); bow.position.set(0, 0.45, -4.4); g.add(bow);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.86, 0.22, 6.2), new THREE.MeshLambertMaterial({ color: 0xd21f26 }));
  stripe.position.y = 0.72; g.add(stripe);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 6), new THREE.MeshLambertMaterial({ color: 0x9a6a3a }));
  deck.position.y = 1.02; g.add(deck);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 2.2), white);
  cabin.position.set(0, 1.5, -0.4); cabin.castShadow = true; g.add(cabin);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.42, 1.6), new THREE.MeshPhongMaterial({ color: 0x1a2a44, shininess: 200 }));
  glass.position.set(0, 1.62, -0.55); g.add(glass);
  const motor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.5), new THREE.MeshLambertMaterial({ color: 0x22222a }));
  motor.position.set(0, 0.7, 3.4); g.add(motor);
  const nameTex = signTexture('SENJA', '#ffd94a');
  for (const sx of [-1, 1]) { // name on both flanks
    const name = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), new THREE.MeshBasicMaterial({ map: nameTex, transparent: true }));
    name.position.set(sx * 1.43, 0.72, 0.6); name.rotation.y = sx * Math.PI / 2; g.add(name);
  }
  const navy = new THREE.MeshLambertMaterial({ color: 0x1e2e4a }), dark = new THREE.MeshLambertMaterial({ color: 0x22222a }), chrome = new THREE.MeshPhongMaterial({ color: 0xdde2ea, shininess: 120 });
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  add(new THREE.BoxGeometry(2.84, 0.3, 6.3), navy, 0, 0.02, 0); // waterline band
  add(new THREE.BoxGeometry(2.88, 0.08, 6.25), new THREE.MeshLambertMaterial({ color: 0x2e6fc2 }), 0, 0.92, 0); // gunwale stripe
  add(new THREE.BoxGeometry(2.24, 0.08, 2.7), dark, 0, 2.0, -0.3); // hardtop
  for (const sx of [-0.98, 0.98]) add(new THREE.BoxGeometry(0.07, 0.6, 0.07), chrome, sx, 2.0 - 0.3, 0.9); // hardtop posts
  for (const sx of [-1.3, 1.3]) add(new THREE.BoxGeometry(0.05, 0.05, 4.4), chrome, sx, 1.45, -0.6); // bow rails
  for (const [sx, sz] of [[-0.55, 1.6], [0.55, 1.6], [0, 2.5]]) add(new THREE.BoxGeometry(0.75, 0.45, 0.7), new THREE.MeshLambertMaterial({ color: 0xd21f26 }), sx, 1.28, sz); // seats
  add(new THREE.BoxGeometry(0.5, 0.35, 0.45), dark, 0, 1.3, 3.55); // outboard cowling
  const pole = add(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6), chrome, 0.9, 1.8, 3.0);
  g.add(makeFlag(0.9, 2.45, 3.0, 0.9)); pole.castShadow = true;
  const wake = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false }));
  wake.scale.set(5, 1.4, 1); wake.position.set(0, 0.1, 4.6); g.add(wake);
  g.scale.setScalar(1.5); // a real cruiser: the v24 boat was smaller than the car and vanished in the pier shot
  g.position.set(55.8, 0, -174);
  scene.add(g); boat = g;
}
// Merah Putih: red over white, waving slightly
function makeFlag(x, y, z, w) {
  const f = new THREE.Group();
  for (const [c, dy] of [[0xd21f26, w * 0.17], [0xf4f1ea, -w * 0.17]]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.34), new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
    p.position.set(w / 2, dy, 0); f.add(p);
  }
  f.position.set(x, y, z); f.rotation.y = 0.5;
  return f;
}
// palms as two InstancedMeshes (trunks + fronds): the whole coast costs 2 draw calls. spot: [x, z, lean toward -z (the sea), height scale]
function makePalms(spots) {
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.42, 7, 8), new THREE.MeshLambertMaterial({ color: 0x6a4a2a }), spots.length);
  const fronds = new THREE.InstancedMesh(new THREE.ConeGeometry(0.7, 4.4, 6), new THREE.MeshLambertMaterial({ color: 0x2e7a3a }), spots.length * 6);
  const d = new THREE.Object3D();
  spots.forEach(([x, z, lean = 0, h = 1], i) => {
    const L = 7 * h, ty = L * Math.cos(lean), tz = z - L * Math.sin(lean);
    d.position.set(x, ty / 2, (z + tz) / 2); d.rotation.set(-lean, 0, 0); d.scale.set(1, h, 1); d.updateMatrix(); trunks.setMatrixAt(i, d.matrix);
    d.scale.set(1, 1, 1);
    for (let f = 0; f < 6; f++) {
      const a = (f / 6) * Math.PI * 2 + i * 1.3;
      d.position.set(x + Math.cos(a) * 1.6, ty + 0.5, tz + Math.sin(a) * 1.6);
      d.rotation.set(-Math.sin(a) * 1.05, 0, Math.cos(a) * 1.05); d.updateMatrix(); fronds.setMatrixAt(i * 6 + f, d.matrix);
    }
  });
  for (const m of [trunks, fronds]) { m.castShadow = true; m.frustumCulled = false; scene.add(m); } // instances span the map; skip the single-sphere cull
}
// static extras (beachgoers, market crowd) baked into one vertex-coloured mesh: 1 draw call however many people
function bakeCrowd(people) {
  const pos = [], nor = [], col = [], v = new THREE.Vector3(), nm = new THREE.Matrix3();
  for (const p of people) {
    p.updateMatrixWorld(true);
    p.traverse(m => {
      if (!m.isMesh) return;
      const a = m.geometry.attributes; nm.getNormalMatrix(m.matrixWorld);
      for (let i = 0; i < a.position.count; i++) {
        v.fromBufferAttribute(a.position, i).applyMatrix4(m.matrixWorld); pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(a.normal, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z);
        col.push(a.color.getX(i), a.color.getY(i), a.color.getZ(i));
      }
    });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const mesh = new THREE.Mesh(g, PERSON_MAT); mesh.castShadow = true; scene.add(mesh);
  return mesh;
}
// a person posed and placed for bakeCrowd. pose: 'stand' | 'walk' | 'sit' | 'lie' | 'swim'
function extra(x, z, ry, pose, o) {
  const p = makePerson(randPerson(Object.assign({ lite: true }, o)));
  p.position.set(x, 0, z); p.rotation.y = ry;
  if (pose === 'walk') poseStride(p, Math.random() < 0.5 ? 0.7 : -0.7);
  else if (pose === 'sit') { poseSeated(p); p.position.y = -0.45; }
  else if (pose === 'lie') { p.rotation.set(-Math.PI / 2, ry, 0, 'YXZ'); p.position.y = 0.16; } // flat on the towel, then turned
  else if (pose === 'swim') p.position.y = -1.45;
  return p;
}
// parked scooter (motor), one merged mesh
function makeScooter(x, z, ry, c) {
  const P = [[0.12, 0.5, 0.5, 0x141414, 0, 0.25, 0.62], [0.12, 0.5, 0.5, 0x141414, 0, 0.25, -0.62], [0.36, 0.3, 1.0, c, 0, 0.5, -0.05], [0.34, 0.16, 0.7, 0x1a1a1a, 0, 0.74, -0.15],
    [0.3, 0.7, 0.2, c, 0, 0.75, 0.55], [0.7, 0.06, 0.06, 0x2a2a2a, 0, 1.14, 0.58], [0.16, 0.12, 0.06, 0xffe9b0, 0, 1.0, 0.67], [0.16, 0.08, 0.04, 0xd21f26, 0, 0.62, -0.58]];
  const m = new THREE.Mesh(mergeBoxes(P), PERSON_MAT); m.position.set(x, 0, z); m.rotation.y = ry; m.rotation.z = 0.12; m.castShadow = true; scene.add(m);
}
/* ---------- Pantai Senja: beach + pier life (umbrellas, loungers, lifeguard tower, warung, jukung outriggers, people) ---------- */
let foamMats = [], sunPathMat = null;
function buildBeach() {
  const M = c => new THREE.MeshLambertMaterial({ color: c });
  const put = (geo, mat, x, y, z, ry) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry; m.castShadow = true; scene.add(m); return m; };
  const flat = (w, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); scene.add(m); return m; };
  // shoreline: wet sand band + two foam lines that pulse in animate()
  flat(120, 2.6, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16, depthWrite: false }), 60, 0.056, -161.7);
  for (const [z, w] of [[-163.5, 1.5], [-167.5, 0.8]]) { const fm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }); foamMats.push(fm); flat(124, w, fm, 60, 0.07, z); }
  // the sun's path on the water, toward the low golden-hour sun (only lit at golden hour)
  sunPathMat = new THREE.MeshBasicMaterial({ map: GLOW_TEX, color: 0xffa040, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  const sp = flat(26, 230, sunPathMat, 26, 0.15, -255); sp.rotation.order = 'YXZ'; sp.rotation.set(-Math.PI / 2, 0.22, 0);
  // low dunes break up the flat sand
  for (const [x, z, r] of [[18, -140, 7], [88, -141, 8], [106, -156, 6], [8, -153, 5], [70, -139, 5]]) { const d = put(new THREE.SphereGeometry(r, 14, 6), sandMat, x, -0.1, z); d.scale.y = 0.09; d.castShadow = false; d.receiveShadow = true; }
  // striped umbrellas, towels, loungers
  const stripes = (c1, c2) => { // an 8-panel umbrella canopy, panels alternating c1/c2
    const geo = new THREE.ConeGeometry(1.7, 0.6, 8).toNonIndexed(), p = geo.attributes.position, col = [], a = new THREE.Color(c1), b = new THREE.Color(c2);
    for (let i = 0; i < p.count; i += 3) { const ang = Math.atan2(p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2), p.getX(i) + p.getX(i + 1) + p.getX(i + 2)); const c = Math.floor((ang + Math.PI) / (Math.PI / 4)) % 2 ? a : b; for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return geo;
  };
  const white = M(0xf4f1ea), wood = M(0x8a6a44);
  [[38, -156, 0xd21f26], [62, -157, 0x2e6fc2], [71, -151, 0xe8a81c], [33, -150, 0x2e8b57], [78, -159, 0xff8a3d], [44, -161, 0x7a5cff],
    [26, -157, 0xe8a81c], [20, -151, 0xd21f26], [12, -158, 0x2e6fc2], [86, -153, 0x2e8b57], [94, -159, 0xd21f26], [102, -152, 0x7a5cff], [110, -158, 0xff8a3d], [58, -151, 0xff5a8a]].forEach(([x, z, c], i) => {
    put(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), white, x, 1.3, z);
    put(stripes(c, 0xf4f1ea), PERSON_MAT, x, 2.75, z).rotation.z = 0.12;
    put(new THREE.BoxGeometry(0.95, 0.03, 1.9), M(pick(SCARVES)), x + 1.1, 0.075, z + 0.4, 0.3).castShadow = false; // towel
    if (i % 2 === 0) { // lounger: seat + raised back
      put(new THREE.BoxGeometry(0.7, 0.1, 1.5), white, x - 1.3, 0.35, z + 0.3);
      put(new THREE.BoxGeometry(0.7, 0.1, 0.75), white, x - 1.3, 0.62, z - 0.6).rotation.x = -0.9;
    }
  });
  // lifeguard tower with the Merah Putih, surfboards in the sand
  const tw = [74, -146];
  for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) put(new THREE.BoxGeometry(0.14, 2.4, 0.14), white, tw[0] + dx, 1.2, tw[1] + dz);
  put(new THREE.BoxGeometry(2.3, 0.15, 2.3), wood, tw[0], 2.45, tw[1]);
  put(new THREE.BoxGeometry(1.8, 1.2, 1.8), M(0xd21f26), tw[0], 3.1, tw[1]);
  put(new THREE.BoxGeometry(2.4, 0.12, 2.4), M(0xffd94a), tw[0], 3.76, tw[1]);
  put(new THREE.CylinderGeometry(0.04, 0.04, 2, 6), white, tw[0] + 0.9, 4.8, tw[1]);
  scene.add(makeFlag(tw[0] + 0.9, 5.5, tw[1], 1.3));
  [[0xffd94a, -0.2], [0x5fd6ff, 0.1], [0xd21f26, 0.25]].forEach(([c, rz], i) => put(new THREE.BoxGeometry(0.55, 2.3, 0.09), M(c), tw[0] - 2.4 + i * 0.75, 1.0, tw[1] - 1.6).rotation.z = rz);
  // warung ES KELAPA: coconut-ice stall facing the city
  const wx0 = 66, wz0 = -161;
  put(new THREE.BoxGeometry(3, 1, 1.3), wood, wx0, 0.5, wz0);
  put(new THREE.BoxGeometry(3.6, 0.12, 2.4), M(0x2e8b57), wx0, 2.5, wz0 - 0.3);
  for (const sx of [-1.6, 1.6]) put(new THREE.BoxGeometry(0.1, 2.5, 0.1), wood, wx0 + sx, 1.25, wz0 + 0.6);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: signTexture('ES KELAPA', '#4be07a'), transparent: true }));
  sign.position.set(wx0, 3.0, wz0 + 0.9); scene.add(sign);
  for (let i = 0; i < 5; i++) put(new THREE.SphereGeometry(0.2, 8, 6), M(0x4a8a2a), wx0 - 1 + i * 0.5, 1.15, wz0 + 0.2);
  // palms: a row lining the coastal road (both kerbs) + a leaning grove across the sand, so the beach frames the pier shot
  const palms = [];
  for (let x = -146; x <= 150; x += 11) if (V_ROADS.every(r => Math.abs(x - r) > 7)) palms.push([x, -130.5, 0.05 + (x & 3) * 0.04, 0.95 + (x & 7) * 0.03]);
  for (let x = -140; x <= 150; x += 14) if (V_ROADS.every(r => Math.abs(x - r) > 8)) palms.push([x, -112.5, 0, 1]);
  palms.push([6, -140, 0.2], [100, -142, 0.25], [26, -136, 0.15, 1.1], [86, -137, 0.2], [114, -152, 0.3], [16, -147, 0.3, 1.15], [38, -141, 0.22, 1.05],
    [31, -145, 0.32, 0.9], [62, -140, 0.18, 1.1], [80, -143, 0.3, 0.95], [94, -147, 0.35, 1.05], [106, -146, 0.28], [2, -152, 0.35, 0.9], [118, -140, 0.2, 1.1],
    // shoreline palms either side of the pier: the pier camera looks out to sea from z≈-141, so everything above sits behind/beside it
    [39, -156, 0.3, 1.05], [33, -161, 0.4, 0.95], [58.5, -153, 0.32, 1.1], [62, -160.5, 0.42, 0.9], [24, -161, 0.38], [82, -162, 0.4, 1.05], [14, -163, 0.3, 0.9], [96, -163, 0.35]);
  makePalms(palms);
  // parked scooter by the pier steps, Merah Putih on bamboo poles along the sand, a jukung pulled up on the shore
  makeScooter(45.6, -145.5, 0.5, 0xd21f26); makeScooter(56.4, -144.5, -0.4, 0x5fd6ff);
  for (const [x, z] of [[28, -153], [88, -150]]) { put(new THREE.CylinderGeometry(0.05, 0.06, 5, 6), wood, x, 2.5, z); scene.add(makeFlag(x, 4.7, z, 1.2)); }
  // pier furniture: hand rails, two lamps, a life ring, crates, piles under the deck where it runs over the water
  for (const sx of [-2.25, 2.25]) put(new THREE.BoxGeometry(0.08, 0.08, 38), wood, 50 + sx, 1.3, -151).castShadow = false;
  for (const [x, z] of [[47.7, -137], [52.3, -163]]) {
    put(new THREE.CylinderGeometry(0.08, 0.1, 4.2, 6), M(0x2a2a34), x, 2.4, z);
    const lh = put(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe9b0 }), x, 4.6, z);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xffe9b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(4, 4, 1); glow.position.copy(lh.position); scene.add(glow); lampGlows.push(glow);
  }
  const ring = put(new THREE.TorusGeometry(0.38, 0.1, 8, 16), M(0xff7a1a), 52.32, 1.0, -156, Math.PI / 2);
  put(new THREE.BoxGeometry(0.8, 0.8, 0.8), wood, 48.4, 0.8, -158.5, 0.3); put(new THREE.BoxGeometry(0.6, 0.6, 0.6), M(0x6a4a2a), 48.5, 1.5, -158.4, 0.8);
  for (let z = -162; z > -171; z -= 3.1) for (const sx of [-2.1, 2.1]) put(new THREE.CylinderGeometry(0.18, 0.18, 1.6, 6), wood, 50 + sx, -0.55, z);
  // jukung: Balinese outrigger fishing boats with bright sails, out on the bay; buoys
  [[30, -200, 0.3, 0xd21f26], [96, -214, -0.4, 0xffd94a], [4, -238, 1.2, 0x2e6fc2], [64, -232, 2.6, 0xff8a3d], [20, -160, 1.45, 0x2e8b57], [104, -161, 1.75, 0xd21f26]].forEach(([x, z, ry, c]) => {
    const j = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 5), white); hull.position.y = 0.2; j.add(hull);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.12, 5.02), M(c)); band.position.y = 0.38; j.add(band);
    for (const sx of [-2.1, 2.1]) { const fl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 6), wood); fl.rotation.x = Math.PI / 2; fl.position.set(sx, 0.08, 0); j.add(fl); }
    for (const sz of [-1, 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.07, 0.07), wood); arm.position.set(0, 0.6, sz); j.add(arm); }
    const sailGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.6, -1.6), new THREE.Vector3(0, 4.2, 0.4), new THREE.Vector3(0, 0.8, 1.8)]); sailGeo.computeVertexNormals();
    j.add(new THREE.Mesh(sailGeo, new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide })));
    j.position.set(x, 0, z); j.rotation.y = ry; j.scale.setScalar(1.3); scene.add(j);
  });
  for (const [x, z] of [[40, -184], [72, -188], [18, -176]]) put(new THREE.CylinderGeometry(0.35, 0.45, 0.9, 8), M(0xff5a3a), x, 0.3, z);
  // gulls over the water
  const gullMat = M(0xf4f1ea);
  for (const [x, y, z] of [[44, 15, -190], [49, 17, -196], [70, 19, -205], [30, 22, -215], [86, 14, -186]]) for (const s of [-1, 1]) { const w = put(new THREE.BoxGeometry(0.9, 0.04, 0.22), gullMat, x + s * 0.42, y, z); w.rotation.z = s * 0.35; w.castShadow = false; }
  // people: on towels, in the surf, at the warung, fishing off the end of the pier
  const person = (x, z, ry, extra, pose) => { const p = makePerson(randPerson(extra)); p.position.set(x, 0, z); p.rotation.y = ry; if (pose) pose(p); scene.add(p); return p; };
  person(39.4, -156.6, 0.4, { shorts: true, long: false }, p => { poseSeated(p); p.position.y = -0.8; });
  person(63.1, -156.6, 0, { style: 'long', shirt: 0xd21f26, shorts: true, long: false }, p => { p.rotation.x = -Math.PI / 2; p.position.y = 0.16; });
  person(57.5, -162.6, 1.9, { shirt: 0xf4f1ea }, p => { poseStride(p, 0.2); p.name = 'pierTip'; });
  person(59.0, -162.9, -1.3, { style: 'hijab', scarf: 0x2e6fc2, shirt: 0x5fd6ff }, p => { poseStride(p, -0.2); p.name = 'pierTip'; });
  person(42, -160.4, Math.PI, { shorts: true, long: false }, p => poseStride(p, 0.6));
  person(66, -162.0, 0, { style: 'cap', capCol: 0x2e8b57, shirt: 0xf4f1ea, accent: 0x2e8b57 }); // warung seller
  person(73.4, -144.95, Math.PI, { shirt: 0xd21f26, shorts: true, long: false, style: 'cap', capCol: 0xffd94a }, p => { p.position.y = 2.52; }); // lifeguard
  // fisherman on the west edge, legs over the water (the boat is moored on the east side)
  person(48.2, -167, -Math.PI / 2, { style: 'peci', shirt: 0x7a5cff, accent: 0xffd94a }, p => { poseSeated(p, true); p.position.y = -0.4; p.name = 'pierTip'; });
  Object.assign(put(new THREE.CylinderGeometry(0.02, 0.03, 4, 5), M(0x3a2a1a), 46.4, 1.8, -167), { name: 'pierTip' }).rotation.z = 1.0; // 'pierTip': the fight still hides these beside its camera
  for (const [x, z] of [[45, -171], [62, -168], [67, -182]]) person(x, z, Math.random() * 6, {}, p => { p.position.y = -1.5; }); // swimmers: heads above the water
  ring.castShadow = false;
  // beachgoers (baked, 1 draw call): sunbathers, strollers along the waterline, kids in the surf, a group by the warung
  const crowd = [];
  [[27.2, -156.6], [21.2, -150.6], [87.2, -152.6], [95.2, -158.6], [103.2, -151.6], [13.2, -157.6]].forEach(([x, z], i) => crowd.push(extra(x, z, 0.3 + i, 'lie', { shorts: true, long: false })));
  [[19, -151.5], [85, -153.5], [111, -158.4], [34, -150.6]].forEach(([x, z], i) => crowd.push(extra(x, z, i * 1.7, 'sit', { shorts: i % 2 === 0, long: false })));
  for (let i = 0; i < 9; i++) { const x = 8 + i * 12 + (i % 2) * 3; if (Math.abs(x - 50) > 7) crowd.push(extra(x, -162.2 - (i % 3) * 0.6, i % 2 ? Math.PI / 2 : -Math.PI / 2, 'walk', { shorts: i % 3 === 0 })); }
  for (const [x, z] of [[24, -166], [30, -168], [82, -167], [90, -169], [98, -166], [16, -167]]) crowd.push(extra(x, z, Math.random() * 6, 'swim'));
  for (const [x, z, ry] of [[64.2, -159.4, 0.4], [67.6, -159.2, -0.3], [69.4, -160.4, -1.2]]) crowd.push(extra(x, z, ry + Math.PI, 'stand')); // queue at ES KELAPA
  for (const [x, z, ry] of [[36.5, -146, 2.6], [37.4, -146.8, -0.6], [92, -145, 1.6], [42.5, -150, 3.0], [60.5, -147.5, 0.4]]) crowd.push(extra(x, z, ry, 'stand'));
  bakeCrowd(crowd);
}
function buildGarage() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(24, 9, 18), new THREE.MeshLambertMaterial({ color: 0x8a2a26 }));
  body.position.y = 4.5; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(25, 0.8, 19), new THREE.MeshLambertMaterial({ color: 0x3a3a44 }));
  roof.position.y = 9.4; g.add(roof);
  const signTex = signTexture("BARA'S GARAGE", '#ffd94a');
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(20, 5), new THREE.MeshBasicMaterial({ map: signTex, transparent: true }));
  sign.position.set(0, 6.4, 9.15); g.add(sign);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xffd94a, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.set(24, 7, 1); glow.position.set(0, 6.4, 9.6); g.add(glow); neonGlows.push(glow);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshLambertMaterial({ color: 0x2a2a34 }));
  door.position.set(-3, 3, 9.06); g.add(door);
  // turntable disc
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.5, 28), new THREE.MeshLambertMaterial({ color: 0x6a6a72 }));
  disc.position.set(0, 0.25, -2); disc.receiveShadow = true; g.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 0.18, 8, 40), new THREE.MeshBasicMaterial({ color: 0xf5c542 }));
  ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.55, -2); g.add(ring);
  // tyre stacks
  for (const tx of [-9, 9]) {
    for (let i = 0; i < 3; i++) {
      const tyre = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.55, 14), new THREE.MeshLambertMaterial({ color: 0x181818 }));
      tyre.position.set(tx, 0.3 + i * 0.58, 6); tyre.castShadow = true; g.add(tyre);
    }
  }
  g.position.set(GARAGE.x, 0, GARAGE.z);
  scene.add(g);
}
function buildProps() {
  // street lamps along the roads
  const lampPoleMat = new THREE.MeshLambertMaterial({ color: 0x2a2a34 });
  const lampHeadMat = new THREE.MeshBasicMaterial({ color: 0xffe9b0 });
  for (const rx of V_ROADS) for (const rz of [-120, -60, 0, 60, 120]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 6.4, 8), lampPoleMat);
    pole.position.set(rx + 5.6, 3.2, rz); pole.castShadow = true; scene.add(pole);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), lampHeadMat);
    head.position.set(rx + 5.6, 6.6, rz); scene.add(head);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xffe9b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(5, 5, 1); glow.position.copy(head.position); scene.add(glow); lampGlows.push(glow);
  }
  // palms along Ocean Boulevard
  makePalms(Array.from({ length: 10 }, (_, i) => [-120 + i * 26, (i % 2 === 0) ? 44 : -44]));
  // hydrants + bins near junctions
  for (const jx of [-50, 0, 50]) for (const jz of [-60, 0, 60]) {
    const hyd = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.1, 8), new THREE.MeshLambertMaterial({ color: 0xd21f26 }));
    hyd.position.set(jx + 7.5, 0.55, jz + 7.5); hyd.castShadow = true; scene.add(hyd);
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 1.2, 8), new THREE.MeshLambertMaterial({ color: 0x2e6f5a }));
    bin.position.set(jx - 7.5, 0.6, jz - 7.5); bin.castShadow = true; scene.add(bin);
  }
  // traffic cones + barriers near the pier
  for (let i = 0; i < 6; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 10), new THREE.MeshLambertMaterial({ color: 0xff7a1a }));
    cone.position.set(30 + i * 4, 0.55, -128); cone.castShadow = true; scene.add(cone);
  }
}
// Pasar Malam night market: a row of stalls under lantern strings between the z=60 road and the next block
function buildNightMarket() {
  const wood = new THREE.MeshLambertMaterial({ color: 0x7a5a34 }), pole = new THREE.MeshLambertMaterial({ color: 0x2a2a34 });
  const cloth = [0xd21f26, 0xe8a81c, 0x2e8b57, 0x2e6fc2, 0xff8a3d].map(c => new THREE.MeshLambertMaterial({ color: c }));
  const xs = [-42, -35, -28, -21, -14, 14, 21, 28, 35, 42];
  xs.forEach((x, i) => {
    const t = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 1.6), wood); t.position.set(x, 0.45, 71); t.castShadow = true; scene.add(t);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.12, 2.3), cloth[i % 5]); roof.position.set(x, 2.35, 71); roof.castShadow = true; scene.add(roof);
    for (const sx of [-1.4, 1.4]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.3, 0.08), pole); p.position.set(x + sx, 1.15, 70); scene.add(p); }
    for (let g = 0; g < 3; g++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), cloth[(i + g + 1) % 5]); b.position.set(x - 0.8 + g * 0.8, 1.05, 71); scene.add(b); }
  });
  for (const [a, b] of [[-45, -11], [11, 45]]) { // lantern string, sagging between two poles
    const pts = [];
    for (let k = 0; k <= 20; k++) { const u = k / 20, x = a + (b - a) * u; pts.push(new THREE.Vector3(x, 4.2 - Math.sin(u * Math.PI) * 0.9, 69.4)); }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x1a1a22 })));
    pts.forEach((p, k) => {
      if (k % 2) return;
      const l = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: k % 4 ? 0xff9f2e : 0xff4a3a, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
      l.scale.set(1.1, 1.1, 1); l.position.copy(p).y -= 0.3; scene.add(l); neonGlows.push(l);
    });
    for (const x of [a, b]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.4, 6), pole); p.position.set(x, 2.2, 69.4); scene.add(p); }
  }
  const tex = signTexture('PASAR MALAM', '#ff9f2e');
  for (const ry of [0, Math.PI]) { // gate banner over the x=0 road, readable from both directions
    const s = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.2), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    s.position.set(0, 6.2, 72 + (ry ? -0.05 : 0.05)); s.rotation.y = ry; scene.add(s);
  }
  for (const x of [-6.2, 6.2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 7.2, 8), pole); p.position.set(x, 3.6, 72); scene.add(p); }
  /* past the gate the x=0 street becomes the market: paved plaza, two rows of stalls, string lights, a crowd */
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const cx = cv.getContext('2d');
  cx.fillStyle = '#7a5a4a'; cx.fillRect(0, 0, 64, 64); cx.fillStyle = '#8e6a56'; cx.fillRect(2, 2, 28, 28); cx.fillRect(34, 34, 28, 28); cx.fillStyle = '#6e5244'; cx.fillRect(34, 2, 28, 28); cx.fillRect(2, 34, 28, 28);
  const ptex = new THREE.CanvasTexture(cv); ptex.wrapS = ptex.wrapT = THREE.RepeatWrapping; ptex.repeat.set(10, 22);
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(21, 46), new THREE.MeshLambertMaterial({ map: ptex }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.045, 90); plaza.receiveShadow = true; scene.add(plaza);
  // stalls: table, goods, side posts, a two-step awning sloping to the aisle, a warm bulb box; all merged into one mesh
  const AW = [0xd21f26, 0xe8a81c, 0x2e8b57, 0x2e6fc2, 0xff8a3d, 0xff5a8a, 0x7a5cff, 0x4be07a], P = [];
  for (const side of [-1, 1]) for (let k = 0; k < 10; k++) {
    const z = 70 + k * 4.4, x = side * 9, c = AW[(k * 3 + (side > 0 ? 1 : 0)) % AW.length], c2 = AW[(k * 3 + 4) % AW.length];
    P.push([1.6, 0.9, 3.4, 0x7a5a34, x, 0.45, z]); // table
    for (let g = 0; g < 4; g++) P.push([0.5, 0.28, 0.6, AW[(k + g + 2) % AW.length], x - side * 0.3, 1.04, z - 1.2 + g * 0.8]); // produce crates
    for (const dz of [-1.75, 1.75]) P.push([0.08, 2.6, 0.08, 0x2a2a34, x + side * 0.7, 1.3, z + dz], [0.08, 2.3, 0.08, 0x2a2a34, x - side * 1.0, 1.15, z + dz]);
    P.push([1.2, 0.1, 3.8, c, x + side * 0.4, 2.62, z], [1.3, 0.1, 3.8, c2, x - side * 0.8, 2.38, z], [0.06, 0.45, 3.8, c, x - side * 1.45, 2.18, z]); // awning + valance
    P.push([0.25, 0.2, 0.25, 0xffe9b0, x - side * 0.4, 2.2, z]); // bulb
    if (k % 3 === 1) P.push([0.9, 0.5, 0.9, 0x5a5a62, x - side * 2.2, 0.25, z + 2.1], [0.8, 0.12, 0.8, 0xff7a1a, x - side * 2.2, 0.56, z + 2.1]); // charcoal grill (sate / jagung bakar)
  }
  const stalls = new THREE.Mesh(mergeBoxes(P), PERSON_MAT); stalls.castShadow = stalls.receiveShadow = true; scene.add(stalls);
  ['SATE', 'MARTABAK', 'ES TEH', 'NASI GORENG', 'JAGUNG', 'BAKSO'].forEach((t, i) => { // banners face the aisle
    const side = i % 2 ? 1 : -1, s = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7), new THREE.MeshBasicMaterial({ map: signTexture(t, '#' + AW[i].toString(16).padStart(6, '0')), transparent: true }));
    s.position.set(side * 7.5, 3.15, 74.4 + i * 6.6); s.rotation.y = -side * Math.PI / 2; scene.add(s);
  });
  // string lights: zig-zag strands across the aisle + one along each stall row; bulbs are additive points (glow only at night)
  const bulbs = [], bc = [], segs = [], BC = [0xffd27a, 0xff6a4a, 0xffe9b0, 0x7affb0, 0xff9f2e], cc = new THREE.Color();
  const strand = (a, b, sag, n) => {
    for (let k = 0; k <= n; k++) {
      const u = k / n, p = a.clone().lerp(b, u); p.y -= Math.sin(u * Math.PI) * sag;
      if (k) segs.push(bulbs[bulbs.length - 1], p);
      bulbs.push(p); cc.setHex(BC[bulbs.length % BC.length]); bc.push(cc.r, cc.g, cc.b);
    }
  };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  for (let z = 70; z < 112; z += 5.5) strand(V(-8, 4.6, z), V(8, 4.6, z + 2.75), 0.9, 14);
  for (const x of [-7.6, 7.6]) strand(V(x, 3.4, 68), V(x, 3.4, 112), 0.35, 30);
  scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs), new THREE.LineBasicMaterial({ color: 0x1a1a22 })));
  const bg = new THREE.BufferGeometry().setFromPoints(bulbs); bg.setAttribute('color', new THREE.Float32BufferAttribute(bc, 3));
  const lights = new THREE.Points(bg, new THREE.PointsMaterial({ map: GLOW_TEX, size: 1.3, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(lights); lampGlows.push(lights);
  scene.add(new THREE.Points(bg, new THREE.PointsMaterial({ size: 0.16, vertexColors: true }))); // the bulbs themselves, lit or not
  for (const x of [-8, 8]) for (let z = 70; z < 112; z += 5.5) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.6, 5), pole); p.position.set(x, 2.3, z + (x > 0 ? 2.75 : 0)); scene.add(p); }
  makeScooter(6.6, 67.6, 1.4, 0xe8a81c); makeScooter(-6.8, 112.4, -1.6, 0x2e6fc2);
  // crowd: browsing the stall fronts on both kerbs, sitting at the grills, strolling the stall row along the z=60 road
  const crowd = [];
  for (const side of [-1, 1]) for (let k = 0; k < 15; k++) {
    const z = 69 + k * 2.9 + (side > 0 ? 1.3 : 0), x = side * (6.1 + (k % 3) * 0.55);
    crowd.push(extra(x, z, k % 4 === 0 ? (side > 0 ? 0 : Math.PI) : side * Math.PI / 2 + (k % 2 ? 0.4 : -0.4), k % 4 === 0 ? 'walk' : 'stand'));
  }
  for (const x of [-42, -35, -28, -21, -14, 14, 21, 28, 35, 42]) crowd.push(extra(x + 0.6, 69.0, 0.3, 'stand'), extra(x - 1.6, 68.2, x > 0 ? -Math.PI / 2 : Math.PI / 2, 'walk'));
  for (const side of [-1, 1]) for (const k of [1, 4, 7]) crowd.push(extra(side * 5.7, 70 + k * 4.4 + 2.1, side * Math.PI / 2, 'sit')); // on stools at the grills
  bakeCrowd(crowd);
}
function buildCash() {
  const goldMat = new THREE.MeshPhongMaterial({ color: 0xffd94a, emissive: 0x8a6a10, shininess: 90 });
  for (const [cx, cz] of CASH_SPOTS) {
    const grp = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.32, 0.45), goldMat);
      bar.position.set((i % 3) * 0.95 - 0.9, 0.18 + Math.floor(i / 3) * 0.36, (i % 2) * 0.4 - 0.2);
      bar.rotation.y = (i * 0.4) % 0.8 - 0.4;
      grp.add(bar);
    }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xffd94a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(4, 4, 1); glow.position.y = 1; grp.add(glow);
    grp.position.set(cx, 0, cz);
    scene.add(grp);
    cashStashes.push({ x: cx, z: cz, grp, taken: false });
  }
  // street cash: a banknote bundle under a green light column you can see from a block away
  const noteMat = new THREE.MeshLambertMaterial({ color: 0x3fae5a, emissive: 0x1d5a2a }), beamMat = new THREE.MeshBasicMaterial({ color: 0x4be07a, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (const [cx, cz, val] of CASH_PICKUPS) {
    const grp = new THREE.Group();
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.36), noteMat); b.position.set(0, 0.12 + i * 0.21, 0); b.rotation.y = i * 0.5; grp.add(b); }
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 9, 10, 1, true), beamMat); beam.position.y = 4.5; grp.add(beam);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0x4be07a, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(3, 3, 1); glow.position.y = 0.8; grp.add(glow);
    grp.position.set(cx, 0, cz); scene.add(grp);
    cashStashes.push({ x: cx, z: cz, grp, taken: false, val });
  }
}
function buildCheckpoint() {
  cpMarker = new THREE.Group();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, 0.3, 24), new THREE.MeshBasicMaterial({ color: 0xf5c542, transparent: true, opacity: 0.55 }));
  cyl.position.y = 0.2; cpMarker.add(cyl);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 2.2, 26, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd94a, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.y = 13; cpMarker.add(beam);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.16, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffe066 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.35; cpMarker.add(ring);
  scene.add(cpMarker);
  cpBeacon = new THREE.PointLight(0xffd94a, 0.9, 30);
  scene.add(cpBeacon);
}

/* ---------- time of day ---------- */
// the clock runs 1 game-hour per 2 real minutes: golden 17-20, night 20-05:30, day otherwise
const todFor = c => c >= 20 || c < 5.5 ? 'night' : c >= 17 ? 'golden' : 'day';
function updateClock(dt) {
  S.clock += dt / 120;
  if (S.clock >= 24) { S.clock -= 24; S.day++; toast('🌅 DAY ' + S.day + ' in Senja Bay'); }
  if (todFor(S.clock) !== S.tod) applyTimeOfDay(todFor(S.clock));
}
function setClock(c) { S.clock = c; applyTimeOfDay(todFor(c)); }
function applyTimeOfDay(mode) {
  S.tod = mode;
  if (mode === 'night') {
    S.night = true;
    skyMat.uniforms.top.value.setHex(0x0a1230); skyMat.uniforms.mid.value.setHex(0x1a2450); skyMat.uniforms.bot.value.setHex(0x05060f);
    scene.fog.color.setHex(0x0a1230); scene.fog.near = 90; scene.fog.far = 300;
    sun.intensity = 0.12; sun.color.setHex(0x8aa0d0); sun.position.set(-90, 120, -60);
    amb.intensity = 0.32; amb.color.setHex(0x5a6a9a); hemi.intensity = 0.28; rim.intensity = 0.12;
    buildingMats.forEach(m => { m.emissiveIntensity = 0.9; });
    facadeGlowMats.forEach(m => { m.opacity = 0.5; });
    neonGlows.forEach(g => { g.material.opacity = 0.85; });
    lampGlows.forEach(g => { g.material.opacity = 0.8; });
    cloudMats.forEach((m, i) => { m.opacity = i % 3 ? 0.28 : 0.14; });
    sunBall.visible = false; moonBall.visible = true;
    sandMat.color.setHex(0x8a7a5a); grassMat.color.setHex(0x2a4a26); seaMat.color.setHex(0x0a2a44);
    if (arunika) {
      arunika.userData.headMat.emissiveIntensity = 2.2;
      arunika.userData.headGlow.forEach(g => { g.material.opacity = 0.72; });
      arunika.userData.beam.material.opacity = 0.055;
      arunika.userData.beamPool.material.opacity = 0.12;
      arunika.userData.rimStrip.material.opacity = 0.52;
      if (arunika.userData.tailGlow) arunika.userData.tailGlow.forEach(g => { g.material.opacity = 0.6; });
    }
    S.wxTxt = '🌙 NIGHT · NEON HOUR · 24°C';
  } else if (mode === 'day') {
    S.night = false;
    skyMat.uniforms.top.value.setHex(0x2e6fc2); skyMat.uniforms.mid.value.setHex(0x7ec8e8); skyMat.uniforms.bot.value.setHex(0xbfe8ff);
    scene.fog.color.setHex(0x9fc8e8); scene.fog.near = 130; scene.fog.far = 380;
    sun.intensity = 1.25; sun.color.setHex(0xfff2d0); sun.position.set(-90, 120, -60); sunBall.position.set(-160, 90, -300);
    amb.intensity = 0.72; amb.color.setHex(0xffffff); hemi.intensity = 0.6; rim.intensity = 0.4;
    buildingMats.forEach(m => { m.emissiveIntensity = 0.1; });
    facadeGlowMats.forEach(m => { m.opacity = 0.04; });
    neonGlows.forEach(g => { g.material.opacity = 0.08; });
    lampGlows.forEach(g => { g.material.opacity = 0; });
    cloudMats.forEach((m, i) => { m.opacity = i % 3 ? 0.92 : 0.72; });
    sunBall.visible = true; moonBall.visible = false;
    sandMat.color.setHex(0xd6b277); grassMat.color.setHex(0x5d8a4a); seaMat.color.setHex(0x1d6f8f);
    if (arunika) {
      arunika.userData.headMat.emissiveIntensity = 0.7;
      arunika.userData.headGlow.forEach(g => { g.material.opacity = 0; });
      arunika.userData.beam.material.opacity = 0;
      arunika.userData.beamPool.material.opacity = 0;
      arunika.userData.rimStrip.material.opacity = 0.12;
      if (arunika.userData.tailGlow) arunika.userData.tailGlow.forEach(g => { g.material.opacity = 0.16; });
    }
    S.wxTxt = '☀ DAY · CLEAR SKY · 31°C';
  } else {
    S.night = false;
    skyMat.uniforms.top.value.setHex(0x2e6fc2); skyMat.uniforms.mid.value.setHex(0xff9a3d); skyMat.uniforms.bot.value.setHex(0x3a1c4a);
    scene.fog.color.setHex(0xffc07a); scene.fog.near = 110; scene.fog.far = 340;
    sun.intensity = 1.05; sun.color.setHex(0xffe0b3); sun.position.set(-150, 55, -70); sunBall.position.set(10, 36, -330); // low over the bay, seen from the pier
    amb.intensity = 0.56; amb.color.setHex(0xffe8cc); hemi.intensity = 0.5; rim.intensity = 0.7; rim.color.setHex(0xff9a3d);
    buildingMats.forEach(m => { m.emissiveIntensity = 0.15; });
    facadeGlowMats.forEach(m => { m.opacity = 0.07; });
    neonGlows.forEach(g => { g.material.opacity = 0.16; });
    lampGlows.forEach(g => { g.material.opacity = 0; });
    cloudMats.forEach((m, i) => { m.opacity = i % 3 ? 0.9 : 0.65; });
    sunBall.visible = true; moonBall.visible = false;
    sandMat.color.setHex(0xd6b277); grassMat.color.setHex(0x5d8a4a); seaMat.color.setHex(0x1d6f8f);
    if (arunika) {
      arunika.userData.headMat.emissiveIntensity = 0.8;
      arunika.userData.headGlow.forEach(g => { g.material.opacity = 0; });
      arunika.userData.beam.material.opacity = 0;
      arunika.userData.beamPool.material.opacity = 0;
      arunika.userData.rimStrip.material.opacity = 0.16;
      if (arunika.userData.tailGlow) arunika.userData.tailGlow.forEach(g => { g.material.opacity = 0.3; });
    }
    S.wxTxt = '🌇 SENJA · GOLDEN HOUR · 28°C';
  }
  // sea glints, the sun's path on the water and the surf follow the light
  const sea = { night: [0x4a5a90, 0.35, 0, 0x7a8aa0], day: [0x9fd0ff, 0.35, 0, 0xffffff], golden: [0xffa850, 0.6, 0.5, 0xffffff] }[mode];
  seaMat.emissive.setHex(sea[0]); seaMat.emissiveIntensity = sea[1]; sunPathMat.opacity = sea[2]; foamMats.forEach(m => m.color.setHex(sea[3]));
}
