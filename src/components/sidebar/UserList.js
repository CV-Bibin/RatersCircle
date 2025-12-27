import React from 'react';
import { getRoleStyle } from '../../utils/roleUtils';

export default function UserList({ users, title, currentUserRole, userStatuses }) {
  
  // --- VISIBILITY HELPER ---
  const getStatusDisplay = (userId, targetRole) => {
    const userStatus = userStatuses[userId]; 
    const isOffline = !userStatus || userStatus.state === 'offline';
    
    // 1. Identification
    const isTargetMainAdmin = targetRole === 'admin';
    const amIMainAdmin = currentUserRole === 'admin';
    const amIAuthorizedViewer = ['admin', 'co_admin', 'assistant_admin'].includes(currentUserRole);

    // --- RULE: PRIVACY SHIELD FOR MAIN ADMIN ---
    // Co-Admins and Assistant Admins CANNOT see status/last seen of the Main Admin
    if (isTargetMainAdmin && !amIMainAdmin) {
      return <span className="text-[10px] text-gray-300">Always Online</span>; 
    }

    // RULE B: Admins can choose to HIDE themselves (if your system supports isHidden)
    if (userStatus?.isHidden && !amIMainAdmin) {
       return null;
    }

    // --- RENDER ONLINE STATUS ---
    if (!isOffline) {
      return <span className="text-[10px] font-bold text-green-500">● Online</span>;
    }

    // --- RULE C: "Last Seen" logic ---
    // Only Authorized viewers can see "Last Seen" for non-Main Admin users
    if (amIAuthorizedViewer && userStatus?.last_changed) {
      const date = new Date(userStatus.last_changed);
      return (
        <span className="text-[10px] text-gray-400">
            Last seen: {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </span>
      );
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
          
          // Helper for Green Dot logic
          const isTargetMainAdmin = u.role === 'admin';
          const amIMainAdmin = currentUserRole === 'admin';

          return (
            <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm relative ${style.bg} ${style.text}`}>
                {u.email[0]?.toUpperCase()}
                
                {/* Green Dot Logic */}
                {userStatuses[u.id]?.state === 'online' && (
                   /* Show dot ONLY IF:
                      1. Target is NOT the Main Admin
                      2. OR the Viewer IS the Main Admin
                   */
                   (!isTargetMainAdmin || amIMainAdmin) ? (
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