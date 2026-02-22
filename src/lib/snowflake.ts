import snowflake from "snowflake-sdk";

snowflake.configure({ logLevel: "ERROR" });

let dbInitialized = false;

function getConnection(): Promise<snowflake.Connection> {
  return new Promise((resolve, reject) => {
    const conn = snowflake.createConnection({
      account: process.env.SNOWFLAKE_ACCOUNT!,
      username: process.env.SNOWFLAKE_USERNAME!,
      password: process.env.SNOWFLAKE_PASSWORD!,
      database: process.env.SNOWFLAKE_DATABASE!,
      schema: process.env.SNOWFLAKE_SCHEMA!,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
    });

    conn.connect((err, c) => {
      if (err) reject(err);
      else resolve(c);
    });
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
      PMPM_ELIGIBLE INTEGER DEFAULT 0,
      ANCHOR INTEGER DEFAULT 0,
      FAMILY_ELIGIBLE INTEGER DEFAULT 0,
      ELIGIBLE INTEGER DEFAULT 0,
      CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )
  `);

  // Add columns if they don't exist (for existing tables)
  for (const col of ["PMPM_ELIGIBLE", "ANCHOR", "FAMILY_ELIGIBLE", "ELIGIBLE"]) {
    try {
      await execStatement(conn, `ALTER TABLE MEMBERS ADD COLUMN ${col} INTEGER DEFAULT 0`);
    } catch {
      // Column already exists
    }
  }

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

export async function query<T = Record<string, unknown>>(
  sqlText: string,
  binds: snowflake.Binds = []
): Promise<T[]> {
  const conn = await getConnection();
  try {
    await ensureTablesExist(conn);
    const rows = await execStatement(conn, sqlText, binds);
    return rows as T[];
  } finally {
    conn.destroy(() => {});
  }
}
