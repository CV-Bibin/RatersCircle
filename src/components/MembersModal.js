import React from 'react';

import { 
 X, Trash2, User, Clock, Shield, ShieldCheck, AlertCircle, Crown, Briefcase, Star, 
  Laptop, Monitor, Mouse, Gamepad2, Book, Stamp, Keyboard, Headphones, Coffee, 
  FileText, ClipboardList, Flag, Compass, Megaphone, Trophy, Lightbulb, Zap, 
  Target, Dumbbell, GraduationCap, Gavel
} from 'lucide-react';

import { database } from '../firebase';
import { ref, remove } from 'firebase/database';
import { getUserLevel } from '../utils/LevelSystem'; 


// --- HELPER: GET RANDOM ICON FOR LEADERS ---
const getLeaderIcon = (uid) => {
    // Strictly the 10 icons you requested:
    const icons = [
        <Flag size={14} />,          // Flag
        <Compass size={14} />,       // Compass
        <Megaphone size={14} />,     // Megaphone
        <Trophy size={14} />,        // Trophy
        <Lightbulb size={14} />,     // Lightbulb
        <Zap size={14} />,           // Zap
        <Target size={14} />,        // Target
        <Dumbbell size={14} />,      // Dumbbell
        <GraduationCap size={14} />, // Graduation Cap
        <Gavel size={14} />          // Gavel
    ];
    
    if (!uid) return icons[0];
    const index = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % icons.length;
    return icons[index];
};



// --- SMART ROLE STYLING ---
// --- 1. HELPER: GET RANDOM ICON FOR RATERS ---
const getRaterIcon = (uid) => {
    // Specific "Object" icons for Raters:
    const icons = [
        <Laptop size={14} />,        // Laptop
        <Monitor size={14} />,       // PC
        <Mouse size={14} />,         // Mouse
        <Gamepad2 size={14} />,      // Joystick
        <Book size={14} />,          // Book
        <Stamp size={14} />,         // Stamp
        <Briefcase size={14} />,     // Briefcase
        <Keyboard size={14} />,      // Keyboard
        <Headphones size={14} />,    // Headphones
        <Coffee size={14} />,        // Coffee
        <FileText size={14} />,      // File
        <ClipboardList size={14} />  // Clipboard
    ];
    
    // Deterministic Logic: 
    // Uses UID to pick a consistent icon (User X always gets Icon Y)
    // If uid is missing/undefined, default to index 0
    if (!uid) return icons[0];
    const index = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % icons.length;
    
    return icons[index];
};

// --- 2. UPDATED ROLE STYLE LOGIC ---
// ✅ Now accepts 'uid' as the 3rd argument
const getRoleStyle = (role, status, uid) => {
  // If user is inactive, show Red Alert
  if (status !== 'active' && status !== undefined) {
    return { bg: 'bg-red-500', text: 'text-white', icon: <AlertCircle size={14} /> };
  }
  
  switch(role) {
    case 'admin': 
      return { bg: 'bg-black', text: 'text-white', icon: <ShieldCheck size={14} /> };
    case 'assistant_admin': 
      return { bg: 'bg-yellow-400', text: 'text-black', icon: <Shield size={14} /> };
    case 'co_admin': 
      return { bg: 'bg-amber-900', text: 'text-white', icon: <Crown size={14} /> };
   // ✅ LEADER: Uses random leader icons
    case 'leader': 
      return { bg: 'bg-purple-600', text: 'text-white', icon: getLeaderIcon(uid) };
    case 'group_leader':
      return { bg: 'bg-orange-600', text: 'text-white', icon: <Briefcase size={14} /> };
    
    // ✅ RATER: Uses the helper to get a specific object icon
    case 'rater': 
      return { bg: 'bg-green-500', text: 'text-white', icon: getRaterIcon(uid) };
      
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
            let profile = userProfiles[uid] || {};
            const isMe = uid === currentUser.uid;
            
            // Fix: Ensure we use the latest XP for "Me"
            if (isMe && userData) {
                profile = { ...profile, ...userData };
            }

            const name = profile.displayName || profile.email?.split('@')[0] || "Unknown";
            const role = profile.role || "member";
            
            const userLevel = getUserLevel(profile.xp || 0);
            const roleTheme = getRoleStyle(role, profile.status);

            // ✅ 2. CALCULATE STARS (Same logic as Chat)
            const xp = Number(profile.xp || 0);
            let starCount = 0;
            if (role === 'rater') {
                if (xp >= 2500) starCount = 3;      
                else if (xp >= 1000) starCount = 2; 
                else if (xp >= 500) starCount = 1;  
            }

            const targetRoleLevel = getRoleLevel(role);
            const canRemove = isManager && !isMe && (myRoleLevel > targetRoleLevel);

            return (
              <div key={uid} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition">
                <div className="flex items-center gap-3">
                  
                  {/* Avatar Container */}
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors duration-300
                      ${roleTheme.bg} ${roleTheme.text}`}>
                      {roleTheme.icon}
                    </div>

                    {/* ✅ 3. SHOW STARS ON TOP OF AVATAR */}
                    {starCount > 0 && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-[1px] z-20">
                        {[...Array(starCount)].map((_, i) => (
                           <Star key={i} size={8} className="text-[#ECAB31] fill-[#ECAB31] drop-shadow-[0_0_1.2px_rgba(240,250,250,0.8)]" />
                        ))}
                      </div>
                    )}
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