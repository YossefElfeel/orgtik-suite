import snapshot from "./snapshot.js";
import { currentLocale } from "./locale.js";

const API = import.meta.env?.VITE_CMS_API ?? "http://localhost:4007/v2";
const visible = new Set(["open", "planned", "in_progress", "shipped"]);
const labels = {
  en: {
    consent:
      "I agree to the processing of my details to review this idea, as described in the",
    privacy: "privacy policy",
    pending:
      "Your idea is waiting for review. It will appear on the community roadmap if published.",
    required: "Please agree to the privacy policy before submitting your idea.",
  },
  ar: {
    consent: "أوافق على معالجة بياناتي لمراجعة هذه الفكرة، كما هو موضح في",
    privacy: "سياسة الخصوصية",
    pending:
      "فكرتك بانتظار المراجعة. ستظهر في خارطة طريق المجتمع إذا تم نشرها.",
    required: "يرجى الموافقة على سياسة الخصوصية قبل إرسال فكرتك.",
  },
  de: {
    consent:
      "Ich stimme der Verarbeitung meiner Angaben zur Prüfung dieser Idee zu, wie beschrieben in der",
    privacy: "Datenschutzerklärung",
    pending:
      "Deine Idee wartet auf eine Prüfung. Nach der Veröffentlichung erscheint sie auf der Community-Roadmap.",
    required: "Bitte stimme vor dem Absenden der Datenschutzerklärung zu.",
  },
  fr: {
    consent:
      "J’accepte le traitement de mes coordonnées pour examiner cette idée, comme indiqué dans la",
    privacy: "politique de confidentialité",
    pending:
      "Votre idée est en attente de modération. Elle apparaîtra sur la feuille de route communautaire si elle est publiée.",
    required:
      "Veuillez accepter la politique de confidentialité avant d’envoyer votre idée.",
  },
  it: {
    consent:
      "Acconsento al trattamento dei miei dati per esaminare questa idea, come descritto nella",
    privacy: "informativa sulla privacy",
    pending:
      "La tua idea è in attesa di revisione. Apparirà nella roadmap della community se verrà pubblicata.",
    required:
      "Accetta l’informativa sulla privacy prima di inviare la tua idea.",
  },
};
const introNotes = {
  en: "Timeline entries are examples. Community ideas and visitor comments are reviewed before publication.",
  ar: "عناصر الجدول الزمني أمثلة. تتم مراجعة أفكار المجتمع وتعليقات الزوار قبل نشرها.",
  de: "Zeitleisteneinträge sind Beispiele. Community-Ideen und Besucherkommentare werden vor der Veröffentlichung geprüft.",
  fr: "Les éléments de la chronologie sont des exemples. Les idées et commentaires sont examinés avant publication.",
  it: "Le voci della cronologia sono esempi. Idee e commenti vengono esaminati prima della pubblicazione.",
};
const boardNotes = {
  en: "Ideas and comments are reviewed before publication. Votes stay in this browser session. Sample discussions are labelled separately.",
  ar: "تتم مراجعة الأفكار والتعليقات قبل نشرها. تبقى الأصوات في جلسة المتصفح هذه. يتم تمييز النقاشات التجريبية بشكل منفصل.",
  de: "Ideen und Kommentare werden vor der Veröffentlichung geprüft. Stimmen bleiben in dieser Browsersitzung. Beispieldiskussionen sind gesondert gekennzeichnet.",
  fr: "Les idées et commentaires sont examinés avant publication. Les votes restent dans cette session du navigateur. Les discussions d’exemple sont identifiées séparément.",
  it: "Idee e commenti vengono esaminati prima della pubblicazione. I voti restano in questa sessione del browser. Le discussioni di esempio sono indicate separatamente.",
};
const discussionLabels = {
  en: {
    comments: "Comments",
    sample: "Sample discussion",
    sampleNote: "These example comments are separate from visitor comments.",
    empty: "No approved visitor comments yet.",
    name: "Your name",
    email: "Email address",
    message: "Your comment",
    submit: "Submit comment",
    sending: "Sending…",
    commentConsent:
      "I agree to my name and comment being published after moderation, and to my email being used to review it, as described in the",
    received: "Comment received. It will appear here after approval.",
    another: "Write another comment",
    failed: "Couldn’t send your comment. Your text is kept; please try again.",
    paused:
      "Submissions are temporarily paused. Your text is kept; please try again later.",
    privacyChanged:
      "The privacy notice changed. Reload this page and review it before submitting.",
  },
  ar: {
    comments: "التعليقات",
    sample: "نقاش تجريبي",
    sampleNote: "هذه التعليقات التجريبية منفصلة عن تعليقات الزوار.",
    empty: "لا توجد تعليقات معتمدة من الزوار بعد.",
    name: "اسمك",
    email: "البريد الإلكتروني",
    message: "تعليقك",
    submit: "إرسال التعليق",
    sending: "جارٍ الإرسال…",
    commentConsent:
      "أوافق على نشر اسمي وتعليقي بعد المراجعة، واستخدام بريدي الإلكتروني لمراجعته، كما هو موضح في",
    received: "تم استلام التعليق. سيظهر هنا بعد الموافقة عليه.",
    another: "كتابة تعليق آخر",
    failed: "تعذّر إرسال تعليقك. تم الاحتفاظ بالنص؛ يرجى المحاولة مجددًا.",
    paused: "الإرسال متوقف مؤقتًا. تم الاحتفاظ بالنص؛ يرجى المحاولة لاحقًا.",
    privacyChanged: "تغير إشعار الخصوصية. أعد تحميل الصفحة وراجعه قبل الإرسال.",
  },
  de: {
    comments: "Kommentare",
    sample: "Beispieldiskussion",
    sampleNote:
      "Diese Beispielkommentare sind von Besucherkommentaren getrennt.",
    empty: "Noch keine freigegebenen Besucherkommentare.",
    name: "Dein Name",
    email: "E-Mail-Adresse",
    message: "Dein Kommentar",
    submit: "Kommentar senden",
    sending: "Wird gesendet…",
    commentConsent:
      "Ich stimme der Veröffentlichung meines Namens und Kommentars nach der Moderation und der Verwendung meiner E-Mail zur Prüfung zu, wie beschrieben in der",
    received: "Kommentar erhalten. Er erscheint hier nach der Freigabe.",
    another: "Weiteren Kommentar schreiben",
    failed:
      "Dein Kommentar konnte nicht gesendet werden. Dein Text bleibt erhalten; versuche es erneut.",
    paused:
      "Beiträge sind vorübergehend pausiert. Dein Text bleibt erhalten; versuche es später erneut.",
    privacyChanged:
      "Der Datenschutzhinweis hat sich geändert. Lade die Seite neu und prüfe ihn vor dem Absenden.",
  },
  fr: {
    comments: "Commentaires",
    sample: "Discussion d’exemple",
    sampleNote: "Ces exemples sont distincts des commentaires des visiteurs.",
    empty: "Aucun commentaire de visiteur approuvé pour le moment.",
    name: "Votre nom",
    email: "Adresse e-mail",
    message: "Votre commentaire",
    submit: "Envoyer le commentaire",
    sending: "Envoi…",
    commentConsent:
      "J’accepte la publication de mon nom et de mon commentaire après modération, et l’utilisation de mon e-mail pour son examen, comme indiqué dans la",
    received: "Commentaire reçu. Il apparaîtra ici après approbation.",
    another: "Écrire un autre commentaire",
    failed:
      "Votre commentaire n’a pas pu être envoyé. Votre texte est conservé ; réessayez.",
    paused:
      "Les envois sont temporairement suspendus. Votre texte est conservé ; réessayez plus tard.",
    privacyChanged:
      "L’avis de confidentialité a changé. Rechargez cette page et consultez-le avant l’envoi.",
  },
  it: {
    comments: "Commenti",
    sample: "Discussione di esempio",
    sampleNote: "Questi esempi sono separati dai commenti dei visitatori.",
    empty: "Nessun commento dei visitatori ancora approvato.",
    name: "Il tuo nome",
    email: "Indirizzo e-mail",
    message: "Il tuo commento",
    submit: "Invia commento",
    sending: "Invio…",
    commentConsent:
      "Acconsento alla pubblicazione del mio nome e commento dopo la moderazione e all’uso della mia e-mail per la revisione, come descritto nella",
    received: "Commento ricevuto. Apparirà qui dopo l’approvazione.",
    another: "Scrivi un altro commento",
    failed: "Impossibile inviare il commento. Il testo è conservato; riprova.",
    paused:
      "Gli invii sono temporaneamente sospesi. Il testo è conservato; riprova più tardi.",
    privacyChanged:
      "L’informativa sulla privacy è cambiata. Ricarica la pagina e leggila prima di inviare.",
  },
};
export const communityText = () => ({
  introNote: introNotes[currentLocale()] ?? introNotes.en,
  boardNote: boardNotes[currentLocale()] ?? boardNotes.en,
  ...(labels[currentLocale()] ?? labels.en),
  ...(discussionLabels[currentLocale()] ?? discussionLabels.en),
});
export const submissionError = (error) =>
  communityText()[
    error.code === "forms_preview"
      ? "paused"
      : error.code === "privacy_outdated"
        ? "privacyChanged"
        : "failed"
  ];

