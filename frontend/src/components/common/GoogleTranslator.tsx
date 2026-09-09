import { useState, useRef, useEffect } from 'react';

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: {
      translate: {
        TranslateElement: new (options: object, elementId: string) => void;
      };
    };
  }
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh-CN', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'ar', label: 'العربية' },
  // African languages
  { code: 'af', label: 'Afrikaans (SA)' },
  { code: 'zu', label: 'isiZulu (SA)' },
  { code: 'xh', label: 'isiXhosa (SA)' },
  { code: 'st', label: 'Sesotho (Lesotho)' },
  { code: 'sn', label: 'Shona (Zimbabwe)' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'yo', label: 'Yorùbá' },
  { code: 'ig', label: 'Igbo' },
  { code: 'ha', label: 'Hausa' },
  { code: 'am', label: 'አማርኛ (Amharic)' },
  { code: 'so', label: 'Soomaali (Somali)' },
  { code: 'ny', label: 'Chichewa (Malawi)' },
  { code: 'mg', label: 'Malagasy' },
  { code: 'rw', label: 'Kinyarwanda' },
  { code: 'lg', label: 'Luganda (Uganda)' },
  { code: 'tn', label: 'Setswana' },
  { code: 'ts', label: 'Xitsonga' },
  { code: 'ss', label: 'siSwati' },
  { code: 've', label: 'Tshivenḓa' },
  { code: 'nr', label: 'isiNdebele' },
  // More world languages
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'th', label: 'ภาษาไทย' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pl', label: 'Polski' },
  { code: 'uk', label: 'Українська' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'ms', label: 'Bahasa Melayu' },
  { code: 'fa', label: 'فارسی (Persian)' },
  { code: 'ur', label: 'اردو (Urdu)' },
  { code: 'ro', label: 'Română' },
  { code: 'hu', label: 'Magyar' },
  { code: 'cs', label: 'Čeština' },
  { code: 'sv', label: 'Svenska' },
  { code: 'el', label: 'Ελληνικά' },
];

const GoogleTranslator = ({ dark = false }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('en');
  const ref = useRef<HTMLDivElement>(null);

  // Inject Google Translate script once
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en', autoDisplay: false,
          includedLanguages: 'en,es,fr,de,it,pt,ru,zh-CN,ja,ko,ar,af,zu,xh,st,sn,sw,yo,ig,ha,am,so,ny,mg,rw,lg,tn,ts,ss,ve,nr,hi,bn,tr,vi,th,nl,pl,uk,id,ms,fa,ur,ro,hu,cs,sv,el'
        },
        'gt_hidden'
      );
    };
    if (!document.getElementById('gt-script')) {
      const s = document.createElement('script');
      s.id = 'gt-script';
      s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectLanguage = (code: string) => {
    setSelected(code);
    setOpen(false);

    // Use the hidden select rendered by Google Translate widget
    const select = document.querySelector<HTMLSelectElement>('#gt_hidden select');
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event('change'));
    } else {
      // Fallback: set googtrans cookie and reload
      const val = code === 'en' ? '' : `/en/${code}`;
      document.cookie = `googtrans=${val};path=/`;
      document.cookie = `googtrans=${val};domain=${location.hostname};path=/`;
      location.reload();
    }
  };

  const textColor = dark ? '#9ca3af' : '#6b7280';
  const bgColor = dark ? '#1f2937' : '#ffffff';
  const borderColor = dark ? '#374151' : '#e5e7eb';
  const hoverBg = dark ? '#374151' : '#f3f4f6';
  const itemColor = dark ? '#d1d5db' : '#111827';

  return (
    <>
      {/* Hidden Google Translate widget — needed to get the select element */}
      <div id="gt_hidden" style={{ display: 'none' }} />
      <style>{`
        .goog-te-banner-frame { display: none !important; }
        .skiptranslate { display: none !important; }
        body { top: 0 !important; }
      `}</style>

      <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            color: textColor, padding: '4px 6px', borderRadius: 6,
          }}
          title="Translate"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
            >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
            <path d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" />
        </svg>
          <span style={{ fontSize: 12 }} className='hidden md:block'>
            {LANGUAGES.find((l) => l.code === selected)?.label ?? 'Language'}
          </span>
          <span style={{ fontSize: 12 }} className='block uppercase'>
            {LANGUAGES.find((l) => l.code === selected)?.code ?? 'Language'}
          </span>
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: '110%', left: '20%', zIndex: 9999,
            background: bgColor, border: `1px solid ${borderColor}`,
            borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            minWidth: 180, maxHeight: 300, overflowY: 'auto',
          }}>
            {LANGUAGES.map((lang) => (
              <div
                key={lang.code}
                onClick={() => selectLanguage(lang.code)}
                style={{
                  padding: '8px 14px', cursor: 'pointer', fontSize: 13,
                  color: lang.code === selected ? '#16a34a' : itemColor,
                  fontWeight: lang.code === selected ? 600 : 400,
                  background: lang.code === selected ? hoverBg : 'transparent',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
                onMouseLeave={(e) => e.currentTarget.style.background = lang.code === selected ? hoverBg : 'transparent'}
              >
                {lang.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default GoogleTranslator;
