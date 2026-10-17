# Das Wort-Ei

Ein lokales Wortspiel für 2 bis 10 Personen auf einem gemeinsamen Gerät. Die Antworten werden laut gesagt. Das Ei zeigt die aktive Person; ein Tipp gibt es weiter. Eine geheime, bei Rundenstart zufällig bestimmte Zeit läuft unabhängig von den Tipps ab.

## Lokal starten

Im Projektverzeichnis `npm run dev` starten und `http://localhost:16006` öffnen. Der kleine Entwicklungsserver benötigt keine Installation zusätzlicher Pakete und liest die Dateien bei jedem Aufruf neu ein. Nach Änderungen genügt ein Neuladen der Seite. Standardmäßig ist er nur auf diesem Rechner erreichbar. Für die Vorschau im Heimnetz kann er gezielt an die eigene LAN-Adresse gebunden werden, zum Beispiel mit `HOST=<LAN-IP> npm run dev` und `http://<LAN-IP>:16006` auf einem anderen Gerät. Das andere Gerät muss im selben Heimnetz oder per VPN verbunden sein; über Mobilfunk ist eine private LAN-Adresse nicht erreichbar. Falls UFW aktiv ist, muss Port 16006 für das Heimnetz freigegeben werden. `Strg+C` beendet den Server.

Der Nginx-Container wird mit `docker compose up -d --build` gestartet und liefert beide Editionen auf Port 16005 aus: `/` für die normale Ausgabe und `/18/` für UNZENSIERT. `docker-compose.yml` bindet das Verzeichnis `18/` ausdrücklich ein; dadurch sind Änderungen an den Erwachsenen-Dateien ohne erneuten Build sichtbar. Für Änderungen an `nginx.dev.conf` genügt `docker exec wort-ei nginx -s reload` nach einer erfolgreichen Prüfung mit `docker exec wort-ei nginx -t`.

## Spielen

Spielerzahl, Namen, Strafpunktlimit, Schwierigkeit, geheime Timergrenzen und Ton einstellen. Über „Themen & Aufgaben → Auswählen“ öffnet sich eine eigene Übersichtsseite mit allen Themenpaketen und ihren Aufgaben. Dort lassen sich Pakete einzeln oder gesammelt auswählen, Aufgaben durchsuchen und die Schwierigkeit einstellen. Die Auswahl bleibt beim Zurückkehren zur Spielvorbereitung erhalten; das Startformular zeigt die gewählten Pakete und die Zahl passender Aufgaben. Ohne passende Aufgaben lässt sich das Spiel nicht starten. Nach „Spiel starten“ werden Kategorie, Themenpaket und Startperson angezeigt. „Runde starten“ setzt die geheime Ablaufzeit. Die aktive Person sagt einen Begriff und tippt auf das Ei. Bei Ablauf erhält die angezeigte Person einen Strafpunkt. Ausgeschiedene werden übersprungen. Die Startperson rotiert pro Runde. Die letzte aktive Person gewinnt.

Einstellungen und Spielstand werden im Browser per `localStorage` gespeichert. Ein Neuladen setzt die Ablaufzeit nicht zurück. Wenn die Zeit während gesperrtem Bildschirm oder im Hintergrund abläuft, wird das beim nächsten Aktivieren nachgeholt. Die App versucht während einer Runde, den Bildschirm mit der Screen Wake Lock API wach zu halten; Safari und andere Browser können diese Funktion einschränken. Die PWA kann nach dem ersten Laden offline funktionieren; für die Installation und Wake Lock ist auf vielen Geräten HTTPS oder localhost erforderlich. Über schlichtes HTTP im Heimnetz ist die App weiterhin spielbar.

## Spezial-Eier und Zusatzregeln

