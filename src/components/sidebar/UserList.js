import React from 'react';
import { getRoleStyle } from '../../utils/roleUtils';

export default function UserList({ users, title, currentUserRole, userStatuses }) {
  
  // --- VISIBILITY HELPER ---
  const getStatusDisplay = (userId, targetRole) => {
    const userStatus = userStatuses[userId]; // Use prop instead of state
    const isOffline = !userStatus || userStatus.state === 'offline';
    
    // 1. Is the target an Admin or Asst Admin?
    const isTargetHighAdmin = targetRole === 'admin' || targetRole === 'assistant_admin';
    // 2. Am I (the viewer) a High Admin?
    const amIHighAdmin = currentUserRole === 'admin' || currentUserRole === 'assistant_admin';

    // RULE A: Raters/Co-Admins/Leaders CANNOT see status of Main Admins
    if (isTargetHighAdmin && !amIHighAdmin) {
      return null; 
    }

    // RULE B: Admins can choose to HIDE themselves
    if (userStatus?.isHidden && !amIHighAdmin) {
       return null;
    }

    // --- RENDER ---
    if (!isOffline) {
      return <span className="text-[10px] font-bold text-green-500">● Online</span>;
    }

    // RULE C: "Last Seen" logic
    if (amIHighAdmin && userStatus?.last_changed) {
      const date = new Date(userStatus.last_changed);
      return <span className="text-[10px] text-gray-400">Last seen: {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>;
    }

    return <span className="text-[10px] text-gray-300">Offline</span>;
  };

  if (!users || users.length === 0) return null;

  return (
    <div className="pt-4 border-t border-gray-100">
      <h4 className="text-xs font-bold text-gray-400 mb-3 px-2 uppercase tracking-wide">{title}</h4>
      <div className="space-y-2">
        {users.map((u) => {
          const style = getRoleStyle(u.role, u.status);
          return (
            <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm relative ${style.bg} ${style.text}`}>
                {u.email[0]?.toUpperCase()}
                
                {/* Green Dot */}
                {userStatuses[u.id]?.state === 'online' && (
                   (currentUserRole === 'admin' || currentUserRole === 'assistant_admin' || (u.role !== 'admin' && u.role !== 'assistant_admin')) ? (
                     <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                   ) : null
                )}
              </div>
              
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-gray-700 truncate">{u.email}</p>
                <div className="flex items-center justify-between mt-1">
                   <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${style.bg} ${style.text}`}>
                     {u.status === 'active' ? style.label : 'Inactive'}
                   </span>
                   {getStatusDisplay(u.id, u.role)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}