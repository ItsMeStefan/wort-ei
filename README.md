# Das Wort-Ei

Ein lokales Wortspiel für 2 bis 10 Personen auf einem gemeinsamen Gerät. Die Antworten werden laut gesagt. Das Ei zeigt die aktive Person; ein Tipp gibt es weiter. Eine geheime, bei Rundenstart zufällig bestimmte Zeit läuft unabhängig von den Tipps ab.

## Lokale Entwicklung ohne Docker

Im Projektverzeichnis `npm run dev` starten und `http://localhost:16006` öffnen. Der kleine Entwicklungsserver benötigt keine Installation zusätzlicher Pakete und liest die Dateien bei jedem Aufruf neu ein. Nach Änderungen genügt ein Neuladen der Seite. Standardmäßig ist er nur auf diesem Rechner erreichbar. Für die Vorschau im Heimnetz kann er gezielt an die eigene LAN-Adresse gebunden werden, zum Beispiel mit `HOST=<LAN-IP> npm run dev` und `http://<LAN-IP>:16006` auf einem anderen Gerät. Das andere Gerät muss im selben Heimnetz oder per VPN verbunden sein; über Mobilfunk ist eine private `192.168…`-Adresse nicht erreichbar. Falls UFW aktiv ist, muss Port 16006 für das Heimnetz freigegeben werden. `Strg+C` beendet den Server.

## Start mit Docker (optional)

Im Projektverzeichnis:

```sh
docker compose up -d --build
```

Danach `http://HEIMSERVER-IP:16005` im Browser öffnen. Die IP ist die lokale Adresse des Servers. Zum Stoppen `docker compose down`, für Logs `docker compose logs -f`, für Updates neue Dateien einspielen und `docker compose up -d --build` erneut ausführen. Der Container startet nach einem Serverneustart automatisch, sofern er nicht manuell gestoppt wurde. Falls Port 16005 belegt ist, die linke Portnummer in `docker-compose.yml` ändern.

## Spielen

Spielerzahl, Namen, Strafpunktlimit, Schwierigkeit, geheime Timergrenzen und Ton einstellen. Über „Themen & Aufgaben → Auswählen“ öffnet sich eine eigene Übersichtsseite mit allen Themenpaketen und ihren Aufgaben. Dort lassen sich Pakete einzeln oder gesammelt auswählen, Aufgaben durchsuchen und die Schwierigkeit einstellen. Die Auswahl bleibt beim Zurückkehren zur Spielvorbereitung erhalten; das Startformular zeigt die gewählten Pakete und die Zahl passender Aufgaben. Ohne passende Aufgaben lässt sich das Spiel nicht starten. Nach „Spiel starten“ werden Kategorie, Themenpaket und Startperson angezeigt. „Runde starten“ setzt die geheime Ablaufzeit. Die aktive Person sagt einen Begriff und tippt auf das Ei. Bei Ablauf erhält die angezeigte Person einen Strafpunkt. Ausgeschiedene werden übersprungen. Die Startperson rotiert pro Runde. Die letzte aktive Person gewinnt.

Einstellungen und Spielstand werden im Browser per `localStorage` gespeichert. Ein Neuladen setzt die Ablaufzeit nicht zurück. Wenn die Zeit während gesperrtem Bildschirm oder im Hintergrund abläuft, wird das beim nächsten Aktivieren nachgeholt. Die App versucht während einer Runde, den Bildschirm mit der Screen Wake Lock API wach zu halten; Safari und andere Browser können diese Funktion einschränken. Die PWA kann nach dem ersten Laden offline funktionieren; für die Installation und Wake Lock ist auf vielen Geräten HTTPS oder localhost erforderlich. Über schlichtes HTTP im Heimnetz ist die App weiterhin spielbar.

## Spezial-Eier und Zusatzregeln

Unter „Spielvarianten“ lassen sich Spezial-Eier und Zusatzregeln getrennt ein- oder ausschalten. Für beide gibt es die Häufigkeiten selten (10 %), normal (25 %), häufig (50 %) und immer (100 %). Die Auslosungen sind unabhängig; ohne ausgewählten Spezial-Ei-Typ wird ein normales Ei verwendet. Einzelne Spezial-Eier können deaktiviert werden. Beim Turbo-Ei lässt sich die Dauer auf 50–80 % der normalen Zufallsdauer einstellen; die Restzeit bleibt geheim.

Das Turbo-Ei verkürzt die Runde, Doppel-Matsch vergibt beim Zerplatzen zwei Strafpunkte, das goldene Ei keinen. Das Chaos-Ei kann einmal pro Runde automatisch eine neue passende Kategorie ziehen. Sein Auslösezeitpunkt wird unabhängig von der Ei-Ablaufzeit bestimmt, und der laufende Timer wird beim Wechsel nicht zurückgesetzt. Die Zusatzregel gilt für die ganze Runde und wird beim Chaos-Wechsel nach Möglichkeit beibehalten. Wenn keine passende neue Kategorie für sie verfügbar ist, wird sie sichtbar aufgehoben.

Es sind 28 mündliche Zusatzregeln enthalten. Die Spieler entscheiden selbst über gültige Antworten. Buchstaben- und Wortregeln erscheinen nur bei dafür geeigneten offenen Kategorien; Kategorien ohne passende Metadaten erhalten ausschließlich allgemein anwendbare Regeln. Bei „Einfach“ werden nur leichte Regeln gewählt, bei „Normal“ leichte und normale, bei „Schwer“ auch schwere. Für alte gespeicherte Spiele bleiben beide Varianten ausgeschaltet, bis ein neues Spiel mit geänderten Einstellungen gestartet wird.

## Kategorien anpassen

`categories.json` enthält 365 Aufgaben: die bisherigen 225 in „Alltag & Allgemeinwissen“ sowie 140 neue in „Super Mario“, „Minecraft“, „Pokémon“, „Gaming & Videospiele“, „Filme & Serien“, „Kinder & Schule“, „Quatsch & Fantasie“ und „Tiere & Natur“. Die Stufen heißen `easy`, `normal` und `hard`. Jede Kategorie hat eine eindeutige `id`, ein `level`, den angezeigten `text` und eine `pack`-ID. Die Paketnamen, Beschreibungen und Symbole stehen im Feld `packs`. Einträge ohne `pack` werden aus Kompatibilitätsgründen „Alltag & Allgemeinwissen“ zugeordnet. Weitere Einträge im gleichen Format ergänzen, dann den Container neu bauen. Kategorien wiederholen sich erst, wenn alle passenden Kategorien benutzt wurden; beim Neustart dieses Durchlaufs wird die letzte Kategorie nicht unmittelbar wiederholt. Bei Änderungen an bestehenden IDs kann der lokale Verlauf im Browser weiter bestehen; ein neues Spiel beginnt mit leerem Verlauf. Die letzte Paketauswahl wird lokal gespeichert.

## Entwicklung und Tests

Die App benötigt für die Laufzeit nur einen statischen Webserver; für die Entwicklung genügt der mitgelieferte Node-Server. Die Spiellogik liegt in `js/game.js`, Ei- und Regeldefinitionen in `js/extras.js`, Darstellung und Browserintegration in `js/app.js`, Klang in `js/audio.js`, Stil in `css/style.css`. `npm test` prüft die wichtigsten Zustandsübergänge. Der Ton wird lokal mit Web Audio erzeugt; es gibt keine externen Dienste, Schriftarten oder Trackingdienste.
