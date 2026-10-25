# Forgepath release evidence — October 25, 2026

## Version 0.7.0 — sourcing narrative and certificate clarity

The buyer journey now follows Prairie Survey Robotics sourcing 200 Scout drone landing-gear clevises. Repeated demonstration labels were consolidated into a sample-project notice. Named buyer, supplier and quality-review roles, ordinary shop names, drawing references and certificate references replace presentation placeholders. Internal record IDs and provenance remain compatible with earlier exports.

An out-of-date certificate copy explicitly means current certification status is unconfirmed. It still blocks approval. A follow-up asks whether renewal exists or certification has lapsed; loading renewal details leaves scope confirmation unchecked. A named reviewer must confirm the scope and site. Capability, qualification, named approval and stale-approval gates remain intact. A roadmap panel distinguishes working functions from future agent-to-agent connections.

Validation: 157 automated tests and syntax checks pass. The fixed-fixture benchmark was rerun with updated display labels and provenance references; expected capability facts and all 16 comparison outcomes remain unchanged. See current validation/benchmark-results.json for source hash, timings and environment. The preexisting manual workbook retains the 0.6.0 labels and remains an untimed protocol, not a new human trial.

Agent-driven browser validation passed: side-by-side comparison, disabled approval with an out-of-date certificate, open/resolved follow-up, explicit renewal scope confirmation, named approval, RFQ snapshot, late-delivery exception, acknowledgement retaining the exception, stale review after a new response, stale approval after drawing Rev B, new manufacturer extraction and immediate discovery. Workflow JSON downloaded successfully. The cloud browser timed out waiting for the HTML download event; actual HTML download/open remains a Mac acceptance check. These checks are not an independent human usability trial. The revised Mac capture preserves readable form pauses and repaired dropdown selectors. Audio cache, stale-script rejection, pacing, and an actual H.264/AAC mux/decode were checked offline using a test tone. These do not constitute a finished voiceover or continuous demonstration video. Actual laptop HTML opening, final audio/video review, and independent human testing remain pending.

---

# Forgepath release evidence — October 21, 2026

## Version 0.6.0 — MAT-14

This release adds reproducible fixed-fixture software measurements, an explicitly untimed manual worksheet and independent human protocol, plus validated workspace recovery. Independent human trials remain **n=0**; MAT-14 retains those external acceptance steps.

### Automated validation and independent review

157 tests pass: 105 existing tests, 48 workspace/recovery cases and four benchmark cases. Syntax checks pass. A separate read-only reviewer reran the suite, audited raw measurement arrays and hashes, checked workbook formulas/provenance, and exercised 69 additional malformed-state and boundary probes. Corrupt saved bytes are preserved without a write; old schema-3 exports migrate; nested RFQ snapshots, responses and reviews validate atomically; historical qualification records remain historical while stale/expired approval stays blocked.

The source ZIP extracts into a separate clean directory and passes tests, syntax checks and build without installing packages. All hosted relative HTML links resolve to packaged files. The hosted report uses an external stylesheet to comply with the app's strict CSP; the standalone source report retains its local stylesheet.

The workbook has three sheets and 10 filterable tables with exact synthetic capability/site/certificate provenance. Its six human start/end and elapsed rows remain blank, and the completed timing count is zero. ArtifactTool recalculation, timing arithmetic boundary checks, formula error scan and seven rendered views passed. Native spreadsheet behavior on the presentation laptop remains untested.

### Reproducible software measurement

The recorded run at `2026-10-21T22:07:42.243Z` uses Node v24.19.0 on Linux x64, 100 warmups and 1,000 measured iterations per task. Source hash: `273cdd24bfb0b3e7fcab723b63a274ef75331be6222927bef9afe6d6f372a506`.

| Core work per iteration | Median ms | p95 ms |
| --- | ---: | ---: |
| One card: extraction, onboarding and exact-name discovery | 0.0719 | 0.3123 |
| All six gates across four requests × four suppliers | 0.0818 | 0.3078 |
| Four named synthetic decisions and supplier-review HTML packet strings | 0.4461 | 1.0350 |

Setup is timed separately. These are synchronous software batch latencies; browser interaction, rendering, downloads, disk/network work and human reading/typing are excluded. The RFQ response-event lifecycle is outside this benchmark. All 16 explicit comparison answers agree, including 3 ready and 13 blocked pairs, with zero false-ready or false-blocked results **on these fixtures only**. The expired clevis certificate blocks advancement. One self-reported intake card remains discoverable and unqualified. No general accuracy, human time saving or adoption claim follows.

Raw samples, environment, exact source hashes, independent worksheet-style software reference and limitations are in `validation/`. `npm run benchmark` regenerates results from the current machine; retain originals if comparing. The footer card reads the recorded JSON rather than a target value. The manual comparison uses identical facts and outputs, allows ordinary spreadsheet features, hides the answer key until scoring and counterbalances order. Its packet task requires one bracket packet; the separate four-packet software batch is not a human trial.

