# Forgepath release evidence — October 21, 2026

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
