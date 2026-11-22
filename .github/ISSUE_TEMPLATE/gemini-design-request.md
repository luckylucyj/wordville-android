---
name: Gemini design request (automatic Gemini → Codex)
about: Ask Gemini API to write a Wordville UI design spec, then let Codex implement and test it in a draft PR
title: "[Gemini Design Request] "
labels: []
assignees: []
---

## Screen to redesign

Specify the Wordville screen or mini-game and what should look different.

## Visual requirements

Specify layout, colors, spacing, image asset file names, and mobile screen dimensions if known.

## Buttons and interactions

Describe what each button or gesture should do.

## Existing behavior to preserve

Preserve all learning records, resident schedules, sprites, and installed Android user data unless explicitly stated otherwise.

## Acceptance criteria

Describe observable, testable results.

## Images

Attach visual references if desired. **GitHub issue attachments are not automatically included in Gemini API input or embedded in the Android APK.** To use actual images in-app, first commit the PNG files to the appropriate `app/src/main/assets/` paths.

## Cost and trigger acknowledgment

Opening this issue as `luckylucyj` starts one Gemini API call and, if its output succeeds, a Codex/OpenAI API job. These APIs can incur separate charges. Do not include API keys or private data in issues.
