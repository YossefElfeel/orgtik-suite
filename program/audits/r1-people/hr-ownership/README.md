# Local HR and ownership acceptance

Final frozen-source run: 2026-10-08, **82/82 checks**, 13 captures, no transport errors. [The report](report.json) pins six source hashes, all matched after the run. Checks include responsive layout, five-catalog-backed EN/AR copy, RTL/theme state and actual scheduled/cancelled/immediate offboarding, administrative tracking, lost-response/reload recovery, ownership recovery, seat preservation and continuing access to another workspace. This is local package evidence, not 82 separate journeys or hosted release acceptance.

The runner only targets localhost and the `r1-people-local` realm. It creates unique disposable fixture accounts; it does not reset business data or advance the frozen clock (`2026-10-07T09:00:00.000Z`). No passwords, session tokens or invitation capabilities are saved in the report. Equipment/final-pay controls record mock administrative review, not payments.

From the repository root, with the isolated API ports 5100/5104 and SOS/HR development ports 3116/3104 already running:

```powershell
node program/audits/r1-people/hr-ownership/people-journeys.cjs
```

Set `PLAYWRIGHT_MODULE` to the installed Playwright module when the bundled Windows runtime path differs. The runner reads current catalogs and creates a fresh report beside itself; preserve this reviewed report before a new run. Do not point the runner at production or the shared hosted sandbox.
