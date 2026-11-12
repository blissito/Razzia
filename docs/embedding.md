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
| `SERVICE_KEY` | Secret (32+ characters) of the host app's server. Creates games and reads results without a manager session (below). |

nginx also caps attempts on `/api/auth/manager` and `/api/games/check`.

## Multi-tenant engine

A host app that owns its quizzes and results uses the instance as a game engine: nothing of a tenant has to live here, and the browser of the person running the game never holds an instance-wide credential. The older flow above (manager password, `quizzId`) keeps working unchanged.

### Service key

The host app's **server** sends `Authorization: Bearer <SERVICE_KEY>`. It can call `POST /api/games` and `/api/results` (list, read, delete), and nothing else: `/api/quizz` and `/api/media` still need a manager session. Never ship the key to a browser.

### Creating a game

```
POST /api/games
Authorization: Bearer <SERVICE_KEY>          (or a manager session token)

{
  "quizz": { "gameMode": "quiz", "subject": "…", "questions": [ … ] },
  "tenant": "acme-42",
  "requireIdentity": true,
  "branding": {
    "appName": "Acme Quiz",
    "colors": { "primary": "#85DDCB", "answer-1": "rgb(230, 159, 0)" },
    "logo": "https://acme.example/logo.png",
    "joinHint": "Join from the call"
  }
}
```

- `quizz` **or** `quizzId`, exactly one. An inline `quizz` has the same shape as a saved one (`POST /api/quizz`), is never written to disk and lives only as long as the game. Limits: 100 questions; `subject` 200 characters, `question` 1000, each answer 300, `note` 2000, `category` 100, media `url` 2048; request body 256 KB (413 above that).
- `tenant` (optional): opaque label, up to 64 characters of `A-Z a-z 0-9 _ -`. It is saved with the result.
- `branding` (optional): see below.
- Validation errors answer 400 with `{ "error": "<key>" }`.

Response, `201`:

```
{ "gameId": "…", "inviteCode": "123456" }                                   <- manager session
{ "gameId": "…", "inviteCode": "123456", "hostToken": "<jwt>", "hostTokenExpiresAt": 1790000000 }   <- service key
```

Invite codes are unique among live games.

### Host token

`hostToken` is a manager token that owns the new game and carries `scope: <gameId>`. Hand it to the browser of whoever runs the game:

```
https://quiz.example.com/embed/manager#token=<hostToken>&gameId=<id>&join=<https url>
```

It can run that one game (the board's socket events and `PATCH /api/games/<id>/settings`) and nothing else: `/api/quizz/*`, `/api/results/*`, `/api/media/*`, `POST /api/games` and the settings of any other game answer 403, and its socket cannot attach to another game. It lasts 12 hours. With it the board has no instance panel to go back to: the lobby has no exit button and the final screen stays up, so the host app closes the frame. `#token=<hostToken>&to=quizz` is not supported (the editor needs an instance manager).

### Per-game branding

Only this shape is accepted (any other field is a 400):

| Field      | Rule                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------ |
| `appName`  | Up to 60 characters. Becomes the page title and the name on the brand bar of every game screen.  |
| `colors`   | Theme color names (below) → a hex color or `rgb()`/`hsl()` value.                                |
| `logo`     | `https://` URL. Shown on the brand bar; without it the bar shows the initials of `appName`.      |
| `joinHint` | Up to 160 characters. Shown under the PIN on the lobby board, or next to the host app's QR code. |

Color names. The whole game UI paints with them, so a light palette works as well as the default dark one:

| Name                                          | Paints                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `background`, `card`, `border`                | Page, cards and bars, 1px lines.                                                                        |
| `foreground`, `muted-foreground`, `muted`     | Text, secondary text, soft fills (chips, timer track).                                                  |
| `primary`, `primary-foreground`               | The filled button, timer, first place; and the text on top of it.                                       |
| `correct`, `danger`                           | Right and wrong answer marks.                                                                           |
| `answer-1` … `answer-4`                       | Base tone of answers A–D. The tile is that tone diluted in `background`.                                |
| `answer-1-foreground` … `answer-4-foreground` | Letter and text of each answer. Default: the tone itself on a dark background, a darkened one on light. |
| `secondary`, `accent`, `accent-foreground`    | Legacy names; they follow `background`, `border` and `foreground` unless set.                           |

On a light `background` the client darkens `answer-N-foreground`, `correct` and `danger` by itself when the brand does not send them.

```
GET /api/games/<gameId>/branding     (public)
200 { "branding": { … } }   |   200 { "branding": null }   |   404 unknown game
```

`POST /api/games/check` (the PIN check) also answers `subject`, `totalQuestions` and `branding`, so the name screen already carries the brand. The game board and the player screen fetch it when they enter the game and put it on top of the instance theme; leaving the game restores the instance theme. The PIN entry page, where no game is known yet, keeps the instance theme.

### Results

The result file now carries `tenant` next to `gameId`, and the list can be narrowed:

```
GET /api/results                      every result
GET /api/results?gameId=<id>          the result of one game
GET /api/results?tenant=<label>       the results of one tenant
-> { "results": [{ "id", "gameId", "tenant", "gameMode", "subject", "date", "playerCount" }] }
GET /api/results/<id>     DELETE /api/results/<id>
```

A host app that keeps its own copy reads the result after the game and deletes it here.

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
