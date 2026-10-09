<!-- Maintained execution copy of the owner-designated plan. -->

**Continuation instruction — 2026-10-09:** The owner said “continue till finish” after P0. Proceed through P1–P5 and review the required visual/functional evidence without further intermediate approval stops. [Progress](v3-progress.json) records each package and its actual evidence. P0 merged through PR46 as main `e82c1e9` after green CI. Online deployment remains paused and still needs a separate explicit instruction.

**Current checkpoint — 2026-10-09:** P0 prepared on `feat/suite-v3-p0` from refreshed `origin/main` `c7c7e1f`. Review [the Egyptian Arabic report](v3-report.html), [A37](phase-f/amendment-A37.md), [feasibility](v3-feasibility.md), and D-075–D-080. P0 report review is pending; P1 specimens/G-DS1 and P2 Storybook/G-DS2 are pending. Tier A/B are approved scope. Existing runtime and website design are unchanged by P0; deployment remains paused.

This copy is maintained in the repository. Audit counts below come from the supplied plan unless the report explicitly records source verification. Historical implementation acceptance is preserved; `backlog.csv` links old findings to release packages with qualified current statuses. A zero-pixel website design comparison uses equal content fixtures; intentional catalog text/price changes are verified separately.

---
# OrgTik — خطة v3: إيكوسيستم مرن + ديزاين سيستم premium + سد فجوات الـ flows

