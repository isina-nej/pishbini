# Manual Test Checklist

## Match Window
- [ ] Match appears only within 24 hours before start
- [ ] Match disappears at start time (public API)
- [ ] Backend rejects prediction after start time

## Registration
- [ ] Phone `09123456789` accepted
- [ ] Phone `+989123456789` normalized
- [ ] Phone `989123456789` normalized
- [ ] Invalid phone rejected
- [ ] Duplicate phone does not create duplicate user

## Predictions
- [ ] Cannot predict same match twice
- [ ] Returning user can predict new matches only

## Referral
- [ ] Referral code generated on registration
- [ ] Referral reward applied to referrer
- [ ] Self-referral blocked
- [ ] Duplicate referral reward blocked

## SMS
- [ ] Mock SMS logs as SENT
- [ ] SMS failure does not fail registration

## Leaderboard
- [ ] Sort: points DESC, correct DESC, date ASC
- [ ] Phone masked as `0912***4567`
- [ ] Current user rank shown when cookie present
- [ ] Full phone never in public API

## Admin
- [ ] Login with correct password
- [ ] Wrong password rejected
- [ ] Logout clears session
- [ ] Dashboard metrics accurate
- [ ] Create/edit/delete team
- [ ] Create/edit/delete match (no predictions)
- [ ] Edit point rules
- [ ] Settle match — correct gets positive points
- [ ] Settle match — wrong gets negative points if configured
- [ ] Double settle rejected (409)
- [ ] Participant detail shows predictions/transactions/SMS
- [ ] CSV export works
- [ ] Campaign freeze blocks submit
- [ ] Admin APIs return 401 without session

## Security
- [ ] Rate limit on submit API
- [ ] No stack traces in production errors
- [ ] Admin password not in frontend code

## Adversarial Review Notes

- Settlement uses DB transaction with settledAt check
- Submit re-validates match availability server-side
- Point values always from PointRule table
- Referral unique constraint on referredUserId
- In-memory rate limiter is single-instance only (documented limitation)
