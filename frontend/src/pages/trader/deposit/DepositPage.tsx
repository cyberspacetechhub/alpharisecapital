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
      className="shrink-0 text-xs px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#00e676] font-bold transition-colors cursor-pointer"
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
        <div className="bg-[#121822] rounded-3xl border border-white/10 p-8 text-center text-white shadow-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 mb-5">
            <svg className="w-8 h-8 text-[#00e676]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Deposit Submitted!</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your deposit of <span className="font-bold text-white font-mono">{formatCurrency(success.amount)}</span> has been submitted and is pending verification.
          </p>
          <div className="mt-4 px-4 py-3.5 rounded-2xl bg-[#0e1520] border border-white/10 text-left">
            <p className="text-[10px] uppercase font-bold text-slate-400">Transaction Reference</p>
            <p className="text-xs font-mono font-bold text-[#00c076] mt-0.5">{success.reference}</p>
          </div>
          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            Your balance will be credited immediately once an executor confirms your payment.
          </p>
          <button
            onClick={handleReset}
            className="mt-6 w-full py-3.5 rounded-xl bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black shadow-md shadow-[#00c076]/20 transition-all cursor-pointer"
          >
            Make Another Deposit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-white">Deposit Funds</h1>
        <p className="text-xs text-slate-400 mt-0.5">Select a payment gateway and fund your compounding account.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {[
          { n: 1, label: "Select Gateway" },
          { n: 2, label: "Transfer & Confirm" },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step >= n ? "bg-[#00c076] text-[#080c10]" : "bg-white/10 text-slate-400"
              }`}>
                {step > n ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : n}
              </div>
              <span className={`text-xs font-bold ${step >= n ? "text-[#00e676]" : "text-slate-500"}`}>{label}</span>
            </div>
            {i === 0 && <div className={`flex-1 h-0.5 w-12 ${step > 1 ? "bg-[#00c076]" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Method selection */}
      {step === 1 && (
        <div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white/5 animate-pulse rounded-3xl border border-white/5" />
              ))}
            </div>
          ) : methods.length === 0 ? (
            <div className="bg-[#121822] rounded-3xl border border-white/10 px-6 py-16 text-center text-slate-500 text-xs">
              <p>No deposit methods are currently configured. Please contact support.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {methods.map((m) => (
                <button
                  key={m._id}
                  onClick={() => handleSelectMethod(m)}
                  className="w-full bg-[#121822] rounded-3xl border border-white/10 hover:border-[#00c076]/50 p-5 text-left transition-all group cursor-pointer text-white"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      m.type === "crypto" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    }`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        {m.type === "crypto"
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          : <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        }
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">{m.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          m.type === "crypto" ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" : "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                        }`}>
                          {m.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        {Object.keys(m.details).join(" · ")}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-slate-500 group-hover:text-[#00c076] transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          <div className="bg-[#121822] rounded-3xl border border-white/10 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  selectedMethod.type === "crypto" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"
                }`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    {selectedMethod.type === "crypto"
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      : <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    }
                  </svg>
                </div>
                <p className="text-sm font-bold text-white">{selectedMethod.name}</p>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-[#00e676] font-bold hover:underline cursor-pointer">
                Change Gateway
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3 font-medium">
              Send your funds to the account details below, then enter your submitted amount:
            </p>

            <div className="space-y-2">
              {Object.entries(selectedMethod.details).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#0e1520] border border-white/10">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-slate-400">{k}</p>
                    <p className="text-xs font-mono font-bold text-white break-all mt-0.5">{v}</p>
                  </div>
                  <CopyButton text={v} />
                </div>
              ))}
            </div>
          </div>

          {/* Deposit form */}
          <div className="bg-[#121822] rounded-3xl border border-white/10 p-6 text-white">
            <h3 className="text-sm font-bold text-white mb-4">Deposit Details</h3>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                    Amount (USD) <span className="text-rose-400">*</span>
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
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                  />
                  {errors.amount
                    ? <p className="text-xs text-rose-400 mt-1">{errors.amount.message}</p>
                    : <p className="text-[10px] text-slate-500 mt-1">Enter the exact USD equivalent of your transfer.</p>
                  }
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                    Proof of payment URL <span className="text-slate-500 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    {...register("proofUrl", {
                      pattern: { value: /^https?:\/\/.+/, message: "Must be a valid URL starting with http(s)://" },
                    })}
                    type="url"
                    placeholder="https://imgur.com/your-receipt.png"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                  />
                  {errors.proofUrl
                    ? <p className="text-xs text-rose-400 mt-1">{errors.proofUrl.message}</p>
                    : <p className="text-[10px] text-slate-500 mt-1">Paste a screenshot or transaction hash link to accelerate review.</p>
                  }
                </div>
              </div>

              {serverError && (
                <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p>{serverError}</p>
                </div>
              )}

              <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                <p className="leading-relaxed">
                  <span className="font-bold">Important Notice:</span> Only submit after you have executed the blockchain/wire transfer. Deposits are verified securely by our settlement team.
                </p>
              </div>

              <button
                type="submit"
                disabled={depositMutation.isPending}
                className="mt-5 w-full py-3.5 rounded-xl bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black shadow-md shadow-[#00c076]/20 transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {depositMutation.isPending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {depositMutation.isPending ? "Submitting Request…" : "Confirm & Submit Deposit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
