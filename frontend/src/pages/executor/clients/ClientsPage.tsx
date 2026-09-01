import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { userApi } from "../../../api/user.api";
import { useAuthStore } from "../../../store/auth.store";
import { formatCurrency, formatDate } from "../../../utils";
import Pagination from "../../../components/common/Pagination";

export default function ClientsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [kycFilter, setKycFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [impersonateError, setImpersonateError] = useState("");

  const currentUser = useAuthStore((s) => s.user);
  const currentToken = useAuthStore((s) => s.accessToken);
  const setImpersonation = useAuthStore((s) => s.setImpersonation);

  // Query Traders list
  const { data: tradersData, isLoading } = useQuery({
    queryKey: ["executor-traders-listing"],
    queryFn: () => userApi.getAllTraders().then((r) => r.data),
  });

  const traders = tradersData?.users ?? [];

  // Toggle user active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => userApi.toggleUserActive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-traders-listing"] });
    },
  });

  // Impersonate trader mutation
  const handleImpersonate = async (targetTrader: any) => {
    try {
      setImpersonateError("");
      setImpersonatingId(targetTrader._id);
      const res = await userApi.impersonateTrader(targetTrader._id);
      if (res.data?.success && currentUser && currentToken) {
        setImpersonation(res.data.user, res.data.accessToken, currentUser, currentToken);
        navigate("/trader/dashboard");
      }
    } catch (err: any) {
      setImpersonateError(err?.response?.data?.message || "Failed to impersonate trader account");
    } finally {
      setImpersonatingId(null);
    }
  };

  // Filter client listings
  const filteredTraders = traders.filter((u: any) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKyc = kycFilter ? u.kycStatus === kycFilter : true;
    return matchesSearch && matchesKyc;
  });

  const totalPages = Math.ceil(filteredTraders.length / pageSize) || 1;
  const paginatedTraders = filteredTraders.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-white">Traders Accounts & Compliance</h1>
        <p className="text-xs text-slate-400 mt-0.5">Audit client records, verify KYC credentials, manage balances, and cross-section login.</p>
      </div>

      {impersonateError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-bold">
          {impersonateError}
        </div>
      )}

      {/* Filters bar */}
      <div className="bg-[#121822] border border-white/10 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:max-w-xs relative">
          <input
            type="text"
            placeholder="Search clients by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/10 bg-[#0e1520] text-slate-200 text-xs focus:outline-none focus:border-[#00c076] transition-colors placeholder:text-slate-500"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
          {["", "pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setKycFilter(status);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                kycFilter === status
                  ? "bg-[#00c076] text-[#080c10] border-transparent font-bold"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {status === "" ? "ALL KYC" : status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid listing */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-white/5 animate-pulse rounded-xl border border-white/5" />
          ))}
        </div>
      ) : filteredTraders.length === 0 ? (
        <div className="bg-[#121822] rounded-2xl border border-white/10 py-16 text-center text-sm text-slate-400">
          No trader clients match your criteria.
        </div>
      ) : (
        <div className="bg-[#121822] rounded-2xl border border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#0b0f14] text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10">
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Registered</th>
                  <th className="px-5 py-3 text-right">Available Balance</th>
                  <th className="px-5 py-3 text-right">Credit / Limit</th>
                  <th className="px-5 py-3 text-center">KYC Check</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedTraders.map((u: any) => (
                  <tr key={u._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-white">{u.username}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-white whitespace-nowrap">
                      <div>{formatCurrency(u.balance)}</div>
                      {u.bonus > 0 && (
                        <div className="text-[10px] text-amber-400 font-mono">+Bonus: {formatCurrency(u.bonus)}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap font-mono text-xs text-slate-300">
                      <div>Cred: {u.creditScore ?? 100}</div>
                      <div className="text-[10px] text-slate-400">Limit: {formatCurrency(u.loanLimit ?? 0)}</div>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.kycStatus === "approved"
                          ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                          : u.kycStatus === "pending"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}>
                        {u.kycStatus || "unsubmitted"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => toggleActiveMutation.mutate(u._id)}
                        disabled={toggleActiveMutation.isPending}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                          u.isActive
                            ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {u.isActive ? "ACTIVE" : "BLOCKED"}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleImpersonate(u)}
                          disabled={impersonatingId === u._id}
                          title="Cross-Section Login as Trader"
                          className="text-xs px-2.5 py-1.5 bg-[#00c076] hover:bg-[#00e676] text-[#080c10] font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          {impersonatingId === u._id ? "Logging in..." : "Login"}
                        </button>
                        <button
                          onClick={() => navigate(`/executor/clients/${u._id}`)}
                          className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-lg transition-colors border border-white/10"
                        >
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredTraders.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}
