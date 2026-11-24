# SENJA BAY

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Brilliancoder/senja-bay/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Brilliancoder/senja-bay/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

An original open-world crime game for the make.fun GTA 6 bounty (gta6-01) — [https://make.fun/bounty/gta6-01](https://make.fun/bounty/gta6-01).
Playable in a desktop browser from static files — no network request, no
build step. Keyboard + mouse, with touch controls on mobile.

## The game

You are **Raka**, a driver out of prison and back on the streets of
**Senja Bay**, a golden-hour coastal city policed by the **SJPD**. Your
fixer **Dara** has eight jobs for you, one last plan to get out clean.
Drive the **ARUNIKA GT**, build your crew, stay ahead of the heat.

### Story — 8 missions

1. **FIRST GEAR** — reach the Marina Pier checkpoint.
2. **LOSE THE HEAT** — stay hidden for 15 seconds.
3. **PIER DELIVERY** — drop the package at Pasar Malam.
4. **STREET RACE** — four checkpoints against the clock.
5. **SWAP PLATES** — get to Bara's garage and press G.
6. **NIGHT RUN** — three drops across the city after dark.
7. **PIER STANDOFF** — disable three SJPD units.
8. **THE BOAT** — drive out along Marina Pier to the boat and leave Senja Bay.

Between jobs the city is yours: after each job you free-roam until you
drive (or walk) into the next fixer's blip — their initial on the
minimap and a gold ring in the street. Finish job 8 to unlock endless
free roam. NIGHT RUN forces nightfall; THE BOAT ends at a speedboat
moored off the end of Marina Pier.

### The city

- 16-block grid with varied buildings, neon signage, rooftop props,
  awnings, balconies, a pier with a moored cruiser, a bay, and a
  distant skyline.
- **Pantai Senja beach**: striped umbrellas, loungers, a lifeguard tower
  flying the Merah Putih, an ES KELAPA warung, beach-goers and swimmers,
  a fisherman off the pier, and jukung outrigger boats on a bay with
  rolling swells, surf and sun glints.
- **Pasar Malam night market**: a row of stalls under lantern strings,
  with a PASAR MALAM gate over the road.
- **A clock that moves**: one game-hour every two real minutes, from
  golden hour to neon night to day, with a day counter. Press **T** to
  skip to dusk or night.
- 18 traffic cars on both road axes, turning at junctions (Senja Bay
  keeps left), each with a driver at the wheel, and 30 pedestrians
  walking the sidewalks — faces, hair, hijabs, peci caps, striped
  shirts, swinging arms and legs. Run one over or shoot one and they go
  down (+1 star).
- Street lamps, palms, hydrants, bins, cones.
- A pier gator that chases Raka on foot. Walk over gold cash stashes
  for +$150 each.

### Systems

- **Wanted 0–5 stars** — SJPD units chase and set roadblocks; a unit
  that stops to fire puts a khaki-uniformed officer on the street,
  and a helicopter joins at 3 stars. Stars only fade while no unit is
  within 45 m. Out of sight, the units sweep the last place they saw
  you (a red search circle on the minimap) until you hear **LOST THEM**.
  Stop next to a unit for 2.5 s and you're **BUSTED** ($200 bail). Lose
  all your health and it's **TUMBANG** ($300 clinic bill).
- **Carjacking** — on foot, walk up to any street car and **[F] STEAL**
  it. You drive *that* car (the speedo reads `STOLEN · <model>`), the
  driver bails out and runs, and your Arunika stays parked where you
  left it.
- **Garage shop (E near Bara's garage)** — Full Repair $400, Armour
  Plating $800 (halves damage), Ammo Refill $300, four paints $600.
- **Crew abilities** — Z: Sinta swaps plates (−1 star), X: Bara quick
  fix (+40% condition), C: Nara marks police on the minimap.
- **Combat** — five weapons, live ammo, tracers, muzzle flash, and
  explosions when a police unit or your car is destroyed.
- **Driving** — nitro (Shift, top speed 31 → 45), drift chains with a
  shown multiplier (`DRIFT ×3 · +$30`), near-miss bonuses and damage. A
  wrecked car explodes, and Bara tows you back to the garage.
- **On foot** — WASD to move and strafe, mouse or ←/→ to turn, a centre
  reticle, and click to shoot.
- **Cinematic intro** — letterbox cards, then passenger banter during
  drives, a phone with Dara's live mission text, and a radio
  (Senja 101.9, press R).
- **Progression** — money, RP ranks (Rookie → Legend), and localStorage
  saves: automatic after every job, or press **K** / use the pause menu.
- **Pause menu** (P / Esc) — Resume, Save, Controls, Quit to title.
- **Collision** — the car, Raka on foot, police, and traffic all collide
  with buildings and each other; no wall-clipping.
- **Sound** — procedural WebAudio: engine hum, sirens, gunshots,
  explosions, chimes. Press U to mute.

### Controls

| Key | Action |
| --- | --- |
| W A S D / arrows | Drive / walk (A/D strafe on foot) |
| Mouse / ← → | Turn on foot |
| Shift | Nitro in the car, sprint on foot |
| V (hold) | Focus: slow time |
| Space | Brake / handbrake |
| E | Exit car / enter or steal a car |
| Mouse click | Shoot |
| 1–5 | Switch weapon |
| F / G / H | Crew: Sinta / Bara / Nara |
| B | Bara's garage: shop, or swap plates on job 5 (near the garage) |
| C | Horn |
| T | Day / night |
| R | Radio |
| M | Pause menu on the city map (click to set a waypoint) |
| O | Phone |
| P / Esc | Pause menu: MAP · STATS · CREW · CONTROLS · SAVE |
| K | Save to the current slot |
| U | Mute |

The title menu has CONTINUE, NEW GAME, LOAD (three save slots) and SETTINGS (radio, shadows, radar, controls). A controls bar along the bottom of the screen shows the main keys during play.

Touch: on-screen joystick, FIRE, BRAKE, NITRO, ENTER, MAP, SHOP.

## Run it

Open `game/index.html` in a browser, or serve the folder:

```
npx serve game
```

`main.ts` (Node 22) builds the submission dossier. `vendor/makefun-game.ts`
is the kit file, unchanged.

### Code layout

`game/index.html` holds the HUD markup and styles. It loads plain classic
scripts in this order (they share globals):

| File | What it does |
| --- | --- |
| `src/data.js` | Helpers, game state, the 8 missions, banter, crew, shop, world layout, save/rank |
| `src/flow.js` | What makes jobs play differently: rival racers, pier waves, stunt ramps, street cash respawn, Dara's live lines, story texts, the free-roam side race |
| `src/audio.js` | Procedural WebAudio: engine, siren, shots, boom |
| `three.min.js` | Three.js (vendored) |
| `src/world.js` | Sky, lights, roads, bay and pier, boat, city blocks, garage, props, night market, clock and time of day |
| `src/vehicles.js` | Car, traffic, SJPD and heli meshes; driving, wrecks, carjacking |
| `src/actors.js` | Pedestrians, Raka on foot, gator, collision, traffic, police and heli AI |
| `src/combat.js` | Explosions, tracers, wanted level (sight, search, arrest), damage, weapons |
| `src/missions.js` | Jobs, job cards, free roam and contacts, busted/tumbang, garage, crew abilities |
| `src/hud.js` | Shop, phone, map, radio, HUD panels, minimap, intro and start screen |
| `src/main.js` | Input, pause menu, camera, screenshot staging, touch, main loop, rain, boot |

The screenshots come from `index.html?shot=cover|fight|pier|neon`.
These modes freeze the simulation and pose the actors directly.

## Credits

All content is original — no Rockstar assets, names, or footage. Built
with Three.js (vendored in `game/three.min.js`). City, characters, and
story are invented for this bounty.
