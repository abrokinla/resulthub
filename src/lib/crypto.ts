const SALT_LENGTH = 16;

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return bufferToHex(salt.buffer);
}

async function sha256(data: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data)
  );
  return bufferToHex(hash);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const hash = await sha256(salt + password);
  return `${salt}:${hash}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [salt, storedHash] = parts;
  if (!salt || !storedHash) return false;
  const hash = await sha256(salt + password);
  return hash === storedHash;
}
