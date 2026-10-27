# Forgepath: let’s get this drone built

**Status: recorded, published and submitted — ready for Friday, October 30, 2026.** The completed [8:46 Vimeo walkthrough](https://vimeo.com/1239320256) is embedded in the [submitted Devpost entry](https://devpost.com/software/forgepath-supplier-desk). See [DEMO_DAY.md](DEMO_DAY.md) for presentation setup; a new recording is not required.

Release 0.7.0. Present a buyer’s sourcing story in plain language. Use the sample-project notice on screen once; do not repeatedly label every person, field or spoken sentence as a demo. The project is illustrative, and the app does not contact suppliers or independently verify certificates.

## Cast and requirement

- Alex Morgan, buyer at Prairie Survey Robotics, sourcing 200 Scout drone landing-gear clevises.
- Red River Toolworks, Muenster: five-axis machining and Aluminum 7075 capability; AS9100D certificate copy out of date.
- Prairie Airframe Components, Denton: matching machining capability; qualification review pending.
- Northline Precision, Gainesville: other aluminum milling and turning work.
- Texoma Polymer Works, Sherman: Acetal machining.
- Casey Turner, quality reviewer; Jordan Lee, supplier representative.
- Drawing PSR-LG-104 Rev A, ±0.001 inch, requested delivery November 20, 2026. AS9100D is this buyer’s project requirement, not a claim that every drone part requires it.

## Presentation sequence

1. Open on the manufacturing mission: “I’m building an inspection drone, and I need an American machine shop to make a critical landing gear part.”
2. Select Landing-gear clevis. Read the requirement and explain clevis as the small joint connecting the landing gear.
3. Show the shortlist and expand the side-by-side comparison. Explain why shops with different processes, materials and quality records fit different parts. Inspect Red River.
4. Show the out-of-date certificate copy and disabled approval. Ask whether certification actually lapsed or the record simply needs a renewed certificate. Do not claim the app has checked a certification registry.
5. Alex records a follow-up asking for current status, dates, scope and site. Leave it open if renewal is pending or unavailable; Record hold remains available.
6. Take the renewed-certificate branch: Load renewal example. Casey checks the reference, dates and site, then explicitly checks scope confirmation and records the review. Keep the old evidence visible as superseded.
7. Alex approves RFQ drafting and creates the request for 200 clevises against Rev A.
8. Extended path: Jordan offers November 25 delivery. Show the late-delivery exception. Alex acknowledges it; the warning remains. Jordan then offers November 18. Show that the changed response requires fresh review.
9. Export readable HTML and structured JSON. Open the actual downloaded HTML on the presentation laptop, then show the RFQ review packet.
10. Change the drawing to PSR-LG-104 Rev B. Show fresh approval required and the original RFQ’s unchanged Rev A snapshot.
11. Add Prairie Creek Precision from a paragraph: Gainesville, Texas, USA; 5-axis milling and CNC turning; Aluminum 7075 and 6061; ±0.0005 inch; lot capacity 300. Review extracted fields and confirm. Search its name; it is discoverable, with qualification still pending.
12. Close on the roadmap panel: more American production and future agent-to-agent coordination, grounded in today’s working discovery, evidence review and handoff.

## Delivery and optional recapture

Brian narration: confident, warm, conversational, with enthusiasm for building American manufacturing connections. No spoken synthetic-voice label. Include a written ElevenLabs voice credit in the video description.

The completed full recording is **8:46.44** with 24 narration cues. For an optional new recording, use the separately supplied `run_forgepath_mac.sh` recording package. It keeps each form open five seconds before entry and five seconds after completion, displays dropdown options for four seconds and the selection for 2.5 seconds, and waits for narration before advancing. The selector repair uses form-scoped select name attributes. The full path contains 24 cues; `--short` omits the six supplier-response/review cues. Allow roughly 8–10 minutes for a full recapture; this is no longer a two-minute presentation.

The revised Brian soundtrack and full Mac capture are complete. The supplied MP4 passed full decoding, sampled visual review showed the full workflow and readable HTML packet opening, and the user approved the final video and entry. The video is Public and Devpost confirmed submission. No re-recording, voice generation or registration is needed for this submission. Before presenting, check the laptop's display/audio and local MP4 fallback as listed in [DEMO_DAY.md](DEMO_DAY.md); offline playback and native JSON/workbook opening remain unverified.
