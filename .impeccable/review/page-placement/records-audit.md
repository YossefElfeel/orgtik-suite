# Content-record placement audit

Audited against current website source on 2026-10-15. Scope: service families, individual services, software systems, articles, legal documents, roadmap milestones and case studies. Descriptors change editor guidance only; no record, source key, block structure, tuple, publication state or website code is changed.

## Coverage

`pagePlacementRecords.ts` exports `RECORD_PLACEMENTS` under seven `type:*` keys and `RECORD_COPY` with English messages. Its sibling JSON has complete Arabic, German, French and Italian messages. There are 14 editor-section descriptors and 182 source-path patterns, including list containers, item groups, tuple indexes, active neutral publishing fields and existing image controls.

All 102 distinct node paths in `BRIEF` and the union of the five department `BLOCKS` schemas are explicitly covered. Pair and series indexes retain their original order. The additional article block descriptors describe the current custom body editor without replacing it.

## Verified placement

| Record type | Current website consumers | Important distinction |
| --- | --- | --- |
| Service family | `content/index.js` → `families()`, `Services.jsx`, `About.jsx`, `ContentHeading.jsx` | Name/title appear in the family detail heading; Short labels chips and associated article categories; Kicker appears in department cards and service detail headings. Intro is an overview-card description, not the current family detail's reading paragraph. |
| Service | `families().children`, `Services.jsx`, `ContentHeading.jsx` | Name is used for cards and the detail heading. Outcome is on directory/family rows. Summary supplies the expanded family row and current detail introduction. Capability labels are reused by detail cards; they do not change purchasable catalog items. |
| Software module | `modules()`, `HOME_MODS()`, `Software.jsx`, `Home.jsx`, `ContentHeading.jsx` | Name is still active for structured search/breadcrumb metadata. Formal name labels the software detail/related cards; Short label labels Home diagram nodes. Title is the detail heading and selected Home panel title. Tasks appear in Home's panel and are paired to feature cards by position. |
| Article | `INS()`, `ART()`, `Insights.jsx`, `ArticleBlocks.jsx` | Excerpt is both card summary and opening text. Takeaways follow the cover. Body sections render ordered text/media blocks, or legacy paragraphs when blocks are absent. Reading minutes/date/category also appear in cards or article facts. |
| Legal document | `LG()`, `Legal.jsx` | Name also labels document navigation. Summary and ordered heading/body sections form the reading area. Version and effective date are **active publishing/history metadata**, even though the current page body does not print them. |
| Roadmap milestone | `RM()`, `Roadmap.jsx` | Name/body appear on the timeline card and detail dialog. Timing/theme/status/progress appear on cards; period/year also control visibility under filters. Milestones are separate from visitor ideas/comments. |
| Case study | `projects()`, `caseStudies()`, `Work.jsx`, `CaseStudy.jsx` | Card fields also supply the story header/Brief. Client/timeline/team/challenge/goal/role/highlight and sections 02–04 require an eligible full story. They are conditional, not obsolete. |

`content/heads.js` confirms that record `name` values also supply structured-data names, breadcrumb data and fallback browser titles; image alternative text supplies social/search-image metadata. A name that is not printed in a marketing card is therefore not automatically an unused field.

## Case-study department inputs

- **Design:** Approach steps show date/phase, title, detail and output tags. Delivered work uses palette names/HEX values, typeface, weights and application images/captions. Results use metric cards and before/after text pairs.
- **Development:** Approach adds the step completion log. Delivered work uses core, layers, module names/icons and stack tags. Results show 0–100 gauges and metric cards.
- **Digital marketing:** Approach uses total weeks and start/end week positions. Delivered work is the day/task/item schedule. Results use KPI before/after/change values, monthly chart pairs and baseline count, funnel stage/count pairs, and channel/percentage pairs. Derived percentages are calculated by the website.
- **IT support:** Approach adds ticket reference/date/status. Delivered work is priority level/name/when/response target. Results show before/after/unit comparisons and calculate the change.
- **Hosting:** Approach is the migration runbook. Delivered work shows component name/detail/status. Results use caption, cutover point count, ordered time/value chart pairs and metric cards.

The full-story gate is the existing `content/index.js` filter: approved narrative plus approved figures, or explicitly published sample narrative plus sample figures. Text entry does not publish a story or approve figures.

## Neutral and image controls

- Family icon is consumed by department cards and service rows. Family `image.src` supplies overview cards, expanded family rows and individual-service capability illustrations.
- Software icon is used by Home diagram nodes and the detail use-case panel. Software `image.src` is used by the detail feature illustration and related cards; use-case imagery additionally draws from template assets.
- Article `image.src` is used by directory cards and the reading cover. Inline article images/videos are separate body blocks.
- Project `image.src` is a Work listing cover. Gallery images form a separate collection and are not replaced by the cover.
- The current adapters pass image `src` into page illustrations, while `heads.js` reads `image.alt` for the entry's social/search image. This alt input is not a visible heading or caption; hints say so explicitly.
- Legal version/effective-date controls remain active in the document publication/version workflow. They are not marked unused.

## Preview targets and limits

- Family/service/software/article title groups use the verified `class:content-heading` element.
- Software features use `id:capabilities`; use cases use `id:demo`.
- Article body uses `id:article`; legal content uses the existing `id:legal` section.
- Case Brief uses `class:cs-brief`. Conditional narrative sections have verified `class:cs-approach`, `class:cs-delivered`, `class:cs-results` targets but `preview:false` by default because metadata alone cannot guarantee the record has an eligible full published story. The caller may use existing record eligibility to offer a valid narrative preview.
- Roadmap has `preview:false`: a generic page preview cannot guarantee the particular record's period/year/filter state or open its own dialog. Guidance states how to locate the card.

Literal route examples such as `/software/{system}` are ICU-quoted in every language, so next-intl displays them as route examples without requiring interpolation values.

## Content controlled elsewhere or missing editability

- Purchasable service/software names, prices, package contents and durations come from separate purchasing catalogs. Changing content-record capability labels does not change those catalog items.
- Detail template section headings, labels and dynamic messages come from Pages/Global/Strings where wired. They are separate from the per-record facts and narrative values audited here.
- The Design delivered board's logo-lockup examples and type specimen graphic are template assets in `CaseStudy.jsx`; editing a palette/typeface/application record does not replace those lockups.
- Software use-case images combine the module image with `UC_IMGS` template choices; there is no independent per-use-case image field in the current module schema. This is a confirmed website-owned choice, not an unknown matching input.
- Chart shape, derived conversion/change rates, chart palettes and static before/after labels are template/component behavior, not hidden per-record text inputs.
- The existing article body editor owns media block source/alt/caption fields and legacy paragraph normalization. This metadata does not duplicate that editor or convert its structures.

## Unconfirmed inputs

No unconfirmed record-schema path was assigned a guessed visible section. Current schema paths have verified consumers or explicit internal/conditional guidance. Publishing/SEO controls that do not print inside the page are labelled by their actual purpose rather than called obsolete.
