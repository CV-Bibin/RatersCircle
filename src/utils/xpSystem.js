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

// ---------------------------------------------------------
// ✅ NEW FEATURE: Smart Message Handler
// Call this function whenever a user sends a message!
// ---------------------------------------------------------
export const handleMessageXP = async (userId) => {
  if (!userId) return;
  const userRef = ref(database, `users/${userId}`);
  const snapshot = await get(userRef);
  
  if (!snapshot.exists()) return;
  const data = snapshot.val();
  const now = Date.now();

  // 1. 🛡️ SPAM PROTECTION (Cooldown)
  // User must wait 60 seconds (60000ms) between XP gains
  const lastXpTime = data.lastXpTime || 0;
  if (now - lastXpTime < 60000) {
    // console.log("Spam protection: No XP given."); 
    return; // Stop here. Too fast!
  }

  // 2. 🔥 DAILY STREAK LOGIC
  const lastStreakDate = new Date(data.lastStreakDate || 0).toDateString();
  const today = new Date().toDateString();
  const yesterday = new Date(now - 86400000).toDateString(); // 86400000ms = 24 hours

  let currentStreak = data.streak || 0;
  let bonusXP = 0;

  // Only calculate streak if it's a new day
  if (lastStreakDate !== today) {
    if (lastStreakDate === yesterday) {
      // Logic: Active yesterday -> Streak increases!
      currentStreak += 1;
      // Bonus: 5 XP per day (Max 50 XP bonus)
      bonusXP = Math.min(currentStreak * 5, 50); 
    } else {
      // Logic: Missed a day -> Streak resets to 1
      currentStreak = 1;
      bonusXP = 5; // Small start bonus
    }
  }

  // 3. 💾 SAVE UPDATES
  await update(userRef, {
    lastXpTime: now,       // Reset cooldown
    lastStreakDate: now,   // Mark streak for today
    streak: currentStreak, // Save new streak count
    lastActive: now        // Update activity timer
  });

  // Give Base XP (10) + Any Streak Bonus
  addXP(userId, 10 + bonusXP);
};