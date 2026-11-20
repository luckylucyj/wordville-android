#!/usr/bin/env bash
# Capture a visual-QA artifact without overriding a passed instrumentation suite.
# The Android test itself already checks that PixelCopy generated a valid, large PNG.
set -uo pipefail
SCREENSHOT="/sdcard/Android/data/com.wordville.app.village.vocabulary.safeinstall/files/wordville-map-emulator.png"
TARGET="wordville-map-emulator.png"
captured=false

for attempt in 1 2 3; do
  rm -f "$TARGET"
  if timeout 45s adb pull "$SCREENSHOT" "$TARGET"; then
    if python3 -c 'import pathlib,sys; p=pathlib.Path("wordville-map-emulator.png"); b=p.read_bytes(); sys.exit(0 if len(b)>120000 and b.startswith(b"\x89PNG\r\n\x1a\n") and b.endswith(b"IEND\xaeB\x60\x82") else 1)'; then
      captured=true
      echo "Emulator screenshot verified: $(stat -c%s "$TARGET") bytes"
      break
    fi
  fi
  echo "::warning::Screenshot ADB transfer attempt $attempt was incomplete"
  adb reconnect || true
  sleep 2
done

if [[ "$captured" != true ]]; then
  rm -f "$TARGET"
  echo "::warning::Screenshot artifact unavailable due to unstable ADB transfer. Android instrumentation results remain authoritative."
fi
exit 0
