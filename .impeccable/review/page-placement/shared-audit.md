# Shared Global placement audit

Audited 2026-10-15 in `orgtik-suite-restore-v3`. The source of truth for editor coverage was the current in-memory `makeStore()` in `mock/apps/wm/content.js`, including seed migrations, rather than only the checked-in website snapshot. No content values, layouts, permissions or website rendering were changed by this audit.

## Coverage

| Global record | Canonical sections | Input types mapped | Website consumer |
| --- | ---: | ---: | --- |
| Header and menu (`gl_header`) | 2 | 12 | Main page headers; six labels reused by `SiteHeader`; Home and Sign-in mobile menu lists |
| Footer (`gl_footer`) | 3 | 13 | Main page footers and FAQ `SiteFooter`; Home, Sign-in and FAQ link lists |
| Shared components (`gl_components`) | 4 | 47 | Work project stories and individual service Related work |
| Social networks (`gl_socials`) | 1 | 2 | Network icon rows in main page footers and FAQ |
| Process steps (`gl_process`) | 1 | 3 | Home and Services overview Approach |
| **Total** | **11** | **77** | **128 current English input instances when repeated list items are expanded** |

Every canonical source slot and data-schema leaf has a descriptor in `apps/wm/lib/pagePlacementShared.ts`. List item paths use `*` so guidance follows future additions and reordering. All descriptor labels and hints resolve to 112 English messages, with complete Arabic, German, French and Italian counterparts in `pagePlacementShared.messages.json`. Coverage was checked directly against `makeStore().entries.get(id).live.layout` and all four translated message key sets.

## Placement and state findings

- `gl_header.header.a` through `a-6` supply the six navigation labels in reference page headers and in `reference/SiteHeader.jsx`. Their destinations remain template-controlled. `img@alt`, `a-7`, and the legacy Menu fields affect the reference main-page headers, while the newer shared header gets its logo, project action, Menu text and accessibility labels from `gl_commerce`.
- `gl_header.menu` is consumed by `content.MENU()` in `reference/Home.jsx` and `reference/SignIn.jsx`. It appears only after opening the narrow-screen Menu. Other reference page menus currently carry their own link arrays. The newer `SiteHeader` derives its links from the six header slots and does not read this menu list. Guidance explicitly states these boundaries.
- `gl_footer.footer` supplies the main footer text. `explore` and `start` lists are read by Home, Sign-in and `SiteFooter` (used by FAQ). Other reference page footer arrays are separately defined. Their headings can change through the shared footer record even when their link lists cannot.
- Plans, Cart and Checkout use `CommerceLayout` and `gl_commerce.commerceLayout-footer` for visible footer copy. Global Footer and Socials media can still be appended there. That media placement does not imply their text/icon lists are used there.
- `gl_socials.networks.name` is the hover title on a `<span>`; `icon` is an icon-font CSS class. These are not clickable social profile links and the schema contains no URL. The current icons appear in main page footers and FAQ, not the separate commerce icon-free footer.
- `gl_process.steps` supplies the ordered short name, title and description for Home and the Services overview Approach. The page introduction remains in each Page record. Software and About have different lists and should not be described as consumers of this record.
- `gl_components.caseStudy-header` supplies the Work/category prefix and accessible tag-list label. `caseStudy-story` supplies the headline result card label and sample notice, with the card itself dependent on `study.highlight`.
- All 36 `caseStudy-intro` slots are consumed by `reference/CaseStudy.jsx`; the original section name obscured five department-specific sets. Labels now name Design, Development, Marketing, IT support or Hosting and the Approach, Delivered or Results location. The sample-results disclaimer appears only with `study.sample`. Full story sections require a story whose display mode enables sample or approved narrative. These fields have conditional or assistive guidance instead of claiming an unconditional homepage location.
- `serviceWork-service-work` appears on an individual service detail when matching/related projects exist. Three description fragments surround runtime discipline and service names. Names, images, status and summaries in the cards come from Work records.

## Confirmed unused

No field across these five current canonical layouts is completely unused. Some fields affect only one template or state, which is exposed above and in the editor hints. No fields were removed or marked unused merely because a generic preview did not show them.

## Controlled elsewhere

- New shared-header actions, logo labels, account, cart and Menu controls: Global → Purchasing content (`gl_commerce`).
- Case study badge names: Global → Case-study labels (`gl_caseFormats`). Project names, narratives, figures, display mode and highlight: Content → Work.
- Process section headings and introductions: the Home/Services Page records. Software/About steps: their own Page records.
- Header destinations, case-study diagram structure, fixed logo artwork and the icon-font class system: website templates/assets; guidance does not promise these text inputs control them.
- Shared Global media: header/footer or appended story/Approach media as defined in `content/managed-page.jsx`, `SiteHeader`, `SiteFooter` and `CommerceLayout`; text-field placement and media placement are distinct.

## Missing editable controls / template inconsistencies

1. Other reference templates have hardcoded mobile-menu and footer link arrays while Home and Sign-in use the shared lists. The audit exposes this scope; it does not silently claim global synchronization. A future website change could consolidate those arrays.
2. Social profile URLs are absent from the schema and the rendered symbols are spans. Adding real profile links requires a URL field plus website rendering and validation; current label/icon fields cannot create them.
3. The footer Made in Switzerland text in `SiteFooter` is literal template text, not a field in these Global layouts. Copyright fields do not control it.
4. Header preview opens the visible desktop header. Mobile menu, full Work story department branches, related-work availability and footer/process scrolling cannot be guaranteed by the prior generic Global preview. Their metadata disables that misleading direct preview until a valid source-aware target is supplied. Placement instructions remain available.

## Source evidence

- `mock/apps/wm/content.js` → `makeStore()` canonical live layouts.
- `apps/website/landing-directions/src/content/index.js` → `MENU`, `FOOT_EXPLORE`, `FOOT_START`, `STEPS`, `SOCIALS`.
- `apps/website/landing-directions/src/reference/SiteHeader.jsx`, `SiteFooter.jsx`, `CommerceLayout.jsx`, `Home.jsx`, `Services.jsx`, `SignIn.jsx` and other reference page link arrays.
- `apps/website/landing-directions/src/reference/CaseStudy.jsx` and `ServiceWork.jsx` for all shared component slots and their render conditions.
- `apps/website/landing-directions/src/content/managed-page.jsx` for appended shared media.
