# Design — Mobile Knockout Bracket

## Data Model

Separate `BracketMatch`, `BracketPick`, `BracketSubmission` models. Reuse `Team`, `User`, `CampaignSetting`.

BracketMatch forms a directed tree via `homeSourceMatchId`, `awaySourceMatchId`, `nextMatchId`, `nextMatchSlot`.

## Client State

- Draft in `localStorage` key `world-cup-bracket-draft-v1`
- Derived teams/picks via `lib/bracket/progression.ts`
- No progression logic in React components

## Submit

Reuse user upsert by phone from existing submit flow. One `BracketSubmission` per user.

## Layout

`app/bracket/layout.tsx` breaks out of 430px root constraint for horizontal snap scroll.

## Admin

Extend existing admin panel at `/admin/bracket` with tree editor, validate, publish.
