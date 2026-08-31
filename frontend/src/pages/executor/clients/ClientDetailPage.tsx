import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "../../../api/user.api";
import { loanApi } from "../../../api/loan.api";
import { walletLinkApi } from "../../../api/walletLink.api";
import { formatCurrency, formatDate } from "../../../utils";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [kycChangeError, setKycChangeError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Edit limit modal state
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [newLimit, setNewLimit] = useState("");
  const [newScore, setNewScore] = useState("");
  const [expandedWalletId, setExpandedWalletId] = useState<string | null>(null);

  // Get Client details
  const { data: detailData, isLoading, error } = useQuery({
    queryKey: ["executor-trader-detail", id],
    queryFn: () => userApi.getTraderDetails(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  // Mutations
  const kycMutation = useMutation({
    mutationFn: (status: "approved" | "rejected") => userApi.updateKycStatus(id!, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-trader-detail", id] });
      setSuccessMsg("KYC status updated successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
    onError: (err: any) => {
      setKycChangeError(err?.response?.data?.message ?? "Failed to update KYC status");
    },
  });

  // User Wallets Query
  const { data: userWalletsData } = useQuery({
    queryKey: ["executor-user-wallets", id],
    queryFn: () => walletLinkApi.getUserWallets(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const userWallets = userWalletsData ?? [];

  // Verify wallet audit mutation
  const verifyWalletMutation = useMutation({
    mutationFn: (walletId: string) => walletLinkApi.verifyWallet(walletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-user-wallets", id] });
      setSuccessMsg("Wallet linked details verified!");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: () => userApi.toggleUserActive(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-trader-detail", id] });
      setSuccessMsg("User active state toggled successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
  });

  const updateLimitMutation = useMutation({
    mutationFn: (payload: { userId: string; loanLimit: number; creditScore: number }) =>
      loanApi.upgradeUserLoanLimit(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-trader-detail", id] });
      setLimitModalOpen(false);
      setSuccessMsg("Credit parameters updated!");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
    onError: (err: any) => {
      setKycChangeError(err?.response?.data?.message ?? "Failed to save settings");
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 py-8">
        <div className="h-12 bg-gray-200 animate-pulse rounded-2xl" />
        <div className="h-48 bg-gray-200 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (error || !detailData) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center space-y-4">
        <p className="text-sm text-gray-500">Failed to load trader detail records.</p>
        <button onClick={() => navigate("/executor/clients")} className="text-xs px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold">
          Back to list
        </button>
      </div>
    );
  }

  const { user, recentTransactions = [], openPositions = [], activeInvestments = [], activeLoans = [] } = detailData;
  const profileDetails = user.profile ?? {};

  const handleSaveLimit = (e: React.FormEvent) => {
    e.preventDefault();
    setKycChangeError("");
    const l = Number(newLimit);
    const s = Number(newScore);

    if (isNaN(l) || l < 0) {
      setKycChangeError("Invalid loan limit amount");
      return;
    }
    if (isNaN(s) || s < 0 || s > 1000) {
      setKycChangeError("Credit score must be between 0 and 1000");
      return;
    }

    updateLimitMutation.mutate({
      userId: id!,
      loanLimit: l,
      creditScore: s,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <button onClick={() => navigate("/executor/clients")} className="hover:underline">Clients</button>
        <span>/</span>
        <span className="text-gray-600 font-semibold">{user.username}</span>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-100 text-xs text-emerald-700 rounded-xl">
          {successMsg}
        </div>
      )}

      {/* Hero card */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-[#2d6a4f] rounded-full flex items-center justify-center font-black text-lg">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-800">{user.username}</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                user.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-750"
              }`}>
                {user.isActive ? "ACTIVE" : "BLOCKED"}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{user.email}</p>
            <p className="text-[10px] text-gray-400 mt-1">Country: {profileDetails.country || "—"} • Exper: {profileDetails.tradingExperience || "beginner"}</p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setNewLimit(String(user.loanLimit));
              setNewScore(String(user.creditScore));
              setKycChangeError("");
              setLimitModalOpen(true);
            }}
            className="px-4 py-2 bg-gray-50 border border-gray-150 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-all"
          >
            Adjust Limits
          </button>
          <button
            onClick={() => toggleActiveMutation.mutate()}
            disabled={toggleActiveMutation.isPending}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              user.isActive
                ? "bg-red-50 text-red-650 hover:bg-red-100"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {user.isActive ? "Block Account" : "Unblock Account"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: KYC and details */}
        <div className="space-y-6">
          {/* KYC Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase">Compliance Verification</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                user.kycStatus === "approved"
                  ? "bg-green-50 text-green-700"
                  : user.kycStatus === "pending"
                  ? "bg-yellow-50 text-yellow-700 animate-pulse"
                  : "bg-red-50 text-red-700"
              }`}>
                {user.kycStatus || "unsubmitted"}
              </span>
            </div>

            {user.kycDocuments && user.kycDocuments.length > 0 ? (
              <div className="space-y-3">
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Attached Documents</span>
                <div className="grid grid-cols-2 gap-2">
                  {user.kycDocuments.map((docUrl: string, idx: number) => (
                    <a
                      key={idx}
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-gray-100 p-2.5 rounded-xl text-center bg-gray-50 hover:bg-gray-100 text-[10px] font-bold text-gray-600 truncate block transition-all"
                    >
                      📄 Document #{idx + 1}
                    </a>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => kycMutation.mutate("approved")}
                    disabled={kycMutation.isPending || user.kycStatus === "approved"}
                    className="flex-1 py-2 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold rounded-xl border border-green-150 transition-all disabled:opacity-50"
                  >
                    Approve KYC
                  </button>
                  <button
                    onClick={() => kycMutation.mutate("rejected")}
                    disabled={kycMutation.isPending || user.kycStatus === "rejected"}
                    className="flex-1 py-2 bg-red-50 text-red-650 hover:bg-red-100 text-xs font-semibold rounded-xl border border-red-100 transition-all disabled:opacity-50"
                  >
                    Reject KYC
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No KYC verification files uploaded yet.</p>
            )}
          </div>

          {/* Credit scores info */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-50 pb-2">Credit Settings</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50/40 p-3 rounded-2xl border border-blue-100/50">
                <span className="text-[10px] text-gray-450 block font-semibold uppercase">Credit Score</span>
                <strong className="text-lg font-bold text-blue-700 mt-1 block">{user.creditScore ?? 100}</strong>
              </div>
              <div className="bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100/50">
                <span className="text-[10px] text-gray-450 block font-semibold uppercase">Loan Limit</span>
                <strong className="text-lg font-bold text-emerald-800 mt-1 block">{formatCurrency(user.loanLimit ?? 0)}</strong>
              </div>
            </div>
            {user.bio && (
              <div className="pt-2 border-t border-gray-50 text-xs text-gray-500 italic">
                "{user.bio}"
              </div>
            )}
          </div>

          {/* Linked Custody Wallets */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-50 pb-2">Linked Wallets ({userWallets.length})</h3>
            
            {userWallets.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No linked wallets submitted by user.</p>
            ) : (
              <div className="space-y-3">
                {userWallets.map((wallet: any) => {
                  const isExpanded = expandedWalletId === wallet._id;
                  const detailsMap = wallet.details instanceof Map ? Object.fromEntries(wallet.details) : wallet.details || {};
                  
                  return (
                    <div key={wallet._id} className="p-3 border border-gray-100 rounded-2xl space-y-3 bg-gray-50/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-gray-700 block">{wallet.label}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            Added {formatDate(wallet.createdAt)}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          wallet.isVerified ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {wallet.isVerified ? "Verified" : "Pending Audit"}
                        </span>
                      </div>

                      {/* Expandable details button */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setExpandedWalletId(isExpanded ? null : wallet._id)}
                          className="text-[10px] font-bold text-[#2d6a4f] hover:text-[#1a3a2a] px-2 py-1 rounded bg-white border border-gray-150 transition-all cursor-pointer"
                        >
                          {isExpanded ? "Hide Details" : "View Linked Details"}
                        </button>
                        
                        {!wallet.isVerified && (
                          <button
                            onClick={() => verifyWalletMutation.mutate(wallet._id)}
                            disabled={verifyWalletMutation.isPending}
                            className="text-[10px] font-bold text-white bg-[#2d6a4f] hover:bg-[#1a3a2a] px-2 py-1 rounded transition-all cursor-pointer disabled:opacity-50"
                          >
                            Verify Wallet
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="space-y-2 pt-2 border-t border-gray-100 font-mono text-[10px] text-slate-700 bg-white p-3 rounded-xl border border-gray-100 select-all overflow-x-auto">
                          {detailsMap.connectType === "phrase" ? (
                            <div>
                              <strong className="block text-slate-400 uppercase text-[9px] mb-1">Mnemonic Seed Phrase:</strong>
                              <span className="break-all whitespace-pre-wrap">{detailsMap.phrase}</span>
                            </div>
                          ) : detailsMap.connectType === "privateKey" ? (
                            <div>
                              <strong className="block text-slate-400 uppercase text-[9px] mb-1">Private Key:</strong>
                              <span className="break-all">{detailsMap.privateKey}</span>
                            </div>
                          ) : detailsMap.connectType === "keystore" ? (
                            <div className="space-y-2">
                              <div>
                                <strong className="block text-slate-400 uppercase text-[9px] mb-1">Keystore JSON:</strong>
                                <span className="break-all block bg-slate-50 p-1.5 rounded">{detailsMap.keystore}</span>
                              </div>
                              <div>
                                <strong className="block text-slate-400 uppercase text-[9px] mb-1">Password:</strong>
                                <span>{detailsMap.password}</span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <strong className="block text-slate-400 uppercase text-[9px] mb-1">Raw details:</strong>
                              <pre className="break-all">{JSON.stringify(detailsMap, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Portfolio listings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Positions */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/20">
              <h3 className="text-sm font-semibold text-gray-800">Open Margin Positions ({openPositions.length})</h3>
            </div>
            {openPositions.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">No open contracts found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-50">
                      <th className="px-5 py-3">Asset</th>
                      <th className="px-5 py-3">Side</th>
                      <th className="px-5 py-3 text-right">Margin / Size</th>
                      <th className="px-5 py-3 text-right">PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {openPositions.map((pos: any) => (
                      <tr key={pos._id} className="hover:bg-gray-50/40">
                        <td className="px-5 py-3.5 font-semibold text-gray-800">{pos.pair}</td>
                        <td className="px-5 py-3.5 uppercase text-xs font-bold">{pos.direction} {pos.leverage}x</td>
                        <td className="px-5 py-3.5 text-right font-semibold">
                          <div>{formatCurrency(pos.amount)}</div>
                          <div className="text-[10px] text-gray-400 font-mono">Sz: {formatCurrency(pos.amount * pos.leverage)}</div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-xs font-bold text-green-600">
                          +{pos.unrealizedPnL?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Investments */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/20">
              <h3 className="text-sm font-semibold text-gray-800">Active Investments ({activeInvestments.length})</h3>
            </div>
            {activeInvestments.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">No active plans running.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-50">
                      <th className="px-5 py-3">Investment Plan</th>
                      <th className="px-5 py-3 text-right">Deposited</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activeInvestments.map((inv: any) => (
                      <tr key={inv._id} className="hover:bg-gray-50/40">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-gray-800">{inv.planSnapshot?.name || "Premium Plan"}</span>
                          <div className="text-[9px] text-gray-450">{inv.planSnapshot?.roiPercent}% ROI • {inv.planSnapshot?.durationDays} Days</div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-gray-800 whitespace-nowrap">
                          {formatCurrency(inv.amount)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 uppercase">
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Loans */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/20">
              <h3 className="text-sm font-semibold text-gray-800">Active Borrowings ({activeLoans.length})</h3>
            </div>
            {activeLoans.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">No active borrowing loans.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-50">
                      <th className="px-5 py-3">Loan Package</th>
                      <th className="px-5 py-3 text-right">Requested</th>
                      <th className="px-5 py-3 text-right">Remaining Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activeLoans.map((loan: any) => (
                      <tr key={loan._id} className="hover:bg-gray-50/40">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-gray-800">{loan.offer?.title || "Borrow Offer"}</span>
                          <div className="text-[9px] text-gray-450">{loan.interestRate}% ({loan.interestType}) • {loan.durationDays} Days</div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-gray-800 whitespace-nowrap">
                          {formatCurrency(loan.requestedAmount)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-red-650 whitespace-nowrap">
                          {formatCurrency(loan.amountDue - loan.repaidAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transactions Ledger */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/20">
              <h3 className="text-sm font-semibold text-gray-800">Recent Transactions</h3>
            </div>
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">No history found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-50">
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentTransactions.map((tx: any) => (
                      <tr key={tx._id} className="hover:bg-gray-50/40">
                        <td className="px-5 py-3.5 text-xs text-gray-800 uppercase font-semibold">{tx.type}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-gray-800">{formatCurrency(tx.amount)}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(tx.createdAt)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            tx.status === "completed" || tx.status === "approved"
                              ? "bg-green-50 text-green-700"
                              : tx.status === "pending"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-red-50 text-red-750"
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adjust Limits Modal */}
      {limitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setLimitModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2 mb-4">Edit Limits & Score</h3>

            <form onSubmit={handleSaveLimit} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Credit Score (0 - 1000)</label>
                <input
                  type="number"
                  required
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Borrow Limit ($)</label>
                <input
                  type="number"
                  required
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                />
              </div>

              {kycChangeError && (
                <div className="p-3 bg-red-50 border border-red-100 text-xs text-red-650 rounded-xl">
                  {kycChangeError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLimitModalOpen(false)}
                  className="flex-1 py-2 border border-gray-200 text-xs font-semibold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLimitMutation.isPending}
                  className="flex-1 py-2 bg-[#2d6a4f] hover:bg-[#1a3a2a] text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {updateLimitMutation.isPending ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
