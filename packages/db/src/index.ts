import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

export * from "./schema";
export { schema };

function connect(url: string) {
  const pool = mysql.createPool({ uri: url, connectionLimit: 10 });
  return drizzle(pool, { schema, mode: "default", casing: "snake_case" });
}

export type Db = ReturnType<typeof connect>;

let _db: Db | null = null;

export function getDb(): Db {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not set");
    _db = connect(url);
  }
  return _db;
}
