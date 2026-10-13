# Das Wort-Ei

Ein Wortspiel für 2 bis 10 Personen. Im lokalen Modus verwenden alle ein Gerät. Im Online-Modus verbindet sich jede Person über die gleiche Website mit einem Spielraum. Antworten werden laut gesagt; der aktive Spieler gibt das Ei per Tipp weiter. Kategorie, Reihenfolge, Punkte und Ergebnis bleiben synchron. Das bestehende Design, die Animation und der mit Web Audio erzeugte Knacksound werden in beiden Modi genutzt.

## Architektur

- `js/game.js` enthält die gemeinsamen Regeln für Kategorien, Strafpunkte, Reihenfolge und Gewinner. Der lokale Modus in `js/app.js` speichert Spiel und Einstellungen weiterhin unter `wort-ei-v1` in `localStorage`; bestehende lokale Spielstände bleiben verwendbar.
- `js/online.js` baut die WebSocket-Verbindung auf, speichert pro Raum eine zufällige Sitzungsidentität lokal und verbindet sich nach Abbruch automatisch neu. `js/app.js` zeigt die Online-Zustände mit den vorhandenen Ei- und Punktestand-Elementen an.
- `worker/index.js` prüft erlaubte Browser-Origins und leitet Räume an je ein Durable Object in `worker/room.js` weiter. Das Objekt speichert Spiel, Sitzungen und geheime Ablaufzeit persistent. Ein Alarm beendet die Runde auch ohne Spieleraktion; jede eingehende Aktion prüft zusätzlich die Serverzeit. Clients erhalten die Ablaufzeit nie. Zustandsversionen verhindern doppelte und verspätete Aktionen.
- WebSocket Hibernation ermöglicht schlafende Durable Objects bei inaktiven Verbindungen. Es gibt keine laufenden Sekunden-Ticks. Unbenutzte, socketfreie Räume werden nach 24 Stunden gelöscht. Pro Raum sind höchstens zehn Spieler erlaubt.

Der Gastgeber wählt in der Lobby Strafpunktlimit, Schwierigkeit und Timergrenzen. Alle in der Lobby eingetragenen Spieler müssen verbunden sein; mindestens zwei werden benötigt. Der Gastgeber startet Spiel und Runden. Fällt er kurz aus, läuft die Runde weiter. Ein getrennter aktiver Spieler kann nach 60 Sekunden von einem anderen verbundenen Spieler übersprungen werden; er behält Sitz und Punkte und kann mit derselben Sitzung zurückkehren. Die Uhr läuft dabei weiter. Während einer Runde sind keine neuen Spielerplätze möglich. In der Lobby kann der Gastgeber Spieler entfernen.

## Lokale Version und Docker

```sh
npm ci
npm test
python3 -m http.server 8080
# oder
docker compose up -d --build
```

Die lokale Website läuft unter `http://localhost:8080` bzw. Docker auf Port `16005`. Ohne Backend-Adresse in `config.js` funktioniert das lokale Spiel vollständig. Docker bleibt ein reiner Nginx-Container und braucht keinen Worker. Für Web Audio auf Smartphones, PWA und Wake Lock ist öffentlich HTTPS sinnvoll. Im lokalen Modus startet „Runde starten“ den geheimen Browser-Timer; beim Neuladen wird dessen ursprüngliche Ablaufzeit wiederhergestellt.

## Online-Backend lokal testen

1. In `wrangler.jsonc` `ALLOWED_ORIGINS` um die tatsächliche Frontend-Adresse ergänzen. Exakte Origins angeben, ohne Pfad und ohne abschließenden Schrägstrich. Die Voreinstellung erlaubt `http://localhost:8080` und `http://localhost:16005`.
2. `npm run dev:worker` starten. Wrangler nutzt standardmäßig `http://localhost:8787` und lokale Durable-Object-Daten.
3. In `config.js` `BACKEND_URL` auf `http://localhost:8787` setzen. Dann die statische Website via Python oder Docker öffnen. Die Client-Verbindung nutzt lokal `ws://`, bei HTTPS automatisch `wss://`.
4. Zwei oder mehr getrennte Browserprofile oder Geräte öffnen. Auf echten Smartphones muss das Frontend per HTTPS erreichbar sein, und die Backend-Adresse aus deren Netz erreichbar sein. Für reine Funktionsprüfungen am Rechner reichen mehrere Browserprofile.

`config.example.js` zeigt eine öffentliche URL. `config.js` enthält nur die öffentliche Worker-Adresse, keine Zugangsdaten. Die Adresse darf versioniert werden. `config.js` muss für GitHub Pages im Repository liegen und wird auch in Docker kopiert. Nach einer Änderung die Seite neu laden; der Service Worker verwendet Netzwerkantworten vorrangig.

## GitHub und GitHub Pages

1. Auf GitHub ein neues Repository anlegen. Im Projekt `git remote add origin https://github.com/ItsMeStefan/wort-ei.git` und `git push -u origin main` ausführen. Es ist bereits ein Git-Repository vorhanden.
2. Unter **Settings → Pages → Build and deployment** als Quelle **Deploy from a branch**, Branch `main`, Ordner `/ (root)` auswählen. Die Seite erscheint unter `https://ItsMeStefan.github.io/wort-ei/`.
3. Der Einladungslink wird aus der aktuellen Website-Adresse erzeugt und enthält `?room=RAUMCODE`; der GitHub-Pages-Unterpfad bleibt erhalten. Assets und Modulimporte verwenden relative Pfade.
4. In `config.js` die veröffentlichte Worker-Adresse eintragen, committen und pushen. GitHub Pages kann einige Minuten bis zur Aktualisierung brauchen.

