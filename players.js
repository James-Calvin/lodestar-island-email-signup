(() => {
  const { api, $, showOnly } = window.Lodestar;
  const states = ["players-loading", "players-list-state", "players-failed"];
  (async () => {
    const result = await api("/players", {});
    // The list is invisible until more than 20 people have joined: send visitors to the signup page instead.
    if (result.ok && !result.open) return location.replace("./");
    if (!result.ok) { $("players-error").textContent = result.error.message; return showOnly("players-failed", states); }
    document.title = "Who wants to play — Lodestar Island";
    $("players-eyebrow").textContent = "The crew so far";
    $("players-count").textContent = `${result.count.toLocaleString()} people want to play`;
    $("players-names").replaceChildren(...result.names.map(name => Object.assign(document.createElement("li"), { textContent: name })));
    $("players-names").hidden = result.names.length === 0;
    $("players-unnamed").textContent = result.unnamed === 0 ? "" : result.names.length === 0
      ? `${result.unnamed.toLocaleString()} players haven't reserved a name yet.`
      : `…and ${result.unnamed.toLocaleString()} unnamed ${result.unnamed === 1 ? "player" : "players"}.`;
    showOnly("players-list-state", states);
  })();
})();
