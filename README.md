# SakariHeitaja

A Telegram bot that follows and commentates disc golf competitions live from [Disc Golf Metrix](https://discgolfmetrix.com/). When a tracked player finishes a hole, the bot fires off a commentary message in Finnish — praising good scores and mercilessly roasting bad ones.

## Features

- **Live commentary** — polls Metrix API and sends hole-by-hole commentary as results come in
- **Smart polling** — adaptive intervals (30s active → 60s idle → 120s dormant) with exponential backoff on errors
- **Player tracking** — follow specific players per chat group
- **Score history** — query best scores by course name or ID
- **Special scores** — tracks aces, eagles, and albatrosses to the database
- **Morning greeter** — daily good morning message

## Commands

### Competition
| Command | Description |
|---|---|
| `/follow <metrixId>` | Start following a competition |
| `/lopeta <id>` | Stop following a competition |
| `/pelit` | List active competitions |
| `/top5 <id>` | Show top 5 results by division |
| `/score <name>` | Show a player's current score and position |

### Players
| Command | Description |
|---|---|
| `/lisaa <name>` | Add a player to tracked players |
| `/poista <name>` | Remove a player from tracked players |
| `/pelaajat` | List tracked players |

### Scores
| Command | Description |
|---|---|
| `/tulokset <course>` | Show top 10 scores for a course (name or ID) |

### Fun
| Command | Description |
|---|---|
| `/hep <text>` | Announce you're playing today |
| `/pelei` | List today's game plans |
| `/kukakirjaa <names...>` | Randomly pick who keeps score |
| `/hyva` | You know what this does |
| `/apua` | Show command list |

## Tech Stack

- **TypeScript 5** — strict mode, CommonJS output
- **grammY** — Telegram bot framework
- **TypeORM + mysql2** — type-safe DB access, parameterized queries
- **MariaDB** — database
- **Docker** — containerized deployment

## Setup

### Environment variables

```
TOKEN=your_telegram_bot_token
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
```

### Run locally

```bash
npm install
npm run dev
```

### Build & run

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t sakariheitaja .
docker run --env-file .env sakariheitaja
```
