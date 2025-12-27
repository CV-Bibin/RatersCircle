import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Hash } from 'lucide-react';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';

import SidebarHeader from './sidebar/SidebarHeader';
import GroupList from './sidebar/GroupList';
import UserList from './sidebar/UserList';
import CreateGroupModal from './sidebar/CreateGroupModal';
import AddMemberModal from './sidebar/AddMemberModal';
import ChangePasswordModal from './sidebar/ChangePasswordModal';

export default function SidebarLeft({ onSelectGroup, user, userData }) {
  // --- Data State ---
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [visibleUsers, setVisibleUsers] = useState([]); 
  const [userStatuses, setUserStatuses] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastViewedTimes, setLastViewedTimes] = useState({});
  const [activeGroupId, setActiveGroupId] = useState(null);

  // --- UI State ---
  const [searchTerm, setSearchTerm] = useState("");
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
  
  // 1. UPDATE: Separated "Management" from "Viewing"
  // Leaders can VIEW the directory, but CANNOT add members or create groups.
  const canManageGroups = isAdmin || isAssistantAdmin || isCoAdmin; 
  
  // Leaders can still see the User List (Directory)
  const canSeeUserList = isAdmin || isAssistantAdmin || isCoAdmin || isLeader;

  // Raters see NOTHING (Neither manage groups nor see user list)
  const canSeeAllGroups = isAdmin || isAssistantAdmin;

  // --- 1. Fetch Groups & Last Viewed Data ---
  useEffect(() => {
    if (!user) return;
    const groupsRef = ref(database, 'groups');
    const viewedRef = ref(database, `users/${user.uid}/lastViewed`);

    const unsubGroups = onValue(groupsRef, (snapshot) => {
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

    const unsubViewed = onValue(viewedRef, (snapshot) => {
      setLastViewedTimes(snapshot.val() || {});
    });

    return () => { unsubGroups(); unsubViewed(); };
  }, [user, canSeeAllGroups]);

  // --- 2. Calculate Unread Counts ---
  useEffect(() => {
    if (!groups.length || !user) return;
    const unsubscribers = [];
    groups.forEach(group => {
        const msgsRef = ref(database, `groups/${group.id}/messages`);
        const unsub = onValue(msgsRef, (snapshot) => {
            const messages = snapshot.val();
            if (!messages) {
                setUnreadCounts(prev => ({ ...prev, [group.id]: 0 }));
                return;
            }
            const lastViewed = lastViewedTimes[group.id] || 0;
            const count = Object.values(messages).filter(m => 
                m.createdAt > lastViewed && m.senderId !== user.uid
            ).length;
            setUnreadCounts(prev => ({ ...prev, [group.id]: count }));
        });
        unsubscribers.push(unsub);
    });
    return () => unsubscribers.forEach(fn => fn());
  }, [groups, lastViewedTimes, user]);

  // --- 3. Fetch Users ---
  useEffect(() => {
    if (!canSeeUserList) return; // Raters will stop here
    const usersRef = ref(database, 'users');
    return onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      setAllUsers(data ? Object.entries(data).map(([key, value]) => ({ id: key, ...value })) : []);
    });
  }, [canSeeUserList]);

  // --- 4. Fetch User Statuses ---
  useEffect(() => {
    const statusRef = ref(database, 'status');
    const unsubscribe = onValue(statusRef, (snapshot) => setUserStatuses(snapshot.val() || {}));
    return () => unsubscribe();
  }, []);

  // --- Filter Users Logic ---
  useEffect(() => {
    let filtered = [];
    if (isAdmin || isAssistantAdmin) {
      filtered = allUsers;
    } else if (canSeeUserList) {
      const memberIds = new Set();
      groups.forEach(g => { if (g.members) Object.keys(g.members).forEach(uid => memberIds.add(uid)); });
      filtered = allUsers.filter(u => memberIds.has(u.id));
    }
    if (searchTerm) {
        filtered = filtered.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setVisibleUsers(filtered);
  }, [allUsers, groups, isAdmin, isAssistantAdmin, canSeeUserList, searchTerm]);

  // Handle Group Click
  const handleGroupSelect = (group) => {
    setActiveGroupId(group.id);
    onSelectGroup(group);
  };

  const displayedGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- CALCULATE ONLINE STATS ---
  const totalUsers = visibleUsers.length;
  const onlineUsers = visibleUsers.filter(u => userStatuses[u.id]?.state === 'online').length;

  return (
    <div className="bg-white/80 backdrop-blur-md h-full rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-white/50">
      
      {/* Header & Search */}
      <SidebarHeader 
        user={user} 
        userData={userData} 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenPasswordModal={() => setShowPasswordModal(true)}
      />

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200">
        
        {/* New Group Button (Only for Admins/Co-Admins - Hidden for Leaders & Raters) */}
        {canManageGroups && (
          <div className="px-3 mt-4 mb-2">
            <button 
                onClick={() => setShowCreateGroupModal(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white p-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md transition-all active:scale-95 group"
            >
                <div className="bg-white/20 p-1 rounded-full group-hover:rotate-90 transition-transform">
                    <Plus size={16} /> 
                </div>
                <span className="text-sm">Create New Group</span>
            </button>
          </div>
        )}

        {/* Group List (Passes canManageGroups to control Add Member button) */}
        <GroupList 
            groups={displayedGroups}
            onSelectGroup={handleGroupSelect}
            activeGroupId={activeGroupId}
            userStatuses={userStatuses}
            unreadCounts={unreadCounts} 
            canManageGroups={canManageGroups} // Leaders are false here, so no "+" button
            onAddMemberClick={(group) => { setSelectedGroupForAdd(group); setShowAddMemberModal(true); }}
        />

        {/* Users Section (Hidden for Raters) */}
        {canSeeUserList && (
          <div>
             <div className="flex items-center justify-between px-4 mb-2 mt-6">
                <div className="flex items-center gap-2">
                    <Users size={14} className="text-gray-400" />
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {isAdmin || isAssistantAdmin ? "Directory" : "Members"}
                    </h3>
                </div>
                <div className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    <span className="text-green-500 font-bold">{onlineUsers}</span> Online / {totalUsers}
                </div>
            </div>
            
            <UserList 
                users={visibleUsers} 
                title="" 
                currentUserRole={userData?.role}
                userStatuses={userStatuses}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateGroupModal && <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} user={user} userData={userData} />}
      {showAddMemberModal && <AddMemberModal onClose={() => setShowAddMemberModal(false)} selectedGroup={selectedGroupForAdd} allUsers={allUsers} />}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
}