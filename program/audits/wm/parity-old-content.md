# The old content dashboard against the Website Manager (S7)

This is the plan's parity table (Phase 2, "Parity with the old content dashboard"), checked row by row on 2026-09-30:
- **Old:** `content-dashboard-somion-main`, every screen with its fields, actions and endpoints (inventory by reading the code).
- **New:** `orgtik-website-manager` at 98befc0, with the mock `local-dev/apps/wm*` at b0b7833.
- **Evidence:** the flows in `tools/audit-kit/flows/` that prove each row.

**Status meanings:**
- **✓ Kept:** the same job, done at least as well.
- **✓+ Better:** the same job with more (or safer).
- **Mapped:** the old field has no place on the new website, and the website's real field took its place.
- **Dropped:** left out on purpose, with the reason.
- **Deferred:** needs something outside this program first; it says what.

## Screens

| Old dashboard | What it did | Website Manager | Status | Evidence |
|---|---|---|---|---|
| **Overview** `/` | 4 KPI cards (value, change on last month); visitors line chart this year against last; top services by contacts; top blogs by views; blog views by service (pie) | Overview: the work queue first. Then 4 stats with their change in words, arrow and tone. Visits against the previous period (dashed), for 30 days, 90 days or 12 months. Most visited pages, services people ask about, most read articles, article views by topic. Every chart has a table view. | ✓+ | `wm-overview` 6/6 |
| | The numbers came from the old site's analytics API | No analytics is connected. The numbers are **sample data, labelled as such** on the screen; the queue and the real lead count are real. | Deferred | Needs a real analytics source (backend). The mock's `analytics.js` is the one function to replace. |
| **Contacts** list | Columns: id, name, email, phone, IP, date, new/replied. Search, status filter, pagination, delete. | Leads: the pipeline (new → contacted → quoted → won/lost, plus not a fit, spam and duplicate), owner, notes, page and UTM context, bundle or plan context, search, filters, CSV export (BOM and formula guard) | ✓+ | `wm-s3` 6/6 |
| | The IP address column | Not stored | Dropped | Data minimisation: an IP isn't needed to answer a lead (nDSG/GDPR) |
| | Delete a contact | Erase personal data (`leads:pii`, audited); the lead stays as a count | ✓+ | `wm-s3` |
| **Contact** detail | Profile, message, call-summary notes, status new/replied | Lead detail: notes with author and time, owner, a reason required for lost, history. Personal data masked without `leads:pii`. | ✓+ | `wm-s3` |
| **Blogs** list | Cards, language switch, search, service filter, pagination, details dialog, delete, "view live", add | Insights: a table (name, address, category, date, state, languages), search, pagination, **New article**, **Preview**, **Open the live page**. Take off the site or delete a draft. | ✓+ | `wm-s1b`, `wm-lifecycle` 13/13 |
| **Blog** add/edit | Title, description, rich-text content, SEO title and description, slug and keywords (≥3) per language, JSON-LD per language, feature image, service, published/draft | Details (name, excerpt, category, date, reading time, image with a description per language) and the article's takeaways and sections. The whole SEO block per language (search preview, focus keyphrase, keywords, link preview, robots, sitemap, canonical for SEO, **custom JSON-LD per language**). Review workflow, versions, schedule. | ✓+ | `wm-s1b`, `wm-seo` 11/11 |
| | Rich text (TipTap: headings, colours, images, raw HTML) | Structured sections (heading, paragraphs), as the website renders them | Mapped | The website's article template has sections, not free HTML; free HTML would change its design |
| | Published/Draft switch | Draft → review → approved → published (or scheduled), plus on-site / off-site | ✓+ | `wm-s1`, `wm-s3`, `wm-lifecycle` |
| **Projects** list and form | Title, description, tags (per language), link, main image; no SEO | Case studies: the shared brief and department blocks (D-032), figure approval, gallery and SEO. **New case study** starts blank in any department or explicitly copies a template. Narratives require approved figures and `content:approve`; changing figures disables the draft narrative while preserving the published version. | ✓+ | `wm-s1`, `wm-lifecycle`, `followup/regressions.json` |
| | External "link" field | Not kept | Mapped | The new website links to its own case-study page, not outside |
| **Reviews** | Client, title, text, 1–5 stars, public/hidden switch; create, edit, delete | Testimonial wording is editable (Global › Shared components: testimonials; each page's testimonial copy) | Partial | The website shows **placeholders only** (AGENTS.md: no invented quotes or ratings). A typed *Proof* list (quote, person, company, rating, provenance, approval) comes when approved client quotes exist. |
| **Web content** `/content/:section` | Schema-driven forms for every page section and the shared sections | Pages (each page's copy, slot by slot, with its styling marks kept) and Global (header and menu, footer, socials, process steps, shared components), Strings (424 messages) | ✓+ | `wm-s1c` 8/8, `wm-s1d` 15/15, site parity 150/150 |
| **Gallery** | Grid/list, image/video filter, upload (alt + file), edit alt, delete, full view, copy link | Media library: filters, upload (15 MB; webp, png, jpeg, svg, mp4, webm), description per language, rights and expiry, focal point with crop previews, where it's used, **delete blocked while in use**, open, **copy address** | ✓+ | `wm-s2` 13/13 |
| **Page SEO** `/seo` | Per page: SEO title, description (≥10 chars) per language, keywords (1–10, shared) | Every page **and** every entry: the whole SEO block per language. SEO health (checks per page and language). Redirects (chains, loops, covered pages). Indexing (search visibility with a reason, sitemap, robots). The site writes every head from it (S3). | ✓+ | `wm-s2`, `wm-seo`, `site-heads` 6/6 |
| **Services** and **sub-services** | Services: title, description, slug and SEO, keywords, image. Sub-services: body, quote, tags (3–10), preview and hero images, "how we work" steps, features. Create and delete. | Service families and services with the website's real fields (name, short, kicker, title, intro, image, icon; outcome, summary, three capabilities), slug and SEO | Mapped | The website's service templates have these fields, not the old site's. "How we work" is the shared process steps (Global). |
| | Create and delete services | Not offered, and the list says why | Dropped | The design has a place for each of the five families and their services (AGENTS.md: "two paired rows plus a full-width Hosting card"); a new one is a design change |
| **Sitemap blogs** and **categories** | Programmatic SEO landing pages with their own categories | Not rebuilt | Deferred | The new website has no landing-page template. It returns when the owner designs one (plan: "Migrated as archived drafts"). |
| **Jobs** | A stub that saved nothing | – | Dropped | The website has no careers page |
| **Auth** `/auth`, `/auth/not-allowed` | SSO token hand-off; a dev page with a **hard-coded JWT** | SSO hand-off; the token leaves the address. No-access, expired and signed-out states. No token in the source. | ✓+ | `wm-s0` 11/11 |

## Across the app

| Old dashboard | Website Manager | Status |
|---|---|---|
| Content in en, de, fr, it; every language required | 5 languages including Arabic (RTL). Status per language, "Start from English", four-eyes translation review, and a localization matrix. Untranslated fields show English as a placeholder, never a silent fallback on the site. | ✓+ (`wm-s3`) |
| The dashboard's UI in en, de, fr, it | UI in en, ar, de, fr, it; 1,165 keys in each, at parity | ✓+ |
| No roles in practice (RoleGuard unused): every scoped user could do everything | Admin, Approver, Editor, SEO, Marketing and Viewer. Specials: legal, claims, pricing, PII, visibility, locales, custom JSON-LD. The API returns 403 with the permission required. | ✓+ (`wm-s0`, `wm-seo`) |
| A toast on every request, even failures shown as success | A success toast only after a 2xx; 412/422/403 each say what happened | ✓+ |
| No versions, no history, delete without trash | Every save is a version with a diff; restore makes a new draft; append-only audit log; take off the site instead of delete | ✓+ (`wm-s3`) |
| No preview | The real site with the drafts at 390/768/1440, with a fit check | ✓+ (`wm-preview` 10/10) |
| No scheduling | Publish at a date and time | ✓+ (`wm-s3`) |
| 4 pagination styles, some lists unpaginated, search boxes wired to nothing | One DataTable: server-driven, 25 per page, search and filters that work, all states | ✓+ |
| Hover-only actions | None hover-only; keyboard reachable | ✓+ |

## Data migration

The plan's `migrate-v1.js` would import the old dashboard's DE/FR/IT content, contacts, reviews and gallery. Its content describes the **previous** site (somion.ch): its services, blogs and pages don't exist on the new website, so importing them would only create drafts nobody can use. What's worth carrying over:
- **Contacts** become leads.
- **Gallery files** become media with rights unknown.

Both need the old production data, which the mock doesn't have. That's the backend team's migration when the real API exists. **Status: Deferred (backend).**

## Result

- **21 rows:** 12 better, 3 mapped to the website's real fields, 3 dropped with a reason.
- **1 partial:** reviews and testimonials. They wait for real client quotes.
- **2 deferred** on something outside the program: an analytics source, and a landing-page template. The data migration (above) is deferred to the backend as well.

No old capability is lost without a reason written here.

## A9 follow-up, 2026-10-05

Roadmap restores six timeline and seven public idea examples, labelled as samples. Three pending ideas and all pending/declined/merged/hidden states remain private. Filters, details, local preview votes and moderated configurable submissions are retained (`followup/regressions.json`, `site-forms`). Blank creation works without templates across all five case-study departments, and on empty/filtered lists. Narrative permissions, figure approval/revocation, previous-publication preservation and three-frame preview rendering are covered by the follow-up regressions. Payment and account messages are editable; code-backed test values and their numbered placeholders are protected. After the comment-display correction, the seed has 448 strings in 13 groups and 307 page-copy slots. Comment buttons show their idea-specific sample discussions (`followup/roadmap-comments.json`, 21/21). Unaffected website parity is 144/144 on both dev and production; the restored Roadmap has a separate baseline. See `followup/README.md` for final counts and recovery points.
