"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FunnelStep {
  name: string;
  adults: number;
  children: number;
  total: number;
  adultMM: number;
  childMM: number;
  adultPaid: number;
  childPaid: number;
  adultPmpm: number;
  childPmpm: number;
  excluded: number;
  excludedPct: number;
  cumulExclPct: number;
}

interface OutputTable {
  beforeFamilyDef: {
    totalAnchorsAdults: number;
    totalAnchorsChildren: number;
    totalNonAnchorsAdults: number;
    totalNonAnchorsChildren: number;
    totalNestAdults: number;
    totalNestChildren: number;
  };
  familyDefinition: {
    adultAnchorHrp: number;
    childAnchor: number;
    otherAdultGt2: number;
    adultSingleExcl: number;
    anchorsLostAdults: number;
    anchorsLostChildren: number;
    anchorsLostPct: number;
    remainingAdults: number;
    remainingChildren: number;
  };
  afterFamilyDef: {
    totalAnchorsAdults: number;
    totalAnchorsChildren: number;
    totalNonAnchorsAdults: number;
    totalNonAnchorsChildren: number;
    totalNestAdults: number;
    totalNestChildren: number;
  };
}

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

function fmt(n: number | null | undefined, decimals = 0): string {
  if (n == null) return "0";
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCurrency(n: number | null | undefined, decimals = 0): string {
  return "$" + fmt(n, decimals);
}

function pct(n: number | null | undefined): string {
  if (n == null) return "0.0%";
  return fmt(n * 100, 1) + "%";
}

const DEFAULT_CRITERIA: CriteriaInput = {
  pmpmMinAdult: 100,
  pmpmMaxAdult: 5000,
  pmpmMinChild: 100,
  pmpmMaxChild: 5000,
  excludeNoPcp: true,
  excludeExclusions: true,
  excludeIpt: true,
  excludeEd: false,
  excludeLowMm: true,
  minMmAdult: 2,
  minMmChild: 2,
};

export default function TargetingPage() {
  const router = useRouter();
  const [criteria, setCriteria] = useState<CriteriaInput>(DEFAULT_CRITERIA);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [outputTable, setOutputTable] = useState<OutputTable | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasRun, setHasRun] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/targeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteria),
      });
      if (!res.ok) throw new Error("Failed to run analysis");
      const data = await res.json();
      setFunnel(data.funnel ?? []);
      setOutputTable(data.outputTable ?? null);
      setHasRun(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  };

  const startTotal = funnel.length > 0 ? funnel[0].total : 1;
  const finalStep = funnel.length > 0 ? funnel[funnel.length - 1] : null;

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
              <Link href="/" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-all">Nest Criteria</Link>
              <Link href="/reporting" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-all">Reporting</Link>
              <Link href="/targeting" className="px-3 py-1.5 text-sm text-white bg-white/15 rounded-lg">Targeting</Link>
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
        {/* Criteria Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E0F0] overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-[#5A3A76]/5 to-[#8D5EAD]/5 border-b border-[#E8E0F0]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#5A3A76]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#5A3A76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-[#1A2534]">Targeting Criteria</h2>
              <p className="text-xs text-[#7C89A6] ml-2">Configure filters to narrow down the 215K population to high-value targets</p>
            </div>
          </div>
          <div className="px-6 py-5 space-y-6">
            {/* PMPM Thresholds */}
            <div>
              <h3 className="text-sm font-semibold text-[#1A2534] mb-3">PMPM Threshold</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">Adult Min</label>
                  <input type="number" value={criteria.pmpmMinAdult} onChange={(e) => setCriteria({ ...criteria, pmpmMinAdult: Number(e.target.value) })}
                    className="border border-[#C2CCE3] rounded-lg px-3 py-2 w-full text-sm text-[#1A2534] focus:outline-none focus:ring-2 focus:ring-[#8D5EAD]/30 focus:border-[#8D5EAD]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">Adult Max</label>
                  <input type="number" value={criteria.pmpmMaxAdult} onChange={(e) => setCriteria({ ...criteria, pmpmMaxAdult: Number(e.target.value) })}
                    className="border border-[#C2CCE3] rounded-lg px-3 py-2 w-full text-sm text-[#1A2534] focus:outline-none focus:ring-2 focus:ring-[#8D5EAD]/30 focus:border-[#8D5EAD]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">Child Min</label>
                  <input type="number" value={criteria.pmpmMinChild} onChange={(e) => setCriteria({ ...criteria, pmpmMinChild: Number(e.target.value) })}
                    className="border border-[#C2CCE3] rounded-lg px-3 py-2 w-full text-sm text-[#1A2534] focus:outline-none focus:ring-2 focus:ring-[#8D5EAD]/30 focus:border-[#8D5EAD]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">Child Max</label>
                  <input type="number" value={criteria.pmpmMaxChild} onChange={(e) => setCriteria({ ...criteria, pmpmMaxChild: Number(e.target.value) })}
                    className="border border-[#C2CCE3] rounded-lg px-3 py-2 w-full text-sm text-[#1A2534] focus:outline-none focus:ring-2 focus:ring-[#8D5EAD]/30 focus:border-[#8D5EAD]" />
                </div>
              </div>
            </div>

            {/* Exclusion Toggles */}
            <div>
              <h3 className="text-sm font-semibold text-[#1A2534] mb-3">Exclusion Criteria</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { key: "excludeNoPcp" as const, label: "Exclude No PCP Visits", desc: "Remove members without any PCP visits" },
                  { key: "excludeExclusions" as const, label: "Exclude Cancer/Transplant", desc: "Remove Cancer, Hemophilia, Transplant cases" },
                  { key: "excludeIpt" as const, label: "Exclude Inpatient (IPT)", desc: "Remove members with inpatient stays" },
                  { key: "excludeEd" as const, label: "Exclude ED Visits", desc: "Remove members with emergency dept visits" },
                  { key: "excludeLowMm" as const, label: "Exclude Low Member Months", desc: "Remove members below minimum months" },
                ].map(({ key, label, desc }) => (
                  <label key={key} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${criteria[key] ? "border-[#8D5EAD]/40 bg-[#5A3A76]/[0.03]" : "border-[#E8E0F0] bg-white hover:bg-gray-50"}`}>
                    <input type="checkbox" checked={criteria[key]} onChange={(e) => setCriteria({ ...criteria, [key]: e.target.checked })}
                      className="mt-0.5 w-4 h-4 text-[#5A3A76] rounded border-[#C2CCE3] focus:ring-[#8D5EAD]/30" />
                    <div>
                      <span className="text-sm font-medium text-[#1A2534]">{label}</span>
                      <p className="text-xs text-[#7C89A6] mt-0.5">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Min Member Months */}
            {criteria.excludeLowMm && (
              <div className="flex gap-4 pl-1">
                <div>
                  <label className="block text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">Min MM (Adult)</label>
                  <input type="number" value={criteria.minMmAdult} onChange={(e) => setCriteria({ ...criteria, minMmAdult: Number(e.target.value) })}
                    className="border border-[#C2CCE3] rounded-lg px-3 py-2 w-28 text-sm text-[#1A2534] focus:outline-none focus:ring-2 focus:ring-[#8D5EAD]/30 focus:border-[#8D5EAD]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">Min MM (Child)</label>
                  <input type="number" value={criteria.minMmChild} onChange={(e) => setCriteria({ ...criteria, minMmChild: Number(e.target.value) })}
                    className="border border-[#C2CCE3] rounded-lg px-3 py-2 w-28 text-sm text-[#1A2534] focus:outline-none focus:ring-2 focus:ring-[#8D5EAD]/30 focus:border-[#8D5EAD]" />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={runAnalysis} disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-[#5A3A76] to-[#8D5EAD] text-white text-sm font-medium rounded-lg hover:from-[#6F4891] hover:to-[#9B6FBB] transition-all shadow-sm disabled:opacity-50">
                {loading ? "Running Analysis..." : "Run Targeting Analysis"}
              </button>
              <button onClick={() => setCriteria(DEFAULT_CRITERIA)}
                className="px-5 py-2.5 text-sm text-[#7C89A6] border border-[#C2CCE3] rounded-lg hover:bg-gray-50 transition-colors">
                Reset Defaults
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4">
            <p className="text-red-600 text-sm font-medium">{error}</p>
            <button onClick={runAnalysis} className="mt-2 text-sm text-red-500 underline hover:text-red-700">Retry</button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-[#8D5EAD] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#7C89A6] text-sm">Running targeting analysis on 215K members...</p>
            </div>
          </div>
        )}

        {hasRun && !loading && funnel.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-[#E8E0F0] p-5 shadow-sm">
                <p className="text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">Starting Population</p>
                <p className="text-2xl font-bold text-[#1A2534]">{fmt(funnel[0].total)}</p>
              </div>
              <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-sm">
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">Target Population</p>
                <p className="text-2xl font-bold text-emerald-700">{fmt(finalStep?.total)}</p>
                <p className="text-xs text-[#7C89A6] mt-1">{pct(finalStep ? finalStep.total / startTotal : 0)} of total</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E8E0F0] p-5 shadow-sm">
                <p className="text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">Target Adults</p>
                <p className="text-2xl font-bold text-[#5A3A76]">{fmt(finalStep?.adults)}</p>
                <p className="text-xs text-[#7C89A6] mt-1">Avg PMPM: {fmtCurrency(finalStep?.adultPmpm, 2)}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E8E0F0] p-5 shadow-sm">
                <p className="text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">Target Children</p>
                <p className="text-2xl font-bold text-[#5A3A76]">{fmt(finalStep?.children)}</p>
                <p className="text-xs text-[#7C89A6] mt-1">Avg PMPM: {fmtCurrency(finalStep?.childPmpm, 2)}</p>
              </div>
            </div>

            {/* Funnel Visualization */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E8E0F0] overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-[#5A3A76]/5 to-[#8D5EAD]/5 border-b border-[#E8E0F0]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#5A3A76]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#5A3A76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                    </svg>
                  </div>
                  <h2 className="text-base font-semibold text-[#1A2534]">Targeting Funnel</h2>
                  <span className="text-xs text-[#7C89A6] ml-auto">{fmt(startTotal)} &rarr; {fmt(finalStep?.total)} members</span>
                </div>
              </div>

              <div className="px-8 py-8">
                <div className="flex flex-col items-center">
                  {funnel.map((step, i) => {
                    const widthPct = startTotal > 0 ? Math.max(12, (step.total / startTotal) * 100) : 100;
                    const isStart = i === 0;
                    const isFinal = i === funnel.length - 1;
                    const opacity = isStart ? 1 : isFinal ? 1 : 0.55 + (0.45 * (1 - i / funnel.length));

                    return (
                      <div key={i} className="w-full flex flex-col items-center">
                        {/* Connector arrow between steps */}
                        {i > 0 && (
                          <div className="flex flex-col items-center -my-1 z-10">
                            <div className="w-px h-3 bg-[#C2CCE3]" />
                            <div className="flex items-center gap-2">
                              <div className="bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
                                <span className="text-[10px] font-semibold text-red-500">-{fmt(step.excluded)}</span>
                              </div>
                            </div>
                            <div className="w-px h-3 bg-[#C2CCE3]" />
                          </div>
                        )}

                        {/* Funnel segment */}
                        <div className="relative group w-full flex items-center justify-center">
                          {/* Left label */}
                          <div className="absolute left-0 flex items-center gap-2 pr-4" style={{ width: "calc(50% - " + (widthPct / 2) + "%)" }}>
                            <div className="ml-auto flex items-center gap-2">
                              {!isStart && (
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isFinal ? "bg-emerald-50 text-emerald-600" : "bg-[#5A3A76]/5 text-[#5A3A76]"}`}>
                                  {pct(step.total / startTotal)}
                                </span>
                              )}
                              <span className={`text-xs font-medium whitespace-nowrap ${isStart ? "text-[#1A2534] font-semibold" : isFinal ? "text-emerald-700 font-semibold" : "text-[#4B5563]"}`}>
                                {isStart ? step.name : `${i}. ${step.name}`}
                              </span>
                            </div>
                          </div>

                          {/* Trapezoid bar */}
                          <div
                            className="relative overflow-hidden transition-all duration-300"
                            style={{ width: `${widthPct}%`, height: isStart || isFinal ? "52px" : "44px" }}
                          >
                            <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="w-full h-full">
                              <defs>
                                {isFinal ? (
                                  <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#059669" />
                                    <stop offset="100%" stopColor="#34d399" />
                                  </linearGradient>
                                ) : (
                                  <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#5A3A76" stopOpacity={opacity} />
                                    <stop offset="100%" stopColor="#8D5EAD" stopOpacity={opacity} />
                                  </linearGradient>
                                )}
                              </defs>
                              {(() => {
                                const nextWidthPct = i < funnel.length - 1
                                  ? Math.max(12, (funnel[i + 1].total / startTotal) * 100)
                                  : widthPct;
                                const inset = ((widthPct - nextWidthPct) / widthPct) * 50;
                                const botL = isFinal ? 0 : inset;
                                const botR = isFinal ? 100 : 100 - inset;
                                return (
                                  <polygon
                                    points={`0,0 100,0 ${botR},10 ${botL},10`}
                                    fill={`url(#grad-${i})`}
                                  />
                                );
                              })()}
                            </svg>
                            {/* Centered text on bar */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`font-bold text-white drop-shadow-sm ${isStart || isFinal ? "text-sm" : "text-xs"}`}>
                                {fmt(step.total)}
                              </span>
                            </div>
                          </div>

                          {/* Right label */}
                          <div className="absolute right-0 flex items-center gap-2 pl-4" style={{ width: "calc(50% - " + (widthPct / 2) + "%)" }}>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-[#7C89A6] font-mono whitespace-nowrap">A: {fmt(step.adults)}</span>
                              <span className="text-[#7C89A6] font-mono whitespace-nowrap">C: {fmt(step.children)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reduction summary */}
                {finalStep && (
                  <div className="mt-6 flex items-center justify-center gap-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E8E0F0] to-transparent" />
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-full px-5 py-2">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-emerald-700">
                        {fmt(startTotal)} &rarr; {fmt(finalStep.total)} members
                      </span>
                      <span className="text-xs text-emerald-600">
                        ({pct(1 - finalStep.total / startTotal)} reduction)
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E8E0F0] to-transparent" />
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Steps Table */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E8E0F0] overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-[#5A3A76]/5 to-[#8D5EAD]/5 border-b border-[#E8E0F0]">
                <h2 className="text-base font-semibold text-[#1A2534]">Detailed Funnel Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#E8E0F0]">
                      <th className="px-4 py-3 text-left font-semibold text-[#7C89A6] uppercase">Step</th>
                      <th className="px-4 py-3 text-center font-semibold text-[#7C89A6] uppercase">Adults</th>
                      <th className="px-4 py-3 text-center font-semibold text-[#7C89A6] uppercase">Children</th>
                      <th className="px-4 py-3 text-center font-semibold text-[#7C89A6] uppercase">Total</th>
                      <th className="px-4 py-3 text-center font-semibold text-[#7C89A6] uppercase">Excluded</th>
                      <th className="px-4 py-3 text-center font-semibold text-[#7C89A6] uppercase">Excl %</th>
                      <th className="px-4 py-3 text-center font-semibold text-[#7C89A6] uppercase">Cumul Excl %</th>
                      <th className="px-4 py-3 text-center font-semibold text-[#7C89A6] uppercase">Adult MM</th>
                      <th className="px-4 py-3 text-center font-semibold text-[#7C89A6] uppercase">Child MM</th>
                      <th className="px-4 py-3 text-center font-semibold text-[#7C89A6] uppercase">Adult PMPM</th>
                      <th className="px-4 py-3 text-center font-semibold text-[#7C89A6] uppercase">Child PMPM</th>
                      <th className="px-4 py-3 text-center font-semibold text-[#7C89A6] uppercase">Adult Paid</th>
                      <th className="px-4 py-3 text-center font-semibold text-[#7C89A6] uppercase">Child Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBF5]">
                    {funnel.map((step, i) => {
                      const isStart = i === 0;
                      const isFinal = i === funnel.length - 1;
                      return (
                        <tr key={i} className={isFinal ? "bg-emerald-50/50" : isStart ? "bg-[#5A3A76]/[0.02]" : "hover:bg-[#5A3A76]/[0.01]"}>
                          <td className={`px-4 py-2.5 font-medium whitespace-nowrap ${isFinal ? "text-emerald-700" : "text-[#1A2534]"}`}>
                            {isStart ? step.name : `${i}. ${step.name}`}
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono">{fmt(step.adults)}</td>
                          <td className="px-4 py-2.5 text-center font-mono">{fmt(step.children)}</td>
                          <td className={`px-4 py-2.5 text-center font-mono font-bold ${isFinal ? "text-emerald-700" : ""}`}>{fmt(step.total)}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-red-500">{isStart ? "—" : `-${fmt(step.excluded)}`}</td>
                          <td className="px-4 py-2.5 text-center">{isStart ? "—" : pct(step.excludedPct)}</td>
                          <td className="px-4 py-2.5 text-center">{isStart ? "—" : pct(step.cumulExclPct)}</td>
                          <td className="px-4 py-2.5 text-center font-mono">{fmt(step.adultMM)}</td>
                          <td className="px-4 py-2.5 text-center font-mono">{fmt(step.childMM)}</td>
                          <td className="px-4 py-2.5 text-center font-mono">{fmtCurrency(step.adultPmpm, 2)}</td>
                          <td className="px-4 py-2.5 text-center font-mono">{fmtCurrency(step.childPmpm, 2)}</td>
                          <td className="px-4 py-2.5 text-center font-mono">{fmtCurrency(step.adultPaid)}</td>
                          <td className="px-4 py-2.5 text-center font-mono">{fmtCurrency(step.childPaid)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Output Table */}
            {outputTable && (
              <div className="bg-white rounded-xl shadow-sm border border-[#E8E0F0] overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-[#5A3A76]/5 to-[#8D5EAD]/5 border-b border-[#E8E0F0]">
                  <h2 className="text-base font-semibold text-[#1A2534]">Output Table</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E8E0F0]">
                        <th className="px-6 py-3 text-left font-semibold text-[#7C89A6] uppercase text-xs tracking-wider w-80"></th>
                        <th className="px-6 py-3 text-center font-semibold text-[#7C89A6] uppercase text-xs tracking-wider">Adults</th>
                        <th className="px-6 py-3 text-center font-semibold text-[#7C89A6] uppercase text-xs tracking-wider">Children</th>
                        <th className="px-6 py-3 text-center font-semibold text-[#7C89A6] uppercase text-xs tracking-wider">All</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Before Family Definition */}
                      <tr className="bg-[#5A3A76]/[0.04]">
                        <td colSpan={4} className="px-6 py-2.5 font-bold text-[#1A2534] text-sm">Before Family Definition</td>
                      </tr>
                      <tr className="border-b border-[#F0EBF5]">
                        <td className="px-6 py-2 text-[#4B5563] pl-10">Total Anchors</td>
                        <td className="px-6 py-2 text-center font-mono text-[#5A3A76] font-semibold">{fmt(outputTable.beforeFamilyDef.totalAnchorsAdults)}</td>
                        <td className="px-6 py-2 text-center font-mono text-[#5A3A76] font-semibold">{fmt(outputTable.beforeFamilyDef.totalAnchorsChildren)}</td>
                        <td className="px-6 py-2 text-center font-mono font-semibold">{fmt(outputTable.beforeFamilyDef.totalAnchorsAdults + outputTable.beforeFamilyDef.totalAnchorsChildren)}</td>
                      </tr>
                      <tr className="border-b border-[#F0EBF5]">
                        <td className="px-6 py-2 text-[#4B5563] pl-10">Total Non-Anchors</td>
                        <td className="px-6 py-2 text-center font-mono">{fmt(outputTable.beforeFamilyDef.totalNonAnchorsAdults)}</td>
                        <td className="px-6 py-2 text-center font-mono">{fmt(outputTable.beforeFamilyDef.totalNonAnchorsChildren)}</td>
                        <td className="px-6 py-2 text-center font-mono">{fmt(outputTable.beforeFamilyDef.totalNonAnchorsAdults + outputTable.beforeFamilyDef.totalNonAnchorsChildren)}</td>
                      </tr>
                      <tr className="border-b-2 border-[#E8E0F0] bg-[#5A3A76]/[0.02]">
                        <td className="px-6 py-2.5 font-bold text-[#1A2534]">Total Nest Members</td>
                        <td className="px-6 py-2.5 text-center font-mono font-bold text-[#1A2534]">{fmt(outputTable.beforeFamilyDef.totalNestAdults)}</td>
                        <td className="px-6 py-2.5 text-center font-mono font-bold text-[#1A2534]">{fmt(outputTable.beforeFamilyDef.totalNestChildren)}</td>
                        <td className="px-6 py-2.5 text-center font-mono font-bold text-[#1A2534]">{fmt(outputTable.beforeFamilyDef.totalNestAdults + outputTable.beforeFamilyDef.totalNestChildren)}</td>
                      </tr>

                      {/* Family Definition Details */}
                      <tr><td colSpan={4} className="py-2"></td></tr>
                      <tr className="border-b border-[#F0EBF5]">
                        <td className="px-6 py-2 text-[#4B5563] pl-10">Adult Anchor w HRP (&gt;1)</td>
                        <td className="px-6 py-2 text-center font-mono">{fmt(outputTable.familyDefinition.adultAnchorHrp)}</td>
                        <td className="px-6 py-2 text-center font-mono">0</td>
                        <td className="px-6 py-2 text-center font-mono">{fmt(outputTable.familyDefinition.adultAnchorHrp)}</td>
                      </tr>
                      <tr className="border-b border-[#F0EBF5]">
                        <td className="px-6 py-2 text-[#4B5563] pl-10">Child Anchor (&gt;1)</td>
                        <td className="px-6 py-2 text-center font-mono">0</td>
                        <td className="px-6 py-2 text-center font-mono">{fmt(outputTable.familyDefinition.childAnchor)}</td>
                        <td className="px-6 py-2 text-center font-mono">{fmt(outputTable.familyDefinition.childAnchor)}</td>
                      </tr>
                      <tr className="border-b border-[#F0EBF5]">
                        <td className="px-6 py-2 text-[#4B5563] pl-10">Other Adult Anchor (&gt;2)</td>
                        <td className="px-6 py-2 text-center font-mono">{fmt(outputTable.familyDefinition.otherAdultGt2)}</td>
                        <td className="px-6 py-2 text-center font-mono">0</td>
                        <td className="px-6 py-2 text-center font-mono">{fmt(outputTable.familyDefinition.otherAdultGt2)}</td>
                      </tr>
                      <tr className="border-b border-[#F0EBF5]">
                        <td className="px-6 py-2 text-[#4B5563] pl-10">Other Adult Anchor (1) Excluded</td>
                        <td className="px-6 py-2 text-center font-mono">{fmt(outputTable.familyDefinition.adultSingleExcl)}</td>
                        <td className="px-6 py-2 text-center font-mono">0</td>
                        <td className="px-6 py-2 text-center font-mono">{fmt(outputTable.familyDefinition.adultSingleExcl)}</td>
                      </tr>
                      <tr className="border-b border-[#F0EBF5] bg-red-50/50">
                        <td className="px-6 py-2 text-red-600 font-medium pl-16">Family Definition (Anchors Lost)</td>
                        <td className="px-6 py-2 text-center font-mono text-red-600 font-semibold">{fmt(outputTable.familyDefinition.anchorsLostAdults)}</td>
                        <td className="px-6 py-2 text-center font-mono text-red-600">{fmt(outputTable.familyDefinition.anchorsLostChildren)}</td>
                        <td className="px-6 py-2 text-center font-mono text-red-600 font-semibold">
                          {fmt(outputTable.familyDefinition.anchorsLostAdults + outputTable.familyDefinition.anchorsLostChildren)}
                          <span className="ml-2 text-xs">({pct(outputTable.familyDefinition.anchorsLostPct)} of Anchors Lost)</span>
                        </td>
                      </tr>
                      <tr className="border-b-2 border-[#E8E0F0]">
                        <td className="px-6 py-2 text-[#4B5563] italic pl-16">Remaining</td>
                        <td className="px-6 py-2 text-center font-mono italic">{fmt(outputTable.familyDefinition.remainingAdults)}</td>
                        <td className="px-6 py-2 text-center font-mono italic">{fmt(outputTable.familyDefinition.remainingChildren)}</td>
                        <td className="px-6 py-2 text-center font-mono italic">{fmt(outputTable.familyDefinition.remainingAdults + outputTable.familyDefinition.remainingChildren)}</td>
                      </tr>

                      {/* After Family Definition */}
                      <tr><td colSpan={4} className="py-2"></td></tr>
                      <tr className="bg-[#5A3A76]/[0.04]">
                        <td colSpan={4} className="px-6 py-2.5 font-bold text-[#1A2534] text-sm">After Family Definition</td>
                      </tr>
                      <tr className="border-b border-[#F0EBF5]">
                        <td className="px-6 py-2 text-[#4B5563] pl-10 font-semibold">Total Anchors</td>
                        <td className="px-6 py-2 text-center font-mono text-[#5A3A76] font-semibold">{fmt(outputTable.afterFamilyDef.totalAnchorsAdults)}</td>
                        <td className="px-6 py-2 text-center font-mono text-[#5A3A76] font-semibold">{fmt(outputTable.afterFamilyDef.totalAnchorsChildren)}</td>
                        <td className="px-6 py-2 text-center font-mono font-semibold">{fmt(outputTable.afterFamilyDef.totalAnchorsAdults + outputTable.afterFamilyDef.totalAnchorsChildren)}</td>
                      </tr>
                      <tr className="border-b border-[#F0EBF5]">
                        <td className="px-6 py-2 text-[#4B5563] pl-10 font-semibold">Total Non-Anchors</td>
                        <td className="px-6 py-2 text-center font-mono">{fmt(outputTable.afterFamilyDef.totalNonAnchorsAdults)}</td>
                        <td className="px-6 py-2 text-center font-mono">{fmt(outputTable.afterFamilyDef.totalNonAnchorsChildren)}</td>
                        <td className="px-6 py-2 text-center font-mono">{fmt(outputTable.afterFamilyDef.totalNonAnchorsAdults + outputTable.afterFamilyDef.totalNonAnchorsChildren)}</td>
                      </tr>
                      <tr className="bg-emerald-50/70 border-t-2 border-emerald-200">
                        <td className="px-6 py-3 font-bold text-emerald-700 text-sm">Total Nest Members</td>
                        <td className="px-6 py-3 text-center font-mono font-bold text-emerald-700 text-base">{fmt(outputTable.afterFamilyDef.totalNestAdults)}</td>
                        <td className="px-6 py-3 text-center font-mono font-bold text-emerald-700 text-base">{fmt(outputTable.afterFamilyDef.totalNestChildren)}</td>
                        <td className="px-6 py-3 text-center font-mono font-bold text-emerald-700 text-base">{fmt(outputTable.afterFamilyDef.totalNestAdults + outputTable.afterFamilyDef.totalNestChildren)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {hasRun && !loading && funnel.length === 0 && !error && (
          <div className="bg-white rounded-xl border border-[#E8E0F0] p-12 text-center">
            <p className="text-[#7C89A6]">No results returned. Try adjusting your criteria.</p>
          </div>
        )}
      </main>

      <footer className="mt-8 py-4 text-center">
        <p className="text-xs text-[#7C89A6]/50">Powered by Paramean Solutions</p>
      </footer>
    </div>
  );
}
