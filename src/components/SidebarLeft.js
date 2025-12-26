import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';

import UserProfileHeader from './sidebar/UserProfileHeader';
import GroupList from './sidebar/GroupList';
import UserList from './sidebar/UserList';
import CreateGroupModal from './sidebar/CreateGroupModal';
import AddMemberModal from './sidebar/AddMemberModal';
import ChangePasswordModal from './sidebar/ChangePasswordModal';

export default function SidebarLeft({ onSelectGroup, user, userData }) {
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [visibleUsers, setVisibleUsers] = useState([]); 
  const [userStatuses, setUserStatuses] = useState({}); // NEW STATE: Stores who is online
  
  // Modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedGroupForAdd, setSelectedGroupForAdd] = useState(null);

  // --- Permissions Logic ---
  const role = userData?.role;
  const isAdmin = role === 'admin';
  const isAssistantAdmin = role === 'assistant_admin';
  const isCoAdmin = role === 'co_admin';
  const isLeader = role === 'leader' || role === 'group_leader';
  
  const canManageGroups = isAdmin || isAssistantAdmin || isCoAdmin || isLeader;
  const canSeeAllGroups = isAdmin || isAssistantAdmin;
  const canSeeUserList = canManageGroups;

  // --- 1. Fetch Groups ---
  useEffect(() => {
    const groupsRef = ref(database, 'groups');
    return onValue(groupsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedGroups = Object.entries(data).map(([key, value]) => ({ id: key, ...value }));
        const validGroups = loadedGroups.filter(g => g.name && g.name.trim() !== "");
        
        const myGroups = validGroups.filter(g => {
          if (canSeeAllGroups) return true;
          return g.members && g.members[user.uid];
        });
        setGroups(myGroups);
      } else {
        setGroups([]);
      }
    });
  }, [user.uid, canSeeAllGroups]);

  // --- 2. Fetch Users (If allowed) ---
  useEffect(() => {
    if (!canSeeUserList) return;
    const usersRef = ref(database, 'users');
    return onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAllUsers(Object.entries(data).map(([key, value]) => ({ id: key, ...value })));
      } else {
        setAllUsers([]);
      }
    });
  }, [canSeeUserList]);

  // --- 3. NEW: Fetch User Statuses (Realtime Online/Offline) ---
  useEffect(() => {
    const statusRef = ref(database, 'status');
    const unsubscribe = onValue(statusRef, (snapshot) => {
      setUserStatuses(snapshot.val() || {});
    });
    return () => unsubscribe();
  }, []);

  // Filter Users Logic
  useEffect(() => {
    if (isAdmin || isAssistantAdmin) {
      setVisibleUsers(allUsers);
    } else if (canSeeUserList) {
      const memberIds = new Set();
      groups.forEach(g => {
        if (g.members) Object.keys(g.members).forEach(uid => memberIds.add(uid));
      });
      setVisibleUsers(allUsers.filter(u => memberIds.has(u.id)));
    } else {
      setVisibleUsers([]);
    }
  }, [allUsers, groups, isAdmin, isAssistantAdmin, canSeeUserList]);

  return (
    <div className="bg-white h-full rounded-3xl shadow-lg flex flex-col overflow-hidden relative">
      
      {/* Header */}
      <UserProfileHeader 
        user={user} 
        userData={userData} 
        onChangePasswordClick={() => setShowPasswordModal(true)} 
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        
        {/* Create Group */}
        {canManageGroups && (
          <button 
            onClick={() => setShowCreateGroupModal(true)}
            className="w-full bg-blue-50 text-blue-600 border border-blue-200 p-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-blue-600 hover:text-white transition group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" /> New Group
          </button>
        )}

        {/* Group List (Pass userStatuses) */}
        <GroupList 
          groups={groups} 
          canSeeAllGroups={canSeeAllGroups}
          canManageGroups={canManageGroups}
          onSelectGroup={onSelectGroup}
          userStatuses={userStatuses} // <--- PASS DATA HERE
          onAddMemberClick={(group) => { setSelectedGroupForAdd(group); setShowAddMemberModal(true); }}
        />

        {/* User List (Pass userStatuses) */}
        {canSeeUserList && (
          <UserList 
            users={visibleUsers} 
            title={isAdmin || isAssistantAdmin ? "All Users (Admin View)" : "My Group Members"} 
            currentUserRole={userData?.role}
            userStatuses={userStatuses} // <--- PASS DATA HERE
          />
        )}
      </div>

      {/* Modals */}
      {showCreateGroupModal && (
        <CreateGroupModal 
          onClose={() => setShowCreateGroupModal(false)} 
          user={user} 
          userData={userData}
        />
      )}

      {showAddMemberModal && (
        <AddMemberModal 
          onClose={() => setShowAddMemberModal(false)}
          selectedGroup={selectedGroupForAdd}
          allUsers={allUsers}
        />
      )}

      {showPasswordModal && (
        <ChangePasswordModal 
          onClose={() => setShowPasswordModal(false)} 
        />
      )}
    </div>
  );
}