### Agent-driven browser checks

- The prior 0.5.0 workspace loads with its complete RFQ history. Export returns a 35,429-byte JSON file through the browser download API.
- Invalid pasted JSON reports an error and leaves replacement disabled. Valid exported JSON previews 4 manufacturers, 4 requirements, 1 RFQ, 3 responses, 2 response reviews and 5 qualification records without replacement. Both consent checks are required before explicit restore.
- Restore preserves the RFQ history, held response review and stale approval from drawing revision 1 versus current revision 2.
- At a 390px iframe (375px content), keyboard activation previews and confirms restore. Preview focuses its validation heading. The dialog measures 330px content/scroll width; the page measures 375px content/scroll width. This is an iframe check, not a physical mobile test.
- The results link opens its disclosure and focuses the visible heading; its measured values match the final JSON run. A default anchor-focus conflict found during keyboard checks was fixed.
- The workflow JSON download returns a 29,629-byte file; parsing confirms its RFQ snapshot, response, exceptions and timeline structure. The HTML control produces no app error, but its download event times out in this cloud browser; actual HTML transfer/open remains unverified. Earlier directly generated HTML bytes remain covered by tests.

These are agent-driven software/browser checks. A second independent human, the actual presentation laptop, downloaded HTML open and local video fallback remain external checks in `validation/HUMAN_TEST.md`. No supported continuous recorder is exposed here. Video and authenticated Devpost submission remain MAT-11.

### Recovery and ownership boundaries

Restore validates size, record counts, bounded fields, IDs, references and history before replacing anything. Unreadable storage is downloadable unchanged, and automatic saves stay paused until explicit restore/reset. Read/quota failure leaves a persistent session-only export warning. Reset explicitly confirms replacement. Export/restore provides local portability, not shared persistence, authentication, cryptographic evidence or a tamper-resistant audit log. All records must remain fictional; use one active tab.

## Version 0.5.0 — MAT-12

This release extends the approved RFQ path into a simulated supplier response, explicit exception handling, named buyer acknowledgement/hold and portable exchange records. MAT-13 discovery remains in place. MAT-14 measurement and MAT-15 pilot materials remain separate work.

### Validation

105 Node tests pass: 56 existing tests plus 49 RFQ workflow tests. JavaScript syntax checks pass. A separate read-only reviewer verified snapshot binding, historical request correlation, exact duplicate replay, atomic failed imports, integer bounds, response/review chronology and original qualification gates. Unsafe integer quantities and backdated reviews were fixed and retested before release.

The browser retained the prior local 0.4.0 workspace and exercised:

1. Create a local RFQ from the current named buyer approval. The draft captured the supplier, request revision, line ID and approval snapshot.
2. Switch to the explicitly simulated supplier role; offer 100 pcs for November 25 against the requested November 20. The late-delivery exception is visible with source and actor.
3. Acknowledge the response as a named buyer. The late exception stays visible and the UI states that acknowledgement authorizes no purchase.
4. Submit a second response for November 18. The earlier review becomes stale while both responses and the earlier review remain in the timeline.
5. Preview a versioned CSV response 3. No record is added before explicit import. Import adds one event; replaying the identical CSV previews and skips one duplicate without a fourth response.
6. Reload: RFQ, responses, review and provenance remain.
7. Change drawing DEMO-A to DEMO-B. Current request revision 2 is shown beside the RFQ snapshot at revision 1; draft approval is stale and a new RFQ remains blocked until fresh requirement approval.
8. At a 390px iframe (375px content), use keyboard navigation to record a named hold. Stale RFQ approval and exceptions remain visible. A discovered layout overflow was fixed; document width and scroll width both measure 375px after the fix. Table overflow remains confined to its scroll container.
9. Exercise the readable workflow and JSON export controls. Generate standalone HTML, JSON and CSV using the same functions; verify request/offer, retained late exception, named review and JSON round-trip.

The browser checks are agent-driven, not an independent human or physical-device usability study. Browser-to-workspace download transfer is not verified. Actual file download/open on the presentation machine and timed baseline remain MAT-14. The generated packet bytes were validated directly.

### Scope and data boundaries

RFQ drafts are fixed snapshots in application logic. Browser storage and logs remain editable local state, not authenticated or tamper-proof records. Simulated supplier claims are unverified. The workflow sends no message, order, award or payment and makes no real delivery commitment. Use one active demo tab; concurrent browser-tab edits are not reconciled. JSON/CSV provides a validated local exchange format, not a deployed ERP integration.

