import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';

// This operator-only command never prints verification codes. Open an individual
// private message in the OS document viewer when testing local signup.
const directory = resolve(process.env.MUSEION_AUTH_OUTBOX_PATH ?? './data/auth-outbox');
const args = process.argv.slice(2);
if (args.length && (args[0] !== '--open' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(args[1] ?? '') || args.length !== 2)) {
  console.error('Usage: npm run auth:outbox [-- --open <challenge-id>]');
  process.exitCode = 1;
} else if (args.length) {
  const path = join(directory, `${args[1]}.json`);
  try {
    await stat(path);
    const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer.exe' : 'xdg-open';
    execFile(command, [path], (error) => {
      if (error) { console.error('Could not open the private message. Open the file locally:', path); process.exitCode = 1; }
    });
  } catch { console.error('That verification message is not available in the local outbox.'); process.exitCode = 1; }
} else {
  try {
    const files = (await readdir(directory)).filter((file) => /^[a-f0-9-]{36}\.json$/.test(file));
    if (!files.length) console.log('No local verification messages yet.');
    for (const file of files) {
      const message = JSON.parse(await readFile(join(directory, file), 'utf8'));
      if (message.kind !== 'museion-signup-verification') continue;
      console.log(`${file.slice(0, -5)}  ${message.expiresAt > Date.now() ? 'unexpired' : 'expired'}  expires ${new Date(message.expiresAt).toISOString()}`);
    }
    console.log(`Private outbox: ${directory}`);
    console.log('Open a message: npm run auth:outbox -- --open <challenge-id>');
  } catch (error) {
    if (error.code === 'ENOENT') console.log('No local verification messages yet. Submit signup first.');
    else { console.error('Could not read the private outbox. Check its local path and permissions.'); process.exitCode = 1; }
  }
}
