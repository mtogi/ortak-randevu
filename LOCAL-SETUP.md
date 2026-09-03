# Local setup — ortak-randevu

This package is **docs + Cursor rules only** (no app scaffold yet).

## Put the project on your machine

### Option A — Extract the archive (if you downloaded `ortak-randevu-docs.tar.gz`)

```bash
# Pick YOUR parent folder, e.g. ~/Projects or ~/Desktop
cd ~/Projects   # change this

tar -xzf /path/to/ortak-randevu-docs.tar.gz
cd ortak-randevu
git init
git add .
git commit -m "docs: planning bootstrap and Cursor rules"
```

### Option B — Create empty folder, then open in Cursor

```bash
mkdir -p ~/Projects/ortak-randevu
cd ~/Projects/ortak-randevu
```

Open that folder in **Cursor Desktop** (File → Open Folder).  
In a **new Agent chat**, paste:

```text
Recreate the planning docs and .cursor/rules from docs/WAR-PLAN.md expectations for ortak-randevu.
If files are missing, recreate: AGENTS.md, README, docs/**, .cursor/rules/** per our planning session.
Do not scaffold the app yet.
```

Or drag/copy the `ortak-randevu/` folder contents into place.

### Option C — Cursor cloud → download

From the cloud agent artifacts / file browser, download `ortak-randevu-docs.tar.gz` or the `ortak-randevu/` folder, then Option A.

## After files are local

1. Open `ortak-randevu` as the Cursor workspace root (so `.cursor/rules` apply).
2. **New chat** (don’t reuse the long planning thread).
3. Paste the scaffold prompt from `docs/WAR-PLAN.md` §6.

## Note

A background/cloud agent **cannot** write to arbitrary paths on your laptop (`~/Desktop/...`). Only Cursor Desktop Agent mode with that folder open can.
