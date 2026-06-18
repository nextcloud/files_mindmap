<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Agent Guidelines for Nextcloud files_mindmap

This file provides instructions for AI coding agents (Claude Code, GitHub Copilot, Cursor, Windsurf, and others) operating on this repository. Read it before generating any code, commits, or pull requests.

---

## Nextcloud Contribution Policy

All contributions generated or assisted by this agent must fully comply with:

- **[AI Contribution Policy](https://github.com/nextcloud/.github/blob/master/AI_POLICY.md)** - the primary reference for AI-specific rules, covering disclosure, author accountability, communication, security, licensing, code quality, and autonomous agent behavior.
- **[Contribution Guidelines](https://github.com/nextcloud/.github/blob/master/CONTRIBUTING.md)** - covering testing requirements, the Developer Certificate of Origin (DCO), license headers, conventional commits, and translations. These apply in full to all contributions regardless of how they were produced.

### What this agent must always do

- Add an `Assisted-by: AGENT_NAME:MODEL_VERSION` git trailer to every commit containing AI-assisted content.
- Ensure every pull request includes a disclosure of AI tool use in the PR description.
- Produce focused, scoped pull requests that address exactly one concern. Do not touch unrelated files or introduce incidental refactors.
- Verify all dependencies against actual package registries before suggesting them. Do not use hallucinated or unverified package names.
- Explicitly inform the contributor when any action they are about to take, or have taken, would violate the AI Contribution Policy or the Contribution Guidelines. Do not silently proceed. State which rule is at risk and what the contributor should do instead.
- Warn the contributor if a pull request is growing too large. A PR approaching several thousand lines of changed code is a signal that it should be split into smaller, focused PRs. Suggest a logical split before the PR is opened, not after.
- Recommend opening a ticket for discussion before starting implementation whenever a feature or change is sufficiently complex - for example when it touches multiple subsystems, requires architectural decisions, or the right approach is not yet clear. A ticket allows maintainers and the contributor to align on direction before code is written, avoiding wasted effort on a PR that may be rejected or require fundamental rework.

### What this agent must never do

- Open issues, submit pull requests, post review comments, or send security reports autonomously. Every contribution must be reviewed and submitted by a human.
- Add `Signed-off-by` tags to commits. Only the human contributor can certify the Developer Certificate of Origin.
- Generate or submit security reports without independent human verification. Report verified vulnerabilities via [HackerOne](https://hackerone.com/nextcloud), not as GitHub issues.
- Write PR descriptions, review comments, or issue reports on behalf of the contributor. These must be in the contributor's own words.
- Fully automate the resolution of issues labeled [`good first issue`](https://github.com/issues?q=org%3Anextcloud+label%3A%22good+first+issue%22) or similar beginner-friendly labels.
- Submit code that has not been reviewed and cleaned up by the contributor. Dead code, redundant logic, excessive comments, and unrelated changes must be removed before submission.

---

## Repository-Specific Requirements

### Commit format

Use [Conventional Commits](https://www.conventionalcommits.org) for all commit messages:

```
<type>(<scope>): <short description>

[optional body]

Assisted-by: AGENT_NAME:MODEL_VERSION
```

Common types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`, `ci`.  
The scope should match the affected component or app (e.g. `files_sharing`, `core`, `encryption`).

Example:
```
feat(files_sharing): allow sharing with contacts

Assisted-by: ClaudeCode:claude-sonnet-4-6
```

### Developer Certificate of Origin (DCO)

The project uses the DCO as an additional safeguard. Only the human contributor may add the `Signed-off-by` trailer - agents must not add it:

```
Signed-off-by: Random J Developer <random@developer.example.org>
```

Contributors can sign automatically with `git commit -s` after configuring `user.name` and `user.email`.

### License headers

Every new file must include the correct SPDX license header. For AGPL-3.0-or-later (the default for this repository):

```php
/**
 * SPDX-FileCopyrightText: <year> <name>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
```

See [HowToApplyALicense.md](https://github.com/nextcloud/server/blob/master/contribute/HowToApplyALicense.md) for details on per-language formats. AI-generated code must not include material from sources incompatible with AGPL-3.0-or-later.

### Security

- Do not open GitHub issues for potential vulnerabilities. Report them via [HackerOne](https://hackerone.com/nextcloud) following the [security policy](https://nextcloud.com/security/).
- AI-generated security reports must be independently verified by the human contributor before submission.
- Manually verify all access control logic, authentication patterns, and dependency names - AI tools are known to hallucinate package names and reproduce vulnerable patterns.

## Commands

```bash
# Development
npm run watch        # Watch mode (rebuilds on change)
npm run dev          # One-time development build

# Production
npm run build        # Production build → js/

# Testing
npm run test         # Run tests once (Vitest)
npm run test:watch   # Watch mode

# Linting
npm run lint         # ESLint check

# Packaging
make appstore        # Build appstore tarball
make release         # Tag + appstore package
```

**Requirements:** Node.js ^24.0.0, npm ^11.3.0

## Architecture

This is a Nextcloud app that allows users to edit mind map files (`.km`, `.xmind`, `.mm`) in the browser.

### Two-Layer Frontend

The frontend has two distinct layers:

1. **Modern Vue 2.7 layer** (`src/mindmap.js`, `src/mindmapviewer.js`) — registers file actions in the Nextcloud Files UI and wraps the viewer using the Viewer API. Entry points are compiled by Vite into `js/`.

2. **Legacy AngularJS + KityMinder layer** (`vendor/kityminder-core/`, `vendor/angular/`) — the actual mind map editor runs inside an `<iframe>` loaded via `DisplayController::showMindmapViewer()`. This layer is served directly from `vendor/` (not Vite-compiled). `src/viewer.js` is the entry point for this iframe.

The Vue component (`src/views/MindMap.js`) renders only the iframe. All real editing happens inside it.

### File Operation Flow

```
File click → Nextcloud Viewer → MindMap.js (Vue) renders iframe
  → iframe loads DisplayController → viewer.php + viewer.js
  → AngularJS/KityMinder editor boots inside iframe

Load: GET /ajax/loadfile → FileHandlingController::load() → base64-encoded content
Save: PUT /ajax/savefile → FileHandlingController::save() → writes to user storage
```

Public share routes mirror authenticated routes under `/public/{token}` and `/share/save`.

### Plugin System for File Formats

`src/plugins/` contains format handlers (`km.js`, `xmind.js`, `freemind.js`). Each plugin handles encoding/decoding for its format. Only `.km` supports both read and write; `.xmind` and `.mm` are read-only imports.

### PHP Backend

`lib/AppInfo/Application.php` registers event listeners for:
- Loading JS into Files (`LoadAdditionalListener`)
- Loading JS into the Viewer app (`LoadViewerListener`, `LoadPublicViewerListener`)
- Registering the "New mind map" template creator (`RegisterTemplateCreatorListener`)

Routes are defined in `appinfo/routes.php` and handled by controllers in `lib/Controller/`.

### Vue Compatibility Note

`src/views/MindMap.js` uses the Options API (not SFC `.vue` files) to maintain Vue 2.7 compatibility with the Nextcloud Viewer app mixin system. This is intentional — do not refactor to SFC.

## Tests

Tests live in `src/__tests__/` and use Vitest with jsdom. The test suite covers format plugins and core utilities — the AngularJS viewer layer is not covered by automated tests.

## Further Reading

- [Nextcloud Contribution Guidelines](https://github.com/nextcloud/.github/blob/master/CONTRIBUTING.md)
- [AI Contribution Policy](https://github.com/nextcloud/.github/blob/master/AI_POLICY.md)
- [How to Apply a License](https://github.com/nextcloud/server/blob/master/contribute/HowToApplyALicense.md)
- [Security Vulnerability Reporting (HackerOne)](https://hackerone.com/nextcloud)