## Cloudflare einrichten und veröffentlichen

1. Ein kostenloses Cloudflare-Konto erstellen und die Workers-Plattform aktivieren. Es ist keine eigene Domain erforderlich; eine `workers.dev`-Adresse genügt.
2. `npm ci` ausführen, dann `npx wrangler login` oder für CI ein API-Token verwenden. Zugangsdaten niemals in Dateien des Repositorys eintragen.
3. In `wrangler.jsonc` `ALLOWED_ORIGINS` als kommagetrennte Liste setzen, etwa `https://ItsMeStefan.github.io,http://localhost:8080`. Bei GitHub Pages zählt die Origin ohne `/wort-ei`. Der Worker verweigert andere Browser-Origins einschließlich WebSocket-Verbindungen.
4. `npm run deploy:worker` ausführen. Wrangler legt den SQLite-basierten Durable-Object-Namespace aus `exports.GameRoom` an und gibt die `https://...workers.dev`-Adresse aus. Die Konfiguration verwendet die aktuelle deklarative `exports`-Form statt Legacy-Migrationen.
5. Diese URL in `config.js` als `BACKEND_URL` eintragen. Danach committen und nach GitHub pushen.

Für automatische Worker-Updates ist `.github/workflows/deploy-worker.yml` vorbereitet. In **Settings → Secrets and variables → Actions** `CLOUDFLARE_API_TOKEN` und `CLOUDFLARE_ACCOUNT_ID` als Secrets und `ALLOWED_ORIGINS` als Variable eintragen. Das Token benötigt Berechtigungen zum Bearbeiten von Workers und Durable Objects. Der Workflow wird bei Änderungen am Worker oder den gemeinsamen Regeln auf `main` sowie manuell gestartet. Er führt Tests aus und deployt mit der Origin-Liste aus der GitHub-Variable. Ohne diese Einrichtung den Workflow nicht aktivieren. Frontend-Updates werden durch Commit und Push über GitHub Pages veröffentlicht; Backend-Updates über Wrangler oder den Workflow.

## Sicherheit und Grenzen

Raumcodes enthalten acht Zeichen aus einem Alphabet ohne leicht verwechselbare Zeichen. Sitzungs-IDs und Geheimnisse werden zufällig erzeugt und im Browser pro Raum gespeichert. Sie stehen nie im Repository oder im öffentlichen Spielzustand. Für Serveraktionen gelten Sitzungs-, Gastgeber-, Phasen-, Versions- und Zugprüfungen. Pro WebSocket sind höchstens 20 Nachrichten je 10 Sekunden und 2048 Zeichen je Nachricht erlaubt. Namen werden begrenzt und vor der HTML-Ausgabe maskiert. CORS und WebSocket-Origin werden am Worker geprüft. Der Worker ist für öffentliche HTTPS-Nutzung gedacht; lokales HTTP ist nur für die Entwicklung vorgesehen.

Die freie Cloudflare-Stufe unterstützt SQLite-Durable-Objects. Zum Stand Oktober 2026 nennt Cloudflare [100.000 Durable-Object-Anfragen pro Tag und 13.000 GB-s Laufzeit pro Tag](https://developers.cloudflare.com/durable-objects/platform/pricing/) sowie [5 Millionen gelesene und 100.000 geschriebene SQLite-Zeilen pro Tag und 5 GB Gesamtspeicher](https://developers.cloudflare.com/durable-objects/platform/pricing/). WebSocket-Nachrichten und Alarme zählen als Anfragen; Speichern und `setAlarm()` zählen zu Schreiboperationen. Bei Überschreitung können Operationen bis zum täglichen Reset fehlschlagen. [WebSocket Hibernation](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) reduziert Leerlauf-Laufzeit. Es gibt kein hartes globales Raumlimit; Raumanzahl und Missbrauch sollten im Cloudflare-Dashboard beobachtet und bei Bedarf über Cloudflare Rate Limiting oder WAF begrenzt werden. Die Origin-Prüfung erschwert fremde Websites, ersetzt aber keine vollständige Abwehr gegen direkte HTTP-Clients.

## Tests und Wartung

`npm test` prüft lokale Regeln und serverseitige Räume, Berechtigungen, doppelte und gleichzeitige Aktionen, geheimen Timer, Alarm, Gewinner, drei Spieler mit Ausscheiden und einen getrennten aktiven Spieler. Mit zwei getrennten Browserprofilen wurden Raumbeitritt, gemeinsame Lobby, gleiche Kategorie, Start, Timerablauf mit identischem Ergebnis sowie Wiederbeitritt nach Reload geprüft. Der lokale Spielstart und ein Docker-Build wurden ebenfalls ausgeführt. `npx wrangler deploy --dry-run` prüft den Worker-Build. Für eine echte Abnahme zusätzlich auf zwei Smartphones und mit drei oder mehr Spielern testen: Raum erstellen, Link öffnen, weitergeben, Ablauf ohne Aktionen, Reload, kurzzeitiger Host-Ausfall und Wiederbeitritt. Diese Geräte- und Cloudflare-Tests benötigen eine veröffentlichte Worker-URL und wurden hier nicht als automatisierte Tests ausgeführt.

Kategorien liegen in `categories.json` (225 Einträge mit `id`, `level`, `text`). Weitere Kategorien können dort ergänzt werden. Beim nächsten Worker-Deployment werden sie für neue Runden verfügbar. Das lokale Spiel verwendet dieselbe Datei direkt. Bestehende lokale Speicherstände bleiben vom Online-Zustand getrennt.
