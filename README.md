# SENJA BAY

An original open-world crime game for the make.fun GTA 6 bounty (gta6-01).
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
8. **THE BOAT** — reach the boat at Marina Pier and leave Senja Bay.

Finish job 8 to unlock **free-roam** — the city stays open, the wanted
level stays live, and the ending text hands you the keys.

### The city

- 16-block grid with varied buildings, neon signage, rooftop props,
  awnings, balconies, a pier, a beach, a park, and a distant skyline.
- Golden hour, day, and night lighting (press **T** to change the time).
- Traffic, pedestrians, street lamps, palms, hydrants, bins, cones.
- A pier gator that chases Raka on foot. Walk over gold cash stashes
  for +$150 each.

### Systems

- **Wanted 0–5 stars** — police chase, shoot, set roadblocks, and call
  in a helicopter at 3 stars and up. **BUSTED** costs a $200 bail fee.
- **Garage shop (E near Bara's garage)** — Full Repair $400, Armour
  Plating $800 (halves damage), Ammo Refill $300, four paints $600.
- **Crew abilities** — Z: Sinta swaps plates (−1 star), X: Bara quick
  fix (+40% condition), C: Nara marks police on the minimap.
- **Combat** — five weapons, live ammo, tracers, muzzle flash, and
  explosions when a police unit or your car is destroyed.
- **Driving** — nitro (Shift, top speed 31 → 45), drift chains with
  multipliers, near-miss bonuses, damage, and a working fuel gauge.
- **Cinematic intro** — letterbox cards, then passenger banter during
  drives, a phone with Dara's live mission text, and a radio
  (Senja 101.9, press R).
- **Progression** — money, respect, ranks (Rookie → Legend), a day
  counter, and localStorage auto-save (press S to save by hand).
- **Collision** — the car, Raka on foot, police, and traffic all collide
  with buildings and each other; no wall-clipping.
- **Sound** — procedural WebAudio: engine hum, sirens, gunshots,
  explosions, chimes. Press U to mute.

### Controls

| Key | Action |
| --- | --- |
| W A S D / arrows | Drive / walk |
| Shift | Nitro |
| Space | Brake / handbrake |
| F | Enter / exit car |
| Mouse click | Shoot |
| 1–5 | Switch weapon |
| G | Enter garage (near it) |
| E | Open shop (near garage) |
| Z / X / C | Crew abilities |
| T | Day / night |
| R | Radio |
| M | Big map |
| O | Phone |
| P / Esc | Pause |
| S | Save |
| U | Mute |

Touch: on-screen joystick, FIRE, BRAKE, NITRO, ENTER, MAP, SHOP.

## Run it

Open `game/index.html` in a browser, or serve the folder:

```
npx serve game
```

`main.ts` (Node 22) builds the submission dossier. `vendor/makefun-game.ts`
is the kit file, unchanged.

## Credits

All content is original — no Rockstar assets, names, or footage. Built
with Three.js (vendored in `game/three.min.js`). City, characters, and
story are invented for this bounty.
