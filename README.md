# About

Kendrick Lamar is one of the best to ever to do it, if not the best. 

With his huge network, there's an enormous library of artists just a stone's throw away from Kendrick. But how short is that stone's throw? Search for an artist and find out for yourself!

This website gets its name from the theory of 'Six Degrees of Separation' in which every pair of people on the planet are on average just six connections away from one another.

Website by [Rishabh Tyagi](https://www.rishtyagi.com).

This website is made possible with the use of the [Spotify Web API](https://developer.spotify.com/documentation/web-api) and [spotify-typescript-sdk](https://developer.spotify.com/blog/2023-07-03-typescript-sdk).

check it out [here](https://sixdegreesofkendrick.com/): 

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Use Node.js 22 or newer and run `npm ci` before starting. The development command
watches TypeScript and CSS; restart it after editing the datasets. Search uses
the three `src/mocks/current_*.json` datasets and requires no database or Spotify
credentials. The graph is validated and indexed before the server accepts requests.

Run `npm test` for graph correctness and HTTP security regressions. Run
`npm run build`, then `NODE_ENV=production npm start` for production. Deploy
`build/`, the HTML/script/generated CSS in `src/`, `src/mocks/current_*.json`, and
`public/favicon.ico`. Keep `.env` files, TLS private keys and maintenance credentials
out of the deployment artifact.

The app trusts the direct socket address for rate limiting. Behind a reverse proxy,
configure trusted proxy addresses for that deployment and apply rate limits at the
edge. Multiple server instances need an edge limit or shared rate-limit store;
the default in-memory counters are per process. Terminate HTTPS at the hosting
platform and set `NODE_ENV=production` to enable HSTS and HTTPS-only CSP upgrades.

Spotify players load only after selecting "Load Spotify player". Searching itself
does not contact Spotify. The optional database/Spotify maintenance scripts live in
the independent [`maintenance/`](maintenance/README.md) package. They have their own
lockfile and dependencies; root `npm ci` does not install the SDKs or dotenv.
Install those tools only when collecting or updating data, and exclude
`maintenance/` from the website deployment.

<img width="1509" alt="Screenshot 2024-05-25 at 11 53 30 PM" src="https://github.com/rrtyagii/6-degrees-of-kendrick/assets/47730677/f32b2c68-60b9-4d34-8850-6dd5c4a431e9">
