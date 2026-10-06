# PM question packet 01

**Date:** 2026-09-29 · **From:** Yossef (UI/UX) with Claude (program lead) · **To:** the OrgTik PM

**Published page** (EN/AR toggle, copy-as-text): https://claude.ai/artifact/UkfBoRutr3zhETqj6T5egn. It is private until it's shared from the page's Share menu.

We're starting the suite program:
- a shared design system built from the new website's brand
- an internal Website Manager (CMS) connected to the website
- every dashboard reworked flow by flow
- then the Admin back-office and the customer dashboard

These ten questions unblock the first phases. They are ordered by urgency.

**How to answer:** reply under each question with a letter or a short note. Answers are copied word for word into our decision log. If a question has no answer after 5 working days, we proceed with our recommendation. We only do that for decisions that can be reversed later, never for money, tax or legal.

The Arabic version follows the English one.

---

## Q-004 · URGENT: credentials committed in the code, and tokens in URLs

**Context:** The zips we received contain secrets that should be treated as leaked:
- **Plaintext dev passwords:**
  - `task-manager-front-main/app/[locale]/auth/not-allowed/page.tsx` lines 21–26
  - `somion-hr-dashboard-main/app/[locale]/auth/not-allowed/page.tsx` lines 20–35
  - `sales-dashboardv2-main/mock/dev-auth.ts` lines 10–25
- **A hard-coded login token (JWT):** `content-dashboard-somion-main/app/[locale]/auth/not-allowed/page.tsx` line 7.
- **Access/refresh tokens passed in URLs:**
  - SOS `app/(dashboard)/content/page.tsx` line 109 and `systems/cms/[cmsId]/accounts/columns.tsx` line 105
  - Sales `SignInAsSalesman` and `SignInAsUserButton`
  - The launcher's `/auth?token=` hand-off, used by every app

**Ask:**
- Please have the dev team **rotate these credentials and invalidate that token now**.
- On the frontend we'll remove the dev-login pages and the tokens in URLs in Wave 1.
- For the backend we'll propose a one-time-code exchange.

**Needed by:** now. **Blocks:** nothing, but it is a live risk.

## Q-001 · The Requirements Document (22 Sep 2026)

**Context:** All seven spec files (OrgTik_00–06, v1.0) cite a "Requirements Document" dated 22 September 2026. For example, its section 6 covers the tools' own screens. It isn't among the files we received.

**Ask:** Please send it, and any later version.

**Why it matters:** Without it, the gap analysis for the existing tools has no baseline. We can only compare the tools against the SaaS-level stories.

**Needed by:** this week. **Blocks:** the tools' gap analysis.

## Q-002 · Upstream repositories and branches

**Context:**
- We received the tools as `-main` zip exports.
- The SOS docs show the team integrates on `dev`.
- We've put each zip into local git exactly as received, so our work can be replayed onto the real repos.

**Ask:**
- **(a)** Repo URLs for:
  - SOS, Task Manager, File Manager, Sales ("new-somion-sales"?), HR, Digital Marketing, Content ("new-somion-dashboard"?)
  - "tsheck-dashboard", which is listed in the sos-bar update script but was never sent
- **(b)** Which branch or commit each zip came from.
- **(c)** Read access and merge-request access for our changes.
- **(d)** Any freeze windows.

**Recommendation:** access to `dev`. We deliver small merge-request series per app, with codemods kept separate from behaviour changes.

**Needed by:** before Wave 1 (the Files pilot). **Blocks:** delivering any change upstream.

## Q-003 · Private registry and the launcher's source

**Context:**
- The design system will ship as `@orgtik/ui` on sdk.orgtik.org, next to `@somion/sos-bar`.
- We only have sos-bar's compiled output, not its source.
- Its `publishConfig` still points to the retired `sdk.somion.ch`.

**Ask:**
- **(a)** Publish rights for a new `@orgtik` scope on sdk.orgtik.org, or confirm we should publish under `@somion`.
- **(b)** The source repos for `@somion/sos-bar` and `@somion/gallery`.
- **(c)** Who owns their releases.

