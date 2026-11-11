# Scripts

`build-readme.mjs` writes the repository README from the public data at `https://alyn.dev/api/readme.json`. The [Weekly README](../.github/workflows/readme.yml) workflow runs it every Monday and commits the result.

```bash
npm run readme                                   # live data
ALYN_DATA=test/fixture-readme.json npm run readme  # offline
```
