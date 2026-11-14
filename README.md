# Skillink: less résumé, more real you

A pre-event recruitment matchmaking prototype for City of Espoo events. Companies post a real
problem they are working on, participants show how they would approach it, and both sides meet
for a real conversation. Agreed meetings export to Brella, Tavata and `.ics` calendars.

## Run it locally

It's a zero-build app: plain HTML, CSS and JavaScript ES modules. Serve the folder over HTTP:

```bash
py -m http.server 5173
```

Then open http://localhost:5173. Use **Reset demo data** in the header to restore the seed data.

## Repository layout

| Path | What it is |
| --- | --- |
| `index.html`, `css/`, `js/` | The Skillink app (codebase A) |
| `.claude/skills/` | Project skills: EU AI Act guardrails, ESCO matchmaking, Espoo UI |
| `CLAUDE.md` | Architecture notes and conventions |
| `docs/COMBINING.md` | Plan for merging in the second codebase (codebase B) |

## Combining two codebases

This repository will merge Skillink with a second codebase. The steps are in
[docs/COMBINING.md](docs/COMBINING.md).