**Options:**
- **A)** A new `@orgtik` scope. *Recommended: it matches the brand.*
- **B)** Keep the `@somion` scope.

**Needed by:** the end of Phase 1 (library 1.0). The sos-bar source is needed before the shell work. **Blocks:** publishing the library; restyling the launcher properly rather than overriding it.

## Q-005 · Which tools exist, and what they are called

**Context:** Three lists disagree:

| Source | Tools |
|---|---|
| **Specs** | General (mandatory, free), Task Manager, Chat, File Manager, Email, Hosting. US-C-01 also says "all 8 tools". |
| **Website** (Software page) | HR, CRM, Files, Tasks, Marketing, Website Manager: six modules with CHF prices |
| **Apps we have** | SOS, Tasks, Files, Sales (CRM + customer portal), HR, Digital Marketing, Content, Chats |

**Ask:** What is the launch tool catalogue, with keys and EN/AR names? Which list is the source of truth?

**Recommendation:** One catalogue (the spec's ADM-03) drives the website's Software pages, the dashboard launcher and billing. We'll map every name in the glossary.

**Needed by:** CMS slice S2 (software content) and E0 (ADM/USR design). **Blocks:** the catalogue, the website's Software content, the launcher.

## Q-006 · Currency and markets at launch

**Context:**
- The website shows CHF prices, with the Swiss entity, the Belp address and "Made in Switzerland".
- Spec 03 requires zone-based multi-currency prices resolved by the server (for example EGP, SAR, and KWD with 3 decimals).
- The Sales app has its own display-only currency conversion, which conflicts with spec 03.

**Ask:** Which markets and currencies launch first? What should the website show until the ADM pricing exists?

**Options:**
- **A)** Keep CHF as "indicative" prices on the website and switch to server prices when ADM pricing ships. *Recommended.*
- **B)** Show "Contact us for pricing" now.
- **C)** Show zone prices now. This needs ADM pricing first.

**Needed by:** CMS slice S2 (pricing display) and E0. **Blocks:** pricing content and the ADM pricing design.

## Q-007 · Languages: register, variants, reviewers, and the bilingual field

**Context:** All dashboards and the CMS will support EN, AR, DE, FR and IT, with right-to-left layout for Arabic.

**Ask:**
- **(a)** Arabic register for all UI, emails and PDFs. The specs quote Egyptian dialect; we recommend Modern Standard Arabic, so it works for the whole Arab region.
- **(b)** German: Swiss German conventions (de-CH: "ss" instead of "ß", CHF formats), or de-DE?
- **(c)** Who reviews and approves the DE, FR, IT and AR copy?
- **(d)** The spec's "Text AR/EN" field shows two inputs side by side. With five languages we propose **tabs with a completeness badge per language**: EN and AR required; DE, FR and IT may fall back until translated. Is that OK?

**Recommendation:** (a) MSA · (b) de-CH · (c) a named reviewer per language · (d) yes.

