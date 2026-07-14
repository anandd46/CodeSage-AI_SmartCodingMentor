'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LanguageDropdown({ languages, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left w-40" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-base w-full text-sm flex items-center justify-between gap-2 px-3 py-2 cursor-pointer bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-200 transition-all rounded-lg shadow-sm"
      >
        <span className="capitalize font-medium flex items-center gap-1.5 truncate">
          <Globe size={14} className="text-brand-400" />
          {selected}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden z-[9999]"
          >
            <ul className="max-h-60 overflow-y-auto scroll-container py-1 text-sm text-slate-300">
              {languages.map((lang) => {
                const isSelected = lang === selected;
                return (
                  <li key={lang}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(lang);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between capitalize transition-colors duration-150
                        ${isSelected ? 'bg-brand-500/20 text-brand-300 font-semibold' : 'hover:bg-slate-800 hover:text-slate-100'}`}
                    >
                      <span>{lang}</span>
                      {isSelected && <Check size={14} className="text-brand-400" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
