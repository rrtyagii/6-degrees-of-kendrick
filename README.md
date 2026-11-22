# Six Degrees of Kendrick

Find the shortest chain of musical collaborations between Kendrick Lamar and
another artist. Search by name, browse autocomplete suggestions, or try a random artist.

[Visit the website](https://sixdegreesofkendrick.com/)

## Demo

![App demo showing autocomplete, an artist search, and random selection](docs/demo.gif)

[Watch or download the MP4](docs/demo.mp4) or [view a static screenshot](docs/demo-poster.png).
Recorded locally using the saved dataset. Players load automatically; playback is not started.

## Run Locally

Requires **Node.js 22 or newer** and npm.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). No API keys, Spotify account, or database
are needed. TypeScript and CSS rebuild automatically; restart after changing datasets.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with file watching |
| `npm test` | Run type checks, build, and app/security regression tests |
| `npm run build` | Compile TypeScript and generate CSS |
| `npm start` | Run the compiled server after building |

For production, run `npm run build`, then `NODE_ENV=production npm start`.
The default port is 3000; set `PORT` to change it. See
[deployment and dependency updates](docs/operations.md) before deploying.

## How It Works

The Express server loads saved artist and track data from `src/mocks/current_*.json`.
A breadth-first search from Kendrick builds an index of shortest collaboration paths,
so searches reuse the index rather than traverse the graph again. The browser uses
plain JavaScript and Tailwind CSS.

Results reflect this dataset, not every collaboration on Spotify. Search uses local
data; results automatically show Spotify players without starting playback. Players
near the viewport load first using browser-native lazy loading, with reserved space
to avoid layout jumps. Embeds contact Spotify, so viewing results sends requests to
Spotify even if you do not press play. They require internet access and may be
blocked by privacy extensions.

## Project Layout

- `src/`: browser UI, server routes, graph logic, and saved datasets.
- `test/`: graph correctness and HTTP security regression tests.
- `maintenance/`: optional Spotify/Supabase data tools with separate dependencies.
- `docs/`: demo files and operational notes.

To collect or update data, follow the [maintenance guide](maintenance/README.md).
Those tools need their own credentials and are not needed to run the website.

## Credits

Built by [Rishabh Tyagi](https://www.rishtyagi.com), inspired by six degrees of
separation. Data collection uses the [Spotify Web API](https://developer.spotify.com/documentation/web-api)
and [Spotify TypeScript SDK](https://github.com/spotify/spotify-web-api-ts-sdk).
