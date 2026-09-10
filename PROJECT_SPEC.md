# Laundry Location Radar — Project Specification

## 1. Project goal

Build a small site-selection radar for evaluating potential self-service laundromat locations, initially focused on Sanchong District, New Taipei City, with Oday as the intended franchise brand.

The system should continuously discover commercial rental listings, enrich them with location and competition data, score them consistently, store all reviewed listings, and notify the user when a strong candidate appears.

## 2. Current business constraints

These are the current default assumptions for Sanchong screening:

- Intended brand: Oday self-service laundromat
- Total investment budget: approximately NTD 3.5M
- Ideal ground-floor usable area: approximately 20 ping
- Preferred monthly rent: NTD 40,000 or less
- Geography: all of Sanchong District is eligible
- Monitoring freshness: daily scans; approximately one day of delay is acceptable
- Alert threshold: score >= 80

These are configurable business rules, not hard-coded universal truths. Keep them centralized so they can be changed later without rewriting the application.

## 3. Core workflow

The target workflow is:

1. Poll the listing source once per day.
2. Discover new qualifying Sanchong commercial listings.
3. Normalize listing data and de-duplicate by source listing ID.
4. Preserve previously seen listings even after they disappear from the source.
5. Geocode the address when possible.
6. Retrieve nearby laundromat competitors.
7. Identify nearby Oday locations separately from other competitors.
8. Calculate a deterministic score.
9. Generate concise strengths, weaknesses, and risk notes.
10. Store all data and score components.
11. Notify the user when a newly discovered candidate scores 80 or above and has not already triggered an alert.
12. Allow the user to manually annotate, reclassify, shortlist, inspect, or reject a location.

## 4. Data sources

### 4.1 Rental listings

Primary target source: 591 commercial rental listings.

Important implementation rule:

- Do not assume 591 provides a stable public API for this use case.
- The listing collector must remain isolated behind an adapter/interface.
- Do not build the rest of the system around undocumented response shapes.
- Respect applicable terms, robots directives, rate limits, and access controls.
- Do not bypass anti-bot mechanisms or authentication barriers.
- If direct collection is unreliable, the architecture must allow an alternate source or semi-automated ingestion path.

Target filters for the first version:

- Area: Sanchong District, New Taipei City
- Commercial/storefront rental listings
- Preferred rent <= NTD 40,000
- Broad candidate size range: approximately 12–40 ping

The size filter should be configurable because a smaller property may still be viable if the Oday layout supports it.

### 4.2 Google Maps / Places

Use Google services for:

- Geocoding or resolving candidate locations when needed
- Nearby laundromat discovery
- Business name
- Coordinates
- Rating
- Review count
- Opening hours when available
- Place ID
- Approximate distance from candidate property
- Front-end map rendering

Use separate keys:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: browser map rendering
- `GOOGLE_PLACES_API_KEY`: server-side Places calls

Never expose the server-side Places key in client code.

### 4.3 Population / housing demand

The long-term target is a 500 m / 800 m catchment estimate rather than relying only on district-wide population density.

The MVP may begin with village-level official household/population data and progressively improve toward GIS-based catchment estimation.

Prefer household count over raw population count when the purpose is estimating potential laundry demand.

Future demand features may include:

- 500 m estimated households
- 800 m estimated households
- residential building density
- older apartment prevalence
- rental/small-unit housing prevalence
- household size
- nearby schools, hospitals, markets, dormitory-like housing, or other demand generators

## 5. Scoring model

Use a deterministic 100-point scoring model. AI must not invent the final numeric score.

### 5.1 Residential demand — 30 points

Evaluate signals such as:

- estimated households within 500 m
- estimated households within 800 m
- residential density
- older apartments / housing likely to have weaker drying infrastructure
- rental / small-unit housing
- special demand generators

### 5.2 Competition — 25 points

Start from a competition score and reduce it based on effective competitive pressure.

Competitors must not all count equally.

Suggested classification:

- Strong competitor: modern equipment, strong brand, high review volume, high rating, well-maintained, likely high utilization
- Medium competitor: established but not clearly dominant
- Weak competitor: older equipment, weaker store condition, low review volume, poor rating, limited machine count
- Unknown: insufficient evidence; should be manually reviewable

Nearby Oday locations require separate treatment because they may create franchise cannibalization or territory conflicts.

Initial planning distance bands:

- Oday within 500 m: severe warning / likely reject pending franchise confirmation
- Oday within 500–800 m: major deduction
- Oday within 800 m–1.2 km: evaluate neighborhood barriers and catchment overlap
- Oday beyond 1.2 km: normal competition analysis

These distance bands are internal screening heuristics only. Actual Oday franchise territory rules must be confirmed with Oday and should override internal assumptions.

Weak competitors can be interpreted as evidence of proven local laundry demand rather than only as a negative signal.

### 5.3 Property suitability — 20 points

Evaluate:

- usable ground-floor area
- layout efficiency / shape
- frontage
- machine layout feasibility
- ability to support drainage
- ventilation / exhaust feasibility
- three-phase power feasibility
- gas / hot water feasibility if required by selected Oday configuration
- building / management rules
- 24-hour operation feasibility

For mezzanine or upper-floor areas, do not treat them as equivalent to ground-floor machine-placement area.

### 5.4 Rent efficiency — 15 points

Current reference rent bands:

- <= NTD 26,000: excellent
- NTD 26,001–30,000: very good
- NTD 30,001–35,000: good
- NTD 35,001–40,000: acceptable but must be justified
- > NTD 40,000: normally downgrade or reject unless the location materially outperforms alternatives