// Refresh this queue independently of the website's content bundle. A failure in an
// unrelated content request must not leave the community board on an old publication.
export async function refreshCommunity({
  api = API,
  fetcher = globalThis.fetch,
  signal,
} = {}) {
  const response = await fetcher(`${api.replace(/\/$/, "")}/public/ideas`, {
    signal,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Community ideas unavailable");
  const { data } = await response.json();
  if (
    !Array.isArray(data) ||
    new Set(data.map((idea) => idea?.id)).size !== data.length ||
    !data.every(
      (idea) =>
        typeof idea?.id === "string" &&
        idea.id &&
        visible.has(idea.status) &&
        ["title", "body", "theme"].every(
          (key) => typeof idea[key] === "string",
        ) &&
        ["votes", "comments"].every(
          (key) => Number.isInteger(idea[key]) && idea[key] >= 0,
        ) &&
        ["commentPreview", "discussion"].every(
          (key) =>
            !idea[key] ||
            (Array.isArray(idea[key]) &&
              idea[key].every((comment) =>
                ["id", "author", "body"].every(
                  (key) => typeof comment?.[key] === "string",
                ),
              )),
        ),
    )
  ) {
    throw new Error("Invalid community ideas");
  }
  if (signal?.aborted) throw new Error("Community refresh cancelled");
  snapshot.ideas.splice(0, snapshot.ideas.length, ...data);
}
