# Deployment and Dependency Updates

## Build and Deploy

Use Node.js 22 or newer:

```sh
npm ci
npm test
npm run build
NODE_ENV=production npm start
```

Deploy `build/`, `package.json`, `package-lock.json`, `src/index.html`,
`src/formScript.js`, `src/styles/output.css`, `src/mocks/current_*.json`, and
`public/favicon.ico`. Install runtime dependencies with `npm ci --omit=dev`
in the deployment artifact after building. Keep the relative directory layout.
The default port is 3000; set `PORT` if your host requires another port.

Exclude `.env` files, TLS private keys, and `maintenance/` from the website
deployment. Searching requires no Spotify or database credentials. The optional
[maintenance tools](../maintenance/README.md) have their own lockfile and dependencies;
root `npm ci` does not install their SDKs or dotenv.

Terminate HTTPS at the hosting platform. `NODE_ENV=production` enables HSTS and
HTTPS-only CSP upgrades, so production must be served over HTTPS.

The app trusts the direct socket address for rate limiting. Behind a reverse proxy,
configure trusted proxy addresses for that deployment and apply rate limits at the
edge. Multiple server instances need an edge limit or shared rate-limit store;
the default in-memory counters are per process. Do not blindly trust forwarding headers.

## Build Compatibility

The build uses TypeScript 7 with Node16 module resolution and the Tailwind 4 CLI.
Node typings target Node 22. Tailwind scans only the HTML and browser script, not
the artist datasets. The browser baseline is Safari 16.4+, Chrome 111+, or Firefox
128+ because Tailwind 4 relies on modern CSS features.

## Dependency Updates

Dependabot checks npm dependencies daily and groups minor/patch updates separately
for the website and maintenance tools. Routine version updates have a seven-day
cooldown; security updates are not delayed. Major upgrades remain separate PRs.
CodeQL actions update together to avoid mixing incompatible init/analyze versions.
CI audits both lockfiles and runs the website and maintenance tests on PRs, daily,
and on demand. Maintenance CI does not use live credentials.

Optional automatic merging is disabled by default. To enable it:

1. Protect `main` with required checks `verify`, `maintenance`,
   `Analyze JavaScript and TypeScript`, and `CodeQL`.
2. Require branches to be up to date.
3. Enable the repository's **Allow auto-merge** setting.
4. Set the Actions repository variable `DEPENDABOT_AUTOMERGE` to `true`.

The automation accepts only verified Dependabot npm minor/patch PRs that change
package manifests or lockfiles. It verifies required CI/CodeQL checks before queuing
a native GitHub auto-merge and never checks out PR code with write permissions.
If the required checks cannot be verified, the PR stays manual. Major upgrades and
GitHub Actions changes always require review. Tests and advisory audits do not
prove a package is malware-free.
