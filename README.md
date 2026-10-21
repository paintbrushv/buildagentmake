# Forgepath — Supplier Desk

A working Supplier Relationship Management demonstration for HackFW: MADE 2026. Forgepath turns a commercial drone component requirement into a supplier comparison, evidence follow-up, named human decision, and downloadable RFQ review packet. Its capability network demonstrates how a manufacturer can become discoverable immediately from a short capability card.

**Release:** 0.4.0 · **Data:** synthetic only · **Storage:** this browser · **Runtime:** static HTML/CSS/JavaScript, no third-party packages, external APIs or credentials.

## Run from a clean checkout

Requires Node.js 20+ and Python 3. No package installation is needed.

```sh
npm test
npm run build
npm start
```

Open http://127.0.0.1:4173. The app starts with four component requests and four fictional manufacturers. `Reset demo` restores those records. `Export workspace` saves the current dataset and activity log. Downloaded RFQ HTML packets can be opened directly in a browser and printed to PDF.

The downloadable source bundle includes all app modules, tests, documentation and build scripts. The hosted app's `Download source` link serves that same bundle. Source repository: https://github.com/paintbrushv/buildagentmake

Live demo: https://forgepath-supplier-desk.txpaintbrush.chatgpt.site

The repository retains its existing Apache-2.0 license.

## Two demo journeys

See [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the two-minute recording script and a longer technical walkthrough.

1. **A buyer searches in plain language:** enter a need such as “Aluminum CNC milling in Texas.” Review the interpreted constraints and explanation, edit filters, and apply them. If nothing matches, broaden or clear constraints explicitly; the selected part requirement is unchanged.
2. **A manufacturer adds a profile:** paste a paragraph, labeled card, or one-row CSV. Review each extracted value and source excerpt, correct fields, and confirm. Name, city and processes are required; other details stay unknown unless supplied. Profiles are fictional, local and self-reported.

The existing component review, evidence follow-up, named decision and packet journey remains available. See [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for a short walkthrough.

## Decision rules

The visible capability score weights are process 35, material 25, tolerance 20, stated lot capacity 10 and qualification evidence 10. The score is a comparison aid, not a probability or universal qualification rating.

Every required check must pass before approval: process, material, tolerance, capacity, current scoped qualification evidence, and the U.S. manufacturing-site declaration specified in these sample requests. Missing data blocks approval. Site review is an explicit human record and does not establish domestic content of every input. ISO 9001 and AS9100D are fictional buyer requirements in these scenarios, not universal drone procurement requirements.

Qualification evidence must have a source reference, named reviewer, scope confirmation, matching site and a validity range covering the current date. New evidence supersedes the earlier record without removing it. This records a human assertion; the app does not independently authenticate a certificate or check an issuer database.

Each decision binds to its exact requirement/capability/site/evidence snapshot. Changes or evidence expiry make the decision stale. Packets recompute eligibility at export; an absent, held or stale approval produces a review-only packet. Requested delivery dates, pricing and engineering suitability are not validated or promised.

## Onboarding and data boundaries

Quick discovery requires only a name, city and manufacturing process. Material, tolerance and capacity details improve matching. Unknown facts remain unknown. Intake uses conservative deterministic local parsing for paragraphs, labeled cards and a one-row CSV; extracted fields include source excerpts and remain editable before confirmation. Confirmed profiles retain source provenance and any manual corrections. No account or certificate is required for discovery in this demo.

Buyer search uses plain-language text to infer visible process, material and location filters. The filters are editable and the interface explains why each profile appears. Search covers recorded fictional profile claims only; it does not establish qualification, availability or commercial fit. A no-match result offers an explicit way to relax constraints.

All supplied and entered demo records must be fictional. Profiles and reviews are stored in this browser; they are not shared between visitors or devices. The activity log is useful for demonstration but is editable local state, not a tamper-proof audit system. Intake is local and deterministic: no external AI, URL scraping, or PDF ingestion is used. A URL may be recorded as a reference, but the app does not fetch it. Download/export your session before clearing browser data. An unavailable browser storage quota leaves an in-memory session and prompts export. This is not a real shared supplier network.

A future real manufacturer network needs shared persistence, authentication, access control, consent, document storage and real evidence verification. Do not put customer drawings, private capability information, actual supplier evidence or credentials into this public demonstration.

## Validation

Automated tests cover intake, buyer search and the existing supplier-review rules. See the test suite for current coverage.

Browser validation status is recorded separately in [RELEASE_EVIDENCE.md](RELEASE_EVIDENCE.md); do not treat features described here as independently browser-validated unless that record confirms them.

## Public local context

The app separately links to UMII and Superior's official machining capability pages in Muenster. They are research references, never scored supplier records. No claim is made that either makes these exact drone components or participates in Forgepath. See [LOCAL_COMPONENT_DEMOS.md](LOCAL_COMPONENT_DEMOS.md).

No source code, customer data, credentials or supplier documents were imported from private TexasRoofAgent or GridX repositories.
