import React from "react";
import snapshot from "../content/snapshot";
import { currentLocale, wordsOf } from "../content/locale";
import { SectionMedia } from "../content/managed-page";
import "./cms-content.css";
const labels = {
  en: ["Reviews", "Sample review"],
  ar: ["التقييمات", "تقييم تجريبي"],
  de: ["Bewertungen", "Beispielbewertung"],
  fr: ["Avis", "Avis de démonstration"],
  it: ["Recensioni", "Recensione dimostrativa"],
};
export function Testimonials(props) {
  const reviews = (snapshot.entries.review ?? [])
    .slice()
    .sort((a, b) => (a.position ?? a.order) - (b.position ?? b.order));
  if (!reviews.length) return null;
  const label = labels[currentLocale()] ?? labels.en;
  return (
    <section {...props} id="reviews" className="cms-reviews">
      <h2>{label[0]}</h2>
      <div className="cms-reviews-grid">
        {reviews.map((entry) => {
          const words = wordsOf(entry.locales);
          return (
            <figure key={entry.id} className="cms-review">
              {entry.sample ? (
                <span className="cms-sample-label">{label[1]}</span>
              ) : null}
              <blockquote>{words.quote}</blockquote>
              <figcaption>
                {entry.image?.src ? (
                  <img
                    src={
                      /^https?:\/\//.test(entry.image.src)
                        ? entry.image.src
                        : `/assets/${entry.image.src}`
                    }
                    alt={
                      entry.image.alt?.[currentLocale()] ??
                      entry.image.alt?.en ??
                      ""
                    }
                    style={{
                      objectPosition: `${entry.image.focal?.x ?? 50}% ${entry.image.focal?.y ?? 50}%`,
                    }}
                    loading="lazy"
                  />
                ) : null}
                <span>
                  <strong>{words.name}</strong>
                  <span>
                    {[words.role, words.company].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </figcaption>
              <SectionMedia
                items={Object.values(
                  entry.presentation?.sectionMedia ?? {},
                ).flat()}
              />
            </figure>
          );
        })}
      </div>
    </section>
  );
}
