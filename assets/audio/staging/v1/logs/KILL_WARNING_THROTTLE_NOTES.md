# Kill Warning Throttle Notes

Date (UTC): 2026-02-16

## Change summary
- Added `KILL_WARNING_DELAY_MS = 3000` in `scripts/config.js`.
- Updated `updateKillLine()` in `scripts/game/kill.js`.

## New behavior contract
1. Warning loop (`laser_warning_loop`) starts only after **3 seconds of continuous kill-line contact**.
2. If contact breaks before 3s, timer resets and warning never starts.
3. If warning is active and contact breaks, warning stops immediately.
4. During `killGraceUntil`, warning is forcibly stopped and warning state is reset.
5. Game over timeout remains unchanged (`KILL_DURATION_MS = 10000`).

## Rationale
- Prevent frequent short crossings of death line from triggering an annoying warning siren.
- Keep danger visuals unchanged while reducing audio fatigue.
