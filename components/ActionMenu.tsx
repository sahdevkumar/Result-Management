
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export interface ActionItem {
  label: string;
  onClick: () => void;
  icon?: React.ElementType;
  danger?: boolean;
  separatorAfter?: boolean;
  disabled?: boolean;
}

interface ActionMenuProps {
  label?: string; 
  actions: ActionItem[];
  variant?: 'dark' | 'light' | 'ghost';
  buttonClassName?: string;
  iconOnly?: boolean;
  icon?: React.ElementType;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ 
  label = "Options", 
  actions, 
  variant = 'dark',
  buttonClassName,
  iconOnly = false,
  icon: Icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getButtonClass = () => {
      if (buttonClassName) return buttonClassName;
      const base = "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm";
      if (variant === 'dark') return `${base} bg-slate-800 text-white hover:bg-slate-700 border border-slate-700`;
      if (variant === 'light') return `${base} bg-white text-slate-700 hover:bg-slate-50 border border-slate-200`;
      if (variant === 'ghost') return "p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors";
      return base;
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={getButtonClass()}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {iconOnly && Icon ? <Icon size={18} /> : (
            <>
                <span>{label}</span>
                <ChevronDown size={14} className={clsx("transition-transform duration-200", isOpen && "rotate-180")} />
            </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 focus:outline-none">
          <div className="py-1.5">
            {actions.map((action, index) => (
              <React.Fragment key={index}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!action.disabled) {
                        action.onClick();
                        setIsOpen(false);
                    }
                  }}
                  disabled={action.disabled}
                  className={clsx(
                    "w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors",
                    action.disabled ? "opacity-50 cursor-not-allowed text-slate-500" : 
                    action.danger 
                      ? "text-red-400 hover:bg-red-900/30 hover:text-red-300" 
                      : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
                  )}
                >
                  {action.icon && <action.icon size={15} className={clsx(action.danger ? "text-red-400" : "text-slate-400")} />}
                  {action.label}
                </button>
                {action.separatorAfter && (
                  <div className="border-t border-slate-700/80 my-1.5 mx-0"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
