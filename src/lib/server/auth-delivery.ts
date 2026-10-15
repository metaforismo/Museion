import { chmod, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export interface VerificationMessage { challengeId: string; recipient: string; code: string; expiresAt: number }
export interface AuthDeliveryTransport {
  readonly mode: "local-outbox" | "email";
  sendVerification(message: VerificationMessage): Promise<void>;
}

/** Private local delivery only. A future SMTP/provider adapter implements this
 * boundary; account logic never assumes that a message was emailed. */
export const localOutboxTransport: AuthDeliveryTransport = {
  mode: "local-outbox",
  async sendVerification(message) {
    const directory = resolve(process.env.MUSEION_AUTH_OUTBOX_PATH ?? "./data/auth-outbox");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await chmod(directory, 0o700);
    // Expired verification messages should not accumulate on the operator disk.
    for (const entry of await readdir(directory)) {
      if (!/^[a-f0-9-]{36}\.json$/.test(entry)) continue;
      const path = join(directory, entry);
      if (Date.now() - (await stat(path)).mtimeMs > 24 * 60 * 60 * 1000) await rm(path, { force: true });
    }
    await writeFile(join(directory, `${message.challengeId}.json`), JSON.stringify({ kind: "museion-signup-verification", ...message }), { mode: 0o600 });
  },
};
