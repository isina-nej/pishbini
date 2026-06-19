# Leaderboard

## Requirements

### FR-001: Public Top 10
Sort: points DESC, correctPredictions DESC, createdAt ASC.

### FR-002: Phone Masking
Display as `0912***4567`.

### FR-003: Campaign Note
Persian prize explanation on page.

### FR-004: Current User Rank
Show above top 10 when wc_participant cookie present.

### FR-005: Admin Leaderboard
View, export CSV, freeze campaign, mark winner.

## Acceptance Criteria

- Full phone never in public API
- Tie-breaker order correct
- Admin CSV export works
- Freeze blocks new submissions
