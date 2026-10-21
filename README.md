# Forgepath — Supplier Desk

A browser-local Supplier Relationship Management demonstration for HackFW: MADE 2026. Forgepath connects a component requirement to supplier capability and evidence, then carries a human-approved RFQ draft through a simulated supplier response, exception review and versioned record.

**Release:** 0.5.0 · **Data:** fictional only · **Storage:** this browser · **Runtime:** static HTML/CSS/JavaScript, no third-party packages, external APIs or credentials.

## Run from a clean checkout

Requires Node.js 20+ and Python 3. No package installation is needed.

```sh
npm test
npm run build
npm start
```

Open http://127.0.0.1:4173. The app starts with four component requests and four fictional manufacturers. `Reset demo` restores those records. `Export workspace` saves the current dataset and activity log. The downloadable source bundle includes app modules, tests, documentation and build scripts. Source repository: https://github.com/paintbrushv/buildagentmake

Live demo: https://forgepath-supplier-desk.txpaintbrush.chatgpt.site

The repository retains its existing Apache-2.0 license.

## What the demonstration does

The buyer compares fictional manufacturers against explicit process, material, tolerance, capacity, qualification and site checks. A named human decision is required before the app creates an immutable RFQ draft containing the approved request, supplier and decision snapshot. The buyer can then switch to a simulated supplier role in the same browser and record an accept, decline or clarification response. Response claims include quantity in pcs and a delivery date or calendar-day lead time, plus a named actor and source reference.

The workflow surfaces exceptions such as a short quantity, late delivery, decline, clarification, changed response or stale approval. A named buyer can acknowledge the latest response and visible exceptions or place it on hold. A changed response version makes the earlier review stale and requires a new named review. Acknowledgement records review only; it does not approve a purchase or restore stale RFQ approval.

Versioned JSON and CSV response exchange supports correlation to the RFQ, line, request revision and supplier. Duplicate event IDs are idempotent when their content matches; conflicting duplicates are rejected. Batch import validates before committing, so an invalid batch does not partially add response events. The workflow can be exported as structured JSON or a readable HTML review packet.

Every role and record is a fictional local simulation. The RFQ is a draft, not an order, purchase award or commercial commitment. The demo sends no messages, executes no payments, and connects to no ERP or shared real-time supplier service. See [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the primary recording path and the technical extension.

The existing capability network remains available: manufacturers can review a deterministic local intake from pasted text, edit extracted fields and confirm a fictional profile; buyers can search plain-language needs, inspect editable inferred constraints and see why profiles appear. Discovery remains separate from qualification and approval.

## Decision rules and data boundaries

Use one active demo tab; simultaneous edits across tabs are not reconciled.

The visible capability score weights are process 35, material 25, tolerance 20, stated lot capacity 10 and qualification evidence 10. The score is a comparison aid, not a probability or universal qualification rating.

Every required check must pass before approval: process, material, tolerance, capacity, current scoped qualification evidence, and the U.S. manufacturing-site declaration specified in these sample requests. Missing data blocks approval. Site review is an explicit human record and does not establish domestic content of every input. ISO 9001 and AS9100D are fictional buyer requirements in these scenarios, not universal drone procurement requirements.

Qualification evidence must have a source reference, named reviewer, scope confirmation, matching site and a validity range covering the current date. New evidence supersedes the earlier record without removing it. This records a human assertion; the app does not independently authenticate a certificate or check an issuer database. RFQ and response records preserve the captured snapshot and timeline; later requirement, supplier or response changes remain visible and can require fresh review.

Requested dates, pricing and engineering suitability are not validated or promised. Response dates, lead times and quantities are fictional supplier claims. No response sends a message or creates an order.

All supplied and entered demo records must be fictional. Profiles, RFQs, responses and reviews are stored in this browser; they are not shared between visitors or devices. The activity log is editable local state, not a tamper-proof audit system. Intake is local and deterministic: no external AI, URL scraping, or PDF ingestion is used. A URL may be recorded as a reference, but the app does not fetch it. Download/export your session before clearing browser data. An unavailable browser storage quota leaves an in-memory session and prompts export. Do not put customer drawings, private capability information, actual supplier evidence or credentials into this public demonstration.

A future real manufacturer network needs shared persistence, authentication, access control, consent, document storage and real evidence verification.

## Validation

Automated tests cover intake, buyer search, supplier-review rules and RFQ response workflow rules. Browser validation status is recorded separately in [RELEASE_EVIDENCE.md](RELEASE_EVIDENCE.md); do not treat features described here as independently browser-validated unless that record confirms them. In-app JSON/CSV download and paste/import controls describe the implemented local exchange path; verify actual file transfer in a browser before making claims about it.

## Public local context

The app separately links to UMII and Superior's official machining capability pages in Muenster. They are research references, never scored supplier records. No claim is made that either makes these exact drone components or participates in Forgepath. See [LOCAL_COMPONENT_DEMOS.md](LOCAL_COMPONENT_DEMOS.md).

No source code, customer data, credentials or supplier documents were imported from private TexasRoofAgent or GridX repositories.
