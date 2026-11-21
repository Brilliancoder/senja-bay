# SENJA BAY — submission checklist (v22)

## Deliverables

- [x] Public GitHub repo: Brilliancoder/senja-bay (branch main)
- [x] `main.ts` at repo root (Node 22, builds the dossier)
- [x] `vendor/makefun-game.ts` — kit file, byte-identical, unchanged
- [x] `game/index.html` — the game, written fresh in the recorded
      session (2,194 lines, ~123 KB, 3 inline script blocks)
- [x] `game/three.min.js` — vendored Three.js r149 (local, no CDN)
- [x] 4 screenshots in `screenshots/`, 1280x720 JPEG, each <= 256 KiB:
  - 1-driving.jpg — Job 8/8 chase, 4 stars, full HUD
  - 2-garage.jpg — Bara's garage shop open, all 7 items priced
  - 3-mission.jpg — explosion + "UNIT DOWN · +15 REP"
  - 4-night.jpg — genuine night, lit windows, lamps, taillights
- [x] OSI licence (`LICENSE`)
- [x] `.makefun/owner.json` — wallet claim (already on main)
- [x] Repo About set: description, homepage, topics

## Verification (this session)

- [x] node --check passes on all 3 inline script blocks
- [x] grep for forbidden names (comet/komet/solara/rockstar/vice city/
      lucia/jason) returns 0
- [x] probe-play-v20.mjs: 4/4 PASS, 0 page errors
  - car stops at building wall (minPx 38.2)
  - Raka stops at building wall (minWx 50.0)
  - police stay on roads (0/64 samples inside buildings)
  - traffic collision (min centre distance > 2.0)
  - census: 8 traffic / 8 peds / 5 police
- [x] All 4 screenshots visually confirmed by reading the images
- [x] HUD complete in every shot: wanted stars, money, weapons,
      minimap, speedo, job, dispatch, crew, dialogue
- [x] Improvement edit made in a later message of the same session
      (traffic lane return, explosion shot timing, HUD position fix,
      setupShot mesh sync, rim/envMap lighting) — thinking_revised

## Authorship (v22)

- Recording 01a1fd6a-e623-71c2-a844-6e0610e94cd4 (started before this
  session). Only this session authored the code — no Codex, no other
  agent touched `game/index.html`.
- `game/index.html` written fresh in 8 chunks, then edited again in
  later messages of the same session (bug fixes + improvements).
- `README.md` and this checklist written fresh in this session.
- `main.ts`: 1 authored header comment line added in this session.
- `game/three.min.js`: vendored library, copied (allowed).

## Still to do (parent)

- [ ] Commit + push text files to GitHub main
- [ ] Upload the 4 screenshots via the GitHub web UI (binary files)
- [ ] Send the 4 screenshots to the user for review
- [ ] On the user's "post" order: write usage rows for this session,
      seal recording 01a1fd6a, submit as round 3 before
      Tue 24 Nov 2026 22:00 WIB
