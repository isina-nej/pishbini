# Bracket Manual Test Checklist

## Setup
- [ ] Run `npx prisma db push` (or migrate) and `npm run db:seed`
- [ ] Admin → جدول حذفی → validate → publish (enabled + submissionOpen)

## Public — Bracket Page (`/bracket`)
- [ ] Page loads published bracket with 32 teams in R32
- [ ] Horizontal scroll works on mobile; layout breaks out of 430px column
- [ ] Tap team to pick winner; pick propagates to next round slots
- [ ] Changing an earlier pick clears downstream picks
- [ ] Progress indicator updates as matches are completed
- [ ] Champion card shows selected final winner
- [ ] Draft persists in localStorage after refresh
- [ ] «ثبت نهایی» disabled until all 31 matches + champion selected
- [ ] Unpublished bracket shows appropriate empty/disabled state

## Submit Flow
- [ ] `/bracket/submit` redirects to `/bracket` if no session picks
- [ ] Valid identity form submits to `POST /api/bracket/submit`
- [ ] Success page shows confirmation and referral code
- [ ] localStorage draft cleared after successful submit
- [ ] Duplicate bracket submission blocked (same phone, 409)
- [ ] Invalid/incomplete picks rejected server-side

## API
- [ ] `GET /api/bracket` returns matches, teams, config when published
- [ ] `POST /api/bracket/submit` rate-limited by IP
- [ ] Campaign freeze blocks bracket submit

## Admin (`/admin/bracket`)
- [ ] Toggle enabled / published / submissionOpen
- [ ] Validate shows tree errors (if any)
- [ ] Publish succeeds when tree is valid
- [ ] Submission count updates after user submits

## Regression
- [ ] Live match predictions (`/`, `/submit`) still work
- [ ] BottomNav shows جدول حذفی link alongside پیش‌بینی and جدول امتیازات
