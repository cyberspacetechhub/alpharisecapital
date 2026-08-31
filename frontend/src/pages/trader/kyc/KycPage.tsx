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
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h1 className="text-xl font-bold text-gray-800">KYC Verification</h1>
        <p className="text-xs text-gray-400 mt-1">
          Verify your identity to unlock advanced trading capabilities, withdrawals, and higher limits.
        </p>
      </div>

      {/* KYC Status Display */}
      {status === "approved" && (
        <div className="bg-white rounded-2xl border border-green-100 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-800">Identity Verified</h2>
            <p className="text-sm text-gray-500">
              Your KYC documents have been reviewed and approved. Your account is fully unlocked.
            </p>
          </div>
          {profile?.kycDocuments && profile.kycDocuments.length > 0 && (
            <div className="border-t border-gray-100 pt-4 text-left max-w-md mx-auto">
              <p className="text-xs font-semibold text-gray-400 mb-2">Verified Documents</p>
              <ul className="space-y-2">
                {profile.kycDocuments.map((doc: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-medium text-[#2d6a4f] hover:underline">
                    <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        <div className="bg-white rounded-2xl border border-yellow-100 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center mx-auto shadow-sm">
            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-800">Verification Pending Review</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Your KYC documents were submitted and are currently in the review queue. This process normally takes up to 24 hours.
            </p>
          </div>
          {profile?.kycDocuments && profile.kycDocuments.length > 0 && (
            <div className="border-t border-gray-100 pt-4 text-left max-w-md mx-auto">
              <p className="text-xs font-semibold text-gray-400 mb-2">Submitted Documents</p>
              <ul className="space-y-2">
                {profile.kycDocuments.map((doc: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-medium text-yellow-600 hover:underline">
                    <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          {status === "rejected" && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                Verification Rejected
              </div>
              <p className="text-xs text-red-600 leading-relaxed pl-7">
                Your previous verification request was rejected. This is usually due to blurry documents or invalid IDs. Please review the upload guidelines below and submit new, clear documents.
              </p>
            </div>
          )}

          {submitSuccess && (
            <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-xl text-xs font-semibold">
              {submitSuccess}
            </div>
          )}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-semibold">
              {submitError}
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-sm font-bold text-gray-800">Upload Verification Documents</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Please upload one or more clear files of either your **Passport, National ID Card, or Driver's License**. Ensure that all details like your name, date of birth, and photo are legible. Max size 10MB per file.
            </p>
          </div>

          {/* Drag & Drop upload container */}
          <div className="border-2 border-dashed border-gray-200 hover:border-[#2d6a4f] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#f0f7f4]/10 hover:bg-[#f0f7f4]/30 relative">
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              disabled={submitting}
            />
            <div className="w-12 h-12 rounded-xl bg-[#f0f7f4] text-[#2d6a4f] flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700">Click to upload files</p>
            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB each</p>
          </div>

          {/* List of uploaded documents */}
          {documents.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-gray-500">Document Upload Queue</h3>
              <ul className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                {documents.map((doc, i) => (
                  <li key={i} className="flex items-center justify-between p-3 bg-white text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {doc.loading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-[#2d6a4f]/20 border-t-[#2d6a4f] animate-spin shrink-0" />
                      ) : (
                        <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span className="font-medium text-gray-700 truncate">{doc.name}</span>
                    </div>
                    {!doc.loading && (
                      <button
                        onClick={() => handleRemoveDoc(i)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
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
            className="w-full py-3 rounded-xl bg-[#1a3a2a] text-white hover:bg-[#2d6a4f] text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit KYC Verification"}
          </button>
        </div>
      )}

    </div>
  );
}
