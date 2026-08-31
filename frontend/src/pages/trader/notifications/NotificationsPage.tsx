import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messageApi } from "../../../api/message.api";
import { formatDate } from "../../../utils";

interface InAppMessage {
  _id: string;
  subject: string;
  body: string;
  type: "system" | "direct";
  isRead: boolean;
  createdAt: string;
}

export default function TraderNotificationsPage() {
  const qc = useQueryClient();
  const [selectedMsg, setSelectedMsg] = useState<InAppMessage | null>(null);

  // Get notifications
  const { data: inboxData, isLoading } = useQuery<InAppMessage[]>({
    queryKey: ["trader-notifications"],
    queryFn: () => messageApi.getInbox().then((r) => r.data.messages || r.data.data || []),
  });

  const notifications = inboxData ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: (id: string) => messageApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trader-notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => messageApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trader-notifications"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => messageApi.deleteMessage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trader-notifications"] });
      setSelectedMsg(null);
    },
  });

  const handleSelectNotification = (n: InAppMessage) => {
    setSelectedMsg(n);
    if (!n.isRead) {
      markReadMutation.mutate(n._id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
          <p className="text-xs text-gray-400 mt-0.5">Stay updated with system actions, payouts, and limit upgrades.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="self-start sm:self-center px-4 py-2 bg-gray-50 border border-gray-150 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl transition-all disabled:opacity-65 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Mark all read ({unreadCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Inbox List */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm h-[65vh] flex flex-col">
          <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Inbox List</span>
            <span className="text-[10px] bg-[#e6f4ea] text-[#2d6a4f] px-2 py-0.5 rounded-full font-bold uppercase">
              {unreadCount} Unread
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {isLoading ? (
              <div className="p-5 space-y-2">
                <div className="h-10 bg-gray-100 animate-pulse rounded-lg" />
                <div className="h-10 bg-gray-100 animate-pulse rounded-lg" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 p-8">
                Your notifications drawer is empty.
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleSelectNotification(n)}
                  className={`w-full text-left p-4 hover:bg-gray-50/50 transition-colors flex gap-3.5 items-start ${
                    selectedMsg?._id === n._id ? "bg-emerald-50/30" : ""
                  } ${!n.isRead ? "font-semibold" : ""}`}
                >
                  {/* Unread Indicator */}
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    !n.isRead ? "bg-emerald-500" : "bg-transparent"
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-800 truncate block">{n.subject}</span>
                      <span className="text-[9px] text-gray-450 shrink-0 font-mono">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">
                      {n.body}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-[65vh] flex flex-col justify-between">
          {selectedMsg ? (
            <div className="flex flex-col h-full justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-gray-50 border border-gray-150 uppercase tracking-wider text-gray-500">
                    {selectedMsg.type} Message
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {formatDate(selectedMsg.createdAt)}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-gray-800 leading-snug">{selectedMsg.subject}</h3>
                  <div className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap pt-2">
                    {selectedMsg.body}
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteMutation.mutate(selectedMsg._id)}
                disabled={deleteMutation.isPending}
                className="w-full mt-6 py-2.5 bg-red-50 text-red-500 hover:bg-red-100 text-xs font-semibold rounded-xl border border-red-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete message
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-xs text-gray-400 space-y-2">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Select an item in your inbox to view full details.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
