# SakariHeitaja Refactoring Plan

Migration from legacy JavaScript (ESM) to modern TypeScript architecture.

The bot stays live throughout — every phase is independently shippable.

---

## Phase 0: Fix Critical Bugs First (1-2 days)

Fix these in the existing JS before touching TypeScript — migrating broken code gives you type-safe broken code.

1. **`async/queries.mjs` line 176** — `fetchCompetitionsByChatId` has `WHERE chatId = chatId` (literal string), returns all competitions for all chats. Fix the WHERE clause.
2. **`fetchPlayers()`** — the async wrapper returns `undefined` always. Fix to actually return results.
3. **`async/db.mjs`** — switch from `createConnection` to `createPool`. Single connections silently drop after server timeout.
4. **`app.mjs` `todaysGames()`** — `!new Date()... == date` evaluates `false` before the comparison. Daily reset never fires.
5. **`handicap/calc.mjs`** — `countScores()` accumulates onto module-level player objects. Running it twice corrupts scores. Add a reset step at the top.

---

## Phase 1: TypeScript Toolchain (1 day)

- Add `typescript`, `ts-node`, all `@types/*` packages
- Add `typeorm` + `mysql2` + `reflect-metadata`
- Create `tsconfig.json`:
  - `strict: true`
  - `outDir: ./dist`
  - `rootDir: ./src`
  - `experimentalDecorators: true`
  - `emitDecoratorMetadata: true`
- Create `src/` directory — existing `.mjs` files stay untouched
- Update `package.json` scripts:
  - `"build": "tsc"`
  - `"start:ts": "ts-node src/app.ts"`
  - `"start": "node dist/app.js"`
  - `"start:legacy": "node --experimental-modules app.mjs"` (keep as fallback)
- Update Dockerfile base image to `node:20`

---

## Phase 2: Persistence Layer (3-4 days)

**Highest security priority** — replaces all SQL injection vulnerabilities in `async/queries.mjs`.

### Entities (`src/entities/`)
One file per existing table, matching the current schema exactly. Use `synchronize: false` always — never auto-alter the production schema.

Tables: `Players`, `Chats`, `Competitions`, `Scores`, `Courses`, `Aces`, `Eagles`, `Albatrosses`, `PlayerToChat`

### Repositories (`src/repositories/`)
- `PlayerRepository.ts` — `fetchPlayer`, `addPlayer`, `fetchPlayersLinkedToChat`, etc.
- `CompetitionRepository.ts` — `fetchUnfinishedCompetitions`, `addCompetition`, `deleteCompetition`, `markCompetitionFinished`
- `ChatRepository.ts` — `fetchChats`, `addChatIfUndefined`
- `ScoreRepository.ts` — `addResults`, `fetchScoresByCourseName`, `addAce`, `addEagle`, `addAlbatross`
- `CourseRepository.ts` — `fetchCourse`, `addCourse`

All methods use TypeORM `QueryBuilder` with parameterized values — no string interpolation for user input.

### `src/database/dataSource.ts`
TypeORM `DataSource` configured with `synchronize: false` and `logging: true` in development.

### Tests
Write unit/integration tests here — **first test coverage the project has**.

The bot still runs on old JS; the new layer is not wired in until Phase 5.

---

## Phase 3: Core Types + HTTP Client (2 days)

### `src/types/metrix.ts`
Typed interfaces for the Metrix API response:
```typescript
interface MetrixApiResponse { ... }
interface MetrixCompetition { ... }
interface MetrixPlayerResult { Name, Sum, Diff, OrderNumber, ClassName, PlayerResults }
interface MetrixHoleResult { Result, Diff, PEN }
```

### `src/types/events.ts`
Normalized internal event model:
```typescript
type ScoreEventType = 'ace' | 'albatross' | 'eagle' | 'birdie' | 'par' | 'bogey' | 'double_bogey' | 'worse';

interface ScoreEvent {
  type: ScoreEventType;
  playerName: string;
  playerId: number;
  hole: number;
  holeScore: number;
  scoreRelative: number;
  totalDiff: number;
  orderNumber: number;
  hasOb: boolean;
  timestamp: Date;
}
```

