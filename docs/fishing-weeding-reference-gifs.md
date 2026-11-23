# Fishing and weeding GIF-reference parity

The user uploaded two original 360×640 animated GIFs as visual references: fishing `22471.gif` and weeding/foraging artwork `22470.gif`. The game reads these GIFs as animated illustrations **only when bundled**; gameplay inputs, typed answer validation, score, fish count and timing meter are implemented in Wordville and are not sampled from the images.

## Add the two GIFs to the APK
Upload the supplied file `wordville-reference-gifs.zip` to `app/src/main/assets/wordville-reference-gifs.zip` on the `design/town-resident-affinity` branch. It contains `images/reference/fishing.gif` and `images/reference/weeding.gif`. Android CI unpacks them before testing/packaging.

The visual rendering falls back to existing authored fishing and generated weeding PNGs if the GIF files are not bundled, without drawing any new procedural characters at runtime. To obtain the reference appearance in the APK, you **must commit the ZIP**, and only a post-upload APK can be considered GIF-matched. The ZIP is excluded from final APK after unpacking.

Fishing and weeding share one workflow: touch the bobber/weed at the correct timing, type the Korean meaning of the word displayed directly on the play area, then check. Incorrect answers do not earn coins and enter the review queue. The old parallel multiple-choice quiz panel is hidden. The appearance is based on the user-supplied GIFs, so illustrations are kept original rather than re-created by code.
