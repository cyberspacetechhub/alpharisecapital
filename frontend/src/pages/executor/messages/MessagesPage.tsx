import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messageApi } from "../../../api/message.api";
import { userApi } from "../../../api/user.api";
import { formatDate } from "../../../utils";

interface InAppMessage {
  _id: string;
  sender?: {
    username: string;
  };
  subject: string;
  body: string;
  type: "system" | "direct";
  isRead: boolean;
  createdAt: string;
}

export default function ExecutorMessagesPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"inbox" | "send">("inbox");
  const [selectedMsg, setSelectedMsg] = useState<InAppMessage | null>(null);

  // Send message form state
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Queries
  const { data: tradersData, isLoading: tradersLoading } = useQuery({
    queryKey: ["executor-traders-list"],
    queryFn: () => userApi.getAllTraders().then((r) => r.data),
  });

  const { data: inboxData, isLoading: inboxLoading } = useQuery<InAppMessage[]>({
    queryKey: ["executor-notifications"],
    queryFn: () => messageApi.getInbox().then((r) => r.data.messages || r.data.data || []),
  });

  const traders = tradersData?.users ?? [];
  const notifications = inboxData ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: (payload: any) => messageApi.sendMessage(payload),
    onSuccess: () => {
      setRecipientId("");
      setSubject("");
      setBody("");
      setSuccessMsg("Notification sent to client successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message ?? "Failed to send message");
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => messageApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["executor-notifications"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => messageApi.deleteMessage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executor-notifications"] });
      setSelectedMsg(null);
    },
  });

  const handleSelectNotification = (n: InAppMessage) => {
    setSelectedMsg(n);
    if (!n.isRead) {
      markReadMutation.mutate(n._id);
    }
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!recipientId) {
      setErrorMsg("Please select a recipient client");
      return;
    }
    if (!subject.trim()) {
      setErrorMsg("Please enter a subject");
      return;
    }
    if (!body.trim()) {
      setErrorMsg("Please enter a message body");
      return;
    }

    sendMessageMutation.mutate({
      recipientId,
      subject: subject.trim(),
      body: body.trim(),
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Messages & Notifications Desk</h1>
          <p className="text-xs text-gray-400 mt-0.5">Send push/system warnings, answer client support threads, and monitor logs.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-gray-100 rounded-xl p-1 shrink-0 border border-gray-200 self-start sm:self-center">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
              activeTab === "inbox" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            My Inbox ({unreadCount})
          </button>
          <button
            onClick={() => setActiveTab("send")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
              activeTab === "send" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Dispatch Message
          </button>
        </div>
      </div>

      {/* Inbox view */}
      {activeTab === "inbox" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Inbox list */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm h-[65vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase">Received Messages</span>
              <span className="text-[10px] bg-red-50 text-red-650 px-2 py-0.5 rounded-full font-bold uppercase">
                {unreadCount} New
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {inboxLoading ? (
                <div className="p-5 space-y-2">
                  <div className="h-10 bg-gray-100 animate-pulse rounded-lg" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400 p-8">
                  Your notifications inbox is currently empty.
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => handleSelectNotification(n)}
                    className={`w-full text-left p-4 hover:bg-gray-50/50 transition-colors flex gap-3.5 items-start ${
                      selectedMsg?._id === n._id ? "bg-emerald-50/30" : ""
                    } ${!n.isRead ? "font-semibold text-gray-900" : "text-gray-600"}`}
                  >
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      !n.isRead ? "bg-emerald-500" : "bg-transparent"
                    }`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-gray-800 truncate">{n.subject}</span>
                        <span className="text-[9px] text-gray-400 shrink-0 font-mono">
                          {formatDate(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">
                        {n.sender ? `From: ${n.sender.username} — ` : ""}
                        {n.body}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-[65vh] flex flex-col justify-between">
            {selectedMsg ? (
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-gray-50 border border-gray-150 uppercase tracking-wider text-gray-500">
                      {selectedMsg.sender?.username ?? "SYSTEM"}
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
                <span>Select a message to view detail parameters.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Message view */}
      {activeTab === "send" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-xl">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Send New Message</h2>

          <form onSubmit={handleSendSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Recipient Client <span className="text-red-400">*</span></label>
              {tradersLoading ? (
                <div className="h-10 bg-gray-100 animate-pulse rounded-xl" />
              ) : (
                <select
                  required
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                >
                  <option value="">Select a trader client...</option>
                  {traders.map((t: any) => (
                    <option key={t._id} value={t._id}>
                      {t.username} ({t.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Account limits upgraded"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message Body <span className="text-red-400">*</span></label>
              <textarea
                required
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write message contents here..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent resize-none"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 text-xs text-red-650 rounded-xl">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-green-50 border border-green-100 text-xs text-emerald-700 rounded-xl">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={sendMessageMutation.isPending}
              className="w-full py-3 bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {sendMessageMutation.isPending && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              DISPATCH MESSAGE
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
