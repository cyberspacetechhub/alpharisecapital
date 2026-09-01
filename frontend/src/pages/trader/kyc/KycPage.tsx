import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "../../../api/user.api";
import PageLoader from "../../../components/common/PageLoader";

interface UploadedDoc {
  name: string;
  url: string | null;
  loading: boolean;
}

export default function KycPage() {
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: () => userApi.getMe().then((r) => r.data.data),
  });

  if (isLoading) {
    return <PageLoader />;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Process files
    Array.from(files).forEach(async (file) => {
      // Add to list with loading state
      const newDoc: UploadedDoc = { name: file.name, url: null, loading: true };
      setDocuments((prev) => [...prev, newDoc]);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await userApi.uploadFile(formData);
        // update with url
        setDocuments((prev) =>
          prev.map((d) => (d.name === file.name && d.loading ? { ...d, url: res.data.url, loading: false } : d))
        );
      } catch (err: any) {
        setSubmitError("Failed to upload document: " + file.name);
        // remove failed file from list
        setDocuments((prev) => prev.filter((d) => !(d.name === file.name && d.loading)));
      }
    });
  };

  const handleRemoveDoc = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitKyc = async () => {
    const urls = documents.filter((d) => d.url).map((d) => d.url!);
    if (urls.length === 0) {
      setSubmitError("Please upload at least one document.");
      return;
    }

    setSubmitting(true);
    setSubmitSuccess("");
    setSubmitError("");
    try {
      await userApi.submitKyc({ documents: urls });
      setSubmitSuccess("KYC documents submitted successfully!");
      setDocuments([]);
      refetch();
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || "Failed to submit KYC.");
    } finally {
      setSubmitting(false);
    }
  };

  const status = profile?.kycStatus || "none";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="bg-[#121822] rounded-3xl border border-white/10 p-6 text-white">
        <h1 className="text-xl font-bold text-white">KYC Verification</h1>
        <p className="text-xs text-slate-400 mt-1">
          Verify your identity to unlock institutional liquidity pools, higher leverage margins, and unlimited withdrawals.
        </p>
      </div>

      {/* KYC Status Display */}
      {status === "approved" && (
        <div className="bg-[#121822] rounded-3xl border border-emerald-500/30 p-8 text-center space-y-4 text-white shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[#00e676] flex items-center justify-center mx-auto shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Identity Verified</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your KYC identity credentials have been verified and approved. Your trading profile is fully unlocked.
            </p>
          </div>
          {profile?.kycDocuments && profile.kycDocuments.length > 0 && (
            <div className="border-t border-white/10 pt-4 text-left max-w-md mx-auto">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Verified Credentials</p>
              <ul className="space-y-2">
                {profile.kycDocuments.map((doc: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-bold text-[#00e676] hover:underline">
                    <svg className="w-4 h-4 text-[#00e676] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <a href={doc} target="_blank" rel="noopener noreferrer">Verified Document #{i + 1}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {status === "pending" && (
        <div className="bg-[#121822] rounded-3xl border border-amber-500/30 p-8 text-center space-y-4 text-white shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center mx-auto shadow-sm">
            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Verification Pending Review</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your KYC documents were submitted and are currently in the executor audit queue.
            </p>
          </div>
          {profile?.kycDocuments && profile.kycDocuments.length > 0 && (
            <div className="border-t border-white/10 pt-4 text-left max-w-md mx-auto">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Submitted Documents</p>
              <ul className="space-y-2">
                {profile.kycDocuments.map((doc: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-bold text-amber-300 hover:underline">
                    <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <a href={doc} target="_blank" rel="noopener noreferrer">Submitted Document #{i + 1}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {(status === "none" || status === "rejected") && (
        <div className="bg-[#121822] rounded-3xl border border-white/10 p-6 space-y-6 text-white">
          {status === "rejected" && (
            <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl space-y-1 text-xs text-rose-300">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                Verification Rejected
              </div>
              <p className="leading-relaxed pl-7 text-slate-300">
                Your previous verification was rejected. Please ensure documents are high-resolution with all four corners visible and resubmit.
              </p>
            </div>
          )}

          {submitSuccess && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-[#00e676] rounded-2xl text-xs font-bold">
              ✓ {submitSuccess}
            </div>
          )}
          {submitError && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-2xl text-xs font-bold">
              ✕ {submitError}
            </div>
          )}

          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">Upload Identification Documents</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload clear photos or scans of your **Passport, National ID Card, or Driver's License**. Maximum 10MB per file.
            </p>
          </div>

          {/* Drag & Drop upload container */}
          <div className="border-2 border-dashed border-white/10 hover:border-[#00c076] rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#0e1520] hover:bg-[#0e1520]/80 relative">
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              disabled={submitting}
            />
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-[#00c076] flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-bold text-white">Click or drag files to upload</p>
            <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG up to 10MB each</p>
          </div>

          {/* List of uploaded documents */}
          {documents.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase">Upload Queue</h3>
              <ul className="divide-y divide-white/5 border border-white/10 rounded-2xl overflow-hidden bg-[#0e1520]">
                {documents.map((doc, i) => (
                  <li key={i} className="flex items-center justify-between p-3.5 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {doc.loading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-[#00c076]/20 border-t-[#00c076] animate-spin shrink-0" />
                      ) : (
                        <svg className="w-4 h-4 text-[#00e676] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span className="font-mono text-slate-200 truncate">{doc.name}</span>
                    </div>
                    {!doc.loading && (
                      <button
                        onClick={() => handleRemoveDoc(i)}
                        className="text-rose-400 hover:text-rose-300 transition-colors p-1 cursor-pointer"
                        type="button"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleSubmitKyc}
            disabled={submitting || documents.length === 0 || documents.some((d) => d.loading)}
            className="w-full py-3.5 rounded-xl bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black shadow-md shadow-[#00c076]/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Submitting Documents..." : "Submit KYC Verification"}
          </button>
        </div>
      )}

    </div>
  );
}
