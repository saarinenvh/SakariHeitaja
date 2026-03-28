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

Current structure:
```
src/
  app.ts
  types/metrix.ts
  bot/bot.ts + handlers/
  config/phrases.ts
  db/connection.ts + queries/
  game/orchestrator, poller, changeDetector, commentary
  lib/http, utils, weather, logger
  scheduler/morningGreeter
  state/competitionRegistry
```

---

## Phase 2: TypeORM

Replaces raw SQL string interpolation in `db/queries/` — the main remaining security risk (SQL injection via user input in chat names, player names, course names).

### Install

```
npm install typeorm mysql2 reflect-metadata
npm uninstall mysql @types/mysql
```

Add to `tsconfig.json`:
```json
"experimentalDecorators": true,
"emitDecoratorMetadata": true
```

### Entities (`src/db/entities/`)

One file per table, matching current schema exactly. Use `synchronize: false` always.

- `Player.ts`, `Chat.ts`, `Competition.ts`, `Course.ts`
- `Score.ts`, `Ace.ts`, `Eagle.ts`, `Albatross.ts`, `PlayerToChat.ts`

### Repositories (`src/db/repositories/`)

Replace each file in `db/queries/` 1-to-1:

- `PlayerRepository.ts` — `fetchPlayer`, `addPlayer`, `fetchPlayersLinkedToChat`, etc.
- `CompetitionRepository.ts` — `fetchUnfinishedCompetitions`, `addCompetition`, `markCompetitionFinished`, etc.
- `ChatRepository.ts` — `fetchChats`, `addChatIfUndefined`
- `ScoreRepository.ts` — `addResults`, `fetchScoresByCourseName`, `fetchScoresByCourseId`, `addAce`, `addEagle`, `addAlbatross`
- `CourseRepository.ts` — `fetchCourse`, `addCourse`

All use TypeORM `QueryBuilder` with parameterized values — no string interpolation for user input.

### `src/db/dataSource.ts`

```typescript
export const dataSource = new DataSource({
  type: "mysql",
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [__dirname + "/entities/*.js"],
});
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
