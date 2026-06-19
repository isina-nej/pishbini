# Admin Management Panel

## Requirements

### FR-001: Admin Login
`/admin/login` password form; HttpOnly session cookie.

### FR-002: Auth Guard
All `/admin/*` pages and `/api/admin/*` routes require authentication.

### FR-003: Dashboard Metrics
Total users, predictions, matches, teams, referrals, SMS sent/failed, top user, participants, available/locked/finished/cancelled matches.

### FR-004: Audit Log
`AdminAuditLog` for login, settlement, point rule changes, campaign freeze, winner mark.

## Acceptance Criteria

- Unauthenticated admin API returns 401
- Wrong password returns 401
- Logout clears session
- Dashboard metrics match DB counts
