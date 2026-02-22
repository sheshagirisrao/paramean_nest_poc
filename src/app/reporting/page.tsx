"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Filters {
  gender: string;
  ageGrp: string;
  product: string;
  pmpmGrp: string;
}

interface Summary {
  TOTAL_MEMBERS: number;
  TOTAL_MM: number;
  TOTAL_PAID: number;
  AVG_PMPM: number;
  PCP_VISITS: number;
  BH_MEMBERS: number;
  ED_MEMBERS: number;
  IPT_MEMBERS: number;
  PREG_MEMBERS: number;
  EXCLUSIONS: number;
}

interface BreakdownRow {
  LABEL: string;
  CNT: number;
  AVG_PMPM: number;
}

interface DataRow {
  MEMBER_ID: number;
  MEMBER_GENDER: string;
  MEMBER_PRODUCT_GL: string;
  AGE_GRP: string;
  ADULT_CHILD: string;
  MM: number;
  TOT_PD: number;
  PMPM: number;
  PMPM_GRP: string;
  PCPV: number;
  EXCL: number;
  CC: number;
  BH: number;
  PREG: number;
  IPT: number;
  ED: number;
  ED_IPT: number;
  HSHLD: number;
  ADULTS: number;
  ANCHO1_250_5000: number;
  ANCHO2_250_5000: number;
}

const GENDERS = ["", "F", "M"];
const AGE_GRPS = ["", "Age 0-4", "Age 5-18", "Adult", "Aged"];
const PRODUCTS = ["", "Dual", "Non Dual"];
const PMPM_GRPS = ["", "Zero Dollars", "Less than $150 PMPM", "Between $150 - $250 PMPM", "Between $250 - $5000 PMPM", "Greater or equal to $5K"];

function buildQuery(filters: Filters): string {
  const p = new URLSearchParams();
  if (filters.gender) p.set("gender", filters.gender);
  if (filters.ageGrp) p.set("ageGrp", filters.ageGrp);
  if (filters.product) p.set("product", filters.product);
  if (filters.pmpmGrp) p.set("pmpmGrp", filters.pmpmGrp);
  return p.toString();
}

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCurrency(n: number, decimals = 0): string {
  return "$" + fmt(n, decimals);
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E0F0] p-5 shadow-sm">
      <p className="text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#1A2534]">{value}</p>
      {sub && <p className="text-xs text-[#7C89A6] mt-1">{sub}</p>}
    </div>
  );
}

