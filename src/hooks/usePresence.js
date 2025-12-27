import { useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, onDisconnect, update, serverTimestamp } from 'firebase/database';

export default function usePresence(user, userData) {
  useEffect(() => {
    if (!user || !userData) return;

    // 1. Reference to the USER node (where your modal looks for data)
    const userProfileRef = ref(database, `users/${user.uid}`);
    
    // 2. Reference to the STATUS node (for online/offline state)
    const userStatusRef = ref(database, `status/${user.uid}`);
    
    const connectedRef = ref(database, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        
        // A. When I disconnect:
        // Update 'status' to offline AND update 'users' with the final lastSeen time
        onDisconnect(userStatusRef).update({
          state: 'offline',
          last_changed: serverTimestamp(),
        });

        onDisconnect(userProfileRef).update({
          lastSeen: serverTimestamp(), // This updates the time when you close the app
        });

        // B. When I am online:
        update(userStatusRef, {
          state: 'online',
          last_changed: serverTimestamp(),
          role: userData.role,
        });

        // Keep the user profile lastSeen updated
        update(userProfileRef, {
          lastSeen: serverTimestamp(),
        });
      }
    });

    return () => unsubscribe();
  }, [user, userData]);
}