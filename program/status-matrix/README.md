# Unified status matrix

`status-matrix.csv` holds one row per entity × state. v0 (session 5) has 92 states across 15 entities. Every row is **proposed** until the G0 review.

**Columns:**
- `entity` · `state_key`
- `label_en/ar/de/fr/it`
- `meaning` · `next_states`
- `tone`: a design token (success / warning / danger / info / brand / neutral)
- `icon`: a Phosphor icon name
- `who_sees_it` · `primary_action`
- `sources` · `notes`

**The rules it follows:**
- A status always shows its **icon and label** together; colour alone never carries it.
- **One state has one tone.** A state that blocks work is `danger` (Read-only, Suspended). A state that asks for an action soon is `warning` (Past due, Customer review). Work in motion is `info`. Done or healthy is `success`. Final or dormant is `neutral`. `brand` is only for Beta and staff viewing.
- **Labels are per entity, not per English word.** "Cancelled" is *Gekündigt* for a workspace, *Storniert* for an invoice and *Zurückgezogen* for a leave request; «ملغاة» or «ملغى» follows the entity's gender in Arabic.
- The Arabic labels are MSA. The spec's dialect labels were replaced: «اتمسح», «اتحلت», «مقفولة», «موظف بيشوف الحساب».

## Entities in v0

| Group | Entities | Source |
|---|---|---|
| SaaS core (spec) | `tool_state` (the shell sidebar), `subscription_line`, `workspace`, `invoice`, `service_request`, `support_ticket`, `banner` | Spec 05 USR-00, spec 06 state tables |
| Website Manager | `cms_revision`, `cms_visibility`, `translation`, `roadmap_idea`; `lead` is shared with Sales (D-028) | The approved plan, phase 2 workflows |
| Current apps | `share_link` (Files), `task` (Tasks), `leave_request` (HR) | The local-dev mocks |

Every other per-tool entity (payroll run, post approval, deal stages, HR tickets, …) is added in its app's wave, from that app's audit.

## Banners: one at a time, by priority

The spec says "max 1 banner at a time by priority" but doesn't give the order. The proposal puts blocking first, then work lost now, then work about to be lost, then decisions with a deadline, then information:

| Priority | Banner | Tone | Who | Action |
|---|---|---|---|---|
| 1 | Workspace suspended (blocking page) | danger | everyone | Contact support |
| 2 | Tools are read-only | danger | everyone | Pay now (owner) |
| 3 | Payment failed | danger | owner (admins: a softer note) | Pay now |
| 4 | Trial ends soon (from 3 days before) | info | owner | Choose a plan |
| 5 | Beta billing starts | warning | owner | View plans |
| 6 | Price change | warning | owner | Details |
| 7 | Downgrade scheduled | neutral | owner | Cancel downgrade |
| — | Viewing as customer | brand | OrgTik staff only | Exit |

"Viewing as customer" isn't in the one-banner slot. It's a permanent ribbon, so staff always know they're inside someone else's workspace, even when a customer banner takes the slot (D-017).

## Contradictions v0 settles, for review

| Contradiction | v0's answer |
|---|---|
| The spec lists the subscription-line states three ways (US-C-11, the 06 table, USR-00) | The 06 table is the source, because it's the only one with transitions. The shell's `tool_state` is derived from line state × release status × access. |
| Service request has both "Under review" (sales evaluating) and "In review" (the customer checking a deliverable) | The second is renamed **Customer review**. |
| Support ticket "Waiting for you" is only right from the customer's side | Two labels (D-027): *Waiting for you* for the customer, *Waiting for customer* for staff. |
| The spec shows a lock for both Not subscribed and Coming soon | A lock for Not subscribed, a countdown for Coming soon. |
| Invoice "Partially refunded / Refunded" and service request "Rejected / Expired / Cancelled" are one row each in the spec | Split into separate states, since each has its own meaning and next step. |
| Website leads vs Sales' CRM leads use different pipelines | One pipeline (D-028). |
| The roadmap: the website shows Open / Planned / In progress / Shipped; ADM-28 has its own list | The website's four plus moderation states, in the Website Manager (D-029). |

## Decided at G0

1. **The banner priority above is approved** (D-026).
2. **Leads: one pipeline** (D-028). Website form leads go into Sales' CRM pipeline; the entity is `lead`, with *qualified* and *not a fit* added.
3. **Roadmap suggestions are moderated in the Website Manager** (D-029).
4. **Labels are written per viewer** where they differ (D-027): `label_*` is what OrgTik staff see, and `customer_label_*` what the customer sees (empty = the same).

## How it ships

It ships once, as status message keys plus `<StatusBadge entity state>` in `@orgtik/ui`. Every app then shows the same label, tone and icon for the same state.
