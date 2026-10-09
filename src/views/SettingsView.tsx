import { useEffect, useState } from 'react';
import { exportData, importData, type Backup } from '../db/actions';
import { todayISO } from '../lib/date';

export function SettingsView() {
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, []);

  const download = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planer-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const upload = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as Backup;
      if (!confirm('Alle aktuellen Daten werden durch die Sicherung ersetzt. Fortfahren?')) return;
      await importData(data);
      setMessage('Sicherung wiederhergestellt ✓');
    } catch (e) {
      setMessage(`Fehler: ${(e as Error).message}`);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Einstellungen</h1>

      <div className="card space-y-3 p-4">
        <h2 className="font-semibold">Daten</h2>
        <p className="text-sm text-slate-600">
          Deine Daten liegen aktuell nur lokal in diesem Browser. Mach ab und zu eine Sicherung – Sync zwischen Geräten
          kommt mit Firebase.
        </p>
        {persisted === false && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Der Browser hat dauerhafte Speicherung noch nicht bestätigt. Installiere die App („Zum Startbildschirm
            hinzufügen"), dann werden die Daten nicht automatisch gelöscht.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={download}>
            ⬇ Sicherung herunterladen
          </button>
          <label className="btn-secondary cursor-pointer">
            ⬆ Sicherung einspielen
            <input type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        </div>
        {message && <p className="text-sm">{message}</p>}
      </div>

      <div className="card space-y-2 p-4 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-900">So funktioniert's</h2>
        <p>
          <strong>📅 Termin</strong> = wann du es machen <em>willst</em>. Ist er vorbei, landet die Aufgabe beim Öffnen im
          Aufräumen-Dialog.
        </p>
        <p>
          <strong>⚑ Deadline</strong> = bis wann es erledigt sein <em>muss</em>. Verpasste Deadlines werden nach den
          überfälligen Terminen angezeigt.
        </p>
        <p>
          <strong>↻ Wiederholungen</strong> laufen einfach im aktuellen Zeitraum weiter – verpasste Tage musst du nicht
          abarbeiten. Nachtragen geht über ▾ an der Wiederholung.
        </p>
        <p>
          <strong>⏸ Pausieren</strong> geht für ganze Ziele, einzelne Aufgaben und Wiederholungen.
        </p>
      </div>
    </div>
  );
}
