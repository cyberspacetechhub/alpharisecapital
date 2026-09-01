import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inboxApi } from "../../../api/inbox.api";
import { userApi } from "../../../api/user.api";
import { formatDate } from "../../../utils";

type MailTab = "inbox" | "sent" | "compose";

export default function ResendInboxPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<MailTab>("compose");
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
  const [selectedSentMailId, setSelectedSentMailId] = useState<string | null>(null);

  // Compose / Bulk send state
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Queries
  const { data: tradersData } = useQuery({
    queryKey: ["executor-traders-list-for-mail"],
    queryFn: () => userApi.getAllTraders().then((r) => r.data),
  });

  const traders = tradersData?.users ?? [];

  // Query received emails
  const { data: receivedData, isLoading: receivedLoading } = useQuery({
    queryKey: ["resend-received-emails"],
    queryFn: () => inboxApi.getEmails().then((r) => r.data.data),
    enabled: activeTab === "inbox",
  });

  const receivedEmails = receivedData ?? [];

  // Query single received email details
  const { data: singleReceivedData } = useQuery({
    queryKey: ["resend-received-email", selectedMailId],
    queryFn: () => inboxApi.getEmail(selectedMailId!).then((r) => r.data.data),
    enabled: !!selectedMailId && activeTab === "inbox",
  });

  // Query sent history emails
  const { data: sentData, isLoading: sentLoading } = useQuery({
    queryKey: ["resend-sent-emails"],
    queryFn: () => inboxApi.getSentEmails().then((r) => r.data.data),
    enabled: activeTab === "sent",
  });

  const sentEmails = sentData ?? [];

  // Query single sent email details
  const { data: singleSentData } = useQuery({
    queryKey: ["resend-sent-email", selectedSentMailId],
    queryFn: () => inboxApi.getSentEmail(selectedSentMailId!).then((r) => r.data.data),
    enabled: !!selectedSentMailId && activeTab === "sent",
  });

  // Mutations
  const sendEmailMutation = useMutation({
    mutationFn: inboxApi.sendEmail,
    onSuccess: () => {
      setRecipientEmails([]);
      setSubject("");
      setEmailBody("");
      setSuccessMsg("Bulk email message broadcasted successfully!");
      qc.invalidateQueries({ queryKey: ["resend-sent-emails"] });
      setTimeout(() => setSuccessMsg(""), 5000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || "Failed to dispatch resend email.");
    },
  });

  const deleteEmailMutation = useMutation({
    mutationFn: inboxApi.deleteEmail,
    onSuccess: () => {
      setSelectedMailId(null);
      qc.invalidateQueries({ queryKey: ["resend-received-emails"] });
      setSuccessMsg("Email deleted successfully.");
      setTimeout(() => setSuccessMsg(""), 5000);
    },
  });

  const handleSelectAllTraders = () => {
    const allEmails = traders.map((t: any) => t.email).filter(Boolean);
    setRecipientEmails(allEmails);
  };

  const handleToggleTraderEmail = (email: string) => {
    setRecipientEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (recipientEmails.length === 0) {
      setErrorMsg("Please select at least one recipient email address.");
      return;
    }
    if (!subject.trim()) {
      setErrorMsg("Please enter a subject header.");
      return;
    }
    if (!emailBody.trim()) {
      setErrorMsg("Please enter email body content.");
      return;
    }

    sendEmailMutation.mutate({
      to: recipientEmails,
      subject: subject.trim(),
      html: `<div style="font-family: sans-serif; color: #333; line-height: 1.6;">${emailBody.replace(
        /\n/g,
        "<br />"
      )}</div>`,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header and top tab selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Resend Corporate Mail Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">Audit received letters, check sent archives, and broadcast bulk emails to traders.</p>
        </div>

        {/* Custom tabs */}
        <div className="flex bg-[#0e1520] rounded-2xl p-1 shrink-0 border border-white/10 self-start sm:self-center">
          {(["inbox", "sent", "compose"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase cursor-pointer ${
                activeTab === tab ? "bg-[#00c076] text-[#080c10] shadow-sm font-black" : "text-slate-400 hover:text-white"
              }`}
            >
              {tab === "inbox" ? "Received" : tab === "sent" ? "Sent History" : "Compose Broadcast"}
            </button>
          ))}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-[#00e676] font-bold">
          ✓ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-400 font-bold">
          ✕ {errorMsg}
        </div>
      )}

      {/* Tabs panels */}
      {activeTab === "compose" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recipients select grid */}
          <div className="bg-[#121822] border border-white/10 rounded-3xl p-6 shadow-sm space-y-4 h-[65vh] flex flex-col justify-between">
            <div className="space-y-4 flex-grow flex flex-col overflow-hidden">
              <div className="flex justify-between items-center pb-2 border-b border-white/10 shrink-0">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Select Recipients ({recipientEmails.length})</h3>
                <button
                  onClick={handleSelectAllTraders}
                  className="text-[10px] text-[#00e676] hover:underline font-bold"
                >
                  Select All
                </button>
              </div>

              <div className="flex-grow overflow-y-auto divide-y divide-white/5 pr-1">
                {traders.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4">No client records found.</p>
                ) : (
                  traders.map((t: any) => {
                    const isChecked = recipientEmails.includes(t.email);
                    return (
                      <label
                        key={t._id}
                        className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-white/5 rounded-xl px-2 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleTraderEmail(t.email)}
                          className="rounded text-[#00c076] focus:ring-[#00c076] bg-[#0e1520] border-white/20"
                        />
                        <div className="text-xs min-w-0">
                          <span className="font-bold text-white block truncate">{t.username}</span>
                          <span className="text-[10px] text-slate-400 block truncate font-mono">{t.email}</span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            
            <button
              onClick={() => setRecipientEmails([])}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition-colors text-center shrink-0 border border-white/10"
            >
              Clear Selection
            </button>
          </div>

          {/* Form Composer */}
          <div className="lg:col-span-2 bg-[#121822] border border-white/10 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-white pb-3 border-b border-white/10">Create Broadcast Message</h3>
            
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Recipients Preview</label>
                <div className="p-3 bg-[#0e1520] border border-white/10 rounded-2xl text-[10px] font-mono text-slate-300 max-h-20 overflow-y-auto break-all">
                  {recipientEmails.length === 0 ? (
                    <span className="italic text-slate-500">Select recipients from the left sidebar panel...</span>
                  ) : (
                    recipientEmails.join(", ")
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Important Alpha Rise Global Account Update"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Email Body (Plain Text or HTML)</label>
                <textarea
                  rows={8}
                  required
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Dear Trader, we have completed auditing linked deposits..."
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sendEmailMutation.isPending}
                className="w-full py-4 bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black rounded-2xl transition-all shadow-md shadow-[#00c076]/20 cursor-pointer disabled:opacity-50"
              >
                {sendEmailMutation.isPending ? "Broadcasting..." : `Broadcast Bulk Email (${recipientEmails.length} addresses)`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Inbox Panel */}
      {activeTab === "inbox" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[#121822] rounded-3xl border border-white/10 overflow-hidden shadow-sm h-[65vh] flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 bg-[#0e1520]">
              <span className="text-xs font-bold text-slate-400 uppercase">Received Letters</span>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {receivedLoading ? (
                <div className="p-5 space-y-2">
                  <div className="h-10 bg-white/5 animate-pulse rounded-lg" />
                </div>
              ) : receivedEmails.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 p-8">
                  No received letters found in Resend configurations.
                </div>
              ) : (
                receivedEmails.map((mail) => (
                  <button
                    key={mail.id}
                    onClick={() => setSelectedMailId(mail.id)}
                    className={`w-full text-left p-4 hover:bg-white/5 transition-colors flex justify-between items-start ${
                      selectedMailId === mail.id ? "bg-[#00c076]/10 border-l-2 border-[#00c076]" : ""
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-white block truncate">{mail.subject}</span>
                      <span className="text-[10px] text-slate-400 block mt-1 font-mono">From: {mail.from}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono shrink-0">
                      {formatDate(mail.created_at)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Received details */}
          <div className="bg-[#121822] rounded-3xl border border-white/10 p-6 shadow-sm h-[65vh] flex flex-col justify-between">
            {selectedMailId && singleReceivedData ? (
              <div className="flex flex-col h-full justify-between overflow-hidden">
                <div className="space-y-4 flex-grow overflow-y-auto pr-1">
                  <div className="flex justify-between items-start border-b border-white/10 pb-3">
                    <div className="text-[9px]">
                      <strong className="block text-slate-400 uppercase">From:</strong>
                      <span className="text-white font-mono font-bold">{singleReceivedData.from}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{formatDate(singleReceivedData.created_at)}</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-white leading-snug">{singleReceivedData.subject}</h3>
                    <div
                      className="text-xs text-slate-300 leading-relaxed border border-white/10 bg-[#0e1520] p-4 rounded-2xl whitespace-pre-wrap select-all font-mono"
                      dangerouslySetInnerHTML={singleReceivedData.html ? { __html: singleReceivedData.html } : undefined}
                    >
                      {!singleReceivedData.html && singleReceivedData.text}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteEmailMutation.mutate(selectedMailId)}
                  disabled={deleteEmailMutation.isPending}
                  className="w-full mt-6 py-2.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-bold rounded-xl border border-rose-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  Delete Email Record
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-500 space-y-2">
                <span>Select a received email to audit details.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sent History Panel */}
      {activeTab === "sent" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[#121822] rounded-3xl border border-white/10 overflow-hidden shadow-sm h-[65vh] flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 bg-[#0e1520]">
              <span className="text-xs font-bold text-slate-400 uppercase">Sent Archives</span>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {sentLoading ? (
                <div className="p-5 space-y-2">
                  <div className="h-10 bg-white/5 animate-pulse rounded-lg" />
                </div>
              ) : sentEmails.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 p-8">
                  No sent history logs found in Resend accounts.
                </div>
              ) : (
                sentEmails.map((mail) => (
                  <button
                    key={mail.id}
                    onClick={() => setSelectedSentMailId(mail.id)}
                    className={`w-full text-left p-4 hover:bg-white/5 transition-colors flex justify-between items-start ${
                      selectedSentMailId === mail.id ? "bg-[#00c076]/10 border-l-2 border-[#00c076]" : ""
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-white block truncate">{mail.subject}</span>
                      <span className="text-[10px] text-slate-400 block mt-1 font-mono">To: {mail.to?.join(", ")}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono shrink-0">
                      {formatDate(mail.created_at)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Sent details */}
          <div className="bg-[#121822] rounded-3xl border border-white/10 p-6 shadow-sm h-[65vh] flex flex-col justify-between">
            {selectedSentMailId && singleSentData ? (
              <div className="flex flex-col h-full justify-between overflow-hidden">
                <div className="space-y-4 flex-grow overflow-y-auto pr-1">
                  <div className="flex justify-between items-start border-b border-white/10 pb-3">
                    <div className="text-[9px]">
                      <strong className="block text-slate-400 uppercase">To:</strong>
                      <span className="text-white font-mono font-bold break-all">{singleSentData.to?.join(", ")}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{formatDate(singleSentData.created_at)}</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-white leading-snug">{singleSentData.subject}</h3>
                    <div
                      className="text-xs text-slate-300 leading-relaxed border border-white/10 bg-[#0e1520] p-4 rounded-2xl select-all font-mono"
                      dangerouslySetInnerHTML={singleSentData.html ? { __html: singleSentData.html } : undefined}
                    >
                      {!singleSentData.html && singleSentData.text}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-500 space-y-2">
                <span>Select a sent email to audit details.</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
