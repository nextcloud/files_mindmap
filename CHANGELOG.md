<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
# Changelog
All notable changes to this project will be documented in this file.

This branch provides the releases for Nextcloud 32–35. Releases for Nextcloud 36 and later come from `main`, starting with 0.2.0.

## 0.1.4-beta.1

### Added
- feat(editor): name exported files after the mind map @AndyScherzinger [#398](https://github.com/nextcloud/files_mindmap/pull/398)
- Scroll the mind map horizontally with Shift+wheel @AndyScherzinger [#403](https://github.com/nextcloud/files_mindmap/pull/403)

### Fixed
- fix(editor): wheel scrolling and Ctrl+wheel zoom in Firefox, and zoom on touchpad pinches and small steps @AndyScherzinger [#403](https://github.com/nextcloud/files_mindmap/pull/403)
- fix(sharing): load mind maps from subfolders of public shares @AndyScherzinger [#401](https://github.com/nextcloud/files_mindmap/pull/401)
- fix(editor): show the editor in regional and formal language variants @AndyScherzinger [#396](https://github.com/nextcloud/files_mindmap/pull/396)
- Load the editor logic from a hashed chunk, so updates don't run stale cached code @AndyScherzinger [#393](https://github.com/nextcloud/files_mindmap/pull/393)
- Lift vue to 3.5.44 (GHSA-g2v6-rqmx-r4w6) @AndyScherzinger [#393](https://github.com/nextcloud/files_mindmap/pull/393)
- Show the message when opening a mind map fails, and resolve chunk URLs through window.OC @AndyScherzinger [#393](https://github.com/nextcloud/files_mindmap/pull/393)

### Other
- Drop vite-plugin-static-copy @AndyScherzinger [#393](https://github.com/nextcloud/files_mindmap/pull/393)

## 0.1.3

### Fixed
- fix(sharing): fix public share viewing and password-protected shares @solracsf [#362](https://github.com/nextcloud/files_mindmap/pull/362)

### Other
- build(deps): upgrade vendored jQuery to 3.7.1 and fix deprecated-global lint @solracsf [#363](https://github.com/nextcloud/files_mindmap/pull/363)

## 0.1.2

### Fixed
- fix(sharing): require read permission to load files from public shares @solracsf [#355](https://github.com/nextcloud/files_mindmap/pull/355)

## 0.1.1

### Fixed
- Restore the AutoSave, Save and Export controls in the editor header @AndyScherzinger [#335](https://github.com/nextcloud/files_mindmap/pull/335)

### Other
- docs(agents): sync agent rules with nextcloud/.github#774 @AndyScherzinger [#336](https://github.com/nextcloud/files_mindmap/pull/336)

## 0.1.0

First release from the repository's new home in the Nextcloud organization, for Nextcloud 32–35.

### Added
- Support Nextcloud 32 and update old packages like jQuery @smarinier [#233](https://github.com/nextcloud/files_mindmap/pull/233)
- Support Nextcloud 33 @onny [#243](https://github.com/nextcloud/files_mindmap/pull/243)
- feat: make NC34 compatible @miaulalala [#247](https://github.com/nextcloud/files_mindmap/pull/247)
- Prompt for the file name when creating a mind map @AndyScherzinger [#280](https://github.com/nextcloud/files_mindmap/pull/280)

### Fixed
- fix: header buttons overlap @smarinier [#225](https://github.com/nextcloud/files_mindmap/pull/225)
- fix: Update CSP API calls for Nextcloud 31+ compatibility @miaulalala [#265](https://github.com/nextcloud/files_mindmap/pull/265)
- Ensure the viewer HTML is revalidated after updates, to avoid stale cached assets @AndyScherzinger [#276](https://github.com/nextcloud/files_mindmap/pull/276)
- Build the editor script to `js/viewer.js` again after the vite-plugin-static-copy upgrade @AndyScherzinger [#303](https://github.com/nextcloud/files_mindmap/pull/303)

### Other
- fix(transifex): Add transifex setup @nickvergessen [#219](https://github.com/nextcloud/files_mindmap/pull/219)
- chore(i18n): Aligned spelling of "mind map" and fixed grammar @rakekniven [#221](https://github.com/nextcloud/files_mindmap/pull/221)
- Update meta-data and docs to reflect the new repository home @AndyScherzinger [#235](https://github.com/nextcloud/files_mindmap/pull/235) [#236](https://github.com/nextcloud/files_mindmap/pull/236)
- feat: add tests @miaulalala [#248](https://github.com/nextcloud/files_mindmap/pull/248)
- Update authors and add the publishing workflow @AndyScherzinger [#261](https://github.com/nextcloud/files_mindmap/pull/261)
- Add a general authors file @AndyScherzinger [#277](https://github.com/nextcloud/files_mindmap/pull/277)
- Update screenshots @AndyScherzinger [#278](https://github.com/nextcloud/files_mindmap/pull/278)
- Add SPDX headers @AndyScherzinger [#279](https://github.com/nextcloud/files_mindmap/pull/279)
- ci: Add dependabot dependency updates @AndyScherzinger [#291](https://github.com/nextcloud/files_mindmap/pull/291)
- Update actions from org @AndyScherzinger [#302](https://github.com/nextcloud/files_mindmap/pull/302)
- Add AI policy check and a starting point for AGENTS.md @AndyScherzinger [#304](https://github.com/nextcloud/files_mindmap/pull/304) [#305](https://github.com/nextcloud/files_mindmap/pull/305)
- ci: Add release-relay for testing purposes @AndyScherzinger [#309](https://github.com/nextcloud/files_mindmap/pull/309)
- ci: Add npm job from org @AndyScherzinger [#328](https://github.com/nextcloud/files_mindmap/pull/328)

## 0.0.33 and older

See the [GitHub releases](https://github.com/nextcloud/files_mindmap/releases).
