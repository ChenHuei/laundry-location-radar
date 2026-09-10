# AGENTS.md

## Mission

This repository builds a site-selection radar for evaluating potential Oday self-service laundromat locations, initially in Sanchong District, New Taipei City.

## Required context before making changes

Before modifying code, read these files in full:

1. `PROJECT_SPEC.md`
2. `DECISIONS.md`
3. `README.md`

Treat `PROJECT_SPEC.md` as the current product specification and `DECISIONS.md` as the record of intentionally chosen architecture/product behavior.

## Non-negotiable development rules

- Do not replace deterministic scoring with free-form AI scoring.
- Do not fabricate data that is unavailable from a source.
- Keep listing-source collection behind an adapter/interface.
- Do not bypass CAPTCHA, authentication, anti-bot controls, or other technical access restrictions.
- Keep `GOOGLE_PLACES_API_KEY` server-side only.
- Never commit `.env`, `.env.local`, tokens, API keys, passwords, or secrets.
- Preserve historical/delisted listing records rather than deleting them.
- Keep scoring components inspectable so the user can understand why a property received its score.
- Preserve manual user overrides/notes when re-running enrichment or scoring.
- Treat confirmed fatal blockers separately from ordinary score deductions.

## Current default business configuration

- Geography: Sanchong District, New Taipei City
- Intended franchise: Oday
- Total budget: approximately NTD 3.5M
- Ideal usable area: approximately 20 ping
- Preferred rent ceiling: NTD 40,000/month
- Scan cadence: once daily (Vercel Hobby; UTC 00:00 / Asia/Taipei 08:00–08:59)
- High-score notification threshold: 80

These values should be configurable rather than duplicated throughout the codebase.

## Scoring weights

Maintain the current 100-point framework unless the user explicitly changes it:

- Residential demand: 30
- Competition: 25
- Property suitability: 20
- Rent efficiency: 15
- Access / visibility: 10

Nearby Oday stores receive separate treatment from ordinary competitors.

## AI usage

AI may help summarize:

- strengths
- weaknesses
- competitor review themes
- likely competitor strength
- missing on-site verification items

AI must not invent:

- population / household counts
- Google ratings or review counts
- distances
- listing rent or size
- final numeric scores outside the deterministic scoring engine

## Testing expectations

For changes that affect scoring or enrichment:

- Add or update tests for deterministic behavior.
- Include edge cases for missing data.
- Ensure a missing optional API result does not crash a scan.
- Ensure repeated scans are idempotent.
- Ensure an already-notified unchanged >=80 listing does not notify again.

For UI changes:

- Preserve mobile readability.
- Keep score breakdown and blockers easy to inspect.
- Prefer decision-useful information over decorative UI.

## Current implementation priority

Unless instructed otherwise, work next on:

1. Google Places competitor analysis
2. Property detail page and manual competitor review
3. Population / household enrichment
4. Reliable listing ingestion
5. Daily scheduler and LINE notification completion

## When requirements conflict

If a new user request conflicts with these files, follow the newest explicit user request and update `PROJECT_SPEC.md` / `DECISIONS.md` so the repository remains the source of truth for future sessions.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
