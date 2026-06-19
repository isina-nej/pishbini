# Referral System

## Requirements

### FR-001: Code Format
7-char uppercase alphanumeric, exclude O/0/I/1.

### FR-002: One Registration Per Phone

### FR-003: Referral Reward
Applied once on first successful referred submission.

### FR-004: No Self-Referral

### FR-005: Records
Referral record + PointTransaction on reward.

## Acceptance Criteria

- Link format: `{NEXT_PUBLIC_APP_URL}/ref/{code}`
- Invalid referral code ignored (registration still succeeds)
- Duplicate referral reward prevented by DB constraint
