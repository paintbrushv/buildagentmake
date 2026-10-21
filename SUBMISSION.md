# Forgepath — Supplier Desk

**Track:** Supplier Relationship Management

**Release:** 0.4.0
**Tagline:** Make domestic manufacturing capability discoverable, then establish a traceable next step.

## Inspiration

A regional manufacturer may have the right machines and know-how while remaining difficult for an unfamiliar buyer to discover. A supplier list also leaves the buyer with unanswered questions about process fit, material, capacity and evidence. Forgepath demonstrates a short path from a component requirement to a named human decision and a useful RFQ review packet.

## What it does

Click a part on a conceptual commercial inspection drone, compare suppliers against explicit requirements, open an evidence follow-up, review a new synthetic qualification packet, record human approval, and download a readable HTML packet plus structured JSON. Changed requirements, capability records, evidence or qualification expiry invalidate earlier approvals.

A manufacturer can paste a paragraph, labeled card or one-row CSV and review deterministic extracted fields with source excerpts. The fields remain editable before confirmation; unknown facts stay unknown, and source provenance plus manual corrections are retained. Buyer search accepts plain-language needs, shows editable inferred filters and explains why profiles appear. No-match results offer an explicit way to relax constraints. Discovery does not require completed qualification; qualification remains a separate review.

## How it works

Static HTML/CSS/JavaScript with no third-party packages, credentials or external APIs. Intake and search run locally and deterministically: there is no external AI, URL scraping or PDF ingestion. A URL can be retained as a reference but is not fetched. All state stays in the visitor's browser; profiles are not shared across visitors or devices. The existing review workflow records requirement checks, source provenance and human decisions.

## Evidence and limits

All scored manufacturers, part specifications, orders and qualification evidence are fictional. Official Muenster machining capability references are separate research context. No claim is made about real supplier participation, drone part production, current capacity, certification, adoption, airworthiness or domestic content of every input. Human reviews record demo assertions; the app does not independently authenticate certificates. Automated tests cover intake, search and existing review rules. Browser validation status is tracked in RELEASE_EVIDENCE.md.

## Submission fields

- Live demo: https://forgepath-supplier-desk.txpaintbrush.chatgpt.site (use only after deployment is confirmed)
- Public GitHub: https://github.com/paintbrushv/buildagentmake
- Video: PENDING recording of DEMO_SCRIPT.md
- TalentDB: Matthew Dickson profile saved October 18, 2026; any added team member must register separately
- Demo Day: registration approved October 19, 2026; confirmed details are in the user's calendar
