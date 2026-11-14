# Skillink: less résumé, more real you

A pre-event matchmaking prototype for City of Espoo and Business Espoo events. Companies post a
real problem they are working on, participants show how they would approach it, and both sides
meet for a real conversation. Agreed meetings export to Brella, Tavata and `.ics` calendars.

This copy uses the **Espoo blue** palette. A sibling project, `X:\Claude\Junction_Project`, is the
same app in the green palette (port 8080).

## Run it in IntelliJ IDEA (Scala backend)

The Scala server owns the demo state and every rule (meeting requests, the 5-request cap,
identity reveal, the 30-day purge, the forbidden-field audit). It serves the HTML, CSS and
JavaScript from this folder and saves the state to `data/state.json`.

### 1. Prerequisites

- **IntelliJ IDEA** (Community is fine) with the **Scala plugin** (Settings → Plugins →
  Marketplace → Scala).
- A **JDK 17 or newer**. JDK 21 or 25 both work.
- Internet access the first time, so sbt can download Scala 2.13 and the `ujson` library.

### 2. Open the project

1. **File → Open**, select this folder (the one containing `build.sbt`).
2. When IntelliJ asks, choose **Load sbt project** (or **Import as sbt project**).
3. Wait for the sbt import to finish (bottom status bar).
4. Check **File → Project Structure → Project SDK** is JDK 17 or newer.

### 3. Start the server

- Pick the **Skillink server** run configuration (top right) and click **Run**, or
- Open `src/main/scala/skillink/SkillinkServer.scala` and click the green **Run** arrow next to
  `object SkillinkServer`, or
- In IntelliJ's terminal, run `sbt run`.

The run console prints:

```
Skillink (blue palette) is running at http://localhost:8081
```

Open **http://localhost:8081**. Both sides (Talent and Employer) and the Event team view share
the server's state, also across browser tabs. **Reset demo data** in the header restores the seed.

To use another port, add `-Dskillink.port=8090` to the run configuration's VM options. If the run
configuration starts somewhere other than this folder, set its working directory to this folder.

### Without the Scala server

The frontend still runs on any static server, with the rules running in the browser and the
state kept in `localStorage`:

```bash
py -m http.server 5180
```

## How it fits together

```
browser (index.html, js/)                     Scala server (src/main/scala/skillink)
  views call store.js functions   ──POST /api/action {"type":"requestMeeting",...}──▶ Rules.scala validates and applies
  store.js applies the change at once          StateStore.scala writes data/state.json
  and adopts the state the server returns ◀── {"rev","state"} or {"error","state"} ──
```

- `GET /api/state` returns the current state. `POST /api/action` takes one named action.
- If the server rejects a change (for example, another tab booked that time first), the page
  shows the reason and switches to the server's state.
- The server refuses any action or state containing a demographic, pedigree or scoring field.
- It listens on 127.0.0.1 only. It is a local demo with fictional data, with no login.

| Scala file | What it does |
| --- | --- |
| `SkillinkServer.scala` | Startup, port, seed loading |
| `SkillinkHttpHandler.scala` | Routes, JSON-only actions, same-origin check |
| `Rules.scala` | Every action and its validation (mirrors `js/store.js`) |
| `Aggregates.scala` | Anonymous counts kept by the purge and consent withdrawal |
| `StateStore.scala` | One shared state, atomic saves to `data/state.json` |
| `StaticFiles.scala` | Serves `index.html`, `css/`, `js/`, `assets/` only |

After editing `js/seed.js`, regenerate the server's copy of the seed:

```bash
node scripts/export-seed.mjs
```

## Repository layout

| Path | What it is |
| --- | --- |
| `index.html`, `css/`, `js/`, `assets/` | The Skillink frontend |
| `build.sbt`, `project/`, `src/main/` | The Scala backend (sbt project) |
| `data/` | Saved demo state (`state.json`, not committed) |
| `scripts/export-seed.mjs` | Writes `src/main/resources/seed.json` from `js/seed.js` |
| `.claude/skills/` | Project skills: EU AI Act guardrails, ESCO matchmaking, Espoo UI |
| `CLAUDE.md` | Architecture notes and conventions |
| `docs/COMBINING.md` | Plan for merging in the second codebase |
