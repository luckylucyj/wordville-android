# Gemini → GitHub Issue → Codex → draft PR (Wordville)

> **Updated 2026-11-23:** This original guide describes the manual `[Gemini Design Ready]` mode. To trigger **Gemini API design generation followed by Codex implementation without manually copying a completed Gemini spec**, use the new `[Gemini Design Request]` issue template. See [Gemini API to Codex](GEMINI_API_TO_CODEX.md) for the current workflow, cost, and limitations. A conversation finishing in the Gemini web app is not itself a GitHub event.

## Summary

- Trigger: an **open GitHub Issue** created by `luckylucyj`, whose title starts with `[Gemini Design Ready]`; or owner-only manual workflow dispatch with an existing design issue number.
- Before triggering: Gemini designs the screen and generates a Markdown specification; then the authorized owner or an integration acting as **that owner** posts it to GitHub. **Completion of a normal Gemini chat alone cannot produce a GitHub event.**
- Codex is restricted to the current repository workspace and approved app/test paths.
- The workflow runs the existing Node unit tests, Chrome browser smoke tests, and an Android debug compile. Successful runs create a **draft PR**, never a main-branch commit or merge.
- The existing `android.yml` continues to publish an APK only after a separately approved merge to `main`.

## Required one-time setup

1. In [OpenAI API keys](https://platform.openai.com/api-keys), create a separately billed API key and configure an appropriate project budget or spending guard. ChatGPT Plus is **not** API billing credit.
2. On GitHub visit `Settings → Secrets and variables → Actions → New repository secret`. Set **`OPENAI_API_KEY`**. Never commit it, paste it into an issue, or supply it to Gemini.
3. Under `Settings → Actions → General → Workflow permissions`, allow GitHub Actions to **create pull requests**, if the repository policy currently blocks this.
4. Under `Settings → Rules → Rulesets` protect `main`: require pull requests and appropriate passing status checks; require human review where supported. Do **not** add an Actions bot to bypass rules. The automation itself never merges. As of setup, no repository rulesets were listed; branch protection could not be read with the connected app.
5. Optionally use GitHub CLI, GitHub App, or a fine-grained PAT (Issues: write) in an external Gemini bridge to create the correctly titled issue as `luckylucyj`. Keep the GitHub token outside Gemini prompts and outside the repository.

## How to submit a design

In the Gemini UI, ask for a Markdown development handoff with a clear layout, target source paths, image file names, behavior and acceptance tests. Save the actual PNGs into the project assets by a separate trusted upload/push before the handoff; including an attachment link in an issue **does not** install its binary asset in the app.

Create an issue via [New issue](https://github.com/luckylucyj/wordville-android/issues/new/choose) using **Gemini design handoff** template. Submit it under `luckylucyj`, preserving the exact title prefix. Opening this Issue is the event meaning “Gemini design completed.”

If the issue already exists, manually run the **Gemini design to Codex draft PR** Action with its issue number. Editing an issue is deliberately **not** an automatic retry, to avoid repeated paid API calls.

## Billing and failure states

| Component | API key? | Charging model |
|---|---|---|
| Gemini web UI design | No Gemini Developer API key for manual use | Existing Gemini subscription/limits |
| GitHub issue handoff | GitHub authentication | Standard GitHub API, no separate API usage charge |
| Actions standard hosted runner, public repository | No | Free for public repositories under published GitHub policy |
| OpenAI Codex Action | **OPENAI_API_KEY required** | Charged separately to OpenAI API account based on model tokens |

The workflow fails **before invoking Codex** if the API secret is missing. It does not fall back to paid Gemini API automatically. API spend can vary substantially with task size: monitor the OpenAI API usage page.

## Protection, testing and limitations

- Only issues authored by the repository owner with the exact design-ready title are accepted. This rejects public users who open arbitrary issues. A Gemini integration posting from a different bot account will not trigger the workflow.
- Git checkout does not retain write credentials during the Codex job; Codex gets a restricted workspace profile and drops sudo.
- Only files under `app/src/main/assets/`, `app/src/main/java/`, `app/src/main/res/`, and `tests/` are eligible for the patch. Deletions, symlinks, and patch sizes over 30 MiB fail.
- The commit/PR job is separate from Codex's API-key job and never executes generated app code with a write token.
- The temporary Android signing key is **not** the user app's stable signing key. This job checks compilation, not update/install compatibility; the existing `android.yml` retains the stable signature tests.
- PRs created by the default `GITHUB_TOKEN` do **not** automatically trigger the repository's existing `pull_request` Actions. This workflow runs the tests internally and GitHub administrators should manually dispatch the existing Android workflow on the review branch if full device/emulator checks are required. Do not interpret the draft PR alone as CI green.
- Current Android installer/release workflow is unchanged.
- The workflow can fail when dependencies, the model, secrets, repository Actions policy, or API billing are unavailable. It cannot guarantee Gemini-to-GPT delivery until the external issue-posting integration is configured.