> التحليل اتعمل يوم 2026-10-09 على `origin/main` `c7c7e1f` (PR #45). اتراجع الكود في 3 محاور، ومعاها لقطات حقيقية من `program/audits/**`.

## Context
- **الطلب (2026-10-09):** تحليل المشروع كله من منظور Senior UI/UX، وتطلع منه الفجوات في الـ flows، والميزات الناقصة اللي تقوّي السيستم.
  - كل أداة لازم تشتغل لوحدها، وتتربط بالباقي كإيكوسيستم حسب اشتراك العميل: أداة واحدة، أو أكتر، أو كله.
  - الديزاين سيستم يتطوّر لمستوى premium، والسويت كلها تتبني على سيستم واحد متّسق.
  - الويبسايت ما يتغيرش.
- **طبيعة الشغل:** بروتوتايب front-end على mock data (D-073 مستمر): مفيش شغل أمان ولا باك إند حقيقي.
- **ليه دلوقتي:** البروتوتايب "كامل على الورق": 72 ميزة و 15 رحلة. بس التحليل طلّع إن معظمه مستخبي ورا صفحات عرض بترجع 404 في الـ build العادي.
  - الأدوات مش عارفة بعض.
  - الشكل متفاوت بين التطبيقات، ومش premium.
- **النتيجة المطلوبة في الآخر:**
  - سويت واحد بـ DS v2 premium.
  - كل أداة تشتغل لوحدها، وتتربط بالباقي حسب الاشتراك.
  - كل الميزات في الشاشات الحقيقية.
  - الـ CRM مصدر خطط الخدمات للويبسايت.
  - Console مستقل للأدوات، و Admin جوه كل أداة.
  - تقرير للـ PM والفريق.

## قرارات المستخدم النهارده
1. **إيكوسيستم تكيّفي:**
   - عميل عنده أداة واحدة يدخل عليها مباشرة.
   - عميل عنده أداتين أو أكتر يظهر له OrgTik Home موحّد.
   - أي ربط بين أداتين يظهر بس لما الاتنين يكونوا مشتركين.
2. **دمج ميزات `/presentation` في الشاشات الحقيقية.** صفحات العرض تتشال من الـ nav، ويفضل Demo Panel للحالات بس.
3. **DS v2 = تطوير نفس البراند:**
   - البراند يفضل زي ما هو: البنفسجي، الـ rail الغامق، ومونتسرات للعناوين.
   - المطلوب: خط UI حقيقي بدل Arial، ورماديات بطبقات، و borders وظلال رفيعة، وكثافة أعلى، و motion، و toolbars وجداول premium.
4. **Radius هجين (تعديل على D-022):**
   - **Pills:** الأزرار الأساسية، والـ chips، والـ segmented.
   - **8–10px:** الـ inputs، وأزرار الجداول، والـ toolbars.
5. **خطط الخدمات اللي على الويبسايت مصدرها CRM dashboard** (`apps/sales`).
   - الويبسايت شكله ما يتغيرش.
   - التغيير الوحيد المسموح هو ربط طبقة البيانات (`purchase-catalog.js`)، ولازم نثبت إن الشكل ما اتغيرش بالـ pixel parity harness.
6. **الـ SaaS tools، وكل اللي محتاجاه عشان تتدار، ليها dashboard مستقل.** ده بيتنفذ على مستويين:
   - **Console داخلي لفريق OrgTik:** ده `apps/admin` بعد ما يتركّز على الأدوات بس.
   - **Admin جوه كل أداة لأدمن العميل.**

---

## 1. نتيجة التحليل — الإيكوسيستم (standalone + connected)

**اللي شغال كويس، ونبني عليه:**
- **الوصول للأدوات حقيقي من الاشتراك** (D-068):
  - السلسلة هي: `workspace.lines[]` ← `toolGrants` ← `resolveWorkspaceContext()` (`mock/lib/workspace-context.js`).
  - الـ rail بيخفي أي أداة الـ workspace مش مشترك فيها.
  - `/go/<app>` بيعيد فحص الوصول، و API كل أداة بيرجّع 403 لو مفيش وصول و 423 لو الـ workspace read-only.
- **الروابط الحقيقية بين الأدوات أربعة بس:**
  - مراجع Files في Tasks و Chats.
  - الـ whiteboards متخزنة في Files.
  - إجازات HR ظاهرة في كاليندر Tasks و Chats.
  - التعيين والـ offboarding في HR بيأثروا على عضوية الـ workspace وملكية السجلات.
- **مقاعد لكل أداة** (D-061)، وفيه trial لكل أداة.

**الفجوات (مرتّبة):**

| # | الفجوة | الدليل | الخطورة |
|---|---|---|---|
| E1 | مفيش طبقة تعرف الـ workspace مشترك في أنهي أدوات، ولا أي ميزة بين أداتين محتاجة إيه. | "Attach from Files" ظاهر دايمًا ولو مفيش Files بيطلع "permissions" غلط (`apps/tasks/components/task/TaskAttachments.tsx`). "New board" بيختفي من غير تفسير. روابط HR→Tasks مش متفحوصة. إجازات HR بتظهر حتى لو HR مش مشترَك. | S1 |
| E2 | أغلب رحلات الإيكوسيستم موجودة كـ demo بس. | المهمة من الشات، والـ onboarding→Tasks، والـ follow-up في Sales→Task، والـ attribution، والـ won→workspace، والجرس، و ⌘K، ونقل التفضيلات: كلها ماشية على `demoRequest` / `mock/lib/presentation.js`. | S1 |
| E3 | مفيش "اربط/ضيف أداة" في لحظة الاحتياج، ولا "اطلب access" لغير الـ owner. | الأدوات عمرها ما بتودّي على `/tools`، ورسالة "Ask the owner" ثابتة. | S1 |
| E4 | عميل الأداة الواحدة بيدخل على الـ Hub مش على الأداة، ومفيش onboarding لكل أداة. | الويبسايت ما بيبعتش `redirect` (`suite-session.js`). الـ wizard موجود في الـ presentation بس. HR بيبدأ فاضي والـ owner مش موظف فيه. | S2 |
| E5 | حالة الفوترة مش باينة جوه الأدوات. | البانرات في SOS بس، ومفيش تطبيق بيتعامل مع 423. | S2 |
| E6 | الناس متخزنين في كذا قائمة، ومفيش contacts/companies موحّدين. | موظفي HR، و staff في Sales، و fixture Chats، ومستخدمي WM. وكل من Sales و Marketing و WM عنده leads/contacts خاصة بيه. | S2 |
| E7 | التنقل مش واحد بين التطبيقات. | كود الـ rail متكرر في كل app (`components/suite/useSuiteApps.tsx`). رابط Home غالبًا بيودّي 404 (SOS من غير locale). مفيش workspace ظاهر جوه الأدوات. لينك الـ profile مختلف من تطبيق للتاني. الثيم محفوظ لكل host لوحده. | S2 |
| E8 | إلغاء أداة: مفيش export ولا تحذير بأثره على باقي الأدوات. | `lifecycle.js`، ونص الإلغاء في `apps/sos/messages/usr/en/billing.json`. | S2 |
| E9 | HR Projects مكسورة غالبًا (token غلط ونسخة projects منفصلة). | `apps/hr/redux/app/baseProjectApi.ts:5`، `mock/apps/hr/seed.js:714`. | S2 |
| E10 | الـ lead اللي جاي من الويبسايت ما بيوصلش Sales في وضع الـ workspace. | `crm_intake_pending` (`mock/apps/wm.js`). | S2 |
| E11 | حدود الخطط بتتسعّر بس ما بتتطبّقش ولا بتظهر جوه الأدوات. | usage موجود في Tasks و Files ومحدش بيقراه. | S3 |
| E12 | سياستين باقات، و Chats مش بيتباع على الويبسايت، والأسماء مش ثابتة (CRM/Sales، Chat/Chats). | `seed-website-offers.js`، `app-api.js:163`. | S3 |
| E13 | إدارة الأداة من جواها محدودة: الأدوار بتتظبط من SOS Team، وبس Tasks و Files يقدروا يديروا أدوارهم من جوه. | `workspace-commands.js:4-7`. | S2 |

---

## 1ب. نتيجة التحليل: الديزاين سيستم والاتساق

**الوضع الحالي:** `@orgtik/ui` 1.0.0-rc.12، فيه حوالي 83 export. كل الـ 9 تطبيقات بتستخدم `SuiteShell`.

**إيه اللي مخلّيه يبان قديم ومش premium (مرتّب):**
1. **Sales و HR لسه فيهم كيتين shadcn شغالين:** 71 ملف kit، و 268 ملف بيستوردوا منهم.
   - في Sales: أزرار `rounded-lg` مش pills، و focus ring مزدوج، و `text-green-500`.
   - في Sales: اتنين Toaster في نفس الوقت (`apps/sales/app/[locale]/layout.tsx`).
   - في HR: Table و StatusBadge و MainHeader خاصين بيه، ومش بيستخدم DataTable ولا PageHeader بتوع المكتبة.
2. **خط النص اللاتيني هو Arial.** الـ stack هو IBM Plex Sans Arabic ← Arial، ومونتسرات للعناوين. الأخ اللاتيني الطبيعي للخط العربي هو IBM Plex Sans.
3. **العمق مرسوم بالـ borders:**
   - shadow levels اتنين بس.
   - borders الكنترولز `#8E7FA0` تقيلة.
   - الكروت flat.
   - الجدول عبارة عن "صناديق جوه صناديق".
   - ولغة العمق بتاعة الويبسايت ما اتنقلتش: الـ glows، والـ inset highlight، والـ focus halo الناعم.
4. **كل حاجة متلوّنة بنفسجي:**
   - الـ canvas `#F6F1FA`.
   - الـ neutral الوحيد هو mauve.
   - الدارك بنفسجي-أسود مشبّع.
   - مفيش رمادي محايد خالص.
5. **مفيش layout/spacing/z-index tokens ولا density:**
   - عرض المحتوى متفاوت: 1152 / 1280 / 1400 / 1600 / full.
   - فيه 3 أشكال page header متنافسة: band رمادي في HR، و `PageHeader` المكتبة، و `hq-title` في Chats.
6. **الـ motion ضعيف:**
   - skeleton بـ pulse.
   - hover بيغيّر اللون بس، ومفيش press feedback.
   - **bug:** الـ hover على الزرار الأساسي في الدارك مش باين (الفرق حوالي 0.005 OKLab).
7. **أنماط متكررة:**
   - 5 notification UIs.
   - 4 أنظمة toast.
   - 4 كروت KPI بأحجام 20–34px.
   - 3 avatar stacks.
   - حوالي 8 activity feeds.
   - كود الـ rail متنسخ 9 مرات.
   - الـ slot اللي في بداية الـ top bar مستخدم بـ 7 طرق مختلفة.
   - جرسين في نفس الهيدر.
8. **Chats ستايله لوحده:** 932 inline style، و 536 قيمة px عشوائية، وأسماء tokens خاصة بيه.
   - **بس هو أغنى مصدر premium عندنا:** 4 ظلال بطبقات، و `--shadow-lit`، و press state، و shimmer، و nav progress. نرقّيهم للمكتبة.
9. **مكوّنات premium ناقصة:**
   - Toolbar/FilterBar، و saved views، و column chooser، و density.
   - inline edit، و inspector/split view.
   - ⌘K حقيقي (موجود في الديمو بس)، و NotificationCenter.
   - Activity/Timeline، و CommentThread.
   - Rich text: الموجود stub من 14 سطر.
   - TagInput، و AvatarGroup، و Kbd.
   - Onboarding checklist، و Upsell/Connect card، و Workspace/Tool switcher.
   - KPI بـ sparkline.
10. **الداتا فيز والحالات:**
    - `viz-1..8` ألوان Tailwind 700 عامة، مش مربوطة بالبراند، وبتتخانق مع ألوان الحالات.
    - `check-viz.mjs` مش في الـ CI.
    - فيه badges محلية بتختار الألوان بالإيد.
11. **Storybook:**
    - 46 story و 270 baseline (`apps/docs/tests/check.mjs`) بتتفحص pixel + axe في CI.
    - ناقص stories لـ Skeleton و Breadcrumb و Stepper و TopBar و DemoPanel ومكوّنات `src/prototype/*`.

**اللي نحتفظ بيه:**
- خط الـ tokens: JSON ← `--ot-*`، و TS، و Tailwind theme.
- الـ surface roles.
- أزواج الألوان المفحوصة contrast.
- مقاييس العربي (`:lang(ar)`).
- Base UI والـ RTL.
- الـ status matrix: 15 كيان و 94 حالة (`packages/ui/src/status/matrix.ts`).
- غلاف الـ charts.
- DataTable، و States، و Board، و CalendarGrid.
- بوابة Storybook.
- اعتماد نضيف على المكتبة في SOS و Tasks و Files و Marketing و WM و Admin.

**ملاحظات بصرية من اللقطات الحقيقية** (`program/audits/**`):
- صفحات `/presentation` جوه الـ sidebar الحقيقي.
- الفلاتر شكلها فورم: labels فوق selects بدل toolbar.
- مودالات عملاقة لفورمز طويلة بدل sheet/inspector.
- التاريخ في الدارك العربي native و US format (`10/15/2026`).
- العناوين Title Case و Sentence case مخلوطين.
- شريط "Simulated" مكرر في أكتر من مكان.
- لون progress بني خارج الـ palette في صفحة الحساب.
- dialog في HR أزراره مش pills وفيه divider منقّط بنفسجي.

## 2. المعمارية المستهدفة — مين بيدير إيه

### 2.1 أربع لوحات إدارة، وكل واحدة ليها مسؤولية واضحة

| اللوحة | المستخدم | بتدير إيه | علاقتها بالويبسايت |
|---|---|---|---|
| **CRM** (`apps/sales`) | فريق مبيعات وخدمات OrgTik | **كتالوج الخدمات** وخططها. **Pipeline:** leads، deals، customers، offers. **التسليم:** طلبات الخدمة (بتتنقل من ADM)، والـ projects. **الفريق والمكافآت.** | **مصدر خطط الخدمات وأسعارها:** الخدمات، والخطط، والمدد، والباقات، والأسعار لكل zone. |
| **SaaS Console** (`apps/admin` بعد ما يتركّز) | فريق المنصة | **الأدوات:** دورة حياتها (coming soon → beta → live). **الكتالوج:** خطط كل أداة وميزاتها وحدودها، والأسعار، والـ zones، والعملات، والضرايب، والـ gateways. **العملاء:** الـ workspaces، والاشتراكات، والمقاعد، والاستخدام، والفوترة (dunning، credit notes، pay links)، والدعم، و View-as. **الإيكوسيستم:** الـ connectors، والإطلاقات، والـ changelog، والإعلانات. **النظام:** التقارير، و SaaS metrics، والـ staff، والـ audit. | **مصدر خطط الأدوات (software) وأسعارها.** |
| **Website Manager** (`apps/wm`) | فريق المحتوى | محتوى الويبسايت: الصفحات، والنصوص، والميديا، والـ SEO. | **الكلام بس، مش الأسعار.** المرايات للقراءة بس، وكل واحدة مكتوب عليها "Managed in CRM" أو "Managed in SaaS Console" ومعاها deep link. |
| **Admin جوه كل أداة** | أدمن العميل | الأعضاء والمقاعد في الأداة دي، وأدوارها، وإعداداتها، والربط مع الأدوات التانية، وخطتها واستخدامها، والـ export/import، والـ audit بتاعها. | — |

- **الأساسيات المشتركة** في الـ Console، والـ CRM بيقراها:
  - الهوية والحسابات.
  - الـ zones والعملات والضرايب.
  - الـ gateways.
  - الـ staff والأدوار.
- **البيانات كلها في نفس الـ mock store.** التقسيم بيحدّد مين يملك شاشة الإدارة بس.

**القرارات الجديدة** (تتكتب في `program/decisions/`):

| القرار | المحتوى |
|---|---|
| **D-075** | إيكوسيستم تكيّفي، و `ConnectedFeature` بـ 4 حالات، وممنوع أي رابط مكسور. |
| **D-076** | ميزات `/presentation` تدخل الشاشات الحقيقية، وصفحات العرض تخرج من الـ nav. (بيعدّل D-073) |
| **D-077** | DS v2 = تطوير البراند، والويبسايت ما يتلمسش. |
| **D-078** | Radius هجين. (بيعدّل D-022) |
| **D-079** | تقسيم البيزنس. (بيعدّل D-011 و D-058 و D-059) |
| **D-080** | Admin جوه كل أداة لأدمن العميل. |

**إزاي D-079 بيعدّل القرارات القديمة:**
- **D-011:** الـ CRM يرجع يدير **خطط الخدمات**، على شاشات جديدة بـ DS v2. الشاشات القديمة المتقاعدة ما ترجعش.
- **D-058:** سلطة السعر تبقى **لكل خط بيزنس**: الخدمات في الـ CRM، والأدوات في الـ Console، والويبسايت بيقرا من الاتنين عن طريق الـ public catalog.
- **D-059:** طلبات خدمة إدارة المواقع تتنقل لتسليم الـ CRM.

- **اسم الـ Console:** "SaaS Console" اسم شغل مؤقت، والاسم النهائي بيتقترح في التقرير.

### 2.2 تجربة العميل التكيّفية
- **أداة واحدة:**
  - يدخل على الأداة على طول. القرار ده بياخده SOS بعد الـ hand-off (القسم 4.4)، فالويبسايت ما بيتغيرش.
  - الحساب والفواتير من قائمة الأفاتار.
  - الـ Hub مش ظاهر في الـ rail.
- **أداتين أو أكتر:**
  - OrgTik Home فيه: الأدوات، ونشاط مجمّع، و"اللي مستنيك"، والروابط بين الأدوات.
  - رابط Home في الـ rail.
- **أي ميزة بين أداتين بيكون ليها 4 حالات:**
  - **متاحة.**
  - **الأداة التانية مش مشترَك فيها:** كارت "ضيف Files" فيه trial للـ owner و"اطلب من الـ owner" لغيره.
  - **مفيش مقعد:** "اطلب access".
  - **read-only بسبب الفوترة:** شرح، وزرار "ادفع" للـ owner.
- **قاعدة:** ما يبقاش فيه رابط مكسور أبدًا.

### 2.3 طبقة الإيكوسيستم (ecosystem layer)
- **Connector registry** في الـ mock: أزواج الأدوات اللي تقدر تترابط، والبيانات اللي بتتنقل، والحالة لكل workspace (on/off).
  - بيرجع ضمن `/v1/app/me` وسياق الـ workspace.
- **في `@orgtik/ui`:**
  - `useSuite()` فيه: `hasTool`، و `toolState`، و `canConnect`، و `seat`.
  - مكوّن `<ConnectedFeature requires="files">` بيعرض حالة من الأربعة.
  - كود rail واحد بدل 9 نسخ.
- **كيانات مشتركة:**
  - **People:** دليل واحد للـ workspace، والـ HR employee امتداد للـ person.
  - **Contacts/Companies:** الـ CRM هو المالك، و Marketing بيستخدم audiences بتشاور عليهم.
  - **ملفات:** تكمّل على عقد D-071.
  - **Calendar:** availability واحدة.
  - **Notifications و Search و Activity:** feed واحد.
- **تحويل الرحلات اللي كانت demo بس لـ endpoints حقيقية في الـ mock**، مع الحفاظ على تجميد `session-*` و `workspace-boundary` و `journal` إلا للإصلاح:
  - مهمة من رسالة.
  - onboarding→Tasks.
  - follow-up→Task.
  - lead→CRM.
  - attribution.
  - الجرس و ⌘K.
  - التفضيلات.

---

## 3. DS v2: تطوير البراند لمستوى premium (`packages/ui`)

### 3.1 الأساسيات (tokens v2)
الملفات: `packages/ui/tokens/{color-and-scale,elevation,type-and-size}.json`، و `scripts/build-tokens.mjs`، و `src/tokens.ts`.

- **اللون:**
  - **البراند:** رامبات plum/violet بنفس الـ hue، بس تتعاد معايرتها بـ OKLCH. ونثبت إنها لسه مطابقة للبراند بفحص OKLab من `program/tools/design_inventory.py` على ORGTIK.pdf.
  - **neutral جديد "graphite"** شبه محايد (chroma أقل من 0.01)، يبقى أساس الـ canvas والـ surfaces والخطوط والنص.
  - **الـ mauve** يتحصر في لحظات البراند: الـ rail، والـ selected، والـ focus.
  - **الدارك:** graphite عميق، مش بنفسجي مشبّع.
  - **الـ rail** يفضل aubergine في الثيمين: ده المرساة بتاعة البراند.
  - **حدود الكنترولز:** أخف بصريًا، مع الحفاظ على 3:1 بالـ border أو بفرق الـ fill (WCAG 1.4.11).
  - **إصلاح** الـ hover على الزرار الأساسي في الدارك.
- **الخط:**
  - **مونتسرات:** للعناوين والـ display بس.
  - **IBM Plex Sans:** للنص اللاتيني، أخو IBM Plex Sans Arabic (D-010)، وبيتحط بداله Arial.
  - أرقام tabular للبيانات.
  - السلم: 11 / 12 / 13 / 14 / 16 / 18 / 20 / 24 / 30 / 36.
  - الافتراضي 14 (و 13 في الكثيف).
- **Radius هجين (D-078):**

  | العنصر | الـ radius |
  |---|---|
  | الأزرار الأساسية، chips، badges، segmented، avatars | pill |
  | inputs، أزرار الجداول والـ toolbars، عناصر القوايم | 8px |
  | الكروت | 12px |
  | overlay و dialog | 16px |
  | الألواح الكبيرة | 20px |

  - كده الـ radius بتاع الكروت بينزل من 20 لـ 12.
- **العمق:**
  - 5 مستويات ظل (xs → xl) متلوّنة بالـ ink.
  - inset highlight (`lit`) و contact shadow، متنقولين من Chats.
  - **focus:** حلقة 2px للـ a11y، وفوقيها halo ناعم 4px من لغة الويبسايت.
- **Layout:**
  - spacing tokens.
  - عروض محتوى ثابتة: narrow 720، و default 1200، و wide 1440، و full.
  - z-index tokens.
  - **Density:** comfortable و compact. صف الجدول 44 أو 36، والكنترول 36 أو 32. بيتظبط كتفضيل للشخص ولكل جدول.
- **Motion:**
  - المدد: 80 / 120 / 180 / 240 / 320.
  - easing: standard و emphasized و exit، و spring للـ overlays.
  - press feedback.
  - shimmer skeleton.
  - nav progress.
  - احترام `prefers-reduced-motion`.
- **Data viz:**
  - palette فئوية من 8 ألوان مشتقة من البراند، و sequential، و diverging.
  - منفصلة عن ألوان الحالات.
  - `check-viz.mjs` يدخل الـ CI.

### 3.2 المكوّنات
- **تحديث كل الموجود على v2:**
  - Button و IconButton: مقاسات 28 / 32 / 36 / 40، وحالة loading، و press.
  - Field و Input و Select و Combobox.
  - Dialog.
  - Sheet: يبقى inspector افتراضي.
  - Menu و Popover.
  - Toast: نظام واحد.
  - Badge: يضاف dot variant.
  - Tabs، و Breadcrumb.
  - **PageHeader v2:** عنوان، و meta، و actions، و tabs.
  - **DataTable v2:** sticky header، و density، و column chooser، و resize، و row actions، و selection مع BulkActionBar، و inline edit.
  - **Stat v2:** sparkline و delta.
  - **States v2:** empty states بـ spot illustrations موحّدة.
  - Board، و CalendarGrid، و charts.
- **مكوّنات جديدة:**
  - **قوائم وبحث:** Toolbar/FilterBar (search، و filter chips، و saved views، و sort، و view switcher، و density)، و SavedViews، و ColumnChooser، و CommandPalette (⌘K واحد، وكل أداة بتسجّل providers بتاعتها).
  - **تواصل ونشاط:** NotificationCenter واحد، و ActivityTimeline، و CommentThread بـ mentions.
  - **إدخال:** RichTextEditor حقيقي (ننقل tiptap من Sales للمكتبة)، و TagInput، و InlineEdit، و Slider، و Dropzone v2.
  - **عرض:** AvatarGroup، و Kbd، و Inspector/SplitView، و KPI card.
  - **الإيكوسيستم:** OnboardingChecklist، و UpsellCard / ConnectCard / RequestAccess، و Workspace/Tool switcher.
  - **Layouts:** SettingsLayout و ToolAdminLayout.
- **Shell v2:** `SuiteFrame` واحد في المكتبة بدل 9 نسخ.
  - **الـ rail:**
    - تكيّفي: Home بيظهر بس لو فيه أداتين أو أكتر.
    - فيه "+ Add tool" للـ owner.
    - مصدر واحد لقايمة التطبيقات.
  - **الـ sidebar v2:**
    - الهيدر: اسم الأداة + الـ workspace.
    - sections، وتقدر تتطوي لأيقونات.
  - **الـ top bar v2:**
    - البداية: breadcrumbs أو سياق الصفحة، بدل الـ 7 استخدامات الحالية.
    - النهاية: ⌘K، وجرس واحد، و Help، وقائمة الأفاتار (Account و Billing و Preferences و Sign out).
  - **`BannerRegion`** في كل التطبيقات، فيه حالات الفوترة، والـ trial، والـ read-only، و View-as.
  - **الـ badge بتاع Prototype** يبقى في مكان واحد بدل الشريط المتكرر، و Demo Panel للبروتوتايب بس.
- **إيكوسيستم في المكتبة:**
  - `useSuite()` و `useSuiteApps()`، واحد لكل واحد منهم.
  - `<ConnectedFeature>`.
  - رسايل 423/403 موحّدة تتحول لبانر أو كارت فيه السبب الصح.
- **Storybook:**
  - stories لكل مكوّن جديد وكل اللي ناقص.
  - نعيد تسجيل الـ baselines، حوالي 270 أو أكتر، في `apps/docs/tests/check.mjs`.

### 3.3 نقل التطبيقات على v2

| التطبيق | الشغل |
|---|---|
| **Sales و HR** | نشيل kits الـ shadcn (`components/ui/*`)، و `shadcn/tailwind.css` و `tw-animate-css` و `--radius` و `--chart-*`، و sonner، و lucide، و iconify، و react-day-picker. وكمان: HR يتنقل على DataTable و PageHeader و StatusBadge بتوع المكتبة، و Sales يكون فيه Toaster واحد. |
| **Chats** | الـ inline styles تتحول لـ tokens و classes. الـ accent presets تفضل (D-046) كطبقة فوق v2. |
| **الباقي** (SOS، Tasks، Files، Marketing، WM، Admin) | نظاف أصلًا. التحديث هنا مكوّنات وأنماط بس. |

- **الأدوات:** الـ codemods الموجودة (`colors-to-tokens`، و `physical-to-logical`، و `lucide-to-phosphor`)، ونضيف اتنين جداد:
  - `shadcn-to-orgtik`: يحوّل الـ imports.
  - `tokens-v1-to-v2`: يحوّل أسماء الـ radius والظلال.
- **القياس قبل وبعد:** `program/tools/scan_static.py`.

---

## 4. تفاصيل التقسيم: CRM ← الويبسايت، و SaaS Console، و Admin الأداة

### 4.1 كتالوج الخدمات في الـ CRM
**البيانات:** تفضل في مكانها في الـ platform store، لأن ده اللي الـ public catalog بيقراه:
- `S.db.services`
- `websiteOffers` اللي `kind=service`
- `websiteOfferBundles`

اللي بيتغيّر هو **مين يملك شاشة الإدارة والصلاحية**: الـ CRM بياخد endpoints كتابة (`mock/apps/sales/service-catalog.js` جديد)، و ADM ما يبقاش عنده كتابة على `kind=service`.
- الكتالوج القديم في `mock/apps/sales/catalog.js` (categories/features/plans/packages) نربطه بالموديل الجديد أو يتقاعد.

**شاشات جديدة في `apps/sales/app/[locale]/(dashboard)/catalog/**`:**
- `/catalog`: الأقسام والخدمات بحالتها (draft / published / hidden)، وملخص الأسعار، وآخر نشر.
- `/catalog/services/[id]`: الاسم والوصف والميزات بـ 5 لغات (`LocalizedField`)، والقسم، والأيقونة، والإتاحة.
- `/catalog/pricing`: grid للخدمات × الـ zones، وسياسة خصومات المدد (1 / 3 / 6 / 12)، وخصومات العدد. الـ zones والعملات بتتقري من الـ Console.
- `/catalog/bundles`: محتوى الباقة، و recommended، ونص "ليه الباقة دي".
- `/catalog/publish`: التغييرات من آخر نشر، ومعاينة الكارت، وجدولة، ونشر، وسجل.

**التسليم:**
- `/service-requests` بتتنقل من ADM (بنحط redirect من ADM).
- الأوردرات اللي `kind=service` جاية من الويبسايت بتتحول لـ customer و deal (SR-018).
- leads الويبسايت توصل فعلًا (إصلاح `crm_intake_pending`، E10).

**ربط الويبسايت** (موافَق عليه: من غير أي تغيير في الشكل):
- `/v1/public/catalog` (`mock/apps/admin/website-offers.js`) بيرجّع كمان: الوصف، والـ capabilities، والقسم، والأيقونة، وبيانات الباقات.
- في الويبسايت `src/reference/purchase-catalog.js`: الدالة `installPublicCatalog` تحط النصوص اللي جاية من الـ API فوق `CATALOG` و `BUNDLE_PRESENTATION`.
  - الـ fallback هو الثوابت الحالية (last-known-good).
- نفس الـ markup بالظبط.
- الـ WM يفضل مالك كلام صفحات الخدمات (D-002)، والـ CRM مالك الخطط والأسعار.

**مرايات الـ WM:** `managedIn: "crm" | "console"` بدل `"website"`، ومع كل واحدة deep link (`apps/wm/components/content/EntryEditor.tsx`، و `apps/wm/store/api.ts`).

### 4.2 SaaS Console (`apps/admin`)
- **الـ nav v2:**

  | القسم | فيه إيه |
  |---|---|
  | Overview | SaaS metrics: MRR، والـ workspaces لكل أداة، والـ trials، والـ churn، والـ activation |
  | Tools | دورة الحياة، والـ releases، والـ changelog، والإعلانات، والـ waitlist |
  | Plans & limits | الـ editions، والـ features، والـ limits، وقواعد المقاعد |
  | Pricing | للـ software: الـ grid، والـ zones، والعملات، والـ log، والـ preview |
  | Commerce | suite bundles، و coupons، و tax & gateways |
  | Customers | الـ workspaces، وجوه كل واحد: الأدوات، والـ lines، والمقاعد، والاستخدام، والصحة، والـ connectors. وكمان migrations و custom plans |
  | Billing | subscriptions، و invoices، و dunning & recovery، و credit notes، و pay links، و exports |
  | Ecosystem | الـ connectors registry |
  | Support | tickets، و View-as |
  | System | staff & roles، و templates، و settings، و audit |

- **يطلع منه:**
  - Services و Service requests: يروحوا الـ CRM.
  - قسم Website: الـ WM عنده الـ rail بتاعه.
- **الميزات اللي في `/presentation` تدخل الشاشات الحقيقية:** الـ dunning، و credit notes، و pay links، و tax، و exports، و metrics.

### 4.3 Admin جوه كل أداة (`ToolAdminLayout`)
- **أقسام ثابتة في كل أداة:**
  1. Overview: الخطة، والمقاعد، والاستخدام قدّام الحدود، وحالة الفوترة.
  2. Members & seats.
  3. Roles.
  4. Settings.
  5. Connections.
  6. Import / Export.
  7. Audit.
  8. Billing: للـ owner رابط على الحساب، ولأي حد غيره "اطلب".
- **الـ Settings خاصة بكل أداة:**

  | الأداة | الإعدادات |
  |---|---|
  | Tasks | statuses، و labels، و templates، و fields |
  | Files | التخزين، وسياسة المشاركة، وانتهاء اللينكات، والـ versions |
  | Chats | القنوات، والاحتفاظ بالرسايل، والضيوف، والمكالمات |
  | HR | الأقسام، وأنواع الإجازات وسياساتها، والعطلات، والـ payroll، وانتهاء المستندات |
  | CRM | مراحل الـ pipeline، والـ fields، والـ routing، وقوالب العروض |
  | Marketing | البراندات، والـ senders، والـ consent، و UTM |

- **الصلاحية:** owner أو admin الـ workspace، أو admin الأداة.
  - ده بيوسّع `workspace-commands.js` لكل الأدوات بعد ما كان Tasks و Files بس.

### 4.4 OrgTik Home التكيّفي (`apps/sos`)
- **بعد الدخول:** لو للشخص access على أداة واحدة بس، يتحوّل على طول لـ `/go/<tool>`.
  - المنطق ده في SOS، فمش محتاجين نغيّر الويبسايت.
  - **مكانه:** لحظة الدخول بس. يعني `apps/sos/app/auth/handoff/page.tsx` (فيه `router.replace(redirect)`) وصفحة الـ login، ولما مفيش `redirect` صريح.
  - **ما يتطبقش لما المستخدم يفتح Home بنفسه**، عشان ما يحصلش loop. والويبسايت أصلًا بيبعت `/auth/handoff?code=` من غير redirect.
- **أداتين أو أكتر:** Home v2 فيه:
  - الأدوات.
  - "محتاج انتباهك": مهام، وموافقات، و mentions.
  - النشاط.
  - اقتراحات ربط، زي "اربط HR بـ Tasks عشان مهام الـ onboarding تتعمل لوحدها".
  - Checklist للإعداد.
- **إصلاح رابط Home في الـ rail:** حاليًا `${SOS_URL}/${locale}`، و SOS مالوش locale في الـ URL (D-033)، فالرابط بيودّي على 404.

---

## 5. نتيجة التحليل: الـ flows والميزات الناقصة

### 5.1 أرقام أساسية
- **192 route حقيقي** في الـ 9 تطبيقات، وفوقهم 10 صفحات `/presentation`.
- **من الـ 72 ميزة:** 60 موجودين في `/presentation` بس، و 9 بس حقيقيين، و 3 متقسمين بين الاتنين.
- **صفحات `/presentation` بترجع 404 في الـ build العادي:** بتشتغل بس لو `NODE_ENV=development` أو `NEXT_PUBLIC_DEMO_PANEL=1`.
  - يعني في المنتج العادي بيختفوا: الـ 60 ميزة، والبحث الموحّد، والجرس، والروابط بين الأدوات.
  - **ده أخطر فجوة في المشروع كله.**
- **الحالات الست مش مبنية في الشاشات نفسها:** هي overlays من Demo Panel.
  - HR (فيه 56 Skeleton معمولين باليد) و Chats هما الأضعف.
  - بانرات الفوترة بتظهر في SOS بس، وجوه الأدوات المستخدم بيشوف toast خطأ بس.
- **الـ backlog مش مربوط بالتسليم:**
  - `backlog.csv` (407 بند) من غير عمود status، ومش مربوط بـ `release-packages.csv`.
  - `issues.csv` بتاع Sales فيه 191 بند لسه "open"، مع إن الشغل اتعمل.
  - SR-001/013/015/016/019/020/021/023 اتحلّوا في الكود، والوثايق لسه بتقول إنهم مفتوحين.
- **مقاسات الشاشة:** مفيش overflow على 390 ولا 1440. بس مقاس التابلت (768–1024) ما اتختبرش خالص، مع إن الـ bugs الاتنين اللي كانوا معروفين كانوا عليه.

### 5.2 Tier A: جوه الخطة دي (P3/P4) ومش محتاج موافقة تانية

**1. دمج الـ 60 ميزة presentation-only في الشاشات الحقيقية:**

| الأداة | الميزات اللي هتدخل الشاشات الحقيقية | مكانها |
|---|---|---|
| Tasks | filters وبحث، و reminders، و watchers، و recurrence، و templates، و labels، و CSV، و quick add، و bulk | قوائم المشاريع و My tasks، بـ Toolbar و DataTable v2 |
| Files | versions و upload new version، وإشعار المشاركة، و view/edit لكل شخص، و quota، و comments، و bulk و drag، وبحث وترتيب | — |
| Chats | إشعارات، و call stage (محاكاة)، ومهمة من رسالة (في `features/chat/Message.tsx`)، و rich text، و browse/join، و schedule/remind/save | — |
| HR | سياسات الإجازة والـ accrual والأرصدة، و self-service profile، و import، و onboarding←Tasks، وانتهاء المستندات، و mailbox، و bank file | — |
| CRM | الـ 8 كلهم: follow-ups عن طريق Tasks، و import/export، و deal board و forecast، و timeline، و lead routing، و quote PDF وتوقيع (محاكاة)، و companies و fields و tags، و targets والتقارير | — |
| Marketing | الـ 8 كلهم: ربط الـ CRM، و consent و unsubscribe، ونتايج الحملات، و email designer بـ RTL، و social inbox، و queue بالسحب، و journeys، و AI writing (محاكاة) | — |
| WM | analytics (عينة)، وإشعارات المراجعة والـ leads، و spam protection، و responsive images، و AI translation drafts، و release bundles | — |
| Console | dunning وإشعارات انتهاء الكارت، و invoice PDF و series، وتعديل line واحد (plan/seats/cycle)، و tax IDs و ZATCA، و pay-by-link، و exports، و staff 2FA، و audit filters | — |
| Account | 2FA، و workspace audit (فيه View-as)، و usage & limits، و data export، و onboarding، و invoice PDF و billing contacts | — |

**2. الإيكوسيستم:** القسم 2.3، أي حاجة من E1 لـ E13.

**3. إصلاحات flows:**
- HR Projects: الـ token غلط.
- رابط Home في الـ rail بيودّي 404.
- lead و purchase يوصلوا الـ CRM.
- Tasks: الـ dependencies بتتجاهل وقت السحب لـ Done.
- HR: تبويب Leave balances بيعرض جدول الطلبات.
- HR: صفحة `/subscriptions` يتيمة.
- hydration: في Sales `/activity-feed` و HR ticket detail.
- Chats: صفحة `/tasks/[taskId]` stand-in.
- نسوّي `issues.csv` بتاع Sales مع الواقع.
- نضيف فحص tablet على 768 و 1024.

### 5.3 Tier B: ميزات تقوّي السيستم (موافَق عليها كلها، 2026-10-09)
- **اتأكد معاك كمان:** طلبات الخدمة وتسليمها بتتنقل للـ CRM (D-079).
- **مكانها في المراحل:** كل حاجة من دول بتتبني جوه دورة الأداة بتاعتها في P4، والجزء الخاص بالمنصة في دورة Account.

| الأداة | المقترح (مرتّب بالقيمة) |
|---|---|
| **Account / المنصة** | **الدخول والأمان:** email verification (محاكاة)، و sessions list، و SSO كإعدادات (محاكاة). **الإشعارات والتكاملات:** notification preferences، و API keys و webhooks (محاكاة). **الفريق:** search، و suspend، و leave، و bulk invite، و custom roles. **الحساب والفوترة:** إنشاء workspace تاني من جوه التطبيق، وحذف الحساب الشخصي، و refund request، و pause/win-back. **دعم المنتج:** Help center، و status، و changelog/What's new، والإعلانات، و feedback. |
| **HR** | self-service كامل: My profile، و directory للموظفين، و change requests، و My team للمدير. وكمان: clock-in وتصحيح الحضور لحد الـ payroll، و performance reviews و goals، و recruiting (careers page، و scorecards، و offer letter، والـ Hire يملا بيانات الموظف لوحده)، وعطلات لكل دولة، و HR letters، وتقارير headcount/turnover. |
| **CRM** | **طبقة نشاط:** call و email و meetings log. **وكمان:** multiple pipelines، و duplicate merge، و targets/funnel، و WhatsApp/click-to-call (محاكاة). |
| **Tasks** | timeline/Gantt، و custom fields، و automations بسيطة، و time tracking، و project archive، و sample project أول مرة. |
| **Files** | Shared with me، و starred، و recent، و trash auto-purge، و upload request links، ومعاينة sheets/slides. |
| **Chats** | typing و read receipts، و @channel/@here، و polls، و voice notes (محاكاة)، وضيوف من متصفح تاني. |
| **Marketing** | contact records، و sender domain و test send. |
| **WM** | autosave، و comments على العناصر، و publish webhooks. |
| **Console** | MRR movements و cohorts، و CSV exports، و staff invitations، و ticket SLAs، و global search. |

- **الـ trial من الويبسايت (SR-008):** محتاج تغيير في شكل الويبسايت، وده برّه النطاق.
  - البديل: الـ trial يبدأ من Account أو Home، أو من ConnectCard جوه الأداة.

### 5.4 Tier C: مؤجّل، لأنه محتاج providers أو باك إند حقيقي
- إرسال حقيقي: email، و push، و payments، و analytics، و social، و signatures، و calls، و regulatory.
- رفع ملفات بأي نوع.
- إطلاق الويبسايت العربي للعامة.
- القبول على النسخة الأونلاين.

### 5.5 Top 25 (ملخص مرتّب) — هيتفصّل في التقرير
1. ميزات presentation-only بترجع 404 في المنتج.
2. الروابط بين الأدوات ماشية على demo bridge بس.
3. البحث والجرس demo بس.
4. مفيش first-run ولا usage/limits.
5. email verification و 2FA و sessions و SSO.
6. الـ dunning يدوي.
7. invoice PDF و series.
8. مفيش email/push ولا notification preferences.
9. Tasks: filters و labels و reminders… مش في الشاشات الحقيقية.
10. CRM من غير follow-ups ولا activities.
11. CRM: board و forecast و companies.
12. HR من غير self-service.
13. Marketing: الإيميل مش compliant ومفيش قياس.
14. Files: versions و comments و quota.
15. الحضور من Discord بس.
16. الـ staff مش قادرين يعدّلوا line واحد.
17. Chats: مهمة من رسالة، و rich text…
18. HR: performance reviews.
19. workspace audit و export.
20. أساسيات الـ Team.
21. الحالات مش ثابتة.
22. API keys و webhooks والكاليندر.
23. Tasks: Gantt والوقت والـ automations.
24. الـ trial من الويبسايت.
25. Help center والـ changelog.

---

## 6. المراحل والبوابات

| المرحلة | المحتوى | البوابة |
|---|---|---|
| **P0: التقرير والقرارات** | **التجهيز:** worktree جديد `orgtik-suite-v3` من origin/main (ما نشتغلش في الـ checkout المشترك). **القرارات:** D-075 لـ D-080، و amendment A37. **الـ backlog:** نحدّث الحالات القديمة (SR-001/007/015/016/020/021 اتحلّت بـ D-068)، ونربط `backlog.csv` بـ `release-packages.csv` بعمود status. **التقرير:** Artifact بالعامية المصرية للـ PM والفريق، فيه التحليل والمعمارية والـ DS v2 والـ Tiers وخارطة الطريق. | مراجعتك للتقرير. Tier A و B متوافق عليهم أصلًا. |
| **P1: أساسيات DS v2 + Specimen** | tokens v2، وخط IBM Plex Sans (`build-fonts.mjs`)، وصفحة Foundations v2 في Storybook. **3 شاشات specimen حقيقية:** قائمة Tasks بـ Toolbar و DataTable v2، وفورم إجازة HR في Sheet، و Account Home v2. كلها EN/AR × فاتح/غامق. | **G-DS1:** توافق على الشكل من لقطات |
| **P2: المكتبة v2 + Shell v2 + أدوات الإيكوسيستم** | تحديث كل المكوّنات والجديدة، و `SuiteFrame`، و `useSuite`، و `ConnectedFeature`، و `ToolAdminLayout`، والـ stories. نعيد الـ baselines ونطلّع `@orgtik/ui` 2.0.0-rc.1. | **G-DS2:** مراجعة Storybook |
| **P3: طبقة الإيكوسيستم + تقسيم البيزنس** | **الـ mock:** connectors، و request-access، و add-tool، وأسباب 423/403، وتوحيد notifications/search/activity/people/contacts، ونحوّل رحلات الـ demo لـ endpoints حقيقية، وإصلاح HR Projects و lead/purchase←CRM. **SOS:** الدخول التكيّفي، و Home v2، وإصلاح رابط Home. **الباقي:** كتالوج خدمات الـ CRM + النشر، وتركيز الـ Console، ومرايات الـ WM، وربط بيانات الويبسايت مع إثبات parity. | لقطات ورحلة J19 |
| **P4: دورة على كل أداة** | **الترتيب:** Tasks (pilot) ← Account ← HR ← CRM ← Chats ← Files ← Marketing ← Console ← WM. HR و CRM متقدّمين لأنهم أكتر اتنين شاذّين بصريًا. دورة Account فيها Tier B الخاص بالمنصة. **في كل دورة:** (1) Shell و مكوّنات v2، ونشيل الـ kits القديمة. (2) ميزات `/presentation` تدخل الشاشات الحقيقية، وتتشال من الـ nav. (3) Admin الأداة. (4) `ConnectedFeature` في كل نقطة ربط. (5) onboarding أول مرة. (6) ميزات Tier B بتاعة الأداة دي. (7) الحالات الـ 6، والـ 5 كتالوجات، و RTL، والدارك، و 390. | لقطات + flow لكل أداة |
| **P5: الاتساق والتسليم** | مراجعة UX على مستوى السويت كله: التنقل، والمصطلحات (`program/glossary/`)، والـ empty states، والنبرة، ومكان الأزرار الأساسية. ونحدّث `prototype-guide` و `prototype-journeys` (J1–J20)، ونطلّع تقرير "قبل/بعد". | Figma من الكود (D-004) اختياري، بسؤالك |

- **تقرير P0** (Artifact، صفحة HTML بالعامية المصرية، و light/dark):
  1. الملخص التنفيذي، وفيه 5 أرقام: 60 من 72، و 404 في الـ build العادي، و 4 روابط حقيقية بس، و 2 kits قديمة، و Arial.
  2. Scorecard لكل أداة: standalone، و connected، والاتساق، والحالات.
  3. رسم المعمارية: CRM، و Console، و WM، و Admin الأداة، و Home التكيّفي، والويبسايت. مع الـ 4 حالات لـ ConnectedFeature.
  4. اتجاه DS v2: قبل وبعد على لقطة واحدة.
  5. Tier A / B / C، و Top 25.
  6. خارطة الطريق والبوابات.
  7. سجل القرارات من D-075 لـ D-080، وكل الإجابات اللي اتاخدت منك النهارده.
- **التوازي:**
  - المكتبة والـ shell وإيكوسيستم الـ mock ليهم مالك واحد.
  - دورات الأدوات بتمشي 2–3 streams في worktrees منفصلة، بعد ما P2 يندمج.
  - فيه sessions تانية شغالة على نفس الجهاز (منها worktree `orgtik-suite-cms-improvements`). عشان كده:
    - نتأكد من `git worktree list` و ListAgents قبل أي تنفيذ.
    - ما نلمسش worktrees حد تاني.
- **طريقة الشغل:**
  - PR لكل حزمة، والـ CI لازم يبقى أخضر.
  - الـ commits بمسارات صريحة.
- **قيود:**
  - Vercel متوقف (D-074)، والنشر الأونلاين بموافقة صريحة بس.
  - ما نلمسش repo ولا مشروع Vercel بتوع المالك.

### مخاطر ومعالجتها

| الخطر | المعالجة |
|---|---|
| **تحديث الـ tokens بيأثر على كل التطبيقات مرة واحدة.** المكتبة injected في كل app (D-054). | ده مقصود: كل اللي ماشي على tokens بياخد الشكل الجديد في P2. أما kits الـ shadcn في HR و CRM فهتفضل شاذة لحد دورتهم، وعشان كده جايين بدري في P4. |
| **حجم الشغل كبير:** 60 ميزة، و DS، والإيكوسيستم. | Tasks pilot يثبّت الأنماط الأول. وكل دورة أداة بتسيب السويت قابل للعرض، فلو وقفنا في النص ما بيبقاش فيه حاجة مكسورة. |
| **الويبسايت ممكن يتغيّر من غير قصد.** | overlay فيه fallback للثوابت الحالية، و harness الـ qa لازم يطلع صفر فرق. ومفيش أي تعديل CSS أو JSX. |
| **الحدود المجمّدة (D-073):** بعض الكتابات بين الأدوات ممكن تحتاج مسار في `workspace-boundary`. | استثناء صغير صريح يتسجل في D-075، أو endpoint في الأداة المالكة. فيه مراجعة جدوى مفصّلة شغالة دلوقتي، ونتايجها تدخل في قرارات P0 قبل أي تنفيذ لـ P3. |
| **النسخة الأونلاين ماشية على `/presentation`** (D-074). | نحدّث الدليل والرحلات، وإعادة النشر بموافقتك بس. |
| **الـ baselines كتير:** حوالي 270 في Storybook، وفوقها لقطات التطبيقات. | بنعيد تسجيلها بعد G-DS1 و G-DS2 بس، مش مع كل تعديل. |
| **الديسك:** 7.7 GB فاضيين. | نبني ونصوّر تطبيق تطبيق، ونمسح `.next` والناتج بتاعنا بعد التحقق. |

## 7. الملفات الأساسية
- **المكتبة:**
  - `packages/ui/tokens/*.json`، و `packages/ui/scripts/{build-tokens,build-fonts}.mjs`، و `packages/ui/src/{components,shell,table,charts,status}/`.
  - جديد: `packages/ui/src/suite/{useSuite.ts,ConnectedFeature.tsx,SuiteFrame.tsx,ToolAdminLayout.tsx}`.
  - `apps/docs/` (stories و `tests/check.mjs`).
- **الـ Mock:**
  - جديد: `mock/lib/connectors.js`.
  - `mock/lib/workspace-context.js` (إضافات بسيطة بس).
  - `mock/apps/admin/{app-api,website-offers,store,lifecycle}.js`.
  - جديد: `mock/apps/sales/service-catalog.js`.
  - `mock/apps/wm.js` (الـ lead intake).
  - `mock/lib/presentation.js`: يبطل يتستخدم.
- **التطبيقات:**
  - `apps/<tool>/components/suite/*`: تتشال ونستخدم بدلها نسخة المكتبة.
  - `apps/<tool>/app/**/presentation`.
  - جديد: `apps/<tool>/app/**/admin/**`.
  - `apps/sales/components/ui`، و `apps/hr/components/{ui,shared/Table,shared/StatusBadge,layout/MainHeader}`.
  - `apps/chats/app/globals.css` و `components/ui/Primitives.tsx`.
- **SOS:**
  - `apps/sos/app/{(dashboard),go/[scope],auth/handoff}`.
  - `apps/sos/components/suite/*`.
- **الويبسايت (طبقة بيانات بس):** `apps/website/landing-directions/src/reference/purchase-catalog.js`.
- **البرنامج:**
  - `program/decisions/D-075..080.md` والـ README.
  - `program/backlog/*`.
  - `program/phase-f/amendment-A37.md`.
  - `program/prototype-*.md`.

## 8. التحقق
- **المكتبة:**
  - `pnpm --filter docs build && pnpm --filter docs check` بـ baselines جديدة: pixel + axe بدون critical/serious.
  - `check-viz.mjs` يبقى جزء من الـ CI.
- **التطبيقات:**
  - `pnpm turbo run typecheck i18n:check test --affected`.
  - `program/tools/audit-kit/vs1.mjs` على كل route.
  - `flows/<tool>.mjs` بعد التحديث.
  - `probe-a11y.mjs`، و `deadends.mjs`.
  - لقطات `shot.mjs` بـ EN/AR × فاتح/غامق × 1440/390.
  - مقاييس `scan_static.py` قبل وبعد: صفر shadcn، وصفر kits محلية، وصفر inline styles في Chats.
- **الويبسايت:**
  - `program/tools/qa`: نشغّل `discover` ثم `capture` ثم `diff`. المطلوب صفر فرق pixel قدّام الـ baseline الحالي على كل الصفحات.
  - `flows/site-*.mjs` (J1 الشراء) يفضل أخضر.
- **رحلات جديدة (audit-kit flows):**
  - **J16:** عميل Tasks بس: يشتري من الويبسايت ← يدخل Tasks مباشرة ← "Attach from Files" يطلع ConnectCard ← يبدأ trial لـ Files ← الإرفاق يشتغل.
  - **J17:** عضو من غير مقعد ← RequestAccess ← الـ owner يوافق ← المقعد يتخصص.
  - **J18:** إلغاء أداة ← export وتحذير بالأثر ← الميزات المربوطة تتراجع بشياكة.
  - **J19:** الـ CRM يعدّل سعر أو باقة خدمة ← ينشر ← الويبسايت يعرض الجديد بعد reload، بنفس التصميم.
  - **J20:** الـ Console يحوّل أداة من Beta لـ Live ← الحساب والويبسايت يعكسوا التغيير.
  - **J8 و J14** يبقوا حقيقيين، من غير `demoRequest`.
- **العرض:**
  - `pnpm demo all` (ذاكرة + ساعة ثابتة)، ونمشي الرحلات في الـ browser pane ونبعت لقطات.
  - الديسك فيه 7.7 GB فاضيين: اللقطات تتعمل تطبيق تطبيق، ونمسح الناتج بتاعنا بس.
