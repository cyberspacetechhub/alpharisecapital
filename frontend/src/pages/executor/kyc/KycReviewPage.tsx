import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "../../../api/user.api";
import PageLoader from "../../../components/common/PageLoader";
import Pagination from "../../../components/common/Pagination";

interface TraderUser {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  kycStatus: string;
  kycDocuments: string[];
  createdAt: string;
}

export default function KycReviewPage() {
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { data: responseData, isLoading, refetch } = useQuery({
    queryKey: ["pending-kyc"],
    queryFn: () => userApi.getAllTraders({ kycStatus: "pending" }).then((r) => r.data),
  });

  if (isLoading) {
    return <PageLoader />;
  }

  const handleUpdateStatus = async (userId: string, status: "approved" | "rejected") => {
    setActionLoadingId(userId);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await userApi.updateKycStatus(userId, status);
      setSuccessMsg(`KYC successfully ${status === "approved" ? "approved" : "rejected"}!`);
      refetch();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Failed to update KYC status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const users: TraderUser[] = responseData?.users ?? [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-[#121822] rounded-3xl border border-white/10 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-white">KYC Verification Reviews</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review submitted identity verification documents and approve or reject client accounts.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          {users.length} Pending Review{users.length !== 1 ? "s" : ""}
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-[#00e676] rounded-2xl text-xs font-bold shadow-sm">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-2xl text-xs font-bold shadow-sm">
          ✕ {errorMsg}
        </div>
      )}

      {/* Pending List */}
      {users.length === 0 ? (
        <div className="bg-[#121822] rounded-3xl border border-white/10 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mx-auto border border-white/10">
            <svg className="w-6 h-6 text-[#00c076]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">All caught up!</h2>
            <p className="text-xs text-slate-400">There are no pending KYC submissions to review at this time.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {users.slice((page - 1) * pageSize, page * pageSize).map((trader) => (
            <div key={trader._id} className="bg-[#121822] rounded-3xl border border-white/10 p-6 flex flex-col md:flex-row gap-6 items-stretch shadow-sm">
              
              {/* User details */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#00c076]/20 border border-[#00c076]/30 flex items-center justify-center text-sm font-black text-[#00e676] uppercase">
                    {trader.username.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{trader.fullName || trader.username}</h3>
                    <p className="text-xs text-slate-400 font-mono">@{trader.username} · {trader.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Submitted At</span>
                    <span className="font-bold text-slate-200">
                      {trader.createdAt ? new Date(trader.createdAt).toLocaleString() : "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Total Documents</span>
                    <span className="font-bold text-slate-200">{trader.kycDocuments?.length || 0} file(s)</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Documents</h4>
                {trader.kycDocuments && trader.kycDocuments.length > 0 ? (
                  <ul className="space-y-2">
                    {trader.kycDocuments.map((doc, i) => (
                      <li key={i}>
                        <a
                          href={doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-bold text-[#00e676] hover:underline bg-[#0e1520] p-2.5 rounded-xl border border-white/10 transition-colors"
                        >
                          <svg className="w-4 h-4 shrink-0 text-[#00c076]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Document #{i + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-rose-400 font-medium">No documents uploaded.</p>
                )}
              </div>

              {/* Actions */}
              <div className="w-full md:w-1/4 flex md:flex-col justify-end md:justify-center gap-2.5 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                <button
                  onClick={() => handleUpdateStatus(trader._id, "approved")}
                  disabled={actionLoadingId !== null}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black transition-all text-center disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-[#00c076]/20 cursor-pointer"
                >
                  {actionLoadingId === trader._id ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
                  ) : null}
                  Approve
                </button>
                <button
                  onClick={() => handleUpdateStatus(trader._id, "rejected")}
                  disabled={actionLoadingId !== null}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-bold transition-colors text-center disabled:opacity-60 flex items-center justify-center gap-2 border border-rose-500/30 cursor-pointer"
                >
                  {actionLoadingId === trader._id ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
                  ) : null}
                  Reject
                </button>
              </div>

            </div>
          ))}

          {/* Pagination */}
          <div className="bg-[#121822] rounded-2xl border border-white/10 overflow-hidden">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(users.length / pageSize) || 1}
              totalItems={users.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
