#!/usr/bin/env bash
set -euo pipefail

# gif_slicer.sh
# Usage:
#   bash ./gif_slicer.sh input.mp4 4 2 [outdir] [max_gifs=0] [start_offset_sec=0]
#
# Args:
#   1) input video path
#   2) chunk seconds (N)
#   3) compression level (1..4)
#   4) output dir (default: gifs_out)
#   5) optional: max_gifs (default: 0 = all)
#   6) optional: start_offset_sec (default: 0)

INPUT="${1:-}"
CHUNK_SEC="${2:-}"
LEVEL="${3:-}"
OUTDIR="${4:-gifs_out}"
MAX_GIFS="${5:-0}"
START_OFFSET="${6:-0}"

if [[ -z "$INPUT" || -z "$CHUNK_SEC" || -z "$LEVEL" ]]; then
  echo "Usage: bash $0 <input.mp4> <chunk_seconds> <level 1..4> [outdir] [max_gifs=0] [start_offset_sec=0]"
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found. Install it first (e.g., brew install ffmpeg)."
  exit 1
fi

if ! command -v ffprobe >/dev/null 2>&1; then
  echo "ffprobe not found (usually comes with ffmpeg)."
  exit 1
fi

if ! [[ "$CHUNK_SEC" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
  echo "chunk_seconds must be a number."
  exit 1
fi

if ! [[ "$LEVEL" =~ ^[1-4]$ ]]; then
  echo "level must be 1..4"
  exit 1
fi

mkdir -p "$OUTDIR"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

# ---- Compression presets by level ----
# Tune these if needed.
FPS=10
WIDTH=360
MAX_COLORS=64
DITHER="bayer"
BAYER_SCALE=3

case "$LEVEL" in
  1) FPS=12; WIDTH=480; MAX_COLORS=96; DITHER="bayer"; BAYER_SCALE=2 ;;
  2) FPS=10; WIDTH=360; MAX_COLORS=64; DITHER="bayer"; BAYER_SCALE=3 ;;
  3) FPS=8;  WIDTH=320; MAX_COLORS=48; DITHER="bayer"; BAYER_SCALE=4 ;;
  4) FPS=6;  WIDTH=280; MAX_COLORS=32; DITHER="none"; BAYER_SCALE=4 ;;
esac

# ---- Segmenting ----
SEG_PATTERN="$TMPDIR/seg_%05d.mp4"

# Build optional -ss safely (no arrays, compatible with old bash)
if [[ "$START_OFFSET" != "0" ]]; then
  set -- -ss "$START_OFFSET"
else
  set --
fi

# Re-encode for reliable splitting (works even when keyframes are sparse)
# -force_key_frames ensures clean cuts at multiples of CHUNK_SEC
ffmpeg -hide_banner -loglevel error \
  "$@" -i "$INPUT" \
  -an -c:v libx264 -preset veryfast -crf 18 \
  -pix_fmt yuv420p \
  -force_key_frames "expr:gte(t,n_forced*${CHUNK_SEC})" \
  -f segment -segment_time "$CHUNK_SEC" -reset_timestamps 1 \
  "$SEG_PATTERN"

# ---- Collect segments ----
shopt -s nullglob
segments=("$TMPDIR"/seg_*.mp4)
shopt -u nullglob

if [[ "${#segments[@]}" -eq 0 ]]; then
  echo "No segments were produced."
  echo "Try a smaller chunk_seconds (e.g., 2) or check input path."
  exit 1
fi

# ---- Convert each segment to GIF ----
count=0
for seg in "${segments[@]}"; do
  base="$(basename "$seg" .mp4)"
  out_gif="$OUTDIR/${base}.gif"

  # One-pass palette (best quality/size) without creating palette file:
  if [[ "$DITHER" == "none" ]]; then
    ffmpeg -hide_banner -loglevel error \
      -i "$seg" \
      -filter_complex "fps=${FPS},scale=${WIDTH}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=${MAX_COLORS}[p];[b][p]paletteuse=dither=none" \
      -y "$out_gif"
  else
    ffmpeg -hide_banner -loglevel error \
      -i "$seg" \
      -filter_complex "fps=${FPS},scale=${WIDTH}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=${MAX_COLORS}[p];[b][p]paletteuse=dither=${DITHER}:bayer_scale=${BAYER_SCALE}" \
      -y "$out_gif"
  fi

  count=$((count+1))
  echo "Created: $out_gif"

  if [[ "$MAX_GIFS" != "0" && "$count" -ge "$MAX_GIFS" ]]; then
    break
  fi
done

echo "Done. Level=$LEVEL fps=$FPS width=$WIDTH colors=$MAX_COLORS dither=$DITHER"