Also track effective rent per usable ground-floor ping.

### 5.5 Access / visibility — 10 points

Evaluate:

- motorcycle stopping / short-term parking convenience
- road width
- residential travel path
- storefront visibility
- signage visibility
- ease of carrying laundry or bedding from vehicle to store

High pedestrian traffic alone is not sufficient. Practical loading/unloading matters for laundromat use.

## 6. Fatal-condition rules

Some conditions should override a high score and mark the candidate as blocked or requiring manual confirmation.

Examples:

- Building rules prohibit self-service laundry use
- 24-hour operation is prohibited when 24-hour operation is required
- Ventilation/exhaust cannot legally or practically be installed
- Drainage cannot be made adequate
- Electrical service cannot support required load
- Gas/hot-water requirements cannot be satisfied for the planned configuration
- Franchise territory conflict confirmed by Oday

The UI should clearly distinguish a low score from a fatal blocker.

## 7. AI responsibilities

AI may assist with qualitative interpretation, but should not be the source of truth for deterministic fields.

Appropriate AI tasks:

- summarize listing strengths
- summarize listing weaknesses
- summarize competitor review themes
- propose competitor strength classification from available evidence
- identify missing information to verify during an on-site visit
- generate a short rationale explaining the numeric score

AI should not:

- fabricate household counts
- fabricate competitor distances
- invent property dimensions
- invent Google ratings or review counts
- freely choose the 0–100 score independent of the scoring engine

All AI-generated judgments should remain editable by the user.

## 8. Dashboard requirements

Primary list views / filters:

- All listings
- New listings
- Score >= 80
- Pending site visit
- Site visited
- Rejected
- Delisted / inactive

Each row/card should show at minimum:

- listing title / address
- source
- source listing ID
- monthly rent
- usable size
- score
- new-listing indicator
- nearest Oday distance
- number of strong / medium / weak nearby competitors
- concise strengths
- concise risks
- listing link
- map link / map action
- current status

## 9. Property detail requirements

Each candidate detail view should include:

- original listing metadata
- listing history
- map
- 500 m and 800 m competition context
- nearest Oday store
- scoring breakdown
- strengths
- weaknesses
- fatal blockers / unknown checks
- user notes
- site-visit status
- manual competitor reclassification controls
- manual score-input overrides only where explicitly supported by scoring rules

## 10. Notifications

Primary notification target: LINE Messaging API.

Trigger when:

- listing is newly discovered
- score >= 80
- listing has not already triggered the same notification

Notification should include:

- location/address
- score
- rent
- size
- top strengths
- key risk
- link to listing
- link to internal detail page when deployed

Do not repeatedly notify on every scan for the same unchanged listing.

Possible future notifications:

- material price reduction
- a previously rejected blocker becomes resolved
- daily digest for new 70–79 point candidates

## 11. Scheduling

Target collection cadence: once daily, using Vercel Hobby Cron at `0 0 * * *` (UTC). This targets 08:00–08:59 Asia/Taipei; execution is not guaranteed at the exact minute.

The architecture may use Vercel Cron, GitHub Actions, Cloudflare Cron, or another scheduler. The collector should be idempotent so repeated runs do not create duplicate records.

## 12. Data retention

Never hard-delete a listing only because it is no longer active on the source.

Track:

- first seen timestamp
- last seen timestamp
- active/delisted state
- latest observed rent
- rent history if practical
- previous score where useful
- notification state

Historical listings are valuable for understanding local rent and supply.

## 13. Technical stack

Current preferred stack:

- Front end: Next.js
- Database/auth/data layer: Supabase / PostgreSQL
- Hosting: Vercel
- Scheduling: Vercel Cron or equivalent
- Maps: Google Maps JavaScript API
- Competitor enrichment: Places API (New)
- AI summaries: OpenAI API, optional and isolated from deterministic scoring
- Notifications: LINE Messaging API

## 14. Security

- Never commit secrets.
- `.env.local` must remain ignored by git.
- Browser Google Maps key must use website/referrer restrictions.
- Server Google Places key must be server-only and API-restricted.
- Keep production secrets in deployment environment variables.
- Avoid logging secret values.

## 15. MVP priority order

Build in this order unless a new requirement changes priorities:

1. Stable data model and deterministic scoring
2. Google Places competitor analysis
3. Property detail page and manual review tools
4. Population / household enrichment
5. Reliable 591 or alternate listing ingestion
6. Daily scheduling and de-duplication
7. LINE >=80 notifications
8. Improve AI summaries and competitor classification
9. Refine GIS catchment estimation



## 16. First Places implementation (2026-09-10)

- Server-only Nearby Search (New), 1,200 m radius, distance ranking, explicit fields; requires supplied valid coordinates.
- Track available / partial / unavailable coverage; 20-result saturation is partial. Google laundry types may include service laundries; manual review is still required.
- Retain unknown competitor strength rather than infer equipment quality from ratings. Unknown ordinary competitors within 500 m deduct 3 points each. Partial/missing coverage caps competition at 12/25 before Oday deductions; component weights remain unchanged.
- Dashboard expands to show observed businesses, distance, ratings, review counts, hours, score components and blockers on mobile and desktop.
- API failures remain nonfatal to scans. Repeated scans preserve manual site/demand fields and notification state; skipped LINE requests are not marked sent.
- Address geocoding, manual competitor editing, 800 m score deductions, and exhaustive competitor discovery are not included in this increment.
