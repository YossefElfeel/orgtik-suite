// Preview targets are data markers/native anchors, never arbitrary selectors or actions.
const TARGET = /^(cms|id|class):([A-Za-z0-9_-]+)$/;

function visibleBox(element, view) {
  if (!element || element.closest?.("[hidden], [aria-hidden='true']"))
    return null;
  const style = view.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return null;
  if (element.getClientRects().length) return element;
  // A CMS group may use display:contents; its first rendered child is the scroll target.
  if (style.display === "contents") {
    for (const child of element.children) {
      const box = visibleBox(child, view);
      if (box) return box;
    }
  }
  return null;
}

export function findPreviewSection(document, target, view) {
  const match = TARGET.exec(target ?? "");
  if (!match) return null;
  const [, kind, name] = match;
  const candidates =
    kind === "id"
      ? [document.getElementById(name)]
      : document.querySelectorAll(
          kind === "cms" ? `[data-cms-section="${name}"]` : `.${name}`,
        );
  for (const element of candidates) {
    const box = visibleBox(element, view);
    if (box) return box;
  }
  return null;
}

/** Wait for React's lazy page, then show the requested section below the sticky header. */
export function focusPreviewSection(view, report, { timeout = 10000 } = {}) {
  const target = new URLSearchParams(view.location.search).get(
    "previewSection",
  );
  if (!target || !TARGET.test(target)) return () => {};
  const { document } = view;
  let finished = false;
  let observer;
  let timer;
  const cleanup = () => {
    observer?.disconnect();
    view.clearTimeout(timer);
  };
  const focus = () => {
    if (finished) return true;
    const element = findPreviewSection(document, target, view);
    if (!element) return false;
    finished = true;
    cleanup();
    const top = Math.max(
      0,
      element.getBoundingClientRect().top + view.scrollY - 100,
    );
    view.scrollTo({ top, behavior: "instant" });
    report({ section: target, sectionFound: true });
    return true;
  };
  let scheduled = false;
  const schedule = () => {
    if (finished || scheduled) return;
    scheduled = true;
    // Existing pages also restore native anchors during mount; the explicit CMS target wins.
    view.requestAnimationFrame(() =>
      view.requestAnimationFrame(() => {
        scheduled = false;
        focus();
      }),
    );
  };
  observer = new view.MutationObserver(schedule);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["hidden", "class", "style"],
  });
  timer = view.setTimeout(() => {
    if (focus()) return;
    finished = true;
    cleanup();
    // State-dependent copy (a receipt, item editor or dialog) is intentionally not created here.
    report({ section: target, sectionFound: false });
  }, timeout);
  schedule();
  return cleanup;
}
