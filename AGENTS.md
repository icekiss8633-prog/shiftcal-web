# ShiftCalWeb Project Rules

## Scope

- Work only in `/Users/icekiss/Desktop/ShiftCalWeb`.
- Keep the original Swift project at `/Users/icekiss/Desktop/ShiftCal` untouched.
- Do not commit personal schedules, notes, exported JSON backups, API keys, tokens, or `.env` files.

## Product requirements

- Mobile-first iPhone Safari UI.
- Keep the app local-first: schedules, notes, overrides, and custom shifts stay in browser `localStorage`.
- Do not add login, advertising, analytics, or an unnecessary external backend.
- Preserve JSON backup and restore compatibility when changing storage fields.
- Keep official holidays, anniversaries, and user-defined shifts as separate concepts.
- User-defined shifts must remain distinct from the calculated base pattern and support user-selected colors.

## Change workflow

1. Inspect existing code and tests before editing.
2. Add or update a focused contract test for changed behavior.
3. Run JavaScript syntax checks and the complete test suite.
4. Verify the UI in a browser; use `computer_use`/cua-driver only when testing the real Mac UI is necessary.
5. Update the service-worker cache version when deployed assets change.
6. Update README documentation for user-visible features.
7. Commit only intentional source, test, workflow, and documentation files.
8. Push to `main` only after local checks pass, then verify the GitHub Actions run and public Pages response.

## Required checks

```sh
node --check app.js
node --check storage.js
node --check shift-engine.js
node --check stats-engine.js
node --check holiday-engine.js
node --check app-utils.js
node --check service-worker.js
node tests/storage.test.js
node tests/custom-shift.test.js
node tests/custom-shift-catalog.test.js
node tests/stats-engine.test.js
node tests/holiday-engine.test.js
node tests/app-utils.test.js
node tests/ui-copy.test.js
```

## Safety

- Never type or commit secrets.
- Do not use real personal schedule data in tests.
- Prefer small, targeted patches over rewriting whole files.
- Verify changed behavior with real tool output before reporting success.
