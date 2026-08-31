import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { userApi } from "../../../api/user.api";
import { formatCurrency, formatDate } from "../../../utils";

export default function ClientsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [kycFilter, setKycFilter] = useState("");

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

  // Filter client listings
  const filteredTraders = traders.filter((u: any) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKyc = kycFilter ? u.kycStatus === kycFilter : true;
    return matchesSearch && matchesKyc;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-800">Traders Accounts & Compliance</h1>
        <p className="text-xs text-gray-400 mt-0.5">Audit client records, verify KYC credentials, and block/unblock logins.</p>
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:max-w-xs relative">
          <input
            type="text"
            placeholder="Search clients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
          {["", "pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setKycFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                kycFilter === status
                  ? "bg-[#1a3a2a] text-white border-transparent"
                  : "bg-white border-gray-200 text-gray-650 hover:bg-gray-50"
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
            <div key={i} className="h-14 bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredTraders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-sm text-gray-400">
          No trader clients match your criteria.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-50">
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Registered</th>
                  <th className="px-5 py-3 text-right">Available Balance</th>
                  <th className="px-5 py-3 text-right">Credit / Limit</th>
                  <th className="px-5 py-3 text-center">KYC Check</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTraders.map((u: any) => (
                  <tr key={u._id} className="hover:bg-gray-50/40">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-800">{u.username}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{u.email}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-gray-800 whitespace-nowrap">
                      {formatCurrency(u.balance)}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap font-mono text-xs text-gray-650">
                      <div>Cred: {u.creditScore ?? 100}</div>
                      <div className="text-[10px] text-gray-400">Limit: {formatCurrency(u.loanLimit ?? 0)}</div>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.kycStatus === "approved"
                          ? "bg-green-50 text-green-700"
                          : u.kycStatus === "pending"
                          ? "bg-yellow-50 text-yellow-700 animate-pulse"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {u.kycStatus || "unsubmitted"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => toggleActiveMutation.mutate(u._id)}
                        disabled={toggleActiveMutation.isPending}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-red-50 text-red-700 border border-red-150"
                        }`}
                      >
                        {u.isActive ? "ACTIVE" : "BLOCKED"}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/executor/clients/${u._id}`)}
                        className="text-xs px-3 py-1.5 bg-[#f0f7f4] text-[#2d6a4f] hover:bg-[#e0f0e8] font-bold rounded-lg transition-colors"
                      >
                        Inspect Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
