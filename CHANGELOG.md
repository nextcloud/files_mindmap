# Changelog

## 0.0.36 – 2026-04-10

### Fixed
- **Neue Datei ohne Endung**: WebDAV-URL wird jetzt explizit über `generateRemoteUrl('dav')` + Benutzerpfad aufgebaut statt auf `context.encodedSource` zu vertrauen – `.km`-Endung bleibt zuverlässig erhalten
- **App startet nicht nach Neu-Datei**: Doppelter Schrägstrich (`//`) im PHP-Pfad durch `rtrim($dir, '/')` behoben; NC-Dateisystem fand die Datei nicht
- **Save/Autosave-Checkbox verdeckt**: KityMinder-Editor beginnt jetzt bei `top: 40px` statt `top: 0`, sodass die Menüleiste mit Speichern/Autospeichern sichtbar bleibt
- **Ctrl+S öffnet Chrome-Speicherdialog**: Hotkey-Listener im iframe nutzt jetzt Capture-Phase (`addEventListener(..., true)`) und feuert vor KityMinder und Chrome
- **`.mm`-Dateien nicht speicherbar**: Beim Speichern einer `.mm`-Datei wird automatisch eine neue `.km`-Datei mit gleichem Basisnamen via WebDAV-PUT angelegt
- **Speichern schlägt fehl (mtime-Check)**: `!empty($mtime)`-Prüfung verhindert false positives wenn mtime nicht übermittelt wird
- **MIME-Erkennung `application/octet-stream`**: Erweiterungsbasiertes Fallback für MIME-Typ; `extensions: ['km']` in km-Plugin ergänzt
- **Vue 2/3-Buildfehler**: `dedupe: ['vue']` aus vite.config.ts entfernt; `@nextcloud/vue` nutzt intern Vue 3 für `@vueuse/core`

### Changed
- `src/mindmap.js`: `setFile()` setzt `_file.mime` sofort aus dem Viewer-Node-Objekt
- `src/mindmap.js`: Neue-Datei-Handler nutzt `context.path` für URL-Konstruktion
- `src/views/MindMap.vue`: Ctrl+S-Listener im Parent-Frame als Fallback
- `appinfo/mimetypemapping.json`: MIME-Typ `km → application/km` ergänzt

## 0.0.35 – vorherige Version

- Kompatibilität für Nextcloud 33 hergestellt
- `addNewFileMenuEntry`-API für NC 33+ verwendet
- `FileAction`/`registerFileAction` auf neue NC-33-API umgestellt
- `setFile()` unterstützt NC 28+ Node.path
- `hide()`-Aufruf abgesichert gegen fehlende Methode
