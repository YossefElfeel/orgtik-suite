# Marketing benchmark: OrgTik Marketing vs HubSpot Marketing, Mailchimp and Buffer

Date: 2026-10-07. Read from code and mock, not from screen names. Scope: `apps/marketing`. Site pages and forms live in Website Manager (`apps/wm`); they are counted only where Marketing should link to them.

**Summary**
- Expected and Missing: **11** (calendar drag to reschedule, posting queue, social inbox, campaign results, email designer, message stats, consent/unsubscribe, contact records, CRM sync, landing pages, automated journeys).
- Expected and Partial: **5** (email campaigns, segments, lead forms, report export/scheduling, mobile).
- Differentiators: **12** are worth having. 6 are already shipped: the client approver, boost, the paid social ad builder, Google search ads, SMS and WhatsApp, and 5 languages with RTL and brand-zone schedules. 6 are worth adding or finishing: brand kit, AI writing, link-in-bio, UTM attribution, competitors/mentions, and sharing website pages to social.

Evidence key: `posts` = `mock/apps/marketing/routes/posts.js`, `camp` = `mock/apps/marketing/routes/campaigns.js`, `aud` = `mock/apps/marketing/routes/audience.js`, `lib` = `mock/apps/marketing/routes/library.js`, `ins` = `mock/apps/marketing/routes/insights.js`, `integ` = `mock/apps/marketing/routes/integrations.js`, `cat` = `mock/apps/marketing/catalog.js`. Routes are under `apps/marketing/app/[locale]/(dashboard)/`, and components are under `apps/marketing/components/`.

Ratings:
- **Expected** means at least two of HubSpot Marketing, Mailchimp and Buffer treat it as standard for a small business.
- **Differentiator** means it is uncommon in those products, or it fits OrgTik's suite or markets (Meta-heavy MENA, WhatsApp, Arabic).
- **Not for us** means it does not fit non-technical SMB owners now.

Sizes: S ≤ 3 days, M ≤ 2 weeks, L > 2 weeks.

