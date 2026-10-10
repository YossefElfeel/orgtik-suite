# Website Manager comment follow-up

Audited the production Website Manager at `https://orgtik-suite-wm.vercel.app/en` against the user's comments, then validated fixes against isolated local services. Figma is excluded at the user's request.

## Fixes in this change

- View mode now explains disabled fields and offers an authorized Edit action that retains language, section, and return-list filters. Empty media sections explain their state and language restrictions.
- Media selection uses ten paginated image/video thumbnails with filenames and dimensions. Upload is an explicit action; search, loading, retry, empty, and permission states are visible.
- Overview's visits, ranking, and topic charts use coordinated layouts, purple styling, readable counts, and accessible tables. Software System remains in the service ranking.
- Insights supports adding sections and inserting text, images, and videos between paragraphs, with drag and keyboard ordering, captions, and alternative text. Stable IDs preserve translated words. Drafts, publication, persistence, and actual public article rendering support the same structure.
- Repeatable Published examples fill the gaps caused by suggestion drafts. They are explicitly named samples and kept off the website. Translation-state examples contain draft content. Additive migration preserves existing records and saved revisions.

## Original comment coverage

| Comments | Verification |
| --- | --- |
| Tables, contextual dropdowns, pagination and record actions | Dashboard route sweep; existing shared-table and CMS 0/1/10/11/101-row/filter regressions |
| Pages, Global, Strings, Services, Software, Work, Insights and their workflow examples | Authenticated list APIs, status filtering, ten-row limits and detail routes |
| Page section names, ordering, readable text, protected fields, cursor and rotating words | Current section mapping and editors; existing publication, formatting-marker, cursor and section-order regressions |
| Media upload, selection and metadata | Every hosted asset URL; visual thumbnail selection; upload metadata/persistence regressions |
| FAQ and Reviews | Existing public content refresh and actual Home rendering tests, shared footer link, review ordering/sample labels and CMS routes |
| Four commerce/account editors | Dedicated editor routes; canonical shared-copy mapping retains protected pricing |
| Translations, Preview, SEO Health, Redirects and Indexing | Route sweep and API checks; SEO-only permission, both redirect kinds, policy and generated public-content tests |
| Roadmap | Combined filter and creation/persisted-reload regressions |
| Leads and Ideas | New/Opened disjoint sets, states, dedicated detail routes, version checks, edit/hide/history regressions |
| Users, Activity Log, Site settings and readable roles | Authenticated routes, central account/role/access tests, activity data and Arabic layout |
| Overview queues and all charts | Filtered destination mappings, four chart screenshots and accessible-table interactions, Software System, dark Arabic mobile overflow check |
| Flexible `/content/insights/ar_02` editor | Browser insertion/selection/reordering/save/refresh; invalid input and translation tests; actual published Insights route rendering |

The initial hosted sweep passed 43/47 checks: the four failures were missing Published examples for service families, software, case studies, and articles. The local route/API sweep and focused interaction checks cover their fixes; the focused browser run passes 4/4. Hosted content writes are blocked by the audit harness. Article mutations run only against localhost and delete their disposable draft afterward.

Validation completed locally: Website Manager production build, type and all-five-catalog checks; public website tests and production build; complete mock/API suite including identity, permissions, publishing and purchasing; focused new article/fixture regressions; contract and secret checks. The design detector returned no findings. The final production sweep is run after deployment.

Run the read-only hosted audit with `node program/tools/audit-kit/wm-comments-audit.mjs --live`. Local mode expects isolated ports 3107/4273/5000/5007. `--interactions` runs only editor/media/chart/mobile checks.

Reviewed screenshots: [media picker](local/visual-media-picker.png), [service ranking](local/services-chart.png), [topic chart](local/topics-chart.png), [visits](local/visits-chart.png), [article editor](local/article-builder.png).