**Needed by:** Phase 1 (the library's localized field) and the glossary. **Blocks:** copy, and the localized-field pattern.

## Q-008 · App boundaries for the SaaS core

**Context:**
- The spec's Admin back-office (ADM-01…33) and customer dashboard (USR-00…27) don't exist as apps yet.
- Sales already has plan management, coupons, packages, subscriptions, invoices and tickets, but with a different model from spec 03.
- SOS owns login, people and each person's roles per tool. It also has a 1:1 chat that duplicates Chats.

**Ask:** Do you agree that:
- **(a)** ADM becomes a new app (cross-tenant staff tool, 2FA, 8 staff roles)?
- **(b)** The customer dashboard (USR) grows out of SOS?
- **(c)** Sales stays a CRM, and its plan, coupon, invoice and ticket modules retire once ADM and USR ship?
- **(d)** SOS's 1:1 chat retires in favour of Chats?

**Recommendation:** yes to all four.

**Needed by:** Wave 1 (SOS) and E0. **Blocks:** the scope of SOS and Sales.

## Q-009 · Open spec gaps that decide what ADM and USR show

**Context:** These are still marked Open in file 00:

| Gap | Topic | Our recommendation |
|---|---|---|
| G-04 | Seat billing | Option B, as recommended in our UX readout |
| G-12 | Tax and legal entities | Please decide |
| G-18 | Add-ons and credits | Please decide |
| G-21 | What General's paid plans unlock | Please decide |
| G-24 | Hosting and email infrastructure spec | Please decide |
| G-28 | Who owns mailboxes | Please decide |

**Ask:** Please decide each one. Until you do, we design ADM/USR with each rule as a switch, so the UI doesn't have to be redone.

**Needed by:** E0 (the start of ADM/USR design). G-04 and G-12 are needed before E2 (pay and renew). **Blocks:** ADM and USR screens that show plans, prices, taxes and mailboxes.

## Q-010 · Website: governance and SEO switches

**Context:** We'll connect the website to the new CMS **without any visual change**. We'll also fix its SEO plumbing: real URLs instead of `#/` links, meta tags per page, a sitemap, and redirects. Then we'll add languages.

**Ask:**
- **(a)** May we update the website's `AGENTS.md` rules? Today they forbid translating content or changing direction and routing, and require forms to stay previews.
- **(b)** Keep the site `noindex` until its content is approved (client claims, testimonials, legal text, prices). Who approves each of those?
- **(c)** Canonical URL: keep `/software`, and redirect `/platform` to it?
- **(d)** Arabic on the website means the same design mirrored for right-to-left. Do you approve that in principle, subject to a design review?

**Recommendation:** yes · keep `noindex` · `/software` · yes.

**Needed by:** (a) CMS slice S1 · (b, c) S3 · (d) S5.

---
---

# حزمة أسئلة للـ PM رقم 01

**التاريخ:** 2026-09-29 · **من:** يوسف (UI/UX) مع Claude (قائد البرنامج) · **إلى:** الـ PM بتاع OrgTik

إحنا بادئين البرنامج:
- ديزاين سيستم واحد مبني على هوية الويبسايت الجديد
- Website Manager (CMS داخلي) متوصّل بالويبسايت
- كل الداشبوردات هنعيد شغلها flow بعد flow
- وبعد كده الـ Admin back-office والـ Customer dashboard

العشر أسئلة دول بيفكّوا أول المراحل، ومترتبين حسب الاستعجال.

**إزاي ترد:** اكتب ردك تحت كل سؤال، حرف الاختيار أو ملاحظة قصيرة. هننقل ردك زي ما هو في سجل القرارات. لو سؤال فضل من غير رد 5 أيام عمل، هنمشي بتوصيتنا، بس في القرارات اللي ينفع نرجع فيها بعدين. عمرنا ما هنعمل كده في حاجة ليها علاقة بالفلوس أو الضرايب أو القانون.

---

## Q-004 · عاجل: باسووردات جوه الكود، وتوكنز في الـ URLs

**السياق:** الـ zips اللي وصلتنا فيها أسرار لازم نعتبرها اتسرّبت:
- **باسووردات dev مكتوبة صريحة:**
  - `task-manager-front-main/app/[locale]/auth/not-allowed/page.tsx` السطور 21–26
  - `somion-hr-dashboard-main/app/[locale]/auth/not-allowed/page.tsx` السطور 20–35
  - `sales-dashboardv2-main/mock/dev-auth.ts` السطور 10–25
- **توكن تسجيل دخول (JWT) متثبّت في الكود:** `content-dashboard-somion-main/app/[locale]/auth/not-allowed/page.tsx` السطر 7.
- **access/refresh tokens بتتبعت في الـ URL:**
  - SOS: `app/(dashboard)/content/page.tsx` السطر 109 و`systems/cms/[cmsId]/accounts/columns.tsx` السطر 105
  - Sales: `SignInAsSalesman` و`SignInAsUserButton`
  - الـ hand-off بتاع الـ launcher `/auth?token=`، ودي في كل الأبلكيشنز

**المطلوب:**
- فريق الـ dev **يغيّر الباسووردات دي ويلغي التوكن ده دلوقتي**.
- من ناحية الفرونت، هنشيل صفحات الـ dev login والتوكنز اللي في الـ URLs في Wave 1.
- من ناحية الباك إند، هنقترح إن الدخول يبقى بـ one-time code بدل التوكن.

**محتاجينه:** دلوقتي. **بيعطّل:** ولا حاجة، بس ده خطر قايم.

## Q-001 · مستند المتطلبات (22 سبتمبر 2026)

**السياق:** كل ملفات السبك السبعة (OrgTik_00–06 نسخة 1.0) بتحيل على "Requirements Document" بتاريخ 22 سبتمبر 2026. مثلاً القسم 6 بتاعه بيغطي شاشات التولز نفسها. المستند ده مش من ضمن الملفات اللي وصلتنا.

**المطلوب:** تبعتهولنا، هو وأي نسخة أحدث منه.

**ليه مهم:** من غيره الـ gap analysis بتاعة التولز الموجودة مالهاش مرجع، وهنقدر نقارنها بالـ user stories بتاعة الـ SaaS بس.

**محتاجينه:** الأسبوع ده. **بيعطّل:** الـ gap analysis بتاعة التولز.

## Q-002 · الريبوهات الأصلية والـ branches

**السياق:**
- التولز وصلتنا zips من الـ `main`.
- دوكيومنتات SOS بتقول إن الفريق شغال على `dev`.
- حطينا كل zip في git عندنا زي ما وصل بالظبط، علشان نقدر نركّب شغلنا على الريبوهات الحقيقية بعدين.

**المطلوب:**
- **(أ)** روابط الريبوهات دي:
  - SOS و Task Manager و File Manager و Sales ("new-somion-sales"؟) و HR و Digital Marketing و Content ("new-somion-dashboard"؟)
  - "tsheck-dashboard"، اللي مذكور في سكريبت تحديث sos-bar بس عمره ما اتبعت
- **(ب)** كل zip طالع من أنهي branch أو commit.
- **(ج)** صلاحية قراءة وصلاحية merge requests لشغلنا.
- **(د)** لو فيه فترات تجميد.

**توصيتنا:** صلاحية على `dev`. هنسلّم merge requests صغيرة لكل أبلكيشن، والـ codemods لوحدها بعيد عن تغييرات السلوك.

**محتاجينه:** قبل Wave 1 (الـ pilot بتاع Files). **بيعطّل:** إننا نسلّم أي تغيير على الريبوهات الأصلية.

## Q-003 · الـ registry والكود الأصلي للـ launcher

**السياق:**
- الديزاين سيستم هيتنشر كـ `@orgtik/ui` على sdk.orgtik.org، جنب `@somion/sos-bar`.
- إحنا معانا بس الـ build بتاع sos-bar، مش الكود الأصلي.
- الـ `publishConfig` بتاعه لسه بيشاور على `sdk.somion.ch` اللي اتقفل.

**المطلوب:**
- **(أ)** صلاحية نشر لـ scope جديد `@orgtik` على sdk.orgtik.org، أو تأكيد إننا ننشر تحت `@somion`.
- **(ب)** ريبوهات الكود الأصلي لـ `@somion/sos-bar` و`@somion/gallery`.
- **(ج)** مين مسؤول عن إصداراتهم.

**الاختيارات:**
- **A)** scope جديد `@orgtik`. *دي توصيتنا، علشان ماشية مع البراند.*
- **B)** نفضل على `@somion`.

