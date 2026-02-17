# BGM Loop Prep Report

- Source: `assets/audio/bgm/Cosmix music.mp3`
- Runtime output: `assets/audio/bgm/bgm_main_loop.ogg`
- Selected loop segment: `24s -> 88s` (length 64s)
- Selection rationale: lowest boundary RMS delta among scanned 64s windows.
- Output codec: OGG Vorbis (q=5, strict -2)

## Technical checks
- Output duration: 64.000000s
- Sample rate: 48000 Hz
- Channels: 2
- Start RMS (first 0.5s): -14.963126 dB
- End RMS (last 0.5s): -14.981670 dB
- Boundary RMS delta (single loop): 0.0185 dB
- Max peak: -2.2 dB

## Seam check (x3 repeat)
- Boundary@64s: pre=-12.632077 dB, post=-14.505315 dB, delta=1.8732 dB
- Boundary@128s: pre=-12.632077 dB, post=-14.505315 dB, delta=1.8732 dB

## Artifacts
- Master WAV: `assets/audio/staging/v1/bgm_loop/bgm_main_loop_master.wav`
- Loop probe WAV (x3): `assets/audio/staging/v1/bgm_loop/bgm_main_loop_x3.wav`
- Candidate scan table: `/tmp/bgm_loop_05_candidates2.txt`
