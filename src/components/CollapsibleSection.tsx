import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

type CollapsibleSectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function CollapsibleSection({ id, title, subtitle, defaultOpen = true, actions, children, className = '' }: CollapsibleSectionProps) {
  const storageKey = `trilha:section:${id}`;
  const [open, setOpen] = useState(() => {
    try {
      const value = localStorage.getItem(storageKey);
      return value == null ? defaultOpen : value === 'open';
    } catch {
      return defaultOpen;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey, open ? 'open' : 'closed'); } catch { /* opcional */ }
  }, [open, storageKey]);

  return (
    <section className={`trilha-collapsible border border-gold-dim rounded-xl overflow-hidden bg-[#5F5340] text-[#EFE4CF] ${className}`}>
      <div className="trilha-collapsible-header flex items-center gap-3 px-4 py-3 bg-[#5F5340]">
        <button type="button" onClick={() => setOpen(value => !value)} className="min-w-0 flex-1 flex items-center gap-3 text-left" aria-expanded={open}>
          <ChevronDown className={`w-4 h-4 shrink-0 text-gold transition-transform ${open ? '' : '-rotate-90'}`} />
          <div className="min-w-0">
            <h3 className="font-display text-gold-bright">{title}</h3>
            {subtitle && <p className="text-xs text-[#EFE4CF] mt-0.5">{subtitle}</p>}
          </div>
        </button>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {open && <div className="trilha-collapsible-body border-t border-gold-dim/60 bg-[#5F5340] p-4 text-[#EFE4CF]">{children}</div>}
    </section>
  );
}
