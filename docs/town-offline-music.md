# Wordville Town offline BGM

The user supplied five original MP3 files. Wordville selects a track from the **displayed** Town hour (including manual clock preview) and the **manual pixel weather selector**. This is not an external real-weather forecast.

| Weather | Town hours (device local time) | Music |
| --- | --- | --- |
| clear or wind | 06:00–10:59 | 01_morning_sunny.mp3 |
| clear or wind | 11:00–16:59 | 02_noon_sunny.mp3 |
| clear or wind | 17:00–19:59 | 03_evening_sunny.mp3 |
| clear or wind | 20:00–05:59 | 04_night_clear.mp3 |
| clouds, overcast, rain | all hours | 05_cloudy.mp3 |

Android WebView requires a user tap to start audio. Open **Town → ⚙ → ♫ 배경음악 켜기**. The track automatically changes with Town time and weather. Audio pauses when Wordville is backgrounded, and resumes on return if the user enabled it. It loops until switched off.

## Install the supplied music assets (single ZIP)

Download the five-file `wordville-music.zip` handoff. From the GitHub web UI, select the `design/town-resident-affinity` branch and upload this ZIP to `app/src/main/assets/wordville-music.zip`. The build workflow runs `scripts/install-town-music.py` to securely unpack all five tracks into the APK; the ZIP must contain:
- `audio/01_morning_sunny.mp3`
- `audio/02_noon_sunny.mp3`
- `audio/03_evening_sunny.mp3`
- `audio/04_night_clear.mp3`
- `audio/05_cloudy.mp3`

Without the ZIP or the five unpacked files, Android compilation stays green, but the music button will display an MP3 missing error when tapped. **Do not claim that the music is bundled until the ZIP has been committed and the new workflow run succeeds.**
