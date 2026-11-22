# Wordville: GitHub Issue → Gemini design → Codex implementation

This is an additional GitHub-native automatic handoff that does not require manually copying completed design instructions from the Gemini web app.

## Two supported owner-authored GitHub issues

- **`[Gemini Design Request]`**: You write the UI goal in the GitHub Issue. A GitHub Action sends the written requirements and limited README context to the Gemini Developer API. Gemini returns a detailed UI implementation specification. Codex then implements that spec, tests the modified app in the isolated job, and proposes a draft PR.
- **`[Gemini Design Ready]`**: You already created a design specification in the Gemini website. Paste the design into the existing Issue template; Gemini API is skipped and Codex receives your authored spec.

Both modes accept issues **created by `luckylucyj` only**. Editing an issue does not retrigger paid requests; owner-only Actions manual dispatch with the issue number does.

## First use

1. In Wordville `Settings → Secrets and variables → Actions`, create two repository secrets: `GEMINI_API_KEY` and `OPENAI_API_KEY`. **Never include their values in a GitHub issue or source file.** GitHub hides the values, so an on-screen success message does not prove the exact names.
2. Select [New issue](https://github.com/luckylucyj/wordville-android/issues/new/choose) → **Gemini design request (automatic Gemini → Codex)**.
3. Write the design request and acceptance criteria, then submit. The exact title prefix `[Gemini Design Request]` is required.
4. View [Actions](https://github.com/luckylucyj/wordville-android/actions/workflows/gemini-design-codex.yml): verification → Gemini spec → Codex editing → Node tests + Chrome UI tests + Android debug compile → draft PR.
5. Review the draft PR (actual visuals on Galaxy, artwork paths and preservation of prior records), then manually approve and merge. The repository ruleset protects `main`.

The Gemini API model defaults to `gemini-3.8-flash` and can be overridden using a GitHub Actions **variable** `GEMINI_MODEL` (not a secret). If your project does not have access to that model, the Gemini job stops with an API status error; **it does not silently switch to a paid model**.

## Security and billing

- Only the issue author `luckylucyj` may trigger paid work. Public users cannot trigger the AI flow by opening random issues.
- `GEMINI_API_KEY` exists only in the isolated Gemini job's generation step. Codex does not see the Gemini key; tests and PR publication have neither API key.
- Codex is limited to changes inside approved app UI and test folders; no deletions, CI edits, application ID, signing or release changes. It cannot push directly to `main`.
- Standard GitHub Actions usage for a public repository is generally free; Gemini and OpenAI APIs have **separate quotas, pricing and billing**. Neither subscription includes the other's API charges.
- The workflow makes at most one Gemini request per Issue-triggered run. Manually rerunning or submitting more issues can incur more charges. Review your Google AI Studio and OpenAI Platform project usage/budgets.

## Limitations

- This integrates **Gemini Developer API inside GitHub Actions**, not automatic detection of completion of a *separate* conversation in the Gemini web or mobile app. Normal Gemini web chats cannot spontaneously create GitHub issues unless another authorized integration is installed.
- Gemini's generation step creates **text-based design specs**, not PNG images. To include actual Gemini-generated art, add the PNG assets to the repository separately before submitting an Issue. A screenshot/attachment attached only to the Issue is not read as pixels by this workflow.
- Chrome and Android compilation tests are automated, but design image fidelity and physical Galaxy behavior require human review.
- PR creation using the default `GITHUB_TOKEN` may not retrigger the normal PR workflow, hence the internal tests in this pipeline. The normal Android APK release remains gated on a later merge to `main`.
- No automatic merge occurs.
