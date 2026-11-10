---
name: continuum-walkthrough
description: Pain-first "walkthrough" motion video for a B2B offer — one continuous shot where a single real-looking object (a PO, invoice, lead, form) travels from the prospect's pain (manual retyping, hours, $ per year) into the fix, with a voiceover, iOS UI sounds, real tool logos, a soft reply CTA and the brand logo fading out alone. Use when someone asks for a demo / walkthrough / outreach video, "like the PO Desk video", "go into the pain and show what it costs", "make it a continuum", or a cold-outreach video opening "hey, this is random, but I peeped something in your business". Built from code (pure seek(t) HTML engine), ElevenLabs voice, cue-sheet SFX mix, 60 fps motion blur, 9:16 + 16:9. Scored 10/10 by Jason (PO Desk Walkthrough v4.1, 2026-11-09).
---

# Continuum Walkthrough

The benchmark is `examples/po-desk/walkthrough.html` (PO Desk Walkthrough v4.1, **10/10**). Jason: "I love the animations, sfx, etc, and the continuity type of mechanics". Every new piece has to beat it. Open the benchmark and copy how it moves before writing anything new.

## The pipeline (≈ 3–4 h of agent time; renders ≈ 1 h detached)

| # | Step | Tool | Gate |
|---|---|---|---|
| 1 | **Intake Q&A**: ask every question in `references/intake-qa.md` with the question tool (4 per call, recommended option first) | AskUserQuestion | No build before the answers are in |
| 2 | **Beat sheet + script**: fill `references/beat-sheet.md` for this offer; one VO line per beat, conversational | write `script.json` | The user approves the beat sheet |
| 3 | **Voice**: 2 takes of every line | `scripts/vo_gen.mjs` | Free-plan credits fit (see Voice) |
| 4 | **Verify + word times** | `scripts/vo_verify.sh` (whisper.cpp) | Each chosen take matches its line word for word |
| 5 | **Picture**: copy `engine/starter.html`, then build scene by scene; put every `T.*` key on the onset of the word that names it | `engine/engine.js` | Stills at each beat look right in both formats |
| 6 | **Sound**: write a cue sheet with one sound per visible event (see `references/sound-map.md`) | `scripts/mix.py cues.json` | −14 LUFS, −1 dBFS, voice lines don't overlap |
| 7 | **Gates** | `scripts/ghost_audit.mjs` for v and h | PASS. A FAIL blocks the render |
| 8 | **Render, detached** | `nohup zsh scripts/render.sh …  & disown` | Frame count = LEN × 60 for both formats |
| 9 | **Deliver** | 4 MP4s: 9×16 and 16×9, each with Voice+Music and Voice+SFX | Contact sheet (one still every 2 s) checked by eye |
| 10 | **Score**: ask for /10, log it, and turn every note into a ledger row and a gate | `references/lessons.md` | — |

Setup: `node` 20+, `ffmpeg`, `python3` with numpy, `npm i playwright-core` (or `PW_DIR`), Chrome (`CHROME=…` optional), `whisper-cli` + `ggml-small.en-q5_1.bin`.

## The story shape (do not reorder)
1. **Hook (0–5 s):** a personal, casual opener over a real-looking iMessage from the sender, with their real headshot and name: "Hey, this is random… but I peeped something in your business that could be interesting." No logo yet and no pitch.
2. **The object arrives (5–10 s):** a pile of real-looking notifications. One of them (the real document) morphs into a full, believable page: letterhead, PO number, table, totals, signature.
3. **Pain, shown (10–18 s):** a named person ("Maria") retypes it into every destination: ERP (real logo), CRM (real logo), folder, email. Her clock runs and keys click. Each destination's name is SAID in the voiceover.
4. **Pain, priced (18–26 s):** rate × hours × workdays, with a counter rolling to the yearly cost in red. The maths stays on screen in small print. Say the money.
5. **Turn (26 s):** "Here's what it looks like when that's handled for you." The **same object** comes back to the centre. Continuity is the trick.
6. **The fix (28–42 s):** a scan reads it, fields fly into a card, checks tick, one exception is flagged and explained ("10× their usual"), then one tap to fix and one tap to approve.
7. **Proof (42–51 s):** it is filed in all 4 places with real logos and checks, then a receipt with timestamps ("1 min 44 s, email to filed").
8. **CTA (51–53 s):** soft and low-pressure: "Worth a look? Just reply."
9. **Logo alone (53.8–58 s):** the wordmark by itself on an empty stage, fading out. Nothing else is on screen.

