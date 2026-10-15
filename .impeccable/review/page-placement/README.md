# Website Manager content placement review

Local implementation in the newer WM checkout, reviewed 2026-10-15. This work changes Website Manager organization, guidance and access to existing content sources. The website source was inspected to verify consumers; it was not edited. Nothing was pushed, published or made into a PR.

## What editors can now find

- **A stable website location:** page sections use descriptive titles rather than the current editable sentence. Input hints identify the page, section and element, including overview/detail differences.
- **Related inputs together:** named cards group section headings, descriptions, controls and related content. Existing canonical shared sources remain shared, and the guidance names the other pages or states they affect.
- **Honest placement information:** conditional dialogs, empty results, full project stories, narrow-screen controls and screen-reader text are identified. SEO and internal controls explain their actual purpose instead of implying that they print in the page body.
- **Safe previews:** available icons focus verified website containers. A preview is withheld when its generic route cannot guarantee the required record or state. Guidance still explains how to find that content.
- **Retained older content:** confirmed unused fields remain editable under **Older fields no longer shown**, with individual explanations. No fields or existing values were deleted or merged to simplify the form.
- **Previously hidden canonical controls:** the manager now exposes verified headings, search/filter/empty-state copy and detail-section content already consumed by the website, including Contact's heading and account-form modes. These controls save to the original sources rather than creating duplicate content.
- **Accurate media guidance:** attachments explain their existing insertion point. An editor tab without a website media area says so; adding an attachment there is not presented as creating a new website section.

## Audited scope

The coverage test reads the current manager configuration and canonical mock store rather than relying only on an older seed snapshot.

| Area | Coverage | Source evidence |
| --- | --- | --- |
| Discovery pages | Home, Services, Software, Work, About and Insights | [Discovery audit](discovery-audit.md) |
| Support pages | Contact, Roadmap, Legal, Sign in, Sign up, Partners and FAQ | [Support audit](support-audit.md) |
| Purchasing pages | Plans, Cart and Checkout, using their existing shared Purchasing editor | `pagePlacementPurchasing.ts` and the existing Purchasing metadata |
| Shared Global content | Header/menu, Footer, Shared components, Social networks and Process | [Shared audit](shared-audit.md) |
| Content records | Service families, Services, Software modules, Articles, Legal documents, Roadmap milestones and Case studies | [Record audit](records-audit.md) |

This covers all 16 Pages plus five shared Global records and seven content-record types. The existing Global Purchasing and Case-study labels workflows are preserved. Source-path patterns, list containers and shared aliases overlap, so audit pattern totals should not be added together as a count of unique visible inputs.

## Fields retained with no current visible placement

These are confirmed consumer findings, not guesses based on an empty preview:

| Editor area | Retained content | Explanation |
| --- | --- | --- |
| Work | Old status-card title/note and rotating strip | The current Work overview renders neither component. Project names still belong to the project records used by the directory. |
| Insights | Rotating strip | The current page does not render the prepared strip; article records remain active elsewhere. |
| About | Old banner note | Its value is prepared by the adapter but is not rendered by the banner. The unused capability-route list remains unexposed. |
| Contact | Rotating strip and starting-point audience note | The prepared strip and audience note are not rendered on Contact. Shared strings can still have consumers elsewhere. |
| Roadmap | Old hero/board notes, old submission receipt and old sample-dialog copy | Current community components use localized website code instead of these legacy page slots. |
| Purchasing | Six existing legacy copy slots | The previous Purchasing implementation already separates these from current controls. |

The detailed audit files identify the exact canonical paths. No audited input was assigned a guessed visible location. Future unmatched fields retain their original schema and storage paths until their consumers are reviewed.

## Remaining clarification and editability work

The following website behavior is confirmed, but resolving it needs a website consumer or schema change. It remains unchanged under the WM-only instruction:

