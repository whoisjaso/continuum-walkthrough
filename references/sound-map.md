# Sound map (event → sound → gain before normalisation)

These are the paths in Jason's library (`~/.claude/skills/jason-video-editor/assets/sfx/`). A different library just needs the same *kind* of sound for each role. Gains are relative: the mixer normalises the whole SFX bus to −21 LUFS, so keep the ratios.

| Event | File | Gain dB |
|---|---|---|
| iMessage arrives | ios/ios_tritone.wav | −11 |
| Notification stacks in (each) | ios/ios_tink.wav | −16 … −18 (each one 0.5 dB softer) |
| Tap on a notification / button | pack5/button_2.wav (+ ios/ios_lock.wav 50 ms later) | −12 / −15 |
| Object slides / scene move | pack3/woosh.wav | −18 … −21 |
| Big scene change | pack5/deep_whoosh.wav | −18 |
| Line highlighted by hand | ios/ios_key.wav | −22 |
| Window opens | pop.wav | −15 |
| Typing (randomised 90–150 ms) | pack5/typing_2.wav / ios/ios_key.wav | −24 ± 2 |
| Number appears | ios/ios_tink.wav | −14 |
| Counter rolling | pack3/counter.wav | −17 |
| **The money figure lands** | kaching.wav | −12 |
| The sting ("just retyping", the flag) | deep_bass.wav | −15 |
| Scan bed | ui/data_loading.wav | −24 |
| Field flies into place | ios/ios_key.wav / pop.wav alternating | −16 |
| Check ticks | ios/ios_tink.wav | −14 |
| Fix tap | pack5/button_2.wav + ui/success_ui.wav + ui/switch.wav | −9 / −12 / −18 |
| Approve tap | pack5/button_1.wav | −8 |
| Last destination done | ios/ios_success.wav | −10 |
| CTA arrives | ios/ios_received.wav | −12 |
| Logo | pack3/shine.wav | −20 |

Music (v4.1): `music/theories.mp3` from 37.72 s, bed at −23 LUFS, ducked 6 dB under the voice, 3 s fade-out.
