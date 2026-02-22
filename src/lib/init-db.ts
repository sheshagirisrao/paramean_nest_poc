import { query } from "./snowflake";

export async function initDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS MEMBERS (
      ID INTEGER AUTOINCREMENT PRIMARY KEY,
      MEMBER_NAME VARCHAR(255) NOT NULL,
      FAMILY_NAME VARCHAR(255) NOT NULL,
      PMPM FLOAT NOT NULL,
      CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS SETTINGS (
      ID INTEGER PRIMARY KEY DEFAULT 1,
      PMPM_LOWER FLOAT DEFAULT 600,
      PMPM_UPPER FLOAT DEFAULT 1000
    )
  `);

  const existing = await query<{ CNT: number }>(
    "SELECT COUNT(*) AS CNT FROM SETTINGS"
  );
  if (existing[0]?.CNT === 0) {
    await query("INSERT INTO SETTINGS (ID, PMPM_LOWER, PMPM_UPPER) VALUES (1, 600, 1000)");
  }
}
