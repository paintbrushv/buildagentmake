# Forgepath release evidence — October 21, 2026

Version 0.3.0. This file records completed checks, not commercial adoption.

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
