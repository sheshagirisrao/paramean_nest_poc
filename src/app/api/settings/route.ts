import { query } from "@/lib/snowflake";
import { initDatabase } from "@/lib/init-db";
import { NextResponse } from "next/server";

interface SettingsRow {
  ID: number;
  PMPM_LOWER: number;
  PMPM_UPPER: number;
}

export async function GET() {
  await initDatabase();
  const rows = await query<SettingsRow>("SELECT * FROM SETTINGS WHERE ID = 1");
  const s = rows[0];
  return NextResponse.json({
    pmpmLower: s.PMPM_LOWER,
    pmpmUpper: s.PMPM_UPPER,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { pmpmLower, pmpmUpper } = body;

  await initDatabase();
  await query(
    "UPDATE SETTINGS SET PMPM_LOWER = ?, PMPM_UPPER = ? WHERE ID = 1",
    [Number(pmpmLower), Number(pmpmUpper)]
  );

  return NextResponse.json({ pmpmLower: Number(pmpmLower), pmpmUpper: Number(pmpmUpper) });
}
