import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { authApi } from "../../api/auth.api";

type State = "awaiting" | "verifying" | "success" | "error";

const BrandHeader = () => (
  <div className="text-center mb-8">
    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1a3a2a] mb-4 shadow-lg">
      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    </div>
    <h1 className="text-2xl font-bold text-[#1a3a2a]">Crest Capital Assets</h1>
  </div>
);

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const token = searchParams.get("token");
  const emailFromState = (location.state as { email?: string } | null)?.email;

  const [state, setState] = useState<State>(token ? "verifying" : "awaiting");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    authApi
      .verifyEmail(token)
      .then(() => setState("success"))
      .catch((err: any) => {
        setErrorMsg(err?.response?.data?.message ?? "This verification link is invalid or has expired.");
        setState("error");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#f0f7f4] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <BrandHeader />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">

          {/* Awaiting — user just registered, no token in URL yet */}
          {state === "awaiting" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#f0f7f4] mb-5">
                <svg className="w-8 h-8 text-[#2d6a4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                We've sent a verification link to{" "}
                {emailFromState
                  ? <span className="font-semibold text-gray-700">{emailFromState}</span>
                  : "your email address"
                }.
              </p>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Click the link in the email to activate your account. The link expires in <span className="font-medium text-gray-700">24 hours</span>.
              </p>
              <div className="mt-6 p-4 rounded-xl bg-[#f0f7f4] text-left">
                <p className="text-xs font-semibold text-[#1a3a2a] mb-2">Didn't receive the email?</p>
                <ul className="space-y-1.5 text-xs text-gray-500">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#2d6a4f]">•</span>
                    Check your spam or junk folder
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#2d6a4f]">•</span>
                    Make sure you entered the correct email address
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#2d6a4f]">•</span>
                    Allow a few minutes for delivery
                  </li>
                </ul>
              </div>
              <Link
                to="/login"
                className="mt-6 inline-block text-sm text-[#2d6a4f] font-semibold hover:underline"
              >
                Back to sign in
              </Link>
            </>
          )}

          {/* Verifying — token found, request in flight */}
          {state === "verifying" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#f0f7f4] mb-5">
                <svg className="w-8 h-8 text-[#2d6a4f] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Verifying your email…</h2>
              <p className="text-sm text-gray-500">Please wait while we confirm your email address.</p>
            </>
          )}

          {/* Success */}
          {state === "success" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-5">
                <svg className="w-8 h-8 text-[#2d6a4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Email verified!</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your email address has been successfully verified. Your account is now fully active.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center justify-center w-full py-3 rounded-xl bg-[#1a3a2a] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-colors"
              >
                Continue to sign in
              </Link>
            </>
          )}

          {/* Error — invalid or expired token */}
          {state === "error" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-5">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Verification failed</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{errorMsg}</p>
              <div className="mt-6 space-y-3">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-[#1a3a2a] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-colors"
                >
                  Register again
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back to sign in
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
