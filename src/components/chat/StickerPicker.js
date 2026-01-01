import React from 'react';
import { Smile, X } from 'lucide-react';

// Simple sticker packs (using emojis for now)
const STICKER_PACKS = {
  'Funny': ['😂', '😎', '🤔', '😭', '🤯'],
  'Animals': ['🐱', '🐶', '🐸', '🦄', '🐙'],
  'Love': ['❤️', '😍', '😘', '💕', '🌹'],
  'Reactions': ['👍', '👎', '🔥', '🎉', '👋']
};

export default function StickerPicker({ isOpen, onClose, onSelect }) {
  if (!isOpen) return null;

  return (
    // This sits above the input bar
    <div className="absolute bottom-20 left-4 z-50 bg-white shadow-xl border border-gray-200 rounded-2xl w-64 animate-in slide-in-from-bottom-5 fade-in duration-200">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
        <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
          <Smile size={14} /> Stickers
        </span>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-400">
          <X size={14} />
        </button>
      </div>

      {/* Grid */}
      <div className="p-3 h-48 overflow-y-auto">
        {Object.entries(STICKER_PACKS).map(([category, stickers]) => (
          <div key={category} className="mb-4">
            <h4 className="text-[10px] font-bold text-gray-400 mb-2">{category}</h4>
            <div className="grid grid-cols-5 gap-2">
              {stickers.map((sticker, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelect(sticker); // Send it!
                    onClose();         // Close menu
                  }}
                  className="text-2xl hover:bg-gray-100 p-1 rounded-lg transition hover:scale-110 active:scale-95"
                >
                  {sticker}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}