1. **Menu and footer synchronization:** Home, Sign in and some shared templates use the Global lists; other reference templates have their own fixed link arrays. Global hints describe this limited scope. A future decision is needed on whether all templates should share one source.
2. **Social destinations:** current Global Socials fields control hover names and icon classes. The website renders symbols without profile links, and no URL field exists. Real profile links need both a URL source and a website consumer.
3. **Form labels:** Contact's Name, Email, Company, Phone and Message labels, plus account Work email and Password labels, are fixed website text. Existing placeholders are separate editable inputs.
4. **Roadmap community text:** consent/privacy text, discussion labels, feedback, current receipt and community notes come from localized website code. Legacy Page fields are retained and identified; changing them cannot update those current components.
5. **Other fixed template assets/text:** examples include Home's fixed headline, Software's fixed middle heading, some testimonial text, FAQ's small kicker, the shared-footer Made in Switzerland text, case-study diagram assets and software use-case image choices. The audits distinguish these from active CMS values. Their future editability should use an agreed canonical source, not disconnected dashboard fields.

Some additional live text already has canonical Strings sources, including Roadmap column descriptions/category choices and Contact validation/success messages. Those values remain available through Strings; their precise ownership is documented in the support audit. They have not been merged with similarly worded page fields.

## Verification scope

Final local review resumed on 2026-10-15 and visited all 16 Page editors. It corrected two navigation issues: Home's shared Partners and Reviews tabs now follow their website positions, and page content opens before retained pointer settings. The navigation uses the audited editor order, honors saved website section order, keeps supporting inputs beside their section and retains unknown future tabs. Five additional regression tests cover the real page schemas. Evidence: [Home section order](home-section-order.png).

The earlier Ideas and notes requests were also checked. Visitor comments now have **Publish**, **Hide/Decline** and **Delete**, with a separate **Deleted** list and **Restore**. Deletion retains private content and history; restoration returns the comment to Hidden and requires a separate publication action. Thirteen focused backend checks cover permissions, stale versions, public visibility, retry receipts, merges and cold checkpoint recovery. An independent source review found no blocking defects. The browser confirmed the new controls and recoverable-deletion explanation, then cancelled the dialog without modifying the fixture. Evidence: [comment deletion confirmation](idea-comment-delete-confirmation.png).

Internal WM notes and Element comments retain edit/delete controls. Lead notes remain owned by CRM, as in the existing architecture; the WM screen explains this and links to the authorized CRM record. Published content was not changed during this final review. The local preview is available at `http://localhost:3018`; no PR or push has been made.

The implementation includes focused automated checks for:

- Every current Page input, supplemental source and shared reference resolving to placement guidance.
- Every audited shared Global and content-record schema input resolving to a location or an explicit retained/conditional explanation.
- All guidance resolving in English, Arabic, German, French and Italian.
- Original content paths, rich-text constraints, existing hints, tuple indexes and unknown future fields being retained.
- Manager configuration matching its packaged copy, canonical-source authorization, atomic draft saving and stale-source rollback without changing published content.

Browser verification checked the editor at desktop (1280 px) and mobile (390 px), with no horizontal document overflow. Contact's newly exposed main heading was changed through the UI and saved as a draft; the real website preview showed that exact draft text in the Contact heading at phone (390 px), tablet (768 px) and desktop (1440 px). The original wording was restored and saved, without publishing. Evidence: [desktop editor](contact-desktop-final.png), [mobile editor](contact-mobile.png), [draft preview](contact-draft-preview.png) and [draft preview proof](draft-preview-proof.json). All 26 focused UI/source/helper tests and 12 manager tests passed, as did TypeScript, five-language key/placeholder checks and formatting all 4,045 placement messages without interpolation values (809 messages per UI language). The final manual detector returned no findings. These checks do not claim that every conditional website state was exercised in the browser. No website files were edited for this request, and no PR, push or deployment was made.

To update guidance, edit the `pagePlacement*.ts` metadata and its translated sibling dictionaries, then run from the repository root:

```sh
node tools/i18n/sync-page-placement.cjs
node tools/i18n/check-catalogs.mjs
node --test --test-isolation=none apps/wm/lib/pagePlacement.test.cjs mock/apps/wm/manager.test.js
```

The synchronization command updates only the generated `PagePlacement` catalog namespace and rejects missing or orphaned translation keys. Existing save, review and publication rules remain in force.
