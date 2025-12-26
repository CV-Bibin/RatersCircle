import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Briefcase, Key } from 'lucide-react';
import { database, auth } from '../firebase';
import { ref, onValue, update, remove, push, set } from 'firebase/database';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function KnowledgeBase({ userData }) {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [groupRequests, setGroupRequests] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // High-Level Admins can approve
  const canApprove = ['admin', 'assistant_admin', 'co_admin'].includes(userData?.role);

  useEffect(() => {
    if (!canApprove) return;

    // 1. Pending Users
    const unsubUsers = onValue(ref(database, 'users'), (snap) => {
      const data = snap.val();
      setPendingUsers(data ? Object.entries(data).map(([k,v]) => ({id:k, ...v})).filter(u => u.status === 'pending') : []);
    });

    // 2. Group Requests
    const unsubGroups = onValue(ref(database, 'group_requests'), (snap) => {
      const data = snap.val();
      setGroupRequests(data ? Object.entries(data).map(([k,v]) => ({id:k, ...v})) : []);
    });

    // 3. Password Reset Requests
    const unsubResets = onValue(ref(database, 'password_reset_requests'), (snap) => {
      const data = snap.val();
      setResetRequests(data ? Object.entries(data).map(([k,v]) => ({id:k, ...v})) : []);
    });

    return () => { unsubUsers(); unsubGroups(); unsubResets(); };
  }, [canApprove]);

  // --- ACTIONS ---

  const approveUser = (uid) => update(ref(database, `users/${uid}`), { status: 'active', role: 'rater' });
  const rejectUser = (uid) => update(ref(database, `users/${uid}`), { status: 'rejected' });

  const approveGroup = async (req) => {
    const newGroupRef = push(ref(database, 'groups'));
    await set(newGroupRef, { name: req.name, createdBy: req.requesterEmail, createdAt: Date.now(), members: { [req.requestedBy]: true } });
    await remove(ref(database, `group_requests/${req.id}`));
  };
  const rejectGroup = (id) => remove(ref(database, `group_requests/${id}`));

  // NEW: Approve Password Reset
  const approveReset = async (req) => {
    try {
      // Send the actual reset email from Firebase
      await sendPasswordResetEmail(auth, req.email);
      // Remove the request from DB
      await remove(ref(database, `password_reset_requests/${req.id}`));
      alert(`Reset link sent to ${req.email}`);
    } catch (error) {
      alert("Error sending email: " + error.message);
    }
  };
  
  const rejectReset = (id) => remove(ref(database, `password_reset_requests/${id}`));

  const totalNotifications = pendingUsers.length + groupRequests.length + resetRequests.length;

  return (
    <div className="bg-white h-full rounded-3xl shadow-lg flex flex-col p-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h3 className="font-bold text-xl text-gray-800">Resources</h3>
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className={`relative p-2 rounded-full transition ${showNotifications ? 'bg-blue-100' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <Bell size={20} className={showNotifications ? 'text-blue-600' : 'text-gray-600'} />
          {totalNotifications > 0 && canApprove && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {totalNotifications}
            </span>
          )}
        </button>
      </div>

      {showNotifications && canApprove ? (
        <div className="flex-1 overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
          
          {/* 1. User Approvals */}
          {pendingUsers.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">New Users</h4>
              <div className="space-y-2">
                {pendingUsers.map(u => (
                  <div key={u.id} className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={14} className="text-blue-600"/>
                      <span className="text-sm font-bold truncate">{u.email}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>approveUser(u.id)} className="flex-1 bg-green-500 text-white text-[10px] py-1.5 rounded font-bold">Approve</button>
                      <button onClick={()=>rejectUser(u.id)} className="flex-1 bg-white border border-gray-200 text-red-500 text-[10px] py-1.5 rounded font-bold">Deny</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Group Requests */}
          {groupRequests.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">Group Requests</h4>
              <div className="space-y-2">
                {groupRequests.map(req => (
                  <div key={req.id} className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase size={14} className="text-orange-600"/>
                      <span className="text-sm font-bold truncate">{req.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>approveGroup(req)} className="flex-1 bg-green-500 text-white text-[10px] py-1.5 rounded font-bold">Create</button>
                      <button onClick={()=>rejectGroup(req.id)} className="flex-1 bg-white border border-gray-200 text-red-500 text-[10px] py-1.5 rounded font-bold">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Password Reset Requests */}
          {resetRequests.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">Password Resets</h4>
              <div className="space-y-2">
                {resetRequests.map(req => (
                  <div key={req.id} className="bg-red-50 p-3 rounded-xl border border-red-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Key size={14} className="text-red-600"/>
                      <span className="text-sm font-bold truncate">{req.email}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>approveReset(req)} className="flex-1 bg-red-500 text-white text-[10px] py-1.5 rounded font-bold">Send Link</button>
                      <button onClick={()=>rejectReset(req.id)} className="flex-1 bg-white border border-gray-200 text-gray-500 text-[10px] py-1.5 rounded font-bold">Ignore</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalNotifications === 0 && <p className="text-center text-gray-400 text-sm mt-4">All caught up!</p>}
        </div>
      ) : (
        /* Standard Knowledge Base */
        <div className="flex-1">
          <div className="mb-6">
             <label className="text-xs font-bold text-gray-400 mb-2 block uppercase">Search</label>
             <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
               <Search size={18} className="text-gray-400" />
               <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm ml-2 w-full" />
             </div>
          </div>
          <div className="space-y-3">
             <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer">
               <div className="p-2 bg-purple-100 text-purple-500 rounded-lg"><span className="font-bold text-xs">DOC</span></div>
               <p className="text-sm font-medium text-gray-700">Guidelines 2025</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}