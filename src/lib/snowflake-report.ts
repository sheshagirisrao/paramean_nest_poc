import snowflake from "snowflake-sdk";

snowflake.configure({ logLevel: "ERROR" });

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

function createConn(): Promise<snowflake.Connection> {
  const conn = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USERNAME!,
    password: process.env.SNOWFLAKE_PASSWORD!,
    database: "NEST_AHC_NC",
    schema: "PUBLIC",
    warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
  });
  return new Promise((resolve, reject) => {
    conn.connect((err) => (err ? reject(err) : resolve(conn)));
  });
}

export async function reportQuery<T = Record<string, unknown>>(
  sqlText: string,
  binds: snowflake.Binds = []
): Promise<T[]> {
  const conn = await createConn();
  try {
    const rows = await execStatement(conn, sqlText, binds);
    return rows as T[];
  } finally {
    conn.destroy(() => {});
  }
}

export async function reportMultiQuery(
  queries: { key: string; sql: string; binds?: snowflake.Binds }[]
): Promise<Record<string, Record<string, unknown>[]>> {
  const conn = await createConn();
  try {
    const result: Record<string, Record<string, unknown>[]> = {};
    for (const q of queries) {
      result[q.key] = await execStatement(conn, q.sql, q.binds ?? []);
    }
    return result;
  } finally {
    conn.destroy(() => {});
  }
}
