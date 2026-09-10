# Laundry Location Radar — Architecture & Product Decisions

This file records important decisions already made so future development does not silently reverse them.

## D001 — Deterministic scoring, not AI scoring

**Decision:** The 0–100 site score must be calculated by explicit rules and structured data.

**Reason:** Scores must be comparable across listings over time. AI can explain or classify qualitative evidence, but should not assign arbitrary final scores.

## D002 — Households matter more than raw population

**Decision:** Prefer household/catchment estimates over district-wide population density when evaluating laundry demand.

**Reason:** A household is closer to the potential customer unit for laundromat demand than raw population alone. Small rental units and older apartments may be especially relevant.

## D003 — Use 500 m and 800 m competition bands

**Decision:** Treat 500 m as the primary competitor catchment and 800 m as a secondary competition band.

**Reason:** Laundry users may walk or ride a motorcycle; competitors slightly outside immediate walking distance can still materially affect choice.

These are screening heuristics, not immutable market laws.

## D004 — Competitors are weighted by strength

**Decision:** Do not count all laundromats equally.

**Reason:** A modern, high-volume chain store is materially different from an older low-quality laundromat. Competition must be classified as strong, medium, weak, or unknown.

## D005 — Weak competitors can validate demand

**Decision:** Weak/older competitors are not purely negative.

**Reason:** A long-running but outdated laundromat can show that local demand exists while leaving room for a newer Oday store to compete on quality and equipment.

## D006 — Oday locations receive separate treatment

**Decision:** Nearby Oday stores must be tracked separately from ordinary competitors.

**Reason:** Same-brand overlap may create cannibalization or violate franchise territory rules. Internal distance heuristics are only for screening; Oday's official franchise decision overrides them.

## D007 — Ground-floor usable space is what matters most

**Decision:** Mezzanine/upper-floor space should not be valued the same as ground-floor machine-placement area.

**Reason:** Laundry machines, customer circulation, accessibility, and utility routing depend heavily on practical ground-floor usable space.

## D008 — Fatal blockers override score

**Decision:** Certain infrastructure or legal constraints must block a listing even if its numerical score is high.

**Reason:** Population and rent advantages cannot compensate for a store that cannot legally or physically support the required laundry operation.

## D009 — 591 must remain an adapter

**Decision:** Keep the 591 collector isolated behind a source adapter/interface.

**Reason:** We do not assume an official stable public API is available. The site may change its implementation or restrict automated access. The rest of the application should survive a source change.

## D010 — Do not bypass access controls

**Decision:** Do not circumvent CAPTCHA, authentication, anti-bot systems, rate limits, or other technical access controls.

**Reason:** The system should be maintainable, compliant, and low-risk. If collection becomes unreliable, switch to an alternate or semi-automated source strategy.

## D011 — Hourly freshness is sufficient (superseded by D022)

**Decision:** Target an approximately one-hour monitoring interval.

**Reason:** The user explicitly accepts up to one hour of delay, so there is no need for aggressive polling.

## D012 — Preserve delisted listings

**Decision:** Do not delete a listing because it disappears from the source.

**Reason:** Historical listings provide valuable rent and supply context and prevent the system from rediscovering the same property as if it were completely new.

## D013 — Alert only once for the same qualifying event

**Decision:** A newly discovered >=80 listing should not send the same notification on repeated scans.

**Reason:** Notifications must remain useful and non-spammy. Store notification state.

## D014 — Split Google browser and server keys

**Decision:** Use separate API keys for browser map rendering and server-side Places requests.

**Reason:** They require different restrictions and have different exposure risk.

Expected environment variables:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `GOOGLE_PLACES_API_KEY`

## D015 — Front-end key is public-by-design but restricted

**Decision:** The `NEXT_PUBLIC_` key may be visible in browser code but must be restricted to allowed websites and required Google APIs.

## D016 — Server Places key never enters client bundles

**Decision:** `GOOGLE_PLACES_API_KEY` must only be read by server-side code.

## D017 — AI output is editable

**Decision:** AI-generated strengths, weaknesses, review summaries, and competitor classifications should be reviewable/editable.

**Reason:** Qualitative inference can be wrong, especially when store age/equipment cannot be reliably inferred from APIs alone.

## D018 — Build useful screening before perfect GIS

**Decision:** Do not block the MVP on exact 500 m household GIS calculations.

**Reason:** A system with listing ingestion, competitor analysis, deterministic scoring, manual review, and alerts is already valuable. Population precision can improve iteratively.

## D019 — Current business defaults

**Decision:** Use these as default configuration values, not scattered hard-coded constants:

- target area: Sanchong District
- intended brand: Oday
- investment budget: NTD 3.5M
- ideal area: about 20 ping
- preferred monthly rent ceiling: NTD 40,000
- alert threshold: 80
- scan interval: daily (D022)

## D020 — Current implementation priority

**Decision:** Continue development in this order:

1. Google Places competitor analysis
2. Property detail / review UI
3. Population and household enrichment
4. Production-grade listing ingestion
5. Scheduling and LINE notifications

This prioritizes data quality and decision usefulness before automation polish.


## D021 — Explicit Places coverage and conservative missing-data scoring

**Decision:** Nearby Search (New) queries laundry businesses within 1,200 m, sorted by distance, with at most 20 results. Store Place IDs, observed ratings/review counts, opening hours and straight-line distances. Distinguish available, partial and unavailable results. The result limit or invalid records make coverage partial; no returned Oday is not proof that none exists.

**Decision:** Keep strength unknown until reviewed; ratings alone do not establish equipment quality or utilization. Unknown ordinary businesses within 500 m deduct 3 points each, matching the existing medium/normal deduction. Unavailable or partial coverage caps the competition component at 12/25 before Oday deductions. This preserves the five component weights while avoiding a full competition score for missing data. The 800 m count is contextual for now, not an additional deduction.

**Decision:** Oday is recognized provisionally by its name, excluded from ordinary competitor counts, and uses inclusive 500/800/1,200 m warning thresholds. Brand territory conflicts still require confirmation.

**Scope:** This increment requires supplied coordinates; missing coordinates remain unknown rather than guessing an address position. Mock listings never trigger paid Places requests. Automatic scans preserve existing site-check/demand inputs and database notes/status. Manual competitor review and address geocoding remain follow-up work.


## D022 — Daily scans on Vercel Hobby

**Decision:** The user accepts once-daily scanning instead of hourly scanning. This supersedes D011. Set Vercel Cron to `0 0 * * *` (UTC), targeting 08:00–08:59 Asia/Taipei; the morning window is the implementation default, not a guaranteed execution minute.

**Reason:** Daily frequency fits the selected Vercel Hobby plan without an external scheduler. Keep the dashboard and business configuration consistent with the deployment schedule. Changing the cadence requires updating both `vercel.json` and `businessConfig.scanIntervalHours`.
