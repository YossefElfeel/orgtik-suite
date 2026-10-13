"""Write five-locale roadmap packets using the existing catalog writers."""
import json, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
LOCALES=['en','ar','de','fr','it']
ROWS={
 'saveError':['Could not save. Your changes are still here. Try again.','تعذر الحفظ. لا تزال تغييراتك موجودة. حاول مجددًا.','Speichern fehlgeschlagen. Ihre Änderungen bleiben erhalten.','Enregistrement impossible. Vos modifications sont conservées.','Salvataggio non riuscito. Le modifiche sono conservate.'],
 'saved':['Saved','تم الحفظ','Gespeichert','Enregistré','Salvato'],
 'search':['Search','بحث','Suchen','Rechercher','Cerca'],
 'noMatch':['No matching results','لا توجد نتائج مطابقة','Keine passenden Ergebnisse','Aucun résultat correspondant','Nessun risultato corrispondente'],
 'selectedLimit':['{count} / {limit} selected','تم تحديد {count} من {limit}','{count} / {limit} ausgewählt','{count} / {limit} sélectionnés','{count} / {limit} selezionati'],
 'reviewFirst':['Complete this step before marking it reviewed.','أكمل هذه الخطوة قبل وضع علامة المراجعة.','Schließen Sie diesen Schritt vor der Prüfung ab.','Terminez cette étape avant la vérification.','Completa questo passaggio prima della verifica.'],
 'chooseLoan':['Choose an active loan','اختر قرضًا نشطًا','Aktives Darlehen auswählen','Choisir un prêt actif','Scegli un prestito attivo'],
 'noLoans':['No active loans for this employee','لا توجد قروض نشطة لهذا الموظف','Keine aktiven Darlehen für diese Person','Aucun prêt actif pour cette personne','Nessun prestito attivo per questa persona'],
 'loanAmount':['Enter a positive amount within the remaining balance.','أدخل مبلغًا موجبًا ضمن الرصيد المتبقي.','Positiven Betrag innerhalb des Restbetrags eingeben.','Saisissez un montant positif ne dépassant pas le solde.','Inserisci un importo positivo entro il saldo residuo.'],
 'payInvoice':['Pay this invoice · simulated','دفع هذه الفاتورة · محاكاة','Rechnung bezahlen · simuliert','Payer cette facture · simulation','Paga questa fattura · simulazione'],
 'approvals':['Approvals','الموافقات','Freigaben','Approbations','Approvazioni'],
 'noApprovals':['Nothing needs your approval','لا توجد عناصر تحتاج موافقتك','Keine ausstehenden Freigaben','Aucune approbation en attente','Nessuna approvazione in attesa'],
 'review':['Review in source app','مراجعة في التطبيق المصدر','In Quellanwendung prüfen','Vérifier dans l’application source','Esamina nell’app di origine'],
 'allTools':['All tools','كل الأدوات','Alle Anwendungen','Toutes les applications','Tutte le applicazioni'],
 'defaultLanguage':['Default language','اللغة الافتراضية','Standardsprache','Langue par défaut','Lingua predefinita'],
 'timeZone':['Time zone','المنطقة الزمنية','Zeitzone','Fuseau horaire','Fuso orario'],
 'logo':['Workspace logo','شعار مساحة العمل','Arbeitsbereichslogo','Logo de l’espace','Logo dello spazio'],
 'chooseFile':['Choose a local file','اختر ملفًا محليًا','Lokale Datei auswählen','Choisir un fichier local','Scegli un file locale'],
 'attachments':['Files attachments','مرفقات الملفات','Dateianhänge','Pièces jointes','Allegati'],
 'upload':['Add local file','إضافة ملف محلي','Lokale Datei hinzufügen','Ajouter un fichier local','Aggiungi file locale'],
 'localOnly':['Stored in this local prototype','محفوظ في هذا النموذج المحلي','In diesem lokalen Prototyp gespeichert','Stocké dans ce prototype local','Archiviato in questo prototipo locale'],
 'assignee':['Assignee','المسؤول','Zuständig','Responsable','Assegnatario'],
 'dueDate':['Due date','تاريخ الاستحقاق','Fälligkeitsdatum','Échéance','Scadenza'],
 'editTeam':['Edit team','تعديل الفريق','Team bearbeiten','Modifier l’équipe','Modifica squadra'],
 'removeMember':['Remove from this team','إزالة من هذا الفريق','Aus diesem Team entfernen','Retirer de cette équipe','Rimuovi da questa squadra'],
 'removeBookmark':['Remove bookmark','إزالة الإشارة المرجعية','Lesezeichen entfernen','Retirer le favori','Rimuovi segnalibro'],
 'moveBefore':['Move earlier','نقل إلى السابق','Nach vorne verschieben','Déplacer avant','Sposta prima'],
 'moveAfter':['Move later','نقل إلى التالي','Nach hinten verschieben','Déplacer après','Sposta dopo'],
 'customFields':['Employee custom fields','حقول الموظفين المخصصة','Benutzerdefinierte Mitarbeiterfelder','Champs personnalisés des employés','Campi personalizzati dei dipendenti'],
 'dailyOverview':['Today at work','العمل اليوم','Heute bei der Arbeit','Aujourd’hui au travail','Oggi al lavoro'],
 'exportChat':['Export channel history','تصدير سجل القناة','Kanalverlauf exportieren','Exporter l’historique du canal','Esporta cronologia canale'],
 'searchEmoji':['Search emoji','بحث عن رمز تعبيري','Emoji suchen','Rechercher un émoji','Cerca emoji'],
 'tags':['Tags','الوسوم','Tags','Étiquettes','Tag'],
 'stage':['CRM stage','مرحلة إدارة العملاء','CRM-Phase','Étape CRM','Fase CRM'],
 'engagement':['Engagement','التفاعل','Interaktion','Engagement','Coinvolgimento'],
 'audiencePreview':['Matching audience preview','معاينة الجمهور المطابق','Vorschau der passenden Zielgruppe','Aperçu de l’audience correspondante','Anteprima pubblico corrispondente'],
 'automation':['Deal follow-up recipes','قواعد متابعة الصفقات','Regeln zur Geschäftsnachverfolgung','Règles de suivi des affaires','Regole di follow-up delle trattative'],
 'enabled':['Enabled','مفعّل','Aktiviert','Activé','Attivato'],
 'title':['Title','العنوان','Titel','Titre','Titolo'],
 'add':['Add','إضافة','Hinzufügen','Ajouter','Aggiungi'],
 'save':['Save','حفظ','Speichern','Enregistrer','Salva'],
 'remove':['Remove','إزالة','Entfernen','Retirer','Rimuovi'],
 'type':['Type','النوع','Typ','Type','Tipo'],
 'text':['Text','نص','Text','Texte','Testo'],
 'date':['Date','تاريخ','Datum','Date','Data'],
 'choices':['Comma-separated choices','خيارات مفصولة بفواصل','Optionen, durch Kommas getrennt','Choix séparés par des virgules','Opzioni separate da virgole'],
 'number':['Number','رقم','Zahl','Nombre','Numero'],
 'empty':['No items yet','لا توجد عناصر بعد','Noch keine Einträge','Aucun élément','Nessun elemento'],
 'fileError':['Choose a supported file within the size limit.','اختر ملفًا مدعومًا ضمن حد الحجم.','Unterstützte Datei innerhalb des Größenlimits auswählen.','Choisissez un fichier pris en charge respectant la taille limite.','Scegli un formato supportato entro il limite di dimensione.']
}
ROWS.update({
 'deliveredMock':['Mock delivery recorded','تم تسجيل تسليم محاكى','Simulierte Zustellung erfasst','Livraison simulée enregistrée','Consegna simulata registrata'],
 'notDeliveredMock':['No mock delivery recorded','لم يُسجل تسليم محاكى','Keine simulierte Zustellung erfasst','Aucune livraison simulée enregistrée','Nessuna consegna simulata registrata'],
 'cancel':['Cancel','إلغاء','Abbrechen','Annuler','Annulla'],
 'project':['Tasks project','مشروع المهام','Aufgabenprojekt','Projet de tâches','Progetto attività'],
 'section':['Board section','قسم اللوحة','Board-Bereich','Section du tableau','Sezione della bacheca'],
 'run':['Run local recipes','تشغيل القواعد المحلية','Lokale Regeln ausführen','Exécuter les règles locales','Esegui regole locali'],
 'pendingDraft':['Unsaved changes are retained on this computer.','تُحتفظ بالتغييرات غير المحفوظة على هذا الجهاز.','Nicht gespeicherte Änderungen bleiben auf diesem Computer erhalten.','Les modifications non enregistrées sont conservées sur cet ordinateur.','Le modifiche non salvate restano su questo computer.']
})
ROWS.update({
 'trialNotice':['Your trial is ending','توشك الفترة التجريبية على الانتهاء','Ihre Testphase endet','Votre essai se termine','Il periodo di prova sta terminando'],
 'paymentNotice':['Payment needs attention','يتطلب الدفع مراجعة','Zahlung erfordert Aufmerksamkeit','Un paiement nécessite votre attention','Un pagamento richiede attenzione'],
 'priceNotice':['Pricing update','تحديث الأسعار','Preisänderung','Mise à jour des prix','Aggiornamento prezzi'],
 'serviceNotice':['Service request updated','تم تحديث طلب الخدمة','Serviceanfrage aktualisiert','Demande de service mise à jour','Richiesta di servizio aggiornata'],
 'noTaxChecks':['No tax checks yet','لا توجد فحوصات ضريبية بعد','Noch keine Steuerprüfungen','Aucune vérification fiscale','Nessuna verifica fiscale']
})
ROWS.update({
 'anyEngagement':['Any engagement','أي تفاعل','Beliebige Interaktion','Toute interaction','Qualsiasi coinvolgimento'],
 'mentionNotice':['You were mentioned','تمت الإشارة إليك','Sie wurden erwähnt','Vous avez été mentionné','Ti hanno menzionato'],
 'replyNotice':['New reply','رد جديد','Neue Antwort','Nouvelle réponse','Nuova risposta'],
 'contractNotice':['Contract awaiting review','عقد ينتظر المراجعة','Vertrag wartet auf Prüfung','Contrat à examiner','Contratto in attesa di revisione'],
 'ticketNotice':['New support ticket','تذكرة دعم جديدة','Neues Supportticket','Nouveau ticket de support','Nuovo ticket di assistenza'],
 'offerNotice':['New offer request','طلب عرض جديد','Neue Angebotsanfrage','Nouvelle demande de devis','Nuova richiesta di offerta'],
 'deleteTeam':['Delete team','حذف الفريق','Team löschen','Supprimer l’équipe','Elimina squadra'],
 'deleteTeamImpact':['Removes this team and its bookmarks. Projects and tasks remain; team assignments are removed.','يزيل الفريق وإشاراته المرجعية. تبقى المشاريع والمهام وتُزال إسنادات الفريق.','Entfernt das Team und seine Lesezeichen. Projekte und Aufgaben bleiben; Teamzuweisungen entfallen.','Supprime l’équipe et ses favoris. Les projets et tâches restent ; les affectations d’équipe sont retirées.','Elimina la squadra e i preferiti. Progetti e attività restano; vengono rimosse le assegnazioni alla squadra.']
})
if __name__=='__main__':
 packet={'Roadmap.'+key:dict(zip(LOCALES,value)) for key,value in ROWS.items()}
 for app in sys.argv[1:] or ['sos','tasks','hr','files','sales','marketing','chats','wm','admin']:
  base=ROOT/'apps'/app
  if app in ['sales','marketing']:
   path=base/'scripts/messages/90-roadmap.json';path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(packet,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
   subprocess.run([sys.executable,'scripts/add-messages.py','scripts/messages/90-roadmap.json'],cwd=base,check=True)
  else:
   for loc in LOCALES:
    path=base/'messages'/loc/'roadmap.json' if app=='admin' else base/'messages'/f'{loc}.json'
    data=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    if app=='chats':data.update({'roadmap.'+key:value[LOCALES.index(loc)] for key,value in ROWS.items()})
    else:data['Roadmap']={key:value[LOCALES.index(loc)] for key,value in ROWS.items()}
    path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  print(app,'catalogs updated')
