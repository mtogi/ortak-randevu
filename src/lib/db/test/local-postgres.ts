// Test-only helper. Spins up a real, throwaway PostgreSQL server (via the
// `embedded-postgres` package — no Docker/Homebrew required) so integration
// tests can prove DB-level constraints such as the double-booking guard in
// ADR-003. Never import this from application code.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

// `embedded-postgres` ships CJS with no bundled types; Node's ESM/CJS
// interop resolves the default import fine at runtime.
import EmbeddedPostgres from "embedded-postgres";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const prismaBin = resolve(repoRoot, "node_modules", ".bin", "prisma");

async function findFreePort(): Promise<number> {
  return await new Promise((resolvePort, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const { port } = address;
        server.close(() => resolvePort(port));
      } else {
        server.close(() => reject(new Error("Could not allocate a free port")));
      }
    });
  });
}

export interface LocalTestPostgres {
  databaseUrl: string;
  stop: () => Promise<void>;
}

/**
 * Starts a fresh, empty Postgres instance in a temp dir, creates a database,
 * and applies every migration in `prisma/migrations` via `prisma migrate
 * deploy`. Callers must call `stop()` in an `afterAll`/`afterEach`.
 */
export async function startLocalTestPostgres(): Promise<LocalTestPostgres> {
  const dataDir = mkdtempSync(join(tmpdir(), "ortak-randevu-test-pg-"));
  const port = await findFreePort();
  const databaseName = "ortak_randevu_test";
  const databaseUrl = `postgresql://postgres:postgres@127.0.0.1:${port}/${databaseName}?schema=public`;

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: "postgres",
    password: "postgres",
    port,
    persistent: false,
  });

  await pg.initialise();
  await pg.start();
  await pg.createDatabase(databaseName);

  execFileSync(prismaBin, ["migrate", "deploy"], {
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });

  return {
    databaseUrl,
    stop: async () => {
      await pg.stop();
      rmSync(dataDir, { recursive: true, force: true });
    },
  };
}
