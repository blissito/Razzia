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

Storage access is guarded, so a browser that blocks iframe storage no longer crashes the join screen.

## Manager token handoff

The host app's server creates the game with its own manager session (`POST /api/auth/session`, `POST /api/auth/manager`, `POST /api/games`) and opens:

```
https://quiz.example.com/embed/manager#token=<jwt>&gameId=<id>   -> the game board
https://quiz.example.com/embed/manager#token=<jwt>&to=quizz      -> the quiz editor
```

The token travels in the URL hash, which never reaches the server, its access logs or `Referer` headers. The page stores it and reloads on the target route. Open the board right away: a game without a connected manager expires after about 5 minutes.

## Container

| Variable          | What it does                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `CONFIG_PATH`     | Where quizzes, results, media and branding live. Defaults to `/app/config`. Useful with a single volume. |
| `FRAME_ANCESTORS` | Space-separated origins allowed to embed the app (`Content-Security-Policy: frame-ancestors`).           |

nginx also caps attempts on `/api/auth/manager` and `/api/games/check`.
