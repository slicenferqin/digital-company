import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getEnv } from "@/lib/config/env";

import * as schema from "./schema";

export type DbSchema = typeof schema;
export type Database = PostgresJsDatabase<DbSchema>;
export type SqlClient = ReturnType<typeof postgres>;

type DatabaseInstance = {
  db: Database;
  sql: SqlClient;
};

let cachedInstance: DatabaseInstance | null = null;

export function createDatabase(databaseUrl: string): DatabaseInstance {
  const sql = postgres(databaseUrl, {
    prepare: false
  });

  return {
    db: drizzle(sql, { schema }),
    sql
  };
}

export function getDatabase(): Database {
  if (!cachedInstance) {
    cachedInstance = createDatabase(getEnv().DATABASE_URL);
  }

  return cachedInstance.db;
}

export function getSqlClient(): SqlClient {
  if (!cachedInstance) {
    cachedInstance = createDatabase(getEnv().DATABASE_URL);
  }

  return cachedInstance.sql;
}

export async function closeDatabaseConnection() {
  if (!cachedInstance) {
    return;
  }

  await cachedInstance.sql.end();
  cachedInstance = null;
}