### `src/http/metrixClient.ts`
Replaces `async/functions.mjs`. Returns typed `MetrixApiResponse` with proper error handling — no silent `console.log` on failures.

---

## Phase 4: Game Pipeline Decomposition (5-7 days)

Break `game/game.mjs` (the 491-line God class) into focused pipeline modules.

### Target architecture

```
Poller → ChangeDetector → EventNormalizer → CommentaryEngine → TelegramSender
                                                                      ↓
                                                               ScoreRepository
```

### `src/poller/Poller.ts`
Owns only one responsibility: fetch the Metrix API on a schedule and emit raw responses.

```typescript
class Poller extends EventEmitter {
  start(): void   // begins interval loop
  stop(): void    // sets following = false cleanly
  // emits: 'data' with MetrixApiResponse
  // emits: 'error' with Error
}
```

Behaviors to preserve:
- 5-second poll interval while competition is live
- Pre-competition: sleep until start time
- Resilient: log fetch errors but do not crash

### `src/detection/ChangeDetector.ts`
Pure function — no class needed. Deterministic, no side effects, easiest to test.

```typescript
function detectChanges(
  prev: MetrixApiResponse,
  next: MetrixApiResponse,
  trackedPlayers: TrackedPlayer[]
): RawChange[]
```

Behaviors to preserve:
- Compare `Sum` first (cheap) before hole-level diff
- `Array.isArray(item)` check for unplayed holes
- Players with no `Sum` yet (haven't started) should not generate events

### `src/events/EventNormalizer.ts`
Converts `RawChange[]` into `ScoreEvent[]`. Determines `ScoreEventType` from `scoreRelative`. Detects ace (`Result === 1`), albatross (`Diff === -3`), eagle (`Diff === -2`), etc.

Consolidates logic currently scattered across `getPhraseForScore`, `checkAndSaveSuperbScores`, and `createPhrase` in `game.mjs`.

### `src/commentary/CommentaryEngine.ts`
```typescript
function generateComment(event: ScoreEvent, context: RoundContext): string
```

Move all Finnish text arrays from `responses/game.mjs` into `src/commentary/phrases.ts` as plain `const` exports. No behavior change — just a clean module boundary.

### `src/telegram/TelegramSender.ts`
Thin typed wrapper around `bot.sendMessage` and `bot.sendVideo`. All Telegram API calls go through this — never call `bot` directly from game logic. Enables mocking in tests.

### `src/game/GameOrchestrator.ts`
Thin coordinator that replaces `Game`. Wires Poller → ChangeDetector → EventNormalizer → CommentaryEngine → TelegramSender → ScoreRepository.

Handles competition-end: `markCompetitionFinished`, save results, send top list, stop the poller.

**Run GameOrchestrator in parallel with the old `game.mjs` on different competitions** to validate behavior parity before cutover.

---

## Phase 5: App.mjs Decomposition (3-4 days)

Split the 467-line monolith into focused handler modules.

### Command handlers (`src/handlers/`)
- `competitionHandlers.ts` — `/follow`, `/lopeta`, `/pelit`, `/top5`, `/score`
- `playerHandlers.ts` — `/lisaa`, `/poista`, `/pelaajat`
- `funHandlers.ts` — `/hyva`, `/kukakirjaa`, `/hep`, `/pelei`, `/apua`
- `weatherHandlers.ts` — `/saa`, `/randomsaa`
- `recipeHandlers.ts` — `/mitatanaansyotaisiin`
- `messageHandler.ts` — `bot.on('text', ...)` random response handler

Each handler file exports `register(bot: TelegramBot): void` instead of calling `bot.onText` at import time (fixes the `stupidfeatures` side-effect problem).

### State (`src/state/`)
- `CompetitionRegistry.ts` — replaces the raw global `competitionsToFollow` object. Uses `Map<chatId, Map<competitionId, GameOrchestrator>>` with proper `add`, `remove`, `get`, `cleanup` methods.
- `DailyGamePlan.ts` — replaces `let games = {}` and `let date` globals.

### Scheduler (`src/scheduler/MorningGreeter.ts`)
Extracts the `startTimer` morning greeting logic into an isolated class that can be started/stopped.

### `src/app.ts`
Slim entrypoint:
1. Initialize `DataSource`
2. Initialize Telegram bot
3. Register all handlers via `register(bot)`
4. Call `init()` to restore unfinished competitions from DB
5. Start `MorningGreeter`

---

## Phase 6: Handicap System (2 days)

Fix the mutable-singleton bug where `countScores()` accumulates onto module-level player objects — calling it twice silently corrupts results.

### `src/handicap/handicapData.ts`
Replaces `handicaps.mjs`. Exports only static player metadata (name, rating). No accumulated scores stored in module scope.

### `src/handicap/HandicapCalculator.ts`
Stateless — no singleton needed.

```typescript
async function calculateHandicapResults(
  competition: CompetitionDefinition
): Promise<HandicapResult[]>
```

Fetches data, computes scores in a local accumulator, returns results. Never mutates module-level state.

### `src/handicap/types.ts`
```typescript
interface CompetitionEntry { ... }
interface PlayerHandicap { ... }
interface HandicapResult { ... }
```

---

## Phase 7: Tests (2-3 days, ongoing)

Use **Vitest** — TypeScript-native, lighter than Jest.

### Coverage targets by module type

| Module | Coverage target | Notes |
|--------|----------------|-------|
| `ChangeDetector` | ~100% | Pure function, no dependencies |
| `EventNormalizer` | ~100% | Pure function |
| `HandicapCalculator` | ~100% | Pure function |
| `CommentaryEngine` | High | Test phrase selection logic |
| Repositories | Integration | Test against a real test DB |
| Handlers | Unit | Mock bot + repositories |
| Poller | Unit | Use fake timers |

Add `"test": "vitest"` script and minimal CI configuration.

---

## Phase 8: Cleanup (1-2 days)

After 2+ weeks of stable TypeScript operation:

1. Remove all `.mjs` files from root
2. Update Dockerfile:
   - Base image: `node:20-alpine`
   - Add `RUN npm run build`
   - Change CMD to `node dist/app.js`
3. Move `responses/recipebub.mjs` (808 KB) out of the source tree — load as a JSON data file at runtime, never compile it
4. Generate a baseline TypeORM migration file to document the current schema (not applied to production — schema already exists there)
5. Update `claude.md` with the final module map

---

## Timeline Summary

| Phase | Duration | Bot status during |
|-------|----------|-------------------|
| 0: Bug fixes in JS | 1-2 days | JS, bugs fixed |
| 1: TS toolchain | 1 day | JS |
| 2: DB repositories | 3-4 days | JS (new layer unused) |
| 3: Types + HTTP client | 2 days | JS |
| 4: Game pipeline | 5-7 days | Both run in parallel |
| 5: App decomposition | 3-4 days | Switchover at end |
| 6: Handicap system | 2 days | TS |
| 7: Tests | 2-3 days | TS |
| 8: Cleanup | 1-2 days | TS |
| **Total** | **~20-27 days** | |

---

## Key Risks and Mitigations

**Game behavior regression (Phase 4)**
The change detection logic has subtleties (e.g. `Array.isArray` check for unplayed holes). Run old `game.mjs` and new `GameOrchestrator` in parallel on different competitions for at least one full tournament before cutting over.

**TypeORM vs MariaDB schema mismatch**
Set `synchronize: false` always. Run a startup health-check that compares `DESCRIBE tablename` output against entity metadata.

**`recipebub.mjs` (808 KB) in the TS compiler path**
Keep it as a `.json` file outside `src/`, loaded with `fs.readFileSync` or a dynamic `import()` at runtime.

**`node-telegram-bot-api` type definitions**
The `@types` package may be incomplete. Use `allowJs: true` temporarily if needed for the bot import, and type-assert the bot instance at the `app.ts` boundary.

**Do not use RxJS**
It is already in `package.json` as a dead dependency. Do not introduce reactive/observable complexity — Node's built-in `EventEmitter` is sufficient for the Poller.