| # | Feature | Area | Rating | OrgTik today | Evidence | Gap & size |
|---|---|---|---|---|---|---|
| 1 | Publish to several networks (Facebook, Instagram, X, LinkedIn, TikTok, YouTube); duplicate a post | Publishing | Expected | Have | cat `PLATFORMS`; `posts/create-post` (`pages/posts/CreatePost/PostComposer.tsx`); posts `POST /publishing/posts`, `/:id/duplicate` | — |
| 2 | Content calendar | Publishing | Expected | Have | `calendar/` (`pages/posts/calendar/PostsCalendar.tsx`, CalendarGrid, day agenda sheet) | — |
| 3 | Drag a post to another day on the calendar | Publishing | Expected | Missing | `PostsCalendar` opens a post or a day; there is no move handler | Drag or "Move to" changes the schedule (with re-approval if needed). S |
| 4 | Schedule in the brand's time zone, publish automatically when due | Publishing | Expected | Have | `CreatePost/ScheduleStep.tsx`; `tick()` in `mock/apps/marketing.js`; `project.timeZone` (wave plan) | — |
| 5 | Posting queue with time slots and suggested best times | Publishing | Expected | Missing | Each post gets one fixed date-time (posts, `ScheduleStep`) | Weekly slots per brand, "Add to queue", and best-time hints from the analytics. M |
| 6 | Per-network text with live length limits | Publishing | Expected | Have | `CreatePost/ContentStep.tsx` (`TEXT_LIMITS`, shared or per-platform text) | — |
| 7 | Per-network preview | Publishing | Expected | Have | `pages/posts/details/PostPreview.tsx`, `dialogs/SocialMediaPostPreviewDialog` | — |
| 8 | Approval workflow: reviewers, approve/reject, re-approval after edits, rollback | Publishing | Expected | Have | posts `/:id/reviewers`, `/approve`, `/reject`, `/rollback-last-approved`; camp same + `markEdited`; `details/PostApprovals.tsx`, `campaigns/details/ApprovalPanel.tsx` | — |
| 9 | Client approver role (an outside reviewer who approves their brand's content) | Publishing | Differentiator | Have | `client_reviewer` grant (`mock/apps/marketing.js`); role matrix in `program/audits/marketing/wave-plan.md` | — |
| 10 | Internal comments on posts and campaigns | Publishing | Expected | Have | posts `/:id/comments`; camp `/:id/comments`; `details/PostComments.tsx`, `campaigns/details/CommentsPanel.tsx` | — |
| 11 | Several brands, with a switcher | Publishing | Expected | Have | `mock/apps/marketing/routes/projects.js`; `components/suite/ProjectSwitcher.tsx` | — |
| 12 | Social inbox: reply to comments and messages | Publishing | Expected | Missing | Integrations ask for messaging scopes (cat `MESSAGING`), but there's no inbox route or endpoint | A unified inbox for Facebook/Instagram comments and DMs. L |
| 13 | Boost a published post (paid promotion, confirmed spend) | Publishing | Differentiator | Have | `boost/`, `details/BoostDialog.tsx`; ins `POST /ads/boost`, `/ads/executions` | — |
| 14 | Link-in-bio page | Publishing | Differentiator | Missing | — | One page per brand with links and recent posts, built on WM. S–M |
| 15 | Media library and content labels | Content | Expected | Have | `gallery/` (`pages/posts/media/MediaLibraryPage.tsx`), lib `/galleries`; `labels/`, lib `/labels` | — |
| 16 | Brand kit (logo, colours, fonts, tone of voice) | Content | Differentiator | Partial | A brand has a name, description, avatar, time zone and currency (`routes/projects.js`; wave plan contracts) | Colours, fonts, logo variants and tone notes, used by the composer and templates. M |
| 17 | AI writing help: draft, rewrite, translate into the 5 languages | Content | Differentiator | Missing | — | Composer and template assist, Arabic first. M |
| 18 | Campaigns by type: social, paid social, Google search, messaging (step wizard) | Campaigns | Expected | Have | camp `TYPES`, onboarding steps; `campaigns/new/[type]/[step]`, `pages/campaigns/create/steps/*` | — |
| 19 | Paid social ad builder: ad sets, targeting, CTA, budget in the ad account's currency | Campaigns | Differentiator | Have | camp `AD_SETS_AND_ADS`; `dialogs/AddPaidSocialAdDialog` | — |
| 20 | Google search ads (responsive search ads) | Campaigns | Differentiator | Have | camp `GOOGLE_SEARCH_ADS`, `AD_GROUPS`; `dialogs/AddResponsiveSearchAdDialog` | — |
| 21 | Campaign results: spend, clicks, cost per result, leads | Campaigns | Expected | Missing | Campaign detail shows the budget and status only (`campaigns/details/CampaignDetailsView.tsx`); boost executions show status (ins `/ads/executions`) | Results per campaign and ad set, and cost per lead. M |
| 22 | Email campaigns to an audience or segment, with personalisation variables | Email | Expected | Partial | `MESSAGING` campaign with the EMAIL channel, sender, template, audience/segment (camp `MESSAGE`; `create/steps/messaging/*`); `{{variable}}` extraction (aud `POST /messaging/templates`). Senders are list-only (aud `GET /messaging/sender-configs`) | Sender setup and domain check, test send, a clear send time. M |
| 23 | Visual email designer and template gallery | Email | Expected | Missing | Templates are a subject plus a plain body (aud `POST /messaging/templates`) | A block editor that is RTL-safe and uses the brand kit. L |
| 24 | SMS and WhatsApp campaigns (WhatsApp template data) | Email | Differentiator | Have | aud templates with channel `SMS` / `WHATSAPP` (`providerData`); camp `MESSAGE` | — |
| 25 | Delivery and engagement stats: sent, delivered, opened, clicked, unsubscribed | Email | Expected | Missing | No message results in the campaign views (`mock/apps/marketing/views.js` `campaignView`) | Per-campaign message stats. M |
| 26 | Consent, unsubscribe and suppression list | Email | Expected | Missing | The import maps name, email and phone only (aud `/audiences/imports/:id/commit`) | Opt-in status, an unsubscribe link, a suppression list. M |
| 27 | A/B tests | Email | Not for us | Missing | — | — |
| 28 | Contact import (CSV) with column mapping and a preview | Audiences | Expected | Have | `pages/posts/our-audience/ImportContactsDialog.tsx`; aud `/audiences/imports` + `/commit` (the mock's .xlsx preview is a placeholder) | — |
| 29 | Segments | Audiences | Expected | Partial | Rules limited to source, type, interest and qualified-only (aud `cleanRules`); `our-audience/CreateSegmentDialog.tsx` | Rules on contact fields, tags, engagement and CRM stage. M |
| 30 | Contact records: browse, edit, tags, history | Audiences | Expected | Missing | Audiences are named lists with a count (aud `GET /audiences`; `our-audience/OurAudience.tsx`) | A contact list and profile. M |
| 31 | CRM sync: Sales contacts and stages as audiences | Audiences | Expected | Missing | There is no Sales link in `mock/apps/marketing` | A shared contact source with Sales. M |
| 32 | Landing pages | Pages & forms | Expected | Missing | There are none in Marketing; site pages live in Website Manager (`apps/wm`) | Create or choose a WM page from a campaign. M |
| 33 | Lead forms that feed the CRM | Pages & forms | Expected | Partial | The WM public form forwards to Sales intake (`mock/apps/wm.js:369`, D-028). Marketing has no forms and no link to them | Pick a WM form per campaign and see its leads. S |
| 34 | UTM links and lead attribution to campaigns and posts | Pages & forms | Differentiator | Missing | Sales stores UTM on leads (`apps/sales/.../LeadSourceDetails`). Marketing makes none (the boost URL is free text, `BoostDialog.tsx`) | Automatic UTM on links, and "leads from this campaign". M |
| 35 | Automated journeys (welcome, follow-up, win-back) | Automation | Expected | Missing | — | Three or four ready-made recipes, triggered by a form, a segment or a CRM stage. L |
| 36 | Cross-channel overview with period comparison | Analytics | Expected | Have | `our-reports/` (`pages/ourReports/ReportOverview.tsx`); ins `/analytics/reports/overview` (`mock/apps/marketing/analytics.js`) | — |
| 37 | Per-profile and per-post analytics (followers, reach, engagement) | Analytics | Expected | Have | `our-reports/[id]/*`, `details/PostPerformance.tsx`; ins `/analytics/reports/{profiles,followers,post-performance}` | — |
| 38 | Competitors and mentions | Analytics | Differentiator | Partial | `competitors-reports/` reads `/analytics/competitors`; adding a competitor has no endpoint (wave plan). There's a per-profile mentions report (`ourReports/profile/ProfileSections.tsx`, ins `/analytics/reports/mentions`) and no keyword listening | `POST /analytics/competitors` + UI. S; keyword alerts. M |
| 39 | Report export and scheduled e-mailed reports | Analytics | Expected | Partial | CSV of the visible table (`ourReports/shared/ExportButton.tsx`); "Send report" was removed (wave plan, MKT-069) | A weekly PDF/email summary for the owner. M |
| 40 | Account connection wizard, with reconnect and sync status | Integrations | Expected | Have | `integrations/wizard/[platform]/[step]`; integ `/connect`, `/callback`, `/:id/sync`, `/:id/toggle` | — |
| 41 | Share new website pages or posts to social (WM link) | Integrations | Differentiator | Missing | — | "Share" from WM opens the composer with the link. S |
| 42 | Roles and permissions (5 roles, own-media rules, read-only View as) | Team | Expected | Have | `mock/apps/marketing/roles.js`; `apps/marketing/lib/permissions` | — |
| 43 | Mobile use (including approving on the go) | Team | Expected | Partial | The responsive web renders clean at 390px (`program/audits/marketing/vs1/vs1-marketing-final-*.md`). There's no app or push | Push for approvals, and mobile approve/reject. M |
| 44 | Five languages, including Arabic RTL; schedules in the brand's zone | Team | Differentiator | Have | `apps/marketing/messages/{en,ar,de,fr,it}.json`; vs1 final 20 of 20 | — |

## Top 8 to add (by value)

1. **CRM sync and attribution** (#31, #34, #33). Sales contacts and stages become audiences, links carry UTM, and each campaign shows its leads. This is the suite's edge over standalone tools. M.
2. **Consent/unsubscribe and message stats** (#26, #25). These are needed before email and WhatsApp sends can be trusted or legal. M.
3. **Campaign results** (#21): spend, clicks and cost per lead for paid social, Google and boosts. M.
4. **Visual email designer with templates** (#23), RTL-safe. L.
5. **Social inbox for comments and DMs** (#12). SMB customers in the region mostly come through Facebook and Instagram. L.
6. **Posting queue and calendar drag to reschedule** (#5, #3). S + M.
7. **Simple automated journeys** (#35): welcome and follow-up from a form or CRM stage. L.
8. **AI writing help in the 5 languages** (#17), using the brand kit (#16). M.


## A26 presentation overlay — 2026-10-08

PR29 Marketing scene accepted: consent/content/queue/journey/AI mock workflows; external and new crossapp delivery pending. Existing benchmark scores and backend claims above remain historical. See the maintained release register and prototype guide; this overlay does not accept all72 or all15 journeys.