## Continuity rules (this is the look)
- One persistent object (the document) moves between layouts with `track()` springs. It is **never** cut away and re-created.
- Every scene is born out of the previous one: a notification becomes the page, the page shrinks to the side, the windows stack, and the page comes back.
- **Exits go to opacity 0 and `visibility:hidden`.** Never park a finished element at 20–50% as "background". That ghost cost v4 its silhouette ("there's a silhouette being shown the entire time after 0:18"). `ghost_audit.mjs` now fails any element held half-visible for more than 3 s.
- Springs only: `step()` with z 0.88–1.0 and no bounce. Use blur-in/blur-out on enter/exit, 60 fps with an 8-subframe, 180° shutter.
- On screen: one idea at a time, big type, borderless iOS cards, warm off-white `#F4F2EE`, ink `#0E0E0E`, one accent per meaning (red = cost/problem, green = done).
- Layouts are separate for `v` (1080×1920) and `h` (1920×1080). Design 9:16 first; the phone is the main screen.

## Realism checklist
- iMessage: real lock-screen grammar (time, date, stacked notifications, "now"/"2m ago"), sender headshot + name, tritone sound.
- Document: letter-size proportions, real field names, plausible numbers that add up, a signature, page footer.
- Logos: real SVGs (simple-icons, exact brand hex). **Only show tools the prospect actually uses or that you really integrate with.** A logo implies an integration.
- Data is made up and labelled "Sample data · made-up company". Money maths shows its formula.

## Voice (ElevenLabs)
- Key: `ELEVENLABS_API_KEY` or `ELEVENLABS_KEY_FILE`. Never print it, paste it in chat, or commit it. In T3, use `request_secret` with file delivery and delete the file when done.
- Default: voice Brian `nPczCjzI2devNBz1zQrb`, model `eleven_v4`, stability 0.45. Audio tags like `[casual]`, `[measured]`, `[serious]` and `[confident]` steer the read.
- **Free plan:** 10,000 credits a month (≈ 10,000 characters). A 60 s script is ≈ 900 characters, so 2 takes of everything is ≈ 1,800, about 5 videos a month.
- **The free plan has no commercial licence** (ElevenLabs terms). Use it for drafts and internal review. Before anything is posted or sent as marketing, generate the final takes on a paid plan (Starter is the cheapest).
- Place lines with a ≥0.3 s breath between them. Picture events snap to whisper word onsets, never to guessed times.

## Sound
Every visible event gets a sound that is audible on a phone speaker: tritone on the iMessage, tinks on notifications, key clicks on typing, a pop on each window, a cash hit on the yearly figure, a deep bass on "just retyping", a scan bed, ticks on the checks, a button sound on each tap, a success sound on the last filing, and a shine on the logo. The full map with gains is in `references/sound-map.md`. Music is an optional bed at −23 LUFS, ducked under the voice. Always deliver a Voice+SFX version too, because trending audio gets added in-app.

## Rendering gotchas
- Renders die when the host app restarts. Always run them with `nohup … < /dev/null & disown`, and check the frame count afterwards. On 2026-11-09 even that died on a host restart; prefer `screen -dmS <name> zsh -c "…"`.
- Disk: frames stream into ffmpeg and are never written to disk. `render.sh` deletes the silent intermediate after muxing.
- For an SVG or image whose `offsetWidth` is wrong (e.g. a wordmark), set `el._w` / `el._h` yourself, or it renders off-centre.
- Anything that must stay sharp under motion blur (fast "fly" chips) uses `tf` (the frame time) instead of `t`.
