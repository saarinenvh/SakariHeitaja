# SakariHeitaja Refactoring Plan

Migration from legacy JavaScript (ESM) to modern TypeScript architecture.

The bot stays live throughout — every phase is independently shippable.

---

## Completed Work

### JavaScript refactoring
- **Bug fixes** — pool instead of single connection, fixed WHERE clause, fixed vacuous-true competition end, fixed daily game reset
- **Smart poller** — adaptive intervals (30s/60s/120s), exponential backoff, jitter, EventEmitter-based
- **DB layer** — `db/connection` + domain-split `db/queries/` replacing monolithic `async/queries.mjs`
- **Game pipeline** — `Orchestrator`, `Poller`, `changeDetector`, `commentary` replacing 491-line God class
- **Bot handlers** — all commands split into `bot/handlers/` with `register(bot)` pattern
- **State** — `competitionRegistry` replacing raw global object
- **Scheduler** — `morningGreeter` extracted from app.mjs
- **Cleanup** — removed handicap feature, babelrc, unused deps (rxjs, winston, pm2, node-fetch)

### TypeScript + grammY migration
- **TypeScript 5.x** with strict mode, CommonJS output
- **grammY** replacing `node-telegram-bot-api` — zero vulnerabilities
- **express + body-parser removed** — grammY handles polling internally
- **Full type coverage** — `types/metrix.ts` models the Metrix API response
- **Shared `query` helper** in `db/connection.ts` — no more duplication across query files
- **`bot.catch()`** handles Telegram errors instead of `process.on("unhandledRejection")`

### TypeORM + features/disc-golf structure
- **TypeORM + mysql2** replacing raw `mysql` — zero runtime vulnerabilities
- **9 entities** in `db/entities/` — typed schema, `synchronize: false`
- **5 repositories** in `db/repositories/` — all user input parameterized (`?`), SQL injection eliminated
- **Service layer** in `features/disc-golf/services/` — business logic separated from data access
- **`features/disc-golf/`** — domain home for orchestrator, poller, changeDetector, commentary
- **Handler ordering** — `registerFun` explicitly last; its `message:text` catch-all blocks subsequent handlers

Current structure:
```
src/
  app.ts
  types/metrix.ts
  bot/bot.ts + handlers/          ← call services, registerFun last
  config/phrases.ts
  db/dataSource.ts + entities/ + repositories/
  features/disc-golf/
    orchestrator, poller, changeDetector, commentary
    services/                     ← PlayerService, CompetitionService, ScoreService, CourseService
  lib/http, utils, weather, logger
  scheduler/morningGreeter
  state/competitionRegistry
```

---

## Phase 3: Tests

Use **Vitest** — TypeScript-native, no config overhead.

```
npm install -D vitest
```

### Priority targets

| Module | Type | Why |
|--------|------|-----|
| `changeDetector` | Unit | Pure function, no deps, highest value |
| `commentary` | Unit | Pure function |
| Repositories | Integration | Test against a real local DB |
| Handlers | Unit | Mock `Bot` instance |
| `Poller` | Unit | Fake timers |

Add `"test": "vitest"` script. Aim for full coverage on pure functions first.

---

## Key Risks

**TypeORM vs MariaDB schema mismatch**
`synchronize: false` always. Never let TypeORM alter the production schema. Generate a migration file to document the schema but do not run it on production — schema already exists.
