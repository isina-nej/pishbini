# SMS System

## Requirements

### FR-001: Provider Abstraction
`lib/sms.ts` with mock default provider.

### FR-002: Persian Template
Confirmation with referral code and link.

### FR-003: Logging
Every attempt logged in SmsLog.

### FR-004: Graceful Failure
SMS failure does not roll back registration.

## Acceptance Criteria

- SMS_PROVIDER=mock logs SENT without external call
- Failed SMS → status FAILED, user still created
- Admin participant detail shows SMS logs
