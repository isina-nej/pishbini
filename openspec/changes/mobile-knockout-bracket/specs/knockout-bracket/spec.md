# Knockout Bracket

## Requirements

### FR-001: Bracket Page
Route `/bracket` displays knockout bracket from Round of 32 through Final with Persian RTL UI.

### FR-002: Winner Selection
User taps a team to select winner; team advances to next round slot.

### FR-003: Downstream Invalidation
Changing an earlier pick clears dependent invalid picks recursively.

### FR-004: Progress
Show completed picks count (max 31) and progress bar.

### FR-005: Draft Persistence
Save draft to `world-cup-bracket-draft-v1` in localStorage.

### FR-006: Final Submit
Server validates full bracket path; one submission per user; reuses phone registration.

### FR-007: Admin
Admin can configure tree, validate, publish, enable/disable bracket.

## Acceptance Criteria

- Mobile snap scroll between rounds
- Round tabs sync with visible column
- Champion panel when complete
- Reset with confirmation
- Existing match prediction flow unchanged
