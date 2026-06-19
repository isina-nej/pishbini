# Initial MVP — World Cup Prediction Campaign

## Why

Launch a production-ready World Cup prediction campaign for Pishro Sarmaye targeting Instagram Story traffic. Participants predict match outcomes, earn configurable points, refer friends, and compete for the highest score prize.

## What

- Mobile-first RTL Persian public app (predict, register, referral, leaderboard)
- Full admin panel (teams, matches, users, point rules, settlement, campaign freeze)
- MySQL + Prisma backend via Next.js Route Handlers
- Configurable point rules (no hardcoded values)
- Referral system with SMS confirmation
- Transaction-safe settlement engine

## Non-Goals

- OTP phone verification
- CAPTCHA / device fingerprinting
- Match re-settlement flow
- Team flag file upload (URL only in MVP)
- Automated test suite
