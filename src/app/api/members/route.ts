import { query } from "@/lib/snowflake";
import { initDatabase } from "@/lib/init-db";
import { NextResponse } from "next/server";

interface MemberRow {
  ID: number;
  MEMBER_NAME: string;
  FAMILY_NAME: string;
  PMPM: number;
  CREATED_AT: string;
}

export async function GET() {
  await initDatabase();
  const rows = await query<MemberRow>("SELECT * FROM MEMBERS ORDER BY ID ASC");
  const members = rows.map((r) => ({
    id: r.ID,
    memberName: r.MEMBER_NAME,
    familyName: r.FAMILY_NAME,
    pmpm: r.PMPM,
  }));
  return NextResponse.json(members);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { memberName, familyName, pmpm } = body;

  if (!memberName || !familyName || pmpm === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await initDatabase();

  const existing = await query<{ CNT: number }>(
    "SELECT COUNT(*) AS CNT FROM MEMBERS WHERE MEMBER_NAME = ? AND FAMILY_NAME = ? AND PMPM = ?",
    [memberName, familyName, Number(pmpm)]
  );
  if (existing[0]?.CNT > 0) {
    return NextResponse.json(
      { error: "Duplicate record: a member with the same name, family, and PMPM already exists" },
      { status: 409 }
    );
  }

  await query(
    "INSERT INTO MEMBERS (MEMBER_NAME, FAMILY_NAME, PMPM) VALUES (?, ?, ?)",
    [memberName, familyName, Number(pmpm)]
  );

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await query("DELETE FROM MEMBERS WHERE ID = ?", [Number(id)]);
  return NextResponse.json({ success: true });
}
