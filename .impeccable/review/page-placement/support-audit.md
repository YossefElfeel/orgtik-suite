# Support-page placement audit

Audited 2026-10-15 against the current website consumers, not only the CMS snapshot. Scope: Contact, Roadmap, Legal, Sign in, Sign up, Partners, FAQ. Metadata retains every original key; no content is deleted, merged or published.

## Coverage and source records

- `pagePlacementSupport.ts`: 7 page editors, 24 section descriptors (including grouped children and shared-copy aliases), 165 unique full source paths. These include list containers and item groups as well as leaf fields. Reused fields retain the same record/path.
- `pagePlacementSupport.messages.json`: Arabic, German, French and Italian translations for every English descriptor message.
- Contact is one website section grouping `hero`, `enquiry`, `paths` and `topics`; its manager additionally exposes shared text under `rotation-words`.
- Sign up has no independent layout. Its shared panel edits `pg_signIn.signin`, so sign-in and registration copy must remain canonical.
- FAQ questions come from `pg_home.faqs`, shared between Home and `/faq`; the FAQ title/intro come from `pg_faq.hero`.
- Partners uses `pg_partners.intro` and `pg_partners.partners`, but its controls have two destinations: the Home logo strip and `/legal/partners` directory.

## Confirmed unused on the current website

| Saved source | Evidence | Treatment |
| --- | --- | --- |
| Contact `rotation-words`: `st_shared.repeats.s1`, `st_shared.repeats.s2`, `st_contact.b1.s14` | `Contact.jsx` builds `ticker`/`tickerList` but never renders either; the visible heading uses `Contact:3/4/5` at the top of the enquiry section. | Flag unused **on Contact**, disable its section preview. Shared sources can still be used elsewhere; preserve them. The two fixed ticker items shown below this editor tab are also absent from the current Contact page. |
| `pg_contact.paths.*.audience` | `content/index.js` adapts it to `p[4]`; `Contact.jsx` assigns `note: p[4]` but never renders `pt.note`. | Retain with explicit unused hint. |
| `pg_roadmap.hero.p-2` | `Roadmap.jsx` renders `communityText().introNote` instead. | Retain with explicit unused hint. |
| `pg_roadmap.community.div-3` | `Roadmap.jsx` renders `communityText().boardNote` instead. | Retain with explicit unused hint. |
| `pg_roadmap.submit-idea.p-2` | Current success view renders `communityText().pending`. | Retain with explicit unused hint. |
| `pg_roadmap.section-1.h3`, `.p`, `.p-2` | Current dialog mounts `IdeaDiscussion`; its heading, sample note and empty state come from `roadmap-community.js`, not these old sample-dialog fields. | Retain all three, explain no current placement, disable section preview. |

## Confirmed conditional, assistive or behavior-only content

- Contact confirmation navigation and “Send another” replace the form after successful submission. Starting-point `id` is an internal stable key; `topic` selects the exact matching topic chip. Neither is printed as a caption.
- Roadmap empty-result titles, explanations and clear controls appear only after filters/search produce no matches. Community no-results text appears within a delivery-status column. Milestone disclaimer is only in a sample milestone dialog.
- Sign-in Name, Name placeholder and Confirm password belong to `/sign-up` only. Account completion links appear when the browser already has customer identity; ordinary new sign-in/registration continues to the suite. `pg_signIn.signin.p` is still visibly rendered below the form, despite its stored wording saying access is simulated.
- Partner scrolling buttons require overflow; pause/resume also require reduced motion to be off. The directory website button uses `websiteLabel` for real partners and `exampleWebsiteLabel` for mock partners. Social example prefix is conditional on Mock partner. Empty/invalid external URLs hide their links; a missing name or invalid logo hides the entire partner.
- `aria-label` copy is identified as assistive rather than presented as a visible website heading.
- FAQ answers are shown after expanding their questions. Shared questions are edited in the original Home record; both pages update together.

## Missing editable placement in Pages, with safe existing sources

Contact's visible large title and paragraph were omitted from its page editor. Root is exposing these **existing** canonical sources in the same Contact Hero tab, above the current grouped fields:

