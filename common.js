// Shared helpers for every page. Tokens travel in the URL fragment (#…), which browsers never send to the host.
window.Lodestar = (() => {
  const config = window.LODESTAR_CONFIG || {};
  const USERNAME = /^[A-Za-z0-9_-]{3,24}$/;
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function api(path, body) {
    if (!config.apiUrl) return { ok: false, error: { code: "NOT_OPEN", message: "Signups aren't open quite yet. Please check back soon." } };
    try {
      const response = await fetch(config.apiUrl.replace(/\/$/, "") + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) return { ok: false, error: data.error || { code: `HTTP_${response.status}`, message: "Something went wrong. Please try again." } };
      return data;
    } catch {
      return { ok: false, error: { code: "NETWORK", message: "We couldn't reach the signup service. Check your connection and try again." } };
    }
  }

  const fragment = () => Object.fromEntries(new URLSearchParams(location.hash.slice(1)));

  // The private manage token must never sit in the address bar, where it could be copied and shared.
  // It arrives in the link's #fragment, is moved into this tab's sessionStorage (gone when the tab
  // closes or on sign out), and the fragment is erased from the address bar and this history entry.
  const SESSION_KEY = "lodestar.manage";
  let memory = null; // fallback when storage is blocked: lasts until reload
  const session = {
    take() {
      const { token, unsubscribe } = fragment();
      if (token || unsubscribe) {
        session.save(token || unsubscribe);
        history.replaceState(null, "", location.pathname + (unsubscribe ? "?leave" : ""));
      }
      try { return sessionStorage.getItem(SESSION_KEY) || memory; } catch { return memory; }
    },
    save(token) { memory = token; try { sessionStorage.setItem(SESSION_KEY, token); } catch {} },
    clear() { memory = null; try { sessionStorage.removeItem(SESSION_KEY); } catch {} }
  };
  const date = value => value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—";
  const $ = id => document.getElementById(id);

  function showOnly(id, ids) { for (const other of ids) $(other).hidden = other !== id; }
  function setError(element, message) { element.textContent = message || ""; element.hidden = !message; }
  function busy(button, text) {
    const original = button.textContent;
    button.disabled = true; button.textContent = text;
    return () => { button.disabled = false; button.textContent = original; };
  }

  // "Lost your link?" form, shared by confirm and manage pages.
  function bindLinkRequest(form) {
    const error = form.querySelector(".form-error");
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const email = form.elements.email.value.trim();
      if (!EMAIL.test(email)) return setError(error, "Enter a valid email address, like you@example.com.");
      setError(error, "");
      const done = busy(form.querySelector("button"), "Sending…");
      const result = await api("/link", { email, website: form.elements.website.value });
      done();
      if (!result.ok) return setError(error, result.error.message);
      form.hidden = true;
      const sent = form.nextElementSibling;
      sent.textContent = `If ${email} is on the list, a new link is on its way. Check your inbox (and spam folder).`;
      sent.hidden = false;
    });
  }

  return { api, fragment, session, date, $, showOnly, setError, busy, bindLinkRequest, USERNAME, EMAIL };
})();
