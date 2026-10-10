import fs from 'node:fs';
const rows = `account|Account|الحساب|Konto|Compte|Account
accountIntro|Your personal preferences and workspace controls.|تفضيلاتك الشخصية وإدارة مساحة العمل.|Persönliche Einstellungen und Arbeitsbereich.|Préférences personnelles et espace de travail.|Preferenze personali e spazio di lavoro.
loading|Loading account…|جارٍ تحميل الحساب…|Konto wird geladen…|Chargement du compte…|Caricamento account…
forbidden|This area requires access.|هذه المنطقة تحتاج صلاحية.|Zugriff erforderlich.|Accès requis.|Accesso richiesto.
askOwner|Ask the workspace owner for the required access.|اطلب الصلاحية من مالك مساحة العمل.|Bitten Sie den Eigentümer um Zugriff.|Demandez l’accès au propriétaire.|Chiedi accesso al proprietario.
loadFailed|Could not load this account area|تعذر تحميل هذه المنطقة|Kontobereich konnte nicht geladen werden|Impossible de charger ce compte|Impossibile caricare questa area
retryHint|Try again with the current workspace.|حاول مرة أخرى في مساحة العمل الحالية.|Mit dem aktuellen Arbeitsbereich erneut versuchen.|Réessayez dans l’espace actuel.|Riprova nello spazio attuale.
saveFailed|The change could not be saved. Try again.|تعذر حفظ التغيير. حاول مرة أخرى.|Änderung nicht gespeichert. Erneut versuchen.|Impossible d’enregistrer. Réessayez.|Impossibile salvare. Riprova.
saved|Saved.|تم الحفظ.|Gespeichert.|Enregistré.|Salvato.
readOnly|This workspace or View-as session is read-only.|مساحة العمل أو جلسة المعاينة للقراءة فقط.|Arbeitsbereich oder Ansicht ist schreibgeschützt.|Cet espace ou aperçu est en lecture seule.|Spazio o anteprima in sola lettura.
security|Security|الأمان|Sicherheit|Sécurité|Sicurezza
preferences|Preferences|التفضيلات|Einstellungen|Préférences|Preferenze
integrations|Integrations|التكاملات|Integrationen|Intégrations|Integrazioni
data|Data export|تصدير البيانات|Datenexport|Export des données|Esportazione dati
audit|Workspace activity log|سجل نشاط مساحة العمل|Aktivitätsprotokoll|Journal d’activité|Registro attività
setup|Set up your workspace|إعداد مساحة العمل|Arbeitsbereich einrichten|Configurer votre espace|Configura spazio di lavoro
danger|Workspaces and account|مساحات العمل والحساب|Arbeitsbereiche und Konto|Espaces et compte|Spazi e account
twoFactor|Two-factor authentication|المصادقة الثنائية|Zwei-Faktor-Anmeldung|Authentification à deux facteurs|Autenticazione a due fattori
securityPreview|Prototype enrollment and recovery settings. Sign-in enforcement is simulated.|إعدادات تسجيل واسترداد تجريبية. تطبيقها عند الدخول محاكاة.|Prototyp-Einrichtung und Wiederherstellung. Anmeldung simuliert.|Configuration et récupération du prototype. Application à la connexion simulée.|Configurazione e recupero del prototipo. Applicazione all’accesso simulata.
enabled|Enabled|مفعّل|Aktiviert|Activé|Attivo
disabled|Disabled|غير مفعّل|Deaktiviert|Désactivé|Disattivo
prototypeCode|Prototype verification code|رمز التحقق التجريبي|Prototyp-Bestätigungscode|Code de vérification du prototype|Codice verifica prototipo
codeHint|Use the displayed mock code: {code}.|استخدم الرمز المحاكى المعروض: {code}.|Angezeigten Mock-Code verwenden: {code}.|Utilisez le code simulé : {code}.|Usa il codice simulato: {code}.
enableTwoFactor|Enable 2FA preview|تفعيل معاينة المصادقة الثنائية|2FA-Vorschau aktivieren|Activer l’aperçu 2FA|Attiva anteprima 2FA
disableTwoFactor|Disable 2FA preview|إيقاف معاينة المصادقة الثنائية|2FA-Vorschau deaktivieren|Désactiver l’aperçu 2FA|Disattiva anteprima 2FA
newRecovery|Generate mock recovery codes|إنشاء رموز استرداد محاكاة|Mock-Wiederherstellungscodes erstellen|Générer des codes simulés|Genera codici simulati
recoveryCodes|Mock recovery codes|رموز استرداد محاكاة|Mock-Wiederherstellungscodes|Codes de récupération simulés|Codici recupero simulati
workspaceMfaPolicy|Require 2FA in this workspace preview|طلب المصادقة الثنائية في معاينة مساحة العمل|2FA in der Vorschau verlangen|Exiger 2FA dans cet aperçu|Richiedi 2FA nell’anteprima
policyPreview|The policy is saved; provider enforcement stays simulated.|تُحفظ السياسة؛ تطبيقها عبر المزود محاكاة.|Richtlinie wird gespeichert; Durchsetzung simuliert.|La règle est enregistrée ; application simulée.|Regola salvata; applicazione simulata.
emailVerification|Email verification preview|معاينة التحقق من البريد|E-Mail-Bestätigungsvorschau|Aperçu de vérification e-mail|Anteprima verifica email
emailStates.not_started|Not started|لم تبدأ|Nicht gestartet|Non démarré|Non iniziata
emailStates.pending|Awaiting mock verification|بانتظار التحقق المحاكى|Mock-Bestätigung ausstehend|Vérification simulée en attente|Verifica simulata in attesa
emailStates.verified|Verified in the mock preview|تم التحقق في المعاينة المحاكاة|In der Mock-Vorschau bestätigt|Vérifié dans l’aperçu simulé|Verificata nell’anteprima
sendVerification|Prepare verification preview|إعداد معاينة التحقق|Bestätigungsvorschau vorbereiten|Préparer la vérification|Prepara verifica
verifyEmail|Verify mock email|التحقق من البريد المحاكى|Mock-E-Mail bestätigen|Vérifier l’e-mail simulé|Verifica email simulata
sessions|Your actual sessions|جلساتك الفعلية|Ihre tatsächlichen Sitzungen|Vos sessions réelles|Sessioni effettive
sessionsIntro|Sessions belong to your signed-in account. Sign out all to revoke them.|الجلسات تخص حسابك المسجل. سجّل الخروج من الكل لإلغائها.|Sitzungen gehören Ihrem Konto. Alle abmelden zum Widerrufen.|Les sessions appartiennent à votre compte. Déconnectez tout pour les révoquer.|Le sessioni appartengono al tuo account. Disconnetti tutte per revocarle.
noSessions|No sessions available|لا توجد جلسات متاحة|Keine Sitzungen verfügbar|Aucune session disponible|Nessuna sessione disponibile
session|Session|الجلسة|Sitzung|Session|Sessione
currentSession|Current session|الجلسة الحالية|Aktuelle Sitzung|Session actuelle|Sessione corrente
revokedSession|Signed out|تم تسجيل الخروج|Abgemeldet|Déconnectée|Disconnessa
otherSession|Another session|جلسة أخرى|Andere Sitzung|Autre session|Altra sessione
created|Created|تاريخ الإنشاء|Erstellt|Créée|Creata
lastSeen|Last seen|آخر نشاط|Zuletzt aktiv|Dernière activité|Ultima attività
scope|App scope|نطاق التطبيق|App-Bereich|Portée de l’application|Ambito applicazione
signOutAll|Sign out all sessions|تسجيل الخروج من جميع الجلسات|Alle Sitzungen abmelden|Déconnecter toutes les sessions|Disconnetti tutte le sessioni
signOutAllImpact|Your current session and other sessions will end.|ستنتهي الجلسة الحالية وبقية الجلسات.|Aktuelle und andere Sitzungen werden beendet.|La session actuelle et les autres seront fermées.|La sessione corrente e le altre termineranno.
sso|Single sign-on settings|إعدادات الدخول الموحد|SSO-Einstellungen|Paramètres de connexion unique|Impostazioni accesso unico
ssoIntro|Saved provider configuration for the prototype. External sign-in is simulated.|إعدادات مزود محفوظة للبروتوتايب. الدخول الخارجي محاكاة.|Gespeicherte Anbieter-Konfiguration; externe Anmeldung simuliert.|Configuration enregistrée ; connexion externe simulée.|Configurazione salvata; accesso esterno simulato.
provider|Provider|المزود|Anbieter|Fournisseur|Provider
domain|Workspace domain|نطاق مساحة العمل|Arbeitsbereich-Domain|Domaine de l’espace|Dominio spazio
saveSso|Save SSO settings|حفظ إعدادات الدخول الموحد|SSO speichern|Enregistrer SSO|Salva SSO
preferencesIntro|Saved choices follow your account across subscribed tools.|تتبع الاختيارات المحفوظة حسابك عبر الأدوات المشترك بها.|Gespeicherte Auswahl folgt dem Konto in den Tools.|Les choix enregistrés suivent le compte dans les outils.|Le scelte salvate seguono l’account negli strumenti.
theme|Theme|المظهر|Darstellung|Thème|Tema
light|Light|فاتح|Hell|Clair|Chiaro
dark|Dark|داكن|Dunkel|Sombre|Scuro
density|Density|الكثافة|Dichte|Densité|Densità
comfortable|Comfortable|مريحة|Komfortabel|Confortable|Comoda
compact|Compact|مدمجة|Kompakt|Compacte|Compatta
language|Language|اللغة|Sprache|Langue|Lingua
savePreferences|Save preferences|حفظ التفضيلات|Einstellungen speichern|Enregistrer les préférences|Salva preferenze
notificationPreferences|Notification preferences|تفضيلات الإشعارات|Benachrichtigungen|Préférences de notification|Preferenze notifiche
notificationIntro|Delivery choices are saved. External delivery is simulated.|تُحفظ اختيارات التسليم. الإرسال الخارجي محاكاة.|Zustelloptionen werden gespeichert; externe Zustellung simuliert.|Choix enregistrés ; envoi externe simulé.|Scelte salvate; invio esterno simulato.
notifications.inApp|In-app notices|إشعارات داخل التطبيق|Hinweise in der App|Avis dans l’application|Avvisi nell’app
notifications.emailMock|Email delivery preview|معاينة إرسال البريد|E-Mail-Vorschau|Aperçu e-mail|Anteprima email
notifications.desktopMock|Desktop delivery preview|معاينة إشعارات سطح المكتب|Desktop-Vorschau|Aperçu bureau|Anteprima desktop
notifications.mentions|Mentions|الإشارات|Erwähnungen|Mentions|Menzioni
notifications.tasks|Task updates|تحديثات المهام|Aufgabenupdates|Mises à jour des tâches|Aggiornamenti attività
notifications.billing|Billing updates|تحديثات الفوترة|Abrechnungsupdates|Mises à jour de facturation|Aggiornamenti fatturazione
notifications.hr|HR updates|تحديثات الموارد البشرية|Personalupdates|Mises à jour RH|Aggiornamenti HR
notifications.marketing|Marketing updates|تحديثات التسويق|Marketingupdates|Mises à jour marketing|Aggiornamenti marketing
saveNotifications|Save notification choices|حفظ اختيارات الإشعارات|Benachrichtigungen speichern|Enregistrer les choix|Salva scelte notifiche
exportIntro|Download your visible workspace/tool records and account preferences. This prototype export makes no regulatory compliance claim.|نزّل سجلات مساحة العمل والأدوات المتاحة لك وتفضيلات الحساب. التصدير التجريبي ليس إثبات امتثال قانوني.|Sichtbare Datensätze und Einstellungen herunterladen. Keine regulatorische Zusicherung.|Téléchargez les données visibles et préférences. Aucun engagement de conformité réglementaire.|Scarica dati visibili e preferenze. Nessuna attestazione di conformità normativa.
exportData|Export visible data|تصدير البيانات المتاحة|Sichtbare Daten exportieren|Exporter les données visibles|Esporta dati visibili
exported|Scoped export downloaded.|تم تنزيل التصدير المحدد النطاق.|Export heruntergeladen.|Export ciblé téléchargé.|Esportazione scaricata.
searchAudit|Search activity|البحث في النشاط|Aktivität suchen|Rechercher l’activité|Cerca attività
viewAsOnly|View-as events only|أحداث المعاينة فقط|Nur Ansichtsereignisse|Événements d’aperçu uniquement|Solo eventi anteprima
action|Action|الإجراء|Aktion|Action|Azione
actor|Person|الشخص|Person|Personne|Persona
date|Date|التاريخ|Datum|Date|Data
target|Record|السجل|Datensatz|Enregistrement|Record
noActivity|No activity yet|لا يوجد نشاط بعد|Noch keine Aktivität|Aucune activité|Nessuna attività
steps.profile|Complete your profile|أكمل ملفك الشخصي|Profil vervollständigen|Compléter le profil|Completa profilo
steps.team|Invite your team|ادعُ فريقك|Team einladen|Inviter l’équipe|Invita team
steps.tools|Choose a tool|اختر أداة|Tool auswählen|Choisir un outil|Scegli strumento
steps.billing|Complete billing details|أكمل بيانات الفوترة|Abrechnung ergänzen|Compléter la facturation|Completa fatturazione
steps.firstTask|Create a real first task|أنشئ أول مهمة فعلية|Erste Aufgabe erstellen|Créer une première tâche|Crea prima attività
showSetup|Show setup checklist|إظهار قائمة الإعداد|Einrichtung anzeigen|Afficher la liste|Mostra configurazione
dismissSetup|Set up later|الإعداد لاحقًا|Später einrichten|Configurer plus tard|Configura più tardi
secondWorkspace|Create another workspace|إنشاء مساحة عمل أخرى|Weiteren Arbeitsbereich erstellen|Créer un autre espace|Crea altro spazio
workspaceIntro|A new empty workspace belongs to your current account.|مساحة العمل الجديدة فارغة وتخص حسابك الحالي.|Neuer leerer Arbeitsbereich für Ihr Konto.|Nouvel espace vide rattaché à votre compte.|Nuovo spazio vuoto collegato al tuo account.
workspaceName|Workspace name|اسم مساحة العمل|Arbeitsbereichname|Nom de l’espace|Nome spazio
country|Country|الدولة|Land|Pays|Paese
createWorkspace|Create workspace|إنشاء مساحة العمل|Arbeitsbereich erstellen|Créer l’espace|Crea spazio
leaveWorkspace|Leave this workspace|مغادرة مساحة العمل|Arbeitsbereich verlassen|Quitter cet espace|Lascia spazio
leaveIntro|Leaving removes your access here and releases your assigned seats.|المغادرة تلغي وصولك هنا وتحرر مقاعدك المخصصة.|Verlassen entfernt Zugriff und gibt Plätze frei.|Quitter retire l’accès et libère vos places.|Uscire rimuove accesso e libera posti.
leaveImpact|Your membership and this workspace access end.|تنتهي عضويتك ووصولك إلى مساحة العمل.|Mitgliedschaft und Zugriff enden.|Votre adhésion et accès se terminent.|Adesione e accesso terminano.
transferFirst|Transfer ownership from Team before leaving.|انقل الملكية من الفريق قبل المغادرة.|Eigentum im Team übertragen, bevor Sie gehen.|Transférez la propriété avant de quitter.|Trasferisci proprietà prima di uscire.
deletePersonal|Delete personal account|حذف الحساب الشخصي|Persönliches Konto löschen|Supprimer le compte personnel|Elimina account personale
deleteIntro|Transfer or close owned workspaces and settle outstanding invoices first. Confirm with your current password.|انقل أو أغلق مساحات العمل التي تملكها وسوِّ الفواتير المستحقة أولًا. أكّد بكلمة المرور الحالية.|Eigene Arbeitsbereiche übertragen oder schließen und Rechnungen begleichen. Mit aktuellem Passwort bestätigen.|Transférez ou fermez vos espaces et réglez les factures. Confirmez le mot de passe actuel.|Trasferisci o chiudi spazi posseduti e salda fatture. Conferma password attuale.
confirmEmail|Confirm your email|تأكيد بريدك|E-Mail bestätigen|Confirmer l’e-mail|Conferma email
currentPassword|Current password|كلمة المرور الحالية|Aktuelles Passwort|Mot de passe actuel|Password attuale
deleteImpact|The account is deactivated and its sessions are revoked.|يتم تعطيل الحساب وإلغاء جلساته.|Konto wird deaktiviert und Sitzungen widerrufen.|Le compte est désactivé et les sessions révoquées.|Account disattivato e sessioni revocate.
apiKeys|API key previews|معاينات مفاتيح API|API-Schlüsselvorschauen|Aperçus de clés API|Anteprime chiavi API
keysIntro|These saved mock keys do not authorize real API requests.|المفاتيح المحاكاة المحفوظة لا تمنح وصولًا فعليًا إلى API.|Gespeicherte Mock-Schlüssel autorisieren keine echten Anfragen.|Les clés simulées n’autorisent pas de requêtes réelles.|Le chiavi simulate non autorizzano richieste reali.
keyName|Key name|اسم المفتاح|Schlüsselname|Nom de clé|Nome chiave
mockWriteScope|Include simulated write scope|إضافة نطاق كتابة محاكى|Simulierten Schreibbereich einschließen|Inclure l’écriture simulée|Includi scrittura simulata
createKey|Create mock key|إنشاء مفتاح محاكى|Mock-Schlüssel erstellen|Créer une clé simulée|Crea chiave simulata
oneTimeKey|Copy this mock value now; the list stores only its ending.|انسخ القيمة المحاكاة الآن؛ تعرض القائمة نهايتها فقط.|Mock-Wert jetzt kopieren; die Liste zeigt nur das Ende.|Copiez cette valeur ; la liste conserve sa fin uniquement.|Copia il valore; la lista mostra solo la parte finale.
hideKey|Hide value|إخفاء القيمة|Wert verbergen|Masquer|Nascondi valore
revoked|Revoked|ملغى|Widerrufen|Révoquée|Revocata
active|Active|نشط|Aktiv|Actif|Attivo
revokeKey|Revoke mock key|إلغاء المفتاح المحاكى|Mock-Schlüssel widerrufen|Révoquer la clé simulée|Revoca chiave simulata
webhooks|Webhook previews|معاينات Webhook|Webhook-Vorschauen|Aperçus de webhooks|Anteprime webhook
hooksIntro|Save destinations and events. Test delivery records a simulated attempt without external sending.|احفظ الوجهات والأحداث. يسجل الاختبار محاولة محاكاة دون إرسال خارجي.|Ziele und Ereignisse speichern. Tests sind simuliert, ohne externen Versand.|Enregistrez destinations et événements. Test simulé sans envoi externe.|Salva destinazioni ed eventi. Test simulato senza invio esterno.
hookName|Webhook name|اسم Webhook|Webhook-Name|Nom du webhook|Nome webhook
hookUrl|HTTPS destination|وجهة HTTPS|HTTPS-Ziel|Destination HTTPS|Destinazione HTTPS
webhookEvents.workspace_updated|Workspace updated|تحديث مساحة العمل|Arbeitsbereich aktualisiert|Espace mis à jour|Spazio aggiornato
webhookEvents.task_created|Task created|إنشاء مهمة|Aufgabe erstellt|Tâche créée|Attività creata
webhookEvents.invoice_paid|Invoice paid|دفع فاتورة|Rechnung bezahlt|Facture payée|Fattura pagata
webhookEvents.member_joined|Member joined|انضمام عضو|Mitglied beigetreten|Membre ajouté|Membro aggiunto
createHook|Create webhook preview|إنشاء معاينة Webhook|Webhook-Vorschau erstellen|Créer l’aperçu webhook|Crea anteprima webhook
testHook|Test simulated delivery|اختبار الإرسال المحاكى|Simulierte Zustellung testen|Tester l’envoi simulé|Testa invio simulato
removeHook|Remove webhook|إزالة Webhook|Webhook entfernen|Retirer le webhook|Rimuovi webhook
lastMockDelivery|Latest simulated success|آخر نجاح محاكى|Letzter simulierter Erfolg|Dernier succès simulé|Ultimo successo simulato
chooseWorkspace|Choose your workspace|اختر مساحة العمل|Arbeitsbereich auswählen|Choisir l’espace|Scegli spazio
identityIntro|Your account is signed in. Choose or create a workspace to continue.|حسابك مسجل الدخول. اختر أو أنشئ مساحة عمل للمتابعة.|Konto angemeldet. Arbeitsbereich wählen oder erstellen.|Compte connecté. Choisissez ou créez un espace.|Account connesso. Scegli o crea spazio.
openWorkspace|Open workspace|فتح مساحة العمل|Arbeitsbereich öffnen|Ouvrir l’espace|Apri spazio
homeConnected|Your tools, attention and connected work in one place.|أدواتك والتنبيهات والعمل المتصل في مكان واحد.|Tools, Hinweise und verbundene Arbeit an einem Ort.|Outils, attention et travail connecté au même endroit.|Strumenti, avvisi e lavoro collegato insieme.
homeStandalone|Manage your workspace and open your subscribed tool.|أدر مساحة العمل وافتح أداتك المشترك بها.|Arbeitsbereich verwalten und Tool öffnen.|Gérer l’espace et ouvrir votre outil.|Gestisci spazio e apri strumento.
addTool|Add a tool|إضافة أداة|Tool hinzufügen|Ajouter un outil|Aggiungi strumento
yourTools|Your tools|أدواتك|Ihre Tools|Vos outils|Strumenti
openTool|Open tool|فتح الأداة|Tool öffnen|Ouvrir l’outil|Apri strumento
noTools|Choose your first tool|اختر أداتك الأولى|Erstes Tool auswählen|Choisir le premier outil|Scegli primo strumento
noToolsBody|Start a trial or choose a plan from Tools.|ابدأ تجربة أو اختر خطة من الأدوات.|Testversion oder Plan unter Tools wählen.|Commencez un essai ou choisissez un forfait.|Avvia prova o scegli piano.
waiting|Needs your attention|يحتاج انتباهك|Benötigt Ihre Aufmerksamkeit|À votre attention|Richiede attenzione
allNotifications|All notifications|كل الإشعارات|Alle Benachrichtigungen|Toutes les notifications|Tutte le notifiche
nothingWaiting|You are up to date|لا توجد تنبيهات منتظرة|Alles aktuell|Vous êtes à jour|Tutto aggiornato
activity|Recent activity|النشاط الأخير|Letzte Aktivität|Activité récente|Attività recente
connections|Connected tools|الأدوات المتصلة|Verbundene Tools|Outils connectés|Strumenti collegati
connectionIntro|Turn workspace connections on or off using actual subscribed tools.|شغّل أو أوقف الروابط بين أدوات مساحة العمل المشترَك بها.|Verbindungen abonnierter Tools ein- oder ausschalten.|Activez ou désactivez les liens des outils abonnés.|Attiva o disattiva collegamenti degli strumenti abbonati.
noTrial|No trial is available for this plan.|لا تتوفر تجربة لهذه الخطة.|Keine Testversion verfügbar.|Aucun essai disponible.|Nessuna prova disponibile.
usage|Usage and limits|الاستخدام والحدود|Nutzung und Grenzen|Utilisation et limites|Utilizzo e limiti
usageIntro|Current workspace usage comes from the subscribed tools.|استخدام مساحة العمل يأتي من الأدوات المشترك بها.|Aktuelle Nutzung aus abonnierten Tools.|Utilisation actuelle des outils abonnés.|Utilizzo attuale degli strumenti abbonati.
seats|Assigned seats|المقاعد المخصصة|Zugewiesene Plätze|Places attribuées|Posti assegnati
unlimited|Unlimited|بلا حد|Unbegrenzt|Illimité|Illimitato
limitReached|This plan limit has been reached.|تم الوصول إلى حد الخطة.|Plangrenze erreicht.|Limite du forfait atteinte.|Limite piano raggiunto.
metrics.history_days|Message history (days)|مدة سجل الرسائل (أيام)|Nachrichtenverlauf (Tage)|Historique des messages (jours)|Cronologia messaggi (giorni)
metrics.projects|Projects|المشاريع|Projekte|Projets|Progetti
metrics.guests|Guests|الضيوف|Gäste|Invités|Ospiti
metrics.storage_gb|Storage (GB)|التخزين (غيغابايت)|Speicher (GB)|Stockage (Go)|Spazio (GB)
metrics.employees|Employees|الموظفون|Mitarbeitende|Personnel|Dipendenti
metrics.contacts|Contacts|جهات الاتصال|Kontakte|Contacts|Contatti
metrics.messages|Messages|الرسائل|Nachrichten|Messages|Messaggi
metrics.campaigns|Campaigns|الحملات|Kampagnen|Campagnes|Campagne
metrics.posts|Posts|المنشورات|Beiträge|Publications|Post
bulkInvite|Bulk invitations|الدعوات الجماعية|Sammeleinladungen|Invitations groupées|Inviti multipli
bulkInviteIntro|Paste up to 50 emails. Each row reports its result and respects available seats.|الصق حتى 50 بريدًا. يعرض كل صف نتيجته ويراعي المقاعد المتاحة.|Bis 50 E-Mails einfügen. Ergebnisse je Zeile und freie Plätze beachten.|Collez 50 e-mails maximum. Résultat par ligne selon les places.|Incolla massimo 50 email. Risultati per riga e posti disponibili.
inviteEmails|Invitation emails|بريد الدعوات|Einladungs-E-Mails|E-mails d’invitation|Email inviti
baseRole|Base access|الوصول الأساسي|Basiszugriff|Accès de base|Accesso base
inviteTools|Tool seats to reserve|مقاعد الأدوات المطلوب حجزها|Zu reservierende Tool-Plätze|Places d’outils à réserver|Posti strumenti da riservare
inviteBatch|Send invitations to mock mailbox|إرسال الدعوات إلى البريد المحاكى|Einladungen an Mock-Postfach senden|Envoyer au courrier simulé|Invia alla casella simulata
inviteResult|Invited: {invited}. Failed: {failed}.|تمت دعوة: {invited}. فشل: {failed}.|Eingeladen: {invited}. Fehler: {failed}.|Invités : {invited}. Échecs : {failed}.|Invitati: {invited}. Errori: {failed}.
inviteFailed|Review the email, role and available capacity.|راجع البريد والدور والسعة المتاحة.|E-Mail, Rolle und Kapazität prüfen.|Vérifiez e-mail, rôle et capacité.|Verifica email, ruolo e capacità.
customRoles|Custom roles|الأدوار المخصصة|Eigene Rollen|Rôles personnalisés|Ruoli personalizzati
customRolesIntro|Each role uses canonical admin, member or guest access. Only owners can appoint administrators.|كل دور يستخدم وصول أدمن أو عضو أو ضيف. تعيين الأدمن لمالك المساحة فقط.|Jede Rolle nutzt Admin-, Mitglied- oder Gastzugriff. Nur Eigentümer ernennen Admins.|Rôles basés sur admin, membre ou invité. Seuls les propriétaires nomment les admins.|Ruoli basati su admin, membro o ospite. Solo proprietari nominano admin.
roleName|Role name|اسم الدور|Rollenname|Nom du rôle|Nome ruolo
createRole|Create role|إنشاء دور|Rolle erstellen|Créer un rôle|Crea ruolo
removeRole|Remove role|إزالة الدور|Rolle entfernen|Retirer le rôle|Rimuovi ruolo
roles.owner|Owner|المالك|Eigentümer|Propriétaire|Proprietario
roles.admin|Administrator|أدمن|Administrator|Administrateur|Amministratore
roles.member|Member|عضو|Mitglied|Membre|Membro
roles.guest|Guest|ضيف|Gast|Invité|Ospite
memberControls|Member access controls|إدارة وصول الأعضاء|Mitgliedszugriff|Accès des membres|Accesso membri
suspendIntro|Suspension removes this workspace access and releases capacity. Restoring checks available seats.|التعليق يوقف وصول مساحة العمل ويحرر السعة. الاستعادة تتحقق من المقاعد المتاحة.|Sperren entfernt Zugriff und gibt Kapazität frei. Wiederherstellen prüft Plätze.|Suspendre retire l’accès et libère la capacité. Restauration selon les places.|Sospendere rimuove accesso e libera capacità. Ripristino verifica posti.
suspendMember|Suspend membership|تعليق العضوية|Mitgliedschaft sperren|Suspendre l’adhésion|Sospendi adesione
restoreMember|Restore membership|استعادة العضوية|Mitgliedschaft wiederherstellen|Restaurer l’adhésion|Ripristina adesione
suspended|Suspended|معلق|Gesperrt|Suspendu|Sospeso
removed|Removed|تمت الإزالة|Entfernt|Retiré|Rimosso
accessSuspended|Access suspended|الوصول معلق|Zugriff gesperrt|Accès suspendu|Accesso sospeso
accessRequests|Pending access requests|طلبات الوصول المنتظرة|Offene Zugriffsanfragen|Demandes d’accès en attente|Richieste accesso in attesa
approveAccess|Approve access|الموافقة على الوصول|Zugriff genehmigen|Approuver l’accès|Approva accesso
rejectAccess|Reject request|رفض الطلب|Anfrage ablehnen|Refuser la demande|Rifiuta richiesta
help|Help center|مركز المساعدة|Hilfezentrum|Centre d’aide|Centro assistenza
status|Workspace status|حالة مساحة العمل|Arbeitsbereichstatus|État de l’espace|Stato spazio
changelog|What’s new|الجديد|Neuigkeiten|Nouveautés|Novità
announcements|Announcements|الإعلانات|Ankündigungen|Annonces|Annunci
feedback|Feedback|الملاحظات|Feedback|Commentaires|Feedback
productIntro|Help and product information for your current workspace.|المساعدة ومعلومات المنتج لمساحة العمل الحالية.|Hilfe und Produktinfos zum aktuellen Arbeitsbereich.|Aide et informations de l’espace actuel.|Aiuto e informazioni dello spazio attuale.
openArticleArea|Open this area|فتح هذه المنطقة|Bereich öffnen|Ouvrir cette zone|Apri area
contactSupport|Contact support|التواصل مع الدعم|Support kontaktieren|Contacter l’assistance|Contatta assistenza
statusIntro|This is the current mock workspace/tool status, not a live provider outage feed.|هذه حالة مساحة العمل والأدوات المحاكاة، وليست متابعة أعطال مزود حي.|Aktueller Mock-Status, kein Live-Ausfallfeed.|État simulé actuel, sans suivi réel des pannes.|Stato simulato attuale, senza monitoraggio reale guasti.
noReleases|No published releases yet|لا توجد إصدارات منشورة بعد|Noch keine veröffentlichten Versionen|Aucune version publiée|Nessuna versione pubblicata
noAnnouncements|No published announcements yet|لا توجد إعلانات منشورة بعد|Noch keine veröffentlichten Ankündigungen|Aucune annonce publiée|Nessun annuncio pubblicato
publicationEmpty|Published platform records appear here when available.|تظهر سجلات المنصة المنشورة هنا عند توفرها.|Veröffentlichte Plattformdaten erscheinen hier.|Les publications de la plateforme apparaîtront ici.|Le pubblicazioni della piattaforma appariranno qui.
feedbackIntro|Feedback is saved in the prototype workspace; external delivery is simulated.|تُحفظ الملاحظات في مساحة العمل التجريبية؛ التسليم الخارجي محاكاة.|Feedback wird im Prototyp gespeichert; externe Zustellung simuliert.|Commentaires enregistrés dans le prototype ; envoi externe simulé.|Feedback salvato nel prototipo; invio esterno simulato.
feedbackType|Feedback type|نوع الملاحظة|Feedback-Typ|Type de commentaire|Tipo feedback
feedbackTypes.idea|Idea|فكرة|Idee|Idée|Idea
feedbackTypes.issue|Issue|مشكلة|Problem|Problème|Problema
feedbackTypes.question|Question|سؤال|Frage|Question|Domanda
feedbackText|Your feedback|ملاحظتك|Ihr Feedback|Votre commentaire|Feedback
saveFeedback|Save feedback|حفظ الملاحظة|Feedback speichern|Enregistrer|Salva feedback
feedbackSaved|Feedback saved in this workspace.|تم حفظ الملاحظة في مساحة العمل.|Feedback gespeichert.|Commentaire enregistré.|Feedback salvato.
feedbackNew|New|جديد|Neu|Nouveau|Nuovo
billingContacts|Billing contacts|جهات اتصال الفوترة|Abrechnungskontakte|Contacts de facturation|Contatti fatturazione
billingContactsIntro|Saved additional invoice contacts for this workspace.|جهات إضافية محفوظة للفواتير في مساحة العمل.|Zusätzliche Rechnungskontakte für diesen Arbeitsbereich.|Contacts supplémentaires de facturation.|Contatti aggiuntivi per fatture.
contactName|Contact name|اسم جهة الاتصال|Kontaktname|Nom du contact|Nome contatto
contactEmail|Contact email|بريد جهة الاتصال|Kontakt-E-Mail|E-mail du contact|Email contatto
addContact|Add billing contact|إضافة جهة للفوترة|Abrechnungskontakt hinzufügen|Ajouter le contact|Aggiungi contatto
removeContact|Remove billing contact|إزالة جهة الفوترة|Abrechnungskontakt entfernen|Retirer le contact|Rimuovi contatto
refundRequest|Refund request|طلب استرداد|Erstattungsanfrage|Demande de remboursement|Richiesta rimborso
refundIntro|Record a pending request against this paid invoice. Provider refund processing is simulated.|سجل طلبًا منتظرًا على هذه الفاتورة المدفوعة. تنفيذ الاسترداد لدى المزود محاكاة.|Offene Anfrage zu dieser bezahlten Rechnung. Abwicklung simuliert.|Demande en attente sur cette facture payée. Traitement simulé.|Richiesta pendente su fattura pagata. Elaborazione simulata.
remaining|Available to request: {amount}|المتاح للطلب: {amount}|Anfragbar: {amount}|Disponible : {amount}|Disponibile: {amount}
refundAmount|Requested amount|المبلغ المطلوب|Angefragter Betrag|Montant demandé|Importo richiesto
refundReason|Refund reason|سبب الاسترداد|Erstattungsgrund|Motif du remboursement|Motivo rimborso
requestRefund|Request refund|طلب الاسترداد|Erstattung anfragen|Demander le remboursement|Richiedi rimborso
refundSaved|Refund request is pending review.|طلب الاسترداد بانتظار المراجعة.|Erstattungsanfrage wartet auf Prüfung.|Demande en attente d’examen.|Richiesta in attesa di verifica.
refundPending|Pending review|بانتظار المراجعة|Prüfung ausstehend|En attente d’examen|In attesa di verifica
invoicePdf|Print or save PDF|طباعة أو حفظ PDF|Drucken oder PDF speichern|Imprimer ou enregistrer PDF|Stampa o salva PDF
winBackIntro|Keep this subscription renewing at its existing plan and price.|حافظ على التجديد بالخطة والسعر الحاليين.|Verlängerung zum bisherigen Plan und Preis behalten.|Conserver le renouvellement au forfait et prix actuels.|Mantieni rinnovo al piano e prezzo attuali.
pauseIntro|Pause automatic renewal by scheduling the current subscription to end at its period boundary.|أوقف التجديد التلقائي بجدولة انتهاء الاشتراك عند نهاية الفترة.|Automatische Verlängerung bis Periodenende aussetzen.|Suspendre le renouvellement automatique en fin de période.|Sospendi rinnovo automatico alla fine del periodo.
keepRenewal|Keep renewal|الإبقاء على التجديد|Verlängerung behalten|Conserver le renouvellement|Mantieni rinnovo
pauseRenewal|Pause renewal|إيقاف التجديد|Verlängerung aussetzen|Suspendre le renouvellement|Sospendi rinnovo
resumeImpact|The scheduled cancellation is removed and the existing renewal resumes.|تُزال الإلغاء المجدول ويعود التجديد الحالي.|Geplante Kündigung wird entfernt und Verlängerung fortgesetzt.|Annulation planifiée retirée ; renouvellement repris.|Annullamento pianificato rimosso e rinnovo ripreso.
pauseImpact|Access continues until the current period ends. Renewal stops at that boundary.|يستمر الوصول حتى نهاية الفترة الحالية. يتوقف التجديد عندها.|Zugriff bleibt bis Periodenende; Verlängerung stoppt dann.|Accès maintenu jusqu’à la fin de période ; renouvellement arrêté.|Accesso fino alla fine del periodo; rinnovo termina allora.
cancellationImpact|Connected work and export|العمل المتصل والتصدير|Verbundene Arbeit und Export|Travail connecté et export|Lavoro collegato ed esportazione
cancellationIntro|Export visible records before cancellation. These connections may stop when the tool ends.|صدّر السجلات المتاحة قبل الإلغاء. قد تتوقف هذه الروابط عند انتهاء الأداة.|Vor Kündigung exportieren. Verbindungen können bei Tool-Ende stoppen.|Exportez avant annulation. Les connexions peuvent cesser à l’arrêt.|Esporta prima di annullare. I collegamenti possono terminare.
exportBeforeCancel|Export before cancellation|تصدير قبل الإلغاء|Vor Kündigung exportieren|Exporter avant annulation|Esporta prima di annullare
downloadDelivery|Download delivery file|تنزيل ملف التسليم|Lieferdatei herunterladen|Télécharger le livrable|Scarica consegna
deliveryUnavailable|This delivery file could not be opened. Try again.|تعذر فتح ملف التسليم. حاول مرة أخرى.|Lieferdatei konnte nicht geöffnet werden. Erneut versuchen.|Impossible d’ouvrir ce livrable. Réessayez.|Impossibile aprire consegna. Riprova.
roleDenied|This membership role cannot use this tool.|هذا الدور لا يمكنه استخدام الأداة.|Diese Rolle kann das Tool nicht nutzen.|Ce rôle ne peut utiliser cet outil.|Questo ruolo non può usare lo strumento.
requestSaved|Access request is awaiting the owner.|طلب الوصول بانتظار المالك.|Zugriffsanfrage wartet auf Eigentümer.|Demande en attente du propriétaire.|Richiesta in attesa del proprietario.
startTrial|Start trial|بدء تجربة|Testversion starten|Commencer l’essai|Avvia prova
requestAccess|Request access|طلب الوصول|Zugriff anfragen|Demander l’accès|Richiedi accesso
toolNames.tasks|Tasks|المهام|Aufgaben|Tâches|Attività
toolNames.files|Files|الملفات|Dateien|Fichiers|File
toolNames.hr|HR|الموارد البشرية|Personal|RH|Risorse umane
toolNames.crm|CRM|إدارة العملاء|CRM|CRM|CRM
toolNames.chat|Chats|المحادثات|Chats|Discussions|Chat
toolNames.marketing|Marketing|التسويق|Marketing|Marketing|Marketing
toolStates.free|Free plan|خطة مجانية|Kostenloser Plan|Forfait gratuit|Piano gratuito
toolStates.active|Active|نشط|Aktiv|Actif|Attivo
toolStates.trial|Trial|تجربة|Testversion|Essai|Prova
toolStates.beta|Beta|تجريبي|Beta|Bêta|Beta
toolStates.read_only|Read-only|للقراءة فقط|Schreibgeschützt|Lecture seule|Sola lettura
toolStates.no_access|Access required|يحتاج وصولًا|Zugriff erforderlich|Accès requis|Accesso richiesto
toolStates.not_subscribed|Not subscribed|غير مشترك|Nicht abonniert|Non abonné|Non abbonato
toolStates.coming_soon|Coming soon|قريبًا|Demnächst|Bientôt|In arrivo
connectorDescriptions.tasks-files|Pin Files versions to tasks.|ربط نسخ الملفات بالمهام.|Dateiversionen an Aufgaben anheften.|Lier des versions de fichiers aux tâches.|Collega versioni file alle attività.
connectorDescriptions.chat-files|Share pinned Files versions and whiteboards.|مشاركة نسخ الملفات واللوحات.|Dateiversionen und Whiteboards teilen.|Partager fichiers et tableaux.|Condividi file e lavagne.
connectorDescriptions.tasks-hr|Show approved HR availability in Tasks calendars.|إظهار الإجازات المعتمدة في تقويم المهام.|Genehmigte Abwesenheit im Kalender zeigen.|Afficher les absences approuvées.|Mostra assenze approvate nei calendari.
connectorDescriptions.chat-hr|Show approved HR availability in Chats calendars.|إظهار الإجازات المعتمدة في تقويم المحادثات.|Abwesenheit im Chat-Kalender zeigen.|Afficher les absences dans le calendrier chat.|Mostra assenze nei calendari chat.
connectorDescriptions.hr-tasks|Create onboarding tasks and link projects.|إنشاء مهام الإعداد وربط المشاريع.|Onboarding-Aufgaben und Projekte verbinden.|Créer des tâches d’intégration et lier les projets.|Crea attività onboarding e collega progetti.
connectorDescriptions.crm-tasks|Create follow-up tasks from CRM records.|إنشاء مهام متابعة من سجلات العملاء.|Folgeaufgaben aus CRM-Daten erstellen.|Créer des tâches de suivi CRM.|Crea attività follow-up CRM.
connectorDescriptions.crm-files|Use packaged Files versions for service delivery.|استخدام نسخ الملفات في تسليم الخدمات.|Dateiversionen für Lieferungen nutzen.|Utiliser les fichiers pour les livrables.|Usa versioni file per consegne.
connectorDescriptions.chat-tasks|Create Tasks records from messages.|إنشاء مهام من الرسائل.|Aufgaben aus Nachrichten erstellen.|Créer des tâches depuis les messages.|Crea attività dai messaggi.
connectorDescriptions.marketing-crm|Connect campaign contacts and attribution.|ربط جهات الحملات والإسناد.|Kampagnenkontakte und Zuordnung verbinden.|Lier contacts et attribution de campagne.|Collega contatti e attribuzione campagne.
helpTopics.getting-started.title|Start your workspace|ابدأ مساحة العمل|Arbeitsbereich starten|Démarrer votre espace|Avvia spazio
helpTopics.getting-started.body|Complete your profile, choose tools and invite people using the live setup checklist.|أكمل ملفك واختر الأدوات وادعُ الأشخاص عبر قائمة الإعداد.|Profil ergänzen, Tools wählen und Personen einladen.|Complétez le profil, choisissez les outils et invitez l’équipe.|Completa profilo, scegli strumenti e invita persone.
helpTopics.tools.title|Choose and connect tools|اختيار الأدوات وربطها|Tools wählen und verbinden|Choisir et connecter les outils|Scegli e collega strumenti
helpTopics.tools.body|Owners start trials or choose plans. Members request access and the owner assigns available seats.|المالك يبدأ التجارب أو يختار الخطط. الأعضاء يطلبون الوصول والمالك يخصص المقاعد.|Eigentümer wählen Pläne; Mitglieder fragen Zugriff an.|Le propriétaire choisit les forfaits ; les membres demandent accès.|Proprietari scelgono piani; membri chiedono accesso.
helpTopics.billing.title|Billing and invoices|الفوترة والفواتير|Abrechnung und Rechnungen|Facturation et factures|Fatturazione e fatture
helpTopics.billing.body|Owners manage saved payment methods, period-end changes, billing contacts and invoice output.|المالك يدير وسائل الدفع والتغييرات عند نهاية الفترة وجهات الفوترة والفواتير.|Eigentümer verwalten Zahlungen, Kontakte und Rechnungen.|Les propriétaires gèrent paiements, contacts et factures.|Proprietari gestiscono pagamenti, contatti e fatture.
helpTopics.team.title|Invite and manage people|دعوة وإدارة الأشخاص|Personen einladen und verwalten|Inviter et gérer l’équipe|Invita e gestisci persone
helpTopics.team.body|Invitations reserve real tool capacity. Role changes and restoration respect canonical permissions and seats.|الدعوات تحجز سعة الأدوات. تغيير الأدوار والاستعادة يراعيان الصلاحيات والمقاعد.|Einladungen reservieren Plätze. Rollen und Wiederherstellung prüfen Rechte.|Les invitations réservent des places. Rôles et restauration respectent l’accès.|Inviti riservano posti. Ruoli e ripristino rispettano accessi.
helpTopics.connections.title|Control connected work|إدارة العمل المتصل|Verbundene Arbeit steuern|Gérer le travail connecté|Gestisci lavoro collegato
helpTopics.connections.body|A connection requires both subscriptions and the required seats. Turning it off keeps the existing source records.|الاتصال يحتاج اشتراك الأداتين والمقاعد المطلوبة. إيقافه يحتفظ بالسجلات الأصلية.|Beide Abos und Plätze erforderlich. Abschalten behält Quelldaten.|Deux abonnements et places requis. Désactiver conserve les sources.|Servono due abbonamenti e posti. Disattivare conserva dati.
helpTopics.security.title|Account and session controls|إدارة الحساب والجلسات|Konto und Sitzungen|Compte et sessions|Account e sessioni
helpTopics.security.body|Session lists and sign-out are actual. Enrollment, email, SSO, API keys and webhooks are marked as mock previews.|قائمة الجلسات والخروج فعليان. التسجيل والبريد وSSO والمفاتيح وWebhooks معاينات محاكاة.|Sitzungen sind real; Anmeldung, SSO und Integration als Vorschau markiert.|Sessions réelles ; inscription, SSO et intégrations simulées.|Sessioni reali; iscrizione, SSO e integrazioni simulate.
problems.ownership_transfer_required|Transfer or close owned workspaces first.|انقل أو أغلق مساحات العمل التي تملكها أولًا.|Eigene Arbeitsbereiche zuerst übertragen oder schließen.|Transférez ou fermez vos espaces.|Trasferisci o chiudi spazi posseduti.
problems.unpaid_invoices|Settle outstanding invoices before this action.|سوِّ الفواتير المستحقة قبل الإجراء.|Offene Rechnungen zuerst begleichen.|Réglez les factures en attente.|Salda fatture pendenti prima.
problems.account_confirmation_required|Confirm the exact email and current password.|أكد البريد الصحيح وكلمة المرور الحالية.|Genaue E-Mail und aktuelles Passwort bestätigen.|Confirmez l’e-mail exact et le mot de passe actuel.|Conferma email esatta e password attuale.
problems.seat_capacity_exhausted|Buy or release an available tool seat first.|اشترِ أو حرر مقعدًا متاحًا للأداة أولًا.|Tool-Platz zuerst kaufen oder freigeben.|Achetez ou libérez une place d’outil.|Acquista o libera un posto strumento.
problems.protected_membership|The owner and your current membership are protected.|المالك وعضويتك الحالية محميان.|Eigentümer und eigene Mitgliedschaft geschützt.|Propriétaire et adhésion actuelle protégés.|Proprietario e adesione attuale protetti.
problems.invalid_mock_code|Enter the displayed prototype code.|أدخل الرمز التجريبي المعروض.|Angezeigten Prototyp-Code eingeben.|Saisissez le code affiché.|Inserisci codice mostrato.
problems.duplicate_contact|This email is already a billing contact.|هذا البريد جهة فوترة بالفعل.|E-Mail bereits Abrechnungskontakt.|E-mail déjà contact de facturation.|Email già contatto fatturazione.
problems.duplicate_role|Choose a unique role name.|اختر اسم دور فريدًا.|Eindeutigen Rollennamen wählen.|Choisissez un nom de rôle unique.|Scegli nome ruolo unico.
problems.role_in_use|Reassign current members before removing this role.|غيّر أدوار الأعضاء قبل إزالة الدور.|Mitglieder vor Rollenlöschung neu zuweisen.|Réassignez les membres avant suppression.|Riassegna membri prima di rimuovere ruolo.
problems.invalid_refund_request|Use an amount within the remaining refundable balance.|استخدم مبلغًا ضمن الرصيد المتاح للاسترداد.|Betrag innerhalb des Restguthabens verwenden.|Montant dans le solde remboursable.|Importo entro saldo rimborsabile.
problems.already_member|This person already belongs to the workspace.|هذا الشخص عضو بالفعل.|Person ist bereits Mitglied.|Personne déjà membre.|Persona già membro.
problems.already_invited|An invitation is already pending for this email.|يوجد طلب دعوة منتظر لهذا البريد.|Einladung bereits ausstehend.|Invitation déjà en attente.|Invito già pendente.
problems.invalid_email|Enter a valid email.|أدخل بريدًا صالحًا.|Gültige E-Mail eingeben.|Saisissez un e-mail valide.|Inserisci email valida.
problems.owner_required|This action requires the workspace owner.|الإجراء يحتاج مالك المساحة.|Eigentümer erforderlich.|Propriétaire requis.|Proprietario richiesto.
problems.workspace_read_only|This workspace is read-only. Review billing or contact its owner.|المساحة للقراءة فقط. راجع الفوترة أو تواصل مع مالكها.|Arbeitsbereich schreibgeschützt. Abrechnung oder Eigentümer prüfen.|Espace en lecture seule. Vérifiez la facturation.|Spazio in sola lettura. Verifica fatturazione.
problems.view_as_read_only|View-as sessions cannot change this account.|جلسات المعاينة لا تعدل الحساب.|Ansichtssitzungen dürfen nichts ändern.|Les aperçus ne modifient pas le compte.|Le anteprime non modificano account.
problems.account_action_unavailable|This action is temporarily unavailable. Try again.|الإجراء غير متاح مؤقتًا. حاول مرة أخرى.|Aktion vorübergehend nicht verfügbar.|Action temporairement indisponible.|Azione temporaneamente non disponibile.`;
const locales=['en','ar','de','fr','it'];
for(const [index,locale] of locales.entries()){
 const file=new URL(`../messages/${locale}.json`,import.meta.url),raw=fs.readFileSync(file,'utf8'),catalog=JSON.parse(raw),group={};
 for(const line of rows.split('\n')){const [key,...values]=line.split('|');if(values.length!==5)throw Error(key);const parts=key.split('.');let target=group;for(const part of parts.slice(0,-1))target=target[part]??={};target[parts.at(-1)]=values[index];}
 catalog.AccountV3=group;let output=JSON.stringify(catalog,null,2)+'\n';fs.writeFileSync(file,output);
}
