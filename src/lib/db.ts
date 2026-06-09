import { Pool, PoolClient } from "pg";

const globalForDb = globalThis as unknown as { pool: Pool };

function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 0,
  });
}

export const pool = globalForDb.pool ?? createPool();

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await pool.query(text, params);
  return (result.rows[0] ?? null) as T | null;
}

export async function queryClient<T = Record<string, unknown>>(
  client: PoolClient,
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await client.query(text, params);
  return result.rows as T[];
}

export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
