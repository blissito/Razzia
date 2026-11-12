# Embedding (fork additions)

This fork adds what a host app needs to run Razzia next to its own UI (for example beside a video call). Everything is optional and off by default.

## Player in an iframe

```
https://quiz.example.com/?pin=123456&name=Ana&lng=es&mute=1
```

- `pin`: checked automatically (upstream behaviour).
- `name`: joins with that name, nobody types it. Ignored when the game generates nicknames.
- `lng`: forces the language.
- `mute=1`: silences the player view for the rest of the session; the shared game board already carries the sound.

- `id`: a signed identity (below). The server imposes the signed name and saves the host app's user id with the results.

Storage access is guarded, so a browser that blocks iframe storage no longer crashes the join screen.

## Manager token handoff

The host app's server creates the game with its own manager session (`POST /api/auth/session`, `POST /api/auth/manager`, `POST /api/games`) and opens:

```
https://quiz.example.com/embed/manager#token=<jwt>&gameId=<id>   -> the game board
https://quiz.example.com/embed/manager#token=<jwt>&to=quizz      -> the quiz editor
```

Add `&join=<https url>` next to `gameId` to give the lobby board the host app's own entry link: the board shows it as the QR code instead of the PIN card. Combine it with `joinHint` in `branding/theme.json` (the text next to the QR). Without `join` the board keeps the regular PIN card and QR.

`POST /api/games` accepts `requireIdentity: true` for a members-only game: joins without a signed identity get 403 for that game only, while other games stay open to anyone with the PIN. `REQUIRE_IDENTITY=1` still forces it for the whole instance.

The token travels in the URL hash, which never reaches the server, its access logs or `Referer` headers. The page stores it and reloads on the target route. Open the board right away: a game without a connected manager expires after about 5 minutes.

## Container

| Variable          | What it does                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `CONFIG_PATH`     | Where quizzes, results, media and branding live. Defaults to `/app/config`. Useful with a single volume. |
| `FRAME_ANCESTORS` | Space-separated origins allowed to embed the app (`Content-Security-Policy: frame-ancestors`).           |

| `IDENTITY_SECRET` | Shared secret (32+ characters) for signed player identities. |
| `REQUIRE_IDENTITY` | `1` refuses every join without a valid identity, so a guessed PIN is useless to outsiders. |

nginx also caps attempts on `/api/auth/manager` and `/api/games/check`.

## Signed player identity

The host app vouches for a player with `id=<payload>.<signature>`:

- `payload`: `base64url(JSON)` of `{ "sub": "<host user id>", "name": "<display name>", "exp": <unix seconds>, "pin": "<invite code>" }`. `pin` is optional and binds the token to one game.
- `signature`: `hex(HMAC-SHA256(payload, IDENTITY_SECRET))`.

A player who joined this way is saved in the result file with `externalId` (the `sub`), next to `username`, `points` and `rank`. Results also carry the `gameId` returned by `POST /api/games`, so the host app can find the result of the game it created.

## Working on this fork

- Branch `fixtergeek`; every push builds `ghcr.io/blissito/razzia:main` (`.github/workflows/ghcr-main.yml`).
- Checks: `pnpm --filter @razzia/web exec tsc --noEmit -p .`, `pnpm exec oxlint <files>`, `pnpm test`.
- Keep additions optional and off by default, so the fork can still follow upstream.
- A branded instance (a `branding/theme.json` exists) hides the project footer on the entry screens.
