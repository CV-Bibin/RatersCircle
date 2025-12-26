import { database } from '../firebase';
import { ref, runTransaction, get, update } from 'firebase/database';

/**
 * Adds (or subtracts) XP safely.
 * @param {string} userId - User to update.
 * @param {number} amount - Positive to add, Negative to subtract.
 */
export const addXP = (userId, amount) => {
  if (!userId) return;

  const userXpRef = ref(database, `users/${userId}/xp`);

  runTransaction(userXpRef, (currentXp) => {
    const safeCurrent = currentXp || 0;
    const newXp = safeCurrent + amount;
    // Safety: Never let XP drop below 0
    return newXp < 0 ? 0 : newXp;
  }).catch((err) => {
    console.error("XP Transaction failed", err);
  });
};

export const getReactionXp = (reactorRole) => {
  const highTierRoles = ['admin', 'co_admin', 'leader', 'group_leader'];
  return highTierRoles.includes(reactorRole) ? 20 : 5;
};

export const checkInactivityPenalty = async (userId) => {
  if (!userId) return;
  const userRef = ref(database, `users/${userId}`);
  const snapshot = await get(userRef);
  
  if (!snapshot.exists()) return;
  const userData = snapshot.val();
  
  const lastActive = userData.lastActive || Date.now();
  const diffDays = Math.ceil(Math.abs(Date.now() - lastActive) / (1000 * 60 * 60 * 24)); 

  if (diffDays > 7) {
    addXP(userId, -10); // Penalty
    update(userRef, { lastActive: Date.now() }); // Reset timer
  } else {
    update(userRef, { lastActive: Date.now() });
  }
};