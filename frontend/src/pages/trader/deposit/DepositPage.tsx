import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { depositMethodApi } from "../../../api/methods.api";
import { transactionApi } from "../../../api/transaction.api";
import { formatCurrency } from "../../../utils";
import type { DepositMethod } from "../../../types";

interface DepositForm {
  amount: number;
  proofUrl: string;
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-[#f0f7f4] text-[#2d6a4f] font-semibold hover:bg-[#e0f0e8] transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
};

export default function DepositPage() {
  const qc = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [success, setSuccess] = useState<{ reference: string; amount: number } | null>(null);
  const [serverError, setServerError] = useState("");

  const { data, isLoading } = useQuery<DepositMethod[]>({
    queryKey: ["deposit-methods-active"],
    queryFn: () => depositMethodApi.getActive().then((r) => r.data.data),
  });

  const methods = data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DepositForm>();

  const depositMutation = useMutation({
    mutationFn: (payload: { amount: number; methodId: string; proofUrl?: string }) =>
      transactionApi.deposit(payload),
    onSuccess: (res, vars) => {
      setSuccess({ reference: res.data.data.reference, amount: vars.amount });
      qc.invalidateQueries({ queryKey: ["my-transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => setServerError(e?.response?.data?.message ?? "Deposit request failed. Please try again."),
  });

  const onSubmit = (data: DepositForm) => {
    if (!selectedMethod) return;
    setServerError("");
    depositMutation.mutate({
      amount: Number(data.amount),
      methodId: selectedMethod._id,
      ...(data.proofUrl ? { proofUrl: data.proofUrl } : {}),
    });
  };

  const handleSelectMethod = (m: DepositMethod) => {
    setSelectedMethod(m);
    setStep(2);
    reset();
    setServerError("");
  };

  const handleReset = () => {
    setSelectedMethod(null);
    setStep(1);
    setSuccess(null);
    setServerError("");
    reset();
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-5">
            <svg className="w-8 h-8 text-[#2d6a4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Deposit Submitted!</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your deposit of <span className="font-semibold text-gray-700">{formatCurrency(success.amount)}</span> has been submitted and is pending review.
          </p>
          <div className="mt-4 px-4 py-3 rounded-xl bg-[#f0f7f4] text-left">
            <p className="text-xs text-gray-500">Reference</p>
            <p className="text-sm font-mono font-semibold text-[#1a3a2a] mt-0.5">{success.reference}</p>
          </div>
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            Your balance will be credited once an administrator approves your deposit. You will receive an email notification.
          </p>
          <button
            onClick={handleReset}
            className="mt-6 w-full py-3 rounded-xl bg-[#1a3a2a] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-colors"
          >
            Make Another Deposit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-lg font-bold text-gray-800">Deposit Funds</h1>
        <p className="text-xs text-gray-400 mt-0.5">Choose a payment method and submit your deposit for review.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {[
          { n: 1, label: "Select Method" },
          { n: 2, label: "Enter Amount" },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step >= n ? "bg-[#1a3a2a] text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {step > n ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : n}
              </div>
              <span className={`text-xs font-medium ${step >= n ? "text-[#1a3a2a]" : "text-gray-400"}`}>{label}</span>
            </div>
            {i === 0 && <div className={`flex-1 h-px w-8 ${step > 1 ? "bg-[#1a3a2a]" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Method selection */}
      {step === 1 && (
        <div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-2xl" />)}
            </div>
          ) : methods.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 px-6 py-16 text-center">
              <p className="text-sm text-gray-400">No deposit methods are currently available. Please check back later.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {methods.map((m) => (
                <button
                  key={m._id}
                  onClick={() => handleSelectMethod(m)}
                  className="w-full bg-white rounded-2xl border-2 border-gray-100 hover:border-[#2d6a4f] p-5 text-left transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      m.type === "crypto" ? "bg-orange-50" : "bg-blue-50"
                    }`}>
                      <svg className={`w-5 h-5 ${m.type === "crypto" ? "text-orange-500" : "text-blue-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        {m.type === "crypto"
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          : <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        }
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{m.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          m.type === "crypto" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                        }`}>
                          {m.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {Object.keys(m.details).join(" · ")}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-[#2d6a4f] transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Amount + proof */}
      {step === 2 && selectedMethod && (
        <div className="space-y-4">
          {/* Method details card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  selectedMethod.type === "crypto" ? "bg-orange-50" : "bg-blue-50"
                }`}>
                  <svg className={`w-4 h-4 ${selectedMethod.type === "crypto" ? "text-orange-500" : "text-blue-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    {selectedMethod.type === "crypto"
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      : <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    }
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800">{selectedMethod.name}</p>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-[#2d6a4f] font-semibold hover:underline">
                Change
              </button>
            </div>

            <p className="text-xs font-semibold text-gray-500 mb-3">
              Send your funds to the details below, then fill in the form.
            </p>

            <div className="space-y-2">
              {Object.entries(selectedMethod.details).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-[#f0f7f4]">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-600">{k}</p>
                    <p className="text-xs font-mono text-gray-800 break-all mt-0.5">{v}</p>
                  </div>
                  <CopyButton text={v} />
                </div>
              ))}
            </div>
          </div>

          {/* Deposit form */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Deposit Details</h3>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Amount (USD) <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...register("amount", {
                      required: "Amount is required",
                      min: { value: 1, message: "Minimum deposit is $1" },
                      valueAsNumber: true,
                    })}
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                  />
                  {errors.amount
                    ? <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>
                    : <p className="text-xs text-gray-400 mt-1">Enter the exact USD equivalent of what you are sending.</p>
                  }
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Proof of payment URL <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    {...register("proofUrl", {
                      pattern: { value: /^https?:\/\/.+/, message: "Must be a valid URL starting with http(s)://" },
                    })}
                    type="url"
                    placeholder="https://link-to-screenshot-or-receipt.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                  />
                  {errors.proofUrl
                    ? <p className="text-xs text-red-500 mt-1">{errors.proofUrl.message}</p>
                    : <p className="text-xs text-gray-400 mt-1">Upload your receipt to an image host and paste the link here to speed up approval.</p>
                  }
                </div>
              </div>

              {serverError && (
                <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-xs text-red-600">{serverError}</p>
                </div>
              )}

              <div className="mt-5 p-4 rounded-xl bg-yellow-50 border border-yellow-100">
                <p className="text-xs text-yellow-700 leading-relaxed">
                  <span className="font-semibold">Important:</span> Only submit after you have sent the funds. Deposits are manually reviewed and credited within 24 hours.
                </p>
              </div>

              <button
                type="submit"
                disabled={depositMutation.isPending}
                className="mt-5 w-full py-3 rounded-xl bg-[#1a3a2a] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {depositMutation.isPending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {depositMutation.isPending ? "Submitting…" : "Submit Deposit Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
