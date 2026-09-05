# Local setup — ortak-randevu

The project lives on GitHub at **https://github.com/mtogi/ortak-randevu** and contains
the docs tree, Cursor rules, **and** the Next.js scaffold (M1).

## Put the project on a machine

```bash
git clone https://github.com/mtogi/ortak-randevu.git
cd ortak-randevu
npm install
npm run dev
```

`/` serves the EN/TR home page and `/api/v1/health` returns
`{"status":"ok","apiVersion":"v1"}`. There is no database yet — that is M1.5.

### Before your first commit on a new machine

Git will invent an author identity if none is set, and a wrong `user.email`
silently credits your commits to a stranger on GitHub. Set it explicitly:

```bash
git config --global user.name "Toygar"
git config --global user.email "76550003+mtogi@users.noreply.github.com"
```

### Node

Node 22.23.2 lives at `~/.local/node` and is **not** on `PATH` in new shells. Add:

```bash
export PATH="$HOME/.local/node/bin:$PATH"
```

### Pushing

The GitHub CLI (`~/.local/bin/gh`) is installed and authenticated on the primary
machine, which makes it the git credential helper. On a fresh machine, run
`gh auth login` (choose HTTPS and answer **yes** to authenticating Git) so
pushes don't prompt for a password — GitHub no longer accepts account passwords
for git operations.

## Working in Cursor

1. Open `ortak-randevu` as the Cursor workspace root (so `.cursor/rules` apply).
2. **New chat per phase** — don't reuse a long thread.
3. Read `docs/process/SESSION-HANDOFF.md` (top entry), then paste the current
   phase prompt from `docs/WAR-PLAN.md` §6.

## Note

A background/cloud agent **cannot** write to arbitrary paths on your laptop
(`~/Desktop/...`). Only Cursor Desktop Agent mode with that folder open can.
