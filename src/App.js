import React, { useState, useEffect } from 'react';
import SidebarLeft from './components/SidebarLeft';
import ChatWindow from './components/ChatWindow';
import KnowledgeBase from './components/KnowledgeBase';
import Login from './components/Login';
import Signup from './components/Signup';
import AdminPanel from './components/AdminPanel';
import { auth, database } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import usePresence from './hooks/usePresence'; // Import the new hook

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); // Stores role/status
  const [activeGroup, setActiveGroup] = useState(null);
  const [view, setView] = useState('login'); // 'login' or 'signup'
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // ACTIVATE ONLINE PRESENCE
  // This hook automatically handles online/offline status in Firebase
  usePresence(user, userData);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch extra user details (role, status)
        const snapshot = await get(ref(database, 'users/' + currentUser.uid));
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Only allow login if status is 'active'
          if (data.status === 'active') {
            setUser(currentUser);
            setUserData(data);
          } else {
            // Block pending users even if Auth thinks they are logged in
            setUser(null);
            setUserData(null);
          }
        }
      } else {
        setUser(null);
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 1. Show Login or Signup if no user is authenticated/active
  if (!user) {
    return view === 'login' 
      ? <Login switchToSignup={() => setView('signup')} />
      : <Signup switchToLogin={() => setView('login')} />;
  }

  // 2. Main Dashboard
  return (
   <div className="h-screen w-full bg-[#F3F4F6] p-4 md:p-6 flex gap-4 md:gap-6 overflow-hidden font-sans relative">
      
      {/* Admin Button (Only visible to Admin) */}
      {userData?.role === 'admin' && (
        <button 
          onClick={() => setShowAdminPanel(true)}
          className="absolute bottom-6 left-6 z-50 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold hover:bg-black transition"
        >
          Admin Tools
        </button>
      )}

      {/* Admin Panel Overlay */}
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}

      {/* LEFT COLUMN: Groups & Profile */}
      <div className="w-1/4 h-full hidden md:block">
        <SidebarLeft 
          onSelectGroup={setActiveGroup} 
          user={user} 
          userData={userData} 
        />
      </div>

      {/* CENTER COLUMN */}
      <div className="w-full md:w-1/2 h-full">
        <ChatWindow 
          activeGroup={activeGroup} 
          currentUser={user}       // Pass the full user object
          userData={userData}      // Pass the role data
        />
      </div>

      {/* RIGHT COLUMN: Knowledge Base & Notifications */}
      <div className="w-1/4 h-full hidden lg:block">
        {/* CRITICAL: Passing userData here so the Bell works! */}
        <KnowledgeBase userData={userData} />
      </div>
    </div>
  );
}

export default App;