# Trivvia

Trivvia is a real-time multiplayer trivia game you play with strangers on the internet. Everyone's in the same room, a trivia question appears, and the first person to type the correct answer in the chat wins the round and starts a streak. It's fast, it's live, and there's no waiting around for a lobby to fill up.

## How it works

You jump in, no account needed, and get a random username like "FuzzyBadger". A question shows up for everyone at the same time, and you just... answer it in the chat. The answer matching is fuzzy, so small typos won't kill you. If nobody gets it, the game slowly reveals the answer one character at a time as a hint until someone figures it out or the answer is fully revealed.

There's a live leaderboard on the side showing everyone currently in the room, sorted by best streak. If you leave and come back as a registered user, your streak carries over.

Guest players get auto-kicked after sitting idle for too long, the game shows a "still there?" warning before booting you. Registered users just show as offline and stay on the leaderboard.

## Features

- Jump in as a guest instantly, no sign-up required
- Real-time questions, answers, and chats
- Progressive hint reveals if nobody's getting it
- Streak tracking: consecutive correct answers build your streak
- Live leaderboard with online/away/offline presence
- Sign up to save progress
- Premium subscription via Stripe (unlocks extra question categories)
- Contact form, about page, account management

## Tech

- **Frontend** — React 19, TypeScript, Redux Toolkit, Vite — deployed on Vercel
- **Backend** — Go, Gin — deployed on Railway
- **Database** — PostgreSQL
- **Cache / real-time** — Redis (sessions, pub/sub, chat, hints)
- **Email** — Zoho Mail via SMTP
- **Payments** — Stripe

## Running locally

**Backend**

```bash
cp .env.example .env
# fill in your DB, Redis, and other credentials

# seed the database (run once on a fresh PostgreSQL database)
psql -d trivvia -f setup.sql

go run main.go
```

**Frontend**

```bash
cd ../trivvia-frontend
npm install
npm run dev
```

The backend runs on `http://localhost:8081` and the frontend on `http://localhost:5173` by default.

