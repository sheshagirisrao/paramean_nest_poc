import snowflake from "snowflake-sdk";

snowflake.configure({ logLevel: "ERROR" });

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

export async function query<T = Record<string, unknown>>(
  sqlText: string,
  binds: snowflake.Binds = []
): Promise<T[]> {
  const conn = getConnection();

  return new Promise((resolve, reject) => {
    conn.connect(async (err) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        const db = process.env.SNOWFLAKE_DATABASE!;
        const schema = process.env.SNOWFLAKE_SCHEMA!;
        const wh = process.env.SNOWFLAKE_WAREHOUSE!;
        await execStatement(conn, `USE WAREHOUSE "${wh}"`);
        await execStatement(conn, `USE DATABASE "${db}"`);
        await execStatement(conn, `USE SCHEMA "${schema}"`);
        const rows = await execStatement(conn, sqlText, binds);
        conn.destroy(() => {});
        resolve(rows as T[]);
      } catch (e) {
        conn.destroy(() => {});
        reject(e);
      }
    });
  });
}