**محتاجينه:** آخر Phase 1 (إصدار 1.0 من المكتبة). والكود الأصلي لـ sos-bar محتاجينه قبل شغل الـ shell. **بيعطّل:** نشر المكتبة، وإننا نعيد تصميم الـ launcher صح بدل ما نغطّي على الستايل بتاعه.

## Q-005 · إيه التولز الموجودة وأساميها إيه

**السياق:** عندنا تلات قوايم مش متفقة:

| المصدر | التولز |
|---|---|
| **السبك** | General (إجباري ومجاني)، Task Manager، Chat، File Manager، Email، Hosting. وكمان US-C-01 بيقول "كل الـ 8 تولز". |
| **الويبسايت** (صفحة Software) | HR، CRM، Files، Tasks، Marketing، Website Manager: ست موديولات بأسعار بالفرنك |
| **الأبلكيشنز اللي معانا** | SOS، Tasks، Files، Sales (CRM وبورتال للعميل)، HR، Digital Marketing، Content، Chats |

**المطلوب:** إيه كتالوج التولز وقت الإطلاق، بالـ keys والأسامي بالإنجليزي والعربي؟ وأنهي قايمة هي المرجع؟

**توصيتنا:** كتالوج واحد (ADM-03 في السبك) هو اللي يشغّل صفحات Software في الويبسايت، والـ launcher في الداشبورد، والفواتير. وهنربط كل الأسامي ببعض في القاموس.

