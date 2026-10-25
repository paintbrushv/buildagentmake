# Forgepath Supplier Desk

**Track:** Supplier Relationship Management
**Release:** 0.7.0
**Tagline:** Connect American manufacturing capability to the next part that needs to be built.

## Inspiration

“I’m building a drone. Who can make this part?” A buyer needs more than a directory: the right machining process, material, tolerance, capacity and quality records. Meanwhile, capable American shops need an easier way to be found. Forgepath brings those two sides closer together, with evidence and a clear next step.

## What it does

Follow Alex Morgan at Prairie Survey Robotics as the team sources 200 landing-gear clevises for its Scout inspection drone. Forgepath compares domestic shop profiles against the part requirements. Red River Toolworks looks promising, but the certificate copy on file is out of date. That raises a practical question: has certification lapsed, or has the shop renewed without updating this record?

The buyer records a focused follow-up. A quality reviewer checks renewal details against validity dates, scope and the manufacturing site. Named approval then allows an RFQ draft tied to that exact requirement. Supplier response records preserve delivery exceptions, and changed responses require fresh review. Revising the drawing invalidates the earlier approval. Readable and structured exports retain the context.

Manufacturers can also paste their capabilities, correct the extracted fields and become searchable in the workspace. Discovery and qualification remain separate decisions.

## How we built it

Static HTML, CSS and JavaScript, with deterministic intake, editable search constraints, explicit qualification rules, versioned records, and browser-local storage. JSON/CSV response exchange checks correlated RFQ, line and revision identifiers. Export and restore preserve evidence and decision history.

## What we learned

An expired document is not proof that certification has lapsed. A high capability score is not qualification. Approval needs to follow the exact evidence and drawing a person reviewed. These distinctions turn a supplier list into a useful sourcing workflow.

## What’s next

Help more American ideas reach American factory floors. The direction is agent-to-agent coordination: buyer agents describing production needs, supplier agents representing available capabilities, and people approving qualifications and commitments. Connected agents, shared supplier records and supplier messaging are future work. The current prototype provides the discovery, review and portable-record foundation.

## Evidence and scope

The sample project uses illustrative companies, people, specifications and records. The working application is browser-local and sends no supplier messages or orders. It does not independently authenticate certificates. No commercial adoption, verified supplier eligibility or measured human time savings is claimed. The automated suite has 157 passing tests; independent human trials and actual presentation-laptop acceptance remain pending. See RELEASE_EVIDENCE.md for the scope of checks.

## Submission links and remaining fields

- Application: https://forgepath-supplier-desk.txpaintbrush.chatgpt.site
- Source repository: https://github.com/paintbrushv/buildagentmake (confirm public access and final source revision before submission)
- Video: pending the revised Mac capture and end-to-end review
- TalentDB registration, Demo Day attendance approval and calendar entry: already complete
- Final revised public entry and finished video: user approval required before submission
