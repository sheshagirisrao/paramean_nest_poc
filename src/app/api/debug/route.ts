import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    account: process.env.SNOWFLAKE_ACCOUNT ?? "NOT SET",
    username: process.env.SNOWFLAKE_USERNAME ?? "NOT SET",
    password_length: process.env.SNOWFLAKE_PASSWORD?.length ?? 0,
    password_first3: process.env.SNOWFLAKE_PASSWORD?.slice(0, 3) ?? "NOT SET",
    password_last3: process.env.SNOWFLAKE_PASSWORD?.slice(-3) ?? "NOT SET",
    database: process.env.SNOWFLAKE_DATABASE ?? "NOT SET",
    schema: process.env.SNOWFLAKE_SCHEMA ?? "NOT SET",
    warehouse: process.env.SNOWFLAKE_WAREHOUSE ?? "NOT SET",
  });
}