**محتاجينه:** CMS slice S2 (محتوى الـ Software) و E0 (تصميم ADM/USR). **بيعطّل:** الكتالوج، ومحتوى الـ Software في الويبسايت، والـ launcher.

## Q-006 · العملة والأسواق وقت الإطلاق

**السياق:**
- الويبسايت بيعرض أسعار بالفرنك السويسري، ومعاها الكيان السويسري وعنوان Belp و"Made in Switzerland".
- السبك 03 عايز أسعار حسب الـ zone وبأكتر من عملة، والسيرفر هو اللي يحسبها (زي EGP و SAR، و KWD بتلات أرقام عشرية).
- أبلكيشن Sales فيه تحويل عملة للعرض بس، وده متعارض مع السبك 03.

**المطلوب:** أنهي أسواق وعملات هتنزل الأول؟ والويبسايت يعرض إيه لحد ما تسعير الـ ADM يجهز؟

**الاختيارات:**
- **A)** نفضل عارضين الأسعار بالفرنك كأسعار "استرشادية" على الويبسايت، ونحوّل لأسعار السيرفر أول ما تسعير الـ ADM يجهز. *دي توصيتنا.*
- **B)** نكتب "كلمنا عشان السعر" من دلوقتي.
- **C)** نعرض أسعار الـ zones من دلوقتي، ودي محتاجة تسعير الـ ADM الأول.

**محتاجينه:** CMS slice S2 (عرض الأسعار) و E0. **بيعطّل:** محتوى الأسعار وتصميم التسعير في الـ ADM.

## Q-007 · اللغات: مستوى العربي، ونوع الألماني، ومين يراجع، وخانة اللغتين

**السياق:** كل الداشبوردات والـ CMS هيدعموا EN و AR و DE و FR و IT، والعربي هيبقى من اليمين للشمال.

**المطلوب:**
- **(أ)** مستوى العربي في كل الـ UI والإيميلات والـ PDFs. السبك مكتوب فيه أمثلة بالمصري، وإحنا بنقترح العربية الفصحى المبسطة، علشان تمشي مع المنطقة العربية كلها.
- **(ب)** الألماني: قواعد سويسرا (de-CH: "ss" بدل "ß" وتنسيقات الفرنك)، ولا de-DE؟
- **(ج)** مين هيراجع ويعتمد النصوص بالألماني والفرنساوي والإيطالي والعربي؟
- **(د)** خانة "Text AR/EN" في السبك فيها مكانين جنب بعض. ومع خمس لغات بنقترح **tabs فيها علامة اكتمال لكل لغة**: الإنجليزي والعربي إجباري، والباقي يرجع للإنجليزي لحد ما يتترجم. ينفع كده؟

**توصيتنا:** (أ) فصحى مبسطة · (ب) de-CH · (ج) مراجع باسمه لكل لغة · (د) آه.

**محتاجينه:** Phase 1 (خانة اللغات في المكتبة) والقاموس. **بيعطّل:** النصوص، وشكل خانة اللغات.

