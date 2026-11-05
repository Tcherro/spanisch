# Español

Persönliche Spanisch-Übungsapp (PWA, läuft offline auf dem iPhone).

- App: https://tcherro.github.io/spanisch/
- Inhalte: `data/` – wird jeden Montag automatisch aus der Vokabelliste und den neuen Unterrichtsmaterialien aktualisiert.
- Sprechen: Live-Gespräch im Claude-Sprachmodus mit wechselnden Personen; am Ende schreibt Claude einen Lernbericht (`#LERNBERICHT-ES … #ENDE`), den das Montags-Update mit `tools/talk_reports.py` in `data/focus.json` (nur Vokabeln und Grammatik-IDs) und in die Vokabelliste übernimmt.
- Werkzeuge: `tools/build_data.py` (Excel → vocab.json), `tools/grammar_src.py` (Grammatikübungen), `tools/dialogs_src.py` (Sprechdialoge), `tools/excel_exercises.py` (Übungen aus der Excel).

Der Lernfortschritt bleibt lokal auf dem Gerät.
