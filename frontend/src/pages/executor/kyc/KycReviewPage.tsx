import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "../../../api/user.api";
import PageLoader from "../../../components/common/PageLoader";

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
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">KYC Verification Reviews</h1>
          <p className="text-xs text-gray-400 mt-1">
            Review submitted identity verification documents and approve or reject client accounts.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
          {users.length} Pending Review{users.length !== 1 ? "s" : ""}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-xl text-xs font-semibold">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Pending List */}
      {users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-gray-800">All caught up!</h2>
            <p className="text-xs text-gray-400">There are no pending KYC submissions to review at this time.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((trader) => (
            <div key={trader._id} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row gap-6 items-stretch">
              
              {/* User details */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f0f7f4] flex items-center justify-center text-sm font-bold text-[#1a3a2a] uppercase">
                    {trader.username.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">{trader.fullName || "Unnamed User"}</h3>
                    <p className="text-xs text-gray-400">@{trader.username} · {trader.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-4 text-xs">
                  <div>
                    <span className="text-gray-400 block">Submitted At</span>
                    <span className="font-semibold text-gray-700">
                      {trader.createdAt ? new Date(trader.createdAt).toLocaleString() : "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Total Documents</span>
                    <span className="font-semibold text-gray-700">{trader.kycDocuments?.length || 0} file(s)</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 space-y-2">
                <h4 className="text-xs font-bold text-gray-400">Documents</h4>
                {trader.kycDocuments && trader.kycDocuments.length > 0 ? (
                  <ul className="space-y-1.5">
                    {trader.kycDocuments.map((doc, i) => (
                      <li key={i}>
                        <a
                          href={doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-medium text-[#2d6a4f] hover:underline"
                        >
                          <svg className="w-4 h-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Document #{i + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-red-500 font-medium">No documents uploaded.</p>
                )}
              </div>

              {/* Actions */}
              <div className="w-full md:w-1/4 flex md:flex-col justify-end md:justify-center gap-2.5 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                <button
                  onClick={() => handleUpdateStatus(trader._id, "approved")}
                  disabled={actionLoadingId !== null}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors text-center disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {actionLoadingId === trader._id ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  ) : null}
                  Approve
                </button>
                <button
                  onClick={() => handleUpdateStatus(trader._id, "rejected")}
                  disabled={actionLoadingId !== null}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-colors text-center disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {actionLoadingId === trader._id ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-red-200 border-t-red-600 animate-spin" />
                  ) : null}
                  Reject
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
