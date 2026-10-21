(() => {
  const { api, $, setError, busy, USERNAME, EMAIL, showCommunityLink } = window.Lodestar;
  showCommunityLink($("community-link"));
  const form = $("signup-form"), error = $("signup-error");

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const email = form.elements.email.value.trim();
    const username = form.elements.username.value.trim();
    for (const field of [form.elements.email, form.elements.username]) field.removeAttribute("aria-invalid");
    if (!EMAIL.test(email) || email.length > 254) {
      form.elements.email.setAttribute("aria-invalid", "true"); form.elements.email.focus();
      return setError(error, "Enter a valid email address, like you@example.com.");
    }
    if (username && !USERNAME.test(username)) {
      form.elements.username.setAttribute("aria-invalid", "true"); form.elements.username.focus();
      return setError(error, "Usernames are 3–24 characters using letters, numbers, _ or -.");
    }
    setError(error, "");
    const done = busy($("signup-submit"), "Joining…");
    const result = await api("/signup", {
      email, username: username || null,
      openBeta: form.elements.openBeta.checked,
      closedBeta: form.elements.closedBeta.checked,
      website: form.elements.website.value
    });
    done();
    if (!result.ok) {
      if (["USERNAME_TAKEN", "INVALID_USERNAME", "RESERVATIONS_CLOSED"].includes(result.error.code)) {
        form.elements.username.setAttribute("aria-invalid", "true"); form.elements.username.focus();
      }
      return setError(error, result.error.message);
    }
    form.hidden = true;
    $("signup-intro").hidden = true;
    $("signup-success-email").textContent = email;
    $("signup-success").hidden = false;
    $("signup-success").focus();
  });
  for (const name of ["email", "username"]) form.elements[name].addEventListener("input", () => { form.elements[name].removeAttribute("aria-invalid"); setError(error, ""); });
})();
