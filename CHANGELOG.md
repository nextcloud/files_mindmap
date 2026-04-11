# Changelog

## 0.0.40 – 2026-04-10

### Fixed
- **`.mm`→`.km`: Doppelte Konvertierung / doppelte Bestätigungsdialoge**: `save()` in `viewer.js` erhält jetzt ein `_saveInProgress`-Flag. Solange ein Speichervorgang läuft (inkl. `window.confirm/prompt`-Dialoge), werden weitere `save()`-Aufrufe (z. B. vom Autosave-Timer) blockiert. Verhindert simultane WebDAV-PUTs und doppelte Dialoge.
- **App öffnet nach Schließen + F5 erneut**: Der `OCA.Viewer.openWith()`-Aufruf nach erfolgreicher `.mm`→`.km`-Konvertierung schrieb einen neuen Eintrag in die Browser-History; beim nächsten F5 stellte NC diesen Zustand wieder her. Der Aufruf wurde entfernt. Der Viewer bleibt nach der Konvertierung geöffnet, Speichern-Schaltfläche wird sichtbar – der Titelbalken zeigt noch `.mm`, was beim nächsten manuellen Öffnen korrigiert wird.
- **Neue Datei zeigt `%20` in der Dateiliste bis F5**: `File`-Objekt erhält jetzt `displayname: fileName` (dekodierter Name) als explizite Eigenschaft. `@nextcloud/files` leitet `basename` aus der URL-kodierten `source` ab; `displayname` übersteuert die Anzeige im Dateiverzeichnis ohne dass der interne WebDAV-Pfad geändert werden muss.

## 0.0.39 – 2026-04-10

### Fixed
- **`%20`-Fehler bei Dateien mit Leerzeichen im Namen**: `exec()` dekodiert `node.path` vor der Übergabe an `OCA.Viewer.openWith()`. `@nextcloud/files` v4 liefert URL-kodierte Pfade (`test%20map.km`); der Viewer findet die Datei nicht, wenn der Pfad kodiert bleibt. Gleiches Fix für `registerNewFileMenuPlugin()` nach Anlegen einer neuen Datei.
- **`.mm`→`.km`-Konvertierung überschreibt bestehende Datei still**: `Overwrite: F`-Header auf PUT wird von Nextcloud nicht zuverlässig als HTTP 412 beantwortet. Ersetzt durch HEAD-Anfrage vor dem PUT: existiert die Datei, erscheint zuerst ein Bestätigungsdialog; erst danach wird (bei Zustimmung) gespeichert. Gleiches Vorgehen für den alternativen Dateinamen in `saveAsAlternative()`.
- **Meldungen erscheinen immer auf Englisch**: Alle neuen Strings aus 0.0.38 (`"{name}" was created …`, `Saved as {name}`, `Enter a new filename …`, `Conversion cancelled`, `… already exists …`) wurden in `l10n/de_DE.json` (formell) und `l10n/de.json` (informell) übersetzt.

## 0.0.38 – 2026-04-10

### Fixed
- **Leerzeichen in Datei-/Ordnernamen → App öffnet nicht (`%20`-Fehler)**: `setFile()` bevorzugt nun wieder `file.filename` (vom NC-33-Viewer rückwärtskompatibel als dekodierter Pfad geliefert) gegenüber `file.path` (URL-kodiert aus `@nextcloud/files`). Fallback auf `decodeURIComponent(file.path)` für NC-28+-Node-Objekte ohne `filename`. `decodeURIComponent` ist mit try-catch abgesichert, sodass ein ungültiges URI-Escape `setFile()` nie zum Absturz bringt.
- **`.mm`-Titelbalken zeigt nach Konvertierung weiterhin `.mm`**: Nach erfolgreichem `.mm`→`.km`-Konvertieren öffnet `viewer.js` den NC-Viewer mit dem neuen `.km`-Pfad neu, sodass Titelbalken und Viewer-State auf die `.km`-Datei zeigen.
- **`.mm`→`.km`: vorhandene `.km`-Datei wurde still überschrieben**: Der erste WebDAV-PUT verwendet jetzt `Overwrite: F`. Bei HTTP 412 (Datei existiert) erscheint ein Bestätigungsdialog.
- **`fullName` nach `.mm`→`.km`-Konvertierung nicht aktualisiert**: `save()` setzt `_file.fullName` jetzt ebenfalls auf den neuen `.km`-Pfad.

### Changed
- **`.mm`→`.km`: Benutzer-Feedback verbessert**: Statt des generischen „File Saved" erscheint ein 8-Sekunden-Toast `„dateiname.km" wurde erstellt – Ihre Änderungen sind dort gespeichert. Die originale .mm-Datei ist unverändert.` sowie ein entsprechender Label im Speichern-Button.
- **`.mm`→`.km`: Speichern unter anderem Namen**: Antwortet der Benutzer „Nein" auf den Überschreiben-Dialog, ermittelt die App via HEAD-Probing die erste freie Nummerierung (`dateiname (1).km`, `(2)`, …) und öffnet ein `prompt()`-Fenster, vorausgefüllt mit diesem Vorschlag. Der Benutzer kann den Namen anpassen oder übernehmen. Ein erneutes 412 beim alternativen Namen zeigt eine Fehlermeldung; es wird nie still überschrieben.

### Tests
- Neue Unit-Tests: URL-kodierter Pfad (`%20`) wird korrekt dekodiert; URL-kodierter Basename wird korrekt dekodiert.
- Priority-Test aktualisiert: `file.filename` hat Vorrang vor `file.path`.

## 0.0.37 – 2026-04-10

### Changed
- Versionsnummer hochgezählt; keine inhaltlichen Änderungen gegenüber 0.0.36

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
- **Autosave-Checkbox und Speichern-Button bei `.mm`-Dateien nicht sichtbar**: `data.writeable = false` wurde fälschlicherweise in `load()` gesetzt, wenn das Format kein Speichern unterstützt (`encode === null`). Dies versteckte die Autosave-Checkbox und verhinderte die Auto-Konvertierung zu `.km`. Behoben: `writeable` spiegelt jetzt korrekt die tatsächlichen Dateiberechtigungen wider; nur `supportedWrite` wird auf `false` gesetzt
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
