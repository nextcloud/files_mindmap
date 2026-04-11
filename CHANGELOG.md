# Changelog

## 0.0.36 – 2026-04-10

### Fixed
- **Dateiname mit `%20` statt Leerzeichen → Datei nicht gefunden**: `@nextcloud/files` liefert URL-kodierte Pfade (`file.path`, `file.basename`); `setFile()` wendet jetzt `decodeURIComponent()` an, damit `generateUrl()` die Zeichen nur einmal kodiert
- **Neue Datei ohne Endung**: WebDAV-URL wird explizit über `generateRemoteUrl('dav')` + Benutzerpfad aufgebaut statt auf `context.encodedSource` zu vertrauen – `.km`-Endung bleibt zuverlässig erhalten
- **App startet nicht nach Neu-Datei**: Doppelter Schrägstrich (`//`) im PHP-Pfad durch `rtrim($dir, '/')` behoben; NC-Dateisystem fand die Datei nicht
- **Menüleiste (Save/Autosave) verdeckt oder verschwunden**: `#menu-header` erhält `z-index: 1000`, weißen Hintergrund und explizite Höhe; KityMinder-Editor beginnt bei `top: 40px`
- **`.mm`-Dateien werden beim Öffnen automatisch als `.km` gespeichert**: Unmittelbar nach dem Laden wird eine neue `.km`-Datei via WebDAV-PUT angelegt, wenn das Format kein Speichern unterstützt
- **Ctrl+S öffnet Chrome-Speicherdialog**: Hotkey-Listener im iframe nutzt Capture-Phase (`addEventListener(..., true)`) und feuert vor KityMinder und Chrome
- **Speichern schlägt fehl (mtime-Check)**: `!empty($mtime)`-Prüfung verhindert false positives wenn mtime nicht übermittelt wird
- **MIME-Erkennung `application/octet-stream`**: Erweiterungsbasiertes Fallback für MIME-Typ; `extensions: ['km']` in km-Plugin ergänzt
- **Vue 2/3-Buildfehler**: `dedupe: ['vue']` aus vite.config.ts entfernt; `@nextcloud/vue` nutzt intern Vue 3 für `@vueuse/core`
- **Fehlermeldung beim Speichern überschrieben**: Debug-Zeile entfernt, die Datei-Pfad statt Fehlermeldung anzeigte

### Changed
- `src/mindmap.js`: `setFile()` dekodiert URL-kodierte Pfade und setzt `_file.mime` sofort aus dem Viewer-Node-Objekt
- `src/mindmap.js`: Neue-Datei-Handler nutzt `context.path` für URL-Konstruktion
- `src/viewer.js`: `.mm`-Dateien werden beim Öffnen automatisch zu `.km` konvertiert
- `src/views/MindMap.vue`: Ctrl+S-Listener im Parent-Frame als Fallback
- `appinfo/mimetypemapping.json`: MIME-Typ `km → application/km` ergänzt
- `js/`-Verzeichnis wird jetzt per git getrackt (aus `.gitignore` entfernt)

### Compatibility
- Nextcloud 33: `addNewFileMenuEntry`- und `registerFileAction`-API auf NC-33-Varianten umgestellt
- Nextcloud 33: `FileAction`-Klasse und neues `DefaultType`-System verwendet
- Nextcloud 28+: `setFile()` unterstützt Node-Objekte mit `file.path` statt `file.filename`
- `hide()`-Aufruf abgesichert gegen fehlende Methode (optionales Chaining)
- Tests überarbeitet und erweitert für `FilesMindMap`-Klasse

## 0.0.35 – 2025

- Tests für `FilesMindMap`-Klasse überarbeitet
- Vorbereitung der NC-33-Kompatibilität
