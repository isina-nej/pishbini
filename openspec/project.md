# pishbini — World Cup Prediction Campaign

## Overview

Mobile-first RTL Persian prediction web app for the Pishro Sarmaye World Cup campaign at `wc.pishrosarmaye.com`. Users predict match outcomes within 24 hours of kickoff, register with name/phone, earn configurable points, and share referral links. The participant with the highest total score at campaign end wins the prize.

## Tech Stack

- Next.js App Router (TypeScript) — frontend and backend
- MySQL + Prisma ORM
- Tailwind CSS + Framer Motion
- Zod + React Hook Form
- OpenSpec for spec-driven development

## Capabilities

| Spec | Description |
|------|-------------|
| mobile-prediction-flow | Public prediction UX and submission |
| admin-management-panel | Admin auth, dashboard, audit |
| team-and-match-management | Teams and matches CRUD + settlement |
| points-and-settlement-engine | Configurable points and transactional settlement |
| referral-system | Referral codes and rewards |
| sms-system | SMS abstraction and logging |
| leaderboard | Public and admin leaderboards |
| deployment | VPS deployment guide |

## Critical Rules

1. Predictions rejected when `now >= match.startTime`
2. Matches visible only in 24h pre-kickoff window
3. Point values from DB — never hardcoded
4. Full phone numbers never exposed publicly
5. One phone per user, one prediction per user per match
