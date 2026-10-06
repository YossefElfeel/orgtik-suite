// User text (a post's title, a person's name) dropped into a sentence in another direction: an
// English title in an Arabic sentence pulls the quotes and punctuation around it the wrong way.
// First-strong isolates keep it to itself, in its own direction (Unicode FSI … PDI).
export const isolate = (s: string | null | undefined) => `\u2068${s ?? ""}\u2069`;
