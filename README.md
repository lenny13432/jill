# Jils Sweet 16 🎉

Partyplaner für Jils 16. Geburtstag am **27.11.2026**.
Countdown, Location, Gäste, To-dos, Getränke, Equipment, Motto, Budget, Ablauf, Playlist, Einladung und Foto-Moodboard.

Läuft auf **Cloudflare Workers** mit einer **D1-Datenbank**. Alle Listen und Fotos liegen in der Datenbank und sind auf jedem Handy und PC gleich. Ein Party-Passwort schützt die Planung.

```
public/            Die Website (index.html, Icons, Manifest)
src/worker.js      Die API unter /api (Listen speichern, Fotos hoch- und runterladen)
migrations/        Datenbank-Tabellen für D1
wrangler.toml      Cloudflare-Einstellungen
```

---

## Einrichten (einmalig, ca. 10 Minuten)

Du brauchst: einen kostenlosen Cloudflare-Account, einen GitHub-Account und [Node.js](https://nodejs.org) auf deinem PC.

### 1. Projekt holen und Pakete installieren

```bash
git clone https://github.com/DEIN-NAME/jil-sweet16.git
cd jil-sweet16
npm install
npx wrangler login
```

`wrangler login` öffnet den Browser, dort bei Cloudflare bestätigen.

### 2. Datenbank anlegen

```bash
npm run db:create
```

Die Ausgabe zeigt eine `database_id`. Diese ID in `wrangler.toml` bei `database_id = "..."` eintragen und speichern.

### 3. Tabellen anlegen

Passiert automatisch beim ersten Aufruf der Seite. Optional per Hand:

```bash
npm run db:migrate
```

**Prüfen, ob alles verbunden ist:** `https://DEINE-ADRESSE/api/health` öffnen.
`"database": true` heißt: alles gut. Sonst steht dort, was fehlt.

### 4. Party-Passwort festlegen

```bash
npm run password
```

Ein Passwort eintippen, z. B. `jil16party`. Das gibst du allen, die mitplanen dürfen.
Ohne Passwort kann jeder mit dem Link alles ändern.

### 5. Online stellen

```bash
npm run deploy
```

Am Ende steht die Adresse, z. B. `https://jil-sweet16.DEIN-NAME.workers.dev`. Fertig!

---

## Automatisch aktualisieren über GitHub

Damit jede Änderung auf GitHub automatisch online geht:

1. `wrangler.toml` mit der eingetragenen `database_id` committen und pushen.
2. Im Cloudflare-Dashboard: **Workers & Pages** → Worker **jil-sweet16** → **Settings** → **Builds** → **Connect** und das GitHub-Repository auswählen.
3. Build-Befehl leer lassen, Deploy-Befehl: `npx wrangler deploy`.

Ab dann reicht ein `git push`.

> Die Datenbank-ID ist kein Geheimnis und darf im Repository stehen. Das Passwort steht **nicht** im Code, es liegt sicher als Secret bei Cloudflare.

---

## Auf dem Handy wie eine App

Seite im Handy-Browser öffnen:
- **iPhone (Safari):** Teilen → *Zum Home-Bildschirm*
- **Android (Chrome):** Menü ⋮ → *App installieren*

Dann gibt es ein „16“-Icon auf dem Homescreen und die Seite öffnet ohne Browserleiste.

---

## Lokal testen

```bash
npm run dev
```

Öffnet die Seite unter `http://localhost:8787` mit einer lokalen Test-Datenbank.
Für ein Test-Passwort eine Datei `.dev.vars` mit `EDIT_KEY=test` anlegen.

---

## Gut zu wissen

- **Fotos** werden im Browser automatisch verkleinert und landen in der D1-Datenbank (max. ca. 1,8 MB pro Bild). Der kostenlose D1-Plan hat 5 GB, das reicht für tausende Fotos.
- **Gleichzeitig planen:** Änderungen anderer erscheinen nach ein paar Sekunden von selbst.
- **Kosten:** Mit dem kostenlosen Cloudflare-Plan (Workers + D1) kostet das nichts.
