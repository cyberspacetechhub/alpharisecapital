export const formatCurrency = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

export const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));

export const formatDateShort = (date: string | Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(date));

export const cn = (...classes: (string | undefined | false | null)[]) =>
  classes.filter(Boolean).join(" ");

export const getPnLColor = (value: number) =>
  value >= 0 ? "text-[#00e676]" : "text-rose-400";

export const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    approved: "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30",
    completed: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
    rejected: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
    active: "bg-emerald-500/15 text-[#00e676] border border-emerald-500/30",
    repaid: "bg-slate-700/30 text-slate-300 border border-slate-600/30",
    open: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
    closed: "bg-slate-700/30 text-slate-400 border border-slate-700/50",
    liquidated: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
  };
  return map[status] ?? "bg-slate-800 text-slate-300 border border-slate-700/50";
};
