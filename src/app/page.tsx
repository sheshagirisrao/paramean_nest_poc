"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Member {
  id: number;
  memberName: string;
  familyName: string;
  pmpm: number;
  pmpmEligible: number;
  anchor: number;
  familyEligible: number;
  eligible: number;
}

interface Settings {
  pmpmLower: number;
  pmpmUpper: number;
}

async function fetchMembers(): Promise<Member[]> {
  const res = await fetch("/api/members");
  return res.json();
}

async function fetchSettings(): Promise<Settings> {
  const res = await fetch("/api/settings");
  return res.json();
}

export default function Home() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [settings, setSettings] = useState<Settings>({ pmpmLower: 600, pmpmUpper: 1000 });
  const [form, setForm] = useState({ memberName: "", familyName: "", pmpm: "" });
  const [editingSettings, setEditingSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState<Settings>({ pmpmLower: 600, pmpmUpper: 1000 });
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");

  const refreshData = useCallback(async () => {
    const [membersData, settingsData] = await Promise.all([fetchMembers(), fetchSettings()]);
    setMembers(membersData);
    setSettings(settingsData);
    setTempSettings(settingsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMembers(), fetchSettings()]).then(([membersData, settingsData]) => {
      if (cancelled) return;
      setMembers(membersData);
      setSettings(settingsData);
      setTempSettings(settingsData);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.memberName || !form.familyName || !form.pmpm) return;

    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, pmpm: Number(form.pmpm) }),
    });

    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error || "Failed to add member");
      return;
    }

    setForm({ memberName: "", familyName: "", pmpm: "" });
    refreshData();
  };

  const deleteMember = async (id: number) => {
    await fetch(`/api/members?id=${id}`, { method: "DELETE" });
    refreshData();
  };

  const saveSettings = async () => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tempSettings),
    });
    setSettings(tempSettings);
    setEditingSettings(false);
    refreshData();
  };

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F7F5FA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#8D5EAD] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#7C89A6] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5FA]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1A2534] via-[#2A1F3D] to-[#5A3A76] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8D5EAD] to-[#B18AC7] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Paramean Nest</h1>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white border border-white/20 rounded-lg hover:bg-white/10 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Settings Card */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E0F0] overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-[#5A3A76]/5 to-[#8D5EAD]/5 border-b border-[#E8E0F0] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#5A3A76]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#5A3A76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-[#1A2534]">PMPM Configuration</h2>
            </div>
            {!editingSettings && (
              <button
                onClick={() => setEditingSettings(true)}
                className="px-4 py-1.5 text-sm font-medium text-[#5A3A76] border border-[#5A3A76]/30 rounded-lg hover:bg-[#5A3A76]/5 transition-colors"
              >
                Edit Limits
              </button>
            )}
          </div>
          <div className="px-6 py-4">
            {editingSettings ? (
              <div className="flex items-end gap-4 flex-wrap">
                <div>
                  <label className="block text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">Lower Limit</label>
                  <input
                    type="number"
                    value={tempSettings.pmpmLower}
                    onChange={(e) => setTempSettings({ ...tempSettings, pmpmLower: Number(e.target.value) })}
                    className="border border-[#C2CCE3] rounded-lg px-3 py-2 w-32 text-[#1A2534] focus:outline-none focus:ring-2 focus:ring-[#8D5EAD]/30 focus:border-[#8D5EAD] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">Upper Limit</label>
                  <input
                    type="number"
                    value={tempSettings.pmpmUpper}
                    onChange={(e) => setTempSettings({ ...tempSettings, pmpmUpper: Number(e.target.value) })}
                    className="border border-[#C2CCE3] rounded-lg px-3 py-2 w-32 text-[#1A2534] focus:outline-none focus:ring-2 focus:ring-[#8D5EAD]/30 focus:border-[#8D5EAD] transition-colors"
                  />
                </div>
                <button
                  onClick={saveSettings}
                  className="px-5 py-2 bg-gradient-to-r from-[#5A3A76] to-[#8D5EAD] text-white text-sm font-medium rounded-lg hover:from-[#6F4891] hover:to-[#9B6FBB] transition-all shadow-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditingSettings(false); setTempSettings(settings); }}
                  className="px-5 py-2 text-sm text-[#7C89A6] border border-[#C2CCE3] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#7C89A6] uppercase tracking-wider">Lower</span>
                  <span className="text-lg font-semibold text-[#5A3A76]">${settings.pmpmLower.toLocaleString()}</span>
                </div>
                <div className="h-6 w-px bg-[#E8E0F0]" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#7C89A6] uppercase tracking-wider">Upper</span>
                  <span className="text-lg font-semibold text-[#5A3A76]">${settings.pmpmUpper.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Member Card */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E0F0] overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-[#5A3A76]/5 to-[#8D5EAD]/5 border-b border-[#E8E0F0]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#5A3A76]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#5A3A76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-[#1A2534]">Add Member</h2>
            </div>
          </div>
          <div className="px-6 py-5">
            <form onSubmit={addMember} className="flex items-end gap-4 flex-wrap">
              <div>
                <label className="block text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">Member Name</label>
                <input
                  type="text"
                  value={form.memberName}
                  onChange={(e) => setForm({ ...form, memberName: e.target.value })}
                  className="border border-[#C2CCE3] rounded-lg px-3 py-2 w-52 text-[#1A2534] placeholder-[#7C89A6]/50 focus:outline-none focus:ring-2 focus:ring-[#8D5EAD]/30 focus:border-[#8D5EAD] transition-colors"
                  placeholder="e.g. Member 1"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">Family Name</label>
                <input
                  type="text"
                  value={form.familyName}
                  onChange={(e) => setForm({ ...form, familyName: e.target.value })}
                  className="border border-[#C2CCE3] rounded-lg px-3 py-2 w-52 text-[#1A2534] placeholder-[#7C89A6]/50 focus:outline-none focus:ring-2 focus:ring-[#8D5EAD]/30 focus:border-[#8D5EAD] transition-colors"
                  placeholder="e.g. Family 1"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7C89A6] uppercase tracking-wider mb-1">PMPM</label>
                <input
                  type="number"
                  value={form.pmpm}
                  onChange={(e) => setForm({ ...form, pmpm: e.target.value })}
                  className="border border-[#C2CCE3] rounded-lg px-3 py-2 w-36 text-[#1A2534] placeholder-[#7C89A6]/50 focus:outline-none focus:ring-2 focus:ring-[#8D5EAD]/30 focus:border-[#8D5EAD] transition-colors"
                  placeholder="e.g. 750"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-[#5A3A76] to-[#8D5EAD] text-white text-sm font-medium rounded-lg hover:from-[#6F4891] hover:to-[#9B6FBB] transition-all shadow-sm shadow-[#5A3A76]/15"
              >
                Add Member
              </button>
            </form>
            {formError && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                <p className="text-red-600 text-sm">{formError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E0F0] overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-[#5A3A76]/5 to-[#8D5EAD]/5 border-b border-[#E8E0F0] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#5A3A76]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#5A3A76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12h-7.5m7.5 0c-.621 0-1.125.504-1.125 1.125M12 12h7.5m-7.5 0c.621 0 1.125.504 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-[#1A2534]">Nest Criteria</h2>
            </div>
            <span className="text-xs font-medium text-[#7C89A6] bg-[#5A3A76]/5 px-3 py-1 rounded-full">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E0F0]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7C89A6] uppercase tracking-wider">Member Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7C89A6] uppercase tracking-wider">Family Name</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[#7C89A6] uppercase tracking-wider">PMPM</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-[#7C89A6] uppercase tracking-wider">PMPM Eligible</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-[#7C89A6] uppercase tracking-wider">Anchor</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-[#7C89A6] uppercase tracking-wider">Family Eligible</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-[#7C89A6] uppercase tracking-wider">Eligible</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-[#7C89A6] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBF5]">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-[#5A3A76]/5 flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#7C89A6]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                          </svg>
                        </div>
                        <p className="text-[#7C89A6] text-sm">No members added yet</p>
                        <p className="text-[#7C89A6]/60 text-xs">Use the form above to add members</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  members.map((row) => (
                    <tr key={row.id} className="hover:bg-[#5A3A76]/[0.02] transition-colors">
                      <td className="px-6 py-3.5 text-sm font-medium text-[#1A2534]">{row.memberName}</td>
                      <td className="px-6 py-3.5 text-sm text-[#4B5563]">{row.familyName}</td>
                      <td className="px-6 py-3.5 text-sm text-right font-mono text-[#1A2534]">${row.pmpm.toLocaleString()}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          row.pmpmEligible
                            ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                            : "bg-gray-50 text-gray-400 ring-1 ring-gray-200"
                        }`}>
                          {row.pmpmEligible}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          row.anchor
                            ? "bg-[#5A3A76]/10 text-[#5A3A76] ring-1 ring-[#5A3A76]/20"
                            : "bg-gray-50 text-gray-400 ring-1 ring-gray-200"
                        }`}>
                          {row.anchor}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          row.familyEligible
                            ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
                            : "bg-gray-50 text-gray-400 ring-1 ring-gray-200"
                        }`}>
                          {row.familyEligible}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          row.eligible
                            ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                            : "bg-gray-50 text-gray-400 ring-1 ring-gray-200"
                        }`}>
                          {row.eligible}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <button
                          onClick={() => deleteMember(row.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 ring-1 ring-red-200 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 text-center">
        <p className="text-xs text-[#7C89A6]/50">Powered by Paramean Solutions</p>
      </footer>
    </div>
  );
}
