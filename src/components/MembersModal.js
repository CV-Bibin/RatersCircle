import React from 'react';
import { X, Trash2, User, Clock, Shield, ShieldCheck, AlertCircle, Crown, Briefcase } from 'lucide-react';
import { database } from '../firebase';
import { ref, remove } from 'firebase/database';
// 👇 Import your level system (Ensure the path is correct)
import { getUserLevel } from '../utils/LevelSystem'; 

// --- 1. SMART ROLE STYLING LOGIC ---
const getRoleStyle = (role, status) => {
  // If user is inactive, show Red Alert
  if (status !== 'active' && status !== undefined) {
    return { bg: 'bg-red-500', text: 'text-white', icon: <AlertCircle size={14} /> };
  }
  // Otherwise check role
  switch(role) {
    case 'admin': 
      return { bg: 'bg-black', text: 'text-white', icon: <ShieldCheck size={14} /> };
    case 'assistant_admin': 
      return { bg: 'bg-yellow-400', text: 'text-black', icon: <Crown size={14} /> };
    case 'co_admin': 
      return { bg: 'bg-amber-900', text: 'text-white', icon: <Crown size={14} /> };
    case 'leader': 
      return { bg: 'bg-purple-600', text: 'text-white', icon: <Shield size={14} /> };
    case 'group_leader':
      return { bg: 'bg-orange-600', text: 'text-white', icon: <Briefcase size={14} /> };
    case 'rater': 
      return { bg: 'bg-green-500', text: 'text-white', icon: <User size={14} /> };
    default: 
      return { bg: 'bg-gray-400', text: 'text-white', icon: <User size={14} /> }; // Default Gray
  }
};

export default function MembersModal({ activeGroup, isOpen, onClose, currentUser, userProfiles, isManager, userData }) {
  if (!isOpen || !activeGroup) return null;

  const memberIds = activeGroup.members ? Object.keys(activeGroup.members) : [];

  const getRoleLevel = (role) => {
    switch (role) {
      case 'admin': return 100;
      case 'co_admin': return 90;
      case 'assistant_admin': return 80;
      case 'leader': return 50;
      case 'group_leader': return 50;
      case 'rater': return 10;
      default: return 0; 
    }
  };

  const myRoleLevel = getRoleLevel(userData?.role);
  
  // Feature: Last Seen Permission Check
  const canSeeLastSeen = ['admin', 'co_admin', 'assistant_admin'].includes(userData?.role);

  const handleRemoveUser = async (userId) => {
    if (!window.confirm("Remove this user from the group?")) return;
    try {
      await remove(ref(database, `groups/${activeGroup.id}/members/${userId}`));
    } catch (error) {
      console.error("Error removing user:", error);
      alert("Failed to remove user.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <User size={18} /> Group Members ({memberIds.length})
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {memberIds.map(uid => {
            const profile = userProfiles[uid] || {};
            const name = profile.displayName || profile.email?.split('@')[0] || "Unknown";
            const role = profile.role || "member";
            const isMe = uid === currentUser.uid;
            
            // 1. Get Gradient Data
            const userLevel = getUserLevel(profile.xp || 0);

            // 2. Get Role Style (Color & Icon)
            const roleTheme = getRoleStyle(role, profile.status);

            const targetRoleLevel = getRoleLevel(role);
            const canRemove = isManager && !isMe && (myRoleLevel > targetRoleLevel);

            return (
              <div key={uid} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition">
                <div className="flex items-center gap-3">
                  
                  {/* ✅ THE UPGRADE: Dynamic Icon & Color based on Role */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors duration-300
                    ${roleTheme.bg} ${roleTheme.text}`}>
                    {roleTheme.icon}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800">{name} {isMe && "(You)"}</p>
                      
                      {/* Gradient Badge */}
                      <span 
                        className="text-[9px] px-1.5 py-0.5 rounded text-white font-bold shadow-sm"
                        style={{
                          background: `linear-gradient(90deg, ${userLevel.gradientStart}, ${userLevel.gradientEnd})`
                        }}
                      >
                        {userLevel.name}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">{role}</p>
                      
                      {/* Last Seen Logic (Preserved) */}
                      {canSeeLastSeen && profile.lastSeen && !isMe && (
                        <p className="text-[9px] text-blue-500 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          Last seen: {new Date(profile.lastSeen).toLocaleString([], { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {canRemove && (
                  <button 
                    onClick={() => handleRemoveUser(uid)}
                    className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                    title="Remove User"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}