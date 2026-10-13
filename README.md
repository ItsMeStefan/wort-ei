# Das Wort-Ei

Ein lokales Wortspiel für 2 bis 10 Personen auf einem gemeinsamen Gerät. Die Antworten werden laut gesagt. Das Ei zeigt die aktive Person; ein Tipp gibt es weiter. Eine geheime, bei Rundenstart zufällig bestimmte Zeit läuft unabhängig von den Tipps ab.

## Start mit Docker

Im Projektverzeichnis:

```sh
docker compose up -d --build
```

Danach `http://HEIMSERVER-IP:16005` im Browser öffnen. Die IP ist die lokale Adresse des Servers. Zum Stoppen `docker compose down`, für Logs `docker compose logs -f`, für Updates neue Dateien einspielen und `docker compose up -d --build` erneut ausführen. Der Container startet nach einem Serverneustart automatisch, sofern er nicht manuell gestoppt wurde. Falls Port 16005 belegt ist, die linke Portnummer in `docker-compose.yml` ändern.

## Spielen

Spielerzahl, Namen, Strafpunktlimit, Themenpakete, Schwierigkeit, geheime Timergrenzen und Ton einstellen. Einzelne oder mehrere Themenpakete lassen sich auswählen; „Alle auswählen“ und „Alle abwählen“ ändern die Auswahl auf einmal. Die Anzeige unter den Paketen nennt die Zahl der passenden Kategorien. Ohne passende Kategorien lässt sich das Spiel nicht starten. Nach „Spiel starten“ werden Kategorie, Themenpaket und Startperson angezeigt. „Runde starten“ setzt die geheime Ablaufzeit. Die aktive Person sagt einen Begriff und tippt auf das Ei. Bei Ablauf erhält die angezeigte Person einen Strafpunkt. Ausgeschiedene werden übersprungen. Die Startperson rotiert pro Runde. Die letzte aktive Person gewinnt.

Einstellungen und Spielstand werden im Browser per `localStorage` gespeichert. Ein Neuladen setzt die Ablaufzeit nicht zurück. Wenn die Zeit während gesperrtem Bildschirm oder im Hintergrund abläuft, wird das beim nächsten Aktivieren nachgeholt. Die App versucht während einer Runde, den Bildschirm mit der Screen Wake Lock API wach zu halten; Safari und andere Browser können diese Funktion einschränken. Die PWA kann nach dem ersten Laden offline funktionieren; für die Installation und Wake Lock ist auf vielen Geräten HTTPS oder localhost erforderlich. Über schlichtes HTTP im Heimnetz ist die App weiterhin spielbar.

## Kategorien anpassen

`categories.json` enthält 365 Kategorien: die bisherigen 225 in „Alltag & Allgemeinwissen“ sowie 140 neue in „Super Mario“, „Minecraft“, „Pokémon“, „Gaming & Videospiele“, „Filme & Serien“, „Kinder & Schule“, „Quatsch & Fantasie“ und „Tiere & Natur“. Die Stufen heißen `easy`, `normal` und `hard`. Jede Kategorie hat eine eindeutige `id`, ein `level`, den angezeigten `text` und eine `pack`-ID. Die Paketnamen, Beschreibungen und Symbole stehen im Feld `packs`. Einträge ohne `pack` werden aus Kompatibilitätsgründen „Alltag & Allgemeinwissen“ zugeordnet. Weitere Einträge im gleichen Format ergänzen, dann den Container neu bauen. Kategorien wiederholen sich erst, wenn alle passenden Kategorien benutzt wurden; beim Neustart dieses Durchlaufs wird die letzte Kategorie nicht unmittelbar wiederholt. Bei Änderungen an bestehenden IDs kann der lokale Verlauf im Browser weiter bestehen; ein neues Spiel beginnt mit leerem Verlauf. Die letzte Paketauswahl wird lokal gespeichert.

## Entwicklung und Tests

Die App benötigt für die Laufzeit nur Nginx. Lokal kann sie mit einem beliebigen statischen Webserver geöffnet werden. Die Spiellogik liegt in `js/game.js`, Darstellung und Browserintegration in `js/app.js`, Klang in `js/audio.js`, Stil in `css/style.css`. `node --test tests/*.test.js` prüft die wichtigsten Zustandsübergänge. Der Ton wird lokal mit Web Audio erzeugt; es gibt keine externen Dienste, Schriftarten oder Trackingdienste.
