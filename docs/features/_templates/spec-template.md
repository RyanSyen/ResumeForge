---
id: F-NNN
title: <feature title>
status: proposed   # proposed | specced | planned | building | in-review | ship-approved | done
priority: P1       # P0 blocker | P1 must-have | P2 secondary | P3 nice-to-have
source: <requirement doc + section this derives from>
depends_on: []     # feature IDs that must ship first
---

# F-NNN — <Feature Title>

## User story
As a <persona>, I want <capability> so that <outcome>.

## Current state
What exists today (cite files) and the gap this feature closes.

## Scope
- In: <bullet list of what ships>
- Out: <explicitly excluded — prevents agent scope creep>

## Acceptance criteria
Each criterion must be independently verifiable by the review stage.
1. [ ] <Given/when/then or observable behavior>
2. [ ] ...

## Constraints & landmines
Tech-debt items from `docs/Living Product Map & Feature Inventory.md` §3 this touches,
plus any product constraints (privacy promise, BYO-key model, print CSS, etc.).

## Test expectations
What must be covered by automated tests for this feature to pass review.
