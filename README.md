# ORION Backend

> Personal AI assistant backend — Node.js · TypeScript · PostgreSQL (Neon) · Groq

The server powering **ORION** — a voice-first Android AI assistant. Handles JWT auth, chat persistence, and LLM inference via Groq's Llama3-70B. Built to be lean, typed, and production-ready.

---

## Prerequisites

Before running this project, ensure you have the following:

- **Node.js** 20 LTS or higher — [Download](https://nodejs.org)
- **npm** 9+ (bundled with Node.js)
- **Neon PostgreSQL account** — [Sign up free](https://neon.tech) and create a new project to get your `DATABASE_URL`
- **Groq API key** — [Get one free](https://console.groq.com) from the Groq console
- **Git** — for cloning the repository

---

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js 20 |
| Language | TypeScript |
| Framework | Express |
| Database | PostgreSQL via [Neon](https://neon.tech) |
| LLM | Groq — `llama3-70b-8192` |
| Auth | JWT (access + refresh tokens) |
| Voice Transcription | Groq Whisper |
| Linting / Formatting | ESLint + Prettier |

---

## Project Structure

```
orion-backend/
├── src/
│   ├── config/          # Env config, DB config, Groq client init
│   ├── controllers/     # Route handlers (auth, chat, transcribe)
│   ├── database/        # Neon pool setup, migrations
│   ├── middleware/      # JWT auth guard, error handler, request logger
│   ├── models/          # DB schema types
│   ├── repositories/    # Data access layer (users, messages)
│   ├── routes/          # Express router definitions
│   ├── services/        # Business logic (auth service, chat service, groq service)
│   ├── types/           # Shared TypeScript interfaces
│   └── server.ts        # App entry point
├── .env.example
├── nodemon.json
├── tsconfig.json
├── eslint.config.js
└── package.json
```

---

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/chiku0210/orion-backend.git
cd orion-backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Neon DATABASE_URL, JWT secrets, and Groq API key

# 4. Run database migrations
npm run migrate

# 5. Start dev server
npm run dev
```

---

## Database Setup (Neon)

1. Go to [neon.tech](https://neon.tech) and create a new project
2. Copy the **connection string** from the Neon dashboard (it looks like `postgresql://user:password@host/dbname?sslmode=require`)
3. Paste it as `DATABASE_URL` in your `.env` file
4. Run migrations to initialize the schema:

```bash
npm run migrate
```

---

## Environment Variables

Copy `.env.example` and fill in your values:

```bash
cp .env.example .env
```

```env
PORT=3000
NODE_ENV=development

# Neon PostgreSQL
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Groq
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama3-70b-8192
```

> ⚠️ Never commit your `.env` file. It is already in `.gitignore`.

---

## API Endpoints

### Auth — `/auth`

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Register new user |
| `POST` | `/auth/login` | ❌ | Login, returns JWT |
| `POST` | `/auth/refresh` | ❌ | Refresh access token |
| `POST` | `/auth/logout` | ✅ | Invalidate refresh token |

### Chat — `/chat`

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/chat/send` | ✅ | Send message, get LLM response |
| `GET` | `/chat/history` | ✅ | Fetch conversation history |
| `DELETE` | `/chat/history` | ✅ | Clear all chat history |

### Transcription — `/transcribe`

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/transcribe` | ✅ | Upload audio, returns transcript via Groq Whisper |

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Dev server with hot reload via nodemon |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled build |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |

---

## Testing

Manual API testing using `curl`:

```bash
# Register a new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test@1234"}'

# Login and capture token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test@1234"}'

# Send a chat message (replace <token> with your access token)
curl -X POST http://localhost:3000/chat/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message": "Hello ORION"}'

# Fetch chat history
curl -X GET http://localhost:3000/chat/history \
  -H "Authorization: Bearer <token>"
```

> Automated test suite will be introduced in Phase 2 using Jest + Supertest.

---

## Troubleshooting

**`ECONNREFUSED` or DB connection error**
- Verify `DATABASE_URL` in `.env` is correct and includes `?sslmode=require`
- Check your Neon project is active (free tier projects may sleep after inactivity — wake them from the dashboard)

**`Invalid token` / `401 Unauthorized`**
- Access tokens expire in 15 minutes by default. Use `/auth/refresh` with your refresh token to get a new one
- Ensure you're passing the token as `Authorization: Bearer <token>` (not just the raw token)

**`Cannot find module` after install**
- Delete `node_modules` and `dist/`, then reinstall:
  ```bash
  rm -rf node_modules dist
  npm install
  ```

**Groq API errors (`429 Too Many Requests`)**
- You've hit Groq's free-tier rate limit. Wait a few seconds and retry
- Check your `GROQ_API_KEY` is valid at [console.groq.com](https://console.groq.com)

**Port already in use (`EADDRINUSE :3000`)**
- Kill the existing process: `lsof -ti:3000 | xargs kill -9`
- Or change `PORT` in `.env` to another value (e.g., `3001`)

---

## Related

- **Mobile App:** [orion-mobile](https://github.com/chiku0210/orion-mobile) — React Native Android client
- **PRD:** ORION AI Voice Assistant MVP Specification

---

<h3 align="center">Built by <a href="https://github.com/chiku0210">Nielless Acharya</a></h3>
