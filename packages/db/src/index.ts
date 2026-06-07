import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

export * from "./schema";
export { schema };

function makePool() {
  // Shared hosting (Hostinger) grants the DB user @localhost via UNIX socket only;
  // TCP to localhost resolves to ::1 and is denied. Prefer socket when DB_SOCKET set.
  const socket = process.env.DB_SOCKET;
  if (socket) {
    return mysql.createPool({
      socketPath: socket,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      connectionLimit: 10,
    });
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL or DB_SOCKET not set");
  return mysql.createPool({ uri: url, connectionLimit: 10 });
}

function connect() {
  return drizzle(makePool(), { schema, mode: "default", casing: "snake_case" });
}

export type Db = ReturnType<typeof connect>;

let _db: Db | null = null;

export function getDb(): Db {
  if (!_db) _db = connect();
  return _db;
}
