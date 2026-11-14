# Combining the two codebases

- **Codebase A:** Skillink, the files on `main` today.
- **Codebase B:** not added yet.

## Branch workflow

1. `main` always holds a working app.
2. Codebase B is imported on a branch called `import/codebase-b`, keeping its git history.
3. The integration work (shared styles, routing, state, data model) happens on
   `integrate/codebase-b` and reaches `main` through a pull request.

## Importing codebase B

If codebase B is a git repo (on GitHub or local), keep its history by putting it in a
subfolder first:

```bash
git checkout -b import/codebase-b
git subtree add --prefix=vendor/codebase-b <repo-url-or-path> main
```

If it's a plain folder with no git history, copy it into `vendor/codebase-b/` and commit.

## Integration checklist

- [ ] Agree on one stack. Skillink is zero-build vanilla JS; decide whether B adapts to it or the
      reverse.
- [ ] One router and one state store (`js/store.js`, `localStorage` key `skillink.v1`).
- [ ] One design token set (`css/tokens.css`).
- [ ] Keep the EU AI Act guardrails: no scoring or ranking of people, pseudonymity, no
      demographic fields, 30-day purge (`.claude/skills/eu-ai-act-compliance/`).
- [ ] Update `CLAUDE.md`, `README.md` and the guide steps in `js/views/guide.js`.
- [ ] Remove `vendor/codebase-b/` once everything has moved into place.
