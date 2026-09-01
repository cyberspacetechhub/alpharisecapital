import { useEffect } from "react";
import { useAuthStore } from "../../store/auth.store";

declare global {
  interface Window {
    _smartsupp?: {
      key?: string;
      email?: string;
      name?: string;
      [key: string]: any;
    };
    smartsupp?: (...args: any[]) => void;
  }
}

const SMARTSUPP_KEY = "d5beec2e83916a97d00d33ada2842e6c3a0fcc46";

export default function SmartsuppChat() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    // 1. Initialize global Smartsupp object
    window._smartsupp = window._smartsupp || {};
    window._smartsupp.key = SMARTSUPP_KEY;

    // If trader is logged in, attach their profile info
    if (user?.email) {
      window._smartsupp.email = user.email;
      window._smartsupp.name = user.username;
      if (typeof window.smartsupp === "function") {
        window.smartsupp("user:set", {
          email: user.email,
          name: user.username,
        });
      }
    }

    // 2. Load the Smartsupp loader script once if not already injected
    const SCRIPT_ID = "smartsupp-loader-script";
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.type = "text/javascript";
      script.async = true;
      script.src = "https://www.smartsuppchat.com/loader.js?";
      document.body.appendChild(script);
    }
  }, [user]);

  return null;
}
