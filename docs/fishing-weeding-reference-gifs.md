# Reference GIFs mapped to the correct game

The two uploaded 360×640 GIFs show (1) Hachiware fishing and (2) Chiikawa with a pudding, rice ball and cake. The **second GIF is not weeding**, and rendering it under the weed mode is an error.

Upload `wordville-reference-gifs-corrected.zip` from the conversation to `app/src/main/assets/wordville-reference-gifs.zip` on the PR branch. The corrected ZIP contains:
- `images/reference/fishing.gif`
- `images/reference/foraging.gif`

The previous ZIP with `images/reference/weeding.gif` is also accepted for compatibility: the installer maps that second file to `foraging.gif`, never the weed game.

The fishing fallback is already a complete illustrated PNG with Hachiware and rod. The Canvas must paint the full original PNG/GIF **once**, not stamp another cat or procedural sprites on top. Touch controls, vocabulary and timing meters stay native DOM/Canvas and use the actual Wordville words.

Weeding stays on existing PNGs until a **weeding-specific reference** is provided. Do not claim the current weed screen is pixel-identical to the food GIF.

Without uploading the ZIP, the CI run bundles the existing PNGs rather than the two GIFs. A successful build does **not** imply the animation files are inside the APK.
