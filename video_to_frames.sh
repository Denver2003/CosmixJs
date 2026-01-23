#!/bin/bash

# Проверка аргументов
if [ "$#" -ne 2 ]; then
  echo "Использование: ./video_to_frames.sh <video_file> <interval_seconds>"
  exit 1
fi

VIDEO="$1"
INTERVAL="$2"

# Проверка файла
if [ ! -f "$VIDEO" ]; then
  echo "Файл не найден: $VIDEO"
  exit 1
fi

# Имя папки = имя видео без расширения
BASENAME=$(basename "$VIDEO")
NAME="${BASENAME%.*}"
OUTDIR="${NAME}_screenshots"

mkdir -p "$OUTDIR"

echo "📸 Извлекаю кадры каждые $INTERVAL сек из $VIDEO"
echo "📂 Папка: $OUTDIR"

ffmpeg -i "$VIDEO" \
  -vf "fps=1/${INTERVAL}" \
  -q:v 2 \
  "$OUTDIR/frame_%04d.png"

echo "✅ Готово"