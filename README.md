# Lodestar Island — release list site

The public website at **lodestar-island.com**: a plain static site with no build step, served by GitHub Pages from the root of `main`.

| File | Purpose |
| --- | --- |
| `index.html`, `signup.js` | Join the list (email, beta choices, optional username reservation) |
| `confirm.html`, `confirm.js` | Confirmation link landing page |
| `manage.html`, `manage.js` | Private page to change choices, request a new link, or unsubscribe |
| `privacy.html` | What is stored and why |
| `common.js` | Shared API and form helpers |
| `config.js` | **The API address.** Set `apiUrl` to the backend's `SignupApiUrl` (no trailing slash). Empty means "signups aren't open yet". |
| `styles.css`, `favicon.svg` | Look shared with the game prototype |
| `CNAME`, `.nojekyll` | Custom domain and plain static serving for GitHub Pages |

The backend (AWS Lambda, DynamoDB, SES) lives in a separate private repository. Nothing in this repository is secret. Private links carry their tokens in the URL fragment (`#…`), which browsers never send to this host. The pages immediately move the token into the tab's `sessionStorage` (see `session` in `common.js`) and erase it from the address bar. The address of an open manage page is therefore safe to copy, and the token is forgotten when the tab closes or on **Sign out**.

## Publishing

In *Settings → Pages*, choose **Deploy from a branch**, branch `main`, folder `/ (root)`. Use the custom domain `lodestar-island.com` with **Enforce HTTPS**. Every push to `main` republishes the site.

## Previewing

From the backend repository, run `npm run dev` with this repository checked out next to it. The whole flow then runs locally against an in-memory API.
