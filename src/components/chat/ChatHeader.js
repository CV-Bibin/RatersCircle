import React from 'react';
import { Lock, Unlock, MoreVertical } from 'lucide-react';

export default function ChatHeader({ groupName, isRestricted, isManager, onToggleRestriction, userXP = 0 }) {
  
  // LOGIC: Only Managers OR Users with > 100 XP (Level 2+) can see details
  const canSeeDetails = isManager || userXP >= 100;

  return (
    <div className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm border-b border-gray-100">
      <div className="flex items-center gap-3">
        {/* Group Icon */}
        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-200">
          {groupName[0]}
        </div>
        
        <div>
          <h2 className="font-bold text-gray-800 text-lg leading-tight">{groupName}</h2>
          
          {/* VISIBILITY LOGIC */}
          {canSeeDetails ? (
             <p className="text-xs text-green-500 font-medium flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
               Online (Active)
             </p>
          ) : (
             <p className="text-xs text-gray-400 font-medium">
               Team Chat
             </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {isManager && (
          <button 
            onClick={onToggleRestriction}
            className={`p-2 rounded-xl transition-all duration-200 ${isRestricted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title={isRestricted ? "Unlock Chat" : "Lock Chat"}
          >
            {isRestricted ? <Lock size={18} /> : <Unlock size={18} />}
          </button>
        )}
        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
}