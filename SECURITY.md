# Security

Found a hole? **Don't file a public issue.** Open a private security
advisory instead. GitHub handles the disclosure timeline cleanly.

What I'll do:

- Reply within 3 business days.
- Triage and try to reproduce within 10 business days.
- Ship a fix, or at least a documented mitigation, as soon as I can.
- Credit you in the advisory if you want it. Say "anonymous" if you don't.

I follow responsible disclosure: please keep the report private until I
publish a fix and (if needed) a CVE / advisory.

## In scope

- Code in this repository.
- The build pipeline that produces the deployed static site.

## Out of scope

- Third-party APIs indexed in `data/`. Those are public endpoints
  catalogued for discovery; report issues to their operators.
- Scanners, social engineering, DoS, or "you used a default port".

## Attack surface

This project is a static export deployed to GitHub Pages. There is no
backend, no database, no server-side execution. The only inputs a
visitor can supply are URL parameters (search query) and the contents
of the JSON files shipped in `frontend/public/data/`. The latter are
generated at build time from Zod-validated input under `data/`.

A bad record in `data/` cannot execute code in the browser — it
appears as escaped text in the rendered output. The build will reject
malformed records before they ever reach production.
