import React from 'react';
import { Users, UserPlus } from 'lucide-react';

export default function GroupList({ 
  groups, 
  canSeeAllGroups, 
  canManageGroups, 
  onSelectGroup, 
  onAddMemberClick,
  userStatuses // New Prop
}) {
  return (
    <div>
      <h4 className="text-xs font-bold text-gray-400 mb-3 px-2 uppercase tracking-wide">
        {canSeeAllGroups ? "All Groups" : "Your Groups"}
      </h4>
      
      {groups.length === 0 && (
        <p className="text-xs text-gray-400 px-2 italic">No groups found.</p>
      )}

      {groups.map((group) => {
        const safeGroupName = group.name || "Unnamed Group"; 
        
        // --- CALCULATE ONLINE COUNT ---
        // 1. Get list of member IDs
        const memberIds = group.members ? Object.keys(group.members) : [];
        // 2. Count how many have state === 'online' in userStatuses
        const onlineCount = memberIds.filter(uid => userStatuses[uid]?.state === 'online').length;

        return (
          <div key={group.id} className="group flex items-center gap-2 mb-2">
            <div 
              onClick={() => onSelectGroup({ ...group, name: safeGroupName })} 
              className="flex-1 flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 cursor-pointer transition border border-transparent hover:border-blue-100"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                <Users size={18} />
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-sm text-gray-800 truncate">{safeGroupName}</h4>
                
                <div className="flex items-center gap-2">
                  {/* Total Members Count */}
                  {canManageGroups && (
                    <p className="text-[10px] text-gray-400 truncate">
                      {memberIds.length} members
                    </p>
                  )}
                  
                  {/* NEW: Online Count (Visible to EVERYONE) */}
                  {onlineCount > 0 && (
                    <p className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                      ● {onlineCount} active
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {canManageGroups && (
              <button 
                onClick={() => onAddMemberClick({ ...group, name: safeGroupName })}
                className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                <UserPlus size={16} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}