import React, { useState } from 'react';
import { push, ref, set } from 'firebase/database';
import { database } from '../../firebase';

export default function CreateGroupModal({ onClose, user, userData }) {
  const [newGroupName, setNewGroupName] = useState("");
  const [loading, setLoading] = useState(false);

  // Define who has "Instant Create" power
  const canCreateInstantly = ['admin', 'assistant_admin', 'co_admin'].includes(userData?.role);

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    setLoading(true);

    try {
      if (canCreateInstantly) {
        // Option A: Instant Creation (Admins)
        const newGroupRef = push(ref(database, 'groups'));
        await set(newGroupRef, {
          name: newGroupName,
          createdBy: user.email,
          createdAt: Date.now(),
          members: { [user.uid]: true }
        });
        alert("Group created successfully!");
      } else {
        // Option B: Request Creation (Leaders)
        const requestRef = push(ref(database, 'group_requests'));
        await set(requestRef, {
          name: newGroupName,
          requestedBy: user.uid,
          requesterEmail: user.email,
          createdAt: Date.now()
        });
        alert("Request sent to Admins for approval.");
      }
      setNewGroupName("");
      onClose();
    } catch (error) {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6">
      <h3 className="font-bold text-lg mb-4 text-gray-800">
        {canCreateInstantly ? "Create New Group" : "Request New Group"}
      </h3>
      <input 
        autoFocus
        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl mb-4 outline-none focus:border-blue-500 text-sm"
        placeholder="Group Name..."
        value={newGroupName}
        onChange={(e) => setNewGroupName(e.target.value)}
      />
      
      {!canCreateInstantly && (
        <p className="text-xs text-orange-600 mb-4 bg-orange-50 p-2 rounded-lg">
          Note: Your request must be approved by an Admin.
        </p>
      )}

      <div className="flex gap-2 w-full">
        <button onClick={onClose} className="flex-1 py-3 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-sm">Cancel</button>
        <button 
          onClick={handleCreate} 
          disabled={loading}
          className={`flex-1 py-3 text-white rounded-xl font-bold text-sm transition ${canCreateInstantly ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'}`}
        >
          {loading ? "Processing..." : (canCreateInstantly ? "Create Now" : "Send Request")}
        </button>
      </div>
    </div>
  );
}