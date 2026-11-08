# Data Maintenance

This independent package contains the original Spotify collection and Supabase
population scripts. The website runs entirely from the saved JSON datasets and
does not install or import this package. This is deliberately not an npm workspace.

## Setup

Use Node.js 22 or newer. From the repository root:

```sh
npm ci --prefix maintenance --ignore-scripts
npm run build --prefix maintenance
```

For live operations, create `maintenance/.env` using the variable names in
`.env.example`. `CLIENT_ID` and `CLIENT_SECRET` are Spotify application credentials.
`SUPABASE_URL` and `SUPABASE_KEY` are required for database operations. Use an
administrator-controlled environment and keep this directory and its credentials
out of website deployments. The tools do not read the root `.env` file.

## Collect Data

Each command is explicit and contacts the configured service. Collection stages
write files under the shared `src/mocks/` directory and may overwrite intermediate
files, so review or back up existing datasets before running them.

```sh
# Choose either Kendrick's albums or the top artists' albums as a starting point.
npm run collect --prefix maintenance -- kendrick-albums

# Alternative starting point: read popular artists from Supabase, then fetch albums.
npm run collect --prefix maintenance -- top-artists
npm run collect --prefix maintenance -- artist-albums

# From albums_to_fetch_tracks_of.json, collect track IDs, then artist IDs.
npm run collect --prefix maintenance -- album-tracks
npm run collect --prefix maintenance -- track-artists
```

These legacy collectors do not automatically refresh the website's three
`current_*.json` snapshots. Export updated data from Supabase separately and review
the snapshots before deploying the website again.

## Populate Supabase

```sh
npm run populate --prefix maintenance
```

This command writes to Supabase using `src/mocks/artists_to_add.json` and
`src/mocks/tracks_to_add.json`. Do not run it against production unless you intend
to update that database. Builds and type checks never execute these operations.
