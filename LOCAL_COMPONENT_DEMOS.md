# Local drone component demos

**HackFW status: submitted and ready for Friday, October 30, 2026.** The current buyer-led walkthrough is in [DEMO_SCRIPT.md](DEMO_SCRIPT.md), the completed video is [on Vimeo](https://vimeo.com/1239320256), and the entry is [submitted on Devpost](https://devpost.com/software/forgepath-supplier-desk). The short tour below is optional supporting material, not an outstanding recording task.

## Purpose

Demonstrate supplier review for a fictional commercial inspection-drone program, using Cooke County / Texoma as the regional setting. The scored companies, orders, part specifications, quantities, tolerances, dates and qualification evidence are synthetic. These examples are not engineering designs or evidence of local drone production.

| Selectable request | Demo lesson | Expected result |
| --- | --- | --- |
| Camera mounting bracket | Milling and material fit | Northline Precision ranks first; human RFQ review is available |
| Electronics stack standoffs | Higher volume changes the shortlist | Red River Toolworks ranks first on turning and stated lot capacity |
| Electronics isolation tray | Polymer capability differs from metal machining | Texoma Polymer Works ranks first; metal-only shops show a material gap |
| Landing-gear clevis | A high score does not cure missing qualification evidence | No supplier can advance: required AS9100D evidence is expired or unverified |

All supplier names in this table are fictional. ISO 9001:2015 and AS9100D are fictional buyer requirements for these scenarios, not universal drone procurement requirements. Verification is represented by fixture status only; the software does not independently validate certificate dates, scope or authenticity. The score does not establish airworthiness or engineering suitability. Delivery dates are displayed but not scored or promised.

## Real local capability references

Reviewed October 18, 2026. These official sources are kept separate from matching records.

- **Universal Machining Industries (UMII), Muenster:** publishes multi-axis CNC milling, turning, assembly and kitting. Source: https://www.universalmachiningind.com/capabilities.php ; location: https://www.universalmachiningind.com/
- **Superior Machining & Fabrication, Muenster:** publishes CNC milling, turning, grinding and fabrication. Source: https://superior-machining.net/capabilities/

**Inference:** machined brackets, standoffs, housings and clevises are useful hypothetical sourcing conversations for a local precision-machining network. These pages do not establish that these companies make these specific drone parts, accept these orders, have available capacity, or hold an applicable current certificate. No real company has been scored or represented as participating in Forgepath. Acetal processing is a demo capability hypothesis; no local polymer-grade supplier was validated in this update.

## Optional two-minute component tour

1. Open the app with `npm start`, reset it, and point to the synthetic-data notice.
2. Select **Camera mounting bracket**. Expand Northline's evidence. Explain the five score components, the fictional source reference, and the distinction between a shortlist and an approval. Advance to RFQ review with a note requesting a drawing review and current capacity.
3. Select **Electronics stack standoffs**. Explain why quantity changes the top-ranked supplier.
4. Select **Electronics isolation tray**. Show how a material mismatch appears explicitly. No assumption that metal machining implies polymer-grade support.
5. Select **Landing-gear clevis**. Compare expired and unverified evidence. Both block advancement even at 90/100. Record a hold asking for current scoped evidence.
6. Return to the bracket. Its decision remains associated with that request. Export all synthetic records and the review log. Show the separate official local capability reference links.

The full 0.7.0 workflow has already been recorded and attached to the submitted Devpost entry. Use this shorter tour only if helpful during live discussion. Do not include private supplier documents or customer drawings. See [DEMO_DAY.md](DEMO_DAY.md) for the remaining physical-laptop checks.

## From public capability to a real candidate

Before entering a real supplier workflow in a future secured version, obtain permission to use its information, confirm the buyer's drawing/revision and acceptance criteria, confirm material/process/part envelope and current capacity, review certificate scope/site/validity where required, and agree on lead time, first article, price and terms. Use an authenticated system with suitable access controls for nonpublic records; the present public demo remains synthetic only.


The strict approval gates, evidence review, quick capability intake, immediate local search, request-revision invalidation and RFQ packet export introduced in 0.3.0 remain in the submitted 0.7.0 release. Follow [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the current buyer-led presentation.
