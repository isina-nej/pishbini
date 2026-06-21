# Mobile Knockout Bracket

## Why

Users want to predict the full World Cup knockout path from Round of 32 through champion, using an interactive bracket similar to Bracket Soccer but with our app's visual identity.

## What

- New route `/bracket` with mobile-first horizontal round navigation
- Winner selection per matchup with automatic advancement
- Downstream invalidation when earlier picks change
- localStorage draft + server-validated final submission
- Admin configuration, validation, and publish
- Dedicated Prisma models (separate from live Match/Prediction)

## Non-Goals

- Betting/odds, drag-and-drop, group stage, random simulation, separate backend
