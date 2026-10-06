---
version: 1
slug: "app-shell-hq-office-page-tsx"
primary_target: "app/(shell)/hq/office/page.tsx"
related_targets: ["app/(shell)/hq/chat","app/(shell)/hq/meetings","app/guest"]
---

Scope: Somion HQ — the whole module (Office floor, Chat, Meetings, Insights, Settings, guest page, mobile). Visitor mode: Operate.

Audience: 5-50 person European company; team members, leads, admins and unregistered guests. Job: see who is around, talk in one action, and keep every conversation attached to the work it belongs to. Constraints: lives inside an existing suite shell; presence must never feel like surveillance; German text expands 30%; mock data only, no backend.

## Direction contract

THESIS: A suite module you can sit inside for eight hours. It refuses both category defaults — the grey sidebar with an aubergine accent, and the cold schematic floor diagram — by being warm and quiet enough to live in while making presence the loudest thing on screen.

OWN-WORLD: Warm daylight. Off-white paper ground, sand-toned hairline borders, generous rounding, one soft elevation, warm-neutral ink. Rooms are filled bays on a light floor; people are round tiles. The six presence hues are the only saturated colour anywhere — every other surface is achromatic warm neutral. Craft bar: Kumospace's warmth and roundness, Notion's calm and generosity, Linear's precision and micro-motion, Slack's chat conventions so nothing needs teaching.

STORY: The visitor sees who is around without reading, believes this is the same product as the other six modules, and reaches someone in one action.

FIRST VIEWPORT: Light shell — app switcher, top bar, status picker — then the Office fills the rest with a warm floor. Six rounded room bays sit on it, each labelled in small caps with occupancy set large beside the label. Twelve round member tiles rest in their bays; two in Room B carry a soft speaking ring, one carries the violet Focus lamp. A collapsed "This week" panel sits at the edge; the Catch up badge reads 3. The primary action is the tile itself — clicking a person opens Knock, Message, Profile inline, with no modal between seeing someone and talking to them.

SIGNATURE INTERACTION: One status change propagates across the entire field in a single authored motion — top bar, floor tile, chat sidebar and the assignee dot on the Task Manager screen move together, never as independent re-renders. Motion grammar: 200ms ease-out for tiles arriving and leaving, 350ms for movement across the floor, a knock pulse that runs exactly three times and stops, and nothing but opacity under reduced motion.

FORM: The category standard, played straight at full fidelity and without irony — the user took the standing exit deliberately after rejecting four art-directed worlds, on the grounds that this is a daily-use product. Seed key ef245979, kind canon.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
