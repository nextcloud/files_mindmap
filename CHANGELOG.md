<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
# Changelog
All notable changes to this project will be documented in this file.

## 0.2.0-beta.1

### Changed
- Require Nextcloud 36 and open mind maps with the `@nextcloud/viewer` library, as the viewer app was removed from the server @AndyScherzinger [#375](https://github.com/nextcloud/files_mindmap/pull/375) [#390](https://github.com/nextcloud/files_mindmap/pull/390)

### Fixed
- fix(viewer): keep the editor iframe from overflowing the viewer @AndyScherzinger [#394](https://github.com/nextcloud/files_mindmap/pull/394)

### Other
- Drop the Vue dependencies that are unused since the viewer migration @AndyScherzinger [#387](https://github.com/nextcloud/files_mindmap/pull/387)
- ci: keep stable-0.1 dependencies updated @AndyScherzinger [#391](https://github.com/nextcloud/files_mindmap/pull/391)

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

## 0.0.34

### Other
- Update links to the new repository location
- Build and publish releases with the new release workflow

## 0.0.33

### Added
- Support Nextcloud 31

## 0.0.32

### Added
- Sharing support

### Other
- Optimize the code structure

## 0.0.31

Pre-release.

### Added
- Compatibility with Nextcloud 28

## 0.0.30

### Fixed
- Public shared mind maps are no longer openable, only downloadable [#187](https://github.com/nextcloud/files_mindmap/issues/187)

## 0.0.29

### Fixed
- Move from `app.php` to the Nextcloud 20 `Application.php` [#184](https://github.com/nextcloud/files_mindmap/issues/184) [#186](https://github.com/nextcloud/files_mindmap/issues/186)

## 0.0.28

### Added
- Support Nextcloud 26 and 27
- Polish translation

### Fixed
- Menu overlapping while previewing images [#182](https://github.com/nextcloud/files_mindmap/issues/182)

## 0.0.27

### Added
- Support Nextcloud 25

## 0.0.26

### Added
- Support Nextcloud 23 and 24
- Optimistic file locking [#120](https://github.com/nextcloud/files_mindmap/issues/120)

## 0.0.25

### Changed
- Support Nextcloud 22 only

## 0.0.24

### Added
- Support Nextcloud 21

## 0.0.23

### Added
- Support Nextcloud 20

### Changed
- Make the "saving file" and "file saved" messages of autosave less prominent [#130](https://github.com/nextcloud/files_mindmap/issues/130)

### Fixed
- Export does not work at all in Chromium-based browsers [#121](https://github.com/nextcloud/files_mindmap/issues/121)

## 0.0.22

### Fixed
- Can't save from a shared link: `this.isSupportedMime is not a function` [#109](https://github.com/nextcloud/files_mindmap/issues/109)

## 0.0.21

### Fixed
- Open a mind map in a shared link folder [#101](https://github.com/nextcloud/files_mindmap/issues/101)
- XMind files with a modified title width fail to load [#105](https://github.com/nextcloud/files_mindmap/issues/105)

### Other
- Update the French translation

## 0.0.20

### Fixed
- A new file cannot be opened after creating it [#94](https://github.com/nextcloud/files_mindmap/issues/94)

## 0.0.19

### Added
- Read-only support for the FreeMind format (`*.mm`)
- Read-only support for the XMind format (`*.xmind`)

### Fixed
- Conflicts caused by Symfony in the News app 18.x

## 0.0.18

### Added
- Autosave [#85](https://github.com/nextcloud/files_mindmap/issues/85)
- Icon for the mind map mimetype [#73](https://github.com/nextcloud/files_mindmap/issues/73)
- Show the file name when opening a mind map file [#80](https://github.com/nextcloud/files_mindmap/issues/80)

## 0.0.17

### Added
- Traditional Chinese, Italian and French translations, and updates to several others

## 0.0.16

### Added
- Support Nextcloud 18 and 19

## 0.0.15

### Added
- Export to PDF, Markdown and text [#50](https://github.com/nextcloud/files_mindmap/issues/50)

## 0.0.14

### Added
- Collaborative editing through share links [#25](https://github.com/nextcloud/files_mindmap/issues/25)
- Russian translation

### Fixed
- Links in notes open in the current window
- Cannot open mind map files in the browser after upgrading Nextcloud [#46](https://github.com/nextcloud/files_mindmap/issues/46)
- Cannot open a copy of a mind map file [#48](https://github.com/nextcloud/files_mindmap/issues/48)

## 0.0.13

### Fixed
- Incomplete display at low resolutions

## 0.0.12

### Added
- Support Nextcloud 16

### Fixed
- Several bugs

## 0.0.11

No release notes.

## 0.0.10

No release notes.

## 0.0.9

No release notes.

## 0.0.8

No release notes.

## 0.0.7

No release notes.

## 0.0.6

No release notes.

## 0.0.5

### Added
- Multi-language support
- Upload local images

## 0.0.4

No release notes.

## 0.0.3

First release.
