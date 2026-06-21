# pishbini — World Cup Prediction Campaign

## Summary

Mobile-first RTL Persian prediction app for wc.pishrosarmaye.com.
Users predict matches within 24h of kickoff; highest points wins the campaign prize.
Next.js App Router handles both UI and API. MySQL via Prisma.

## Stack

- Next.js App Router (TypeScript)
- MySQL + Prisma ORM
- Tailwind CSS + Framer Motion
- Zod + React Hook Form
- OpenSpec for spec-driven changes

## Architecture Rules

- **Monolith**: No separate backend server. APIs = Route Handlers in `app/api/`.
- **Mobile-first**: Design for ~430px width. Desktop = centered mobile column.
- **RTL + Persian**: All public and admin UI in fa-IR.
- **Server validation**: Never trust client for match availability, points, or referrals.
- **Transactions**: Use Prisma `$transaction` for submit, referral reward, settlement.
- **KISS / YAGNI / SOLID**: No speculative features (OTP, CAPTCHA, re-settlement in MVP).

## Critical Business Rules (NEVER violate)

1. Predictions rejected when `now >= match.startTime` or match locked/finished/cancelled.
2. Matches visible only in 24h pre-kickoff window with SCHEDULED or ACTIVE status.
3. Point values come from `PointRule` table — never hardcode in code.
4. Full phone numbers never exposed on public APIs or pages.
5. One phone = one user. One prediction per user per match.
6. Referral reward once per referred user. No self-referral.
7. SMS failure must not fail registration.
8. Settlement is idempotent — reject double-settle.

## Knockout Bracket (separate from live matches)

- Bracket uses its own models (`BracketMatch`, `BracketPick`, `BracketSubmission`) — never extend live `Match`/`Prediction`.
- One bracket submission per user (by phone); picks must form a valid full tree.
- Champion must match the final match winner in picks.
- Draft stored client-side: `world-cup-bracket-draft-v1` (localStorage).
- Admin must validate and publish before public access.
- Routes: `/bracket`, `/bracket/submit`, `/bracket/success`; admin at `/admin/bracket`.

## Directory Conventions

- `app/` — routes and API handlers
- `components/public/` — user-facing UI
- `components/admin/` — admin UI
- `lib/` — domain logic, validation, integrations (no React)
- `prisma/` — schema, migrations, seed

## OpenSpec Workflow

Before large changes:

1. `openspec new change "<name>"`
2. Write proposal → design → tasks → specs
3. Get confirmation, then `/opsx:apply`
4. Archive when complete

Main specs: `openspec/specs/*/spec.md`

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run lint
npx prisma migrate dev
npm run db:seed
npx prisma studio
```

## Environment

See `.env.example`. Required: DATABASE_URL (mysql://), NEXT_PUBLIC_APP_URL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET.

## Admin Security

- HttpOnly session cookie, secret from env
- All `/api/admin/*` check session
- Audit log for sensitive actions
- Rate limit `POST /api/submit` by IP

## Deployment

See `docs/DEPLOYMENT.md` — Ubuntu, Nginx, Certbot, PM2, MySQL.
