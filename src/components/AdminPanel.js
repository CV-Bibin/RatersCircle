import React, { useEffect, useState } from 'react';
import { database, auth } from '../firebase';
import { ref, onValue, update } from 'firebase/database';
import { ShieldCheck, X } from 'lucide-react';

export default function AdminPanel({ onClose }) {
  const [users, setUsers] = useState([]);
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const userList = data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [];
      setUsers(userList);
    });
    return () => unsubscribe();
  }, []);

  const updateUser = (userId, updates) => {
    // Double check: Never allow updating self via this function
    if (userId === currentUserId) return;
    update(ref(database, 'users/' + userId), updates);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[80vh] rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="bg-black text-white p-2 rounded-lg">
               <ShieldCheck size={24} />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-gray-900">Admin Control Panel</h2>
               <p className="text-sm text-gray-500">Manage user roles and approvals</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-500 transition">
            <X size={20} />
          </button>
        </div>

        {/* User Table */}
        <div className="overflow-y-auto flex-1 border border-gray-100 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold sticky top-0 z-10">
              <tr>
                <th className="p-4 border-b border-gray-100">User Email</th>
                <th className="p-4 border-b border-gray-100">Role</th>
                <th className="p-4 border-b border-gray-100">Status</th>
                <th className="p-4 border-b border-gray-100">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {users.map((u) => {
                const isMe = u.id === currentUserId; // CHECK: Is this row ME?

                return (
                  <tr key={u.id} className={`hover:bg-gray-50 transition ${isMe ? 'bg-blue-50/50' : ''}`}>
                    
                    {/* 1. Email */}
                    <td className="p-4">
                      <p className="font-bold text-gray-800 text-sm">{u.email}</p>
                      <p className="text-xs text-gray-400 font-mono">{u.id.slice(0, 8)}...</p>
                    </td>

                    {/* 2. Role Selector */}
                    <td className="p-4">
                      {isMe ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-black text-white text-xs font-bold rounded-full">
                           <ShieldCheck size={12}/> SUPER ADMIN
                        </span>
                      ) : (
                        <select 
                          value={u.role} 
                          onChange={(e) => updateUser(u.id, { role: e.target.value })}
                          className="bg-gray-100 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 rounded-lg p-2 text-sm font-medium outline-none cursor-pointer"
                        >
                          <option value="rater">Rater (Green)</option>
                          <option value="leader">Leader (Purple)</option>
                          <option value="co_admin">Co-Admin (Gold)</option>
                          <option value="assistant_admin">Assistant Admin (Gold)</option>
                          <option value="admin">Admin (Black)</option>
                        </select>
                      )}
                    </td>

                    {/* 3. Status Badge */}
                    <td className="p-4">
                       {isMe ? (
                         <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">
                           ALWAYS ACTIVE
                         </span>
                       ) : (
                         <span className={`px-2 py-1 rounded text-xs font-bold ${
                           u.status === 'active' ? 'bg-green-100 text-green-700' : 
                           u.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                           'bg-red-100 text-red-700'
                         }`}>
                           {u.status?.toUpperCase()}
                         </span>
                       )}
                    </td>

                    {/* 4. Action Buttons */}
                    <td className="p-4">
                      {isMe ? (
                        <span className="text-xs text-gray-400 italic">Locked</span>
                      ) : (
                        <div className="flex gap-2">
                          {u.status === 'pending' && (
                            <button 
                              onClick={() => updateUser(u.id, { status: 'active', role: 'rater' })}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-sm transition"
                            >
                              Approve
                            </button>
                          )}
                          
                          {u.status === 'active' ? (
                            <button 
                              onClick={() => updateUser(u.id, { status: 'suspended' })}
                              className="border border-gray-200 hover:bg-red-50 hover:border-red-200 text-red-500 text-xs px-3 py-1.5 rounded-lg font-bold transition"
                            >
                              Suspend
                            </button>
                          ) : (
                            u.status !== 'pending' && (
                              <button 
                                onClick={() => updateUser(u.id, { status: 'active' })}
                                className="border border-gray-200 hover:bg-green-50 hover:border-green-200 text-green-600 text-xs px-3 py-1.5 rounded-lg font-bold transition"
                              >
                                Reactivate
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}