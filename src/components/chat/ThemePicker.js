import React from 'react';
import { Palette, X, Check } from 'lucide-react';

// 1. NEW PATTERN: "Memphis Geometric" (Circles, Dots, Triangles)
// This is a subtle, modern pattern that looks great on both light and dark backgrounds.
export const DOODLE_PATTERN = `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.2'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z'/%3E%3C/g%3E%3C/svg%3E")`;

// 2. UPDATED THEMES LIST
export const THEMES = {
  // --- LIGHT / DEFAULT ---
  default: {
    name: "Default Blue",
    bg: "bg-[#E3F2FD]",
    preview: "bg-blue-200",
    pattern: "opacity-30", // Increased opacity slightly for visibility
  },

  sky: {
    name: "Sky Light",
    bg: "bg-sky-50",
    preview: "bg-sky-300",
    pattern: "opacity-30",
  },

  mint: {
    name: "Fresh Mint",
    bg: "bg-emerald-50",
    preview: "bg-emerald-300",
    pattern: "opacity-30",
  },

  lavender: {
    name: "Lavender",
    bg: "bg-violet-50",
    preview: "bg-violet-300",
    pattern: "opacity-30",
  },

  rose: {
    name: "Rose Blush",
    bg: "bg-rose-50",
    preview: "bg-rose-300",
    pattern: "opacity-30",
  },

  sand: {
    name: "Soft Sand",
    bg: "bg-amber-50",
    preview: "bg-amber-300",
    pattern: "opacity-30",
  },

  // --- DARK ---
  dark: {
    name: "Midnight",
    bg: "bg-slate-900",
    preview: "bg-slate-800",
    pattern: "opacity-10", // Lower opacity for dark mode
  },

  amoled: {
    name: "AMOLED Black",
    bg: "bg-black",
    preview: "bg-gray-900",
    pattern: "opacity-10",
  },

  oceanDark: {
    name: "Deep Ocean",
    bg: "bg-slate-950",
    preview: "bg-cyan-800",
    pattern: "opacity-10",
  },

  // --- PREMIUM / MOOD ---
  coffee: {
    name: "Coffee Mocha",
    bg: "bg-stone-100",
    preview: "bg-stone-400",
    pattern: "opacity-25",
  },

  sunset: {
    name: "Sunset Glow",
    bg: "bg-orange-50",
    preview: "bg-orange-300",
    pattern: "opacity-30",
  },

  forest: {
    name: "Forest Calm",
    bg: "bg-green-50",
    preview: "bg-green-400",
    pattern: "opacity-30",
  },

  ice: {
    name: "Ice Frost",
    bg: "bg-cyan-50",
    preview: "bg-cyan-300",
    pattern: "opacity-30",
  },
};

export default function ThemePicker({ isOpen, onClose, currentTheme, onSelectTheme }) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 z-[60] bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
          <Palette size={14} /> Chat Themes
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-400 transition">
          <X size={14} />
        </button>
      </div>

      {/* List */}
      <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
        {Object.entries(THEMES).map(([key, theme]) => (
          <button
            key={key}
            onClick={() => onSelectTheme(key)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border border-transparent ${currentTheme === key ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' : 'hover:bg-gray-50 text-gray-700'}`}
          >
            {/* Color Preview Circle */}
            <div className={`w-10 h-10 rounded-full shadow-sm border border-black/5 shrink-0 ${theme.preview}`}></div>
            
            <div className="flex-1 text-left">
              <span className="text-sm font-bold block">{theme.name}</span>
            </div>

            {currentTheme === key && <Check size={16} className="text-blue-600" />}
          </button>
        ))}
      </div>
    </div>
  );
}