import type { MarketingEditor, MarketingScene } from "./types";
import type { BoardMove } from "@orgtik/ui";
export const marketingPeople = { current: "Hoda Ashraf", mona: "Mona Adel", nour: "Nour Khaled", rana: "Rana Saad", omar: "Omar Farouk", salma: "Salma Nabil", hoda: "Hoda Ashraf", hany: "Hany Samir" };
export const marketingWorkspaces: Record<string, string> = { current: "Nile Foods", nile: "Nile Foods", orgtik: "OrgTik", spree: "Spree", desert: "Desert", new: "New workspace" };
export const marketingKey = (workspace: string) => `orgtik:presentation:marketing:${workspace}`;
export function seedMarketing(workspace: string): MarketingScene {
  const names = workspace === "orgtik" ? ["Mona Adel", "Hoda Ashraf", "Omar Farouk"] : ["Nour Khaled", "Rana Saad", "Salma Nabil"];
  const people = workspace === "new" ? [] : names.map((name, i) => ({ id: `contact-${i}`, name, email: `${name.toLowerCase().replaceAll(" ", ".")}@presentation.test`, consent: i !== 2 }));
  return { people, leads: [], sent: 0, opened: 0, clicked: 0, replies: [], posts: workspace === "new" ? [] : [{ id: "post-1", title: "Launch announcement", state: "draft", at: "2026-10-12T09:00:00Z" }, { id: "post-2", title: "Partner spotlight", state: "scheduled", at: "2026-10-15T09:00:00Z" }], journey: { delay: 2, active: false, logs: [] } };
}
export function seedMarketingEditor(workspace: string, locale: string): MarketingEditor {
  const company = marketingWorkspaces[workspace], heading: Record<string, string> = { en: `A new chapter for ${company}`, ar: `بداية جديدة مع ${company}`, de: `Ein neues Kapitel für ${company}`, fr: `Un nouveau chapitre pour ${company}`, it: `Un nuovo capitolo per ${company}` };
  const bodies: Record<string, string> = { en: "Discover our latest products and meet the people behind them.", ar: "تعرّف على أحدث منتجاتنا والأشخاص الذين يعملون عليها.", de: "Entdecken Sie unsere neuesten Produkte und die Menschen dahinter.", fr: "Découvrez nos nouveautés et les personnes qui les créent.", it: "Scopri le novità e le persone che le creano." };
  const buttons: Record<string, string> = { en: "Explore the collection", ar: "استكشف المجموعة", de: "Kollektion entdecken", fr: "Découvrez la collection", it: "Esplora la collezione" };
  const campaigns:Record<string,string>={en:"OrgTik partner launch",ar:"إطلاق شركاء OrgTik",de:"OrgTik-Partnerstart",fr:"Lancement des partenaires OrgTik",it:"Lancio partner OrgTik"};
  return { headline: heading[locale] ?? heading.en, body: bodies[locale] ?? bodies.en, cta: buttons[locale] ?? buttons.en, direction: locale === "ar" ? "rtl" : "ltr", campaignName:campaigns[locale]??campaigns.en, reply: "", topic: "", voice: "warm", delay: "2", postTitle: "" };
}
export function marketingDraft(topic: string, workspace: string, locale: string, voice: string) {
  const templates: Record<string, [string, string]> = { en: [`Discover ${topic} with ${workspace}`, `A fresh update from our team. Explore ${topic} and tell us what you think.`], ar: [`اكتشف ${topic} مع ${workspace}`, `تحديث جديد من فريقنا. تعرّف على ${topic} وشاركنا رأيك.`], de: [`${topic} mit ${workspace} entdecken`, `Ein neues Update von unserem Team. Entdecken Sie ${topic} und teilen Sie Ihre Meinung.`], fr: [`Découvrez ${topic} avec ${workspace}`, `Une nouveauté de notre équipe. Découvrez ${topic} et partagez votre avis.`], it: [`Scopri ${topic} con ${workspace}`, `Una novità dal nostro team. Scopri ${topic} e condividi la tua opinione.`] };
  const [headline, body] = templates[locale] ?? templates.en; return { headline, body: voice === "direct" ? headline + "." : body };
}
export const escapeMarketingHtml = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
export function moveMarketingPost(scene: MarketingScene, move: BoardMove): MarketingScene {
  const post = scene.posts.find(item => item.id === move.itemId);
  if (!post || !["draft", "scheduled", "delivered"].includes(move.toColumnId)) return scene;
  const posts = scene.posts.filter(item => item.id !== post.id);
  let index = move.beforeId ? posts.findIndex(item => item.id === move.beforeId) : -1;
  if (index < 0 && move.afterId) { const after = posts.findIndex(item => item.id === move.afterId); if (after >= 0) index = after + 1; }
  if (index < 0) index = posts.length;
  posts.splice(index, 0, { ...post, state: move.toColumnId as typeof post.state });
  return { ...scene, posts };
}
