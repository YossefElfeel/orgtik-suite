# A28 — connected people, sales, website and Files prototype flows

2026-10-08. PR32 merged validated main `4d7fd2c` after CI `37782672029` and deployment-pause checks `37782671991` passed, including Windows library visuals. A27 preserves its initial pending snapshot.

The next coherent package connects HR onboarding checklists and Sales follow-ups to assigned Tasks records, WM accepted form samples to OrgTik's CRM with Partners attribution, and versioned workspace Files records to the new Tasks/Chats presentation screens. Shared search includes these Files records; sharing can create simulated suite notices. The memory bridge remains separate from accounts, invoices, actual CMS content and the shared clock. Bot-form samples do not create CRM leads.

Chats adds editable scheduled date/time with timezone, italic/bullet formatting and a file-reference preview/unavailable state. References preserve their selected record/version; previews currently require the bridge's current version. Historical-version preview expansion remains a limitation. Sales adds a live-value simulated quotation print view, with browser Save as PDF. No external signature, payment, media or arbitrary upload provider is connected.

Local evidence: 15 connected walkthrough checks and eight EN/AR light/dark 1440/390 captures; 10 focused Chats checks and four Sales connector/quotation checks. All 20 consumer type/catalog tasks passed across the bounded run and the Tasks-only retry after a local process resource exit. New connected captures check overflow, not a fresh axe audit; prior library/accessibility evidence remains separate. No new backend/security tests were added. [Package evidence](../audits/prototype-handoffs/README.md).

[The 72-feature map](../prototype-feature-map.md) and [15 journey scripts](../prototype-journeys.md) make retained implementations and pending final acceptance explicit. Richer Sales import/stage editing, billing scenes, shared reuse and final journey acceptance remain open. Integration CI is pending for this package; Vercel stays paused.

بالمصري: الـ CMS خلص واتحافظ عليه. التوصيلات الجديدة اتراجعت محليًا: تهيئة الموظف ومتابعة المبيعات بيظهروا في Tasks، فورم WM بيظهر بمصدره في CRM بتاع OrgTik، والملفات بتتربط بسجل وإصدار ومساحة واضحة. فيه ٨ لقطات عربي/إنجليزي وثيمين وموبايل/ديسكتوب، لكن ده مش إعلان إن كل الـ٧٢ ميزة والـ١٥ رحلة خلصوا. قبول الحزمة وباقي الرحلات لسه بيتراجعوا، والنشر متوقف.
