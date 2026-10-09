# Planer

Persönlicher Planer für Ziele, Projekte, Aufgaben und Wiederholungen. Er läuft als Web-App
und lässt sich auf Android als App installieren (PWA).

## Funktionen

- **Ziele & Projekte**: langfristige Ziele, kurzlebige Projekte und Sammellisten, optional mit
  Zieldatum (*will bis*) und Deadline (*muss bis*). Können pausiert und wieder aktiviert werden.
- **Aufgaben**: mit oder ohne Projekt, optional mit **Termin** (wann ich es machen will) und
  **Deadline** (bis wann es erledigt sein muss).
- **Wiederholungen**: z. B. „30 Minuten trainieren": X-mal pro Tag, Woche oder Monat, alle N
  Zeiträume oder an festen Wochentagen. Verpasste Tage stauen sich nicht auf, nachtragen geht über
  den Verlauf.
- **Aufräumen**: Beim Öffnen werden überfällige Termine angezeigt (abhaken, verwerfen oder
  einzeln/gesammelt verschieben), danach verpasste Deadlines.
- **Backup**: Export und Import als JSON (Einstellungen).

Die Daten liegen aktuell lokal im Browser (IndexedDB). Der Sync über Firebase folgt.

## Entwicklung

```bash
npm install
npm run dev        # Entwicklungsserver
npm test           # Unit-Tests (Wiederholungs- und Aufräum-Logik)
npm run build      # Produktions-Build nach dist/
npm run preview    # Build lokal ansehen
```

## Aufbau

- `src/db`: Datentypen, Dexie-Datenbank, Aktionen (anlegen, ändern, Backup)
- `src/lib/recurrence.ts`: Regeln für Wiederholungen (Zeiträume, Fortschritt)
- `src/lib/selectors.ts`: Überfällig, verpasste Deadlines, aktiv/pausiert
- `src/views`: Heute, Aufgaben, Ziele, Ziel-Detail, Einstellungen
- `src/components`: Editoren, Aufräumen-Dialog, Listenzeilen