## Q-008 · حدود الأبلكيشنز في قلب الـ SaaS

**السياق:**
- الـ Admin back-office (ADM-01…33) والـ Customer dashboard (USR-00…27) لسه مالهمش أبلكيشنز.
- Sales فيه إدارة خطط وكوبونات وباقات واشتراكات وفواتير وتذاكر، بس بموديل مختلف عن السبك 03.
- SOS هو المسؤول عن الدخول والناس وصلاحيات كل واحد في كل تول، وفيه كمان شات 1:1 مكرر مع Chats.

**المطلوب:** موافق إن:
- **(أ)** ADM يبقى أبلكيشن جديد (أداة للستاف على كل العملاء، بـ 2FA و8 أدوار)؟
- **(ب)** الـ Customer dashboard يطلع من SOS؟
- **(ج)** Sales يفضل CRM، وموديولات الخطط والكوبونات والفواتير والتذاكر اللي فيه تتقفل أول ما ADM و USR ينزلوا؟
- **(د)** الشات 1:1 اللي في SOS يتقفل ويتنقل لـ Chats؟

**توصيتنا:** آه على الأربعة.

**محتاجينه:** Wave 1 (SOS) و E0. **بيعطّل:** نطاق SOS و Sales.

## Q-009 · الـ gaps المفتوحة في السبك اللي بتحدد ADM و USR هيعرضوا إيه

**السياق:** دول لسه Open في الملف 00:

| الـ Gap | الموضوع | توصيتنا |
|---|---|---|
| G-04 | حساب الاشتراك بعدد المستخدمين (seats) | الاختيار B، زي ما اقترحناه في الـ UX readout |
| G-12 | الضرايب والكيانات القانونية | محتاجين قرارك |
| G-18 | الإضافات والرصيد (add-ons and credits) | محتاجين قرارك |
| G-21 | الخطط المدفوعة في General بتفتح إيه | محتاجين قرارك |
| G-24 | سبك البنية التحتية للاستضافة والإيميل | محتاجين قرارك |
| G-28 | مين صاحب صناديق البريد (mailboxes) | محتاجين قرارك |

**المطلوب:** تقرر كل واحد فيهم. ولحد ما تقرر، هنصمم ADM و USR بحيث كل قاعدة تبقى زي مفتاح نقدر نغيّره، علشان الـ UI مايتعملش من الأول.

**محتاجينه:** E0 (بداية تصميم ADM/USR). و G-04 و G-12 محتاجينهم قبل E2 (الدفع والتجديد). **بيعطّل:** شاشات ADM و USR اللي بتعرض الخطط والأسعار والضرايب والـ mailboxes.

## Q-010 · الويبسايت: مين يعتمد، ومفاتيح الـ SEO

**السياق:** هنوصّل الويبسايت بالـ CMS الجديد **من غير أي تغيير في الشكل**. وهنصلّح الـ SEO بتاعه: URLs حقيقية بدل لينكات `#/`، و meta tags لكل صفحة، و sitemap، و redirects. وبعدها هنضيف اللغات.

**المطلوب:**
- **(أ)** نقدر نعدّل قواعد ملف `AGENTS.md` بتاع الويبسايت؟ النهارده بيمنع ترجمة المحتوى أو تغيير الاتجاه والـ routing، وبيقول الفورمز تفضل preview بس.
- **(ب)** نسيب الموقع `noindex` لحد ما محتواه يتعتمد (كلام العملاء، والـ testimonials، والنصوص القانونية، والأسعار). مين يعتمد كل حاجة فيهم؟
- **(ج)** الـ URL الأساسي: نفضل على `/software` ونعمل redirect من `/platform` ليه؟
- **(د)** العربي على الويبسايت معناه نفس الديزاين بالظبط بس معكوس من اليمين للشمال. موافق مبدئياً، بشرط مراجعة ديزاين؟

**توصيتنا:** آه · نسيبه `noindex` · `/software` · آه.

**محتاجينه:** (أ) CMS slice S1 · (ب، ج) S3 · (د) S5.
