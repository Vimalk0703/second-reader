<!-- Keep PRs small and reviewable. -->

## Summary

<!-- What changed and why. -->

## Decision-boundary impact

<!-- Does this change any stage's autonomy level, add a path the AI can write to,
     or touch the no-score / human-gate guarantees? If yes, explain. If no, say "none". -->

## Checks

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run eval`
- [ ] `npm run build`
- [ ] Prompt/model change? Re-ran affected fixtures and re-checked golden labels.
- [ ] Tradeoff or risk changed? Updated `DECISIONS.md`.
