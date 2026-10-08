# Website Manager: feature benchmark against Webflow CMS and Storyblok

> Latest presentation overlay — 2026-10-08; A33/A34. Validated merge baseline `eebc85d` through PR37; closure extensions await integration.
>
> Existing actual mock CMS publish/website reload/fallback retained; studio media/variants/translation/bundles and connected OrgTik lead attribution simulated. Studio bundle state does not itself publish actual website content.
>
> UI/mock package coverage is separate from the historical benchmark below. No competitive rating or score was recalculated. Backend, hosted and external capabilities remain pending/deferred. Evidence: program/audits/prototype-business-closure/business-report.json; program/audits/wm-studio/README.md; program/audits/cms-publishing/README.md; `program/prototype-journeys.md`.


Scope: the internal CMS for OrgTik's own website (`apps/website/landing-directions`). Read on 2026-10-07 from the code (`apps/wm`) and the mock (`mock/apps/wm.js`, `mock/apps/wm/*`), with the audit records in `program/audits/wm/`. Paths without a prefix are under `apps/wm/`. The references (Webflow CMS, Storyblok) are described from their public feature sets, in our own words.

**Summary**
- **Expected, missing: 5.** These are asset folders/tags, image resizing and responsive sizes, bulk upload and replace in place, spam protection on the public form endpoint, and publish webhooks.
- **Expected, partial: 5.** These are reference fields, autosave, reviewer notifications, publish reaching the site without a manual pull, and real analytics (today it shows sample data).
- **Differentiators: 13 rated.** Six have already shipped: media rights and usage, custom JSON-LD, SEO health, translation review, lead hand-off to Sales, and roadmap ideas. Three are worth adding next: AI translation drafts, release bundles, and comments on entries.

Ratings: **Expected** means a CMS team assumes it is there. **Differentiator** means it would set us apart. **Not for us** means it is out of scope, usually because the website's design is fixed in code. Sizes: **S** is up to a few days, **M** is about 1 to 2 weeks, **L** is more than 2 weeks or needs website work too.

## Checklist

