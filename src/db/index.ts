import { Pool } from "pg";
import type { PoolConfig } from "pg";
import dns from "dns/promises";
import config from "../config";

let realPool: Pool | null = null;

async function createPool(): Promise<Pool> {
  if (realPool) return realPool;

  const cs = String(config.connectionString || "");
  // Base config: use connectionTimeout from env or default
  const baseCfg: PoolConfig = {
    connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT) || 5000,
  };

  // Detect SSL need and SNI servername
  let sslOpt: any = undefined;
  if (process.env.DB_SSL === "true" || /sslmode=require/i.test(cs)) {
    try {
      const url = new URL(cs);
      sslOpt = { rejectUnauthorized: false, servername: url.hostname };
    } catch (e) {
      sslOpt = { rejectUnauthorized: false };
    }
  }

  try {
    const url = new URL(cs);
    const host = url.hostname;
    const port = Number(url.port) || 5432;
    const user = url.username || undefined;
    const password = url.password || undefined;
    const database = url.pathname ? url.pathname.replace(/^\//, "") : undefined;

    // Prefer IPv4 lookup and use the IP to avoid IPv6/ENETUNREACH issues
    let hostaddr: string | undefined;
    try {
      const lookup = await dns.lookup(host, { family: 4 });
      hostaddr = lookup.address;
    } catch (e) {
      hostaddr = undefined;
    }

    const cfg: PoolConfig = {
      ...baseCfg,
      host: hostaddr || host,
      port,
      user,
      password,
      database,
    } as PoolConfig;

    if (sslOpt) (cfg as any).ssl = sslOpt;

    realPool = new Pool(cfg as any);
    return realPool;
  } catch (e) {
    // Fallback to connectionString-based pool
    realPool = new Pool({
      ...baseCfg,
      connectionString: cs,
      ...(sslOpt ? { ssl: sslOpt } : {}),
    } as any);
    return realPool;
  }
}

async function getPool(): Promise<Pool> {
  return await createPool();
}

export const pool: any = {
  query: async (...args: any[]) => (await getPool()).query(...args),
  connect: async (...args: any[]) => (await getPool()).connect(...args),
  end: async (...args: any[]) => (await getPool()).end(...args),
};

export const initDB = async () => {
  try {
    const p = await getPool();
    await p.query(`
            CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role VARCHAR(20) DEFAULT 'contributor',

            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )
            `);

    await p.query(`
              CREATE TABLE IF NOT EXISTS issues(
              id SERIAL PRIMARY KEY,
              reporter_id INT REFERENCES users(id),

              type TEXT NOT NULL,
              description TEXT NOT NULL,
              title VARCHAR(150) NOT NULL,
              
              status TEXT DEFAULT 'open',
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
              )
              `);

    console.log("Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};
