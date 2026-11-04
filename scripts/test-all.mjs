import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
let failed = false;
for (const file of readdirSync('.').filter(name => /^test.*\.cjs$/.test(name)).sort()) {
  const result = spawnSync(process.execPath, [file], { stdio: 'inherit' });
  if (result.error || result.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
