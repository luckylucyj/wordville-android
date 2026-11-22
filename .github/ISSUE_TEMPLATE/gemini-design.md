---
name: Gemini design handoff
about: Send a completed Gemini UI design to Codex for an automated, tested draft PR
title: "[Gemini Design Ready] "
labels: []
assignees: []
---

## Design specification

Describe the intended screen, visual layout, exact sizes and colors, asset paths, component state changes, interactions, and accessibility requirements.

## Image and asset paths

List images **already committed** to the repository under `app/src/main/assets/`. An image attachment in an issue is a visual reference, not necessarily an APK-ready PNG file.

## Existing behavior to preserve

Identify screens and local storage/state that must remain unchanged.

## Acceptance tests

Write testable criteria. Include tap behaviors, screen-size checks, and missing-art handling.

## Notes

Submit the issue as GitHub user `luckylucyj`. The exact title prefix `[Gemini Design Ready]` starts an automatic Codex run **only when the OpenAI API secret is configured**.
