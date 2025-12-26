import React from 'react';
import { X, Plus } from 'lucide-react';
import { update, ref } from 'firebase/database';
import { database } from '../../firebase';
import { getRoleStyle } from '../../utils/roleUtils';

export default function AddMemberModal({ onClose, selectedGroup, allUsers }) {
  
  const addUserToGroup = async (targetUserId) => {
    if (!selectedGroup) return;
    const updates = {};
    updates[`groups/${selectedGroup.id}/members/${targetUserId}`] = true;
    await update(ref(database), updates);
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom-10 duration-300">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div>
          <h3 className="font-bold text-gray-800">Add Members</h3>
          <p className="text-xs text-gray-500">To: <span className="text-blue-600 font-bold">{selectedGroup?.name}</span></p>
        </div>
        <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-500 shadow-sm hover:text-red-500">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {allUsers.filter(u => u.status === 'active').map((u) => {
          const isMember = selectedGroup?.members && selectedGroup.members[u.id];
          const style = getRoleStyle(u.role, u.status); 

          return (
            <button 
              key={u.id}
              disabled={isMember}
              onClick={() => addUserToGroup(u.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border transition ${
                isMember 
                  ? 'opacity-50 bg-gray-50 border-transparent cursor-default' 
                  : 'bg-white border-gray-100 hover:border-blue-500 hover:bg-blue-50 shadow-sm'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${style.bg} ${style.text}`}>
                {u.email[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-700">{u.email}</p>
                <p className="text-[10px] text-gray-400 capitalize flex items-center gap-1">
                   {style.label}
                </p>
              </div>
              {isMember ? <span className="text-[10px] font-bold text-green-500">Added</span> : <Plus size={16} className="text-blue-500"/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}