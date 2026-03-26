# ORION Backend

> Personal AI assistant backend — Node.js · TypeScript · PostgreSQL (Neon) · Groq

The server powering **ORION** — a voice-first Android AI assistant. Handles JWT auth, chat persistence, and LLM inference via Groq's Llama3-70B. Built to be lean, typed, and production-ready.

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

---

## Local Setup

```bash
# Install dependencies
npm install

# Run in dev mode (nodemon + ts-node)
npm run dev

# Build for production
npm run build

# Start production build
npm start
```

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

## Related

- **Mobile App:** [orion-mobile](https://github.com/chiku0210/orion-mobile) — React Native Android client
- **PRD:** ORION AI Voice Assistant MVP Specification

---

*Built by [Nielless Acharya](https://github.com/chiku0210)*
