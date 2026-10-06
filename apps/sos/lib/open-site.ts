// Opens a site in a new tab whose address is only known after a request (a sign-in token).
// Popup blockers stop window.open after an await (SOS-019: the CMS "Login" and Content cards were
// blocked), so the tab opens at once, on the click, and is sent to the address when it's ready;
// if the request fails, the empty tab closes again. The new tab can't reach back to this one.
export async function openSite(getHref: () => Promise<string>): Promise<boolean> {
  const tab = window.open("about:blank", "_blank");
  try {
    const href = await getHref();
    if (tab) {
      tab.opener = null;
      tab.location.href = href;
    } else {
      window.location.assign(href);
    }
    return true;
  } catch {
    tab?.close();
    return false;
  }
}
