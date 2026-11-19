# Four guest residents: archived native 128 px motion sheets

For **Momo**, **Homura**, **Aizen** and **Madoka**, the four separately generated motion sheets were retrieved from the earlier `Wordville_Motion_Review.html` review. The original embedded PNG bytes are committed unmodified.

| Asset | Location | Frames |
|---|---|---|
| walk, idle, talk, sit | `app/src/main/assets/residents128/<resident>/<action>.png` | 12 columns × 8 rows, 128 × 128 px per cell |
| Original portraits | `app/src/main/assets/guest-residents/` | Individual Momo JPG; Homura, Aizen and Madoka WebP |
| Earlier guest atlas | `app/src/main/assets/guest-residents/walk.png` / `idle.png` | 48 px fallback |

Each action PNG is 1536 × 1024 pixels. Row order: front, front-right, right, back-right, back, back-left, left, front-left. 

`resident128-loader.js` now registers all four guests, using the same foot-anchor/canvas scaling as the existing native-128 residents. The renderer uses walk-distance frame selection, looping idle/talk animation and a sitting sequence that stops on the final frame. The existing 48 px guest renderers and the portraits remain unchanged and act as fallbacks or gallery artwork.

Check `npm test` and the GitHub Actions Android build triggered on pushes to `main`.
