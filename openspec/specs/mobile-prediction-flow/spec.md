# Mobile Prediction Flow

## Requirements

### FR-001: Match Visibility
`/ ` shows matches where `startTime > now AND startTime <= now + 24h AND status IN (SCHEDULED, ACTIVE)`.

### FR-002: Match Locking
Match hidden and API-rejected when `now >= startTime` or status is LOCKED/FINISHED/CANCELLED.

### FR-003: Prediction Selection
User selects HOME_WIN / DRAW / AWAY_WIN per match. One selection per match.

### FR-004: Submit Navigation
Sticky bottom CTA navigates to `/submit` when ≥1 prediction selected.

### FR-005: User Registration
`/submit` validates name (2–50 chars) and Iranian mobile; normalizes to `09xxxxxxxxx`.

### FR-006: Success Page
`/success` shows referral code, link, share/copy, confetti.

### FR-007: Referral Landing
`/ref/[code]` stores referral code in cookie + localStorage (30 days).

## Acceptance Criteria

- Empty state Persian message when no matches
- Match card with flags, Persian names, codes, fa-IR datetime
- Selected state: glow, scale, pulse animations
- Backend re-validates every match at submit
- Duplicate phone does not create duplicate User
- Late predictions return 400 with Persian error