Public source: https://github.com/paintbrushv/buildagentmake
Live app: https://forgepath-supplier-desk.txpaintbrush.chatgpt.site
Video and authenticated Devpost submission remain MAT-11.

## Version 0.4.0 — MAT-13

The release implements manufacturer intake and buyer discovery. Supplier-response workflows, a measured human usability baseline and a pilot ask remain separate Linear items (MAT-12, MAT-14 and MAT-15).

### Automated and independent review

56 Node tests pass, including the 32 existing decision/scenario tests and 24 new intake/search regressions. JavaScript syntax checks pass. A separate read-only implementation reviewer verified the test run and reproduced fixes for negated or conflicting numeric claims, uncertain/historical capability statements, compact material aliases, editable search ambiguity and manufacturer-name collisions. Qualification and human-approval gates remain intact.

### Browser validation

Exercised the served app through the supported browser:

- The previously failing sentence “Need a shop to make aluminum camera brackets” finds Northline and visibly explains the sample request's process/material assumptions. Search leaves the component requirement unchanged.
- An impossible location gives zero results. Explicitly removing only that location restores the result while retaining process and material.
- A new Cedar Fork paragraph fills reviewable fields with excerpts. Changing its city from Gainesville to Denton before confirmation records the original text and the human correction separately. The self-reported profile is immediately searchable and remains after reload.
- A 390-pixel iframe (375-pixel content area with a scrollbar) exercised responsive layout and keyboard entry through name, city, arbitrary process, fictional-data confirmation and submit. Unknown country, tolerance and capacity remain unknown. Document width equals scroll width: no page-level horizontal overflow in that tested flow.
- A new “Texas Turning (fictional)” profile in Austin with Laser cutting is found by exact name instead of interpreting the name as a Texas turning requirement. Focus and scrolling show the created profile.
- Search, no-match, intake confirmation and saved review transitions focus a newly rendered visible target. The original human approval and packet preview flow still produces a current named approval after the changes.

These are agent-driven browser checks, not an independent human usability study or physical mobile-device test. No task-time baseline, saved-hours claim or commercial adoption measurement has been established. Actual browser download transfer and a second person's clean run remain pending MAT-14; packet generator bytes and source package integrity have been validated separately.

### Data boundaries and external steps

All example records are fictional and visitor-local. Extraction is a conservative deterministic aid with human confirmation, not a general document-understanding or certificate-authentication service. It does not fetch URLs, parse PDFs, call external AI or create a shared supplier network. The original source and user corrections remain editable local state.

Public source: https://github.com/paintbrushv/buildagentmake
Live app: https://forgepath-supplier-desk.txpaintbrush.chatgpt.site
Video and Devpost submission remain tracked in MAT-11.

## Prior version 0.3.0 verification

## Automated verification

32 Node tests pass. JavaScript syntax checks pass for app.js, domain.js and scenarios.js. The static build requires no dependency installation. Tests cover strict capability gates, qualification dates/scope/site/reviewer, follow-up resolution, history, named decisions, stale approval invalidation, arbitrary manufacturer processes, aliases, immediate search and escaped packet content.

## Running browser journey

Validated against the served static app:

1. Camera bracket initially selects the intended 100/100 candidate.
2. Selecting the clevis shows a 90/100 candidate with expired AS9100D evidence; approval is disabled.
3. Recording a named evidence request creates an open follow-up.
4. Reviewing a synthetic renewal covering the required site/scope/current dates keeps the expired evidence as superseded history, resolves the follow-up and enables human approval.
5. A named approval produces an RFQ packet preview with the current requirement and decision. HTML and JSON download controls were exercised. The browser download-event API timed out, so browser-to-workspace file transfer was not verified; generated packet bytes are checked directly through the same export functions.
6. Changing drawing revision DEMO-A to DEMO-B makes that approval stale. The packet returns to review-only even though capability checks still pass.
7. Loading a fictional capability card, then creating the profile, immediately finds that profile in the capability network. Common process/material aliases normalize. It remains self-reported, without qualification evidence.
8. Searching 5-axis shows the new supplier and existing candidates. Reload retains the new profile, revised requirement, evidence and prior decision.

The app's data is browser-local and editable; it is not a production multi-user or tamper-proof system. Narrow viewport interaction has not been independently verified. No independent second human has yet run the clean checkout. No supported continuous video recorder is exposed here.

## Release requirements still external

- Source repository: https://github.com/paintbrushv/buildagentmake — standalone demo source, documentation, tests and build scripts. Repository visibility is tracked in Linear.
- Demo video: record the tested two-minute procedure in DEMO_SCRIPT.md on a machine with screen recording, then supply an accepted video link.
- Devpost: authenticated final submission remains required; this source release does not establish a submitted project.

Linear project: https://linear.app/matthewdickson/project/forgepath-american-manufacturing-readiness-demo-7c1aae223ad6
