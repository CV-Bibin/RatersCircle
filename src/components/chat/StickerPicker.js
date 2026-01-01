import React, { useState, useEffect, useRef } from 'react';
import { 
  Smile, X, Briefcase, MessageSquare, Sparkles, 
  ThumbsUp, Heart, Cat, Zap 
} from 'lucide-react';

// ✅ DATA (Unchanged)
const STICKER_PACKS = {
  'Work Status': ['✅ Done', '⏳ Working', '🚫 No Tasks', '🏠 Out of Home', '☕ Break', '👀 Reviewing', '📅 In Meeting', '🚀 Ready','🎉 Malayalam task available','✨ tasks available'],
  'Quick Replies': ['🆗 OK', '📝 Noted', '👍 Approved', '❌ Rejected', '📩 Check DM', '🤝 Thanks', '🤚 Wait', '🤷 Unsure'],
  'Wishes': ['☀️ Good Morning', '🌙 Good Night', '🎂 Happy Birthday!', '🎊 Congrats', '👋 Welcome', '💪 Keep it up'],
  'Reactions': ['👍', '👎', '❤️', '🔥', '🎉', '👋', '🙏', '💯'],
  'Funny & Moods': ['😂', '🤣', '😹', '😆', '😅', '🥹', '🙃', '😉', '😇', '🤠', '🥳', '🤩', '🤪', '😜', '😝', '😛', '🫠', '🫥', '🥴', '🤤', '🤥', '😎', '🤓', '🧐', '🤔', '🤨', '😐', '😑', '🙄', '😬', '🤫', '🤭', '🫣', '🤯', '😱', '😨', '😳', '🥵', '🥶', '😭', '😤', '😡', '🤬', '💀', '☠️', '🤢', '🤮', '🤧', '😷', '🥱', '😴', '😪', '🙈', '🙉', '🙊', '🐵', '👽', '🤖', '👾'],
  'Love': ['❤️', '😍', '😘', '💕', '🌹', '💖', '🥰', '💌'],
  'Superheroes': ['🕷️', '🕸️', '🦇', '🌑', '🦸‍♂️', '🦸‍♀️', '🛡️', '⚔️', '🤖', '🦾', '💪', '🟢', '⚡', '🔨', '⏩', '🔥', '👽', '🦹‍♂️', '🦹‍♀️', '💥'],
  'Animals': ['🐱', '🐶', '🐸', '🦄', '🐙', '🦁', '🐼', '🙈', '🐉', '🦕', '🦖', '🦄', '🐲', '🐙', '🦑', '🐡', '🦂', '🦗', '🕷️', '🦠', '🧬', '👽', '👾', '🤖', '👹', '👺', '💀', '👻', '🦇', '🦉', '🦅', '🦈']
};

const CATEGORY_ICONS = {
  'Work Status': <Briefcase size={16} />,
  'Quick Replies': <MessageSquare size={16} />,
  'Wishes': <Sparkles size={16} />,
  'Superheroes': <Zap size={16} />,
  'Reactions': <ThumbsUp size={16} />,
  'Funny & Moods': <Smile size={16} />,
  'Love': <Heart size={16} />,
  'Animals': <Cat size={16} />
};

// 🛠️ HELPER: Better Emoji Detection
const isEmojiOnly = (str) => {
  // Regex to check if string contains only emojis
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\u200D|\uFE0F)+$/u;
  return emojiRegex.test(str);
};

export default function StickerPicker({ isOpen, onClose, onSelect }) {
  const [activeTab, setActiveTab] = useState('Work Status');
  const pickerRef = useRef(null);

  // 🖱️ Feature: Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={pickerRef}
      className="absolute bottom-16 left-0 sm:left-4 z-50 bg-white shadow-2xl border border-gray-200 rounded-2xl w-full max-w-[360px] flex flex-col h-[400px] animate-in slide-in-from-bottom-5 fade-in duration-200"
    >
      
      {/* 🎨 Styles moved here for scope, but ideally move to CSS file */}
      <style>{`
        @keyframes shimmerGold {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .wish-badge {
           background: linear-gradient(90deg, #fef9c3, #fefce8, #fef9c3);
           background-size: 200% 200%;
           animation: shimmerGold 3s ease infinite;
           border: 1px solid #fde047;
           color: #854d0e;
        }
      `}</style>

      {/* --- HEADER --- */}
      <div className="flex justify-between items-center p-3 border-b border-gray-100 bg-gray-50 rounded-t-2xl shrink-0">
        <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
          <Smile size={14} /> Sticker Store
        </span>
        <button 
          onClick={onClose} 
          className="p-1 hover:bg-gray-200 rounded-full text-gray-400 transition"
          aria-label="Close Sticker Picker"
        >
          <X size={14} />
        </button>
      </div>

      {/* --- TABS --- */}
      <div className="flex gap-2 p-2 bg-white border-b border-gray-100 overflow-x-auto shrink-0 scrollbar-thin scrollbar-thumb-gray-200">
        {Object.keys(STICKER_PACKS).map((category) => (
          <button
            key={category}
            onClick={() => setActiveTab(category)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border
              ${activeTab === category 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}
            `}
          >
            {CATEGORY_ICONS[category] || <Smile size={14} />}
            {category}
          </button>
        ))}
      </div>

      {/* --- CONTENT --- */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 bg-gray-50/30">
        <div className="animate-in fade-in zoom-in-95 duration-200" key={activeTab}>
          
          <h4 className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
             {CATEGORY_ICONS[activeTab]} {activeTab}
          </h4>

          <div className="flex flex-wrap gap-2 content-start">
            {STICKER_PACKS[activeTab].map((sticker, idx) => {
                const isWish = activeTab === 'Wishes';
                // Using helper function for cleaner logic
                const isEmoji = isEmojiOnly(sticker); 

                let buttonClasses = "transition active:scale-95 hover:shadow-sm ";
                
                if (isWish) {
                    buttonClasses += "wish-badge text-xs font-bold px-3 py-2 rounded-full shadow-sm";
                } else if (!isEmoji) {
                    buttonClasses += "bg-white hover:bg-blue-50 hover:text-blue-600 text-gray-700 text-xs font-bold px-3 py-2 rounded-full border border-gray-200 shadow-sm";
                } else {
                    buttonClasses += "text-3xl hover:bg-white hover:scale-110 p-2 rounded-xl";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelect(sticker);
                      onClose();
                    }}
                    className={buttonClasses}
                    title={sticker} // Tooltip for accessibility
                  >
                    {sticker}
                  </button>
                );
            })}
          </div>
          <div className="h-4"></div>
        </div>
      </div>
    </div>
  );
}