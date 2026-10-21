# Forgepath — Supplier Desk

**Track:** Supplier Relationship Management

**Release:** 0.5.0
**Tagline:** Make domestic manufacturing capability discoverable, then establish a traceable next step.

## Inspiration

A regional manufacturer may have the right machines and know-how while remaining difficult for an unfamiliar buyer to discover. A supplier list also leaves the buyer with unanswered questions about process fit, material, capacity and evidence. Forgepath demonstrates a short path from a component requirement to a named human decision and a reviewable supplier response.

## What it does

Buyers compare fictional suppliers against explicit requirements, review evidence and record a named decision before creating an immutable RFQ draft. A simulated supplier role in the same local browser can record an accept, decline or clarification with quantity in pcs, delivery date or calendar-day lead time, actor and source reference. The buyer can review visible exceptions and acknowledge the latest response or hold it for follow-up. A changed response version makes its earlier review stale and requires another named review.

Versioned JSON/CSV exchange correlates responses to the RFQ, line and request revision; matching duplicate event IDs are idempotent, conflicting duplicates are rejected, and batch validation is atomic. The workflow exports as JSON or a readable HTML packet. These records are local simulation data: no messages, payments, ERP connection, shared real-time exchange, order, award or commercial commitment is created. An RFQ draft and response acknowledgement do not approve a purchase.

The existing capability network remains available. Manufacturers can review deterministic extracted fields from pasted text, edit them and confirm a fictional profile. Buyers can search plain-language needs, inspect editable inferred filters and see why profiles appear. Discovery remains separate from qualification. See [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the primary recording procedure and the optional clevis evidence journey.

## How it works

Static HTML/CSS/JavaScript with no third-party packages, credentials or external APIs. Intake, search and RFQ exchange run locally. There is no external AI, URL scraping or PDF ingestion. A URL can be retained as a reference but is not fetched. All state stays in the visitor's browser; profiles are not shared across visitors or devices.

## Evidence and limits

All scored manufacturers, part specifications, RFQs, responses and qualification evidence are fictional. Official Muenster machining capability references are separate research context. No claim is made about real supplier participation, drone part production, current capacity, certification, adoption, airworthiness or domestic content of every input. Human reviews record demo assertions; the app does not independently authenticate certificates. Automated tests cover intake, search, existing review rules and RFQ workflow rules. Browser validation status is tracked in [RELEASE_EVIDENCE.md](RELEASE_EVIDENCE.md); do not describe browser usability or actual cross-device file transfer as verified unless that record or a separate test supports it.

## Submission fields

- Live demo: https://forgepath-supplier-desk.txpaintbrush.chatgpt.site (use only after deployment is confirmed)
- Public GitHub: https://github.com/paintbrushv/buildagentmake
- Video: PENDING recording of [DEMO_SCRIPT.md](DEMO_SCRIPT.md)
- TalentDB: Matthew Dickson profile saved October 18, 2026; any added team member must register separately
- Demo Day: registration approved October 19, 2026; confirmed details are in the user's calendar