function BreakdownTable({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  const total = rows.reduce((s, r) => s + r.CNT, 0);
  return (
    <div className="bg-white rounded-xl border border-[#E8E0F0] shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-[#5A3A76]/5 to-[#8D5EAD]/5 border-b border-[#E8E0F0]">
        <h3 className="text-sm font-semibold text-[#1A2534]">{title}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E8E0F0]">
            <th className="px-5 py-2 text-left text-xs font-medium text-[#7C89A6] uppercase">Category</th>
            <th className="px-5 py-2 text-right text-xs font-medium text-[#7C89A6] uppercase">Count</th>
            <th className="px-5 py-2 text-right text-xs font-medium text-[#7C89A6] uppercase">%</th>
            <th className="px-5 py-2 text-right text-xs font-medium text-[#7C89A6] uppercase">Avg PMPM</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0EBF5]">
          {rows.map((r) => (
            <tr key={r.LABEL} className="hover:bg-[#5A3A76]/[0.02]">
              <td className="px-5 py-2 font-medium text-[#1A2534]">{r.LABEL}</td>
              <td className="px-5 py-2 text-right text-[#4B5563] font-mono">{fmt(r.CNT)}</td>
              <td className="px-5 py-2 text-right text-[#4B5563]">{total > 0 ? fmt((r.CNT / total) * 100, 1) + "%" : "—"}</td>
              <td className="px-5 py-2 text-right text-[#4B5563] font-mono">{fmtCurrency(r.AVG_PMPM, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportingPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>({ gender: "", ageGrp: "", product: "", pmpmGrp: "" });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [byGender, setByGender] = useState<BreakdownRow[]>([]);
  const [byAge, setByAge] = useState<BreakdownRow[]>([]);
  const [byProduct, setByProduct] = useState<BreakdownRow[]>([]);
  const [byPmpmGrp, setByPmpmGrp] = useState<BreakdownRow[]>([]);
  const [dataRows, setDataRows] = useState<DataRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const limit = 50;

  const loadAll = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    setDataLoading(true);
    const q = buildQuery(f);
    const [summaryRes, dataRes] = await Promise.all([
      fetch(`/api/report?mode=summary&${q}`),
      fetch(`/api/report?mode=data&page=${p}&limit=${limit}&${q}`),
    ]);
    const summaryData = await summaryRes.json();
    setSummary(summaryData.summary);
    setByGender(summaryData.byGender);
    setByAge(summaryData.byAge);
    setByProduct(summaryData.byProduct);
    setByPmpmGrp(summaryData.byPmpmGrp);
    setLoading(false);
    const d = await dataRes.json();
    setDataRows(d.rows);
    setTotal(d.total);
    setPage(d.page);
    setDataLoading(false);
  }, []);

  const loadPage = useCallback(async (f: Filters, p: number) => {
    setDataLoading(true);
    const q = buildQuery(f);
    const res = await fetch(`/api/report?mode=data&page=${p}&limit=${limit}&${q}`);
    const d = await res.json();
    setDataRows(d.rows);
    setTotal(d.total);
    setPage(d.page);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    loadAll(filters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    loadAll(filters, 1);
  };

  const resetFilters = () => {
    const empty: Filters = { gender: "", ageGrp: "", product: "", pmpmGrp: "" };
    setFilters(empty);
    loadAll(empty, 1);
  };

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-[#F7F5FA]">
      <header className="bg-gradient-to-r from-[#1A2534] via-[#2A1F3D] to-[#5A3A76] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8D5EAD] to-[#B18AC7] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Paramean Nest</h1>
            <nav className="ml-8 flex items-center gap-1">
              <Link href="/" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-all">
                Nest Criteria
              </Link>
              <Link href="/reporting" className="px-3 py-1.5 text-sm text-white bg-white/15 rounded-lg">
                Reporting
              </Link>
            </nav>
          </div>
          <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white border border-white/20 rounded-lg hover:bg-white/10 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E0F0] overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-[#5A3A76]/5 to-[#8D5EAD]/5 border-b border-[#E8E0F0]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#5A3A76]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#5A3A76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-[#1A2534]">Filters</h2>
            </div>
          </div>
          <div className="px-6 py-4 flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">Gender</label>
              <select value={filters.gender} onChange={(e) => setFilters({ ...filters, gender: e.target.value })} className="border border-[#C2CCE3] rounded-lg px-3 py-2 text-sm text-[#1A2534] bg-white focus:outline-none focus:ring-2 focus:ring-[#8D5EAD]/30">
                {GENDERS.map((g) => <option key={g} value={g}>{g || "All"}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">Age Group</label>
              <select value={filters.ageGrp} onChange={(e) => setFilters({ ...filters, ageGrp: e.target.value })} className="border border-[#C2CCE3] rounded-lg px-3 py-2 text-sm text-[#1A2534] bg-white focus:outline-none focus:ring-2 focus:ring-[#8D5EAD]/30">
                {AGE_GRPS.map((a) => <option key={a} value={a}>{a || "All"}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">Product</label>
              <select value={filters.product} onChange={(e) => setFilters({ ...filters, product: e.target.value })} className="border border-[#C2CCE3] rounded-lg px-3 py-2 text-sm text-[#1A2534] bg-white focus:outline-none focus:ring-2 focus:ring-[#8D5EAD]/30">
                {PRODUCTS.map((p) => <option key={p} value={p}>{p || "All"}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">PMPM Group</label>
              <select value={filters.pmpmGrp} onChange={(e) => setFilters({ ...filters, pmpmGrp: e.target.value })} className="border border-[#C2CCE3] rounded-lg px-3 py-2 text-sm text-[#1A2534] bg-white focus:outline-none focus:ring-2 focus:ring-[#8D5EAD]/30 min-w-[200px]">
                {PMPM_GRPS.map((p) => <option key={p} value={p}>{p || "All"}</option>)}
              </select>
            </div>
            <button onClick={applyFilters} className="px-5 py-2 bg-gradient-to-r from-[#5A3A76] to-[#8D5EAD] text-white text-sm font-medium rounded-lg hover:from-[#6F4891] hover:to-[#9B6FBB] transition-all shadow-sm">
              Apply
            </button>
            <button onClick={resetFilters} className="px-5 py-2 text-sm text-[#7C89A6] border border-[#C2CCE3] rounded-lg hover:bg-gray-50 transition-colors">
              Reset
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#8D5EAD] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : summary && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <KpiCard label="Total Members" value={fmt(summary.TOTAL_MEMBERS)} />
              <KpiCard label="Total Member Months" value={fmt(summary.TOTAL_MM)} />
              <KpiCard label="Total Paid" value={fmtCurrency(summary.TOTAL_PAID)} />
              <KpiCard label="Avg PMPM" value={fmtCurrency(summary.AVG_PMPM, 2)} />
              <KpiCard label="PCP Visits" value={fmt(summary.PCP_VISITS)} sub={`${fmt((summary.PCP_VISITS / summary.TOTAL_MEMBERS) * 100, 1)}% of members`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <KpiCard label="Behavioral Health" value={fmt(summary.BH_MEMBERS)} sub={`${fmt((summary.BH_MEMBERS / summary.TOTAL_MEMBERS) * 100, 1)}%`} />
              <KpiCard label="ED Visits" value={fmt(summary.ED_MEMBERS)} sub={`${fmt((summary.ED_MEMBERS / summary.TOTAL_MEMBERS) * 100, 1)}%`} />
              <KpiCard label="Inpatient" value={fmt(summary.IPT_MEMBERS)} sub={`${fmt((summary.IPT_MEMBERS / summary.TOTAL_MEMBERS) * 100, 1)}%`} />
              <KpiCard label="Pregnancy" value={fmt(summary.PREG_MEMBERS)} sub={`${fmt((summary.PREG_MEMBERS / summary.TOTAL_MEMBERS) * 100, 1)}%`} />
              <KpiCard label="Exclusions" value={fmt(summary.EXCLUSIONS)} sub={`${fmt((summary.EXCLUSIONS / summary.TOTAL_MEMBERS) * 100, 1)}%`} />
            </div>

            {/* Breakdown Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BreakdownTable title="By Gender" rows={byGender} />
              <BreakdownTable title="By Age Group" rows={byAge} />
              <BreakdownTable title="By Product" rows={byProduct} />
              <BreakdownTable title="By PMPM Group" rows={byPmpmGrp} />
            </div>
          </>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E0F0] overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-[#5A3A76]/5 to-[#8D5EAD]/5 border-b border-[#E8E0F0] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1A2534]">Raw Data</h2>
            <span className="text-xs font-medium text-[#7C89A6] bg-[#5A3A76]/5 px-3 py-1 rounded-full">
              {fmt(total)} records | Page {page} of {totalPages}
            </span>
          </div>
          <div className="overflow-x-auto">
            {dataLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#8D5EAD] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E8E0F0]">
                    {["Member ID", "Gender", "Product", "Age Grp", "Type", "MM", "Total Paid", "PMPM", "PMPM Grp", "PCP", "Excl", "CC", "BH", "Preg", "IPT", "ED", "Household", "Adults"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-[#7C89A6] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBF5]">
                  {dataRows.map((r) => (
                    <tr key={r.MEMBER_ID} className="hover:bg-[#5A3A76]/[0.02]">
                      <td className="px-3 py-2 font-mono text-[#1A2534]">{r.MEMBER_ID}</td>
                      <td className="px-3 py-2 text-[#4B5563]">{r.MEMBER_GENDER}</td>
                      <td className="px-3 py-2 text-[#4B5563]">{r.MEMBER_PRODUCT_GL}</td>
                      <td className="px-3 py-2 text-[#4B5563]">{r.AGE_GRP}</td>
                      <td className="px-3 py-2 text-[#4B5563]">{r.ADULT_CHILD}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.MM}</td>
                      <td className="px-3 py-2 text-right font-mono">{fmtCurrency(r.TOT_PD, 2)}</td>
                      <td className="px-3 py-2 text-right font-mono font-medium">{fmtCurrency(r.PMPM, 2)}</td>
                      <td className="px-3 py-2 text-[#4B5563] whitespace-nowrap">{r.PMPM_GRP}</td>
                      <td className="px-3 py-2 text-center">{r.PCPV}</td>
                      <td className="px-3 py-2 text-center">{r.EXCL}</td>
                      <td className="px-3 py-2 text-center">{r.CC}</td>
                      <td className="px-3 py-2 text-center">{r.BH}</td>
                      <td className="px-3 py-2 text-center">{r.PREG}</td>
                      <td className="px-3 py-2 text-center">{r.IPT}</td>
                      <td className="px-3 py-2 text-center">{r.ED}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.HSHLD}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.ADULTS}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination */}
          <div className="px-6 py-3 border-t border-[#E8E0F0] flex items-center justify-between">
            <button
              onClick={() => loadPage(filters, page - 1)}
              disabled={page <= 1}
              className="px-4 py-1.5 text-sm font-medium text-[#5A3A76] border border-[#5A3A76]/30 rounded-lg hover:bg-[#5A3A76]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-[#7C89A6]">
              Showing {fmt((page - 1) * limit + 1)}–{fmt(Math.min(page * limit, total))} of {fmt(total)}
            </span>
            <button
              onClick={() => loadPage(filters, page + 1)}
              disabled={page >= totalPages}
              className="px-4 py-1.5 text-sm font-medium text-[#5A3A76] border border-[#5A3A76]/30 rounded-lg hover:bg-[#5A3A76]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </main>

      <footer className="mt-8 py-4 text-center">
        <p className="text-xs text-[#7C89A6]/50">Powered by Paramean Solutions</p>
      </footer>
    </div>
  );
}