Unter „Spielvarianten“ lassen sich Spezial-Eier und Zusatzregeln getrennt ein- oder ausschalten. Für beide gibt es die Häufigkeiten selten (10 %), normal (25 %), häufig (50 %) und immer (100 %). Die Auslosungen sind unabhängig; ohne ausgewählten Spezial-Ei-Typ wird ein normales Ei verwendet. Einzelne Spezial-Eier können deaktiviert werden. Beim Turbo-Ei lässt sich die Dauer auf 50–80 % der normalen Zufallsdauer einstellen; die Restzeit bleibt geheim.

Das Turbo-Ei verkürzt die Runde, Doppel-Matsch vergibt beim Zerplatzen zwei Strafpunkte. Das goldene Ei bleibt vor und während der Runde vollständig verborgen: Es sieht aus wie ein normales Ei und wird nicht angekündigt. Erst nach dem gewöhnlichen Zerplatzen und der kurzen Verliereranzeige enthüllt eine goldene Rettungsanimation samt eigenem Ton den Effekt. Der betroffene Spieler bekommt keinen Strafpunkt; die Punktzahl wird dabei nie erhöht. Das Chaos-Ei kann bis zu dreimal pro Runde zu einer neuen passenden Kategorie wechseln. Der erste Wechsel erfolgt automatisch nach einer zufälligen Zeit von etwa 20–55 % der Rundenlänge oder früher nach einer zufällig gezogenen Zahl von zwei bis fünf Übergaben. Für einen zweiten oder dritten Wechsel wird diese verdeckte Zahl jeweils neu ausgelost; ohne weitere Übergaben bleibt die Kategorie stehen. Jeder Wechsel löst einen Chaos-Alarm mit Warnsound und sofort lesbarer neuer Aufgabe aus. Anschließend gibt es drei Sekunden Lesepause: Das Ei lässt sich nicht weitergeben, und die geheime Ablaufzeit verlängert sich genau um diese drei Sekunden. Die neue Aufgabe bleibt noch kurz markiert. Die Pause bleibt bei einem Reload erhalten. Die Zusatzregel gilt für die ganze Runde und wird beim Chaos-Wechsel nach Möglichkeit beibehalten. Wenn keine passende neue Kategorie für sie verfügbar ist, wird sie sichtbar aufgehoben. Zum gezielten Testen unter „Spielvarianten“ die Spezial-Eier auf „Immer“ stellen und nur das Chaos-Ei auswählen; Tippen in einer normalen Ei-Runde löst keinen Chaos-Wechsel aus.

Nach dem Zerplatzen erscheint im zentralen Bereich ein Spiegelei. Es ersetzt das ganze Ei im Ergebnisbildschirm für normale und alle Spezial-Eier. Doppel-Matsch zeigt zwei leicht überlappende Spiegeleier; beim Gold-Ei bekommt das Spiegelei während der Rettung einen goldenen Glanz. Weitergeben ist im Rundenende nicht möglich; nur „Nächste Runde“ startet die nächste Aufgabe.

Es sind 28 mündliche Zusatzregeln enthalten. Die Spieler entscheiden selbst über gültige Antworten. Buchstaben- und Wortregeln erscheinen nur bei dafür geeigneten offenen Kategorien; Kategorien ohne passende Metadaten erhalten ausschließlich allgemein anwendbare Regeln. Bei „Einfach“ werden nur leichte Regeln gewählt, bei „Normal“ leichte und normale, bei „Schwer“ auch schwere. Für alte gespeicherte Spiele bleiben beide Varianten ausgeschaltet, bis ein neues Spiel mit geänderten Einstellungen gestartet wird.

## Kategorien anpassen

