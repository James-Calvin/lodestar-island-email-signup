(() => {
  const { api, session, date, $, showOnly, setError, busy, bindLinkRequest, USERNAME } = window.Lodestar;
  const states = ["manage-loading", "manage-request", "manage-form-state", "manage-unsubscribe-state", "manage-closed", "manage-gone"];
  const form = $("manage-form"), error = $("manage-error"), saved = $("manage-saved");
  let token = null, cameToUnsubscribe = false;
  bindLinkRequest($("link-form"));

  function render(profile) {
    $("manage-email").textContent = profile.email;
    $("manage-username-row").hidden = !profile.username;
    $("manage-username-reserved").textContent = profile.username
      ? (profile.reservation.heldUntil ? `${profile.username} (held until ${date(profile.reservation.heldUntil)})` : `${profile.username} (reserved)`)
      : "";
    $("manage-joined").textContent = date(profile.signedUpAt);
    $("manage-updated").textContent = date(profile.preferencesUpdatedAt);
    form.elements.openBeta.checked = profile.openBeta;
    form.elements.closedBeta.checked = profile.closedBeta;
    form.elements.username.value = profile.username || "";
    const { open, heldUntil } = profile.reservation;
    form.elements.username.disabled = !open && !profile.username;
    $("manage-username-hint").textContent = open
      ? "Held until 180 days after the full-release email. Create your game account with this email address to claim it. Leave empty to release it."
      : `Reservations are closed. ${profile.username ? `Yours is held until ${date(heldUntil)}; clear the box to release it.` : ""}`;
  }

  async function load() {
    token = session.take();
    cameToUnsubscribe = new URLSearchParams(location.search).has("leave");
    if (!token) return showOnly("manage-request", states);
    const result = await api("/profile", { token });
    if (!result.ok) {
      if (result.error.code === "INVALID_LINK") session.clear();
      $("manage-request-reason").textContent = result.error.code === "INVALID_LINK"
        ? "That link is no longer valid (it may be from before you unsubscribed or rejoined). Enter your email and we'll send a fresh one."
        : result.error.message;
      return showOnly("manage-request", states);
    }
    render(result.profile);
    showOnly(cameToUnsubscribe ? "manage-unsubscribe-state" : "manage-form-state", states);
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    saved.hidden = true;
    const username = form.elements.username.value.trim();
    if (username && !USERNAME.test(username)) return setError(error, "Usernames are 3–24 characters using letters, numbers, _ or -.");
    setError(error, "");
    const done = busy($("manage-save"), "Saving…");
    const body = { token, openBeta: form.elements.openBeta.checked, closedBeta: form.elements.closedBeta.checked };
    if (!form.elements.username.disabled) body.username = username || null;
    const result = await api("/preferences", body);
    done();
    if (!result.ok) return setError(error, result.error.message);
    render(result.profile);
    saved.textContent = result.changed ? "Saved." : "No changes to save.";
    saved.hidden = false;
  });
  form.addEventListener("input", () => { saved.hidden = true; });

  $("manage-unsubscribe").addEventListener("click", () => { showOnly("manage-unsubscribe-state", states); $("unsubscribe-confirm").focus(); });
  $("unsubscribe-cancel").addEventListener("click", () => { showOnly("manage-form-state", states); history.replaceState(null, "", location.pathname); });
  $("unsubscribe-confirm").addEventListener("click", async () => {
    const done = busy($("unsubscribe-confirm"), "Unsubscribing…");
    const result = await api("/unsubscribe", { token });
    done();
    if (!result.ok) return setError($("unsubscribe-error"), result.error.message);
    session.clear();
    history.replaceState(null, "", location.pathname);
    showOnly("manage-gone", states);
  });
  // "Sign out" for shared devices: forget the private link and wipe what's on screen.
  $("manage-close").addEventListener("click", () => {
    token = null;
    session.clear();
    form.reset();
    for (const id of ["manage-email", "manage-joined", "manage-updated", "manage-username-reserved"]) $(id).textContent = "";
    setError(error, ""); saved.hidden = true;
    history.replaceState(null, "", location.pathname);
    showOnly("manage-closed", states);
  });
  window.addEventListener("hashchange", load);
  load();
})();
