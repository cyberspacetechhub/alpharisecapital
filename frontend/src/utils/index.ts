export const formatCurrency = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

export const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));

export const formatDateShort = (date: string | Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(date));

export const cn = (...classes: (string | undefined | false | null)[]) =>
  classes.filter(Boolean).join(" ");

export const getPnLColor = (value: number) =>
  value >= 0 ? "text-green-600" : "text-red-500";

export const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
    active: "bg-emerald-100 text-emerald-700",
    repaid: "bg-gray-100 text-gray-600",
    open: "bg-blue-100 text-blue-700",
    closed: "bg-gray-100 text-gray-600",
    liquidated: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
};
