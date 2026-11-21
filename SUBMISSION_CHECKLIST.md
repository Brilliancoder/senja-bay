# SENJA BAY — Submission checklist (gta6-01)

Updated 2026-11-21 ~14:20 WIB (v20 rebuild — game/index.html written fresh in this session, in chunks, for the authorship gate). Deadline: 2026-11-24T15:00:00Z (Tue 24 Nov 22:00 WIB).
Reward: $1,666 total, top 100 share (1st $500, 2nd $250, 3rd $150, 4th-10th $38).
Route: **GitHub repo Brilliancoder/senja-bay** (user decision 2026-11-20; replaces the source-bundle plan).

## Deliverables (all in this repo)

- [x] `main.ts` at repo root (Node 22, stdlib only; copies `game/` + `screenshots/` to /output, writes dossier.json)
- [x] `vendor/makefun-game.ts` copied from kit-v30, unchanged
- [x] `game/index.html` — the game, written fresh in this session (2,017 lines), plus vendored `game/three.min.js`
- [x] `screenshots/` — exactly 4 JPEGs, each 1280x720 and ≤256 KiB, real renders of the game's own code
- [x] `LICENSE` (MIT), `README.md` with kit badges (Brilliancoder/senja-bay, no placeholders)
- [x] `.makefun/owner.json` with the payout wallet

## Verification (v20, run 2026-11-21)

- [x] `node --check` PASS on all 3 inline script blocks (extracted to logs/v20-check/)
- [x] `grep comet|komet` = 0 — the car is ARUNIKA GT, never Comet
- [x] Playwright probe-play 4/4 PASS, 0 page errors
- [x] 4 fresh screenshots taken from the rebuilt game, visually checked
- [x] Text files pushed to GitHub main; screenshots uploaded via the GitHub web UI (connector is text-only)

## Game contents (v20 = v19 feature set, re-authored)

- On-foot mode (F), carjacking, combat (5 weapons, live ammo, tracers)
- 8 missions with checkpoints/timers/rewards and auto-save; mission 8 ending = victory + free-roam
- Dynamic wanted 0-5 stars, helicopter at 3+ stars, roadblocks, police fire back, real police tactics
- Save (localStorage, S), garage (G) with working shop (E: Full Repair $400, Armour $800, Ammo $300, 4 paints $600)
- Explosions (police HP 0 → fireball + wreck; player condition 0 = big explosion + mission fail)
- Nitro (Shift) + near-miss +$100 and drift x2-x5, day/night toggle (T), radio (R), pause map (M), start screen
- Crew abilities Z/X/C (Sinta Swap Plates -1 star 60s CD, Bara Quick Fix +40% condition 45s CD, Nara Eyes Out marks police/roadblocks on minimap 20s, 30s CD)
- Cinematic intro (letterbox + 3 cards, 3s each, click/Enter skips), passenger banter (3 lines per mission)
- Cash stashes (6 gold stacks, walk over on foot → +$150), BUSTED sequence (red overlay, $200 bail, respawn at garage)
- Phone panel (O key, Dara's live mission text + 4 static messages), pier gator (chases on foot within 14m, bite -5 HP within 1.8m, 3s cooldown)
- Collision: SOLIDS + resolveAABB (car r=2.2, walker r=0.8, police r=2.2), per-axis push-out, circle-vs-circle, traffic braking, peds flee
- Idle autopilot (no movement key 1.5s → auto-drive to checkpoint) + stuck detector
- Procedural WebAudio sound (engine osc pitch follows speed, siren at wanted≥1, gunshot/boom/chime/click, lazy init, mute on U)
- Mobile touch controls (joystick, FIRE, BRAKE, NITRO, ENTER, MAP, SHOP) + responsive HUD

## Submit command (kit-v30)

```
node cli/makefun.mjs submit --competition gta6-01 --repo-url https://github.com/Brilliancoder/senja-bay --commit <sha> --recording <recording-id> --title "SENJA BAY" --keypair ~/.solana/makefun-id.json --mcp none --harness muse-app --harness-version 17.0.0.4.160 --provider meta --model muse-spark-1.3 --effort default
```

Quota: at most 5 submissions/day, 10 total; the last submission before the deadline is the final entry.
