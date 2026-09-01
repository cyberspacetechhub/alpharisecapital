import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { authApi } from "../../api/auth.api";

interface ForgotForm {
  email: string;
}

const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({ mode: "onTouched" });

  const onSubmit = async (data: ForgotForm) => {
    setServerError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setSent(true);
    } catch (err: any) {
      setServerError(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f7f4] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <img
            src="/branding/arglogo.jpeg"
            alt="Alpha Rise Global"
            className="w-16 h-16 object-contain rounded-2xl mb-4 mx-auto shadow-lg shadow-[#00c076]/20"
          />
          <h1 className="text-2xl font-bold text-[#1a3a2a]">Alpha Rise Global</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {!sent ? (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Forgot your password?</h2>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  No worries. Enter the email address linked to your account and we'll send you a secure reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Email address <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...register("email", {
                      required: "Email address is required",
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" },
                    })}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent placeholder:text-gray-300 transition-colors ${
                      errors.email ? "border-red-300 bg-red-50" : "border-gray-200"
                    }`}
                  />
                  {errors.email
                    ? <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                    : <p className="text-xs text-gray-400 mt-1">Must match the email you registered with.</p>
                  }
                </div>

                {serverError && (
                  <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <p className="text-xs text-red-600">{serverError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full py-3 rounded-xl bg-[#1a3a2a] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {loading ? "Sending reset link…" : "Send reset link"}
                </button>
              </form>
            </>
          ) : (
            /* Sent confirmation state */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#f0f7f4] mb-5">
                <svg className="w-8 h-8 text-[#2d6a4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                If an account exists for{" "}
                <span className="font-semibold text-gray-700">{submittedEmail}</span>,
                a password reset link has been sent. The link expires in{" "}
                <span className="font-medium text-gray-700">1 hour</span>.
              </p>

              <div className="mt-5 p-4 rounded-xl bg-[#f0f7f4] text-left">
                <p className="text-xs font-semibold text-[#1a3a2a] mb-2">Didn't receive it?</p>
                <ul className="space-y-1.5 text-xs text-gray-500">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#2d6a4f]">•</span>
                    Check your spam or junk folder
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#2d6a4f]">•</span>
                    Allow a few minutes for delivery
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#2d6a4f]">•</span>
                    Make sure you used the correct email address
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setSent(false)}
                className="mt-5 text-sm text-[#2d6a4f] font-semibold hover:underline"
              >
                Try a different email
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Remembered your password?{" "}
          <Link to="/login" className="text-[#2d6a4f] font-semibold hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
