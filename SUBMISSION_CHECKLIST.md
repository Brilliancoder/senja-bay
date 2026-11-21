# SENJA BAY — Submission checklist (gta6-01)

Updated 2026-11-21 ~13:35 WIB. Deadline: 2026-11-24T15:00:00Z (Tue 24 Nov 22:00 WIB).
Reward: $1,666 total, top 100 share (1st $500, 2nd $250, 3rd $150, 4th-10th $38).
Route: **GitHub repo Brilliancoder/senja-bay** (user decision 2026-11-20; replaces the source-bundle plan).

## Ready in this folder (~/workspace/gta6-brillianagent/submission/)
- [x] game/index.html v19 (153,718 bytes, 1,852 lines) + game/three.min.js vendored, no network refs
- [x] main.ts (kit starter, copies game/ + screenshots/ and writes dossier.json)
- [x] vendor/makefun-game.ts — byte-identical to the kit-v30 copy (verified with diff)
- [x] serve.ts (kit starter)
- [x] LICENSE (MIT)
- [x] screenshots/ — 4 FRESH JPEGs from v19, 1280x720, each under 256 KiB (all live gameplay):
  - 1-driving.jpg 197,548 B (chase, Job 8/8, 112 km/h), 2-garage.jpg 160,534 B (Bara's garage shop)
  - 3-mission.jpg 212,866 B (UNIT DOWN +15 REP, explosion), 4-night.jpg 168,120 B (night, neon, 4 stars)
- [x] README.md rewritten for v19 (badges filled: Brilliancoder/senja-bay, no placeholders)
- [x] v19 verified: node --check passes all 3 script blocks, grep comet/komet = 0, 0 page errors in Playwright

## Recorded final build (this session)
- [x] Sealed recording started BEFORE this build: recording 01a1fcc7-21d6-71c3-93a2-7a3ff7ae7d90
      (kit-v30 CLI, --source this repo, started ~13:24 WIB)
- [x] This session (started after the recording began) WROTE all three authorship files:
      game/index.html (v19 copy), README.md (fresh v19), SUBMISSION_CHECKLIST.md (this file)
- [x] User approved git in this repo in plain words (2026-11-21 ~13:31 WIB:
      "Ya, lanjut pakai git di repo submission GTA itu") — hooks dir holds only inert .sample files
- [ ] Push all files to GitHub Brilliancoder/senja-bay (branch main) — commit sha to be recorded here
- [ ] Verify Pages serves the pushed v19 (https://brilliancoder.github.io/senja-bay/game/)

## Submit (parent does this after the push)
- [ ] Finish the recording (kill the record PID / record --finish), then:
  - `node cli/makefun.mjs submit --competition gta6-01 --repo-url https://github.com/Brilliancoder/senja-bay --commit <sha> --recording 01a1fcc7-21d6-71c3-93a2-7a3ff7ae7d90 --title "SENJA BAY" --keypair ~/.solana/makefun-id.json`
  - Entry message is signed by wallet CaCPVKNTXSnkHmsmiwRK8n1Pns8M7bpDNA1ctJhiPdYW; payout goes to that wallet.
  - Max 5 submissions/day, 10 total; last submission before deadline is final.
- [ ] Verify live via GET /api/submissions/<id>, report the claim code + dev score.

## Notes
- Kit: ~/workspace/gta6-brillianagent/kit-v30/ (level 30, harness@e4be5fdb, scorer@12da3470). Use its CLI for record/submit.
- Node v24.22.1 on this machine satisfies Node 22.18+.
- Game dir ~/workspace/gta6-brillianagent/game/ is NOT a git repo; the submission repo here is the git repo.
- Do not put the Solana private key or the make.fun API key in the repo, README, or any screenshot.
