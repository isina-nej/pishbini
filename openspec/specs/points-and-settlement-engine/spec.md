# Points and Settlement Engine

## Requirements

### FR-001: Point Rules
DB-stored rules: BASE_REGISTRATION, CORRECT_PREDICTION, WRONG_PREDICTION, REFERRAL_SUCCESS, CANCELLED_MATCH.

### FR-002: No Hardcoding
Never hardcode point values in business logic.

### FR-003: Transactional Settlement
Settlement in single MySQL transaction.

### FR-004: Prediction Scoring
Each prediction gets isCorrect, pointsAwarded, settledAt.

### FR-005: Point Transactions
PointTransaction created per point change.

### FR-006: Idempotent Settlement
Second settle attempt rejected.

## Acceptance Criteria

- Seed defaults: +200, +1000, -100, +500, 0
- Rule edits affect future settlements only
- Historical pointsAwarded unchanged after rule edit
- Settlement summary returned