`categories.json` enthält 365 Aufgaben: die bisherigen 225 in „Alltag & Allgemeinwissen“ sowie 140 neue in „Super Mario“, „Minecraft“, „Pokémon“, „Gaming & Videospiele“, „Filme & Serien“, „Kinder & Schule“, „Quatsch & Fantasie“ und „Tiere & Natur“. Die Stufen heißen `easy`, `normal` und `hard`. Jede Kategorie hat eine eindeutige `id`, ein `level`, den angezeigten `text` und eine `pack`-ID. Die Paketnamen, Beschreibungen und Symbole stehen im Feld `packs`. Einträge ohne `pack` werden aus Kompatibilitätsgründen „Alltag & Allgemeinwissen“ zugeordnet. Weitere Einträge im gleichen Format ergänzen und die Seite neu laden. Kategorien wiederholen sich erst, wenn alle passenden Kategorien benutzt wurden; beim Neustart dieses Durchlaufs wird die letzte Kategorie nicht unmittelbar wiederholt. Bei Änderungen an bestehenden IDs kann der lokale Verlauf im Browser weiter bestehen; ein neues Spiel beginnt mit leerem Verlauf. Die letzte Paketauswahl wird lokal gespeichert.

## Entwicklung und Tests

Die App benötigt für die Laufzeit nur einen statischen Webserver; für die Entwicklung genügt der mitgelieferte Node-Server. Die Spiellogik liegt in `js/game.js`, Ei- und Regeldefinitionen in `js/extras.js`, Darstellung und Browserintegration in `js/app.js`, Klang in `js/audio.js`, Stil in `css/style.css`. `npm test` prüft die wichtigsten Zustandsübergänge. Der Ton wird lokal mit Web Audio erzeugt; es gibt keine externen Dienste, Schriftarten oder Trackingdienste.

## Spielwelten

Über „Spielwelten / Designs“ öffnet sich eine eigene Auswahlansicht. Dort stehen Klassisch (Standard), Retro-Arcade, Halloween, Neon und Winter bereit. Die Auswahl wird zusammen mit den Spieleinstellungen lokal gespeichert. „Festes Design“ nutzt die gewählte Welt; „Zufall pro Partie“ wählt beim Start; „Zufall pro Runde“ wählt vor jeder neuen Runde. Die Häkchen darunter begrenzen die Zufallsauswahl. Bei mehreren freigegebenen Welten wird die vorherige nicht direkt wiederholt. Chaos wechselt nur die Aufgabe und behält die Welt der laufenden Runde.

Neue Spielwelten werden in `js/themes.js` mit ID, Name, Beschreibung, Symbol und Effektprofil angelegt. In `css/style.css` genügen eine `theme-<id>`-Palette und gezielte Stilregeln für das gemeinsame Ei. Spezial-Eier werden weiterhin durch `egg-<type>` markiert; ihre Mechanik liegt unverändert in `js/game.js`. Audioeffekte werden in `js/audio.js` über `playBurst` zugeordnet. Offline-Dateien müssen zusätzlich in `sw.js` eingetragen werden.

## Erwachsenen-Edition: UNZENSIERT (18+)

Die eigenständige Party-Edition ist unter `/18/` erreichbar, lokal mit `npm run dev` unter `http://localhost:16006/18/`. Ihr Motto lautet „Ein Wort. Ein Ei. Keine Scham.“ Sie nutzt dieselbe Spiellogik, Spezial-Eier, Zusatzregeln, Timer, Ergebnisanimationen und Siegeransicht wie die normale Ausgabe. Vor dem Laden ihrer Aufgaben erscheint eine kurze Altersbestätigung. Sie wird nur für die aktuelle Browsersitzung gemerkt und ist keine rechtlich belastbare Altersverifikation. Die 18+-Seite trägt `noindex`-Metadaten.

### Editionsarchitektur

`js/edition.js` definiert `classic` und `adult`: gültige Paket- und Design-IDs, Kategoriepfad, Standarddesign und Speicherschlüssel. `js/game.js` filtert Aufgaben nach Edition, Paket, Schwierigkeit und in der Erwachsenen-Edition zusätzlich nach maximaler Intensität. `js/app.js` bleibt der gemeinsame Einstieg für beide HTML-Seiten. Erwachsene Texte und Einstellungen erscheinen nur, wenn das HTML `data-edition="adult"` setzt. Die normalen Daten bleiben in `categories.json`; die 18+-Daten stehen ausschließlich in `18/categories.json`. Die Darstellung beider Editionen nutzt `css/style.css`, während `css/adult.css` den dunklen Look ergänzt. `After Dark` ist nur in der 18+-Designliste auswählbar. Gemeinsame Engine-Dateien werden nicht kopiert.

