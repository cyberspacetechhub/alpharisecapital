import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../../api/auth.api";

interface ResetForm {
  newPassword: string;
  confirmPassword: string;
}

const passwordRules = [
  { id: "length",  label: "At least 8 characters",         test: (v: string) => v.length >= 8 },
  { id: "upper",   label: "One uppercase letter (A–Z)",     test: (v: string) => /[A-Z]/.test(v) },
  { id: "number",  label: "One number (0–9)",               test: (v: string) => /[0-9]/.test(v) },
  { id: "special", label: "One special character (!@#$…)",  test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
];

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetForm>({ mode: "onTouched" });

  const passwordValue = watch("newPassword") ?? "";
  const passedRules = passwordRules.filter((r) => r.test(passwordValue)).length;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passedRules];
  const strengthColor = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-[#2d6a4f]"][passedRules];

  const onSubmit = async (data: ResetForm) => {
    if (!token) return;
    setServerError("");
    setLoading(true);
    try {
      await authApi.resetPassword(token, data.newPassword);
      setSuccess(true);
    } catch (err: any) {
      setServerError(err?.response?.data?.message ?? "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent placeholder:text-gray-300 transition-colors ${
      hasError ? "border-red-300 bg-red-50" : "border-gray-200"
    }`;

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

          {/* No token in URL */}
          {!token && !success && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-5">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid reset link</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                This password reset link is missing or malformed. Please request a new one.
              </p>
              <Link
                to="/forgot-password"
                className="mt-6 inline-flex items-center justify-center w-full py-3 rounded-xl bg-[#1a3a2a] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-colors"
              >
                Request new link
              </Link>
            </div>
          )}

          {/* Success state */}
          {success && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-5">
                <svg className="w-8 h-8 text-[#2d6a4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Password reset!</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate("/login", { replace: true })}
                className="mt-6 w-full py-3 rounded-xl bg-[#1a3a2a] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-colors"
              >
                Continue to sign in
              </button>
            </div>
          )}

          {/* Reset form */}
          {token && !success && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Set a new password</h2>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Choose a strong password you haven't used before. This link can only be used once.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-5">

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      New password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        {...register("newPassword", {
                          required: "Password is required",
                          minLength: { value: 8, message: "At least 8 characters" },
                          validate: {
                            hasUpper:   (v) => /[A-Z]/.test(v)        || "Must contain at least one uppercase letter",
                            hasNumber:  (v) => /[0-9]/.test(v)        || "Must contain at least one number",
                            hasSpecial: (v) => /[^a-zA-Z0-9]/.test(v) || "Must contain at least one special character",
                          },
                        })}
                        type={showNew ? "text" : "password"}
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        className={`${inputClass(!!errors.newPassword)} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a3a2a] transition-colors"
                        tabIndex={-1}
                      >
                        <EyeIcon open={showNew} />
                      </button>
                    </div>

                    {/* Strength bar */}
                    {passwordValue.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                i <= passedRules ? strengthColor : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        {strengthLabel && (
                          <p className={`text-xs font-medium ${
                            passedRules === 4 ? "text-[#2d6a4f]" :
                            passedRules === 3 ? "text-yellow-600" :
                            passedRules === 2 ? "text-orange-500" : "text-red-500"
                          }`}>
                            {strengthLabel} password
                          </p>
                        )}
                      </div>
                    )}

                    {/* Rule checklist */}
                    <ul className="mt-2 space-y-1">
                      {passwordRules.map((rule) => {
                        const passed = rule.test(passwordValue);
                        return (
                          <li key={rule.id} className="flex items-center gap-2">
                            <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                              passed ? "bg-[#2d6a4f]" : "bg-gray-200"
                            }`}>
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                            <span className={`text-xs transition-colors ${passed ? "text-[#2d6a4f]" : "text-gray-400"}`}>
                              {rule.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    {errors.newPassword && (
                      <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Confirm new password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        {...register("confirmPassword", {
                          required: "Please confirm your password",
                          validate: (v) => v === watch("newPassword") || "Passwords do not match",
                        })}
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter your new password"
                        autoComplete="new-password"
                        className={`${inputClass(!!errors.confirmPassword)} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a3a2a] transition-colors"
                        tabIndex={-1}
                      >
                        <EyeIcon open={showConfirm} />
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                {serverError && (
                  <div className="mt-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <div>
                      <p className="text-xs text-red-600">{serverError}</p>
                      <Link to="/forgot-password" className="text-xs text-red-500 font-semibold underline mt-1 inline-block">
                        Request a new reset link
                      </Link>
                    </div>
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
                  {loading ? "Resetting password…" : "Reset password"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-[#2d6a4f] font-semibold hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
