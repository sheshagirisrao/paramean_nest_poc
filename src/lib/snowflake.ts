import snowflake from "snowflake-sdk";

snowflake.configure({ logLevel: "ERROR" });

let dbInitialized = false;

function getConnection(): snowflake.Connection {
  return snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USERNAME!,
    password: process.env.SNOWFLAKE_PASSWORD!,
    database: process.env.SNOWFLAKE_DATABASE!,
    schema: process.env.SNOWFLAKE_SCHEMA!,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
  });
}

function execStatement(
  conn: snowflake.Connection,
  sqlText: string,
  binds: snowflake.Binds = []
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText,
      binds,
      complete: (err, _stmt, rows) => {
        if (err) reject(err);
        else resolve((rows ?? []) as Record<string, unknown>[]);
      },
    });
  });
}

async function ensureTablesExist(conn: snowflake.Connection) {
  if (dbInitialized) return;

  await execStatement(conn, `
    CREATE TABLE IF NOT EXISTS MEMBERS (
      ID INTEGER AUTOINCREMENT PRIMARY KEY,
      MEMBER_NAME VARCHAR(255) NOT NULL,
      FAMILY_NAME VARCHAR(255) NOT NULL,
      PMPM FLOAT NOT NULL,
      CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )
  `);

  await execStatement(conn, `
    CREATE TABLE IF NOT EXISTS SETTINGS (
      ID INTEGER PRIMARY KEY DEFAULT 1,
      PMPM_LOWER FLOAT DEFAULT 600,
      PMPM_UPPER FLOAT DEFAULT 1000
    )
  `);

  const existing = await execStatement(conn, "SELECT COUNT(*) AS CNT FROM SETTINGS");
  const cnt = (existing[0] as { CNT: number })?.CNT ?? 0;
  if (cnt === 0) {
    await execStatement(conn, "INSERT INTO SETTINGS (ID, PMPM_LOWER, PMPM_UPPER) VALUES (1, 600, 1000)");
  }

  dbInitialized = true;
}

export async function queryBatch<T = Record<string, unknown>>(
  statements: { sql: string; binds?: snowflake.Binds }[]
): Promise<T[][]> {
  const conn = getConnection();

  return new Promise((resolve, reject) => {
    conn.connect(async (err) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        await ensureTablesExist(conn);
        const results: T[][] = [];
        for (const stmt of statements) {
          const rows = await execStatement(conn, stmt.sql, stmt.binds ?? []);
          results.push(rows as T[]);
        }
        conn.destroy(() => {});
        resolve(results);
      } catch (e) {
        conn.destroy(() => {});
        reject(e);
      }
    });
  });
}

export async function query<T = Record<string, unknown>>(
  sqlText: string,
  binds: snowflake.Binds = []
): Promise<T[]> {
  const results = await queryBatch<T>([{ sql: sqlText, binds }]);
  return results[0];
}