Die normale Ausgabe behält den bisherigen `localStorage`-Schlüssel `wort-ei-v1`. Die Erwachsenen-Ausgabe verwendet `wort-ei-adult-v1` für Spielstand, Spielernamen, Pakete, Einstellungen, Historie, Designs und Varianten. Eine Edition akzeptiert keinen gespeicherten Spielstand der anderen. Bereits vorhandene normale Spielstände werden weiterhin gelesen. Die Altersbestätigung verwendet den separaten `sessionStorage`-Schlüssel `wort-ei-adult-confirmed`. Bei gesperrtem Sitzungszugang bleibt die Bestätigung für die offene Seite bestehen, muss aber nach einer neuen Sitzung wieder erfolgen.

### Aufgaben hinzufügen

`18/categories.json` enthält zwölf Pakete mit jeweils 25 Aufgaben, insgesamt 300. Ein Paket besitzt `id`, `name`, `description` und `symbol`. Jede Aufgabe benötigt eine eindeutige `id` mit `adult-`-Präfix, eine gültige `pack`-ID, `level` (`easy`, `normal` oder `hard`), `intensity` (1, 2 oder 3), einen kurzen `text` und `ruleTags`. Neue Paket-IDs zusätzlich in `ADULT_PACKS` in `js/edition.js` eintragen. `ruleTags: ["open"]` nur bei Aufgaben setzen, die sich auch für Buchstaben- und Wortregeln mit vielen möglichen Antworten eignen; sonst `[]` verwenden. `npm test` prüft Referenzen, Einzigartigkeit, Textlängen und die Verteilung über Schwierigkeitsgrade und Intensitäten.

Die Einstellung „Wie weit darf es gehen?“ ist unabhängig vom Schwierigkeitsgrad: `FRECH` zeigt nur Intensität 1, `VERSAUT` die Intensitäten 1 und 2, `GRENZWERTIG` alle drei. Standard ist `VERSAUT`. Die Auswahl steht in der Spielvorbereitung und der Themenübersicht; beide Ansichten zeigen die passende Aufgabenzahl an.

### PWA und Offlinebetrieb

Die normale Seite registriert `sw.js` für den Root-Scope; die 18+-Seite registriert `18/sw.js` nur für `/18/`. Beide Service Worker verwenden eigene Cache-Namensräume, löschen nur alte Caches der eigenen Edition und speichern ihre jeweilige Kategoriendatei. Der Root-Service-Worker ignoriert `/18/`. Die 18+-PWA nutzt `18/manifest.webmanifest` mit eigener ID, eigenem Namen und `/18/` als Start und Scope. Gemeinsame JavaScript- und CSS-Dateien werden in beiden Caches separat gespeichert. Bei Änderungen an gemeinsamen Laufzeitdateien die Versionsnummern in beiden HTML-Dateien und Service Workern erhöhen; bei Änderungen an `css/adult.css` zusätzlich dessen Version und den Erwachsenen-Cache aktualisieren.

### Tests

`npm test` führt Engine-, Varianten-, Design-, Paket- und Editionstests aus. `tests/adult.test.js` validiert die Erwachsenen-Daten und prüft Filter, Trennung gespeicherter Zustände sowie Chaos-Auswahl. Zum lokalen Browsercheck beide URLs öffnen, die Altersbestätigung einmal ausführen und nach dem ersten Laden für jede Edition einen Offline-Reload testen. Der Entwicklungsserver erlaubt zusätzlich `PORT=16007 npm run dev`, falls 16006 bereits belegt ist.
