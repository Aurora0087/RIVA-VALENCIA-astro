import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

// ── Data ──────────────────────────────────────────────────────────────────────

const PANELS = [
  {
    key: 'women_label' as const,
    href: '/collections/womens',
    img: 'https://cdn.shopify.com/s/files/1/0812/7738/7010/files/download_3.jpg?v=1775831468',
  },
  {
    key: 'men_label' as const,
    href: '/collections/mens',
    img: 'https://cdn.shopify.com/s/files/1/0812/7738/7010/files/ZARA_Espana_-_Canarias___Nueva_Coleccion_Online.jpg?v=1775831469',
  },
] as const;

const COUNTRIES = [
  ['spain', 'Spain'], ['india', 'India'], ['usa', 'United States'],
  ['france', 'France'], ['germany', 'Germany'],
] as const;

const LANGS = [
  ['english', 'ENGLISH'], ['catalan', 'CATALÀ'], ['galego', 'GALEGO'], ['euskara', 'EUSKARA'],
] as const;

const DEFAULTS = { shop_now: 'GO TO FASHION' };

// ── Component ─────────────────────────────────────────────────────────────────

export function WelcomePage() {
  const [lang, setLang] = useState('english');
  const [country, setCountry] = useState('spain');
  const [remember, setRemember] = useState(false);
  const [popupMounted, setPopupMounted] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  const show = useCallback(() => {
    setPopupMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setPopupOpen(true)));
  }, []);

  const hide = useCallback(() => {
    setPopupOpen(false);
    setTimeout(() => setPopupMounted(false), 500);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('wlc_sel');
    if (!saved) show();
  }, [show]);

  function handleContinue() {
    if (remember) localStorage.setItem('wlc_sel', 'true');
    hide();
  }

  return (
    <div className="relative h-screen w-full flex flex-col bg-[#4d4845] overflow-hidden select-none">
      
      {/* ── Header ── */}
      <header className="absolute top-0 left-0 w-full z-10 text-center pt-8 pb-4">
        <h1 className="text-white text-[56px] font-medium tracking-[0.15em] uppercase leading-none mb-1">
          Riva Valencia
        </h1>
        <p className="text-white/60 text-[10px] tracking-[0.4em] uppercase font-light">
          Diseñado en España
        </p>
      </header>

      {/* ── Main Hero Panels ── */}
      <main className="flex-1 flex items-center justify-center gap-1 px-4">
        {PANELS.map((p) => (
          <div key={p.href} className="relative w-[480px] aspect-[3/4] overflow-hidden group cursor-pointer">
            <img 
              src={p.img} 
              className="w-full h-full object-cover grayscale-[0.3] brightness-75 transition-transform duration-1000 group-hover:scale-105"
              alt="Fashion Category"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
            <div className="absolute bottom-6 left-0 w-full text-center">
              <span className="text-white text-[11px] tracking-[0.2em] font-light">
                {DEFAULTS.shop_now}
              </span>
            </div>
            <a href={p.href} className="absolute inset-0 z-20" />
          </div>
        ))}
      </main>

      {/* ── Locale Drawer/Popup ── */}
      {popupMounted && (
        <div 
          className={cn(
            "fixed inset-0 z-50 flex flex-col justify-end transition-opacity duration-500",
            popupOpen ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Backdrop blur/dim */}
          <div className="absolute inset-0 bg-black/40" onClick={hide} />

          {/* Drawer Content */}
          <div className={cn(
            "relative w-full bg-[#fdfdfb] pt-16 pb-12 px-20 transform transition-transform duration-700 ease-out",
            popupOpen ? "translate-y-0" : "translate-y-full"
          )}>
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto_1.2fr] gap-x-16">
              
              {/* Location Column */}
              <div className="flex flex-col">
                <label className="text-[10px] font-medium tracking-[0.2em] text-[#8a7660] uppercase mb-6">
                  Select your location
                </label>
                <div className="flex items-center gap-3 border-b border-[#e2ddd6] pb-3 group cursor-pointer">
                  <ShoppingBagIcon className="w-4 h-4 text-[#1a1008]" />
                  <select 
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="flex-1 bg-transparent text-[17px] font-serif text-[#1a1008] outline-none appearance-none cursor-pointer"
                  >
                    {COUNTRIES.map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <ChevronDownIcon className="w-4 h-4 text-[#1a1008]" />
                </div>
              </div>

              {/* Middle Divider */}
              <div className="hidden md:block w-px bg-[#e2ddd6] self-stretch" />

              {/* Language Column */}
              <div className="flex flex-col">
                <label className="text-[10px] font-medium tracking-[0.2em] text-[#8a7660] uppercase mb-6">
                  Select your language
                </label>
                <div className="grid grid-cols-3 w-full border-t border-l border-[#e2ddd6]">
                  {LANGS.map(([val, label], idx) => (
                    <button
                      key={val}
                      onClick={() => setLang(val)}
                      className={cn(
                        "py-3.5 px-6 text-[10px] tracking-[0.15em] border-r border-b border-[#e2ddd6] transition-all",
                        lang === val 
                          ? "bg-[#1a1008] text-white" 
                          : "bg-transparent text-[#8a7660] hover:bg-gray-50",
                        // Make last item span across if needed (like the image shows 3+1 grid)
                        idx === 3 && "col-span-1"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                  {/* Empty cells to complete the grid look if needed */}
                  <div className="border-r border-b border-[#e2ddd6] bg-[#fdfdfb]" />
                  <div className="border-r border-b border-[#e2ddd6] bg-[#fdfdfb]" />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="max-w-6xl mx-auto mt-16 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <Checkbox 
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                  className="w-4 h-4 rounded-none border-[#c8c0b4] data-[state=checked]:bg-[#1a1008] data-[state=checked]:border-[#1a1008]"
                />
                <span className="text-[10px] tracking-[0.15em] text-[#8a7660] uppercase font-light group-hover:text-[#1a1008] transition-colors">
                  Remember my selection
                </span>
              </label>

              <Button
                onClick={handleContinue}
                className="bg-transparent border border-[#1a1008] text-[#1a1008] rounded-none px-16 py-6 text-[11px] tracking-[0.25em] uppercase hover:bg-[#1a1008] hover:text-white transition-all duration-300"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Icons (Matching Image) ──────────────────────────────────────────────────

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}