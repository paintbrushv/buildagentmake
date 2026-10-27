# MAT-14 independent human comparison

Status: **pending actual human runs (n = 0)**. No completion times, usability savings or human benchmark results have been measured. Agent runs, automated checks, a prepared workbook and a video demonstration do not count as independent human tests.

**HackFW submission is complete and the presentation materials are ready for Friday, October 30, 2026.** This future research protocol is separate from the [submitted entry](https://devpost.com/software/forgepath-supplier-desk). The [finished video](https://vimeo.com/1239320256) shows the readable HTML packet opening. See [DEMO_DAY.md](../DEMO_DAY.md) for the short presentation checklist; the remaining native-laptop and independent-human observations below are not marked complete.

## Materials and fixed conditions

- Forgepath: https://forgepath-supplier-desk.txpaintbrush.chatgpt.site
- Manual baseline: [manual-baseline.xlsx](manual-baseline.xlsx). Its three sheets contain instructions and a timing log, blank work areas and source facts.
- Both methods use the same four synthetic suppliers, four requests, 16 supplier–request pairs, Lone Oak capability card and **2026-10-21** as-of date from `fixtures.json`. All businesses, claims and evidence are fictional. No external supplier retrieval is needed or allowed.
- Only the four supplied comparison suppliers belong in task 2. The new intake profile remains outside that comparison.
- Use the same computer, display, input devices and time budget for both methods. Record browser, spreadsheet application/version and prior familiarity. Permit normal spreadsheet sorting, filters, Find, copy/paste, formulas and ordinary editing; the blank workbook areas are a convenience, not a mandatory sequence of cells.
- Provide the supplied facts and readiness rules to both conditions. Provide the capability card as input in both conditions. Supply no completed decisions or answer key.

Readiness requires an exact listed process and material, supplier tolerance no larger than the requested tolerance, and lot capacity at least the requested quantity. Required qualification must be verified, valid on the fixed as-of date, scope-confirmed, source-referenced, match the supplier site and have a named reviewer. US manufacturing also needs country US, reviewed site, source reference and named site reviewer. Missing evidence blocks readiness; self-reported claims do not establish reviewed evidence. These rules describe the shared task, not product navigation.

## Participants and assignment

Recruit humans who did not build, author or debug this product, workbook or fixture answer key. Record an anonymous participant ID and relevant procurement/spreadsheet familiarity. Do not use an agent as a substitute.

Assign order before the run and alternate or randomly balance participants between **A: Workbook → Forgepath** and **B: Forgepath → Workbook**. Keep the three tasks in the same order within each condition. At least one participant in each order is needed to call the exercise counterbalanced. A single run can be reported as an observed case, with its order disclosed.

Optional untimed practice must be offered equally to both methods using a different, unrelated example. Record whether practice occurred. Do not rehearse the measured fixture or reveal correct answers. Using the same facts twice can create learning effects even when order is balanced; disclose this limitation when reporting results.

Before each measured condition, make a fresh workbook copy or reset the product to the fixed fixture state. Do not carry over the participant's intake, decisions or packet from the previous condition. Keep any product approval/export state initially uncompleted. Verify fixture readiness before the participant begins; exclude setup time in both conditions and record technical setup failures separately.

Do not show `fixtures.json`, `benchmark-results.json`, `benchmark-report.html` or software reference results to participants before both conditions end: those materials contain the answer key. The workbook Facts sheet deliberately omits every `expected*` field. The observer may access the key only after outputs are captured, or a separate assessor may score afterward.

## Observer script: read only these task statements

1. **Intake and find:** “Using the supplied capability card, create a supplier profile that preserves the manufacturer's name, location, country, processes, materials, tolerance, lot capacity, source reference and description. Preserve its evidence status. Then find that profile by the manufacturer's name and show it to me.”
2. **Shortlist:** “As of 21 October 2026, identify every supplier ready for RFQ drafting for each of the four supplied requests. Explain why each excluded supplier is not ready. Use the supplied facts and readiness rules.”
3. **Named review packet:** “Prepare a review packet for the camera mounting bracket with the request and drawing revision, selected supplier, capability and qualification/domestic evidence, source references, decision, rationale and any open issues. Record the reviewer's name, review time and packet status. Do not send an RFQ.”

Read each statement verbatim immediately before its task. Say only “Please continue as you normally would” if asked what to do next. Do not name controls, direct clicks, point to cells, suggest a supplier or explain an error during measured work. Do not require think-aloud narration, which can change timing. If assistance is requested, record the request and the exact assistance given. If rescue is necessary, flag the task as assisted and exclude it from an unassisted-completion comparison; retain its observed time and failure details.

Start task timing after the task statement has been read and the participant says they are ready. Stop when the participant declares completion and presents the output, abandons the task, or reaches an identically predeclared time budget. Record UTC start and end to the second, including the date. Do not stop the clock for errors or help. Record any interruptions separately. Use the Instructions timing log or an equivalent observer log. Its elapsed-seconds formulas remain blank until both timestamps exist and flag reversed timestamps.

## Record and assess

For each participant, condition and task, capture start/end, elapsed seconds, completion state, error count, help requests, failed-task flag and observer notes. Leave unobserved results blank. “Failed” includes abandonment, a time-budget stop, no usable output, or an essential requirement not completed; state the reason. Do not convert failure into zero time or silently discard it.

Save outputs before revealing or discussing the key. Assess both conditions against equivalent outputs, preferably with the method label removed and a separate assessor:

| Task | Output to assess | Error definition |
| --- | --- | --- |
| Intake | All card facts, source reference, evidence status and successful find by manufacturer name | Each missing/incorrect required field or unsuccessful find is one error; record false evidence assertions separately |
| Shortlist | Decisions and exclusion reasons for all 16 pairs; ready suppliers grouped by request | One error for each pair with an incorrect/missing readiness decision; record missing/incorrect blocker categories separately |
| Review packet | Correct request/revision and chosen supplier, relevant source references, decision and rationale, named reviewer, timestamp and status | One error for each incorrect/missing required packet field; separately flag unsupported approval or missing evidence |

Do not require a numeric matching score in the workbook. Readiness, reasons and packet substance are the comparable outputs. Allow the workbook packet to remain in cells or be saved/printed using normal spreadsheet features. Product HTML/JSON exports may be retained as its corresponding output, but export file format is not a penalty imposed on the manual condition.

Report per-task times, errors, assistance and failures with actual sample size and order. Separate completed, unassisted tasks from incomplete/assisted ones. Summarize the observed sample only, with its learning and familiarity limits; do not extrapolate general productivity savings or fill empty rows with estimates. Timing arithmetic tests of the workbook are software checks, not human observations.

## Remaining laptop checks and future human-study steps

1. On the actual presentation laptop, open the public URL above and check the complete workflow at that machine's normal display size. Cloud-browser verification does not establish laptop/browser/download behavior.
2. Download [manual-baseline.xlsx](https://forgepath-supplier-desk.txpaintbrush.chatgpt.site/validation/manual-baseline.xlsx), open it in the intended spreadsheet application, confirm all three sheets and filter controls, and verify that a disposable start/end entry calculates seconds. Use a clean copy for the human run.
3. On that laptop, export **Readable workflow packet** and **Workflow packet JSON** from the workflow. If the legacy review dialog is used, its labels are **Download readable packet** and **Download JSON**. Open the downloaded HTML in the presentation browser and the JSON in a text editor. Confirm request/supplier/decision/evidence/reviewer content and exact file locations; a download click alone does not prove a file opens correctly. Keep these post-task exports out of the participant's pre-task materials.
4. Use **Export workspace** to save a recovery JSON. Test **Restore workspace** in a disposable browser state: paste the JSON, inspect the preview, give the explicit restore consent, and confirm the restored facts, review decisions and packet. Preserve the original presentation state until recovery succeeds.
5. Use **Download source**. On a clean local machine with Node 20+ and Python 3, follow the downloaded project's README to install its declared dependencies, run its documented checks/build, start it, and open the resulting local URL. Confirm the fixture/card workflow and HTML/JSON exports there. Record actual command outcomes; source download availability alone does not prove a clean boot.
6. Open the completed **8:46 Forgepath MP4** on the actual presentation laptop as the offline fallback, with the network disabled, and verify sound and playback. Its full drone-clevis workflow is already [published on Vimeo](https://vimeo.com/1239320256) and submitted; no replacement recording is needed. Offline playback on the presentation laptop remains unobserved. Keep the workbook and readable packet locally accessible if using them. Label playback as a recorded demonstration, never a live run or independent human test. The video is not a completed run of this three-task human protocol.
7. Run the independent human protocol above in both orders, preserve original outputs/logs, score afterward, and replace the pending status only with observed results. This human step cannot be completed by agents or inferred from automated benchmark output.
