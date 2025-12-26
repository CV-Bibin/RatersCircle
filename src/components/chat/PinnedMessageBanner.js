import React from 'react';
import { Pin, X } from 'lucide-react';

export default function PinnedMessageBanner({ message, onUnpin, canUnpin }) {
  if (!message) return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-100 p-3 flex justify-between items-center shadow-sm z-10 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3 overflow-hidden">
         <div className="bg-yellow-200 p-2 rounded-lg text-yellow-700">
           <Pin size={16} fill="currentColor" />
         </div>
         <div className="truncate">
           <p className="text-xs font-bold text-yellow-800 uppercase">Pinned Announcement</p>
           <p className="text-sm text-gray-700 truncate">{message.text}</p>
         </div>
      </div>
      {canUnpin && (
        <button onClick={onUnpin} className="p-2 text-gray-400 hover:text-red-500 transition">
          <X size={16} />
        </button>
      )}
    </div>
  );
}