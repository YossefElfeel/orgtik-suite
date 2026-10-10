import fs from 'node:fs';
import path from 'node:path';
const rows = `
library|File library|مكتبة الملفات|Dateibibliothek|Bibliothèque de fichiers|Raccolta file
my|My files|ملفاتي|Meine Dateien|Mes fichiers|I miei file
shared|Shared with me|تمت مشاركتها معي|Mit mir geteilt|Partagés avec moi|Condivisi con me
starred|Starred|المميزة|Markiert|Favoris|Preferiti
recent|Recent|الأخيرة|Zuletzt geöffnet|Récents|Recenti
trash|Trash|المحذوفات|Papierkorb|Corbeille|Cestino
admin|Administration|الإدارة|Verwaltung|Administration|Amministrazione
profile|My profile|ملفي الشخصي|Mein Profil|Mon profil|Il mio profilo
workspaceFiles|Workspace files|ملفات مساحة العمل|Arbeitsbereichdateien|Fichiers de l’espace|File dello spazio
libraryBody|Keep files organized, choose who can use them, and retain the versions you share.|نظّم الملفات وحدد من يمكنه استخدامها واحتفظ بالإصدارات التي تشاركها.|Dateien organisieren, Zugriffe wählen und geteilte Versionen behalten.|Organisez les fichiers, choisissez les accès et conservez les versions partagées.|Organizza i file, scegli gli accessi e conserva le versioni condivise.
folders|Folders|المجلدات|Ordner|Dossiers|Cartelle
createFolder|Create folder|إنشاء مجلد|Ordner erstellen|Créer un dossier|Crea cartella
addSample|Add packaged sample|إضافة ملف نموذجي|Beispieldatei hinzufügen|Ajouter un exemple fourni|Aggiungi esempio incluso
storage|Storage|التخزين|Speicher|Stockage|Archiviazione
storageBody|Retained versions and trash count toward storage until eligible files are purged.|تُحتسب الإصدارات المحفوظة والمحذوفات ضمن التخزين حتى حذف الملفات المؤهلة نهائيًا.|Versionen und Papierkorb zählen bis zur endgültigen Löschung zum Speicher.|Les versions et la corbeille comptent jusqu’à la suppression définitive.|Versioni e cestino occupano spazio fino all’eliminazione definitiva.
unavailable|Unavailable|غير متاح|Nicht verfügbar|Indisponible|Non disponibile
saved|Saved|تم الحفظ|Gespeichert|Enregistré|Salvato
failed|This action could not be completed. Check your access and try again.|تعذر إكمال الإجراء. تحقق من صلاحيتك وحاول مجددًا.|Die Aktion konnte nicht abgeschlossen werden. Zugriff prüfen und erneut versuchen.|L’action a échoué. Vérifiez vos accès et réessayez.|Impossibile completare l’azione. Controlla gli accessi e riprova.
uncertain|The result is not confirmed. Retry the original action unchanged to recover its receipt.|لم تتأكد النتيجة. أعد الإجراء الأصلي دون تعديل لاستعادة إيصال العملية.|Ergebnis unbestätigt. Dieselbe Aktion erneut senden, um den Beleg abzurufen.|Résultat non confirmé. Réessayez l’action identique pour récupérer son reçu.|Risultato non confermato. Riprova l’azione invariata per recuperare la ricevuta.
retryOriginal|Retry original action|إعادة الإجراء الأصلي|Ursprüngliche Aktion wiederholen|Réessayer l’action initiale|Riprova l’azione originale
name_collision|This name is already used. Choose Keep both or another name.|الاسم مستخدم بالفعل. اختر الاحتفاظ بكليهما أو اسمًا آخر.|Dieser Name wird verwendet. Beide behalten oder anderen Namen wählen.|Ce nom existe déjà. Conservez les deux ou choisissez un autre nom.|Il nome esiste già. Conserva entrambi o scegli un altro nome.
storage_quota_exceeded|Storage is full. Review storage and eligible trash.|التخزين ممتلئ. راجع التخزين والمحذوفات المؤهلة.|Speicher voll. Speicher und löschbaren Papierkorb prüfen.|Stockage plein. Vérifiez le stockage et la corbeille éligible.|Spazio esaurito. Controlla archiviazione e cestino eliminabile.
version_conflict|A newer version exists. Reload before adding a version.|يوجد إصدار أحدث. أعد التحميل قبل إضافة إصدار.|Eine neuere Version existiert. Vor dem Speichern neu laden.|Une version plus récente existe. Rechargez avant d’ajouter une version.|Esiste una versione più recente. Ricarica prima di aggiungerne una.
file_comment_required|Comment access is required.|يلزم إذن التعليق.|Kommentarzugriff erforderlich.|L’accès aux commentaires est requis.|È richiesto l’accesso ai commenti.
file_role_read_only|Your current Files role is read-only.|دورك الحالي في الملفات للقراءة فقط.|Ihre aktuelle Dateirolle ist schreibgeschützt.|Votre rôle Fichiers est en lecture seule.|Il tuo ruolo File consente solo la lettura.
operation_conflict|This action reference was used with different values.|استُخدم مرجع العملية بقيم مختلفة.|Diese Aktionsreferenz wurde mit anderen Werten verwendet.|Cette référence d’action a été utilisée avec d’autres valeurs.|Il riferimento è stato usato con valori diversi.
workspace_changed|The workspace or access changed. Reopen the current file.|تغيرت مساحة العمل أو الصلاحية. أعد فتح الملف الحالي.|Arbeitsbereich oder Zugriff geändert. Datei erneut öffnen.|L’espace ou les accès ont changé. Rouvrez le fichier.|Spazio o accesso cambiato. Riapri il file corrente.
noAccess|Files access is required|يلزم الوصول إلى الملفات|Dateizugriff erforderlich|Accès aux fichiers requis|Accesso ai file richiesto
home|Workspace Home|الصفحة الرئيسية|Arbeitsbereich-Startseite|Accueil de l’espace|Home dello spazio
previewReadOnly|You are viewing this workspace in a read-only preview.|أنت تستعرض مساحة العمل في وضع معاينة للقراءة فقط.|Sie sehen eine schreibgeschützte Vorschau dieses Arbeitsbereichs.|Vous consultez cet espace en aperçu de lecture seule.|Stai visualizzando un’anteprima in sola lettura dello spazio.
billingReadOnly|Files are read-only while this subscription is unavailable.|الملفات للقراءة فقط أثناء عدم توفر الاشتراك.|Dateien sind schreibgeschützt, solange das Abonnement nicht verfügbar ist.|Les fichiers sont en lecture seule tant que l’abonnement est indisponible.|I file sono in sola lettura mentre l’abbonamento non è disponibile.
roleReadOnly|Your role allows viewing. An item permission cannot grant a higher workspace role.|دورك يسمح بالمشاهدة. إذن الملف لا يمنح صلاحية أعلى من دور مساحة العمل.|Ihre Rolle erlaubt Lesen. Dateirechte erhöhen keine Arbeitsbereichrolle.|Votre rôle permet la lecture. Un droit de fichier n’élève pas le rôle de l’espace.|Il ruolo permette la lettura. Un permesso del file non eleva il ruolo dello spazio.
startTitle|Start your file library|ابدأ مكتبة ملفاتك|Dateibibliothek starten|Créez votre bibliothèque|Avvia la raccolta file
startBody|Use packaged samples to explore the complete file workflow.|استخدم الملفات النموذجية لاستكشاف سير عمل الملفات كاملًا.|Mit Beispieldateien den vollständigen Dateiablauf erkunden.|Explorez le parcours complet avec les exemples fournis.|Esplora il flusso completo con gli esempi inclusi.
startFolder|1. Create a folder for your team.|١. أنشئ مجلدًا لفريقك.|1. Einen Ordner für das Team erstellen.|1. Créez un dossier pour l’équipe.|1. Crea una cartella per il team.
startSample|2. Add a sample and inspect its saved version.|٢. أضف ملفًا نموذجيًا وافحص إصداره المحفوظ.|2. Beispiel hinzufügen und gespeicherte Version prüfen.|2. Ajoutez un exemple et consultez sa version.|2. Aggiungi un esempio e controlla la versione salvata.
startShare|3. Share access or attach the version in Tasks or Chats.|٣. شارك الوصول أو أرفق الإصدار في المهام أو المحادثات.|3. Zugriff teilen oder Version in Aufgaben oder Chats anhängen.|3. Partagez l’accès ou joignez la version dans Tâches ou Chats.|3. Condividi l’accesso o allega la versione in Attività o Chat.
filters|File filters|مرشحات الملفات|Dateifilter|Filtres de fichiers|Filtri file
searchFiles|Search files|البحث في الملفات|Dateien suchen|Rechercher des fichiers|Cerca file
fileType|File type|نوع الملف|Dateityp|Type de fichier|Tipo di file
allTypes|All types|كل الأنواع|Alle Typen|Tous les types|Tutti i tipi
pdf|PDF|PDF|PDF|PDF|PDF
images|Images|الصور|Bilder|Images|Immagini
sheet|Sheets|الجداول|Tabellen|Feuilles de calcul|Fogli di calcolo
slide|Slides|العروض|Folien|Diapositives|Diapositive
board|Whiteboards|اللوحات البيضاء|Whiteboards|Tableaux blancs|Lavagne
folderFilter|Folder filter|تصفية المجلد|Ordnerfilter|Filtre de dossier|Filtro cartella
allFolders|All folders|كل المجلدات|Alle Ordner|Tous les dossiers|Tutte le cartelle
root|Workspace root|جذر مساحة العمل|Arbeitsbereichwurzel|Racine de l’espace|Radice dello spazio
sort|Sort files|ترتيب الملفات|Dateien sortieren|Trier les fichiers|Ordina file
name|Name|الاسم|Name|Nom|Nome
size|Size|الحجم|Größe|Taille|Dimensione
updated|Updated|آخر تحديث|Aktualisiert|Mis à jour|Aggiornato
version|Version|الإصدار|Version|Version|Versione
moveTargets|Move destinations|وجهات النقل|Verschiebeziele|Destinations de déplacement|Destinazioni di spostamento
destination|Destination folder|المجلد الوجهة|Zielordner|Dossier de destination|Cartella di destinazione
keepBoth|Keep both when names collide|الاحتفاظ بكليهما عند تعارض الأسماء|Bei Namenskonflikten beide behalten|Conserver les deux en cas de conflit|Conserva entrambi in caso di nomi uguali
dragBody|Drag a file name onto a destination, or select files and choose Move.|اسحب اسم الملف إلى وجهة، أو حدد الملفات واختر نقل.|Dateinamen auf ein Ziel ziehen oder Dateien auswählen und verschieben.|Glissez un nom vers une destination ou sélectionnez des fichiers et déplacez-les.|Trascina il nome su una destinazione o seleziona i file e spostali.
bulkResult|{succeeded} completed · {failed} could not be changed|تم إكمال {succeeded} · تعذر تغيير {failed}|{succeeded} abgeschlossen · {failed} nicht geändert|{succeeded} terminés · {failed} non modifiés|{succeeded} completati · {failed} non modificati
bulkImpact|This changes {count} selected files. Files without permission remain unchanged.|سيُطبق الإجراء على {count} ملفًا محددًا. تبقى الملفات غير المصرح بها دون تغيير.|Ändert {count} ausgewählte Dateien. Dateien ohne Berechtigung bleiben unverändert.|Modifie {count} fichiers sélectionnés. Les fichiers non autorisés restent inchangés.|Modifica {count} file selezionati. I file non autorizzati restano invariati.
empty|No files match this view|لا توجد ملفات تطابق العرض|Keine passenden Dateien|Aucun fichier dans cette vue|Nessun file corrisponde alla vista
emptyBody|Reset the filters or add a packaged sample to begin.|أعد ضبط المرشحات أو أضف ملفًا نموذجيًا للبدء.|Filter zurücksetzen oder eine Beispieldatei hinzufügen.|Réinitialisez les filtres ou ajoutez un exemple fourni.|Reimposta i filtri o aggiungi un esempio incluso.
reset|Reset filters|إعادة ضبط المرشحات|Filter zurücksetzen|Réinitialiser les filtres|Reimposta filtri
open|Open file|فتح الملف|Datei öffnen|Ouvrir le fichier|Apri file
move|Move|نقل|Verschieben|Déplacer|Sposta
archive|Move to trash|نقل إلى المحذوفات|In Papierkorb verschieben|Mettre à la corbeille|Sposta nel cestino
restore|Restore|استعادة|Wiederherstellen|Restaurer|Ripristina
requests|Upload requests|طلبات استلام الملفات|Dateianfragen|Demandes de dépôt|Richieste di invio
requestsBody|Create a protected, expiring link for packaged sample submissions into a folder. The visitor cannot browse its contents.|أنشئ رابطًا محميًا ومؤقتًا لاستلام ملفات نموذجية في مجلد. لا يمكن للزائر تصفح محتوياته.|Geschützten Link mit Ablauf für Beispieldateien erstellen. Besucher sehen keine Ordnerinhalte.|Créez un lien protégé et temporaire pour recevoir des exemples. Le visiteur ne voit pas le dossier.|Crea un link protetto e temporaneo per ricevere esempi. Il visitatore non vede i contenuti.
createRequest|Create upload request|إنشاء طلب استلام|Dateianfrage erstellen|Créer une demande de dépôt|Crea richiesta di invio
sharingSettings|Sharing settings|إعدادات المشاركة|Freigabeeinstellungen|Paramètres de partage|Impostazioni condivisione
fileDetails|File details|تفاصيل الملف|Dateidetails|Détails du fichier|Dettagli file
detailsBody|Inspect saved versions, access and comments.|افحص الإصدارات المحفوظة والوصول والتعليقات.|Gespeicherte Versionen, Zugriffe und Kommentare prüfen.|Consultez les versions, accès et commentaires.|Controlla versioni salvate, accessi e commenti.
packagedBody|Choose an included sample. Arbitrary device uploads are deferred in this local workspace.|اختر ملفًا نموذجيًا مضمنًا. رفع ملفات الجهاز غير متاح في مساحة العمل المحلية.|Enthaltenes Beispiel wählen. Beliebige Geräteuploads sind in diesem lokalen Arbeitsbereich zurückgestellt.|Choisissez un exemple inclus. Les fichiers de l’appareil sont différés dans cet espace local.|Scegli un esempio incluso. Il caricamento dal dispositivo è rinviato nello spazio locale.
sampleSteps|Add sample steps|خطوات إضافة النموذج|Schritte zum Beispielimport|Étapes d’ajout d’exemple|Passaggi per aggiungere un esempio
chooseSample|Choose packaged sample|اختيار ملف نموذجي|Beispieldatei wählen|Choisir un exemple fourni|Scegli esempio incluso
review|Review|مراجعة|Prüfen|Vérifier|Controlla
back|Back|رجوع|Zurück|Retour|Indietro
next|Next|التالي|Weiter|Suivant|Avanti
label|Request label|اسم الطلب|Anfragebezeichnung|Libellé de demande|Etichetta richiesta
password|Optional link password|كلمة مرور اختيارية للرابط|Optionales Linkpasswort|Mot de passe facultatif du lien|Password facoltativa del link
submissionLimit|Maximum submissions|أقصى عدد للإرسالات|Maximale Einreichungen|Nombre maximal de dépôts|Numero massimo di invii
secretOnce|Copy this link now. Its secret is shown only on creation or rotation.|انسخ الرابط الآن. يظهر سره فقط عند الإنشاء أو التدوير.|Link jetzt kopieren. Das Geheimnis wird nur bei Erstellung oder Rotation gezeigt.|Copiez ce lien maintenant. Son secret n’apparaît qu’à la création ou rotation.|Copia il link ora. Il segreto è visibile solo alla creazione o rotazione.
secretRecovery|The link record was recovered. Rotate it to receive a new secret URL; the old URL and visitor sessions will stop working.|استُعيد سجل الرابط. دوّره للحصول على رابط سري جديد؛ سيتوقف الرابط القديم وجلسات الزوار.|Linkdatensatz wiederhergestellt. Erneuern Sie ihn für eine neue geheime URL; alte URL und Sitzungen werden ungültig.|Le lien a été récupéré. Renouvelez-le pour obtenir une nouvelle URL secrète; l’ancienne URL et les sessions seront invalidées.|Record del link recuperato. Rigeneralo per ottenere un nuovo URL segreto; il precedente e le sessioni saranno invalidati.
requestUrl|Upload request link|رابط طلب الاستلام|Dateianfragelink|Lien de demande de dépôt|Link richiesta di invio
copyLink|Copy link|نسخ الرابط|Link kopieren|Copier le lien|Copia link
download|Download|تنزيل|Herunterladen|Télécharger|Scarica
star|Star file|تمييز الملف|Datei markieren|Ajouter aux favoris|Aggiungi ai preferiti
unstar|Remove star|إلغاء التمييز|Markierung entfernen|Retirer des favoris|Rimuovi dai preferiti
permalink|Open saved version page|فتح صفحة الإصدار المحفوظ|Gespeicherte Version öffnen|Ouvrir la version enregistrée|Apri versione salvata
fileUnavailable|This file or version is unavailable|الملف أو الإصدار غير متاح|Datei oder Version nicht verfügbar|Fichier ou version indisponible|File o versione non disponibile
custodyReadOnly|This file is retained in read-only custody. Its custody record cannot be purged here.|الملف محفوظ بعهدة للقراءة فقط. لا يمكن حذف سجل العهدة هنا.|Diese Datei bleibt in schreibgeschützter Verwahrung und kann hier nicht gelöscht werden.|Ce fichier est conservé en garde de lecture seule et ne peut être purgé ici.|Il file è custodito in sola lettura e non può essere eliminato qui.
archivedBody|This file is in trash. Restore it before downloading or changing it.|الملف في المحذوفات. استعده قبل تنزيله أو تغييره.|Datei im Papierkorb. Vor dem Download oder Bearbeiten wiederherstellen.|Le fichier est dans la corbeille. Restaurez-le avant de le modifier ou télécharger.|Il file è nel cestino. Ripristinalo prima di scaricarlo o modificarlo.
historicalBody|You are inspecting a saved historical version. Choose the current version to make changes.|أنت تفحص إصدارًا محفوظًا سابقًا. اختر الإصدار الحالي لإجراء تغييرات.|Sie prüfen eine historische Version. Aktuelle Version zum Bearbeiten wählen.|Vous consultez une version historique. Choisissez la version actuelle pour modifier.|Stai controllando una versione storica. Scegli quella corrente per modificarla.
linkVisitor|Link visitor|زائر الرابط|Linkbesucher|Visiteur du lien|Visitatore del link
formerMember|Former member|عضو سابق|Ehemaliges Mitglied|Ancien membre|Ex membro
versionHistory|Version history|سجل الإصدارات|Versionsverlauf|Historique des versions|Cronologia versioni
selectedVersion|Selected version|الإصدار المحدد|Ausgewählte Version|Version sélectionnée|Versione selezionata
newVersion|Add packaged version|إضافة إصدار نموذجي|Beispielversion hinzufügen|Ajouter une version fournie|Aggiungi versione inclusa
versionBody|Choose a sample of the same file type. Previous versions keep their original bytes and attachment references.|اختر نموذجًا من نوع الملف نفسه. تحتفظ الإصدارات السابقة بمحتواها ومراجع مرفقاتها.|Beispiel desselben Typs wählen. Frühere Versionen behalten ihre Bytes und Referenzen.|Choisissez le même type. Les versions précédentes conservent leurs octets et références.|Scegli lo stesso tipo. Le versioni precedenti conservano byte e riferimenti originali.
versionSample|Packaged version sample|نموذج الإصدار|Beispiel für neue Version|Exemple de nouvelle version|Esempio per nuova versione
sourceBoard|Source whiteboard|اللوحة البيضاء المصدر|Quell-Whiteboard|Tableau blanc source|Lavagna di origine
openSourceBoard|Open source whiteboard|فتح اللوحة المصدر|Quell-Whiteboard öffnen|Ouvrir le tableau source|Apri lavagna di origine
boardBody|Structured boards retain their source chat association. Edit their scene in Chats.|تحتفظ اللوحات المنظمة بعلاقتها بالمحادثة المصدر. حرر محتواها في المحادثات.|Strukturierte Boards behalten ihren Quellchat. Szene in Chats bearbeiten.|Les tableaux structurés conservent leur chat source. Modifiez-les dans Chats.|Le lavagne strutturate mantengono la chat di origine. Modificale in Chat.
organize|Organize file|تنظيم الملف|Datei organisieren|Organiser le fichier|Organizza file
rename|Rename|إعادة تسمية|Umbenennen|Renommer|Rinomina
duplicate|Duplicate current version|نسخ الإصدار الحالي|Aktuelle Version duplizieren|Dupliquer la version actuelle|Duplica versione corrente
peopleAccess|People and access|الأشخاص والوصول|Personen und Zugriff|Personnes et accès|Persone e accesso
accessBody|Direct permissions can restrict or grant item access within a current Files role. Owners and administrators keep their authority; inherited folder access remains after removing a direct grant.|تعمل الصلاحيات المباشرة ضمن دور الملفات الحالي. يحتفظ المالكون والمديرون بصلاحياتهم؛ يبقى الوصول الموروث من المجلد بعد إزالة منح مباشر.|Direkte Rechte gelten innerhalb der aktuellen Dateirolle. Eigentümer und Administratoren behalten ihre Befugnis; geerbter Ordnerzugriff bleibt nach Entfernen einer direkten Freigabe.|Les droits directs respectent le rôle Fichiers. Propriétaires et administrateurs gardent leurs droits; les accès hérités restent après retrait d’un droit direct.|I permessi diretti rispettano il ruolo File. Proprietari e amministratori mantengono l’autorità; l’accesso ereditato resta dopo la rimozione di un permesso diretto.
permission|Permission|الإذن|Berechtigung|Permission|Permesso
view|View|مشاهدة|Lesen|Voir|Visualizza
comment|Comment|تعليق|Kommentieren|Commenter|Commenta
edit|Edit|تحرير|Bearbeiten|Modifier|Modifica
removeAccess|Remove direct access|إزالة الوصول المباشر|Direkten Zugriff entfernen|Retirer l’accès direct|Rimuovi accesso diretto
addPerson|Add person|إضافة شخص|Person hinzufügen|Ajouter une personne|Aggiungi persona
notifyShare|Notify recipients in the app|إشعار المستلمين داخل التطبيق|Empfänger in der App benachrichtigen|Notifier les destinataires dans l’app|Notifica destinatari nell’app
mockNoticeBody|This sends a persisted mock in-app notice. External email delivery is deferred.|يُرسل إشعارًا تجريبيًا محفوظًا داخل التطبيق. إرسال البريد الخارجي غير متاح.|Sendet eine gespeicherte simulierte App-Mitteilung. Externe E-Mails sind zurückgestellt.|Envoie une notification simulée persistante dans l’app. Les e-mails externes sont différés.|Invia una notifica simulata persistente nell’app. L’e-mail esterna è rinviata.
saveAccess|Save access|حفظ الوصول|Zugriff speichern|Enregistrer les accès|Salva accesso
notified|{count} in-app notices created|تم إنشاء {count} إشعارًا داخل التطبيق|{count} App-Mitteilungen erstellt|{count} notifications créées|{count} notifiche create
comments|Comments|التعليقات|Kommentare|Commentaires|Commenti
noComments|No comments yet|لا توجد تعليقات بعد|Noch keine Kommentare|Aucun commentaire|Nessun commento
commentBody|A current editor with comment permission can start the conversation.|يمكن لمحرر حالي لديه إذن التعليق بدء النقاش.|Ein aktueller Editor mit Kommentarrecht kann beginnen.|Un éditeur actuel autorisé peut démarrer la discussion.|Un editor corrente con permesso può iniziare la conversazione.
writeComment|Write a comment|كتابة تعليق|Kommentar schreiben|Écrire un commentaire|Scrivi un commento
sendComment|Post comment|نشر التعليق|Kommentar senden|Publier le commentaire|Pubblica commento
commentPermissionBody|Commenting requires an admitted editing role and comment or edit permission for this file.|التعليق يتطلب دور تحرير معتمدًا وإذن تعليق أو تحرير للملف.|Kommentare benötigen eine zugelassene Editorrolle und Kommentar- oder Bearbeitungsrecht.|Les commentaires exigent un rôle éditeur admis et le droit de commenter ou modifier.|I commenti richiedono un ruolo editor ammesso e il permesso di commentare o modificare.
publicLinks|Public links|الروابط العامة|Öffentliche Links|Liens publics|Link pubblici
active|Active|نشط|Aktiv|Actif|Attivo
expired|Expired|منتهي|Abgelaufen|Expiré|Scaduto
revoked|Revoked|ملغى|Widerrufen|Révoqué|Revocato
revokeLink|Revoke link|إلغاء الرابط|Link widerrufen|Révoquer le lien|Revoca link
revokeBody|The link and its active visitor sessions will stop working immediately.|سيتوقف الرابط وجلسات زواره النشطة فورًا.|Link und aktive Besuchersitzungen werden sofort ungültig.|Le lien et les sessions actives cesseront de fonctionner immédiatement.|Il link e le sessioni attive dei visitatori smetteranno subito di funzionare.
rotateLink|Rotate link|تدوير الرابط|Link erneuern|Renouveler le lien|Rigenera link
linkPermission|Public link permission|إذن الرابط العام|Linkberechtigung|Permission du lien public|Permesso link pubblico
expiry|Link expiry|انتهاء الرابط|Linkablauf|Expiration du lien|Scadenza link
createLink|Create protected link|إنشاء رابط محمي|Geschützten Link erstellen|Créer un lien protégé|Crea link protetto
shareUrl|Share link|رابط المشاركة|Freigabelink|Lien de partage|Link condivisione
attachElsewhere|Attach in connected tools|الإرفاق في الأدوات المتصلة|In verbundenen Tools anhängen|Joindre dans les outils connectés|Allega negli strumenti connessi
attachBody|Use the real Files picker in Tasks or Chats to attach a saved version. Later versions do not replace its bytes.|استخدم منتقي الملفات في المهام أو المحادثات لإرفاق إصدار محفوظ. الإصدارات اللاحقة لا تستبدل محتواه.|Dateiauswahl in Aufgaben oder Chats verwenden. Spätere Versionen ersetzen die angehängten Bytes nicht.|Utilisez le sélecteur Fichiers dans Tâches ou Chats. Les versions suivantes ne remplacent pas ses octets.|Usa il selettore File in Attività o Chat. Le versioni successive non sostituiscono i byte allegati.
openTasks|Open Tasks|فتح المهام|Aufgaben öffnen|Ouvrir Tâches|Apri Attività
openChats|Open Chats|فتح المحادثات|Chats öffnen|Ouvrir Chats|Apri Chat
trialUnavailable|No current trial plan is available.|لا تتوفر خطة تجربة حالية.|Kein aktueller Testtarif verfügbar.|Aucun forfait d’essai disponible.|Nessun piano di prova disponibile.
previewPage|Preview page {number}|صفحة المعاينة {number}|Vorschauseite {number}|Page d’aperçu {number}|Pagina anteprima {number}
previewUnavailable|No rendered preview is available. Download this saved version to inspect it.|لا تتوفر معاينة مرئية. نزّل الإصدار المحفوظ لفحصه.|Keine Vorschau verfügbar. Gespeicherte Version zum Prüfen herunterladen.|Aucun aperçu disponible. Téléchargez la version enregistrée.|Anteprima non disponibile. Scarica la versione salvata per controllarla.
filePolicy|Files policy|سياسة الملفات|Dateirichtlinie|Politique Fichiers|Regole File
policyBody|These controls apply to the current workspace. The safety cap can only reduce its canonical plan allowance.|تُطبق هذه الضوابط على مساحة العمل الحالية. الحد الاحترازي يمكنه تقليل سعة الخطة الأصلية فقط.|Gilt für diesen Arbeitsbereich. Die Sicherheitsgrenze kann nur die Tarifkapazität verringern.|Ces réglages concernent cet espace. Le plafond de sécurité peut seulement réduire la capacité du forfait.|Questi controlli valgono per lo spazio corrente. Il limite di sicurezza può solo ridurre la quota del piano.
safetyBytes|Optional storage safety cap (GB)|حد التخزين الاحترازي الاختياري (جيجابايت)|Optionale Speichergrenze (GB)|Plafond de sécurité facultatif (Go)|Limite di sicurezza facoltativo (GB)
canonicalStorage|Current plan allowance: {bytes}. Leave blank to use the plan allowance.|سعة الخطة الحالية: {bytes}. اتركه فارغًا لاستخدام سعة الخطة.|Aktuelle Tarifkapazität: {bytes}. Leer lassen, um sie zu verwenden.|Capacité du forfait : {bytes}. Laissez vide pour utiliser celle du forfait.|Quota del piano: {bytes}. Lascia vuoto per usare la quota del piano.
expiryDays|Default link expiry in days|مدة الرابط الافتراضية بالأيام|Standard-Linkdauer in Tagen|Expiration par défaut en jours|Scadenza predefinita in giorni
trashDays|Trash retention in days|مدة الاحتفاظ بالمحذوفات بالأيام|Papierkorbaufbewahrung in Tagen|Conservation de la corbeille en jours|Conservazione cestino in giorni
allowRequests|Allow protected upload request links|السماح بروابط طلب الاستلام المحمية|Geschützte Dateianfragen erlauben|Autoriser les liens de dépôt protégés|Consenti link protetti di richiesta invio
versionRetention|Retain all saved versions to preserve historical attachments. Versions are never silently trimmed.|الاحتفاظ بكل الإصدارات المحفوظة لحماية المرفقات السابقة. لا تُحذف الإصدارات تلقائيًا دون بيان.|Alle Versionen behalten, damit historische Anhänge erhalten bleiben. Versionen werden nicht still gekürzt.|Conservez toutes les versions pour préserver les pièces jointes historiques. Aucune suppression silencieuse.|Conserva tutte le versioni per preservare gli allegati storici. Nessun taglio silenzioso delle versioni.
savePolicy|Save Files policy|حفظ سياسة الملفات|Dateirichtlinie speichern|Enregistrer la politique|Salva regole File
purgeDue|Purge eligible trash|حذف المحذوفات المؤهلة نهائيًا|Fälligen Papierkorb löschen|Purger la corbeille éligible|Elimina cestino idoneo
purgeImpact|Permanently removes visible files trashed at least {days} days ago. Custody records and source whiteboards remain protected.|يحذف نهائيًا الملفات المرئية الموجودة في المحذوفات منذ {days} يومًا على الأقل. تبقى سجلات العهدة واللوحات المصدر محمية.|Löscht sichtbare Dateien im Papierkorb nach mindestens {days} Tagen. Verwahrung und Quellboards bleiben geschützt.|Supprime les fichiers visibles depuis au moins {days} jours. La garde et les tableaux sources restent protégés.|Elimina i file visibili nel cestino da almeno {days} giorni. Custodia e lavagne di origine restano protette.
purgeResult|{count} files purged · {protected} protected records retained|حُذف {count} ملفًا نهائيًا · حُفظ {protected} سجلًا محميًا|{count} Dateien gelöscht · {protected} geschützte Datensätze behalten|{count} fichiers purgés · {protected} éléments protégés conservés|{count} file eliminati · {protected} record protetti conservati
importBody|Add packaged samples through the file library. Arbitrary uploads and external storage-provider sync remain deferred. Export includes only your currently visible records and saved version metadata.|أضف الملفات النموذجية من المكتبة. رفع ملفات عشوائية ومزامنة التخزين الخارجي غير متاحين. يشمل التصدير السجلات المرئية وبيانات إصداراتها فقط.|Beispiele in der Bibliothek hinzufügen. Beliebige Uploads und externe Synchronisation sind zurückgestellt. Export enthält nur aktuell sichtbare Datensätze und Versionsdaten.|Ajoutez les exemples dans la bibliothèque. Les uploads libres et la synchronisation externe sont différés. L’export contient uniquement vos données visibles et versions.|Aggiungi gli esempi dalla raccolta. Upload liberi e sincronizzazione esterna sono rinviati. L’esportazione include solo record visibili e metadati delle versioni.
uploadRequest|Protected upload request|طلب استلام محمي|Geschützte Dateianfrage|Demande de dépôt protégée|Richiesta di invio protetta
publicRequestBody|Submit an included sample to the destination folder. This local flow cannot upload arbitrary device files or show existing folder contents.|أرسل ملفًا نموذجيًا مضمنًا إلى المجلد الوجهة. لا يدعم هذا المسار المحلي رفع ملفات الجهاز أو عرض محتويات المجلد الحالية.|Ein enthaltenes Beispiel einreichen. Dieser lokale Ablauf kann keine Geräteuploads oder vorhandene Ordnerinhalte zeigen.|Déposez un exemple inclus. Ce parcours local ne permet pas les fichiers de l’appareil ni la consultation du dossier.|Invia un esempio incluso. Questo flusso locale non carica file dal dispositivo né mostra i contenuti esistenti.
requestRemaining|{count} submissions remaining|متبقي {count} إرسال|{count} Einreichungen verbleiben|{count} dépôts restants|{count} invii rimanenti
sampleReceived|Sample received|تم استلام الملف النموذجي|Beispiel empfangen|Exemple reçu|Esempio ricevuto
submitSample|Submit packaged sample|إرسال الملف النموذجي|Beispieldatei einreichen|Déposer l’exemple fourni|Invia esempio incluso
`.trim().split('\n').map(line => line.split('|'));
const locales = ['en', 'ar', 'de', 'fr', 'it'];
for (const [index, locale] of locales.entries()) {
  const filename = path.resolve(import.meta.dirname, '../messages', `${locale}.json`), catalog = JSON.parse(fs.readFileSync(filename, 'utf8'));
  catalog.FilesV3 = Object.fromEntries(rows.map(row => { if (row.length !== 6) throw new Error(`Incomplete translation: ${row[0]}`); return [row[0], row[index + 1]]; }));
  fs.writeFileSync(filename, JSON.stringify(catalog, null, 2) + '\n');
}
console.log(`FilesV3: ${rows.length} keys in ${locales.length} catalogs.`);
