(() => {
  const { api, fragment, session, $, showOnly, bindLinkRequest } = window.Lodestar;
  const states = ["confirm-loading", "confirm-done", "confirm-failed"];
  bindLinkRequest($("link-form"));

  async function run() {
    const { token } = fragment();
    if (!token) return showOnly("confirm-failed", states);
    const result = await api("/confirm", { token });
    if (!result.ok) {
      if (result.error.code !== "INVALID_LINK") $("confirm-error").textContent = result.error.message;
      return showOnly("confirm-failed", states);
    }
    // Drop the one-time token from the address bar and history.
    history.replaceState(null, "", location.pathname);
    const { profile, manageToken, usernameUnavailable } = result;
    const items = ["Full release"];
    if (profile.openBeta) items.push("Open beta");
    if (profile.closedBeta) items.push("Closed beta invite (requested)");
    if (profile.username) items.push(`Username reserved: ${profile.username}`);
    $("confirm-summary").replaceChildren(...items.map(text => Object.assign(document.createElement("li"), { textContent: text })));
    $("confirm-username-lost").hidden = !usernameUnavailable;
    // Hand the manage token to the next page through this tab's storage, not the URL.
    session.save(manageToken);
    showOnly("confirm-done", states);
  }
  run();
})();
