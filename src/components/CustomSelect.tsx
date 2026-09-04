import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  /** Shown when `value` matches no option (e.g. nothing selected yet). */
  placeholder?: string;
}

export function CustomSelect({ value, onChange, options, className, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value) ?? (placeholder ? undefined : options[0]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "bg-foreground/5 border rounded-xl px-3 py-3 text-xs outline-none w-full font-bold flex items-center justify-between transition-all duration-300 text-foreground shadow-sm",
          isOpen ? "border-brand-gold bg-brand-gold/5" : "border-foreground/10 hover:border-foreground/20"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-foreground/50")}>{selectedOption?.label ?? placeholder}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isOpen ? "rotate-180 text-brand-gold" : "text-foreground/50")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-background border border-brand-gold/30 rounded-xl shadow-2xl shadow-brand-gold/10 overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 text-xs font-bold transition-colors duration-200",
                    value === option.value
                      ? "bg-brand-gold text-black"
                      : "text-foreground/80 hover:bg-brand-gold/10 hover:text-brand-gold"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
