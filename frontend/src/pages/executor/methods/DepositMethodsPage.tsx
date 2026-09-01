import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { depositMethodApi } from "../../../api/methods.api";
import type { DepositMethod } from "../../../types";

interface MethodForm {
  name: string;
  type: "crypto" | "bank";
  details: { key: string; value: string }[];
  isActive: boolean;
}

const defaultValues: MethodForm = {
  name: "",
  type: "crypto",
  details: [{ key: "", value: "" }],
  isActive: true,
};

const Modal = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-[#121822] border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]";

export default function DepositMethodsPage() {
  const qc = useQueryClient();
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<DepositMethod | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepositMethod | null>(null);
  const [serverError, setServerError] = useState("");

  const { data, isLoading } = useQuery<DepositMethod[]>({
    queryKey: ["deposit-methods-all"],
    queryFn: () => depositMethodApi.getAll().then((r) => r.data.data),
  });

  const methods = data ?? [];

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<MethodForm>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "details" });

  const openCreate = () => {
    reset(defaultValues);
    setEditing(null);
    setServerError("");
    setModalMode("create");
  };

  const openEdit = (m: DepositMethod) => {
    const details = Object.entries(m.details).map(([key, value]) => ({ key, value }));
    reset({ name: m.name, type: m.type, details: details.length ? details : [{ key: "", value: "" }], isActive: m.isActive });
    setEditing(m);
    setServerError("");
    setModalMode("edit");
  };

  const buildPayload = (data: MethodForm) => ({
    name: data.name,
    type: data.type,
    details: Object.fromEntries(data.details.filter((d) => d.key.trim()).map((d) => [d.key.trim(), d.value.trim()])),
    isActive: data.isActive,
  });

  const createMutation = useMutation({
    mutationFn: (data: MethodForm) => depositMethodApi.create(buildPayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["deposit-methods-all"] }); setModalMode(null); },
    onError: (e: any) => setServerError(e?.response?.data?.message ?? "Failed to create method"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: MethodForm) => depositMethodApi.update(editing!._id, buildPayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["deposit-methods-all"] }); setModalMode(null); },
    onError: (e: any) => setServerError(e?.response?.data?.message ?? "Failed to update method"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => depositMethodApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deposit-methods-all"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => depositMethodApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["deposit-methods-all"] }); setDeleteTarget(null); },
  });

  const onSubmit = (data: MethodForm) => {
    setServerError("");
    modalMode === "create" ? createMutation.mutate(data) : updateMutation.mutate(data);
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Deposit Methods</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage payment methods available to traders for deposits.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00c076] text-[#080c10] text-xs font-black hover:bg-[#00e676] transition-all shadow-md shadow-[#00c076]/20 cursor-pointer shrink-0 w-fit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Method
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/5 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : methods.length === 0 ? (
        <div className="bg-[#121822] rounded-3xl border border-white/10 px-6 py-16 text-center">
          <p className="text-xs text-slate-500">No deposit methods yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <div key={m._id} className="bg-[#121822] rounded-3xl border border-white/10 p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    m.type === "crypto" ? "bg-amber-500/15 border border-amber-500/30" : "bg-blue-500/15 border border-blue-500/30"
                  }`}>
                    <svg className={`w-5 h-5 ${m.type === "crypto" ? "text-amber-400" : "text-blue-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {m.type === "crypto"
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      }
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-white truncate">{m.name}</p>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        m.type === "crypto" ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      }`}>
                        {m.type}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        m.isActive ? "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30" : "bg-white/5 text-slate-400 border border-white/10"
                      }`}>
                        {m.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 bg-[#0e1520] p-2.5 rounded-xl border border-white/5">
                      {Object.entries(m.details).map(([k, v]) => (
                        <div key={k} className="text-xs text-slate-400 min-w-0 max-w-full">
                          <span className="font-bold text-slate-300">{k}:</span>{" "}
                          <span className="font-mono text-white break-all">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-0 border-white/5 shrink-0">
                  <button
                    onClick={() => toggleMutation.mutate(m._id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      m.isActive
                        ? "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10"
                        : "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30 hover:bg-emerald-500/25"
                    }`}
                  >
                    {m.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => openEdit(m)}
                    className="text-xs px-3 py-1.5 rounded-xl font-bold bg-[#00c076]/15 text-[#00e676] border border-[#00c076]/30 hover:bg-[#00c076]/25 transition-all cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(m)}
                    className="text-xs px-3 py-1.5 rounded-xl font-bold bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 transition-all cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {modalMode && (
        <Modal title={modalMode === "create" ? "Add Deposit Method" : "Edit Deposit Method"} onClose={() => setModalMode(null)}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Method Name <span className="text-rose-400">*</span></label>
                <input {...register("name", { required: "Name is required" })} placeholder="e.g. Bitcoin (BTC)" className={inputClass} />
                {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Type <span className="text-rose-400">*</span></label>
                <select {...register("type")} className={inputClass}>
                  <option value="crypto">Crypto</option>
                  <option value="bank">Bank</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Details <span className="text-rose-400">*</span></label>
                  <button
                    type="button"
                    onClick={() => append({ key: "", value: "" })}
                    className="text-xs text-[#00e676] font-bold hover:underline cursor-pointer"
                  >
                    + Add field
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">Add key-value pairs e.g. "Wallet Address" → "0x123..."</p>
                <div className="space-y-2">
                  {fields.map((field, i) => (
                    <div key={field.id} className="flex flex-col sm:flex-row gap-2 items-center">
                      <input
                        {...register(`details.${i}.key`, { required: true })}
                        placeholder="Label (e.g. Wallet Address)"
                        className={`${inputClass} flex-1`}
                      />
                      <input
                        {...register(`details.${i}.value`, { required: true })}
                        placeholder="Value"
                        className={`${inputClass} flex-1`}
                      />
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(i)} className="self-end sm:self-center text-rose-400 hover:text-rose-300 px-1 py-1 cursor-pointer">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" {...register("isActive")} className="w-4 h-4 accent-[#00c076]" />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-300">Active (visible to traders)</label>
              </div>
            </div>

            {serverError && (
              <div className="mt-4 px-4 py-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-400 font-bold">
                ✕ {serverError}
              </div>
            )}

            <div className="flex gap-3 mt-6 pt-3 border-t border-white/10">
              <button type="button" onClick={() => setModalMode(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:bg-white/5 transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#00c076] text-[#080c10] text-xs font-black hover:bg-[#00e676] transition-all shadow-md shadow-[#00c076]/20 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer">
                {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>}
                {saving ? "Saving…" : modalMode === "create" ? "Add Method" : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <Modal title="Delete Deposit Method" onClose={() => setDeleteTarget(null)}>
          <p className="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-white">{deleteTarget.name}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-6 pt-3 border-t border-white/10">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:bg-white/5 transition-colors cursor-pointer">
              Cancel
            </button>
            <button
              onClick={() => deleteMutation.mutate(deleteTarget._id)}
              disabled={deleteMutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
