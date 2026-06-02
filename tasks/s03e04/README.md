# S03E04 — homework `negotiations`

## Azyl — agent11784

| Co | Wartość |
| --- | --- |
| SSH | `ssh agent11784@azyl.ag3nts.org -p 5022` |
| Port aplikacji | **`51784`** (nasłuch Bun) |
| Publiczny HTTPS | **`https://azyl-51784.ag3nts.org`** |

Subdomena azyl = **port aplikacji** (`51784`), nie port SSH (`5022`).  
Przykład z lekcji S01E03: `https://azyl-50005.ag3nts.org` ↔ port `50005`.

## Start na azyl

```bash
cd ~/tasks/s03e04
pkill -f "server.ts" 2>/dev/null || true
unset PORT PUBLIC_BASE_URL
bun run server.ts > server.log 2>&1 &

curl -s http://127.0.0.1:51784/health
curl -s https://azyl-51784.ag3nts.org/health   # powinno być 200 + JSON
```

## Rejestracja + flaga

```bash
PUBLIC_BASE_URL=https://azyl-51784.ag3nts.org bun --env-file=../.env run register.ts
sleep 45
bun --env-file=../.env run check.ts
```

Pełna dokumentacja: sekcje deploy/troubleshooting poniżej w tym pliku (rsync, `bun install`, zmienne).

## Deploy (rsync)

```bash
cd tasks/s03e04
rsync -avz -e "ssh -p 5022" --exclude node_modules \
  ./ agent11784@azyl.ag3nts.org:~/tasks/s03e04/
```

## Troubleshooting

| Objaw | Fix |
| --- | --- |
| `520` na `azyl-5022` | użyj **`azyl-51784`** |
| `404` na `azyl-51784` | serwer nie działa na `:51784` |
| `EADDRINUSE :8787` | `unset PORT`, `pkill -f server.ts` |
| stary URL w logu | rsync + `unset PUBLIC_BASE_URL` |

## Zmienne

| Zmienna | Domyślnie |
| --- | --- |
| `PORT` | `51784` |
| `PUBLIC_BASE_URL` | `https://azyl-51784.ag3nts.org` |

Spec: [`docs/specs/negotiations/negotiations.plan.md`](docs/specs/negotiations/negotiations.plan.md)
