import { useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';

export default function usePresence(user, userData) {
  useEffect(() => {
    if (!user || !userData) return;

    // 1. Reference to this user's status node
    const userStatusRef = ref(database, `status/${user.uid}`);
    
    // 2. Reference to Firebase's special connection detector
    const connectedRef = ref(database, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // We are connected!
        
        // A. Tell Firebase: "If I disconnect, set my status to offline"
        onDisconnect(userStatusRef).set({
          state: 'offline',
          last_changed: serverTimestamp(),
          role: userData.role, // Store role here for easier filtering
          isHidden: userData.isHidden || false // Persist hidden state
        }).then(() => {
          // B. Set my status to online NOW
          set(userStatusRef, {
            state: 'online',
            last_changed: serverTimestamp(),
            role: userData.role,
            isHidden: userData.isHidden || false,
            typingIn: null // Not typing anywhere yet
          });
        });
      }
    });

    return () => unsubscribe();
  }, [user, userData]);
}