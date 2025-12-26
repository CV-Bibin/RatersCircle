import React from 'react';
import { LogOut, Key } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, database } from '../../firebase'; // Added database
import { ref, set, serverTimestamp } from 'firebase/database'; // Added Firebase functions
import { getRoleStyle } from '../../utils/roleUtils';

export default function UserProfileHeader({ user, userData, onChangePasswordClick }) {
  const myStyle = getRoleStyle(userData?.role, userData?.status);

  // --- NEW LOGOUT LOGIC ---
  const handleLogout = async () => {
    try {
      if (user?.uid) {
        // 1. Force status to OFFLINE immediately in Database
        const userStatusRef = ref(database, `status/${user.uid}`);
        await set(userStatusRef, {
          state: 'offline',
          last_changed: serverTimestamp(),
          role: userData?.role || 'user',
          isHidden: userData?.isHidden || false
        });
      }
      // 2. Then Sign Out from Auth
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-white z-10">
      {/* Avatar */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-md border-2 ${myStyle.bg} ${myStyle.text} ${myStyle.border}`}>
         {user?.email[0]?.toUpperCase()}
      </div>
      
      {/* Info */}
      <div className="flex-1 overflow-hidden">
        <h3 className="font-bold text-gray-800 truncate">{user?.email.split('@')[0]}</h3>
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 ${myStyle.bg} ${myStyle.text}`}>
          {myStyle.icon} {myStyle.label}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1">
        <button 
          onClick={onChangePasswordClick} 
          title="Change Password"
          className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-blue-500 rounded-full transition"
        >
          <Key size={16} />
        </button>
        
        {/* UPDATED LOGOUT BUTTON */}
        <button 
          onClick={handleLogout} 
          title="Logout"
          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}