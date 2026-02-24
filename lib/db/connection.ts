import mysql, { Pool, PoolConnection, QueryResult } from "mysql2/promise";

import { env } from "@/lib/utils/env";

declare global {
  var _mysqlPool: Pool | undefined;
}

function createPool(): Pool {
  if (globalThis._mysqlPool) return globalThis._mysqlPool;

  const pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASS,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    charset: "utf8mb4",
    timezone: "+00:00",
    typeCast(field, next) {
      if (field.type === "JSON") {
        const val = field.string();

        if (val === null) return null;
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }

      return next();
    },
  });

  globalThis._mysqlPool = pool;

  return pool;
}

export const pool = createPool();

export async function withTransaction<T>(
  fn: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await pool.getConnection();

  await connection.beginTransaction();

  try {
    const result = await fn(connection);

    await connection.commit();

    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function query<T extends QueryResult>(
  sql: string,

  params?: any[],
): Promise<T> {
  const [rows] = await pool.execute<T>(sql, params ?? []);

  return rows;
}
