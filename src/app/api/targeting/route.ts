import { reportMultiQuery } from "@/lib/snowflake-report";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const TABLE = "FINAL_OUTPUT_TEST_20250511";

interface CriteriaInput {
  pmpmMinAdult: number;
  pmpmMaxAdult: number;
  pmpmMinChild: number;
  pmpmMaxChild: number;
  excludeNoPcp: boolean;
  excludeExclusions: boolean;
  excludeIpt: boolean;
  excludeEd: boolean;
  excludeLowMm: boolean;
  minMmAdult: number;
  minMmChild: number;
}

export async function POST(request: NextRequest) {
  try {
    const input: CriteriaInput = await request.json();

    // Build cumulative WHERE conditions for each step
    const steps: { name: string; condition: string }[] = [];

    if (input.excludeNoPcp) {
      steps.push({ name: "PCP Visits (No PCP)", condition: "PCPV = 1" });
    }
    if (input.excludeExclusions) {
      steps.push({ name: "Exclusions (Cancer/Transplant)", condition: "EXCL = 0" });
    }
    if (input.excludeIpt) {
      steps.push({ name: "Inpatient (IPT)", condition: "IPT = 0" });
    }
    if (input.excludeEd) {
      steps.push({ name: "ED Visits", condition: "ED = 0" });
    }
    if (input.excludeLowMm) {
      steps.push({
        name: "Minimum Member Months",
        condition: `((ADULT_CHILD = 'Adult' AND MM >= ${Number(input.minMmAdult)}) OR (ADULT_CHILD = 'Child' AND MM >= ${Number(input.minMmChild)}))`,
      });
    }
    // PMPM threshold is always applied last
    steps.push({
      name: "PMPM Threshold",
      condition: `((ADULT_CHILD = 'Adult' AND PMPM >= ${Number(input.pmpmMinAdult)} AND PMPM <= ${Number(input.pmpmMaxAdult)}) OR (ADULT_CHILD = 'Child' AND PMPM >= ${Number(input.pmpmMinChild)} AND PMPM <= ${Number(input.pmpmMaxChild)}))`,
    });

    // Build queries: one for start, then one per cumulative step
    const queries: { key: string; sql: string }[] = [];

    // Step 0: Starting counts
    queries.push({
      key: "step_0",
      sql: `SELECT ADULT_CHILD, COUNT(*) AS CNT, SUM(MM) AS TOTAL_MM, SUM(TOT_PD) AS TOTAL_PD, AVG(PMPM) AS AVG_PMPM FROM ${TABLE} GROUP BY ADULT_CHILD`,
    });

    // Each subsequent step adds one more condition
    let cumulative = "";
    for (let i = 0; i < steps.length; i++) {
      cumulative = cumulative
        ? `${cumulative} AND ${steps[i].condition}`
        : steps[i].condition;
      queries.push({
        key: `step_${i + 1}`,
        sql: `SELECT ADULT_CHILD, COUNT(*) AS CNT, SUM(MM) AS TOTAL_MM, SUM(TOT_PD) AS TOTAL_PD, AVG(PMPM) AS AVG_PMPM FROM ${TABLE} WHERE ${cumulative} GROUP BY ADULT_CHILD`,
      });
    }

    const result = await reportMultiQuery(queries);

    // Parse results into funnel steps
    interface StepRow {
      ADULT_CHILD: string;
      CNT: number;
      TOTAL_MM: number;
      TOTAL_PD: number;
      AVG_PMPM: number;
    }

    interface FunnelStep {
      name: string; adults: number; children: number; total: number;
      adultMM: number; childMM: number; adultPaid: number; childPaid: number;
      adultPmpm: number; childPmpm: number; excluded: number;
      excludedPct: number; cumulExclPct: number;
    }
    const funnel: FunnelStep[] = [];

    // Step 0: Start
    const startRows = result.step_0 as unknown as StepRow[];
    const adultStart = startRows.find((r) => r.ADULT_CHILD === "Adult");
    const childStart = startRows.find((r) => r.ADULT_CHILD === "Child");
    funnel.push({
      name: "Starting Population",
      adults: adultStart?.CNT ?? 0,
      children: childStart?.CNT ?? 0,
      total: (adultStart?.CNT ?? 0) + (childStart?.CNT ?? 0),
      adultMM: adultStart?.TOTAL_MM ?? 0,
      childMM: childStart?.TOTAL_MM ?? 0,
      adultPaid: adultStart?.TOTAL_PD ?? 0,
      childPaid: childStart?.TOTAL_PD ?? 0,
      adultPmpm: adultStart?.AVG_PMPM ?? 0,
      childPmpm: childStart?.AVG_PMPM ?? 0,
      excluded: 0,
      excludedPct: 0,
      cumulExclPct: 0,
    });

    const totalStart = (adultStart?.CNT ?? 0) + (childStart?.CNT ?? 0);

    for (let i = 0; i < steps.length; i++) {
      const rows = result[`step_${i + 1}`] as unknown as StepRow[];
      const adult = rows.find((r) => r.ADULT_CHILD === "Adult");
      const child = rows.find((r) => r.ADULT_CHILD === "Child");
      const remaining = (adult?.CNT ?? 0) + (child?.CNT ?? 0);
      const prevTotal = funnel[i].total;
      const excluded = prevTotal - remaining;

      funnel.push({
        name: steps[i].name,
        adults: adult?.CNT ?? 0,
        children: child?.CNT ?? 0,
        total: remaining,
        adultMM: adult?.TOTAL_MM ?? 0,
        childMM: child?.TOTAL_MM ?? 0,
        adultPaid: adult?.TOTAL_PD ?? 0,
        childPaid: child?.TOTAL_PD ?? 0,
        adultPmpm: adult?.AVG_PMPM ?? 0,
        childPmpm: child?.AVG_PMPM ?? 0,
        excluded,
        excludedPct: totalStart > 0 ? excluded / totalStart : 0,
        cumulExclPct: totalStart > 0 ? (totalStart - remaining) / totalStart : 0,
      });
    }

    return NextResponse.json({ funnel });
  } catch (err) {
    console.error("Targeting API error:", err);
    return NextResponse.json({ error: "Failed to run targeting analysis" }, { status: 500 });
  }
}
