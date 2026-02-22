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

export async function reportQuery<T = Record<string, unknown>>(
  sqlText: string,
  binds: snowflake.Binds = []
): Promise<T[]> {
  const conn = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USERNAME!,
    password: process.env.SNOWFLAKE_PASSWORD!,
    database: "NEST_AHC_NC",
    schema: "PUBLIC",
    warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
  });

  return new Promise((resolve, reject) => {
    conn.connect(async (err) => {
      if (err) { reject(err); return; }
      try {
        const rows = await execStatement(conn, sqlText, binds);
        resolve(rows as T[]);
      } catch (e) {
        reject(e);
      } finally {
        conn.destroy(() => {});
      }
    });
  });
}