| Visible element | Existing source | Consumer |
| --- | --- | --- |
| Main heading line | `st_contact.b1.s2` | `Contact:3` → `v.hero.l1` |
| Accent heading line | `st_contact.b1.s3` | `Contact:4` → `v.hero.acc` |
| Introductory paragraph | `st_contact.b1.s4` | `Contact:5` → `v.hero.body` |

Do **not** add `st_contact.b1.s1` as the visible Contact section label: the actual label is `pg_contact.hero.p`; the former string is assigned to a non-displayed hero root/ticker label.

The Sign in page now exposes these **existing** canonical sources in its supplemental “Account tabs, headings and actions” card. Sign up explains that mode copy is edited there, preserving a single canonical editing location:

| Website control | Existing source | Conditional placement |
| --- | --- | --- |
| Sign-in tab, sign-in form title and submit text | `st_signIn.b1.s7` | One shared string used in all three locations; explain this before editing. |
| Create account tab | `st_signIn.b2.s1` | Account tabs on `/sign-in` and `/sign-up`. |
| Recovery / registration form heading | `st_signIn.b2.s2` / `.s3` | Password recovery / Create account. |
| Recovery / registration / sign-in explanation | `st_signIn.b2.s4` / `.s5` / `.s6` | Corresponding account form mode. |
| Send-reset / create-account submit button | `st_signIn.b2.s7` / `.s8` | Corresponding account form mode. |
| Return to sign in / reset password link | `st_signIn.b2.s21` / `.s22` | Recovery / normal sign-in form. |

The following existing canonical sources remain controlled by Strings and can be surfaced in a later WM-only form extension without changing website consumers:

| Website control | Existing source | Conditional placement |
| --- | --- | --- |
| Roadmap board-column descriptions | `st_roadmap.b1.s1` … `.s4` | Under Open / Planned / In progress / Shipped headings. |
| Roadmap category chips | `st_roadmap.b3.s3` … `.s6` | Four choices in Suggest an idea. Stable category keys must remain unchanged. |
| Contact validation and success messages | `st_contact.b2.s1` … `.s3` | Validation error / successful enquiry. Preserve dynamic placeholders. |

These are not duplicate strings to merge. The string adapter intentionally shares some slots between multiple UI locations. Source mapping is in `src/content/strings-templates.js`; values are resolved by `src/content/strings.js`.

## Website content controlled elsewhere or unavailable to a WM-only change

- Legal document titles, summaries and body sections are Legal content records consumed by `content.LG()`, not fields on the Legal page. Editing page introduction does not change legal articles.
- Roadmap milestone records live in Marketing → Roadmap; individual ideas and moderated visitor discussions live in Marketing → Ideas. Page copy does not edit those records.
- Current roadmap community intro/board notes, submission receipt, consent/privacy wording, discussion labels and feedback messages are localized JavaScript maps in `src/content/roadmap-community.js`. The old page slots are **not** their live sources. No source reassignment is safe under the WM-only restriction; retain and flag the old fields.
- Contact's Name/Email/Company/Phone/Message field labels, and account Work email/Password labels, are literals in current JSX. Pages currently edit placeholders, not these labels. Making those labels editable requires a website consumer change and is outside this WM-only implementation.
- FAQ's small “FAQ” kicker is a JSX literal. Intro and section title are separately mapped to `pg_faq.hero`.
- The page `intro` special renderer uses presentation cursor settings. Its old `img@alt`, menu-close and mobile-contact slots can still be consumed by website template code but are not editable through that cursor-only card. Do not claim those original menu fields are the cursor text or silently overwrite them.

## Unconfirmed placement

No unconfirmed location was inferred for the audited inputs. Fields known to be absent are identified explicitly above. The listed JavaScript-owned labels have confirmed consumers but no safe WM-only editable source.

## Validation

- TypeScript passed after adding the metadata.
- All four translated dictionaries have exact key parity with `SUPPORT_COPY`; no empty values.
- Full path patterns preserve nested list identity (`*.question`, `*.accounts.*.url`) and canonical shared-record paths.
- Manager configuration and its packaged copy remain identical. All 14 supplemental fields point to existing source slots.
- The 10 manager tests pass, including supplemental source authorization, atomic draft updates and stale-source rollback for both Contact and Sign in. Published content is unchanged by these edits.
