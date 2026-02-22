import { reportQuery } from "@/lib/snowflake-report";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const TABLE = "FINAL_OUTPUT_TEST_20250511";

function buildWhereClause(params: URLSearchParams): { where: string; binds: string[] } {
  const conditions: string[] = [];
  const binds: string[] = [];

  const gender = params.get("gender");
  if (gender) { conditions.push("MEMBER_GENDER = ?"); binds.push(gender); }

  const ageGrp = params.get("ageGrp");
  if (ageGrp) { conditions.push("AGE_GRP = ?"); binds.push(ageGrp); }

  const product = params.get("product");
  if (product) { conditions.push("MEMBER_PRODUCT_GL = ?"); binds.push(product); }

  const pmpmGrp = params.get("pmpmGrp");
  if (pmpmGrp) { conditions.push("PMPM_GRP = ?"); binds.push(pmpmGrp); }

  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  return { where, binds };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("mode") || "summary";
  const { where, binds } = buildWhereClause(params);

  if (mode === "summary") {
    const sql = `
      SELECT
        COUNT(*) AS TOTAL_MEMBERS,
        SUM(MM) AS TOTAL_MM,
        SUM(TOT_PD) AS TOTAL_PAID,
        AVG(PMPM) AS AVG_PMPM,
        SUM(CASE WHEN PCPV = 1 THEN 1 ELSE 0 END) AS PCP_VISITS,
        SUM(CASE WHEN BH > 0 THEN 1 ELSE 0 END) AS BH_MEMBERS,
        SUM(CASE WHEN ED > 0 THEN 1 ELSE 0 END) AS ED_MEMBERS,
        SUM(CASE WHEN IPT = 1 THEN 1 ELSE 0 END) AS IPT_MEMBERS,
        SUM(CASE WHEN PREG > 0 THEN 1 ELSE 0 END) AS PREG_MEMBERS,
        SUM(CASE WHEN EXCL = 1 THEN 1 ELSE 0 END) AS EXCLUSIONS
      FROM ${TABLE} ${where}
    `;
    const rows = await reportQuery(sql, binds);

    const byGender = await reportQuery(
      `SELECT MEMBER_GENDER AS LABEL, COUNT(*) AS CNT, AVG(PMPM) AS AVG_PMPM FROM ${TABLE} ${where} GROUP BY MEMBER_GENDER ORDER BY MEMBER_GENDER`,
      binds
    );
    const byAge = await reportQuery(
      `SELECT AGE_GRP AS LABEL, COUNT(*) AS CNT, AVG(PMPM) AS AVG_PMPM FROM ${TABLE} ${where} GROUP BY AGE_GRP ORDER BY AGE_GRP`,
      binds
    );
    const byProduct = await reportQuery(
      `SELECT MEMBER_PRODUCT_GL AS LABEL, COUNT(*) AS CNT, AVG(PMPM) AS AVG_PMPM FROM ${TABLE} ${where} GROUP BY MEMBER_PRODUCT_GL ORDER BY MEMBER_PRODUCT_GL`,
      binds
    );
    const byPmpmGrp = await reportQuery(
      `SELECT PMPM_GRP AS LABEL, COUNT(*) AS CNT, AVG(PMPM) AS AVG_PMPM FROM ${TABLE} ${where} GROUP BY PMPM_GRP ORDER BY AVG_PMPM`,
      binds
    );

    return NextResponse.json({
      summary: rows[0],
      byGender,
      byAge,
      byProduct,
      byPmpmGrp,
    });
  }

  if (mode === "data") {
    const page = Math.max(1, Number(params.get("page") || 1));
    const limit = Math.min(100, Math.max(10, Number(params.get("limit") || 50)));
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) AS CNT FROM ${TABLE} ${where}`;
    const countRows = await reportQuery<{ CNT: number }>(countSql, binds);
    const total = countRows[0]?.CNT ?? 0;

    const dataSql = `
      SELECT MEMBER_ID, MEMBER_GENDER, MEMBER_PRODUCT_GL, AGE_GRP, ADULT_CHILD,
             MM, TOT_PD, PMPM, PMPM_GRP, PCPV, EXCL, CC, BH, PREG, IPT, ED, ED_IPT,
             HSHLD, ADULTS, ANCHO1_250_5000, ANCHO2_250_5000
      FROM ${TABLE} ${where}
      ORDER BY PMPM DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const rows = await reportQuery(dataSql, binds);

    return NextResponse.json({ rows, total, page, limit });
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}
