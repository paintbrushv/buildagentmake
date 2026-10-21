# Forgepath demo script

## Primary recording path (2–3 minutes)

Use the default **Camera mounting bracket** request and **Northline Precision (fictional)**. Keep the synthetic-data notice and local simulation labels visible where possible. The whole buyer/supplier exchange takes place in one browser workspace.

**Open with the requirement (0:00–0:20)**

“Forgepath takes a fictional component request through a named human approval and a simulated supplier response. This is a browser-local workflow: it sends no messages and creates no purchase commitment.”

Point to the bracket's process, material, tolerance, 100 pcs and requested date. Show Northline's required checks and evidence. The default sample records are ready for human review; the score is only a comparison aid.

**Approve and create the draft (0:20–0:45)**

In the supplier review panel, choose **Approve RFQ drafting**, enter a reviewer name and note, and record the decision. In the RFQ workflow section, choose **Create local RFQ draft**. Point to the RFQ ID, immutable local draft label, request revision and snapshot context.

“This draft captures exactly what was approved. It is not an order or award.”

**Record a fictional accept (0:45–1:15)**

Switch to **SIMULATED supplier** and choose **Record simulated response**. Keep the default accept and 100 pcs, and set delivery to **2026-11-25** (after the requested 2026-11-20). Enter a fictional actor and source reference, then record it. Point to the late-delivery exception.

“The supplier response is a local claim with quantity, date or calendar lead time, actor and source reference. Forgepath flags a date later than the request for review.”

**Acknowledge, then show a changed response (1:15–1:50)**

Switch to **SIMULATED buyer**, choose **Review latest response**, acknowledge the visible exception, enter the reviewer name and note, and record the review. Switch back to **SIMULATED supplier** and submit a second response version with a delivery date of **2026-11-18** and a note saying the fictional date changed. Return to the buyer role and point out that the latest response makes the previous named review stale and requires a fresh review.

“The event history stays intact. A changed response version needs its own named review; acknowledgement still does not approve a purchase.”

**Show the portable record (1:50–2:15)**

Choose **Readable workflow packet** and **Workflow packet JSON** to show both human-readable and structured records. If time permits, expand **Advanced · local JSON / CSV response exchange** and point out the versioned template and preview/import controls. Explain that correlation fields bind the response to the RFQ, line and request revision; do not claim a cross-device transfer was demonstrated unless it was verified separately.

**Close (2:15–2:30)**

“The workflow keeps request approval, supplier response claims, exceptions and human review distinct. Qualification, engineering, price and commercial terms still need real-world review.”

## Optional technical extension: qualification evidence and stale approval

Select **Landing-gear clevis**. Inspect Red River Toolworks, whose fictional AS9100D evidence is expired. Click **Request missing evidence**, record a follow-up, then click **Review new evidence** and **Load fictional renewal details**. Record the review. Show the expired record remaining in history and the new synthetic evidence record. If all gates pass, record a named approval and create a local RFQ draft, then change the drawing revision from DEMO-A to DEMO-B and save. Show **Fresh review required** and the RFQ workflow retaining the old draft with stale approval visible.

This extension demonstrates a separate evidence journey; it is longer than the primary response path.

## Recording procedure

Optional proof point, after the main workflow: open footer **Validation & results**. Say “These are measured local software batches on fixed fictional fixtures, with raw samples and source hashes. The manual worksheet is ready; independent human timing is still pending.” Avoid presenting millisecond core latency as time saved by a buyer. Show **Export workspace** and **Restore workspace** preview if discussing repeatability; preserve an export before any reset. Follow `validation/HUMAN_TEST.md` for the separate human comparison and laptop checks.

Use the hosted app or run it locally from the source bundle. Reset the workspace first. Set browser zoom to a readable size; keep the synthetic-data notice and URL visible briefly. Use the computer's supported screen recorder and capture one continuous take. Verify the resulting video plays end to end and that each exported packet you plan to show opens. Keep a local recording and local app copy available on Demo Day. This workspace does not expose a supported continuous video recorder. Treat these as recording steps; report a recording or file-open result only after doing it.

## Demo Day checklist

- Public GitHub repository link for the working source; downloadable source alone does not satisfy this Devpost requirement.
- Brief running video uploaded to a service accepted by Devpost and included in the project.
- Supplier Relationship Management track selected; all participants' TalentDB registrations confirmed.
- Approved attendance confirmation and ticket available; Oct 30, 2026, 9:30 a.m.–3 p.m. CDT.
- Submit by Oct 28 target; official deadline Oct 30 at 11 a.m. CDT.
- Bring laptop, charger, local app/source copy, recorded video and example packet.
