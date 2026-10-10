import fs from "node:fs";
const rows = `toolbar|Task controls|أدوات المهام|Aufgabensteuerung|Outils des tâches|Controlli attività
filters|More filters|فلاتر إضافية|Weitere Filter|Plus de filtres|Altri filtri
table|Tasks|المهام|Aufgaben|Tâches|Attività
labels|Labels|التصنيفات|Labels|Étiquettes|Etichette
recurrence|Repeat|التكرار|Wiederholen|Répétition|Ripetizione
all|All|الكل|Alle|Tous|Tutte
none|None|بدون|Keine|Aucun|Nessuna
weekly|Weekly|أسبوعيًا|Wöchentlich|Chaque semaine|Ogni settimana
monthly|Monthly|شهريًا|Monatlich|Chaque mois|Ogni mese
overdue|Overdue|متأخرة|Überfällig|En retard|Scadute
next7|Next seven days|خلال سبعة أيام|Nächste sieben Tage|Sept prochains jours|Prossimi sette giorni
undated|No due date|بدون موعد|Ohne Fälligkeit|Sans échéance|Senza scadenza
clearFilters|Clear filters|مسح الفلاتر|Filter zurücksetzen|Effacer les filtres|Cancella filtri
export|Export CSV|تصدير CSV|CSV exportieren|Exporter CSV|Esporta CSV
import|Import CSV|استيراد CSV|CSV importieren|Importer CSV|Importa CSV
savedViews|Saved views|العروض المحفوظة|Gespeicherte Ansichten|Vues enregistrées|Viste salvate
viewName|View name|اسم العرض|Ansichtsname|Nom de la vue|Nome vista
saveView|Save view|حفظ العرض|Ansicht speichern|Enregistrer la vue|Salva vista
saved|Saved.|تم الحفظ.|Gespeichert.|Enregistré.|Salvato.
saveError|The change could not be saved. Try again.|تعذر حفظ التغيير. حاول مرة أخرى.|Änderung konnte nicht gespeichert werden. Erneut versuchen.|Impossible d’enregistrer. Réessayez.|Impossibile salvare. Riprova.
quickAdd|Quick add|إضافة سريعة|Schnell hinzufügen|Ajout rapide|Aggiunta rapida
projectDetails|Project details|تفاصيل المشروع|Projektdetails|Détails du projet|Dettagli progetto
project|Project|المشروع|Projekt|Projet|Progetto
section|Section|القسم|Abschnitt|Section|Sezione
template|Template|القالب|Vorlage|Modèle|Modello
add|Add task|إضافة مهمة|Aufgabe hinzufügen|Ajouter une tâche|Aggiungi attività
created|Task created.|تم إنشاء المهمة.|Aufgabe erstellt.|Tâche créée.|Attività creata.
exported|Filtered tasks exported.|تم تصدير المهام المفلترة.|Gefilterte Aufgaben exportiert.|Tâches filtrées exportées.|Attività filtrate esportate.
batchResult|Updated: {updated}. Failed: {failed}.|تم تحديث: {updated}. فشل: {failed}.|Aktualisiert: {updated}. Fehlgeschlagen: {failed}.|Mis à jour : {updated}. Échecs : {failed}.|Aggiornate: {updated}. Errori: {failed}.
readOnly|This project or workspace is read-only. Restore the project or review billing to make changes.|المشروع أو مساحة العمل للقراءة فقط. استعد المشروع أو راجع الفوترة للتعديل.|Dieses Projekt oder dieser Arbeitsbereich ist schreibgeschützt. Projekt wiederherstellen oder Abrechnung prüfen.|Ce projet ou espace est en lecture seule. Restaurez le projet ou vérifiez la facturation.|Progetto o spazio in sola lettura. Ripristina il progetto o verifica la fatturazione.
forbidden|You do not have access.|ليس لديك صلاحية.|Sie haben keinen Zugriff.|Vous n’avez pas accès.|Non hai accesso.
requestOwner|Ask the workspace owner for access.|اطلب الصلاحية من مالك مساحة العمل.|Bitten Sie den Eigentümer um Zugriff.|Demandez l’accès au propriétaire.|Chiedi accesso al proprietario.
noResults|No matching tasks|لا توجد مهام مطابقة|Keine passenden Aufgaben|Aucune tâche correspondante|Nessuna attività corrispondente
bulk|Bulk actions|إجراءات جماعية|Sammelaktionen|Actions groupées|Azioni multiple
selected|{count} selected|تم تحديد {count}|{count} ausgewählt|{count} sélectionnées|{count} selezionate
applyBulk|Apply changes|تطبيق التغييرات|Änderungen anwenden|Appliquer les modifications|Applica modifiche
assignMe|Assign to me|إسناد لي|Mir zuweisen|M’assigner|Assegna a me
preset_brief|Project brief|ملخص المشروع|Projektbrief|Brief de projet|Brief progetto
preset_review|Deliverable review|مراجعة التسليم|Ergebnisprüfung|Revue du livrable|Revisione consegna
preset_weekly|Weekly check-in|متابعة أسبوعية|Wöchentliche Besprechung|Point hebdomadaire|Riunione settimanale
source|Source|المصدر|Quelle|Source|Origine
mapping|Mapping|ربط الأعمدة|Zuordnung|Correspondance|Mappatura
review|Review|المراجعة|Prüfung|Vérification|Verifica
result|Result|النتيجة|Ergebnis|Résultat|Risultato
csvNote|Paste UTF-8 CSV with up to 200 rows and 100 KB. Labels are separated with semicolons.|الصق CSV بصيغة UTF-8 حتى 200 صف و100 كيلوبايت. افصل التصنيفات بفاصلة منقوطة.|UTF-8-CSV bis 200 Zeilen und 100 KB einfügen. Labels mit Semikolon trennen.|Collez un CSV UTF-8 : 200 lignes et 100 Ko maximum. Séparez les étiquettes par des points-virgules.|Incolla CSV UTF-8: massimo 200 righe e 100 KB. Separa etichette con punto e virgola.
csvText|CSV text|نص CSV|CSV-Text|Texte CSV|Testo CSV
csvError|Enter valid CSV with 1–200 rows, within 100 KB.|أدخل CSV صالحًا من 1 إلى 200 صف حتى 100 كيلوبايت.|Gültiges CSV mit 1–200 Zeilen bis 100 KB eingeben.|Saisissez un CSV valide de 1 à 200 lignes, 100 Ko maximum.|Inserisci CSV valido con 1–200 righe, massimo 100 KB.
csvMappingError|Choose a project and section. Every title needs at least two characters.|اختر مشروعًا وقسمًا. كل عنوان يحتاج حرفين على الأقل.|Projekt und Abschnitt auswählen. Jeder Titel braucht mindestens zwei Zeichen.|Choisissez un projet et une section. Chaque titre nécessite deux caractères minimum.|Scegli progetto e sezione. Ogni titolo richiede almeno due caratteri.
title|Title column|عمود العنوان|Titelspalte|Colonne du titre|Colonna titolo
priority|Priority column|عمود الأولوية|Prioritätsspalte|Colonne de priorité|Colonna priorità
dueDate|Due date column|عمود الموعد|Fälligkeitsspalte|Colonne d’échéance|Colonna scadenza
reviewRows|Review {count} tasks before import.|راجع {count} مهمة قبل الاستيراد.|{count} Aufgaben vor dem Import prüfen.|Vérifiez {count} tâches avant import.|Verifica {count} attività prima dell’importazione.
failedRow|Row {row}|الصف {row}|Zeile {row}|Ligne {row}|Riga {row}
invalidRow|Check the title, labels and date.|راجع العنوان والتصنيفات والتاريخ.|Titel, Labels und Datum prüfen.|Vérifiez le titre, les étiquettes et la date.|Verifica titolo, etichette e data.
close|Close|إغلاق|Schließen|Fermer|Chiudi
cancel|Cancel|إلغاء|Abbrechen|Annuler|Annulla
back|Back|رجوع|Zurück|Retour|Indietro
continue|Continue|متابعة|Weiter|Continuer|Continua
importRows|Import tasks|استيراد المهام|Aufgaben importieren|Importer les tâches|Importa attività
sendReminder|Send in-app mock reminder|إرسال تذكير محاكى داخل التطبيق|Mock-Erinnerung in der App senden|Envoyer un rappel simulé dans l’application|Invia promemoria simulato nell’app
runReminders|Check due mock reminders|فحص التذكيرات المحاكاة المستحقة|Fällige Mock-Erinnerungen prüfen|Vérifier les rappels simulés dus|Verifica promemoria simulati in scadenza
reminderResult|New in-app notices: {count}. Repeated reminders are skipped.|إشعارات جديدة داخل التطبيق: {count}. يتم تجاوز التذكيرات المكررة.|Neue Hinweise: {count}. Wiederholungen werden übersprungen.|Nouveaux avis : {count}. Les doublons sont ignorés.|Nuovi avvisi: {count}. I duplicati vengono ignorati.
taskOptions|Task settings|إعدادات المهمة|Aufgabeneinstellungen|Paramètres de la tâche|Impostazioni attività
watchers|Watchers|المتابعون|Beobachter|Observateurs|Osservatori
recurrenceNote|Completing this task creates the next occurrence once.|إكمال المهمة ينشئ التكرار التالي مرة واحدة.|Beim Abschluss wird einmalig die nächste Aufgabe erstellt.|La prochaine occurrence est créée une seule fois à la clôture.|Il completamento crea una sola occorrenza successiva.
reminder|Remind one day before due|تذكير قبل الموعد بيوم|Einen Tag vor Fälligkeit erinnern|Rappel un jour avant échéance|Promemoria un giorno prima
reminderNote|In-app mock preview. External delivery is simulated.|معاينة داخل التطبيق. الإرسال الخارجي محاكاة.|Vorschau im Mock. Externe Zustellung ist simuliert.|Aperçu dans l’application. Envoi externe simulé.|Anteprima nell’app. Invio esterno simulato.
recipients|Saved recipients|المستلمون المحفوظون|Gespeicherte Empfänger|Destinataires enregistrés|Destinatari salvati
retryPreview|Save settings and retry.|احفظ الإعدادات وحاول مرة أخرى.|Einstellungen speichern und erneut versuchen.|Enregistrez et réessayez.|Salva e riprova.
loading|Loading…|جارٍ التحميل…|Laden…|Chargement…|Caricamento…
saveOptions|Save task settings|حفظ إعدادات المهمة|Aufgabeneinstellungen speichern|Enregistrer les paramètres|Salva impostazioni attività
saveTemplate|Save as template|حفظ كقالب|Als Vorlage speichern|Enregistrer comme modèle|Salva come modello
timeTracking|Time tracking|تتبع الوقت|Zeiterfassung|Suivi du temps|Tracciamento tempo
totalMinutes|Total: {count} minutes|الإجمالي: {count} دقيقة|Gesamt: {count} Minuten|Total : {count} minutes|Totale: {count} minuti
minutes|{count} minutes|{count} دقيقة|{count} Minuten|{count} minutes|{count} minuti
duration|Minutes (1–1440)|الدقائق (1–1440)|Minuten (1–1440)|Minutes (1–1440)|Minuti (1–1440)
timeNote|Work note|ملاحظة العمل|Arbeitsnotiz|Note de travail|Nota lavoro
logTime|Log time|تسجيل الوقت|Zeit erfassen|Enregistrer le temps|Registra tempo
startTimer|Start timer|بدء المؤقت|Timer starten|Démarrer le minuteur|Avvia timer
stopTimer|Stop and fill minutes|إيقاف وملء الدقائق|Stoppen und Minuten eintragen|Arrêter et remplir les minutes|Ferma e compila minuti
timerRunning|Timer running in this inspector.|المؤقت يعمل في لوحة المهمة.|Timer läuft in diesem Detailbereich.|Minuteur actif dans ce panneau.|Timer attivo in questo pannello.
admin|Administration|الإدارة|Verwaltung|Administration|Amministrazione
timeline|Timeline|الجدول الزمني|Zeitplan|Chronologie|Cronologia
timelineNote|Task dates and dependencies in this project. Undated work stays visible below.|مواعيد المهام والاعتماديات بالمشروع. المهام بلا موعد تظهر أدناه.|Termine und Abhängigkeiten. Aufgaben ohne Termin bleiben sichtbar.|Dates et dépendances du projet. Les tâches sans date restent visibles.|Date e dipendenze. Le attività senza data restano visibili.
start|Start|البداية|Beginn|Début|Inizio
end|Due|الموعد|Fällig|Échéance|Scadenza
dependencies|Dependencies|الاعتماديات|Abhängigkeiten|Dépendances|Dipendenze
fields|Custom fields|حقول مخصصة|Benutzerdefinierte Felder|Champs personnalisés|Campi personalizzati
fieldName|Field name|اسم الحقل|Feldname|Nom du champ|Nome campo
fieldType|Field type|نوع الحقل|Feldtyp|Type de champ|Tipo campo
text|Text|نص|Text|Texte|Testo
number|Number|رقم|Zahl|Nombre|Numero
boolean|Checkbox|خانة اختيار|Kontrollkästchen|Case à cocher|Casella
addField|Add field|إضافة حقل|Feld hinzufügen|Ajouter un champ|Aggiungi campo
remove|Remove|إزالة|Entfernen|Retirer|Rimuovi
automations|Automations|الأتمتة|Automatisierungen|Automatisations|Automazioni
automationNote|Run enabled rules against current project tasks. Review the activity log after each run.|شغّل القواعد المفعلة على مهام المشروع الحالية وراجع سجل النشاط.|Aktive Regeln auf Projektaufgaben anwenden und Aktivität prüfen.|Exécutez les règles actives et consultez le journal.|Esegui regole attive e consulta il registro.
condition|Condition|الشرط|Bedingung|Condition|Condizione
statusCondition|Task status|حالة المهمة|Aufgabenstatus|État de tâche|Stato attività
action|Action|الإجراء|Aktion|Action|Azione
setPriority|Set priority|تحديد الأولوية|Priorität setzen|Définir la priorité|Imposta priorità
addLabel|Add label|إضافة تصنيف|Label hinzufügen|Ajouter une étiquette|Aggiungi etichetta
value|Value|القيمة|Wert|Valeur|Valore
addRule|Add rule|إضافة قاعدة|Regel hinzufügen|Ajouter une règle|Aggiungi regola
enabled|Enabled|مفعلة|Aktiviert|Activée|Attiva
saveConfig|Save project configuration|حفظ إعدادات المشروع|Projektkonfiguration speichern|Enregistrer la configuration|Salva configurazione progetto
runRules|Run rules|تشغيل القواعد|Regeln ausführen|Exécuter les règles|Esegui regole
runResult|Changed {count} tasks.|تم تغيير {count} مهمة.|{count} Aufgaben geändert.|{count} tâches modifiées.|{count} attività modificate.
archive|Archive project|أرشفة المشروع|Projekt archivieren|Archiver le projet|Archivia progetto
restore|Restore project|استعادة المشروع|Projekt wiederherstellen|Restaurer le projet|Ripristina progetto
archived|Archived|مؤرشف|Archiviert|Archivé|Archiviato
active|Active projects|المشاريع النشطة|Aktive Projekte|Projets actifs|Progetti attivi
archiveImpact|Tasks remain available to read. Restore this project to edit them again.|تبقى المهام متاحة للقراءة. استعد المشروع لتعديلها مجددًا.|Aufgaben bleiben lesbar. Zum Bearbeiten das Projekt wiederherstellen.|Les tâches restent lisibles. Restaurez pour les modifier.|Le attività restano leggibili. Ripristina per modificarle.
onboarding|Set up Tasks|إعداد المهام|Tasks einrichten|Configurer Tasks|Configura Tasks
firstProject|Create your first project|أنشئ مشروعك الأول|Erstes Projekt erstellen|Créer le premier projet|Crea primo progetto
firstTask|Add and complete a task|أضف مهمة وأكملها|Aufgabe hinzufügen und abschließen|Ajouter et terminer une tâche|Aggiungi e completa attività
reviewConnections|Review connected tools|راجع الأدوات المتصلة|Verbundene Tools prüfen|Vérifier les outils connectés|Verifica strumenti collegati
sample|Create a sample project|إنشاء مشروع تجريبي|Beispielprojekt erstellen|Créer un projet exemple|Crea progetto di esempio
sampleNote|An empty workspace can start with three real sample tasks you can edit.|ابدأ مساحة العمل الفارغة بثلاث مهام تجريبية حقيقية قابلة للتعديل.|Leerer Arbeitsbereich startet mit drei bearbeitbaren Beispielaufgaben.|Un espace vide peut commencer avec trois tâches exemple modifiables.|Uno spazio vuoto può iniziare con tre attività esempio modificabili.
noDates|No dates yet|لا توجد مواعيد|Noch keine Termine|Aucune date|Nessuna data
templateManage|Project templates|قوالب المشروع|Projektvorlagen|Modèles de projet|Modelli progetto`;
const locales = ["en", "ar", "de", "fr", "it"];
for (const [index, locale] of locales.entries()) {
  const file = new URL(`../messages/${locale}.json`, import.meta.url);
  const catalog = JSON.parse(fs.readFileSync(file, "utf8"));
  catalog.TasksV3 = Object.fromEntries(rows.split("\n").map(line => { const [key, ...values] = line.split("|"); if (values.length !== 5) throw new Error(key); return [key, values[index]]; }));
  fs.writeFileSync(file, (JSON.stringify(catalog, null, 2) + "\n").replaceAll("\n", "\r\n"));
}
