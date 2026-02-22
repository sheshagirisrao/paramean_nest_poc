import { query } from "./snowflake";

interface MemberRow {
  ID: number;
  FAMILY_NAME: string;
  PMPM: number;
}

interface SettingsRow {
  PMPM_LOWER: number;
  PMPM_UPPER: number;
}

export async function recalculateAll() {
  const [members, settings] = await Promise.all([
    query<MemberRow>("SELECT ID, FAMILY_NAME, PMPM FROM MEMBERS"),
    query<SettingsRow>("SELECT PMPM_LOWER, PMPM_UPPER FROM SETTINGS WHERE ID = 1"),
  ]);

  const s = settings[0];
  if (!s) return;

  const familyHasAnchor: Record<string, boolean> = {};

  for (const m of members) {
    const isEligible = m.PMPM >= s.PMPM_LOWER && m.PMPM <= s.PMPM_UPPER;
    if (isEligible) {
      familyHasAnchor[m.FAMILY_NAME] = true;
    }
  }

  for (const m of members) {
    const pmpmEligible = m.PMPM >= s.PMPM_LOWER && m.PMPM <= s.PMPM_UPPER ? 1 : 0;
    const anchor = pmpmEligible;
    const familyEligible = familyHasAnchor[m.FAMILY_NAME] ? 1 : 0;
    const eligible = familyEligible;

    await query(
      "UPDATE MEMBERS SET PMPM_ELIGIBLE = ?, ANCHOR = ?, FAMILY_ELIGIBLE = ?, ELIGIBLE = ? WHERE ID = ?",
      [pmpmEligible, anchor, familyEligible, eligible, m.ID]
    );
  }
}
