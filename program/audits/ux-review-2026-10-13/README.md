# مراجعة تجربة OrgTik بعد استرجاع داشبوردات v3 — 13 أكتوبر 2026

## الملخص التنفيذي

الداشبوردات اللي PR64 شالها رجعت على آخر `main` متاح من GitHub: `6432ef262fafbb235141d670af9724c3d0138c17`، في branch `restore/v3-dashboards` و[PR83](https://github.com/YossefElfeel/orgtik-suite/pull/83). PR63 يظل reverted. النموذج كله بيشتغل محليًا بـ`pnpm dev:local`، ببيانات mock محفوظة في ملفات. منى عندها super_admin للتطبيقات التسعة وإداراتها، ومفيش backend إنتاجي أو Redis أو دفع حقيقي مطلوب.

المراجعة الحالية فيها **44 ملاحظة محددة: 7 اتصلحوا واتراجعوا، و37 مفتوحين**. درجات المفتوح محسوبة من [السجل](findings.json)، ومفيش P0 ثبت في العينة. ده مش إثبات إن كل مسار فرعي خالي من المشاكل. أعلى أولوية: منع فقد المسودات، أزرار HR الصامتة، اتساق إنشاء وتعديل CRM، لغة الموقع، والرجوع للحساب أو طلب الوصول عند عدم امتلاك أداة.

الشراء التجريبي الكامل نجح بعد إصلاح توقيع الطلب المحلي: **Tasks شهر، CHF16، PayPal محاكى مرة واحدة، طلب ORG-FDAEC694، فاتورة Paid واحدة INV-2026-001050، وتسليم لنفس مساحة العمل**. السلة اتفرغت بعد نجاح الطلب، ومفيش فلوس اتخصمت. الأداة اشتغلت من غير أي خدمة حقيقية.

اختبارات الاسترجاع نجحت: 330/330 تكامل mock، 58/58 انحدارات مستهدفة، 23/23 order/key، 15/15 router/key، typechecks والكتالوجات، بناء WM والموقع، 46 DS gate، و975 API route. [تفاصيل التحقق](restoration.md). Phase A دخلت Phase B بعد CI green على `c81431a1`. نتيجة رأس PR الحالي تظهر في [Checks](https://github.com/YossefElfeel/orgtik-suite/pull/83/checks). **Root lint لسه فيه ديون قديمة موثقة؛ ما تسجلش نجاحه.**

## الحالة الحالية والمنهج

التقييم حصل على worktree معزولة عند `127.0.0.1:3400`، بعيد عن checkout المستخدم و`localhost:3000`. الأدلة داخل [shots](shots/) و[capture-index.json](capture-index.json). صور التقييمات القديمة اللي رجعت من PR52 وPR57 أرشيف تاريخي فقط؛ مفيش صورة قديمة من أكتوبر 11 مستخدمة كإثبات جولة أكتوبر 13.

التقرير يفرّق بين **سلوك شُوف ونُقر عليه** و**استنتاج من مصدر مفتوح**. كل عنصر له route ومصدر file:line، أثر، إصلاح سلوكي ومكوّن نستخدمه، ومجهود تقريبي. صغير يعني ساعات ليوم؛ متوسط يعني 1–3 أيام عمل مع الفحص. المجهود تقدير يحتاج تخطيط، مش وعد تسليم. P1 يعطل مهمة أساسية أو قد يفقد شغل، P2 يعوق الفهم أو الكفاءة، وP3 تحسين نص أو صيانة. الأرقام مش درجة نجاح للمنتج.

استخدمت Product Design audit وImpeccable critique للمراجعة. Assessment A كان مستقل عن B قبل دمج النتايج. A راجع التصميم ودلالات Nielsen؛ B راجع المصدر وديتكتور محدود. الديتكتور على 8 نطاقات رجع 0 ملاحظات، وده لا يغطي CRUD أو التوجيه أو كل WCAG. Browser overlay لم يُحقن لأن browser API للقراءة فقط. [طريقة التقييم وحدوده](assessments.md).

### تغطية الأشخاص والرحلات

| الشخص أو الرحلة | اللي اتعمل فعليًا | الدليل والحد |
| --- | --- | --- |
| Mona | دخول متكرر، التطبيقات التسعة، WM وConsole بـsuper_admin، وإدارات الأدوات الستة | صور02–74 و93–121؛ تغيير صلاحيات حقيقية لم يحصل |
| Nour | دخول كعضو OrgTik ثم Switch Workspace إلى Nile Foods كـowner، Home وbilling وsecurity، HR notYours، دعوة Files-only، وSign out |75/77/82/86/88/97 |
| invited member | بريد `.test` ومعاينة mailbox محلية، قبول الدعوة، Files-only first run، Files وProfile، وSign out |81/83/85/87/92؛ لم يُرسل بريد خارجي |
| new signup | حساب UX Website Audit، اختيار Tasks، سلة، quote، Pay mock، تفعيل، فاتورة، وتسليم Tasks |W02–W16؛ محاولة الدفع واحدة ومحلية |
| Tasks | main وAdmin، إنشاء1067، تعديل والتحقق من الحفظ، فتح حذف نهائي وCancel |73/74/76/78/79/80؛ الحذف الدائم لم يُنفذ |
| Files | main وAdmin وRoles، إنشاء مجلد خاص وتسمية وأرشفة ثم Restore من واجهة مصححة |84/89/90/93–96؛ المجلد المستعاد ظاهر |
| HR | main وemployees وdetail وAdmin وRoles، قسم9 فارغ create/edit، تأكيد delete وCancel، وضغط Edit الوظيفة الصامت |98–102/115/120؛ أعطال payroll من المصدر، لم تُنفذ على راتب |
| CRM | main وAdmin وSettings، contact create، edit مرفوض بالنواقص ثم محفوظ بقيم خيالية، delete Cancel ثم revisit |B01–B08/B17/110/121 |
| Marketing | main وAdmin وSettings وUTM، label create/rename، delete Cancel ثم reload |55–57/B09–B16/112/118؛ مفيش حملة اتنشرت خارجيًا |
| Chats | office وchat وchannel وmeetings وwhiteboard وinsights وsettings وAdmin؛ room create/rename/removal Cancel |58–64/106–114؛ ميكروفون وكاميرا واجتماع حي ما اتفتحوش |
| billing وaccount | owner invoice Open، Console mock paylink، صفحة الدفع EN/AR، security محاكى للعرض، checkout paid invoice |46–54/86/88/W15–W16؛ refund وتغيير الأمان والدفع الحقيقي خارج الجولة |
| restored routes | كل قائمة WM وConsole المحددة في الخطة، SOS pay وstaff invitations، وMarketing UTM في EN/AR |[Restoration](restoration.md)، والفهرس يربط route بالصورة |

حذف Tasks وCRM وMarketing وHR وChats النهائي توقف بعد قراءة التأثير والضغط على إلغاء أو Keep. ده حد مقصود لعدم فقد بيانات لا يمكن إرجاعها من المنتج. بيانات UX الخيالية فضلت في dataset المراجعة المتجاهلة. ملفات الموظفين في العينة مولّدة محليًا؛ لم تُرفع بيانات موظفين حقيقيين.

### مصفوفة العربي وRTL والداكن و390px

| السطح | Desktop EN/AR |390px AR | Dark |
| --- | --- | --- | --- |
| SOS |Home وbilling وinvites وsecurity |[101](shots/101-sos-ar-dark-390.jpg) |نعم |
| Tasks |main وproject وAdmin |[103](shots/103-tasks-ar-dark-390.jpg) |نعم |
| Files |main وarchive وAdmin |[104](shots/104-files-ar-dark-390.jpg) |نعم |
| HR |main وemployee وdepartment وAdmin |[105](shots/105-hr-ar-dark-390.jpg)، [120](shots/120-hr-employees-ar-dark-390.jpg) |نعم |
| CRM |main وcontact وAdmin |[110](shots/110-crm-ar-dark-390.jpg) |نعم |
| Marketing |dashboard وlabel وAdmin وUTM |[112](shots/112-marketing-ar-dark-390.jpg) |نعم |
| Chats |office وAdmin وsettings ورحلات v3 |[113](shots/113-chats-ar-dark-390.jpg) |نعم |
| Console |كل الداشبوردات المسترجعة |[116](shots/116-console-ar-dark-390.jpg) |نعم |
| WM |كل الداشبوردات المسترجعة |[117](shots/117-wm-ar-dark-390.jpg) |نعم |
| Website |signup وsoftware وcart وcheckout EN، وcart/checkout AR |[119](shots/119-website-cart-ar-390.jpg)، سلة فارغة حالية |واجهة التجارة الفاتحة لم تتبع dark المشترك؛ لم أدّع فحص dark لكل الموقع |

أبعاد الموبايل المقاسة من DOM كانت390×844، والأدلة أُعيد فتحها بعد الحفظ. ملف الصورة الفعلي ارتفاعه843 أو844 حسب تقريب المتصفح؛ الحجم الدقيق لكل ملف في [assets.json](assets.json). لقطات110 و117 استُبدلت بالتقاط viewport محدد وحجم صحيح بعد إن API رجعت تصغيرًا غير مقبول. الصور98–102 وأجزاء من الجولة المتأخرة870×668؛ الجولات الأولى1280×720، وA/B للويب والأدوات1536×735. **مش كل الصور نفس الأبعاد.** viewport والثيم واللغة المؤقتين اتردّوا إلى الأصل قبل إنهاء الفحص.

## نقاط القوة والضعف البنيوي

الهوية وسياق workspace مفهومين في الرأس؛ تغير Nour من member إلى owner أظهر المساحة المقصودة. النموذج بيحتفظ بتعديلات Task وFolder وRoom وLabel وContact بعد الحفظ. CRM احتفظ بالفورم عند validation وركّز الحقل المحتاج تصحيح. تأكيدات الحذف بتسمي السجل وتشرح الأثر، والـfocus بيبدأ على Keep أوCancel. Charts عندها جدول بديل، وCRM بيفصل إجماليات العملات بدون تحويل تلقائي. Chats390 يستخدم قائمة أشخاص بدل مخطط الطابق، وInsights يوضح مجموعات، مش مراقبة فردية. ده ينبغي يتـحافظ عليه.

أكبر ضعف بنيوي هو الحدود بين الأدوات وAccount. الدخول الذكي `adaptiveEntry` مفيد، لكنه لا يعوّض زر رجوع صريح. notYours يفصل المستخدم عن طلب الصلاحية. onboarding مش مشتق بدقة من الأدوات المتاحة، وبعض الفورمات ما عندهاش dirty وpending وerror متسقين. الفرق بين مصدر المحتوى ومصدر المعاملة واضح في checkout بعد الإصلاح، لكنه أقل وضوحًا في نشر الكتالوج.

## طرق مسدودة أو وعود لا يكملها الفعل

HR Edit والقرض UX009/010/012 أوضح أمثلة أفعال واجهة مالهاش عملية صحيحة. notYours UX006 يفتقر لفعل يناسب سبب المنع. فاتورة Open UX023 تحتاج فعل pay mock أو شرح طلب الرابط. دعوة UX007 تنتهي في Home حتى لو الهدف أداة واحدة. WM Setup وConsole Setup والأرشيف المحلي والـquote كانت أمثلة مسدودة واتصلحت؛ ما تتسجلش كمشاكل باقية.

## سجل الملاحظات والإصلاحات


### UX-001 — رابط قائمة إعداد Console كان بيسقط اللغة

**P1 · اتصلح · المجهود:صغير**

**المكان:** `/admin/{en,ar}/setup`. **المصدر:** [apps/admin/components/console/Setup/index.tsx:12](<../../../apps/admin/components/console/Setup/index.tsx#L12>).

**المشكلة:** قائمة التقدم كانت تفتح /admin/tools وتوصل لـ404؛ الرابط المكرر تحتها كان صحيح.

**الأثر:** المستخدم كان يتعطل من المدخل الأساسي لنفس الخطوة.

**الإصلاح وإعادة الاستخدام:** تم إضافة اللغة إلى href الممرّر لـOnboardingChecklist. الوجهة دلوقتي /admin/en/tools أو /admin/ar/tools. إعادة استخدام OnboardingChecklist.

**الدليل وحدوده:** متصفح ومصدر؛ A08 قبل الإصلاح، صور 69–72 بعده. [دليل1](<shots/69-console-setup-fixed-ar.jpg>)، [دليل2](<shots/70-console-setup-open-tools-ar.jpg>)، [دليل3](<shots/71-console-setup-fixed-en.jpg>)، [دليل4](<shots/72-console-setup-open-tools-en.jpg>)

### UX-002 — خطوات بداية WM كانت نصوص من غير انتقال

**P1 · اتصلح · المجهود:صغير**

**المكان:** `/wm/{en,ar}/setup`. **المصدر:** [apps/wm/components/studio/Setup.tsx:9](<../../../apps/wm/components/studio/Setup.tsx#L9>).

**المشكلة:** الكود كان يرسل onAction بينما OnboardingChecklist يقبل onSelect؛ صفر أفعال داخل الخطوات.

**الأثر:** المسؤول يضطر يدور بنفسه عن الشاشة المطلوبة.

**الإصلاح وإعادة الاستخدام:** تم استخدام onSelect مع router المحلي. Edit content فتح قائمة Pages في اللغتين. إعادة استخدام OnboardingChecklist.

**الدليل وحدوده:** متصفح ومصدر؛ تقييم B، صور 65–68. [دليل1](<shots/65-wm-setup-fixed-en.jpg>)، [دليل2](<shots/66-wm-setup-open-pages-en.jpg>)، [دليل3](<shots/67-wm-setup-fixed-ar.jpg>)، [دليل4](<shots/68-wm-setup-open-pages-ar.jpg>)

### UX-003 — رابط Account كان مختلف بين السيرفر وأول رسم للعميل

**P2 · اتصلح · المجهود:صغير**

**المكان:** `/sos`. **المصدر:** [apps/sos/components/suite/SuiteFrame.tsx:24](<../../../apps/sos/components/suite/SuiteFrame.tsx#L24>).

**المشكلة:** رابط الحساب workspace-dependent كان يتغير أثناء hydration.

**الأثر:** تحذير hydration وعدم استقرار الرابط الأول.

**الإصلاح وإعادة الاستخدام:** تم ربط الاختيار بـmounted قبل استخدام workspaceContext؛ تم typecheck ومراجعة صفحة جديدة. SuiteFrame.

**الدليل وحدوده:** تحذير متصفح قبل الإصلاح، source diff والتحقق الحالي. [دليل1](<shots/46-account-mona-home-en.jpg>)

### UX-004 — Mona بصلاحيات فريق كانت بتتفوت من تحديث مساحة العمل

**P1 · اتصلح · المجهود:صغير**

**المكان:** `/sos/staff-invitations`. **المصدر:** [apps/sos/hooks/use-workspace.ts:21](<../../../apps/sos/hooks/use-workspace.ts#L21>).

**المشكلة:** استعلام workspace كان skipped لأي مستخدم عنده admin أو WM، حتى لو عضو/مالك في مساحة عمل.

**الأثر:** قائمة أدوات وبيانات مساحة العمل قد تختفي أو تفضل قديمة لمنى.

**الإصلاح وإعادة الاستخدام:** تم ربط skip بوجود accessToken وworkspaceContext بدل أدوار الفريق. Mona تقدر تستخدم نطاق الفريق ومساحة العمل. useWorkspace / SuiteFrame.

**الدليل وحدوده:** مصدر، اختبارات Mona والسياق، جولة Mona. [دليل1](<shots/53-account-staff-invitations-ar.jpg>)، [دليل2](<shots/54-account-staff-invitations-en.jpg>)

### UX-005 — صاحب أداة واحدة ملوش رجوع ثابت للـAccount Home من rail

**P1 · مفتوح · المجهود:صغير**

**المكان:** `أداة واحدة → /sos`. **المصدر:** [packages/ui/src/suite/useSuiteApps.tsx:19](<../../../packages/ui/src/suite/useSuiteApps.tsx#L19>)؛ [packages/ui/src/suite/SuiteFrame.tsx:34](<../../../packages/ui/src/suite/SuiteFrame.tsx#L34>).

**المشكلة:** Home بيتضاف لو tools.length>=2 بس، واللوجو في الحالة الأخرى يرجع لنفس الأداة.

**الأثر:** العضو يحتاج الحساب/الدعوات/طلب صلاحية لكن مدخل الرجوع غير واضح.

**الإصلاح وإعادة الاستخدام:** خلي Home ظاهر دايمًا، أو زر Account Home صريح في UserMenu. احتفظ بـadaptiveEntry للدخول الذكي؛ ما تحوّلوش لمنع الرجوع الاختياري. AppRail + UserMenu.

**الدليل وحدوده:** مصدر؛ حالة الأداة الواحدة في الجولة. [دليل1](<shots/87-files-only-member-no-home-rail-ar.jpg>)

### UX-006 — شاشة notYours بتقول ارجع للرئيسية بس

**P1 · مفتوح · المجهود:متوسط**

**المكان:** `/sos/go/[scope]`. **المصدر:** [apps/sos/app/go/[scope]/page.tsx:60](<../../../apps/sos/app/go/[scope]/page.tsx#L60>).

**المشكلة:** NoPermissionState في عدم امتلاك الأداة عنده Home فقط.

**الأثر:** المالك مش عارف يبدأ تجربة، والعضو مش عارف يطلب صلاحية أو يبدّل مساحة العمل.

**الإصلاح وإعادة الاستخدام:** اعرض سبب الحالة الفعلي، وConnectedFeature يفرّق trial للمالك وrequest للعضو، مع تغيير workspace. استخدم AccountHome trial()/request() وNoPermissionState.

**الدليل وحدوده:** المصدر سطر64 وجولة منع الوصول. [دليل1](<shots/82-nour-not-yours-hr-ar.jpg>)

### UX-007 — فتح المساحة بعد قبول الدعوة بيرجع للرئيسية في كل الحالات

**P2 · مفتوح · المجهود:صغير**

**المكان:** `/sos/invite/[token]`. **المصدر:** [apps/sos/components/invitations/WorkspaceInvitation.tsx:55](<../../../apps/sos/components/invitations/WorkspaceInvitation.tsx#L55>).

**المشكلة:** قبول الدعوة يتحقق من هوية المساحة صح، وبعده router.replace('/') بدون adaptiveEntry.

**الأثر:** العضو المدعو لأداة واحدة بياخد خطوة إضافية ومش بيكمل المهمة اللي الدعوة كانت عشانها.

**الإصلاح وإعادة الاستخدام:** استخدم adaptiveEntry بعد نجاح التحقق؛ لو الدعوة فيها هدف مسموح حافظ عليه. في الدعوة متعددة الأدوات افتح Home مع توضيح الأدوات المتاحة. AuthPanel + adaptiveEntry.

**الدليل وحدوده:** مصدر وجولة الدعوة. [دليل1](<shots/83-member-accepted-ar.jpg>)، [دليل2](<shots/85-member-first-run-home-ar.jpg>)

### UX-008 — الرئيسية في HR بتفضل شاشة بداية بدل ملخص عمل

**P2 · مفتوح · المجهود:متوسط**

**المكان:** `/hr/{en,ar}`. **المصدر:** [apps/hr/app/[locale]/(dashboard)/page.tsx:1](<../../../apps/hr/app/[locale]/(dashboard)/page.tsx#L1>).

**المشكلة:** الصفحة الأساسية فيها OnboardingChecklist وروابط حضور وبروفايل، حتى مع اكتمال الخطوات.

**الأثر:** المستخدم الراجع كل يوم يشوف الإعداد بدل الحضور/الطلبات/المهام اللي مستنياه.

**الإصلاح وإعادة الاستخدام:** اعرض ملخص حضور وطلبات ومهام onboarding من بيانات mock الحالية. اخفِ القائمة بعد الاكتمال أو اسمح بتأجيلها مع رابط مستقل لاستعادتها. PageHeader + OnboardingChecklist + States.

**الدليل وحدوده:** مصدر وجولة HR. [دليل1](<shots/98-hr-mona-main-ar.jpg>)، [دليل2](<shots/105-hr-ar-dark-390.jpg>)

### UX-009 — خمسة أزرار Edit في تفاصيل الموظف لا تعمل

**P1 · مفتوح · المجهود:متوسط**

**المكان:** `/hr/{en,ar}/employees/[id]`. **المصدر:** [apps/hr/components/pages/employee/details/EmployeeInfoSection.tsx:32](<../../../apps/hr/components/pages/employee/details/EmployeeInfoSection.tsx#L32>)؛ [apps/hr/components/pages/employee/details/PersonalInfoSection.tsx:26](<../../../apps/hr/components/pages/employee/details/PersonalInfoSection.tsx#L26>)؛ [apps/hr/components/pages/employee/details/SkillsSection.tsx:21](<../../../apps/hr/components/pages/employee/details/SkillsSection.tsx#L21>)؛ [apps/hr/components/pages/employee/details/BankInfoSection.tsx:165](<../../../apps/hr/components/pages/employee/details/BankInfoSection.tsx#L165>)؛ [apps/hr/components/pages/employee/details/SalaryInformationSection.tsx:52](<../../../apps/hr/components/pages/employee/details/SalaryInformationSection.tsx#L52>).

**المشكلة:** الأقسام الشخصية والوظيفة والمهارات والبنك والراتب تمرر onEdit فارغ. ضغطت تعديل بيانات الوظيفة في ملف Salma ولم يظهر Dialog أو فورم.

**الأثر:** الواجهة توعد بتعديل بيانات الوظيفة والبنك والراتب بدون أي استجابة.

**الإصلاح وإعادة الاستخدام:** اربطها بـCreateUpdateEmployeeSheet على القسم المناسب، بقيم الموظف الحالي وصلاحياته. لو تعديل القسم غير متاح اخفِ الفعل أو وضّح سببه؛ ما تسيبش فعل صامت. Button + Sheet + RHFField.

**الدليل وحدوده:** مصدر مباشر لكل الخمسة، ونقر فعلي على بيانات الوظيفة؛ صورة102. [دليل1](<shots/102-hr-employee-edit-noop-ar.jpg>)

### UX-010 — تأكيد حذف قسط قرض في payroll لا ينفّذ حذف

**P1 · مفتوح · المجهود:متوسط**

**المكان:** `/hr/{en,ar}/payroll`. **المصدر:** [apps/hr/components/pages/payroll/PayrollDetailsDraftSheet/index.tsx:410](<../../../apps/hr/components/pages/payroll/PayrollDetailsDraftSheet/index.tsx#L410>).

**المشكلة:** قسم Loan deductions يرسل onDeleteItem={()=>{}} إلى EditableSection اللي يعرض DeleteDialog.

**الأثر:** المستخدم ممكن يشوف تأكيد ينقفل ويظن القسط اتحذف وهو لسه موجود.

**الإصلاح وإعادة الاستخدام:** إما اربط الفعل بعملية إزالة القسط من التشغيل الحالية مع إعادة القراءة، أو أخفِ حذف الأقساط الآلية مع شرح تعديل القرض المصدر. ConfirmDialog لازم ينتظر العملية ويظل مفتوح عند الفشل.

**الدليل وحدوده:** مصدر؛ لم يُحذف قسط موجود لمجرد المراجعة. استنتاجمصدر؛ لايوجدادعاءفعلتجريبيغيرمنفذ.

### UX-011 — فشل تحميل تفاصيل الموظف بيتعرض كأنه الموظف مش موجود

**P1 · مفتوح · المجهود:صغير**

**المكان:** `/hr/{en,ar}/employees/[id]`. **المصدر:** [apps/hr/app/[locale]/(dashboard)/employees/[id]/page.tsx:43](<../../../apps/hr/app/[locale]/(dashboard)/employees/[id]/page.tsx#L43>)؛ [apps/hr/app/[locale]/(dashboard)/employees/[id]/page.tsx:105](<../../../apps/hr/app/[locale]/(dashboard)/employees/[id]/page.tsx#L105>).

**المشكلة:** الاستعلام يقرأ data وisLoading فقط؛ !employee يعرض notFound بدون تمييز isError أو 404.

**الأثر:** المستخدم يفهم إن السجل ضاع، ومفيش إعادة محاولة لمشكلة اتصال.

**الإصلاح وإعادة الاستخدام:** افصل loading، 404، 403 والفشل المؤقت. استخدم ErrorState مع refetch وNoPermissionState بدل جمعهم في notFound. نفس السياسة تنطبق على attachments/activity بداخل الصفحة.

**الدليل وحدوده:** مصدر؛ لا يوجد ادعاء أن جميع قوائم HR لها نفس العيب. استنتاجمصدر؛ لايوجدادعاءفعلتجريبيغيرمنفذ.

### UX-012 — إضافة مبلغ قرض للـpayroll بتستخدم قرض ثابت وبيانات افتراضية

**P1 · مفتوح · المجهود:متوسط**

**المكان:** `/hr/{en,ar}/payroll`. **المصدر:** [apps/hr/components/pages/payroll/AddLoanAmountSheet/index.tsx:49](<../../../apps/hr/components/pages/payroll/AddLoanAmountSheet/index.tsx#L49>)؛ [apps/hr/components/pages/payroll/AddLoanAmountSheet/index.tsx:69](<../../../apps/hr/components/pages/payroll/AddLoanAmountSheet/index.tsx#L69>).

**المشكلة:** الفورم يبدأ 30000/15000 ويبعث loanId:1 بدل القرض المختار.

**الأثر:** حتى في بروتوتايب تفاعلي، العملية ممكن ترتبط بقرض غير المقصود.

**الإصلاح وإعادة الاستخدام:** مرّر loanId وملخص القرض الحقيقي من السجل المختار، واحسب المتبقي من mock. لو مفيش قرض اختياره يظهر أولًا؛ امنع الإرسال بلا اختيار. Select + Field + Sheet.

**الدليل وحدوده:** مصدر؛ مش اختبار معاملة مالية حقيقية. استنتاجمصدر؛ لايوجدادعاءفعلتجريبيغيرمنفذ.

### UX-013 — اختيارات الترجمة بتخلط النص بمعرّفات وأسماء صور

**P1 · مفتوح · المجهود:متوسط**

**المكان:** `/wm/{en,ar}/localization/drafts`. **المصدر:** [apps/wm/components/studio/TranslationDrafts.tsx:11](<../../../apps/wm/components/studio/TranslationDrafts.tsx#L11>)؛ [mock/apps/wm/studio.js:24](<../../../mock/apps/wm/studio.js#L24>)؛ [mock/apps/wm/studio.js:61](<../../../mock/apps/wm/studio.js#L61>).

**المشكلة:** الاختيار يعرض path وmarkup وقيم image زي brand-cards.webp؛ استخراج كل strings باستبعادات محدودة يسمح بقيم غير نصية للمستخدم.

**الأثر:** المراجع ممكن يترجم أصل صورة أو يختار نص غلط؛ الضرر على البيانات مستنتج من كتابة نفس path في المصدر.

**الإصلاح وإعادة الاستخدام:** اعمل schema مسموح لحقول الترجمة، واستبعد asset references. اعرض اسم مكان النص ومعاينة plain text ونوع المحتوى، والـpath كتفصيل ثانوي. Select + Field + ErrorState.

**الدليل وحدوده:** A02 وقراءة studio.js؛ لم يتم نشر ترجمة أو تغيير أصل صورة. [دليل1](<shots/assessment-a/a02-translation-fields-en.jpg>)

### UX-014 — إنشاء الإصدار قائمة طويلة من غير بحث أو حد ظاهر

**P2 · مفتوح · المجهود:متوسط**

**المكان:** `/wm/{en,ar}/releases`. **المصدر:** [apps/wm/components/studio/Releases.tsx:10](<../../../apps/wm/components/studio/Releases.tsx#L10>)؛ [mock/apps/wm/studio.js:56](<../../../mock/apps/wm/studio.js#L56>).

**المشكلة:** العينة فيها29 checkbox؛ السيرفر يقبل20 فقط. مفيش عداد يمنع اختيار21 أو بحث، وزر الإنشاء بعد آخر القائمة.

**الأثر:** الاختيار صعب، والفشل ييجي بعد مجهود المستخدم.

**الإصلاح وإعادة الاستخدام:** خلي الإصدارات الموجودة أولًا، وإنشاء الإصدار في Dialog/مساحة مستقلة فيها بحث ونوع وحالة و0 من20 وملخص المنتقى. ثبّت إجراء الإنشاء. DataTable + BulkActionBar + Dialog + PageHeader.

**الدليل وحدوده:** A03، صور08/17، حد السيرفر inspected. [دليل1](<shots/assessment-a/a03-releases-en.jpg>)

### UX-015 — استيراد الوسائط يزاحم مكتبة الوسائط

**P2 · مفتوح · المجهود:صغير إلى متوسط**

**المكان:** `/wm/{en,ar}/media`. **المصدر:** [apps/wm/app/[locale]/(app)/media/page.tsx:72](<../../../apps/wm/app/[locale]/(app)/media/page.tsx#L72>)؛ [apps/wm/components/studio/PackagedMedia.tsx:9](<../../../apps/wm/components/studio/PackagedMedia.tsx#L9>).

**المشكلة:** PackagedMedia يظهر قبل الفلاتر والشبكة، ويخلط import وtagging في حقل واحد.

**الأثر:** الوصول للصور الموجودة بياخد تمرير، ومهمة الوسوم تتفهم بصعوبة.

**الإصلاح وإعادة الاستخدام:** البحث والشبكة أولًا؛ زر Import samples في PageHeader يفتح Dialog. بعد تحديد صور أظهر BulkActionBar بعدّاد وتعديل الوسوم. حافظ على شرح أنها عينات مرفقة.

**الدليل وحدوده:** صور11/20 وA04. [دليل1](<shots/11-wm-media-en.jpg>)، [دليل2](<shots/20-wm-media-ar.jpg>)

### UX-016 — WM وConsole من غير حدود صفحات واضحة للأخطاء والانتظار

**P2 · مفتوح · المجهود:متوسط**

**المكان:** `/wm/[locale]/* و/admin/[locale]/*`. **المصدر:** [apps/wm/app/[locale]/layout.tsx:36](<../../../apps/wm/app/[locale]/layout.tsx#L36>)؛ [apps/admin/app/[locale]/layout.tsx:35](<../../../apps/admin/app/[locale]/layout.tsx#L35>).

**المشكلة:** توجد حالات resource محلية جيدة لكن لا توجد ملفات error.tsx/loading.tsx/not-found.tsx في route trees لهذين التطبيقين.

**الأثر:** خطأ render أو عنوان غير صحيح يخرج من لغة وشكل المنتج المعتاد.

**الإصلاح وإعادة الاستخدام:** أضف حدود route محلية ومترجمة باستخدام ErrorState/LoadingState/EmptyState مع رجوع آمن وإعادة محاولة. احتفظ بحالات الاستعلام الموجودة بدل تكرارها.

**الدليل وحدوده:** فحص شجرة الملفات الحالية؛ A08 مثال صفحة Next العامة قبل إصلاح الرابط. [دليل1](<shots/assessment-a/a08-setup-checklist-404.jpg>)

### UX-017 — تبديل أداة في كتالوج Console يمسح المسودة غير المحفوظة

**P1 · مفتوح · المجهود:متوسط**

**المكان:** `/admin/{en,ar}/catalog/software`. **المصدر:** [apps/admin/components/console/SoftwareCatalog/index.tsx:25](<../../../apps/admin/components/console/SoftwareCatalog/index.tsx#L25>)؛ [apps/admin/components/console/SoftwareCatalog/index.tsx:27](<../../../apps/admin/components/console/SoftwareCatalog/index.tsx#L27>).

**المشكلة:** تغيير selected يعمل form.reset، وsetValue لا يرسل shouldDirty. مفيش مسودة منفصلة أو تأكيد قبل التبديل.

**الأثر:** وصف كتبته بعدة لغات ممكن يضيع عند المقارنة بأداة ثانية.

**الإصلاح وإعادة الاستخدام:** اضبط shouldDirty واحفظ مسودة لكل أداة أو اعرض Save/Discard/Stay قبل التبديل والخروج. ConfirmDialog + LocalizedField. اختبر رجوع المسودة بعد تبديل الأداة.

**الدليل وحدوده:** استنتاج مباشر من المصدر المفتوح؛ تقييم B2. لم يُنفّذ فقد مسودة بالكتابة ولم يُنشر محتوى. [دليل1](<shots/23-console-software-ar.jpg>)

### UX-018 — خطأ LocalizedField مش مرتبط بالحقل نفسه

**P2 · مفتوح · المجهود:صغير**

**المكان:** `حقول اللغات في Console وWM`. **المصدر:** [packages/ui/src/components/LocalizedField.tsx:116](<../../../packages/ui/src/components/LocalizedField.tsx#L116>)؛ [packages/ui/src/components/LocalizedField.tsx:127](<../../../packages/ui/src/components/LocalizedField.tsx#L127>).

**المشكلة:** aria-invalid موجود؛ رسالة الخطأ لا تملك id، ولا aria-describedby يربطها بالـControl.

**الأثر:** قارئ الشاشة لا يضمن قراءة السبب مع الحقل؛ نص checkFields العام لا يحدد التصحيح.

**الإصلاح وإعادة الاستخدام:** أنشئ id ثابت لكل hint/error واربطه بالحقل، مع وصف اللغة والسبب المحدد. إعادة استخدام LocalizedField/Field بدل إصلاح كل مستهلك وحده. تحقق بقارئ شاشة في اختبار مخصص.

**الدليل وحدوده:** مصدر B4؛ توجد labels صحيحة، ولا يوجد ادعاء أن كل الحقول غير مسماة. استنتاجمصدر؛ لايوجدادعاءفعلتجريبيغيرمنفذ.

### UX-019 — نجاح نشر بيانات الكتالوج مش واضح

**P2 · مفتوح · المجهود:صغير**

**المكان:** `/admin/{en,ar}/catalog/software`. **المصدر:** [apps/admin/components/console/SoftwareCatalog/index.tsx:27](<../../../apps/admin/components/console/SoftwareCatalog/index.tsx#L27>)؛ [apps/admin/lib/console.ts:57](<../../../apps/admin/lib/console.ts#L57>).

**المشكلة:** النجاح يعمل refresh عام بدون رسالة نجاح محلية؛ زر النشر أسفل أول viewport.

**الأثر:** المستخدم قد يعيد النشر لأنه لا يرى تأكيد نتيجة الفعل.

**الإصلاح وإعادة الاستخدام:** اعرض حالة Published مع الوقت واسم الأداة بـrole=status، واجعل actionbar واضحة للفورم الطويل. PageHeader + Button + States/toast.

**الدليل وحدوده:** مصدر وDOM B3؛ refresh موجود ولا يوجد ادعاء أن البيانات لا تتحدث. [دليل1](<shots/23-console-software-ar.jpg>)

### UX-020 — Console setup مكرر وسبب الزر المعطل غير ظاهر

**P2 · مفتوح · المجهود:متوسط**

**المكان:** `/admin/{en,ar}/setup`. **المصدر:** [apps/admin/components/console/Setup/index.tsx:12](<../../../apps/admin/components/console/Setup/index.tsx#L12>).

**المشكلة:** نفس المهام في checklist ثم قائمة الأفعال؛ staff verification معطل بسبب !step.ready بدون تفسير.

**الأثر:** المستخدم يقرأ القرار مرتين ولا يعرف المطلوب لفتح الفعل.

**الإصلاح وإعادة الاستخدام:** ادمج رابط الوجهة وحالة الجاهزية وتسجيل المراجعة في صف واحد؛ اشرح الاعتماد واربط بصفحة أمان الفريق. OnboardingChecklist + Field/help + Button.

**الدليل وحدوده:** صور26/37/69/71؛ العيب الباقي بعد إصلاح href. [دليل1](<shots/69-console-setup-fixed-ar.jpg>)

### UX-021 — حالة Tax checks الفاضية بتتكلم عن الفواتير

**P2 · مفتوح · المجهود:صغير**

**المكان:** `/admin/{en,ar}/tax/checks`. **المصدر:** [apps/admin/components/console/TaxChecks/index.tsx:19](<../../../apps/admin/components/console/TaxChecks/index.tsx#L19>).

**المشكلة:** empty.title يستخدم noInvoices.

**الأثر:** القائمة تبان كأنها غلط أو مرتبطة بفواتير بدل فحص ضريبي تجريبي.

**الإصلاح وإعادة الاستخدام:** اكتب لا توجد فحوص بعد مع فعل اختيار workspace وإجراء فحص mock، واحفظ حدود المحاكاة. EmptyState + PageHeader.

**الدليل وحدوده:** صور29/40 والمصدر. [دليل1](<shots/29-console-tax-ar.jpg>)، [دليل2](<shots/40-console-tax-en.jpg>)

### UX-022 — وصف روابط الإيكوسيستم بالإنجليزي داخل العربية

**P2 · مفتوح · المجهود:متوسط**

**المكان:** `/admin/ar/ecosystem`. **المصدر:** [apps/admin/components/console/Ecosystem/index.tsx:10](<../../../apps/admin/components/console/Ecosystem/index.tsx#L10>).

**المشكلة:** connector.data.join يعرض أوصاف المصدر الإنجليزية مباشرة، والعناوين IDs بحروف كبيرة.

**الأثر:** تفاصيل العلاقة أهم من عنوانها، لكن فهمها أصعب للمستخدم العربي.

**الإصلاح وإعادة الاستخدام:** ترجم نوع البيانات من معرف ثابت في ConsoleV3، واستخدم أسماء SUITE_TOOLS المترجمة؛ بيانات المستخدم تظل كما أدخلها. Card + Badge + catalogs.

**الدليل وحدوده:** صور24/35 والمصدر. [دليل1](<shots/35-console-ecosystem-en.jpg>)

### UX-023 — تفاصيل فاتورة مفتوحة للمالك مفيهاش طريق دفع مباشر

**P1 · مفتوح · المجهود:متوسط**

**المكان:** `/sos/billing/invoices/inv_1030`. **المصدر:** [apps/sos/components/workspace/billing/InvoiceView.tsx:37](<../../../apps/sos/components/workspace/billing/InvoiceView.tsx#L37>).

**المشكلة:** أفعال PageHeader فيها طباعة فقط. رابط دفع mock موجود في مسار مستقل بعد ما الفريق ينشئه.

**الأثر:** المالك يشوف Open/No payment yet لكن لازم يطلب تدخل فريق للوصول للفعل.

**الإصلاح وإعادة الاستخدام:** لو الفاتورة قابلة للدفع، اعرض إجراء Open mock payment مرتبط بنطاق نفس المساحة، أو شرح واضح لطلب رابط. Button + PageHeader + OwnerPayLink، بدون أي مزود حقيقي.

**الدليل وحدوده:** صورة49؛ الرابط التجريبي51/52 تحقق أنه يعمل. [دليل1](<shots/49-owner-unpaid-invoice-en.jpg>)، [دليل2](<shots/51-owner-pay-link-en.jpg>)

### UX-024 — إنشاء رابط دفع نتيجته وراء درج الفاتورة

**P2 · مفتوح · المجهود:متوسط**

**المكان:** `/admin/{en,ar}/billing`. **المصدر:** [apps/admin/components/console/BillingOperations/index.tsx:27](<../../../apps/admin/components/console/BillingOperations/index.tsx#L27>)؛ [apps/admin/components/console/BillingOperations/index.tsx:32](<../../../apps/admin/components/console/BillingOperations/index.tsx#L32>).

**المشكلة:** run يعملrefresh والنتيجة تظهر في قائمة payLinks أسفل الصفحة، وليس مكان الفعل. لا رسالة نجاح مميزة.

**الأثر:** الفريق قد ينشئ أكثر من رابط أو لا يعرف أين ينسخه.

**الإصلاح وإعادة الاستخدام:** ارجع نتيجة العملية واعرض داخل الدرج الرابط والحالة والانتهاء وزر Copy وrole=status، وحافظ على سياق الفاتورة أثناءrefresh. Sheet + States + Button.

**الدليل وحدوده:** المصدر وتجربة إنشاء paylink_1057 المحلية؛ صور50/51. [دليل1](<shots/50-console-payment-drawer-en.jpg>)، [دليل2](<shots/51-owner-pay-link-en.jpg>)

### UX-025 — UTM ممكن يفقد تعديل غير محفوظ والـbuilder يستخدم المحفوظ فقط

**P2 · مفتوح · المجهود:متوسط**

**المكان:** `/marketing/{en,ar}/settings/utm`. **المصدر:** [apps/marketing/components/pages/utm-settings/index.tsx:35](<../../../apps/marketing/components/pages/utm-settings/index.tsx#L35>)؛ [apps/marketing/components/pages/utm-settings/index.tsx:48](<../../../apps/marketing/components/pages/utm-settings/index.tsx#L48>).

**المشكلة:** form.reset على بيانات الاستعلام؛ توليد الرابط من query.data.settings وليس القيم اللي المستخدم يعدلها.

**الأثر:** المستخدم يظن الرابط يعكس المكتوب بينما لسه يعكس آخر حفظ، والخروج يفقد المسودة.

**الإصلاح وإعادة الاستخدام:** اربط معاينة الرابط بـform.watch أو سمّه آخر إعدادات محفوظة مع حالة Unsaved. أضف حفظ/تجاهل عند الخروج. RHFField + Field + ConfirmDialog + States.

**الدليل وحدوده:** صور56/57 ومصدر؛ لا ادعاء بتتبع زيارات فعلي. [دليل1](<shots/56-marketing-utm-en.jpg>)، [دليل2](<shots/57-marketing-utm-ar.jpg>)

### UX-026 — شريط التطبيقات يقص التسميات ويظهر تمرير أفقي صغير

**P2 · مفتوح · المجهود:صغير**

**المكان:** `كل أدوات Mona على desktop`. **المصدر:** [packages/ui/src/shell/SuiteShell.tsx:25](<../../../packages/ui/src/shell/SuiteShell.tsx#L25>)؛ [packages/ui/src/shell/SuiteShell.tsx:37](<../../../packages/ui/src/shell/SuiteShell.tsx#L37>)؛ [packages/ui/src/shell/SuiteShell.tsx:51](<../../../packages/ui/src/shell/SuiteShell.tsx#L51>).

**المشكلة:** rail بعرض76، وروابط64، مع scrollbar رأسي. في عينةB clientWidth61 وscrollWidth62؛ Console/HR أسماءها مقصوصة.

**الأثر:** الوصول للتطبيق الأقل استخدامًا أصعب، وقد يلتبس اسم الوجهة.

**الإصلاح وإعادة الاستخدام:** احسب العرض داخل المساحة الفعلية وامنع overflow-x، ولف الاسم على سطرين أو اعرض Tooltip للاسم الكامل مع focus. AppRail + Tooltip؛ تحقق في AR وEN وموبايل.

**الدليل وحدوده:** صور02–72 وقياسB؛ الأسماء accessible كاملة وليست أزرار بلا تسمية. [دليل1](<shots/02-wm-overview-en.jpg>)

### UX-027 — تعديل بند payroll يقفل قبل معرفة نتيجة الحفظ

**P2 · مفتوح · المجهود:متوسط**

**المكان:** `/hr/{en,ar}/payroll`. **المصدر:** [apps/hr/components/pages/payroll/PayrollDetailsDraftSheet/index.tsx:530](<../../../apps/hr/components/pages/payroll/PayrollDetailsDraftSheet/index.tsx#L530>)؛ [apps/hr/components/pages/payroll/PayrollDetailsDraftSheet/index.tsx:534](<../../../apps/hr/components/pages/payroll/PayrollDetailsDraftSheet/index.tsx#L534>)؛ [apps/hr/components/pages/payroll/PayrollDetailsDraftSheet/index.tsx:183](<../../../apps/hr/components/pages/payroll/PayrollDetailsDraftSheet/index.tsx#L183>).

**المشكلة:** EditableRow يستدعي onSave ثم setIsEditing(false) مباشرة؛ المعالج async يلتقط الفشل في console.

**الأثر:** المسودة تختفي قبل تأكيد العملية؛ الرجوع والتصحيح أصعب عند الفشل.

**الإصلاح وإعادة الاستخدام:** اجعل onSave Promise منتظرة، عطّل الإرسال أثناء الحفظ، وأبقِ الفورم وقيمه عند الفشل مع Field error/role=alert وإعادة محاولة. RHFField + Button + ErrorState.

**الدليل وحدوده:** مصدر؛ delete adjustments العادي عنده DeleteDialog فعلي، وليس هو العيب. استنتاجمصدر؛ لايوجدادعاءفعلتجريبيغيرمنفذ.

### UX-028 — تنبيه React script أثناء تغيير اللغة في WM

**P3 · مفتوح · المجهود:صغير إلى متوسط**

**المكان:** `تغيير EN→AR داخل WM`. **المصدر:** [packages/ui/src/theme/theme-script.tsx:16](<../../../packages/ui/src/theme/theme-script.tsx#L16>)؛ [apps/wm/app/[locale]/layout.tsx:37](<../../../apps/wm/app/[locale]/layout.tsx#L37>).

**المشكلة:** ظهر تحذير أن script داخل React client render لن يتنفذ، بعد تغيير اللغة. مصدرThemeScript يرسمscript فيhead.

**الأثر:** يشوّش تشخيص dev؛ لم يثبت كسر لغة أوTheme من هذا التنبيه وحده.

**الإصلاح وإعادة الاستخدام:** راجع انتقال root layout وتهيئةThemeScript بحيث يبقىbootstrap قبل أولpaint فقط، معthemeAttributes وuseTheme للنقل. تحقق من تبديل اللغة فيlight/dark بدونتحذير جديد.

**الدليل وحدوده:** console timestamp2026-10-13T14:52:29Z، UI العربية اشتغلت. عدم ادعاء خطأ API. استنتاجمصدر؛ لايوجدادعاءفعلتجريبيغيرمنفذ.

### UX-029 — روابط إدارة أربع أدوات كانت بتفقد جزء اللغة

**P1 · اتصلح · المجهود:صغير**

**المكان:** `/{files,hr,sales,marketing}/ar/admin`. **المصدر:** [apps/files/components/workspace/FilesAdmin.tsx:42](<../../../apps/files/components/workspace/FilesAdmin.tsx#L42>)؛ [apps/hr/app/[locale]/(dashboard)/admin/[[...section]]/page.tsx:1](<../../../apps/hr/app/[locale]/(dashboard)/admin/[[...section]]/page.tsx#L1>)؛ [apps/sales/app/[locale]/(dashboard)/admin/[[...section]]/page.tsx:7](<../../../apps/sales/app/[locale]/(dashboard)/admin/[[...section]]/page.tsx#L7>)؛ [apps/marketing/app/[locale]/(dashboard)/admin/[[...section]]/page.tsx:27](<../../../apps/marketing/app/[locale]/(dashboard)/admin/[[...section]]/page.tsx#L27>).

**المشكلة:** ToolAdminScreen كان يستخدم /admin افتراضي بدل مسار الإدارة باللغة الحالية.

**الأثر:** التنقل بين تبويبات الإدارة قد يخرج من اللغة أو يفتح وجهة غير صحيحة.

**الإصلاح وإعادة الاستخدام:** تم تمرير basePath المبني من locale، بنفس نمط Tasks. Files→Roles وHR→Roles وCRM→Settings وMarketing→Settings اتفتحوا بالعربي. ToolAdminScreen + routing الموجود.

**الدليل وحدوده:** مصدر وtypecheck الأربعة، صور93/94/115/118/121. [دليل1](<shots/94-files-admin-roles-localized-ar.jpg>)، [دليل2](<shots/115-hr-admin-roles-localized-ar.jpg>)، [دليل3](<shots/118-marketing-admin-settings-localized-ar.jpg>)، [دليل4](<shots/121-crm-admin-settings-localized-ar.jpg>)

### UX-030 — تسعير checkout المحلي كان يرجع503

**P1 · اتصلح · المجهود:متوسط**

**المكان:** `/checkout → /sos/api/backend/sos/v1/public/website-quotes`. **المصدر:** [tools/services/local-order-key.cjs:7](<../../../tools/services/local-order-key.cjs#L7>)؛ [tools/services/local.cjs:57](<../../../tools/services/local.cjs#L57>)؛ [mock/apps/admin/website-offers.js:134](<../../../mock/apps/admin/website-offers.js#L134>).

**المشكلة:** الـlauncher المعزول يشيل credentials الخارجية، لكن وضع Services يتطلب سلطة توقيع للطلب؛ من غير مفتاح محلي quote كان order_service_unavailable.

**الأثر:** المستخدم لا يقدر يكمل رحلة شراء تجريبية رغم اختيارات سلة صحيحة.

**الإصلاح وإعادة الاستخدام:** الـlauncher يولد مفتاحًا عشوائيًا ثابتًا في ملف ignored محلي ويعيد استخدامه؛ القيمة الفاسدة تفشل بدل تبديلها. حماية hosted لم تتغير. PurchasePriceStatus + PurchaseCheckout الحاليين.

**الدليل وحدوده:** 23 اختبار order/key، وPay واحد تجريبي CHF16: الطلبORG-FDAEC694، Tasks مفعّل، وفاتورة واحدة مدفوعة. W12–W16. [دليل1](<shots/assessment-a-website/w13-postfix-purchase-confirmed-en.jpg>)، [دليل2](<shots/assessment-a-website/w14-postfix-tasks-handoff-en.jpg>)، [دليل3](<shots/assessment-a-website/w15-postfix-paid-invoice-en.jpg>)

### UX-031 — المجلد المؤرشف مالوش استعادة من الواجهة الرئيسية

**P1 · اتصلح · المجهود:صغير**

**المكان:** `/files/ar/archived-files`. **المصدر:** [apps/files/components/workspace/FileWorkspace.tsx:591](<../../../apps/files/components/workspace/FileWorkspace.tsx#L591>).

**المشكلة:** زر المجلدات يبدّل state لكن شرط view!=trash كان يمنع ظهور أي panel في شاشة المؤرشف.

**الأثر:** أرشفة مجلد قابلة للاسترجاع في API لكنها كانت طريق مسدود من هذه الواجهة.

**الإصلاح وإعادة الاستخدام:** تم عرض ArchivedFolders الموجودة أصلًا عند فتح المجلدات في trash؛ AllFiles يستمر في غيرها. اتعمل إنشاء/تسمية/أرشفة/استعادة لمجلد UX الخاص وظهر تاني في المكتبة.

**الدليل وحدوده:** 90 قبل الإصلاح؛95 لوحة الاستعادة؛96 المجلد ظاهر بعد الاستعادة؛ Files typecheck. [دليل1](<shots/90-folder-archive-trash-view-ar.jpg>)، [دليل2](<shots/95-folder-recovery-panel-fixed-ar.jpg>)، [دليل3](<shots/96-folder-restored-success-ar.jpg>)

### UX-032 — نسبة المقاعد في RTL ممكن تتقري بالعكس

**P2 · مفتوح · المجهود:صغير**

**المكان:** `/{tasks,files,sales}/ar/admin`. **المصدر:** [packages/ui/src/suite/ToolAdminScreen.tsx:45](<../../../packages/ui/src/suite/ToolAdminScreen.tsx#L45>).

**المشكلة:** المصدر يبني assigned / capacity كنص غير معزول. مثل13 من15 ظهر بصريًا15/13 في لقطة Tasks العربية.

**الأثر:** المسؤول ممكن يفهم إن السعة متجاوزة أو يقرأ المقام كبسط.

**الإصلاح وإعادة الاستخدام:** استخدم نص مترجم «13 مستخدم من15» أو bdi dir=ltr للمعادلة كاملة مع label واضح، وطبّق نفس القرار على usage. Stat + useFormatter.

**الدليل وحدوده:** 74/93 ومصدر؛ لا يوجد ادعاء أن الأعداد المخزنة خطأ. [دليل1](<shots/74-tasks-admin-mona-ar.jpg>)، [دليل2](<shots/93-files-admin-localized-ar.jpg>)

### UX-033 — تهيئة عضو Files-only تطلب أول مهمة في Tasks

**P2 · مفتوح · المجهود:متوسط**

**المكان:** `/sos → دعوة Files-only`. **المصدر:** [apps/sos/components/account/AccountSettings.tsx:45](<../../../apps/sos/components/account/AccountSettings.tsx#L45>).

**المشكلة:** العضو الجديد عنده Files فقط، لكن checklist فيها firstTask وترجع /tools لأن Tasks غير متاحة.

**الأثر:** العضو يشوف مهمة مطلوبه خارج صلاحياته بدل أول عمل مفيد في Files.

**الإصلاح وإعادة الاستخدام:** اشتق الخطوات من أدوات العضو وصلاحياته: أول ملف/فتح ملف مشترك لعضو Files، وأول مهمة فقط لمن عنده Tasks. OnboardingChecklist + adaptiveEntry؛ نفس خطوات الخادم ترتبط بإنجاز حقيقي.

**الدليل وحدوده:** 85 ورحلة قبول الدعوة83، والمصدر. [دليل1](<shots/85-member-first-run-home-ar.jpg>)

### UX-034 — إشعارات النظام الإنجليزية باقية داخل Account العربي

**P2 · مفتوح · المجهود:متوسط**

**المكان:** `/sos بالعربي`. **المصدر:** [apps/sos/components/account/AccountHome.tsx:24](<../../../apps/sos/components/account/AccountHome.tsx#L24>).

**المشكلة:** row.title يعرض مباشرة حتى لعناوين النظام مثلNew reply وNew contract؛ أسماء مشاريع المستخدم المختلفة شيء منفصل.

**الأثر:** التنبيه اللي يحدد الخطوة التالية مش متسق مع لغة بقية الصفحة.

**الإصلاح وإعادة الاستخدام:** خزّن event key ومعاملاته وترجم وقت العرض؛ أسماء العمل والمحتوى المكتوب يظلوا dir=auto. AccountHome + catalogs + useFormatter.

**الدليل وحدوده:** 75؛ المصدر يثبت المرور المباشر، ولا نطلب ترجمة أسماء الأشخاص/الملفات. [دليل1](<shots/75-nour-owner-home-ar.jpg>)

### UX-035 — قائمة كل المجلدات تزاحم الملفات خصوصًا390px

**P2 · مفتوح · المجهود:متوسط**

**المكان:** `/files/ar`. **المصدر:** [apps/files/components/workspace/FileWorkspace.tsx:535](<../../../apps/files/components/workspace/FileWorkspace.tsx#L535>).

**المشكلة:** كل مجلد قابل للكتابة يتحول لشريحة نقل فوق الجدول؛ القائمة الحالية طويلة، ومعها مرشح مجلد آخر.

**الأثر:** المستخدم لازم يمرر قبل أول ملف؛ وظائف النقل تظهر حتى قبل اختيار ملفات.

**الإصلاح وإعادة الاستخدام:** خلي Tree/Combobox واحد للتصفح، وأظهر وجهة النقل في BulkActionBar بعد التحديد. احتفظ بقائمة مختصرة للأماكن المثبتة وادعم drop على الشجرة. Toolbar + Combobox + BulkActionBar.

**الدليل وحدوده:** 84/96 علىdesktop و104 على390px؛ المجلدات بيانات تجريبية فعلية. [دليل1](<shots/84-files-mona-main-ar.jpg>)، [دليل2](<shots/104-files-ar-dark-390.jpg>)

### UX-036 — Files يرندر main جوه main

**P2 · مفتوح · المجهود:صغير**

**المكان:** `/files/ar`. **المصدر:** [apps/files/components/workspace/FileWorkspace.tsx:317](<../../../apps/files/components/workspace/FileWorkspace.tsx#L317>)؛ [packages/ui/src/shell/SuiteShell.tsx:261](<../../../packages/ui/src/shell/SuiteShell.tsx#L261>).

**المشكلة:** الـDOM فيه main من shell ثم main من FileWorkspace.

**الأثر:** معالم قارئ الشاشة تبقى مكررة بدل وجهة محتوى واحدة.

**الإصلاح وإعادة الاستخدام:** حوّل غلاف FileWorkspace إلى section/div باسم مناسب، وسيب main وهدفskip link للـSuiteShell فقط. SuiteFrame + PageHeader.

**الدليل وحدوده:** DOM المفتوح لشاشة Files؛ المصدر؛ لا يوجد ادعاء اختبار قارئ شاشة كامل. استنتاجمصدر؛ لايوجدادعاءفعلتجريبيغيرمنفذ.

### UX-037 — CRM يقبل contact ناقص عند الإنشاء ويمنع تعديل اسمه بعده

**P1 · مفتوح · المجهود:متوسط**

**المكان:** `/sales/en/customers/[id]`. **المصدر:** [apps/sales/schemas/crm-v3.ts:35](<../../../apps/sales/schemas/crm-v3.ts#L35>)؛ [apps/sales/schemas/customers.ts:14](<../../../apps/sales/schemas/customers.ts#L14>)؛ [apps/sales/schemas/customers.ts:15](<../../../apps/sales/schemas/customers.ts#L15>)؛ [apps/sales/components/dialogs/customers/UpdateCustomerDialog/index.tsx:49](<../../../apps/sales/components/dialogs/customers/UpdateCustomerDialog/index.tsx#L49>).

**المشكلة:** إنشاء UX Audit B CRM نجح بهاتف فارغ، بلاAddress في الفورم. Edit details رفض تعديل الاسم والشركة حتى نضيف هاتف وعنوان.

**الأثر:** تصحيح اسم lead صحيح يتطلب معلومات لا يحتاجها هذا التعديل؛ المستخدم قد يدخل بيانات مختلقة لتجاوز المنع.

**الإصلاح وإعادة الاستخدام:** وحّد create/edit لمستوىlead، أوPATCH جزئي يحافظ على الحقول الفارغة المقبولة. بيانات تحويل lead لعميل تطلب وقت التحويل. FormDialog + RHFField + نفسschema. قبول: تعديل الاسم فقط في السجل الجديد ينجح.

**الدليل وحدوده:** B03–B07؛ تعديل مكتمل محفوظ ورجع بعد فتحهB17؛ root فتح B06 والمصدر. [دليل1](<shots/assessment-b-tools/06-crm-edit-validation.jpg>)، [دليل2](<shots/assessment-b-tools/17-crm-retained-after-revisit.jpg>)

### UX-038 — Marketing يبدأ بإعداد طويل يخفي العمل وتنبيهsync

**P2 · مفتوح · المجهود:متوسط**

**المكان:** `/marketing/{en,ar}/dashboard`. **المصدر:** [apps/marketing/app/[locale]/(dashboard)/dashboard/page.tsx:6](<../../../apps/marketing/app/[locale]/(dashboard)/dashboard/page.tsx#L6>)؛ [apps/marketing/components/shared/MarketingOnboarding/index.tsx:44](<../../../apps/marketing/components/shared/MarketingOnboarding/index.tsx#L44>).

**المشكلة:** checklist2/4 قبل dashboard، بدونcollapse/dismiss حتى كل الخطوات تكتمل.

**الأثر:** أرقام الشهر والعمل المنتظر وتنبيه إعادة الربط ينزلوا تحت أول شاشة حتى فيdesktop1536×735.

**الإصلاح وإعادة الاستخدام:** ابدأ بالمشروع والتنبيه والموافقات، ثم شريط «فاضل خطوتين» يتمدد عند الطلب. OnboardingChecklist + BannerRegion + PageHeader. حافظ على تقدم البيانات الحقيقي.

**الدليل وحدوده:** B09 و112 على390px؛ root فتح الصورتين والمصدر. [دليل1](<shots/assessment-b-tools/09-marketing-main.jpg>)، [دليل2](<shots/112-marketing-ar-dark-390.jpg>)

### UX-039 — اسم وجهة CRM يتغيّر خلال نفس الرحلة

**P3 · مفتوح · المجهود:صغير**

**المكان:** `/sales/en/customers`. **المصدر:** [apps/sales/messages/en.json:313](<../../../apps/sales/messages/en.json#L313>)؛ [apps/sales/messages/en.json:1497](<../../../apps/sales/messages/en.json#L1497>).

**المشكلة:** القائمةCustomers، الشاشةContacts، breadcrumbCustomers and leads، وMarketing يسميهاCRM contact records.

**الأثر:** المستخدم الجديد محتاج يربط المصطلحات بنفسه قبل التمييز بينlead وcustomer.

**الإصلاح وإعادة الاستخدام:** اسم أساسي موحد للقائمة والعنوان «Contacts» مثلًا، وحالةLead/Customer داخل السجل. Sidebar + PageHeader + catalogs؛ القرار منPM حسب معنى المنتج.

**الدليل وحدوده:** B03/B17 وقراءة الكتالوج؛ تغيير المصطلح يحتاج قرار منتج. [دليل1](<shots/assessment-b-tools/03-crm-create-form.jpg>)

### UX-040 — قائمة لغة الموقع التجاري بتغير الشارة بس

**P1 · مفتوح · المجهود:صغير للتوجيه، متوسط للمحتوى**

**المكان:** `/cart و/ar/cart`. **المصدر:** [apps/website/landing-directions/src/reference/LanguageMenu.jsx:13](<../../../apps/website/landing-directions/src/reference/LanguageMenu.jsx#L13>)؛ [apps/website/landing-directions/src/reference/LanguageMenu.jsx:71](<../../../apps/website/landing-directions/src/reference/LanguageMenu.jsx#L71>)؛ [apps/website/landing-directions/src/reference/SiteHeader.jsx:93](<../../../apps/website/landing-directions/src/reference/SiteHeader.jsx#L93>).

**المشكلة:** اختيارAR غيّر selected المحلي وبقيURL/cart وlang=en/dir=ltr. فتح/ar/cart مباشرة RTL لكن الشارةEN والمحتوى التجاري أغلبهEN.

**الأثر:** المستخدم يظن الصفحة اتحولت للعربية بينما اللغة والقراءة لم تتغير.

**الإصلاح وإعادة الاستخدام:** اشتق الشارة منcurrentLocale، ووجّه لنفسpathname/query/hash باللغة المطلوبة، وانشر نصوص التجارة بدل badge شكلي. LanguageMenu + locale/content الموجودين؛ اجعل اللغات المنشورة واضحة.

**الدليل وحدوده:** W07/W08 و119 على390px؛ root فتح الصورة والمصدر. [دليل1](<shots/assessment-a-website/w07-cart-language-ar-still-en.jpg>)، [دليل2](<shots/119-website-cart-ar-390.jpg>)

### UX-041 — شرح الضريبة وأرقام التقدير يخرجوا من كارت ملخص السلة

**P2 · مفتوح · المجهود:صغير**

**المكان:** `/cart و/ar/cart قبلquote`. **المصدر:** [apps/website/landing-directions/src/reference/PurchaseUI.jsx:165](<../../../apps/website/landing-directions/src/reference/PurchaseUI.jsx#L165>)؛ [apps/website/landing-directions/src/reference/purchase.css:544](<../../../apps/website/landing-directions/src/reference/purchase.css#L544>)؛ [apps/website/landing-directions/src/reference/purchase.css:549](<../../../apps/website/landing-directions/src/reference/purchase.css#L549>).

**المشكلة:** fallbacktaxCaption الطويل داخلdd معwhite-space:nowrap وصفflex. فيW06 خرج يمين وفيW08 شمال.

**الأثر:** تفاصيل المبلغ اللي لازم تتراجع قبل الشراء صعبة القراءة.

**الإصلاح وإعادة الاستخدام:** خليdd للأرقام؛ شرح الضريبة ملاحظة مستقلة تلتف. min-width:0 وفحصAR/EN وعملات طويلة، بدون قص المبلغ. PurchaseSummary + Field typography الحالي.

**الدليل وحدوده:** W04–W10، root فتحW07؛quote الصالحW12 اتعرض سليم لكنه لا يثبت إصلاح تقدير السلة. [دليل1](<shots/assessment-a-website/w08-cart-ar-route.jpg>)

### UX-042 — التسجيل من الموقع يقطع سياق التسوق وحالة الإرسال ضعيفة

**P2 · مفتوح · المجهود:متوسط**

**المكان:** `/signin → /sos`. **المصدر:** [apps/website/landing-directions/src/reference/SignIn.jsx:644](<../../../apps/website/landing-directions/src/reference/SignIn.jsx#L644>)؛ [apps/website/landing-directions/src/reference/SignIn.jsx:656](<../../../apps/website/landing-directions/src/reference/SignIn.jsx#L656>).

**المشكلة:** التسجيل نجح وانتقل لمساحة جديدة من غير مدخل واضح للرجوع للتسوق. signingIn يمنع التكرار لكنCreate account لم يعرضbusy واضح في الجولة.

**الأثر:** العميل يضطر يرجع يدويًا للموقع لاختيار المنتج؛ لا يوجد دليل أن التسجيل مسح السلة.

**الإصلاح وإعادة الاستخدام:** احفظ returnTo آمن لسياق السلة أو الاختيار، أو وضّح نجاح التسجيل ورابط كمّل اختيارك لو زيارة حساب مستقلة. اعرض busy وdisabled أثناء الإرسال. AuthPanel وButton مع handoff الحالي؛ لا تغير الحساب المشترك.

**الدليل وحدوده:** W02/W03؛ إعادة التحقق استخدمت نفس السلة، ثم الشراء والتسليم نجحواW13–W16. [دليل1](<shots/assessment-a-website/w03-signup-workspace-handoff-en.jpg>)

### UX-043 — CSS الخاص بـChats فيه أسماء مولدة واتجاهات physical

**P3 · مفتوح · المجهود:متوسط على مراحل**

**المكان:** `/chats/hq/*`. **المصدر:** [apps/chats/app/v3-classes.css:149](<../../../apps/chats/app/v3-classes.css#L149>)؛ [apps/chats/app/v3-classes.css:152](<../../../apps/chats/app/v3-classes.css#L152>)؛ [apps/chats/app/v3-classes.css:153](<../../../apps/chats/app/v3-classes.css#L153>).

**المشكلة:** أسماء ch-* hashed وتصريحات left/right تجعل صيانة عناصر الواجهة الاتجاهية أصعب.

**الأثر:** ده دين صيانة؛ وجود left لوحده لا يثبت عيب RTL، ومخطط الطابق له إحداثياته المقصودة.

**الإصلاح وإعادة الاستخدام:** حوّل عناصر الواجهة غير الهندسية إلى logical properties وتوكنات بأسماء واضحة تدريجيًا؛ احتفظ بإحداثيات الطابق. اختبر LTR/RTL بصريًا قبل إزالة الكلاسات. SuiteShell وSidebar والتوكنات.

**الدليل وحدوده:** المصدر مفتوح؛113 يثبت أن البديل الموبايل قائمة أشخاص سليمة. [دليل1](<shots/113-chats-ar-dark-390.jpg>)

### UX-044 — ResizeObserver في الموقع ممكن يقرأ ref بعد إزالته

**P3 · مفتوح · المجهود:صغير**

**المكان:** `الموقع Home→صفحة أخرى`. **المصدر:** [apps/website/landing-directions/src/reference/Partners.jsx:31](<../../../apps/website/landing-directions/src/reference/Partners.jsx#L31>).

**المشكلة:** سجل المتصفح أظهر Cannot read properties of null reading scrollWidth؛ callback يقرأ group.current وrail.current بدون guard.

**الأثر:** ضوضاء dev وخطر سباق عند unmount؛ لم يثبت إنه سبب503 أو كسر شراء.

**الإصلاح وإعادة الاستخدام:** ثبّت العقد قبل subscribe وافحص وجودها في callback، وافصل observer وanimation وقت unmount. استخدم PartnerStrip الحالي؛ تحقق من التنقل في اللغة وreduced motion.

**الدليل وحدوده:** Console في Assessment A Website والمصدر اللي root قرأه؛ الشراء نجح بعد إصلاح key من غير تغيير PartnerStrip. استنتاجمصدر؛ لايوجدادعاءفعلتجريبيغيرمنفذ.

## الحالات والاتساق

| الحالة | الموجود الفعلي | المطلوب التالي |
| --- | --- | --- |
| loading |حالات resource وhandoff واضحة في الواجهات؛ cold Next compile موجود |UX016 route boundaries؛ منع انتظار بلا نهاية بمهلة ومحاولة مفسّرة |
| error |CRM validation يحفظ القيم؛ Account وConsole resource عندهم retry |UX011 تمييز فشل الشبكة عن404؛ UX027 حفظ payroll يحتاج انتظار |
| empty |Tax checks فارغة، HR قسم جديد بدون موظفين، وWebsite cart فارغة |UX021 نص يناسب النوع؛ أول فعل من الصلاحيات والسياق |
| no access وnotYours |Nour ما فتحش HR غير المتاح، وFiles-only ما شافش أدوات تانية |UX006 Trial للـowner وRequest للـmember وSwitch Workspace |
| read only وsimulated |حدود mock payment وsecurity وtyping وwhiteboard imports صريحة |حافظ على الحدود؛ disabled action لازم سبب زيUX020 |
| success |Purchase confirmed، ملف مستعاد، وCRUD محفوظ |UX019/024 تأكيد نتيجة مكان الفعل، بدون اعتماد على refresh وحده |
| dirty |UTM وSoftware Catalog محتاجين سياسة واحدة |UX017/025 Save/Discard/Stay، وقيم تظل وقت الفشل |

كلمة **Simulated/Prototype** مش عيب في نموذج طلب المستخدم إنه يبقى محلي ومفيهوش backend حقيقي. استخدم شريط واحد للسياق العام، وعلامة صريحة عند الدفع والأمان والرسائل المحاكية. ما تحذفش الكلمة من زر Pay أو الأمان بحجة تنضيف الواجهة. التكرار غير المفيد ممكن يتقلل بس من غير إخفاء حد المحاكاة.

## RTL والترجمة والداكن والموبايل والإتاحة

العربي شغال في العناوين والملاحة الأساسية والـDialogs اللي فتحتها. أسماء الأشخاص والملفات والقنوات ومحتوى الرسائل EN بيانات عينة، مش كلها untranslated keys. الفرق هوUX022/034 لعناوين نظام يفترض تترجم، وUX040 للغة الموقع الشكلية. HR رابط onboarding اللي ما فيهوش locale في href اتحل عربيًا `/hr/ar/employees` بملف اللغة الحالي؛ **ما وصفتوش404 أو فقد لغة مؤكد**.

الداكن في التطبيقات التسعة المراجعة اشتغل، لكن تقييم contrast البصري لوحده مش قياس WCAG. DS gate الموجود46 check نجح؛ ده بيفحص النظام، مش كل صفحة وكل عنصر.390px بيظهر تكدس Files وMarketing UX035/038. HR table يحتاج scroll أفقي لاستكمال الأعمدة والتبويبات، وChats يقص اسم workspace في breadcrumb مع presence status. دي حدود كثافة السطح الحالي؛ مش تعميم إن الموبايل كله غير قابل للاستخدام.

لازم تمرير keyboard وقارئ شاشة مخصص قبل قبول إتاحة كاملة. الجولة راجعت أسماء الأفعال والـlabels وDialog focus وAX وskip link وcharts بجدول بديل. لم تختبر NVDA أوVoiceOver ولا200% zoom ولا كل contrast pixel. UX018 ارتباط field/error وUX036 main مكرر نتايج مصدر وDOM واضحة تستحق إصلاح بمكونات المكتبة.

## تنقيحات قريبة من غير تغيير شكل المنتج

- خلّي فعل الصفحة ومؤشر الحفظ واضحين في PageHeader أوaction bar، واجعل FormDialog وSheet ينتظروا Promise ويحتفظوا بالقيم عند الفشل.
- اجمع الترجمة والأخطاء والتوجيه المتكرر على LocalizedField وStates وuseFormatter بدل نسخ حل لكل app.
- WM: المكتبة والإصدارات الموجودة أولًا؛ import وcreate في Dialog مستقل، والـBulkActionBar بعد تحديد عناصر.
- Account: خطوات بداية لكل أداة وrole، وHome دائم وطلب صلاحية واضح. ما تحذفش adaptiveEntry اللي بيختصر الدخول.
- خلّيChecklist قابلة للتأجيل في مكان مستقل من غير إخفاء التقدم؛ dashboard للشغل اليومي.

## تحسينات الرحلات

1. **تجربة الدخول والعودة:** احتفظ بالمقصد الآمن والـworkspace حتى آخر handoff، وReturn to Account مستمر. أثناء المراجعة حصل handoff CRM عالق على loading مرة؛ reload واحد وصّل. ودخول Admin مباشر بسياق app قديم انتظر، ثم gateway الأداة قبل Admin حلّه. السبب لم يتعزل بشكل قابل للتكرار؛ ده تشخيص لـdev، مش finding بسبب مؤكد. خُد trace محدود وأضف timeout وrecovery للـhandoff بدون إظهار رموز الدخول في URLs المحفوظة.
2. **شراء محلي متسق:** من اختيار إلى quote إلى mock payment إلى فاتورة واحدة إلى الأداة. الجولة أثبتت EN بـTasks وPayPal فقط؛ AR payment وباقي المنتجات وrefund سيناريوهات قبول قادمة، مش نجاح معلن.
3. **دعوة وفرق:** الإيميل المحاكي في mailbox، ولما يتقبل الهدف يفتح العمل المسموح. اشرح reserved وassigned capacity قبل الإرسال، بدون رسوم حقيقية أو بريد خارجي.
4. **سرعة التطوير المحلي:** router وmock واحد والـfrontends lazy خلّوا API محلية خفيفة؛ أول دخول لمسار جديد لسه يعمل Next compile. ظهرت compiles حوالي2–5 ثواني وأحيانًا auth أوcold visit أطول. مفيش production benchmark أوLighthouse أو مقارنة مقاسة تثبت نسبة تحسن. الخطوة التالية warm route محدد بناءً على حركة الجولة أو وضع built preview محلي، مع الحفاظ على ذاكرة الجهاز وعدم إجبار بناء التطبيقات التسعة كلها عند البداية.

## خصائص جديدة وتوفيق الـbacklog

الحالات القديمة في backlog مش إذن لبناء خدمة حقيقية. المطلوب التالي في حدود mock محلي تفاعلي فقط، وقرار PM لو هيغيّر سعة أوفوترة.

| GAP | حالة السجل الحالية | الموجود والمقترح المحلي | قرار قبل التنفيذ |
| --- | --- | --- | --- |
|GAP016|accepted_v3_mock|usage وcapacity وحراسة Files quota موجودين. حسّن توحيد80%/100% والـAsk admin بدل ادعاء انعدام usage |تعريف soft/hard limit وسياق كل أداة |
|GAP027|historical_scope_not_adopted|renewal reminders محلية في in-app وmailbox بمبلغ وعملة وتاريخ ومدخل paylink mock؛ لاSMTP |نوافذ7/1/30 أيام وطرق التجديد |
|GAP122|historical_scope_not_adopted|guest read-only admission موجود؛ anonymous meeting guest مش canonical member أوseat |هل guest-seat policy جديدة مطلوبة؟ لا احتساب من طرف واجهة المتصفح |
|GAP123|superseded_owner_or_policy|D061 اختار capacity لكل أداة؛ الدعوة تحجز وتخصص، ولا يُعاد حساب الدفع من عدد الأعضاء. اعرض السعة والحجوزات وتحريرها بوضوح |لا عودة لفوترة global automatic seats من غير قرار صريح |
|GAP150|historical_scope_not_adopted|سيناريو محاكاة اختلاف بلد مزود الدفع وbilling مع manual review اختياري؛ لا جمع بيانات بطاقة أو محرك fraud حقيقي |threshold وسياسة المراجعة مع PM |

المصادر اللي أُعيد قراءتها: [backlog.csv](../../../program/backlog/backlog.csv#L64) (016)، [027](../../../program/backlog/backlog.csv#L190)، [122–150](../../../program/backlog/backlog.csv#L196)، [D061](../../../program/decisions/D-061.md)، [D073](../../../program/decisions/D-073.md)، و[D077](../../../program/decisions/D-077.md). الأولوية الجديدة هي كمال وضوح التفاعل الموجود، مش إنشاء backend إنتاجي.

## قرارات للمالك وPM

| القرار | اقتراح مبدئي | أثره |
| --- | --- | --- |
|Home لأداة واحدة |إظهاره دايمًا، مع الدخول الذكي |يحل العودة للدعوات والصلاحيات من غير خطوة دخول زيادة |
|Lead أوCustomer |contact ناقص صحيح تعديله ينجح؛ طلب اكتمال وقت conversion |يحدد schema CRM والمصطلحات |
|HR المسموح بتعديله |اربط البيانات الوظيفية المتاحة، واشرح read only للبنك مثلًا |ما يظهرش فعل صامت أو صلاحية غير مفهومة |
|لغات التجارة المنشورة |AR وEN فعلية منURL، واللغة غير المكتملة حالتها واضحة |يحدد محتوى WM المطلوب نشره |
|سداد الفاتورة محليًا |mock Pay CTA أوRequest link واضح حسب الحالة |يكمل الرحلة من غير بوابة دفع حقيقية |
|Guest وcapacity وreminders |اتبع D061 والحالات الموثقة؛ الإضافة محاكاة فقط |يمنع اختراع سياسة أو فاتورة من عدد المستخدمين |

الأسئلة الاستكشافية الإضافية اتخطّت لأن المستخدم حدد الخطة والنطاق والأشخاص والتسليم. القرارات دي تُراجع مع الملف؛ مش موافقات ضمنية.

## خريطة P0 وP1 وP2 والقبول

| المرحلة | النطاق | معيار قبول يمكن مراجعته |
| --- | --- | --- |
|P0 عند ظهور عطل حاجب |لا يوجد P0 مثبت في الجولة الحالية |دخول Mona وباقي الأشخاص وسياق workspace لا يفشل؛ لا يتم ترقية ملاحظة لـP0 بدون دليل |
|P1 أول دفعة |UX005/006/009/010/011/012/013/017/023/037/040 |Home وrequest وtrial واضحين؛5 HR Edit تعمل أو تشرح سبب المنع؛ loanId صحيح؛ create/edit CRM متسق؛ المسودة لا تضيع؛ لغة الموقع تغيّرURL وdir |
|P2 ثاني دفعة |onboarding، success/error، RTL count، invoice/paylink feedback، Files/WM hierarchy، الموبايل وfield a11y |390 AR dark يصل للعمل بأقل تمرير؛ pending/retry يحفظ القيم؛ labels/errors مرتبطة؛ سعة المقاعد مفهومة |
|P3 تنقيح مستمر |UX028/039/043/044 |مصطلحات موحدة، تنقل بدون console warning غير مبرر، CSS منطقي بدون كسر إحداثيات الطابق |

فحص كل دفعة: typecheck للـpackages المتغيرة، اختبار سلوكي لحراسة أوحفظ أوتوجيه حقيقي، EN/AR وlight/dark و390، وscreenshots حالة مستقرة. ما تكتبش اختبار مرآة لتغيير نص قليل، وما تفتحش دفعة backend خارجي. Form وState من المكتبة هم المسار الأساسي.

## التسليم وحد الموافقة

ملف README ده هو المخرج المصري بكل الملاحظات والحلول؛ [Restoration](restoration.md) للتحقق، [فهرس الصور](capture-index.json)، و[المنهج](assessments.md). PR83 مجهّز على GitHub. الـmain checkout وملفاته وعملياته ما اتغيروش. سيرفر المراجعة فقط بيتوقف في التسليم؛ بياناته ignored ومعزولة.

تم تحديث `program/v3-progress.json` بالحالة الحالية. تعليمات merge/deploy التاريخية في الأرشيف مش إذن حالي. الخطة بتقول صراحة **“I won't merge it without the user's OK”**. الاسترجاع والمراجعة والاختبارات والرفع جاهزين؛ الدمج مستني OK من المستخدم. Cloud release حاليًا manual، ومفيش deploy مطلوب للـprototype المحلي.