| # | Feature | Area | Rating | OrgTik today | Evidence | Gap & size |
|---|---|---|---|---|---|---|
| 1 | Structured content types with typed fields (text, long text, rich text with protected marks, number, image, icon, colour, tags, toggle) | Modelling | Expected | Have | `lib/contentTypes.ts` (11 types in 10 areas), `lib/caseStudySchema.ts`, `components/content/BlockEditor.tsx` (`LEAF` kinds). New entries from a blank or a copy for articles, case studies and roadmap items (`components/content/NewEntry.tsx`, `mock/apps/wm/content.js` `create`) | |
| 2 | Repeatable blocks: add, remove, reorder (structure set in English, translated in place) | Modelling | Expected | Have | `BlockEditor.tsx` (`moveUp`/`moveDown`/`removeItem`, `structureLocked`) | |
| 3 | Reference fields between entries (one or many) | Modelling | Expected | Partial | Only fixed relations: a service's family (`parent`) and a case study's `department` (`content.js` `NEUTRAL`). There is no general reference field kind in `BlockEditor` | Add a reference field kind (pick entries of a type, ordered), for example related articles or featured case studies. **M** |
| 4 | Define new content types and fields in the UI | Modelling | Not for us | Missing | Types are code (`lib/contentTypes.ts`), so they stay true to the site's design | |
| 5 | Page builder: put together new landing pages from sections | Editing | Differentiator | Missing | Pages follow their template's fixed `layout` (`contentTypes.ts` `layoutSections`; `fixedAddress`) | Add a section library plus a "landing page" type whose sections can be added and reordered. Needs website templates. **L** |
| 6 | Per-language form editor with English fallback hints and RTL inputs | Editing | Expected | Have | `components/content/EntryEditor.tsx`, `BlockEditor.tsx` (`fallback`, `lang`, LRI/PDI isolation) | |
| 7 | Preview drafts inside the real site at phone, tablet and desktop widths | Editing | Expected | Have | Route `/preview` (`app/[locale]/(app)/preview/page.tsx` `FRAMES`); token by postMessage (`POST /v2/admin/preview-token`, website `src/content/preview.js`); flow `wm-preview` | |
| 8 | Visual editing: click text on the page to edit it | Editing | Differentiator | Missing | The preview is view-only frames. Editing happens in the form | Map preview elements to field paths (the site already knows the slots) and open the matching field on click. **L** |
| 9 | Safe saving: conflict detection, a leave guard, autosave | Editing | Expected | Partial | `If-Match` → 412 "changed since you opened it" (`mock/apps/wm.js` `fresh`), and a `beforeunload` guard (`EntryEditor.tsx`). There is no autosave | Autosave the working draft every few seconds, with "Saved" status. **S** |
| 10 | Comments and discussions on an entry or field | Collaboration | Differentiator | Missing | Only a required note on "request changes" (`content.js` `transition`, `note_required`) | Add threaded comments on entries, shown in review, with mentions. **M** |
| 11 | Media library: upload, search, filter by kind and by issue | Media | Expected | Have | Routes `/media`, `/media/[id]`; `GET /v2/admin/media` (`issue`, `kind`, `search`) | |
| 12 | Media governance: alt text per language, rights/licence holder and expiry, focal point, where-used, can't delete while in use | Media | Differentiator | Have | `mock/apps/wm/library.js` (`usesOf`, `issuesOf`, `updateMedia`, `removeMedia` → 409 `in_use`); `app/[locale]/(app)/media/[id]/page.tsx` (`RIGHTS`, `CROPS`) | |
| 13 | Asset folders or tags | Media | Expected | Missing | Media items have no folder or tag field (`library.js` `addUpload`) | Add tags (or folders) with a filter in the library and in the image picker. **M** |
| 14 | Image resizing, formats and responsive sizes | Media | Expected | Missing | `GET /v2/media/:file` serves the original file. The focal point is stored, but no sizes are made | Add an image service with width/format parameters, and `srcset` on the site using the focal point. **M** |
| 15 | Bulk upload, and replace a file in place keeping its uses | Media | Expected | Missing | One file per upload (`media/page.tsx` `FileField maxFiles={1}`). `PATCH /v2/admin/media/:id` changes only alt, rights and focal point | Allow multi-file upload, plus "replace file" that keeps the id, alt text and uses. **S** |
| 16 | Search title and description per language, with a pixel-width results preview; social (OG) title, description and image | SEO | Expected | Have | `components/content/SeoPanel.tsx` (pixel measuring, OG fields); default OG image in `/settings/site`; flow `wm-seo` | |
| 17 | Per-page robots, sitemap inclusion and canonical (SEO role only) | SEO | Expected | Have | `SeoPanel.tsx` (`robots`, `inSitemap`, `canonical`); `content.js` `save` (canonical restricted to the SEO role) | |
| 18 | Structured data: generated per type, plus custom JSON-LD behind a permission | SEO | Differentiator | Have | `SeoPanel.tsx` (`structured`, `customJsonLd`); permission `seo:custom-jsonld` (`mock/apps/wm/permissions.js`) | |
| 19 | Redirect manager that rejects chains, loops and redirects over live pages | SEO | Expected | Have | Route `/seo/redirects`; `library.js` `validateRedirect`; `GET /v2/public/redirects` | |
| 20 | Automatic 301 when a published address changes | SEO | Expected | Have | `library.js` `keepAddresses`, which wraps transitions and visibility changes in `mock/apps/wm.js` | |
| 21 | Generated sitemap.xml, robots.txt and hreflang; hide the whole site from search, with a reason | SEO | Expected | Have | `library.js` `sitemap`, `robots`, `setVisibility` (history); route `/seo/indexing`; hreflang from public locales in `apps/website/landing-directions/src/content/heads.js` | |
| 22 | SEO health check per page | SEO | Differentiator | Have | Route `/seo`; `GET /v2/admin/seo/health` (`library.js` `health`, `CHECKS`) | |
| 23 | Five languages including Arabic RTL; turn each on or make it public | Localisation | Expected | Have | `content.js` `LOCALES`; `/settings/site` locales (`locales:enable`, English must stay public) in `mock/apps/wm/ops.js` `updateSite` | |
| 24 | Translation review: in progress → needs review → ready, four eyes, marked outdated when English changes, matrix of all entries | Localisation | Differentiator | Have | `content.js` `TRANSLATION_ACTIONS`, `translate`; route `/localization` (filters `needs_review`, `outdated`) | |
| 25 | AI or machine translation drafts on demand | Localisation | Differentiator | Missing | Only one-off seeded English suggestions for alt text and descriptions (`mock/apps/wm/suggestions.js`). No translate action in the editor | Add "Draft this language" that fills empty fields, keeps marks and placeholders, and goes into translation review. **M** |
| 26 | Draft separate from live; submit → review → approve → publish; four eyes; discard; take off the site and back | Workflow | Expected | Have | `content.js` `TRANSITIONS` (`content:approve`, the last editor can't approve), `setVisibility`, `remove` (unpublished only); flows `wm-s1`, `wm-lifecycle` | |
| 27 | Scheduled publishing | Workflow | Expected | Have | `content.js` `schedule`/`unschedule`, `tick` (publishes as "scheduler"); `components/content/EditorExtras.tsx` (`DatePicker`). Scheduled unpublishing is not offered | |
| 28 | Version history with field-level changes; restore as a new draft | Workflow | Expected | Have | `GET /v2/admin/entries/:type/:id/versions/:n`, `POST …/restore`; `EditorExtras.tsx` `VersionChanges` | |
| 29 | Release bundles: publish several entries together, now or at a time | Workflow | Differentiator | Missing | Publishing and scheduling are per entry (`content.js` `transition`) | Add a release that groups approved entries, with one review, one scheduled time and one rollback. **M** |
| 30 | Tell reviewers and owners when something needs them | Workflow | Expected | Partial | The Overview shows a work queue for each role (`content.js` `queue`; `app/[locale]/(app)/page.tsx` `QUEUE` including `newLeads`). No in-app or email notifications | Notify on submit, request changes, approve and publish, plus new leads, through the suite's notifications. **M** |
| 31 | Publishing updates the live site without a manual step | Workflow | Expected | Partial | The site renders from a snapshot pulled by `apps/website/landing-directions/scripts/content-pull.mjs` (header of `src/content/snapshot.js`). After a publish, someone has to pull and rebuild | Trigger the pull and build (or a runtime fetch with a last-known-good copy) on publish, and show the deploy state in WM. **M** |
| 32 | Roles with module:action permissions and four-eyes rules for legal text, figures and prices | Roles | Expected | Have | `mock/apps/wm/permissions.js` (6 roles; specials `legal:approve`, `claims:approve`, `pricing:approve`, `leads:pii`); `components/frame/RequirePermission.tsx` | |
| 33 | Edit roles or create custom roles in WM | Roles | Differentiator | Partial | `/settings/roles` lists roles and their permissions read-only. Roles are granted outside WM (mock `grants`) | Allow custom roles, or at least show who holds each role with a link to where it's changed. **M** |
| 34 | Audit log filtered by area and person | Roles | Expected | Have | Route `/settings/audit`; `GET /v2/admin/audit?type&by` | |
| 35 | Leads from website forms: pipeline, owner, notes, CSV export (formula-safe), personal data masked by permission, erase on request | Forms | Expected | Have | Route `/marketing/leads`; `mock/apps/wm/ops.js` (`LEAD_ACTIONS`, `csv`, `erase`); flow `wm-s3` | |
| 36 | Leads handed to the Sales CRM, with duplicates merged | Forms | Differentiator | Have | `mock/apps/wm.js` `POST /v2/public/leads` → `toSales` (`/api/leads/intake`, failure kept on the lead) | |
| 37 | Form builder: change fields or add a form without code | Forms | Differentiator | Missing | Forms are website code (`apps/website/landing-directions/src/content/forms.js`). WM only switches delivery between preview and live (`formsMode`) | Add editable labels, options and required flags for the existing forms first; new forms later. **M** |
| 38 | Spam protection on the public form endpoint | Forms | Expected | Missing | `POST /v2/public/leads` checks fields and consent only (`ops.js` `submit`). No honeypot, rate limit or challenge | Add a honeypot, per-IP rate limit and time-to-submit check, and auto-flag likely spam. **S** |
| 39 | Roadmap ideas: moderation, with public submission and votes | Forms | Differentiator | Have | Route `/marketing/ideas`; `POST /v2/admin/ideas/:id/moderate`, `GET/POST /v2/public/ideas` | |
| 40 | Website traffic analytics on the Overview | Analytics | Expected | Partial | `components/overview/WebsiteNumbers.tsx` uses `mock/apps/wm/analytics.js`: seeded sample numbers labelled `sample: true`. Parity table marks it Deferred (`program/audits/wm/parity-old-content.md`) | Connect a privacy-friendly analytics source behind `analytics.js` `report`. **M** |
| 41 | A/B tests and personalisation | Analytics | Not for us | Missing | None | |
| 42 | Fast, indexable output: prerendered pages and heads | Performance | Expected | Have | `apps/website/landing-directions/scripts/prerender-heads.mjs`; production build with 52 addresses and 47 sitemap URLs (`program/audits/wm/sync-20261006/README.md`) | |
| 43 | Content API for live and preview content | Integrations | Expected | Have | `GET /v2/public/entries/:type`, `/v2/public/site`, `/v2/preview/entries/:type` (token) in `mock/apps/wm.js` | |
| 44 | Webhooks on publish and other events | Integrations | Expected | Missing | No outbound events in the mock. The only outbound call is the lead hand-off | Add configurable webhooks (publish, unpublish, redirect change), signed, with a delivery log. This also enables #31. **M** |

## Top 8 to add (by value)

1. **Publishing updates the live site by itself (#31, with webhooks #44, M).** Today a publish isn't visible until someone pulls and rebuilds, which undermines the whole review workflow.
2. **Real analytics (#40, M).** The Overview's numbers are samples, so the team can't judge content by results yet.
3. **Notifications for reviewers and new leads (#30, M).** Four-eyes review only works if the second person knows something is waiting.
4. **Spam protection on the form endpoint (#38, S).** Leads now go live to Sales, and spam would pollute the CRM.
5. **Media: tags, bulk upload, replace in place (#13, #15, M+S).** These are everyday library chores that are blocked today.
6. **Responsive image sizes (#14, M).** Page speed and Core Web Vitals on an image-heavy site. The focal point is already stored.
7. **AI translation drafts into review (#25, M).** Ar, de, fr and it are enabled but not public. This speeds them toward launch, and the review gate already exists.
8. **Release bundles (#29, M).** Pricing, pages and articles often change together. Publishing them one by one risks a half-updated site.

Next in line: comments on entries (#10), reference fields (#3), autosave (#9), and editable form fields (#37).


## A26 presentation overlay — 2026-10-08

PR30 studio accepted; actual selected CMS publisher PR20/21 retained. Studio bundles/translations are scene-only. Existing benchmark scores and backend claims above remain historical. See the maintained release register and prototype guide; this overlay does not accept all72 or all15 journeys.
