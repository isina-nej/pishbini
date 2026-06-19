# Team and Match Management

## Requirements

### FR-001: Team CRUD
Create, edit, delete teams (nameFa, nameEn, code, flagUrl, isActive). Delete only if unused.

### FR-002: Match CRUD
Create, edit, delete matches (teams, startTime, status, predictionMode). Delete only if zero predictions.

### FR-003: Settlement
Admin enters correct result (HOME_WIN/DRAW/AWAY_WIN) and triggers settlement.

## Acceptance Criteria

- Team code unique
- Match form uses team dropdowns
- Settlement modal confirms before POST
- Cannot settle already-settled match (409)
